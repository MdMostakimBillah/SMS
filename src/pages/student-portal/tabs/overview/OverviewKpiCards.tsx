import React from 'react'
import {
  CalendarCheck,
  BookOpen,
  Calendar,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import type { StudentDayRoutine } from '../../types'

interface OverviewKpiCardsProps {
  attendanceRate: string
  todayRoutine?: StudentDayRoutine
  pendingHomeworkCount: number
  totalDue: number
  onNavigateTab: (tab: any) => void
  isBn: boolean
}

export const OverviewKpiCards = React.memo(function OverviewKpiCards({
  attendanceRate,
  todayRoutine,
  pendingHomeworkCount,
  totalDue,
  onNavigateTab,
  isBn,
}: OverviewKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Attendance */}
      <div
        onClick={() => onNavigateTab('attendance')}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 cursor-pointer hover:border-[var(--brand)] transition-colors shadow-2xs"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {isBn ? 'উপস্থিতির হার' : 'Attendance Rate'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CalendarCheck size={16} />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{attendanceRate}</div>
        <p className="text-[0.6875rem] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
          <CheckCircle2 size={12} />
          <span>{isBn ? 'নিয়মিত উপস্থিতি' : 'Active Attendance'}</span>
        </p>
      </div>

      {/* Today's Classes */}
      <div
        onClick={() => onNavigateTab('routine')}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 cursor-pointer hover:border-[var(--brand)] transition-colors shadow-2xs"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {isBn ? 'আজকের ক্লাস' : "Today's Classes"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Calendar size={16} />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          {todayRoutine?.isWeekend ? (isBn ? 'ছুটি' : 'Holiday') : todayRoutine?.periods?.length || 0}
        </div>
        <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-1 truncate">
          {todayRoutine?.isWeekend
            ? (isBn ? 'আজ সাপ্তাহিক ছুটি' : 'Weekly Holiday')
            : `${isBn ? todayRoutine?.dayNameBn : todayRoutine?.dayNameEn} • ${isBn ? 'রুটিন দেখুন' : 'View Timetable'}`}
        </p>
      </div>

      {/* Pending Homework */}
      <div
        onClick={() => onNavigateTab('homework')}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 cursor-pointer hover:border-[var(--brand)] transition-colors shadow-2xs"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {isBn ? 'বাকি হোমওয়ার্ক' : 'Pending Tasks'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BookOpen size={16} />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          {pendingHomeworkCount}
        </div>
        <p className="text-[0.6875rem] text-amber-600 dark:text-amber-400 mt-1 font-medium">
          {pendingHomeworkCount > 0
            ? (isBn ? 'জমা দেওয়া বাকি' : 'Needs Submission')
            : (isBn ? 'সব কাজ সম্পন্ন' : 'All Tasks Done')}
        </p>
      </div>

      {/* Due Fees */}
      <div
        onClick={() => onNavigateTab('fees')}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 cursor-pointer hover:border-amber-500/40 transition-colors shadow-2xs"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {isBn ? 'মোট বকেয়া ফি' : 'Outstanding Fees'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CreditCard size={16} />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          ৳{totalDue.toLocaleString()}
        </div>
        <p className="text-[0.6875rem] text-amber-600 dark:text-amber-400 mt-1 font-medium truncate">
          {totalDue > 0 ? (isBn ? 'অনলাইন পেমেন্ট করুন' : 'Pay Online Now') : (isBn ? 'কোনো বকেয়া নেই' : 'Clear Balance')}
        </p>
      </div>
    </div>
  )
})
