import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { User, Search, ChevronDown, X, CheckCircle2, Plus, History, Ban, Receipt } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeDue, FeeStructure, FeePayment } from '@/store/feeStore'

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
  const totalMonths = (currentYearNum - year) * 12 + (currentMonthIdx - startMonth) + advanceMonths

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
        const paid = payments
          .filter((p) => { if (p.feeStructureId !== struct.id) return false; const d = new Date(p.paidAt); return d.getFullYear() === currentYear && d.getMonth() === monthIdx })
          .reduce((sum, p) => sum + p.amount, 0)
        const waived = waivers.filter((w) => w.feeStructureId === struct.id).reduce((sum, w) => sum + w.amount, 0)
        const receivable = struct.amount - paid - Math.min(waived, struct.amount)
        if (receivable <= 0) continue
        const startDate = `01 ${m.label} ${currentYear}`
        const endDate = `${m.days} ${m.label} ${currentYear}`
        const startDateBn = `০১ ${m.labelBn} ${currentYear}`
        const endDateBn = `${m.days} ${m.labelBn} ${currentYear}`
        rows.push({
          key: `${struct.id}-${currentYear}-${monthIdx}`, feeName: struct.name, feeNameBn: struct.nameBn,
          dateRange: `(${startDate} - ${endDate})`, dateRangeBn: `(${startDateBn} - ${endDateBn})`,
          amount: struct.amount, discount: 0, remarks: '', receivable, receive: receivable,
          structureId: struct.id, isOnetime: false,
        })
      }
    }
  }
  return rows
}

const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'
const fieldInputCls = 'w-full border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] bg-[var(--bg-primary)] outline-none transition-colors focus:border-[var(--brand)]'
const fieldSelectCls = `${fieldInputCls} appearance-auto`

export const CollectTab = React.memo(function CollectTab({ onCollect: _onCollect }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  const { structures, payments, waivers, addPayment } = useFeeStore()

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
      for (const row of monthRows) { if (!editState[row.key]) initial[row.key] = { discount: 0, remarks: '', receive: row.receive, checked: true }; else initial[row.key] = { ...editState[row.key] } }
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
    return payments.filter((p) => p.studentId === selectedStudent.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
  }, [payments, selectedStudent])

  const fmt = (n: number) => `\u09F3${Math.round(n).toLocaleString()}`

  const todayStr = new Date().toISOString().split('T')[0]
  const todayIncome = useMemo(() => payments.filter((p) => p.paidAt === todayStr).reduce((s, p) => s + p.amount, 0), [payments, todayStr])
  const todayDiscount = useMemo(() => {
    if (!selectedStudent) return 0
    return displayRows.filter((r) => getRowEdit(r.key).checked).reduce((s, r) => s + getRowEdit(r.key).discount, 0)
  }, [displayRows, getRowEdit, selectedStudent])
  const todayWaiver = useMemo(() => waivers.filter((w) => w.createdAt?.startsWith(todayStr)).reduce((s, w) => s + w.amount, 0), [waivers, todayStr])

  const generateReceipt = useCallback((paymentRows: { feeName: string; feeNameBn: string; dateRange: string; amount: number; discount: number; receive: number }[]) => {
    if (!selectedStudent || !institution) return
    const ta = paymentRows.reduce((s, r) => s + r.amount, 0)
    const td = paymentRows.reduce((s, r) => s + r.discount, 0)
    const tr = paymentRows.reduce((s, r) => s + r.receive, 0)
    const rn = `RCP-${Date.now().toString(36).toUpperCase()}`
    const ds = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const f = (n: number) => `\u09F3${n.toLocaleString()}`
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fee Receipt</title><style>@page{size:A4;margin:15mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}.receipt{width:100%;max-width:750px;margin:0 auto;page-break-after:always}.receipt:last-child{page-break-after:auto}.header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:15px}.logo{width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #1e3a5f}.school-info{flex:1;text-align:center}.school-name{font-size:16px;font-weight:700;color:#1e3a5f}.school-address{font-size:10px;color:#666;margin-top:2px}.copy-label{font-size:10px;color:#999;text-align:center;margin:5px 0}.title{text-align:center;font-size:14px;font-weight:700;color:#1e3a5f;margin:10px 0}.info-row{display:flex;justify-content:space-between;margin-bottom:3px}.info-label{font-weight:600;color:#333}.info-value{color:#555}table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10px}th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:center;font-weight:600}td{padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.totals{display:flex;justify-content:flex-end;margin-top:10px}.totals-table{width:280px}.totals-table td{padding:4px 8px;font-size:10px}.totals-table td:first-child{text-align:right;font-weight:600;color:#555}.totals-table td:last-child{text-align:right;font-weight:700;color:#1e3a5f}.totals-table tr:last-child td{border-top:2px solid #1e3a5f;font-size:12px;color:#1e3a5f}.signatures{display:flex;justify-content:space-between;margin-top:30px;padding-top:15px}.signature-box{text-align:center;width:150px}.signature-line{border-top:1px solid #333;margin-top:40px;padding-top:5px;font-size:10px;color:#666}.footer{text-align:center;font-size:9px;color:#999;margin-top:15px;padding-top:10px;border-top:1px dashed #ddd}.btn-row{text-align:center;margin:10px 0}.download-btn{display:inline-block;background:#16a34a;color:#fff;padding:8px 16px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:none}</style></head><body>${[0,1].map(ci=>{const cl=ci===0?'Admin Copy':'Student Copy';return`<div class="receipt"><div class="header"><img src="${institution.logo||''}" class="logo" alt="" onerror="this.style.display='none'"><div class="school-info"><div class="school-name">${institution.name||'School Name'}</div><div class="school-address">${institution.address||''} | ${institution.phone||''} | ${institution.email||''}</div></div></div><div class="copy-label">${cl}</div><div class="info-row"><div><div><span class="info-label">Student Name:</span> <span class="info-value">${bn?selectedStudent.nameBn:selectedStudent.nameEn}</span></div><div><span class="info-label">Student Id:</span> <span class="info-value">${selectedStudent.id}</span></div><div><span class="info-label">Roll No:</span> <span class="info-value">${selectedStudent.roll}</span></div><div><span class="info-label">Class:</span> <span class="info-value">${selectedStudent.class}</span></div><div><span class="info-label">Section:</span> <span class="info-value">${selectedStudent.section}</span></div></div><div style="text-align:right"><div><span class="info-label">Receipt No:</span> <span class="info-value">${rn}</span></div><div><span class="info-label">Date:</span> <span class="info-value">${ds}</span></div></div></div><div class="title">Fee Receipt</div><table><thead><tr><th style="text-align:left">Particulars</th><th>Actual Amount</th><th>Discount</th><th>Receivable</th><th>Received Amount</th></tr></thead><tbody>${paymentRows.map(r=>`<tr><td style="text-align:left">${bn?r.feeNameBn:r.feeName} ${r.dateRange?'('+r.dateRange+')':''}</td><td>${f(r.amount)}</td><td>${f(r.discount)}</td><td>${f(r.amount-r.discount)}</td><td>${f(r.receive)}</td></tr>`).join('')}</tbody></table><div class="totals"><table class="totals-table"><tr><td>Total Actual Amount:</td><td>${f(ta)}</td></tr><tr><td>Total Discount:</td><td>${f(td)}</td></tr><tr><td>Total Receivable:</td><td>${f(ta-td)}</td></tr><tr><td>Total Amount Received:</td><td>${f(tr)}</td></tr></table></div><div class="signatures"><div class="signature-box"><div class="signature-line">Principal's Signature</div></div><div class="signature-box"><div class="signature-line">Receiver's Signature</div></div></div><div class="footer">The amount once paid is nonrefundable.<br>Software developed and managed by: SMS EduTech</div></div>`}).join('')}<div class="btn-row"><button class="download-btn" onclick="window.print()">Download Receipt</button></div></body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (w) w.onload = () => w.print()
  }, [selectedStudent, institution, bn])

  const generateSingleReceipt = useCallback((payment: FeePayment) => {
    if (!selectedStudent || !institution) return
    const struct = structures.find((s) => s.id === payment.feeStructureId)
    const rn = `RCP-${Date.now().toString(36).toUpperCase()}`
    const f = (n: number) => `\u09F3${n.toLocaleString()}`
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fee Receipt</title><style>@page{size:A4;margin:15mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}.receipt{width:100%;max-width:750px;margin:0 auto;page-break-after:always}.receipt:last-child{page-break-after:auto}.header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:15px}.logo{width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #1e3a5f}.school-info{flex:1;text-align:center}.school-name{font-size:16px;font-weight:700;color:#1e3a5f}.school-address{font-size:10px;color:#666;margin-top:2px}.copy-label{font-size:10px;color:#999;text-align:center;margin:5px 0}.title{text-align:center;font-size:14px;font-weight:700;color:#1e3a5f;margin:10px 0}.info-row{display:flex;justify-content:space-between;margin-bottom:3px}.info-label{font-weight:600;color:#333}.info-value{color:#555}table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10px}th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:center;font-weight:600}td{padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.totals{display:flex;justify-content:flex-end;margin-top:10px}.totals-table{width:280px}.totals-table td{padding:4px 8px;font-size:10px}.totals-table td:first-child{text-align:right;font-weight:600;color:#555}.totals-table td:last-child{text-align:right;font-weight:700;color:#1e3a5f}.totals-table tr:last-child td{border-top:2px solid #1e3a5f;font-size:12px;color:#1e3a5f}.signatures{display:flex;justify-content:space-between;margin-top:30px;padding-top:15px}.signature-box{text-align:center;width:150px}.signature-line{border-top:1px solid #333;margin-top:40px;padding-top:5px;font-size:10px;color:#666}.footer{text-align:center;font-size:9px;color:#999;margin-top:15px;padding-top:10px;border-top:1px dashed #ddd}</style></head><body><div class="receipt"><div class="header">${institution.logo ? `<img src="${institution.logo}" class="logo" />` : '<div class="logo" style="font-size:24px;font-weight:700;color:#1e3a5f;display:flex;align-items:center;justify-content:center">🏫</div>'}<div class="school-info"><div class="school-name">${institution.nameBn || institution.name}</div><div class="school-address">${institution.addressBn || institution.address || ''}${institution.phone ? ` | ${institution.phone}` : ''}</div></div></div><div class="copy-label">--- Admin Copy ---</div><div class="title">Fee Receipt</div><div class="info-row"><span class="info-label">Receipt No:</span><span class="info-value">${rn}</span></div><div class="info-row"><span class="info-label">Student:</span><span class="info-value">${selectedStudent.nameEn} (${selectedStudent.id})</span></div><div class="info-row"><span class="info-label">Class:</span><span class="info-value">${selectedStudent.class}${selectedStudent.section ? ' - ' + selectedStudent.section : ''}</span></div><div class="info-row"><span class="info-label">Date:</span><span class="info-value">${payment.paidAt}</span></div><table><thead><tr><th>Fee</th><th>Amount</th><th>Method</th><th>Note</th></tr></thead><tbody><tr><td>${struct ? (bn ? struct.nameBn : struct.name) : '-'}</td><td>${f(payment.amount)}</td><td>${payment.method}</td><td>${payment.note || '-'}</td></tr></tbody></table><div class="totals"><table class="totals-table"><tr><td>Total:</td><td>${f(payment.amount)}</td></tr><tr><td colspan="2" style="text-align:center;font-size:9px;color:#999">(${bn ? 'কথায়' : 'In words'}: ${bn ? 'টাকা' : 'Taka'} ${Math.round(payment.amount).toLocaleString()} ${bn ? 'মাত্র' : 'only'})</td></tr></table></div><div class="signatures"><div class="signature-box"><div class="signature-line">${bn ? 'অভিভাবকের স্বাক্ষর' : "Guardian's Signature"}</div></div><div class="signature-box"><div class="signature-line">${bn ? 'হিসাবরক্ষকের স্বাক্ষর' : "Accountant's Signature"}</div></div><div class="signature-box"><div class="signature-line">${bn ? 'প্রধান শিক্ষকের স্বাক্ষর' : "Headmaster's Signature"}</div></div></div><div class="footer">${institution.nameBn || institution.name}${institution.eiin ? ` | EIIN: ${institution.eiin}` : ''}${institution.phone ? ` | ${institution.phone}` : ''}</div></div></body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (w) w.onload = () => w.print()
  }, [selectedStudent, institution, bn, structures])

  const handleReceiveFee = useCallback(() => {
    if (!selectedStudent || totalReceive <= 0) return
    const checkedRows = displayRows.filter((r) => getRowEdit(r.key).checked && getRowEdit(r.key).receive > 0)
    if (checkedRows.length === 0) return
    const receiptRows: { feeName: string; feeNameBn: string; dateRange: string; amount: number; discount: number; receive: number }[] = []
    for (const row of checkedRows) {
      const edit = getRowEdit(row.key)
      const payment: FeePayment = { id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, studentId: selectedStudent.id, feeStructureId: row.structureId, amount: edit.receive, paidAt: receivedDate, method: 'cash', reference: '', note: edit.remarks, collectedBy: 'admin', createdAt: new Date().toISOString() }
      addPayment(payment)
      receiptRows.push({ feeName: row.feeName, feeNameBn: row.feeNameBn, dateRange: row.dateRange, amount: row.amount, discount: edit.discount, receive: edit.receive })
    }
    generateReceipt(receiptRows); setExtraRows([]); setEditState({}); setFindDueTrigger((t) => t + 1)
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
    const newEditState: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}
    for (const struct of oneTimeStructures) {
      if (!selectedOneTimeFees.has(struct.id)) continue
      const paid = payments.filter((p) => p.studentId === selectedStudent.id && p.feeStructureId === struct.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.studentId === selectedStudent.id && w.feeStructureId === struct.id).reduce((sum, w) => sum + w.amount, 0)
      const receivable = struct.amount - paid - waived
      if (receivable <= 0) continue
      const key = `${struct.id}-onetime-manual-${Date.now()}`
      newRows.push({ key, feeName: struct.name, feeNameBn: struct.nameBn, dateRange: fSession, dateRangeBn: fSession, amount: struct.amount, discount: 0, remarks: '', receivable, receive: receivable, structureId: struct.id, isOnetime: true })
      newEditState[key] = { discount: 0, remarks: '', receive: receivable, checked: true }
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
    setEditState((prev) => ({ ...prev, [key]: { discount: 0, remarks: '', receive: amount, checked: true } }))
    setFineDesc(''); setFineDescBn(''); setFineAmount(''); setShowFineModal(false)
  }, [selectedStudent, fineDesc, fineDescBn, fineAmount, fSession])

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
            <div className="font-mono font-extrabold text-[15px] tracking-wide text-[var(--green)]">{fmt(todayIncome)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-[14px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--amber-light)] text-[var(--amber)] flex items-center justify-center flex-shrink-0">
            <Ban size={18} />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">{bn ? 'আজকের ছাড়' : "Today's discount"}</div>
            <div className="font-mono font-extrabold text-[15px] tracking-wide text-[var(--amber)]">{fmt(todayDiscount)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-[14px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase font-semibold">{bn ? 'আজকের মওকুফ' : "Today's waiver"}</div>
            <div className="font-mono font-extrabold text-[15px] tracking-wide text-[var(--brand)]">{fmt(todayWaiver)}</div>
          </div>
        </div>
      </div>

      {/* Student + Filters Row */}
      <div className="grid grid-cols-[1fr_auto] gap-[14px] items-stretch">
        {/* Student Card */}
        <div className="p-[14px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="flex gap-[14px]">
            {/* Photo */}
            <div className="w-[80px] h-[96px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex-shrink-0 overflow-hidden flex items-center justify-center">
              {selectedStudent?.photo ? <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" /> : <User size={28} className="text-[var(--text-muted)]" />}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {selectedStudent ? (
                <>
                  <div>
                    <div className="text-[14px] font-bold text-[var(--text-primary)] truncate">{selectedStudent.nameEn}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{selectedStudent.class}{selectedStudent.section ? ` - ${selectedStudent.section}` : ''} &middot; {selectedStudent.id}</div>
                  </div>
                  <div className="text-[10.5px] text-[var(--text-muted)] space-y-0.5">
                    {selectedStudent.fatherNameEn && <div><span className="font-semibold">{bn ? 'বাবা:' : 'Father:'}</span> {selectedStudent.fatherNameEn}</div>}
                    {selectedStudent.motherNameEn && <div><span className="font-semibold">{bn ? 'মা:' : 'Mother:'}</span> {selectedStudent.motherNameEn}</div>}
                    {selectedStudent.phone && <div><span className="font-semibold">{bn ? 'ফোন:' : 'Phone:'}</span> {selectedStudent.phone}</div>}
                  </div>
                </>
              ) : (
                <div className="text-[12px] text-[var(--text-muted)]">{bn ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select a student'}</div>
              )}
            </div>
          </div>
          {/* Search + Find Due */}
          <div className="flex items-center gap-[10px] mt-[12px]">
            <div className="flex-1 relative" ref={dropdownRef}>
              <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              <input ref={inputRef} type="text"
                value={isDropdownOpen ? studentSearch : (selectedStudent ? `${selectedStudent.nameEn} (${selectedStudent.id})` : '')}
                placeholder={bn ? 'নাম বা আইডি লিখুন...' : 'Type name or admission ID...'}
                onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudentId(null); setIsDropdownOpen(true); setHighlightedIndex(0) }}
                onFocus={() => { setIsDropdownOpen(true); setHighlightedIndex(0) }}
                onKeyDown={handleKeyDown}
                className={`${fieldInputCls} h-9 pl-[32px] pr-8 text-[12px]`}
              />
              {selectedStudent && !isDropdownOpen ? (
                <button onClick={() => { setSelectedStudentId(null); setStudentSearch('') }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--bg-secondary)] cursor-pointer border-0 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={13} /></button>
              ) : (
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              )}
              {isDropdownOpen && (
                <div className="absolute z-50 mt-[6px] w-full max-h-[260px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_12px_30px_rgba(20,23,33,0.12)]">
                  {dropdownStudents.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-[var(--text-muted)]">{bn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}</div>
                  ) : dropdownStudents.map((s, i) => (
                    <button key={s.id} data-index={i} onClick={() => selectStudent(s.id)} onMouseEnter={() => setHighlightedIndex(i)}
                      className={`w-full flex items-center gap-[10px] px-[13px] py-[9px] text-left border-0 border-b border-[var(--border)] last:border-b-0 cursor-pointer transition-colors ${i === highlightedIndex ? 'bg-[var(--brand-light)]' : 'bg-transparent hover:bg-[var(--brand-light)]'}`}>
                      <div className="w-[28px] h-[28px] rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center text-[10.5px] font-bold flex-shrink-0 overflow-hidden">
                        {s.photo ? <img src={s.photo} alt="" className="w-full h-full object-cover" /> : initials(s.nameEn)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[var(--text-primary)]">{s.nameEn}</p>
                        <p className="text-[10.5px] text-[var(--text-muted)]">{s.class} &middot; {s.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setFindDueTrigger((t) => t + 1)} disabled={!selectedStudentId}
              className="h-9 px-4 rounded-lg bg-[var(--brand)] text-white font-bold text-[12px] border-0 cursor-pointer flex items-center gap-[6px] flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
              <Search size={13} />{bn ? 'বকেয়' : 'Find due'}
            </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="p-[14px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] w-[420px] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-[10px]">
            <div className="w-5 h-5 rounded bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold">&#x2699;</span>
            </div>
            <span className="font-bold text-[12px] text-[var(--text-primary)]">{bn ? 'ফিল্টার' : 'Filters'}</span>
          </div>
          <div className="grid grid-cols-2 gap-[10px]">
            <div><label className={labelCls}>{bn ? 'সেশন' : 'Session'}</label>
              <select value={fSession} onChange={(e) => { setFSession(e.target.value); setSelectedStudentId(null) }} className={`${fieldSelectCls} h-9 text-[12px]`}>
                {(institution?.sessions || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className={labelCls}>{bn ? 'স্ট্যাটাস' : 'Status'}</label>
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={`${fieldSelectCls} h-9 text-[12px]`}>
                <option value="all">{bn ? 'সব' : 'All'}</option>
                <option value="active">{bn ? 'সক্রিয়' : 'Active'}</option>
                <option value="inactive">{bn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
              </select></div>
            <div><label className={labelCls}>{bn ? 'শ্রেণি' : 'Class'}</label>
              <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection(''); setSelectedStudentId(null) }} className={`${fieldSelectCls} h-9 text-[12px]`}>
                <option value="">{bn ? 'সব' : 'All'}</option>
                {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className={labelCls}>{bn ? 'সেকশন' : 'Section'}</label>
              <select value={fSection} onChange={(e) => { setFSection(e.target.value); setSelectedStudentId(null) }} className={`${fieldSelectCls} h-9 text-[12px]`}>
                <option value="">{bn ? 'সব' : 'All'}</option>
                {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-[1fr_220px] gap-4 items-start max-lg:grid-cols-1">
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
          {!selectedStudent ? (
            <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] ">
              <div className="text-center"><User size={32} className="mx-auto mb-2 opacity-50" /><p>{bn ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select a student to view fee details'}</p></div>
            </div>
          ) : findDueTrigger === 0 ? (
            <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] ">
              <div className="text-center"><Search size={32} className="mx-auto mb-2 opacity-50" /><p>{bn ? '"বকেয় খুঁজুন" বাটনে ক্লিক করুন' : 'Click "Find due" to view dues'}</p></div>
            </div>
          ) : displayRows.length === 0 ? (
            <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] ">
              <p>{bn ? 'কোনো বকেয় নেই' : 'No dues found'}</p>
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-xl overflow-hidden max-h-[360px] overflow-y-auto bg-[var(--bg-primary)]">
              <table className="w-full text-[12.5px]" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '32px' }} />
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-[var(--bg-secondary)]">
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)]">
                      <input type="checkbox" checked={displayRows.length > 0 && displayRows.every((r) => getRowEdit(r.key).checked)}
                        onChange={() => { const ac = displayRows.every((r) => getRowEdit(r.key).checked); const next: Record<string, { discount: number; remarks: string; receive: number; checked: boolean }> = {}; for (const r of displayRows) { const e = getRowEdit(r.key); next[r.key] = { ...e, checked: !ac, receive: !ac ? r.receive : 0 } }; setEditState((prev) => ({ ...prev, ...next })) }}
                        className="w-[14px] h-[14px] accent-[var(--brand)]" />
                    </th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)]">{bn ? 'বিবরণ' : 'Particular'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)]">{bn ? 'ছাড়' : 'Discount'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)]">{bn ? 'মন্তব্য' : 'Remarks'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)]">{bn ? 'প্রাপ্য' : 'Receivable'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)]">{bn ? 'গ্রহণ' : 'Receive'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
                    const edit = getRowEdit(row.key)
                    return (
                      <tr key={row.key} className={`transition-colors border-t border-[var(--border)] hover:bg-[var(--brand-light)]/40 ${!edit.checked ? 'opacity-45' : ''}`}>
                        <td className="text-center px-2 py-2">
                          <input type="checkbox" checked={edit.checked} onChange={(e) => updateRow(row.key, 'checked', e.target.checked)} className="w-3.5 h-3.5 accent-[var(--brand)]" />
                        </td>
                        <td className="text-center px-2 py-2">
                          <span className="font-semibold text-[var(--text-primary)] text-[12px]">{bn ? row.feeNameBn : row.feeName}</span>
                          {row.isOnetime && <span className="ml-1 inline-block text-[9px] font-bold uppercase bg-[var(--amber-light)] text-[var(--amber)] px-1 py-px rounded">One-time</span>}
                          <div className="text-[10px] text-[var(--text-muted)]">{bn ? row.dateRangeBn : row.dateRange}</div>
                        </td>
                        <td className="text-center px-2 py-2"><span className="font-mono font-semibold text-[var(--text-primary)] text-[12px] tracking-wide">{fmt(row.amount)}</span></td>
                        <td className="text-center px-2 py-2">
                          <input type="number" value={edit.discount || ''} onChange={(e) => updateRow(row.key, 'discount', Number(e.target.value) || 0)}
                            className="h-6 w-full text-[11px] text-center px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" placeholder="0" />
                        </td>
                        <td className="text-center px-2 py-2">
                          <input type="text" value={edit.remarks} onChange={(e) => updateRow(row.key, 'remarks', e.target.value)}
                            className="h-6 w-full text-[11px] text-center px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" placeholder={bn ? '...' : '...'} />
                        </td>
                        <td className="text-center px-2 py-2"><span className="font-mono font-semibold text-[var(--text-primary)] tracking-wide">{fmt(row.receivable)}</span></td>
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
                <span className="font-mono font-semibold text-sm tracking-wide text-[var(--text-primary)]">{fmt(totalAmount)}</span>
              </div>
              <div className="w-px h-4 bg-[var(--border)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">{bn ? 'ছাড়:' : 'Discount:'}</span>
                <span className="font-mono font-semibold text-sm tracking-wide text-[var(--amber)]">{fmt(totalDiscount)}</span>
              </div>
              <div className="w-px h-4 bg-[var(--border)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">{bn ? 'প্রাপ্য:' : 'Receivable:'}</span>
                <span className="font-mono font-bold text-sm tracking-wide text-[var(--green)]">{fmt(totalReceivable)}</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-[var(--brand-light)] rounded-lg px-3 py-1.5">
                <span className="text-[11px] text-[var(--brand)] font-semibold">{bn ? 'গ্রহণ:' : 'Receiving:'}</span>
                <span className="font-mono font-extrabold text-base tracking-wide text-[var(--brand)]">{fmt(totalReceive)}</span>
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
                  <span className="font-mono font-bold text-sm tracking-wide text-[var(--green)]">{fmt(totalReceivable)}</span>
                </div>
                <button onClick={handleReceiveFee} disabled={totalReceive <= 0}
                  className="h-9 px-5 rounded-lg bg-[var(--brand)] text-white font-semibold text-[13px] border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                  <CheckCircle2 size={15} />{bn ? 'প্রাপ্ত' : 'Receive'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar */}
        {selectedStudent && displayRows.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-[11px]">
              <div className="w-6 h-6 rounded-md bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0"><Receipt size={13} /></div>
              <span className="font-bold text-[13.5px] text-[var(--text-primary)]">{bn ? 'পুনরাবৃত্ত ফি' : 'Recurring fee'}</span>
            </div>
            <div className="p-[14px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]  space-y-3">
              <div><label className={labelCls}>{bn ? 'ফি ধরন' : 'Fee type'}</label>
                <select value={selectedFeeType} onChange={(e) => setSelectedFeeType(e.target.value)} className={fieldSelectCls}>
                  <option value="">{bn ? 'সব ফি' : 'All fees'}</option>
                  {feeTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label className={labelCls}>{bn ? 'অগ্রিম মাস' : 'Advance months'}</label>
                <div className="flex items-center gap-[7px]">
                  <input type="number" value={monthCount} onChange={(e) => setMonthCount(Math.max(0, Math.min(12, Number(e.target.value) || 0)))} min={0} max={12}
                    className="w-[54px] h-[30px] text-[13px] text-center px-[8px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[var(--brand)]/10" />
                  <div className="flex flex-col gap-[2px]">
                    <button onClick={() => setMonthCount((c) => Math.min(12, c + 1))} className="w-5 h-[14px] rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[8px] text-[var(--text-muted)] leading-none hover:bg-[var(--bg-primary)]">&#9650;</button>
                    <button onClick={() => setMonthCount((c) => Math.max(0, c - 1))} className="w-5 h-[14px] rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[8px] text-[var(--text-muted)] leading-none hover:bg-[var(--bg-primary)]">&#9660;</button>
                  </div>
                </div></div>
              <button onClick={() => setShowOneTimeModal(true)}
                className="w-full flex items-center justify-center gap-[7px] h-[36px] rounded-lg bg-[var(--brand)] text-white text-[12.5px] font-semibold border-0 cursor-pointer hover:opacity-90 transition-opacity">
                <Plus size={14} />{bn ? 'এককালীন ফি' : 'One-time fee'}
              </button>
              <button onClick={() => setShowFineModal(true)}
                className="w-full flex items-center justify-center gap-[7px] h-[36px] rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-[12.5px] font-semibold cursor-pointer bg-transparent hover:bg-[var(--bg-secondary)] transition-colors">
                <Ban size={14} />{bn ? 'জরিমানা' : 'Add fine'}
              </button>
              <button onClick={() => setShowHistoryModal(true)}
                className="w-full flex items-center justify-center gap-[7px] h-[36px] rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-[12.5px] font-semibold cursor-pointer bg-transparent hover:bg-[var(--bg-secondary)] transition-colors">
                <History size={14} />{bn ? 'পেমেন্ট ইতিহাস' : 'Payment history'}
              </button>
            </div>
          </div>
        )}
      </div>

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
                      <div className="font-mono font-bold text-[var(--brand)] text-[12.5px]">{fmt(s.amount)}</div>
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
          <div className="bg-[var(--bg-primary)] rounded-xl w-[90vw] max-h-[85vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">{bn ? 'পেমেন্ট ইতিহাস' : 'Payment history'}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{selectedStudent.nameEn} ({selectedStudent.id})</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)]"><X size={14} /></button>
            </div>
            {studentPayments.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">{bn ? 'কোনো পেমেন্ট নেই' : 'No payments found'}</p>
            ) : (
              <table className="w-full text-[12px]" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-[var(--bg-secondary)]">
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">#</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ফি' : 'Fee'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'মাস' : 'Month'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পেমেন্ট তারিখ' : 'Payment date'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পদ্ধতি' : 'Method'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'রসিদ' : 'Receipt'}</th>
                  </tr>
                </thead>
                <tbody>
                  {studentPayments.map((p, idx) => {
                    const struct = structures.find((s) => s.id === p.feeStructureId)
                    const note = p.note || '-'
                    return (
                      <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--brand-light)]/40">
                        <td className="text-center px-2 py-2 text-[var(--text-muted)]">{idx + 1}</td>
                        <td className="text-center px-2 py-2"><span className="font-semibold text-[var(--text-primary)]">{struct ? (bn ? struct.nameBn : struct.name) : (p.feeStructureId ? p.feeStructureId.slice(0, 8) : '-')}</span></td>
                        <td className="text-center px-2 py-2 text-[var(--text-muted)]">{p.reference || '-'}</td>
                        <td className="text-center px-2 py-2 text-[var(--text-muted)]">{p.paidAt}</td>
                        <td className="text-center px-2 py-2"><span className="inline-block px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] font-medium">{p.method}</span></td>
                        <td className="text-center px-2 py-2"><span className="font-mono font-bold text-[var(--brand)] tracking-wide">{fmt(p.amount)}</span></td>
                        <td className="text-center px-2 py-2">
                          {note !== '-' && <span className="text-[10px] text-[var(--text-muted)] block mb-1 truncate" title={note}>{note}</span>}
                          <button onClick={() => generateSingleReceipt(p)} className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-[var(--brand-light)] text-[var(--brand)] text-[10.5px] font-semibold border-0 cursor-pointer hover:bg-[var(--brand)]/20 transition-colors">
                            <Receipt size={11} />{bn ? 'ডাউনলোড' : 'Download'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>, document.body
      )}
    </div>
  )
})
