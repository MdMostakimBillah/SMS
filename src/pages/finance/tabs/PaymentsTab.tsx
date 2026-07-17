import { useState, useMemo, useCallback } from 'react'
import React from 'react'
import { Search, Trash2, Eye, DollarSign, Calendar, CreditCard, FileSpreadsheet, FileText, MoreVertical, Filter, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeePayment } from '@/store/feeStore'
import { XLSX } from '@/lib/excelExport'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { inputCls } from '@/lib/styles'

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
}

interface Props {
  onViewReceipt?: (batch: PaymentBatch) => void
}

export const PaymentsTab = React.memo(function PaymentsTab(_props?: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { payments, structures, deletePayment } = useFeeStore()
  const [search, setSearch] = useState('')
  const [fMethod, setFMethod] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const studentMap = useMemo(() => {
    const map: Record<string, { nameEn: string; nameBn: string; class: string; section: string }> = {}
    students.forEach((s) => { map[s.id] = { nameEn: s.nameEn, nameBn: s.nameBn, class: s.class, section: s.section || '' } })
    return map
  }, [students])

  const structureMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string; type: string }> = {}
    structures.forEach((s) => { map[s.id] = { name: s.name, nameBn: s.nameBn, type: s.type } })
    return map
  }, [structures])

  const batches = useMemo(() => {
    let list = [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt) || b.createdAt.localeCompare(a.createdAt))
    if (fMethod) list = list.filter((p) => p.method === fMethod)
    if (dateFrom) list = list.filter((p) => p.paidAt >= dateFrom)
    if (dateTo) list = list.filter((p) => p.paidAt <= dateTo)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => {
        const sn = studentMap[p.studentId]
        const fn = structureMap[p.feeStructureId]
        return (sn?.nameEn.toLowerCase().includes(q) || sn?.nameBn.includes(q) || fn?.name.toLowerCase().includes(q) || p.note.toLowerCase().includes(q))
      })
    }
    const grouped = new Map<string, FeePayment[]>()
    for (const p of list) {
      const key = p.batchId || `${p.studentId}__${p.paidAt}__${p.method}`
      const group = grouped.get(key) || []
      group.push(p)
      grouped.set(key, group)
    }
    const result: PaymentBatch[] = Array.from(grouped.entries()).map(([key, group]) => {
      const first = group[0]
      const sn = studentMap[first.studentId]
      return {
        batchKey: key,
        payments: group,
        studentId: first.studentId,
        studentName: sn?.nameEn || '',
        studentNameBn: sn?.nameBn || '',
        class: sn?.class || '',
        section: sn?.section || '',
        paidAt: first.paidAt,
        method: first.method,
        totalAmount: group.reduce((s, p) => s + p.amount, 0),
        totalDiscount: group.reduce((s, p) => s + (p.discount || 0), 0),
        receiptNo: `RCP-${key.slice(-10).toUpperCase()}`,
      }
    })
    return result
  }, [payments, search, fMethod, dateFrom, dateTo, studentMap, structureMap])

  const totalCollected = useMemo(() => batches.reduce((sum, b) => sum + b.totalAmount, 0), [batches])
  const totalDiscount = useMemo(() => batches.reduce((sum, b) => sum + b.totalDiscount, 0), [batches])
  const todayStr = new Date().toISOString().split('T')[0]
  const todayCollected = useMemo(() => batches.filter((b) => b.paidAt === todayStr).reduce((sum, b) => sum + b.totalAmount, 0), [batches, todayStr])

  const fmt = (n: number) => n.toLocaleString()

  const methodLabel = (m: string) => m === 'cash' ? (bn ? 'নগদ' : 'Cash') : m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') : m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') : (bn ? 'অন্যান্য' : 'Other')

  const methodColor = (m: string) => m === 'cash' ? 'var(--green)' : m === 'bank' ? 'var(--brand)' : m === 'mobile' ? 'var(--teal)' : 'var(--text-muted)'

  const hasFilter = search || fMethod || dateFrom || dateTo

  const clearFilters = useCallback(() => {
    setSearch('')
    setFMethod('')
    setDateFrom('')
    setDateTo('')
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
  ], [])

  const buildPdfRow = useCallback((b: PaymentBatch, selectedCols: string[]): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (selectedCols.includes('date')) row[bn ? 'তারিখ' : 'Date'] = b.paidAt
    if (selectedCols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? (b.studentNameBn || b.studentName) : b.studentName
    if (selectedCols.includes('receipt')) row[bn ? 'রসিদ নং' : 'Receipt No'] = b.receiptNo
    if (selectedCols.includes('fees')) {
      const feeNames = b.payments.map((p) => {
        const fn = structureMap[p.feeStructureId]
        return bn ? (fn?.nameBn || fn?.name || '') : (fn?.name || '')
      }).join(', ')
      row[bn ? 'পরিশোধিত ফি' : 'Fees Paid'] = feeNames
    }
    if (selectedCols.includes('amount')) row[bn ? 'পরিমাণ' : 'Amount'] = b.totalAmount
    if (selectedCols.includes('discount')) row[bn ? 'ছাড়' : 'Discount'] = b.totalDiscount
    if (selectedCols.includes('method')) row[bn ? 'পদ্ধতি' : 'Method'] = methodLabel(b.method)
    return row
  }, [bn, structureMap])

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
    const css = `@page{size:${opts.orientation};margin:12mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:10mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}`
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
        const fn = structureMap[p.feeStructureId]
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
  }, [batches, selectedBatches, hasSelection, bn, structureMap])

  const handleDeleteBatch = useCallback((batch: PaymentBatch) => {
    const msg = bn
      ? `এই পেমেন্ট মুছে ফেলতে চান? (${batch.payments.length} টি পেমেন্ট)`
      : `Delete this payment? (${batch.payments.length} payments)`
    if (confirm(msg)) {
      batch.payments.forEach((p) => deletePayment(p.id))
    }
  }, [bn, deletePayment])

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
      const fn = structureMap[p.feeStructureId]
      const period = p.forMonth ? (() => { const [yr, mo] = p.forMonth.split('-').map(Number); return `<span style="font-size:8px;color:#888;font-weight:400">(${MONTH_LABELS[(mo || 1) - 1]}-${String(yr).slice(-2)})</span>` })() : (fn?.type === 'onetime' ? `<span style="font-size:8px;color:#888;font-weight:400">(One-time)</span>` : '')
      const rem = p.note ? `<div style="font-size:7px;color:#aaa;font-style:italic">${(p.discount || 0).toLocaleString()} amount discount for ${p.note}</div>` : ''
      return `<tr><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center">${i + 1}</td><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:left"><div style="font-weight:600">${bn ? fn?.nameBn || fn?.name || '-' : fn?.name || '-'} ${period}</div>${rem}</td><td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600">${p.amount.toLocaleString()}</td></tr>`
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
    }
    const copyHtml = (copyLabel: string) => `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;width:100%;max-width:480px;padding:0 10px;display:flex;flex-direction:column;position:relative">
      ${watermarkHtml}
      <div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid ${b.brandColor};padding-bottom:10px;margin-bottom:12px">
        ${logoHtml}
        <div style="flex:1;text-align:center">
          <div style="font-size:15px;font-weight:700;color:${b.brandColor}">${b.schoolName}</div>
          <div style="font-size:9px;color:#666;margin-top:2px">${b.address}</div>
        </div>
      </div>
      <div style="text-align:center;font-size:13px;font-weight:700;color:${b.brandColor};background:${b.brandColor}11;border:1px solid ${b.brandColor}33;border-radius:4px;padding:6px;margin-bottom:12px">${bn ? 'ফি রসিদ/ইনভয়েস' : 'Fee Receipt/Invoice'}: [${copyLabel}]</div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span><b>${bn ? 'তারিখ' : 'Date'}:</b> ${receiptData.date}</span><span><b>${bn ? 'রসিদ নং' : 'Receipt No'}:</b> ${receiptData.receiptNo}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span><b>${bn ? 'নাম' : 'Name'}:</b> ${bn ? receiptData.studentNameBn : receiptData.studentName}</span><span><b>${bn ? 'ভর্তি নং' : 'Adm No'}:</b> ${receiptData.admissionNo}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:10px"><span><b>${bn ? 'শ্রেণি' : 'Class'}:</b> ${receiptData.class}</span><span><b>${bn ? 'সেকশন' : 'Section'}:</b> ${receiptData.section}</span></div>
      <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:10px">
        <thead><tr><th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:center;font-weight:600;width:30px">S.No</th><th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:left;font-weight:600">${bn ? 'ফি শিরোনাম' : 'Fee Head'}</th><th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:right;font-weight:600">${bn ? 'পরিমাণ' : 'Amount'}</th></tr></thead>
        <tbody>${feeRows}</tbody>
      </table>
      <div style="flex:1"></div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:6px">
        <table style="width:220px;border-collapse:collapse;font-size:10px">
          <tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#555">${bn ? 'মোট' : 'Total'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:${b.brandColor}">${receiptData.totalAmount.toLocaleString()}</td></tr>
          ${receiptData.discount > 0 ? `<tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#555">${bn ? 'ছাড়' : 'Discount'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#f59e0b">${receiptData.discount.toLocaleString()}</td></tr>` : ''}
          <tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#555;border-top:2px solid ${b.brandColor}">${bn ? 'পরিশোধিত' : 'Paid'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#22c55e;border-top:2px solid ${b.brandColor}">${receiptData.totalReceived.toLocaleString()}</td></tr>
          ${receiptData.totalDue > 0 ? `<tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#555;border-top:2px solid #ef4444">${bn ? 'বকেয়' : 'Balance'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#ef4444;border-top:2px solid #ef4444">${receiptData.totalDue.toLocaleString()}</td></tr>` : ''}
        </table>
      </div>
      <div style="font-size:9px;color:#666;margin-bottom:3px"><b>${bn ? 'অর্থের পরিমাণ' : 'Amt in words'}:</b> ${numberToWords(receiptData.totalReceived)} Only.</div>
      <div style="display:flex;justify-content:space-between;font-size:9px;color:#666;margin-bottom:3px"><span><b>${bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Mode'}:</b> ${receiptData.paymentMethod.toUpperCase()}</span><span><b>BALANCE:</b> ${receiptData.totalDue.toLocaleString()}</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:25px;padding-top:10px">
        <div style="text-align:center;width:120px"><div style="border-top:1px solid #333;padding-top:4px;font-size:9px;color:#666">${bn ? 'ফি আদায়কারী' : 'Fee Collected by'}</div></div>
        <div style="text-align:center;width:120px"><div style="border-top:1px solid #333;padding-top:4px;font-size:9px;color:#666">${bn ? 'অভিভাবক' : 'Parent/Guardian'}</div></div>
      </div>
      <div style="text-align:center;font-size:8px;color:#999;margin-top:10px;padding-top:8px;border-top:1px dashed #ddd">${bn ? 'একবার ফি পরিশোধ হলে ফেরত দেওয়া হবে না' : 'Fee Once paid will not be refunded'}</div>
    </div>`
    const leftCopy = copyHtml(bn ? 'শিক্ষার্থী কপি' : 'Student Copy')
    const rightCopy = copyHtml(bn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy')
    const css = `@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:10mm;height:100vh}.container{display:flex;gap:20px;height:100%}.copy{flex:1;max-width:50%;display:flex;flex-direction:column}.copy:first-child{border-right:2px dashed #ccc;padding-right:20px}th{background:${b.brandColor};color:#fff;padding:5px 8px;text-align:center;font-weight:600}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyHTML = `<div class="container"><div class="copy">${leftCopy}</div><div class="copy">${rightCopy}</div></div>`
    openPrintWindow(batch.receiptNo, bodyHTML, { css })
  }, [bn, structureMap, numberToWords])

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--green-light)]"><DollarSign size={18} className="text-[var(--green)]" /></span>
          <div>
            <p className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'মোট সংগ্রহ' : 'Total Collected'}</p>
            <p className="text-base font-bold text-[var(--green)]">{fmt(totalCollected)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--brand-light)]"><CreditCard size={18} className="text-[var(--brand)]" /></span>
          <div>
            <p className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'মোট পেমেন্ট' : 'Total Payments'}</p>
            <p className="text-base font-bold text-[var(--text-primary)]">{batches.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--amber-light)]"><Calendar size={18} className="text-[var(--amber)]" /></span>
          <div>
            <p className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'আজকের সংগ্রহ' : 'Today Collected'}</p>
            <p className="text-base font-bold text-[var(--amber)]">{fmt(todayCollected)}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder={bn ? 'পেমেন্ট খুঁজুন...' : 'Search payments...'} value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} w-full pl-9 h-8 text-xs`} />
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[var(--text-muted)]" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputCls} h-8 text-xs w-[130px]`} />
            <span className="text-[var(--text-muted)] text-xs">—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputCls} h-8 text-xs w-[130px]`} />
          </div>
          {hasFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.65rem] font-medium bg-[var(--red-light)] text-[var(--red)] border border-[var(--red)]/20 cursor-pointer transition-all hover:bg-[var(--red)]/20">
              <X size={10} />{bn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Filter size={11} className="text-[var(--text-muted)]" />
            {(['', 'cash', 'bank', 'mobile', 'other'] as const).map((m) => (
              <button key={m} onClick={() => setFMethod(m)} className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-medium border cursor-pointer transition-all ${fMethod === m ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]'}`}>
                {m ? methodLabel(m) : (bn ? 'সব' : 'All')}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          {batches.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowActionMenu(!showActionMenu)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--brand)] cursor-pointer transition-all">
                <MoreVertical size={14} />{bn ? 'অ্যাকশন' : 'Actions'}
              </button>
              {showActionMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[140px]">
                    <button onClick={() => { setShowActionMenu(false); setShowPdfModal(true) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] cursor-pointer">
                      <FileText size={13} />{bn ? 'ডাউনলোড PDF' : 'Download PDF'}
                    </button>
                    <button onClick={() => { setShowActionMenu(false); exportExcel() }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] cursor-pointer">
                      <FileSpreadsheet size={13} />{bn ? 'ডাউনলোড Excel' : 'Download Excel'}
                    </button>
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
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-center px-2 py-2 w-[36px]">
                    <input type="checkbox" checked={batches.length > 0 && selectedRows.size === batches.length} onChange={toggleAllRows} className="w-3.5 h-3.5 accent-[var(--brand)] cursor-pointer" />
                  </th>
                  <th className="text-center px-2 py-2 w-[36px] text-[10px] uppercase text-[var(--text-muted)] font-bold">#</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'রসিদ নং' : 'Receipt No'}</th>
                  <th className="text-center px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'তারিখ' : 'Date'}</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ছাড়' : 'Disc.'}</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পদ্ধতি' : 'Method'}</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'কাজ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b, idx) => (
                  <tr key={b.batchKey} className={`border-t border-[var(--border)] transition-colors ${selectedRows.has(b.batchKey) ? 'bg-[var(--brand-light)]/60' : 'hover:bg-[var(--brand-light)]/30'}`}>
                    <td className="text-center px-2 py-2">
                      <input type="checkbox" checked={selectedRows.has(b.batchKey)} onChange={() => toggleRowSelection(b.batchKey)} className="w-3.5 h-3.5 accent-[var(--brand)] cursor-pointer" />
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
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => generateReceipt(b)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)] border-0 cursor-pointer hover:bg-[var(--brand)]/20 transition-colors" title={bn ? 'রসিদ দেখুন' : 'View Receipt'}>
                          <Eye size={12} />
                        </button>
                        <button onClick={() => handleDeleteBatch(b)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer hover:bg-[var(--red)]/20 transition-colors" title={bn ? 'মুছুন' : 'Delete'}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--brand)] bg-[var(--bg-secondary)] font-bold">
                  <td className="px-2 py-2" />
                  <td className="px-2 py-2" />
                  <td className="px-3 py-2 text-[10px] uppercase text-[var(--text-muted)]" colSpan={2}>{bn ? 'মোট' : 'Total'} ({batches.length})</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right text-sm text-[var(--green)]">{fmt(totalCollected)}</td>
                  <td className="px-3 py-2 text-right text-sm text-[var(--amber)]">{totalDiscount ? fmt(totalDiscount) : '-'}</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" />
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
    </div>
  )
})
