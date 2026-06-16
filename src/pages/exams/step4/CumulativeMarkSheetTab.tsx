import React, { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useExamStore } from '@/store/examStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import { getBrandColor } from '@/lib/pdf'
import { CumulativeMarksheetPDFOptionsModal } from './CumulativeMarksheetPDFOptionsModal'
import type { TabulationStudent } from './MarksheetTab'

interface CumulativeMarkSheetProps {
  currentExamData: (TabulationStudent & { adjustedPercentage: number; adjustedGpa: number })[]
  currentExamId: string
  currentExamName: string
  currentExamSession: string
  className: string
  sectionName: string
  institutionName: string
  institutionAddress: string
  isBn?: boolean
}

interface PrevExam {
  examId: string
  examName: string
  weight: number
  students: Record<string, { obtained: number; full: number; percentage: number }>
}

function getGradeLetter(pct: number): string {
  if (pct >= 80) return 'A+'
  if (pct >= 70) return 'A'
  if (pct >= 60) return 'A-'
  if (pct >= 50) return 'B'
  if (pct >= 40) return 'C'
  if (pct >= 33) return 'D'
  return 'F'
}

function getGradeColor(letter: string): string {
  const colors: Record<string, string> = { 'A+': '#16a34a', A: '#22c55e', 'A-': '#4ade80', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }
  return colors[letter] || '#6b7280'
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

const gradeScale = [
  { letter: 'A+', range: '80–100', gpa: '5.00' },
  { letter: 'A', range: '70–79', gpa: '4.00' },
  { letter: 'A-', range: '60–69', gpa: '3.50' },
  { letter: 'B', range: '50–59', gpa: '3.00' },
  { letter: 'C', range: '40–49', gpa: '2.00' },
  { letter: 'D', range: '33–39', gpa: '1.00' },
  { letter: 'F', range: '0–32', gpa: '0.00' },
]

export default function CumulativeMarkSheetTab({
  currentExamData,
  currentExamId,
  currentExamName,
  currentExamSession,
  className,
  sectionName,
  institutionName,
  institutionAddress,
  isBn = false,
}: CumulativeMarkSheetProps) {
  const brand = getBrandColor()
  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const allStudentMarks = useExamStore((s) => s.studentMarks)
  const allSubjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const allStudents = useAdmissionStore((s) => s.students)
  const allSubjects = useTeacherStore((s) => s.subjects)
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const publishedExams = useMemo(() => {
    return allExamConfigs.filter(
      (e) => e.id !== currentExamId && e.session === currentSession && e.isPublished && (e.publishedClasses || []).includes(className)
    )
  }, [allExamConfigs, currentExamId, currentSession, className])

  const [prevExams, setPrevExams] = useState<PrevExam[]>([])
  const [studentIdx, setStudentIdx] = useState(0)
  const [showPdfModal, setShowPdfModal] = useState(false)

  const addExam = useCallback((examId: string) => {
    const exam = allExamConfigs.find((e) => e.id === examId)
    if (!exam || prevExams.some((e) => e.examId === examId)) return
    const examSubjects = allSubjectMarkConfigs.filter((c) => c.examId === examId && c.classId === className)
    const students: Record<string, { obtained: number; full: number; percentage: number }> = {}
    currentExamData.forEach((row) => {
      let totalObtained = 0
      let totalFull = 0
      examSubjects.forEach((sc) => {
        const mark = allStudentMarks.find((m) => m.examId === examId && m.studentId === row.student.id && m.subjectId === sc.subjectId && m.classId === className && m.sectionId === sectionName)
        totalObtained += mark?.totalMarks || 0
        totalFull += sc.fullMarks
      })
      students[row.student.id] = {
        obtained: totalObtained,
        full: totalFull,
        percentage: totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0,
      }
    })
    setPrevExams((p) => [...p, { examId: exam.id, examName: exam.name, weight: 0, students }])
  }, [allExamConfigs, prevExams, currentExamData, allSubjectMarkConfigs, allStudentMarks, className, sectionName])

  const removeExam = useCallback((examId: string) => {
    setPrevExams((p) => p.filter((e) => e.examId !== examId))
  }, [])

  const updateWeight = useCallback((examId: string, w: number) => {
    setPrevExams((p) => p.map((e) => (e.examId === examId ? { ...e, weight: w } : e)))
  }, [])

  const totalPrevWeight = prevExams.reduce((a, e) => a + e.weight, 0)
  const currentWeight = Math.max(0, 100 - totalPrevWeight)

  const allExamIds = useMemo(() => [currentExamId, ...prevExams.map((e) => e.examId)], [currentExamId, prevExams])

  const marksheetData = useMemo(() => {
    if (currentExamData.length === 0) return []

    const classStudents = allStudents.filter((s) => s.status === 'approved' && s.active !== false && s.class === className)

    const examResultMap: Record<string, Record<string, Record<string, { obtained: number; full: number; passed: boolean }>>> = {}
    const examSubjectsMap: Record<string, { subjectId: string; subjectName: string; fullMarks: number; passMarks: number }[]> = {}

    for (const examId of allExamIds) {
      const configs = allSubjectMarkConfigs.filter((c) => c.examId === examId && c.classId === className)
      examSubjectsMap[examId] = configs.map((c) => {
        const sub = allSubjects.find((s) => s.id === c.subjectId)
        return { subjectId: c.subjectId, subjectName: sub?.name || c.subjectId, fullMarks: c.fullMarks, passMarks: c.passMarks }
      })
      examResultMap[examId] = {}
      for (const stu of classStudents) {
        examResultMap[examId][stu.id] = {}
        for (const cfg of configs) {
          const mark = allStudentMarks.find((m) => m.examId === examId && m.studentId === stu.id && m.subjectId === cfg.subjectId && m.classId === className)
          examResultMap[examId][stu.id][cfg.subjectId] = {
            obtained: mark?.totalMarks || 0,
            full: cfg.fullMarks,
            passed: (mark?.totalMarks || 0) >= cfg.passMarks,
          }
        }
      }
    }

    // Build position maps
    const pcMaps: Record<string, Record<string, Record<string, number>>> = {}
    for (const examId of allExamIds) {
      pcMaps[examId] = {}
      for (const cfg of (examSubjectsMap[examId] || [])) {
        const entries = classStudents.map((stu) => ({ id: stu.id, obtained: examResultMap[examId][stu.id]?.[cfg.subjectId]?.obtained || 0 }))
        entries.sort((a, b) => b.obtained - a.obtained)
        const rankMap: Record<string, number> = {}
        entries.forEach((e, i) => { if (!rankMap[e.id]) rankMap[e.id] = i + 1 })
        pcMaps[examId][cfg.subjectId] = rankMap
      }
      // Exam total ranks
      const examEntries = classStudents.map((stu) => {
        const total = Object.values(examResultMap[examId][stu.id] || {}).reduce((a, b) => a + b.obtained, 0)
        return { id: stu.id, total }
      })
      examEntries.sort((a, b) => b.total - a.total)
      const examRankMap: Record<string, number> = {}
      examEntries.forEach((e, i) => { if (!examRankMap[e.id]) examRankMap[e.id] = i + 1 })
      pcMaps[examId]['__total__'] = examRankMap
    }

    // Cumulative position maps
    const cumPcMaps: Record<string, Record<string, number>> = {}
    for (const subjId of Object.keys(pcMaps[currentExamId] || {})) {
      const entries = classStudents.map((stu) => {
        let cum = 0
        for (const examId of allExamIds) {
          const obtained = examResultMap[examId][stu.id]?.[subjId]?.obtained || 0
          const full = examResultMap[examId][stu.id]?.[subjId]?.full || 1
          const pct = (obtained / full) * 100
          const examObj = examId === currentExamId ? { weight: currentWeight } : prevExams.find((e) => e.examId === examId)
          cum += pct * ((examObj?.weight || 0) / 100)
        }
        return { id: stu.id, cum }
      })
      entries.sort((a, b) => b.cum - a.cum)
      const rankMap: Record<string, number> = {}
      entries.forEach((e, i) => { if (!rankMap[e.id]) rankMap[e.id] = i + 1 })
      cumPcMaps[subjId] = rankMap
    }

    return currentExamData.map((row) => {
      const stu = row.student
      const allSubjectsList = examSubjectsMap[currentExamId] || []

      const subjects = allSubjectsList.map((cfg) => {
        const exams: Record<string, { obtained: number; total: number; pc: number }> = {}
        for (const examId of allExamIds) {
          const r = examResultMap[examId]?.[stu.id]?.[cfg.subjectId]
          exams[examId] = {
            obtained: r?.obtained || 0,
            total: r?.full || cfg.fullMarks,
            pc: pcMaps[examId]?.[cfg.subjectId]?.[stu.id] || 0,
          }
        }
        let cumObtained = 0
        let cumFull = 0
        for (const examId of allExamIds) {
          const r = examResultMap[examId]?.[stu.id]?.[cfg.subjectId]
          const obtained = r?.obtained || 0
          const full = r?.full || cfg.fullMarks
          const examObj = examId === currentExamId ? { weight: currentWeight } : prevExams.find((e) => e.examId === examId)
          const w = (examObj?.weight || 0) / 100
          cumObtained += Math.round(obtained * w)
          cumFull += Math.round(full * w)
        }
        return {
          subjectId: cfg.subjectId,
          subjectName: cfg.subjectName,
          fullMarks: cfg.fullMarks,
          passMarks: cfg.passMarks,
          exams,
          cumulative: { obtained: cumObtained, full: cumFull, pc: cumPcMaps[cfg.subjectId]?.[stu.id] || 0, passed: cumObtained >= cumFull * 0.33 },
        }
      })

      const examTotals: Record<string, { obtained: number; full: number; grade: string; gpa: number; pc: number }> = {}
      for (const examId of allExamIds) {
        const total = subjects.reduce((a, s) => a + (s.exams[examId]?.obtained || 0), 0)
        const full = subjects.reduce((a, s) => a + (s.exams[examId]?.total || 0), 0)
        const pct = full > 0 ? Math.round((total / full) * 100) : 0
        const allPassed = subjects.every((s) => s.exams[examId]?.obtained >= (s.exams[examId]?.total || 0) * 0.33)
        examTotals[examId] = {
          obtained: total,
          full,
          grade: allPassed ? getGradeLetter(pct) : 'F',
          gpa: getGpa(pct, allPassed),
          pc: pcMaps[examId]?.['__total__']?.[stu.id] || 0,
        }
      }

      let cumObt = 0
      let cumFull = 0
      for (const examId of allExamIds) {
        const t = examTotals[examId]
        const examObj = examId === currentExamId ? { weight: currentWeight } : prevExams.find((e) => e.examId === examId)
        const w = (examObj?.weight || 0) / 100
        cumObt += Math.round(t.obtained * w)
        cumFull += Math.round(t.full * w)
      }
      const cumPct = cumFull > 0 ? Math.round((cumObt / cumFull) * 100) : 0
      const cumPassed = subjects.every((s) => s.cumulative.passed)

      return {
        studentId: stu.id,
        nameEn: stu.nameEn,
        nameBn: stu.nameBn,
        roll: stu.roll,
        photo: stu.photo,
        studentIdCode: stu.id,
        subjects,
        examTotals,
        cumulative: { obtained: cumObt, full: cumFull, gpa: getGpa(cumPct, cumPassed), grade: cumPassed ? getGradeLetter(cumPct) : 'F' },
      }
    }).sort((a, b) => (a.roll || '').localeCompare(b.roll || '', undefined, { numeric: true }))
  }, [currentExamData, allExamIds, currentWeight, prevExams, allStudentMarks, allSubjectMarkConfigs, allStudents, allSubjects, className])

  const currentStudent = marksheetData[studentIdx]

  if (marksheetData.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)] text-[0.875rem]">
        {isBn ? 'প্রথমে পরীক্ষা, শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select exam, class & section first'}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          {isBn ? 'কামিউলেটিভ মার্কশিট' : 'Cumulative Marksheet'}
        </h3>
        <button
          onClick={() => setShowPdfModal(true)}
          className="h-7 px-3 rounded-lg text-[0.65rem] font-medium flex items-center gap-1.5"
          style={{ background: brand, color: '#fff' }}
        >
          <Download size={12} />
          {isBn ? 'PDF ডাউনলোড' : 'Download PDF'}
        </button>
      </div>

      {/* Exam Selection */}
      <div className="mb-3 p-3 rounded-lg border border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {isBn ? 'পূর্ববর্তী পরীক্ষা যোগ করুন' : 'Add Previous Exams'}
          </span>
          <span className="text-[0.6rem] text-[var(--text-muted)]">
            {isBn ? `বর্তমান: ${currentWeight}%` : `Current: ${currentWeight}%`}
            {prevExams.length > 0 && ` · ${isBn ? 'মোট:' : 'Total:'} ${totalPrevWeight + currentWeight}%`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {publishedExams.map((exam) => {
            const sel = prevExams.some((e) => e.examId === exam.id)
            return (
              <button
                key={exam.id}
                onClick={() => (sel ? removeExam(exam.id) : addExam(exam.id))}
                className="px-2 py-1 rounded-lg text-[0.65rem] font-medium border transition-all"
                style={{ background: sel ? brand : 'var(--bg-primary)', color: sel ? '#fff' : 'var(--text-secondary)', borderColor: sel ? brand : 'var(--border)' }}
              >
                {sel ? '✓ ' : '+ '}{exam.name}
              </button>
            )
          })}
        </div>
        {prevExams.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-[var(--border)]">
            {prevExams.map((exam) => (
              <div key={exam.examId} className="flex items-center gap-2">
                <span className="text-[0.65rem] text-[var(--text-secondary)] w-28 truncate">{exam.examName}</span>
                <input type="range" min={0} max={100} value={exam.weight} onChange={(e) => updateWeight(exam.examId, Number(e.target.value))} className="flex-1 h-1 accent-[var(--brand)]" />
                <input type="number" min={0} max={100} value={exam.weight} onChange={(e) => updateWeight(exam.examId, Math.min(100, Math.max(0, Number(e.target.value))))} className="w-12 h-6 px-1 text-[0.65rem] text-center rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" />
                <span className="text-[0.6rem] text-[var(--text-muted)]">%</span>
                <button onClick={() => removeExam(exam.examId)} className="text-[var(--text-muted)] hover:text-red-500"><span className="text-xs">✕</span></button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
              <span className="text-[0.65rem] text-[var(--text-secondary)] w-28 truncate font-semibold">{isBn ? 'বর্তমান পরীক্ষা' : 'Current Exam'}</span>
              <div className="flex-1 h-1 bg-[var(--border)] rounded" />
              <span className="text-[0.65rem] font-semibold w-12 text-center" style={{ color: currentWeight < 0 ? 'var(--red)' : brand }}>{currentWeight}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Student Navigation */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-lg border border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <button onClick={() => setStudentIdx((i) => Math.max(0, i - 1))} disabled={studentIdx === 0} className="h-7 w-7 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--bg-secondary)]"><ChevronLeft size={14} /></button>
        <div className="text-center">
          <span className="text-xs font-semibold text-[var(--text-primary)]">{currentStudent?.nameEn}</span>
          <span className="text-[0.65rem] text-[var(--text-muted)] ml-2">({isBn ? 'রোল' : 'Roll'}: {currentStudent?.roll})</span>
          <span className="text-[0.65rem] text-[var(--text-muted)] ml-2">{studentIdx + 1} / {marksheetData.length}</span>
        </div>
        <button onClick={() => setStudentIdx((i) => Math.min(marksheetData.length - 1, i + 1))} disabled={studentIdx >= marksheetData.length - 1} className="h-7 w-7 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--bg-secondary)]"><ChevronRight size={14} /></button>
      </div>

      {/* Student Card */}
      {currentStudent && (
        <div className="rounded-lg border border-[var(--border)] overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          {/* Student Info */}
          <div className="p-3 border-b border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-start gap-4">
              {currentStudent.photo && (
                <img src={currentStudent.photo} alt="" className="w-14 h-16 rounded object-cover border border-[var(--border)]" />
              )}
              <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-1 text-[0.7rem]">
                <div><span className="font-semibold text-[var(--text-secondary)]">{isBn ? 'নাম' : 'Name'}: </span><span className="font-medium text-[var(--text-primary)]">{currentStudent.nameEn}</span></div>
                <div><span className="font-semibold text-[var(--text-secondary)]">{isBn ? 'সেশন' : 'Session'}: </span><span className="font-medium text-[var(--text-primary)]">{currentExamSession}</span></div>
                <div><span className="font-semibold text-[var(--text-secondary)]">G.P.A: </span><span className="font-bold" style={{ color: getGradeColor(currentStudent.cumulative.grade) }}>{currentStudent.cumulative.gpa.toFixed(1)}</span></div>
                <div><span className="font-semibold text-[var(--text-secondary)]">{isBn ? 'শিক্ষার্থী আইডি' : 'Student ID'}: </span><span className="font-medium text-[var(--text-primary)]">{currentStudent.studentIdCode}</span></div>
                <div><span className="font-semibold text-[var(--text-secondary)]">{isBn ? 'শ্রেণি' : 'Class'}: </span><span className="font-medium text-[var(--text-primary)]">{className}</span></div>
                <div><span className="font-semibold text-[var(--text-secondary)]">{isBn ? 'গড় গ্রেড' : 'Avg Grade'}: </span><span className="font-bold" style={{ color: getGradeColor(currentStudent.cumulative.grade) }}>{currentStudent.cumulative.grade}</span></div>
                <div><span className="font-semibold text-[var(--text-secondary)]">{isBn ? 'রোল' : 'Roll'}: </span><span className="font-medium text-[var(--text-primary)]">{currentStudent.roll}</span></div>
                <div><span className="font-semibold text-[var(--text-secondary)]">{isBn ? 'সেকশন' : 'Section'}: </span><span className="font-medium text-[var(--text-primary)]">{sectionName}</span></div>
                <div><span className="font-semibold text-[var(--text-secondary)]">{isBn ? 'গড় %' : 'Avg %'}: </span><span className="font-medium text-[var(--text-primary)]">{currentStudent.cumulative.full > 0 ? Math.round((currentStudent.cumulative.obtained / currentStudent.cumulative.full) * 100) : 0}%</span></div>
              </div>
            </div>
          </div>

          {/* Subject Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[0.65rem]" style={{ minWidth: `${260 + allExamIds.length * 150}px` }}>
              <thead>
                <tr>
                  <th className="text-left px-2 py-1.5 font-semibold text-white" style={{ background: brand, minWidth: '80px' }}>{isBn ? 'বিষয়' : 'Subject'}</th>
                  <th className="text-center px-1 py-1.5 font-semibold text-white" style={{ background: brand, width: '30px' }}>Total</th>
                  {allExamIds.map((eid) => {
                    const eName = eid === currentExamId ? currentExamName : prevExams.find((e) => e.examId === eid)?.examName || ''
                    const w = eid === currentExamId ? currentWeight : prevExams.find((e) => e.examId === eid)?.weight || 0
                    return (
                      <React.Fragment key={eid}>
                        <th colSpan={2} className="text-center px-1 py-1 font-semibold text-white" style={{ background: `${brand}cc` }}>
                          <div className="text-[0.55rem] leading-tight">{eName}</div>
                          <div className="text-[0.45rem] opacity-75 font-normal">({w}%)</div>
                        </th>
                      </React.Fragment>
                    )
                  })}
                  <th colSpan={2} className="text-center px-1 py-1 font-bold text-white" style={{ background: '#1e293b' }}>
                    <div className="text-[0.55rem] leading-tight">{isBn ? 'কামিউলেটিভ' : 'Cumulative'}</div>
                  </th>
                  <th className="text-center px-1 py-1.5 font-semibold text-white" style={{ background: brand, width: '30px' }}>PC</th>
                </tr>
                <tr>
                  <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#9ca3af', color: '#fff' }}></th>
                  <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#9ca3af', color: '#fff' }}></th>
                  {allExamIds.map((eid) => (
                    <React.Fragment key={eid}>
                      <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#6b7280', color: '#d1d5db' }}>{isBn ? 'পূর্ণমান' : 'Total'}</th>
                      <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#6b7280', color: '#d1d5db' }}>{isBn ? 'প্রাপ্ত' : 'Obt'}</th>
                    </React.Fragment>
                  ))}
                  <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>{isBn ? 'প্রাপ্ত' : 'Obt'}</th>
                  <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>%</th>
                  <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#9ca3af', color: '#fff' }}></th>
                </tr>
              </thead>
              <tbody>
                {currentStudent.subjects.map((s, idx) => {
                  const cumPct = s.cumulative.full > 0 ? Math.round((s.cumulative.obtained / s.cumulative.full) * 100) : 0
                  const gColor = getGradeColor(getGradeLetter(cumPct))
                  const bg = idx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                  return (
                    <tr key={s.subjectId} style={{ background: bg }}>
                      <td className="text-left px-2 py-1 font-medium text-[var(--text-primary)]" style={{ borderBottom: '1px solid var(--border)' }}>{s.subjectName}</td>
                      <td className="text-center px-1 py-1 text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{s.fullMarks}</td>
                      {allExamIds.map((eid) => {
                        const ex = s.exams[eid]
                        return (
                          <React.Fragment key={eid}>
                            <td className="text-center px-1 py-1 text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{ex.total}</td>
                            <td className="text-center px-1 py-1 font-semibold text-[var(--text-primary)]" style={{ borderBottom: '1px solid var(--border)' }}>{ex.obtained}</td>
                          </React.Fragment>
                        )
                      })}
                      <td className="text-center px-1 py-1 font-bold" style={{ color: brand, borderBottom: '1px solid var(--border)' }}>{s.cumulative.obtained}</td>
                      <td className="text-center px-1 py-1 font-semibold" style={{ color: gColor, borderBottom: '1px solid var(--border)' }}>{cumPct}%</td>
                      <td className="text-center px-1 py-1 text-[0.55rem] text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>{s.cumulative.pc > 0 ? `${s.cumulative.pc}${ordinalSuffix(s.cumulative.pc)}` : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Table */}
          <div className="border-t border-[var(--border)]">
            <table className="w-full text-[0.65rem]">
              <thead>
                <tr style={{ background: brand, color: '#fff' }}>
                  <th className="text-left px-2 py-1 font-semibold">{isBn ? 'পরীক্ষার নাম' : 'Exam Name'}</th>
                  <th className="text-center px-1 py-1 font-semibold">{isBn ? 'মোট প্রাপ্ত' : 'Total Obt.'}</th>
                  <th className="text-center px-1 py-1 font-semibold">Grade</th>
                  <th className="text-center px-1 py-1 font-semibold">G.P.A</th>
                  <th className="text-center px-1 py-1 font-semibold">PC</th>
                  <th className="text-center px-1 py-1 font-semibold">PS</th>
                  <th className="text-center px-1 py-1 font-semibold">{isBn ? 'মন্তব্য' : 'Remark'}</th>
                </tr>
              </thead>
              <tbody>
                {allExamIds.map((eid) => {
                  const t = currentStudent.examTotals[eid]
                  const eName = eid === currentExamId ? currentExamName : prevExams.find((e) => e.examId === eid)?.examName || ''
                  const gColor = getGradeColor(t.grade)
                  const pct = t.full > 0 ? Math.round((t.obtained / t.full) * 100) : 0
                  return (
                    <tr key={eid} style={{ background: 'var(--bg-primary)' }}>
                      <td className="text-left px-2 py-1 font-medium text-[var(--text-primary)]" style={{ borderBottom: '1px solid var(--border)' }}>{eName}</td>
                      <td className="text-center px-1 py-1 font-semibold text-[var(--text-primary)]" style={{ borderBottom: '1px solid var(--border)' }}>{t.obtained}</td>
                      <td className="text-center px-1 py-1 font-bold" style={{ color: gColor, borderBottom: '1px solid var(--border)' }}>{t.grade}</td>
                      <td className="text-center px-1 py-1 text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{t.gpa.toFixed(1)}</td>
                      <td className="text-center px-1 py-1 text-[0.55rem] text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>{t.pc > 0 ? `${t.pc}${ordinalSuffix(t.pc)}` : '-'}</td>
                      <td className="text-center px-1 py-1 text-[0.55rem] text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>-</td>
                      <td className="text-center px-1 py-1 text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>{pct >= 33 ? 'Pass' : 'Fail'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-center px-3 py-2 border-t border-[var(--border)] text-[0.7rem] font-bold" style={{ background: 'var(--bg-secondary)' }}>
            <span className="text-[var(--text-secondary)]">{isBn ? 'মোট নম্বর' : 'Total Marks'}: {currentStudent.cumulative.full}</span>
            <span style={{ color: brand }}>{isBn ? 'মোট প্রাপ্ত নম্বর' : 'Total Obtain Marks'}: {currentStudent.cumulative.obtained}</span>
          </div>
        </div>
      )}

      {/* Grade Scale */}
      <div className="mt-3 p-2 rounded-lg border border-[var(--border)] flex flex-wrap gap-1" style={{ background: 'var(--bg-secondary)' }}>
        {gradeScale.map((g) => (
          <div key={g.letter} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--border)]" style={{ background: 'var(--bg-primary)' }}>
            <span className="w-4 h-4 rounded flex items-center justify-center text-[0.5rem] font-bold" style={{ background: `${getGradeColor(g.letter)}18`, color: getGradeColor(g.letter) }}>{g.letter}</span>
            <span className="text-[0.5rem] text-[var(--text-secondary)]">{g.range}%</span>
            <span className="text-[0.45rem] text-[var(--text-muted)]">GP:{g.gpa}</span>
          </div>
        ))}
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <CumulativeMarksheetPDFOptionsModal
          currentExamData={currentExamData}
          currentExamId={currentExamId}
          currentExamName={currentExamName}
          currentExamSession={currentExamSession}
          className={className}
          sectionName={sectionName}
          institutionName={institutionName}
          institutionAddress={institutionAddress}
          publishedExams={publishedExams.map((e) => ({ id: e.id, name: e.name }))}
          prevExams={prevExams}
          currentWeight={currentWeight}
          isBn={isBn}
          onClose={() => setShowPdfModal(false)}
          onPrevExamsChange={setPrevExams}
          onCurrentWeightChange={() => {}}
        />
      )}
    </div>
  )
}

function getGpa(pct: number, passed: boolean): number {
  if (!passed) return 0
  if (pct >= 80) return 5.0
  if (pct >= 70) return 4.0
  if (pct >= 60) return 3.5
  if (pct >= 50) return 3.0
  if (pct >= 40) return 2.0
  if (pct >= 33) return 1.0
  return 0
}
