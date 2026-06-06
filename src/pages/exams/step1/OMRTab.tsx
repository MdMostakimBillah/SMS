import { useState } from 'react'
import { Plus, Trash2, Edit2, X, ScanLine } from 'lucide-react'
import { useExamStore, type OMRConfig as OMRExamConfig } from '@/store/examStore'
import { generateOMRSheet, type OMRConfig } from '@/pages/exams/omrTemplate'
import { sectionCls, inputCls, btnPrimary } from '@/lib/styles'
import type { Subject } from '@/pages/teachers/types'

interface OMRTabProps {
  isBn: boolean
  examConfigs: any[]
  subjects: Subject[]
  omrConfigs: OMRExamConfig[]
  gradeScales: any[]
}

export default function OMRTab({ isBn, examConfigs, subjects, omrConfigs }: OMRTabProps) {
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
      {showOMRForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[0.875rem] max-w-[26.25rem] w-full p-5 border border-[var(--border)]">
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
        </div>
      )}

      {/* OMR Download Modal */}
      {showOMRDownload &&
        omrDownloadConfig &&
        (() => {
          const exam = examConfigs.find((e) => e.id === omrDownloadConfig.examId)
          const subject = subjects.find((s) => s.id === omrDownloadConfig.subjectId)
          return (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
              <div className="bg-[var(--bg-primary)] rounded-[0.875rem] max-w-[25rem] w-full p-5 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
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
                  <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">
                    <strong>{isBn ? 'পরীক্ষা' : 'Exam'}:</strong> {isBn ? exam?.nameBn : exam?.name}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">
                    <strong>{isBn ? 'বিষয়' : 'Subject'}:</strong> {isBn ? subject?.nameBn : subject?.name}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    <strong>{isBn ? 'মার্কিং' : 'Marking'}:</strong> +{omrDownloadConfig.correctMark} / -{omrDownloadConfig.negativeMark}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                      <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'অপশন' : 'Options'}</label>
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
                  <div className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'অন্তর্ভুক্ত করুন' : 'Include'}:</div>
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
                        <span className="text-[0.625rem] text-[var(--text-primary)]">{t.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Format */}
                  <div>
                    <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফরম্যাট' : 'Format'}</label>
                    <div className="flex gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setOmrOpts((p) => ({ ...p, sheetFormat: f }))}
                          className={`flex-1 py-1.5 rounded-lg text-[0.6875rem] font-semibold border cursor-pointer transition-all ${
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
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
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
                          paperSize: 'A4' as const,
                          showVerificationCode: false,
                          showInvigilatorCode: false,
                          showExaminerRemarks: false,
                          showVerificationSignature: false,
                        },
                        isBn
                      )
                      setShowOMRDownload(false)
                    }}
                    className="px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.75rem] font-semibold cursor-pointer hover:shadow-md transition-all"
                  >
                    <ScanLine size={13} className="inline mr-1 -mt-0.5" />
                    {isBn ? 'ডাউনলোড PDF' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
    </>
  )
}
