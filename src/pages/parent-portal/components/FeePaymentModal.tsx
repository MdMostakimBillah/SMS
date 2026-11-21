import React, { useState } from 'react'
import { X, CheckCircle2, ShieldCheck, ArrowRight, Loader2, CreditCard } from 'lucide-react'
import type { PortalChild, FeeItem } from '../types'
import { PaymentMethodLogo } from '@/components/ui/PaymentMethodLogo'

interface FeePaymentModalProps {
  isOpen?: boolean
  child: PortalChild
  fees?: FeeItem[]
  fee?: FeeItem
  onClose: () => void
  onSuccess: (amount: number, trxId: string, feeId?: string, method?: string) => void
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
  if (isOpen === false) return null

  const feeList = fees || (fee ? [fee] : [])
  const dueFees = feeList.filter((f) => f.due > 0)
  const [selectedFeeId, setSelectedFeeId] = useState<string>(fee?.id || dueFees[0]?.id || '')
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash')
  const [phone, setPhone] = useState(child.guardianPhone.replace(/[^0-9]/g, '').slice(-11) || '')
  const [trxId, setTrxId] = useState('')
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')

  const activeFee = feeList.find((f) => f.id === selectedFeeId) || dueFees[0]
  const amountToPay = activeFee ? activeFee.due : 0

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amountToPay || amountToPay <= 0) {
      setError(isBn ? 'পরিশোধযোগ্য কোনো বকেয়া ফি নেই' : 'No due fee selected to pay')
      return
    }
    if (!phone || phone.length < 11) {
      setError(isBn ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' : 'Enter a valid 11-digit mobile number')
      return
    }

    setProcessing(true)
    setError('')

    setTimeout(() => {
      const generatedTrx = trxId.trim() || `TXN${Date.now().toString().slice(-8)}`
      setProcessing(false)
      setCompleted(true)
      onSuccess(amountToPay, generatedTrx, activeFee?.id, method)
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {isBn ? 'অনলাইন ফি পরিশোধ' : 'Instant Online Fee Payment'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {completed ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              {isBn ? 'পেমেন্ট সফল হয়েছে!' : 'Payment Completed Successfully!'}
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
              {isBn
                ? `৳${amountToPay.toLocaleString()} টাকা সফলভাবে জমা নেওয়া হয়েছে। রসিদ আপনার ইমেইল ও এসএমএস এ পাঠানো হয়েছে।`
                : `BDT ${amountToPay.toLocaleString()} has been received. Receipt copy has been sent to guardian contact.`}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-[var(--brand)] hover:opacity-90 text-white font-semibold text-xs transition-opacity"
              >
                {isBn ? 'ঠিক আছে' : 'Done'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            {/* Student info strip */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {isBn ? child.nameBn || child.nameEn : child.nameEn}
                </div>
                <div className="text-[var(--text-muted)] text-[0.6875rem]">
                  {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section}) · {isBn ? 'রোল' : 'Roll'}: {child.roll}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[0.6875rem] text-[var(--text-muted)] block">{isBn ? 'বকেয়া ফি' : 'Due Amount'}</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">৳{amountToPay.toLocaleString()}</span>
              </div>
            </div>

            {/* Select Fee if multiple */}
            {dueFees.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  {isBn ? 'ফি নির্বাচন করুন' : 'Select Invoice / Fee'}
                </label>
                <select
                  value={selectedFeeId}
                  onChange={(e) => setSelectedFeeId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2.5 focus:outline-hidden focus:ring-1 focus:ring-[var(--brand)]"
                >
                  {dueFees.map((f) => (
                    <option key={f.id} value={f.id}>
                      {isBn ? f.titleBn : f.title} (৳{f.due})
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
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                      method === m
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] shadow-xs'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-gray-400'
                    }`}
                  >
                    <PaymentMethodLogo method={m} size={20} />
                    <span className="capitalize">{m}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Phone / Number */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'মোবাইল / অ্যাকাউন্ট নম্বর' : 'Account Mobile Number'}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2.5 focus:outline-hidden focus:ring-1 focus:ring-[var(--brand)]"
              />
            </div>

            {/* Optional TrxID */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'ট্রানজেকশন আইডি (ঐচ্ছিক)' : 'Transaction ID (Optional / Demo)'}
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder={isBn ? 'যেমন: TRX9281893' : 'e.g. TRX9281893'}
                className="w-full text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2.5 focus:outline-hidden focus:ring-1 focus:ring-[var(--brand)]"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            {/* Submit button */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={processing}
                className="w-2/3 py-2.5 rounded-xl bg-[var(--brand)] hover:opacity-90 text-white font-semibold text-xs shadow-xs transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
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

            <div className="flex items-center justify-center gap-1.5 text-[0.625rem] text-[var(--text-muted)] pt-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>{isBn ? 'SSL এনক্রিপ্টেড সুরক্ষিত পেমেন্ট' : '256-bit SSL Encrypted Secure Checkout'}</span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
})
