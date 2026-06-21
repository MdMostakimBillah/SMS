
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

export interface InvigilatorPDFColumn {
  key: string
  label: string
  labelBn: string
  default: boolean
}

export const INVIGILATOR_CLASS_COLUMNS: InvigilatorPDFColumn[] = [
  { key: 'classSection', label: 'Class-Sec', labelBn: 'শ্রেণি-সেকশন', default: true },
  { key: 'teacher', label: 'Teacher', labelBn: 'শিক্ষক', default: true },
  { key: 'subject', label: 'Subject', labelBn: 'বিষয়', default: true },
  { key: 'students', label: 'Students', labelBn: 'ছাত্র', default: true },
  { key: 'shift', label: 'Shift', labelBn: 'শিফট', default: true },
]

export const INVIGILATOR_ROOM_COLUMNS: InvigilatorPDFColumn[] = [
  { key: 'room', label: 'Room', labelBn: 'কক্ষ', default: true },
  { key: 'teacher', label: 'Teacher', labelBn: 'শিক্ষক', default: true },
  { key: 'subject', label: 'Subject', labelBn: 'বিষয়', default: true },
  { key: 'capacity', label: 'Capacity', labelBn: 'ধারণক্ষমতা', default: true },
  { key: 'shift', label: 'Shift', labelBn: 'শিফট', default: true },
]

export interface InvigilatorGridRow {
  classSection?: string
  room?: string
  teacher: string
  subject: string
  students?: number
  capacity?: number
  shift: string
}

export interface InvigilatorGridDay {
  date: string
  dateFormatted: string
  rows: InvigilatorGridRow[]
}

export interface InvigilatorGridData {
  type: 'class' | 'room'
  examName: string
  days: InvigilatorGridDay[]
}

export interface InvigilatorPDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  emptyColumns: string[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
  institutionName?: string
}

export function generateInvigilatorGuardListPDF(
  gridData: InvigilatorGridData,
  opts: InvigilatorPDFOptions
): string {
  const title = opts.title || gridData.examName || (opts.isBn ? 'গার্ড তালিকা' : 'Guard List')
  const selectedCols = opts.selectedCols || []
  const emptyRows = opts.emptyRows || 0
  const emptyColumns = opts.emptyColumns || []
  const orientation = opts.orientation || 'portrait'
  const isBn = opts.isBn ?? false
  const isClass = gridData.type === 'class'
  const brand = getPDFBranding()
  const schoolName = opts.institutionName || brand.schoolName

  const columns = isClass ? INVIGILATOR_CLASS_COLUMNS : INVIGILATOR_ROOM_COLUMNS
  const visibleCols = columns.filter((c) => selectedCols.includes(c.key))

  const totalCols = visibleCols.length + emptyColumns.length

  const fontSize = totalCols > 6 ? '8px' : totalCols > 4 ? '9px' : '0.625rem'

  const headerLabel = isClass
    ? (isBn ? 'শ্রেণি/সেকশন ভিত্তিক গার্ড তালিকা' : 'Class / Section Wise Guard List')
    : (isBn ? 'কক্ষ/হল ভিত্তিক গার্ড তালিকা' : 'Room / Hall Wise Guard List')

  const pagesHTML = gridData.days.map((day) => {
    const colHeaders = visibleCols.map((c) => {
      const isCenter = c.key === 'students' || c.key === 'capacity' || c.key === 'shift'
      return `<th style="text-align:${isCenter ? 'center' : 'left'}">${isBn ? c.labelBn : c.label}</th>`
    }).join('')
    const extraHeaders = emptyColumns.map((h) => `<th>${h || (isBn ? '(ফাঁকা)' : '(Empty)')}</th>`).join('')

    const rows = day.rows.map((row, idx) => {
      const cells = visibleCols.map((c) => {
        let val = ''
        if (c.key === 'classSection') val = row.classSection || ''
        else if (c.key === 'room') val = row.room || ''
        else if (c.key === 'teacher') val = row.teacher
        else if (c.key === 'subject') val = row.subject
        else if (c.key === 'students') val = String(row.students ?? '')
        else if (c.key === 'capacity') val = String(row.capacity ?? '')
        else if (c.key === 'shift') val = row.shift

        const isCenter = c.key === 'students' || c.key === 'capacity' || c.key === 'shift'
        const isBold = c.key === 'classSection' || c.key === 'room'
        return `<td style="text-align:${isCenter ? 'center' : 'left'};${isBold ? 'font-weight:600' : ''}">${val}</td>`
      }).join('')
      const extra = emptyColumns.map(() => '<td></td>').join('')
      return `<tr class="${idx % 2 === 1 ? 'alt' : ''}">${cells}${extra}</tr>`
    }).join('')

    const blankRowsHTML = Array.from({ length: emptyRows }, () => {
      const cells = visibleCols.map(() => '<td></td>').join('')
      const extra = emptyColumns.map(() => '<td></td>').join('')
      return `<tr class="blank">${cells}${extra}</tr>`
    }).join('')

    return `
      <div class="page">
        <div class="date-badge">${day.dateFormatted}</div>
        <table>
          <thead><tr>${colHeaders}${extraHeaders}</tr></thead>
          <tbody>${rows}${blankRowsHTML}</tbody>
        </table>
        <div class="page-footer">
          ${isBn ? 'মোট' : 'Total'}: ${day.rows.length} ${isBn ? 'জন নিয়োগ' : 'assignments'}
        </div>
      </div>`
  }).join('')

  const darken = (hex: string, amt: number) => { const n = parseInt(hex.replace('#',''),16); const r=Math.max(0,(n>>16)-amt), g=Math.max(0,((n>>8)&0xff)-amt), bv=Math.max(0,(n&0xff)-amt); return '#'+(r<<16|g<<8|bv).toString(16).padStart(6,'0') }
  const darkerBrand = darken(brand.brandColor, 30)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title} — ${schoolName}</title>
<style>
  @page { size: A4 ${orientation}; margin: 8mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:${fontSize}; color:#1a1a1a; background:#fff; }
  .page { page-break-after:always; padding:10px; }
  .page:last-child { page-break-after:auto; }
  .hdr { display:flex; align-items:center; justify-content:space-between; padding-bottom:7px; border-bottom:2px solid ${brand.brandColor}; margin-bottom:7px; }
  .meta { text-align:right; font-size:8px; color:#666; line-height:1.7; }
  .ttl { text-align:center; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
  .subttl { text-align:center; font-size:9px; color:#666; margin-bottom:6px; }
  .date-badge { display:inline-block; margin-bottom:8px; padding:4px 16px; border-radius:20px; background:#f0f0ff; color:${brand.brandColor}; font-size:10px; font-weight:600; }
  table { width:100%; border-collapse:collapse; table-layout:auto; }
  th { background:${brand.brandColor}; color:#fff; padding:5px 8px; font-size:8px; font-weight:700; text-transform:uppercase; border:0.5px solid ${darkerBrand}; white-space:nowrap; }
  td { padding:5px 8px; border:0.5px solid #e5e7eb; vertical-align:middle; white-space:nowrap; }
  tr.alt td { background:#f9fafb; }
  tr.blank td { background:#fafafa; height:20px; }
  .page-footer { margin-top:8px; padding-top:6px; border-top:1px solid #e5e7eb; font-size:8px; color:#94a3b8; }
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
    <div>${isBn ? 'মোট:' : 'Total:'} ${gridData.days.reduce((s, d) => s + d.rows.length, 0)} ${isBn ? 'জন নিয়োগ' : 'assignments'}</div>
    <div>${gridData.days.length} ${isBn ? 'টি দিন' : 'days'}</div>
    <div>A4 · ${orientation}</div>
  </div>
</div>
<div class="ttl">${title}</div>
<div class="subttl">${headerLabel}</div>
${pagesHTML}
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
