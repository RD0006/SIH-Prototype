import { Link } from "react-router";
import { Cpu, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";

import { QUALITY_PRESETS, STATUS } from "../../lib/detection/status";

// Named rather than imported from lib/detection/engine.js on purpose: importing
// that module pulls the transformers.js runtime into this page's bundle, and
// this page should render without loading a neural network.
const MODEL_ID = "Xenova/yolos-tiny";

const STATUS_STYLE = {
  [STATUS.IDLE]: {
    label: "Idle",
    ring: "border-slate-800/70 bg-[#111418]/80 text-slate-500",
    icon: Cpu,
  },
  [STATUS.LOADING]: {
    label: "Loading",
    ring: "border-sky-900/50 bg-sky-950/20 text-sky-300/90",
    icon: Loader2,
  },
  [STATUS.READY]: {
    label: "Live inference",
    ring: "border-emerald-900/50 bg-emerald-950/20 text-emerald-300/90",
    icon: Cpu,
  },
  [STATUS.FALLBACK]: {
    label: "Simulated replay",
    ring: "border-amber-900/50 bg-amber-950/20 text-amber-300/90",
    icon: TriangleAlert,
  },
  [STATUS.ERROR]: {
    label: "Error",
    ring: "border-red-900/50 bg-red-950/20 text-red-300/90",
    icon: TriangleAlert,
  },
};

/**
 * What the analytics engine is actually doing, reported without flattery.
 *
 * The engine only exists once an operator starts the Live Surveillance console,
 * so the idle case is the normal first view of this page and is stated plainly
 * rather than papered over with zeroed metrics.
 */
export default function DetectionEnginePanel({ engine }) {
  const style = STATUS_STYLE[engine.status] ?? STATUS_STYLE[STATUS.IDLE];
  const Icon = style.icon;

  const idle = engine.status === STATUS.IDLE;

  const preset = QUALITY_PRESETS.find((item) => item.id === engine.quality);

  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#171a1f]">
      <div className="flex items-start justify-between border-b border-slate-800/60 px-5 py-4">
        <div>
          <h3 className="text-sm font-medium text-slate-200">
            Detection engine
          </h3>

          <p className="mt-1 text-[11px] text-slate-600">
            {MODEL_ID} · ONNX Runtime (WASM) via transformers.js
          </p>
        </div>

        <span
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${style.ring}`}
        >
          <Icon
            size={12}
            className={engine.status === STATUS.LOADING ? "animate-spin" : ""}
          />

          <span className="text-[10px] tracking-wide">{style.label}</span>
        </span>
      </div>

      {idle ? (
        <div className="px-5 py-5">
          <p className="text-[11px] leading-5 text-slate-400">
            The engine has not been started in this session. Nothing has been
            loaded, no frame has been sampled and no metrics exist yet — this
            page will not invent them.
          </p>

          <p className="mt-3 text-[11px] leading-5 text-slate-600">
            Open the console and press <span className="text-slate-400">Start
            analysis</span> to load the weights and begin inference. Loading
            progress and per-frame telemetry appear there first.
          </p>

          <Link
            to="/surveillance"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700/50"
          >
            Go to Live Surveillance
          </Link>
        </div>
      ) : (
        <div className="px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage" value={engine.stage} />

            <Field
              label="Mode"
              value={
                engine.simulated
                  ? "Simulated replay — scripted source"
                  : "Live inference on sampled frames"
              }
              tone={engine.simulated ? "text-amber-300/90" : "text-slate-300"}
            />

            <Field
              label="Quality preset"
              value={preset ? `${preset.label} · ${preset.hint}` : engine.quality}
            />

            <Field
              label="Measured latency"
              value={
                engine.latency === null
                  ? "Not reported to shared state"
                  : `${engine.latency} ms per frame`
              }
            />

            <Field
              label="Throughput"
              value={
                engine.fps === null
                  ? "Not reported to shared state"
                  : `${engine.fps.toFixed(1)} inferences/s`
              }
            />

            <Field
              label="Load progress"
              value={`${Math.round((engine.progress ?? 0) * 100)}%`}
            />
          </div>

          {engine.latency === null && engine.fps === null && (
            <p className="mt-3 text-[10px] leading-4 text-slate-600">
              Per-frame latency and throughput are measured inside the analytics
              loop and displayed on the Live Surveillance console; only engine
              lifecycle state is published to the shared store.
            </p>
          )}

          {engine.error && (
            <div className="mt-4 rounded-lg border border-amber-900/40 bg-amber-950/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-amber-400/70">
                Reported fault
              </p>

              <p className="mt-1.5 text-[11px] leading-5 text-amber-200/80">
                {engine.error}
              </p>

              {engine.simulated && (
                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  The console fell back to a deterministic replay source. Every
                  downstream stage — tracking, fences, scoring, incidents — is
                  the same code that a live run exercises.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-800/60 bg-[#14171b] px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-slate-500" />

          <p className="text-[11px] text-slate-300">Where the video goes</p>
        </div>

        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          Nowhere. The network runs client-side in this browser tab, the weights
          are served from the machine&rsquo;s own disk, and remote model loading
          is disabled in the engine, so the console works with the network cable
          pulled out. Frames are sampled to an in-memory canvas and discarded;
          no footage is uploaded to a server or to a third-party cloud. For a
          border deployment that is a security property, not a convenience —
          imagery never leaves the post.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, tone = "text-slate-300" }) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-[#14171b] px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">
        {label}
      </p>

      <p className={`mt-1.5 text-[11px] leading-4 ${tone}`}>{value}</p>
    </div>
  );
}
