import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { User, Search, X, CheckCircle2, Plus, History, Ban, Receipt, Trash2, Download, CircleCheck } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeDue, FeeStructure, FeePayment } from '@/store/feeStore'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

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
  fees: { name: string; nameBn: string; amount: number; month?: string; year?: string; remarks?: string; due?: number; isOnetime?: boolean }[]
  totalAmount: number
  discount: number
  totalReceived: number
  totalDue: number
  paymentMethod: string
}

interface Props {
  onCollect: (due: FeeDue) => void
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
}

function generateMonthRows(
  structures: FeeStructure[],
  payments: { feeStructureId: string; amount: number; discount?: number; paidAt: string; forMonth?: string }[],
  waivers: { feeStructureId: string; amount: number; createdAt: string }[],
  _studentId: string,
  academicYear: string,
  advanceMonths: number,
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
  const totalMonths = (currentYearNum - year) * 12 + (currentMonthIdx - startMonth) + 1 + advanceMonths

  for (const struct of structures) {
    if (!struct.isActive) continue
    if (struct.type === 'onetime') {
      const paid = payments.filter((p) => p.feeStructureId === struct.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.feeStructureId === struct.id).reduce((sum, w) => sum + w.amount, 0)
      const receivable = struct.amount - paid - waived
      if (receivable <= 0) continue
        rows.push({
        key: `${struct.id}-onetime`, feeName: struct.name, feeNameBn: struct.nameBn,
        dateRange: `${academicYear}`, dateRangeBn: `${academicYear}`,
        amount: struct.amount, discount: 0, remarks: '', receivable, receive: receivable,
        structureId: struct.id, isOnetime: true,
      })
    } else {
      for (let i = 0; i < totalMonths; i++) {
        const monthIdx = (startMonth + i) % 12
        const yearOffset = Math.floor((startMonth + i) / 12)
        const m = months[monthIdx]
        const currentYear = year + yearOffset
        const monthPayments = payments
          .filter((p) => { if (p.feeStructureId !== struct.id) return false; if (p.forMonth) return p.forMonth === `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}`; const d = new Date(p.paidAt); return d.getFullYear() === currentYear && d.getMonth() === monthIdx })
        const paid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
        const discountFromPayments = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0)
        const waived = waivers
          .filter((w) => { if (w.feeStructureId !== struct.id) return false; const d = new Date(w.createdAt); return d.getFullYear() === currentYear && d.getMonth() === monthIdx })
          .reduce((sum, w) => sum + w.amount, 0)
        const receivable = struct.amount - paid - discountFromPayments - Math.min(waived, struct.amount)
        const isPastOrCurrentMonth = currentYear < currentYearNum || (currentYear === currentYearNum && monthIdx <= currentMonthIdx)
        if (isPastOrCurrentMonth && receivable <= 0) continue
        const startDate = `01 ${m.label} ${currentYear}`
        const endDate = `${m.days} ${m.label} ${currentYear}`
        const startDateBn = `০১ ${m.labelBn} ${currentYear}`
        const endDateBn = `${m.days} ${m.labelBn} ${currentYear}`
        rows.push({
          key: `${struct.id}-${currentYear}-${monthIdx}`, feeName: struct.name, feeNameBn: struct.nameBn,
          dateRange: `(${startDate} - ${endDate})`, dateRangeBn: `(${startDateBn} - ${endDateBn})`,
          amount: struct.amount, discount: 0, remarks: '', receivable: Math.max(0, receivable), receive: Math.max(0, receivable),
          structureId: struct.id, isOnetime: false,
        })
      }
    }
  }
  return rows
}

const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'
const fieldInputCls = 'w-full border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] bg-[var(--bg-primary)] outline-none transition-colors focus:border-[var(--brand)]'

export const CollectTab = React.memo(function CollectTab({ onCollect: _onCollect }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  const { structures, payments, waivers, addPayment, deletePayment } = useFeeStore()

  const [fSession, setFSession] = useState(institution?.currentSession || '')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fStatus, setFStatus] = useState('active')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [monthCount, setMonthCount] = useState(0)
  const [selectedFeeType, setSelectedFeeType] = useState('')
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
    structures.filter((s) => s.type === 'monthly' && s.isActive && s.class === selectedStudent?.class && (!s.section || s.section === selectedStudent?.section)),
  [structures, selectedStudent])

  const feeTypes = useMemo(() => Array.from(new Set(monthlyStructures.map((s) => s.name))), [monthlyStructures])

  const filteredStructures = useMemo(() => {
    if (!selectedFeeType) return monthlyStructures
    return monthlyStructures.filter((s) => s.name === selectedFeeType)
  }, [monthlyStructures, selectedFeeType])

  const monthRows = useMemo(() => {
    if (!selectedStudent || findDueTrigger === 0) return []
    return generateMonthRows(filteredStructures, payments.filter((p) => p.studentId === selectedStudent.id), waivers.filter((w) => w.studentId === selectedStudent.id), selectedStudent.id, fSession, monthCount, selectedStudent.billingDate)
  }, [selectedStudent, filteredStructures, payments, waivers, fSession, monthCount, findDueTrigger])

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

  const updateRow = useCallback((key: string, field: 'discount' | 'remarks' | 'receive' | 'checked', value: number | string | boolean) => {
    setEditState((prev) => { const c = prev[key] || { discount: 0, remarks: '', receive: 0, checked: true }; return { ...prev, [key]: { ...c, [field]: value } } })
  }, [])

  const totalAmount = useMemo(() => displayRows.reduce((sum, r) => sum + r.amount, 0), [displayRows])
  const totalDiscount = useMemo(() => displayRows.reduce((sum, r) => sum + getRowEdit(r.key).discount, 0), [displayRows, getRowEdit])
  const totalReceivable = useMemo(() => displayRows.filter((r) => getRowEdit(r.key).checked).reduce((sum, r) => sum + r.amount - getRowEdit(r.key).discount, 0), [displayRows, getRowEdit])
  const totalReceive = useMemo(() => displayRows.filter((r) => getRowEdit(r.key).checked).reduce((sum, r) => sum + getRowEdit(r.key).receive, 0), [displayRows, getRowEdit])
  const selectedCount = useMemo(() => displayRows.filter((r) => getRowEdit(r.key).checked).length, [displayRows, getRowEdit])

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
  const todayIncome = useMemo(() => payments.filter((p) => p.paidAt === todayStr).reduce((s, p) => s + p.amount, 0), [payments, todayStr])
  const todayDiscount = useMemo(() => payments.filter((p) => p.paidAt === todayStr).reduce((s, p) => s + (p.discount || 0), 0), [payments, todayStr])
  const todayWaiver = useMemo(() => waivers.filter((w) => w.createdAt?.startsWith(todayStr)).reduce((s, w) => s + w.amount, 0), [waivers, todayStr])


  const handleReceiveFee = useCallback(() => {
    if (!selectedStudent || totalReceive <= 0) return
    const checkedRows = displayRows.filter((r) => getRowEdit(r.key).checked && getRowEdit(r.key).receive > 0)
    if (checkedRows.length === 0) return
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const receiptFees: ReceiptData['fees'] = []
    let totalDiscount = 0
    for (const row of checkedRows) {
      const edit = getRowEdit(row.key)
      const lastDash = row.key.lastIndexOf('-')
      const secondLastDash = row.key.lastIndexOf('-', lastDash - 1)
      const forMonth = row.isOnetime ? undefined : `${row.key.substring(secondLastDash + 1, lastDash)}-${String(Number(row.key.substring(lastDash + 1)) + 1).padStart(2, '0')}`
      const payment: FeePayment = { id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, studentId: selectedStudent.id, feeStructureId: row.structureId, amount: edit.receive, discount: edit.discount, paidAt: receivedDate, method: 'cash', reference: '', note: edit.remarks, collectedBy: 'admin', createdAt: new Date().toISOString(), batchId, forMonth }
      addPayment(payment)
      const feeItem: ReceiptData['fees'][number] = {
        name: row.feeName,
        nameBn: row.feeNameBn,
        amount: edit.receive,
        due: Math.max(0, row.receivable - edit.receive - edit.discount),
        isOnetime: row.isOnetime,
        remarks: edit.remarks || undefined,
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
    const ds = new Date(receivedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const totalDue = displayRows.filter((r) => !getRowEdit(r.key).checked).reduce((s, r) => s + Math.max(0, r.receivable - getRowEdit(r.key).discount), 0)
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
    })
    setShowSuccess(true)
    const receivedKeys = new Set(checkedRows.map((r) => r.key))
    setExtraRows((prev) => prev.filter((r) => !receivedKeys.has(r.key)))
    setEditState({})
    setFindDueTrigger((t) => t + 1)
  }, [selectedStudent, displayRows, getRowEdit, totalReceive, receivedDate, addPayment, fSession])

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
    const feeRows = data.fees.map((f, i) => {
      const period = f.month ? `<span style="font-size:8px;color:#888;font-weight:400">(${f.month}-${f.year})</span>` : (f.year ? `<span style="font-size:8px;color:#888;font-weight:400">(${f.year})</span>` : '')
      const rem = f.remarks ? `<div style="font-size:7px;color:#aaa;font-style:italic">Amount for: ${f.remarks}</div>` : ''
      const due = (f.due ?? 0) > 0 ? `<div style="font-size:8px;color:#ef4444;font-weight:600">Due: ${f.due!.toLocaleString()}</div>` : ''
      return `<tr><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center">${i + 1}</td><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:left"><div style="font-weight:600">${bn ? f.nameBn : f.name} ${period}</div>${rem}${due}</td><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600">${f.amount.toLocaleString()}</td></tr>`
    }).join('')
    const dueRow = data.totalDue > 0 ? `<tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#555;border-top:2px solid #ef4444">${bn ? 'বকেয়' : 'Due'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#ef4444;border-top:2px solid #ef4444">${data.totalDue.toLocaleString()}</td></tr>` : ''
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;width:100%;max-width:480px;padding:0 10px">
      <div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid ${b.brandColor};padding-bottom:10px;margin-bottom:12px">
        ${logoHtml}
        <div style="flex:1;text-align:center">
          <div style="font-size:15px;font-weight:700;color:${b.brandColor}">${b.schoolName}</div>
          <div style="font-size:9px;color:#666;margin-top:2px">${b.address}</div>
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
      <div style="display:flex;justify-content:flex-end;margin-bottom:6px">
        <table style="width:220px;border-collapse:collapse;font-size:10px">
          <tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#555">${bn ? 'মোট' : 'Total'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:${b.brandColor}">${data.totalAmount.toLocaleString()}</td></tr>
          ${data.discount > 0 ? `<tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#555">${bn ? 'ছাড়' : 'Discount'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#f59e0b">${data.discount.toLocaleString()}</td></tr>` : ''}
          <tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#555;border-top:2px solid ${b.brandColor}">${bn ? 'পরিশোধিত' : 'Paid'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#22c55e;border-top:2px solid ${b.brandColor}">${data.totalReceived.toLocaleString()}</td></tr>
          ${dueRow}
        </table>
      </div>
      <div style="font-size:9px;color:#666;margin-bottom:3px"><b>${bn ? 'অর্থের পরিমাণ' : 'Amt in words'}:</b> ${numberToWords(data.totalReceived)} Only.</div>
      <div style="display:flex;justify-content:space-between;font-size:9px;color:#666;margin-bottom:3px"><span><b>${bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Mode'}:</b> ${data.paymentMethod.toUpperCase()}</span><span><b>BALANCE:</b> ${data.totalDue.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:25px;padding-top:10px">
        <div style="text-align:center;width:120px"><div style="border-top:1px solid #333;padding-top:4px;font-size:9px;color:#666">${bn ? 'ফি আদায়কারী' : 'Fee Collected by'}</div></div>
        <div style="text-align:center;width:120px"><div style="border-top:1px solid #333;padding-top:4px;font-size:9px;color:#666">${bn ? 'অভিভাবক' : 'Parent/Guardian'}</div></div>
      </div>
      <div style="text-align:center;font-size:8px;color:#999;margin-top:10px;padding-top:8px;border-top:1px dashed #ddd">${bn ? 'একবার ফি পরিশোধ হলে ফেরত দেওয়া হবে না' : 'Fee Once paid will not be refunded'}</div>
    </div>`
  }, [bn, numberToWords])

  const generateBatchReceipt = useCallback((batch: { payments: FeePayment[]; totalAmount: number; paidAt: string }) => {
    if (!selectedStudent || !institution) return
    const rn = `RCP-${Date.now().toString(36).toUpperCase()}`
    const ds = new Date(batch.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const fees: ReceiptData['fees'] = batch.payments.map((p) => {
      const struct = structures.find((s) => s.id === p.feeStructureId)
      const isOnetime = struct?.type === 'onetime'
      const item: ReceiptData['fees'][number] = {
        name: struct?.name || '-',
        nameBn: struct?.nameBn || '-',
        amount: p.amount,
        due: 0,
        isOnetime,
        remarks: p.note || undefined,
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
    }
    const leftCopy = buildReceiptHTML(bn ? 'শিক্ষার্থী কপি' : 'Student Copy', receiptData)
    const rightCopy = buildReceiptHTML(bn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy', receiptData)
    const css = `@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:10mm}.container{display:flex;gap:20px}.copy{flex:1;max-width:50%}.copy:first-child{border-right:2px dashed #ccc;padding-right:20px}`
    const bodyHTML = `<div class=container><div class=copy>${leftCopy}</div><div class=copy>${rightCopy}</div></div>`
    openPrintWindow(rn, bodyHTML, { css })
  }, [selectedStudent, institution, structures, fSession, bn, buildReceiptHTML])

  const handleDownloadReceipt = useCallback(() => {
    if (!receiptData) return
    const leftCopy = buildReceiptHTML(bn ? 'শিক্ষার্থী কপি' : 'Student Copy', receiptData)
    const rightCopy = buildReceiptHTML(bn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy', receiptData)
    const css = `@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:10mm}.container{display:flex;gap:20px}.copy{flex:1;max-width:50%}.copy:first-child{border-right:2px dashed #ccc;padding-right:20px}`
    const bodyHTML = `<div class="container"><div class="copy">${leftCopy}</div><div class="copy">${rightCopy}</div></div>`
    openPrintWindow(receiptData.receiptNo, bodyHTML, { css })
  }, [receiptData, bn, buildReceiptHTML])

  const oneTimeStructures = useMemo(() => {
    if (!selectedStudent) return []
    const existingKeys = new Set(displayRows.filter((r) => r.isOnetime).map((r) => r.structureId))
    return structures.filter((s) => {
      if (s.type !== 'onetime' || !s.isActive) return false
      if (s.class !== selectedStudent.class) return false
      if (s.section && s.section !== selectedStudent.section) return false
      if (existingKeys.has(s.id)) return false
      const paid = payments.filter((p) => p.studentId === selectedStudent.id && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.studentId === selectedStudent.id && w.feeStructureId === s.id).reduce((sum, w) => sum + w.amount, 0)
      return paid + waived < s.amount
    })
  }, [structures, selectedStudent, payments, waivers, displayRows])

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
      newRows.push({ key, feeName: struct.name, feeNameBn: struct.nameBn, dateRange: fSession, dateRangeBn: fSession, amount: struct.amount, discount: 0, remarks: '', receivable, receive: receivable, structureId: struct.id, isOnetime: true })
      newEditState[key] = { discount: 0, remarks: '', receive: receivable, checked: false }
    }
    setExtraRows((prev) => [...prev, ...newRows])
    setEditState((prev) => ({ ...prev, ...newEditState }))
    setSelectedOneTimeFees(new Set()); setShowOneTimeModal(false)
  }, [selectedStudent, oneTimeStructures, selectedOneTimeFees, payments, waivers, fSession])

  const handleAddFine = useCallback(() => {
    if (!selectedStudent || !fineDesc || !fineAmount) return
    const amount = Number(fineAmount); if (amount <= 0) return
    const key = `fine-${Date.now()}`
    setExtraRows((prev) => [...prev, { key, feeName: fineDesc, feeNameBn: fineDescBn || fineDesc, dateRange: fSession, dateRangeBn: fSession, amount, discount: 0, remarks: '', receivable: amount, receive: amount, structureId: '', isOnetime: true }])
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
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-[14px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--green-light)] text-[var(--green)] flex items-center justify-center flex-shrink-0">
            <Receipt size={18} />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">{bn ? 'আজকের আয়' : "Today's income"}</div>
            <div className="font-extrabold text-[15px] text-[var(--green)]">{fmt(todayIncome)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-[14px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--amber-light)] text-[var(--amber)] flex items-center justify-center flex-shrink-0">
            <Ban size={18} />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">{bn ? 'আজকের ছাড়' : "Today's discount"}</div>
            <div className="font-extrabold text-[15px] text-[var(--amber)]">{fmt(todayDiscount)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-[14px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">{bn ? 'আজকের মওকুফ' : "Today's waiver"}</div>
            <div className="font-extrabold text-[15px] text-[var(--brand)]">{fmt(todayWaiver)}</div>
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
                {selectedStudent.photo ? <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-[12px] font-bold text-[var(--brand)]">{initials(selectedStudent.nameEn)}</span>}
              </div>
              {selectedStudent.photo && (
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 pointer-events-none">
                  <div className="w-[180px] h-[220px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden">
                    <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" />
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
                      {s.photo ? <img src={s.photo} alt="" className="w-full h-full object-cover" /> : initials(s.nameEn)}
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
          {/* Section Label */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold">&#x20B9;</span>
            </div>
            <span className="font-bold text-[13.5px] text-[var(--text-primary)]">{bn ? 'ফি বিবরণ' : 'Fee details'}</span>
            {displayRows.length > 0 && <span className="text-[11.5px] text-[var(--text-muted)]">{selectedCount} {bn ? 'নির্বাচিত' : 'selected'}</span>}
          </div>

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
              <table className="w-full text-[12.5px]" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '24px' }} />
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-[var(--bg-secondary)]">
                    <th className="text-center py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">
                      <input type="checkbox" checked={displayRows.length > 0 && displayRows.every((r) => getRowEdit(r.key).checked)}
                        onChange={() => { const ac = displayRows.every((r) => getRowEdit(r.key).checked); const next: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}; for (const r of displayRows) { const e = getRowEdit(r.key); const newChecked = !ac; next[r.key] = { ...e, checked: newChecked, receive: newChecked ? Math.max(0, r.receivable - e.discount) : 0 } }; setEditState((prev) => ({ ...prev, ...next })) }}
                        className="w-3 h-3 accent-[var(--brand)]" />
                    </th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'বিবরণ' : 'Particular'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'ছাড়' : 'Discount'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'মন্তব্য' : 'Remarks'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'প্রাপ্য' : 'Receivable'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'গ্রহণ' : 'Receive'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
                    const edit = getRowEdit(row.key)
                    return (
                      <tr key={row.key} className={`transition-colors border-t border-[var(--border)] hover:bg-[var(--brand-light)]/40 ${!edit.checked ? 'opacity-45' : ''}`}>
                        <td className="text-center py-2">
                          <input type="checkbox" checked={edit.checked} onChange={(e) => {
                            const checked = e.target.checked
                            setEditState((prev) => {
                              const c = prev[row.key] || { discount: 0, remarks: '', receive: 0, checked: false }
                              return { ...prev, [row.key]: { ...c, checked, receive: checked ? Math.max(0, row.receivable - c.discount) : 0 } }
                            })
                          }} className="w-3 h-3 accent-[var(--brand)]" />
                        </td>
                        <td className="text-center px-2 py-2">
                          <span className="font-semibold text-[var(--text-primary)] text-[12px]">{bn ? row.feeNameBn : row.feeName}</span>
                          {row.isOnetime && <span className="ml-1 inline-block text-[9px] font-bold uppercase bg-[var(--amber-light)] text-[var(--amber)] px-1 py-px rounded">One-time</span>}
                          <div className="text-[10px] text-[var(--text-muted)]">{bn ? row.dateRangeBn : row.dateRange}</div>
                        </td>
                        <td className="text-center px-2 py-2"><span className="font-semibold text-[var(--text-primary)] text-[12px]">{fmt(row.amount)}</span></td>
                        <td className="text-center px-2 py-2">
                          <input type="number" value={edit.discount || ''} onChange={(e) => {
                            const discount = Math.min(Number(e.target.value) || 0, row.receivable)
                            setEditState((prev) => {
                              const c = prev[row.key] || { discount: 0, remarks: '', receive: 0, checked: false }
                              return { ...prev, [row.key]: { ...c, discount, receive: c.checked ? Math.max(0, row.receivable - discount) : c.receive } }
                            })
                          }}
                            className="h-6 w-full text-[11px] text-center px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" placeholder="0" max={row.receivable} />
                        </td>
                        <td className="text-center px-2 py-2">
                          <input type="text" value={edit.remarks} onChange={(e) => updateRow(row.key, 'remarks', e.target.value)}
                            className="h-6 w-full text-[11px] text-center px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" placeholder={bn ? '...' : '...'} />
                        </td>
                        <td className="text-center px-2 py-2"><span className="font-semibold text-[var(--text-primary)]">{fmt(row.receivable)}</span></td>
                        <td className="text-center px-2 py-2">
                          <input type="number" value={edit.receive} onChange={(e) => updateRow(row.key, 'receive', Number(e.target.value) || 0)}
                            className="h-6 w-full text-[11px] text-center px-1 rounded border border-[var(--brand-light)] bg-[var(--bg-primary)] text-[var(--brand)] font-bold outline-none focus:border-[var(--brand)]" placeholder="0" />
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
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">{bn ? 'প্রাপ্য:' : 'Receivable:'}</span>
                <span className="font-bold text-sm text-[var(--green)]">{fmt(totalReceivable)}</span>
              </div>
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
                <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} className="w-3.5 h-3.5 accent-[var(--brand)]" />
                {bn ? 'এসএমএস' : 'SMS'}
              </label>
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--text-muted)]">{bn ? 'প্রাপ্য:' : 'Receivable:'}</span>
                  <span className="font-bold text-sm text-[var(--green)]">{fmt(totalReceivable)}</span>
                </div>
                <button onClick={handleReceiveFee} disabled={totalReceive <= 0}
                  className="h-10 px-6 rounded-full bg-[var(--green)] text-white font-bold text-[13px] border-0 cursor-pointer flex items-center gap-2 shadow-[0_2px_8px_rgba(34,197,94,0.3)] hover:shadow-[0_4px_12px_rgba(34,197,94,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
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
                <button onClick={handleDownloadReceipt}
                  className="h-7 px-3 rounded-lg bg-[var(--brand)] text-white text-[11px] font-semibold border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                  <Download size={12} />{bn ? 'রসিদ ডাউনলোড' : 'Download Receipt'}
                </button>
              </div>
              <div className="p-4" style={{ fontSize: '10px' }}>
                {/* Two-column receipt */}
                <div className="flex gap-5">
                  {/* Student Copy */}
                  <div className="flex-1 border-r border-dashed border-[var(--border)] pr-5">
                    <div className="flex items-center gap-3 pb-2 mb-2 border-b-2 border-[var(--brand)]">
                      {institution?.logo ? <img src={institution.logo} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white text-[14px] font-bold">ET</div>}
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
                              {f.remarks && <div className="text-[8px] text-[var(--text-muted)]/60 italic">Amount for: {f.remarks}</div>}
                              {(f.due ?? 0) > 0 && <div className="text-[8px] text-red-500 font-semibold">{bn ? 'বকেয়:' : 'Due:'} {fmt(f.due!)}</div>}
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
                        {receiptData.totalDue > 0 && <div className="flex justify-between gap-4 border-t border-red-400 pt-0.5"><span className="text-[var(--text-muted)] font-semibold">{bn ? 'মোট বকেয়:' : 'Total Due:'}</span><span className="font-bold text-red-500">{fmt(receiptData.totalDue)}</span></div>}
                      </div>
                    </div>
                  </div>

                  {/* Institute Copy */}
                  <div className="flex-1 pl-5">
                    <div className="flex items-center gap-3 pb-2 mb-2 border-b-2 border-[var(--brand)]">
                      {institution?.logo ? <img src={institution.logo} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-[var(--brand)] flex items-center justify-center text-white text-[14px] font-bold">ET</div>}
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
                              {f.remarks && <div className="text-[8px] text-[var(--text-muted)]/60 italic">Amount for: {f.remarks}</div>}
                              {(f.due ?? 0) > 0 && <div className="text-[8px] text-red-500 font-semibold">{bn ? 'বকেয়:' : 'Due:'} {fmt(f.due!)}</div>}
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
            <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase whitespace-nowrap">{bn ? 'ফি ধরন' : 'Fee'}</label>
                <select value={selectedFeeType} onChange={(e) => setSelectedFeeType(e.target.value)}
                  className="flex-1 h-7 text-[11px] px-1.5 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]">
                  <option value="">{bn ? 'সব' : 'All'}</option>
                  {feeTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase whitespace-nowrap">{bn ? 'অগ্রিম' : 'Advance'}</label>
                <input type="number" value={monthCount} onChange={(e) => setMonthCount(Math.max(0, Math.min(12, Number(e.target.value) || 0)))} min={0} max={12}
                  className="w-[40px] h-7 text-[11px] text-center rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" />
                <div className="flex flex-col">
                  <button onClick={() => setMonthCount((c) => Math.min(12, c + 1))} className="w-4 h-3 rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[7px] text-[var(--text-muted)] leading-none hover:bg-[var(--bg-primary)]">&#9650;</button>
                  <button onClick={() => setMonthCount((c) => Math.max(0, c - 1))} className="w-4 h-3 rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[7px] text-[var(--text-muted)] leading-none hover:bg-[var(--bg-primary)]">&#9660;</button>
                </div>
              </div>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] space-y-1.5">
              <button onClick={() => setShowOneTimeModal(true)}
                className="w-full flex items-center justify-center gap-1.5 h-7 rounded-md bg-[var(--brand)] text-white text-[11px] font-semibold border-0 cursor-pointer hover:opacity-90 transition-opacity">
                <Plus size={12} />{bn ? 'এককালীন ফি' : 'One-time fee'}
              </button>
              <button onClick={() => setShowFineModal(true)}
                className="w-full flex items-center justify-center gap-1.5 h-7 rounded-md border border-[var(--border)] text-[var(--text-primary)] text-[11px] font-semibold cursor-pointer bg-transparent hover:bg-[var(--bg-secondary)] transition-colors">
                <Ban size={12} />{bn ? 'জরিমানা' : 'Add fine'}
              </button>
              <button onClick={() => setShowHistoryModal(true)}
                className="w-full flex items-center justify-center gap-1.5 h-7 rounded-md border border-[var(--border)] text-[var(--text-primary)] text-[11px] font-semibold cursor-pointer bg-transparent hover:bg-[var(--bg-secondary)] transition-colors">
                <History size={12} />{bn ? 'পেমেন্ট ইতিহাস' : 'Payment history'}
              </button>
            </div>
          </div>
      </div>
      )}

      {/* One-Time Fee Modal */}
      {showOneTimeModal && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 " onClick={() => setShowOneTimeModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-xl w-[400px] max-w-[90vw] max-h-[80vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[15px] font-bold text-[var(--text-primary)] m-0">{bn ? 'এককালীন ফি যোগ' : 'Add one-time fee'}</h3>
              <button onClick={() => setShowOneTimeModal(false)} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)]"><X size={14} /></button>
            </div>
            {oneTimeStructures.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">{bn ? 'কোনো এককালীন ফি পাওয়া যায়নি' : 'No one-time fees found'}</p>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {oneTimeStructures.map((s) => (
                    <label key={s.id} className="flex items-center gap-[10px] p-[10px] rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                      <input type="checkbox" checked={selectedOneTimeFees.has(s.id)}
                        onChange={(e) => { const next = new Set(selectedOneTimeFees); if (e.target.checked) next.add(s.id); else next.delete(s.id); setSelectedOneTimeFees(next) }}
                        className="w-[14px] h-[14px] accent-[var(--brand)]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-semibold text-[var(--text-primary)]">{bn ? s.nameBn : s.name}</div>
                        <div className="text-[10.5px] text-[var(--text-muted)]">{s.descriptionBn || s.description}</div>
                      </div>
                      <div className="text-[var(--brand)] text-[12.5px]">{fmt(s.amount)}</div>
                    </label>
                  ))}
                </div>
                <button onClick={handleAddOneTimeFees} disabled={selectedOneTimeFees.size === 0}
                  className="w-full h-10 rounded-lg bg-[var(--brand)] text-white font-bold text-[13px] border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                  {bn ? 'যোগ করুন' : 'Add selected'} ({selectedOneTimeFees.size})
                </button>
              </>
            )}
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
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {studentPayments.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">{bn ? 'কোনো পেমেন্ট নেই' : 'No payments found'}</p>
              ) : (
                <table className="w-full text-[12px]" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] sticky top-0 z-10">
                      <th className="text-center px-2 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold">#</th>
                      <th className="text-center px-2 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ফি' : 'Fee'}</th>
                      <th className="text-center px-2 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'তারিখ' : 'Date'}</th>
                      <th className="text-center px-2 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পদ্ধতি' : 'Method'}</th>
                      <th className="text-center px-2 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ইনভয়েস' : 'Invoice'}</th>
                      <th className="text-center px-2 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পরিমাণ' : 'Amount'}</th>
                      <th className="text-center px-2 py-2.5 text-[10px] uppercase text-[var(--text-muted)] font-bold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPayments.map((batch, idx) => {
                      const feeNames = batch.payments.map((p) => {
                        const struct = structures.find((s) => s.id === p.feeStructureId)
                        return struct ? (bn ? struct.nameBn : struct.name) : '-'
                      })
                      const uniqueNames = [...new Set(feeNames)]
                      const paidDate = new Date(batch.paidAt)
                      const monthLabel = `${paidDate.toLocaleString('en', { month: 'short' })} ${paidDate.getFullYear()}`
                      return (
                        <tr key={batch.batchId} className="border-t border-[var(--border)] hover:bg-[var(--brand-light)]/40">
                          <td className="text-center px-2 py-2.5 text-[var(--text-muted)]">{idx + 1}</td>
                          <td className="text-center px-2 py-2.5">
                            <div className="space-y-0.5">
                              {uniqueNames.map((name, i) => <div key={i} className="font-semibold text-[var(--text-primary)] text-[11px]">{name}</div>)}
                            </div>
                          </td>
                          <td className="text-center px-2 py-2.5 text-[var(--text-muted)]">{monthLabel}</td>
                          <td className="text-center px-2 py-2.5"><span className="inline-block px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] font-medium text-[11px]">{batch.method}</span></td>
                          <td className="text-center px-2 py-2.5"><span className="text-[11px] text-[var(--text-muted)]">{batch.invoiceNo}</span></td>
                          <td className="text-center px-2 py-2.5"><span className="font-bold text-[var(--brand)]">{fmt(batch.totalAmount)}</span></td>
                          <td className="text-center px-2 py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => generateBatchReceipt(batch)} className="w-7 h-7 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center cursor-pointer border-0 hover:bg-[var(--brand)]/20 transition-colors" title={bn ? 'ডাউনলোড' : 'Download'}>
                                <Receipt size={13} />
                              </button>
                              <button onClick={() => handleDeletePayment(batch.batchId)} className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center cursor-pointer border-0 hover:bg-red-100 hover:text-red-600 transition-colors" title={bn ? 'মুছুন' : 'Delete'}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  )
})
