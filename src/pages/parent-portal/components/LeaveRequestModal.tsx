import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Calendar, AlertCircle } from 'lucide-react'
import type { PortalChild, LeaveRequest } from '../types'

interface LeaveRequestModalProps {
  isOpen?: boolean
  child: PortalChild
  onClose: () => void
  onSubmit: (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void
  isBn: boolean
}

export const LeaveRequestModal = React.memo(function LeaveRequestModal({
  isOpen,
  child,
  onClose,
  onSubmit,
  isBn,
}: LeaveRequestModalProps) {
  const [type, setType] = useState<'sick' | 'casual' | 'family' | 'other'>('sick')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError(isBn ? 'ছুটির সঠিক কারণ উল্লেখ করুন' : 'Please provide a valid reason for leave')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError(isBn ? 'শুরুর তারিখ শেষের তারিখের চেয়ে আগের হতে হবে' : 'Start date must be before or equal to end date')
      return
    }

    onSubmit({
      childId: child.id,
      startDate,
      endDate,
      type,
      reason: reason.trim(),
    })
    onClose()
  }

  return createPortal(
    <div
      className="modal-overlay fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[var(--brand)]" />
            <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'ছুটির আবেদন ফরম' : 'Apply for Leave of Absence'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 text-red-500 text-[0.75rem]">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              {isBn ? 'শিক্ষার্থী' : 'Student'}
            </label>
            <div className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[0.8125rem] font-semibold text-[var(--text-primary)]">
              {isBn ? child.nameBn || child.nameEn : child.nameEn} · {child.class} ({isBn ? 'রোল:' : 'Roll:'} {child.roll})
            </div>
          </div>

          <div>
            <label className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              {isBn ? 'ছুটির ধরন' : 'Leave Type'}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer"
            >
              <option value="sick">{isBn ? 'অসুস্থতাজনিত ছুটি (Medical/Sick)' : 'Sick / Medical Leave'}</option>
              <option value="casual">{isBn ? 'নৈমিত্তিক ছুটি (Casual)' : 'Casual Leave'}</option>
              <option value="family">{isBn ? 'পারিবারিক কারণ (Family Occasion)' : 'Family Event / Urgency'}</option>
              <option value="other">{isBn ? 'অন্যান্য (Other)' : 'Other Reason'}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                {isBn ? 'শুরুর তারিখ' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                {isBn ? 'শেষের তারিখ' : 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              {isBn ? 'ছুটির বিস্তারিত কারণ' : 'Detailed Reason'}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
              placeholder={isBn ? 'ছুটির বিস্তারিত কারণ লিখুন...' : 'State the reason for leave clearly...'}
              className="w-full p-3 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors resize-none"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-95 cursor-pointer border-none"
            >
              <Send size={14} />
              {isBn ? 'আবেদন জমা দিন' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
})
