/**
 * Attaching a validated source to a video element.
 *
 * Each source kind connects differently and, more importantly, *fails*
 * differently. A camera can be refused by the operator; an HLS manifest can
 * 404; a live stream can stall halfway through a shift. Every attachment
 * returns a detach function and reports health through one callback, so the
 * console can say what happened instead of showing a black rectangle.
 *
 * `crossOrigin = "anonymous"` is set on every remote source. Without it the
 * browser will not even request CORS permission, and the canvas is guaranteed
 * to taint — which would silently disable detection.
 */

import { SOURCE_KIND } from "./sources";

export const HEALTH = {
  CONNECTING: "connecting",
  LIVE: "live",
  STALLED: "stalled",
  ENDED: "ended",
  ERROR: "error",
};

/** A live feed that stops advancing for this long is reported as stalled. */
const STALL_MS = 6000;

/**
 * @param {HTMLVideoElement} video
 * @param {{kind, url, file, deviceId}} source
 * @param {(state: {health, message?}) => void} onHealth
 * @returns {Promise<() => void>} detach
 */
export async function attachSource(video, source, onHealth) {
  const report = (health, message) => onHealth?.({ health, message });

  report(HEALTH.CONNECTING);

  switch (source.kind) {
    case SOURCE_KIND.DEVICE:
      return attachDevice(video, source, report);

    case SOURCE_KIND.HLS:
      return attachHls(video, source, report);

    case SOURCE_KIND.UPLOAD:
      return attachFile(video, source, report);

    case SOURCE_KIND.SNAPSHOT:
      return attachSnapshot(video, source, report);

    default:
      return attachDirect(video, source, report);
  }
}

/** Watch for a live source that has quietly stopped producing frames. */
function watchStalls(video, report, { live = true } = {}) {
  if (!live) {
    return () => {};
  }

  let last = -1;
  let lastMoved = Date.now();

  const timer = setInterval(() => {
    if (video.currentTime !== last) {
      last = video.currentTime;
      lastMoved = Date.now();

      return;
    }

    if (!video.paused && Date.now() - lastMoved > STALL_MS) {
      report(
        HEALTH.STALLED,
        `No new frames for ${Math.round((Date.now() - lastMoved) / 1000)}s. The source may have dropped.`,
      );
    }
  }, 2000);

  return () => clearInterval(timer);
}

async function attachDevice(video, source, report) {
  if (!navigator.mediaDevices?.getUserMedia) {
    report(HEALTH.ERROR, "This browser exposes no camera API.");

    throw new Error("getUserMedia unavailable");
  }

  if (!window.isSecureContext) {
    report(
      HEALTH.ERROR,
      "Cameras are only available on a secure origin (https or localhost).",
    );

    throw new Error("insecure context");
  }

  let stream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: source.deviceId
        ? { deviceId: { exact: source.deviceId } }
        : { width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
  } catch (error) {
    // A refusal is a legitimate answer, not a fault to work around.
    const message =
      error?.name === "NotAllowedError"
        ? "Camera access was declined. The platform will not ask again until you retry."
        : error?.name === "NotFoundError"
          ? "No camera is attached to this machine."
          : `Camera unavailable: ${error?.name ?? error}`;

    report(HEALTH.ERROR, message);

    throw error;
  }

  video.srcObject = stream;
  video.muted = true;

  await video.play().catch(() => {});

  const track = stream.getVideoTracks()[0];
  const settings = track?.getSettings?.() ?? {};

  report(
    HEALTH.LIVE,
    `${track?.label || "Camera"} — ${settings.width ?? "?"}x${settings.height ?? "?"}`,
  );

  const stopStalls = watchStalls(video, report);

  return () => {
    stopStalls();
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  };
}

async function attachHls(video, source, report) {
  video.crossOrigin = "anonymous";

  // Safari plays HLS natively and does it better than any polyfill.
  if (video.canPlayType("application/vnd.apple.mpegurl") === "probably") {
    video.src = source.url;

    await video.play().catch(() => {});

    report(HEALTH.LIVE, "Playing via native HLS support.");

    const stopStalls = watchStalls(video, report);

    return () => {
      stopStalls();
      video.removeAttribute("src");
      video.load();
    };
  }

  const { default: Hls } = await import("hls.js");

  if (!Hls.isSupported()) {
    report(HEALTH.ERROR, "This browser cannot play HLS.");

    throw new Error("hls unsupported");
  }

  const hls = new Hls({ enableWorker: true, lowLatencyMode: true });

  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (!data.fatal) {
      return;
    }

    // Recover what is recoverable; report what is not, rather than looping.
    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      report(HEALTH.STALLED, "Network error — retrying.");
      hls.startLoad();
    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      report(HEALTH.STALLED, "Media error — recovering.");
      hls.recoverMediaError();
    } else {
      report(HEALTH.ERROR, `Stream failed: ${data.details}`);
      hls.destroy();
    }
  });

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play().catch(() => {});
    report(HEALTH.LIVE, `${hls.levels?.length ?? 0} quality level(s) available.`);
  });

  hls.loadSource(source.url);
  hls.attachMedia(video);

  const stopStalls = watchStalls(video, report);

  return () => {
    stopStalls();
    hls.destroy();
  };
}

async function attachFile(video, source, report) {
  const url = URL.createObjectURL(source.file);

  video.src = url;
  video.loop = true;
  video.muted = true;

  await video.play().catch(() => {});

  report(
    HEALTH.LIVE,
    `${source.file.name} — ${(source.file.size / 1e6).toFixed(1)} MB, held in memory only.`,
  );

  return () => {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  };
}

/**
 * A camera that publishes stills rather than video.
 *
 * Most transport-authority cameras work this way: a JPEG at a fixed URL,
 * replaced every minute or so. Rather than teach the whole pipeline about
 * images, the poller paints each fetched frame onto a canvas and exposes that
 * canvas as a MediaStream. Everything downstream — the analytics loop, the
 * tracker, the plate engine — sees an ordinary video and needs no change.
 *
 * The interval is the provider's, not ours. Polling a public authority's
 * camera faster than it updates gains nothing and is exactly the behaviour
 * that gets a client blocked.
 */
async function attachSnapshot(video, source, report) {
  const intervalMs = Math.max(5, source.refreshSeconds ?? 60) * 1000;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  let stopped = false;
  let consecutiveFailures = 0;
  let timer = null;

  async function pull() {
    if (stopped) {
      return;
    }

    try {
      // Cache-bust so we get the current frame rather than a stored one,
      // and request CORS so the pixels come back readable.
      const url = new URL(source.url);

      url.searchParams.set("_t", String(Date.now()));

      const image = new Image();

      image.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("image failed to load"));
        image.src = url.toString();
      });

      if (stopped) {
        return;
      }

      if (canvas.width !== image.naturalWidth) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
      }

      context.drawImage(image, 0, 0);

      consecutiveFailures = 0;

      report(
        HEALTH.LIVE,
        `${image.naturalWidth}x${image.naturalHeight} still, refreshed every ${intervalMs / 1000}s`,
      );
    } catch {
      consecutiveFailures += 1;

      // One miss is weather; several in a row means the camera is gone.
      if (consecutiveFailures >= 3) {
        report(
          HEALTH.ERROR,
          `No image for ${consecutiveFailures} consecutive attempts — the camera may have been retired or moved.`,
        );
      } else {
        report(HEALTH.STALLED, "Missed a refresh, retrying.");
      }
    }
  }

  await pull();

  if (!canvas.width) {
    report(HEALTH.ERROR, "The camera returned no usable image.");

    throw new Error("snapshot unavailable");
  }

  // 1 fps is ample: the underlying picture changes far more slowly.
  const stream = canvas.captureStream(1);

  video.srcObject = stream;
  video.muted = true;

  await video.play().catch(() => {});

  timer = setInterval(pull, intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  };
}

async function attachDirect(video, source, report) {
  if (source.url.startsWith("http")) {
    video.crossOrigin = "anonymous";
  }

  video.src = source.url;
  video.muted = true;

  const onError = () =>
    report(
      HEALTH.ERROR,
      "The browser could not load that stream. If it plays elsewhere, the server is most likely refusing cross-origin requests.",
    );

  const onEnded = () => report(HEALTH.ENDED, "Stream ended.");

  video.addEventListener("error", onError);
  video.addEventListener("ended", onEnded);

  await video.play().catch(() => {});

  report(HEALTH.LIVE);

  const stopStalls = watchStalls(video, report, {
    live: source.kind === SOURCE_KIND.MJPEG,
  });

  return () => {
    stopStalls();
    video.removeEventListener("error", onError);
    video.removeEventListener("ended", onEnded);
    video.removeAttribute("src");
    video.load();
  };
}

/**
 * Confirm, from the actual pixels, whether analytics can run.
 *
 * The probe predicts this from headers; this proves it from the frame. They
 * can disagree — a redirect to another host, a CDN that varies its headers —
 * and the frame is the authority.
 */
export function canReadPixels(video) {
  // A video with no dimensions cannot taint a canvas, so the read trivially
  // succeeds and reports a dead stream as analysable. Decoded frames are a
  // precondition for the question, not an optimisation.
  if (!video || !video.videoWidth || !video.videoHeight) {
    return {
      readable: false,
      pending: true,
      reason: "No frames decoded yet — waiting for the stream to produce video.",
    };
  }

  try {
    const canvas = document.createElement("canvas");

    canvas.width = 8;
    canvas.height = 8;

    const context = canvas.getContext("2d", { willReadFrequently: true });

    context.drawImage(video, 0, 0, 8, 8);
    context.getImageData(0, 0, 8, 8);

    return { readable: true };
  } catch (error) {
    return {
      readable: false,
      reason:
        error?.name === "SecurityError"
          ? "The browser has tainted the canvas: this stream's server does not permit cross-origin pixel access, so detection cannot run on it."
          : `Frames unreadable: ${error?.message ?? error}`,
    };
  }
}
