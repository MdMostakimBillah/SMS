import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, File, LayoutTemplate, Download, Eye, EyeOff, Search } from 'lucide-react'
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
}: Props) {
  const brand = getBrandColor()
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')
  const [fontSize, setFontSize] = useState<'default' | 'compact'>('default')
  const [selectedIds, setSelectedIds] = useState<string[]>(currentExamData.map((s) => s.student.id))
  const [searchQuery, setSearchQuery] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [localPrevExams, setLocalPrevExams] = useState<PrevExam[]>(prevExams)

  useEffect(() => { setLocalPrevExams(prevExams) }, [prevExams])

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
    if (!exam || localPrevExams.some((e) => e.examId === examId)) return
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
      students[row.student.id] = { obtained: totalObtained, full: totalFull, percentage: totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0 }
    })
    const updated = [...localPrevExams, { examId: exam.id, examName: exam.name, weight: 0, students }]
    setLocalPrevExams(updated)
    onPrevExamsChange(updated)
  }, [publishedExams, localPrevExams, currentExamData, className, sectionName, onPrevExamsChange])

  const removeExam = useCallback((examId: string) => {
    const updated = localPrevExams.filter((e) => e.examId !== examId)
    setLocalPrevExams(updated)
    onPrevExamsChange(updated)
  }, [localPrevExams, onPrevExamsChange])

  const updateWeight = useCallback((examId: string, w: number) => {
    const updated = localPrevExams.map((e) => (e.examId === examId ? { ...e, weight: w } : e))
    setLocalPrevExams(updated)
    onPrevExamsChange(updated)
  }, [localPrevExams, onPrevExamsChange])

  const totalPrevWeight = localPrevExams.reduce((a, e) => a + e.weight, 0)
  const calcCurrentWeight = Math.max(0, 100 - totalPrevWeight)

  const redistribute = useCallback(() => {
    if (localPrevExams.length === 0) return
    const perExam = Math.round(100 / (localPrevExams.length + 1))
    const updated = localPrevExams.map((e) => ({ ...e, weight: perExam }))
    setLocalPrevExams(updated)
    onPrevExamsChange(updated)
  }, [localPrevExams, onPrevExamsChange])

  const previewHtml = useMemo(() => {
    const selected = currentExamData.filter((s) => selectedIds.includes(s.student.id))
    if (selected.length === 0) return ''

    // Font size configuration
    const fs = fontSize === 'compact' ? {
      headerName: '11px', headerAddress: '6px', headerTitle: '9px', headerExam: '6px',
      studentInfo: '7px', tableHeader: '6px', tableCell: '6.5px', tableSubHeader: '5px',
      summaryHeader: '6.5px', summaryCell: '6.5px', totalFont: '7px', sigFont: '5.5px',
    } : {
      headerName: '14px', headerAddress: '8px', headerTitle: '11px', headerExam: '7px',
      studentInfo: '8px', tableHeader: '7px', tableCell: '7px', tableSubHeader: '5px',
      summaryHeader: '7px', summaryCell: '7px', totalFont: '8px', sigFont: '6px',
    }

    const allExamIds = [currentExamId, ...localPrevExams.map((e) => e.examId)]
    const examNames = allExamIds.map((eid) => eid === currentExamId ? currentExamName : localPrevExams.find((e) => e.examId === eid)?.examName || '')
    const examWeights = allExamIds.map((eid) => eid === currentExamId ? calcCurrentWeight : localPrevExams.find((e) => e.examId === eid)?.weight || 0)

    const subjectMarkConfigs = useExamStore.getState().subjectMarkConfigs
    const studentMarks = useExamStore.getState().studentMarks

    const firstExamConfigs = subjectMarkConfigs.filter((c) => c.examId === currentExamId && c.classId === className)

    const rows = selected.map((row) => {
      const stu = row.student
      const subjectRows = firstExamConfigs.map((cfg) => {
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
        const subjectName = useTeacherStore.getState().subjects.find((s: { id: string; name: string }) => s.id === cfg.subjectId)?.name || cfg.subjectId
        return { subjectId: cfg.subjectId, subjectName, fullMarks: cfg.fullMarks, examCells, cumObt, cumPct }
      })

      const examTotals = allExamIds.map((_eid, i) => {
        const total = subjectRows.reduce((a, s) => a + (s.examCells[i]?.obtained || 0), 0)
        const full = subjectRows.reduce((a, s) => a + (s.examCells[i]?.full || 0), 0)
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

    const studentPages = rows.map((r) => {
      const gColor = getGradeColor(r.cumGrade)
      const examHeaders = allExamIds.map((_eid, i) => {
        return `<th colspan="4" style="background:${brand}cc;color:#fff;border:1px solid #d1d5db;padding:3px 4px;font-size:${fs.tableHeader};text-align:center;white-space:nowrap;">${examNames[i]} (${examWeights[i]}%)</th>`
      }).join('')
      const examSubHeaders = allExamIds.map(() =>
        `<th style="background:#6b7280;color:#fff;border:1px solid #d1d5db;padding:1px 3px;font-size:${fs.tableSubHeader};">Full</th><th style="background:#6b7280;color:#fff;border:1px solid #d1d5db;padding:1px 3px;font-size:${fs.tableSubHeader};white-space:nowrap;">Obt</th><th style="background:#6b7280;color:#fff;border:1px solid #d1d5db;padding:1px 3px;font-size:${fs.tableSubHeader};">%</th><th style="background:#6b7280;color:#fff;border:1px solid #d1d5db;padding:1px 3px;font-size:${fs.tableSubHeader};">Grade</th>`
      ).join('')

      const subjectTbody = r.subjectRows.map((s) => {
        const examCells = s.examCells.map((ex) => {
          const pct = ex.full > 0 ? Math.round((ex.obtained / ex.full) * 100) : 0
          const pctColor = pct >= 33 ? '#16a34a' : '#ef4444'
          const grade = getGradeLetter(pct)
          const gradeColor = getGradeColor(grade)
          return `<td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.tableCell};">${ex.full}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.tableCell};font-weight:600;">${ex.obtained}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.tableCell};color:${pctColor};">${pct}%</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.tableCell};color:${gradeColor};font-weight:600;">${grade}</td>`
        }).join('')
        const cPctColor = s.cumPct >= 33 ? '#16a34a' : '#ef4444'
        const cumGrade = getGradeLetter(s.cumPct)
        const cumGradeColor = getGradeColor(cumGrade)
        return `<tr><td style="text-align:left;border:1px solid #d1d5db;padding:2px 5px;font-size:${fs.tableCell};white-space:nowrap;">${s.subjectName}</td>${examCells}<td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.tableCell};color:${cPctColor};font-weight:600;">${s.cumPct}%</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.tableCell};color:${cumGradeColor};font-weight:600;">${cumGrade}</td></tr>`
      }).join('')

      const summaryRows = r.examTotals.map((t, i) => {
        const gColor = getGradeColor(t.grade)
        return `<tr><td style="border:1px solid #d1d5db;padding:2px 5px;font-size:${fs.summaryCell};">${examNames[i]}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryCell};font-weight:600;">${t.total}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryCell};color:${gColor};font-weight:700;">${t.grade}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryCell};">${(t.pct >= 80 ? 5.0 : t.pct >= 70 ? 4.0 : t.pct >= 60 ? 3.5 : t.pct >= 50 ? 3.0 : t.pct >= 40 ? 2.0 : t.pct >= 33 ? 1.0 : 0).toFixed(1)}</td></tr>`
      }).join('')
      const cumGpaVal = r.cumPct >= 80 ? 5.0 : r.cumPct >= 70 ? 4.0 : r.cumPct >= 60 ? 3.5 : r.cumPct >= 50 ? 3.0 : r.cumPct >= 40 ? 2.0 : r.cumPct >= 33 ? 1.0 : 0
      const cumGColor = getGradeColor(r.cumGrade)
      const cumSummaryRow = `<tr style="font-weight:700;"><td style="border:1px solid #d1d5db;padding:2px 5px;font-size:${fs.summaryCell};background:${brand}08;">Cumulative</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryCell};background:${brand}08;">${r.cumObtTotal}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryCell};background:${brand}08;color:${cumGColor};font-weight:700;">${r.cumGrade}</td><td style="text-align:center;border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryCell};background:${brand}08;">${cumGpaVal.toFixed(1)}</td></tr>`

      const avgPct = r.cumFullTotal > 0 ? Math.round((r.cumObtTotal / r.cumFullTotal) * 100) : 0

      return `<div style="page-break-after:always;page-break-inside:avoid;">
        <div style="text-align:center;margin-bottom:6px;">
          <div style="font-size:${fs.headerName};font-weight:700;color:${brand};">${institutionName}</div>
          <div style="font-size:${fs.headerAddress};color:#6b7280;">${institutionAddress}</div>
          <div style="font-size:${fs.headerTitle};font-weight:600;color:#374151;margin-top:2px;">${isBn ? 'কামিউলেটিভ মার্কশিট' : 'Cumulative Marksheet'}</div>
          <div style="font-size:${fs.headerExam};color:#6b7280;margin-top:1px;">Session: ${currentExamSession} · Class: ${className} · Section: ${sectionName}</div>
        </div>
        <div style="border-top:2px solid ${brand};margin-bottom:6px;"></div>
        <div style="display:flex;gap:12px;margin-bottom:6px;font-size:${fs.studentInfo};">
          <div style="flex:1;display:grid;grid-template-columns:auto 1fr;gap:1px 6px;">
            <span style="font-weight:600;">Student:</span><span>${r.student.nameEn}</span>
            <span style="font-weight:600;">Roll:</span><span>${r.student.roll}</span>
            <span style="font-weight:600;">ID:</span><span>${r.student.id}</span>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:auto 1fr;gap:1px 6px;">
            <span style="font-weight:600;">GPA:</span><span style="color:${gColor};font-weight:700;">${(r.cumPct >= 80 ? 5.0 : r.cumPct >= 70 ? 4.0 : r.cumPct >= 60 ? 3.5 : r.cumPct >= 50 ? 3.0 : r.cumPct >= 40 ? 2.0 : r.cumPct >= 33 ? 1.0 : 0).toFixed(1)}</span>
            <span style="font-weight:600;">Grade:</span><span style="font-weight:700;color:${gColor};">${r.cumGrade}</span>
            <span style="font-weight:600;">Avg %:</span><span>${avgPct}%</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:6px;table-layout:auto;">
          <thead>
            <tr>
              <th style="background:${brand};color:#fff;border:1px solid #d1d5db;padding:3px 5px;font-size:${fs.tableHeader};text-align:left;white-space:nowrap;">Subject</th>
              ${examHeaders}
              <th colspan="2" style="background:#1e293b;color:#fff;border:1px solid #d1d5db;padding:3px 4px;font-size:${fs.tableHeader};text-align:center;white-space:nowrap;">Cumulative</th>
            </tr>
            <tr>
              <th style="background:#9ca3af;color:#fff;border:1px solid #d1d5db;padding:1px;font-size:${fs.tableSubHeader};"></th>
              ${examSubHeaders}
              <th style="background:#4b5563;color:#fff;border:1px solid #d1d5db;padding:1px 3px;font-size:${fs.tableSubHeader};">%</th>
              <th style="background:#4b5563;color:#fff;border:1px solid #d1d5db;padding:1px 3px;font-size:${fs.tableSubHeader};">Grade</th>
            </tr>
          </thead>
          <tbody>${subjectTbody}</tbody>
        </table>
        <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
          <thead><tr style="background:${brand};color:#fff;"><th style="border:1px solid #d1d5db;padding:2px 5px;font-size:${fs.summaryHeader};text-align:left;">Exam Name</th><th style="border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryHeader};">Total Obt.</th><th style="border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryHeader};">Grade</th><th style="border:1px solid #d1d5db;padding:2px 3px;font-size:${fs.summaryHeader};">GPA</th></tr></thead>
          <tbody>${summaryRows}${cumSummaryRow}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;font-size:${fs.totalFont};font-weight:700;margin-bottom:6px;">
          <span>Total Marks: ${r.cumFullTotal}</span>
          <span style="color:${brand};">Total Obtain: ${r.cumObtTotal}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e7eb;font-size:${fs.sigFont};color:#6b7280;">
          <div style="text-align:center;flex:1;">Class Teacher</div>
          <div style="text-align:center;flex:1;">Principal's Signature</div>
          <div style="text-align:center;flex:1;">Guardian's Signature</div>
        </div>
      </div>`
    }).join('')

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cumulative Marksheet</title><style>@page{size:A4 ${orientation};margin:10mm;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;font-size:${fontSize === 'compact' ? '8px' : '10px'};color:#1a1a2e;background:#fff;padding:10mm;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}</style></head><body>${studentPages}</body></html>`
  }, [currentExamData, selectedIds, currentExamId, currentExamName, currentExamSession, className, sectionName, institutionName, institutionAddress, localPrevExams, calcCurrentWeight, brand, isBn, orientation, fontSize])

  const handleDownload = useCallback(() => {
    openPrintWindow('Cumulative Marksheet', previewHtml, {
      css: orientation === 'landscape'
        ? `@page{size:A4 landscape;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;font-size:${fontSize === 'compact' ? '8px' : '10px'};color:#1a1a2e;background:#fff;padding:8mm;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}`
        : `@page{size:A4 portrait;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,sans-serif;font-size:${fontSize === 'compact' ? '8px' : '10px'};color:#1a1a2e;background:#fff;padding:8mm;}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}`,
    })
  }, [previewHtml, orientation, fontSize])

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

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.0313rem',
    marginBottom: '0.5rem',
  }

  return createPortal(
    <div className="modal-overlay">
      <div
        className="modal-box modal-content"
        style={{ maxWidth: showPreview ? '90%' : '30rem', transition: 'max-width 0.2s ease' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'কামিউলেটিভ মার্কশিট PDF' : 'Cumulative Marksheet PDF'}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {selectedIds.length} {isBn ? 'জন শিক্ষার্থী নির্বাচিত' : 'students selected'}
              {' · '}
              {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? (isBn ? 'প্রিভিউ লুকান' : 'Hide Preview') : (isBn ? 'প্রিভিউ দেখান' : 'Show Preview')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '6px 10px', borderRadius: '0.5rem', background: showPreview ? 'var(--brand-light)' : 'var(--bg-tertiary)', border: `1px solid ${showPreview ? 'var(--brand)' : 'var(--border)'}`, color: showPreview ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {isBn ? 'প্রিভিউ' : 'Preview'}
            </button>
            <button onClick={onClose} style={{ width: '1.875rem', height: '1.875rem', borderRadius: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxHeight: 'calc(100vh - 10rem)' }}>
          {/* Left: Options */}
          <div style={{ flex: showPreview ? '0 0 33.333%' : 1, overflowY: 'auto', padding: '18px 20px', borderRight: showPreview ? '1px solid var(--border)' : 'none', minWidth: 0 }}>

            {/* ① Orientation */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sectionLabel}>① {isBn ? 'কাগজের দিক' : 'Page Orientation'}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['portrait', 'landscape'] as const).map((o) => (
                  <button key={o} onClick={() => setOrientation(o)} style={{ flex: 1, padding: '0.625rem', borderRadius: '0.625rem', border: `2px solid ${orientation === o ? 'var(--brand)' : 'var(--border)'}`, background: orientation === o ? 'var(--brand-light)' : 'var(--bg-secondary)', color: orientation === o ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: orientation === o ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                    {o === 'portrait' ? <File size={15} /> : <LayoutTemplate size={15} />}
                    {isBn ? (o === 'portrait' ? 'উল্লম্ব (Portrait)' : 'আনুভূমিক (Landscape)') : o === 'portrait' ? 'Portrait' : 'Landscape'}
                  </button>
                ))}
              </div>
            </div>

            {/* ② Font Size */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sectionLabel}>② {isBn ? 'ফন্ট সাইজ' : 'Font Size'}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['default', 'compact'] as const).map((fs) => (
                  <button
                    key={fs}
                    onClick={() => setFontSize(fs)}
                    style={{ flex: 1, padding: '0.625rem', borderRadius: '0.625rem', border: `2px solid ${fontSize === fs ? 'var(--brand)' : 'var(--border)'}`, background: fontSize === fs ? 'var(--brand-light)' : 'var(--bg-secondary)', color: fontSize === fs ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: fontSize === fs ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                  >
                    {fs === 'default' ? (isBn ? 'ডিফল্ট (বড়)' : 'Default (Large)') : (isBn ? 'কমপ্যাক্ট (ছোট)' : 'Compact (Small)')}
                  </button>
                ))}
              </div>
            </div>

            {/* ③ Exam Weights */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sectionLabel}>③ {isBn ? 'পরীক্ষার ওজন' : 'Exam Weights'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3125rem', marginBottom: '0.5rem' }}>
                {publishedExams.map((exam) => {
                  const sel = localPrevExams.some((e) => e.examId === exam.id)
                  return (
                    <button key={exam.id} onClick={() => sel ? removeExam(exam.id) : addExam(exam.id)} style={{ padding: '4px 10px', borderRadius: '0.375rem', border: `1px solid ${sel ? 'var(--brand)' : 'var(--border)'}`, background: sel ? 'var(--brand)' : 'var(--bg-secondary)', color: sel ? '#fff' : 'var(--text-secondary)', fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: sel ? 500 : 400 }}>
                      {sel ? '✓ ' : '+ '}{exam.name}
                  </button>
                  )
                })}
              </div>
              {localPrevExams.map((exam) => (
                <div key={exam.examId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', padding: '0.375rem 0.5rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-primary)', width: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{exam.examName}</span>
                  <input type="range" min={0} max={100} value={exam.weight} onChange={(e) => updateWeight(exam.examId, Number(e.target.value))} style={{ flex: 1, height: '3px', accentColor: 'var(--brand)' }} />
                  <input type="number" min={0} max={100} value={exam.weight} onChange={(e) => updateWeight(exam.examId, Math.min(100, Math.max(0, Number(e.target.value))))} style={{ width: '36px', height: '22px', padding: '0 3px', fontSize: '0.6875rem', textAlign: 'center', borderRadius: '0.25rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>%</span>
                  <button onClick={() => removeExam(exam.examId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', fontSize: '0.75rem', lineHeight: 1 }}>✕</button>
                </div>
              ))}
              {localPrevExams.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', paddingTop: '0.375rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', width: '70px', fontWeight: 600 }}>Current</span>
                    <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px' }} />
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, width: '36px', textAlign: 'center', color: calcCurrentWeight < 0 ? 'var(--red)' : 'var(--brand)' }}>{calcCurrentWeight}%</span>
                  </div>
                  <button onClick={redistribute} style={{ marginTop: '0.375rem', padding: '4px 10px', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                    {isBn ? 'সমান ভাগ করুন' : 'Redistribute Equally'}
                  </button>
                </>
              )}
            </div>

            {/* ④ Students */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={sectionLabel}>④ {isBn ? 'শিক্ষার্থী নির্বাচন' : 'Select Students'} ({selectedIds.length}/{currentExamData.length})</div>
                <button
                  onClick={toggleSelectAll}
                  style={{ fontSize: '0.6875rem', padding: '3px 9px', borderRadius: '0.375rem', background: 'var(--brand-light)', border: '1px solid var(--brand)', color: 'var(--brand)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {selectedIds.length === currentExamData.length ? (isBn ? 'পরিষ্কার' : 'Deselect') : (isBn ? 'সব' : 'Select All')}
                </button>
              </div>
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={isBn ? 'শিক্ষার্থী খুঁজুন...' : 'Search students...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
                {filteredStudents.map((s) => {
                  const checked = selectedIds.includes(s.student.id)
                  return (
                    <label key={s.student.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: checked ? 'var(--brand-light)' : 'transparent', transition: 'background 0.1s' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.student.id)} style={{ width: '0.875rem', height: '0.875rem', accentColor: 'var(--brand)', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.8125rem', color: checked ? 'var(--brand)' : 'var(--text-primary)', fontWeight: checked ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.student.nameEn}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.student.roll}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Download Button */}
            <button onClick={handleDownload} disabled={selectedIds.length === 0} style={{ width: '100%', padding: '10px', borderRadius: '0.625rem', background: brand, color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedIds.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit', marginTop: '1.25rem' }}>
              <Download size={15} /> {isBn ? 'PDF ডাউনলোড' : 'Download PDF'}
            </button>
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div style={{ flex: 1, background: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
              {previewHtml ? (
                <iframe ref={previewRef} title="PDF Preview" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
              ) : (
                <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{isBn ? 'প্রিভিউ এখনো তৈরি হয়নি' : 'No preview yet'}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
})
