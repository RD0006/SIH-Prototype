/**
 * What the ALPR engine actually produced.
 *
 * Shows the aggregated reading, the crop it came from, how much of the evidence
 * agrees, and — deliberately — the frames it refused. A panel that only ever
 * showed successes would misrepresent the system: on a border feed most
 * vehicles are too far away to read, and an operator needs to see that the
 * engine knows the difference between "no plate" and "not readable".
 */

import { ScanText, ShieldQuestion } from "lucide-react";

import { describeCertainty } from "../../lib/alpr";

export default function PlatePanel({ plates }) {
  const { results = [], telemetry, last } = plates ?? {};

  const refusal = last && !last.ok ? last : null;

  if (results.length === 0 && !refusal) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-4">
      <div className="flex items-center gap-2">
        <ScanText size={13} className="text-slate-500" />

        <h3 className="text-xs font-medium text-slate-300">Number plates</h3>
      </div>

      <p className="mt-1 text-[10px] text-slate-600">
        Detected and read in software from a standard camera.
      </p>

      <div className="mt-3 space-y-2">
        {results.map((entry) => {
          const certainty = describeCertainty(entry.result);

          return (
            <div
              key={entry.result.plate}
              className="rounded-lg border border-slate-800/60 bg-[#14171b] p-2.5"
            >
              {entry.result.bestCrop && (
                <img
                  src={entry.result.bestCrop}
                  alt="Detected plate region"
                  className="mb-2 w-full rounded border border-slate-800/60"
                />
              )}

              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-sm tracking-[0.12em] text-slate-100">
                  {entry.result.plate}
                </p>

                <span className={`text-[10px] ${certainty.tone}`}>
                  {certainty.label}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-slate-600">
                {entry.trackIds?.length > 1
                  ? `${entry.trackIds.length} tracks merged`
                  : entry.trackId}{" "}
                · {entry.result.format}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-600">
                {(entry.result.confidence * 100).toFixed(0)}% agreement over{" "}
                {entry.result.samples}{" "}
                {entry.result.samples === 1 ? "frame" : "frames"}
                {" · weakest character "}
                {(entry.result.weakest * 100).toFixed(0)}%
              </p>

              {entry.result.repairs.length > 0 && (
                <p className="mt-1 rounded border border-amber-900/40 bg-amber-950/10 px-2 py-1 text-[9px] leading-4 text-amber-300/80">
                  Format-corrected:{" "}
                  {entry.result.repairs
                    .map((repair) => `${repair.from}→${repair.to}`)
                    .join(", ")}{" "}
                  — only characters the model was unsure of were changed.
                </p>
              )}

              {!entry.result.conforms && (
                <p className="mt-1 rounded border border-slate-800/60 px-2 py-1 text-[9px] leading-4 text-slate-500">
                  Does not match a known plate format. Reported exactly as read.
                </p>
              )}
            </div>
          );
        })}

        {refusal && (
          <div className="flex items-start gap-2 rounded-lg border border-slate-800/60 bg-[#14171b] p-2.5">
            <ShieldQuestion
              size={12}
              className="mt-0.5 shrink-0 text-slate-600"
            />

            <div>
              <p className="text-[10px] text-slate-500">
                Last attempt declined at{" "}
                <span className="text-slate-400">{refusal.stage}</span>
              </p>

              <p className="mt-0.5 text-[10px] leading-4 text-slate-600">
                {refusal.reason}
              </p>
            </div>
          </div>
        )}
      </div>

      {telemetry && telemetry.framesProcessed > 0 && (
        <div className="mt-3 border-t border-slate-800/60 pt-2.5">
          <p className="text-[9px] leading-4 text-slate-600">
            {telemetry.framesProcessed} frames · {telemetry.platesDetected}{" "}
            located · {telemetry.readsAccepted} read ·{" "}
            {telemetry.cropsRejected} refused on quality
          </p>

          {telemetry.meanDetectMs !== null && (
            <p className="text-[9px] leading-4 text-slate-700">
              detect {telemetry.meanDetectMs.toFixed(0)}ms · recognise{" "}
              {telemetry.meanRecogniseMs?.toFixed(0) ?? "—"}ms
            </p>
          )}
        </div>
      )}
    </div>
  );
}
