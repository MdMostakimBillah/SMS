

import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

export interface RoutinePDFColumn {
  key: string
  label: string
  labelBn: string
  default: boolean
}

export const ALL_ROUTINE_PDF_COLUMNS: RoutinePDFColumn[] = [
  { key: 'subject', label: 'Subject', labelBn: 'বিষয়', default: true },
  { key: 'teacher', label: 'Teacher', labelBn: 'শিক্ষক', default: true },
]

export interface RoutineGridDay {
  name: string
  nameBn: string
  index: number
}

export interface RoutineGridCell {
  subject: string
  teacher: string
}

export interface RoutineGridData {
  activeDays: RoutineGridDay[]
  totalPeriods: number
  periodTimes: { start: string; end: string }[]
  grid: Array<Array<RoutineGridCell>>
}

export interface RoutineListPDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  emptyColumns: string[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
  institutionName?: string
}

export function generateRoutineGridPDF(
  gridData: RoutineGridData,
  opts: RoutineListPDFOptions
): string {
  const title = opts.title || (opts.isBn ? 'রুটিন তালিকা' : 'Routine List')
  const selectedCols = opts.selectedCols || []
  const emptyRows = opts.emptyRows || 0
  const emptyColumns = opts.emptyColumns || []
  const orientation = opts.orientation || 'landscape'
  const isBn = opts.isBn ?? false
  const brand = getPDFBranding()
  const schoolName = opts.institutionName || brand.schoolName

  const showSubject = selectedCols.includes('subject')
  const showTeacher = selectedCols.includes('teacher')

  const { activeDays, totalPeriods, periodTimes, grid } = gridData
  const dayCount = activeDays.length

  const fontSize =
    orientation === 'landscape'
      ? totalPeriods > 8
        ? '7.5px'
        : totalPeriods > 5
          ? '8.5px'
          : '0.625rem'
      : totalPeriods > 6
        ? '7px'
        : totalPeriods > 4
          ? '8px'
          : '0.625rem'

  const dayHeaderLabel = isBn ? 'দিন' : 'Day'

  const periodHeaders = Array.from({ length: totalPeriods }, (_, p) => {
    const time = periodTimes[p]
    const timeStr = time ? `${time.start} - ${time.end}` : ''
    return `<th class="period-hdr">P${p + 1}${timeStr ? `<br><span class="time">${timeStr}</span>` : ''}</th>`
  }).join('')

  const extraHeaders = emptyColumns.map((h) => `<th class="empty-hdr">${h || (isBn ? '(ফাঁকা)' : '(Empty)')}</th>`).join('')

  const dataRows = activeDays.map((day, rowIdx) => {
    const dayCells = grid[day.index] || []
    const periodCells = Array.from({ length: totalPeriods }, (_, p) => {
      const cell = dayCells[p]
      const subjectText = cell?.subject || '—'
      const teacherText = cell?.teacher || ''

      let content = ''
      if (showSubject) {
        content += `<div class="subj">${subjectText}</div>`
      }
      if (showTeacher && teacherText) {
        content += `<div class="tchr">${teacherText}</div>`
      }
      if (!showSubject && !showTeacher) {
        content = `<div class="subj">${subjectText}</div>`
      }

      return `<td class="cell">${content}</td>`
    }).join('')

    const extra = emptyColumns.map(() => '<td class="cell empty-cell"></td>').join('')

    return `<tr class="${rowIdx % 2 === 0 ? '' : 'alt'}"><td class="day-cell">${isBn ? day.nameBn : day.name}</td>${periodCells}${extra}</tr>`
  }).join('')

  const blankRows = Array.from({ length: emptyRows }, () => {
    const first = `<td class="day-cell" style="color:#bbb;font-size:8px"></td>`
    const blanks = Array(totalPeriods).fill('<td class="cell empty-cell"></td>').join('')
    const extra = emptyColumns.map(() => '<td class="cell empty-cell"></td>').join('')
    return `<tr class="blank-row">${first}${blanks}${extra}</tr>`
  }).join('')

  const darken = (hex: string, amt: number) => { const n = parseInt(hex.replace('#',''),16); const r=Math.max(0,(n>>16)-amt), g=Math.max(0,((n>>8)&0xff)-amt), bv=Math.max(0,(n&0xff)-amt); return '#'+(r<<16|g<<8|bv).toString(16).padStart(6,'0') }
  const darkerBrand = darken(brand.brandColor, 30)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Routine — ${schoolName}</title>
<style>
  @page { size: A4 ${orientation}; margin: 8mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:${fontSize}; color:#1a1a1a; background:#fff; }
  .hdr  { display:flex; align-items:center; justify-content:space-between; padding-bottom:7px; border-bottom:2px solid ${brand.brandColor}; margin-bottom:7px; }
  .meta { text-align:right; font-size:8px; color:#666; line-height:1.7; }
  .ttl  { text-align:center; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  table { border-collapse:collapse; table-layout:fixed; width:100%; }
  th { background:${brand.brandColor}; color:#fff; padding:5px 4px; text-align:center; font-size:8px; font-weight:700; text-transform:uppercase; border:0.5px solid ${darkerBrand}; white-space:nowrap; }
  th.period-hdr { line-height:1.4; }
  th .time { font-size:7px; font-weight:400; opacity:0.85; text-transform:none; letter-spacing:0; }
  th.empty-hdr { background:${brand.brandColor}; opacity:0.8; }
  td { padding:4px; border:0.5px solid #e5e7eb; vertical-align:middle; text-align:center; }
  td.day-cell { background:#f0f0ff; font-weight:700; text-align:left; padding:4px 8px; white-space:nowrap; min-width:4.5rem; }
  td.cell { min-width:3rem; }
  td.cell .subj { font-weight:600; font-size:${fontSize}; line-height:1.3; }
  td.cell .tchr { font-size:0.85em; color:#6b7280; line-height:1.3; margin-top:1px; }
  td.empty-cell { background:#fafafa; }
  tr.alt td { background:#f9fafb; }
  tr.alt td.day-cell { background:#e8e8ff; }
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
      <div style="font-size:13px;font-weight:700;color:${brand.brandColor}">${schoolName}</div>
      ${brand.address ? `<div style="font-size:8px;color:#888">${brand.address}</div>` : ''}
    </div>
  </div>
  <div class="meta">
    <div>${isBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div>
    <div>${isBn ? 'মোট:' : 'Total:'} ${dayCount} ${isBn ? 'টি দিন' : 'days'} × ${totalPeriods} ${isBn ? 'টি পিরিয়ড' : 'periods'}</div>
    <div>A4 · ${orientation}</div>
  </div>
</div>
<div class="ttl">${title}</div>
<table>
  <thead>
    <tr><th class="day-cell" style="text-align:left">${dayHeaderLabel}</th>${periodHeaders}${extraHeaders}</tr>
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
