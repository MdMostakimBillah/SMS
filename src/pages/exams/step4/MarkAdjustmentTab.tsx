import { useState, useMemo } from 'react'
import { ClipboardCheck, Save, Trash2, Settings, X, Award, BookOpen, Users } from 'lucide-react'
import { sectionCls, sectionTitleCls, inputCls, btnPrimary } from '@/lib/styles'
import type { ExamAttendance, MarkAdjustment, ExtraMarkEntry, ExtraMarkType } from '@/store/examStore'

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
  students: Student[]
  attendances: ExamAttendance[]
  extraMarks: ExtraMarkEntry[]
  extraMarkTypes: ExtraMarkType[]
  onSave: (adj: MarkAdjustment[]) => void
  onClear: (examId: string, classId: string, sectionId: string) => void
  isBn: boolean
  tabulationData: TabulationRow[]
}

interface AttendanceStats {
  studentId: string
  totalDays: number
  presentDays: number
  absentDays: number
  attendancePct: number
}

interface StudentRow {
  studentId: string
  roll: string
  name: string
  totalFullMarks: number
  rawObtained: number
  academicObtained: number
  academicPct: number
  attendancePct: number
  attendanceMarks: number
  extraMarksTotal: number
  extraMarksBreakdown: { type: string; marks: number; maxMarks: number }[]
  finalTotal: number
  finalPercentage: number
}

export function MarkAdjustmentTab({
  examId,
  classId,
  sectionId,
  students,
  attendances,
  extraMarks,
  extraMarkTypes,
  onSave,
  onClear,
  isBn,
  tabulationData,
}: Props) {
  // User-controlled mark distribution (always sums to 100)
  const [academicPct, setAcademicPct] = useState(90)
  const [attPctSetting, setAttPctSetting] = useState(5)
  const [extraPctSetting, setExtraPctSetting] = useState(5)
  const [showSettings, setShowSettings] = useState(false)
  const [saved, setSaved] = useState(false)

  const clamp = (v: number) => Math.min(100, Math.max(0, v))

  const handleAcademicChange = (val: number) => {
    const acad = clamp(val)
    const remaining = 100 - acad
    // Distribute remaining proportionally between att and extra
    const oldTotal = attPctSetting + extraPctSetting
    if (oldTotal > 0) {
      setAttPctSetting(Math.round((attPctSetting / oldTotal) * remaining))
      setExtraPctSetting(remaining - Math.round((attPctSetting / oldTotal) * remaining))
    } else {
      setAttPctSetting(Math.round(remaining / 2))
      setExtraPctSetting(remaining - Math.round(remaining / 2))
    }
    setAcademicPct(acad)
  }

  const handleAttChange = (val: number) => {
    const att = clamp(val)
    setAttPctSetting(att)
    setExtraPctSetting(100 - academicPct - att)
  }

  const handleExtraChange = (val: number) => {
    const ext = clamp(val)
    setExtraPctSetting(ext)
    setAttPctSetting(100 - academicPct - ext)
  }

  const totalPct = academicPct + attPctSetting + extraPctSetting
  const isPctValid = totalPct === 100

  // Calculate attendance stats per student
  const attendanceStats = useMemo<AttendanceStats[]>(() => {
    const examAttendances = attendances.filter(
      (a) => a.examId === examId && a.classId === classId && a.sectionId === sectionId
    )
    return students.map((student) => {
      const studentAtts = examAttendances.filter((a) => a.studentId === student.id)
      const totalDays = studentAtts.length
      const presentDays = studentAtts.filter((a) => a.status === 'present' || a.status === 'late').length
      const absentDays = totalDays - presentDays
      const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
      return { studentId: student.id, totalDays, presentDays, absentDays, attendancePct }
    })
  }, [attendances, examId, classId, sectionId, students])

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
      const att = attendanceStats.find((a) => a.studentId === studentId)
      const attPct = att?.attendancePct || 0

      // Attendance marks = (attendance% / 100) * attendance allocation% * fullMarks
      const attendanceMarks = Math.round((attPct / 100) * (attPctSetting / 100) * row.totalFull)

      // Extra marks — student's extra mark entries
      const studentExtras = extraMarksByStudent.get(studentId) || []
      const rawExtraTotal = studentExtras.reduce((sum, e) => sum + e.marks, 0)
      const rawExtraMax = studentExtras.reduce((sum, e) => sum + e.maxMarks, 0)

      // Extra marks = (student's extra obtained / max possible extra) * extra allocation% * fullMarks
      // If no max entries, use raw marks directly
      const extraMarksTotal = rawExtraMax > 0
        ? Math.round((rawExtraTotal / rawExtraMax) * (extraPctSetting / 100) * row.totalFull)
        : Math.round((extraPctSetting / 100) * row.totalFull)

      const extraMarksBreakdown = studentExtras.map((e) => {
        const type = extraMarkTypes.find((t) => t.id === e.typeId)
        return { type: type?.name || type?.nameBn || 'Extra', marks: e.marks, maxMarks: e.maxMarks }
      })

      // Academic marks from tabulation — reduced by academic percentage
      const academicObtained = Math.round(row.totalObtained * (academicPct / 100))
      const totalFull = row.totalFull

      // Final total = academic (reduced) + attendance marks + extra marks
      const finalTotal = academicObtained + attendanceMarks + extraMarksTotal
      const finalPercentage = totalFull > 0 ? Math.round((finalTotal / totalFull) * 100) : 0

      return {
        studentId,
        roll: row.student.roll || '',
        name: isBn ? row.student.nameBn || row.student.nameEn : row.student.nameEn,
        totalFullMarks: totalFull,
        rawObtained: row.totalObtained,
        academicObtained,
        academicPct: totalFull > 0 ? Math.round((academicObtained / totalFull) * 100) : 0,
        attendancePct: attPct,
        attendanceMarks,
        extraMarksTotal,
        extraMarksBreakdown,
        finalTotal,
        finalPercentage,
      }
    })
  }, [tabulationData, attendanceStats, attPctSetting, extraPctSetting, extraMarksByStudent, extraMarkTypes, isBn])

  // Summary
  const summary = useMemo(() => {
    const total = studentRows.length
    const totalAttendance = studentRows.reduce((a, b) => a + b.attendanceMarks, 0)
    const totalExtra = studentRows.reduce((a, b) => a + b.extraMarksTotal, 0)
    const avgAttendance = total > 0 ? Math.round(studentRows.reduce((a, b) => a + b.attendancePct, 0) / total) : 0
    return { total, totalAttendance, totalExtra, avgAttendance }
  }, [studentRows])

  const handleSave = () => {
    const now = new Date().toISOString()
    const marks: MarkAdjustment[] = studentRows.map((row) => ({
      id: `ma-${examId}-${row.studentId}-${Date.now()}`,
      examId,
      studentId: row.studentId,
      classId,
      sectionId,
      totalDays: attendanceStats.find((a) => a.studentId === row.studentId)?.totalDays || 0,
      presentDays: attendanceStats.find((a) => a.studentId === row.studentId)?.presentDays || 0,
      attendancePct: row.attendancePct,
      adjustmentMarks: row.attendanceMarks + row.extraMarksTotal,
      note: `acad:${row.academicObtained}+att:${row.attendanceMarks}+ext:${row.extraMarksTotal}`,
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

          {/* Three percentage fields */}
          <div className="grid grid-cols-3 gap-3 mb-2">
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
                {isBn ? 'উপস্থিতি %' : 'Attendance %'}
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={attPctSetting}
                onChange={(e) => handleAttChange(Number(e.target.value))}
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
            </div>
          </div>

          {/* Total indicator */}
          <div className={`flex items-center gap-2 mb-2 text-[0.6875rem] ${isPctValid ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
            <span className="font-semibold">
              {isBn ? 'মোট' : 'Total'}: {totalPct}%
            </span>
            {!isPctValid && (
              <span>({isBn ? '১০০% হতে হবে' : 'must equal 100%'})</span>
            )}
          </div>

          {/* Visual bar */}
          <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden flex">
            <div className="h-full bg-[var(--brand)] transition-all duration-300" style={{ width: `${academicPct}%` }} />
            <div className="h-full bg-[var(--green)] transition-all duration-300" style={{ width: `${attPctSetting}%` }} />
            <div className="h-full bg-[var(--amber)] transition-all duration-300" style={{ width: `${extraPctSetting}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[0.5625rem] text-[var(--brand)]">{isBn ? 'একাডেমিক' : 'Academic'}: {academicPct}%</span>
            <span className="text-[0.5625rem] text-[var(--green)]">{isBn ? 'উপস্থিতি' : 'Attendance'}: {attPctSetting}%</span>
            <span className="text-[0.5625rem] text-[var(--amber)]">{isBn ? 'এক্সট্রা' : 'Extra'}: {extraPctSetting}%</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {[
          { label: isBn ? 'মোট শিক্ষার্থী' : 'Students', value: summary.total, icon: <Users size={12} />, color: 'text-[var(--brand)]' },
          { label: isBn ? 'গড় উপস্থিতি' : 'Avg Attendance', value: `${summary.avgAttendance}%`, icon: <ClipboardCheck size={12} />, color: 'text-[var(--green)]' },
          { label: isBn ? 'মোট উপস্থিতি মার্ক' : 'Total Att Marks', value: summary.totalAttendance, icon: <Award size={12} />, color: 'text-[var(--teal)]' },
          { label: isBn ? 'মোট এক্সট্রা মার্ক' : 'Total Extra Marks', value: summary.totalExtra, icon: <Award size={12} />, color: 'text-[var(--amber)]' },
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
                <th className="p-2 text-center font-semibold bg-[var(--green-light)] text-[var(--green)]">
                  <div className="flex items-center justify-center gap-1">
                    <ClipboardCheck size={11} />
                    {isBn ? 'উপস্থিতি %' : 'Att %'}
                  </div>
                </th>
                <th className="p-2 text-center font-semibold bg-[var(--green-light)] text-[var(--green)]">
                  <div className="flex items-center justify-center gap-1">
                    <Award size={11} />
                    {isBn ? 'উপস্থিতি মার্ক' : 'Att Marks'}
                  </div>
                  <div className="text-[0.5rem] font-normal opacity-70">({attPctSetting}%)</div>
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
                  {/* Attendance % */}
                  <td className="p-2 text-center bg-[var(--green-light)]">
                    <span className={`px-1.5 py-0.5 rounded text-[0.625rem] font-medium ${
                      row.attendancePct >= 75 ? 'bg-[var(--green)] text-white' :
                      row.attendancePct >= 50 ? 'bg-[var(--amber)] text-white' :
                      'bg-[var(--red)] text-white'
                    }`}>
                      {row.attendancePct}%
                    </span>
                  </td>
                  {/* Attendance Marks */}
                  <td className="p-2 text-center bg-[var(--green-light)]">
                    <span className="font-bold text-[var(--green)]">+{row.attendanceMarks}</span>
                  </td>
                  {/* Extra Marks */}
                  <td className="p-2 text-center bg-[var(--amber-light)]">
                    {row.extraMarksBreakdown.length > 0 ? (
                      <div className="flex flex-col items-center gap-0.5">
                        {row.extraMarksBreakdown.map((e, i) => (
                          <span key={i} className="text-[0.5625rem] text-[var(--amber)]">
                            {e.type}: {e.marks}/{e.maxMarks}
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
}
