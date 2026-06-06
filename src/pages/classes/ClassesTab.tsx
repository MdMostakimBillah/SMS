import { useState, useCallback } from 'react'
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Check,
  Phone,
  CalendarDays,
  Download,
  BookOpen,
  Copy,
  ListChecks,
  ChevronDown,
  ChevronUp,
  X,
  Signature,
} from 'lucide-react'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { ClassSection, ClassInfo, InstitutionSettings } from '@/store/classStore'
import type { Teacher, Subject } from '@/pages/teachers/types'
import type { StudentAdmission } from '@/pages/students/admission/types'

interface ClassesTabProps {
  institution: InstitutionSettings
  classes: ClassInfo[]
  teachers: Teacher[]
  subjects: Subject[]
  students: StudentAdmission[]
  addClass: (data: ClassInfo) => void
  updateClass: (id: string, data: Partial<ClassInfo>) => void
  deleteClass: (id: string) => void
  addSection: (classId: string, data: ClassSection) => void
  updateSection: (classId: string, sectionId: string, data: Partial<ClassSection>) => void
  deleteSection: (classId: string, sectionId: string) => void
  switchSession: (session: string) => void
  importFromSession: (session: string) => void
  isBn: boolean
  isMobile: boolean
}

export default function ClassesTab({
  institution,
  classes,
  teachers,
  subjects,
  students,
  addClass,
  updateClass,
  deleteClass,
  addSection,
  updateSection,
  deleteSection,
  switchSession,
  importFromSession,
  isBn,
  isMobile,
}: ClassesTabProps) {
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [showAddClass, setShowAddClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassNameBn, setNewClassNameBn] = useState('')
  const [copyFromClassId, setCopyFromClassId] = useState('')
  const [editingClassTime, setEditingClassTime] = useState<string | null>(null)
  const [classTimeForm, setClassTimeForm] = useState({ startTime: '', endTime: '' })
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [secForm, setSecForm] = useState({ name: '', seatQuantity: 40, classTeacherId: '' })
  const [showSubjectModal, setShowSubjectModal] = useState<{ classId: string; sectionId: string } | null>(null)
  const [tempSelectedSubjects, setTempSelectedSubjects] = useState<string[]>([])

  const [bulkMode, setBulkMode] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [showBulkTime, setShowBulkTime] = useState(false)
  const [showBulkSubject, setShowBulkSubject] = useState(false)
  const [showBulkSection, setShowBulkSection] = useState(false)
  const [bulkTimeForm, setBulkTimeForm] = useState({ startTime: '07:30', endTime: '14:30' })
  const [bulkSubjectIds, setBulkSubjectIds] = useState<string[]>([])
  const [bulkSectionCount, setBulkSectionCount] = useState(2)
  const [bulkSeatQuantity, setBulkSeatQuantity] = useState(40)

  useScrollLock(showSubjectModal !== null || showBulkTime || showBulkSubject || showBulkSection)

  const getTeacher = useCallback((id: string) => teachers.find((t) => t.id === id), [teachers])

  const getStudentCount = useCallback(
    (classNum: string, sectionName: string) => {
      return students.filter(
        (s) => s.status === 'approved' && s.class === classNum && s.section === sectionName && s.academicYear === institution.currentSession
      ).length
    },
    [students, institution.currentSession]
  )

  const handleAddClass = () => {
    if (!newClassName.trim()) return
    const id = `CLS-${String(classes.length + 1).padStart(2, '0')}`
    const now = new Date().toISOString().split('T')[0]

    let sections: ClassSection[] = []
    let subjectIds: string[] = []

    if (copyFromClassId) {
      const sourceClass = classes.find((c) => c.id === copyFromClassId)
      if (sourceClass) {
        sections = sourceClass.sections.map((sec: ClassSection) => ({
          ...sec,
          id: `SEC-${id}-${sec.name}`,
          classTeacherId: '',
        }))
        subjectIds = [...sourceClass.subjectIds]
      }
    }

    addClass({
      id,
      name: newClassName.trim(),
      nameBn: newClassNameBn.trim() || newClassName.trim(),
      startTime: institution.startTime,
      endTime: institution.endTime,
      sections,
      subjectIds,
      createdAt: now,
      updatedAt: now,
    })
    setNewClassName('')
    setNewClassNameBn('')
    setCopyFromClassId('')
    setShowAddClass(false)
  }

  const handleAddSection = (classId: string) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return
    const secLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nextLetter = secLetters[cls.sections.length] || 'A'
    const secId = `SEC-${classId}-${nextLetter}`
    addSection(classId, { id: secId, name: nextLetter, seatQuantity: 40, classTeacherId: '', subjectIds: [] })
  }

  const handleSaveClassTime = (classId: string) => {
    updateClass(classId, classTimeForm)
    setEditingClassTime(null)
  }

  const toggleSelectAll = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([])
    } else {
      setSelectedClasses(classes.map((c) => c.id))
    }
  }

  const toggleSelectClass = (classId: string) => {
    setSelectedClasses((prev) => (prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]))
  }

  const handleBulkTimeApply = () => {
    selectedClasses.forEach((classId) => {
      updateClass(classId, { startTime: bulkTimeForm.startTime, endTime: bulkTimeForm.endTime })
    })
    setShowBulkTime(false)
    setSelectedClasses([])
    setBulkMode(false)
  }

  const handleBulkSubjectApply = () => {
    selectedClasses.forEach((classId) => {
      const cls = classes.find((c) => c.id === classId)
      if (!cls) return
      cls.sections.forEach((sec: ClassSection) => {
        const existing = sec.subjectIds || []
        const merged = [...new Set([...existing, ...bulkSubjectIds])]
        updateSection(classId, sec.id, { subjectIds: merged })
      })
    })
    setShowBulkSubject(false)
    setSelectedClasses([])
    setBulkMode(false)
  }

  const handleBulkSectionApply = () => {
    selectedClasses.forEach((classId) => {
      const cls = classes.find((c) => c.id === classId)
      if (!cls) return
      const secLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      for (let i = 0; i < bulkSectionCount; i++) {
        const idx = cls.sections.length + i
        const letter = secLetters[idx] || String(idx + 1)
        const secId = `SEC-${classId}-${letter}`
        addSection(classId, { id: secId, name: letter, seatQuantity: bulkSeatQuantity, classTeacherId: '', subjectIds: [] })
      }
    })
    setShowBulkSection(false)
    setSelectedClasses([])
    setBulkMode(false)
  }

  const toggleTempSubject = (subId: string) => {
    setBulkSubjectIds((prev) => (prev.includes(subId) ? prev.filter((s) => s !== subId) : [...prev, subId]))
  }

  const inputClass =
    'w-full py-[0.5625rem] px-[0.6875rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none'
  const labelClass = 'text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem] block'
  const sectionClass = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 mb-[0.875rem]'

  return (
    <>
      {/* Session indicator */}
      <div className="flex items-center gap-2 mb-3 py-2 px-3 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]">
        <CalendarDays size={14} className="text-[var(--brand)]" />
        <span className="text-[0.75rem] font-semibold text-[var(--brand)]">{institution.currentSession}</span>
        <span className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'বর্তমান সেশন' : 'Current Session'}</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {institution.sessions
            .filter((s) => s !== institution.currentSession)
            .map((s) => (
              <button
                key={s}
                onClick={() => switchSession(s)}
                className="text-[0.625rem] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] cursor-pointer font-[inherit] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
              >
                {isBn ? 'পরিবর্তন' : 'Switch to'} {s}
              </button>
            ))}
        </div>
      </div>

      {/* Import from previous session prompt */}
      {classes.length === 0 && institution.sessions.filter((s) => s !== institution.currentSession).length > 0 && (
        <div className="flex items-center gap-3 mb-3 py-3 px-4 rounded-xl bg-[var(--purple-light)] border border-[var(--purple)] border-dashed">
          <div className="w-9 h-9 rounded-lg bg-[var(--purple)] flex items-center justify-center shrink-0">
            <Download size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.8125rem] font-semibold text-[var(--purple)]">
              {isBn ? 'আগের বছর থেকে আমদানি করুন' : 'Import from Previous Session'}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">
              {isBn
                ? 'এই সেশনে কোনো শ্রেণি নেই। আগের সেশন থেকে শ্রেণি ও রুটিন আমদানি করুন।'
                : 'No classes in this session. Import classes and routines from a previous session.'}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {institution.sessions
              .filter((s) => s !== institution.currentSession)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (window.confirm(isBn ? `"${s}" থেকে সব শ্রেণি ও রুটিন আমদানি করবেন?` : `Import all classes and routines from "${s}"?`)) {
                      importFromSession(s)
                    }
                  }}
                  className="flex items-center gap-[0.25rem] py-[0.375rem] px-3 rounded-lg bg-[var(--purple)] border-none text-white text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:opacity-90 transition-all"
                >
                  <Download size={11} />
                  {isBn ? `${s} থেকে আমদানি` : `Import from ${s}`}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[0.75rem] text-[var(--text-muted)]">
          {classes.length} {isBn ? 'টি শ্রেণি' : 'classes'} · {classes.reduce((s, c) => s + c.sections.length, 0)}{' '}
          {isBn ? 'টি সেকশন' : 'sections'}
          {bulkMode && selectedClasses.length > 0 && (
            <span className="ml-2 text-[var(--teal)] font-semibold">
              · {selectedClasses.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>
        <div className="flex gap-[0.375rem] flex-wrap">
          {bulkMode && selectedClasses.length > 0 && (
            <>
              <button
                onClick={() => setShowBulkTime(true)}
                className="flex items-center gap-[0.25rem] py-[0.3125rem] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all"
              >
                <Clock size={11} />
                {isBn ? 'সময়' : 'Time'}
              </button>
              <button
                onClick={() => setShowBulkSubject(true)}
                className="flex items-center gap-[0.25rem] py-[0.3125rem] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-all"
              >
                <BookOpen size={11} />
                {isBn ? 'বিষয়' : 'Subject'}
              </button>
              <button
                onClick={() => setShowBulkSection(true)}
                className="flex items-center gap-[0.25rem] py-[0.3125rem] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:border-[var(--purple)] hover:text-[var(--purple)] transition-all"
              >
                <ListChecks size={11} />
                {isBn ? 'সেকশন' : 'Section'}
              </button>
            </>
          )}
          <button
            onClick={() => {
              setBulkMode(!bulkMode)
              if (bulkMode) setSelectedClasses([])
            }}
            className={`flex items-center gap-[0.25rem] py-[0.3125rem] px-2.5 rounded-md border text-[0.6875rem] font-medium cursor-pointer font-[inherit] transition-all ${bulkMode ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}
          >
            <ListChecks size={11} />
            {bulkMode ? (isBn ? 'বন্ধ' : 'Done') : isBn ? 'বাল্ক' : 'Bulk'}
          </button>
          <button
            onClick={() => setShowAddClass(true)}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5rem] bg-[var(--brand)] border-none text-white text-[0.75rem] font-medium cursor-pointer font-[inherit]"
          >
            <Plus size={14} />
            {isBn ? 'নতুন শ্রেণি' : 'Add Class'}
          </button>
        </div>
      </div>

      {/* Add class form */}
      {showAddClass && (
        <div className={sectionClass} style={{ borderColor: 'var(--brand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand)' }}>{isBn ? 'নতুন শ্রেণি যোগ' : 'Add New Class'}</div>
            <button
              onClick={() => setShowAddClass(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
            <Copy size={12} />
            {isBn ? 'আগের শ্রেণি থেকে কপি করুন (ঐচ্ছিক)' : 'Copy from existing class (optional)'}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', marginBottom: '0.625rem' }}>
            <div style={{ flex: 1 }}>
              <select
                value={copyFromClassId}
                onChange={(e) => setCopyFromClassId(e.target.value)}
                className={inputClass}
                style={{ width: '100%' }}
              >
                <option value="">{isBn ? '-- কোনো শ্রেণি নয় --' : '-- None --'}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.nameBn}) — {c.sections.length} {isBn ? 'সেকশন' : 'sections'}, {c.subjectIds.length} {isBn ? 'বিষয়' : 'subjects'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
            <div>
              <label className={labelClass}>{isBn ? 'শ্রেণির নাম (ইং)' : 'Class Name (EN)'}</label>
              <input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className={inputClass}
                placeholder="Class 11"
              />
            </div>
            <div>
              <label className={labelClass}>{isBn ? 'শ্রেণির নাম (বাং)' : 'Class Name (BN)'}</label>
              <input
                value={newClassNameBn}
                onChange={(e) => setNewClassNameBn(e.target.value)}
                className={inputClass}
                placeholder="শ্রেণি ১১"
              />
            </div>
            <button
              onClick={handleAddClass}
              style={{
                padding: '9px 18px',
                borderRadius: '0.5rem',
                background: 'var(--brand)',
                border: 'none',
                color: '#fff',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {isBn ? 'যোগ করুন' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk mode: select all bar */}
      {bulkMode && (
        <div className="flex items-center gap-3 py-2 px-3 mb-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 cursor-pointer bg-transparent border-none font-[inherit] text-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <div
              className={`w-[1.125rem] h-[1.125rem] rounded-[0.25rem] border-[0.0938rem] flex items-center justify-center transition-all ${selectedClasses.length === classes.length ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border)]'}`}
            >
              {selectedClasses.length === classes.length && <Check size={11} className="text-white" />}
            </div>
            {isBn ? 'সব নির্বাচন' : 'Select All'}
          </button>
          {selectedClasses.length > 0 && (
            <span className="text-[0.6875rem] text-[var(--brand)] font-medium">
              {selectedClasses.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>
      )}

      {/* Class cards */}
      {classes.map((cls) => {
        const isExpanded = expandedClass === cls.id
        const totalSeats = cls.sections.reduce((s, sec) => s + sec.seatQuantity, 0)
        const isSelected = selectedClasses.includes(cls.id)
        return (
          <div
            key={cls.id}
            className={`mb-[0.625rem] rounded-[0.625rem] border bg-[var(--bg-primary)] p-[0.75rem] transition-all duration-150 ${bulkMode && isSelected ? 'border-[var(--brand)]' : 'border-[var(--border)]'}`}
          >
            {/* Class header */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}
              onClick={() => {
                if (bulkMode) {
                  toggleSelectClass(cls.id)
                } else {
                  setExpandedClass(isExpanded ? null : cls.id)
                }
              }}
            >
              {bulkMode && (
                <div
                  className={`w-[1.125rem] h-[1.125rem] rounded-[0.25rem] border-[0.0938rem] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${isSelected ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border)] hover:border-[var(--brand)]'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelectClass(cls.id)
                  }}
                >
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
              )}
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '0.5rem',
                  background: 'var(--brand-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand)' }}>{cls.id.replace('CLS-', '')}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? cls.nameBn : cls.name}</div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    gap: '0.625rem',
                    flexWrap: 'wrap',
                    marginTop: '0.125rem',
                  }}
                >
                  <span>
                    {cls.sections.length} {isBn ? 'সেকশন' : 'sections'}
                  </span>
                  <span>
                    {totalSeats} {isBn ? 'আসন' : 'seats'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.1875rem' }}>
                    <Clock size={10} />
                    {cls.startTime} - {cls.endTime}
                  </span>
                </div>
              </div>
              {!bulkMode && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingClassTime(cls.id)
                      setClassTimeForm({ startTime: cls.startTime, endTime: cls.endTime })
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '0.375rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      fontSize: '0.625rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Clock size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(isBn ? 'এই শ্রেণি মুছে ফেলতে চান?' : 'Delete this class?')) deleteClass(cls.id)
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '0.375rem',
                      background: 'var(--red-light)',
                      border: '1px solid var(--red)',
                      cursor: 'pointer',
                      fontSize: '0.625rem',
                      color: 'var(--red)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </>
              )}
              {!bulkMode && (
                <div className="text-[var(--text-muted)] ml-1">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
              )}
            </div>

            {/* Edit class time */}
            {editingClassTime === cls.id && (
              <div
                style={{
                  marginTop: '0.625rem',
                  padding: '0.875rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--brand)',
                  borderRadius: '0.625rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--brand)',
                    marginBottom: '0.625rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <Clock size={14} />
                  {isBn ? 'ক্লাস সময় পরিবর্তন' : 'Change Class Time'}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr auto',
                    gap: '0.625rem',
                    alignItems: 'end',
                  }}
                >
                  <div>
                    <label
                      style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}
                    >
                      {isBn ? 'শুরুর সময়' : 'Start Time'}
                    </label>
                    <input
                      type="time"
                      value={classTimeForm.startTime}
                      onChange={(e) => setClassTimeForm((p) => ({ ...p, startTime: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '0.4375rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}
                    >
                      {isBn ? 'শেষের সময়' : 'End Time'}
                    </label>
                    <input
                      type="time"
                      value={classTimeForm.endTime}
                      onChange={(e) => setClassTimeForm((p) => ({ ...p, endTime: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '0.4375rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      onClick={() => handleSaveClassTime(cls.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '0.4375rem',
                        background: 'var(--brand)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Save size={12} />
                      {isBn ? 'সেভ' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingClassTime(null)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '0.4375rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sections */}
            {isExpanded && !bulkMode && (
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.0313rem',
                    }}
                  >
                    {isBn ? 'সেকশন সমূহ' : 'Sections'}
                  </div>
                  <button
                    onClick={() => handleAddSection(cls.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '5px 10px',
                      borderRadius: '0.375rem',
                      background: 'var(--teal-light)',
                      border: '1px solid var(--teal)',
                      color: 'var(--teal)',
                      fontSize: '0.6875rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Plus size={12} />
                    {isBn ? 'সেকশন যোগ' : 'Add Section'}
                  </button>
                </div>

                {cls.sections.length === 0 ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {isBn ? 'কোনো সেকশন নেই' : 'No sections yet'}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '0.625rem',
                    }}
                  >
                    {cls.sections.map((sec) => {
                      const teacher = sec.classTeacherId ? getTeacher(sec.classTeacherId) : undefined
                      const isEditing = editingSection === sec.id
                      return (
                        <div
                          key={sec.id}
                          style={{
                            borderRadius: '0.625rem',
                            border: `1px solid ${isEditing ? 'var(--brand)' : 'var(--border)'}`,
                            background: isEditing ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                            overflow: 'hidden',
                            transition: 'all 0.2s',
                          }}
                        >
                          {/* Compact header — always visible */}
                          <div
                            style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}
                            onClick={() => {
                              if (isEditing) {
                                setEditingSection(null)
                                return
                              }
                              setEditingSection(sec.id)
                              setSecForm({ name: sec.name, seatQuantity: sec.seatQuantity, classTeacherId: sec.classTeacherId })
                            }}
                          >
                            <div
                              style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '0.5rem',
                                background: isEditing ? 'var(--brand)' : 'var(--brand-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s',
                              }}
                            >
                              <span style={{ color: isEditing ? '#fff' : 'var(--brand)', fontSize: '0.6875rem', fontWeight: 700 }}>
                                {cls.id.replace('CLS-', '')}
                                {sec.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {isBn ? 'সেকশন' : 'Section'} {sec.name}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.625rem',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  gap: '0.5rem',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                }}
                              >
                                {(() => {
                                  const count = getStudentCount(cls.id.replace('CLS-', '').replace(/^0/, ''), sec.name)
                                  const available = sec.seatQuantity - count
                                  const isFull = available <= 0
                                  return (
                                    <>
                                      <span style={{ color: isFull ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                                        {count}/{sec.seatQuantity}
                                      </span>
                                      <span style={{ color: isFull ? 'var(--red)' : 'var(--text-muted)' }}>
                                        {isBn
                                          ? isFull
                                            ? 'ফুল'
                                            : `${available} আসন বাকি`
                                          : isFull
                                            ? 'Full'
                                            : `${available} seats left`}
                                      </span>
                                    </>
                                  )
                                })()}
                                {teacher && <span style={{ color: 'var(--brand)' }}>{teacher.nameEn.split(' ')[0]}</span>}
                                {sec.subjectIds && sec.subjectIds.length > 0 && (
                                  <span style={{ color: 'var(--teal)', fontWeight: 500 }}>
                                    {sec.subjectIds.length} {isBn ? 'বিষয়' : 'subjects'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteSection(cls.id, sec.id)
                                }}
                                style={{
                                  padding: '0.25rem',
                                  borderRadius: '0.3125rem',
                                  background: 'var(--red-light)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--red)',
                                }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Expanded edit form */}
                          {isEditing && (
                            <div
                              style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}
                            >
                              <div style={{ paddingTop: '0.625rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                  <label
                                    style={{
                                      fontSize: '0.625rem',
                                      fontWeight: 500,
                                      color: 'var(--text-muted)',
                                      marginBottom: '0.25rem',
                                      display: 'block',
                                    }}
                                  >
                                    {isBn ? 'সেকশন নাম' : 'Section Name'}
                                  </label>
                                  <input
                                    value={secForm.name}
                                    onChange={(e) => setSecForm((p) => ({ ...p, name: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '7px 9px',
                                      borderRadius: '0.4375rem',
                                      border: '1px solid var(--border)',
                                      background: 'var(--bg-secondary)',
                                      color: 'var(--text-primary)',
                                      fontSize: '0.75rem',
                                      fontFamily: 'inherit',
                                      fontWeight: 500,
                                      textTransform: 'capitalize',
                                    }}
                                    placeholder={isBn ? 'যেমন: বিজ্ঞান, মানবিক' : 'e.g. Science, Humanity'}
                                  />
                                </div>
                                <div>
                                  <label
                                    style={{
                                      fontSize: '0.625rem',
                                      fontWeight: 500,
                                      color: 'var(--text-muted)',
                                      marginBottom: '0.25rem',
                                      display: 'block',
                                    }}
                                  >
                                    {isBn ? 'আসন সংখ্যা' : 'Seat Quantity'}
                                  </label>
                                  <input
                                    type="number"
                                    value={secForm.seatQuantity}
                                    min={1}
                                    onChange={(e) => setSecForm((p) => ({ ...p, seatQuantity: Number(e.target.value) || 1 }))}
                                    style={{
                                      width: '100%',
                                      padding: '7px 9px',
                                      borderRadius: '0.4375rem',
                                      border: '1px solid var(--border)',
                                      background: 'var(--bg-secondary)',
                                      color: 'var(--text-primary)',
                                      fontSize: '0.75rem',
                                      fontFamily: 'inherit',
                                      textAlign: 'center',
                                    }}
                                  />
                                </div>
                                <div>
                                  <label
                                    style={{
                                      fontSize: '0.625rem',
                                      fontWeight: 500,
                                      color: 'var(--text-muted)',
                                      marginBottom: '0.25rem',
                                      display: 'block',
                                    }}
                                  >
                                    {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
                                  </label>
                                  <select
                                    value={secForm.classTeacherId}
                                    onChange={(e) => setSecForm((p) => ({ ...p, classTeacherId: e.target.value }))}
                                    style={{
                                      width: '100%',
                                      padding: '7px 9px',
                                      borderRadius: '0.4375rem',
                                      border: '1px solid var(--border)',
                                      background: 'var(--bg-secondary)',
                                      color: 'var(--text-primary)',
                                      fontSize: '0.6875rem',
                                      fontFamily: 'inherit',
                                    }}
                                  >
                                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select'}</option>
                                    {teachers
                                      .filter((t) => t.status === 'active')
                                      .map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.nameEn} ({t.id})
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>

                              {/* Teacher preview */}
                              {(() => {
                                const t = secForm.classTeacherId ? getTeacher(secForm.classTeacherId) : teacher
                                if (!t) return null
                                return (
                                  <div
                                    style={{
                                      marginTop: '0.5rem',
                                      padding: '0.5rem',
                                      borderRadius: '0.5rem',
                                      background: 'var(--bg-secondary)',
                                      border: '1px solid var(--border)',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <div
                                        style={{
                                          width: '1.75rem',
                                          height: '1.75rem',
                                          borderRadius: '0.375rem',
                                          overflow: 'hidden',
                                          background: 'var(--bg-primary)',
                                          border: '1px solid var(--border)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {t.photo ? (
                                          <img src={t.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
                                            {t.nameEn
                                              .split(' ')
                                              .map((n: string) => n[0])
                                              .slice(0, 2)
                                              .join('')}
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            fontSize: '0.6875rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {t.nameEn}
                                        </div>
                                        <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>{t.designation || ''}</div>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                                        <Phone size={9} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '0.5625rem', color: 'var(--text-secondary)' }}>{institution.phone}</span>
                                      </div>
                                    </div>
                                    {t.signature && (
                                      <div
                                        style={{
                                          marginTop: '0.375rem',
                                          padding: '4px 6px',
                                          borderRadius: '0.3125rem',
                                          background: 'var(--bg-primary)',
                                          border: '1px dashed var(--border)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                        }}
                                      >
                                        <Signature size={10} style={{ color: 'var(--text-muted)' }} />
                                        <img src={t.signature} alt="Sig" style={{ height: '1rem', objectFit: 'contain' }} />
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Assigned subjects */}
                              {sec.subjectIds && sec.subjectIds.length > 0 && (
                                <div
                                  style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    background: 'var(--teal-light)',
                                    border: '1px solid var(--teal-border)',
                                  }}
                                >
                                  <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--teal)', marginBottom: '0.375rem' }}>
                                    {isBn ? 'নির্ধারিত বিষয়সমূহ' : 'Assigned Subjects'}
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {sec.subjectIds.map((sid: string) => {
                                      const sub = subjects.find((s) => s.id === sid)
                                      if (!sub) return null
                                      return (
                                        <span
                                          key={sid}
                                          style={{
                                            padding: '3px 8px',
                                            borderRadius: '0.625rem',
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border)',
                                            fontSize: '0.625rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                          }}
                                        >
                                          {isBn ? sub.nameBn : sub.name}
                                          <button
                                            onClick={() => {
                                              const updated = sec.subjectIds.filter((s) => s !== sid)
                                              updateSection(cls.id, sec.id, { subjectIds: updated })
                                              setSecForm((p) => ({ ...p, subjectIds: updated }))
                                            }}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              padding: 0,
                                              cursor: 'pointer',
                                              color: 'var(--text-muted)',
                                              display: 'flex',
                                            }}
                                          >
                                            <X size={10} />
                                          </button>
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem' }}>
                                <button
                                  onClick={() => {
                                    setTempSelectedSubjects(sec.subjectIds || [])
                                    setShowSubjectModal({ classId: cls.id, sectionId: sec.id })
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '0.4375rem',
                                    borderRadius: '0.4375rem',
                                    background: 'var(--teal)',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.6875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <BookOpen size={11} />
                                  {isBn ? 'বিষয় যোগ করুন' : 'Add Subject'}
                                </button>
                              </div>

                              {/* Save button */}
                              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem' }}>
                                <button
                                  onClick={() => {
                                    updateSection(cls.id, sec.id, {
                                      name: secForm.name || sec.name,
                                      seatQuantity: secForm.seatQuantity,
                                      classTeacherId: secForm.classTeacherId,
                                    })
                                    setEditingSection(null)
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '0.4375rem',
                                    borderRadius: '0.4375rem',
                                    background: 'var(--brand)',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.6875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <Save size={11} />
                                  {isBn ? 'সেভ' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingSection(null)}
                                  style={{
                                    padding: '7px 12px',
                                    borderRadius: '0.4375rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.6875rem',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  {isBn ? 'বাতিল' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* ===== BULK TIME MODAL ===== */}
      {showBulkTime && (
        <div
          onClick={() => setShowBulkTime(false)}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] w-full max-w-[25rem] shadow-lg"
          >
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--amber-light)] flex items-center justify-center">
                  <Clock size={18} className="text-[var(--amber)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">{isBn ? 'বাল্ক সময় সেট' : 'Bulk Set Time'}</h3>
                  <p className="text-[0.625rem] text-[var(--text-muted)] m-0">
                    {selectedClasses.length} {isBn ? 'টি শ্রেণিতে সময় পরিবর্তন হবে' : 'classes will be updated'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkTime(false)}
                className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'শুরুর সময়' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={bulkTimeForm.startTime}
                    onChange={(e) => setBulkTimeForm((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--amber)]"
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'শেষের সময়' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    value={bulkTimeForm.endTime}
                    onChange={(e) => setBulkTimeForm((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--amber)]"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] mb-4">
                <div className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-2">
                  {isBn ? 'প্রভাবিত শ্রেণি' : 'Affected Classes'}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedClasses.map((id) => {
                    const c = classes.find((cl) => cl.id === id)
                    return c ? (
                      <span key={id} className="text-[0.625rem] py-1 px-2 rounded bg-[var(--amber-light)] text-[var(--amber)] font-medium">
                        {isBn ? c.nameBn : c.name}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkTime(false)}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer font-[inherit]"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleBulkTimeApply}
                  className="flex-1 py-2 rounded-lg bg-[var(--amber)] border-none text-white text-[0.75rem] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
                >
                  <Save size={13} />
                  {isBn ? 'প্রয়োগ করুন' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== BULK SUBJECT MODAL ===== */}
      {showBulkSubject && (
        <div
          onClick={() => setShowBulkSubject(false)}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] w-full max-w-[26.25rem] max-h-[80vh] flex flex-col shadow-lg"
          >
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
                  <BookOpen size={18} className="text-[var(--teal)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">
                    {isBn ? 'বাল্ক বিষয় নির্ধারণ' : 'Bulk Assign Subjects'}
                  </h3>
                  <p className="text-[0.625rem] text-[var(--text-muted)] m-0">
                    {selectedClasses.length} {isBn ? 'টি শ্রেণির সব সেকশনে যোগ হবে' : 'classes, all sections will get these subjects'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkSubject(false)}
                className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {subjects.length === 0 ? (
                <div className="text-center py-5 text-[var(--text-muted)] text-[0.75rem]">
                  {isBn
                    ? 'কোনো বিষয় পাওয়া যায়নি। প্রথমে শিক্ষক ব্যবস্থাপনায় বিষয় যোগ করুন।'
                    : 'No subjects found. Add subjects in Teacher Management first.'}
                </div>
              ) : (
                <div className="flex flex-col gap-[0.375rem]">
                  {subjects.map((sub) => {
                    const isSelected = bulkSubjectIds.includes(sub.id)
                    return (
                      <button
                        key={sub.id}
                        onClick={() => toggleTempSubject(sub.id)}
                        className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-left transition-all duration-150 font-[inherit]"
                        style={{
                          borderColor: isSelected ? 'var(--teal)' : 'var(--border)',
                          background: isSelected ? 'var(--teal-light)' : 'var(--bg-secondary)',
                        }}
                      >
                        <div
                          className="w-[1.125rem] h-[1.125rem] rounded-[0.3125rem] border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            borderColor: isSelected ? 'var(--teal)' : 'var(--border)',
                            background: isSelected ? 'var(--teal)' : 'transparent',
                          }}
                        >
                          {isSelected && <Check size={11} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.75rem] font-medium text-[var(--text-primary)]">{isBn ? sub.nameBn : sub.name}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[var(--border)] flex gap-2 shrink-0">
              <button
                onClick={() => setShowBulkSubject(false)}
                className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleBulkSubjectApply}
                disabled={bulkSubjectIds.length === 0}
                className="flex-1 py-2 rounded-lg border-none text-white text-[0.75rem] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
                style={{ background: bulkSubjectIds.length > 0 ? 'var(--teal)' : 'var(--border)' }}
              >
                <Save size={13} />
                {isBn ? 'সেভ' : 'Save'} ({bulkSubjectIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BULK SECTION MODAL ===== */}
      {showBulkSection && (
        <div
          onClick={() => setShowBulkSection(false)}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] w-full max-w-[25rem] shadow-lg"
          >
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--purple-light)] flex items-center justify-center">
                  <ListChecks size={18} className="text-[var(--purple)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">{isBn ? 'বাল্ক সেকশন যোগ' : 'Bulk Add Sections'}</h3>
                  <p className="text-[0.625rem] text-[var(--text-muted)] m-0">
                    {selectedClasses.length} {isBn ? 'টি শ্রেণিতে সেকশন যোগ হবে' : 'classes will get new sections'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkSection(false)}
                className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'সেকশন সংখ্যা' : 'Number of Sections'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bulkSectionCount}
                    onChange={(e) => setBulkSectionCount(Number(e.target.value) || 1)}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none text-center focus:border-[var(--purple)]"
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'প্রতি সেকশন আসন' : 'Seats per Section'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bulkSeatQuantity}
                    onChange={(e) => setBulkSeatQuantity(Number(e.target.value) || 1)}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none text-center focus:border-[var(--purple)]"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] mb-4">
                <div className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-2">
                  {isBn ? 'প্রভাবিত শ্রেণি' : 'Affected Classes'}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedClasses.map((id) => {
                    const c = classes.find((cl) => cl.id === id)
                    return c ? (
                      <span key={id} className="text-[0.625rem] py-1 px-2 rounded bg-[var(--purple-light)] text-[var(--purple)] font-medium">
                        {isBn ? c.nameBn : c.name}
                      </span>
                    ) : null
                  })}
                </div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-2">
                  {isBn
                    ? `মোট ${selectedClasses.length * bulkSectionCount} টি নতুন সেকশন তৈরি হবে`
                    : `${selectedClasses.length * bulkSectionCount} new sections will be created`}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkSection(false)}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer font-[inherit]"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleBulkSectionApply}
                  className="flex-1 py-2 rounded-lg bg-[var(--purple)] border-none text-white text-[0.75rem] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
                >
                  <Plus size={13} />
                  {isBn ? 'যোগ করুন' : 'Add Sections'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Selection Modal */}
      {showSubjectModal && (
        <div
          onClick={() => setShowSubjectModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '100dvh',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-content"
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '25rem',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subjects'}
                </h3>
                <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  {isBn ? 'শিক্ষক ব্যবস্থাপনা থেকে বিষয় নির্বাচন করুন' : 'Select subjects from Teacher Management'}
                </p>
              </div>
              <button
                onClick={() => setShowSubjectModal(null)}
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1 }}>
              {subjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {isBn
                    ? 'কোনো বিষয় পাওয়া যায়নি। প্রথমে শিক্ষক ব্যবস্থাপনায় বিষয় যোগ করুন।'
                    : 'No subjects found. Add subjects in Teacher Management first.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {subjects.map((sub) => {
                    const isSelected = tempSelectedSubjects.includes(sub.id)
                    return (
                      <button
                        key={sub.id}
                        onClick={() =>
                          setTempSelectedSubjects((prev) => (isSelected ? prev.filter((s) => s !== sub.id) : [...prev, sub.id]))
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          padding: '10px 12px',
                          borderRadius: '0.625rem',
                          border: `1px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--teal-light)' : 'var(--bg-secondary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div
                          style={{
                            width: '1.125rem',
                            height: '1.125rem',
                            borderRadius: '0.3125rem',
                            border: `2px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--teal)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s',
                          }}
                        >
                          {isSelected && <Check size={11} style={{ color: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {isBn ? sub.nameBn : sub.name}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowSubjectModal(null)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (showSubjectModal) {
                    updateSection(showSubjectModal.classId, showSubjectModal.sectionId, { subjectIds: tempSelectedSubjects })
                  }
                  setShowSubjectModal(null)
                }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  background: 'var(--teal)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {isBn ? 'সেভ করুন' : 'Save'} ({tempSelectedSubjects.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
