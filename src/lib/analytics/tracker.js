/**
 * Multi-object tracker.
 *
 * Detection alone gives you a box per frame with no memory — it cannot tell
 * you that the person at frame 40 is the same person from frame 12, so it can
 * never say "loitering", "crossed inward", or "moving toward the fence". This
 * greedily associates detections to existing tracks by IoU and gives each one a
 * stable identity, a trail, and a dwell clock. That identity is what turns raw
 * boxes into behaviour.
 *
 * Deliberately simple: greedy IoU with an age-out. A Kalman/ReID tracker would
 * be more robust under occlusion, but on fixed CCTV at these frame rates the
 * extra machinery buys little and costs a lot of latency in the browser.
 */

import { anchorOf, iou, pointInPolygon } from "./geometry";
import { DOMAIN } from "./classes";

const DEFAULTS = {
  iouThreshold: 0.24,
  maxMissed: 8,
  minHits: 2,
  trailLength: 40,
};

export function createTracker(options = {}) {
  const config = { ...DEFAULTS, ...options };

  let tracks = [];
  let counter = 0;

  function spawn(detection, timestamp) {
    counter += 1;

    const anchor = anchorOf(detection.box, {
      footAnchor: detection.domain === DOMAIN.PERSON,
    });

    return {
      id: `T-${String(counter).padStart(3, "0")}`,
      domain: detection.domain,
      display: detection.display,
      subtype: detection.subtype,
      label: detection.label,
      box: detection.box,
      anchor,
      confidence: detection.confidence,
      firstSeen: timestamp,
      lastSeen: timestamp,
      hits: 1,
      missed: 0,
      trail: [anchor],
      zoneState: {},
      confirmed: config.minHits <= 1,
    };
  }

  function absorb(track, detection, timestamp) {
    const anchor = anchorOf(detection.box, {
      footAnchor: detection.domain === DOMAIN.PERSON,
    });

    track.box = detection.box;
    track.anchor = anchor;
    track.confidence = detection.confidence;
    track.lastSeen = timestamp;
    track.hits += 1;
    track.missed = 0;
    track.trail = [...track.trail, anchor].slice(-config.trailLength);

    // A track can be reclassified if the detector changes its mind — trust the
    // higher-confidence reading rather than whatever arrived first.
    if (detection.confidence > track.confidence) {
      track.domain = detection.domain;
      track.display = detection.display;
      track.subtype = detection.subtype;
      track.label = detection.label;
    }

    if (track.hits >= config.minHits) {
      track.confirmed = true;
    }
  }

  /**
   * Advance the tracker by one processed frame.
   *
   * @param {Array} detections normalised detections for this frame
   * @param {number} timestamp seconds into the feed
   * @returns {{ tracks: Array, born: Array, died: Array }}
   */
  function update(detections, timestamp) {
    const unmatchedTracks = new Set(tracks.map((track) => track.id));
    const pairs = [];

    for (const detection of detections) {
      for (const track of tracks) {
        if (track.domain !== detection.domain) {
          continue;
        }

        const score = iou(track.box, detection.box);

        if (score >= config.iouThreshold) {
          pairs.push({ score, track, detection });
        }
      }
    }

    // Greedy: strongest overlaps claim their track first.
    pairs.sort((a, b) => b.score - a.score);

    const claimedDetections = new Set();
    const claimedTracks = new Set();

    for (const pair of pairs) {
      if (claimedTracks.has(pair.track.id) || claimedDetections.has(pair.detection)) {
        continue;
      }

      absorb(pair.track, pair.detection, timestamp);

      claimedTracks.add(pair.track.id);
      claimedDetections.add(pair.detection);
      unmatchedTracks.delete(pair.track.id);
    }

    const born = [];

    for (const detection of detections) {
      if (!claimedDetections.has(detection)) {
        const track = spawn(detection, timestamp);

        tracks.push(track);
        born.push(track);
      }
    }

    const died = [];

    for (const track of tracks) {
      if (unmatchedTracks.has(track.id)) {
        track.missed += 1;
      }
    }

    tracks = tracks.filter((track) => {
      const alive = track.missed <= config.maxMissed;

      if (!alive) {
        died.push(track);
      }

      return alive;
    });

    return {
      tracks: tracks.filter((track) => track.confirmed && track.missed === 0),
      all: tracks,
      born,
      died,
    };
  }

  /**
   * Evaluate every track against every fence, returning the crossings that
   * happened on this frame. Zone membership is remembered per track, so an
   * object sitting inside a zone fires once on entry rather than every frame.
   */
  function evaluateZones(activeTracks, zones, timestamp) {
    const events = [];

    for (const track of activeTracks) {
      for (const zone of zones) {
        const previous = track.zoneState[zone.id] ?? {
          inside: false,
          since: null,
          fired: false,
        };

        const inside = pointInPolygon(track.anchor, zone.polygon);
        const applies = zone.rule.classes.includes(track.domain);

        const next = {
          inside,
          since: inside ? (previous.since ?? timestamp) : null,
          fired: inside ? previous.fired : false,
        };

        if (!applies) {
          track.zoneState[zone.id] = next;
          continue;
        }

        const dwell = inside && next.since !== null ? timestamp - next.since : 0;

        const entered = inside && !previous.inside;
        const dwelled =
          inside &&
          zone.rule.trigger === "dwell" &&
          dwell >= zone.rule.dwellSeconds;

        const shouldFire =
          !previous.fired &&
          ((zone.rule.trigger !== "dwell" && entered) || dwelled);

        if (shouldFire) {
          next.fired = true;

          events.push({
            track,
            zone,
            dwell,
            timestamp,
            trigger: zone.rule.trigger,
          });
        }

        track.zoneState[zone.id] = next;
      }
    }

    return events;
  }

  function reset() {
    tracks = [];
    counter = 0;
  }

  return {
    update,
    evaluateZones,
    reset,
    get tracks() {
      return tracks;
    },
  };
}
