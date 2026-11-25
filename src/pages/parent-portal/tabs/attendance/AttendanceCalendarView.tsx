import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    cell: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  absent: {
    cell: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    dot: 'bg-rose-500',
  },
  late: {
    cell: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  leave: {
    cell: 'bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand)]/20',
    dot: 'bg-[var(--brand)]',
  },
  weekend: {
    cell: 'bg-slate-50/80 dark:bg-white/[0.02] text-[var(--text-muted)] border-transparent',
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
    <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      {/* Calendar Month Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label={isBn ? 'আগের মাস' : 'Previous month'}
            className="w-8 h-8 rounded-lg border-none bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="h-8 px-3 rounded-lg text-xs font-medium border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-slate-100/70 dark:hover:bg-white/[0.05] cursor-pointer transition-colors"
          >
            {isBn ? 'আজ' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label={isBn ? 'পরের মাস' : 'Next month'}
            className="w-8 h-8 rounded-lg border-none bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center cursor-pointer transition-colors"
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
            className="text-center text-[0.6875rem] font-medium text-[var(--text-muted)] py-1"
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
            cell: 'bg-slate-50/40 dark:bg-white/[0.015] text-[var(--text-secondary)] border-transparent',
            dot: '',
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`min-h-[3.25rem] p-2 rounded-xl border flex flex-col justify-between text-left cursor-pointer transition-all ${
                !isCurrentMonth ? 'opacity-30' : ''
              } ${cellCls} ${
                isSelected
                  ? 'ring-2 ring-[var(--brand)] ring-offset-1 ring-offset-[var(--surface)]'
                  : 'hover:brightness-95 dark:hover:brightness-110'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs tabular-nums ${isTodayDate ? 'font-bold underline' : 'font-medium'}`}>
                  {isBn ? toBnNum(format(day, 'd')) : format(day, 'd')}
                </span>
                {dotCls && <span className={`w-1.5 h-1.5 rounded-full ${dotCls} shrink-0`} />}
              </div>
              <div className="text-[0.6875rem] truncate font-medium w-full">{info.label}</div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-[var(--border)] text-xs text-[var(--text-secondary)] flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {isBn ? 'উপস্থিত' : 'Present'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          {isBn ? 'অনুপস্থিত' : 'Absent'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {isBn ? 'দেরি' : 'Late'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
          {isBn ? 'অনুমোদিত ছুটি' : 'Leave'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekend'}
        </span>
      </div>
    </div>
  )
})
