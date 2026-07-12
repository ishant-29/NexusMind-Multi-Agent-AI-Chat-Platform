import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexusMind — Multi-Agent AI Workspace",
  description: "Research, code, write, and analyze with specialist AI agents grounded in your own documents.",
};

export const viewport = {
  themeColor: "#0d1017",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
      <body className="h-full bg-void text-ink">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
