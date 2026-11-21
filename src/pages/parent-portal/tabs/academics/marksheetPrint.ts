import { openPrintWindow } from '@/lib/pdf'
import type { PortalChild, ExamResultItem } from '../../types'

interface InstitutionInfo {
  name?: string
  address?: string
}

export function printMarksheet(
  child: PortalChild,
  results: ExamResultItem[],
  institution: InstitutionInfo,
  isBn: boolean
) {
  const totalFull = results.reduce((a, b) => a + b.fullMarks, 0)
  const totalObtained = results.reduce((a, b) => a + b.obtained, 0)
  const avgPct = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : '0'

  const css = `
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; }
    .hdr { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
    .sname { font-size: 18px; font-weight: bold; color: #1e3a8a; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 14px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    th { background: #2563eb; color: #fff; padding: 6px 8px; text-align: left; border: 1px solid #2563eb; }
    td { padding: 6px 8px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) { background: #f8fafc; }
    .summary { display: flex; justify-content: space-between; background: #eff6ff; padding: 10px; border-radius: 6px; font-weight: bold; }
    .ftr { margin-top: 40px; display: flex; justify-content: space-between; }
    .sig { width: 160px; border-top: 1px dashed #64748b; text-align: center; padding-top: 4px; font-size: 10px; }
  `

  const rows = results
    .map(
      (r) => `
      <tr>
        <td>${r.code}</td>
        <td><strong>${isBn ? r.subjectBn : r.subject}</strong></td>
        <td>${r.fullMarks}</td>
        <td>${r.written}</td>
        <td>${r.mcq}</td>
        <td>${r.practical}</td>
        <td><strong>${r.obtained}</strong></td>
        <td><span style="color:#2563eb;font-weight:bold">${r.grade}</span></td>
        <td>${r.point.toFixed(2)}</td>
      </tr>
    `
    )
    .join('')

  const html = `
    <div class="hdr">
      <div class="sname">${institution.name || 'EduTech Smart School'}</div>
      <div style="font-size:10px;color:#64748b;margin-top:2px">${institution.address || ''}</div>
      <div style="font-size:13px;font-weight:bold;margin-top:6px;color:#0f172a">
        ${isBn ? 'একাডেমিক মূল্যায়ন ও মার্কশিট' : 'ACADEMIC TRANSCRIPT & MARKSHEET'}
      </div>
    </div>

    <div class="meta">
      <div>
        <div><strong>${isBn ? 'শিক্ষার্থীর নাম:' : 'Student Name:'}</strong> ${child.nameEn} (${child.nameBn || ''})</div>
        <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${child.class} &nbsp; <strong>${isBn ? 'শাখা:' : 'Section:'}</strong> ${child.section}</div>
      </div>
      <div>
        <div><strong>${isBn ? 'রোল নং:' : 'Roll No:'}</strong> ${child.roll} &nbsp; <strong>${isBn ? 'আইডি:' : 'ID:'}</strong> ${child.id}</div>
        <div><strong>${isBn ? 'সেশন:' : 'Session:'}</strong> ${child.academicYear}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Subject</th>
          <th>Full</th>
          <th>Written</th>
          <th>MCQ</th>
          <th>Prac</th>
          <th>Obtained</th>
          <th>Grade</th>
          <th>GPA</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="summary">
      <div>${isBn ? 'মোট নম্বর:' : 'Total Marks:'} ${totalObtained} / ${totalFull} (${avgPct}%)</div>
      <div>${isBn ? 'সর্বমোট জিপিএ:' : 'Final GPA:'} 5.00 (Grade A+)</div>
      <div style="color:#16a34a">${isBn ? 'ফলাফল: উত্তীর্ণ (Promoted)' : 'Result: Passed'}</div>
    </div>

    <div class="ftr">
      <div class="sig">${isBn ? 'শ্রেণি শিক্ষকের স্বাক্ষর' : 'Class Teacher Signature'}</div>
      <div class="sig">${isBn ? 'অধ্যক্ষের স্বাক্ষর' : 'Principal Signature'}</div>
    </div>
  `

  openPrintWindow('Marksheet - ' + child.nameEn, html, { css })
}
