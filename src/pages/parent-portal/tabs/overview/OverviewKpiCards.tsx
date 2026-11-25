import React, { useMemo } from 'react'
import {
  CheckCircle2,
  CreditCard,
  Award,
  BookOpen,
  Clock,
  Check,
} from 'lucide-react'
import type { FeeItem, HomeworkItem, PortalChild, ExamResultItem, PortalTab } from '../../types'
import { getChildAttendanceStats } from '../../utils/dataMappers'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useClassStore } from '@/store/classStore'

interface OverviewKpiCardsProps {
  child: PortalChild
  fees: FeeItem[]
  homeworkList: HomeworkItem[]
  results: ExamResultItem[]
  onNavigateTab: (tab: PortalTab) => void
  onOpenPayModal: () => void
  isBn: boolean
}

export const OverviewKpiCards = React.memo(function OverviewKpiCards({
  child,
  fees,
  homeworkList,
  results,
  onNavigateTab,
  onOpenPayModal,
  isBn,
}: OverviewKpiCardsProps) {
  const attendance = useAttendanceStore((s) => s.attendance)
  const classes = useClassStore((s) => s.classes)
  const routines = useClassStore((s) => s.routines)

  const totalDue = useMemo(() => fees.reduce((acc, f) => acc + f.due, 0), [fees])
  const hasPendingFee = useMemo(() => fees.some((f) => f.status === 'pending'), [fees])
  const pendingHw = useMemo(
    () => homeworkList.filter((h) => h.status === 'pending').length,
    [homeworkList]
  )

  const attendanceStats = useMemo(() => {
    void attendance
    void classes
    void routines
    return getChildAttendanceStats(child.id, new Date(), child.class, child.section)
  }, [child.id, child.class, child.section, attendance, classes, routines])

  const hasFailed = useMemo(() => results.some((r) => r.status === 'failed'), [results])
  const avgGpa = useMemo(() => {
    if (results.length === 0) return null
    if (hasFailed) return '0.00'
    return (results.reduce((acc, r) => acc + (r.point || 0), 0) / results.length).toFixed(2)
  }, [results, hasFailed])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Monthly Attendance */}
      <div
        onClick={() => onNavigateTab('attendance')}
        className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs cursor-pointer hover:border-emerald-500/40 transition-colors min-w-0"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
          <CheckCircle2 size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="text-lg sm:text-xl font-bold leading-tight text-[var(--text-primary)] tabular-nums">
              {attendanceStats.attendanceRate}
            </div>
            <span className="text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              {isBn ? 'চলতি মাস' : 'This Month'}
            </span>
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] mt-1 truncate">
            {isBn ? 'উপস্থিতি হার' : 'Monthly Attendance'}
          </div>
        </div>
      </div>

      {/* 2. Fee Dues / Pay Online */}
      <div
        onClick={() => {
          if (totalDue > 0 && !hasPendingFee) onOpenPayModal()
          else onNavigateTab('fees')
        }}
        className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs cursor-pointer hover:border-amber-500/40 transition-colors min-w-0"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <CreditCard size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="text-lg sm:text-xl font-bold leading-tight text-[var(--text-primary)] tabular-nums">
              {totalDue > 0 ? `৳${totalDue.toLocaleString()}` : isBn ? '৳০' : '৳0'}
            </div>
            {hasPendingFee ? (
              <span className="text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center gap-1 shrink-0">
                <Clock size={11} />
                {isBn ? 'যাচাইাধীন' : 'Pending'}
              </span>
            ) : totalDue > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenPayModal()
                }}
                className="text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white cursor-pointer border-none transition-colors shrink-0"
              >
                {isBn ? 'পরিশোধ' : 'Pay'}
              </button>
            ) : (
              <span className="text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                <Check size={11} />
                {isBn ? 'পরিশোধিত' : 'Paid'}
              </span>
            )}
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] mt-1 truncate">
            {isBn ? 'ফি ও পেমেন্ট' : 'Fees & Pay'}
          </div>
        </div>
      </div>

      {/* 3. Academic Result */}
      <div
        onClick={() => onNavigateTab('academics')}
        className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs cursor-pointer hover:border-indigo-500/40 transition-colors min-w-0"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
          <Award size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="text-lg sm:text-xl font-bold leading-tight text-[var(--text-primary)] tabular-nums">
              {avgGpa ? `GPA ${avgGpa}` : '—'}
            </div>
            <span
              className={`text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                !avgGpa
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]'
                  : hasFailed
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
              }`}
            >
              {!avgGpa
                ? isBn ? 'ফলাফল নেই' : 'No result'
                : hasFailed
                ? isBn ? 'অকৃতকার্য' : 'Failed'
                : isBn ? 'মূল্যায়িত' : 'Evaluated'}
            </span>
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] mt-1 truncate">
            {isBn ? 'ফলাফল' : 'Academic Evaluation'}
          </div>
        </div>
      </div>

      {/* 4. Homework & Tasks */}
      <div
        onClick={() => onNavigateTab('homework')}
        className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs cursor-pointer hover:border-purple-500/40 transition-colors min-w-0"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
          <BookOpen size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="text-lg sm:text-xl font-bold leading-tight text-[var(--text-primary)] tabular-nums">
              {pendingHw} {isBn ? 'টি' : 'Tasks'}
            </div>
            <span
              className={`text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                pendingHw > 0
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}
            >
              {pendingHw > 0
                ? isBn ? 'বাকি আছে' : 'Pending'
                : isBn ? 'সম্পন্ন' : 'All Done'}
            </span>
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)] mt-1 truncate">
            {isBn ? 'বাকি কাজ' : 'Pending Homework'}
          </div>
        </div>
      </div>
    </div>
  )
})
