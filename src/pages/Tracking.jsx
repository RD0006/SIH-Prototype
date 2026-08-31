/**
 * Target Tracking — cross-camera identity.
 *
 * The demonstration point here is that the platform is more than a detector.
 * Detection models are commodity; joining sightings from separate cameras into
 * one identity with a route, a heading and an accumulating threat score is
 * system design, and it is what turns "three cameras alarmed" into "this group
 * is moving toward Check Post 1".
 */

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Radar, TriangleAlert } from "lucide-react";

import SectorMap from "../components/tracking/SectorMap";
import { useSystem } from "../context/systemStore";
import { getCamera } from "../data/cameras";
import { describeSeverity } from "../lib/analytics/threat";
import { DOMAIN_COLOR } from "../lib/analytics/classes";

export default function Tracking() {
  const { targets, cameras, incidents } = useSystem();

  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(() => {
    if (selectedId) {
      return targets.find((target) => target.id === selectedId) ?? targets[0];
    }

    // Default to the most threatening active identity.
    const active = targets.filter((target) => target.status === "active");

    return (
      [...(active.length > 0 ? active : targets)].sort(
        (a, b) => b.threat - a.threat,
      )[0] ?? null
    );
  }, [targets, selectedId]);

  const linkedIncidents = useMemo(() => {
    if (!selected) {
      return [];
    }

    return incidents.filter((incident) =>
      selected.incidentIds?.includes(incident.id),
    );
  }, [incidents, selected]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1600px]"
    >
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
          Sector Alpha · Intelligence
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Target Tracking
        </h1>

        <p className="mt-1.5 text-xs text-slate-600">
          Sightings from separate cameras resolved into single identities.
        </p>
      </div>

      <div className="grid grid-cols-[20rem_minmax(0,1fr)] gap-5">
        {/* Identity list */}
        <div className="space-y-2">
          {targets.length === 0 && (
            <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
              <p className="text-xs text-slate-500">No identities tracked.</p>
            </div>
          )}

          {targets.map((target) => {
            const severity = describeSeverity(target.severity);
            const active = selected?.id === target.id;

            return (
              <button
                key={target.id}
                type="button"
                onClick={() => setSelectedId(target.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-slate-700/70 bg-[#1b1f25]"
                    : "border-slate-800/70 bg-[#171a1f] hover:border-slate-700/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: DOMAIN_COLOR[target.domain] }}
                  />

                  <span className="text-[10px] text-slate-600">{target.id}</span>

                  <span
                    className={`ml-auto text-sm font-medium ${severity.text}`}
                  >
                    {target.threat}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-300">{target.display}</p>

                <p className="mt-1 text-[10px] text-slate-600">
                  {target.sightings.length} sightings · {target.firstSeen}–
                  {target.lastSeen}
                </p>

                <p
                  className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[9px] tracking-wide ${
                    target.status === "active"
                      ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-400/80"
                      : "border-slate-800 bg-slate-900/30 text-slate-600"
                  }`}
                >
                  {target.status === "active" ? "ACTIVE TRACK" : "TRACK LOST"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Map and detail */}
        <div className="space-y-5">
          <SectorMap cameras={cameras} target={selected} />

          {selected && (
            <div className="grid grid-cols-[1.3fr_1fr] gap-5">
              {/* Sighting chain */}
              <div className="rounded-xl border border-slate-800/70 bg-[#171a1f]">
                <div className="flex items-center gap-2 border-b border-slate-800/60 px-5 py-4">
                  <Radar size={13} className="text-slate-500" />

                  <h3 className="text-sm font-medium text-slate-200">
                    Sighting chain
                  </h3>
                </div>

                <div className="p-5">
                  <p className="mb-4 text-[11px] leading-5 text-slate-500">
                    {selected.summary}
                  </p>

                  <div className="space-y-0">
                    {selected.sightings.map((sighting, index) => {
                      const camera = getCamera(sighting.cameraId);
                      const last = index === selected.sightings.length - 1;

                      return (
                        <div
                          key={`${sighting.cameraId}-${sighting.clock}`}
                          className="relative pl-6"
                        >
                          <span className="absolute left-0 top-1.5 flex h-3 w-3 items-center justify-center">
                            <span className="block h-1.5 w-1.5 rounded-full bg-red-400/80" />
                          </span>

                          {!last && (
                            <span className="absolute left-[5px] top-4 h-full w-px bg-slate-800" />
                          )}

                          <div className="pb-5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-300">
                                {sighting.cameraId}
                              </span>

                              <span className="text-[10px] text-slate-600">
                                {sighting.clock}
                              </span>

                              <span className="ml-auto text-[10px] text-slate-600">
                                {(sighting.confidence * 100).toFixed(0)}%
                              </span>
                            </div>

                            <p className="mt-0.5 text-[10px] text-slate-600">
                              {camera?.name}
                            </p>

                            <p className="mt-1 text-[11px] leading-5 text-slate-500">
                              {sighting.note}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Identity facts */}
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
                  <h3 className="text-sm font-medium text-slate-200">
                    {selected.id}
                  </h3>

                  <dl className="mt-4 space-y-2.5">
                    <Fact label="Classification" value={selected.display} />
                    <Fact label="Heading" value={selected.heading} />
                    <Fact label="Speed" value={selected.speed} />
                    <Fact
                      label="First seen"
                      value={`${selected.firstSeen} · ${selected.sightings[0]?.cameraId ?? "—"}`}
                    />
                    <Fact
                      label="Last seen"
                      value={`${selected.lastSeen} · ${selected.sightings[selected.sightings.length - 1]?.cameraId ?? "—"}`}
                    />
                    <Fact
                      label="Cameras"
                      value={`${selected.sightings.length} of ${cameras.length}`}
                    />
                  </dl>

                  <div className="mt-4 rounded-lg border border-slate-800/60 bg-[#14171b] p-3">
                    <p className="text-[10px] leading-5 text-slate-500">
                      Re-acquisition across separate cameras is itself a threat
                      signal. A single sighting can be a passer-by; the same
                      identity appearing on three cameras on a consistent
                      heading is a sustained movement.
                    </p>
                  </div>
                </div>

                {linkedIncidents.length > 0 && (
                  <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
                    <div className="flex items-center gap-2">
                      <TriangleAlert size={13} className="text-slate-500" />

                      <h3 className="text-sm font-medium text-slate-200">
                        Linked incidents
                      </h3>
                    </div>

                    <div className="mt-3 space-y-2">
                      {linkedIncidents.map((incident) => {
                        const severity = describeSeverity(incident.severity);

                        return (
                          <div
                            key={incident.id}
                            className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-[#14171b] px-3 py-2.5"
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${severity.dot}`}
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] text-slate-300">
                                {incident.title}
                              </span>

                              <span className="block text-[10px] text-slate-600">
                                {incident.id} · {incident.clock}
                              </span>
                            </span>

                            <span className={`text-xs ${severity.text}`}>
                              {incident.score}
                            </span>

                            <ArrowRight size={12} className="text-slate-700" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </dt>

      <dd className="text-right text-[11px] text-slate-300">{value}</dd>
    </div>
  );
}
