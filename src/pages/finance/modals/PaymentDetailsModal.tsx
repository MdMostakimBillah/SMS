import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
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
  PieChart as PieChartIcon,
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

  const CHART_PALETTE = useMemo(
    () => ['#6366f1', '#22c55e', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f97316'],
    []
  )

  const allFeePayments = useFeeStore((s) => s.payments)
  const allStudentPayments = useMemo(() => {
    const list = allFeePayments.filter((p) => p.studentId === student.id)
    if (list.length > 0) return list
    return payments
  }, [allFeePayments, student.id, payments])

  const allStudentTotal = useMemo(
    () => allStudentPayments.reduce((s, p) => s + p.amount, 0),
    [allStudentPayments]
  )

  const feeBreakdown = useMemo(() => {
    const map = new Map<string, { id: string; name: string; nameBn: string; value: number; count: number }>()
    allStudentPayments.forEach((p) => {
      const struct = p.feeStructureId ? structureMap.get(p.feeStructureId) : null
      const id = struct?.id || p.feeStructureId || p.note || 'fee'
      const name = struct?.name || p.note || (bn ? 'অন্যান্য ফি' : 'Other Fee')
      const nameBn = struct?.nameBn || p.note || (bn ? 'অন্যান্য ফি' : 'Other Fee')
      const cur = map.get(id) || { id, name, nameBn, value: 0, count: 0 }
      cur.value += p.amount
      cur.count += 1
      map.set(id, cur)
    })
    return Array.from(map.values()).sort((a, b) => b.value - a.value)
  }, [allStudentPayments, structureMap, bn])

  const statusBreakdown = useMemo(() => {
    const items: { name: string; nameBn: string; value: number; color: string }[] = []
    if (totalPaid > 0) {
      items.push({
        name: bn ? 'পরিশোধিত' : 'Paid',
        nameBn: 'পরিশোধিত',
        value: totalPaid,
        color: '#22c55e',
      })
    }
    if (effectiveDue > 0) {
      items.push({
        name: bn ? 'বকেয়া' : 'Due',
        nameBn: 'বকেয়া',
        value: effectiveDue,
        color: '#ef4444',
      })
    }
    if (totalDiscount > 0) {
      items.push({
        name: bn ? 'ছাড়' : 'Discount',
        nameBn: 'ছাড়',
        value: totalDiscount,
        color: '#f59e0b',
      })
    }
    if (totalWaived > 0) {
      items.push({
        name: bn ? 'ওয়েভার' : 'Waived',
        nameBn: 'ওয়েভার',
        value: totalWaived,
        color: '#a855f7',
      })
    }
    return items
  }, [totalPaid, effectiveDue, totalDiscount, totalWaived, bn])

  const [chartMode, setChartMode] = useState<'all' | 'status'>('all')

  const chartData = useMemo(() => {
    if (chartMode === 'all') {
      if (feeBreakdown.length > 0) {
        return feeBreakdown.map((item, idx) => ({
          ...item,
          color: CHART_PALETTE[idx % CHART_PALETTE.length],
        }))
      }
      return [
        {
          id: 'paid',
          name: effectiveFee.name || (bn ? 'পরিশোধিত ফি' : 'Paid Fee'),
          nameBn: effectiveFee.nameBn || (bn ? 'পরিশোধিত ফি' : 'Paid Fee'),
          value: totalPaid || 1,
          color: '#6366f1',
          count: 1,
        },
      ]
    } else {
      if (statusBreakdown.length > 0) return statusBreakdown
      return [
        {
          name: bn ? 'পরিশোধিত' : 'Paid',
          nameBn: 'পরিশোধিত',
          value: totalPaid || 1,
          color: '#22c55e',
        },
      ]
    }
  }, [chartMode, feeBreakdown, statusBreakdown, effectiveFee, totalPaid, bn, CHART_PALETTE])

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
          dot: '#22c55e',
        }
      case 'bank':
        return {
          bg: 'rgba(99, 102, 241, 0.12)',
          color: 'var(--brand, #6366f1)',
          dot: '#6366f1',
        }
      case 'mobile':
        return {
          bg: 'rgba(20, 184, 166, 0.12)',
          color: 'var(--teal, #14b8a6)',
          dot: '#14b8a6',
        }
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.12)',
          color: 'var(--text-muted, #9ca3af)',
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
      className="fixed inset-0 z-[600] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-[96vw] max-w-5xl xl:max-w-6xl h-auto max-h-[92vh] flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-primary)] my-auto ring-1 ring-black/5 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/90 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0 shadow-2xs">
              <Banknote size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--text-muted)] font-medium">
                <span>{bn ? 'ফি ব্যবস্থাপনা' : 'Fee Ledger'}</span>
                <span>/</span>
                <span className="text-[var(--text-secondary)] font-medium truncate max-w-[14rem]">
                  {bn ? effectiveFee.nameBn || effectiveFee.name : effectiveFee.name}
                </span>
                {session && (
                  <>
                    <span>/</span>
                    <span className="font-mono text-[var(--brand)] text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded bg-[var(--brand-light)]">
                      {session}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight tracking-tight mt-0.5">
                {bn ? 'পেমেন্ট ও বকেয়া বিবরণ' : 'Payment Details'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {payments.length > 0 && (
              <button
                type="button"
                onClick={handlePrintAll}
                className="glass h-8.5 px-3.5 rounded-xl bg-[var(--brand-light)] hover:bg-[var(--brand)] text-[var(--brand)] hover:text-white hover:border-[var(--brand)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                title={bn ? 'সব রসিদ প্রিন্ট' : 'Print Receipt'}
                aria-label={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
              >
                <Printer size={14} />
                <span>{bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="glass h-8.5 w-8.5 rounded-xl flex items-center justify-center bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              aria-label={bn ? 'বন্ধ করুন' : 'Close'}
              title="Esc"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
          {/* Student Info & Financial Analytics Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
            {/* Left 5 cols: Student Profile Card */}
            <div className="lg:col-span-5 glass bg-[var(--bg-secondary)]/50 border border-[var(--glass-border)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-2xl overflow-hidden flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)] font-bold text-xl shrink-0 shadow-xs border border-[var(--brand)]/20">
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
                        className="glass font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/20 inline-flex items-center gap-1 transition-all cursor-pointer hover:bg-[var(--brand)] hover:text-white"
                        title={bn ? 'আইডি কপি করুন' : 'Click to copy ID'}
                      >
                        <span className="text-[0.625rem] opacity-75 font-sans">ID:</span>
                        <span>{student.id}</span>
                        {copiedId ? (
                          <Check size={11} className="text-[var(--green)]" />
                        ) : (
                          <Copy size={11} className="opacity-60" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[0.6875rem]">
                        <GraduationCap size={12} className="text-[var(--brand)]" />
                        <span className="text-[var(--text-muted)]">{bn ? 'শ্রেণি:' : 'Class:'}</span>
                        <strong className="text-[var(--text-primary)] font-semibold">{student.class}</strong>
                      </span>

                      {student.section && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[0.6875rem]">
                          <Layers size={12} className="text-[var(--brand)]" />
                          <span className="text-[var(--text-muted)]">{bn ? 'শাখা:' : 'Sec:'}</span>
                          <strong className="text-[var(--text-primary)] font-semibold">{student.section}</strong>
                        </span>
                      )}

                      {student.roll && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[0.6875rem]">
                          <Hash size={12} className="text-[var(--brand)]" />
                          <span className="text-[var(--text-muted)]">{bn ? 'রোল:' : 'Roll:'}</span>
                          <strong className="text-[var(--text-primary)] font-semibold">{student.roll}</strong>
                        </span>
                      )}

                      {session && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--glass-border)] text-[0.6875rem]">
                          <Calendar size={12} className="text-[var(--brand)]" />
                          <span className="text-[var(--text-muted)]">{bn ? 'সেশন:' : 'Session:'}</span>
                          <strong className="text-[var(--text-primary)] font-semibold">{session}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[0.6875rem]">
                  <Receipt size={12} className="text-[var(--brand)]" />
                  <span>{allStudentPayments.length} {bn ? 'টি মোট পেমেন্ট লেনদেন' : 'total payment records'}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/20 shrink-0">
                  <Sparkles size={11} />
                  {effectiveFee.type === 'monthly' ? (bn ? 'মাসিক ফি' : 'Monthly Fee') :
                   effectiveFee.type === 'yearly' ? (bn ? 'বাৎসরিক ফি' : 'Yearly Fee') :
                   (bn ? 'এককালীন ফি' : 'One-time Fee')}
                </span>
              </div>
            </div>

            {/* Right 7 cols: Financial Analytics & Animated Donut Chart */}
            <div className="lg:col-span-7 glass bg-[var(--bg-secondary)]/50 border border-[var(--glass-border)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
              {/* Header with Title & Mode Switcher */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center">
                    <PieChartIcon size={13} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    {bn ? 'পেমেন্ট অ্যানালিটিক্স' : 'Payment Analytics'}
                  </span>
                </div>

                <div className="inline-flex items-center rounded-lg border border-[var(--glass-border)] bg-[var(--bg-primary)] p-0.5 text-[0.6875rem]">
                  <button
                    type="button"
                    onClick={() => setChartMode('all')}
                    className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                      chartMode === 'all'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {bn ? 'সকল ফি' : 'All Fees'} ({feeBreakdown.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('status')}
                    className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                      chartMode === 'status'
                        ? 'bg-[var(--brand)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {bn ? 'অবস্থা' : 'Status'}
                  </button>
                </div>
              </div>

              {/* Chart + Slices Legend */}
              <div className="flex items-center gap-4 my-2 flex-col sm:flex-row">
                {/* Donut Chart */}
                <div className="relative w-[130px] h-[130px] shrink-0 mx-auto sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={130} minHeight={130} initialDimension={{ width: 130, height: 130 }}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={54}
                        dataKey="value"
                        paddingAngle={chartData.length > 1 ? 3 : 0}
                        isAnimationActive={true}
                        animationDuration={600}
                      >
                        {chartData.map((e, i) => (
                          <Cell key={i} fill={e.color} stroke="var(--surface)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`৳${Number(val || 0).toLocaleString()}`, '']}
                        contentStyle={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--glass-border)',
                          borderRadius: '0.75rem',
                          boxShadow: 'var(--glass-shadow)',
                          color: 'var(--text-primary)',
                          fontSize: '0.75rem',
                          padding: '6px 10px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xs sm:text-sm font-black text-[var(--text-primary)] leading-tight tabular-nums">
                      {chartMode === 'all' ? fmt(allStudentTotal) : `${paidPercentage}%`}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] font-medium leading-none mt-0.5">
                      {chartMode === 'all' ? (bn ? 'সকল ফি' : 'All Fees') : (bn ? 'পরিশোধিত' : 'Settled')}
                    </span>
                  </div>
                </div>

                {/* Slices Legend */}
                <div className="flex-1 w-full min-w-0 max-h-[130px] overflow-y-auto space-y-1.5 pr-1">
                  {chartData.map((item, idx) => {
                    const totalVal = chartMode === 'all' ? allStudentTotal : (totalPaid + effectiveDue + totalDiscount + totalWaived)
                    const pct = totalVal > 0 ? Math.round((item.value / totalVal) * 100) : 100
                    return (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate text-[var(--text-secondary)] font-medium text-[0.6875rem]">
                            {bn ? item.nameBn || item.name : item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-[var(--text-primary)] tabular-nums text-[0.6875rem]">
                            ৳{item.value.toLocaleString()}
                          </span>
                          <span className="text-[9px] px-1 rounded font-mono text-[var(--text-muted)] bg-[var(--bg-primary)]">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 4 Financial KPI Figures in sleek glass pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-[var(--glass-border)] text-center">
                <div className="glass px-2.5 py-1.5 rounded-xl bg-[var(--green-light)]/30 border border-emerald-500/15">
                  <span className="text-[0.5625rem] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
                    {bn ? 'পরিশোধিত' : 'Total Paid'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[var(--green)] tabular-nums mt-0.5 block">
                    {fmt(totalPaid)}
                  </span>
                </div>

                <div className="glass px-2.5 py-1.5 rounded-xl bg-[var(--amber-light)]/30 border border-amber-500/15">
                  <span className="text-[0.5625rem] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
                    {bn ? 'ছাড়' : 'Discount'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[var(--amber)] tabular-nums mt-0.5 block">
                    {fmt(totalDiscount)}
                  </span>
                </div>

                <div className="glass px-2.5 py-1.5 rounded-xl bg-[var(--purple-light)]/30 border border-purple-500/15">
                  <span className="text-[0.5625rem] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
                    {bn ? 'ওয়েভার' : 'Waived'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[var(--purple)] tabular-nums mt-0.5 block">
                    {fmt(totalWaived)}
                  </span>
                </div>

                <div className="glass px-2.5 py-1.5 rounded-xl border border-[var(--glass-border)]">
                  <span className="text-[0.5625rem] uppercase font-bold text-[var(--text-muted)] block tracking-wider">
                    {bn ? 'অবশিষ্ট বকেয়া' : 'Total Due'}
                  </span>
                  <span className={`text-xs sm:text-sm font-black tabular-nums mt-0.5 block ${effectiveDue > 0 ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
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
                <Receipt size={14} className="text-[var(--brand)]" />
                <h5 className="text-sm font-bold text-[var(--text-primary)]">
                  {bn ? 'পেমেন্ট রেকর্ডসমূহ' : 'Payment Records'}
                </h5>
                <span className="px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {payments.length}
                </span>
              </div>

              {effectiveDue > 0 && canCreate('finance.fees.collect.create') && (
                <button
                  type="button"
                  onClick={handleCollectDue}
                  className="h-7.5 px-3 rounded-lg bg-[var(--green)] hover:opacity-90 text-white text-xs font-semibold border-0 cursor-pointer flex items-center gap-1.5 transition-opacity"
                >
                  <DollarSign size={13} />
                  <span>{bn ? 'বকেয়া পরিশোধ করুন' : 'Collect Due'}</span>
                </button>
              )}
            </div>

            <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--bg-primary)] shadow-2xs">
              {payments.length === 0 ? (
                <div className="text-center py-12 px-4 text-[var(--text-muted)] text-xs">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--amber-light)] text-[var(--amber)] flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                    <ShieldAlert size={20} />
                  </div>
                  <h6 className="font-bold text-[var(--text-primary)] text-sm mb-1">
                    {bn ? 'কোনো পেমেন্ট রেকর্ড নেই' : 'No payment records found'}
                  </h6>
                  <p className="text-[var(--text-muted)] max-w-sm mx-auto text-xs">
                    {bn ? 'এই শিক্ষার্থীর জন্য এই ফি আইটেমে এখনও কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।' : 'No payment records have been registered for this student under this fee structure yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-10 backdrop-blur-xs">
                        <th className="text-center w-12 py-3 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">#</th>
                        <th className="text-left min-w-[9rem] py-3 px-3.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'রসিদ নং' : 'Receipt No'}</th>
                        <th className="text-center min-w-[7rem] py-3 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'তারিখ' : 'Date'}</th>
                        <th className="text-left min-w-[10rem] py-3 px-3.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'ফি আইটেম' : 'Fee Item'}</th>
                        <th className="text-center min-w-[6.5rem] py-3 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'সময়কাল' : 'Period'}</th>
                        <th className="text-right min-w-[6.5rem] py-3 px-3.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'পরিমাণ' : 'Amount'}</th>
                        <th className="text-right min-w-[5.5rem] py-3 px-3 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'ছাড়' : 'Disc.'}</th>
                        <th className="text-center min-w-[6rem] py-3 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'পদ্ধতি' : 'Method'}</th>
                        <th className="text-left min-w-[8rem] py-3 px-3.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'সংগ্রাহক' : 'Collected By'}</th>
                        <th className="text-center w-14 py-3 px-2.5 text-[0.6875rem] uppercase font-bold text-[var(--text-muted)] tracking-wider">{bn ? 'রসিদ' : 'Print'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {payments.map((p, idx) => {
                        const feeInfo = getFeeInfoForPayment(p)
                        const rcp = p.receiptNo || batchReceiptNo || (p.batchId && parseReceiptNumber(p.batchId) ? formatReceiptNo(parseReceiptNumber(p.batchId)!) : (p.batchId ? `RCP-${p.batchId.slice(-8).toUpperCase()}` : displayReceiptNo))
                        const badgeStyle = methodBadgeStyle(p.method)
                        const isCopied = copiedReceipt === rcp

                        return (
                          <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/60 transition-colors group">
                            <td className="text-center py-2.5 px-2.5 text-[var(--text-muted)] font-mono text-[0.6875rem]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3.5">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(rcp, 'receipt')}
                                className="glass font-mono font-semibold text-xs text-[var(--brand)] px-2.5 py-0.5 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]/20 inline-flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[var(--brand)] hover:text-white"
                                title={bn ? 'রসিদ নং কপি করুন' : 'Click to copy Receipt No'}
                              >
                                <span>{rcp}</span>
                                {isCopied ? (
                                  <Check size={11} className="text-[var(--green)]" />
                                ) : (
                                  <Copy size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            </td>
                            <td className="text-center py-2.5 px-2.5 text-[var(--text-secondary)] tabular-nums whitespace-nowrap text-xs">
                              {p.paidAt ? p.paidAt.split('T')[0] : '—'}
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="font-bold text-[var(--text-primary)]">
                                {bn ? feeInfo.nameBn : feeInfo.name}
                              </div>
                              {p.note && p.note !== feeInfo.name && (
                                <div className="text-[0.6875rem] text-[var(--text-muted)] truncate max-w-[14rem] mt-0.5">
                                  {p.note}
                                </div>
                              )}
                            </td>
                            <td className="text-center py-2.5 px-2.5 text-[var(--text-secondary)] whitespace-nowrap text-xs">
                              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.6875rem] font-semibold text-[var(--text-secondary)]">
                                {formatPeriod(p.forMonth)}
                              </span>
                            </td>
                            <td className="text-right py-2.5 px-3.5 font-black text-[var(--green)] tabular-nums text-xs">
                              ৳{p.amount.toLocaleString()}
                            </td>
                            <td className="text-right py-2.5 px-3 text-[var(--amber)] tabular-nums font-bold text-xs">
                              {p.discount ? `৳${p.discount.toLocaleString()}` : '—'}
                            </td>
                            <td className="text-center py-2.5 px-2.5">
                              <span
                                className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full"
                                style={{
                                  background: badgeStyle.bg,
                                  color: badgeStyle.color,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: badgeStyle.dot }}
                                />
                                {methodLabel(p.method)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 text-[var(--text-secondary)]">
                              <div className="flex items-center gap-1.5 text-xs truncate max-w-[9.5rem]" title={p.collectedBy || '—'}>
                                <div className="w-4.5 h-4.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0">
                                  <User size={10} className="text-[var(--text-muted)]" />
                                </div>
                                <span className="truncate font-medium">{p.collectedBy || '—'}</span>
                              </div>
                            </td>
                            <td className="text-center py-2.5 px-2.5">
                              <button
                                type="button"
                                onClick={() => handlePrintSingle(p)}
                                className="glass w-7.5 h-7.5 rounded-lg bg-[var(--green-light)] hover:bg-[var(--green)] hover:text-white text-[var(--green)] hover:border-[var(--green)] cursor-pointer flex items-center justify-center mx-auto transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
                        <tr className="bg-[var(--bg-secondary)] font-bold border-t border-[var(--border)] text-xs">
                          <td colSpan={5} className="py-2.5 px-3.5 text-[var(--text-secondary)] text-right">
                            {bn ? 'সর্বমোট পরিশোধ:' : 'Total Collected:'}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-black text-[var(--green)] tabular-nums">
                            {fmt(totalPaid)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[var(--amber)] tabular-nums">
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
                <ShieldCheck size={14} className="text-[var(--purple)]" />
                <h5 className="text-xs font-semibold text-[var(--text-primary)]">
                  {bn ? 'অনুমোদিত ওয়েভারসমূহ' : 'Approved Waivers'}
                </h5>
                <span className="px-2 py-0.5 rounded-full text-[0.6875rem] font-medium bg-[var(--purple-light)] text-[var(--purple)] border border-[var(--border)]">
                  {resolvedWaivers.length}
                </span>
              </div>
              <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-primary)] p-2.5 space-y-1.5">
                {resolvedWaivers.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[var(--purple-light)] text-[var(--purple)] flex items-center justify-center shrink-0">
                        <AlertCircle size={12} />
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--text-primary)] block text-xs">
                          {(bn ? w.reasonBn || w.reason : w.reason) || (bn ? 'সাধারণ ওয়েভার' : 'General Waiver')}
                        </span>
                        {w.createdAt && (
                          <span className="text-[var(--text-muted)] text-[0.625rem]">
                            {bn ? 'অনুমোদনের তারিখ: ' : 'Approved on: '} {w.createdAt.split('T')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-[var(--purple)] text-xs tabular-nums">
                      {fmt(w.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3.5 sm:px-6 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xs flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2.5 flex-wrap">
            <div className="w-5 h-5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
              <Receipt size={12} className="text-[var(--brand)]" />
            </div>
            <span className="font-medium">
              {payments.length} {bn ? 'টি পেমেন্ট লেনদেন' : 'payment transaction(s)'}
            </span>
            <span className="text-[var(--border)]">•</span>
            <span className="font-medium text-[var(--text-secondary)]">
              {bn ? 'মোট আদায়:' : 'Total Paid:'}{' '}
              <strong className="text-[var(--green)] font-black tabular-nums">{fmt(totalPaid)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {effectiveDue > 0 && canCreate('finance.fees.collect.create') && (
              <button
                type="button"
                onClick={handleCollectDue}
                className="h-8.5 px-4 rounded-xl bg-[var(--green)] hover:opacity-90 text-white text-xs font-bold border-0 cursor-pointer flex items-center gap-1.5 transition-opacity shadow-xs"
              >
                <CheckCircle2 size={14} />
                <span>{bn ? 'বকেয়া আদায়' : 'Collect Due'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="glass h-8.5 px-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
