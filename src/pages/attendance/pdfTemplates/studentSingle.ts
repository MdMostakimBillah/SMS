import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

interface StudentDayRow {
  date: string
  status: string
  punches: { time: string; type: string }[]
  isWeeklyHoliday?: boolean
}

interface GenStudentSinglePDFParams {
  name: string
  id: string
  className: string
  section: string
  rows: StudentDayRow[]
  isBn: boolean
  institutionName?: string
}

export function genStudentSinglePDF(params: GenStudentSinglePDFParams): string {
  const { name, id, className, section, rows, isBn } = params
  const brand = getPDFBranding()
  const schoolName = params.institutionName || brand.schoolName
  const trs = rows
    .map((r, i) => {
      let c: string, l: string
      if (r.isWeeklyHoliday) {
        c = '#8b5cf6'
        l = isBn ? 'সাপ্তাহিক ছুটি' : 'Weekly Holiday'
      } else if (r.status === 'present') {
        c = '#10b981'
        l = isBn ? 'উপস্থিত' : 'Present'
      } else if (r.status === 'absent') {
        c = '#ef4444'
        l = isBn ? 'অনুপস্থিত' : 'Absent'
      } else {
        c = '#f59e0b'
        l = isBn ? 'ছুটিতে' : 'Leave'
      }
      return `<tr class="${i % 2 === 1 ? 'alt' : ''}"><td>${i + 1}</td><td>${r.date}</td><td><b style="color:${c}">${l}</b></td></tr>`
    })
    .join('')
  const present = rows.filter((r) => r.status === 'present').length
  const absent = rows.filter((r) => r.status === 'absent').length
  const leave = rows.filter((r) => r.status === 'on-leave' && !r.isWeeklyHoliday).length
  const weeklyHoliday = rows.filter((r) => r.isWeeklyHoliday).length
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>@page{size:A4 portrait;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid ${brand.brandColor};margin-bottom:10px}.ttl{text-align:center;font-size:13px;font-weight:700;margin-bottom:4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:10px}table{width:100%;border-collapse:collapse}th{background:${brand.brandColor};color:#fff;padding:5px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border:0.5px solid ${brand.brandColor}}td{padding:4px 5px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:12px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr">${pdfLogoHTML(brand)}<div><div style="font-size:13px;font-weight:700;color:${brand.brandColor}">${schoolName}</div><div style="font-size:8px;color:#888">Individual Student Attendance Report</div></div></div>
<div class="ttl">${name} (${id})</div>
<div class="sub">${isBn ? 'শ্রেণি' : 'Class'}: ${className} · ${isBn ? 'সেকশন' : 'Section'}: ${section} · ${isBn ? 'মোট' : 'Total'}: ${rows.length} ${isBn ? 'দিন' : 'days'} · ✅ ${present} · ❌ ${absent} · ⏳ ${leave} · 📅 ${weeklyHoliday}</div>
<table><thead><tr><th>#</th><th>${isBn ? 'তারিখ' : 'Date'}</th><th>${isBn ? 'অবস্থা' : 'Status'}</th></tr></thead><tbody>${trs}</tbody></table>
<div class="ftr"><span style="font-size:7px;color:#999">Powered by EduTech</span><div>${isBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
}
