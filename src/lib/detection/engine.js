/**
 * The detection engine.
 *
 * Runs a real object-detection neural network inside the browser, against
 * frames grabbed from an ordinary <video> element. There is no server and no
 * smart camera anywhere in this path — which is the whole claim of the
 * platform: the intelligence is software, so it can be applied to CCTV that is
 * already in the ground.
 *
 * Weights and the ONNX WASM runtime are vendored under public/ by
 * `npm run fetch:models`, and remote loading is disabled, so the engine works
 * with the network cable pulled out.
 *
 * Two things are worth knowing about the design:
 *
 *   1. Input resolution is the dominant cost. YOLOS is a vision transformer, so
 *      halving the shortest edge from 512 to 256 cut measured inference from
 *      ~2240ms to ~320ms with no change in what it found. QUALITY exposes that
 *      trade-off so the console can be tuned to whatever machine it runs on.
 *
 *   2. Detection rate is decoupled from display rate. We infer a few times a
 *      second and let the tracker carry identities across the frames in
 *      between, which is what production VMS software does — running the
 *      network on every frame buys nothing at CCTV frame rates.
 *
 * If the model cannot load — no WASM, missing weights, unsupported browser —
 * loadEngine rejects and the caller falls back to replay. A demonstration must
 * never end in a stack trace.
 */

import { env, pipeline, RawImage } from "@huggingface/transformers";

// The ONNX runtime binaries, vendored into src/ by `npm run fetch:models` and
// resolved through Vite as ordinary project assets.
//
// transformers.js otherwise defaults these to a jsdelivr CDN, which would make
// the console depend on internet access at demo time. A remote border post has
// no such guarantee, and neither does a hackathon venue.
import ortAsyncifyWasm from "../../vendor/ort/ort-wasm-simd-threaded.asyncify.wasm?url";
import ortAsyncifyMjs from "../../vendor/ort/ort-wasm-simd-threaded.asyncify.mjs?url";
import ortPlainWasm from "../../vendor/ort/ort-wasm-simd-threaded.wasm?url";
import ortPlainMjs from "../../vendor/ort/ort-wasm-simd-threaded.mjs?url";

import { classify } from "../analytics/classes";
export { STATUS } from "./status";
import { normaliseBox } from "../analytics/geometry";

const MODEL_ID = "Xenova/yolos-tiny";

/** Input-size presets. Larger sees more, and costs superlinearly more. */
export const QUALITY = {
  fast: { label: "Fast", shortestEdge: 256, longestEdge: 666 },
  balanced: { label: "Balanced", shortestEdge: 320, longestEdge: 832 },
  accurate: { label: "Accurate", shortestEdge: 448, longestEdge: 1164 },
};

// Everything local. No CDN, no hub call, no network at demo time.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = "/models/";

// The weights are already on local disk, so the Cache API saves nothing — and
// it actively hurts: a single bad response (a dev-server SPA fallback serving
// index.html for a missing file, say) gets cached and the engine then fails on
// every subsequent load with no way for a user to clear it. Read from disk.
env.useBrowserCache = false;
// Safari cannot run the asyncify build; everything else prefers it. This
// mirrors the choice transformers.js makes when it reaches for the CDN.
const isSafari =
  typeof navigator !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

env.backends.onnx.wasm.wasmPaths = isSafari
  ? { wasm: ortPlainWasm, mjs: ortPlainMjs }
  : { wasm: ortAsyncifyWasm, mjs: ortAsyncifyMjs };

let detector = null;
let loadPromise = null;

/** The processor object differs by version; find whichever holds `size`. */
function featureExtractorOf(instance) {
  const processor = instance.processor;

  return (
    processor?.feature_extractor ??
    processor?.image_processor ??
    processor
  );
}

export function setQuality(preset) {
  if (!detector) {
    return;
  }

  const { shortestEdge, longestEdge } = QUALITY[preset] ?? QUALITY.balanced;
  const extractor = featureExtractorOf(detector);

  if (extractor) {
    extractor.size = {
      shortest_edge: shortestEdge,
      longest_edge: longestEdge,
    };
  }
}

/**
 * Load the model once and share it across every consumer.
 * Safe to call repeatedly; concurrent callers await the same promise.
 */
export function loadEngine({ onProgress, quality = "balanced" } = {}) {
  if (detector) {
    return Promise.resolve(detector);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const progress = (stage, ratio) => onProgress?.({ stage, ratio });

    progress("Loading detection weights", 0.15);

    detector = await pipeline("object-detection", MODEL_ID, {
      dtype: "q8",
      device: "wasm",
      progress_callback: (item) => {
        if (item?.status === "progress" && typeof item.progress === "number") {
          progress("Loading detection weights", 0.15 + (item.progress / 100) * 0.6);
        }
      },
    });

    setQuality(quality);

    progress("Warming up the network", 0.85);

    // A cold first inference is several times slower than steady state. Pay
    // that cost here rather than on the operator's first frame.
    await detector(blankImage(), { threshold: 0.9 });

    progress("Ready", 1);

    return detector;
  })().catch((error) => {
    loadPromise = null;
    detector = null;

    throw error;
  });

  return loadPromise;
}

function blankImage() {
  return new RawImage(new Uint8ClampedArray(64 * 64 * 3), 64, 64, 3);
}

/**
 * Detect objects in one frame.
 *
 * @param {HTMLCanvasElement} canvas the frame to read
 * @param {object} options
 * @param {number} options.threshold minimum detector confidence, 0..1
 * @returns {Promise<{detections: Array, latency: number}>}
 */
export async function detectFrame(canvas, { threshold = 0.3 } = {}) {
  if (!detector) {
    throw new Error("Detection engine is not loaded.");
  }

  const started = performance.now();

  const image = RawImage.fromCanvas(canvas);
  const raw = await detector(image, { threshold });

  const detections = [];

  for (const item of raw) {
    const { domain, display, subtype } = classify(item.label);

    detections.push({
      label: item.label,
      domain,
      display,
      subtype,
      confidence: item.score,
      box: normaliseBox(item.box, image.width, image.height),
    });
  }

  return {
    detections,
    latency: performance.now() - started,
  };
}

export function isLoaded() {
  return detector !== null;
}

export { MODEL_ID };
