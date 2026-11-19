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
  RefreshCw,
  Eye,
} from 'lucide-react'
import {
  useInstitutionPaymentStore,
  type InstitutionPayment,
  type BkashConfig,
} from '@/store/institutionPaymentStore'
import { useTabSlider } from '@/hooks/useTabSlider'

interface Props {
  isBn: boolean
}

export default function PaymentsPage({ isBn }: Props) {
  const bkashConfig = useInstitutionPaymentStore((s) => s.bkashConfig)
  const payments = useInstitutionPaymentStore((s) => s.payments)
  const isLoading = useInstitutionPaymentStore((s) => s.isLoading)
  const syncFromServer = useInstitutionPaymentStore((s) => s.syncFromServer)
  const updateBkashConfig = useInstitutionPaymentStore((s) => s.updateBkashConfig)
  const approvePayment = useInstitutionPaymentStore((s) => s.approvePayment)
  const rejectPayment = useInstitutionPaymentStore((s) => s.rejectPayment)

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [search, setSearch] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [viewPayment, setViewPayment] = useState<InstitutionPayment | null>(null)
  const [rejectingPayment, setRejectingPayment] = useState<InstitutionPayment | null>(null)
  const [rejectionReason, setRejectionReason] = useState('Transaction ID (TrxID) not found')
  const [customReason, setCustomReason] = useState('')
  const [approvingPayment, setApprovingPayment] = useState<InstitutionPayment | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Config modal state
  const [cfgNumber, setCfgNumber] = useState(bkashConfig.number)
  const [cfgType, setCfgType] = useState<BkashConfig['type']>(bkashConfig.type)
  const [cfgInstructions, setCfgInstructions] = useState(bkashConfig.instructions)
  const [cfgInstructionsBn, setCfgInstructionsBn] = useState(bkashConfig.instructionsBn)

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

  useEffect(() => {
    void syncFromServer()
  }, [syncFromServer])

  useEffect(() => {
    setCfgNumber(bkashConfig.number)
    setCfgType(bkashConfig.type)
    setCfgInstructions(bkashConfig.instructions)
    setCfgInstructionsBn(bkashConfig.instructionsBn)
  }, [bkashConfig])

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

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.schoolName.toLowerCase().includes(q) ||
          p.schoolSlug.toLowerCase().includes(q) ||
          (p.eiin && p.eiin.includes(q)) ||
          p.trxId.toLowerCase().includes(q) ||
          p.senderBkashNumber.includes(q) ||
          p.packageName.toLowerCase().includes(q)
      )
    }

    return list
  }, [payments, activeTab, search])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateBkashConfig({
      number: cfgNumber.trim(),
      type: cfgType,
      instructions: cfgInstructions.trim(),
      instructionsBn: cfgInstructionsBn.trim(),
    })
    setShowConfigModal(false)
  }

  const handleConfirmApprove = async () => {
    if (!approvingPayment) return
    await approvePayment(approvingPayment.id)
    setApprovingPayment(null)
  }

  const handleConfirmReject = async () => {
    if (!rejectingPayment) return
    const finalReason = rejectionReason === 'other' ? customReason.trim() || 'Payment verification failed' : rejectionReason
    await rejectPayment(rejectingPayment.id, finalReason)
    setRejectingPayment(null)
    setCustomReason('')
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with bKash Receiving Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.375rem] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <CreditCard size={24} className="text-[#D12053]" />
            {isBn ? 'প্রতিষ্ঠানসমূহের পেমেন্ট ও বিকাশ বিলিং' : 'Institution Payments & bKash Billing'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5">
            {isBn
              ? 'স্কুল ও কলেজ কর্তৃক প্রেরিত বিকাশ পেমেন্ট যাচাই, ট্রানজেকশন অনুমোদন ও প্রাপ্ত অর্থ পর্যবেক্ষণ'
              : 'Verify received bKash subscription payments, approve TrxID, and monitor revenue'}
          </p>
        </div>

        {/* bKash Config Pill & Action Button */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 px-3.5 rounded-xl border border-[#D12053]/30 bg-[#D12053]/5 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#D12053] text-white flex items-center justify-center font-bold text-xs shrink-0">
              bK
            </div>
            <div>
              <div className="text-[0.625rem] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                {isBn ? 'সুপার অ্যাডমিন বিকাশ অ্যাকাউন্ট' : 'Super Admin bKash Account'}
              </div>
              <div className="text-[0.8125rem] font-mono font-bold text-[#D12053]">
                {bkashConfig.number}{' '}
                <span className="text-[0.6875rem] font-sans font-medium text-[var(--text-secondary)]">
                  ({bkashConfig.type})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Settings size={15} />
            {isBn ? 'বিকাশ নম্বর পরিবর্তন' : 'Configure bKash'}
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
            {isBn ? 'সফলভাবে যাচাইকৃত ও মেয়াদবর্ধিত' : 'Verified & subscription extended'}
          </div>
        </div>

        {/* Rejected Count */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {isBn ? 'বাতিলকৃত পেমেন্ট' : 'Rejected Payments'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <div className="text-[1.5rem] font-extrabold text-red-500">
            {stats.rejectedCount}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1">
            {isBn ? 'ভুল TrxID বা অমিলজনিত বাতিল' : 'Rejected due to invalid TrxID/amount'}
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="space-y-3">
        {/* Tab Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="absolute bottom-0 h-[2px] bg-[#D12053] transition-all duration-200 rounded-full"
            style={{ zIndex: 1 }}
          />
          <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.key, el)
                  else tabRefs.current.delete(tab.key)
                }}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[0.8125rem] font-semibold border-none bg-transparent cursor-pointer transition-colors shrink-0 ${
                  activeTab === tab.key
                    ? 'text-[#D12053]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[0.6875rem] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.key
                      ? 'bg-[#D12053]/15 text-[#D12053]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search bar & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isBn
                  ? 'স্কুলের নাম, EIIN, TrxID বা বিকাশ নম্বর দিয়ে খুঁজুন...'
                  : 'Search by school name, EIIN, TrxID, or sender bKash number...'
              }
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[#D12053]"
            />
          </div>

          <button
            onClick={() => syncFromServer()}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            title={isBn ? 'রিফ্রেশ করুন' : 'Refresh'}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-[var(--brand)]' : ''} />
          </button>
        </div>
      </div>

      {/* 4. Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-primary)] text-center text-[var(--text-muted)]">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <h3 className="text-[1rem] font-semibold text-[var(--text-primary)] mb-1">
            {isBn ? 'কোনো পেমেন্ট পাওয়া যায়নি' : 'No payments found'}
          </h3>
          <p className="text-[0.75rem] m-0">
            {search
              ? (isBn ? 'অনুগ্রহ করে অনুসন্ধান শব্দ পরিবর্তন করে চেষ্টা করুন।' : 'Try adjusting your search criteria.')
              : (isBn ? 'প্রতিষ্ঠানসমূহ পেমেন্ট জমা দিলে এখানে প্রদর্শিত হবে।' : 'Incoming bKash payments will appear here.')}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[0.8125rem]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">{isBn ? 'প্রতিষ্ঠান / স্কুল' : 'Institution / School'}</th>
                  <th className="py-3 px-4">{isBn ? 'প্যাকেজ ও মেয়াদ' : 'Package & Period'}</th>
                  <th className="py-3 px-4">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="py-3 px-4">{isBn ? 'বিকাশ TrxID' : 'bKash TrxID'}</th>
                  <th className="py-3 px-4">{isBn ? 'প্রেরক নম্বর' : 'Sender bKash'}</th>
                  <th className="py-3 px-4">{isBn ? 'তারিখ' : 'Date'}</th>
                  <th className="py-3 px-4">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'পদক্ষেপ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredPayments.map((p) => {
                  const isPending = p.status === 'pending'
                  const isApproved = p.status === 'approved'
                  const isRejected = p.status === 'rejected'

                  return (
                    <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/60 transition-colors">
                      {/* School Name & EIIN */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--text-primary)]">{p.schoolName}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                          <span>{p.schoolSlug}</span>
                          {p.eiin && <span>• EIIN: {p.eiin}</span>}
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{p.packageName}</span>
                          <span className="text-[0.6875rem] text-[var(--text-muted)]">
                            ({p.months} {isBn ? 'মাস' : 'mo'})
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-extrabold text-[#D12053] whitespace-nowrap">
                        ৳{p.amount.toLocaleString()} BDT
                      </td>

                      {/* TrxID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[var(--brand)]">{p.trxId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.trxId, p.id)}
                            className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-muted)] transition-colors border-none bg-transparent cursor-pointer"
                            title={isBn ? 'কপি করুন' : 'Copy TrxID'}
                          >
                            {copiedId === p.id ? (
                              <Check size={12} className="text-green-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Sender bKash Number */}
                      <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                        {p.senderBkashNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[var(--text-muted)] whitespace-nowrap text-[0.75rem]">
                        <div>{new Date(p.submittedAt).toLocaleDateString()}</div>
                        <div className="text-[0.625rem]">{new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                            <CheckCircle2 size={12} />
                            {isBn ? 'অনুমোদিত' : 'Approved'}
                          </span>
                        ) : isRejected ? (
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
                                onClick={() => setApprovingPayment(p)}
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

      {/* 5. Configure Super Admin bKash Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[32rem] max-w-full border border-[var(--border)] shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D12053] text-white flex items-center justify-center font-bold text-xs">
                  bK
                </div>
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)] m-0">
                  {isBn ? 'সুপার অ্যাডমিন বিকাশ অ্যাকাউন্ট কনফিগারেশন' : 'Configure Super Admin bKash Account'}
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center cursor-pointer hover:bg-[var(--border)]"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  {isBn ? 'বিকাশ প্রাপক নম্বর' : 'bKash Receiving Number'}
                </label>
                <input
                  type="text"
                  value={cfgNumber}
                  onChange={(e) => setCfgNumber(e.target.value)}
                  placeholder="01700-123456"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.875rem] font-mono font-bold outline-none focus:border-[#D12053]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  {isBn ? 'অ্যাকাউন্টের ধরন' : 'Account Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['merchant', 'personal', 'agent'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCfgType(t)}
                      className={`py-2 px-3 rounded-xl border text-[0.75rem] font-bold uppercase transition-all cursor-pointer ${
                        cfgType === t
                          ? 'border-[#D12053] bg-[#D12053]/10 text-[#D12053]'
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  {isBn ? 'পেমেন্ট নির্দেশনাবলী (ইংরেজি)' : 'Payment Instructions (English)'}
                </label>
                <textarea
                  rows={2}
                  value={cfgInstructions}
                  onChange={(e) => setCfgInstructions(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[#D12053] resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  {isBn ? 'পেমেন্ট নির্দেশনাবলী (বাংলা)' : 'Payment Instructions (Bengali)'}
                </label>
                <textarea
                  rows={2}
                  value={cfgInstructionsBn}
                  onChange={(e) => setCfgInstructionsBn(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[#D12053] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-[0.8125rem] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors border-none bg-transparent cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D12053] text-white text-[0.8125rem] font-bold hover:bg-[#b01742] transition-colors border-none cursor-pointer shadow-sm"
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Approve Confirmation Modal */}
      {approvingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[28rem] max-w-full border border-[var(--border)] shadow-2xl p-6 text-center animate-scale-up space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/15 text-green-500 mx-auto flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h3 className="text-[1.125rem] font-bold text-[var(--text-primary)] m-0">
                {isBn ? 'পেমেন্ট অনুমোদন নিশ্চিতকরণ' : 'Approve Payment Verification'}
              </h3>
              <p className="text-[0.8125rem] text-[var(--text-muted)] mt-1.5 mb-0">
                {isBn
                  ? `আপনি কি নিশ্চিত যে ${approvingPayment.schoolName} এর ৳${approvingPayment.amount.toLocaleString()} (TrxID: ${approvingPayment.trxId}) পেমেন্ট অনুমোদন করতে চান?`
                  : `Are you sure you want to approve payment of ৳${approvingPayment.amount.toLocaleString()} (TrxID: ${approvingPayment.trxId}) for ${approvingPayment.schoolName}?`}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.75rem] text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{isBn ? 'প্যাকেজ:' : 'Package:'}</span>
                <span className="font-bold text-[var(--text-primary)]">{approvingPayment.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{isBn ? 'মেয়াদ বৃদ্ধি:' : 'Extension:'}</span>
                <span className="font-bold text-green-500">+{approvingPayment.months} {isBn ? 'মাস' : 'Month(s)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{isBn ? 'প্রেরক বিকাশ:' : 'Sender:'}</span>
                <span className="font-mono">{approvingPayment.senderBkashNumber}</span>
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
                className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-[0.8125rem] font-bold transition-colors border-none cursor-pointer shadow-sm"
              >
                {isBn ? 'অনুমোদন সম্পন্ন করুন' : 'Confirm & Approve'}
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
                { id: 'Payment sent to incorrect account number', label: isBn ? 'ভুল বিকাশ নম্বরে টাকা পাঠানো হয়েছে' : 'Payment sent to incorrect account number' },
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
                  <div className="text-[1.375rem] font-extrabold text-[#D12053]">
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
                  <span className="text-[var(--text-muted)]">{isBn ? 'বিকাশ TrxID:' : 'bKash TrxID:'}</span>
                  <div className="font-mono font-bold text-[var(--brand)]">{viewPayment.trxId}</div>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{isBn ? 'প্রেরক নম্বর:' : 'Sender Mobile:'}</span>
                  <div className="font-mono font-bold text-[var(--text-primary)]">{viewPayment.senderBkashNumber}</div>
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
    </div>
  )
}
