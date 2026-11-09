import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { Search, DollarSign, Users, CalendarDays, Ban, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, FileSpreadsheet, FileText, MoreVertical, Eye, Banknote } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useBn } from '@/hooks/useBn'
import { toBnNum } from '@/lib/i18n'
import { usePermission } from '@/hooks/usePermission'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore, type FeeStructure, type FeePayment, type FeeWaiver, type FeeDue } from '@/store/feeStore'
import { isMatchingSession } from '@/lib/classStudentCount'
import { XLSX } from '@/lib/excelExport'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { PaymentDetailsModal } from '../modals/PaymentDetailsModal'

interface Props {
  onCollect: (due: FeeDue) => void
}

function parseSessionYears(session?: string): number[] {
  if (!session) return []
  const parts = session.trim().split('-')
  const startY = parseInt(parts[0], 10)
  if (isNaN(startY)) return []
  if (parts.length > 1) {
    let endPart = parts[1].trim()
    if (endPart.length === 2) {
      endPart = `${String(startY).slice(0, 2)}${endPart}`
    }
    const endY = parseInt(endPart, 10)
    if (!isNaN(endY) && endY >= startY) {
      const yrs: number[] = []
      for (let y = startY; y <= endY; y++) yrs.push(y)
      return yrs
    }
  }
  return [startY]
}

function paymentMatchesMonth(
  p: FeePayment,
  m: number,
  sessionYears: number[],
  dateFrom?: string,
  dateTo?: string
): boolean {
  if (dateFrom || dateTo) {
    const paidDate = (p.paidAt || '').split('T')[0]
    if (dateFrom && paidDate && paidDate < dateFrom) return false
    if (dateTo && paidDate && paidDate > dateTo) return false
  }

  if (p.forMonth) {
    const [yrStr, moStr] = p.forMonth.split('-')
    const mo = parseInt(moStr, 10)
    const yr = parseInt(yrStr, 10)
    if (isNaN(mo) || (mo - 1) !== m) return false
    if (sessionYears.length > 0 && !isNaN(yr) && !sessionYears.includes(yr)) return false
    return true
  }

  const d = new Date(p.paidAt)
  if (isNaN(d.getTime())) return false
  if (d.getMonth() !== m) return false
  if (sessionYears.length > 0 && !sessionYears.includes(d.getFullYear())) return false
  return true
}

function waiverMatchesMonth(
  w: FeeWaiver,
  m: number,
  sessionYears: number[]
): boolean {
  if (w.forMonth) {
    const [yrStr, moStr] = w.forMonth.split('-')
    const mo = parseInt(moStr, 10)
    const yr = parseInt(yrStr, 10)
    if (isNaN(mo) || (mo - 1) !== m) return false
    if (sessionYears.length > 0 && !isNaN(yr) && !sessionYears.includes(yr)) return false
    return true
  }

  const d = new Date(w.createdAt)
  if (isNaN(d.getTime())) return false
  if (d.getMonth() !== m) return false
  if (sessionYears.length > 0 && !sessionYears.includes(d.getFullYear())) return false
  return true
}

function matchesFeeType(fee: FeeStructure, typeFilter: string): boolean {
  if (!typeFilter) return true
  if (typeFilter === 'monthly') return fee.type === 'monthly'
  if (typeFilter === 'yearly') {
    return (
      (fee.type as string) === 'yearly' ||
      (fee.type === 'onetime' && (
        fee.name.toLowerCase().includes('year') ||
        fee.name.toLowerCase().includes('annual') ||
        fee.name.toLowerCase().includes('session') ||
        fee.nameBn.includes('বাৎসরিক') ||
        fee.nameBn.includes('বার্ষিক') ||
        fee.nameBn.includes('সেশন')
      ))
    )
  }
  if (typeFilter === 'onetime') {
    return (
      fee.type === 'onetime' &&
      !(
        fee.name.toLowerCase().includes('year') ||
        fee.name.toLowerCase().includes('annual') ||
        fee.name.toLowerCase().includes('session') ||
        fee.nameBn.includes('বাৎসরিক') ||
        fee.nameBn.includes('বার্ষিক') ||
        fee.nameBn.includes('সেশন')
      )
    )
  }
  return fee.type === typeFilter
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

const selectCls = 'h-[2.125rem] text-[0.75rem] px-[0.625rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium outline-none focus:border-[var(--brand)] cursor-pointer transition-colors'

interface MonthCell {
  paid: boolean
  amount: number
  paidAmount: number
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
  feeType: 'monthly' | 'onetime' | 'yearly'
  totalAmount: number
  months: Record<number, MonthCell>
  totalDue: number
  totalPaid: number
  allPaid: boolean
}

export const DuesTab = React.memo(function DuesTab({ onCollect }: Props) {
  const bn = useBn()
  const { canExport, canPrint, canCreate } = usePermission()
  const allAdmissionStudents = useAdmissionStore((s) => s.students)
  const { classes, institution } = useClassStore()
  const { structures, payments, generateWaivers } = useFeeStore()
  const waivers = useMemo(() => generateWaivers(allAdmissionStudents), [generateWaivers, structures, payments, allAdmissionStudents])

  const paymentsByKey = useMemo(() => {
    const map = new Map<string, typeof payments>()
    for (const p of payments) {
      const key = `${p.studentId}|${p.feeStructureId}`
      const arr = map.get(key)
      if (arr) arr.push(p)
      else map.set(key, [p])
    }
    return map
  }, [payments])

  const waiversByKey = useMemo(() => {
    const map = new Map<string, typeof waivers>()
    for (const w of waivers) {
      const key = `${w.studentId}|${w.feeStructureId}`
      const arr = map.get(key)
      if (arr) arr.push(w)
      else map.set(key, [w])
    }
    return map
  }, [waivers])

  const [searchParams] = useSearchParams()
  const initType = (searchParams.get('feeType') || '') as 'monthly' | 'onetime' | 'yearly' | ''
  const initCategory = searchParams.get('category') || ''
  const initStatus = (searchParams.get('status') || 'all') as 'all' | 'paid' | 'due' | 'paiddue'
  const initMonths = searchParams.get('months')
  const initDateFrom = searchParams.get('dateFrom') || ''
  const initDateTo = searchParams.get('dateTo') || ''

  const [fType, setFType] = useState<'monthly' | 'onetime' | 'yearly' | ''>(initType)
  const [fCategory, setFCategory] = useState(initCategory)
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fStatus, setFStatus] = useState<'all' | 'paid' | 'due' | 'paiddue'>(initStatus)
  const [searchText, setSearchText] = useState('')
  const [detailsRow, setDetailsRow] = useState<DueMatrixRow | null>(null)

  const allAvailableSessions = useMemo(() => {
    const set = new Set<string>()
    if (institution?.currentSession) set.add(institution.currentSession)
    for (const s of (institution?.sessions || [])) {
      if (s) set.add(s)
    }
    for (const st of structures) {
      if (st.academicYear) set.add(st.academicYear)
    }
    for (const std of allAdmissionStudents) {
      if (std.academicYear) set.add(std.academicYear)
    }
    return Array.from(set).sort().reverse()
  }, [institution, structures, allAdmissionStudents])

  const [fSession, setFSession] = useState(() => institution?.currentSession || '')
  const fYear = parseInt(fSession.split('-')[0]) || new Date().getFullYear()
  const sessionYears = useMemo(() => parseSessionYears(fSession), [fSession])
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(() => {
    if (initMonths) {
      const parsed = initMonths.split(',').map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 11)
      if (parsed.length > 0) return new Set(parsed)
    }
    return new Set([new Date().getMonth()])
  })
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const monthDropdownRef = useRef<HTMLDivElement>(null)
  const dateFrom = initDateFrom
  const dateTo = initDateTo
  const [showResults, setShowResults] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)
  const [showPdfModal, setShowPdfModal] = useState(false)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (fClass ? sectionsMap[fClass] || [] : []), [fClass, sectionsMap])

  const activeStudents = useMemo(
    () => allAdmissionStudents.filter((s) =>
      s.status === 'approved' &&
      s.active !== false &&
      (!fSession || !s.academicYear || isMatchingSession(s.academicYear, fSession))
    ),
    [allAdmissionStudents, fSession]
  )

  const activeStructures = useMemo(
    () => structures.filter((s) => s.isActive),
    [structures]
  )

  const categoryOptions = useMemo(() => {
    let list = activeStructures
    if (fSession) list = list.filter((s) => !s.academicYear || isMatchingSession(s.academicYear, fSession))
    if (fType) list = list.filter((s) => matchesFeeType(s, fType))
    const names = new Set(list.map((s) => s.name))
    return Array.from(names)
  }, [activeStructures, fSession, fType])

  const feeStructuresForCategory = useMemo(() => {
    let list = structures.filter((s) => s.isActive)
    if (fSession) list = list.filter((s) => !s.academicYear || isMatchingSession(s.academicYear, fSession))
    if (fCategory) list = list.filter((s) => s.name === fCategory)
    if (fType) list = list.filter((s) => matchesFeeType(s, fType))
    return list
  }, [structures, fSession, fCategory, fType])

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
    setSelectedRows(new Set())
  }, [])

  const selectAllMonths = useCallback(() => {
    setSelectedMonths(new Set(MONTH_LABELS.map((_, i) => i)))
    setSelectedRows(new Set())
  }, [])

  const clearAllMonths = useCallback(() => {
    setSelectedMonths(new Set())
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
      const isYearly = matchesFeeType(fee, 'yearly')
      for (const student of filteredStudents) {
        if (fee.class && fee.class !== student.class) continue
        if (fee.section && fee.section !== student.section) continue
        if (fee.studentId && fee.studentId !== student.id) continue

        const feePayments = paymentsByKey.get(`${student.id}|${fee.id}`) || []
        const feeWaivers = waiversByKey.get(`${student.id}|${fee.id}`) || []

        if (fee.type === 'onetime' || isYearly) {
          const filteredPayments = feePayments.filter((p) => {
            if (dateFrom || dateTo) {
              const paidDate = (p.paidAt || '').split('T')[0]
              if (dateFrom && paidDate && paidDate < dateFrom) return false
              if (dateTo && paidDate && paidDate > dateTo) return false
            }
            if (sessionYears.length > 0) {
              const d = new Date(p.paidAt)
              if (!isNaN(d.getTime()) && !sessionYears.includes(d.getFullYear())) return false
            }
            return true
          })
          const paid = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
          const discount = filteredPayments.reduce((sum, p) => sum + (p.discount || 0), 0)
          const filteredWaivers = feeWaivers.filter((w) => {
            if (sessionYears.length > 0) {
              const d = new Date(w.createdAt)
              if (!isNaN(d.getTime()) && !sessionYears.includes(d.getFullYear())) return false
            }
            return true
          })
          const waived = filteredWaivers.reduce((sum, w) => sum + w.amount, 0)
          const due = fee.amount - paid - discount - waived
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
            feeType: isYearly ? 'yearly' : 'onetime',
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
            if (!isNaN(bd.getTime())) {
              billingYear = bd.getFullYear()
              billingMonthIdx = bd.getMonth()
            }
          }

          for (const m of monthsToShow) {
            const isBeforeBilling = billingYear > 0 && sessionYears.length > 0 &&
              (sessionYears[0] < billingYear || (sessionYears[0] === billingYear && m < billingMonthIdx))

            if (isBeforeBilling) {
              monthCells[m] = { paid: true, amount: 0, paidAmount: 0 }
              continue
            }

            if (fee.applicableMonths && fee.applicableMonths.length > 0 && !fee.applicableMonths.includes(m)) {
              monthCells[m] = { paid: true, amount: 0, paidAmount: 0 }
              continue
            }

            const monthPayments = feePayments.filter((p) => paymentMatchesMonth(p, m, sessionYears, dateFrom, dateTo))
            const paid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
            const discount = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0)
            const monthWaivers = feeWaivers.filter((w) => waiverMatchesMonth(w, m, sessionYears))
            const waived = monthWaivers.reduce((sum, w) => sum + w.amount, 0)
            const receivable = fee.amount - paid - discount - waived
            monthCells[m] = { paid: receivable <= 0, amount: Math.max(0, receivable), paidAmount: paid }
          }

          const totalDueAmount = Object.values(monthCells).reduce((sum, c) => sum + c.amount, 0)
          const totalPaidAmount = Object.values(monthCells).reduce((s, c) => s + c.paidAmount, 0)
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
            totalAmount: fee.amount * (monthsToShow.length || 1),
            months: monthCells,
            totalDue: totalDueAmount,
            totalPaid: totalPaidAmount,
            allPaid,
          })
        }
      }
    }

    return rows
  }, [showResults, feeStructuresForCategory, activeStudents, fClass, fSection, paymentsByKey, waiversByKey, sortedMonths, showMonthPicker, dateFrom, dateTo, sessionYears])

  const results = useMemo(() => {
    let list = allResults
    if (fStatus === 'due') {
      list = list.filter((r) => r.totalDue > 0)
    } else if (fStatus === 'paid') {
      list = list.filter((r) => (r.totalPaid > 0 || r.allPaid) && r.totalDue <= 0)
    } else if (fStatus === 'paiddue') {
      list = list.filter((r) => r.totalPaid > 0 && r.totalDue > 0)
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      list = list.filter((r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentNameBn.includes(q) ||
        r.studentId.toLowerCase().includes(q) ||
        r.roll.includes(q) ||
        (r.feeName.toLowerCase().includes(q)) ||
        (r.feeNameBn.includes(q))
      )
    }
    return list
  }, [allResults, fStatus, searchText])

  const totalDue = useMemo(() => results.reduce((sum, r) => sum + r.totalDue, 0), [results])
  const totalPaid = useMemo(() => {
    return results.reduce((sum, r) => {
      let paid = r.totalPaid
      if (showMonthPicker) {
        paid = 0
        for (const m of sortedMonths) {
          const cell = r.months[m]
          if (cell) paid += cell.paidAmount
        }
      }
      return sum + paid
    }, 0)
  }, [results, sortedMonths, showMonthPicker])
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
  const monthPaidSums = useMemo(() => {
    if (!showMonthPicker || sortedMonths.length === 0) return {} as Record<number, number>
    const sums: Record<number, number> = {}
    for (const m of sortedMonths) sums[m] = 0
    for (const r of results) {
      for (const m of sortedMonths) {
        const cell = r.months[m]
        if (cell) sums[m] += cell.paidAmount
      }
    }
    return sums
  }, [results, sortedMonths, showMonthPicker])
  const studentCount = useMemo(() => new Set(results.map((r) => r.studentId)).size, [results])

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const tableScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPage(1)
  }, [searchText, fClass, fSection, fType, fCategory, fSession, fStatus, selectedMonths])

  const totalPages = Math.max(1, Math.ceil(results.length / perPage))
  const activePage = Math.min(page, totalPages)
  const paginatedResults = useMemo(() => {
    if (perPage >= results.length) return results
    return results.slice((activePage - 1) * perPage, activePage * perPage)
  }, [results, activePage, perPage])

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0
    }
  }, [activePage])

  const handleFindDue = useCallback(() => {
    setShowResults(true)
    setSelectedRows(new Set())
    setPage(1)
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
    let forMonth: string | undefined = undefined
    let dueAmount = row.totalDue
    if (fee.type === 'monthly') {
      const yr = sessionYears.length > 0 ? sessionYears[sessionYears.length - 1] : fYear
      if (monthIdx !== undefined) {
        forMonth = `${yr}-${String(monthIdx + 1).padStart(2, '0')}`
        dueAmount = row.months[monthIdx]?.amount || 0
      } else {
        const firstUnpaidMonth = sortedMonths.find((m) => row.months[m] && !row.months[m].paid && row.months[m].amount > 0)
        if (firstUnpaidMonth !== undefined) {
          forMonth = `${yr}-${String(firstUnpaidMonth + 1).padStart(2, '0')}`
          dueAmount = row.months[firstUnpaidMonth]?.amount || row.totalDue
        }
      }
    }
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
      dueAmount,
      isActive: true,
      forMonth,
    }
  }, [feeStructuresForCategory, sessionYears, fYear, sortedMonths])

  const exportExcel = useCallback(() => {
    const rows = results
    const sheetData = rows.map((r, idx) => {
      const row: Record<string, string | number> = {
        [bn ? 'ক্রমিক' : 'S/N']: idx + 1,
        [bn ? 'শিক্ষার্থী' : 'Student']: bn ? r.studentNameBn || r.studentName : r.studentName,
        [bn ? 'রোল' : 'Roll']: r.roll,
        [bn ? 'শিক্ষার্থী আইডি' : 'Student ID']: r.studentId,
        [bn ? 'শ্রেণি' : 'Class']: `${r.class}${r.section ? `-${r.section}` : ''}`,
        [bn ? 'ফি' : 'Fee']: bn ? r.feeNameBn : r.feeName,
        [bn ? 'ধরন' : 'Type']: r.feeType === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : r.feeType === 'yearly' ? (bn ? 'বাৎসরিক' : 'Yearly') : (bn ? 'এককালীন' : 'One-time'),
        [bn ? 'মোট ফি' : 'Total Fee']: r.totalAmount,
      }
      if (showMonthPicker) {
        for (const m of sortedMonths) {
          const label = bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en
          const cell = r.months[m]
          row[label] = cell ? (cell.paid ? (bn ? 'পরিশোধিত' : 'Paid') : cell.amount) : '—'
        }
      }
      row[bn ? 'পরিশোধিত' : 'Paid'] = r.totalPaid
      row[bn ? 'মোট বকেয়' : 'Total Due'] = r.totalDue
      return row
    })
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'বকেয়' : 'Dues')
    XLSX.writeFile(wb, `dues-${fSession || 'all'}.xlsx`)
  }, [results, fSession, bn, showMonthPicker, sortedMonths])

  const pdfColumns = useMemo<PDFColumnDef[]>(() => {
    const cols: PDFColumnDef[] = [
      { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
      { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', default: true },
      { key: 'roll', label: 'Roll', labelBn: 'রোল', default: true },
      { key: 'studentId', label: 'Student ID', labelBn: 'শিক্ষার্থী আইডি', default: true },
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
    cols.push({ key: 'totalPaid', label: 'Paid', labelBn: 'পরিশোধিত', default: true })
    cols.push({ key: 'totalDue', label: 'Total Due', labelBn: 'মোট বকেয়', default: true })
    return cols
  }, [showMonthPicker, sortedMonths, bn])

  const buildPdfRow = useCallback((r: DueMatrixRow, selectedCols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (selectedCols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (selectedCols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? r.studentNameBn || r.studentName : r.studentName
    if (selectedCols.includes('roll')) row[bn ? 'রোল' : 'Roll'] = r.roll
    if (selectedCols.includes('studentId')) row[bn ? 'শিক্ষার্থী আইডি' : 'Student ID'] = r.studentId
    if (selectedCols.includes('class')) row[bn ? 'শ্রেণি' : 'Class'] = `${r.class}${r.section ? `-${r.section}` : ''}`
    if (selectedCols.includes('fee')) row[bn ? 'ফি' : 'Fee'] = bn ? r.feeNameBn : r.feeName
    if (selectedCols.includes('type')) row[bn ? 'ধরন' : 'Type'] = r.feeType === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : r.feeType === 'yearly' ? (bn ? 'বাৎসরিক' : 'Yearly') : (bn ? 'এককালীন' : 'One-time')
    if (selectedCols.includes('feeAmt')) row[bn ? 'ফির পরিমাণ' : 'Fee Amt'] = r.totalAmount
    if (showMonthPicker) {
      for (const m of sortedMonths) {
        if (selectedCols.includes(`month-${m}`)) {
          const cell = r.months[m]
          row[bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en] = cell ? (cell.paid ? '✓' : cell.amount) : '—'
        }
      }
    }
    if (selectedCols.includes('totalPaid')) row[bn ? 'পরিশোধিত' : 'Paid'] = r.totalPaid
    if (selectedCols.includes('totalDue')) row[bn ? 'মোট বকেয়' : 'Total Due'] = r.totalDue
    row.__photo = r.photo || ''
    return row
  }, [bn, showMonthPicker, sortedMonths])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const selectedData = results.filter((r) => selectedRows.has(`${r.studentId}-${r.feeStructureId}`))
    const rows = selectedData.map((r, i) => buildPdfRow(r, opts.selectedCols, i))
    const summaryRow: Record<string, string | number> = {}
    if (opts.selectedCols.includes('sn')) summaryRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    if (opts.selectedCols.includes('studentId')) summaryRow[bn ? 'শিক্ষার্থী আইডি' : 'Student ID'] = ''
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
    if (opts.selectedCols.includes('totalPaid')) summaryRow[bn ? 'পরিশোধিত' : 'Paid'] = selectedData.reduce((s, r) => s + r.totalPaid, 0)
    if (opts.selectedCols.includes('totalDue')) summaryRow[bn ? 'মোট বকেয়' : 'Total Due'] = selectedData.reduce((s, r) => s + r.totalDue, 0)
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}td img{width:28px;height:28px;border-radius:50%;object-fit:cover}`
    const photoHeaders = opts.includeImage ? [bn ? 'ছবি' : 'Photo'] : []
    const headers = [...photoHeaders, ...opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })]
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${[...(opts.includeImage ? [`<td>${r.__photo ? `<img src="${r.__photo}" />` : ''}</td>`] : []), ...opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); const h = col ? (opts.isBn ? col.labelBn : col.label) : c; return `<td>${r[h] ?? ''}</td>` })].join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [results, selectedRows, pdfColumns, bn, showMonthPicker, sortedMonths, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const selectedData = results.filter((r) => selectedRows.has(`${r.studentId}-${r.feeStructureId}`))
    const rows = selectedData.map((r, i) => buildPdfRow(r, opts.selectedCols, i))
    const summaryRow: Record<string, string | number> = {}
    if (opts.selectedCols.includes('sn')) summaryRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    if (opts.selectedCols.includes('studentId')) summaryRow[bn ? 'শিক্ষার্থী আইডি' : 'Student ID'] = ''
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
    if (opts.selectedCols.includes('totalPaid')) summaryRow[bn ? 'পরিশোধিত' : 'Paid'] = selectedData.reduce((s, r) => s + r.totalPaid, 0)
    if (opts.selectedCols.includes('totalDue')) summaryRow[bn ? 'মোট বকেয়' : 'Total Due'] = selectedData.reduce((s, r) => s + r.totalDue, 0)
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const photoHeaders = opts.includeImage ? [bn ? 'ছবি' : 'Photo'] : []
    const headers = [...photoHeaders, ...opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })]
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
        <tbody>${rows.slice(0, 20).map((r, i) => `<tr${i === totalRowIdx ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${[...(opts.includeImage ? [`<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r.__photo ? `<img src="${r.__photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" />` : ''}</td>`] : []), ...headers.filter((h) => h !== (bn ? 'ছবি' : 'Photo')).map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`)].join('')}</tr>`).join('')}
        ${rows.length > 21 ? `<tr><td colspan="${headers.length}" style="padding:4px;text-align:center;color:#999;font-style:italic">... ${rows.length - 21} more rows</td></tr>` : ''}
        </tbody>
      </table>
    </div>`
  }, [results, selectedRows, pdfColumns, bn, showMonthPicker, sortedMonths, buildPdfRow])

  const fmt = (n: number) => n.toLocaleString()
  const showPaidCol = fStatus !== 'due'
  const showDueCol = fStatus !== 'paid'

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] flex items-center gap-2 flex-wrap">
        <select
          value={fSession}
          onChange={(e) => { setFSession(e.target.value); setSelectedRows(new Set()) }}
          className={selectCls}
        >
          <option value="">{bn ? 'সব শিক্ষাবর্ষ' : 'All Sessions'}</option>
          {allAvailableSessions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={fType}
          onChange={(e) => { setFType(e.target.value as '' | 'monthly' | 'onetime' | 'yearly'); setFCategory(''); setSelectedRows(new Set()) }}
          className={selectCls}
        >
          <option value="">{bn ? 'সব ধরন' : 'All types'}</option>
          <option value="monthly">{bn ? 'মাসিক' : 'Monthly'}</option>
          <option value="onetime">{bn ? 'এককালীন' : 'One-time'}</option>
          <option value="yearly">{bn ? 'বাৎসরিক' : 'Yearly'}</option>
        </select>
        <select
          value={fCategory}
          onChange={(e) => { setFCategory(e.target.value); setSelectedRows(new Set()) }}
          className={selectCls}
        >
          <option value="">{bn ? 'সব ক্যাটাগরি' : 'All categories'}</option>
          {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={fStatus}
          onChange={(e) => { setFStatus(e.target.value as 'all' | 'paid' | 'due' | 'paiddue'); setSelectedRows(new Set()) }}
          className={selectCls}
        >
          <option value="all">{bn ? 'সব' : 'All'}</option>
          <option value="paid">{bn ? 'পরিশোধিত' : 'Paid'}</option>
          <option value="due">{bn ? 'বকেয়' : 'Due'}</option>
          <option value="paiddue">{bn ? 'পরিশোধিত ও বকেয়' : 'Paid & Due'}</option>
        </select>
        {showMonthPicker && (
          <div className="relative" ref={monthDropdownRef}>
            <button
              onClick={() => setShowMonthDropdown((p) => !p)}
              className="h-[2.125rem] px-[0.625rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-medium cursor-pointer flex items-center gap-1.5 min-w-[10rem] outline-none focus:border-[var(--brand)] transition-colors"
            >
              <CalendarDays size={13} className="text-[var(--text-muted)] flex-shrink-0" />
              <span className="truncate text-left flex-1">{monthDisplayText}</span>
              <ChevronDown size={13} className="text-[var(--text-muted)] flex-shrink-0" />
            </button>
            {showMonthDropdown && (
              <div className="absolute z-50 mt-1 w-[220px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_12px_30px_rgba(20,23,33,0.12)] p-2">
                <div className="flex items-center gap-1 mb-1.5 pb-1.5 border-b border-[var(--border)]">
                  <button onClick={selectAllMonths} className="text-[11px] font-semibold text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0">{bn ? 'বাৎসরিক (সব মাস)' : 'Yearly (All)'}</button>
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
        <div className="w-px self-stretch bg-[var(--border)] mx-1" />
        <select
          value={fClass}
          onChange={(e) => { setFClass(e.target.value); setFSection(''); setSelectedRows(new Set()) }}
          className={selectCls}
        >
          <option value="">{bn ? 'সব শ্রেণি' : 'All classes'}</option>
          {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {fClass && (
          <select
            value={fSection}
            onChange={(e) => { setFSection(e.target.value); setSelectedRows(new Set()) }}
            className={selectCls}
          >
            <option value="">{bn ? 'সব সেকশন' : 'All sections'}</option>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <div className="ml-auto flex items-center gap-2">
          {showResults && results.length > 0 && (
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={bn ? 'শিক্ষার্থী খুঁজুন...' : 'Search student...'}
              className="h-[2.125rem] px-[0.625rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-medium outline-none focus:border-[var(--brand)] w-[11.25rem] transition-colors"
            />
          )}
          <button
            onClick={handleFindDue}
            className="h-[2.125rem] px-[1rem] rounded-[0.5rem] bg-[var(--brand)] text-white font-semibold text-[0.75rem] border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(99,102,241,0.25)]"
          >
            <Search size={14} />{bn ? 'খুঁজুন' : 'Find'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {showResults && results.length > 0 && (
        <div className={(fStatus === 'all' || fStatus === 'paiddue') ? 'grid grid-cols-3 gap-[0.625rem]' : 'grid grid-cols-2 gap-[0.625rem]'}>
          {(fStatus === 'due' || fStatus === 'paiddue' || fStatus === 'all') && (
            <div
              className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-light)' }}>
                <DollarSign size={15} style={{ color: 'var(--amber)' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(totalDue)}</div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'মোট বকেয়' : 'Total Due'}</div>
              </div>
            </div>
          )}
          {(fStatus === 'paid' || fStatus === 'paiddue' || fStatus === 'all') && (
            <div
              className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--green-light)' }}>
                <DollarSign size={15} style={{ color: 'var(--green)' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(totalPaid)}</div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'মোট পরিশোধিত' : 'Total Paid'}</div>
              </div>
            </div>
          )}
          <div
            className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-light)' }}>
              <Users size={15} style={{ color: 'var(--brand)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{studentCount}</div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">
                {fStatus === 'all' ? (bn ? 'মোট শিক্ষার্থী' : 'Total Students') :
                 fStatus === 'paid' ? (bn ? 'পরিশোধিত শিক্ষার্থী' : 'Paid Students') :
                 fStatus === 'due' ? (bn ? 'বকেয় শিক্ষার্থী' : 'Students with Due') :
                 (bn ? 'বকেয় ও পরিশোধিত শিক্ষার্থী' : 'Students with Paid & Due')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar — shown when results exist */}
      {showResults && results.length > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[12px] text-[var(--text-muted)] font-medium">
            {selectedRows.size > 0
              ? `${selectedRows.size} ${bn ? 'নির্বাচিত' : 'selected'}`
              : `${results.length} ${bn ? 'টি ফলাফল' : 'results'}`}
          </span>
          <div className="ml-auto flex items-center gap-3">
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span className="text-[0.6875rem]">
                  {bn ? `পৃষ্ঠা ${toBnNum(activePage)} / ${toBnNum(totalPages)}` : `Page ${activePage} of ${totalPages}`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    className="w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title={bn ? 'পূর্ববর্তী পৃষ্ঠা' : 'Previous page'}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage === totalPages}
                    className="w-6 h-6 flex items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title={bn ? 'পরবর্তী পৃষ্ঠা' : 'Next page'}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
            {selectedRows.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="h-[2.125rem] px-[0.75rem] rounded-[0.5rem] bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[0.75rem] font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity"
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
                    {canExport('finance.fees.dues.export') && (
                      <button
                        onClick={() => { exportExcel(); setShowActionMenu(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors"
                      >
                        <FileSpreadsheet size={14} className="text-[var(--green)]" />
                        {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                      </button>
                    )}
                    {canExport('finance.fees.dues.export') && canPrint('finance.fees.dues.print') && (
                      <div className="h-px bg-[var(--border)] mx-2" />
                    )}
                    {canPrint('finance.fees.dues.print') && (
                      <button
                        onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors"
                      >
                        <FileText size={14} className="text-[var(--red)]" />
                        {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                      </button>
                    )}
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
        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-primary)]">
          <div ref={tableScrollRef} className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          <table className="w-full text-[0.6875rem]" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr className="bg-[var(--bg-secondary)] sticky top-0 z-20 border-b border-[var(--border)]">
                <th className="text-center py-2 px-2 bg-[var(--bg-secondary)] sticky top-0 left-0 z-30" style={{ width: '2.25rem', minWidth: '2.25rem' }}>
                  <ModernCheckbox
                    checked={results.length > 0 && selectedRows.size === results.length}
                    onChange={toggleAllRows}
                    color="brand"
                    size="xs"
                  />
                </th>
                <th className="text-center py-2 px-2 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider sticky top-0 left-[2.25rem] bg-[var(--bg-secondary)] z-30 whitespace-nowrap" style={{ width: '2.5rem', minWidth: '2.5rem' }}>{bn ? 'ক্রমিক' : 'S/N'}</th>
                <th className="text-left py-2 px-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider sticky top-0 left-[4.75rem] bg-[var(--bg-secondary)] z-30 whitespace-nowrap" style={{ width: '10.5rem', minWidth: '10.5rem' }}>{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                <th className="text-center py-2 px-2 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider bg-[var(--bg-secondary)] whitespace-nowrap" style={{ width: '3.5rem', minWidth: '3.5rem' }}>{bn ? 'রোল' : 'Roll'}</th>
                <th className="text-center py-2 px-2 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider bg-[var(--bg-secondary)] whitespace-nowrap" style={{ width: '5.5rem', minWidth: '5.5rem' }}>{bn ? 'শিক্ষার্থী আইডি' : 'Student ID'}</th>
                <th className="text-center py-2 px-2 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider bg-[var(--bg-secondary)] whitespace-nowrap" style={{ width: '5.5rem', minWidth: '5.5rem' }}>{bn ? 'শ্রেণি' : 'Class'}</th>
                <th className="text-center py-2 px-2 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider bg-[var(--bg-secondary)] whitespace-nowrap" style={{ width: '7rem', minWidth: '7rem' }}>{bn ? 'ফি' : 'Fee'}</th>
                <th className="text-center py-2 px-2 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider bg-[var(--bg-secondary)] whitespace-nowrap" style={{ width: '4.75rem', minWidth: '4.75rem' }}>{bn ? 'ধরন' : 'Type'}</th>
                <th className="text-center py-2 px-2 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider bg-[var(--bg-secondary)] whitespace-nowrap" style={{ width: '5.5rem', minWidth: '5.5rem' }}>{bn ? 'ফির পরিমাণ' : 'Fee Amt'}</th>
                {showMonthPicker && sortedMonths.map((m) => (
                  <th key={m} className="text-center py-2 px-2 text-[0.6875rem] uppercase font-bold tracking-wider bg-[var(--bg-secondary)] whitespace-nowrap text-[var(--brand)]" style={{ width: '4.75rem', minWidth: '4.75rem' }}>
                    {bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en}
                  </th>
                ))}
                {(fStatus === 'all' || fStatus === 'paid' || fStatus === 'paiddue') && (
                  <th className="text-center py-2 px-2 text-[0.6875rem] uppercase font-bold tracking-wider whitespace-nowrap" style={{ width: '5.5rem', minWidth: '5.5rem', background: 'var(--green-light)', color: 'var(--green)' }}>{bn ? 'পরিশোধিত' : 'Paid'}</th>
                )}
                {(fStatus === 'all' || fStatus === 'due' || fStatus === 'paiddue') && (
                  <th className="text-center py-2 px-2 text-[0.6875rem] uppercase font-bold tracking-wider whitespace-nowrap" style={{ width: '5.5rem', minWidth: '5.5rem', background: 'var(--amber-light)', color: 'var(--amber)' }}>{bn ? 'মোট বকেয়' : 'Total Due'}</th>
                )}
                <th className="text-center py-2 px-2 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider whitespace-nowrap bg-[var(--bg-secondary)]" style={{ width: '5rem', minWidth: '5rem' }}>{bn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((row, i) => {
                const rowKey = `${row.studentId}-${row.feeStructureId}`
                const isChecked = selectedRows.has(rowKey)
                const rowIndex = (activePage - 1) * perPage + i + 1
                return (
                  <tr key={`${rowKey}-${i}`} className={`border-t border-[var(--border)] transition-colors ${isChecked ? 'bg-[var(--brand-light)]/60' : 'hover:bg-[var(--brand-light)]/40'}`}>
                    <td className="text-center py-1.5 px-2 sticky left-0 z-10" style={{ background: isChecked ? 'var(--brand-light)' : 'var(--bg-primary)', width: '2.25rem', minWidth: '2.25rem' }}>
                      <ModernCheckbox
                        checked={isChecked}
                        onChange={() => toggleRowSelection(rowKey)}
                        color="brand"
                        size="xs"
                      />
                    </td>
                    <td className="text-center py-1.5 px-2 text-[var(--text-secondary)] text-[0.6875rem] sticky left-[2.25rem] z-10 font-medium" style={{ background: isChecked ? 'var(--brand-light)' : 'var(--bg-primary)', width: '2.5rem', minWidth: '2.5rem' }}>{rowIndex}</td>
                    <td className="text-left py-1.5 px-2.5 sticky left-[4.75rem] z-10" style={{ background: isChecked ? 'var(--brand-light)' : 'var(--bg-primary)', width: '10.5rem', minWidth: '10.5rem' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden flex items-center justify-center flex-shrink-0">
                          {row.photo ? (
                            <img src={row.photo} alt={row.studentName || 'Student'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[0.6875rem] font-bold text-[var(--brand)]">{(row.studentName || '?').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <p className="font-semibold text-[var(--text-primary)] text-[0.6875rem] whitespace-nowrap overflow-hidden text-ellipsis">{bn ? row.studentNameBn || row.studentName : row.studentName}</p>
                      </div>
                    </td>
                    <td className="text-center py-1.5 px-2 text-[0.6875rem] text-[var(--text-secondary)] font-medium">{row.roll}</td>
                    <td className="text-center py-1.5 px-2 text-[0.6875rem] font-mono text-[var(--text-secondary)]">{row.studentId}</td>
                    <td className="text-center py-1.5 px-2 text-[0.6875rem] text-[var(--text-secondary)]">{row.class}{row.section ? `-${row.section}` : ''}</td>
                    <td className="text-center py-1.5 px-2">
                      <span className="font-semibold text-[var(--text-primary)] text-[0.6875rem] whitespace-nowrap">{bn ? row.feeNameBn : row.feeName}</span>
                    </td>
                    <td className="text-center py-1.5 px-2">
                      <span className="inline-block text-[0.625rem] font-bold uppercase px-1.5 py-0.5 rounded-[0.25rem] whitespace-nowrap" style={{
                        background: row.feeType === 'yearly' ? 'rgba(147, 51, 234, 0.12)' : row.feeType === 'onetime' ? 'var(--amber-light)' : 'var(--brand-light)',
                        color: row.feeType === 'yearly' ? '#9333ea' : row.feeType === 'onetime' ? 'var(--amber)' : 'var(--brand)',
                      }}>
                        {row.feeType === 'yearly'
                          ? (bn ? 'বাৎসরিক' : 'Yearly')
                          : row.feeType === 'onetime'
                          ? (bn ? 'এককালীন' : 'One-time')
                          : (bn ? 'মাসিক' : 'Monthly')}
                      </span>
                    </td>
                    <td className="text-center py-1.5 px-2 font-semibold text-[var(--text-primary)] text-[0.6875rem]">{fmt(row.totalAmount)}</td>
                    {showMonthPicker && sortedMonths.map((m) => {
                      const cell = row.months[m]
                      if (!cell) return <td key={m} className="text-center py-1.5 px-2 text-[var(--text-muted)] text-[0.6875rem]">—</td>
                      if (fStatus === 'paiddue' || fStatus === 'all') {
                        return (
                          <td key={m} className="text-center py-1.5 px-2" style={{ minWidth: '4.75rem' }}>
                            {cell.paidAmount > 0 && (
                              <button
                                onClick={() => setDetailsRow(row)}
                                className="font-bold text-[0.6875rem] text-[var(--green)] hover:underline cursor-pointer bg-transparent border-0 p-0"
                                title={bn ? 'পেমেন্ট বিবরণ দেখুন' : 'View payment details'}
                              >
                                {fmt(cell.paidAmount)}
                              </button>
                            )}
                            {cell.paidAmount > 0 && cell.amount > 0 && <span className="text-[var(--text-muted)] text-[0.625rem] font-medium"> / </span>}
                            {cell.amount > 0 && canCreate('finance.fees.collect.create') && (
                              <button
                                onClick={() => { const due = buildCollectDue(row, m); if (due) onCollect(due) }}
                                className="font-bold text-[0.6875rem] text-[var(--amber)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-0 p-0 transition-colors"
                                title={bn ? 'পরিশোধ করুন' : 'Collect'}
                              >
                                {fmt(cell.amount)}
                              </button>
                            )}
                            {cell.amount > 0 && !canCreate('finance.fees.collect.create') && (
                              <span className="font-bold text-[0.6875rem] text-[var(--amber)]">{fmt(cell.amount)}</span>
                            )}
                            {cell.paidAmount === 0 && cell.amount === 0 && (
                              <button
                                onClick={() => setDetailsRow(row)}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--green-light)] cursor-pointer border-0"
                                title={bn ? 'পেমেন্ট বিবরণ দেখুন' : 'View payment details'}
                              >
                                <CircleCheck size={14} className="text-[var(--green)]" />
                              </button>
                            )}
                          </td>
                        )
                      }
                      if (fStatus === 'paid') {
                        return (
                          <td key={m} className="text-center py-1.5 px-2" style={{ minWidth: '4.75rem' }}>
                            {cell.paidAmount > 0 ? (
                              <button
                                onClick={() => setDetailsRow(row)}
                                className="font-bold text-[0.6875rem] text-[var(--green)] hover:underline cursor-pointer bg-transparent border-0 p-0"
                                title={bn ? 'পেমেন্ট বিবরণ দেখুন' : 'View payment details'}
                              >
                                {fmt(cell.paidAmount)}
                              </button>
                            ) : cell.paid ? (
                              <button
                                onClick={() => setDetailsRow(row)}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--green-light)] cursor-pointer border-0"
                                title={bn ? 'পেমেন্ট বিবরণ দেখুন' : 'View payment details'}
                              >
                                <CircleCheck size={14} className="text-[var(--green)]" />
                              </button>
                            ) : (
                              <span className="text-[var(--text-muted)] text-[0.6875rem]">—</span>
                            )}
                          </td>
                        )
                      }
                      return (
                        <td key={m} className="text-center py-1.5 px-2" style={{ minWidth: '4.75rem' }}>
                          {cell.paid ? (
                            <button
                              onClick={() => setDetailsRow(row)}
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--green-light)] cursor-pointer border-0"
                              title={bn ? 'পেমেন্ট বিবরণ দেখুন' : 'View payment details'}
                            >
                              <CircleCheck size={14} className="text-[var(--green)]" />
                            </button>
                          ) : canCreate('finance.fees.collect.create') ? (
                            <button
                              onClick={() => { const due = buildCollectDue(row, m); if (due) onCollect(due) }}
                              className="font-bold text-[0.6875rem] text-[var(--amber)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-0 p-0 transition-colors"
                              title={bn ? 'পরিশোধ করুন' : 'Collect'}
                            >
                              {fmt(cell.amount)}
                            </button>
                          ) : (
                            <span className="font-bold text-[0.6875rem] text-[var(--amber)]">{fmt(cell.amount)}</span>
                          )}
                        </td>
                      )
                    })}
                    {showPaidCol && (
                      <td className="text-center py-1.5 px-2 font-bold text-[0.6875rem] text-[var(--green)]" style={{ minWidth: '5.5rem' }}>
                        {row.totalPaid > 0 ? (
                          <button
                            onClick={() => setDetailsRow(row)}
                            className="font-bold text-[0.6875rem] text-[var(--green)] hover:underline cursor-pointer bg-transparent border-0 p-0"
                            title={bn ? 'পেমেন্ট বিবরণ দেখুন' : 'View payment details'}
                          >
                            {fmt(row.totalPaid)}
                          </button>
                        ) : '—'}
                      </td>
                    )}
                    {showDueCol && (
                      <td className="text-center py-1.5 px-2 font-bold text-[0.6875rem] text-[var(--amber)]" style={{ width: '5.5rem', minWidth: '5.5rem', background: 'var(--amber-light)' }}>
                        {row.totalDue > 0 ? fmt(row.totalDue) : '—'}
                      </td>
                    )}
                    <td className="text-center py-1.5 px-2 whitespace-nowrap" style={{ width: '5rem', minWidth: '5rem' }}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailsRow(row)}
                          className="w-7 h-7 rounded-lg p-1 flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--border)] dark:border-white/[0.08] shadow-xs cursor-pointer"
                          title={bn ? 'পেমেন্ট বিবরণ' : 'Payment Details'}
                        >
                          <Eye size={13} />
                        </button>
                        {row.totalDue > 0 && canCreate('finance.fees.collect.create') && (
                          <button
                            onClick={() => {
                              const due = buildCollectDue(row)
                              if (due) onCollect(due)
                            }}
                            className="w-7 h-7 rounded-lg p-1 flex items-center justify-center bg-[var(--amber-light)] text-[var(--amber)] border border-[var(--border)] dark:border-white/[0.08] shadow-xs cursor-pointer"
                            title={bn ? 'ফি আদায়' : 'Collect Fee'}
                          >
                            <Banknote size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              <>
                {showPaidCol && (
                  <tr className="border-t border-[var(--border)] bg-[var(--bg-secondary)] font-bold text-[0.6875rem]">
                    <td className="py-2 px-2 sticky left-0 bg-[var(--bg-secondary)] z-10" />
                    <td className="py-2 px-2 sticky left-[2.25rem] bg-[var(--bg-secondary)] z-10" />
                    <td className="text-left py-2 px-2.5 sticky left-[4.75rem] bg-[var(--bg-secondary)] z-10 text-[0.6875rem] text-[var(--green)] font-bold whitespace-nowrap">{bn ? 'মোট পরিশোধিত' : 'Total Paid'}</td>
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    {showMonthPicker && sortedMonths.map((m) => (
                      <td key={m} className="text-center py-2 px-2 text-[0.6875rem] text-[var(--green)] font-bold bg-[var(--bg-secondary)]" style={{ minWidth: '4.75rem' }}>
                        {monthPaidSums[m] > 0 ? fmt(monthPaidSums[m]) : '—'}
                      </td>
                    ))}
                    <td className="text-center py-2 px-2 text-[0.6875rem] text-[var(--green)] font-bold" style={{ background: 'var(--green-light)', minWidth: '5.5rem' }}>{fmt(totalPaid)}</td>
                    {showDueCol && (
                      <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    )}
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                  </tr>
                )}
                {showDueCol && (
                  <tr className="border-t border-[var(--border)] bg-[var(--bg-secondary)] font-bold text-[0.6875rem]">
                    <td className="py-2 px-2 sticky left-0 bg-[var(--bg-secondary)] z-10" />
                    <td className="py-2 px-2 sticky left-[2.25rem] bg-[var(--bg-secondary)] z-10" />
                    <td className="text-left py-2 px-2.5 sticky left-[4.75rem] bg-[var(--bg-secondary)] z-10 text-[0.6875rem] text-[var(--amber)] font-bold whitespace-nowrap">{bn ? 'মোট বকেয়' : 'Total Due'}</td>
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    {showMonthPicker && sortedMonths.map((m) => (
                      <td key={m} className="text-center py-2 px-2 text-[0.6875rem] text-[var(--amber)] font-bold bg-[var(--bg-secondary)]" style={{ minWidth: '4.75rem' }}>
                        {monthSums[m] > 0 ? fmt(monthSums[m]) : '—'}
                      </td>
                    ))}
                    {showPaidCol && (
                      <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                    )}
                    <td className="text-center py-2 px-2 text-[0.6875rem] text-[var(--amber)] font-bold" style={{ background: 'var(--amber-light)', minWidth: '5.5rem' }}>{fmt(totalDue)}</td>
                    <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                  </tr>
                )}
              </>
            </tbody>
            {showResults && results.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[var(--brand)] bg-[var(--bg-secondary)] font-bold sticky bottom-0 z-20 text-[0.6875rem]">
                  <td className="py-2 px-2 sticky left-0 bg-[var(--bg-secondary)] z-30" />
                  <td className="py-2 px-2 sticky left-[2.25rem] bg-[var(--bg-secondary)] z-30" />
                  <td className="text-left py-2 px-2.5 sticky left-[4.75rem] bg-[var(--bg-secondary)] z-30 text-[0.6875rem] text-[var(--text-primary)] font-bold whitespace-nowrap">{bn ? 'মোট' : 'Total'}</td>
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2" />
                  <td className="text-center py-2 px-2 text-[0.6875rem] font-bold text-[var(--text-primary)]">{fmt(results.reduce((s, r) => s + r.totalAmount, 0))}</td>
                  {showMonthPicker && sortedMonths.map((m) => (
                    <td key={m} className="text-center py-2 px-2 text-[0.6875rem] font-bold" style={{ minWidth: '4.75rem', color: fStatus === 'paid' ? 'var(--green)' : 'var(--amber)' }}>
                      {fStatus === 'paid' ? (monthPaidSums[m] > 0 ? fmt(monthPaidSums[m]) : '—') : (monthSums[m] > 0 ? fmt(monthSums[m]) : '—')}
                    </td>
                  ))}
                  {showPaidCol && (
                    <td className="text-center py-2 px-2 text-[0.6875rem] text-[var(--green)] font-bold" style={{ background: 'var(--green-light)', minWidth: '5.5rem' }}>{fmt(totalPaid)}</td>
                  )}
                  {showDueCol && (
                    <td className="text-center py-2 px-2 text-[0.6875rem] text-[var(--amber)] font-bold" style={{ background: 'var(--amber-light)', minWidth: '5.5rem' }}>{fmt(totalDue)}</td>
                  )}
                  <td className="py-2 px-2 bg-[var(--bg-secondary)]" />
                </tr>
              </tfoot>
            )}
          </table>
          </div>
          {results.length > 0 && (
            <div className="px-3 py-1.5 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
              <PaginationControls
                page={activePage}
                setPage={setPage}
                perPage={perPage}
                setPerPage={setPerPage}
                total={results.length}
                totalPages={totalPages}
                perPageOptions={[50, 100, 200]}
                isBn={bn}
                alwaysShow={results.length > 50}
                className="flex justify-between items-center flex-wrap gap-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Payment Details Modal */}
      {detailsRow && (
        <PaymentDetailsModal
          student={{
            id: detailsRow.studentId,
            nameEn: detailsRow.studentName,
            nameBn: detailsRow.studentNameBn,
            class: detailsRow.class,
            section: detailsRow.section,
            roll: detailsRow.roll,
            photo: detailsRow.photo,
          }}
          fee={{
            id: detailsRow.feeStructureId,
            name: detailsRow.feeName,
            nameBn: detailsRow.feeNameBn,
            amount: detailsRow.totalAmount,
            type: detailsRow.feeType,
          }}
          payments={paymentsByKey.get(`${detailsRow.studentId}|${detailsRow.feeStructureId}`) || []}
          waivers={waiversByKey.get(`${detailsRow.studentId}|${detailsRow.feeStructureId}`) || []}
          totalDue={detailsRow.totalDue}
          session={fSession}
          onClose={() => setDetailsRow(null)}
          onCollect={(due) => {
            setDetailsRow(null)
            onCollect(due)
          }}
        />
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
