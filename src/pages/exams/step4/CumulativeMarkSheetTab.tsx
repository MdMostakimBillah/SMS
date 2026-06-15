import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useExamStore } from '@/store/examStore'
import { useClassStore } from '@/store/classStore'
import { getBrandColor } from '@/lib/pdf'
import type { TabulationStudent } from './MarksheetTab'

interface CumulativeMarkSheetProps {
  currentExamData: (TabulationStudent & { adjustedPercentage: number; adjustedGpa: number })[]
  currentExamId: string
  className: string
  sectionName: string
  isBn?: boolean
}

interface SelectedExam {
  examId: string
  examName: string
  weight: number
  percentageMap: Record<string, number> // studentId -> percentage
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

const gradeScale = [
  { letter: 'A+', range: '80–100' },
  { letter: 'A', range: '70–79' },
  { letter: 'A-', range: '60–69' },
  { letter: 'B', range: '50–59' },
  { letter: 'C', range: '40–49' },
  { letter: 'D', range: '33–39' },
  { letter: 'F', range: '0–32' },
]

export default function CumulativeMarkSheetTab({
  currentExamData,
  currentExamId,
  className,
  sectionName,
  isBn = false,
}: CumulativeMarkSheetProps) {
  const brand = getBrandColor()
  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const studentMarks = useExamStore((s) => s.studentMarks)
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const currentSession = useClassStore((s) => s.institution.currentSession)

  // Published exams for same class (excluding current)
  const publishedExams = useMemo(() => {
    return allExamConfigs.filter(
      (e) =>
        e.id !== currentExamId &&
        e.session === currentSession &&
        e.isPublished &&
        (e.publishedClasses || []).includes(className)
    )
  }, [allExamConfigs, currentExamId, currentSession, className])

  const [selectedExams, setSelectedExams] = useState<SelectedExam[]>([])

  // Add exam to selection
  const addExam = (examId: string) => {
    const exam = publishedExams.find((e) => e.id === examId)
    if (!exam || selectedExams.find((s) => s.examId === examId)) return

    // Calculate percentage for each student from this exam
    const examSubjects = subjectMarkConfigs.filter((s) => s.examId === examId && s.classId === className)
    const percentageMap: Record<string, number> = {}

    currentExamData.forEach((student) => {
      let totalObtained = 0
      let totalFull = 0
      examSubjects.forEach((sc) => {
        const mark = studentMarks.find(
          (m) => m.examId === examId && m.studentId === student.student.id && m.subjectId === sc.subjectId && m.classId === className && m.sectionId === sectionName
        )
        totalObtained += mark?.totalMarks || 0
        totalFull += sc.fullMarks
      })
      percentageMap[student.student.id] = totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0
    })

    setSelectedExams((prev) => [
      ...prev,
      { examId: exam.id, examName: exam.name, weight: Math.round(100 / (prev.length + 2)), percentageMap },
    ])
  }

  // Remove exam
  const removeExam = (examId: string) => {
    setSelectedExams((prev) => prev.filter((e) => e.examId !== examId))
  }

  // Update weight
  const updateWeight = (examId: string, weight: number) => {
    setSelectedExams((prev) => prev.map((e) => (e.examId === examId ? { ...e, weight } : e)))
  }

  // Auto-distribute remaining weight equally
  const redistributeWeights = () => {
    if (selectedExams.length === 0) return
    const perExam = Math.round(100 / (selectedExams.length + 1)) // +1 for current exam
    setSelectedExams((prev) => prev.map((e) => ({ ...e, weight: perExam })))
  }

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    if (selectedExams.length === 0) {
      return currentExamData.map((s) => ({
        ...s,
        cumulativeTotal: s.adjustedPercentage,
        cumulativeGpa: s.adjustedGpa,
        cumulativeGrade: s.passedAll ? getGradeLetter(s.adjustedPercentage) : 'F',
      }))
    }

    const currentWeight = Math.max(0, 100 - selectedExams.reduce((a, e) => a + e.weight, 0))

    return currentExamData.map((student) => {
      let weightedTotal = student.adjustedPercentage * (currentWeight / 100)
      selectedExams.forEach((exam) => {
        const prevPct = exam.percentageMap[student.student.id] || 0
        weightedTotal += prevPct * (exam.weight / 100)
      })

      const cumulativePct = Math.round(weightedTotal)
      const passedAll = student.passedAll // current exam pass status
      const cumulativeGpa = passedAll
        ? cumulativePct >= 80 ? 5.0
        : cumulativePct >= 70 ? 4.0
        : cumulativePct >= 60 ? 3.5
        : cumulativePct >= 50 ? 3.0
        : cumulativePct >= 40 ? 2.0
        : cumulativePct >= 33 ? 1.0
        : 0
        : 0

      return {
        ...student,
        cumulativeTotal: cumulativePct,
        cumulativeGpa,
        cumulativeGrade: passedAll ? getGradeLetter(cumulativePct) : 'F',
        currentWeight,
      }
    })
  }, [currentExamData, selectedExams])

  const totalWeightUsed = selectedExams.reduce((a, e) => a + e.weight, 0)
  const currentWeight = Math.max(0, 100 - totalWeightUsed)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          {isBn ? 'কামিউলেটিভ মার্কশিট' : 'Cumulative Marksheet'}
        </h3>
        <div className="flex items-center gap-2">
          {selectedExams.length > 0 && (
            <button onClick={redistributeWeights} className="h-7 px-3 rounded-lg text-[0.65rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              {isBn ? 'সমান ভাগ' : 'Equalize'}
            </button>
          )}
        </div>
      </div>

      {/* Exam Selection */}
      <div className="mb-4 p-3 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {isBn ? 'পূর্ববর্তী পরীক্ষা যোগ করুন' : 'Add Previous Exams'}
          </span>
          <span className="text-[0.6rem] text-[var(--text-muted)]">
            {isBn ? `বর্তমান: ${currentWeight}%` : `Current: ${currentWeight}%`}
            {selectedExams.length > 0 && ` · ${isBn ? 'মোট ওজন:' : 'Total Weight:'} ${totalWeightUsed + currentWeight}%`}
          </span>
        </div>

        {publishedExams.length === 0 ? (
          <p className="text-[0.7rem] text-[var(--text-muted)]">
            {isBn ? 'কোনো প্রকাশিত পরীক্ষা পাওয়া যায়নি' : 'No published exams found for this class'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {publishedExams.map((exam) => {
              const isSelected = selectedExams.some((s) => s.examId === exam.id)
              return (
                <button
                  key={exam.id}
                  onClick={() => (isSelected ? removeExam(exam.id) : addExam(exam.id))}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[0.65rem] font-medium border transition-all ${
                    isSelected
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]'
                  }`}
                >
                  {isSelected ? <Trash2 size={10} /> : <Plus size={10} />}
                  {exam.name}
                </button>
              )
            })}
          </div>
        )}

        {/* Weight controls for selected exams */}
        {selectedExams.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {selectedExams.map((exam) => (
              <div key={exam.examId} className="flex items-center gap-2">
                <span className="text-[0.65rem] text-[var(--text-secondary)] w-28 truncate">{exam.examName}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={exam.weight}
                  onChange={(e) => updateWeight(exam.examId, Number(e.target.value))}
                  className="flex-1 h-1 accent-[var(--brand)]"
                />
                <span className="text-[0.65rem] font-semibold text-[var(--text-primary)] w-8 text-right">{exam.weight}%</span>
                <button onClick={() => removeExam(exam.examId)} className="text-[var(--text-muted)] hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
              <span className="text-[0.65rem] text-[var(--text-secondary)] w-28 truncate font-semibold">
                {isBn ? 'বর্তমান পরীক্ষা' : 'Current Exam'}
              </span>
              <div className="flex-1 h-1 bg-[var(--border)] rounded" />
              <span className="text-[0.65rem] font-semibold w-8 text-right" style={{ color: currentWeight < 0 ? 'var(--red)' : 'var(--brand)' }}>{currentWeight}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Cumulative Marks Table */}
      {cumulativeData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-[var(--border)] rounded-lg overflow-hidden">
            <thead>
              <tr className="text-[0.65rem] uppercase tracking-wide text-white" style={{ background: brand }}>
                <th className="text-left px-3 py-2 font-semibold">#</th>
                <th className="text-left px-3 py-2 font-semibold">{isBn ? 'নাম' : 'Name'}</th>
                <th className="text-center px-3 py-2 font-semibold">{isBn ? 'রোল' : 'Roll'}</th>
                <th className="text-center px-3 py-2 font-semibold">{isBn ? 'বর্তমান %' : 'Current %'}</th>
                {selectedExams.map((exam) => (
                  <th key={exam.examId} className="text-center px-3 py-2 font-semibold" style={{ fontSize: '0.55rem' }}>
                    {exam.examName}<br /><span className="font-normal opacity-75">({exam.weight}%)</span>
                  </th>
                ))}
                <th className="text-center px-3 py-2 font-bold" style={{ background: `${brand}dd` }}>
                  {isBn ? 'কামিউলেটিভ %' : 'Cumulative %'}
                </th>
                <th className="text-center px-3 py-2 font-semibold">{isBn ? 'জিপিএ' : 'GPA'}</th>
                <th className="text-center px-3 py-2 font-semibold">{isBn ? 'গ্রেড' : 'Grade'}</th>
              </tr>
            </thead>
            <tbody>
              {cumulativeData.map((student, idx) => {
                const gColor = getGradeColor(student.cumulativeGrade)
                const bg = idx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                return (
                  <tr key={student.student.id} style={{ background: bg }}>
                    <td className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)] border-b border-[var(--border)]">{idx + 1}</td>
                    <td className="text-left px-3 py-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">{student.student.nameEn}</td>
                    <td className="text-center px-3 py-2 text-[var(--text-secondary)] border-b border-[var(--border)]">{student.student.roll}</td>
                    <td className="text-center px-3 py-2 font-medium border-b border-[var(--border)]" style={{ color: brand }}>{student.adjustedPercentage}%</td>
                    {selectedExams.map((exam) => (
                      <td key={exam.examId} className="text-center px-3 py-2 text-[var(--text-secondary)] border-b border-[var(--border)]">
                        {exam.percentageMap[student.student.id] || 0}%
                      </td>
                    ))}
                    <td className="text-center px-3 py-2 font-bold border-b border-[var(--border)]" style={{ color: brand, background: `${brand}08` }}>
                      {student.cumulativeTotal}%
                    </td>
                    <td className="text-center px-3 py-2 font-bold border-b border-[var(--border)]" style={{ color: gColor }}>
                      {student.cumulativeGpa.toFixed(1)}
                    </td>
                    <td className="text-center px-3 py-2 border-b border-[var(--border)]">
                      <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold" style={{ background: `${gColor}18`, color: gColor }}>
                        {student.cumulativeGrade}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--text-muted)] text-[0.875rem]">
          {isBn ? 'প্রথমে পরীক্ষা, শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select exam, class & section first'}
        </div>
      )}

      {/* Grade Scale */}
      {cumulativeData.length > 0 && (
        <div className="mt-3 p-2 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {gradeScale.map((g) => (
              <div key={g.letter} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                <span className="w-4 h-4 rounded flex items-center justify-center text-[0.5rem] font-bold" style={{ background: `${getGradeColor(g.letter)}18`, color: getGradeColor(g.letter) }}>{g.letter}</span>
                <span className="text-[0.5rem] text-[var(--text-secondary)]">{g.range}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
