import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Search,
  Printer,
  ChevronDown,
  ChevronUp,
  Wallet,
  Calculator,
  Building2,
  Calendar,
  FileText,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import { useHRStore } from '@/store/hrStore'
import { SalarySlipPDFOptionsModal } from '@/components/shared/SalarySlipPDFOptionsModal'
import type { SalarySlipEmployee } from '@/pages/payroll/pdfTemplates/salarySlipPdfTemplate'
import { downloadHTML } from '@/lib/pdf'

type SortKey = 'name' | 'salary' | 'department' | 'designation'

export default function PayrollPage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { isMobile } = useWindowSize()
  const { teachers, departments } = useTeacherStore(
    useShallow((s) => ({
      teachers: s.teachers,
      departments: s.departments,
    }))
  )
  const { institution } = useClassStore()
  const { monthlySalaryConfigs, facilities, teacherFacilities } = useHRStore(
    useShallow((s) => ({
      monthlySalaryConfigs: s.monthlySalaryConfigs,
      facilities: s.facilities,
      teacherFacilities: s.teacherFacilities,
    }))
  )

  const [search, setSearch] = useState('')
  const [fDept, setFDept] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [month, setMonth] = useState('')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfMode, setPdfMode] = useState<'single' | 'batch'>('batch')
  const [pdfEmployee, setPdfEmployee] = useState<SalarySlipEmployee | null>(null)
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

  const departmentMap = useMemo(() => {
    const map = new Map<string, typeof departments[0]>()
    for (const d of departments) map.set(d.id, d)
    return map
  }, [departments])

  const getDeptName = useCallback(
    (id: string) => {
      return departmentMap.get(id)?.name || id
    },
    [departmentMap]
  )

  const facilityAmountMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const tf of teacherFacilities) {
      map.set(tf.teacherId, (map.get(tf.teacherId) || 0) + tf.amount)
    }
    return map
  }, [teacherFacilities])

  const facilityDetailsMap = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; amount: number }[]>()
    for (const tf of teacherFacilities) {
      const fac = facilities.find((f) => f.id === tf.facilityId)
      const entry = { name: fac?.name || 'Unknown', nameBn: fac?.nameBn || 'অজানা', amount: tf.amount }
      const arr = map.get(tf.teacherId) || []
      arr.push(entry)
      map.set(tf.teacherId, arr)
    }
    return map
  }, [teacherFacilities, facilities])

  const getTeacherFacilityAmount = useCallback(
    (teacherId: string) => facilityAmountMap.get(teacherId) || 0,
    [facilityAmountMap]
  )

  const getTeacherFacilityDetails = useCallback(
    (teacherId: string) => facilityDetailsMap.get(teacherId) || [],
    [facilityDetailsMap]
  )

  const activeTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (t.status !== 'active') return false
      if (!month) return true
      if (!t.salaryStartDate) return true
      const startMonth = t.salaryStartDate.slice(0, 7)
      return startMonth <= month
    })
  }, [teachers, month])

  const filtered = useMemo(() => {
    let list = activeTeachers
    if (fDept) list = list.filter((t) => t.departmentId === fDept)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.nameEn.toLowerCase().includes(q) || t.id.includes(q) || t.phone.includes(q))
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
    const salaries = activeTeachers.map((t) => t.salary)
    const total = salaries.reduce((s, v) => s + v, 0)
    const avg = salaries.length ? total / salaries.length : 0
    const max = salaries.length ? Math.max(...salaries) : 0
    const min = salaries.length ? Math.min(...salaries) : 0
    const deptMap: Record<string, number> = {}
    activeTeachers.forEach((t) => {
      const dept = getDeptName(t.departmentId)
      deptMap[dept] = (deptMap[dept] || 0) + t.salary
    })
    return { total, avg, max, min, count: activeTeachers.length, deptMap }
  }, [activeTeachers, getDeptName])

  const toggleAll = useCallback(() => {
    setSelected((p) => (p.length === filtered.length ? [] : filtered.map((t) => t.id)))
  }, [filtered])
  const toggleOne = useCallback((id: string) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }, [])
  const allSel = filtered.length > 0 && filtered.every((t) => selected.includes(t.id))

  const getMonthConfigs = useCallback(
    (teacherId: string) => {
      if (!month) return null
      return monthlySalaryConfigs.find((c: { teacherId: string; month: string }) => c.teacherId === teacherId && c.month === month) || null
    },
    [monthlySalaryConfigs, month]
  )

  const buildSalarySlipEmployee = useCallback(
    (t: (typeof teachers)[0]): SalarySlipEmployee => {
      const cfg = getMonthConfigs(t.id)
      return {
        id: t.id,
        nameEn: t.nameEn,
        nameBn: t.nameBn,
        departmentId: getDeptName(t.departmentId),
        designation: t.designation,
        salary: t.salary,
        overtime: t.overtime || 0,
        facilityTotal: getTeacherFacilityAmount(t.id),
        facilityDetails: getTeacherFacilityDetails(t.id),
        bonus: cfg?.bonus || 0,
        festivalBonus: cfg?.festivalBonus || 0,
        applyDeductionRule: cfg?.applyDeductionRule || false,
        fundContributionPercent: cfg?.fundContributionPercent || 0,
      }
    },
    [getMonthConfigs, getDeptName, getTeacherFacilityAmount, getTeacherFacilityDetails]
  )

  const handlePrintAll = () => {
    const rows = filtered
      .map((t, i) => {
        const basic = t.salary
        const cfg = getMonthConfigs(t.id)
        const bonusVal = cfg?.bonus || 0
        const festivalVal = cfg?.festivalBonus || 0
        const facilityTotal = getTeacherFacilityAmount(t.id)
        const deductionAmount = cfg?.applyDeductionRule ? Math.round(basic / 30) : 0
        const fundAmount = Math.round((basic * (cfg?.fundContributionPercent || 0)) / 100)
        const gross =
          basic +
          Math.round(basic * 0.15) +
          Math.round(basic * 0.1) +
          Math.round(basic * 0.05) +
          bonusVal +
          (t.overtime || 0) +
          festivalVal +
          facilityTotal
        const net = gross - deductionAmount - fundAmount
        return `<tr style="border-bottom:1px solid #eee">
        <td style="padding:6px 8px;font-size:11px">${i + 1}</td>
        <td style="padding:6px 8px;font-size:11px;font-family:monospace;color:#6366f1">${t.id}</td>
        <td style="padding:6px 8px;font-size:11px;font-weight:500">${t.nameEn}</td>
        <td style="padding:6px 8px;font-size:11px">${getDeptName(t.departmentId)}</td>
        <td style="padding:6px 8px;font-size:11px">${t.designation || '—'}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${basic.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${bonusVal.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${(t.overtime || 0).toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${festivalVal.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right">৳${facilityTotal.toLocaleString()}</td>
        <td style="padding:6px 8px;font-size:12px;font-weight:700;text-align:right;color:#10b981">৳${net.toLocaleString()}</td>
      </tr>`
      })
      .join('')

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
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s, t) => s + t.salary, 0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered
        .reduce((s, t) => {
          const cfg = getMonthConfigs(t.id)
          return s + (cfg?.bonus || 0)
        }, 0)
        .toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s, t) => s + (t.overtime || 0), 0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered
        .reduce((s, t) => {
          const cfg = getMonthConfigs(t.id)
          return s + (cfg?.festivalBonus || 0)
        }, 0)
        .toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:11px">৳${filtered.reduce((s, t) => s + getTeacherFacilityAmount(t.id), 0).toLocaleString()}</td>
      <td style="padding:8px;text-align:right;font-size:12px;font-weight:700;color:#10b981">৳${filtered
        .reduce((s, t) => {
          const b = t.salary
          const cfg = getMonthConfigs(t.id)
          const bv = cfg?.bonus || 0
          const fv = cfg?.festivalBonus || 0
          const ft = getTeacherFacilityAmount(t.id)
          const da = cfg?.applyDeductionRule ? Math.round(b / 30) : 0
          const fa = Math.round((b * (cfg?.fundContributionPercent || 0)) / 100)
          const g = b + Math.round(b * 0.15) + Math.round(b * 0.1) + Math.round(b * 0.05) + bv + (t.overtime || 0) + fv + ft
          return s + g - da - fa
        }, 0)
        .toLocaleString()}</td>
    </tr>
  </tbody>
</table></body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  const card = `bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.75rem] ${isMobile ? 'p-3' : 'p-[0.875rem]'}`

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`${isMobile ? 'text-lg' : 'text-[1.375rem]'} font-semibold text-[var(--text-primary)]`}>
            {isBn ? 'বেতন ব্যবস্থাপনা' : 'Payroll Management'}
          </h1>
          {monthSelected && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isBn
                ? `${MONTHS.find((m) => m.key === month.split('-')[1])?.bn || ''} ${month.split('-')[0]} · ${stats.count} জন কর্মচারী`
                : `${MONTHS.find((m) => m.key === month.split('-')[1])?.en || ''} ${month.split('-')[0]} · ${stats.count} employees`}
            </p>
          )}
        </div>
        {monthSelected && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3.5 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
            >
              <Printer size={13} />
              {isBn ? 'সব প্রিন্ট' : 'Print All'}
            </button>
            <button
              onClick={() => {
                setPdfMode('batch')
                setPdfEmployee(null)
                setShowPdfModal(true)
              }}
              className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3.5 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-xs font-medium cursor-pointer font-[inherit]"
            >
              <FileText size={13} />
              PDF
            </button>
          </div>
        )}
      </div>

      {!monthSelected && (
        <div className={`${card} mb-3.5`}>
          <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-2.5 flex items-center gap-1.5">
            <Calendar size={13} />
            {isBn ? 'মাস বেছে নিন' : 'Select Month'}
          </div>
          <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-4'} gap-2`}>
            {MONTHS.map((m) => {
              const val = `${currentYear}-${m.key}`
              const isCurrent = m.key === String(new Date().getMonth() + 1).padStart(2, '0') && currentYear === new Date().getFullYear()
              return (
                <button
                  key={m.key}
                  onClick={() => setMonth(val)}
                  className={`py-3.5 px-2.5 rounded-[0.625rem] border-2 ${isCurrent ? 'border-[var(--brand)]' : 'border-[var(--border)]'} ${isCurrent ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-secondary)]'} cursor-pointer font-[inherit] text-center transition-all duration-150 relative hover:border-[var(--brand)] hover:bg-[var(--brand-light)]`}
                >
                  {isCurrent && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
                  <div className={`text-[0.8125rem] font-semibold ${isCurrent ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]'}`}>
                    {isBn ? m.bn : m.en}
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{currentYear}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {monthSelected && (
        <div className="flex items-center gap-2 mb-3.5 flex-wrap">
          <div className={`${card} flex-1 py-[0.625rem] px-3.5 flex items-center gap-2`}>
            <Calendar size={16} className="text-[var(--brand)] shrink-0" />
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
              {isBn
                ? `${MONTHS.find((m) => m.key === month.split('-')[1])?.bn} ${month.split('-')[0]}`
                : `${MONTHS.find((m) => m.key === month.split('-')[1])?.en} ${month.split('-')[0]}`}
            </span>
            <button
              onClick={() => setMonth('')}
              className="ml-auto py-1 px-2.5 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.6875rem] cursor-pointer font-[inherit]"
            >
              {isBn ? 'মাস পরিবর্তন' : 'Change Month'}
            </button>
          </div>
        </div>
      )}

      {monthSelected && (
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-2.5 mb-3.5`}>
          {[
            {
              label: isBn ? 'মোট বেতন' : 'Total Payroll',
              value: `৳${stats.total.toLocaleString()}`,
              icon: Wallet,
              colorClass: 'text-[var(--brand)]',
              bgClass: 'bg-[var(--brand-light)]',
            },
            {
              label: isBn ? 'গড় বেতন' : 'Avg Salary',
              value: `৳${Math.round(stats.avg).toLocaleString()}`,
              icon: Calculator,
              colorClass: 'text-[var(--teal)]',
              bgClass: 'bg-[var(--teal-light)]',
            },
            {
              label: isBn ? 'সর্বোচ্চ' : 'Highest',
              value: `৳${stats.max.toLocaleString()}`,
              icon: TrendingUp,
              colorClass: 'text-[var(--green)]',
              bgClass: 'bg-[var(--green-light)]',
            },
            {
              label: isBn ? 'সর্বনিম্ন' : 'Lowest',
              value: `৳${stats.min.toLocaleString()}`,
              icon: TrendingDown,
              colorClass: 'text-[var(--red)]',
              bgClass: 'bg-[var(--red-light)]',
            },
          ].map((s) => (
            <div key={s.label} className={card}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${s.bgClass} flex items-center justify-center shrink-0`}>
                  <s.icon size={15} className={s.colorClass} />
                </div>
                <div>
                  <div className={`${isMobile ? 'text-[0.9375rem]' : 'text-[1.0625rem]'} font-bold text-[var(--text-primary)]`}>{s.value}</div>
                  <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {monthSelected && Object.keys(stats.deptMap).length > 0 && (
        <div className={`${card} mb-3.5`}>
          <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-2.5 flex items-center gap-1.5">
            <Building2 size={13} />
            {isBn ? 'বিভাগ অনুযায়ী বেতন' : 'Department-wise Salary'}
          </div>
          <div
            className={`grid gap-2 ${isMobile ? 'grid-cols-2' : ''}`}
            style={isMobile ? undefined : { gridTemplateColumns: `repeat(${Math.min(Object.keys(stats.deptMap).length, 4)}, 1fr)` }}
          >
            {Object.entries(stats.deptMap)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, total]) => (
                <div key={dept} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{dept}</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">৳{total.toLocaleString()}</div>
                  <div className="h-1 rounded-[0.125rem] bg-[var(--border)] mt-1.5 overflow-hidden">
                    <div className="h-full rounded-[0.125rem] bg-[var(--brand)]" style={{ width: `${(total / stats.total) * 100}%` }} />
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-muted)] mt-1">{Math.round((total / stats.total) * 100)}%</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {monthSelected && (
        <>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-[1fr_200px_160px]'} gap-2 mb-2.5`}>
            <div className="flex items-center gap-[0.4375rem] bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg py-[0.4375rem] px-2.5">
              <Search size={14} className="text-[var(--text-muted)] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isBn ? 'নাম, আইডি, মোবাইল...' : 'Name, ID, phone...'}
                className="flex-1 border-none bg-transparent outline-none text-xs text-[var(--text-primary)] font-[inherit]"
              />
            </div>
            <select
              value={fDept}
              onChange={(e) => setFDept(e.target.value)}
              className="py-[0.4375rem] px-[0.5625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs font-[inherit]"
            >
              <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {isBn ? d.nameBn : d.name}
                </option>
              ))}
            </select>
            <select
              value={`${sortKey}-${sortAsc}`}
              onChange={(e) => {
                const [k, a] = e.target.value.split('-')
                setSortKey(k as SortKey)
                setSortAsc(a === 'true')
              }}
              className="py-[0.4375rem] px-[0.5625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs font-[inherit]"
            >
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
              <div className="py-[0.625rem] px-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--brand-light)]">
                <span className="text-xs font-medium text-[var(--brand)]">
                  {selected.length} {isBn ? 'জন নির্বাচিত' : 'selected'}
                </span>
                <div className="flex gap-1 justify-center md:justify-end">
                  <button
                    onClick={() => {
                      setPdfMode('batch')
                      setPdfEmployee(null)
                      setShowPdfModal(true)
                    }}
                    className="py-1 px-2 rounded-md bg-[var(--brand-light)] border border-[var(--brand)] cursor-pointer text-[0.625rem] text-[var(--brand)] font-[inherit] flex items-center gap-[0.1875rem]"
                  >
                    <FileText size={11} />
                    PDF
                  </button>
                </div>
              </div>
            )}
            <div className={`overflow-x-auto ${isMobile ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
              <table className={`w-full border-collapse text-xs ${isMobile ? 'min-w-[37.5rem]' : ''}`}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="py-[0.625rem] px-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSel}
                        onChange={toggleAll}
                        className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                      />
                    </th>
                    <th className="py-[0.625rem] px-3 w-10 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">#</th>
                    <th className="py-[0.625rem] px-3 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                      {isBn ? 'নাম' : 'Name'}
                    </th>
                    <th className="py-[0.625rem] px-3 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                      {isBn ? 'বিভাগ' : 'Dept'}
                    </th>
                    <th className="py-[0.625rem] px-3 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                      {isBn ? 'পদবি' : 'Designation'}
                    </th>
                    <th className="py-[0.625rem] px-3 text-right text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                      {isBn ? 'বেতন' : 'Salary'}
                    </th>
                    <th className="py-[0.625rem] px-3 text-center md:text-right text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                      {isBn ? 'অ্যাকশন' : 'Action'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-[1.875rem] text-center text-[var(--text-muted)]">
                        {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No employees found'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t, i) => {
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
                      const fundAmount = Math.round((basic * (cfg?.fundContributionPercent || 0)) / 100)
                      const gross = basic + house + medical + conveyance + bonusVal + overtimeVal + festivalVal + facilityTotal
                      const net = gross - deductionAmount - fundAmount
                      const isExpanded = expandedId === t.id

                      return (
                        <React.Fragment key={t.id}>
                          <tr
                            className={`border-b border-[var(--border)] ${selected.includes(t.id) ? 'bg-[var(--brand-light)]' : 'bg-transparent hover:bg-[var(--bg-secondary)]'}`}
                          >
                            <td className="py-[0.625rem] px-3">
                              <input
                                type="checkbox"
                                checked={selected.includes(t.id)}
                                onChange={() => toggleOne(t.id)}
                                className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                              />
                            </td>
                            <td className="py-[0.625rem] px-3 text-[var(--text-muted)] text-[0.6875rem]">{i + 1}</td>
                            <td className="py-[0.625rem] px-3">
                              <div className="text-xs font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                              <div className="text-[0.625rem] text-[var(--brand)] font-mono">{t.id}</div>
                            </td>
                            <td className="py-[0.625rem] px-3 text-[0.6875rem] text-[var(--text-secondary)]">{getDeptName(t.departmentId)}</td>
                            <td className="py-[0.625rem] px-3 text-[0.6875rem] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                            <td className="py-[0.625rem] px-3 text-xs font-semibold text-[var(--text-primary)] text-right">
                              ৳{t.salary.toLocaleString()}
                            </td>
                            <td className="py-[0.625rem] px-3 text-center md:text-right">
                              <div className="flex gap-1 justify-center md:justify-end">
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                                  className="py-1 px-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer text-[0.625rem] text-[var(--text-secondary)] font-[inherit] flex items-center gap-[0.1875rem]"
                                >
                                  {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                  {isBn ? 'বিস্তারিত' : 'Details'}
                                </button>
                                <button
                                  onClick={() => {
                                    setPdfMode('single')
                                    setPdfEmployee(buildSalarySlipEmployee(t))
                                    setShowPdfModal(true)
                                  }}
                                  className="py-1 px-2 rounded-md bg-[var(--brand-light)] border border-[var(--brand)] cursor-pointer text-[0.625rem] text-[var(--brand)] font-[inherit] flex items-center gap-[0.1875rem]"
                                >
                                  <FileText size={11} />
                                  PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="pt-0 px-4 pb-3">
                                <div className="bg-[var(--bg-secondary)] rounded-lg py-3.5 px-5 flex flex-wrap justify-center gap-y-4 gap-x-8">
                                  <div className="text-center min-w-[7.5rem]">
                                    <div className="text-[0.625rem] text-[var(--text-muted)] mb-1">{isBn ? 'মূল বেতন' : 'Basic Salary'}</div>
                                    <div className="text-sm font-semibold text-[var(--text-primary)]">৳{basic.toLocaleString()}</div>
                                  </div>
                                  <div className="text-center min-w-[7.5rem]">
                                    <div className="text-[0.625rem] text-[var(--text-muted)] mb-1">
                                      {isBn ? 'বাসা ভাড়া (১৫%)' : 'House Rent (15%)'}
                                    </div>
                                    <div className="text-sm font-semibold text-[var(--text-primary)]">৳{house.toLocaleString()}</div>
                                  </div>
                                  <div className="text-center min-w-[7.5rem]">
                                    <div className="text-[0.625rem] text-[var(--text-muted)] mb-1">
                                      {isBn ? 'চিকিৎসা (১০%)' : 'Medical (10%)'}
                                    </div>
                                    <div className="text-sm font-semibold text-[var(--text-primary)]">৳{medical.toLocaleString()}</div>
                                  </div>
                                  <div className="text-center min-w-[7.5rem]">
                                    <div className="text-[0.625rem] text-[var(--text-muted)] mb-1">
                                      {isBn ? 'যাতায়াত (৫%)' : 'Conveyance (5%)'}
                                    </div>
                                    <div className="text-sm font-semibold text-[var(--text-primary)]">৳{conveyance.toLocaleString()}</div>
                                  </div>
                                  {bonusVal > 0 && (
                                    <div className="text-center min-w-[7.5rem]">
                                      <div className="text-[0.625rem] text-[var(--green)] mb-1">{isBn ? 'বোনাস' : 'Bonus'}</div>
                                      <div className="text-sm font-semibold text-[var(--green)]">+৳{bonusVal.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {overtimeVal > 0 && (
                                    <div className="text-center min-w-[7.5rem]">
                                      <div className="text-[0.625rem] text-[var(--green)] mb-1">{isBn ? 'ওভারটাইম' : 'Overtime'}</div>
                                      <div className="text-sm font-semibold text-[var(--green)]">+৳{overtimeVal.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {festivalVal > 0 && (
                                    <div className="text-center min-w-[7.5rem]">
                                      <div className="text-[0.625rem] text-[var(--green)] mb-1">{isBn ? 'উৎসব বোনাস' : 'Festival Bonus'}</div>
                                      <div className="text-sm font-semibold text-[var(--green)]">+৳{festivalVal.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {getTeacherFacilityDetails(t.id).map((fac, fi) => (
                                    <div key={fi} className="text-center min-w-[7.5rem]">
                                      <div className="text-[0.625rem] text-[var(--green)] mb-1">{isBn ? fac.nameBn : fac.name}</div>
                                      <div className="text-sm font-semibold text-[var(--green)]">+৳{fac.amount.toLocaleString()}</div>
                                    </div>
                                  ))}
                                  {deductionAmount > 0 && (
                                    <div className="text-center min-w-[7.5rem]">
                                      <div className="text-[0.625rem] text-[var(--red)] mb-1">
                                        {isBn ? 'বেতন কাটা (১ দিন)' : 'Deduction (1 day)'}
                                      </div>
                                      <div className="text-sm font-semibold text-[var(--red)]">-৳{deductionAmount.toLocaleString()}</div>
                                    </div>
                                  )}
                                  {fundAmount > 0 && (
                                    <div className="text-center min-w-[7.5rem]">
                                      <div className="text-[0.625rem] text-[var(--red)] mb-1">
                                        {isBn ? 'তহবিল অংশদান' : 'Fund Contribution'}
                                      </div>
                                      <div className="text-sm font-semibold text-[var(--red)]">-৳{fundAmount.toLocaleString()}</div>
                                    </div>
                                  )}
                                  <div className="text-center min-w-[7.5rem]">
                                    <div className="text-[0.625rem] text-[var(--green)] mb-1">{isBn ? 'নেট বেতন' : 'Net Salary'}</div>
                                    <div className="text-base font-bold text-[var(--green)]">৳{net.toLocaleString()}</div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* PDF Download Modal */}
      {showPdfModal && pdfMode === 'single' && pdfEmployee && (
        <SalarySlipPDFOptionsModal
          mode="single"
          employee={pdfEmployee}
          month={month}
          isBn={isBn}
          institutionName={institution.name}
          onClose={() => setShowPdfModal(false)}
          onDownload={(html) => {
            downloadHTML(`payroll_${month}.html`, html)
            setShowPdfModal(false)
          }}
        />
      )}
      {showPdfModal && pdfMode === 'batch' && (
        <SalarySlipPDFOptionsModal
          mode="batch"
          employees={filtered.filter((t) => (selected.length > 0 ? selected.includes(t.id) : true)).map(buildSalarySlipEmployee)}
          month={month}
          isBn={isBn}
          institutionName={institution.name}
          onClose={() => setShowPdfModal(false)}
          onDownload={(html) => {
            downloadHTML(`payroll_${month}.html`, html)
            setShowPdfModal(false)
          }}
        />
      )}
    </div>
  )
}
