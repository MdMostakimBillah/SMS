import React, { useMemo } from 'react'
import {
  CreditCard,
  Printer,
  FileText,
  ArrowRight,
} from 'lucide-react'
import type { StudentProfile, StudentFee } from '../types'
import { useClassStore } from '@/store/classStore'
import { printFeeReceipt } from '@/pages/parent-portal/tabs/fees/feeReceiptPrint'

interface FeesTabProps {
  student: StudentProfile
  fees: StudentFee[]
  onOpenPayModal: (fee?: StudentFee) => void
  isBn: boolean
}

export const FeesTab = React.memo(function FeesTab({
  student,
  fees,
  onOpenPayModal,
  isBn,
}: FeesTabProps) {
  const institution = useClassStore((s) => s.institution)

  const totalBilled = useMemo(() => fees.reduce((sum, f) => sum + f.amount, 0), [fees])
  const totalPaid = useMemo(() => fees.reduce((sum, f) => sum + f.paid, 0), [fees])
  const totalDue = useMemo(
    () => fees.reduce((sum, f) => sum + (f.status === 'pending' ? 0 : f.due), 0),
    [fees]
  )

  const handlePrint = (fee: StudentFee) => {
    printFeeReceipt(fee as any, student as any, institution, isBn)
  }

  return (
    <div className="space-y-4">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {isBn ? 'মোট নির্ধারিত ফি' : 'Total Billed Amount'}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1">
            ৳{totalBilled.toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {isBn ? 'মোট পরিশোধিত' : 'Total Paid'}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{totalPaid.toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {isBn ? 'মোট বকেয়া' : 'Total Outstanding Due'}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-rose-500 mt-1">
            ৳{totalDue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Fees List */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {isBn ? 'ফি ও ইনভয়েস বিবরণ' : 'Fee Invoices & Payments'}
            </h3>
          </div>
          {totalDue > 0 && (
            <button
              type="button"
              onClick={() => onOpenPayModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-medium hover:opacity-90 cursor-pointer"
            >
              <span>{isBn ? 'বকেয়া পরিশোধ করুন' : 'Pay Online'}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {fees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <th className="py-3 px-4 font-semibold">{isBn ? 'ফি এর বিবরণ' : 'Description'}</th>
                  <th className="py-3 px-3 font-semibold">{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="py-3 px-3 font-semibold text-right">{isBn ? 'নির্ধারিত' : 'Amount'}</th>
                  <th className="py-3 px-3 font-semibold text-right">{isBn ? 'পরিশোধ' : 'Paid'}</th>
                  <th className="py-3 px-3 font-semibold text-right">{isBn ? 'বকেয়া' : 'Due'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4 font-semibold text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {fees.map((fee) => {
                  const isPaid = fee.status === 'paid'
                  const isPending = fee.status === 'pending'
                  const isDue = fee.due > 0 && !isPending

                  return (
                    <tr key={fee.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                        <div>{isBn ? fee.titleBn || fee.title : fee.title}</div>
                        <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">
                          {isBn ? 'তারিখ:' : 'Due:'} {fee.dueDate}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{fee.category}</td>
                      <td className="py-3 px-3 text-right font-medium text-[var(--text-primary)]">
                        ৳{fee.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                        ৳{fee.paid.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-500">
                        ৳{fee.due.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[0.6875rem] font-semibold ${
                            isPaid
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : isPending
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isPaid
                            ? isBn ? 'পরিশোধিত' : 'Paid'
                            : isPending
                              ? isBn ? 'যাচাইাধীন' : 'Pending'
                              : isBn ? 'বকেয়া' : 'Due'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDue && (
                            <button
                              type="button"
                              onClick={() => onOpenPayModal(fee)}
                              className="px-2.5 py-1 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium hover:opacity-90"
                            >
                              {isBn ? 'পরিশোধ' : 'Pay'}
                            </button>
                          )}
                          {fee.paid > 0 && (
                            <button
                              type="button"
                              onClick={() => handlePrint(fee)}
                              title={isBn ? 'রশিদ প্রিন্ট করুন' : 'Print Receipt'}
                              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                            >
                              <Printer size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[var(--text-muted)] p-6">
            <FileText size={36} className="mx-auto mb-3 opacity-50" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {isBn ? 'কোনো ফি কাঠামো নির্ধারিত নেই' : 'No Fees Assigned Yet'}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {isBn
                ? 'আপনার শ্রেণির জন্য ফি যুক্ত করা হলে তা এখানে তালিকাভুক্ত হবে।'
                : 'Assigned fee structures and online receipts will be displayed here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
