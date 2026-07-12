"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Logo from "@/components/brand/Logo";
import { ModalProvider } from "@/contexts/ModalContext";

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-5">
          <Logo size={34} withWordmark={false} className="animate-pulse" />
          <div className="w-40 space-y-2.5">
            <div className="nx-skeleton h-2.5 w-full" />
            <div className="nx-skeleton h-2.5 w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-void text-ink overflow-hidden">
      <Sidebar />
      <main className="flex-1 relative h-full min-w-0">
        {children}
      </main>
    </div>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </ModalProvider>
  );
}
