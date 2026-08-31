/**
 * Evidence — turning a detection into something that can be filed.
 *
 * A detection an operator cannot act on is worthless. For a border force the
 * alert has to survive contact with a report: what was seen, on which camera,
 * at what point in the feed, under what light, processed how, and with some
 * assurance the record has not been altered since. This page is that record.
 *
 * Nothing here is asserted that the console cannot produce. Archived incidents
 * have no frame and say so; the integrity digest is computed from the package
 * in the browser rather than printed as decoration.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { FileCheck2 } from "lucide-react";

import EvidenceEmpty from "../components/evidence/EvidenceEmpty";
import EvidenceList from "../components/evidence/EvidenceList";
import EvidencePackage from "../components/evidence/EvidencePackage";
import {
  buildEvidenceRecord,
  buildExportDocument,
  digestRecord,
} from "../components/evidence/record";
import { useSystem } from "../context/systemStore";
import { getCamera } from "../data/cameras";
import { getZone } from "../data/zones";

export default function Evidence() {
  const { incidents, getEvidence } = useSystem();

  const [selectedId, setSelectedId] = useState(null);
  const [digest, setDigest] = useState(null);
  const [digestState, setDigestState] = useState("pending");
  const [copied, setCopied] = useState(false);

  // Which entries actually carry a captured frame. Evidence lives in a ref in
  // the provider, so this is recomputed whenever the incident log moves.
  const sealedIds = useMemo(() => {
    const ids = new Set();

    for (const incident of incidents) {
      if (incident.live && getEvidence(incident.id)) {
        ids.add(incident.id);
      }
    }

    return ids;
  }, [incidents, getEvidence]);

  // Selection is derived rather than stored, so the page opens on the newest
  // sealed package without an effect racing the first render.
  const fallbackId =
    incidents.find((incident) => sealedIds.has(incident.id))?.id ??
    incidents[0]?.id ??
    null;

  const activeId =
    selectedId && incidents.some((incident) => incident.id === selectedId)
      ? selectedId
      : fallbackId;

  const incident = useMemo(
    () => incidents.find((item) => item.id === activeId) ?? null,
    [incidents, activeId],
  );

  const evidence = useMemo(
    () => (activeId ? getEvidence(activeId) : null),
    [activeId, getEvidence],
  );

  const camera = incident ? getCamera(incident.cameraId) : null;
  const zone = incident ? (evidence?.zone ?? getZone(incident.zoneId)) : null;

  const record = useMemo(
    () =>
      incident
        ? buildEvidenceRecord({
            incident,
            camera,
            zone,
            evidence,
          })
        : null,
    [incident, camera, zone, evidence],
  );

  // Hashing is async, so it cannot happen during render. The result is held in
  // state and recomputed only when the record itself changes.
  useEffect(() => {
    if (!record) {
      setDigest(null);
      setDigestState("pending");

      return;
    }

    let cancelled = false;

    setDigestState("pending");

    digestRecord(record)
      .then((value) => {
        if (cancelled) {
          return;
        }

        setDigest(value);
        setDigestState(value ? "ready" : "unavailable");
      })
      .catch(() => {
        if (!cancelled) {
          setDigest(null);
          setDigestState("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [record]);

  useEffect(() => {
    setCopied(false);
  }, [activeId]);

  const handleExport = useCallback(() => {
    if (!record || !incident) {
      return;
    }

    const document_ = buildExportDocument({
      record,
      digest,
    });

    const blob = new Blob([JSON.stringify(document_, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${incident.id}-evidence.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  }, [record, incident, digest]);

  const handleCopyDigest = useCallback(() => {
    if (!digest || !navigator.clipboard) {
      return;
    }

    navigator.clipboard
      .writeText(digest)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }, [digest]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), 1800);

    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1600px]"
    >
      {/* Page heading */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
            Sector Alpha · Evidence register
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            Evidence
          </h1>

          <p className="mt-1.5 text-xs text-slate-600">
            An alert is only useful if it can be filed — the frame, the
            conditions it was taken under, and a digest of the record.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-800/70 px-3 py-2">
          <FileCheck2 size={13} className="text-slate-600" />

          <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            {sealedIds.size} sealed · {incidents.length} logged
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[19rem_minmax(0,1fr)] gap-5">
        <EvidenceList
          incidents={incidents}
          sealedIds={sealedIds}
          selectedId={activeId}
          onSelect={setSelectedId}
        />

        <div className="min-w-0 space-y-5">
          {sealedIds.size === 0 && <EvidenceEmpty />}

          {incident && (
            <EvidencePackage
              incident={incident}
              camera={camera}
              zone={zone}
              evidence={evidence}
              digest={digest}
              digestState={digestState}
              copied={copied}
              onExport={handleExport}
              onCopyDigest={handleCopyDigest}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
