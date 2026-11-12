import type { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
  variant?: 'text' | 'title' | 'circle' | 'rect'
  width?: string | number
  height?: string | number
  count?: number
}

export function Skeleton({ className = '', style, variant = 'text', width, height, count = 1 }: SkeletonProps) {
  const baseClass = 'skeleton'
  const variantClass = variant === 'circle' ? 'skeleton-circle' : ''

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${variantClass} ${className}`}
          style={{
            width: width || (variant === 'title' ? '60%' : variant === 'circle' ? '2.5rem' : variant === 'rect' ? '100%' : undefined),
            height: height || (variant === 'title' ? '1rem' : variant === 'circle' ? '2.5rem' : variant === 'rect' ? '6rem' : '0.75rem'),
            marginBottom: variant === 'text' ? '0.5rem' : variant === 'title' ? '0.75rem' : 0,
            borderRadius: variant === 'circle' ? '50%' : variant === 'rect' ? '0.75rem' : '0.375rem',
            ...style,
          }}
        />
      ))}
    </>
  )
}

export function SkeletonCard({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`skeleton-card ${className}`}>
      {children}
    </div>
  )
}

export function SkeletonLine({ width = '100%', height = '0.75rem', mb = '0.5rem' }: { width?: string; height?: string; mb?: string }) {
  return <Skeleton variant="text" width={width} height={height} style={{ marginBottom: mb }} />
}

export function SkeletonCircle({ size = '2.5rem' }: { size?: string }) {
  return <Skeleton variant="circle" width={size} height={size} />
}

export function SkeletonTable({
  rows = 6,
  columns = 5,
  className = '',
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div
      data-testid="skeleton-table"
      role="status"
      aria-label="Loading..."
      className={`w-full overflow-hidden border border-[var(--border)] rounded-[0.875rem] bg-[var(--bg-primary)] ${className}`}
    >
      {/* Table Header */}
      <div className="flex items-center gap-3 p-3.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton height="0.875rem" width={i === 0 ? '3rem' : '70%'} />
          </div>
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3 p-3.5">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="flex-1 flex items-center gap-2">
                {c === 0 && <Skeleton variant="circle" width="1.75rem" height="1.75rem" />}
                <Skeleton height="0.75rem" width={c === 0 ? '4.5rem' : c % 2 === 0 ? '80%' : '60%'} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonForm({ fields = 4, className = '' }: { fields?: number; className?: string }) {
  return (
    <div
      data-testid="skeleton-form"
      role="status"
      aria-label="Loading..."
      className={`space-y-4 p-6 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] ${className}`}
    >
      <Skeleton variant="title" width="35%" height="1.25rem" />
      <Skeleton variant="text" width="55%" height="0.75rem" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="30%" height="0.75rem" />
            <Skeleton variant="rect" width="100%" height="2.375rem" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton width="5rem" height="2rem" />
        <Skeleton width="6rem" height="2rem" />
      </div>
    </div>
  )
}

export function SkeletonDetail({ className = '' }: { className?: string }) {
  return (
    <div
      data-testid="skeleton-detail"
      role="status"
      aria-label="Loading..."
      className={`p-6 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] space-y-6 ${className}`}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" width="4rem" height="4rem" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="title" width="40%" height="1.25rem" />
          <Skeleton variant="text" width="25%" height="0.875rem" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-2">
            <Skeleton width="40%" height="0.75rem" />
            <Skeleton width="75%" height="1rem" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonCards({ count = 6, className = '' }: { count?: number; className?: string }) {
  return (
    <div
      data-testid="skeleton-cards"
      role="status"
      aria-label="Loading cards..."
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" width="2.5rem" height="2.5rem" />
            <div className="space-y-1.5 flex-1">
              <Skeleton width="60%" height="0.875rem" />
              <Skeleton width="35%" height="0.75rem" />
            </div>
          </div>
          <Skeleton width="100%" height="1.5rem" />
          <div className="flex justify-between pt-1">
            <Skeleton width="30%" height="0.75rem" />
            <Skeleton width="25%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonDoc({ className = '' }: { className?: string }) {
  return (
    <div
      data-testid="skeleton-doc"
      role="status"
      aria-label="Loading document..."
      className={`w-full h-full min-h-[26rem] p-6 bg-white rounded-lg border border-[var(--border)] space-y-4 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="space-y-2 flex-1">
          <Skeleton width="50%" height="1.25rem" />
          <Skeleton width="30%" height="0.75rem" />
        </div>
        <Skeleton variant="circle" width="2.5rem" height="2.5rem" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton width="90%" height="0.75rem" />
        <Skeleton width="75%" height="0.75rem" />
        <Skeleton width="60%" height="0.75rem" />
      </div>
      <div className="pt-4">
        <SkeletonTable rows={4} columns={4} />
      </div>
    </div>
  )
}
