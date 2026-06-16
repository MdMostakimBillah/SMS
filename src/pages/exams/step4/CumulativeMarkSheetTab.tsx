import React, { useState, useMemo } from 'react'
import { Plus, Trash2, Download } from 'lucide-react'
import { useExamStore } from '@/store/examStore'
import { useClassStore } from '@/store/classStore'
import { getBrandColor, downloadHTML } from '@/lib/pdf'
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

interface SelectedExam {
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
    const exam = allExamConfigs.find((e) => e.id === examId)
    if (!exam || selectedExams.some((s) => s.examId === examId)) return

    const examSubjects = subjectMarkConfigs.filter((s) => s.examId === examId && s.classId === className)
    const students: Record<string, { obtained: number; full: number; percentage: number }> = {}

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
      students[student.student.id] = {
        obtained: totalObtained,
        full: totalFull,
        percentage: totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0,
      }
    })

    setSelectedExams((prev) => [
      ...prev,
      { examId: exam.id, examName: exam.name, weight: 0, students },
    ])
  }

  const removeExam = (examId: string) => {
    setSelectedExams((prev) => prev.filter((e) => e.examId !== examId))
  }

  const updateWeight = (examId: string, weight: number) => {
    setSelectedExams((prev) => prev.map((e) => (e.examId === examId ? { ...e, weight } : e)))
  }

  const redistributeWeights = () => {
    if (selectedExams.length === 0) return
    const perExam = Math.round(100 / (selectedExams.length + 1))
    setSelectedExams((prev) => prev.map((e) => ({ ...e, weight: perExam })))
  }

  const totalPrevWeight = selectedExams.reduce((a, e) => a + e.weight, 0)
  const currentWeight = Math.max(0, 100 - totalPrevWeight)

  // Calculate cumulative data
  const cumulativeData = useMemo(() => {
    return currentExamData.map((student) => {
      const currentPct = student.adjustedPercentage

      let weightedTotal = currentPct * (currentWeight / 100)
      selectedExams.forEach((exam) => {
        const prevPct = exam.students[student.student.id]?.percentage || 0
        weightedTotal += prevPct * (exam.weight / 100)
      })

      const cumulativePct = Math.round(weightedTotal)
      const passedAll = student.passedAll
      const cumulativeGpa = getGpa(cumulativePct, passedAll)
      const cumulativeGrade = passedAll ? getGradeLetter(cumulativePct) : 'F'

      return {
        student: student.student,
        currentObtained: student.totalObtained,
        currentFull: student.totalFull || currentExamData[0]?.subjectMarks.reduce((a, b) => a + b.fullMarks, 0) || 0,
        currentPct,
        currentGpa: student.adjustedGpa,
        currentGrade: student.passedAll ? getGradeLetter(currentPct) : 'F',
        exams: selectedExams.map((exam) => ({
          examId: exam.examId,
          examName: exam.examName,
          weight: exam.weight,
          ...exam.students[student.student.id],
        })),
        cumulativePct,
        cumulativeGpa,
        cumulativeGrade,
        passedAll,
        classRank: student.classRank,
        sectionRank: student.sectionRank,
      }
    }).sort((a, b) => b.cumulativePct - a.cumulativePct)
  }, [currentExamData, selectedExams, currentWeight])

  // Generate PDF
  const generatePDF = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Cumulative Marksheet - ${currentExamName}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 9px; color: #1a1a2e; background: #fff; }
  .header { text-align: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid ${brand}; }
  .header h1 { font-size: 16px; font-weight: 700; color: ${brand}; margin-bottom: 2px; }
  .header h2 { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 2px; }
  .header p { font-size: 9px; color: #6b7280; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 9px; color: #374151; }
  .info-row span { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 8px; }
  th { background: ${brand}; color: #fff; padding: 5px 4px; font-weight: 600; text-align: center; font-size: 7.5px; white-space: nowrap; }
  td { padding: 4px; text-align: center; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .name-col { text-align: left; font-weight: 600; white-space: nowrap; max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
  .roll-col { text-align: center; font-weight: 500; }
  .current-col { color: ${brand}; font-weight: 600; }
  .prev-col { color: #6b7280; }
  .cumulative-col { font-weight: 700; color: ${brand}; background: ${brand}08; }
  .gpa-col { font-weight: 700; }
  .grade-badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 7.5px; font-weight: 700; }
  .weight-info { font-size: 7px; color: #9ca3af; font-weight: 400; }
  .legend { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb; }
  .legend-item { display: flex; align-items: center; gap: 3px; font-size: 7px; color: #6b7280; }
  .legend-badge { display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 7px; font-weight: 700; }
  .footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 8px; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <h1>${institutionName}</h1>
    <h2>${isBn ? 'কামিউলেটিভ মার্কশিট' : 'Cumulative Marksheet'}</h2>
    <p>${institutionAddress}</p>
  </div>
  <div class="info-row">
    <div><span>${isBn ? 'শ্রেণি' : 'Class'}:</span> ${className} | <span>${isBn ? 'সেকশন' : 'Section'}:</span> ${sectionName}</div>
    <div><span>${isBn ? 'সেশন' : 'Session'}:</span> ${currentExamSession} | <span>${isBn ? 'বর্তমান পরীক্ষা' : 'Current Exam'}:</span> ${currentExamName} (${currentWeight}%)</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:25px">#</th>
        <th style="text-align:left;min-width:100px">${isBn ? 'নাম' : 'Name'}</th>
        <th style="width:35px">${isBn ? 'রোল' : 'Roll'}</th>
        ${selectedExams.map((exam) => `
        <th colspan="2" style="background:${brand}cc">${exam.examName} <span class="weight-info">(${exam.weight}%)</span></th>
        `).join('')}
        <th colspan="2" style="background:${brand}">${isBn ? 'বর্তমান পরীক্ষা' : 'Current Exam'} <span class="weight-info">(${currentWeight}%)</span></th>
        <th colspan="2" style="background:${brand}">${isBn ? 'কামিউলেটিভ' : 'Cumulative'}</th>
        <th style="width:30px">GPA</th>
        <th style="width:30px">${isBn ? 'গ্রেড' : 'Grade'}</th>
      </tr>
      <tr>
        <th></th><th></th><th></th>
        ${selectedExams.map(() => '<th style="font-size:6.5px;background:#4b5563">Obt</th><th style="font-size:6.5px;background:#4b5563">%</th>').join('')}
        <th style="font-size:6.5px;background:#4b5563">Obt</th><th style="font-size:6.5px;background:#4b5563">%</th>
        <th style="font-size:6.5px;background:#374151">${isBn ? '%' : '%'}</th><th style="font-size:6.5px;background:#374151">${isBn ? 'গ্রেড' : 'Grade'}</th>
        <th></th><th></th>
      </tr>
    </thead>
    <tbody>
      ${cumulativeData.map((row, idx) => {
        const gColor = getGradeColor(row.cumulativeGrade)
        return `<tr>
          <td>${idx + 1}</td>
          <td class="name-col">${row.student.nameEn}</td>
          <td class="roll-col">${row.student.roll}</td>
          ${row.exams.map((ex) => `
          <td class="prev-col">${ex.obtained}/${ex.full}</td>
          <td class="prev-col">${ex.percentage}%</td>
          `).join('')}
          <td class="current-col">${row.currentObtained}/${row.currentFull}</td>
          <td class="current-col">${row.currentPct}%</td>
          <td class="cumulative-col">${row.cumulativePct}%</td>
          <td class="cumulative-col"><span class="grade-badge" style="background:${gColor}18;color:${gColor}">${row.cumulativeGrade}</span></td>
          <td class="gpa-col" style="color:${gColor}">${row.cumulativeGpa.toFixed(1)}</td>
          <td><span class="grade-badge" style="background:${gColor}18;color:${gColor}">${row.cumulativeGrade}</span></td>
        </tr>`
      }).join('')}
    </tbody>
  </table>
  <div class="legend">
    ${gradeScale.map((g) => `<div class="legend-item"><span class="legend-badge" style="background:${getGradeColor(g.letter)}18;color:${getGradeColor(g.letter)}">${g.letter}</span> ${g.range}%</div>`).join('')}
  </div>
  <div class="footer">
    <span>${isBn ? 'মোট শিক্ষার্থী' : 'Total Students'}: ${cumulativeData.length}</span>
    <span>${isBn ? 'তৈরি করা হয়েছে' : 'Generated'}: ${new Date().toLocaleDateString()}</span>
  </div>
</body>
</html>`
    downloadHTML(`cumulative-marksheet-${currentExamName}.html`, html)
  }

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
          {cumulativeData.length > 0 && (
            <button
              onClick={generatePDF}
              className="h-7 px-3 rounded-lg text-[0.65rem] font-medium flex items-center gap-1.5"
              style={{ background: brand, color: '#fff' }}
            >
              <Download size={12} />
              {isBn ? 'PDF ডাউনলোড' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>

      {/* Exam Selection */}
      <div className="mb-4 p-3 rounded-lg border border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {isBn ? 'পূর্ববর্তী পরীক্ষা যোগ করুন' : 'Add Previous Exams'}
          </span>
          <span className="text-[0.6rem] text-[var(--text-muted)]">
            {isBn ? `বর্তমান: ${currentWeight}%` : `Current: ${currentWeight}%`}
            {selectedExams.length > 0 && ` · ${isBn ? 'মোট:' : 'Total:'} ${totalPrevWeight + currentWeight}%`}
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
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.65rem] font-medium border transition-all"
                  style={{
                    background: isSelected ? brand : 'var(--bg-primary)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    borderColor: isSelected ? brand : 'var(--border)',
                  }}
                >
                  {isSelected ? <Trash2 size={10} /> : <Plus size={10} />}
                  {exam.name}
                </button>
              )
            })}
          </div>
        )}

        {/* Weight controls */}
        {selectedExams.length > 0 && (
          <div className="mt-3 space-y-1.5">
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
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={exam.weight}
                  onChange={(e) => updateWeight(exam.examId, Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-12 h-6 px-1 text-[0.65rem] text-center rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                />
                <span className="text-[0.6rem] text-[var(--text-muted)]">%</span>
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
              <span className="text-[0.65rem] font-semibold w-12 text-center" style={{ color: currentWeight < 0 ? 'var(--red)' : brand }}>{currentWeight}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      {cumulativeData.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs" style={{ minWidth: `${300 + selectedExams.length * 140}px` }}>
            <thead>
              <tr>
                <th className="text-center px-2 py-2 font-semibold text-white" style={{ background: brand, width: '25px' }}>#</th>
                <th className="text-left px-2 py-2 font-semibold text-white" style={{ background: brand }}>{isBn ? 'নাম' : 'Name'}</th>
                <th className="text-center px-2 py-2 font-semibold text-white" style={{ background: brand, width: '40px' }}>{isBn ? 'রোল' : 'Roll'}</th>
                {selectedExams.map((exam) => (
                  <th key={exam.examId} colSpan={2} className="text-center px-1 py-1 font-semibold text-white" style={{ background: `${brand}cc` }}>
                    <div className="text-[0.6rem] leading-tight">{exam.examName}</div>
                    <div className="text-[0.5rem] opacity-75 font-normal">({exam.weight}%)</div>
                  </th>
                ))}
                <th colSpan={2} className="text-center px-1 py-1 font-semibold text-white" style={{ background: brand }}>
                  <div className="text-[0.6rem] leading-tight">{isBn ? 'বর্তমান' : 'Current'}</div>
                  <div className="text-[0.5rem] opacity-75 font-normal">({currentWeight}%)</div>
                </th>
                <th colSpan={2} className="text-center px-1 py-1 font-bold text-white" style={{ background: '#1e293b' }}>
                  <div className="text-[0.6rem] leading-tight">{isBn ? 'কামিউলেটিভ' : 'Cumulative'}</div>
                </th>
                <th className="text-center px-1 py-1 font-semibold text-white" style={{ background: brand, width: '35px' }}>GPA</th>
                <th className="text-center px-1 py-1 font-semibold text-white" style={{ background: brand, width: '35px' }}>{isBn ? 'গ্রেড' : 'Grd'}</th>
              </tr>
              <tr>
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}></th>
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}></th>
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}></th>
                {selectedExams.map((exam) => (
                  <React.Fragment key={exam.examId}>
                    <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>{isBn ? 'নির্ণিত' : 'Obt'}</th>
                    <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>%</th>
                  </React.Fragment>
                ))}
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>{isBn ? 'নির্ণিত' : 'Obt'}</th>
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}>%</th>
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#374151', color: '#d1d5db' }}>%</th>
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#374151', color: '#d1d5db' }}>{isBn ? 'গ্রেড' : 'Grd'}</th>
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}></th>
                <th className="px-1 py-0.5 text-[0.5rem] font-medium" style={{ background: '#4b5563', color: '#d1d5db' }}></th>
              </tr>
            </thead>
            <tbody>
              {cumulativeData.map((row, idx) => {
                const gColor = getGradeColor(row.cumulativeGrade)
                const bg = idx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                return (
                  <tr key={row.student.id} style={{ background: bg }}>
                    <td className="text-center px-2 py-1.5 font-semibold text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{idx + 1}</td>
                    <td className="text-left px-2 py-1.5 font-semibold text-[var(--text-primary)] whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>{row.student.nameEn}</td>
                    <td className="text-center px-2 py-1.5 text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{row.student.roll}</td>
                    {row.exams.map((ex) => (
                      <React.Fragment key={ex.examId}>
                        <td className="text-center px-1 py-1.5 text-[0.7rem] text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{ex.obtained}/{ex.full}</td>
                        <td className="text-center px-1 py-1.5 text-[0.7rem] font-medium text-[var(--text-secondary)]" style={{ borderBottom: '1px solid var(--border)' }}>{ex.percentage}%</td>
                      </React.Fragment>
                    ))}
                    <td className="text-center px-1 py-1.5 text-[0.7rem] font-semibold" style={{ color: brand, borderBottom: '1px solid var(--border)' }}>{row.currentObtained}/{row.currentFull}</td>
                    <td className="text-center px-1 py-1.5 text-[0.7rem] font-semibold" style={{ color: brand, borderBottom: '1px solid var(--border)' }}>{row.currentPct}%</td>
                    <td className="text-center px-1 py-1.5 text-[0.7rem] font-bold" style={{ color: brand, background: `${brand}08`, borderBottom: '1px solid var(--border)' }}>{row.cumulativePct}%</td>
                    <td className="text-center px-1 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="px-1 py-0.5 rounded text-[0.55rem] font-bold" style={{ background: `${gColor}18`, color: gColor }}>{row.cumulativeGrade}</span>
                    </td>
                    <td className="text-center px-1 py-1.5 text-[0.7rem] font-bold" style={{ color: gColor, borderBottom: '1px solid var(--border)' }}>{row.cumulativeGpa.toFixed(1)}</td>
                    <td className="text-center px-1 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="px-1 py-0.5 rounded text-[0.55rem] font-bold" style={{ background: `${gColor}18`, color: gColor }}>{row.cumulativeGrade}</span>
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
        <div className="mt-3 p-2 rounded-lg border border-[var(--border)] flex items-center justify-between gap-3" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex flex-wrap gap-1">
            {gradeScale.map((g) => (
              <div key={g.letter} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--border)]" style={{ background: 'var(--bg-primary)' }}>
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
