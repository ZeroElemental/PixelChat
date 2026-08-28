import { motionReduced } from '@/lib/prefs'

const MAX_PIXELS = 24

// One offscreen context for the life of the module. measureText against the
// field's own computed font gives the caret's x without a mirror element and
// without forcing a layout on every keystroke.
let ruler: CanvasRenderingContext2D | null = null

/**
 * Throws a couple of pixels off the caret. Purely decorative.
 *
 * `field` is an HTMLElement rather than an input so the landing page's fake
 * composer -- a div -- can be measured the same way.
 */
export function emitPixels(
  field: HTMLElement | null,
  host: HTMLElement | null,
  value: string,
) {
  // Bail here, not only in CSS: with `animation: none` the animationend event
  // never fires, so the nodes would pile up forever.
  if (!field || !host || motionReduced()) return
  if (host.childElementCount >= MAX_PIXELS) return

  ruler ??= document.createElement('canvas').getContext('2d')
  if (!ruler) return

  const style = getComputedStyle(field)
  ruler.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const padding = parseFloat(style.paddingLeft) || 0
  const x = Math.min(padding + ruler.measureText(value).width, field.clientWidth - 4)

  for (let i = 0; i < 2; i++) {
    const pixel = document.createElement('i')
    pixel.style.left = `${x}px`
    pixel.style.top = '50%'
    pixel.style.setProperty('--dx', `${(Math.random() - 0.4) * 26}px`)
    pixel.style.setProperty('--dy', `${-10 - Math.random() * 22}px`)
    pixel.addEventListener('animationend', () => pixel.remove(), { once: true })
    host.append(pixel)
  }
}
