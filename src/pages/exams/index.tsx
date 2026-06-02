import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2, CheckCircle, Calendar, BookOpen, Users, Save, Settings, Loader } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'
import type { ExamConfig, ExamType, SubjectMarkConfig } from '@/store/examStore'

const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] mb-[14px]'
const sectionTitleCls = 'flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]'
const inputCls = 'h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border'
const btnPrimary = 'flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]'

const EXAM_TYPE_LABELS: Record<ExamType, { en: string; bn: string }> = {
  'semester-1': { en: '1st Semester', bn: '১ম সেমিস্টার' },
  'semester-2': { en: '2nd Semester', bn: '২য় সেমিস্টার' },
  'annual': { en: 'Annual', bn: 'বার্ষিক' },
  'midterm': { en: 'Mid-term', bn: 'মধ্যবর্তী' },
  'final': { en: 'Final', bn: 'চূড়ান্ত' },
  'custom': { en: 'Custom', bn: 'কাস্টম' },
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-[#10b981] text-white',
  'A': 'bg-[#34d399] text-white',
  'A-': 'bg-[#6ee7b7] text-[#065f46]',
  'B': 'bg-[#60a5fa] text-white',
  'C': 'bg-[#fbbf24] text-[#78350f]',
  'D': 'bg-[#f97316] text-white',
  'F': 'bg-[#ef4444] text-white',
}

export default function ExamsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { subjects } = useTeacherStore()
  const { classes } = useClassStore()
  const students = useSessionStudents()
  const isBn = language === 'bn'

  const {
    examConfigs, subjectMarkConfigs, studentMarks,
    addExamConfig, updateExamConfig, deleteExamConfig, toggleExamActive,
    upsertSubjectMarkConfig, deleteSubjectMarkConfig,
    addSubExamToSubject, removeSubExam,
    saveBulkStudentMarks,
  } = useExamStore()

  type Tab = 'setup' | 'distribution' | 'entry'
  const [activeTab, setActiveTab] = useState<Tab>('setup')
  const [showExamForm, setShowExamForm] = useState(false)
  const [editExam, setEditExam] = useState<ExamConfig | null>(null)
  const [examForm, setExamForm] = useState({ name: '', nameBn: '', type: 'semester-1' as ExamType, session: '2025-26', startDate: '', endDate: '' })

  // Mark Distribution state
  const [distExamId, setDistExamId] = useState('')
  const [distSubjectId, setDistSubjectId] = useState('')
  const [distFullMarks, setDistFullMarks] = useState('100')
  const [distPassMarks, setDistPassMarks] = useState('33')
  const [showSubExamForm, setShowSubExamForm] = useState(false)
  const [subExamForm, setSubExamForm] = useState({ name: '', nameBn: '', weight: '' })
  const [editDistConfig, setEditDistConfig] = useState<SubjectMarkConfig | null>(null)

  // Marks Entry state
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
    if (!distExamId) return []
    return subjectMarkConfigs.filter(s => s.examId === distExamId)
  }, [subjectMarkConfigs, distExamId])

  const entrySubjectConfig = useMemo(() => {
    if (!entryExamId || !entrySubjectId) return null
    return subjectMarkConfigs.find(s => s.examId === entryExamId && s.subjectId === entrySubjectId)
  }, [subjectMarkConfigs, entryExamId, entrySubjectId])

  // Initialize mark inputs from existing marks
  useEffect(() => {
    if (!entryExamId || !entryClassId || !entrySectionId || !entrySubjectId) { setMarkInputs({}); return }
    const inputs: Record<string, Record<string, number>> = {}
    classStudents.forEach(s => {
      const existing = studentMarks.find(m => m.examId === entryExamId && m.studentId === s.id && m.subjectId === entrySubjectId && m.classId === entryClassId && m.sectionId === entrySectionId)
      inputs[s.id] = existing?.subExamMarks || {}
    })
    setMarkInputs(inputs)
  }, [entryExamId, entryClassId, entrySectionId, entrySubjectId, classStudents, studentMarks])

  const handleSaveExam = () => {
    if (!examForm.name || !examForm.startDate || !examForm.endDate) return
    if (editExam) {
      updateExamConfig(editExam.id, examForm)
    } else {
      addExamConfig({ ...examForm, isActive: false })
    }
    setShowExamForm(false)
    setEditExam(null)
    setExamForm({ name: '', nameBn: '', type: 'semester-1', session: '2025-26', startDate: '', endDate: '' })
  }

  const handleSaveDist = () => {
    if (!distExamId || !distSubjectId || !distFullMarks) return
    upsertSubjectMarkConfig({
      examId: distExamId,
      subjectId: distSubjectId,
      fullMarks: Number(distFullMarks) || 100,
      passMarks: Number(distPassMarks) || 33,
      subExams: editDistConfig?.subExams || [],
    })
    setDistSubjectId('')
    setDistFullMarks('100')
    setDistPassMarks('33')
    setEditDistConfig(null)
  }

  const handleAddSubExam = () => {
    if (!editDistConfig || !subExamForm.name || !subExamForm.weight) return
    addSubExamToSubject(editDistConfig.id, { name: subExamForm.name, nameBn: subExamForm.nameBn || subExamForm.name, weight: Number(subExamForm.weight) || 0 })
    setSubExamForm({ name: '', nameBn: '', weight: '' })
    setShowSubExamForm(false)
  }

  const handleMarkChange = useCallback((studentId: string, subExamId: string, value: string) => {
    const num = value === '' ? 0 : Number(value)
    setMarkInputs(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [subExamId]: num }
    }))
  }, [])

  // Auto-save with debounce
  useEffect(() => {
    if (!entryExamId || !entryClassId || !entrySectionId || !entrySubjectId || !entrySubjectConfig) return
    const hasChanges = Object.keys(markInputs).some(sid => {
      const marks = markInputs[sid]
      return marks && Object.keys(marks).length > 0
    })
    if (!hasChanges) return

    const timer = setTimeout(() => {
      const marksToSave = classStudents.map(s => ({
        examId: entryExamId,
        studentId: s.id,
        subjectId: entrySubjectId,
        classId: entryClassId,
        sectionId: entrySectionId,
        subExamMarks: markInputs[s.id] || {},
        totalMarks: Object.values(markInputs[s.id] || {}).reduce((a, b) => a + b, 0),
        enteredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })).filter(m => Object.keys(m.subExamMarks).length > 0)

      if (marksToSave.length > 0) {
        saveBulkStudentMarks(marksToSave)
        setSaving(true)
        setTimeout(() => { setSaving(false); setLastSaved(new Date().toLocaleTimeString()) }, 600)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [markInputs, entryExamId, entryClassId, entrySectionId, entrySubjectId, classStudents, entrySubjectConfig, saveBulkStudentMarks])

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text-primary)]">{isBn ? 'পরীক্ষা ও ফলাফল' : 'Exams & Results'}</h1>
            <p className="text-[11px] text-[var(--text-muted)]">{isBn ? 'পরীক্ষা সেটআপ, মার্ক ডিস্ট্রিবিউশন ও মার্কস এন্ট্রি' : 'Exam setup, mark distribution & marks entry'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {([
          { key: 'setup' as Tab, label: isBn ? 'পরীক্ষা সেটআপ' : 'Exam Setup', icon: <Calendar size={14} /> },
          { key: 'distribution' as Tab, label: isBn ? 'মার্ক ডিস্ট্রিবিউশন' : 'Mark Distribution', icon: <BookOpen size={14} /> },
          { key: 'entry' as Tab, label: isBn ? 'মার্কস এন্ট্রি' : 'Marks Entry', icon: <Edit2 size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ══════════ TAB: EXAM SETUP ══════════ */}
        {activeTab === 'setup' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{isBn ? `মোট ${examConfigs.length}টি পরীক্ষা` : `${examConfigs.length} exams`}</span>
              <button onClick={() => { setShowExamForm(true); setEditExam(null); setExamForm({ name: '', nameBn: '', type: 'semester-1', session: '2025-26', startDate: '', endDate: '' }) }}
                className={btnPrimary}><Plus size={14} />{isBn ? 'নতুন পরীক্ষা' : 'New Exam'}</button>
            </div>

            <div className="grid gap-3">
              {examConfigs.map(exam => (
                <div key={exam.id} className={`${sectionCls} transition-all hover:shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? exam.nameBn : exam.name}</span>
                        <span className={`text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium ${
                          exam.type === 'semester-1' ? 'bg-[#dbeafe] text-[#1d4ed8]' :
                          exam.type === 'semester-2' ? 'bg-[#fef3c7] text-[#b45309]' :
                          exam.type === 'annual' ? 'bg-[#dcfce7] text-[#15803d]' :
                          'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                        }`}>{isBn ? EXAM_TYPE_LABELS[exam.type].bn : EXAM_TYPE_LABELS[exam.type].en}</span>
                        {exam.isActive && <span className="text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium bg-[var(--green-light)] text-[var(--green)]">{isBn ? 'সক্রিয়' : 'Active'}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] flex-wrap">
                        <span>{isBn ? 'সেশন' : 'Session'}: {exam.session}</span>
                        <span>{exam.startDate} – {exam.endDate}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        {subjectMarkConfigs.filter(s => s.examId === exam.id).length} {isBn ? 'টি বিষয় কনফিগারড' : 'subjects configured'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => toggleExamActive(exam.id)}
                        className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer ${exam.isActive ? 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                        <CheckCircle size={13} />
                      </button>
                      <button onClick={() => { setEditExam(exam); setExamForm({ name: exam.name, nameBn: exam.nameBn, type: exam.type, session: exam.session, startDate: exam.startDate, endDate: exam.endDate }); setShowExamForm(true) }}
                        className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => { if (confirm(isBn ? 'এই পরীক্ষা মুছে ফেলবেন?' : 'Delete this exam?')) deleteExamConfig(exam.id) }}
                        className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Exam Form Modal */}
            {showExamForm && (
              <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
                <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[420px] w-full p-5 border border-[var(--border)]">
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">{editExam ? (isBn ? 'পরীক্ষা এডিট' : 'Edit Exam') : (isBn ? 'নতুন পরীক্ষা' : 'New Exam')}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (ইংরেজি)' : 'Name (English)'}</label>
                      <input value={examForm.name} onChange={e => setExamForm(p => ({ ...p, name: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. 1st Semester Exam" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
                      <input value={examForm.nameBn} onChange={e => setExamForm(p => ({ ...p, nameBn: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. ১ম সেমিস্টার পরীক্ষা" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ধরন' : 'Type'}</label>
                        <select value={examForm.type} onChange={e => setExamForm(p => ({ ...p, type: e.target.value as ExamType }))} className={`${inputCls} w-full`}>
                          {(Object.entries(EXAM_TYPE_LABELS) as [ExamType, { en: string; bn: string }][]).map(([k, v]) => (
                            <option key={k} value={k}>{isBn ? v.bn : v.en}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেশন' : 'Session'}</label>
                        <input value={examForm.session} onChange={e => setExamForm(p => ({ ...p, session: e.target.value }))} className={`${inputCls} w-full`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start'}</label>
                        <input type="date" value={examForm.startDate} onChange={e => setExamForm(p => ({ ...p, startDate: e.target.value }))} className={`${inputCls} w-full`} />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End'}</label>
                        <input type="date" value={examForm.endDate} onChange={e => setExamForm(p => ({ ...p, endDate: e.target.value }))} className={`${inputCls} w-full`} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button onClick={() => { setShowExamForm(false); setEditExam(null) }} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
                    <button onClick={handleSaveExam} className={`${btnPrimary} text-[12px]`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════ TAB: MARK DISTRIBUTION ══════════ */}
        {activeTab === 'distribution' && (
          <>
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <Settings size={15} className="text-[var(--brand)]" />{isBn ? 'মার্ক ডিস্ট্রিবিউশন সেটআপ' : 'Mark Distribution Setup'}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">{isBn ? 'প্রতিটি বিষয়ের জন্য ফুল মার্কস, পাস মার্কস এবং সাব-এক্সাম সেট করুন' : 'Set full marks, pass marks and sub-exams for each subject'}</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
                  <select value={distExamId} onChange={e => { setDistExamId(e.target.value); setDistSubjectId('') }} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select exam...'}</option>
                    {examConfigs.map(e => <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name}</option>)}
                  </select>
                </div>
              </div>

              {distExamId && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                      <select value={distSubjectId} onChange={e => {
                        setDistSubjectId(e.target.value)
                        const existing = subjectMarkConfigs.find(s => s.examId === distExamId && s.subjectId === e.target.value)
                        if (existing) { setEditDistConfig(existing); setDistFullMarks(String(existing.fullMarks)); setDistPassMarks(String(existing.passMarks)) }
                        else { setEditDistConfig(null); setDistFullMarks('100'); setDistPassMarks('33') }
                      }} className={`${inputCls} w-full`}>
                        <option value="">{isBn ? 'বিষয় নির্বাচন...' : 'Select subject...'}</option>
                        {subjects.map(s => {
                          const configured = distConfigs.some(c => c.subjectId === s.id)
                          return <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}{configured ? ' ✓' : ''}</option>
                        })}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফুল মার্কস' : 'Full Marks'}</label>
                        <input type="number" value={distFullMarks} onChange={e => setDistFullMarks(e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পাস মার্কস' : 'Pass Marks'}</label>
                        <input type="number" value={distPassMarks} onChange={e => setDistPassMarks(e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSaveDist} disabled={!distSubjectId} className={`${btnPrimary} text-[12px] ${!distSubjectId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Save size={13} />{editDistConfig ? (isBn ? 'আপডেট' : 'Update') : (isBn ? 'সেভ করুন' : 'Save')}
                  </button>
                </>
              )}
            </div>

            {/* Configured subjects list */}
            {distExamId && (
              <div className={sectionCls}>
                <div className={sectionTitleCls}>
                  <BookOpen size={15} className="text-[var(--teal)]" />{isBn ? 'কনফিগার্ড বিষয়সমূহ' : 'Configured Subjects'}
                </div>
                {distConfigs.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                    {isBn ? 'এই পরীক্ষায় কোনো বিষয় কনফিগার করা হয়নি' : 'No subjects configured for this exam'}
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {distConfigs.map(config => {
                      const subject = subjects.find(s => s.id === config.subjectId)
                      return (
                        <div key={config.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? subject?.nameBn : subject?.name}</span>
                              <span className="text-[11px] text-[var(--text-muted)] ml-2">৳{config.fullMarks} / {isBn ? 'পাস' : 'Pass'}: {config.passMarks}</span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditDistConfig(config); setDistSubjectId(config.subjectId); setDistFullMarks(String(config.fullMarks)); setDistPassMarks(String(config.passMarks)) }}
                                className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]">
                                <Edit2 size={11} />
                              </button>
                              <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteSubjectMarkConfig(config.id) }}
                                className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                          {config.subExams.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {config.subExams.map(se => (
                                <div key={se.id} className="flex items-center gap-1 bg-[var(--bg-primary)] rounded-md px-2 py-1 text-[10px]">
                                  <span className="font-medium text-[var(--text-primary)]">{isBn ? se.nameBn : se.name}</span>
                                  <span className="text-[var(--text-muted)]">({se.weight}%)</span>
                                  <button onClick={() => removeSubExam(config.id, se.id)} className="text-[var(--text-muted)] hover:text-[var(--red)] cursor-pointer ml-0.5">×</button>
                                </div>
                              ))}
                              <button onClick={() => { setEditDistConfig(config); setShowSubExamForm(true) }}
                                className="flex items-center gap-0.5 bg-[var(--brand-light)] rounded-md px-2 py-1 text-[10px] text-[var(--brand)] font-medium cursor-pointer">
                                <Plus size={10} />{isBn ? 'যোগ' : 'Add'}
                              </button>
                            </div>
                          )}
                          {config.subExams.length === 0 && (
                            <button onClick={() => { setEditDistConfig(config); setShowSubExamForm(true) }}
                              className="mt-1 flex items-center gap-1 text-[10px] text-[var(--brand)] cursor-pointer hover:underline">
                              <Plus size={10} />{isBn ? 'সাব-এক্সাম যোগ করুন' : 'Add sub-exams (CQ, MCQ, Oral...)'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-exam form modal */}
            {showSubExamForm && editDistConfig && (
              <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
                <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[350px] w-full p-5 border border-[var(--border)]">
                  <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">{isBn ? 'সাব-এক্সাম যোগ' : 'Add Sub-Exam'}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (ইংরেজি)' : 'Name'}</label>
                      <input value={subExamForm.name} onChange={e => setSubExamForm(p => ({ ...p, name: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. CQ, MCQ, Oral, Practical" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
                      <input value={subExamForm.nameBn} onChange={e => setSubExamForm(p => ({ ...p, nameBn: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. সিকিউ, এমসিকিউ, মৌখিক" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ওয়েট (%)' : 'Weight (%)'}</label>
                      <input type="number" value={subExamForm.weight} onChange={e => setSubExamForm(p => ({ ...p, weight: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. 50" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button onClick={() => { setShowSubExamForm(false); setSubExamForm({ name: '', nameBn: '', weight: '' }) }} className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
                    <button onClick={handleAddSubExam} className={`${btnPrimary} text-[11px] py-[6px] px-3`}>{isBn ? 'যোগ করুন' : 'Add'}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════ TAB: MARKS ENTRY ══════════ */}
        {activeTab === 'entry' && (
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
                    {subjects.filter(s => subjectMarkConfigs.some(c => c.examId === entryExamId && c.subjectId === s.id)).map(s => (
                      <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto-save indicator */}
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

            {/* Marks Entry Table */}
            {entryExamId && entryClassId && entrySectionId && entrySubjectId && entrySubjectConfig && (
              <div className={sectionCls}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">{classStudents.length} {isBn ? 'জন শিক্ষার্থী' : 'students'}</span>
                    <span className="text-[11px] text-[var(--text-muted)] ml-2">
                      {isBn ? 'ফুল' : 'Full'}: {entrySubjectConfig.fullMarks} · {isBn ? 'পাস' : 'Pass'}: {entrySubjectConfig.passMarks}
                    </span>
                  </div>
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
                    <Users size={24} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'এই সেকশনে কোনো শিক্ষার্থী নেই' : 'No students in this section'}
                  </div>
                )}
              </div>
            )}

            {entryExamId && entryClassId && entrySectionId && entrySubjectId && !entrySubjectConfig && (
              <div className={sectionCls}>
                <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                  <Settings size={24} className="block mx-auto mb-2 opacity-30" />
                  {isBn ? 'এই পরীক্ষা ও বিষয়ের জন্য মার্ক ডিস্ট্রিবিউশন কনফিগার করুন' : 'Configure mark distribution for this exam and subject'}
                </div>
              </div>
            )}

            {!entryExamId && (
              <div className={sectionCls}>
                <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                  <BookOpen size={24} className="block mx-auto mb-2 opacity-30" />
                  {isBn ? 'পরীক্ষা, শ্রেণি, সেকশন ও বিষয় নির্বাচন করুন' : 'Select exam, class, section and subject to enter marks'}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
