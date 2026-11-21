import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  CreditCard,
  Building2,
  Smartphone,
  CheckCheck,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useAuth } from '@/contexts/AuthContext'
import { useFeeStore, type OnlinePaymentRequest } from '@/store/feeStore'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialStatusFilter?: 'all' | 'pending' | 'approved' | 'rejected'
}

const GATEWAY_STYLES: Record<string, { bg: string; color: string; label: string; labelBn: string }> = {
  bkash: { bg: 'rgba(226, 19, 110, 0.08)', color: '#e2136e', label: 'bKash', labelBn: 'বিকাশ' },
  nagad: { bg: 'rgba(247, 148, 29, 0.08)', color: '#f7941d', label: 'Nagad', labelBn: 'নগদ' },
  rocket: { bg: 'rgba(140, 52, 148, 0.08)', color: '#8c3494', label: 'Rocket', labelBn: 'রকেট' },
  bank: { bg: 'rgba(2, 132, 199, 0.08)', color: '#0284c7', label: 'Bank', labelBn: 'ব্যাংক' },
}

export const OnlinePaymentApprovalModal = React.memo(function OnlinePaymentApprovalModal({
  isOpen,
  onClose,
  initialStatusFilter = 'pending',
}: Props) {
  const isBn = useBn()
  const { user } = useAuth()
  const requests = useFeeStore((s) => s.onlinePaymentRequests || [])
  const approveRequest = useFeeStore((s) => s.approveOnlinePaymentRequest)
  const rejectRequest = useFeeStore((s) => s.rejectOnlinePaymentRequest)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(initialStatusFilter)
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests])
  const approvedCount = useMemo(() => requests.filter((r) => r.status === 'approved').length, [requests])
  const rejectedCount = useMemo(() => requests.filter((r) => r.status === 'rejected').length, [requests])

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.studentName?.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q) ||
        r.studentRoll?.toLowerCase().includes(q) ||
        r.studentClass?.toLowerCase().includes(q) ||
        r.trxId.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.feeTitle.toLowerCase().includes(q)
      )
    })
  }, [requests, statusFilter, search])

  const handleCopy = (trxId: string) => {
    navigator.clipboard?.writeText(trxId)
    setCopiedTrxId(trxId)
    setTimeout(() => setCopiedTrxId(null), 2000)
  }

  const handleConfirmReject = (req: OnlinePaymentRequest) => {
    const reason = rejectReason.trim() || (isBn ? 'লেনদেন আইডি যাচাই করা যায়নি' : 'Transaction ID not verified')
    rejectRequest(req.id, reason, user?.name || 'Institution Finance')
    setRejectingId(null)
    setRejectReason('')
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-[#111215] border border-slate-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header - Crisp White */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#111215]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-[0.9375rem] font-bold text-slate-900 dark:text-white">
                {isBn ? 'অনলাইন ফি যাচাই ও অনুমোদন' : 'Online Payment Verification'}
              </h2>
              <p className="text-[0.6875rem] text-slate-500 dark:text-zinc-400">
                {isBn
                  ? 'গেটওয়ে ব্যালেন্স ও ট্রানজেকশন আইডি যাচাই করে অনুমোদন দিন'
                  : 'Verify payment Transaction IDs against gateway balance before approving'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar & Filters - Clean Pure White Surface */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111215] shrink-0">
          <div className="relative flex-1 min-w-[13rem]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBn ? 'শিক্ষার্থী, ক্লাস, বা ট্রানজেকশন আইডি খুঁজুন...' : 'Search student, roll, or Trx ID...'}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none focus:border-indigo-500 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
              const count = tab === 'all' ? requests.length : tab === 'pending' ? pendingCount : tab === 'approved' ? approvedCount : rejectedCount
              const label = tab === 'all' ? (isBn ? 'সকল' : 'All') : tab === 'pending' ? (isBn ? 'অপেক্ষমাণ' : 'Pending') : tab === 'approved' ? (isBn ? 'অনুমোদিত' : 'Approved') : (isBn ? 'বাতিল' : 'Rejected')
              const active = statusFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`h-7 px-2.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer text-[0.6875rem] ${
                    active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 border border-slate-200/60 dark:border-zinc-700/60'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[0.5625rem] px-1.5 py-0.2 rounded-full font-bold ${
                    active ? 'bg-white/20 dark:bg-slate-900/20 text-inherit' : tab === 'pending' && count > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-slate-200/70 dark:bg-zinc-700 text-slate-500'
                  }`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Request List - Clean White Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50 dark:bg-[#0c0d0e]">
          {filteredRequests.length === 0 ? (
            <div className="py-14 text-center rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs text-slate-400">
              <Clock size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
              {isBn ? 'কোনো পেমেন্ট রিকোয়েস্ট পাওয়া যায়নি' : 'No online payment requests found'}
            </div>
          ) : (
            filteredRequests.map((req) => {
              const gw = GATEWAY_STYLES[req.method] || GATEWAY_STYLES.bkash
              const isPending = req.status === 'pending'
              const isApproved = req.status === 'approved'
              const isRejected = req.status === 'rejected'
              const isRejectingThis = rejectingId === req.id

              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#141518] p-4 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border border-slate-100 dark:border-zinc-800"
                        style={{ backgroundColor: gw.bg, color: gw.color }}
                      >
                        {req.method === 'bank' ? <Building2 size={18} /> : <Smartphone size={18} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white">{req.studentName || req.studentId}</h3>
                          {req.studentClass && (
                            <span className="text-[0.625rem] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-medium">
                              Class: {req.studentClass} {req.studentRoll ? `| Roll: ${req.studentRoll}` : ''}
                            </span>
                          )}
                          <span
                            className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded uppercase"
                            style={{ backgroundColor: gw.bg, color: gw.color }}
                          >
                            {isBn ? gw.labelBn : gw.label}
                          </span>
                        </div>

                        <div className="text-[0.6875rem] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                          {isBn ? req.feeTitleBn || req.feeTitle : req.feeTitle} • {req.phone || 'N/A'}
                        </div>

                        {/* TrxID Badge - Clean Monospace with Copy Button */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 text-[0.6875rem] font-mono font-semibold text-slate-800 dark:text-zinc-200">
                            <span className="text-slate-400 select-none font-normal">TrxID:</span>
                            <span className="font-bold tracking-wide">{req.trxId}</span>
                            <button
                              onClick={() => handleCopy(req.trxId)}
                              title={isBn ? 'কপি করুন' : 'Copy Trx ID'}
                              className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
                            >
                              {copiedTrxId === req.trxId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <span className="text-[0.625rem] text-slate-400">{new Date(req.submittedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-zinc-800">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">৳{req.amount.toLocaleString()}</div>
                        {isApproved && (
                          <div className="inline-flex items-center gap-1 text-[0.625rem] text-emerald-600 font-semibold mt-0.5">
                            <CheckCircle2 size={11} /> {isBn ? 'অনুমোদিত' : 'Approved'} {req.receiptNo && `(${req.receiptNo})`}
                          </div>
                        )}
                        {isRejected && (
                          <div className="inline-flex items-center gap-1 text-[0.625rem] text-rose-500 font-semibold mt-0.5">
                            <XCircle size={11} /> {isBn ? 'বাতিল' : 'Rejected'}
                          </div>
                        )}
                        {isPending && (
                          <div className="inline-flex items-center gap-1 text-[0.625rem] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            <Clock size={11} /> {isBn ? 'যাচাই অপেক্ষমাণ' : 'Pending Review'}
                          </div>
                        )}
                      </div>

                      {isPending && !isRejectingThis && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => approveRequest(req.id, user?.name || 'Institution Finance')}
                            className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[0.6875rem] font-semibold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <CheckCheck size={13} /> {isBn ? 'অনুমোদন' : 'Approve'}
                          </button>
                          <button
                            onClick={() => { setRejectingId(req.id); setRejectReason('') }}
                            className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-600 dark:text-zinc-300 hover:text-rose-600 hover:border-rose-200 text-[0.6875rem] font-medium transition-all cursor-pointer"
                          >
                            {isBn ? 'বাতিল' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isRejectingThis && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={isBn ? 'বাতিল করার কারণ লিখুন...' : 'Enter rejection reason...'}
                        className="flex-1 h-7.5 px-3 text-xs rounded-lg border border-rose-300 dark:border-rose-900/50 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none focus:border-rose-500 shadow-2xs"
                      />
                      <button onClick={() => handleConfirmReject(req)} className="h-7.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer">
                        {isBn ? 'নিশ্চিত' : 'Confirm'}
                      </button>
                      <button onClick={() => setRejectingId(null)} className="h-7.5 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
                        {isBn ? 'না' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
})
