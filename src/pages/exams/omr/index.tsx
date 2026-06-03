import { useState, useMemo, useRef, useCallback } from 'react'
import { ArrowLeft, Download, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useExamStore } from '@/store/examStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { generateOMRHtml, generateOMRSheet, type OMRConfig } from '@/pages/exams/omrTemplate'

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

  const [selectedExamId, setSelectedExamId] = useState(examConfigs[0]?.id || '')
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '')
  const [sessionName, setSessionName] = useState(institution.currentSession || '2025-26')
  const [className, setClassName] = useState(classes[0] ? (isBn ? classes[0].nameBn : classes[0].name) : '')
  const [classNameBn, setClassNameBn] = useState(classes[0]?.nameBn || '')
  const [examName, setExamName] = useState(examConfigs[0] ? (isBn ? examConfigs[0].nameBn : examConfigs[0].name) : '')
  const [examNameBn, setExamNameBn] = useState(examConfigs[0]?.nameBn || '')
  const [showSubjects, setShowSubjects] = useState(true)
  const [showSubjectCode, setShowSubjectCode] = useState(true)
  const [showRollNo, setShowRollNo] = useState(true)
  const [showRegistrationNo, setShowRegistrationNo] = useState(true)
  const [showSetCode, setShowSetCode] = useState(true)
  const [themeColor, setThemeColor] = useState('#d81b60')
  const [serialNumber, setSerialNumber] = useState('5853')
  const [totalQuestions, setTotalQuestions] = useState(40)
  const [optionCount, setOptionCount] = useState(4)
  const [sheetFormat, setSheetFormat] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [totalCopy, setTotalCopy] = useState(1)

  const selectedExam = examConfigs.find((e) => e.id === selectedExamId)

  const examSubjects = useMemo(() => {
    if (!selectedExam || !selectedClassId) return []
    const configs = subjectMarkConfigs.filter((c) => c.examId === selectedExamId && c.classId === selectedClassId)
    return configs.map((c) => subjects.find((s) => s.id === c.subjectId)).filter(Boolean) as { name: string; nameBn: string }[]
  }, [selectedExamId, selectedClassId, subjectMarkConfigs, subjects])

  const omrConfig = useMemo<OMRConfig>(
    () => ({
      examName: examName || selectedExam?.name || '',
      examNameBn: examNameBn || selectedExam?.nameBn || '',
      subjectName: examSubjects[0]?.name || '',
      subjectNameBn: examSubjects[0]?.nameBn || '',
      className: className || '',
      classNameBn: classNameBn || className || '',
      sessionName,
      totalQuestions,
      optionCount,
      correctMark: 1,
      negativeMark: 0.25,
      sheetFormat,
      themeColor,
      serialNumber,
      institutionName: institution.name || 'EduTech School',
      institutionNameBn: institution.nameBn || 'এডুটেক স্কুল',
      institutionAddress: institution.address || '',
      showRollNo,
      showRegistrationNo,
      showSetCode,
      showSubjects,
      showSubjectCode,
      subjects: examSubjects,
    }),
    [
      examName,
      examNameBn,
      className,
      classNameBn,
      sessionName,
      totalQuestions,
      optionCount,
      sheetFormat,
      themeColor,
      serialNumber,
      institution,
      showRollNo,
      showRegistrationNo,
      showSetCode,
      showSubjects,
      showSubjectCode,
      examSubjects,
      selectedExam,
    ]
  )

  const [previewHtml, setPreviewHtml] = useState('')

  const handleGenerate = useCallback(async () => {
    const html = await generateOMRHtml(omrConfig, isBn)
    setPreviewHtml(html)
  }, [omrConfig, isBn])

  // Auto-generate on first load
  useMemo(() => {
    handleGenerate()
  }, [])

  const handleDownload = () => {
    generateOMRSheet(omrConfig, isBn)
  }

  const inputCls =
    'px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none focus:border-[var(--brand)]'
  const selectCls =
    'px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none focus:border-[var(--brand)] cursor-pointer'

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav('/exams')}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-[15px] font-bold text-[var(--text-primary)]">{isBn ? 'OMR শিট' : 'OMR Sheet'}</h1>
              <p className="text-[10px] text-[var(--text-muted)]">Generate Exam Front Page for Session</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer hover:shadow-md transition-all flex items-center gap-1"
            >
              <Download size={12} />
              {isBn ? 'সব পেজ ডাউনলোড' : 'Download All Page'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-3">
        {/* Settings Bar */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-4 mb-4">
          {/* Row 1: Class, Exam, Total Copy, Generate */}
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Class</label>
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
                <option value="">Select...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBn ? c.nameBn : c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Exam</label>
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
                <option value="">Select...</option>
                {examConfigs.map((e) => (
                  <option key={e.id} value={e.id}>
                    {isBn ? e.nameBn : e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[100px]">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Total Copy</label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalCopy}
                onChange={(e) => setTotalCopy(Number(e.target.value) || 1)}
                className={`${inputCls} w-full`}
              />
            </div>
            <button
              onClick={handleGenerate}
              className="px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold cursor-pointer hover:shadow-md transition-all"
            >
              Generate Page
            </button>
          </div>

          {/* Row 2: Editable Names */}
          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Session Name (edit if needed)</label>
              <input value={sessionName} onChange={(e) => setSessionName(e.target.value)} className={`${inputCls} w-full`} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Class Name (edit if needed)</label>
              <input value={className} onChange={(e) => setClassName(e.target.value)} className={`${inputCls} w-full`} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Exam Name (edit if needed)</label>
              <input value={examName} onChange={(e) => setExamName(e.target.value)} className={`${inputCls} w-full`} />
            </div>
          </div>

          {/* Row 3: Toggles, Questions, Options, Format, Theme, Serial */}
          <div className="flex items-end gap-3 flex-wrap">
            <div className="w-[130px]">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Show Subject's Code</label>
              <select
                value={showSubjectCode ? 'Yes' : 'No'}
                onChange={(e) => setShowSubjectCode(e.target.value === 'Yes')}
                className={`${selectCls} w-full`}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="w-[130px]">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Show Subjects</label>
              <select
                value={showSubjects ? 'Yes' : 'No'}
                onChange={(e) => setShowSubjects(e.target.value === 'Yes')}
                className={`${selectCls} w-full`}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="w-[100px]">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Total Q</label>
              <input
                type="number"
                min="10"
                max="200"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value) || 40)}
                className={`${inputCls} w-full`}
              />
            </div>
            <div className="w-[100px]">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Options</label>
              <select value={optionCount} onChange={(e) => setOptionCount(Number(e.target.value))} className={`${selectCls} w-full`}>
                <option value={4}>4 (ক,খ,গ,ঘ)</option>
                <option value={5}>5 (ক-ঙ)</option>
              </select>
            </div>
            <div className="w-[80px]">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Format</label>
              <div className="flex gap-1">
                {(['A', 'B', 'C', 'D'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSheetFormat(f)}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-all ${sheetFormat === f ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-[150px]">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Theme</label>
              <div className="flex items-center gap-1">
                <select value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className={`${selectCls} flex-1`}>
                  <option value="#d81b60">Red</option>
                  <option value="#6366f1">Blue</option>
                  <option value="#059669">Green</option>
                  <option value="#d97706">Orange</option>
                  <option value="#7c3aed">Purple</option>
                  <option value="#0891b2">Cyan</option>
                </select>
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-[var(--border)] p-0"
                />
              </div>
            </div>
            <div className="w-[100px]">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">Serial No</label>
              <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={`${inputCls} w-full`} />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'roll', label: 'Roll', val: showRollNo, set: setShowRollNo },
                { key: 'reg', label: 'Reg', val: showRegistrationNo, set: setShowRegistrationNo },
                { key: 'set', label: 'Set', val: showSetCode, set: setShowSetCode },
              ].map((t) => (
                <label key={t.key} className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t.val}
                    onChange={(e) => t.set(e.target.checked)}
                    className="w-3 h-3 accent-[var(--brand)]"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-[14px] border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Eye size={11} />
              Live Preview
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">A4</span>
          </div>
          <div className="flex justify-center bg-gray-100 p-4" style={{ minHeight: '800px' }}>
            {previewHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="bg-white shadow-lg"
                style={{ width: '210mm', minHeight: '297mm', border: 'none' }}
                title="OMR Preview"
              />
            ) : (
              <div className="flex items-center justify-center text-[var(--text-muted)] text-[13px]">Loading preview...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
