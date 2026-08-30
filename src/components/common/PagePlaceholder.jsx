import { motion } from "motion/react";

export default function PagePlaceholder({
  title,
  description,
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
        duration: 0.3,
      }}
      className="flex min-h-[calc(100vh-10rem)] items-center justify-center"
    >
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
          Border AI
        </p>

        <h1 className="mt-3 text-2xl font-semibold text-slate-200">
          {title}
        </h1>

        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </motion.div>
  );
}