import { BrandLogo } from './BrandLogo'

/**
 * Full-screen branded loading state used while auth/route data resolves.
 * Replaces the previous `return null` blanks with the animated brand logo.
 */
export function BrandLoadingScreen({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg-primary)' }}>
      <BrandLogo size={72} />
      <span className="text-[0.75rem] text-[var(--text-muted)]">{label || 'Loading…'}</span>
    </div>
  )
}
