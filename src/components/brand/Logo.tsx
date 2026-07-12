interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * NexusMind mark: a node constellation converging on a bright core.
 * Single accent color on dark, per DESIGN.md.
 */
export default function Logo({ size = 26, withWordmark = true, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* spokes */}
        <g stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
          <path d="M16 16 L16 5" />
          <path d="M16 16 L26.5 11" />
          <path d="M16 16 L24 25" />
          <path d="M16 16 L8 25" />
          <path d="M16 16 L5.5 11" />
        </g>
        {/* outer nodes */}
        <g fill="var(--accent)">
          <circle cx="16" cy="5" r="2" opacity="0.9" />
          <circle cx="26.5" cy="11" r="1.7" opacity="0.7" />
          <circle cx="24" cy="25" r="1.7" opacity="0.7" />
          <circle cx="8" cy="25" r="1.7" opacity="0.7" />
          <circle cx="5.5" cy="11" r="1.7" opacity="0.7" />
        </g>
        {/* core */}
        <circle cx="16" cy="16" r="4.4" fill="var(--accent)" />
        <circle cx="16" cy="16" r="4.4" fill="none" stroke="oklch(1 0 0 / 0.35)" strokeWidth="0.75" />
      </svg>
      {withWordmark && (
        <span
          className="font-semibold tracking-tight text-ink leading-none"
          style={{ fontSize: Math.round(size * 0.62) }}
        >
          NexusMind
        </span>
      )}
    </span>
  );
}
