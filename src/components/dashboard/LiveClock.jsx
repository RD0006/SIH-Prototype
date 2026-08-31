import { useEffect, useState } from "react";
import { motion } from "motion/react";

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const date = time.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const clock = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex items-center gap-4">
      <div className="hidden text-right sm:block">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          System Time
        </p>

        <p className="text-xs text-slate-400">
          {date} · IST
        </p>
      </div>

      <div className="font-mono text-lg tracking-wider text-slate-100">
        {clock}
      </div>

      <div className="flex items-center gap-2">
        <motion.span
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-2 w-2 rounded-full bg-emerald-400"
        />

        <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
          Live
        </span>
      </div>
    </div>
  );
}

export default LiveClock;