'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const TOAST_META: Record<ToastType, { icon: React.ReactNode; ring: string }> = {
  success: { icon: <CheckCircle2 size={16} className="text-success" />, ring: 'border-[oklch(0.76_0.14_160_/_0.35)]' },
  error: { icon: <XCircle size={16} className="text-danger" />, ring: 'border-[oklch(0.68_0.19_20_/_0.4)]' },
  info: { icon: <Info size={16} className="text-accent" />, ring: 'border-[oklch(0.82_0.13_205_/_0.35)]' },
  warning: { icon: <AlertTriangle size={16} className="text-warning" />, ring: 'border-[oklch(0.8_0.13_85_/_0.35)]' },
};

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const meta = TOAST_META[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      role="status"
      className="max-w-md"
    >
      <div className={`nx-glass rounded-xl border ${meta.ring} flex items-center gap-3 px-4 py-3`}>
        <span className="shrink-0">{meta.icon}</span>
        <p className="flex-1 text-[13px] text-ink">{message}</p>
        <button
          onClick={onClose}
          className="shrink-0 text-ink-faint hover:text-ink transition-colors duration-150 p-0.5 rounded"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 pointer-events-none flex flex-col gap-2 items-end"
      style={{ zIndex: 'var(--z-toast)' }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
