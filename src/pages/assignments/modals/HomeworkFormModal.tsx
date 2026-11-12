import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { Assignment } from '@/store/assignmentStore'
import type { ClassInfo as ClassItem } from '@/store/classStore'
import type { Teacher, Subject } from '@/pages/teachers/types'

const inputCls =
  'w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'
const selectCls = inputCls + ' cursor-pointer'

export interface HomeworkFormData {
  classId: string
  sectionId: string
  subjectId: string
  teacherId: string
  dueDate: string
  description: string
}

export interface HomeworkFormModalProps {
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
    type: 'homework'
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
    status: 'active'
    attachments: string[]
  }) => void
}

export const HomeworkFormModal = React.memo(function HomeworkFormModal({
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
}: HomeworkFormModalProps) {
  const [form, setForm] = useState<HomeworkFormData>(() => ({
    classId: editItem?.classId || '',
    sectionId: editItem?.sectionId || '',
    subjectId: editItem?.subjectId || '',
    teacherId: editItem?.teacherId || '',
    dueDate: editItem?.dueDate || initialDate || new Date().toISOString().split('T')[0],
    description: editItem ? (isBn ? editItem.descriptionBn || editItem.description : editItem.description || editItem.descriptionBn) : '',
  }))

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [teacherQuery, setTeacherQuery] = useState('')
  const [teacherSelected, setTeacherSelected] = useState(!!editItem?.teacherId)
  const [showTeacherSuggestions, setShowTeacherSuggestions] = useState(false)
  const [teacherHighlighted, setTeacherHighlighted] = useState(-1)

  const selectedClass = useMemo(() => classes.find((c) => c.id === form.classId), [classes, form.classId])
  const availableSections = useMemo(() => selectedClass?.sections || [], [selectedClass])
  const selectedSection = useMemo(() => availableSections.find((s: any) => s.id === form.sectionId), [availableSections, form.sectionId])
  const availableSubjects = useMemo(() => {
    if (selectedSection?.subjectIds?.length) {
      return subjects.filter((s) => selectedSection.subjectIds!.includes(s.id))
    }
    if (selectedClass?.subjectIds?.length) {
      return subjects.filter((s) => selectedClass.subjectIds!.includes(s.id))
    }
    return subjects
  }, [selectedSection, selectedClass, subjects])

  if (!isOpen) return null

  const handleSave = () => {
    const newErrors: Record<string, string> = {}
    if (!form.classId) newErrors.classId = isBn ? 'শ্রেণি আবশ্যক' : 'Required'
    if (!form.sectionId) newErrors.sectionId = isBn ? 'শাখা আবশ্যক' : 'Required'
    if (!form.subjectId) newErrors.subjectId = isBn ? 'বিষয় আবশ্যক' : 'Required'
    if (!form.teacherId) newErrors.teacherId = isBn ? 'শিক্ষক আবশ্যক' : 'Required'
    if (!form.description.trim()) newErrors.description = isBn ? 'বিবরণ আবশ্যক' : 'Required'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const cls = classes.find((c) => c.id === form.classId)
    const sub = subjects.find((s) => s.id === form.subjectId)
    const titleBn = `${cls?.nameBn || ''} ${sub?.nameBn || ''} - গৃহকাজ`
    const titleEn = `${cls?.name || ''} ${sub?.name || ''} - Homework`

    onSave({
      type: 'homework',
      title: titleEn,
      titleBn,
      description: form.description,
      descriptionBn: '',
      subjectId: form.subjectId,
      classId: form.classId,
      sectionId: form.sectionId,
      teacherId: form.teacherId,
      dueDate: form.dueDate,
      maxMarks: 0,
      status: 'active',
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
            {editItem ? (isBn ? 'গৃহকাজ সম্পাদনা' : 'Edit Home Work') : (isBn ? 'গৃহকাজ তৈরি করুন' : 'Create Home Work')}
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
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'শ্রেণি' : 'Class'} *
              </label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: '', subjectId: '' })}
                className={selectCls}
                style={{ padding: '0.625rem 0.75rem', borderColor: errors.classId ? 'var(--red)' : undefined }}
              >
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBn ? c.nameBn : c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'শাখা' : 'Section'} *
              </label>
              <select
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value, subjectId: '' })}
                className={selectCls}
                style={{ padding: '0.625rem 0.75rem', borderColor: errors.sectionId ? 'var(--red)' : undefined }}
              >
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {availableSections.map((sec: any) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                {isBn ? 'বিষয়' : 'Subject'} *
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className={selectCls}
                style={{ padding: '0.625rem 0.75rem', borderColor: errors.subjectId ? 'var(--red)' : undefined }}
              >
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isBn ? s.nameBn : s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher Search & Select */}
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
                borderColor: errors.teacherId ? 'var(--red)' : undefined,
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
            {errors.teacherId && (
              <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{errors.teacherId}</div>
            )}
          </div>

          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'তারিখ' : 'Date'} *
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={inputCls}
              style={{ padding: '0.625rem 0.75rem' }}
            />
          </div>

          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'গৃহকাজের বিবরণ' : 'Homework Description'} *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls}
              rows={4}
              style={{
                resize: 'vertical',
                padding: '0.625rem 0.75rem',
                borderColor: errors.description ? 'var(--red)' : undefined,
              }}
              placeholder={isBn ? 'গৃহকাজের বিস্তারিত লিখুন...' : 'Write homework details...'}
            />
            {errors.description && (
              <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{errors.description}</div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-xl text-[0.8125rem] font-medium border border-[var(--border)] bg-transparent text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2 px-3 rounded-xl text-[0.8125rem] font-medium border-none bg-[var(--brand)] text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            {editItem ? (isBn ? 'আপডেট' : 'Update') : (isBn ? 'তৈরি করুন' : 'Create')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
