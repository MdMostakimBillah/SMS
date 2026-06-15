import type { TabulationStudent } from './MarksheetTab'
import type { MarksheetOptions } from './MarksheetTab'
import { getBrandColor } from '@/lib/pdf'

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

export function generateMarksheetPDF(
  students: TabulationStudent[],
  subjectStats: Record<string, { highest: number; positions: Record<string, number> }>,
  opts: {
    orientation: 'portrait' | 'landscape'
    isBn: boolean
    examName: string
    examSession: string
    className: string
    sectionName: string
    institutionName: string
    institutionAddress: string
    options: MarksheetOptions
  }
): string {
  const color = getBrandColor()
  const { orientation, isBn, examName, examSession, className, sectionName, institutionName, institutionAddress, options } = opts

  const pages = students.map((student) => {
    const sGrade = student.passedAll ? getGradeLetter(student.percentage) : 'F'
    const sGradeColor = getGradeColor(sGrade)
    const showSub = options.showSubExams

    // Build table rows with sub-exam nesting
    const examRows = student.subjectMarks.map((sm, idx) => {
      const stat = subjectStats[sm.subjectId]
      const rank = stat?.positions[student.student.id] || 0
      const status = sm.passed ? 'Pass' : 'Fail'
      const statusColor = sm.passed ? '#16a34a' : '#ef4444'
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
      const subExams = sm.subExams || []
      const hasSub = showSub && subExams.length > 0

      const highestCells = options.showSubjectHighest
        ? `<td style="padding:7px 10px;text-align:center;font-size:0.75rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:${stat?.highest === sm.obtained && sm.obtained > 0 ? color : '#374151'};">${stat?.highest || 0}</td>
           <td style="padding:7px 10px;text-align:center;font-size:0.75rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:${rank <= 3 && rank > 0 ? '#f59e0b' : '#374151'};">${rank > 0 ? `#${rank}` : '-'}</td>`
        : ''

      if (hasSub) {
        return subExams.map((se, si) => {
          const seName = isBn ? se.nameBn || se.name : se.name
          const seObtained = sm.subExamMarks?.[se.id] || 0
          const isLast = si === subExams.length - 1
          const bottomBorder = isLast ? '2px solid #e5e7eb' : '1px solid #f0f0f0'
          return `<tr style="background:${bg};">
            ${si === 0 ? `<td rowspan="${subExams.length}" style="padding:7px 10px;text-align:center;font-size:0.75rem;border-bottom:${bottomBorder};color:#6b7280;vertical-align:middle;">${idx + 1}</td>` : ''}
            ${si === 0 ? `<td rowspan="${subExams.length}" style="padding:7px 10px;font-size:0.75rem;font-weight:600;border-bottom:${bottomBorder};color:#1e293b;vertical-align:middle;">${sm.subjectName || ''}</td>` : ''}
            <td style="padding:5px 10px;text-align:center;font-size:0.7rem;border-bottom:1px solid #f0f0f0;color:#6b7280;">${seName}</td>
            <td style="padding:5px 10px;text-align:center;font-size:0.7rem;border-bottom:1px solid #f0f0f0;color:#6b7280;">${se.fullMarks}</td>
            <td style="padding:5px 10px;text-align:center;font-size:0.75rem;border-bottom:1px solid #f0f0f0;font-weight:500;color:#1e293b;">${seObtained}</td>
            ${si === 0 ? `<td rowspan="${subExams.length}" style="padding:7px 10px;text-align:center;font-size:0.8rem;font-weight:700;border-bottom:${bottomBorder};color:${color};vertical-align:middle;">${sm.obtained}</td>` : ''}
            ${options.showSubjectHighest && si === 0 ? `<td rowspan="${subExams.length}" style="padding:7px 10px;text-align:center;font-size:0.75rem;font-weight:600;border-bottom:${bottomBorder};color:${stat?.highest === sm.obtained && sm.obtained > 0 ? color : '#374151'};vertical-align:middle;">${stat?.highest || 0}</td>` : ''}
            ${options.showSubjectHighest && si === 0 ? `<td rowspan="${subExams.length}" style="padding:7px 10px;text-align:center;font-size:0.75rem;font-weight:600;border-bottom:${bottomBorder};color:${rank <= 3 && rank > 0 ? '#f59e0b' : '#374151'};vertical-align:middle;">${rank > 0 ? `#${rank}` : '-'}</td>` : ''}
            ${si === 0 ? `<td rowspan="${subExams.length}" style="padding:7px 10px;text-align:center;font-size:0.75rem;font-weight:600;border-bottom:${bottomBorder};color:${statusColor};vertical-align:middle;">${status}</td>` : ''}
          </tr>`
        }).join('')
      }

      return `<tr style="background:${bg};">
        <td style="padding:7px 10px;text-align:center;font-size:0.75rem;border-bottom:1px solid #e5e7eb;color:#6b7280;">${idx + 1}</td>
        <td style="padding:7px 10px;font-size:0.75rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:#1e293b;">${sm.subjectName || ''}</td>
        ${showSub ? '<td style="padding:5px 10px;text-align:center;font-size:0.7rem;border-bottom:1px solid #e5e7eb;color:#9ca3af;">—</td>' : ''}
        ${showSub ? '<td style="padding:5px 10px;text-align:center;font-size:0.7rem;border-bottom:1px solid #e5e7eb;color:#9ca3af;">—</td>' : ''}
        ${showSub ? '<td style="padding:5px 10px;text-align:center;font-size:0.7rem;border-bottom:1px solid #e5e7eb;color:#9ca3af;">—</td>' : ''}
        <td style="padding:7px 10px;text-align:center;font-size:0.75rem;border-bottom:1px solid #e5e7eb;font-weight:700;color:${color};">${sm.obtained}</td>
        ${highestCells}
        <td style="padding:7px 10px;text-align:center;font-size:0.75rem;border-bottom:1px solid #e5e7eb;font-weight:600;color:${statusColor};">${status}</td>
      </tr>`
    }).join('')

    const photoSection = options.showPhoto
      ? student.student.photo
        ? `<img src="${student.student.photo}" style="width:80px;height:96px;border-radius:6px;object-fit:cover;border:1px solid #e5e7eb;flex-shrink:0;" />`
        : `<div style="width:80px;height:96px;border-radius:6px;border:1.5px dashed ${color}30;display:flex;align-items:center;justify-content:center;background:${color}06;flex-shrink:0;">
            <span style="font-size:0.55rem;color:#9ca3af;">Photo</span>
          </div>`
      : ''

    const fatherRow = options.showFather
      ? `<div><span style="font-weight:600;color:#1e293b;width:56px;display:inline-block;">Father</span> <span style="color:#1e293b;">${isBn ? student.student.fatherNameBn : student.student.fatherNameEn || '-'}</span></div>`
      : ''
    const motherRow = options.showMother
      ? `<div><span style="font-weight:600;color:#1e293b;width:56px;display:inline-block;">Mother</span> <span style="color:#1e293b;">${isBn ? student.student.motherNameBn : student.student.motherNameEn || '-'}</span></div>`
      : ''

    const rankBadges = (options.showClassRank || options.showSectionRank)
      ? `<span style="font-size:0.65rem;font-weight:600;padding:2px 6px;border-radius:3px;background:${color}12;color:${color};white-space:nowrap;">Class Rank: #${student.classRank}</span>
          ${options.showSectionRank && student.sectionRank ? `<span style="font-size:0.65rem;font-weight:600;padding:2px 6px;border-radius:3px;background:${color}12;color:${color};white-space:nowrap;">Section Rank: #${student.sectionRank}</span>` : ''}`
      : ''

    const gpaBadge = options.showGpa
      ? `<span style="font-size:0.65rem;font-weight:600;padding:2px 6px;border-radius:3px;background:${sGradeColor}18;color:${sGradeColor};white-space:nowrap;">GPA: ${student.gpa.toFixed(1)} (${sGrade})</span>`
      : ''

    const gradeScaleSection = options.showGradeScale
      ? `<div style="margin-top:12px;padding:8px 12px;background:#f8fafc;border-radius:5px;border:1px solid #e2e8f0;">
          <div style="display:flex;flex-wrap:wrap;gap:5px;">
            ${gradeScale.map((g) => `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:white;border-radius:3px;border:1px solid #e5e7eb;font-size:0.6rem;">
              <span style="width:16px;height:16px;border-radius:3px;background:${getGradeColor(g.letter)}18;color:${getGradeColor(g.letter)};display:flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:700;">${g.letter}</span>
              <span style="color:#6b7280;">${g.range}%</span>
            </span>`).join('')}
          </div>
        </div>`
      : ''

    const signatureSection = options.showSignature
      ? `<div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb;">
          <div style="text-align:center;"><div style="width:90px;border-bottom:1px solid #94a3b8;margin-bottom:3px;"></div><span style="font-size:0.6rem;color:#6b7280;">Director</span></div>
          <div style="text-align:center;"><div style="width:90px;border-bottom:1px solid #94a3b8;margin-bottom:3px;"></div><span style="font-size:0.6rem;color:#6b7280;">Checked By</span></div>
        </div>`
      : ''

    const subExamHeader = showSub ? '<th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ' + color + ';text-align:center;">Sub Exam</th><th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ' + color + ';text-align:center;">Full</th><th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ' + color + ';text-align:center;">Obtain</th>' : ''
    const highestCol = options.showSubjectHighest ? '<th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ' + color + ';text-align:center;">Highest</th><th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ' + color + ';text-align:center;">Position</th>' : ''
    const highestTd = options.showSubjectHighest ? '<td style="border-top:2px solid ' + color + ';"></td><td style="border-top:2px solid ' + color + ';"></td>' : ''

    const totalColspan = 2 + (showSub ? 3 : 0)

    return `
      <div class="marksheet-page">
        <div style="text-align:center;margin-bottom:10px;">
          <h1 style="font-size:1rem;font-weight:700;color:${color};margin:0;">${institutionName}</h1>
          <p style="font-size:0.6rem;color:#6b7280;margin:1px 0 0 0;">${institutionAddress}</p>
          <div style="width:35px;height:2px;background:${color};border-radius:2px;margin:5px auto;"></div>
          <h2 style="font-size:0.8rem;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;margin:0;">Marksheet</h2>
          <p style="font-size:0.6rem;color:#6b7280;margin:2px 0 0 0;">Exam: ${examName}</p>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:10px 14px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 24px;font-size:0.7rem;">
              <div style="display:flex;gap:8px;"><span style="font-weight:600;color:#1e293b;width:56px;">Name</span><span style="color:#1e293b;">${student.student.nameEn}</span></div>
              <div style="display:flex;gap:8px;"><span style="font-weight:600;color:#1e293b;width:56px;">Roll No.</span><span style="color:#1e293b;">${student.student.roll}</span></div>
              <div style="display:flex;gap:8px;"><span style="font-weight:600;color:#1e293b;width:56px;">Class</span><span style="color:#1e293b;">${className}</span></div>
              <div style="display:flex;gap:8px;"><span style="font-weight:600;color:#1e293b;width:56px;">Section</span><span style="color:#1e293b;">${sectionName}</span></div>
              <div style="display:flex;gap:8px;"><span style="font-weight:600;color:#1e293b;width:68px;">Student ID</span><span style="color:#1e293b;">${student.student.id}</span></div>
              <div style="display:flex;gap:8px;"><span style="font-weight:600;color:#1e293b;width:56px;">Exam</span><span style="color:#1e293b;">${examName}</span></div>
              <div style="display:flex;gap:8px;"><span style="font-weight:600;color:#1e293b;width:56px;">Session</span><span style="color:#1e293b;">${examSession}</span></div>
            </div>
            ${(options.showFather || options.showMother) ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 24px;font-size:0.7rem;margin-top:6px;padding-top:6px;border-top:1px solid #e5e7eb;">${fatherRow}${motherRow}</div>` : ''}
            ${(rankBadges || gpaBadge) ? `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;padding-top:6px;border-top:1px solid #e5e7eb;flex-wrap:wrap;">${rankBadges}${gpaBadge}</div>` : ''}
          </div>
          ${photoSection}
        </div>

        <div style="padding:5px 10px;background:white;border-left:3px solid ${color};border-radius:0 3px 3px 0;margin-bottom:8px;font-size:0.7rem;font-weight:600;color:#1e293b;">
          Class: ${className} — Section: ${sectionName}
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <thead>
              <tr style="background:${color};">
                <th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">#</th>
                <th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:left;">Subject Name</th>
                ${subExamHeader}
                <th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">Total</th>
                ${highestCol}
                <th style="padding:6px 10px;font-size:0.6rem;font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>${examRows}</tbody>
            <tfoot>
              <tr style="background:${color}08;font-weight:700;">
                <td colspan="${totalColspan}" style="padding:8px 10px;font-size:0.75rem;color:#1e293b;border-top:2px solid ${color};text-align:right;">Total Marks</td>
                <td style="padding:8px 10px;text-align:center;font-size:0.85rem;color:${color};font-weight:700;border-top:2px solid ${color};">${student.totalObtained}</td>
                <td style="padding:8px 10px;text-align:center;font-size:0.75rem;color:#374151;border-top:2px solid ${color};">${student.totalFull}</td>
                ${highestTd}
                <td style="border-top:2px solid ${color};"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        ${gradeScaleSection}
        ${signatureSection}
      </div>
    `
  })

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    @page { size: A4 ${orientation}; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .marksheet-page { page-break-after: always; }
    .marksheet-page:last-child { page-break-after: auto; }
    @media print { body { margin: 0; } .marksheet-page { page-break-after: always; } .marksheet-page:last-child { page-break-after: auto; } }
  </style></head><body>
    ${pages.join('\n')}
  </body></html>`
}
