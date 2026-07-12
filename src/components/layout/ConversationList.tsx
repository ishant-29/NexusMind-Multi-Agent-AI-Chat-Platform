"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Trash2 } from "lucide-react";
import { Conversation } from "@/types/chat";

interface Props {
  isCollapsed?: boolean;
}

export default function ConversationList({ isCollapsed }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/conversations")
      .then(async (res) => {
        if (!res.ok) return { conversations: [] };
        return res.json();
      })
      .then((data) => {
        if (data && data.conversations) setConversations(data.conversations);
      })
      .catch((err) => console.error("Error fetching conversations:", err))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c._id !== id));
    if (pathname === `/chat/${id}`) router.push("/chat");
  };

  if (loading) {
    return (
      <div className="space-y-2 px-1" aria-hidden="true">
        {[100, 75, 88].map((w, i) => (
          <div key={i} className="nx-skeleton h-8" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {conversations.map((convo) => {
        const isActive = pathname === `/chat/${convo._id}`;
        return (
          <Link
            key={convo._id}
            href={`/chat/${convo._id}`}
            className={`group flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-2.5 py-2 rounded-[10px] text-[13px] transition-colors duration-150 ${
              isActive
                ? "bg-raised text-ink"
                : "text-ink-secondary hover:bg-raised/60 hover:text-ink"
            }`}
            title={isCollapsed ? convo.title : undefined}
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"} overflow-hidden`}>
              <MessageCircle
                size={14}
                className={`shrink-0 ${isActive ? "text-accent" : "text-ink-faint"}`}
              />
              {!isCollapsed && <span className="truncate">{convo.title}</span>}
            </div>
            {!isCollapsed && (
              <button
                onClick={(e) => handleDelete(e, convo._id)}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-ink-faint hover:text-danger transition-[opacity,color] duration-150 p-1 rounded"
                title="Delete conversation"
                aria-label={`Delete conversation ${convo.title}`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </Link>
        );
      })}
      {conversations.length === 0 && !isCollapsed && (
        <div className="px-2.5 py-4 text-[12.5px] text-ink-faint leading-relaxed">
          No conversations yet. Start one and it will appear here.
        </div>
      )}
    </div>
  );
}
