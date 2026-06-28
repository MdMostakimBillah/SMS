import React, { useState, useMemo } from 'react'
import { ClipboardCheck, Save, Trash2, Settings, X, Award, BookOpen, Users } from 'lucide-react'
import { sectionCls, sectionTitleCls, inputCls, btnPrimary } from '@/lib/styles'
import type { MarkAdjustment, ExtraMarkEntry, ExtraMarkType } from '@/store/examStore'

interface Student {
  id: string
  nameEn: string
  nameBn?: string
  class?: string
  section?: string
  roll?: string
}

interface TabulationRow {
  student: Student
  subjectMarks: { obtained: number; fullMarks: number; passMarks: number; passed: boolean }[]
  totalObtained: number
  totalFull: number
  percentage: number
  passedAll: boolean
  gpa: number
}

interface Props {
  examId: string
  classId: string
  sectionId: string
  extraMarks: ExtraMarkEntry[]
  extraMarkTypes: ExtraMarkType[]
  onSave: (adj: MarkAdjustment[]) => void
  onClear: (examId: string, classId: string, sectionId: string) => void
  isBn: boolean
  tabulationData: TabulationRow[]
}

interface StudentRow {
  studentId: string
  roll: string
  name: string
  totalFullMarks: number
  rawObtained: number
  academicObtained: number
  academicPct: number
  extraMarksTotal: number
  extraMarksBreakdown: { type: string; marks: number; maxMarks: number; percentage: number }[]
  finalTotal: number
  finalPercentage: number
}

export const MarkAdjustmentTab = React.memo(function MarkAdjustmentTab({
  examId,
  classId,
  sectionId,
  extraMarks,
  extraMarkTypes,
  onSave,
  onClear,
  isBn,
  tabulationData,
}: Props) {
  // Calculate number of active extra mark types
  const activeExtraTypes = extraMarkTypes.filter((t) => t.isActive).length

  // User-controlled mark distribution (Academic + Extra = 100%)
  const [academicPct, setAcademicPct] = useState(90)
  const [extraPctSetting, setExtraPctSetting] = useState(10)
  const [showSettings, setShowSettings] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pctWarning, setPctWarning] = useState('')

  const handleAcademicChange = (val: number) => {
    if (val > 100) {
      setPctWarning(isBn ? 'সর্বোচ্চ 100% হতে পারে' : 'Max 100% allowed')
      setAcademicPct(100)
      setExtraPctSetting(0)
      setTimeout(() => setPctWarning(''), 2000)
      return
    }
    if (val < 0) {
      setPctWarning(isBn ? 'ন্যূনতম 0%' : 'Min 0%')
      setAcademicPct(0)
      setExtraPctSetting(100)
      setTimeout(() => setPctWarning(''), 2000)
      return
    }
    setPctWarning('')
    setAcademicPct(val)
    setExtraPctSetting(100 - val)
  }

  const handleExtraChange = (val: number) => {
    if (val > 100) {
      setPctWarning(isBn ? 'সর্বোচ্চ 100% হতে পারে' : 'Max 100% allowed')
      setExtraPctSetting(100)
      setAcademicPct(0)
      setTimeout(() => setPctWarning(''), 2000)
      return
    }
    if (val < 0) {
      setPctWarning(isBn ? 'ন্যূনতম 0%' : 'Min 0%')
      setExtraPctSetting(0)
      setAcademicPct(100)
      setTimeout(() => setPctWarning(''), 2000)
      return
    }
    setPctWarning('')
    setExtraPctSetting(val)
    setAcademicPct(100 - val)
  }

  // Get extra marks per student for this exam/class/section
  const extraMarksByStudent = useMemo(() => {
    const map = new Map<string, ExtraMarkEntry[]>()
    extraMarks
      .filter((e) => e.examId === examId && e.classId === classId && e.sectionId === sectionId)
      .forEach((e) => {
        const list = map.get(e.studentId) || []
        list.push(e)
        map.set(e.studentId, list)
      })
    return map
  }, [extraMarks, examId, classId, sectionId])

  // Build combined student rows
  const studentRows = useMemo<StudentRow[]>(() => {
    return tabulationData.map((row) => {
      const studentId = row.student.id
      const totalFull = row.totalFull

      // Extra marks — sum each type's percentage, then normalize to 100%
      const studentExtras = extraMarksByStudent.get(studentId) || []
      
      let sumOfTypePcts = 0
      const extraMarksBreakdown: { type: string; marks: number; maxMarks: number; percentage: number }[] = []
      
      extraMarkTypes.filter((t) => t.isActive).forEach((type) => {
        const entries = studentExtras.filter((e) => e.typeId === type.id)
        const obtained = entries.reduce((sum, e) => sum + e.marks, 0)
        const max = type.defaultMaxMarks
        const pct = max > 0 ? Math.min(100, Math.round((obtained / max) * 100)) : 0
        sumOfTypePcts += pct
        extraMarksBreakdown.push({ 
          type: isBn ? type.nameBn : type.name, 
          marks: obtained, 
          maxMarks: max,
          percentage: pct
        })
      })
      
      // Average of category percentages (e.g., 50% + 100% + 100% → 83%)
      const avgExtraPct = activeExtraTypes > 0 ? sumOfTypePcts / activeExtraTypes : 0
      // Apply allocation: extraMarks = (avgPct / 100) × extraPctSetting% × totalFull
      const extraMarksTotal = Math.round((avgExtraPct / 100) * (extraPctSetting / 100) * totalFull)

      // Academic marks from tabulation — reduced by academic percentage
      const academicObtained = Math.round(row.totalObtained * (academicPct / 100))

      // Final total = academic (reduced) + extra marks, capped at totalFull (100%)
      const finalTotal = Math.min(academicObtained + extraMarksTotal, totalFull)
      const finalPercentage = totalFull > 0 ? Math.round((finalTotal / totalFull) * 100) : 0

      return {
        studentId,
        roll: row.student.roll || '',
        name: isBn ? row.student.nameBn || row.student.nameEn : row.student.nameEn,
        totalFullMarks: totalFull,
        rawObtained: row.totalObtained,
        academicObtained,
        academicPct: totalFull > 0 ? Math.round((academicObtained / totalFull) * 100) : 0,
        extraMarksTotal,
        extraMarksBreakdown,
        finalTotal,
        finalPercentage,
      }
    })
  }, [tabulationData, extraMarksByStudent, extraMarkTypes, isBn, academicPct, extraPctSetting, activeExtraTypes])

  // Summary
  const summary = useMemo(() => {
    const total = studentRows.length
    const totalExtra = studentRows.reduce((a, b) => a + b.extraMarksTotal, 0)
    return { total, totalExtra }
  }, [studentRows])

  const handleSave = () => {
    const now = new Date().toISOString()
    const marks: MarkAdjustment[] = studentRows.map((row) => ({
      id: `ma-${examId}-${row.studentId}-${Date.now()}`,
      examId,
      studentId: row.studentId,
      classId,
      sectionId,
      totalDays: 0,
      presentDays: 0,
      attendancePct: 0,
      adjustmentMarks: row.extraMarksTotal,
      note: `acad:${row.academicObtained}+ext:${row.extraMarksTotal}`,
      createdAt: now,
    }))
    onSave(marks)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearAll = () => {
    onClear(examId, classId, sectionId)
  }

  const sorted = useMemo(
    () => [...studentRows].sort((a, b) => a.roll.localeCompare(b.roll)),
    [studentRows]
  )

  return (
    <div className={sectionCls}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className={sectionTitleCls}>
          <ClipboardCheck size={15} className="text-[var(--brand)]" />
          {isBn ? 'মার্ক এডজাস্টমেন্ট' : 'Mark Adjustment'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.625rem] font-medium cursor-pointer border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-all"
          >
            <Settings size={12} />
            {isBn ? 'সেটিংস' : 'Settings'}
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.625rem] font-medium cursor-pointer border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 transition-all"
          >
            <Trash2 size={12} />
            {isBn ? 'মুছুন' : 'Clear'}
          </button>
          <button onClick={handleSave} className={`${btnPrimary} text-[0.625rem]`}>
            <Save size={12} />
            {saved ? (isBn ? 'সংরক্ষিত!' : 'Saved!') : (isBn ? 'সংরক্ষণ' : 'Save')}
          </button>
        </div>
      </div>

      {/* Mark Distribution Settings */}
      {showSettings && (
        <div className="mb-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'মার্ক বিতরণ' : 'Mark Distribution'}
            </span>
            <button onClick={() => setShowSettings(false)} className="cursor-pointer bg-transparent border-none text-[var(--text-muted)]">
              <X size={14} />
            </button>
          </div>

          {/* Two percentage fields — must sum to 100% */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="text-[0.6875rem] text-[var(--text-muted)] block mb-1">
                {isBn ? 'একাডেমিক %' : 'Academic %'}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={academicPct}
                onChange={(e) => handleAcademicChange(Number(e.target.value))}
                className={`${inputCls} w-full text-[0.6875rem] py-1`}
              />
            </div>
            <div>
              <label className="text-[0.6875rem] text-[var(--text-muted)] block mb-1">
                {isBn ? 'এক্সট্রা মার্ক %' : 'Extra Mark %'}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={extraPctSetting}
                onChange={(e) => handleExtraChange(Number(e.target.value))}
                className={`${inputCls} w-full text-[0.6875rem] py-1`}
              />
              <div className="text-[0.5625rem] text-[var(--text-muted)] mt-1">
                {isBn ? `প্রতি ক্যাটাগরির গড় (সর্বোচ্চ 100%) — ${activeExtraTypes} ধরন সক্রিয়` : `Average across categories (max 100% each) — ${activeExtraTypes} types active`}
              </div>
            </div>
          </div>

          {/* Warning message */}
          {pctWarning && (
            <div className="mb-2 px-2 py-1 rounded bg-[var(--red-light)] text-[var(--red)] text-[0.625rem] font-medium">
              {pctWarning}
            </div>
          )}

          {/* Total indicator — always 100% */}
          <div className={`flex items-center gap-2 mb-2 text-[0.6875rem] ${(academicPct + extraPctSetting) === 100 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
            <span className="font-semibold">
              {isBn ? 'মোট' : 'Total'}: {academicPct + extraPctSetting}%
            </span>
            {(academicPct + extraPctSetting) !== 100 && (
              <span>({isBn ? '১০০% হতে হবে' : 'must equal 100%'})</span>
            )}
          </div>

          {/* Visual bar */}
          <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden flex">
            <div className="h-full bg-[var(--brand)] transition-all duration-300" style={{ width: `${academicPct}%` }} />
            <div className="h-full bg-[var(--amber)] transition-all duration-300" style={{ width: `${extraPctSetting}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[0.5625rem] text-[var(--brand)]">{isBn ? 'একাডেমিক' : 'Academic'}: {academicPct}%</span>
            <span className="text-[0.5625rem] text-[var(--amber)]">{isBn ? 'এক্সট্রা' : 'Extra'}: {extraPctSetting}%</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
        {[
          { label: isBn ? 'মোট শিক্ষার্থী' : 'Students', value: summary.total, icon: <Users size={12} />, color: 'text-[var(--brand)]' },
          { label: isBn ? 'মোট এক্সট্রা মার্ক' : 'Total Extra Marks', value: summary.totalExtra, icon: <Award size={12} />, color: 'text-[var(--amber)]' },
          { label: isBn ? 'গড় ফাইনাল মার্ক' : 'Avg Final Marks', value: studentRows.length > 0 ? Math.round(studentRows.reduce((a, b) => a + b.finalTotal, 0) / studentRows.length) : 0, icon: <Award size={12} />, color: 'text-[var(--brand)]' },
        ].map((s, i) => (
          <div key={i} className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[var(--text-muted)]">{s.icon}</span>
              <span className="text-[0.5625rem] text-[var(--text-muted)]">{s.label}</span>
            </div>
            <div className={`text-[0.9375rem] font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      {sorted.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[0.6875rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b-2 border-[var(--border)]">
                <th className="p-2 text-left font-semibold text-[var(--text-primary)] sticky left-0 bg-[var(--bg-secondary)] z-10">#</th>
                <th className="p-2 text-left font-semibold text-[var(--text-primary)] sticky left-7 bg-[var(--bg-secondary)] z-10">{isBn ? 'রোল' : 'Roll'}</th>
                <th className="p-2 text-left font-semibold text-[var(--text-primary)]">{isBn ? 'নাম' : 'Name'}</th>
                <th className="p-2 text-center font-semibold bg-[var(--brand-light)] text-[var(--brand)]">
                  <div className="flex items-center justify-center gap-1">
                    <BookOpen size={11} />
                    {isBn ? 'একাডেমিক' : 'Academic'}
                  </div>
                  <div className="text-[0.5rem] font-normal opacity-70">({academicPct}%)</div>
                </th>
                <th className="p-2 text-center font-semibold bg-[var(--amber-light)] text-[var(--amber)]">
                  <div className="flex items-center justify-center gap-1">
                    <Award size={11} />
                    {isBn ? 'এক্সট্রা' : 'Extra'}
                  </div>
                  <div className="text-[0.5rem] font-normal opacity-70">({extraPctSetting}%)</div>
                </th>
                <th className="p-2 text-center font-semibold bg-[var(--brand)] text-white">
                  <div className="flex items-center justify-center gap-1">
                    {isBn ? 'মোট প্রাপ্ত' : 'Final Total'}
                  </div>
                </th>
                <th className="p-2 text-center font-semibold bg-[var(--brand)] text-white">
                  {isBn ? '%' : '%'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
                <tr key={row.studentId} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="p-2 text-center text-[var(--text-muted)] sticky left-0 bg-[var(--bg-primary)] z-10">{idx + 1}</td>
                  <td className="p-2 text-left font-medium sticky left-7 bg-[var(--bg-primary)] z-10">{row.roll}</td>
                  <td className="p-2 text-left text-[var(--text-primary)]">{row.name}</td>
                  {/* Academic — raw reduced by percentage */}
                  <td className="p-2 text-center bg-[var(--brand-light)]">
                    <span className="text-[0.5625rem] text-[var(--text-muted)] line-through">{row.rawObtained}</span>
                    <span className="text-[0.5rem] text-[var(--text-muted)] mx-0.5">→</span>
                    <span className="font-bold text-[var(--brand)]">{row.academicObtained}</span>
                    <span className="text-[0.5rem] text-[var(--text-muted)] ml-0.5">/{row.totalFullMarks}</span>
                  </td>
                  {/* Extra Marks */}
                  <td className="p-2 text-center bg-[var(--amber-light)]">
                    {row.extraMarksBreakdown.length > 0 ? (
                      <div className="flex flex-col items-center gap-0.5">
                        {row.extraMarksBreakdown.map((e, i) => (
                          <span key={i} className="text-[0.5625rem] text-[var(--amber)]">
                            {e.type}: {e.marks}/{e.maxMarks} ({e.percentage}%)
                          </span>
                        ))}
                        <span className="font-bold text-[var(--amber)]">+{row.extraMarksTotal}</span>
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                  {/* Final Total */}
                  <td className="p-2 text-center bg-[var(--brand)] text-white font-bold text-[0.8125rem]">
                    {row.finalTotal}
                  </td>
                  {/* Final % */}
                  <td className="p-2 text-center bg-[var(--brand)] text-white font-bold text-[0.8125rem]">
                    {row.finalPercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--text-muted)] text-[0.8125rem]">
          <ClipboardCheck size={24} className="mx-auto mb-2 opacity-30" />
          {isBn ? 'কোনো ডেটা নেই — প্রথমে ট্যাবুলেশন তৈরি করুন' : 'No data — build tabulation first'}
        </div>
      )}
    </div>
  )
})
