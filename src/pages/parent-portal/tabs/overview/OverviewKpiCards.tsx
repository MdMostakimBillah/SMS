import React from 'react'
import {
  Clock,
  CheckCircle2,
  CreditCard,
  Award,
  BookOpen,
  TrendingUp,
} from 'lucide-react'
import type { FeeItem, HomeworkItem } from '../../types'

interface OverviewKpiCardsProps {
  fees: FeeItem[]
  homeworkList: HomeworkItem[]
  onNavigateTab: (tab: any) => void
  onOpenPayModal: () => void
  isBn: boolean
}

export const OverviewKpiCards = React.memo(function OverviewKpiCards({
  fees,
  homeworkList,
  onNavigateTab,
  onOpenPayModal,
  isBn,
}: OverviewKpiCardsProps) {
  const totalDue = fees.reduce((acc, f) => acc + f.due, 0)
  const pendingHw = homeworkList.filter((h) => h.status === 'pending').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Attendance KPI */}
      <div
        onClick={() => onNavigateTab('attendance')}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs hover:border-[var(--brand)]/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {isBn ? 'উপস্থিতি হার' : 'Monthly Attendance'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[1.5rem] font-extrabold text-[var(--text-primary)]">94.5%</span>
          <span className="text-[0.6875rem] text-emerald-600 font-semibold flex items-center gap-0.5">
            <TrendingUp size={11} /> +2.1%
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[0.6875rem] text-emerald-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isBn ? 'আজ উপস্থিত (সকাল ৮:১৪)' : 'Present Today (08:14 AM)'}</span>
        </div>
      </div>

      {/* Dues KPI */}
      <div
        onClick={() => onNavigateTab('fees')}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs hover:border-[var(--brand)]/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {isBn ? 'বকেয়া ফি' : 'Fee Dues'}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              totalDue > 0
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-emerald-500/10 text-emerald-500'
            }`}
          >
            <CreditCard size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-[1.5rem] font-extrabold ${
              totalDue > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            ৳{totalDue.toLocaleString()}
          </span>
          {totalDue > 0 && (
            <span className="text-[0.6875rem] text-amber-600 font-medium">
              {isBn ? 'পরিশোধ বাকি' : 'Pending'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 text-[0.6875rem]">
          <span className="text-[var(--text-muted)]">
            {isBn ? 'নভেম্বর বেতন' : 'Nov Tuition'}
          </span>
          {totalDue > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenPayModal()
              }}
              className="text-[var(--brand)] font-semibold hover:underline"
            >
              {isBn ? 'এখনই পে করুন →' : 'Pay Now →'}
            </button>
          )}
        </div>
      </div>

      {/* Results KPI */}
      <div
        onClick={() => onNavigateTab('academics')}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs hover:border-[var(--brand)]/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {isBn ? 'সর্বশেষ ফলাফল' : 'Latest Result'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Award size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[1.5rem] font-extrabold text-[var(--text-primary)]">GPA 5.00</span>
          <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-purple-500/10 text-purple-600">
            A+
          </span>
        </div>
        <p className="text-[0.6875rem] text-[var(--text-muted)] mt-2">
          {isBn ? '১ম সাময়িক মূল্যায়ন · মেধা স্থান: ১ম' : '1st Term Evaluation · Rank: 1st'}
        </p>
      </div>

      {/* Homework KPI */}
      <div
        onClick={() => onNavigateTab('homework')}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs hover:border-[var(--brand)]/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {isBn ? 'হোমওয়ার্ক ডায়েরি' : 'Homework Tasks'}
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <BookOpen size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[1.5rem] font-extrabold text-[var(--text-primary)]">
            {pendingHw} {isBn ? 'টি বাকি' : 'Pending'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[0.6875rem] text-blue-600 font-medium">
          <Clock size={11} />
          <span>{isBn ? 'গণিত অধ্যায় ৪ (আগামীকাল জমা)' : 'Math Ch 4 due tomorrow'}</span>
        </div>
      </div>
    </div>
  )
})
