import { useState, useMemo, useCallback } from 'react'
import React from 'react'
import { Search, Trash2, Eye, DollarSign, Calendar, CreditCard, FileSpreadsheet, FileText, MoreVertical, Printer, ChevronDown, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useFeeStore, formatReceiptNo, parseReceiptNumber } from '@/store/feeStore'
import type { FeePayment, FeeDue } from '@/store/feeStore'
import { useStoreStore } from '@/store/storeStore'
import { XLSX } from '@/lib/excelExport'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { PaymentDetailsModal } from '../modals/PaymentDetailsModal'

const selectCls = 'h-[2.125rem] text-[0.75rem] px-[0.625rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium outline-none focus:border-[var(--brand)] cursor-pointer transition-colors'

interface PaymentBatch {
  batchKey: string
  payments: FeePayment[]
  studentId: string
  studentName: string
  studentNameBn: string
  class: string
  section: string
  paidAt: string
  method: string
  totalAmount: number
  totalDiscount: number
  receiptNo: string
  collectedBy: string
}

interface Props {
  onViewReceipt?: (batch: PaymentBatch) => void
  onCollect?: (due: FeeDue) => void
}

function stripCatPrefix(note: string): string {
  const m = note.match(/^\[cat:(.+?)\|catbn:(.+?)\]\s*/)
  return m ? note.slice(m[0].length) : note
}

export const PaymentsTab = React.memo(function PaymentsTab({ onViewReceipt: _onViewReceipt, onCollect }: Props = {}) {
  const bn = useBn()
  const { canDelete, canExport } = usePermission()
  const allAdmissionStudents = useAdmissionStore((s) => s.students)
  const institution = useClassStore((s) => s.institution)
  const payments = useFeeStore((s) => s.payments)
  const structures = useFeeStore((s) => s.structures)
  const deletePayment = useFeeStore((s) => s.deletePayment)
  const storeProducts = useStoreStore((s) => s.products)
  const storeCategories = useStoreStore((s) => s.categories)
  const [search, setSearch] = useState('')
  const [fMethod, setFMethod] = useState('')
  const [fCollector, setFCollector] = useState('')
  const [fSession, setFSession] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectedBatchForDetails, setSelectedBatchForDetails] = useState<PaymentBatch | null>(null)
  const [batchToDelete, setBatchToDelete] = useState<PaymentBatch | null>(null)

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

  const studentMap = useMemo(() => {
    const map: Record<string, { nameEn: string; nameBn: string; class: string; section: string; roll?: string; photo?: string; academicYear?: string }> = {}
    allAdmissionStudents.forEach((s) => {
      map[s.id] = {
        nameEn: s.nameEn,
        nameBn: s.nameBn,
        class: s.class,
        section: s.section || '',
        roll: s.roll || '',
        photo: s.photo || '',
        academicYear: s.academicYear || '',
      }
    })
    return map
  }, [allAdmissionStudents])

  const storeCategoryMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string }> = {}
    storeCategories.forEach((c) => { map[c.id] = { name: c.name, nameBn: c.nameBn } })
    return map
  }, [storeCategories])

  const structureMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string; type: string }> = {}
    structures.forEach((s) => { map[s.id] = { name: s.name, nameBn: s.nameBn, type: s.type } })
    // Add special entry for shop/store items (empty feeStructureId)
    map['__shop__'] = { name: bn ? 'দোকান' : 'Store', nameBn: 'দোকান', type: 'shop' }
    return map
  }, [structures, bn])

  const batches = useMemo(() => {
    let list = [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt) || b.createdAt.localeCompare(a.createdAt))
    if (fSession) {
      list = list.filter((p) => {
        const sn = studentMap[p.studentId]
        const st = p.feeStructureId ? structures.find((s) => s.id === p.feeStructureId) : null
        return (sn?.academicYear === fSession) || (st?.academicYear === fSession) || (!sn?.academicYear && !st?.academicYear)
      })
    }
    if (fMethod) list = list.filter((p) => p.method === fMethod)
    if (fCollector) list = list.filter((p) => p.collectedBy === fCollector)
    if (dateFrom) {
      list = list.filter((p) => {
        const d = p.paidAt.includes('T') ? p.paidAt.split('T')[0] : p.paidAt
        return d >= dateFrom
      })
    }
    if (dateTo) {
      list = list.filter((p) => {
        const d = p.paidAt.includes('T') ? p.paidAt.split('T')[0] : p.paidAt
        return d <= dateTo
      })
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => {
        const sn = studentMap[p.studentId]
        const fn = structureMap[p.feeStructureId]
        return (sn?.nameEn.toLowerCase().includes(q) || sn?.nameBn.includes(q) || fn?.name.toLowerCase().includes(q) || p.note.toLowerCase().includes(q) || (p.receiptNo && p.receiptNo.toLowerCase().includes(q)))
      })
    }
    const grouped = new Map<string, FeePayment[]>()
    for (const p of list) {
      const key = p.receiptNo ? `rcp_${p.receiptNo}` : (p.batchId || `${p.studentId}__${p.paidAt}__${p.method}`)
      const group = grouped.get(key) || []
      group.push(p)
      grouped.set(key, group)
    }
    let result: PaymentBatch[] = Array.from(grouped.entries()).map(([key, group], idx) => {
      const first = group[0]
      const sn = studentMap[first.studentId]
      const rawDate = first.paidAt.includes('T') ? first.paidAt.split('T')[0] : first.paidAt
      const receiptNo = first.receiptNo || (first.batchId && parseReceiptNumber(first.batchId) ? formatReceiptNo(parseReceiptNumber(first.batchId)!) : formatReceiptNo(idx + 1))
      return {
        batchKey: key,
        payments: group,
        studentId: first.studentId,
        studentName: sn?.nameEn || '',
        studentNameBn: sn?.nameBn || '',
        class: sn?.class || '',
        section: sn?.section || '',
        paidAt: rawDate,
        method: first.method,
        totalAmount: group.reduce((s, p) => s + p.amount, 0),
        totalDiscount: group.reduce((s, p) => s + (p.discount || 0), 0),
        receiptNo,
        collectedBy: first.collectedBy || '',
      }
    })
    result.sort((a, b) => {
      if (sortBy === 'amount-desc') return b.totalAmount - a.totalAmount
      if (sortBy === 'amount-asc') return a.totalAmount - b.totalAmount
      if (sortBy === 'date-asc') return a.paidAt.localeCompare(b.paidAt)
      return b.paidAt.localeCompare(a.paidAt)
    })
    return result
  }, [payments, search, fMethod, fCollector, fSession, dateFrom, dateTo, sortBy, studentMap, structureMap, structures])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const monthStart = useMemo(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }, [])

  const { totalCollected, totalDiscount, todayCollected } = useMemo(() => {
    let collected = 0
    let discount = 0
    let today = 0
    for (let i = 0; i < batches.length; i++) {
      const b = batches[i]
      collected += b.totalAmount
      discount += b.totalDiscount
      if (b.paidAt.startsWith(todayStr)) {
        today += b.totalAmount
      }
    }
    return { totalCollected: collected, totalDiscount: discount, todayCollected: today }
  }, [batches, todayStr])


  const fmt = (n: number) => n.toLocaleString()

  const methodLabel = (m: string) => m === 'cash' ? (bn ? 'নগদ' : 'Cash') : m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') : m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') : (bn ? 'অন্যান্য' : 'Other')

  const methodColor = (m: string) => m === 'cash' ? 'var(--green)' : m === 'bank' ? 'var(--brand)' : m === 'mobile' ? 'var(--teal)' : 'var(--text-muted)'

  const uniqueCollectors = useMemo(() => {
    const set = new Set(payments.map((p) => p.collectedBy).filter(Boolean))
    return Array.from(set).sort()
  }, [payments])

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
      if (prev.size === batches.length) return new Set()
      return new Set(batches.map((b) => b.batchKey))
    })
  }, [batches])

  const selectedBatches = useMemo(() => batches.filter((b) => selectedRows.has(b.batchKey)), [batches, selectedRows])
  const hasSelection = selectedRows.size > 0

  const pdfColumns = useMemo<PDFColumnDef[]>(() => [
    { key: 'date', label: 'Date', labelBn: 'তারিখ', default: true },
    { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', default: true },
    { key: 'receipt', label: 'Receipt No', labelBn: 'রসিদ নং', default: true },
    { key: 'fees', label: 'Fees Paid', labelBn: 'পরিশোধিত ফি', default: true },
    { key: 'amount', label: 'Amount', labelBn: 'পরিমাণ', default: true },
    { key: 'discount', label: 'Discount', labelBn: 'ছাড়', default: true },
    { key: 'method', label: 'Method', labelBn: 'পদ্ধতি', default: true },
    { key: 'collectedBy', label: 'Receipted By', labelBn: 'সংগ্রাহক', default: true },
  ], [])

  const buildPdfRow = useCallback((b: PaymentBatch, selectedCols: string[]): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (selectedCols.includes('date')) row[bn ? 'তারিখ' : 'Date'] = b.paidAt
    if (selectedCols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? (b.studentNameBn || b.studentName) : b.studentName
    if (selectedCols.includes('receipt')) row[bn ? 'রসিদ নং' : 'Receipt No'] = b.receiptNo
    if (selectedCols.includes('fees')) {
      const feeNames = b.payments.map((p) => {
        if (!p.feeStructureId && p.note) {
          const catMatch = p.note.match(/^\[cat:(.+?)\|catbn:(.+?)\]\s*/)
          if (catMatch) {
            const rest = p.note.slice(catMatch[0].length)
            const di = rest.indexOf(' — ')
            const pn = di > 0 ? rest.substring(0, di).trim() : rest.trim()
            return bn ? `${catMatch[2]} - ${pn}` : `${catMatch[1]} - ${pn}`
          }
          const dashIdx = p.note.indexOf(' — ')
          const productName = dashIdx > 0 ? p.note.substring(0, dashIdx).trim() : p.note.split(',')[0].trim()
          const product = storeProducts.find((pp) => pp.name === productName || pp.nameBn === productName)
          if (product) {
            const cat = storeCategoryMap[product.categoryId]
            if (cat) return bn ? `${cat.nameBn} - ${product.nameBn}` : `${cat.name} - ${product.name}`
            return bn ? product.nameBn : product.name
          }
        }
        const fn = structureMap[p.feeStructureId] || structureMap['__shop__']
        return bn ? (fn?.nameBn || fn?.name || '') : (fn?.name || '')
      }).join(', ')
      row[bn ? 'পরিশোধিত ফি' : 'Fees Paid'] = feeNames
    }
    if (selectedCols.includes('amount')) row[bn ? 'পরিমাণ' : 'Amount'] = b.totalAmount
    if (selectedCols.includes('discount')) row[bn ? 'ছাড়' : 'Discount'] = b.totalDiscount
    if (selectedCols.includes('method')) row[bn ? 'পদ্ধতি' : 'Method'] = methodLabel(b.method)
    if (selectedCols.includes('collectedBy')) row[bn ? 'সংগ্রাহক' : 'Receipted By'] = b.collectedBy || '—'
    return row
  }, [bn, structureMap, storeProducts, storeCategoryMap])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const data = hasSelection ? selectedBatches : batches
    const totalAmt = data.reduce((s, b) => s + b.totalAmount, 0)
    const totalDisc = data.reduce((s, b) => s + b.totalDiscount, 0)
    const rows = data.map((b) => buildPdfRow(b, opts.selectedCols))
    const summaryRow: Record<string, string | number> = {}
    summaryRow[bn ? 'তারিখ' : 'Date'] = ''
    summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    summaryRow[bn ? 'রসিদ নং' : 'Receipt No'] = ''
    summaryRow[bn ? 'পরিশোধিত ফি' : 'Fees Paid'] = ''
    if (opts.selectedCols.includes('amount')) summaryRow[bn ? 'পরিমাণ' : 'Amount'] = totalAmt
    if (opts.selectedCols.includes('discount')) summaryRow[bn ? 'ছাড়' : 'Discount'] = totalDisc
    summaryRow[bn ? 'পদ্ধতি' : 'Method'] = ''
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const headers = opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${i === rows.length - 1 ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [batches, selectedBatches, hasSelection, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const data = hasSelection ? selectedBatches : batches
    const totalAmt = data.reduce((s, b) => s + b.totalAmount, 0)
    const totalDisc = data.reduce((s, b) => s + b.totalDiscount, 0)
    const rows = data.slice(0, 20).map((b) => buildPdfRow(b, opts.selectedCols))
    const summaryRow: Record<string, string | number> = {}
    summaryRow[bn ? 'তারিখ' : 'Date'] = ''
    summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    summaryRow[bn ? 'রসিদ নং' : 'Receipt No'] = ''
    summaryRow[bn ? 'পরিশোধিত ফি' : 'Fees Paid'] = ''
    if (opts.selectedCols.includes('amount')) summaryRow[bn ? 'পরিমাণ' : 'Amount'] = totalAmt
    if (opts.selectedCols.includes('discount')) summaryRow[bn ? 'ছাড়' : 'Discount'] = totalDisc
    summaryRow[bn ? 'পদ্ধতি' : 'Method'] = ''
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const headers = opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a">
      <div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:8px;margin-bottom:10px">
        ${pdfLogoHTML(pdfBranding, 28)}
        <div><div style="font-size:14px;font-weight:700;color:${pdfBranding.brandColor}">${pdfBranding.schoolName}</div>
        <div style="font-size:9px;color:#666">${pdfBranding.address}</div></div>
      </div>
      <div style="font-size:12px;font-weight:700;color:${pdfBranding.brandColor};margin-bottom:8px">${opts.title}</div>
      <table style="width:100%;border-collapse:collapse;font-size:9px">
        <thead><tr>${headers.map((h) => `<th style="background:${pdfBranding.brandColor};color:#fff;padding:4px 6px;text-align:center;font-weight:600">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r, i) => `<tr${i === rows.length - 1 ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>`
  }, [batches, selectedBatches, hasSelection, pdfColumns, bn, buildPdfRow])

  const exportExcel = useCallback(() => {
    const data = hasSelection ? selectedBatches : batches
    const sheetData = data.map((b) => {
      const feeNames = b.payments.map((p) => {
        if (!p.feeStructureId && p.note) {
          const catMatch = p.note.match(/^\[cat:(.+?)\|catbn:(.+?)\]\s*/)
          if (catMatch) {
            const rest = p.note.slice(catMatch[0].length)
            const di = rest.indexOf(' — ')
            const pn = di > 0 ? rest.substring(0, di).trim() : rest.trim()
            return bn ? `${catMatch[2]} - ${pn}` : `${catMatch[1]} - ${pn}`
          }
          const dashIdx = p.note.indexOf(' — ')
          const productName = dashIdx > 0 ? p.note.substring(0, dashIdx).trim() : p.note.split(',')[0].trim()
          const product = storeProducts.find((pp) => pp.name === productName || pp.nameBn === productName)
          if (product) {
            const cat = storeCategoryMap[product.categoryId]
            if (cat) return bn ? `${cat.nameBn} - ${product.nameBn}` : `${cat.name} - ${product.name}`
            return bn ? product.nameBn : product.name
          }
        }
        const fn = structureMap[p.feeStructureId] || structureMap['__shop__']
        return bn ? (fn?.nameBn || fn?.name || '') : (fn?.name || '')
      }).join(', ')
      return {
        [bn ? 'তারিখ' : 'Date']: b.paidAt,
        [bn ? 'শিক্ষার্থী' : 'Student']: bn ? (b.studentNameBn || b.studentName) : b.studentName,
        [bn ? 'রসিদ নং' : 'Receipt No']: b.receiptNo,
        [bn ? 'পরিশোধিত ফি' : 'Fees Paid']: feeNames,
        [bn ? 'পরিমাণ' : 'Amount']: b.totalAmount,
        [bn ? 'ছাড়' : 'Discount']: b.totalDiscount,
        [bn ? 'পদ্ধতি' : 'Method']: methodLabel(b.method),
      }
    })
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'পেমেন্ট' : 'Payments')
    XLSX.writeFile(wb, `payments-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [batches, selectedBatches, hasSelection, bn, structureMap, storeProducts, storeCategoryMap])

  const handleDeleteBatch = useCallback((batch: PaymentBatch) => {
    setBatchToDelete(batch)
  }, [])

  const numberToWords = useCallback((n: number): string => {
    if (n === 0) return 'Zero'
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const conv = (num: number): string => {
      if (num < 20) return ones[num]
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + conv(num % 100) : '')
      if (num < 1000000) return conv(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + conv(num % 1000) : '')
      return conv(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 ? ' ' + conv(num % 1000000) : '')
    }
    return conv(Math.floor(n))
  }, [])

  const generateReceipt = useCallback((batch: PaymentBatch) => {
    const b = getPDFBranding()
    const logoHtml = pdfLogoHTML(b, 50)
    const watermarkHtml = b.logo ? `<img src="${b.logo}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:350px;height:350px;opacity:0.05;pointer-events:none;object-fit:contain" />` : ''
    const feeRows = batch.payments.map((p, i) => {
      let fnName: string
      let fnNameBn: string
      if (!p.feeStructureId && p.note) {
        const catMatch = p.note.match(/^\[cat:(.+?)\|catbn:(.+?)\]\s*/)
        if (catMatch) {
          const catName = catMatch[1]
          const catNameBn = catMatch[2]
          const rest = p.note.slice(catMatch[0].length)
          const dashIdx = rest.indexOf(' — ')
          const productName = dashIdx > 0 ? rest.substring(0, dashIdx).trim() : rest.trim()
          fnName = `${catName} - ${productName}`
          fnNameBn = `${catNameBn} - ${productName}`
        } else {
          const dashIdx = p.note.indexOf(' — ')
          const productName = dashIdx > 0 ? p.note.substring(0, dashIdx).trim() : p.note.split(',')[0].trim()
          const product = storeProducts.find((pp) => pp.name === productName || pp.nameBn === productName)
          if (product) {
            const cat = storeCategoryMap[product.categoryId]
            if (cat) {
              fnName = `${cat.name} - ${product.name}`
              fnNameBn = `${cat.nameBn} - ${product.nameBn}`
            } else {
              fnName = product.name
              fnNameBn = product.nameBn
            }
          } else {
            const fn = structureMap['__shop__']
            fnName = fn?.name || '-'
            fnNameBn = fn?.nameBn || '-'
          }
        }
      } else {
        const fn = structureMap[p.feeStructureId] || structureMap['__shop__']
        fnName = fn?.name || '-'
        fnNameBn = fn?.nameBn || '-'
      }
      const period = p.forMonth ? (() => { const [yr, mo] = p.forMonth.split('-').map(Number); return `<span style="font-size:8px;color:#555;font-weight:400">(${MONTH_LABELS[(mo || 1) - 1]}-${String(yr).slice(-2)})</span>` })() : (fnName !== (structureMap['__shop__']?.name || '-') ? `<span style="font-size:8px;color:#555;font-weight:400">(One-time)</span>` : '')
      const rem = p.note ? `<div style="font-size:7px;color:#555;font-style:italic">${(p.discount || 0).toLocaleString()} amount discount for ${stripCatPrefix(p.note)}</div>` : ''
      return `<tr><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center">${i + 1}</td><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:left"><div style="font-weight:600">${bn ? fnNameBn : fnName} ${period}</div>${rem}</td><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600">${p.amount.toLocaleString()}</td></tr>`
    }).join('')
    const ds = new Date(batch.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const receiptData = {
      receiptNo: batch.receiptNo,
      date: ds,
      feePeriod: batch.payments.length === 1 ? (structureMap[batch.payments[0].feeStructureId]?.name || '-') : `${batch.payments.length} fees`,
      studentName: batch.studentName,
      studentNameBn: batch.studentNameBn,
      admissionNo: batch.studentId,
      class: batch.class,
      section: batch.section || '-',
      totalAmount: batch.payments.reduce((s, p) => s + p.amount, 0) + batch.totalDiscount,
      discount: batch.totalDiscount,
      totalReceived: batch.totalAmount,
      totalDue: 0,
      paymentMethod: batch.method,
      comment: batch.payments.map((p) => p.note ? stripCatPrefix(p.note) : '').filter(Boolean).join(', ') || undefined,
    }
    const copyHtml = (copyLabel: string) => `<div style="font-family:'Inter','Noto Sans Bengali','Hind Siliguri',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11.5px;color:#0f172a;width:100%;height:100%;padding:0 12px;display:flex;flex-direction:column;position:relative;-webkit-font-smoothing:antialiased">
      ${watermarkHtml}
      <div style="display:flex;align-items:center;gap:14px;border-bottom:2.5px solid ${b.brandColor};padding-bottom:10px;margin-bottom:12px">
        ${logoHtml}
        <div style="flex:1;text-align:center">
          <div style="font-size:17px;font-weight:800;color:${b.brandColor};letter-spacing:-0.01em;line-height:1.2">${b.schoolName}</div>
          <div style="font-size:10px;color:#475569;margin-top:3px;font-weight:500">${b.address}</div>
        </div>
      </div>
      <div style="text-align:center;font-size:12px;font-weight:700;color:${b.brandColor};background:${b.brandColor}12;border:1px solid ${b.brandColor}33;border-radius:6px;padding:6px 12px;margin-bottom:12px;letter-spacing:0.5px">${bn ? 'ফি রসিদ/ইনভয়েস' : 'Fee Receipt/Invoice'}: [${copyLabel}]</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:11px;margin-bottom:10px;background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0">
        <div><span style="font-weight:600;color:#64748b">${bn ? 'সেশন' : 'Session'}:</span> <span style="font-weight:600;color:#0f172a">${fSession}</span></div>
        <div><span style="font-weight:600;color:#64748b">${bn ? 'ফি সময়কাল' : 'Fee Period'}:</span> <span style="font-weight:600;color:#0f172a">${receiptData.feePeriod}</span></div>
        <div><span style="font-weight:600;color:#64748b">${bn ? 'তারিখ' : 'Date'}:</span> <span style="font-weight:600;color:#0f172a">${receiptData.date}</span></div>
        <div><span style="font-weight:600;color:#64748b">${bn ? 'রসিদ নং' : 'Receipt No'}:</span> <span style="font-weight:700;color:${b.brandColor}">${receiptData.receiptNo}</span></div>
        <div><span style="font-weight:600;color:#64748b">${bn ? 'নাম' : 'Name'}:</span> <span style="font-weight:700;color:#0f172a">${bn ? receiptData.studentNameBn : receiptData.studentName}</span></div>
        <div><span style="font-weight:600;color:#64748b">${bn ? 'ভর্তি নং' : 'Adm No'}:</span> <span style="font-weight:600;color:#0f172a">${receiptData.admissionNo}</span></div>
        <div><span style="font-weight:600;color:#64748b">${bn ? 'শ্রেণি' : 'Class'}:</span> <span style="font-weight:600;color:#0f172a">${receiptData.class}</span></div>
        <div><span style="font-weight:600;color:#64748b">${bn ? 'সেকশন' : 'Section'}:</span> <span style="font-weight:600;color:#0f172a">${receiptData.section}</span></div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px">
        <thead><tr>
          <th style="background:${b.brandColor};color:#fff;padding:6px 10px;text-align:center;font-weight:700;font-size:10.5px;letter-spacing:0.5px;width:36px;border-top-left-radius:4px">#</th>
          <th style="background:${b.brandColor};color:#fff;padding:6px 10px;text-align:left;font-weight:700;font-size:10.5px;letter-spacing:0.5px">${bn ? 'ফি বিবরণ' : 'Fee Particulars'}</th>
          <th style="background:${b.brandColor};color:#fff;padding:6px 10px;text-align:right;font-weight:700;font-size:10.5px;letter-spacing:0.5px;width:100px;border-top-right-radius:4px">${bn ? 'পরিমাণ' : 'Amount'}</th>
        </tr></thead>
        <tbody>${feeRows}</tbody>
      </table>
      <div style="flex:1"></div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
        <table style="width:240px;border-collapse:collapse;font-size:11px">
          <tr><td style="padding:4px 8px;text-align:right;font-weight:600;color:#475569">${bn ? 'মোট' : 'Total'}:</td><td style="padding:4px 8px;text-align:right;font-weight:700;font-size:12px;color:${b.brandColor}">৳${receiptData.totalAmount.toLocaleString()}</td></tr>
          ${receiptData.discount > 0 ? `<tr><td style="padding:4px 8px;text-align:right;font-weight:600;color:#d97706">${bn ? 'ছাড়' : 'Discount'}:</td><td style="padding:4px 8px;text-align:right;font-weight:700;font-size:12px;color:#d97706">-৳${receiptData.discount.toLocaleString()}</td></tr>` : ''}
          <tr><td style="padding:5px 8px;text-align:right;font-weight:700;color:#15803d;border-top:2px solid ${b.brandColor}">${bn ? 'পরিশোধিত' : 'Paid'}:</td><td style="padding:5px 8px;text-align:right;font-weight:800;font-size:13px;color:#15803d;border-top:2px solid ${b.brandColor}">৳${receiptData.totalReceived.toLocaleString()}</td></tr>
          ${receiptData.totalDue > 0 ? `<tr><td style="padding:5px 8px;text-align:right;font-weight:700;color:#b91c1c;border-top:2px solid #b91c1c">${bn ? 'বকেয়' : 'Balance'}:</td><td style="padding:5px 8px;text-align:right;font-weight:800;font-size:13px;color:#b91c1c;border-top:2px solid #b91c1c">৳${receiptData.totalDue.toLocaleString()}</td></tr>` : ''}
        </table>
      </div>
      <div style="font-size:11px;color:#334155;margin-bottom:5px;line-height:1.4"><span style="font-weight:600;color:#64748b">${bn ? 'কথায়' : 'In words'}:</span> <span style="font-weight:600;color:#0f172a">${numberToWords(receiptData.totalReceived)} Taka Only.</span></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#334155;margin-bottom:6px">
        <span><span style="font-weight:600;color:#64748b">${bn ? 'পদ্ধতি' : 'Mode'}:</span> <span style="font-weight:600;text-transform:uppercase;color:#0f172a">${receiptData.paymentMethod}</span></span>
        ${receiptData.totalDue > 0 ? `<span style="font-weight:700;color:#b91c1c">${bn ? 'বকেয়া' : 'BALANCE'}: ৳${receiptData.totalDue.toLocaleString()}</span>` : ''}
      </div>
      ${receiptData.comment ? `<div style="font-size:10.5px;color:#475569;margin-bottom:6px"><span style="font-weight:600;color:#64748b">${bn ? 'মন্তব্য' : 'Comment'}:</span> ${receiptData.comment}</div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-top:28px;padding-top:10px">
        <div style="text-align:center;width:130px"><div style="border-top:1px solid #64748b;padding-top:4px;font-size:10px;font-weight:600;color:#475569">${bn ? 'ফি আদায়কারী' : 'Fee Collected by'}</div></div>
        <div style="text-align:center;width:130px"><div style="border-top:1px solid #64748b;padding-top:4px;font-size:10px;font-weight:600;color:#475569">${bn ? 'অভিভাবক' : 'Parent/Guardian'}</div></div>
      </div>
      <div style="text-align:center;font-size:9px;color:#64748b;margin-top:10px;padding-top:6px;border-top:1px dashed #cbd5e1;font-weight:500">${bn ? 'একবার ফি পরিশোধ হলে ফেরত দেওয়া হবে না' : 'Fee once paid is not refundable'}</div>
    </div>`
    const leftCopy = copyHtml(bn ? 'শিক্ষার্থী কপি' : 'Student Copy')
    const rightCopy = copyHtml(bn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy')
    const css = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap');@page{size:A4 landscape;margin:6mm}html,body{height:100%;margin:0;padding:0}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter','Noto Sans Bengali','Hind Siliguri',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11.5px;color:#0f172a;background:#fff;padding:4mm;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}.container{display:flex;gap:20px;height:100%}.copy{flex:1;height:100%;display:flex;flex-direction:column}.copy:first-child{border-right:2px dashed #cbd5e1;padding-right:20px}th{background:${b.brandColor};color:#fff;padding:6px 10px;text-align:center;font-weight:700}@media print{html,body{height:100%!important;margin:0!important;padding:0!important}body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;padding:4mm!important}}`
    const bodyHTML = `<div class="container" style="width:100%"><div class="copy">${leftCopy}</div><div class="copy">${rightCopy}</div></div>`
    openPrintWindow(batch.receiptNo, bodyHTML, { css })
  }, [bn, structureMap, numberToWords, fSession, storeProducts, storeCategoryMap])

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-[0.625rem]">
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--green-light)' }}>
            <DollarSign size={15} style={{ color: 'var(--green)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(totalCollected)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'মোট সংগ্রহ' : 'Total Collected'}</div>
          </div>
        </div>
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-light)' }}>
            <CreditCard size={15} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{batches.length}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'মোট পেমেন্ট' : 'Total Payments'}</div>
          </div>
        </div>
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-light)' }}>
            <Calendar size={15} style={{ color: 'var(--amber)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(todayCollected)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'আজকের সংগ্রহ' : 'Today Collected'}</div>
          </div>
        </div>
      </div>

      {/* Minimal Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[12.5rem]">
            <Search size={14} className="absolute left-[0.625rem] top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder={bn ? 'পেমেন্ট খুঁজুন...' : 'Search payments...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[2.125rem] pl-[2.125rem] pr-[0.75rem] text-[0.75rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] transition-colors"
            />
          </div>

          {/* Session Filter */}
          <select
            value={fSession}
            onChange={(e) => setFSession(e.target.value)}
            className={selectCls}
          >
            <option value="">{bn ? 'সব শিক্ষাবর্ষ' : 'All Sessions'}</option>
            {allAvailableSessions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={fMethod}
            onChange={(e) => setFMethod(e.target.value)}
            className={selectCls}
          >
            <option value="">{bn ? 'সব পদ্ধতি' : 'All Methods'}</option>
            <option value="cash">{bn ? 'নগদ' : 'Cash'}</option>
            <option value="bank">{bn ? 'ব্যাংক' : 'Bank'}</option>
            <option value="mobile">{bn ? 'মোবাইল' : 'Mobile Banking'}</option>
            <option value="other">{bn ? 'অন্যান্য' : 'Other'}</option>
          </select>

          {/* Collector Filter */}
          {uniqueCollectors.length > 0 && (
            <select
              value={fCollector}
              onChange={(e) => setFCollector(e.target.value)}
              className={selectCls}
            >
              <option value="">{bn ? 'সব সংগ্রাহক' : 'All Collectors'}</option>
              {uniqueCollectors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {/* Date Range Filter (From ... To ...) */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] px-2.5 h-[2.125rem] rounded-[0.5rem] border border-[var(--border)] focus-within:border-[var(--brand)] transition-colors">
            <Calendar size={13} className="text-[var(--text-muted)] shrink-0" />
            <span className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] whitespace-nowrap">{bn ? 'হতে:' : 'From:'}</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-[0.75rem] text-[var(--text-primary)] outline-none border-0 p-0 w-[7.8rem] cursor-pointer"
              title={bn ? 'শুরুর তারিখ' : 'From date'}
            />
            <span className="text-[var(--text-muted)] text-[0.75rem] font-medium">—</span>
            <span className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] whitespace-nowrap">{bn ? 'পর্যন্ত:' : 'To:'}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-[0.75rem] text-[var(--text-primary)] outline-none border-0 p-0 w-[7.8rem] cursor-pointer"
              title={bn ? 'শেষ তারিখ' : 'To date'}
            />
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-1 p-0.5 rounded cursor-pointer transition-colors"
                title={bn ? 'তারিখ ফিল্টার মুছুন' : 'Clear date filter'}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Date Shortcuts */}
          <div className="inline-flex items-center rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5 h-[2.125rem]">
            <button
              type="button"
              onClick={() => { setDateFrom(todayStr); setDateTo(todayStr) }}
              className={`px-2 py-1 text-[0.6875rem] font-semibold rounded-[0.375rem] border-0 cursor-pointer transition-colors ${dateFrom === todayStr && dateTo === todayStr ? 'bg-[var(--brand)] text-white shadow-2xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'}`}
            >
              {bn ? 'আজ' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => { setDateFrom(monthStart); setDateTo(todayStr) }}
              className={`px-2 py-1 text-[0.6875rem] font-semibold rounded-[0.375rem] border-0 cursor-pointer transition-colors ${dateFrom === monthStart && dateTo === todayStr ? 'bg-[var(--brand)] text-white shadow-2xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'}`}
            >
              {bn ? 'এই মাস' : 'This Month'}
            </button>
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className={`px-2 py-1 text-[0.6875rem] font-semibold rounded-[0.375rem] border-0 cursor-pointer transition-colors ${!dateFrom && !dateTo ? 'bg-[var(--brand)] text-white shadow-2xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent'}`}
            >
              {bn ? 'সব' : 'All'}
            </button>
          </div>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={selectCls}
          >
            <option value="date-desc">{bn ? 'তারিখ: নতুন → পুরাতন' : 'Date: Newest First'}</option>
            <option value="date-asc">{bn ? 'তারিখ: পুরাতন → নতুন' : 'Date: Oldest First'}</option>
            <option value="amount-desc">{bn ? 'পরিমাণ: বেশি → কম' : 'Amount: High to Low'}</option>
            <option value="amount-asc">{bn ? 'পরিমাণ: কম → বেশি' : 'Amount: Low to High'}</option>
          </select>

          {/* Actions Menu */}
          {batches.length > 0 && (
            <div className="relative ml-auto">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="h-[2.125rem] px-[0.75rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-semibold hover:border-[var(--brand)] cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <MoreVertical size={13} />
                <span>{bn ? 'অ্যাকশন' : 'Actions'}</span>
                <ChevronDown size={12} className="text-[var(--text-muted)]" />
              </button>
              {showActionMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-[100] overflow-hidden">
                    {canExport('finance.fees.payments') && (
                      <button onClick={() => { setShowActionMenu(false); exportExcel() }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[0.8125rem] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors">
                        <FileSpreadsheet size={14} className="text-[var(--green)]" />
                        {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                      </button>
                    )}
                    <div className="h-px bg-[var(--border)] mx-2" />
                    {canExport('finance.fees.payments') && (
                      <button onClick={() => { setShowActionMenu(false); setShowPdfModal(true) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[0.8125rem] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors">
                        <FileText size={14} className="text-[var(--red)]" />
                        {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-primary)]">
        {batches.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {bn ? 'কোনো পেমেন্ট নেই' : 'No payments found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="text-center px-2 py-2.5 w-[36px]">
                    <ModernCheckbox checked={batches.length > 0 && selectedRows.size === batches.length} onChange={() => toggleAllRows()} color="brand" size="xs" />
                  </th>
                  <th className="text-center px-2 py-2.5 w-[36px] text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">#</th>
                  <th className="text-left px-3 py-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-3 py-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">{bn ? 'রসিদ নং' : 'Receipt No'}</th>
                  <th className="text-center px-3 py-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">{bn ? 'তারিখ' : 'Date'}</th>
                  <th className="text-right px-3 py-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-right px-3 py-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">{bn ? 'ছাড়' : 'Disc.'}</th>
                  <th className="text-left px-3 py-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">{bn ? 'পদ্ধতি' : 'Method'}</th>
                  <th className="text-left px-3 py-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">{bn ? 'সংগ্রাহক' : 'Receipted By'}</th>
                  <th className="text-right px-3 py-2.5 text-[0.6875rem] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">{bn ? 'কাজ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b, idx) => (
                  <tr key={b.batchKey} className={`border-t border-[var(--border)] transition-colors ${selectedRows.has(b.batchKey) ? 'bg-[var(--brand-light)]/60' : 'hover:bg-[var(--brand-light)]/30'}`}>
                    <td className="text-center px-2 py-2">
                      <ModernCheckbox checked={selectedRows.has(b.batchKey)} onChange={() => toggleRowSelection(b.batchKey)} color="brand" size="xs" />
                    </td>
                    <td className="text-center px-2 py-2 text-[var(--text-muted)] text-[11px]">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-[var(--text-primary)] text-[11px]">{bn ? b.studentNameBn || b.studentName : b.studentName}</p>
                      {b.class && <p className="text-[9px] text-[var(--text-muted)]">{b.class}{b.section ? `-${b.section}` : ''}</p>}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-[var(--brand)]">{b.receiptNo}</td>
                    <td className="px-3 py-2 text-center text-[var(--text-secondary)]">
                      <div className="flex items-center justify-center gap-1"><Calendar size={10} />{b.paidAt}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-[var(--green)]">{fmt(b.totalAmount)}</td>
                    <td className="px-3 py-2 text-right font-medium text-[var(--amber)]">{b.totalDiscount ? fmt(b.totalDiscount) : '-'}</td>
                    <td className="px-3 py-2">
                      <span className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full" style={{ background: `${methodColor(b.method)}12`, color: methodColor(b.method) }}>
                        {methodLabel(b.method)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-[var(--text-secondary)]">{b.collectedBy || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBatchForDetails(b)}
                          style={{ borderColor: 'var(--brand)' }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)] border cursor-pointer hover:bg-[var(--brand)] hover:text-white transition-all shadow-xs"
                          title={bn ? 'পেমেন্ট বিবরণ দেখুন' : 'View Payment Details'}
                          aria-label={bn ? 'পেমেন্ট বিবরণ দেখুন' : 'View Payment Details'}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => generateReceipt(b)}
                          style={{ borderColor: 'var(--green)' }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--green-light)] text-[var(--green)] border cursor-pointer hover:bg-[var(--green)] hover:text-white transition-all shadow-xs"
                          title={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
                          aria-label={bn ? 'রসিদ প্রিন্ট' : 'Print Receipt'}
                        >
                          <Printer size={13} />
                        </button>
                        {canDelete('finance.fees.payments') ? (
                          <button
                            onClick={() => handleDeleteBatch(b)}
                            style={{ borderColor: 'var(--red)' }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all shadow-xs"
                            title={bn ? 'মুছুন' : 'Delete'}
                            aria-label={bn ? 'মুছুন' : 'Delete'}
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <div
                            style={{ borderColor: 'var(--border)' }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] border opacity-40 cursor-not-allowed"
                            title={bn ? 'অনুমতি নেই' : 'No delete permission'}
                          >
                            <Trash2 size={13} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--brand)] bg-[var(--bg-secondary)] font-bold">
                  <td className="px-2 py-1.5" />
                  <td className="px-2 py-1.5" />
                  <td className="px-3 py-1.5 text-[9px] uppercase text-[var(--text-muted)]" colSpan={2}>{bn ? 'মোট' : 'Total'} ({batches.length})</td>
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5 text-right text-[11px] text-[var(--green)]">{fmt(totalCollected)}</td>
                  <td className="px-3 py-1.5 text-right text-[11px] text-[var(--amber)]">{totalDiscount ? fmt(totalDiscount) : '-'}</td>
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5" />
                  <td className="px-3 py-1.5" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* PDF Options Modal */}
      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="Payment History"
          defaultTitleBn="পেমেন্ট ইতিহাস"
          recordLabel="payment"
          recordLabelBn="পেমেন্ট"
          count={hasSelection ? selectedRows.size : batches.length}
          isBn={bn}
          showColumns={true}
          previewRenderer={pdfPreviewRenderer}
          onClose={() => setShowPdfModal(false)}
          onDownload={handlePdfDownload}
        />
      )}

      {/* Payment Details Modal */}
      {selectedBatchForDetails && (
        <PaymentDetailsModal
          student={{
            id: selectedBatchForDetails.studentId,
            nameEn: selectedBatchForDetails.studentName,
            nameBn: selectedBatchForDetails.studentNameBn,
            class: selectedBatchForDetails.class,
            section: selectedBatchForDetails.section,
            roll: studentMap[selectedBatchForDetails.studentId]?.roll || '',
            photo: studentMap[selectedBatchForDetails.studentId]?.photo || '',
          }}
          payments={selectedBatchForDetails.payments}
          session={fSession || institution?.currentSession}
          batchReceiptNo={selectedBatchForDetails.receiptNo}
          onClose={() => setSelectedBatchForDetails(null)}
          onCollect={onCollect}
        />
      )}

      {/* Delete Confirmation Modal */}
      {batchToDelete && (
        <div
          className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setBatchToDelete(null)}
        >
          <div
            className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 sm:p-6 text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[var(--red-light)] text-[var(--red)] border border-[var(--border)] flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                  {bn ? 'পেমেন্ট মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Delete Payment'}
                </h3>
                <p className="text-[0.75rem] text-[var(--text-muted)] mt-1">
                  {bn
                    ? 'আপনি কি নিশ্চিত যে এই পেমেন্ট রেকর্ডটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।'
                    : 'Are you sure you want to delete this payment record? This action cannot be undone.'}
                </p>

                {/* Details Summary Card */}
                <div className="mt-3.5 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.75rem] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">{bn ? 'রসিদ নং:' : 'Receipt No:'}</span>
                    <span className="font-mono font-bold text-[var(--brand)]">{batchToDelete.receiptNo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">{bn ? 'শিক্ষার্থী:' : 'Student:'}</span>
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[13rem]">
                      {bn ? batchToDelete.studentNameBn || batchToDelete.studentName : batchToDelete.studentName}
                    </span>
                  </div>
                  {batchToDelete.class && (
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">{bn ? 'শ্রেণি:' : 'Class:'}</span>
                      <span className="font-medium text-[var(--text-secondary)]">
                        {batchToDelete.class}{batchToDelete.section ? ` - ${batchToDelete.section}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">{bn ? 'তারিখ:' : 'Date:'}</span>
                    <span className="text-[var(--text-secondary)]">{batchToDelete.paidAt}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-[var(--border)]">
                    <span className="font-semibold text-[var(--text-primary)]">{bn ? 'মোট পরিমাণ:' : 'Total Amount:'}</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">৳{batchToDelete.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3.5 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setBatchToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)] text-[0.75rem] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  batchToDelete.payments.forEach((p) => deletePayment(p.id))
                  setBatchToDelete(null)
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[0.75rem] font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 size={13} />
                <span>{bn ? 'মুছে ফেলুন' : 'Delete Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
