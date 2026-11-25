import React from 'react'
import { FileText, Plus, Check, X, Trash2 } from 'lucide-react'
import type { LeaveRequest } from '../../types'

interface LeaveRequestsCardProps {
  leaveRequests: LeaveRequest[]
  onOpenLeaveModal: () => void
  onUpdateLeaveStatus?: (leaveId: string, status: 'approved' | 'rejected') => void
  onCancelLeave?: (leaveId: string) => void
  isBn: boolean
}

const LEAVE_TYPE_LABELS: Record<LeaveRequest['type'], { en: string; bn: string }> = {
  sick: { en: 'Sick / Medical Leave', bn: 'অসুস্থতাজনিত ছুটি' },
  casual: { en: 'Casual Leave', bn: 'নৈমিত্তিক ছুটি' },
  family: { en: 'Family Leave', bn: 'পারিবারিক ছুটি' },
  other: { en: 'Other Leave', bn: 'অন্যান্য ছুটি' },
}

const STATUS_BADGE: Record<LeaveRequest['status'], { en: string; bn: string; cls: string }> = {
  pending: {
    en: 'Pending',
    bn: 'অপেক্ষমাণ',
    cls: 'text-amber-600 dark:text-amber-400',
  },
  approved: {
    en: 'Approved',
    bn: 'অনুমোদিত',
    cls: 'text-emerald-600 dark:text-emerald-400',
  },
  rejected: {
    en: 'Rejected',
    bn: 'বাতিল',
    cls: 'text-rose-600 dark:text-rose-400',
  },
}

export const LeaveRequestsCard = React.memo(function LeaveRequestsCard({
  leaveRequests,
  onOpenLeaveModal,
  onUpdateLeaveStatus,
  onCancelLeave,
  isBn,
}: LeaveRequestsCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {isBn ? 'ছুটির আবেদন' : 'Leave Requests'}
        </h3>
        <button
          type="button"
          onClick={onOpenLeaveModal}
          className="h-8 flex items-center gap-1 px-3 rounded-lg text-xs font-semibold bg-[var(--brand)] hover:opacity-90 text-white cursor-pointer border-none transition-opacity shadow-xs"
        >
          <Plus size={13} />
          <span>{isBn ? 'নতুন আবেদন' : 'Apply'}</span>
        </button>
      </div>

      {leaveRequests.length > 0 ? (
        <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
          {leaveRequests.map((req) => {
            const typeLabel = LEAVE_TYPE_LABELS[req.type] || LEAVE_TYPE_LABELS.other
            const statusInfo = STATUS_BADGE[req.status] || STATUS_BADGE.pending
            return (
              <div key={req.id} className="py-3 first:pt-1 last:pb-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {isBn ? typeLabel.bn : typeLabel.en}
                  </span>
                  <span className={`text-[0.6875rem] font-semibold ${statusInfo.cls}`}>
                    {isBn ? statusInfo.bn : statusInfo.en}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {req.reason}
                </p>
                <div className="flex items-center justify-between gap-2 pt-0.5 text-[0.6875rem] text-[var(--text-muted)]">
                  <span className="tabular-nums">
                    {req.startDate} → {req.endDate}
                  </span>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      {onUpdateLeaveStatus && (
                        <>
                          <button
                            type="button"
                            onClick={() => onUpdateLeaveStatus(req.id, 'approved')}
                            title={isBn ? 'অনুমোদন করুন' : 'Approve Leave'}
                            className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none hover:bg-emerald-500/20 cursor-pointer transition-colors"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateLeaveStatus(req.id, 'rejected')}
                            title={isBn ? 'প্রত্যাখ্যান করুন' : 'Reject Leave'}
                            className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none hover:bg-rose-500/20 cursor-pointer transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                      {onCancelLeave && (
                        <button
                          type="button"
                          onClick={() => onCancelLeave(req.id)}
                          title={isBn ? 'আবেদন প্রত্যাহার করুন' : 'Withdraw Request'}
                          className="p-1 rounded-md border-none bg-transparent text-[var(--text-muted)] hover:text-rose-500 cursor-pointer transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-[var(--text-muted)]">
          <FileText size={24} className="mx-auto text-[var(--text-muted)] opacity-35 mb-2" />
          <p>{isBn ? 'কোনো ছুটির আবেদন জমা দেওয়া হয়নি' : 'No leave requests submitted'}</p>
        </div>
      )}
    </div>
  )
})
