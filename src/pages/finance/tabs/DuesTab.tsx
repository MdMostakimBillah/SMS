import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { Search, DollarSign, Users, CalendarDays, Ban, CheckCircle2, ChevronDown, CircleCheck, FileSpreadsheet, FileText, MoreVertical } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeDue } from '@/store/feeStore'
import { XLSX } from '@/lib/excelExport'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

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
  const { institution } = useClassStore()
  const sessions = institution?.sessions || []
  const [fSession, setFSession] = useState(() => institution?.currentSession || '')
  const fYear = parseInt(fSession.split('-')[0]) || new Date().getFullYear()
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set([new Date().getMonth()]))
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const monthDropdownRef = useRef<HTMLDivElement>(null)
  const [showResults, setShowResults] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)
  const [showPdfModal, setShowPdfModal] = useState(false)

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

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionMenu(false)
      }
    }
    if (showActionMenu) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

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
  }, [showResults, feeStructuresForCategory, activeStudents, fClass, fSection, payments, waivers, fYear, sortedMonths, showMonthPicker, fSession])

  const results = useMemo(() => {
    if (fStatus === 'due') return allResults.filter((r) => r.totalDue > 0)
    if (fStatus === 'paid') return allResults.filter((r) => r.allPaid)
    return allResults
  }, [allResults, fStatus])

  const totalDue = useMemo(() => results.reduce((sum, r) => sum + r.totalDue, 0), [results])
  const monthSums = useMemo(() => {
    if (!showMonthPicker || sortedMonths.length === 0) return {} as Record<number, number>
    const sums: Record<number, number> = {}
    for (const m of sortedMonths) sums[m] = 0
    for (const r of results) {
      for (const m of sortedMonths) {
        const cell = r.months[m]
        if (cell && !cell.paid) sums[m] += cell.amount
      }
    }
    return sums
  }, [results, sortedMonths, showMonthPicker])
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
    XLSX.writeFile(wb, `dues-${fSession}.xlsx`)
  }, [results, fYear, bn, showMonthPicker, sortedMonths])

  const pdfColumns = useMemo<PDFColumnDef[]>(() => {
    const cols: PDFColumnDef[] = [
      { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', default: true },
      { key: 'roll', label: 'Roll', labelBn: 'রোল', default: true },
      { key: 'class', label: 'Class', labelBn: 'শ্রেণি', default: true },
      { key: 'fee', label: 'Fee', labelBn: 'ফি', default: true },
      { key: 'type', label: 'Type', labelBn: 'ধরন', default: true },
      { key: 'feeAmt', label: 'Fee Amt', labelBn: 'ফির পরিমাণ', default: true },
    ]
    if (showMonthPicker) {
      for (const m of sortedMonths) {
        const lbl = bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en
        cols.push({ key: `month-${m}`, label: lbl, labelBn: MONTH_LABELS[m].bn, default: true })
      }
    }
    cols.push({ key: 'totalDue', label: 'Total Due', labelBn: 'মোট বকেয়', default: true })
    return cols
  }, [showMonthPicker, sortedMonths, bn])

  const buildPdfRow = useCallback((r: DueMatrixRow, selectedCols: string[]): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (selectedCols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? r.studentNameBn || r.studentName : r.studentName
    if (selectedCols.includes('roll')) row[bn ? 'রোল' : 'Roll'] = r.roll
    if (selectedCols.includes('class')) row[bn ? 'শ্রেণি' : 'Class'] = `${r.class}${r.section ? `-${r.section}` : ''}`
    if (selectedCols.includes('fee')) row[bn ? 'ফি' : 'Fee'] = bn ? r.feeNameBn : r.feeName
    if (selectedCols.includes('type')) row[bn ? 'ধরন' : 'Type'] = r.feeType === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')
    if (selectedCols.includes('feeAmt')) row[bn ? 'ফির পরিমাণ' : 'Fee Amt'] = r.totalAmount
    if (showMonthPicker) {
      for (const m of sortedMonths) {
        if (selectedCols.includes(`month-${m}`)) {
          const cell = r.months[m]
          row[bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en] = cell ? (cell.paid ? '✓' : cell.amount) : '—'
        }
      }
    }
    if (selectedCols.includes('totalDue')) row[bn ? 'মোট বকেয়' : 'Total Due'] = r.totalDue
    return row
  }, [bn, showMonthPicker, sortedMonths])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const selectedData = results.filter((r) => selectedRows.has(`${r.studentId}-${r.feeStructureId}`))
    const rows = selectedData.map((r) => buildPdfRow(r, opts.selectedCols))
    const summaryRow: Record<string, string | number> = {}
    summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('roll')) summaryRow[bn ? 'রোল' : 'Roll'] = ''
    if (opts.selectedCols.includes('class')) summaryRow[bn ? 'শ্রেণি' : 'Class'] = ''
    if (opts.selectedCols.includes('fee')) summaryRow[bn ? 'ফি' : 'Fee'] = ''
    if (opts.selectedCols.includes('type')) summaryRow[bn ? 'ধরন' : 'Type'] = ''
    if (opts.selectedCols.includes('feeAmt')) summaryRow[bn ? 'ফির পরিমাণ' : 'Fee Amt'] = selectedData.reduce((s, r) => s + r.totalAmount, 0)
    if (showMonthPicker) {
      for (const m of sortedMonths) {
        if (opts.selectedCols.includes(`month-${m}`)) {
          let sum = 0
          for (const r of selectedData) { const c = r.months[m]; if (c && !c.paid) sum += c.amount }
          summaryRow[bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en] = sum > 0 ? sum : '—'
        }
      }
    }
    if (opts.selectedCols.includes('totalDue')) summaryRow[bn ? 'মোট বকেয়' : 'Total Due'] = selectedData.reduce((s, r) => s + r.totalDue, 0)
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:12mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:10mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}`
    const headers = opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [results, selectedRows, pdfColumns, bn, showMonthPicker, sortedMonths, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const selectedData = results.filter((r) => selectedRows.has(`${r.studentId}-${r.feeStructureId}`))
    const rows = selectedData.map((r) => buildPdfRow(r, opts.selectedCols))
    const summaryRow: Record<string, string | number> = {}
    summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('roll')) summaryRow[bn ? 'রোল' : 'Roll'] = ''
    if (opts.selectedCols.includes('class')) summaryRow[bn ? 'শ্রেণি' : 'Class'] = ''
    if (opts.selectedCols.includes('fee')) summaryRow[bn ? 'ফি' : 'Fee'] = ''
    if (opts.selectedCols.includes('type')) summaryRow[bn ? 'ধরন' : 'Type'] = ''
    if (opts.selectedCols.includes('feeAmt')) summaryRow[bn ? 'ফির পরিমাণ' : 'Fee Amt'] = selectedData.reduce((s, r) => s + r.totalAmount, 0)
    if (showMonthPicker) {
      for (const m of sortedMonths) {
        if (opts.selectedCols.includes(`month-${m}`)) {
          let sum = 0
          for (const r of selectedData) { const c = r.months[m]; if (c && !c.paid) sum += c.amount }
          summaryRow[bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en] = sum > 0 ? sum : '—'
        }
      }
    }
    if (opts.selectedCols.includes('totalDue')) summaryRow[bn ? 'মোট বকেয়' : 'Total Due'] = selectedData.reduce((s, r) => s + r.totalDue, 0)
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const headers = opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })
    const totalRowIdx = rows.length - 1
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a">
      <div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:8px;margin-bottom:10px">
        ${pdfLogoHTML(pdfBranding, 28)}
        <div><div style="font-size:14px;font-weight:700;color:${pdfBranding.brandColor}">${pdfBranding.schoolName}</div>
        <div style="font-size:9px;color:#666">${pdfBranding.address}</div></div>
      </div>
      <div style="font-size:12px;font-weight:700;color:${pdfBranding.brandColor};margin-bottom:8px">${opts.title}</div>
      <table style="width:100%;border-collapse:collapse;font-size:9px">
        <thead><tr>${headers.map((h) => `<th style="background:${pdfBranding.brandColor};color:#fff;padding:4px 6px;text-align:center;font-weight:600">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.slice(0, 20).map((r, i) => `<tr${i === totalRowIdx ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}
        ${rows.length > 21 ? `<tr><td colspan="${headers.length}" style="padding:4px;text-align:center;color:#999;font-style:italic">... ${rows.length - 21} more rows</td></tr>` : ''}
        </tbody>
      </table>
    </div>`
  }, [results, selectedRows, pdfColumns, bn, showMonthPicker, sortedMonths, buildPdfRow])

  const fmt = (n: number) => n.toLocaleString()

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5">
        {/* Row 1: Year + Type + Category + Status + Month + Find Due */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={fSession}
            onChange={(e) => { setFSession(e.target.value); setShowResults(false); setSelectedRows(new Set()) }}
            className={selectCls}
          >
            {sessions.map((s) => (
              <option key={s} value={s}>{s}</option>
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

      {/* Action Bar — shown when results exist */}
      {showResults && results.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-[var(--text-muted)]">
            {selectedRows.size > 0
              ? `${selectedRows.size} ${bn ? 'নির্বাচিত' : 'selected'}`
              : `${results.length} ${bn ? 'টি ফলাফল' : 'results'}`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {selectedRows.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="h-8 px-3 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[12px] font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <MoreVertical size={13} />
                  {bn ? 'অ্যাকশন' : 'Action'}
                  <ChevronDown size={12} />
                </button>
                {showActionMenu && (
                  <div
                    ref={actionMenuRef}
                    className="absolute top-full right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-[100] overflow-hidden"
                  >
                    <button
                      onClick={() => { exportExcel(); setShowActionMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors"
                    >
                      <FileSpreadsheet size={14} className="text-[var(--green)]" />
                      {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                    </button>
                    <div className="h-px bg-[var(--border)] mx-2" />
                    <button
                      onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors"
                    >
                      <FileText size={14} className="text-[var(--red)]" />
                      {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                    </button>
                  </div>
                )}
              </div>
            )}
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
            {showMonthPicker && sortedMonths.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[var(--brand)] bg-[var(--bg-secondary)] font-bold sticky bottom-0 z-10">
                  <td className="px-2 py-2 sticky left-0 bg-[var(--bg-secondary)] z-10" />
                  <td className="px-3 py-2 sticky left-[36px] bg-[var(--bg-secondary)] z-10 text-[12px] text-[var(--text-primary)]">{bn ? 'মোট' : 'Total'}</td>
                  <td className="px-2 py-2" />
                  <td className="px-2 py-2" />
                  <td className="px-2 py-2" />
                  <td className="px-2 py-2" />
                  <td className="text-right px-2 py-2 text-[12px]">{fmt(results.reduce((s, r) => s + r.totalAmount, 0))}</td>
                  {sortedMonths.map((m) => (
                    <td key={m} className="text-center px-2 py-2 text-[12px] text-[var(--amber)]" style={{ minWidth: '70px' }}>
                      {monthSums[m] > 0 ? fmt(monthSums[m]) : '—'}
                    </td>
                  ))}
                  <td className="text-right px-2 py-2 text-[12px] text-[var(--amber)]">{fmt(totalDue)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* PDF Options Modal */}
      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="Dues List"
          defaultTitleBn="বকেয় তালিকা"
          recordLabel="student"
          recordLabelBn="শিক্ষার্থী"
          count={selectedRows.size}
          isBn={bn}
          showColumns={true}
          previewRenderer={pdfPreviewRenderer}
          onClose={() => setShowPdfModal(false)}
          onDownload={handlePdfDownload}
        />
      )}
    </div>
  )
})
