import { STATUS } from "../../lib/detection/status";

/**
 * The pipeline, named after the code that implements it.
 *
 * The Dashboard shows the same shape as a five-stage summary. This version
 * exists so an evaluator can ask "what actually does that?" of any stage and
 * get a file, an algorithm and its parameters rather than a label.
 */
const STAGES = [
  {
    name: "Video ingestion",
    implementation: "<video> element sampled to an offscreen canvas",
    source: "src/hooks/useAnalytics.js · src/lib/detection/enhance.js",
    detail:
      "Frames are grabbed from the playing element and drawn to a 480px-wide canvas. Mean luminance of that copy is measured; below the night threshold an adaptive gamma lift is applied to the sample before inference, never to what the operator watches. Inference is serialised — the next frame is taken only once the previous one returns, so the overlay cannot drift behind the video.",
  },
  {
    name: "Object detection",
    implementation: "YOLOS-tiny, q8 weights, ONNX Runtime WASM",
    source: "src/lib/detection/engine.js · src/lib/analytics/classes.js",
    detail:
      "The quality preset sets the input shortest edge to 256, 320 or 448 px — the dominant cost in a vision transformer. Detections below 0.30 confidence are dropped. COCO's generic labels are then mapped onto the four domains a border post reasons about (person, vehicle, livestock, carried object); everything else is discarded before it can create an identity.",
  },
  {
    name: "Target tracking",
    implementation: "Greedy IoU association with age-out",
    source: "src/lib/analytics/tracker.js",
    detail:
      "Detections are matched to existing tracks by intersection-over-union, strongest overlap claiming its track first, with a 0.24 threshold and same-domain constraint. A track is confirmed at two hits and dropped after eight consecutive misses, and carries a trail of up to 40 anchor points. That identity is what makes dwell and direction of travel expressible at all.",
  },
  {
    name: "Virtual fence evaluation",
    implementation: "Point-in-polygon against per-camera zones",
    source: "src/lib/analytics/tracker.js · src/data/zones.js",
    detail:
      "Fences are normalised polygons over the frame, so they hold their meaning at any stream resolution. Each track's anchor is tested against every zone that applies to its class, with enter or dwell triggers; zone membership is remembered per track, so an object standing inside a zone fires once on entry rather than on every frame.",
  },
  {
    name: "Threat assessment",
    implementation: "Contextual scoring with an explicit factor list",
    source: "src/lib/analytics/threat.js",
    detail:
      "A class base weight is modified by zone criticality, hours of darkness, dwell time, group size, a carried load in frame, cross-camera persistence, direction of travel, detector confidence and feed health, then clamped to 0–100. Every contribution is returned with its delta and its reason, so the console can show why a score is what it is. Livestock is recognised and suppressed rather than alerted.",
  },
  {
    name: "Alert prioritisation",
    implementation: "Shared incident queue with attached evidence",
    source: "src/context/SystemContext.jsx · src/lib/analytics/threat.js",
    detail:
      "Scored events are banded high, medium or low at fixed score thresholds and raised into one shared store, merged newest-first with the seeded history and carrying a JPEG snapshot, the bounding box, the track trail and the light measurements taken at the moment of the alert. The Dashboard, triage queue and Evidence pages all read that single queue.",
  },
];

export default function ProcessingPipeline({ engine }) {
  const running =
    engine.status === STATUS.READY || engine.status === STATUS.FALLBACK;

  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-200">
            Processing pipeline
          </h3>

          <p className="mt-1 text-[11px] text-slate-600">
            Every stage below is implemented in this codebase
          </p>
        </div>

        <span className="rounded-full border border-slate-800/70 px-2.5 py-1 text-[9px] tracking-wide text-slate-500">
          {running
            ? engine.simulated
              ? "RUNNING · DETECTION REPLACED BY REPLAY"
              : "RUNNING · LIVE INFERENCE"
            : "NOT RUNNING"}
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {STAGES.map((stage, index) => {
          // In fallback the detection stage is the only one substituted; saying
          // so is more useful than a row of uniformly green dots.
          const substituted = running && engine.simulated && index === 1;

          const dot = !running
            ? "bg-slate-700"
            : substituted
              ? "bg-amber-400/80"
              : "bg-emerald-400/70";

          return (
            <div
              key={stage.name}
              className="rounded-lg border border-slate-800/60 bg-[#14171b] p-4"
            >
              <div className="flex items-start gap-4">
                <span className="mt-0.5 w-6 shrink-0 text-[9px] text-slate-700">
                  0{index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
                    />

                    <p className="text-xs text-slate-300">{stage.name}</p>

                    <p className="truncate text-[10px] text-slate-600">
                      {stage.implementation}
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    {stage.detail}
                  </p>

                  {substituted && (
                    <p className="mt-2 text-[10px] leading-4 text-amber-300/70">
                      Substituted this session: the model could not load, so a
                      deterministic scripted source feeds the stages below it.
                    </p>
                  )}

                  <p className="mt-2 font-mono text-[9px] text-slate-700">
                    {stage.source}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
