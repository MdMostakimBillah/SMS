import React from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { WEEKDAYS_EN, WEEKDAYS_BN } from '@/pages/exams/step2/tabs/types'

export interface AttendanceDayInfo {
  status: string
  label: string
  timeIn?: string
  timeOut?: string
  verification?: string
}

interface AttendanceCalendarViewProps {
  currentMonth: Date
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>
  calendarDays: Date[]
  selectedDay: Date
  setSelectedDay: (day: Date) => void
  getDayStatus: (day: Date) => AttendanceDayInfo
  isBn: boolean
}

const statusMap: Record<string, { bg: string; dot: string }> = {
  present: {
    bg: 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)]',
    dot: 'bg-[var(--brand)]',
  },
  absent: {
    bg: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]',
    dot: 'bg-neutral-400',
  },
  late: {
    bg: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]',
    dot: 'bg-neutral-500',
  },
  leave: {
    bg: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]',
    dot: 'bg-neutral-400',
  },
  weekend: {
    bg: 'bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] border-transparent',
    dot: '',
  },
}

export const AttendanceCalendarView = React.memo(function AttendanceCalendarView({
  currentMonth,
  setCurrentMonth,
  calendarDays,
  selectedDay,
  setSelectedDay,
  getDayStatus,
  isBn,
}: AttendanceCalendarViewProps) {
  return (
    <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
      {/* Calendar Month Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[var(--brand)]" />
          <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] cursor-pointer"
          >
            {isBn ? 'আজ' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {(isBn ? WEEKDAYS_BN : WEEKDAYS_EN).map((day) => (
          <div
            key={day}
            className="text-center text-[0.6875rem] font-semibold text-[var(--text-secondary)] py-1.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
          const isTodayDate = isToday(day)
          const isSelected = isSameDay(day, selectedDay)
          const info = getDayStatus(day)

          const { bg: bgCls, dot: dotCls } = statusMap[info.status] || {
            bg: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]',
            dot: '',
          }

          return (
            <div
              key={idx}
              onClick={() => setSelectedDay(day)}
              className={`min-h-[3.25rem] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                !isCurrentMonth ? 'opacity-30' : ''
              } ${bgCls} ${
                isSelected
                  ? 'ring-2 ring-[var(--brand)] ring-offset-1 border-[var(--brand)]'
                  : ''
              } ${isTodayDate ? 'font-bold' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.75rem] font-semibold">{format(day, 'd')}</span>
                {dotCls && <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />}
              </div>
              <div className="text-[0.5625rem] truncate font-medium">{info.label}</div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border)] text-[0.6875rem] text-[var(--text-secondary)] flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />{' '}
          {isBn ? 'উপস্থিত' : 'Present'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-400" />{' '}
          {isBn ? 'অনুপস্থিত' : 'Absent'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-500" /> {isBn ? 'দেরি' : 'Late'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-400" />{' '}
          {isBn ? 'অনুমোদিত ছুটি' : 'Leave'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-300" />{' '}
          {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekend'}
        </span>
      </div>
    </div>
  )
})
