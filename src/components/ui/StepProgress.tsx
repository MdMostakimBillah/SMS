import { memo, useCallback } from 'react'
import { Check, ChevronRight, type LucideIcon } from 'lucide-react'
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
    // Group steps into pairs for 2-column layout
    const rows: Step[][] = []
    for (let i = 0; i < steps.length; i += 2) {
      rows.push(steps.slice(i, i + 2))
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {row.map((step, colIdx) => {
              const globalIdx = rowIdx * 2 + colIdx
              const isActive = step.status === 'current'
              const isDone = step.status === 'completed'
              const isOddRow = colIdx === 1
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div
                    onClick={handleClick(step.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      cursor: onStepClick ? 'pointer' : 'default',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: '1.125rem',
                        height: '1.125rem',
                        borderRadius: '50%',
                        background: isDone ? 'var(--green)' : isActive ? 'var(--brand)' : 'var(--bg-secondary)',
                        border: isDone ? 'none' : isActive ? '1.5px solid var(--brand)' : '1.5px solid var(--border)',
                        color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '0.5rem',
                        fontWeight: 600,
                        boxShadow: isActive ? '0 0 0 2px var(--brand-light)' : 'none',
                      }}
                    >
                      {isDone ? <Check size={8} /> : globalIdx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isDone ? 'var(--green)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {/* Arrow between columns */}
                  {!isOddRow && row.length > 1 && (
                    <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0, margin: '0 0.125rem' }} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '0.25rem 0' }}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const isDone = step.status === 'completed'
        const isActive = step.status === 'current'
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Circle + label side by side */}
            <div
              onClick={handleClick(step.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: onStepClick ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  background: isDone ? 'var(--green)' : isActive ? 'var(--brand)' : 'var(--surface)',
                  border: isDone ? 'none' : isActive ? '1.5px solid var(--brand)' : '1.5px solid var(--border)',
                  color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  boxShadow: isActive ? '0 0 0 3px var(--brand-light)' : 'none',
                }}
              >
                {isDone ? <Check size={9} /> : i + 1}
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
            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  width: '2rem',
                  height: '1.5px',
                  background: isDone ? 'var(--green)' : 'var(--border)',
                  margin: '0 0.375rem',
                  flexShrink: 0,
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
