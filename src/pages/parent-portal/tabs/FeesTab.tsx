import React from 'react'
import {
  CreditCard,
  CheckCircle2,
  Printer,
  Receipt,
} from 'lucide-react'
import type { PortalChild, FeeItem } from '../types'
import { useClassStore } from '@/store/classStore'
import { printFeeReceipt } from './fees/feeReceiptPrint'

interface FeesTabProps {
  child: PortalChild
  fees: FeeItem[]
  onOpenPayModal: (fee?: FeeItem) => void
  isBn: boolean
}

export const FeesTab = React.memo(function FeesTab({
  child,
  fees,
  onOpenPayModal,
  isBn,
}: FeesTabProps) {
  const institution = useClassStore((s) => s.institution)
  const totalDue = fees.reduce((acc, f) => acc + f.due, 0)
  const totalPaid = fees.reduce((acc, f) => acc + f.paid, 0)
  const totalAmount = fees.reduce((acc, f) => acc + f.amount, 0)

  const handlePrintReceipt = (fee: FeeItem) => {
    printFeeReceipt(fee, child, institution, isBn)
  }

  const kpiCards = [
    {
      icon: Receipt,
      label: isBn ? 'মোট নির্ধারিত ফি' : 'Total Invoiced',
      value: `৳${totalAmount.toLocaleString()}`,
    },
    {
      icon: CheckCircle2,
      label: isBn ? 'পরিশোধিত ফি' : 'Paid Amount',
      value: `৳${totalPaid.toLocaleString()}`,
    },
    {
      icon: CreditCard,
      label: isBn ? 'মোট বকেয়া ফি' : 'Outstanding Dues',
      value: `৳${totalDue.toLocaleString()}`,
      hasPayAction: totalDue > 0,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards - Dashboard Style Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.375rem',
                background: 'var(--bg-secondary)',
                color: 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <card.icon size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="flex items-center justify-between">
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: 'var(--text-primary)',
                  }}
                >
                  {card.value}
                </div>
                {card.hasPayAction && (
                  <button
                    type="button"
                    onClick={() => onOpenPayModal()}
                    className="px-2.5 py-0.5 rounded text-[0.6875rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 cursor-pointer border-none"
                  >
                    {isBn ? 'পরিশোধ' : 'Pay'}
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.125rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {card.label}
              </div>
            </div>
          </div>
        ))}
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
                <div className="text-[0.6875rem] text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                  <span>{isBn ? 'শেষ তারিখ:' : 'Due Date:'} {fee.dueDate}</span>
                  <span>·</span>
                  <span>{isBn ? 'নির্ধারিত:' : 'Total:'} ৳{fee.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[0.9375rem] font-extrabold text-[var(--text-primary)]">
                    {fee.due > 0 ? `৳${fee.due.toLocaleString()}` : `৳${fee.paid.toLocaleString()}`}
                  </div>
                  <div className="text-[0.625rem] font-semibold uppercase mt-0.5">
                    {fee.due > 0 ? (
                      <span className="text-[var(--text-secondary)]">{isBn ? 'বকেয়া' : 'DUE'}</span>
                    ) : (
                      <span className="text-[var(--brand)] font-bold">{isBn ? 'পরিশোধিত' : 'PAID'}</span>
                    )}
                  </div>
                </div>

                {fee.due > 0 ? (
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
