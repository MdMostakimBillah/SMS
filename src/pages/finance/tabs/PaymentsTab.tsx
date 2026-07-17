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

interface Props {
  onViewReceipt: (payment: FeePayment & { studentName: string; studentNameBn: string; feeName: string; feeNameBn: string }) => void
}

export const PaymentsTab = React.memo(function PaymentsTab({ onViewReceipt }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { payments, structures, deletePayment } = useFeeStore()
  const [search, setSearch] = useState('')
  const [fMethod, setFMethod] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const studentMap = useMemo(() => {
    const map: Record<string, { nameEn: string; nameBn: string }> = {}
    students.forEach((s) => { map[s.id] = { nameEn: s.nameEn, nameBn: s.nameBn } })
    return map
  }, [students])

  const structureMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string; type: string }> = {}
    structures.forEach((s) => { map[s.id] = { name: s.name, nameBn: s.nameBn, type: s.type } })
    return map
  }, [structures])

  const sorted = useMemo(() => {
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
    return list
  }, [payments, search, fMethod, dateFrom, dateTo, studentMap, structureMap])

  const totalCollected = useMemo(() => sorted.reduce((sum, p) => sum + p.amount, 0), [sorted])
  const totalDiscount = useMemo(() => sorted.reduce((sum, p) => sum + (p.discount || 0), 0), [sorted])
  const todayStr = new Date().toISOString().split('T')[0]
  const todayCollected = useMemo(() => sorted.filter((p) => p.paidAt === todayStr).reduce((sum, p) => sum + p.amount, 0), [sorted, todayStr])

  const fmt = (n: number) => n.toLocaleString()

  const methodLabel = (m: string) => m === 'cash' ? (bn ? 'নগদ' : 'Cash') : m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') : m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') : (bn ? 'অন্যান্য' : 'Other')

  const methodColor = (m: string) => m === 'cash' ? 'var(--green)' : m === 'bank' ? 'var(--brand)' : m === 'mobile' ? 'var(--teal)' : 'var(--text-muted)'

  const hasFilter = search || fMethod || dateFrom || dateTo

  const clearFilters = useCallback(() => {
    setSearch('')
    setFMethod('')
    setDateFrom('')
    setDateTo('')
  }, [])

  const getMonthLabel = (forMonth?: string) => {
    if (!forMonth) return '-'
    const [yr, mo] = forMonth.split('-').map(Number)
    return `${MONTH_LABELS[(mo || 1) - 1]}-${String(yr).slice(-2)}`
  }

  const pdfColumns = useMemo<PDFColumnDef[]>(() => [
    { key: 'date', label: 'Date', labelBn: 'তারিখ', default: true },
    { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', default: true },
    { key: 'fee', label: 'Fee', labelBn: 'ফি', default: true },
    { key: 'month', label: 'Month', labelBn: 'মাস', default: true },
    { key: 'amount', label: 'Amount', labelBn: 'পরিমাণ', default: true },
    { key: 'discount', label: 'Discount', labelBn: 'ছাড়', default: true },
    { key: 'method', label: 'Method', labelBn: 'পদ্ধতি', default: true },
    { key: 'note', label: 'Note', labelBn: 'নোট', default: false },
  ], [])

  const buildPdfRow = useCallback((p: FeePayment, selectedCols: string[]): Record<string, string | number> => {
    const sn = studentMap[p.studentId]
    const fn = structureMap[p.feeStructureId]
    const row: Record<string, string | number> = {}
    if (selectedCols.includes('date')) row[bn ? 'তারিখ' : 'Date'] = p.paidAt
    if (selectedCols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? (sn?.nameBn || sn?.nameEn || '') : (sn?.nameEn || '')
    if (selectedCols.includes('fee')) row[bn ? 'ফি' : 'Fee'] = bn ? (fn?.nameBn || fn?.name || '') : (fn?.name || '')
    if (selectedCols.includes('month')) row[bn ? 'মাস' : 'Month'] = getMonthLabel(p.forMonth)
    if (selectedCols.includes('amount')) row[bn ? 'পরিমাণ' : 'Amount'] = p.amount
    if (selectedCols.includes('discount')) row[bn ? 'ছাড়' : 'Discount'] = p.discount || 0
    if (selectedCols.includes('method')) row[bn ? 'পদ্ধতি' : 'Method'] = methodLabel(p.method)
    if (selectedCols.includes('note')) row[bn ? 'নোট' : 'Note'] = p.note || '-'
    return row
  }, [bn, studentMap, structureMap])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const rows = sorted.map((p) => buildPdfRow(p, opts.selectedCols))
    const summaryRow: Record<string, string | number> = {}
    summaryRow[bn ? 'তারিখ' : 'Date'] = ''
    summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    summaryRow[bn ? 'ফি' : 'Fee'] = ''
    summaryRow[bn ? 'মাস' : 'Month'] = ''
    if (opts.selectedCols.includes('amount')) summaryRow[bn ? 'পরিমাণ' : 'Amount'] = totalCollected
    if (opts.selectedCols.includes('discount')) summaryRow[bn ? 'ছাড়' : 'Discount'] = totalDiscount
    summaryRow[bn ? 'পদ্ধতি' : 'Method'] = ''
    summaryRow[bn ? 'নোট' : 'Note'] = ''
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
  }, [sorted, pdfColumns, bn, totalCollected, totalDiscount, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = sorted.slice(0, 20).map((p) => buildPdfRow(p, opts.selectedCols))
    const summaryRow: Record<string, string | number> = {}
    summaryRow[bn ? 'তারিখ' : 'Date'] = ''
    summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    summaryRow[bn ? 'ফি' : 'Fee'] = ''
    summaryRow[bn ? 'মাস' : 'Month'] = ''
    if (opts.selectedCols.includes('amount')) summaryRow[bn ? 'পরিমাণ' : 'Amount'] = totalCollected
    if (opts.selectedCols.includes('discount')) summaryRow[bn ? 'ছাড়' : 'Discount'] = totalDiscount
    summaryRow[bn ? 'পদ্ধতি' : 'Method'] = ''
    summaryRow[bn ? 'নোট' : 'Note'] = ''
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
  }, [sorted, pdfColumns, bn, totalCollected, totalDiscount, buildPdfRow])

  const exportExcel = useCallback(() => {
    const sheetData = sorted.map((p) => {
      const sn = studentMap[p.studentId]
      const fn = structureMap[p.feeStructureId]
      const row: Record<string, string | number> = {
        [bn ? 'তারিখ' : 'Date']: p.paidAt,
        [bn ? 'শিক্ষার্থী' : 'Student']: bn ? (sn?.nameBn || sn?.nameEn || '') : (sn?.nameEn || ''),
        [bn ? 'ফি' : 'Fee']: bn ? (fn?.nameBn || fn?.name || '') : (fn?.name || ''),
        [bn ? 'মাস' : 'Month']: getMonthLabel(p.forMonth),
        [bn ? 'পরিমাণ' : 'Amount']: p.amount,
        [bn ? 'ছাড়' : 'Discount']: p.discount || 0,
        [bn ? 'পদ্ধতি' : 'Method']: methodLabel(p.method),
        [bn ? 'নোট' : 'Note']: p.note || '-',
      }
      return row
    })
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'পেমেন্ট' : 'Payments')
    XLSX.writeFile(wb, `payments-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [sorted, bn, studentMap, structureMap])

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
            <p className="text-base font-bold text-[var(--text-primary)]">{sorted.length}</p>
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
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={bn ? 'পেমেন্ট খুঁজুন...' : 'Search payments...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} w-full pl-9 h-8 text-xs`}
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[var(--text-muted)]" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${inputCls} h-8 text-xs w-[130px]`}
            />
            <span className="text-[var(--text-muted)] text-xs">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${inputCls} h-8 text-xs w-[130px]`}
            />
          </div>

          {/* Clear Filters */}
          {hasFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.65rem] font-medium bg-[var(--red-light)] text-[var(--red)] border border-[var(--red)]/20 cursor-pointer transition-all hover:bg-[var(--red)]/20">
              <X size={10} />{bn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Method Filters */}
          <div className="flex items-center gap-1">
            <Filter size={11} className="text-[var(--text-muted)]" />
            {(['', 'cash', 'bank', 'mobile', 'other'] as const).map((m) => (
              <button key={m} onClick={() => setFMethod(m)} className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-medium border cursor-pointer transition-all ${fMethod === m ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]'}`}>
                {m ? methodLabel(m) : (bn ? 'সব' : 'All')}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Action Menu */}
          {sorted.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--brand)] cursor-pointer transition-all"
              >
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
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {bn ? 'কোনো পেমেন্ট নেই' : 'No payments found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'তারিখ' : 'Date'}</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ফি' : 'Fee'}</th>
                  <th className="text-center px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'মাস' : 'Month'}</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ছাড়' : 'Disc.'}</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'পদ্ধতি' : 'Method'}</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'নোট' : 'Note'}</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'কাজ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const sn = studentMap[p.studentId]
                  const fn = structureMap[p.feeStructureId]
                  return (
                    <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--brand-light)]/30 transition-colors">
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1.5"><Calendar size={10} />{p.paidAt}</div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-[var(--text-primary)] text-[11px]">{bn ? sn?.nameBn || sn?.nameEn : sn?.nameEn}</p>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{bn ? fn?.nameBn || fn?.name : fn?.name}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--brand-light)] text-[var(--brand)]">
                          {getMonthLabel(p.forMonth)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[var(--green)]">{fmt(p.amount)}</td>
                      <td className="px-3 py-2 text-right font-medium text-[var(--amber)]">{p.discount ? fmt(p.discount) : '-'}</td>
                      <td className="px-3 py-2">
                        <span className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full" style={{ background: `${methodColor(p.method)}12`, color: methodColor(p.method) }}>
                          {methodLabel(p.method)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-muted)] max-w-[100px] truncate text-[10px]">{p.note || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => onViewReceipt({ ...p, studentName: sn?.nameEn || '', studentNameBn: sn?.nameBn || '', feeName: fn?.name || '', feeNameBn: fn?.nameBn || '' })} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)] border-0 cursor-pointer hover:bg-[var(--brand)]/20 transition-colors" title={bn ? 'রসিদ' : 'Receipt'}>
                            <Eye size={11} />
                          </button>
                          <button onClick={() => { if (confirm(bn ? 'পেমেন্ট মুছে ফেলতে চান?' : 'Delete this payment?')) deletePayment(p.id) }} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer hover:bg-[var(--red)]/20 transition-colors" title={bn ? 'মুছুন' : 'Delete'}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Summary Row */}
              <tfoot>
                <tr className="border-t-2 border-[var(--brand)] bg-[var(--bg-secondary)] font-bold">
                  <td className="px-3 py-2 text-[10px] uppercase text-[var(--text-muted)]" colSpan={4}>{bn ? 'মোট' : 'Total'} ({sorted.length} {bn ? 'টি পেমেন্ট' : 'payments'})</td>
                  <td className="px-3 py-2 text-right text-sm text-[var(--green)]">{fmt(totalCollected)}</td>
                  <td className="px-3 py-2 text-right text-sm text-[var(--amber)]">{totalDiscount ? fmt(totalDiscount) : '-'}</td>
                  <td className="px-3 py-2" />
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
          count={sorted.length}
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
