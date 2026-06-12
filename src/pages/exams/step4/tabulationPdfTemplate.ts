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
  rotateHeaders?: boolean
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
  const isBn = opts.isBn
  const cols = opts.selectedCols || []
  const orientation = opts.orientation || 'landscape'
  const rotate = opts.rotateHeaders ?? false

  // Color palette
  const c = {
    brand,
    dark: '#0f172a',
    darkMid: '#1e293b',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    textLight: '#94a3b8',
    green: '#16a34a',
    greenBg: '#dcfce7',
    greenDark: '#15803d',
    red: '#dc2626',
    redBg: '#fef2f2',
    redDark: '#991b1b',
    amberBg: '#fef3c7',
    amberDark: '#92400e',
    blueBg: '#eff6ff',
  }

  const subjectHeaders = rows[0].subjectMarks.map((s) => s.subjectName || '')
  const fullMarksList = rows[0].subjectMarks.map((s) => s.fullMarks)

  interface ColDef { key: string; th: string }
  const allCols: ColDef[] = []

  // Rotated <th> — content-based width, tall height
  const rTh = (label: string, h = '110px') =>
    `<th style="padding:0;background:${c.dark};color:#fff;font-weight:700;font-size:9px;border:2px solid ${c.brand};text-align:center;white-space:nowrap;height:${h};vertical-align:bottom">
      <div style="display:flex;align-items:flex-end;justify-content:center;height:100%;padding-bottom:8px">
        <span style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;font-size:9px;font-weight:700;letter-spacing:0.03em">${label}</span>
      </div>
    </th>`

  // Normal <th> — content-based
  const nTh = (label: string, align = 'center') =>
    `<th style="padding:10px 8px;background:${c.dark};color:#fff;font-weight:700;font-size:10px;border:2px solid ${c.brand};text-align:${align};white-space:nowrap">${label}</th>`

  // Rotated subject <th>
  const rThSubj = (name: string, fm: number) =>
    `<th style="padding:0;background:${c.darkMid};color:#fff;font-weight:700;font-size:9px;border:2px solid ${c.brand};text-align:center;white-space:nowrap;height:110px;vertical-align:bottom">
      <div style="display:flex;align-items:flex-end;justify-content:center;height:100%;padding-bottom:8px">
        <span style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;font-size:8px;font-weight:700;letter-spacing:0.03em">${name}<span style="font-weight:400;opacity:0.7"> (${fm})</span></span>
      </div>
    </th>`

  // Normal subject <th>
  const nThSubj = (name: string, fm: number) =>
    `<th style="padding:8px 6px;background:${c.darkMid};color:#fff;font-weight:700;font-size:9px;border:2px solid ${c.brand};text-align:center;white-space:nowrap">
      <div style="font-weight:700">${name}</div>
      <div style="font-size:8px;font-weight:400;opacity:0.6;margin-top:1px">/${fm}</div>
    </th>`

  // Fixed columns
  allCols.push({ key: '__sn', th: rotate ? rTh('#') : nTh('#') })
  allCols.push({ key: '__name', th: rotate ? rTh(isBn ? 'নাম' : 'Name') : nTh(isBn ? 'নাম' : 'Name', 'left') })
  if (cols.includes('roll')) allCols.push({ key: 'roll', th: rotate ? rTh(isBn ? 'রোল' : 'Roll') : nTh(isBn ? 'রোল' : 'Roll') })

  // Subject columns
  subjectHeaders.forEach((h, idx) => {
    const fm = fullMarksList[idx]
    allCols.push({ key: `subj_${idx}`, th: rotate ? rThSubj(h, fm) : nThSubj(h, fm) })
  })

  // Summary columns
  if (cols.includes('obtained')) allCols.push({ key: 'obtained', th: rotate ? rTh(isBn ? 'প্রাপ্ত' : 'Obt') : nTh(isBn ? 'প্রাপ্ত' : 'Obt') })
  if (cols.includes('avg')) allCols.push({ key: 'avg', th: rotate ? rTh(isBn ? 'গড়' : 'Avg') : nTh(isBn ? 'গড়' : 'Avg') })
  if (cols.includes('percentage')) allCols.push({ key: 'pct', th: rotate ? rTh('%') : nTh('%') })
  if (cols.includes('gpa')) allCols.push({ key: 'gpa', th: rotate ? rTh('GPA') : nTh('GPA') })
  if (cols.includes('classRank')) allCols.push({ key: 'classRank', th: rotate ? rTh(isBn ? 'ক্লাস' : 'C.Rank') : nTh(isBn ? 'ক্লাস র‍্যাঙ্ক' : 'Class Rank') })
  if (cols.includes('sectionRank')) allCols.push({ key: 'secRank', th: rotate ? rTh(isBn ? 'সেকশন' : 'S.Rank') : nTh(isBn ? 'সেকশন র‍্যাঙ্ক' : 'Sec Rank') })
  if (cols.includes('result')) allCols.push({ key: 'result', th: rotate ? rTh(isBn ? 'ফলাফল' : 'Status') : nTh(isBn ? 'ফলাফল' : 'Status') })

  // Build table rows — same body content as before
  const tableRows = rows
    .map((row, i) => {
      const even = i % 2 === 0
      const bg = even ? '#fff' : c.surface
      const cells: string[] = []

      cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:10px;text-align:center;white-space:nowrap;font-weight:600;color:${c.textMuted};background:${bg}">${i + 1}</td>`)
      cells.push(`<td style="border:1.5px solid ${c.border};border-left:3px solid ${c.brand};padding:7px 10px;font-size:10px;white-space:nowrap;text-align:left;font-weight:600;color:${c.text};background:${bg}">${isBn ? row.student.nameBn : row.student.nameEn}</td>`)
      if (cols.includes('roll')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:10px;text-align:center;white-space:nowrap;color:${c.textMuted};background:${bg}">${row.student.roll || ''}</td>`)

      row.subjectMarks.forEach((s) => {
        const fail = !s.passed
        const cellBg = fail ? c.redBg : bg
        const cellColor = fail ? c.redDark : c.text
        const cellWeight = fail ? '700' : '500'
        cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:10px;text-align:center;white-space:nowrap;color:${cellColor};font-weight:${cellWeight};background:${cellBg}">${s.obtained}</td>`)
      })

      if (cols.includes('obtained')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:11px;text-align:center;white-space:nowrap;font-weight:800;color:${c.brand};background:${c.blueBg}">${row.totalObtained}</td>`)
      if (cols.includes('avg')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:10px;text-align:center;white-space:nowrap;font-weight:700;color:${c.brand};background:${bg}">${row.avgMark}</td>`)
      if (cols.includes('percentage')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:10px;text-align:center;white-space:nowrap;font-weight:600;color:${c.textMuted};background:${bg}">${row.percentage}%</td>`)
      if (cols.includes('gpa')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:11px;text-align:center;white-space:nowrap;font-weight:800;color:${c.brand};background:${bg}">${row.gpa}</td>`)
      if (cols.includes('classRank')) {
        const top3 = row.classRank <= 3
        cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:10px;text-align:center;white-space:nowrap;font-weight:700;color:${top3 ? c.amberDark : c.textMuted};background:${top3 ? c.amberBg : bg}">${row.classRank}</td>`)
      }
      if (cols.includes('sectionRank')) {
        const top3 = row.sectionRank <= 3
        cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:10px;text-align:center;white-space:nowrap;font-weight:700;color:${top3 ? c.greenDark : c.textMuted};background:${top3 ? c.greenBg : bg}">${row.sectionRank}</td>`)
      }
      if (cols.includes('result')) {
        const pass = row.passedAll
        cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 8px;font-size:10px;text-align:center;white-space:nowrap;font-weight:700;color:${pass ? c.greenDark : c.redDark};background:${pass ? c.greenBg : c.redBg}">${pass ? (isBn ? 'পাস' : 'PASS') : (isBn ? 'ফেল' : 'FAIL')}</td>`)
      }

      return `<tr style="page-break-inside:avoid">${cells.join('')}</tr>`
    })
    .join('')

  const headerRow = allCols.map((c) => c.th).join('')

  const examLabel = opts.examName || ''
  const classLabel = opts.className || ''
  const sectionLabel = opts.sectionName || ''
  const academicYear = rows[0]?.student?.academicYear || ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Tabulation</title><style>
    @page{size:${orientation};margin:4mm}
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%}
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:${c.text};background:#fff;font-size:10px;display:flex;flex-direction:column}

    .header{text-align:center;padding-bottom:10px;border-bottom:3px solid ${c.brand};margin-bottom:10px;flex-shrink:0}
    .header h1{font-size:20px;color:${c.dark};letter-spacing:2px;text-transform:uppercase;font-weight:800;margin-bottom:2px}
    .header .tagline{font-size:10px;color:${c.textLight};letter-spacing:0.5px;margin-bottom:6px}
    .header .subtitle{font-size:11px;color:${c.textMuted};font-weight:500}
    .header .info{display:flex;justify-content:center;gap:10px;margin-top:8px;flex-wrap:wrap}
    .header .info span{background:${c.surfaceAlt};padding:3px 12px;border-radius:20px;border:1px solid ${c.border};font-size:9px;color:${c.textMuted};font-weight:500}

    .table-wrap{flex:1;display:flex;align-items:stretch;overflow:auto}
    table{border-collapse:collapse;border:2px solid ${c.brand};width:100%;table-layout:auto}
    th{position:sticky;top:0;z-index:2;white-space:nowrap}
    td{white-space:nowrap}

    .footer{margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:${c.textLight};border-top:2px solid ${c.brand};padding-top:6px;flex-shrink:0}
    .footer .brand{color:${c.brand};font-weight:800;font-size:10px;letter-spacing:0.5px}
    .footer .ts{color:${c.textLight};font-size:8px}

    @media print{
      body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}
      tr{page-break-inside:avoid}
      th,td{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}
    }
  </style></head><body>
    <div class="header">
      <h1>${isBn ? 'ট্যাবুলেশন শিট' : 'Tabulation Sheet'}</h1>
      <div class="tagline">SMS EduTech</div>
      <p class="subtitle">${isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}: ${academicYear}</p>
      <div class="info">
        ${examLabel ? `<span>${isBn ? 'পরীক্ষা' : 'Exam'}: ${examLabel}</span>` : ''}
        ${classLabel ? `<span>${isBn ? 'শ্রেণি' : 'Class'}: ${classLabel}</span>` : ''}
        ${sectionLabel ? `<span>${isBn ? 'সেকশন' : 'Section'}: ${sectionLabel}</span>` : ''}
        <span>${isBn ? 'মোট ছাত্র' : 'Students'}: ${rows.length}</span>
      </div>
    </div>
    <div class="table-wrap">
      <table><thead><tr>${headerRow}</tr></thead><tbody>${tableRows}</tbody></table>
    </div>
    <div class="footer">
      <span class="brand">SMS EduTech</span>
      <span class="ts">${isBn ? 'তৈরি করা হয়েছে' : 'Generated'}: ${new Date().toLocaleString()}</span>
    </div>
  </body></html>`
}
