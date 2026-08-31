/**
 * Model sessions for the ALPR engine.
 *
 * Two purpose-built models, loaded once and shared:
 *
 *   plate-detector-384  YOLOv9-t, trained specifically to localise number
 *                       plates. End-to-end — NMS is inside the graph, so the
 *                       browser gets final boxes rather than raw anchors.
 *   plate-ocr           CCT-XS, trained specifically to read plate crops.
 *                       Emits ten character slots over a 37-symbol alphabet,
 *                       already softmaxed, plus a 66-way region head.
 *
 * Both are MIT licensed and vendored locally by `npm run fetch:models`, so the
 * engine runs with no network access. See docs/core-engine.md for why these
 * were chosen over a general-purpose OCR engine and what was measured.
 */

import * as ort from "onnxruntime-web";

import ortAsyncifyWasm from "../../vendor/ort/ort-wasm-simd-threaded.asyncify.wasm?url";
import ortAsyncifyMjs from "../../vendor/ort/ort-wasm-simd-threaded.asyncify.mjs?url";
import ortPlainWasm from "../../vendor/ort/ort-wasm-simd-threaded.wasm?url";
import ortPlainMjs from "../../vendor/ort/ort-wasm-simd-threaded.mjs?url";

/** Pinned so a result can be reproduced against a known set of weights. */
export const MODEL_MANIFEST = {
  detector: {
    path: "/models/alpr/plate-detector-384.onnx",
    name: "yolo-v9-t-384-license-plates-end2end",
    source: "ankandrew/open-image-models",
    licence: "MIT",
    inputSize: 384,
  },
  recogniser: {
    path: "/models/alpr/plate-ocr.onnx",
    name: "cct-xs-v2-global",
    source: "ankandrew/cnn-ocr-lp",
    licence: "MIT",
    inputWidth: 128,
    inputHeight: 64,
  },
};

/** Alphabet and slot count come from the model's published config. */
export const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_";
export const PAD_CHAR = "_";
export const MAX_SLOTS = 10;

const isSafari =
  typeof navigator !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

ort.env.wasm.wasmPaths = isSafari
  ? { wasm: ortPlainWasm, mjs: ortPlainMjs }
  : { wasm: ortAsyncifyWasm, mjs: ortAsyncifyMjs };

let sessions = null;
let loadPromise = null;

export function loadModels({ onProgress } = {}) {
  if (sessions) {
    return Promise.resolve(sessions);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    onProgress?.({ stage: "Loading plate detector", ratio: 0.15 });

    const detector = await ort.InferenceSession.create(
      MODEL_MANIFEST.detector.path,
      { executionProviders: ["wasm"], graphOptimizationLevel: "all" },
    );

    onProgress?.({ stage: "Loading plate recogniser", ratio: 0.6 });

    const recogniser = await ort.InferenceSession.create(
      MODEL_MANIFEST.recogniser.path,
      { executionProviders: ["wasm"], graphOptimizationLevel: "all" },
    );

    sessions = { detector, recogniser };

    onProgress?.({ stage: "Warming up", ratio: 0.85 });

    await warmUp(sessions);

    onProgress?.({ stage: "Ready", ratio: 1 });

    return sessions;
  })().catch((error) => {
    loadPromise = null;
    sessions = null;

    throw error;
  });

  return loadPromise;
}

/**
 * A cold first inference is several times slower than steady state. Pay it at
 * load rather than on the operator's first frame, and it doubles as a check
 * that both graphs actually execute on this machine.
 */
async function warmUp({ detector, recogniser }) {
  const size = MODEL_MANIFEST.detector.inputSize;

  await detector.run({
    images: new ort.Tensor("float32", new Float32Array(3 * size * size), [
      1,
      3,
      size,
      size,
    ]),
  });

  const { inputWidth, inputHeight } = MODEL_MANIFEST.recogniser;

  await recogniser.run({
    input: new ort.Tensor(
      "uint8",
      new Uint8Array(inputWidth * inputHeight * 3),
      [1, inputHeight, inputWidth, 3],
    ),
  });
}

export function isLoaded() {
  return sessions !== null;
}

export { ort };
