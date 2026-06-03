import { memo, useCallback } from 'react'
import { Check, type LucideIcon } from 'lucide-react'
import { useWindowSize } from '@/hooks/useWindowSize'

export interface Step {
  key: string
  label: string
  labelBn: string
  icon: LucideIcon
  status: 'completed' | 'current' | 'upcoming'
}

interface StepProgressProps {
  steps: Step[]
  onStepClick?: (key: string) => void
}

const statusColors = {
  completed: { bg: 'var(--green)', text: '#fff', border: 'var(--green)' },
  current: { bg: 'var(--brand)', text: '#fff', border: 'var(--brand)' },
  upcoming: { bg: 'var(--bg-secondary)', text: 'var(--text-muted)', border: 'var(--border)' },
}

const connectorBase: React.CSSProperties = {
  flex: 1,
  height: '2px',
  minWidth: '20px',
  maxWidth: '60px',
  borderRadius: '1px',
  margin: '0 4px',
}

const StepProgress = memo(function StepProgress({ steps, onStepClick }: StepProgressProps) {
  const { isMobile } = useWindowSize()

  const handleClick = useCallback((key: string) => () => onStepClick?.(key), [onStepClick])

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {steps.map((step, i) => {
          const colors = statusColors[step.status]
          return (
            <div
              key={step.key}
              onClick={handleClick(step.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: step.status === 'current' ? 'var(--brand-light)' : 'var(--surface)',
                border: `1px solid ${step.status === 'current' ? 'rgba(99,102,241,0.2)' : 'var(--border)'}`,
                cursor: onStepClick ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: colors.bg,
                  color: colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {step.status === 'completed' ? <Check size={13} /> : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: step.status === 'current' ? 600 : 500,
                    color: step.status === 'upcoming' ? 'var(--text-muted)' : 'var(--text-primary)',
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {step.status === 'completed' ? 'Completed' : step.status === 'current' ? 'In Progress' : 'Pending'}
                </div>
              </div>
              {step.status === 'current' && (
                <div
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)', animation: 'pulse 2s infinite' }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
      {steps.map((step, i) => {
        const Icon = step.icon
        const colors = statusColors[step.status]
        const isLast = i === steps.length - 1
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
            <div
              onClick={handleClick(step.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: step.status === 'current' ? 'var(--brand-light)' : 'transparent',
                border: `1px solid ${step.status === 'current' ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                cursor: onStepClick ? 'pointer' : 'default',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (step.status === 'upcoming' && onStepClick) e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={(e) => {
                if (step.status !== 'current') e.currentTarget.style.background = 'transparent'
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: colors.bg,
                  color: colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '10px',
                  fontWeight: 600,
                  boxShadow:
                    step.status !== 'upcoming'
                      ? `0 0 0 3px ${step.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)'}`
                      : 'none',
                }}
              >
                {step.status === 'completed' ? <Check size={12} /> : <Icon size={12} />}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: step.status === 'current' ? 600 : 500,
                    color: step.status === 'upcoming' ? 'var(--text-muted)' : 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  {step.status === 'completed' ? 'Done' : step.status === 'current' ? 'Active' : 'Pending'}
                </div>
              </div>
            </div>
            {!isLast && <div style={{ ...connectorBase, background: step.status === 'completed' ? 'var(--green)' : 'var(--border)' }} />}
          </div>
        )
      })}
    </div>
  )
})

export default StepProgress
