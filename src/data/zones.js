/**
 * Virtual fences.
 *
 * A virtual fence is the platform's substitute for a physical sensor line: a
 * polygon drawn over a camera's field of view plus a rule about what may cross
 * it. Because it lives in software, an operator can redraw it in seconds and
 * every camera in the estate can have one — no trenching, no beam sensors.
 *
 * Polygon points are normalised to the frame (0..1 from the top-left), so a
 * fence keeps its meaning whatever resolution the camera streams at.
 */

export const zones = [
  {
    id: "zone-restricted-4",
    cameraId: "BOP-03",
    name: "Restricted Zone 4",
    kind: "restricted",
    criticality: 1.35,
    polygon: [
      [0.52, 0.28],
      [0.96, 0.24],
      [0.96, 0.92],
      [0.46, 0.92],
    ],
    rule: {
      classes: ["person", "vehicle"],
      trigger: "enter",
      dwellSeconds: 0,
      severity: "high",
    },
    note: "No civilian access. Any presence is reportable.",
  },
  {
    id: "zone-road-tripwire",
    cameraId: "ROAD-04",
    name: "Km 14 Tripwire",
    kind: "tripwire",
    criticality: 1.1,
    polygon: [
      [0.06, 0.55],
      [0.94, 0.55],
      [0.94, 0.78],
      [0.06, 0.78],
    ],
    rule: {
      classes: ["vehicle"],
      trigger: "cross",
      dwellSeconds: 0,
      severity: "medium",
    },
    note: "Counts and identifies vehicles moving toward the border.",
  },
  {
    id: "zone-night-perimeter",
    cameraId: "BOP-07",
    name: "East Perimeter Line",
    kind: "fence",
    criticality: 1.5,
    polygon: [
      [0.1, 0.34],
      [0.9, 0.3],
      [0.9, 0.95],
      [0.1, 0.95],
    ],
    rule: {
      classes: ["person", "vehicle"],
      trigger: "enter",
      dwellSeconds: 0,
      severity: "high",
    },
    note: "Hours of darkness — any crossing escalates automatically.",
  },
  {
    id: "zone-barrier-approach",
    cameraId: "CHK-01",
    name: "Barrier Approach",
    kind: "restricted",
    criticality: 1.0,
    polygon: [
      [0.28, 0.42],
      [0.78, 0.42],
      [0.86, 0.94],
      [0.2, 0.94],
    ],
    rule: {
      classes: ["person", "vehicle"],
      trigger: "dwell",
      dwellSeconds: 4,
      severity: "medium",
    },
    note: "Loitering at the barrier for more than 4s is flagged.",
  },
  {
    id: "zone-south-watchtower",
    cameraId: "BOP-09",
    name: "South Approach",
    kind: "restricted",
    criticality: 1.2,
    polygon: [
      [0.04, 0.36],
      [0.5, 0.36],
      [0.5, 0.96],
      [0.04, 0.96],
    ],
    rule: {
      classes: ["person"],
      trigger: "enter",
      dwellSeconds: 0,
      severity: "medium",
    },
    note: "Foot approach to the watchtower base.",
  },
  {
    id: "zone-west-approach",
    cameraId: "BOP-04",
    name: "West Approach",
    kind: "fence",
    criticality: 1.15,
    polygon: [
      [0.3, 0.3],
      [0.98, 0.3],
      [0.98, 0.9],
      [0.3, 0.9],
    ],
    rule: {
      classes: ["person", "vehicle"],
      trigger: "enter",
      dwellSeconds: 0,
      severity: "medium",
    },
    note: "Degraded feed — detections carry a confidence penalty.",
  },
  {
    id: "zone-plate-point",
    cameraId: "ROAD-06",
    name: "Km 14 Plate Point",
    kind: "tripwire",
    criticality: 1.1,
    polygon: [
      [0.04, 0.42],
      [0.72, 0.42],
      [0.72, 0.66],
      [0.04, 0.66],
    ],
    rule: {
      classes: ["vehicle"],
      trigger: "enter",
      dwellSeconds: 0,
      severity: "medium",
    },
    note: "Every vehicle crossing is identified and checked against the register.",
  },
  {
    id: "zone-pedestrian-lane",
    cameraId: "CHK-02",
    name: "Pedestrian Lane",
    kind: "restricted",
    criticality: 0.9,
    polygon: [
      [0.34, 0.4],
      [0.72, 0.4],
      [0.78, 0.96],
      [0.26, 0.96],
    ],
    rule: {
      classes: ["person"],
      trigger: "dwell",
      dwellSeconds: 6,
      severity: "low",
    },
    note: "Routine footfall — counted, escalated only on loitering.",
  },
];

export function getZonesForCamera(cameraId) {
  return zones.filter((zone) => zone.cameraId === cameraId);
}

export function getZone(id) {
  return zones.find((zone) => zone.id === id) ?? null;
}
