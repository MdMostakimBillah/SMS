import { getBrandColor } from '@/lib/pdf'

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
}

export interface TabulationPdfOptions {
  selectedCols: string[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
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

export function generateTabulationPDF(
  rows: TabulationStudentRow[],
  opts: TabulationPdfOptions & { examName?: string; className?: string; sectionName?: string }
): string {
  if (!rows || rows.length === 0) return '<p>No data</p>'

  const brand = getBrandColor()
  const darkBg = '#1e293b'
  const isBn = opts.isBn
  const cols = opts.selectedCols || []
  const orientation = opts.orientation || 'landscape'

  const tdBase = `border:1.5px solid #cbd5e1;padding:5px 6px;font-size:10px;text-align:center;white-space:nowrap`
  const tdName = `border:1.5px solid #cbd5e1;border-left:2.5px solid ${brand};padding:5px 6px;font-size:10px;white-space:nowrap;text-align:left`

  const subjectHeaders = rows[0].subjectMarks.map((s) => s.subjectName || '')
  const fullMarksList = rows[0].subjectMarks.map((s) => s.fullMarks)

  // Build column definitions: key → { th, td for each row }
  interface ColDef { key: string; width: string; th: string }
  const allCols: ColDef[] = []

  // Fixed columns
  allCols.push({ key: '__sn', width: '28px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">#</th>` })
  allCols.push({ key: '__name', width: '120px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:left;white-space:nowrap">${isBn ? 'নাম' : 'Name'}</th>` })

  if (cols.includes('roll')) {
    allCols.push({ key: 'roll', width: '42px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">${isBn ? 'রোল' : 'Roll'}</th>` })
  }

  // Subject columns
  subjectHeaders.forEach((h, idx) => {
    const fm = fullMarksList[idx]
    allCols.push({
      key: `subj_${idx}`,
      width: '52px',
      th: `<th style="padding:7px 4px;background:${darkBg};color:#fff;font-weight:700;font-size:9px;border:2px solid ${brand};text-align:center;white-space:nowrap"><div>${h}</div><div style="font-size:8px;font-weight:400;opacity:0.7">/${fm}</div></th>`,
    })
  })

  // Summary columns
  if (cols.includes('obtained')) allCols.push({ key: 'obtained', width: '50px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">${isBn ? 'প্রাপ্ত' : 'Obtained'}</th>` })
  if (cols.includes('avg')) allCols.push({ key: 'avg', width: '38px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">${isBn ? 'গড়' : 'Avg'}</th>` })
  if (cols.includes('percentage')) allCols.push({ key: 'pct', width: '38px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">%</th>` })
  if (cols.includes('gpa')) allCols.push({ key: 'gpa', width: '36px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">GPA</th>` })
  if (cols.includes('classRank')) allCols.push({ key: 'classRank', width: '56px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">${isBn ? 'ক্লাস র‍্যাঙ্ক' : 'Class Rank'}</th>` })
  if (cols.includes('sectionRank')) allCols.push({ key: 'secRank', width: '52px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">${isBn ? 'সে. র‍্যাঙ্ক' : 'Sec Rank'}</th>` })
  if (cols.includes('result')) allCols.push({ key: 'result', width: '44px', th: `<th style="padding:7px 5px;background:${darkBg};color:#fff;font-weight:700;font-size:10px;border:2px solid ${brand};text-align:center;white-space:nowrap">${isBn ? 'ফলাফল' : 'Result'}</th>` })

  // Build table rows
  const tableRows = rows
    .map((row, i) => {
      const cells: string[] = []
      // SN
      cells.push(`<td style="${tdBase};font-weight:600;color:#64748b">${i + 1}</td>`)
      // Name
      cells.push(`<td style="${tdName};font-weight:500">${isBn ? row.student.nameBn : row.student.nameEn}</td>`)
      // Roll
      if (cols.includes('roll')) cells.push(`<td style="${tdBase};color:#64748b">${row.student.roll || ''}</td>`)
      // Subjects
      row.subjectMarks.forEach((s) => {
        const failStyle = !s.passed ? 'color:#ef4444;font-weight:700;background:#fef2f2;' : ''
        cells.push(`<td style="${tdBase};${failStyle}">${s.obtained}</td>`)
      })
      // Summary
      if (cols.includes('obtained')) cells.push(`<td style="${tdBase};font-weight:700;background:#eff6ff;color:${brand};font-size:11px">${row.totalObtained}</td>`)
      if (cols.includes('avg')) cells.push(`<td style="${tdBase};color:${brand};font-weight:700">${row.avgMark}</td>`)
      if (cols.includes('percentage')) cells.push(`<td style="${tdBase};color:#64748b;font-weight:500">${row.percentage}%</td>`)
      if (cols.includes('gpa')) cells.push(`<td style="${tdBase};font-weight:700;color:${brand};font-size:11px">${row.gpa}</td>`)
      if (cols.includes('classRank')) cells.push(`<td style="${tdBase};${row.classRank <= 3 ? 'background:#fef3c7;color:#92400e;font-weight:700' : 'color:#64748b;font-weight:600'}">${row.classRank}</td>`)
      if (cols.includes('sectionRank')) cells.push(`<td style="${tdBase};${row.sectionRank <= 3 ? 'background:#dcfce7;color:#166534;font-weight:700' : 'color:#64748b;font-weight:600'}">${row.sectionRank}</td>`)
      if (cols.includes('result')) cells.push(`<td style="${tdBase};font-weight:700;${row.passedAll ? 'color:#166534;background:#dcfce7' : 'color:#ef4444;background:#fef2f2'}">${row.passedAll ? (isBn ? 'পাস' : 'PASS') : (isBn ? 'ফেল' : 'FAIL')}</td>`)

      return `<tr style="page-break-inside:avoid;${i % 2 === 0 ? '' : 'background:#f8fafc'}">${cells.join('')}</tr>`
    })
    .join('')

  const headerRow = allCols.map((c) => c.th).join('')
  const colGroup = allCols.map((c) => `<col style="width:${c.width}">`).join('')

  const examLabel = opts.examName || ''
  const classLabel = opts.className || ''
  const sectionLabel = opts.sectionName || ''
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
      <h1>${isBn ? 'ট্যাবুলেশন শিট' : 'Tabulation Sheet'}</h1>
      <p class="subtitle">${isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}: ${academicYear}</p>
      <div class="info">
        ${examLabel ? `<span>${isBn ? 'পরীক্ষা' : 'Exam'}: ${examLabel}</span>` : ''}
        ${classLabel ? `<span>${isBn ? 'শ্রেণি' : 'Class'}: ${classLabel}</span>` : ''}
        ${sectionLabel ? `<span>${isBn ? 'সেকশন' : 'Section'}: ${sectionLabel}</span>` : ''}
        <span>${isBn ? 'মোট ছাত্র' : 'Students'}: ${rows.length}</span>
      </div>
    </div>
    <table><colgroup>${colGroup}</colgroup><thead><tr>${headerRow}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer"><span class="brand">SMS EduTech</span><span>${isBn ? 'তৈরি করা হয়েছে' : 'Generated'}: ${new Date().toLocaleString()}</span></div>
  </body></html>`
}
