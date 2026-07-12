"use client";
import { motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import { Message as MessageType } from "@/types/chat";
import ReactionBar from "./ReactionBar";
import RemixPanel from "./RemixPanel";
import Logo from "@/components/brand/Logo";
import { GitBranch, Copy, Check, Globe, FileText, Video, Download } from "lucide-react";
import { parseMarkdown } from "@/lib/parseMarkdown";
import { useState, useMemo } from "react";

interface Props {
  message: MessageType;
  onReact: (messageId: string, emoji: string) => void;
  onBranch?: (messageId: string) => void;
  modelName?: string;
  modelIcon?: React.ReactNode;
}

export default function Message({ message, onReact, onBranch, modelName, modelIcon }: Props) {
  const isUser = message.role === "user";
  const [showControls, setShowControls] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const renderedContent = useMemo(() => parseMarkdown(message.content), [message.content]);

  const formattedTime = useMemo(() => {
    const date = new Date(message.timestamp ?? (message as any).createdAt ?? Date.now());
    return isNaN(date.getTime()) ? "" : format(date, "h:mm a");
  }, [message]);

  const getFileIcon = (type: string) => {
    if (type?.startsWith("video/")) return <Video size={15} className="text-accent" />;
    return <FileText size={15} className="text-accent" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const controlButtonClass =
    "nx-press flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--border-subtle)] bg-raised text-[11px] font-medium text-ink-faint hover:text-ink hover:border-[var(--border-strong)] transition-colors duration-150";

  return (
    <motion.div
      className={`flex items-start gap-3 w-full mb-6 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-full bg-raised border border-[var(--border-strong)] shrink-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-ink-secondary">You</span>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-raised border border-[oklch(0.82_0.13_205_/_0.35)] shrink-0 flex items-center justify-center">
          <Logo size={16} withWordmark={false} />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[82%] md:max-w-[75%] min-w-0 ${isUser ? "items-end" : "items-start"}`}>
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1.5">
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="nx-press flex items-center gap-2.5 px-3 py-2 rounded-[10px] border border-[var(--border-subtle)] bg-raised hover:border-[var(--border-strong)] transition-colors duration-150"
              >
                {getFileIcon(attachment.type)}
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-medium max-w-[150px] truncate text-ink">
                    {attachment.name}
                  </span>
                  <span className="text-[10.5px] text-ink-faint">
                    {formatFileSize(attachment.size)}
                  </span>
                </div>
                <Download size={13} className="text-ink-faint" />
              </a>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-3 text-[14px] leading-relaxed relative markdown-content max-w-full ${
            isUser
              ? "bg-accent text-accent-ink rounded-2xl rounded-tr-[4px]"
              : "bg-raised text-ink rounded-2xl rounded-tl-[4px] border border-[var(--border-subtle)]"
          }`}
          {...(isUser ? { "data-on-accent": "" } : {})}
        >
          <span dangerouslySetInnerHTML={{ __html: renderedContent }} />

          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-3 right-2 flex gap-0.5 bg-overlay border border-[var(--border-strong)] rounded-full px-1.5 py-0.5 text-xs shadow-lg shadow-black/20">
              {Array.from(new Set(message.reactions)).map(r => <span key={r}>{r}</span>)}
            </div>
          )}
        </div>

        {/* Meta line */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
          {formattedTime && (
            <span className="text-[10.5px] text-ink-faint">{formattedTime}</span>
          )}
          {!isUser && message.usedWebSearch && (
            <span className="flex items-center gap-1 text-[10.5px] text-accent">
              <Globe size={10} />
              Web search
            </span>
          )}
        </div>

        {/* Controls */}
        {showControls && (
          <motion.div
            className={`flex flex-wrap items-center gap-1.5 mt-0.5 ${isUser ? "justify-end" : "justify-start"}`}
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {!isUser && (
              <>
                <ReactionBar messageId={message.id} onReact={(emoji) => onReact(message.id, emoji)} />
                <RemixPanel content={message.content} />
                <button
                  onClick={() => onBranch?.(message.id)}
                  className={controlButtonClass}
                  title="Branch conversation from here"
                >
                  <GitBranch size={12} />
                  Branch
                </button>
              </>
            )}

            <button onClick={handleCopy} className={controlButtonClass} title="Copy message">
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
