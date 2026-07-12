import ChatWindow from "@/components/chat/ChatWindow";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function ExistingChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <ErrorBoundary>
      {/* key remounts ChatWindow per conversation so switching in the
          sidebar reloads messages instead of showing the previous thread */}
      <ChatWindow key={resolvedParams.id} conversationId={resolvedParams.id} />
    </ErrorBoundary>
  );
}
