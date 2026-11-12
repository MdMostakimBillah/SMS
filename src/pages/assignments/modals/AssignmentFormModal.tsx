import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { Assignment, AssignmentStatus } from '@/store/assignmentStore'
import type { ClassInfo as ClassItem } from '@/store/classStore'
import type { Teacher, Subject } from '@/pages/teachers/types'

const inputCls =
  'w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'
const selectCls = inputCls + ' cursor-pointer'
const btnPri =
  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all'
const btnSec =
  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:shadow-sm transition-all'

export interface AssignmentFormData {
  title: string
  titleBn: string
  description: string
  subjectId: string
  classId: string
  sectionId: string
  teacherId: string
  dueDate: string
  maxMarks: string
  status: AssignmentStatus
}

export interface AssignmentFormModalProps {
  isOpen: boolean
  isBn: boolean
  isMobile: boolean
  classes: ClassItem[]
  teachers: Teacher[]
  subjects: Subject[]
  editItem: Assignment | null
  initialDate: string
  onClose: () => void
  onSave: (data: {
    type: 'assignment'
    title: string
    titleBn: string
    description: string
    descriptionBn: string
    subjectId: string
    classId: string
    sectionId: string
    teacherId: string
    dueDate: string
    maxMarks: number
    status: AssignmentStatus
    attachments: string[]
  }) => void
}

export const AssignmentFormModal = React.memo(function AssignmentFormModal({
  isOpen,
  isBn,
  isMobile,
  classes,
  teachers,
  subjects,
  editItem,
  initialDate,
  onClose,
  onSave,
}: AssignmentFormModalProps) {
  const [form, setForm] = useState<AssignmentFormData>(() => ({
    title: editItem?.title || '',
    titleBn: editItem?.titleBn || '',
    description: editItem?.description || '',
    subjectId: editItem?.subjectId || '',
    classId: editItem?.classId || '',
    sectionId: editItem?.sectionId || '',
    teacherId: editItem?.teacherId || '',
    dueDate: editItem?.dueDate || initialDate || new Date().toISOString().split('T')[0],
    maxMarks: editItem ? String(editItem.maxMarks) : '100',
    status: editItem?.status || 'active',
  }))

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [teacherQuery, setTeacherQuery] = useState('')
  const [teacherSelected, setTeacherSelected] = useState(!!editItem?.teacherId)
  const [showTeacherSuggestions, setShowTeacherSuggestions] = useState(false)
  const [teacherHighlighted, setTeacherHighlighted] = useState(-1)

  const selectedClass = useMemo(() => classes.find((c) => c.id === form.classId), [classes, form.classId])
  const availableSections = useMemo(() => selectedClass?.sections || [], [selectedClass])
  const selectedSection = useMemo(() => availableSections.find((s: any) => s.id === form.sectionId), [availableSections, form.sectionId])
  const availableSubjects = useMemo(() => {
    const ids = selectedSection?.subjectIds?.length ? selectedSection.subjectIds : selectedClass?.subjectIds || []
    return subjects.filter((s) => ids.includes(s.id))
  }, [selectedSection, selectedClass, subjects])

  if (!isOpen) return null

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.classId) errors.classId = isBn ? 'শ্রেণি নির্বাচন করুন' : 'Select a class'
    if (!form.sectionId) errors.sectionId = isBn ? 'শাখা নির্বাচন করুন' : 'Select a section'
    if (!form.subjectId) errors.subjectId = isBn ? 'বিষয় নির্বাচন করুন' : 'Select a subject'
    if (!form.teacherId) errors.teacherId = isBn ? 'শিক্ষক নির্বাচন করুন' : 'Select a teacher'
    if (!form.title.trim() && !form.titleBn.trim())
      errors.title = isBn ? 'একটি শিরোনাম আবশ্যক' : 'At least one title is required'
    if (!form.dueDate) errors.dueDate = isBn ? 'তারিখ আবশ্যক' : 'Date is required'
    if (!form.maxMarks || +form.maxMarks <= 0) errors.maxMarks = isBn ? 'নম্বর দিন' : 'Enter marks'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({
      type: 'assignment',
      title: form.title,
      titleBn: form.titleBn,
      description: form.description,
      descriptionBn: '',
      subjectId: form.subjectId,
      classId: form.classId,
      sectionId: form.sectionId,
      teacherId: form.teacherId,
      dueDate: form.dueDate,
      maxMarks: +form.maxMarks,
      status: form.status,
      attachments: editItem?.attachments || [],
    })
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-box"
        style={{ maxWidth: isMobile ? '95vw' : '36rem', maxHeight: '85vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            {editItem ? (isBn ? 'সম্পাদনা' : 'Edit') : (isBn ? 'নতুন অ্যাসাইনমেন্ট' : 'New Assignment')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Class + Section + Subject */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'শ্রেণি' : 'Class'} *
              </label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: '', subjectId: '' })}
                className={selectCls}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderColor: formErrors.classId ? 'var(--red)' : undefined,
                }}
              >
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBn ? c.nameBn : c.name}
                  </option>
                ))}
              </select>
              {formErrors.classId && (
                <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.classId}</div>
              )}
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'শাখা' : 'Section'} *
              </label>
              <select
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value, subjectId: '' })}
                className={selectCls}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderColor: formErrors.sectionId ? 'var(--red)' : undefined,
                }}
              >
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {availableSections.map((sec: any) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
              {formErrors.sectionId && (
                <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.sectionId}</div>
              )}
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'বিষয়' : 'Subject'} *
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className={selectCls}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderColor: formErrors.subjectId ? 'var(--red)' : undefined,
                }}
              >
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isBn ? s.nameBn : s.name}
                  </option>
                ))}
              </select>
              {formErrors.subjectId && (
                <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.subjectId}</div>
              )}
            </div>
          </div>

          {/* Teacher */}
          <div className="relative">
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'শিক্ষক' : 'Teacher'} *
            </label>
            <input
              type="text"
              value={
                teacherSelected
                  ? (isBn
                      ? teachers.find((t) => t.id === form.teacherId)?.nameBn
                      : teachers.find((t) => t.id === form.teacherId)?.nameEn) || ''
                  : teacherQuery
              }
              onChange={(e) => {
                setTeacherQuery(e.target.value)
                setTeacherSelected(false)
                setShowTeacherSuggestions(true)
                setTeacherHighlighted(-1)
                if (!e.target.value) setForm({ ...form, teacherId: '' })
              }}
              onKeyDown={(e) => {
                const filtered = teachers
                  .filter((t) => {
                    const q = teacherQuery.toLowerCase()
                    return (
                      t.nameEn?.toLowerCase().includes(q) ||
                      t.nameBn?.includes(q) ||
                      t.id.toLowerCase().includes(q)
                    )
                  })
                  .slice(0, 8)
                const max = filtered.length - 1
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setTeacherHighlighted((prev) => (prev < max ? prev + 1 : 0))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setTeacherHighlighted((prev) => (prev > 0 ? prev - 1 : max))
                } else if (e.key === 'Enter' && teacherHighlighted >= 0 && teacherHighlighted <= max) {
                  e.preventDefault()
                  const t = filtered[teacherHighlighted]
                  if (t) {
                    setForm({ ...form, teacherId: t.id })
                    setTeacherQuery('')
                    setTeacherSelected(true)
                    setShowTeacherSuggestions(false)
                    setTeacherHighlighted(-1)
                  }
                } else if (e.key === 'Escape') {
                  setTeacherHighlighted(-1)
                }
              }}
              onFocus={() => {
                if (!teacherSelected) setShowTeacherSuggestions(true)
              }}
              onBlur={() =>
                setTimeout(() => {
                  setShowTeacherSuggestions(false)
                  setTeacherHighlighted(-1)
                }, 200)
              }
              className={inputCls}
              style={{
                padding: '0.625rem 0.75rem',
                borderColor: formErrors.teacherId ? 'var(--red)' : undefined,
              }}
              placeholder={isBn ? 'শিক্ষকের নাম লিখুন...' : 'Type teacher name...'}
            />
            {showTeacherSuggestions && !teacherSelected && teacherQuery && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg max-h-40 overflow-auto">
                {teachers
                  .filter((t) => {
                    const q = teacherQuery.toLowerCase()
                    return (
                      t.nameEn?.toLowerCase().includes(q) ||
                      t.nameBn?.includes(q) ||
                      t.id.toLowerCase().includes(q)
                    )
                  })
                  .slice(0, 8)
                  .map((t, idx) => (
                    <div
                      key={t.id}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        idx === teacherHighlighted ? 'bg-[var(--brand-light)]' : 'hover:bg-[var(--bg-secondary)]'
                      }`}
                      style={{ fontSize: '0.8125rem' }}
                      onMouseEnter={() => setTeacherHighlighted(idx)}
                      onMouseDown={() => {
                        setForm({ ...form, teacherId: t.id })
                        setTeacherQuery('')
                        setTeacherSelected(true)
                        setShowTeacherSuggestions(false)
                        setTeacherHighlighted(-1)
                      }}
                    >
                      <div className="font-medium text-[var(--text-primary)]">
                        {isBn ? t.nameBn : t.nameEn}
                      </div>
                      {t.nameEn && t.nameBn && isBn && (
                        <div className="text-[0.6875rem] text-[var(--text-muted)]">{t.nameEn}</div>
                      )}
                    </div>
                  ))}
                {teachers.filter((t) => {
                  const q = teacherQuery.toLowerCase()
                  return (
                    t.nameEn?.toLowerCase().includes(q) ||
                    t.nameBn?.includes(q) ||
                    t.id.toLowerCase().includes(q)
                  )
                }).length === 0 && (
                  <div className="px-3 py-2 text-[0.75rem] text-[var(--text-muted)]">
                    {isBn ? 'কোনো শিক্ষক পাওয়া যায়নি' : 'No teachers found'}
                  </div>
                )}
              </div>
            )}
            {formErrors.teacherId && (
              <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.teacherId}</div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'শিরোনাম (ইং)' : 'Title (En)'}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls}
              style={{ padding: '0.625rem 0.75rem' }}
              placeholder={isBn ? 'ইংরেজি শিরোনাম' : 'English title'}
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'শিরোনাম (বাং)' : 'Title (Bn)'}
            </label>
            <input
              type="text"
              value={form.titleBn}
              onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
              className={inputCls}
              style={{ padding: '0.625rem 0.75rem' }}
              placeholder={isBn ? 'বাংলা শিরোনাম' : 'Bengali title'}
            />
            {formErrors.title && (
              <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.title}</div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'বিবরণ' : 'Description'}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls}
              rows={2}
              style={{ resize: 'vertical', padding: '0.625rem 0.75rem' }}
              placeholder={isBn ? 'অ্যাসাইনমেন্টের বিবরণ' : 'Assignment details'}
            />
          </div>

          {/* Date + Marks */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'তারিখ' : 'Date'} *
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={inputCls}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderColor: formErrors.dueDate ? 'var(--red)' : undefined,
                }}
              />
              {formErrors.dueDate && (
                <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.dueDate}</div>
              )}
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'নম্বর' : 'Marks'} *
              </label>
              <input
                type="number"
                value={form.maxMarks}
                onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
                className={inputCls}
                style={{
                  padding: '0.625rem 0.75rem',
                  borderColor: formErrors.maxMarks ? 'var(--red)' : undefined,
                }}
                min={1}
                placeholder="100"
              />
              {formErrors.maxMarks && (
                <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.maxMarks}</div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'অবস্থা' : 'Status'}
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AssignmentStatus })}
              className={selectCls}
              style={{ padding: '0.625rem 0.75rem' }}
            >
              <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
              <option value="draft">{isBn ? 'খসড়া' : 'Draft'}</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border)]">
          <button type="button" onClick={onClose} className={btnSec}>
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button type="button" onClick={handleSave} className={btnPri}>
            {editItem ? (isBn ? 'আপডেট' : 'Update') : (isBn ? 'তৈরি করুন' : 'Create')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
