import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  ArrowLeft,
  Download,
  Eye,
  Printer,
  Save,
  Copy,
  Archive,
  RotateCcw,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Layers,
  PenTool,
  FileCheck,
  Trash2,
  Loader2,
  User,
  GraduationCap,
  Stamp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useExamStore, type OMRTemplate } from '@/store/examStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { generateOMRHtml, generateOMRSheet, generateOMRSheetMultiCopy, type OMRConfig } from '@/pages/exams/omrTemplate'

const THEME_PRESETS = [
  { label: 'Red', value: '#d81b60' },
  { label: 'Blue', value: '#6366f1' },
  { label: 'Green', value: '#059669' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Orange', value: '#d97706' },
  { label: 'Cyan', value: '#0891b2' },
]

type WizardStep = 1 | 2 | 3 | 4

const WIZARD_STEPS = [
  { num: 1, key: 'exam' },
  { num: 2, key: 'fields' },
  { num: 3, key: 'examiner' },
  { num: 4, key: 'generate' },
] as const

export default function OMRSheetPage() {
  const nav = useNavigate()
  const { language: lang } = useAppStore()
  const isBn = lang === 'bn'
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const examConfigs = useExamStore((s) => s.examConfigs)
  const subjects = useTeacherStore((s) => s.subjects)
  const classes = useClassStore((s) => s.classes)
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const institution = useClassStore((s) => s.institution)
  const omrTemplates = useExamStore((s) => s.omrTemplates)
  const saveOMRTemplate = useExamStore((s) => s.saveOMRTemplate)
  const updateOMRTemplate = useExamStore((s) => s.updateOMRTemplate)
  const deleteOMRTemplate = useExamStore((s) => s.deleteOMRTemplate)
  const duplicateOMRTemplate = useExamStore((s) => s.duplicateOMRTemplate)
  const archiveOMRTemplate = useExamStore((s) => s.archiveOMRTemplate)
  const restoreOMRTemplate = useExamStore((s) => s.restoreOMRTemplate)

  // ── Wizard State ──
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)

  // ── Step 1: Exam Selection ──
  const [selectedExamId, setSelectedExamId] = useState(examConfigs[0]?.id || '')
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [sessionName, setSessionName] = useState(institution.currentSession || '2025-26')
  const [className, setClassName] = useState(classes[0] ? (isBn ? classes[0].nameBn : classes[0].name) : '')
  const [classNameBn, setClassNameBn] = useState(classes[0]?.nameBn || '')
  const [examName, setExamName] = useState(examConfigs[0] ? (isBn ? examConfigs[0].nameBn : examConfigs[0].name) : '')
  const [examNameBn, setExamNameBn] = useState(examConfigs[0]?.nameBn || '')
  const [themeColor, setThemeColor] = useState('#d81b60')
  const [totalCopy, setTotalCopy] = useState(1)
  const [serialNumber, setSerialNumber] = useState('5853')
  const [sheetLanguage, setSheetLanguage] = useState<'bn' | 'en'>(isBn ? 'bn' : 'en')

  // ── Step 2: Field Selection ──
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
  const [showTeacherCode, setShowTeacherCode] = useState(false)
  const [showRoomNumber, setShowRoomNumber] = useState(false)
  const [showSeatNumber, setShowSeatNumber] = useState(false)
  const [showAdditionalPaper, setShowAdditionalPaper] = useState(true)
  const [showPresentAbsent, setShowPresentAbsent] = useState(false)

  // ── Step 3: Examiner Config ──
  const [showExaminerSection, setShowExaminerSection] = useState(true)
  const [marksEntryStyle, setMarksEntryStyle] = useState<'abcd' | 'bn' | 'numbers' | 'custom'>('abcd')
  const [customMarksValues, setCustomMarksValues] = useState('')
  const [showExaminerSignature, setShowExaminerSignature] = useState(true)
  const [showHeadExaminerSignature, setShowHeadExaminerSignature] = useState(false)
  const [showCheckedBy, setShowCheckedBy] = useState(true)
  const [showVerifiedBy, setShowVerifiedBy] = useState(true)
  const [showTotalMarks, setShowTotalMarks] = useState(true)
  const [showPracticalMarks, setShowPracticalMarks] = useState(false)
  const [showVivaMarks, setShowVivaMarks] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  // ── Question Settings ──
  const [totalQuestions, setTotalQuestions] = useState(40)
  const [optionCount, setOptionCount] = useState(4)
  const [sheetFormat, setSheetFormat] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [correctMark, setCorrectMark] = useState(1)
  const [negativeMark, setNegativeMark] = useState(0.25)

  // ── Template State ──
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // ── Preview State ──
  const [previewHtml, setPreviewHtml] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPdfConfirm, setShowPdfConfirm] = useState(false)
  const [pdfCopyCount, setPdfCopyCount] = useState(1)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // ── Derived Data ──
  const selectedExam = examConfigs.find((e) => e.id === selectedExamId)

  const examSubjects = useMemo(() => {
    if (!selectedExam || !selectedClassId) return []
    const configs = subjectMarkConfigs.filter((c) => c.examId === selectedExamId && c.classId === selectedClassId)
    return configs.map((c) => subjects.find((s) => s.id === c.subjectId)).filter(Boolean) as { id: string; name: string; nameBn: string }[]
  }, [selectedExamId, selectedClassId, subjectMarkConfigs, subjects])

  const activeSubjects = useMemo(() => {
    if (selectedSubjectId) {
      const sub = examSubjects.find((s) => s.id === selectedSubjectId)
      return sub ? [sub] : []
    }
    return examSubjects
  }, [selectedSubjectId, examSubjects])

  const activeTemplates = useMemo(() => omrTemplates.filter((t) => !t.isArchived), [omrTemplates])
  const archivedTemplates = useMemo(() => omrTemplates.filter((t) => t.isArchived), [omrTemplates])

  // ── OMR Config ──
  const omrConfig = useMemo<OMRConfig>(
    () => ({
      examName: examName || selectedExam?.name || '',
      examNameBn: examNameBn || selectedExam?.nameBn || '',
      subjectName: activeSubjects[0]?.name || '',
      subjectNameBn: activeSubjects[0]?.nameBn || '',
      className: className || '',
      classNameBn: classNameBn || className || '',
      groupName: '',
      groupNameBn: '',
      sectionName: '',
      sessionName,
      totalQuestions,
      optionCount,
      correctMark,
      negativeMark,
      sheetFormat,
      themeColor,
      serialNumber,
      institutionName: institution.name || 'EduTech School',
      institutionNameBn: institution.nameBn || 'এডুটেক স্কুল',
      institutionAddress: institution.address || '',
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
      showTeacherCode,
      showRoomNumber,
      showSeatNumber,
      showAdditionalPaper,
      showPresentAbsent,
      showExaminerSection,
      marksEntryStyle,
      customMarksValues,
      showExaminerSignature,
      showHeadExaminerSignature,
      showCheckedBy,
      showVerifiedBy,
      showTotalMarks,
      showPracticalMarks,
      showVivaMarks,
      showInstructions,
      subjects: activeSubjects,
    }),
    [
      examName,
      examNameBn,
      className,
      classNameBn,
      sessionName,
      totalQuestions,
      optionCount,
      correctMark,
      negativeMark,
      sheetFormat,
      themeColor,
      serialNumber,
      institution,
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
      showTeacherCode,
      showRoomNumber,
      showSeatNumber,
      showAdditionalPaper,
      showPresentAbsent,
      showExaminerSection,
      marksEntryStyle,
      customMarksValues,
      showExaminerSignature,
      showHeadExaminerSignature,
      showCheckedBy,
      showVerifiedBy,
      showTotalMarks,
      showPracticalMarks,
      showVivaMarks,
      showInstructions,
      activeSubjects,
      selectedExam,
    ]
  )

  // ── Generate Preview ──
  const sheetIsBn = sheetLanguage === 'bn'
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    try {
      const html = await generateOMRHtml(omrConfig, sheetIsBn)
      setPreviewHtml(html)
    } catch {
      showNotify('error', isBn ? 'জেনারেট ব্যর্থ' : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [omrConfig, sheetIsBn, isBn])

  useEffect(() => {
    handleGenerate()
  }, [])

  // ── Auto-generate on config change ──
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleGenerate(), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [omrConfig])

  // ── Notifications ──
  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  // ── Actions ──
  const handleDownloadClick = () => {
    setPdfCopyCount(totalCopy)
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
    showNotify('success', isBn ? `${pdfCopyCount} কপি জেনারেট হচ্ছে...` : `Generating ${pdfCopyCount} copies...`)
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
      showNotify('success', isBn ? 'টেমপ্লেট আপডেট হয়েছে' : 'Template updated')
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
      showNotify('success', isBn ? 'টেমপ্লেট সংরক্ষিত হয়েছে' : 'Template saved')
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
    showNotify('success', isBn ? 'টেমপ্লেট লোড হয়েছে' : 'Template loaded')
  }

  const handleReset = () => {
    setActiveTemplateId(null)
    setTemplateName('')
    setSelectedExamId(examConfigs[0]?.id || '')
    setSelectedClassId(classes[0]?.id || '')
    setSelectedSubjectId('')
    setSessionName(institution.currentSession || '2025-26')
    setClassName(classes[0] ? (isBn ? classes[0].nameBn : classes[0].name) : '')
    setClassNameBn(classes[0]?.nameBn || '')
    setExamName(examConfigs[0] ? (isBn ? examConfigs[0].nameBn : examConfigs[0].name) : '')
    setExamNameBn(examConfigs[0]?.nameBn || '')
    setThemeColor('#d81b60')
    setSerialNumber('5853')
    setTotalQuestions(40)
    setOptionCount(4)
    setSheetFormat('A')
    setCorrectMark(1)
    setNegativeMark(0.25)
    setTotalCopy(1)
    setShowStudentName(true)
    setShowRollNo(true)
    setShowStudentId(true)
    setShowRegistrationNo(true)
    setShowClass(false)
    setShowSection(false)
    setShowGroup(false)
    setShowExamName(false)
    setShowSubjectName(true)
    setShowSubjectCode(false)
    setShowSetCode(true)
    setShowDate(true)
    setShowStudentSignature(true)
    setShowStudentPhoto(false)
    setShowQRCode(true)
    setShowBarcode(false)
    setShowSerialNumber(true)
    setShowSecurityCode(false)
    setShowTeacherCode(false)
    setShowRoomNumber(false)
    setShowSeatNumber(false)
    setShowAdditionalPaper(true)
    setShowPresentAbsent(false)
    setShowExaminerSection(true)
    setMarksEntryStyle('abcd')
    setCustomMarksValues('')
    setShowExaminerSignature(true)
    setShowHeadExaminerSignature(false)
    setShowCheckedBy(true)
    setShowVerifiedBy(true)
    setShowTotalMarks(true)
    setShowPracticalMarks(false)
    setShowVivaMarks(false)
    setShowInstructions(true)
    setCurrentStep(1)
    showNotify('success', isBn ? 'রিসেট সম্পন্ন' : 'Reset complete')
  }

  // ── Style Helpers ──
  const inputCls =
    'px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none focus:border-[var(--brand)] transition-colors'
  const selectCls = `${inputCls} cursor-pointer`
  const labelCls = 'text-[10px] font-medium text-[var(--text-secondary)] mb-1 block'
  const cardCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] overflow-hidden'
  const toggle = (checked: boolean, onChange: (v: boolean) => void) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-8 h-[18px] rounded-full transition-colors ${checked ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}
    >
      <div
        className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[14px]' : 'translate-x-[2px]'}`}
      />
    </button>
  )

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-[12px] font-medium ${
              notification.type === 'success'
                ? 'bg-[var(--green-light)] text-[var(--green)] border border-[var(--green)]/20'
                : 'bg-[var(--red-light)] text-[var(--red)] border border-[var(--red)]/20'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav('/exams')}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-[15px] font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ScanLine size={18} className="text-[var(--brand)]" />
                {isBn ? 'OMR শিট ডিজাইনার' : 'OMR Sheet Designer'}
              </h1>
              <p className="text-[10px] text-[var(--text-muted)]">
                {isBn ? 'পরীক্ষার OMR শিট তৈরি ও কাস্টমাইজ করুন' : 'Design & customize examination OMR sheets'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[11px] font-medium cursor-pointer hover:text-[var(--text-primary)] transition-all flex items-center gap-1"
            >
              <RefreshCw size={12} /> {isBn ? 'রিসেট' : 'Reset'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[11px] font-medium cursor-pointer hover:text-[var(--text-primary)] transition-all flex items-center gap-1"
            >
              <Printer size={12} /> {isBn ? 'প্রিন্ট' : 'Print'}
            </button>
            <button
              onClick={handleDownloadClick}
              className="px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer hover:shadow-md transition-all flex items-center gap-1"
            >
              <Download size={12} />
              {isBn ? 'ডাউনলোড PDF' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-3">
        <div className={`grid gap-4 ${isFullscreen ? '' : 'grid-cols-[380px_1fr]'}`}>
          {/* ═══ WIZARD PANEL ═══ */}
          {!isFullscreen && (
            <div className="flex flex-col gap-3 max-h-[calc(100vh-80px)] overflow-y-auto pr-1">
              {/* ── Step Indicator ── */}
              <div className={`${cardCls} px-4 py-3`}>
                <div className="flex items-center gap-1">
                  {WIZARD_STEPS.map((step, idx) => (
                    <div key={step.key} className="flex items-center flex-1">
                      <button
                        onClick={() => setCurrentStep(step.num as WizardStep)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                          currentStep === step.num
                            ? 'bg-[var(--brand)] text-white'
                            : currentStep > step.num
                              ? 'bg-[var(--green-light)] text-[var(--green)]'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                        }`}
                      >
                        {currentStep > step.num ? (
                          <CheckCircle2 size={11} />
                        ) : (
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border border-current">
                            {step.num}
                          </span>
                        )}
                        <span className="hidden sm:inline">
                          {step.key === 'exam'
                            ? isBn
                              ? 'পরীক্ষা'
                              : 'Exam'
                            : step.key === 'fields'
                              ? isBn
                                ? 'ফিল্ড'
                                : 'Fields'
                              : step.key === 'examiner'
                                ? isBn
                                  ? 'পরীক্ষক'
                                  : 'Examiner'
                                : isBn
                                  ? 'জেনারেট'
                                  : 'Generate'}
                        </span>
                      </button>
                      {idx < WIZARD_STEPS.length - 1 && <div className="flex-1 h-px bg-[var(--border)] mx-1" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ STEP 1: Exam & Institution ═══ */}
              {currentStep === 1 && (
                <div className={cardCls}>
                  <div className="px-4 py-3 bg-[var(--brand-light)] border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[var(--brand)] flex items-center justify-center">
                        <GraduationCap size={13} className="text-white" />
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                        {isBn ? 'ধাপ ১: পরীক্ষা ও প্রতিষ্ঠান' : 'Step 1: Exam & Institution'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-4 space-y-3 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>{isBn ? 'একাডেমিক সেশন' : 'Academic Session'}</label>
                        <input value={sessionName} onChange={(e) => setSessionName(e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                      <div>
                        <label className={labelCls}>{isBn ? 'শ্রেণি' : 'Class'}</label>
                        <select
                          value={selectedClassId}
                          onChange={(e) => {
                            setSelectedClassId(e.target.value)
                            const cls = classes.find((c) => c.id === e.target.value)
                            if (cls) {
                              setClassName(isBn ? cls.nameBn : cls.name)
                              setClassNameBn(cls.nameBn)
                            }
                          }}
                          className={`${selectCls} w-full`}
                        >
                          <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select...'}</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {isBn ? c.nameBn : c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>{isBn ? 'পরীক্ষা' : 'Exam'}</label>
                        <select
                          value={selectedExamId}
                          onChange={(e) => {
                            setSelectedExamId(e.target.value)
                            const ex = examConfigs.find((x) => x.id === e.target.value)
                            if (ex) {
                              setExamName(isBn ? ex.nameBn : ex.name)
                              setExamNameBn(ex.nameBn)
                            }
                          }}
                          className={`${selectCls} w-full`}
                        >
                          <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select...'}</option>
                          {examConfigs.map((e) => (
                            <option key={e.id} value={e.id}>
                              {isBn ? e.nameBn : e.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>{isBn ? 'বিষয়' : 'Subject'}</label>
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className={`${selectCls} w-full`}
                        >
                          <option value="">{isBn ? 'সব বিষয়' : 'All Subjects'}</option>
                          {examSubjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {isBn ? s.nameBn : s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className={labelCls}>{isBn ? 'থিম রঙ' : 'Theme Color'}</label>
                        <div className="flex items-center gap-1">
                          <select value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className={`${selectCls} flex-1`}>
                            {THEME_PRESETS.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="color"
                            value={themeColor}
                            onChange={(e) => setThemeColor(e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer border border-[var(--border)] p-0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>{isBn ? 'শিট ভাষা' : 'Sheet Language'}</label>
                        <select
                          value={sheetLanguage}
                          onChange={(e) => setSheetLanguage(e.target.value as 'bn' | 'en')}
                          className={`${selectCls} w-full`}
                        >
                          <option value="bn">বাংলা (Bangla)</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>{isBn ? 'মোট কপি' : 'Total Copy'}</label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={totalCopy}
                          onChange={(e) => setTotalCopy(Number(e.target.value) || 1)}
                          className={`${inputCls} w-full`}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>{isBn ? 'সিরিয়াল নং' : 'Serial No'}</label>
                        <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>{isBn ? 'শ্রেণির নাম' : 'Class Name'}</label>
                        <input value={className} onChange={(e) => setClassName(e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                      <div>
                        <label className={labelCls}>{isBn ? 'পরীক্ষার নাম' : 'Exam Name'}</label>
                        <input value={examName} onChange={(e) => setExamName(e.target.value)} className={`${inputCls} w-full`} />
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {isBn ? 'উত্পাদন:' : 'Output:'}{' '}
                        <span className="font-semibold text-[var(--text-primary)]">
                          {activeSubjects.length > 0 ? activeSubjects.length : 1} {isBn ? 'পৃষ্ঠা' : 'page(s)'}
                        </span>{' '}
                        × {totalCopy} {isBn ? 'কপি' : 'copies'} ={' '}
                        <span className="font-bold text-[var(--brand)]">
                          {(activeSubjects.length > 0 ? activeSubjects.length : 1) * totalCopy}
                        </span>{' '}
                        {isBn ? 'শিট' : 'sheets'}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer hover:shadow-md transition-all flex items-center justify-center gap-1"
                    >
                      {isBn ? 'পরবর্তী ধাপ' : 'Next Step'} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ STEP 2: Field Selection ═══ */}
              {currentStep === 2 && (
                <div className={cardCls}>
                  <div className="px-4 py-3 bg-[var(--teal-light)] border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[var(--teal)] flex items-center justify-center">
                        <Layers size={13} className="text-white" />
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                        {isBn ? 'ধাপ ২: ফিল্ড নির্বাচন' : 'Step 2: Field Selection'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-4 space-y-3 pt-3">
                    {/* Question Settings */}
                    <div>
                      <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        {isBn ? 'প্রশ্ন সেটিংস' : 'Question Settings'}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className={labelCls}>{isBn ? 'মোট প্রশ্ন' : 'Total Q'}</label>
                          <input
                            type="number"
                            min="10"
                            max="200"
                            value={totalQuestions}
                            onChange={(e) => setTotalQuestions(Number(e.target.value) || 40)}
                            className={`${inputCls} w-full`}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>{isBn ? 'অপশন' : 'Options'}</label>
                          <select
                            value={optionCount}
                            onChange={(e) => setOptionCount(Number(e.target.value))}
                            className={`${selectCls} w-full`}
                          >
                            <option value={4}>4 (ক,খ,গ,ঘ)</option>
                            <option value={5}>5 (ক-ঙ)</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>{isBn ? 'সঠিক নম্বর' : 'Correct Mark'}</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={correctMark}
                            onChange={(e) => setCorrectMark(Number(e.target.value) || 1)}
                            className={`${inputCls} w-full`}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>{isBn ? 'নেগেটিভ' : 'Negative'}</label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={negativeMark}
                            onChange={(e) => setNegativeMark(Number(e.target.value) || 0)}
                            className={`${inputCls} w-full`}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Format */}
                    <div>
                      <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        {isBn ? 'ফরম্যাট' : 'Sheet Format'}
                      </div>
                      <div className="flex gap-1">
                        {(['A', 'B', 'C', 'D'] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setSheetFormat(f)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all ${sheetFormat === f ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand)]/50'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Student Info */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                          <User size={11} /> {isBn ? 'শিক্ষার্থীর তথ্য' : 'Student Info'}
                        </div>
                        <button
                          onClick={() => {
                            const v = !showStudentName
                            setShowStudentName(v)
                            setShowRollNo(v)
                            setShowStudentId(v)
                            setShowRegistrationNo(v)
                            setShowClass(v)
                            setShowSection(v)
                            setShowGroup(v)
                            setShowExamName(v)
                            setShowSubjectName(v)
                            setShowSubjectCode(v)
                            setShowSetCode(v)
                            setShowDate(v)
                            setShowStudentSignature(v)
                            setShowStudentPhoto(v)
                          }}
                          className="text-[9px] text-[var(--brand)] font-medium cursor-pointer hover:underline"
                        >
                          {isBn ? 'সব টগল' : 'Toggle All'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {[
                          { label: isBn ? 'শিক্ষার্থীর নাম' : 'Student Name', val: showStudentName, set: setShowStudentName },
                          { label: isBn ? 'রোল নম্বর' : 'Roll Number', val: showRollNo, set: setShowRollNo },
                          { label: isBn ? 'শিক্ষার্থী আইডি' : 'Student ID', val: showStudentId, set: setShowStudentId },
                          { label: isBn ? 'রেজিস্ট্রেশন' : 'Registration', val: showRegistrationNo, set: setShowRegistrationNo },
                          { label: isBn ? 'শ্রেণি' : 'Class', val: showClass, set: setShowClass },
                          { label: isBn ? 'শাখা' : 'Section', val: showSection, set: setShowSection },
                          { label: isBn ? 'গ্রুপ' : 'Group', val: showGroup, set: setShowGroup },
                          { label: isBn ? 'পরীক্ষার নাম' : 'Exam Name', val: showExamName, set: setShowExamName },
                          { label: isBn ? 'বিষয়ের নাম' : 'Subject Name', val: showSubjectName, set: setShowSubjectName },
                          { label: isBn ? 'বিষয় কোড' : 'Subject Code', val: showSubjectCode, set: setShowSubjectCode },
                          { label: isBn ? 'সেট কোড' : 'Set Code', val: showSetCode, set: setShowSetCode },
                          { label: isBn ? 'তারিখ' : 'Date', val: showDate, set: setShowDate },
                          { label: isBn ? 'স্বাক্ষর' : 'Signature', val: showStudentSignature, set: setShowStudentSignature },
                          { label: isBn ? 'ছবি' : 'Photo', val: showStudentPhoto, set: setShowStudentPhoto },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <span className="text-[11px] text-[var(--text-primary)]">{item.label}</span>
                            {toggle(item.val, item.set)}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Identification */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                          <ScanLine size={11} /> {isBn ? 'শনাক্তকরণ' : 'Identification'}
                        </div>
                        <button
                          onClick={() => {
                            const v = !showQRCode
                            setShowQRCode(v)
                            setShowBarcode(v)
                            setShowSerialNumber(v)
                            setShowSecurityCode(v)
                          }}
                          className="text-[9px] text-[var(--brand)] font-medium cursor-pointer hover:underline"
                        >
                          {isBn ? 'সব টগল' : 'Toggle All'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {[
                          { label: isBn ? 'QR কোড' : 'QR Code', val: showQRCode, set: setShowQRCode },
                          { label: isBn ? 'বারকোড' : 'Barcode', val: showBarcode, set: setShowBarcode },
                          { label: isBn ? 'সিরিয়াল নম্বর' : 'Serial Number', val: showSerialNumber, set: setShowSerialNumber },
                          { label: isBn ? 'সিকিউরিটি কোড' : 'Security Code', val: showSecurityCode, set: setShowSecurityCode },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <span className="text-[11px] text-[var(--text-primary)]">{item.label}</span>
                            {toggle(item.val, item.set)}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Examination */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                          <FileCheck size={11} /> {isBn ? 'পরীক্ষা' : 'Examination'}
                        </div>
                        <button
                          onClick={() => {
                            const v = !showTeacherCode
                            setShowTeacherCode(v)
                            setShowRoomNumber(v)
                            setShowSeatNumber(v)
                            setShowAdditionalPaper(v)
                            setShowPresentAbsent(v)
                          }}
                          className="text-[9px] text-[var(--brand)] font-medium cursor-pointer hover:underline"
                        >
                          {isBn ? 'সব টগল' : 'Toggle All'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {[
                          { label: isBn ? 'শিক্ষক কোড' : 'Teacher Code', val: showTeacherCode, set: setShowTeacherCode },
                          { label: isBn ? 'রুম নম্বর' : 'Room Number', val: showRoomNumber, set: setShowRoomNumber },
                          { label: isBn ? 'সিট নম্বর' : 'Seat Number', val: showSeatNumber, set: setShowSeatNumber },
                          { label: isBn ? 'অতিরিক্ত পত্র' : 'Additional Paper', val: showAdditionalPaper, set: setShowAdditionalPaper },
                          { label: isBn ? 'উপস্থিতি' : 'Present/Absent', val: showPresentAbsent, set: setShowPresentAbsent },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <span className="text-[11px] text-[var(--text-primary)]">{item.label}</span>
                            {toggle(item.val, item.set)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] text-[11px] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all"
                      >
                        {isBn ? 'আগের ধাপ' : 'Previous'}
                      </button>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer hover:shadow-md transition-all flex items-center justify-center gap-1"
                      >
                        {isBn ? 'পরবর্তী ধাপ' : 'Next Step'} <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STEP 3: Examiner Config ═══ */}
              {currentStep === 3 && (
                <div className={cardCls}>
                  <div className="px-4 py-3 bg-[var(--amber-light)] border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[var(--amber)] flex items-center justify-center">
                        <Stamp size={13} className="text-white" />
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                        {isBn ? 'ধাপ ৩: পরীক্ষক কনফিগ' : 'Step 3: Examiner Config'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-4 space-y-3 pt-3">
                    {/* Marks Entry Style */}
                    <div>
                      <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        {isBn ? 'উত্তর প্রবেশ ধরন' : 'Marks Entry Style'}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { key: 'abcd' as const, label: isBn ? 'ক,খ,গ,ঘ' : 'A,B,C,D' },
                          { key: 'bn' as const, label: isBn ? 'ক-ঙ (৫)' : 'ক-ঙ (5)' },
                          { key: 'numbers' as const, label: isBn ? 'সংখ্যা' : 'Numbers' },
                          { key: 'custom' as const, label: isBn ? 'কাস্টম' : 'Custom' },
                        ].map((style) => (
                          <button
                            key={style.key}
                            onClick={() => setMarksEntryStyle(style.key)}
                            className={`py-1.5 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all ${
                              marksEntryStyle === style.key
                                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand)]/50'
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                      {marksEntryStyle === 'custom' && (
                        <div className="mt-2">
                          <label className={labelCls}>{isBn ? 'কাস্টম মান (কমা দিয়ে আলাদা)' : 'Custom values (comma separated)'}</label>
                          <input
                            value={customMarksValues}
                            onChange={(e) => setCustomMarksValues(e.target.value)}
                            placeholder="e.g. 1,2,3,4,5"
                            className={`${inputCls} w-full`}
                          />
                        </div>
                      )}
                    </div>
                    {/* Examiner Visibility */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                          <PenTool size={11} /> {isBn ? 'পরীক্ষক অংশ' : 'Examiner Section'}
                        </div>
                        <button
                          onClick={() => {
                            const v = !showExaminerSection
                            setShowExaminerSection(v)
                            setShowExaminerSignature(v)
                            setShowHeadExaminerSignature(v)
                            setShowCheckedBy(v)
                            setShowVerifiedBy(v)
                            setShowTotalMarks(v)
                            setShowPracticalMarks(v)
                            setShowVivaMarks(v)
                          }}
                          className="text-[9px] text-[var(--brand)] font-medium cursor-pointer hover:underline"
                        >
                          {isBn ? 'সব টগল' : 'Toggle All'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {[
                          { label: isBn ? 'পরীক্ষক অংশ' : 'Examiner Section', val: showExaminerSection, set: setShowExaminerSection },
                          {
                            label: isBn ? 'পরীক্ষকের স্বাক্ষর' : 'Examiner Signature',
                            val: showExaminerSignature,
                            set: setShowExaminerSignature,
                          },
                          {
                            label: isBn ? 'প্রধান পরীক্ষকের স্বাক্ষর' : 'Head Examiner Signature',
                            val: showHeadExaminerSignature,
                            set: setShowHeadExaminerSignature,
                          },
                          { label: isBn ? 'চেক করেছেন' : 'Checked By', val: showCheckedBy, set: setShowCheckedBy },
                          { label: isBn ? 'যাচাই করেছেন' : 'Verified By', val: showVerifiedBy, set: setShowVerifiedBy },
                          { label: isBn ? 'মোট নম্বর' : 'Total Marks', val: showTotalMarks, set: setShowTotalMarks },
                          { label: isBn ? 'ব্যবহারিক নম্বর' : 'Practical Marks', val: showPracticalMarks, set: setShowPracticalMarks },
                          { label: isBn ? 'মৌখিক নম্বর' : 'Viva Marks', val: showVivaMarks, set: setShowVivaMarks },
                          { label: isBn ? 'নির্দেশনা' : 'Instructions', val: showInstructions, set: setShowInstructions },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <span className="text-[11px] text-[var(--text-primary)]">{item.label}</span>
                            {toggle(item.val, item.set)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] text-[11px] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all"
                      >
                        {isBn ? 'আগের ধাপ' : 'Previous'}
                      </button>
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer hover:shadow-md transition-all flex items-center justify-center gap-1"
                      >
                        {isBn ? 'পরবর্তী ধাপ' : 'Next Step'} <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STEP 4: Generate & Templates ═══ */}
              {currentStep === 4 && (
                <>
                  {/* Quick Actions */}
                  <div className={cardCls}>
                    <div className="px-4 py-3 bg-[var(--green-light)] border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[var(--green)] flex items-center justify-center">
                          <Download size={13} className="text-white" />
                        </div>
                        <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                          {isBn ? 'ধাপ ৪: জেনারেট ও টেমপ্লেট' : 'Step 4: Generate & Template'}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 pb-4 space-y-3 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handlePrint}
                          className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer hover:border-[var(--brand)]/50 transition-all text-center"
                        >
                          <Printer size={18} className="text-[var(--brand)] mx-auto mb-1" />
                          <div className="text-[11px] font-semibold text-[var(--text-primary)]">{isBn ? 'প্রিন্ট' : 'Print'}</div>
                        </button>
                        <button
                          onClick={handleDownloadClick}
                          className="p-3 rounded-lg border border-[var(--brand)] bg-[var(--brand-light)] cursor-pointer hover:shadow-md transition-all text-center"
                        >
                          <Download size={18} className="text-[var(--brand)] mx-auto mb-1" />
                          <div className="text-[11px] font-semibold text-[var(--text-primary)]">
                            {isBn ? 'ডাউনলোড PDF' : 'Download PDF'}
                          </div>
                        </button>
                      </div>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[11px] font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all"
                      >
                        {isBn ? 'আগের ধাপ' : 'Previous'}
                      </button>
                    </div>
                  </div>

                  {/* Template Management */}
                  <div className={cardCls}>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Save size={13} className="text-[var(--purple)]" />
                        <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                          {isBn ? 'টেমপ্লেট ম্যানেজমেন্ট' : 'Template Management'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowSaveDialog(true)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer hover:shadow-md transition-all flex items-center justify-center gap-1"
                          >
                            <Save size={12} /> {activeTemplateId ? (isBn ? 'আপডেট' : 'Update') : isBn ? 'সংরক্ষণ' : 'Save'}
                          </button>
                          {activeTemplateId && (
                            <button
                              onClick={() => {
                                setActiveTemplateId(null)
                                setTemplateName('')
                              }}
                              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-[11px] cursor-pointer hover:text-[var(--text-primary)]"
                            >
                              {isBn ? 'নতুন' : 'New'}
                            </button>
                          )}
                        </div>
                        {showSaveDialog && (
                          <div className="p-3 rounded-lg border border-[var(--brand)]/30 bg-[var(--brand-light)]/30 space-y-2">
                            <input
                              value={templateName}
                              onChange={(e) => setTemplateName(e.target.value)}
                              placeholder={isBn ? 'টেমপ্লেটের নাম...' : 'Template name...'}
                              className={`${inputCls} w-full`}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveTemplate}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer"
                              >
                                {isBn ? 'সংরক্ষণ' : 'Save'}
                              </button>
                              <button
                                onClick={() => setShowSaveDialog(false)}
                                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[11px] cursor-pointer"
                              >
                                {isBn ? 'বাতিল' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Template List */}
                      {activeTemplates.length > 0 && (
                        <div className="space-y-1.5 mt-3">
                          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            {isBn ? 'সংরক্ষিত টেমপ্লেট' : 'Saved Templates'}
                          </div>
                          {activeTemplates.map((tpl) => (
                            <div
                              key={tpl.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${activeTemplateId === tpl.id ? 'border-[var(--brand)] bg-[var(--brand-light)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/50'}`}
                              onClick={() => handleLoadTemplate(tpl)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium text-[var(--text-primary)] truncate">{tpl.name}</div>
                                <div className="text-[9px] text-[var(--text-muted)]">
                                  v{tpl.version} • {tpl.updatedAt ? new Date(tpl.updatedAt).toLocaleDateString() : ''}
                                </div>
                              </div>
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    const n = prompt(isBn ? 'নতুন নাম:' : 'New name:', tpl.name)
                                    if (n) duplicateOMRTemplate(tpl.id, n)
                                  }}
                                  className="p-1 rounded hover:bg-[var(--bg-primary)]"
                                  title={isBn ? 'ডুপ্লিকেট' : 'Duplicate'}
                                >
                                  <Copy size={11} className="text-[var(--text-muted)]" />
                                </button>
                                <button
                                  onClick={() => archiveOMRTemplate(tpl.id)}
                                  className="p-1 rounded hover:bg-[var(--bg-primary)]"
                                  title={isBn ? 'আর্কাইভ' : 'Archive'}
                                >
                                  <Archive size={11} className="text-[var(--text-muted)]" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(tpl.id)}
                                  className="p-1 rounded hover:bg-[var(--bg-primary)]"
                                  title={isBn ? 'মুছুন' : 'Delete'}
                                >
                                  <Trash2 size={11} className="text-[var(--red)]" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Archived */}
                      {archivedTemplates.length > 0 && (
                        <div className="space-y-1.5 mt-3">
                          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                            {isBn ? 'আর্কাইভ' : 'Archived'}
                          </div>
                          {archivedTemplates.map((tpl) => (
                            <div
                              key={tpl.id}
                              className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] opacity-60"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-medium text-[var(--text-primary)] truncate">{tpl.name}</div>
                              </div>
                              <button
                                onClick={() => restoreOMRTemplate(tpl.id)}
                                className="p-1 rounded hover:bg-[var(--bg-primary)]"
                                title={isBn ? 'রিস্টোর' : 'Restore'}
                              >
                                <RotateCcw size={11} className="text-[var(--text-muted)]" />
                              </button>
                              <button
                                onClick={() => deleteOMRTemplate(tpl.id)}
                                className="p-1 rounded hover:bg-[var(--bg-primary)]"
                                title={isBn ? 'মুছুন' : 'Delete'}
                              >
                                <Trash2 size={11} className="text-[var(--red)]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeTemplates.length === 0 && archivedTemplates.length === 0 && (
                        <div className="text-center py-4 text-[11px] text-[var(--text-muted)]">
                          {isBn ? 'এখনো কোনো টেমপ্লেট সংরক্ষিত হয়নি' : 'No templates saved yet'}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ LIVE PREVIEW ═══ */}
          <div className={`${cardCls} ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
            {/* Preview Header */}
            <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={13} className="text-[var(--text-muted)]" />
                <span className="text-[11px] font-medium text-[var(--text-muted)]">{isBn ? 'লাইভ প্রিভিউ' : 'Live Preview'}</span>
                {isGenerating && <Loader2 size={12} className="text-[var(--brand)] animate-spin" />}
                <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">A4</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  className="p-1 rounded hover:bg-[var(--bg-primary)] transition-colors"
                  title={isBn ? 'জুম আউট' : 'Zoom Out'}
                >
                  <ZoomOut size={13} className="text-[var(--text-muted)]" />
                </button>
                <span className="text-[10px] text-[var(--text-muted)] font-medium min-w-[32px] text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(200, z + 10))}
                  className="p-1 rounded hover:bg-[var(--bg-primary)] transition-colors"
                  title={isBn ? 'জুম ইন' : 'Zoom In'}
                >
                  <ZoomIn size={13} className="text-[var(--text-muted)]" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="px-1.5 py-0.5 rounded text-[9px] text-[var(--text-muted)] hover:bg-[var(--bg-primary)] transition-colors font-medium"
                >
                  {isBn ? 'ফিট' : 'Fit'}
                </button>
                <div className="w-px h-4 bg-[var(--border)] mx-1" />
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1 rounded hover:bg-[var(--bg-primary)] transition-colors"
                  title={isBn ? 'ফুল স্ক্রিন' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 size={13} className="text-[var(--text-muted)]" />
                  ) : (
                    <Maximize2 size={13} className="text-[var(--text-muted)]" />
                  )}
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div
              className="flex justify-center bg-gray-100 p-4 overflow-auto"
              style={{ minHeight: isFullscreen ? 'calc(100vh - 40px)' : '800px' }}
            >
              {previewHtml ? (
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewHtml}
                    className="bg-white shadow-lg"
                    style={{ width: '210mm', minHeight: '297mm', border: 'none' }}
                    title="OMR Preview"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[var(--text-muted)] text-[13px] gap-2">
                  <Loader2 size={24} className="animate-spin" />
                  {isBn ? 'প্রিভিউ লোড হচ্ছে...' : 'Loading preview...'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={() => setShowDeleteConfirm(null)}>
          <div
            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-5 w-[320px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-[var(--red)]" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-4">
              {isBn ? 'এই টেমপ্লেটটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This template will be permanently deleted.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  deleteOMRTemplate(showDeleteConfirm)
                  setShowDeleteConfirm(null)
                  showNotify('success', isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted')
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--red)] text-white text-[11px] font-semibold cursor-pointer"
              >
                {isBn ? 'মুছুন' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[11px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Generation Confirm Modal */}
      {showPdfConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={() => setShowPdfConfirm(false)}>
          <div
            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-5 w-[380px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Download size={16} className="text-[var(--brand)]" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? 'PDF জেনারেট করুন' : 'Generate PDF'}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-4">
              {isBn
                ? 'কতটি PDF কপি প্রয়োজন? প্রতিটি কপিতে ইউনিক QR কোড থাকবে।'
                : 'How many PDF copies needed? Each copy will have a unique QR code.'}
            </p>
            <div className="mb-4">
              <label className={labelCls}>{isBn ? 'কপি সংখ্যা' : 'Number of Copies'}</label>
              <input
                type="number"
                min="1"
                max="500"
                value={pdfCopyCount}
                onChange={(e) => setPdfCopyCount(Number(e.target.value) || 1)}
                className={`${inputCls} w-full`}
              />
              <div className="text-[9px] text-[var(--text-muted)] mt-1">
                {isBn
                  ? `শিট ভাষা: ${sheetLanguage === 'bn' ? 'বাংলা' : 'English'}`
                  : `Sheet language: ${sheetLanguage === 'bn' ? 'Bangla' : 'English'}`}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDownload}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1"
              >
                <Download size={12} />
                {isBn ? `ডাউনলোড (${pdfCopyCount} কপি)` : `Download (${pdfCopyCount} copies)`}
              </button>
              <button
                onClick={() => setShowPdfConfirm(false)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[11px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
