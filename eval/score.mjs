#!/usr/bin/env node
/**
 * Measure the ALPR pipeline against human-labelled ground truth.
 *
 * Metrics, and why each is here:
 *
 *   Exact match       The operational metric. A registration is only useful if
 *                     every character is right; "one character off" identifies
 *                     a different vehicle. This is the headline number.
 *   Character error   Levenshtein distance over total ground-truth length.
 *                     Diagnostic: separates "nearly right" from "completely
 *                     wrong", which decides whether to chase preprocessing or
 *                     the model itself.
 *   Refusal rate      How often the quality gate declined. Not a failure —
 *                     refusing an illegible plate is correct, and a system with
 *                     a 0% refusal rate on hard data is guessing.
 *   Silent error rate The one that governs trust: a confident, well-formed,
 *                     WRONG answer. These are the failures an operator cannot
 *                     detect by looking at the output.
 *
 * Reported separately for legible and illegible crops, because the correct
 * behaviour differs between them: read the first, refuse the second.
 *
 * Usage: node eval/score.mjs [dataset.json]
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RawImage } from "@huggingface/transformers";

import { loadPipeline, recognisePlate } from "./pipeline-node.mjs";
import { validatePlate } from "../src/lib/alpr/grammar.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const datasetPath =
  process.argv[2] ?? path.join(root, "eval/dataset/labelled.json");
const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));

function levenshtein(a, b) {
  const cols = b.length + 1;
  let prev = Array.from({ length: cols }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];

    for (let j = 1; j < cols; j += 1) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }

    prev = row;
  }

  return prev[cols - 1];
}

const sessions = await loadPipeline(root);
const frameDir = path.join(root, "eval/dataset/.score");

mkdirSync(frameDir, { recursive: true });

const results = [];

for (const sample of dataset) {
  // A sample with no ground-truth plate is a detector false positive. The
  // correct behaviour is to refuse it, so it is scored, not skipped.
  const truth = sample.groundTruth ?? "";

  const framePath = path.join(frameDir, `${sample.id}.png`);

  // The stored crops are 5x upscales for human reading. Re-derive from the
  // source frame so the pipeline sees exactly what it sees at runtime.
  execFileSync("ffmpeg", [
    "-nostdin", "-v", "error",
    "-ss", String(sample.time),
    "-i", path.join(root, sample.clip),
    "-frames:v", "1", "-y", framePath,
  ]);

  const image = await RawImage.read(framePath);

  const box = {
    x1: sample.box.x1,
    y1: sample.box.y1,
    x2: sample.box.x2,
    y2: sample.box.y2,
    width: sample.box.x2 - sample.box.x1,
    height: sample.box.y2 - sample.box.y1,
  };

  const reading = await recognisePlate(sessions, image, box);

  if (reading.rejected) {
    results.push({
      ...sample,
      refused: true,
      predicted: null,
      // Refusing a false positive is the RIGHT answer.
      correct: truth === "",
      distance: truth.length,
      reason: reading.quality.reasons[0],
    });

    continue;
  }

  const validated = validatePlate(reading.text, reading.characters);
  const predicted = validated.plate;

  // Some labels are genuinely ambiguous at the glyph level — see `ambiguous` in
  // the dataset. Those are scored twice: strictly against the primary label,
  // and leniently against any reading a careful human could defend. Both are
  // reported; neither is quietly substituted for the other.
  const acceptable = sample.acceptable ?? [truth];

  results.push({
    ...sample,
    refused: false,
    predicted,
    raw: reading.text,
    correct: predicted === truth,
    acceptableMatch: acceptable.includes(predicted),
    conforms: validated.conforms,
    repairs: validated.repairs.length,
    distance: levenshtein(predicted, truth),
    meanConfidence: reading.meanConfidence,
    minConfidence: reading.minConfidence,
    quality: reading.quality.verdict,
    latency: reading.latency,
  });
}

function report(label, subset) {
  if (subset.length === 0) {
    return;
  }

  const attempted = subset.filter((r) => !r.refused);
  const correct = subset.filter((r) => r.correct);
  const lenient = subset.filter((r) => r.correct || r.acceptableMatch);
  const refused = subset.filter((r) => r.refused);
  const silent = attempted.filter((r) => !r.correct && !r.acceptableMatch && r.conforms);
  const ambiguous = subset.filter((r) => r.ambiguous);

  // Character error is computed over ATTEMPTED reads only. Counting a refusal
  // as a full-length error conflates "declined to answer" with "answered
  // wrongly", and made the metric move in the wrong direction when refusals
  // were added.
  const chars = attempted.reduce((a, r) => a + (r.groundTruth ?? "").length, 0);
  const errors = attempted.reduce((a, r) => a + r.distance, 0);

  const pct = (n, d) => (d === 0 ? "n/a" : `${((n / d) * 100).toFixed(1)}%`);

  console.log(`\n── ${label}  (n=${subset.length})`);
  console.log(`   exact (strict)    ${correct.length}/${subset.length}  ${pct(correct.length, subset.length)}`);

  if (ambiguous.length > 0) {
    console.log(`   exact (ambiguity) ${lenient.length}/${subset.length}  ${pct(lenient.length, subset.length)}   [${ambiguous.length} labels flagged ambiguous]`);
  }

  if (attempted.length > 0) {
    // Only reads that were actually attempted. A correct refusal is a correct
    // OUTCOME but not a correct read, and counting it here produced >100%.
    const correctReads = attempted.filter((r) => r.correct || r.acceptableMatch);

    console.log(`   exact when read   ${correctReads.length}/${attempted.length}  ${pct(correctReads.length, attempted.length)}`);
  }

  console.log(`   character error   ${errors}/${chars}  ${pct(errors, chars)}  (over attempted reads)`);
  console.log(`   refused           ${refused.length}  ${pct(refused.length, subset.length)}`);
  console.log(`   silent errors     ${silent.length}  ${pct(silent.length, subset.length)}   <- confident and wrong`);
}

console.log("=".repeat(68));
console.log("ALPR EVALUATION");
console.log(`dataset : ${path.relative(root, datasetPath)}`);
console.log(`samples : ${results.length}    unique plates: ${new Set(results.map((r) => r.groundTruth)).size}`);
console.log("=".repeat(68));

report("ALL", results);
report("Legible crops — engine should read", results.filter((r) => r.legible));
report("Illegible / no plate — engine should refuse", results.filter((r) => r.legible === false));

console.log("\n── failures");

const failures = results.filter((r) => !r.correct);

if (failures.length === 0) {
  console.log("   none");
} else {
  for (const f of failures) {
    const got = f.predicted ?? "REFUSED";
    const tag = f.refused
      ? `(${f.reason})`
      : f.conforms
        ? "conforms — SILENT ERROR"
        : "non-conforming";

    console.log(
      `   ${f.id.padEnd(34)} ${String(f.plateWidthPx).padStart(3)}px  truth=${(f.groundTruth ?? "(none)").padEnd(9)} got=${got.padEnd(11)} d=${f.distance}  ${tag}`,
    );
  }
}

const latencies = results.filter((r) => r.latency).map((r) => r.latency).sort((a, b) => a - b);

if (latencies.length > 0) {
  console.log(
    `\n── recognition latency   median ${latencies[Math.floor(latencies.length / 2)].toFixed(1)}ms   p95 ${latencies[Math.floor(latencies.length * 0.95)].toFixed(1)}ms`,
  );
}

console.log();
