import React, { useMemo } from 'react'
import {
  CheckCircle2,
  CreditCard,
  Award,
  BookOpen,
  ArrowRight,
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Monthly Attendance */}
      <div
        onClick={() => onNavigateTab('attendance')}
        className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/30 hover:shadow-xs transition-all cursor-pointer min-w-0"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
            {isBn ? 'উপস্থিতি হার' : 'Monthly Attendance'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <CheckCircle2 size={14} />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums mt-3 leading-none">
          {attendanceStats.attendanceRate}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-2.5">
          <span className="truncate">{isBn ? 'চলতি মাস' : 'This Month'}</span>
        </div>
      </div>

      {/* 2. Fee Dues / Pay Online */}
      <div
        onClick={() => {
          if (totalDue > 0 && !hasPendingFee) onOpenPayModal()
          else onNavigateTab('fees')
        }}
        className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/30 hover:shadow-xs transition-all cursor-pointer min-w-0"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
            {isBn ? 'ফি ও বকেয়া' : 'Fees & Dues'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <CreditCard size={14} />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums mt-3 leading-none">
          {totalDue > 0 ? `৳${totalDue.toLocaleString()}` : isBn ? '৳০' : '৳0'}
        </div>
        <div className="flex items-center justify-between gap-2 mt-2.5 text-xs">
          {hasPendingFee ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {isBn ? 'যাচাইাধীন' : 'Pending verification'}
            </span>
          ) : totalDue > 0 ? (
            <>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {isBn ? 'বকেয়া রয়েছে' : 'Due balance'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenPayModal()
                }}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--brand)] hover:underline bg-transparent border-none p-0 cursor-pointer shrink-0"
              >
                <span>{isBn ? 'পরিশোধ' : 'Pay'}</span>
                <ArrowRight size={12} />
              </button>
            </>
          ) : (
            <span className="text-[var(--text-muted)]">
              {isBn ? 'পরিশোধিত' : 'Paid'}
            </span>
          )}
        </div>
      </div>

      {/* 3. Academic Result */}
      <div
        onClick={() => onNavigateTab('academics')}
        className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/30 hover:shadow-xs transition-all cursor-pointer min-w-0"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
            {isBn ? 'একাডেমিক ফলাফল' : 'Academic Evaluation'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Award size={14} />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums mt-3 leading-none">
          {avgGpa ? `GPA ${avgGpa}` : '—'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-2.5">
          <span
            className={
              hasFailed ? 'text-rose-600 dark:text-rose-400 font-medium' : undefined
            }
          >
            {!avgGpa
              ? isBn ? 'ফলাফল নেই' : 'No result'
              : hasFailed
              ? isBn ? 'অকৃতকার্য' : 'Failed'
              : isBn ? 'মূল্যায়িত' : 'Evaluated'}
          </span>
        </div>
      </div>

      {/* 4. Homework & Tasks */}
      <div
        onClick={() => onNavigateTab('homework')}
        className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/30 hover:shadow-xs transition-all cursor-pointer min-w-0"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
            {isBn ? 'বাকি হোমওয়ার্ক' : 'Pending Homework'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <BookOpen size={14} />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums mt-3 leading-none">
          {pendingHw} {isBn ? 'টি' : 'Tasks'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-2.5">
          <span className="truncate">
            {pendingHw > 0
              ? isBn ? 'সম্পন্ন বাকি' : 'Pending review'
              : isBn ? 'সব সম্পন্ন' : 'All Done'}
          </span>
        </div>
      </div>
    </div>
  )
})
