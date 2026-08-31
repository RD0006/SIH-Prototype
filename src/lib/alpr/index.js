/**
 * ALPR engine — orchestration.
 *
 * The complete pipeline, in order, with every stage doing real work:
 *
 *   frame  →  plate detection  →  crop  →  quality gate
 *          →  recognition  →  format validation  →  temporal aggregation
 *          →  result
 *
 * Nothing here is scripted and no result is synthesised. If the pipeline cannot
 * read a plate it says so and explains which stage stopped it, which is the
 * behaviour a system gets judged on far more often than its best case.
 *
 * Per-vehicle state lives in an AlprSession so that readings accumulate against
 * a tracked identity across frames rather than being treated as independent
 * one-shot problems.
 */

import { loadModels, isLoaded, MODEL_MANIFEST } from "./models";
import { detectPlates } from "./detector";
import { recognisePlate } from "./recogniser";
import { aggregateReadings, describeCertainty } from "./aggregate";
import { VERDICT } from "./quality";

export { MODEL_MANIFEST, describeCertainty, isLoaded, loadModels };
export { SUPPORTED_FORMATS } from "./grammar";
export { VERDICT } from "./quality";

/** Readings kept per vehicle. Beyond this the extra evidence adds little. */
const MAX_OBSERVATIONS = 8;

export function createAlprSession() {
  /** trackId -> { observations, result, stats } */
  const vehicles = new Map();

  const stats = {
    framesProcessed: 0,
    platesDetected: 0,
    cropsRejected: 0,
    readsAccepted: 0,
    detectLatency: [],
    recogniseLatency: [],
  };

  /**
   * Run one frame for one tracked vehicle.
   *
   * @param {object} sessions loaded models
   * @param {HTMLVideoElement} video read at NATIVE resolution — the plate is
   *        only tens of pixels wide, so the downscaled detection frame used by
   *        the object detector would throw away exactly what matters here
   * @param {object} track the tracked vehicle, box normalised 0..1
   * @returns {Promise<object>} a stage-by-stage record of what happened
   */
  async function processVehicle(sessions, video, track) {
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      return { stage: "input", ok: false, reason: "Video has no dimensions yet." };
    }

    stats.framesProcessed += 1;

    // Search only inside the vehicle, not the whole frame: it is far cheaper
    // and it attributes the plate to the right vehicle by construction.
    const region = cropRegion(track.box, width, height);

    if (region.width < 64 || region.height < 32) {
      return {
        stage: "input",
        ok: false,
        reason: `Vehicle occupies only ${Math.round(region.width)}×${Math.round(region.height)}px — too distant to search.`,
      };
    }

    const canvas = document.createElement("canvas");

    canvas.width = region.width;
    canvas.height = region.height;

    canvas
      .getContext("2d", { willReadFrequently: true })
      .drawImage(
        video,
        region.x,
        region.y,
        region.width,
        region.height,
        0,
        0,
        region.width,
        region.height,
      );

    const detection = await detectPlates(
      sessions,
      canvas,
      region.width,
      region.height,
    );

    stats.detectLatency.push(detection.latency);

    if (detection.plates.length === 0) {
      return {
        stage: "detect",
        ok: false,
        reason: "No plate found on this vehicle in this frame.",
        latency: { detect: detection.latency },
      };
    }

    stats.platesDetected += 1;

    const box = detection.plates[0];
    const reading = await recognisePlate(
      sessions,
      canvas,
      box,
      region.width,
      region.height,
    );

    stats.recogniseLatency.push(reading.latency);

    if (reading.rejected) {
      stats.cropsRejected += 1;

      return {
        stage: "quality",
        ok: false,
        reason: reading.quality.reasons[0] ?? "Crop quality insufficient.",
        quality: reading.quality,
        box,
        latency: { detect: detection.latency, recognise: reading.latency },
      };
    }

    stats.readsAccepted += 1;

    const entry = vehicles.get(track.id) ?? {
      trackId: track.id,
      display: track.display,
      observations: [],
    };

    entry.observations = [...entry.observations, reading].slice(-MAX_OBSERVATIONS);
    entry.result = aggregateReadings(entry.observations);
    entry.display = track.display;

    vehicles.set(track.id, entry);

    return {
      stage: "complete",
      ok: true,
      trackId: track.id,
      box,
      reading,
      result: entry.result,
      latency: { detect: detection.latency, recognise: reading.latency },
    };
  }

  /**
   * Which vehicle to spend the next read on.
   *
   * Prefer vehicles with no confident answer yet, largest first — a nearer
   * vehicle has more plate pixels and is more likely to resolve. Once a plate
   * is read with high confidence, stop spending inference on it.
   */
  function nextCandidate(tracks) {
    const candidates = tracks.filter((track) => {
      const entry = vehicles.get(track.id);

      if (!entry) {
        return true;
      }

      if (entry.observations.length >= MAX_OBSERVATIONS) {
        return false;
      }

      const certainty = describeCertainty(entry.result);

      return certainty.level !== "high";
    });

    if (candidates.length === 0) {
      return null;
    }

    return candidates.sort(
      (a, b) =>
        (b.box.xmax - b.box.xmin) * (b.box.ymax - b.box.ymin) -
        (a.box.xmax - a.box.xmin) * (a.box.ymax - a.box.ymin),
    )[0];
  }

  /**
   * Vehicles with a reading, merged by registration.
   *
   * The object tracker occasionally loses a car behind an obstruction and
   * re-acquires it under a new id, which previously showed the same vehicle
   * twice in the console. A plate is an identity in a way a track id is not, so
   * tracks that resolve to the same registration are folded together and their
   * evidence pooled — which also strengthens the aggregate rather than
   * splitting it across two weaker ones.
   *
   * This is re-identification by registration, and it is the same mechanism
   * that would let one vehicle be followed between cameras.
   */
  function results() {
    const byPlate = new Map();

    for (const entry of vehicles.values()) {
      if (!entry.result?.plate) {
        continue;
      }

      const existing = byPlate.get(entry.result.plate);

      if (!existing) {
        byPlate.set(entry.result.plate, {
          ...entry,
          trackIds: [entry.trackId],
        });

        continue;
      }

      const observations = [...existing.observations, ...entry.observations];

      byPlate.set(entry.result.plate, {
        ...existing,
        trackIds: [...existing.trackIds, entry.trackId],
        observations,
        result: aggregateReadings(observations),
      });
    }

    return [...byPlate.values()];
  }

  function forTrack(trackId) {
    return vehicles.get(trackId) ?? null;
  }

  function telemetry() {
    const mean = (values) =>
      values.length === 0
        ? null
        : values.reduce((a, b) => a + b, 0) / values.length;

    return {
      framesProcessed: stats.framesProcessed,
      platesDetected: stats.platesDetected,
      cropsRejected: stats.cropsRejected,
      readsAccepted: stats.readsAccepted,
      meanDetectMs: mean(stats.detectLatency.slice(-40)),
      meanRecogniseMs: mean(stats.recogniseLatency.slice(-40)),
      vehiclesTracked: vehicles.size,
    };
  }

  function reset() {
    vehicles.clear();
    stats.framesProcessed = 0;
    stats.platesDetected = 0;
    stats.cropsRejected = 0;
    stats.readsAccepted = 0;
    stats.detectLatency = [];
    stats.recogniseLatency = [];
  }

  return { processVehicle, nextCandidate, results, forTrack, telemetry, reset };
}

/** Expand the vehicle box slightly — detectors clip, and plates sit at edges. */
function cropRegion(box, width, height) {
  const padX = (box.xmax - box.xmin) * 0.04;
  const padY = (box.ymax - box.ymin) * 0.04;

  const x = Math.max(0, (box.xmin - padX) * width);
  const y = Math.max(0, (box.ymin - padY) * height);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(
      Math.min(width - x, (box.xmax - box.xmin + padX * 2) * width),
    ),
    height: Math.round(
      Math.min(height - y, (box.ymax - box.ymin + padY * 2) * height),
    ),
  };
}

export { VERDICT as QUALITY_VERDICT };
