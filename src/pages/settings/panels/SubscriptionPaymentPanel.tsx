import React, { useState, useEffect, useMemo } from 'react'
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Copy,
  Check,
  Send,
  Building2,
  Calendar,
  HelpCircle,
} from 'lucide-react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAuth } from '@/contexts/AuthContext'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useInstitutionPaymentStore } from '@/store/institutionPaymentStore'

interface Props {
  isBn: boolean
  onBack: () => void
}

const DURATION_OPTIONS = [
  { months: 1, labelEn: '1 Month', labelBn: '১ মাস', discount: 0 },
  { months: 3, labelEn: '3 Months', labelBn: '৩ মাস', discount: 5 },
  { months: 6, labelEn: '6 Months', labelBn: '৬ মাস', discount: 10 },
  { months: 12, labelEn: '1 Year', labelBn: '১ বছর', discount: 15 },
]

export const SubscriptionPaymentPanel: React.FC<Props> = ({ isBn, onBack }) => {
  const { user } = useAuth()
  const institutions = useSuperAdminStore((s) => s.institutions)
  const packages = useSuperAdminStore((s) => s.packages)

  const activeSlug =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug') || user?.subdomain
      : user?.subdomain

  const currentSchool = useMemo(() => {
    return (
      institutions.find(
        (i) =>
          i.id === user?.schoolId ||
          i.id === (user as any)?.institutionId ||
          (activeSlug && (i.slug === activeSlug || i.subdomain === activeSlug))
      ) || null
    )
  }, [institutions, user, activeSlug])

  const bkashConfig = useInstitutionPaymentStore((s) => s.bkashConfig)
  const payments = useInstitutionPaymentStore((s) => s.payments)
  const syncFromServer = useInstitutionPaymentStore((s) => s.syncFromServer)
  const submitPayment = useInstitutionPaymentStore((s) => s.submitPayment)

  const [selectedPkgName, setSelectedPkgName] = useState<string>(
    currentSchool?.package?.name || 'Standard'
  )
  const [selectedMonths, setSelectedMonths] = useState<number>(1)
  const [senderBkashNumber, setSenderBkashNumber] = useState('')
  const [trxId, setTrxId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedBkash, setCopiedBkash] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    void syncFromServer(activeSlug || undefined)
  }, [syncFromServer, activeSlug])

  // Filter payments specifically for this school
  const myPayments = useMemo(() => {
    return payments.filter(
      (p) =>
        (currentSchool && p.schoolId === currentSchool.id) ||
        (activeSlug && p.schoolSlug === activeSlug) ||
        (currentSchool?.eiin && p.eiin === currentSchool.eiin)
    )
  }, [payments, currentSchool, activeSlug])

  // Selected package details & price
  const activePackage = useMemo(() => {
    return (
      packages.find((p) => p.name.toLowerCase() === selectedPkgName.toLowerCase()) ||
      packages[0] || {
        name: 'Standard',
        price: 2200,
      }
    )
  }, [packages, selectedPkgName])

  // Calculate total price with discount
  const durationObj = DURATION_OPTIONS.find((d) => d.months === selectedMonths) || DURATION_OPTIONS[0]
  const baseMonthlyPrice = activePackage.price || 1500
  const subtotal = baseMonthlyPrice * selectedMonths
  const discountAmount = Math.round((subtotal * durationObj.discount) / 100)
  const payableAmount = subtotal - discountAmount

  // Expiration calculations
  const expiresAtDate = currentSchool?.expiresAt ? new Date(currentSchool.expiresAt) : null
  const isExpired = expiresAtDate ? expiresAtDate.getTime() < Date.now() : false
  const daysLeft = expiresAtDate
    ? Math.max(0, Math.ceil((expiresAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const handleCopyBkash = () => {
    navigator.clipboard?.writeText(bkashConfig.number.replace(/\D/g, ''))
    setCopiedBkash(true)
    setTimeout(() => setCopiedBkash(false), 2000)
  }

  const handleCopyRef = () => {
    const refCode = currentSchool?.eiin || currentSchool?.slug || 'SCHOOL'
    navigator.clipboard?.writeText(refCode)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const cleanSender = senderBkashNumber.trim()
    const cleanTrx = trxId.trim().toUpperCase()

    if (!cleanSender) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে আপনার প্রেরক বিকাশ নম্বর প্রদান করুন।' : 'Please enter your sender bKash number.')
      return
    }

    if (!/^01[3-9]\d{8}$/.test(cleanSender.replace(/\D/g, ''))) {
      setErrorMsg(
        isBn
          ? 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 017xxxxxxxx)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number.'
      )
      return
    }

    if (!cleanTrx || cleanTrx.length < 8) {
      setErrorMsg(
        isBn
          ? 'সঠিক বিকাশ ট্রানজেকশন আইডি (TrxID) প্রদান করুন (কমপক্ষে ৮ অক্ষর)।'
          : 'Please enter a valid bKash Transaction ID (at least 8 characters).'
      )
      return
    }

    setIsSubmitting(true)
    try {
      await submitPayment({
        schoolId: currentSchool?.id || 'inst-1',
        schoolName: currentSchool?.name || user?.name || 'Institution',
        schoolSlug: currentSchool?.slug || activeSlug || 'school',
        eiin: currentSchool?.eiin || undefined,
        packageName: activePackage.name,
        amount: payableAmount,
        months: selectedMonths,
        senderBkashNumber: cleanSender,
        trxId: cleanTrx,
        paymentMethod: 'bkash',
        notes: notes.trim() || undefined,
      })

      setSuccessMsg(
        isBn
          ? 'পেমেন্ট ভেরিফিকেশন সফলভাবে জমা হয়েছে! সুপার অ্যাডমিন যাচাই করে প্যাকেজের মেয়াদ বৃদ্ধি করবেন।'
          : 'Payment verification submitted successfully! Super admin will verify and extend your package.'
      )
      setTrxId('')
      setNotes('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SettingsPanel
      title="Subscription & bKash Payment"
      titleBn="সাবস্ক্রিপশন ও বিকাশ পেমেন্ট"
      isBn={isBn}
      onBack={onBack}
    >
      <div className="space-y-6">
        {/* 1. Current Subscription Status Card */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#D12053]/10 text-[#D12053]">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)] m-0">
                  {currentSchool?.name || 'Institution Account'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider bg-[var(--brand)]/15 text-[var(--brand)]">
                  {currentSchool?.package?.name || activePackage.name}
                </span>
                {isExpired ? (
                  <span className="px-2 py-0.5 rounded text-[0.6875rem] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                    {isBn ? 'মেয়াদোত্তীর্ণ' : 'Expired'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[0.6875rem] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                    {isBn ? 'সক্রিয়' : 'Active'}
                  </span>
                )}
              </div>
              <p className="text-[0.75rem] text-[var(--text-muted)] mt-1 mb-0 flex items-center gap-3 flex-wrap">
                <span>EIIN: {currentSchool?.eiin || 'N/A'}</span>
                <span>•</span>
                <span>
                  {isBn ? 'মেয়াদ শেষ:' : 'Expires:'}{' '}
                  {expiresAtDate ? expiresAtDate.toLocaleDateString() : (isBn ? 'নির্দিষ্ট নয়' : 'Not set')}
                </span>
                {daysLeft !== null && !isExpired && (
                  <span className="text-[var(--brand)] font-semibold">
                    ({daysLeft} {isBn ? 'দিন বাকি' : 'days left'})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                {isBn ? 'মাসিক প্যাকেজ ফি' : 'Monthly Fee'}
              </div>
              <div className="text-[1.25rem] font-extrabold text-[var(--text-primary)]">
                ৳{baseMonthlyPrice.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Official Super Admin bKash Receiving Account Box */}
        <div className="p-5 rounded-2xl border-2 border-[#D12053]/30 bg-gradient-to-br from-[#D12053]/5 via-[var(--bg-primary)] to-[#D12053]/5">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D12053] flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                bK
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0">
                    {isBn ? 'সুপার অ্যাডমিন বিকাশ পেমেন্ট অ্যাকাউন্ট' : 'Super Admin Official bKash Account'}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold uppercase tracking-wider bg-[#D12053]/15 text-[#D12053]">
                    {bkashConfig.type}
                  </span>
                </div>
                <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5 mb-0">
                  {isBn
                    ? 'এই বিকাশ নম্বরে ফি প্রদান করে ট্রানজেকশন আইডি (TrxID) নিচে জমা দিন'
                    : 'Send payment to this bKash number and submit the TrxID below'}
                </p>
              </div>
            </div>

            {/* Quick Copy Number Button */}
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl border border-[#D12053]/40 bg-[var(--bg-primary)] flex items-center gap-2 shadow-xs">
                <span className="text-[0.875rem] font-mono font-bold text-[#D12053] tracking-wide">
                  {bkashConfig.number}
                </span>
                <button
                  type="button"
                  onClick={handleCopyBkash}
                  className="p-1 rounded hover:bg-[#D12053]/10 text-[var(--text-muted)] hover:text-[#D12053] transition-colors border-none bg-transparent cursor-pointer"
                  title={isBn ? 'নম্বর কপি করুন' : 'Copy Number'}
                >
                  {copiedBkash ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Payment Steps / Instructions */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.75rem] space-y-1.5">
            <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mb-1">
              <HelpCircle size={14} className="text-[#D12053]" />
              {isBn ? 'বিকাশে পেমেন্ট করার নিয়মাবলী:' : 'How to Pay via bKash:'}
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-[var(--text-secondary)] m-0">
              <li>
                {isBn
                  ? `বিকাশ অ্যাপ ওপেন করুন অথবা *২৪৭# ডায়াল করে '${bkashConfig.type === 'merchant' ? 'Payment' : 'Send Money'}' অপশনে যান।`
                  : `Open bKash App or dial *247# and choose '${bkashConfig.type === 'merchant' ? 'Payment' : 'Send Money'}'.`}
              </li>
              <li>
                {isBn
                  ? `প্রাপক নম্বর দিন: `
                  : `Enter Recipient Number: `}
                <strong className="text-[#D12053]">{bkashConfig.number}</strong>
              </li>
              <li>
                {isBn
                  ? `টাকার পরিমাণ (৳${payableAmount.toLocaleString()}) লিখুন।`
                  : `Enter Amount (৳${payableAmount.toLocaleString()}).`}
              </li>
              <li className="flex items-center gap-1 flex-wrap">
                <span>
                  {isBn
                    ? `রেফারেন্স কোড দিন: `
                    : `Enter Reference: `}
                  <strong className="text-[var(--brand)]">
                    {currentSchool?.eiin || currentSchool?.slug || 'SCHOOL'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="px-1.5 py-0.5 rounded text-[0.625rem] font-medium bg-[var(--border)] hover:bg-[var(--brand)] hover:text-white transition-colors border-none cursor-pointer"
                >
                  {copiedRef ? (isBn ? 'কপি হয়েছে' : 'Copied!') : (isBn ? 'কপি' : 'Copy')}
                </button>
              </li>
              <li>
                {isBn
                  ? 'আপনার বিকাশ পিন নম্বর দিয়ে লেনদেন সম্পন্ন করুন এবং এসএমএস থেকে TrxID কপি করে নিচের ফর্মে জমা দিন।'
                  : 'Enter your PIN to confirm payment and copy the Transaction ID (TrxID) into the form below.'}
              </li>
            </ol>
          </div>
        </div>

        {/* 3. Payment Submission Form */}
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-4">
          <h4 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
            <CreditCard size={18} className="text-[#D12053]" />
            {isBn ? 'পেমেন্ট ভেরিফিকেশন ফর্ম' : 'Submit Payment Verification'}
          </h4>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[0.75rem] flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-[0.75rem] flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Package Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {isBn ? 'প্যাকেজ নির্বাচন করুন' : 'Select Package'}
              </label>
              <select
                value={selectedPkgName}
                onChange={(e) => setSelectedPkgName(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.name}>
                    {pkg.name} — ৳{(pkg.price || 1500).toLocaleString()} / {isBn ? 'মাস' : 'month'}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {isBn ? 'মেয়াদ / সময়কাল' : 'Duration / Period'}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setSelectedMonths(opt.months)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                      selectedMonths === opt.months
                        ? 'border-[#D12053] bg-[#D12053]/10 text-[#D12053] font-bold shadow-xs'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <div className="text-[0.75rem]">{isBn ? opt.labelBn : opt.labelEn}</div>
                    {opt.discount > 0 && (
                      <div className="text-[0.5625rem] text-green-500 font-semibold mt-0.5">
                        {opt.discount}% {isBn ? 'ছাড়' : 'off'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amount Display */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between">
            <span className="text-[0.8125rem] text-[var(--text-secondary)] font-medium">
              {isBn ? 'মোট পরিশোধযোগ্য পরিমাণ:' : 'Total Payable Amount:'}
            </span>
            <div className="text-right">
              {discountAmount > 0 && (
                <span className="text-[0.75rem] text-[var(--text-muted)] line-through mr-2">
                  ৳{subtotal.toLocaleString()}
                </span>
              )}
              <span className="text-[1.125rem] font-extrabold text-[#D12053]">
                ৳{payableAmount.toLocaleString()} BDT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sender bKash Number */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {isBn ? 'প্রেরক বিকাশ নম্বর' : 'Sender bKash Number'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={senderBkashNumber}
                onChange={(e) => setSenderBkashNumber(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-mono outline-none focus:border-[#D12053]"
              />
            </div>

            {/* bKash Transaction ID (TrxID) */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {isBn ? 'বিকাশ ট্রানজেকশন আইডি (TrxID)' : 'bKash Transaction ID (TrxID)'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                placeholder="e.g. BLA89DK29P"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-mono uppercase font-bold outline-none focus:border-[#D12053]"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              {isBn ? 'মন্তব্য বা অতিরিক্ত তথ্য (ঐচ্ছিক)' : 'Note or Additional Reference (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isBn ? 'যেমন: বার্ষিক ফি বা বিশেষ রেফারেন্স...' : 'e.g. Annual renewal or special instructions...'}
              className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D12053] hover:bg-[#b01742] text-white text-[0.8125rem] font-bold transition-all shadow-md cursor-pointer border-none disabled:opacity-50"
            >
              <Send size={15} />
              {isSubmitting
                ? (isBn ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...')
                : (isBn ? 'পেমেন্ট তথ্য জমা দিন' : 'Submit Payment for Verification')}
            </button>
          </div>
        </form>

        {/* 4. Payment Submission History Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
              <Calendar size={17} className="text-[var(--text-muted)]" />
              {isBn ? 'পেমেন্ট হিস্ট্রি ও স্ট্যাটাস' : 'Payment History & Verification Status'}
            </h4>
            <span className="text-[0.75rem] text-[var(--text-muted)]">
              {myPayments.length} {isBn ? 'টি রেকর্ড' : 'records'}
            </span>
          </div>

          {myPayments.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-[var(--border)] text-center text-[var(--text-muted)]">
              <CreditCard size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-[0.8125rem] m-0">
                {isBn ? 'এখনও কোনো পেমেন্ট রেকর্ড নেই।' : 'No payment records found yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left border-collapse text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3.5">{isBn ? 'তারিখ' : 'Date'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'প্যাকেজ ও মেয়াদ' : 'Package & Period'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'বিকাশ TrxID' : 'bKash TrxID'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'প্রেরক নম্বর' : 'Sender Number'}</th>
                    <th className="py-2.5 px-3.5">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {myPayments.map((p) => {
                    const statusBadge =
                      p.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle2 size={12} />
                          {isBn ? 'অনুমোদিত' : 'Approved'}
                        </span>
                      ) : p.status === 'rejected' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-red-500/10 text-red-500 border border-red-500/20 cursor-help"
                          title={p.rejectionReason}
                        >
                          <XCircle size={12} />
                          {isBn ? 'বাতিল' : 'Rejected'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                          <Clock size={12} />
                          {isBn ? 'যাচাই প্রক্রিয়াধীন' : 'Pending'}
                        </span>
                      )

                    return (
                      <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                        <td className="py-3 px-3.5 text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(p.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3.5 font-medium text-[var(--text-primary)]">
                          {p.packageName} ({p.months} {isBn ? 'মাস' : 'mo'})
                        </td>
                        <td className="py-3 px-3.5 font-bold text-[#D12053] whitespace-nowrap">
                          ৳{p.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-semibold text-[var(--brand)] whitespace-nowrap">
                          {p.trxId}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                          {p.senderBkashNumber}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {statusBadge}
                          {p.rejectionReason && (
                            <div className="text-[0.6875rem] text-red-500 mt-0.5 max-w-[12rem] truncate">
                              {p.rejectionReason}
                            </div>
                          )}
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
    </SettingsPanel>
  )
}
