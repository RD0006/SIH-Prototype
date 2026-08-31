#!/usr/bin/env node
/**
 * Does the recogniser's own confidence separate right from wrong?
 *
 * The quality gate screens the IMAGE — width, sharpness, contrast. It cannot
 * catch a detector false positive that is large and sharp but contains no
 * plate, and the holdout showed exactly that: an 89px "plate" on a piece of
 * bodywork read confidently as BHXK522.
 *
 * If correct and incorrect reads occupy different confidence ranges, a
 * confidence floor will convert those silent failures into honest refusals. If
 * they overlap, it will not, and adding one would only trade errors for missed
 * plates. This measures which it is before anything is changed.
 *
 * Usage: node eval/confidence-analysis.mjs [dataset.json ...]
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RawImage } from "@huggingface/transformers";

import { loadPipeline, recognisePlate } from "./pipeline-node.mjs";
import { validatePlate } from "../src/lib/alpr/grammar.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ["eval/dataset/labelled.json", "eval/dataset/holdout.json"];

const frameDir = path.join(root, "eval/dataset/.score");

mkdirSync(frameDir, { recursive: true });

const sessions = await loadPipeline(root);

const rows = [];

for (const file of files) {
  const dataset = JSON.parse(readFileSync(path.join(root, file), "utf8"));

  for (const sample of dataset) {
    const truth = sample.groundTruth ?? "";
    const framePath = path.join(frameDir, `${sample.id}.png`);

    execFileSync("ffmpeg", [
      "-nostdin", "-v", "error",
      "-ss", String(sample.time),
      "-i", path.join(root, sample.clip),
      "-frames:v", "1", "-y", framePath,
    ]);

    const image = await RawImage.read(framePath);

    const box = {
      x1: sample.box.x1, y1: sample.box.y1,
      x2: sample.box.x2, y2: sample.box.y2,
      width: sample.box.x2 - sample.box.x1,
      height: sample.box.y2 - sample.box.y1,
    };

    const reading = await recognisePlate(sessions, image, box);

    if (reading.rejected) {
      continue;
    }

    const predicted = validatePlate(reading.text, reading.characters).plate;
    const acceptable = sample.acceptable ?? [truth];

    rows.push({
      id: sample.id,
      truth,
      predicted,
      ok: acceptable.includes(predicted),
      noPlate: truth === "",
      mean: reading.meanConfidence,
      min: reading.minConfidence,
      width: box.width,
    });
  }
}

function summarise(label, subset) {
  if (subset.length === 0) {
    return;
  }

  const mins = subset.map((r) => r.min).sort((a, b) => a - b);
  const means = subset.map((r) => r.mean).sort((a, b) => a - b);
  const q = (arr, p) => arr[Math.floor(arr.length * p)];

  console.log(
    `${label.padEnd(26)} n=${String(subset.length).padStart(3)}  ` +
      `min-conf p05=${(q(mins, 0.05) * 100).toFixed(0).padStart(3)}% ` +
      `med=${(q(mins, 0.5) * 100).toFixed(0).padStart(3)}%  ` +
      `mean-conf med=${(q(means, 0.5) * 100).toFixed(0).padStart(3)}%`,
  );
}

console.log("\nconfidence distribution\n" + "-".repeat(74));
summarise("correct reads", rows.filter((r) => r.ok));
summarise("incorrect reads", rows.filter((r) => !r.ok && !r.noPlate));
summarise("no plate present", rows.filter((r) => r.noPlate));

console.log("\nwhat a minimum-character-confidence floor would do\n" + "-".repeat(74));
console.log("  floor   kept   correct   wrong   noPlate-suppressed   precision");

for (const floor of [0, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99]) {
  const kept = rows.filter((r) => r.min >= floor);
  const correct = kept.filter((r) => r.ok).length;
  const wrong = kept.filter((r) => !r.ok && !r.noPlate).length;
  const noPlateKept = kept.filter((r) => r.noPlate).length;
  const noPlateTotal = rows.filter((r) => r.noPlate).length;

  console.log(
    `  ${floor.toFixed(2)}   ${String(kept.length).padStart(4)}   ` +
      `${String(correct).padStart(7)}   ${String(wrong).padStart(5)}   ` +
      `${String(noPlateTotal - noPlateKept).padStart(18)}   ` +
      `${kept.length === 0 ? "n/a" : ((correct / kept.length) * 100).toFixed(1) + "%"}`,
  );
}

console.log(
  `\n  total reads ${rows.length}: ${rows.filter((r) => r.ok).length} correct, ` +
    `${rows.filter((r) => !r.ok && !r.noPlate).length} wrong, ` +
    `${rows.filter((r) => r.noPlate).length} on no plate\n`,
);
