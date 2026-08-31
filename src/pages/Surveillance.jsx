/**
 * Live Surveillance — the analytics console.
 *
 * This is the page that makes the platform's claim concrete: an ordinary video
 * feed on the left, a real detection network running against it in this
 * browser, and the fences, identities and alerts it produces on the right.
 * Nothing here talks to a server and nothing here needs a smart camera.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Eye,
  EyeOff,
  Moon,
  Pause,
  Play,
  Route,
  ScanText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import EngineBadge from "../components/surveillance/EngineBadge";
import DetectionOverlay from "../components/surveillance/DetectionOverlay";
import PlatePanel from "../components/surveillance/PlatePanel";
import { useAnalytics } from "../hooks/useAnalytics";
import { useSystem } from "../context/systemStore";
import { cameras, defaultCameraId } from "../data/cameras";
import { getZonesForCamera } from "../data/zones";
import { QUALITY_PRESETS } from "../lib/detection/status";
import { DOMAIN_COLOR } from "../lib/analytics/classes";
import { describeSeverity } from "../lib/analytics/threat";

export default function Surveillance() {
  const videoRef = useRef(null);

  const { engine, incidents } = useSystem();

  const [cameraId, setCameraId] = useState(defaultCameraId);
  const [running, setRunning] = useState(false);
  const [quality, setQuality] = useState("balanced");
  const [enhance, setEnhance] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [anpr, setAnpr] = useState(true);

  const camera = useMemo(
    () => cameras.find((item) => item.id === cameraId),
    [cameraId],
  );

  const zones = useMemo(() => getZonesForCamera(cameraId), [cameraId]);

  const { tracks, telemetry, plates, resetTracks } = useAnalytics({
    videoRef,
    camera,
    zones,
    running,
    quality,
    enhance,
    anpr,
  });

  // A track cannot survive a change of field of view.
  useEffect(() => {
    resetTracks();
  }, [cameraId, resetTracks]);

  // Keep the element's playback in step with `running`. Swapping cameras
  // mounts a fresh <video> via the key, which starts paused — without this the
  // control would read "Pause analysis" over a stopped feed.
  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (running) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [running, cameraId]);

  const liveIncidents = useMemo(
    () => incidents.filter((incident) => incident.live).slice(0, 6),
    [incidents],
  );

  const offline = camera.status === "offline";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1600px]"
    >
      {/* Page heading */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
            Sector Alpha · {camera.id}
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            Live Surveillance
          </h1>

          <p className="mt-1.5 text-xs text-slate-600">
            {camera.model} · {camera.capabilities}
          </p>
        </div>

        <EngineBadge engine={engine} telemetry={telemetry} />
      </div>

      <div className="grid grid-cols-[15rem_1fr_20rem] gap-5">
        {/* Camera estate */}
        <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-3">
          <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Cameras
          </p>

          <div className="space-y-1">
            {cameras.map((item) => {
              const active = item.id === cameraId;

              return (
                <button
                  key={item.id}
                  onClick={() => setCameraId(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    active
                      ? "bg-slate-700/40 text-slate-100"
                      : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      item.status === "online"
                        ? "bg-emerald-400/80"
                        : item.status === "degraded"
                          ? "bg-amber-400/80"
                          : "bg-slate-700"
                    }`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs">{item.id}</span>

                    <span className="block truncate text-[10px] text-slate-600">
                      {item.type === "bop"
                        ? "Border Out Post"
                        : item.type === "road"
                          ? "Border Road"
                          : "Check Post"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed */}
        <div>
          <div className="relative overflow-hidden rounded-xl border border-slate-800/70 bg-black">
            {offline ? (
              <div className="flex aspect-video items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Feed unavailable</p>

                  <p className="mt-1 text-[10px] text-slate-700">
                    {camera.offlineReason}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  key={camera.feed}
                  src={camera.feed}
                  className="block aspect-video w-full object-cover"
                  muted
                  loop
                  playsInline
                />

                <DetectionOverlay
                  tracks={tracks}
                  zones={zones}
                  showZones={showZones}
                  showTrails={showTrails}
                />
              </>
            )}

            {/* Feed chrome */}
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
              <span className="rounded bg-black/60 px-2 py-1 text-[9px] tracking-wider text-slate-300">
                {camera.id} · {camera.resolution}
              </span>

              {telemetry.night && (
                <span className="flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[9px] tracking-wider text-sky-300">
                  <Moon size={9} />
                  NIGHT · LUM {telemetry.luminance}
                  {telemetry.enhanced && ` · ENHANCED γ${telemetry.gamma}`}
                </span>
              )}
            </div>

            <div className="pointer-events-none absolute right-3 top-3">
              <span className="rounded bg-black/60 px-2 py-1 text-[9px] tracking-wider text-slate-400">
                {tracks.length} TRACKED
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800/70 bg-[#171a1f] p-3">
            <button
              onClick={() => setRunning((value) => !value)}
              disabled={offline}
              className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running ? <Pause size={13} /> : <Play size={13} />}
              {running ? "Pause analysis" : "Start analysis"}
            </button>

            <Toggle
              active={enhance}
              onClick={() => setEnhance((value) => !value)}
              icon={Sparkles}
              label="Low-light boost"
            />

            <Toggle
              active={showZones}
              onClick={() => setShowZones((value) => !value)}
              icon={showZones ? Eye : EyeOff}
              label="Virtual fences"
            />

            <Toggle
              active={showTrails}
              onClick={() => setShowTrails((value) => !value)}
              icon={Route}
              label="Trails"
            />

            <Toggle
              active={anpr}
              onClick={() => setAnpr((value) => !value)}
              icon={ScanText}
              label="Plate reading"
            />

            <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-800/70 p-1">
              {QUALITY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setQuality(preset.id)}
                  title={preset.hint}
                  className={`rounded px-2.5 py-1.5 text-[10px] transition ${
                    quality === preset.id
                      ? "bg-slate-700/50 text-slate-200"
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          {/* Fences on this camera */}
          <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-4">
            <h3 className="text-xs font-medium text-slate-300">
              Virtual fences
            </h3>

            <p className="mt-1 text-[10px] text-slate-600">
              Defined in software — no sensors in the ground.
            </p>

            <div className="mt-3 space-y-2">
              {zones.length === 0 && (
                <p className="text-[10px] text-slate-700">
                  No fence configured on this camera.
                </p>
              )}

              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="rounded-lg border border-slate-800/60 bg-[#14171b] p-2.5"
                >
                  <p className="text-[11px] text-slate-300">{zone.name}</p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-600">
                    {zone.rule.trigger === "dwell"
                      ? `Alert after ${zone.rule.dwellSeconds}s inside`
                      : `Alert on ${zone.rule.trigger}`}
                    {" · "}
                    {zone.rule.classes.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <PlatePanel plates={plates} />

          {/* Live tracks */}
          <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-4">
            <h3 className="text-xs font-medium text-slate-300">
              Tracked objects
            </h3>

            <div className="mt-3 space-y-1.5">
              {tracks.length === 0 && (
                <p className="text-[10px] text-slate-700">
                  {running
                    ? "Waiting for detections…"
                    : "Start analysis to begin tracking."}
                </p>
              )}

              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-[#14171b] px-2.5 py-2"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: DOMAIN_COLOR[track.domain] }}
                  />

                  <span className="flex-1 truncate text-[11px] text-slate-300">
                    {track.id} · {track.display}
                  </span>

                  <span className="text-[10px] text-slate-600">
                    {(track.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts raised this session */}
          <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert size={13} className="text-slate-500" />

              <h3 className="text-xs font-medium text-slate-300">
                Raised this session
              </h3>
            </div>

            <div className="mt-3 space-y-1.5">
              {liveIncidents.length === 0 && (
                <p className="text-[10px] text-slate-700">
                  No fence crossings yet.
                </p>
              )}

              {liveIncidents.map((incident) => {
                const severity = describeSeverity(incident.severity);

                return (
                  <div
                    key={incident.id}
                    className="rounded-lg border border-slate-800/60 bg-[#14171b] px-2.5 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${severity.dot}`}
                      />

                      <span className="min-w-0 flex-1 truncate text-[11px] text-slate-300">
                        {incident.title}
                      </span>

                      <span className={`text-[11px] ${severity.text}`}>
                        {incident.score}
                      </span>
                    </div>

                    <p className="mt-1 pl-4 text-[10px] text-slate-600">
                      {incident.id} · {incident.clock}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Toggle({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
        active
          ? "border-slate-700/70 bg-slate-800/50 text-slate-200"
          : "border-slate-800/70 text-slate-600 hover:text-slate-400"
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
