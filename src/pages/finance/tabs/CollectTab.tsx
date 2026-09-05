import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { User, Search, X, CheckCircle2, Plus, History, Ban, Receipt, Trash2, Download, CircleCheck, ShoppingBag, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import { useStoreStore } from '@/store/storeStore'
import type { FeeDue, FeeStructure, FeePayment } from '@/store/feeStore'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { sendTemplateSMS } from '@/store/messageStore'
import { useMessageTemplateStore } from '@/store/messageTemplateStore'

interface ReceiptData {
  receiptNo: string
  date: string
  session: string
  feePeriod: string
  studentName: string
  studentNameBn: string
  admissionNo: string
  class: string
  section: string
  fees: { name: string; nameBn: string; amount: number; month?: string; year?: string; remarks?: string; due?: number; isOnetime?: boolean; discount?: number; waived?: number; waiverReason?: string; waiverReasonBn?: string }[]
  totalAmount: number
  discount: number
  totalReceived: number
  totalDue: number
  paymentMethod: string
  comment?: string
}

interface Props {
  onCollect: (due: FeeDue) => void
  initialStudentId?: string | null
  initialFeeStructureId?: string | null
  onClearCollectFromDue?: () => void
}

interface MonthRow {
  key: string
  feeName: string
  feeNameBn: string
  dateRange: string
  dateRangeBn: string
  amount: number
  discount: number
  remarks: string
  receivable: number
  receive: number
  structureId: string
  isOnetime: boolean
  waivedAmount: number
  waiverReason: string
  waiverReasonBn: string
}

function stripCatPrefix(note: string): string {
  const m = note.match(/^\[cat:(.+?)\|catbn:(.+?)\]\s*/)
  return m ? note.slice(m[0].length) : note
}

function generateMonthRows(
  structures: FeeStructure[],
  payments: { feeStructureId: string; amount: number; discount?: number; paidAt: string; forMonth?: string }[],
  waivers: { feeStructureId: string; amount: number; createdAt: string; forMonth?: string; reason?: string; reasonBn?: string }[],
  _studentId: string,
  academicYear: string,
  advanceMonths: number | Record<string, number>,
  billingDate?: string
): MonthRow[] {
  const rows: MonthRow[] = []
  const months = [
    { month: 0, label: 'Jan', labelBn: 'জানুয়াঁরি', days: 31 },
    { month: 1, label: 'Feb', labelBn: 'ফেব্রুয়ারি', days: 28 },
    { month: 2, label: 'Mar', labelBn: 'মার্চ', days: 31 },
    { month: 3, label: 'Apr', labelBn: 'এপ্রিল', days: 30 },
    { month: 4, label: 'May', labelBn: 'মে', days: 31 },
    { month: 5, label: 'Jun', labelBn: 'জুন', days: 30 },
    { month: 6, label: 'Jul', labelBn: 'জুলাই', days: 31 },
    { month: 7, label: 'Aug', labelBn: 'আগস্ট', days: 31 },
    { month: 8, label: 'Sep', labelBn: 'সেপ্টেম্বর', days: 30 },
    { month: 9, label: 'Oct', labelBn: 'অক্টোবর', days: 31 },
    { month: 10, label: 'Nov', labelBn: 'নভেম্বর', days: 30 },
    { month: 11, label: 'Dec', labelBn: 'ডিসেম্বর', days: 31 },
  ]

  const year = parseInt(academicYear.split('-')[0]) || 2026
  const startMonth = billingDate ? new Date(billingDate).getMonth() : 0
  const now = new Date()
  const currentMonthIdx = now.getMonth()
  const currentYearNum = now.getFullYear()

  // First, collect one-time fees
  const oneTimeRows: MonthRow[] = []
  for (const struct of structures) {
    if (!struct.isActive || struct.type !== 'onetime') continue
    const paid = payments.filter((p) => p.feeStructureId === struct.id).reduce((sum, p) => sum + p.amount, 0)
    const waivedEntries = waivers.filter((w) => w.feeStructureId === struct.id)
    const waived = waivedEntries.reduce((sum, w) => sum + w.amount, 0)
    const receivable = struct.amount - paid - waived
    if (receivable <= 0) continue
    oneTimeRows.push({
      key: `${struct.id}-onetime`, feeName: struct.name, feeNameBn: struct.nameBn,
      dateRange: `${academicYear}`, dateRangeBn: `${academicYear}`,
      amount: struct.amount, discount: 0, remarks: '', receivable, receive: receivable,
      structureId: struct.id, isOnetime: true,
      waivedAmount: waived, waiverReason: waivedEntries[0]?.reason || '', waiverReasonBn: waivedEntries[0]?.reasonBn || '',
    })
  }

  // For monthly fees, group by month (year-month) - chronological order
  // Collect all months that have at least one fee with receivable > 0
  const monthMap = new Map<string, { year: number; monthIdx: number; fees: MonthRow[] }>()

  for (const struct of structures) {
    if (!struct.isActive || struct.type !== 'monthly') continue
    const structAdvance = typeof advanceMonths === 'number' ? advanceMonths : (advanceMonths[struct.id] || 0)
    const totalMonths = (currentYearNum - year) * 12 + (currentMonthIdx - startMonth) + 1 + structAdvance
    const range = struct.applicableMonths
      ? struct.applicableMonths.filter((m) => {
          if (currentYearNum > year) return true
          if (currentYearNum === year) return m <= currentMonthIdx + structAdvance
          return false
        })
      : Array.from({ length: totalMonths }, (_, i) => i)

    for (const i of range) {
      const monthIdx = struct.applicableMonths ? i : (startMonth + i) % 12
      const yearOffset = struct.applicableMonths ? 0 : Math.floor((startMonth + i) / 12)
      const currentYear = year + yearOffset
      if (struct.applicableMonths && !struct.applicableMonths.includes(monthIdx)) continue

      const monthKey = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}`
      const m = months[monthIdx]

      const monthPayments = payments
        .filter((p) => {
          if (p.feeStructureId !== struct.id) return false
          if (p.forMonth) return p.forMonth === monthKey
          const d = new Date(p.paidAt)
          return d.getFullYear() === currentYear && d.getMonth() === monthIdx
        })
      const paid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
      const discountFromPayments = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0)
      const waivedEntries = waivers
        .filter((w) => {
          if (w.feeStructureId !== struct.id) return false
          if (w.forMonth) return w.forMonth === monthKey
          const d = new Date(w.createdAt)
          return d.getFullYear() === currentYear && d.getMonth() === monthIdx
        })
      const waived = waivedEntries.reduce((sum, w) => sum + w.amount, 0)
      const receivable = struct.amount - paid - discountFromPayments - Math.min(waived, struct.amount)
      if (receivable <= 0) continue

      const startDate = `01 ${m.label} ${currentYear}`
      const endDate = `${m.days} ${m.label} ${currentYear}`
      const startDateBn = `০১ ${m.labelBn} ${currentYear}`
      const endDateBn = `${m.days} ${m.labelBn} ${currentYear}`

      const feeRow: MonthRow = {
        key: `${struct.id}-${monthKey}`,
        feeName: struct.name,
        feeNameBn: struct.nameBn,
        dateRange: `(${startDate} - ${endDate})`,
        dateRangeBn: `(${startDateBn} - ${endDateBn})`,
        amount: struct.amount,
        discount: 0,
        remarks: '',
        receivable: Math.max(0, receivable),
        receive: Math.max(0, receivable),
        structureId: struct.id,
        isOnetime: false,
        waivedAmount: waived,
        waiverReason: waivedEntries[0]?.reason || '',
        waiverReasonBn: waivedEntries[0]?.reasonBn || '',
      }

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { year: currentYear, monthIdx, fees: [] })
      }
      monthMap.get(monthKey)!.fees.push(feeRow)
    }
  }

  // Sort months chronologically (oldest first) and flatten
  const sortedMonthKeys = Array.from(monthMap.keys()).sort()
  for (const monthKey of sortedMonthKeys) {
    const monthData = monthMap.get(monthKey)!
    for (const fee of monthData.fees) {
      rows.push(fee)
    }
  }

  // Add one-time fees at the end
  rows.push(...oneTimeRows)

  return rows
}

const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'
const fieldInputCls = 'w-full border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] bg-[var(--bg-primary)] outline-none transition-colors focus:border-[var(--brand)]'

export const CollectTab = React.memo(function CollectTab({ onCollect: _onCollect, initialStudentId, initialFeeStructureId, onClearCollectFromDue }: Props) {
  const bn = useBn()
  const { canCreate, canDelete, canPrint } = usePermission()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  const { structures, payments, generateWaivers, addPayment, deletePayment } = useFeeStore()
  const waivers = useMemo(() => generateWaivers(students), [generateWaivers, structures, payments, students])
  const storeProducts = useStoreStore((s) => s.products)
  const storeCategories = useStoreStore((s) => s.categories)
  const addSale = useStoreStore((s) => s.addSale)
  const storeSales = useStoreStore((s) => s.sales)
  const templates = useMessageTemplateStore((s) => s.templates)

  const storeCategoryMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string }> = {}
    storeCategories.forEach((c) => { map[c.id] = { name: c.name, nameBn: c.nameBn } })
    return map
  }, [storeCategories])

  const [fSession, setFSession] = useState(institution?.currentSession || '')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fStatus, setFStatus] = useState('active')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [feeAdvanceMap, setFeeAdvanceMap] = useState<Record<string, number>>({})
  const [findDueTrigger, setFindDueTrigger] = useState(0)

  const [studentSearch, setStudentSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [editState, setEditState] = useState<Record<string, { discount: number; remarks: string; receive: number; checked: boolean }>>({})
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [sendSms, setSendSms] = useState(true)

  const [showOneTimeModal, setShowOneTimeModal] = useState(false)
  const [selectedOneTimeFees, setSelectedOneTimeFees] = useState<Set<string>>(new Set())
  const [showFineModal, setShowFineModal] = useState(false)
  const [fineDesc, setFineDesc] = useState('')
  const [fineDescBn, setFineDescBn] = useState('')
  const [fineAmount, setFineAmount] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyMethod, setHistoryMethod] = useState<string>('all')
  const [historySort, setHistorySort] = useState<'newest' | 'oldest'>('newest')
  const [showShopModal, setShowShopModal] = useState(false)
  const [selectedShopProducts, setSelectedShopProducts] = useState<Set<string>>(new Set())
  const [shopQtyMap, setShopQtyMap] = useState<Record<string, number>>({})

  const [extraRows, setExtraRows] = useState<MonthRow[]>([])
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(t)
    }
  }, [showSuccess])

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (fClass ? sectionsMap[fClass] || [] : []), [fClass, sectionsMap])

  const sessionStudents = useMemo(() => {
    let list = students.filter((s) => s.academicYear === fSession)
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (fSection) list = list.filter((s) => s.section === fSection)
    if (fStatus === 'active') list = list.filter((s) => s.active !== false)
    if (fStatus === 'inactive') list = list.filter((s) => s.active === false)
    return list
  }, [students, fSession, fClass, fSection, fStatus])

  const selectedStudent = useMemo(() =>
    students.find((s) => s.id === selectedStudentId) || null,
  [students, selectedStudentId])

  useEffect(() => {
    if (initialStudentId && students.length > 0) {
      const student = students.find((s) => s.id === initialStudentId)
      if (student) {
        setFSession(student.academicYear || institution?.currentSession || '')
        setFClass(student.class || '')
        setFSection(student.section || '')
        setSelectedStudentId(student.id)
        setFindDueTrigger((t) => t + 1)
        onClearCollectFromDue?.()
      }
    }
  }, [initialStudentId, students, institution, onClearCollectFromDue])

  const dropdownStudents = useMemo(() => {
    if (!studentSearch) return sessionStudents.slice(0, 20)
    const q = studentSearch.toLowerCase()
    return sessionStudents.filter((s) =>
      s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(studentSearch) || s.id.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [sessionStudents, studentSearch])

  const initials = useCallback((name: string) => {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  }, [])

  const selectStudent = useCallback((id: string) => {
    const student = students.find((s) => s.id === id)
    if (student) { setFSession(student.academicYear || ''); setFClass(student.class || ''); setFSection(student.section || '') }
    setSelectedStudentId(id); setStudentSearch(''); setIsDropdownOpen(false); setHighlightedIndex(-1)
    setFindDueTrigger(0); setEditState({})
  }, [students])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDropdownOpen) { if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); setIsDropdownOpen(true); setHighlightedIndex(0) }; return }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setHighlightedIndex((prev) => { const n = Math.min(prev + 1, dropdownStudents.length - 1); dropdownRef.current?.querySelector(`[data-index="${n}"]`)?.scrollIntoView({ block: 'nearest' }); return n }); break
      case 'ArrowUp': e.preventDefault(); setHighlightedIndex((prev) => { const n = Math.max(prev - 1, 0); dropdownRef.current?.querySelector(`[data-index="${n}"]`)?.scrollIntoView({ block: 'nearest' }); return n }); break
      case 'Enter': e.preventDefault(); if (highlightedIndex >= 0 && highlightedIndex < dropdownStudents.length) selectStudent(dropdownStudents[highlightedIndex].id); break
      case 'Escape': setIsDropdownOpen(false); setHighlightedIndex(-1); break
    }
  }, [isDropdownOpen, highlightedIndex, dropdownStudents, selectStudent])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) { setIsDropdownOpen(false); setHighlightedIndex(-1) } }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const monthlyStructures = useMemo(() =>
    structures.filter((s) => s.type === 'monthly' && s.isActive && s.class === selectedStudent?.class && (!s.section || s.section === selectedStudent?.section) && (!s.studentId || s.studentId === selectedStudent.id)),
  [structures, selectedStudent])

  const hasClassLevelFees = useMemo(() =>
    monthlyStructures.some((s) => !s.studentId) ||
    monthlyStructures.some((s) => s.id.startsWith('FEE-OTHER-')),
  [monthlyStructures])

  const filteredStructures = monthlyStructures

  const monthRows = useMemo(() => {
    if (!selectedStudent || findDueTrigger === 0) return []
    return generateMonthRows(filteredStructures, payments.filter((p) => p.studentId === selectedStudent.id), waivers.filter((w) => w.studentId === selectedStudent.id), selectedStudent.id, fSession, feeAdvanceMap, selectedStudent.billingDate)
  }, [selectedStudent, filteredStructures, payments, waivers, fSession, feeAdvanceMap, findDueTrigger])

  useEffect(() => {
    if (monthRows.length > 0) {
      const initial: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}
      for (const row of monthRows) { if (!editState[row.key]) initial[row.key] = { discount: 0, remarks: '', receive: row.receive, checked: false }; else initial[row.key] = { ...editState[row.key] } }
      setEditState((prev) => ({ ...prev, ...initial }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthRows.length])

  const getRowEdit = useCallback((key: string) => editState[key] || { discount: 0, remarks: '', receive: 0, checked: false }, [editState])

  const displayRows = useMemo(() => [...monthRows, ...extraRows], [monthRows, extraRows])

  useEffect(() => {
    if (initialFeeStructureId && displayRows.length > 0) {
      const matchingRow = displayRows.find((r) => r.structureId === initialFeeStructureId)
      if (matchingRow && !getRowEdit(matchingRow.key).checked) {
        setEditState((prev) => ({
          ...prev,
          [matchingRow.key]: { discount: 0, remarks: '', receive: Math.max(0, matchingRow.receivable), checked: true },
        }))
      }
    }
  }, [initialFeeStructureId, displayRows])

  const updateRow = useCallback((key: string, field: 'discount' | 'remarks' | 'receive' | 'checked', value: number | string | boolean) => {
    setEditState((prev) => { const c = prev[key] || { discount: 0, remarks: '', receive: 0, checked: true }; return { ...prev, [key]: { ...c, [field]: value } } })
  }, [])

  const totalAmount = useMemo(() => displayRows.reduce((sum, r) => sum + r.amount, 0), [displayRows])
  const totalDiscount = useMemo(() => displayRows.reduce((sum, r) => sum + getRowEdit(r.key).discount, 0), [displayRows, getRowEdit])
  const totalReceive = useMemo(() => displayRows.filter((r) => getRowEdit(r.key).checked).reduce((sum, r) => sum + getRowEdit(r.key).receive, 0), [displayRows, getRowEdit])

  const studentPayments = useMemo(() => {
    if (!selectedStudent) return []
    const allPayments = payments.filter((p) => p.studentId === selectedStudent.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    const grouped = new Map<string, FeePayment[]>()
    for (const p of allPayments) {
      const key = p.batchId || `${p.paidAt}__${p.method}`
      const group = grouped.get(key) || []
      group.push(p)
      grouped.set(key, group)
    }
    return Array.from(grouped.entries()).map(([key, items]) => ({
      batchId: key,
      payments: items,
      totalAmount: items.reduce((s, p) => s + p.amount, 0),
      totalDiscount: items.reduce((s, p) => s + (p.discount || 0), 0),
      paidAt: items[0].paidAt,
      method: items[0].method,
      invoiceNo: `INV-${items[0].id.replace('pay-', '').slice(0, 10).toUpperCase()}`,
    }))
  }, [payments, selectedStudent])

  const fmt = (n: number) => Math.round(n).toLocaleString()

  const todayStr = new Date().toISOString().split('T')[0]
  const todayIncome = useMemo(() => payments.filter((p) => p.paidAt.startsWith(todayStr) && p.feeStructureId !== '' && !p.feeStructureId.startsWith('FEE-OTHER-')).reduce((s, p) => s + p.amount, 0), [payments, todayStr])
  const todayOtherIncome = useMemo(() => payments.filter((p) => p.paidAt.startsWith(todayStr) && p.feeStructureId.startsWith('FEE-OTHER-')).reduce((s, p) => s + p.amount, 0), [payments, todayStr])
  const todayShopIncome = useMemo(() => storeSales.filter((s) => s.createdAt.startsWith(todayStr)).reduce((sum, s) => sum + s.total, 0), [storeSales, todayStr])
  const todayDiscount = useMemo(() => payments.filter((p) => p.paidAt.startsWith(todayStr)).reduce((s, p) => s + (p.discount || 0), 0), [payments, todayStr])
  const todayWaiver = useMemo(() => {
    const todayPayments = payments.filter((p) => p.paidAt.startsWith(todayStr))
    if (todayPayments.length === 0) return 0
    const matchedWaiverIds = new Set<string>()
    let total = 0
    for (const p of todayPayments) {
      for (const w of waivers) {
        if (matchedWaiverIds.has(w.id)) continue
        if (w.studentId !== p.studentId || w.feeStructureId !== p.feeStructureId) continue
        if (w.forMonth && w.forMonth !== p.forMonth) continue
        matchedWaiverIds.add(w.id)
        total += w.amount
      }
    }
    return total
  }, [waivers, payments, todayStr])


  const handleReceiveFee = useCallback(() => {
    const hasCheckedWithAmount = displayRows.some((r) => { const e = getRowEdit(r.key); return e.checked && (e.receive > 0 || e.discount > 0) })
    if (!selectedStudent || !hasCheckedWithAmount) return
    const checkedRows = displayRows.filter((r) => { const e = getRowEdit(r.key); return e.checked && (e.receive > 0 || e.discount > 0) })
    if (checkedRows.length === 0) return
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const receiptFees: ReceiptData['fees'] = []
    let totalDiscount = 0
    const shopSaleItems: { productId: string; productName: string; productNameBn: string; qty: number; unitPrice: number }[] = []
    for (const row of checkedRows) {
      const edit = getRowEdit(row.key)
      const lastDash = row.key.lastIndexOf('-')
      const secondLastDash = row.key.lastIndexOf('-', lastDash - 1)
      const forMonth = row.isOnetime ? undefined : `${row.key.substring(secondLastDash + 1, lastDash)}-${row.key.substring(lastDash + 1)}`
      let paymentNote = row.key.startsWith('shop-') ? `${row.feeName} — ${edit.remarks || ''}` : edit.remarks
      if (row.key.startsWith('shop-') && !row.structureId) {
        const shopPid = row.key.substring(5, row.key.lastIndexOf('-'))
        const shopProd = storeProducts.find((pp) => pp.id === shopPid)
        if (shopProd) {
          const shopCat = storeCategoryMap[shopProd.categoryId]
          if (shopCat) {
            paymentNote = `[cat:${shopCat.name}|catbn:${shopCat.nameBn}] ${row.feeName} — ${edit.remarks || ''}`
          }
        }
      }
      const payment: FeePayment = { id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, studentId: selectedStudent.id, feeStructureId: row.structureId, amount: edit.receive, discount: edit.discount, paidAt: receivedDate, method: 'cash', reference: '', note: paymentNote, collectedBy: 'admin', createdAt: new Date().toISOString(), batchId, forMonth }
      addPayment(payment)
      // Handle shop product sales — deduct stock
      if (row.key.startsWith('shop-')) {
        const lastDash = row.key.lastIndexOf('-')
        const productId = row.key.substring(5, lastDash)
        const product = storeProducts.find((pp) => pp.id === productId)
        if (product) {
          const qtyMatch = row.remarks?.match(/^(\d+)\s*×/)
          const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1
          shopSaleItems.push({ productId: product.id, productName: product.name, productNameBn: product.nameBn, qty, unitPrice: product.price })
        }
      }
      let feeName = row.feeName
      let feeNameBn = row.feeNameBn
      if (row.key.startsWith('shop-') && !row.structureId) {
        const lastDash = row.key.lastIndexOf('-')
        const productId = row.key.substring(5, lastDash)
        const product = storeProducts.find((pp) => pp.id === productId)
        if (product) {
          const cat = storeCategoryMap[product.categoryId]
          if (cat) {
            feeName = `${cat.name} - ${product.name}`
            feeNameBn = `${cat.nameBn} - ${product.nameBn}`
          }
        }
      }
      const feeItem: ReceiptData['fees'][number] = {
        name: feeName,
        nameBn: feeNameBn,
        amount: edit.receive,
        due: Math.max(0, row.receivable - edit.receive - edit.discount),
        isOnetime: row.isOnetime,
        discount: edit.discount || undefined,
        remarks: edit.remarks || undefined,
        waived: row.waivedAmount || undefined,
        waiverReason: row.waiverReason || undefined,
        waiverReasonBn: row.waiverReasonBn || undefined,
      }
      if (!row.isOnetime && forMonth) {
        const [yr, mo] = forMonth.split('-').map(Number)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        feeItem.month = monthNames[mo - 1]
        feeItem.year = String(yr).slice(-2)
      } else if (row.isOnetime) {
        feeItem.year = row.dateRange || fSession
      }
      receiptFees.push(feeItem)
      totalDiscount += edit.discount
    }
    const rn = `RCP-${Date.now().toString(36).toUpperCase()}`
    // Create store sale for shop products
    if (shopSaleItems.length > 0) {
      const saleTotal = shopSaleItems.reduce((s, item) => s + item.unitPrice * item.qty, 0)
      addSale({
        id: `sale-fc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        items: shopSaleItems.map((item) => ({ ...item, subtotal: item.unitPrice * item.qty })),
        total: saleTotal,
        paymentMethod: 'cash',
        soldToId: selectedStudent.id,
        soldToName: selectedStudent.nameEn,
        soldToNameBn: selectedStudent.nameBn,
        soldToClass: selectedStudent.class,
        soldToSection: selectedStudent.section,
        note: `Fee Collect — ${rn}`,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
      })
    }
    const ds = new Date(receivedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const totalDue = displayRows.reduce((s, r) => {
      const edit = getRowEdit(r.key)
      if (edit.checked) return s + Math.max(0, r.receivable - edit.receive - edit.discount)
      return s + Math.max(0, r.receivable - edit.discount)
    }, 0)
    setReceiptData({
      receiptNo: rn,
      date: ds,
      session: fSession,
      feePeriod: receiptFees.length === 1 ? receiptFees[0].name : `${checkedRows.length} fees`,
      studentName: selectedStudent.nameEn,
      studentNameBn: selectedStudent.nameBn || selectedStudent.nameEn,
      admissionNo: selectedStudent.id,
      class: selectedStudent.class,
      section: selectedStudent.section || '-',
      fees: receiptFees,
      totalAmount: receiptFees.reduce((s, f) => s + f.amount, 0) + totalDiscount,
      discount: totalDiscount,
      totalReceived: totalReceive,
      totalDue,
      paymentMethod: 'cash',
      comment: checkedRows.map((r) => { const e = getRowEdit(r.key); return e.remarks }).filter(Boolean).join(', ') || undefined,
    })
    setShowSuccess(true)
    const receivedKeys = new Set(checkedRows.map((r) => r.key))
    setExtraRows((prev) => prev.filter((r) => !receivedKeys.has(r.key)))
    setEditState({})
    setFindDueTrigger((t) => t + 1)

    if (sendSms && selectedStudent.phone) {
      const feeTemplate = templates.find((t) => t.trigger === 'fee_collect')
      if (feeTemplate) {
        const feeNames = receiptFees.map((f) => bn ? f.nameBn : f.name).join(', ')
        const months = receiptFees.filter((f) => f.month).map((f) => `${f.month}-${f.year}`).join(', ')
        const smsBody = feeTemplate.body
          .replace(/{student_name}/g, bn ? selectedStudent.nameBn : selectedStudent.nameEn)
          .replace(/{amount}/g, String(totalReceive))
          .replace(/{month}/g, months || fSession)
          .replace(/{receipt_no}/g, rn)
          .replace(/{fee_name}/g, feeNames)
        const smsSubject = feeTemplate.subject
          .replace(/{student_name}/g, bn ? selectedStudent.nameBn : selectedStudent.nameEn)
          .replace(/{amount}/g, String(totalReceive))
          .replace(/{month}/g, months || fSession)
          .replace(/{receipt_no}/g, rn)
          .replace(/{fee_name}/g, feeNames)
        sendTemplateSMS({
          studentId: selectedStudent.id,
          studentName: bn ? selectedStudent.nameBn : selectedStudent.nameEn,
          phoneNumber: selectedStudent.phone,
          subject: smsSubject,
          body: smsBody,
          templateId: feeTemplate.id,
        })
      }
    }
  }, [selectedStudent, displayRows, getRowEdit, receivedDate, addPayment, addSale, storeProducts, storeCategoryMap, fSession])

  const numberToWords = useCallback((n: number): string => {
    if (n === 0) return 'Zero'
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const conv = (num: number): string => {
      if (num < 20) return ones[num]
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + conv(num % 100) : '')
      if (num < 100000) return conv(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + conv(num % 1000) : '')
      if (num < 10000000) return conv(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + conv(num % 100000) : '')
      return conv(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + conv(num % 10000000) : '')
    }
    return conv(Math.floor(n))
  }, [])

  const buildReceiptHTML = useCallback((copyLabel: string, data: ReceiptData): string => {
    const b = getPDFBranding()
    const logoHtml = pdfLogoHTML(b, 50)
    const watermarkHtml = b.logo ? `<img src="${b.logo}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:350px;height:350px;opacity:0.05;pointer-events:none;object-fit:contain" />` : ''
    const feeRows = data.fees.map((f, i) => {
      const period = f.month ? `<span style="font-size:8px;color:#555;font-weight:400">(${f.month}-${f.year})</span>` : (f.year ? `<span style="font-size:8px;color:#555;font-weight:400">(${f.year})</span>` : '')
      let details = ''
      if (f.waived && f.waived > 0) {
        const reason = bn ? f.waiverReasonBn || f.waiverReason : f.waiverReason
        details += `<div style="font-size:7px;color:#7c3aed;font-weight:500">${bn ? 'ছাড়' : 'Waiver'}: ${f.waived.toLocaleString()}${reason ? ` (${reason})` : ''}</div>`
      }
      if (f.discount && f.discount > 0) {
        details += `<div style="font-size:7px;color:#d97706;font-weight:500">${bn ? 'ডিসকাউন্ট' : 'Discount'}: ${f.discount.toLocaleString()}${f.remarks ? ` - ${f.remarks}` : ''}</div>`
      } else if (f.remarks) {
        details += `<div style="font-size:9px;color:#555;font-weight:500">${bn ? 'মন্তব্য' : 'Note'}: ${f.remarks}</div>`
      }
      return `<tr><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center">${i + 1}</td><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:left"><div style="font-weight:600">${bn ? f.nameBn : f.name} ${period}</div>${details}</td><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600">${f.amount.toLocaleString()}</td></tr>`
    }).join('')
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;width:100%;height:100%;padding:0 10px;display:flex;flex-direction:column;position:relative">
      ${watermarkHtml}
      <div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid ${b.brandColor};padding-bottom:10px;margin-bottom:12px">
        ${logoHtml}
        <div style="flex:1;text-align:center">
          <div style="font-size:15px;font-weight:700;color:${b.brandColor}">${b.schoolName}</div>
          <div style="font-size:9px;color:#444;margin-top:2px">${b.address}</div>
        </div>
      </div>
      <div style="text-align:center;font-size:13px;font-weight:700;color:${b.brandColor};background:${b.brandColor}11;border:1px solid ${b.brandColor}33;border-radius:4px;padding:6px;margin-bottom:12px">${bn ? 'ফি রসিদ/ইনভয়েস' : 'Fee Receipt/Invoice'}: [${copyLabel}]</div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span><b>${bn ? 'সেশন' : 'Session'}:</b> ${data.session}</span><span><b>${bn ? 'ফি সময়কাল' : 'Fee Period'}:</b> ${data.feePeriod}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:10px"><span><b>${bn ? 'তারিখ' : 'Date'}:</b> ${data.date}</span><span><b>${bn ? 'রসিদ নং' : 'Receipt No'}:</b> ${data.receiptNo}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span><b>${bn ? 'নাম' : 'Name'}:</b> ${bn ? data.studentNameBn : data.studentName}</span><span><b>${bn ? 'ভর্তি নং' : 'Adm No'}:</b> ${data.admissionNo}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:10px"><span><b>${bn ? 'শ্রেণি' : 'Class'}:</b> ${data.class}</span><span><b>${bn ? 'সেকশন' : 'Section'}:</b> ${data.section}</span></div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:10px">
        <thead><tr><th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:center;font-weight:600;width:30px">S.No</th><th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:left;font-weight:600">${bn ? 'ফি শিরোনাম' : 'Fee Head'}</th><th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:right;font-weight:600">${bn ? 'পরিমাণ' : 'Amount'}</th></tr></thead>
        <tbody>${feeRows}</tbody>
      </table>
      <div style="flex:1"></div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:6px">
        <table style="width:220px;border-collapse:collapse;font-size:10px">
          <tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#333">${bn ? 'মোট' : 'Total'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:${b.brandColor}">${data.totalAmount.toLocaleString()}</td></tr>
          ${data.discount > 0 ? `<tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#333">${bn ? 'ছাড়' : 'Discount'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#d97706">${data.discount.toLocaleString()}</td></tr>` : ''}
          <tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#333;border-top:2px solid ${b.brandColor}">${bn ? 'পরিশোধিত' : 'Paid'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#16a34a;border-top:2px solid ${b.brandColor}">${data.totalReceived.toLocaleString()}</td></tr>
          ${data.totalDue > 0 ? `<tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#333;border-top:2px solid #dc2626">${bn ? 'বকেয়' : 'Balance'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#dc2626;border-top:2px solid #dc2626">${data.totalDue.toLocaleString()}</td></tr>` : ''}
        </table>
      </div>
      <div style="font-size:11px;color:#333;margin-bottom:5px"><b>${bn ? 'অর্থের পরিমাণ' : 'Amt in words'}:</b> ${numberToWords(data.totalReceived)} Only.</div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#333;margin-bottom:5px"><span><b>${bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Mode'}:</b> ${data.paymentMethod.toUpperCase()}</span><span><b>BALANCE:</b> ${data.totalDue.toLocaleString()}</span></div>
      ${data.comment ? `<div style="font-size:11px;color:#333;margin-bottom:5px"><b>${bn ? 'মন্তব্য' : 'Comment'}:</b> ${data.comment}</div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-top:25px;padding-top:10px">
        <div style="text-align:center;width:120px"><div style="border-top:1px solid #333;padding-top:4px;font-size:9px;color:#333">${bn ? 'ফি আদায়কারী' : 'Fee Collected by'}</div></div>
        <div style="text-align:center;width:120px"><div style="border-top:1px solid #333;padding-top:4px;font-size:9px;color:#333">${bn ? 'অভিভাবক' : 'Parent/Guardian'}</div></div>
      </div>
      <div style="text-align:center;font-size:8px;color:#555;margin-top:10px;padding-top:8px;border-top:1px dashed #ccc">${bn ? 'একবার ফি পরিশোধ হলে ফেরত দেওয়া হবে না' : 'Fee Once paid will not be refunded'}</div>
    </div>`
  }, [bn, numberToWords])

  const generateBatchReceipt = useCallback((batch: { payments: FeePayment[]; totalAmount: number; paidAt: string }) => {
    if (!selectedStudent || !institution) return
    const rn = `RCP-${Date.now().toString(36).toUpperCase()}`
    const ds = new Date(batch.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const fees: ReceiptData['fees'] = batch.payments.map((p) => {
      const struct = structures.find((s) => s.id === p.feeStructureId)
      const isOnetime = struct?.type === 'onetime'
      const wEntry = waivers.find((w) => w.studentId === selectedStudent.id && w.feeStructureId === p.feeStructureId && (!p.forMonth || w.forMonth === p.forMonth))
      let feeName = struct?.name || '-'
      let feeNameBn = struct?.nameBn || '-'
      if (!p.feeStructureId && p.note) {
        const catMatch = p.note.match(/^\[cat:(.+?)\|catbn:(.+?)\]\s*/)
        if (catMatch) {
          const catName = catMatch[1]
          const catNameBn = catMatch[2]
          const rest = p.note.slice(catMatch[0].length)
          const dashIdx = rest.indexOf(' — ')
          const productName = dashIdx > 0 ? rest.substring(0, dashIdx).trim() : rest.trim()
          feeName = `${catName} - ${productName}`
          feeNameBn = `${catNameBn} - ${productName}`
        } else {
          const dashIdx = p.note.indexOf(' — ')
          const productName = dashIdx > 0 ? p.note.substring(0, dashIdx).trim() : p.note.split(',')[0].trim()
          const product = storeProducts.find((pp) => pp.name === productName || pp.nameBn === productName)
          if (product) {
            const cat = storeCategoryMap[product.categoryId]
            if (cat) {
              feeName = `${cat.name} - ${product.name}`
              feeNameBn = `${cat.nameBn} - ${product.nameBn}`
            } else {
              feeName = product.name
              feeNameBn = product.nameBn
            }
          } else {
            feeName = bn ? 'দোকান আইটেম' : 'Store Item'
            feeNameBn = 'দোকান আইটেম'
          }
        }
      }
      const item: ReceiptData['fees'][number] = {
        name: feeName,
        nameBn: feeNameBn,
        amount: p.amount,
        due: 0,
        isOnetime,
        discount: p.discount || undefined,
        remarks: p.note ? stripCatPrefix(p.note) : undefined,
        waived: wEntry?.amount || undefined,
        waiverReason: wEntry?.reason || undefined,
        waiverReasonBn: wEntry?.reasonBn || undefined,
      }
      if (!isOnetime && p.forMonth) {
        const [yr, mo] = p.forMonth.split('-').map(Number)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        item.month = monthNames[mo - 1]
        item.year = String(yr).slice(-2)
      } else if (isOnetime) {
        item.year = fSession
      }
      return item
    })
    const totalAmount = fees.reduce((s, f) => s + f.amount, 0) + batch.payments.reduce((s, p) => s + (p.discount || 0), 0)
    const totalDiscount = batch.payments.reduce((s, p) => s + (p.discount || 0), 0)
    const totalReceived = batch.payments.reduce((s, p) => s + p.amount, 0)
    const receiptData: ReceiptData = {
      receiptNo: rn,
      date: ds,
      session: fSession,
      feePeriod: fees.length === 1 ? fees[0].name : `${fees.length} fees`,
      studentName: selectedStudent.nameEn,
      studentNameBn: selectedStudent.nameBn || selectedStudent.nameEn,
      admissionNo: selectedStudent.id,
      class: selectedStudent.class,
      section: selectedStudent.section || '-',
      fees,
      totalAmount,
      discount: totalDiscount,
      totalReceived,
      totalDue: 0,
      paymentMethod: batch.payments[0]?.method || 'cash',
      comment: batch.payments.map((p) => p.note ? stripCatPrefix(p.note) : '').filter(Boolean).join(', ') || undefined,
    }
    const leftCopy = buildReceiptHTML(bn ? 'শিক্ষার্থী কপি' : 'Student Copy', receiptData)
    const rightCopy = buildReceiptHTML(bn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy', receiptData)
    const brandColor = getPDFBranding().brandColor
    const css = `@page{size:A4 landscape;margin:5mm}html,body{height:100%;margin:0;padding:0}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.container{display:flex;gap:16px;height:100%}.copy{flex:1;height:100%;display:flex;flex-direction:column}.copy:first-child{border-right:2px dashed #ccc;padding-right:16px}th{background:${brandColor};color:#fff;padding:5px 8px;text-align:center;font-weight:600}@media print{html,body{height:100%!important;margin:0!important;padding:0!important}body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;padding:5mm!important}}`
    const bodyHTML = `<div class=container style=width:100%><div class=copy>${leftCopy}</div><div class=copy>${rightCopy}</div></div>`
    openPrintWindow(rn, bodyHTML, { css })
  }, [selectedStudent, institution, structures, fSession, bn, buildReceiptHTML, storeProducts, storeCategoryMap])

  const handleDownloadReceipt = useCallback(() => {
    if (!receiptData) return
    const leftCopy = buildReceiptHTML(bn ? 'শিক্ষার্থী কপি' : 'Student Copy', receiptData)
    const rightCopy = buildReceiptHTML(bn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy', receiptData)
    const brandColor = getPDFBranding().brandColor
    const css = `@page{size:A4 landscape;margin:5mm}html,body{height:100%;margin:0;padding:0}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.container{display:flex;gap:16px;height:100%}.copy{flex:1;height:100%;display:flex;flex-direction:column}.copy:first-child{border-right:2px dashed #ccc;padding-right:16px}th{background:${brandColor};color:#fff;padding:5px 8px;text-align:center;font-weight:600}@media print{html,body{height:100%!important;margin:0!important;padding:0!important}body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;padding:5mm!important}}`
    const bodyHTML = `<div class=container style=width:100%><div class=copy>${leftCopy}</div><div class=copy>${rightCopy}</div></div>`
    openPrintWindow(receiptData.receiptNo, bodyHTML, { css })
  }, [receiptData, bn, buildReceiptHTML])

  const oneTimeStructures = useMemo(() => {
    if (!selectedStudent) return []
    const existingKeys = new Set(displayRows.filter((r) => r.isOnetime).map((r) => r.structureId))
    return structures.filter((s) => {
      if (s.type !== 'onetime' || !s.isActive) return false
      if (s.class !== selectedStudent.class) return false
      if (s.section && s.section !== selectedStudent.section) return false
      if (s.studentId && s.studentId !== selectedStudent.id) return false
      if (existingKeys.has(s.id)) return false
      const paid = payments.filter((p) => p.studentId === selectedStudent.id && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.studentId === selectedStudent.id && w.feeStructureId === s.id).reduce((sum, w) => sum + w.amount, 0)
      return paid + waived < s.amount
    })
  }, [structures, selectedStudent, payments, waivers, displayRows])

  const classProducts = useMemo(() => {
    if (!selectedStudent) return []
    return storeProducts.filter((p) => p.isActive && p.stock > 0 && p.classNames.includes(selectedStudent.class))
  }, [storeProducts, selectedStudent])

  const handleAddOneTimeFees = useCallback(() => {
    if (!selectedStudent) return
    const newRows: MonthRow[] = []
    const newEditState: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}
    for (const struct of oneTimeStructures) {
      if (!selectedOneTimeFees.has(struct.id)) continue
      const paid = payments.filter((p) => p.studentId === selectedStudent.id && p.feeStructureId === struct.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.studentId === selectedStudent.id && w.feeStructureId === struct.id).reduce((sum, w) => sum + w.amount, 0)
      const receivable = struct.amount - paid - waived
      if (receivable <= 0) continue
      const key = `${struct.id}-onetime-manual-${Date.now()}`
      newRows.push({ key, feeName: struct.name, feeNameBn: struct.nameBn, dateRange: fSession, dateRangeBn: fSession, amount: struct.amount, discount: 0, remarks: '', receivable, receive: receivable, structureId: struct.id, isOnetime: true, waivedAmount: 0, waiverReason: '', waiverReasonBn: '' })
      newEditState[key] = { discount: 0, remarks: '', receive: receivable, checked: false }
    }
    setExtraRows((prev) => [...prev, ...newRows])
    setEditState((prev) => ({ ...prev, ...newEditState }))
    setSelectedOneTimeFees(new Set()); setShowOneTimeModal(false)
  }, [selectedStudent, oneTimeStructures, selectedOneTimeFees, payments, waivers, fSession])

  const handleAddShopProducts = useCallback(() => {
    if (!selectedStudent) return
    const newRows: MonthRow[] = []
    const newEditState: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}
    for (const product of classProducts) {
      if (!selectedShopProducts.has(product.id)) continue
      const qty = shopQtyMap[product.id] || 1
      const subtotal = product.price * qty
      const key = `shop-${product.id}-${Date.now()}`
      newRows.push({
        key, feeName: product.name, feeNameBn: product.nameBn, dateRange: fSession, dateRangeBn: fSession,
        amount: subtotal, discount: 0, remarks: `${qty} × ৳${product.price}`, receivable: subtotal, receive: subtotal,
        structureId: '', isOnetime: true, waivedAmount: 0, waiverReason: '', waiverReasonBn: ''
      })
      newEditState[key] = { discount: 0, remarks: `${qty} × ৳${product.price}`, receive: subtotal, checked: false }
    }
    setExtraRows((prev) => [...prev, ...newRows])
    setEditState((prev) => ({ ...prev, ...newEditState }))
    setSelectedShopProducts(new Set()); setShopQtyMap({}); setShowShopModal(false)
  }, [selectedStudent, classProducts, selectedShopProducts, shopQtyMap, fSession])

  const handleAddFine = useCallback(() => {
    if (!selectedStudent || !fineDesc || !fineAmount) return
    const amount = Number(fineAmount); if (amount <= 0) return
    const key = `fine-${Date.now()}`
    setExtraRows((prev) => [...prev, { key, feeName: fineDesc, feeNameBn: fineDescBn || fineDesc, dateRange: fSession, dateRangeBn: fSession, amount, discount: 0, remarks: '', receivable: amount, receive: amount, structureId: '', isOnetime: true, waivedAmount: 0, waiverReason: '', waiverReasonBn: '' }])
    setEditState((prev) => ({ ...prev, [key]: { discount: 0, remarks: '', receive: amount, checked: false } }))
    setFineDesc(''); setFineDescBn(''); setFineAmount(''); setShowFineModal(false)
  }, [selectedStudent, fineDesc, fineDescBn, fineAmount, fSession])

  const handleDeletePayment = useCallback((batchId: string) => {
    const batch = studentPayments.find((b) => b.batchId === batchId)
    if (batch) {
      for (const p of batch.payments) {
        deletePayment(p.id)
      }
    }
    setFindDueTrigger((t) => t + 1)
  }, [deletePayment, studentPayments])

  return (
    <div className="space-y-4">
      {/* Today's Summary Cards */}
      <div className="grid grid-cols-3 gap-[0.625rem]">
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--green-light)' }}
          >
            <Receipt size={15} style={{ color: 'var(--green)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(todayIncome + todayOtherIncome + todayShopIncome)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'আজকের আয়' : "Today's income"}</div>
          </div>
        </div>
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--amber-light)' }}
          >
            <Ban size={15} style={{ color: 'var(--amber)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(todayDiscount)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'আজকের ছাড়' : "Today's discount"}</div>
          </div>
        </div>
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-light)' }}
          >
            <CheckCircle2 size={15} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(todayWaiver)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'আজকের মওকুফ' : "Today's waiver"}</div>
          </div>
        </div>
      </div>

      {/* Compact Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5">
        {/* Row 1: Filters + Find Due */}
        <div className="flex items-center gap-2 flex-wrap">
          <select value={fSession} onChange={(e) => { setFSession(e.target.value); setSelectedStudentId(null) }}
            className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer">
            {(institution?.sessions || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}
            className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer">
            <option value="all">{bn ? 'সব' : 'All'}</option>
            <option value="active">{bn ? 'সক্রিয়' : 'Active'}</option>
            <option value="inactive">{bn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
          </select>
          <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection(''); setSelectedStudentId(null) }}
            className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer">
            <option value="">{bn ? 'সব শ্রেণি' : 'All classes'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={fSection} onChange={(e) => { setFSection(e.target.value); setSelectedStudentId(null) }}
            className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer">
            <option value="">{bn ? 'সব সেকশন' : 'All sections'}</option>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="ml-auto">
            <button onClick={() => setFindDueTrigger((t) => t + 1)} disabled={!selectedStudentId}
              className="h-[34px] px-4 rounded-lg bg-[var(--brand)] text-white font-semibold text-[13px] border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
              <Search size={14} />{bn ? 'বকেয়' : 'Find due'}
            </button>
          </div>
        </div>

        {/* Row 2: Student Info Strip or Search Input */}
        {selectedStudent ? (
          <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-[var(--bg-secondary)]">
            {/* Photo with hover zoom */}
            <div className="relative group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden flex items-center justify-center cursor-pointer">
                {selectedStudent.photo ? <img src={selectedStudent.photo} alt={selectedStudent.nameEn || 'Student'} className="w-full h-full object-cover" /> : <span className="text-[12px] font-bold text-[var(--brand)]">{initials(selectedStudent.nameEn)}</span>}
              </div>
              {selectedStudent.photo && (
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 pointer-events-none">
                  <div className="w-[180px] h-[220px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden">
                     <img src={selectedStudent.photo} alt={selectedStudent.nameEn || 'Student'} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
            {/* Info */}
            <span className="text-[13px] font-bold text-[var(--text-primary)]">{selectedStudent.nameEn}</span>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[12px] text-[var(--text-muted)]">{selectedStudent.class}{selectedStudent.section ? ` - ${selectedStudent.section}` : ''}</span>
            <span className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[12px] text-[var(--text-muted)]">{selectedStudent.id}</span>
            {selectedStudent.phone && <><span className="text-[11px] text-[var(--text-muted)]">·</span><span className="text-[12px] text-[var(--text-muted)]">{selectedStudent.phone}</span></>}
            {selectedStudent.fatherNameEn && <><span className="text-[11px] text-[var(--text-muted)]">·</span><span className="text-[12px] text-[var(--text-muted)]">{bn ? 'বাবা:' : 'Father:'} {selectedStudent.fatherNameEn}</span></>}
            {selectedStudent.motherNameEn && <><span className="text-[11px] text-[var(--text-muted)]">·</span><span className="text-[12px] text-[var(--text-muted)]">{bn ? 'মা:' : 'Mother:'} {selectedStudent.motherNameEn}</span></>}
            <button onClick={() => { setSelectedStudentId(null); setStudentSearch(''); setFSession(institution?.currentSession || ''); setFStatus('active'); setFClass(''); setFSection('') }}
              className="ml-auto w-6 h-6 rounded-md hover:bg-[var(--border)] flex items-center justify-center cursor-pointer border-0 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input ref={inputRef} type="text"
              value={isDropdownOpen ? studentSearch : ''}
              placeholder={bn ? 'নাম বা আইডি দিয়ে শিক্ষার্থী খুঁজুন...' : 'Search student by name or ID...'}
              onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudentId(null); setIsDropdownOpen(true); setHighlightedIndex(0) }}
              onFocus={() => { setIsDropdownOpen(true); setHighlightedIndex(0) }}
              onKeyDown={handleKeyDown}
              className="w-full h-9 pl-9 pr-3 text-[13px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
            />
            {isDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-h-[260px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_12px_30px_rgba(20,23,33,0.12)]">
                {dropdownStudents.length === 0 ? (
                  <div className="px-3 py-2.5 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}</div>
                ) : dropdownStudents.map((s, i) => (
                  <button key={s.id} data-index={i} onClick={() => selectStudent(s.id)} onMouseEnter={() => setHighlightedIndex(i)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-0 border-b border-[var(--border)] last:border-b-0 cursor-pointer transition-colors ${i === highlightedIndex ? 'bg-[var(--brand-light)]' : 'bg-transparent hover:bg-[var(--brand-light)]'}`}>
                    <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center text-[10px] font-bold flex-shrink-0 overflow-hidden">
                       {s.photo ? <img src={s.photo} alt={s.nameEn || 'Student'} className="w-full h-full object-cover" /> : initials(s.nameEn)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{s.nameEn}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{s.class} &middot; {s.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid */}
      {!selectedStudent ? (
        <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] ">
          <div className="text-center"><User size={32} className="mx-auto mb-2 opacity-50" /><p>{bn ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select a student to view fee details'}</p></div>
        </div>
      ) : (
      <div className="grid grid-cols-[1fr_200px] gap-4 items-start max-lg:grid-cols-1">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Table */}
          {findDueTrigger === 0 ? (
            <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] ">
              <div className="text-center"><Search size={32} className="mx-auto mb-2 opacity-50" /><p>{bn ? '"বকেয় খুঁজুন" বাটনে ক্লিক করুন' : 'Click "Find due" to view dues'}</p></div>
            </div>
          ) : displayRows.length === 0 ? (
            <div className="rounded-xl bg-[var(--bg-primary)] p-6 flex items-center justify-center text-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--green)]/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={18} className="text-[var(--green)]" />
                </div>
                <div>
                  <p className="font-bold text-[13px] text-[var(--text-primary)]">{bn ? 'সব বকেয় পরিশোধিত' : 'All dues cleared'}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{bn ? 'কোনো বকেয় নেই' : 'No outstanding dues'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-xl overflow-hidden max-h-[360px] overflow-y-auto bg-[var(--bg-primary)]">
              <table className="w-full text-[12.5px] lg:text-[14px] table-fixed">
                <thead>
                  <tr className="bg-[var(--bg-secondary)]">
                    <th className="text-center py-2.5 px-3 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-10">
                      <ModernCheckbox checked={displayRows.length > 0 && displayRows.every((r) => getRowEdit(r.key).checked)}
                        onChange={() => { const ac = displayRows.every((r) => getRowEdit(r.key).checked); const next: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}; for (const r of displayRows) { const e = getRowEdit(r.key); const newChecked = !ac; next[r.key] = { ...e, checked: newChecked, receive: newChecked ? Math.max(0, r.receivable - e.discount) : 0 } }; setEditState((prev) => ({ ...prev, ...next })) }}
                        color="brand" size="xs" />
                    </th>
                    <th className="text-center px-3 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[28%]">{bn ? 'বিবরণ' : 'Particular'}</th>
                    <th className="text-center px-3 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[11%]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="text-center px-3 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[11%]">{bn ? 'ছাড়' : 'Waiver'}</th>
                    <th className="text-center px-3 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[13%]">{bn ? 'ডিসকাউন্ট' : 'Discount'}</th>
                    <th className="text-center px-3 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[13%]">{bn ? 'মন্তব্য' : 'Remarks'}</th>
                    <th className="text-center px-3 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[11%]">{bn ? 'প্রাপ্য' : 'Receivable'}</th>
                    <th className="text-center px-3 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[13%]">{bn ? 'গ্রহণ' : 'Receive'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
                    const edit = getRowEdit(row.key)
                    return (
                      <tr key={row.key} className={`transition-colors border-t border-[var(--border)] hover:bg-[var(--brand-light)]/60 ${!edit.checked ? 'opacity-45' : ''}`}>
                        <td className="text-center py-3 px-3">
                          <ModernCheckbox checked={edit.checked} onChange={(checked) => {
                            setEditState((prev) => {
                              const c = prev[row.key] || { discount: 0, remarks: '', receive: 0, checked: false }
                              return { ...prev, [row.key]: { ...c, checked, receive: checked ? Math.max(0, row.receivable - c.discount) : 0 } }
                            })
                          }} color="brand" size="xs" />
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className="font-semibold text-[var(--text-primary)] text-[12px] lg:text-[13.5px]">{bn ? row.feeNameBn : row.feeName}</span>
                          {row.isOnetime && (
                            <span className={`ml-1 inline-block text-[9px] lg:text-[10px] font-bold uppercase px-1 py-px rounded ${
                              row.structureId.startsWith('FEE-OTHER-')
                                ? 'bg-[var(--purple-light)] text-[var(--purple)]'
                                : 'bg-[var(--amber-light)] text-[var(--amber)]'
                            }`}>
                              {row.structureId.startsWith('FEE-OTHER-') ? (bn ? 'অন্যান্য আয়' : 'Others Income') : 'One-time'}
                            </span>
                          )}
                          <div className="text-[10px] lg:text-[11px] text-[var(--text-muted)]">{bn ? row.dateRangeBn : row.dateRange}</div>
                        </td>
                        <td className="text-center px-3 py-3"><span className="font-semibold text-[var(--text-primary)] text-[12px]">{fmt(row.amount)}</span></td>
                        <td className="text-center px-3 py-3">
                          {row.waivedAmount > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="text-[11px] font-bold text-[var(--purple)]">-{fmt(row.waivedAmount)}</span>
                              {(row.waiverReason || row.waiverReasonBn) && (
                                <span className="text-[8px] text-[var(--text-muted)] mt-0.5 max-w-[80px] truncate" title={bn ? row.waiverReasonBn || row.waiverReason : row.waiverReason}>
                                  {bn ? row.waiverReasonBn || row.waiverReason : row.waiverReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="text-center px-3 py-3">
                          <input type="number" value={edit.discount || ''} onChange={(e) => {
                            const discount = Math.min(Number(e.target.value) || 0, row.receivable)
                            setEditState((prev) => {
                              const c = prev[row.key] || { discount: 0, remarks: '', receive: 0, checked: false }
                              return { ...prev, [row.key]: { ...c, discount, receive: c.checked ? Math.max(0, row.receivable - discount) : c.receive } }
                            })
                          }}
                            className="h-6 lg:h-7 w-full text-[11px] lg:text-[12px] text-center px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" placeholder="0" max={row.receivable} />
                        </td>
                        <td className="text-center px-3 py-3">
                          <input type="text" value={edit.remarks} onChange={(e) => updateRow(row.key, 'remarks', e.target.value)}
                            className="h-6 lg:h-7 w-full text-[11px] lg:text-[12px] text-center px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" placeholder={bn ? '...' : '...'} />
                        </td>
                        <td className="text-center px-3 py-3"><span className="font-semibold text-[var(--text-primary)] text-[12px] lg:text-[13.5px]">{fmt(row.receivable)}</span></td>
                        <td className="text-center px-3 py-3">
                          <input type="number" value={edit.receive} onChange={(e) => updateRow(row.key, 'receive', Number(e.target.value) || 0)}
                            className="h-6 lg:h-7 w-full text-[11px] lg:text-[12px] text-center px-1 rounded border border-[var(--brand-light)] bg-[var(--bg-primary)] text-[var(--brand)] font-bold outline-none focus:border-[var(--brand)]" placeholder="0" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals Strip */}
          {displayRows.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">{bn ? 'মোট:' : 'Total:'}</span>
                <span className="font-semibold text-sm text-[var(--text-primary)]">{fmt(totalAmount)}</span>
              </div>
              <div className="w-px h-4 bg-[var(--border)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">{bn ? 'ছাড়:' : 'Discount:'}</span>
                <span className="font-bold text-sm text-[var(--amber)]">{fmt(totalDiscount)}</span>
              </div>
              <div className="w-px h-4 bg-[var(--border)]" />
              <div className="ml-auto flex items-center gap-1.5 bg-[var(--brand-light)] rounded-lg px-3 py-1.5">
                <span className="text-[11px] text-[var(--brand)] font-semibold">{bn ? 'গ্রহণ:' : 'Receiving:'}</span>
                <span className="font-extrabold text-base text-[var(--brand)]">{fmt(totalReceive)}</span>
              </div>
            </div>
          )}

          {/* Action Bar */}
          {displayRows.length > 0 && (
            <div className="flex items-center gap-4 py-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">{bn ? 'তারিখ' : 'Date'}</label>
                <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)}
                  className="h-8 w-[140px] text-[12px] px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" />
              </div>
              <label className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] cursor-pointer">
                <ModernCheckbox checked={sendSms} onChange={(c) => setSendSms(c)} color="brand" size="xs" />
                {bn ? 'এসএমএস' : 'SMS'}
              </label>
              <div className="ml-auto flex items-center gap-3">
                <button onClick={handleReceiveFee} disabled={!displayRows.some((r) => { const e = getRowEdit(r.key); return e.checked && (e.receive > 0 || e.discount > 0) })}
                  className="h-10 px-6 rounded-lg bg-[var(--brand)] text-white font-bold text-[13px] border-0 cursor-pointer flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <CircleCheck size={16} />{bn ? 'প্রাপ্ত' : 'Receive'}
                </button>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {showSuccess && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-[13px] font-semibold">
              <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              <span>{bn ? 'পেমেন্ট সফলভাবে গৃহীত হয়েছে!' : 'Payment received successfully!'}</span>
              <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-500/60 hover:text-green-600 cursor-pointer border-0 bg-transparent"><X size={14} /></button>
            </div>
          )}

          {/* Inline Receipt */}
          {receiptData && (
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  <Receipt size={15} className="text-[var(--brand)]" />
                  <span className="text-[13px] font-bold text-[var(--text-primary)]">{receiptData.receiptNo}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">· {receiptData.date}</span>
                </div>
                {canPrint('finance.fees.collect') && (
                  <button onClick={handleDownloadReceipt}
                    className="h-7 px-3 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                    <Download size={12} />{bn ? 'রসিদ ডাউনলোড' : 'Download Receipt'}
                  </button>
                )}
              </div>
              <div className="p-4" style={{ fontSize: '10px' }}>
                {/* Two-column receipt */}
                <div className="flex gap-5">
                  {/* Student Copy */}
                  <div className="flex-1 border-r border-dashed border-[var(--border)] pr-5">
                    <div className="flex items-center gap-3 pb-2 mb-2 border-b-2 border-[var(--brand)]">
                       {institution?.logo ? <img src={institution.logo} alt={institution?.name || 'School logo'} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white text-[14px] font-bold">ET</div>}
                      <div className="text-center flex-1">
                        <div className="text-[13px] font-bold text-[var(--brand)]">{institution?.name || 'EduTech'}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">{institution?.address}</div>
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-bold text-[var(--brand)] bg-[var(--brand)]/5 border border-[var(--brand)]/20 rounded px-2 py-1 mb-2">
                      {bn ? 'ফি রসিদ/ইনভয়েস' : 'Fee Receipt/Invoice'}: [{bn ? 'শিক্ষার্থী কপি' : 'Student Copy'}]
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] mb-2">
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'সেশন:' : 'Session:'}</span> {receiptData.session}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'তারিখ:' : 'Date:'}</span> {receiptData.date}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'নাম:' : 'Name:'}</span> {bn ? receiptData.studentNameBn : receiptData.studentName}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'রসিদ নং:' : 'Receipt No:'}</span> {receiptData.receiptNo}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'শ্রেণি:' : 'Class:'}</span> {receiptData.class}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'সেকশন:' : 'Section:'}</span> {receiptData.section}</div>
                    </div>
                    <table className="w-full border-collapse mb-2 text-[9px]">
                      <thead><tr className="bg-[var(--brand)] text-white">
                        <th className="px-2 py-1 text-center font-semibold">S.No</th>
                        <th className="px-2 py-1 text-left font-semibold">{bn ? 'ফি শিরোনাম' : 'Fee Head'}</th>
                        <th className="px-2 py-1 text-right font-semibold">{bn ? 'পরিমাণ' : 'Amount'}</th>
                      </tr></thead>
                      <tbody>
                        {receiptData.fees.map((f, i) => (
                          <tr key={i} className="border-b border-[var(--border)]">
                            <td className="px-2 py-1 text-center">{i + 1}</td>
                            <td className="px-2 py-1 text-left">
                              <div className="font-semibold">{bn ? f.nameBn : f.name} {(f.month || f.year) && <span className="font-normal text-[8px] text-[var(--text-muted)]">({f.month ? `${f.month}-${f.year}` : f.year})</span>}</div>
                              {f.waived && f.waived > 0 && <div className="text-[8px] text-[var(--purple)] font-medium">{bn ? `ছাড়: ${fmt(f.waived)}${f.waiverReasonBn ? ` (${f.waiverReasonBn})` : ''}` : `Waiver: ${fmt(f.waived)}${f.waiverReason ? ` (${f.waiverReason})` : ''}`}</div>}
                              {f.discount && f.discount > 0 && <div className="text-[8px] text-[var(--amber)] font-medium">{bn ? `ডিসকাউন্ট: ${fmt(f.discount)}${f.remarks ? ` - ${f.remarks}` : ''}` : `Discount: ${fmt(f.discount)}${f.remarks ? ` - ${f.remarks}` : ''}`}</div>}
                            </td>
                            <td className="px-2 py-1 text-right font-semibold">{fmt(f.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end text-[9px]">
                      <div className="space-y-0.5">
                        <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'মোট:' : 'Total:'}</span><span className="font-bold text-[var(--brand)]">{fmt(receiptData.totalAmount)}</span></div>
                        {receiptData.discount > 0 && <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'ছাড়:' : 'Discount:'}</span><span className="font-bold text-[var(--amber)]">{fmt(receiptData.discount)}</span></div>}
                        <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'পরিশোধিত:' : 'Paid:'}</span><span className="font-bold text-[var(--green)]">{fmt(receiptData.totalReceived)}</span></div>
                        {receiptData.totalDue > 0 && <div className="flex justify-between gap-4 border-t border-red-400 pt-0.5"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'বকেয়:' : 'Balance:'}</span><span className="font-bold text-red-500">{fmt(receiptData.totalDue)}</span></div>}
                        {receiptData.comment && <div className="flex justify-between gap-4 pt-0.5"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'মন্তব্য:' : 'Comment:'}</span><span className="text-[var(--text-secondary)]">{receiptData.comment}</span></div>}
                      </div>
                    </div>
                  </div>

                  {/* Institute Copy */}
                  <div className="flex-1 pl-5">
                    <div className="flex items-center gap-3 pb-2 mb-2 border-b-2 border-[var(--brand)]">
                       {institution?.logo ? <img src={institution.logo} alt={institution?.name || 'School logo'} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white text-[14px] font-bold">ET</div>}
                      <div className="text-center flex-1">
                        <div className="text-[13px] font-bold text-[var(--brand)]">{institution?.name || 'EduTech'}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">{institution?.address}</div>
                      </div>
                    </div>
                    <div className="text-center text-[11px] font-bold text-[var(--brand)] bg-[var(--brand)]/5 border border-[var(--brand)]/20 rounded px-2 py-1 mb-2">
                      {bn ? 'ফি রসিদ/ইনভয়েস' : 'Fee Receipt/Invoice'}: [{bn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy'}]
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] mb-2">
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'সেশন:' : 'Session:'}</span> {receiptData.session}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'তারিখ:' : 'Date:'}</span> {receiptData.date}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'নাম:' : 'Name:'}</span> {bn ? receiptData.studentNameBn : receiptData.studentName}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'রসিদ নং:' : 'Receipt No:'}</span> {receiptData.receiptNo}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'শ্রেণি:' : 'Class:'}</span> {receiptData.class}</div>
                      <div><span className="font-semibold text-[var(--text-muted)]">{bn ? 'সেকশন:' : 'Section:'}</span> {receiptData.section}</div>
                    </div>
                    <table className="w-full border-collapse mb-2 text-[9px]">
                      <thead><tr className="bg-[var(--brand)] text-white">
                        <th className="px-2 py-1 text-center font-semibold">S.No</th>
                        <th className="px-2 py-1 text-left font-semibold">{bn ? 'ফি শিরোনাম' : 'Fee Head'}</th>
                        <th className="px-2 py-1 text-right font-semibold">{bn ? 'পরিমাণ' : 'Amount'}</th>
                      </tr></thead>
                      <tbody>
                        {receiptData.fees.map((f, i) => (
                          <tr key={i} className="border-b border-[var(--border)]">
                            <td className="px-2 py-1 text-center">{i + 1}</td>
                            <td className="px-2 py-1 text-left">
                              <div className="font-semibold">{bn ? f.nameBn : f.name} {(f.month || f.year) && <span className="font-normal text-[8px] text-[var(--text-muted)]">({f.month ? `${f.month}-${f.year}` : f.year})</span>}</div>
                              {f.waived && f.waived > 0 && <div className="text-[8px] text-[var(--purple)] font-medium">{bn ? `ছাড়: ${fmt(f.waived)}${f.waiverReasonBn ? ` (${f.waiverReasonBn})` : ''}` : `Waiver: ${fmt(f.waived)}${f.waiverReason ? ` (${f.waiverReason})` : ''}`}</div>}
                              {f.discount && f.discount > 0 && <div className="text-[8px] text-[var(--amber)] font-medium">{bn ? `ডিসকাউন্ট: ${fmt(f.discount)}${f.remarks ? ` - ${f.remarks}` : ''}` : `Discount: ${fmt(f.discount)}${f.remarks ? ` - ${f.remarks}` : ''}`}</div>}
                            </td>
                            <td className="px-2 py-1 text-right font-semibold">{fmt(f.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end text-[9px]">
                      <div className="space-y-0.5">
                        <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'মোট:' : 'Total:'}</span><span className="font-bold text-[var(--brand)]">{fmt(receiptData.totalAmount)}</span></div>
                        {receiptData.discount > 0 && <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'ছাড়:' : 'Discount:'}</span><span className="font-bold text-[var(--amber)]">{fmt(receiptData.discount)}</span></div>}
                        <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'পরিশোধিত:' : 'Paid:'}</span><span className="font-bold text-[var(--green)]">{fmt(receiptData.totalReceived)}</span></div>
                        {receiptData.totalDue > 0 && <div className="flex justify-between gap-4 border-t border-red-400 pt-0.5"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'বকেয়:' : 'Due:'}</span><span className="font-bold text-red-500">{fmt(receiptData.totalDue)}</span></div>}
                        {receiptData.comment && <div className="flex justify-between gap-4 pt-0.5"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'মন্তব্য:' : 'Comment:'}</span><span className="text-[var(--text-secondary)]">{receiptData.comment}</span></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar */}
          <div className="space-y-2">
            {hasClassLevelFees && (
              <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] space-y-2">
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">{bn ? 'অগ্রিম' : 'Advance'}</div>
                {monthlyStructures.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[var(--text-primary)] truncate flex-1">{bn ? s.nameBn : s.name}</span>
                    <div className="flex items-center">
                      <input type="number" value={feeAdvanceMap[s.id] || 0} min={0} max={12}
                        onChange={(e) => setFeeAdvanceMap((prev) => ({ ...prev, [s.id]: Math.max(0, Math.min(12, Number(e.target.value) || 0)) }))}
                        className="w-9 h-7 text-[12px] text-center rounded-l-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <div className="flex flex-col">
                        <button onClick={() => setFeeAdvanceMap((prev) => ({ ...prev, [s.id]: Math.min(12, (prev[s.id] || 0) + 1) }))} className="w-5 h-4 rounded-tr-md border border-l-0 border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[9px] text-[var(--text-muted)] leading-none hover:bg-[var(--bg-primary)] transition-colors">&#9650;</button>
                        <button onClick={() => setFeeAdvanceMap((prev) => ({ ...prev, [s.id]: Math.max(0, (prev[s.id] || 0) - 1) }))} className="w-5 h-4 rounded-br-md border border-l-0 border-t-0 border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[9px] text-[var(--text-muted)] leading-none hover:bg-[var(--bg-primary)] transition-colors">&#9660;</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] space-y-2">
              {canCreate('finance.fees.collect') && (
                <button onClick={() => setShowOneTimeModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold border-0 cursor-pointer hover:opacity-90 transition-opacity">
                  <Plus size={13} />{bn ? 'এককালীন ফি' : 'One-time fee'}
                </button>
              )}
              {selectedStudent && classProducts.length > 0 && (
                <button onClick={() => setShowShopModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[var(--teal)] text-white text-[12px] font-semibold border-0 cursor-pointer hover:opacity-90 transition-opacity">
                  <ShoppingBag size={13} />{bn ? 'দোকান' : 'Shop'}
                </button>
              )}
              <button onClick={() => setShowFineModal(true)}
                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-transparent text-[var(--red)] text-[12px] font-semibold cursor-pointer bg-[var(--red-light)] hover:bg-[var(--red)]/15 transition-colors">
                <Ban size={13} />{bn ? 'জরিমানা' : 'Add fine'}
              </button>
              <button onClick={() => setShowHistoryModal(true)}
                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-transparent text-[var(--text-primary)] text-[12px] font-semibold cursor-pointer bg-[var(--bg-secondary)] hover:bg-[var(--border)] transition-colors">
                <History size={13} />{bn ? 'পেমেন্ট ইতিহাস' : 'Payment history'}
              </button>
            </div>
          </div>
      </div>
      )}

      {/* One-Time Fee Modal */}
      {showOneTimeModal && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={() => setShowOneTimeModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[560px] h-[520px] max-w-[90vw] flex flex-col shadow-2xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">{bn ? 'এককালীন ফি' : 'One-time Fee'}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">{bn ? `${selectedStudent?.nameBn || ''} — শ্রেণি ${selectedStudent?.class || ''}` : `${selectedStudent?.nameEn || ''} — Class ${selectedStudent?.class || ''}`}</p>
              </div>
              <button onClick={() => setShowOneTimeModal(false)} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors"><X size={15} /></button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {oneTimeStructures.length === 0 ? (
                <p className="text-[13px] text-[var(--text-muted)] text-center py-10">{bn ? 'কোনো এককালীন ফি পাওয়া যায়নি' : 'No one-time fees found'}</p>
              ) : (
                <div className="space-y-2">
                  {oneTimeStructures.map((s) => {
                    const isSelected = selectedOneTimeFees.has(s.id)
                    const toggle = () => { const next = new Set(selectedOneTimeFees); if (isSelected) next.delete(s.id); else next.add(s.id); setSelectedOneTimeFees(next) }
                    return (
                      <div key={s.id} onClick={toggle}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[var(--brand)]/20 bg-[var(--brand)]/5' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
                        <ModernCheckbox checked={isSelected} onChange={() => toggle()} />
                        <div className="flex-1 min-w-0 cursor-pointer">
                          <div className="text-[13px] font-semibold text-[var(--text-primary)]">{bn ? s.nameBn : s.name}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.descriptionBn || s.description || '—'}</div>
                        </div>
                        <div className="text-[var(--brand)] text-[14px] font-bold">৳{s.amount.toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)]">
              <button onClick={handleAddOneTimeFees} disabled={selectedOneTimeFees.size === 0}
                className="w-full h-11 rounded-xl bg-[var(--brand)] text-white font-bold text-[14px] border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                {bn ? 'যোগ করুন' : 'Add selected'} ({selectedOneTimeFees.size})
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Shop Modal */}
      {showShopModal && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={() => setShowShopModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-2xl w-[700px] h-[520px] max-w-[90vw] flex flex-col shadow-2xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--teal)]/10 text-[var(--teal)]">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">{bn ? 'দোকান' : 'Shop'}</h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">{bn ? `শ্রেণি ${selectedStudent?.class}` : `Class ${selectedStudent?.class}`}</p>
                </div>
              </div>
              <button onClick={() => setShowShopModal(false)} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors"><X size={15} /></button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {classProducts.length === 0 ? (
                <p className="text-[13px] text-[var(--text-muted)] text-center py-10">{bn ? 'এই শ্রেণিতে কোনো পণ্য নেই' : 'No products available for this class'}</p>
              ) : (
                <div className="space-y-2">
                  {classProducts.map((p) => {
                    const qty = shopQtyMap[p.id] || 1
                    const isSelected = selectedShopProducts.has(p.id)
                    const toggle = () => { const next = new Set(selectedShopProducts); if (isSelected) next.delete(p.id); else next.add(p.id); setSelectedShopProducts(next) }
                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-[var(--teal)]/20 bg-[var(--teal)]/5' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
                        <ModernCheckbox checked={isSelected} color="teal" onChange={() => toggle()} />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={toggle}>
                          <div className="text-[13px] font-semibold text-[var(--text-primary)]">{bn ? p.nameBn : p.name}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{bn ? p.unitBn : p.unit} · {p.sku}</div>
                        </div>
                        <div className="text-[var(--teal)] text-[14px] font-bold">৳{p.price}</div>
                        <div className={`text-[11px] px-2 py-0.5 rounded-full ${p.stock <= p.minStock ? 'bg-red-500/10 text-red-500' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                          {bn ? `স্টক: ${p.stock}` : `Stock: ${p.stock}`}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] rounded-lg px-1 py-0.5">
                            <button onClick={() => setShopQtyMap((prev) => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] || 1) - 1) }))}
                              className="w-7 h-7 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[12px] font-bold hover:bg-[var(--border)] transition-colors">-</button>
                            <span className="w-8 text-center text-[13px] font-bold text-[var(--text-primary)]">{qty}</span>
                            <button onClick={() => setShopQtyMap((prev) => ({ ...prev, [p.id]: Math.min(p.stock, (prev[p.id] || 1) + 1) }))}
                              className="w-7 h-7 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[12px] font-bold hover:bg-[var(--border)] transition-colors">+</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)]">
              <button onClick={handleAddShopProducts} disabled={selectedShopProducts.size === 0}
                className="w-full h-11 rounded-xl bg-[var(--teal)] text-white font-bold text-[14px] border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                {bn ? 'যোগ করুন' : 'Add selected'} ({selectedShopProducts.size})
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Fine Modal */}
      {showFineModal && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 " onClick={() => setShowFineModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-xl w-[340px] max-w-[90vw] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[15px] font-bold text-[var(--text-primary)] m-0">{bn ? 'জরিমানা যোগ' : 'Add fine'}</h3>
              <button onClick={() => setShowFineModal(false)} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)]"><X size={14} /></button>
            </div>
            <div className="mb-2.5">
              <label className={labelCls}>{bn ? 'বিবরণ' : 'Description'}</label>
              <input type="text" value={fineDesc} onChange={(e) => setFineDesc(e.target.value)} className={fieldInputCls} placeholder="e.g. Late fee" />
            </div>
            <div className="mb-3.5">
              <label className={labelCls}>{bn ? 'পরিমাণ' : 'Amount'} <span className="text-red-500">*</span></label>
              <input type="number" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} className={fieldInputCls} placeholder="0" min={0} />
            </div>
            <button onClick={handleAddFine} disabled={!fineDesc || !fineAmount || Number(fineAmount) <= 0}
              className="w-full h-10 rounded-lg bg-[var(--brand)] text-white font-bold text-[13px] border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              {bn ? 'যোগ করুন' : 'Add fine'}
            </button>
          </div>
        </div>, document.body
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedStudent && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 " onClick={() => setShowHistoryModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-xl w-[90vw] h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">{bn ? 'পেমেন্ট ইতিহাস' : 'Payment history'}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{selectedStudent.nameEn} ({selectedStudent.id})</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)]"><X size={14} /></button>
            </div>
            {/* Filter Bar */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[var(--border)] flex-shrink-0 bg-[var(--bg-secondary)]/50">
              <div className="relative flex-1 max-w-[200px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input type="text" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder={bn ? 'ফি অনুসন্ধান...' : 'Search fee...'}
                  className="w-full h-7 pl-8 pr-2 text-[11px] lg:text-[12px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
                {historySearch && <button onClick={() => setHistorySearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--border)] flex items-center justify-center cursor-pointer border-0 text-[var(--text-muted)] hover:bg-[var(--text-muted)] hover:text-white transition-colors"><X size={9} /></button>}
              </div>
              <select value={historyMethod} onChange={(e) => setHistoryMethod(e.target.value)}
                className="h-7 px-2 text-[11px] lg:text-[12px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--brand)] transition-colors">
                <option value="all">{bn ? 'সব পদ্ধতি' : 'All methods'}</option>
                <option value="cash">{bn ? 'নগদ' : 'Cash'}</option>
                <option value="bank">{bn ? 'ব্যাংক' : 'Bank'}</option>
                <option value="mobile">{bn ? 'মোবাইল' : 'Mobile'}</option>
                <option value="other">{bn ? 'অন্যান্য' : 'Other'}</option>
              </select>
              <button onClick={() => setHistorySort((s) => s === 'newest' ? 'oldest' : 'newest')}
                className="h-7 px-2.5 text-[11px] lg:text-[12px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors flex items-center gap-1">
                {historySort === 'newest' ? <ChevronDown size={12} /> : <ChevronDown size={12} className="rotate-180" />}
                {bn ? 'তারিখ' : 'Date'}
              </button>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {(() => {
                const filtered = studentPayments.filter((batch) => {
                  if (historyMethod !== 'all' && batch.method !== historyMethod) return false
                  if (historySearch) {
                    const q = historySearch.toLowerCase()
                    const names = batch.payments.map((p) => {
                      const struct = structures.find((s) => s.id === p.feeStructureId)
                      if (struct) return (bn ? struct.nameBn : struct.name).toLowerCase()
                      if (p.note) {
                        const catMatch = p.note.match(/^\[cat:(.+?)\|catbn:(.+?)\]\s*/)
                        if (catMatch) {
                          const rest = p.note.slice(catMatch[0].length)
                          const di = rest.indexOf(' — ')
                          const pn = di > 0 ? rest.substring(0, di).trim() : rest.trim()
                          return `${bn ? catMatch[2] : catMatch[1]} - ${pn}`.toLowerCase()
                        }
                        const dashIdx = p.note.indexOf(' — ')
                        const productName = dashIdx > 0 ? p.note.substring(0, dashIdx).trim() : p.note.split(',')[0].trim()
                        const product = storeProducts.find((pp) => pp.name === productName || pp.nameBn === productName)
                        if (product) {
                          const cat = storeCategoryMap[product.categoryId]
                          if (cat) return `${bn ? cat.nameBn : cat.name} - ${bn ? product.nameBn : product.name}`.toLowerCase()
                          return (bn ? product.nameBn : product.name).toLowerCase()
                        }
                        return productName.toLowerCase()
                      }
                      return (bn ? 'দোকান আইটেম' : 'Store Item').toLowerCase()
                    })
                    if (!names.some((n) => n.includes(q))) return false
                  }
                  return true
                }).sort((a, b) => historySort === 'newest' ? b.paidAt.localeCompare(a.paidAt) : a.paidAt.localeCompare(b.paidAt))
                if (filtered.length === 0) {
                  return <p className="text-xs text-[var(--text-muted)] text-center py-6">{bn ? 'কোনো পেমেন্ট নেই' : 'No payments found'}</p>
                }
                return (
                <table className="w-full text-[12px] lg:text-[13.5px]" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] sticky top-0 z-10">
                      <th className="text-center px-2 lg:px-3 py-2.5 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold">#</th>
                      <th className="text-center px-2 lg:px-3 py-2.5 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ফি' : 'Fee'}</th>
                      <th className="text-center px-2 lg:px-3 py-2.5 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'তারিখ' : 'Date'}</th>
                      <th className="text-center px-2 lg:px-3 py-2.5 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পদ্ধতি' : 'Method'}</th>
                      <th className="text-center px-2 lg:px-3 py-2.5 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ইনভয়েস' : 'Invoice'}</th>
                      <th className="text-center px-2 lg:px-3 py-2.5 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পরিমাণ' : 'Amount'}</th>
                      <th className="text-center px-2 lg:px-3 py-2.5 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'মন্তব্য' : 'Comment'}</th>
                      <th className="text-center px-2 lg:px-3 py-2.5 text-[10px] lg:text-[11px] uppercase text-[var(--text-muted)] font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((batch, idx) => {
                      const feeNames = batch.payments.map((p) => {
                        const struct = structures.find((s) => s.id === p.feeStructureId)
                        if (struct) return bn ? struct.nameBn : struct.name
                        if (p.note) {
                          const catMatch = p.note.match(/^\[cat:(.+?)\|catbn:(.+?)\]\s*/)
                          if (catMatch) {
                            const rest = p.note.slice(catMatch[0].length)
                            const di = rest.indexOf(' — ')
                            const pn = di > 0 ? rest.substring(0, di).trim() : rest.trim()
                            return `${bn ? catMatch[2] : catMatch[1]} - ${pn}`
                          }
                          const dashIdx = p.note.indexOf(' — ')
                          const productName = dashIdx > 0 ? p.note.substring(0, dashIdx).trim() : p.note.split(',')[0].trim()
                          const product = storeProducts.find((pp) => pp.name === productName || pp.nameBn === productName)
                          if (product) {
                            const cat = storeCategoryMap[product.categoryId]
                            if (cat) return `${bn ? cat.nameBn : cat.name} - ${bn ? product.nameBn : product.name}`
                            return bn ? product.nameBn : product.name
                          }
                          const priceMatch = p.note.match(/৳(\d+)/)
                          if (priceMatch) {
                            const price = Number(priceMatch[1])
                            const match = storeProducts.find((pp) => pp.price === price)
                            if (match) {
                              const cat = storeCategoryMap[match.categoryId]
                              if (cat) return `${bn ? cat.nameBn : cat.name} - ${bn ? match.nameBn : match.name}`
                              return bn ? match.nameBn : match.name
                            }
                          }
                          return p.note.split(',')[0].trim()
                        }
                        return bn ? 'দোকান আইটেম' : 'Store Item'
                      })
                      const uniqueNames = [...new Set(feeNames)]
                      const paidDate = new Date(batch.paidAt)
                      const monthLabel = paidDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      return (
                        <tr key={batch.batchId} className="border-t border-[var(--border)] hover:bg-[var(--brand-light)]/40">
                          <td className="text-center px-2 lg:px-3 py-2.5 text-[var(--text-muted)]">{idx + 1}</td>
                          <td className="text-center px-2 lg:px-3 py-2.5">
                            <div className="space-y-0.5">
                              {uniqueNames.map((name, i) => <div key={i} className="font-semibold text-[var(--text-primary)] text-[11px] lg:text-[12.5px]">{name}</div>)}
                            </div>
                          </td>
                          <td className="text-center px-2 lg:px-3 py-2.5 text-[var(--text-muted)]">{monthLabel}</td>
                          <td className="text-center px-2 lg:px-3 py-2.5"><span className="inline-block px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] font-medium text-[11px] lg:text-[12px]">{batch.method}</span></td>
                          <td className="text-center px-2 lg:px-3 py-2.5"><span className="text-[11px] lg:text-[12px] text-[var(--text-muted)]">{batch.invoiceNo}</span></td>
                          <td className="text-center px-2 lg:px-3 py-2.5"><span className="font-bold text-[var(--brand)]">{fmt(batch.totalAmount)}</span></td>
                          <td className="text-center px-2 lg:px-3 py-2.5">
                            <span className="text-[11px] lg:text-[12px] text-[var(--text-muted)] truncate block" title={batch.payments.map((p) => p.note ? stripCatPrefix(p.note) : '').filter(Boolean).join(', ')}>
                              {batch.payments.map((p) => p.note ? stripCatPrefix(p.note) : '').filter(Boolean).join(', ') || '—'}
                            </span>
                          </td>
                          <td className="text-center px-2 lg:px-3 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => generateBatchReceipt(batch)} className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center cursor-pointer border-0 hover:bg-[var(--brand)]/20 transition-colors" title={bn ? 'ডাউনলোড' : 'Download'}>
                                <Receipt size={13} />
                              </button>
                              {canDelete('finance.fees.collect') && (
                                <button onClick={() => handleDeletePayment(batch.batchId)} className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center cursor-pointer border-0 hover:bg-red-100 hover:text-red-600 transition-colors" title={bn ? 'মুছুন' : 'Delete'}>
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                )
              })()}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  )
})
