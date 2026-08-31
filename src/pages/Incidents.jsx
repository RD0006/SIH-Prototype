import { motion } from "motion/react";
import Panel from "../components/ui/Panel";

const incidents = [
  {
    id: "INC-104",
    type: "Unknown movement",
    sector: "Sector 04",
    camera: "CAM-18",
    time: "11:41:52",
    priority: "HIGH",
    status: "Investigating",
    confidence: 91,
  },
  {
    id: "INC-103",
    type: "Vehicle detected",
    sector: "Sector 07",
    camera: "CAM-23",
    time: "11:39:17",
    priority: "MEDIUM",
    status: "Review",
    confidence: 84,
  },
  {
    id: "INC-102",
    type: "Restricted entry",
    sector: "Sector 02",
    camera: "CAM-04",
    time: "11:36:08",
    priority: "HIGH",
    status: "Investigating",
    confidence: 96,
  },
  {
    id: "INC-101",
    type: "Unusual activity",
    sector: "Sector 06",
    camera: "CAM-12",
    time: "11:31:44",
    priority: "LOW",
    status: "Resolved",
    confidence: 72,
  },
  {
    id: "INC-100",
    type: "Person detected",
    sector: "Sector 09",
    camera: "CAM-23",
    time: "11:26:31",
    priority: "LOW",
    status: "Resolved",
    confidence: 89,
  },
];

const priorityStyles = {
  HIGH: "border-[#d95c5c]/30 bg-[#d95c5c]/10 text-[#d95c5c]",
  MEDIUM: "border-[#d6a84f]/30 bg-[#d6a84f]/10 text-[#d6a84f]",
  LOW: "border-[#5fa9a3]/30 bg-[#5fa9a3]/10 text-[#5fa9a3]",
};

const statusStyles = {
  Investigating: "text-[#d95c5c]",
  Review: "text-[#d6a84f]",
  Resolved: "text-[#65a982]",
};

function Incidents() {
  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d6a84f]">
          AI event intelligence
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#e7ecea]">
          Incidents
        </h1>

        <p className="mt-1 text-xs text-[#718087]">
          Review, prioritize and investigate detected events.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel className="p-5">
          <p className="text-[9px] uppercase tracking-wider text-[#718087]">
            Total
          </p>

          <p className="mt-2 font-mono text-2xl text-[#e7ecea]">
            05
          </p>
        </Panel>

        <Panel className="p-5">
          <p className="text-[9px] uppercase tracking-wider text-[#718087]">
            High priority
          </p>

          <p className="mt-2 font-mono text-2xl text-[#d95c5c]">
            02
          </p>
        </Panel>

        <Panel className="p-5">
          <p className="text-[9px] uppercase tracking-wider text-[#718087]">
            Investigating
          </p>

          <p className="mt-2 font-mono text-2xl text-[#d6a84f]">
            02
          </p>
        </Panel>

        <Panel className="p-5">
          <p className="text-[9px] uppercase tracking-wider text-[#718087]">
            Resolved
          </p>

          <p className="mt-2 font-mono text-2xl text-[#65a982]">
            02
          </p>
        </Panel>
      </div>

      {/* Incident table */}
      <Panel
        eyebrow="Event log"
        title="Detected incidents"
        action={
          <span className="text-[9px] uppercase tracking-wider text-[#718087]">
            Illustrative Data
          </span>
        }
        className="overflow-hidden"
      >
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#26343b] text-left">
                <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-[#718087]">
                  Incident
                </th>

                <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-[#718087]">
                  Location
                </th>

                <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-[#718087]">
                  Priority
                </th>

                <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-[#718087]">
                  Confidence
                </th>

                <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-[#718087]">
                  Status
                </th>

                <th className="px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {incidents.map((incident, index) => (
                <motion.tr
                  key={incident.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                  }}
                  className="border-b border-[#26343b] last:border-0 hover:bg-[#172128]/50"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold text-[#e7ecea]">
                        {incident.type}
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-[#4f5d63]">
                        {incident.id}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-[10px] text-[#a3afb3]">
                      {incident.sector}
                    </p>

                    <p className="mt-1 text-[9px] text-[#718087]">
                      {incident.camera} · {incident.time}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-md border px-2 py-1 text-[8px] font-bold tracking-wider ${priorityStyles[incident.priority]}`}
                    >
                      {incident.priority}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#26343b]">
                        <div
                          className="h-full rounded-full bg-[#5fa9a3]"
                          style={{
                            width: `${incident.confidence}%`,
                          }}
                        />
                      </div>

                      <span className="font-mono text-[9px] text-[#a3afb3]">
                        {incident.confidence}%
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`text-[9px] font-medium ${statusStyles[incident.status]}`}
                    >
                      {incident.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button className="hover:cursor-pointer text-[9px] uppercase tracking-wider text-[#718087] transition hover:text-[#d6a84f]">
                      Inspect →
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-[#26343b] md:hidden">
          {incidents.map((incident, index) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
              }}
              className="p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#e7ecea]">
                    {incident.type}
                  </p>

                  <p className="mt-1 font-mono text-[9px] text-[#4f5d63]">
                    {incident.id}
                  </p>
                </div>

                <span
                  className={`rounded-md border px-2 py-1 text-[8px] font-bold ${priorityStyles[incident.priority]}`}
                >
                  {incident.priority}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-[#718087]">
                    Location
                  </p>

                  <p className="mt-1 text-[10px] text-[#a3afb3]">
                    {incident.sector}
                  </p>
                </div>

                <div>
                  <p className="text-[8px] uppercase tracking-wider text-[#718087]">
                    Camera
                  </p>

                  <p className="mt-1 font-mono text-[10px] text-[#a3afb3]">
                    {incident.camera}
                  </p>
                </div>

                <div>
                  <p className="text-[8px] uppercase tracking-wider text-[#718087]">
                    Confidence
                  </p>

                  <p className="mt-1 font-mono text-[10px] text-[#a3afb3]">
                    {incident.confidence}%
                  </p>
                </div>

                <div>
                  <p className="text-[8px] uppercase tracking-wider text-[#718087]">
                    Status
                  </p>

                  <p
                    className={`mt-1 text-[10px] ${statusStyles[incident.status]}`}
                  >
                    {incident.status}
                  </p>
                </div>
              </div>

              <button className="mt-4 w-full rounded-lg border border-[#26343b] bg-[#172128] py-2 text-[9px] uppercase tracking-wider text-[#829096] hover:text-[#d6a84f]">
                Inspect incident
              </button>
            </motion.div>
          ))}
        </div>
      </Panel>
    </main>
  );
}

export default Incidents;