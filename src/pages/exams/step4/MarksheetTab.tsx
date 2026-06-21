import { useState, useMemo, useEffect, useRef } from 'react'
import { Download } from 'lucide-react'
import QRCode from 'qrcode'
import { useAdmissionStore } from '@/store/admissionStore'
import { getBrandColor } from '@/lib/pdf'
import { MarksheetPDFOptionsModal } from './MarksheetPDFOptionsModal'
import { downloadHTML } from '@/lib/pdf'
import { useClassStore } from '@/store/classStore'

interface SubjectMark {
  subjectId: string
  subjectName: string | undefined
  fullMarks: number
  passMarks: number
  obtained: number
  grade: string
  passed: boolean
  subExams?: { id: string; name: string; nameBn: string; fullMarks: number; passMarks: number }[]
  subExamMarks?: Record<string, number>
}

export interface TabulationStudent {
  student: {
    id: string
    nameEn: string
    nameBn: string
    class: string
    section: string
    roll: string
    photo: string
    fatherNameEn: string
    fatherNameBn: string
    motherNameEn: string
    motherNameBn: string
  }
  subjectMarks: SubjectMark[]
  totalObtained: number
  totalFull: number
  percentage: number
  gpa: number
  passedAll: boolean
  classRank?: number
  sectionRank?: number
}

interface MarksheetTabProps {
  enrichedData: TabulationStudent[]
  examName: string
  examSession: string
  className: string
  sectionName: string
  institutionName: string
  institutionAddress: string
  isBn?: boolean
}

export interface MarksheetOptions {
  showFather: boolean
  showMother: boolean
  showGpa: boolean
  showClassRank: boolean
  showSectionRank: boolean
  showPhoto: boolean
  showSubjectHighest: boolean
  showSubExams: boolean
  showGradeScale: boolean
  showSignature: boolean
  fontSize: 'default' | 'compact'
}

const gradeScale = [
  { letter: 'A+', range: '80–100', min: 80 },
  { letter: 'A', range: '70–79', min: 70 },
  { letter: 'A-', range: '60–69', min: 60 },
  { letter: 'B', range: '50–59', min: 50 },
  { letter: 'C', range: '40–49', min: 40 },
  { letter: 'D', range: '33–39', min: 33 },
  { letter: 'F', range: '0–32', min: 0 },
]

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

export default function MarksheetTab({
  enrichedData,
  examName,
  examSession,
  className,
  sectionName,
  institutionName,
  institutionAddress,
  isBn = false,
}: MarksheetTabProps) {
  const { students: allStudents } = useAdmissionStore()
  const brand = getBrandColor()
  const institution = useClassStore((s) => s.institution)

  const [showPdfModal, setShowPdfModal] = useState(false)
  const [options] = useState<MarksheetOptions>({
    showFather: true,
    showMother: true,
    showGpa: true,
    showClassRank: true,
    showSectionRank: true,
    showPhoto: true,
    showSubjectHighest: true,
    showSubExams: true,
    showGradeScale: true,
    showSignature: true,
    fontSize: 'default',
  })

  const hasSubExams = useMemo(() => {
    return enrichedData.some((s) => s.subjectMarks.some((m) => m.subExams && m.subExams.length > 0))
  }, [enrichedData])

  const subjectStats = useMemo(() => {
    const stats: Record<string, { highest: number; positions: Record<string, number> }> = {}
    const seen = new Set<string>()
    const allSubjects: { subjectId: string }[] = []
    for (const s of enrichedData) {
      for (const sm of s.subjectMarks) {
        if (!seen.has(sm.subjectId)) {
          seen.add(sm.subjectId)
          allSubjects.push({ subjectId: sm.subjectId })
        }
      }
    }
    for (const sub of allSubjects) {
      const marks = enrichedData.map((s) => {
        const sm = s.subjectMarks.find((m) => m.subjectId === sub.subjectId)
        return { studentId: s.student.id, obtained: sm?.obtained || 0 }
      })
      const highest = Math.max(...marks.map((m) => m.obtained), 0)
      const sorted = [...marks].sort((a, b) => b.obtained - a.obtained)
      const positions: Record<string, number> = {}
      let rank = 0
      let lastVal = -1
      sorted.forEach((m, i) => {
        if (m.obtained !== lastVal) { rank = i + 1; lastVal = m.obtained }
        positions[m.studentId] = rank
      })
      stats[sub.subjectId] = { highest, positions }
    }
    return stats
  }, [enrichedData])

  const [qrMap, setQrMap] = useState<Record<string, string>>({})
  const qrCancelledRef = useRef(false)

  useEffect(() => {
    qrCancelledRef.current = false
    Promise.all(
      enrichedData.map(async (s) => {
        const admission = allStudents.find((a) => a.id === s.student.id)
        const subjects = s.subjectMarks.map((sm) => `${sm.subjectName}:${sm.obtained}/${sm.fullMarks}`).join(', ')
        const grade = s.passedAll ? getGradeLetter(s.percentage) : 'F'
        const payload = [
          `Name: ${s.student.nameEn}`,
          `ID: ${s.student.id}`,
          `Roll: ${s.student.roll}`,
          `Class: ${className}`,
          `Section: ${sectionName}`,
          `Exam: ${examName}`,
          `Session: ${examSession}`,
          `Father: ${admission ? (isBn ? admission.fatherNameBn : admission.fatherNameEn || '-') : '-'}`,
          `Mother: ${admission ? (isBn ? admission.motherNameBn : admission.motherNameEn || '-') : '-'}`,
          `Total: ${s.totalObtained}/${s.totalFull}`,
          `Pct: ${s.percentage.toFixed(1)}%`,
          `GPA: ${s.gpa.toFixed(1)}`,
          `Grade: ${grade}`,
          `Rank: ${s.classRank ? '#' + s.classRank : '-'}`,
          `Subs: ${subjects}`,
        ].join('\n')
        try {
          return { id: s.student.id, url: await QRCode.toDataURL(payload, { width: 512, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#000000', light: '#ffffff' } }) }
        } catch {
          return { id: s.student.id, url: '' }
        }
      })
    ).then((results) => {
      if (!qrCancelledRef.current) {
        const map: Record<string, string> = {}
        results.forEach((r) => { map[r.id] = r.url })
        setQrMap(map)
      }
    })
    return () => { qrCancelledRef.current = true }
  }, [enrichedData, allStudents, isBn, className, sectionName, examName, examSession])

  const handlePdfDownload = (html: string, filename: string) => {
    downloadHTML(filename, html)
    setShowPdfModal(false)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button onClick={() => setShowPdfModal(true)} className="h-8 px-4 rounded-lg text-xs font-medium text-white transition-all inline-flex items-center gap-1.5" style={{ background: brand }}>
          <Download size={13} />Download PDF
        </button>
      </div>

      {/* Student Marksheets */}
      {enrichedData.map((student) => {
        const sGrade = student.passedAll ? getGradeLetter(student.percentage) : 'F'
        const sGradeColor = getGradeColor(sGrade)
        const admission = allStudents.find((a) => a.id === student.student.id)
        const showSub = options.showSubExams && hasSubExams

        return (
          <div key={student.student.id} className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] overflow-hidden mb-6 shadow-sm">
            {/* ── MARKSHEET HEADING ── */}
            <div className="text-center pt-3 pb-2 px-5 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold" style={{ color: brand }}>{institution.name}</h2>
              {institution.nameBn && <p className="text-[0.6rem] text-[var(--text-secondary)] mt-0.5">{institution.nameBn}</p>}
              <p className="text-[0.6rem] text-[var(--text-secondary)] mt-0.5">{institution.address}</p>
              <div className="mt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] border-b-2 inline-block pb-0.5" style={{ borderColor: brand }}>Marksheet</h3>
              </div>
              <p className="text-[0.6rem] text-[var(--text-secondary)] mt-0.5">Exam: {examName}</p>
            </div>

            {/* ── STUDENT INFO ── */}
            <div className="mx-4 mb-2 p-2.5 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[0.65rem]">
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Name</span><span className="text-[var(--text-primary)] truncate">{student.student.nameEn}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Roll</span><span className="text-[var(--text-primary)]">{student.student.roll}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Class</span><span className="text-[var(--text-primary)]">{className}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Section</span><span className="text-[var(--text-primary)]">{sectionName}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Student ID</span><span className="text-[var(--text-primary)]">{student.student.id}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Exam</span><span className="text-[var(--text-primary)]">{examName}</span></div>
                    <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Session</span><span className="text-[var(--text-primary)]">{examSession}</span></div>
                  </div>
                  {(options.showFather || options.showMother) && admission && (
                    <div className="grid grid-cols-2 gap-x-5 gap-y-0.5 mt-1.5 pt-1.5 border-t border-[var(--border)] text-[0.65rem]">
                      <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Father</span><span className="text-[var(--text-primary)]">{options.showFather ? (isBn ? admission.fatherNameBn : admission.fatherNameEn || '-') : ''}</span></div>
                      <div className="flex gap-1.5"><span className="font-semibold text-[var(--text-primary)] w-20 shrink-0">Mother</span><span className="text-[var(--text-primary)]">{options.showMother ? (isBn ? admission.motherNameBn : admission.motherNameEn || '-') : ''}</span></div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-[var(--border)]">
                    {options.showClassRank && student.classRank && <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: `${brand}12`, color: brand }}>Class Rank: #{student.classRank}</span>}
                    {options.showSectionRank && student.sectionRank && <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: `${brand}12`, color: brand }}>Section Rank: #{student.sectionRank}</span>}
                    {options.showGpa && <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: `${sGradeColor}18`, color: sGradeColor }}>GPA: {student.gpa.toFixed(1)} ({sGrade})</span>}
                  </div>
                </div>
                {options.showPhoto && (
                  <div className="w-14 h-[4.5rem] rounded flex items-center justify-center flex-shrink-0 border border-dashed" style={{ borderColor: `${brand}30`, background: `${brand}06` }}>
                    {admission?.photo ? (
                      <img src={admission.photo} alt={student.student.nameEn} className="w-14 h-[4.5rem] rounded object-cover" />
                    ) : (
                      <span className="text-[0.55rem] text-[var(--text-muted)] text-center">Photo</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── CLASS/SECTION LABEL ── */}
            <div className="mx-4 mb-1.5 px-2.5 py-1 bg-[var(--bg-primary)] rounded border-l-3" style={{ borderColor: brand }}>
              <span className="text-[0.65rem] font-semibold text-[var(--text-primary)]">Class: {className} — Section: {sectionName}</span>
            </div>

            {/* ── MARKS TABLE ── */}
            <div className="mx-4 mb-2 overflow-x-auto">
              <table className="w-full text-[0.65rem] border border-[var(--border)] rounded-lg overflow-hidden">
                <thead>
                  <tr className="text-[0.6rem] uppercase tracking-wide text-white" style={{ background: brand }}>
                    <th className="text-left px-2 py-1.5 font-semibold">#</th>
                    <th className="text-left px-2 py-1.5 font-semibold">Subject</th>
                    {showSub && <th className="text-center px-1.5 py-1.5 font-semibold">Sub</th>}
                    {showSub && <th className="text-center px-1.5 py-1.5 font-semibold">Full</th>}
                    {showSub && <th className="text-center px-1.5 py-1.5 font-semibold">Obt</th>}
                    <th className="text-center px-2 py-1.5 font-semibold">Total</th>
                    {options.showSubjectHighest && <th className="text-center px-2 py-1.5 font-semibold">High</th>}
                    {options.showSubjectHighest && <th className="text-center px-2 py-1.5 font-semibold">Pos</th>}
                    <th className="text-center px-2 py-1.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {student.subjectMarks.map((sm, idx) => {
                    const stat = subjectStats[sm.subjectId]
                    const rank = stat?.positions[student.student.id] || 0
                    const subExams = sm.subExams || []
                    const hasSub = showSub && subExams.length > 0
                    const bg = idx % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'

                    if (hasSub) {
                      return subExams.map((se, si) => {
                        const seName = isBn ? se.nameBn || se.name : se.name
                        const seObtained = sm.subExamMarks?.[se.id] || 0
                        return (
                          <tr key={`${sm.subjectId}-${se.id}`} style={{ background: bg }}>
                            {si === 0 && <td rowSpan={subExams.length} className="text-center px-2 py-1 font-semibold text-[var(--text-secondary)] border-b border-[var(--border)] align-middle">{idx + 1}</td>}
                            {si === 0 && <td rowSpan={subExams.length} className="text-left px-2 py-1 font-semibold text-[var(--text-primary)] border-b border-[var(--border)] align-middle">{sm.subjectName}</td>}
                            <td className="text-center px-1.5 py-0.5 text-[var(--text-secondary)] border-b border-[var(--border)]/50">{seName}</td>
                            <td className="text-center px-1.5 py-0.5 text-[var(--text-secondary)] border-b border-[var(--border)]/50">{se.fullMarks}</td>
                            <td className="text-center px-1.5 py-0.5 font-medium text-[var(--text-primary)] border-b border-[var(--border)]/50">{seObtained}</td>
                            {si === 0 && <td rowSpan={subExams.length} className="text-center px-2 py-1 font-bold border-b border-[var(--border)] align-middle" style={{ color: brand }}>{sm.obtained}</td>}
                            {options.showSubjectHighest && si === 0 && <td rowSpan={subExams.length} className="text-center px-2 py-1 font-semibold border-b border-[var(--border)] align-middle" style={{ color: stat?.highest === sm.obtained && sm.obtained > 0 ? brand : 'var(--text-primary)' }}>{stat?.highest || 0}</td>}
                            {options.showSubjectHighest && si === 0 && <td rowSpan={subExams.length} className="text-center px-2 py-1 font-semibold border-b border-[var(--border)] align-middle" style={{ color: rank <= 3 && rank > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{rank > 0 ? `#${rank}` : '-'}</td>}
                            {si === 0 && <td rowSpan={subExams.length} className="text-center px-2 py-1 font-semibold border-b border-[var(--border)] align-middle"><span className="px-1 py-0.5 rounded text-[0.55rem] font-bold" style={sm.passed ? { background: '#16a34a18', color: '#16a34a' } : { background: '#ef444418', color: '#ef4444' }}>{sm.passed ? 'Pass' : 'Fail'}</span></td>}
                          </tr>
                        )
                      })
                    }

                    return (
                      <tr key={sm.subjectId} style={{ background: bg }}>
                        <td className="text-center px-2 py-1 font-semibold text-[var(--text-secondary)] border-b border-[var(--border)]">{idx + 1}</td>
                        <td className="text-left px-2 py-1 font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">{sm.subjectName}</td>
                        {showSub && <td className="text-center px-1.5 py-0.5 text-[var(--text-muted)] border-b border-[var(--border)]/50">—</td>}
                        {showSub && <td className="text-center px-1.5 py-0.5 text-[var(--text-muted)] border-b border-[var(--border)]/50">—</td>}
                        {showSub && <td className="text-center px-1.5 py-0.5 text-[var(--text-muted)] border-b border-[var(--border)]/50">—</td>}
                        <td className="text-center px-2 py-1 font-bold border-b border-[var(--border)]" style={{ color: brand }}>{sm.obtained}</td>
                        {options.showSubjectHighest && <td className="text-center px-2 py-1 font-semibold border-b border-[var(--border)]" style={{ color: stat?.highest === sm.obtained && sm.obtained > 0 ? brand : 'var(--text-primary)' }}>{stat?.highest || 0}</td>}
                        {options.showSubjectHighest && <td className="text-center px-2 py-1 font-semibold border-b border-[var(--border)]" style={{ color: rank <= 3 && rank > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{rank > 0 ? `#${rank}` : '-'}</td>}
                        <td className="text-center px-2 py-1 font-semibold border-b border-[var(--border)]"><span className="px-1 py-0.5 rounded text-[0.55rem] font-bold" style={sm.passed ? { background: '#16a34a18', color: '#16a34a' } : { background: '#ef444418', color: '#ef4444' }}>{sm.passed ? 'Pass' : 'Fail'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold" style={{ background: `${brand}08` }}>
                    <td colSpan={2 + (showSub ? 3 : 0)} className="text-right px-2 py-1 text-[var(--text-primary)] border-t-2 text-[0.65rem]" style={{ borderColor: `${brand}40` }}>Total Marks</td>
                    <td className="text-center px-2 py-1 border-t-2 text-xs font-bold" style={{ borderColor: `${brand}40`, color: brand }}>{student.totalObtained}</td>
                    <td className="text-center px-2 py-1 text-[var(--text-secondary)] border-t-2 text-[0.65rem]" style={{ borderColor: `${brand}40` }}>{student.totalFull}</td>
                    {options.showSubjectHighest && <td className="border-t-2" style={{ borderColor: `${brand}40` }}></td>}
                    {options.showSubjectHighest && <td className="border-t-2" style={{ borderColor: `${brand}40` }}></td>}
                    <td className="border-t-2" style={{ borderColor: `${brand}40` }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── LEGEND + QR ── */}
            {(options.showGradeScale || qrMap[student.student.id]) && (
              <div className="mx-4 mb-2 p-2 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border)] flex items-center justify-between gap-3">
                {options.showGradeScale && (
                  <div className="flex flex-wrap gap-1">
                    {gradeScale.map((g) => (
                      <div key={g.letter} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                        <span className="w-4 h-4 rounded flex items-center justify-center text-[0.5rem] font-bold" style={{ background: `${getGradeColor(g.letter)}18`, color: getGradeColor(g.letter) }}>{g.letter}</span>
                        <span className="text-[0.5rem] text-[var(--text-secondary)]">{g.range}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {qrMap[student.student.id] && (
                  <img src={qrMap[student.student.id]} alt="QR Code" className="w-14 h-14 flex-shrink-0" />
                )}
              </div>
            )}

            {/* ── SIGNATURES ── */}
            {options.showSignature && (
              <div className="flex justify-between px-5 py-2 border-t border-[var(--border)]">
                <div className="text-center"><div className="w-24 border-b border-[var(--border)] mb-0.5"></div><span className="text-[0.6rem] text-[var(--text-secondary)]">Director</span></div>
                <div className="text-center"><div className="w-24 border-b border-[var(--border)] mb-0.5"></div><span className="text-[0.6rem] text-[var(--text-secondary)]">Checked By</span></div>
              </div>
            )}
          </div>
        )
      })}

      {/* PDF Modal */}
      {showPdfModal && (
        <MarksheetPDFOptionsModal
          students={enrichedData}
          subjectStats={subjectStats}
          examName={examName}
          examSession={examSession}
          className={className}
          sectionName={sectionName}
          institutionName={institutionName}
          institutionAddress={institutionAddress}
          isBn={isBn}
          onClose={() => setShowPdfModal(false)}
          onDownload={handlePdfDownload}
        />
      )}
    </div>
  )
}
