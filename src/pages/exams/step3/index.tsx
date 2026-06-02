import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit2, BookOpen, Settings, Save, CheckCircle,
  Lock, Unlock, Loader, Users, AlertTriangle,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'
import type { SubjectMarkConfig } from '@/store/examStore'

const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] mb-[14px]'
const sectionTitleCls = 'flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]'
const inputCls = 'h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border'
const btnPrimary = 'flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]'

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-[#10b981] text-white', 'A': 'bg-[#34d399] text-white', 'A-': 'bg-[#6ee7b7] text-[#065f46]',
  'B': 'bg-[#60a5fa] text-white', 'C': 'bg-[#fbbf24] text-[#78350f]', 'D': 'bg-[#f97316] text-white', 'F': 'bg-[#ef4444] text-white',
}

type SubTab = 'structure' | 'entry' | 'publish'

export default function Step3Evaluation() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const subjects = useTeacherStore(s => s.subjects)
  const { classes } = useClassStore()
  const students = useSessionStudents()
  const isBn = language === 'bn'

  const examConfigs = useExamStore(s => s.examConfigs)
  const subjectMarkConfigs = useExamStore(s => s.subjectMarkConfigs)
  const studentMarks = useExamStore(s => s.studentMarks)
  const marksEntryStatuses = useExamStore(s => s.marksEntryStatuses)
  const saveBulkStudentMarks = useExamStore(s => s.saveBulkStudentMarks)
  const lockMarks = useExamStore(s => s.lockMarks)
  const unlockMarks = useExamStore(s => s.unlockMarks)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('entry')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find(e => e.isActive)?.id || '')

  // Mark Distribution
  const [distExamId, setDistExamId] = useState('')
  const [distSubjectId, setDistSubjectId] = useState('')
  const [distFullMarks, setDistFullMarks] = useState('100')
  const [distPassMarks, setDistPassMarks] = useState('33')
  const [editDistConfig, setEditDistConfig] = useState<SubjectMarkConfig | null>(null)

  // Marks Entry
  const [entryExamId, setEntryExamId] = useState('')
  const [entryClassId, setEntryClassId] = useState('')
  const [entrySectionId, setEntrySectionId] = useState('')
  const [entrySubjectId, setEntrySubjectId] = useState('')
  const [markInputs, setMarkInputs] = useState<Record<string, Record<string, number>>>({})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => entryClassId ? (sectionsMap[entryClassId] || []) : [], [entryClassId, sectionsMap])

  const classStudents = useMemo(() => {
    if (!entryClassId || !entrySectionId) return []
    return students.filter(s => s.status === 'approved' && s.class === entryClassId && s.section === entrySectionId)
  }, [students, entryClassId, entrySectionId])

  const distConfigs = useMemo(() => {
    if (!distExamId || !entryClassId) return []
    return subjectMarkConfigs.filter(s => s.examId === distExamId && s.classId === entryClassId)
  }, [subjectMarkConfigs, distExamId, entryClassId])

  const entrySubjectConfig = useMemo(() => {
    if (!entryExamId || !entrySubjectId || !entryClassId) return null
    return subjectMarkConfigs.find(s => s.examId === entryExamId && s.classId === entryClassId && s.subjectId === entrySubjectId)
  }, [subjectMarkConfigs, entryExamId, entrySubjectId, entryClassId])

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
    classStudents.forEach(s => {
      const existing = studentMarks.find(m => m.examId === entryExamId && m.studentId === s.id && m.subjectId === entrySubjectId && m.classId === entryClassId && m.sectionId === entrySectionId)
      inputs[s.id] = existing?.subExamMarks || {}
    })
    if (JSON.stringify(inputs) !== JSON.stringify(prevInputsRef.current)) {
      prevInputsRef.current = inputs
      setMarkInputs(inputs)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryExamId, entryClassId, entrySectionId, entrySubjectId])

  const handleMarkChange = useCallback((studentId: string, subExamId: string, value: string) => {
    const num = value === '' ? 0 : Number(value)
    setMarkInputs(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [subExamId]: num } }))
  }, [])

  useEffect(() => {
    if (!entryExamId || !entryClassId || !entrySectionId || !entrySubjectId || !entrySubjectConfig) return
    const hasChanges = Object.keys(markInputs).some(sid => { const marks = markInputs[sid]; return marks && Object.keys(marks).length > 0 })
    if (!hasChanges) return
    const timer = setTimeout(() => {
      const marksToSave = classStudents.map(s => ({
        examId: entryExamId, studentId: s.id, subjectId: entrySubjectId,
        classId: entryClassId, sectionId: entrySectionId,
        subExamMarks: markInputs[s.id] || {},
        totalMarks: Object.values(markInputs[s.id] || {}).reduce((a, b) => a + b, 0),
        enteredAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      })).filter(m => Object.keys(m.subExamMarks).length > 0)
      if (marksToSave.length > 0) {
        saveBulkStudentMarks(marksToSave)
        setSaving(true)
        setTimeout(() => { setSaving(false); setLastSaved(new Date().toLocaleTimeString()) }, 600)
      }
    }, 1000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markInputs, entryExamId, entryClassId, entrySectionId, entrySubjectId, entrySubjectConfig])

  // Entry status summary
  const entryStatusSummary = useMemo(() => {
    const filtered = selectedExamId ? marksEntryStatuses.filter(m => m.examId === selectedExamId) : marksEntryStatuses
    const completed = filtered.filter(m => m.status === 'completed').length
    const inProgress = filtered.filter(m => m.status === 'in-progress').length
    const pending = filtered.filter(m => m.status === 'pending').length
    const locked = filtered.filter(m => m.status === 'locked').length
    return { total: filtered.length, completed, inProgress, pending, locked }
  }, [marksEntryStatuses, selectedExamId])

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/exams')} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text-primary)]">{isBn ? 'ধাপ ৩: মূল্যায়ন ও মার্কস' : 'Step 3: Evaluation & Marks'}</h1>
            <p className="text-[11px] text-[var(--text-muted)]">{isBn ? 'মার্কস এন্ট্রি, রিভিউ ও প্রকাশ' : 'Marks entry, review & publish'}</p>
          </div>
        </div>
      </div>

      {/* Exam Selector */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <select value={selectedExamId || entryExamId} onChange={e => { setSelectedExamId(e.target.value); setEntryExamId(e.target.value) }} className={`${inputCls} max-w-[300px]`}>
          <option value="">{isBn ? 'সকল পরীক্ষা' : 'All Exams'}</option>
          {examConfigs.map(e => <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name} {e.isActive ? '(Active)' : ''}</option>)}
        </select>
      </div>

      {/* Status Summary */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-3 overflow-x-auto">
        {[
          { label: isBn ? 'সম্পন্ন' : 'Completed', value: entryStatusSummary.completed, color: 'var(--green)' },
          { label: isBn ? 'চলমান' : 'In Progress', value: entryStatusSummary.inProgress, color: 'var(--amber)' },
          { label: isBn ? 'অপেক্ষমান' : 'Pending', value: entryStatusSummary.pending, color: 'var(--text-muted)' },
          { label: isBn ? 'লক' : 'Locked', value: entryStatusSummary.locked, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-[var(--text-muted)]">{s.label}:</span>
            <span className="font-semibold text-[var(--text-primary)]">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {([
          { key: 'structure' as SubTab, label: isBn ? 'মার্কস স্ট্রাকচার' : 'Marks Structure', icon: <Settings size={14} /> },
          { key: 'entry' as SubTab, label: isBn ? 'মার্কস এন্ট্রি' : 'Marks Entry', icon: <Edit2 size={14} /> },
          { key: 'publish' as SubTab, label: isBn ? 'প্রকাশ/লক' : 'Publish/Lock', icon: <Lock size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeSubTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ═══ STRUCTURE TAB ═══ */}
        {activeSubTab === 'structure' && (
          <>
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <Settings size={15} className="text-[var(--brand)]" />{isBn ? 'মার্ক ডিস্ট্রিবিউশন সেটআপ' : 'Mark Distribution Setup'}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
                  <select value={distExamId} onChange={e => { setDistExamId(e.target.value); setDistSubjectId('') }} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {examConfigs.map(e => <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name}</option>)}
                  </select>
                </div>
              </div>
              {distExamId && (
                <>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                      <select value={distSubjectId} onChange={e => {
                        setDistSubjectId(e.target.value)
                        const existing = subjectMarkConfigs.find(s => s.examId === distExamId && s.classId === entryClassId && s.subjectId === e.target.value)
                        if (existing) { setEditDistConfig(existing); setDistFullMarks(String(existing.fullMarks)); setDistPassMarks(String(existing.passMarks)) }
                        else { setEditDistConfig(null); setDistFullMarks('100'); setDistPassMarks('33') }
                      }} className={`${inputCls} w-full`}>
                        <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                        {subjects.map(s => {
                          const configured = distConfigs.some(c => c.subjectId === s.id)
                          return <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}{configured ? ' ✓' : ''}</option>
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফুল মার্কস' : 'Full Marks'}</label>
                      <input type="number" value={distFullMarks} onChange={e => setDistFullMarks(e.target.value)} className={`${inputCls} w-full`} />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পাস মার্কস' : 'Pass Marks'}</label>
                      <input type="number" value={distPassMarks} onChange={e => setDistPassMarks(e.target.value)} className={`${inputCls} w-full`} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => {
                      if (!distExamId || !distSubjectId || !distFullMarks) return
                      const { upsertSubjectMarkConfig } = useExamStore.getState()
                      upsertSubjectMarkConfig({ examId: distExamId, classId: entryClassId, subjectId: distSubjectId, fullMarks: Number(distFullMarks) || 100, passMarks: Number(distPassMarks) || 33, subExams: editDistConfig?.subExams || [] })
                      setDistSubjectId(''); setDistFullMarks('100'); setDistPassMarks('33'); setEditDistConfig(null)
                    }} disabled={!distSubjectId} className={`${btnPrimary} text-[11px] ${!distSubjectId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Save size={12} />{editDistConfig ? (isBn ? 'আপডেট' : 'Update') : (isBn ? 'সেভ' : 'Save')}
                    </button>
                  </div>
                </>
              )}
            </div>

            {distExamId && (
              <div className={sectionCls}>
                <div className={sectionTitleCls}>
                  <BookOpen size={15} className="text-[var(--teal)]" />{isBn ? 'কনফিগার্ড বিষয়' : 'Configured Subjects'} ({distConfigs.length})
                </div>
                <div className="space-y-2 mt-2">
                  {distConfigs.map(config => {
                    const subject = subjects.find(s => s.id === config.subjectId)
                    return (
                      <div key={config.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? subject?.nameBn : subject?.name}</span>
                            <span className="text-[11px] text-[var(--text-muted)] ml-2">{config.fullMarks} / Pass: {config.passMarks}</span>
                          </div>
                          {config.subExams.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {config.subExams.map(se => (
                                <span key={se.id} className="text-[9px] bg-[var(--bg-primary)] rounded px-1.5 py-0.5 text-[var(--text-secondary)]">
                                  {isBn ? se.nameBn : se.name} ({se.weight}%)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ ENTRY TAB ═══ */}
        {activeSubTab === 'entry' && (
          <>
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <Edit2 size={15} className="text-[var(--brand)]" />{isBn ? 'মার্কস এন্ট্রি' : 'Marks Entry'}
              </div>
              <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)' }}>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
                  <select value={entryExamId} onChange={e => { setEntryExamId(e.target.value); setEntryClassId(''); setEntrySectionId(''); setEntrySubjectId('') }} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {examConfigs.map(e => <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select value={entryClassId} onChange={e => { setEntryClassId(e.target.value); setEntrySectionId(''); setEntrySubjectId('') }} className={`${inputCls} w-full`} disabled={!entryExamId}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select value={entrySectionId} onChange={e => { setEntrySectionId(e.target.value); setEntrySubjectId('') }} className={`${inputCls} w-full`} disabled={!entryClassId}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                  <select value={entrySubjectId} onChange={e => setEntrySubjectId(e.target.value)} className={`${inputCls} w-full`} disabled={!entrySectionId}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {subjects.filter(s => subjectMarkConfigs.some(c => c.examId === entryExamId && c.classId === entryClassId && c.subjectId === s.id)).map(s => (
                      <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {saving && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--green)]">
                  <Loader size={12} className="animate-spin" />{isBn ? 'সেভ হচ্ছে...' : 'Saving...'}
                </div>
              )}
              {!saving && lastSaved && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <CheckCircle size={12} />{isBn ? `শেষ সেভ: ${lastSaved}` : `Last saved: ${lastSaved}`}
                </div>
              )}
            </div>

            {entryExamId && entryClassId && entrySectionId && entrySubjectId && entrySubjectConfig && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {classStudents.length} {isBn ? 'জন শিক্ষার্থী' : 'students'}
                    <span className="text-[11px] text-[var(--text-muted)] ml-2">
                      Full: {entrySubjectConfig.fullMarks} · Pass: {entrySubjectConfig.passMarks}
                    </span>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] w-8">#</th>
                        <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[140px]">{isBn ? 'নাম' : 'Name'}</th>
                        <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[60px]">{isBn ? 'রোল' : 'Roll'}</th>
                        {entrySubjectConfig.subExams.map(se => (
                          <th key={se.id} className="py-2 px-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[80px]">
                            <div>{isBn ? se.nameBn : se.name}</div>
                            <div className="font-normal text-[9px]">({se.weight}%)</div>
                          </th>
                        ))}
                        <th className="py-2 px-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[60px]">{isBn ? 'মোট' : 'Total'}</th>
                        <th className="py-2 px-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[50px]">{isBn ? 'গ্রেড' : 'Grade'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student, idx) => {
                        const marks = markInputs[student.id] || {}
                        const total = Object.values(marks).reduce((a, b) => a + b, 0)
                        const pct = entrySubjectConfig.fullMarks > 0 ? (total / entrySubjectConfig.fullMarks) * 100 : 0
                        let grade = 'F'
                        if (pct >= 80) grade = 'A+'
                        else if (pct >= 70) grade = 'A'
                        else if (pct >= 60) grade = 'A-'
                        else if (pct >= 50) grade = 'B'
                        else if (pct >= 40) grade = 'C'
                        else if (pct >= 33) grade = 'D'
                        return (
                          <tr key={student.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                            <td className="py-2 px-2 text-[var(--text-muted)]">{idx + 1}</td>
                            <td className="py-2 px-2">
                              <div className="text-[11px] font-medium text-[var(--text-primary)]">{isBn ? student.nameBn || student.nameEn : student.nameEn}</div>
                              <div className="text-[9px] text-[var(--text-muted)]">{student.id}</div>
                            </td>
                            <td className="py-2 px-2 text-[var(--text-secondary)]">{student.roll || '—'}</td>
                            {entrySubjectConfig.subExams.map(se => {
                              const maxForSub = Math.round(entrySubjectConfig.fullMarks * se.weight / 100)
                              return (
                                <td key={se.id} className="py-2 px-2">
                                  <input type="number" min={0} max={maxForSub}
                                    value={marks[se.id] || ''}
                                    onChange={e => handleMarkChange(student.id, se.id, e.target.value)}
                                    className="w-[60px] h-7 px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[11px] text-center outline-none focus:border-[var(--brand)]"
                                    placeholder={`0-${maxForSub}`} />
                                </td>
                              )
                            })}
                            <td className="py-2 px-2 text-center">
                              <span className={`text-[12px] font-bold ${total >= entrySubjectConfig.passMarks ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{total}</span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`text-[10px] py-[2px] px-[5px] rounded font-medium ${GRADE_COLORS[grade] || 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>{grade}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {classStudents.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                    <Users size={24} className="mx-auto mb-2 opacity-30" />
                    {isBn ? 'এই সেকশনে কোনো শিক্ষার্থী নেই' : 'No students in this section'}
                  </div>
                )}
              </div>
            )}

            {entryExamId && entryClassId && entrySectionId && entrySubjectId && !entrySubjectConfig && (
              <div className={`${sectionCls} text-center py-10`}>
                <AlertTriangle size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'মার্ক ডিস্ট্রিবিউশন কনফিগার করুন' : 'Configure mark distribution for this exam & subject'}</p>
              </div>
            )}

            {!entryExamId && (
              <div className={`${sectionCls} text-center py-10`}>
                <BookOpen size={24} className="mx-auto mb-2 opacity-30 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'পরীক্ষা, শ্রেণি, সেকশন ও বিষয় নির্বাচন করুন' : 'Select exam, class, section and subject to enter marks'}</p>
              </div>
            )}
          </>
        )}

        {/* ═══ PUBLISH/LOCK TAB ═══ */}
        {activeSubTab === 'publish' && (
          <>
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <Lock size={15} className="text-[var(--brand)]" />{isBn ? 'মার্কস লক/আনলক' : 'Marks Lock/Unlock'}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">{isBn ? 'সম্পন্ন এন্ট্রি লক করুন বা পরিবর্তনের জন্য আনলক করুন' : 'Lock completed entries or unlock for changes'}</p>
              <div className="space-y-2">
                {marksEntryStatuses.filter(m => selectedExamId ? m.examId === selectedExamId : true).map(entry => {
                  const subject = subjects.find(s => s.id === entry.subjectId)
                  const isLocked = entry.status === 'locked'
                  const pct = entry.totalStudents > 0 ? Math.round((entry.enteredCount / entry.totalStudents) * 100) : 0
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[var(--text-primary)]">
                          {isBn ? subject?.nameBn : subject?.name} — {entry.classId} {entry.sectionId}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                          <span>{entry.enteredCount}/{entry.totalStudents} entered</span>
                          <div className="w-16 h-1.5 bg-[var(--border)] rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isLocked ? 'var(--red)' : pct === 100 ? 'var(--green)' : 'var(--amber)' }} />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => isLocked ? unlockMarks(entry.examId, entry.classId, entry.sectionId, entry.subjectId) : lockMarks(entry.examId, entry.classId, entry.sectionId, entry.subjectId)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer border-none ${isLocked ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--green-light)] text-[var(--green)]'}`}>
                        {isLocked ? <><Unlock size={12} />{isBn ? 'আনলক' : 'Unlock'}</> : <><Lock size={12} />{isBn ? 'লক' : 'Lock'}</>}
                      </button>
                    </div>
                  )
                })}
                {marksEntryStatuses.length === 0 && (
                  <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
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
