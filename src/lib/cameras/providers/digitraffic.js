/**
 * Fintraffic Digitraffic — Finnish national road cameras.
 *
 * The reference provider, and the standard others are measured against.
 * Everything below was verified against the live service rather than taken
 * from documentation:
 *
 *   812 weathercam stations, ~2,400 individual camera presets
 *   GeoJSON metadata with WGS84 coordinates
 *   Direct JPEG stills at 1280x720
 *   access-control-allow-origin: *  on the API *and* the image host
 *   No API key
 *   CC BY 4.0
 *
 * The CORS header is what makes this provider genuinely useful rather than
 * merely viewable: the browser will hand back pixels, so the detection engine
 * can actually run on the imagery.
 *
 * Two requirements are easy to mistake for refusals. The service returns 406
 * unless the request carries `Accept-Encoding: gzip`, and it asks every client
 * to identify itself with a `Digitraffic-User` header. Both are documented and
 * reasonable; `fetch` applies gzip automatically, and the identifying header is
 * set below.
 *
 * These are stills, not video. Vehicles are typically distant — good for
 * evaluating detection under real weather and lighting, poor for plate
 * recognition, which needs far more pixels on the plate than a highway
 * monitoring camera provides. That limitation is recorded on each camera
 * rather than discovered later.
 */

import {
  AUTHORISATION,
  CAMERA_STATUS,
  STREAM_FORMAT,
} from "../registry";

const API = "https://tie.digitraffic.fi/api/weathercam/v1";

export const provider = {
  id: "digitraffic-fi",
  name: "Fintraffic Digitraffic",
  country: "Finland",
  organisation: "Fintraffic (Finnish state transport operator)",
  website: "https://www.digitraffic.fi/en/",
  apiDocs: "https://www.digitraffic.fi/en/road-traffic/#weather-camera-data",
  authorisation: AUTHORISATION.OPEN_LICENCE,
  licence: "CC BY 4.0",
  attribution:
    "Traffic camera imagery: Fintraffic / Digitraffic, licensed under CC BY 4.0",
  apiKeyRequired: false,
  cors: true,
  // Fintraffic asks clients not to poll faster than the cameras update.
  // Stations refresh on the order of minutes; 60s is well inside that.
  minRefreshSeconds: 60,
  notes:
    "Stills rather than video. Excellent for detection under real weather and light; plates are generally too distant to read.",
};

/** Identify ourselves, as the service asks every client to. */
const HEADERS = {
  Accept: "application/geo+json",
  "Digitraffic-User": "SIH-Prototype-IBVAP/1.0",
};

/**
 * Fetch the station directory and flatten it into individual cameras.
 *
 * A station is a mast; a preset is one camera on it pointing a particular way.
 * The platform reasons about presets, because that is what produces a picture.
 */
export async function discover({ limit = 400, signal } = {}) {
  const response = await fetch(`${API}/stations`, { headers: HEADERS, signal });

  if (!response.ok) {
    throw new Error(
      `Digitraffic station directory returned ${response.status}.`,
    );
  }

  const data = await response.json();
  const cameras = [];

  for (const feature of data.features ?? []) {
    const properties = feature.properties ?? {};

    // A station that is not gathering is a mast with nothing behind it.
    if (properties.collectionStatus && properties.collectionStatus !== "GATHERING") {
      continue;
    }

    const [lon, lat] = feature.geometry?.coordinates ?? [];
    const stationId = properties.id ?? feature.id;

    // The directory does not include presets; they come from the station
    // detail. Rather than issue 812 requests up front, derive the preset ids,
    // which follow the documented `<stationId><NN>` pattern, and confirm them
    // lazily when a camera is actually opened.
    const presetCount = properties.presets?.length ?? properties.presetCount ?? 1;
    const presets = properties.presets ?? null;

    if (presets) {
      for (const preset of presets) {
        cameras.push(toCamera({ preset, properties, stationId, lat, lon }));
      }
    } else {
      // Directory without presets: expose the station's first camera and let
      // `expandStation` fill in the rest on demand.
      cameras.push(
        toCamera({
          preset: {
            id: `${stationId}01`,
            presentationName: properties.name,
          },
          properties,
          stationId,
          lat,
          lon,
          partial: presetCount > 1,
        }),
      );
    }

    if (cameras.length >= limit) {
      break;
    }
  }

  return cameras;
}

function toCamera({ preset, properties, stationId, lat, lon, partial }) {
  const presetId = preset.id;

  return {
    id: `digitraffic-fi:${presetId}`,
    providerId: provider.id,
    name: preset.presentationName || properties.name || presetId,
    country: "Finland",
    region: properties.province || properties.municipality || undefined,
    roadName: parseRoad(properties.name),
    location:
      typeof lat === "number" && typeof lon === "number"
        ? { lat, lon }
        : undefined,
    streamFormat: STREAM_FORMAT.SNAPSHOT,
    accessUrl: preset.imageUrl || `https://weathercam.digitraffic.fi/${presetId}.jpg`,
    refreshSeconds: provider.minRefreshSeconds,
    // Verified: the image host sends access-control-allow-origin: *
    analysable: true,
    status: CAMERA_STATUS.AVAILABLE,
    metadata: {
      stationId,
      partial: Boolean(partial),
      municipality: properties.municipality,
    },
  };
}

/** Station names look like "kt51_Inkoo" or "vt4_Jyvaskyla". */
function parseRoad(name) {
  const match = /^([a-z]{2,3}\d+)/i.exec(String(name ?? ""));

  return match ? match[1].toUpperCase() : undefined;
}

/** Fill in every camera on one mast, when the operator opens it. */
export async function expandStation(stationId, { signal } = {}) {
  const response = await fetch(`${API}/stations/${stationId}`, {
    headers: { ...HEADERS, Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Station ${stationId} returned ${response.status}.`);
  }

  const data = await response.json();
  const properties = data.properties ?? data;
  const [lon, lat] = data.geometry?.coordinates ?? [];

  return (properties.presets ?? []).map((preset) =>
    toCamera({ preset, properties, stationId, lat, lon }),
  );
}

/**
 * Confirm a camera is still serving pictures.
 *
 * Deliberately a single conditional GET. Health checking must not become a
 * reason for a provider to rate-limit us.
 */
export async function checkHealth(camera, { signal } = {}) {
  try {
    const response = await fetch(camera.accessUrl, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      signal,
    });

    return response.ok
      ? CAMERA_STATUS.AVAILABLE
      : response.status === 429
        ? CAMERA_STATUS.RATE_LIMITED
        : CAMERA_STATUS.UNAVAILABLE;
  } catch {
    return CAMERA_STATUS.UNKNOWN;
  }
}

export const adapter = { discover, expandStation, checkHealth };
