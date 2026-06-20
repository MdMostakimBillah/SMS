import { TrendingUp, TrendingDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  change?: string
  changeType?: 'up' | 'down'
  icon: ReactNode
  iconBg?: string
}

export default function StatCard({ label, value, change, changeType = 'up', icon, iconBg = 'var(--brand-light)' }: StatCardProps) {
  return (
    <div
      className="glass"
      style={{
        borderRadius: '0.75rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '0.625rem',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem',
          }}
        >
          {label}
        </div>
      </div>

      {/* Change */}
      {change && (
        <div
          style={{
            fontSize: '0.75rem',
            color: changeType === 'up' ? 'var(--green)' : 'var(--red)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {changeType === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {change}
        </div>
      )}
    </div>
  )
}
