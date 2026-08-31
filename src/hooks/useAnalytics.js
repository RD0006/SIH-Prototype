/**
 * The analytics loop.
 *
 * Grabs frames from a playing <video>, runs detection, feeds the results
 * through the tracker, tests every confirmed track against the camera's virtual
 * fences, scores whatever crosses one, and raises an incident with a snapshot
 * attached.
 *
 * Three decisions worth explaining:
 *
 *   Inference is serialised, never queued. The next frame is grabbed only once
 *   the previous one finishes. Queueing would build an unbounded backlog and
 *   the overlay would drift further behind the video every second.
 *
 *   Darkness is measured, not assumed. Mean luminance of the sampled frame
 *   decides whether the "hours of darkness" weighting applies, so pointing the
 *   console at a night feed genuinely changes the score.
 *
 *   If the engine will not load, the loop switches to the replay source and
 *   keeps running. Every downstream stage is identical, so a fallback demo
 *   exercises the same tracker, fence and scoring code as a live one.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createTracker } from "../lib/analytics/tracker";
import { scoreThreat } from "../lib/analytics/threat";
import { BENIGN, DOMAIN } from "../lib/analytics/classes";
import { createReplaySource } from "../lib/detection/fallback";
import { enhanceFrame } from "../lib/detection/enhance";
import { supportsAnpr } from "../lib/analytics/classes";
import { STATUS } from "../lib/detection/status";
import { useSystem } from "../context/systemStore";

/** Frame is downscaled before inference — the model resizes anyway. */
const SAMPLE_WIDTH = 480;

export function useAnalytics({
  videoRef,
  camera,
  zones,
  running,
  quality,
  enhance = true,
  anpr = true,
}) {
  const { raiseIncident, setEngine, recordDetections } = useSystem();

  const [tracks, setTracks] = useState([]);
  const [telemetry, setTelemetry] = useState({
    latency: null,
    fps: null,
    night: false,
    frames: 0,
    simulated: false,
    luminance: null,
    gamma: 1,
    enhanced: false,
  });

  const trackerRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const replayRef = useRef(null);
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const statsRef = useRef({ times: [], frames: 0 });

  // Latest values, read inside the loop without re-subscribing it.
  const zonesRef = useRef(zones);
  const cameraRef = useRef(camera);
  const enhanceRef = useRef(enhance);
  const anprRef = useRef(anpr);

  // The ALPR engine keeps its own per-vehicle evidence across frames.
  const alprRef = useRef(null);
  const alprSessionRef = useRef(null);
  const alprBusyRef = useRef(false);

  const [plates, setPlates] = useState({
    results: [],
    telemetry: null,
    last: null,
  });

  zonesRef.current = zones;
  cameraRef.current = camera;
  enhanceRef.current = enhance;
  anprRef.current = anpr;

  if (!trackerRef.current) {
    trackerRef.current = createTracker();
  }

  const capture = useCallback((video) => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    const ratio = video.videoHeight / video.videoWidth || 0.5625;

    canvas.width = SAMPLE_WIDTH;
    canvas.height = Math.round(SAMPLE_WIDTH * ratio);

    const context = canvas.getContext("2d", { willReadFrequently: true });

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas;
  }, []);

  const snapshot = useCallback((canvas) => {
    try {
      return canvas.toDataURL("image/jpeg", 0.72);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!running) {
      activeRef.current = false;

      return undefined;
    }

    let cancelled = false;

    activeRef.current = true;

    async function start() {
      // Try the real engine first; fall back rather than fail.
      if (!engineRef.current && !replayRef.current) {
        setEngine({
          status: STATUS.LOADING,
          stage: "Starting detection engine",
          progress: 0.05,
          error: null,
        });

        try {
          const module = await import("../lib/detection/engine");

          await module.loadEngine({
            quality,
            onProgress: ({ stage, ratio }) => {
              if (!cancelled) {
                setEngine({ stage, progress: ratio });
              }
            },
          });

          if (cancelled) {
            return;
          }

          engineRef.current = module;

          // The ALPR engine is a separate pair of models. A failure to load it
          // disables plate reading only; detection and fences carry on.
          try {
            const alpr = await import("../lib/alpr");

            alprRef.current = await alpr.loadModels();
            alprSessionRef.current = alpr.createAlprSession();
          } catch (alprError) {
            console.error("[alpr] models unavailable:", alprError);
          }

          setEngine({
            status: STATUS.READY,
            stage: "Live inference",
            progress: 1,
            simulated: false,
            quality,
            error: null,
          });
        } catch (error) {
          if (cancelled) {
            return;
          }

          // Surface the reason. A silent fallback is how a demo ends up
          // showing simulated output while everyone believes it is live.
          console.error("[detection] engine unavailable, falling back:", error);

          replayRef.current = createReplaySource(cameraRef.current.id);

          setEngine({
            status: STATUS.FALLBACK,
            stage: "Replay — engine unavailable",
            progress: 1,
            simulated: true,
            error: error?.message ?? String(error),
          });
        }
      }

      // The engine is loaded once and reused, so a preset change after that
      // has to be pushed into the live processor — reloading would throw away
      // a warm session for a setting that is only an input resolution.
      if (engineRef.current) {
        engineRef.current.setQuality(quality);
        setEngine({ quality });
      }

      loop();
    }

    async function loop() {
      if (cancelled || !activeRef.current) {
        return;
      }

      const video = videoRef.current;

      if (!video || video.readyState < 2 || video.paused) {
        requestAnimationFrame(loop);

        return;
      }

      if (busyRef.current) {
        requestAnimationFrame(loop);

        return;
      }

      busyRef.current = true;

      try {
        const canvas = capture(video);

        // Measure the frame and lift it if it is too dark to detect reliably.
        // This happens before inference and only on the sampled copy.
        const light = enhanceFrame(canvas, enhanceRef.current);
        const { luminance, night } = light;

        let result;

        if (engineRef.current) {
          result = await engineRef.current.detectFrame(canvas, {
            threshold: 0.3,
          });
        } else {
          result = replayRef.current.detectAt(video.currentTime);
        }

        if (cancelled || !activeRef.current) {
          return;
        }

        const now = video.currentTime;

        // COCO knows 80 classes; a border post cares about four of them.
        // Traffic lights, chairs and potted plants are real detections and
        // entirely irrelevant here — dropping them before the tracker keeps
        // identities meaningful and the operator's screen readable.
        const relevant = result.detections.filter(
          (detection) => detection.domain !== DOMAIN.OTHER,
        );

        const { tracks: active } = trackerRef.current.update(relevant, now);

        setTracks(active);
        recordDetections(relevant.length);

        // Plate reading runs at most one at a time and never blocks detection.
        // It reads from the video element at native resolution: a plate is only
        // tens of pixels wide, so the downscaled frame the object detector uses
        // would have already thrown away the characters.
        if (anprRef.current && alprRef.current && !alprBusyRef.current) {
          const candidate = alprSessionRef.current.nextCandidate(
            active.filter((track) => supportsAnpr(track.domain, track.subtype)),
          );

          if (candidate) {
            alprBusyRef.current = true;

            alprSessionRef.current
              .processVehicle(alprRef.current, video, candidate)
              .then((outcome) => {
                if (cancelled) {
                  return;
                }

                // Surface refusals too — a stage that declined to read is as
                // informative as one that succeeded, and hiding it is how a
                // system starts looking more capable than it is.
                setPlates({
                  results: alprSessionRef.current.results(),
                  telemetry: alprSessionRef.current.telemetry(),
                  last: outcome,
                });
              })
              .catch(() => {})
              .finally(() => {
                alprBusyRef.current = false;
              });
          }
        }

        const events = trackerRef.current.evaluateZones(
          active,
          zonesRef.current,
          now,
        );

        for (const event of events) {
          if (BENIGN.has(event.track.domain)) {
            continue;
          }

          const assessment = scoreThreat({
            track: event.track,
            zone: event.zone,
            camera: cameraRef.current,
            peers: active,
            sightings: 1,
            dwell: event.dwell,
            night,
          });

          const plateEntry = alprSessionRef.current?.forTrack(event.track.id);

          raiseIncident({
            clock: formatClock(now),
            cameraId: cameraRef.current.id,
            zoneId: event.zone.id,
            title: titleFor(event, assessment),
            domain: event.track.domain,
            display: event.track.display,
            score: assessment.score,
            severity: assessment.severity,
            suppressed: assessment.suppressed,
            factors: assessment.factors,
            trackId: event.track.id,
            confidence: event.track.confidence,
            anpr: plateEntry?.result?.plate
              ? {
                  plate: plateEntry.result.plate,
                  confidence: plateEntry.result.confidence,
                  format: plateEntry.result.format,
                  conforms: plateEntry.result.conforms,
                  samples: plateEntry.result.samples,
                  repairs: plateEntry.result.repairs,
                  crop: plateEntry.result.bestCrop,
                }
              : undefined,
            evidence: {
              snapshot: snapshot(canvas),
              box: event.track.box,
              trail: [...event.track.trail],
              zone: event.zone,
              night,
              luminance: Math.round(luminance),
              gamma: light.gamma,
              enhanced: light.enhanced,
              videoTime: now,
            },
          });
        }

        // Rolling throughput over the last dozen inferences.
        const stats = statsRef.current;

        stats.frames += 1;
        stats.times = [...stats.times, performance.now()].slice(-12);

        const span =
          stats.times.length > 1
            ? (stats.times[stats.times.length - 1] - stats.times[0]) / 1000
            : 0;

        const latency = Math.round(result.latency);
        const fps = span > 0 ? (stats.times.length - 1) / span : null;

        // Publish throughput so System Status can report it too. Throttled to
        // every eighth inference: this writes to shared context and every
        // frame would re-render half the application.
        if (stats.frames % 8 === 0) {
          setEngine({ latency, fps });
        }

        setTelemetry({
          latency,
          fps,
          night,
          frames: stats.frames,
          simulated: !engineRef.current,
          luminance: Math.round(luminance),
          gamma: light.gamma,
          enhanced: light.enhanced,
        });
      } catch (error) {
        if (!cancelled) {
          setEngine({
            status: STATUS.ERROR,
            stage: "Inference failed",
            error: error?.message ?? String(error),
          });
        }
      } finally {
        busyRef.current = false;
      }

      requestAnimationFrame(loop);
    }

    start();

    return () => {
      cancelled = true;
      activeRef.current = false;
    };
  }, [
    running,
    quality,
    videoRef,
    capture,
    snapshot,
    raiseIncident,
    recordDetections,
    setEngine,
  ]);

  // Switching cameras invalidates every identity — a track cannot survive a
  // change of field of view.
  const resetTracks = useCallback(() => {
    trackerRef.current?.reset();
    statsRef.current = { times: [], frames: 0 };
    alprSessionRef.current?.reset();
    setTracks([]);
    setPlates({ results: [], telemetry: null, last: null });
  }, []);

  return { tracks, telemetry, plates, resetTracks };
}

function formatClock(seconds) {
  const base = 21 * 3600 + 47 * 60;
  const total = Math.floor(base + seconds);

  const hh = String(Math.floor(total / 3600) % 24).padStart(2, "0");
  const mm = String(Math.floor(total / 60) % 60).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

function titleFor(event, assessment) {
  const what = event.track.display;

  if (event.trigger === "dwell") {
    return `${what} loitering — ${event.zone.name}`;
  }

  if (event.zone.kind === "tripwire") {
    return `${what} crossed ${event.zone.name}`;
  }

  return assessment.severity === "high"
    ? `Unauthorised ${what.toLowerCase()} — ${event.zone.name}`
    : `${what} entered ${event.zone.name}`;
}
