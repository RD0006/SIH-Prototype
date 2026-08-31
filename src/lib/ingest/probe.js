/**
 * Stream validation.
 *
 * Runs before the platform attaches to a source, so an operator learns what
 * will happen *before* watching a blank panel and guessing. Four questions, in
 * the order that matters:
 *
 *   1. Is this a shape we can play at all?      classifyUrl
 *   2. Will the browser even let us try?        mixed content, secure context
 *   3. Is anything there?                       reachability
 *   4. Can we read pixels, or only display?     CORS
 *
 * Question 4 is the one that decides whether analytics can run, and it is the
 * one no amount of retrying fixes. A cross-origin stream without permissive
 * CORS headers taints the canvas: the video plays, and `getImageData` throws.
 * The probe reports that up front and the console degrades to preview-only
 * rather than silently detecting nothing.
 *
 * Nothing here attempts to defeat a restriction. If a source refuses us, that
 * is the answer, and it is reported as the answer.
 */

import { classifyUrl, securityNotes, SOURCE_KIND, SOURCES } from "./sources";

export const PROBE = {
  UNSUPPORTED: "unsupported",
  BLOCKED: "blocked",
  UNREACHABLE: "unreachable",
  PREVIEW_ONLY: "preview-only",
  READY: "ready",
};

/** Reachability and CORS in one request, without downloading the stream. */
async function inspect(url, { timeout = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    // A CORS-mode request tells us both things at once: if it resolves, the
    // server sent Access-Control-Allow-Origin and pixels will be readable.
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: { Range: "bytes=0-0" },
      signal: controller.signal,
    });

    return {
      reachable: true,
      cors: true,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
    };
  } catch {
    // Could not read it cross-origin. Distinguish "not there" from "there but
    // not sharing" with a no-cors request, which succeeds opaquely for a live
    // host and fails outright for a dead one.
    try {
      await fetch(url, {
        method: "GET",
        mode: "no-cors",
        signal: controller.signal,
      });

      return { reachable: true, cors: false };
    } catch {
      return { reachable: false, cors: false };
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {Promise<{status, kind, url, message, detail, canAnalyse}>}
 */
export async function probeSource(raw) {
  const classified = classifyUrl(raw);

  if (!classified.kind) {
    return {
      status: PROBE.UNSUPPORTED,
      message: classified.reason,
      canAnalyse: false,
    };
  }

  const spec = SOURCES[classified.kind];

  if (classified.kind === SOURCE_KIND.RTSP) {
    return {
      status: PROBE.UNSUPPORTED,
      kind: classified.kind,
      url: classified.url,
      message: "RTSP cannot be played by a browser.",
      detail: spec.note,
      canAnalyse: false,
    };
  }

  const blockers = securityNotes(classified.url);

  if (blockers.length > 0) {
    return {
      status: PROBE.BLOCKED,
      kind: classified.kind,
      url: classified.url,
      message: "The browser will block this stream.",
      detail: blockers[0],
      canAnalyse: false,
    };
  }

  const result = await inspect(classified.url);

  if (!result.reachable) {
    return {
      status: PROBE.UNREACHABLE,
      kind: classified.kind,
      url: classified.url,
      message: "Nothing answered at that address.",
      detail:
        "The host may be offline, the path wrong, or the network may not route to it. Check the address with the source's owner.",
      canAnalyse: false,
    };
  }

  if (!result.cors) {
    return {
      status: PROBE.PREVIEW_ONLY,
      kind: classified.kind,
      url: classified.url,
      message: "Reachable, but analytics cannot run on it.",
      detail:
        "The server does not send cross-origin permission headers, so the browser will display the video but refuse to let the platform read its pixels. It can be monitored, not analysed. To analyse it, the feed must either be served with CORS enabled or relayed through this post's own machine.",
      canAnalyse: false,
    };
  }

  return {
    status: PROBE.READY,
    kind: classified.kind,
    url: classified.url,
    message: `${spec.label} ready.`,
    detail: result.contentType
      ? `Server reports ${result.contentType}.`
      : "Stream is reachable and readable.",
    canAnalyse: true,
  };
}

export function describeProbe(status) {
  return (
    {
      [PROBE.READY]: {
        tone: "text-emerald-300",
        ring: "border-emerald-900/50 bg-emerald-950/20",
      },
      [PROBE.PREVIEW_ONLY]: {
        tone: "text-amber-300",
        ring: "border-amber-900/50 bg-amber-950/20",
      },
      [PROBE.UNREACHABLE]: {
        tone: "text-red-300",
        ring: "border-red-900/50 bg-red-950/20",
      },
      [PROBE.BLOCKED]: {
        tone: "text-red-300",
        ring: "border-red-900/50 bg-red-950/20",
      },
      [PROBE.UNSUPPORTED]: {
        tone: "text-slate-400",
        ring: "border-slate-800/70 bg-slate-900/30",
      },
    }[status] ?? { tone: "text-slate-400", ring: "border-slate-800/70" }
  );
}
