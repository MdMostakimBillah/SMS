export interface HRPDFColumn {
  key: string; label: string; labelBn: string; default: boolean
}

export const HR_INCREMENT_COLUMNS: HRPDFColumn[] = [
  { key: 'serial',    label: '#',           labelBn: 'ক্রম',       default: true  },
  { key: 'date',      label: 'Date',        labelBn: 'তারিখ',     default: true  },
  { key: 'teacher',   label: 'Teacher',     labelBn: 'শিক্ষক',     default: true  },
  { key: 'type',      label: 'Type',        labelBn: 'ধরন',       default: true  },
  { key: 'percent',   label: '%',           labelBn: 'শতাংশ',     default: true  },
  { key: 'amount',    label: 'Amount',      labelBn: 'পরিমাণ',    default: true  },
  { key: 'reason',    label: 'Reason',      labelBn: 'কারণ',       default: false },
]

export const HR_BONUS_COLUMNS: HRPDFColumn[] = [
  { key: 'serial',    label: '#',           labelBn: 'ক্রম',       default: true  },
  { key: 'month',     label: 'Month',       labelBn: 'মাস',        default: true  },
  { key: 'teacher',   label: 'Teacher',     labelBn: 'শিক্ষক',     default: true  },
  { key: 'type',      label: 'Type',        labelBn: 'ধরন',       default: true  },
  { key: 'amount',    label: 'Amount',      labelBn: 'পরিমাণ',    default: true  },
  { key: 'reason',    label: 'Reason',      labelBn: 'কারণ',       default: false },
]

export const HR_PROMOTION_COLUMNS: HRPDFColumn[] = [
  { key: 'serial',    label: '#',           labelBn: 'ক্রম',       default: true  },
  { key: 'teacher',   label: 'Teacher',     labelBn: 'শিক্ষক',     default: true  },
  { key: 'from',      label: 'From',        labelBn: 'বর্তমান',   default: true  },
  { key: 'to',        label: 'To',          labelBn: 'নতুন',       default: true  },
  { key: 'date',      label: 'Date',        labelBn: 'তারিখ',     default: true  },
  { key: 'reason',    label: 'Reason',      labelBn: 'কারণ',       default: false },
]

export const HR_FUND_COLUMNS: HRPDFColumn[] = [
  { key: 'serial',    label: '#',           labelBn: 'ক্রম',       default: true  },
  { key: 'date',      label: 'Date',        labelBn: 'তারিখ',     default: true  },
  { key: 'type',      label: 'Type',        labelBn: 'ধরন',       default: true  },
  { key: 'amount',    label: 'Amount',      labelBn: 'পরিমাণ',    default: true  },
  { key: 'desc',      label: 'Description', labelBn: 'বিবরণ',     default: true  },
]

export interface HRListPDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  emptyColumns: string[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
}

const fundTypeLabel = (t: string, isBn: boolean) => {
  const m: Record<string, string> = {
    contribution: isBn ? 'অনুদান' : 'Contribution',
    withdrawal: isBn ? 'উত্তোলন' : 'Withdrawal',
    bonus_pool: isBn ? 'বোনাস পুল' : 'Bonus Pool',
    increment_pool: isBn ? 'বৃদ্ধি পুল' : 'Increment Pool',
  }
  return m[t] || t
}

const fundTypeColor = (t: string) =>
  t === 'withdrawal' ? '#ef4444' : '#10b981'

function getIncrementCell(row: any, key: string, idx: number, isBn: boolean, getTeacherName: (id: string) => string): string {
  if (key === 'serial') return String(idx + 1)
  if (key === 'teacher') return getTeacherName(row.teacherId)
  if (key === 'type') {
    const m: Record<string, string> = { annual: isBn ? 'বার্ষিক' : 'Annual', performance: isBn ? 'কর্মদক্ষতা' : 'Performance', special: isBn ? 'বিশেষ' : 'Special' }
    return m[row.type] || row.type
  }
  if (key === 'percent') return `${row.percentage}%`
  if (key === 'amount') return `৳${row.amount.toLocaleString()}`
  return String(row[key] || '—')
}

function getBonusCell(row: any, key: string, idx: number, isBn: boolean, getTeacherName: (id: string) => string): string {
  if (key === 'serial') return String(idx + 1)
  if (key === 'teacher') return getTeacherName(row.teacherId)
  if (key === 'type') {
    const m: Record<string, string> = { festival: isBn ? 'উৎসব' : 'Festival', performance: isBn ? 'কর্মদক্ষতা' : 'Performance', attendance: isBn ? 'উপস্থিতি' : 'Attendance', special: isBn ? 'বিশেষ' : 'Special' }
    return m[row.type] || row.type
  }
  if (key === 'amount') return `৳${row.amount.toLocaleString()}`
  return String(row[key] || '—')
}

function getPromotionCell(row: any, key: string, idx: number, isBn: boolean, getTeacherName: (id: string) => string): string {
  if (key === 'serial') return String(idx + 1)
  if (key === 'teacher') return getTeacherName(row.teacherId)
  if (key === 'from') return row.fromDesignation
  if (key === 'to') return row.toDesignation
  return String(row[key] || '—')
}

function getFundCell(row: any, key: string, idx: number, isBn: boolean): string {
  if (key === 'serial') return String(idx + 1)
  if (key === 'type') return fundTypeLabel(row.type, isBn)
  if (key === 'amount') return `${row.type === 'withdrawal' ? '-' : '+'}৳${row.amount.toLocaleString()}`
  if (key === 'desc') return row.description
  return String(row[key] || '—')
}

function buildPDF(
  title: string,
  data: any[],
  cols: HRPDFColumn[],
  opts: HRListPDFOptions,
  getCellFn: (row: any, key: string, idx: number, isBn: boolean) => string,
  countLabel: string,
): string {
  const isBn = opts.isBn
  const orientation = opts.orientation
  const totalCols = cols.length + opts.emptyColumns.length

  const fontSize = orientation === 'landscape'
    ? (totalCols > 12 ? '7.5px' : totalCols > 9 ? '9px' : '10px')
    : (totalCols > 8 ? '7.5px' : totalCols > 6 ? '9px' : '10px')

  const dataHeaders = cols.map(c => `<th>${isBn ? c.labelBn : c.label}</th>`).join('')
  const extraHeaders = opts.emptyColumns.map(h =>
    `<th style="min-width:85px">${h || (isBn ? '(ফাঁকা)' : '(Empty)')}</th>`
  ).join('')

  const dataRows = data.map((row, i) => {
    const cells = cols.map(c => {
      if (c.key === 'amount') {
        const val = getCellFn(row, c.key, i, isBn)
        const isNeg = val.startsWith('-')
        return `<td><b style="color:${isNeg ? '#ef4444' : '#10b981'}">${val}</b></td>`
      }
      if (c.key === 'type' && row.type) {
        const val = getCellFn(row, c.key, i, isBn)
        return `<td><span style="background:#f3f4f6;padding:1px 5px;border-radius:3px;font-size:7px">${val}</span></td>`
      }
      return `<td>${getCellFn(row, c.key, i, isBn)}</td>`
    }).join('')
    const extra = opts.emptyColumns.map(() => '<td></td>').join('')
    return `<tr class="${i % 2 === 1 ? 'alt' : ''}">${cells}${extra}</tr>`
  }).join('')

  const blankRows = Array.from({ length: opts.emptyRows }, (_, i) => {
    const first = `<td style="color:#bbb;font-size:8px">${data.length + i + 1}</td>`
    const rest = Array(totalCols - 1).fill('<td></td>').join('')
    return `<tr class="er">${first}${rest}</tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title} — EduTech</title>
<style>
  @page { size: A4 ${orientation}; margin: 8mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:${fontSize}; color:#1a1a1a; background:#fff; }
  .hdr { display:flex; align-items:center; justify-content:space-between; padding-bottom:7px; border-bottom:2px solid #6366f1; margin-bottom:7px; }
  .logo { width:32px; height:32px; background:#6366f1; border-radius:7px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:700; }
  .meta { text-align:right; font-size:8px; color:#666; line-height:1.7; }
  .ttl { text-align:center; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#6366f1; color:#fff; padding:5px 5px; text-align:left; font-size:8px; font-weight:700; text-transform:uppercase; border:0.5px solid #5356d4; white-space:nowrap; }
  td { padding:4px 5px; border:0.5px solid #e5e7eb; vertical-align:middle; }
  tr.alt td { background:#f9fafb; }
  tr.er td { background:#fafafa; height:20px; }
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
    <div>${isBn ? 'মোট:' : 'Total:'} ${data.length} ${countLabel}</div>
    ${opts.emptyColumns.length ? `<div>${isBn ? 'ফাঁকা কলাম:' : 'Empty cols:'} ${opts.emptyColumns.length}</div>` : ''}
    ${opts.emptyRows ? `<div>${isBn ? 'ফাঁকা সারি:' : 'Empty rows:'} ${opts.emptyRows}</div>` : ''}
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

export function generateIncrementPDF(data: any[], opts: HRListPDFOptions, getTeacherName: (id: string) => string): string {
  const cols = HR_INCREMENT_COLUMNS.filter(c => opts.selectedCols.includes(c.key))
  return buildPDF(opts.title, data, cols, opts, (row, key, i, isBn) => getIncrementCell(row, key, i, isBn, getTeacherName), isBnLabel('জন', opts.isBn))
}

export function generateBonusPDF(data: any[], opts: HRListPDFOptions, getTeacherName: (id: string) => string): string {
  const cols = HR_BONUS_COLUMNS.filter(c => opts.selectedCols.includes(c.key))
  return buildPDF(opts.title, data, cols, opts, (row, key, i, isBn) => getBonusCell(row, key, i, isBn, getTeacherName), isBnLabel('জন', opts.isBn))
}

export function generatePromotionPDF(data: any[], opts: HRListPDFOptions, getTeacherName: (id: string) => string): string {
  const cols = HR_PROMOTION_COLUMNS.filter(c => opts.selectedCols.includes(c.key))
  return buildPDF(opts.title, data, cols, opts, (row, key, i, isBn) => getPromotionCell(row, key, i, isBn, getTeacherName), isBnLabel('জন', opts.isBn))
}

export function generateFundPDF(data: any[], opts: HRListPDFOptions): string {
  const cols = HR_FUND_COLUMNS.filter(c => opts.selectedCols.includes(c.key))
  return buildPDF(opts.title, data, cols, opts, (row, key, i, isBn) => getFundCell(row, key, i, isBn), isBnLabel('টি', opts.isBn))
}

function isBnLabel(bn: string, en: string): string { return en ? bn : en }
