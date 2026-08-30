import { Bell, Wifi } from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-800/70 bg-[#171a1f] px-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
          Operations
        </p>

        <h2 className="mt-1 text-lg font-medium text-slate-200">
          Command Center
        </h2>
      </div>

      <div className="flex items-center gap-5">
        {/* Network */}
        <div className="flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/30 px-3 py-1.5">
          <Wifi
            size={13}
            strokeWidth={1.7}
            className="text-emerald-400/80"
          />

          <span className="text-[11px] text-slate-500">
            Network Connected
          </span>
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-800/50 hover:text-slate-300">
          <Bell size={18} strokeWidth={1.7} />

          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
        </button>

        {/* Operator */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-slate-800/60 text-[10px] font-medium text-slate-400">
          OP
        </div>
      </div>
    </header>
  );
}