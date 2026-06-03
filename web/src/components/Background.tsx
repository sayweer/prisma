// Shared living background: drifting spectral aurora + grid + grain + vignette.
// Rendered once at the app root so it persists across landing ↔ dashboard.
export default function Background() {
  return (
    <div className="bg" aria-hidden>
      <div className="bg__blob bg__blob--1" />
      <div className="bg__blob bg__blob--2" />
      <div className="bg__blob bg__blob--3" />
      <div className="bg__grid" />
      <div className="bg__grain" />
      <div className="bg__vignette" />
    </div>
  );
}
