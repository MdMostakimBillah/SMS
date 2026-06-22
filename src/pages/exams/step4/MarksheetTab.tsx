import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Download, MessageSquare, X, CheckSquare, Square, Search, Send } from 'lucide-react'
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
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [smsSelectedIds, setSmsSelectedIds] = useState<string[]>(enrichedData.map((s) => s.student.id))
  const [smsSearch, setSmsSearch] = useState('')
  const [smsTemplate, setSmsTemplate] = useState<'result' | 'pass' | 'fail' | 'custom'>('result')
  const [customMessage, setCustomMessage] = useState('')
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
        const subjects = s.subjectMarks.map((sm) => `${sm.subjectName}:${sm.obtained}/${sm.fullMarks}`).join('; ')
        const grade = s.passedAll ? getGradeLetter(s.percentage) : 'F'
        const payload = [
          `Name: ${s.student.nameEn}`,
          `ID: ${s.student.id}`,
          `Roll: ${s.student.roll}`,
          `Class: ${className}-${sectionName}`,
          `Exam: ${examName} (${examSession})`,
          `Father: ${admission ? (isBn ? admission.fatherNameBn : admission.fatherNameEn || '-') : '-'}`,
          `Mother: ${admission ? (isBn ? admission.motherNameBn : admission.motherNameEn || '-') : '-'}`,
          `Total: ${s.totalObtained}/${s.totalFull} (${s.percentage.toFixed(1)}%)`,
          `GPA: ${s.gpa.toFixed(1)} [${grade}]`,
          `Rank: ${s.classRank ? '#' + s.classRank : '-'}`,
          `Subjects: ${subjects}`,
        ].join('\n')
        try {
          return { id: s.student.id, url: await QRCode.toDataURL(payload, { width: 512, margin: 3, errorCorrectionLevel: 'H', color: { dark: '#000000', light: '#ffffff' } }) }
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

  const toggleSmsStudent = useCallback((id: string) => {
    setSmsSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }, [])

  const toggleAllSmsStudents = useCallback(() => {
    setSmsSelectedIds((prev) => prev.length === enrichedData.length ? [] : enrichedData.map((s) => s.student.id))
  }, [enrichedData])

  const getSmsMessage = (student: TabulationStudent) => {
    const grade = student.passedAll ? getGradeLetter(student.percentage) : 'F'
    if (smsTemplate === 'pass' && !student.passedAll) return null
    if (smsTemplate === 'fail' && student.passedAll) return null
    if (smsTemplate === 'custom') return customMessage
    return isBn
      ? `প্রিয় অভিভাবক, ${student.student.nameEn} (${className}-${sectionName}, রোল: ${student.student.roll}) ${examName} পরীক্ষায় মোট ${student.totalObtained}/${student.totalFull} নম্বর অর্জন করেছেন (${student.percentage}%।) গ্রেড: ${grade}। - ${institutionName}`
      : `Dear Guardian, ${student.student.nameEn} (${className}-${sectionName}, Roll: ${student.student.roll}) scored ${student.totalObtained}/${student.totalFull} (${student.percentage}%) in ${examName}. Grade: ${grade}. - ${institutionName}`
  }

  const filteredSmsStudents = useMemo(() => {
    if (!smsSearch) return enrichedData
    const q = smsSearch.toLowerCase()
    return enrichedData.filter((s) => s.student.nameEn.toLowerCase().includes(q) || s.student.roll.includes(q))
  }, [enrichedData, smsSearch])

  const handleSendSms = () => {
    const selected = enrichedData.filter((s) => smsSelectedIds.includes(s.student.id))
    const studentsWithPhones = selected.map((s) => {
      const admission = allStudents.find((a) => a.id === s.student.id)
      return { ...s, phone: admission?.phone || admission?.fatherPhone || '' }
    }).filter((s) => s.phone)

    if (studentsWithPhones.length === 0) {
      alert(isBn ? 'কোনো শিক্ষার্থীর ফোন নম্বর পাওয়া যায়নি' : 'No phone numbers found for selected students')
      return
    }

    const messages = studentsWithPhones.map((s) => {
      const msg = getSmsMessage(s)
      if (!msg) return null
      return { phone: s.phone, message: msg, name: s.student.nameEn }
    }).filter(Boolean) as { phone: string; message: string; name: string }[]

    if (messages.length === 0) {
      alert(isBn ? 'কোনো বার্তা তৈরি হয়নি' : 'No messages generated')
      return
    }

    messages.forEach((m, i) => {
      setTimeout(() => {
        const encoded = encodeURIComponent(m.message)
        window.open(`sms:${m.phone}?body=${encoded}`, '_blank')
      }, i * 500)
    })

    alert(isBn
      ? `${messages.length} জন শিক্ষার্থীর কাছে SMS পাঠানো হচ্ছে`
      : `Sending SMS to ${messages.length} student(s)`)
    setShowSmsModal(false)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button onClick={() => setShowSmsModal(true)} className="h-8 px-4 rounded-lg text-xs font-medium text-white transition-all inline-flex items-center gap-1.5" style={{ background: 'var(--green)' }}>
          <MessageSquare size={13} />{isBn ? 'SMS পাঠান' : 'Send SMS'}
        </button>
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
                            <td className="text-center px-1.5 py-0.5 text-[var(--text-secondary)] border-b border-[var(--border)]">{seName}</td>
                            <td className="text-center px-1.5 py-0.5 text-[var(--text-secondary)] border-b border-[var(--border)]">{se.fullMarks}</td>
                            <td className="text-center px-1.5 py-0.5 font-medium text-[var(--text-primary)] border-b border-[var(--border)]">{seObtained}</td>
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
                        {showSub && <td className="text-center px-1.5 py-0.5 text-[var(--text-muted)] border-b border-[var(--border)]">—</td>}
                        {showSub && <td className="text-center px-1.5 py-0.5 text-[var(--text-muted)] border-b border-[var(--border)]">—</td>}
                        {showSub && <td className="text-center px-1.5 py-0.5 text-[var(--text-muted)] border-b border-[var(--border)]">—</td>}
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

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/50" onClick={() => setShowSmsModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] shadow-2xl w-[90%] max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <div>
                <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">{isBn ? 'ফলাফল SMS পাঠান' : 'Send Result SMS'}</h3>
                <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                  {smsSelectedIds.length} {isBn ? 'জন শিক্ষার্থী নির্বাচিত' : 'students selected'} · {examName} · {className}-{sectionName}
                </p>
              </div>
              <button onClick={() => setShowSmsModal(false)} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--bg-secondary)]">
                <X size={15} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Template Selection */}
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] mb-2">{isBn ? 'বার্তার ধরন' : 'Message Type'}</div>
              <div className="flex gap-2">
                {([
                  { id: 'result' as const, label: isBn ? 'সব ফলাফল' : 'All Results', desc: isBn ? 'সব শিক্ষার্থী' : 'All students' },
                  { id: 'pass' as const, label: isBn ? 'শুধু পাস' : 'Pass Only', desc: isBn ? 'শুধুমাত্র পাসকারী' : 'Passed students' },
                  { id: 'fail' as const, label: isBn ? 'শুধু ফেল' : 'Fail Only', desc: isBn ? 'শুধুমাত্র ফেলকারী' : 'Failed students' },
                  { id: 'custom' as const, label: isBn ? 'কাস্টম' : 'Custom', desc: isBn ? 'নিজের বার্তা' : 'Your message' },
                ]).map((t) => (
                  <button key={t.id} onClick={() => setSmsTemplate(t.id)} className="flex-1 p-2 rounded-lg border text-center transition-all" style={{ borderColor: smsTemplate === t.id ? 'var(--brand)' : 'var(--border)', background: smsTemplate === t.id ? 'var(--brand-light)' : 'var(--bg-secondary)', color: smsTemplate === t.id ? 'var(--brand)' : 'var(--text-secondary)' }}>
                    <div className="text-[0.6875rem] font-semibold">{t.label}</div>
                    <div className="text-[0.5625rem] opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
              {smsTemplate === 'custom' && (
                <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder={isBn ? 'আপনার বার্তা লিখুন... (ব্যবহার করুন: {name}, {roll}, {class}, {section}, {exam}, {marks}, {percentage}, {grade})' : 'Type your message... (use: {name}, {roll}, {class}, {section}, {exam}, {marks}, {percentage}, {grade})'} className="mt-2 w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] resize-none h-20" />
              )}
            </div>

            {/* Message Preview */}
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] mb-1">{isBn ? 'বার্তার পূর্বরূপ' : 'Message Preview'}</div>
              <div className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-secondary)] max-h-16 overflow-y-auto leading-relaxed">
                {enrichedData.length > 0 ? getSmsMessage(enrichedData[0]) || (isBn ? 'এই ছাত্র/ছাত্রী জন্য কোনো বার্তা নেই' : 'No message for this student') : '—'}
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-5 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'শিক্ষার্থী নির্বাচন' : 'Select Students'} ({smsSelectedIds.length}/{enrichedData.length})</span>
                  <button onClick={toggleAllSmsStudents} className="text-[0.625rem] px-2 py-0.5 rounded border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand-light)]">
                    {smsSelectedIds.length === enrichedData.length ? (isBn ? 'পরিষ্কার' : 'Deselect') : (isBn ? 'সব' : 'Select All')}
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="text" value={smsSearch} onChange={(e) => setSmsSearch(e.target.value)} placeholder={isBn ? 'শিক্ষার্থী খুঁজুন...' : 'Search students...'} className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1">
                {filteredSmsStudents.map((s) => {
                  const admission = allStudents.find((a) => a.id === s.student.id)
                  const phone = admission?.phone || admission?.fatherPhone || ''
                  const checked = smsSelectedIds.includes(s.student.id)
                  const grade = s.passedAll ? getGradeLetter(s.percentage) : 'F'
                  return (
                    <label key={s.student.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors" style={{ background: checked ? 'var(--brand-light)' : 'transparent', border: `1px solid ${checked ? 'var(--brand)' : 'var(--border)'}` }}>
                      <button onClick={() => toggleSmsStudent(s.student.id)} className="flex-shrink-0">
                        {checked ? <CheckSquare size={16} className="text-[var(--brand)]" /> : <Square size={16} className="text-[var(--text-muted)]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.75rem] font-medium text-[var(--text-primary)] truncate">{s.student.nameEn}</div>
                        <div className="text-[0.625rem] text-[var(--text-muted)]">Roll: {s.student.roll} · {s.totalObtained}/{s.totalFull} ({s.percentage}%) · {grade}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[0.625rem] text-[var(--text-muted)]">{phone || (isBn ? 'ফোন নেই' : 'No phone')}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--border)] flex justify-end gap-2">
              <button onClick={() => setShowSmsModal(false)} className="px-4 py-2 rounded-lg text-[0.75rem] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSendSms} disabled={smsSelectedIds.length === 0} className="px-4 py-2 rounded-lg text-[0.75rem] font-medium text-white inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--green)' }}>
                <Send size={13} />{isBn ? `SMS পাঠান (${smsSelectedIds.length})` : `Send SMS (${smsSelectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
