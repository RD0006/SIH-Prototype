/**
 * Every tunable in the ALPR engine, with the evidence behind it.
 *
 * These values are load-bearing — the difference between the first guess and
 * the measured settings was 41.5% to 69.8% exact match on the same data — so
 * they live in one dependency-free module rather than scattered as literals.
 * That also lets the Node evaluation harness import the exact same numbers the
 * browser uses, so a measurement means something.
 *
 * Anything changed here must be re-measured with:
 *   node eval/score.mjs
 */

/**
 * Crop margins around the detector's plate box, as a fraction of box size.
 *
 * Failure analysis on the baseline showed the FIRST character wrong far more
 * often than any other position (LT69MDO read as CT69MDO / TT69MDO / IT69MDO).
 * That is a crop symptom: the detector boxes tightly to the glyphs and the
 * leading character was being clipped.
 *
 * Sweep over the evaluation set (eval/sweep-margins.mjs), exact match:
 *
 *      my=0.00  my=0.04  my=0.06  my=0.12
 *   mx=0.06                        41.5%    <- original guess
 *   mx=0.10              62.3%     52.8%
 *   mx=0.12   69.8%   69.8%        58.5%    <- chosen, mid-plateau
 *   mx=0.14              67.9%     60.4%
 *   mx=0.36   37.7%                45.3%    <- too much background
 *
 * Horizontal margin dominates, as expected for a clipped-leading-character
 * failure. The peak is a plateau, so mid-plateau values are used rather than
 * the exact argmax, which would be fitting a single grid point.
 */
export const CROP_MARGIN_X = 0.12;
export const CROP_MARGIN_Y = 0.04;

/**
 * Detector confidence floor. Below this a candidate box is discarded.
 * Low deliberately: a missed plate cannot be recovered later, whereas a weak
 * box is cheaply filtered downstream by the quality gate.
 */
export const DETECT_THRESHOLD = 0.25;

/**
 * Plate width in source pixels below which recognition is not attempted.
 *
 * Measured on this project's footage: the same plate is 68px wide at 1080p and
 * reads exactly; at 30px nothing legible survives. Recognition is refused
 * rather than guessed below this, because a confident wrong registration is
 * worse than an honest gap.
 */
export const MIN_PLATE_WIDTH = 42;

/** Above this width a crop is treated as full quality for weighting purposes. */
export const GOOD_PLATE_WIDTH = 70;

/** Variance-of-Laplacian floor; below this a crop is flagged as blurred. */
export const MIN_SHARPNESS = 18;

/** Luminance standard-deviation floor; below this a crop is washed out. */
export const MIN_CONTRAST = 22;

/**
 * A character may only be format-repaired below this confidence.
 * Above it the recogniser is taken at its word and the reading is reported as
 * non-conforming instead of being rewritten into something plausible.
 */
export const REPAIR_CEILING = 0.9;

/**
 * Refusal floor on the WEAKEST character in a reading.
 *
 * Measured across both evaluation sets (eval/confidence-analysis.mjs, n=137
 * reads), minimum-character confidence separates good reads from bad almost
 * cleanly, and far better than mean confidence does:
 *
 *   correct reads      median weakest-character confidence  99%
 *   incorrect reads    median                               39%
 *   no plate present   median                                0%
 *
 * What a floor buys, on the same data:
 *
 *   floor  kept  correct  wrong  no-plate suppressed  precision
 *   0.00    137      116     19                    0      84.7%
 *   0.30    123      112     10                    4      91.1%
 *   0.60    108      102      6                    5      94.4%
 *   0.90     79       79      0                    5     100.0%
 *
 * 0.30 is used as the hard refusal floor: it removes half the errors and all
 * but one no-plate hallucination while discarding only 4 correct reads. It is
 * deliberately NOT set at 0.90 — that would reach 100% precision per frame but
 * throw away evidence that temporal aggregation uses productively, and a
 * marginal frame that agrees with three good ones is useful, not harmful.
 * Trust for display is governed separately, by TRUSTED_WEAKEST below.
 */
export const MIN_CHARACTER_CONFIDENCE = 0.3;

/** Readings weaker than this contribute nothing to aggregation. */
export const MIN_USABLE_CONFIDENCE = 0.35;

/**
 * Aggregate thresholds for presenting a plate as trustworthy.
 * At a weakest-character agreement of 0.90 the measured precision was 100%,
 * so that is what "high confidence" means on screen.
 */
export const TRUSTED_CONFIDENCE = 0.9;
export const TRUSTED_WEAKEST = 0.9;

/** Readings retained per tracked vehicle before aggregation stops improving. */
export const MAX_OBSERVATIONS = 8;

/** Recogniser input geometry, fixed by the model's published config. */
export const OCR_INPUT_WIDTH = 128;
export const OCR_INPUT_HEIGHT = 64;

/** Detector input geometry, fixed by the chosen model variant. */
export const DETECTOR_INPUT_SIZE = 384;
