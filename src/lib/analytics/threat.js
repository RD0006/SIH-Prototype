/**
 * Contextual threat scoring.
 *
 * A detection is not a threat. A person on a road at noon is traffic; the same
 * person crossing a perimeter line at 02:00, carrying a bag, having already
 * been seen on another camera, is something an operator must look at now.
 * Conventional systems alert on both identically, which is precisely why
 * operators stop trusting them.
 *
 * Every score returned here carries the factors that produced it, so the
 * console can show *why* something scored 87 rather than asking an operator to
 * trust an unexplained number. An operator who can see the reasoning can
 * overrule it; one who cannot will eventually ignore the whole system.
 */

import { baseThreat, BENIGN, DOMAIN } from "./classes";
import { distance } from "./geometry";

export const SEVERITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export function severityOf(score) {
  if (score >= 72) {
    return SEVERITY.HIGH;
  }

  if (score >= 44) {
    return SEVERITY.MEDIUM;
  }

  return SEVERITY.LOW;
}

/**
 * @param {object} input
 * @param {object} input.track    the tracked object that triggered the rule
 * @param {object} input.zone     the fence it crossed
 * @param {object} input.camera   the camera that saw it
 * @param {Array}  input.peers    other confirmed tracks in the same frame
 * @param {number} input.sightings how many distinct cameras have seen this identity
 * @param {number} input.dwell    seconds spent inside the zone
 * @param {boolean} input.night   whether the scene is in hours of darkness
 */
export function scoreThreat({
  track,
  zone,
  camera,
  peers = [],
  sightings = 1,
  dwell = 0,
  night = false,
}) {
  const factors = [];

  const push = (label, delta, why) => {
    if (delta !== 0) {
      factors.push({ label, delta: Math.round(delta), why });
    }
  };

  // Livestock and background clutter never escalate on their own.
  if (BENIGN.has(track.domain)) {
    return {
      score: 0,
      severity: SEVERITY.LOW,
      suppressed: true,
      factors: [
        {
          label: `${track.display} identified`,
          delta: 0,
          why: "Recognised as non-threat — suppressed rather than alerted. Livestock is the largest source of false alarms on motion-triggered systems.",
        },
      ],
    };
  }

  let score = baseThreat(track.domain);

  push(
    `${track.display} detected`,
    score,
    `Base weighting for a ${track.display.toLowerCase()} in a monitored area.`,
  );

  // Zone criticality — a restricted military zone matters more than a lane.
  const zoneDelta = score * (zone.criticality - 1);

  push(
    `Zone: ${zone.name}`,
    zoneDelta,
    `${zone.kind === "fence" ? "Perimeter fence" : zone.kind === "tripwire" ? "Tripwire" : "Restricted area"} with criticality ×${zone.criticality.toFixed(2)}.`,
  );

  score += zoneDelta;

  // Darkness. Legitimate activity at a border collapses after dark.
  if (night) {
    push(
      "Hours of darkness",
      14,
      "Movement during darkness carries materially higher intent. Detected on a low-light feed.",
    );

    score += 14;
  }

  // Loitering.
  if (dwell >= 4) {
    const delta = Math.min(12, 3 + dwell);

    push(
      `Dwell ${dwell.toFixed(1)}s`,
      delta,
      "Sustained presence rather than transit — consistent with observation or waiting.",
    );

    score += delta;
  }

  // Group behaviour — several people entering together is coordinated.
  const companions = peers.filter(
    (peer) => peer.id !== track.id && peer.domain === DOMAIN.PERSON,
  ).length;

  if (track.domain === DOMAIN.PERSON && companions >= 1) {
    const delta = Math.min(16, 6 * companions);

    push(
      `Group of ${companions + 1}`,
      delta,
      "Multiple persons moving together — coordinated movement is weighted above a lone subject.",
    );

    score += delta;
  }

  // Carried objects in frame alongside a person.
  const carrying = peers.some((peer) => peer.domain === DOMAIN.CARRIED);

  if (track.domain === DOMAIN.PERSON && carrying) {
    push(
      "Carrying a load",
      7,
      "A bag or pack detected with the subject — relevant to smuggling indicators.",
    );

    score += 7;
  }

  // Cross-camera persistence — the platform-level signal no single camera has.
  if (sightings > 1) {
    const delta = Math.min(18, 9 * (sightings - 1));

    push(
      `Seen on ${sightings} cameras`,
      delta,
      "The same identity has been re-acquired across separate cameras — a sustained track, not a momentary reading.",
    );

    score += delta;
  }

  // Direction of travel — inbound is worse than outbound.
  if (track.trail.length >= 6) {
    const start = track.trail[0];
    const end = track.trail[track.trail.length - 1];
    const travelled = distance(start, end);

    if (travelled > 0.08) {
      const inbound = end.y > start.y;

      push(
        inbound ? "Moving inward" : "Moving outward",
        inbound ? 9 : -6,
        inbound
          ? "Trajectory is toward the interior — consistent with an ingress attempt."
          : "Trajectory is away from the interior — de-escalated.",
      );

      score += inbound ? 9 : -6;
    }
  }

  // Detector confidence and feed quality temper the whole score. A degraded
  // camera should not produce confident-looking alerts.
  if (track.confidence < 0.6) {
    const delta = -Math.round((0.6 - track.confidence) * 30);

    push(
      `Confidence ${(track.confidence * 100).toFixed(0)}%`,
      delta,
      "Detector confidence below threshold — score tempered to avoid overstating certainty.",
    );

    score += delta;
  }

  if (camera?.status === "degraded") {
    push(
      "Degraded feed",
      -8,
      `${camera.id} is running at reduced frame rate; evidence quality is lower.`,
    );

    score -= 8;
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: clamped,
    severity: severityOf(clamped),
    suppressed: false,
    factors,
  };
}

/** Recompute severity bands for seeded/static incident data. */
export function describeSeverity(severity) {
  return {
    [SEVERITY.HIGH]: {
      dot: "bg-red-400",
      text: "text-red-300",
      ring: "border-red-900/50 bg-red-950/20 text-red-300/90",
      label: "High",
    },
    [SEVERITY.MEDIUM]: {
      dot: "bg-amber-400",
      text: "text-amber-300",
      ring: "border-amber-900/50 bg-amber-950/20 text-amber-300/90",
      label: "Medium",
    },
    [SEVERITY.LOW]: {
      dot: "bg-sky-400",
      text: "text-sky-300",
      ring: "border-sky-900/50 bg-sky-950/20 text-sky-300/90",
      label: "Low",
    },
  }[severity] ?? {
    dot: "bg-slate-400",
    text: "text-slate-300",
    ring: "border-slate-800 bg-slate-900/30 text-slate-400",
    label: "Info",
  };
}
