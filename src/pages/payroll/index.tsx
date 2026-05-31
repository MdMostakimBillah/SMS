import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Search, Printer, ChevronDown, ChevronUp, Wallet, Calculator, Building2, Calendar, Download } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useHRStore } from '@/store/hrStore'

type SortKey = 'name'|'salary'|'department'|'designation'

export default function PayrollPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { teachers, departments } = useTeacherStore()
  const { monthlySalaryConfigs } = useHRStore()
  const isBn = language === 'bn'

  const [search, setSearch] = useState('')
  const [fDept, setFDept] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [month, setMonth] = useState('')
  const monthSelected = month !== ''
  const currentYear = new Date().getFullYear()
  const MONTHS = [
    { key: '01', bn: 'জানুয়ারি', en: 'January' },
    { key: '02', bn: 'ফেব্রুয়ারি', en: 'February' },
    { key: '03', bn: 'মার্চ', en: 'March' },
    { key: '04', bn: 'এপ্রিল', en: 'April' },
    { key: '05', bn: 'মে', en: 'May' },
    { key: '06', bn: 'জুন', en: 'June' },
    { key: '07', bn: 'জুলাই', en: 'July' },
    { key: '08', bn: 'আগস্ট', en: 'August' },
    { key: '09', bn: 'সেপ্টেম্বর', en: 'September' },
    { key: '10', bn: 'অক্টোবর', en: 'October' },
    { key: '11', bn: 'নভেম্বর', en: 'November' },
    { key: '12', bn: 'ডিসেম্বর', en: 'December' },
  ]

  const getDeptName = useCallback((id: string) => {
    return departments.find(d => d.id === id)?.name || id
  }, [departments])

  const activeTeachers = useMemo(() => teachers.filter(t => t.status === 'active'), [teachers])

  const filtered = useMemo(() => {
    let list = activeTeachers
    if (fDept) list = list.filter(t => t.departmentId === fDept)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.nameEn.toLowerCase().includes(q) || t.id.includes(q) || t.phone.includes(q))
    }
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.nameEn.localeCompare(b.nameEn)
      else if (sortKey === 'salary') cmp = a.salary - b.salary
      else if (sortKey === 'department') cmp = getDeptName(a.departmentId).localeCompare(getDeptName(b.departmentId))
      else if (sortKey === 'designation') cmp = (a.designation || '').localeCompare(b.designation || '')
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [activeTeachers, fDept, search, sortKey, sortAsc, getDeptName])

  const stats = useMemo(() => {
    const salaries = activeTeachers.map(t => t.salary)
    const total = salaries.reduce((s, v) => s + v, 0)
    const avg = salaries.length ? total / salaries.length : 0
    const max = salaries.length ? Math.max(...salaries) : 0
    const min = salaries.length ? Math.min(...salaries) : 0
    const deptMap: Record<string, number> = {}
    activeTeachers.forEach(t => {
      const dept = getDeptName(t.departmentId)
      deptMap[dept] = (deptMap[dept] || 0) + t.salary
    })
    return { total, avg, max, min, count: activeTeachers.length, deptMap }
  }, [activeTeachers, getDeptName])

  const toggleAll = useCallback(() => {
    setSelected(p => p.length === filtered.length ? [] : filtered.map(t => t.id))
  }, [filtered])
  const toggleOne = useCallback((id: string) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }, [])
  const allSel = filtered.length > 0 && filtered.every(t => selected.includes(t.id))

  const getMonthConfigs = useCallback((teacherId: string) => {
    if (!month) return null
    return monthlySalaryConfigs.find((c: { teacherId: string; month: string }) => c.teacherId === teacherId && c.month === month) || null
  }, [monthlySalaryConfigs, month])

  const handlePrintSelected = useCallback(() => {
    const list = filtered.filter(t => selected.includes(t.id))
    if (list.length === 0) return
    const rows = list.map((t, i) => {
      const basic = t.salary
      const cfg = getMonthConfigs(t.id)
      const bonusVal = cfg?.bonus || 0
      const festivalVal = cfg?.festivalBonus || 0
      const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
      const fundAmount = Math.round(basic * (cfg?.fundContributionPercent || 0) / 100)
      const gross = basic + Math.round(basic * 0.15) + Math.round(basic * 0.1) + Math.round(basic * 0.05) + bonusVal + (t.overtime || 0) + festivalVal
      const pf = Math.round(basic * 0.08)
      const tax = Math.round(gross * 0.05)
      const net = gross - pf - tax - deductionAmount - fundAmount
      return `<tr style="border-bottom:1px solid #eee">
        <td style="padding:6px 8px;font-size:11px">${i+1}</td>
        <td style="padding:6px 8px;font-size:11px;font-family:monospace;color:#6366f1">${t.id}</td>
        <td style="padding:6px 8px;font-size:11px;font-weight:500">${t.nameEn}</td>
        <td style="padding:6px 8px;font-size:11px">${getDeptName(t.departmentId)}</td>
        <td style="padding:6px 8px;font-size:11px">${t.designation||'—'}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${basic.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${bonusVal.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${(t.overtime||0).toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${festivalVal.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:12px;font-weight:700;text-align:right;color:#10b981">৳${net.toLocaleString()}</td>
      </tr>`
    }).join('')
    const totalNet = list.reduce((s, t) => { const b=t.salary; const cfg=getMonthConfigs(t.id); const bv=cfg?.bonus||0; const fv=cfg?.festivalBonus||0; const da=cfg?.applyDeductionRule?Math.round(b/30):0; const fa=Math.round(b*(cfg?.fundContributionPercent||0)/100); const g=b+Math.round(b*0.15)+Math.round(b*0.1)+Math.round(b*0.05)+bv+(t.overtime||0)+fv; return s+g-Math.round(b*0.08)-Math.round(g*0.05)-da-fa }, 0)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Payroll - ${list.length} employees</title>
<style>
  @page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;color:#1a1a1a;font-size:12px;background:#fff;padding:15px}
  h1{font-size:16px;color:#6366f1;margin-bottom:4px}
  .sub{font-size:11px;color:#666;margin-bottom:12px}
  table{width:100%;border-collapse:collapse}
  th{background:#6366f1;color:#fff;padding:7px 8px;font-size:10px;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.3px}
  th:last-child,th:nth-child(n+6){text-align:right}
  .total-row td{border-top:2px solid #6366f1;font-weight:700;background:#eef2ff}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<h1>EduTech School — Selected Payroll</h1>
<div class="sub">Month: ${month} | Selected: ${list.length} employees | Generated: ${new Date().toLocaleDateString()}</div>
<table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Dept</th><th>Designation</th><th>Basic</th><th>Bonus</th><th>Overtime</th><th>Festival</th><th>Net Pay</th></tr></thead>
<tbody>${rows}
<tr class="total-row"><td colspan="5" style="padding:8px;font-size:12px">TOTAL (${list.length} employees)</td><td colspan="4"></td><td style="padding:8px;text-align:right;font-size:12px;font-weight:700;color:#10b981">৳${totalNet.toLocaleString()}</td></tr>
</tbody></table></body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }, [filtered, selected, month, getDeptName, isBn])

  const handlePrintPayslip = (t: typeof teachers[0]) => {
    const basic = t.salary
    const cfg = getMonthConfigs(t.id)
    const house = Math.round(basic * 0.15)
    const medical = Math.round(basic * 0.1)
    const conveyance = Math.round(basic * 0.05)
    const bonusVal = cfg?.bonus || 0
    const overtimeVal = t.overtime || 0
    const festivalVal = cfg?.festivalBonus || 0
    const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
    const fundAmount = Math.round(basic * (cfg?.fundContributionPercent || 0) / 100)
    const gross = basic + house + medical + conveyance + bonusVal + overtimeVal + festivalVal
    const pf = Math.round(basic * 0.08)
    const tax = Math.round(gross * 0.05)
    const totalDeduction = pf + tax + deductionAmount + fundAmount
    const net = gross - totalDeduction

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Payslip - ${t.id}</title>
<style>
  @page{size:A4 landscape;margin:8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;color:#1a1a1a;font-size:11px;background:#fff}
  .container{display:flex;gap:12mm;height:100%}
  .slip{flex:1;border:1.5px solid #c7d2fe;border-radius:8px;padding:10mm;position:relative}
  .slip-label{position:absolute;top:-8px;left:10mm;background:#fff;padding:0 6px;font-size:8px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px}
  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #6366f1}
  .logo-box{width:32px;height:32px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}
  .school h1{font-size:12px;font-weight:700;color:#6366f1}
  .school p{font-size:8px;color:#666}
  .title{text-align:center;font-size:10px;font-weight:700;color:#fff;background:#6366f1;padding:5px;margin-bottom:8px;border-radius:4px;letter-spacing:1px}
  .info-row{display:flex;justify-content:space-between;background:#eef2ff;padding:5px 8px;border-radius:6px;margin-bottom:8px;border:1px solid #c7d2fe}
  .info-item .label{font-size:7px;color:#666;text-transform:uppercase}
  .info-item .value{font-size:10px;font-weight:700;color:#6366f1}
  .section{margin-bottom:6px}
  .section-title{font-size:8px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e0e7ff;padding-bottom:2px;margin-bottom:4px}
  table{width:100%;border-collapse:collapse}
  td{padding:2px 6px;border-bottom:0.5px solid #eee;font-size:9px}
  td:first-child{font-weight:500;color:#555;width:50%}
  td:last-child{text-align:right;font-weight:600}
  .total td{border-top:1.5px solid #6366f1;font-weight:700;font-size:10px;color:#1a1a1a}
  .net td{background:#eef2ff;color:#6366f1;font-size:11px;font-weight:700}
  .footer{margin-top:8px;padding-top:6px;border-top:1px solid #ddd;display:flex;justify-content:space-between}
  .sign-line{text-align:center}
  .sign-line .line{width:80px;height:1px;background:#333;margin:12px auto 3px}
  .sign-label{font-size:7px;color:#555}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="container">
  <div class="slip">
    <div class="slip-label">Admin Copy</div>
    <div class="header">
      <div style="display:flex;align-items:center;gap:6px">
        <div class="logo-box">ET</div>
        <div class="school"><h1>EduTech School</h1><p>Sunrise Academy</p></div>
      </div>
      <div style="text-align:right"><div style="font-size:7px;color:#666">Payslip For</div><div style="font-size:10px;font-weight:700;color:#6366f1">${month}</div></div>
    </div>
    <div class="title">SALARY SLIP / বেতন পর্চি</div>
    <div class="info-row">
      <div class="info-item"><div class="label">ID</div><div class="value">${t.id}</div></div>
      <div class="info-item"><div class="label">Name</div><div class="value">${t.nameEn}</div></div>
      <div class="info-item"><div class="label">Dept</div><div class="value">${getDeptName(t.departmentId)}</div></div>
      <div class="info-item"><div class="label">Designation</div><div class="value">${t.designation||'—'}</div></div>
    </div>
    <div class="section">
      <div class="section-title">Earnings</div>
      <table>
        <tr><td>Basic Salary</td><td>৳${basic.toLocaleString()}</td></tr>
        <tr><td>House Rent (15%)</td><td>৳${house.toLocaleString()}</td></tr>
        <tr><td>Medical (10%)</td><td>৳${medical.toLocaleString()}</td></tr>
        <tr><td>Conveyance (5%)</td><td>৳${conveyance.toLocaleString()}</td></tr>
        ${bonusVal > 0 ? `<tr><td>Bonus</td><td>৳${bonusVal.toLocaleString()}</td></tr>` : ''}
        ${overtimeVal > 0 ? `<tr><td>Overtime</td><td>৳${overtimeVal.toLocaleString()}</td></tr>` : ''}
        ${festivalVal > 0 ? `<tr><td>Festival Bonus</td><td>৳${festivalVal.toLocaleString()}</td></tr>` : ''}
        <tr class="total"><td>Gross Earnings</td><td>৳${gross.toLocaleString()}</td></tr>
      </table>
    </div>
    <div class="section">
      <div class="section-title">Deductions</div>
      <table>
        <tr><td>PF (8%)</td><td>-৳${pf.toLocaleString()}</td></tr>
        <tr><td>Tax (5%)</td><td>-৳${tax.toLocaleString()}</td></tr>
        ${deductionAmount > 0 ? `<tr><td>Salary Deduction (1 day)</td><td>-৳${deductionAmount.toLocaleString()}</td></tr>` : ''}
        ${fundAmount > 0 ? `<tr><td>Fund Contribution</td><td>-৳${fundAmount.toLocaleString()}</td></tr>` : ''}
        <tr class="total"><td>Total Deductions</td><td>-৳${totalDeduction.toLocaleString()}</td></tr>
      </table>
    </div>
    <div class="section">
      <table>
        <tr class="net"><td>NET SALARY</td><td>৳${net.toLocaleString()}</td></tr>
      </table>
    </div>
    <div class="footer">
      <div class="sign-line"><div class="line"></div><div class="sign-label">Admin Approval</div></div>
      <div style="text-align:center;font-size:7px;color:#888"><div>Date: ___________</div></div>
      <div class="sign-line"><div class="line"></div><div class="sign-label">Authorized</div></div>
    </div>
  </div>
  <div class="slip">
    <div class="slip-label">Employee Copy</div>
    <div class="header">
      <div style="display:flex;align-items:center;gap:6px">
        <div class="logo-box">ET</div>
        <div class="school"><h1>EduTech School</h1><p>Sunrise Academy</p></div>
      </div>
      <div style="text-align:right"><div style="font-size:7px;color:#666">Payslip For</div><div style="font-size:10px;font-weight:700;color:#6366f1">${month}</div></div>
    </div>
    <div class="title">SALARY SLIP / বেতন পর্চি</div>
    <div class="info-row">
      <div class="info-item"><div class="label">ID</div><div class="value">${t.id}</div></div>
      <div class="info-item"><div class="label">Name</div><div class="value">${t.nameEn}</div></div>
      <div class="info-item"><div class="label">Dept</div><div class="value">${getDeptName(t.departmentId)}</div></div>
      <div class="info-item"><div class="label">Designation</div><div class="value">${t.designation||'—'}</div></div>
    </div>
    <div class="section">
      <div class="section-title">Earnings</div>
      <table>
        <tr><td>Basic Salary</td><td>৳${basic.toLocaleString()}</td></tr>
        <tr><td>House Rent (15%)</td><td>৳${house.toLocaleString()}</td></tr>
        <tr><td>Medical (10%)</td><td>৳${medical.toLocaleString()}</td></tr>
        <tr><td>Conveyance (5%)</td><td>৳${conveyance.toLocaleString()}</td></tr>
        ${bonusVal > 0 ? `<tr><td>Bonus</td><td>৳${bonusVal.toLocaleString()}</td></tr>` : ''}
        ${overtimeVal > 0 ? `<tr><td>Overtime</td><td>৳${overtimeVal.toLocaleString()}</td></tr>` : ''}
        ${festivalVal > 0 ? `<tr><td>Festival Bonus</td><td>৳${festivalVal.toLocaleString()}</td></tr>` : ''}
        <tr class="total"><td>Gross Earnings</td><td>৳${gross.toLocaleString()}</td></tr>
      </table>
    </div>
    <div class="section">
      <div class="section-title">Deductions</div>
      <table>
        <tr><td>PF (8%)</td><td>-৳${pf.toLocaleString()}</td></tr>
        <tr><td>Tax (5%)</td><td>-৳${tax.toLocaleString()}</td></tr>
        ${deductionAmount > 0 ? `<tr><td>Salary Deduction (1 day)</td><td>-৳${deductionAmount.toLocaleString()}</td></tr>` : ''}
        ${fundAmount > 0 ? `<tr><td>Fund Contribution</td><td>-৳${fundAmount.toLocaleString()}</td></tr>` : ''}
        <tr class="total"><td>Total Deductions</td><td>-৳${totalDeduction.toLocaleString()}</td></tr>
      </table>
    </div>
    <div class="section">
      <table>
        <tr class="net"><td>NET SALARY</td><td>৳${net.toLocaleString()}</td></tr>
      </table>
    </div>
    <div class="footer">
      <div class="sign-line"><div class="line"></div><div class="sign-label">Employee Signature</div></div>
      <div style="text-align:center;font-size:7px;color:#888"><div>Date: ___________</div></div>
      <div class="sign-line"><div class="line"></div><div class="sign-label">Received By</div></div>
    </div>
  </div>
</div></body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  const handlePrintAll = () => {
    const rows = filtered.map((t, i) => {
      const basic = t.salary
      const cfg = getMonthConfigs(t.id)
      const bonusVal = cfg?.bonus || 0
      const festivalVal = cfg?.festivalBonus || 0
      const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
      const fundAmount = Math.round(basic * (cfg?.fundContributionPercent || 0) / 100)
      const gross = basic + Math.round(basic * 0.15) + Math.round(basic * 0.1) + Math.round(basic * 0.05) + bonusVal + (t.overtime || 0) + festivalVal
      const pf = Math.round(basic * 0.08)
      const tax = Math.round(gross * 0.05)
      const net = gross - pf - tax - deductionAmount - fundAmount
      return `<tr style="border-bottom:1px solid #eee">
        <td style="padding:6px 8px;font-size:11px">${i+1}</td>
        <td style="padding:6px 8px;font-size:11px;font-family:monospace;color:#6366f1">${t.id}</td>
        <td style="padding:6px 8px;font-size:11px;font-weight:500">${t.nameEn}</td>
        <td style="padding:6px 8px;font-size:11px">${getDeptName(t.departmentId)}</td>
        <td style="padding:6px 8px;font-size:11px">${t.designation||'—'}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${basic.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${bonusVal.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${(t.overtime||0).toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${festivalVal.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:12px;font-weight:700;text-align:right;color:#10b981">৳${net.toLocaleString()}</td>
      </tr>`
    }).join('')

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Payroll Report - ${month}</title>
<style>
  @page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;color:#1a1a1a;font-size:12px;background:#fff;padding:15px}
  h1{font-size:16px;color:#6366f1;margin-bottom:4px}
  .sub{font-size:11px;color:#666;margin-bottom:12px}
  table{width:100%;border-collapse:collapse}
  th{background:#6366f1;color:#fff;padding:7px 8px;font-size:10px;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.3px}
  th:last-child,th:nth-child(n+6){text-align:right}
  .total-row td{border-top:2px solid #6366f1;font-weight:700;background:#eef2ff}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<h1>EduTech School — Payroll Report</h1>
<div class="sub">Month: ${month} | Total Staff: ${filtered.length} | Generated: ${new Date().toLocaleDateString()}</div>
<table>
  <thead><tr>
    <th>#</th><th>ID</th><th>Name</th><th>Dept</th><th>Designation</th>
    <th>Basic</th><th>Bonus</th><th>Overtime</th><th>Festival</th><th>Net Pay</th>
  </tr></thead>
  <tbody>${rows}
    <tr class="total-row">
      <td colspan="5" style="padding:8px;font-size:12px">TOTAL (${filtered.length} employees)</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>s+t.salary,0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>{const cfg=getMonthConfigs(t.id);return s+(cfg?.bonus||0)},0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>s+(t.overtime||0),0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>{const cfg=getMonthConfigs(t.id);return s+(cfg?.festivalBonus||0)},0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:12px;font-weight:700;color:#10b981">৳${filtered.reduce((s,t)=>{const b=t.salary;const cfg=getMonthConfigs(t.id);const bv=cfg?.bonus||0;const fv=cfg?.festivalBonus||0;const da=cfg?.applyDeductionRule?Math.round(b/30):0;const fa=Math.round(b*(cfg?.fundContributionPercent||0)/100);const g=b+Math.round(b*0.15)+Math.round(b*0.1)+Math.round(b*0.05)+bv+(t.overtime||0)+fv;return s+g-Math.round(b*0.08)-Math.round(g*0.05)-da-fa},0).toLocaleString()}</td>
    </tr>
  </tbody>
</table></body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: isMobile ? '12px' : '14px',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/teachers')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit', flexShrink: 0 }}>
          <ArrowLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'বেতন ব্যবস্থাপনা' : 'Payroll Management'}
          </h1>
          {monthSelected && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {isBn ? `${MONTHS.find(m => m.key === month.split('-')[1])?.bn || ''} ${month.split('-')[0]} · ${stats.count} জন কর্মচারী` : `${MONTHS.find(m => m.key === month.split('-')[1])?.en || ''} ${month.split('-')[0]} · ${stats.count} employees`}
            </p>
          )}
        </div>
        {monthSelected && (
          <button onClick={handlePrintAll}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Printer size={13} />{isBn ? 'সব প্রিন্ট' : 'Print All'}
          </button>
        )}
      </div>

      {/* Month Calendar Grid */}
      {!monthSelected && (
        <div style={{ ...card, marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} />{isBn ? 'মাস বেছে নিন' : 'Select Month'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: '8px' }}>
            {MONTHS.map(m => {
              const val = `${currentYear}-${m.key}`
              const isCurrent = m.key === String(new Date().getMonth() + 1).padStart(2, '0') && currentYear === new Date().getFullYear()
              return (
                <button key={m.key} onClick={() => setMonth(val)}
                  style={{ padding: '14px 10px', borderRadius: '10px', border: `2px solid ${isCurrent ? 'var(--brand)' : 'var(--border)'}`, background: isCurrent ? 'var(--brand-light)' : 'var(--bg-secondary)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = 'var(--brand-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isCurrent ? 'var(--brand)' : 'var(--border)'; e.currentTarget.style.background = isCurrent ? 'var(--brand-light)' : 'var(--bg-secondary)' }}>
                  {isCurrent && <div style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)' }} />}
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isCurrent ? 'var(--brand)' : 'var(--text-primary)' }}>{isBn ? m.bn : m.en}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{currentYear}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected month bar — visible after selection */}
      {monthSelected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ ...card, flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? `${MONTHS.find(m => m.key === month.split('-')[1])?.bn} ${month.split('-')[0]}` : `${MONTHS.find(m => m.key === month.split('-')[1])?.en} ${month.split('-')[0]}`}
            </span>
            <button onClick={() => setMonth('')}
              style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '6px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {isBn ? 'মাস পরিবর্তন' : 'Change Month'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {monthSelected && (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
        {[
          { label: isBn ? 'মোট বেতন' : 'Total Payroll', value: `৳${stats.total.toLocaleString()}`, icon: Wallet, color: 'var(--brand)', bg: 'var(--brand-light)' },
          { label: isBn ? 'গড় বেতন' : 'Avg Salary', value: `৳${Math.round(stats.avg).toLocaleString()}`, icon: Calculator, color: 'var(--teal)', bg: 'var(--teal-light)' },
          { label: isBn ? 'সর্বোচ্চ' : 'Highest', value: `৳${stats.max.toLocaleString()}`, icon: TrendingUp, color: 'var(--green)', bg: 'var(--green-light)' },
          { label: isBn ? 'সর্বনিম্ন' : 'Lowest', value: `৳${stats.min.toLocaleString()}`, icon: TrendingDown, color: 'var(--red)', bg: 'var(--red-light)' },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Department breakdown */}
      {monthSelected && Object.keys(stats.deptMap).length > 0 && (
        <div style={{ ...card, marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={13} />{isBn ? 'বিভাগ অনুযায়ী বেতন' : 'Department-wise Salary'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${Math.min(Object.keys(stats.deptMap).length, 4)}, 1fr)`, gap: '8px' }}>
            {Object.entries(stats.deptMap).sort((a, b) => b[1] - a[1]).map(([dept, total]) => (
              <div key={dept} style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{dept}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>৳{total.toLocaleString()}</div>
                <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(total / stats.total) * 100}%`, background: 'var(--brand)', borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{Math.round((total / stats.total) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Table */}
      {monthSelected && (<>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 200px 160px', gap: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 10px' }}>
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isBn ? 'নাম, আইডি, মোবাইল...' : 'Name, ID, phone...'}
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
        </div>
        <select value={fDept} onChange={e => setFDept(e.target.value)}
          style={{ padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'inherit' }}>
          <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
          {departments.map(d => <option key={d.id} value={d.id}>{isBn ? d.nameBn : d.name}</option>)}
        </select>
        <select value={`${sortKey}-${sortAsc}`}
          onChange={e => { const [k, a] = e.target.value.split('-'); setSortKey(k as SortKey); setSortAsc(a === 'true') }}
          style={{ padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'inherit' }}>
          <option value="name-true">{isBn ? 'নাম (ক্রম)' : 'Name A→Z'}</option>
          <option value="name-false">{isBn ? 'নাম (উল্টো)' : 'Name Z→A'}</option>
          <option value="salary-false">{isBn ? 'বেতন (বেশি)' : 'Salary: High→Low'}</option>
          <option value="salary-true">{isBn ? 'বেতন (কম)' : 'Salary: Low→High'}</option>
          <option value="department-true">{isBn ? 'বিভাগ' : 'Department'}</option>
          <option value="designation-true">{isBn ? 'পদবি' : 'Designation'}</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        {selected.length > 0 && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--brand-light)', flexWrap:'wrap', gap:'8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brand)' }}>
              {selected.length} {isBn ? 'জন নির্বাচিত' : 'selected'}
            </span>
            <button onClick={handlePrintSelected}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Download size={13} />{isBn ? 'নির্বাচিত ডাউনলোড' : 'Download Selected'}
            </button>
          </div>
        )}
        <div style={{ overflowX: 'auto', ...(isMobile ? { maxHeight:'60vh', overflowY:'auto' } : {}) }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: isMobile ? '600px' : undefined }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', width: '40px' }}>
                  <input type="checkbox" checked={allSel} onChange={toggleAll}
                    style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                </th>
                <th style={{ padding: '10px 12px', width: '40px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isBn ? 'নাম' : 'Name'}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isBn ? 'বিভাগ' : 'Dept'}</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isBn ? 'পদবি' : 'Designation'}</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isBn ? 'বেতন' : 'Salary'}</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No employees found'}
                </td></tr>
              ) : filtered.map((t, i) => {
                const basic = t.salary
                const cfg = getMonthConfigs(t.id)
                const house = Math.round(basic * 0.15)
                const medical = Math.round(basic * 0.1)
                const conveyance = Math.round(basic * 0.05)
                const bonusVal = cfg?.bonus || 0
                const overtimeVal = t.overtime || 0
                const festivalVal = cfg?.festivalBonus || 0
                const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
                const fundAmount = Math.round(basic * (cfg?.fundContributionPercent || 0) / 100)
                const gross = basic + house + medical + conveyance + bonusVal + overtimeVal + festivalVal
                const pf = Math.round(basic * 0.08)
                const tax = Math.round(gross * 0.05)
                const net = gross - pf - tax - deductionAmount - fundAmount
                const isExpanded = expandedId === t.id

                return (
                  <React.Fragment key={t.id}>
                    <tr style={{ borderBottom: '0.5px solid var(--border)', background: selected.includes(t.id) ? 'var(--brand-light)' : 'transparent' }}
                      onMouseEnter={e => { if (!selected.includes(t.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                      onMouseLeave={e => { if (!selected.includes(t.id)) e.currentTarget.style.background = selected.includes(t.id) ? 'var(--brand-light)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleOne(t.id)}
                          style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px' }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.nameEn}</div>
                        <div style={{ fontSize: '10px', color: 'var(--brand)', fontFamily: 'monospace' }}>{t.id}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{getDeptName(t.departmentId)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t.designation || '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>৳{t.salary.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button onClick={() => setExpandedId(isExpanded ? null : t.id)}
                            style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            {isBn ? 'বিস্তারিত' : 'Details'}
                          </button>
                          <button onClick={() => handlePrintPayslip(t)}
                            style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--brand-light)', border: '1px solid var(--brand)', cursor: 'pointer', fontSize: '10px', color: 'var(--brand)', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Printer size={11} />PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0 16px 12px' }}>
                          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{isBn ? 'মূল বেতন' : 'Basic Salary'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{basic.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{isBn ? 'বাসা ভাড়া (১৫%)' : 'House Rent (15%)'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{house.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{isBn ? 'চিকিৎসা (১০%)' : 'Medical (10%)'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{medical.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{isBn ? 'যাতায়াত (৫%)' : 'Conveyance (5%)'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{conveyance.toLocaleString()}</div>
                            </div>
                            {bonusVal > 0 && <div>
                              <div style={{ fontSize: '10px', color: 'var(--green)', marginBottom: '4px' }}>{isBn ? 'বোনাস' : 'Bonus'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)' }}>+৳{bonusVal.toLocaleString()}</div>
                            </div>}
                            {overtimeVal > 0 && <div>
                              <div style={{ fontSize: '10px', color: 'var(--green)', marginBottom: '4px' }}>{isBn ? 'ওভারটাইম' : 'Overtime'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)' }}>+৳{overtimeVal.toLocaleString()}</div>
                            </div>}
                            {festivalVal > 0 && <div>
                              <div style={{ fontSize: '10px', color: 'var(--green)', marginBottom: '4px' }}>{isBn ? 'উৎসব বোনাস' : 'Festival Bonus'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green)' }}>+৳{festivalVal.toLocaleString()}</div>
                            </div>}
                            {deductionAmount > 0 && <div>
                              <div style={{ fontSize: '10px', color: 'var(--red)', marginBottom: '4px' }}>{isBn ? 'বেতন কাটা (১ দিন)' : 'Deduction (1 day)'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>-৳{deductionAmount.toLocaleString()}</div>
                            </div>}
                            {fundAmount > 0 && <div>
                              <div style={{ fontSize: '10px', color: 'var(--red)', marginBottom: '4px' }}>{isBn ? 'তহবিল অংশদান' : 'Fund Contribution'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>-৳{fundAmount.toLocaleString()}</div>
                            </div>}
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--red)', marginBottom: '4px' }}>{isBn ? 'পিএফ (৮%)' : 'PF (8%)'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>-৳{pf.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--red)', marginBottom: '4px' }}>{isBn ? 'ট্যাক্স (৫%)' : 'Tax (5%)'}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>-৳{tax.toLocaleString()}</div>
                            </div>
                            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                              <div style={{ fontSize: '10px', color: 'var(--green)', marginBottom: '4px' }}>{isBn ? 'নেট বেতন' : 'Net Salary'}</div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green)' }}>৳{net.toLocaleString()}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>)}
    </div>
  )
}
