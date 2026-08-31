/**
 * The filable record.
 *
 * An operator cannot put a React component into a case file, so the package is
 * assembled here as one plain object that the document view, the integrity
 * digest and the JSON export all read from. If those three read different
 * structures the digest would attest to something nobody had actually seen,
 * which is exactly the failure an evidential chain exists to prevent.
 */

/**
 * Deterministic serialisation. Object key order in JavaScript is an
 * implementation detail; a digest that changes when it happens to differ is
 * worthless, so keys are sorted at every level before hashing.
 */
export function canonicalJson(value) {
  if (value === undefined) {
    return "null";
  }

  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  const body = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",");

  return `{${body}}`;
}

/** Position in the source feed, as an operator would quote it in a report. */
export function formatVideoTime(seconds) {
  if (typeof seconds !== "number") {
    return null;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;

  return `${String(minutes).padStart(2, "0")}:${rest.toFixed(2).padStart(5, "0")}`;
}

function round(value, places = 4) {
  return typeof value === "number" ? Number(value.toFixed(places)) : null;
}

export function buildEvidenceRecord({ incident, camera, zone, evidence }) {
  return {
    incident: {
      id: incident.id,
      title: incident.title,
      clock: incident.clock,
      origin: incident.live ? "raised in this session" : "archived sector log",
      status: incident.status,
      class: incident.display,
      domain: incident.domain,
      trackId: incident.trackId ?? null,
      confidence: round(incident.confidence, 3),
    },

    camera: camera
      ? {
          id: camera.id,
          name: camera.name,
          model: camera.model,
          capabilities: camera.capabilities,
          resolution: camera.resolution,
          fps: camera.fps,
          installed: camera.installed,
          feedStatus: camera.status,
        }
      : { id: incident.cameraId, note: "camera not in the current estate" },

    zone: zone
      ? {
          id: zone.id,
          name: zone.name,
          kind: zone.kind,
          criticality: zone.criticality,
          rule: zone.rule,
        }
      : { id: incident.zoneId, note: "fence definition not retained" },

    capture: evidence
      ? {
          videoTime: round(evidence.videoTime, 2),
          night: Boolean(evidence.night),
          meanLuminance: evidence.luminance ?? null,
          lowLightEnhanced: Boolean(evidence.enhanced),
          gamma: round(evidence.gamma, 2),
          box: {
            xmin: round(evidence.box?.xmin),
            ymin: round(evidence.box?.ymin),
            xmax: round(evidence.box?.xmax),
            ymax: round(evidence.box?.ymax),
          },
          trailPoints: evidence.trail?.length ?? 0,
          frame: {
            retained: true,
            format: "image/jpeg",
            encoding: "data URL",
            includedInExport: false,
          },
        }
      : {
          retained: false,
          note: "no frame was captured for this incident",
        },

    assessment: {
      score: incident.score,
      severity: incident.severity,
      suppressed: Boolean(incident.suppressed),
      factors: (incident.factors ?? []).map((factor) => ({
        label: factor.label,
        delta: factor.delta,
        why: factor.why,
      })),
    },
  };
}

/**
 * SHA-256 over the canonical record. Returns null where WebCrypto is absent
 * (an insecure origin, for instance) rather than inventing a plausible string:
 * a fabricated hash is worse than a missing one.
 */
export async function digestRecord(record) {
  if (!globalThis.crypto?.subtle) {
    return null;
  }

  const bytes = new TextEncoder().encode(canonicalJson(record));
  const buffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildExportDocument({ record, digest }) {
  return {
    format: "IBVAP evidence record v1",
    note: "A machine-readable record of one detection and the conditions it was captured under. It is not a signed or legally attested document.",
    exportedAt: new Date().toISOString(),

    integrity: {
      algorithm: "SHA-256",
      digest: digest ?? "unavailable — WebCrypto not reachable on this origin",
      scope:
        "computed over the `package` object below, serialised as JSON with keys sorted at every level",
    },

    snapshot: {
      included: false,
      note: "The captured JPEG frame is held in the console and is deliberately excluded here to keep the record small. It is visible on the Evidence page for this incident.",
    },

    package: record,
  };
}
