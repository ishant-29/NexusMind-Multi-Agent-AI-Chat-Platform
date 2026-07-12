"use client";
import { useRouter } from "next/navigation";
import { Plus, PanelLeftClose, PanelLeft } from "lucide-react";
import ConversationList from "@/components/layout/ConversationList";
import SettingsModal from "./SettingsModal";
import Logo from "@/components/brand/Logo";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useModal } from "@/contexts/ModalContext";

export default function Sidebar() {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const { setIsModalOpen } = useModal();

  const handleSettingsChange = (open: boolean) => {
    setSettingsOpen(open);
    setIsModalOpen(open);
  };

  const handleNewChat = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/chat?new=${Date.now()}`);
  };

  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 68 : 248 }}
      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
      className="h-full bg-surface border-r border-[var(--border-subtle)] flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className={`h-14 px-3.5 flex items-center shrink-0 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Logo size={24} />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="nx-press p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-raised transition-colors duration-150"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 mb-3">
        <button
          onClick={handleNewChat}
          className={`nx-press flex items-center ${isCollapsed ? "justify-center px-0" : "gap-2 px-3"} w-full py-2.5 rounded-[10px] bg-accent text-accent-ink text-[13px] font-semibold hover:bg-accent-strong transition-colors duration-150`}
          title="New chat"
        >
          <Plus size={16} strokeWidth={2.5} className="shrink-0" />
          {!isCollapsed && <span>New chat</span>}
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 min-h-0">
        {!isCollapsed && (
          <p className="px-2 mb-2 text-[11px] font-semibold text-ink-faint">
            Recent
          </p>
        )}
        <ConversationList isCollapsed={isCollapsed} />
      </div>

      {/* Account */}
      <div className="border-t border-[var(--border-subtle)] mt-auto shrink-0">
        <button
          onClick={() => handleSettingsChange(true)}
          className={`w-full px-3 py-3 flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} hover:bg-raised transition-colors duration-150 text-left`}
          title="Settings"
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt=""
              className="w-8 h-8 rounded-full shrink-0 border border-[var(--border-strong)]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-raised border border-[var(--border-strong)] flex items-center justify-center text-[11px] font-bold text-accent shrink-0">
              {getUserInitials()}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-medium text-ink truncate">
                {session?.user?.name || "User"}
              </span>
              <span className="text-[11px] text-ink-faint truncate">
                {session?.user?.email}
              </span>
            </div>
          )}
        </button>
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={handleSettingsChange} />
    </motion.aside>
  );
}
