import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'
import { ShoppingBag, Receipt, Filter, X, Trash2, CheckSquare, Square, MoreVertical, ChevronDown, FileSpreadsheet, FileText, Search } from 'lucide-react'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { XLSX } from '@/lib/excelExport'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  isMobile: boolean
  searchQuery: string
}

export const SalesTab = ({ isMobile: _isMobile, searchQuery }: Props) => {
  const bn = useBn()
  const sales = useStoreStore((s) => s.sales)
  const categories = useStoreStore((s) => s.categories)
  const products = useStoreStore((s) => s.products)
  const deleteSale = useStoreStore((s) => s.deleteSale)

  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [filterPayment, setFilterPayment] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [quickSearch, setQuickSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  const paymentLabels: Record<string, { en: string; bn: string }> = {
    cash: { en: 'Cash', bn: 'নগদ' },
    bank: { en: 'Bank', bn: 'ব্যাংক' },
    mobile: { en: 'Mobile', bn: 'মোবাইল' },
    other: { en: 'Other', bn: 'অন্যান্য' },
  }

  const isFeeCollect = (s: typeof sales[number]) => s.note?.includes('Fee Collect')
  const getReceiptNo = (note: string) => note?.match(/RCP-\w+/)?.[0] || ''

  const filtered = useMemo(() => {
    let list = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.soldToName.toLowerCase().includes(q) || s.soldToNameBn.includes(q) || s.soldToClass.includes(q) || s.id.toLowerCase().includes(q) || s.items.some((i) => i.productName.toLowerCase().includes(q) || i.productNameBn.includes(q)))
    }
    if (quickSearch) {
      const q = quickSearch.toLowerCase()
      list = list.filter((s) => s.soldToName.toLowerCase().includes(q) || s.soldToNameBn.includes(q) || s.soldToId.toLowerCase().includes(q) || s.soldToClass.includes(q) || getReceiptNo(s.note).toLowerCase().includes(q) || s.items.some((i) => i.productName.toLowerCase().includes(q) || i.productNameBn.includes(q)))
    }
    if (dateFrom) list = list.filter((s) => s.createdAt >= dateFrom)
    if (dateTo) list = list.filter((s) => s.createdAt <= dateTo + 'T23:59:59')
    if (filterPayment) list = list.filter((s) => s.paymentMethod === filterPayment)
    if (filterCategory) {
      const catProductIds = new Set(products.filter((p) => p.categoryId === filterCategory).map((p) => p.id))
      list = list.filter((s) => s.items.some((i) => catProductIds.has(i.productId)))
    }
    return list
  }, [sales, searchQuery, quickSearch, dateFrom, dateTo, filterPayment, filterCategory, products])

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0)
  const totalItems = filtered.reduce((sum, s) => sum + s.items.reduce((is2, i) => is2 + i.qty, 0), 0)
  const feeCollectCount = filtered.filter((s) => isFeeCollect(s)).length
  const directCount = filtered.length - feeCollectCount
  const hasActiveFilters = dateFrom || dateTo || filterPayment || filterCategory || quickSearch

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set()); else setSelected(new Set(filtered.map((s) => s.id)))
  }
  const deleteSelected = () => {
    if (!confirm(bn ? 'নির্বাচিত বিক্রয় মুছে ফেলতে চান?' : 'Delete selected sales?')) return
    selected.forEach((id) => deleteSale(id))
    setSelected(new Set())
  }

  const clearFilters = () => { setDateFrom(''); setDateTo(''); setFilterPayment(''); setFilterCategory(''); setQuickSearch('') }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(bn ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString(bn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })

  // ─── PDF ────────────────────────────────────────────────────────────
  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'date', label: 'Date', labelBn: 'তারিখ', default: true },
    { key: 'receipt', label: 'Receipt', labelBn: 'রসিদ', default: true },
    { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', default: true },
    { key: 'class', label: 'Class', labelBn: 'শ্রেণি', default: true },
    { key: 'items', label: 'Items', labelBn: 'পণ্য', default: true },
    { key: 'payment', label: 'Payment', labelBn: 'পেমেন্ট', default: true },
    { key: 'total', label: 'Total', labelBn: 'মোট', default: true },
  ], [])

  const buildPdfRow = useCallback((s: typeof sales[number], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    const receipt = getReceiptNo(s.note)
    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('date')) row[bn ? 'তারিখ' : 'Date'] = formatDate(s.createdAt)
    if (cols.includes('receipt')) row[bn ? 'রসিদ' : 'Receipt'] = receipt + (isFeeCollect(s) ? ' (Fee)' : '')
    if (cols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? s.soldToNameBn : s.soldToName
    if (cols.includes('class')) row[bn ? 'শ্রেণি' : 'Class'] = `${s.soldToClass}${s.soldToSection ? '-' + s.soldToSection : ''}`
    if (cols.includes('items')) row[bn ? 'পণ্য' : 'Items'] = s.items.map((i) => `${bn ? i.productNameBn : i.productName}×${i.qty}`).join(', ')
    if (cols.includes('payment')) row[bn ? 'পেমেন্ট' : 'Payment'] = paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en'] || s.paymentMethod
    if (cols.includes('total')) row[bn ? 'মোট' : 'Total'] = s.total
    return row
  }, [bn])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const data = selected.size > 0 ? filtered.filter((s) => selected.has(s.id)) : filtered
    const rows = data.map((s, i) => buildPdfRow(s, opts.selectedCols, i))
    const totalRow: Record<string, string | number> = {}
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    totalRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    totalRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('total')) totalRow[bn ? 'মোট' : 'Total'] = data.reduce((s, r) => s + r.total, 0)
    rows.push(totalRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${i === rows.length - 1 ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, selected, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const data = selected.size > 0 ? filtered.filter((s) => selected.has(s.id)) : filtered
    const rows = data.slice(0, 20).map((s, i) => buildPdfRow(s, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a"><div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:8px;margin-bottom:10px">${pdfLogoHTML(pdfBranding, 28)}<div><div style="font-size:14px;font-weight:700;color:${pdfBranding.brandColor}">${pdfBranding.schoolName}</div><div style="font-size:9px;color:#666">${pdfBranding.address}</div></div></div><div style="font-size:13px;font-weight:700;color:${pdfBranding.brandColor};margin:8px 0">${opts.title}</div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headers.map((h) => `<th style="background:${pdfBranding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>${data.length > 20 ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${data.length - 20} more records</div>` : ''}</div>`
  }, [filtered, selected, pdfColumns, bn, buildPdfRow])

  // ─── Excel ──────────────────────────────────────────────────────────
  const exportExcel = useCallback(() => {
    const data = selected.size > 0 ? filtered.filter((s) => selected.has(s.id)) : filtered
    const sheetData = data.map((s, idx) => ({
      [bn ? 'ক্রমিক' : 'S/N']: idx + 1,
      [bn ? 'তারিখ' : 'Date']: formatDate(s.createdAt),
      [bn ? 'সময়' : 'Time']: formatTime(s.createdAt),
      [bn ? 'রসিদ' : 'Receipt']: getReceiptNo(s.note) + (isFeeCollect(s) ? ' (Fee)' : ''),
      [bn ? 'শিক্ষার্থী' : 'Student']: bn ? s.soldToNameBn : s.soldToName,
      [bn ? 'শ্রেণি' : 'Class']: `${s.soldToClass}${s.soldToSection ? '-' + s.soldToSection : ''}`,
      [bn ? 'পণ্য' : 'Items']: s.items.map((i) => `${bn ? i.productNameBn : i.productName} ×${i.qty}`).join(', '),
      [bn ? 'পেমেন্ট' : 'Payment']: paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en'] || s.paymentMethod,
      [bn ? 'মোট' : 'Total']: s.total,
    }))
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'বিক্রয়' : 'Sales')
    XLSX.writeFile(wb, `store-sales-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, selected, bn])

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: bn ? 'মোট বিক্রয়' : 'Total Sales', value: bn ? toBnNum(filtered.length) : String(filtered.length), sub: `${totalItems} ${bn ? 'পণ্য' : 'items'}`, icon: <Receipt size={14} />, color: 'var(--brand)' },
          { label: bn ? 'মোট আয়' : 'Total Revenue', value: bn ? `৳${toBnNum(totalRevenue)}` : `৳${totalRevenue.toLocaleString()}`, icon: <ShoppingBag size={14} />, color: 'var(--green)' },
          { label: bn ? 'ফি কালেক্ট' : 'Fee Collect', value: bn ? toBnNum(feeCollectCount) : String(feeCollectCount), icon: <Receipt size={14} />, color: 'var(--teal)' },
          { label: bn ? 'সরাসরি বিক্রয়' : 'Direct Sale', value: bn ? toBnNum(directCount) : String(directCount), icon: <ShoppingBag size={14} />, color: 'var(--amber)' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div className="min-w-0">
              <div className="font-bold text-[0.9375rem] text-[var(--text-primary)] leading-tight">{s.value}</div>
              <div className="text-[0.625rem] text-[var(--text-secondary)] whitespace-nowrap">{s.label}</div>
              {'sub' in s && s.sub && <div className="text-[0.5625rem] text-[var(--text-muted)] mt-0.5">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium border transition-colors cursor-pointer ${showFilters || hasActiveFilters ? 'bg-[var(--brand)]/8 text-[var(--brand)] border-[var(--brand)]/30' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--text-muted)]/30 hover:border-[var(--brand)]/40'}`}>
            <Filter size={14} />
            {bn ? 'ফিল্টার' : 'Filters'}
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
          </button>
          {selected.size > 0 && (
            <button onClick={deleteSelected}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium bg-red-500/8 text-red-500 border border-red-500/20 hover:bg-red-500/15 transition-colors cursor-pointer">
              <Trash2 size={14} />
              {bn ? `নির্বাচিত (${selected.size}) মুছুন` : `Delete (${selected.size})`}
            </button>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="relative">
            <button onClick={() => setShowActionMenu(!showActionMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium bg-[var(--surface)] border border-[var(--text-muted)]/30 text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors cursor-pointer">
              <MoreVertical size={14} />
              {bn ? 'অ্যাকশন' : 'Action'}
              <ChevronDown size={12} />
            </button>
            {showActionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                <div ref={actionMenuRef}
                  className="absolute top-full right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-50 overflow-hidden">
                  <button onClick={() => { exportExcel(); setShowActionMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors">
                    <FileSpreadsheet size={14} className="text-[var(--green)]" />
                    {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                  </button>
                  <div className="h-px bg-[var(--border)] mx-2" />
                  <button onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors">
                    <FileText size={14} className="text-[var(--red)]" />
                    {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input type="text" value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)} placeholder={bn ? 'শিক্ষার্থী, পণ্য, রসিদ খুঁজুন...' : 'Search student, product, receipt...'}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors placeholder:text-[var(--text-muted)]" />
        {quickSearch && (
          <button onClick={() => setQuickSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors" />
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors cursor-pointer">
            <option value="">{bn ? 'সব পেমেন্ট' : 'All Payments'}</option>
            <option value="cash">{bn ? 'নগদ' : 'Cash'}</option>
            <option value="bank">{bn ? 'ব্যাংক' : 'Bank'}</option>
            <option value="mobile">{bn ? 'মোবাইল' : 'Mobile'}</option>
            <option value="other">{bn ? 'অন্যান্য' : 'Other'}</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors cursor-pointer">
            <option value="">{bn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[0.75rem] text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer">
              <X size={12} />{bn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[var(--text-secondary)] text-[0.875rem] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50">
          {bn ? 'কোনো বিক্রয় পাওয়া যায়নি' : 'No sales found'}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="w-10 py-2.5 px-3">
                    <button onClick={toggleAll} className="cursor-pointer" title={bn ? 'সব নির্বাচন' : 'Select all'}>
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={15} className="text-[var(--brand)]" />
                        : <Square size={15} className="text-[var(--text-muted)]" />}
                    </button>
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">#</th>
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'তারিখ' : 'Date'}</th>
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'রসিদ' : 'Receipt'}</th>
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'পণ্য' : 'Items'}</th>
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'পেমেন্ট' : 'Payment'}</th>
                  <th className="text-right py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'মোট' : 'Total'}</th>
                  <th className="text-center py-2.5 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => {
                  const receipt = getReceiptNo(s.note)
                  const isSelected = selected.has(s.id)
                  return (
                    <tr key={s.id}
                      className={`border-t border-[var(--border)] transition-colors ${isSelected ? 'bg-[var(--brand)]/5' : 'hover:!bg-[var(--brand)]/5'}`}
                      style={!isSelected ? { backgroundColor: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' } : undefined}>
                      <td className="py-2.5 px-3">
                        <button onClick={() => toggleSelect(s.id)} className="cursor-pointer" title={bn ? 'নির্বাচন' : 'Select'}>
                          {isSelected ? <CheckSquare size={15} className="text-[var(--brand)]" /> : <Square size={15} className="text-[var(--text-muted)]" />}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-[0.75rem] text-[var(--text-muted)]">{bn ? toBnNum(idx + 1) : idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-[0.75rem] text-[var(--text-primary)]">{formatDate(s.createdAt)}</div>
                        <div className="text-[0.625rem] text-[var(--text-muted)]">{formatTime(s.createdAt)}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {receipt && <span className="px-2 py-0.5 rounded-md bg-[var(--brand)]/8 text-[var(--brand)] text-[0.625rem] font-mono font-medium">{receipt}</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[0.75rem] font-medium text-[var(--text-primary)]">{bn ? s.soldToNameBn : s.soldToName}</div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">{s.soldToId}</div>
                        <div className="text-[0.625rem] text-[var(--text-muted)]">{bn ? `শ্রেণি ${s.soldToClass}` : `Class ${s.soldToClass}`}{s.soldToSection ? ` — ${s.soldToSection}` : ''}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {s.items.map((item, i) => (
                            <span key={i} className="inline-flex items-center text-[0.6875rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded whitespace-nowrap">
                              {bn ? item.productNameBn : item.productName}<span className="ml-0.5 font-medium text-[var(--text-primary)]">×{item.qty}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[0.6875rem] text-[var(--text-secondary)]">
                          {paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en']}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">৳{bn ? toBnNum(s.total) : s.total.toLocaleString()}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button onClick={() => { if (confirm(bn ? 'এই বিক্রয় মুছে ফেলতে চান?' : 'Delete this sale?')) deleteSale(s.id) }}
                          className="p-1 rounded text-[var(--text-muted)] cursor-pointer hover:text-red-500 hover:bg-red-500/10 transition-colors" title={bn ? 'মুছুন' : 'Delete'}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="School Store — Sales Report"
          defaultTitleBn="স্কুল স্টোর — বিক্রয় রিপোর্ট"
          recordLabel="sale"
          recordLabelBn="বিক্রয়"
          count={filtered.length}
          isBn={bn}
          showColumns={true}
          previewRenderer={pdfPreviewRenderer}
          onClose={() => setShowPdfModal(false)}
          onDownload={handlePdfDownload}
        />
      )}
    </div>
  )
}
