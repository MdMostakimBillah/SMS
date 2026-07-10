import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { User, Search, ChevronDown, X, CheckCircle2, Plus, History, Ban, Receipt } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeDue, FeeStructure, FeePayment } from '@/store/feeStore'
import { inputCls, selectCls } from '@/lib/styles'
import { modalStyleCls } from '@/pages/hr/utils'

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
  payments: { feeStructureId: string; amount: number; paidAt: string }[],
  waivers: { feeStructureId: string; amount: number }[],
  _studentId: string,
  academicYear: string,
  monthCount: number,
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

  for (const struct of structures) {
    if (!struct.isActive) continue
    if (struct.type === 'onetime') {
      const paid = payments.filter((p) => p.feeStructureId === struct.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.feeStructureId === struct.id).reduce((sum, w) => sum + w.amount, 0)
      const receivable = struct.amount - paid - waived
      if (receivable <= 0) continue
      rows.push({
        key: `${struct.id}-onetime`,
        feeName: struct.name,
        feeNameBn: struct.nameBn,
        dateRange: `${academicYear}`,
        dateRangeBn: `${academicYear}`,
        amount: struct.amount,
        discount: 0,
        remarks: '',
        receivable,
        receive: receivable,
        structureId: struct.id,
        isOnetime: true,
      })
    } else {
      for (let i = 0; i < monthCount; i++) {
        const monthIdx = (startMonth + i) % 12
        const yearOffset = Math.floor((startMonth + i) / 12)
        const m = months[monthIdx]
        const currentYear = year + yearOffset
        const paid = payments
          .filter((p) => {
            if (p.feeStructureId !== struct.id) return false
            const d = new Date(p.paidAt)
            return d.getFullYear() === currentYear && d.getMonth() === monthIdx
          })
          .reduce((sum, p) => sum + p.amount, 0)
        const waived = waivers
          .filter((w) => w.feeStructureId === struct.id)
          .reduce((sum, w) => sum + w.amount, 0)
        const monthWaived = Math.min(waived, struct.amount)
        const receivable = struct.amount - paid - monthWaived
        if (receivable <= 0) continue

        const startDate = `01 ${m.label} ${currentYear}`
        const endDate = `${m.days} ${m.label} ${currentYear}`
        const startDateBn = `০১ ${m.labelBn} ${currentYear}`
        const endDateBn = `${m.days} ${m.labelBn} ${currentYear}`

        rows.push({
          key: `${struct.id}-${currentYear}-${monthIdx}`,
          feeName: struct.name,
          feeNameBn: struct.nameBn,
          dateRange: `(${startDate} - ${endDate})`,
          dateRangeBn: `(${startDateBn} - ${endDateBn})`,
          amount: struct.amount,
          discount: 0,
          remarks: '',
          receivable,
          receive: receivable,
          structureId: struct.id,
          isOnetime: false,
        })
      }
    }
  }

  return rows
}

export const CollectTab = React.memo(function CollectTab({ onCollect: _onCollect }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  const { structures, payments, waivers, addPayment } = useFeeStore()

  const [fSession, setFSession] = useState(institution?.currentSession || '')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fStatus, setFStatus] = useState('all')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [monthCount, setMonthCount] = useState(3)
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
      s.nameEn.toLowerCase().includes(q) ||
      s.nameBn.includes(studentSearch) ||
      s.id.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [sessionStudents, studentSearch])

  const selectStudent = useCallback((id: string) => {
    const student = students.find((s) => s.id === id)
    if (student) {
      setFSession(student.academicYear || '')
      setFClass(student.class || '')
      setFSection(student.section || '')
    }
    setSelectedStudentId(id)
    setStudentSearch('')
    setIsDropdownOpen(false)
    setHighlightedIndex(-1)
    setFindDueTrigger(0)
    setEditState({})
  }, [students])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setIsDropdownOpen(true)
        setHighlightedIndex(0)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => {
          const next = Math.min(prev + 1, dropdownStudents.length - 1)
          dropdownRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
          return next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => {
          const next = Math.max(prev - 1, 0)
          dropdownRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: 'nearest' })
          return next
        })
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < dropdownStudents.length) {
          selectStudent(dropdownStudents[highlightedIndex].id)
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }, [isDropdownOpen, highlightedIndex, dropdownStudents, selectStudent])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
    const studentPayments = payments.filter((p) => p.studentId === selectedStudent.id)
    const studentWaivers = waivers.filter((w) => w.studentId === selectedStudent.id)
    return generateMonthRows(filteredStructures, studentPayments, studentWaivers, selectedStudent.id, fSession, monthCount, selectedStudent.billingDate)
  }, [selectedStudent, filteredStructures, payments, waivers, fSession, monthCount, findDueTrigger])

  useEffect(() => {
    if (monthRows.length > 0) {
      const initial: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}
      for (const row of monthRows) {
        if (!editState[row.key]) {
          initial[row.key] = { discount: 0, remarks: '', receive: row.receive, checked: true }
        } else {
          initial[row.key] = { ...editState[row.key] }
        }
      }
      setEditState((prev) => ({ ...prev, ...initial }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthRows.length])

  const getRowEdit = useCallback((key: string) => {
    return editState[key] || { discount: 0, remarks: '', receive: 0, checked: false }
  }, [editState])

  const displayRows = useMemo(() => [...monthRows, ...extraRows], [monthRows, extraRows])

  const updateRow = useCallback((key: string, field: 'discount' | 'remarks' | 'receive' | 'checked', value: number | string | boolean) => {
    setEditState((prev) => {
      const current = prev[key] || { discount: 0, remarks: '', receive: 0, checked: true }
      return { ...prev, [key]: { ...current, [field]: value } }
    })
  }, [])

  const totalReceivable = useMemo(() => displayRows.filter((r) => getRowEdit(r.key).checked).reduce((sum, r) => sum + r.amount - getRowEdit(r.key).discount, 0), [displayRows, getRowEdit])
  const totalReceive = useMemo(() => displayRows.filter((r) => getRowEdit(r.key).checked).reduce((sum, r) => sum + getRowEdit(r.key).receive, 0), [displayRows, getRowEdit])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayPayments = useMemo(() => {
    if (!selectedStudent) return []
    return payments.filter((p) => p.studentId === selectedStudent.id && p.paidAt === todayStr)
  }, [payments, selectedStudent, todayStr])

  const studentPayments = useMemo(() => {
    if (!selectedStudent) return []
    return payments.filter((p) => p.studentId === selectedStudent.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
  }, [payments, selectedStudent])

  const fmt = (n: number) => `\u09F3${n.toLocaleString()}`

  const generateReceipt = useCallback((paymentRows: { feeName: string; feeNameBn: string; dateRange: string; amount: number; discount: number; receive: number }[]) => {
    if (!selectedStudent || !institution) return
    const totalAmount = paymentRows.reduce((sum, r) => sum + r.amount, 0)
    const totalDiscount = paymentRows.reduce((sum, r) => sum + r.discount, 0)
    const totalReceived = paymentRows.reduce((sum, r) => sum + r.receive, 0)
    const receiptNo = `RCP-${Date.now().toString(36).toUpperCase()}`
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const fmtR = (n: number) => `\u09F3${n.toLocaleString()}`

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Fee Receipt</title>
<style>
@page{size:A4;margin:15mm}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}
.receipt{width:100%;max-width:750px;margin:0 auto;page-break-after:always}
.receipt:last-child{page-break-after:auto}
.header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:15px}
.logo{width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #1e3a5f}
.school-info{flex:1;text-align:center}
.school-name{font-size:16px;font-weight:700;color:#1e3a5f}
.school-address{font-size:10px;color:#666;margin-top:2px}
.copy-label{font-size:10px;color:#999;text-align:center;margin:5px 0}
.title{text-align:center;font-size:14px;font-weight:700;color:#1e3a5f;margin:10px 0}
.info-row{display:flex;justify-content:space-between;margin-bottom:3px}
.info-label{font-weight:600;color:#333}.info-value{color:#555}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10px}
th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:center;font-weight:600}
td{padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center}
tr:nth-child(even){background:#f8f9fa}
.totals{display:flex;justify-content:flex-end;margin-top:10px}
.totals-table{width:280px}
.totals-table td{padding:4px 8px;font-size:10px}
.totals-table td:first-child{text-align:right;font-weight:600;color:#555}
.totals-table td:last-child{text-align:right;font-weight:700;color:#1e3a5f}
.totals-table tr:last-child td{border-top:2px solid #1e3a5f;font-size:12px;color:#1e3a5f}
.signatures{display:flex;justify-content:space-between;margin-top:30px;padding-top:15px}
.signature-box{text-align:center;width:150px}
.signature-line{border-top:1px solid #333;margin-top:40px;padding-top:5px;font-size:10px;color:#666}
.footer{text-align:center;font-size:9px;color:#999;margin-top:15px;padding-top:10px;border-top:1px dashed #ddd}
.btn-row{text-align:center;margin:10px 0}
.download-btn{display:inline-block;background:#16a34a;color:#fff;padding:8px 16px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:none}
.download-btn:hover{background:#15803d}
</style></head><body>
${[0, 1].map(copyIdx => {
  const copyLabel = copyIdx === 0 ? 'Admin Copy' : 'Student Copy'
  return `<div class="receipt">
<div class="header">
<img src="${institution.logo || ''}" class="logo" alt="" onerror="this.style.display='none'">
<div class="school-info"><div class="school-name">${institution.name || 'School Name'}</div>
<div class="school-address">${institution.address || ''} | ${institution.phone || ''} | ${institution.email || ''}</div></div></div>
<div class="copy-label">${copyLabel}</div>
<div class="info-row"><div>
<div><span class="info-label">Student Name:</span> <span class="info-value">${bn ? selectedStudent.nameBn : selectedStudent.nameEn}</span></div>
<div><span class="info-label">Student Id:</span> <span class="info-value">${selectedStudent.id}</span></div>
<div><span class="info-label">Roll No:</span> <span class="info-value">${selectedStudent.roll}</span></div>
<div><span class="info-label">Class:</span> <span class="info-value">${selectedStudent.class}</span></div>
<div><span class="info-label">Section:</span> <span class="info-value">${selectedStudent.section}</span></div></div>
<div style="text-align:right">
<div><span class="info-label">Receipt No:</span> <span class="info-value">${receiptNo}</span></div>
<div><span class="info-label">Date:</span> <span class="info-value">${dateStr}</span></div></div></div>
<div class="title">Fee Receipt</div>
<table><thead><tr><th style="text-align:left">Particulars</th><th>Actual Amount</th><th>Discount</th><th>Receivable</th><th>Received Amount</th></tr></thead>
<tbody>${paymentRows.map(r => `<tr><td style="text-align:left">${bn ? r.feeNameBn : r.feeName} ${r.dateRange ? '(' + r.dateRange + ')' : ''}</td><td>${fmtR(r.amount)}</td><td>${fmtR(r.discount)}</td><td>${fmtR(r.amount - r.discount)}</td><td>${fmtR(r.receive)}</td></tr>`).join('')}</tbody></table>
<div class="totals"><table class="totals-table">
<tr><td>Total Actual Amount:</td><td>${fmtR(totalAmount)}</td></tr>
<tr><td>Total Discount:</td><td>${fmtR(totalDiscount)}</td></tr>
<tr><td>Total Receivable:</td><td>${fmtR(totalAmount - totalDiscount)}</td></tr>
<tr><td>Total Amount Received:</td><td>${fmtR(totalReceived)}</td></tr></table></div>
<div class="signatures"><div class="signature-box"><div class="signature-line">Principal's Signature</div></div>
<div class="signature-box"><div class="signature-line">Receiver's Signature</div></div></div>
<div class="footer">The amount once paid is nonrefundable.<br>Software developed and managed by: SMS EduTech</div></div>`
}).join('')}
<div class="btn-row"><button class="download-btn" onclick="window.print()">Download Receipt</button></div>
</body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (w) w.onload = () => w.print()
  }, [selectedStudent, institution, bn])

  const handleReceiveFee = useCallback(() => {
    if (!selectedStudent || totalReceive <= 0) return
    const checkedRows = displayRows.filter((r) => getRowEdit(r.key).checked && getRowEdit(r.key).receive > 0)
    if (checkedRows.length === 0) return

    const receiptRows: { feeName: string; feeNameBn: string; dateRange: string; amount: number; discount: number; receive: number }[] = []
    for (const row of checkedRows) {
      const edit = getRowEdit(row.key)
      const payment: FeePayment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        studentId: selectedStudent.id,
        feeStructureId: row.structureId,
        amount: edit.receive,
        paidAt: receivedDate,
        method: 'cash',
        reference: '',
        note: edit.remarks,
        collectedBy: 'admin',
        createdAt: new Date().toISOString(),
      }
      addPayment(payment)
      receiptRows.push({ feeName: row.feeName, feeNameBn: row.feeNameBn, dateRange: row.dateRange, amount: row.amount, discount: edit.discount, receive: edit.receive })
    }
    generateReceipt(receiptRows)
    setExtraRows([])
    setEditState({})
    setFindDueTrigger((t) => t + 1)
  }, [selectedStudent, displayRows, getRowEdit, totalReceive, receivedDate, addPayment, generateReceipt])

  const oneTimeStructures = useMemo(() => {
    if (!selectedStudent) return []
    return structures.filter((s) => {
      if (s.type !== 'onetime' || !s.isActive) return false
      if (s.class !== selectedStudent.class) return false
      if (s.section && s.section !== selectedStudent.section) return false
      const paid = payments.filter((p) => p.studentId === selectedStudent.id && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.studentId === selectedStudent.id && w.feeStructureId === s.id).reduce((sum, w) => sum + w.amount, 0)
      return paid + waived < s.amount
    })
  }, [structures, selectedStudent, payments, waivers])

  const handleAddOneTimeFees = useCallback(() => {
    if (!selectedStudent) return
    const newRows: MonthRow[] = []
    for (const struct of oneTimeStructures) {
      if (!selectedOneTimeFees.has(struct.id)) continue
      const paid = payments.filter((p) => p.studentId === selectedStudent.id && p.feeStructureId === struct.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.studentId === selectedStudent.id && w.feeStructureId === struct.id).reduce((sum, w) => sum + w.amount, 0)
      const receivable = struct.amount - paid - waived
      if (receivable <= 0) continue
      newRows.push({
        key: `${struct.id}-onetime-manual`, feeName: struct.name, feeNameBn: struct.nameBn,
        dateRange: fSession, dateRangeBn: fSession, amount: struct.amount, discount: 0,
        remarks: '', receivable, receive: receivable, structureId: struct.id, isOnetime: true,
      })
    }
    setExtraRows((prev) => [...prev, ...newRows])
    setSelectedOneTimeFees(new Set())
    setShowOneTimeModal(false)
  }, [selectedStudent, oneTimeStructures, selectedOneTimeFees, payments, waivers, fSession])

  const handleAddFine = useCallback(() => {
    if (!selectedStudent || !fineDesc || !fineAmount) return
    const amount = Number(fineAmount)
    if (amount <= 0) return
    setExtraRows((prev) => [...prev, {
      key: `fine-${Date.now()}`, feeName: fineDesc, feeNameBn: fineDescBn || fineDesc,
      dateRange: fSession, dateRangeBn: fSession, amount, discount: 0, remarks: '',
      receivable: amount, receive: amount, structureId: '', isOnetime: true,
    }])
    setFineDesc(''); setFineDescBn(''); setFineAmount(''); setShowFineModal(false)
  }, [selectedStudent, fineDesc, fineDescBn, fineAmount, fSession])

  return (
    <div className="flex flex-col h-full">
      {/* Top Filter Bar */}
      <div className="flex items-end gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'সেশন' : 'Session'}</label>
          <select value={fSession} onChange={(e) => { setFSession(e.target.value); setSelectedStudentId(null) }} className={`${selectCls} h-9 text-xs w-full`}>
            {(institution?.sessions || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'শ্রেণি' : 'Class'}</label>
          <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection(''); setSelectedStudentId(null) }} className={`${selectCls} h-9 text-xs w-full`}>
            <option value="">{bn ? 'সব শ্রেণি' : 'All'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'সেকশন' : 'Section'}</label>
          <select value={fSection} onChange={(e) => { setFSection(e.target.value); setSelectedStudentId(null) }} className={`${selectCls} h-9 text-xs w-full`}>
            <option value="">{bn ? 'সব সেকশন' : 'All'}</option>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'স্ট্যাটাস' : 'Status'}</label>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={`${selectCls} h-9 text-xs w-full`}>
            <option value="all">{bn ? 'সব' : 'All'}</option>
            <option value="active">{bn ? 'সক্রিয়' : 'Active'}</option>
            <option value="inactive">{bn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
          </select>
        </div>
      </div>

      {/* Student Profile */}
      <div className="flex items-end gap-4 mb-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="w-[5rem] h-[5.5rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden flex-shrink-0">
          {selectedStudent?.photo ? (
            <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><User size={24} className="text-[var(--text-muted)]" /></div>
          )}
        </div>

        <div className="flex-1 relative mr-2" ref={dropdownRef}>
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'শিক্ষার্থী' : 'Student'}</label>
          <div className="relative">
            <input ref={inputRef} type="text"
              value={isDropdownOpen ? studentSearch : (selectedStudent ? `${selectedStudent.nameEn} (${selectedStudent.id})` : '')}
              placeholder={bn ? 'নাম বা আইডি লিখুন...' : 'Type name or ID...'}
              onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudentId(null); setIsDropdownOpen(true); setHighlightedIndex(0) }}
              onFocus={() => { setIsDropdownOpen(true); setHighlightedIndex(0) }}
              onKeyDown={handleKeyDown}
              className={`${inputCls} h-9 text-xs w-full pr-8`}
            />
            {selectedStudent && !isDropdownOpen ? (
              <button onClick={() => { setSelectedStudentId(null); setStudentSearch('') }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--bg-secondary)] cursor-pointer border-0 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
            ) : (
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            )}
          </div>
          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-[12rem] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg">
              {dropdownStudents.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--text-muted)]">{bn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}</div>
              ) : dropdownStudents.map((s, i) => (
                <button key={s.id} data-index={i} onClick={() => selectStudent(s.id)} onMouseEnter={() => setHighlightedIndex(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left border-0 cursor-pointer transition-colors ${i === highlightedIndex ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                  {s.photo ? <img src={s.photo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0"><User size={12} className="text-[var(--text-muted)]" /></div>}
                  <div className="min-w-0"><p className="text-xs font-medium truncate">{s.nameEn} ({s.id})</p><p className="text-[0.6rem] text-[var(--text-muted)]">{s.class} - {s.section}</p></div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setFindDueTrigger((t) => t + 1)} disabled={!selectedStudentId}
          className="flex items-center gap-1.5 px-3 h-[2.05rem] rounded-lg bg-[var(--brand)] text-white text-xs font-medium border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
          <Search size={14} />{bn ? 'বকেয় খুঁজুন' : 'Find Due'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Fee Details Table */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-[var(--brand-light)] flex items-center justify-center"><span className="text-[0.65rem] font-bold text-[var(--brand)]">&#x20B9;</span></div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{bn ? 'ফি বিবরণ' : 'Fee Details'}</p>
          </div>

          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
              <div className="text-center"><User size={32} className="mx-auto mb-2 opacity-50" /><p>{bn ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select a student'}</p></div>
            </div>
          ) : findDueTrigger === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
              <div className="text-center"><Search size={32} className="mx-auto mb-2 opacity-50" /><p>{bn ? '"বকেয় খুঁজুন" বাটনে ক্লিক করুন' : 'Click "Find Due" to view dues'}</p></div>
            </div>
          ) : displayRows.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
              <p>{bn ? 'কোনো বকেয় নেই' : 'No dues found'}</p>
            </div>
          ) : (
            <>
              {/* Scrollable table */}
              <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '19%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[var(--bg-secondary)]">
                      <th className="px-2 py-2.5 text-center">
                        <input type="checkbox"
                          checked={displayRows.length > 0 && displayRows.every((r) => getRowEdit(r.key).checked)}
                          onChange={() => {
                            const allChecked = displayRows.every((r) => getRowEdit(r.key).checked)
                            const next: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}
                            for (const r of displayRows) {
                              const e = getRowEdit(r.key)
                              next[r.key] = { ...e, checked: !allChecked, receive: !allChecked ? r.receive : 0 }
                            }
                            setEditState((prev) => ({ ...prev, ...next }))
                          }}
                          className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--brand)]" />
                      </th>
                      <th className="text-center px-2 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'বিবরণ' : 'Particular'}</th>
                      <th className="text-center px-2 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                      <th className="text-center px-2 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'ছাড়' : 'Discount'}</th>
                      <th className="text-center px-2 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'মন্তব্য' : 'Remarks'}</th>
                      <th className="text-center px-2 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'প্রাপ্য' : 'Receivable'}</th>
                      <th className="text-center px-2 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'গ্রহণ' : 'Receive'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row, idx) => {
                      const edit = getRowEdit(row.key)
                      return (
                        <tr key={row.key} className={`border-t border-[var(--border)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]/30'} hover:bg-[var(--brand-light)]/20`}>
                          <td className="px-2 py-2.5 text-center">
                            <input type="checkbox" checked={edit.checked} onChange={(e) => updateRow(row.key, 'checked', e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--brand)]" />
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <p className="font-medium text-[var(--text-primary)]">{bn ? row.feeNameBn : row.feeName}</p>
                            <p className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{bn ? row.dateRangeBn : row.dateRange}</p>
                          </td>
                          <td className="px-2 py-2.5 text-center font-medium text-[var(--text-primary)]">{fmt(row.amount)}</td>
                          <td className="px-2 py-2.5 text-center">
                            <input type="number" value={edit.discount || ''} onChange={(e) => updateRow(row.key, 'discount', Number(e.target.value) || 0)}
                              className="w-full h-7 text-[0.7rem] text-center px-2 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20" placeholder="0" />
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <input type="text" value={edit.remarks} onChange={(e) => updateRow(row.key, 'remarks', e.target.value)}
                              className="w-full h-7 text-[0.7rem] text-center px-2 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20" placeholder={bn ? 'মন্তব্য...' : 'Remarks...'} />
                          </td>
                          <td className="px-2 py-2.5 text-center font-semibold text-[var(--text-primary)]">{fmt(row.receivable)}</td>
                          <td className="px-2 py-2.5 text-center">
                            <input type="number" value={edit.receive || ''} onChange={(e) => updateRow(row.key, 'receive', Number(e.target.value) || 0)}
                              className="w-full h-7 text-[0.7rem] text-center px-2 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)]/20" placeholder="0" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-secondary)]">
                      <td colSpan={2} className="px-2 py-2.5 text-center font-semibold text-[var(--text-secondary)]">{bn ? 'মোট' : 'Total'}</td>
                      <td className="px-2 py-2.5 text-center font-semibold text-[var(--text-primary)]">{fmt(displayRows.reduce((sum, r) => sum + r.amount, 0))}</td>
                      <td className="px-2 py-2.5 text-center font-semibold text-[var(--amber)]">{fmt(displayRows.reduce((sum, r) => sum + getRowEdit(r.key).discount, 0))}</td>
                      <td></td>
                      <td className="px-2 py-2.5 text-center font-bold text-[var(--text-primary)]">{fmt(totalReceivable)}</td>
                      <td className="px-2 py-2.5 text-center font-bold text-[var(--green)]">{fmt(totalReceive)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Action Bar */}
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-end gap-3">
                  <div>
                    <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'প্রাপ্তির তারিখ' : 'Received Date'} <span className="text-red-500">*</span></label>
                    <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className={`${inputCls} h-9 text-xs w-auto`} />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer mb-0.5">
                    <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--brand)]" />
                    {bn ? 'এসএমএস পাঠান' : 'Send SMS'}
                  </label>
                  <div className="ml-auto text-right">
                    <span className="text-xs text-[var(--text-muted)]">{bn ? 'মোট পরিমাণ :' : 'Total Amount :'}</span>
                    <span className="text-sm font-bold text-[var(--brand)] ml-2">{fmt(totalReceive)}</span>
                  </div>
                  <button onClick={handleReceiveFee} disabled={totalReceive <= 0}
                    className="flex items-center gap-1.5 px-5 h-9 rounded-lg bg-[var(--green)] text-white text-xs font-semibold border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                    <CheckCircle2 size={14} />{bn ? 'ফি প্রাপ্ত' : 'Receive Fee'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar */}
        {selectedStudent && displayRows.length > 0 && (
          <div className="w-[12rem] flex-shrink-0">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">{bn ? 'পুনরাবৃত্ত ফি' : 'Recurring Fee'}</p>
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
              <label className="block text-[0.6rem] text-[var(--text-muted)] mb-1">{bn ? 'ফি ধরন' : 'Fee Type'}</label>
              <select value={selectedFeeType} onChange={(e) => setSelectedFeeType(e.target.value)} className={`${selectCls} h-7 text-[0.7rem] w-full mb-3`}>
                <option value="">{bn ? 'সব ফি' : 'All Fees'}</option>
                {feeTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <label className="block text-[0.6rem] text-[var(--text-muted)] mb-1">{bn ? 'মাস সংখ্যা' : 'Month Count'}</label>
              <div className="flex items-center gap-1.5 mb-3">
                <input type="number" value={monthCount} onChange={(e) => setMonthCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} min={1} max={12}
                  className="w-12 h-7 text-[0.7rem] text-center px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]" />
                <div className="flex flex-col gap-px">
                  <button onClick={() => setMonthCount((c) => Math.min(12, c + 1))} className="w-5 h-3.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-primary)] text-[0.55rem] text-[var(--text-muted)] leading-none">&#9650;</button>
                  <button onClick={() => setMonthCount((c) => Math.max(1, c - 1))} className="w-5 h-3.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-primary)] text-[0.55rem] text-[var(--text-muted)] leading-none">&#9660;</button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setShowOneTimeModal(true)} className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg bg-[var(--brand)] text-white text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity border-0">
                  <Plus size={14} />{bn ? 'এককালীন ফি' : 'One-Time Fee'}
                </button>
                <button onClick={() => setShowFineModal(true)} className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors bg-transparent">
                  <Ban size={14} />{bn ? 'জরিমানা' : 'Add Fine'}
                </button>
                <button onClick={() => setShowHistoryModal(true)} className="w-full flex items-center justify-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors bg-transparent">
                  <History size={14} />{bn ? 'পেমেন্ট ইতিহাস' : 'History'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Today's Received Payments */}
      {selectedStudent && todayPayments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-[var(--green)]" />
            <p className="text-xs font-semibold text-[var(--text-secondary)]">{bn ? 'আজকের প্রাপ্ত পেমেন্ট' : "Today's Received Payments"} ({todayPayments.length})</p>
          </div>
          <div className="max-h-[10rem] overflow-y-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ফি' : 'Fee'}</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'তারিখ' : 'Date'}</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পদ্ধতি' : 'Method'}</th>
                </tr>
              </thead>
              <tbody>
                {todayPayments.map((p) => {
                  const struct = structures.find((s) => s.id === p.feeStructureId)
                  return (
                    <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]/50">
                      <td className="px-3 py-2 text-center text-[var(--text-primary)]">{struct ? (bn ? struct.nameBn : struct.name) : '-'}</td>
                      <td className="px-3 py-2 text-center text-[var(--text-muted)]">{p.paidAt}</td>
                      <td className="px-3 py-2 text-center font-semibold text-[var(--green)]">{fmt(p.amount)}</td>
                      <td className="px-3 py-2 text-center text-[var(--text-muted)]">{p.method}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* One-Time Fee Modal */}
      {showOneTimeModal && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={() => setShowOneTimeModal(false)}>
          <div className={`${modalStyleCls} w-[28rem] max-h-[80vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'এককালীন ফি যোগ করুন' : 'Add One-Time Fee'}</h3>
              <button onClick={() => setShowOneTimeModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer"><X size={14} /></button>
            </div>
            {oneTimeStructures.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">{bn ? 'কোনো এককালীন ফি পাওয়া যায়নি' : 'No one-time fees found'}</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {oneTimeStructures.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                      <input type="checkbox" checked={selectedOneTimeFees.has(s.id)}
                        onChange={(e) => { const next = new Set(selectedOneTimeFees); if (e.target.checked) next.add(s.id); else next.delete(s.id); setSelectedOneTimeFees(next) }}
                        className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--brand)]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)]">{bn ? s.nameBn : s.name}</p>
                        <p className="text-[0.6rem] text-[var(--text-muted)]">{s.descriptionBn || s.description}</p>
                      </div>
                      <span className="text-xs font-semibold text-[var(--brand)]">{fmt(s.amount)}</span>
                    </label>
                  ))}
                </div>
                <button onClick={handleAddOneTimeFees} disabled={selectedOneTimeFees.size === 0}
                  className="w-full py-2.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                  {bn ? 'যোগ করুন' : 'Add Selected'} ({selectedOneTimeFees.size})
                </button>
              </>
            )}
          </div>
        </div>, document.body
      )}

      {/* Fine Modal */}
      {showFineModal && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={() => setShowFineModal(false)}>
          <div className={`${modalStyleCls} w-[22rem]`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'জরিমানা যোগ করুন' : 'Add Fine'}</h3>
              <button onClick={() => setShowFineModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}</label>
                <input type="text" value={fineDesc} onChange={(e) => setFineDesc(e.target.value)} className={`${inputCls} h-9 text-xs w-full`} placeholder="e.g. Late Fee" />
              </div>
              <div>
                <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'বিবরণ (বাংলা)' : 'Description (Bangla)'}</label>
                <input type="text" value={fineDescBn} onChange={(e) => setFineDescBn(e.target.value)} className={`${inputCls} h-9 text-xs w-full`} placeholder="যেমন: বিলম্ব ফি" />
              </div>
              <div>
                <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'পরিমাণ' : 'Amount'} <span className="text-red-500">*</span></label>
                <input type="number" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} className={`${inputCls} h-9 text-xs w-full`} placeholder="0" min={0} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowFineModal(false)} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer">{bn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleAddFine} disabled={!fineDesc || !fineAmount || Number(fineAmount) <= 0}
                className="py-2 px-4 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                {bn ? 'যোগ করুন' : 'Add'}
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedStudent && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={() => setShowHistoryModal(false)}>
          <div className={`${modalStyleCls} w-[30rem] max-h-[80vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'পেমেন্ট ইতিহাস' : 'Payment History'}</h3>
              <button onClick={() => setShowHistoryModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer"><X size={14} /></button>
            </div>
            {studentPayments.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">{bn ? 'কোনো পেমেন্ট নেই' : 'No payments found'}</p>
            ) : (
              <div className="space-y-2">
                {studentPayments.map((p) => {
                  const struct = structures.find((s) => s.id === p.feeStructureId)
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--green-light)] flex items-center justify-center"><Receipt size={14} className="text-[var(--green)]" /></div>
                        <div>
                          <p className="text-xs font-medium text-[var(--text-primary)]">{struct ? (bn ? struct.nameBn : struct.name) : '-'}</p>
                          <p className="text-[0.6rem] text-[var(--text-muted)]">{p.paidAt} | {p.method}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[var(--green)]">{fmt(p.amount)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>, document.body
      )}
    </div>
  )
})
