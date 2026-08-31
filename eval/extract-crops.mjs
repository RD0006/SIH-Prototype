#!/usr/bin/env node
/**
 * Stage 1 of building the evaluation dataset: find plates and save their crops
 * so a human can read them and record ground truth.
 *
 * Ground truth is established by a person looking at the cropped image, NOT by
 * the recogniser. Labelling a dataset with the model's own output measures
 * nothing — it would report agreement with itself as accuracy.
 *
 * Usage:
 *   node eval/extract-crops.mjs <clip.mp4> [framesPerClip]
 *
 * Writes crops to eval/dataset/crops/ and an unlabelled manifest entry per crop
 * to eval/dataset/pending.json for a human to fill in.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RawImage } from "@huggingface/transformers";

import { loadPipeline, detectPlates } from "./pipeline-node.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "eval/dataset/crops");
const pendingPath = path.join(root, "eval/dataset/pending.json");
const tmpDir = path.join(root, "eval/dataset/.frames");

const clip = process.argv[2];
const frameCount = Number(process.argv[3] ?? 12);

if (!clip) {
  console.error("usage: node eval/extract-crops.mjs <clip.mp4> [frames]");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const clipName = path.basename(clip, path.extname(clip));

const duration = Number(
  execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1",
    clip,
  ]).toString().trim(),
);

console.log(`${clipName}: ${duration.toFixed(1)}s, sampling ${frameCount} frames`);

const sessions = await loadPipeline(root);
const pending = existsSync(pendingPath)
  ? JSON.parse(readFileSync(pendingPath, "utf8"))
  : [];

let found = 0;

for (let i = 0; i < frameCount; i += 1) {
  // Sample evenly, skipping the very start and end.
  const t = (duration * (i + 0.5)) / frameCount;
  const framePath = path.join(tmpDir, `f${i}.png`);

  execFileSync("ffmpeg", [
    "-v", "error", "-ss", String(t), "-i", clip,
    "-frames:v", "1", "-y", framePath,
  ]);

  const image = await RawImage.read(framePath);
  const { plates } = await detectPlates(sessions, image, 0.3);

  for (const [index, box] of plates.entries()) {
    // Only keep crops big enough that a human could plausibly read them —
    // otherwise the dataset fills with unlabelable noise.
    if (box.width < 30) {
      continue;
    }

    const id = `${clipName}_t${t.toFixed(2)}_p${index}`;
    const file = path.join(outDir, `${id}.png`);

    // Save at 5x so a human can actually read it, but record true pixel width.
    const crop = await image
      .rgb()
      .crop([
        Math.max(0, Math.round(box.x1 - box.width * 0.08)),
        Math.max(0, Math.round(box.y1 - box.height * 0.18)),
        Math.min(image.width, Math.round(box.x2 + box.width * 0.08)),
        Math.min(image.height, Math.round(box.y2 + box.height * 0.18)),
      ]);

    await (await crop.resize(Math.round(crop.width * 5), Math.round(crop.height * 5))).save(file);

    pending.push({
      id,
      clip: path.relative(root, clip),
      time: Number(t.toFixed(2)),
      box: {
        x1: Math.round(box.x1), y1: Math.round(box.y1),
        x2: Math.round(box.x2), y2: Math.round(box.y2),
      },
      plateWidthPx: Math.round(box.width),
      detectorScore: Number(box.score.toFixed(3)),
      crop: path.relative(root, file),
      groundTruth: null,
      legible: null,
      notes: "",
    });

    found += 1;
  }
}

writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
rmSync(tmpDir, { recursive: true, force: true });

console.log(`  ${found} plate crops written; manifest now holds ${pending.length} entries`);
console.log(`  label them in ${path.relative(root, pendingPath)}`);
