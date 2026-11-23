import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowRight, Loader2, CreditCard, Clock } from 'lucide-react'
import type { StudentProfile, StudentFee } from '../types'
import { PaymentMethodLogo } from '@/components/ui/PaymentMethodLogo'

interface FeePaymentModalProps {
  isOpen?: boolean
  student: StudentProfile
  fees?: StudentFee[]
  fee?: StudentFee
  onClose: () => void
  onSuccess: (amount: number, trxId: string, feeId?: string, method?: string, phone?: string) => void
  isBn: boolean
}

export const FeePaymentModal = React.memo(function FeePaymentModal({
  isOpen,
  student,
  fees,
  fee,
  onClose,
  onSuccess,
  isBn,
}: FeePaymentModalProps) {
  const feeList = fees || (fee ? [fee] : [])
  const dueFees = feeList.filter((f) => f.due > 0)
  const [selectedFeeId, setSelectedFeeId] = useState<string>(fee?.id || dueFees[0]?.id || '')
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash')
  const [phone, setPhone] = useState(student?.guardianPhone ? student.guardianPhone.replace(/[^0-9]/g, '').slice(-11) : '')
  const [trxId, setTrxId] = useState('')
  const [lastTrx, setLastTrx] = useState('')
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')

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

    const generatedTrx = trxId.trim() || `TXN${Date.now().toString().slice(-8)}`
    setLastTrx(generatedTrx)

    setTimeout(() => {
      setProcessing(false)
      setCompleted(true)
      onSuccess(amountToPay, generatedTrx, activeFee?.id, method, phone)
    }, 700)
  }

  const handleClose = () => {
    setCompleted(false)
    setTrxId('')
    setError('')
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'অনলাইন ফি পেমেন্ট' : 'Online Fee Payment'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {completed ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={32} />
              </div>
              <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
                {isBn ? 'পেমেন্ট ভেরিফিকেশনের জন্য জমা হয়েছে' : 'Payment Submitted for Verification'}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                {isBn
                  ? `আপনার অনুরোধটি সফলভাবে নথিভুক্ত হয়েছে। TrxID: ${lastTrx}`
                  : `Your transaction has been recorded. TrxID: ${lastTrx}`}
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold"
              >
                {isBn ? 'ঠিক আছে' : 'Done'}
              </button>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  {isBn ? 'ফি নির্বাচন করুন' : 'Select Fee'}
                </label>
                <select
                  value={selectedFeeId}
                  onChange={(e) => setSelectedFeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  {feeList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {isBn ? f.titleBn || f.title : f.title} — {isBn ? 'বকেয়া' : 'Due'}: ৳{f.due.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">{isBn ? 'মোট পরিশোধযোগ্য' : 'Payable Amount'}:</span>
                <span className="text-base font-bold text-[var(--brand)]">৳{amountToPay.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  {isBn ? 'পেমেন্ট মেথড' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['bkash', 'nagad', 'rocket', 'bank'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        method === m
                          ? 'border-[var(--brand)] bg-[var(--brandLight)]'
                          : 'border-[var(--border)] hover:border-[var(--brand)] bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <PaymentMethodLogo method={m} size="sm" />
                      <span className="text-[0.625rem] capitalize font-medium text-[var(--text-primary)]">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  {isBn ? 'মোবাইল / অ্যাকাউন্ট নম্বর' : 'Mobile / Account Number'}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  {isBn ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="e.g. 9H7X8KL2M"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                />
              </div>

              {error && <p className="text-xs text-rose-500">{error}</p>}

              <button
                type="submit"
                disabled={processing || amountToPay <= 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>{isBn ? 'পেমেন্ট সম্পন্ন করুন' : 'Confirm & Pay'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
})
