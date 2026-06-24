import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, BookOpen, Settings, Save, CheckCircle, Lock, Unlock, Loader, Users, AlertTriangle, ChevronRight, Pencil, X, GraduationCap, Search } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'

import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap, extractClassNumber } from '@/store/classStore'
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
  const { isMobile, isTablet } = useWindowSize()

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
  const toggleClassPublished = useExamStore((s) => s.toggleClassPublished)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('entry')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find((e) => e.isActive)?.id || '')
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({
    activeTab: activeSubTab,
    tabRefs,
    sliderRef,
    scrollIntoView: true,
  })

  const selectedExam = useMemo(() => examConfigs.find((e) => e.id === selectedExamId) || null, [examConfigs, selectedExamId])

  // Structure tab state
  const [structClassId, setStructClassId] = useState('')
  const [structSectionId, setStructSectionId] = useState('')
  const [editingStructId, setEditingStructId] = useState<string | null>(null)
  const [structEditForm, setStructEditForm] = useState<{ subExams: { id: string; name: string; nameBn: string; fullMarks: string; passMarks: string }[] } | null>(null)

  // Marks Entry
  const [entryClassId, setEntryClassId] = useState('')
  const [entrySectionId, setEntrySectionId] = useState('')
  const [entrySubjectId, setEntrySubjectId] = useState('')
  const [markInputs, setMarkInputs] = useState<Record<string, Record<string, number>>>({})
  const [markErrors, setMarkErrors] = useState<Record<string, Record<string, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState('')

  // Publish/Lock filters
  const [publishClassId, setPublishClassId] = useState('')
  const [publishSectionId, setPublishSectionId] = useState('')

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (entryClassId ? sectionsMap[entryClassId] || [] : []), [entryClassId, sectionsMap])
  const publishSectionOptions = useMemo(() => (publishClassId ? sectionsMap[publishClassId] || [] : []), [publishClassId, sectionsMap])

  // Find matching class from the Classes store
  const publishClassData = useMemo(() => {
    if (!publishClassId) return null
    return classes.find((c) => extractClassNumber(c.name) === publishClassId || c.name === publishClassId) || null
  }, [publishClassId, classes])

  // SubjectIds for selected class+section from the Classes store
  const publishSubjectIds = useMemo(() => {
    if (!publishClassData) return []
    if (publishSectionId) {
      const section = publishClassData.sections.find((s) => s.name === publishSectionId)
      if (section && section.subjectIds && section.subjectIds.length > 0) return section.subjectIds
    }
    const allIds = new Set<string>()
    publishClassData.sections.forEach((sec) => (sec.subjectIds || []).forEach((id) => allIds.add(id)))
    return Array.from(allIds)
  }, [publishClassData, publishSectionId])

  // Build lock/unlock rows: subjects from Classes store + status from marksEntryStatuses
  const publishRows = useMemo(() => {
    if (!publishClassData || publishSubjectIds.length === 0) return []
    return publishSubjectIds.map((subjectId) => {
      const subject = subjects.find((s) => s.id === subjectId)
      const entry = sessionMarksEntryStatuses.find(
        (m) =>
          m.examId === selectedExamId &&
          m.subjectId === subjectId &&
          m.classId === publishClassData.name &&
          (!publishSectionId || m.sectionId === publishSectionId)
      )
      return {
        subjectId,
        subjectName: subject ? (isBn ? subject.nameBn : subject.name) : subjectId,
        classId: publishClassData.name,
        sectionId: publishSectionId || '',
        isLocked: entry?.status === 'locked',
        entry,
      }
    })
  }, [publishClassData, publishSubjectIds, subjects, sessionMarksEntryStatuses, selectedExamId, publishSectionId, isBn])

  const classStudents = useMemo(() => {
    if (!entryClassId || !entrySectionId) return []
    return students.filter((s) => s.status === 'approved' && s.active !== false && s.class === entryClassId && s.section === entrySectionId)
  }, [students, entryClassId, entrySectionId])

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents
    const q = studentSearch.toLowerCase()
    return classStudents.filter((s) =>
      s.nameEn.toLowerCase().includes(q) ||
      (s.nameBn && s.nameBn.toLowerCase().includes(q)) ||
      (s.roll && s.roll.toLowerCase().includes(q)) ||
      s.id.toLowerCase().includes(q)
    )
  }, [classStudents, studentSearch])

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
    if (!selectedExamId || !entrySubjectId || !entryClassId) return null
    return sessionSubjectMarkConfigs.find((s) => s.examId === selectedExamId && s.classId === entryClassId && s.subjectId === entrySubjectId)
  }, [sessionSubjectMarkConfigs, selectedExamId, entrySubjectId, entryClassId])

  const isEntrySubjectLocked = useMemo(() => {
    if (!selectedExamId || !entryClassId || !entrySectionId || !entrySubjectId) return false
    return sessionMarksEntryStatuses.some(
      (m) => m.examId === selectedExamId && m.classId === entryClassId && m.sectionId === entrySectionId && m.subjectId === entrySubjectId && m.status === 'locked'
    )
  }, [sessionMarksEntryStatuses, selectedExamId, entryClassId, entrySectionId, entrySubjectId])

  const prevInputsRef = useRef<Record<string, Record<string, number>>>({})
  const prevContextRef = useRef('')

  useEffect(() => {
    if (!selectedExamId || !entryClassId || !entrySectionId || !entrySubjectId) {
      prevContextRef.current = ''
      prevInputsRef.current = {}
      setMarkInputs({})
      setMarkErrors({})
      return
    }
    const currentContext = `${selectedExamId}|${entryClassId}|${entrySectionId}|${entrySubjectId}`
    if (prevContextRef.current === currentContext) return
    prevContextRef.current = currentContext
    const inputs: Record<string, Record<string, number>> = {}
    classStudents.forEach((s) => {
      const existing = sessionStudentMarks.find(
        (m) =>
          m.examId === selectedExamId &&
          m.studentId === s.id &&
          m.subjectId === entrySubjectId &&
          m.classId === entryClassId &&
          m.sectionId === entrySectionId
      )
      inputs[s.id] = existing?.subExamMarks || {}
    })
    prevInputsRef.current = inputs
    setMarkInputs(inputs)
    setMarkErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId, entryClassId, entrySectionId, entrySubjectId])

  const handleMarkChange = useCallback((studentId: string, subExamId: string, value: string, maxMarks: number, totalFullMarks: number, otherSubExamSum: number) => {
    const digits = value.replace(/\D/g, '')
    if (digits === '') {
      setMarkInputs((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: 0 } }))
      setMarkErrors((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: false } }))
      return
    }
    const remainingForTotal = totalFullMarks - otherSubExamSum
    const effectiveMax = Math.min(maxMarks, remainingForTotal)
    const maxDigits = String(effectiveMax).length
    let truncated = digits.slice(0, maxDigits)
    let num = Number(truncated)
    while (num > effectiveMax && truncated.length > 1) {
      truncated = truncated.slice(0, -1)
      num = Number(truncated)
    }
    const hasError = num > effectiveMax || digits.length > maxDigits
    setMarkInputs((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: num } }))
    setMarkErrors((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: hasError } }))
  }, [])

  useEffect(() => {
    if (!selectedExamId || !entryClassId || !entrySectionId || !entrySubjectId || !entrySubjectConfig) return
    const currentContext = `${selectedExamId}|${entryClassId}|${entrySectionId}|${entrySubjectId}`
    if (prevContextRef.current !== currentContext) return
    const hasChanges = Object.keys(markInputs).some((sid) => {
      const marks = markInputs[sid]
      return marks && Object.keys(marks).length > 0
    })
    if (!hasChanges) return
    const timer = setTimeout(() => {
      const validSubIds = new Set(entrySubjectConfig.subExams.map((se) => se.id))
      const marksToSave = classStudents
        .map((s) => {
          const raw = markInputs[s.id] || {}
          const filtered: Record<string, number> = {}
          for (const [k, v] of Object.entries(raw)) {
            if (validSubIds.has(k)) filtered[k] = v
          }
          return {
            examId: selectedExamId,
            studentId: s.id,
            subjectId: entrySubjectId,
            classId: entryClassId,
            sectionId: entrySectionId,
            subExamMarks: filtered,
            totalMarks: Object.values(filtered).reduce((a, b) => a + b, 0),
            enteredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        })
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
  }, [markInputs, selectedExamId, entryClassId, entrySectionId, entrySubjectId, entrySubjectConfig])

  // Entry status summary
  const entryStatusSummary = useMemo(() => {
    const filtered = selectedExamId ? sessionMarksEntryStatuses.filter((m) => m.examId === selectedExamId) : sessionMarksEntryStatuses
    const completed = filtered.filter((m) => m.status === 'completed').length
    const inProgress = filtered.filter((m) => m.status === 'in-progress').length
    const pending = filtered.filter((m) => m.status === 'pending').length
    const locked = filtered.filter((m) => m.status === 'locked').length
    return { total: filtered.length, completed, inProgress, pending, locked }
  }, [sessionMarksEntryStatuses, selectedExamId])

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

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/exams')}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[1rem] font-bold text-[var(--text-primary)] truncate">
              {isBn ? 'ধাপ ৩: মূল্যায়ন ও মার্কস' : 'Step 3: Evaluation & Marks'}
            </h1>
            <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
              {isBn ? 'মার্কস এন্ট্রি, রিভিউ ও প্রকাশ' : 'Marks entry, review & publish'}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Selector */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <select
          value={selectedExamId}
          onChange={(e) => {
            setSelectedExamId(e.target.value)
          }}
          className={`${inputCls} max-w-[18.75rem]`}
        >
          <option value="">{isBn ? 'সকল পরীক্ষা' : 'All Exams'}</option>
          {examConfigs.map((e) => (
            <option key={e.id} value={e.id}>
              {isBn ? e.nameBn : e.name} {e.isActive ? '(Active)' : ''}{e.isPublished ? ` ${isBn ? '(প্রকাশিত)' : '(Published)'}` : ''}
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
      <div className={`relative glass rounded-xl mt-3 mb-3 w-full`}>
        <div className={`relative flex gap-[0.375rem] p-[0.3125rem] rounded-[inherit] ${isMobile || isTablet ? 'overflow-x-auto flex-nowrap' : 'flex-wrap'}`}>
          {/* Sliding indicator */}
          <div
            ref={sliderRef}
            className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] transition-all duration-300 ease-out z-0"
            style={{
              background: activeSubTab === 'structure' ? 'var(--brand)' : activeSubTab === 'entry' ? 'var(--teal)' : 'var(--purple)',
              boxShadow: activeSubTab === 'structure' ? '0 2px 8px rgba(99,102,241,0.3)' : activeSubTab === 'entry' ? '0 2px 8px rgba(20,184,166,0.3)' : '0 2px 8px rgba(168,85,247,0.3)',
            }}
          />
          {[
            { key: 'structure' as SubTab, label: isBn ? 'মার্কস স্ট্রাকচার' : 'Marks Structure', icon: <Settings size={14} /> },
            { key: 'entry' as SubTab, label: isBn ? 'মার্কস এন্ট্রি' : 'Marks Entry', icon: <Edit2 size={14} /> },
            { key: 'publish' as SubTab, label: isBn ? 'প্রকাশ/লক' : 'Publish/Lock', icon: <Lock size={14} /> },
          ].map((t) => (
            <button
              key={t.key}
              ref={(el) => { if (el) tabRefs.current.set(t.key, el) }}
              onClick={() => setActiveSubTab(t.key)}
              className={`relative z-10 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${isMobile || isTablet ? 'shrink-0' : 'flex-1'} ${
                activeSubTab === t.key ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={{ background: 'transparent' }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
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
              <div className="space-y-2">
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
                  const isEditing = editingStructId === config.id
                  const form = isEditing ? structEditForm : null

                  return (
                    <div
                      key={config.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isEditing
                          ? 'border-[var(--brand)]/30 bg-[var(--bg-primary)] ring-1 ring-[var(--brand)]/10'
                          : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)]/20'
                      }`}
                    >
                      {/* Subject Header */}
                      <div className={`flex items-center justify-between px-4 py-3 ${
                        isEditing ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-secondary)]'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[0.6875rem] font-bold text-[var(--brand)]">
                            {configIdx + 1}
                          </div>
                          <div>
                            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                              {isBn ? subject?.nameBn || subject?.name : subject?.name}
                            </span>
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
                          {isEditing ? (
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
                          )}
                        </div>
                      </div>

                      {/* Sub-exams */}
                      <div className="px-4 py-3">
                        {config.subExams.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {config.subExams.map((se, idx) => (
                              <div
                                key={se.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/20 transition-all"
                              >
                                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--brand-light)] text-[0.625rem] font-bold text-[var(--brand)]">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                                    {isBn ? se.nameBn : se.name}
                                  </div>
                                  {isEditing && form ? (
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
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">
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
                        {isEditing && form && (
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
                          <div className="w-2 h-2 rounded-full bg-[var(--brand)]" />
                          <span className="text-[var(--text-muted)]">{isBn ? 'মোট বিষয়' : 'Total Subjects'}:</span>
                          <span className="font-semibold text-[var(--text-primary)]">{structConfigs.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[0.6875rem]">
                          <div className="w-2 h-2 rounded-full bg-[var(--green)]" />
                          <span className="text-[var(--text-muted)]">{isBn ? 'মোট সাব-এক্সাম' : 'Total Sub-exams'}:</span>
                          <span className="font-semibold text-[var(--text-primary)]">{structConfigs.reduce((sum, c) => sum + c.subExams.length, 0)}</span>
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
                <div className="flex items-center gap-1 text-[0.625rem] min-w-[8rem] justify-end">
                  {saving ? (
                    <>
                      <Loader size={10} className="animate-spin text-[var(--green)]" />
                      <span className="text-[var(--green)]">{isBn ? 'সেভ হচ্ছে...' : 'Saving...'}</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckCircle size={10} className="text-[var(--green)]" />
                      <span className="text-[var(--text-muted)]">{isBn ? 'সেভ হয়েছে' : 'Saved'} {lastSaved}</span>
                    </>
                  ) : null}
                </div>
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
                      .map((s) => {
                        const isLocked = sessionMarksEntryStatuses.some(
                          (m) => m.examId === selectedExamId && m.classId === entryClassId && m.sectionId === entrySectionId && m.subjectId === s.id && m.status === 'locked'
                        )
                        return (
                          <option key={s.id} value={s.id}>
                            {isBn ? s.nameBn : s.name}{isLocked ? ` ${isBn ? '(লকড)' : '(Locked)'}` : ''}
                          </option>
                        )
                      })}
                  </select>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[0.6875rem] min-h-[1.25rem]">
                {saving ? (
                  <>
                    <Loader size={12} className="animate-spin text-[var(--green)]" />
                    <span className="text-[var(--green)]">{isBn ? 'সেভ হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle size={12} className="text-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)]">{isBn ? `শেষ সেভ: ${lastSaved}` : `Last saved: ${lastSaved}`}</span>
                  </>
                ) : null}
              </div>
            </div>

            {selectedExamId && entryClassId && entrySectionId && entrySubjectId && entrySubjectConfig && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {classStudents.length} {isBn ? 'জন শিক্ষার্থী' : 'students'}
                    {studentSearch && filteredStudents.length !== classStudents.length && (
                      <span className="text-[0.6875rem] text-[var(--text-muted)] ml-1">
                        ({filteredStudents.length} {isBn ? 'ফল্টার' : 'filtered'})
                      </span>
                    )}
                    <span className="text-[0.6875rem] text-[var(--text-muted)] ml-2">
                      Full: {entrySubjectConfig.fullMarks} · Pass: {entrySubjectConfig.passMarks}
                    </span>
                    {isEntrySubjectLocked && (
                      <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[0.5625rem] font-semibold bg-[var(--red-light)] text-[var(--red)]">
                        <Lock size={9} />
                        {isBn ? 'লকড' : 'LOCKED'}
                      </span>
                    )}
                  </span>
                  <div className="relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder={isBn ? 'নাম বা রোল দিয়ে খুঁজুন...' : 'Search by name or roll...'}
                      className="h-7 pl-7 pr-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.6875rem] font-[inherit] outline-none box-border w-[14rem] focus:border-[var(--brand)] transition-all"
                    />
                    {studentSearch && (
                      <button
                        onClick={() => setStudentSearch('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--text-muted)] transition-colors"
                      >
                        <X size={8} className="text-[var(--text-primary)]" />
                      </button>
                    )}
                  </div>
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
                      {filteredStudents.map((student, idx) => {
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
                              const otherSum = entrySubjectConfig.subExams.filter((o) => o.id !== se.id).reduce((s, o) => s + (marks[o.id] || 0), 0)
                              const hasError = markErrors[student.id]?.[se.id] || false
                              return (
                                <td key={se.id} className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={maxForSub}
                                    value={marks[se.id] || ''}
                                    onChange={(e) => handleMarkChange(student.id, se.id, e.target.value, maxForSub, entrySubjectConfig.fullMarks, otherSum)}
                                    disabled={isEntrySubjectLocked}
                                    className={`w-full h-7 px-1 rounded border bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.6875rem] text-center outline-none transition-all ${isEntrySubjectLocked ? 'opacity-50 cursor-not-allowed border-[var(--border)]' : hasError ? 'border-[var(--red)] bg-[var(--red-light)]' : 'border-[var(--border)] focus:border-[var(--brand)]'}`}
                                    placeholder={`${maxForSub}/${se.passMarks}`}
                                  />
                                </td>
                              )
                            })}
                            <td className="py-2 px-2 text-center">
                              <span
                                className={`text-[0.75rem] font-bold ${total > entrySubjectConfig.fullMarks ? 'text-[var(--red)]' : !failedSubExam && total >= entrySubjectConfig.passMarks ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}
                              >
                                {Math.min(total, entrySubjectConfig.fullMarks)}
                                {total > entrySubjectConfig.fullMarks && (
                                  <span className="text-[0.5rem] ml-0.5">⚠</span>
                                )}
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
                {classStudents.length > 0 && filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-muted)] text-[0.75rem]">
                    <Search size={24} className="mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}
                  </div>
                )}
                {isEntrySubjectLocked && (
                  <div className="mt-3 p-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)]/20 flex items-center gap-2">
                    <Lock size={14} className="text-[var(--red)]" />
                    <span className="text-[0.75rem] text-[var(--red)] font-medium">
                      {isBn ? 'এই বিষয়টি লক করা আছে। মার্কস এন্ট্রি করতে প্রকাশ/লক ট্যাব থেকে আনলক করুন।' : 'This subject is locked. Unlock from Publish/Lock tab to enter marks.'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedExamId && entryClassId && entrySectionId && entrySubjectId && !entrySubjectConfig && (
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
            {/* Lock/Unlock individual subjects */}
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <Lock size={15} className="text-[var(--brand)]" />
                {isBn ? 'মার্কস লক/আনলক' : 'Marks Lock/Unlock'}
              </div>

              {/* Class & Section Selector - Same as Structure tab */}
              <div className={`${sectionCls} !p-3 !mb-3`}>
                <div className="flex items-start gap-3">
                  {/* Class chips - left side */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--brand-light)] shrink-0">
                      <Settings size={13} className="text-[var(--brand)]" />
                    </div>
                    <div className={`flex gap-1 min-w-0 ${classOptions.length >= 10 ? 'overflow-x-auto' : 'flex-wrap'}`}>
                      {classOptions.map((c) => {
                        const subjectCount = sessionSubjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === c).length
                        return (
                          <button
                            key={c}
                            onClick={() => { setPublishClassId(c); setPublishSectionId('') }}
                            className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium cursor-pointer border transition-all whitespace-nowrap shrink-0 ${
                              publishClassId === c
                                ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                                : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                            }`}
                          >
                            {isBn ? classes.find((cl) => cl.name === c)?.nameBn || c : c}
                            <span className="ml-0.5 opacity-60">({subjectCount})</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Section chips - right side */}
                  {publishClassId && publishSectionOptions.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-px h-4 bg-[var(--border)]" />
                      <span className="text-[0.75rem] font-semibold text-[var(--text-primary)] shrink-0">
                        {isBn ? 'সেকশন' : 'Section'}
                      </span>
                      <div className={`flex gap-1 ${publishSectionOptions.length >= 5 ? 'overflow-x-auto max-w-[18.75rem]' : 'flex-wrap'}`}>
                        <button
                          onClick={() => setPublishSectionId('')}
                          className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium cursor-pointer border transition-all whitespace-nowrap shrink-0 ${
                            publishSectionId === ''
                              ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                              : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                          }`}
                        >
                          {isBn ? 'সকল' : 'All'}
                        </button>
                        {publishSectionOptions.map((s) => (
                          <button
                            key={s}
                            onClick={() => setPublishSectionId(s)}
                            className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium cursor-pointer border transition-all whitespace-nowrap shrink-0 ${
                              publishSectionId === s
                                ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                                : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              {publishClassData && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-[var(--brand-light)]/50 border border-[var(--brand)]/10">
                  <GraduationCap size={14} className="text-[var(--brand)] flex-shrink-0" />
                  <span className="text-[0.6875rem] text-[var(--brand)] font-medium">
                    {publishClassData.name}{publishSectionId ? ` — ${isBn ? 'সেকশন' : 'Sec'} ${publishSectionId}` : ` — ${isBn ? 'সকল সেকশন' : 'All Sections'}`}
                  </span>
                  <span className="text-[0.5625rem] text-[var(--text-muted)] ml-auto">
                    {publishSubjectIds.length} {isBn ? 'টি বিষয়' : 'subjects'}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {(() => {
                  if (publishRows.length === 0) {
                    return (
                      <div className="text-center py-8 text-[var(--text-muted)] text-[0.75rem]">
                        {!publishClassId
                          ? (isBn ? 'একটি শ্রেণি নির্বাচন করুন' : 'Select a class to view subjects')
                          : publishSubjectIds.length === 0
                            ? (isBn ? 'এই শ্রেণিতে কোনো বিষয় নেই' : 'No subjects assigned to this class')
                            : (isBn ? 'এই ফিল্টারে কোনো ডাটা নেই' : 'No data for this filter')}
                      </div>
                    )
                  }
                  return publishRows.map((row) => {
                    const totalStudents = publishClassData
                      ? students.filter(
                          (s) => s.status === 'approved' && s.active !== false && s.class === publishClassData.name && (!publishSectionId || s.section === publishSectionId)
                        ).length
                      : 0
                    const enteredCount = sessionStudentMarks.filter(
                      (m) => m.examId === selectedExamId && m.subjectId === row.subjectId && m.classId === publishClassData?.name && (!publishSectionId || m.sectionId === publishSectionId)
                    ).length
                    const pct = totalStudents > 0 ? Math.round((enteredCount / totalStudents) * 100) : 0
                    return (
                      <div
                        key={row.subjectId}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          row.isLocked
                            ? 'bg-[var(--red-light)]/30 border-[var(--red)]/15'
                            : 'bg-[var(--bg-secondary)] border-[var(--border)]'
                        }`}
                      >
                        {/* Status indicator dot */}
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: row.isLocked ? 'var(--red)' : pct === 100 ? 'var(--green)' : 'var(--amber)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                              {row.subjectName}
                            </span>
                            {row.isLocked && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[0.5rem] font-medium bg-[var(--red-light)] text-[var(--red)]">
                                <Lock size={8} />
                                {isBn ? 'লকড' : 'Locked'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 mt-1">
                            <span className="text-[0.625rem] text-[var(--text-muted)]">
                              {enteredCount}/{totalStudents} {isBn ? 'এন্ট্রি' : 'entered'}
                            </span>
                            <div className="flex-1 max-w-[10rem] h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: row.isLocked ? 'var(--red)' : pct === 100 ? 'var(--green)' : 'var(--amber)',
                                }}
                              />
                            </div>
                            <span className="text-[0.5625rem] font-semibold" style={{ color: pct === 100 ? 'var(--green)' : 'var(--text-muted)' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (row.isLocked) {
                              unlockMarks(selectedExamId, publishClassData!.name, publishSectionId || '', row.subjectId)
                            } else {
                              lockMarks(selectedExamId, publishClassData!.name, publishSectionId || '', row.subjectId)
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium cursor-pointer border-none transition-all ${
                            row.isLocked
                              ? 'bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)]/15'
                              : 'bg-[var(--green-light)] text-[var(--green)] hover:bg-[var(--green)]/15'
                          }`}
                        >
                          {row.isLocked ? (
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
                  })
                })()}
              </div>
            </div>

            {/* Publish Result */}
            {selectedExam && (
              <div className={sectionCls}>
                <div className={sectionTitleCls}>
                  <CheckCircle size={15} className="text-[var(--brand)]" />
                  {isBn ? 'ফলাফল প্রকাশ' : 'Publish Result'}
                </div>
                <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
                  {isBn ? 'শ্রেণি অনুযায়ী ফলাফল প্রকাশ করুন' : 'Publish results class by class'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {classOptions.map((c) => {
                    const isClassPublished = (selectedExam.publishedClasses || []).includes(c)
                    const classSubjects = sessionSubjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === c)
                    return (
                      <button
                        key={c}
                        onClick={() => toggleClassPublished(selectedExamId, c)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          isClassPublished
                            ? 'border-[var(--green)]/30 bg-[var(--green-light)]/30'
                            : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/30'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                          isClassPublished ? 'bg-[var(--green)]' : 'bg-[var(--bg-primary)] border border-[var(--border)]'
                        }`}>
                          <GraduationCap size={16} className={isClassPublished ? 'text-white' : 'text-[var(--text-muted)]'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                            {isBn ? classes.find((cl) => cl.name === c)?.nameBn || c : c}
                          </div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">
                            {classSubjects.length} {isBn ? 'টি বিষয়' : 'subjects'}
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-md text-[0.625rem] font-semibold ${
                          isClassPublished ? 'bg-[var(--green)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}>
                          {isClassPublished ? (isBn ? 'প্রকাশিত' : 'Published') : (isBn ? 'প্রকাশ করুন' : 'Publish')}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
