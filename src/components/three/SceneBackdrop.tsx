"use client";
import dynamic from "next/dynamic";

// three.js is heavy: load it client-side only, after the page is interactive.
// While loading (and on WebGL failure) the CSS gradient beneath carries the scene.
const NexusScene = dynamic(() => import("./NexusScene"), {
  ssr: false,
  loading: () => null,
});

export default function SceneBackdrop({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "ambient";
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      {/* depth gradient under the canvas so the scene never sits on flat black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(0.2 0.045 235 / 0.55), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 90%, oklch(0.19 0.05 280 / 0.35), transparent 70%)",
        }}
      />
      <NexusScene variant={variant} />
      {/* bottom fade keeps foreground text readable */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(to top, var(--background), transparent)",
        }}
      />
    </div>
  );
}
