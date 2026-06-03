// The signature: a white "payment beam" enters a glass prism and refracts into a
// spectrum of attributed, policy-checked streams. Used big on the landing and
// small in the dashboard topbar. Continuous motion is CSS; entrance is framer-motion
// (handled by the parent).

interface Props {
  variant?: "hero" | "mark";
  collapsed?: boolean; // rejected state: spectrum collapses to a single red line
  size?: number;
}

const RAYS = [
  { y: 150, c: "var(--sp-red)" },
  { y: 171, c: "var(--sp-orange)" },
  { y: 192, c: "var(--sp-yellow)" },
  { y: 213, c: "var(--sp-green)" },
  { y: 234, c: "var(--sp-cyan)" },
  { y: 255, c: "var(--sp-blue)" },
  { y: 276, c: "var(--sp-violet)" },
];

const EXIT = { x: 321, y: 200 };

export default function PrismMark({ variant = "hero", collapsed = false, size }: Props) {
  if (variant === "mark") {
    const s = size ?? 34;
    return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none" aria-hidden>
        <defs>
          <linearGradient id="mk" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0" stopColor="var(--sp-cyan)" />
            <stop offset="0.5" stopColor="var(--sp-blue)" />
            <stop offset="1" stopColor="var(--sp-violet)" />
          </linearGradient>
        </defs>
        <path d="M20 6 L33 31 L7 31 Z" stroke="url(#mk)" strokeWidth="1.8" strokeLinejoin="round" fill="oklch(82% 0.13 200 / 0.08)" />
        <line x1="2" y1="20" x2="14" y2="20" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="26" y1="22" x2="38" y2="14" stroke="var(--sp-red)" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
        <line x1="26" y1="24" x2="38" y2="24" stroke="var(--sp-green)" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
        <line x1="26" y1="26" x2="38" y2="32" stroke="var(--sp-violet)" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
      </svg>
    );
  }

  return (
    <div className="pm-wrap" aria-hidden>
      <style>{PM_CSS}</style>
      <svg viewBox="0 0 560 380" width="100%" fill="none" className="pm-float">
        <defs>
          <radialGradient id="pm-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="oklch(82% 0.13 200 / 0.55)" />
            <stop offset="1" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="pm-glass" x1="210" y1="100" x2="350" y2="275" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="oklch(100% 0 0 / 0.14)" />
            <stop offset="1" stopColor="oklch(82% 0.13 200 / 0.06)" />
          </linearGradient>
          <linearGradient id="pm-edge" x1="0" y1="0" x2="560" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--sp-cyan)" />
            <stop offset="1" stopColor="var(--sp-violet)" />
          </linearGradient>
        </defs>

        {/* bloom */}
        <circle cx="300" cy="195" r="160" fill="url(#pm-glow)" className="pm-bloom" />

        {/* incoming white payment beam */}
        <line x1="20" y1="190" x2="243" y2="190" stroke="white" strokeWidth="2.4" strokeLinecap="round" className="pm-beam" />
        <circle r="3.5" fill="white" className="pm-spark">
          <animateMotion dur="2.6s" repeatCount="indefinite" path="M20,190 L243,190" />
        </circle>

        {/* refracted spectrum */}
        {RAYS.map((r, i) => (
          <line
            key={i}
            x1={EXIT.x}
            y1={EXIT.y}
            x2={545}
            y2={collapsed ? 205 : r.y}
            stroke={collapsed ? "var(--danger)" : r.c}
            strokeWidth="2.2"
            strokeLinecap="round"
            className="pm-ray"
            style={{ animationDelay: `${i * 0.13}s`, opacity: collapsed ? 0.5 : undefined }}
          />
        ))}

        {/* internal segment */}
        <line x1="243" y1="190" x2={EXIT.x} y2={EXIT.y} stroke="oklch(100% 0 0 / 0.7)" strokeWidth="2" strokeLinecap="round" />

        {/* the prism */}
        <path
          d="M280 100 L350 270 L210 270 Z"
          fill="url(#pm-glass)"
          stroke="url(#pm-edge)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          className="pm-prism"
        />
        <path d="M280 100 L210 270" stroke="oklch(100% 0 0 / 0.35)" strokeWidth="1" />
      </svg>
    </div>
  );
}

const PM_CSS = `
.pm-wrap { width: 100%; max-width: 560px; }
.pm-float { animation: pm-float 9s ease-in-out infinite; transform-origin: center; }
@keyframes pm-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
.pm-beam { stroke-dasharray: 14 10; animation: pm-flow 1.1s linear infinite; }
@keyframes pm-flow { to { stroke-dashoffset: -24; } }
.pm-ray { animation: pm-shimmer 3.2s ease-in-out infinite; filter: drop-shadow(0 0 6px currentColor); }
@keyframes pm-shimmer { 0%,100%{opacity:0.45} 50%{opacity:1} }
.pm-bloom { animation: pm-breathe 6s ease-in-out infinite; transform-origin: center; }
@keyframes pm-breathe { 0%,100%{opacity:0.6; transform:scale(1)} 50%{opacity:1; transform:scale(1.08)} }
.pm-prism { filter: drop-shadow(0 8px 30px oklch(82% 0.13 200 / 0.3)); }
@media (prefers-reduced-motion: reduce) {
  .pm-float, .pm-beam, .pm-ray, .pm-bloom { animation: none; }
}
`;
