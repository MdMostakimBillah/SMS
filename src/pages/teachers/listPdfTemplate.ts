import type { Teacher } from './types'

export interface TeacherPDFColumn {
  key: string; label: string; labelBn: string; default: boolean
}

export const ALL_TEACHER_PDF_COLUMNS: TeacherPDFColumn[] = [
  { key: 'serial',       label: '#',               labelBn: 'ক্রম',           default: true  },
  { key: 'id',           label: 'Teacher ID',      labelBn: 'শিক্ষক আইডি',    default: true  },
  { key: 'nameEn',       label: 'Name (EN)',       labelBn: 'নাম (ইং)',        default: true  },
  { key: 'nameBn',       label: 'Name (BN)',       labelBn: 'নাম (বাং)',        default: true  },
  { key: 'gender',       label: 'Gender',          labelBn: 'লিঙ্গ',           default: true  },
  { key: 'phone',        label: 'Phone',           labelBn: 'মোবাইল',          default: true  },
  { key: 'email',        label: 'Email',           labelBn: 'ইমেইল',           default: false },
  { key: 'department',   label: 'Department',      labelBn: 'বিভাগ',           default: true  },
  { key: 'designation',  label: 'Designation',     labelBn: 'পদবি',            default: true  },
  { key: 'dob',          label: 'Date of Birth',   labelBn: 'জন্ম তারিখ',     default: false },
  { key: 'bloodGroup',   label: 'Blood Group',     labelBn: 'রক্তের গ্রুপ',   default: false },
  { key: 'religion',     label: 'Religion',        labelBn: 'ধর্ম',            default: false },
  { key: 'qualification',label: 'Qualification',   labelBn: 'যোগ্যতা',         default: false },
  { key: 'experience',   label: 'Experience',      labelBn: 'অভিজ্ঞতা',       default: false },
  { key: 'joiningDate',  label: 'Joining Date',    labelBn: 'যোগদানের তারিখ', default: false },
  { key: 'salary',       label: 'Salary',          labelBn: 'বেতন',            default: true  },
  { key: 'inTime',       label: 'In Time',         labelBn: 'প্রবেশ সময়',    default: false },
  { key: 'outTime',      label: 'Out Time',        labelBn: 'প্রস্থান সময়',  default: false },
  { key: 'status',       label: 'Status',          labelBn: 'অবস্থা',          default: true  },
]

export interface TeacherListPDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  emptyColumns: string[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
}

function getCellValue(t: Teacher, key: string, idx: number, isBn: boolean, departments: {id:string;name:string;nameBn:string}[]): string {
  if (key === 'serial')     return String(idx + 1)
  if (key === 'department') {
    const d = departments.find(x => x.id === t.departmentId)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }
  if (key === 'gender')     return t.gender === 'Male' ? (isBn ? 'পুরুষ' : 'Male') : (isBn ? 'মহিলা' : 'Female')
  if (key === 'status') {
    const m: Record<string, string> = { active: isBn ? 'সক্রিয়' : 'Active', inactive: isBn ? 'নিষ্ক্রিয়' : 'Inactive', 'on-leave': isBn ? 'ছুটিতে' : 'On Leave' }
    return m[t.status] || t.status
  }
  if (key === 'salary')     return t.salary ? `৳${t.salary.toLocaleString()}` : '—'
  return String((t as any)[key] || '—')
}

const statusColor = (st: string) =>
  st === 'active' ? '#10b981' : st === 'inactive' ? '#ef4444' : '#f59e0b'

export function generateTeacherListPDF(
  teachers: Teacher[],
  opts: TeacherListPDFOptions,
  departments: {id:string;name:string;nameBn:string}[]
): string {
  const title         = opts.title        || (opts.isBn ? 'শিক্ষক তালিকা' : 'Teacher List')
  const selectedCols  = opts.selectedCols  || []
  const emptyRows     = opts.emptyRows     || 0
  const emptyColumns  = opts.emptyColumns  || []
  const orientation   = opts.orientation   || 'landscape'
  const isBn          = opts.isBn         ?? false

  const cols = ALL_TEACHER_PDF_COLUMNS.filter(c => selectedCols.includes(c.key))
  const totalCols = cols.length + emptyColumns.length

  const fontSize = orientation === 'landscape'
    ? (totalCols > 12 ? '7.5px' : totalCols > 9 ? '9px' : '10px')
    : (totalCols > 8  ? '7.5px' : totalCols > 6 ? '9px'  : '10px')

  const dataHeaders = cols.map(c => `<th>${isBn ? c.labelBn : c.label}</th>`).join('')
  const extraHeaders = emptyColumns.map(h =>
    `<th style="min-width:85px">${h || (isBn ? '(ফাঁকা)' : '(Empty)')}</th>`
  ).join('')

  const dataRows = teachers.map((t, i) => {
    const cells = cols.map(c => {
      if (c.key === 'status') {
        const col = statusColor(t.status)
        const lbl = getCellValue(t, c.key, i, isBn, departments)
        return `<td><b style="color:${col}">${lbl}</b></td>`
      }
      if (c.key === 'id')
        return `<td><span style="font-family:monospace;font-size:8px;color:#6366f1">${t.id}</span></td>`
      if (c.key === 'nameEn' && isBn)
        return `<td>${t.nameBn || t.nameEn}</td>`
      return `<td>${getCellValue(t, c.key, i, isBn, departments)}</td>`
    }).join('')
    const extra = emptyColumns.map(() => '<td></td>').join('')
    return `<tr class="${i % 2 === 1 ? 'alt' : ''}">${cells}${extra}</tr>`
  }).join('')

  const blankRows = Array.from({ length: emptyRows }, (_, i) => {
    const first = `<td style="color:#bbb;font-size:8px">${teachers.length + i + 1}</td>`
    const rest  = Array(totalCols - 1).fill('<td></td>').join('')
    return `<tr class="er">${first}${rest}</tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Teacher List — EduTech</title>
<style>
  @page { size: A4 ${orientation}; margin: 8mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:${fontSize}; color:#1a1a1a; background:#fff; }
  .hdr  { display:flex; align-items:center; justify-content:space-between; padding-bottom:7px; border-bottom:2px solid #6366f1; margin-bottom:7px; }
  .logo { width:32px; height:32px; background:#6366f1; border-radius:7px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:700; }
  .meta { text-align:right; font-size:8px; color:#666; line-height:1.7; }
  .ttl  { text-align:center; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#6366f1; color:#fff; padding:5px 5px; text-align:left; font-size:8px; font-weight:700; text-transform:uppercase; border:0.5px solid #5356d4; white-space:nowrap; }
  td { padding:4px 5px; border:0.5px solid #e5e7eb; vertical-align:middle; }
  tr.alt td { background:#f9fafb; }
  tr.er td  { background:#fafafa; height:20px; }
  .ftr { margin-top:10px; padding-top:7px; border-top:1px solid #ddd; display:flex; justify-content:space-between; font-size:8px; color:#888; }
  @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="hdr">
  <div style="display:flex;align-items:center;gap:10px">
    <div class="logo">ET</div>
    <div>
      <div style="font-size:13px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div>
      <div style="font-size:8px;color:#888">Dhaka, Bangladesh</div>
    </div>
  </div>
  <div class="meta">
    <div>${isBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div>
    <div>${isBn ? 'মোট:' : 'Total:'} ${teachers.length} ${isBn ? 'জন' : 'teachers'}</div>
    ${emptyColumns.length ? `<div>${isBn ? 'ফাঁকা কলাম:' : 'Empty cols:'} ${emptyColumns.length}</div>` : ''}
    ${emptyRows        ? `<div>${isBn ? 'ফাঁকা সারি:' : 'Empty rows:'} ${emptyRows}</div>` : ''}
    <div>A4 · ${orientation}</div>
  </div>
</div>
<div class="ttl">${title} — ${isBn ? 'শিক্ষাবর্ষ ২০২৫–২৬' : 'Academic Year 2025–26'}</div>
<table>
  <thead><tr>${dataHeaders}${extraHeaders}</tr></thead>
  <tbody>${dataRows}${blankRows}</tbody>
</table>
<div class="ftr">
  <span>EduTech School Management System</span>
  <div style="display:flex;gap:50px">
    <div style="text-align:center"><div style="width:110px;height:1px;background:#333;margin-bottom:3px"></div>${isBn ? 'প্রধান শিক্ষক' : 'Principal'}</div>
    <div style="text-align:center"><div style="width:110px;height:1px;background:#333;margin-bottom:3px"></div>${isBn ? 'অফিস সিল' : 'Office Seal'}</div>
  </div>
</div>
</body>
</html>`
}
