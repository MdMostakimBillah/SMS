import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, BookOpen, Settings, Save, CheckCircle, Lock, Unlock, Loader, Users, AlertTriangle, ChevronRight, Pencil, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'

import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'
import type { SubjectMarkConfig } from '@/store/examStore'
import { sectionCls, sectionTitleCls, inputCls } from '@/lib/styles'

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-[#10b981] text-white',
  A: 'bg-[#34d399] text-white',
  'A-': 'bg-[#6ee7b7] text-[#065f46]',
  B: 'bg-[#60a5fa] text-white',
  C: 'bg-[#fbbf24] text-[#78350f]',
  D: 'bg-[#f97316] text-white',
  F: 'bg-[#ef4444] text-white',
}

type SubTab = 'structure' | 'entry' | 'publish'

export default function Step3Evaluation() {
  const navigate = useNavigate()
  const subjects = useTeacherStore((s) => s.subjects)
  const { classes } = useClassStore()
  const currentSession = useClassStore((s) => s.institution.currentSession)
  const students = useSessionStudents()
  const isBn = useBn()

  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const examConfigs = useMemo(() => allExamConfigs.filter((e) => e.session === currentSession), [allExamConfigs, currentSession])
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const studentMarks = useExamStore((s) => s.studentMarks)
  const marksEntryStatuses = useExamStore((s) => s.marksEntryStatuses)

  const sessionExamIds = useMemo(() => new Set(examConfigs.map((e) => e.id)), [examConfigs])
  const sessionSubjectMarkConfigs = useMemo(() => subjectMarkConfigs.filter((s) => sessionExamIds.has(s.examId)), [subjectMarkConfigs, sessionExamIds])
  const sessionStudentMarks = useMemo(() => studentMarks.filter((m) => sessionExamIds.has(m.examId)), [studentMarks, sessionExamIds])
  const sessionMarksEntryStatuses = useMemo(() => marksEntryStatuses.filter((m) => sessionExamIds.has(m.examId)), [marksEntryStatuses, sessionExamIds])
  const saveBulkStudentMarks = useExamStore((s) => s.saveBulkStudentMarks)
  const upsertSubjectMarkConfig = useExamStore((s) => s.upsertSubjectMarkConfig)
  const lockMarks = useExamStore((s) => s.lockMarks)
  const unlockMarks = useExamStore((s) => s.unlockMarks)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('entry')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find((e) => e.isActive)?.id || '')
  const selectedExam = useMemo(() => examConfigs.find((e) => e.id === selectedExamId) || null, [examConfigs, selectedExamId])

  // Structure tab state
  const [structClassId, setStructClassId] = useState('')
  const [structSectionId, setStructSectionId] = useState('')
  const [editingStructId, setEditingStructId] = useState<string | null>(null)
  const [structEditForm, setStructEditForm] = useState<{ subExams: { id: string; name: string; nameBn: string; fullMarks: string; passMarks: string }[] } | null>(null)

  // Marks Entry
  const [entryExamId] = useState(selectedExamId)
  const [entryClassId, setEntryClassId] = useState('')
  const [entrySectionId, setEntrySectionId] = useState('')
  const [entrySubjectId, setEntrySubjectId] = useState('')
  const [markInputs, setMarkInputs] = useState<Record<string, Record<string, number>>>({})
  const [markErrors, setMarkErrors] = useState<Record<string, Record<string, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (entryClassId ? sectionsMap[entryClassId] || [] : []), [entryClassId, sectionsMap])

  const classStudents = useMemo(() => {
    if (!entryClassId || !entrySectionId) return []
    return students.filter((s) => s.status === 'approved' && s.class === entryClassId && s.section === entrySectionId)
  }, [students, entryClassId, entrySectionId])

  const structConfigs = useMemo(() => {
    if (!selectedExamId || !structClassId) return []
    const allConfigs = sessionSubjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === structClassId)
    if (!structSectionId) return allConfigs
    // Filter by section: find section's subjectIds
    const cls = classes.find((c) => c.name === structClassId)
    const section = cls?.sections.find((s) => s.name === structSectionId)
    if (!section || !section.subjectIds || section.subjectIds.length === 0) return allConfigs
    return allConfigs.filter((c) => section.subjectIds!.includes(c.subjectId))
  }, [sessionSubjectMarkConfigs, selectedExamId, structClassId, structSectionId, classes])

  const entrySubjectConfig = useMemo(() => {
    if (!entryExamId || !entrySubjectId || !entryClassId) return null
    return sessionSubjectMarkConfigs.find((s) => s.examId === entryExamId && s.classId === entryClassId && s.subjectId === entrySubjectId)
  }, [sessionSubjectMarkConfigs, entryExamId, entrySubjectId, entryClassId])

  const prevInputsRef = useRef<Record<string, Record<string, number>>>({})

  useEffect(() => {
    if (!entryExamId || !entryClassId || !entrySectionId || !entrySubjectId) {
      if (Object.keys(prevInputsRef.current).length > 0) {
        prevInputsRef.current = {}
        setMarkInputs({})
      }
      return
    }
    const inputs: Record<string, Record<string, number>> = {}
    classStudents.forEach((s) => {
      const existing = sessionStudentMarks.find(
        (m) =>
          m.examId === entryExamId &&
          m.studentId === s.id &&
          m.subjectId === entrySubjectId &&
          m.classId === entryClassId &&
          m.sectionId === entrySectionId
      )
      inputs[s.id] = existing?.subExamMarks || {}
    })
    if (JSON.stringify(inputs) !== JSON.stringify(prevInputsRef.current)) {
      prevInputsRef.current = inputs
      setMarkInputs(inputs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryExamId, entryClassId, entrySectionId, entrySubjectId])

  const handleMarkChange = useCallback((studentId: string, subExamId: string, value: string, maxMarks: number) => {
    const digits = value.replace(/\D/g, '')
    if (digits === '') {
      setMarkInputs((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: 0 } }))
      setMarkErrors((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: false } }))
      return
    }
    const maxDigits = String(maxMarks).length
    let truncated = digits.slice(0, maxDigits)
    let num = Number(truncated)
    while (num > maxMarks && truncated.length > 1) {
      truncated = truncated.slice(0, -1)
      num = Number(truncated)
    }
    const hasError = num > maxMarks || digits.length > maxDigits
    setMarkInputs((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: num } }))
    setMarkErrors((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: hasError } }))
  }, [])

  useEffect(() => {
    if (!entryExamId || !entryClassId || !entrySectionId || !entrySubjectId || !entrySubjectConfig) return
    const hasChanges = Object.keys(markInputs).some((sid) => {
      const marks = markInputs[sid]
      return marks && Object.keys(marks).length > 0
    })
    if (!hasChanges) return
    const timer = setTimeout(() => {
      const marksToSave = classStudents
        .map((s) => ({
          examId: entryExamId,
          studentId: s.id,
          subjectId: entrySubjectId,
          classId: entryClassId,
          sectionId: entrySectionId,
          subExamMarks: markInputs[s.id] || {},
          totalMarks: Object.values(markInputs[s.id] || {}).reduce((a, b) => a + b, 0),
          enteredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        .filter((m) => Object.keys(m.subExamMarks).length > 0)
      if (marksToSave.length > 0) {
        saveBulkStudentMarks(marksToSave)
        setSaving(true)
        setTimeout(() => {
          setSaving(false)
          setLastSaved(new Date().toLocaleTimeString())
        }, 600)
      }
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markInputs, entryExamId, entryClassId, entrySectionId, entrySubjectId, entrySubjectConfig])

  // Entry status summary
  const entryStatusSummary = useMemo(() => {
    const filtered = selectedExamId ? sessionMarksEntryStatuses.filter((m) => m.examId === selectedExamId) : sessionMarksEntryStatuses
    const completed = filtered.filter((m) => m.status === 'completed').length
    const inProgress = filtered.filter((m) => m.status === 'in-progress').length
    const pending = filtered.filter((m) => m.status === 'pending').length
    const locked = filtered.filter((m) => m.status === 'locked').length
    return { total: filtered.length, completed, inProgress, pending, locked }
  }, [sessionMarksEntryStatuses, selectedExamId])

  // Structure tab: check if config is locked
  const isConfigLocked = useCallback((config: SubjectMarkConfig) => {
    return sessionMarksEntryStatuses.some(
      (m) => m.examId === config.examId && m.classId === config.classId && m.subjectId === config.subjectId && m.status === 'locked'
    )
  }, [sessionMarksEntryStatuses])

  const handleStartEditStruct = (config: SubjectMarkConfig) => {
    setEditingStructId(config.id)
    setStructEditForm({
      subExams: config.subExams.map((se) => ({
        id: se.id,
        name: se.name,
        nameBn: se.nameBn,
        fullMarks: String(se.fullMarks),
        passMarks: String(se.passMarks),
      })),
    })
  }

  const handleSaveStruct = (config: SubjectMarkConfig) => {
    if (!structEditForm) return
    const totalFull = structEditForm.subExams.reduce((sum, se) => sum + (Number(se.fullMarks) || 0), 0)
    const totalPass = structEditForm.subExams.reduce((sum, se) => sum + (Number(se.passMarks) || 0), 0)
    upsertSubjectMarkConfig({
      examId: config.examId,
      classId: config.classId,
      subjectId: config.subjectId,
      fullMarks: totalFull,
      passMarks: totalPass,
      subExams: structEditForm.subExams.map((se) => ({
        id: se.id,
        name: se.name,
        nameBn: se.nameBn,
        fullMarks: Number(se.fullMarks) || 0,
        passMarks: Number(se.passMarks) || 0,
      })),
    })
    setEditingStructId(null)
    setStructEditForm(null)
  }

  const handleCancelEditStruct = () => {
    setEditingStructId(null)
    setStructEditForm(null)
  }

  const handleToggleLockStruct = (config: SubjectMarkConfig) => {
    const locked = isConfigLocked(config)
    if (locked) {
      unlockMarks(config.examId, config.classId, '', config.subjectId)
    } else {
      // Create or update marksEntryStatus for each section
      const sections = classes.find((c) => c.name === config.classId)?.sections || []
      if (sections.length === 0) {
        lockMarks(config.examId, config.classId, '', config.subjectId)
      } else {
        sections.forEach((sec) => {
          lockMarks(config.examId, config.classId, sec.name, config.subjectId)
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exams')}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[1rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'ধাপ ৩: মূল্যায়ন ও মার্কস' : 'Step 3: Evaluation & Marks'}
            </h1>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">
              {isBn ? 'মার্কস এন্ট্রি, রিভিউ ও প্রকাশ' : 'Marks entry, review & publish'}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Selector */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <select
          value={selectedExamId || entryExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value)
          }}
          className={`${inputCls} max-w-[18.75rem]`}
        >
          <option value="">{isBn ? 'সকল পরীক্ষা' : 'All Exams'}</option>
          {examConfigs.map((e) => (
            <option key={e.id} value={e.id}>
              {isBn ? e.nameBn : e.name} {e.isActive ? '(Active)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Status Summary */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-3 overflow-x-auto">
        {[
          { label: isBn ? 'সম্পন্ন' : 'Completed', value: entryStatusSummary.completed, color: 'var(--green)' },
          { label: isBn ? 'চলমান' : 'In Progress', value: entryStatusSummary.inProgress, color: 'var(--amber)' },
          { label: isBn ? 'অপেক্ষমান' : 'Pending', value: entryStatusSummary.pending, color: 'var(--text-muted)' },
          { label: isBn ? 'লক' : 'Locked', value: entryStatusSummary.locked, color: 'var(--red)' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[0.6875rem] whitespace-nowrap">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-[var(--text-muted)]">{s.label}:</span>
            <span className="font-semibold text-[var(--text-primary)]">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {[
          { key: 'structure' as SubTab, label: isBn ? 'মার্কস স্ট্রাকচার' : 'Marks Structure', icon: <Settings size={14} /> },
          { key: 'entry' as SubTab, label: isBn ? 'মার্কস এন্ট্রি' : 'Marks Entry', icon: <Edit2 size={14} /> },
          { key: 'publish' as SubTab, label: isBn ? 'প্রকাশ/লক' : 'Publish/Lock', icon: <Lock size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeSubTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ═══ STRUCTURE TAB ═══ */}
        {activeSubTab === 'structure' && (
          <>
            {/* Class & Section Selector */}
            <div className={`${sectionCls} !p-3 !mb-3`}>
              <div className="flex items-start gap-3">
                {/* Class chips - left side */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--brand-light)] shrink-0">
                    <Settings size={13} className="text-[var(--brand)]" />
                  </div>
                  <div className={`flex gap-1 min-w-0 ${classOptions.length >= 10 ? 'overflow-x-auto' : 'flex-wrap'}`}>
                    {classOptions.map((c) => {
                      const configCount = sessionSubjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === c).length
                      return (
                        <button
                          key={c}
                          onClick={() => { setStructClassId(c); setStructSectionId(''); setEditingStructId(null); setStructEditForm(null) }}
                          className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium cursor-pointer border transition-all whitespace-nowrap shrink-0 ${
                            structClassId === c
                              ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                              : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                          }`}
                        >
                          {isBn ? classes.find((cl) => cl.name === c)?.nameBn || c : c}
                          <span className="ml-0.5 opacity-60">({configCount})</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Section chips - right side */}
                {structClassId && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-px h-4 bg-[var(--border)]" />
                    <span className="text-[0.75rem] font-semibold text-[var(--text-primary)] shrink-0">
                      {isBn ? 'সেকশন' : 'Section'}
                    </span>
                    <div className={`flex gap-1 ${(sectionsMap[structClassId] || []).length >= 5 ? 'overflow-x-auto max-w-[18.75rem]' : 'flex-wrap'}`}>
                      <button
                        onClick={() => { setStructSectionId(''); setEditingStructId(null); setStructEditForm(null) }}
                        className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium cursor-pointer border transition-all whitespace-nowrap shrink-0 ${
                          structSectionId === ''
                            ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                            : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                        }`}
                      >
                        {isBn ? 'সকল' : 'All'}
                      </button>
                      {(sectionsMap[structClassId] || []).map((sec) => (
                        <button
                          key={sec}
                          onClick={() => { setStructSectionId(sec); setEditingStructId(null); setStructEditForm(null) }}
                          className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium cursor-pointer border transition-all whitespace-nowrap shrink-0 ${
                            structSectionId === sec
                              ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                              : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                          }`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subject Cards */}
            {structClassId && (
              <div className="space-y-3">
                {structConfigs.length === 0 && (
                  <div className={`${sectionCls} text-center py-8`}>
                    <BookOpen size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
                    <p className="text-[0.8125rem] text-[var(--text-muted)]">
                      {isBn ? 'এই শ্রেণিতে কোনো বিষয় কনফিগার করা হয়নি' : 'No subjects configured for this class in Step 1'}
                    </p>
                    <p className="text-[0.6875rem] text-[var(--text-muted)] opacity-60 mt-1">
                      {isBn ? 'ধাপ ১ এ গিয়ে বিষয় কনফিগার করুন' : 'Go to Step 1 to configure subjects'}
                    </p>
                  </div>
                )}

                {structConfigs.map((config, configIdx) => {
                  const subject = subjects.find((s) => s.id === config.subjectId)
                  const locked = isConfigLocked(config)
                  const isEditing = editingStructId === config.id
                  const form = isEditing ? structEditForm : null

                  return (
                    <div
                      key={config.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        locked
                          ? 'border-[var(--red)]/20 bg-[var(--bg-primary)]'
                          : isEditing
                            ? 'border-[var(--brand)]/30 bg-[var(--bg-primary)] shadow-sm ring-1 ring-[var(--brand)]/10'
                            : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)]/20'
                      }`}
                    >
                      {/* Subject Header */}
                      <div className={`flex items-center justify-between px-4 py-3 ${
                        locked ? 'bg-[var(--red-light)]' : isEditing ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-secondary)]'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-[0.6875rem] font-bold ${
                            locked ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--brand-light)] text-[var(--brand)]'
                          }`}>
                            {configIdx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                                {isBn ? subject?.nameBn || subject?.name : subject?.name}
                              </span>
                              {locked && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5rem] font-semibold bg-[var(--red-light)] text-[var(--red)]">
                                  <Lock size={8} />
                                  {isBn ? 'লকড' : 'LOCKED'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[0.625rem] text-[var(--text-muted)]">
                                {isBn ? 'পূর্ণমান' : 'Full'}: <span className="font-semibold text-[var(--text-secondary)]">{config.fullMarks}</span>
                              </span>
                              <span className="text-[0.5rem] text-[var(--text-muted)]">·</span>
                              <span className="text-[0.625rem] text-[var(--text-muted)]">
                                {isBn ? 'পাসমান' : 'Pass'}: <span className="font-semibold text-[var(--text-secondary)]">{config.passMarks}</span>
                              </span>
                              {config.subExams.length > 0 && (
                                <>
                                  <span className="text-[0.5rem] text-[var(--text-muted)]">·</span>
                                  <span className="text-[0.625rem] text-[var(--text-muted)]">
                                    {config.subExams.length} {isBn ? 'টি সাব-এক্সাম' : 'sub-exams'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!locked && (
                            isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveStruct(config)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--green)] text-white text-[0.6875rem] font-medium cursor-pointer border-none hover:opacity-90 transition-all"
                                >
                                  <Save size={12} />
                                  {isBn ? 'সেভ' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEditStruct}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[0.6875rem] font-medium cursor-pointer border border-[var(--border)] hover:border-[var(--text-muted)] transition-all"
                                >
                                  <X size={12} />
                                  {isBn ? 'বাতিল' : 'Cancel'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleStartEditStruct(config)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer border border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
                              >
                                <Pencil size={12} />
                                {isBn ? 'সম্পাদনা' : 'Edit'}
                              </button>
                            )
                          )}
                          <button
                            onClick={() => handleToggleLockStruct(config)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium cursor-pointer border-none transition-all ${
                              locked
                                ? 'bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)]/15'
                                : 'bg-[var(--amber-light)] text-[var(--amber)] hover:bg-[var(--amber)]/15'
                            }`}
                          >
                            {locked ? <Unlock size={12} /> : <Lock size={12} />}
                            {locked ? (isBn ? 'আনলক' : 'Unlock') : (isBn ? 'লক' : 'Lock')}
                          </button>
                        </div>
                      </div>

                      {/* Sub-exams */}
                      <div className="px-4 py-3">
                        {config.subExams.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {config.subExams.map((se, idx) => (
                              <div
                                key={se.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                  locked
                                    ? 'bg-[var(--bg-secondary)] border-[var(--border)]/60'
                                    : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--brand)]/20'
                                }`}
                              >
                                <div className={`flex items-center justify-center w-7 h-7 rounded-md text-[0.625rem] font-bold ${
                                  locked ? 'bg-[var(--border)] text-[var(--text-muted)]' : 'bg-[var(--brand-light)] text-[var(--brand)]'
                                }`}>
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                                    {isBn ? se.nameBn : se.name}
                                  </div>
                                  {isEditing && form && !locked ? (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <input
                                        type="number"
                                        value={form.subExams[idx]?.fullMarks || ''}
                                        onChange={(e) => {
                                          const newSubExams = [...form.subExams]
                                          newSubExams[idx] = { ...newSubExams[idx], fullMarks: e.target.value }
                                          setStructEditForm({ ...form, subExams: newSubExams })
                                        }}
                                        className="w-14 h-7 px-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.6875rem] text-center outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition-all"
                                        placeholder={isBn ? 'পূর্ণ' : 'Full'}
                                      />
                                      <span className="text-[0.625rem] text-[var(--text-muted)] font-medium">/</span>
                                      <input
                                        type="number"
                                        value={form.subExams[idx]?.passMarks || ''}
                                        onChange={(e) => {
                                          const newSubExams = [...form.subExams]
                                          newSubExams[idx] = { ...newSubExams[idx], passMarks: e.target.value }
                                          setStructEditForm({ ...form, subExams: newSubExams })
                                        }}
                                        className="w-14 h-7 px-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.6875rem] text-center outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition-all"
                                        placeholder={isBn ? 'পাস' : 'Pass'}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className={`text-[0.6875rem] font-semibold ${locked ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                                        {se.fullMarks}
                                      </span>
                                      <span className="text-[0.5rem] text-[var(--text-muted)]">/</span>
                                      <span className="text-[0.6875rem] text-[var(--text-muted)]">
                                        {isBn ? 'পাস' : 'Pass'}: {se.passMarks}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[0.6875rem] text-[var(--text-muted)] py-2 text-center">
                            {isBn ? 'কোনো সাব-এক্সাম কনফিগার করা হয়নি' : 'No sub-exams configured'}
                          </div>
                        )}

                        {/* Auto-calculated totals */}
                        {isEditing && form && !locked && (
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[0.625rem] font-medium text-[var(--text-muted)]">{isBn ? 'মোট পূর্ণমান' : 'Total Full'}:</span>
                              <span className="text-[0.75rem] font-bold text-[var(--brand)]">
                                {form.subExams.reduce((sum, se) => sum + (Number(se.fullMarks) || 0), 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[0.625rem] font-medium text-[var(--text-muted)]">{isBn ? 'মোট পাসমান' : 'Total Pass'}:</span>
                              <span className="text-[0.75rem] font-bold text-[var(--brand)]">
                                {form.subExams.reduce((sum, se) => sum + (Number(se.passMarks) || 0), 0)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Locked overlay message */}
                        {locked && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                            <Lock size={12} className="text-[var(--red)]" />
                            <span className="text-[0.6875rem] text-[var(--red)] font-medium">
                              {isBn ? 'এই বিষয়টি লক করা আছে। সম্পাদনা করতে আনলক করুন।' : 'This subject is locked. Unlock to edit.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Summary + Go to Next Step */}
                {structConfigs.length > 0 && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[0.6875rem]">
                          <div className="w-2 h-2 rounded-full bg-[var(--green)]" />
                          <span className="text-[var(--text-muted)]">{isBn ? 'লকড' : 'Locked'}:</span>
                          <span className="font-semibold text-[var(--text-primary)]">{structConfigs.filter((c) => isConfigLocked(c)).length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[0.6875rem]">
                          <div className="w-2 h-2 rounded-full bg-[var(--amber)]" />
                          <span className="text-[var(--text-muted)]">{isBn ? 'খোলা' : 'Open'}:</span>
                          <span className="font-semibold text-[var(--text-primary)]">{structConfigs.filter((c) => !isConfigLocked(c)).length}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/exams/results')}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer border-none hover:opacity-90 transition-all"
                    >
                      {isBn ? 'পরবর্তী ধাপে যান' : 'Go to Next Step'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {!structClassId && selectedExamId && (
              <div className={`${sectionCls} text-center py-8`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--bg-secondary)] mb-3">
                  <Settings size={22} className="text-[var(--text-muted)] opacity-40" />
                </div>
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'একটি শ্রেণি নির্বাচন করুন' : 'Select a class to view marks structure'}
                </p>
              </div>
            )}

            {!selectedExamId && (
              <div className={`${sectionCls} text-center py-8`}>
                <AlertTriangle size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'প্রথমে একটি পরীক্ষা নির্বাচন করুন' : 'Select an exam first'}
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══ ENTRY TAB ═══ */}
        {activeSubTab === 'entry' && (
          <>
            <div className={sectionCls}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Edit2 size={15} className="text-[var(--brand)]" />
                  <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'মার্কস এন্ট্রি' : 'Marks Entry'}</span>
                  {selectedExam && (
                    <span className="text-[0.625rem] font-medium px-2 py-0.5 rounded-md bg-[var(--brand-light)] text-[var(--brand)]">
                      {isBn ? selectedExam.nameBn : selectedExam.name}
                    </span>
                  )}
                </div>
                {!saving && lastSaved && (
                  <div className="flex items-center gap-1 text-[0.625rem] text-[var(--text-muted)]">
                    <CheckCircle size={10} className="text-[var(--green)]" />
                    {isBn ? 'সেভ হয়েছে' : 'Saved'} {lastSaved}
                  </div>
                )}
                {saving && (
                  <div className="flex items-center gap-1 text-[0.625rem] text-[var(--green)]">
                    <Loader size={10} className="animate-spin" />
                    {isBn ? 'সেভ হচ্ছে...' : 'Saving...'}
                  </div>
                )}
              </div>
              <div className="flex items-end gap-3 mt-3 flex-wrap">
                <div className="flex-1 min-w-[10rem]">
                  <label className="text-[0.625rem] font-medium text-[var(--text-muted)] mb-1 block uppercase tracking-wider">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select
                    value={entryClassId}
                    onChange={(e) => {
                      setEntryClassId(e.target.value)
                      setEntrySectionId('')
                      setEntrySubjectId('')
                    }}
                    className={`${inputCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <label className="text-[0.625rem] font-medium text-[var(--text-muted)] mb-1 block uppercase tracking-wider">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select
                    value={entrySectionId}
                    onChange={(e) => {
                      setEntrySectionId(e.target.value)
                      setEntrySubjectId('')
                    }}
                    className={`${inputCls} w-full`}
                    disabled={!entryClassId}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {sectionOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[10rem]">
                  <label className="text-[0.625rem] font-medium text-[var(--text-muted)] mb-1 block uppercase tracking-wider">{isBn ? 'বিষয়' : 'Subject'}</label>
                  <select
                    value={entrySubjectId}
                    onChange={(e) => setEntrySubjectId(e.target.value)}
                    className={`${inputCls} w-full`}
                    disabled={!entrySectionId}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {subjects
                      .filter((s) => {
                        if (!sessionSubjectMarkConfigs.some((c) => c.examId === selectedExamId && c.classId === entryClassId && c.subjectId === s.id)) return false
                        if (!entrySectionId) return true
                        const cls = classes.find((c) => c.name === entryClassId)
                        const section = cls?.sections.find((sec) => sec.name === entrySectionId)
                        if (!section || !section.subjectIds || section.subjectIds.length === 0) return true
                        return section.subjectIds.includes(s.id)
                      })
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {isBn ? s.nameBn : s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              {!saving && lastSaved && (
                <div className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-[var(--text-muted)]">
                  <CheckCircle size={12} />
                  {isBn ? `শেষ সেভ: ${lastSaved}` : `Last saved: ${lastSaved}`}
                </div>
              )}
            </div>

            {entryExamId && entryClassId && entrySectionId && entrySubjectId && entrySubjectConfig && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {classStudents.length} {isBn ? 'জন শিক্ষার্থী' : 'students'}
                    <span className="text-[0.6875rem] text-[var(--text-muted)] ml-2">
                      Full: {entrySubjectConfig.fullMarks} · Pass: {entrySubjectConfig.passMarks}
                    </span>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '2rem' }} />
                      <col style={{ width: '8.75rem' }} />
                      <col style={{ width: '3.75rem' }} />
                      {entrySubjectConfig.subExams.map((se) => (
                        <col key={se.id} style={{ width: '4.5rem' }} />
                      ))}
                      <col style={{ width: '3.75rem' }} />
                      <col style={{ width: '3.125rem' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="py-2 px-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">#</th>
                        <th className="py-2 px-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'নাম' : 'Name'}
                        </th>
                        <th className="py-2 px-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'রোল' : 'Roll'}
                        </th>
                        {entrySubjectConfig.subExams.map((se) => (
                          <th key={se.id} className="py-2 px-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                            <div>{isBn ? se.nameBn : se.name}</div>
                            <div className="font-normal text-[0.5625rem]">{isBn ? 'পূর্ণ' : 'Full'}:{se.fullMarks} / {isBn ? 'পাস' : 'Pass'}:{se.passMarks}</div>
                          </th>
                        ))}
                        <th className="py-2 px-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'মোট' : 'Total'}
                        </th>
                        <th className="py-2 px-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'গ্রেড' : 'Grade'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student, idx) => {
                        const marks = markInputs[student.id] || {}
                        const total = Object.values(marks).reduce((a, b) => a + b, 0)
                        const pct = entrySubjectConfig.fullMarks > 0 ? (total / entrySubjectConfig.fullMarks) * 100 : 0
                        const failedSubExam = entrySubjectConfig.subExams.some((se) => {
                          const obtained = marks[se.id] || 0
                          return obtained > 0 && obtained < se.passMarks
                        })
                        const failedSubExamNames = entrySubjectConfig.subExams
                          .filter((se) => {
                            const obtained = marks[se.id] || 0
                            return obtained > 0 && obtained < se.passMarks
                          })
                          .map((se) => isBn ? se.nameBn : se.name)
                        let grade = 'F'
                        if (!failedSubExam) {
                          if (pct >= 80) grade = 'A+'
                          else if (pct >= 70) grade = 'A'
                          else if (pct >= 60) grade = 'A-'
                          else if (pct >= 50) grade = 'B'
                          else if (pct >= 40) grade = 'C'
                          else if (pct >= 33) grade = 'D'
                        }
                        return (
                          <tr key={student.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                            <td className="py-2 px-2 text-[0.6875rem] text-[var(--text-muted)]">{idx + 1}</td>
                            <td className="py-2 px-2 overflow-hidden">
                              <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">
                                {isBn ? student.nameBn || student.nameEn : student.nameEn}
                              </div>
                              <div className="text-[0.5625rem] text-[var(--text-muted)] truncate">{student.id}</div>
                            </td>
                            <td className="py-2 px-2 text-[0.6875rem] text-[var(--text-secondary)]">{student.roll || '—'}</td>
                            {entrySubjectConfig.subExams.map((se) => {
                              const maxForSub = se.fullMarks
                              const hasError = markErrors[student.id]?.[se.id] || false
                              return (
                                <td key={se.id} className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={maxForSub}
                                    value={marks[se.id] || ''}
                                    onChange={(e) => handleMarkChange(student.id, se.id, e.target.value, maxForSub)}
                                    className={`w-full h-7 px-1 rounded border bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.6875rem] text-center outline-none transition-all ${hasError ? 'border-[var(--red)] bg-[var(--red-light)]' : 'border-[var(--border)] focus:border-[var(--brand)]'}`}
                                    placeholder={`${maxForSub}/${se.passMarks}`}
                                  />
                                </td>
                              )
                            })}
                            <td className="py-2 px-2 text-center">
                              <span
                                className={`text-[0.75rem] font-bold ${!failedSubExam && total >= entrySubjectConfig.passMarks ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}
                              >
                                {total}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span
                                  className={`text-[0.625rem] py-[0.125rem] px-[0.3125rem] rounded font-medium ${GRADE_COLORS[grade] || 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}
                                >
                                  {grade}
                                </span>
                                {failedSubExamNames.length > 0 && (
                                  <span className="text-[0.5rem] text-[var(--red)] leading-tight" title={failedSubExamNames.join(', ')}>
                                    {isBn ? 'ব্যর্থ' : 'Fail'}: {failedSubExamNames.join(', ')}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {classStudents.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-muted)] text-[0.75rem]">
                    <Users size={24} className="mx-auto mb-2 opacity-30" />
                    {isBn ? 'এই সেকশনে কোনো শিক্ষার্থী নেই' : 'No students in this section'}
                  </div>
                )}
              </div>
            )}

            {entryExamId && entryClassId && entrySectionId && entrySubjectId && !entrySubjectConfig && (
              <div className={`${sectionCls} text-center py-10`}>
                <AlertTriangle size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'মার্ক ডিস্ট্রিবিউশন কনফিগার করুন' : 'Configure mark distribution for this exam & subject'}
                </p>
              </div>
            )}

            {!selectedExamId && (
              <div className={`${sectionCls} text-center py-10`}>
                <BookOpen size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'পরীক্ষা নির্বাচন করুন' : 'No active exam selected'}
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══ PUBLISH/LOCK TAB ═══ */}
        {activeSubTab === 'publish' && (
          <>
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <Lock size={15} className="text-[var(--brand)]" />
                {isBn ? 'মার্কস লক/আনলক' : 'Marks Lock/Unlock'}
              </div>
              <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
                {isBn ? 'সম্পন্ন এন্ট্রি লক করুন বা পরিবর্তনের জন্য আনলক করুন' : 'Lock completed entries or unlock for changes'}
              </p>
              <div className="space-y-2">
                {sessionMarksEntryStatuses
                  .filter((m) => (selectedExamId ? m.examId === selectedExamId : true))
                  .map((entry) => {
                    const subject = subjects.find((s) => s.id === entry.subjectId)
                    const isLocked = entry.status === 'locked'
                    const pct = entry.totalStudents > 0 ? Math.round((entry.enteredCount / entry.totalStudents) * 100) : 0
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                            {isBn ? subject?.nameBn : subject?.name} — {entry.classId} {entry.sectionId}
                          </div>
                          <div className="flex items-center gap-2 text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                            <span>
                              {entry.enteredCount}/{entry.totalStudents} entered
                            </span>
                            <div className="w-16 h-1.5 bg-[var(--border)] rounded-full">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: isLocked ? 'var(--red)' : pct === 100 ? 'var(--green)' : 'var(--amber)',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            isLocked
                              ? unlockMarks(entry.examId, entry.classId, entry.sectionId, entry.subjectId)
                              : lockMarks(entry.examId, entry.classId, entry.sectionId, entry.subjectId)
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium cursor-pointer border-none ${isLocked ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--green-light)] text-[var(--green)]'}`}
                        >
                          {isLocked ? (
                            <>
                              <Unlock size={12} />
                              {isBn ? 'আনলক' : 'Unlock'}
                            </>
                          ) : (
                            <>
                              <Lock size={12} />
                              {isBn ? 'লক' : 'Lock'}
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                {sessionMarksEntryStatuses.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-muted)] text-[0.75rem]">
                    {isBn ? 'এখনো মার্কস এন্ট্রি শুরু হয়নি' : 'No marks entry records yet'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
