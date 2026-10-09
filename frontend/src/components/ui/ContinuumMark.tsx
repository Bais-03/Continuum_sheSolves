interface ContinuumMarkProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

export function ContinuumMark({
  className = "",
  size = 32,
  glow = true,
}: ContinuumMarkProps) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full bg-[var(--color-accent-teal,#00f2fe)]/20 blur-md"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative h-full w-full"
      >
        {/* Outer continuous hexagon shield border */}
        <polygon
          points="20,3 35,11 35,29 20,37 5,29 5,11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          className="text-cyan-400/80"
        />

        {/* Inner connected path nodes */}
        <path
          d="M20 7L30 13V27L20 33L10 27V13L20 7Z"
          stroke="url(#markGrad)"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />

        {/* Diagonal interconnected security lines */}
        <line x1="20" y1="7" x2="20" y2="33" stroke="currentColor" strokeWidth="1.2" className="text-cyan-500/40" />
        <line x1="10" y1="13" x2="30" y2="27" stroke="currentColor" strokeWidth="1.2" className="text-cyan-500/40" />
        <line x1="10" y1="27" x2="30" y2="13" stroke="currentColor" strokeWidth="1.2" className="text-cyan-500/40" />

        {/* Center core pulse node */}
        <circle cx="20" cy="20" r="4" fill="#00f2fe" />
        <circle cx="20" cy="20" r="2" fill="#ffffff" />

        {/* Node intersection points */}
        <circle cx="20" cy="7" r="1.5" fill="#38bdf8" />
        <circle cx="35" cy="11" r="1.5" fill="#38bdf8" />
        <circle cx="35" cy="29" r="1.5" fill="#38bdf8" />
        <circle cx="20" cy="37" r="1.5" fill="#38bdf8" />
        <circle cx="5" cy="29" r="1.5" fill="#38bdf8" />
        <circle cx="5" cy="11" r="1.5" fill="#38bdf8" />

        <defs>
          <linearGradient id="markGrad" x1="5" y1="7" x2="35" y2="37" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00f2fe" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
