import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Video,
  AlertTriangle,
  ScanLine,
  Map,
  FileSearch,
  Activity,
  Shield,
} from "lucide-react";

const navigation = [
  {
    section: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Live Surveillance",
        path: "/surveillance",
        icon: Video,
      },
      {
        name: "Incidents",
        path: "/incidents",
        icon: AlertTriangle,
      },
    ],
  },
  {
    section: "Intelligence",
    items: [
      {
        name: "Target Tracking",
        path: "/tracking",
        icon: ScanLine,
      },
      {
        name: "Border Map",
        path: "/map",
        icon: Map,
      },
      {
        name: "Evidence",
        path: "/evidence",
        icon: FileSearch,
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        name: "System Status",
        path: "/system",
        icon: Activity,
      },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/70 bg-[#15181d]">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-800/70 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/50">
          <Shield
            size={18}
            strokeWidth={1.7}
            className="text-slate-300"
          />
        </div>

        <div>
          <h1 className="text-sm font-semibold tracking-[0.08em] text-slate-100">
            BORDER AI
          </h1>

          <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-slate-600">
            Intelligent Surveillance
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="space-y-7">
          {navigation.map((group) => (
            <div key={group.section}>
              <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">
                {group.section}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-slate-700/40 text-slate-100"
                            : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={17}
                            strokeWidth={1.7}
                            className={
                              isActive
                                ? "text-slate-300"
                                : "text-slate-600 group-hover:text-slate-400"
                            }
                          />

                          <span>{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* System indicator */}
      <div className="border-t border-slate-800/70 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-800/50 bg-slate-900/20 px-3 py-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400/80" />
          </span>

          <div>
            <p className="text-xs font-medium text-slate-300">
              System Operational
            </p>

            <p className="mt-0.5 text-[10px] text-slate-600">
              Core services active
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}