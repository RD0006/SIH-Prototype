/**
 * System Status — the procurement page.
 *
 * Every other screen argues that the analytics are useful. This one argues
 * that they cost no hardware: the estate table names the actual cameras and
 * their age, the comparison states what a replacement programme would demand
 * of a remote post, and the pipeline names the code behind each claim. Numbers
 * come from the live store, so nothing here can drift away from what the
 * platform is really doing.
 */

import { motion } from "motion/react";

import CameraEstate from "../components/system/CameraEstate";
import DetectionEnginePanel from "../components/system/DetectionEnginePanel";
import HardwareComparison from "../components/system/HardwareComparison";
import ProcessingPipeline from "../components/system/ProcessingPipeline";
import SessionCounters from "../components/system/SessionCounters";
import { useSystem } from "../context/systemStore";

export default function SystemStatus() {
  const { cameras, engine, stats } = useSystem();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1600px]"
    >
      {/* Page heading */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
            Border Sector Alpha · Platform
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            System Status
          </h1>

          <p className="mt-1.5 text-xs text-slate-600">
            The estate this platform runs on, and what it asks you to buy.
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-700">
            New hardware required
          </p>

          <p className="mt-1 text-sm text-slate-300">None</p>
        </div>
      </div>

      <SessionCounters stats={stats} />

      <div className="mt-5">
        <CameraEstate cameras={cameras} />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_1fr] gap-5">
        <DetectionEnginePanel engine={engine} />

        <HardwareComparison />
      </div>

      <div className="mt-5">
        <ProcessingPipeline engine={engine} />
      </div>
    </motion.div>
  );
}
