/**
 * Operator lifecycle vocabulary for an incident.
 *
 * Kept out of the components so the queue row and the detail pane cannot drift
 * apart on what "escalated" looks like — an operator reading two different
 * colours for the same state stops trusting either.
 */

const STATUS_META = {
  new: {
    label: "New",
    pill: "border-sky-900/50 bg-sky-950/30 text-sky-300/90",
  },
  acknowledged: {
    label: "Acknowledged",
    pill: "border-slate-700/60 bg-slate-800/40 text-slate-300",
  },
  escalated: {
    label: "Escalated",
    pill: "border-red-900/50 bg-red-950/30 text-red-300/90",
  },
  resolved: {
    label: "Resolved",
    pill: "border-emerald-900/50 bg-emerald-950/30 text-emerald-300/90",
  },
  suppressed: {
    label: "Suppressed",
    pill: "border-slate-800 bg-slate-900/50 text-slate-500",
  },
};

export const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "acknowledged", label: "Ack" },
  { id: "escalated", label: "Escalated" },
  { id: "resolved", label: "Resolved" },
  { id: "suppressed", label: "Suppressed" },
];

export const SEVERITY_FILTERS = [
  { id: "all", label: "All" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

export function describeStatus(status) {
  return (
    STATUS_META[status] ?? {
      label: "Unknown",
      pill: "border-slate-800 bg-slate-900/40 text-slate-500",
    }
  );
}

/** Suppression is recorded two ways — as a status and as a scorer flag. */
export function isSuppressed(incident) {
  return incident.status === "suppressed" || incident.suppressed === true;
}

export function isOpen(incident) {
  return incident.status !== "resolved" && !isSuppressed(incident);
}

/**
 * Operator actions, with the states that make each one meaningless. An action
 * is never hidden — an operator should be able to see the whole ladder and
 * where this incident currently sits on it.
 */
export const ACTIONS = [
  {
    status: "acknowledged",
    label: "Acknowledge",
    blocked: ["acknowledged", "escalated", "resolved", "suppressed"],
    tone: "border-slate-700/70 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50",
  },
  {
    status: "escalated",
    label: "Escalate",
    blocked: ["escalated", "resolved", "suppressed"],
    tone: "border-red-900/60 bg-red-950/30 text-red-300 hover:bg-red-950/60",
  },
  {
    status: "resolved",
    label: "Resolve",
    blocked: ["resolved", "suppressed"],
    tone: "border-emerald-900/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/60",
  },
  {
    status: "suppressed",
    label: "Dismiss as false alarm",
    blocked: ["suppressed"],
    tone: "border-slate-800/70 bg-transparent text-slate-500 hover:bg-slate-800/40 hover:text-slate-300",
  },
];
