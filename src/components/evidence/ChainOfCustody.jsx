/**
 * Where the record came from and what has happened to it since.
 *
 * The digest is computed from the package contents at render time, not stored
 * with them — recomputing it and getting the same string is what makes it
 * meaningful. It is an integrity check on this record, not a signature and not
 * an attestation by any authority.
 */

import { Fingerprint } from "lucide-react";

import { formatVideoTime } from "./record";

const STATUS_STEP = {
  new: "Raised to the operator — not yet acknowledged.",
  acknowledged: "Acknowledged by the duty operator.",
  escalated: "Escalated to sector control.",
  resolved: "Closed by the duty operator.",
  suppressed: "Suppressed — classified as a non-threat.",
};

export default function ChainOfCustody({
  incident,
  camera,
  zone,
  evidence,
  digest,
  digestState,
}) {
  const steps = [
    {
      label: "Frame captured",
      detail: evidence
        ? `${camera?.id ?? incident.cameraId} · ${camera?.resolution ?? "unknown resolution"} · sampled at ${formatVideoTime(evidence.videoTime) ?? "an unrecorded point"} of the feed.`
        : `${camera?.id ?? incident.cameraId} · no still was retained for this entry.`,
    },
    {
      label: "Analysed on device",
      detail: evidence
        ? `Detection ran in the browser on the sampled frame${evidence.enhanced ? `, after low-light correction at γ${evidence.gamma}` : ""}. The frame was not sent anywhere.`
        : "Analysed by the sector engine when the entry was logged.",
    },
    {
      label: "Rule evaluated",
      detail: zone
        ? `${zone.name} — alert on ${zone.rule.trigger}${zone.rule.dwellSeconds ? ` after ${zone.rule.dwellSeconds}s` : ""} for ${zone.rule.classes.join(", ")}.`
        : `Fence ${incident.zoneId} — definition not retained.`,
    },
    {
      label: "Incident raised",
      detail: `${incident.id} at ${incident.clock} · threat ${incident.score} · ${incident.severity}.`,
    },
    {
      label: "Operator action",
      detail: STATUS_STEP[incident.status] ?? `Status: ${incident.status}.`,
    },
  ];

  return (
    <div>
      <ol className="m-0 list-none space-y-0 p-0">
        {steps.map((step, index) => (
          <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
            {index < steps.length - 1 && (
              <span className="absolute left-[3.5px] top-3 h-full w-px bg-slate-800" />
            )}

            <span className="relative mt-[5px] h-2 w-2 shrink-0 rounded-full border border-slate-700 bg-[#171a1f]" />

            <div className="min-w-0">
              <p className="text-[11px] text-slate-300">
                <span className="mr-2 text-[10px] tabular-nums text-slate-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {step.label}
              </p>

              <p className="mt-0.5 text-[10px] leading-4 text-slate-600">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-lg border border-slate-800/60 bg-[#14171b] p-3">
        <div className="flex items-center gap-2">
          <Fingerprint size={12} className="text-slate-600" />

          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            Integrity digest
          </p>
        </div>

        <p className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-300">
          {digestState === "ready" && digest ? (
            <>
              {digest.slice(0, 32)}
              <span className="text-slate-700">…{digest.slice(-8)}</span>
            </>
          ) : digestState === "unavailable" ? (
            <span className="font-sans text-[10px] text-slate-600">
              WebCrypto is not reachable on this origin, so no digest can be
              computed. Nothing is shown in its place.
            </span>
          ) : (
            <span className="font-sans text-[10px] text-slate-600">
              Computing…
            </span>
          )}
        </p>

        <p className="mt-2 text-[10px] leading-4 text-slate-600">
          SHA-256 over this record serialised as JSON with keys sorted at every
          level. Recomputing it from the exported file yields the same string,
          so any edit to the record is detectable. It is an integrity check, not
          a signature.
        </p>
      </div>
    </div>
  );
}
