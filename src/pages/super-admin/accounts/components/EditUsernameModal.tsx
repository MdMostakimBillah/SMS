import { useState, useEffect } from 'react'
import { X, User, AlertCircle } from 'lucide-react'
import type { EditUsernameModalProps } from '../types'

export function EditUsernameModal({
  isBn,
  account,
  existingUsernames,
  onClose,
  onSave,
}: EditUsernameModalProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (account) {
      setUsername(account.username)
      setError('')
    }
  }, [account])

  if (!account) return null

  const handlePreset = (val: string) => {
    if (!val) return
    setUsername(val.trim())
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = username.trim()
    if (!clean) {
      setError(isBn ? 'ইউজারনেম খালি হতে পারে না' : 'Username cannot be empty')
      return
    }
    if (clean !== account.username && existingUsernames.has(clean.toLowerCase())) {
      setError(isBn ? 'এই ইউজারনেম ইতিমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে' : 'This username is already taken by another account')
      return
    }
    onSave(account.id, clean)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'ইউজারনেম পরিবর্তন' : 'Edit Username'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {account.role === 'student' ? (isBn ? 'ছাত্র:' : 'Student:') : (isBn ? 'অভিভাবক:' : 'Parent:')}{' '}
                {account.studentNameEn}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.75rem] font-semibold text-[var(--text-primary)] mb-1.5">
              {isBn ? 'নতুন ইউজারনেম' : 'New Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              placeholder="e.g. STU-2025-001 or 01700000000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] transition-colors"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 text-red-500 text-[0.6875rem] mt-1.5 font-medium">
                <AlertCircle size={12} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] mb-1.5">
              {isBn ? 'দ্রুত পরামর্শ (Presets):' : 'Quick Presets:'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {account.studentId && (
                <button
                  type="button"
                  onClick={() => handlePreset(account.studentId)}
                  className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-mono bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
                >
                  ID: {account.studentId}
                </button>
              )}
              {account.roll && (
                <button
                  type="button"
                  onClick={() => handlePreset(`roll_${account.roll}`)}
                  className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-mono bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
                >
                  Roll: {account.roll}
                </button>
              )}
              {account.phone && (
                <button
                  type="button"
                  onClick={() => handlePreset(account.phone)}
                  className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-mono bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
                >
                  Phone: {account.phone}
                </button>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
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
              {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
