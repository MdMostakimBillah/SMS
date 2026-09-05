import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Edit, Trash2, Plus, MoreVertical, ChevronDown, FileSpreadsheet, FileText, Eye } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useExpenseStore, PAYMENT_METHODS, type ExpenseEntry } from '@/store/expenseStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { ExpenseModal } from '../modals/ExpenseModal'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import ModernCheckbox from '@/components/ui/ModernCheckbox'

interface Props { searchQuery: string }

export const ExpensesTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { canCreate, canEdit, canDelete, canExport } = usePermission()
  const { categories, expenses, deleteExpense, toggleExpenseActive } = useExpenseStore()
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<ExpenseEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => { if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  const enriched = useMemo(() => expenses.map((e) => {
    const cat = categories.find((c) => c.id === e.categoryId)
    return { ...e, categoryName: cat ? (bn ? cat.nameBn : cat.name) : '—', categoryNameBn: cat?.nameBn || '—', paymentLabel: PAYMENT_METHODS.find((pm) => pm.value === e.paymentMethod) }
  }), [expenses, categories, bn])

  const filtered = useMemo(() => {
    let list = enriched
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((e) => e.description.toLowerCase().includes(q) || e.descriptionBn.includes(q) || e.categoryName.toLowerCase().includes(q) || e.categoryNameBn.includes(q))
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [enriched, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [searchQuery, perPage])
  useEffect(() => { setSelected(new Set()) }, [searchQuery, perPage])
  useEffect(() => {
    if (selected.size === 0) return
    const validIds = new Set(paginated.map((e) => e.id))
    setSelected((prev) => { const next = new Set<string>(); for (const id of prev) { if (validIds.has(id)) next.add(id) }; return next.size === prev.size ? prev : next })
  }, [paginated])

  const toggleAll = useCallback(() => {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map((e) => e.id)))
  }, [selected.size, paginated])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const handleExportExcel = () => {
    const data = selected.size > 0 ? filtered.filter((e) => selected.has(e.id)) : filtered
    const rows = data.map((e) => ({
      [bn ? 'তারিখ' : 'Date']: e.date,
      [bn ? 'ক্যাটাগরি' : 'Category']: e.categoryName,
      [bn ? 'পরিমাণ' : 'Amount']: e.amount,
      [bn ? 'বিবরণ' : 'Description']: bn ? e.descriptionBn : e.description,
      [bn ? 'পেমেন্ট' : 'Payment']: e.paymentLabel ? (bn ? e.paymentLabel.labelBn : e.paymentLabel.label) : e.paymentMethod,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'খরচ' : 'Expenses')
    XLSX.writeFile(wb, `expenses-${new Date().toISOString().split('T')[0]}.xlsx`)
    setShowActionMenu(false)
  }

  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'date', label: 'Date', labelBn: 'তারিখ', default: true },
    { key: 'category', label: 'Category', labelBn: 'ক্যাটাগরি', default: true },
    { key: 'amount', label: 'Amount', labelBn: 'পরিমাণ', default: true },
    { key: 'description', label: 'Description', labelBn: 'বিবরণ', default: true },
    { key: 'payment', label: 'Payment', labelBn: 'পেমেন্ট', default: true },
  ], [])

  const buildPdfRow = useCallback((e: (typeof filtered)[number], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('date')) row[bn ? 'তারিখ' : 'Date'] = e.date
    if (cols.includes('category')) row[bn ? 'ক্যাটাগরি' : 'Category'] = e.categoryName
    if (cols.includes('amount')) row[bn ? 'পরিমাণ' : 'Amount'] = e.amount
    if (cols.includes('description')) row[bn ? 'বিবরণ' : 'Description'] = bn ? e.descriptionBn : e.description
    if (cols.includes('payment')) row[bn ? 'পেমেন্ট' : 'Payment'] = e.paymentLabel ? (bn ? e.paymentLabel.labelBn : e.paymentLabel.label) : e.paymentMethod
    return row
  }, [bn])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const data = selected.size > 0 ? filtered.filter((e) => selected.has(e.id)) : filtered
    const rows = data.slice(0, 20).map((e, i) => {
      const row: Record<string, string> = { '#': String(i + 1) }
      for (const key of opts.selectedCols) {
        switch (key) {
          case 'date': row[bn ? 'তারিখ' : 'Date'] = e.date; break
          case 'category': row[bn ? 'ক্যাটাগরি' : 'Category'] = e.categoryName; break
          case 'amount': row[bn ? 'পরিমাণ' : 'Amount'] = `৳${e.amount.toLocaleString()}`; break
          case 'description': row[bn ? 'বিবরণ' : 'Description'] = bn ? e.descriptionBn : e.description; break
          case 'payment': row[bn ? 'পেমেন্ট' : 'Payment'] = e.paymentLabel ? (bn ? e.paymentLabel.labelBn : e.paymentLabel.label) : e.paymentMethod; break
        }
      }
      return row
    })
    const headers = ['#', ...opts.selectedCols.map((key) => { const col = pdfColumns.find((c) => c.key === key); return col ? (opts.isBn ? col.labelBn : col.label) : key })]
    const branding = getPDFBranding()
    const logo = pdfLogoHTML(branding, 28)
    const headerRow = headers.map((h) => `<th style="background:${branding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')
    const bodyRows = rows.map((r) => {
      const cells = [`<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r['#'] || ''}</td>`]
      for (const key of opts.selectedCols) { const col = pdfColumns.find((c) => c.key === key); const label = col ? (opts.isBn ? col.labelBn : col.label) : key; cells.push(`<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[label] || ''}</td>`) }
      return `<tr>${cells.join('')}</tr>`
    }).join('')
    const overflowNote = data.length > 20 ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${data.length - 20} more records</div>` : ''
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a"><div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${branding.brandColor};padding-bottom:8px;margin-bottom:10px">${logo}<div><div style="font-size:14px;font-weight:700;color:${branding.brandColor}">${branding.schoolName}</div><div style="font-size:9px;color:#666">${branding.address}</div></div></div><div style="font-size:13px;font-weight:700;color:${branding.brandColor};margin:8px 0">${opts.title}</div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>${overflowNote}</div>`
  }, [filtered, selected, bn, pdfColumns])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const data = selected.size > 0 ? filtered.filter((e) => selected.has(e.id)) : filtered
    const rows = data.map((e, i) => buildPdfRow(e, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyRows = rows.map((r) => { const cells = headers.map((h) => `<td>${r[h] ?? ''}</td>`).join(''); return `<tr>${cells}</tr>` }).join('')
    const headerCells = headers.map((h) => `<th>${h}</th>`).join('')
    const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table><div class="ftr">Generated: ${genDate}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, selected, pdfColumns, bn, buildPdfRow])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected.size > 0 && <span className="text-[11px] text-[var(--brand)] font-medium">{bn ? `${toBnNum(selected.size)} টি নির্বাচিত` : `${selected.size} selected`}</span>}
          <span className="text-[12px] text-[var(--text-secondary)]">{bn ? `মোট: ${toBnNum(filtered.length)}টি খরচ` : `Total: ${filtered.length} expenses`}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowActionMenu(!showActionMenu)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors cursor-pointer">
              <MoreVertical size={13} />{bn ? 'অ্যাকশন' : 'Action'}<ChevronDown size={12} />
            </button>
            {showActionMenu && (<>
              <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
              <div ref={actionMenuRef} className="absolute top-full right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-50 overflow-hidden">
                {canExport('finance.expenses.expenses') && (
                  <button onClick={handleExportExcel} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors"><FileSpreadsheet size={14} className="text-[var(--green)]" />{bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}</button>
                )}
                {canExport('finance.expenses.expenses') && <div className="h-px bg-[var(--border)] mx-2" />}
                {canExport('finance.expenses.expenses') && (
                  <button onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors"><FileText size={14} className="text-[var(--red)]" />{bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</button>
                )}
              </div>
            </>)}
          </div>
          {canCreate('finance.expenses.expenses') && (
            <button onClick={() => { setEditItem(null); setShowModal(true) }} className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-medium border-none cursor-pointer hover:opacity-90 transition-opacity">
              <Plus size={13} /> {bn ? 'নতুন খরচ' : 'Add Expense'}
            </button>
          )}
        </div>
      </div>
      <div className="rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="py-2.5 pl-4 pr-2"><ModernCheckbox checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} /></th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'তারিখ' : 'Date'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বিবরণ' : 'Description'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পেমেন্ট' : 'Payment'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো খরচ পাওয়া যায়নি' : 'No expenses found'}</td></tr>
              ) : paginated.map((e) => (
                <tr key={e.id} className={`border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--bg-tertiary)] ${selected.has(e.id) ? 'bg-[var(--brand)]/5' : ''}`}>
                  <td className="py-3 pl-4 pr-2"><ModernCheckbox checked={selected.has(e.id)} onChange={() => { setSelected((prev) => { const next = new Set(prev); if (next.has(e.id)) next.delete(e.id); else next.add(e.id); return next }) }} /></td>
                  <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-primary)]">{e.date}</td>
                  <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-primary)]">{e.categoryName}</td>
                  <td className="py-3 px-4 text-center text-[0.8125rem] font-bold text-[var(--red)]">{fmt(e.amount)}</td>
                  <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-primary)] max-w-[200px] truncate">{bn ? e.descriptionBn || e.description : e.description}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                      {e.paymentLabel ? (bn ? e.paymentLabel.labelBn : e.paymentLabel.label) : e.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${e.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                      {e.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      {canEdit('finance.expenses.expenses') && (
                        <button onClick={() => { setEditItem(e); setShowModal(true) }} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors"><Edit size={13} /></button>
                      )}
                      {canEdit('finance.expenses.expenses') && (
                        <button onClick={() => toggleExpenseActive(e.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors" title={e.isActive ? (bn ? 'নিষ্ক্রিয়' : 'Deactivate') : (bn ? 'সক্রিয়' : 'Activate')}><Eye size={13} /></button>
                      )}
                      {canDelete('finance.expenses.expenses') && (
                        <button onClick={() => setDeleteId(e.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} />
      {showModal && <ExpenseModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}
      {deleteId && <DeleteConfirmDialog title={bn ? 'খরচ মুছে ফেলুন?' : 'Delete expense?'} message={bn ? 'এই খরচটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This expense will be permanently deleted.'} onConfirm={() => { deleteExpense(deleteId); setDeleteId(null) }} onCancel={() => setDeleteId(null)} isBn={bn} />}
      {showPdfModal && <GenericPDFOptionsModal columns={pdfColumns} defaultTitle={bn ? 'খরচ' : 'Expenses'} defaultTitleBn="খরচ" recordLabel={bn ? 'খরচ' : 'expense'} recordLabelBn="খরচ" count={selected.size > 0 ? selected.size : filtered.length} isBn={bn} previewRenderer={pdfPreviewRenderer} onDownload={(opts: GenericPDFOptionsResult) => { setShowPdfModal(false); handlePdfDownload(opts) }} onClose={() => setShowPdfModal(false)} />}
    </div>
  )
}
