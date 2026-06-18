interface Student {
  id: string
  nameEn: string
  roll?: string
}

interface AttendanceParams {
  classId: string
  sectionId: string
  date: string
  shift: string
  present: Student[]
  absent: Student[]
  totalStudents: number
  institutionName?: string
}

export function generateAttendanceSheetHTML(params: AttendanceParams): string {
  const { classId, sectionId, date, shift, present, absent, totalStudents } = params
  const attendanceRate = totalStudents > 0 ? Math.round((present.length / totalStudents) * 100) : 0
  const schoolName = params.institutionName || 'EduTech'

  return `<!DOCTYPE html><html><head><title>Attendance - ${classId} ${sectionId} ${date}</title>
<style>
  @page{size:A4 portrait;margin:15mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:0}
  .header{text-align:center;margin-bottom:16px;border-bottom:2px solid #6366f1;padding-bottom:10px}
  .school{font-size:18px;font-weight:700;color:#6366f1}
  .sub{font-size:11px;color:#666}
  .title{font-size:14px;font-weight:700;margin:10px 0;background:#6366f1;color:#fff;padding:6px;border-radius:4px}
  .info{display:flex;justify-content:space-between;font-size:11px;margin-bottom:12px;color:#444}
  table{width:100%;border-collapse:collapse}
  th{background:#eef2ff;color:#6366f1;font-size:10px;padding:6px 8px;text-align:left;border:1px solid #c7d2fe}
  td{padding:5px 8px;border:1px solid #e5e7eb;font-size:11px}
  tr:nth-child(even){background:#f9fafb}
  .present{color:#10b981;font-weight:600}
  .absent{color:#ef4444;font-weight:600}
  .summary{margin-top:16px;display:flex;gap:16px;font-size:11px}
  .summary-box{padding:6px 12px;border-radius:6px;border:1px solid #e5e7eb}
  .footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:10px;color:#888}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <div class="school">${schoolName}</div>
  <div class="sub">Sunrise Academy, Dhaka, Bangladesh</div>
</div>
<div class="title">Exam Attendance Report / পরীক্ষার উপস্থিতি রিপোর্ট</div>
<div class="info">
  <span><b>Class:</b> ${classId} - ${sectionId}</span>
  <span><b>Date:</b> ${date}</span>
  <span><b>Shift:</b> ${shift || 'N/A'}</span>
</div>
<table>
  <thead><tr><th>#</th><th>Roll</th><th>Student Name</th><th>Student ID</th><th>Status</th></tr></thead>
  <tbody>
    ${present.map((s, i) => `<tr><td>${i + 1}</td><td>${s.roll || '-'}</td><td>${s.nameEn}</td><td>${s.id}</td><td class="present">Present / উপস্থিত</td></tr>`).join('')}
    ${absent.map((s, i) => `<tr><td>${present.length + i + 1}</td><td>${s.roll || '-'}</td><td>${s.nameEn}</td><td>${s.id}</td><td class="absent">Absent / অনুপস্থিত</td></tr>`).join('')}
  </tbody>
</table>
<div class="summary">
  <div class="summary-box"><b>Total Students:</b> ${totalStudents}</div>
  <div class="summary-box"><b>Present:</b> ${present.length}</div>
  <div class="summary-box"><b>Absent:</b> ${absent.length}</div>
  <div class="summary-box"><b>Attendance Rate:</b> ${attendanceRate}%</div>
</div>
<div class="footer">
  <span>Generated on ${new Date().toLocaleDateString()}</span>
  <span>Principal's Signature: _______________</span>
</div>
</body></html>`
}
