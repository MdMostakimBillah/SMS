import React from 'react'
import { Clock, ShieldCheck, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import type { AttendanceDayInfo } from './AttendanceCalendarView'

interface SelectedDateCardProps {
  selectedDay: Date
  statusInfo: AttendanceDayInfo
  isBn: boolean
}

const badgeClsMap: Record<string, string> = {
  present: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  absent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  late: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  leave: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  weekend: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]',
}

export const SelectedDateCard = React.memo(function SelectedDateCard({
  selectedDay,
  statusInfo,
  isBn,
}: SelectedDateCardProps) {
  const formattedDate = isBn
    ? selectedDay.toLocaleDateString('bn-BD', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : format(selectedDay, 'EEEE, MMM d, yyyy')

  const badgeCls =
    badgeClsMap[statusInfo.status] ||
    'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)]'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border)] mb-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {formattedDate}
          </h3>
        </div>
        <span className={`text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${badgeCls}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
          <span className="text-[var(--text-secondary)] font-medium">
            {isBn ? 'প্রবেশ (In Time):' : 'In Time:'}
          </span>
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {statusInfo.timeIn || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
          <span className="text-[var(--text-secondary)] font-medium">
            {isBn ? 'প্রস্থান (Out Time):' : 'Out Time:'}
          </span>
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {statusInfo.timeOut || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
          <span className="text-[var(--text-secondary)] font-medium">
            {isBn ? 'ডিভাইস যাচাই:' : 'Verification:'}
          </span>
          <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--brand)] shrink-0" />
            <span>{statusInfo.verification || '—'}</span>
          </span>
        </div>

        {statusInfo.note && (
          <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
            <MessageSquare size={13} className="text-[var(--brand)] shrink-0 mt-0.5" />
            <span>{statusInfo.note}</span>
          </div>
        )}
      </div>
    </div>
  )
})
