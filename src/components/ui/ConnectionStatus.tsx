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

    // Check immediately
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
      icon: '✓',
    },
    disconnected: {
      color: 'bg-red-500',
      text: 'Disconnected',
      icon: '✗',
    },
    checking: {
      color: 'bg-yellow-500',
      text: 'Checking...',
      icon: '⟳',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Connection Status"
      >
        <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'checking' ? 'animate-pulse' : ''}`} />
        <span className="text-xs text-gray-600 dark:text-gray-400">{config.text}</span>
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Service Status
            </h3>
            
            <div className="space-y-2">
              <ServiceStatusItem
                name="Agent Service"
                status={status}
                port="7777"
              />
              <ServiceStatusItem
                name="Auth Service"
                status="unknown"
                port="4000"
              />
              <ServiceStatusItem
                name="Conversation Service"
                status="unknown"
                port="4002"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {status === 'disconnected' && 'Make sure services are running. Run start-services.bat'}
                {status === 'connected' && 'All systems operational'}
                {status === 'checking' && 'Checking connection...'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceStatusItem({ 
  name, 
  status, 
  port 
}: { 
  name: string; 
  status: ConnectionState | 'unknown'; 
  port: string;
}) {
  const statusColors = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    checking: 'bg-yellow-500',
    unknown: 'bg-gray-400',
  };

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
        <span className="text-gray-700 dark:text-gray-300">{name}</span>
      </div>
      <span className="text-gray-500 dark:text-gray-400">:{port}</span>
    </div>
  );
}
