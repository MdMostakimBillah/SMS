import { useState, useCallback, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Settings,
  Clock,
  Users,
  Plus,
  Trash2,
  Save,
  Check,
  Building2,
  Phone,
  Globe,
  MapPin,
  Edit2,
  X,
  Signature,
  CalendarDays,
  Download,
  BookOpen,
  Copy,
  ListChecks,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useClassStore } from '@/store/classStore'
import type { ClassSection } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useAdmissionStore } from '@/store/admissionStore'

export default function ClassesPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const {
    institution,
    classes,
    routines,
    updateInstitution,
    addClass,
    updateClass,
    deleteClass,
    addSection,
    updateSection,
    deleteSection,
    updateRoutine,
    setRoutineSlot,
    clearRoutineSlot,
    switchSession,
    importFromSession,
  } = useClassStore()
  const { teachers, subjects } = useTeacherStore()
  const { students } = useAdmissionStore()
  const isBn = language === 'bn'

  const [activeTab, setActiveTab] = useState<'institution' | 'classes' | 'routine'>('institution')
  const [editingInst, setEditingInst] = useState(false)
  const [instForm, setInstForm] = useState(() => ({
    ...institution,
    breaks: institution.breaks?.length > 0 ? institution.breaks : [{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }],
  }))
  const [saved, setSaved] = useState(false)
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

  // Bulk operations state
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [showBulkTime, setShowBulkTime] = useState(false)
  const [showBulkSubject, setShowBulkSubject] = useState(false)
  const [showBulkSection, setShowBulkSection] = useState(false)
  const [bulkTimeForm, setBulkTimeForm] = useState({ startTime: '07:30', endTime: '14:30' })
  const [bulkSubjectIds, setBulkSubjectIds] = useState<string[]>([])
  const [bulkSectionCount, setBulkSectionCount] = useState(2)
  const [bulkSeatQuantity, setBulkSeatQuantity] = useState(40)
  const [newSessionInput, setNewSessionInput] = useState('')

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

  const handleSaveInstitution = () => {
    updateInstitution(instForm)
    setEditingInst(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddClass = () => {
    if (!newClassName.trim()) return
    const id = `CLS-${String(classes.length + 1).padStart(2, '0')}`
    const now = new Date().toISOString().split('T')[0]

    let sections: ClassSection[] = []
    let subjectIds: string[] = []

    if (copyFromClassId) {
      const sourceClass = classes.find((c) => c.id === copyFromClassId)
      if (sourceClass) {
        sections = sourceClass.sections.map((sec) => ({
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
    const id = `SEC-${classId}-${nextLetter}`
    addSection(classId, { id, name: nextLetter, seatQuantity: 40, classTeacherId: '', subjectIds: [] })
  }

  const handleSaveClassTime = (classId: string) => {
    updateClass(classId, classTimeForm)
    setEditingClassTime(null)
  }

  // Bulk operations handlers
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
      cls.sections.forEach((sec) => {
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
        const id = `SEC-${classId}-${letter}`
        addSection(classId, { id, name: letter, seatQuantity: bulkSeatQuantity, classTeacherId: '', subjectIds: [] })
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
    'w-full py-[9px] px-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none'
  const labelClass = 'text-[11px] font-medium text-[var(--text-secondary)] mb-[5px] block'
  const sectionClass = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 mb-[14px]'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-[10px] mb-4 flex-wrap">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-[5px] py-[7px] px-3 rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`${isMobile ? 'text-[18px]' : 'text-[22px]'} font-semibold text-[var(--text-primary)]`}>
            {isBn ? 'শ্রেণি ব্যবস্থাপনা' : 'Classes Management'}
          </h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-[2px]">
            {isBn ? 'প্রতিষ্ঠান সেটিংস এবং শ্রেণি পরিচালনা' : 'Institution settings & class management'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-[6px] mb-[14px] flex-wrap">
        {[
          { id: 'institution' as const, icon: Settings, label: isBn ? 'প্রতিষ্ঠান' : 'Institution', color: 'var(--brand)' },
          { id: 'classes' as const, icon: Users, label: isBn ? 'শ্রেণি' : 'Classes', color: 'var(--teal)' },
          { id: 'routine' as const, icon: CalendarDays, label: isBn ? 'রুটিন' : 'Routine', color: 'var(--purple)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-[6px] py-2 px-4 rounded-lg border text-[13px] cursor-pointer font-[inherit] transition-all duration-150 ${activeTab === tab.id ? (tab.id === 'institution' ? 'border-[var(--brand)] bg-[var(--brand)15] text-[var(--brand)] font-semibold' : tab.id === 'classes' ? 'border-[var(--teal)] bg-[var(--teal)15] text-[var(--teal)] font-semibold' : 'border-[var(--purple)] bg-[var(--purple)15] text-[var(--purple)] font-semibold') : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Institution Tab */}
      {activeTab === 'institution' && (
        <div className={sectionClass}>
          <div className="flex items-center justify-between mb-[14px] pb-2 border-b border-[var(--border)]">
            <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Building2 size={18} className="text-[var(--brand)]" />
              {isBn ? 'প্রতিষ্ঠানের তথ্য' : 'Institution Information'}
            </div>
            {!editingInst ? (
              <button
                onClick={() => {
                  setInstForm({ ...institution })
                  setEditingInst(true)
                }}
                className="flex items-center gap-[5px] py-[6px] px-3 rounded-[7px] bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-xs cursor-pointer font-[inherit]"
              >
                <Edit2 size={13} />
                {isBn ? 'এডিট' : 'Edit'}
              </button>
            ) : (
              <div className="flex gap-[6px]">
                <button
                  onClick={() => setEditingInst(false)}
                  className="py-[6px] px-3 rounded-[7px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit]"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveInstitution}
                  className="flex items-center gap-[5px] py-[6px] px-3 rounded-[7px] bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
                >
                  {saved ? <Check size={13} /> : <Save size={13} />}
                  {saved ? (isBn ? 'সেভ হয়েছে' : 'Saved') : isBn ? 'সেভ' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* View mode */}
          {!editingInst && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Building2 size={11} />
                  {isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{institution.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{institution.nameBn}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Phone size={11} />
                  {isBn ? 'ফোন' : 'Phone'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{institution.phone}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Globe size={11} />
                  Email / {isBn ? 'ওয়েবসাইট' : 'Website'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{institution.email}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{institution.website}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <MapPin size={11} />
                  {isBn ? 'ঠিকানা' : 'Address'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{institution.address}</div>
              </div>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  gridColumn: isMobile ? 'auto' : '1 / -1',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} />
                  {isBn ? 'সময়সূচি' : 'Schedule'}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isBn ? 'শুরু' : 'Start'}:</span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--brand)',
                        background: 'var(--brand-light)',
                        padding: '3px 8px',
                        borderRadius: '5px',
                      }}
                    >
                      {institution.startTime}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isBn ? 'শেষ' : 'End'}:</span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--brand)',
                        background: 'var(--brand-light)',
                        padding: '3px 8px',
                        borderRadius: '5px',
                      }}
                    >
                      {institution.endTime}
                    </span>
                  </div>
                  {(institution.breaks || []).map((brk) => (
                    <div key={brk.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{brk.label}:</span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--amber)',
                          background: 'var(--amber-light)',
                          padding: '3px 8px',
                          borderRadius: '5px',
                        }}
                      >
                        {brk.start} - {brk.end}
                      </span>
                    </div>
                  ))}
                  {(institution.breaks || []).length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {isBn ? 'কোনো বিরতি নেই' : 'No breaks'}
                    </span>
                  )}
                </div>
              </div>
              {/* Session/Year */}
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  gridColumn: isMobile ? 'auto' : '1 / -1',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CalendarDays size={11} />
                  {isBn ? 'একাডেমিক সেশন' : 'Academic Session'}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--brand)',
                      background: 'var(--brand-light)',
                      padding: '4px 12px',
                      borderRadius: '6px',
                    }}
                  >
                    {institution.currentSession}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isBn ? 'বর্তমান সেশন' : 'Current Session'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {institution.sessions.length} {isBn ? 'টি সেশন সংরক্ষিত' : 'sessions saved'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Edit mode */}
          {editingInst && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={labelClass}>{isBn ? 'প্রতিষ্ঠানের নাম (ইং)' : 'Name (EN)'}</label>
                <input
                  value={instForm.name}
                  onChange={(e) => setInstForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'প্রতিষ্ঠানের নাম (বাং)' : 'Name (BN)'}</label>
                <input
                  value={instForm.nameBn}
                  onChange={(e) => setInstForm((p) => ({ ...p, nameBn: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ফোন' : 'Phone'}</label>
                <input
                  value={instForm.phone}
                  onChange={(e) => setInstForm((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  value={instForm.email}
                  onChange={(e) => setInstForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ওয়েবসাইট' : 'Website'}</label>
                <input
                  value={instForm.website}
                  onChange={(e) => setInstForm((p) => ({ ...p, website: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <label className={labelClass}>{isBn ? 'ঠিকানা' : 'Address'}</label>
                <input
                  value={instForm.address}
                  onChange={(e) => setInstForm((p) => ({ ...p, address: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ক্লাস শুরুর সময়' : 'Class Start Time'}</label>
                <input
                  type="time"
                  value={instForm.startTime}
                  onChange={(e) => setInstForm((p) => ({ ...p, startTime: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ক্লাস শেষের সময়' : 'Class End Time'}</label>
                <input
                  type="time"
                  value={instForm.endTime}
                  onChange={(e) => setInstForm((p) => ({ ...p, endTime: e.target.value }))}
                  className={inputClass}
                />
              </div>
              {/* Session/Year */}
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] m-0">
                    {isBn ? 'একাডেমিক সেশন' : 'Academic Session'}
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={instForm.currentSession}
                      onChange={(e) => setInstForm((p) => ({ ...p, currentSession: e.target.value }))}
                      className="flex-1 py-[9px] px-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none"
                    >
                      {instForm.sessions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={newSessionInput}
                      onChange={(e) => setNewSessionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = newSessionInput.trim()
                          if (val && !instForm.sessions.includes(val)) {
                            setInstForm((p) => ({ ...p, sessions: [...p.sessions, val].sort(), currentSession: val }))
                            setNewSessionInput('')
                          }
                        }
                      }}
                      className="flex-1 py-[9px] px-[11px] rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none focus:border-[var(--brand)]"
                      placeholder={isBn ? 'নতুন সেশন যোগ করুন (Enter চাপুন)' : 'Add new session (press Enter)'}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newSessionInput.trim()
                        if (val && !instForm.sessions.includes(val)) {
                          setInstForm((p) => ({ ...p, sessions: [...p.sessions, val].sort(), currentSession: val }))
                          setNewSessionInput('')
                        }
                      }}
                      className="py-[9px] px-3 rounded-lg bg-[var(--brand)] border-none text-white text-[12px] font-medium cursor-pointer font-[inherit] shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {instForm.sessions.map((s) => (
                      <span
                        key={s}
                        className={`inline-flex items-center gap-1 text-[11px] py-1 px-2.5 rounded-md font-medium transition-all ${instForm.currentSession === s ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'}`}
                      >
                        <span className="cursor-pointer" onClick={() => setInstForm((p) => ({ ...p, currentSession: s }))}>
                          {s}
                        </span>
                        {instForm.sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  isBn
                                    ? `"${s}" সেশন মুছে ফেলতে চান? এই সেশনের সব ক্লাস ও রুটিন মুছে যাবে।`
                                    : `Delete session "${s}"? All classes and routines for this session will be removed.`
                                )
                              ) {
                                setInstForm((p) => {
                                  const newSessions = p.sessions.filter((x) => x !== s)
                                  const newCurrent = p.currentSession === s ? newSessions[0] || '' : p.currentSession
                                  return { ...p, sessions: newSessions, currentSession: newCurrent }
                                })
                              }
                            }}
                            className={`p-0 rounded-full border-none cursor-pointer flex items-center justify-center w-[14px] h-[14px] transition-all ${instForm.currentSession === s ? 'bg-white/30 text-white hover:bg-white/50' : 'bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white'}`}
                          >
                            <X size={9} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Break Times - Redesigned */}
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-[28px] h-[28px] rounded-[7px] bg-[var(--amber-light)] flex items-center justify-center">
                      <Clock size={14} className="text-[var(--amber)]" />
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold text-[var(--text-primary)] m-0">
                        {isBn ? 'বিরতির সময়' : 'Break Times'}
                      </label>
                      <p className="text-[10px] text-[var(--text-muted)] m-0">
                        {instForm.breaks.length} {isBn ? 'টি বিরতি সেট করা আছে' : 'breaks configured'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setInstForm((p) => ({
                        ...p,
                        breaks: [
                          ...p.breaks,
                          {
                            id: `BRK-${Date.now()}`,
                            label: `${isBn ? 'বিরতি' : 'Break'} ${p.breaks.length + 1}`,
                            start: '12:00',
                            end: '12:30',
                          },
                        ],
                      }))
                    }
                    className="flex items-center gap-[5px] py-[6px] px-3 rounded-[7px] bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[11px] font-medium cursor-pointer font-[inherit] transition-all duration-150 hover:shadow-sm"
                  >
                    <Plus size={12} />
                    {isBn ? 'বিরতি যোগ' : 'Add Break'}
                  </button>
                </div>

                {instForm.breaks.length === 0 ? (
                  <div className="p-4 text-center rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]">
                    <Clock size={24} className="mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
                    <p className="text-[12px] text-[var(--text-muted)] m-0">
                      {isBn
                        ? 'কোনো বিরতি সেট করা হয়নি। "বিরতি যোগ" বাটনে ক্লিক করুন।'
                        : 'No breaks configured. Click "Add Break" to get started.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-[8px]">
                    {instForm.breaks.map((brk, i) => (
                      <div
                        key={brk.id}
                        className="flex items-center gap-[8px] p-[10px] rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] transition-all duration-150 hover:border-[var(--amber)] hover:shadow-sm group"
                      >
                        <div className="w-[32px] h-[32px] rounded-[8px] bg-[var(--amber-light)] flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-[var(--amber)]">B{i + 1}</span>
                        </div>
                        <input
                          value={brk.label}
                          onChange={(e) => {
                            const breaks = [...instForm.breaks]
                            breaks[i] = { ...brk, label: e.target.value }
                            setInstForm((p) => ({ ...p, breaks }))
                          }}
                          className="w-[90px] py-[6px] px-[8px] rounded-[6px] border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[12px] font-medium font-[inherit] outline-none focus:border-[var(--amber)] transition-colors"
                          placeholder={isBn ? 'নাম' : 'Label'}
                        />
                        <div className="flex items-center gap-[4px]">
                          <input
                            type="time"
                            value={brk.start}
                            onChange={(e) => {
                              const breaks = [...instForm.breaks]
                              breaks[i] = { ...brk, start: e.target.value }
                              setInstForm((p) => ({ ...p, breaks }))
                            }}
                            className="py-[6px] px-[8px] rounded-[6px] border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[12px] font-[inherit] outline-none focus:border-[var(--amber)] transition-colors"
                          />
                          <span className="text-[11px] font-medium text-[var(--text-muted)]">→</span>
                          <input
                            type="time"
                            value={brk.end}
                            onChange={(e) => {
                              const breaks = [...instForm.breaks]
                              breaks[i] = { ...brk, end: e.target.value }
                              setInstForm((p) => ({ ...p, breaks }))
                            }}
                            className="py-[6px] px-[8px] rounded-[6px] border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[12px] font-[inherit] outline-none focus:border-[var(--amber)] transition-colors"
                          />
                        </div>
                        <div className="flex items-center gap-[4px] ml-auto opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-[var(--amber)] font-medium bg-[var(--amber-light)] py-[2px] px-[6px] rounded-[4px]">
                            {(() => {
                              const [sh, sm] = brk.start.split(':').map(Number)
                              const [eh, em] = brk.end.split(':').map(Number)
                              return eh * 60 + em - (sh * 60 + sm)
                            })()}{' '}
                            {isBn ? 'মিনিট' : 'min'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInstForm((p) => ({ ...p, breaks: p.breaks.filter((b) => b.id !== brk.id) }))}
                            className="p-[5px] rounded-[6px] bg-[var(--red-light)] border border-[var(--red)] cursor-pointer text-[var(--red)] transition-all duration-150 hover:bg-[var(--red)] hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <>
          {/* Session indicator */}
          <div className="flex items-center gap-2 mb-3 py-2 px-3 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]">
            <CalendarDays size={14} className="text-[var(--brand)]" />
            <span className="text-[12px] font-semibold text-[var(--brand)]">{institution.currentSession}</span>
            <span className="text-[11px] text-[var(--text-muted)]">{isBn ? 'বর্তমান সেশন' : 'Current Session'}</span>
            <div className="flex-1" />
            <div className="flex gap-1">
              {institution.sessions
                .filter((s) => s !== institution.currentSession)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => switchSession(s)}
                    className="text-[10px] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] cursor-pointer font-[inherit] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
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
                <div className="text-[13px] font-semibold text-[var(--purple)]">
                  {isBn ? 'আগের বছর থেকে আমদানি করুন' : 'Import from Previous Session'}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
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
                      className="flex items-center gap-[4px] py-[6px] px-3 rounded-lg bg-[var(--purple)] border-none text-white text-[11px] font-medium cursor-pointer font-[inherit] hover:opacity-90 transition-all"
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
            <div className="text-[12px] text-[var(--text-muted)]">
              {classes.length} {isBn ? 'টি শ্রেণি' : 'classes'} · {classes.reduce((s, c) => s + c.sections.length, 0)}{' '}
              {isBn ? 'টি সেকশন' : 'sections'}
              {bulkMode && selectedClasses.length > 0 && (
                <span className="ml-2 text-[var(--teal)] font-semibold">
                  · {selectedClasses.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div className="flex gap-[6px] flex-wrap">
              {bulkMode && selectedClasses.length > 0 && (
                <>
                  <button
                    onClick={() => setShowBulkTime(true)}
                    className="flex items-center gap-[4px] py-[5px] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] font-medium cursor-pointer font-[inherit] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all"
                  >
                    <Clock size={11} />
                    {isBn ? 'সময়' : 'Time'}
                  </button>
                  <button
                    onClick={() => setShowBulkSubject(true)}
                    className="flex items-center gap-[4px] py-[5px] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] font-medium cursor-pointer font-[inherit] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-all"
                  >
                    <BookOpen size={11} />
                    {isBn ? 'বিষয়' : 'Subject'}
                  </button>
                  <button
                    onClick={() => setShowBulkSection(true)}
                    className="flex items-center gap-[4px] py-[5px] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] font-medium cursor-pointer font-[inherit] hover:border-[var(--purple)] hover:text-[var(--purple)] transition-all"
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
                className={`flex items-center gap-[4px] py-[5px] px-2.5 rounded-md border text-[11px] font-medium cursor-pointer font-[inherit] transition-all ${bulkMode ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}
              >
                <ListChecks size={11} />
                {bulkMode ? (isBn ? 'বন্ধ' : 'Done') : isBn ? 'বাল্ক' : 'Bulk'}
              </button>
              <button
                onClick={() => setShowAddClass(true)}
                className="flex items-center gap-[5px] py-[7px] px-3 rounded-[8px] bg-[var(--brand)] border-none text-white text-[12px] font-medium cursor-pointer font-[inherit]"
              >
                <Plus size={14} />
                {isBn ? 'নতুন শ্রেণি' : 'Add Class'}
              </button>
            </div>
          </div>

          {/* Add class form */}
          {showAddClass && (
            <div className={sectionClass} style={{ borderColor: 'var(--brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)' }}>{isBn ? 'নতুন শ্রেণি যোগ' : 'Add New Class'}</div>
                <button
                  onClick={() => setShowAddClass(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Copy size={12} />
                {isBn ? 'আগের শ্রেণি থেকে কপি করুন (ঐচ্ছিক)' : 'Copy from existing class (optional)'}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'end', marginBottom: '10px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
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
                    borderRadius: '8px',
                    background: 'var(--brand)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
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
                className="flex items-center gap-2 cursor-pointer bg-transparent border-none font-[inherit] text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <div
                  className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center transition-all ${selectedClasses.length === classes.length ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border)]'}`}
                >
                  {selectedClasses.length === classes.length && <Check size={11} className="text-white" />}
                </div>
                {isBn ? 'সব নির্বাচন' : 'Select All'}
              </button>
              {selectedClasses.length > 0 && (
                <span className="text-[11px] text-[var(--brand)] font-medium">
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
                className={`mb-[10px] rounded-[10px] border bg-[var(--bg-primary)] p-[12px] transition-all duration-150 ${bulkMode && isSelected ? 'border-[var(--brand)]' : 'border-[var(--border)]'}`}
              >
                {/* Class header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
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
                      className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${isSelected ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border)] hover:border-[var(--brand)]'}`}
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
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--brand-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)' }}>{cls.id.replace('CLS-', '')}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? cls.nameBn : cls.name}</div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                        marginTop: '2px',
                      }}
                    >
                      <span>
                        {cls.sections.length} {isBn ? 'সেকশন' : 'sections'}
                      </span>
                      <span>
                        {totalSeats} {isBn ? 'আসন' : 'seats'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
                          borderRadius: '6px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          fontSize: '10px',
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
                          borderRadius: '6px',
                          background: 'var(--red-light)',
                          border: '1px solid var(--red)',
                          cursor: 'pointer',
                          fontSize: '10px',
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
                      marginTop: '10px',
                      padding: '14px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--brand)',
                      borderRadius: '10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--brand)',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Clock size={14} />
                      {isBn ? 'ক্লাস সময় পরিবর্তন' : 'Change Class Time'}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr auto',
                        gap: '10px',
                        alignItems: 'end',
                      }}
                    >
                      <div>
                        <label
                          style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}
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
                            borderRadius: '7px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontFamily: 'inherit',
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}
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
                            borderRadius: '7px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontFamily: 'inherit',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleSaveClassTime(cls.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '7px',
                            background: 'var(--brand)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Save size={12} />
                          {isBn ? 'সেভ' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingClassTime(null)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '7px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
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
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {isBn ? 'সেকশন সমূহ' : 'Sections'}
                      </div>
                      <button
                        onClick={() => handleAddSection(cls.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: 'var(--teal-light)',
                          border: '1px solid var(--teal)',
                          color: 'var(--teal)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <Plus size={12} />
                        {isBn ? 'সেকশন যোগ' : 'Add Section'}
                      </button>
                    </div>

                    {cls.sections.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {isBn ? 'কোনো সেকশন নেই' : 'No sections yet'}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                          gap: '10px',
                        }}
                      >
                        {cls.sections.map((sec) => {
                          const teacher = sec.classTeacherId ? getTeacher(sec.classTeacherId) : null
                          const isEditing = editingSection === sec.id
                          return (
                            <div
                              key={sec.id}
                              style={{
                                borderRadius: '10px',
                                border: `1px solid ${isEditing ? 'var(--brand)' : 'var(--border)'}`,
                                background: isEditing ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                                overflow: 'hidden',
                                transition: 'all 0.2s',
                              }}
                            >
                              {/* Compact header — always visible */}
                              <div
                                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
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
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: isEditing ? 'var(--brand)' : 'var(--brand-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <span style={{ color: isEditing ? '#fff' : 'var(--brand)', fontSize: '11px', fontWeight: 700 }}>
                                    {cls.id.replace('CLS-', '')}
                                    {sec.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {isBn ? 'সেকশন' : 'Section'} {sec.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '10px',
                                      color: 'var(--text-muted)',
                                      display: 'flex',
                                      gap: '8px',
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
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteSection(cls.id, sec.id)
                                    }}
                                    style={{
                                      padding: '4px',
                                      borderRadius: '5px',
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
                                  <div style={{ paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <div>
                                      <label
                                        style={{
                                          fontSize: '10px',
                                          fontWeight: 500,
                                          color: 'var(--text-muted)',
                                          marginBottom: '4px',
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
                                          borderRadius: '7px',
                                          border: '1px solid var(--border)',
                                          background: 'var(--bg-secondary)',
                                          color: 'var(--text-primary)',
                                          fontSize: '12px',
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
                                          fontSize: '10px',
                                          fontWeight: 500,
                                          color: 'var(--text-muted)',
                                          marginBottom: '4px',
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
                                          borderRadius: '7px',
                                          border: '1px solid var(--border)',
                                          background: 'var(--bg-secondary)',
                                          color: 'var(--text-primary)',
                                          fontSize: '12px',
                                          fontFamily: 'inherit',
                                          textAlign: 'center',
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label
                                        style={{
                                          fontSize: '10px',
                                          fontWeight: 500,
                                          color: 'var(--text-muted)',
                                          marginBottom: '4px',
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
                                          borderRadius: '7px',
                                          border: '1px solid var(--border)',
                                          background: 'var(--bg-secondary)',
                                          color: 'var(--text-primary)',
                                          fontSize: '11px',
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
                                          marginTop: '8px',
                                          padding: '8px',
                                          borderRadius: '8px',
                                          background: 'var(--bg-secondary)',
                                          border: '1px solid var(--border)',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div
                                            style={{
                                              width: '28px',
                                              height: '28px',
                                              borderRadius: '6px',
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
                                              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                                                {t.nameEn
                                                  .split(' ')
                                                  .map((n) => n[0])
                                                  .slice(0, 2)
                                                  .join('')}
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                              style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              {t.nameEn}
                                            </div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t.designation || ''}</div>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                            <Phone size={9} style={{ color: 'var(--text-muted)' }} />
                                            <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{institution.phone}</span>
                                          </div>
                                        </div>
                                        {t.signature && (
                                          <div
                                            style={{
                                              marginTop: '6px',
                                              padding: '4px 6px',
                                              borderRadius: '5px',
                                              background: 'var(--bg-primary)',
                                              border: '1px dashed var(--border)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                            }}
                                          >
                                            <Signature size={10} style={{ color: 'var(--text-muted)' }} />
                                            <img src={t.signature} alt="Sig" style={{ height: '16px', objectFit: 'contain' }} />
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}

                                  {/* Assigned subjects */}
                                  {sec.subjectIds && sec.subjectIds.length > 0 && (
                                    <div
                                      style={{
                                        marginTop: '8px',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        background: 'var(--teal-light)',
                                        border: '1px solid var(--teal-border)',
                                      }}
                                    >
                                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--teal)', marginBottom: '6px' }}>
                                        {isBn ? 'নির্ধারিত বিষয়সমূহ' : 'Assigned Subjects'}
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {sec.subjectIds.map((sid) => {
                                          const sub = subjects.find((s) => s.id === sid)
                                          if (!sub) return null
                                          return (
                                            <span
                                              key={sid}
                                              style={{
                                                padding: '3px 8px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border)',
                                                fontSize: '10px',
                                                fontWeight: 500,
                                                color: 'var(--text-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
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

                                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => {
                                        setTempSelectedSubjects(sec.subjectIds || [])
                                        setShowSubjectModal({ classId: cls.id, sectionId: sec.id })
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '7px',
                                        borderRadius: '7px',
                                        background: 'var(--teal)',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <BookOpen size={11} />
                                      {isBn ? 'বিষয় যোগ করুন' : 'Add Subject'}
                                    </button>
                                  </div>

                                  {/* Save button */}
                                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
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
                                        padding: '7px',
                                        borderRadius: '7px',
                                        background: 'var(--brand)',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <Save size={11} />
                                      {isBn ? 'সেভ' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setEditingSection(null)}
                                      style={{
                                        padding: '7px 12px',
                                        borderRadius: '7px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '11px',
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
        </>
      )}

      {/* Routine Tab */}
      {activeTab === 'routine' && (
        <>
          <div className="flex items-center gap-2 mb-3 py-2 px-3 rounded-lg bg-[var(--purple-light)] border border-[var(--purple)]">
            <CalendarDays size={14} className="text-[var(--purple)]" />
            <span className="text-[12px] font-semibold text-[var(--purple)]">{institution.currentSession}</span>
            <span className="text-[11px] text-[var(--text-muted)]">{isBn ? 'রুটিন সেশন' : 'Routine Session'}</span>
          </div>

          {/* Import routines from previous session prompt */}
          {routines.length === 0 && institution.sessions.filter((s) => s !== institution.currentSession).length > 0 && (
            <div className="flex items-center gap-3 mb-3 py-3 px-4 rounded-xl bg-[var(--purple-light)] border border-[var(--purple)] border-dashed">
              <div className="w-9 h-9 rounded-lg bg-[var(--purple)] flex items-center justify-center shrink-0">
                <Download size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[var(--purple)]">
                  {isBn ? 'আগের সেশন থেকে রুটিন আমদানি করুন' : 'Import Routines from Previous Session'}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {isBn
                    ? 'এই সেশনে কোনো রুটিন নেই। আগের সেশন থেকে রুটিন আমদানি করুন।'
                    : 'No routines in this session. Import routines from a previous session.'}
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
                      className="flex items-center gap-[4px] py-[6px] px-3 rounded-lg bg-[var(--purple)] border-none text-white text-[11px] font-medium cursor-pointer font-[inherit] hover:opacity-90 transition-all"
                    >
                      <Download size={11} />
                      {isBn ? `${s} থেকে আমদানি` : `Import from ${s}`}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <RoutineTab
            classes={classes}
            routines={routines}
            teachers={teachers}
            subjects={subjects}
            institution={institution}
            updateRoutine={updateRoutine}
            setRoutineSlot={setRoutineSlot}
            clearRoutineSlot={clearRoutineSlot}
            isBn={isBn}
            isMobile={isMobile}
          />
        </>
      )}

      {/* ===== BULK TIME MODAL ===== */}
      {showBulkTime && (
        <div
          onClick={() => setShowBulkTime(false)}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] w-full max-w-[400px] shadow-lg"
          >
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--amber-light)] flex items-center justify-center">
                  <Clock size={18} className="text-[var(--amber)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">{isBn ? 'বাল্ক সময় সেট' : 'Bulk Set Time'}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] m-0">
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
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'শুরুর সময়' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={bulkTimeForm.startTime}
                    onChange={(e) => setBulkTimeForm((p) => ({ ...p, startTime: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none focus:border-[var(--amber)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'শেষের সময়' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    value={bulkTimeForm.endTime}
                    onChange={(e) => setBulkTimeForm((p) => ({ ...p, endTime: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none focus:border-[var(--amber)]"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] mb-4">
                <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-2">
                  {isBn ? 'প্রভাবিত শ্রেণি' : 'Affected Classes'}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedClasses.map((id) => {
                    const c = classes.find((cl) => cl.id === id)
                    return c ? (
                      <span key={id} className="text-[10px] py-1 px-2 rounded bg-[var(--amber-light)] text-[var(--amber)] font-medium">
                        {isBn ? c.nameBn : c.name}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkTime(false)}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] font-medium cursor-pointer font-[inherit]"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleBulkTimeApply}
                  className="flex-1 py-2 rounded-lg bg-[var(--amber)] border-none text-white text-[12px] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
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
            className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] w-full max-w-[420px] max-h-[80vh] flex flex-col shadow-lg"
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
                  <p className="text-[10px] text-[var(--text-muted)] m-0">
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
                <div className="text-center py-5 text-[var(--text-muted)] text-[12px]">
                  {isBn
                    ? 'কোনো বিষয় পাওয়া যায়নি। প্রথমে শিক্ষক ব্যবস্থাপনায় বিষয় যোগ করুন।'
                    : 'No subjects found. Add subjects in Teacher Management first.'}
                </div>
              ) : (
                <div className="flex flex-col gap-[6px]">
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
                          className="w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            borderColor: isSelected ? 'var(--teal)' : 'var(--border)',
                            background: isSelected ? 'var(--teal)' : 'transparent',
                          }}
                        >
                          {isSelected && <Check size={11} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-[var(--text-primary)]">{isBn ? sub.nameBn : sub.name}</div>
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
                className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] font-medium cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleBulkSubjectApply}
                disabled={bulkSubjectIds.length === 0}
                className="flex-1 py-2 rounded-lg border-none text-white text-[12px] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
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
            className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] w-full max-w-[400px] shadow-lg"
          >
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--purple-light)] flex items-center justify-center">
                  <ListChecks size={18} className="text-[var(--purple)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">{isBn ? 'বাল্ক সেকশন যোগ' : 'Bulk Add Sections'}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] m-0">
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
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'সেকশন সংখ্যা' : 'Number of Sections'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bulkSectionCount}
                    onChange={(e) => setBulkSectionCount(Number(e.target.value) || 1)}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none text-center focus:border-[var(--purple)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'প্রতি সেকশন আসন' : 'Seats per Section'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bulkSeatQuantity}
                    onChange={(e) => setBulkSeatQuantity(Number(e.target.value) || 1)}
                    className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none text-center focus:border-[var(--purple)]"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] mb-4">
                <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-2">
                  {isBn ? 'প্রভাবিত শ্রেণি' : 'Affected Classes'}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedClasses.map((id) => {
                    const c = classes.find((cl) => cl.id === id)
                    return c ? (
                      <span key={id} className="text-[10px] py-1 px-2 rounded bg-[var(--purple-light)] text-[var(--purple)] font-medium">
                        {isBn ? c.nameBn : c.name}
                      </span>
                    ) : null
                  })}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-2">
                  {isBn
                    ? `মোট ${selectedClasses.length * bulkSectionCount} টি নতুন সেকশন তৈরি হবে`
                    : `${selectedClasses.length * bulkSectionCount} new sections will be created`}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkSection(false)}
                  className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] font-medium cursor-pointer font-[inherit]"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleBulkSectionApply}
                  className="flex-1 py-2 rounded-lg bg-[var(--purple)] border-none text-white text-[12px] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
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
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-content"
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '400px',
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
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subjects'}
                </h3>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  {isBn ? 'শিক্ষক ব্যবস্থাপনা থেকে বিষয় নির্বাচন করুন' : 'Select subjects from Teacher Management'}
                </p>
              </div>
              <button
                onClick={() => setShowSubjectModal(null)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
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
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {isBn
                    ? 'কোনো বিষয় পাওয়া যায়নি। প্রথমে শিক্ষক ব্যবস্থাপনায় বিষয় যোগ করুন।'
                    : 'No subjects found. Add subjects in Teacher Management first.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
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
                            width: '18px',
                            height: '18px',
                            borderRadius: '5px',
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
                          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {isBn ? sub.nameBn : sub.name}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowSubjectModal(null)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
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
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'var(--teal)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
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
    </div>
  )
}

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAYS_BN = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার']

function RoutineTab({
  classes,
  routines,
  teachers,
  subjects,
  institution,
  updateRoutine,
  setRoutineSlot,
  clearRoutineSlot,
  isBn,
  isMobile,
}: {
  classes: any[]
  routines: any[]
  teachers: any[]
  subjects: any[]
  institution: any
  updateRoutine: (classId: string, data: any) => void
  setRoutineSlot: (classId: string, day: number, period: number, slot: any) => void
  clearRoutineSlot: (classId: string, day: number, period: number, sectionId?: string) => void
  isBn: boolean
  isMobile: boolean
}) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '')
  const [selectedSection, setSelectedSection] = useState('')
  const [editSlot, setEditSlot] = useState<{ day: number; period: number } | null>(null)
  const [slotForm, setSlotForm] = useState({ subjectId: '', teacherId: '' })
  const [showCopyDay, setShowCopyDay] = useState(false)
  const [copyFrom, setCopyFrom] = useState(0)
  const [copyTo, setCopyTo] = useState(1)
  const [showCustomDuration, setShowCustomDuration] = useState(false)

  const cls = classes.find((c) => c.id === selectedClass)
  const sections = cls?.sections || []
  const effectiveSection = selectedSection || sections[0]?.id || ''
  const routine = routines.find((r) => r.classId === selectedClass && r.sectionId === effectiveSection)
  const defaultDuration = routine?.periodDuration || 40
  const weekendDays = routine?.weekendDays || [5]

  const periods = routine?.periods || []

  const resolvedPeriods = useMemo(() => {
    return periods.map((daySlots: any[]) =>
      (daySlots || []).map((slot: any) => {
        if (!slot?.teacherId) return slot
        if (slot.teacherName && !slot.teacherName.startsWith('TCH-')) return slot
        const teacher = teachers.find((t) => t.id === slot.teacherId)
        if (teacher) return { ...slot, teacherName: teacher.nameEn }
        return { ...slot, teacherName: slot.teacherName || slot.teacherId }
      })
    )
  }, [periods, teachers, routines])

  const startTime = cls?.startTime || institution.startTime || '07:30'

  const totalPeriods = useMemo(() => {
    const [sh, sm] = (cls?.startTime || institution.startTime || '07:30').split(':').map(Number)
    const [eh, em] = (cls?.endTime || institution.endTime || '14:30').split(':').map(Number)
    const totalMin = eh * 60 + em - (sh * 60 + sm)
    return Math.floor(totalMin / defaultDuration) || 7
  }, [cls, institution, defaultDuration])

  const periodDurations = useMemo(() => {
    const saved = routine?.periodDurations
    if (saved && saved.length > 0) {
      while (saved.length < totalPeriods) saved.push(defaultDuration)
      return saved.slice(0, totalPeriods)
    }
    return Array(totalPeriods).fill(defaultDuration)
  }, [routine?.periodDurations, defaultDuration, totalPeriods])

  const activeDays = useMemo(
    () => DAYS.map((d, i) => ({ name: d, nameBn: DAYS_BN[i], index: i })).filter((d) => !weekendDays.includes(d.index)),
    [weekendDays]
  )

  const getPeriodTime = (periodIndex: number) => {
    const [h, m] = startTime.split(':').map(Number)
    let startMin = h * 60 + m
    for (let i = 0; i < periodIndex; i++) {
      startMin += periodDurations[i] || defaultDuration
    }
    const endMin = startMin + (periodDurations[periodIndex] || defaultDuration)
    const pad = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
    return { start: pad(startMin), end: pad(endMin) }
  }

  const breakPositions = useMemo(() => {
    const breaks = institution.breaks || []
    if (breaks.length === 0) return []
    const [sh, sm] = startTime.split(':').map(Number)
    const schoolStartMin = sh * 60 + sm
    return breaks.map((brk: any) => {
      const [bh, bm] = brk.start.split(':').map(Number)
      const breakMin = bh * 60 + bm
      let elapsed = 0
      let periodIdx = 0
      while (periodIdx < totalPeriods) {
        elapsed += periodDurations[periodIdx] || defaultDuration
        if (schoolStartMin + elapsed > breakMin) break
        periodIdx++
      }
      return {
        ...brk,
        afterPeriod: Math.max(0, Math.min(periodIdx, totalPeriods - 1)),
      }
    }).sort((a: any, b: any) => a.afterPeriod - b.afterPeriod)
  }, [institution.breaks, startTime, periodDurations, defaultDuration, totalPeriods])

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || id
  const getTeacherName = (id: string) => teachers.find((t) => t.id === id)?.nameEn || id

  const handleSaveSlot = () => {
    if (editSlot && slotForm.subjectId) {
      setRoutineSlot(selectedClass, editSlot.day, editSlot.period, { ...slotForm, sectionId: effectiveSection })
    }
    setEditSlot(null)
    setSlotForm({ subjectId: '', teacherId: '' })
  }

  const handlePeriodDurationChange = (val: number) => {
    updateRoutine(selectedClass, { sectionId: effectiveSection, periodDuration: val, periodDurations: Array(totalPeriods).fill(val) })
  }

  const handlePeriodDurationUpdate = (periodIndex: number, val: number) => {
    const newDurations = [...periodDurations]
    while (newDurations.length <= periodIndex) newDurations.push(defaultDuration)
    newDurations[periodIndex] = val
    updateRoutine(selectedClass, { sectionId: effectiveSection, periodDurations: newDurations })
  }

  const toggleWeekend = (dayIndex: number) => {
    const newWeekends = weekendDays.includes(dayIndex) ? weekendDays.filter((d: number) => d !== dayIndex) : [...weekendDays, dayIndex]
    updateRoutine(selectedClass, { sectionId: effectiveSection, weekendDays: newWeekends })
  }

  const handleCopyDay = () => {
    const sourceSlots = resolvedPeriods[copyFrom] || []
    sourceSlots.forEach((slot: any, periodIdx: number) => {
      if (slot?.subjectId) {
        setRoutineSlot(selectedClass, copyTo, periodIdx, { ...slot, sectionId: effectiveSection })
      }
    })
    setShowCopyDay(false)
  }

  const hasDayData = (dayIdx: number) => {
    return (resolvedPeriods[dayIdx] || []).some((s: any) => s?.subjectId)
  }

  return (
    <div>
      {/* Class + Section selector + Period config */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            {isBn ? 'শ্রেণি নির্বাচন' : 'Select Class'}
          </div>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value)
              setSelectedSection('')
              setEditSlot(null)
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {isBn ? c.nameBn : c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            {isBn ? 'সেকশন' : 'Section'}
          </div>
          <select
            value={effectiveSection}
            onChange={(e) => {
              setSelectedSection(e.target.value)
              setEditSlot(null)
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          >
            {sections.length === 0 && <option value="">{isBn ? 'কোনো সেকশন নেই' : 'No sections'}</option>}
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>
                {isBn ? 'সেকশন' : 'Section'} {s.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            {isBn ? 'পিরিয়ড সময়কাল' : 'Period Duration'}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {[30, 35, 40, 45, 50, 60].map((d) => (
              <button
                key={d}
                onClick={() => handlePeriodDurationChange(d)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {d}m
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={showCustomDuration}
              onChange={(e) => setShowCustomDuration(e.target.checked)}
              style={{ width: '14px', height: '14px', accentColor: 'var(--purple)' }}
            />
            {isBn ? 'কাস্টম সময় সেট করুন' : 'Set custom time'}
          </label>
          {(() => {
            const [sh, sm] = startTime.split(':').map(Number)
            const [eh, em] = (cls?.endTime || institution.endTime || '14:30').split(':').map(Number)
            const totalMin = eh * 60 + em - (sh * 60 + sm)
            const usedMin = periodDurations.slice(0, totalPeriods).reduce((sum: number, d: number) => sum + d, 0)
            const remainder = totalMin - usedMin
            return (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{isBn ? `মোট ${usedMin} মিনিট` : `Total ${usedMin} min`}</span>
                {remainder > 0 && (
                  <span style={{ color: 'var(--amber)', fontWeight: 500 }}>
                    · {isBn ? `বাকি ${remainder} মিনিট` : `${remainder} min left`}
                  </span>
                )}
                {remainder < 0 && (
                  <span style={{ color: 'var(--red)', fontWeight: 500 }}>
                    · {isBn ? `${Math.abs(remainder)} মিনিট বেশি` : `${Math.abs(remainder)} min over`}
                  </span>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Custom period durations */}
      {showCustomDuration && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            {isBn ? 'প্রতি পিরিয়ডে সময় সেট করুন' : 'Set time per period'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px' }}>
            {Array.from({ length: totalPeriods }, (_, i) => {
              const time = getPeriodTime(i)
              const dur = periodDurations[i] || defaultDuration
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--purple)', minWidth: '20px' }}>P{i + 1}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', minWidth: '75px' }}>{time.start}-{time.end}</span>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={dur}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || defaultDuration
                        handlePeriodDurationUpdate(i, Math.max(10, Math.min(120, val)))
                      }}
                      style={{
                        width: '44px',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>min</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Download button */}
      {resolvedPeriods.some((day: any) => day?.some((slot: any) => slot?.subjectId)) && (
        <div style={{ marginBottom: '14px' }}>
          <button
            onClick={() => {
              const clsObj = classes.find((c) => c.id === selectedClass)
              const secObj = clsObj?.sections.find((s: any) => s.id === effectiveSection)
              const secName = secObj?.name || ''

              const gridRows = activeDays
                .map((d) => {
                  const cells = Array.from({ length: totalPeriods }, (_, p) => {
                    const slot = resolvedPeriods[d.index]?.[p]
                    const time = getPeriodTime(p)
                    if (slot?.subjectId) {
                      return `<td style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;vertical-align:middle">
                    <div style="font-size:9px;color:#8b5cf6;font-weight:600;margin-bottom:3px">P${p + 1} · ${time.start}</div>
                    <div style="font-size:11px;font-weight:600;color:#1a1a1a;margin-bottom:2px">${getSubjectName(slot.subjectId)}</div>
                    <div style="font-size:9px;color:#6b7280">${slot.teacherName || getTeacherName(slot.teacherId)}</div>
                  </td>`
                    }
                    return `<td style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;vertical-align:middle"><span style="font-size:10px;color:#d1d5db">—</span></td>`
                  }).join('')
                  return `<tr>
                <td style="padding:10px 14px;font-weight:600;font-size:12px;text-align:center;white-space:nowrap;border:1px solid #e5e7eb;background:#f9fafb">${isBn ? d.nameBn : d.name}</td>
                ${cells}
              </tr>`
                })
                .join('')

              const headerCells = Array.from({ length: totalPeriods }, (_, p) => {
                const time = getPeriodTime(p)
                const breakAfter = breakPositions.filter((b: any) => b.afterPeriod === p)
                const breakLabel = breakAfter.map((b: any) => `${isBn ? 'বিরতি' : 'Break'} ${b.start}-${b.end}`).join(', ')
                return `<th style="padding:8px 6px;font-size:10px;font-weight:600;text-align:center;border:1px solid #e5e7eb;background:#f3f4f6;min-width:100px">P${p + 1}<br/><span style="font-weight:400;color:#6b7280">${time.start}</span>${breakLabel ? `<br/><span style="font-weight:400;color:#d97706;font-size:8px">${breakLabel}</span>` : ''}</th>`
              }).join('')

              const breaksInfo = (institution.breaks || []).length > 0
                ? `<div style="margin-top:12px;padding:8px 12px;background:#fef3c7;border:1px solid #fbbf24;border-radius:6px;font-size:9px;color:#92400e"><strong>${isBn ? 'বিরতির সময়:' : 'Break Times:'}</strong> ${(institution.breaks || []).map((b: any) => `${b.label}: ${b.start} - ${b.end}`).join(' · ')}</div>`
                : ''

              const usedMin = periodDurations.slice(0, totalPeriods).reduce((sum: number, d: number) => sum + d, 0)

              const win = window.open('', '_blank')
              if (!win) return
              win.document.write(`<!DOCTYPE html><html><head><title>Routine - ${clsObj?.name} ${secName}</title>
<style>
  @page{size:A4 landscape;margin:8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI','Arial',sans-serif;color:#1a1a1a;background:#fff;padding:20px}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #6366f1">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">ET</div>
      <div>
        <div style="font-size:16px;font-weight:700;color:#6366f1">EduTech School Management</div>
        <div style="font-size:10px;color:#6b7280">${institution?.address || ''}</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;font-weight:600;color:#1a1a1a">${clsObj?.name || ''} — ${isBn ? 'সেকশন' : 'Section'} ${secName}</div>
      <div style="font-size:10px;color:#6b7280">${isBn ? 'পিরিয়ড' : 'Periods'}: ${totalPeriods} · ${usedMin} ${isBn ? 'মিনিট মোট' : 'min total'} · Generated: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb">
    <thead><tr><th style="padding:8px 12px;font-size:10px;font-weight:600;text-align:center;border:1px solid #e5e7eb;background:#f3f4f6;min-width:80px">${isBn ? 'দিন' : 'Day'}</th>${headerCells}</tr></thead>
    <tbody>${gridRows}</tbody>
  </table>
  ${breaksInfo}
  <div style="margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between">
    <div style="font-size:9px;color:#9ca3af">EduTech School Management System</div>
    <div style="font-size:9px;color:#9ca3af">${isBn ? 'মুদ্রণের তারিখ' : 'Printed'}: ${new Date().toLocaleDateString()}</div>
  </div>
</body></html>`)
              win.document.close()
              setTimeout(() => win.print(), 600)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'var(--brand)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            }}
          >
            <Download size={15} />
            {isBn ? 'রুটিন ডাউনলোড' : 'Download Routine'}
          </button>
        </div>
      )}

      {/* Edit slot modal */}
      {editSlot && (
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--purple)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '14px',
            boxShadow: '0 8px 24px rgba(139,92,246,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'var(--purple-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={14} style={{ color: 'var(--purple)' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isBn ? DAYS_BN[editSlot.day] : DAYS[editSlot.day]}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {isBn ? 'পিরিয়ড' : 'Period'} {editSlot.period + 1} · {getPeriodTime(editSlot.period).start} -{' '}
                  {getPeriodTime(editSlot.period).end}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditSlot(null)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <BookOpen size={12} style={{ color: 'var(--purple)' }} />
                {isBn ? 'বিষয় নির্বাচন' : 'Select Subject'}
              </label>
              <select
                value={slotForm.subjectId}
                onChange={(e) => setSlotForm((p) => ({ ...p, subjectId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">{isBn ? 'বিষয় বাছুন' : 'Choose subject'}</option>
                {(() => {
                  const currentSection = cls?.sections?.find((s: any) => s.id === effectiveSection)
                  const sectionSubjectIds = currentSection?.subjectIds || []
                  if (sectionSubjectIds.length === 0) {
                    const classSubjectIds = [...new Set(cls?.sections?.flatMap((s: any) => s.subjectIds || []) || [])]
                    if (classSubjectIds.length === 0)
                      return subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {isBn ? s.nameBn : s.name}
                        </option>
                      ))
                    return subjects
                      .filter((s) => classSubjectIds.includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {isBn ? s.nameBn : s.name}
                        </option>
                      ))
                  }
                  return subjects
                    .filter((s) => sectionSubjectIds.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {isBn ? s.nameBn : s.name}
                      </option>
                    ))
                })()}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Users size={12} style={{ color: 'var(--purple)' }} />
                {isBn ? 'শিক্ষক নির্বাচন' : 'Select Teacher'}
              </label>
              <select
                value={slotForm.teacherId}
                onChange={(e) => setSlotForm((p) => ({ ...p, teacherId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">{isBn ? 'শিক্ষক বাছুন' : 'Choose teacher'}</option>
                {(() => {
                  const active = teachers.filter((t) => t.status === 'active')
                  if (!slotForm.subjectId)
                    return active.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameEn} — {t.designation || ''}
                      </option>
                    ))
                  const related = active.filter((t) => t.subjectIds.includes(slotForm.subjectId))
                  const others = active.filter((t) => !t.subjectIds.includes(slotForm.subjectId))
                  return [
                    related.length > 0 && (
                      <optgroup key="related" label={isBn ? '★ সুপারিশকৃত' : '★ Recommended'}>
                        {related.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameEn} — {t.designation || ''}
                          </option>
                        ))}
                      </optgroup>
                    ),
                    others.length > 0 && (
                      <optgroup key="others" label={isBn ? 'অন্যান্য' : 'Others'}>
                        {others.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameEn} — {t.designation || ''}
                          </option>
                        ))}
                      </optgroup>
                    ),
                  ]
                })()}
              </select>
            </div>
          </div>

          {/* Preview */}
          {slotForm.subjectId && slotForm.teacherId && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--purple-light)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Check size={16} style={{ color: 'var(--purple)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)' }}>{getSubjectName(slotForm.subjectId)}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{getTeacherName(slotForm.teacherId)}</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                clearRoutineSlot(selectedClass, editSlot.day, editSlot.period, effectiveSection)
                setEditSlot(null)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              {isBn ? 'মুছুন' : 'Clear'}
            </button>
            <button
              onClick={handleSaveSlot}
              disabled={!slotForm.subjectId}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: slotForm.subjectId ? 'var(--purple)' : 'var(--border-2)',
                border: 'none',
                color: slotForm.subjectId ? '#fff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: slotForm.subjectId ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Save size={13} />
              {isBn ? 'সেভ করুন' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Routine grid */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
                {isBn ? 'সাপ্তাহিক ছুটি দিন' : 'Weekend Days'}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {DAYS.map((d, i) => {
                  const isWeekend = weekendDays.includes(i)
                  return (
                    <button
                      key={d}
                      onClick={() => toggleWeekend(i)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${isWeekend ? 'var(--red)' : 'var(--border)'}`,
                        background: isWeekend ? 'var(--red-light)' : 'var(--bg-primary)',
                        color: isWeekend ? 'var(--red)' : 'var(--text-secondary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: isWeekend ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isBn ? DAYS_BN[i] : d}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={() => setShowCopyDay(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '7px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand)'
                e.currentTarget.style.color = 'var(--brand)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <Copy size={12} />
              {isBn ? 'দিন কপি' : 'Copy Day'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th
                  style={{
                    padding: '10px 8px',
                    width: '80px',
                    textAlign: 'left',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    left: 0,
                    background: 'var(--bg-secondary)',
                    zIndex: 1,
                  }}
                >
                  {isBn ? 'সময়' : 'Time'}
                </th>
                {activeDays.map((d) => (
                  <th
                    key={d.index}
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      minWidth: '120px',
                    }}
                  >
                    {isBn ? d.nameBn : d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalPeriods }, (_, p) => {
                const time = getPeriodTime(p)
                const breakAfter = breakPositions.filter((b: any) => b.afterPeriod === p)
                return (
                  <Fragment key={p}>
                    <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <td
                        style={{
                          padding: '8px',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          position: 'sticky',
                          left: 0,
                          background: 'var(--bg-primary)',
                          zIndex: 1,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>P{p + 1}</div>
                        <div>{time.start}</div>
                        <div>{time.end}</div>
                      </td>
                      {activeDays.map((d) => {
                      const slot = resolvedPeriods[d.index]?.[p]
                        const hasSubject = slot?.subjectId
                        return (
                          <td key={d.index} style={{ padding: '4px', textAlign: 'center', verticalAlign: 'top' }}>
                            <button
                              onClick={() => {
                                setEditSlot({ day: d.index, period: p })
                                setSlotForm({ subjectId: slot?.subjectId || '', teacherId: slot?.teacherId || '' })
                              }}
                              style={{
                                width: '100%',
                                minHeight: '48px',
                                padding: '6px',
                                borderRadius: '6px',
                                border: `1px solid ${hasSubject ? 'var(--purple)' : 'var(--border)'}`,
                                background: hasSubject ? 'var(--purple-light)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                textAlign: 'center',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--purple)'
                                e.currentTarget.style.transform = 'scale(1.02)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = hasSubject ? 'var(--purple)' : 'var(--border)'
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                            >
                              {hasSubject ? (
                                <>
                                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--purple)', lineHeight: 1.2 }}>
                                    {getSubjectName(slot.subjectId)}
                                  </div>
                                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                                    {slot.teacherName || getTeacherName(slot.teacherId)}
                                  </div>
                                </>
                              ) : (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+</span>
                              )}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                    {breakAfter.map((brk: any) => (
                      <tr key={`break-${brk.id}`} style={{ borderBottom: '0.5px solid var(--border)' }}>
                        <td
                          style={{
                            padding: '8px',
                            fontSize: '10px',
                            color: 'var(--amber)',
                            position: 'sticky',
                            left: 0,
                            background: 'var(--bg-primary)',
                            zIndex: 1,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{isBn ? 'বিরতি' : 'Break'}</div>
                          <div>{brk.start}</div>
                          <div>{brk.end}</div>
                        </td>
                        {activeDays.map((d) => (
                          <td
                            key={d.index}
                            colSpan={1}
                            style={{
                              padding: '4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px dashed var(--amber)',
                                background: 'var(--amber-light)',
                                fontSize: '10px',
                                fontWeight: 600,
                                color: 'var(--amber)',
                              }}
                            >
                              {brk.label}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copy Day Modal */}
      {showCopyDay && (
        <div
          onClick={() => setShowCopyDay(false)}
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
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '380px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--brand-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Copy size={16} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {isBn ? 'দিন কপি করুন' : 'Copy Day Routine'}
                  </h3>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {isBn ? 'একটি দিনের রুটিন অন্য দিনে কপি করুন' : 'Copy one day routine to another'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCopyDay(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
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
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    {isBn ? 'কোন দিন থেকে' : 'From Day'}
                  </label>
                  <select
                    value={copyFrom}
                    onChange={(e) => setCopyFrom(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 11px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                    }}
                  >
                    {DAYS.map((d, i) => (
                      <option key={i} value={i}>
                        {isBn ? DAYS_BN[i] : d}
                        {!hasDayData(i) ? ` (${isBn ? 'খালি' : 'empty'})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginTop: '18px', color: 'var(--text-muted)' }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    {isBn ? 'কোন দিনে' : 'To Day'}
                  </label>
                  <select
                    value={copyTo}
                    onChange={(e) => setCopyTo(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 11px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                    }}
                  >
                    {DAYS.map((d, i) => (
                      <option key={i} value={i}>
                        {isBn ? DAYS_BN[i] : d}
                        {hasDayData(i) ? ` (${isBn ? 'আছে' : 'has data'})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {copyFrom === copyTo && (
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--amber-light)',
                    border: '1px solid var(--amber)',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: 500 }}>
                    {isBn ? 'উৎস এবং গন্তব্য একই দিন হতে হবে না' : 'Source and destination must be different days'}
                  </span>
                </div>
              )}

              {copyFrom !== copyTo && hasDayData(copyFrom) && (
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    {isBn ? 'পূর্বরূপ' : 'Preview'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{isBn ? DAYS_BN[copyFrom] : DAYS[copyFrom]}</span>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{isBn ? DAYS_BN[copyTo] : DAYS[copyTo]}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {(resolvedPeriods[copyFrom] || []).filter((s: any) => s?.subjectId).length}{' '}
                      {isBn ? 'টি পিরিয়ড কপি হবে' : 'periods will copy'}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowCopyDay(false)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleCopyDay}
                  disabled={copyFrom === copyTo || !hasDayData(copyFrom)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: copyFrom !== copyTo && hasDayData(copyFrom) ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    background: copyFrom !== copyTo && hasDayData(copyFrom) ? 'var(--brand)' : 'var(--border)',
                  }}
                >
                  <Copy size={13} />
                  {isBn ? 'কপি করুন' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
