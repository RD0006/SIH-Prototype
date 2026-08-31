import { SEVERITY_FILTERS, STATUS_FILTERS } from "./status";

const SORTS = [
  { id: "score", label: "Threat score" },
  { id: "time", label: "Most recent" },
];

export default function QueueFilters({
  severity,
  onSeverity,
  status,
  onStatus,
  sort,
  onSort,
  shown,
  total,
}) {
  return (
    <div className="space-y-2 border-b border-slate-800/60 px-4 py-3">
      <FilterRow label="Severity">
        {SEVERITY_FILTERS.map((option) => (
          <Chip
            key={option.id}
            active={severity === option.id}
            onClick={() => onSeverity(option.id)}
            label={option.label}
          />
        ))}
      </FilterRow>

      <FilterRow label="Status">
        {STATUS_FILTERS.map((option) => (
          <Chip
            key={option.id}
            active={status === option.id}
            onClick={() => onStatus(option.id)}
            label={option.label}
          />
        ))}
      </FilterRow>

      <FilterRow label="Sort">
        {SORTS.map((option) => (
          <Chip
            key={option.id}
            active={sort === option.id}
            onClick={() => onSort(option.id)}
            label={option.label}
          />
        ))}

        <span className="ml-auto self-center text-[10px] text-slate-600">
          {shown} of {total} incidents
        </span>
      </FilterRow>
    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-14 shrink-0 pt-1.5 text-[9px] uppercase tracking-[0.16em] text-slate-700">
        {label}
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {children}
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 text-[10px] transition ${
        active
          ? "bg-slate-700/50 text-slate-200"
          : "text-slate-600 hover:text-slate-400"
      }`}
    >
      {label}
    </button>
  );
}
