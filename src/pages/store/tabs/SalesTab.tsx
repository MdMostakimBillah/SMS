import { useState, useMemo, useCallback } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'
import { ShoppingBag, Receipt, Download, Filter, X } from 'lucide-react'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  isMobile: boolean
  searchQuery: string
}

export const SalesTab = ({ isMobile: _isMobile, searchQuery }: Props) => {
  const bn = useBn()
  const sales = useStoreStore((s) => s.sales)
  const deleteSale = useStoreStore((s) => s.deleteSale)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)

  const paymentLabels: Record<string, { en: string; bn: string }> = {
    cash: { en: 'Cash', bn: 'নগদ' },
    bank: { en: 'Bank', bn: 'ব্যাংক' },
    mobile: { en: 'Mobile', bn: 'মোবাইল' },
    other: { en: 'Other', bn: 'অন্যান্য' },
  }

  const isFeeCollect = (s: typeof sales[number]) => s.note?.includes('Fee Collect')

  const filtered = useMemo(() => {
    let list = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.soldToName.toLowerCase().includes(q) || s.soldToNameBn.includes(q) || s.soldToClass.includes(q) || s.id.toLowerCase().includes(q) || s.items.some((i) => i.productName.toLowerCase().includes(q) || i.productNameBn.includes(q)))
    }
    if (dateFrom) list = list.filter((s) => s.createdAt >= dateFrom)
    if (dateTo) list = list.filter((s) => s.createdAt <= dateTo + 'T23:59:59')
    if (filterPayment) list = list.filter((s) => s.paymentMethod === filterPayment)
    if (filterSource === 'feecollect') list = list.filter((s) => isFeeCollect(s))
    if (filterSource === 'direct') list = list.filter((s) => !isFeeCollect(s))
    return list
  }, [sales, searchQuery, dateFrom, dateTo, filterPayment, filterSource])

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0)
  const totalItems = filtered.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.qty, 0), 0)
  const feeCollectCount = filtered.filter((s) => isFeeCollect(s)).length
  const directCount = filtered.length - feeCollectCount
  const hasActiveFilters = dateFrom || dateTo || filterPayment || filterSource

  const clearFilters = () => { setDateFrom(''); setDateTo(''); setFilterPayment(''); setFilterSource('') }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(bn ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString(bn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getReceiptNo = (note: string) => {
    const match = note?.match(/RCP-\w+/)
    return match ? match[0] : ''
  }

  // PDF
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
    const rows = filtered.map((s, i) => buildPdfRow(s, opts.selectedCols, i))
    const totalRow: Record<string, string | number> = {}
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    totalRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    totalRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('total')) totalRow[bn ? 'মোট' : 'Total'] = totalRevenue
    rows.push(totalRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${i === rows.length - 1 ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, pdfColumns, bn, totalRevenue, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = filtered.slice(0, 20).map((s, i) => buildPdfRow(s, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a">
      <div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:8px;margin-bottom:10px">
        ${pdfLogoHTML(pdfBranding, 28)}
        <div><div style="font-size:14px;font-weight:700;color:${pdfBranding.brandColor}">${pdfBranding.schoolName}</div>
        <div style="font-size:9px;color:#666">${pdfBranding.address}</div></div></div>
      <div style="font-size:13px;font-weight:700;color:${pdfBranding.brandColor};margin:8px 0">${opts.title}</div>
      <table style="width:100%;border-collapse:collapse;font-size:10px">
        <thead><tr>${headers.map((h) => `<th style="background:${pdfBranding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      ${filtered.length > 20 ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${filtered.length - 20} more records</div>` : ''}
    </div>`
  }, [filtered, pdfColumns, bn, buildPdfRow])

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
          <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)] hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[1rem] text-[var(--text-primary)] leading-tight">{s.value}</div>
              <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{s.label}</div>
              {'sub' in s && s.sub && <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar + PDF button */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium border transition-colors cursor-pointer ${showFilters || hasActiveFilters ? 'bg-[var(--brand)]/8 text-[var(--brand)] border-[var(--brand)]/20' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/30'}`}>
          <Filter size={14} />
          {bn ? 'ফিল্টার' : 'Filters'}
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
        </button>
        <button onClick={() => setShowPdfModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/30 hover:text-[var(--brand)] transition-colors cursor-pointer">
          <Download size={14} />
          {bn ? 'PDF' : 'PDF'}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{bn ? 'ফিল্টার অপশন' : 'Filter Options'}</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-[0.6875rem] text-red-500 cursor-pointer hover:underline">
                <X size={12} />{bn ? 'মুছুন' : 'Clear'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'শুরু' : 'From'}</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] transition-colors" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'শেষ' : 'To'}</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] transition-colors" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'পেমেন্ট' : 'Payment'}</label>
              <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                <option value="">{bn ? 'সব' : 'All'}</option>
                <option value="cash">{bn ? 'নগদ' : 'Cash'}</option>
                <option value="bank">{bn ? 'ব্যাংক' : 'Bank'}</option>
                <option value="mobile">{bn ? 'মোবাইল' : 'Mobile'}</option>
                <option value="other">{bn ? 'অন্যান্য' : 'Other'}</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'উৎস' : 'Source'}</label>
              <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                <option value="">{bn ? 'সব' : 'All'}</option>
                <option value="feecollect">{bn ? 'ফি কালেক্ট' : 'Fee Collect'}</option>
                <option value="direct">{bn ? 'সরাসরি' : 'Direct'}</option>
              </select>
            </div>
          </div>
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
                  <th className="text-left py-3 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'তারিখ' : 'Date'}</th>
                  <th className="text-left py-3 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'রসিদ' : 'Receipt'}</th>
                  <th className="text-left py-3 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left py-3 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'পণ্য' : 'Items'}</th>
                  <th className="text-left py-3 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'পেমেন্ট' : 'Payment'}</th>
                  <th className="text-right py-3 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'মোট' : 'Total'}</th>
                  <th className="text-right py-3 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => {
                  const receipt = getReceiptNo(s.note)
                  const fromFee = isFeeCollect(s)
                  return (
                    <tr key={s.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-muted)]">{bn ? toBnNum(idx + 1) : idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{formatDate(s.createdAt)}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)]">{formatTime(s.createdAt)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {receipt && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--brand)]/8 text-[var(--brand)] text-[0.625rem] font-mono font-semibold">
                              {receipt}
                            </span>
                          )}
                          {fromFee && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[var(--teal)]/10 text-[var(--teal)] text-[0.5625rem] font-bold uppercase tracking-wider">
                              {bn ? 'ফি' : 'FEE'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{bn ? s.soldToNameBn : s.soldToName}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)]">{bn ? `শ্রেণি ${s.soldToClass}` : `Class ${s.soldToClass}`}{s.soldToSection ? ` — ${s.soldToSection}` : ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {s.items.map((item, i) => (
                            <span key={i} className="inline-flex items-center text-[0.625rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md whitespace-nowrap">
                              {bn ? item.productNameBn : item.productName} <span className="ml-1 font-semibold text-[var(--text-primary)]">×{item.qty}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-secondary)]">
                          {paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en']}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[0.9375rem] font-bold text-[var(--text-primary)]">৳{bn ? toBnNum(s.total) : s.total.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => { if (confirm(bn ? 'এই বিক্রয় মুছে ফেলতে চান?' : 'Delete this sale?')) deleteSale(s.id) }}
                          className="px-2.5 py-1 rounded-md text-[0.6875rem] text-red-500 cursor-pointer hover:bg-red-500/10 transition-colors">
                          {bn ? 'মুছুন' : 'Delete'}
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
