import { motion } from "motion/react";

function StatCard({
  label,
  value,
  suffix,
  change,
  status = "neutral",
  icon,
}) {
  const statusColors = {
    neutral: "text-[#5fa9a3]",
    warning: "text-[#d6a84f]",
    danger: "text-[#d95c5c]",
    success: "text-[#65a982]",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-[#26343b] bg-[#11191f] p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#718087]">
            {label}
          </p>

          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-mono text-3xl font-semibold text-[#e7ecea]">
              {value}
            </span>

            {suffix && (
              <span className="text-xs text-[#718087]">
                {suffix}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div className={`${statusColors[status]} text-lg`}>
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className={statusColors[status]}>
            {change}
          </span>

          <span className="text-[#718087]">
            compared with previous period
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default StatCard;