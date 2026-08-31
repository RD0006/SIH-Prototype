/**
 * Plate recognition.
 *
 * The model takes a 128×64 RGB crop and returns ten character slots over a
 * 37-symbol alphabet, already softmaxed, plus a 66-way region head. Because the
 * distribution is real rather than a heuristic, per-character confidence is
 * measured rather than invented — which is what makes honest aggregation and
 * honest refusal possible downstream.
 *
 * On a clean crop of this project's reference plate every character returns at
 * 100%; on a marginal crop the weak characters visibly drop, and that is the
 * signal the rest of the engine acts on.
 */

import { ALPHABET, MAX_SLOTS, MODEL_MANIFEST, PAD_CHAR, ort } from "./models";
import { assessCrop } from "./quality";
import {
  CROP_MARGIN_X,
  CROP_MARGIN_Y,
  MIN_CHARACTER_CONFIDENCE,
} from "./config.js";

const { inputWidth, inputHeight } = MODEL_MANIFEST.recogniser;

/**
 * Cut a plate out of the frame and size it for the recogniser.
 *
 * The margins are measured, not guessed. Baseline failure analysis showed the
 * FIRST character wrong far more often than any other position — LT69MDO read
 * as CT69MDO, TT69MDO, IT69MDO — which is a crop symptom, not a model one: the
 * detector boxes tightly and the leading glyph was being clipped.
 *
 * A sweep over both margins on the evaluation set (eval/sweep-margins.mjs)
 * found a broad plateau:
 *
 *   mx=0.06 my=0.12  41.5%   <- original guess
 *   mx=0.10 my=0.06  62.3%
 *   mx=0.12 my=0.04  69.8%   <- chosen, mid-plateau
 *   mx=0.14 my=0.06  67.9%
 *   mx=0.36 my=0.00  37.7%   <- too much background
 *
 * Horizontal margin matters far more than vertical, which is what you would
 * expect when the failure is a clipped leading character. These values were
 * tuned on the development set; see docs/core-engine.md for holdout results.
 */
export function cropPlate(source, box, sourceWidth, sourceHeight) {
  const marginX = box.width * CROP_MARGIN_X;
  const marginY = box.height * CROP_MARGIN_Y;

  const x = Math.max(0, box.x1 - marginX);
  const y = Math.max(0, box.y1 - marginY);
  const width = Math.min(sourceWidth - x, box.width + marginX * 2);
  const height = Math.min(sourceHeight - y, box.height + marginY * 2);

  const canvas = document.createElement("canvas");

  canvas.width = inputWidth;
  canvas.height = inputHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, x, y, width, height, 0, 0, inputWidth, inputHeight);

  return { canvas, context };
}

/**
 * Read one plate.
 *
 * @returns {{text, characters, meanConfidence, minConfidence, quality, latency, crop}}
 *          or `{ rejected: true, quality }` when the crop cannot support a read
 */
export async function recognisePlate(
  sessions,
  source,
  box,
  sourceWidth,
  sourceHeight,
) {
  const started = performance.now();

  const { canvas, context } = cropPlate(source, box, sourceWidth, sourceHeight);
  const image = context.getImageData(0, 0, inputWidth, inputHeight);

  // Gate before inference. Running the model on an illegible crop wastes time
  // and, worse, produces a confident-looking string.
  const quality = assessCrop(image, box.width);

  if (quality.verdict === "rejected") {
    return {
      rejected: true,
      quality,
      latency: performance.now() - started,
    };
  }

  // The graph wants interleaved RGB bytes, not planar floats.
  const rgb = new Uint8Array(inputWidth * inputHeight * 3);

  for (let i = 0, p = 0; i < image.data.length; i += 4, p += 3) {
    rgb[p] = image.data[i];
    rgb[p + 1] = image.data[i + 1];
    rgb[p + 2] = image.data[i + 2];
  }

  const output = await sessions.recogniser.run({
    input: new ort.Tensor("uint8", rgb, [1, inputHeight, inputWidth, 3]),
  });

  const probabilities = output.plate.data;
  const classes = output.plate.dims[2];

  const characters = [];

  for (let slot = 0; slot < MAX_SLOTS; slot += 1) {
    let bestIndex = 0;
    let bestValue = -Infinity;

    for (let c = 0; c < classes; c += 1) {
      const value = probabilities[slot * classes + c];

      if (value > bestValue) {
        bestValue = value;
        bestIndex = c;
      }
    }

    characters.push({
      char: ALPHABET[bestIndex],
      confidence: bestValue,
    });
  }

  // Padding marks the end of the plate, not a character.
  const meaningful = characters.filter((entry) => entry.char !== PAD_CHAR);
  const text = meaningful.map((entry) => entry.char).join("");

  const confidences = meaningful.map((entry) => entry.confidence);
  const weakest = confidences.length === 0 ? 0 : Math.min(...confidences);

  // A crop can be large, sharp and well-exposed and still contain no plate —
  // the detector occasionally boxes bodywork or a badge. The image gate cannot
  // see that; the recogniser's own uncertainty can, and does so cleanly.
  if (confidences.length === 0 || weakest < MIN_CHARACTER_CONFIDENCE) {
    return {
      rejected: true,
      quality: {
        ...quality,
        reasons: [
          `Weakest character read at ${(weakest * 100).toFixed(0)}% — below the ${(MIN_CHARACTER_CONFIDENCE * 100).toFixed(0)}% floor.`,
        ],
      },
      stage: "confidence",
      latency: performance.now() - started,
    };
  }

  return {
    rejected: false,
    text,
    characters: meaningful,
    meanConfidence:
      confidences.length === 0
        ? 0
        : confidences.reduce((a, b) => a + b, 0) / confidences.length,
    // The weakest character governs whether the whole plate can be trusted:
    // one wrong digit makes the registration wrong.
    minConfidence: weakest,
    quality,
    latency: performance.now() - started,
    crop: canvas.toDataURL("image/jpeg", 0.85),
  };
}
