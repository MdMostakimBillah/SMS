import { getBrandColor } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { escapeHtml } from '@/lib/sanitize'

export interface TabulationStudentRow {
  student: { id: string; nameEn: string; nameBn: string; roll?: string; academicYear?: string }
  subjectMarks: { subjectName?: string; fullMarks: number; obtained: number; passed: boolean }[]
  totalObtained: number
  totalFullMarks: number
  avgMark: number
  percentage: number
  gpa: number
  classRank: number
  sectionRank: number
  passedAll: boolean
  adjustmentMarks?: number
  adjustedTotal?: number
  adjustedPercentage?: number
  adjustedGpa?: number
}

export interface TabulationPdfOptions {
  selectedCols: string[]
  selectedSubjects?: number[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
  rotateHeaders?: boolean
  institutionName?: string
}

export const ALL_TABULATION_PDF_COLUMNS = [
  { key: 'roll', label: 'Roll', labelBn: 'রোল', default: true },
  { key: 'obtained', label: 'Obtained', labelBn: 'প্রাপ্ত', default: true },
  { key: 'avg', label: 'Avg', labelBn: 'গড়', default: true },
  { key: 'percentage', label: '%', labelBn: '%', default: true },
  { key: 'gpa', label: 'GPA', labelBn: 'জিপিএ', default: true },
  { key: 'classRank', label: 'Class Rank', labelBn: 'ক্লাস র‍্যাঙ্ক', default: true },
  { key: 'sectionRank', label: 'Sec Rank', labelBn: 'সেকশন র‍্যাঙ্ক', default: true },
  { key: 'result', label: 'Result', labelBn: 'ফলাফল', default: true },
]

function rotatedTh(label: string, brand: string, darkBg: string): string {
  return `<th style="padding:0;background:${darkBg};color:#fff;font-weight:700;font-size:9px;border:2px solid ${brand};text-align:center;white-space:nowrap;height:auto;vertical-align:bottom">
    <div style="display:flex;align-items:flex-end;justify-content:center;padding:6px 0">
      <span style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;font-size:9px;font-weight:700;letter-spacing:0.02em">${label}</span>
    </div>
  </th>`
}

function rotatedThSubject(name: string, fullMarks: number, brand: string, darkBg: string): string {
  return `<th style="padding:0;background:${darkBg};color:#fff;font-weight:700;font-size:9px;border:2px solid ${brand};text-align:center;white-space:nowrap;height:auto;vertical-align:bottom">
    <div style="display:flex;align-items:flex-end;justify-content:center;padding:6px 0">
      <span style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;font-size:8px;font-weight:700;letter-spacing:0.02em">${name} (${fullMarks})</span>
    </div>
  </th>`
}

function normalTh(label: string, brand: string, darkBg: string, align = 'center'): string {
  return `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:${align};white-space:nowrap">${label}</th>`
}

function normalThSubject(name: string, fullMarks: number, brand: string, darkBg: string): string {
  return `<th style="padding:7px 4px;background:${darkBg};color:#fff;font-weight:700;font-size:9px;border:2px solid ${brand};text-align:center;white-space:nowrap"><div>${name}</div><div style="font-size:8px;font-weight:400;opacity:0.7">/${fullMarks}</div></th>`
}

export function generateTabulationPDF(
  rows: TabulationStudentRow[],
  opts: TabulationPdfOptions & { examName?: string; className?: string; sectionName?: string }
): string {
  if (!rows || rows.length === 0) return '<p>No data</p>'

  const brand = getBrandColor()
  const darkBg = '#1e293b'
  const isBn = opts.isBn
  const cols = opts.selectedCols || []
  const selectedSubjects = opts.selectedSubjects
  const orientation = opts.orientation || 'landscape'
  const rotate = opts.rotateHeaders ?? false

  // Filter subjects based on selection
  const filterSubjects = (marks: { subjectName?: string; fullMarks: number; obtained: number; passed: boolean }[]) => {
    if (!selectedSubjects || selectedSubjects.length === 0) return marks
    return marks.filter((_, idx) => selectedSubjects.includes(idx))
  }

  const tdBase = `border:1.5px solid #94a3b8;padding:5px 6px;font-size:10px;text-align:center;white-space:nowrap`
  const tdName = `border:1.5px solid #94a3b8;border-left:2.5px solid ${brand};padding:5px 6px;font-size:10px;white-space:nowrap;text-align:left`

  const filteredFirstRow = filterSubjects(rows[0].subjectMarks)
  const subjectHeaders = filteredFirstRow.map((s) => s.subjectName || '')
  const fullMarksList = filteredFirstRow.map((s) => s.fullMarks)

  interface ColDef { key: string; width: string; th: string }
  const allCols: ColDef[] = []

  const thFn = rotate
    ? (label: string) => rotatedTh(label, brand, darkBg)
    : (label: string) => normalTh(label, brand, darkBg)

  // Fixed columns
  allCols.push({ key: '__sn', width: rotate ? '26px' : '28px', th: rotate ? rotatedTh('#', brand, darkBg) : normalTh('#', brand, darkBg) })
  allCols.push({ key: '__name', width: rotate ? '26px' : '120px', th: rotate ? rotatedTh(isBn ? 'নাম' : 'Name', brand, darkBg) : normalTh(isBn ? 'নাম' : 'Name', brand, darkBg, 'left') })

  if (cols.includes('roll')) {
    allCols.push({ key: 'roll', width: rotate ? '26px' : '42px', th: thFn(isBn ? 'রোল' : 'Roll') })
  }

  // Subject columns
  subjectHeaders.forEach((h, idx) => {
    const fm = fullMarksList[idx]
    allCols.push({
      key: `subj_${idx}`,
      width: rotate ? '28px' : '52px',
      th: rotate ? rotatedThSubject(h, fm, brand, darkBg) : normalThSubject(h, fm, brand, darkBg),
    })
  })

  // Summary columns
  if (cols.includes('obtained')) allCols.push({ key: 'obtained', width: rotate ? '30px' : '50px', th: thFn(isBn ? 'প্রাপ্ত' : 'Obt') })
  if (cols.includes('avg')) allCols.push({ key: 'avg', width: rotate ? '26px' : '38px', th: thFn(isBn ? 'গড়' : 'Avg') })
  if (cols.includes('percentage')) allCols.push({ key: 'pct', width: rotate ? '26px' : '38px', th: thFn('%') })
  if (cols.includes('gpa')) allCols.push({ key: 'gpa', width: rotate ? '26px' : '36px', th: thFn('GPA') })
  if (cols.includes('classRank')) allCols.push({ key: 'classRank', width: rotate ? '30px' : '56px', th: thFn(isBn ? 'ক্লাস' : 'CRank') })
  if (cols.includes('sectionRank')) allCols.push({ key: 'secRank', width: rotate ? '30px' : '52px', th: thFn(isBn ? 'সেকশন' : 'SRank') })
  if (cols.includes('result')) allCols.push({ key: 'result', width: rotate ? '28px' : '44px', th: thFn(isBn ? 'ফলাফল' : 'Status') })

  // Build table rows
  const tableRows = rows
    .map((row, i) => {
      const cells: string[] = []
      cells.push(`<td style="${tdBase};font-weight:600;color:#64748b">${i + 1}</td>`)
      cells.push(`<td style="${tdName};font-weight:500">${escapeHtml(isBn ? row.student.nameBn : row.student.nameEn)}</td>`)
      if (cols.includes('roll')) cells.push(`<td style="${tdBase};color:#64748b">${row.student.roll || ''}</td>`)
      filterSubjects(row.subjectMarks).forEach((s) => {
        const failStyle = !s.passed ? 'color:#ef4444;font-weight:700;background:#fef2f2;' : ''
        cells.push(`<td style="${tdBase};${failStyle}">${s.obtained}</td>`)
      })
      if (cols.includes('obtained')) {
        const val = row.adjustedTotal ?? row.totalObtained
        const adjNote = row.adjustmentMarks ? ` <span style="font-size:7px;color:${brand}">adj</span>` : ''
        cells.push(`<td style="${tdBase};font-weight:700;background:#eff6ff;color:${brand};font-size:11px">${val}${adjNote}</td>`)
      }
      if (cols.includes('avg')) cells.push(`<td style="${tdBase};color:${brand};font-weight:700">${row.avgMark}</td>`)
      if (cols.includes('percentage')) cells.push(`<td style="${tdBase};color:#64748b;font-weight:500">${row.adjustedPercentage ?? row.percentage}%</td>`)
      if (cols.includes('gpa')) cells.push(`<td style="${tdBase};font-weight:700;color:${brand};font-size:11px">${(row.adjustedGpa ?? row.gpa).toFixed(1)}</td>`)
      if (cols.includes('classRank')) cells.push(`<td style="${tdBase};${row.classRank <= 3 ? 'background:#fef3c7;color:#92400e;font-weight:700' : 'color:#64748b;font-weight:600'}">${row.classRank}</td>`)
      if (cols.includes('sectionRank')) cells.push(`<td style="${tdBase};${row.sectionRank <= 3 ? 'background:#dcfce7;color:#166534;font-weight:700' : 'color:#64748b;font-weight:600'}">${row.sectionRank}</td>`)
      if (cols.includes('result')) cells.push(`<td style="${tdBase};font-weight:700;${row.passedAll ? 'color:#166534;background:#dcfce7' : 'color:#ef4444;background:#fef2f2'}">${row.passedAll ? (isBn ? 'পাস' : 'PASS') : (isBn ? 'ফেল' : 'FAIL')}</td>`)

      return `<tr style="page-break-inside:avoid;${i % 2 === 0 ? '' : 'background:#f8fafc'}">${cells.join('')}</tr>`
    })
    .join('')

  const headerRow = allCols.map((c) => c.th).join('')
  const colGroup = allCols.map((c) => `<col style="width:${c.width}">`).join('')

  const examLabel = escapeHtml(opts.examName || '')
  const classLabel = escapeHtml(opts.className || '')
  const sectionLabel = escapeHtml(opts.sectionName || '')
  const academicYear = rows[0]?.student?.academicYear || ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Tabulation</title><style>
    @page{size:${orientation};margin:5mm}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;background:#fff;font-size:10px}
    .header{text-align:center;margin-bottom:12px;padding-bottom:8px;border-bottom:3px solid ${brand}}
    .header h1{font-size:18px;color:${darkBg};letter-spacing:1.5px;text-transform:uppercase;font-weight:800}
    .header .subtitle{font-size:11px;color:#64748b;margin-top:3px;font-weight:500}
    .header .info{display:flex;justify-content:center;gap:12px;margin-top:6px;font-size:9px;color:#64748b}
    .header .info span{background:#f1f5f9;padding:2px 10px;border-radius:20px;border:1px solid #e2e8f0;font-weight:500}
    table{width:100%;border-collapse:collapse;border:2px solid ${brand};table-layout:fixed}
    colgroup col{overflow:hidden}
    thead{overflow:visible}
    th{position:sticky;top:0;z-index:1;overflow:hidden;text-overflow:ellipsis}
    td{overflow:hidden;text-overflow:ellipsis}
    tr:nth-child(even){background:#f8fafc}
    .footer{margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#94a3b8;border-top:2px solid ${brand};padding-top:5px}
    .footer .brand{color:${brand};font-weight:700;font-size:9px}
    @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}tr{page-break-inside:avoid}th,td{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;overflow:visible}}
  </style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:4px">
        ${pdfLogoHTML(getPDFBranding(), 36)}
        <h1 style="font-size:18px;color:${darkBg};letter-spacing:1.5px;text-transform:uppercase;font-weight:800;margin:0">${isBn ? 'ট্যাবুলেশন শিট' : 'Tabulation Sheet'}</h1>
      </div>
      <p class="subtitle">${isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}: ${escapeHtml(academicYear)}</p>
      <div class="info">
        ${examLabel ? `<span>${isBn ? 'পরীক্ষা' : 'Exam'}: ${examLabel}</span>` : ''}
        ${classLabel ? `<span>${isBn ? 'শ্রেণি' : 'Class'}: ${classLabel}</span>` : ''}
        ${sectionLabel ? `<span>${isBn ? 'সেকশন' : 'Section'}: ${sectionLabel}</span>` : ''}
        <span>${isBn ? 'মোট ছাত্র' : 'Students'}: ${rows.length}</span>
      </div>
    </div>
    <table><colgroup>${colGroup}</colgroup><thead><tr>${headerRow}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer"><span class="brand" style="font-size:7px;color:#999">Powered by EduTech</span><span>${isBn ? 'তৈরি করা হয়েছে' : 'Generated'}: ${new Date().toLocaleString()}</span></div>
  </body></html>`
}
