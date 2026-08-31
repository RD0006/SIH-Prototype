/**
 * Evidence preview.
 *
 * A snapshot only exists for incidents the analytics engine raised in this
 * session — the frame is captured at the moment the fence was crossed. Seeded
 * history has no retained frame, and the panel says so rather than showing a
 * stand-in image: fabricated evidence would undermine the one thing an
 * incident log is for.
 */

import { Camera, ImageOff, Moon } from "lucide-react";

import { DOMAIN_COLOR } from "../../lib/analytics/classes";

export default function EvidencePanel({ incident, evidence }) {
  const colour = DOMAIN_COLOR[incident.domain] ?? DOMAIN_COLOR.other;

  if (!evidence?.snapshot) {
    return (
      <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
        <div className="flex items-center gap-2">
          <ImageOff size={13} className="text-slate-600" />

          <h3 className="text-xs font-medium text-slate-300">Evidence frame</h3>
        </div>

        <div className="mt-3 rounded-lg border border-dashed border-slate-800 bg-[#14171b] px-4 py-6">
          <p className="text-[11px] leading-5 text-slate-500">
            No frame retained for this incident.
          </p>

          <p className="mt-2 text-[10px] leading-4 text-slate-600">
            Snapshots are captured by the analytics engine at the instant a
            virtual fence is crossed. {incident.id} comes from the sector log
            that pre-dates this session, so nothing was stored. Run the Live
            Surveillance console to raise an incident with a frame attached.
          </p>
        </div>
      </div>
    );
  }

  const box = evidence.box;

  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
      <div className="flex items-center gap-2">
        <Camera size={13} className="text-slate-600" />

        <h3 className="text-xs font-medium text-slate-300">Evidence frame</h3>

        {evidence.night && (
          <span className="ml-auto flex items-center gap-1 rounded border border-sky-900/50 bg-sky-950/20 px-1.5 py-0.5 text-[9px] text-sky-300/90">
            <Moon size={9} />
            Night
          </span>
        )}
      </div>

      <div className="relative mt-3 overflow-hidden rounded-lg border border-slate-800/60 bg-black">
        <img
          src={evidence.snapshot}
          alt={`Captured frame for ${incident.id} on ${incident.cameraId}`}
          className="block w-full"
        />

        {box && (
          <div
            className="pointer-events-none absolute rounded-sm border"
            style={{
              left: `${box.xmin * 100}%`,
              top: `${box.ymin * 100}%`,
              width: `${(box.xmax - box.xmin) * 100}%`,
              height: `${(box.ymax - box.ymin) * 100}%`,
              borderColor: colour,
            }}
          />
        )}
      </div>

      <p className="mt-3 text-[10px] leading-4 text-slate-600">
        Captured on {incident.cameraId} at {incident.clock}
        {typeof evidence.videoTime === "number" &&
          ` · feed position ${evidence.videoTime.toFixed(1)}s`}
        {typeof evidence.luminance === "number" &&
          ` · luminance ${evidence.luminance}`}
        .
      </p>

      {evidence.enhanced && (
        <p className="mt-1.5 text-[10px] leading-4 text-sky-300/70">
          Low-light enhancement was applied at γ{evidence.gamma} before
          detection. This is the enhanced frame the detector actually saw, not a
          retouched copy.
        </p>
      )}
    </div>
  );
}
