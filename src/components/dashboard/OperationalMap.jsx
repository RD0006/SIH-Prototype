import { MapPin, Radio } from "lucide-react";

const cameras = [
  {
    id: "BOP-03",
    x: "22%",
    y: "30%",
    status: "online",
  },
  {
    id: "ROAD-04",
    x: "47%",
    y: "48%",
    status: "online",
  },
  {
    id: "BOP-07",
    x: "72%",
    y: "34%",
    status: "alert",
  },
  {
    id: "BOP-09",
    x: "63%",
    y: "72%",
    status: "online",
  },
  {
    id: "ROAD-02",
    x: "30%",
    y: "70%",
    status: "offline",
  },
];

export default function OperationalMap() {
  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-xl border border-slate-800/70 bg-[#171a1f]">
      {/* Header */}
      <div className="absolute left-5 top-5 z-10">
        <h3 className="text-sm font-medium text-slate-200">
          Operational Map
        </h3>

        <p className="mt-1 text-[11px] text-slate-600">
          Sector Alpha
        </p>
      </div>

      {/* Live indicator */}
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-full border border-slate-800/70 bg-[#111418]/80 px-3 py-1.5">
        <Radio
          size={11}
          className="text-emerald-400/80"
        />

        <span className="text-[9px] tracking-wider text-slate-600">
          LIVE
        </span>
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
        {/* Terrain shapes */}
        <div className="absolute left-[15%] top-[20%] h-48 w-72 rotate-12 rounded-[40%] border border-slate-700/40" />

        <div className="absolute left-[35%] top-[42%] h-40 w-80 -rotate-6 rounded-[50%] border border-slate-700/30" />

        <div className="absolute right-[12%] top-[18%] h-32 w-44 rotate-45 rounded-[40%] border border-slate-700/30" />

        {/* Camera markers */}
        {cameras.map((camera) => (
          <div
            key={camera.id}
            className="absolute"
            style={{
              left: camera.x,
              top: camera.y,
            }}
          >
            <div className="relative">
              <MapPin
                size={17}
                strokeWidth={1.5}
                className={
                  camera.status === "alert"
                    ? "text-red-400"
                    : camera.status === "offline"
                      ? "text-slate-700"
                      : "text-slate-400"
                }
              />

              <span className="absolute left-5 top-0 whitespace-nowrap text-[9px] text-slate-600">
                {camera.id}
              </span>

              {camera.status === "alert" && (
                <span className="absolute -inset-2 animate-ping rounded-full bg-red-400/10" />
              )}
            </div>
          </div>
        ))}

        {/* Target */}
        <div className="absolute left-[52%] top-[30%]">
          <div className="relative">
            <span className="absolute -inset-2 animate-ping rounded-full bg-red-400/10" />

            <span className="relative block h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.45)]" />

            <span className="absolute left-4 top-0 whitespace-nowrap text-[9px] text-red-300">
              T-024
            </span>
          </div>
        </div>

        {/* Target trajectory */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 22 30 C 35 35, 40 45, 52 30 C 60 25, 68 35, 72 34"
            fill="none"
            stroke="rgba(248,113,113,0.35)"
            strokeWidth="0.4"
            strokeDasharray="2 2"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-5 flex gap-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span className="text-[10px] text-slate-600">
            Camera
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          <span className="text-[10px] text-slate-600">
            Active target
          </span>
        </div>
      </div>
    </div>
  );
}