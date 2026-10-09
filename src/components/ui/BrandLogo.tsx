import { Fragment, useId } from 'react'
import {
  BRAND_LOGO_LOOP,
  BRAND_LOGO_SHAPES,
  BRAND_LOGO_VIEWBOX,
  brandLogoAnimationCSS,
} from '@/lib/brandLogo'

interface Props {
  /** Rendered width/height in px (or any CSS size string). */
  size?: number | string
  className?: string
  /** Disable the animation and render the settled (filled) artwork only. */
  static?: boolean
  title?: string
}

/**
 * Animated EduTech brand logo.
 *
 * The staggered draw-on / reverse-hide animation is defined once in
 * `@/lib/brandLogo` (`brandLogoAnimationCSS`); this component only picks a
 * per-instance namespace so several logos can share a page without clobbering
 * each other's keyframes.
 *
 * Honors `prefers-reduced-motion` (renders the filled state, no strokes).
 */
export function BrandLogo({ size = 32, className, static: isStatic = false, title }: Props) {
  /** Unique suffix for element ids and @keyframes names alike. */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '') || 'bl0'
  const unq = (s: string) => `${s}_${uid}`
  const root = `bl_${uid}`

  const style = isStatic ? null : brandLogoAnimationCSS(uid, BRAND_LOGO_LOOP)

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
