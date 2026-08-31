import { useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router";

import StatCard from "../components/dashboard/StatCard";
import PriorityIncidents from "../components/dashboard/PriorityIncidents";
import SectorMap from "../components/tracking/SectorMap";
import { useSystem } from "../context/systemStore";
import { STATUS } from "../lib/detection/status";

export default function Dashboard() {
  const { stats, incidents, cameras, targets, engine } = useSystem();

  // The four headline figures, derived from live state rather than fixed text.
  const dashboardStats = useMemo(
    () => [
      {
        label: "Total Cameras",
        value: String(stats.totalCameras).padStart(2, "0"),
        detail: "Across active sector",
      },
      {
        label: "Online",
        value: String(stats.online).padStart(2, "0"),
        detail:
          stats.offline + stats.degraded === 0
            ? "Full estate reporting"
            : `${stats.offline} offline · ${stats.degraded} degraded`,
      },
      {
        label: "Active Incidents",
        value: String(stats.openIncidents).padStart(2, "0"),
        detail: `${stats.highPriority} high priority`,
      },
      {
        label: "Detections",
        value: String(stats.detections),
        detail:
          stats.detections === 0
            ? "Start the console to begin"
            : `${stats.suppressed} suppressed as non-threat`,
      },
    ],
    [stats],
  );

  // Highest-scoring open incidents, newest first among equals.
  const priorityIncidents = useMemo(
    () =>
      [...incidents]
        .filter(
          (incident) =>
            incident.status !== "resolved" && incident.status !== "suppressed",
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((incident) => ({
          id: incident.id,
          title: incident.title,
          location: incident.zoneId
            ? incident.zoneId.replace(/^zone-/, "").replace(/-/g, " ")
            : "Sector Alpha",
          camera: incident.cameraId,
          score: incident.score,
          severity: incident.severity,
          time: incident.clock,
        })),
    [incidents],
  );

  const activeTarget = useMemo(
    () =>
      [...targets]
        .filter((target) => target.status === "active")
        .sort((a, b) => b.threat - a.threat)[0] ?? null,
    [targets],
  );

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 0.35,
      }}
      className="mx-auto max-w-[1600px]"
    >
      {/* Page heading */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
            Border Sector Alpha
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            Surveillance Overview
          </h1>

          <p className="mt-1.5 text-xs text-slate-600">
            Real-time intelligence from connected surveillance infrastructure.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-700">
            Local Time
          </p>

          <p className="mt-1 text-xs text-slate-500">
            30 Aug 2026 · 21:47:32
          </p>

          <p className="mt-1 text-[10px] text-slate-700">
            {engine.status === STATUS.READY
              ? "Analytics engine running"
              : engine.status === STATUS.FALLBACK
                ? "Analytics engine in replay"
                : "Analytics engine idle"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {dashboardStats.map((stat, index) => (
          <StatCard
            key={stat.label}
            {...stat}
            index={index}
          />
        ))}
      </div>

      {/* Main section */}
      <div className="mt-5 grid grid-cols-[1.45fr_1fr] gap-5">
        <SectorMap
          cameras={cameras}
          target={activeTarget}
          height="min-h-[390px]"
        />

        <PriorityIncidents
          incidents={priorityIncidents}
        />
      </div>

      {/* Intelligence pipeline */}
      <div className="mt-5 rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-200">
              Intelligence Pipeline
            </h3>

            <p className="mt-1 text-[11px] text-slate-600">
              Current system processing status
            </p>
          </div>

          {engine.status === STATUS.READY ? (
            <span className="rounded-full border border-emerald-900/50 bg-emerald-950/20 px-2.5 py-1 text-[9px] tracking-wide text-emerald-400/80">
              ALL SYSTEMS ACTIVE
            </span>
          ) : engine.status === STATUS.FALLBACK ? (
            <span className="rounded-full border border-amber-900/50 bg-amber-950/20 px-2.5 py-1 text-[9px] tracking-wide text-amber-400/80">
              REPLAY — ENGINE UNAVAILABLE
            </span>
          ) : (
            <Link
              to="/surveillance"
              className="rounded-full border border-slate-800/70 px-2.5 py-1 text-[9px] tracking-wide text-slate-500 transition hover:text-slate-300"
            >
              PIPELINE IDLE — START CONSOLE
            </Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-5 gap-3">
          {[
            "Video Ingestion",
            "Object Detection",
            "Target Tracking",
            "Threat Assessment",
            "Alert Prioritization",
          ].map((stage, index) => (
            <div
              key={stage}
              className="relative rounded-lg border border-slate-800/60 bg-[#14171b] p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] text-slate-700">
                  0{index + 1}
                </span>

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    engine.status === STATUS.READY
                      ? "bg-emerald-400/70"
                      : engine.status === STATUS.FALLBACK
                        ? "bg-amber-400/70"
                        : "bg-slate-700"
                  }`}
                />
              </div>

              <p className="text-xs text-slate-400">
                {stage}
              </p>

              {index < 4 && (
                <div className="absolute -right-3 top-1/2 h-px w-3 bg-slate-800" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}