/**
 * Input quality assessment.
 *
 * The single most damaging failure mode in a recognition system is confident
 * nonsense: a plate crop with no legible characters still produces ten argmax
 * results, and without a gate those get reported as a reading. On a border
 * feed most vehicles are too far away to read, so this path is the common one,
 * not the exception.
 *
 * Three measurements, each cheap enough to run per crop:
 *
 *   Resolution  — plate width in source pixels. Measured on this project's
 *                 footage, the same plate is 68px wide at 1080p and reads
 *                 exactly; at 30px nothing legible survives. Below MIN_WIDTH a
 *                 crop is rejected outright rather than guessed at.
 *   Sharpness   — variance of the Laplacian, the standard blur estimator. A
 *                 motion-blurred plate scores low and its reading is
 *                 distrusted even when the recogniser is confident.
 *   Contrast    — standard deviation of luminance. A washed-out or heavily
 *                 shadowed crop carries little character information.
 *
 * The output is advisory: it never rewrites a reading, it decides whether a
 * reading should be trusted, down-weighted in aggregation, or refused.
 */

import {
  GOOD_PLATE_WIDTH as GOOD_WIDTH,
  MIN_CONTRAST,
  MIN_PLATE_WIDTH as MIN_WIDTH,
  MIN_SHARPNESS,
} from "./config.js";

export { MIN_WIDTH, GOOD_WIDTH };

export const VERDICT = {
  GOOD: "good",
  MARGINAL: "marginal",
  REJECTED: "rejected",
};

/**
 * Grey-scale a crop's pixels once; both metrics reuse the result.
 * @param {ImageData} image
 */
function luminance(image) {
  const { data, width, height } = image;
  const grey = new Float32Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    grey[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  return grey;
}

/**
 * Variance of the Laplacian. High for crisp edges, low for blur.
 * The 4-neighbour kernel is enough here and avoids a full convolution pass.
 */
function sharpness(grey, width, height) {
  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;

      const value =
        4 * grey[i] -
        grey[i - 1] -
        grey[i + 1] -
        grey[i - width] -
        grey[i + width];

      sum += value;
      sumSquares += value * value;
      count += 1;
    }
  }

  if (count === 0) {
    return 0;
  }

  const mean = sum / count;

  return sumSquares / count - mean * mean;
}

function contrast(grey) {
  let sum = 0;

  for (let i = 0; i < grey.length; i += 1) {
    sum += grey[i];
  }

  const mean = sum / grey.length;
  let variance = 0;

  for (let i = 0; i < grey.length; i += 1) {
    variance += (grey[i] - mean) ** 2;
  }

  return Math.sqrt(variance / grey.length);
}

/**
 * @param {ImageData} image the plate crop at source resolution
 * @param {number} sourceWidth plate width in original frame pixels
 * @returns {{verdict, width, sharpness, contrast, reasons, factor}}
 */
export function assessCrop(image, sourceWidth) {
  const grey = luminance(image);

  const blur = sharpness(grey, image.width, image.height);
  const spread = contrast(grey);

  const reasons = [];

  if (sourceWidth < MIN_WIDTH) {
    reasons.push(
      `Plate is ${Math.round(sourceWidth)}px wide; ${MIN_WIDTH}px is the floor for a legible read.`,
    );
  }

  if (blur < MIN_SHARPNESS) {
    reasons.push(
      `Sharpness ${blur.toFixed(0)} below ${MIN_SHARPNESS} — motion blur or defocus.`,
    );
  }

  if (spread < MIN_CONTRAST) {
    reasons.push(
      `Contrast ${spread.toFixed(0)} below ${MIN_CONTRAST} — washed out or in shadow.`,
    );
  }

  // Width is the hard gate: no amount of sharpness recovers absent pixels.
  if (sourceWidth < MIN_WIDTH) {
    return {
      verdict: VERDICT.REJECTED,
      width: sourceWidth,
      sharpness: blur,
      contrast: spread,
      reasons,
      factor: 0,
    };
  }

  const marginal = reasons.length > 0 || sourceWidth < GOOD_WIDTH;

  // Confidence multiplier applied downstream. A marginal crop can still produce
  // the right answer, it just should not outvote a clean one.
  const widthFactor = Math.min(1, sourceWidth / GOOD_WIDTH);
  const blurFactor = Math.min(1, blur / (MIN_SHARPNESS * 2));
  const contrastFactor = Math.min(1, spread / (MIN_CONTRAST * 1.5));

  return {
    verdict: marginal ? VERDICT.MARGINAL : VERDICT.GOOD,
    width: sourceWidth,
    sharpness: blur,
    contrast: spread,
    reasons,
    factor: Math.max(0.15, widthFactor * 0.5 + blurFactor * 0.3 + contrastFactor * 0.2),
  };
}
