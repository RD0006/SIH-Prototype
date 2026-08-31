/**
 * The register index.
 *
 * Sealed packages — the ones raised in this session, which carry a frame — are
 * separated from the archived log rather than mixed with it. An operator must
 * be able to see at a glance which entries can be filed with an image and
 * which cannot.
 */

import { Camera, FileText } from "lucide-react";

import { describeSeverity } from "../../lib/analytics/threat";

export default function EvidenceList({ incidents, sealedIds, selectedId, onSelect }) {
  const sealed = incidents.filter((incident) => sealedIds.has(incident.id));
  const archived = incidents.filter((incident) => !sealedIds.has(incident.id));

  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-3">
      <div className="flex items-baseline justify-between px-2 pb-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
          Register
        </p>

        <p className="text-[10px] text-slate-700">
          {sealed.length} sealed · {archived.length} archived
        </p>
      </div>

      <Group
        icon={Camera}
        label="Sealed this session"
        hint="Captured frame retained"
        entries={sealed}
        empty="Nothing sealed yet."
        selectedId={selectedId}
        onSelect={onSelect}
      />

      <Group
        icon={FileText}
        label="Archived log"
        hint="Record only — no frame"
        entries={archived}
        empty="No archived entries."
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

function Group({ icon: Icon, label, hint, entries, empty, selectedId, onSelect }) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="flex items-center gap-2 px-2 pb-2">
        <Icon size={11} className="text-slate-600" />

        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
      </div>

      <p className="px-2 pb-2 text-[9px] text-slate-700">{hint}</p>

      <div className="space-y-1">
        {entries.length === 0 && (
          <p className="px-2 py-1 text-[10px] text-slate-700">{empty}</p>
        )}

        {entries.map((incident) => {
          const severity = describeSeverity(incident.severity);
          const active = incident.id === selectedId;

          return (
            <button
              key={incident.id}
              onClick={() => onSelect(incident.id)}
              className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                active
                  ? "bg-slate-700/40 text-slate-100"
                  : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
              }`}
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${severity.dot}`}
              />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs">{incident.title}</span>

                <span className="mt-0.5 block truncate text-[10px] text-slate-600">
                  {incident.id} · {incident.cameraId} · {incident.clock}
                </span>
              </span>

              <span className={`shrink-0 text-[11px] ${severity.text}`}>
                {incident.score}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
