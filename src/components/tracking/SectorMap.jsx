/**
 * The sector map, with a target's path drawn across it.
 *
 * This reuses the visual language of the dashboard's OperationalMap — same
 * grid, same terrain outlines, same marker treatment — but takes its cameras
 * from the estate data rather than a hardcoded list, and can draw the path of
 * a selected identity through them.
 *
 * The path is the point. A single camera can only report that something was
 * present. Joining sightings into one route is what lets an operator say where
 * a group is heading, which is the question a border post actually has.
 */

import { MapPin, Radio } from "lucide-react";

import { describeSeverity } from "../../lib/analytics/threat";

const STATUS_COLOUR = {
  online: "text-slate-400",
  degraded: "text-amber-400/80",
  offline: "text-slate-700",
};

export default function SectorMap({
  cameras,
  target = null,
  selectedCameraId = null,
  onSelectCamera = null,
  height = "min-h-[520px]",
}) {
  const sightings = target?.sightings ?? [];

  const path = sightings
    .map((sighting) => `${sighting.position.x},${sighting.position.y}`)
    .join(" ");

  const severity = target ? describeSeverity(target.severity) : null;

  return (
    <div
      className={`relative ${height} overflow-hidden rounded-xl border border-slate-800/70 bg-[#171a1f]`}
    >
      {/* Header */}
      <div className="absolute left-5 top-5 z-20">
        <h3 className="text-sm font-medium text-slate-200">Sector Alpha</h3>

        <p className="mt-1 text-[11px] text-slate-600">
          {cameras.length} cameras · {sightings.length > 0
            ? `${target.id} tracked across ${sightings.length}`
            : "no identity selected"}
        </p>
      </div>

      <div className="absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-slate-800/70 bg-[#111418]/80 px-3 py-1.5">
        <Radio size={11} className="text-emerald-400/80" />

        <span className="text-[9px] tracking-wider text-slate-600">LIVE</span>
      </div>

      {/* Grid */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(71,85,105,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(71,85,105,.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Map area */}
      <div className="absolute inset-x-10 bottom-10 top-20">
        {/* Terrain */}
        <div className="absolute left-[15%] top-[20%] h-48 w-72 rotate-12 rounded-[40%] border border-slate-700/40" />

        <div className="absolute left-[35%] top-[42%] h-40 w-80 -rotate-6 rounded-[50%] border border-slate-700/30" />

        <div className="absolute right-[12%] top-[18%] h-32 w-44 rotate-45 rounded-[40%] border border-slate-700/30" />

        {/* The border line itself, for orientation. */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 14 C 22 10, 44 20, 66 12 C 82 6, 92 12, 100 9"
            fill="none"
            stroke="rgba(148,163,184,0.28)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />

          {path && (
            <polyline
              points={path}
              fill="none"
              stroke="rgba(248,113,113,0.55)"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        <span className="absolute left-2 top-[8%] text-[9px] tracking-[0.18em] text-slate-700">
          INTERNATIONAL BORDER
        </span>

        {/* Cameras */}
        {cameras.map((camera) => {
          const active = camera.id === selectedCameraId;
          const sighted = sightings.some(
            (sighting) => sighting.cameraId === camera.id,
          );

          return (
            <button
              key={camera.id}
              type="button"
              onClick={() => onSelectCamera?.(camera.id)}
              disabled={!onSelectCamera}
              className="absolute -translate-x-1/2 -translate-y-1/2 disabled:cursor-default"
              style={{ left: `${camera.position.x}%`, top: `${camera.position.y}%` }}
            >
              <span className="relative block">
                <MapPin
                  size={17}
                  strokeWidth={1.5}
                  className={
                    sighted
                      ? "text-red-400"
                      : (STATUS_COLOUR[camera.status] ?? "text-slate-400")
                  }
                />

                <span
                  className={`absolute left-5 top-0 whitespace-nowrap text-[9px] ${
                    active ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {camera.id}
                </span>

                {sighted && (
                  <span className="absolute -inset-2 animate-ping rounded-full bg-red-400/10" />
                )}
              </span>
            </button>
          );
        })}

        {/* Sighting markers along the path */}
        {sightings.map((sighting, index) => (
          <div
            key={`${sighting.cameraId}-${sighting.clock}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${sighting.position.x}%`,
              top: `${sighting.position.y}%`,
            }}
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-400/15" />

              <span className="relative block h-2 w-2 rounded-full bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.5)]" />
            </span>

            <span className="absolute left-4 top-3 whitespace-nowrap text-[9px] text-red-300/90">
              {index + 1}. {sighting.clock}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-5 flex flex-wrap gap-4">
        <Key colour="bg-slate-400" label="Camera" />
        <Key colour="bg-amber-400/80" label="Degraded" />
        <Key colour="bg-slate-700" label="Offline" />
        <Key colour="bg-red-400" label="Sighting" />
      </div>

      {target && (
        <div className="absolute bottom-4 right-5 flex items-center gap-2 rounded-full border border-slate-800/70 bg-[#111418]/80 px-3 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${severity.dot}`} />

          <span className="text-[10px] text-slate-400">
            {target.id} · {target.heading}
          </span>
        </div>
      )}
    </div>
  );
}

function Key({ colour, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${colour}`} />

      <span className="text-[10px] text-slate-600">{label}</span>
    </div>
  );
}
