import { NavLink } from "react-router";
import { motion } from "motion/react";

const navigation = [
  {
    label: "Overview",
    path: "/",
    icon: "⌂",
  },
  {
    label: "Surveillance",
    path: "/surveillance",
    icon: "◉",
  },
  {
    label: "Incidents",
    path: "/incidents",
    icon: "!",
  },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-64 flex-col
          border-r border-[#26343b]
          bg-[#0d1419]
          transition-transform duration-300
          lg:static lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-[#26343b] px-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#65a982]/40 bg-[#65a982]/10">
                <span className="text-sm text-[#65a982]">◆</span>
              </div>

              <div>
                <h1 className="text-sm font-bold tracking-[0.15em] text-[#e7ecea]">
                  IBVAP
                </h1>

                <p className="text-[9px] uppercase tracking-[0.2em] text-[#718087]">
                  Intelligence System
                </p>
              </div>
            </div>
          </div>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="text-xl text-[#718087] hover:text-[#e7ecea] lg:hidden"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#718087]">
            Operations
          </p>

          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              end={item.path === "/"}
              className={({ isActive }) =>
                `
                group flex items-center gap-3 rounded-xl px-3 py-3
                text-sm transition-all
                ${
                  isActive
                    ? "bg-[#65a982]/10 text-[#65a982]"
                    : "text-[#829096] hover:bg-[#172128] hover:text-[#e7ecea]"
                }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-lg
                      text-sm
                      ${
                        isActive
                          ? "bg-[#65a982]/15"
                          : "bg-[#172128] group-hover:bg-[#26343b]"
                      }
                    `}
                  >
                    {item.icon}
                  </span>

                  <span>{item.label}</span>

                  {isActive && (
                    <motion.span
                      layoutId="active-nav"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-[#65a982]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* System status */}
        <div className="border-t border-[#26343b] p-4">
          <div className="rounded-xl border border-[#26343b] bg-[#11191f] p-4">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.35, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="h-2 w-2 rounded-full bg-[#65a982]"
              />

              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#65a982]">
                System Operational
              </span>
            </div>

            <p className="mt-2 text-[10px] leading-relaxed text-[#718087]">
              AI surveillance engine and camera network are operating normally.
            </p>
          </div>

          <p className="mt-4 text-center text-[9px] tracking-wider text-[#4f5d63]">
            IBVAP (Intelligent Border Video Analytics Platform)
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;