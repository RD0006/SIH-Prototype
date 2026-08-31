import LiveClock from "../components/dashboard/LiveClock";
import StatCard from "../components/dashboard/StatCard";
import BorderMap from "../components/dashboard/BorderMap";
import PriorityIncidents from "../components/dashboard/PriorityIncidents";
import Panel from "../components/ui/Panel";
import IntelligencePipeline from "../components/dashboard/IntelligencePipeline";

function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0b1014]">
      <header className="flex flex-col gap-4 border-b border-[#26343b] px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#65a982]">
            Intelligent Border Video Analytics Platform
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#e7ecea]">
            Operational Overview
          </h1>
        </div>

        <LiveClock />
      </header>

      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            label="Cameras Online"
            value="24"
            suffix="/ 26"
            change="+1"
            status="success"
            icon="◉"
          />

          <StatCard
            label="Active Alerts"
            value="07"
            change="+2"
            status="warning"
            icon="!"
          />

          <StatCard
            label="Priority Incidents"
            value="03"
            status="danger"
            icon="!"
          />

          <StatCard
            label="AI Engine"
            value="98.7"
            suffix="%"
            change="+0.4%"
            status="success"
            icon="◆"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel
            eyebrow="Live intelligence"
            title="Border surveillance"
          >
            <BorderMap />
          </Panel>

          <PriorityIncidents />

          <IntelligencePipeline />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Camera activity */}

          {/* Threat activity */}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;