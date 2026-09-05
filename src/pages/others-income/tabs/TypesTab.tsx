import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Edit, Trash2, Plus, MoreVertical, ChevronDown, Tag, FileSpreadsheet, FileText, Eye } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useOthersIncomeStore, type OthersIncomeCategory } from '@/store/othersIncomeStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { CategoryModal } from '../modals/CategoryModal'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import ModernCheckbox from '@/components/ui/ModernCheckbox'

interface Props {
  searchQuery: string
}

export const TypesTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { canCreate, canEdit, canDelete, canExport } = usePermission()
  const { categories, deleteCategory, toggleCategoryActive } = useOthersIncomeStore()

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<OthersIncomeCategory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  const filtered = useMemo(() => {
    let list = categories
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.nameBn.includes(q))
    }
    return list
  }, [categories, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [searchQuery, perPage])

  useEffect(() => { setSelected(new Set()) }, [searchQuery, perPage])

  useEffect(() => {
    if (selected.size === 0) return
    const validIds = new Set(paginated.map((c) => c.id))
    setSelected((prev) => {
      const next = new Set<string>()
      for (const id of prev) { if (validIds.has(id)) next.add(id) }
      return next.size === prev.size ? prev : next
    })
  }, [paginated])

  const toggleAll = useCallback(() => {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map((c) => c.id)))
    }
  }, [selected.size, paginated])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const handleExportExcel = () => {
    const data = selected.size > 0 ? filtered.filter((c) => selected.has(c.id)) : filtered
    const rows = data.map((c) => ({
      [bn ? 'নাম' : 'Name']: bn ? c.nameBn : c.name,
      [bn ? 'পরিমাণ' : 'Amount']: c.amount,
      [bn ? 'ধরন' : 'Type']: c.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time'),
      [bn ? 'স্ট্যাটাস' : 'Status']: c.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'অন্যান্য আয়ের ক্যাটাগরি' : 'Others Income Categories')
    XLSX.writeFile(wb, `others-income-categories-${new Date().toISOString().split('T')[0]}.xlsx`)
    setShowActionMenu(false)
  }

  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'name', label: 'Name', labelBn: 'নাম', default: true },
    { key: 'amount', label: 'Amount', labelBn: 'পরিমাণ', default: true },
    { key: 'type', label: 'Type', labelBn: 'ধরন', default: true },
  ], [])

  const buildPdfRow = useCallback((c: (typeof filtered)[number], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('name')) row[bn ? 'নাম' : 'Name'] = bn ? c.nameBn : c.name
    if (cols.includes('amount')) row[bn ? 'পরিমাণ' : 'Amount'] = c.amount
    if (cols.includes('type')) row[bn ? 'ধরন' : 'Type'] = c.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')
    return row
  }, [bn])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const data = selected.size > 0 ? filtered.filter((c) => selected.has(c.id)) : filtered
    const rows = data.slice(0, 20).map((c, i) => {
      const row: Record<string, string> = { '#': String(i + 1) }
      for (const key of opts.selectedCols) {
        switch (key) {
          case 'name': row[bn ? 'নাম' : 'Name'] = bn ? c.nameBn : c.name; break
          case 'amount': row[bn ? 'পরিমাণ' : 'Amount'] = `৳${c.amount.toLocaleString()}`; break
          case 'type': row[bn ? 'ধরন' : 'Type'] = c.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time'); break
        }
      }
      return row
    })

    const headers = ['#', ...opts.selectedCols.map((key) => {
      const col = pdfColumns.find((c) => c.key === key)
      return col ? (opts.isBn ? col.labelBn : col.label) : key
    })]

    const branding = getPDFBranding()
    const logo = pdfLogoHTML(branding, 28)
    const headerRow = headers.map((h) => `<th style="background:${branding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')
    const bodyRows = rows.map((r) => {
      const cells = [`<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r['#'] || ''}</td>`]
      for (const key of opts.selectedCols) {
        const col = pdfColumns.find((c) => c.key === key)
        const label = col ? (opts.isBn ? col.labelBn : col.label) : key
        cells.push(`<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[label] || ''}</td>`)
      }
      return `<tr>${cells.join('')}</tr>`
    }).join('')

    const overflowNote = data.length > 20
      ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${data.length - 20} more records</div>`
      : ''

    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a"><div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${branding.brandColor};padding-bottom:8px;margin-bottom:10px">${logo}<div><div style="font-size:14px;font-weight:700;color:${branding.brandColor}">${branding.schoolName}</div><div style="font-size:9px;color:#666">${branding.address}</div></div></div><div style="font-size:13px;font-weight:700;color:${branding.brandColor};margin:8px 0">${opts.title}</div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>${overflowNote}</div>`
  }, [filtered, selected, bn, pdfColumns])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const data = selected.size > 0 ? filtered.filter((c) => selected.has(c.id)) : filtered
    const rows = data.map((c, i) => buildPdfRow(c, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyRows = rows.map((r) => {
      const cells = headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    const headerCells = headers.map((h) => `<th>${h}</th>`).join('')
    const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table><div class="ftr">Generated: ${genDate}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, selected, pdfColumns, bn, buildPdfRow])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <span className="text-[11px] text-[var(--brand)] font-medium">{bn ? `${toBnNum(selected.size)} টি নির্বাচিত` : `${selected.size} selected`}</span>
          )}
          <span className="text-[12px] text-[var(--text-secondary)]">
            {bn ? `মোট: ${toBnNum(filtered.length)}টি ক্যাটাগরি` : `Total: ${filtered.length} categories`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowActionMenu(!showActionMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors cursor-pointer">
              <MoreVertical size={13} />
              {bn ? 'অ্যাকশন' : 'Action'}
              <ChevronDown size={12} />
            </button>
            {showActionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                <div ref={actionMenuRef} className="absolute top-full right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-50 overflow-hidden">
                  {canExport('finance.others_income') && (
                    <button onClick={handleExportExcel} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors">
                      <FileSpreadsheet size={14} className="text-[var(--green)]" />
                      {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                    </button>
                  )}
                  {canExport('finance.others_income') && <div className="h-px bg-[var(--border)] mx-2" />}
                  {canExport('finance.others_income') && (
                    <button onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors">
                      <FileText size={14} className="text-[var(--red)]" />
                      {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          {canCreate('finance.others_income') && (
            <button onClick={() => { setEditItem(null); setShowModal(true) }}
              className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-medium border-none cursor-pointer hover:opacity-90 transition-opacity">
              <Plus size={13} /> {bn ? 'নতুন ক্যাটাগরি' : 'Add Category'}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="py-2.5 pl-3 pr-2">
                  <ModernCheckbox checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} />
                </th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'নাম' : 'Name'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ধরন' : 'Type'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো ক্যাটাগরি পাওয়া যায়নি' : 'No categories found'}</td></tr>
              ) : paginated.map((c) => (
                <tr key={c.id} className={`border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface)] ${selected.has(c.id) ? 'bg-[var(--brand)]/5' : ''}`}>
                  <td className="py-2.5 pl-3 pr-2">
                    <ModernCheckbox checked={selected.has(c.id)} onChange={() => {
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (next.has(c.id)) next.delete(c.id)
                        else next.add(c.id)
                        return next
                      })
                    }} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand)18', color: 'var(--brand)' }}>
                        <Tag size={13} />
                      </div>
                      <div className="text-left">
                        <div className="text-[12px] font-semibold text-[var(--text-primary)]">{bn ? c.nameBn : c.name}</div>
                        {c.description && <div className="text-[10px] text-[var(--text-muted)]">{bn ? c.descriptionBn : c.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[12px] font-bold text-[var(--brand)]">{fmt(c.amount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${c.type === 'monthly' ? 'bg-[var(--teal-light)] text-[var(--teal)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
                      {c.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${c.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                      {c.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      {canEdit('finance.others_income') && (
                        <button onClick={() => { setEditItem(c); setShowModal(true) }} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                          <Edit size={13} />
                        </button>
                      )}
                      {canEdit('finance.others_income') && (
                        <button onClick={() => toggleCategoryActive(c.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors" title={c.isActive ? (bn ? 'নিষ্ক্রিয়' : 'Deactivate') : (bn ? 'সক্রিয়' : 'Activate')}>
                          <Eye size={13} />
                        </button>
                      )}
                      {canDelete('finance.others_income') && (
                        <button onClick={() => setDeleteId(c.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
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

      {showModal && <CategoryModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}
      {deleteId && <DeleteConfirmDialog title={bn ? 'ক্যাটাগরি মুছে ফেলুন?' : 'Delete category?'} message={bn ? 'এই ক্যাটাগরি এবং এর সব বরাদ্দ স্থায়ীভাবে মুছে ফেলা হবে।' : 'This category and all its assignments will be permanently deleted.'} onConfirm={() => { deleteCategory(deleteId); setDeleteId(null) }} onCancel={() => setDeleteId(null)} isBn={bn} />}
      {showPdfModal && <GenericPDFOptionsModal columns={pdfColumns} defaultTitle={bn ? 'অন্যান্য আয়ের ক্যাটাগরি' : 'Others Income Categories'} defaultTitleBn="অন্যান্য আয়ের ক্যাটাগরি" recordLabel={bn ? 'ক্যাটাগরি' : 'category'} recordLabelBn="ক্যাটাগরি" count={selected.size > 0 ? selected.size : filtered.length} isBn={bn} previewRenderer={pdfPreviewRenderer} onDownload={(opts: GenericPDFOptionsResult) => { setShowPdfModal(false); handlePdfDownload(opts) }} onClose={() => setShowPdfModal(false)} />}
    </div>
  )
}
