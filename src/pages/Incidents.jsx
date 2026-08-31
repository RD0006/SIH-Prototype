/**
 * Incidents — the alert triage queue.
 *
 * A sector runs more feeds than any operator can watch. The platform's job is
 * not to show all of them at once but to collapse them into a single ranked
 * queue so that the first thing on screen is the thing that matters most, and
 * to be able to justify that ordering line by line when asked.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import AlertQueue from "../components/incidents/AlertQueue";
import AlertDetail from "../components/incidents/AlertDetail";
import QueueFilters from "../components/incidents/QueueFilters";
import { isOpen, isSuppressed } from "../components/incidents/status";
import { useSystem } from "../context/systemStore";

/** The alert an operator should be looking at the moment the page opens. */
function topPriority(incidents) {
  const open = incidents.filter(isOpen);
  const pool = open.length > 0 ? open : incidents;

  const best = pool.reduce(
    (leader, incident) =>
      leader === null || incident.score > leader.score ? incident : leader,
    null,
  );

  return best?.id ?? null;
}

export default function Incidents() {
  const { incidents, cameras, stats, updateIncidentStatus, getEvidence } =
    useSystem();

  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("score");
  const [selectedId, setSelectedId] = useState(() => topPriority(incidents));

  // A live incident can age out of the retained window while it is selected.
  useEffect(() => {
    if (!incidents.some((incident) => incident.id === selectedId)) {
      setSelectedId(topPriority(incidents));
    }
  }, [incidents, selectedId]);

  const visible = useMemo(() => {
    const filtered = incidents.filter((incident) => {
      if (severity !== "all" && incident.severity !== severity) {
        return false;
      }

      if (status !== "all" && incident.status !== status) {
        return false;
      }

      return true;
    });

    // `incidents` already arrives newest first, so time order needs no work.
    if (sort === "score") {
      return [...filtered].sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [incidents, severity, status, sort]);

  const selected = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? null,
    [incidents, selectedId],
  );

  const evidence = selected ? getEvidence(selected.id) : null;

  const suppressedCount = incidents.filter(isSuppressed).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1600px]"
    >
      {/* Page heading */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
            Sector Alpha · Alert triage
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            Incidents
          </h1>

          <p className="mt-1.5 text-xs text-slate-600">
            {cameras.length} feeds reduced to one ranked queue — and every score
            on it is explained.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Stat value={stats.openIncidents} label="Open" />
          <Stat value={stats.highPriority} label="High priority" />
          <Stat value={suppressedCount} label="Suppressed" />
        </div>
      </div>

      <div className="grid grid-cols-[25rem_minmax(0,1fr)] gap-5">
        {/* Ranked queue */}
        <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-[#171a1f]">
          <QueueFilters
            severity={severity}
            onSeverity={setSeverity}
            status={status}
            onStatus={setStatus}
            sort={sort}
            onSort={setSort}
            shown={visible.length}
            total={incidents.length}
          />

          <AlertQueue
            incidents={visible}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Selected incident */}
        <AlertDetail
          incident={selected}
          evidence={evidence}
          onAction={updateIncidentStatus}
        />
      </div>
    </motion.div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-right">
      <p className="text-lg font-medium leading-none text-slate-200">{value}</p>

      <p className="mt-1.5 text-[9px] uppercase tracking-[0.16em] text-slate-700">
        {label}
      </p>
    </div>
  );
}
