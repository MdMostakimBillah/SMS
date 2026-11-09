import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Printer,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useFeeStore, formatReceiptNo, parseReceiptNumber, type FeePayment, type FeeWaiver, type FeeDue } from '@/store/feeStore'
import { printFeeReceipt } from '@/lib/feeReceipt'

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
  const structures = useFeeStore((s) => s.structures)

  const [copiedId, setCopiedId] = useState(false)
  const [copiedReceipt, setCopiedReceipt] = useState<string | null>(null)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [onClose])

  const copyToClipboard = useCallback((text: string, type: 'id' | 'receipt') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
        if (type === 'id') {
          setCopiedId(true)
          copyTimeoutRef.current = setTimeout(() => setCopiedId(false), 1800)
        } else {
          setCopiedReceipt(text)
          copyTimeoutRef.current = setTimeout(() => setCopiedReceipt(null), 1800)
        }
      }).catch(() => {})
    }
  }, [])

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

  const resolvedWaivers = useMemo(() => {
    if (waivers && waivers.length > 0) return waivers
    try {
      const state = useFeeStore.getState()
      const hasStudentEntries = state.waiverEntries.some((e) => e.studentId === student.id)
      const hasStudentWaivers = state.studentWaivers.some((w) => w.studentId === student.id && w.isActive)
      if (!hasStudentEntries && !hasStudentWaivers) return []

      const generated = state.generateWaivers([
        {
          id: student.id,
          nameEn: student.nameEn,
          nameBn: student.nameBn,
          class: student.class,
          section: student.section || '',
          roll: student.roll || '',
          photo: student.photo || '',
        },
      ])
      return generated.filter(
        (w) => w.studentId === student.id && (!effectiveFee.id || w.feeStructureId === effectiveFee.id)
      )
    } catch {
      return []
    }
  }, [waivers, student, effectiveFee.id])

  const { totalPaid, totalDiscount } = useMemo(() => {
    let paid = 0
    let discount = 0
    for (let i = 0; i < payments.length; i++) {
      paid += payments[i].amount
      discount += payments[i].discount || 0
    }
    return { totalPaid: paid, totalDiscount: discount }
  }, [payments])

  const totalWaived = useMemo(() => {
    let waived = 0
    for (let i = 0; i < resolvedWaivers.length; i++) {
      waived += resolvedWaivers[i].amount
    }
    return waived
  }, [resolvedWaivers])

  const effectiveDue = useMemo(() => {
    if (totalDue > 0) return totalDue
    if (effectiveFee.amount > 0 && effectiveFee.type !== 'shop') {
      const remaining = effectiveFee.amount - (totalPaid + totalDiscount + totalWaived)
      return remaining > 0 ? remaining : 0
    }
    return 0
  }, [totalDue, effectiveFee, totalPaid, totalDiscount, totalWaived])

  const totalOriginal = useMemo(
    () => Math.max(effectiveFee.amount, totalPaid + totalDiscount + totalWaived + effectiveDue),
    [effectiveFee.amount, totalPaid, totalDiscount, totalWaived, effectiveDue]
  )

  const paidPercentage = totalOriginal > 0 ? Math.min(100, Math.round((totalPaid / totalOriginal) * 100)) : 100

  const methodLabel = (m: string) =>
    m === 'cash' ? (bn ? 'নগদ' : 'Cash') :
    m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') :
    m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') :
    (bn ? 'অন্যান্য' : 'Other')

  const formatPeriod = (forMonth?: string) => {
    if (!forMonth) return bn ? 'এককালীন' : 'One-time'
    const [yr, mo] = forMonth.split('-').map(Number)
    if (!mo) return forMonth
    const idx = mo - 1
    return bn ? `${MONTH_LABELS_BN[idx] || mo} ${yr}` : `${MONTH_LABELS[idx] || mo} ${yr}`
  }

  const displayReceiptNo = useMemo(() => {
    if (batchReceiptNo) return batchReceiptNo
    if (payments[0]?.receiptNo) return payments[0].receiptNo
    if (payments[0]?.batchId && parseReceiptNumber(payments[0].batchId)) {
      return formatReceiptNo(parseReceiptNumber(payments[0].batchId)!)
    }
    return '000001'
  }, [batchReceiptNo, payments])

  const handlePrintSingle = useCallback((p: FeePayment) => {
    const feeInfo = getFeeInfoForPayment(p)
    const receiptNo = p.receiptNo || batchReceiptNo || (p.batchId && parseReceiptNumber(p.batchId) ? formatReceiptNo(parseReceiptNumber(p.batchId)!) : (p.batchId ? `RCP-${p.batchId.slice(-8).toUpperCase()}` : displayReceiptNo))
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
      totalDue: effectiveDue,
    }, bn)
  }, [student, getFeeInfoForPayment, session, effectiveDue, bn, batchReceiptNo, displayReceiptNo])

  const handlePrintAll = useCallback(() => {
    if (payments.length === 0) return
    const receiptNo = batchReceiptNo || payments[0]?.receiptNo || (payments[0]?.batchId && parseReceiptNumber(payments[0].batchId) ? formatReceiptNo(parseReceiptNumber(payments[0].batchId)!) : (payments[0]?.batchId ? `RCP-${payments[0].batchId.slice(-10).toUpperCase()}` : displayReceiptNo))
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
      totalDue: effectiveDue,
    }, bn)
  }, [payments, student, getFeeInfoForPayment, session, totalOriginal, totalDiscount, totalPaid, effectiveDue, bn, batchReceiptNo, displayReceiptNo])

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
        dueAmount: effectiveDue,
        isActive: true,
      })
      onClose()
    }
  }, [student, effectiveFee, totalPaid, totalWaived, effectiveDue, onCollect, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs modal-backdrop-animate"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[var(--surface)] border border-[var(--border)] dark:border-white/[0.08] rounded-xl shadow-2xl overflow-hidden text-[var(--text-primary)] my-auto modal-card-animate"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-3.5 py-2.5 sm:px-4 border-b border-[var(--border)] dark:border-white/[0.07] flex items-center justify-between bg-[var(--bg-secondary)]/50 shrink-0">
          <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
            {bn ? 'পেমেন্ট বিবরণ' : 'Payment Details'}
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            {payments.length > 0 && (
              <button
                type="button"
                onClick={handlePrintAll}
                className="h-7 px-2.5 rounded-md border border-[var(--border)] dark:border-white/[0.08] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[0.6875rem] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                title={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
                aria-label={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
              >
                <Printer size={12} />
                <span>{bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 rounded-md flex items-center justify-center border border-[var(--border)] dark:border-white/[0.08] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              aria-label={bn ? 'বন্ধ করুন' : 'Close'}
              title="Esc"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 overscroll-contain">
          {/* Top Row: Left Side (Student Profile) + Right Side (Total Payment with Graph) - Reduced Compact Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Left Column: Student Profile Only */}
            <div className="bg-[var(--bg-secondary)]/40 border border-[var(--border)] dark:border-white/[0.07] rounded-xl p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-[var(--surface-2)] text-[var(--text-secondary)] font-semibold text-xs shrink-0 border border-[var(--border)] dark:border-white/[0.06]">
                    {student.photo ? (
                      <img src={student.photo} alt={student.nameEn} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(student.nameEn || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {bn ? student.nameBn || student.nameEn : student.nameEn}
                      </h4>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(student.id, 'id')}
                        className="text-[0.5625rem] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded bg-[var(--surface-2)]/60 border border-[var(--border)] dark:border-white/[0.05]"
                        title={bn ? 'আইডি কপি করুন' : 'Click to copy ID'}
                      >
                        <span className="opacity-60">ID:</span>
                        <span>{student.id}</span>
                        {copiedId ? (
                          <Check size={9} className="text-[var(--green)]" />
                        ) : (
                          <Copy size={9} className="opacity-40" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile attributes: 4 compact items */}
                <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-[var(--border)] dark:border-white/[0.06] text-center">
                  <div className="bg-[var(--surface-2)]/40 rounded px-1 py-1">
                    <span className="text-[0.5rem] font-medium uppercase tracking-wider text-[var(--text-muted)] block leading-none">
                      {bn ? 'শ্রেণি' : 'Class'}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-[0.6875rem] leading-tight block mt-0.5 truncate">
                      {student.class}
                    </span>
                  </div>
                  <div className="bg-[var(--surface-2)]/40 rounded px-1 py-1">
                    <span className="text-[0.5rem] font-medium uppercase tracking-wider text-[var(--text-muted)] block leading-none">
                      {bn ? 'শাখা' : 'Section'}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-[0.6875rem] leading-tight block mt-0.5 truncate">
                      {student.section || '—'}
                    </span>
                  </div>
                  <div className="bg-[var(--surface-2)]/40 rounded px-1 py-1">
                    <span className="text-[0.5rem] font-medium uppercase tracking-wider text-[var(--text-muted)] block leading-none">
                      {bn ? 'রোল' : 'Roll'}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-[0.6875rem] leading-tight block mt-0.5 truncate">
                      {student.roll || '—'}
                    </span>
                  </div>
                  <div className="bg-[var(--surface-2)]/40 rounded px-1 py-1">
                    <span className="text-[0.5rem] font-medium uppercase tracking-wider text-[var(--text-muted)] block leading-none">
                      {bn ? 'সেশন' : 'Session'}
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-[0.6875rem] leading-tight block mt-0.5 truncate">
                      {session || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Total Payment with Graph */}
            <div className="bg-[var(--bg-secondary)]/40 border border-[var(--border)] dark:border-white/[0.07] rounded-xl p-2.5 flex flex-col justify-between">
              {/* Header: Title, fee type pill, and status */}
              <div className="flex items-center justify-between gap-1.5 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">
                    {bn ? 'পেমেন্ট সারসংক্ষেপ' : 'Payment Summary'}
                  </span>
                  <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] font-medium border border-[var(--border)] dark:border-white/[0.06]">
                    {effectiveFee.type === 'monthly' ? (bn ? 'মাসিক ফি' : 'Monthly Fee') :
                     effectiveFee.type === 'yearly' ? (bn ? 'বাৎসরিক ফি' : 'Yearly Fee') :
                     (bn ? 'এককালীন ফি' : 'One-time Fee')}
                  </span>
                </div>
                <span className="text-[0.5625rem] text-[var(--text-muted)] font-medium">
                  {effectiveDue > 0
                    ? (bn ? `${fmt(effectiveDue)} বকেয়া` : `${fmt(effectiveDue)} due`)
                    : (bn ? 'সম্পূর্ণ পরিশোধিত' : 'Completed')}
                </span>
              </div>

              {/* Compact Radial Ring & Total Figure */}
              <div className="flex items-center gap-2.5 py-0.5">
                <div className="relative w-11 h-11 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r="17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-[var(--border)] dark:text-white/[0.07]"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="17"
                      fill="none"
                      stroke="var(--brand)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={106.8}
                      strokeDashoffset={106.8 - (paidPercentage / 100) * 106.8}
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-center">
                    <span className="text-[0.5625rem] font-bold text-[var(--text-primary)] tabular-nums">
                      {paidPercentage}%
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[0.5rem] font-medium text-[var(--text-muted)] uppercase tracking-wider block">
                      {bn ? 'মোট পরিশোধ' : 'Total Payment'}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-none tabular-nums block mt-0.5">
                      {fmt(totalPaid)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[0.5rem] font-medium text-[var(--text-muted)] uppercase tracking-wider block">
                      {bn ? 'মোট ফি' : 'Total Fee'}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-secondary)] leading-none tabular-nums block mt-0.5">
                      {fmt(totalOriginal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimal 4-Metric Summary */}
              <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-[var(--border)] dark:border-white/[0.06] text-center">
                <div className="py-1 px-1 rounded bg-[var(--surface-2)]/60 border border-[var(--border)] dark:border-white/[0.06]">
                  <span className="text-[0.5rem] text-[var(--text-muted)] block truncate font-medium leading-none">
                    {bn ? 'পরিশোধ' : 'Total Paid'}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums text-[0.625rem] mt-0.5 block truncate leading-tight">
                    {fmt(totalPaid)}
                  </span>
                </div>
                <div className="py-1 px-1 rounded bg-[var(--surface-2)]/60 border border-[var(--border)] dark:border-white/[0.06]">
                  <span className="text-[0.5rem] text-[var(--text-muted)] block truncate font-medium leading-none">
                    {bn ? 'ছাড়' : 'Discount'}
                  </span>
                  <span className="font-semibold text-[var(--text-secondary)] tabular-nums text-[0.625rem] mt-0.5 block truncate leading-tight">
                    {totalDiscount > 0 ? fmt(totalDiscount) : '0'}
                  </span>
                </div>
                <div className="py-1 px-1 rounded bg-[var(--surface-2)]/60 border border-[var(--border)] dark:border-white/[0.06]">
                  <span className="text-[0.5rem] text-[var(--text-muted)] block truncate font-medium leading-none">
                    {bn ? 'ওয়েভার' : 'Waived'}
                  </span>
                  <span className="font-semibold text-[var(--text-secondary)] tabular-nums text-[0.625rem] mt-0.5 block truncate leading-tight">
                    {totalWaived > 0 ? fmt(totalWaived) : '0'}
                  </span>
                </div>
                <div className="py-1 px-1 rounded bg-[var(--surface-2)]/60 border border-[var(--border)] dark:border-white/[0.06]">
                  <span className="text-[0.5rem] text-[var(--text-muted)] block truncate font-medium leading-none">
                    {bn ? 'বকেয়া' : 'Total Due'}
                  </span>
                  <span
                    className={`font-semibold tabular-nums text-[0.625rem] mt-0.5 block truncate leading-tight ${
                      effectiveDue > 0 ? 'text-[var(--red)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {effectiveDue > 0 ? fmt(effectiveDue) : (bn ? 'পরিশোধিত' : 'Cleared')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Individual Payment Records */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                <span>{bn ? 'পেমেন্ট রেকর্ড' : 'Payment Records'}</span>
                <span className="text-[0.625rem] text-[var(--text-muted)] font-normal font-mono">({payments.length})</span>
              </div>

              {effectiveDue > 0 && canCreate('finance.fees.collect.create') && (
                <button
                  type="button"
                  onClick={handleCollectDue}
                  className="h-6 px-2 rounded-md bg-[var(--brand)] hover:opacity-90 text-white text-[0.625rem] font-medium border-0 cursor-pointer flex items-center gap-1 transition-opacity"
                >
                  <DollarSign size={11} />
                  <span>{bn ? 'বকেয়া আদায়' : 'Collect Due'}</span>
                </button>
              )}
            </div>

            <div className="border border-[var(--border)] dark:border-white/[0.07] rounded-xl overflow-hidden bg-[var(--surface)]">
              {payments.length === 0 ? (
                <div className="text-center py-7 px-4 text-[var(--text-muted)] text-[0.6875rem]">
                  {bn ? 'কোনো পেমেন্ট রেকর্ড নেই' : 'No payment records found'}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[0.6875rem]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)]/70 border-b border-[var(--border)] dark:border-white/[0.07] sticky top-0 z-10 text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                        <th className="text-center w-7 py-1.5 px-2">#</th>
                        <th className="py-1.5 px-2">{bn ? 'রসিদ নং' : 'Receipt No'}</th>
                        <th className="text-center py-1.5 px-2">{bn ? 'তারিখ' : 'Date'}</th>
                        <th className="py-1.5 px-2">{bn ? 'ফি আইটেম' : 'Fee Item'}</th>
                        <th className="text-center py-1.5 px-2">{bn ? 'সময়কাল' : 'Period'}</th>
                        <th className="text-right py-1.5 px-2">{bn ? 'পরিমাণ' : 'Amount'}</th>
                        <th className="text-right py-1.5 px-2">{bn ? 'ছাড়' : 'Disc.'}</th>
                        <th className="text-center py-1.5 px-2">{bn ? 'পদ্ধতি' : 'Method'}</th>
                        <th className="py-1.5 px-2">{bn ? 'সংগ্রাহক' : 'Collected By'}</th>
                        <th className="text-center w-8 py-1.5 px-2">{bn ? 'রসিদ' : 'Print'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] dark:divide-white/[0.05]">
                      {payments.map((p, idx) => {
                        const feeInfo = getFeeInfoForPayment(p)
                        const rcp = p.receiptNo || batchReceiptNo || (p.batchId && parseReceiptNumber(p.batchId) ? formatReceiptNo(parseReceiptNumber(p.batchId)!) : (p.batchId ? `RCP-${p.batchId.slice(-8).toUpperCase()}` : displayReceiptNo))
                        const isCopied = copiedReceipt === rcp

                        return (
                          <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/40 transition-colors">
                            <td className="text-center py-1.5 px-2 text-[var(--text-muted)] font-mono text-[0.625rem]">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(rcp, 'receipt')}
                                className="font-mono text-[var(--brand)] hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors text-[0.625rem]"
                                title={bn ? 'রসিদ নং কপি করুন' : 'Click to copy Receipt No'}
                              >
                                <span>{rcp}</span>
                                {isCopied ? (
                                  <Check size={10} className="text-[var(--green)]" />
                                ) : (
                                  <Copy size={10} className="opacity-40" />
                                )}
                              </button>
                            </td>
                            <td className="text-center py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap text-[0.625rem]">
                              {p.paidAt ? p.paidAt.split('T')[0] : '—'}
                            </td>
                            <td className="py-1.5 px-2">
                              <span className="font-medium text-[var(--text-primary)] block text-[0.6875rem]">
                                {bn ? feeInfo.nameBn : feeInfo.name}
                              </span>
                              {p.note && p.note !== feeInfo.name && (
                                <span className="text-[var(--text-muted)] text-[0.5625rem] truncate max-w-[10rem] block">
                                  {p.note}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-1.5 px-2 text-[var(--text-secondary)] whitespace-nowrap text-[0.625rem]">
                              {formatPeriod(p.forMonth)}
                            </td>
                            <td className="text-right py-1.5 px-2 font-semibold text-[var(--text-primary)] tabular-nums text-[0.6875rem]">
                              ৳{p.amount.toLocaleString()}
                            </td>
                            <td className="text-right py-1.5 px-2 text-[var(--text-muted)] tabular-nums text-[0.625rem]">
                              {p.discount ? `৳${p.discount.toLocaleString()}` : '—'}
                            </td>
                            <td className="text-center py-1.5 px-2">
                              <span className="px-1.5 py-0.5 rounded text-[0.5625rem] font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)] dark:border-white/[0.05]">
                                {methodLabel(p.method)}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-[var(--text-secondary)] truncate max-w-[7.5rem] text-[0.625rem]" title={p.collectedBy || '—'}>
                              {p.collectedBy || '—'}
                            </td>
                            <td className="text-center py-1.5 px-2">
                              <button
                                type="button"
                                onClick={() => handlePrintSingle(p)}
                                className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer mx-auto"
                                title={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
                                aria-label={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
                              >
                                <Printer size={12} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {payments.length > 1 && (
                      <tfoot>
                        <tr className="bg-[var(--bg-secondary)]/50 border-t border-[var(--border)] dark:border-white/[0.07] text-[0.6875rem] font-semibold">
                          <td colSpan={5} className="py-1.5 px-2 text-right text-[var(--text-muted)] text-[0.5625rem] uppercase tracking-wider">
                            {bn ? 'সর্বমোট পরিশোধ:' : 'Total Collected:'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-[var(--text-primary)] tabular-nums">
                            {fmt(totalPaid)}
                          </td>
                          <td className="py-1.5 px-2 text-right text-[var(--text-secondary)] tabular-nums text-[0.625rem]">
                            {totalDiscount > 0 ? fmt(totalDiscount) : '—'}
                          </td>
                          <td colSpan={3} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-3.5 py-2 sm:px-4 border-t border-[var(--border)] dark:border-white/[0.07] bg-[var(--bg-secondary)]/50 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">
            <span>
              {payments.length} {bn ? 'টি পেমেন্ট লেনদেন' : 'payment transaction(s)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {effectiveDue > 0 && canCreate('finance.fees.collect.create') && (
              <button
                type="button"
                onClick={handleCollectDue}
                className="h-6 px-2.5 rounded-md bg-[var(--brand)] hover:opacity-90 text-white text-[0.625rem] font-medium cursor-pointer transition-opacity border-0"
              >
                {bn ? 'বকেয়া আদায়' : 'Collect Due'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-6 px-2.5 rounded-md border border-[var(--border)] dark:border-white/[0.08] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[0.625rem] font-medium cursor-pointer transition-colors"
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
