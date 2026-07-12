"use client";
import { useChat } from "@/hooks/useChat";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { useToast } from "@/hooks/useToast";
import { REACTION_PROMPTS } from "@/lib/constants/reactions";
import { DEFAULT_MODEL, LLMModel } from "@/lib/constants/models";
import Message from "./Message";
import InputArea from "./InputArea";
import AgentSelector from "./AgentSelector";
import TypingIndicator from "./TypingIndicator";
import Logo from "@/components/brand/Logo";
import SceneBackdrop from "@/components/three/SceneBackdrop";
import { ToastContainer } from "@/components/ui/Toast";
import ConnectionStatus from "@/components/ui/ConnectionStatus";
import MyStuffSidebar from "@/components/sidebar/MyStuffSidebar";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { FolderOpen, Search, Code2, PenLine, BarChart3 } from "lucide-react";

const SUGGESTIONS = [
  { icon: Search, label: "Research a topic", prompt: "Research the current state of solid-state batteries and summarize the key players." },
  { icon: Code2, label: "Debug some code", prompt: "Help me debug a React component that re-renders too often." },
  { icon: PenLine, label: "Draft a document", prompt: "Draft a one-page project proposal for migrating our API to GraphQL." },
  { icon: BarChart3, label: "Analyze data", prompt: "What statistical test should I use to compare conversion rates between two user groups?" },
];

export default function ChatWindow({ conversationId }: { conversationId?: string }) {
  const { messages, setMessages, isLoading, sendMessage, activeConvoId, setActiveConvoId, branchConversation, error: chatError } = useChat(conversationId);
  const scrollRef = useAutoScroll([messages, isLoading]);
  const { toasts, removeToast, success, error, info, warning } = useToast();
  const [selectedModel] = useState<LLMModel>(DEFAULT_MODEL);
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [selectedAgentName, setSelectedAgentName] = useState('General Assistant');
  const [myStuffOpen, setMyStuffOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [hasRedirected, setHasRedirected] = useState(false);
  const reduce = useReducedMotion();

  // Show error toast when chat error occurs
  useEffect(() => {
    if (chatError) {
      error(chatError);
    }
  }, [chatError, error]);

  // Reset state when "new" query param changes (new chat clicked)
  useEffect(() => {
    const newParam = searchParams.get('new');
    if (newParam && !conversationId) {
      setMessages([]);
      setActiveConvoId(undefined);
      setHasRedirected(false);
      router.replace('/chat', { scroll: false });
    }
  }, [searchParams, conversationId, setMessages, setActiveConvoId, router]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setActiveConvoId(undefined);
      setHasRedirected(false);
    }
  }, [conversationId, setMessages, setActiveConvoId]);

  useEffect(() => {
    if (activeConvoId && !conversationId && !hasRedirected && messages.length >= 2 && !isLoading) {
      setHasRedirected(true);
      window.history.pushState({}, '', `/chat/${activeConvoId}`);
    }
  }, [activeConvoId, conversationId, hasRedirected, messages.length, isLoading]);

  useEffect(() => {
    if (conversationId && messages.length === 0) {
      fetch(`/api/conversations/${conversationId}`)
        .then(async (res) => {
          if (!res.ok) {
            error('Failed to load conversation');
            return { messages: [] };
          }
          return res.json();
        })
        .then(data => {
          if (data && data.messages) {
            // Older payloads may only carry Mongo _id; reactions/branching key off id
            setMessages(data.messages.map((m: any) => ({ ...m, id: m.id ?? m._id })));
          }
        })
        .catch(err => {
          console.error(err);
          error('Failed to load conversation');
        });
    }
  }, [conversationId, messages.length, setMessages, error]);

  const handleReact = async (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, reactions: [...(m.reactions || []), emoji] } : m
    ));

    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      });
      if (!res.ok) throw new Error('Reaction request failed');

      const followUp = REACTION_PROMPTS[emoji];
      if (followUp) sendMessage(followUp, selectedModel.id, undefined, undefined, selectedAgentName);
    } catch (err) {
      error('Failed to add reaction');
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, reactions: (m.reactions || []).filter(r => r !== emoji) } : m
      ));
    }
  };

  const handleBranch = async (messageId: string) => {
    const index = messages.findIndex(m => m.id === messageId || (m as any)._id === messageId);
    if (index === -1) return;

    setMessages(messages.slice(0, index + 1));

    try {
      if (branchConversation) {
        const newConvoId = await branchConversation(messageId);
        if (newConvoId) {
          window.history.pushState({}, '', `/chat/${newConvoId}`);
          success('Conversation branched');
        } else {
          if (setActiveConvoId) setActiveConvoId(undefined);
          window.history.pushState({}, '', '/chat');
          warning('Branch created, starting new conversation');
        }
      }
    } catch (err) {
      error('Failed to branch conversation');
    }
  };

  const handleSend = async (content: string, scheduledFor?: Date, useWebSearch?: boolean, attachments?: any[]) => {
    try {
      if (scheduledFor) {
        await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, conversationId: activeConvoId, scheduledFor, modelId: selectedModel.id })
        });
        success('Message scheduled');
      } else {
        await sendMessage(content, selectedModel.id, useWebSearch, attachments, selectedAgentName);
      }
    } catch (err) {
      error('Failed to send message');
    }
  };

  const getChatTitle = () => {
    if (messages.length === 0) return "New chat";
    const firstMsg = messages[0].content;
    return firstMsg.length > 32 ? firstMsg.substring(0, 32).trim() + "…" : firstMsg;
  };

  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <MyStuffSidebar
        isOpen={myStuffOpen}
        onClose={() => setMyStuffOpen(false)}
        onDocumentSelect={(id, name) => {
          info(`Document "${name}" selected`);
        }}
      />

      <div className="relative flex flex-col h-full w-full overflow-hidden bg-void">
        {/* Header */}
        <header className="relative z-[var(--z-sticky)] h-14 flex items-center justify-between gap-3 px-4 border-b border-[var(--border-subtle)] bg-surface/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AgentSelector
              selectedAgent={selectedAgent}
              onSelectAgent={(id, name) => {
                setSelectedAgent(id);
                setSelectedAgentName(name);
              }}
            />
            <button
              onClick={() => setMyStuffOpen(true)}
              className="nx-press flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[var(--border-subtle)] text-ink-secondary hover:text-ink hover:bg-raised transition-colors duration-150"
              title="My Stuff: manage documents"
            >
              <FolderOpen size={15} />
              <span className="text-[13px] font-medium hidden sm:inline">My Stuff</span>
            </button>
          </div>

          <h1 className="absolute left-1/2 -translate-x-1/2 hidden md:block max-w-[36ch] truncate text-[13px] font-medium text-ink-secondary pointer-events-none">
            {getChatTitle()}
          </h1>

          <ConnectionStatus />
        </header>

        {messages.length === 0 ? (
          /* ── Empty state: the cinematic moment ─────────────────── */
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 overflow-hidden">
            <SceneBackdrop variant="ambient" />

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="relative z-10 flex flex-col items-center text-center mb-9"
            >
              <Logo size={40} withWordmark={false} className="mb-5" />
              <h2 className="text-[1.75rem] md:text-[2rem] font-semibold text-ink tracking-tight text-balance">
                {firstName ? `Hello ${firstName}.` : "Hello."} What are we working on?
              </h2>
              <p className="mt-2 text-[14px] text-ink-secondary">
                {selectedAgentName} is ready
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent ml-2 align-middle" aria-hidden="true" />
              </p>
            </motion.div>

            <div className="relative z-10 w-full max-w-2xl">
              <InputArea onSend={handleSend} isLoading={isLoading} />

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 px-6">
                {SUGGESTIONS.map(({ icon: Icon, label, prompt }, i) => (
                  <motion.button
                    key={label}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                    onClick={() => handleSend(prompt, undefined, true)}
                    className="nx-press flex flex-col items-start gap-2 p-3 rounded-[10px] border border-[var(--border-subtle)] bg-raised/50 text-left hover:border-[var(--border-strong)] hover:bg-raised transition-colors duration-150"
                  >
                    <Icon size={15} className="text-accent" />
                    <span className="text-[12.5px] font-medium text-ink-secondary leading-snug">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Conversation ───────────────────────────────────────── */
          <>
            <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto w-full custom-scrollbar pt-6 pb-2 min-h-0">
              <div className="max-w-3xl mx-auto px-5 w-full pb-6">
                {messages.map((msg, index) => (
                  <Message
                    key={msg.id || (msg as any)._id || index}
                    message={msg}
                    onReact={handleReact}
                    onBranch={handleBranch}
                    modelName={selectedAgentName}
                    modelIcon={selectedModel.icon}
                  />
                ))}

                {isLoading && <TypingIndicator modelName={selectedAgentName} />}
              </div>
            </div>

            <InputArea onSend={handleSend} isLoading={isLoading} />
          </>
        )}
      </div>
    </>
  );
}
