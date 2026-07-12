"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { RefreshCw, Copy, CheckCircle } from "lucide-react";

interface Remix {
  style: string;
  content: string;
}

interface Props {
  content: string;
}

export default function RemixPanel({ content }: Props) {
  const [remixes, setRemixes] = useState<Remix[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const fetchRemixes = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch("/api/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Remix request failed");
      const data = await res.json();
      setRemixes(data.remixes || []);
    } catch (err) {
      console.error("Remix error:", err);
      setRemixes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={fetchRemixes}
        disabled={loading}
        className="nx-press flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--border-subtle)] bg-raised text-[11px] font-medium text-ink-faint hover:text-ink hover:border-[var(--border-strong)] transition-colors duration-150 disabled:opacity-50"
      >
        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        <span>{loading ? "Remixing…" : "Remix"}</span>
      </button>

      <AnimatePresence>
        {open && remixes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "top left", zIndex: "var(--z-dropdown)" }}
            className="absolute left-0 top-full mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-[520px] max-w-[80vw]"
          >
            {remixes.map((remix, i) => (
              <motion.div
                key={remix.style}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="nx-glass rounded-xl p-3 flex flex-col"
              >
                <div className="flex justify-between items-center mb-2 border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[11px] font-semibold capitalize text-accent">{remix.style}</span>
                  <button
                    onClick={() => handleCopy(remix.content, i)}
                    className="text-ink-faint hover:text-ink transition-colors duration-150"
                    aria-label="Copy remix"
                  >
                    {copied === i ? <CheckCircle size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-[12px] text-ink-secondary leading-relaxed flex-1">
                  {remix.content}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
