import React, { useState, useMemo, useCallback } from 'react'
import { Download } from 'lucide-react'
import { useExamStore } from '@/store/examStore'
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

interface StudentRow {
  student: TabulationStudent['student']
  exams: Record<string, { obtained: number; full: number; percentage: number; grade: string; gpa: number }>
  cumulative: { percentage: number; gpa: number; grade: string }
  passedAll: boolean
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

function getGradeColor(letter: string): string {
  const colors: Record<string, string> = { 'A+': '#16a34a', A: '#22c55e', 'A-': '#4ade80', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }
  return colors[letter] || '#6b7280'
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
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const publishedExams = useMemo(() => {
    return allExamConfigs.filter(
      (e) => e.id !== currentExamId && e.session === currentSession && e.isPublished && (e.publishedClasses || []).includes(className)
    )
  }, [allExamConfigs, currentExamId, currentSession, className])

  const [prevExams, setPrevExams] = useState<PrevExam[]>([])
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

  // Build student rows with all exam data
  const studentRows = useMemo<StudentRow[]>(() => {
    if (currentExamData.length === 0) return []

    const totalFull = currentExamData[0]?.subjectMarks.reduce((a, b) => a + b.fullMarks, 0) || 0

    return currentExamData.map((row) => {
      const exams: Record<string, { obtained: number; full: number; percentage: number; grade: string; gpa: number }> = {}

      // Current exam
      const currentPct = row.adjustedPercentage
      exams[currentExamId] = {
        obtained: row.totalObtained,
        full: totalFull,
        percentage: currentPct,
        grade: row.passedAll ? getGradeLetter(currentPct) : 'F',
        gpa: row.adjustedGpa,
      }

      // Previous exams
      prevExams.forEach((prev) => {
        const data = prev.students[row.student.id]
        if (data) {
          const pct = data.percentage
          exams[prev.examId] = {
            obtained: data.obtained,
            full: data.full,
            percentage: pct,
            grade: getGradeLetter(pct),
            gpa: getGpa(pct, true),
          }
        }
      })

      // Cumulative
      let weightedPct = currentPct * (currentWeight / 100)
      prevExams.forEach((prev) => {
        const data = prev.students[row.student.id]
        if (data) weightedPct += data.percentage * (prev.weight / 100)
      })
      const cumPct = Math.round(weightedPct)
      const passedAll = row.passedAll
      const cumGrade = passedAll ? getGradeLetter(cumPct) : 'F'

      return {
        student: row.student,
        exams,
        cumulative: { percentage: cumPct, gpa: getGpa(cumPct, passedAll), grade: cumGrade },
        passedAll,
      }
    }).sort((a, b) => (a.student.roll || '').localeCompare(b.student.roll || '', undefined, { numeric: true }))
  }, [currentExamData, prevExams, currentWeight, currentExamId])

  const examNames = useMemo(() => {
    const names: Record<string, string> = { [currentExamId]: currentExamName }
    prevExams.forEach((e) => { names[e.examId] = e.examName })
    return names
  }, [currentExamId, currentExamName, prevExams])

  const examWeights = useMemo(() => {
    const weights: Record<string, number> = { [currentExamId]: currentWeight }
    prevExams.forEach((e) => { weights[e.examId] = e.weight })
    return weights
  }, [currentExamId, currentWeight, prevExams])

  if (studentRows.length === 0) {
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

      {/* Combined Results Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-[0.65rem]" style={{ minWidth: `${200 + allExamIds.length * 100}px` }}>
          <thead>
            <tr>
              <th className="text-center px-2 py-2 font-semibold text-white" style={{ background: brand, width: '25px' }}>#</th>
              <th className="text-left px-2 py-2 font-semibold text-white" style={{ background: brand }}>{isBn ? 'নাম' : 'Name'}</th>
              <th className="text-center px-2 py-2 font-semibold text-white" style={{ background: brand, width: '40px' }}>{isBn ? 'রোল' : 'Roll'}</th>
              {allExamIds.map((eid) => (
                <th key={eid} colSpan={3} className="text-center px-1 py-1 font-semibold text-white" style={{ background: `${brand}cc` }}>
                  <div className="text-[0.55rem] leading-tight">{examNames[eid]}</div>
                  <div className="text-[0.45rem] opacity-75 font-normal">({examWeights[eid]}%)</div>
                </th>
              ))}
              <th colSpan={3} className="text-center px-1 py-1 font-bold text-white" style={{ background: '#1e293b' }}>
                <div className="text-[0.55rem] leading-tight">{isBn ? 'কামিউলেটিভ' : 'Cumulative'}</div>
              </th>
            </tr>
            <tr>
              <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#9ca3af', color: '#fff' }}></th>
              <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#9ca3af', color: '#fff' }}></th>
              <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#9ca3af', color: '#fff' }}></th>
              {allExamIds.map((eid) => (
                <React.Fragment key={eid}>
                  <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#6b7280', color: '#d1d5db' }}>{isBn ? 'পূর্ণমান' : 'Full'}</th>
                  <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#6b7280', color: '#d1d5db' }}>{isBn ? 'প্রাপ্ত' : 'Obt'}</th>
                  <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#6b7280', color: '#d1d5db' }}>%</th>
                </React.Fragment>
              ))}
              <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>%</th>
              <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>GPA</th>
              <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>{isBn ? 'গ্রেড' : 'Grade'}</th>
            </tr>
          </thead>
          <tbody>
            {studentRows.map((row, idx) => {
              const gColor = getGradeColor(row.cumulative.grade)
              const bg = idx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
              return (
                <tr key={row.student.id} style={{ background: bg }}>
                  <td className="text-center px-2 py-1.5 font-semibold text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{idx + 1}</td>
                  <td className="text-left px-2 py-1.5 font-semibold text-[var(--text-primary)] whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>{row.student.nameEn}</td>
                  <td className="text-center px-2 py-1.5 text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{row.student.roll}</td>
                  {allExamIds.map((eid) => {
                    const ex = row.exams[eid]
                    if (!ex) return <React.Fragment key={eid}><td style={{ borderBottom: '1px solid var(--border)' }}>-</td><td style={{ borderBottom: '1px solid var(--border)' }}>-</td><td style={{ borderBottom: '1px solid var(--border)' }}>-</td></React.Fragment>
                    const eColor = getGradeColor(ex.grade)
                    return (
                      <React.Fragment key={eid}>
                        <td className="text-center px-1 py-1.5 text-[0.65rem] text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{ex.obtained}/{ex.full}</td>
                        <td className="text-center px-1 py-1.5 text-[0.65rem] font-semibold" style={{ color: eColor, borderBottom: '1px solid var(--border)' }}>{ex.percentage}%</td>
                        <td className="text-center px-1 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                          <span className="px-1 py-0.5 rounded text-[0.5rem] font-bold" style={{ background: `${eColor}18`, color: eColor }}>{ex.grade}</span>
                        </td>
                      </React.Fragment>
                    )
                  })}
                  <td className="text-center px-1 py-1.5 text-[0.65rem] font-bold" style={{ color: brand, background: `${brand}08`, borderBottom: '1px solid var(--border)' }}>{row.cumulative.percentage}%</td>
                  <td className="text-center px-1 py-1.5 text-[0.65rem] font-bold" style={{ color: gColor, borderBottom: '1px solid var(--border)' }}>{row.cumulative.gpa.toFixed(1)}</td>
                  <td className="text-center px-1 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="px-1 py-0.5 rounded text-[0.5rem] font-bold" style={{ background: `${gColor}18`, color: gColor }}>{row.cumulative.grade}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

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
