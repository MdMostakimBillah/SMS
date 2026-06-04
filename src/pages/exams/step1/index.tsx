import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Settings,
  BookOpen,
  X,
  ClipboardList,
  Award,
  ScanLine,
  AlertTriangle,
  Copy,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions } from '@/store/classStore'
import { useExamStore } from '@/store/examStore'
import type { ExamConfig, ExamType, SubjectMarkConfig, OMRConfig as OMRExamConfig } from '@/store/examStore'
import { generateOMRSheet, type OMRConfig } from '@/pages/exams/omrTemplate'

const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] mb-[14px]'
const sectionTitleCls = 'flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]'
const inputCls =
  'h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border'
const btnPrimary =
  'flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]'

type SubTab = 'exams' | 'subjects' | 'grade-scale' | 'omr'

const EXAM_TYPE_LABELS: Record<ExamType, { en: string; bn: string }> = {
  'semester-1': { en: '1st Semester', bn: '১ম সেমিস্টার' },
  'semester-2': { en: '2nd Semester', bn: '২য় সেমিস্টার' },
  annual: { en: 'Annual', bn: 'বার্ষিক' },
  midterm: { en: 'Mid-term', bn: 'মধ্যবর্তী' },
  final: { en: 'Final', bn: 'চূড়ান্ত' },
  custom: { en: 'Custom', bn: 'কাস্টম' },
}

export default function Step1Planning() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const subjects = useTeacherStore((s) => s.subjects)
  const { classes } = useClassStore()
  const isBn = language === 'bn'

  const examConfigs = useExamStore((s) => s.examConfigs)
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const omrConfigs = useExamStore((s) => s.omrConfigs)
  const gradeScales = useExamStore((s) => s.gradeScales)
  const addExamConfig = useExamStore((s) => s.addExamConfig)
  const updateExamConfig = useExamStore((s) => s.updateExamConfig)
  const deleteExamConfig = useExamStore((s) => s.deleteExamConfig)
  const toggleExamActive = useExamStore((s) => s.toggleExamActive)
  const upsertSubjectMarkConfig = useExamStore((s) => s.upsertSubjectMarkConfig)
  const deleteSubjectMarkConfig = useExamStore((s) => s.deleteSubjectMarkConfig)
  const copyClassMarkConfig = useExamStore((s) => s.copyClassMarkConfig)
  const copySubjectConfig = useExamStore((s) => s.copySubjectConfig)
  const upsertOMRConfig = useExamStore((s) => s.upsertOMRConfig)
  const deleteOMRConfig = useExamStore((s) => s.deleteOMRConfig)
  const addGradeScale = useExamStore((s) => s.addGradeScale)
  const updateGradeScale = useExamStore((s) => s.updateGradeScale)
  const deleteGradeScale = useExamStore((s) => s.deleteGradeScale)
  const toggleGradeScaleActive = useExamStore((s) => s.toggleGradeScaleActive)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('exams')

  // Exam Form
  const [showExamForm, setShowExamForm] = useState(false)
  const [editExam, setEditExam] = useState<ExamConfig | null>(null)
  const [examForm, setExamForm] = useState({
    name: '',
    nameBn: '',
    type: 'semester-1' as ExamType,
    session: '2025-26',
    startDate: '',
    endDate: '',
  })

  // Subject Config
  const [distClassId, setDistClassId] = useState('')
  const [distSectionIds, setDistSectionIds] = useState<string[]>([])
  const [editDistConfig, setEditDistConfig] = useState<SubjectMarkConfig | null>(null)
  const [showSubExamForm, setShowSubExamForm] = useState(false)
  const [subExamForm, setSubExamForm] = useState({ name: '', nameBn: '', fullMarks: '', passMarks: '' })
  const [showCopyAllConfirm, setShowCopyAllConfirm] = useState(false)
  const [copyAllToClassId, setCopyAllToClassId] = useState('')
  const [showCopySubjectModal, setShowCopySubjectModal] = useState(false)
  const [copySourceSubjectId, setCopySourceSubjectId] = useState('')
  const [copyTargetSubjectIds, setCopyTargetSubjectIds] = useState<string[]>([])

  // OMR Form
  const [showOMRForm, setShowOMRForm] = useState(false)
  const [editOMR, setEditOMR] = useState<OMRExamConfig | null>(null)
  const [omrForm, setOMRForm] = useState({
    examId: '',
    subjectId: '',
    totalQuestions: '50',
    correctMark: '2',
    negativeMark: '0.5',
    optionCount: '4',
    sheetFormat: 'A' as 'A' | 'B' | 'C' | 'D',
  })

  // OMR Download Modal
  const [showOMRDownload, setShowOMRDownload] = useState(false)
  const [omrDownloadConfig, setOmrDownloadConfig] = useState<OMRExamConfig | null>(null)
  const [omrOpts, setOmrOpts] = useState<Partial<OMRConfig>>({
    totalQuestions: 50,
    optionCount: 4,
    showRollNo: true,
    showRegistrationNo: true,
    showSetCode: true,
    showSubjectCode: true,
    sheetFormat: 'A',
  })

  // Grade Scale Form
  const [showGradeForm, setShowGradeForm] = useState(false)
  const [editGradeScaleId, setEditGradeScaleId] = useState<string | null>(null)
  const [gradeForm, setGradeForm] = useState({ name: '', nameBn: '' })
  const [gradeRows, setGradeRows] = useState([
    { grade: 'A+', minPct: '80', gpa: '5.0', color: '#10b981' },
    { grade: 'A', minPct: '70', gpa: '4.0', color: '#34d399' },
    { grade: 'A-', minPct: '60', gpa: '3.5', color: '#6ee7b7' },
    { grade: 'B', minPct: '50', gpa: '3.0', color: '#60a5fa' },
    { grade: 'C', minPct: '40', gpa: '2.0', color: '#fbbf24' },
    { grade: 'D', minPct: '33', gpa: '1.0', color: '#f97316' },
    { grade: 'F', minPct: '0', gpa: '0.0', color: '#ef4444' },
  ])

  // Checklist
  const checklist = useMemo(() => {
    const totalSubjects = subjects.length || 1
    const allConfigs = subjectMarkConfigs
    const uniqueClassIds = new Set(allConfigs.map((c) => c.classId))
    const classesWithConfigs = uniqueClassIds.size || 1
    const totalConfigured = allConfigs.length
    const totalExpected = classesWithConfigs * totalSubjects
    const subjectPct = totalExpected > 0 ? Math.round((totalConfigured / totalExpected) * 100) : 0
    return [
      { done: examConfigs.length > 0, label: isBn ? 'পরীক্ষা তৈরি হয়েছে' : 'Exam created' },
      {
        done: subjectMarkConfigs.length > 0,
        label: isBn ? `বিষয় কনফিগ (${subjectPct}%)` : `Subjects configured (${subjectPct}%)`,
        pct: subjectPct,
      },
      { done: subjectMarkConfigs.some((s) => s.subExams.length > 0), label: isBn ? 'সাব-এক্সাম সেট আপ' : 'Sub-exams set up' },
      { done: gradeScales.length > 0, label: isBn ? 'গ্রেড স্কেল সেট আপ' : 'Grade scale configured' },
    ]
  }, [examConfigs, subjectMarkConfigs, gradeScales, subjects, isBn])
  const completionPct = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)

  const activeExam = useMemo(() => examConfigs.find((e) => e.isActive) || null, [examConfigs])
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const selectedClassObj = useMemo(() => classes.find((c) => c.name === distClassId) || null, [classes, distClassId])
  const selectedClassSections = useMemo(() => selectedClassObj?.sections || [], [selectedClassObj])

  const classSubjects = useMemo(() => {
    if (!selectedClassObj) return []
    const sectionSubjectIds = new Set<string>()
    selectedClassObj.sections.forEach((sec) => {
      ;(sec.subjectIds || []).forEach((id) => sectionSubjectIds.add(id))
    })
    const sourceIds = sectionSubjectIds.size > 0 ? sectionSubjectIds : new Set(selectedClassObj.subjectIds || [])
    if (sourceIds.size === 0) return []
    return subjects.filter((s) => sourceIds.has(s.id))
  }, [selectedClassObj, subjects])

  const filteredSubjects = useMemo(() => {
    if (distSectionIds.length === 0) return classSubjects
    const sectionSubjectIds = new Set<string>()
    selectedClassObj?.sections.forEach((sec) => {
      if (distSectionIds.includes(sec.name)) {
        ;(sec.subjectIds || []).forEach((id) => sectionSubjectIds.add(id))
      }
    })
    if (sectionSubjectIds.size === 0) return classSubjects
    return subjects.filter((s) => sectionSubjectIds.has(s.id))
  }, [classSubjects, distSectionIds, selectedClassObj, subjects])

  const toggleSection = (secName: string) => {
    setDistSectionIds((prev) => (prev.includes(secName) ? prev.filter((s) => s !== secName) : [...prev, secName]))
  }

  const distConfigs = useMemo(() => {
    if (!activeExam) return []
    if (!distClassId) return subjectMarkConfigs.filter((s) => s.examId === activeExam.id)
    return subjectMarkConfigs.filter((s) => s.examId === activeExam.id && s.classId === distClassId)
  }, [subjectMarkConfigs, activeExam, distClassId])

  const allSubjectsForClass = useMemo(() => {
    return filteredSubjects
      .map((sub) => {
        const existing = distConfigs.find((c) => c.subjectId === sub.id)
        return { subject: sub, config: existing || null }
      })
      .sort((a, b) => (isBn ? a.subject.nameBn : a.subject.name).localeCompare(isBn ? b.subject.nameBn : b.subject.name))
  }, [filteredSubjects, distConfigs, isBn])

  const examClassStats = useMemo(() => {
    return examConfigs.map((exam) => {
      const examConfigsForClass = subjectMarkConfigs.filter((c) => c.examId === exam.id)
      const classIds = [...new Set(examConfigsForClass.map((c) => c.classId))]
      const cStats = classIds.map((classId) => {
        const cls = classes.find((c) => c.id === classId)
        const configs = examConfigsForClass.filter((c) => c.classId === classId)
        const total = configs.length
        const configured = configs.filter((c) => c.fullMarks > 0).length
        return { classId: cls?.name || classId, pct: total > 0 ? Math.round((configured / total) * 100) : 0, configured, total }
      })
      const overallPct = cStats.length > 0 ? Math.round(cStats.reduce((s, c) => s + c.pct, 0) / cStats.length) : 0
      return { examId: exam.id, classStats: cStats, overallPct }
    })
  }, [examConfigs, subjectMarkConfigs, classes])

  const handleCopyAll = () => {
    if (!activeExam || !copyAllToClassId || !distClassId || copyAllToClassId === distClassId) return
    copyClassMarkConfig(activeExam.id, distClassId, copyAllToClassId)
    setShowCopyAllConfirm(false)
    setCopyAllToClassId('')
  }

  const handleCopySubjectConfig = () => {
    if (!activeExam || !distClassId || !copySourceSubjectId || copyTargetSubjectIds.length === 0) return
    copySubjectConfig(activeExam.id, distClassId, copySourceSubjectId, copyTargetSubjectIds)
    setShowCopySubjectModal(false)
    setCopySourceSubjectId('')
    setCopyTargetSubjectIds([])
  }

  const subjectsWithConfig = useMemo(() => {
    if (!activeExam) return []
    return filteredSubjects.filter((s) => {
      const cfg = distConfigs.find((c) => c.subjectId === s.id)
      return cfg && cfg.subExams.length > 0
    })
  }, [filteredSubjects, distConfigs, activeExam])

  const subjectsWithoutConfig = useMemo(() => {
    if (!activeExam || !copySourceSubjectId) return []
    return filteredSubjects.filter(
      (s) => s.id !== copySourceSubjectId && !distConfigs.some((c) => c.subjectId === s.id && c.subExams.length > 0)
    )
  }, [filteredSubjects, distConfigs, activeExam, copySourceSubjectId])

  const handleAddSubExam = () => {
    if (!editDistConfig || !subExamForm.name || !subExamForm.fullMarks) return
    const fullMarks = Number(subExamForm.fullMarks) || 0
    const passMarks = Number(subExamForm.passMarks) || 0
    if (fullMarks <= 0) return
    const newSub = { name: subExamForm.name, nameBn: subExamForm.nameBn || subExamForm.name, fullMarks, passMarks }
    const newSubExams = [...editDistConfig.subExams, { ...newSub, id: `SE-${Date.now()}` }]
    const totalFull = newSubExams.reduce((sum, se) => sum + se.fullMarks, 0)
    const totalPass = newSubExams.reduce((sum, se) => sum + se.passMarks, 0)
    upsertSubjectMarkConfig({
      examId: editDistConfig.examId,
      classId: editDistConfig.classId,
      subjectId: editDistConfig.subjectId,
      fullMarks: totalFull,
      passMarks: totalPass,
      subExams: newSubExams,
    })
    setEditDistConfig({
      ...editDistConfig,
      id: editDistConfig.id || `SMC-${Date.now()}`,
      subExams: newSubExams,
      fullMarks: totalFull,
      passMarks: totalPass,
    })
    setSubExamForm({ name: '', nameBn: '', fullMarks: '', passMarks: '' })
    setShowSubExamForm(false)
  }

  const handleQuickSetupSubExams = (config: SubjectMarkConfig) => {
    const defaults = [
      { id: `SE-${Date.now()}-1`, name: 'CQ', nameBn: 'সিকিউ', fullMarks: 0, passMarks: 0 },
      { id: `SE-${Date.now()}-2`, name: 'MCQ', nameBn: 'এমসিকিউ', fullMarks: 0, passMarks: 0 },
      { id: `SE-${Date.now()}-3`, name: 'Oral', nameBn: 'মৌখিক', fullMarks: 0, passMarks: 0 },
    ]
    upsertSubjectMarkConfig({
      examId: config.examId,
      classId: config.classId,
      subjectId: config.subjectId,
      fullMarks: 0,
      passMarks: 0,
      subExams: defaults,
    })
  }

  const handleRemoveSubExam = (configId: string, subExamId: string) => {
    const cfg = subjectMarkConfigs.find((c) => c.id === configId)
    if (!cfg) return
    const newSubExams = cfg.subExams.filter((se) => se.id !== subExamId)
    const totalFull = newSubExams.reduce((sum, se) => sum + se.fullMarks, 0)
    const totalPass = newSubExams.reduce((sum, se) => sum + se.passMarks, 0)
    upsertSubjectMarkConfig({
      examId: cfg.examId,
      classId: cfg.classId,
      subjectId: cfg.subjectId,
      fullMarks: totalFull,
      passMarks: totalPass,
      subExams: newSubExams,
    })
  }

  const calcSubExamTotals = (subExams: { fullMarks: number; passMarks: number }[]) => {
    const totalFull = subExams.reduce((sum, se) => sum + se.fullMarks, 0)
    const totalPass = subExams.reduce((sum, se) => sum + se.passMarks, 0)
    return { totalFull, totalPass }
  }

  const handleSaveExam = () => {
    if (!examForm.name) return
    if (editExam) {
      updateExamConfig(editExam.id, {
        name: examForm.name,
        nameBn: examForm.nameBn || examForm.name,
        type: examForm.type,
        session: examForm.session,
        startDate: examForm.startDate,
        endDate: examForm.endDate,
      })
    } else {
      addExamConfig({
        name: examForm.name,
        nameBn: examForm.nameBn || examForm.name,
        type: examForm.type,
        session: examForm.session,
        startDate: examForm.startDate,
        endDate: examForm.endDate,
        isActive: false,
      })
    }
    setShowExamForm(false)
    setEditExam(null)
    setExamForm({ name: '', nameBn: '', type: 'semester-1', session: '2025-26', startDate: '', endDate: '' })
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
    setOMRForm({
      examId: '',
      subjectId: '',
      totalQuestions: '50',
      correctMark: '2',
      negativeMark: '0.5',
      optionCount: '4',
      sheetFormat: 'A',
    })
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
            <h1 className="text-[16px] font-bold text-[var(--text-primary)]">
              {isBn ? 'ধাপ ১: পরিকল্পনা ও প্রস্তুতি' : 'Step 1: Planning & Preparation'}
            </h1>
            <p className="text-[11px] text-[var(--text-muted)]">
              {isBn ? 'পরীক্ষা সেটআপ, বিষয় কনফিগারেশন ও গ্রেড স্কেল' : 'Exam setup, subject configuration & grade scale'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="text-[11px] font-medium px-2 py-1 rounded-lg"
            style={{
              color: completionPct === 100 ? 'var(--green)' : 'var(--amber)',
              background: completionPct === 100 ? 'var(--green-light)' : 'var(--amber-light)',
            }}
          >
            {completionPct}% {isBn ? 'সম্পন্ন' : 'Done'}
          </div>
          <button
            onClick={() => {
              setActiveSubTab('exams')
              setShowExamForm(true)
              setEditExam(null)
              setExamForm({ name: '', nameBn: '', type: 'semester-1', session: '2025-26', startDate: '', endDate: '' })
            }}
            className={btnPrimary}
          >
            <Plus size={14} />
            {isBn ? 'নতুন পরীক্ষা' : 'New Exam'}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {[
          { key: 'exams' as SubTab, label: isBn ? 'পরীক্ষা' : 'Exams', icon: <ClipboardList size={14} /> },
          { key: 'subjects' as SubTab, label: isBn ? 'বিষয় কনফিগ' : 'Subject Config', icon: <BookOpen size={14} /> },
          { key: 'grade-scale' as SubTab, label: isBn ? 'গ্রেড স্কেল' : 'Grade Scale', icon: <Award size={14} /> },
          { key: 'omr' as SubTab, label: isBn ? 'OMR' : 'OMR Setup', icon: <ScanLine size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeSubTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Setup Checklist */}
        <div className={sectionCls}>
          <div className={sectionTitleCls}>
            <CheckCircle size={15} className="text-[var(--green)]" />
            {isBn ? 'সেটআপ চেকলিস্ট' : 'Setup Checklist'}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {checklist.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{
                  background: item.done ? 'var(--green-light)' : 'var(--bg-secondary)',
                  border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: item.done ? 'var(--green)' : 'var(--border)' }}
                >
                  {item.done && <CheckCircle size={10} color="#fff" />}
                </div>
                <span
                  className="text-[11px]"
                  style={{ color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: item.done ? 500 : 400 }}
                >
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
              <span className="text-[12px] text-[var(--text-secondary)]">
                {isBn ? `মোট ${examConfigs.length}টি পরীক্ষা` : `${examConfigs.length} exams`}
              </span>
            </div>
            {examConfigs.map((exam) => {
              const stats = examClassStats.find((s) => s.examId === exam.id)
              const classStats = stats?.classStats || []
              const overallPct = stats?.overallPct || 0
              return (
                <div key={exam.id} className={`${sectionCls} transition-all hover:shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? exam.nameBn : exam.name}</span>
                        <span
                          className={`text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium ${
                            exam.type === 'semester-1'
                              ? 'bg-[#dbeafe] text-[#1d4ed8]'
                              : exam.type === 'semester-2'
                                ? 'bg-[#fef3c7] text-[#b45309]'
                                : exam.type === 'annual'
                                  ? 'bg-[#dcfce7] text-[#15803d]'
                                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                          }`}
                        >
                          {isBn ? EXAM_TYPE_LABELS[exam.type].bn : EXAM_TYPE_LABELS[exam.type].en}
                        </span>
                        {exam.isActive && (
                          <span className="text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium bg-[var(--green-light)] text-[var(--green)]">
                            {isBn ? 'সক্রিয়' : 'Active'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] flex-wrap">
                        <span>
                          {isBn ? 'সেশন' : 'Session'}: {exam.session}
                        </span>
                        <span>
                          {exam.startDate} – {exam.endDate}
                        </span>
                      </div>
                      {/* Subject config summary */}
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md ${overallPct === 100 ? 'bg-[var(--green-light)] text-[var(--green)]' : overallPct > 0 ? 'bg-[var(--amber-light)] text-[var(--amber)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}
                        >
                          {overallPct === 100 ? <CheckCircle size={11} /> : <Settings size={11} />}
                          {isBn ? 'বিষয় কনফিগ' : 'Subjects Config'}
                          <span className="font-bold">{overallPct}%</span>
                        </div>
                      </div>
                      {/* Per-class breakdown */}
                      {classStats.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {classStats.map((cs) => (
                            <div
                              key={cs.classId}
                              className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border ${cs.pct === 100 ? 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]' : cs.pct > 0 ? 'border-[var(--amber)] bg-[var(--amber-light)] text-[var(--amber)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}
                            >
                              {cs.pct === 100 ? <CheckCircle size={9} /> : <Settings size={9} />}
                              {cs.classId}: {cs.configured}/{cs.total} ({cs.pct}%)
                            </div>
                          ))}
                        </div>
                      )}
                      {classStats.length === 0 && (
                        <div className="mt-2 text-[10px] text-[var(--text-muted)] italic">
                          {isBn ? 'কোনো বিষয় কনফিগার হয়নি' : 'No subjects configured yet'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleExamActive(exam.id)}
                        className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer ${exam.isActive ? 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}
                      >
                        <CheckCircle size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setEditExam(exam)
                          setExamForm({
                            name: exam.name,
                            nameBn: exam.nameBn,
                            type: exam.type,
                            session: exam.session,
                            startDate: exam.startDate,
                            endDate: exam.endDate,
                          })
                          setShowExamForm(true)
                        }}
                        className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(isBn ? 'এই পরীক্ষা মুছে ফেলবেন?' : 'Delete this exam?')) deleteExamConfig(exam.id)
                        }}
                        className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {examConfigs.length === 0 && (
              <div className={`${sectionCls} text-center py-10`}>
                <ClipboardList size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'এখনো কোনো পরীক্ষা তৈরি হয়নি' : 'No exams created yet'}</p>
                <button
                  onClick={() => {
                    setShowExamForm(true)
                    setExamForm({ name: '', nameBn: '', type: 'semester-1', session: '2025-26', startDate: '', endDate: '' })
                  }}
                  className={`${btnPrimary} mt-3 text-[11px]`}
                >
                  <Plus size={13} />
                  {isBn ? 'প্রথম পরীক্ষা তৈরি' : 'Create First Exam'}
                </button>
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
                  <p className="text-[13px] text-[var(--text-muted)]">
                    {isBn ? 'প্রথমে একটি পরীক্ষা সক্রিয় করুন' : 'Please activate an exam first'}
                  </p>
                  <button
                    onClick={() => setActiveSubTab('exams')}
                    className="mt-2 text-[12px] text-[var(--brand)] cursor-pointer hover:underline"
                  >
                    {isBn ? 'পরীক্ষা তৈরি করুন' : 'Create Exam'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Class Selector */}
                <div className={sectionCls}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={sectionTitleCls}>
                      <Settings size={15} className="text-[var(--brand)]" />
                      {isBn ? 'শ্রেণি ও সেকশন নির্বাচন' : 'Select Class & Section'}
                    </div>
                    {distClassId && distConfigs.length > 0 && (
                      <div className="flex items-center gap-2">
                        {subjectsWithConfig.length > 0 && (
                          <button
                            onClick={() => {
                              setCopySourceSubjectId(subjectsWithConfig[0]?.id || '')
                              setCopyTargetSubjectIds([])
                              setShowCopySubjectModal(true)
                            }}
                            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)] text-[11px] font-medium cursor-pointer"
                          >
                            <ClipboardList size={12} />
                            {isBn ? 'বিষয়ে কপি' : 'Copy to Subjects'}
                          </button>
                        )}
                        <button
                          onClick={() => setShowCopyAllConfirm(true)}
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--green-light)] text-[var(--green)] border border-[var(--green)] text-[11px] font-medium cursor-pointer"
                        >
                          <Copy size={12} />
                          {isBn ? 'শ্রেণিতে কপি' : 'Copy to Class'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Class Cards */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {classOptions.map((c) => {
                      const isActive = distClassId === c
                      const clsObj = classes.find((cl) => cl.name === c)
                      const secCount = clsObj?.sections.length || 0
                      const cfgCount = subjectMarkConfigs.filter((s) => s.examId === activeExam?.id && s.classId === c).length
                      return (
                        <button
                          key={c}
                          onClick={() => {
                            setDistClassId(c)
                            setDistSectionIds([])
                            setEditDistConfig(null)
                          }}
                          className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all ${isActive ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-md' : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--brand)] hover:shadow-sm text-[var(--text-primary)]'}`}
                        >
                          <div className={`text-[12px] font-bold ${isActive ? 'text-white' : 'text-[var(--text-primary)]'}`}>{c}</div>
                          <div className={`text-[9px] mt-0.5 ${isActive ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                            {secCount > 0 ? `${secCount} ${isBn ? 'সেকশন' : 'sec'}` : isBn ? 'সেকশন নেই' : 'No sec'}
                          </div>
                          {cfgCount > 0 && (
                            <div
                              className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--green-light)] text-[var(--green)]'}`}
                            >
                              {cfgCount}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Section Chips */}
                  {distClassId && selectedClassSections.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <div className="text-[10px] font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                        {isBn ? 'সেকশন নির্বাচন করুন' : 'Select Sections'}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedClassSections.map((sec) => {
                          const isSelected = distSectionIds.includes(sec.name)
                          return (
                            <button
                              key={sec.id}
                              onClick={() => toggleSection(sec.name)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer transition-all ${isSelected ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--brand)]'}`}
                            >
                              {isBn ? `সেকশন ${sec.name}` : `Section ${sec.name}`}
                              <span className="ml-1 text-[9px] opacity-60">({sec.seatQuantity})</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {distClassId && (
                  <>
                    {/* All Subjects Table */}
                    <div className={sectionCls}>
                      <div className="flex items-center justify-between mb-3">
                        <div className={sectionTitleCls}>
                          <BookOpen size={15} className="text-[var(--teal)]" />
                          {isBn ? 'সকল বিষয়' : 'All Subjects'}
                          <span className="ml-2 text-[10px] font-normal text-[var(--text-muted)]">
                            {distConfigs.length}/{filteredSubjects.length} {isBn ? 'কনফিগার্ড' : 'configured'}
                          </span>
                        </div>
                      </div>

                      {/* Table Header */}
                      <div
                        className="grid gap-2 pb-2 border-b border-[var(--border)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
                        style={{ gridTemplateColumns: '24px 1fr 1fr 90px 44px' }}
                      >
                        <div className="text-center">#</div>
                        <div>{isBn ? 'বিষয়' : 'Subject'}</div>
                        <div>{isBn ? 'সাব-এক্সাম' : 'Sub-Exams'}</div>
                        <div className="text-center">{isBn ? 'মোট মার্কস' : 'Total Marks'}</div>
                        <div className="text-center">{isBn ? 'অ্যাকশন' : 'Action'}</div>
                      </div>

                      {/* Table Rows */}
                      <div className="divide-y divide-[var(--border)]">
                        {allSubjectsForClass.map(({ subject, config }, idx) => {
                          const totals = config ? calcSubExamTotals(config.subExams) : null
                          const isOver = totals ? totals.totalFull > 100 : false
                          return (
                            <div
                              key={subject.id}
                              className={`transition-colors ${config && config.subExams.length > 0 ? 'bg-[var(--green-light)]/30' : 'hover:bg-[var(--bg-secondary)]'}`}
                            >
                              <div className="grid items-center gap-2 py-2" style={{ gridTemplateColumns: '24px 1fr 1fr 90px 44px' }}>
                                <div className="text-center text-[10px] text-[var(--text-muted)]">{idx + 1}</div>
                                <div className="min-w-0">
                                  <div className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                                    {isBn ? subject.nameBn : subject.name}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 items-center">
                                  {config && config.subExams.length > 0 ? (
                                    config.subExams.map((se) => (
                                      <span
                                        key={se.id}
                                        className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-md bg-[var(--brand-light)] text-[var(--brand)] font-medium"
                                      >
                                        {isBn ? se.nameBn : se.name}: {se.fullMarks}/{se.passMarks}
                                        <button
                                          onClick={() => handleRemoveSubExam(config.id, se.id)}
                                          className="ml-0.5 text-[var(--brand)] hover:text-[var(--red)] cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[9px] text-[var(--text-muted)] italic">
                                      {isBn ? 'সাব-এক্সাম যোগ করুন' : 'Add sub-exams'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-center">
                                  {totals && totals.totalFull > 0 ? (
                                    <div className="flex flex-col items-center">
                                      <span className={`text-[12px] font-bold ${isOver ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
                                        {totals.totalFull}/{totals.totalPass}
                                      </span>
                                      {isOver && (
                                        <span className="text-[8px] text-[var(--red)] font-bold">⚠ {isBn ? '১০০+!' : '100+!'}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-[var(--text-muted)]">—</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditDistConfig(
                                        config || {
                                          id: '',
                                          examId: activeExam!.id,
                                          classId: distClassId,
                                          subjectId: subject.id,
                                          fullMarks: 0,
                                          passMarks: 0,
                                          subExams: [],
                                        }
                                      )
                                      setShowSubExamForm(true)
                                    }}
                                    className="w-6 h-6 rounded bg-[var(--brand)] flex items-center justify-center cursor-pointer text-white border-none hover:shadow-sm"
                                    title={isBn ? 'সাব-এক্সাম যোগ' : 'Add Sub-Exam'}
                                  >
                                    <Plus size={10} />
                                  </button>
                                  {config && (
                                    <button
                                      onClick={() => {
                                        if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteSubjectMarkConfig(config.id)
                                      }}
                                      className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                                      title={isBn ? 'মুছুন' : 'Delete'}
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Sub-exam action row */}
                              {config && config.subExams.length === 0 && (
                                <div className="flex items-center gap-2 pb-2 -mt-1">
                                  <div className="w-6" />
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <button
                                      onClick={() => {
                                        setEditDistConfig(config)
                                        setShowSubExamForm(true)
                                      }}
                                      className="inline-flex items-center gap-1 text-[9px] px-2 py-1 rounded-md bg-[var(--brand)] text-white border-none cursor-pointer font-medium hover:shadow-sm"
                                    >
                                      <Plus size={9} />
                                      {isBn ? 'সাব-এক্সাম যোগ' : 'Add Sub-Exam'}
                                    </button>
                                    <button
                                      onClick={() => handleQuickSetupSubExams(config)}
                                      className="inline-flex items-center gap-1 text-[9px] px-2 py-1 rounded-md bg-[var(--teal-light)] text-[var(--teal)] border border-[var(--teal)] cursor-pointer font-medium hover:shadow-sm"
                                    >
                                      <Zap size={9} />
                                      {isBn ? 'দ্রুত সেটআপ (CQ+MCQ+Oral)' : 'Quick Setup (CQ+MCQ+Oral)'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {filteredSubjects.length === 0 && (
                        <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                          {isBn
                            ? 'এই শ্রেণিতে কোনো বিষয় নেই। ক্লাস ম্যানেজমেন্টে সেকশনে বিষয় যোগ করুন।'
                            : 'No subjects for this class. Add subjects to sections in Class Management.'}
                        </div>
                      )}
                    </div>

                    {/* Sub-exam Form Modal */}
                    {showSubExamForm && editDistConfig && (
                      <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSubExamForm(false)}
                      >
                        <div
                          className="bg-[var(--bg-primary)] rounded-2xl p-5 w-full max-w-sm shadow-xl border border-[var(--border)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[14px] font-bold text-[var(--text-primary)]">
                              {isBn ? 'সাব-এক্সাম যোগ' : 'Add Sub-Exam'}
                            </span>
                            <button
                              onClick={() => setShowSubExamForm(false)}
                              className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mb-3">
                            {(() => {
                              const sub = subjects.find((s) => s.id === editDistConfig.subjectId)
                              return sub ? `${isBn ? sub.nameBn : sub.name}` : ''
                            })()}
                          </div>
                          {/* Quick name buttons */}
                          <div className="flex gap-1.5 mb-3">
                            {(['CQ', 'MCQ', 'Oral', 'Practical'] as const).map((name) => {
                              const nameBn =
                                name === 'CQ' ? 'সিকিউ' : name === 'MCQ' ? 'এমসিকিউ' : name === 'Oral' ? 'মৌখিক' : 'প্র্যাকটিক্যাল'
                              const alreadyAdded = editDistConfig.subExams.some((e) => e.name === name)
                              return (
                                <button
                                  key={name}
                                  disabled={alreadyAdded}
                                  onClick={() => setSubExamForm((p) => ({ ...p, name, nameBn }))}
                                  className={`flex-1 py-2 rounded-lg text-[10px] font-semibold border cursor-pointer ${alreadyAdded ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] opacity-50 cursor-not-allowed' : subExamForm.name === name ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand)] hover:shadow-sm'}`}
                                >
                                  {name}
                                </button>
                              )
                            })}
                          </div>
                          <div className="border-t border-[var(--border)] pt-3">
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  value={subExamForm.name}
                                  onChange={(e) => setSubExamForm((p) => ({ ...p, name: e.target.value }))}
                                  placeholder={isBn ? 'নাম (EN)' : 'Name (EN)'}
                                  className={`${inputCls} w-full`}
                                />
                                <input
                                  value={subExamForm.nameBn}
                                  onChange={(e) => setSubExamForm((p) => ({ ...p, nameBn: e.target.value }))}
                                  placeholder={isBn ? 'নাম (BN)' : 'Name (BN)'}
                                  className={`${inputCls} w-full`}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] text-[var(--text-muted)] block mb-0.5">
                                    {isBn ? 'ফুল মার্কস' : 'Full Marks'}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={subExamForm.fullMarks}
                                    onChange={(e) => setSubExamForm((p) => ({ ...p, fullMarks: e.target.value }))}
                                    placeholder="e.g. 70"
                                    className={`${inputCls} w-full`}
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-[var(--text-muted)] block mb-0.5">
                                    {isBn ? 'পাস মার্কস' : 'Pass Marks'}
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={subExamForm.passMarks}
                                    onChange={(e) => setSubExamForm((p) => ({ ...p, passMarks: e.target.value }))}
                                    placeholder="e.g. 23"
                                    className={`${inputCls} w-full`}
                                  />
                                </div>
                              </div>
                              <button
                                onClick={handleAddSubExam}
                                disabled={!subExamForm.name || !subExamForm.fullMarks}
                                className={`${btnPrimary} w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                {isBn ? 'যোগ করুন' : 'Add'}
                              </button>
                            </div>
                          </div>
                          {editDistConfig.subExams.length > 0 &&
                            (() => {
                              const { totalFull, totalPass } = calcSubExamTotals(editDistConfig.subExams)
                              const isOver = totalFull > 100
                              return (
                                <div
                                  className={`mt-3 p-2 rounded-lg text-[11px] text-center font-semibold ${isOver ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--green-light)] text-[var(--green)]'}`}
                                >
                                  {isBn ? 'মোট' : 'Total'}: {totalFull} {isBn ? 'ফুল' : 'Full'} / {totalPass} {isBn ? 'পাস' : 'Pass'}
                                  {isOver && <span className="ml-2">⚠ {isBn ? '১০০ এর বেশি!' : 'Over 100!'}</span>}
                                </div>
                              )
                            })()}
                        </div>
                      </div>
                    )}
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
              <span className="text-[12px] text-[var(--text-secondary)]">
                {isBn ? `মোট ${gradeScales.length}টি স্কেল` : `${gradeScales.length} scales`}
              </span>
              <button onClick={() => setShowGradeForm(true)} className={btnPrimary}>
                <Plus size={14} />
                {isBn ? 'নতুন স্কেল' : 'New Scale'}
              </button>
            </div>
            {gradeScales.map((scale) => (
              <div key={scale.id} className={`${sectionCls} ${scale.isActive ? 'ring-2 ring-[var(--green)] shadow-md' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={sectionTitleCls}>
                    <Award size={15} className={scale.isActive ? 'text-[var(--green)]' : 'text-[var(--purple)]'} />
                    {isBn ? scale.nameBn : scale.name}
                    {scale.isActive && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--green-light)] text-[var(--green)] font-semibold ml-2">
                        {isBn ? 'সক্রিয়' : 'Active'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!scale.isActive && (
                      <button
                        onClick={() => toggleGradeScaleActive(scale.id)}
                        className="text-[9px] px-2 py-1 rounded-md bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)] cursor-pointer font-medium hover:shadow-sm"
                      >
                        {isBn ? 'সক্রিয় করুন' : 'Set Active'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditGradeScaleId(scale.id)
                        setGradeForm({ name: scale.name, nameBn: scale.nameBn })
                        setGradeRows(
                          scale.grades.map((g) => ({ grade: g.grade, minPct: String(g.minPct), gpa: String(g.gpa), color: g.color }))
                        )
                        setShowGradeForm(true)
                      }}
                      className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteGradeScale(scale.id)
                      }}
                      className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {scale.grades.map((g) => (
                    <div key={g.grade} className="text-center p-2 rounded-lg" style={{ background: `${g.color}15` }}>
                      <div className="text-[14px] font-bold" style={{ color: g.color }}>
                        {g.grade}
                      </div>
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
              <span className="text-[12px] text-[var(--text-secondary)]">
                {isBn ? `মোট ${omrConfigs.length}টি OMR কনফিগ` : `${omrConfigs.length} OMR configs`}
              </span>
              <button
                onClick={() => {
                  setShowOMRForm(true)
                  setEditOMR(null)
                  setOMRForm({
                    examId: '',
                    subjectId: '',
                    totalQuestions: '50',
                    correctMark: '2',
                    negativeMark: '0.5',
                    optionCount: '4',
                    sheetFormat: 'A',
                  })
                }}
                className={btnPrimary}
              >
                <Plus size={14} />
                {isBn ? 'নতুন OMR' : 'New OMR'}
              </button>
            </div>
            {omrConfigs.map((config) => {
              const subject = subjects.find((s) => s.id === config.subjectId)
              const exam = examConfigs.find((e) => e.id === config.examId)
              return (
                <div key={config.id} className={`${sectionCls} transition-all hover:shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ScanLine size={14} className="text-[var(--brand)]" />
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                          {isBn ? subject?.nameBn : subject?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] flex-wrap">
                        <span>
                          {isBn ? 'পরীক্ষা' : 'Exam'}: {isBn ? exam?.nameBn : exam?.name}
                        </span>
                        <span>
                          {config.totalQuestions} {isBn ? 'টি প্রশ্ন' : 'questions'}
                        </span>
                        <span>
                          +{config.correctMark} / -{config.negativeMark}
                        </span>
                        <span>
                          {isBn ? 'ফরম্যাট' : 'Format'}: {config.sheetFormat}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setOmrDownloadConfig(config)
                          setOmrOpts({
                            totalQuestions: config.totalQuestions,
                            optionCount: config.optionCount,
                            showRollNo: true,
                            showRegistrationNo: true,
                            showSetCode: true,
                            showSubjectCode: true,
                            sheetFormat: config.sheetFormat,
                          })
                          setShowOMRDownload(true)
                        }}
                        className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--green)] hover:bg-[var(--green-light)]"
                        title={isBn ? 'OMR শিট ডাউনলোড' : 'Download OMR Sheet'}
                      >
                        <ScanLine size={11} />
                      </button>
                      <button
                        onClick={() => {
                          setEditOMR(config)
                          setOMRForm({
                            examId: config.examId,
                            subjectId: config.subjectId,
                            totalQuestions: String(config.totalQuestions),
                            correctMark: String(config.correctMark),
                            negativeMark: String(config.negativeMark),
                            optionCount: String(config.optionCount),
                            sheetFormat: config.sheetFormat,
                          })
                          setShowOMRForm(true)
                        }}
                        className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteOMRConfig(config.id)
                        }}
                        className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                      >
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
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                {editExam ? (isBn ? 'পরীক্ষা এডিট' : 'Edit Exam') : isBn ? 'নতুন পরীক্ষা' : 'New Exam'}
              </h3>
              <button
                onClick={() => {
                  setShowExamForm(false)
                  setEditExam(null)
                }}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'নাম (ইংরেজি)' : 'Name (English)'}
                </label>
                <input
                  value={examForm.name}
                  onChange={(e) => setExamForm((p) => ({ ...p, name: e.target.value }))}
                  className={`${inputCls} w-full`}
                  placeholder="e.g. 1st Semester Exam"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}
                </label>
                <input
                  value={examForm.nameBn}
                  onChange={(e) => setExamForm((p) => ({ ...p, nameBn: e.target.value }))}
                  className={`${inputCls} w-full`}
                  placeholder="e.g. ১ম সেমিস্টার পরীক্ষা"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ধরন' : 'Type'}</label>
                  <select
                    value={examForm.type}
                    onChange={(e) => setExamForm((p) => ({ ...p, type: e.target.value as ExamType }))}
                    className={`${inputCls} w-full`}
                  >
                    {(Object.entries(EXAM_TYPE_LABELS) as [ExamType, { en: string; bn: string }][]).map(([k, v]) => (
                      <option key={k} value={k}>
                        {isBn ? v.bn : v.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেশন' : 'Session'}</label>
                  <input
                    value={examForm.session}
                    onChange={(e) => setExamForm((p) => ({ ...p, session: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start'}</label>
                  <input
                    type="date"
                    value={examForm.startDate}
                    onChange={(e) => setExamForm((p) => ({ ...p, startDate: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End'}</label>
                  <input
                    type="date"
                    value={examForm.endDate}
                    onChange={(e) => setExamForm((p) => ({ ...p, endDate: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowExamForm(false)
                  setEditExam(null)
                }}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveExam} className={`${btnPrimary} text-[12px]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopyAllConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2">
              {isBn ? 'সব কপি করুন' : 'Copy All To Another Class'}
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mb-2">
              {isBn
                ? `${distClassId} থেকে অন্য শ্রেণিতে সব মার্ক কনফিগ কপি করুন।`
                : `Copy all mark configs from ${distClassId} to another class.`}
            </p>
            <select value={copyAllToClassId} onChange={(e) => setCopyAllToClassId(e.target.value)} className={`${inputCls} w-full mb-4`}>
              <option value="">{isBn ? 'শ্রেণি নির্বাচন...' : 'Select target class...'}</option>
              {classOptions
                .filter((c) => c !== distClassId)
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCopyAllConfirm(false)
                  setCopyAllToClassId('')
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleCopyAll}
                disabled={!copyAllToClassId || copyAllToClassId === distClassId}
                className="px-3 py-1.5 rounded-lg bg-[var(--green)] text-white text-[12px] font-medium cursor-pointer disabled:opacity-50"
              >
                {isBn ? 'কপি করুন' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopySubjectModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[440px] w-full p-5 border border-[var(--border)]">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2">
              {isBn ? 'বিষয়ে কপি করুন' : 'Copy Config to Other Subjects'}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              {isBn
                ? 'একটি বিষয়ের মার্ক কনফিগ অন্য সব বিষয়ে কপি করুন।'
                : "Copy one subject's mark config to other subjects in this class."}
            </p>
            <div className="mb-3">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'উৎস বিষয় (যার কনফিগ কপি হবে)' : 'Source Subject (copy from)'}
              </label>
              <select
                value={copySourceSubjectId}
                onChange={(e) => {
                  setCopySourceSubjectId(e.target.value)
                  setCopyTargetSubjectIds([])
                }}
                className={`${inputCls} w-full`}
              >
                <option value="">{isBn ? '-- বিষয় নির্বাচন --' : '-- Select Subject --'}</option>
                {subjectsWithConfig.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isBn ? s.nameBn : s.name}
                  </option>
                ))}
              </select>
            </div>
            {copySourceSubjectId && (
              <div className="mb-3">
                <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'লক্ষ্য বিষয় (যেগুলোতে কপি হবে)' : 'Target Subjects (copy to)'}
                </label>
                <div className="max-h-[160px] overflow-y-auto border border-[var(--border)] rounded-lg p-2 space-y-1">
                  {subjectsWithoutConfig.length === 0 ? (
                    <p className="text-[10px] text-[var(--text-muted)] italic py-2 text-center">
                      {isBn ? 'অন্য কোনো বিষয় নেই (সব বিষয়ই ইতিমধ্যে কনফিগার্ড)' : 'No other unconfigured subjects'}
                    </p>
                  ) : (
                    <>
                      <button
                        onClick={() => setCopyTargetSubjectIds(subjectsWithoutConfig.map((s) => s.id))}
                        className="text-[9px] text-[var(--brand)] cursor-pointer hover:underline mb-1"
                      >
                        {isBn ? 'সব নির্বাচন' : 'Select All'}
                      </button>
                      {subjectsWithoutConfig.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[var(--bg-secondary)] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={copyTargetSubjectIds.includes(s.id)}
                            onChange={(e) =>
                              setCopyTargetSubjectIds((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                            }
                            className="rounded"
                          />
                          <span className="text-[11px] text-[var(--text-primary)]">{isBn ? s.nameBn : s.name}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCopySubjectModal(false)
                  setCopySourceSubjectId('')
                  setCopyTargetSubjectIds([])
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleCopySubjectConfig}
                disabled={!copySourceSubjectId || copyTargetSubjectIds.length === 0}
                className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[12px] font-medium cursor-pointer disabled:opacity-50"
              >
                {isBn ? `${copyTargetSubjectIds.length}টি বিষয়ে কপি` : `Copy to ${copyTargetSubjectIds.length} subject(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ OMR Form Modal ═══ */}
      {showOMRForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[420px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                {editOMR ? (isBn ? 'OMR এডিট' : 'Edit OMR') : isBn ? 'নতুন OMR কনফিগ' : 'New OMR Config'}
              </h3>
              <button
                onClick={() => {
                  setShowOMRForm(false)
                  setEditOMR(null)
                }}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
                  <select
                    value={omrForm.examId}
                    onChange={(e) => setOMRForm((p) => ({ ...p, examId: e.target.value }))}
                    className={`${inputCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {examConfigs.map((e) => (
                      <option key={e.id} value={e.id}>
                        {isBn ? e.nameBn : e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                  <select
                    value={omrForm.subjectId}
                    onChange={(e) => setOMRForm((p) => ({ ...p, subjectId: e.target.value }))}
                    className={`${inputCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {isBn ? s.nameBn : s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'মোট প্রশ্ন' : 'Total Q'}
                  </label>
                  <input
                    type="number"
                    value={omrForm.totalQuestions}
                    onChange={(e) => setOMRForm((p) => ({ ...p, totalQuestions: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সঠিক' : 'Correct'}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={omrForm.correctMark}
                    onChange={(e) => setOMRForm((p) => ({ ...p, correctMark: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নেগেটিভ' : 'Negative'}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={omrForm.negativeMark}
                    onChange={(e) => setOMRForm((p) => ({ ...p, negativeMark: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'অপশন' : 'Options'}</label>
                  <select
                    value={omrForm.optionCount}
                    onChange={(e) => setOMRForm((p) => ({ ...p, optionCount: e.target.value }))}
                    className={`${inputCls} w-full`}
                  >
                    <option value="4">4 (A-D)</option>
                    <option value="5">5 (A-E)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফরম্যাট' : 'Format'}</label>
                  <select
                    value={omrForm.sheetFormat}
                    onChange={(e) => setOMRForm((p) => ({ ...p, sheetFormat: e.target.value as 'A' | 'B' | 'C' | 'D' }))}
                    className={`${inputCls} w-full`}
                  >
                    {['A', 'B', 'C', 'D'].map((f) => (
                      <option key={f} value={f}>
                        Sheet {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowOMRForm(false)
                  setEditOMR(null)
                }}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveOMR} className={`${btnPrimary} text-[12px]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Grade Scale Form Modal ═══ */}
      {showGradeForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[500px] w-full p-5 border border-[var(--border)] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                {editGradeScaleId ? (isBn ? 'গ্রেড স্কেল সম্পাদনা' : 'Edit Grade Scale') : isBn ? 'গ্রেড স্কেল যোগ' : 'Add Grade Scale'}
              </h3>
              <button
                onClick={() => {
                  setShowGradeForm(false)
                  setEditGradeScaleId(null)
                }}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'নাম (EN)' : 'Name (EN)'}
                  </label>
                  <input
                    value={gradeForm.name}
                    onChange={(e) => setGradeForm((p) => ({ ...p, name: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="e.g. Standard Scale"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'নাম (BN)' : 'Name (BN)'}
                  </label>
                  <input
                    value={gradeForm.nameBn}
                    onChange={(e) => setGradeForm((p) => ({ ...p, nameBn: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="e.g. স্ট্যান্ডার্ড স্কেল"
                  />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-medium text-[var(--text-secondary)]">{isBn ? 'গ্রেড' : 'Grades'}</label>
                <button
                  onClick={() => setGradeRows((p) => [...p, { grade: '', minPct: '0', gpa: '0.0', color: '#6b7280' }])}
                  className="text-[9px] text-[var(--brand)] cursor-pointer hover:underline"
                >
                  + {isBn ? 'গ্রেড যোগ' : 'Add Grade'}
                </button>
              </div>
              <div className="space-y-1.5">
                {gradeRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                    <input
                      value={row.grade}
                      onChange={(e) => setGradeRows((p) => p.map((r, j) => (j === i ? { ...r, grade: e.target.value } : r)))}
                      className="col-span-2 px-2 py-1 rounded text-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                      placeholder="A+"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.minPct}
                      onChange={(e) => setGradeRows((p) => p.map((r, j) => (j === i ? { ...r, minPct: e.target.value } : r)))}
                      className="col-span-3 px-2 py-1 rounded text-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                      placeholder="80"
                    />
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={row.gpa}
                      onChange={(e) => setGradeRows((p) => p.map((r, j) => (j === i ? { ...r, gpa: e.target.value } : r)))}
                      className="col-span-2 px-2 py-1 rounded text-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                      placeholder="5.0"
                    />
                    <input
                      type="color"
                      value={row.color}
                      onChange={(e) => setGradeRows((p) => p.map((r, j) => (j === i ? { ...r, color: e.target.value } : r)))}
                      className="col-span-2 w-7 h-7 rounded cursor-pointer border-none p-0"
                    />
                    <span className="col-span-1 text-[9px] text-[var(--text-muted)] text-right">{row.minPct}%</span>
                    <button
                      onClick={() => setGradeRows((p) => p.filter((_, j) => j !== i))}
                      className="col-span-2 text-[9px] text-[var(--red)] cursor-pointer hover:underline"
                    >
                      {isBn ? 'মুছুন' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowGradeForm(false)
                  setEditGradeScaleId(null)
                }}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (!gradeForm.name) return
                  const grades = gradeRows
                    .filter((r) => r.grade)
                    .map((r) => ({ grade: r.grade, minPct: Number(r.minPct) || 0, gpa: Number(r.gpa) || 0, color: r.color }))
                  if (grades.length === 0) return
                  if (editGradeScaleId) {
                    updateGradeScale(editGradeScaleId, { name: gradeForm.name, nameBn: gradeForm.nameBn || gradeForm.name, grades })
                  } else {
                    addGradeScale({ name: gradeForm.name, nameBn: gradeForm.nameBn || gradeForm.name, isActive: false, grades })
                  }
                  setShowGradeForm(false)
                  setEditGradeScaleId(null)
                  setGradeForm({ name: '', nameBn: '' })
                  setGradeRows([
                    { grade: 'A+', minPct: '80', gpa: '5.0', color: '#10b981' },
                    { grade: 'A', minPct: '70', gpa: '4.0', color: '#34d399' },
                    { grade: 'A-', minPct: '60', gpa: '3.5', color: '#6ee7b7' },
                    { grade: 'B', minPct: '50', gpa: '3.0', color: '#60a5fa' },
                    { grade: 'C', minPct: '40', gpa: '2.0', color: '#fbbf24' },
                    { grade: 'D', minPct: '33', gpa: '1.0', color: '#f97316' },
                    { grade: 'F', minPct: '0', gpa: '0.0', color: '#ef4444' },
                  ])
                }}
                className={`${btnPrimary} text-[12px]`}
              >
                {editGradeScaleId ? (isBn ? 'আপডেট' : 'Update') : isBn ? 'যোগ করুন' : 'Add Scale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ OMR Download Modal ═══ */}
      {showOMRDownload &&
        omrDownloadConfig &&
        (() => {
          const exam = examConfigs.find((e) => e.id === omrDownloadConfig.examId)
          const subject = subjects.find((s) => s.id === omrDownloadConfig.subjectId)
          return (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
              <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[400px] w-full p-5 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                    {isBn ? 'OMR শিট ডাউনলোড' : 'Download OMR Sheet'}
                  </h3>
                  <button
                    onClick={() => setShowOMRDownload(false)}
                    className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Preview Info */}
                <div className="mb-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div className="text-[11px] text-[var(--text-muted)] mb-1">
                    <strong>{isBn ? 'পরীক্ষা' : 'Exam'}:</strong> {isBn ? exam?.nameBn : exam?.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mb-1">
                    <strong>{isBn ? 'বিষয়' : 'Subject'}:</strong> {isBn ? subject?.nameBn : subject?.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    <strong>{isBn ? 'মার্কিং' : 'Marking'}:</strong> +{omrDownloadConfig.correctMark} / -{omrDownloadConfig.negativeMark}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">
                        {isBn ? 'মোট প্রশ্ন' : 'Total Questions'}
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={omrOpts.totalQuestions}
                        onChange={(e) => setOmrOpts((p) => ({ ...p, totalQuestions: Number(e.target.value) || 50 }))}
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'অপশন' : 'Options'}</label>
                      <select
                        value={omrOpts.optionCount}
                        onChange={(e) => setOmrOpts((p) => ({ ...p, optionCount: Number(e.target.value) }))}
                        className={`${inputCls} w-full`}
                      >
                        <option value={4}>4 (ক,খ,গ,ঘ)</option>
                        <option value={5}>5 (ক,খ,গ,ঘ,ঙ)</option>
                      </select>
                    </div>
                  </div>

                  {/* Include toggles */}
                  <div className="text-[10px] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'অন্তর্ভুক্ত করুন' : 'Include'}:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'showRollNo' as const, label: isBn ? 'রোল নম্বর' : 'Roll Number' },
                      { key: 'showRegistrationNo' as const, label: isBn ? 'রেজিস্ট্রেশন নম্বর' : 'Registration No' },
                      { key: 'showSetCode' as const, label: isBn ? 'সেট কোড' : 'Set Code' },
                      { key: 'showSubjectCode' as const, label: isBn ? 'বিষয় কোড' : 'Subject Code' },
                    ].map((t) => (
                      <label
                        key={t.key}
                        className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-tertiary)]"
                      >
                        <input
                          type="checkbox"
                          checked={omrOpts[t.key]}
                          onChange={(e) => setOmrOpts((p) => ({ ...p, [t.key]: e.target.checked }))}
                          className="w-3.5 h-3.5 rounded accent-[var(--brand)]"
                        />
                        <span className="text-[10px] text-[var(--text-primary)]">{t.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Format */}
                  <div>
                    <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফরম্যাট' : 'Format'}</label>
                    <div className="flex gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setOmrOpts((p) => ({ ...p, sheetFormat: f }))}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                            omrOpts.sheetFormat === f
                              ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand)]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowOMRDownload(false)}
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      generateOMRSheet(
                        {
                          examName: exam?.name || '',
                          examNameBn: exam?.nameBn || '',
                          subjectName: subject?.name || '',
                          subjectNameBn: subject?.nameBn || '',
                          className: '',
                          classNameBn: '',
                          groupName: '',
                          groupNameBn: '',
                          sectionName: '',
                          sessionName: '',
                          totalQuestions: omrOpts.totalQuestions || 50,
                          optionCount: omrOpts.optionCount || 4,
                          correctMark: omrDownloadConfig.correctMark,
                          negativeMark: omrDownloadConfig.negativeMark,
                          sheetFormat: (omrOpts.sheetFormat || 'A') as 'A' | 'B' | 'C' | 'D',
                          themeColor: '#d81b60',
                          serialNumber: '0001',
                          institutionName: 'EduTech School',
                          institutionNameBn: 'এডুটেক স্কুল',
                          institutionAddress: '',
                          showStudentName: true,
                          showRollNo: true,
                          showStudentId: true,
                          showRegistrationNo: true,
                          showClass: false,
                          showSection: false,
                          showGroup: false,
                          showExamName: false,
                          showSubjectName: false,
                          showSubjectCode: false,
                          showSetCode: true,
                          showDate: true,
                          showStudentSignature: true,
                          showStudentPhoto: false,
                          showQRCode: true,
                          showBarcode: false,
                          showSerialNumber: true,
                          showSecurityCode: false,
                          showTeacherCode: false,
                          showRoomNumber: false,
                          showSeatNumber: false,
                          showAdditionalPaper: true,
                          showPresentAbsent: false,
                          showExaminerSection: true,
                          marksEntryStyle: 'abcd' as const,
                          customMarksValues: '',
                          showExaminerSignature: true,
                          showHeadExaminerSignature: false,
                          showCheckedBy: true,
                          showVerifiedBy: true,
                          showTotalMarks: true,
                          showPracticalMarks: false,
                          showVivaMarks: false,
                          showInstructions: true,
                          subjects: [],
                        },
                        isBn
                      )
                      setShowOMRDownload(false)
                    }}
                    className="px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold cursor-pointer hover:shadow-md transition-all"
                  >
                    <ScanLine size={13} className="inline mr-1 -mt-0.5" />
                    {isBn ? 'ডাউনলোড PDF' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
