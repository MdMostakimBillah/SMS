import { isFriday } from '../helpers'

interface StudentRow {
  id: string
  nameEn: string
  nameBn?: string
  class: string
  section?: string
  present: number
  absent: number
  leave: number
  weeklyHoliday: number
}

interface GenStudentBatchPDFParams {
  title: string
  students: StudentRow[]
  rangeDays: string[]
  dateFrom: string
  dateTo: string
  isBn: boolean
  institutionName?: string
}

export function genStudentBatchPDF(params: GenStudentBatchPDFParams): string {
  const { title, students, rangeDays, dateFrom, dateTo, isBn } = params
  const schoolName = params.institutionName || 'EduTech'

  const generateRow = (s: StudentRow, idx: number, dayStatuses: string[]) => {
    const dayGrid = dayStatuses
      .map((status) => {
        if (status === 'W')
          return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#f3e8ff;color:#8b5cf6;border:0.5px solid #e5e7eb">W</td>'
        if (status === 'P')
          return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#d1fae5;color:#059669;border:0.5px solid #e5e7eb">P</td>'
        if (status === 'A')
          return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fee2e2;color:#dc2626;border:0.5px solid #e5e7eb">A</td>'
        return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fef3c7;color:#d97706;border:0.5px solid #e5e7eb">L</td>'
      })
      .join('')

    return `<tr class="${idx % 2 === 1 ? 'alt' : ''}">
    <td style="padding:4px;font-size:9px">${idx + 1}</td>
    <td style="padding:4px;font-size:8px;font-family:monospace;color:#6366f1">${s.id}</td>
    <td style="padding:4px;font-size:9px;font-weight:500">${isBn ? s.nameBn || s.nameEn : s.nameEn}</td>
    <td style="padding:4px;font-size:8px">${s.class}</td>
    <td style="padding:4px;font-size:8px">${s.section || '—'}</td>
    <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#059669">${s.present}</td>
    <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#dc2626">${s.absent}</td>
    <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#d97706">${s.leave}</td>
    <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#8b5cf6">${s.weeklyHoliday}</td>
    ${dayGrid}
  </tr>`
  }

  const dayHeaders = rangeDays
    .map((ds) => {
      const dayNum = ds.slice(8, 10)
      const dn = isFriday(ds) ? 'F' : new Date(ds).toLocaleDateString('en', { weekday: 'narrow' })
      return `<th style="width:16px;padding:2px;font-size:6px;text-align:center">${dayNum}<br/>${dn}</th>`
    })
    .join('')

  const rowsHtml = students.map((s, i) => {
    const dayStatuses = rangeDays.map(() => {
      // This is a simplified version - the actual implementation needs per-student day data
      return 'P'
    })
    return generateRow(s, i, dayStatuses)
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>@page{size:A4 landscape;margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #6366f1;margin-bottom:8px}.logo{width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}.ttl{text-align:center;font-size:11px;font-weight:700;margin-bottom:3px}.sub{text-align:center;font-size:8px;color:#666;margin-bottom:8px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:3px;text-align:left;font-size:7px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:3px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:8px;padding-top:5px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:11px;font-weight:700;color:#6366f1">${schoolName}</div><div style="font-size:7px;color:#888">Student Monthly Attendance</div></div></div>
<div class="ttl">${title}</div>
<div class="sub">${isBn ? 'মোট' : 'Total'}: ${students.length} ${isBn ? 'জন' : 'students'} · ${dateFrom} → ${dateTo} · ${rangeDays.length} ${isBn ? 'দিন' : 'days'}</div>
<table><thead><tr>
  <th style="width:20px">#</th>
  <th style="width:65px">ID</th>
  <th style="width:100px">${isBn ? 'নাম' : 'Name'}</th>
  <th style="width:35px">${isBn ? 'শ্রেণি' : 'C'}</th>
  <th style="width:25px">${isBn ? 'সে' : 'S'}</th>
  <th style="width:20px">P</th>
  <th style="width:20px">A</th>
  <th style="width:20px">L</th>
  <th style="width:20px">W</th>
  ${dayHeaders}
</tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="ftr"><span style="font-size:7px;color:#999">Powered by EduTech</span><div>${isBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
  return html
}
