import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Copy,
  Settings,
  TrendingUp,
  Eye,
  ShieldCheck,
  Edit3,
} from 'lucide-react'
import {
  useInstitutionPaymentStore,
  type InstitutionPayment,
  type PaymentMethodType,
  type PaymentGatewaysConfig,
  DEFAULT_GATEWAYS_CONFIG,
} from '@/store/institutionPaymentStore'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useTabSlider } from '@/hooks/useTabSlider'
import { GATEWAY_METAS } from '@/pages/settings/panels/SubscriptionPaymentPanel'
import { PaymentMethodLogo } from '@/components/ui/PaymentMethodLogo'

interface Props {
  isBn: boolean
}

export default function PaymentsPage({ isBn }: Props) {
  const rawGatewaysConfig = useInstitutionPaymentStore((s) => s.gatewaysConfig)
  const gatewaysConfig = rawGatewaysConfig || DEFAULT_GATEWAYS_CONFIG
  const payments = useInstitutionPaymentStore((s) => s.payments)
  const syncFromServer = useInstitutionPaymentStore((s) => s.syncFromServer)
  const updateGatewaysConfig = useInstitutionPaymentStore((s) => s.updateGatewaysConfig)
  const updateBkashConfig = useInstitutionPaymentStore((s) => s.updateBkashConfig)
  const approvePayment = useInstitutionPaymentStore((s) => s.approvePayment)
  const rejectPayment = useInstitutionPaymentStore((s) => s.rejectPayment)

  const institutions = useSuperAdminStore((s) => s.institutions)
  const packages = useSuperAdminStore((s) => s.packages)
  const updateInstitution = useSuperAdminStore((s) => s.updateInstitution)

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [gatewayFilter, setGatewayFilter] = useState<'all' | PaymentMethodType>('all')
  const [search, setSearch] = useState('')

  // Modals
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [cfgTab, setCfgTab] = useState<PaymentMethodType>('bkash')
  const [viewPayment, setViewPayment] = useState<InstitutionPayment | null>(null)
  const [rejectingPayment, setRejectingPayment] = useState<InstitutionPayment | null>(null)
  const [rejectionReason, setRejectionReason] = useState('Transaction ID (TrxID) not found')
  const [customReason, setCustomReason] = useState('')
  const [approvingPayment, setApprovingPayment] = useState<InstitutionPayment | null>(null)
  const [approvedPkgName, setApprovedPkgName] = useState<string>('Standard')
  const [approvedMonths, setApprovedMonths] = useState<number>(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Direct Institution Package Update Modal
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [pkgTargetSchoolId, setPkgTargetSchoolId] = useState<string>('')
  const [pkgSelectedName, setPkgSelectedName] = useState<string>('Standard')
  const [pkgMonthsToAdd, setPkgMonthsToAdd] = useState<number>(1)
  const [pkgUpdateSuccess, setPkgUpdateSuccess] = useState(false)

  // Gateway Config Local Form State
  const [localGateways, setLocalGateways] = useState<PaymentGatewaysConfig>(gatewaysConfig)

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

  useEffect(() => {
    void syncFromServer()
  }, [syncFromServer])

  useEffect(() => {
    if (gatewaysConfig) {
      setLocalGateways(gatewaysConfig)
    }
  }, [gatewaysConfig])

  // Aggregate Metrics
  const stats = useMemo(() => {
    const totalCollected = payments
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const pendingList = payments.filter((p) => p.status === 'pending')
    const pendingCount = pendingList.length
    const pendingAmount = pendingList.reduce((sum, p) => sum + (p.amount || 0), 0)

    const approvedCount = payments.filter((p) => p.status === 'approved').length
    const rejectedCount = payments.filter((p) => p.status === 'rejected').length

    return {
      totalCollected,
      pendingCount,
      pendingAmount,
      approvedCount,
      rejectedCount,
    }
  }, [payments])

  const tabs = [
    { key: 'all', label: isBn ? 'সকল পেমেন্ট' : 'All Payments', count: payments.length },
    { key: 'pending', label: isBn ? 'যাচাই অপেক্ষমাণ' : 'Pending Verification', count: stats.pendingCount },
    { key: 'approved', label: isBn ? 'অনুমোদিত' : 'Approved', count: stats.approvedCount },
    { key: 'rejected', label: isBn ? 'বাতিল' : 'Rejected', count: stats.rejectedCount },
  ]

  // Filtered List
  const filteredPayments = useMemo(() => {
    let list = [...payments]

    // Tab filter
    if (activeTab !== 'all') {
      list = list.filter((p) => p.status === activeTab)
    }

    // Gateway filter
    if (gatewayFilter !== 'all') {
      list = list.filter((p) => (p.paymentMethod || 'bkash') === gatewayFilter)
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.schoolName.toLowerCase().includes(q) ||
          p.schoolSlug.toLowerCase().includes(q) ||
          (p.eiin && p.eiin.includes(q)) ||
          p.trxId.toLowerCase().includes(q) ||
          (p.senderNumber && p.senderNumber.includes(q)) ||
          (p.senderBkashNumber && p.senderBkashNumber.includes(q)) ||
          p.packageName.toLowerCase().includes(q)
      )
    }

    return list
  }, [payments, activeTab, gatewayFilter, search])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSaveGateways = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateGatewaysConfig(localGateways)
    if (localGateways.bkash) {
      await updateBkashConfig(localGateways.bkash)
    }
    setShowConfigModal(false)
  }

  const handleStartApprove = (p: InstitutionPayment) => {
    setApprovingPayment(p)
    setApprovedPkgName(p.packageName || 'Standard')
    setApprovedMonths(p.months || 1)
  }

  const handleConfirmApprove = async () => {
    if (!approvingPayment) return
    await approvePayment(approvingPayment.id, 'Super Admin', {
      packageName: approvedPkgName,
      months: approvedMonths,
    })
    setApprovingPayment(null)
  }

  const handleConfirmReject = async () => {
    if (!rejectingPayment) return
    const finalReason = rejectionReason === 'other' ? customReason.trim() || 'Payment verification failed' : rejectionReason
    await rejectPayment(rejectingPayment.id, finalReason, 'Super Admin')
    setRejectingPayment(null)
    setCustomReason('')
  }

  const handleDirectPackageUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pkgTargetSchoolId) return

    const inst = institutions.find((i) => i.id === pkgTargetSchoolId)
    if (!inst) return

    const matchedPkg = packages.find((p) => p.name.toLowerCase() === pkgSelectedName.toLowerCase()) || {
      ...inst.package,
      name: pkgSelectedName,
    }

    const currentExpiry = inst.expiresAt ? new Date(inst.expiresAt) : new Date()
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
    const newExpiry = new Date(baseDate)
    newExpiry.setMonth(newExpiry.getMonth() + pkgMonthsToAdd)

    updateInstitution(inst.id, {
      package: matchedPkg,
      expiresAt: newExpiry.toISOString(),
      status: 'active',
    })

    setPkgUpdateSuccess(true)
    setTimeout(() => {
      setPkgUpdateSuccess(false)
      setShowPackageModal(false)
    }, 1500)
  }

  const gatewayKeys: PaymentMethodType[] = ['bkash', 'nagad', 'rocket', 'upay', 'bank']

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Bangladeshi Payment Gateways Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.375rem] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <CreditCard size={24} className="text-[#D12053]" />
            {isBn ? 'প্রতিষ্ঠানসমূহের সাবস্ক্রিপশন ও পেমেন্ট গেটওয়ে' : 'Institution Subscription Payments & Gateways'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5">
            {isBn
              ? 'বিকাশ, নগদ, রকেট, উপায় ও ব্যাংক পেমেন্ট যাচাই, ট্রানজেকশন অনুমোদন এবং প্যাকেজ ম্যানেজমেন্ট'
              : 'Verify bKash, Nagad, Rocket, Upay & Bank payments, approve transactions, and manage packages'}
          </p>
        </div>

        {/* Action Buttons: Gateways Setup & Direct Package Update */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              if (institutions.length > 0 && !pkgTargetSchoolId) {
                setPkgTargetSchoolId(institutions[0].id)
              }
              setShowPackageModal(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] text-[0.8125rem] font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Edit3 size={15} className="text-[var(--brand)]" />
            {isBn ? 'সরাসরি প্যাকেজ পরিবর্তন' : 'Update School Package'}
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm border-none"
          >
            <Settings size={15} />
            {isBn ? 'পেমেন্ট গেটওয়ে অ্যাকাউন্ট সেটআপ' : 'Setup Payment Gateways'}
          </button>
        </div>
      </div>

      {/* 2. Top Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {isBn ? 'মোট প্রাপ্ত রাজস্ব' : 'Total Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-[1.5rem] font-extrabold text-[var(--text-primary)]">
            ৳{stats.totalCollected.toLocaleString()}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1 flex items-center gap-1">
            <span>{stats.approvedCount} {isBn ? 'টি অনুমোদিত পেমেন্ট' : 'approved payments'}</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className={`p-4 rounded-2xl border ${stats.pendingCount > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-[var(--border)] bg-[var(--bg-primary)]'} shadow-xs`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] font-semibold text-amber-500 uppercase tracking-wider">
              {isBn ? 'যাচাই অপেক্ষমাণ' : 'Pending Verification'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-[1.5rem] font-extrabold text-amber-500">
            {stats.pendingCount}{' '}
            <span className="text-[0.875rem] font-semibold text-[var(--text-muted)]">
              (৳{stats.pendingAmount.toLocaleString()})
            </span>
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1">
            {isBn ? 'অনুমোদনের জন্য অপেক্ষমাণ ট্রানজেকশন' : 'Requires verification & approval'}
          </div>
        </div>

        {/* Approved Count */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {isBn ? 'অনুমোদিত পেমেন্ট' : 'Approved Payments'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-[1.5rem] font-extrabold text-green-500">
            {stats.approvedCount}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1">
            {isBn ? 'সফলভাবে নবায়িত ও প্যাকেজ আপগ্রেড' : 'Extended & updated successfully'}
          </div>
        </div>

        {/* Active Receiving Gateways Summary */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {isBn ? 'সক্রিয় গেটওয়েসমূহ' : 'Active Gateways'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {gatewayKeys.map((k) => {
              const meta = GATEWAY_METAS[k]
              const cfg = k === 'bank' ? gatewaysConfig.bank : (gatewaysConfig as any)[k]
              const active = cfg ? cfg.active !== false : true
              if (!active) return null

              return (
                <div
                  key={k}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[0.6875rem] font-bold border shadow-2xs"
                  style={{ background: meta.bgLight, color: meta.color, borderColor: `${meta.color}30` }}
                >
                  <PaymentMethodLogo method={k} size={15} />
                  <span>{meta.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="space-y-4">
        {/* Status Tabs Slider */}
        <div className="relative border-b border-[var(--border)]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.key, el)
                  else tabRefs.current.delete(tab.key)
                }}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8125rem] font-semibold transition-colors cursor-pointer border-none bg-transparent whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-[var(--brand)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[0.6875rem] font-bold ${
                    activeTab === tab.key
                      ? 'bg-[var(--brand)] text-white'
                      : 'bg-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div
            ref={sliderRef}
            className="absolute bottom-0 h-0.5 bg-[var(--brand)] transition-all duration-300 rounded-full"
          />
        </div>

        {/* Gateway & Search Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Gateway selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setGatewayFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[0.75rem] font-semibold border transition-all cursor-pointer ${
                gatewayFilter === 'all'
                  ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                  : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)]'
              }`}
            >
              {isBn ? 'সকল গেটওয়ে' : 'All Gateways'}
            </button>

            {gatewayKeys.map((gk) => {
              const meta = GATEWAY_METAS[gk]
              const isSelected = gatewayFilter === gk

              return (
                <button
                  key={gk}
                  onClick={() => setGatewayFilter(gk)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? `${meta.borderActive} shadow-xs`
                      : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                  }`}
                  style={{
                    background: isSelected ? meta.bgLight : undefined,
                    color: isSelected ? meta.color : undefined,
                  }}
                >
                  <PaymentMethodLogo method={gk} size={16} />
                  <span>{meta.name}</span>
                </button>
              )
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBn ? 'স্কুল, TrxID, প্রেরক নম্বর অনুসন্ধান...' : 'Search school, TrxID, mobile...'}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            />
          </div>
        </div>
      </div>

      {/* 4. Payment Records Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] text-center text-[var(--text-muted)] bg-[var(--bg-primary)]">
          <CreditCard size={36} className="mx-auto mb-2 opacity-30 text-[var(--brand)]" />
          <p className="text-[0.875rem] font-medium m-0">
            {isBn ? 'কোনো পেমেন্ট রেকর্ড খুঁজে পাওয়া যায়নি' : 'No payment records match the filter'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[0.8125rem]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{isBn ? 'প্রতিষ্ঠান' : 'Institution'}</th>
                  <th className="py-3 px-4">{isBn ? 'পদ্ধতি' : 'Method'}</th>
                  <th className="py-3 px-4">{isBn ? 'প্যাকেজ ও মেয়াদ' : 'Package & Period'}</th>
                  <th className="py-3 px-4">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="py-3 px-4">{isBn ? 'TrxID' : 'TrxID'}</th>
                  <th className="py-3 px-4">{isBn ? 'প্রেরক নম্বর' : 'Sender'}</th>
                  <th className="py-3 px-4">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="py-3 px-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredPayments.map((p) => {
                  const methodKey = (p.paymentMethod || 'bkash') as PaymentMethodType
                  const meta = GATEWAY_METAS[methodKey] || GATEWAY_METAS.bkash
                  const isPending = p.status === 'pending'

                  return (
                    <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      {/* Institution */}
                      <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                        <div>{p.schoolName}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1.5 font-mono">
                          <span>{p.schoolSlug}</span>
                          {p.eiin && <span>• EIIN: {p.eiin}</span>}
                        </div>
                      </td>

                      {/* Method Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <PaymentMethodLogo method={methodKey} size={22} />
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

                      {/* Package & Period */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-[var(--text-primary)]">{p.packageName}</span>
                        <span className="text-[var(--text-muted)] text-[0.6875rem] ml-1.5">
                          (+{p.months} {isBn ? 'মাস' : 'mo'})
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold whitespace-nowrap" style={{ color: meta.color }}>
                        ৳{p.amount.toLocaleString()}
                      </td>

                      {/* TrxID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[var(--brand)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{p.trxId}</span>
                          <button
                            onClick={() => handleCopy(p.trxId, p.id)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors border-none bg-transparent cursor-pointer"
                            title="Copy TrxID"
                          >
                            {copiedId === p.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Sender Mobile / Account */}
                      <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                        {p.senderNumber || p.senderBkashNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[var(--text-muted)] text-[0.75rem] whitespace-nowrap">
                        {new Date(p.submittedAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.status === 'approved' ? (
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Clock size={12} />
                            {isBn ? 'যাচাই অপেক্ষমাণ' : 'Pending'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleStartApprove(p)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-500 border border-green-500/30 text-[0.75rem] font-bold transition-all cursor-pointer"
                                title={isBn ? 'অনুমোদন ও সাবস্ক্রিপশন বৃদ্ধি' : 'Approve & extend subscription'}
                              >
                                <Check size={13} />
                                {isBn ? 'অনুমোদন' : 'Approve'}
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingPayment(p)
                                  setRejectionReason('Transaction ID (TrxID) not found')
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[0.75rem] font-medium transition-all cursor-pointer"
                                title={isBn ? 'বাতিল করুন' : 'Reject with reason'}
                              >
                                <X size={13} />
                                {isBn ? 'বাতিল' : 'Reject'}
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setViewPayment(p)}
                            className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border-none bg-transparent cursor-pointer"
                            title={isBn ? 'বিস্তারিত' : 'View Details'}
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Payment Gateways Setup Modal (All 5 Bangladeshi Gateways) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[36rem] max-w-full max-h-[90vh] flex flex-col border border-[var(--border)] shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={20} className="text-[var(--brand)]" />
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)] m-0">
                  {isBn ? 'বাংলাদেশি পেমেন্ট গেটওয়ে অ্যাকাউন্ট কনফিগারেশন' : 'Setup Bangladeshi Payment Gateways'}
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer hover:bg-[var(--border)]"
              >
                <X size={15} />
              </button>
            </div>

            {/* Gateway Tabs */}
            <div className="flex border-b border-[var(--border)] bg-[var(--bg-primary)] px-4 pt-2 gap-1 overflow-x-auto no-scrollbar">
              {gatewayKeys.map((gk) => {
                const meta = GATEWAY_METAS[gk]
                const isSelected = cfgTab === gk

                return (
                  <button
                    key={gk}
                    type="button"
                    onClick={() => setCfgTab(gk)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[0.75rem] font-bold border-b-2 transition-all cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 whitespace-nowrap"
                    style={{
                      borderBottomColor: isSelected ? meta.color : 'transparent',
                      color: isSelected ? meta.color : undefined,
                    }}
                  >
                    <PaymentMethodLogo method={gk} size={16} />
                    <span>{meta.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Gateway Configuration Form */}
            <form onSubmit={handleSaveGateways} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Gateway Banner Preview */}
              <div
                className="flex items-center gap-3 p-3.5 rounded-xl border"
                style={{
                  background: GATEWAY_METAS[cfgTab].bgLight,
                  borderColor: `${GATEWAY_METAS[cfgTab].color}30`,
                }}
              >
                <PaymentMethodLogo method={cfgTab} size={36} />
                <div>
                  <h4 className="text-[0.875rem] font-bold m-0" style={{ color: GATEWAY_METAS[cfgTab].color }}>
                    {GATEWAY_METAS[cfgTab].name} ({GATEWAY_METAS[cfgTab].nameBn})
                  </h4>
                  <span className="text-[0.6875rem] text-[var(--text-muted)]">
                    {GATEWAY_METAS[cfgTab].tag}
                  </span>
                </div>
              </div>

              {/* Active Toggle for this Gateway */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div>
                  <div className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
                    {isBn ? `${GATEWAY_METAS[cfgTab].nameBn} পেমেন্ট সক্রিয় রাখুন` : `Enable ${GATEWAY_METAS[cfgTab].name} Gateway`}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {isBn ? 'প্রতিষ্ঠানসমূহ এই গেটওয়েতে ফি পাঠাতে পারবে' : 'Institutions can submit fees via this gateway'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      cfgTab === 'bank'
                        ? localGateways.bank?.active !== false
                        : (localGateways[cfgTab] as any)?.active !== false
                    }
                    onChange={(e) => {
                      const val = e.target.checked
                      if (cfgTab === 'bank') {
                        setLocalGateways((prev) => ({
                          ...prev,
                          bank: { ...prev.bank, active: val },
                        }))
                      } else {
                        setLocalGateways((prev) => ({
                          ...prev,
                          [cfgTab]: { ...prev[cfgTab], active: val },
                        }))
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--brand)]"></div>
                </label>
              </div>

              {cfgTab !== 'bank' ? (
                <>
                  {/* Account Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      {isBn ? `${GATEWAY_METAS[cfgTab].nameBn} প্রাপক নম্বর` : `${GATEWAY_METAS[cfgTab].name} Receiving Number`}
                    </label>
                    <input
                      type="text"
                      value={(localGateways[cfgTab] as any)?.number || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setLocalGateways((prev) => ({
                          ...prev,
                          [cfgTab]: { ...prev[cfgTab], number: val },
                        }))
                      }}
                      placeholder="01700-123456"
                      className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.875rem] font-mono font-bold outline-none focus:border-[var(--brand)]"
                      required
                    />
                  </div>

                  {/* Account Type (Merchant / Personal / Agent) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      {isBn ? 'অ্যাকাউন্টের ধরন' : 'Account Type'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['merchant', 'personal', 'agent'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setLocalGateways((prev) => ({
                              ...prev,
                              [cfgTab]: { ...prev[cfgTab], type: t },
                            }))
                          }}
                          className={`py-2 px-3 rounded-xl border text-[0.75rem] font-bold uppercase transition-all cursor-pointer ${
                            (localGateways[cfgTab] as any)?.type === t
                              ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                              : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Bank Transfer Fields */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        {isBn ? 'ব্যাংকের নাম' : 'Bank Name'}
                      </label>
                      <input
                        type="text"
                        value={localGateways.bank?.bankName || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setLocalGateways((prev) => ({
                            ...prev,
                            bank: { ...prev.bank, bankName: val },
                          }))
                        }}
                        className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]"
                        placeholder="Dutch-Bangla Bank PLC"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        {isBn ? 'হিসাবের নাম' : 'Account Name'}
                      </label>
                      <input
                        type="text"
                        value={localGateways.bank?.accountName || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setLocalGateways((prev) => ({
                            ...prev,
                            bank: { ...prev.bank, accountName: val },
                          }))
                        }}
                        className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]"
                        placeholder="EduTech Pro BD Ltd."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        {isBn ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}
                      </label>
                      <input
                        type="text"
                        value={localGateways.bank?.accountNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setLocalGateways((prev) => ({
                            ...prev,
                            bank: { ...prev.bank, accountNumber: val },
                          }))
                        }}
                        className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-mono outline-none focus:border-[var(--brand)]"
                        placeholder="123-151-0009876"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        {isBn ? 'শাখা' : 'Branch'}
                      </label>
                      <input
                        type="text"
                        value={localGateways.bank?.branch || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setLocalGateways((prev) => ({
                            ...prev,
                            bank: { ...prev.bank, branch: val },
                          }))
                        }}
                        className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]"
                        placeholder="Gulshan Branch"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        {isBn ? 'রাউটিং নম্বর' : 'Routing Number'}
                      </label>
                      <input
                        type="text"
                        value={localGateways.bank?.routingNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setLocalGateways((prev) => ({
                            ...prev,
                            bank: { ...prev.bank, routingNumber: val },
                          }))
                        }}
                        className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-mono outline-none focus:border-[var(--brand)]"
                        placeholder="090261234"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions EN */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {isBn ? 'নির্দেশনাবলী (English)' : 'Instructions (English)'}
                </label>
                <textarea
                  rows={2}
                  value={
                    cfgTab === 'bank'
                      ? localGateways.bank?.instructions || ''
                      : (localGateways[cfgTab] as any)?.instructions || ''
                  }
                  onChange={(e) => {
                    const val = e.target.value
                    if (cfgTab === 'bank') {
                      setLocalGateways((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, instructions: val },
                      }))
                    } else {
                      setLocalGateways((prev) => ({
                        ...prev,
                        [cfgTab]: { ...prev[cfgTab], instructions: val },
                      }))
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] resize-none"
                />
              </div>

              {/* Instructions BN */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {isBn ? 'নির্দেশনাবলী (বাংলা)' : 'Instructions (Bengali)'}
                </label>
                <textarea
                  rows={2}
                  value={
                    cfgTab === 'bank'
                      ? localGateways.bank?.instructionsBn || ''
                      : (localGateways[cfgTab] as any)?.instructionsBn || ''
                  }
                  onChange={(e) => {
                    const val = e.target.value
                    if (cfgTab === 'bank') {
                      setLocalGateways((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, instructionsBn: val },
                      }))
                    } else {
                      setLocalGateways((prev) => ({
                        ...prev,
                        [cfgTab]: { ...prev[cfgTab], instructionsBn: val },
                      }))
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-[0.8125rem] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors border-none bg-transparent cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-bold hover:opacity-90 transition-opacity border-none cursor-pointer shadow-sm"
                >
                  {isBn ? 'সকল গেটওয়ে সংরক্ষণ করুন' : 'Save All Gateways'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Approve Confirmation & Package Selection Modal */}
      {approvingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[30rem] max-w-full border border-[var(--border)] shadow-2xl p-6 text-center animate-scale-up space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/15 text-green-500 mx-auto flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h3 className="text-[1.125rem] font-bold text-[var(--text-primary)] m-0">
                {isBn ? 'পেমেন্ট অনুমোদন ও প্যাকেজ আপডেট' : 'Approve Payment & Update Package'}
              </h3>
              <p className="text-[0.8125rem] text-[var(--text-muted)] mt-1.5 mb-0">
                {isBn
                  ? `আপনি কি নিশ্চিত যে ${approvingPayment.schoolName} এর ৳${approvingPayment.amount.toLocaleString()} (TrxID: ${approvingPayment.trxId}) পেমেন্ট অনুমোদন করতে চান?`
                  : `Are you sure you want to approve payment of ৳${approvingPayment.amount.toLocaleString()} (TrxID: ${approvingPayment.trxId}) for ${approvingPayment.schoolName}?`}
              </p>
            </div>

            {/* Package & Duration Review */}
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.75rem] text-left space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {isBn ? 'প্রদানকৃত প্যাকেজ নির্বাচন / নিশ্চিত করুন' : 'Package to Assign'}
                </label>
                <select
                  value={approvedPkgName}
                  onChange={(e) => setApprovedPkgName(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold text-[0.8125rem] outline-none focus:border-[var(--brand)]"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id || pkg.name} value={pkg.name}>
                      {pkg.name} — ৳{(pkg.price || 1500).toLocaleString()}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {isBn ? 'মেয়াদ বৃদ্ধি (মাস)' : 'Subscription Extension (Months)'}
                </label>
                <select
                  value={approvedMonths}
                  onChange={(e) => setApprovedMonths(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold text-[0.8125rem] outline-none focus:border-[var(--brand)]"
                >
                  <option value={1}>1 Month (+1 মাস)</option>
                  <option value={3}>3 Months (+3 মাস)</option>
                  <option value={6}>6 Months (+6 মাস)</option>
                  <option value={12}>1 Year (+12 মাস)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[var(--border)] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">{isBn ? 'পেমেন্ট গেটওয়ে:' : 'Gateway:'}</span>
                  <span className="flex items-center gap-1.5 font-bold uppercase text-[var(--text-primary)]">
                    <PaymentMethodLogo method={approvingPayment.paymentMethod || 'bkash'} size={18} />
                    <span>{approvingPayment.paymentMethod || 'bKash'}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">{isBn ? 'প্রেরক নম্বর:' : 'Sender:'}</span>
                  <span className="font-mono">{approvingPayment.senderNumber || approvingPayment.senderBkashNumber}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingPayment(null)}
                className="px-4 py-2 rounded-xl text-[0.8125rem] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors border-none bg-transparent cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-[0.8125rem] font-bold transition-colors border-none cursor-pointer shadow-sm"
              >
                {isBn ? 'অনুমোদন ও প্যাকেজ সক্রিয় করুন' : 'Confirm & Activate Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Reject Modal with Reasons */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[30rem] max-w-full border border-[var(--border)] shadow-2xl p-6 animate-scale-up space-y-4">
            <div className="flex items-center gap-2.5 text-red-500">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle size={20} />
              </div>
              <div>
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)] m-0">
                  {isBn ? 'পেমেন্ট বাতিল ও কারণ' : 'Reject Payment Verification'}
                </h3>
                <p className="text-[0.6875rem] text-[var(--text-muted)] m-0">
                  {rejectingPayment.schoolName} • TrxID: {rejectingPayment.trxId}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                {isBn ? 'বাতিলের কারণ নির্বাচন করুন' : 'Select Rejection Reason'}
              </label>

              {[
                { id: 'Transaction ID (TrxID) not found', label: isBn ? 'ট্রানজেকশন আইডি (TrxID) পাওয়া যায়নি বা ভুল' : 'Transaction ID (TrxID) not found or invalid' },
                { id: 'Received amount does not match package fee', label: isBn ? 'প্রাপ্ত টাকার পরিমাণ প্যাকেজ ফি এর সাথে মেলেনি' : 'Received amount does not match package fee' },
                { id: 'Payment sent to incorrect account number', label: isBn ? 'ভুল অ্যাকাউন্ট নম্বরে টাকা পাঠানো হয়েছে' : 'Payment sent to incorrect account number' },
                { id: 'other', label: isBn ? 'অন্যান্য কারণ' : 'Other reason' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-[0.75rem] cursor-pointer transition-colors ${
                    rejectionReason === opt.id
                      ? 'border-red-500 bg-red-500/5 font-semibold text-[var(--text-primary)]'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={rejectionReason === opt.id}
                    onChange={() => setRejectionReason(opt.id)}
                    className="accent-red-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}

              {rejectionReason === 'other' && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={isBn ? 'বিস্তারিত কারণ লিখুন...' : 'Enter custom rejection explanation...'}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-red-500 resize-none mt-2"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2 rounded-xl text-[0.8125rem] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors border-none bg-transparent cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[0.8125rem] font-bold transition-colors border-none cursor-pointer shadow-sm"
              >
                {isBn ? 'প্রত্যাখ্যান নিশ্চিত করুন' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Detailed View Modal */}
      {viewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[32rem] max-w-full border border-[var(--border)] shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#D12053]" />
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)] m-0">
                  {isBn ? 'পেমেন্ট ট্রানজেকশন বিবরণ' : 'Payment Transaction Details'}
                </h3>
              </div>
              <button
                onClick={() => setViewPayment(null)}
                className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer hover:bg-[var(--border)]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-[0.8125rem]">
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-between">
                <div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    {isBn ? 'পরিশোধিত অর্থ' : 'Amount Paid'}
                  </div>
                  <div className="text-[1.375rem] font-extrabold text-[var(--brand)]">
                    ৳{viewPayment.amount.toLocaleString()} BDT
                  </div>
                </div>
                <div>
                  {viewPayment.status === 'approved' ? (
                    <span className="px-3 py-1 rounded-full text-[0.75rem] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                      Approved
                    </span>
                  ) : viewPayment.status === 'rejected' ? (
                    <span className="px-3 py-1 rounded-full text-[0.75rem] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                      Rejected
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[0.75rem] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[0.75rem]">
                <div>
                  <span className="text-[var(--text-muted)]">{isBn ? 'প্রতিষ্ঠানের নাম:' : 'School Name:'}</span>
                  <div className="font-bold text-[var(--text-primary)]">{viewPayment.schoolName}</div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{isBn ? 'সাবডোমেইন / স্লাগ:' : 'Slug / Subdomain:'}</span>
                  <div className="font-mono text-[var(--text-primary)]">{viewPayment.schoolSlug}</div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{isBn ? 'পেমেন্ট মেথড:' : 'Payment Method:'}</span>
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[var(--text-primary)] mt-0.5">
                    <PaymentMethodLogo method={viewPayment.paymentMethod || 'bkash'} size={18} />
                    <span>{viewPayment.paymentMethod || 'bKash'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{isBn ? 'TrxID / রেফারেন্স:' : 'TrxID / Ref:'}</span>
                  <div className="font-mono font-bold text-[var(--brand)]">{viewPayment.trxId}</div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{isBn ? 'প্রেরক নম্বর / অ্যাকাউন্ট:' : 'Sender Number:'}</span>
                  <div className="font-mono font-bold text-[var(--text-primary)]">
                    {viewPayment.senderNumber || viewPayment.senderBkashNumber}
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{isBn ? 'প্যাকেজ ও সময়কাল:' : 'Package & Months:'}</span>
                  <div className="font-bold text-[var(--text-primary)]">
                    {viewPayment.packageName} ({viewPayment.months} Month/s)
                  </div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{isBn ? 'জমার সময়:' : 'Submitted At:'}</span>
                  <div className="text-[var(--text-primary)]">
                    {new Date(viewPayment.submittedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {viewPayment.notes && (
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] mb-0.5">
                    {isBn ? 'মন্তব্য:' : 'Notes:'}
                  </div>
                  <div className="text-[var(--text-primary)]">{viewPayment.notes}</div>
                </div>
              )}

              {viewPayment.rejectionReason && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                  <div className="text-[0.6875rem] font-bold uppercase tracking-wider mb-0.5">
                    {isBn ? 'বাতিলের কারণ:' : 'Rejection Reason:'}
                  </div>
                  <div>{viewPayment.rejectionReason}</div>
                </div>
              )}

              {viewPayment.reviewedBy && (
                <div className="text-[0.6875rem] text-[var(--text-muted)] pt-1 text-right">
                  {isBn ? 'পর্যালোচনা করেছেন:' : 'Reviewed by:'} {viewPayment.reviewedBy} (
                  {viewPayment.reviewedAt ? new Date(viewPayment.reviewedAt).toLocaleDateString() : ''})
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-end">
              <button
                type="button"
                onClick={() => setViewPayment(null)}
                className="px-4 py-2 rounded-xl bg-[var(--border)] text-[var(--text-primary)] text-[0.8125rem] font-semibold hover:bg-[var(--border)]/80 transition-colors border-none cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Direct Institution Package Update Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[32rem] max-w-full border border-[var(--border)] shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-[var(--brand)]" />
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)] m-0">
                  {isBn ? 'প্রতিষ্ঠানের প্যাকেজ ও মেয়াদ আপডেট' : 'Update Institution Package & Expiry'}
                </h3>
              </div>
              <button
                onClick={() => setShowPackageModal(false)}
                className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer hover:bg-[var(--border)]"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleDirectPackageUpdate} className="p-5 space-y-4">
              {pkgUpdateSuccess && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-[0.75rem] flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} />
                  <span>{isBn ? 'প্যাকেজ সফলভাবে আপডেট করা হয়েছে!' : 'Package updated successfully!'}</span>
                </div>
              )}

              {/* Institution Select */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {isBn ? 'প্রতিষ্ঠান নির্বাচন করুন' : 'Select Institution'}
                </label>
                <select
                  value={pkgTargetSchoolId}
                  onChange={(e) => setPkgTargetSchoolId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] font-medium"
                  required
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.slug}) — বর্তমান: {inst.package?.name || 'Standard'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Package Select */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {isBn ? 'নতুন প্যাকেজ' : 'Assign Package'}
                </label>
                <select
                  value={pkgSelectedName}
                  onChange={(e) => setPkgSelectedName(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] font-bold"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id || pkg.name} value={pkg.name}>
                      {pkg.name} — ৳{(pkg.price || 1500).toLocaleString()}/mo ({pkg.maxStudents} students)
                    </option>
                  ))}
                </select>
              </div>

              {/* Extension Duration */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {isBn ? 'মেয়াদ বৃদ্ধি (মাস)' : 'Add Duration (Months)'}
                </label>
                <select
                  value={pkgMonthsToAdd}
                  onChange={(e) => setPkgMonthsToAdd(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]"
                >
                  <option value={1}>1 Month (+১ মাস)</option>
                  <option value={3}>3 Months (+৩ মাস)</option>
                  <option value={6}>6 Months (+৬ মাস)</option>
                  <option value={12}>1 Year (+১২ মাস)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 rounded-xl text-[0.8125rem] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors border-none bg-transparent cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-bold hover:opacity-90 transition-opacity border-none cursor-pointer shadow-sm"
                >
                  {isBn ? 'প্যাকেজ প্রয়োগ করুন' : 'Apply Package Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
