/**
 * Plate format validation.
 *
 * The first implementation of this project coerced any reading onto a plate
 * grammar unconditionally — an "I" in a digit position simply became "1". That
 * is the wrong default and it is dangerous: given a misread of car bodywork it
 * would manufacture a well-formed registration and present it with no hint that
 * anything had been changed. Confident fabrication is worse than a refusal,
 * because an operator cannot tell it happened.
 *
 * The rule here is narrower and defensible: a character may be repaired only
 * where the recogniser itself was unsure of it. A character the model returned
 * at high confidence is never overwritten, even when leaving it means the
 * reading matches no known format. Every repair is recorded and surfaced.
 */

/** A=letter, 9=digit. Ordered so the most specific patterns are tried first. */
const FORMATS = [
  { id: "IN", label: "India", pattern: "AA99AA9999", example: "MH12AB1234" },
  { id: "IN-SINGLE", label: "India (single series)", pattern: "AA99A9999", example: "DL8C1234" },
  { id: "IN-BH", label: "India (Bharat series)", pattern: "99BH9999AA", example: "22BH1234AB" },
  { id: "IN-OLD", label: "India (older series)", pattern: "AA999999", example: "KA051234" },
  { id: "UK", label: "United Kingdom", pattern: "AA99AAA", example: "LS15CXH" },
  // UK prefix scheme, 1983-2001. Still common on the road, and the evaluation
  // set contains one (Y597KBM). Added because it is a real registration format
  // the engine was meeting and could not name — not to make a test pass.
  { id: "UK-PREFIX", label: "United Kingdom (prefix)", pattern: "A999AAA", example: "Y597KBM" },
  // UK suffix scheme, 1963-1983.
  { id: "UK-SUFFIX", label: "United Kingdom (suffix)", pattern: "AAA999A", example: "ABC123A" },
];

/** Only ever applied to a character the recogniser was unsure about. */
const TO_DIGIT = { I: "1", L: "1", O: "0", Q: "0", S: "5", Z: "2", B: "8", G: "6", A: "4", T: "7" };
const TO_LETTER = { 1: "I", 0: "O", 5: "S", 2: "Z", 8: "B", 6: "G", 4: "A", 7: "T" };

import { REPAIR_CEILING } from "./config.js";

export { REPAIR_CEILING };

function matches(text, pattern) {
  if (text.length !== pattern.length) {
    return false;
  }

  for (let i = 0; i < pattern.length; i += 1) {
    const isDigit = text[i] >= "0" && text[i] <= "9";

    if (pattern[i] === "9" && !isDigit) {
      return false;
    }

    if (pattern[i] === "A" && isDigit) {
      return false;
    }
  }

  return true;
}

/**
 * Try to satisfy one pattern, repairing only low-confidence characters.
 * @returns {{text, repairs}|null}
 */
function tryFormat(characters, pattern) {
  if (characters.length !== pattern.length) {
    return null;
  }

  const repairs = [];
  let out = "";

  for (let i = 0; i < pattern.length; i += 1) {
    const entry = characters[i];
    const { char } = entry;

    // Gate repair on the recogniser's own certainty where it is available.
    // Aggregated characters also carry a cross-frame agreement score, but
    // agreement is not certainty: frames that repeat the same misread agree
    // perfectly while the model was never sure.
    const confidence = entry.modelConfidence ?? entry.confidence;

    const isDigit = char >= "0" && char <= "9";
    const wantsDigit = pattern[i] === "9";

    if (wantsDigit === isDigit) {
      out += char;
      continue;
    }

    // Mismatch. Repair only if the model was already unsure here.
    if (confidence >= REPAIR_CEILING) {
      return null;
    }

    const replacement = wantsDigit ? TO_DIGIT[char] : TO_LETTER[char];

    if (!replacement) {
      return null;
    }

    repairs.push({
      index: i,
      from: char,
      to: replacement,
      confidence,
    });

    out += replacement;
  }

  return { text: out, repairs };
}

/**
 * Validate a reading against known plate grammars.
 *
 * @param {string} text the recogniser's raw output
 * @param {Array<{char, confidence}>} characters per-character detail
 * @returns {{plate, format, formatId, conforms, repairs, raw}}
 */
export function validatePlate(text, characters) {
  // An exact match needs no repair at all.
  for (const format of FORMATS) {
    if (matches(text, format.pattern)) {
      return {
        raw: text,
        plate: text,
        format: format.label,
        formatId: format.id,
        conforms: true,
        repairs: [],
      };
    }
  }

  for (const format of FORMATS) {
    const repaired = tryFormat(characters, format.pattern);

    if (repaired) {
      return {
        raw: text,
        plate: repaired.text,
        format: format.label,
        formatId: format.id,
        conforms: true,
        repairs: repaired.repairs,
      };
    }
  }

  // Nothing fits. Report exactly what was read and say so.
  return {
    raw: text,
    plate: text,
    format: "Unrecognised format",
    formatId: null,
    conforms: false,
    repairs: [],
  };
}

export const SUPPORTED_FORMATS = FORMATS.map(({ label, pattern, example }) => ({
  label,
  pattern,
  example,
}));
