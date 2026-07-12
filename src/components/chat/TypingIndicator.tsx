"use client";
import { motion, useReducedMotion } from "framer-motion";
import Logo from "@/components/brand/Logo";

export default function TypingIndicator({ modelName }: { modelName?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="flex items-start gap-3 my-4"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="w-8 h-8 rounded-full bg-raised border border-[oklch(0.82_0.13_205_/_0.35)] nx-live shrink-0 flex items-center justify-center">
        <Logo size={16} withWordmark={false} />
      </div>
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-[4px] bg-raised border border-[var(--border-subtle)]">
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent animate-typing-dot"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
        <span className="text-[12.5px] text-ink-faint">
          {modelName || "Assistant"} is thinking
        </span>
      </div>
    </motion.div>
  );
}
