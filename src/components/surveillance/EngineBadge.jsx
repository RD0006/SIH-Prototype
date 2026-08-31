import { Cpu, TriangleAlert, Loader2, Zap } from "lucide-react";

import { STATUS } from "../../lib/detection/status";

/**
 * Honest reporting of what is actually running.
 *
 * If the neural engine is live it says so; if the console has fallen back to
 * scripted replay it says that too, in the same place, without hiding it. A
 * demonstration that quietly pretends simulated output is real inference is
 * worth nothing the moment somebody asks.
 */
export default function EngineBadge({ engine, telemetry }) {
  if (engine.status === STATUS.LOADING) {
    return (
      <div className="flex items-center gap-2.5 rounded-full border border-slate-800/70 bg-[#111418]/80 px-3 py-1.5">
        <Loader2 size={12} className="animate-spin text-sky-400/80" />

        <span className="text-[10px] tracking-wide text-slate-400">
          {engine.stage}
        </span>

        <span className="text-[10px] text-slate-600">
          {Math.round((engine.progress ?? 0) * 100)}%
        </span>
      </div>
    );
  }

  if (engine.status === STATUS.FALLBACK) {
    return (
      <div className="flex items-center gap-2.5 rounded-full border border-amber-900/50 bg-amber-950/20 px-3 py-1.5">
        <TriangleAlert size={12} className="text-amber-400/90" />

        <span className="text-[10px] tracking-wide text-amber-300/90">
          SIMULATED REPLAY — engine unavailable
        </span>
      </div>
    );
  }

  if (engine.status === STATUS.READY) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1.5">
        <Cpu size={12} className="text-emerald-400/90" />

        <span className="text-[10px] tracking-wide text-emerald-300/90">
          LIVE INFERENCE
        </span>

        {telemetry.latency !== null && (
          <span className="text-[10px] text-slate-500">
            {telemetry.latency}ms
          </span>
        )}

        {telemetry.fps !== null && (
          <span className="text-[10px] text-slate-500">
            {telemetry.fps.toFixed(1)} fps
          </span>
        )}

        {telemetry.enhanced && (
          <span className="flex items-center gap-1 text-[10px] text-sky-300/90">
            <Zap size={10} />γ{telemetry.gamma}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-full border border-slate-800/70 bg-[#111418]/80 px-3 py-1.5">
      <Cpu size={12} className="text-slate-600" />

      <span className="text-[10px] tracking-wide text-slate-600">
        ENGINE IDLE
      </span>
    </div>
  );
}
