'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agentService } from '@/lib/services/serviceClient';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  has_tools: boolean;
}

const AGENT_ICONS: Record<string, string> = {
  general: '🌟',
  research: '🔍',
  coding: '💻',
  creative: '✍️',
  data: '📊',
  document: '📄',
  business: '💼',
  advanced_research: '🔬',
  data_scientist: '📈',
  content_strategist: '📝',
  business_analyst: '💰',
};

interface AgentSelectorProps {
  selectedAgent: string;
  onSelectAgent: (agentId: string, agentName: string) => void;
}

export default function AgentSelector({ selectedAgent, onSelectAgent }: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await agentService.listAgents();
      if (response.success) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin">⚙️</div>
        Loading agents...
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected Agent Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <span className="text-2xl">
          {AGENT_ICONS[selectedAgent] || '🤖'}
        </span>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedAgentData?.name || 'Select Agent'}
          </span>
          {selectedAgentData?.has_tools && (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              🔧 Tools enabled
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
                SELECT AI AGENT
              </div>
              
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent.id, agent.name);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedAgent === agent.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">
                    {AGENT_ICONS[agent.id] || '🤖'}
                  </span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {agent.name}
                      </span>
                      {agent.has_tools && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          🔧
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {agent.description}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 inline-block">
                      Model: {agent.model}
                    </span>
                  </div>
                  {selectedAgent === agent.id && (
                    <span className="text-blue-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
