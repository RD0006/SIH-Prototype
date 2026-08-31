/**
 * The frame the alert was raised from.
 *
 * The box and the fence are drawn over the still with the same technique the
 * live console uses — SVG for the polygon, percentage-positioned HTML for the
 * box — so what an operator files is visibly the same thing they watched.
 * Where no frame was kept the panel says so; it never stands in a stock image.
 */

import { ImageOff } from "lucide-react";

import { DOMAIN_COLOR } from "../../lib/analytics/classes";
import { polygonToPoints } from "../../lib/analytics/geometry";

export default function CapturedFrame({ incident, camera, zone, evidence }) {
  if (!evidence?.snapshot) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-[#14171b] px-6 text-center">
        <ImageOff size={18} className="text-slate-700" />

        <p className="mt-3 text-xs text-slate-500">No frame retained</p>

        <p className="mt-2 max-w-md text-[10px] leading-4 text-slate-600">
          {incident.id} is from the archived sector log and predates this
          session, so no still was captured with it. The register shows nothing
          here rather than an illustrative image — a frame that cannot be
          produced must not be implied.
        </p>
      </div>
    );
  }

  const colour = DOMAIN_COLOR[incident.domain] ?? DOMAIN_COLOR.other;
  const box = evidence.box;

  const left = box.xmin * 100;
  const top = box.ymin * 100;
  const width = (box.xmax - box.xmin) * 100;
  const height = (box.ymax - box.ymin) * 100;

  const polygon = evidence.zone?.polygon ?? zone?.polygon ?? null;
  const trail = evidence.trail ?? [];

  return (
    <figure className="m-0">
      <div className="relative overflow-hidden rounded-lg border border-slate-800/70 bg-black">
        <img
          src={evidence.snapshot}
          alt={`Frame captured by ${camera?.id ?? incident.cameraId} at the moment ${incident.id} was raised`}
          className="block aspect-video w-full object-cover"
        />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {polygon && (
            <polygon
              points={polygonToPoints(polygon)}
              fill="#f87171"
              fillOpacity="0.07"
              stroke="#f87171"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {trail.length > 1 && (
            <polyline
              points={trail
                .map((point) => `${point.x * 100},${point.y * 100}`)
                .join(" ")}
              fill="none"
              stroke={colour}
              strokeOpacity="0.45"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        <div
          className="pointer-events-none absolute"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${width}%`,
            height: `${height}%`,
            border: `1.5px solid ${colour}`,
            background: `${colour}12`,
            boxShadow: `0 0 14px ${colour}55`,
          }}
        >
          <span
            className="absolute -top-[17px] left-0 flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-[2px] text-[9px] font-medium"
            style={{
              background: colour,
              color: "#0b0d10",
            }}
          >
            {incident.trackId} · {incident.display}
            {typeof incident.confidence === "number" && (
              <span className="opacity-70">
                {(incident.confidence * 100).toFixed(0)}%
              </span>
            )}
          </span>
        </div>

        <span className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[9px] tracking-wider text-slate-300">
          {camera?.id ?? incident.cameraId} · {camera?.resolution ?? "unknown"}
        </span>

        {evidence.night && (
          <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-[9px] tracking-wider text-sky-300">
            NIGHT · LUM {evidence.luminance}
            {evidence.enhanced && ` · ENHANCED γ${evidence.gamma}`}
          </span>
        )}
      </div>

      <figcaption className="mt-2 text-[10px] leading-4 text-slate-600">
        Frame as analysed. The box is the detector output at the instant the
        fence rule fired; the dashed polygon is the fence itself, and the line
        is the track's path through the frame before it crossed.
      </figcaption>
    </figure>
  );
}
