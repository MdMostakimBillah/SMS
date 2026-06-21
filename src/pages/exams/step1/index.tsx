import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  Download,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions } from '@/store/classStore'
import { useExamStore } from '@/store/examStore'
import type { ExamConfig, ExamType, SubjectMarkConfig } from '@/store/examStore'
import { sectionCls, sectionTitleCls, inputCls, btnPrimary } from '@/lib/styles'
import OMRTab from './OMRTab'
import { generatePlanningReportHTML } from './pdfTemplates/planningReport'

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
  const subjects = useTeacherStore((s) => s.subjects)
  const { classes } = useClassStore()
  const currentSession = useClassStore((s) => s.institution.currentSession)
  const sessions = useClassStore((s) => s.institution.sessions)
  const isBn = useBn()
  const { isMobile, isTablet } = useWindowSize()

  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const examConfigs = useMemo(() => allExamConfigs.filter((e) => e.session === currentSession), [allExamConfigs, currentSession])
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
  const copyExamPlan = useExamStore((s) => s.copyExamPlan)
  const importExamDataFromSession = useExamStore((s) => s.importExamDataFromSession)
  const copySubjectConfig = useExamStore((s) => s.copySubjectConfig)
  const addGradeScale = useExamStore((s) => s.addGradeScale)
  const updateGradeScale = useExamStore((s) => s.updateGradeScale)
  const deleteGradeScale = useExamStore((s) => s.deleteGradeScale)
  const toggleGradeScaleActive = useExamStore((s) => s.toggleGradeScaleActive)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('exams')
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  const updateTabSlider = useCallback(() => {
    const activeEl = tabRefs.current.get(activeSubTab)
    const slider = sliderRef.current
    if (!activeEl || !slider) return
    const container = slider.parentElement
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    slider.style.width = `${activeRect.width}px`
    slider.style.transform = `translateX(${activeRect.left - containerRect.left + container.scrollLeft}px)`
  }, [activeSubTab])

  useEffect(() => {
    updateTabSlider()
    const activeEl = tabRefs.current.get(activeSubTab)
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
    window.addEventListener('resize', updateTabSlider)
    return () => window.removeEventListener('resize', updateTabSlider)
  }, [updateTabSlider])

  // Exam Form
  const [showExamForm, setShowExamForm] = useState(false)
  const [editExam, setEditExam] = useState<ExamConfig | null>(null)
  const [examForm, setExamForm] = useState({
    name: '',
    nameBn: '',
    type: 'semester-1' as ExamType,
    customType: '',
    session: '',
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

  // Copy Exam Plan
  const [showCopyExamPlanModal, setShowCopyExamPlanModal] = useState(false)
  const [copyExamPlanFromId, setCopyExamPlanFromId] = useState('')
  const [copyExamPlanToId, setCopyExamPlanToId] = useState('')

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

  useScrollLock(showExamForm || showCopyAllConfirm || showCopySubjectModal || showCopyExamPlanModal || showGradeForm || showSubExamForm)

  // Checklist
  const activeExam = useMemo(() => examConfigs.find((e) => e.isActive) || null, [examConfigs])

  const checklist = useMemo(() => {
    const activeExamConfigs = activeExam ? subjectMarkConfigs.filter((s) => s.examId === activeExam.id) : []
    const uniqueClassIds = new Set(activeExamConfigs.map((c) => c.classId))
    const classesWithConfigs = uniqueClassIds.size || 0
    const totalConfigured = activeExamConfigs.length
    const subjectPct = classesWithConfigs > 0 ? Math.round((totalConfigured / (classesWithConfigs * (subjects.length || 1))) * 100) : 0
    const subExamPct = activeExamConfigs.length > 0 ? Math.round((activeExamConfigs.filter((s) => s.subExams.length > 0).length / activeExamConfigs.length) * 100) : 0
    return [
      { done: !!activeExam, label: isBn ? 'সক্রিয় পরীক্ষা নির্বাচিত' : 'Active exam selected' },
      { done: activeExamConfigs.length > 0, label: isBn ? `বিষয় ও মার্কস কনফিগ (${subjectPct}%)` : `Subject & Mark Config (${subjectPct}%)`, pct: subjectPct },
      { done: activeExamConfigs.some((s) => s.subExams.length > 0), label: isBn ? `সাব-এক্সাম (${subExamPct}%)` : `Sub-exams (${subExamPct}%)`, pct: subExamPct },
      { done: gradeScales.length > 0, label: isBn ? 'গ্রেড স্কেল সেট আপ' : 'Grade scale configured' },
      { done: activeExam?.startDate && activeExam?.endDate ? true : false, label: isBn ? 'পরীক্ষার সময়সূচী নির্ধারিত' : 'Exam schedule set' },
    ]
  }, [activeExam, subjectMarkConfigs, gradeScales, subjects, isBn])
  const completionPct = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)

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

  const handleDownloadReport = () => {
    if (!activeExam) {
      alert(isBn ? 'প্রথমে একটি সক্রিয় পরীক্ষা নির্বাচন করুন' : 'Select an active exam first')
      return
    }
    const inst = useClassStore.getState().institution
    const html = generatePlanningReportHTML({
      exam: activeExam,
      subjectMarkConfigs,
      gradeScales,
      omrConfigs,
      subjects,
      classes,
      completionPct,
      checklist,
      isBn,
      schoolName: inst.name,
      schoolNameBn: inst.nameBn,
      schoolAddress: inst.address,
    })
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${isBn ? 'পরীক্ষা পরিকল্পনা প্রতিবেদন' : 'Exam Planning Report'}</title>
      <style>
        @page{size:A4 portrait;margin:15mm}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:20px}
        @media print{
          body{background:#fff;padding:0}
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        }
      </style>
    </head><body>${html}
      <script>setTimeout(()=>window.print(),600)</script>
    </body></html>`)
    win.document.close()
  }

  const handleSaveExam = () => {
    if (!examForm.name) return
    const examType = examForm.type === 'custom' ? (examForm.customType || 'custom') : examForm.type
    if (editExam) {
      updateExamConfig(editExam.id, {
        name: examForm.name,
        nameBn: examForm.nameBn || examForm.name,
        type: examType as ExamType,
        session: examForm.session,
        startDate: examForm.startDate,
        endDate: examForm.endDate,
      })
    } else {
      addExamConfig({
        name: examForm.name,
        nameBn: examForm.nameBn || examForm.name,
        type: examType as ExamType,
        session: examForm.session,
        startDate: examForm.startDate,
        endDate: examForm.endDate,
        isActive: false,
        isPublished: false,
        publishedAt: null,
        publishedClasses: [],
      })
    }
    setShowExamForm(false)
    setEditExam(null)
    setExamForm({ name: '', nameBn: '', type: 'semester-1', customType: '', session: currentSession, startDate: '', endDate: '' })
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
              {isBn ? 'ধাপ ১: পরিকল্পনা ও প্রস্তুতি' : 'Step 1: Planning & Preparation'}
            </h1>
            <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
              {isBn ? 'পরীক্ষা সেটআপ, বিষয় ও মার্কস কনফিগারেশন ও গ্রেড স্কেল' : 'Exam setup, subject & mark configuration & grade scale'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="text-[0.6875rem] font-medium px-2 py-1 rounded-lg"
            style={{
              color: completionPct === 100 ? 'var(--green)' : 'var(--amber)',
              background: completionPct === 100 ? 'var(--green-light)' : 'var(--amber-light)',
            }}
          >
            {completionPct}% {isBn ? 'সম্পন্ন' : 'Done'}
          </div>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1 py-[0.4375rem] px-[0.875rem] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-medium cursor-pointer font-[inherit] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
          >
            <Download size={14} />
            {isBn ? 'রিপোর্ট' : 'Report'}
          </button>
          <button
            onClick={() => {
              setActiveSubTab('exams')
              setShowExamForm(true)
              setEditExam(null)
              setExamForm({ name: '', nameBn: '', type: 'semester-1', customType: '', session: currentSession, startDate: '', endDate: '' })
            }}
            className={btnPrimary}
          >
            <Plus size={14} />
            {isBn ? 'নতুন পরীক্ষা' : 'New Exam'}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className={`relative glass rounded-xl mt-3 mb-3 w-full`}>
        <div className={`relative flex gap-[0.375rem] p-[0.3125rem] rounded-[inherit] ${isMobile || isTablet ? 'overflow-x-auto flex-nowrap' : 'flex-wrap'}`}>
          {/* Sliding indicator */}
          <div
            ref={sliderRef}
            className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] transition-all duration-300 ease-out z-0"
            style={{
              background: activeSubTab === 'exams' ? 'var(--brand)' : activeSubTab === 'subjects' ? 'var(--teal)' : activeSubTab === 'grade-scale' ? 'var(--purple)' : 'var(--amber)',
              boxShadow: activeSubTab === 'exams' ? '0 2px 8px rgba(99,102,241,0.3)' : activeSubTab === 'subjects' ? '0 2px 8px rgba(20,184,166,0.3)' : activeSubTab === 'grade-scale' ? '0 2px 8px rgba(168,85,247,0.3)' : '0 2px 8px rgba(245,158,11,0.3)',
            }}
          />
          {[
            { key: 'exams' as SubTab, label: isBn ? 'পরীক্ষা' : 'Exams', icon: <ClipboardList size={14} /> },
            { key: 'subjects' as SubTab, label: isBn ? 'বিষয় ও মার্কস কনফিগ' : 'Subject & Mark Config', icon: <BookOpen size={14} /> },
            { key: 'grade-scale' as SubTab, label: isBn ? 'গ্রেড স্কেল' : 'Grade Scale', icon: <Award size={14} /> },
            { key: 'omr' as SubTab, label: isBn ? 'OMR' : 'OMR Setup', icon: <ScanLine size={14} /> },
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
        {/* Import from previous session banner */}
        {examConfigs.length === 0 && sessions.filter((s) => s !== currentSession).length > 0 && (
          <div className="flex items-center gap-3 mb-3 py-3 px-4 rounded-xl bg-[var(--purple-light)] border border-[var(--purple)] border-dashed">
            <div className="w-9 h-9 rounded-lg bg-[var(--purple)] flex items-center justify-center shrink-0">
              <Download size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.8125rem] font-semibold text-[var(--purple)]">
                {isBn ? 'আগের সেশন থেকে পরীক্ষার প্ল্যান আমদানি করুন' : 'Import Exam Plan from Previous Session'}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn
                  ? 'এই সেশনে কোনো পরীক্ষা নেই। আগের সেশন থেকে পরীক্ষা ও বিষয় কনফিগ আমদানি করুন।'
                  : 'No exams in this session. Import exam configs and subject mark configurations from a previous session.'}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {sessions
                .filter((s) => s !== currentSession)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      if (window.confirm(isBn ? `"${s}" থেকে সব পরীক্ষার প্ল্যান আমদানি করবেন?` : `Import all exam plans from "${s}"?`)) {
                        importExamDataFromSession(s, currentSession)
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
                  className="text-[0.6875rem]"
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
              <span className="text-[0.75rem] text-[var(--text-secondary)]">
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
                        <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? exam.nameBn : exam.name}</span>
                        <span
                          className={`text-[0.625rem] py-[0.125rem] px-[0.375rem] rounded-[0.3125rem] font-medium ${
                            exam.type === 'semester-1'
                              ? 'bg-[#dbeafe] text-[#1d4ed8]'
                              : exam.type === 'semester-2'
                                ? 'bg-[#fef3c7] text-[#b45309]'
                                : exam.type === 'annual'
                                  ? 'bg-[#dcfce7] text-[#15803d]'
                                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                          }`}
                        >
                          {isBn ? (EXAM_TYPE_LABELS[exam.type]?.bn || exam.type) : (EXAM_TYPE_LABELS[exam.type]?.en || exam.type)}
                        </span>
                        {exam.isActive && (
                          <span className="text-[0.625rem] py-[0.125rem] px-[0.375rem] rounded-[0.3125rem] font-medium bg-[var(--green-light)] text-[var(--green)]">
                            {isBn ? 'সক্রিয়' : 'Active'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[0.6875rem] text-[var(--text-muted)] flex-wrap">
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
                          className={`flex items-center gap-1.5 text-[0.6875rem] font-medium px-2 py-0.5 rounded-md ${overallPct === 100 ? 'bg-[var(--green-light)] text-[var(--green)]' : overallPct > 0 ? 'bg-[var(--amber-light)] text-[var(--amber)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}
                        >
                          {overallPct === 100 ? <CheckCircle size={11} /> : <Settings size={11} />}
                          {isBn ? 'বিষয় ও মার্কস কনফিগ' : 'Subject & Mark Config'}
                          <span className="font-bold">{overallPct}%</span>
                        </div>
                      </div>
                      {/* Per-class breakdown */}
                      {classStats.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {classStats.map((cs) => (
                            <div
                              key={cs.classId}
                              className={`flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-md border ${cs.pct === 100 ? 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]' : cs.pct > 0 ? 'border-[var(--amber)] bg-[var(--amber-light)] text-[var(--amber)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}
                            >
                              {cs.pct === 100 ? <CheckCircle size={9} /> : <Settings size={9} />}
                              {cs.classId}: {cs.configured}/{cs.total} ({cs.pct}%)
                            </div>
                          ))}
                        </div>
                      )}
                      {classStats.length === 0 && (
                        <div className="mt-2 text-[0.625rem] text-[var(--text-muted)] italic">
                          {isBn ? 'কোনো বিষয় বা মার্কস কনফিগার হয়নি' : 'No subject & mark config yet'}
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
                            customType: '',
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
                          setCopyExamPlanFromId(exam.id)
                          setCopyExamPlanToId('')
                          setShowCopyExamPlanModal(true)
                        }}
                        className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                      >
                        <Copy size={12} />
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
              <div className={`${sectionCls} flex flex-col items-center text-center py-10`}>
                <ClipboardList size={32} className="mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">{isBn ? 'এখনো কোনো পরীক্ষা তৈরি হয়নি' : 'No exams created yet'}</p>
                <button
                  onClick={() => {
                    setShowExamForm(true)
              setExamForm({ name: '', nameBn: '', type: 'semester-1', customType: '', session: currentSession, startDate: '', endDate: '' })
                  }}
                  className={`${btnPrimary} mt-3 text-[0.6875rem]`}
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
                  <p className="text-[0.8125rem] text-[var(--text-muted)]">
                    {isBn ? 'প্রথমে একটি পরীক্ষা সক্রিয় করুন' : 'Please activate an exam first'}
                  </p>
                  <button
                    onClick={() => setActiveSubTab('exams')}
                    className="mt-2 text-[0.75rem] text-[var(--brand)] cursor-pointer hover:underline"
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
                            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)] text-[0.6875rem] font-medium cursor-pointer"
                          >
                            <ClipboardList size={12} />
                            {isBn ? 'বিষয়ে কপি' : 'Copy to Subjects'}
                          </button>
                        )}
                        <button
                          onClick={() => setShowCopyAllConfirm(true)}
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--green-light)] text-[var(--green)] border border-[var(--green)] text-[0.6875rem] font-medium cursor-pointer"
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
                          <div className={`text-[0.75rem] font-bold ${isActive ? 'text-white' : 'text-[var(--text-primary)]'}`}>{c}</div>
                          <div className={`text-[0.5625rem] mt-0.5 ${isActive ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                            {secCount > 0 ? `${secCount} ${isBn ? 'সেকশন' : 'sec'}` : isBn ? 'সেকশন নেই' : 'No sec'}
                          </div>
                          {cfgCount > 0 && (
                            <div
                              className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--green-light)] text-[var(--green)]'}`}
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
                      <div className="text-[0.625rem] font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                        {isBn ? 'সেকশন নির্বাচন করুন' : 'Select Sections'}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedClassSections.map((sec) => {
                          const isSelected = distSectionIds.includes(sec.name)
                          return (
                            <button
                              key={sec.id}
                              onClick={() => toggleSection(sec.name)}
                              className={`px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium border cursor-pointer transition-all ${isSelected ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--brand)]'}`}
                            >
                              {isBn ? `সেকশন ${sec.name}` : `Section ${sec.name}`}
                              <span className="ml-1 text-[0.5625rem] opacity-60">({sec.seatQuantity})</span>
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
                          <span className="ml-2 text-[0.625rem] font-normal text-[var(--text-muted)]">
                            {distConfigs.length}/{filteredSubjects.length} {isBn ? 'কনফিগার্ড' : 'configured'}
                          </span>
                        </div>
                      </div>

                      {/* Table Header */}
                      <div
                        className="grid gap-2 pb-2 border-b border-[var(--border)] text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider"
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
                                <div className="text-center text-[0.625rem] text-[var(--text-muted)]">{idx + 1}</div>
                                <div className="min-w-0">
                                  <div className="text-[0.75rem] font-medium text-[var(--text-primary)] truncate">
                                    {isBn ? subject.nameBn : subject.name}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 items-center">
                                  {config && config.subExams.length > 0 ? (
                                    config.subExams.map((se) => (
                                      <span
                                        key={se.id}
                                        className="inline-flex items-center gap-0.5 text-[0.5rem] px-1.5 py-0.5 rounded-md bg-[var(--brand-light)] text-[var(--brand)] font-medium"
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
                                    <span className="text-[0.5625rem] text-[var(--text-muted)] italic">
                                      {isBn ? 'সাব-এক্সাম যোগ করুন' : 'Add sub-exams'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-center">
                                  {totals && totals.totalFull > 0 ? (
                                    <div className="flex flex-col items-center">
                                      <span className={`text-[0.75rem] font-bold ${isOver ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
                                        {totals.totalFull}/{totals.totalPass}
                                      </span>
                                      {isOver && (
                                        <span className="text-[0.5rem] text-[var(--red)] font-bold">⚠ {isBn ? '১০০+!' : '100+!'}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
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
                                      className="inline-flex items-center gap-1 text-[0.5625rem] px-2 py-1 rounded-md bg-[var(--brand)] text-white border-none cursor-pointer font-medium hover:shadow-sm"
                                    >
                                      <Plus size={9} />
                                      {isBn ? 'সাব-এক্সাম যোগ' : 'Add Sub-Exam'}
                                    </button>
                                    <button
                                      onClick={() => handleQuickSetupSubExams(config)}
                                      className="inline-flex items-center gap-1 text-[0.5625rem] px-2 py-1 rounded-md bg-[var(--teal-light)] text-[var(--teal)] border border-[var(--teal)] cursor-pointer font-medium hover:shadow-sm"
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
                        <div className="text-center py-8 text-[var(--text-muted)] text-[0.75rem]">
                          {isBn
                            ? 'এই শ্রেণিতে কোনো বিষয় নেই। ক্লাস ম্যানেজমেন্টে সেকশনে বিষয় যোগ করুন।'
                            : 'No subjects for this class. Add subjects to sections in Class Management.'}
                        </div>
                      )}
                    </div>

                    {/* Sub-exam Form Modal */}
                    {showSubExamForm && editDistConfig && createPortal(
                      <div
                        className="modal-overlay"
                        onClick={() => setShowSubExamForm(false)}
                      >
                        <div
                          className="modal-box modal-content"
                          style={{ maxWidth: '24rem' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                              {isBn ? 'সাব-এক্সাম যোগ' : 'Add Sub-Exam'}
                            </span>
                            <button
                              onClick={() => setShowSubExamForm(false)}
                              className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
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
                                  className={`flex-1 py-2 rounded-lg text-[0.625rem] font-semibold border cursor-pointer ${alreadyAdded ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] opacity-50 cursor-not-allowed' : subExamForm.name === name ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand)] hover:shadow-sm'}`}
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
                                  <label className="text-[0.5625rem] text-[var(--text-muted)] block mb-0.5">
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
                                  <label className="text-[0.5625rem] text-[var(--text-muted)] block mb-0.5">
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
                                  className={`mt-3 p-2 rounded-lg text-[0.6875rem] text-center font-semibold ${isOver ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--green-light)] text-[var(--green)]'}`}
                                >
                                  {isBn ? 'মোট' : 'Total'}: {totalFull} {isBn ? 'ফুল' : 'Full'} / {totalPass} {isBn ? 'পাস' : 'Pass'}
                                  {isOver && <span className="ml-2">⚠ {isBn ? '১০০ এর বেশি!' : 'Over 100!'}</span>}
                                </div>
                              )
                            })()}
                        </div>
                      </div>,
                      document.body
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
              <span className="text-[0.75rem] text-[var(--text-secondary)]">
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
                      <span className="text-[0.5625rem] px-2 py-0.5 rounded-full bg-[var(--green-light)] text-[var(--green)] font-semibold ml-2">
                        {isBn ? 'সক্রিয়' : 'Active'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!scale.isActive && (
                      <button
                        onClick={() => toggleGradeScaleActive(scale.id)}
                        className="text-[0.5625rem] px-2 py-1 rounded-md bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)] cursor-pointer font-medium hover:shadow-sm"
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
                      <div className="text-[0.875rem] font-bold" style={{ color: g.color }}>
                        {g.grade}
                      </div>
                      <div className="text-[0.5625rem] text-[var(--text-muted)]">≥{g.minPct}%</div>
                      <div className="text-[0.5625rem] text-[var(--text-muted)]">GPA {g.gpa}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {gradeScales.length === 0 && (
              <div className={`${sectionCls} text-center py-10`}>
                <Award size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">{isBn ? 'কোনো গ্রেড স্কেল নেই' : 'No grade scales configured'}</p>
              </div>
            )}
          </>
        )}

        {/* ═══ OMR TAB ═══ */}
        {activeSubTab === 'omr' && (
          <OMRTab
            isBn={isBn}
            examConfigs={examConfigs}
            subjects={subjects}
            omrConfigs={omrConfigs}
            gradeScales={gradeScales}
            classes={classes}
            institution={useClassStore.getState().institution}
          />
        )}
      </div>

      {/* ═══ Exam Form Modal ═══ */}
      {showExamForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '26.25rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
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
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ধরন' : 'Type'}</label>
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
                  {examForm.type === 'custom' && (
                    <input
                      value={(examForm as any).customType || ''}
                      onChange={(e) => setExamForm((p) => ({ ...p, customType: e.target.value }))}
                      className={`${inputCls} w-full mt-1.5`}
                      placeholder={isBn ? 'কাস্টম ধরন লিখুন' : 'Enter custom type'}
                    />
                  )}
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেশন' : 'Session'}</label>
                  <input
                    value={examForm.session}
                    onChange={(e) => setExamForm((p) => ({ ...p, session: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start'}</label>
                  <input
                    type="date"
                    value={examForm.startDate}
                    onChange={(e) => setExamForm((p) => ({ ...p, startDate: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End'}</label>
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
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveExam} className={`${btnPrimary} text-[0.75rem]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showCopyAllConfirm && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '23.75rem' }}>
            <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-2">
              {isBn ? 'সব কপি করুন' : 'Copy All To Another Class'}
            </h3>
            <p className="text-[0.75rem] text-[var(--text-muted)] mb-2">
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
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.75rem] text-[var(--text-secondary)] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleCopyAll}
                disabled={!copyAllToClassId || copyAllToClassId === distClassId}
                className="px-3 py-1.5 rounded-lg bg-[var(--green)] text-white text-[0.75rem] font-medium cursor-pointer disabled:opacity-50"
              >
                {isBn ? 'কপি করুন' : 'Copy'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showCopySubjectModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '27.5rem' }}>
            <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-2">
              {isBn ? 'বিষয়ে কপি করুন' : 'Copy Config to Other Subjects'}
            </h3>
            <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
              {isBn
                ? 'একটি বিষয়ের মার্ক কনফিগ অন্য সব বিষয়ে কপি করুন।'
                : "Copy one subject's mark config to other subjects in this class."}
            </p>
            <div className="mb-3">
              <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'লক্ষ্য বিষয় (যেগুলোতে কপি হবে)' : 'Target Subjects (copy to)'}
                </label>
                <div className="max-h-[10rem] overflow-y-auto border border-[var(--border)] rounded-lg p-2 space-y-1">
                  {subjectsWithoutConfig.length === 0 ? (
                    <p className="text-[0.625rem] text-[var(--text-muted)] italic py-2 text-center">
                      {isBn ? 'অন্য কোনো বিষয় নেই (সব বিষয়ই ইতিমধ্যে কনফিগার্ড)' : 'No other unconfigured subjects'}
                    </p>
                  ) : (
                    <>
                      <button
                        onClick={() => setCopyTargetSubjectIds(subjectsWithoutConfig.map((s) => s.id))}
                        className="text-[0.5625rem] text-[var(--brand)] cursor-pointer hover:underline mb-1"
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
                          <span className="text-[0.6875rem] text-[var(--text-primary)]">{isBn ? s.nameBn : s.name}</span>
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
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.75rem] text-[var(--text-secondary)] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleCopySubjectConfig}
                disabled={!copySourceSubjectId || copyTargetSubjectIds.length === 0}
                className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.75rem] font-medium cursor-pointer disabled:opacity-50"
              >
                {isBn ? `${copyTargetSubjectIds.length}টি বিষয়ে কপি` : `Copy to ${copyTargetSubjectIds.length} subject(s)`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ Copy Exam Plan Modal ═══ */}
      {showCopyExamPlanModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '25rem' }}>
            <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-2">
              {isBn ? 'পরীক্ষার প্ল্যান কপি করুন' : 'Copy Exam Plan'}
            </h3>
            <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
              {isBn
                ? 'একটি পরীক্ষার সব মার্কস ও বিষয় কনফিগ অন্য পরীক্ষায় কপি করুন।'
                : 'Copy all subject & mark configs from one exam to another.'}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'উৎস পরীক্ষা (যার কনফিগ কপি হবে)' : 'Source Exam (copy from)'}
                </label>
                <select
                  value={copyExamPlanFromId}
                  onChange={(e) => setCopyExamPlanFromId(e.target.value)}
                  className={`${inputCls} w-full`}
                >
                  <option value="">{isBn ? 'পরীক্ষা নির্বাচন...' : 'Select exam...'}</option>
                  {examConfigs.map((e) => (
                    <option key={e.id} value={e.id}>
                      {isBn ? e.nameBn : e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'লক্ষ্য পরীক্ষা (যেখানে কপি হবে)' : 'Target Exam (copy to)'}
                </label>
                <select
                  value={copyExamPlanToId}
                  onChange={(e) => setCopyExamPlanToId(e.target.value)}
                  className={`${inputCls} w-full`}
                >
                  <option value="">{isBn ? 'পরীক্ষা নির্বাচন...' : 'Select exam...'}</option>
                  {examConfigs
                    .filter((e) => e.id !== copyExamPlanFromId)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {isBn ? e.nameBn : e.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {copyExamPlanFromId && copyExamPlanToId && (
              <p className="text-[0.625rem] text-[var(--amber)] mt-2">
                {isBn ? '⚠ লক্ষ্য পরীক্ষার আগের কনফিগ মুছে নতুন কনফিগ বসানো হবে।' : '⚠ Existing configs in target exam will be replaced.'}
              </p>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowCopyExamPlanModal(false)
                  setCopyExamPlanFromId('')
                  setCopyExamPlanToId('')
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.75rem] text-[var(--text-secondary)] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  copyExamPlan(copyExamPlanFromId, copyExamPlanToId)
                  setShowCopyExamPlanModal(false)
                  setCopyExamPlanFromId('')
                  setCopyExamPlanToId('')
                }}
                disabled={!copyExamPlanFromId || !copyExamPlanToId || copyExamPlanFromId === copyExamPlanToId}
                className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.75rem] font-medium cursor-pointer disabled:opacity-50"
              >
                {isBn ? 'কপি করুন' : 'Copy Plan'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ Grade Scale Form Modal ═══ */}
      {showGradeForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '31.25rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
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
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                <label className="text-[0.625rem] font-medium text-[var(--text-secondary)]">{isBn ? 'গ্রেড' : 'Grades'}</label>
                <button
                  onClick={() => setGradeRows((p) => [...p, { grade: '', minPct: '0', gpa: '0.0', color: '#6b7280' }])}
                  className="text-[0.5625rem] text-[var(--brand)] cursor-pointer hover:underline"
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
                      className="col-span-2 px-2 py-1 rounded text-[0.625rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                      placeholder="A+"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.minPct}
                      onChange={(e) => setGradeRows((p) => p.map((r, j) => (j === i ? { ...r, minPct: e.target.value } : r)))}
                      className="col-span-3 px-2 py-1 rounded text-[0.625rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                      placeholder="80"
                    />
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={row.gpa}
                      onChange={(e) => setGradeRows((p) => p.map((r, j) => (j === i ? { ...r, gpa: e.target.value } : r)))}
                      className="col-span-2 px-2 py-1 rounded text-[0.625rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                      placeholder="5.0"
                    />
                    <input
                      type="color"
                      value={row.color}
                      onChange={(e) => setGradeRows((p) => p.map((r, j) => (j === i ? { ...r, color: e.target.value } : r)))}
                      className="col-span-2 w-7 h-7 rounded cursor-pointer border-none p-0"
                    />
                    <span className="col-span-1 text-[0.5625rem] text-[var(--text-muted)] text-right">{row.minPct}%</span>
                    <button
                      onClick={() => setGradeRows((p) => p.filter((_, j) => j !== i))}
                      className="col-span-2 text-[0.5625rem] text-[var(--red)] cursor-pointer hover:underline"
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
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
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
                className={`${btnPrimary} text-[0.75rem]`}
              >
                {editGradeScaleId ? (isBn ? 'আপডেট' : 'Update') : isBn ? 'যোগ করুন' : 'Add Scale'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
