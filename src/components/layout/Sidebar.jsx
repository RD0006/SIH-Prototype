import { useState } from "react";
import { NavLink } from "react-router";

const navigation = [
  {
    name: "Dashboard",
    path: "/",
    icon: "▦",
  },
  {
    name: "Surveillance",
    path: "/surveillance",
    icon: "◉",
  },
  {
    name: "Incidents",
    path: "/incidents",
    icon: "!",
  },
];

function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-[1100] flex h-10 w-10 items-center justify-center rounded-xl border border-[#26343b] bg-[#10171c] text-[#b7c4c8] shadow-lg lg:hidden"
      >
        ☰
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-[1100] flex h-screen w-[250px] flex-col border-r border-[#202b34] bg-[#0d1318] transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[76px] items-center justify-between border-b border-[#202b34] px-6">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-[#e7ecea]">
              BORDER<span className="text-[#5fa9a3]">AI</span>
            </p>

            <p className="mt-1 text-[9px] uppercase tracking-wider text-[#596b78]">
              Intelligent Surveillance
            </p>
          </div>

          {/* Mobile close */}
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#718087] hover:bg-[#182127] hover:text-[#e7ecea] lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#465761]">
            Navigation
          </p>

          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all ${
                    isActive
                      ? "border border-[#29434a] bg-[#172329] text-[#e7ecea]"
                      : "border border-transparent text-[#718087] hover:bg-[#141d22] hover:text-[#cbd5d8]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs ${
                        isActive
                          ? "bg-[#20363b] text-[#70b8b0]"
                          : "bg-[#151c21] text-[#596b73]"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span>{item.name}</span>

                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5fa9a3] shadow-[0_0_8px_rgba(95,169,163,0.7)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* System status */}
        <div className="border-t border-[#202b34] p-4">
          <div className="rounded-xl border border-[#20352f] bg-[#0c1a17] p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.7)]" />

              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#8ba69f]">
                System operational
              </span>
            </div>

            <p className="mt-2 text-[8px] text-[#52645f]">
              All intelligence services active
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;