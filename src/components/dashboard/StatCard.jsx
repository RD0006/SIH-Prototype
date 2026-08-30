import { motion } from "motion/react";

export default function StatCard({
  label,
  value,
  detail,
  index = 0,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      className="rounded-xl border border-slate-800/70 bg-[#171a1f] p-5"
    >
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-3xl font-semibold tracking-tight text-slate-100">
          {value}
        </p>

        <span className="mb-1 h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
      </div>

      <p className="mt-2 text-[11px] text-slate-600">
        {detail}
      </p>
    </motion.div>
  );
}