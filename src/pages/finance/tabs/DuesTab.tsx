import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { Search, DollarSign, Users, CalendarDays, Ban, CheckCircle2, ChevronDown, CircleCheck, FileSpreadsheet, FileText } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeDue } from '@/store/feeStore'
import { XLSX } from '@/lib/excelExport'

interface Props {
  onCollect: (due: FeeDue) => void
}

const MONTH_LABELS = [
  { en: 'Jan', bn: 'জানুয়ারি' },
  { en: 'Feb', bn: 'ফেব্রুয়ারি' },
  { en: 'Mar', bn: 'মার্চ' },
  { en: 'Apr', bn: 'এপ্রিল' },
  { en: 'May', bn: 'মে' },
  { en: 'Jun', bn: 'জুন' },
  { en: 'Jul', bn: 'জুলাই' },
  { en: 'Aug', bn: 'আগস্ট' },
  { en: 'Sep', bn: 'সেপ্টেম্বর' },
  { en: 'Oct', bn: 'অক্টোবর' },
  { en: 'Nov', bn: 'নভেম্বর' },
  { en: 'Dec', bn: 'ডিসেম্বর' },
]

const selectCls = 'h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer'

interface MonthCell {
  paid: boolean
  amount: number
}

interface DueMatrixRow {
  studentId: string
  studentName: string
  studentNameBn: string
  class: string
  section: string
  roll: string
  photo: string
  feeStructureId: string
  feeName: string
  feeNameBn: string
  feeType: 'monthly' | 'onetime'
  totalAmount: number
  months: Record<number, MonthCell>
  totalDue: number
  totalPaid: number
  allPaid: boolean
}

export const DuesTab = React.memo(function DuesTab({ onCollect }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const { structures, payments, waivers } = useFeeStore()

  const [fType, setFType] = useState<'monthly' | 'onetime' | ''>('')
  const [fCategory, setFCategory] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fStatus, setFStatus] = useState<'all' | 'paid' | 'due'>('all')
  const [fYear, setFYear] = useState(() => new Date().getFullYear())
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set([new Date().getMonth()]))
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const monthDropdownRef = useRef<HTMLDivElement>(null)
  const [showResults, setShowResults] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (fClass ? sectionsMap[fClass] || [] : []), [fClass, sectionsMap])

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === 'approved' && s.active !== false),
    [students]
  )

  const activeStructures = useMemo(
    () => structures.filter((s) => s.isActive),
    [structures]
  )

  const categoryOptions = useMemo(() => {
    let list = activeStructures
    if (fType) list = list.filter((s) => s.type === fType)
    const names = new Set(list.map((s) => s.name))
    return Array.from(names)
  }, [activeStructures, fType])

  const feeStructuresForCategory = useMemo(() => {
    let list = activeStructures
    if (fCategory) list = list.filter((s) => s.name === fCategory)
    if (fType) list = list.filter((s) => s.type === fType)
    return list
  }, [activeStructures, fCategory, fType])

  const showMonthPicker = fType === 'monthly' || (!fType && feeStructuresForCategory.some((s) => s.type === 'monthly'))

  const sortedMonths = useMemo(() => Array.from(selectedMonths).sort((a, b) => a - b), [selectedMonths])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setShowMonthDropdown(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggleMonth = useCallback((m: number) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(m)) next.delete(m)
      else next.add(m)
      return next
    })
    setShowResults(false)
    setSelectedRows(new Set())
  }, [])

  const selectAllMonths = useCallback(() => {
    setSelectedMonths(new Set(MONTH_LABELS.map((_, i) => i)))
    setShowResults(false)
    setSelectedRows(new Set())
  }, [])

  const clearAllMonths = useCallback(() => {
    setSelectedMonths(new Set())
    setShowResults(false)
    setSelectedRows(new Set())
  }, [])

  const monthDisplayText = useMemo(() => {
    if (selectedMonths.size === 0) return bn ? 'মাস বাছাই করুন' : 'Select months'
    if (selectedMonths.size === 12) return bn ? 'সব মাস' : 'All months'
    const labels = sortedMonths.map((m) => bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en)
    if (labels.length <= 3) return labels.join(', ')
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
  }, [selectedMonths, sortedMonths, bn])

  const allResults = useMemo<DueMatrixRow[]>(() => {
    if (!showResults) return []
    if (feeStructuresForCategory.length === 0 || activeStudents.length === 0) return []

    const rows: DueMatrixRow[] = []
    const filteredStudents = activeStudents.filter((s) => {
      if (fClass && s.class !== fClass) return false
      if (fSection && s.section !== fSection) return false
      return true
    })

    const monthsToShow = showMonthPicker ? sortedMonths : []

    for (const fee of feeStructuresForCategory) {
      for (const student of filteredStudents) {
        if (fee.class !== student.class) continue
        if (fee.section && fee.section !== student.section) continue

        if (fee.type === 'onetime') {
          const paid = payments
            .filter((p) => p.studentId === student.id && p.feeStructureId === fee.id)
            .reduce((sum, p) => sum + p.amount, 0)
          const waived = waivers
            .filter((w) => w.studentId === student.id && w.feeStructureId === fee.id)
            .reduce((sum, w) => sum + w.amount, 0)
          const due = fee.amount - paid - waived
          rows.push({
            studentId: student.id,
            studentName: student.nameEn,
            studentNameBn: student.nameBn,
            class: student.class,
            section: student.section,
            roll: student.roll,
            photo: student.photo,
            feeStructureId: fee.id,
            feeName: fee.name,
            feeNameBn: fee.nameBn,
            feeType: 'onetime',
            totalAmount: fee.amount,
            months: {},
            totalDue: Math.max(0, due),
            totalPaid: paid,
            allPaid: due <= 0,
          })
        } else {
          const monthCells: Record<number, MonthCell> = {}

          const billingDateStr = student.billingDate
          let billingMonthIdx = -1
          let billingYear = -1
          if (billingDateStr) {
            const bd = new Date(billingDateStr)
            billingYear = bd.getFullYear()
            billingMonthIdx = bd.getMonth()
          }

          for (const m of monthsToShow) {
            const isBeforeBilling = billingYear > 0 && (fYear < billingYear || (fYear === billingYear && m < billingMonthIdx))

            if (isBeforeBilling) {
              monthCells[m] = { paid: true, amount: 0 }
              continue
            }

            const monthKey = `${fYear}-${String(m + 1).padStart(2, '0')}`
            const monthPayments = payments.filter((p) => {
              if (p.studentId !== student.id || p.feeStructureId !== fee.id) return false
              if (p.forMonth) return p.forMonth === monthKey
              const d = new Date(p.paidAt)
              return d.getFullYear() === fYear && d.getMonth() === m
            })
            const paid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
            const discount = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0)
            const monthWaivers = waivers.filter((w) => {
              if (w.studentId !== student.id || w.feeStructureId !== fee.id) return false
              const d = new Date(w.createdAt)
              return d.getFullYear() === fYear && d.getMonth() === m
            })
            const waived = monthWaivers.reduce((sum, w) => sum + w.amount, 0)
            const receivable = fee.amount - paid - discount - waived
            monthCells[m] = { paid: receivable <= 0, amount: Math.max(0, receivable) }
          }

          const totalDueAmount = Object.values(monthCells).reduce((sum, c) => sum + c.amount, 0)
          const allPaid = Object.values(monthCells).length > 0 && Object.values(monthCells).every((c) => c.paid)

          rows.push({
            studentId: student.id,
            studentName: student.nameEn,
            studentNameBn: student.nameBn,
            class: student.class,
            section: student.section,
            roll: student.roll,
            photo: student.photo,
            feeStructureId: fee.id,
            feeName: fee.name,
            feeNameBn: fee.nameBn,
            feeType: 'monthly',
            totalAmount: fee.amount,
            months: monthCells,
            totalDue: totalDueAmount,
            totalPaid: 0,
            allPaid,
          })
        }
      }
    }

    return rows
  }, [showResults, feeStructuresForCategory, activeStudents, fClass, fSection, payments, waivers, fYear, sortedMonths, showMonthPicker])

  const results = useMemo(() => {
    if (fStatus === 'due') return allResults.filter((r) => r.totalDue > 0)
    if (fStatus === 'paid') return allResults.filter((r) => r.allPaid)
    return allResults
  }, [allResults, fStatus])

  const totalDue = useMemo(() => results.reduce((sum, r) => sum + r.totalDue, 0), [results])
  const studentCount = useMemo(() => new Set(results.map((r) => r.studentId)).size, [results])

  const handleFindDue = useCallback(() => {
    setShowResults(true)
    setSelectedRows(new Set())
  }, [])

  const toggleRowSelection = useCallback((key: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleAllRows = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === results.length) return new Set()
      return new Set(results.map((r) => `${r.studentId}-${r.feeStructureId}`))
    })
  }, [results])

  const buildCollectDue = useCallback((row: DueMatrixRow, monthIdx?: number): FeeDue | null => {
    const fee = feeStructuresForCategory.find((f) => f.id === row.feeStructureId)
    if (!fee) return null
    return {
      studentId: row.studentId,
      studentName: row.studentName,
      studentNameBn: row.studentNameBn,
      class: row.class,
      section: row.section,
      roll: row.roll,
      photo: row.photo,
      feeStructureId: row.feeStructureId,
      feeName: fee.name,
      feeNameBn: fee.nameBn,
      totalAmount: fee.amount,
      paidAmount: 0,
      waivedAmount: 0,
      dueAmount: monthIdx !== undefined ? (row.months[monthIdx]?.amount || 0) : row.totalDue,
      isActive: true,
    }
  }, [feeStructuresForCategory])

  const exportExcel = useCallback(() => {
    const rows = results
    const sheetData = rows.map((r) => {
      const row: Record<string, string | number> = {
        [bn ? 'শিক্ষার্থী' : 'Student']: bn ? r.studentNameBn || r.studentName : r.studentName,
        [bn ? 'রোল' : 'Roll']: r.roll,
        [bn ? 'শ্রেণি' : 'Class']: `${r.class}${r.section ? `-${r.section}` : ''}`,
        [bn ? 'ফি' : 'Fee']: bn ? r.feeNameBn : r.feeName,
        [bn ? 'ধরন' : 'Type']: r.feeType === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time'),
        [bn ? 'মোট ফি' : 'Total Fee']: r.totalAmount,
      }
      if (showMonthPicker) {
        for (const m of sortedMonths) {
          const label = bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en
          const cell = r.months[m]
          row[label] = cell ? (cell.paid ? (bn ? 'পরিশোধিত' : 'Paid') : cell.amount) : '—'
        }
      }
      row[bn ? 'মোট বকেয়' : 'Total Due'] = r.totalDue
      return row
    })
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'বকেয়' : 'Dues')
    XLSX.writeFile(wb, `dues-${fYear}.xlsx`)
  }, [results, fYear, bn, showMonthPicker, sortedMonths])

  const exportPdf = useCallback(() => {
    const rows = results
    const title = bn ? `বকেয় তালিকা — ${fYear}` : `Dues List — ${fYear}`
    const monthHeaders = showMonthPicker
      ? sortedMonths.map((m) => `<th style="background:#1e3a5f;color:#fff;padding:6px 8px;text-align:center;font-weight:600;min-width:60px">${bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en}</th>`)
      : ''
    const monthCells = (r: DueMatrixRow) => {
      if (!showMonthPicker) return ''
      return sortedMonths.map((m) => {
        const cell = r.months[m]
        if (!cell) return '<td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center">—</td>'
        if (cell.paid) return `<td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center;color:#16a34a;font-weight:700">✓</td>`
        return `<td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center;color:#d97706;font-weight:700">${cell.amount.toLocaleString()}</td>`
      }).join('')
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@page{size:A4 landscape;margin:15mm}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}h1{font-size:16px;color:#1e3a5f;margin:0 0 10px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:center;font-weight:600}td{padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.footer{margin-top:15px;font-size:9px;color:#999;text-align:right}</style></head><body>
<h1>${title}</h1>
<table><thead><tr>
<th style="text-align:left">Student</th><th>Roll</th><th>Class</th><th>Fee</th><th>Type</th><th>Fee Amt</th>
${monthHeaders}
<th>Total Due</th>
</tr></thead><tbody>
${rows.map((r) => `<tr>
<td style="text-align:left;font-weight:600">${bn ? r.studentNameBn || r.studentName : r.studentName}</td>
<td>${r.roll}</td><td>${r.class}${r.section ? `-${r.section}` : ''}</td>
<td>${bn ? r.feeNameBn : r.feeName}</td>
<td>${r.feeType === 'monthly' ? 'Monthly' : 'One-time'}</td>
<td style="text-align:right">${r.totalAmount.toLocaleString()}</td>
${monthCells(r)}
<td style="text-align:right;font-weight:700;color:#d97706">${r.totalDue.toLocaleString()}</td>
</tr>`).join('')}
</tbody></table>
<div class="footer">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (w) w.onload = () => w.print()
  }, [results, fYear, bn, showMonthPicker, sortedMonths])

  const fmt = (n: number) => n.toLocaleString()

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5">
        {/* Row 1: Year + Type + Category + Status + Month + Find Due */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={fYear}
            onChange={(e) => { setFYear(Number(e.target.value)); setShowResults(false); setSelectedRows(new Set()) }}
            className={selectCls}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={fType}
            onChange={(e) => { setFType(e.target.value as '' | 'monthly' | 'onetime'); setFCategory(''); setShowResults(false); setSelectedRows(new Set()) }}
            className={selectCls}
          >
            <option value="">{bn ? 'সব ধরন' : 'All types'}</option>
            <option value="monthly">{bn ? 'মাসিক' : 'Monthly'}</option>
            <option value="onetime">{bn ? 'এককালীন' : 'One-time'}</option>
          </select>
          <select
            value={fCategory}
            onChange={(e) => { setFCategory(e.target.value); setShowResults(false); setSelectedRows(new Set()) }}
            className={selectCls}
          >
            <option value="">{bn ? 'সব ক্যাটাগরি' : 'All categories'}</option>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={fStatus}
            onChange={(e) => { setFStatus(e.target.value as 'all' | 'paid' | 'due'); setSelectedRows(new Set()) }}
            className={selectCls}
          >
            <option value="all">{bn ? 'সব' : 'All'}</option>
            <option value="paid">{bn ? 'পরিশোধিত' : 'Paid'}</option>
            <option value="due">{bn ? 'বকেয়' : 'Due'}</option>
          </select>
          {showMonthPicker && (
            <div className="relative" ref={monthDropdownRef}>
              <button
                onClick={() => setShowMonthDropdown((p) => !p)}
                className="h-[34px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] cursor-pointer flex items-center gap-1.5 min-w-[160px] outline-none focus:border-[var(--brand)]"
              >
                <CalendarDays size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="truncate text-left flex-1">{monthDisplayText}</span>
                <ChevronDown size={13} className="text-[var(--text-muted)] flex-shrink-0" />
              </button>
              {showMonthDropdown && (
                <div className="absolute z-50 mt-1 w-[220px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_12px_30px_rgba(20,23,33,0.12)] p-2">
                  <div className="flex items-center gap-1 mb-1.5 pb-1.5 border-b border-[var(--border)]">
                    <button onClick={selectAllMonths} className="text-[11px] font-semibold text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0">{bn ? 'সব নির্বাচন' : 'Select all'}</button>
                    <span className="text-[var(--text-muted)]">·</span>
                    <button onClick={clearAllMonths} className="text-[11px] font-semibold text-[var(--text-muted)] hover:underline cursor-pointer bg-transparent border-0 p-0">{bn ? 'পরিষ্কার' : 'Clear'}</button>
                    <span className="text-[11px] text-[var(--text-muted)] ml-auto">{selectedMonths.size}/12</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTH_LABELS.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => toggleMonth(i)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer transition-all ${
                          selectedMonths.has(i)
                            ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]'
                            : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border ${selectedMonths.has(i) ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border)]'}`}>
                          {selectedMonths.has(i) && <CheckCircle2 size={9} className="text-white" />}
                        </div>
                        {bn ? m.bn : m.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="ml-auto">
            <button
              onClick={handleFindDue}
              className="h-[34px] px-4 rounded-lg bg-[var(--brand)] text-white font-semibold text-[13px] border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Search size={14} />{bn ? 'খুঁজুন' : 'Find'}
            </button>
          </div>
        </div>
        {/* Row 2: Class + Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={fClass}
            onChange={(e) => { setFClass(e.target.value); setFSection(''); setShowResults(false); setSelectedRows(new Set()) }}
            className={selectCls}
          >
            <option value="">{bn ? 'সব শ্রেণি' : 'All classes'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {fClass && (
            <select
              value={fSection}
              onChange={(e) => { setFSection(e.target.value); setShowResults(false); setSelectedRows(new Set()) }}
              className={selectCls}
            >
              <option value="">{bn ? 'সব সেকশন' : 'All sections'}</option>
              {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Stats — only shown after Find Due */}
      {showResults && results.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)]"><DollarSign size={16} /></span>
              <span className="text-[0.7rem] text-[var(--text-secondary)]">{bn ? 'মোট বকেয়' : 'Total Due'}</span>
            </div>
            <p className="text-lg font-bold text-[var(--brand)]">{fmt(totalDue)}</p>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--amber-light)] text-[var(--amber)]"><Users size={16} /></span>
              <span className="text-[0.7rem] text-[var(--text-secondary)]">{bn ? 'বকেয় শিক্ষার্থী' : 'Students with Dues'}</span>
            </div>
            <p className="text-lg font-bold text-[var(--amber)]">{studentCount}</p>
          </div>
        </div>
      )}

      {/* Action Bar — shown when results exist and rows are selected */}
      {showResults && results.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-[var(--text-muted)]">
            {selectedRows.size > 0
              ? `${selectedRows.size} ${bn ? 'নির্বাচিত' : 'selected'}`
              : `${results.length} ${bn ? 'টি ফলাফল' : 'results'}`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={exportExcel}
              disabled={selectedRows.size === 0}
              className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[12px] font-semibold cursor-pointer flex items-center gap-1.5 hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button
              onClick={exportPdf}
              disabled={selectedRows.size === 0}
              className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[12px] font-semibold cursor-pointer flex items-center gap-1.5 hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText size={13} /> PDF
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!showResults ? (
        <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
          <div className="text-center">
            <Search size={32} className="mx-auto mb-2 opacity-50" />
            <p>{bn ? 'ফিল্টার নির্বাচন করে "খুঁজুন" ক্লিক করুন' : 'Select filters and click "Find" to view dues'}</p>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
          <div className="text-center">
            <Ban size={32} className="mx-auto mb-2 opacity-50" />
            <p>{bn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found for the selected filters'}</p>
          </div>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-xl overflow-auto max-h-[400px] bg-[var(--bg-primary)]">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="text-center px-2 py-2 w-[36px] sticky left-0 bg-[var(--bg-secondary)] z-20">
                  <input
                    type="checkbox"
                    checked={results.length > 0 && selectedRows.size === results.length}
                    onChange={toggleAllRows}
                    className="w-3.5 h-3.5 accent-[var(--brand)] cursor-pointer"
                  />
                </th>
                <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky left-[36px] bg-[var(--bg-secondary)] z-20">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'রোল' : 'Roll'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'শ্রেণি' : 'Class'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ফি' : 'Fee'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ধরন' : 'Type'}</th>
                <th className="text-right px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ফির পরিমাণ' : 'Fee Amt'}</th>
                {showMonthPicker && sortedMonths.map((m) => (
                  <th key={m} className="text-center px-2 py-2 text-[10px] uppercase font-bold sticky top-0 z-10" style={{ background: 'var(--bg-secondary)', color: 'var(--brand)', minWidth: '70px' }}>
                    {bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en}
                  </th>
                ))}
                {!showMonthPicker && (
                  <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'বকেয়' : 'Due'}</th>
                )}
                <th className="text-right px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'মোট বকেয়' : 'Total Due'}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => {
                const rowKey = `${row.studentId}-${row.feeStructureId}`
                const isChecked = selectedRows.has(rowKey)
                return (
                  <tr key={`${rowKey}-${i}`} className={`border-t border-[var(--border)] transition-colors ${isChecked ? 'bg-[var(--brand-light)]/60' : 'hover:bg-[var(--brand-light)]/40'}`}>
                    <td className="text-center px-2 py-2 sticky left-0 bg-[var(--bg-primary)] z-10" style={{ background: isChecked ? 'var(--brand-light)' : 'var(--bg-primary)' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRowSelection(rowKey)}
                        className="w-3.5 h-3.5 accent-[var(--brand)] cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2 sticky left-[36px] bg-[var(--bg-primary)] z-10" style={{ background: isChecked ? 'var(--brand-light)' : 'var(--bg-primary)' }}>
                      <p className="font-semibold text-[var(--text-primary)] text-[12px]">{bn ? row.studentNameBn || row.studentName : row.studentName}</p>
                    </td>
                    <td className="text-center px-2 py-2 text-[var(--text-secondary)]">{row.roll}</td>
                    <td className="text-center px-2 py-2 text-[var(--text-secondary)]">{row.class}{row.section ? `-${row.section}` : ''}</td>
                    <td className="text-center px-2 py-2">
                      <span className="font-semibold text-[var(--text-primary)] text-[11px]">{bn ? row.feeNameBn : row.feeName}</span>
                    </td>
                    <td className="text-center px-2 py-2">
                      <span className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                        background: row.feeType === 'onetime' ? 'var(--amber-light)' : 'var(--brand-light)',
                        color: row.feeType === 'onetime' ? 'var(--amber)' : 'var(--brand)',
                      }}>
                        {row.feeType === 'onetime'
                          ? (bn ? 'এককালীন' : 'One-time')
                          : (bn ? 'মাসিক' : 'Monthly')}
                      </span>
                    </td>
                    <td className="text-right px-2 py-2 text-[var(--text-secondary)]">{fmt(row.totalAmount)}</td>
                    {showMonthPicker && sortedMonths.map((m) => {
                      const cell = row.months[m]
                      if (!cell) return <td key={m} className="text-center px-2 py-2 text-[var(--text-muted)]">—</td>
                      return (
                        <td key={m} className="text-center px-2 py-2">
                          {cell.paid ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--green-light)]">
                              <CircleCheck size={14} className="text-[var(--green)]" />
                            </span>
                          ) : (
                            <button
                              onClick={() => { const due = buildCollectDue(row, m); if (due) onCollect(due) }}
                              className="font-bold text-[12px] text-[var(--amber)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-0 p-0 transition-colors"
                              title={bn ? 'পরিশোধ করুন' : 'Collect'}
                            >
                              {fmt(cell.amount)}
                            </button>
                          )}
                        </td>
                      )
                    })}
                    {!showMonthPicker && (
                      <td className="text-center px-2 py-2 font-bold text-[var(--amber)]">{fmt(row.totalDue)}</td>
                    )}
                    <td className="text-right px-2 py-2 font-semibold text-[var(--amber)]">{fmt(row.totalDue)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})
