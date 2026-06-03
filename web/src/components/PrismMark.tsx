// The signature: a white "payment beam" enters a glass prism and refracts into a
// spectrum of attributed, policy-checked streams. Used big on the landing (hero)
// and small in the nav/footer (mark). Continuous motion lives in index.css
// (.beam-anim); entrance animation is framer-motion, handled by the parent.

interface Props {
  variant?: "hero" | "mark";
  collapsed?: boolean; // rejected state: spectrum collapses to a single crimson line
  size?: number;
}

// Hero spectrum fan: violet → indigo → cyan → green → lime (mockup hex).
const FAN = [
  { x2: 448, y2: 150, c: "#7C3AED" },
  { x2: 450, y2: 186, c: "#4F46E5" },
  { x2: 452, y2: 222, c: "#22D3EE" },
  { x2: 450, y2: 258, c: "#00FF43" },
  { x2: 448, y2: 294, c: "#C9FF23" },
];

export default function PrismMark({ variant = "hero", collapsed = false, size }: Props) {
  if (variant === "mark") {
    const s = size ?? 30;
    return (
      <svg
        className="mark"
        width={s}
        height={s}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pm-mark-stroke" x1="3" y1="26" x2="29" y2="3">
            <stop stopColor="#7C3AED" />
            <stop offset="0.5" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <path
          d="M16 3 L29 26 L3 26 Z"
          stroke="url(#pm-mark-stroke)"
          strokeWidth="1.6"
          fill="rgba(124,58,237,0.10)"
        />
        <path d="M16 3 L16 26" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <div className="prism-art" aria-hidden="true">
      <svg
        viewBox="0 0 460 460"
        role="img"
        aria-label="A white beam refracting through a prism into a spectrum fan"
      >
        <defs>
          <linearGradient id="pm-hero-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="pm-hero-tri" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7C3AED" stopOpacity="0.45" />
            <stop offset="0.5" stopColor="#4F46E5" stopOpacity="0.30" />
            <stop offset="1" stopColor="#22D3EE" stopOpacity="0.40" />
          </linearGradient>
          <radialGradient id="pm-hero-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#7C3AED" stopOpacity="0.5" />
            <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="250" cy="230" r="180" fill="url(#pm-hero-halo)" />

        {/* incoming white beam */}
        <g className="beam-anim">
          <rect x="0" y="222" width="190" height="3.5" fill="url(#pm-hero-beam)" />
          <rect x="40" y="223" width="150" height="1.4" fill="#fff" opacity="0.9" />
        </g>

        {/* prism triangle */}
        <path
          d="M205 110 L300 312 L150 312 Z"
          fill="url(#pm-hero-tri)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.4"
        />
        <path
          d="M205 110 L300 312 L150 312 Z"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="0.6"
          opacity="0.5"
        />

        {/* refracted spectrum fan (collapses to a single crimson line when rejected) */}
        <g className="beam-anim" strokeWidth="3.2" strokeLinecap="round">
          {FAN.map((r, i) => (
            <line
              key={i}
              x1="232"
              y1="224"
              x2={collapsed ? 452 : r.x2}
              y2={collapsed ? 224 : r.y2}
              stroke={collapsed ? "#FF2D55" : r.c}
              opacity={collapsed ? 0.55 : undefined}
            />
          ))}
        </g>
        {!collapsed && (
          <g strokeWidth="1" strokeLinecap="round" opacity="0.45">
            <line x1="232" y1="224" x2="448" y2="150" stroke="#fff" />
            <line x1="232" y1="224" x2="452" y2="222" stroke="#fff" />
            <line x1="232" y1="224" x2="448" y2="294" stroke="#fff" />
          </g>
        )}

        {/* refraction point glow */}
        <circle cx="232" cy="224" r="6" fill="#fff" />
        <circle cx="232" cy="224" r="14" fill="#fff" opacity="0.18" />
      </svg>
    </div>
  );
}
