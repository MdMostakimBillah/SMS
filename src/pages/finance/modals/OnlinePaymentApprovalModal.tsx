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
  bkash: { bg: 'rgba(226, 19, 110, 0.1)', color: '#e2136e', label: 'bKash', labelBn: 'বিকাশ' },
  nagad: { bg: 'rgba(247, 148, 29, 0.1)', color: '#f7941d', label: 'Nagad', labelBn: 'নগদ' },
  rocket: { bg: 'rgba(140, 52, 148, 0.1)', color: '#8c3494', label: 'Rocket', labelBn: 'রকেট' },
  bank: { bg: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', label: 'Bank', labelBn: 'ব্যাংক' },
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
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {isBn ? 'অনলাইন ফি যাচাই ও অনুমোদন' : 'Online Payment Verification & Approval'}
              </h2>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn
                  ? 'পেমেন্ট ট্রানজেকশন আইডি যাচাই করে ফি অনুমোদন দিন'
                  : 'Verify payment Transaction IDs against your gateway statement before approving'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
            <X size={16} />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-5 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-secondary)]/40 shrink-0">
          <div className="relative flex-1 min-w-[14rem]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBn ? 'শিক্ষার্থী, ক্লাস, বা ট্রানজেকশন আইডি খুঁজুন...' : 'Search student, roll, or Trx ID...'}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
              const count = tab === 'all' ? requests.length : tab === 'pending' ? pendingCount : tab === 'approved' ? approvedCount : rejectedCount
              const label = tab === 'all' ? (isBn ? 'সকল' : 'All') : tab === 'pending' ? (isBn ? 'অপেক্ষমাণ' : 'Pending') : tab === 'approved' ? (isBn ? 'অনুমোদিত' : 'Approved') : (isBn ? 'বাতিল' : 'Rejected')
              const active = statusFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`h-7 px-2.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    active ? 'bg-[var(--brand)] text-white shadow-sm' : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[0.625rem] px-1.5 py-0.2 rounded-full font-bold ${active ? 'bg-white/20 text-white' : tab === 'pending' && count > 0 ? 'bg-amber-500/20 text-amber-600' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Request List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              <Clock size={32} className="mx-auto mb-2 opacity-30" />
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
                <div key={req.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:border-[var(--brand)]/40 hover:shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: gw.bg, color: gw.color }}>
                        {req.method === 'bank' ? <Building2 size={18} /> : <Smartphone size={18} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-semibold text-[var(--text-primary)]">{req.studentName || req.studentId}</h3>
                          {req.studentClass && (
                            <span className="text-[0.6875rem] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-secondary)] font-medium">
                              Class: {req.studentClass} {req.studentRoll ? `| Roll: ${req.studentRoll}` : ''}
                            </span>
                          )}
                          <span className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: gw.bg, color: gw.color }}>
                            {isBn ? gw.labelBn : gw.label}
                          </span>
                        </div>

                        <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                          {isBn ? req.feeTitleBn || req.feeTitle : req.feeTitle} • {req.phone || 'N/A'}
                        </div>

                        {/* TrxID Badge */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.6875rem] font-mono font-medium text-[var(--text-primary)]">
                            <span className="text-[var(--text-muted)] select-none">TrxID:</span>
                            <span className="font-bold tracking-wide">{req.trxId}</span>
                            <button onClick={() => handleCopy(req.trxId)} title={isBn ? 'কপি করুন' : 'Copy Trx ID'} className="ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                              {copiedTrxId === req.trxId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <span className="text-[0.625rem] text-[var(--text-muted)]">{new Date(req.submittedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--border)]">
                      <div className="text-right">
                        <div className="text-sm font-bold text-[var(--text-primary)]">৳{req.amount.toLocaleString()}</div>
                        {isApproved && (
                          <div className="inline-flex items-center gap-1 text-[0.625rem] text-emerald-600 font-medium">
                            <CheckCircle2 size={11} /> {isBn ? 'অনুমোদিত' : 'Approved'} {req.receiptNo && `(${req.receiptNo})`}
                          </div>
                        )}
                        {isRejected && (
                          <div className="inline-flex items-center gap-1 text-[0.625rem] text-rose-500 font-medium">
                            <XCircle size={11} /> {isBn ? 'বাতিল' : 'Rejected'}
                          </div>
                        )}
                        {isPending && (
                          <div className="inline-flex items-center gap-1 text-[0.625rem] text-amber-500 font-medium">
                            <Clock size={11} /> {isBn ? 'যাচাই অপেক্ষমাণ' : 'Pending Review'}
                          </div>
                        )}
                      </div>

                      {isPending && !isRejectingThis && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => approveRequest(req.id, user?.name || 'Institution Finance')}
                            className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[0.6875rem] font-semibold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                          >
                            <CheckCheck size={13} /> {isBn ? 'অনুমোদন' : 'Approve'}
                          </button>
                          <button
                            onClick={() => { setRejectingId(req.id); setRejectReason('') }}
                            className="h-7 px-2 rounded-lg border border-rose-300 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[0.6875rem] font-medium transition-colors cursor-pointer"
                          >
                            {isBn ? 'বাতিল' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isRejectingThis && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={isBn ? 'বাতিল করার কারণ লিখুন...' : 'Enter rejection reason...'}
                        className="flex-1 h-7 px-2.5 text-xs rounded-md border border-rose-300 dark:border-rose-900/50 bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-rose-500"
                      />
                      <button onClick={() => handleConfirmReject(req)} className="h-7 px-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer">
                        {isBn ? 'নিশ্চিত' : 'Confirm'}
                      </button>
                      <button onClick={() => setRejectingId(null)} className="h-7 px-2 rounded-md border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
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
