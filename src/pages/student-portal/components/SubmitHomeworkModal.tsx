import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, FileText, Link as LinkIcon } from 'lucide-react'
import type { StudentProfile, StudentHomework } from '../types'
import { useAssignmentStore } from '@/store/assignmentStore'

interface SubmitHomeworkModalProps {
  isOpen: boolean
  homework: StudentHomework | null
  student: StudentProfile
  onClose: () => void
  onSuccess: () => void
  isBn: boolean
}

export const SubmitHomeworkModal = React.memo(function SubmitHomeworkModal({
  isOpen,
  homework,
  student,
  onClose,
  onSuccess,
  isBn,
}: SubmitHomeworkModalProps) {
  const [notes, setNotes] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (homework?.submission) {
      setNotes(homework.submission.notes || '')
      setFileUrl(homework.submission.fileUrl || '')
    } else {
      setNotes('')
      setFileUrl('')
    }
    setError(null)
  }, [homework])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !homework) return null
  if (typeof document === 'undefined') return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim() && !fileUrl.trim()) {
      setError(isBn ? 'অনুগ্রহ করে সমাধান নোট বা ফাইলের লিঙ্ক দিন।' : 'Please provide solution notes or a file link.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const assignmentStore = useAssignmentStore.getState()
      const existingSub = assignmentStore.submissions.find(
        (s) => s.assignmentId === homework.id && s.studentId === student.id
      )

      if (existingSub) {
        assignmentStore.updateSubmission(existingSub.id, {
          feedbackBn: notes,
          feedback: notes,
          fileUrl,
          submittedAt: new Date().toISOString(),
          status: 'submitted',
        })
      } else {
        assignmentStore.addSubmission({
          assignmentId: homework.id,
          studentId: student.id,
          studentName: student.nameEn,
          studentNameBn: student.nameBn || student.nameEn,
          submittedAt: new Date().toISOString(),
          fileUrl: fileUrl || '',
          marks: null,
          feedback: notes,
          feedbackBn: notes,
          status: 'submitted',
        })
      }

      setSubmitting(false)
      onSuccess()
      onClose()
    } catch (err: any) {
      setSubmitting(false)
      setError(err?.message || 'Failed to submit homework')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'হোমওয়ার্ক সমাধান জমা দিন' : 'Submit Homework Assignment'}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] text-xs space-y-1">
            <p className="font-bold text-[var(--text-primary)] text-sm">
              {isBn ? homework.titleBn || homework.title : homework.title}
            </p>
            <p className="text-[var(--text-secondary)]">
              {isBn ? 'বিষয়:' : 'Subject:'} <span className="font-medium text-[var(--text-primary)]">{isBn ? homework.subjectBn : homework.subject}</span> |{' '}
              {isBn ? 'জমার শেষ তারিখ:' : 'Due Date:'} <span className="font-medium text-[var(--brand)]">{homework.dueDate}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              {isBn ? 'সমাধান বা লেখার বিবরণ' : 'Solution Notes / Answers'}
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isBn ? 'আপনার হোমওয়ার্কের সমাধান বা বিবরণ এখানে লিখুন...' : 'Type your answer or explanation here...'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              {isBn ? 'সংযুক্তি / ফাইল লিঙ্ক (ঐচ্ছিক)' : 'Attachment / Document Link (Optional)'}
            </label>
            <div className="relative">
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/... or file link"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
              />
              <LinkIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800/40">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              <Send size={14} />
              <span>{submitting ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...') : (isBn ? 'জমা দিন' : 'Submit Work')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
})
