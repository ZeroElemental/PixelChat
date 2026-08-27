/**
 * Decorative animated backdrop -- drifting pixel grid plus two layers of rising
 * dust. Purely presentational, so it is hidden from assistive tech and ignores
 * pointer events. All motion lives in globals.css and is disabled under
 * prefers-reduced-motion.
 */
export function PixelBackdrop() {
  return (
    <div className="pixel-backdrop" aria-hidden="true">
      <span />
      <span />
    </div>
  )
}
