import React, { useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, Printer, Calendar, Banknote, ShieldAlert, DollarSign } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useFeeStore, type FeePayment, type FeeWaiver, type FeeDue } from '@/store/feeStore'
import { printFeeReceipt } from '@/lib/feeReceipt'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'

export interface PaymentDetailsModalProps {
  student: {
    id: string
    nameEn: string
    nameBn: string
    class: string
    section?: string
    roll?: string
    photo?: string
  }
  fee?: {
    id: string
    name: string
    nameBn: string
    amount: number
    type: string
  }
  payments: FeePayment[]
  waivers?: FeeWaiver[]
  totalDue?: number
  session?: string
  batchReceiptNo?: string
  onClose: () => void
  onCollect?: (due: FeeDue) => void
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LABELS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']

export const PaymentDetailsModal = React.memo(function PaymentDetailsModal({
  student,
  fee,
  payments,
  waivers = [],
  totalDue = 0,
  session,
  batchReceiptNo,
  onClose,
  onCollect,
}: PaymentDetailsModalProps) {
  const bn = useBn()
  const { canCreate } = usePermission()
  const { structures } = useFeeStore()

  const structureMap = useMemo(() => new Map(structures.map((s) => [s.id, s])), [structures])

  const effectiveFee = useMemo(() => {
    if (fee) return fee
    const firstP = payments[0]
    const struct = firstP?.feeStructureId ? structureMap.get(firstP.feeStructureId) : null
    return {
      id: struct?.id || firstP?.feeStructureId || '',
      name: struct?.name || firstP?.note || (bn ? 'ফি সংগ্রহ' : 'Fee Collection'),
      nameBn: struct?.nameBn || firstP?.note || (bn ? 'ফি আদায়' : 'Fee Collection'),
      amount: struct?.amount || payments.reduce((s, p) => s + p.amount, 0),
      type: struct?.type || 'onetime',
    }
  }, [fee, payments, structureMap, bn])

  const getFeeInfoForPayment = useCallback((p: FeePayment) => {
    if (fee) return { name: fee.name, nameBn: fee.nameBn }
    const struct = p.feeStructureId ? structureMap.get(p.feeStructureId) : null
    return {
      name: struct?.name || p.note || (bn ? 'ফি' : 'Fee'),
      nameBn: struct?.nameBn || p.note || (bn ? 'ফি' : 'Fee'),
    }
  }, [fee, structureMap, bn])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalDiscount = payments.reduce((sum, p) => sum + (p.discount || 0), 0)
  const totalWaived = waivers.reduce((sum, w) => sum + w.amount, 0)
  const totalOriginal = Math.max(effectiveFee.amount, totalPaid + totalDiscount + totalWaived + totalDue)

  const methodLabel = (m: string) =>
    m === 'cash' ? (bn ? 'নগদ' : 'Cash') :
    m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') :
    m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') :
    (bn ? 'অন্যান্য' : 'Other')

  const methodColor = (m: string) =>
    m === 'cash' ? 'var(--green)' :
    m === 'bank' ? 'var(--brand)' :
    m === 'mobile' ? 'var(--teal)' :
    'var(--text-muted)'

  const formatPeriod = (forMonth?: string) => {
    if (!forMonth) return bn ? 'এককালীন' : 'One-time'
    const [yr, mo] = forMonth.split('-').map(Number)
    if (!mo) return forMonth
    const idx = mo - 1
    return bn ? `${MONTH_LABELS_BN[idx] || mo} ${yr}` : `${MONTH_LABELS[idx] || mo} ${yr}`
  }

  const handlePrintSingle = useCallback((p: FeePayment) => {
    const feeInfo = getFeeInfoForPayment(p)
    const receiptNo = batchReceiptNo || (p.batchId ? `RCP-${p.batchId.slice(-8).toUpperCase()}` : `RCP-${p.id.slice(-8).toUpperCase()}`)
    printFeeReceipt({
      receiptNo,
      date: p.paidAt ? p.paidAt.split('T')[0] : new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.nameEn,
      studentNameBn: student.nameBn,
      class: student.class,
      section: student.section,
      session,
      paymentMethod: p.method,
      collectedBy: p.collectedBy,
      comment: p.note,
      items: [
        {
          feeName: feeInfo.name,
          feeNameBn: feeInfo.nameBn,
          period: formatPeriod(p.forMonth),
          amount: p.amount,
          discount: p.discount,
          note: p.note,
        },
      ],
      totalAmount: p.amount + (p.discount || 0),
      totalDiscount: p.discount || 0,
      totalReceived: p.amount,
      totalDue,
    }, bn)
  }, [student, getFeeInfoForPayment, session, totalDue, bn, batchReceiptNo])

  const handlePrintAll = useCallback(() => {
    if (payments.length === 0) return
    const receiptNo = batchReceiptNo || (payments[0]?.batchId ? `RCP-${payments[0].batchId.slice(-10).toUpperCase()}` : `RCP-${student.id.slice(-6)}-${Date.now().toString().slice(-4)}`)
    printFeeReceipt({
      receiptNo,
      date: payments[0]?.paidAt ? payments[0].paidAt.split('T')[0] : new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.nameEn,
      studentNameBn: student.nameBn,
      class: student.class,
      section: student.section,
      session,
      paymentMethod: payments[0]?.method || 'cash',
      collectedBy: payments[0]?.collectedBy,
      items: payments.map((p) => {
        const feeInfo = getFeeInfoForPayment(p)
        return {
          feeName: feeInfo.name,
          feeNameBn: feeInfo.nameBn,
          period: formatPeriod(p.forMonth),
          amount: p.amount,
          discount: p.discount,
          note: p.note,
        }
      }),
      totalAmount: totalOriginal,
      totalDiscount,
      totalReceived: totalPaid,
      totalDue,
    }, bn)
  }, [payments, student, getFeeInfoForPayment, session, totalOriginal, totalDiscount, totalPaid, totalDue, bn, batchReceiptNo])

  const handleCollectDue = useCallback(() => {
    if (onCollect) {
      onCollect({
        studentId: student.id,
        studentName: student.nameEn,
        studentNameBn: student.nameBn,
        class: student.class,
        section: student.section || '',
        roll: student.roll || '',
        photo: student.photo || '',
        feeStructureId: effectiveFee.id,
        feeName: effectiveFee.name,
        feeNameBn: effectiveFee.nameBn,
        totalAmount: effectiveFee.amount,
        paidAmount: totalPaid,
        waivedAmount: totalWaived,
        dueAmount: totalDue,
        isActive: true,
      })
      onClose()
    }
  }, [student, effectiveFee, totalPaid, totalWaived, totalDue, onCollect, onClose])

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[46rem] w-full`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)]">
              <Banknote size={20} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {bn ? 'পেমেন্ট বিবরণ' : 'Payment Details'}
              </h3>
              <p className="text-[0.75rem] text-[var(--text-muted)]">
                {bn ? effectiveFee.nameBn || effectiveFee.name : effectiveFee.name} — {bn ? 'পরিশোধ ও বকেয়ার ইতিহাস' : 'Payment and Due History'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {payments.length > 0 && (
              <button
                onClick={handlePrintAll}
                className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] hover:border-[var(--brand)] text-[var(--text-secondary)] text-[0.75rem] font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                title={bn ? 'সব রসিদ প্রিন্ট' : 'Print All Receipts'}
              >
                <Printer size={13} />
                <span>{bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Student and Fee Summary Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-3.5 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] overflow-hidden flex items-center justify-center flex-shrink-0">
                {student.photo ? (
                  <img src={student.photo} alt={student.nameEn} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[1rem] font-bold text-[var(--brand)]">
                    {(student.nameEn || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                    {bn ? student.nameBn || student.nameEn : student.nameEn}
                  </h4>
                  <span className="text-[0.6875rem] px-2 py-0.5 rounded-full font-semibold bg-[var(--brand-light)] text-[var(--brand)]">
                    {bn ? 'আইডি:' : 'ID:'} {student.id}
                  </span>
                </div>
                <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">
                  {bn ? 'শ্রেণি:' : 'Class:'} {student.class}
                  {student.section ? ` (${bn ? 'শাখা:' : 'Sec:'} ${student.section})` : ''}
                  {student.roll ? ` · ${bn ? 'রোল:' : 'Roll:'} ${student.roll}` : ''}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)]">
                {effectiveFee.type === 'monthly' ? (bn ? 'মাসিক ফি' : 'Monthly Fee') :
                 effectiveFee.type === 'yearly' ? (bn ? 'বাৎসরিক ফি' : 'Yearly Fee') :
                 (bn ? 'এককালীন ফি' : 'One-time Fee')}
              </span>
              <p className="text-[0.75rem] text-[var(--text-muted)] mt-1">
                {bn ? 'মোট ধার্যকৃত ফি:' : 'Total Payable:'} <span className="font-bold text-[var(--text-primary)]">{fmt(totalOriginal)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4-Stat Grid */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{bn ? 'পরিশোধিত' : 'Total Paid'}</div>
            <div className="text-[1.125rem] font-bold text-[var(--green)]">{fmt(totalPaid)}</div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{bn ? 'ছাড়/ডিসকাউন্ট' : 'Discount'}</div>
            <div className="text-[1.125rem] font-bold text-[var(--amber)]">{fmt(totalDiscount)}</div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{bn ? 'ওয়েভার' : 'Waived'}</div>
            <div className="text-[1.125rem] font-bold text-[var(--purple)]">{fmt(totalWaived)}</div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{bn ? 'অবশিষ্ট বকেয়' : 'Total Due'}</div>
            <div className={`text-[1.125rem] font-bold ${totalDue > 0 ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
              {totalDue > 0 ? fmt(totalDue) : (bn ? 'পরিশোধিত' : 'Cleared')}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-[0.8125rem] font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Calendar size={14} className="text-[var(--brand)]" />
              <span>{bn ? 'পেমেন্ট রেকর্ডসমূহ' : 'Payment Records'} ({payments.length})</span>
            </h5>
            {totalDue > 0 && canCreate('finance.fees.collect.create') && (
              <button
                onClick={handleCollectDue}
                className="h-7 px-3 rounded-lg bg-[var(--brand)] hover:opacity-90 text-white text-[0.75rem] font-semibold border-0 cursor-pointer flex items-center gap-1 transition-opacity"
              >
                <DollarSign size={13} />
                <span>{bn ? 'বকেয় পরিশোধ করুন' : 'Collect Due'}</span>
              </button>
            )}
          </div>

          <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-primary)]">
            {payments.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-[0.8125rem]">
                <ShieldAlert size={28} className="mx-auto mb-1.5 opacity-40 text-[var(--amber)]" />
                <p>{bn ? 'এই ফির জন্য এখনও কোনো পেমেন্ট রেকর্ড নেই' : 'No payments recorded for this fee structure yet'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[16rem]">
                <table className="w-full text-[0.75rem]">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-10">
                      <th className="text-center px-2.5 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">#</th>
                      <th className="text-left px-3 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'রসিদ নং' : 'Receipt No'}</th>
                      <th className="text-center px-2.5 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'তারিখ' : 'Date'}</th>
                      <th className="text-left px-3 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'ফি নাম' : 'Fee Item'}</th>
                      <th className="text-center px-2.5 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'সময়কাল' : 'Period'}</th>
                      <th className="text-right px-3 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                      <th className="text-right px-2.5 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'ছাড়' : 'Disc.'}</th>
                      <th className="text-center px-2.5 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'পদ্ধতি' : 'Method'}</th>
                      <th className="text-left px-3 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'সংগ্রাহক' : 'Collected By'}</th>
                      <th className="text-center px-2 py-2 text-[0.625rem] uppercase font-bold text-[var(--text-muted)]">{bn ? 'রসিদ' : 'Print'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, idx) => {
                      const feeInfo = getFeeInfoForPayment(p)
                      const rcp = batchReceiptNo || (p.batchId ? `RCP-${p.batchId.slice(-8).toUpperCase()}` : `RCP-${p.id.slice(-8).toUpperCase()}`)
                      return (
                        <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                          <td className="text-center px-2.5 py-2.5 text-[var(--text-muted)]">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-mono text-[var(--brand)] font-semibold">{rcp}</td>
                          <td className="text-center px-2.5 py-2.5 text-[var(--text-secondary)] whitespace-nowrap">{p.paidAt ? p.paidAt.split('T')[0] : '—'}</td>
                          <td className="px-3 py-2.5 text-[var(--text-primary)] font-medium truncate max-w-[8rem]">{bn ? feeInfo.nameBn : feeInfo.name}</td>
                          <td className="text-center px-2.5 py-2.5 text-[var(--text-secondary)]">{formatPeriod(p.forMonth)}</td>
                          <td className="text-right px-3 py-2.5 font-bold text-[var(--green)]">৳{p.amount.toLocaleString()}</td>
                          <td className="text-right px-2.5 py-2.5 text-[var(--amber)] font-medium">{p.discount ? `৳${p.discount.toLocaleString()}` : '—'}</td>
                          <td className="text-center px-2.5 py-2.5">
                            <span
                              className="inline-block text-[0.625rem] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${methodColor(p.method)}15`, color: methodColor(p.method) }}
                            >
                              {methodLabel(p.method)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] truncate max-w-[6.25rem]">{p.collectedBy || '—'}</td>
                          <td className="text-center px-2 py-2.5">
                            <button
                              onClick={() => handlePrintSingle(p)}
                              className="w-6 h-6 rounded-md bg-[var(--brand-light)] text-[var(--brand)] border-0 cursor-pointer hover:bg-[var(--brand)] hover:text-white flex items-center justify-center mx-auto transition-colors"
                              title={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
                            >
                              <Printer size={12} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <div className="text-[0.75rem] text-[var(--text-muted)]">
            {payments.length} {bn ? 'টি পেমেন্ট লেনদেন' : 'payment transaction(s)'}
          </div>
          <div className="flex items-center gap-2">
            {totalDue > 0 && canCreate('finance.fees.collect.create') && (
              <button
                onClick={handleCollectDue}
                className="h-8 px-4 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <CheckCircle size={14} />
                <span>{bn ? 'বকেয় পরিশোধ করুন' : 'Collect Payment'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="h-8 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[0.8125rem] font-semibold cursor-pointer transition-colors"
            >
              {bn ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
})
