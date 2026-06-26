import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  ArrowLeft, Download, Eye, Printer, Save, Copy, Archive, RotateCcw,
  ScanLine, CheckCircle2, AlertTriangle, RefreshCw, ChevronRight, ChevronLeft,
  Layers, PenTool, FileCheck, Trash2, Loader2, User, GraduationCap,
  Stamp, ZoomIn, ZoomOut, Maximize2, Minimize2, BookOpen, QrCode,
  Barcode, Hash, Shield, DoorOpen, ArmchairIcon, FileText, Signature,
  CheckCheck, BarChart3, Beaker, Mic, ListChecks, FileSpreadsheet,
  Settings2, FolderOpen, Tag, CalendarDays, Pin,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useExamStore, type OMRTemplate } from '@/store/examStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { generateOMRHtml, generateOMRSheet, generateOMRSheetMultiCopy, type OMRConfig, type PaperSize } from '@/pages/exams/omrTemplate'

const THEME_PRESETS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Red', value: '#d81b60' },
  { label: 'Green', value: '#059669' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Orange', value: '#d97706' },
  { label: 'Cyan', value: '#0891b2' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Pink', value: '#ec4899' },
]

type WizardStep = 1 | 2 | 3 | 4
type GenerationMode = 'all' | 'range' | 'custom'

const WIZARD_STEPS = [
  { num: 1, key: 'exam', icon: GraduationCap, label: 'Exam Selection' },
  { num: 2, key: 'fields', icon: Layers, label: 'Field Selection' },
  { num: 3, key: 'examiner', icon: Stamp, label: 'Examiner Config' },
  { num: 4, key: 'generate', icon: FileSpreadsheet, label: 'Generate' },
] as const

export default function OMRSheetPage() {
  const nav = useNavigate()
  const { language: lang } = useAppStore()
  const isBn = lang === 'bn'
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const examConfigs = useExamStore((s) => s.examConfigs)
  const subjects = useTeacherStore((s) => s.subjects)
  const classes = useClassStore((s) => s.classes)
  const institution = useClassStore((s) => s.institution)
  const omrTemplates = useExamStore((s) => s.omrTemplates)
  const saveOMRTemplate = useExamStore((s) => s.saveOMRTemplate)
  const updateOMRTemplate = useExamStore((s) => s.updateOMRTemplate)
  const deleteOMRTemplate = useExamStore((s) => s.deleteOMRTemplate)
  const duplicateOMRTemplate = useExamStore((s) => s.duplicateOMRTemplate)
  const archiveOMRTemplate = useExamStore((s) => s.archiveOMRTemplate)
  const restoreOMRTemplate = useExamStore((s) => s.restoreOMRTemplate)

  const [currentStep, setCurrentStep] = useState<WizardStep>(1)

  const activeExam = examConfigs.find((e) => e.isActive) || examConfigs[0]
  const [selectedExamId, setSelectedExamId] = useState(activeExam?.id || '')
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [sessionName, setSessionName] = useState(institution.currentSession || '2025-26')
  const [className, setClassName] = useState(classes[0] ? (isBn ? classes[0].nameBn : classes[0].name) : '')
  const [classNameBn, setClassNameBn] = useState(classes[0]?.nameBn || '')
  const [examName, setExamName] = useState(activeExam ? (isBn ? activeExam.nameBn : activeExam.name) : '')
  const [examNameBn, setExamNameBn] = useState(activeExam?.nameBn || '')
  const [themeColor, setThemeColor] = useState('#6366f1')
  const [totalCopy, setTotalCopy] = useState(1)
  const [serialNumber, setSerialNumber] = useState('5853')
  const [sheetLanguage, setSheetLanguage] = useState<'bn' | 'en'>(isBn ? 'bn' : 'en')
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')
  const [generationMode, setGenerationMode] = useState<GenerationMode>('all')
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(50)

  const [showStudentName, setShowStudentName] = useState(true)
  const [showRollNo, setShowRollNo] = useState(true)
  const [showStudentId, setShowStudentId] = useState(true)
  const [showRegistrationNo, setShowRegistrationNo] = useState(true)
  const [showClass, setShowClass] = useState(false)
  const [showSection, setShowSection] = useState(false)
  const [showGroup, setShowGroup] = useState(false)
  const [showExamName, setShowExamName] = useState(false)
  const [showSubjectName, setShowSubjectName] = useState(true)
  const [showSubjectCode, setShowSubjectCode] = useState(false)
  const [showSetCode, setShowSetCode] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [showStudentSignature, setShowStudentSignature] = useState(true)
  const [showStudentPhoto, setShowStudentPhoto] = useState(false)
  const [showQRCode, setShowQRCode] = useState(true)
  const [showBarcode, setShowBarcode] = useState(false)
  const [showSerialNumber, setShowSerialNumber] = useState(true)
  const [showSecurityCode, setShowSecurityCode] = useState(false)
  const [showVerificationCode, setShowVerificationCode] = useState(false)
  const [showTeacherCode, setShowTeacherCode] = useState(false)
  const [showInvigilatorCode, setShowInvigilatorCode] = useState(false)
  const [showRoomNumber, setShowRoomNumber] = useState(false)
  const [showSeatNumber, setShowSeatNumber] = useState(false)
  const [showAdditionalPaper, setShowAdditionalPaper] = useState(true)
  const [showPresentAbsent, setShowPresentAbsent] = useState(false)
  const [showExaminerRemarks, setShowExaminerRemarks] = useState(false)

  const [showExaminerSection, setShowExaminerSection] = useState(true)
  const [marksEntryStyle, setMarksEntryStyle] = useState<'abcd' | 'bn' | 'numbers' | 'custom'>('abcd')
  const [customMarksValues, setCustomMarksValues] = useState('')
  const [showExaminerSignature, setShowExaminerSignature] = useState(true)
  const [showHeadExaminerSignature, setShowHeadExaminerSignature] = useState(false)
  const [showVerificationSignature, setShowVerificationSignature] = useState(false)
  const [showCheckedBy, setShowCheckedBy] = useState(true)
  const [showVerifiedBy, setShowVerifiedBy] = useState(true)
  const [showTotalMarks, setShowTotalMarks] = useState(true)
  const [showPracticalMarks, setShowPracticalMarks] = useState(false)
  const [showVivaMarks, setShowVivaMarks] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  const [totalQuestions, setTotalQuestions] = useState(40)
  const [optionCount, setOptionCount] = useState(4)
  const [sheetFormat, setSheetFormat] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [correctMark, setCorrectMark] = useState(1)
  const [negativeMark, setNegativeMark] = useState(0.25)

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [previewHtml, setPreviewHtml] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPdfConfirm, setShowPdfConfirm] = useState(false)
  const [pdfCopyCount, setPdfCopyCount] = useState(1)

  const selectedExam = examConfigs.find((e) => e.id === selectedExamId)

  const examSubjects = useMemo(() => {
    if (!selectedClassId) return []
    const cls = classes.find((c) => c.id === selectedClassId)
    if (!cls) return []
    // If section is selected, use section's subjectIds; otherwise use class's
    let subIds: string[] = []
    if (selectedSection) {
      const sec = cls.sections.find((s) => s.name === selectedSection)
      subIds = sec?.subjectIds || []
    }
    if (subIds.length === 0) {
      subIds = cls.subjectIds || []
    }
    return subIds
      .map((sid) => subjects.find((s) => s.id === sid))
      .filter(Boolean) as { id: string; name: string; nameBn: string }[]
  }, [selectedClassId, selectedSection, classes, subjects])

  const classSections = useMemo(() => {
    if (!selectedClassId) return []
    const cls = classes.find((c) => c.id === selectedClassId)
    return cls?.sections || []
  }, [selectedClassId, classes])

  const activeSubjects = useMemo(() => {
    if (selectedSubjectId) {
      const sub = examSubjects.find((s) => s.id === selectedSubjectId)
      return sub ? [sub] : []
    }
    return examSubjects
  }, [selectedSubjectId, examSubjects])

  const activeTemplates = useMemo(() => omrTemplates.filter((t) => !t.isArchived), [omrTemplates])
  const archivedTemplates = useMemo(() => omrTemplates.filter((t) => t.isArchived), [omrTemplates])

  const omrConfig = useMemo<OMRConfig>(
    () => ({
      examName: examName || selectedExam?.name || '',
      examNameBn: examNameBn || selectedExam?.nameBn || '',
      subjectName: activeSubjects[0]?.name || '',
      subjectNameBn: activeSubjects[0]?.nameBn || '',
      className: className || '',
      classNameBn: classNameBn || className || '',
      groupName: selectedGroup,
      groupNameBn: selectedGroup,
      sectionName: selectedSection,
      sessionName,
      totalQuestions,
      optionCount,
      correctMark,
      negativeMark,
      sheetFormat,
      paperSize,
      themeColor,
      serialNumber,
      institutionName: institution.name || 'EduTech School',
      institutionNameBn: institution.nameBn || 'এডুটেক স্কুল',
      institutionAddress: institution.address || '',
      logo: institution.logo || '',
      showStudentName,
      showRollNo,
      showStudentId,
      showRegistrationNo,
      showClass,
      showSection,
      showGroup,
      showExamName,
      showSubjectName,
      showSubjectCode,
      showSetCode,
      showDate,
      showStudentSignature,
      showStudentPhoto,
      showQRCode,
      showBarcode,
      showSerialNumber,
      showSecurityCode,
      showVerificationCode,
      showTeacherCode,
      showInvigilatorCode,
      showRoomNumber,
      showSeatNumber,
      showAdditionalPaper,
      showPresentAbsent,
      showExaminerRemarks,
      showExaminerSection,
      marksEntryStyle,
      customMarksValues,
      showExaminerSignature,
      showHeadExaminerSignature,
      showVerificationSignature,
      showCheckedBy,
      showVerifiedBy,
      showTotalMarks,
      showPracticalMarks,
      showVivaMarks,
      showInstructions,
      subjects: activeSubjects,
    }),
    [
      examName, examNameBn, className, classNameBn, sessionName,
      totalQuestions, optionCount, correctMark, negativeMark, sheetFormat,
      paperSize, themeColor, serialNumber, institution,
      showStudentName, showRollNo, showStudentId, showRegistrationNo,
      showClass, showSection, showGroup, showExamName, showSubjectName,
      showSubjectCode, showSetCode, showDate, showStudentSignature, showStudentPhoto,
      showQRCode, showBarcode, showSerialNumber, showSecurityCode, showVerificationCode,
      showTeacherCode, showInvigilatorCode, showRoomNumber, showSeatNumber,
      showAdditionalPaper, showPresentAbsent, showExaminerRemarks,
      showExaminerSection, marksEntryStyle, customMarksValues,
      showExaminerSignature, showHeadExaminerSignature, showVerificationSignature,
      showCheckedBy, showVerifiedBy, showTotalMarks, showPracticalMarks, showVivaMarks,
      showInstructions, activeSubjects, selectedExam, selectedGroup, selectedSection,
    ]
  )

  const computeCopyCount = useMemo(() => {
    switch (generationMode) {
      case 'range': return Math.max(1, rangeEnd - rangeStart + 1)
      case 'custom': return Math.max(1, pdfCopyCount)
      default: return totalCopy
    }
  }, [generationMode, rangeStart, rangeEnd, pdfCopyCount, totalCopy])

  const sheetIsBn = sheetLanguage === 'bn'
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    try {
      const html = await generateOMRHtml(omrConfig, sheetIsBn)
      setPreviewHtml(html)
    } catch {
      console.error(isBn ? 'জেনারেট ব্যর্থ' : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [omrConfig, sheetIsBn, isBn])

  useEffect(() => {
    handleGenerate()
  }, [])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleGenerate(), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [omrConfig])

  const handleDownloadClick = () => {
    setPdfCopyCount(computeCopyCount)
    setShowPdfConfirm(true)
  }

  const handleConfirmDownload = async () => {
    setShowPdfConfirm(false)
    if (pdfCopyCount <= 1) {
      generateOMRSheet(omrConfig, sheetIsBn, 1)
    } else {
      const html = await generateOMRSheetMultiCopy(omrConfig, sheetIsBn, pdfCopyCount)
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
        setTimeout(() => w.print(), 600)
      }
    }
    console.log(isBn ? `${pdfCopyCount} কপি জেনারেট হচ্ছে...` : `Generating ${pdfCopyCount} copies...`)
  }

  const handlePrint = () => {
    const w = window.open('', '_blank')
    if (w && previewHtml) {
      w.document.write(previewHtml)
      w.document.close()
      setTimeout(() => w.print(), 300)
    }
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return
    if (activeTemplateId) {
      updateOMRTemplate(activeTemplateId, { ...omrConfig, name: templateName, nameBn: templateName, modifiedBy: 'Admin' })
      console.log(isBn ? 'টেমপ্লেট আপডেট হয়েছে' : 'Template updated')
    } else {
      saveOMRTemplate({
        ...omrConfig,
        name: templateName,
        nameBn: templateName,
        examId: selectedExamId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        totalCopy,
        isArchived: false,
        isDefault: false,
        modifiedBy: 'Admin',
      })
      console.log(isBn ? 'টেমপ্লেট সংরক্ষিত হয়েছে' : 'Template saved')
    }
    setShowSaveDialog(false)
    setTemplateName('')
  }

  const handleLoadTemplate = (tpl: OMRTemplate) => {
    setActiveTemplateId(tpl.id)
    setTemplateName(tpl.name)
    setSelectedExamId(tpl.examId)
    setSelectedClassId(tpl.classId)
    setSelectedSubjectId(tpl.subjectId)
    setSessionName(tpl.sessionName)
    setClassName(tpl.className)
    setClassNameBn(tpl.classNameBn)
    setExamName(tpl.examName)
    setExamNameBn(tpl.examNameBn)
    setThemeColor(tpl.themeColor)
    setSerialNumber(tpl.serialNumber)
    setTotalQuestions(tpl.totalQuestions)
    setOptionCount(tpl.optionCount)
    setSheetFormat(tpl.sheetFormat)
    setCorrectMark(tpl.correctMark)
    setNegativeMark(tpl.negativeMark)
    setTotalCopy(tpl.totalCopy)
    setShowStudentName(tpl.showStudentName)
    setShowRollNo(tpl.showRollNo)
    setShowStudentId(tpl.showStudentId)
    setShowRegistrationNo(tpl.showRegistrationNo)
    setShowClass(tpl.showClass)
    setShowSection(tpl.showSection)
    setShowGroup(tpl.showGroup)
    setShowExamName(tpl.showExamName)
    setShowSubjectName(tpl.showSubjectName)
    setShowSubjectCode(tpl.showSubjectCode)
    setShowSetCode(tpl.showSetCode)
    setShowDate(tpl.showDate)
    setShowStudentSignature(tpl.showStudentSignature)
    setShowStudentPhoto(tpl.showStudentPhoto)
    setShowQRCode(tpl.showQRCode)
    setShowBarcode(tpl.showBarcode)
    setShowSerialNumber(tpl.showSerialNumber)
    setShowSecurityCode(tpl.showSecurityCode)
    setShowTeacherCode(tpl.showTeacherCode)
    setShowRoomNumber(tpl.showRoomNumber)
    setShowSeatNumber(tpl.showSeatNumber)
    setShowAdditionalPaper(tpl.showAdditionalPaper)
    setShowPresentAbsent(tpl.showPresentAbsent)
    setShowExaminerSection(tpl.showExaminerSection)
    setMarksEntryStyle(tpl.marksEntryStyle)
    setCustomMarksValues(tpl.customMarksValues)
    setShowExaminerSignature(tpl.showExaminerSignature)
    setShowHeadExaminerSignature(tpl.showHeadExaminerSignature)
    setShowCheckedBy(tpl.showCheckedBy)
    setShowVerifiedBy(tpl.showVerifiedBy)
    setShowTotalMarks(tpl.showTotalMarks)
    setShowPracticalMarks(tpl.showPracticalMarks)
    setShowVivaMarks(tpl.showVivaMarks)
    setShowInstructions(tpl.showInstructions)
    console.log(isBn ? 'টেমপ্লেট লোড হয়েছে' : 'Template loaded')
  }

  const handleReset = () => {
    setActiveTemplateId(null)
    setTemplateName('')
    setSelectedExamId(examConfigs[0]?.id || '')
    setSelectedClassId(classes[0]?.id || '')
    setSelectedSubjectId('')
    setSelectedGroup('')
    setSelectedSection('')
    setSessionName(institution.currentSession || '2025-26')
    setClassName(classes[0] ? (isBn ? classes[0].nameBn : classes[0].name) : '')
    setClassNameBn(classes[0]?.nameBn || '')
    setExamName(examConfigs[0] ? (isBn ? examConfigs[0].nameBn : examConfigs[0].name) : '')
    setExamNameBn(examConfigs[0]?.nameBn || '')
    setThemeColor('#6366f1')
    setSerialNumber('5853')
    setTotalQuestions(40)
    setOptionCount(4)
    setSheetFormat('A')
    setCorrectMark(1)
    setNegativeMark(0.25)
    setTotalCopy(1)
    setPaperSize('A4')
    setShowStudentName(true); setShowRollNo(true); setShowStudentId(true)
    setShowRegistrationNo(true); setShowClass(false); setShowSection(false)
    setShowGroup(false); setShowExamName(false); setShowSubjectName(true)
    setShowSubjectCode(false); setShowSetCode(true); setShowDate(true)
    setShowStudentSignature(true); setShowStudentPhoto(false)
    setShowQRCode(true); setShowBarcode(false); setShowSerialNumber(true)
    setShowSecurityCode(false); setShowVerificationCode(false)
    setShowTeacherCode(false); setShowInvigilatorCode(false)
    setShowRoomNumber(false); setShowSeatNumber(false)
    setShowAdditionalPaper(true); setShowPresentAbsent(false)
    setShowExaminerRemarks(false)
    setShowExaminerSection(true); setMarksEntryStyle('abcd')
    setCustomMarksValues(''); setShowExaminerSignature(true)
    setShowHeadExaminerSignature(false); setShowVerificationSignature(false)
    setShowCheckedBy(true); setShowVerifiedBy(true); setShowTotalMarks(true)
    setShowPracticalMarks(false); setShowVivaMarks(false); setShowInstructions(true)
    setCurrentStep(1)
    console.log(isBn ? 'রিসেট সম্পন্ন' : 'Reset complete')
  }

  const inputCls =
    'px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.6875rem] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/30 transition-all w-full'
  const selectCls = `${inputCls} cursor-pointer appearance-none`
  const labelCls = 'text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block'
  const cardCls = 'bg-[var(--surface)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden shadow-[var(--shadow-xs)]'
  const sectionHeaderCls = 'px-4 py-2.5 border-b border-[var(--border)] flex items-center gap-2'

  const toggle = (checked: boolean, onChange: (v: boolean) => void) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-[1.25rem] rounded-full transition-all duration-200 ${checked ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}
    >
      <div
        className={`absolute top-[0.125rem] w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-[1.125rem]' : 'translate-x-[0.125rem]'}`}
      />
    </button>
  )

  const renderFieldToggle = (label: string, icon: React.ReactNode, checked: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group">
      <div className="flex items-center gap-2">
        <span className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">{icon}</span>
        <span className="text-[0.6875rem] text-[var(--text-primary)] font-medium">{label}</span>
      </div>
      {toggle(checked, onChange)}
    </div>
  )

  const renderStepIndicator = () => (
    <div className={`${cardCls}`}>
      <div className="px-4 py-3">
        <div className="flex items-center">
          {WIZARD_STEPS.map((step, idx) => (
            <div key={step.key} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(step.num as WizardStep)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer flex-1 ${
                  currentStep === step.num
                    ? 'bg-[var(--brand-light)]'
                    : currentStep > step.num
                      ? 'bg-[var(--green-light)]'
                      : 'hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.625rem] font-bold border-2 transition-all ${
                  currentStep === step.num
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                    : currentStep > step.num
                      ? 'bg-[var(--green)] text-white border-[var(--green)]'
                      : 'bg-transparent text-[var(--text-muted)] border-[var(--border)]'
                }`}>
                  {currentStep > step.num ? <CheckCircle2 size={14} /> : step.num}
                </div>
                <span className={`text-[0.5625rem] font-semibold whitespace-nowrap ${
                  currentStep === step.num
                    ? 'text-[var(--brand)]'
                    : currentStep > step.num
                      ? 'text-[var(--green)]'
                      : 'text-[var(--text-muted)]'
                }`}>
                  {isBn
                    ? step.num === 1 ? 'পরীক্ষা' : step.num === 2 ? 'ফিল্ড' : step.num === 3 ? 'পরীক্ষক' : 'জেনারেট'
                    : step.key === 'exam' ? 'Exam' : step.key === 'fields' ? 'Fields' : step.key === 'examiner' ? 'Examiner' : 'Generate'}
                </span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full ${
                  currentStep > step.num ? 'bg-[var(--green)]' : 'bg-[var(--border)]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className={cardCls}>
      <div className={`${sectionHeaderCls} bg-[var(--brand-light)]`}>
        <div className="w-7 h-7 rounded-lg bg-[var(--brand)] flex items-center justify-center">
          <GraduationCap size={14} className="text-white" />
        </div>
        <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
          {isBn ? 'ধাপ ১: পরীক্ষা নির্বাচন' : 'Step 1: Examination Selection'}
        </span>
      </div>
      <div className="px-4 pb-4 space-y-3 pt-3">
        {/* Row 1: Session, Class, Section */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className={labelCls}>{isBn ? 'একাডেমিক সেশন' : 'Academic Session'}</label>
            <select
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className={selectCls}
            >
              {institution.sessions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{isBn ? 'শ্রেণি' : 'Class'}</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                const cls = classes.find((c) => c.id === e.target.value)
                if (cls) { setClassName(isBn ? cls.nameBn : cls.name); setClassNameBn(cls.nameBn) }
              }}
              className={selectCls}
            >
              <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select...'}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{isBn ? 'শাখা' : 'Section'}</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className={selectCls}
              disabled={!selectedClassId}
            >
              <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select...'}</option>
              {classSections.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Exam, Subject */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className={labelCls}>{isBn ? 'পরীক্ষা' : 'Exam'}</label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value)
                const ex = examConfigs.find((x) => x.id === e.target.value)
                if (ex) { setExamName(isBn ? ex.nameBn : ex.name); setExamNameBn(ex.nameBn) }
              }}
              className={selectCls}
            >
              <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select...'}</option>
              {examConfigs.filter((e) => e.isActive).map((e) => (
                <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{isBn ? 'বিষয়' : 'Subject'}</label>
            <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className={selectCls}
              disabled={!selectedClassId}>
              <option value="">{isBn ? 'সকল বিষয়' : 'All Subjects'}</option>
              {examSubjects.map((s) => (
                <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Theme, Language, Paper Size, Serial No */}
        <div className="grid grid-cols-4 gap-2.5">
          <div>
            <label className={labelCls}>{isBn ? 'থিম' : 'Theme'}</label>
            <div className="flex items-center gap-1.5">
              <select value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className={`${selectCls} flex-1`}>
                {THEME_PRESETS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--border)] p-0.5 shrink-0" />
            </div>
          </div>
          <div>
            <label className={labelCls}>{isBn ? 'ভাষা' : 'Language'}</label>
            <select value={sheetLanguage} onChange={(e) => setSheetLanguage(e.target.value as 'bn' | 'en')} className={selectCls}>
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{isBn ? 'কাগজ' : 'Paper'}</label>
            <select value={paperSize} onChange={(e) => setPaperSize(e.target.value as PaperSize)} className={selectCls}>
              <option value="A4">A4</option>
              <option value="Legal">Legal</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{isBn ? 'সিরিয়াল' : 'Serial'}</label>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Output */}
        <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[0.6875rem] text-[var(--text-secondary)]">
              <FileText size={14} className="text-[var(--brand)]" />
              <span>{isBn ? 'উত্পাদন:' : 'Output:'}</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {activeSubjects.length > 0 ? activeSubjects.length : 1} {isBn ? 'পৃষ্ঠা' : 'page(s)'}
              </span>
              <span className="text-[var(--text-muted)]">×</span>
              <span className="font-semibold text-[var(--text-primary)]">{totalCopy} {isBn ? 'কপি' : 'copies'}</span>
              <span className="text-[var(--text-muted)]">=</span>
              <span className="font-bold text-[var(--brand)]">
                {(activeSubjects.length > 0 ? activeSubjects.length : 1) * totalCopy}
              </span>
              <span className="text-[var(--text-muted)]">{isBn ? 'শিট' : 'sheets'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'কপি' : 'Copies'}</label>
              <input type="number" min="1" max="500" value={totalCopy}
                onChange={(e) => setTotalCopy(Number(e.target.value) || 1)}
                className="w-16 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.6875rem] text-center" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => setCurrentStep(2)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold cursor-pointer hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5">
            {isBn ? 'পরবর্তী ধাপ' : 'Next Step'} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className={cardCls}>
      <div className={`${sectionHeaderCls} bg-[var(--teal-light)]`}>
        <div className="w-7 h-7 rounded-lg bg-[var(--teal)] flex items-center justify-center">
          <Layers size={14} className="text-white" />
        </div>
        <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
          {isBn ? 'ধাপ ২: OMR ফিল্ড নির্বাচন' : 'Step 2: OMR Field Selection'}
        </span>
      </div>
      <div className="px-4 pb-4 space-y-3 pt-3">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Settings2 size={12} className="text-[var(--text-muted)]" />
            <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {isBn ? 'প্রশ্ন সেটিংস' : 'Question Settings'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>{isBn ? 'মোট প্রশ্ন' : 'Total Q'}</label>
              <input type="number" min="10" max="200" value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value) || 40)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{isBn ? 'অপশন' : 'Options'}</label>
              <select value={optionCount} onChange={(e) => setOptionCount(Number(e.target.value))} className={selectCls}>
                <option value={4}>4</option><option value={5}>5</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{isBn ? 'সঠিক নম্বর' : 'Correct'}</label>
              <input type="number" step="0.5" min="0" value={correctMark}
                onChange={(e) => setCorrectMark(Number(e.target.value) || 1)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{isBn ? 'নেগেটিভ' : 'Negative'}</label>
              <input type="number" step="0.25" min="0" value={negativeMark}
                onChange={(e) => setNegativeMark(Number(e.target.value) || 0)} className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <FileText size={12} className="text-[var(--text-muted)]" />
            <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {isBn ? 'শিট ফরম্যাট' : 'Sheet Format'}
            </span>
          </div>
          <div className="flex gap-1.5">
            {(['A', 'B', 'C', 'D'] as const).map((f) => (
              <button key={f} onClick={() => setSheetFormat(f)}
                className={`flex-1 py-2 rounded-xl text-[0.6875rem] font-bold border cursor-pointer transition-all ${
                  sheetFormat === f
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand)]/40'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <User size={12} className="text-[var(--text-muted)]" />
              <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {isBn ? 'শিক্ষার্থীর তথ্য' : 'Student Info'}
              </span>
            </div>
            <button onClick={() => {
              const v = !showStudentName
              setShowStudentName(v); setShowRollNo(v); setShowStudentId(v)
              setShowRegistrationNo(v); setShowClass(v); setShowSection(v)
              setShowGroup(v); setShowExamName(v); setShowSubjectName(v)
              setShowSubjectCode(v); setShowSetCode(v); setShowDate(v)
              setShowStudentSignature(v); setShowStudentPhoto(v)
            }} className="text-[0.5625rem] text-[var(--brand)] font-medium cursor-pointer hover:underline">
              {isBn ? 'সব টগল' : 'Toggle All'}
            </button>
          </div>
          <div className="space-y-0.5">
            {renderFieldToggle(isBn ? 'শিক্ষার্থীর নাম' : 'Student Name', <User size={12} />, showStudentName, setShowStudentName)}
            {renderFieldToggle(isBn ? 'রোল নম্বর' : 'Roll Number', <Hash size={12} />, showRollNo, setShowRollNo)}
            {renderFieldToggle(isBn ? 'শিক্ষার্থী আইডি' : 'Student ID', <Pin size={12} />, showStudentId, setShowStudentId)}
            {renderFieldToggle(isBn ? 'রেজিস্ট্রেশন নম্বর' : 'Registration No', <Tag size={12} />, showRegistrationNo, setShowRegistrationNo)}
            {renderFieldToggle(isBn ? 'শ্রেণি' : 'Class', <GraduationCap size={12} />, showClass, setShowClass)}
            {renderFieldToggle(isBn ? 'শাখা' : 'Section', <DoorOpen size={12} />, showSection, setShowSection)}
            {renderFieldToggle(isBn ? 'গ্রুপ' : 'Group', <FolderOpen size={12} />, showGroup, setShowGroup)}
            {renderFieldToggle(isBn ? 'পরীক্ষার নাম' : 'Exam Name', <FileText size={12} />, showExamName, setShowExamName)}
            {renderFieldToggle(isBn ? 'বিষয়ের নাম' : 'Subject Name', <BookOpen size={12} />, showSubjectName, setShowSubjectName)}
            {renderFieldToggle(isBn ? 'বিষয় কোড' : 'Subject Code', <QrCode size={12} />, showSubjectCode, setShowSubjectCode)}
            {renderFieldToggle(isBn ? 'সেট কোড' : 'Set Code', <ListChecks size={12} />, showSetCode, setShowSetCode)}
            {renderFieldToggle(isBn ? 'তারিখ' : 'Date', <CalendarDays size={12} />, showDate, setShowDate)}
            {renderFieldToggle(isBn ? 'স্বাক্ষর' : 'Signature', <Signature size={12} />, showStudentSignature, setShowStudentSignature)}
            {renderFieldToggle(isBn ? 'ছবি' : 'Photo', <ScanLine size={12} />, showStudentPhoto, setShowStudentPhoto)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <ScanLine size={12} className="text-[var(--text-muted)]" />
              <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {isBn ? 'শনাক্তকরণ' : 'Identification'}
              </span>
            </div>
            <button onClick={() => {
              const v = !showQRCode
              setShowQRCode(v); setShowBarcode(v); setShowSerialNumber(v)
              setShowSecurityCode(v); setShowVerificationCode(v)
            }} className="text-[0.5625rem] text-[var(--brand)] font-medium cursor-pointer hover:underline">
              {isBn ? 'সব টগল' : 'Toggle All'}
            </button>
          </div>
          <div className="space-y-0.5">
            {renderFieldToggle(isBn ? 'QR কোড' : 'QR Code', <QrCode size={12} />, showQRCode, setShowQRCode)}
            {renderFieldToggle(isBn ? 'বারকোড' : 'Barcode', <Barcode size={12} />, showBarcode, setShowBarcode)}
            {renderFieldToggle(isBn ? 'সিরিয়াল নম্বর' : 'Serial Number', <Hash size={12} />, showSerialNumber, setShowSerialNumber)}
            {renderFieldToggle(isBn ? 'সিকিউরিটি কোড' : 'Security Code', <Shield size={12} />, showSecurityCode, setShowSecurityCode)}
            {renderFieldToggle(isBn ? 'ভেরিফিকেশন কোড' : 'Verification Code', <CheckCheck size={12} />, showVerificationCode, setShowVerificationCode)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <FileCheck size={12} className="text-[var(--text-muted)]" />
              <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {isBn ? 'পরীক্ষা' : 'Examination'}
              </span>
            </div>
            <button onClick={() => {
              const v = !showTeacherCode
              setShowTeacherCode(v); setShowInvigilatorCode(v); setShowRoomNumber(v)
              setShowSeatNumber(v); setShowAdditionalPaper(v); setShowPresentAbsent(v)
              setShowExaminerRemarks(v)
            }} className="text-[0.5625rem] text-[var(--brand)] font-medium cursor-pointer hover:underline">
              {isBn ? 'সব টগল' : 'Toggle All'}
            </button>
          </div>
          <div className="space-y-0.5">
            {renderFieldToggle(isBn ? 'শিক্ষক কোড' : 'Teacher Code', <User size={12} />, showTeacherCode, setShowTeacherCode)}
            {renderFieldToggle(isBn ? 'পরিদর্শক কোড' : 'Invigilator Code', <User size={12} />, showInvigilatorCode, setShowInvigilatorCode)}
            {renderFieldToggle(isBn ? 'রুম নম্বর' : 'Room Number', <DoorOpen size={12} />, showRoomNumber, setShowRoomNumber)}
            {renderFieldToggle(isBn ? 'সিট নম্বর' : 'Seat Number', <ArmchairIcon size={12} />, showSeatNumber, setShowSeatNumber)}
            {renderFieldToggle(isBn ? 'অতিরিক্ত পত্র' : 'Additional Paper', <FileText size={12} />, showAdditionalPaper, setShowAdditionalPaper)}
            {renderFieldToggle(isBn ? 'উপস্থিত/অনুপস্থিত' : 'Present/Absent', <CheckCheck size={12} />, showPresentAbsent, setShowPresentAbsent)}
            {renderFieldToggle(isBn ? 'পরীক্ষকের মন্তব্য' : 'Examiner Remarks', <PenTool size={12} />, showExaminerRemarks, setShowExaminerRemarks)}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => setCurrentStep(1)}
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] text-[0.6875rem] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-1.5">
            <ChevronLeft size={14} /> {isBn ? 'আগের' : 'Previous'}
          </button>
          <button onClick={() => setCurrentStep(3)}
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.6875rem] font-semibold cursor-pointer hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5">
            {isBn ? 'পরবর্তী' : 'Next'} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className={cardCls}>
      <div className={`${sectionHeaderCls} bg-[var(--amber-light)]`}>
        <div className="w-7 h-7 rounded-lg bg-[var(--amber)] flex items-center justify-center">
          <Stamp size={14} className="text-white" />
        </div>
        <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
          {isBn ? 'ধাপ ৩: পরীক্ষক কনফিগারেশন' : 'Step 3: Examiner Configuration'}
        </span>
      </div>
      <div className="px-4 pb-4 space-y-3 pt-3">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <PenTool size={12} className="text-[var(--text-muted)]" />
            <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {isBn ? 'উত্তর প্রবেশ ধরন' : 'Marks Entry Style'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { key: 'abcd' as const, label: isBn ? 'ক,খ,গ,ঘ' : 'A,B,C,D' },
              { key: 'bn' as const, label: isBn ? 'ক-ঙ (৫)' : 'ক-ঙ (5)' },
              { key: 'numbers' as const, label: isBn ? 'সংখ্যা' : 'Numbers' },
              { key: 'custom' as const, label: isBn ? 'কাস্টম' : 'Custom' },
            ].map((style) => (
              <button key={style.key} onClick={() => setMarksEntryStyle(style.key)}
                className={`py-2 rounded-xl text-[0.6875rem] font-semibold border cursor-pointer transition-all ${
                  marksEntryStyle === style.key
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand)]/40'
                }`}>
                {style.label}
              </button>
            ))}
          </div>
          {marksEntryStyle === 'custom' && (
            <div className="mt-2.5">
              <label className={labelCls}>{isBn ? 'কাস্টম মান (কমা দিয়ে আলাদা)' : 'Custom values (comma separated)'}</label>
              <input value={customMarksValues} onChange={(e) => setCustomMarksValues(e.target.value)}
                placeholder="e.g. Excellent, Good, Average, Poor" className={inputCls} />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Stamp size={12} className="text-[var(--text-muted)]" />
              <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {isBn ? 'পরীক্ষক নিয়ন্ত্রণ' : 'Examiner Controls'}
              </span>
            </div>
            <button onClick={() => {
              const v = !showExaminerSection
              setShowExaminerSection(v); setShowExaminerSignature(v)
              setShowHeadExaminerSignature(v); setShowVerificationSignature(v)
              setShowCheckedBy(v); setShowVerifiedBy(v); setShowTotalMarks(v)
              setShowPracticalMarks(v); setShowVivaMarks(v)
            }} className="text-[0.5625rem] text-[var(--brand)] font-medium cursor-pointer hover:underline">
              {isBn ? 'সব টগল' : 'Toggle All'}
            </button>
          </div>
          <div className="space-y-0.5">
            {renderFieldToggle(isBn ? 'পরীক্ষক অংশ' : 'Examiner Section', <Stamp size={12} />, showExaminerSection, setShowExaminerSection)}
            {renderFieldToggle(isBn ? 'পরীক্ষকের স্বাক্ষর' : 'Examiner Signature', <Signature size={12} />, showExaminerSignature, setShowExaminerSignature)}
            {renderFieldToggle(isBn ? 'প্রধান পরীক্ষকের স্বাক্ষর' : 'Head Examiner Signature', <Signature size={12} />, showHeadExaminerSignature, setShowHeadExaminerSignature)}
            {renderFieldToggle(isBn ? 'নিশ্চিতকারীর স্বাক্ষর' : 'Verification Signature', <Signature size={12} />, showVerificationSignature, setShowVerificationSignature)}
            {renderFieldToggle(isBn ? 'চেক করেছেন' : 'Checked By', <CheckCheck size={12} />, showCheckedBy, setShowCheckedBy)}
            {renderFieldToggle(isBn ? 'যাচাই করেছেন' : 'Verified By', <CheckCheck size={12} />, showVerifiedBy, setShowVerifiedBy)}
            {renderFieldToggle(isBn ? 'মোট নম্বর' : 'Total Marks', <BarChart3 size={12} />, showTotalMarks, setShowTotalMarks)}
            {renderFieldToggle(isBn ? 'ব্যবহারিক নম্বর' : 'Practical Marks', <Beaker size={12} />, showPracticalMarks, setShowPracticalMarks)}
            {renderFieldToggle(isBn ? 'মৌখিক নম্বর' : 'Viva Marks', <Mic size={12} />, showVivaMarks, setShowVivaMarks)}
            {renderFieldToggle(isBn ? 'নির্দেশনা' : 'Instructions', <ListChecks size={12} />, showInstructions, setShowInstructions)}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => setCurrentStep(2)}
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] text-[0.6875rem] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-1.5">
            <ChevronLeft size={14} /> {isBn ? 'আগের' : 'Previous'}
          </button>
          <button onClick={() => setCurrentStep(4)}
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.6875rem] font-semibold cursor-pointer hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5">
            {isBn ? 'পরবর্তী' : 'Next'} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="flex flex-col gap-3">
      <div className={cardCls}>
        <div className={`${sectionHeaderCls} bg-[var(--green-light)]`}>
          <div className="w-7 h-7 rounded-lg bg-[var(--green)] flex items-center justify-center">
            <Download size={14} className="text-white" />
          </div>
          <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'ধাপ ৪: জেনারেট ও ডাউনলোড' : 'Step 4: Generate & Download'}
          </span>
        </div>
        <div className="px-4 pb-4 space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={handlePrint}
              className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer hover:border-[var(--brand)]/40 hover:bg-[var(--brand-light)]/30 transition-all text-center group">
              <Printer size={20} className="text-[var(--text-muted)] group-hover:text-[var(--brand)] mx-auto mb-1.5" />
              <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{isBn ? 'প্রিন্ট' : 'Print'}</div>
              <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'সরাসরি প্রিন্ট করুন' : 'Print directly'}</div>
            </button>
            <button onClick={handleDownloadClick}
              className="p-3.5 rounded-xl border-2 border-[var(--brand)] bg-[var(--brand-light)] cursor-pointer hover:shadow-md transition-all text-center group">
              <Download size={20} className="text-[var(--brand)] mx-auto mb-1.5" />
              <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{isBn ? 'ডাউনলোড PDF' : 'Download PDF'}</div>
              <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'পিডিএফ ফাইল ডাউনলোড' : 'Download as PDF'}</div>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[0.6875rem] font-medium text-[var(--text-primary)]">
              <FileSpreadsheet size={14} className="text-[var(--brand)]" />
              {isBn ? 'জেনারেশন সারসংক্ষেপ' : 'Generation Summary'}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.625rem]">
              {[
                { label: isBn ? 'সেশন' : 'Session', value: sessionName },
                { label: isBn ? 'শ্রেণি' : 'Class', value: className },
                { label: isBn ? 'পরীক্ষা' : 'Exam', value: examName },
                { label: isBn ? 'বিষয়' : 'Subject', value: activeSubjects.map(s => isBn ? s.nameBn : s.name).join(', ') || '—' },
                { label: isBn ? 'ভাষা' : 'Language', value: sheetLanguage === 'bn' ? 'Bangla' : 'English' },
                { label: isBn ? 'টেমপ্লেট' : 'Template', value: templateName || '—' },
                { label: isBn ? 'থিম রঙ' : 'Theme', value: THEME_PRESETS.find(t => t.value === themeColor)?.label || themeColor },
                { label: isBn ? 'ফরম্যাট' : 'Format', value: sheetFormat },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-0.5">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className="font-medium text-[var(--text-primary)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Hash size={12} className="text-[var(--text-muted)]" />
              <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {isBn ? 'পরিমাণ নির্বাচন' : 'Quantity Selection'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {([
                { key: 'all' as GenerationMode, label: isBn ? 'সকল শিক্ষার্থী' : 'All Students' },
                { key: 'range' as GenerationMode, label: isBn ? 'রেঞ্জ' : 'By Range' },
                { key: 'custom' as GenerationMode, label: isBn ? 'কাস্টম' : 'Custom' },
              ]).map((mode) => (
                <button key={mode.key} onClick={() => setGenerationMode(mode.key)}
                  className={`py-2 rounded-xl text-[0.625rem] font-semibold border cursor-pointer transition-all ${
                    generationMode === mode.key
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]'
                  }`}>
                  {mode.label}
                </button>
              ))}
            </div>
            {generationMode === 'range' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelCls}>{isBn ? 'শুরু' : 'From'}</label>
                  <input type="number" min="1" value={rangeStart}
                    onChange={(e) => setRangeStart(Number(e.target.value) || 1)} className={inputCls} />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>{isBn ? 'শেষ' : 'To'}</label>
                  <input type="number" min="1" value={rangeEnd}
                    onChange={(e) => setRangeEnd(Number(e.target.value) || 50)} className={inputCls} />
                </div>
              </div>
            )}
            {generationMode === 'custom' && (
              <div>
                <label className={labelCls}>{isBn ? 'কপি সংখ্যা' : 'Number of Copies'}</label>
                <input type="number" min="1" max="500" value={pdfCopyCount}
                  onChange={(e) => setPdfCopyCount(Number(e.target.value) || 1)} className={inputCls} />
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-[var(--brand-light)]/50 border border-[var(--brand)]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[0.6875rem] text-[var(--text-secondary)]">
                <FileText size={14} className="text-[var(--brand)]" />
                <span className="font-medium">{isBn ? 'মোট শিট' : 'Total Sheets'}:</span>
              </div>
              <span className="text-[1.125rem] font-bold text-[var(--brand)]">
                {(activeSubjects.length > 0 ? activeSubjects.length : 1) * computeCopyCount}
              </span>
            </div>
            <div className="text-[0.5625rem] text-[var(--text-muted)] mt-1">
              {activeSubjects.length > 0 ? activeSubjects.length : 1} {isBn ? 'পৃষ্ঠা' : 'pages'} × {computeCopyCount} {isBn ? 'কপি' : 'copies'}
              {isBn ? ' = ইউনিক QR সহ ' : ' = sheets with unique QR'}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setCurrentStep(3)}
              className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] text-[0.6875rem] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-1.5">
              <ChevronLeft size={14} /> {isBn ? 'আগের' : 'Previous'}
            </button>
            <button onClick={handleDownloadClick}
              className="flex-[2] px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold cursor-pointer hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2">
              <Download size={15} />
              {isBn ? `এখনই জেনারেট করুন (${computeCopyCount})` : `Generate Now (${computeCopyCount})`}
            </button>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className={`${sectionHeaderCls}`}>
          <Save size={13} className="text-[var(--purple)]" />
          <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'টেমপ্লেট ম্যানেজমেন্ট' : 'Template Management'}
          </span>
        </div>
        <div className="px-4 pb-4 space-y-3 pt-3">
          <div className="flex gap-2">
            <button onClick={() => {
              if (activeTemplateId) {
                updateOMRTemplate(activeTemplateId, { ...omrConfig, name: templateName, nameBn: templateName, modifiedBy: 'Admin' })
                console.log(isBn ? 'টেমপ্লেট আপডেট হয়েছে' : 'Template updated')
              } else {
                setShowSaveDialog(true)
              }
            }}
              className="flex-1 px-3 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.6875rem] font-semibold cursor-pointer hover:shadow-md transition-all flex items-center justify-center gap-1.5">
              <Save size={13} />
              {activeTemplateId
                ? (isBn ? 'টেমপ্লেট আপডেট' : 'Update Template')
                : (isBn ? 'টেমপ্লেট সংরক্ষণ' : 'Save Template')}
            </button>
            {activeTemplateId && (
              <button onClick={() => { setActiveTemplateId(null); setTemplateName(''); setShowSaveDialog(false) }}
                className="px-3 py-2 rounded-xl border border-[var(--border)] text-[0.6875rem] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)]">
                {isBn ? 'নতুন' : 'New'}
              </button>
            )}
          </div>

          {!activeTemplateId && showSaveDialog && (
            <div className="p-3 rounded-xl border-2 border-[var(--brand)]/30 bg-[var(--brand-light)]/40 space-y-2.5">
              <div>
                <label className={labelCls}>{isBn ? 'টেমপ্লেটের নাম' : 'Template Name'}</label>
                <input value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={isBn ? 'টেমপ্লেটের নাম লিখুন...' : 'Enter template name...'} className={inputCls} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveTemplate}
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.6875rem] font-semibold cursor-pointer hover:shadow-md">
                  <Save size={12} className="inline mr-1" />{isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
                <button onClick={() => setShowSaveDialog(false)}
                  className="px-3 py-2 rounded-xl border border-[var(--border)] text-[0.6875rem] cursor-pointer hover:bg-[var(--bg-secondary)]">
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {activeTemplates.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen size={11} className="text-[var(--text-muted)]" />
                <span className="text-[0.5625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {isBn ? 'সংরক্ষিত টেমপ্লেট' : 'Saved Templates'}
                </span>
              </div>
              {activeTemplates.map((tpl) => (
                <div key={tpl.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeTemplateId === tpl.id
                      ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40'
                  }`}
                  onClick={() => handleLoadTemplate(tpl)}>
                  <div className="w-8 h-8 rounded-lg bg-[var(--purple-light)] flex items-center justify-center">
                    <FileText size={14} className="text-[var(--purple)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate flex items-center gap-1.5">
                      {tpl.name}
                      {tpl.isDefault && <span className="px-1.5 py-0.5 rounded text-[0.5rem] font-bold bg-[var(--brand)] text-white">DEFAULT</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[0.5625rem] text-[var(--text-muted)]">
                      <span>v{tpl.version}</span>
                      <span>{tpl.updatedAt ? new Date(tpl.updatedAt).toLocaleDateString() : ''}</span>
                      {tpl.modifiedBy && <span>{isBn ? 'সংশোধনকারী' : 'by'}: {tpl.modifiedBy}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { const n = prompt(isBn ? 'নতুন নাম:' : 'New name:', tpl.name); if (n) duplicateOMRTemplate(tpl.id, n) }}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors" title={isBn ? 'ডুপ্লিকেট' : 'Duplicate'}>
                      <Copy size={11} className="text-[var(--text-muted)]" />
                    </button>
                    <button onClick={() => archiveOMRTemplate(tpl.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors" title={isBn ? 'আর্কাইভ' : 'Archive'}>
                      <Archive size={11} className="text-[var(--text-muted)]" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(tpl.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors" title={isBn ? 'মুছুন' : 'Delete'}>
                      <Trash2 size={11} className="text-[var(--red)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {archivedTemplates.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-2">
                <Archive size={11} className="text-[var(--text-muted)]" />
                <span className="text-[0.5625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {isBn ? 'আর্কাইভকৃত' : 'Archived'}
                </span>
              </div>
              {archivedTemplates.map((tpl) => (
                <div key={tpl.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] opacity-60">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <Archive size={14} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">{tpl.name}</div>
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">v{tpl.version}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => restoreOMRTemplate(tpl.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors" title={isBn ? 'রিস্টোর' : 'Restore'}>
                      <RotateCcw size={11} className="text-[var(--text-muted)]" />
                    </button>
                    <button onClick={() => deleteOMRTemplate(tpl.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors" title={isBn ? 'মুছুন' : 'Delete'}>
                      <Trash2 size={11} className="text-[var(--red)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTemplates.length === 0 && archivedTemplates.length === 0 && (
            <div className="text-center py-6 text-[0.75rem] text-[var(--text-muted)]">
              <Save size={24} className="mx-auto mb-2 opacity-30" />
              {isBn ? 'এখনো কোনো টেমপ্লেট সংরক্ষিত হয়নি' : 'No templates saved yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">

      <div className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
        <div className="max-w-[112.5rem] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => nav('/exams')}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand)]/30 transition-all">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-[1rem] font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ScanLine size={20} className="text-[var(--brand)]" />
                {isBn ? 'OMR শিট ডিজাইনার' : 'OMR Sheet Designer'}
              </h1>
              <p className="text-[0.625rem] text-[var(--text-muted)] hidden sm:block">
                {isBn ? 'প্রফেশনাল OMR শিট তৈরি, কাস্টমাইজ ও PDF জেনারেট করুন' : 'Design, customize & generate professional OMR sheets'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[0.6875rem] font-medium cursor-pointer hover:text-[var(--text-primary)] hover:border-[var(--brand)]/30 transition-all flex items-center gap-1.5">
              <RefreshCw size={13} /> <span className="hidden sm:inline">{isBn ? 'রিসেট' : 'Reset'}</span>
            </button>
            <button onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[0.6875rem] font-medium cursor-pointer hover:text-[var(--text-primary)] hover:border-[var(--brand)]/30 transition-all flex items-center gap-1.5">
              <Printer size={13} /> <span className="hidden sm:inline">{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>
            <button onClick={handleDownloadClick}
              className="px-4 py-1.5 rounded-xl bg-[var(--brand)] text-white text-[0.6875rem] font-semibold cursor-pointer hover:shadow-md hover:brightness-110 transition-all flex items-center gap-1.5">
              <Download size={13} /> <span className="hidden sm:inline">{isBn ? 'PDF ডাউনলোড' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[112.5rem] mx-auto px-2 sm:px-4 py-3">
        <div className={`grid gap-4 ${isFullscreen ? '' : 'lg:grid-cols-[400px_1fr]'}`}>
          {!isFullscreen && (
            <div className="flex flex-col gap-3 max-h-[calc(100vh-100px)] overflow-y-auto pr-1.5">
              <div className="sticky top-0 z-10 bg-[var(--bg-primary)] pb-3">
                {renderStepIndicator()}
              </div>
              <div className="flex flex-col gap-3">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </div>
            </div>
          )}

          <div className={`${cardCls} ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
            <div className="px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye size={14} className="text-[var(--text-muted)]" />
                <span className="text-[0.75rem] font-medium text-[var(--text-muted)]">{isBn ? 'লাইভ প্রিভিউ' : 'Live Preview'}</span>
                {isGenerating && <Loader2 size={13} className="text-[var(--brand)] animate-spin" />}
                <span className="text-[0.5625rem] text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border)] font-medium">
                  {paperSize}
                </span>
                <span className="text-[0.5625rem] text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border)] font-medium">
                  {isBn ? 'বাংলা' : 'EN'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors" title={isBn ? 'জুম আউট' : 'Zoom Out'}>
                  <ZoomOut size={13} className="text-[var(--text-muted)]" />
                </button>
                <span className="text-[0.625rem] text-[var(--text-muted)] font-medium min-w-[2.25rem] text-center">{zoom}%</span>
                <button onClick={() => setZoom((z) => Math.min(200, z + 10))}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors" title={isBn ? 'জুম ইন' : 'Zoom In'}>
                  <ZoomIn size={13} className="text-[var(--text-muted)]" />
                </button>
                <button onClick={() => setZoom(100)}
                  className="px-2 py-0.5 rounded-lg text-[0.5625rem] text-[var(--text-muted)] hover:bg-[var(--bg-primary)] transition-colors font-medium">
                  Fit
                </button>
                <div className="w-px h-5 bg-[var(--border)] mx-1" />
                <button onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors" title={isBn ? 'ফুল স্ক্রিন' : 'Fullscreen'}>
                  {isFullscreen ? <Minimize2 size={13} className="text-[var(--text-muted)]" /> : <Maximize2 size={13} className="text-[var(--text-muted)]" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center bg-[var(--bg-tertiary)] p-4 overflow-auto"
              style={{ minHeight: isFullscreen ? 'calc(100vh - 50px)' : '50rem' }}>
              {previewHtml ? (
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  className="transition-transform duration-200 ease-out">
                  <iframe ref={iframeRef} srcDoc={previewHtml}
                    className="bg-white shadow-lg rounded-sm"
                    style={{ width: '210mm', minHeight: '297mm', border: 'none' }}
                    title="OMR Preview" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[var(--text-muted)] text-[0.8125rem] gap-2">
                  <Loader2 size={28} className="animate-spin" />
                  {isBn ? 'প্রিভিউ জেনারেট হচ্ছে...' : 'Generating preview...'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay"
          onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-box modal-content"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--red-light)] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[var(--red)]" />
              </div>
              <div>
                <span className="text-[0.875rem] font-bold text-[var(--text-primary)]">{isBn ? 'টেমপ্লেট মুছুন?' : 'Delete Template?'}</span>
                <p className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'এই কার্যক্রম পূর্বাবস্থায় ফেরানো যাবে না।' : 'This action cannot be undone.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { deleteOMRTemplate(showDeleteConfirm); setShowDeleteConfirm(null); console.log(isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted') }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--red)] text-white text-[0.75rem] font-semibold cursor-pointer hover:brightness-110 transition-all">
                {isBn ? 'মুছুন' : 'Delete'}
              </button>
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[0.75rem] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all">
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPdfConfirm && (
        <div className="modal-overlay"
          onClick={() => setShowPdfConfirm(false)}>
          <div className="modal-box modal-content"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
                <Download size={18} className="text-[var(--brand)]" />
              </div>
              <div>
                <span className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                  {isBn ? 'PDF জেনারেট করুন' : 'Generate PDF'}
                </span>
                <p className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'জেনারেশন শুরু করার আগে নিশ্চিত করুন' : 'Confirm before generation begins'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] mb-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet size={14} className="text-[var(--brand)]" />
                <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'জেনারেশন সারসংক্ষেপ' : 'Generation Summary'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[0.625rem]">
                {[
                  { label: isBn ? 'সেশন' : 'Session', value: sessionName },
                  { label: isBn ? 'শ্রেণি' : 'Class', value: className },
                  { label: isBn ? 'পরীক্ষা' : 'Exam', value: examName },
                  { label: isBn ? 'বিষয়' : 'Subject', value: activeSubjects.map(s => isBn ? s.nameBn : s.name).join(', ') || '—' },
                  { label: isBn ? 'ভাষা' : 'Language', value: sheetLanguage === 'bn' ? 'Bangla' : 'English' },
                  { label: isBn ? 'টেমপ্লেট' : 'Template', value: templateName || '—' },
                  { label: isBn ? 'থিম' : 'Theme', value: THEME_PRESETS.find(t => t.value === themeColor)?.label || 'Custom' },
                  { label: isBn ? 'ফরম্যাট' : 'Format', value: `${sheetFormat} / ${paperSize}` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span className="text-[var(--text-muted)]">{item.label}</span>
                    <span className="font-medium text-[var(--text-primary)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className={labelCls}>{isBn ? 'কপি সংখ্যা' : 'Number of Copies'}</label>
              <input type="number" min="1" max="500" value={pdfCopyCount}
                onChange={(e) => setPdfCopyCount(Number(e.target.value) || 1)} className={inputCls} />
              <div className="flex items-center gap-4 mt-2 text-[0.5625rem] text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><QrCode size={10} /> {isBn ? 'ইউনিক QR কোড' : 'Unique QR Code'}</span>
                <span className="flex items-center gap-1"><Hash size={10} /> {isBn ? 'ইউনিক SN' : 'Unique SN'}</span>
                <span className="flex items-center gap-1"><Shield size={10} /> {isBn ? 'সিকিউরিটি টোকেন' : 'Security Token'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--brand-light)]/50 border border-[var(--brand)]/20 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.75rem] font-medium text-[var(--text-secondary)]">
                  {isBn ? 'মোট শিট' : 'Total Sheets'}:
                </span>
                <span className="text-[1.375rem] font-bold text-[var(--brand)]">
                  {(activeSubjects.length > 0 ? activeSubjects.length : 1) * pdfCopyCount}
                </span>
              </div>
              <div className="text-[0.5625rem] text-[var(--text-muted)] mt-1">
                {activeSubjects.length > 0 ? activeSubjects.length : 1} {isBn ? 'পৃষ্ঠা' : 'pages'} × {pdfCopyCount} {isBn ? 'কপি' : 'copies'}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleConfirmDownload}
                className="flex-[2] px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold cursor-pointer hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <Download size={15} />
                {isBn ? `জেনারেট করুন (${pdfCopyCount} কপি)` : `Generate (${pdfCopyCount} copies)`}
              </button>
              <button onClick={() => setShowPdfConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[0.75rem] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all">
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
