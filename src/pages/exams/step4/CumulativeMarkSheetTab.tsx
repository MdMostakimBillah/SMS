import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Download, Settings } from 'lucide-react'
import QRCode from 'qrcode'
import { useExamStore } from '@/store/examStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { getBrandColor, downloadHTML } from '@/lib/pdf'
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
  { letter: 'A+', range: '80-100' }, { letter: 'A', range: '70-79' }, { letter: 'A-', range: '60-69' },
  { letter: 'B', range: '50-59' }, { letter: 'C', range: '40-49' }, { letter: 'D', range: '33-39' }, { letter: 'F', range: '0-32' },
]

export const CumulativeMarkSheetTab = React.memo(function CumulativeMarkSheetTab({
  currentExamData, currentExamId, currentExamName, currentExamSession,
  className, sectionName, institutionName, institutionAddress, isBn = false,
}: CumulativeMarkSheetProps) {
  const brand = getBrandColor()
  const institution = useClassStore((s) => s.institution)
  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const allStudentMarks = useExamStore((s) => s.studentMarks)
  const allSubjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const { students: allStudents } = useAdmissionStore()
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const publishedExams = useMemo(() => {
    return allExamConfigs.filter((e) => {
      if (e.id === currentExamId) return false
      if (e.session !== currentSession) return false
      const hasMarksData = allSubjectMarkConfigs.some((s) => s.examId === e.id && s.classId === className)
      return hasMarksData
    })
  }, [allExamConfigs, currentExamId, currentSession, className, allSubjectMarkConfigs])

  const [prevExams, setPrevExams] = useState<PrevExam[]>([])
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const addExam = useCallback((examId: string) => {
    const exam = allExamConfigs.find((e) => e.id === examId)
    if (!exam || prevExams.some((e) => e.examId === examId)) return
    const examSubjects = allSubjectMarkConfigs.filter((c) => c.examId === examId && c.classId === className)
    const students: Record<string, { obtained: number; full: number; percentage: number }> = {}
    currentExamData.forEach((row) => {
      let totalObtained = 0, totalFull = 0
      examSubjects.forEach((sc) => {
        const mark = allStudentMarks.find((m) => m.examId === examId && m.studentId === row.student.id && m.subjectId === sc.subjectId && m.classId === className && m.sectionId === sectionName)
        totalObtained += mark?.totalMarks || 0
        totalFull += sc.fullMarks
      })
      students[row.student.id] = { obtained: totalObtained, full: totalFull, percentage: totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0 }
    })
    setPrevExams((p) => [...p, { examId: exam.id, examName: exam.name, weight: 0, students }])
  }, [allExamConfigs, prevExams, currentExamData, allSubjectMarkConfigs, allStudentMarks, className, sectionName])

  const removeExam = useCallback((examId: string) => setPrevExams((p) => p.filter((e) => e.examId !== examId)), [])
  const updateWeight = useCallback((examId: string, w: number) => setPrevExams((p) => p.map((e) => (e.examId === examId ? { ...e, weight: w } : e))), [])
  const redistribute = useCallback(() => {
    if (prevExams.length === 0) return
    const perExam = Math.round(100 / (prevExams.length + 1))
    setPrevExams((p) => p.map((e) => ({ ...e, weight: perExam })))
  }, [prevExams])

  const totalPrevWeight = prevExams.reduce((a, e) => a + e.weight, 0)
  const currentWeight = Math.max(0, 100 - totalPrevWeight)

  const subjectStats = useMemo(() => {
    const stats: Record<string, { highest: number; positions: Record<string, number> }> = {}
    const seen = new Set<string>()
    const allSubs: { subjectId: string }[] = []
    for (const s of currentExamData) {
      for (const sm of s.subjectMarks) {
        if (!seen.has(sm.subjectId)) { seen.add(sm.subjectId); allSubs.push({ subjectId: sm.subjectId }) }
      }
    }
    for (const sub of allSubs) {
      const marks = currentExamData.map((s) => ({ studentId: s.student.id, obtained: s.subjectMarks.find((m) => m.subjectId === sub.subjectId)?.obtained || 0 }))
      const highest = Math.max(...marks.map((m) => m.obtained), 0)
      const sorted = [...marks].sort((a, b) => b.obtained - a.obtained)
      const positions: Record<string, number> = {}
      let rank = 0, lastVal = -1
      sorted.forEach((m, i) => { if (m.obtained !== lastVal) { rank = i + 1; lastVal = m.obtained }; positions[m.studentId] = rank })
      stats[sub.subjectId] = { highest, positions }
    }
    return stats
  }, [currentExamData])

  const [qrMap, setQrMap] = useState<Record<string, string>>({})
  const qrRef = useRef(false)
  useEffect(() => {
    qrRef.current = false
    Promise.all(currentExamData.map(async (s) => {
      const admission = allStudents.find((a) => a.id === s.student.id)
      const subjects = s.subjectMarks.map((sm) => `${sm.subjectName}:${sm.obtained}/${sm.fullMarks}`).join('; ')
      const grade = s.passedAll ? getGradeLetter(s.percentage) : 'F'
      const payload = [
        `Name: ${s.student.nameEn}`,
        `ID: ${s.student.id}`,
        `Roll: ${s.student.roll}`,
        `Class: ${className}-${sectionName}`,
        `Exam: Cumulative (${currentExamSession})`,
        `Father: ${admission ? (isBn ? admission.fatherNameBn : admission.fatherNameEn || '-') : '-'}`,
        `Mother: ${admission ? (isBn ? admission.motherNameBn : admission.motherNameEn || '-') : '-'}`,
        `Total: ${s.totalObtained}/${s.totalFull} (${s.percentage.toFixed(1)}%)`,
        `GPA: ${s.gpa.toFixed(1)} [${grade}]`,
        `Subjects: ${subjects}`,
      ].join('\n')
      try { return { id: s.student.id, url: await QRCode.toDataURL(payload, { width: 512, margin: 3, errorCorrectionLevel: 'H', color: { dark: '#000000', light: '#ffffff' } }) } }
      catch { return { id: s.student.id, url: '' } }
    })).then((results) => { if (!qrRef.current) { const map: Record<string, string> = {}; results.forEach((r) => { map[r.id] = r.url }); setQrMap(map) } })
    return () => { qrRef.current = true }
  }, [currentExamData, allStudents, isBn, className, sectionName, currentExamSession])

  const handlePdfDownload = (html: string, filename: string) => {
    downloadHTML(filename, html)
    setShowPdfModal(false)
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <button onClick={() => setShowSettings(!showSettings)} className="h-8 px-3 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all inline-flex items-center gap-1.5" style={{ background: 'var(--bg-secondary)' }}>
          <Settings size={13} />{isBn ? 'ওজন সেটিং' : 'Weight Settings'}
        </button>
        <button onClick={() => setShowPdfModal(true)} className="h-8 px-4 rounded-lg text-xs font-medium text-white transition-all inline-flex items-center gap-1.5" style={{ background: brand }}>
          <Download size={13} />Download PDF
        </button>
      </div>

      {showSettings && (
        <div className="mb-4 p-4 rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--text-primary)]">{isBn ? 'ওজন বণ্টন' : 'Weight Distribution'}</span>
            <span className="text-[0.6rem] font-medium px-2 py-0.5 rounded-full" style={{ background: `${brand}15`, color: brand }}>{totalPrevWeight + currentWeight}%</span>
          </div>

          {/* Visual weight bar */}
          <div className="h-2 rounded-full overflow-hidden flex mb-3" style={{ background: 'var(--border)' }}>
            {prevExams.map((exam) => (
              <div key={exam.examId} className="h-full transition-all" style={{ width: `${exam.weight}%`, background: brand, opacity: 0.6 + (exam.weight / 100) * 0.4 }} />
            ))}
            {currentWeight > 0 && <div className="h-full transition-all" style={{ width: `${currentWeight}%`, background: brand }} />}
          </div>

          {/* Exam pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {publishedExams.map((exam) => {
              const sel = prevExams.some((e) => e.examId === exam.id)
              return <button key={exam.id} onClick={() => sel ? removeExam(exam.id) : addExam(exam.id)} className="px-2.5 py-1 rounded-lg text-[0.65rem] font-medium border transition-all" style={{ background: sel ? brand : 'var(--bg-primary)', color: sel ? '#fff' : 'var(--text-secondary)', borderColor: sel ? brand : 'var(--border)' }}>{sel ? '✓ ' : '+ '}{exam.name}</button>
            })}
          </div>

          {/* Weight inputs */}
          {prevExams.length > 0 && (
            <div className="space-y-2">
              {prevExams.map((exam) => (
                <div key={exam.examId} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]" style={{ background: 'var(--bg-primary)' }}>
                  <span className="text-[0.65rem] text-[var(--text-primary)] flex-1 truncate font-medium">{exam.examName}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={100} value={exam.weight} onChange={(e) => updateWeight(exam.examId, Math.min(100, Math.max(0, Number(e.target.value))))} className="w-14 h-7 px-2 text-[0.7rem] font-semibold text-center rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" />
                    <span className="text-[0.6rem] text-[var(--text-muted)] font-medium">%</span>
                  </div>
                  <button onClick={() => removeExam(exam.examId)} className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all text-[0.6rem]">✕</button>
                </div>
              ))}

              {/* Current exam row */}
              <div className="flex items-center gap-2 p-2 rounded-lg border-2" style={{ borderColor: brand, background: `${brand}08` }}>
                <span className="text-[0.65rem] flex-1 truncate font-bold" style={{ color: brand }}>{currentExamName}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[0.8rem] font-bold" style={{ color: brand }}>{currentWeight}%</span>
                </div>
                <div className="w-5" />
              </div>

              <button onClick={redistribute} className="w-full mt-1 px-2 py-1.5 rounded-lg text-[0.6rem] font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">Redistribute Equally</button>
            </div>
          )}
        </div>
      )}

      {currentExamData.map((student) => {
        const admission = allStudents.find((a) => a.id === student.student.id)
        let cumPct = student.adjustedPercentage * (currentWeight / 100)
        prevExams.forEach((prev) => { const data = prev.students[student.student.id]; if (data) cumPct += data.percentage * (prev.weight / 100) })
        const cumPctR = Math.round(cumPct)
        const cumGrade = student.passedAll ? getGradeLetter(cumPctR) : 'F'
        const cumGradeColor = getGradeColor(cumGrade)
        const cumGpa = getGpa(cumPctR, student.passedAll)

        return (
          <div key={student.student.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] overflow-hidden mb-6 shadow-sm">
            <div className="text-center pt-3 pb-2 px-5 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold" style={{ color: brand }}>{institution.name}</h2>
              {institution.nameBn && <p className="text-[0.6rem] text-[var(--text-secondary)] mt-0.5">{institution.nameBn}</p>}
              <p className="text-[0.6rem] text-[var(--text-secondary)] mt-0.5">{institution.address}</p>
              <div className="mt-1"><h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] border-b-2 inline-block pb-0.5" style={{ borderColor: brand }}>{isBn ? 'কামিউলেটিভ মার্কশিট' : 'Cumulative Marksheet'}</h3></div>
              <p className="text-[0.6rem] text-[var(--text-secondary)] mt-0.5">Session: {currentExamSession}</p>
            </div>

            <div className="mx-4 mb-2 p-2.5 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[0.65rem]">
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Name</span><span className="text-[var(--text-primary)] truncate">{student.student.nameEn}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Roll</span><span className="text-[var(--text-primary)]">{student.student.roll}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Class</span><span className="text-[var(--text-primary)]">{className}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Section</span><span className="text-[var(--text-primary)]">{sectionName}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Student ID</span><span className="text-[var(--text-primary)]">{student.student.id}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Exam</span><span className="text-[var(--text-primary)]">Cumulative</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Session</span><span className="text-[var(--text-primary)]">{currentExamSession}</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-0.5 mt-1.5 pt-1.5 border-t border-[var(--border)] text-[0.65rem]">
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Father</span><span className="text-[var(--text-primary)]">{admission ? (isBn ? admission.fatherNameBn : admission.fatherNameEn || '-') : '-'}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Mother</span><span className="text-[var(--text-primary)]">{admission ? (isBn ? admission.motherNameBn : admission.motherNameEn || '-') : '-'}</span></div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-[var(--border)]">
                    {student.classRank && <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: `${brand}12`, color: brand }}>Class Rank: #{student.classRank}</span>}
                    {student.sectionRank && <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: `${brand}12`, color: brand }}>Section Rank: #{student.sectionRank}</span>}
                    <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: `${cumGradeColor}18`, color: cumGradeColor }}>GPA: {cumGpa.toFixed(1)} ({cumGrade})</span>
                  </div>
                </div>
                <div className="w-14 h-[4.5rem] rounded flex items-center justify-center flex-shrink-0 border border-dashed" style={{ borderColor: `${brand}30`, background: `${brand}06` }}>
                  {admission?.photo ? <img src={admission.photo} alt="" className="w-14 h-[4.5rem] rounded object-cover" /> : <span className="text-[0.55rem] text-[var(--text-muted)] text-center">Photo</span>}
                </div>
              </div>
            </div>

            <div className="mx-4 mb-1.5 px-2.5 py-1 bg-[var(--bg-primary)] rounded border-l-3" style={{ borderColor: brand }}>
              <span className="text-[0.65rem] font-semibold text-[var(--text-primary)]">Class: {className} — Section: {sectionName}</span>
            </div>

            {/* ── MARKS TABLE ── */}
            <div className="mx-4 mb-2 overflow-x-auto">
              <table className="w-full text-[0.5rem] border border-[var(--border)] rounded-lg overflow-hidden" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr className="uppercase tracking-wide text-white" style={{ background: brand, fontSize: '0.45rem' }}>
                    <th className="text-left px-1.5 py-1 font-semibold">#</th>
                    <th className="text-left px-1.5 py-1 font-semibold whitespace-nowrap">Subject</th>
                    {prevExams.map((prev) => (
                      <th key={prev.examId} colSpan={4} className="text-center px-1 py-0.5 font-semibold" style={{ background: `${brand}cc`, fontSize: '0.4rem' }}>
                        <div className="leading-tight whitespace-nowrap">{prev.examName}</div>
                        <div className="opacity-75 font-normal">({prev.weight}%)</div>
                      </th>
                    ))}
                    <th colSpan={4} className="text-center px-1 py-0.5 font-semibold" style={{ background: `${brand}cc`, fontSize: '0.4rem' }}>
                      <div className="leading-tight whitespace-nowrap">{currentExamName}</div>
                      <div className="opacity-75 font-normal">({currentWeight}%)</div>
                    </th>
                    <th colSpan={2} className="text-center px-1 py-0.5 font-semibold" style={{ background: '#1e293b', fontSize: '0.4rem' }}>
                      <div className="leading-tight whitespace-nowrap">Cumulative</div>
                    </th>
                    <th className="text-center px-1 py-1 font-semibold" style={{ fontSize: '0.4rem' }}>High</th>
                    <th className="text-center px-1 py-1 font-semibold" style={{ fontSize: '0.4rem' }}>Pos</th>
                    <th className="text-center px-1 py-1 font-semibold" style={{ fontSize: '0.4rem' }}>Status</th>
                  </tr>
                  <tr style={{ background: '#6b7280', fontSize: '0.35rem', color: '#d1d5db' }}>
                    <th className="px-1.5 py-0.5"></th>
                    <th className="px-1.5 py-0.5"></th>
                    {prevExams.map((_, i) => (
                      <React.Fragment key={i}>
                        <th className="px-1 py-0.5">Full</th>
                        <th className="px-1 py-0.5 whitespace-nowrap">Obt</th>
                        <th className="px-1 py-0.5">%</th>
                        <th className="px-1 py-0.5">Grade</th>
                      </React.Fragment>
                    ))}
                    <th className="px-1 py-0.5">Full</th>
                    <th className="px-1 py-0.5 whitespace-nowrap">Obt</th>
                    <th className="px-1 py-0.5">%</th>
                    <th className="px-1 py-0.5">Grade</th>
                    <th className="px-1 py-0.5">%</th>
                    <th className="px-1 py-0.5">Grade</th>
                    <th className="px-1 py-0.5"></th>
                    <th className="px-1 py-0.5"></th>
                    <th className="px-1 py-0.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {student.subjectMarks.map((sm, idx) => {
                    const stat = subjectStats[sm.subjectId]
                    const rank = stat?.positions[student.student.id] || 0
                    const bg = idx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                    const prevMarks = prevExams.map((prev) => {
                      const examConfigs = allSubjectMarkConfigs.filter((c) => c.examId === prev.examId && c.classId === className)
                      const cfg = examConfigs.find((c) => c.subjectId === sm.subjectId)
                      const mark = allStudentMarks.find((m) => m.examId === prev.examId && m.studentId === student.student.id && m.subjectId === sm.subjectId && m.classId === className)
                      const obt = mark?.totalMarks || 0
                      const full = cfg?.fullMarks || sm.fullMarks
                      return { obt, full, pct: full > 0 ? Math.round((obt / full) * 100) : 0 }
                    })
                    const currentSubPct = sm.fullMarks > 0 ? Math.round((sm.obtained / sm.fullMarks) * 100) : 0
                    let cumSubjectPct = currentSubPct * (currentWeight / 100)
                    prevMarks.forEach((pm, pi) => { cumSubjectPct += pm.pct * (prevExams[pi].weight / 100) })
                    const cumSubjectPctR = Math.round(cumSubjectPct)
                    const cumSubjectGrade = student.passedAll ? getGradeLetter(cumSubjectPctR) : 'F'
                    return (
                      <tr key={sm.subjectId} style={{ background: bg }}>
                        <td className="text-center px-1.5 py-1 font-medium text-[var(--text-secondary)] border-b border-[var(--border)]">{idx + 1}</td>
                        <td className="text-left px-1.5 py-1 font-medium text-[var(--text-primary)] border-b border-[var(--border)] whitespace-nowrap">{sm.subjectName}</td>
                        {prevMarks.map((pm, pi) => (
                          <React.Fragment key={pi}>
                            <td className="text-center px-1 py-1 text-[var(--text-secondary)] border-b border-[var(--border)]">{pm.full}</td>
                            <td className="text-center px-1 py-1 text-[var(--text-secondary)] border-b border-[var(--border)]">{pm.obt}</td>
                            <td className="text-center px-1 py-1 font-medium border-b border-[var(--border)]" style={{ color: pm.pct >= 33 ? '#16a34a' : '#ef4444' }}>{pm.pct}%</td>
                            <td className="text-center px-1 py-1 font-medium border-b border-[var(--border)]" style={{ color: getGradeColor(getGradeLetter(pm.pct)) }}>{getGradeLetter(pm.pct)}</td>
                          </React.Fragment>
                        ))}
                        <td className="text-center px-1 py-1 text-[var(--text-secondary)] border-b border-[var(--border)]">{sm.fullMarks}</td>
                        <td className="text-center px-1 py-1 font-bold border-b border-[var(--border)]" style={{ color: brand }}>{sm.obtained}</td>
                        <td className="text-center px-1 py-1 font-medium border-b border-[var(--border)]" style={{ color: currentSubPct >= 33 ? '#16a34a' : '#ef4444' }}>{currentSubPct}%</td>
                        <td className="text-center px-1 py-1 font-semibold border-b border-[var(--border)]" style={{ color: getGradeColor(getGradeLetter(currentSubPct)) }}>{getGradeLetter(currentSubPct)}</td>
                        <td className="text-center px-1 py-1 font-bold border-b border-[var(--border)]" style={{ color: brand }}>{cumSubjectPctR}%</td>
                        <td className="text-center px-1 py-1 font-semibold border-b border-[var(--border)]" style={{ color: getGradeColor(cumSubjectGrade) }}>{cumSubjectGrade}</td>
                        <td className="text-center px-1 py-1 font-medium border-b border-[var(--border)]" style={{ color: stat?.highest === sm.obtained && sm.obtained > 0 ? brand : 'var(--text-primary)' }}>{stat?.highest || 0}</td>
                        <td className="text-center px-1 py-1 font-medium border-b border-[var(--border)]" style={{ color: rank <= 3 && rank > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{rank > 0 ? `#${rank}` : '-'}</td>
                        <td className="text-center px-1 py-1 font-medium border-b border-[var(--border)]"><span className="px-0.5 rounded" style={{ fontSize: '0.35rem', fontWeight: 600, ...(sm.passed ? { background: '#16a34a18', color: '#16a34a' } : { background: '#ef444418', color: '#ef4444' }) }}>{sm.passed ? 'Pass' : 'Fail'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold" style={{ background: `${brand}08`, fontSize: '0.45rem' }}>
                    <td colSpan={2} className="text-right pr-1.5 py-1 text-[var(--text-primary)] border-t-2 whitespace-nowrap" style={{ borderColor: `${brand}40` }}>Total</td>
                    {prevExams.map((prev) => {
                      const data = prev.students[student.student.id]
                      const pct = data?.percentage || 0
                      return <React.Fragment key={prev.examId}>
                        <td className="text-center px-1 py-1 border-t-2 text-[var(--text-secondary)]" style={{ borderColor: `${brand}40` }}>{data?.full || 0}</td>
                        <td className="text-center px-1 py-1 border-t-2" style={{ borderColor: `${brand}40`, color: brand }}>{data?.obtained || 0}</td>
                        <td className="text-center px-1 py-1 border-t-2" style={{ borderColor: `${brand}40`, color: 'var(--text-muted)', fontSize: '0.4rem' }}>{pct}%</td>
                        <td className="text-center px-1 py-1 border-t-2 font-semibold" style={{ borderColor: `${brand}40`, color: getGradeColor(getGradeLetter(pct)) }}>{getGradeLetter(pct)}</td>
                      </React.Fragment>
                    })}
                    <td className="text-center px-1 py-1 border-t-2 text-[var(--text-secondary)]" style={{ borderColor: `${brand}40` }}>{student.totalFull}</td>
                    <td className="text-center px-1 py-1 border-t-2" style={{ borderColor: `${brand}40`, color: brand }}>{student.totalObtained}</td>
                    <td className="text-center px-1 py-1 border-t-2" style={{ borderColor: `${brand}40`, color: 'var(--text-muted)', fontSize: '0.4rem' }}>{student.adjustedPercentage}%</td>
                    <td className="text-center px-1 py-1 border-t-2 font-semibold" style={{ borderColor: `${brand}40`, color: getGradeColor(cumGrade) }}>{cumGrade}</td>
                    <td className="text-center px-1 py-1 border-t-2" style={{ borderColor: `${brand}40`, color: 'var(--text-muted)', fontSize: '0.4rem' }}>{cumPctR}%</td>
                    <td className="text-center px-1 py-1 border-t-2 font-semibold" style={{ borderColor: `${brand}40`, color: cumGradeColor }}>{cumGrade}</td>
                    <td className="border-t-2" style={{ borderColor: `${brand}40` }}></td>
                    <td className="border-t-2" style={{ borderColor: `${brand}40` }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mx-4 mb-2 p-2 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border)] flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1">
                {gradeScale.map((g) => (
                  <div key={g.letter} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                    <span className="w-4 h-4 rounded flex items-center justify-center text-[0.5rem] font-bold" style={{ background: `${getGradeColor(g.letter)}18`, color: getGradeColor(g.letter) }}>{g.letter}</span>
                    <span className="text-[0.5rem] text-[var(--text-secondary)]">{g.range}%</span>
                  </div>
                ))}
              </div>
              {qrMap[student.student.id] && <img src={qrMap[student.student.id]} alt="QR" className="w-14 h-14 flex-shrink-0" />}
            </div>

            <div className="flex justify-between px-5 py-2 border-t border-[var(--border)]">
              <div className="text-center"><div className="w-24 border-b border-[var(--border)] mb-0.5"></div><span className="text-[0.6rem] text-[var(--text-secondary)]">Director</span></div>
              <div className="text-center"><div className="w-24 border-b border-[var(--border)] mb-0.5"></div><span className="text-[0.6rem] text-[var(--text-secondary)]">Checked By</span></div>
            </div>
          </div>
        )
      })}

      {showPdfModal && (
        <CumulativeMarksheetPDFOptionsModal
          currentExamData={currentExamData} currentExamId={currentExamId} currentExamName={currentExamName}
          currentExamSession={currentExamSession} className={className} sectionName={sectionName}
          institutionName={institutionName} institutionAddress={institutionAddress}
          publishedExams={publishedExams.map((e) => ({ id: e.id, name: e.name }))}
          prevExams={prevExams} currentWeight={currentWeight} isBn={isBn}
          onClose={() => setShowPdfModal(false)} onDownload={handlePdfDownload} onPrevExamsChange={setPrevExams} onCurrentWeightChange={() => {}}
        />
      )}
    </div>
  )
})
