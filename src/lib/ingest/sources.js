/**
 * Video source types the platform can ingest.
 *
 * The governing constraint is not which protocols exist, it is which ones a
 * browser can hand back *pixels* from. Detection reads frames through
 * `canvas.getImageData`, and a canvas that has had cross-origin media drawn
 * onto it without CORS permission is "tainted": the browser refuses the read.
 * Measured in this application — a cross-origin image with no
 * `Access-Control-Allow-Origin` header taints the canvas and detection becomes
 * impossible, even though the video plays perfectly on screen.
 *
 * So every source below is classified by two separate capabilities:
 *
 *   playable    the browser can display it
 *   analysable  the browser can also read its pixels back
 *
 * A source can be the first without the second, and the console says so
 * plainly rather than appearing to work while producing nothing.
 *
 * On authorisation: this platform ingests sources the operator supplies or
 * owns. It does not search for cameras, does not probe address ranges, and
 * does not attempt to reach anything behind authentication. A stream is used
 * because someone with the right to use it entered it.
 */

export const SOURCE_KIND = {
  BUNDLED: "bundled",
  UPLOAD: "upload",
  DEVICE: "device",
  HLS: "hls",
  PROGRESSIVE: "progressive",
  MJPEG: "mjpeg",
  RTSP: "rtsp",
  SNAPSHOT: "snapshot",
};

export const SOURCES = {
  [SOURCE_KIND.BUNDLED]: {
    label: "Demonstration footage",
    detail: "Clips shipped with the platform",
    playable: true,
    analysable: true,
    live: false,
    note: "Served from the application's own origin, so frames are always readable.",
  },

  [SOURCE_KIND.UPLOAD]: {
    label: "Uploaded recording",
    detail: "A video file from this machine",
    playable: true,
    analysable: true,
    live: false,
    note: "Read as a local blob. Nothing is uploaded anywhere — the file never leaves this machine.",
  },

  [SOURCE_KIND.DEVICE]: {
    label: "Connected camera",
    detail: "A camera attached to this machine",
    playable: true,
    analysable: true,
    live: true,
    note: "Genuinely live capture via getUserMedia. Requires the operator's permission and a secure context.",
  },

  [SOURCE_KIND.HLS]: {
    label: "HLS stream",
    detail: ".m3u8 — the format most public authority cameras publish",
    playable: true,
    analysable: "cors",
    live: true,
    note: "Frames are readable only if the stream's server sends permissive CORS headers. Many public feeds do not.",
  },

  [SOURCE_KIND.PROGRESSIVE]: {
    label: "HTTP video",
    detail: "A directly addressable .mp4 or .webm",
    playable: true,
    analysable: "cors",
    live: false,
    note: "Same CORS condition as HLS.",
  },

  [SOURCE_KIND.MJPEG]: {
    label: "MJPEG stream",
    detail: "Motion JPEG over HTTP, common on older IP cameras",
    playable: true,
    analysable: "cors",
    live: true,
    note: "Displayed through an image element rather than a video element; frame rate is whatever the camera pushes.",
  },

  [SOURCE_KIND.SNAPSHOT]: {
    label: "Snapshot camera",
    detail: "A still image refreshed on an interval",
    playable: true,
    analysable: "cors",
    live: true,
    note: "How most transport-authority cameras publish. Frames are polled at the provider's stated interval and never faster.",
  },

  [SOURCE_KIND.RTSP]: {
    label: "RTSP stream",
    detail: "rtsp:// — the native protocol of most IP cameras",
    playable: false,
    analysable: false,
    live: true,
    note:
      "No browser can play RTSP. It needs a gateway that repackages the stream as HLS or WebRTC — commonly ffmpeg or MediaMTX on the post's own machine. That gateway is out of scope for this prototype, which is deliberately serverless; the platform detects rtsp:// and explains this rather than pretending to connect.",
  },
};

/** Work out what a URL is, without fetching it. */
export function classifyUrl(raw) {
  const value = String(raw ?? "").trim();

  if (!value) {
    return { kind: null, reason: "No address entered." };
  }

  let url;

  try {
    url = new URL(value);
  } catch {
    return { kind: null, reason: "That is not a valid URL." };
  }

  if (url.protocol === "rtsp:" || url.protocol === "rtsps:") {
    return { kind: SOURCE_KIND.RTSP, url: value };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      kind: null,
      reason: `Unsupported protocol "${url.protocol}". Use http, https, or rtsp.`,
    };
  }

  const path = url.pathname.toLowerCase();

  if (path.endsWith(".m3u8")) {
    return { kind: SOURCE_KIND.HLS, url: value };
  }

  if (/\.(mp4|webm|ogv|mov|m4v)$/.test(path)) {
    return { kind: SOURCE_KIND.PROGRESSIVE, url: value };
  }

  // MJPEG endpoints rarely carry a helpful extension; these are the shapes
  // that virtually every IP camera and public webcam uses.
  if (/mjpe?g|\bcgi\b|snapshot|videostream|axis-cgi|faststream/.test(
    path + url.search.toLowerCase(),
  )) {
    return { kind: SOURCE_KIND.MJPEG, url: value };
  }

  return {
    kind: SOURCE_KIND.PROGRESSIVE,
    url: value,
    uncertain: true,
  };
}

/** Insecure pages cannot use a camera, and mixed content will be blocked. */
export function securityNotes(url) {
  const notes = [];

  if (typeof window === "undefined") {
    return notes;
  }

  if (window.isSecureContext && url?.startsWith("http://")) {
    notes.push(
      "This page is served over HTTPS, so the browser will block a plain http:// stream as mixed content. Use an https:// address.",
    );
  }

  return notes;
}
