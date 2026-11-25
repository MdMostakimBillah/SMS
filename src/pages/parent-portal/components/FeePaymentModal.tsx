import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ShieldCheck, ArrowRight, Loader2, CreditCard, Clock } from 'lucide-react'
import type { PortalChild, FeeItem } from '../types'
import { PaymentMethodLogo } from '@/components/ui/PaymentMethodLogo'
import { selectCls } from '@/lib/styles'

interface FeePaymentModalProps {
  isOpen?: boolean
  child: PortalChild
  fees?: FeeItem[]
  fee?: FeeItem
  onClose: () => void
  onSuccess: (amount: number, trxId: string, feeId?: string, method?: string, phone?: string) => void
  isBn: boolean
}

export const FeePaymentModal = React.memo(function FeePaymentModal({
  isOpen,
  child,
  fees,
  fee,
  onClose,
  onSuccess,
  isBn,
}: FeePaymentModalProps) {
  const feeList = fees || (fee ? [fee] : [])
  const dueFees = feeList.filter((f) => f.due > 0 && f.status !== 'pending')
  const fallbackDueFees = dueFees.length > 0 ? dueFees : feeList.filter((f) => f.due > 0)

  const [selectedFeeId, setSelectedFeeId] = useState<string>(fee?.id || fallbackDueFees[0]?.id || '')
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash')
  const [phone, setPhone] = useState(
    child?.guardianPhone ? child.guardianPhone.replace(/[^0-9]/g, '').slice(-11) : ''
  )
  const initialFee = feeList.find((f) => f.id === (fee?.id || fallbackDueFees[0]?.id)) || fallbackDueFees[0]
  const [customAmount, setCustomAmount] = useState<string>(initialFee ? String(initialFee.due) : '')
  const [trxId, setTrxId] = useState('')
  const [lastTrx, setLastTrx] = useState('')
  const [lastPaidAmount, setLastPaidAmount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeFee = feeList.find((f) => f.id === selectedFeeId) || fallbackDueFees[0]
  const maxDue = activeFee ? activeFee.due : 0

  const handleSelectFeeChange = (nextFeeId: string) => {
    setSelectedFeeId(nextFeeId)
    const nextFee = feeList.find((f) => f.id === nextFeeId)
    if (nextFee) {
      setCustomAmount(String(nextFee.due))
    }
    setError('')
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (isOpen === false) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (isOpen === false) return null
  if (typeof document === 'undefined') return null

  const parsedAmount = Number(customAmount)
  const amountToPay = !isNaN(parsedAmount) && parsedAmount > 0 ? Math.min(parsedAmount, maxDue) : maxDue

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault()
    if (!maxDue || maxDue <= 0) {
      setError(isBn ? 'পরিশোধযোগ্য কোনো বকেয়া ফি নেই' : 'No due fee selected to pay')
      return
    }
    if (!amountToPay || amountToPay <= 0) {
      setError(isBn ? 'সঠিক টাকার পরিমাণ লিখুন' : 'Please enter a valid payment amount')
      return
    }
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 11) {
      setError(isBn ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' : 'Enter a valid 11-digit mobile number')
      return
    }

    setProcessing(true)
    setError('')

    const generatedTrx = trxId.trim() || `TXN${Date.now().toString().slice(-8)}`
    setLastTrx(generatedTrx)
    setLastPaidAmount(amountToPay)

    timerRef.current = setTimeout(() => {
      setProcessing(false)
      setCompleted(true)
      onSuccess(amountToPay, generatedTrx, activeFee?.id, method, cleanPhone)
    }, 1200)
  }

  return createPortal(
    <div
      className="modal-overlay modal-backdrop-animate fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card-animate relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'অনলাইন ফি পরিশোধ' : 'Instant Online Fee Payment'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {completed ? (
          <div className="text-center py-4 space-y-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 mx-auto flex items-center justify-center">
              <Clock size={28} />
            </div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              {isBn ? 'পেমেন্ট রিকোয়েস্ট জমা হয়েছে!' : 'Payment Request Submitted!'}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
              {isBn
                ? `৳${lastPaidAmount.toLocaleString()} টাকার পেমেন্ট রিকোয়েস্টটি গ্রহণ করা হয়েছে এবং প্রতিষ্ঠানের ফাইন্যান্স বিভাগে যাচাইকরণের জন্য অপেক্ষমাণ রয়েছে।`
                : `Your payment request of BDT ${lastPaidAmount.toLocaleString()} has been received and is pending verification by institution finance.`}
            </p>

            {lastTrx && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-left text-xs space-y-2 max-w-xs mx-auto">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">{isBn ? 'ট্রানজ্যাকশন আইডি:' : 'Trx ID:'}</span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">{lastTrx}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">{isBn ? 'পেমেন্ট মাধ্যম:' : 'Method:'}</span>
                  <span className="capitalize font-semibold text-[var(--brand)]">{method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">{isBn ? 'টাকার পরিমাণ:' : 'Amount:'}</span>
                  <span className="font-bold text-[var(--text-primary)] tabular-nums">৳{lastPaidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">{isBn ? 'স্ট্যাটাস:' : 'Status:'}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <Clock size={12} />
                    {isBn ? 'যাচাই প্রক্রিয়াধীন' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-9 rounded-xl bg-[var(--brand)] hover:opacity-90 text-white font-semibold text-xs transition-opacity cursor-pointer border-none"
              >
                {isBn ? 'ঠিক আছে' : 'Done'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            {/* Student info strip */}
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-[var(--text-primary)] truncate">
                  {isBn ? child.nameBn || child.nameEn : child.nameEn}
                </div>
                <div className="text-[var(--text-secondary)] text-[0.6875rem] mt-0.5">
                  {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section}) · {isBn ? 'রোল' : 'Roll'}: {child.roll}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[0.6875rem] text-[var(--text-secondary)] block">{isBn ? 'বকেয়া ফি' : 'Due Balance'}</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  ৳{maxDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Select Fee if multiple */}
            {fallbackDueFees.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  {isBn ? 'ফি নির্বাচন করুন' : 'Select Invoice / Fee'}
                </label>
                <select
                  value={selectedFeeId}
                  onChange={(e) => handleSelectFeeChange(e.target.value)}
                  className={`${selectCls} w-full h-9 rounded-xl`}
                >
                  {fallbackDueFees.map((f) => (
                    <option key={f.id} value={f.id}>
                      {isBn ? f.titleBn : f.title} (৳{f.due.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Payment Gateway Options */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-2">
                {isBn ? 'পেমেন্ট মাধ্যম বেছে নিন' : 'Select Payment Method'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['bkash', 'nagad', 'rocket', 'bank'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      method === m
                        ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] shadow-xs'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-2)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <PaymentMethodLogo method={m} size={20} />
                    <span className="capitalize">{m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount & Account Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  {isBn ? 'পরিশোধের পরিমাণ (৳)' : 'Amount (BDT)'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxDue || undefined}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setError('')
                  }}
                  className="w-full h-9 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3 outline-none focus:border-[var(--brand)] tabular-nums font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  {isBn ? 'মোবাইল / অ্যাকাউন্ট নম্বর' : 'Account Mobile Number'}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    setError('')
                  }}
                  placeholder="01XXXXXXXXX"
                  className="w-full h-9 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3 outline-none focus:border-[var(--brand)] font-mono"
                />
              </div>
            </div>

            {/* Optional TrxID */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                {isBn ? 'ট্রানজেকশন আইডি (ঐচ্ছিক)' : 'Transaction ID (Optional / Demo)'}
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder={isBn ? 'যেমন: TRX9281893' : 'e.g. TRX9281893'}
                className="w-full h-9 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3 outline-none focus:border-[var(--brand)] font-mono"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            {/* Submit button */}
            <div className="pt-2 flex items-center gap-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={processing || !maxDue}
                className="w-2/3 h-9 rounded-xl bg-[var(--brand)] hover:opacity-90 text-white font-semibold text-xs shadow-xs transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none"
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{isBn ? 'প্রসেসিং...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isBn ? `৳${amountToPay.toLocaleString()} পে করুন` : `Pay BDT ${amountToPay.toLocaleString()}`}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[0.6875rem] text-[var(--text-muted)]">
              <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
              <span>{isBn ? 'SSL এনক্রিপ্টেড সুরক্ষিত পেমেন্ট' : '256-bit SSL Encrypted Secure Checkout'}</span>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
})
