"use client";
import { motion, useReducedMotion } from "framer-motion";
import Logo from "@/components/brand/Logo";
import SceneBackdrop from "@/components/three/SceneBackdrop";

/**
 * Split auth layout: cinematic 3D brand panel on the left,
 * focused form panel on the right. On mobile the scene sits
 * behind the form.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-[100dvh] bg-void text-ink lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand / scene panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden">
        <SceneBackdrop variant="full" />
        <div className="relative z-10">
          <Logo size={30} />
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-balance">
            Five specialist agents. One workspace.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
            Research, code, write, and analyze with purpose-built AI agents,
            grounded in your own documents.
          </p>
        </div>
        <p className="relative z-10 text-[13px] text-ink-faint">
          Groq · Gemini · DeepSeek · Llama
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex min-h-[100dvh] lg:min-h-0 items-center justify-center px-5 py-10 lg:border-l lg:border-[var(--border-subtle)] bg-surface/60">
        {/* mobile-only ambient scene */}
        <div className="absolute inset-0 lg:hidden overflow-hidden">
          <SceneBackdrop variant="ambient" />
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={30} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 mb-8 text-[14px] text-ink-secondary">{subtitle}</p>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
