import React from 'react'
import { FileText, Plus } from 'lucide-react'
import type { LeaveRequest } from '../../types'

interface LeaveRequestsCardProps {
  leaveRequests: LeaveRequest[]
  onOpenLeaveModal: () => void
  isBn: boolean
}

export const LeaveRequestsCard = React.memo(function LeaveRequestsCard({
  leaveRequests,
  onOpenLeaveModal,
  isBn,
}: LeaveRequestsCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[var(--brand)]" />
          <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'ছুটির আবেদন' : 'Leave Requests'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenLeaveModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 cursor-pointer border-none"
        >
          <Plus size={12} />
          {isBn ? 'নতুন আবেদন' : 'Apply'}
        </button>
      </div>

      {leaveRequests.length > 0 ? (
        <div className="space-y-2">
          {leaveRequests.map((req) => (
            <div
              key={req.id}
              className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.75rem] font-bold text-[var(--text-primary)] capitalize">
                  {req.type} Leave
                </span>
                <span className="text-[0.625rem] font-bold px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">
                  {req.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-2">
                {req.reason}
              </p>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                {req.startDate} → {req.endDate}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-[0.75rem] text-[var(--text-muted)]">
          {isBn ? 'কোনো ছুটির আবেদন করা হয়নি' : 'No leave applications'}
        </div>
      )}
    </div>
  )
})
