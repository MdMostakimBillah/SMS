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

const StepProgress = memo(function StepProgress({ steps, onStepClick }: StepProgressProps) {
  const { isMobile } = useWindowSize()

  const handleClick = useCallback((key: string) => () => onStepClick?.(key), [onStepClick])

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {steps.map((step, i) => {
          const isActive = step.status === 'current'
          const isDone = step.status === 'completed'
          return (
            <div
              key={step.key}
              onClick={handleClick(step.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                background: isActive ? 'var(--brand-light)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
                cursor: onStepClick ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  background: isDone ? 'var(--green)' : isActive ? 'var(--brand)' : 'var(--bg-secondary)',
                  color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.625rem',
                  fontWeight: 600,
                }}
              >
                {isDone ? <Check size={11} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isDone ? 'var(--green)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const isDone = step.status === 'completed'
        const isActive = step.status === 'current'
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
            <div
              onClick={handleClick(step.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '0.5rem',
                background: isActive ? 'var(--brand-light)' : 'transparent',
                cursor: onStepClick ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  background: isDone ? 'var(--green)' : isActive ? 'var(--brand)' : 'var(--bg-secondary)',
                  color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                }}
              >
                {isDone ? <Check size={10} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isDone ? 'var(--green)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  minWidth: '1rem',
                  maxWidth: '2.5rem',
                  background: isDone ? 'var(--green)' : 'var(--border)',
                  margin: '0 2px',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
})

export default StepProgress
