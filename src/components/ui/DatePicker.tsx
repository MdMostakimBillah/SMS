import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

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
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']

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
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-[0.375rem] block">
            {isBn ? labelBn : label}
            {required && <span className="text-[var(--red)] ml-[0.1875rem]">*</span>}
          </label>
        )}

        <div
          className={`
            w-full h-[2.5rem] px-3.5 rounded-[0.5625rem] border transition-colors
            bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem]
            flex items-center justify-between cursor-pointer
            ${disabled
              ? 'border-[var(--border)] opacity-50 cursor-not-allowed'
              : 'border-[var(--border)] focus-within:border-[var(--brand)] hover:border-[var(--border-2)]'
            }
            ${error ? 'border-[var(--red)] focus-within:border-[var(--red)]' : ''}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
            {displayFormatted || (isBn ? 'তারিখ বেছে নিন' : 'Select date')}
          </span>
          <Calendar size={16} className="text-[var(--text-muted)]" />
        </div>

        {isOpen && !disabled && (
          <div
            className="absolute z-50 mt-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.5625rem] shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-3 w-[18rem]"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prevMonth() }}
                className="w-7 h-7 rounded-[0.375rem] border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--brand-light)] hover:border-[var(--brand)] transition-colors"
              >
                <ChevronLeft size={14} className="text-[var(--text-secondary)]" />
              </button>
              <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {isBn ? MONTHS_BN[viewDate.month] : MONTHS_EN[viewDate.month]} {viewDate.year}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); nextMonth() }}
                className="w-7 h-7 rounded-[0.375rem] border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--brand-light)] hover:border-[var(--brand)] transition-colors"
              >
                <ChevronRight size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {(isBn ? WEEKDAYS_BN : WEEKDAYS).map((day) => (
                <div key={day} className="text-center text-[0.625rem] font-medium text-[var(--text-muted)] py-1">
                  {day}
                </div>
              ))}
            </div>

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
                const isDisabled = !!((min && dateStr < min) || (max && dateStr > max))
                const isToday = new Date().toISOString().split('T')[0] === dateStr

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={(e) => { e.stopPropagation(); handleDayClick(day) }}
                    className={`
                      w-8 h-8 rounded-[0.375rem] text-[0.75rem] font-medium cursor-pointer transition-colors
                      flex items-center justify-center
                      ${isSelected
                        ? 'bg-[var(--brand)] text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]'
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

            <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-end">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false) }}
                className="px-2 py-1 text-[0.6875rem] text-[var(--text-muted)] hover:text-[var(--red)] transition-colors cursor-pointer"
              >
                {isBn ? 'মুছুন' : 'Clear'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const today = new Date().toISOString().split('T')[0]
                  if ((!min || today >= min) && (!max || today <= max)) {
                    onChange(today)
                  }
                  setIsOpen(false)
                }}
                className="px-2 py-1 text-[0.6875rem] text-[var(--brand)] hover:bg-[var(--brand-light)] rounded transition-colors cursor-pointer ml-1"
              >
                {isBn ? 'আজ' : 'Today'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-1 text-[0.6875rem] text-[var(--red)]">{error}</p>}
      </div>
    )
  }