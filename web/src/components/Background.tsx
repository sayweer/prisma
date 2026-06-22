import "./landing.css";

// Cinematic depth: a single prismatic light shaft (jade→violet→azure refraction,
// slow drift) over a masked perspective grid + vignette + film grain. One
// controlled light source — not the old multi-aurora soup. Tokens are --lx-*,
// so it never touches the Dashboard's shared palette.
export default function Background() {
  return (
    <>
      <div className="cine" aria-hidden>
        <span className="cine__grid" />
        <span className="cine__beam" />
        <span className="cine__vig" />
      </div>
      <div className="cine__grain" aria-hidden />
    </>
  );
}
