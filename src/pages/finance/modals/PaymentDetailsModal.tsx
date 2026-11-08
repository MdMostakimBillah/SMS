import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Printer,
  Calendar,
  Banknote,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Copy,
  Check,
  GraduationCap,
  Layers,
  Hash,
  User,
  ShieldAlert,
  AlertCircle,
  Sparkles,
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

  const methodBadgeStyle = (m: string) => {
    switch (m) {
      case 'cash':
        return {
          bg: 'rgba(34, 197, 94, 0.12)',
          color: 'var(--green, #22c55e)',
          border: 'rgba(34, 197, 94, 0.25)',
          dot: '#22c55e',
        }
      case 'bank':
        return {
          bg: 'rgba(99, 102, 241, 0.12)',
          color: 'var(--brand, #6366f1)',
          border: 'rgba(99, 102, 241, 0.25)',
          dot: '#6366f1',
        }
      case 'mobile':
        return {
          bg: 'rgba(20, 184, 166, 0.12)',
          color: 'var(--teal, #14b8a6)',
          border: 'rgba(20, 184, 166, 0.25)',
          dot: '#14b8a6',
        }
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.12)',
          color: 'var(--text-muted, #9ca3af)',
          border: 'rgba(156, 163, 175, 0.25)',
          dot: '#9ca3af',
        }
    }
  }

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
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-[90vw] h-auto max-h-[90vh] flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/10 dark:ring-white/5 overflow-hidden text-[var(--text-primary)] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Accent */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[var(--brand)]/10 via-[var(--brand)]/[0.02] to-transparent pointer-events-none" />

        {/* Modal Top Header Bar */}
        <div className="relative px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/95 backdrop-blur-sm shrink-0 z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20 flex items-center justify-center shrink-0 shadow-2xs">
              <Banknote size={20} className="stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[0.75rem] text-[var(--text-muted)] font-medium">
                <span>{bn ? 'ফি ব্যবস্থাপনা' : 'Fee Ledger'}</span>
                <span className="text-[var(--border-2)]">/</span>
                <span className="text-[var(--text-secondary)] font-semibold truncate max-w-[14rem]">
                  {bn ? effectiveFee.nameBn || effectiveFee.name : effectiveFee.name}
                </span>
                {session && (
                  <>
                    <span className="text-[var(--border-2)]">/</span>
                    <span className="font-mono text-[var(--brand)] text-[0.6875rem] font-bold px-1.5 py-0.2 rounded bg-[var(--brand)]/10">
                      {session}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-[1.125rem] sm:text-[1.25rem] font-bold text-[var(--text-primary)] leading-tight tracking-tight mt-0.5">
                {bn ? 'পেমেন্ট ও বকেয়া বিবরণ' : 'Payment Details'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {payments.length > 0 && (
              <button
                type="button"
                onClick={handlePrintAll}
                className="h-8.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)] text-[var(--text-secondary)] text-[0.75rem] font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-xs group"
                title={bn ? 'সব রসিদ প্রিন্ট' : 'Print Receipt'}
                aria-label={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
              >
                <Printer size={14} className="group-hover:scale-105 transition-transform" />
                <span>{bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8.5 h-8.5 rounded-xl flex items-center justify-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-all hover:rotate-90"
              aria-label={bn ? 'বন্ধ করুন' : 'Close'}
              title="Esc"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Body Container */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
          {/* Executive Student & Financial Balance Split Overview Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 6 cols: Student & Payer Identity Card */}
            <div className="lg:col-span-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl ring-2 ring-[var(--brand)]/30 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--brand)]/20 to-[var(--brand)]/5 text-[var(--brand)] font-black text-xl shrink-0 shadow-xs">
                  {student.photo ? (
                    <img src={student.photo} alt={student.nameEn} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(student.nameEn || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight truncate">
                      {bn ? student.nameBn || student.nameEn : student.nameEn}
                    </h4>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(student.id, 'id')}
                      className="font-mono text-[0.7rem] font-bold px-2 py-0.5 rounded-md bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20 hover:bg-[var(--brand)]/20 inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title={bn ? 'আইডি কপি করুন' : 'Click to copy ID'}
                    >
                      <span className="text-[var(--brand)]/70 text-[0.625rem] font-semibold">ID:</span>
                      <span>{student.id}</span>
                      {copiedId ? (
                        <Check size={11} className="text-emerald-500" />
                      ) : (
                        <Copy size={11} className="opacity-60" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)] mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] font-medium">
                      <GraduationCap size={12} className="text-[var(--brand)]" />
                      <span className="text-[var(--text-muted)]">{bn ? 'শ্রেণি:' : 'Class:'}</span>
                      <strong className="text-[var(--text-primary)] font-semibold">{student.class}</strong>
                    </span>

                    {student.section && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] font-medium">
                        <Layers size={12} className="text-[var(--brand)]" />
                        <span className="text-[var(--text-muted)]">{bn ? 'শাখা:' : 'Sec:'}</span>
                        <strong className="text-[var(--text-primary)] font-semibold">{student.section}</strong>
                      </span>
                    )}

                    {student.roll && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] font-medium">
                        <Hash size={12} className="text-[var(--brand)]" />
                        <span className="text-[var(--text-muted)]">{bn ? 'রোল:' : 'Roll:'}</span>
                        <strong className="text-[var(--text-primary)] font-semibold">{student.roll}</strong>
                      </span>
                    )}

                    {session && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] font-medium">
                        <Calendar size={12} className="text-[var(--brand)]" />
                        <span className="text-[var(--text-muted)]">{bn ? 'সেশন:' : 'Session:'}</span>
                        <strong className="text-[var(--text-primary)] font-semibold">{session}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fee Specification Strip */}
              <div className="mt-3.5 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="text-[var(--text-secondary)] font-medium truncate">
                  {bn ? effectiveFee.nameBn || effectiveFee.name : effectiveFee.name}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20 shrink-0">
                  <Sparkles size={10} />
                  {effectiveFee.type === 'monthly' ? (bn ? 'মাসিক ফি' : 'Monthly Fee') :
                   effectiveFee.type === 'yearly' ? (bn ? 'বাৎসরিক ফি' : 'Yearly Fee') :
                   (bn ? 'এককালীন ফি' : 'One-time Fee')}
                </span>
              </div>
            </div>

            {/* Right 6 cols: Financial Statement & Ledger Breakdown */}
            <div className="lg:col-span-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    {bn ? 'মোট প্রদেয় ফি' : 'Total Payable'}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tabular-nums">
                    {fmt(totalOriginal)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)] block">
                    {paidPercentage}% {bn ? 'পরিশোধ' : 'settled'}
                  </span>
                  <div className="w-28 sm:w-32 h-2 rounded-full bg-[var(--border)] overflow-hidden mt-1 ml-auto">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${paidPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 4 Financial KPI Figures in clean grid */}
              <div className="grid grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-[var(--border)] text-center">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-primary)] border border-emerald-500/25">
                  <span className="text-[0.625rem] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider">
                    {bn ? 'পরিশোধিত' : 'Total Paid'}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmt(totalPaid)}
                  </span>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-primary)] border border-amber-500/25">
                  <span className="text-[0.625rem] uppercase font-bold text-amber-600 dark:text-amber-400 block tracking-wider">
                    {bn ? 'ছাড়' : 'Discount'}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    {fmt(totalDiscount)}
                  </span>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--bg-primary)] border border-purple-500/25">
                  <span className="text-[0.625rem] uppercase font-bold text-purple-600 dark:text-purple-400 block tracking-wider">
                    {bn ? 'ওয়েভার' : 'Waived'}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
                    {fmt(totalWaived)}
                  </span>
                </div>

                <div className={`p-2 sm:p-2.5 rounded-xl border ${effectiveDue > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/25'}`}>
                  <span className={`text-[0.625rem] uppercase font-bold block tracking-wider ${effectiveDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {bn ? 'অবশিষ্ট বকেয়া' : 'Total Due'}
                  </span>
                  <span className={`text-sm sm:text-base font-extrabold tabular-nums ${effectiveDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {effectiveDue > 0 ? fmt(effectiveDue) : (bn ? 'পরিশোধিত' : 'Cleared')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Records Section & Invoice Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5.5 h-5.5 rounded-md bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
                  <Receipt size={13} />
                </div>
                <h5 className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                  {bn ? 'পেমেন্ট রেকর্ডসমূহ' : 'Payment Records'}
                </h5>
                <span className="px-2 py-0.2 rounded-full text-[0.6875rem] font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {payments.length}
                </span>
              </div>

              {effectiveDue > 0 && canCreate('finance.fees.collect.create') && (
                <button
                  type="button"
                  onClick={handleCollectDue}
                  className="h-7.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[0.75rem] font-semibold border-0 cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <DollarSign size={13} />
                  <span>{bn ? 'বকেয়া পরিশোধ করুন' : 'Collect Due'}</span>
                </button>
              )}
            </div>

            <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg-primary)] shadow-2xs">
              {payments.length === 0 ? (
                <div className="text-center py-12 px-4 text-[var(--text-muted)] text-[0.8125rem]">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto mb-2.5">
                    <ShieldAlert size={20} />
                  </div>
                  <h6 className="font-bold text-[var(--text-primary)] text-[0.875rem] mb-1">
                    {bn ? 'কোনো পেমেন্ট রেকর্ড নেই' : 'No payment records found'}
                  </h6>
                  <p className="text-[var(--text-muted)] max-w-sm mx-auto text-[0.75rem]">
                    {bn ? 'এই শিক্ষার্থীর জন্য এই ফি আইটেমে এখনও কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।' : 'No payment records have been registered for this student under this fee structure yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[22rem] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[0.8125rem]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-10">
                        <th className="text-center w-10 py-2.5 px-2 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">#</th>
                        <th className="text-left min-w-[9rem] py-2.5 px-3 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'রসিদ নং' : 'Receipt No'}</th>
                        <th className="text-center min-w-[6.5rem] py-2.5 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'তারিখ' : 'Date'}</th>
                        <th className="text-left min-w-[9.5rem] py-2.5 px-3 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'ফি আইটেম' : 'Fee Item'}</th>
                        <th className="text-center min-w-[6.5rem] py-2.5 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'সময়কাল' : 'Period'}</th>
                        <th className="text-right min-w-[6.5rem] py-2.5 px-3 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'পরিমাণ' : 'Amount'}</th>
                        <th className="text-right min-w-[5.5rem] py-2.5 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'ছাড়' : 'Disc.'}</th>
                        <th className="text-center min-w-[6rem] py-2.5 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'পদ্ধতি' : 'Method'}</th>
                        <th className="text-left min-w-[8rem] py-2.5 px-3 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'সংগ্রাহক' : 'Collected By'}</th>
                        <th className="text-center w-14 py-2.5 px-2 text-[0.6875rem] uppercase font-bold text-[var(--text-secondary)] tracking-wider">{bn ? 'রসিদ' : 'Print'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {payments.map((p, idx) => {
                        const feeInfo = getFeeInfoForPayment(p)
                        const rcp = p.receiptNo || batchReceiptNo || (p.batchId && parseReceiptNumber(p.batchId) ? formatReceiptNo(parseReceiptNumber(p.batchId)!) : (p.batchId ? `RCP-${p.batchId.slice(-8).toUpperCase()}` : displayReceiptNo))
                        const badgeStyle = methodBadgeStyle(p.method)
                        const isCopied = copiedReceipt === rcp

                        return (
                          <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                            <td className="text-center py-2.5 px-2 text-[var(--text-muted)] font-mono text-[0.75rem]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(rcp, 'receipt')}
                                className="font-mono font-semibold text-[0.75rem] text-[var(--brand)] px-2 py-0.5 rounded-md bg-[var(--brand)]/10 border border-[var(--brand)]/20 hover:bg-[var(--brand)]/20 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title={bn ? 'রসিদ নং কপি করুন' : 'Click to copy Receipt No'}
                              >
                                <span>{rcp}</span>
                                {isCopied ? (
                                  <Check size={11} className="text-emerald-500" />
                                ) : (
                                  <Copy size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            </td>
                            <td className="text-center py-2.5 px-2.5 text-[var(--text-secondary)] tabular-nums whitespace-nowrap text-[0.75rem] font-medium">
                              {p.paidAt ? p.paidAt.split('T')[0] : '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[var(--text-primary)]">
                                {bn ? feeInfo.nameBn : feeInfo.name}
                              </div>
                              {p.note && p.note !== feeInfo.name && (
                                <div className="text-[0.6875rem] text-[var(--text-muted)] truncate max-w-[13rem] mt-0.5">
                                  {p.note}
                                </div>
                              )}
                            </td>
                            <td className="text-center py-2.5 px-2.5 text-[var(--text-secondary)] whitespace-nowrap text-[0.75rem]">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.6875rem] font-semibold text-[var(--text-secondary)]">
                                {formatPeriod(p.forMonth)}
                              </span>
                            </td>
                            <td className="text-right py-2.5 px-3 font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums text-[0.8125rem]">
                              ৳{p.amount.toLocaleString()}
                            </td>
                            <td className="text-right py-2.5 px-2.5 text-amber-600 dark:text-amber-400 tabular-nums font-semibold text-[0.75rem]">
                              {p.discount ? `৳${p.discount.toLocaleString()}` : '—'}
                            </td>
                            <td className="text-center py-2.5 px-2.5">
                              <span
                                className="inline-flex items-center gap-1 text-[0.6875rem] font-bold px-2 py-0.5 rounded-full border"
                                style={{
                                  background: badgeStyle.bg,
                                  color: badgeStyle.color,
                                  borderColor: badgeStyle.border,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: badgeStyle.dot }}
                                />
                                {methodLabel(p.method)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                              <div className="flex items-center gap-1.5 text-[0.75rem] truncate max-w-[9rem]" title={p.collectedBy || '—'}>
                                <div className="w-4.5 h-4.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0">
                                  <User size={10} className="text-[var(--text-muted)]" />
                                </div>
                                <span className="truncate font-medium">{p.collectedBy || '—'}</span>
                              </div>
                            </td>
                            <td className="text-center py-2.5 px-2">
                              <button
                                type="button"
                                onClick={() => handlePrintSingle(p)}
                                className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--brand)] hover:text-white border border-[var(--border)] hover:border-[var(--brand)] text-[var(--text-secondary)] cursor-pointer flex items-center justify-center mx-auto transition-all shadow-2xs"
                                title={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
                                aria-label={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
                              >
                                <Printer size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {payments.length > 1 && (
                      <tfoot>
                        <tr className="bg-[var(--bg-secondary)]/80 font-bold border-t-2 border-[var(--border)] text-[0.8125rem]">
                          <td colSpan={5} className="py-2.5 px-3 text-[var(--text-secondary)] text-right">
                            {bn ? 'সর্বমোট পরিশোধ:' : 'Total Collected:'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {fmt(totalPaid)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
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

          {/* Waivers Section (if any waivers exist) */}
          {resolvedWaivers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-purple-500" />
                <h5 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
                  {bn ? 'অনুমোদিত ওয়েভারসমূহ' : 'Approved Waivers'}
                </h5>
                <span className="px-2 py-0.2 rounded-full text-[0.6875rem] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {resolvedWaivers.length}
                </span>
              </div>
              <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg-primary)] p-3 space-y-1.5 shadow-2xs">
                {resolvedWaivers.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-[0.8125rem] p-2.5 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-6.5 h-6.5 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <AlertCircle size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block text-xs">
                          {(bn ? w.reasonBn || w.reason : w.reason) || (bn ? 'সাধারণ ওয়েভার' : 'General Waiver')}
                        </span>
                        {w.createdAt && (
                          <span className="text-[var(--text-muted)] text-[0.625rem]">
                            {bn ? 'অনুমোদনের তারিখ: ' : 'Approved on: '} {w.createdAt.split('T')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-black text-purple-600 dark:text-purple-400 text-[0.875rem] tabular-nums">
                      {fmt(w.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm flex items-center justify-between flex-wrap gap-3 shrink-0 z-10">
          <div className="text-[0.75rem] text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
            <Receipt size={12} className="text-[var(--text-muted)]" />
            <span>
              {payments.length} {bn ? 'টি পেমেন্ট লেনদেন' : 'payment transaction(s)'}
            </span>
            <span className="text-[var(--border)]">|</span>
            <span className="font-semibold text-[var(--text-secondary)]">
              {bn ? 'মোট আদায়:' : 'Total Paid:'}{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-black">{fmt(totalPaid)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {effectiveDue > 0 && canCreate('finance.fees.collect.create') && (
              <button
                type="button"
                onClick={handleCollectDue}
                className="h-8.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-[0.75rem] font-bold border-0 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
              >
                <CheckCircle2 size={14} />
                <span>{bn ? 'বকেয়া আদায়' : 'Collect Due'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8.5 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] text-[0.75rem] font-semibold cursor-pointer transition-colors shadow-2xs"
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
