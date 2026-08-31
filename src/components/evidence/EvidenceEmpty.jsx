/**
 * Shown while nothing has been sealed in this session.
 *
 * The register is never truly empty — the archived log is always there — so
 * this explains what is missing and how it is produced rather than apologising
 * for it. An operator reading this should know exactly what to do next.
 */

import { Link } from "react-router";
import { ArrowUpRight, Camera } from "lucide-react";

const CONTENTS = [
  "The JPEG frame the alert was raised from, with the detector box and the fence drawn on it",
  "The camera, its resolution and the exact position in the feed the frame was sampled at",
  "Measured luminance, whether it was dark, and whether low-light correction was applied and at what gamma",
  "The class, tracked identity, confidence and the fence rule that fired",
  "A SHA-256 digest computed from the record, so a filed copy can be checked against the original",
];

export default function EvidenceEmpty() {
  return (
    <div className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5">
      <div className="flex items-center gap-2">
        <Camera size={13} className="text-slate-500" />

        <h3 className="text-xs font-medium text-slate-300">
          No packages sealed in this session
        </h3>
      </div>

      <p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-500">
        A package is not something an operator assembles. It is written
        automatically the moment the Live Surveillance console raises an
        incident: the frame under analysis at that instant is retained along
        with everything the engine knew about it. Start analysis on any camera
        with a fence and the first crossing will appear here, sealed and
        exportable.
      </p>

      <ul className="mt-4 space-y-1.5">
        {CONTENTS.map((item) => (
          <li key={item} className="flex gap-2.5 text-[11px] leading-5 text-slate-400">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-700" />
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[10px] leading-4 text-slate-600">
        The archived entries in the register are earlier events from the sector
        log. They carry the full detection and scoring record but no frame — a
        still cannot be recovered after the fact, and the console will not
        substitute one.
      </p>

      <Link
        to="/surveillance"
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700/50"
      >
        Open Live Surveillance
        <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}
