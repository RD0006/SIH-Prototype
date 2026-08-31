import { motion } from "motion/react";
import Panel from "../ui/Panel";

const incidents = [
  {
    id: "INC-104",
    type: "Unknown movement",
    sector: "Sector 04",
    camera: "CAM-18",
    time: "11:41:52",
    priority: "HIGH",
    description: "Movement detected near restricted zone.",
  },
  {
    id: "INC-103",
    type: "Vehicle detected",
    sector: "Sector 07",
    camera: "CAM-23",
    time: "11:39:17",
    priority: "MEDIUM",
    description: "Unregistered vehicle entering monitored area.",
  },
  {
    id: "INC-102",
    type: "Restricted entry",
    sector: "Sector 02",
    camera: "CAM-04",
    time: "11:36:08",
    priority: "HIGH",
    description: "Human movement detected inside restricted zone.",
  },
  {
    id: "INC-101",
    type: "Unusual activity",
    sector: "Sector 06",
    camera: "CAM-12",
    time: "11:31:44",
    priority: "LOW",
    description: "Activity differs from normal movement pattern.",
  },
];

const priorityStyles = {
  HIGH: {
    badge: "border-[#d95c5c]/30 bg-[#d95c5c]/10 text-[#d95c5c]",
    dot: "bg-[#d95c5c]",
  },
  MEDIUM: {
    badge: "border-[#d6a84f]/30 bg-[#d6a84f]/10 text-[#d6a84f]",
    dot: "bg-[#d6a84f]",
  },
  LOW: {
    badge: "border-[#5fa9a3]/30 bg-[#5fa9a3]/10 text-[#5fa9a3]",
    dot: "bg-[#5fa9a3]",
  },
};

function PriorityIncidents() {
  return (
    <Panel
      eyebrow="AI detection"
      title="Priority incidents"
      action={
        <span className="rounded-md border border-[#26343b] bg-[#172128] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#829096]">
          {incidents.length} Active
        </span>
      }
      className="overflow-hidden"
    >
      <div className="divide-y divide-[#26343b]">
        {incidents.map((incident, index) => {
          const style = priorityStyles[incident.priority];

          return (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.07,
              }}
              whileHover={{
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
              className="group cursor-pointer p-4 transition-colors"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <motion.span
                    animate={
                      incident.priority === "HIGH"
                        ? {
                            opacity: [1, 0.35, 1],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                    }}
                    className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`}
                  />

                  <span className="truncate text-xs font-semibold text-[#e7ecea]">
                    {incident.type}
                  </span>
                </div>

                <span
                  className={`shrink-0 rounded-md border px-2 py-1 text-[8px] font-bold tracking-wider ${style.badge}`}
                >
                  {incident.priority}
                </span>
              </div>

              {/* Description */}
              <p className="mt-2 text-[10px] leading-relaxed text-[#718087]">
                {incident.description}
              </p>

              {/* Metadata */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[#829096]">
                <span>{incident.sector}</span>

                <span className="text-[#4f5d63]">•</span>

                <span>{incident.camera}</span>

                <span className="text-[#4f5d63]">•</span>

                <span className="font-mono text-[#718087]">
                  {incident.time}
                </span>
              </div>

              {/* Hover action */}
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[8px] tracking-wider text-[#4f5d63]">
                  {incident.id}
                </span>

                <span className="translate-x-1 text-[9px] text-[#d6a84f] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                  View incident →
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-[#26343b] px-4 py-3">
        <button className="w-full hover:cursor-pointer rounded-lg border border-[#26343b] bg-[#172128] py-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#829096] transition hover:border-[#d6a84f]/30 hover:text-[#d6a84f]">
          View all incidents
        </button>
      </div>
    </Panel>
  );
}

export default PriorityIncidents;