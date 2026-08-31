import { motion } from "motion/react";

/**
 * The session's own numbers, straight from shared state.
 *
 * Everything here is counted by the platform during this session rather than
 * quoted from a brochure — the detection total in particular is zero until an
 * operator actually runs the console, and it should look that way.
 */
export default function SessionCounters({ stats }) {
  const counters = [
    {
      label: "Cameras in estate",
      value: stats.totalCameras,
      detail: "All commodity fixed IP cameras",
      dot: "bg-slate-600",
    },
    {
      label: "Online",
      value: stats.online,
      detail: "Streaming normally",
      dot: "bg-emerald-400/80",
    },
    {
      label: "Degraded",
      value: stats.degraded,
      detail: "Reduced frame rate or packet loss",
      dot: "bg-amber-400/80",
    },
    {
      label: "Offline",
      value: stats.offline,
      detail: "No stream reaching the console",
      dot: "bg-slate-700",
    },
    {
      label: "Open incidents",
      value: stats.openIncidents,
      detail: "Neither resolved nor suppressed",
      dot: "bg-sky-400/80",
    },
    {
      label: "High priority",
      value: stats.highPriority,
      detail: "Threat score 72 and above",
      dot: "bg-red-400/80",
    },
    {
      label: "Suppressed",
      value: stats.suppressed,
      detail: "Recognised non-threats, not alerted",
      dot: "bg-slate-600",
    },
    {
      label: "Detections processed",
      value: stats.detections,
      detail: "Relevant objects seen this session",
      dot: "bg-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {counters.map((counter, index) => (
        <motion.div
          key={counter.label}
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
            delay: index * 0.04,
            ease: "easeOut",
          }}
          className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-4"
        >
          <p className="text-[11px] text-slate-500">{counter.label}</p>

          <div className="mt-2.5 flex items-end justify-between">
            <p className="text-2xl font-semibold tracking-tight text-slate-100">
              {counter.value}
            </p>

            <span
              className={`mb-1.5 h-1.5 w-1.5 rounded-full ${counter.dot}`}
            />
          </div>

          <p className="mt-2 text-[10px] leading-4 text-slate-600">
            {counter.detail}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
