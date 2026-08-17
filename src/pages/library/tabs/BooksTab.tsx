import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Plus, Search, Edit, Trash2, Eye, BookOpen, MoreVertical, ChevronDown, FileSpreadsheet, FileText, LayoutGrid, List } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { GenericPDFOptionsModal, type PDFColumnDef, type GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { BookModal } from '../modals/BookModal'
import type { Book } from '../types'

interface Props { searchQuery: string }

const pdfColumns: PDFColumnDef[] = [
  { key: 'title', label: 'Title', labelBn: 'শিরোনাম', default: true },
  { key: 'author', label: 'Author', labelBn: 'লেখক', default: true },
  { key: 'isbn', label: 'ISBN', labelBn: 'আইএসবিএন', default: true },
  { key: 'category', label: 'Category', labelBn: 'ক্যাটাগরি', default: true },
  { key: 'shelf', label: 'Shelf', labelBn: 'শেল্ফ', default: true },
  { key: 'copies', label: 'Copies', labelBn: 'কপি', default: true },
  { key: 'available', label: 'Available', labelBn: 'উপলব্ধ', default: true },
  { key: 'status', label: 'Status', labelBn: 'অবস্থা', default: true },
]

export function BooksTab({ searchQuery }: Props) {
  const bn = useBn()
  const books = useLibraryStore((s) => s.books)
  const categories = useLibraryStore((s) => s.categories)
  const copies = useLibraryStore((s) => s.copies)
  const toggleBookActive = useLibraryStore((s) => s.toggleBookActive)
  const deleteBook = useLibraryStore((s) => s.deleteBook)

  const [showModal, setShowModal] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filterCategory, setFilterCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const actionMenuRef = useRef<HTMLDivElement>(null)

  const enrichedBooks = useMemo(() => {
    return books.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId)
      const bookCopies = copies.filter((c) => c.bookId === b.id && c.isActive)
      const available = bookCopies.filter((c) => c.status === 'available').length
      return {
        ...b,
        categoryName: bn ? (cat?.nameBn || cat?.name || '') : (cat?.name || cat?.nameBn || ''),
        available,
        totalActiveCopies: bookCopies.length,
      }
    })
  }, [books, categories, copies, bn])

  const filtered = useMemo(() => {
    let list = enrichedBooks
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((b) =>
        b.title.toLowerCase().includes(q) || b.titleBn.includes(q) ||
        b.author.toLowerCase().includes(q) || b.authorBn.includes(q) ||
        b.isbn.includes(q) || b.shelf.toLowerCase().includes(q)
      )
    }
    if (filterCategory) list = list.filter((b) => b.categoryId === filterCategory)
    return list
  }, [enrichedBooks, searchQuery, filterCategory])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [searchQuery, filterCategory])

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
      setSelected(new Set(paged.map((b) => b.id)))
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

  const handleEdit = useCallback((b: Book) => { setEditBook(b); setShowModal(true) }, [])
  const handleAdd = useCallback(() => { setEditBook(null); setShowModal(true) }, [])

  const exportExcel = useCallback(() => {
    const data = selected.size > 0 ? filtered.filter((b) => selected.has(b.id)) : filtered
    const rows = data.map((b, i) => ({
      '#': i + 1,
      [bn ? 'শিরোনাম' : 'Title']: bn ? b.titleBn : b.title,
      [bn ? 'লেখক' : 'Author']: bn ? b.authorBn : b.author,
      'ISBN': b.isbn,
      [bn ? 'ক্যাটাগরি' : 'Category']: b.categoryName,
      [bn ? 'শেল্ফ' : 'Shelf']: b.shelf,
      [bn ? 'মোট কপি' : 'Total Copies']: b.totalActiveCopies,
      [bn ? 'উপলব্ধ' : 'Available']: b.available,
      [bn ? 'অবস্থা' : 'Status']: b.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'বই' : 'Books')
    XLSX.writeFile(wb, `books-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, selected, bn])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const data = selected.size > 0 ? filtered.filter((b) => selected.has(b.id)) : filtered
    const rows = data.map((b, i) => {
      const row: Record<string, string> = { '#': String(i + 1) }
      for (const key of opts.selectedCols) {
        switch (key) {
          case 'title': row[bn ? 'শিরোনাম' : 'Title'] = bn ? b.titleBn : b.title; break
          case 'author': row[bn ? 'লেখক' : 'Author'] = bn ? b.authorBn : b.author; break
          case 'isbn': row['ISBN'] = b.isbn; break
          case 'category': row[bn ? 'ক্যাটাগরি' : 'Category'] = b.categoryName; break
          case 'shelf': row[bn ? 'শেল্ফ' : 'Shelf'] = b.shelf; break
          case 'copies': row[bn ? 'কপি' : 'Copies'] = String(b.totalActiveCopies); break
          case 'available': row[bn ? 'উপলব্ধ' : 'Available'] = String(b.available); break
          case 'status': row[bn ? 'অবস্থা' : 'Status'] = b.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'); break
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
    const data = selected.size > 0 ? filtered.filter((b) => selected.has(b.id)) : filtered
    const rows = data.slice(0, 20).map((b, i) => {
      const row: Record<string, string> = { '#': String(i + 1) }
      for (const key of opts.selectedCols) {
        switch (key) {
          case 'title': row[bn ? 'শিরোনাম' : 'Title'] = bn ? b.titleBn : b.title; break
          case 'author': row[bn ? 'লেখক' : 'Author'] = bn ? b.authorBn : b.author; break
          case 'isbn': row['ISBN'] = b.isbn; break
          case 'category': row[bn ? 'ক্যাটাগরি' : 'Category'] = b.categoryName; break
          case 'shelf': row[bn ? 'শেল্ফ' : 'Shelf'] = b.shelf; break
          case 'copies': row[bn ? 'কপি' : 'Copies'] = String(b.totalActiveCopies); break
          case 'available': row[bn ? 'উপলব্ধ' : 'Available'] = String(b.available); break
          case 'status': row[bn ? 'অবস্থা' : 'Status'] = b.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'); break
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
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border transition-colors ${
            showFilters || filterCategory
              ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20'
              : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/30'
          }`}
        >
          <Search size={12} />
          {bn ? 'ফিল্টার' : 'Filter'}
          {filterCategory && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
        </button>
        {filterCategory && (
          <button onClick={() => setFilterCategory('')} className="flex items-center gap-1 px-2 py-1 rounded text-[0.6875rem] text-red-500 border border-red-500/30 hover:bg-red-500/10">
            {bn ? 'মুছুন' : 'Clear'}
          </button>
        )}
        {selected.size > 0 && (
          <span className="text-[0.6875rem] text-[var(--brand)] font-medium">
            {bn ? `${toBnNum(selected.size)} টি নির্বাচিত` : `${selected.size} selected`}
          </span>
        )}
        <div className="flex-1" />
        {filtered.length > 0 && (
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              title={bn ? 'টেবিল' : 'Table'}
            >
              <List size={13} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              title={bn ? 'গ্রিড' : 'Grid'}
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        )}
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
        <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity">
          <Plus size={13} />
          {bn ? 'বই যোগ করুন' : 'Add Book'}
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] outline-none"
          >
            <option value="">{bn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
            {categories.filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
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
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Book'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'লেখক' : 'Author'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'শেল্ফ' : 'Shelf'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কপি' : 'Copies'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'অবস্থা' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((b, idx) => (
                  <tr key={b.id} className={`border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface)] ${selected.has(b.id) ? 'bg-[var(--brand)]/5' : ''}`}>
                    <td className="py-2.5 pl-3 pr-2">
                      <ModernCheckbox
                        checked={selected.has(b.id)}
                        onChange={() => toggleRow(b.id)}
                        color="brand"
                        size="xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                    <td className="py-2.5 px-3 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
                          <BookOpen size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">{bn ? b.titleBn : b.title}</div>
                          <div className="text-[0.625rem] text-[var(--text-secondary)]">{b.isbn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-left text-[var(--text-primary)]">{bn ? b.authorBn : b.author}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[0.625rem] font-medium">
                        {b.categoryName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[var(--text-primary)]">{b.shelf}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[var(--text-primary)]">{bn ? toBnNum(b.available) : b.available}</span>
                      <span className="text-[var(--text-secondary)]">/{bn ? toBnNum(b.totalActiveCopies) : b.totalActiveCopies}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[0.625rem] font-medium ${
                        b.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {b.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <button onClick={() => handleEdit(b)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => toggleBookActive(b.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(b)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[var(--text-secondary)]">
                      {bn ? 'কোনো বই পাওয়া যায়নি' : 'No books found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} isBn={bn} />
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((b) => (
            <div key={b.id} className="group bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[var(--brand)]/5 hover:border-[var(--brand)]/20 transition-all duration-300">
              <div className="relative h-20 bg-gradient-to-br from-[var(--brand)]/15 to-purple-500/5 flex items-center justify-center">
                <div className="w-12 h-14 rounded-lg bg-gradient-to-br from-[var(--brand)] to-purple-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                  <BookOpen size={20} />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`px-2 py-0.5 rounded-full text-[0.5625rem] font-medium ${b.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-red-500/10 text-red-500'}`}>
                    {b.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                  </span>
                </div>
              </div>
              <div className="p-3.5 space-y-2.5">
                <div>
                  <h3 className="font-semibold text-[0.8125rem] text-[var(--text-primary)] line-clamp-1">{bn ? b.titleBn : b.title}</h3>
                  <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-1">{bn ? b.authorBn : b.author}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[0.5625rem] font-medium">{b.categoryName}</span>
                  <span className="text-[0.5625rem] text-[var(--text-secondary)]">{b.shelf}</span>
                </div>
                <div className="flex items-center justify-between text-[0.6875rem]">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[var(--text-primary)]">{bn ? toBnNum(b.available) : b.available}</span>
                    <span className="text-[var(--text-secondary)]">/{bn ? toBnNum(b.totalActiveCopies) : b.totalActiveCopies}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => handleEdit(b)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                      <Edit size={12} />
                    </button>
                    <button onClick={() => toggleBookActive(b.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors">
                      <Eye size={12} />
                    </button>
                    <button onClick={() => setDeleteTarget(b)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {paged.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <BookOpen size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
              <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো বই পাওয়া যায়নি' : 'No books found'}</p>
            </div>
          )}
          {paged.length > 0 && (
            <div className="col-span-full">
              <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} isBn={bn} />
            </div>
          )}
        </div>
      )}

      {showModal && <BookModal existing={editBook} onSaved={() => { setShowModal(false); setEditBook(null) }} onClose={() => { setShowModal(false); setEditBook(null) }} />}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={bn ? 'বই মুছুন' : 'Delete Book'}
          message={bn ? `"${deleteTarget.titleBn}" মুছে ফেলতে চান?` : `Delete "${deleteTarget.title}"?`}
          onConfirm={() => { deleteBook(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
          isBn={bn}
        />
      )}
      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="Books List"
          defaultTitleBn="বইয়ের তালিকা"
          recordLabel="book"
          recordLabelBn="বই"
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
