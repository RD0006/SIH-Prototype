import { motion } from "motion/react";

import StatCard from "../components/dashboard/StatCard";
import PriorityIncidents from "../components/dashboard/PriorityIncidents";
import OperationalMap from "../components/dashboard/OperationalMap";

import {
  dashboardStats,
  priorityIncidents,
} from "../data/dashboard";

export default function Dashboard() {
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
        <OperationalMap />

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

          <span className="rounded-full border border-emerald-900/50 bg-emerald-950/20 px-2.5 py-1 text-[9px] tracking-wide text-emerald-400/80">
            ALL SYSTEMS ACTIVE
          </span>
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

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
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