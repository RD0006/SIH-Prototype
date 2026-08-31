#!/usr/bin/env node
/**
 * Crop-margin sweep.
 *
 * Baseline failure analysis showed the FIRST character wrong far more often
 * than any other position — LT69MDO read as CT69MDO, TT69MDO, IT69MDO,
 * ST69MDO. That is not a pattern a recogniser produces at random; it points at
 * the crop rather than the model. Either the leading character is being clipped
 * by a tight detector box, or the blue EU band to its left is bleeding in and
 * being read as a glyph.
 *
 * This varies only the crop margins and holds everything else fixed, so any
 * change in exact-match rate is attributable to that one parameter.
 *
 * Usage: node eval/sweep-margins.mjs
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as ort from "onnxruntime-node";
import { RawImage } from "@huggingface/transformers";

import { loadPipeline } from "./pipeline-node.mjs";
import { assessCrop } from "../src/lib/alpr/quality.js";
import { validatePlate } from "../src/lib/alpr/grammar.js";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_";
const OCR_W = 128;
const OCR_H = 64;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(
  readFileSync(path.join(root, "eval/dataset/labelled.json"), "utf8"),
).filter((s) => s.groundTruth);

const frameDir = path.join(root, "eval/dataset/.score");

mkdirSync(frameDir, { recursive: true });

const sessions = await loadPipeline(root);

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

async function read(image, box, marginX, marginY) {
  const mx = box.width * marginX;
  const my = box.height * marginY;

  const x = Math.max(0, Math.round(box.x1 - mx));
  const y = Math.max(0, Math.round(box.y1 - my));
  const x2 = Math.min(image.width, Math.round(box.x2 + mx));
  const y2 = Math.min(image.height, Math.round(box.y2 + my));

  if (x2 - x < 4 || y2 - y < 4) {
    return null;
  }

  const crop = await image.rgb().crop([x, y, x2, y2]);
  const plate = await crop.resize(OCR_W, OCR_H);

  const quality = assessCrop(toImageData(plate.data, OCR_W, OCR_H), box.width);

  if (quality.verdict === "rejected") {
    return { refused: true };
  }

  const out = await sessions.recogniser.run({
    input: new ort.Tensor("uint8", new Uint8Array(plate.data), [1, OCR_H, OCR_W, 3]),
  });

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

  const meaningful = characters.filter((c) => c.char !== "_");

  return {
    refused: false,
    text: meaningful.map((c) => c.char).join(""),
    characters: meaningful,
  };
}

// Cache decoded frames — the sweep re-reads the same ones many times.
const frames = new Map();

async function frameFor(sample) {
  if (frames.has(sample.id)) {
    return frames.get(sample.id);
  }

  const framePath = path.join(frameDir, `${sample.id}.png`);

  execFileSync("ffmpeg", [
    "-nostdin", "-v", "error",
    "-ss", String(sample.time),
    "-i", path.join(root, sample.clip),
    "-frames:v", "1", "-y", framePath,
  ]);

  const image = await RawImage.read(framePath);

  frames.set(sample.id, image);

  return image;
}

const MARGINS_X = [0.12, 0.16, 0.2, 0.24, 0.3, 0.36];
const MARGINS_Y = [0.0, 0.04, 0.08, 0.12];

console.log("crop-margin sweep — exact-match % on n=" + dataset.length);
console.log("(current production setting is mx=0.06 my=0.12)\n");
console.log("      " + MARGINS_Y.map((m) => `my=${m.toFixed(2)}`).join("  "));

let best = { score: -1 };

for (const mx of MARGINS_X) {
  const row = [];

  for (const my of MARGINS_Y) {
    let correct = 0;
    let firstCharWrong = 0;

    for (const sample of dataset) {
      const image = await frameFor(sample);

      const box = {
        x1: sample.box.x1, y1: sample.box.y1,
        x2: sample.box.x2, y2: sample.box.y2,
        width: sample.box.x2 - sample.box.x1,
        height: sample.box.y2 - sample.box.y1,
      };

      const result = await read(image, box, mx, my);

      if (!result || result.refused) {
        continue;
      }

      const predicted = validatePlate(result.text, result.characters).plate;

      if (predicted === sample.groundTruth) {
        correct += 1;
      } else if (predicted[0] !== sample.groundTruth[0]) {
        firstCharWrong += 1;
      }
    }

    const pct = (correct / dataset.length) * 100;

    row.push(pct);

    if (pct > best.score) {
      best = { score: pct, mx, my, correct, firstCharWrong };
    }
  }

  console.log(
    `mx=${mx.toFixed(2)}  ` + row.map((p) => `${p.toFixed(1).padStart(5)}%  `).join(""),
  );
}

console.log(
  `\nbest: mx=${best.mx} my=${best.my} -> ${best.score.toFixed(1)}% (${best.correct}/${dataset.length}), first-char errors ${best.firstCharWrong}`,
);
