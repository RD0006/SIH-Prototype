import { motion } from "motion/react";
import Panel from "../components/ui/Panel";

const cameras = [
  {
    id: "CAM-04",
    sector: "Sector 02",
    location: "Northern Perimeter",
    status: "online",
    detections: 18,
    lastSeen: "11:42:08",
  },
  {
    id: "CAM-07",
    sector: "Sector 04",
    location: "Eastern Checkpoint",
    status: "online",
    detections: 24,
    lastSeen: "11:42:12",
  },
  {
    id: "CAM-12",
    sector: "Sector 06",
    location: "Patrol Route B",
    status: "online",
    detections: 11,
    lastSeen: "11:42:15",
  },
  {
    id: "CAM-18",
    sector: "Sector 08",
    location: "Restricted Zone",
    status: "alert",
    detections: 31,
    lastSeen: "11:41:52",
  },
  {
    id: "CAM-23",
    sector: "Sector 09",
    location: "Southern Perimeter",
    status: "online",
    detections: 16,
    lastSeen: "11:42:19",
  },
  {
    id: "CAM-26",
    sector: "Sector 11",
    location: "Service Road",
    status: "offline",
    detections: 0,
    lastSeen: "10:17:41",
  },
];

function CameraCard({ camera, index }) {
  const isAlert = camera.status === "alert";
  const isOffline = camera.status === "offline";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="overflow-hidden rounded-2xl border border-[#26343b] bg-[#11191f]"
    >
      {/* Camera preview */}
      <div className="relative aspect-video overflow-hidden bg-[#0b1014]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1c2b31_0%,#0b1014_70%)]" />

        {/* Scan lines */}
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:100%_4px]" />

        {/* Camera label */}
        <div className="absolute left-3 top-3 rounded-md border border-[#26343b] bg-[#0b1014]/80 px-2 py-1 backdrop-blur">
          <span className="font-mono text-[9px] text-[#a3afb3]">
            {camera.id}
          </span>
        </div>

        {/* Status */}
        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-md border border-[#26343b] bg-[#0b1014]/80 px-2 py-1 backdrop-blur">
          <motion.span
            animate={
              isAlert
                ? { opacity: [1, 0.3, 1] }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className={`h-1.5 w-1.5 rounded-full ${
              isAlert
                ? "bg-[#d95c5c]"
                : isOffline
                  ? "bg-[#718087]"
                  : "bg-[#65a982]"
            }`}
          />

          <span className="text-[8px] uppercase tracking-wider text-[#a3afb3]">
            {camera.status}
          </span>
        </div>

        {/* Simulated camera reticle */}
        {!isOffline && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-16 w-16 border border-[#5fa9a3]/20">
              <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-[#5fa9a3]/50" />
              <span className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-[#5fa9a3]/50" />
              <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[#5fa9a3]/50" />
              <span className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[#5fa9a3]/50" />
            </div>
          </div>
        )}

        {isOffline && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#4f5d63]">
              Feed unavailable
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-[#e7ecea]">
              {camera.location}
            </h3>

            <p className="mt-1 text-[10px] text-[#718087]">
              {camera.sector}
            </p>
          </div>

          <span className="font-mono text-[9px] text-[#4f5d63]">
            {camera.id}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#26343b] pt-3">
          <div>
            <p className="text-[8px] uppercase tracking-wider text-[#718087]">
              Detections
            </p>

            <p className="mt-1 font-mono text-sm text-[#e7ecea]">
              {camera.detections}
            </p>
          </div>

          <div>
            <p className="text-[8px] uppercase tracking-wider text-[#718087]">
              Last signal
            </p>

            <p className="mt-1 font-mono text-sm text-[#a3afb3]">
              {camera.lastSeen}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Surveillance() {
  const online = cameras.filter(
    (camera) => camera.status === "online"
  ).length;

  const alerts = cameras.filter(
    (camera) => camera.status === "alert"
  ).length;

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d6a84f]">
          Surveillance network
        </p>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#e7ecea]">
              Camera monitoring
            </h1>

            <p className="mt-1 text-xs text-[#718087]">
              Monitor connected cameras and AI detection activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#65a982]" />

            <span className="text-[10px] uppercase tracking-wider text-[#65a982]">
              Network operational
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel className="p-5">
          <p className="text-[9px] uppercase tracking-wider text-[#718087]">
            Total cameras
          </p>

          <p className="mt-2 font-mono text-2xl text-[#e7ecea]">
            {cameras.length}
          </p>
        </Panel>

        <Panel className="p-5">
          <p className="text-[9px] uppercase tracking-wider text-[#718087]">
            Online
          </p>

          <p className="mt-2 font-mono text-2xl text-[#65a982]">
            {online}
          </p>
        </Panel>

        <Panel className="p-5">
          <p className="text-[9px] uppercase tracking-wider text-[#718087]">
            Alerts
          </p>

          <p className="mt-2 font-mono text-2xl text-[#d95c5c]">
            {alerts}
          </p>
        </Panel>

        <Panel className="p-5">
          <p className="text-[9px] uppercase tracking-wider text-[#718087]">
            AI detections
          </p>

          <p className="mt-2 font-mono text-2xl text-[#d6a84f]">
            100
          </p>
        </Panel>
      </div>

      {/* Camera grid */}
      <Panel
        eyebrow="Live feeds"
        title="Camera network"
        action={
          <span className="text-[9px] uppercase tracking-wider text-[#718087]">
            {online}/{cameras.length} online
          </span>
        }
        className="overflow-hidden"
      >
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {cameras.map((camera, index) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              index={index}
            />
          ))}
        </div>
      </Panel>
    </main>
  );
}

export default Surveillance;