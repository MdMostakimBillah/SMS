type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const styles: Record<BadgeVariant, React.CSSProperties> = {
  success: { background: 'var(--green-light)', color: 'var(--green)' },
  warning: { background: 'var(--amber-light)', color: 'var(--amber)' },
  danger: { background: 'var(--red-light)', color: 'var(--red)' },
  info: { background: 'var(--brand-light)', color: 'var(--brand)' },
  default: { background: 'var(--bg-secondary)', color: 'var(--text-secondary)' },
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '0.625rem',
        fontSize: '0.6875rem',
        fontWeight: 500,
        ...styles[variant],
      }}
    >
      {children}
    </span>
  )
}
