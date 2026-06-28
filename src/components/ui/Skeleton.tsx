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
