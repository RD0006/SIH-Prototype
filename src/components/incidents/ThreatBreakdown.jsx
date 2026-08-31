/**
 * The threat-score audit trail.
 *
 * An operator who cannot see why something scored 87 will eventually ignore
 * the number, and then the system. So every factor the scorer applied is
 * listed with its signed contribution and the sentence that justifies it,
 * including the ones that pushed the score *down* — a de-escalation is
 * evidence the system is discriminating rather than just accumulating alarm.
 */

import { describeSeverity } from "../../lib/analytics/threat";

/** Factors of 20 or more are what actually decided the alert — mark them. */
const MAJOR = 20;

function toneFor(delta) {
  if (delta < 0) {
    return {
      text: "text-emerald-300",
      bar: "bg-emerald-400/70",
    };
  }

  if (delta >= MAJOR) {
    return {
      text: "text-red-300",
      bar: "bg-red-400/70",
    };
  }

  if (delta > 0) {
    return {
      text: "text-amber-300",
      bar: "bg-amber-400/70",
    };
  }

  return {
    text: "text-slate-500",
    bar: "bg-slate-700",
  };
}

function signed(delta) {
  if (delta > 0) {
    return `+${delta}`;
  }

  return String(delta);
}

export default function ThreatBreakdown({ incident }) {
  const factors = incident.factors ?? [];

  const largest = factors.reduce(
    (max, factor) => Math.max(max, Math.abs(factor.delta)),
    0,
  );

  const severity = describeSeverity(incident.severity);

  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#171a1f]">
      <div className="border-b border-slate-800/60 px-5 py-4">
        <h3 className="text-sm font-medium text-slate-200">
          How this score was reached
        </h3>

        <p className="mt-1 text-[11px] text-slate-600">
          Every point is attributable to a named factor. The operator can
          overrule any of them.
        </p>
      </div>

      <div className="divide-y divide-slate-800/40">
        {factors.length === 0 && (
          <p className="px-5 py-6 text-[11px] text-slate-600">
            No scoring factors were recorded for this incident.
          </p>
        )}

        {factors.map((factor, index) => {
          const tone = toneFor(factor.delta);

          const width =
            largest === 0 ? 2 : Math.max(2, (Math.abs(factor.delta) / largest) * 100);

          return (
            <div key={`${factor.label}-${index}`} className="px-5 py-3">
              <div className="flex items-baseline gap-3">
                <p className="min-w-0 flex-1 truncate text-[11px] text-slate-300">
                  {factor.label}
                </p>

                <p
                  className={`shrink-0 text-xs font-medium tabular-nums ${tone.text}`}
                >
                  {signed(factor.delta)}
                </p>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/50">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${width}%` }}
                />
              </div>

              <p className="mt-2 text-[10px] leading-4 text-slate-600">
                {factor.why}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-end justify-between border-t border-slate-800/60 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Final threat score
          </p>

          <p className="mt-1.5 text-[10px] text-slate-700">
            Bands: 72 and above high · 44 and above medium · below 44 low.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded border px-2 py-0.5 text-[10px] ${severity.ring}`}
          >
            {severity.label}
          </span>

          <span
            className={`text-3xl font-semibold leading-none tabular-nums ${severity.text}`}
          >
            {incident.score}
          </span>
        </div>
      </div>
    </div>
  );
}
