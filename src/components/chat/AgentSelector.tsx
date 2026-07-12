'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Wrench, Sparkles, Search, Code2, PenLine } from 'lucide-react';
import { agentService } from '@/lib/services/serviceClient';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  has_tools: boolean;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  general: <Sparkles size={16} />,
  research: <Search size={16} />,
  coding: <Code2 size={16} />,
  creative: <PenLine size={16} />,
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
    return <div className="nx-skeleton h-9 w-40" aria-label="Loading agents" />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="nx-press flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[var(--border-subtle)] text-ink-secondary hover:text-ink hover:bg-raised transition-colors duration-150"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-accent">
          {AGENT_ICONS[selectedAgent] || <Sparkles size={16} />}
        </span>
        <span className="text-[13px] font-medium max-w-[140px] truncate">
          {selectedAgentData?.name || 'General Assistant'}
        </span>
        <ChevronDown
          size={14}
          className={`text-ink-faint transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: 'top left', zIndex: 'var(--z-dropdown)' }}
            className="absolute top-full left-0 mt-2 w-80 nx-glass rounded-xl max-h-96 overflow-y-auto custom-scrollbar"
            role="listbox"
          >
            <div className="p-1.5">
              <p className="text-[11px] font-semibold text-ink-faint px-3 py-2">
                Choose an agent
              </p>

              {agents.length === 0 && (
                <p className="px-3 pb-3 text-[12.5px] text-ink-faint leading-relaxed">
                  No agents available. Check that the agent service is running.
                </p>
              )}

              {agents.map((agent) => {
                const isSelected = selectedAgent === agent.id;
                return (
                  <button
                    key={agent.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectAgent(agent.id, agent.name);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-[10px] transition-colors duration-150 text-left ${
                      isSelected ? 'bg-raised' : 'hover:bg-raised/60'
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${isSelected ? 'text-accent' : 'text-ink-faint'}`}>
                      {AGENT_ICONS[agent.id] || <Sparkles size={16} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className={`text-[13px] font-medium ${isSelected ? 'text-ink' : 'text-ink-secondary'}`}>
                          {agent.name}
                        </span>
                        {agent.has_tools && (
                          <Wrench size={11} className="text-ink-faint" aria-label="Tools enabled" />
                        )}
                      </span>
                      <span className="block text-[12px] text-ink-faint mt-0.5 leading-snug">
                        {agent.description}
                      </span>
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 'calc(var(--z-dropdown) - 1)' }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
