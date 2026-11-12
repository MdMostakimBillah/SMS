import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toBnNum, MONTHS_EN, MONTHS_BN } from '@/lib/i18n'

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']

export interface AssignmentCalendarProps {
  isBn: boolean
  isMobile: boolean
  calMonth: number
  calYear: number
  selectedDate: string
  calDays: { date: string; day: number; inMonth: boolean }[]
  assignmentsWithDots: Map<string, number>
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectDate: (date: string) => void
}

export const AssignmentCalendar = React.memo(function AssignmentCalendar({
  isBn,
  isMobile,
  calMonth,
  calYear,
  selectedDate,
  calDays,
  assignmentsWithDots,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: AssignmentCalendarProps) {
  const today = new Date().toISOString().split('T')[0]
  const months = isBn ? MONTHS_BN : MONTHS_EN
  const days = isBn ? DAYS_BN : DAYS_EN

  return (
    <div
      className="glass"
      style={{
        borderRadius: '0.75rem',
        padding: isMobile ? '0.75rem' : '1rem',
        border: '1px solid var(--border)',
        height: 'fit-content',
      }}
    >
      {/* Month Navigation */}
      <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {months[calMonth]} {isBn ? toBnNum(calYear) : calYear}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            style={{
              padding: '0.25rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title={isBn ? 'পূর্ববর্তী মাস' : 'Previous month'}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            style={{
              padding: '0.25rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title={isBn ? 'পরবর্তী মাস' : 'Next month'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          textAlign: 'center',
          marginBottom: '0.375rem',
        }}
      >
        {days.map((d, i) => (
          <div
            key={i}
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: i === 5 ? 'var(--red)' : 'var(--text-muted)',
              padding: '0.25rem 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          textAlign: 'center',
        }}
      >
        {calDays.map((d, i) => {
          const isSelected = d.date === selectedDate
          const isToday = d.date === today
          const count = assignmentsWithDots.get(d.date) || 0
          return (
            <button
              type="button"
              key={i}
              onClick={() => onSelectDate(d.date)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: isMobile ? '2.25rem' : '2.5rem',
                borderRadius: '0.5rem',
                border: isSelected ? '1.5px solid var(--brand)' : isToday ? '1px dashed var(--brand)' : '1px solid transparent',
                background: isSelected
                  ? 'var(--brand-light)'
                  : isToday
                  ? 'rgba(var(--brand-rgb, 99, 102, 241), 0.05)'
                  : 'transparent',
                color: !d.inMonth
                  ? 'var(--text-muted)'
                  : isSelected
                  ? 'var(--brand)'
                  : 'var(--text-primary)',
                fontWeight: isSelected || isToday ? 600 : 400,
                fontSize: '0.75rem',
                cursor: 'pointer',
                opacity: d.inMonth ? 1 : 0.35,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{isBn ? toBnNum(d.day) : d.day}</span>
              {count > 0 && (
                <div className="flex items-center gap-0.5" style={{ marginTop: '1px' }}>
                  <span
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--brand)' : 'var(--brand)',
                      display: 'inline-block',
                    }}
                  />
                  {count > 1 && (
                    <span
                      style={{
                        fontSize: '0.5625rem',
                        lineHeight: 1,
                        color: isSelected ? 'var(--brand)' : 'var(--text-muted)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Today button */}
      <div className="flex justify-center mt-2">
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            onSelectDate(now.toISOString().split('T')[0])
          }}
          style={{
            fontSize: '0.625rem',
            fontWeight: 500,
            color: 'var(--brand)',
            background: 'var(--brand-light)',
            border: 'none',
            borderRadius: '9999px',
            padding: '2px 10px',
            cursor: 'pointer',
          }}
        >
          {isBn ? 'আজ' : 'Today'}
        </button>
      </div>
    </div>
  )
})
