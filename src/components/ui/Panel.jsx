import { motion } from "motion/react";

function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border border-[#26343b] bg-[#11191f] ${className}`}
    >
      {(title || eyebrow || action) && (
        <div className="flex items-center justify-between border-b border-[#26343b] px-5 py-4">
          <div>
            {eyebrow && (
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#718087]">
                {eyebrow}
              </p>
            )}

            {title && (
              <h2 className="text-sm font-semibold tracking-wide text-[#e7ecea]">
                {title}
              </h2>
            )}
          </div>

          {action}
        </div>
      )}

      <div>{children}</div>
    </motion.section>
  );
}

export default Panel;