import React from 'react'
import {
  CheckCircle2,
  CreditCard,
  Award,
  BookOpen,
  Clock,
  Check,
} from 'lucide-react'
import type { FeeItem, HomeworkItem, PortalChild } from '../../types'
import { getChildAttendanceStats, getChildExamResults } from '../../utils/dataMappers'

interface OverviewKpiCardsProps {
  child: PortalChild
  fees: FeeItem[]
  homeworkList: HomeworkItem[]
  onNavigateTab: (tab: any) => void
  onOpenPayModal: () => void
  isBn: boolean
}

export const OverviewKpiCards = React.memo(function OverviewKpiCards({
  child,
  fees,
  homeworkList,
  onNavigateTab,
  onOpenPayModal,
  isBn,
}: OverviewKpiCardsProps) {
  const totalDue = fees.reduce((acc, f) => acc + f.due, 0)
  const hasPendingFee = fees.some((f) => f.status === 'pending')
  const pendingHw = homeworkList.filter((h) => h.status === 'pending').length
  const attendanceStats = getChildAttendanceStats(child.id, new Date())
  const examResults = getChildExamResults(child)
  const avgGpa =
    examResults.length > 0
      ? (examResults.reduce((acc, r) => acc + (r.point || 0), 0) / examResults.length).toFixed(2)
      : null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Monthly Attendance (Emerald Accent) */}
      <div
        onClick={() => onNavigateTab('attendance')}
        className="flex items-center gap-3 p-[0.875rem_1rem] rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-xs cursor-pointer hover:border-emerald-500/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <CheckCircle2 size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="text-[1.125rem] font-bold leading-tight text-[var(--text-primary)]">
              {attendanceStats.attendanceRate}
            </div>
            <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              {isBn ? 'চলতি মাস' : 'This Month'}
            </span>
          </div>
          <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5 truncate">
            {isBn ? 'মাসিক উপস্থিতি হার' : 'Monthly Attendance'}
          </div>
        </div>
      </div>

      {/* 2. Fee Dues / Pay Online (Inverted Accent Card - Dark with white text in light mode, White with black text in dark mode like Student Management) */}
      <div
        onClick={() => {
          if (totalDue > 0 && !hasPendingFee) onOpenPayModal()
          else onNavigateTab('fees')
        }}
        className="flex items-center gap-3 p-[0.875rem_1rem] rounded-[0.625rem] border border-transparent cursor-pointer transition-colors"
        style={{
          background: 'var(--highlight-bg)',
          color: 'var(--highlight-fg)',
          boxShadow: 'var(--highlight-shadow)',
        }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 text-white border border-white/10 dark:bg-black/5 dark:text-black dark:border-black/10 shrink-0">
          <CreditCard size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div
              className="text-[1.125rem] font-bold leading-tight tracking-tight"
              style={{ color: 'var(--highlight-fg)' }}
            >
              {totalDue > 0 ? `৳${totalDue.toLocaleString()}` : isBn ? '৳০' : '৳0'}
            </div>
            {hasPendingFee ? (
              <span className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 flex items-center gap-1 shrink-0 animate-pulse">
                <Clock size={9} />
                {isBn ? 'যাচাই' : 'Pending'}
              </span>
            ) : totalDue > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenPayModal()
                }}
                className="text-[0.625rem] font-bold px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 cursor-pointer border-none shadow-2xs transition-colors shrink-0"
              >
                {isBn ? 'পরিশোধ' : 'Pay'}
              </button>
            ) : (
              <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 dark:bg-emerald-100 dark:text-emerald-800 flex items-center gap-1 shrink-0">
                <Check size={9} />
                {isBn ? 'পরিশোধিত' : 'Paid'}
              </span>
            )}
          </div>
          <div
            className="text-[0.6875rem] mt-0.5 truncate"
            style={{ color: 'var(--highlight-fg-muted)' }}
          >
            {isBn ? 'ফি ও অনলাইন পেমেন্ট' : 'Fees & Online Pay'}
          </div>
        </div>
      </div>

      {/* 3. Academic Result (Indigo Accent) */}
      <div
        onClick={() => onNavigateTab('academics')}
        className="flex items-center gap-3 p-[0.875rem_1rem] rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-xs cursor-pointer hover:border-indigo-500/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
          <Award size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="text-[1.125rem] font-bold leading-tight text-[var(--text-primary)]">
              {avgGpa ? `GPA ${avgGpa}` : '—'}
            </div>
            <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              {avgGpa ? (isBn ? 'মূল্যায়িত' : 'Evaluated') : isBn ? 'ফলাফল নেই' : 'No result'}
            </span>
          </div>
          <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5 truncate">
            {isBn ? 'একাডেমিক ফলাফল' : 'Academic Evaluation'}
          </div>
        </div>
      </div>

      {/* 4. Homework & Tasks (Purple Accent) */}
      <div
        onClick={() => onNavigateTab('homework')}
        className="flex items-center gap-3 p-[0.875rem_1rem] rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-xs cursor-pointer hover:border-purple-500/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
          <BookOpen size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="text-[1.125rem] font-bold leading-tight text-[var(--text-primary)]">
              {pendingHw} {isBn ? 'টি' : 'Tasks'}
            </div>
            <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              {isBn ? 'আজ জমা' : 'Due Today'}
            </span>
          </div>
          <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5 truncate">
            {isBn ? 'বাকি হোমওয়ার্ক' : 'Pending Homework'}
          </div>
        </div>
      </div>
    </div>
  )
})
