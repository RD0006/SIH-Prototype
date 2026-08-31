/**
 * The sector's camera estate.
 *
 * Every entry is a plain, non-intelligent IP camera — the `model` field names
 * real commodity hardware with no on-board analytics. That is the point of the
 * platform: intelligence is added in software, so nothing here has to be
 * replaced. `installed` shows how old the estate is.
 */

export const cameras = [
  {
    id: "BOP-03",
    name: "Border Out Post 3 — North Gate",
    type: "bop",
    sector: "Alpha",
    status: "online",
    position: { x: 22, y: 30 },
    feed: "/footage/perimeter-day.mp4",
    model: "Hikvision DS-2CD1043G0-I",
    capabilities: "Fixed bullet · H.264 · no on-board analytics",
    resolution: "1280×720",
    fps: 25,
    installed: 2019,
    nightVision: true,
  },
  {
    id: "ROAD-04",
    name: "Border Road — Km 14 Culvert",
    type: "road",
    sector: "Alpha",
    status: "online",
    position: { x: 47, y: 48 },
    feed: "/footage/road-vehicles.mp4",
    model: "CP Plus CP-UNC-TA21L3",
    capabilities: "Fixed bullet · H.264 · no on-board analytics",
    resolution: "1920×1080",
    fps: 25,
    installed: 2020,
    nightVision: false,
  },
  {
    id: "BOP-07",
    name: "Border Out Post 7 — East Perimeter",
    type: "bop",
    sector: "Alpha",
    status: "online",
    position: { x: 72, y: 34 },
    feed: "/footage/night-movement.mp4",
    model: "Hikvision DS-2CD1043G0-I",
    capabilities: "Fixed bullet · H.264 · no on-board analytics",
    resolution: "1280×720",
    fps: 25,
    installed: 2018,
    nightVision: true,
  },
  {
    id: "CHK-01",
    name: "Check Post 1 — Main Barrier",
    type: "checkpost",
    sector: "Alpha",
    status: "online",
    position: { x: 63, y: 72 },
    feed: "/footage/checkpost.mp4",
    model: "Dahua IPC-HFW1230S",
    capabilities: "Fixed bullet · H.264 · no on-board analytics",
    resolution: "1920×1080",
    fps: 30,
    installed: 2021,
    nightVision: true,
  },
  {
    id: "BOP-09",
    name: "Border Out Post 9 — South Watchtower",
    type: "bop",
    sector: "Alpha",
    status: "online",
    position: { x: 38, y: 78 },
    feed: "/footage/perimeter-day.mp4",
    model: "CP Plus CP-UNC-TA21L3",
    capabilities: "Fixed bullet · H.264 · no on-board analytics",
    resolution: "1280×720",
    fps: 25,
    installed: 2019,
    nightVision: true,
  },
  {
    id: "ROAD-02",
    name: "Border Road — Km 6 Bend",
    type: "road",
    sector: "Alpha",
    status: "offline",
    position: { x: 30, y: 62 },
    feed: null,
    model: "CP Plus CP-UNC-TA21L3",
    capabilities: "Fixed bullet · H.264 · no on-board analytics",
    resolution: "1920×1080",
    fps: 25,
    installed: 2020,
    nightVision: false,
    offlineSince: "18:12",
    offlineReason: "Link down — fibre fault at relay hut 2",
  },
  {
    id: "BOP-04",
    name: "Border Out Post 4 — West Approach",
    type: "bop",
    sector: "Alpha",
    status: "degraded",
    position: { x: 14, y: 52 },
    feed: "/footage/perimeter-day.mp4",
    model: "Hikvision DS-2CD1043G0-I",
    capabilities: "Fixed bullet · H.264 · no on-board analytics",
    resolution: "1280×720",
    fps: 12,
    installed: 2017,
    nightVision: false,
    degradedReason: "Packet loss 14% — frame rate reduced",
  },
  {
    id: "ROAD-06",
    name: "Border Road — Km 14 Plate Point",
    type: "road",
    sector: "Alpha",
    status: "online",
    position: { x: 56, y: 40 },
    // Streamed at full resolution deliberately. Plate recognition is limited by
    // pixels on the plate, not by the model: the same plate is 68px wide at
    // 1080p and 30px at 480p, and OCR reads nothing at all below about 60px.
    // Detection still samples this feed down; only the plate crop uses native
    // resolution.
    feed: "/footage/road-anpr.mp4",
    model: "CP Plus CP-UNC-TA21L3",
    capabilities: "Fixed bullet · H.264 · no on-board ANPR",
    resolution: "1920×1080",
    fps: 30,
    installed: 2020,
    nightVision: false,
    anprPoint: true,
  },
  {
    id: "CHK-02",
    name: "Check Post 2 — Pedestrian Lane",
    type: "checkpost",
    sector: "Alpha",
    status: "online",
    position: { x: 84, y: 60 },
    feed: "/footage/checkpost.mp4",
    model: "Dahua IPC-HFW1230S",
    capabilities: "Fixed bullet · H.264 · no on-board analytics",
    resolution: "1920×1080",
    fps: 30,
    installed: 2021,
    nightVision: true,
  },
];

/** The camera opened first on the Live Surveillance console. */
export const defaultCameraId = "BOP-03";

export function getCamera(id) {
  return cameras.find((camera) => camera.id === id) ?? null;
}

export const onlineCameras = cameras.filter(
  (camera) => camera.status === "online",
);
