import ChatWindow from "@/components/chat/ChatWindow";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function NewChatPage() {
  return (
    <ErrorBoundary>
      <ChatWindow />
    </ErrorBoundary>
  );
}
