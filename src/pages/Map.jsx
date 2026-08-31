/**
 * Border Map — the sector at a glance.
 *
 * Where Target Tracking follows one identity, this is the estate view: every
 * camera, its state, the fences it enforces, and the incidents currently open
 * against it. Selecting a camera focuses the detail panel beside the map.
 */

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Cctv, ShieldHalf } from "lucide-react";

import SectorMap from "../components/tracking/SectorMap";
import { useSystem } from "../context/systemStore";
import { getZonesForCamera } from "../data/zones";
import { describeSeverity } from "../lib/analytics/threat";

const TYPE_LABEL = {
  bop: "Border Out Post",
  road: "Border Road",
  checkpost: "Check Post",
};

export default function BorderMap() {
  const { cameras, incidents, targets } = useSystem();

  const [selectedCameraId, setSelectedCameraId] = useState(cameras[0]?.id ?? null);

  const camera = useMemo(
    () => cameras.find((item) => item.id === selectedCameraId) ?? cameras[0],
    [cameras, selectedCameraId],
  );

  const zones = useMemo(
    () => (camera ? getZonesForCamera(camera.id) : []),
    [camera],
  );

  const cameraIncidents = useMemo(
    () =>
      incidents.filter(
        (incident) =>
          incident.cameraId === camera?.id &&
          incident.status !== "resolved" &&
          incident.status !== "suppressed",
      ),
    [incidents, camera],
  );

  // The most threatening active identity gets its route drawn behind the estate.
  const activeTarget = useMemo(
    () =>
      [...targets]
        .filter((target) => target.status === "active")
        .sort((a, b) => b.threat - a.threat)[0] ?? null,
    [targets],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1600px]"
    >
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
          Sector Alpha
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Border Map
        </h1>

        <p className="mt-1.5 text-xs text-slate-600">
          Camera estate, virtual fences and current activity. Select a camera for
          detail.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_21rem] gap-5">
        <SectorMap
          cameras={cameras}
          target={activeTarget}
          selectedCameraId={camera?.id}
          onSelectCamera={setSelectedCameraId}
          height="min-h-[620px]"
        />

        <div className="space-y-4">
          {camera && (
            <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
              <div className="flex items-center gap-2">
                <Cctv size={14} className="text-slate-500" />

                <h3 className="text-sm font-medium text-slate-200">
                  {camera.id}
                </h3>

                <span
                  className={`ml-auto h-1.5 w-1.5 rounded-full ${
                    camera.status === "online"
                      ? "bg-emerald-400/80"
                      : camera.status === "degraded"
                        ? "bg-amber-400/80"
                        : "bg-slate-700"
                  }`}
                />
              </div>

              <p className="mt-1.5 text-[11px] text-slate-500">{camera.name}</p>

              <dl className="mt-4 space-y-2">
                <Row label="Type" value={TYPE_LABEL[camera.type]} />
                <Row label="Model" value={camera.model} />
                <Row label="Resolution" value={`${camera.resolution} · ${camera.fps} fps`} />
                <Row label="In service" value={`since ${camera.installed}`} />
                <Row
                  label="Night capability"
                  value={camera.nightVision ? "IR illuminated" : "Visible light only"}
                />
              </dl>

              {camera.offlineReason && (
                <p className="mt-3 rounded-lg border border-slate-800/60 bg-[#14171b] p-3 text-[10px] leading-5 text-slate-500">
                  Offline since {camera.offlineSince} — {camera.offlineReason}
                </p>
              )}

              {camera.degradedReason && (
                <p className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/10 p-3 text-[10px] leading-5 text-amber-300/70">
                  {camera.degradedReason}
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
            <div className="flex items-center gap-2">
              <ShieldHalf size={14} className="text-slate-500" />

              <h3 className="text-sm font-medium text-slate-200">
                Virtual fences
              </h3>
            </div>

            {zones.length === 0 ? (
              <p className="mt-3 text-[11px] text-slate-600">
                No fence configured on this camera.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="rounded-lg border border-slate-800/60 bg-[#14171b] p-3"
                  >
                    <p className="text-[11px] text-slate-300">{zone.name}</p>

                    <p className="mt-1 text-[10px] text-slate-600">
                      {zone.kind} · criticality ×{zone.criticality.toFixed(2)}
                    </p>

                    <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
                      {zone.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
            <h3 className="text-sm font-medium text-slate-200">
              Open incidents
            </h3>

            {cameraIncidents.length === 0 ? (
              <p className="mt-3 text-[11px] text-slate-600">
                Nothing open on this camera.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {cameraIncidents.slice(0, 6).map((incident) => {
                  const severity = describeSeverity(incident.severity);

                  return (
                    <div
                      key={incident.id}
                      className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-[#14171b] px-3 py-2.5"
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${severity.dot}`}
                      />

                      <span className="min-w-0 flex-1 truncate text-[11px] text-slate-300">
                        {incident.title}
                      </span>

                      <span className={`text-xs ${severity.text}`}>
                        {incident.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </dt>

      <dd className="text-right text-[11px] text-slate-300">{value}</dd>
    </div>
  );
}
