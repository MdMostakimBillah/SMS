import React from 'react'
import { Clock, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'

interface SelectedDateCardProps {
  selectedDay: Date
  statusInfo: {
    status: string
    label: string
    timeIn?: string
    timeOut?: string
    verification?: string
  }
  isBn: boolean
}

export const SelectedDateCard = React.memo(function SelectedDateCard({
  selectedDay,
  statusInfo,
  isBn,
}: SelectedDateCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--brand)]" />
          <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
            {format(selectedDay, 'EEEE, MMM d, yyyy')}
          </h3>
        </div>
        <span className="text-[0.625rem] font-bold uppercase px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
          {statusInfo.label}
        </span>
      </div>

      <div className="space-y-2 text-[0.75rem]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
          <span className="text-[var(--text-secondary)]">{isBn ? 'প্রবেশ (In Time):' : 'In Time:'}</span>
          <span className="font-bold text-[var(--text-primary)]">{statusInfo.timeIn || '—'}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
          <span className="text-[var(--text-secondary)]">{isBn ? 'প্রস্থান (Out Time):' : 'Out Time:'}</span>
          <span className="font-bold text-[var(--text-primary)]">{statusInfo.timeOut || '—'}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
          <span className="text-[var(--text-secondary)]">{isBn ? 'ডিভাইস যাচাই:' : 'Verification:'}</span>
          <span className="font-medium text-[var(--text-primary)] flex items-center gap-1">
            <ShieldCheck size={13} className="text-[var(--brand)]" />
            {statusInfo.verification || (isBn ? 'আরএফআইডি কার্ড #০১' : 'RFID Smart Card')}
          </span>
        </div>
      </div>
    </div>
  )
})
