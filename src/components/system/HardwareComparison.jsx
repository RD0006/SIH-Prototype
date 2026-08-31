import { Check, X } from "lucide-react";

/**
 * The procurement answer, side by side.
 *
 * Deliberately qualitative. There is no costing source behind this prototype,
 * so nothing here quotes a figure — the comparison is about what has to be
 * bought, carried to a remote post and bolted to a pole, which is a question
 * the code can answer honestly.
 */
const ROWS = [
  {
    question: "What must be procured",
    conventional:
      "Analytics-capable cameras, or dedicated ANPR and face-recognition units, or an edge appliance per site to process the streams already arriving.",
    platform:
      "Nothing per site. The analytics run as software over the H.264 streams the existing cameras already emit.",
  },
  {
    question: "What must be installed at the post",
    conventional:
      "A physical visit to every location — dismount, remount, re-cable, re-power, re-aim, re-commission. Remote border out posts are the hardest and slowest of these.",
    platform:
      "No work at the post. Cameras, mounts, cabling and power are untouched; the console consumes the feed as it stands.",
  },
  {
    question: "How much of the estate benefits",
    conventional:
      "Only the cameras actually replaced. Coverage grows one procurement round at a time, and the rest of the estate stays unintelligent in the meantime.",
    platform:
      "The whole estate at once, including the oldest units, because capability is attached to the stream rather than to the device.",
  },
  {
    question: "When the model needs updating",
    conventional:
      "Firmware or appliance updates device by device, usually vendor-gated and often needing another site visit.",
    platform:
      "Replace the model weights where the console runs. The next start picks them up; no post is visited.",
  },
  {
    question: "What happens to the existing estate",
    conventional:
      "Written off, or left running alongside the new units as a second, unmonitored tier.",
    platform:
      "Retained and used. Age of the camera does not limit what the platform can infer from its picture.",
  },
];

export default function HardwareComparison() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-[#171a1f]">
      <div className="border-b border-slate-800/60 px-5 py-4">
        <h3 className="text-sm font-medium text-slate-200">
          Hardware replacement vs. software capability
        </h3>

        <p className="mt-1 text-[11px] text-slate-600">
          What each approach requires of the estate
        </p>
      </div>

      <div className="grid grid-cols-2 border-b border-slate-800/60 bg-[#14171b]">
        <div className="flex items-center gap-2 border-r border-slate-800/60 px-5 py-2.5">
          <X size={11} className="text-slate-600" />

          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            Replace the hardware
          </p>
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5">
          <Check size={11} className="text-emerald-400/80" />

          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
            This platform
          </p>
        </div>
      </div>

      <div>
        {ROWS.map((row) => (
          <div key={row.question} className="border-b border-slate-800/50 last:border-b-0">
            <p className="px-5 pb-2 pt-4 text-[11px] text-slate-400">
              {row.question}
            </p>

            <div className="grid grid-cols-2">
              <div className="border-r border-slate-800/50 px-5 pb-4">
                <p className="text-[10px] leading-5 text-slate-600">
                  {row.conventional}
                </p>
              </div>

              <div className="px-5 pb-4">
                <p className="text-[10px] leading-5 text-slate-400">
                  {row.platform}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800/60 bg-[#14171b] px-5 py-4">
        <p className="text-[11px] leading-5 text-slate-500">
          The per-site hardware line and the physical installation effort at
          remote posts are removed from the deployment entirely rather than
          reduced. No rupee figures are claimed here — this prototype has no
          costing source, and the procurement case rests on the item count and
          the site visits avoided, both of which are visible in the estate table
          above.
        </p>
      </div>
    </div>
  );
}
