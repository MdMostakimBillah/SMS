import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Users, CheckCircle, Clock, Plus } from 'lucide-react'
import type { Assignment, AssignmentSubmission } from '@/store/assignmentStore'
import { toBnNum } from '@/lib/i18n'

const btnPri =
  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all'
const btnSec =
  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:shadow-sm transition-all'
const inputCls =
  'w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'

export interface AssignmentDetailModalProps {
  isOpen: boolean
  isBn: boolean
  isMobile: boolean
  assignment: Assignment | null
  submissions: AssignmentSubmission[]
  getClassName: (id: string) => string
  getSectionName: (classId: string, sectionId: string) => string
  getSubjectName: (id: string) => string
  getTeacherName: (id: string) => string
  canEdit: boolean
  onClose: () => void
  onEdit: (item: Assignment) => void
  onAddSubmission: (s: Omit<AssignmentSubmission, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdateSubmission: (id: string, s: Partial<AssignmentSubmission>) => void
}

export const AssignmentDetailModal = React.memo(function AssignmentDetailModal({
  isOpen,
  isBn,
  isMobile,
  assignment,
  submissions,
  getClassName,
  getSectionName,
  getSubjectName,
  getTeacherName,
  canEdit,
  onClose,
  onEdit,
  onAddSubmission,
}: AssignmentDetailModalProps) {
  const [showAddSub, setShowAddSub] = useState(false)
  const [subStudentName, setSubStudentName] = useState('')
  const [subMarks, setSubMarks] = useState('')
  const [subFeedback, setSubFeedback] = useState('')

  if (!isOpen || !assignment) return null

  const assignmentSubs = submissions.filter((s) => s.assignmentId === assignment.id)

  const handleCreateSubmission = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subStudentName.trim()) return
    const now = new Date().toISOString()
    onAddSubmission({
      assignmentId: assignment.id,
      studentId: `STU-${Date.now()}`,
      studentName: subStudentName.trim(),
      studentNameBn: subStudentName.trim(),
      submittedAt: now,
      fileUrl: '',
      marks: subMarks !== '' ? Number(subMarks) : null,
      feedback: subFeedback.trim(),
      feedbackBn: subFeedback.trim(),
      status: subMarks !== '' ? 'reviewed' : 'submitted',
    })
    setSubStudentName('')
    setSubMarks('')
    setSubFeedback('')
    setShowAddSub(false)
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-box"
        style={{ maxWidth: isMobile ? '95vw' : '40rem', maxHeight: '88vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with type badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
              {isBn ? assignment.titleBn || assignment.title : assignment.title || assignment.titleBn}
            </h3>
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5"
              style={{
                fontSize: '0.625rem',
                fontWeight: 500,
                background: assignment.type === 'homework' ? 'rgba(245,158,11,0.1)' : 'rgba(124,58,237,0.1)',
                color: assignment.type === 'homework' ? 'var(--amber)' : 'var(--purple)',
              }}
            >
              {isBn
                ? assignment.type === 'homework'
                  ? 'গৃহকাজ'
                  : 'অ্যাসাইনমেন্ট'
                : assignment.type === 'homework'
                ? 'Homework'
                : 'Assignment'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Description - main focus */}
        {(assignment.description || assignment.descriptionBn) && (
          <div
            className="mb-4"
            style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              background: assignment.type === 'homework' ? 'rgba(245,158,11,0.08)' : 'rgba(124,58,237,0.08)',
              borderLeft: `3px solid ${assignment.type === 'homework' ? 'var(--amber)' : 'var(--brand)'}`,
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: assignment.type === 'homework' ? 'var(--amber)' : 'var(--brand)',
                marginBottom: '6px',
              }}
            >
              {isBn ? 'বিবরণ' : 'Description'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {isBn
                ? assignment.descriptionBn || assignment.description
                : assignment.description || assignment.descriptionBn}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div
          className="flex items-center gap-3 flex-wrap mt-3 mb-4 p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
          style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
        >
          <span className="font-medium text-[var(--text-primary)]">
            {getSubjectName(assignment.subjectId)}
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>
            {getClassName(assignment.classId)}-{getSectionName(assignment.classId, assignment.sectionId)}
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{getTeacherName(assignment.teacherId)}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{assignment.dueDate}</span>
          {assignment.type === 'assignment' && assignment.maxMarks > 0 && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span className="text-[var(--brand)] font-semibold">
                {isBn ? `${toBnNum(assignment.maxMarks)} নম্বর` : `${assignment.maxMarks} marks`}
              </span>
            </>
          )}
        </div>

        {/* Submissions Section */}
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[var(--brand)]" />
              <h4 className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {isBn ? 'জমা দেওয়া অ্যাসাইনমেন্ট' : 'Submissions'}
              </h4>
              <span className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)] font-medium">
                {isBn ? `${toBnNum(assignmentSubs.length)} টি` : assignmentSubs.length}
              </span>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowAddSub(!showAddSub)}
                className="flex items-center gap-1 text-[0.6875rem] font-medium text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-none"
              >
                <Plus size={13} />
                {isBn ? 'জমা যোগ করুন' : 'Add Submission'}
              </button>
            )}
          </div>

          {showAddSub && (
            <form onSubmit={handleCreateSubmission} className="mb-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[0.6875rem] text-[var(--text-secondary)] mb-1">
                    {isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={subStudentName}
                    onChange={(e) => setSubStudentName(e.target.value)}
                    className={inputCls}
                    placeholder={isBn ? 'নাম লিখুন...' : 'Enter name...'}
                  />
                </div>
                <div>
                  <label className="block text-[0.6875rem] text-[var(--text-secondary)] mb-1">
                    {isBn ? 'প্রাপ্ত নম্বর' : 'Marks'}
                  </label>
                  <input
                    type="number"
                    value={subMarks}
                    onChange={(e) => setSubMarks(e.target.value)}
                    className={inputCls}
                    placeholder={assignment.maxMarks ? `/${assignment.maxMarks}` : 'Score'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[0.6875rem] text-[var(--text-secondary)] mb-1">
                  {isBn ? 'মন্তব্য' : 'Feedback'}
                </label>
                <input
                  type="text"
                  value={subFeedback}
                  onChange={(e) => setSubFeedback(e.target.value)}
                  className={inputCls}
                  placeholder={isBn ? 'শিক্ষার্থীর কাজের মন্তব্য...' : 'Feedback for student...'}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddSub(false)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)]"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs rounded-lg bg-[var(--brand)] text-white font-medium border-none"
                >
                  {isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {assignmentSubs.length === 0 ? (
            <div className="py-4 text-center text-[0.75rem] text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 rounded-xl">
              {isBn ? 'এখনও কোনো শিক্ষার্থী জমা দেয়নি' : 'No submissions received yet'}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {assignmentSubs.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[0.75rem]"
                >
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">
                      {isBn ? sub.studentNameBn || sub.studentName : sub.studentName}
                    </div>
                    {sub.feedback && (
                      <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                        {isBn ? sub.feedbackBn || sub.feedback : sub.feedback}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.marks !== null ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {isBn ? `${toBnNum(sub.marks)} / ${toBnNum(assignment.maxMarks)}` : `${sub.marks} / ${assignment.maxMarks}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[var(--amber)] text-[0.6875rem]">
                        <Clock size={11} />
                        {isBn ? 'মূল্যায়ন বাকি' : 'Pending'}
                      </span>
                    )}
                    {sub.status === 'reviewed' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.625rem] bg-emerald-500/10 text-emerald-600">
                        <CheckCircle size={10} />
                        {isBn ? 'যাচাইকৃত' : 'Reviewed'}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border)]">
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(assignment)
              }}
              className={btnSec}
            >
              <Edit2 size={12} />
              {isBn ? 'সম্পাদনা' : 'Edit'}
            </button>
          )}
          <button type="button" onClick={onClose} className={btnPri}>
            {isBn ? 'বন্ধ' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
