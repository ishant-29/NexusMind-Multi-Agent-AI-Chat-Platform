'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agentService } from '@/lib/services/serviceClient';

type ConnectionState = 'connected' | 'disconnected' | 'checking';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await agentService.listAgents();
        setStatus('connected');
      } catch (error) {
        setStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connected: { color: 'bg-success', text: 'Online' },
    disconnected: { color: 'bg-danger', text: 'Offline' },
    checking: { color: 'bg-warning', text: 'Checking' },
  };

  const config = statusConfig[status];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="nx-press flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-raised transition-colors duration-150"
        title="Service status"
        aria-expanded={showDetails}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.color} ${status === 'checking' ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
        <span className="text-[12px] text-ink-faint">{config.text}</span>
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: 'top right', zIndex: 'var(--z-dropdown)' }}
            className="absolute top-full right-0 mt-2 w-64 nx-glass rounded-xl p-4"
          >
            <h3 className="text-[13px] font-semibold text-ink mb-3">Service status</h3>

            <div className="space-y-2">
              <ServiceStatusItem name="Agent service" status={status} port="7777" />
              <ServiceStatusItem name="Auth service" status="unknown" port="4000" />
              <ServiceStatusItem name="Conversations" status="unknown" port="4002" />
            </div>

            <p className="mt-3 pt-3 border-t border-[var(--border-subtle)] text-[11.5px] text-ink-faint leading-relaxed">
              {status === 'disconnected' && 'Services unreachable. Run start-services.bat to bring them up.'}
              {status === 'connected' && 'All systems operational.'}
              {status === 'checking' && 'Checking connection…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceStatusItem({
  name,
  status,
  port,
}: {
  name: string;
  status: ConnectionState | 'unknown';
  port: string;
}) {
  const statusColors = {
    connected: 'bg-success',
    disconnected: 'bg-danger',
    checking: 'bg-warning',
    unknown: 'bg-ink-faint',
  };

  return (
    <div className="flex items-center justify-between text-[12px]">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`} aria-hidden="true" />
        <span className="text-ink-secondary">{name}</span>
      </div>
      <span className="text-ink-faint font-mono">:{port}</span>
    </div>
  );
}
