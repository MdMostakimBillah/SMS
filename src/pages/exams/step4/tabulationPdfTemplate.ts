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

  const tdBorder = `border:1.5px solid #cbd5e1;padding:6px 8px;font-size:11px;text-align:center`
  const tdBorderLeft = `border:1.5px solid #cbd5e1;border-left:2.5px solid ${brand};padding:6px 8px;font-size:11px`

  const headers = rows[0].subjectMarks.map((s) => s.subjectName || '')
  const fullMarksList = rows[0].subjectMarks.map((s) => s.fullMarks)

  const tableRows = rows
    .map((row, i) => {
      const cells = row.subjectMarks
        .map((s) => {
          const failStyle = !s.passed ? 'color:#ef4444;font-weight:700;background:#fef2f2;' : ''
          return `<td style="${tdBorder};text-align:center;${failStyle}">${s.obtained}</td>`
        })
        .join('')

      const rollCell = cols.includes('roll') ? `<td style="${tdBorder};color:#64748b">${row.student.roll || ''}</td>` : ''
      const obtainedCell = cols.includes('obtained') ? `<td style="${tdBorder};font-weight:700;background:#eff6ff;color:${brand};font-size:12px">${row.totalObtained}</td>` : ''
      const avgCell = cols.includes('avg') ? `<td style="${tdBorder};color:${brand};font-weight:700">${row.avgMark}</td>` : ''
      const pctCell = cols.includes('percentage') ? `<td style="${tdBorder};color:#64748b;font-weight:500">${row.percentage}%</td>` : ''
      const gpaCell = cols.includes('gpa') ? `<td style="${tdBorder};font-weight:700;color:${brand};font-size:12px">${row.gpa}</td>` : ''
      const classRankCell = cols.includes('classRank') ? `<td style="${tdBorder};${row.classRank <= 3 ? 'background:#fef3c7;color:#92400e;font-weight:700' : 'color:#64748b;font-weight:600'}">${row.classRank}</td>` : ''
      const secRankCell = cols.includes('sectionRank') ? `<td style="${tdBorder};${row.sectionRank <= 3 ? 'background:#dcfce7;color:#166534;font-weight:700' : 'color:#64748b;font-weight:600'}">${row.sectionRank}</td>` : ''
      const resultCell = cols.includes('result')
        ? `<td style="${tdBorder};font-weight:700;${row.passedAll ? 'color:#166534;background:#dcfce7' : 'color:#ef4444;background:#fef2f2'}">${row.passedAll ? (isBn ? 'পাস' : 'PASS') : (isBn ? 'ফেল' : 'FAIL')}</td>`
        : ''

      return `<tr style="page-break-inside:avoid;${i % 2 === 0 ? '' : 'background:#f8fafc'}"><td style="${tdBorder};font-weight:600;color:#64748b">${i + 1}</td><td style="${tdBorderLeft};font-weight:500;white-space:nowrap">${isBn ? row.student.nameBn : row.student.nameEn}</td>${rollCell}${cells}${obtainedCell}${avgCell}${pctCell}${gpaCell}${classRankCell}${secRankCell}${resultCell}</tr>`
    })
    .join('')

  const thStyle = (w?: string) => `padding:10px 8px;background:${darkBg};color:#fff;font-weight:700;font-size:11px;border:2px solid ${brand};${w ? `min-width:${w};` : ''}text-transform:uppercase;letter-spacing:0.5px`

  const subjectThs = headers
    .map((h, idx) => {
      const fm = fullMarksList[idx]
      return `<th style="${thStyle('60px')}text-align:center;vertical-align:middle"><div style="font-weight:700">${h}</div><div style="font-size:9px;font-weight:400;opacity:0.8">/${fm}</div></th>`
    })
    .join('')

  const fixedCols = [
    `<th style="${thStyle('30px')}">#</th>`,
    `<th style="${thStyle('140px')}">${isBn ? 'নাম' : 'Name'}</th>`,
  ]
  if (cols.includes('roll')) fixedCols.push(`<th style="${thStyle('40px')}">${isBn ? 'রোল' : 'Roll'}</th>`)

  const summaryCols: string[] = []
  if (cols.includes('obtained')) summaryCols.push(`<th style="${thStyle('50px')}">${isBn ? 'প্রাপ্ত' : 'Obtained'}</th>`)
  if (cols.includes('avg')) summaryCols.push(`<th style="${thStyle('42px')}">${isBn ? 'গড়' : 'Avg'}</th>`)
  if (cols.includes('percentage')) summaryCols.push(`<th style="${thStyle('42px')}">%</th>`)
  if (cols.includes('gpa')) summaryCols.push(`<th style="${thStyle('38px')}">GPA</th>`)
  if (cols.includes('classRank')) summaryCols.push(`<th style="${thStyle('50px')}">${isBn ? 'ক্লাস র‍্যাঙ্ক' : 'Class Rank'}</th>`)
  if (cols.includes('sectionRank')) summaryCols.push(`<th style="${thStyle('50px')}">${isBn ? 'সেকশন র‍্যাঙ্ক' : 'Sec Rank'}</th>`)
  if (cols.includes('result')) summaryCols.push(`<th style="${thStyle('48px')}">${isBn ? 'ফলাফল' : 'Result'}</th>`)

  const examLabel = opts.examName || ''
  const classLabel = opts.className || ''
  const sectionLabel = opts.sectionName || ''
  const academicYear = rows[0]?.student?.academicYear || ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Tabulation</title><style>
    @page{size:${orientation};margin:6mm}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;background:#fff;font-size:11px}
    .header{text-align:center;margin-bottom:14px;padding-bottom:10px;border-bottom:3px solid ${brand}}
    .header h1{font-size:20px;color:${darkBg};letter-spacing:1.5px;text-transform:uppercase;font-weight:800}
    .header .subtitle{font-size:12px;color:#64748b;margin-top:4px;font-weight:500}
    .header .info{display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:10px;color:#64748b}
    .header .info span{background:#f1f5f9;padding:3px 12px;border-radius:20px;border:1px solid #e2e8f0;font-weight:500}
    table{width:100%;border-collapse:collapse;border:2px solid ${brand}}
    thead{overflow:visible}
    th,td{font-size:10px}
    th{position:sticky;top:0;z-index:1}
    tr:nth-child(even){background:#f8fafc}
    .footer{margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#94a3b8;border-top:2px solid ${brand};padding-top:6px}
    .footer .brand{color:${brand};font-weight:700;font-size:10px}
    @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}tr{page-break-inside:avoid}th,td{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;overflow:visible}}
  </style></head><body>
    <div class="header">
      <h1>${isBn ? 'ট্যাবুলেশন শিট' : 'Tabulation Sheet'}</h1>
      <p class="subtitle">${isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}: ${academicYear}</p>
      <div class="info">
        ${examLabel ? `<span>${isBn ? 'পরীক্ষা' : 'Exam'}: ${examLabel}</span>` : ''}
        ${classLabel ? `<span>${isBn ? 'শ্রেণি' : 'Class'}: ${classLabel}</span>` : ''}
        ${sectionLabel ? `<span>${isBn ? 'সেকশন' : 'Section'}: ${sectionLabel}</span>` : ''}
        <span>${isBn ? 'মোট ছাত্র' : 'Total Students'}: ${rows.length}</span>
      </div>
    </div>
    <table><thead><tr>${fixedCols.join('')}${subjectThs}${summaryCols.join('')}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer"><span class="brand">SMS EduTech</span><span>${isBn ? 'তৈরি করা হয়েছে' : 'Generated'}: ${new Date().toLocaleString()}</span></div>
  </body></html>`
}
