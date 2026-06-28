
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { escapeHtml } from '@/lib/sanitize'

export interface ExamRoutinePDFColumn {
  key: string
  label: string
  labelBn: string
  default: boolean
}

export const ALL_EXAM_ROUTINE_PDF_COLUMNS: ExamRoutinePDFColumn[] = [
  { key: 'subject', label: 'Subject', labelBn: 'বিষয়', default: true },
  { key: 'section', label: 'Section', labelBn: 'শাখা', default: true },
  { key: 'time', label: 'Time', labelBn: 'সময়', default: true },
  { key: 'room', label: 'Room', labelBn: 'কক্ষ', default: true },
]

export interface ExamRoutineGridCell {
  subject: string
  section: string
  time: string
  room: string
}

export interface ExamRoutineGridData {
  dates: { date: string; weekday: string }[]
  classNames: string[]
  grid: Record<string, Record<string, ExamRoutineGridCell[]>>
  examName: string
  examDateRange: string
}

export interface ExamRoutinePDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  emptyColumns: string[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
  institutionName?: string
}

export function generateExamRoutineGridPDF(
  gridData: ExamRoutineGridData,
  opts: ExamRoutinePDFOptions
): string {
  const title = opts.title || gridData.examName || (opts.isBn ? 'পরীক্ষার রুটিন' : 'Exam Routine')
  const selectedCols = opts.selectedCols || []
  const emptyRows = opts.emptyRows || 0
  const emptyColumns = opts.emptyColumns || []
  const orientation = opts.orientation || 'landscape'
  const isBn = opts.isBn ?? false
  const brand = getPDFBranding()
  const schoolName = opts.institutionName || brand.schoolName

  const showSubject = selectedCols.includes('subject')
  const showSection = selectedCols.includes('section')
  const showTime = selectedCols.includes('time')
  const showRoom = selectedCols.includes('room')

  const { dates, classNames, grid, examDateRange } = gridData
  const totalCols = classNames.length + 1 + emptyColumns.length

  const fontSize =
    orientation === 'landscape'
      ? totalCols > 8
        ? '7.5px'
        : totalCols > 5
          ? '8.5px'
          : '0.625rem'
      : totalCols > 6
        ? '7px'
        : totalCols > 4
          ? '8px'
          : '0.625rem'

  const dateHeaderLabel = isBn ? 'তারিখ' : 'Date'

  const classHeaders = classNames.map((cls) => `<th class="cls-hdr">${escapeHtml(cls)}</th>`).join('')
  const extraHeaders = emptyColumns.map((h) => `<th class="empty-hdr">${escapeHtml(h || (isBn ? '(ফাঁকা)' : '(Empty)'))}</th>`).join('')

  const dataRows = dates.map((d, rowIdx) => {
    const cells = classNames.map((cls) => {
      const cellRoutines = grid[d.date]?.[cls] || []
      if (cellRoutines.length === 0) return '<td class="cell"></td>'

      const items = cellRoutines.map((r) => {
        let lines: string[] = []
        if (showSubject && r.subject) lines.push(`<div class="subj">${escapeHtml(r.subject)}</div>`)
        if (showSection && r.section) lines.push(`<div class="sec">${escapeHtml(r.section)}</div>`)
        if (showTime && r.time) lines.push(`<div class="time">${escapeHtml(r.time)}</div>`)
        if (showRoom && r.room) lines.push(`<div class="room">${escapeHtml(r.room)}</div>`)

        if (lines.length === 0 && r.subject) lines.push(`<div class="subj">${escapeHtml(r.subject)}</div>`)
        if (lines.length === 0) lines.push(`<div class="subj">—</div>`)

        return `<div class="item">${lines.join('')}</div>`
      }).join('')

      return `<td class="cell">${items}</td>`
    }).join('')

    const extra = emptyColumns.map(() => '<td class="cell empty-cell"></td>').join('')

    return `<tr class="${rowIdx % 2 === 0 ? '' : 'alt'}"><td class="date-cell"><strong>${escapeHtml(d.date)}</strong><br/><span class="weekday">${escapeHtml(d.weekday)}</span></td>${cells}${extra}</tr>`
  }).join('')

  const blankRows = Array.from({ length: emptyRows }, () => {
    const first = '<td class="date-cell" style="color:#bbb;font-size:8px"></td>'
    const blanks = Array(classNames.length).fill('<td class="cell empty-cell"></td>').join('')
    const extra = emptyColumns.map(() => '<td class="cell empty-cell"></td>').join('')
    return `<tr class="blank-row">${first}${blanks}${extra}</tr>`
  }).join('')

  const darken = (hex: string, amt: number) => { const n = parseInt(hex.replace('#',''),16); const r=Math.max(0,(n>>16)-amt), g=Math.max(0,((n>>8)&0xff)-amt), bv=Math.max(0,(n&0xff)-amt); return '#'+(r<<16|g<<8|bv).toString(16).padStart(6,'0') }
  const darkerBrand = darken(brand.brandColor, 30)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} — ${escapeHtml(schoolName)}</title>
<style>
  @page { size: A4 ${orientation}; margin: 8mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:${fontSize}; color:#1a1a1a; background:#fff; }
  .hdr  { display:flex; align-items:center; justify-content:space-between; padding-bottom:7px; border-bottom:2px solid ${brand.brandColor}; margin-bottom:7px; }
  .meta { text-align:right; font-size:8px; color:#666; line-height:1.7; }
  .ttl  { text-align:center; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  .subttl { text-align:center; font-size:9px; color:#666; margin-bottom:8px; }
  table { border-collapse:collapse; table-layout:fixed; width:100%; }
  th { background:${brand.brandColor}; color:#fff; padding:5px 4px; text-align:center; font-size:8px; font-weight:700; text-transform:uppercase; border:0.5px solid ${darkerBrand}; white-space:nowrap; }
  th.date-hdr { text-align:left; padding-left:8px; min-width:5rem; }
  th.cls-hdr { min-width:4rem; }
  th.empty-hdr { background:${brand.brandColor}; opacity:0.8; }
  td { padding:4px; border:0.5px solid #e5e7eb; vertical-align:top; text-align:center; }
  td.date-cell { background:#f0f0ff; font-weight:700; text-align:left; padding:4px 8px; white-space:nowrap; min-width:5rem; vertical-align:middle; }
  td.date-cell .weekday { font-size:8px; color:#6b7280; font-weight:400; }
  td.cell { min-width:3.5rem; }
  td.cell .item { margin-bottom:3px; padding:2px 0; border-bottom:1px dashed #e5e7eb; }
  td.cell .item:last-child { border-bottom:none; margin-bottom:0; }
  td.cell .subj { font-weight:600; font-size:${fontSize}; line-height:1.3; color:#1e293b; }
  td.cell .sec { font-size:0.85em; color:${brand.brandColor}; font-weight:600; line-height:1.3; }
  td.cell .time { font-size:0.85em; color:#059669; line-height:1.3; }
  td.cell .room { font-size:0.85em; color:#94a3b8; line-height:1.3; }
  td.empty-cell { background:#fafafa; }
  tr.alt td { background:#f9fafb; }
  tr.alt td.date-cell { background:#e8e8ff; }
  tr.blank-row td { background:#fafafa; height:24px; }
  .ftr { margin-top:10px; padding-top:7px; border-top:1px solid #ddd; display:flex; justify-content:space-between; font-size:8px; color:#888; }
  @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="hdr">
  <div style="display:flex;align-items:center;gap:10px">
    ${pdfLogoHTML(brand)}
    <div>
      <div style="font-size:13px;font-weight:700;color:${brand.brandColor}">${escapeHtml(schoolName)}</div>
      ${brand.address ? `<div style="font-size:8px;color:#888">${escapeHtml(brand.address)}</div>` : ''}
    </div>
  </div>
  <div class="meta">
    <div>${isBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div>
    <div>${isBn ? 'মোট:' : 'Total:'} ${dates.length} ${isBn ? 'টি দিন' : 'days'} × ${classNames.length} ${isBn ? 'টি শ্রেণি' : 'classes'}</div>
    <div>A4 · ${orientation}</div>
  </div>
</div>
<div class="ttl">${escapeHtml(title)}</div>
${examDateRange ? `<div class="subttl">${escapeHtml(examDateRange)}</div>` : ''}
<table>
  <thead>
    <tr><th class="date-hdr">${escapeHtml(dateHeaderLabel)}</th>${classHeaders}${extraHeaders}</tr>
  </thead>
  <tbody>${dataRows}${blankRows}</tbody>
</table>
<div class="ftr">
  <span style="font-size:7px;color:#999">Powered by EduTech</span>
  <div style="display:flex;gap:50px">
    <div style="text-align:center"><div style="width:110px;height:1px;background:#333;margin-bottom:3px"></div>${isBn ? 'প্রধান শিক্ষক' : 'Principal'}</div>
    <div style="text-align:center"><div style="width:110px;height:1px;background:#333;margin-bottom:3px"></div>${isBn ? 'অফিস সিল' : 'Office Seal'}</div>
  </div>
</div>
</body>
</html>`
}
