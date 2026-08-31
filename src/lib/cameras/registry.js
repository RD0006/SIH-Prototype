/**
 * Normalised camera registry.
 *
 * Providers publish cameras in wildly different shapes — GeoJSON feature
 * collections, DATEX II, ArcGIS query responses, bare HTML. If those
 * differences reach the rest of the application, every new provider means
 * touching the library UI, the source picker and the engine. They stop here.
 *
 * An adapter's only job is to turn its provider's format into the shape below.
 * Everything downstream sees one kind of camera.
 *
 * Two fields carry most of the weight:
 *
 *   authorisation  why we are entitled to use this feed at all
 *   analysable     whether the browser can read its pixels, which decides
 *                  whether the engine can run on it or it is view-only
 *
 * Neither is inferred. A provider states its licence; a feed either sends CORS
 * headers or it does not.
 */

/** How we are entitled to use a feed. Recorded per provider, never assumed. */
export const AUTHORISATION = {
  /** Published by the operator under an open licence we have read. */
  OPEN_LICENCE: "open-licence",
  /** Official authority portal that publishes for public viewing. */
  PUBLIC_AUTHORITY: "public-authority",
  /** The operator granted us access directly. */
  GRANTED: "granted",
  /** Ships with the platform; ours to use. */
  BUNDLED: "bundled",
};

export const CAMERA_STATUS = {
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  RETIRED: "retired",
  RATE_LIMITED: "rate-limited",
  UNKNOWN: "unknown",
};

export const STREAM_FORMAT = {
  /** A JPEG re-fetched on an interval. Most authority cameras work this way. */
  SNAPSHOT: "snapshot",
  MJPEG: "mjpeg",
  HLS: "hls",
  PROGRESSIVE: "progressive",
};

/**
 * @typedef {object} Camera
 * @property {string} id            globally unique, prefixed by provider
 * @property {string} providerId
 * @property {string} name
 * @property {string} [country]
 * @property {string} [region]
 * @property {string} [roadName]
 * @property {{lat: number, lon: number}} [location]
 * @property {string} streamFormat  one of STREAM_FORMAT
 * @property {string} accessUrl     what the engine consumes
 * @property {string} [previewUrl]  a still, if different
 * @property {number} [refreshSeconds]
 * @property {boolean} analysable   can the browser read its pixels
 * @property {string} status        one of CAMERA_STATUS
 * @property {number} [lastChecked]
 * @property {object} [metadata]    anything provider-specific, kept out of the way
 */

/**
 * @typedef {object} Provider
 * @property {string} id
 * @property {string} name
 * @property {string} country
 * @property {string} organisation
 * @property {string} website
 * @property {string} [apiDocs]
 * @property {string} authorisation   one of AUTHORISATION
 * @property {string} licence         exact name, e.g. "CC BY 4.0"
 * @property {string} [attribution]   exact wording the provider requires
 * @property {boolean} apiKeyRequired
 * @property {boolean} cors           observed, not claimed
 * @property {number} [minRefreshSeconds] provider's stated politeness floor
 * @property {string} [notes]
 */

const providers = new Map();
const cameras = new Map();

export function registerProvider(provider, adapter) {
  providers.set(provider.id, { provider, adapter });
}

export function listProviders() {
  return [...providers.values()].map((entry) => entry.provider);
}

export function getProvider(id) {
  return providers.get(id)?.provider ?? null;
}

/**
 * Ask a provider for its cameras and fold them into the registry.
 *
 * Failure is per-provider and never fatal: a directory that is down should
 * remove its own cameras from the library, not empty it.
 */
export async function loadProvider(id, options = {}) {
  const entry = providers.get(id);

  if (!entry) {
    throw new Error(`Unknown provider "${id}".`);
  }

  const discovered = await entry.adapter.discover(options);

  for (const camera of discovered) {
    cameras.set(camera.id, camera);
  }

  return discovered;
}

export function listCameras(filter = {}) {
  let all = [...cameras.values()];

  if (filter.providerId) {
    all = all.filter((c) => c.providerId === filter.providerId);
  }

  if (filter.country) {
    all = all.filter((c) => c.country === filter.country);
  }

  if (filter.analysableOnly) {
    all = all.filter((c) => c.analysable);
  }

  if (filter.query) {
    const needle = filter.query.toLowerCase();

    all = all.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        (c.roadName ?? "").toLowerCase().includes(needle) ||
        (c.region ?? "").toLowerCase().includes(needle),
    );
  }

  return all;
}

export function getCamera(id) {
  return cameras.get(id) ?? null;
}

export function setCameraStatus(id, status) {
  const camera = cameras.get(id);

  if (camera) {
    cameras.set(id, { ...camera, status, lastChecked: Date.now() });
  }
}

export function registryStats() {
  const all = [...cameras.values()];

  return {
    providers: providers.size,
    cameras: all.length,
    analysable: all.filter((c) => c.analysable).length,
    countries: new Set(all.map((c) => c.country).filter(Boolean)).size,
  };
}

export function clearRegistry() {
  cameras.clear();
}
