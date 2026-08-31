/**
 * Multi-frame evidence aggregation.
 *
 * A single frame of a moving vehicle is not trustworthy: the plate is at an
 * angle for part of the pass, motion-blurred for another part, and legible for
 * only a few frames in between. A tracked vehicle gives several independent
 * looks at the same registration, and the useful question is what the evidence
 * as a whole supports.
 *
 * The previous implementation took a plain per-character majority, which
 * weights a blurred distant frame exactly the same as a sharp close one. Here
 * every observation is weighted by the recogniser's own confidence in that
 * character multiplied by the crop's quality factor, so a clean read outvotes a
 * marginal one instead of being outnumbered by it.
 *
 * Reported confidence is the aggregated weight behind the winning character,
 * not an average of model scores — it answers "how much of the evidence agrees"
 * rather than "how sure was the model on a good day".
 */

import { validatePlate } from "./grammar.js";

import {
  MIN_USABLE_CONFIDENCE,
  TRUSTED_CONFIDENCE,
  TRUSTED_WEAKEST,
} from "./config.js";

/**
 * @param {Array} observations recognisePlate results for one tracked vehicle
 * @returns {object|null} aggregated result with full provenance
 */
export function aggregateReadings(observations) {
  const usable = observations.filter(
    (item) =>
      !item.rejected &&
      item.text.length > 0 &&
      // Filter on the weakest character rather than the mean: a reading with
      // nine confident characters and one guess is a wrong registration, and
      // the mean hides exactly that.
      item.minConfidence >= MIN_USABLE_CONFIDENCE,
  );

  if (usable.length === 0) {
    return {
      plate: null,
      conforms: false,
      confidence: 0,
      samples: 0,
      considered: observations.length,
      reason:
        observations.length === 0
          ? "No plate has been read for this vehicle yet."
          : "Every read so far was rejected or too weak to use.",
      observations,
    };
  }

  // Vote only among readings of the modal length. A truncated read would
  // otherwise shift every character after the gap out of alignment.
  const lengths = new Map();

  for (const item of usable) {
    const weight = item.meanConfidence * item.quality.factor;

    lengths.set(item.text.length, (lengths.get(item.text.length) ?? 0) + weight);
  }

  const modalLength = [...lengths.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const aligned = usable.filter((item) => item.text.length === modalLength);

  const characters = [];
  let agreementTotal = 0;

  for (let i = 0; i < modalLength; i += 1) {
    const votes = new Map();
    // The recogniser's own confidence in the winning character, kept apart
    // from how often it was voted for. These are different questions and
    // conflating them caused a real failure: two frames agreeing on the same
    // misread give 100% agreement, which then blocked format repair on a
    // character the model itself was only 60% sure of.
    const modelConfidence = new Map();
    let castTotal = 0;

    for (const item of aligned) {
      const entry = item.characters[i];

      if (!entry) {
        continue;
      }

      // Confidence in this character × how good the crop was.
      const weight = entry.confidence * item.quality.factor;

      votes.set(entry.char, (votes.get(entry.char) ?? 0) + weight);

      const seen = modelConfidence.get(entry.char) ?? { sum: 0, n: 0 };

      modelConfidence.set(entry.char, {
        sum: seen.sum + entry.confidence,
        n: seen.n + 1,
      });

      castTotal += weight;
    }

    const [char, weight] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];

    const share = castTotal === 0 ? 0 : weight / castTotal;
    const seen = modelConfidence.get(char);

    characters.push({
      char,
      // Agreement across frames — what the display reports.
      confidence: share,
      // What the recogniser actually thought — what format repair may act on.
      modelConfidence: seen ? seen.sum / seen.n : 0,
      weight,
    });

    agreementTotal += share;
  }

  const consensus = characters.map((entry) => entry.char).join("");
  const weakestModel = Math.min(
    ...characters.map((entry) => entry.modelConfidence ?? 0),
  );
  const validated = validatePlate(consensus, characters);

  const confidence = agreementTotal / modalLength;

  return {
    plate: validated.plate,
    raw: validated.raw,
    format: validated.format,
    formatId: validated.formatId,
    conforms: validated.conforms,
    repairs: validated.repairs,
    confidence,
    // The weakest position governs trust — one wrong digit is a wrong vehicle.
    // Two numbers, deliberately kept apart:
    //   weakest       lowest cross-frame AGREEMENT
    //   weakestModel  lowest confidence the RECOGNISER itself expressed
    // Frames that repeat a misread agree perfectly, so agreement alone will
    // happily certify a wrong plate. Observed live: three frames agreed on
    // LT69MOO against a true LT69MDO and it was shown as high confidence.
    weakest: Math.min(...characters.map((entry) => entry.confidence)),
    weakestModel,
    characters,
    samples: aligned.length,
    considered: observations.length,
    bestCrop: pickBestCrop(aligned),
    observations,
  };
}

/** The sharpest, largest crop, for the evidence record. */
function pickBestCrop(observations) {
  let best = null;
  let bestScore = -Infinity;

  for (const item of observations) {
    const score = item.quality.factor * item.meanConfidence;

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best?.crop ?? null;
}

/**
 * How a result should be presented to an operator.
 * Deliberately conservative: uncertainty is shown, never rounded away.
 */
export function describeCertainty(result) {
  if (!result?.plate) {
    return { level: "none", label: "No read", tone: "text-slate-600" };
  }

  if (!result.conforms) {
    return {
      level: "unverified",
      label: "Unverified format",
      tone: "text-amber-300",
    };
  }

  // Trust requires the frames to agree AND the recogniser to have been sure.
  // Agreement alone is not evidence: a misread repeated three times agrees
  // perfectly with itself.
  if (
    result.confidence >= TRUSTED_CONFIDENCE &&
    result.weakest >= TRUSTED_WEAKEST &&
    (result.weakestModel ?? 0) >= TRUSTED_WEAKEST &&
    result.samples >= 2
  ) {
    return { level: "high", label: "High confidence", tone: "text-emerald-300" };
  }

  if (result.confidence >= 0.7) {
    return { level: "medium", label: "Probable", tone: "text-amber-300" };
  }

  return { level: "low", label: "Low confidence", tone: "text-red-300" };
}
