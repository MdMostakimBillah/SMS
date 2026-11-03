import React from 'react'
import { createPortal } from 'react-dom'
import { Cloud, Lock, ShieldAlert, X, Check, Copy } from 'lucide-react'

interface CloudPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  isBn: boolean
  schoolName?: string
}

export const CloudPermissionModal: React.FC<CloudPermissionModalProps> = ({
  isOpen,
  onClose,
  isBn,
  schoolName,
}) => {
  const [copied, setCopied] = React.useState(false)

  if (!isOpen) return null

  const requestTemplate = isBn
    ? `সম্মানিত সুপার অ্যাডমিন,\nআমাদের প্রতিষ্ঠান "${schoolName || 'আমাদের স্কুল'}" এর স্টোরেজ মোড 'লোকাল' থেকে 'প্রোভাইডার ক্লাউড' (Managed Database + R2 Storage)-এ পরিবর্তনের জন্য আপনার অনুমোদন ও অ্যাক্টিভেশন প্রার্থনা করছি। অনুগ্রহ করে আমাদের ক্লাউড মাইগ্রেশন অনুমোদন করুন।\nধন্যবাদ।`
    : `Dear Super Admin,\nWe request your approval and activation to switch the storage architecture for "${schoolName || 'our institution'}" from local storage to Provider Cloud (Managed PostgreSQL + Cloudflare R2). Please approve this migration.\nThank you.`

  const handleCopy = () => {
    navigator.clipboard?.writeText(requestTemplate).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
        style={{ background: 'var(--surface)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {isBn ? 'সুপার অ্যাডমিনের অনুমতি প্রয়োজন' : 'Super Admin Permission Required'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                {isBn
                  ? 'প্রোভাইডার ক্লাউড স্টোরেজ সক্রিয়করণ নীতি'
                  : 'Provider Cloud Storage Activation Policy'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] border-none bg-transparent cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-[var(--text-secondary)]">
          <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[0.75rem] flex items-start gap-2.5">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-blue-300">
                {isBn
                  ? 'কেন অনুমতির প্রয়োজন?'
                  : 'Why is Super Admin permission required?'}
              </div>
              <p className="m-0 leading-relaxed text-blue-200/90 text-[0.6875rem]">
                {isBn
                  ? 'প্রোভাইডার ক্লাউড স্টোরেজ ব্যবহার করলে সেন্ট্রাল ক্লাউড ডাটাবেজ (PostgreSQL) এবং ক্লাউডফ্লেয়ার R2 মিডিয়া ক্লাউড সক্রিয় হয়, যা সার্ভার রিসোর্স ও ব্যপক স্টোরেজ ব্যবহার করে। তাই অপ্রয়োজনীয় বিলিং বা অনুমোদনহীন মাইগ্রেশন রোধে সুপার অ্যাডমিনের পূর্বানুমতি বাধ্যতামূলক।'
                  : 'Switching to Provider Cloud connects to centralized managed PostgreSQL databases and Cloudflare R2 media storage, utilizing platform server resources. To protect infrastructure quotas and license tiers, activation must be authorized by a Super Admin.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
            <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Cloud size={14} className="text-[var(--brand)]" />
              {isBn ? 'অনুমোদন পাওয়ার উপায়' : 'How to get authorized'}
            </div>
            <p className="m-0 text-[0.75rem] text-[var(--text-muted)] leading-relaxed">
              {isBn
                ? 'আপনার প্রতিষ্ঠানের প্ল্যাটফর্ম সুপার অ্যাডমিনের সাথে যোগাযোগ করুন। সুপার অ্যাডমিন তার "Schools" ড্যাশবোর্ড থেকে আপনার প্রতিষ্ঠানের স্টোরেজ মোড সরাসরি "EduTech Cloud"-এ আপগ্রেড করে দিতে পারবেন।'
                : 'Contact your platform Super Admin. The Super Admin can directly approve and toggle your institution to "Provider Cloud" from the Super Admin Schools control panel.'}
            </p>
          </div>

          {/* Copyable request template */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[0.6875rem] font-medium text-[var(--text-muted)]">
              <span>{isBn ? 'অনুরোধ বার্তা টেমপ্লেট:' : 'Request message template:'}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--brand)] hover:underline border-none bg-transparent cursor-pointer p-0"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-[var(--green)]" />
                    <span className="text-[var(--green)]">{isBn ? 'কপি হয়েছে' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>{isBn ? 'কপি করুন' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              value={requestTemplate}
              className="w-full h-24 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.6875rem] text-[var(--text-secondary)] resize-none focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--brand)] hover:opacity-90 transition-all border-none cursor-pointer"
          >
            {isBn ? 'বুঝেছি' : 'Got it'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
