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
  Sparkles,
  Users,
  GraduationCap,
} from 'lucide-react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAuth } from '@/contexts/AuthContext'
import { useSuperAdminStore } from '@/store/superAdminStore'
import {
  useInstitutionPaymentStore,
  type PaymentMethodType,
  DEFAULT_GATEWAYS_CONFIG,
} from '@/store/institutionPaymentStore'
import { PaymentMethodLogo } from '@/components/ui/PaymentMethodLogo'

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

export const GATEWAY_METAS: Record<
  PaymentMethodType,
  {
    name: string
    nameBn: string
    tag: string
    color: string
    bgLight: string
    textColor: string
    badgeCls: string
    borderActive: string
    iconLabel: string
  }
> = {
  bkash: {
    name: 'bKash',
    nameBn: 'বিকাশ',
    tag: 'MFS',
    color: '#D12053',
    bgLight: '#D1205315',
    textColor: '#D12053',
    badgeCls: 'bg-[#D12053]/10 text-[#D12053] border border-[#D12053]/30',
    borderActive: 'border-[#D12053]',
    iconLabel: 'bK',
  },
  nagad: {
    name: 'Nagad',
    nameBn: 'নগদ',
    tag: 'MFS',
    color: '#F7941D',
    bgLight: '#F7941D15',
    textColor: '#F7941D',
    badgeCls: 'bg-[#F7941D]/10 text-[#F7941D] border border-[#F7941D]/30',
    borderActive: 'border-[#F7941D]',
    iconLabel: 'নগদ',
  },
  rocket: {
    name: 'Rocket',
    nameBn: 'রকেট',
    tag: 'DBBL MFS',
    color: '#8C3494',
    bgLight: '#8C349415',
    textColor: '#8C3494',
    badgeCls: 'bg-[#8C3494]/10 text-[#8C3494] border border-[#8C3494]/30',
    borderActive: 'border-[#8C3494]',
    iconLabel: '🚀',
  },
  upay: {
    name: 'Upay',
    nameBn: 'উপায়',
    tag: 'UCB MFS',
    color: '#005696',
    bgLight: '#00569615',
    textColor: '#005696',
    badgeCls: 'bg-[#005696]/10 text-[#005696] border border-[#005696]/30',
    borderActive: 'border-[#005696]',
    iconLabel: 'upay',
  },
  bank: {
    name: 'Bank Transfer',
    nameBn: 'ব্যাংক ট্রান্সফার',
    tag: 'NPSB / BEFTN',
    color: '#059669',
    bgLight: '#05966915',
    textColor: '#059669',
    badgeCls: 'bg-[#059669]/10 text-[#059669] border border-[#059669]/30',
    borderActive: 'border-[#059669]',
    iconLabel: '🏦',
  },
}

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

  const rawGatewaysConfig = useInstitutionPaymentStore((s) => s.gatewaysConfig)
  const gatewaysConfig = rawGatewaysConfig || DEFAULT_GATEWAYS_CONFIG
  const payments = useInstitutionPaymentStore((s) => s.payments)
  const syncFromServer = useInstitutionPaymentStore((s) => s.syncFromServer)
  const submitPayment = useInstitutionPaymentStore((s) => s.submitPayment)

  // Current school's active package name
  const currentPkgName = currentSchool?.package?.name || ''

  // Track if user has manually clicked a package
  const [hasManuallySelected, setHasManuallySelected] = useState(false)
  const [selectedPkgName, setSelectedPkgName] = useState<string>(
    currentSchool?.package?.name || 'Standard'
  )
  const [selectedMonths, setSelectedMonths] = useState<number>(1)
  const [selectedGateway, setSelectedGateway] = useState<PaymentMethodType>('bkash')
  const [packageCategory, setPackageCategory] = useState<'all' | 'cloud' | 'self_hosted'>('all')

  // Keep selected package in sync with current school's package until user manually selects another
  useEffect(() => {
    if (currentSchool?.package?.name && !hasManuallySelected) {
      setSelectedPkgName(currentSchool.package.name)
    }
  }, [currentSchool?.package?.name, hasManuallySelected])

  // Filter packages by category if desired
  const filteredPackages = useMemo(() => {
    if (packageCategory === 'cloud') {
      return packages.filter(
        (p) =>
          !p.hostingType ||
          p.hostingType === 'cloud' ||
          p.hostingType === 'all' ||
          ['Basic', 'Standard', 'Premium', 'Enterprise'].includes(p.name)
      )
    }
    if (packageCategory === 'self_hosted') {
      return packages.filter(
        (p) =>
          p.hostingType === 'local_pc' ||
          p.hostingType === 'personal_vps' ||
          p.hostingType === 'system_only' ||
          ['Local PC Basic', 'Personal VPS Pro', 'System Lifetime License'].includes(p.name)
      )
    }
    return packages
  }, [packages, packageCategory])

  // Form fields
  const [senderNumber, setSenderNumber] = useState('')
  const [trxId, setTrxId] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedNumber, setCopiedNumber] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)
  const [copiedBankAcc, setCopiedBankAcc] = useState(false)
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

  // Active gateway configuration
  const currentGatewayMeta = GATEWAY_METAS[selectedGateway] || GATEWAY_METAS.bkash
  const currentGatewayCfg =
    selectedGateway === 'bank'
      ? gatewaysConfig.bank || DEFAULT_GATEWAYS_CONFIG.bank
      : gatewaysConfig[selectedGateway] || DEFAULT_GATEWAYS_CONFIG[selectedGateway]

  const handleCopyNumber = () => {
    const num = selectedGateway === 'bank'
      ? (gatewaysConfig.bank?.accountNumber || DEFAULT_GATEWAYS_CONFIG.bank.accountNumber)
      : (currentGatewayCfg as any)?.number?.replace(/\D/g, '') || ''
    navigator.clipboard?.writeText(num)
    setCopiedNumber(true)
    setTimeout(() => setCopiedNumber(false), 2000)
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

    const cleanSender = senderNumber.trim()
    const cleanTrx = trxId.trim().toUpperCase()

    if (!cleanSender) {
      setErrorMsg(
        selectedGateway === 'bank'
          ? (isBn ? 'অনুগ্রহ করে প্রেরক ব্যাংক অ্যাকাউন্ট নম্বর বা নাম লিখুন।' : 'Please enter sender bank account number or depositor name.')
          : (isBn ? `অনুগ্রহ করে আপনার প্রেরক ${currentGatewayMeta.nameBn} নম্বর প্রদান করুন।` : `Please enter your sender ${currentGatewayMeta.name} number.`)
      )
      return
    }

    if (selectedGateway !== 'bank') {
      const cleanDigits = cleanSender.replace(/\D/g, '')
      if (cleanDigits.length < 11 || (!cleanDigits.startsWith('01') && cleanDigits.length !== 12)) {
        setErrorMsg(
          isBn
            ? 'সঠিক বাংলাদেশি মোবাইল ব্যাংকিং নম্বর প্রদান করুন (যেমন: 017xxxxxxxx)।'
            : 'Please enter a valid Bangladeshi mobile banking number.'
        )
        return
      }
    }

    if (!cleanTrx || cleanTrx.length < 6) {
      setErrorMsg(
        isBn
          ? 'সঠিক ট্রানজেকশন আইডি (TrxID) বা ব্যাংক ডিপোজিট স্লিপ নম্বর প্রদান করুন।'
          : 'Please enter a valid Transaction ID (TrxID) or deposit slip reference.'
      )
      return
    }

    setIsSubmitting(true)
    try {
      await submitPayment({
        schoolId: currentSchool?.id || user?.schoolId || 'inst-current',
        schoolName: currentSchool?.name || 'Institution Account',
        schoolSlug: currentSchool?.slug || activeSlug || 'school',
        eiin: currentSchool?.eiin || undefined,
        packageName: activePackage.name,
        packageId: activePackage.id,
        amount: payableAmount,
        months: selectedMonths,
        senderNumber: cleanSender,
        senderBkashNumber: cleanSender,
        trxId: cleanTrx,
        paymentMethod: selectedGateway,
        notes: notes.trim() || undefined,
      })

      setSuccessMsg(
        isBn
          ? `${currentGatewayMeta.nameBn} পেমেন্ট ভেরিফিকেশন সফলভাবে জমা হয়েছে! সুপার অ্যাডমিন যাচাই করে প্যাকেজ আপডেট ও মেয়াদ বৃদ্ধি করবেন।`
          : `${currentGatewayMeta.name} payment verification submitted successfully! Super admin will verify and activate your package.`
      )
      setTrxId('')
      setNotes('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableGateways: PaymentMethodType[] = ['bkash', 'nagad', 'rocket', 'upay', 'bank']

  return (
    <SettingsPanel
      title="Subscription & Package Payment"
      titleBn="সাবস্ক্রিপশন ও প্যাকেজ পেমেন্ট"
      isBn={isBn}
      onBack={onBack}
    >
      <div className="space-y-6">
        {/* 1. Current Subscription Status Card */}
        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20 shadow-xs">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[1.0625rem] font-bold text-[var(--text-primary)] m-0 tracking-tight">
                  {currentSchool?.name || 'Institution Account'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider bg-[var(--brand)]/15 text-[var(--brand)] border border-[var(--brand)]/20">
                  {currentSchool?.package?.name || activePackage.name}
                </span>
                {isExpired ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                    {isBn ? 'মেয়াদোত্তীর্ণ' : 'Expired'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {isBn ? 'সক্রিয়' : 'Active'}
                  </span>
                )}
              </div>
              <p className="text-[0.75rem] text-[var(--text-muted)] mt-1.5 mb-0 flex items-center gap-3 flex-wrap">
                <span>EIIN: <strong className="font-mono text-[var(--text-primary)]">{currentSchool?.eiin || 'N/A'}</strong></span>
                <span className="text-[var(--border)]">•</span>
                <span>
                  {isBn ? 'মেয়াদ শেষ:' : 'Expires:'}{' '}
                  <strong className="text-[var(--text-primary)]">
                    {expiresAtDate ? expiresAtDate.toLocaleDateString() : (isBn ? 'নির্দিষ্ট নয়' : 'Not set')}
                  </strong>
                </span>
                {daysLeft !== null && !isExpired && (
                  <span className="px-2 py-0.2 rounded-md bg-[var(--brand)]/10 text-[var(--brand)] text-[0.6875rem] font-bold">
                    {daysLeft} {isBn ? 'দিন বাকি' : 'days left'}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                {isBn ? 'বর্তমান প্যাকেজ রেট' : 'Current Rate'}
              </div>
              <div className="text-[1.375rem] font-extrabold text-[var(--text-primary)] tracking-tight">
                ৳{baseMonthlyPrice.toLocaleString()}
                <span className="text-[0.75rem] font-normal text-[var(--text-muted)] ml-1">/ {isBn ? 'মাস' : 'mo'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Choose Package & Duration */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h4 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--brand)]" />
                <span>{isBn ? '১. প্যাকেজ ও মেয়াদ নির্বাচন করুন' : '1. Choose Package & Duration'}</span>
              </h4>
              <span className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5 block">
                {isBn ? 'আপনার প্রতিষ্ঠানের জন্য উপযুক্ত প্যাকেজ নির্বাচন করুন' : 'Select the best plan for your institution'}
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setPackageCategory('all')}
                className={`px-3 py-1 rounded-xl text-[0.6875rem] font-bold transition-all cursor-pointer border ${
                  packageCategory === 'all'
                    ? 'border-[var(--brand)] bg-[var(--brand)] text-white shadow-2xs'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isBn ? 'সকল প্যাকেজ' : 'All Plans'}
              </button>
              <button
                type="button"
                onClick={() => setPackageCategory('cloud')}
                className={`px-3 py-1 rounded-xl text-[0.6875rem] font-bold transition-all cursor-pointer border ${
                  packageCategory === 'cloud'
                    ? 'border-[var(--brand)] bg-[var(--brand)] text-white shadow-2xs'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isBn ? 'ক্লাউড হোস্টেড' : 'Cloud Hosted'}
              </button>
              <button
                type="button"
                onClick={() => setPackageCategory('self_hosted')}
                className={`px-3 py-1 rounded-xl text-[0.6875rem] font-bold transition-all cursor-pointer border ${
                  packageCategory === 'self_hosted'
                    ? 'border-[var(--brand)] bg-[var(--brand)] text-white shadow-2xs'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isBn ? 'সেলফ-হোস্টেড / লোকাল' : 'Self-Hosted'}
              </button>
            </div>
          </div>

          {/* Package Selection Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredPackages.map((pkg) => {
              const isSelected = selectedPkgName.toLowerCase() === pkg.name.toLowerCase()
              const isCurrent = currentPkgName.toLowerCase() === pkg.name.toLowerCase()

              return (
                <div
                  key={pkg.id || pkg.name}
                  onClick={() => {
                    setSelectedPkgName(pkg.name)
                    setHasManuallySelected(true)
                  }}
                  className={`group relative rounded-2xl p-4 sm:p-5 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[var(--brand)] bg-[var(--brand)]/[0.04] shadow-md ring-4 ring-[var(--brand)]/10 -translate-y-1'
                      : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)]/50 hover:bg-[var(--bg-secondary)]/40 hover:-translate-y-0.5 hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Card Header: Title + Badges + Radio Indicator */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h5 className="font-bold text-[1rem] text-[var(--text-primary)] m-0 tracking-tight">
                          {isBn ? pkg.nameBn || pkg.name : pkg.name}
                        </h5>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mt-0.5">
                          {pkg.hostingType === 'system_only' || pkg.duration === 0
                            ? (isBn ? 'আজীবন লাইসেন্স' : 'Lifetime System')
                            : pkg.hostingType === 'local_pc'
                            ? (isBn ? 'লোকাল পিসি' : 'Local PC')
                            : pkg.hostingType === 'personal_vps'
                            ? (isBn ? 'পার্সোনাল ভিপিএস' : 'Personal VPS')
                            : (isBn ? 'ক্লাউড হোস্টেড' : 'Cloud Hosted')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {isBn ? 'বর্তমান' : 'Current'}
                          </span>
                        )}

                        {/* Radio Checkmark Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[var(--brand)] text-white shadow-2xs'
                              : 'border-2 border-[var(--border)] group-hover:border-[var(--brand)]/60'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="my-3 pb-3 border-b border-[var(--border)]/70">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[1.5rem] font-extrabold text-[var(--text-primary)] tracking-tight">
                          ৳{(pkg.price || 1500).toLocaleString()}
                        </span>
                        <span className="text-[0.75rem] font-medium text-[var(--text-muted)]">
                          / {pkg.duration === 0 ? (isBn ? 'এককালীন' : 'lifetime') : (isBn ? 'মাস' : 'mo')}
                        </span>
                      </div>
                    </div>

                    {/* Capacity & Limits */}
                    <div className="space-y-2 mb-4 text-[0.75rem]">
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-6 h-6 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--brand)] shrink-0">
                          <Users size={13} />
                        </div>
                        <span>
                          {isBn ? 'শিক্ষার্থী:' : 'Students:'}{' '}
                          <strong className="text-[var(--text-primary)] font-bold">{pkg.maxStudents || 999}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-6 h-6 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--brand)] shrink-0">
                          <GraduationCap size={13} />
                        </div>
                        <span>
                          {isBn ? 'শিক্ষক:' : 'Teachers:'}{' '}
                          <strong className="text-[var(--text-primary)] font-bold">{pkg.maxTeachers || 99}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button at bottom */}
                  <div className="pt-2">
                    <div
                      className={`w-full py-2 px-3 rounded-xl text-[0.75rem] font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-[var(--brand)] text-white shadow-xs'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] group-hover:bg-[var(--brand)]/10 group-hover:text-[var(--brand)]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={14} strokeWidth={2.5} />
                          <span>
                            {isCurrent
                              ? (isBn ? 'বর্তমান প্ল্যান (নির্বাচিত)' : 'Current Plan (Selected)')
                              : (isBn ? 'নির্বাচিত প্ল্যান' : 'Selected Plan')}
                          </span>
                        </>
                      ) : (
                        <span>
                          {isCurrent
                            ? (isBn ? 'বর্তমান প্ল্যান বেছে নিন' : 'Select Current Plan')
                            : (isBn ? 'প্ল্যান নির্বাচন করুন' : 'Select Plan')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Duration Selector */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h5 className="text-[0.875rem] font-bold text-[var(--text-primary)] m-0">
                  {isBn ? 'বিলিং চক্র / সময়সীমা নির্বাচন করুন' : 'Select Billing Duration'}
                </h5>
                <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5 mb-0">
                  {isBn
                    ? 'দীর্ঘমেয়াদে সাবস্ক্রিপশন নিলে সর্বোচ্চ ১৫% পর্যন্ত ডিসকাউন্ট সাশ্রয় করুন'
                    : 'Save up to 15% with longer subscription plans'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 w-full md:w-auto">
              {DURATION_OPTIONS.map((opt) => {
                const isDurSelected = selectedMonths === opt.months
                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setSelectedMonths(opt.months)}
                    className={`px-3.5 py-2.5 rounded-xl text-center border-2 transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                      isDurSelected
                        ? 'border-[var(--brand)] bg-[var(--brand)] text-white font-bold shadow-sm -translate-y-0.5'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)]/40 font-semibold'
                    }`}
                  >
                    <span className="text-[0.8125rem] leading-tight">
                      {isBn ? opt.labelBn : opt.labelEn}
                    </span>
                    {opt.discount > 0 ? (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md mt-1 ${
                          isDurSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-green-500/15 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {opt.discount}% {isBn ? 'ছাড়' : 'off'}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-medium mt-1 ${
                          isDurSelected ? 'text-white/80' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {isBn ? 'রেগুলার' : 'Regular'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 3. Choose Bangladeshi Payment Gateway */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0 flex items-center gap-2">
              <CreditCard size={16} className="text-[var(--brand)]" />
              {isBn ? '২. পেমেন্ট মেথড বা গেটওয়ে বেছে নিন' : '2. Select Bangladeshi Payment Gateway'}
            </h4>
            <span className="text-[0.6875rem] text-[var(--text-muted)]">
              {isBn ? 'বিকাশ, নগদ, রকেট, উপায় বা ব্যাংক ট্রান্সফার' : 'bKash, Nagad, Rocket, Upay or Bank'}
            </span>
          </div>

          {/* Gateway Cards Grid with Authentic Brand Logos */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {availableGateways.map((gKey) => {
              const meta = GATEWAY_METAS[gKey]
              const isSelected = selectedGateway === gKey
              const cfg = gKey === 'bank' ? gatewaysConfig.bank : (gatewaysConfig as any)[gKey]
              const isActive = cfg ? cfg.active !== false : true

              return (
                <button
                  type="button"
                  key={gKey}
                  onClick={() => setSelectedGateway(gKey)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col items-center text-center group ${
                    isSelected
                      ? `${meta.borderActive} shadow-md -translate-y-0.5`
                      : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--border)]/90 hover:bg-[var(--bg-secondary)]/50'
                  }`}
                  style={{
                    background: isSelected ? meta.bgLight : undefined,
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-xs transition-transform group-hover:scale-105">
                    <PaymentMethodLogo method={gKey} size={42} />
                  </div>
                  <div className="font-bold text-[0.875rem] text-[var(--text-primary)] leading-tight">
                    {isBn ? meta.nameBn : meta.name}
                  </div>
                  <div className="text-[0.5625rem] text-[var(--text-muted)] mt-0.5 uppercase tracking-wider font-semibold">
                    {meta.tag}
                  </div>
                  {!isActive && (
                    <span className="mt-1.5 px-2 py-0.2 rounded-full text-[0.5625rem] bg-gray-500/10 text-gray-500 font-medium">
                      {isBn ? 'অফলাইন' : 'Offline'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Super Admin Official Gateway Account Details Box */}
          <div
            className="p-5 sm:p-6 rounded-2xl border-2 transition-all shadow-xs"
            style={{
              borderColor: `${currentGatewayMeta.color}40`,
              background: `linear-gradient(135deg, ${currentGatewayMeta.bgLight} 0%, var(--bg-primary) 60%, ${currentGatewayMeta.bgLight} 100%)`,
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <PaymentMethodLogo method={selectedGateway} size={48} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[1rem] font-bold text-[var(--text-primary)] m-0">
                      {isBn
                        ? `সুপার অ্যাডমিন অফিশিয়াল ${currentGatewayMeta.nameBn} অ্যাকাউন্ট`
                        : `Super Admin Official ${currentGatewayMeta.name} Account`}
                    </h4>
                    {selectedGateway !== 'bank' && (
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider"
                        style={{
                          background: currentGatewayMeta.bgLight,
                          color: currentGatewayMeta.color,
                        }}
                      >
                        {(currentGatewayCfg as any)?.type || 'Merchant'}
                      </span>
                    )}
                  </div>
                  <p className="text-[0.75rem] text-[var(--text-muted)] mt-1 mb-0">
                    {isBn
                      ? 'নির্ধারিত অ্যাকাউন্টে ফি পাঠিয়ে নিচের ফর্মে ট্রানজেকশন রেফারেন্স প্রদান করুন।'
                      : 'Send package fee to this account and submit the transaction reference below.'}
                  </p>
                </div>
              </div>

              {/* Number / Account Copy Box */}
              {selectedGateway !== 'bank' ? (
                <div className="flex items-center gap-2">
                  <div
                    className="px-4 py-2 rounded-xl border bg-[var(--bg-primary)] flex items-center gap-3 shadow-xs"
                    style={{ borderColor: `${currentGatewayMeta.color}50` }}
                  >
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                        {isBn ? 'প্রাপক অ্যাকাউন্ট' : 'Recipient Account'}
                      </div>
                      <span className="text-[1rem] font-mono font-extrabold tracking-wide" style={{ color: currentGatewayMeta.color }}>
                        {(currentGatewayCfg as any)?.number || '01700-123456'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors border-none bg-transparent cursor-pointer"
                      style={{ color: currentGatewayMeta.color }}
                      title={isBn ? 'নম্বর কপি করুন' : 'Copy Number'}
                    >
                      {copiedNumber ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bank details card if bank is selected */}
            {selectedGateway === 'bank' && (
              <div className="mb-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-[0.75rem]">
                <div>
                  <span className="text-[var(--text-muted)] block text-[0.6875rem]">{isBn ? 'ব্যাংকের নাম' : 'Bank Name'}</span>
                  <strong className="text-[var(--text-primary)] font-bold text-[0.8125rem]">
                    {gatewaysConfig.bank?.bankName || 'Dutch-Bangla Bank PLC'}
                  </strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[0.6875rem]">{isBn ? 'হিসাবের নাম' : 'Account Name'}</span>
                  <strong className="text-[var(--text-primary)] font-bold text-[0.8125rem]">
                    {gatewaysConfig.bank?.accountName || 'EduTech Pro BD Ltd.'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[0.6875rem]">{isBn ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}</span>
                    <strong className="text-[var(--brand)] font-mono font-bold text-[0.875rem]">
                      {gatewaysConfig.bank?.accountNumber || '123-151-0009876'}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(gatewaysConfig.bank?.accountNumber || '123-151-0009876')
                      setCopiedBankAcc(true)
                      setTimeout(() => setCopiedBankAcc(false), 2000)
                    }}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors border-none bg-transparent cursor-pointer"
                  >
                    {copiedBankAcc ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[0.6875rem]">{isBn ? 'শাখা' : 'Branch'}</span>
                  <span className="text-[var(--text-primary)]">{gatewaysConfig.bank?.branch || 'Gulshan Branch, Dhaka'}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[0.6875rem]">{isBn ? 'রাউটিং নম্বর' : 'Routing Number'}</span>
                  <span className="text-[var(--text-primary)] font-mono">{gatewaysConfig.bank?.routingNumber || '090261234'}</span>
                </div>
              </div>
            )}

            {/* Payment Steps / Instructions */}
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.75rem] space-y-2">
              <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-1.5">
                <HelpCircle size={15} style={{ color: currentGatewayMeta.color }} />
                <span>{isBn ? `${currentGatewayMeta.nameBn} পেমেন্টের নিয়মাবলী:` : `How to Pay via ${currentGatewayMeta.name}:`}</span>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-[var(--text-secondary)] m-0 leading-relaxed">
                {selectedGateway !== 'bank' ? (
                  <>
                    <li>
                      {isBn
                        ? `${currentGatewayMeta.nameBn} অ্যাপ অথবা USSD কোড ডায়াল করে '${(currentGatewayCfg as any)?.type === 'merchant' ? 'Payment' : 'Send Money'}' অপশন বেছে নিন।`
                        : `Open ${currentGatewayMeta.name} App or dial USSD and select '${(currentGatewayCfg as any)?.type === 'merchant' ? 'Payment' : 'Send Money'}'.`}
                    </li>
                    <li>
                      {isBn ? 'প্রাপক অ্যাকাউন্ট নম্বর দিন: ' : 'Enter Recipient Number: '}
                      <strong style={{ color: currentGatewayMeta.color }}>
                        {(currentGatewayCfg as any)?.number || '01700-123456'}
                      </strong>
                    </li>
                  </>
                ) : (
                  <li>
                    {isBn
                      ? 'NPSB, BEFTN, বা সরাসরি ব্যাংক শাখায় উক্ত ব্যাংক অ্যাকাউন্টে মোট পরিমাণ জমা দিন।'
                      : 'Transfer via NPSB, BEFTN, or deposit directly to the above bank account.'}
                  </li>
                )}

                <li>
                  {isBn ? 'টাকার পরিমাণ দিন: ' : 'Enter Amount: '}
                  <strong style={{ color: currentGatewayMeta.color }}>৳{payableAmount.toLocaleString()} BDT</strong>
                </li>

                <li className="flex items-center gap-1.5 flex-wrap">
                  <span>
                    {isBn ? 'রেফারেন্স কোডে আপনার প্রতিষ্ঠান কোড দিন: ' : 'Enter Reference Code: '}
                    <strong className="text-[var(--brand)] font-mono">
                      {currentSchool?.eiin || currentSchool?.slug || 'SCHOOL'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="px-2 py-0.5 rounded text-[0.625rem] font-medium bg-[var(--border)] hover:bg-[var(--brand)] hover:text-white transition-colors border-none cursor-pointer"
                  >
                    {copiedRef ? (isBn ? 'কপি হয়েছে' : 'Copied!') : (isBn ? 'কপি' : 'Copy')}
                  </button>
                </li>

                <li>
                  {isBn
                    ? 'লেনদেন সফল হলে ট্রানজেকশন আইডি (TrxID) বা ব্যাংক স্লিপ নম্বর সংরক্ষণ করুন এবং নিচের ভেরিফিকেশন ফর্মে জমা দিন।'
                    : 'Once payment completes, save the Transaction ID (TrxID) and submit it in the form below.'}
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* 4. Payment Submission Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
            <h4 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0 flex items-center gap-2.5">
              <PaymentMethodLogo method={selectedGateway} size={24} />
              <span>{isBn ? '৩. পেমেন্ট তথ্য ভেরিফিকেশনের জন্য জমা দিন' : '3. Submit Payment for Verification'}</span>
            </h4>
            <span
              className="px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold"
              style={{
                background: currentGatewayMeta.bgLight,
                color: currentGatewayMeta.color,
              }}
            >
              {currentGatewayMeta.name}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[0.75rem] flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-[0.75rem] flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[0.6875rem] text-[var(--text-muted)] uppercase tracking-wider block font-semibold">
                {isBn ? 'নির্বাচিত প্যাকেজ ও মেয়াদ' : 'Selected Plan & Duration'}
              </span>
              <span className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                {activePackage.name} • {selectedMonths} {isBn ? 'মাস' : 'month(s)'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[0.6875rem] text-[var(--text-muted)] uppercase tracking-wider block font-semibold">
                {isBn ? 'পরিশোধযোগ্য সর্বমোট' : 'Total Payable'}
              </span>
              <div className="flex items-center gap-1.5 justify-end">
                {discountAmount > 0 && (
                  <span className="text-[0.75rem] text-[var(--text-muted)] line-through">
                    ৳{subtotal.toLocaleString()}
                  </span>
                )}
                <span className="text-[1.25rem] font-extrabold" style={{ color: currentGatewayMeta.color }}>
                  ৳{payableAmount.toLocaleString()} BDT
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sender Number / Account */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {selectedGateway === 'bank'
                  ? (isBn ? 'প্রেরক ব্যাংক অ্যাকাউন্ট বা জমা প্রদানকারীর নাম' : 'Sender Bank Account or Depositor Name')
                  : (isBn ? `প্রেরক ${currentGatewayMeta.nameBn} নম্বর` : `Sender ${currentGatewayMeta.name} Number`)}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder={selectedGateway === 'bank' ? 'Account No / Depositor Name' : '017xxxxxxxx'}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-mono outline-none focus:border-[var(--brand)] transition-colors"
              />
            </div>

            {/* Transaction ID (TrxID) */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                {isBn ? 'ট্রানজেকশন আইডি (TrxID) / স্লিপ রেফারেন্স' : 'Transaction ID (TrxID) / Slip Ref'}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                placeholder="e.g. 9J28AB34XYZ"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-mono uppercase font-bold outline-none focus:border-[var(--brand)] transition-colors"
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
              placeholder={isBn ? 'যেমন: বার্ষিক রিনিউয়াল বা বিশেষ নোট...' : 'e.g. Annual renewal or payment note...'}
              className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[0.8125rem] font-bold transition-all shadow-md cursor-pointer border-none disabled:opacity-50 hover:opacity-95"
              style={{ background: currentGatewayMeta.color }}
            >
              <Send size={15} />
              {isSubmitting
                ? (isBn ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...')
                : (isBn ? 'পেমেন্ট তথ্য ভেরিফিকেশনে জমা দিন' : 'Submit Payment for Verification')}
            </button>
          </div>
        </form>

        {/* 5. Payment Submission History Table */}
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
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xs">
              <table className="w-full text-left border-collapse text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3.5">{isBn ? 'তারিখ' : 'Date'}</th>
                    <th className="py-3 px-3.5">{isBn ? 'মেথড' : 'Method'}</th>
                    <th className="py-3 px-3.5">{isBn ? 'প্যাকেজ ও মেয়াদ' : 'Package & Period'}</th>
                    <th className="py-3 px-3.5">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="py-3 px-3.5">{isBn ? 'TrxID' : 'TrxID'}</th>
                    <th className="py-3 px-3.5">{isBn ? 'প্রেরক' : 'Sender'}</th>
                    <th className="py-3 px-3.5">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {myPayments.map((p) => {
                    const methodKey = (p.paymentMethod || 'bkash') as PaymentMethodType
                    const meta = GATEWAY_METAS[methodKey] || GATEWAY_METAS.bkash

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
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <PaymentMethodLogo method={methodKey} size={20} />
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.6875rem] font-bold"
                              style={{
                                background: meta.bgLight,
                                color: meta.color,
                              }}
                            >
                              {meta.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 font-medium text-[var(--text-primary)]">
                          {p.packageName} ({p.months} {isBn ? 'মাস' : 'mo'})
                        </td>
                        <td className="py-3 px-3.5 font-bold whitespace-nowrap" style={{ color: meta.color }}>
                          ৳{p.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 font-mono font-semibold text-[var(--brand)] whitespace-nowrap">
                          {p.trxId}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                          {p.senderNumber || p.senderBkashNumber}
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
