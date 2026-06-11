import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  labelBn?: string
  required?: boolean
  error?: string
  isBn?: boolean
  disabled?: boolean
  min?: string
  max?: string
  className?: string
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function DatePicker({
  value,
  onChange,
  label,
  labelBn,
  required,
  error,
  isBn = false,
  disabled,
  min,
  max,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      return { year: y, month: m - 1 }
    }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      setViewDate({ year: y, month: m - 1 })
    }
  }, [value])

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month)
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month)
  const today = new Date().toISOString().split('T')[0]

  const handleDayClick = (day: number) => {
    const m = String(viewDate.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const dateStr = `${viewDate.year}-${m}-${d}`
    if (min && dateStr < min) return
    if (max && dateStr > max) return
    onChange(dateStr)
    setIsOpen(false)
  }

  const prevMonth = () => {
    setViewDate((p) => {
      if (p.month === 0) return { year: p.year - 1, month: 11 }
      return { ...p, month: p.month - 1 }
    })
  }

  const nextMonth = () => {
    setViewDate((p) => {
      if (p.month === 11) return { year: p.year + 1, month: 0 }
      return { ...p, month: p.month + 1 }
    })
  }

  const displayFormatted = value
    ? `${value.split('-')[2]}/${value.split('-')[1]}/${value.split('-')[0]}`
    : ''

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {isBn ? labelBn || label : label}
          {required && <span className="text-[var(--red)] ml-0.5">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen)
        }}
        className={`
          w-full h-[2.75rem] px-3.5 rounded-xl border
          flex items-center justify-between gap-2
          text-[0.8125rem] font-[inherit] text-left
          transition-all duration-200 ease-out
          ${disabled
            ? 'bg-[var(--bg-tertiary)] border-[var(--border)] opacity-50 cursor-not-allowed'
            : error
              ? 'bg-[var(--bg-secondary)] border-[var(--red)] hover:border-[var(--red)]'
              : isOpen
                ? 'bg-[var(--bg-secondary)] border-[var(--brand)] shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'
                : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--border-2)] hover:shadow-[var(--shadow-sm)]'
          }
        `}
      >
        <span className={value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
          {displayFormatted || (isBn ? 'তারিখ বেছে নিন' : 'Select date')}
        </span>
        <Calendar size={16} className="text-[var(--text-muted)] flex-shrink-0" />
      </button>

      {isOpen && !disabled && (
        <div
          className="
            absolute z-50 mt-1.5
            bg-[var(--bg-primary)] border border-[var(--border)]
            rounded-xl
            shadow-[0_12px_36px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)]
            p-3 w-[19rem]
            animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          {/* Header: Month/Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevMonth() }}
              className="
                w-8 h-8 rounded-lg
                flex items-center justify-center
                text-[var(--text-secondary)]
                hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]
                transition-colors duration-150
              "
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
              {isBn ? MONTHS_BN[viewDate.month] : MONTHS_EN[viewDate.month]} {viewDate.year}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextMonth() }}
              className="
                w-8 h-8 rounded-lg
                flex items-center justify-center
                text-[var(--text-secondary)]
                hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]
                transition-colors duration-150
              "
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {(isBn ? WEEKDAYS_BN : WEEKDAYS).map((day) => (
              <div
                key={day}
                className="text-center text-[0.6875rem] font-medium text-[var(--text-muted)] py-1.5"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const m = String(viewDate.month + 1).padStart(2, '0')
              const d = String(day).padStart(2, '0')
              const dateStr = `${viewDate.year}-${m}-${d}`
              const isSelected = value === dateStr
              const isToday = today === dateStr
              const isDisabled = !!((min && dateStr < min) || (max && dateStr > max))

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={(e) => { e.stopPropagation(); handleDayClick(day) }}
                  className={`
                    w-9 h-9 rounded-lg text-[0.8125rem] font-medium
                    flex items-center justify-center
                    transition-all duration-100
                    ${isSelected
                      ? 'bg-[var(--brand)] text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]'
                      : isToday
                        ? 'bg-[var(--brand-light)] text-[var(--brand)] font-semibold'
                        : isDisabled
                          ? 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const todayStr = new Date().toISOString().split('T')[0]
                if ((!min || todayStr >= min) && (!max || todayStr <= max)) {
                  onChange(todayStr)
                }
                setIsOpen(false)
              }}
              className="
                flex items-center gap-1.5
                px-3 py-1.5 rounded-lg
                text-[0.75rem] font-medium
                text-[var(--brand)] hover:bg-[var(--brand-light)]
                transition-colors duration-150
              "
            >
              {isBn ? 'আজ' : 'Today'}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false) }}
              className="
                flex items-center gap-1.5
                px-3 py-1.5 rounded-lg
                text-[0.75rem] font-medium
                text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red-light)]
                transition-colors duration-150
              "
            >
              <X size={12} />
              {isBn ? 'মুছুন' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-[0.75rem] text-[var(--red)]">{error}</p>
      )}
    </div>
  )
}
