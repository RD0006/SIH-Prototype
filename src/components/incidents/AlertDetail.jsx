/**
 * The detail pane.
 *
 * Everything an operator needs to make one decision about one alert: what was
 * seen, where, why it scored what it scored, what the camera actually captured,
 * and the four actions that close the loop. The score explanation sits above
 * the evidence deliberately — the reasoning is the part a human has to audit.
 */

import { BellOff, ShieldOff } from "lucide-react";

import ThreatBreakdown from "./ThreatBreakdown";
import EvidencePanel from "./EvidencePanel";
import { ACTIONS, describeStatus, isSuppressed } from "./status";
import { describeSeverity } from "../../lib/analytics/threat";
import { DOMAIN_COLOR } from "../../lib/analytics/classes";
import { getCamera } from "../../data/cameras";
import { getZone } from "../../data/zones";

export default function AlertDetail({ incident, evidence, onAction }) {
  if (!incident) {
    return (
      <div className="flex h-full min-h-[24rem] items-center justify-center rounded-xl border border-slate-800/70 bg-[#171a1f]">
        <div className="text-center">
          <p className="text-xs text-slate-500">No incident selected</p>

          <p className="mt-1 text-[10px] text-slate-700">
            Pick a row from the queue to see how its score was reached.
          </p>
        </div>
      </div>
    );
  }

  const severity = describeSeverity(incident.severity);
  const status = describeStatus(incident.status);
  const suppressed = isSuppressed(incident);
  const camera = getCamera(incident.cameraId);
  const zone = getZone(incident.zoneId);
  const colour = DOMAIN_COLOR[incident.domain] ?? DOMAIN_COLOR.other;

  // The scorer suppresses at score zero; an operator dismissal keeps its score.
  const bySystem = incident.suppressed === true || incident.score === 0;

  return (
    <div className="max-h-[calc(100vh-16rem)] space-y-4 overflow-y-auto pr-1">
      {/* Identity and operator actions */}
      <div className="rounded-xl border border-slate-800/70 bg-[#171a1f]">
        <div className="border-b border-slate-800/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                suppressed ? "bg-slate-700" : severity.dot
              }`}
            />

            <span className="text-[10px] text-slate-600">{incident.id}</span>

            {incident.live && (
              <span className="flex items-center gap-1 text-[9px] tracking-[0.14em] text-emerald-300/80">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </span>
            )}

            <span
              className={`ml-auto rounded border px-2 py-0.5 text-[9px] ${status.pill}`}
            >
              {status.label}
            </span>
          </div>

          <h2 className="mt-2 text-lg font-medium tracking-tight text-slate-100">
            {incident.title}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
            <span
              className="flex items-center gap-1.5"
              style={{ color: colour }}
            >
              <span
                className="h-1 w-1 rounded-full"
                style={{ background: colour }}
              />
              {incident.display}
            </span>

            <span>·</span>
            <span>{incident.cameraId}</span>
            <span>·</span>
            <span>{zone ? zone.name : "Unassigned zone"}</span>
            <span>·</span>
            <span>{incident.clock}</span>
            <span>·</span>
            <span>Track {incident.trackId}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-4">
          {ACTIONS.map((action) => {
            const disabled = action.blocked.includes(incident.status);

            return (
              <button
                key={action.status}
                onClick={() => onAction(incident.id, action.status)}
                disabled={disabled}
                className={`rounded-lg border px-3 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent ${action.tone}`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Why nothing was raised — the counter-argument to motion-triggered CCTV */}
      {suppressed && (
        <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
          <div className="flex items-center gap-2">
            {bySystem ? (
              <ShieldOff size={13} className="text-slate-500" />
            ) : (
              <BellOff size={13} className="text-slate-500" />
            )}

            <h3 className="text-xs font-medium text-slate-300">
              {bySystem
                ? "Deliberately not alerted"
                : "Dismissed as a false alarm"}
            </h3>
          </div>

          {bySystem ? (
            <>
              <p className="mt-2.5 text-[11px] leading-5 text-slate-400">
                {incident.display} was detected, classified, and logged — and
                then withheld from the operator&apos;s alert stream. A
                motion-triggered camera would have raised this as an intrusion.
              </p>

              <p className="mt-2 text-[10px] leading-4 text-slate-600">
                Livestock and other recognised non-threats are the largest
                single source of false alarms on conventional CCTV. The
                suppression is written to the log with its reasoning, so the
                decision stays auditable rather than silent.
              </p>
            </>
          ) : (
            <p className="mt-2.5 text-[11px] leading-5 text-slate-400">
              An operator overruled the score and closed this alert. The
              reasoning below is retained unchanged — a dismissal hides the
              alert, it does not erase how the platform reached it.
            </p>
          )}
        </div>
      )}

      {/* The centrepiece */}
      <ThreatBreakdown incident={incident} />

      {/* Plate recognition, when the frame carried one */}
      {incident.anpr && (
        <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
          <h3 className="text-xs font-medium text-slate-300">
            Number plate read
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-800/60 bg-[#14171b] px-4 py-3">
            <span className="font-mono text-lg tracking-[0.18em] text-slate-100">
              {incident.anpr.plate}
            </span>

            <span className="text-[10px] text-slate-600">
              {(incident.anpr.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>

          <p className="mt-2.5 text-[10px] leading-4 text-slate-600">
            Read in software from a frame of the existing {incident.cameraId}{" "}
            feed. No ANPR camera, illuminator, or capture unit is installed on
            this road — the plate was recovered from the same H.264 stream the
            post already records.
          </p>
        </div>
      )}

      {/* Where it happened */}
      <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
        <h3 className="text-xs font-medium text-slate-300">Context</h3>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-800/60 bg-[#14171b] p-3">
            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-700">
              Camera
            </p>

            <p className="mt-1.5 text-[11px] text-slate-300">
              {camera ? camera.name : incident.cameraId}
            </p>

            <p className="mt-1 text-[10px] leading-4 text-slate-600">
              {camera
                ? `${camera.model} · ${camera.resolution} · ${camera.status}`
                : "Camera not in the current estate record."}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800/60 bg-[#14171b] p-3">
            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-700">
              Virtual fence
            </p>

            <p className="mt-1.5 text-[11px] text-slate-300">
              {zone ? zone.name : "Unassigned zone"}
            </p>

            <p className="mt-1 text-[10px] leading-4 text-slate-600">
              {zone
                ? `${zone.kind} · criticality ×${zone.criticality.toFixed(2)} · alert on ${zone.rule.trigger}`
                : "No fence rule is attached to this incident."}
            </p>
          </div>
        </div>

        {zone?.note && (
          <p className="mt-3 text-[10px] leading-4 text-slate-600">
            {zone.note}
          </p>
        )}
      </div>

      <EvidencePanel incident={incident} evidence={evidence} />
    </div>
  );
}
