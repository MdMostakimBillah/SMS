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
  icon: Icon, iconColor, iconBg,
  title, titleBn, description, descriptionBn,
  stat, statBn, statColor, onClick, badge, badgeVariant = 'info',
}: WorkflowCardProps) {
  const { isMobile } = useWindowSize()

  const handleEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = iconColor
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
  }, [iconColor])

  const handleLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
  }, [])

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s ease',
        boxShadow: 'var(--shadow-xs)', display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        alignItems: isMobile ? 'center' : 'flex-start',
        gap: isMobile ? '12px' : '0', padding: isMobile ? '12px' : '16px',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div style={{
        width: isMobile ? '40px' : '36px', height: isMobile ? '40px' : '36px',
        borderRadius: '10px', background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={isMobile ? 18 : 16} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: isMobile ? '0' : '8px' }}>{description}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {stat && (
            <span style={{ fontSize: '10px', fontWeight: 500, borderRadius: '4px', padding: '2px 6px', color: statColor || 'var(--text-muted)', background: statColor ? `${statColor}15` : 'var(--bg-secondary)' }}>
              {stat}
            </span>
          )}
          {badge && (
            <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '6px', ...badgeStyles[badgeVariant] }}>{badge}</span>
          )}
          <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </div>
  )
})

export default WorkflowCard
