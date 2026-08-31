/**
 * Node-side harness for the ALPR pipeline.
 *
 * The browser engine draws through canvas; this reproduces the same stages with
 * the same parameters so the pipeline can be measured over a dataset without a
 * browser in the loop.
 *
 * What is genuinely shared with production: the ONNX graphs, the letterbox
 * geometry, the crop margins, the quality thresholds, the grammar rules and the
 * aggregation maths — quality.js, grammar.js and aggregate.js are imported
 * directly from src/. What is re-implemented: image resizing, which uses
 * RawImage here and CanvasRenderingContext2D in the browser. Both are bilinear,
 * but they are not bit-identical, so a small delta between harness and browser
 * results is expected and must not be papered over.
 */

import * as ort from "onnxruntime-node";
import { RawImage } from "@huggingface/transformers";

import { assessCrop } from "../src/lib/alpr/quality.js";
import {
  CROP_MARGIN_X,
  CROP_MARGIN_Y,
  MIN_CHARACTER_CONFIDENCE,
} from "../src/lib/alpr/config.js";
import { aggregateReadings } from "../src/lib/alpr/aggregate.js";

export const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_";
export const PAD_CHAR = "_";
const DET_SIZE = 384;
const OCR_W = 128;
const OCR_H = 64;

export async function loadPipeline(root) {
  const detector = await ort.InferenceSession.create(
    `${root}/public/models/alpr/plate-detector-384.onnx`,
  );
  const recogniser = await ort.InferenceSession.create(
    `${root}/public/models/alpr/plate-ocr.onnx`,
  );

  return { detector, recogniser };
}

/** Letterbox to square, matching detector.js. */
async function letterbox(image) {
  const scale = Math.min(DET_SIZE / image.width, DET_SIZE / image.height);
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);
  const padX = Math.floor((DET_SIZE - w) / 2);
  const padY = Math.floor((DET_SIZE - h) / 2);

  const resized = await image.rgb().resize(w, h);
  const canvas = new Uint8ClampedArray(DET_SIZE * DET_SIZE * 3);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const from = (y * w + x) * 3;
      const to = ((y + padY) * DET_SIZE + (x + padX)) * 3;

      canvas[to] = resized.data[from];
      canvas[to + 1] = resized.data[from + 1];
      canvas[to + 2] = resized.data[from + 2];
    }
  }

  return { canvas, scale, padX, padY };
}

export async function detectPlates(sessions, image, threshold = 0.25) {
  const { canvas, scale, padX, padY } = await letterbox(image);
  const plane = DET_SIZE * DET_SIZE;
  const chw = new Float32Array(3 * plane);

  for (let i = 0; i < plane; i += 1) {
    chw[i] = canvas[i * 3] / 255;
    chw[plane + i] = canvas[i * 3 + 1] / 255;
    chw[2 * plane + i] = canvas[i * 3 + 2] / 255;
  }

  const started = performance.now();
  const out = await sessions.detector.run({
    images: new ort.Tensor("float32", chw, [1, 3, DET_SIZE, DET_SIZE]),
  });
  const latency = performance.now() - started;

  const tensor = out.output0;
  const stride = tensor.dims[1];
  const plates = [];

  for (let i = 0; i < tensor.dims[0]; i += 1) {
    const o = i * stride;
    const score = tensor.data[o + 6];

    if (score < threshold) {
      continue;
    }

    const x1 = (tensor.data[o + 1] - padX) / scale;
    const y1 = (tensor.data[o + 2] - padY) / scale;
    const x2 = (tensor.data[o + 3] - padX) / scale;
    const y2 = (tensor.data[o + 4] - padY) / scale;

    if (x2 <= x1 || y2 <= y1) {
      continue;
    }

    plates.push({
      x1: Math.max(0, x1),
      y1: Math.max(0, y1),
      x2: Math.min(image.width, x2),
      y2: Math.min(image.height, y2),
      score,
      width: x2 - x1,
      height: y2 - y1,
    });
  }

  plates.sort((a, b) => b.score - a.score);

  return { plates, latency };
}

/** ImageData-compatible shape so quality.js can be reused unchanged. */
function toImageData(rgb, width, height) {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0, p = 0; i < width * height; i += 1, p += 3) {
    data[i * 4] = rgb[p];
    data[i * 4 + 1] = rgb[p + 1];
    data[i * 4 + 2] = rgb[p + 2];
    data[i * 4 + 3] = 255;
  }

  return { data, width, height };
}

export async function recognisePlate(sessions, image, box) {
  const marginX = box.width * CROP_MARGIN_X;
  const marginY = box.height * CROP_MARGIN_Y;

  const x = Math.max(0, Math.round(box.x1 - marginX));
  const y = Math.max(0, Math.round(box.y1 - marginY));
  const x2 = Math.min(image.width, Math.round(box.x2 + marginX));
  const y2 = Math.min(image.height, Math.round(box.y2 + marginY));

  if (x2 - x < 2 || y2 - y < 2) {
    return { rejected: true, quality: { verdict: "rejected", reasons: ["Degenerate crop."], factor: 0 } };
  }

  const crop = await image.rgb().crop([x, y, x2, y2]);
  const plate = await crop.resize(OCR_W, OCR_H);

  const quality = assessCrop(toImageData(plate.data, OCR_W, OCR_H), box.width);

  if (quality.verdict === "rejected") {
    return { rejected: true, quality };
  }

  const started = performance.now();
  const out = await sessions.recogniser.run({
    input: new ort.Tensor("uint8", new Uint8Array(plate.data), [1, OCR_H, OCR_W, 3]),
  });
  const latency = performance.now() - started;

  const pd = out.plate.data;
  const classes = out.plate.dims[2];
  const characters = [];

  for (let s = 0; s < out.plate.dims[1]; s += 1) {
    let bi = 0;
    let bv = -Infinity;

    for (let c = 0; c < classes; c += 1) {
      const v = pd[s * classes + c];

      if (v > bv) {
        bv = v;
        bi = c;
      }
    }

    characters.push({ char: ALPHABET[bi], confidence: bv });
  }

  const meaningful = characters.filter((c) => c.char !== PAD_CHAR);
  const confs = meaningful.map((c) => c.confidence);
  const weakest = confs.length ? Math.min(...confs) : 0;

  // Mirrors the confidence gate in src/lib/alpr/recogniser.js. If these two
  // drift apart the harness stops measuring the shipped system.
  if (confs.length === 0 || weakest < MIN_CHARACTER_CONFIDENCE) {
    return {
      rejected: true,
      stage: "confidence",
      quality: {
        ...quality,
        reasons: [
          `Weakest character read at ${(weakest * 100).toFixed(0)}% — below the ${(MIN_CHARACTER_CONFIDENCE * 100).toFixed(0)}% floor.`,
        ],
      },
    };
  }

  return {
    rejected: false,
    text: meaningful.map((c) => c.char).join(""),
    characters: meaningful,
    meanConfidence: confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : 0,
    minConfidence: weakest,
    quality,
    latency,
  };
}

export { aggregateReadings };
