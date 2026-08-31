/**
 * The ranked queue.
 *
 * The whole point of the page: an operator cannot watch every feed in the
 * sector, so the platform collapses all of them into one list and puts the
 * thing that matters most at the top. Every row carries the score that earned
 * it its position, so the ordering is never mysterious.
 */

import { motion } from "motion/react";
import { Inbox } from "lucide-react";

import { describeSeverity } from "../../lib/analytics/threat";
import { getZone } from "../../data/zones";
import { describeStatus, isSuppressed } from "./status";

export default function AlertQueue({ incidents, selectedId, onSelect }) {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <Inbox size={18} className="text-slate-700" />

        <p className="mt-3 text-xs text-slate-500">
          No incidents match these filters.
        </p>

        <p className="mt-1 text-[10px] text-slate-700">
          Widen the severity or status filter to see the rest of the log.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-27rem)] min-h-[18rem] overflow-y-auto">
      {incidents.map((incident, index) => {
        const severity = describeSeverity(incident.severity);
        const status = describeStatus(incident.status);
        const suppressed = isSuppressed(incident);
        const zone = getZone(incident.zoneId);
        const selected = incident.id === selectedId;

        return (
          <motion.button
            key={incident.id}
            initial={{
              opacity: 0,
              x: 4,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.25,
              delay: Math.min(index, 8) * 0.03,
            }}
            onClick={() => onSelect(incident.id)}
            className={`flex w-full items-start gap-3 border-b border-slate-800/50 px-4 py-3 text-left transition-colors last:border-b-0 ${
              selected
                ? "bg-slate-800/40"
                : "hover:bg-slate-800/25"
            } ${suppressed && !selected ? "opacity-60" : ""}`}
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                suppressed ? "bg-slate-700" : severity.dot
              }`}
            />

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600">
                  {incident.id}
                </span>

                {incident.live && (
                  <span className="flex items-center gap-1 text-[9px] tracking-[0.14em] text-emerald-300/80">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                )}

                <span
                  className={`ml-auto shrink-0 rounded border px-1.5 py-0.5 text-[9px] ${status.pill}`}
                >
                  {status.label}
                </span>
              </span>

              <span
                className={`mt-1 block truncate text-xs ${
                  suppressed ? "text-slate-500" : "text-slate-300"
                }`}
              >
                {incident.title}
              </span>

              <span className="mt-1 block truncate text-[10px] text-slate-600">
                {incident.cameraId} · {zone ? zone.name : "Unassigned zone"}
              </span>
            </span>

            <span className="shrink-0 pl-1 text-right">
              <span
                className={`block text-lg font-medium leading-none ${
                  suppressed ? "text-slate-600" : severity.text
                }`}
              >
                {incident.score}
              </span>

              <span className="mt-1 block text-[9px] text-slate-700">
                threat
              </span>

              <span className="mt-1.5 block text-[10px] text-slate-600">
                {incident.clock}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
