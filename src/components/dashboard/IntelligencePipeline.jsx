import { useEffect, useState } from "react";

const stages = [
  "Video Ingestion",
  "Object Detection",
  "Target Tracking",
  "Threat Assessment",
  "Alert Prioritization",
];

function IntelligencePipeline() {
  const [activeStage, setActiveStage] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="rounded-2xl border border-[#202b34] bg-[#12161b] p-6 shadow-sm">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#e7ecea]">
            Intelligence Pipeline
          </h2>

          <p className="mt-1 text-sm text-[#596b78]">
            Current system processing status
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-[#075f48] bg-[#071d18] px-4 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />

          <span className="text-[10px] font-medium uppercase tracking-wider text-[#10b981]">
            All systems active
          </span>
        </div>
      </div>

      {/* Pipeline */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute left-[8%] right-[8%] top-[56px] hidden h-px bg-[#263442] lg:block" />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stages.map((stage, index) => {
            const isActive = index === activeStage;

            return (
              <div
                key={stage}
                className={`relative z-10 min-h-[112px] rounded-xl border p-5 transition-all duration-500 ${
                  isActive
                    ? "border-[#31505c] bg-[#151c22] shadow-[0_0_25px_rgba(95,169,163,0.06)]"
                    : "border-[#202b34] bg-[#11161b]"
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono ${
                      isActive ? "text-[#718f98]" : "text-[#40515e]"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={`h-2 w-2 rounded-full transition-all duration-500 ${
                      isActive
                        ? "bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                        : "bg-[#0d9f77]"
                    }`}
                  />
                </div>

                {/* Stage name */}
                <p
                  className={`mt-5 text-sm font-medium transition-colors duration-500 ${
                    isActive ? "text-[#e7ecea]" : "text-[#88a0b3]"
                  }`}
                >
                  {stage}
                </p>

                {/* Active indicator */}
                {isActive && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-[#10b981]" />

                    <span className="text-[8px] uppercase tracking-widest text-[#10b981]">
                      Processing
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default IntelligencePipeline;