import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Edit2, CheckCircle, Settings,
  BookOpen, Save, X, ClipboardList, Award, ScanLine, AlertTriangle,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions } from '@/store/classStore'
import { useExamStore } from '@/store/examStore'
import type { ExamConfig, ExamType, SubjectMarkConfig, OMRConfig } from '@/store/examStore'

const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] mb-[14px]'
const sectionTitleCls = 'flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]'
const inputCls = 'h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border'
const btnPrimary = 'flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]'

type SubTab = 'exams' | 'subjects' | 'grade-scale' | 'omr'

const EXAM_TYPE_LABELS: Record<ExamType, { en: string; bn: string }> = {
  'semester-1': { en: '1st Semester', bn: '১ম সেমিস্টার' },
  'semester-2': { en: '2nd Semester', bn: '২য় সেমিস্টার' },
  'annual': { en: 'Annual', bn: 'বার্ষিক' },
  'midterm': { en: 'Mid-term', bn: 'মধ্যবর্তী' },
  'final': { en: 'Final', bn: 'চূড়ান্ত' },
  'custom': { en: 'Custom', bn: 'কাস্টম' },
}

export default function Step1Planning() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const subjects = useTeacherStore(s => s.subjects)
  const { classes } = useClassStore()
  const isBn = language === 'bn'

  const examConfigs = useExamStore(s => s.examConfigs)
  const subjectMarkConfigs = useExamStore(s => s.subjectMarkConfigs)
  const omrConfigs = useExamStore(s => s.omrConfigs)
  const gradeScales = useExamStore(s => s.gradeScales)
  const addExamConfig = useExamStore(s => s.addExamConfig)
  const updateExamConfig = useExamStore(s => s.updateExamConfig)
  const deleteExamConfig = useExamStore(s => s.deleteExamConfig)
  const toggleExamActive = useExamStore(s => s.toggleExamActive)
  const upsertSubjectMarkConfig = useExamStore(s => s.upsertSubjectMarkConfig)
  const deleteSubjectMarkConfig = useExamStore(s => s.deleteSubjectMarkConfig)
  const copyClassMarkConfig = useExamStore(s => s.copyClassMarkConfig)
  const addSubExamToSubject = useExamStore(s => s.addSubExamToSubject)
  const removeSubExam = useExamStore(s => s.removeSubExam)
  const upsertOMRConfig = useExamStore(s => s.upsertOMRConfig)
  const deleteOMRConfig = useExamStore(s => s.deleteOMRConfig)
  const addGradeScale = useExamStore(s => s.addGradeScale)
  const deleteGradeScale = useExamStore(s => s.deleteGradeScale)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('exams')

  // Exam Form
  const [showExamForm, setShowExamForm] = useState(false)
  const [editExam, setEditExam] = useState<ExamConfig | null>(null)
  const [examForm, setExamForm] = useState({ name: '', nameBn: '', type: 'semester-1' as ExamType, session: '2025-26', startDate: '', endDate: '' })

  // Subject Mark Distribution
  const [distClassId, setDistClassId] = useState('')
  const [distSubjectId, setDistSubjectId] = useState('')
  const [distFullMarks, setDistFullMarks] = useState('100')
  const [distPassMarks, setDistPassMarks] = useState('33')
  const [editDistConfig, setEditDistConfig] = useState<SubjectMarkConfig | null>(null)
  const [showSubExamForm, setShowSubExamForm] = useState(false)
  const [subExamForm, setSubExamForm] = useState({ name: '', nameBn: '', weight: '' })
  const [copyFromClassId, setCopyFromClassId] = useState('')
  const [showCopyConfirm, setShowCopyConfirm] = useState(false)

  // OMR Form
  const [showOMRForm, setShowOMRForm] = useState(false)
  const [editOMR, setEditOMR] = useState<OMRConfig | null>(null)
  const [omrForm, setOMRForm] = useState({ examId: '', subjectId: '', totalQuestions: '50', correctMark: '2', negativeMark: '0.5', optionCount: '4', sheetFormat: 'A' as 'A' | 'B' | 'C' | 'D' })

  // Grade Scale Form
  const [showGradeForm, setShowGradeForm] = useState(false)

  // Checklist
  const checklist = [
    { done: examConfigs.length > 0, label: isBn ? 'পরীক্ষা তৈরি হয়েছে' : 'Exam created' },
    { done: subjectMarkConfigs.length > 0, label: isBn ? 'বিষয় কনফিগার হয়েছে' : 'Subjects configured' },
    { done: subjectMarkConfigs.some(s => s.subExams.length > 0), label: isBn ? 'সাব-এক্সাম সেট আপ' : 'Sub-exams set up' },
    { done: gradeScales.length > 0, label: isBn ? 'গ্রেড স্কেল সেট আপ' : 'Grade scale configured' },
  ]
  const completionPct = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)

  const activeExam = useMemo(() => examConfigs.find(e => e.isActive) || null, [examConfigs])
  const classOptions = useMemo(() => getClassOptions(classes), [classes])

  const distConfigs = useMemo(() => {
    if (!activeExam) return []
    if (!distClassId) return subjectMarkConfigs.filter(s => s.examId === activeExam.id)
    return subjectMarkConfigs.filter(s => s.examId === activeExam.id && s.classId === distClassId)
  }, [subjectMarkConfigs, activeExam, distClassId])

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
    if (!activeExam || !distClassId || !distSubjectId || !distFullMarks) return
    upsertSubjectMarkConfig({
      examId: activeExam.id,
      classId: distClassId,
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

  const handleCopyConfig = () => {
    if (!activeExam || !copyFromClassId || !distClassId || copyFromClassId === distClassId) return
    copyClassMarkConfig(activeExam.id, copyFromClassId, distClassId)
    setShowCopyConfirm(false)
    setCopyFromClassId('')
  }

  const handleAddSubExam = () => {
    if (!editDistConfig || !subExamForm.name || !subExamForm.weight) return
    addSubExamToSubject(editDistConfig.id, { name: subExamForm.name, nameBn: subExamForm.nameBn || subExamForm.name, weight: Number(subExamForm.weight) || 0 })
    setSubExamForm({ name: '', nameBn: '', weight: '' })
    setShowSubExamForm(false)
  }

  const handleSaveOMR = () => {
    if (!omrForm.examId || !omrForm.subjectId) return
    upsertOMRConfig({
      examId: omrForm.examId,
      subjectId: omrForm.subjectId,
      totalQuestions: Number(omrForm.totalQuestions) || 50,
      correctMark: Number(omrForm.correctMark) || 2,
      negativeMark: Number(omrForm.negativeMark) || 0.5,
      optionCount: Number(omrForm.optionCount) || 4,
      sheetFormat: omrForm.sheetFormat,
    })
    setShowOMRForm(false)
    setEditOMR(null)
    setOMRForm({ examId: '', subjectId: '', totalQuestions: '50', correctMark: '2', negativeMark: '0.5', optionCount: '4', sheetFormat: 'A' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/exams')} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text-primary)]">{isBn ? 'ধাপ ১: পরিকল্পনা ও প্রস্তুতি' : 'Step 1: Planning & Preparation'}</h1>
            <p className="text-[11px] text-[var(--text-muted)]">{isBn ? 'পরীক্ষা সেটআপ, বিষয় কনফিগারেশন ও গ্রেড স্কেল' : 'Exam setup, subject configuration & grade scale'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-medium px-2 py-1 rounded-lg" style={{ color: completionPct === 100 ? 'var(--green)' : 'var(--amber)', background: completionPct === 100 ? 'var(--green-light)' : 'var(--amber-light)' }}>
            {completionPct}% {isBn ? 'সম্পন্ন' : 'Done'}
          </div>
          <button onClick={() => { setActiveSubTab('exams'); setShowExamForm(true); setEditExam(null); setExamForm({ name: '', nameBn: '', type: 'semester-1', session: '2025-26', startDate: '', endDate: '' }) }}
            className={btnPrimary}><Plus size={14} />{isBn ? 'নতুন পরীক্ষা' : 'New Exam'}</button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {([
          { key: 'exams' as SubTab, label: isBn ? 'পরীক্ষা' : 'Exams', icon: <ClipboardList size={14} /> },
          { key: 'subjects' as SubTab, label: isBn ? 'বিষয় কনফিগ' : 'Subject Config', icon: <BookOpen size={14} /> },
          { key: 'grade-scale' as SubTab, label: isBn ? 'গ্রেড স্কেল' : 'Grade Scale', icon: <Award size={14} /> },
          { key: 'omr' as SubTab, label: isBn ? 'OMR' : 'OMR Setup', icon: <ScanLine size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeSubTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Setup Checklist */}
        <div className={sectionCls}>
          <div className={sectionTitleCls}>
            <CheckCircle size={15} className="text-[var(--green)]" />{isBn ? 'সেটআপ চেকলিস্ট' : 'Setup Checklist'}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: item.done ? 'var(--green-light)' : 'var(--bg-secondary)', border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: item.done ? 'var(--green)' : 'var(--border)' }}>
                  {item.done && <CheckCircle size={10} color="#fff" />}
                </div>
                <span className="text-[11px]" style={{ color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: item.done ? 500 : 400 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ EXAMS TAB ═══ */}
        {activeSubTab === 'exams' && (
          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-[var(--text-secondary)]">{isBn ? `মোট ${examConfigs.length}টি পরীক্ষা` : `${examConfigs.length} exams`}</span>
            </div>
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
            {examConfigs.length === 0 && (
              <div className={`${sectionCls} text-center py-10`}>
                <ClipboardList size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'এখনো কোনো পরীক্ষা তৈরি হয়নি' : 'No exams created yet'}</p>
                <button onClick={() => { setShowExamForm(true); setExamForm({ name: '', nameBn: '', type: 'semester-1', session: '2025-26', startDate: '', endDate: '' }) }}
                  className={`${btnPrimary} mt-3 text-[11px]`}><Plus size={13} />{isBn ? 'প্রথম পরীক্ষা তৈরি' : 'Create First Exam'}</button>
              </div>
            )}
          </div>
        )}

        {/* ═══ SUBJECTS TAB ═══ */}
        {activeSubTab === 'subjects' && (
          <>
            {!activeExam ? (
              <div className={sectionCls}>
                <div className="text-center py-8">
                  <AlertTriangle size={28} className="mx-auto mb-2 text-[var(--amber)]" />
                  <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'প্রথমে একটি পরীক্ষা সক্রিয় করুন' : 'Please activate an exam first'}</p>
                  <button onClick={() => setActiveSubTab('exams')} className="mt-2 text-[12px] text-[var(--brand)] cursor-pointer hover:underline">{isBn ? 'পরীক্ষা তৈরি করুন' : 'Create Exam'}</button>
                </div>
              </div>
            ) : (
              <>
                {/* Class Selector */}
                <div className={sectionCls}>
                  <div className={sectionTitleCls}>
                    <Settings size={15} className="text-[var(--brand)]" />{isBn ? 'শ্রেণি নির্বাচন' : 'Select Class'}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                      <select value={distClassId} onChange={e => { setDistClassId(e.target.value); setDistSubjectId(''); setEditDistConfig(null) }} className={`${inputCls} w-full`}>
                        <option value="">{isBn ? 'শ্রেণি নির্বাচন...' : 'Select class...'}</option>
                        {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কপি করুন (শ্রেণি)' : 'Copy from class'}</label>
                        <select value={copyFromClassId} onChange={e => setCopyFromClassId(e.target.value)} className={`${inputCls} w-full`}>
                          <option value="">{isBn ? 'শ্রেণি নির্বাচন...' : 'Select class...'}</option>
                          {classOptions.filter(c => c !== distClassId).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <button onClick={() => { if (copyFromClassId && distClassId && copyFromClassId !== distClassId) setShowCopyConfirm(true) }}
                        disabled={!copyFromClassId || !distClassId || copyFromClassId === distClassId}
                        className={`py-2 px-3 rounded-lg border text-[11px] font-medium cursor-pointer ${copyFromClassId && distClassId && copyFromClassId !== distClassId ? 'bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] opacity-50 cursor-not-allowed'}`}>
                        {isBn ? 'কপি' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                {distClassId && (
                  <>
                    {/* Mark Distribution Form */}
                    <div className={sectionCls}>
                      <div className={sectionTitleCls}>
                        <Settings size={15} className="text-[var(--brand)]" />{isBn ? 'মার্ক ডিস্ট্রিবিউশন সেটআপ' : 'Mark Distribution Setup'}
                        <span className="ml-auto text-[10px] font-normal text-[var(--text-muted)]">{activeExam.nameBn || activeExam.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                          <select value={distSubjectId} onChange={e => {
                            setDistSubjectId(e.target.value)
                            const existing = subjectMarkConfigs.find(s => s.examId === activeExam.id && s.classId === distClassId && s.subjectId === e.target.value)
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
                      <button onClick={handleSaveDist} disabled={!distSubjectId} className={`${btnPrimary} text-[12px] mt-3 ${!distSubjectId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Save size={13} />{editDistConfig ? (isBn ? 'আপডেট' : 'Update') : (isBn ? 'সেভ করুন' : 'Save')}
                      </button>
                    </div>

                    {/* Configured Subjects */}
                    <div className={sectionCls}>
                      <div className={sectionTitleCls}>
                        <BookOpen size={15} className="text-[var(--teal)]" />{isBn ? 'কনফিগার্ড বিষয়সমূহ' : 'Configured Subjects'}
                        <span className="ml-auto text-[10px] font-normal text-[var(--text-muted)]">{distConfigs.length} {isBn ? 'টি বিষয়' : 'subjects'}</span>
                      </div>
                      {distConfigs.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                          {isBn ? 'এই শ্রেণিতে কোনো বিষয় কনফিগার করা হয়নি' : 'No subjects configured for this class'}
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
                                    <span className="text-[11px] text-[var(--text-muted)] ml-2">{config.fullMarks} / {isBn ? 'পাস' : 'Pass'}: {config.passMarks}</span>
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
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ═══ GRADE SCALE TAB ═══ */}
        {activeSubTab === 'grade-scale' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{isBn ? `মোট ${gradeScales.length}টি স্কেল` : `${gradeScales.length} scales`}</span>
              <button onClick={() => setShowGradeForm(true)} className={btnPrimary}><Plus size={14} />{isBn ? 'নতুন স্কেল' : 'New Scale'}</button>
            </div>
            {gradeScales.map(scale => (
              <div key={scale.id} className={sectionCls}>
                <div className="flex items-center justify-between mb-3">
                  <div className={sectionTitleCls}>
                    <Award size={15} className="text-[var(--purple)]" />{isBn ? scale.nameBn : scale.name}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteGradeScale(scale.id) }}
                      className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {scale.grades.map(g => (
                    <div key={g.grade} className="text-center p-2 rounded-lg" style={{ background: `${g.color}15` }}>
                      <div className="text-[14px] font-bold" style={{ color: g.color }}>{g.grade}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">≥{g.minPct}%</div>
                      <div className="text-[9px] text-[var(--text-muted)]">GPA {g.gpa}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {gradeScales.length === 0 && (
              <div className={`${sectionCls} text-center py-10`}>
                <Award size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'কোনো গ্রেড স্কেল নেই' : 'No grade scales configured'}</p>
              </div>
            )}
          </>
        )}

        {/* ═══ OMR TAB ═══ */}
        {activeSubTab === 'omr' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{isBn ? `মোট ${omrConfigs.length}টি OMR কনফিগ` : `${omrConfigs.length} OMR configs`}</span>
              <button onClick={() => { setShowOMRForm(true); setEditOMR(null); setOMRForm({ examId: '', subjectId: '', totalQuestions: '50', correctMark: '2', negativeMark: '0.5', optionCount: '4', sheetFormat: 'A' }) }}
                className={btnPrimary}><Plus size={14} />{isBn ? 'নতুন OMR' : 'New OMR'}</button>
            </div>
            {omrConfigs.map(config => {
              const subject = subjects.find(s => s.id === config.subjectId)
              const exam = examConfigs.find(e => e.id === config.examId)
              return (
                <div key={config.id} className={`${sectionCls} transition-all hover:shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ScanLine size={14} className="text-[var(--brand)]" />
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? subject?.nameBn : subject?.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] flex-wrap">
                        <span>{isBn ? 'পরীক্ষা' : 'Exam'}: {isBn ? exam?.nameBn : exam?.name}</span>
                        <span>{config.totalQuestions} {isBn ? 'টি প্রশ্ন' : 'questions'}</span>
                        <span>+{config.correctMark} / -{config.negativeMark}</span>
                        <span>{isBn ? 'ফরম্যাট' : 'Format'}: {config.sheetFormat}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditOMR(config); setOMRForm({ examId: config.examId, subjectId: config.subjectId, totalQuestions: String(config.totalQuestions), correctMark: String(config.correctMark), negativeMark: String(config.negativeMark), optionCount: String(config.optionCount), sheetFormat: config.sheetFormat }); setShowOMRForm(true) }}
                        className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteOMRConfig(config.id) }}
                        className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {omrConfigs.length === 0 && (
              <div className={`${sectionCls} text-center py-10`}>
                <ScanLine size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'কোনো OMR কনফিগ নেই' : 'No OMR configurations'}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ Exam Form Modal ═══ */}
      {showExamForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[420px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{editExam ? (isBn ? 'পরীক্ষা এডিট' : 'Edit Exam') : (isBn ? 'নতুন পরীক্ষা' : 'New Exam')}</h3>
              <button onClick={() => { setShowExamForm(false); setEditExam(null) }} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
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

      {/* ═══ Copy Config Confirmation Modal ═══ */}
      {showCopyConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2">{isBn ? 'মার্ক কনফিগ কপি' : 'Copy Mark Config'}</h3>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">
              {isBn
                ? `${copyFromClassId} থেকে ${distClassId} এ সব মার্ক কনফিগ কপি করা হবে। বিদ্যমান কনফিগ মুছে ফেলা হবে।`
                : `All mark configs from ${copyFromClassId} will be copied to ${distClassId}. Existing configs will be replaced.`}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCopyConfirm(false)} className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleCopyConfig} className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[12px] font-medium cursor-pointer">{isBn ? 'কপি করুন' : 'Copy'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Sub-Exam Form Modal ═══ */}
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

      {/* ═══ OMR Form Modal ═══ */}
      {showOMRForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[420px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{editOMR ? (isBn ? 'OMR এডিট' : 'Edit OMR') : (isBn ? 'নতুন OMR কনফিগ' : 'New OMR Config')}</h3>
              <button onClick={() => { setShowOMRForm(false); setEditOMR(null) }} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
                  <select value={omrForm.examId} onChange={e => setOMRForm(p => ({ ...p, examId: e.target.value }))} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {examConfigs.map(e => <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                  <select value={omrForm.subjectId} onChange={e => setOMRForm(p => ({ ...p, subjectId: e.target.value }))} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'মোট প্রশ্ন' : 'Total Q'}</label>
                  <input type="number" value={omrForm.totalQuestions} onChange={e => setOMRForm(p => ({ ...p, totalQuestions: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সঠিক' : 'Correct'}</label>
                  <input type="number" step="0.5" value={omrForm.correctMark} onChange={e => setOMRForm(p => ({ ...p, correctMark: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নেগেটিভ' : 'Negative'}</label>
                  <input type="number" step="0.5" value={omrForm.negativeMark} onChange={e => setOMRForm(p => ({ ...p, negativeMark: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'অপশন' : 'Options'}</label>
                  <select value={omrForm.optionCount} onChange={e => setOMRForm(p => ({ ...p, optionCount: e.target.value }))} className={`${inputCls} w-full`}>
                    <option value="4">4 (A-D)</option>
                    <option value="5">5 (A-E)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফরম্যাট' : 'Format'}</label>
                  <select value={omrForm.sheetFormat} onChange={e => setOMRForm(p => ({ ...p, sheetFormat: e.target.value as 'A' | 'B' | 'C' | 'D' }))} className={`${inputCls} w-full`}>
                    {['A', 'B', 'C', 'D'].map(f => <option key={f} value={f}>Sheet {f}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { setShowOMRForm(false); setEditOMR(null) }} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleSaveOMR} className={`${btnPrimary} text-[12px]`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Grade Scale Form Modal ═══ */}
      {showGradeForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[400px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{isBn ? 'গ্রেড স্কেল যোগ' : 'Add Grade Scale'}</h3>
              <button onClick={() => setShowGradeForm(false)} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] mb-3">
              {isBn ? 'ডিফল্ট গ্রেড স্কেল (A+ থেকে F) যোগ করা হবে।' : 'Default grade scale (A+ to F) will be added.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowGradeForm(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={() => {
                addGradeScale({
                  name: 'Default Scale', nameBn: 'ডিফল্ট স্কেল',
                  grades: [
                    { grade: 'A+', minPct: 80, gpa: 5.0, color: '#10b981' },
                    { grade: 'A', minPct: 70, gpa: 4.0, color: '#34d399' },
                    { grade: 'A-', minPct: 60, gpa: 3.5, color: '#6ee7b7' },
                    { grade: 'B', minPct: 50, gpa: 3.0, color: '#60a5fa' },
                    { grade: 'C', minPct: 40, gpa: 2.0, color: '#fbbf24' },
                    { grade: 'D', minPct: 33, gpa: 1.0, color: '#f97316' },
                    { grade: 'F', minPct: 0, gpa: 0.0, color: '#ef4444' },
                  ],
                })
                setShowGradeForm(false)
              }} className={`${btnPrimary} text-[12px]`}>{isBn ? 'যোগ করুন' : 'Add Scale'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
