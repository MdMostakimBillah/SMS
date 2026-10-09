/**
 * EduTech brand logo — shared path geometry, animation CSS + SVG builders.
 *
 * The React wrapper lives in `src/components/ui/BrandLogo.tsx`, but the geometry
 * and the keyframes live here so that every non-React usage (favicon, PDF
 * branding, print) reuses exactly the same artwork instead of a copy of it.
 *
 * The logo is 5 shape groups drawn in this order: top cap, chevron, bubble,
 * and two pillars (d1, d2). Indigo shapes use #6366f1; navy shapes #30329b.
 */

export const BRAND_LOGO_VIEWBOX = '112 118 276 264'

const INDIGO = '#6366f1'
const NAVY = '#30329b'

/** Easing used by every draw-on / undraw step of the animation. */
const CB = 'cubic-bezier(.65,0,.35,1)'

/** Full animation cycle in seconds — one knob to speed up / slow the whole logo. */
export const BRAND_LOGO_LOOP = 12

/** One shape group's full geometry. */
export interface BrandShape {
  /** group class, e.g. 'top' | 'chev' | 'bub' | 'd1' | 'd2' */
  key: string
  color: string
  /** filled body path (evenodd where the shape has a hole) */
  fill: string
  fillRule?: 'evenodd'
  /** stroke-outline path used for the draw-on / undraw effect */
  stroke: string
  /** inner ring detail stroke (pillars + bubble only) */
  ring?: string
  /** transform-origin for the ring, in viewBox px */
  ringOrigin?: string
  /** ring wrapper gets the `life` jump animation (bubble only) */
  ringAnimated?: boolean
}

/** Paint order: pillars first, then cap/chevron/bubble on top. */
export const BRAND_LOGO_SHAPES: BrandShape[] = [
  {
    key: 'd1', color: INDIGO,
    fill: 'M 302.12 243.69 L 301.81 263.60 C 301.54 280.84, 301.24 284.04, 299.56 287.50 L 290.53 314.00 C 290.79 314.00, 291.00 316.94, 291.00 320.53 C 291.00 326.76, 290.84 327.20, 287.45 330.18 C 282.76 334.30, 280.73 338.43, 280.84 343.67 C 280.95 349.39, 282.99 353.03, 288.04 356.53 C 299.83 364.70, 314.97 355.68, 313.77 341.21 C 313.33 335.99, 312.96 335.28, 308.26 330.97 L 303.22 326.33 303.71 314.49 C 304.17 303.22, 304.34 302.46, 307.13 298.99 C 313.53 291.02, 314.36 286.93, 314.96 260.57 L 315.50 236.64 Z M 302.05 340.09 C 304.83 345.30, 299.24 350.70, 294.37 347.50 C 291.77 345.80, 291.13 341.27, 293.20 339.20 C 295.24 337.16, 300.78 337.72, 302.05 340.09 Z',
    fillRule: 'evenodd',
    stroke: 'M 302.12 243.69 L 301.81 263.60 C 301.54 280.84, 301.24 284.04, 299.56 287.50 L 290.53 314.00 C 290.79 314.00, 291.00 316.94, 291.00 320.53 C 291.00 326.76, 290.84 327.20, 287.45 330.18 C 282.76 334.30, 280.73 338.43, 280.84 343.67 C 280.95 349.39, 282.99 353.03, 288.04 356.53 C 299.83 364.70, 314.97 355.68, 313.77 341.21 C 313.33 335.99, 312.96 335.28, 308.26 330.97 L 303.22 326.33 303.71 314.49 C 304.17 303.22, 304.34 302.46, 307.13 298.99 C 313.53 291.02, 314.36 286.93, 314.96 260.57 L 315.50 236.64 Z',
    ring: 'M 302.05 340.09 C 304.83 345.30, 299.24 350.70, 294.37 347.50 C 291.77 345.80, 291.13 341.27, 293.20 339.20 C 295.24 337.16, 300.78 337.72, 302.05 340.09 Z',
    ringOrigin: '297.6px 343.6px',
  },
  {
    key: 'd2', color: INDIGO,
    fill: 'M 327.75 230.04 C 328.73 230.01, 329.00 237.53, 329.00 264.43 L 329.00 298.86 326.07 300.95 C 319.21 305.83, 317.13 314.41, 320.97 321.94 C 326.22 332.24, 343.19 333.30, 349.04 323.70 C 353.73 316.02, 352.79 308.39, 346.41 302.27 L 342.00 298.03 342.00 259.70 L 342.00 221.36 Z M 339.48 310.63 C 341.82 312.97, 341.00 317.15, 337.87 318.91 C 332.58 321.86, 327.29 314.85, 331.57 310.57 C 333.61 308.54, 337.42 308.56, 339.48 310.63 Z',
    fillRule: 'evenodd',
    stroke: 'M 327.75 230.04 C 328.73 230.01, 329.00 237.53, 329.00 264.43 L 329.00 298.86 326.07 300.95 C 319.21 305.83, 317.13 314.41, 320.97 321.94 C 326.22 332.24, 343.19 333.30, 349.04 323.70 C 353.73 316.02, 352.79 308.39, 346.41 302.27 L 342.00 298.03 342.00 259.70 L 342.00 221.36 Z',
    ring: 'M 339.48 310.63 C 341.82 312.97, 341.00 317.15, 337.87 318.91 C 332.58 321.86, 327.29 314.85, 331.57 310.57 C 333.61 308.54, 337.42 308.56, 339.48 310.63 Z',
    ringOrigin: '334.4px 314.5px',
  },
  {
    key: 'top', color: INDIGO,
    fill: 'M 212.5 146.64 C 122.94 196.65, 121.73 197.36, 122.20 199.75 C 122.36 200.60, 130.38 205.87, 140 211.47 C 149.63 217.07, 167.63 227.64, 180 234.97 C 192.38 242.29, 204.08 249.16, 206 250.25 C 207.93 251.33, 209.95 252.57, 210.5 253 C 211.05 253.43, 213.3 254.79, 215.5 256.01 C 217.7 257.24, 224.51 261.14, 230.62 264.68 C 248.44 274.99, 250.60 274.82, 273.20 261.23 C 280.28 256.98, 288.41 252.12, 291.28 250.44 C 294.15 248.76, 297.76 246.56, 299.31 245.54 L 302.12 243.69 L 315.5 236.64 L 321 233.36 L 342 221.36 L 350.65 216.43 C 355.41 213.72, 361.59 210.19, 364.40 208.59 C 374.68 202.73, 377.13 200.90, 376.81 199.31 C 376.48 197.63, 370.89 194.47, 265.61 136.33 C 256.32 131.20, 248.45 127.02, 248.11 127.05 C 247.78 127.08, 231.75 135.90, 212.5 146.64 Z',
    stroke: 'M 212.5 146.64 C 122.94 196.65, 121.73 197.36, 122.20 199.75 C 122.36 200.60, 130.38 205.87, 140 211.47 C 149.63 217.07, 167.63 227.64, 180 234.97 C 192.38 242.29, 204.08 249.16, 206 250.25 C 207.93 251.33, 209.95 252.57, 210.5 253 C 211.05 253.43, 213.3 254.79, 215.5 256.01 C 217.7 257.24, 224.51 261.14, 230.62 264.68 C 248.44 274.99, 250.60 274.82, 273.20 261.23 C 280.28 256.98, 288.41 252.12, 291.28 250.44 C 294.15 248.76, 297.76 246.56, 299.31 245.54 L 302.12 243.69 L 315.5 236.64 L 321 233.36 L 342 221.36 L 350.65 216.43 C 355.41 213.72, 361.59 210.19, 364.40 208.59 C 374.68 202.73, 377.13 200.90, 376.81 199.31 C 376.48 197.63, 370.89 194.47, 265.61 136.33 C 256.32 131.20, 248.45 127.02, 248.11 127.05 C 247.78 127.08, 231.75 135.90, 212.5 146.64 Z',
  },
  {
    key: 'chev', color: NAVY,
    fill: 'M 161.23 261.16 L 161.50 287.33 168.00 288.64 C 187.95 292.66, 217.84 308.43, 234.21 323.57 C 236.24 325.46, 238.43 327.00, 239.07 327.00 C 239.70 327.00, 242.69 324.74, 245.72 321.97 C 251.86 316.37, 262.67 308.10, 271.00 302.65 C 290.29 290.04, 292.52 287.24, 293.60 274.22 C 294.34 265.39, 293.68 261.00, 291.61 261.00 C 290.86 261.00, 286.04 263.54, 280.88 266.65 C 251.49 284.35, 248.20 284.76, 228.50 273.11 C 223.00 269.85, 207.48 260.77, 194.00 252.93 C 180.53 245.08, 168.31 237.84, 166.85 236.83 C 160.87 232.71, 160.94 232.41, 161.23 261.16 Z',
    stroke: 'M 161.23 261.16 L 161.50 287.33 168.00 288.64 C 187.95 292.66, 217.84 308.43, 234.21 323.57 C 236.24 325.46, 238.43 327.00, 239.07 327.00 C 239.70 327.00, 242.69 324.74, 245.72 321.97 C 251.86 316.37, 262.67 308.10, 271.00 302.65 C 290.29 290.04, 292.52 287.24, 293.60 274.22 C 294.34 265.39, 293.68 261.00, 291.61 261.00 C 290.86 261.00, 286.04 263.54, 280.88 266.65 C 251.49 284.35, 248.20 284.76, 228.50 273.11 C 223.00 269.85, 207.48 260.77, 194.00 252.93 C 180.53 245.08, 168.31 237.84, 166.85 236.83 C 160.87 232.71, 160.94 232.41, 161.23 261.16 Z',
  },
  {
    key: 'bub', color: NAVY,
    fill: 'M 299.56 287.50 C 297.19 292.40, 286.39 303.11, 278.41 308.47 C 268.77 314.95, 263.83 319.02, 257.82 325.44 C 249.99 333.80, 249.11 334.66, 244.04 338.94 C 239.67 342.63, 239.58 342.83, 239.20 349.60 C 238.76 357.81, 240.95 362.01, 247.47 365.37 C 262.26 373.01, 277.16 358.28, 269.87 343.24 C 268.70 340.82, 267.13 338.60, 266.37 338.31 C 263.84 337.34, 264.96 334.66, 269.75 330.24 C 274.54 325.81, 289.66 314.00, 290.53 314.00 Z M 258.36 346.51 C 263.61 351.76, 258.50 358.48, 251.93 354.96 C 249.20 353.50, 249.37 348.55, 252.22 346.56 C 255.01 344.61, 256.45 344.59, 258.36 346.51 Z',
    fillRule: 'evenodd',
    stroke: 'M 299.56 287.50 C 297.19 292.40, 286.39 303.11, 278.41 308.47 C 268.77 314.95, 263.83 319.02, 257.82 325.44 C 249.99 333.80, 249.11 334.66, 244.04 338.94 C 239.67 342.63, 239.58 342.83, 239.20 349.60 C 238.76 357.81, 240.95 362.01, 247.47 365.37 C 262.26 373.01, 277.16 358.28, 269.87 343.24 C 268.70 340.82, 267.13 338.60, 266.37 338.31 C 263.84 337.34, 264.96 334.66, 269.75 330.24 C 274.54 325.81, 289.66 314.00, 290.53 314.00 Z',
    ring: 'M 258.36 346.51 C 263.61 351.76, 258.50 358.48, 251.93 354.96 C 249.20 353.50, 249.37 348.55, 252.22 346.56 C 255.01 344.61, 256.45 344.59, 258.36 346.51 Z',
    ringOrigin: '255.3px 350.6px',
    ringAnimated: true,
  },
]

/**
 * Builds a static (non-animated) inline SVG string — safe for print,
 * PDF iframes and favicons. Just the filled shapes, no strokes.
 */
export function brandLogoStaticSVG(size: number | string, className?: string): string {
  const paths = BRAND_LOGO_SHAPES.map(
    (s) => `<path d="${s.fill}" fill="${s.color}"${s.fillRule ? ` fill-rule="${s.fillRule}"` : ''}/>`
  ).join('')
  const cls = className ? ` class="${className}"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BRAND_LOGO_VIEWBOX}" width="${size}" height="${size}"${cls} role="img" aria-label="EduTech logo">${paths}</svg>`
}

/** data-URI variant, useful for `<img src>` fallbacks. */
export function brandLogoDataURI(size: number | string): string {
  return `data:image/svg+xml,${encodeURIComponent(brandLogoStaticSVG(size))}`
}

/**
 * Builds the `<style>` body for the animated logo: the per-shape `@keyframes`
 * plus the rules that scope them to `ns`. Shared by the React `BrandLogo` and
 * the standalone favicon document so the animation only ever exists once.
 *
 * Fast loop, staggered per shape: each shape's outline draws on, its fill fades
 * in, everything holds, then the sequence plays in reverse (fill fades out,
 * outline undraws) before replaying. The stagger order reads top → chev → bub →
 * d2 → d1 so the logo dismantles and reassembles rather than blinking off.
 *
 * @param ns  namespaces both the root class (`bl_<ns>`) and every keyframe name
 *            (`<name>_<ns>`), so several logos can share one page. Standalone
 *            documents such as the favicon can use a fixed value like `'fav'`.
 * @param loop  animation cycle in seconds — normally {@link BRAND_LOGO_LOOP}.
 * @param delay  optional negative `animation-delay` in seconds. `-loop / 2`
 *               starts the cycle on its settled frame, which keeps a renderer
 *               that rasterizes the icon before it has ticked from capturing a
 *               blank logo.
 */
export function brandLogoAnimationCSS(ns: string, loop: number, delay = 0): string {
  const root = `bl_${ns}`
  const unq = (s: string) => `${s}_${ns}`
  const sc = (sel: string) =>
    sel
      .split(',')
      .map((s) => `.${root} ${s.trim()}`)
      .join(', ')
  const anim = (name: string) =>
    `animation: ${unq(name)} ${loop}s linear${delay ? ` ${delay}s` : ''} infinite;`

  return `
      ${sc('.ln, .rl')} { fill: none; stroke-linejoin: round; stroke-dasharray: 1 1; stroke-dashoffset: 0; stroke-opacity: 0; }

      @keyframes ${unq('ln_d1')} {
        0% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        16.3333% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        21.6667% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ease; }
        23.6667% { stroke-dashoffset: 0; stroke-opacity: 1; }
        25.6667% { stroke-dashoffset: 0; stroke-opacity: 0; }
        68.3333% { stroke-dashoffset: 0; stroke-opacity: 0; animation-timing-function: ease; }
        70% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ${CB}; }
        75.3333% { stroke-dashoffset: 1; stroke-opacity: 1; }
        100% { stroke-dashoffset: 1; stroke-opacity: 1; }
      }
      @keyframes ${unq('bd_d1')} {
        0% { opacity: 0; animation-timing-function: ease; }
        20.6667% { opacity: 0; animation-timing-function: ease; }
        23.3333% { opacity: 1; }
        68.3333% { opacity: 1; animation-timing-function: ease; }
        71% { opacity: 0; }
        100% { opacity: 0; }
      }
      .${root} .d1 .ln { ${anim('ln_d1')} }
      .${root} .d1 .body { ${anim('bd_d1')} }
      @keyframes ${unq('rl_d1')} {
        0% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        21% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        23.3333% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ease; }
        23.6667% { stroke-dashoffset: 0; stroke-opacity: 1; }
        25.6667% { stroke-dashoffset: 0; stroke-opacity: 0; }
        68.3333% { stroke-dashoffset: 0; stroke-opacity: 0; animation-timing-function: ease; }
        69.3333% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ${CB}; }
        70.6667% { stroke-dashoffset: 1; stroke-opacity: 1; }
        100% { stroke-dashoffset: 1; stroke-opacity: 1; }
      }
      .${root} .d1 .rl { ${anim('rl_d1')} }

      @keyframes ${unq('ln_d2')} {
        0% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        21% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        26.3333% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ease; }
        28.3333% { stroke-dashoffset: 0; stroke-opacity: 1; }
        30.3333% { stroke-dashoffset: 0; stroke-opacity: 0; }
        63.6667% { stroke-dashoffset: 0; stroke-opacity: 0; animation-timing-function: ease; }
        65.3333% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ${CB}; }
        70.6667% { stroke-dashoffset: 1; stroke-opacity: 1; }
        100% { stroke-dashoffset: 1; stroke-opacity: 1; }
      }
      @keyframes ${unq('bd_d2')} {
        0% { opacity: 0; animation-timing-function: ease; }
        25.3333% { opacity: 0; animation-timing-function: ease; }
        28% { opacity: 1; }
        63.6667% { opacity: 1; animation-timing-function: ease; }
        66.3333% { opacity: 0; }
        100% { opacity: 0; }
      }
      .${root} .d2 .ln { ${anim('ln_d2')} }
      .${root} .d2 .body { ${anim('bd_d2')} }
      @keyframes ${unq('rl_d2')} {
        0% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        25.6667% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        28% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ease; }
        28.3333% { stroke-dashoffset: 0; stroke-opacity: 1; }
        30.3333% { stroke-dashoffset: 0; stroke-opacity: 0; }
        63.6667% { stroke-dashoffset: 0; stroke-opacity: 0; animation-timing-function: ease; }
        64.6667% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ${CB}; }
        66% { stroke-dashoffset: 1; stroke-opacity: 1; }
        100% { stroke-dashoffset: 1; stroke-opacity: 1; }
      }
      .${root} .d2 .rl { ${anim('rl_d2')} }

      @keyframes ${unq('ln_top')} {
        0% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        0.6667% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        6.6667% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ease; }
        9% { stroke-dashoffset: 0; stroke-opacity: 1; }
        11% { stroke-dashoffset: 0; stroke-opacity: 0; }
        83% { stroke-dashoffset: 0; stroke-opacity: 0; animation-timing-function: ease; }
        85% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ${CB}; }
        91% { stroke-dashoffset: 1; stroke-opacity: 1; }
        100% { stroke-dashoffset: 1; stroke-opacity: 1; }
      }
      @keyframes ${unq('bd_top')} {
        0% { opacity: 0; animation-timing-function: ease; }
        6% { opacity: 0; animation-timing-function: ease; }
        8.6667% { opacity: 1; }
        83% { opacity: 1; animation-timing-function: ease; }
        85.6667% { opacity: 0; }
        100% { opacity: 0; }
      }
      .${root} .top .ln { ${anim('ln_top')} }
      .${root} .top .body { ${anim('bd_top')} }

      @keyframes ${unq('ln_chev')} {
        0% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        7% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        12% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ease; }
        14% { stroke-dashoffset: 0; stroke-opacity: 1; }
        16% { stroke-dashoffset: 0; stroke-opacity: 0; }
        78% { stroke-dashoffset: 0; stroke-opacity: 0; animation-timing-function: ease; }
        79.6667% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ${CB}; }
        84.6667% { stroke-dashoffset: 1; stroke-opacity: 1; }
        100% { stroke-dashoffset: 1; stroke-opacity: 1; }
      }
      @keyframes ${unq('bd_chev')} {
        0% { opacity: 0; animation-timing-function: ease; }
        11% { opacity: 0; animation-timing-function: ease; }
        13.6667% { opacity: 1; }
        78% { opacity: 1; animation-timing-function: ease; }
        80.6667% { opacity: 0; }
        100% { opacity: 0; }
      }
      .${root} .chev .ln { ${anim('ln_chev')} }
      .${root} .chev .body { ${anim('bd_chev')} }

      @keyframes ${unq('ln_bub')} {
        0% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        11.6667% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        16% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ease; }
        18% { stroke-dashoffset: 0; stroke-opacity: 1; }
        20% { stroke-dashoffset: 0; stroke-opacity: 0; }
        74% { stroke-dashoffset: 0; stroke-opacity: 0; animation-timing-function: ease; }
        75.6667% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ${CB}; }
        80% { stroke-dashoffset: 1; stroke-opacity: 1; }
        100% { stroke-dashoffset: 1; stroke-opacity: 1; }
      }
      @keyframes ${unq('bd_bub')} {
        0% { opacity: 0; animation-timing-function: ease; }
        15% { opacity: 0; animation-timing-function: ease; }
        17.6667% { opacity: 1; }
        74% { opacity: 1; animation-timing-function: ease; }
        76.6667% { opacity: 0; }
        100% { opacity: 0; }
      }
      .${root} .bub .ln { ${anim('ln_bub')} }
      .${root} .bub .body { ${anim('bd_bub')} }
      @keyframes ${unq('rl_bub')} {
        0% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        15.3333% { stroke-dashoffset: 1; stroke-opacity: 1; animation-timing-function: ${CB}; }
        17.6667% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ease; }
        18% { stroke-dashoffset: 0; stroke-opacity: 1; }
        20% { stroke-dashoffset: 0; stroke-opacity: 0; }
        74% { stroke-dashoffset: 0; stroke-opacity: 0; animation-timing-function: ease; }
        75% { stroke-dashoffset: 0; stroke-opacity: 1; animation-timing-function: ${CB}; }
        76.3333% { stroke-dashoffset: 1; stroke-opacity: 1; }
        100% { stroke-dashoffset: 1; stroke-opacity: 1; }
      }
      .${root} .bub .rl { ${anim('rl_bub')} }

      @keyframes ${unq('jump')} {
        0% { transform: translateY(0) scale(1, 1); animation-timing-function: ease-in-out; }
        29.3333% { transform: translateY(0) scale(1, 1); animation-timing-function: ease-in-out; }
        30.2% { transform: translateY(1px) scale(1.18, .8); animation-timing-function: ease-in-out; }
        31.2667% { transform: translateY(-7px) scale(.86, 1.25); animation-timing-function: ease-in-out; }
        32.3667% { transform: translateY(0) scale(1.1, .9); animation-timing-function: ease-in-out; }
        33.1667% { transform: translateY(-1px) scale(.97, 1.04); animation-timing-function: ease-in-out; }
        33.6667% { transform: translateY(0) scale(1, 1); animation-timing-function: ease-in-out; }
        100% { transform: translateY(0) scale(1, 1); }
      }
      .${root} .life { transform-box: view-box; ${anim('jump')} }

      @media (prefers-reduced-motion: reduce) {
        .${root} * { animation: none !important; }
        .${root} .ln, .${root} .rl { stroke-opacity: 0; }
        .${root} .body { opacity: 1; }
      }
    `
}

export interface BrandLogoAnimatedSVGOptions {
  /** Namespace for the `id`s and `@keyframes` names inside the document. */
  ns?: string
  /** Animation cycle in seconds. Defaults to {@link BRAND_LOGO_LOOP}. */
  loop?: number
  /**
   * Negative `animation-delay` in seconds. Defaults to `-loop / 2` so the very
   * first frame is the settled logo instead of an empty one.
   */
  delay?: number
  /** width/height written on the root `<svg>`. */
  size?: number | string
}

/**
 * Builds a complete, self-contained animated SVG document — the standalone
 * counterpart to the React `BrandLogo`. Used for `public/favicon.svg`, which a
 * Vite plugin regenerates from this function so the icon can never drift away
 * from the animation it ships with.
 */
export function brandLogoAnimatedSVG(opts: BrandLogoAnimatedSVGOptions = {}): string {
  const {
    ns = 'fav',
    loop = BRAND_LOGO_LOOP,
    delay = -BRAND_LOGO_LOOP / 2,
    size = 512,
  } = opts
  const root = `bl_${ns}`
  const id = (prefix: string, key: string) => `${prefix}_${key}_${ns}`
  const css = brandLogoAnimationCSS(ns, loop, delay)

  const defs = BRAND_LOGO_SHAPES.map((s) => {
    const parts = [
      `<path id="${id('f', s.key)}" d="${s.fill}"${s.fillRule ? ` fill-rule="${s.fillRule}"` : ''}/>`,
      `<path id="${id('s', s.key)}" d="${s.stroke}" pathLength="1"/>`,
    ]
    if (s.ring) parts.push(`<path id="${id('r', s.key)}" d="${s.ring}" pathLength="1"/>`)
    return parts.join('')
  }).join('')

  const groups = BRAND_LOGO_SHAPES.map((s) => {
    const origin = s.ringOrigin ? ` style="transform-origin: ${s.ringOrigin}"` : ''
    const ring = s.ring
      ? `<g${s.ringAnimated ? ' class="life"' : ''}${origin}><use class="rl" href="#${id('r', s.key)}" xlink:href="#${id('r', s.key)}" stroke="${s.color}" stroke-width="3"/></g>`
      : ''
    return (
      `<g class="${s.key}">` +
      `<use class="body" href="#${id('f', s.key)}" xlink:href="#${id('f', s.key)}" fill="${s.color}"/>` +
      `<use class="ln" href="#${id('s', s.key)}" xlink:href="#${id('s', s.key)}" stroke="${s.color}" stroke-width="6"/>` +
      ring +
      `</g>`
    )
  }).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"` +
    ` viewBox="${BRAND_LOGO_VIEWBOX}" width="${size}" height="${size}" class="${root}"` +
    ` role="img" aria-label="EduTech logo">` +
    `<style>${css}</style><defs>${defs}</defs>${groups}</svg>`
  )
}
