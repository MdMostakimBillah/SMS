import React from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { WEEKDAYS_EN, WEEKDAYS_BN } from '@/pages/exams/step2/tabs/types'
import { MONTHS_BN, toBnNum } from '@/lib/i18n'

export interface AttendanceDayInfo {
  status: string
  label: string
  timeIn?: string
  timeOut?: string
  verification?: string
  note?: string
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

const statusMap: Record<string, { cell: string; dot: string }> = {
  present: {
    cell: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    dot: 'bg-emerald-500',
  },
  absent: {
    cell: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
    dot: 'bg-rose-500',
  },
  late: {
    cell: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
    dot: 'bg-amber-500',
  },
  leave: {
    cell: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    dot: 'bg-indigo-500',
  },
  weekend: {
    cell: 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-transparent',
    dot: 'bg-slate-400',
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
  const monthLabel = isBn
    ? `${MONTHS_BN[currentMonth.getMonth()]} ${toBnNum(currentMonth.getFullYear())}`
    : format(currentMonth, 'MMMM yyyy')

  return (
    <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
      {/* Calendar Month Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0">
            <Calendar size={16} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {monthLabel}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label={isBn ? 'আগের মাস' : 'Previous month'}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="h-8 px-3 rounded-lg text-xs font-semibold border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] cursor-pointer transition-colors"
          >
            {isBn ? 'আজ' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label={isBn ? 'পরের মাস' : 'Next month'}
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {(isBn ? WEEKDAYS_BN : WEEKDAYS_EN).map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-[var(--text-secondary)] py-1.5"
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

          const { cell: cellCls, dot: dotCls } = statusMap[info.status] || {
            cell: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]',
            dot: '',
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`min-h-[3.5rem] p-2 rounded-xl border flex flex-col justify-between text-left cursor-pointer transition-all ${
                !isCurrentMonth ? 'opacity-35' : ''
              } ${cellCls} ${
                isSelected
                  ? 'ring-2 ring-[var(--brand)] ring-offset-1 ring-offset-[var(--surface)] border-[var(--brand)]'
                  : 'hover:border-[var(--border-2)]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs tabular-nums ${isTodayDate ? 'font-bold underline' : 'font-semibold'}`}>
                  {isBn ? toBnNum(format(day, 'd')) : format(day, 'd')}
                </span>
                {dotCls && <span className={`w-2 h-2 rounded-full ${dotCls} shrink-0`} />}
              </div>
              <div className="text-[0.6875rem] truncate font-medium w-full">{info.label}</div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          {isBn ? 'উপস্থিত' : 'Present'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          {isBn ? 'অনুপস্থিত' : 'Absent'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          {isBn ? 'দেরি' : 'Late'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          {isBn ? 'অনুমোদিত ছুটি' : 'Leave'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekend'}
        </span>
      </div>
    </div>
  )
})
