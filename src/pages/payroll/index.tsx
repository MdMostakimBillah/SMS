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
  const { monthlySalaryConfigs, facilities, teacherFacilities } = useHRStore()
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

  const getTeacherFacilityAmount = useCallback((teacherId: string) => {
    return teacherFacilities
      .filter(tf => tf.teacherId === teacherId)
      .reduce((sum, tf) => sum + tf.amount, 0)
  }, [teacherFacilities])

  const getTeacherFacilityDetails = useCallback((teacherId: string) => {
    return teacherFacilities
      .filter(tf => tf.teacherId === teacherId)
      .map(tf => {
        const fac = facilities.find(f => f.id === tf.facilityId)
        return { name: fac?.name || 'Unknown', nameBn: fac?.nameBn || 'অজানা', amount: tf.amount }
      })
  }, [teacherFacilities, facilities])

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
      const facilityTotal = getTeacherFacilityAmount(t.id)
      const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
      const fundAmount = Math.round(basic * (cfg?.fundContributionPercent || 0) / 100)
      const gross = basic + Math.round(basic * 0.15) + Math.round(basic * 0.1) + Math.round(basic * 0.05) + bonusVal + (t.overtime || 0) + festivalVal + facilityTotal
      const net = gross - deductionAmount - fundAmount
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
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${facilityTotal.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:12px;font-weight:700;text-align:right;color:#10b981">৳${net.toLocaleString()}</td>
      </tr>`
    }).join('')
    const totalNet = list.reduce((s, t) => { const b=t.salary; const cfg=getMonthConfigs(t.id); const bv=cfg?.bonus||0; const fv=cfg?.festivalBonus||0; const ft=getTeacherFacilityAmount(t.id); const da=cfg?.applyDeductionRule?Math.round(b/30):0; const fa=Math.round(b*(cfg?.fundContributionPercent||0)/100); const g=b+Math.round(b*0.15)+Math.round(b*0.1)+Math.round(b*0.05)+bv+(t.overtime||0)+fv+ft; return s+g-Math.round(b*0.08)-Math.round(g*0.05)-da-fa }, 0)
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
<table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Dept</th><th>Designation</th><th>Basic</th><th>Bonus</th><th>Overtime</th><th>Festival</th><th>Facilities</th><th>Net Pay</th></tr></thead>
<tbody>${rows}
<tr class="total-row"><td colspan="5" style="padding:8px;font-size:12px">TOTAL (${list.length} employees)</td><td colspan="5"></td><td style="padding:8px;text-align:right;font-size:12px;font-weight:700;color:#10b981">৳${totalNet.toLocaleString()}</td></tr>
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
    const facilityDetails = getTeacherFacilityDetails(t.id)
    const facilityTotal = facilityDetails.reduce((s, f) => s + f.amount, 0)
    const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
    const fundAmount = Math.round(basic * (cfg?.fundContributionPercent || 0) / 100)
    const gross = basic + house + medical + conveyance + bonusVal + overtimeVal + festivalVal + facilityTotal
    const totalDeduction = deductionAmount + fundAmount
    const net = gross - totalDeduction

    const facilityRows = facilityDetails.map(f => `<tr><td>${isBn ? f.nameBn : f.name}</td><td style="text-align:right">৳${f.amount.toLocaleString()}</td></tr>`).join('')

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Payslip - ${t.id}</title>
<style>
  @page{size:A4 portrait;margin:10mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;color:#1a1a1a;font-size:11px;background:#fff;padding:10px}
  .slip{border:1.5px solid #c7d2fe;border-radius:8px;padding:12px;max-width:190mm;margin:0 auto}
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
  .footer{margin-top:10px;padding-top:6px;border-top:1px solid #ddd;display:flex;justify-content:space-between}
  .sign-line{text-align:center}
  .sign-line .line{width:80px;height:1px;background:#333;margin:12px auto 3px}
  .sign-label{font-size:7px;color:#555}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="slip">
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
  <div style="display:flex;gap:12px">
    <div class="section" style="flex:1">
      <div class="section-title">Earnings</div>
      <table>
        <tr><td>Basic Salary</td><td>৳${basic.toLocaleString()}</td></tr>
        <tr><td>House Rent (15%)</td><td>৳${house.toLocaleString()}</td></tr>
        <tr><td>Medical (10%)</td><td>৳${medical.toLocaleString()}</td></tr>
        <tr><td>Conveyance (5%)</td><td>৳${conveyance.toLocaleString()}</td></tr>
        ${bonusVal > 0 ? `<tr><td>Bonus</td><td>৳${bonusVal.toLocaleString()}</td></tr>` : ''}
        ${overtimeVal > 0 ? `<tr><td>Overtime</td><td>৳${overtimeVal.toLocaleString()}</td></tr>` : ''}
        ${festivalVal > 0 ? `<tr><td>Festival Bonus</td><td>৳${festivalVal.toLocaleString()}</td></tr>` : ''}
        ${facilityRows}
        <tr class="total"><td>Gross Earnings</td><td>৳${gross.toLocaleString()}</td></tr>
      </table>
    </div>
    <div class="section" style="flex:1">
      <div class="section-title">Deductions</div>
      <table>
        ${deductionAmount > 0 ? `<tr><td>Salary Deduction (1 day)</td><td>-৳${deductionAmount.toLocaleString()}</td></tr>` : ''}
        ${fundAmount > 0 ? `<tr><td>Fund Contribution</td><td>-৳${fundAmount.toLocaleString()}</td></tr>` : ''}
        <tr class="total"><td>Total Deductions</td><td>-৳${totalDeduction.toLocaleString()}</td></tr>
      </table>
    </div>
  </div>
  <div class="section">
    <table>
      <tr class="net"><td>NET SALARY</td><td>৳${net.toLocaleString()}</td></tr>
    </table>
  </div>
  <div class="footer">
    <div class="sign-line"><div class="line"></div><div class="sign-label">Admin Approval</div></div>
    <div style="text-align:center;font-size:7px;color:#888"><div>Date: ___________</div></div>
    <div class="sign-line"><div class="line"></div><div class="sign-label">Employee Signature</div></div>
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
      const facilityTotal = getTeacherFacilityAmount(t.id)
      const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
      const fundAmount = Math.round(basic * (cfg?.fundContributionPercent || 0) / 100)
      const gross = basic + Math.round(basic * 0.15) + Math.round(basic * 0.1) + Math.round(basic * 0.05) + bonusVal + (t.overtime || 0) + festivalVal + facilityTotal
      const net = gross - deductionAmount - fundAmount
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
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${facilityTotal.toLocaleString()}</td>
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
    <th>Basic</th><th>Bonus</th><th>Overtime</th><th>Festival</th><th>Facilities</th><th>Net Pay</th>
  </tr></thead>
  <tbody>${rows}
    <tr class="total-row">
      <td colspan="5" style="padding:8px;font-size:12px">TOTAL (${filtered.length} employees)</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>s+t.salary,0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>{const cfg=getMonthConfigs(t.id);return s+(cfg?.bonus||0)},0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>s+(t.overtime||0),0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>{const cfg=getMonthConfigs(t.id);return s+(cfg?.festivalBonus||0)},0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s,t)=>s+getTeacherFacilityAmount(t.id),0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:12px;font-weight:700;color:#10b981">৳${filtered.reduce((s,t)=>{const b=t.salary;const cfg=getMonthConfigs(t.id);const bv=cfg?.bonus||0;const fv=cfg?.festivalBonus||0;const ft=getTeacherFacilityAmount(t.id);const da=cfg?.applyDeductionRule?Math.round(b/30):0;const fa=Math.round(b*(cfg?.fundContributionPercent||0)/100);const g=b+Math.round(b*0.15)+Math.round(b*0.1)+Math.round(b*0.05)+bv+(t.overtime||0)+fv+ft;return s+g-da-fa},0).toLocaleString()}</td>
    </tr>
  </tbody>
</table></body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  const card = `bg-[var(--bg-primary)] border border-[var(--border)] rounded-[12px] ${isMobile ? 'p-3' : 'p-[14px]'}`

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <button onClick={() => navigate('/teachers')}
          className="flex items-center gap-[5px] py-[7px] px-3 rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] font-[inherit] shrink-0">
          <ArrowLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`${isMobile ? 'text-lg' : 'text-[22px]'} font-semibold text-[var(--text-primary)]`}>
            {isBn ? 'বেতন ব্যবস্থাপনা' : 'Payroll Management'}
          </h1>
          {monthSelected && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isBn ? `${MONTHS.find(m => m.key === month.split('-')[1])?.bn || ''} ${month.split('-')[0]} · ${stats.count} জন কর্মচারী` : `${MONTHS.find(m => m.key === month.split('-')[1])?.en || ''} ${month.split('-')[0]} · ${stats.count} employees`}
            </p>
          )}
        </div>
        {monthSelected && (
          <button onClick={handlePrintAll}
            className="flex items-center gap-[5px] py-[7px] px-3.5 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
            <Printer size={13} />{isBn ? 'সব প্রিন্ট' : 'Print All'}
          </button>
        )}
      </div>

      {!monthSelected && (
        <div className={`${card} mb-3.5`}>
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-2.5 flex items-center gap-1.5">
            <Calendar size={13} />{isBn ? 'মাস বেছে নিন' : 'Select Month'}
          </div>
          <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-4'} gap-2`}>
            {MONTHS.map(m => {
              const val = `${currentYear}-${m.key}`
              const isCurrent = m.key === String(new Date().getMonth() + 1).padStart(2, '0') && currentYear === new Date().getFullYear()
              return (
                <button key={m.key} onClick={() => setMonth(val)}
                  className={`py-3.5 px-2.5 rounded-[10px] border-2 ${isCurrent ? 'border-[var(--brand)]' : 'border-[var(--border)]'} ${isCurrent ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-secondary)]'} cursor-pointer font-[inherit] text-center transition-all duration-150 relative hover:border-[var(--brand)] hover:bg-[var(--brand-light)]`}>
                  {isCurrent && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
                  <div className={`text-[13px] font-semibold ${isCurrent ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]'}`}>{isBn ? m.bn : m.en}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{currentYear}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {monthSelected && (
        <div className="flex items-center gap-2 mb-3.5 flex-wrap">
          <div className={`${card} flex-1 py-[10px] px-3.5 flex items-center gap-2`}>
            <Calendar size={16} className="text-[var(--brand)] shrink-0" />
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">
              {isBn ? `${MONTHS.find(m => m.key === month.split('-')[1])?.bn} ${month.split('-')[0]}` : `${MONTHS.find(m => m.key === month.split('-')[1])?.en} ${month.split('-')[0]}`}
            </span>
            <button onClick={() => setMonth('')}
              className="ml-auto py-1 px-2.5 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[11px] cursor-pointer font-[inherit]">
              {isBn ? 'মাস পরিবর্তন' : 'Change Month'}
            </button>
          </div>
        </div>
      )}

      {monthSelected && (
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2.5 mb-3.5`}>
        {[
          { label: isBn ? 'মোট বেতন' : 'Total Payroll', value: `৳${stats.total.toLocaleString()}`, icon: Wallet, colorClass: 'text-[var(--brand)]', bgClass: 'bg-[var(--brand-light)]' },
          { label: isBn ? 'গড় বেতন' : 'Avg Salary', value: `৳${Math.round(stats.avg).toLocaleString()}`, icon: Calculator, colorClass: 'text-[var(--teal)]', bgClass: 'bg-[var(--teal-light)]' },
          { label: isBn ? 'সর্বোচ্চ' : 'Highest', value: `৳${stats.max.toLocaleString()}`, icon: TrendingUp, colorClass: 'text-[var(--green)]', bgClass: 'bg-[var(--green-light)]' },
          { label: isBn ? 'সর্বনিম্ন' : 'Lowest', value: `৳${stats.min.toLocaleString()}`, icon: TrendingDown, colorClass: 'text-[var(--red)]', bgClass: 'bg-[var(--red-light)]' },
        ].map(s => (
          <div key={s.label} className={card}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${s.bgClass} flex items-center justify-center shrink-0`}>
                <s.icon size={15} className={s.colorClass} />
              </div>
              <div>
                <div className={`${isMobile ? 'text-[15px]' : 'text-[17px]'} font-bold text-[var(--text-primary)]`}>{s.value}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {monthSelected && Object.keys(stats.deptMap).length > 0 && (
        <div className={`${card} mb-3.5`}>
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-2.5 flex items-center gap-1.5">
            <Building2 size={13} />{isBn ? 'বিভাগ অনুযায়ী বেতন' : 'Department-wise Salary'}
          </div>
          <div className={`grid ${isMobile ? 'grid-cols-2' : `grid-cols-[repeat(${Math.min(Object.keys(stats.deptMap).length, 4)},1fr)]`} gap-2`}>
            {Object.entries(stats.deptMap).sort((a, b) => b[1] - a[1]).map(([dept, total]) => (
              <div key={dept} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-muted)] mb-1">{dept}</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">৳{total.toLocaleString()}</div>
                <div className="h-1 rounded-[2px] bg-[var(--border)] mt-1.5 overflow-hidden">
                  <div className="h-full rounded-[2px] bg-[var(--brand)]" style={{ width: `${(total / stats.total) * 100}%` }} />
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">{Math.round((total / stats.total) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthSelected && (<>
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-[1fr_200px_160px]'} gap-2 mb-2.5`}>
        <div className="flex items-center gap-[7px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg py-[7px] px-2.5">
          <Search size={14} className="text-[var(--text-muted)] shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isBn ? 'নাম, আইডি, মোবাইল...' : 'Name, ID, phone...'}
            className="flex-1 border-none bg-transparent outline-none text-xs text-[var(--text-primary)] font-[inherit]" />
        </div>
        <select value={fDept} onChange={e => setFDept(e.target.value)}
          className="py-[7px] px-[9px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs font-[inherit]">
          <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
          {departments.map(d => <option key={d.id} value={d.id}>{isBn ? d.nameBn : d.name}</option>)}
        </select>
        <select value={`${sortKey}-${sortAsc}`}
          onChange={e => { const [k, a] = e.target.value.split('-'); setSortKey(k as SortKey); setSortAsc(a === 'true') }}
          className="py-[7px] px-[9px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs font-[inherit]">
          <option value="name-true">{isBn ? 'নাম (ক্রম)' : 'Name A→Z'}</option>
          <option value="name-false">{isBn ? 'নাম (উল্টো)' : 'Name Z→A'}</option>
          <option value="salary-false">{isBn ? 'বেতন (বেশি)' : 'Salary: High→Low'}</option>
          <option value="salary-true">{isBn ? 'বেতন (কম)' : 'Salary: Low→High'}</option>
          <option value="department-true">{isBn ? 'বিভাগ' : 'Department'}</option>
          <option value="designation-true">{isBn ? 'পদবি' : 'Designation'}</option>
        </select>
      </div>

      <div className={`${card} p-0 overflow-hidden`}>
        {selected.length > 0 && (
          <div className="py-[10px] px-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--brand-light)] flex-wrap gap-2">
            <span className="text-xs font-medium text-[var(--brand)]">
              {selected.length} {isBn ? 'জন নির্বাচিত' : 'selected'}
            </span>
            <button onClick={handlePrintSelected}
              className="flex items-center gap-[5px] py-1.5 px-3.5 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
              <Download size={13} />{isBn ? 'নির্বাচিত ডাউনলোড' : 'Download Selected'}
            </button>
          </div>
        )}
        <div className={`overflow-x-auto ${isMobile ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
          <table className={`w-full border-collapse text-xs ${isMobile ? 'min-w-[600px]' : ''}`}>
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="py-[10px] px-3 w-10">
                  <input type="checkbox" checked={allSel} onChange={toggleAll}
                    className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                </th>
                <th className="py-[10px] px-3 w-10 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase">#</th>
                <th className="py-[10px] px-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase">{isBn ? 'নাম' : 'Name'}</th>
                <th className="py-[10px] px-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase">{isBn ? 'বিভাগ' : 'Dept'}</th>
                <th className="py-[10px] px-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase">{isBn ? 'পদবি' : 'Designation'}</th>
                <th className="py-[10px] px-3 text-right text-[10px] font-semibold text-[var(--text-muted)] uppercase">{isBn ? 'বেতন' : 'Salary'}</th>
                <th className="py-[10px] px-3 text-center text-[10px] font-semibold text-[var(--text-muted)] uppercase">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-[30px] text-center text-[var(--text-muted)]">
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
                const facilityTotal = getTeacherFacilityAmount(t.id)
                const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
                const fundAmount = Math.round(basic * (cfg?.fundContributionPercent || 0) / 100)
                const gross = basic + house + medical + conveyance + bonusVal + overtimeVal + festivalVal + facilityTotal
                const net = gross - deductionAmount - fundAmount
                const isExpanded = expandedId === t.id

                return (
                  <React.Fragment key={t.id}>
                    <tr className={`border-b border-[var(--border)] ${selected.includes(t.id) ? 'bg-[var(--brand-light)]' : 'bg-transparent hover:bg-[var(--bg-secondary)]'}`}>
                      <td className="py-[10px] px-3">
                        <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleOne(t.id)}
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                      </td>
                      <td className="py-[10px] px-3 text-[var(--text-muted)] text-[11px]">{i + 1}</td>
                      <td className="py-[10px] px-3">
                        <div className="text-xs font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                        <div className="text-[10px] text-[var(--brand)] font-mono">{t.id}</div>
                      </td>
                      <td className="py-[10px] px-3 text-[11px] text-[var(--text-secondary)]">{getDeptName(t.departmentId)}</td>
                      <td className="py-[10px] px-3 text-[11px] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                      <td className="py-[10px] px-3 text-xs font-semibold text-[var(--text-primary)] text-right">৳{t.salary.toLocaleString()}</td>
                      <td className="py-[10px] px-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => setExpandedId(isExpanded ? null : t.id)}
                            className="py-1 px-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer text-[10px] text-[var(--text-secondary)] font-[inherit] flex items-center gap-[3px]">
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            {isBn ? 'বিস্তারিত' : 'Details'}
                          </button>
                          <button onClick={() => handlePrintPayslip(t)}
                            className="py-1 px-2 rounded-md bg-[var(--brand-light)] border border-[var(--brand)] cursor-pointer text-[10px] text-[var(--brand)] font-[inherit] flex items-center gap-[3px]">
                            <Printer size={11} />PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="pt-0 px-4 pb-3">
                          <div className="bg-[var(--bg-secondary)] rounded-lg py-3.5 px-5 flex flex-wrap justify-center gap-y-4 gap-x-8">
                            <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--text-muted)] mb-1">{isBn ? 'মূল বেতন' : 'Basic Salary'}</div>
                              <div className="text-sm font-semibold text-[var(--text-primary)]">৳{basic.toLocaleString()}</div>
                            </div>
                            <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--text-muted)] mb-1">{isBn ? 'বাসা ভাড়া (১৫%)' : 'House Rent (15%)'}</div>
                              <div className="text-sm font-semibold text-[var(--text-primary)]">৳{house.toLocaleString()}</div>
                            </div>
                            <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--text-muted)] mb-1">{isBn ? 'চিকিৎসা (১০%)' : 'Medical (10%)'}</div>
                              <div className="text-sm font-semibold text-[var(--text-primary)]">৳{medical.toLocaleString()}</div>
                            </div>
                            <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--text-muted)] mb-1">{isBn ? 'যাতায়াত (৫%)' : 'Conveyance (5%)'}</div>
                              <div className="text-sm font-semibold text-[var(--text-primary)]">৳{conveyance.toLocaleString()}</div>
                            </div>
                            {bonusVal > 0 && <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--green)] mb-1">{isBn ? 'বোনাস' : 'Bonus'}</div>
                              <div className="text-sm font-semibold text-[var(--green)]">+৳{bonusVal.toLocaleString()}</div>
                            </div>}
                            {overtimeVal > 0 && <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--green)] mb-1">{isBn ? 'ওভারটাইম' : 'Overtime'}</div>
                              <div className="text-sm font-semibold text-[var(--green)]">+৳{overtimeVal.toLocaleString()}</div>
                            </div>}
                            {festivalVal > 0 && <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--green)] mb-1">{isBn ? 'উৎসব বোনাস' : 'Festival Bonus'}</div>
                              <div className="text-sm font-semibold text-[var(--green)]">+৳{festivalVal.toLocaleString()}</div>
                            </div>}
                            {getTeacherFacilityDetails(t.id).map((fac, fi) => (
                              <div key={fi} className="text-center min-w-[120px]">
                                <div className="text-[10px] text-[var(--green)] mb-1">{isBn ? fac.nameBn : fac.name}</div>
                                <div className="text-sm font-semibold text-[var(--green)]">+৳{fac.amount.toLocaleString()}</div>
                              </div>
                            ))}
                            {deductionAmount > 0 && <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--red)] mb-1">{isBn ? 'বেতন কাটা (১ দিন)' : 'Deduction (1 day)'}</div>
                              <div className="text-sm font-semibold text-[var(--red)]">-৳{deductionAmount.toLocaleString()}</div>
                            </div>}
                            {fundAmount > 0 && <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--red)] mb-1">{isBn ? 'তহবিল অংশদান' : 'Fund Contribution'}</div>
                              <div className="text-sm font-semibold text-[var(--red)]">-৳{fundAmount.toLocaleString()}</div>
                            </div>}
                            <div className="text-center min-w-[120px]">
                              <div className="text-[10px] text-[var(--green)] mb-1">{isBn ? 'নেট বেতন' : 'Net Salary'}</div>
                              <div className="text-base font-bold text-[var(--green)]">৳{net.toLocaleString()}</div>
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
