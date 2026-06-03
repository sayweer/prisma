// Shared living background: drifting spectral aurora + dispersion fan + grain + vignette.
// Pure CSS (animations live in index.css). Rendered once at the app root so it
// persists across landing ↔ dashboard. No props, no JS logic.
export default function Background() {
  return (
    <>
      <div className="bg" aria-hidden>
        <div className="bg__aurora a1" />
        <div className="bg__aurora a2" />
        <div className="bg__aurora a3" />
        <div className="bg__aurora a4" />
        <div className="bg__fan" />
      </div>
      <div className="bg__grain" aria-hidden />
      <div className="bg__vignette" aria-hidden />
    </>
  );
}
