import React, { useState, useMemo } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Printer,
  Receipt,
  Clock,
  X,
  Search,
  AlertTriangle,
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

type FeeStatusFilter = 'all' | 'due' | 'pending' | 'paid'

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
  const [statusFilter, setStatusFilter] = useState<FeeStatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const totalDue = useMemo(() => fees.reduce((acc, f) => acc + f.due, 0), [fees])
  const totalPaid = useMemo(() => fees.reduce((acc, f) => acc + f.paid, 0), [fees])
  const totalAmount = useMemo(() => fees.reduce((acc, f) => acc + f.amount, 0), [fees])
  const totalWaived = useMemo(() => fees.reduce((acc, f) => acc + (f.waived || 0), 0), [fees])

  const counts = useMemo(() => {
    const all = fees.length
    const due = fees.filter((f) => f.due > 0 && f.status !== 'pending').length
    const pending = fees.filter((f) => f.status === 'pending').length
    const paid = fees.filter((f) => f.due <= 0 && f.status !== 'pending').length
    return { all, due, pending, paid }
  }, [fees])

  const filteredFees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return fees.filter((f) => {
      if (statusFilter === 'due' && !(f.due > 0 && f.status !== 'pending')) return false
      if (statusFilter === 'pending' && f.status !== 'pending') return false
      if (statusFilter === 'paid' && !(f.due <= 0 && f.status !== 'pending')) return false
      if (!q) return true
      return (
        f.title.toLowerCase().includes(q) ||
        f.titleBn.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        (f.pendingTrxId && f.pendingTrxId.toLowerCase().includes(q))
      )
    })
  }, [fees, statusFilter, searchQuery])

  const handlePrintReceipt = (fee: FeeItem) => {
    printFeeReceipt(fee, child, institution, isBn)
  }

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
        {/* Total Invoiced */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand)',
              flexShrink: 0,
            }}
          >
            <Receipt size={16} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ৳{totalAmount.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.375rem',
                marginTop: '0.1875rem',
              }}
            >
              <span>{isBn ? 'মোট নির্ধারিত ফি' : 'Total Invoiced'}</span>
              {totalWaived > 0 && (
                <span style={{ color: 'var(--text-muted)' }}>
                  {isBn ? 'ছাড়:' : 'Waived:'} ৳{totalWaived.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Paid Amount */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green)',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={16} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ৳{totalPaid.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.1875rem',
              }}
            >
              {isBn ? 'পরিশোধিত ফি' : 'Paid Amount'}
            </div>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: totalDue > 0 ? 'var(--amber)' : 'var(--green)',
              flexShrink: 0,
            }}
          >
            <CreditCard size={16} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: totalDue > 0 ? 'var(--amber)' : 'var(--text-primary)',
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>৳{totalDue.toLocaleString()}</span>
              {totalDue > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenPayModal()}
                  className="h-6 px-2.5 rounded-md text-xs font-semibold bg-[var(--brand)] hover:opacity-90 text-white cursor-pointer border-none transition-opacity shrink-0"
                >
                  {isBn ? 'পরিশোধ' : 'Pay'}
                </button>
              )}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.1875rem',
              }}
            >
              {isBn ? 'মোট বকেয়া ফি' : 'Outstanding Dues'}
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Card */}
      <div className="card--premium rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              style={{
                width: '0.1875rem',
                height: '0.875rem',
                background: 'var(--brand)',
                borderRadius: '0.125rem',
                flexShrink: 0,
              }}
            />
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {isBn ? 'বকেয়া ও পরিশোধযোগ্য ফি' : 'Current Due Invoices'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isBn ? `মোট ${filteredFees.length}টি ইনভয়েস` : `${filteredFees.length} invoices listed`}
              </p>
            </div>
          </div>

          {totalDue > 0 && (
            <button
              type="button"
              onClick={() => onOpenPayModal()}
              className="h-7 px-3 rounded-md text-xs font-semibold bg-[var(--brand)] hover:opacity-90 text-white transition-opacity cursor-pointer border-none shadow-xs self-start sm:self-auto"
            >
              {isBn ? 'সব পরিশোধ করুন' : 'Pay All Dues'}
            </button>
          )}
        </div>

        {/* Search & Status Filter Strip */}
        {fees.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'ফি বা TrxID খুঁজুন...' : 'Search fee or TrxID...'}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[var(--border)] bg-slate-50/80 dark:bg-white/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand)] transition-colors"
              />
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] overflow-x-auto scrollbar-hide">
              {(
                [
                  { id: 'all', en: 'All', bn: 'সকল', count: counts.all },
                  { id: 'due', en: 'Due', bn: 'বকেয়া', count: counts.due },
                  { id: 'pending', en: 'Pending', bn: 'যাচাইাধীন', count: counts.pending },
                  { id: 'paid', en: 'Paid', bn: 'পরিশোধিত', count: counts.paid },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`h-7 px-3 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 cursor-pointer border-none transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                      : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{isBn ? tab.bn : tab.en}</span>
                  <span className="text-[0.6875rem] text-[var(--text-muted)] tabular-nums">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Invoices List or Empty State */}
        {filteredFees.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            <Receipt size={28} className="mx-auto mb-2 opacity-35" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {fees.length === 0
                ? isBn
                  ? 'কোনো ফি কাঠামো নির্ধারিত নেই'
                  : 'No Fee Invoices Assigned Yet'
                : isBn
                ? 'এই ফিল্টারে কোনো ফি পাওয়া যায়নি'
                : 'No matching fee invoices found'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
              {fees.length === 0
                ? isBn
                  ? 'প্রতিষ্ঠানের ফাইন্যান্স বিভাগ থেকে শ্রেণির ফি যুক্ত করলে এখানে প্রদর্শিত হবে।'
                  : 'Assigned fee structures and payment invoices for this student will appear here.'
                : isBn
                ? 'অন্যান্য ফিল্টার বা অনুসন্ধান শব্দ পরিবর্তন করে দেখুন।'
                : 'Try selecting a different status filter or clearing your search.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredFees.map((fee) => {
              const isPending = fee.status === 'pending'
              const isPaid = fee.due <= 0 && !isPending
              const isPartial = fee.due > 0 && fee.paid > 0 && !isPending

              return (
                <div key={fee.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">
                          {(isBn ? fee.categoryBn : fee.category) || fee.category}
                        </span>
                        <span className="text-[var(--text-muted)] text-xs">·</span>
                        <h4 className="text-[0.8125rem] sm:text-sm font-medium text-[var(--text-primary)] truncate">
                          {isBn ? fee.titleBn : fee.title}
                        </h4>
                      </div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-2 mt-1 flex-wrap tabular-nums">
                        <span>{isBn ? 'তারিখ:' : 'Due:'} {fee.dueDate}</span>
                        <span>·</span>
                        <span>{isBn ? 'নির্ধারিত:' : 'Total:'} ৳{fee.amount.toLocaleString()}</span>
                        {fee.waived && fee.waived > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-teal-600 dark:text-teal-400 font-medium">
                              {isBn ? 'ছাড়:' : 'Waiver:'} ৳{fee.waived.toLocaleString()}
                            </span>
                          </>
                        )}
                        {fee.paid > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {isBn ? 'পরিশোধিত:' : 'Paid:'} ৳{fee.paid.toLocaleString()}
                            </span>
                          </>
                        )}
                        {isPending && fee.pendingTrxId && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-mono">
                              TrxID: {fee.pendingTrxId}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                          {fee.due > 0 ? `৳${fee.due.toLocaleString()}` : `৳${fee.paid.toLocaleString()}`}
                        </div>
                        <div className="mt-0.5 text-[0.6875rem] font-semibold">
                          {isPending ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {isBn ? 'যাচাই প্রক্রিয়াধীন' : 'PENDING'}
                            </span>
                          ) : isPartial ? (
                            <span className="text-[var(--brand)]">
                              {isBn ? 'আংশিক' : 'PARTIAL'}
                            </span>
                          ) : fee.due > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {isBn ? 'বকেয়া' : 'DUE'}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {isBn ? 'পরিশোধিত' : 'PAID'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isPending ? (
                          isInstitutionAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onApproveFee?.(fee)}
                                className="h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer border-none flex items-center gap-1 transition-colors"
                                title={isBn ? 'পেমেন্ট অনুমোদন করুন' : 'Approve Payment'}
                              >
                                <CheckCircle2 size={13} />
                                <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onRejectFee?.(fee)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center border-none bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors"
                                title={isBn ? 'পেমেন্ট বাতিল করুন' : 'Reject Payment'}
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <Clock size={12} />
                              <span>{isBn ? 'যাচাইাধীন' : 'Pending'}</span>
                            </span>
                          )
                        ) : (
                          <>
                            {fee.due > 0 && (
                              <button
                                type="button"
                                onClick={() => onOpenPayModal(fee)}
                                className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-[var(--brand)] hover:opacity-90 text-white cursor-pointer border-none transition-opacity shadow-xs"
                              >
                                {isBn ? 'পরিশোধ' : 'Pay'}
                              </button>
                            )}
                            {(fee.paid > 0 || isPaid) && (
                              <button
                                type="button"
                                onClick={() => handlePrintReceipt(fee)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                                title={isBn ? 'রশিদ ডাউনলোড করুন' : 'Download Receipt'}
                              >
                                <Printer size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {fee.rejectedReason && fee.due > 0 && !isPending && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 text-[0.6875rem] text-rose-600 dark:text-rose-400 font-medium">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>
                        {isBn ? 'পূর্ববর্তী পেমেন্ট বাতিল হয়েছে:' : 'Previous payment rejected:'} {fee.rejectedReason}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})
