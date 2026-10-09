import { Fragment, useId } from 'react'
import { BRAND_LOGO_SHAPES, BRAND_LOGO_VIEWBOX } from '@/lib/brandLogo'

interface Props {
  /** Rendered width/height in px (or any CSS size string). */
  size?: number | string
  className?: string
  /** Disable the animation and render the settled (filled) artwork only. */
  static?: boolean
  title?: string
}

const CB = 'cubic-bezier(.65,0,.35,1)'
/** Full animation cycle in seconds — one knob to speed up / slow the whole logo. */
const LOOP = 12

/**
 * Animated EduTech brand logo.
 *
 * Fast loop, staggered per shape: each shape's outline draws on, its fill fades
 * in, everything holds, then the sequence plays in reverse (fill fades out,
 * outline undraws) before replaying. The stagger order reads top → chev → bub →
 * d2 → d1 so the logo dismantles and reassembles rather than blinking off.
 *
 * Honors `prefers-reduced-motion` (renders the filled state, no strokes).
 * Geometry lives in `@/lib/brandLogo` so PDF/print code reuses it without React.
 */
export function BrandLogo({ size = 32, className, static: isStatic = false, title }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '') || 'bl0'
  /** Unique suffix for element ids and @keyframes names alike. */
  const unq = (s: string) => `${s}_${uid}`
  const root = `bl_${uid}`

  // Scope every selector under this instance's root class so multiple logos
  // on a page can't clobber each other's keyframes or animation rules.
  const sc = (sel: string) =>
    sel
      .split(',')
      .map((s) => `.${root} ${s.trim()}`)
      .join(', ')

  const style = isStatic
    ? null
    : `
      ${sc('.ln, .rl')} { fill: none; stroke-linejoin: round; stroke-dasharray: 1 1; stroke-dashoffset: 0; }

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
      .${root} .d1 .ln { animation: ${unq('ln_d1')} ${LOOP}s linear infinite; }
      .${root} .d1 .body { animation: ${unq('bd_d1')} ${LOOP}s linear infinite; }
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
      .${root} .d1 .rl { animation: ${unq('rl_d1')} ${LOOP}s linear infinite; }

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
      .${root} .d2 .ln { animation: ${unq('ln_d2')} ${LOOP}s linear infinite; }
      .${root} .d2 .body { animation: ${unq('bd_d2')} ${LOOP}s linear infinite; }
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
      .${root} .d2 .rl { animation: ${unq('rl_d2')} ${LOOP}s linear infinite; }

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
      .${root} .top .ln { animation: ${unq('ln_top')} ${LOOP}s linear infinite; }
      .${root} .top .body { animation: ${unq('bd_top')} ${LOOP}s linear infinite; }

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
      .${root} .chev .ln { animation: ${unq('ln_chev')} ${LOOP}s linear infinite; }
      .${root} .chev .body { animation: ${unq('bd_chev')} ${LOOP}s linear infinite; }

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
      .${root} .bub .ln { animation: ${unq('ln_bub')} ${LOOP}s linear infinite; }
      .${root} .bub .body { animation: ${unq('bd_bub')} ${LOOP}s linear infinite; }
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
      .${root} .bub .rl { animation: ${unq('rl_bub')} ${LOOP}s linear infinite; }

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
      .${root} .life { transform-box: view-box; animation: ${unq('jump')} ${LOOP}s linear infinite; }

      @media (prefers-reduced-motion: reduce) {
        .${root} * { animation: none !important; }
        .${root} .ln, .${root} .rl { stroke-opacity: 0; }
        .${root} .body { opacity: 1; }
      }
    `

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={BRAND_LOGO_VIEWBOX}
      width={size}
      height={size}
      className={className ? `${className} ${root}` : root}
      role="img"
      aria-label={title || 'EduTech logo'}
    >
      {title ? <title>{title}</title> : null}
      {style ? <style>{style}</style> : null}

      <defs>
        {BRAND_LOGO_SHAPES.map((s) => (
          <Fragment key={s.key}>
            {/* stroke outline + fill body may share geometry (cap/chevron) */}
            <path id={unq(`f_${s.key}`)} d={s.fill} fillRule={s.fillRule} />
            <path id={unq(`s_${s.key}`)} d={s.stroke} pathLength={1} />
            {s.ring ? <path id={unq(`r_${s.key}`)} d={s.ring} pathLength={1} /> : null}
          </Fragment>
        ))}
      </defs>

      {BRAND_LOGO_SHAPES.map((s) => (
        <g key={s.key} className={s.key}>
          <use className="body" href={`#${unq(`f_${s.key}`)}`} xlinkHref={`#${unq(`f_${s.key}`)}`} fill={s.color} />
          {!isStatic ? (
            <>
              <use className="ln" href={`#${unq(`s_${s.key}`)}`} xlinkHref={`#${unq(`s_${s.key}`)}`} stroke={s.color} strokeWidth={6} />
              {s.ring ? (
                <g className={s.ringAnimated ? 'life' : undefined} style={{ transformOrigin: s.ringOrigin }}>
                  <use className="rl" href={`#${unq(`r_${s.key}`)}`} xlinkHref={`#${unq(`r_${s.key}`)}`} stroke={s.color} strokeWidth={3} />
                </g>
              ) : null}
            </>
          ) : null}
        </g>
      ))}
    </svg>
  )
}
