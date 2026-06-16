import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Eye, EyeOff, Search } from 'lucide-react'
import { getBrandColor, openPrintWindow } from '@/lib/pdf'
import { useExamStore } from '@/store/examStore'
import { useTeacherStore } from '@/store/teacherStore'
import type { TabulationStudent } from './MarksheetTab'

interface PrevExam {
  examId: string
  examName: string
  weight: number
  students: Record<string, { obtained: number; full: number; percentage: number }>
}

interface Props {
  currentExamData: (TabulationStudent & { adjustedPercentage: number; adjustedGpa: number })[]
  currentExamId: string
  currentExamName: string
  currentExamSession: string
  className: string
  sectionName: string
  institutionName: string
  institutionAddress: string
  publishedExams: { id: string; name: string }[]
  prevExams: PrevExam[]
  currentWeight: number
  isBn: boolean
  onClose: () => void
  onPrevExamsChange: (exams: PrevExam[]) => void
  onCurrentWeightChange: (w: number) => void
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

export const CumulativeMarksheetPDFOptionsModal = React.memo(function CumulativeMarksheetPDFOptionsModal({
  currentExamData,
  currentExamId,
  currentExamName,
  currentExamSession,
  className,
  sectionName,
  institutionName,
  institutionAddress,
  publishedExams,
  prevExams,
  currentWeight: _currentWeight,
  isBn,
  onClose,
  onPrevExamsChange,
  onCurrentWeightChange: _onCurrentWeightChange,
}: Props) {
  const brand = getBrandColor()
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')
  const [selectedIds, setSelectedIds] = useState<string[]>(currentExamData.map((s) => s.student.id))
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return currentExamData
    const q = searchQuery.toLowerCase()
    return currentExamData.filter((s) => s.student.nameEn.toLowerCase().includes(q) || s.student.roll.includes(q))
  }, [currentExamData, searchQuery])

  const toggleStudent = useCallback((id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => prev.length === currentExamData.length ? [] : currentExamData.map((s) => s.student.id))
  }, [currentExamData])

  const addExam = useCallback((examId: string) => {
    const exam = publishedExams.find((e) => e.id === examId)
    if (!exam || prevExams.some((e) => e.examId === examId)) return
    const allStudentMarks = useExamStore.getState().studentMarks
    const allSubjectMarkConfigs = useExamStore.getState().subjectMarkConfigs
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
    onPrevExamsChange([...prevExams, { examId: exam.id, examName: exam.name, weight: 0, students }])
  }, [publishedExams, prevExams, currentExamData, className, sectionName, onPrevExamsChange])

  const removeExam = useCallback((examId: string) => {
    onPrevExamsChange(prevExams.filter((e) => e.examId !== examId))
  }, [prevExams, onPrevExamsChange])

  const updateWeight = useCallback((examId: string, w: number) => {
    onPrevExamsChange(prevExams.map((e) => (e.examId === examId ? { ...e, weight: w } : e)))
  }, [prevExams, onPrevExamsChange])

  const totalPrevWeight = prevExams.reduce((a, e) => a + e.weight, 0)
  const calcCurrentWeight = Math.max(0, 100 - totalPrevWeight)

  const redistribute = useCallback(() => {
    if (prevExams.length === 0) return
    const perExam = Math.round(100 / (prevExams.length + 1))
    onPrevExamsChange(prevExams.map((e) => ({ ...e, weight: perExam })))
  }, [prevExams, onPrevExamsChange])

  // Build preview HTML
  const previewHtml = useMemo(() => {
    const selected = currentExamData.filter((s) => selectedIds.includes(s.student.id))
    if (selected.length === 0) return ''

    const allExamIds = [currentExamId, ...prevExams.map((e) => e.examId)]
    const examNames = allExamIds.map((eid) => eid === currentExamId ? currentExamName : prevExams.find((e) => e.examId === eid)?.examName || '')
    const examWeights = allExamIds.map((eid) => eid === currentExamId ? calcCurrentWeight : prevExams.find((e) => e.examId === eid)?.weight || 0)

    const subjectMarkConfigs = useExamStore.getState().subjectMarkConfigs
    const studentMarks = useExamStore.getState().studentMarks
    const allSubjects = useTeacherStore.getState().subjects

    const examSubjectsMap: Record<string, { subjectId: string; subjectName: string; fullMarks: number }[]> = {}
    for (const examId of allExamIds) {
      const configs = subjectMarkConfigs.filter((c) => c.examId === examId && c.classId === className)
      examSubjectsMap[examId] = configs.map((c) => {
        const sub = allSubjects.find((s: { id: string; name: string }) => s.id === c.subjectId)
        return { subjectId: c.subjectId, subjectName: sub?.name || c.subjectId, fullMarks: c.fullMarks }
      })
    }

    const firstExamSubjects = examSubjectsMap[currentExamId] || []

    const rows = selected.map((row) => {
      const stu = row.student
      const subjectRows = firstExamSubjects.map((cfg) => {
        const examCells = allExamIds.map((eid) => {
          const configs = subjectMarkConfigs.filter((c) => c.examId === eid && c.classId === className)
          const sc = configs.find((c) => c.subjectId === cfg.subjectId)
          const mark = studentMarks.find((m) => m.examId === eid && m.studentId === stu.id && m.subjectId === cfg.subjectId && m.classId === className)
          const obtained = mark?.totalMarks || 0
          const full = sc?.fullMarks || cfg.fullMarks
          return { obtained, full }
        })
        let cumObt = 0
        let cumFull = 0
        examCells.forEach((ex, i) => {
          const w = (examWeights[i] || 0) / 100
          cumObt += Math.round(ex.obtained * w)
          cumFull += Math.round(ex.full * w)
        })
        const cumPct = cumFull > 0 ? Math.round((cumObt / cumFull) * 100) : 0
        return { subjectName: cfg.subjectName, fullMarks: cfg.fullMarks, examCells, cumObt, cumPct }
      })

      const examTotals = allExamIds.map((_eid, i) => {
        const total = subjectRows.reduce((a, s) => {
          return a + (s.examCells[i]?.obtained || 0)
        }, 0)
        const full = subjectRows.reduce((a, s) => {
          return a + (s.examCells[i]?.full || 0)
        }, 0)
        const pct = full > 0 ? Math.round((total / full) * 100) : 0
        return { total, full, grade: getGradeLetter(pct), pct }
      })

      let cumObtTotal = 0
      let cumFullTotal = 0
      examTotals.forEach((t, i) => {
        const w = (examWeights[i] || 0) / 100
        cumObtTotal += Math.round(t.total * w)
        cumFullTotal += Math.round(t.full * w)
      })
      const cumPct = cumFullTotal > 0 ? Math.round((cumObtTotal / cumFullTotal) * 100) : 0
      const cumGrade = getGradeLetter(cumPct)

      return { student: stu, subjectRows, examTotals, cumObtTotal, cumFullTotal, cumPct, cumGrade }
    })

    const gScale = [
      { letter: 'A+', range: '80–100', gpa: '5.00' }, { letter: 'A', range: '70–79', gpa: '4.00' },
      { letter: 'A-', range: '60–69', gpa: '3.50' }, { letter: 'B', range: '50–59', gpa: '3.00' },
      { letter: 'C', range: '40–49', gpa: '2.00' }, { letter: 'D', range: '33–39', gpa: '1.00' },
      { letter: 'F', range: '0–32', gpa: '0.00' },
    ]

    const css = orientation === 'landscape'
      ? `@page{size:A4 landscape;margin:10mm;}body{padding:8mm;}`
      : `@page{size:A4 portrait;margin:10mm;}body{padding:8mm;}`

    const studentPages = rows.map((r) => {
      const gColor = getGradeColor(r.cumGrade)
      const examHeaders = allExamIds.map((_eid, i) => {
        const eName = examNames[i]
        const w = examWeights[i]
        return `<th colspan="${r.subjectRows[0]?.examCells.length || 1}" style="background:${brand}cc;color:#fff;border:1px solid #fff;padding:3px 4px;font-size:7px;text-align:center;">${eName} (${w}%)</th>`
      }).join('')
      const examSubHeaders = allExamIds.map(() =>
        `<th style="background:#6b7280;color:#fff;border:1px solid #fff;padding:1px 3px;font-size:6px;">Total</th><th style="background:#6b7280;color:#fff;border:1px solid #fff;padding:1px 3px;font-size:6px;">Obt</th>`
      ).join('')

      const subjectTbody = r.subjectRows.map((s) => {
        const examCells = s.examCells.map((ex) =>
          `<td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:7px;">${ex.full}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:7px;font-weight:600;">${ex.obtained}</td>`
        ).join('')
        const gColor = getGradeColor(getGradeLetter(s.cumPct))
        return `<tr><td style="text-align:left;border:1px solid #d1d5db;padding:2px 5px;font-size:7px;white-space:nowrap;">${s.subjectName}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:7px;">${s.fullMarks}</td>${examCells}<td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:7px;font-weight:700;">${s.cumObt}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:7px;color:${gColor};font-weight:600;">${s.cumPct}%</td></tr>`
      }).join('')

      const summaryRows = r.examTotals.map((t, i) => {
        const gColor = getGradeColor(t.grade)
        return `<tr><td style="border:1px solid #d1d5db;padding:2px 5px;font-size:7px;">${examNames[i]}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:7px;font-weight:600;">${t.total}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:7px;color:${gColor};font-weight:700;">${t.grade}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:7px;">${(t.pct >= 80 ? 5.0 : t.pct >= 70 ? 4.0 : t.pct >= 60 ? 3.5 : t.pct >= 50 ? 3.0 : t.pct >= 40 ? 2.0 : t.pct >= 33 ? 1.0 : 0).toFixed(1)}</td></tr>`
      }).join('')

      const avgPct = r.cumFullTotal > 0 ? Math.round((r.cumObtTotal / r.cumFullTotal) * 100) : 0

      return `<div style="page-break-after:always;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
          <div><div style="font-size:14px;font-weight:700;color:${brand};">${institutionName}</div><div style="font-size:8px;color:#6b7280;">${institutionAddress}</div><div style="font-size:11px;font-weight:600;color:#374151;margin-top:1px;">${isBn ? 'কামিউলেটিভ মার্কশিট' : 'Cumulative Marksheet'}</div></div>
          <div><table style="font-size:6px;border-collapse:collapse;"><thead><tr style="background:${brand};color:#fff;"><th style="padding:1px 4px;">Marks(%)</th><th style="padding:1px 4px;">Grade</th><th style="padding:1px 4px;">GP</th></tr></thead><tbody>${gScale.map((g) => `<tr><td style="border:1px solid #d1d5db;padding:1px 3px;">${g.range}</td><td style="border:1px solid #d1d5db;padding:1px 3px;font-weight:600;color:${getGradeColor(g.letter)};">${g.letter}</td><td style="border:1px solid #d1d5db;padding:1px 3px;">${g.gpa}</td></tr>`).join('')}</tbody></table></div>
        </div>
        <div style="border-top:2px solid ${brand};margin-bottom:6px;"></div>
        <div style="display:flex;gap:12px;margin-bottom:6px;font-size:8px;">
          <div style="flex:1;display:grid;grid-template-columns:auto 1fr;gap:1px 6px;"><span style="font-weight:600;">Student:</span><span>${r.student.nameEn}</span><span style="font-weight:600;">ID:</span><span>${r.student.id}</span><span style="font-weight:600;">Roll:</span><span>${r.student.roll}</span></div>
          <div style="flex:1;display:grid;grid-template-columns:auto 1fr;gap:1px 6px;"><span style="font-weight:600;">Session:</span><span>${currentExamSession}</span><span style="font-weight:600;">Class:</span><span>${className}</span><span style="font-weight:600;">Section:</span><span>${sectionName}</span></div>
          <div style="flex:1;display:grid;grid-template-columns:auto 1fr;gap:1px 6px;"><span style="font-weight:600;">GPA:</span><span style="color:${gColor};font-weight:700;">${(r.cumPct >= 80 ? 5.0 : r.cumPct >= 70 ? 4.0 : r.cumPct >= 60 ? 3.5 : r.cumPct >= 50 ? 3.0 : r.cumPct >= 40 ? 2.0 : r.cumPct >= 33 ? 1.0 : 0).toFixed(1)}</span><span style="font-weight:600;">Avg Grade:</span><span style="font-weight:700;color:${gColor};">${r.cumGrade}</span><span style="font-weight:600;">Avg %:</span><span>${avgPct}%</span></div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
          <thead><tr><th style="background:${brand};color:#fff;border:1px solid #fff;padding:3px 5px;font-size:7px;text-align:left;">Subject</th><th style="background:${brand};color:#fff;border:1px solid #fff;padding:3px 3px;font-size:7px;">Total</th>${examHeaders}<th colspan="2" style="background:#1e293b;color:#fff;border:1px solid #fff;padding:3px 4px;font-size:7px;text-align:center;">Cumulative</th></tr>
          <tr><th style="background:#9ca3af;color:#fff;border:1px solid #fff;padding:1px;font-size:5px;"></th><th style="background:#9ca3af;color:#fff;border:1px solid #fff;padding:1px;font-size:5px;"></th>${examSubHeaders}<th style="background:#4b5563;color:#fff;border:1px solid #fff;padding:1px 3px;font-size:6px;">Obt</th><th style="background:#4b5563;color:#fff;border:1px solid #fff;padding:1px 3px;font-size:6px;">%</th></tr></thead>
          <tbody>${subjectTbody}</tbody>
        </table>
        <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
          <thead><tr style="background:${brand};color:#fff;"><th style="border:1px solid #d1d5db;padding:2px 5px;font-size:7px;text-align:left;">Exam Name</th><th style="border:1px solid #d1d5db;padding:2px 3px;font-size:7px;">Total Obt.</th><th style="border:1px solid #d1d5db;padding:2px 3px;font-size:7px;">Grade</th><th style="border:1px solid #d1d5db;padding:2px 3px;font-size:7px;">GPA</th></tr></thead>
          <tbody>${summaryRows}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;font-size:8px;font-weight:700;margin-bottom:6px;"><span>Total Marks: ${r.cumFullTotal}</span><span style="color:${brand};">Total Obtain: ${r.cumObtTotal}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e7eb;font-size:6px;color:#6b7280;">
          <div style="text-align:center;flex:1;">Class Teacher</div><div style="text-align:center;flex:1;">Principal's Signature</div><div style="text-align:center;flex:1;">Guardian's Signature</div>
        </div>
      </div>`
    }).join('')

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cumulative Marksheet</title><style>@page{size:A4 ${orientation};margin:10mm;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;font-size:10px;color:#1a1a2e;background:#fff;padding:10mm;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}${css}</style></head><body>${studentPages}</body></html>`
  }, [currentExamData, selectedIds, currentExamId, currentExamName, currentExamSession, className, sectionName, institutionName, institutionAddress, prevExams, calcCurrentWeight, brand, isBn, orientation])

  const handleDownload = useCallback(() => {
    openPrintWindow('Cumulative Marksheet', previewHtml.replace(/<!DOCTYPE html><html><head>[\s\S]*?<\/head><body>/, '').replace(/<\/body><\/html>/, ''), {
      css: orientation === 'landscape'
        ? `@page{size:A4 landscape;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;font-size:10px;color:#1a1a2e;background:#fff;padding:8mm;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}`
        : `@page{size:A4 portrait;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;font-size:10px;color:#1a1a2e;background:#fff;padding:8mm;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}`,
    })
  }, [previewHtml, orientation])

  const previewRef = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    if (previewRef.current && previewHtml) {
      const doc = previewRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(previewHtml)
        doc.close()
      }
    }
  }, [previewHtml])

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-box modal-content" style={{ maxWidth: showPreview ? '90%' : '30rem', transition: 'max-width 0.2s ease' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'কামিউলেটিভ মার্কশিট PDF' : 'Cumulative Marksheet PDF'}</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {selectedIds.length} {isBn ? 'জন শিক্ষার্থী' : 'students'} · {orientation === 'landscape' ? 'Landscape' : 'Portrait'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => setShowPreview(!showPreview)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '5px 8px', borderRadius: '0.5rem', background: showPreview ? 'var(--brand-light)' : 'var(--bg-tertiary)', border: `1px solid ${showPreview ? 'var(--brand)' : 'var(--border)'}`, color: showPreview ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              {showPreview ? <EyeOff size={12} /> : <Eye size={12} />} {isBn ? 'প্রিভিউ' : 'Preview'}
            </button>
            <button onClick={onClose} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: '65vh', maxHeight: '80vh' }}>
          {/* Left Panel - Options */}
          <div style={{ width: showPreview ? '33.333%' : '100%', padding: '12px', borderRight: showPreview ? '1px solid var(--border)' : 'none', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
            {/* Orientation */}
            <Section title={isBn ? '① ওরিয়েন্টেশন' : '① Orientation'}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {(['landscape', 'portrait'] as const).map((o) => (
                  <button key={o} onClick={() => setOrientation(o)} style={{ padding: '6px', borderRadius: '0.5rem', border: `1px solid ${orientation === o ? 'var(--brand)' : 'var(--border)'}`, background: orientation === o ? 'var(--brand-light)' : 'var(--bg-primary)', color: orientation === o ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: orientation === o ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                    {o === 'landscape' ? '🖼️ Landscape' : '📄 Portrait'}
                  </button>
                ))}
              </div>
            </Section>

            {/* Exam Weights */}
            <Section title={isBn ? '② পরীক্ষার ওজন' : '② Exam Weights'}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                {publishedExams.map((exam) => {
                  const sel = prevExams.some((e) => e.examId === exam.id)
                  return (
                    <button key={exam.id} onClick={() => sel ? removeExam(exam.id) : addExam(exam.id)} style={{ padding: '3px 8px', borderRadius: '0.375rem', border: `1px solid ${sel ? 'var(--brand)' : 'var(--border)'}`, background: sel ? 'var(--brand)' : 'var(--bg-primary)', color: sel ? '#fff' : 'var(--text-secondary)', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {sel ? '✓ ' : '+ '}{exam.name}
                    </button>
                  )
                })}
              </div>
              {prevExams.map((exam) => (
                <div key={exam.examId} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', width: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.examName}</span>
                  <input type="range" min={0} max={100} value={exam.weight} onChange={(e) => updateWeight(exam.examId, Number(e.target.value))} style={{ flex: 1, height: '3px', accentColor: 'var(--brand)' }} />
                  <input type="number" min={0} max={100} value={exam.weight} onChange={(e) => updateWeight(exam.examId, Math.min(100, Math.max(0, Number(e.target.value))))} style={{ width: '36px', height: '22px', padding: '0 3px', fontSize: '0.6rem', textAlign: 'center', borderRadius: '0.25rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>%</span>
                </div>
              ))}
              {prevExams.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', width: '70px', fontWeight: 600 }}>Current</span>
                    <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, width: '36px', textAlign: 'center', color: calcCurrentWeight < 0 ? 'var(--red)' : 'var(--brand)' }}>{calcCurrentWeight}%</span>
                  </div>
                  <button onClick={redistribute} style={{ marginTop: '4px', padding: '3px 8px', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                    {isBn ? 'সমান ভাগ করুন' : 'Redistribute Equally'}
                  </button>
                </>
              )}
            </Section>

            {/* Student Selection */}
            <Section title={isBn ? `③ শিক্ষার্থী (${selectedIds.length}/${currentExamData.length})` : `③ Students (${selectedIds.length}/${currentExamData.length})`}>
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isBn ? 'অনুসন্ধান...' : 'Search...'} style={{ width: '100%', padding: '5px 8px 5px 24px', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.7rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={toggleSelectAll} style={{ width: '100%', padding: '4px', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '4px' }}>
                {selectedIds.length === currentExamData.length ? (isBn ? 'সব বাদ দিন' : 'Deselect All') : (isBn ? 'সব নির্বাচন' : 'Select All')}
              </button>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {filteredStudents.map((s) => (
                  <label key={s.student.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 4px', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.6rem', color: 'var(--text-primary)' }}>
                    <input type="checkbox" checked={selectedIds.includes(s.student.id)} onChange={() => toggleStudent(s.student.id)} style={{ accentColor: 'var(--brand)' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.student.nameEn}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{s.student.roll}</span>
                  </label>
                ))}
              </div>
            </Section>

            {/* Download Button */}
            <button onClick={handleDownload} disabled={selectedIds.length === 0} style={{ width: '100%', padding: '8px', borderRadius: '0.5rem', background: brand, color: '#fff', border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedIds.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit', marginTop: 'auto' }}>
              <Download size={14} /> {isBn ? 'PDF ডাউনলোড' : 'Download PDF'}
            </button>
          </div>

          {/* Right Panel - Preview */}
          {showPreview && (
            <div style={{ flex: 1, background: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
              {previewHtml ? (
                <iframe ref={previewRef} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
              ) : (
                <p style={{ color: '#d1d5db', fontSize: '0.8125rem' }}>{isBn ? 'প্রিভিউ এখনো তৈরি হয়নি' : 'No preview yet'}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
})

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</div>
      {children}
    </div>
  )
}
