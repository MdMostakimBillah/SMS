import React from 'react'
import { ShieldCheck, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import type { AttendanceDayInfo } from './AttendanceCalendarView'

interface SelectedDateCardProps {
  selectedDay: Date
  statusInfo: AttendanceDayInfo
  isBn: boolean
}

const badgeClsMap: Record<string, string> = {
  present: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  absent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  late: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  leave: 'bg-[var(--brand-light)] text-[var(--brand)]',
  weekend: 'bg-slate-100 dark:bg-white/[0.06] text-[var(--text-secondary)]',
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
    'bg-slate-100 dark:bg-white/[0.06] text-[var(--text-primary)]'

  return (
    <div
      className="card--premium"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <div
            style={{
              width: '0.1875rem',
              height: '0.875rem',
              background: 'var(--brand)',
              borderRadius: '0.125rem',
              flexShrink: 0,
            }}
          />
          <h3
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formattedDate}
          </h3>
        </div>
        <span className={`text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-md shrink-0 ${badgeCls}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="divide-y divide-[var(--border)] text-xs">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[var(--text-secondary)]">
            {isBn ? 'প্রবেশ (In Time)' : 'In Time'}
          </span>
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {statusInfo.timeIn || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[var(--text-secondary)]">
            {isBn ? 'প্রস্থান (Out Time)' : 'Out Time'}
          </span>
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">
            {statusInfo.timeOut || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[var(--text-secondary)]">
            {isBn ? 'ডিভাইস যাচাই' : 'Verification'}
          </span>
          <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[var(--brand)] shrink-0" />
            <span>{statusInfo.verification || '—'}</span>
          </span>
        </div>

        {statusInfo.note && (
          <div className="py-2.5 text-xs text-[var(--text-secondary)] flex items-start gap-2">
            <MessageSquare size={13} className="text-[var(--brand)] shrink-0 mt-0.5" />
            <span>{statusInfo.note}</span>
          </div>
        )}
      </div>
    </div>
  )
})
