import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, Edit2, X, ScanLine, Printer, Palette } from 'lucide-react'
import { useExamStore, type OMRConfig as OMRExamConfig } from '@/store/examStore'
import { generateOMRSheetMultiCopy, type OMRConfig } from '@/pages/exams/omrTemplate'
import { sectionCls, inputCls, btnPrimary } from '@/lib/styles'
import type { Subject } from '@/pages/teachers/types'

const OMR_COLORS = [
  { value: '#d81b60', label: 'Pink' },
  { value: '#8e24aa', label: 'Purple' },
  { value: '#1e88e5', label: 'Blue' },
  { value: '#43a047', label: 'Green' },
  { value: '#f4511e', label: 'Orange' },
  { value: '#00897b', label: 'Teal' },
  { value: '#6d4c41', label: 'Brown' },
  { value: '#546e7a', label: 'Gray' },
  { value: '#000000', label: 'Black' },
]

interface OMRTabProps {
  isBn: boolean
  examConfigs: any[]
  subjects: Subject[]
  omrConfigs: OMRExamConfig[]
  gradeScales: any[]
  classes?: { id: string; name: string; nameBn: string }[]
  institution?: { name: string; nameBn: string; address?: string }
}

export default function OMRTab({ isBn, examConfigs, subjects, omrConfigs, classes = [], institution }: OMRTabProps) {
  const upsertOMRConfig = useExamStore((s) => s.upsertOMRConfig)
  const deleteOMRConfig = useExamStore((s) => s.deleteOMRConfig)

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

  const [showOMRDownload, setShowOMRDownload] = useState(false)
  const [omrDownloadConfig, setOmrDownloadConfig] = useState<OMRExamConfig | null>(null)
  const [omrQuantity, setOmrQuantity] = useState(1)
  const [omrColor, setOmrColor] = useState('#d81b60')
  const [omrClass, setOmrClass] = useState('')
  const [omrSection, setOmrSection] = useState('')
  const [omrPrinting, setOmrPrinting] = useState(false)
  const [omrOpts, setOmrOpts] = useState<Partial<OMRConfig>>({
    totalQuestions: 50,
    optionCount: 4,
    showRollNo: true,
    showRegistrationNo: true,
    showSetCode: true,
    showSubjectCode: true,
    sheetFormat: 'A',
  })

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
    <>
      {/* OMR Tab Content */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[0.75rem] text-[var(--text-secondary)]">
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
                  <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? subject?.nameBn : subject?.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[0.6875rem] text-[var(--text-muted)] flex-wrap">
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
          <p className="text-[0.8125rem] text-[var(--text-muted)]">{isBn ? 'কোনো OMR কনফিগ নেই' : 'No OMR configurations'}</p>
        </div>
      )}

      {/* OMR Form Modal */}
      {showOMRForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '26.25rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সঠিক' : 'Correct'}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={omrForm.correctMark}
                    onChange={(e) => setOMRForm((p) => ({ ...p, correctMark: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নেগেটিভ' : 'Negative'}</label>
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'অপশন' : 'Options'}</label>
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফরম্যাট' : 'Format'}</label>
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
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveOMR} className={`${btnPrimary} text-[0.75rem]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ OMR SHEET CREATOR ═══ */}
      {showOMRDownload && omrDownloadConfig && createPortal(
        (() => {
        const exam = examConfigs.find((e) => e.id === omrDownloadConfig.examId)
        const subject = subjects.find((s) => s.id === omrDownloadConfig.subjectId)
        const selectedClass = classes.find((c) => c.id === omrClass)

        return (
          <div className="modal-overlay">
            <div className="modal-box modal-content" style={{ maxWidth: '32rem' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
                    <ScanLine size={16} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div>
                    <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
                      {isBn ? 'OMR শিট তৈরি করুন' : 'Create OMR Sheet'}
                    </h3>
                    <p className="text-[0.6875rem] text-[var(--text-muted)]">
                      {isBn ? subject?.nameBn : subject?.name} · {omrDownloadConfig.totalQuestions} {isBn ? 'প্রশ্ন' : 'Q'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOMRDownload(false)}
                  className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Visual Preview Card */}
              <div
                className="rounded-xl p-4 mb-4 border-2 relative overflow-hidden"
                style={{ borderColor: omrColor, background: `${omrColor}08` }}
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: omrColor }} />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[0.875rem]" style={{ background: omrColor }}>
                    OMR
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                      {institution?.name || 'Institution'}
                    </div>
                    <div className="text-[0.6875rem] text-[var(--text-secondary)]">
                      {isBn ? subject?.nameBn : subject?.name} · {isBn ? exam?.nameBn : exam?.name}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 text-[0.6875rem]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-muted)]">{isBn ? 'প্রশ্ন' : 'Questions'}:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{omrOpts.totalQuestions}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-muted)]">{isBn ? 'অপশন' : 'Options'}:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{omrOpts.optionCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-muted)]">{isBn ? 'ফরম্যাট' : 'Format'}:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{omrOpts.sheetFormat}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-muted)]">{isBn ? 'মার্ক' : 'Mark'}:</span>
                    <span className="font-semibold" style={{ color: 'var(--green)' }}>+{omrDownloadConfig.correctMark}</span>
                    <span className="font-semibold" style={{ color: 'var(--red)' }}>-{omrDownloadConfig.negativeMark}</span>
                  </div>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="space-y-4 mb-4">
                {/* Quantity + Class */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] block mb-1.5">
                      {isBn ? 'পরিমাণ' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={omrQuantity}
                      onChange={(e) => setOmrQuantity(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                      className={`${inputCls} w-full text-center text-[1.125rem] font-bold`}
                    />
                  </div>
                  <div>
                    <label className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] block mb-1.5">
                      {isBn ? 'শ্রেণি' : 'Class'}
                    </label>
                    <select
                      value={omrClass}
                      onChange={(e) => { setOmrClass(e.target.value); setOmrSection('') }}
                      className={`${inputCls} w-full`}
                    >
                      <option value="">{isBn ? 'শ্রেণি নির্বাচন' : 'Select class'}</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 mb-2">
                    <Palette size={12} />
                    {isBn ? 'রঙ নির্বাচন' : 'Theme Color'}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {OMR_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setOmrColor(c.value)}
                        className="w-7 h-7 rounded-full border-2 cursor-pointer transition-all hover:scale-110"
                        style={{
                          background: c.value,
                          borderColor: omrColor === c.value ? 'var(--text-primary)' : 'transparent',
                          boxShadow: omrColor === c.value ? `0 0 0 2px var(--bg-primary), 0 0 0 4px ${c.value}` : 'none',
                        }}
                        title={c.label}
                      />
                    ))}
                    <label className="w-7 h-7 rounded-full border-2 border-dashed border-[var(--border)] cursor-pointer flex items-center justify-center hover:border-[var(--text-muted)] transition-colors">
                      <input
                        type="color"
                        value={omrColor}
                        onChange={(e) => setOmrColor(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-[0.5rem] text-[var(--text-muted)]">+</span>
                    </label>
                  </div>
                </div>

                {/* Questions + Options + Format */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] block mb-1.5">
                      {isBn ? 'প্রশ্ন' : 'Questions'}
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
                    <label className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] block mb-1.5">
                      {isBn ? 'অপশন' : 'Options'}
                    </label>
                    <select
                      value={omrOpts.optionCount}
                      onChange={(e) => setOmrOpts((p) => ({ ...p, optionCount: Number(e.target.value) }))}
                      className={`${inputCls} w-full`}
                    >
                      <option value={4}>4 (A,B,C,D)</option>
                      <option value={5}>5 (A,B,C,D,E)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] block mb-1.5">
                      {isBn ? 'ফরম্যাট' : 'Format'}
                    </label>
                    <div className="flex gap-1">
                      {(['A', 'B', 'C', 'D'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setOmrOpts((p) => ({ ...p, sheetFormat: f }))}
                          className={`flex-1 py-1.5 rounded-md text-[0.625rem] font-bold border cursor-pointer transition-all ${
                            omrOpts.sheetFormat === f
                              ? 'text-white border-transparent'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand)]'
                          }`}
                          style={omrOpts.sheetFormat === f ? { background: omrColor, borderColor: omrColor } : {}}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Include toggles */}
                <div>
                  <label className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] block mb-2">
                    {isBn ? 'অন্তর্ভুক্ত করুন' : 'Include'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'showRollNo' as const, label: isBn ? 'রোল' : 'Roll' },
                      { key: 'showRegistrationNo' as const, label: isBn ? 'রেজি' : 'Reg No' },
                      { key: 'showSetCode' as const, label: isBn ? 'সেট' : 'Set' },
                      { key: 'showSubjectCode' as const, label: isBn ? 'বিষয় কোড' : 'Subject' },
                    ].map((t) => (
                      <label
                        key={t.key}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all text-[0.625rem]"
                        style={{
                          background: omrOpts[t.key] ? `${omrColor}15` : 'var(--bg-secondary)',
                          borderColor: omrOpts[t.key] ? omrColor : 'var(--border)',
                          color: omrOpts[t.key] ? omrColor : 'var(--text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={omrOpts[t.key]}
                          onChange={(e) => setOmrOpts((p) => ({ ...p, [t.key]: e.target.checked }))}
                          className="sr-only"
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowOMRDownload(false)}
                  className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    setOmrPrinting(true)
                    try {
                      const cfg: OMRConfig = {
                        examName: exam?.name || '',
                        examNameBn: exam?.nameBn || '',
                        subjectName: subject?.name || '',
                        subjectNameBn: subject?.nameBn || '',
                        className: selectedClass?.name || '',
                        classNameBn: selectedClass?.nameBn || '',
                        groupName: '',
                        groupNameBn: '',
                        sectionName: omrSection,
                        sessionName: '',
                        totalQuestions: omrOpts.totalQuestions || 50,
                        optionCount: omrOpts.optionCount || 4,
                        correctMark: omrDownloadConfig.correctMark,
                        negativeMark: omrDownloadConfig.negativeMark,
                        sheetFormat: (omrOpts.sheetFormat || 'A') as 'A' | 'B' | 'C' | 'D',
                        themeColor: omrColor,
                        serialNumber: '0001',
                        institutionName: institution?.name || 'Institution',
                        institutionNameBn: institution?.nameBn || '',
                        institutionAddress: institution?.address || '',
                        showStudentName: true,
                        showRollNo: omrOpts.showRollNo ?? true,
                        showStudentId: true,
                        showRegistrationNo: omrOpts.showRegistrationNo ?? true,
                        showClass: !!omrClass,
                        showSection: false,
                        showGroup: false,
                        showExamName: false,
                        showSubjectName: false,
                        showSubjectCode: omrOpts.showSubjectCode ?? false,
                        showSetCode: omrOpts.showSetCode ?? true,
                        showDate: true,
                        showStudentSignature: true,
                        showStudentPhoto: false,
                        showQRCode: true,
                        showBarcode: false,
                        showSerialNumber: true,
                        showSecurityCode: false,
                        showVerificationCode: false,
                        showTeacherCode: false,
                        showInvigilatorCode: false,
                        showRoomNumber: false,
                        showSeatNumber: false,
                        showAdditionalPaper: true,
                        showPresentAbsent: false,
                        showExaminerRemarks: false,
                        showExaminerSection: true,
                        marksEntryStyle: 'abcd' as const,
                        customMarksValues: '',
                        showExaminerSignature: true,
                        showHeadExaminerSignature: false,
                        showVerificationSignature: false,
                        showCheckedBy: true,
                        showVerifiedBy: true,
                        showTotalMarks: true,
                        showPracticalMarks: false,
                        showVivaMarks: false,
                        showInstructions: true,
                        subjects: [],
                        paperSize: 'A4' as const,
                      }
                      const html = await generateOMRSheetMultiCopy(cfg, isBn, omrQuantity)
                      const w = window.open('', '_blank')
                      if (w) {
                        w.document.write(html)
                        w.document.close()
                        setTimeout(() => w.print(), 600)
                      }
                      setShowOMRDownload(false)
                    } finally {
                      setOmrPrinting(false)
                    }
                  }}
                  disabled={omrPrinting}
                  className="px-4 py-2 rounded-lg text-white text-[0.75rem] font-semibold cursor-pointer hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60"
                  style={{ background: omrColor }}
                >
                  <Printer size={13} />
                  {omrPrinting
                    ? (isBn ? 'তৈরি হচ্ছে...' : 'Generating...')
                    : (isBn ? `${omrQuantity} কপি প্রিন্ট করুন` : `Print ${omrQuantity} Copy${omrQuantity > 1 ? 's' : ''}`)
                  }
                </button>
              </div>
            </div>
          </div>
        )
      })(),
      document.body
    )}
    </>
  )
}
