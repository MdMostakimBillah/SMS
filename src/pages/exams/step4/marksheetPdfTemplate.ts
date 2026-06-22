import QRCode from 'qrcode'
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

interface FontSizeConfig {
  headerName: string
  headerAddress: string
  headerTitle: string
  headerExam: string
  dividerWidth: string
  dividerMargin: string
  headerMarginBottom: string
  cardPadding: string
  cardMarginBottom: string
  cardGap: string
  cardFontSize: string
  cardLabelWidth: string
  cardFatherGap: string
  badgeFontSize: string
  photoW: string
  photoH: string
  photoRadius: string
  photoFont: string
  labelPadding: string
  labelMarginBottom: string
  labelFontSize: string
  tableFontSize: string
  thPadding: string
  thFontSize: string
  tdPadding: string
  tdFontSize: string
  tdSubFontSize: string
  tdSubPadding: string
  tdObtainedFontSize: string
  footerPadding: string
  footerFontSize: string
  footerTotalFontSize: string
  gradeBadgeW: string
  gradeBadgeH: string
  gradeBadgeFontSize: string
  gradeBadgeLetterFontSize: string
  gradeItemGap: string
  gradeItemPadding: string
  gradeItemFontSize: string
  qrSize: string
  bottomPadding: string
  bottomMargin: string
  sigWidth: string
  sigFont: string
  sigMargin: string
  pageMargin: string
}

const fontSizes: Record<'default' | 'compact', FontSizeConfig> = {
  default: {
    headerName: '1rem',
    headerAddress: '0.65rem',
    headerTitle: '0.8rem',
    headerExam: '0.65rem',
    dividerWidth: '35px',
    dividerMargin: '5px',
    headerMarginBottom: '10px',
    cardPadding: '10px 14px',
    cardMarginBottom: '8px',
    cardGap: '12px',
    cardFontSize: '0.7rem',
    cardLabelWidth: '80px',
    cardFatherGap: '5px',
    badgeFontSize: '0.65rem',
    photoW: '80px',
    photoH: '96px',
    photoRadius: '6px',
    photoFont: '0.55rem',
    labelPadding: '5px 10px',
    labelMarginBottom: '6px',
    labelFontSize: '0.7rem',
    tableFontSize: '0.75rem',
    thPadding: '6px 10px',
    thFontSize: '0.6rem',
    tdPadding: '7px 10px',
    tdFontSize: '0.75rem',
    tdSubFontSize: '0.7rem',
    tdSubPadding: '5px 10px',
    tdObtainedFontSize: '0.8rem',
    footerPadding: '8px 10px',
    footerFontSize: '0.75rem',
    footerTotalFontSize: '0.85rem',
    gradeBadgeW: '16px',
    gradeBadgeH: '16px',
    gradeBadgeFontSize: '0.55rem',
    gradeBadgeLetterFontSize: '0.55rem',
    gradeItemGap: '5px',
    gradeItemPadding: '2px 6px',
    gradeItemFontSize: '0.6rem',
    qrSize: '56px',
    bottomPadding: '6px 8px',
    bottomMargin: '8px',
    sigWidth: '90px',
    sigFont: '0.6rem',
    sigMargin: '3px',
    pageMargin: '10mm',
  },
  compact: {
    headerName: '0.85rem',
    headerAddress: '0.55rem',
    headerTitle: '0.7rem',
    headerExam: '0.55rem',
    dividerWidth: '30px',
    dividerMargin: '3px',
    headerMarginBottom: '6px',
    cardPadding: '7px 10px',
    cardMarginBottom: '6px',
    cardGap: '10px',
    cardFontSize: '0.6rem',
    cardLabelWidth: '68px',
    cardFatherGap: '3px',
    badgeFontSize: '0.55rem',
    photoW: '60px',
    photoH: '72px',
    photoRadius: '4px',
    photoFont: '0.5rem',
    labelPadding: '3px 8px',
    labelMarginBottom: '5px',
    labelFontSize: '0.6rem',
    tableFontSize: '0.65rem',
    thPadding: '4px 6px',
    thFontSize: '0.55rem',
    tdPadding: '4px 6px',
    tdFontSize: '0.65rem',
    tdSubFontSize: '0.6rem',
    tdSubPadding: '3px 6px',
    tdObtainedFontSize: '0.7rem',
    footerPadding: '5px 6px',
    footerFontSize: '0.65rem',
    footerTotalFontSize: '0.75rem',
    gradeBadgeW: '14px',
    gradeBadgeH: '14px',
    gradeBadgeFontSize: '0.5rem',
    gradeBadgeLetterFontSize: '0.5rem',
    gradeItemGap: '3px',
    gradeItemPadding: '1px 4px',
    gradeItemFontSize: '0.55rem',
    qrSize: '48px',
    bottomPadding: '6px 8px',
    bottomMargin: '6px',
    sigWidth: '80px',
    sigFont: '0.55rem',
    sigMargin: '2px',
    pageMargin: '8mm',
  },
}

export async function generateMarksheetPDF(
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
): Promise<string> {
  const color = getBrandColor()
  const { orientation, isBn, examName, examSession, className, sectionName, institutionName, institutionAddress, options } = opts
  const f = fontSizes[options.fontSize || 'default']

  // Generate QR codes for all students
  const qrMap: Record<string, string> = {}
  await Promise.all(
    students.map(async (s) => {
      const subjects = s.subjectMarks.map((sm) => `${sm.subjectName}:${sm.obtained}/${sm.fullMarks}`).join('; ')
      const grade = s.passedAll ? getGradeLetter(s.percentage) : 'F'
      const payload = [
        `Name: ${s.student.nameEn}`,
        `ID: ${s.student.id}`,
        `Roll: ${s.student.roll}`,
        `Class: ${className}-${sectionName}`,
        `Exam: ${examName} (${examSession})`,
        `Father: ${isBn ? s.student.fatherNameBn : s.student.fatherNameEn || '-'}`,
        `Mother: ${isBn ? s.student.motherNameBn : s.student.motherNameEn || '-'}`,
        `Total: ${s.totalObtained}/${s.totalFull} (${s.percentage.toFixed(1)}%)`,
        `GPA: ${s.gpa.toFixed(1)} [${grade}]`,
        `Rank: ${s.classRank ? '#' + s.classRank : '-'}`,
        `Subjects: ${subjects}`,
      ].join('\n')
      try {
        qrMap[s.student.id] = await QRCode.toDataURL(payload, { width: 512, margin: 3, errorCorrectionLevel: 'H', color: { dark: '#000000', light: '#ffffff' } })
      } catch {
        qrMap[s.student.id] = ''
      }
    })
  )

  const pages = students.map((student) => {
    const sGrade = student.passedAll ? getGradeLetter(student.percentage) : 'F'
    const sGradeColor = getGradeColor(sGrade)
    const showSub = options.showSubExams
    const qrImg = qrMap[student.student.id]

    // Build table rows
    const examRows = student.subjectMarks.map((sm, idx) => {
      const stat = subjectStats[sm.subjectId]
      const rank = stat?.positions[student.student.id] || 0
      const status = sm.passed ? 'Pass' : 'Fail'
      const statusColor = sm.passed ? '#16a34a' : '#ef4444'
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
      const subExams = sm.subExams || []
      const hasSub = showSub && subExams.length > 0

      const highestCells = options.showSubjectHighest
        ? `<td style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};border-bottom:1px solid #94a3b8;font-weight:600;color:${stat?.highest === sm.obtained && sm.obtained > 0 ? color : '#374151'};">${stat?.highest || 0}</td>
           <td style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};border-bottom:1px solid #94a3b8;font-weight:600;color:${rank <= 3 && rank > 0 ? '#f59e0b' : '#374151'};">${rank > 0 ? `#${rank}` : '-'}</td>`
        : ''

      if (hasSub) {
        return subExams.map((se, si) => {
          const seName = isBn ? se.nameBn || se.name : se.name
          const seObtained = sm.subExamMarks?.[se.id] || 0
          return `<tr style="background:${bg};">
            ${si === 0 ? `<td rowspan="${subExams.length}" style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};border-bottom:1px solid #cbd5e1;color:#6b7280;vertical-align:middle;">${idx + 1}</td>` : ''}
            ${si === 0 ? `<td rowspan="${subExams.length}" style="padding:${f.tdPadding};font-size:${f.tdFontSize};font-weight:600;border-bottom:1px solid #cbd5e1;color:#1e293b;vertical-align:middle;">${sm.subjectName || ''}</td>` : ''}
            <td style="padding:${f.tdSubPadding};text-align:center;font-size:${f.tdSubFontSize};border-bottom:1px solid #cbd5e1;color:#6b7280;">${seName}</td>
            <td style="padding:${f.tdSubPadding};text-align:center;font-size:${f.tdSubFontSize};border-bottom:1px solid #cbd5e1;color:#6b7280;">${se.fullMarks}</td>
            <td style="padding:${f.tdSubPadding};text-align:center;font-size:${f.tdFontSize};border-bottom:1px solid #cbd5e1;font-weight:500;color:#1e293b;">${seObtained}</td>
            ${si === 0 ? `<td rowspan="${subExams.length}" style="padding:${f.tdPadding};text-align:center;font-size:${f.tdObtainedFontSize};font-weight:700;border-bottom:1px solid #cbd5e1;color:${color};vertical-align:middle;">${sm.obtained}</td>` : ''}
            ${options.showSubjectHighest && si === 0 ? `<td rowspan="${subExams.length}" style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};font-weight:600;border-bottom:1px solid #cbd5e1;color:${stat?.highest === sm.obtained && sm.obtained > 0 ? color : '#374151'};vertical-align:middle;">${stat?.highest || 0}</td>` : ''}
            ${options.showSubjectHighest && si === 0 ? `<td rowspan="${subExams.length}" style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};font-weight:600;border-bottom:1px solid #cbd5e1;color:${rank <= 3 && rank > 0 ? '#f59e0b' : '#374151'};vertical-align:middle;">${rank > 0 ? `#${rank}` : '-'}</td>` : ''}
            ${si === 0 ? `<td rowspan="${subExams.length}" style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};font-weight:600;border-bottom:1px solid #cbd5e1;color:${statusColor};vertical-align:middle;">${status}</td>` : ''}
          </tr>`
        }).join('')
      }

      return `<tr style="background:${bg};">
        <td style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};border-bottom:1px solid #94a3b8;color:#6b7280;">${idx + 1}</td>
        <td style="padding:${f.tdPadding};font-size:${f.tdFontSize};border-bottom:1px solid #94a3b8;font-weight:600;color:#1e293b;">${sm.subjectName || ''}</td>
        ${showSub ? `<td style="padding:${f.tdSubPadding};text-align:center;font-size:${f.tdSubFontSize};border-bottom:1px solid #94a3b8;color:#9ca3af;">—</td>` : ''}
        ${showSub ? `<td style="padding:${f.tdSubPadding};text-align:center;font-size:${f.tdSubFontSize};border-bottom:1px solid #94a3b8;color:#9ca3af;">—</td>` : ''}
        ${showSub ? `<td style="padding:${f.tdSubPadding};text-align:center;font-size:${f.tdSubFontSize};border-bottom:1px solid #94a3b8;color:#9ca3af;">—</td>` : ''}
        <td style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};border-bottom:1px solid #94a3b8;font-weight:700;color:${color};">${sm.obtained}</td>
        ${highestCells}
        <td style="padding:${f.tdPadding};text-align:center;font-size:${f.tdFontSize};border-bottom:1px solid #94a3b8;font-weight:600;color:${statusColor};">${status}</td>
      </tr>`
    }).join('')

    const photoHtml = options.showPhoto
      ? student.student.photo
        ? `<img src="${student.student.photo}" style="width:${f.photoW};height:${f.photoH};border-radius:${f.photoRadius};object-fit:cover;border:1px solid #94a3b8;flex-shrink:0;" />`
        : `<div style="width:${f.photoW};height:${f.photoH};border-radius:${f.photoRadius};border:1.5px dashed ${color}30;display:flex;align-items:center;justify-content:center;background:${color}06;flex-shrink:0;">
            <span style="font-size:${f.photoFont};color:#9ca3af;">Photo</span>
          </div>`
      : ''

    const subExamHeader = showSub
      ? `<th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">Sub</th>
         <th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">Full</th>
         <th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">Obt</th>`
      : ''
    const highestCol = options.showSubjectHighest
      ? `<th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">High</th>
         <th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">Pos</th>`
      : ''
    const highestTd = options.showSubjectHighest ? `<td style="border-top:2px solid ${color};"></td><td style="border-top:2px solid ${color};"></td>` : ''
    const totalColspan = 2 + (showSub ? 3 : 0)

    // Grade scale + QR side by side
    const gradeScaleHtml = options.showGradeScale
      ? `<div style="display:flex;flex-wrap:wrap;gap:${f.gradeItemGap};">
            ${gradeScale.map((g) => `<span style="display:inline-flex;align-items:center;gap:2px;padding:${f.gradeItemPadding};background:white;border-radius:2px;border:1px solid #94a3b8;font-size:${f.gradeItemFontSize};">
              <span style="width:${f.gradeBadgeW};height:${f.gradeBadgeH};border-radius:2px;background:${getGradeColor(g.letter)}18;color:${getGradeColor(g.letter)};display:flex;align-items:center;justify-content:center;font-size:${f.gradeBadgeLetterFontSize};font-weight:700;">${g.letter}</span>
              <span style="color:#6b7280;">${g.range}%</span>
            </span>`).join('')}
          </div>`
      : ''

    const qrHtml = qrImg ? `<img src="${qrImg}" style="width:${f.qrSize};height:${f.qrSize};flex-shrink:0;" />` : ''

    const bottomRow = (options.showGradeScale || qrImg)
      ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:${f.bottomMargin};padding:${f.bottomPadding};background:#f8fafc;border-radius:4px;border:1px solid #e2e8f0;gap:8px;">
          <div style="flex:1;min-width:0;">${gradeScaleHtml}</div>
          ${qrHtml ? `<div style="flex-shrink:0;">${qrHtml}</div>` : ''}
        </div>`
      : ''

    const signatureSection = options.showSignature
      ? `<div style="display:flex;justify-content:space-between;margin-top:${f.bottomMargin};padding-top:${f.bottomMargin};border-top:1px solid #94a3b8;">
          <div style="text-align:center;"><div style="width:${f.sigWidth};border-bottom:1px solid #94a3b8;margin-bottom:${f.sigMargin};"></div><span style="font-size:${f.sigFont};color:#6b7280;">Director</span></div>
          <div style="text-align:center;"><div style="width:${f.sigWidth};border-bottom:1px solid #94a3b8;margin-bottom:${f.sigMargin};"></div><span style="font-size:${f.sigFont};color:#6b7280;">Checked By</span></div>
        </div>`
      : ''

    return `
      <div class="marksheet-page">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:${f.headerMarginBottom};">
          <h1 style="font-size:${f.headerName};font-weight:700;color:${color};margin:0;">${institutionName}</h1>
          <p style="font-size:${f.headerAddress};color:#6b7280;margin:1px 0 0 0;">${institutionAddress}</p>
          <h2 style="font-size:${f.headerTitle};font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0 0;">Marksheet</h2>
          <div style="width:${f.dividerWidth};height:2px;background:${color};border-radius:2px;margin:${f.dividerMargin} auto;"></div>
          <p style="font-size:${f.headerExam};color:#6b7280;margin:2px 0 0 0;">Exam: ${examName}</p>
        </div>

        <!-- Student Info Card -->
        <div style="padding:${f.cardPadding};background:#f8fafc;border-radius:5px;border:1px solid #e2e8f0;margin-bottom:${f.cardMarginBottom};">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:${f.cardGap};">
            <div style="flex:1;min-width:0;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;font-size:${f.cardFontSize};">
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Name</span><span style="color:#1e293b;">${student.student.nameEn}</span></div>
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Roll</span><span style="color:#1e293b;">${student.student.roll}</span></div>
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Class</span><span style="color:#1e293b;">${className}</span></div>
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Section</span><span style="color:#1e293b;">${sectionName}</span></div>
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Student ID</span><span style="color:#1e293b;">${student.student.id}</span></div>
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Exam</span><span style="color:#1e293b;">${examName}</span></div>
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Session</span><span style="color:#1e293b;">${examSession}</span></div>
              </div>
              ${(options.showFather || options.showMother) ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;font-size:${f.cardFontSize};margin-top:${f.cardFatherGap};padding-top:${f.cardFatherGap};border-top:1px solid #94a3b8;">
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Father</span><span style="color:#1e293b;">${options.showFather ? (isBn ? student.student.fatherNameBn : student.student.fatherNameEn || '-') : ''}</span></div>
                <div style="display:flex;gap:6px;"><span style="font-weight:600;color:#1e293b;width:${f.cardLabelWidth};flex-shrink:0;">Mother</span><span style="color:#1e293b;">${options.showMother ? (isBn ? student.student.motherNameBn : student.student.motherNameEn || '-') : ''}</span></div>
              </div>` : ''}
              <div style="display:flex;align-items:center;gap:6px;margin-top:${f.cardFatherGap};padding-top:${f.cardFatherGap};border-top:1px solid #94a3b8;flex-wrap:wrap;">
                ${options.showClassRank && student.classRank ? `<span style="font-size:${f.badgeFontSize};font-weight:600;padding:2px 6px;border-radius:3px;background:${color}12;color:${color};white-space:nowrap;">Class Rank: #${student.classRank}</span>` : ''}
                ${options.showSectionRank && student.sectionRank ? `<span style="font-size:${f.badgeFontSize};font-weight:600;padding:2px 6px;border-radius:3px;background:${color}12;color:${color};white-space:nowrap;">Section Rank: #${student.sectionRank}</span>` : ''}
                ${options.showGpa ? `<span style="font-size:${f.badgeFontSize};font-weight:600;padding:2px 6px;border-radius:3px;background:${sGradeColor}18;color:${sGradeColor};white-space:nowrap;">GPA: ${student.gpa.toFixed(1)} (${sGrade})</span>` : ''}
              </div>
            </div>
            <div style="flex-shrink:0;">${photoHtml}</div>
          </div>
        </div>

        <!-- Class/Section Label -->
        <div style="padding:${f.labelPadding};background:white;border-left:3px solid ${color};border-radius:0 3px 3px 0;margin-bottom:${f.labelMarginBottom};font-size:${f.labelFontSize};font-weight:600;color:#1e293b;">
          Class: ${className} — Section: ${sectionName}
        </div>

        <!-- Marks Table -->
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #94a3b8;border-radius:4px;overflow:hidden;">
            <thead>
              <tr style="background:${color};">
                <th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">#</th>
                <th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:left;">Subject</th>
                ${subExamHeader}
                <th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">Total</th>
                ${highestCol}
                <th style="padding:${f.thPadding};font-size:${f.thFontSize};font-weight:600;color:white;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${color};text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>${examRows}</tbody>
            <tfoot>
              <tr style="background:${color}08;font-weight:700;">
                <td colspan="${totalColspan}" style="padding:${f.footerPadding};font-size:${f.footerFontSize};color:#1e293b;border-top:2px solid ${color};text-align:right;">Total Marks</td>
                <td style="padding:${f.footerPadding};text-align:center;font-size:${f.footerTotalFontSize};color:${color};font-weight:700;border-top:2px solid ${color};">${student.totalObtained}</td>
                <td style="padding:${f.footerPadding};text-align:center;font-size:${f.footerFontSize};color:#374151;border-top:2px solid ${color};">${student.totalFull}</td>
                ${highestTd}
                <td style="border-top:2px solid ${color};"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Legend + QR -->
        ${bottomRow}
        ${signatureSection}
      </div>
    `
  })

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    @page { size: A4 ${orientation}; margin: ${f.pageMargin}; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .marksheet-page { page-break-after: always; }
    .marksheet-page:last-child { page-break-after: auto; }
    @media print { body { margin: 0; } .marksheet-page { page-break-after: always; } .marksheet-page:last-child { page-break-after: auto; } }
  </style></head><body>
    ${pages.join('\n')}
  </body></html>`
}
