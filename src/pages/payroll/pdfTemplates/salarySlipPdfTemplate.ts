import { getBrandColor } from '@/lib/pdf'

export interface SalarySlipEmployee {
  id: string
  nameEn: string
  nameBn?: string
  departmentId: string
  designation?: string
  salary: number
  overtime?: number
  facilityTotal: number
  facilityDetails: { name: string; nameBn: string; amount: number }[]
  bonus: number
  festivalBonus: number
  applyDeductionRule: boolean
  fundContributionPercent: number
}

export interface SalarySlipPdfOptions {
  orientation: 'portrait' | 'landscape'
  isBn: boolean
}

export const ALL_SALARY_SLIP_PDF_COLUMNS = [
  { key: 'slip', label: 'Salary Slip', labelBn: 'বেতন পর্চি', default: true },
]

function calcSalary(t: SalarySlipEmployee) {
  const basic = t.salary
  const house = Math.round(basic * 0.15)
  const medical = Math.round(basic * 0.1)
  const conveyance = Math.round(basic * 0.05)
  const bonusVal = t.bonus || 0
  const overtimeVal = t.overtime || 0
  const festivalVal = t.festivalBonus || 0
  const facilityTotal = t.facilityTotal || 0
  const deductionAmount = t.applyDeductionRule ? Math.round(basic / 30) : 0
  const fundAmount = Math.round((basic * (t.fundContributionPercent || 0)) / 100)
  const gross = basic + house + medical + conveyance + bonusVal + overtimeVal + festivalVal + facilityTotal
  const totalDeduction = deductionAmount + fundAmount
  const net = gross - totalDeduction
  return { basic, house, medical, conveyance, bonusVal, overtimeVal, festivalVal, facilityTotal, deductionAmount, fundAmount, gross, totalDeduction, net }
}

function singleSlipHTML(t: SalarySlipEmployee, month: string, isBn: boolean, brand: string): string {
  const s = calcSalary(t)
  const facilityRows = t.facilityDetails
    .map((f) => `<tr><td>${isBn ? f.nameBn : f.name}</td><td style="text-align:right">৳${f.amount.toLocaleString()}</td></tr>`)
    .join('')

  return `<div class="slip">
    <div class="header">
      <div style="display:flex;align-items:center;gap:6px">
        <div class="logo-box" style="background:${brand}">ET</div>
        <div class="school"><h1 style="color:${brand}">EduTech School</h1><p>Sunrise Academy</p></div>
      </div>
      <div style="text-align:right"><div style="font-size:7px;color:#666">${isBn ? 'বেতন পর্চি' : 'Payslip For'}</div><div style="font-size:10px;font-weight:700;color:${brand}">${month}</div></div>
    </div>
    <div class="title" style="background:${brand}">SALARY SLIP / বেতন পর্চি</div>
    <div class="info-row">
      <div class="info-item"><div class="label">ID</div><div class="value" style="color:${brand}">${t.id}</div></div>
      <div class="info-item"><div class="label">${isBn ? 'নাম' : 'Name'}</div><div class="value" style="color:${brand}">${t.nameEn}</div></div>
      <div class="info-item"><div class="label">${isBn ? 'বিভাগ' : 'Dept'}</div><div class="value" style="color:${brand}">${t.departmentId}</div></div>
      <div class="info-item"><div class="label">${isBn ? 'পদবি' : 'Designation'}</div><div class="value" style="color:${brand}">${t.designation || '—'}</div></div>
    </div>
    <div style="display:flex;gap:12px">
      <div class="section" style="flex:1">
        <div class="section-title" style="color:${brand}">${isBn ? 'আয়' : 'Earnings'}</div>
        <table>
          <tr><td>${isBn ? 'মূল বেতন' : 'Basic Salary'}</td><td>৳${s.basic.toLocaleString()}</td></tr>
          <tr><td>${isBn ? 'বাসা ভাড়া (১৫%)' : 'House Rent (15%)'}</td><td>৳${s.house.toLocaleString()}</td></tr>
          <tr><td>${isBn ? 'চিকিৎসা (১০%)' : 'Medical (10%)'}</td><td>৳${s.medical.toLocaleString()}</td></tr>
          <tr><td>${isBn ? 'যাতায়াত (৫%)' : 'Conveyance (5%)'}</td><td>৳${s.conveyance.toLocaleString()}</td></tr>
          ${s.bonusVal > 0 ? `<tr><td>${isBn ? 'বোনাস' : 'Bonus'}</td><td>৳${s.bonusVal.toLocaleString()}</td></tr>` : ''}
          ${s.overtimeVal > 0 ? `<tr><td>${isBn ? 'ওভারটাইম' : 'Overtime'}</td><td>৳${s.overtimeVal.toLocaleString()}</td></tr>` : ''}
          ${s.festivalVal > 0 ? `<tr><td>${isBn ? 'উৎসব বোনাস' : 'Festival Bonus'}</td><td>৳${s.festivalVal.toLocaleString()}</td></tr>` : ''}
          ${facilityRows}
          <tr class="total"><td>${isBn ? 'মোট আয়' : 'Gross Earnings'}</td><td>৳${s.gross.toLocaleString()}</td></tr>
        </table>
      </div>
      <div class="section" style="flex:1">
        <div class="section-title" style="color:${brand}">${isBn ? 'কাটা' : 'Deductions'}</div>
        <table>
          ${s.deductionAmount > 0 ? `<tr><td>${isBn ? 'বেতন কাটা (১ দিন)' : 'Salary Deduction (1 day)'}</td><td>-৳${s.deductionAmount.toLocaleString()}</td></tr>` : ''}
          ${s.fundAmount > 0 ? `<tr><td>${isBn ? 'তহবিল অংশদান' : 'Fund Contribution'}</td><td>-৳${s.fundAmount.toLocaleString()}</td></tr>` : ''}
          <tr class="total"><td>${isBn ? 'মোট কাটা' : 'Total Deductions'}</td><td>-৳${s.totalDeduction.toLocaleString()}</td></tr>
        </table>
      </div>
    </div>
    <div class="section">
      <table>
        <tr class="net"><td>${isBn ? 'নেট বেতন' : 'NET SALARY'}</td><td>৳${s.net.toLocaleString()}</td></tr>
      </table>
    </div>
    <div class="footer">
      <div class="sign-line"><div class="line"></div><div class="sign-label">${isBn ? 'অ্যাডমিন অনুমোদন' : 'Admin Approval'}</div></div>
      <div style="text-align:center;font-size:7px;color:#888"><div>Date: ___________</div></div>
      <div class="sign-line"><div class="line"></div><div class="sign-label">${isBn ? 'কর্মচারীর স্বাক্ষর' : 'Employee Signature'}</div></div>
    </div>
  </div>`
}

export function generateSingleSalarySlipPDF(
  employee: SalarySlipEmployee,
  month: string,
  opts: SalarySlipPdfOptions
): string {
  const brand = getBrandColor()
  const isBn = opts.isBn
  const orientation = opts.orientation || 'portrait'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payslip - ${employee.id}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page{size:${orientation};margin:10mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial','Noto Serif Bengali',sans-serif;color:#1a1a1a;font-size:11px;background:#fff;padding:10px}
  .slip{border:1.5px solid #c7d2fe;border-radius:8px;padding:12px;max-width:190mm;margin:0 auto}
  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid ${brand}}
  .logo-box{width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}
  .school h1{font-size:12px;font-weight:700}
  .school p{font-size:8px;color:#666}
  .title{text-align:center;font-size:10px;font-weight:700;color:#fff;padding:5px;margin-bottom:8px;border-radius:4px;letter-spacing:1px}
  .info-row{display:flex;justify-content:space-between;background:#eef2ff;padding:5px 8px;border-radius:6px;margin-bottom:8px;border:1px solid #c7d2fe}
  .info-item .label{font-size:7px;color:#666;text-transform:uppercase}
  .info-item .value{font-size:10px;font-weight:700}
  .section{margin-bottom:6px}
  .section-title{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e0e7ff;padding-bottom:2px;margin-bottom:4px}
  table{width:100%;border-collapse:collapse}
  td{padding:2px 6px;border-bottom:0.5px solid #eee;font-size:9px}
  td:first-child{font-weight:500;color:#555;width:50%}
  td:last-child{text-align:right;font-weight:600}
  .total td{border-top:1.5px solid ${brand};font-weight:700;font-size:10px;color:#1a1a1a}
  .net td{background:#eef2ff;font-size:11px;font-weight:700}
  .footer{margin-top:10px;padding-top:6px;border-top:1px solid #ddd;display:flex;justify-content:space-between}
  .sign-line{text-align:center}
  .sign-line .line{width:80px;height:1px;background:#333;margin:12px auto 3px}
  .sign-label{font-size:7px;color:#555}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
${singleSlipHTML(employee, month, isBn, brand)}
</body></html>`
}

export function generateAllSalarySlipsPDF(
  employees: SalarySlipEmployee[],
  month: string,
  opts: SalarySlipPdfOptions
): string {
  if (!employees || employees.length === 0) return '<p>No data</p>'
  const brand = getBrandColor()
  const isBn = opts.isBn

  const slips = employees
    .map((emp) => `<div class="slip-wrap">${singleSlipHTML(emp, month, isBn, brand)}</div>`)
    .join('\n')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Salary Slips - ${month}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page{size:portrait;margin:10mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial','Noto Serif Bengali',sans-serif;color:#1a1a1a;font-size:11px;background:#fff;padding:10px}
  .slip-wrap{margin-bottom:12px}
  .slip-wrap:last-child{margin-bottom:0}
  .slip{border:1.5px solid #c7d2fe;border-radius:8px;padding:12px;max-width:190mm;width:100%}
  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid ${brand}}
  .logo-box{width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;background:${brand}}
  .school h1{font-size:12px;font-weight:700;color:${brand}}
  .school p{font-size:8px;color:#666}
  .title{text-align:center;font-size:10px;font-weight:700;color:#fff;background:${brand};padding:5px;margin-bottom:8px;border-radius:4px;letter-spacing:1px}
  .info-row{display:flex;justify-content:space-between;background:#eef2ff;padding:5px 8px;border-radius:6px;margin-bottom:8px;border:1px solid #c7d2fe}
  .info-item .label{font-size:7px;color:#666;text-transform:uppercase}
  .info-item .value{font-size:10px;font-weight:700;color:${brand}}
  .section{margin-bottom:6px}
  .section-title{font-size:8px;font-weight:700;color:${brand};text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e0e7ff;padding-bottom:2px;margin-bottom:4px}
  table{width:100%;border-collapse:collapse}
  td{padding:2px 6px;border-bottom:0.5px solid #eee;font-size:9px}
  td:first-child{font-weight:500;color:#555;width:50%}
  td:last-child{text-align:right;font-weight:600}
  .total td{border-top:1.5px solid ${brand};font-weight:700;font-size:10px;color:#1a1a1a}
  .net td{background:#eef2ff;color:${brand};font-size:11px;font-weight:700}
  .footer{margin-top:10px;padding-top:6px;border-top:1px solid #ddd;display:flex;justify-content:space-between}
  .sign-line{text-align:center}
  .sign-line .line{width:80px;height:1px;background:#333;margin:12px auto 3px}
  .sign-label{font-size:7px;color:#555}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.slip-wrap{page-break-inside:avoid}}
</style></head><body>
${slips}
</body></html>`
}

export function generatePayrollSummaryPDF(
  employees: SalarySlipEmployee[],
  month: string,
  opts: SalarySlipPdfOptions
): string {
  if (!employees || employees.length === 0) return '<p>No data</p>'
  const brand = getBrandColor()
  const isBn = opts.isBn
  const orientation = opts.orientation || 'landscape'

  const rows = employees
    .map((t, i) => {
      const s = calcSalary(t)
      return `<tr style="page-break-inside:avoid;${i % 2 === 0 ? '' : 'background:#f8fafc'}">
        <td style="padding:5px 6px;font-size:10px;text-align:center;border:1px solid #cbd5e1">${i + 1}</td>
        <td style="padding:5px 6px;font-size:10px;border:1px solid #cbd5e1;font-family:monospace;color:${brand}">${t.id}</td>
        <td style="padding:5px 6px;font-size:10px;font-weight:500;border:1px solid #cbd5e1">${t.nameEn}</td>
        <td style="padding:5px 6px;font-size:10px;border:1px solid #cbd5e1">${t.departmentId}</td>
        <td style="padding:5px 6px;font-size:10px;border:1px solid #cbd5e1">${t.designation || '—'}</td>
        <td style="padding:5px 6px;font-size:10px;text-align:right;border:1px solid #cbd5e1">৳${s.basic.toLocaleString()}</td>
        <td style="padding:5px 6px;font-size:10px;text-align:right;border:1px solid #cbd5e1">৳${s.bonusVal.toLocaleString()}</td>
        <td style="padding:5px 6px;font-size:10px;text-align:right;border:1px solid #cbd5e1">৳${s.overtimeVal.toLocaleString()}</td>
        <td style="padding:5px 6px;font-size:10px;text-align:right;border:1px solid #cbd5e1">৳${s.festivalVal.toLocaleString()}</td>
        <td style="padding:5px 6px;font-size:10px;text-align:right;border:1px solid #cbd5e1">৳${s.facilityTotal.toLocaleString()}</td>
        <td style="padding:5px 6px;font-size:10px;text-align:right;border:1px solid #cbd5e1;font-weight:700;color:${brand}">৳${s.net.toLocaleString()}</td>
      </tr>`
    })
    .join('')

  const totalNet = employees.reduce((s, t) => s + calcSalary(t).net, 0)
  const totalBasic = employees.reduce((s, t) => s + t.salary, 0)

  const thStyle = (align = 'left') => `padding:6px 8px;background:#1e293b;color:#fff;font-weight:700;font-size:9px;border:2px solid ${brand};text-align:${align};white-space:nowrap`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payroll - ${employees.length} employees</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page{size:${orientation};margin:6mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial','Noto Serif Bengali',sans-serif;color:#1e293b;background:#fff;font-size:10px;padding:10px}
  .header{text-align:center;margin-bottom:12px;padding-bottom:8px;border-bottom:3px solid ${brand}}
  .header h1{font-size:18px;color:#1e293b;letter-spacing:1.5px;text-transform:uppercase;font-weight:800}
  .header .subtitle{font-size:11px;color:#64748b;margin-top:3px;font-weight:500}
  .header .info{display:flex;justify-content:center;gap:12px;margin-top:6px;font-size:9px;color:#64748b}
  .header .info span{background:#f1f5f9;padding:2px 10px;border-radius:20px;border:1px solid #e2e8f0;font-weight:500}
  table{width:100%;border-collapse:collapse;table-layout:fixed}
  tr:nth-child(even){background:#f8fafc}
  .total-row td{border-top:2px solid ${brand};font-weight:700;background:#eef2ff;font-size:11px}
  .footer{margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#94a3b8;border-top:2px solid ${brand};padding-top:5px}
  .footer .brand{color:${brand};font-weight:700;font-size:9px}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}tr{page-break-inside:avoid}th,td{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
  <div class="header">
    <h1>${isBn ? 'বেতন সারসংক্ষেপ' : 'Payroll Summary'}</h1>
    <p class="subtitle">${isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}: ${month}</p>
    <div class="info">
      <span>${isBn ? 'মোট কর্মচারী' : 'Total Employees'}: ${employees.length}</span>
      <span>${isBn ? 'মোট বেতন' : 'Total Payroll'}: ৳${totalNet.toLocaleString()}</span>
    </div>
  </div>
  <table>
    <colgroup>
      <col style="width:28px"><col style="width:60px"><col style="width:120px"><col style="width:90px"><col style="width:80px">
      <col style="width:70px"><col style="width:55px"><col style="width:55px"><col style="width:55px"><col style="width:60px"><col style="width:75px">
    </colgroup>
    <thead><tr>
      <th style="${thStyle()}">#</th>
      <th style="${thStyle()}">ID</th>
      <th style="${thStyle()}">${isBn ? 'নাম' : 'Name'}</th>
      <th style="${thStyle()}">${isBn ? 'বিভাগ' : 'Dept'}</th>
      <th style="${thStyle()}">${isBn ? 'পদবি' : 'Designation'}</th>
      <th style="${thStyle('right')}">${isBn ? 'মূল বেতন' : 'Basic'}</th>
      <th style="${thStyle('right')}">${isBn ? 'বোনাস' : 'Bonus'}</th>
      <th style="${thStyle('right')}">${isBn ? 'ওভারটাইম' : 'OT'}</th>
      <th style="${thStyle('right')}">${isBn ? 'উৎসব' : 'Festival'}</th>
      <th style="${thStyle('right')}">${isBn ? 'সুবিধা' : 'Facility'}</th>
      <th style="${thStyle('right')}">${isBn ? 'নেট বেতন' : 'Net Pay'}</th>
    </tr></thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="5" style="padding:6px 8px;font-size:10px">${isBn ? `মোট (${employees.length} জন)` : `TOTAL (${employees.length} employees)`}</td>
        <td style="padding:6px 8px;text-align:right">৳${totalBasic.toLocaleString()}</td>
        <td colspan="4"></td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;color:${brand}">৳${totalNet.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
  <div class="footer"><span class="brand">SMS EduTech</span><span>${isBn ? 'তৈরি করা হয়েছে' : 'Generated'}: ${new Date().toLocaleString()}</span></div>
</body></html>`
}
