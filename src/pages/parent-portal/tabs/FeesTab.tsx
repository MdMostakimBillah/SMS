import React from 'react'
import {
  CreditCard,
  CheckCircle2,
  Printer,
  Receipt,
  Clock,
  X,
} from 'lucide-react'
import type { PortalChild, FeeItem } from '../types'
import { useClassStore } from '@/store/classStore'
import { printFeeReceipt } from './fees/feeReceiptPrint'

interface FeesTabProps {
  child: PortalChild
  fees: FeeItem[]
  onOpenPayModal: (fee?: FeeItem) => void
  isBn: boolean
  isInstitutionAdmin?: boolean
  onApproveFee?: (fee: FeeItem) => void
  onRejectFee?: (fee: FeeItem) => void
}

export const FeesTab = React.memo(function FeesTab({
  child,
  fees,
  onOpenPayModal,
  isBn,
  isInstitutionAdmin,
  onApproveFee,
  onRejectFee,
}: FeesTabProps) {
  const institution = useClassStore((s) => s.institution)
  const totalDue = fees.reduce((acc, f) => acc + f.due, 0)
  const totalPaid = fees.reduce((acc, f) => acc + f.paid, 0)
  const totalAmount = fees.reduce((acc, f) => acc + f.amount, 0)

  const handlePrintReceipt = (fee: FeeItem) => {
    printFeeReceipt(fee, child, institution, isBn)
  }

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards - Dashboard Style Top Cards with Hierarchical Accent */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Total Invoiced (Indigo Accent) */}
        <div className="flex items-center gap-3 p-[0.875rem_1rem] rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <Receipt size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[1.125rem] font-bold leading-tight text-[var(--text-primary)]">
              ৳{totalAmount.toLocaleString()}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5 truncate">
              {isBn ? 'মোট নির্ধারিত ফি' : 'Total Invoiced'}
            </div>
          </div>
        </div>

        {/* 2. Paid Amount (Emerald Accent) */}
        <div className="flex items-center gap-3 p-[0.875rem_1rem] rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[1.125rem] font-bold leading-tight text-emerald-600 dark:text-emerald-400">
              ৳{totalPaid.toLocaleString()}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5 truncate">
              {isBn ? 'পরিশোধিত ফি' : 'Paid Amount'}
            </div>
          </div>
        </div>

        {/* 3. Outstanding Dues (THE INVERTED DARK ACCENT CARD - Consistent Light & Dark Mode) */}
        <div className="flex items-center gap-3 p-[0.875rem_1rem] rounded-[0.625rem] bg-[#1a1d2e] dark:bg-[#1e2337] border border-transparent dark:border-indigo-500/30 text-white shadow-xs transition-colors shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 text-amber-400 border border-white/10 shrink-0">
            <CreditCard size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <div className="text-[1.125rem] font-bold leading-tight text-white">
                ৳{totalDue.toLocaleString()}
              </div>
              {totalDue > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenPayModal()}
                  className="px-2.5 py-0.5 rounded text-[0.6875rem] font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 cursor-pointer border-none shadow-xs transition-colors"
                >
                  {isBn ? 'পরিশোধ' : 'Pay'}
                </button>
              )}
            </div>
            <div className="text-[0.6875rem] text-slate-300 dark:text-zinc-300 mt-0.5 truncate">
              {isBn ? 'মোট বকেয়া ফি' : 'Outstanding Dues'}
            </div>
          </div>
        </div>
      </div>

      {/* Due & Invoiced Fees List */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[var(--brand)]" />
            <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'বকেয়া ও পরিশোধযোগ্য ফি' : 'Current Due Invoices'}
            </h3>
          </div>
          {totalDue > 0 && (
            <button
              type="button"
              onClick={() => onOpenPayModal()}
              className="text-[0.75rem] font-semibold text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-none"
            >
              {isBn ? 'সব পরিশোধ করুন' : 'Pay All Dues'}
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-colors flex-wrap sm:flex-nowrap"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[0.625rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">
                    {fee.category}
                  </span>
                  <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)] truncate">
                    {isBn ? fee.titleBn : fee.title}
                  </h4>
                </div>
                <div className="text-[0.6875rem] text-[var(--text-secondary)] flex items-center gap-2 mt-1 flex-wrap">
                  <span>{isBn ? 'শেষ তারিখ:' : 'Due Date:'} {fee.dueDate}</span>
                  <span>·</span>
                  <span>{isBn ? 'নির্ধারিত:' : 'Total:'} ৳{fee.amount.toLocaleString()}</span>
                  {fee.status === 'pending' && fee.pendingTrxId && (
                    <>
                      <span>·</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono font-medium">
                        TrxID: {fee.pendingTrxId}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[0.9375rem] font-extrabold text-[var(--text-primary)]">
                    {fee.due > 0 ? `৳${fee.due.toLocaleString()}` : `৳${fee.paid.toLocaleString()}`}
                  </div>
                  <div className="text-[0.625rem] font-semibold uppercase mt-0.5">
                    {fee.status === 'pending' ? (
                      <span className="text-amber-500 font-bold">{isBn ? 'যাচাই প্রক্রিয়াধীন' : 'PENDING'}</span>
                    ) : fee.due > 0 ? (
                      <span className="text-[var(--text-secondary)]">{isBn ? 'বকেয়া' : 'DUE'}</span>
                    ) : (
                      <span className="text-[var(--brand)] font-bold">{isBn ? 'পরিশোধিত' : 'PAID'}</span>
                    )}
                  </div>
                </div>

                {fee.status === 'pending' ? (
                  isInstitutionAdmin ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onApproveFee?.(fee)}
                        className="px-2.5 py-1.5 rounded-lg text-[0.75rem] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer border-none flex items-center gap-1 shadow-xs"
                        title={isBn ? 'পেমেন্ট অনুমোদন করুন' : 'Approve Payment'}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectFee?.(fee)}
                        className="px-2 py-1.5 rounded-lg text-[0.75rem] font-medium border border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer bg-transparent"
                        title={isBn ? 'পেমেন্ট বাতিল করুন' : 'Reject Payment'}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <Clock size={12} />
                      <span>{isBn ? 'যাচাই প্রক্রিয়াধীন' : 'Pending'}</span>
                    </span>
                  )
                ) : fee.due > 0 ? (
                  <button
                    type="button"
                    onClick={() => onOpenPayModal(fee)}
                    className="px-3.5 py-1.5 rounded-lg text-[0.75rem] font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-90 cursor-pointer border-none"
                  >
                    {isBn ? 'পরিশোধ' : 'Pay'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePrintReceipt(fee)}
                    className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer bg-transparent"
                    title={isBn ? 'রশিদ ডাউনলোড করুন' : 'Download Receipt'}
                  >
                    <Printer size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
