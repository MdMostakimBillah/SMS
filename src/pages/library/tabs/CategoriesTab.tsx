import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Tag, Pencil, Trash2, Plus, MoreVertical, ChevronDown, FileSpreadsheet, FileText, Eye } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { GenericPDFOptionsModal, type PDFColumnDef, type GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { CategoryModal } from '../modals/CategoryModal'
import type { BookCategory } from '../types'

interface Props {
  searchQuery: string
}

const pdfColumns: PDFColumnDef[] = [
  { key: 'name', label: 'Name', labelBn: 'নাম', default: true },
  { key: 'description', label: 'Description', labelBn: 'বিবরণ', default: true },
  { key: 'books', label: 'Books', labelBn: 'বই', default: true },
  { key: 'status', label: 'Status', labelBn: 'অবস্থা', default: true },
]

export function CategoriesTab({ searchQuery }: Props) {
  const bn = useBn()
  const categories = useLibraryStore((s) => s.categories)
  const books = useLibraryStore((s) => s.books)
  const deleteCategory = useLibraryStore((s) => s.deleteCategory)
  const toggleCategoryActive = useLibraryStore((s) => s.toggleCategoryActive)

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<BookCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BookCategory | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  const enriched = useMemo(() => {
    return categories.map((c) => ({
      ...c,
      bookCount: books.filter((b) => b.categoryId === c.id).length,
    }))
  }, [categories, books])

  const filtered = useMemo(() => {
    let list = enriched
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.nameBn.includes(q))
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [enriched, searchQuery])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [searchQuery])

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node))
        setShowActionMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  const toggleAll = useCallback(() => {
    if (selected.size === paged.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paged.map((c) => c.id)))
    }
  }, [selected.size, paged])

  const toggleRow = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const exportExcel = useCallback(() => {
    const data = selected.size > 0 ? filtered.filter((c) => selected.has(c.id)) : filtered
    const rows = data.map((c, i) => ({
      '#': i + 1,
      [bn ? 'নাম' : 'Name']: bn ? c.nameBn : c.name,
      [bn ? 'বিবরণ' : 'Description']: bn ? c.descriptionBn : c.description || '',
      [bn ? 'বই' : 'Books']: c.bookCount,
      [bn ? 'অবস্থা' : 'Status']: c.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'ক্যাটাগরি' : 'Categories')
    XLSX.writeFile(wb, `categories-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, selected, bn])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const data = selected.size > 0 ? filtered.filter((c) => selected.has(c.id)) : filtered
    const rows = data.map((c, i) => {
      const row: Record<string, string> = { '#': String(i + 1) }
      for (const key of opts.selectedCols) {
        switch (key) {
          case 'name': row[bn ? 'নাম' : 'Name'] = bn ? c.nameBn : c.name; break
          case 'description': row[bn ? 'বিবরণ' : 'Description'] = bn ? c.descriptionBn : c.description || ''; break
          case 'books': row[bn ? 'বই' : 'Books'] = String(c.bookCount); break
          case 'status': row[bn ? 'অবস্থা' : 'Status'] = c.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'); break
        }
      }
      return row
    })

    const headers = ['#', ...opts.selectedCols.map((key) => {
      const col = pdfColumns.find((c) => c.key === key)
      return col ? (opts.isBn ? col.labelBn : col.label) : key
    })]

    const branding = getPDFBranding()
    const logo = pdfLogoHTML(branding)
    const css = `@page{size:${opts.orientation};margin:5mm}body{font-family:Inter,sans-serif;font-size:10px;color:#1a1a2e}table{width:100%;border-collapse:collapse;margin-top:4px}th,td{border:1px solid #e2e8f0;padding:5px 8px;text-align:left}th{background:#f1f5f9;font-weight:600;font-size:9px}tr:nth-child(even){background:#f8fafc}.hdr{display:flex;align-items:center;gap:8px;margin-bottom:6px}.ttl{font-size:14px;font-weight:700;margin:6px 0 4px}.ftr{margin-top:8px;font-size:8px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:4px}`

    let bodyHTML = `<div class="hdr">${logo}<div><div style="font-size:10px;color:#64748b">${branding.address || ''}</div></div></div>`
    bodyHTML += `<div class="ttl">${opts.title}</div>`
    bodyHTML += '<table><thead><tr>'
    for (const h of headers) bodyHTML += `<th>${h}</th>`
    bodyHTML += '</tr></thead><tbody>'
    for (const row of rows) {
      bodyHTML += '<tr>'
      bodyHTML += `<td>${row['#'] || ''}</td>`
      for (const key of opts.selectedCols) {
        const col = pdfColumns.find((c) => c.key === key)
        const label = col ? (opts.isBn ? col.labelBn : col.label) : key
        bodyHTML += `<td>${row[label] || ''}</td>`
      }
      bodyHTML += '</tr>'
    }
    bodyHTML += '</tbody></table>'
    bodyHTML += `<div class="ftr">${bn ? 'তৈরি: ' : 'Generated: '}${new Date().toLocaleDateString()}</div>`

    openPrintWindow(opts.title, bodyHTML, { css })
    setShowPdfModal(false)
  }, [filtered, selected, bn])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const data = selected.size > 0 ? filtered.filter((c) => selected.has(c.id)) : filtered
    const rows = data.slice(0, 20).map((c, i) => {
      const row: Record<string, string> = { '#': String(i + 1) }
      for (const key of opts.selectedCols) {
        switch (key) {
          case 'name': row[bn ? 'নাম' : 'Name'] = bn ? c.nameBn : c.name; break
          case 'description': row[bn ? 'বিবরণ' : 'Description'] = bn ? c.descriptionBn : c.description || ''; break
          case 'books': row[bn ? 'বই' : 'Books'] = String(c.bookCount); break
          case 'status': row[bn ? 'অবস্থা' : 'Status'] = c.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'); break
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
  }, [filtered, selected, bn])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-[0.8125rem] text-[var(--text-secondary)]">
          {bn ? `${filtered.length} টি ক্যাটাগরি` : `${filtered.length} categories`}
        </div>
        {selected.size > 0 && (
          <span className="text-[0.6875rem] text-[var(--brand)] font-medium">
            {bn ? `${toBnNum(selected.size)} টি নির্বাচিত` : `${selected.size} selected`}
          </span>
        )}
        <div className="flex-1" />
        {filtered.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors cursor-pointer"
            >
              <MoreVertical size={13} />
              {bn ? 'অ্যাকশন' : 'Action'}
              <ChevronDown size={12} />
            </button>
            {showActionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                <div ref={actionMenuRef} className="absolute top-full right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-50 overflow-hidden">
                  <button
                    onClick={() => { exportExcel(); setShowActionMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors"
                  >
                    <FileSpreadsheet size={14} className="text-[var(--green)]" />
                    {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                  </button>
                  <div className="h-px bg-[var(--border)] mx-2" />
                  <button
                    onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors"
                  >
                    <FileText size={14} className="text-[var(--red)]" />
                    {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        <button onClick={() => { setEditItem(null); setShowModal(true) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer">
          <Plus size={13} />
          {bn ? 'ক্যাটাগরি' : 'Category'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Tag size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো ক্যাটাগরি পাওয়া যায়নি' : 'No categories found'}</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম ক্যাটাগরি যোগ করুন' : '+ Add your first category'}
          </button>
        </div>
      ) : (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[0.75rem]">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                  <th className="py-2.5 pl-3 pr-2 w-9">
                    <ModernCheckbox
                      checked={selected.size === paged.length && paged.length > 0}
                      onChange={toggleAll}
                      color="brand"
                      size="xs"
                    />
                  </th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">#</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'বিবরণ' : 'Description'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Books'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'অবস্থা' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c, idx) => (
                  <tr key={c.id} className={`border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface)] ${selected.has(c.id) ? 'bg-[var(--brand)]/5' : ''}`}>
                    <td className="py-2.5 pl-3 pr-2">
                      <ModernCheckbox
                        checked={selected.has(c.id)}
                        onChange={() => toggleRow(c.id)}
                        color="brand"
                        size="xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
                          <Tag size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">{bn ? c.nameBn : c.name}</div>
                          {!bn && c.nameBn && <div className="text-[0.625rem] text-[var(--text-secondary)]">{c.nameBn}</div>}
                          {bn && c.name !== c.nameBn && <div className="text-[0.625rem] text-[var(--text-secondary)]">{c.name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[var(--text-secondary)] max-w-[200px] truncate">
                      {(bn ? c.descriptionBn : c.description) || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-md bg-[var(--brand-light)] text-[var(--brand)] text-[0.6875rem] font-semibold">
                        {bn ? toBnNum(c.bookCount) : c.bookCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[0.625rem] font-medium ${
                        c.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {c.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditItem(c); setShowModal(true) }}
                          className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors cursor-pointer"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => toggleCategoryActive(c.id)}
                          className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors cursor-pointer"
                          title={c.isActive ? (bn ? 'নিষ্ক্রিয় করুন' : 'Deactivate') : (bn ? 'সক্রিয় করুন' : 'Activate')}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">
                      {bn ? 'কোনো ক্যাটাগরি পাওয়া যায়নি' : 'No categories found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} isBn={bn} />
        </div>
      )}

      {showModal && <CategoryModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}

      {deleteTarget && (
        <DeleteConfirmDialog
          title={bn ? 'ক্যাটাগরি মুছে ফেলুন?' : 'Delete Category?'}
          message={bn ? `"${deleteTarget.nameBn}" মুছে ফেলতে চান? এই ক্যাটাগরির সব বই থেকে ক্যাটাগরি সরিয়ে ফেলা হবে।` : `Delete "${deleteTarget.name}"? All books in this category will be unlinked.`}
          isBn={bn}
          onConfirm={() => { deleteCategory(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="Categories List"
          defaultTitleBn="ক্যাটাগরির তালিকা"
          recordLabel="category"
          recordLabelBn="ক্যাটাগরি"
          count={selected.size}
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
