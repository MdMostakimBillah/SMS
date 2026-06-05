import { memo, useCallback } from 'react'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { useWindowSize } from '@/hooks/useWindowSize'
import type { CSSProperties } from 'react'

interface WorkflowCardProps {
  icon: LucideIcon
  iconColor: string
  iconBg: string
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  stat?: string
  statBn?: string
  statColor?: string
  onClick: () => void
  badge?: string
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info'
}

const badgeStyles: Record<string, CSSProperties> = {
  success: { background: 'var(--green-light)', color: 'var(--green)' },
  warning: { background: 'var(--amber-light)', color: 'var(--amber)' },
  danger: { background: 'var(--red-light)', color: 'var(--red)' },
  info: { background: 'var(--brand-light)', color: 'var(--brand)' },
}

const WorkflowCard = memo(function WorkflowCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  titleBn: _titleBn,
  description,
  descriptionBn: _descriptionBn,
  stat,
  statBn: _statBn,
  statColor,
  onClick,
  badge,
  badgeVariant = 'info',
}: WorkflowCardProps) {
  const { isMobile } = useWindowSize()

  const handleEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = iconColor
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
    },
    [iconColor]
  )

  const handleLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
  }, [])

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.625rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        alignItems: isMobile ? 'center' : 'flex-start',
        gap: isMobile ? '12px' : '0.75rem',
        padding: isMobile ? '12px' : '1rem',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div
        style={{
          width: isMobile ? '40px' : '2.25rem',
          height: isMobile ? '40px' : '2.25rem',
          borderRadius: '0.625rem',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={isMobile ? 18 : 16} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{title}</div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: isMobile ? '0' : '0.5rem' }}>
          {description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {stat && (
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 500,
                borderRadius: '0.25rem',
                padding: '2px 6px',
                color: statColor || 'var(--text-muted)',
                background: statColor ? `${statColor}15` : 'var(--bg-secondary)',
              }}
            >
              {stat}
            </span>
          )}
          {badge && (
            <span style={{ fontSize: '0.5625rem', fontWeight: 600, padding: '2px 6px', borderRadius: '0.375rem', ...badgeStyles[badgeVariant] }}>
              {badge}
            </span>
          )}
          <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </div>
  )
})

export default WorkflowCard
