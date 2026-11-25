import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { escapeHtml } from '@/lib/sanitize'
import { getGradeLetter, getGpa } from '@/lib/grades'
import type { PortalChild, ExamResultItem } from '../../types'

interface InstitutionInfo {
  name?: string
  nameBn?: string
  address?: string
}

export function printMarksheet(
  child: PortalChild,
  results: ExamResultItem[],
  institution: InstitutionInfo,
  isBn: boolean,
  examTitle?: string
) {
  const brand = getPDFBranding()
  const totalFull = results.reduce((a, b) => a + b.fullMarks, 0)
  const totalObtained = results.reduce((a, b) => a + b.obtained, 0)
  const avgPct = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : '0.0'
  const isAllPassed = results.length > 0 && results.every((r) => r.status === 'passed')
  const finalGpa =
    results.length === 0
      ? '0.00'
      : isAllPassed
      ? (results.reduce((acc, r) => acc + (r.point || 0), 0) / results.length).toFixed(2)
      : '0.00'
  const overallGrade = isAllPassed ? getGradeLetter(Number(avgPct)) : 'F'
  const avgPoint = Number(finalGpa)
  const resolvedGpaGrade = isAllPassed
    ? avgPoint >= 5.0 ? 'A+' : avgPoint >= 4.0 ? 'A' : avgPoint >= 3.5 ? 'A-' : avgPoint >= 3.0 ? 'B' : avgPoint >= 2.0 ? 'C' : avgPoint >= 1.0 ? 'D' : overallGrade
    : 'F'

  const instName = (isBn ? institution.nameBn || institution.name : institution.name) || brand.schoolName || 'EduTech Smart School'
  const instAddr = institution.address || brand.address || ''
  const logoHtml = pdfLogoHTML(brand, 40)

  const css = `
    @page { size: A4 portrait; margin: 14mm; }
    body { font-family: 'Inter', 'Noto Sans Bengali', 'Segoe UI', sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; }
    .hdr { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid ${brand.brandColor}; padding-bottom: 10px; margin-bottom: 14px; }
    .hdr-text { flex: 1; text-align: center; }
    .sname { font-size: 18px; font-weight: 700; color: ${brand.brandColor}; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 14px; background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    th { background: ${brand.brandColor}; color: #fff; padding: 7px 8px; text-align: left; border: 1px solid ${brand.brandColor}; font-weight: 600; }
    td { padding: 6px 8px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) { background: #f8fafc; }
    .summary { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 12px; border-radius: 6px; font-weight: 700; }
    .ftr { margin-top: 44px; display: flex; justify-content: space-between; }
    .sig { width: 160px; border-top: 1px dashed #64748b; text-align: center; padding-top: 4px; font-size: 10px; color: #475569; }
  `

  const rows = results
    .map((r) => {
      const pct = r.fullMarks > 0 ? (r.obtained / r.fullMarks) * 100 : 0
      const pt = typeof r.point === 'number' ? r.point : getGpa(pct, r.status === 'passed')
      const gradeColor = r.grade === 'F' ? '#dc2626' : brand.brandColor
      return `
      <tr>
        <td>${escapeHtml(r.code || '—')}</td>
        <td><strong>${escapeHtml(isBn ? r.subjectBn : r.subject)}</strong></td>
        <td>${r.fullMarks}</td>
        <td>${r.written}</td>
        <td>${r.mcq}</td>
        <td>${r.practical}</td>
        <td><strong>${r.obtained}</strong></td>
        <td><span style="color:${gradeColor};font-weight:700">${escapeHtml(r.grade)}</span></td>
        <td>${pt.toFixed(2)}</td>
      </tr>
    `
    })
    .join('')

  const statusColor = isAllPassed ? '#16a34a' : '#dc2626'
  const statusLabel = isAllPassed
    ? isBn ? 'ফলাফল: উত্তীর্ণ' : 'Result: Passed'
    : isBn ? 'ফলাফল: অকৃতকার্য' : 'Result: Failed'

  const html = `
    <div class="hdr">
      ${logoHtml}
      <div class="hdr-text">
        <div class="sname">${escapeHtml(instName)}</div>
        ${instAddr ? `<div style="font-size:10px;color:#64748b;margin-top:2px">${escapeHtml(instAddr)}</div>` : ''}
        <div style="font-size:12.5px;font-weight:700;margin-top:5px;color:#0f172a">
          ${escapeHtml(examTitle || (isBn ? 'একাডেমিক মূল্যায়ন ও মার্কশিট' : 'ACADEMIC TRANSCRIPT & MARKSHEET'))}
        </div>
      </div>
      <div style="width:40px"></div>
    </div>

    <div class="meta">
      <div>
        <div><strong>${isBn ? 'শিক্ষার্থীর নাম:' : 'Student Name:'}</strong> ${escapeHtml(child.nameEn)}${child.nameBn && child.nameBn !== child.nameEn ? ` (${escapeHtml(child.nameBn)})` : ''}</div>
        <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${escapeHtml(child.class)} &nbsp; <strong>${isBn ? 'শাখা:' : 'Section:'}</strong> ${escapeHtml(child.section || '—')}</div>
      </div>
      <div style="text-align:right">
        <div><strong>${isBn ? 'রোল নং:' : 'Roll No:'}</strong> ${escapeHtml(child.roll || '—')} &nbsp; <strong>${isBn ? 'আইডি:' : 'ID:'}</strong> ${escapeHtml(child.id)}</div>
        <div><strong>${isBn ? 'সেশন:' : 'Session:'}</strong> ${escapeHtml(child.academicYear || '—')}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>${isBn ? 'কোড' : 'Code'}</th>
          <th>${isBn ? 'বিষয়' : 'Subject'}</th>
          <th>${isBn ? 'পূর্ণমান' : 'Full'}</th>
          <th>${isBn ? 'লিখিত' : 'Written'}</th>
          <th>${isBn ? 'এমসিকিউ' : 'MCQ'}</th>
          <th>${isBn ? 'ব্যবহারিক' : 'Practical'}</th>
          <th>${isBn ? 'প্রাপ্ত' : 'Obtained'}</th>
          <th>${isBn ? 'গ্রেড' : 'Grade'}</th>
          <th>${isBn ? 'জিপিএ' : 'GPA'}</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="summary">
      <div>${isBn ? 'মোট নম্বর:' : 'Total Marks:'} ${totalObtained} / ${totalFull} (${avgPct}%)</div>
      <div>${isBn ? 'অর্জিত জিপিএ:' : 'Final GPA:'} ${finalGpa} (${isBn ? 'গ্রেড' : 'Grade'} ${resolvedGpaGrade})</div>
      <div style="color:${statusColor}">${statusLabel}</div>
    </div>

    <div class="ftr">
      <div class="sig">${isBn ? 'শ্রেণি শিক্ষকের স্বাক্ষর' : 'Class Teacher Signature'}</div>
      <div class="sig">${isBn ? 'অধ্যক্ষের স্বাক্ষর' : 'Principal Signature'}</div>
    </div>
  `

  openPrintWindow('Marksheet - ' + child.nameEn, html, { css })
}
