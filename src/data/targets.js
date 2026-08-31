/**
 * Cross-camera identities.
 *
 * A single camera can only tell you something was there. The platform's value
 * is in joining sightings across cameras into one identity with a path and a
 * direction of travel — which is what lets an operator say "this group is
 * moving toward Check Post 1" rather than "three cameras alarmed".
 *
 * Sighting positions are on the operational map (percent), matching the
 * coordinate space used by cameras.js, so a track can be drawn straight onto
 * the sector view.
 */

export const targets = [
  {
    id: "T-024",
    domain: "person",
    display: "Group of 2 — on foot",
    status: "active",
    threat: 87,
    severity: "high",
    firstSeen: "21:31",
    lastSeen: "21:43",
    heading: "North-east, toward Check Post 1",
    speed: "4.2 km/h",
    summary:
      "Two persons re-acquired across three cameras over twelve minutes, moving consistently inward after crossing the east perimeter line during darkness.",
    sightings: [
      {
        cameraId: "BOP-03",
        clock: "21:31",
        position: { x: 22, y: 30 },
        confidence: 0.71,
        note: "First acquisition — two persons entering frame from the west.",
      },
      {
        cameraId: "ROAD-04",
        clock: "21:37",
        position: { x: 47, y: 48 },
        confidence: 0.66,
        note: "Re-identified crossing the border road at Km 14.",
      },
      {
        cameraId: "BOP-07",
        clock: "21:43",
        position: { x: 72, y: 34 },
        confidence: 0.64,
        note: "Perimeter line crossed inbound. Alert INC-0241 raised.",
      },
    ],
    incidentIds: ["INC-0241"],
  },
  {
    id: "T-021",
    domain: "vehicle",
    display: "Truck — HR26 DK 8337",
    status: "active",
    threat: 79,
    severity: "high",
    firstSeen: "21:36",
    lastSeen: "21:39",
    heading: "East, along border road",
    speed: "38 km/h",
    summary:
      "Heavy vehicle detected on the border road with a plate that does not appear on the sector's permitted register.",
    sightings: [
      {
        cameraId: "ROAD-02",
        clock: "21:36",
        position: { x: 30, y: 62 },
        confidence: 0.58,
        note: "Partial acquisition before the Km 6 feed dropped.",
      },
      {
        cameraId: "ROAD-04",
        clock: "21:39",
        position: { x: 47, y: 48 },
        confidence: 0.88,
        note: "Plate read at Km 14 tripwire. Alert INC-0239 raised.",
      },
    ],
    incidentIds: ["INC-0239"],
  },
  {
    id: "T-019",
    domain: "person",
    display: "Lone person — carrying pack",
    status: "lost",
    threat: 60,
    severity: "medium",
    firstSeen: "21:34",
    lastSeen: "21:35",
    heading: "Unknown — track lost",
    speed: "—",
    summary:
      "Single subject with a carried load entered the west approach. Track lost when BOP-04 degraded to 12 fps; no re-acquisition on adjacent cameras.",
    sightings: [
      {
        cameraId: "BOP-04",
        clock: "21:34",
        position: { x: 14, y: 52 },
        confidence: 0.55,
        note: "Entered west approach fence. Alert INC-0237 raised.",
      },
    ],
    incidentIds: ["INC-0237"],
  },
];

export function getTarget(id) {
  return targets.find((target) => target.id === id) ?? null;
}
