import { useState, useMemo, useRef } from 'react'
import {
  Award,
  Download,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import { sectionCls, sectionTitleCls, btnPrimary } from '@/lib/styles'
import { downloadHTML } from '@/lib/pdf'
import type { ExtraMarkEntry, ExtraMarkType, MarkAdjustment } from '@/store/examStore'

interface Student {
  id: string
  nameEn: string
  nameBn?: string
  class?: string
  section?: string
  roll?: string
}

interface SubjectMark {
  subjectId: string
  subjectName?: string
  fullMarks: number
  passMarks: number
  obtained: number
  grade: string
  passed: boolean
}

interface TabulationRow {
  student: Student
  subjectMarks: SubjectMark[]
  totalObtained: number
  totalFull: number
  percentage: number
  passedAll: boolean
  gpa: number
}

interface EnrichedRow extends TabulationRow {
  adjustmentMarks: number
  adjustedTotal: number
  adjustedPercentage: number
  adjustedGpa: number
  classRank: number
  sectionRank: number
  avgMark: number
  totalFullMarks: number
}

interface Props {
  enrichedData: EnrichedRow[]
  extraMarks: ExtraMarkEntry[]
  extraMarkTypes: ExtraMarkType[]
  markAdjustments: MarkAdjustment[]
  examName: string
  className: string
  sectionName: string
  institutionName: string
  institutionNameBn: string
  institutionAddress: string
  isBn: boolean
}

function getGpaColor(gpa: number): string {
  if (gpa >= 5.0) return '#15803d'
  if (gpa >= 4.0) return '#2563eb'
  if (gpa >= 3.5) return '#7c3aed'
  if (gpa >= 3.0) return '#d97706'
  if (gpa >= 2.0) return '#ea580c'
  if (gpa >= 1.0) return '#dc2626'
  return '#9ca3af'
}

function getGradeBg(gpa: number): string {
  if (gpa >= 4.0) return '#dcfce7'
  if (gpa >= 2.0) return '#dbeafe'
  return '#fee2e2'
}

export function MarksheetTab({
  enrichedData,
  extraMarks,
  extraMarkTypes,
  markAdjustments,
  examName,
  className,
  sectionName,
  institutionName,
  institutionNameBn,
  institutionAddress,
  isBn,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const marksheetRef = useRef<HTMLDivElement>(null)

  const sorted = useMemo(
    () => [...enrichedData].sort((a, b) => (a.student.roll || '').localeCompare(b.student.roll || '')),
    [enrichedData]
  )

  const current = sorted[selectedIdx]

  // Extra marks breakdown for current student
  const extraBreakdown = useMemo(() => {
    if (!current) return []
    const activeTypes = extraMarkTypes.filter((t) => t.isActive)
    return activeTypes.map((type) => {
      const entries = extraMarks.filter(
        (e) => e.examId && e.studentId === current.student.id && e.typeId === type.id
      )
      const obtained = entries.reduce((sum, e) => sum + e.marks, 0)
      return {
        name: isBn ? type.nameBn : type.name,
        obtained,
        maxMarks: type.defaultMaxMarks,
        percentage: type.percentage,
      }
    })
  }, [current, extraMarks, extraMarkTypes, isBn])

  // Adjustment data for current student
  const adjustment = useMemo(() => {
    if (!current) return null
    return markAdjustments.find((a) => a.studentId === current.student.id) || null
  }, [current, markAdjustments])

  const goPrev = () => setSelectedIdx((i) => Math.max(0, i - 1))
  const goNext = () => setSelectedIdx((i) => Math.min(sorted.length - 1, i + 1))

  const handleDownload = () => {
    if (!current) return
    const el = marksheetRef.current
    if (!el) return

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Marksheet - ${current.student.nameEn}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
  .marksheet { max-width: 700px; margin: 0 auto; border: 2px solid #1a1a1a; padding: 24px; }
  .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
  .school-name { font-size: 18px; font-weight: 700; color: #1a1a1a; }
  .school-name-bn { font-size: 14px; font-weight: 600; color: #444; }
  .school-addr { font-size: 11px; color: #666; margin-top: 2px; }
  .exam-title { font-size: 13px; font-weight: 600; margin-top: 8px; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; }
  .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 16px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
  .info-row { display: flex; gap: 8px; font-size: 11px; }
  .info-label { font-weight: 600; color: #475569; min-width: 80px; }
  .info-value { color: #1a1a1a; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: center; font-size: 11px; }
  th { background: #f1f5f9; font-weight: 600; color: #334155; }
  td { color: #1a1a1a; }
  .pass { color: #15803d; font-weight: 600; }
  .fail { color: #dc2626; font-weight: 600; }
  .total-row { background: #f1f5f9; font-weight: 700; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
  .summary-card { text-align: center; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; }
  .summary-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
  .summary-value { font-size: 16px; font-weight: 700; margin-top: 2px; }
  .gpa-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 13px; }
  .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
  .signature { text-align: center; }
  .signature-line { width: 120px; border-top: 1px solid #1a1a1a; margin-top: 40px; padding-top: 4px; font-size: 10px; color: #475569; }
</style>
</head>
<body>
<div class="marksheet">
  <div class="header">
    <div class="school-name">${institutionName}</div>
    <div class="school-name-bn">${institutionNameBn}</div>
    <div class="school-addr">${institutionAddress}</div>
    <div class="exam-title">${isBn ? 'পরীক্ষার ফলাফল শিট' : 'Exam Result Marksheet'} — ${examName}</div>
  </div>

  <div class="student-info">
    <div class="info-row"><span class="info-label">${isBn ? 'নাম' : 'Name'}:</span><span class="info-value">${isBn ? current.student.nameBn || current.student.nameEn : current.student.nameEn}</span></div>
    <div class="info-row"><span class="info-label">${isBn ? 'রোল' : 'Roll'}:</span><span class="info-value">${current.student.roll || '-'}</span></div>
    <div class="info-row"><span class="info-label">${isBn ? 'শ্রেণি' : 'Class'}:</span><span class="info-value">${className}</span></div>
    <div class="info-row"><span class="info-label">${isBn ? 'সেকশন' : 'Section'}:</span><span class="info-value">${sectionName}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th style="text-align:left">${isBn ? 'বিষয়' : 'Subject'}</th>
        <th>${isBn ? 'পূর্ণমান' : 'Full'}</th>
        <th>${isBn ? 'প্রাপ্তমান' : 'Obtained'}</th>
        <th>${isBn ? 'গ্রেড' : 'Grade'}</th>
        <th>${isBn ? 'স্ট্যাটাস' : 'Status'}</th>
      </tr>
    </thead>
    <tbody>
      ${current.subjectMarks.map((sm, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align:left;font-weight:500">${sm.subjectName}</td>
        <td>${sm.fullMarks}</td>
        <td style="font-weight:600">${sm.obtained}</td>
        <td>${sm.grade}</td>
        <td class="${sm.passed ? 'pass' : 'fail'}">${sm.passed ? (isBn ? 'পাস' : 'Pass') : (isBn ? 'ফেইল' : 'Fail')}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td colspan="2" style="text-align:left">${isBn ? 'মোট' : 'Total'}</td>
        <td>${current.totalFull}</td>
        <td>${current.totalObtained}</td>
        <td colspan="2">${current.percentage}%</td>
      </tr>
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-label">${isBn ? 'মোট প্রাপ্ত' : 'Total Obtained'}</div>
      <div class="summary-value" style="color:#2563eb">${current.totalObtained}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">${isBn ? 'শতাংশ' : 'Percentage'}</div>
      <div class="summary-value" style="color:#d97706">${current.percentage}%</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">${isBn ? 'জিপিএ' : 'GPA'}</div>
      <div class="summary-value gpa-badge" style="background:${getGradeBg(current.gpa)};color:${getGpaColor(current.gpa)}">${current.gpa.toFixed(1)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">${isBn ? 'অবস্থা' : 'Status'}</div>
      <div class="summary-value ${current.passedAll ? 'pass' : 'fail'}">${current.passedAll ? (isBn ? 'পাস' : 'PASS') : (isBn ? 'ফেইল' : 'FAIL')}</div>
    </div>
  </div>

  ${adjustment ? `
  <div style="margin-bottom:12px;padding:8px;border:1px solid #e2e8f0;border-radius:6px;background:#fefce8;">
    <div style="font-size:11px;font-weight:600;color:#92400e;margin-bottom:4px">${isBn ? 'এডজাস্টমেন্ট' : 'Adjustment'}: +${adjustment.adjustmentMarks} ${isBn ? 'মার্ক' : 'marks'}</div>
  </div>` : ''}

  <div class="footer">
    <div class="signature">
      <div class="signature-line">${isBn ? 'প্রধান শিক্ষক' : 'Headmaster'}</div>
    </div>
    <div class="signature">
      <div class="signature-line">${isBn ? 'শিক্ষক' : 'Class Teacher'}</div>
    </div>
    <div class="signature">
      <div class="signature-line">${isBn ? 'অভিভাবক' : 'Guardian'}</div>
    </div>
  </div>
</div>
</body>
</html>`

    downloadHTML(`marksheet_${current.student.nameEn.replace(/\s+/g, '_')}.html`, html)
  }

  if (sorted.length === 0) {
    return (
      <div className={`${sectionCls} text-center py-10`}>
        <GraduationCap size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn ? 'প্রথমে পরীক্ষা, শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select exam, class and section to view marksheets'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Navigation bar */}
      <div className="flex items-center justify-between mb-3">
        <div className={sectionTitleCls}>
          <GraduationCap size={15} className="text-[var(--brand)]" />
          {isBn ? 'মার্কশিট' : 'Marksheet'}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} disabled={selectedIdx === 0} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
            <ChevronLeft size={14} />
          </button>
          <span className="text-[0.6875rem] font-medium text-[var(--text-secondary)] min-w-[6rem] text-center">
            {selectedIdx + 1} / {sorted.length}
          </span>
          <button onClick={goNext} disabled={selectedIdx === sorted.length - 1} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
            <ChevronRight size={14} />
          </button>
          <button onClick={handleDownload} className={`${btnPrimary} text-[0.625rem] ml-2`}>
            <Download size={12} />
            {isBn ? 'ডাউনলোড' : 'Download'}
          </button>
        </div>
      </div>

      {/* Marksheet card */}
      {current && (
        <div ref={marksheetRef} className={`${sectionCls} !p-0 overflow-hidden`}>
          {/* School Header */}
          <div className="text-center py-4 px-6 border-b-2 border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="text-[1.125rem] font-bold text-[var(--text-primary)]">
              {institutionName}
            </div>
            <div className="text-[0.8125rem] font-semibold text-[var(--text-secondary)]">
              {institutionNameBn}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
              {institutionAddress}
            </div>
            <div className="text-[0.75rem] font-semibold text-[var(--brand)] mt-2 uppercase tracking-wide">
              {isBn ? 'পরীক্ষার ফলাফল শিট' : 'Exam Result Marksheet'} — {examName}
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-[var(--bg-primary)] border-b border-[var(--border)]">
            <div>
              <span className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'নাম' : 'Name'}</span>
              <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {isBn ? current.student.nameBn || current.student.nameEn : current.student.nameEn}
              </div>
            </div>
            <div>
              <span className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'রোল' : 'Roll'}</span>
              <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {current.student.roll || '-'}
              </div>
            </div>
            <div>
              <span className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'শ্রেণি' : 'Class'}</span>
              <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {className}
              </div>
            </div>
            <div>
              <span className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'সেকশন' : 'Section'}</span>
              <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {sectionName}
              </div>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="px-6 py-4">
            <table className="w-full text-[0.6875rem]">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b-2 border-[var(--border)]">
                  <th className="p-2 text-center w-8">#</th>
                  <th className="p-2 text-left font-semibold text-[var(--text-primary)]">{isBn ? 'বিষয়' : 'Subject'}</th>
                  <th className="p-2 text-center font-semibold text-[var(--text-muted)]">{isBn ? 'পূর্ণমান' : 'Full Marks'}</th>
                  <th className="p-2 text-center font-semibold text-[var(--text-muted)]">{isBn ? 'প্রাপ্তমান' : 'Obtained'}</th>
                  <th className="p-2 text-center font-semibold text-[var(--text-muted)]">{isBn ? 'গ্রেড' : 'Grade'}</th>
                  <th className="p-2 text-center font-semibold text-[var(--text-muted)]">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {current.subjectMarks.map((sm, i) => (
                  <tr key={sm.subjectId} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="p-2 text-center text-[var(--text-muted)]">{i + 1}</td>
                    <td className="p-2 text-left font-medium text-[var(--text-primary)]">{sm.subjectName}</td>
                    <td className="p-2 text-center text-[var(--text-secondary)]">{sm.fullMarks}</td>
                    <td className="p-2 text-center font-bold text-[var(--text-primary)]">{sm.obtained}</td>
                    <td className="p-2 text-center">
                      <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded" style={{ background: getGradeBg(current.gpa), color: getGpaColor(current.gpa) }}>
                        {sm.grade}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`text-[0.625rem] font-medium px-2 py-0.5 rounded ${sm.passed ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                        {sm.passed ? (isBn ? 'পাস' : 'Pass') : (isBn ? 'ফেইল' : 'Fail')}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-[var(--bg-secondary)] border-t-2 border-[var(--border)] font-bold">
                  <td colSpan={2} className="p-2 text-left text-[var(--text-primary)]">{isBn ? 'মোট' : 'Total'}</td>
                  <td className="p-2 text-center text-[var(--text-primary)]">{current.totalFull}</td>
                  <td className="p-2 text-center text-[var(--brand)]">{current.totalObtained}</td>
                  <td colSpan={2} className="p-2 text-center text-[var(--text-primary)]">{current.percentage}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Extra Marks Breakdown */}
          {extraBreakdown.length > 0 && extraBreakdown.some((e) => e.obtained > 0) && (
            <div className="px-6 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Award size={12} className="text-[var(--amber)]" />
                <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'এক্সট্রা মার্কস' : 'Extra Marks'}
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {extraBreakdown.filter((e) => e.obtained > 0).map((e, i) => (
                  <div key={i} className="p-2 rounded-lg bg-[var(--amber-light)] border border-[rgba(245,158,11,0.2)] text-center">
                    <div className="text-[0.5625rem] text-[var(--amber)] font-medium">{e.name}</div>
                    <div className="text-[0.8125rem] font-bold text-[var(--amber)]">{e.obtained}/{e.maxMarks}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide mb-1">{isBn ? 'মোট প্রাপ্ত' : 'Total Obtained'}</div>
                <div className="text-[1.125rem] font-bold text-[var(--brand)]">{current.totalObtained}</div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide mb-1">{isBn ? 'শতাংশ' : 'Percentage'}</div>
                <div className="text-[1.125rem] font-bold text-[var(--amber)]">{current.percentage}%</div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide mb-1">{isBn ? 'জিপিএ' : 'GPA'}</div>
                <div
                  className="text-[1.125rem] font-bold px-2 py-0.5 rounded inline-block"
                  style={{ background: getGradeBg(current.gpa), color: getGpaColor(current.gpa) }}
                >
                  {current.gpa.toFixed(1)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide mb-1">{isBn ? 'অবস্থা' : 'Status'}</div>
                <div className={`text-[0.875rem] font-bold ${current.passedAll ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                  {current.passedAll ? (isBn ? 'পাস' : 'PASS') : (isBn ? 'ফেইল' : 'FAIL')}
                </div>
              </div>
            </div>
          </div>

          {/* Ranks */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'ক্লাস র‍্যাঙ্ক' : 'Class Rank'}</div>
                <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                  #{current.classRank}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'সেকশন র‍্যাঙ্ক' : 'Section Rank'}</div>
                <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                  #{current.sectionRank}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                <div className="text-[0.5625rem] text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'গড় মার্ক' : 'Avg Mark'}</div>
                <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                  {current.avgMark}
                </div>
              </div>
            </div>
          </div>

          {/* Signature area */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-[var(--border)]">
              <div className="text-center">
                <div className="w-24 border-t border-[var(--text-primary)] mx-auto mt-10" />
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-1">{isBn ? 'প্রধান শিক্ষক' : 'Headmaster'}</div>
              </div>
              <div className="text-center">
                <div className="w-24 border-t border-[var(--text-primary)] mx-auto mt-10" />
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-1">{isBn ? 'শিক্ষক' : 'Class Teacher'}</div>
              </div>
              <div className="text-center">
                <div className="w-24 border-t border-[var(--text-primary)] mx-auto mt-10" />
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-1">{isBn ? 'অভিভাবক' : 'Guardian'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
