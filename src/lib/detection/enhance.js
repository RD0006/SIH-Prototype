/**
 * Adaptive low-light enhancement.
 *
 * Border cameras are at their most important after dark and at their worst
 * after dark. Measured on this project's own night clip, the raw frame made the
 * detector call a walking person a "horse" at 48% confidence. Lifting the frame
 * to a mid-range exposure first turned that into "person" at 90%.
 *
 *   raw          mean luminance  52.4   ->  horse  48.1%
 *   gamma 1.8    mean luminance 111.5   ->  person 90.3%
 *   gamma 2.6    mean luminance 148.0   ->  person 70.7%   (over-exposed)
 *
 * So the correction is deliberately adaptive rather than fixed: it computes the
 * gamma needed to bring this frame's mean luminance to TARGET and clamps it, so
 * a dim frame is lifted, an already-bright frame is left alone, and nothing is
 * ever pushed into the over-exposed region where accuracy falls away again.
 *
 * This runs on the sampled 480px frame, not the displayed video, so it costs
 * well under a millisecond and never alters what the operator watches.
 */

/** Mean luminance we aim for. Empirically the detector's best operating point. */
const TARGET = 112;

/** Below this, a frame is treated as night and enhancement engages. */
export const NIGHT_THRESHOLD = 78;

const MIN_GAMMA = 1.0;
const MAX_GAMMA = 2.4;

let cachedGamma = null;
let cachedLut = null;

function lutFor(gamma) {
  if (cachedGamma === gamma && cachedLut) {
    return cachedLut;
  }

  const lut = new Uint8ClampedArray(256);
  const inverse = 1 / gamma;

  for (let i = 0; i < 256; i += 1) {
    lut[i] = Math.min(255, Math.round(255 * (i / 255) ** inverse));
  }

  cachedGamma = gamma;
  cachedLut = lut;

  return lut;
}

/** Mean luminance over a coarse sample. Cheap and stable enough to steer on. */
export function meanLuminance(data, stride = 64) {
  let total = 0;
  let samples = 0;

  for (let i = 0; i < data.length; i += 4 * stride) {
    total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    samples += 1;
  }

  return samples === 0 ? 255 : total / samples;
}

/**
 * Measure a frame and, if it is dark, brighten it in place.
 *
 * @param {HTMLCanvasElement} canvas frame to inspect and possibly rewrite
 * @param {boolean} enabled whether enhancement may be applied
 * @returns {{ luminance: number, night: boolean, gamma: number, enhanced: boolean }}
 */
export function enhanceFrame(canvas, enabled = true) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const image = context.getImageData(0, 0, canvas.width, canvas.height);

  const luminance = meanLuminance(image.data);
  const night = luminance < NIGHT_THRESHOLD;

  if (!enabled || !night || luminance <= 1) {
    return { luminance, night, gamma: 1, enhanced: false };
  }

  // Solve (L/255)^(1/g) = T/255 for g, then clamp to the useful range.
  const gamma = Math.min(
    MAX_GAMMA,
    Math.max(MIN_GAMMA, Math.log(luminance / 255) / Math.log(TARGET / 255)),
  );

  if (gamma <= MIN_GAMMA) {
    return { luminance, night, gamma: 1, enhanced: false };
  }

  const lut = lutFor(Number(gamma.toFixed(2)));
  const { data } = image;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }

  context.putImageData(image, 0, 0);

  return {
    luminance,
    night,
    gamma: Number(gamma.toFixed(2)),
    enhanced: true,
    corrected: meanLuminance(data),
  };
}
