/**
 * Deterministic replay source.
 *
 * Used when the neural engine cannot start — an old browser at the venue, a
 * machine with WASM disabled, weights that were never vendored. Rather than
 * showing an operator a broken console, the platform degrades to a scripted
 * scenario that exercises exactly the same tracker, fence and scoring code
 * paths as live inference does.
 *
 * This is clearly labelled as simulated wherever it is displayed. It exists so
 * that a failure of the model is not a failure of the demonstration, and so the
 * downstream analytics can be developed and tested without burning inference on
 * every reload.
 *
 * Motion is generated from a fixed script, not from randomness, so the same
 * second of playback always produces the same scene.
 */

import { DOMAIN } from "../analytics/classes";

/** Actors per camera. Each moves along a straight line over a time window. */
const SCRIPTS = {
  "BOP-03": [
    {
      label: "person",
      domain: DOMAIN.PERSON,
      display: "Person",
      from: [0.12, 0.55],
      to: [0.78, 0.62],
      enters: 1.5,
      leaves: 14,
      size: [0.07, 0.22],
      confidence: 0.81,
    },
    {
      label: "person",
      domain: DOMAIN.PERSON,
      display: "Person",
      from: [0.05, 0.6],
      to: [0.7, 0.66],
      enters: 3.2,
      leaves: 14,
      size: [0.07, 0.21],
      confidence: 0.74,
    },
    {
      label: "backpack",
      domain: DOMAIN.CARRIED,
      display: "Backpack",
      from: [0.1, 0.54],
      to: [0.76, 0.61],
      enters: 1.7,
      leaves: 14,
      size: [0.035, 0.07],
      confidence: 0.58,
    },
    {
      label: "cow",
      domain: DOMAIN.LIVESTOCK,
      display: "Cow",
      from: [0.9, 0.75],
      to: [0.4, 0.8],
      enters: 0,
      leaves: 20,
      size: [0.12, 0.14],
      confidence: 0.69,
    },
  ],
  "ROAD-04": [
    {
      label: "truck",
      domain: DOMAIN.VEHICLE,
      display: "Truck",
      subtype: "Truck",
      from: [-0.2, 0.6],
      to: [1.1, 0.66],
      enters: 0.5,
      leaves: 11,
      size: [0.26, 0.24],
      confidence: 0.88,
    },
    {
      label: "car",
      domain: DOMAIN.VEHICLE,
      display: "Car",
      subtype: "Car",
      from: [1.15, 0.63],
      to: [-0.15, 0.58],
      enters: 4,
      leaves: 16,
      size: [0.17, 0.16],
      confidence: 0.83,
    },
  ],
  "BOP-07": [
    {
      label: "person",
      domain: DOMAIN.PERSON,
      display: "Person",
      from: [0.2, 0.42],
      to: [0.62, 0.84],
      enters: 2,
      leaves: 18,
      size: [0.06, 0.19],
      confidence: 0.64,
    },
    {
      label: "person",
      domain: DOMAIN.PERSON,
      display: "Person",
      from: [0.26, 0.4],
      to: [0.68, 0.82],
      enters: 2.6,
      leaves: 18,
      size: [0.06, 0.18],
      confidence: 0.61,
    },
  ],
  "CHK-01": [
    {
      label: "car",
      domain: DOMAIN.VEHICLE,
      display: "Car",
      subtype: "Car",
      from: [0.55, 0.5],
      to: [0.5, 0.62],
      enters: 0.5,
      leaves: 20,
      size: [0.2, 0.2],
      confidence: 0.86,
    },
    {
      label: "person",
      domain: DOMAIN.PERSON,
      display: "Person",
      from: [0.34, 0.55],
      to: [0.44, 0.7],
      enters: 1,
      leaves: 20,
      size: [0.06, 0.2],
      confidence: 0.77,
    },
  ],
};

const DEFAULT_SCRIPT = SCRIPTS["BOP-03"];

/**
 * Build a replay source for one camera.
 *
 * @param {string} cameraId
 * @returns {{ detectAt: (t: number) => { detections: Array, latency: number } }}
 */
export function createReplaySource(cameraId) {
  const script = SCRIPTS[cameraId] ?? DEFAULT_SCRIPT;

  function detectAt(time) {
    const detections = [];

    for (const actor of script) {
      if (time < actor.enters || time > actor.leaves) {
        continue;
      }

      const span = actor.leaves - actor.enters;
      const ratio = span <= 0 ? 0 : (time - actor.enters) / span;

      // A little easing so movement does not look metronomic.
      const eased = ratio + Math.sin(ratio * Math.PI * 2) * 0.012;

      const cx = actor.from[0] + (actor.to[0] - actor.from[0]) * eased;
      const cy = actor.from[1] + (actor.to[1] - actor.from[1]) * eased;

      const [w, h] = actor.size;

      const box = {
        xmin: cx - w / 2,
        ymin: cy - h / 2,
        xmax: cx + w / 2,
        ymax: cy + h / 2,
      };

      // Off-frame actors are simply not detected, as with a real camera.
      if (box.xmax < 0 || box.xmin > 1) {
        continue;
      }

      detections.push({
        label: actor.label,
        domain: actor.domain,
        display: actor.display,
        subtype: actor.subtype ?? null,
        confidence:
          actor.confidence + Math.sin(time * 3 + actor.enters) * 0.03,
        box: {
          xmin: Math.max(0, box.xmin),
          ymin: Math.max(0, box.ymin),
          xmax: Math.min(1, box.xmax),
          ymax: Math.min(1, box.ymax),
        },
      });
    }

    return { detections, latency: 0 };
  }

  return { detectAt };
}

export function hasScript(cameraId) {
  return cameraId in SCRIPTS;
}
