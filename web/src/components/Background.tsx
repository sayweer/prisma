import "./landing.css";

// Cinematic flow, ONE accent colour: a slow breathing light pool + thin volumetric
// shafts drifting across the void + vignette + film grain. Keeps the static page in
// constant subtle motion without the old multi-hue beam. Tokens are --lx-*, so it
// never touches the Dashboard's shared palette.
export default function Background() {
  return (
    <>
      <div className="cine" aria-hidden>
        <span className="cine__glow" />
        <span className="cine__rays" />
        <span className="cine__vig" />
      </div>
      <div className="cine__grain" aria-hidden />
    </>
  );
}
