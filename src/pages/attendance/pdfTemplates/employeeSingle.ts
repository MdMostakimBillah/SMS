import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

interface Punch {
  time: string
  type: string
}

interface AttendanceRow {
  date: string
  status: string
  punches: Punch[]
}

interface GenSinglePDFParams {
  name: string
  id: string
  photo: string
  designation: string
  deptName: string
  inTime: string
  outTime: string
  rows: AttendanceRow[]
  isBn: boolean
  institutionName?: string
}

export function genSinglePDF(params: GenSinglePDFParams): string {
  const { name, id, photo, designation, deptName, inTime, outTime, rows, isBn } = params
  const brand = getPDFBranding()
  const schoolName = params.institutionName || brand.schoolName
  const present = rows.filter((r) => r.status === 'present').length
  const absent = rows.filter((r) => r.status === 'absent').length
  const leave = rows.filter((r) => r.status === 'on-leave').length
  const lateCount = rows.filter((r) => {
    if (r.status !== 'present') return false
    const firstIn = r.punches.find((p) => p.type === 'in')
    return firstIn && inTime && firstIn.time > inTime
  }).length
  const avgIn = (() => {
    const ins = rows
      .filter((r) => r.status === 'present')
      .map((r) => {
        const f = r.punches.find((p) => p.type === 'in')
        return f ? f.time : null
      })
      .filter(Boolean)
    if (ins.length === 0) return '—'
    const mins = ins.map((t) => parseInt(t!.split(':')[0]) * 60 + parseInt(t!.split(':')[1]))
    const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
    return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`
  })()
  const trs = rows
    .map((r, i) => {
      const c = r.status === 'present' ? '#10b981' : r.status === 'absent' ? '#ef4444' : '#f59e0b'
      const l =
        r.status === 'present'
          ? isBn
            ? 'উপস্থিত'
            : 'Present'
          : r.status === 'absent'
            ? isBn
              ? 'অনুপস্থিত'
              : 'Absent'
            : isBn
              ? 'ছুটিতে'
              : 'Leave'
      const firstIn = r.punches.find((p) => p.type === 'in')
      const lastOut = [...r.punches].reverse().find((p) => p.type === 'out')
      const isLate = firstIn && inTime && firstIn.time > inTime
      const lateBadge = isLate
        ? `<span style="background:#fef3c7;color:#d97706;padding:1px 4px;border-radius:3px;font-size:7px;font-weight:700;margin-left:3px">LATE</span>`
        : ''
      const dayName = new Date(r.date).toLocaleDateString('en', {
        weekday: 'short',
      })
      return `<tr class="${i % 2 === 1 ? 'alt' : ''}">
      <td style="text-align:center;font-size:8px;color:#888">${i + 1}</td>
      <td style="font-size:8px">${r.date} <span style="color:#888;font-size:7px">${dayName}</span></td>
      <td style="font-size:8px;font-family:monospace;text-align:center">${firstIn ? firstIn.time : '—'}</td>
      <td style="font-size:8px;font-family:monospace;text-align:center">${lastOut ? lastOut.time : '—'}</td>
      <td style="text-align:center"><b style="color:${c};font-size:8px">${l}</b>${lateBadge}</td>
    </tr>`
    })
    .join('')
  const photoTag = photo
    ? `<img src="${photo}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid ${brand.brandColor}" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:${brand.brandColor};border:2px solid ${brand.brandColor}">${name.charAt(0)}</div>`
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name} — Attendance</title>
<style>
@page{size:A4 landscape;margin:8mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a;background:#fff}
.page{padding:0}
.hdr{display:flex;align-items:center;gap:14px;padding-bottom:8px;border-bottom:2.5px solid ${brand.brandColor};margin-bottom:10px}
.profile{display:flex;align-items:center;gap:12px;flex:1}
.info h2{font-size:14px;font-weight:700;color:#1e1b4b;margin-bottom:1px}
.info p{font-size:9px;color:#6b7280}
.stats{display:flex;gap:6px;margin-bottom:10px}
.stat{flex:1;text-align:center;padding:6px 4px;border-radius:6px;border:0.5px solid #e5e7eb}
.stat .val{font-size:16px;font-weight:800;margin-bottom:1px}
.stat .lbl{font-size:7px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px}
.stat.green .val{color:#059669}.stat.green{background:#ecfdf5}
.stat.red .val{color:#dc2626}.stat.red{background:#fef2f2}
.stat.amber .val{color:#d97706}.stat.amber{background:#fffbeb}
.stat.blue .val{color:${brand.brandColor}}.stat.blue{background:#eef2ff}
table{width:100%;border-collapse:collapse}
th{background:${brand.brandColor};color:#fff;padding:5px 4px;text-align:left;font-size:8px;font-weight:700;text-transform:uppercase;border:0.5px solid ${brand.brandColor};letter-spacing:0.3px}
td{padding:4px 5px;border:0.5px solid #e5e7eb;font-size:8px}
tr.alt td{background:#f8fafc}
.ftr{margin-top:8px;padding-top:6px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:7px;color:#9ca3af}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="page">
<div class="hdr">
  ${pdfLogoHTML(brand, 36)}
  <div class="profile">
    ${photoTag}
    <div class="info">
      <h2>${name}</h2>
      <p>${id} · ${deptName} · ${designation}</p>
    </div>
  </div>
</div>

<div class="stats">
  <div class="stat green"><div class="val">${present}</div><div class="lbl">${isBn ? 'উপস্থিত' : 'Present'}</div></div>
  <div class="stat red"><div class="val">${absent}</div><div class="lbl">${isBn ? 'অনুপস্থিত' : 'Absent'}</div></div>
  <div class="stat amber"><div class="val">${leave}</div><div class="lbl">${isBn ? 'ছুটিতে' : 'Leave'}</div></div>
  <div class="stat blue"><div class="val">${lateCount}</div><div class="lbl">${isBn ? 'বিলম্ব' : 'Late'}</div></div>
  <div class="stat"><div class="val" style="color:${brand.brandColor}">${avgIn}</div><div class="lbl">${isBn ? 'গড় ইন' : 'Avg In'}</div></div>
</div>

<table>
<thead><tr>
  <th style="width:22px;text-align:center">#</th>
  <th style="width:90px">${isBn ? 'তারিখ' : 'Date'}</th>
  <th style="width:55px;text-align:center">${isBn ? 'ইন' : 'In'}</th>
  <th style="width:55px;text-align:center">${isBn ? 'আউট' : 'Out'}</th>
  <th style="width:65px;text-align:center">${isBn ? 'অবস্থা' : 'Status'}</th>
</tr></thead>
<tbody>${trs}</tbody>
</table>

<div class="ftr">
  <span style="font-size:7px;color:#999">${schoolName} · ${isBn ? 'শিক্ষক উপস্থিতি রিপোর্ট' : 'Staff Attendance Report'}</span>
  <span>${isBn ? 'মুদ্রণ' : 'Printed'}: ${new Date().toLocaleDateString()} · ${rows.length} ${isBn ? 'দিন' : 'days'} · ${isBn ? 'ইন সময়' : 'In Time'}: ${inTime} · ${isBn ? 'আউট সময়' : 'Out Time'}: ${outTime}</span>
</div>
</div></body></html>`
}
