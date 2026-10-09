import { useEffect, useState } from 'react'
import { BrandLogo } from './BrandLogo'

interface Props {
  /** Institution logo URL. Missing or broken URLs fall back to the EduTech brand mark. */
  src?: string | null
  alt?: string
  /** Tailwind size classes — keep them rem-based so the tile scales with the root font-size. */
  className?: string
  /** Corner radius classes. */
  rounded?: string
}

/**
 * Square logo tile used in the sidebar brand area.
 *
 * - Institution logos are letterboxed (`object-contain`) so they are never cropped.
 * - A broken/missing URL falls back to the brand mark instead of an empty tile.
 * - The mark fills the tile instead of being a fixed px size, so it stays in
 *   proportion with the surrounding text on large displays (which scale the
 *   root font-size).
 */
export function LogoTile({ src, alt = 'Logo', className = 'w-10 h-10', rounded = 'rounded-lg' }: Props) {
  const [failed, setFailed] = useState(false)

  // A new URL (e.g. institution switch) gets a fresh chance before we mark it failed.
  useEffect(() => { setFailed(false) }, [src])

  const showImg = !!src && !failed

  return (
    <div
      className={`${className} ${rounded} shrink-0 overflow-hidden flex items-center justify-center`}
      style={{ background: 'var(--bg-secondary)' }}
    >
      {showImg ? (
        <img
          src={src as string}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <div className="w-full h-full p-1">
          <BrandLogo size="100%" title={alt} />
        </div>
      )}
    </div>
  )
}
