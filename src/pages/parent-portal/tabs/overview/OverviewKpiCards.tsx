import React from 'react'
import {
  CheckCircle2,
  CreditCard,
  Award,
  BookOpen,
  ArrowUpRight,
  Clock,
  Check,
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
  const hasPendingFee = fees.some((f) => f.status === 'pending')
  const pendingHw = homeworkList.filter((h) => h.status === 'pending').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Monthly Attendance (Emerald Accent) */}
      <div
        onClick={() => onNavigateTab('attendance')}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={17} />
          </div>
          <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {isBn ? 'নিয়মিত' : 'Regular'}
          </span>
        </div>
        <div className="mt-3">
          <div className="text-xl font-extrabold text-[var(--text-primary)] leading-tight">94.5%</div>
          <div className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mt-0.5">
            {isBn ? 'মাসিক উপস্থিতি হার' : 'Monthly Attendance'}
          </div>
        </div>
      </div>

      {/* 2. Fee Dues / Pay Online (THE INVERTED DARK ACCENT CARD - Like Teacher Management Quick Action) */}
      <div
        onClick={() => {
          if (totalDue > 0 && !hasPendingFee) onOpenPayModal()
          else onNavigateTab('fees')
        }}
        className="rounded-xl p-3.5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
        style={{
          background: 'var(--highlight-bg)',
          color: 'var(--highlight-fg)',
        }}
      >
        {/* Subtle Decorative Gradient Sheen */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.04] rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 text-amber-400 border border-white/10">
            <CreditCard size={17} />
          </div>
          {hasPendingFee ? (
            <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/30 flex items-center gap-1 animate-pulse">
              <Clock size={10} />
              {isBn ? 'যাচাই অপেক্ষমাণ' : 'Verification Pending'}
            </span>
          ) : totalDue > 0 ? (
            <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/20">
              {isBn ? 'বকেয়া ফি' : 'Fee Due'}
            </span>
          ) : (
            <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 flex items-center gap-1">
              <Check size={10} />
              {isBn ? 'পরিশোধিত' : 'All Paid'}
            </span>
          )}
        </div>

        <div className="mt-3 relative z-10">
          <div className="flex items-baseline justify-between gap-1">
            <div className="text-xl font-black text-white leading-tight tracking-tight">
              {totalDue > 0 ? `৳${totalDue.toLocaleString()}` : isBn ? '৳০ (পরিশোধিত)' : '৳0 (Clear)'}
            </div>
            <ArrowUpRight size={15} className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
          <div className="text-[0.6875rem] font-medium text-white/70 mt-0.5 flex items-center justify-between">
            <span>{isBn ? 'ফি ও অনলাইন পেমেন্ট' : 'Fees & Online Pay'}</span>
            {totalDue > 0 && !hasPendingFee && (
              <span className="text-[0.625rem] font-bold text-amber-300 underline underline-offset-2">
                {isBn ? 'এখন পরিশোধ' : 'Pay Now'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Academic Result (Indigo / Brand Accent) */}
      <div
        onClick={() => onNavigateTab('academics')}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Award size={17} />
          </div>
          <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            {isBn ? 'শীর্ষ ৫%' : 'Top 5%'}
          </span>
        </div>
        <div className="mt-3">
          <div className="text-xl font-extrabold text-[var(--text-primary)] leading-tight">GPA 5.00</div>
          <div className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mt-0.5">
            {isBn ? '১ম সাময়িক মূল্যায়ন' : '1st Term Result'}
          </div>
        </div>
      </div>

      {/* 4. Homework & Tasks (Purple Accent) */}
      <div
        onClick={() => onNavigateTab('homework')}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <BookOpen size={17} />
          </div>
          <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            {isBn ? 'আজ জমা' : 'Due Today'}
          </span>
        </div>
        <div className="mt-3">
          <div className="text-xl font-extrabold text-[var(--text-primary)] leading-tight">
            {pendingHw} {isBn ? 'টি' : 'Tasks'}
          </div>
          <div className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mt-0.5">
            {isBn ? 'বাকি হোমওয়ার্ক' : 'Pending Homework'}
          </div>
        </div>
      </div>
    </div>
  )
})
