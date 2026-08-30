import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

function getSeverity(severity) {
  if (severity === "high") {
    return {
      dot: "bg-red-400",
      text: "text-red-300",
    };
  }

  return {
    dot: "bg-amber-400",
    text: "text-amber-300",
  };
}

export default function PriorityIncidents({
  incidents,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-[#171a1f]">
      <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
        <div>
          <h3 className="text-sm font-medium text-slate-200">
            Priority Incidents
          </h3>

          <p className="mt-1 text-[11px] text-slate-600">
            Ranked by contextual threat score
          </p>
        </div>

        <button className="text-[11px] text-slate-600 transition hover:text-slate-300">
          View all
        </button>
      </div>

      <div>
        {incidents.map((incident, index) => {
          const severity = getSeverity(incident.severity);

          return (
            <motion.div
              key={incident.id}
              initial={{
                opacity: 0,
                x: 5,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.3,
                delay: 0.15 + index * 0.05,
              }}
              className="group flex items-center gap-4 border-b border-slate-800/50 px-5 py-4 last:border-b-0"
            >
              <div className="flex w-3 justify-center">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${severity.dot}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-700">
                    {incident.id}
                  </span>

                  <p className="truncate text-xs text-slate-300">
                    {incident.title}
                  </p>
                </div>

                <p className="mt-1 text-[10px] text-slate-600">
                  {incident.location} · {incident.camera}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-medium ${severity.text}`}
                >
                  {incident.score}
                </p>

                <p className="text-[9px] text-slate-700">
                  threat
                </p>
              </div>

              <span className="text-[10px] text-slate-700">
                {incident.time}
              </span>

              <ArrowUpRight
                size={14}
                className="text-slate-700 transition-colors group-hover:text-slate-400"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}