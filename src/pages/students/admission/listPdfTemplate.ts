import type { StudentAdmission } from './types'
import type { Teacher } from '@/pages/teachers/types'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { escapeHtml } from '@/lib/sanitize'

export interface PDFColumn {
  key: string
  label: string
  labelBn: string
  default: boolean
}

export const ALL_PDF_COLUMNS: PDFColumn[] = [
  { key: 'serial', label: '#', labelBn: 'ক্রম', default: true },
  { key: 'id', label: 'Student ID', labelBn: 'ছাত্র আইডি', default: true },
  { key: 'nameEn', label: 'Name (EN)', labelBn: 'নাম (ইং)', default: true },
  { key: 'nameBn', label: 'Name (BN)', labelBn: 'নাম (বাং)', default: true },
  { key: 'class', label: 'Class', labelBn: 'শ্রেণি', default: true },
  { key: 'section', label: 'Section', labelBn: 'সেকশন', default: false },
  { key: 'roll', label: 'Roll', labelBn: 'রোল', default: false },
  { key: 'teacherId', label: 'Class Teacher', labelBn: 'শ্রেণি শিক্ষক', default: false },
  { key: 'gender', label: 'Gender', labelBn: 'লিঙ্গ', default: true },
  { key: 'dob', label: 'Date of Birth', labelBn: 'জন্ম তারিখ', default: false },
  { key: 'bloodGroup', label: 'Blood Group', labelBn: 'রক্তের গ্রুপ', default: false },
  { key: 'religion', label: 'Religion', labelBn: 'ধর্ম', default: false },
  { key: 'phone', label: 'Mobile', labelBn: 'মোবাইল', default: true },
  { key: 'email', label: 'Email', labelBn: 'ইমেইল', default: false },
  { key: 'district', label: 'District', labelBn: 'জেলা', default: false },
  { key: 'fatherNameEn', label: "Father's Name", labelBn: 'পিতার নাম', default: false },
  { key: 'fatherPhone', label: "Father's Mobile", labelBn: 'পিতার মোবাইল', default: false },
  { key: 'motherNameEn', label: "Mother's Name", labelBn: 'মাতার নাম', default: false },
  { key: 'admissionDate', label: 'Admission Date', labelBn: 'ভর্তির তারিখ', default: true },
  { key: 'status', label: 'Status', labelBn: 'অবস্থা', default: true },
]

export interface ListPDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  emptyColumns: string[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
  teachers?: Teacher[]
  institutionName?: string
}

function getCellValue(s: StudentAdmission, key: string, idx: number, teachers?: Teacher[]): string {
  if (key === 'serial') return String(idx + 1)
  if (key === 'class') return s.class ? escapeHtml(`Class ${s.class}`) : '—'
  if (key === 'gender') return escapeHtml((s.gender || '').split(' / ')[0] || '—')
  if (key === 'religion') return escapeHtml((s.religion || '').split(' / ')[0] || '—')
  if (key === 'teacherId') {
    if (!s.teacherId || !teachers) return '—'
    const t = teachers.find((t) => t.id === s.teacherId)
    return escapeHtml(t?.nameEn || '—')
  }
  if (key === 'status') {
    const m: Record<string, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }
    return escapeHtml(m[s.status] || s.status)
  }
  return escapeHtml(String((s as any)[key] || '—'))
}

const statusColor = (st: string) => (st === 'approved' ? '#10b981' : st === 'rejected' ? '#ef4444' : '#f59e0b')

export function generateListPDF(students: StudentAdmission[], opts: ListPDFOptions): string {
  // ✅ Defensive defaults so old calls without emptyColumns don't crash
  const isBn = opts.isBn ?? false
  const title = opts.title || (isBn ? 'ছাত্র তালিকা' : 'Student List')
  const selectedCols = opts.selectedCols || []
  const emptyRows = opts.emptyRows || 0
  const emptyColumns = opts.emptyColumns || []
  const orientation = opts.orientation || 'landscape'
  const brand = getPDFBranding()
  const schoolName = opts.institutionName || brand.schoolName

  const statusBn: Record<string, string> = {
    pending: 'অপেক্ষমান',
    approved: 'অনুমোদিত',
    rejected: 'প্রত্যাখ্যাত',
  }

  const cols = ALL_PDF_COLUMNS.filter((c) => selectedCols.includes(c.key))
  const totalCols = cols.length + emptyColumns.length

  const fontSize =
    orientation === 'landscape'
      ? totalCols > 12
        ? '7.5px'
        : totalCols > 9
          ? '9px'
          : '0.625rem'
      : totalCols > 8
        ? '7.5px'
        : totalCols > 6
          ? '9px'
          : '0.625rem'

  // Headers
  const dataHeaders = cols.map((c) => `<th>${escapeHtml(isBn ? c.labelBn : c.label)}</th>`).join('')
  const extraHeaders = emptyColumns.map((h) => `<th>${escapeHtml(h || (isBn ? '(ফাঁকা)' : '(Empty)'))}</th>`).join('')

  // Data rows
  const dataRows = students
    .map((s, i) => {
      const cells = cols
        .map((c) => {
          if (c.key === 'status') {
            const col = statusColor(s.status)
            const lbl = isBn ? escapeHtml(statusBn[s.status] || s.status) : getCellValue(s, c.key, i, opts.teachers)
            return `<td><b style="color:${col}">${lbl}</b></td>`
          }
          if (c.key === 'id') return `<td><span style="font-family:monospace;font-size:8px;color:${brand.brandColor}">${escapeHtml(s.id)}</span></td>`
          if (c.key === 'nameEn' && isBn) return `<td>${escapeHtml(s.nameBn || s.nameEn)}</td>`
          return `<td>${getCellValue(s, c.key, i, opts.teachers)}</td>`
        })
        .join('')
      const extra = emptyColumns.map(() => '<td></td>').join('')
      return `<tr class="${i % 2 === 1 ? 'alt' : ''}">${cells}${extra}</tr>`
    })
    .join('')

  // Blank rows
  const blankRows = Array.from({ length: emptyRows }, (_, i) => {
    const first = `<td style="color:#bbb;font-size:8px">${students.length + i + 1}</td>`
    const rest = Array(totalCols - 1)
      .fill('<td></td>')
      .join('')
    return `<tr class="er">${first}${rest}</tr>`
  }).join('')

  const darken = (hex: string, amt: number) => { const n = parseInt(hex.replace('#',''),16); const r=Math.max(0,(n>>16)-amt), g=Math.max(0,((n>>8)&0xff)-amt), b=Math.max(0,(n&0xff)-amt); return '#'+(r<<16|g<<8|b).toString(16).padStart(6,'0') }
  const darkerBrand = darken(brand.brandColor, 30)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Student List — ${escapeHtml(schoolName)}</title>
<style>
  @page { size: A4 ${orientation}; margin: 8mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:${fontSize}; color:#1a1a1a; background:#fff; }
  .hdr  { display:flex; align-items:center; justify-content:space-between; padding-bottom:7px; border-bottom:2px solid ${brand.brandColor}; margin-bottom:7px; }
  .meta { text-align:right; font-size:8px; color:#666; line-height:1.7; }
  .ttl  { text-align:center; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  table { border-collapse:collapse; table-layout:auto; width:100%; }
  th { background:${brand.brandColor}; color:#fff; padding:5px 8px; text-align:center; font-size:8px; font-weight:700; text-transform:uppercase; border:0.5px solid ${darkerBrand}; white-space:nowrap; }
  td { padding:4px 8px; border:0.5px solid #e5e7eb; vertical-align:middle; text-align:center; white-space:nowrap; }
  tr.alt td { background:#f9fafb; }
  tr.er td  { background:#fafafa; height:20px; }
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
    <div>${isBn ? 'মোট:' : 'Total:'} ${students.length} ${isBn ? 'জন' : 'students'}</div>
    ${emptyColumns.length ? `<div>${isBn ? 'ফাঁকা কলাম:' : 'Empty cols:'} ${emptyColumns.length}</div>` : ''}
    ${emptyRows ? `<div>${isBn ? 'ফাঁকা সারি:' : 'Empty rows:'} ${emptyRows}</div>` : ''}
    <div>A4 · ${orientation}</div>
  </div>
</div>
<div class="ttl">${escapeHtml(title)} — ${isBn ? 'শিক্ষাবর্ষ ২০২৫–২৬' : 'Academic Year 2025–26'}</div>
<table>
  <thead><tr>${dataHeaders}${extraHeaders}</tr></thead>
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
