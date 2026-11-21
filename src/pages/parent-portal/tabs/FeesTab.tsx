import React from 'react'
import {
  CreditCard,
  CheckCircle2,
  Printer,
} from 'lucide-react'
import type { PortalChild, FeeItem } from '../types'
import { openPrintWindow } from '@/lib/pdf'
import { useClassStore } from '@/store/classStore'

interface FeesTabProps {
  child: PortalChild
  fees: FeeItem[]
  onOpenPayModal: () => void
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
    const css = `
      @page { size: 148mm 210mm; margin: 10mm; }
      body { font-family: sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 11px; }
      .receipt-box { border: 2px solid #2563eb; border-radius: 8px; padding: 14px; }
      .hdr { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
      .sname { font-size: 16px; font-weight: bold; color: #1e3a8a; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
      th { background: #f1f5f9; font-weight: bold; }
      .total-row { font-weight: bold; background: #eff6ff; }
      .ftr { margin-top: 30px; display: flex; justify-content: space-between; font-size: 9px; }
      .sig { width: 140px; border-top: 1px dashed #64748b; text-align: center; padding-top: 4px; }
    `
    const html = `
      <div class="receipt-box">
        <div class="hdr">
          <div class="sname">${institution.name || 'EduTech Smart School'}</div>
          <div style="font-size:9px;color:#64748b">${institution.address || ''}</div>
          <div style="font-size:12px;font-weight:bold;margin-top:4px;color:#2563eb">
            ${isBn ? 'মানি রিসিট / অর্থপ্রাপ্তির রশিদ' : 'STUDENT FEE PAYMENT RECEIPT'}
          </div>
        </div>

        <div class="meta">
          <div>
            <div><strong>${isBn ? 'শিক্ষার্থী:' : 'Student:'}</strong> ${child.nameEn} (${isBn ? child.nameBn : ''})</div>
            <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${child.class} &nbsp; <strong>${isBn ? 'রোল:' : 'Roll:'}</strong> ${child.roll}</div>
          </div>
          <div style="text-align:right">
            <div><strong>${isBn ? 'রশিদ নং:' : 'Receipt No:'}</strong> RCT-${fee.id.slice(-6).toUpperCase()}</div>
            <div><strong>${isBn ? 'তারিখ:' : 'Date:'}</strong> ${new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${isBn ? 'বিবরণ' : 'Description'}</th>
              <th>${isBn ? 'ক্যাটাগরি' : 'Category'}</th>
              <th style="text-align:right">${isBn ? 'পরিশোধিত টাকা' : 'Paid Amount'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>${isBn ? fee.titleBn : fee.title}</strong></td>
              <td>${fee.category}</td>
              <td style="text-align:right">৳${fee.paid.toLocaleString()}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align:right">${isBn ? 'মোট প্রাপ্তি:' : 'Total Received:'}</td>
              <td style="text-align:right">৳${fee.paid.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size:9.5px;color:#16a34a;margin-top:6px">
          <strong>${isBn ? 'পেমেন্ট স্ট্যাটাস:' : 'Payment Status:'}</strong> PAID (Online / bKash Gateway)
        </div>

        <div class="ftr">
          <div class="sig">${isBn ? 'হিসাবরক্ষকের স্বাক্ষর' : 'Accountant Signature'}</div>
          <div class="sig">${isBn ? 'অভিভাবকের স্বাক্ষর' : 'Guardian Signature'}</div>
        </div>
      </div>
    `
    openPrintWindow('Fee_Receipt_' + fee.id, html, { css })
  }

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xs">
          <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {isBn ? 'মোট নির্ধারিত ফি' : 'Total Billed'}
          </div>
          <div className="text-[1.5rem] font-extrabold text-[var(--text-primary)] mt-1">
            ৳{totalAmount.toLocaleString()}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1">
            {fees.length} {isBn ? 'টি ফি আইটেম' : 'Total invoices'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xs">
          <div className="text-[0.6875rem] font-semibold text-emerald-600 uppercase tracking-wider">
            {isBn ? 'মোট পরিশোধিত' : 'Total Paid'}
          </div>
          <div className="text-[1.5rem] font-extrabold text-emerald-600 mt-1">
            ৳{totalPaid.toLocaleString()}
          </div>
          <div className="text-[0.6875rem] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 size={12} /> {isBn ? 'যাচাইকৃত প্রাপ্তি' : 'Verified Payments'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xs">
          <div className="text-[0.6875rem] font-semibold text-amber-600 uppercase tracking-wider">
            {isBn ? 'মোট বকেয়া' : 'Total Outstanding Due'}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className={`text-[1.5rem] font-extrabold ${totalDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              ৳{totalDue.toLocaleString()}
            </div>
            {totalDue > 0 && (
              <button
                type="button"
                onClick={onOpenPayModal}
                className="px-3 py-1 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-95 cursor-pointer border-none"
              >
                {isBn ? 'পরিশোধ করুন' : 'Pay Online'}
              </button>
            )}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1">
            {totalDue > 0 ? (isBn ? 'অনলাইনে তাৎক্ষণিক পরিশোধ করুন' : 'Pay instantly online') : (isBn ? 'কোনো বকেয়া নেই' : 'No outstanding dues')}
          </div>
        </div>
      </div>

      {/* Due Fees List */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
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
              onClick={onOpenPayModal}
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
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 hover:bg-[var(--bg-secondary)] transition-all flex-wrap sm:flex-nowrap"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold bg-[var(--brand)]/10 text-[var(--brand)]">
                    {fee.category}
                  </span>
                  <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)] truncate">
                    {isBn ? fee.titleBn : fee.title}
                  </h4>
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-2 mt-1">
                  <span>{isBn ? 'শেষ তারিখ:' : 'Due Date:'} {fee.dueDate}</span>
                  <span>·</span>
                  <span>{isBn ? 'নির্ধারিত:' : 'Total:'} ৳{fee.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className={`text-[0.9375rem] font-extrabold ${fee.due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {fee.due > 0 ? `৳${fee.due.toLocaleString()}` : `৳${fee.paid.toLocaleString()}`}
                  </div>
                  <div className="text-[0.625rem] font-semibold uppercase">
                    {fee.due > 0 ? (
                      <span className="text-amber-600">{isBn ? 'বকেয়া' : 'DUE'}</span>
                    ) : (
                      <span className="text-emerald-600">{isBn ? 'পরিশোধিত' : 'PAID'}</span>
                    )}
                  </div>
                </div>

                {fee.due > 0 ? (
                  <button
                    type="button"
                    onClick={onOpenPayModal}
                    className="px-3.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-95 cursor-pointer border-none"
                  >
                    {isBn ? 'পরিশোধ' : 'Pay'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePrintReceipt(fee)}
                    className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors cursor-pointer bg-transparent"
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
