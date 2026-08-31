/**
 * Plate localisation.
 *
 * Replaces the geometric guess the first implementation used — "a plate sits in
 * the lower middle of a vehicle box" — with a model trained to find plates.
 * That guess was the weakest link: it was right often enough to look like it
 * worked and wrong often enough to feed the recogniser car bodywork, which the
 * recogniser then dutifully read as characters.
 *
 * The graph has NMS baked in, so its output is final boxes, shaped [N, 7] as
 * [batch, x1, y1, x2, y2, class, score] in the letterboxed input space.
 */

import { MODEL_MANIFEST, ort } from "./models";

const SIZE = MODEL_MANIFEST.detector.inputSize;

/**
 * Letterbox into the square input rather than stretching.
 *
 * Plates are wide and thin. Squashing a 16:9 frame to 1:1 compresses them
 * horizontally by nearly half, which is precisely the axis carrying the
 * character information. Padding preserves the aspect ratio and the mapping
 * back out stays exact.
 */
export function letterbox(source, width, height) {
  const scale = Math.min(SIZE / width, SIZE / height);
  const drawWidth = Math.round(width * scale);
  const drawHeight = Math.round(height * scale);
  const padX = Math.floor((SIZE - drawWidth) / 2);
  const padY = Math.floor((SIZE - drawHeight) / 2);

  const canvas = document.createElement("canvas");

  canvas.width = SIZE;
  canvas.height = SIZE;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  context.fillStyle = "#000";
  context.fillRect(0, 0, SIZE, SIZE);
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height, padX, padY, drawWidth, drawHeight);

  return { canvas, context, scale, padX, padY };
}

function toTensor(context) {
  const { data } = context.getImageData(0, 0, SIZE, SIZE);
  const plane = SIZE * SIZE;
  const chw = new Float32Array(3 * plane);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    chw[p] = data[i] / 255;
    chw[plane + p] = data[i + 1] / 255;
    chw[2 * plane + p] = data[i + 2] / 255;
  }

  return new ort.Tensor("float32", chw, [1, 3, SIZE, SIZE]);
}

/**
 * Find plates in a frame.
 *
 * @param {object} sessions from loadModels()
 * @param {HTMLVideoElement|HTMLCanvasElement} source read at native resolution
 * @param {number} width source width in pixels
 * @param {number} height source height in pixels
 * @param {number} threshold minimum detector score
 * @returns {Promise<{plates: Array, latency: number}>} boxes in SOURCE pixels
 */
export async function detectPlates(
  sessions,
  source,
  width,
  height,
  { threshold = 0.25 } = {},
) {
  const started = performance.now();

  const { context, scale, padX, padY } = letterbox(source, width, height);
  const output = await sessions.detector.run({ images: toTensor(context) });

  const tensor = output.output0;
  const rows = tensor.dims[0];
  const stride = tensor.dims[1];

  const plates = [];

  for (let i = 0; i < rows; i += 1) {
    const offset = i * stride;

    const score = tensor.data[offset + 6];

    if (score < threshold) {
      continue;
    }

    // Undo the letterbox to get back to source pixel coordinates.
    const x1 = (tensor.data[offset + 1] - padX) / scale;
    const y1 = (tensor.data[offset + 2] - padY) / scale;
    const x2 = (tensor.data[offset + 3] - padX) / scale;
    const y2 = (tensor.data[offset + 4] - padY) / scale;

    if (x2 <= x1 || y2 <= y1) {
      continue;
    }

    plates.push({
      x1: Math.max(0, x1),
      y1: Math.max(0, y1),
      x2: Math.min(width, x2),
      y2: Math.min(height, y2),
      score,
      width: x2 - x1,
      height: y2 - y1,
    });
  }

  plates.sort((a, b) => b.score - a.score);

  return { plates, latency: performance.now() - started };
}
