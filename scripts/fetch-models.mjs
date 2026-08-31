#!/usr/bin/env node
/**
 * Vendors the detection model so the console can run OFFLINE.
 *
 * The prototype is demonstrated on venue machines with no guaranteed internet,
 * so nothing may be fetched from a hub at runtime. This pulls the model weights
 * and configs into public/, laid out in the directory shape
 *      transformers.js expects when env.allowRemoteModels is false:
 *          public/models/<org>/<name>/config.json
 *          public/models/<org>/<name>/preprocessor_config.json
 *          public/models/<org>/<name>/onnx/model_quantized.onnx
 *
 * It also copies the onnxruntime-web WASM runtime into src/vendor/ort/. Those
 * files cannot be imported straight out of node_modules: the package's exports
 * map hides dist/, and aliasing into node_modules makes Vite's dependency
 * optimiser try to pre-bundle a binary asset and fail. Owning the files inside
 * src/ sidesteps both problems — engine.js then imports them with ?url and Vite
 * treats them as ordinary project assets.
 *
 * Both outputs are gitignored and regenerable, so nothing binary is committed.
 *
 * Run: npm run fetch:models
 */

import { createWriteStream } from "node:fs";
import { mkdir, copyFile, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * ALPR models — a purpose-built plate detector and plate OCR.
 *
 * Both are MIT licensed, from ankandrew/open-image-models and
 * ankandrew/cnn-ocr-lp. They replaced a general-purpose OCR engine after direct
 * measurement on this project's own footage: reading the same plate took 409ms
 * and needed grammar repair to fix a misread character, against 37ms and an
 * exact read here. Pinned by release tag for reproducibility.
 */
const ALPR_FILES = [
  {
    url: "https://github.com/ankandrew/open-image-models/releases/download/assets/yolo-v9-t-384-license-plates-end2end.onnx",
    dest: "public/models/alpr/plate-detector-384.onnx",
  },
  {
    url: "https://github.com/ankandrew/cnn-ocr-lp/releases/download/arg-plates/cct_xs_v2_global.onnx",
    dest: "public/models/alpr/plate-ocr.onnx",
  },
  {
    url: "https://github.com/ankandrew/cnn-ocr-lp/releases/download/arg-plates/cct_xs_v2_global_plate_config.yaml",
    dest: "public/models/alpr/plate-ocr-config.yaml",
  },
];

async function fetchAlpr() {
  console.log("\nALPR — plate detector and plate OCR (MIT)");

  for (const file of ALPR_FILES) {
    await download(file.url, path.join(root, file.dest));
  }
}

/** Model to vendor. Swap MODEL_ID here to trade size for accuracy. */
const MODEL_ID = "Xenova/yolos-tiny";
const MODEL_FILES = [
  "config.json",
  "preprocessor_config.json",
  "onnx/model_quantized.onnx",
];

const HF = "https://huggingface.co";

function human(bytes) {
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

async function download(url, dest) {
  await mkdir(path.dirname(dest), { recursive: true });

  if (existsSync(dest)) {
    const { size } = await stat(dest);
    console.log(`  skip  ${path.relative(root, dest)} (${human(size)}, already present)`);
    return;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }

  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));

  const { size } = await stat(dest);
  console.log(`  get   ${path.relative(root, dest)} (${human(size)})`);
}

async function fetchModel() {
  console.log(`\nModel — ${MODEL_ID}`);

  for (const file of MODEL_FILES) {
    await download(
      `${HF}/${MODEL_ID}/resolve/main/${file}`,
      path.join(root, "public/models", MODEL_ID, file),
    );
  }
}

/** ORT runtime pairs. asyncify is the default path; the plain pair is Safari's. */
const RUNTIME_FILES = [
  "ort-wasm-simd-threaded.asyncify.mjs",
  "ort-wasm-simd-threaded.asyncify.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.wasm",
];

async function copyRuntime() {
  console.log("\nONNX runtime — from node_modules/onnxruntime-web");

  const from = path.join(root, "node_modules/onnxruntime-web/dist");
  const to = path.join(root, "src/vendor/ort");

  if (!existsSync(from)) {
    throw new Error("onnxruntime-web not installed — run `npm install` first.");
  }

  await mkdir(to, { recursive: true });

  for (const file of RUNTIME_FILES) {
    const source = path.join(from, file);

    if (!existsSync(source)) {
      console.log(`  warn  ${file} not present in this onnxruntime-web build`);
      continue;
    }

    await copyFile(source, path.join(to, file));

    const { size } = await stat(path.join(to, file));

    console.log(`  copy  src/vendor/ort/${file} (${human(size)})`);
  }
}

try {
  await fetchModel();
  await fetchAlpr();
  await copyRuntime();
  console.log("\nDone. The detection engine can now run with no network access.\n");
} catch (error) {
  console.error(`\nFailed: ${error.message}\n`);
  process.exitCode = 1;
}
