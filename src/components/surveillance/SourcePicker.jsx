/**
 * Choosing what the console watches.
 *
 * Four routes in, ordered by how reliably they work rather than how impressive
 * they sound: bundled clips, a file from this machine, a camera attached to
 * this machine, and a stream address the operator supplies.
 *
 * The stream field validates before connecting and reports one of four
 * outcomes — ready, preview-only, unreachable, or unsupported — because the
 * failure that matters here is invisible: a cross-origin feed plays perfectly
 * and yields no pixels, so analytics silently produce nothing. Saying so up
 * front is the difference between a tool and a demo.
 */

import { useRef, useState } from "react";
import {
  Camera,
  FileVideo,
  Film,
  Link2,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { SOURCE_KIND, SOURCES } from "../../lib/ingest/sources";
import { describeProbe, PROBE, probeSource } from "../../lib/ingest/probe";

const TABS = [
  { id: SOURCE_KIND.BUNDLED, label: "Demo clips", icon: Film },
  { id: SOURCE_KIND.UPLOAD, label: "Upload", icon: FileVideo },
  { id: SOURCE_KIND.DEVICE, label: "Camera", icon: Camera },
  { id: "stream", label: "Stream URL", icon: Link2 },
];

export default function SourcePicker({ cameras, activeCameraId, onSelect }) {
  const [tab, setTab] = useState(SOURCE_KIND.BUNDLED);
  const [url, setUrl] = useState("");
  const [probe, setProbe] = useState(null);
  const [checking, setChecking] = useState(false);
  const [devices, setDevices] = useState([]);

  const fileRef = useRef(null);

  async function check() {
    setChecking(true);
    setProbe(null);

    try {
      setProbe(await probeSource(url));
    } finally {
      setChecking(false);
    }
  }

  async function listDevices() {
    try {
      // Labels are only exposed after permission is granted, so ask first.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      stream.getTracks().forEach((track) => track.stop());

      const all = await navigator.mediaDevices.enumerateDevices();

      setDevices(all.filter((d) => d.kind === "videoinput"));
    } catch (error) {
      setDevices([]);
      setProbe({
        status: PROBE.UNREACHABLE,
        message: "Camera access declined or unavailable.",
        detail: String(error?.name ?? error),
      });
    }
  }

  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#171a1f]">
      <div className="flex items-center gap-1 border-b border-slate-800/60 px-3 py-2">
        {TABS.map((entry) => {
          const Icon = entry.icon;
          const active = tab === entry.id;

          return (
            <button
              key={entry.id}
              onClick={() => setTab(entry.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition ${
                active
                  ? "bg-slate-700/40 text-slate-100"
                  : "text-slate-600 hover:text-slate-300"
              }`}
            >
              <Icon size={12} />
              {entry.label}
            </button>
          );
        })}
      </div>

      <div className="p-3">
        {tab === SOURCE_KIND.BUNDLED && (
          <div className="space-y-1">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() =>
                  onSelect({ kind: SOURCE_KIND.BUNDLED, cameraId: camera.id })
                }
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  camera.id === activeCameraId
                    ? "bg-slate-700/40 text-slate-100"
                    : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    camera.status === "online"
                      ? "bg-emerald-400/80"
                      : camera.status === "degraded"
                        ? "bg-amber-400/80"
                        : "bg-slate-700"
                  }`}
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs">{camera.id}</span>

                  <span className="block truncate text-[10px] text-slate-600">
                    {camera.type === "bop"
                      ? "Border Out Post"
                      : camera.type === "road"
                        ? "Border Road"
                        : "Check Post"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === SOURCE_KIND.UPLOAD && (
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border border-dashed border-slate-700/70 px-4 py-6 text-center transition hover:border-slate-600"
            >
              <FileVideo size={18} className="mx-auto text-slate-600" />

              <p className="mt-2 text-xs text-slate-300">
                Choose a video file
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                mp4, webm or mov
              </p>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  onSelect({ kind: SOURCE_KIND.UPLOAD, file });
                }
              }}
            />

            <p className="mt-2 text-[10px] leading-4 text-slate-600">
              {SOURCES[SOURCE_KIND.UPLOAD].note}
            </p>
          </div>
        )}

        {tab === SOURCE_KIND.DEVICE && (
          <div>
            <button
              onClick={listDevices}
              className="w-full rounded-lg border border-slate-700/70 bg-slate-800/40 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700/40"
            >
              Find cameras on this machine
            </button>

            <div className="mt-2 space-y-1">
              {devices.map((device, index) => (
                <button
                  key={device.deviceId || index}
                  onClick={() =>
                    onSelect({
                      kind: SOURCE_KIND.DEVICE,
                      deviceId: device.deviceId,
                      label: device.label || `Camera ${index + 1}`,
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-800/60 bg-[#14171b] px-2.5 py-2 text-left text-[11px] text-slate-300 transition hover:border-slate-700"
                >
                  <Camera size={11} className="shrink-0 text-slate-500" />

                  <span className="truncate">
                    {device.label || `Camera ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-2 text-[10px] leading-4 text-slate-600">
              {SOURCES[SOURCE_KIND.DEVICE].note}
            </p>
          </div>
        )}

        {tab === "stream" && (
          <div>
            <div className="flex gap-1.5">
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && check()}
                placeholder="https://…/stream.m3u8"
                className="min-w-0 flex-1 rounded-lg border border-slate-800/70 bg-[#14171b] px-2.5 py-2 text-[11px] text-slate-200 outline-none placeholder:text-slate-700 focus:border-slate-600"
              />

              <button
                onClick={check}
                disabled={checking || !url.trim()}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2 text-[11px] text-slate-200 transition hover:bg-slate-700/50 disabled:opacity-40"
              >
                {checking && <Loader2 size={11} className="animate-spin" />}
                Validate
              </button>
            </div>

            {probe && <ProbeResult probe={probe} onSelect={onSelect} />}

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-800/60 bg-[#14171b] p-2.5">
              <ShieldCheck
                size={12}
                className="mt-0.5 shrink-0 text-slate-600"
              />

              <p className="text-[10px] leading-4 text-slate-500">
                Use only feeds you are authorised to access — a camera you
                operate, a stream your organisation controls, or a feed
                published for public viewing. The platform connects to what it
                is given; it does not search for cameras and will not attempt to
                get past any access control.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProbeResult({ probe, onSelect }) {
  const tone = describeProbe(probe.status);
  const usable =
    probe.status === PROBE.READY || probe.status === PROBE.PREVIEW_ONLY;

  return (
    <div className={`mt-2 rounded-lg border p-2.5 ${tone.ring}`}>
      <p className={`text-[11px] ${tone.tone}`}>{probe.message}</p>

      {probe.detail && (
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          {probe.detail}
        </p>
      )}

      {usable && (
        <button
          onClick={() =>
            onSelect({
              kind: probe.kind,
              url: probe.url,
              canAnalyse: probe.canAnalyse,
            })
          }
          className="mt-2 w-full rounded-md border border-slate-700/70 bg-slate-800/50 px-2.5 py-1.5 text-[11px] text-slate-200 transition hover:bg-slate-700/50"
        >
          {probe.canAnalyse ? "Connect and analyse" : "Connect for preview only"}
        </button>
      )}
    </div>
  );
}
