/**
 * One evidence package, laid out as a document.
 *
 * The ordering is the order a report is written in: what was seen, under what
 * conditions, what the detector said, why it scored what it did, and who has
 * touched it since. A dashboard would let an operator read those out of order;
 * a filable record should not.
 */

import { Copy, Check, Download, ShieldCheck } from "lucide-react";

import CapturedFrame from "./CapturedFrame";
import ChainOfCustody from "./ChainOfCustody";
import { formatVideoTime } from "./record";
import { describeSeverity } from "../../lib/analytics/threat";

export default function EvidencePackage({
  incident,
  camera,
  zone,
  evidence,
  digest,
  digestState,
  copied,
  onExport,
  onCopyDigest,
}) {
  const severity = describeSeverity(incident.severity);
  const total = (incident.factors ?? []).reduce(
    (sum, factor) => sum + factor.delta,
    0,
  );

  return (
    <article className="overflow-hidden rounded-xl border border-slate-800/70 bg-[#171a1f]">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
              Evidence package · {incident.id}
            </p>

            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-100">
              {incident.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${severity.ring}`}
              >
                {severity.label} · {incident.score}
              </span>

              <span className="rounded border border-slate-800 bg-slate-900/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                {incident.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                evidence
                  ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-300/90"
                  : "border-slate-800 bg-slate-900/40 text-slate-500"
              }`}
            >
              <ShieldCheck size={12} />

              <span className="text-[10px] uppercase tracking-[0.16em]">
                {evidence ? "Sealed" : "Archived"}
              </span>

              <span className="font-mono text-[10px] text-slate-500">
                {incident.clock}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onExport}
                className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700/50"
              >
                <Download size={13} />
                Export JSON
              </button>

              <button
                onClick={onCopyDigest}
                disabled={digestState !== "ready"}
                className="flex items-center gap-2 rounded-lg border border-slate-800/70 px-3 py-2 text-xs text-slate-400 transition hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy digest"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Captured frame */}
      <Section
        index="01"
        title="Captured frame"
        hint="The still the alert was raised from, with the detector output drawn over it."
      >
        <CapturedFrame
          incident={incident}
          camera={camera}
          zone={zone}
          evidence={evidence}
        />
      </Section>

      {/* Capture conditions */}
      <Section
        index="02"
        title="Capture conditions"
        hint="What the frame was taken with and what was done to it before analysis. A record that omits this cannot be relied on."
      >
        <div className="overflow-x-auto">
          <div className="grid min-w-[26rem] gap-x-10 sm:grid-cols-2">
            <Row label="Camera" value={camera?.id ?? incident.cameraId} />
            <Row label="Model" value={camera?.model ?? "not in estate"} />
            <Row label="Resolution" value={camera?.resolution ?? "unknown"} />
            <Row
              label="Frame rate"
              value={camera ? `${camera.fps} fps` : "unknown"}
            />
            <Row
              label="Video time"
              value={
                evidence
                  ? (formatVideoTime(evidence.videoTime) ?? "not recorded")
                  : "not retained"
              }
              mono
            />
            <Row
              label="Mean luminance"
              value={evidence ? `${evidence.luminance} / 255` : "not retained"}
              mono
            />
            <Row
              label="Hours of darkness"
              value={evidence ? (evidence.night ? "yes" : "no") : "not retained"}
            />
            <Row
              label="Low-light enhancement"
              value={
                evidence
                  ? evidence.enhanced
                    ? `applied · γ ${evidence.gamma}`
                    : "not applied"
                  : "not retained"
              }
            />
          </div>
        </div>
      </Section>

      {/* Detection record */}
      <Section
        index="03"
        title="Detection record"
        hint="What the detector reported and which rule turned it into an alert."
      >
        <div className="overflow-x-auto">
          <div className="grid min-w-[26rem] gap-x-10 sm:grid-cols-2">
            <Row label="Class" value={incident.display} />
            <Row label="Tracked identity" value={incident.trackId} mono />
            <Row
              label="Confidence"
              value={
                typeof incident.confidence === "number"
                  ? `${(incident.confidence * 100).toFixed(0)}%`
                  : "not recorded"
              }
              mono
            />
            <Row label="Fence" value={zone?.name ?? incident.zoneId} />
            <Row
              label="Rule"
              value={
                zone
                  ? `alert on ${zone.rule.trigger}${
                      zone.rule.dwellSeconds
                        ? ` after ${zone.rule.dwellSeconds}s`
                        : ""
                    }`
                  : "not retained"
              }
            />
            <Row
              label="Applies to"
              value={zone ? zone.rule.classes.join(", ") : "not retained"}
            />
          </div>
        </div>

        {incident.anpr && (
          <p className="mt-3 text-[11px] text-slate-400">
            Plate read{" "}
            <span className="font-mono text-slate-200">
              {incident.anpr.plate}
            </span>{" "}
            <span className="text-slate-600">
              at {(incident.anpr.confidence * 100).toFixed(0)}% confidence
            </span>
          </p>
        )}
      </Section>

      {/* Threat assessment */}
      <Section
        index="04"
        title="Threat assessment"
        hint="Summary only — the full reasoning for each factor is on the Incidents page."
      >
        <div className="space-y-1">
          {(incident.factors ?? []).map((factor) => (
            <div
              key={factor.label}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="min-w-0 truncate text-[11px] text-slate-400">
                {factor.label}
              </span>

              <span
                className={`shrink-0 font-mono text-[11px] tabular-nums ${
                  factor.delta > 0
                    ? "text-red-300/80"
                    : factor.delta < 0
                      ? "text-emerald-300/80"
                      : "text-slate-600"
                }`}
              >
                {factor.delta > 0 ? "+" : ""}
                {factor.delta}
              </span>
            </div>
          ))}

          <div className="flex items-baseline justify-between gap-4 border-t border-slate-800/60 pt-2">
            <span className="text-[11px] text-slate-300">
              Total · {severity.label.toLowerCase()} severity
            </span>

            <span className={`font-mono text-[11px] tabular-nums ${severity.text}`}>
              {incident.score}
              {total !== incident.score && (
                <span className="ml-1 text-slate-700">(sum {total})</span>
              )}
            </span>
          </div>
        </div>
      </Section>

      {/* Chain of custody */}
      <Section
        index="05"
        title="Chain of custody"
        hint="Every hand the record has passed through, and a digest of its contents."
      >
        <ChainOfCustody
          incident={incident}
          camera={camera}
          zone={zone}
          evidence={evidence}
          digest={digest}
          digestState={digestState}
        />
      </Section>
    </article>
  );
}

function Section({ index, title, hint, children }) {
  return (
    <section className="border-t border-slate-800/60 px-6 py-5 first-of-type:border-t-0">
      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-[10px] tabular-nums text-slate-700">
          {index}
        </span>

        <h3 className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {title}
        </h3>
      </div>

      {hint && (
        <p className="mt-1 pl-7 text-[10px] leading-4 text-slate-600">{hint}</p>
      )}

      <div className="mt-3 pl-7">{children}</div>
    </section>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-slate-800/40 py-1.5">
      <span className="whitespace-nowrap text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </span>

      <span
        className={`truncate text-right text-[11px] text-slate-300 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
