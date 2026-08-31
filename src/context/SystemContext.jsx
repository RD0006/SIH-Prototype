/**
 * Platform state.
 *
 * One store for everything the console shares: the incident log, the camera
 * estate, cross-camera identities, and the health of the detection engine.
 *
 * It exists so the Live Surveillance console can raise an incident and have it
 * appear immediately on the Dashboard, in the triage queue, and in Evidence
 * without any of those pages knowing the console exists. That separation is
 * what makes the demonstration feel like one system rather than a set of
 * screens.
 *
 * Seeded history from src/data is merged with anything raised live in this
 * session, newest first.
 */

import { useCallback, useMemo, useRef, useState } from "react";

import { SystemContext } from "./systemStore";

import { cameras as cameraEstate } from "../data/cameras";
import { zones as allZones } from "../data/zones";
import { seededIncidents } from "../data/incidents";
import { targets as seededTargets } from "../data/targets";
import { STATUS } from "../lib/detection/status";

/** Cap on retained evidence snapshots — these are data URLs and add up fast. */
const MAX_EVIDENCE = 40;

const INITIAL_ENGINE = {
  status: STATUS.IDLE,
  stage: "Not started",
  progress: 0,
  quality: "balanced",
  latency: null,
  fps: null,
  error: null,
  simulated: false,
};

export function SystemProvider({ children }) {
  const [liveIncidents, setLiveIncidents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [engine, setEngineState] = useState(INITIAL_ENGINE);
  const [detectionCount, setDetectionCount] = useState(0);
  const [liveTargets, setLiveTargets] = useState([]);

  // Snapshots live in a ref: they are large, and nothing renders from the map
  // itself — pages look up one package at a time by id.
  const evidence = useRef(new Map());
  const sequence = useRef(242);

  const raiseIncident = useCallback((incident) => {
    sequence.current += 1;

    const id = `INC-${String(sequence.current).padStart(4, "0")}`;

    const record = {
      ...incident,
      id,
      live: true,
      status: "new",
      raisedAt: Date.now(),
    };

    setLiveIncidents((current) => [record, ...current].slice(0, 60));

    if (incident.evidence) {
      evidence.current.set(id, incident.evidence);

      if (evidence.current.size > MAX_EVIDENCE) {
        const oldest = evidence.current.keys().next().value;

        evidence.current.delete(oldest);
      }
    }

    return record;
  }, []);

  const updateIncidentStatus = useCallback((id, status) => {
    setStatuses((current) => ({ ...current, [id]: status }));
  }, []);

  const setEngine = useCallback((partial) => {
    setEngineState((current) => ({ ...current, ...partial }));
  }, []);

  const recordDetections = useCallback((count) => {
    if (count > 0) {
      setDetectionCount((current) => current + count);
    }
  }, []);

  const upsertTarget = useCallback((target) => {
    setLiveTargets((current) => {
      const index = current.findIndex((item) => item.id === target.id);

      if (index === -1) {
        return [target, ...current].slice(0, 20);
      }

      const next = [...current];

      next[index] = { ...next[index], ...target };

      return next;
    });
  }, []);

  const getEvidence = useCallback((id) => evidence.current.get(id) ?? null, []);

  // Seeded history and live events, unified and with operator actions applied.
  const incidents = useMemo(() => {
    const merged = [...liveIncidents, ...seededIncidents];

    return merged.map((incident) => ({
      ...incident,
      status: statuses[incident.id] ?? incident.status,
    }));
  }, [liveIncidents, statuses]);

  const targets = useMemo(
    () => [...liveTargets, ...seededTargets],
    [liveTargets],
  );

  const stats = useMemo(() => {
    const online = cameraEstate.filter((c) => c.status === "online").length;
    const offline = cameraEstate.filter((c) => c.status === "offline").length;
    const degraded = cameraEstate.filter((c) => c.status === "degraded").length;

    const open = incidents.filter(
      (incident) =>
        incident.status !== "resolved" && incident.status !== "suppressed",
    );

    const high = open.filter((incident) => incident.severity === "high").length;

    const suppressed = incidents.filter(
      (incident) => incident.status === "suppressed" || incident.suppressed,
    ).length;

    return {
      totalCameras: cameraEstate.length,
      online,
      offline,
      degraded,
      openIncidents: open.length,
      highPriority: high,
      suppressed,
      detections: detectionCount,
    };
  }, [incidents, detectionCount]);

  const value = useMemo(
    () => ({
      incidents,
      cameras: cameraEstate,
      zones: allZones,
      targets,
      engine,
      stats,
      raiseIncident,
      updateIncidentStatus,
      setEngine,
      recordDetections,
      upsertTarget,
      getEvidence,
    }),
    [
      incidents,
      targets,
      engine,
      stats,
      raiseIncident,
      updateIncidentStatus,
      setEngine,
      recordDetections,
      upsertTarget,
      getEvidence,
    ],
  );

  return (
    <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
  );
}
