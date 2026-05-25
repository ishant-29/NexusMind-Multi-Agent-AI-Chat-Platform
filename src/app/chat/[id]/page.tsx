import ChatWindow from "@/components/chat/ChatWindow";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function ExistingChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <ErrorBoundary>
      <ChatWindow conversationId={resolvedParams.id} />
    </ErrorBoundary>
  );
}
