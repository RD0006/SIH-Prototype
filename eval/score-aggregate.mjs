#!/usr/bin/env node
/**
 * Operational evaluation: per VEHICLE, not per frame.
 *
 * Single-frame accuracy is a component metric. What the platform actually
 * reports is one registration per tracked vehicle, aggregated over every frame
 * it was visible for — so that is what has to be measured. A pipeline can be
 * mediocre frame-by-frame and still be right about the vehicle, which is the
 * whole reason temporal aggregation exists.
 *
 * Vehicles are grouped by (clip, ground truth). That is a stand-in for a track:
 * these clips contain one instance of each registration, so all crops sharing a
 * ground truth are the same vehicle seen repeatedly.
 *
 * Two numbers matter here:
 *
 *   Vehicle exact match   Did the platform end up with the right registration?
 *   Trusted-and-wrong     Of the results it PRESENTED as high confidence, how
 *                         many were wrong? This is the number that decides
 *                         whether an operator can believe the display. A system
 *                         may be wrong; it must not be confidently wrong.
 *
 * Usage: node eval/score-aggregate.mjs
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RawImage } from "@huggingface/transformers";

import { loadPipeline, recognisePlate } from "./pipeline-node.mjs";
import { aggregateReadings, describeCertainty } from "../src/lib/alpr/aggregate.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const datasetPath =
  process.argv[2] ?? path.join(root, "eval/dataset/labelled.json");
const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));

const frameDir = path.join(root, "eval/dataset/.score");

mkdirSync(frameDir, { recursive: true });

const sessions = await loadPipeline(root);

/** Group crops into vehicles. */
const vehicles = new Map();

for (const sample of dataset) {
  if (!sample.groundTruth) {
    continue;
  }

  const key = `${sample.clip}::${sample.groundTruth}`;

  if (!vehicles.has(key)) {
    vehicles.set(key, {
      truth: sample.groundTruth,
      acceptable: sample.acceptable,
      clip: sample.clip,
      samples: [],
    });
  }

  vehicles.get(key).samples.push(sample);
}

console.log("=".repeat(68));
console.log("ALPR EVALUATION — per vehicle (operational metric)");
console.log(`dataset : ${path.relative(root, datasetPath)}`);
console.log(`vehicles: ${vehicles.size}   crops: ${dataset.length}`);
console.log("=".repeat(68));
console.log();

let correct = 0;
let trustedWrong = 0;
let trusted = 0;

const rows = [];

for (const vehicle of vehicles.values()) {
  const observations = [];

  // Feed frames in time order, as the live engine would.
  const ordered = [...vehicle.samples].sort((a, b) => a.time - b.time);

  for (const sample of ordered) {
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

    observations.push(await recognisePlate(sessions, image, box));
  }

  const result = aggregateReadings(observations);
  const certainty = describeCertainty(result);

  // Honour documented glyph ambiguity, as the per-frame scorer does.
  const acceptable = vehicle.acceptable ?? [vehicle.truth];
  const ok = acceptable.includes(result.plate);

  if (ok) {
    correct += 1;
  }

  if (certainty.level === "high") {
    trusted += 1;

    if (!ok) {
      trustedWrong += 1;
    }
  }

  rows.push({
    truth: vehicle.truth,
    got: result.plate ?? "(none)",
    ok,
    frames: observations.length,
    used: result.samples ?? 0,
    confidence: result.confidence ?? 0,
    weakest: result.weakest ?? 0,
    certainty: certainty.label,
  });
}

for (const r of rows) {
  console.log(
    `  ${r.ok ? "OK  " : "MISS"}  truth=${r.truth.padEnd(9)} got=${r.got.padEnd(10)} ` +
      `frames=${String(r.used).padStart(2)}/${String(r.frames).padStart(2)}  ` +
      `conf=${(r.confidence * 100).toFixed(0).padStart(3)}%  weakest=${(r.weakest * 100).toFixed(0).padStart(3)}%  ${r.certainty}`,
  );
}

const pct = (n, d) => (d === 0 ? "n/a" : `${((n / d) * 100).toFixed(1)}%`);

console.log();
console.log(`  vehicle exact match   ${correct}/${vehicles.size}  ${pct(correct, vehicles.size)}`);
console.log(`  presented as high     ${trusted}/${vehicles.size}`);
console.log(`  trusted AND wrong     ${trustedWrong}  ${pct(trustedWrong, Math.max(1, trusted))} of trusted   <- the number that governs trust`);
console.log();
