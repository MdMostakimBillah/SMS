import { useState } from 'react'
import { X, Sparkles, CheckCircle2, Lock } from 'lucide-react'
import type { BulkPasswordModalProps } from '../types'
import type { AccountStatus } from '@/store/userAccountStore'

export function BulkPasswordModal({
  isBn,
  selectedAccounts,
  isOpen,
  onClose,
  onApply,
}: BulkPasswordModalProps) {
  const [mode, setMode] = useState<'random_pin' | 'random_pass' | 'default' | 'custom'>('random_pin')
  const [customPassword, setCustomPassword] = useState('')
  const [statusAction, setStatusAction] = useState<'none' | AccountStatus>('none')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'custom' && !customPassword.trim()) {
      setError(isBn ? 'কাস্টম পাসওয়ার্ড লিখুন' : 'Please enter a custom password')
      return
    }
    const targetStatus = statusAction !== 'none' ? statusAction : undefined
    onApply(mode, customPassword.trim(), targetStatus)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-[1.0625rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'বাল্ক অ্যাকাউন্ট ও পাসওয়ার্ড ব্যবস্থাপনা' : 'Bulk Credential Management'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn
                  ? `${selectedAccounts.length} টি অ্যাকাউন্ট নির্বাচন করা হয়েছে`
                  : `${selectedAccounts.length} account(s) selected for update`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleApply} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[0.75rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'পাসওয়ার্ড রিসেট পদ্ধতি নির্বাচন করুন:' : 'Select Password Reset Mode:'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === 'random_pin'
                    ? 'border-[var(--brand)] bg-[var(--brand)]/5 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-2)]'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_mode"
                  checked={mode === 'random_pin'}
                  onChange={() => {
                    setMode('random_pin')
                    setError('')
                  }}
                  className="mt-0.5 text-[var(--brand)] cursor-pointer"
                />
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? 'স্বতন্ত্র ৬-ডিজিট পিন' : 'Unique 6-Digit PIN'}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {isBn ? 'প্রতিটি অ্যাকাউন্টে ভিন্ন ভিন্ন পিন' : 'Unique secure numeric PIN per account'}
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === 'random_pass'
                    ? 'border-[var(--brand)] bg-[var(--brand)]/5 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-2)]'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_mode"
                  checked={mode === 'random_pass'}
                  onChange={() => {
                    setMode('random_pass')
                    setError('')
                  }}
                  className="mt-0.5 text-[var(--brand)] cursor-pointer"
                />
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? 'সুরক্ষিত পাসওয়ার্ড' : 'Strong Password'}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {isBn ? 'অ্যালফানিউমেরিক পাসওয়ার্ড (Edu#xxxx)' : 'Alphanumeric secure string'}
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === 'default'
                    ? 'border-[var(--brand)] bg-[var(--brand)]/5 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-2)]'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_mode"
                  checked={mode === 'default'}
                  onChange={() => {
                    setMode('default')
                    setError('')
                  }}
                  className="mt-0.5 text-[var(--brand)] cursor-pointer"
                />
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? 'ডিফল্ট পাসওয়ার্ড (123456)' : 'Default (123456)'}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {isBn ? 'সবার পাসওয়ার্ড 123456 হবে' : 'Standard temporary password'}
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === 'custom'
                    ? 'border-[var(--brand)] bg-[var(--brand)]/5 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-2)]'
                }`}
              >
                <input
                  type="radio"
                  name="bulk_mode"
                  checked={mode === 'custom'}
                  onChange={() => {
                    setMode('custom')
                    setError('')
                  }}
                  className="mt-0.5 text-[var(--brand)] cursor-pointer"
                />
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? 'কাস্টম পাসওয়ার্ড' : 'Custom Password'}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {isBn ? 'একটি নির্দিষ্ট পাসওয়ার্ড নির্ধারণ' : 'Set a specific common password'}
                  </div>
                </div>
              </label>
            </div>

            {mode === 'custom' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => {
                    setCustomPassword(e.target.value)
                    setError('')
                  }}
                  placeholder={isBn ? 'সকলের জন্য পাসওয়ার্ড লিখুন...' : 'Enter password for all accounts...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] transition-colors font-mono"
                />
              </div>
            )}
            {error && <p className="text-red-500 text-[0.6875rem] font-medium">{error}</p>}
          </div>

          {/* Status Update Option */}
          <div className="pt-3 border-t border-[var(--border)]">
            <label className="block text-[0.75rem] font-semibold text-[var(--text-primary)] mb-1.5">
              {isBn ? 'অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন (ঐচ্ছিক):' : 'Update Account Status (Optional):'}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusAction(statusAction === 'active' ? 'none' : 'active')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border transition-colors cursor-pointer ${
                  statusAction === 'active'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-semibold'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <CheckCircle2 size={13} />
                <span>{isBn ? 'সবগুলো সক্রিয় করুন' : 'Mark All Active'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusAction(statusAction === 'locked' ? 'none' : 'locked')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border transition-colors cursor-pointer ${
                  statusAction === 'locked'
                    ? 'border-red-500 bg-red-500/10 text-red-500 font-semibold'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Lock size={13} />
                <span>{isBn ? 'সবগুলো লক করুন' : 'Lock All'}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent border-none"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:brightness-110 shadow-sm transition-all cursor-pointer border-none"
            >
              {isBn ? 'বাল্ক আপডেট প্রয়োগ করুন' : 'Apply Bulk Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
