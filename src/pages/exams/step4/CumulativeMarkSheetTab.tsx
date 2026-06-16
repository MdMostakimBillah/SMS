import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useExamStore } from '@/store/examStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
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

interface SubjectExamMark {
  subjectId: string
  subjectName: string
  fullMarks: number
  passMarks: number
  exams: Record<string, { obtained: number; total: number; pc: number }>
  cumulative: { obtained: number; full: number; pc: number; passed: boolean }
}

interface StudentMarkData {
  studentId: string
  nameEn: string
  nameBn: string
  roll: string
  photo: string
  studentIdCode: string
  subjects: SubjectExamMark[]
  examTotals: Record<string, { obtained: number; full: number; grade: string; gpa: number; pc: number }>
  cumulative: { obtained: number; full: number; gpa: number; grade: string }
}

interface PrevExamData {
  examId: string
  examName: string
  weight: number
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
  const allStudents = useAdmissionStore((s) => s.students)
  const allSubjects = useTeacherStore((s) => s.subjects)
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const publishedExams = useMemo(() => {
    return allExamConfigs.filter(
      (e) => e.id !== currentExamId && e.session === currentSession && e.isPublished && (e.publishedClasses || []).includes(className)
    )
  }, [allExamConfigs, currentExamId, currentExamSession, className])

  const [prevExams, setPrevExams] = useState<PrevExamData[]>([])
  const [studentIdx, setStudentIdx] = useState(0)

  const addExam = (examId: string) => {
    const exam = allExamConfigs.find((e) => e.id === examId)
    if (!exam || prevExams.some((e) => e.examId === examId)) return
    setPrevExams((p) => [...p, { examId: exam.id, examName: exam.name, weight: 0 }])
  }

  const removeExam = (examId: string) => {
    setPrevExams((p) => p.filter((e) => e.examId !== examId))
  }

  const updateWeight = (examId: string, w: number) => {
    setPrevExams((p) => p.map((e) => (e.examId === examId ? { ...e, weight: w } : e)))
  }

  const totalPrevWeight = prevExams.reduce((a, e) => a + e.weight, 0)
  const currentWeight = Math.max(0, 100 - totalPrevWeight)

  const allExamIds = useMemo(() => [currentExamId, ...prevExams.map((e) => e.examId)], [currentExamId, prevExams])

  const marksheetData = useMemo<StudentMarkData[]>(() => {
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

    // Cumulative position maps (by weighted total)
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
      const allSubjects = examSubjectsMap[currentExamId] || []

      const subjects: SubjectExamMark[] = allSubjects.map((cfg) => {
        const exams: Record<string, { obtained: number; total: number; pc: number }> = {}
        for (const examId of allExamIds) {
          const r = examResultMap[examId]?.[stu.id]?.[cfg.subjectId]
          exams[examId] = {
            obtained: r?.obtained || 0,
            total: r?.full || cfg.fullMarks,
            pc: pcMaps[examId]?.[cfg.subjectId]?.[stu.id] || 0,
          }
        }
        // Cumulative: weighted percentage of obtained/full
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
          cumulative: {
            obtained: cumObtained,
            full: cumFull,
            pc: cumPcMaps[cfg.subjectId]?.[stu.id] || 0,
            passed: cumObtained >= cumFull * 0.33,
          },
        }
      })

      // Exam totals
      const examTotals: Record<string, { obtained: number; full: number; grade: string; gpa: number; pc: number }> = {}
      let totalObtained = 0
      let totalFull = 0
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
        totalObtained += total
        totalFull += full
      }

      // Cumulative total
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

  const generatePDF = () => {

    const studentPages = marksheetData.map((stu) => {
      const subjectRows = stu.subjects.map((s) => {
        const examCells = allExamIds.map((eid) => {
          const ex = s.exams[eid]
          return `<td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:8px;">${ex.total}</td>
            <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:600;">${ex.obtained}${ex.obtained === 0 ? '' : ` <span style="font-size:6px;color:#6b7280;">(${Math.round((ex.obtained / (ex.total || 1)) * 100)}%)</span>`}</td>
            <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:7px;color:#6b7280;">${ex.pc > 0 ? `${ex.pc}${ordinalSuffix(ex.pc)}` : '-'}</td>`
        }).join('')
        const cumPct = s.cumulative.full > 0 ? Math.round((s.cumulative.obtained / s.cumulative.full) * 100) : 0
        const gColor = getGradeColor(getGradeLetter(cumPct))
        return `<tr>
          <td style="text-align:left;border:1px solid #d1d5db;padding:3px 6px;font-size:8px;font-weight:500;white-space:nowrap;">${s.subjectName}</td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:8px;">${s.fullMarks}</td>
          ${examCells}
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:700;">${s.cumulative.obtained}</td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:7px;color:${gColor};font-weight:600;">${cumPct}%</td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:7px;color:#6b7280;">${s.cumulative.pc > 0 ? `${s.cumulative.pc}${ordinalSuffix(s.cumulative.pc)}` : '-'}</td>
        </tr>`
      }).join('')

      const summaryRows = allExamIds.map((eid) => {
        const t = stu.examTotals[eid]
        const eName = eid === currentExamId ? currentExamName : prevExams.find((e) => e.examId === eid)?.examName || eid
        const gColor = getGradeColor(t.grade)
        return `<tr>
          <td style="border:1px solid #d1d5db;padding:3px 6px;font-size:8px;font-weight:500;">${eName}</td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:600;">${t.obtained}</td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:8px;"><span style="color:${gColor};font-weight:700;">${t.grade}</span></td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:8px;">${t.gpa.toFixed(1)}</td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:7px;color:#6b7280;">${t.pc > 0 ? `${t.pc}${ordinalSuffix(t.pc)}` : '-'}</td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:7px;color:#6b7280;">-</td>
          <td style="text-align:center;border:1px solid #d1d5db;padding:3px 4px;font-size:8px;">Fail</td>
        </tr>`
      }).join('')

      const gColor = getGradeColor(stu.cumulative.grade)
      const examHeaders = allExamIds.map((eid) => {
        const eName = eid === currentExamId ? currentExamName : prevExams.find((e) => e.examId === eid)?.examName || eid
        const w = eid === currentExamId ? currentWeight : prevExams.find((e) => e.examId === eid)?.weight || 0
        return `<th colspan="3" style="background:${brand}cc;color:#fff;border:1px solid #fff;padding:4px 6px;font-size:8px;font-weight:600;text-align:center;">${eName} (${w}%)</th>`
      }).join('')
      const examSubHeaders = allExamIds.map(() =>
        `<th style="background:#6b7280;color:#fff;border:1px solid #fff;padding:2px 4px;font-size:6.5px;">Total</th>
         <th style="background:#6b7280;color:#fff;border:1px solid #fff;padding:2px 4px;font-size:6.5px;">Obt.</th>
         <th style="background:#6b7280;color:#fff;border:1px solid #fff;padding:2px 4px;font-size:6.5px;">PC</th>`
      ).join('')

      const avgPct = stu.cumulative.full > 0 ? Math.round((stu.cumulative.obtained / stu.cumulative.full) * 100) : 0

      return `
      <div style="page-break-after:always;page-break-inside:avoid;padding:10mm;font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a2e;background:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:700;color:${brand};">${institutionName}</div>
            <div style="font-size:9px;color:#6b7280;">${institutionAddress}</div>
            <div style="font-size:12px;font-weight:600;color:#374151;margin-top:2px;">${isBn ? 'কামিউলেটিভ মার্কশিট' : 'Cumulative Marksheet'}</div>
          </div>
          <div style="text-align:right;">
            <table style="font-size:7px;border-collapse:collapse;">
              <thead><tr style="background:${brand};color:#fff;"><th style="padding:2px 5px;">Marks (%)</th><th style="padding:2px 5px;">Grade</th><th style="padding:2px 5px;">GP</th></tr></thead>
              <tbody>${gradeScale.map((g) => `<tr><td style="border:1px solid #d1d5db;padding:1px 4px;text-align:center;">${g.range}</td><td style="border:1px solid #d1d5db;padding:1px 4px;text-align:center;font-weight:600;color:${getGradeColor(g.letter)};">${g.letter}</td><td style="border:1px solid #d1d5db;padding:1px 4px;text-align:center;">${g.gpa}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
        <div style="border-top:2px solid ${brand};margin-bottom:8px;"></div>
        <div style="display:flex;gap:16px;margin-bottom:10px;font-size:9px;">
          <div style="flex:1;">
            <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;">
              <span style="font-weight:600;">${isBn ? 'শিক্ষার্থী' : 'Student'}:</span><span>${stu.nameEn}</span>
              <span style="font-weight:600;">${isBn ? 'আইডি' : 'Student ID'}:</span><span>${stu.studentIdCode}</span>
              <span style="font-weight:600;">${isBn ? 'রোল' : 'Roll'}:</span><span>${stu.roll}</span>
            </div>
          </div>
          <div style="flex:1;">
            <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;">
              <span style="font-weight:600;">${isBn ? 'সেশন' : 'Session'}:</span><span>${currentExamSession}</span>
              <span style="font-weight:600;">${isBn ? 'শ্রেণি' : 'Class'}:</span><span>${className}</span>
              <span style="font-weight:600;">${isBn ? 'সেকশন' : 'Section'}:</span><span>${sectionName}</span>
            </div>
          </div>
          <div style="flex:1;">
            <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;">
              <span style="font-weight:600;">G.P.A:</span><span style="color:${gColor};font-weight:700;">${stu.cumulative.gpa.toFixed(1)}</span>
              <span style="font-weight:600;">${isBn ? 'গড় গ্রেড' : 'Average Grade'}:</span><span style="font-weight:700;color:${gColor};">${stu.cumulative.grade}</span>
              <span style="font-weight:600;">${isBn ? 'গড় প্রাপ্ত %' : 'Average Obt. %'}:</span><span>${avgPct}%</span>
              <span style="font-weight:600;">${isBn ? 'গড় প্রাপ্ত নম্বর' : 'Avg Obt. Marks'}:</span><span>${stu.cumulative.obtained}</span>
            </div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
          <thead>
            <tr>
              <th style="background:${brand};color:#fff;border:1px solid #fff;padding:4px 6px;font-size:8px;font-weight:600;text-align:left;min-width:80px;">${isBn ? 'বিষয়' : 'Subject'}</th>
              <th style="background:${brand};color:#fff;border:1px solid #fff;padding:4px 4px;font-size:8px;font-weight:600;text-align:center;width:30px;">Total</th>
              ${examHeaders}
              <th colspan="2" style="background:#1e293b;color:#fff;border:1px solid #fff;padding:4px 6px;font-size:8px;font-weight:700;text-align:center;">${isBn ? 'কামিউলেটিভ' : 'Cumulative'}</th>
              <th style="background:${brand};color:#fff;border:1px solid #fff;padding:4px 4px;font-size:8px;font-weight:600;text-align:center;width:35px;">PC</th>
            </tr>
            <tr>
              <th style="background:#9ca3af;color:#fff;border:1px solid #fff;padding:2px;font-size:6px;"></th>
              <th style="background:#9ca3af;color:#fff;border:1px solid #fff;padding:2px;font-size:6px;"></th>
              ${examSubHeaders}
              <th style="background:#4b5563;color:#fff;border:1px solid #fff;padding:2px 4px;font-size:6.5px;">${isBn ? 'নির্ণিত' : 'Obt'}</th>
              <th style="background:#4b5563;color:#fff;border:1px solid #fff;padding:2px 4px;font-size:6.5px;">%</th>
              <th style="background:#9ca3af;color:#fff;border:1px solid #fff;padding:2px;font-size:6px;"></th>
            </tr>
          </thead>
          <tbody>${subjectRows}</tbody>
        </table>
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
          <thead>
            <tr style="background:${brand};color:#fff;">
              <th style="border:1px solid #d1d5db;padding:3px 6px;font-size:8px;font-weight:600;text-align:left;">${isBn ? 'পরীক্ষার নাম' : 'Exam Name'}</th>
              <th style="border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:600;text-align:center;">${isBn ? 'মোট প্রাপ্ত' : 'Total Obt.'}</th>
              <th style="border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:600;text-align:center;">Grade</th>
              <th style="border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:600;text-align:center;">G.P.A</th>
              <th style="border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:600;text-align:center;">PC</th>
              <th style="border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:600;text-align:center;">PS</th>
              <th style="border:1px solid #d1d5db;padding:3px 4px;font-size:8px;font-weight:600;text-align:center;">${isBn ? 'মন্তব্য' : 'Remark'}</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:9px;font-weight:700;">
          <span>${isBn ? 'মোট নম্বর' : 'Total Marks'}: ${stu.cumulative.full}</span>
          <span>${isBn ? 'মোট প্রাপ্ত নম্বর' : 'Total Obtain Marks'}: ${stu.cumulative.obtained}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid #e5e7eb;margin-top:12px;font-size:7px;color:#6b7280;">
          <div style="text-align:center;flex:1;">${isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</div>
          <div style="text-align:center;flex:1;">${isBn ? 'অধ্যক্ষের স্বাক্ষর' : "Principal's Signature"}</div>
          <div style="text-align:center;flex:1;">${isBn ? 'অভিভাবকের স্বাক্ষর' : "Guardian's Signature"}</div>
        </div>
      </div>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cumulative Marksheet</title>
    <style>@page{size:A4 landscape;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;}</style>
    </head><body>${studentPages}</body></html>`
    downloadHTML(`cumulative-marksheet-${currentExamName}.html`, html)
  }

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
          onClick={generatePDF}
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
                        <th colSpan={3} className="text-center px-1 py-1 font-semibold text-white" style={{ background: `${brand}cc` }}>
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
                      <th className="px-1 py-0.5 text-[0.45rem] font-medium" style={{ background: '#6b7280', color: '#d1d5db' }}>PC</th>
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
                            <td className="text-center px-1 py-1 text-[0.55rem] text-[var(--text-muted)]" style={{ borderBottom: '1px solid var(--border)' }}>{ex.pc > 0 ? `${ex.pc}${ordinalSuffix(ex.pc)}` : '-'}</td>
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
    </div>
  )
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
