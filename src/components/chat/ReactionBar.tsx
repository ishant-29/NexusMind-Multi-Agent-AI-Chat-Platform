"use client";
import { REACTION_PROMPTS } from "@/lib/constants/reactions";

interface Props {
  messageId: string;
  onReact: (emoji: string) => void;
}

export default function ReactionBar({ messageId, onReact }: Props) {
  const emojis = Object.keys(REACTION_PROMPTS);

  return (
    <div className="flex gap-0.5 bg-raised border border-[var(--border-subtle)] rounded-full px-1.5 py-0.5">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="nx-press p-1 text-[13px] rounded-full hover:bg-overlay transition-colors duration-150"
          title={REACTION_PROMPTS[emoji]}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
