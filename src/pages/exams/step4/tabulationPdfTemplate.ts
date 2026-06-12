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

  // Thematic color palette
  const c = {
    brand,
    brandLight: `${brand}18`,
    dark: '#0f172a',
    darkMid: '#1e293b',
    darkLight: '#334155',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#64748b',
    textLight: '#94a3b8',
    green: '#16a34a',
    greenBg: '#dcfce7',
    greenDark: '#15803d',
    red: '#dc2626',
    redBg: '#fef2f2',
    redDark: '#991b1b',
    amber: '#d97706',
    amberBg: '#fef3c7',
    amberDark: '#92400e',
    blueBg: '#eff6ff',
  }

  const thH = rotate ? '110px' : 'auto'
  const subjectHeaders = rows[0].subjectMarks.map((s) => s.subjectName || '')
  const fullMarksList = rows[0].subjectMarks.map((s) => s.fullMarks)

  interface ColDef { key: string; width: string; th: string }
  const allCols: ColDef[] = []

  // Helper: rotated <th>
  const rTh = (label: string, w: string, h = thH) =>
    `<th style="padding:0;background:${c.dark};color:#fff;font-weight:700;font-size:9px;border:2px solid ${c.brand};text-align:center;white-space:nowrap;width:${w};height:${h};vertical-align:bottom">
      <div style="display:flex;align-items:flex-end;justify-content:center;height:100%;padding-bottom:8px">
        <span style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;font-size:9px;font-weight:700;letter-spacing:0.03em">${label}</span>
      </div>
    </th>`

  // Helper: normal <th>
  const nTh = (label: string, w: string, align = 'center') =>
    `<th style="padding:10px 6px;background:${c.dark};color:#fff;font-weight:700;font-size:10px;border:2px solid ${c.brand};text-align:${align};white-space:nowrap;width:${w}">${label}</th>`

  // Helper: rotated subject <th>
  const rThSubj = (name: string, fm: number, w: string) =>
    `<th style="padding:0;background:${c.darkMid};color:#fff;font-weight:700;font-size:9px;border:2px solid ${c.brand};text-align:center;white-space:nowrap;width:${w};height:${thH};vertical-align:bottom">
      <div style="display:flex;align-items:flex-end;justify-content:center;height:100%;padding-bottom:8px">
        <span style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;font-size:8px;font-weight:700;letter-spacing:0.03em">${name}<span style="font-weight:400;opacity:0.7"> (${fm})</span></span>
      </div>
    </th>`

  // Helper: normal subject <th>
  const nThSubj = (name: string, fm: number, w: string) =>
    `<th style="padding:8px 4px;background:${c.darkMid};color:#fff;font-weight:700;font-size:9px;border:2px solid ${c.brand};text-align:center;white-space:nowrap;width:${w}">
      <div style="font-weight:700">${name}</div>
      <div style="font-size:8px;font-weight:400;opacity:0.6;margin-top:1px">/${fm}</div>
    </th>`

  // Fixed columns
  allCols.push({ key: '__sn', width: rotate ? '28px' : '32px', th: rotate ? rTh('#', '28px') : nTh('#', '32px') })
  allCols.push({ key: '__name', width: rotate ? '28px' : '140px', th: rotate ? rTh(isBn ? 'নাম' : 'Name', '28px') : nTh(isBn ? 'নাম' : 'Name', '140px', 'left') })
  if (cols.includes('roll')) allCols.push({ key: 'roll', width: rotate ? '28px' : '46px', th: rotate ? rTh(isBn ? 'রোল' : 'Roll', '28px') : nTh(isBn ? 'রোল' : 'Roll', '46px') })

  // Subject columns
  subjectHeaders.forEach((h, idx) => {
    const fm = fullMarksList[idx]
    allCols.push({
      key: `subj_${idx}`,
      width: rotate ? '30px' : '58px',
      th: rotate ? rThSubj(h, fm, '30px') : nThSubj(h, fm, '58px'),
    })
  })

  // Summary columns
  if (cols.includes('obtained')) allCols.push({ key: 'obtained', width: rotate ? '32px' : '56px', th: rotate ? rTh(isBn ? 'প্রাপ্ত' : 'Obt', '32px') : nTh(isBn ? 'প্রাপ্ত' : 'Obt', '56px') })
  if (cols.includes('avg')) allCols.push({ key: 'avg', width: rotate ? '28px' : '42px', th: rotate ? rTh(isBn ? 'গড়' : 'Avg', '28px') : nTh(isBn ? 'গড়' : 'Avg', '42px') })
  if (cols.includes('percentage')) allCols.push({ key: 'pct', width: rotate ? '28px' : '42px', th: rotate ? rTh('%', '28px') : nTh('%', '42px') })
  if (cols.includes('gpa')) allCols.push({ key: 'gpa', width: rotate ? '28px' : '40px', th: rotate ? rTh('GPA', '28px') : nTh('GPA', '40px') })
  if (cols.includes('classRank')) allCols.push({ key: 'classRank', width: rotate ? '32px' : '60px', th: rotate ? rTh(isBn ? 'ক্লাস' : 'C.Rank', '32px') : nTh(isBn ? 'ক্লাস র‍্যাঙ্ক' : 'Class Rank', '60px') })
  if (cols.includes('sectionRank')) allCols.push({ key: 'secRank', width: rotate ? '32px' : '56px', th: rotate ? rTh(isBn ? 'সেকশন' : 'S.Rank', '32px') : nTh(isBn ? 'সেকশন র‍্যাঙ্ক' : 'Sec Rank', '56px') })
  if (cols.includes('result')) allCols.push({ key: 'result', width: rotate ? '30px' : '48px', th: rotate ? rTh(isBn ? 'ফলাফল' : 'Status', '30px') : nTh(isBn ? 'ফলাফল' : 'Status', '48px') })

  // Build table rows
  const tableRows = rows
    .map((row, i) => {
      const even = i % 2 === 0
      const bg = even ? '#fff' : c.surface
      const cells: string[] = []

      cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:10px;text-align:center;white-space:nowrap;font-weight:600;color:${c.textMuted};background:${bg}">${i + 1}</td>`)
      cells.push(`<td style="border:1.5px solid ${c.border};border-left:3px solid ${c.brand};padding:7px 8px;font-size:10px;white-space:nowrap;text-align:left;font-weight:600;color:${c.text};background:${bg}">${isBn ? row.student.nameBn : row.student.nameEn}</td>`)
      if (cols.includes('roll')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:10px;text-align:center;white-space:nowrap;color:${c.textMuted};background:${bg}">${row.student.roll || ''}</td>`)

      row.subjectMarks.forEach((s) => {
        const fail = !s.passed
        const cellBg = fail ? c.redBg : bg
        const cellColor = fail ? c.redDark : c.text
        const cellWeight = fail ? '700' : '500'
        cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:10px;text-align:center;white-space:nowrap;color:${cellColor};font-weight:${cellWeight};background:${cellBg}">${s.obtained}</td>`)
      })

      if (cols.includes('obtained')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:11px;text-align:center;white-space:nowrap;font-weight:800;color:${c.brand};background:${c.blueBg}">${row.totalObtained}</td>`)
      if (cols.includes('avg')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:10px;text-align:center;white-space:nowrap;font-weight:700;color:${c.brand};background:${bg}">${row.avgMark}</td>`)
      if (cols.includes('percentage')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:10px;text-align:center;white-space:nowrap;font-weight:600;color:${c.textMuted};background:${bg}">${row.percentage}%</td>`)
      if (cols.includes('gpa')) cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:11px;text-align:center;white-space:nowrap;font-weight:800;color:${c.brand};background:${bg}">${row.gpa}</td>`)
      if (cols.includes('classRank')) {
        const top3 = row.classRank <= 3
        cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:10px;text-align:center;white-space:nowrap;font-weight:700;color:${top3 ? c.amberDark : c.textMuted};background:${top3 ? c.amberBg : bg}">${row.classRank}</td>`)
      }
      if (cols.includes('sectionRank')) {
        const top3 = row.sectionRank <= 3
        cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:10px;text-align:center;white-space:nowrap;font-weight:700;color:${top3 ? c.greenDark : c.textMuted};background:${top3 ? c.greenBg : bg}">${row.sectionRank}</td>`)
      }
      if (cols.includes('result')) {
        const pass = row.passedAll
        cells.push(`<td style="border:1.5px solid ${c.border};padding:7px 6px;font-size:10px;text-align:center;white-space:nowrap;font-weight:700;color:${pass ? c.greenDark : c.redDark};background:${pass ? c.greenBg : c.redBg}">${pass ? (isBn ? 'পাস' : 'PASS') : (isBn ? 'ফেল' : 'FAIL')}</td>`)
      }

      return `<tr style="page-break-inside:avoid">${cells.join('')}</tr>`
    })
    .join('')

  const headerRow = allCols.map((c) => c.th).join('')
  const colGroup = allCols.map((c) => `<col style="width:${c.width}">`).join('')

  const examLabel = opts.examName || ''
  const classLabel = opts.className || ''
  const sectionLabel = opts.sectionName || ''
  const academicYear = rows[0]?.student?.academicYear || ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Tabulation</title><style>
    @page{size:${orientation};margin:4mm}
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%;width:100%}
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:${c.text};background:#fff;font-size:10px;display:flex;flex-direction:column}

    /* ── Header ── */
    .header{text-align:center;padding-bottom:10px;border-bottom:3px solid ${c.brand};margin-bottom:10px;flex-shrink:0}
    .header h1{font-size:20px;color:${c.dark};letter-spacing:2px;text-transform:uppercase;font-weight:800;margin-bottom:2px}
    .header .tagline{font-size:10px;color:${c.textLight};letter-spacing:0.5px;margin-bottom:6px}
    .header .subtitle{font-size:11px;color:${c.textMuted};font-weight:500}
    .header .info{display:flex;justify-content:center;gap:10px;margin-top:8px;flex-wrap:wrap}
    .header .info span{background:${c.surfaceAlt};padding:3px 12px;border-radius:20px;border:1px solid ${c.border};font-size:9px;color:${c.textMuted};font-weight:500}

    /* ── Table ── */
    .table-wrap{flex:1;display:flex;align-items:stretch;overflow:auto}
    table{width:100%;border-collapse:collapse;border:2px solid ${c.brand};table-layout:fixed}
    colgroup col{overflow:hidden}
    thead{overflow:visible}
    th{position:sticky;top:0;z-index:2;overflow:hidden;text-overflow:ellipsis}
    td{overflow:hidden;text-overflow:ellipsis}

    /* ── Footer ── */
    .footer{margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:${c.textLight};border-top:2px solid ${c.brand};padding-top:6px;flex-shrink:0}
    .footer .brand{color:${c.brand};font-weight:800;font-size:10px;letter-spacing:0.5px}
    .footer .ts{color:${c.textLight};font-size:8px}

    @media print{
      body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}
      tr{page-break-inside:avoid}
      th,td{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;overflow:visible}
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
      <table><colgroup>${colGroup}</colgroup><thead><tr>${headerRow}</tr></thead><tbody>${tableRows}</tbody></table>
    </div>
    <div class="footer">
      <span class="brand">SMS EduTech</span>
      <span class="ts">${isBn ? 'তৈরি করা হয়েছে' : 'Generated'}: ${new Date().toLocaleString()}</span>
    </div>
  </body></html>`
}
