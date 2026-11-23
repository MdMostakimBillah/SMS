import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Calendar, AlertCircle } from 'lucide-react'
import type { StudentProfile, StudentLeaveRequest } from '../types'

interface LeaveRequestModalProps {
  isOpen?: boolean
  student: StudentProfile
  onClose: () => void
  onSubmit: (req: Omit<StudentLeaveRequest, 'id' | 'createdAt' | 'status'>) => void
  isBn: boolean
}

export const LeaveRequestModal = React.memo(function LeaveRequestModal({
  isOpen,
  student,
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
      studentId: student.id,
      startDate,
      endDate,
      type,
      reason: reason.trim(),
    })
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'ছুটির আবেদন ফরম' : 'Student Leave Application'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'ছুটির ধরন' : 'Leave Type'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'sick', en: 'Sick', bn: 'অসুস্থতা' },
                { id: 'casual', en: 'Casual', bn: 'নৈমিত্তিক' },
                { id: 'family', en: 'Family', bn: 'পারিবারিক' },
                { id: 'other', en: 'Other', bn: 'অন্যান্য' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                    type === t.id
                      ? 'border-[var(--brand)] bg-[var(--brandLight)] text-[var(--brand)]'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                  }`}
                >
                  {isBn ? t.bn : t.en}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'শুরুর তারিখ' : 'Start Date'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'শেষের তারিখ' : 'End Date'}
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'ছুটির কারণ' : 'Reason for Leave'}
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isBn ? 'ছুটির বিস্তারিত কারণ লিখুন...' : 'Explain the reason for leave...'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-500">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-medium hover:opacity-90"
            >
              <Send size={14} />
              <span>{isBn ? 'আবেদন জমা দিন' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
})
