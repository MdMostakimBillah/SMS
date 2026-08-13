import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Home, Pencil, Trash2, Users, Plus, MoreVertical, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useHostelStore, type HostelRoom } from '@/store/hostelStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { RoomModal } from '../modals/RoomModal'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  searchQuery: string
}

export const RoomsTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { rooms, assignments, deleteRoom } = useHostelStore()

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<HostelRoom | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  const enrichedRooms = useMemo(() => {
    return rooms.map((r) => {
      const assigned = assignments.filter((a) => a.roomId === r.id && a.isActive).length
      return { ...r, assigned, available: r.capacity - assigned }
    })
  }, [rooms, assignments])

  const filtered = useMemo(() => {
    let list = enrichedRooms
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.nameBn.includes(q) ||
          r.roomNumber.toLowerCase().includes(q) ||
          r.floor.toLowerCase().includes(q)
      )
    }
    return list
  }, [enrichedRooms, searchQuery])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleDelete = () => {
    if (deleteId) {
      deleteRoom(deleteId)
      setDeleteId(null)
    }
  }

  const exportExcel = useCallback(() => {
    const rows = filtered.map((r, i) => ({
      '#': i + 1,
      [bn ? 'রুম' : 'Room']: r.roomNumber,
      [bn ? 'তলা' : 'Floor']: r.floor,
      [bn ? 'আসন সংখ্যা' : 'Capacity']: r.capacity,
      [bn ? 'বরাদ্দ' : 'Assigned']: r.assigned,
      [bn ? 'খালি' : 'Available']: r.available,
      [bn ? 'মাসিক ভাড়া (৳)' : 'Monthly Rent (৳)']: r.monthlyRent,
      [bn ? 'অবস্থা' : 'Status']: r.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'হোস্টেল রুম' : 'Hostel Rooms')
    XLSX.writeFile(wb, `hostel-rooms-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, bn])

  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'room', label: 'Room', labelBn: 'রুম', default: true },
    { key: 'floor', label: 'Floor', labelBn: 'তলা', default: true },
    { key: 'capacity', label: 'Capacity', labelBn: 'আসন', default: true },
    { key: 'assigned', label: 'Assigned', labelBn: 'বরাদ্দ', default: true },
    { key: 'available', label: 'Available', labelBn: 'খালি', default: true },
    { key: 'rent', label: 'Rent', labelBn: 'ভাড়া', default: true },
    { key: 'status', label: 'Status', labelBn: 'অবস্থা', default: true },
  ], [])

  const buildPdfRow = useCallback((r: (typeof filtered)[number], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('room')) row[bn ? 'রুম' : 'Room'] = r.roomNumber
    if (cols.includes('floor')) row[bn ? 'তলা' : 'Floor'] = r.floor || '—'
    if (cols.includes('capacity')) row[bn ? 'আসন' : 'Capacity'] = r.capacity
    if (cols.includes('assigned')) row[bn ? 'বরাদ্দ' : 'Assigned'] = r.assigned
    if (cols.includes('available')) row[bn ? 'খালি' : 'Available'] = r.available
    if (cols.includes('rent')) row[bn ? 'ভাড়া' : 'Rent'] = r.monthlyRent
    if (cols.includes('status')) row[bn ? 'অবস্থা' : 'Status'] = r.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')
    return row
  }, [bn])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const rows = filtered.map((r, i) => buildPdfRow(r, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const emptyRow = '<td>&nbsp;</td>'
    const bodyRows = rows.map((r) => {
      const cells = headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')
      const empties = opts.emptyColumns.map(() => emptyRow).join('')
      return `<tr>${cells}${empties}</tr>`
    }).join('')
    const fillerRows = Array.from({ length: opts.emptyRows }).map(() => {
      const cells = headers.map(() => `<td>&nbsp;</td>`).join('')
      const empties = opts.emptyColumns.map(() => emptyRow).join('')
      return `<tr>${cells}${empties}</tr>`
    }).join('')
    const colgroup = opts.emptyColumns.length > 0
      ? `<colgroup>${opts.emptyColumns.map(() => '<col style="width:24px">').join('')}</colgroup>`
      : ''
    const headerCells = headers.map((h) => `<th>${h}</th>`).join('')
    const emptyHeaders = opts.emptyColumns.map((ec) => `<th>${ec}</th>`).join('')
    const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table>${colgroup}<thead><tr>${headerCells}${emptyHeaders}</tr></thead><tbody>${bodyRows}${fillerRows}</tbody></table><div class="ftr">Generated: ${genDate}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = filtered.slice(0, 20).map((r, i) => buildPdfRow(r, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const branding = getPDFBranding()
    const headerRow = headers.map((h) => `<th style="background:${branding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')
    const bodyRows = rows.map((r) => {
      const cells = headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    const overflowNote = filtered.length > 20
      ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${filtered.length - 20} more records</div>`
      : ''
    const logo = pdfLogoHTML(branding, 28)
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a"><div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${branding.brandColor};padding-bottom:8px;margin-bottom:10px">${logo}<div><div style="font-size:14px;font-weight:700;color:${branding.brandColor}">${branding.schoolName}</div><div style="font-size:9px;color:#666">${branding.address}</div></div></div><div style="font-size:13px;font-weight:700;color:${branding.brandColor};margin:8px 0">${opts.title}</div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>${overflowNote}</div>`
  }, [filtered, pdfColumns, bn, buildPdfRow])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.8125rem] text-[var(--text-secondary)] hidden sm:inline">
          {bn ? `${filtered.length}টি রুম` : `${filtered.length} rooms`}
        </span>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowActionMenu(!showActionMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors cursor-pointer">
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
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90"
          >
            <Plus size={15} />
            {bn ? 'রুম যোগ' : 'Add Room'}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Home size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো রুম নেই' : 'No rooms found'}</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম রুম যোগ করুন' : '+ Add your first room'}
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রুম' : 'Room'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'তলা' : 'Floor'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'আসন' : 'Beds'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বরাদ্দ' : 'Assigned'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'খালি' : 'Available'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ভাড়া' : 'Rent'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'অবস্থা' : 'Status'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r.id}
                    className="border-b border-[var(--border)] last:border-0 transition-colors hover:!bg-[var(--brand)]/5"
                    style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">{(page - 1) * perPage + i + 1}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                          <Home size={14} />
                        </div>
                        <div>
                          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{r.roomNumber}</div>
                          <div className="text-[0.6875rem] text-[var(--text-muted)]">{r.nameBn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">{r.floor}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.75rem] font-medium text-[var(--text-secondary)]">
                        {r.capacity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-[var(--amber)]">
                        <Users size={12} />{r.assigned}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.75rem] font-medium ${r.available > 0 ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-red-500/10 text-red-500'}`}>
                        {r.available}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[0.8125rem] font-semibold text-[var(--text-primary)] text-center">৳{bn ? toBnNum(r.monthlyRent) : r.monthlyRent.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-medium ${r.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-red-500/10 text-red-500'}`}>
                        {r.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setEditItem(r); setShowModal(true) }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] cursor-pointer transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            total={filtered.length}
            totalPages={totalPages}
            isBn={bn}
          />
        </>
      )}

      {showModal && <RoomModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null); setPage(1) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}

      {deleteId && (
        <DeleteConfirmDialog
          title={bn ? 'রুম মুছে ফেলুন?' : 'Delete Room?'}
          message={bn ? 'এই রুমের সব বরাদ্দও মুছে ফেলা হবে।' : 'All assignments in this room will also be removed.'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isBn={bn}
        />
      )}

      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle={bn ? 'হোস্টেল রুম' : 'Hostel Rooms'}
          defaultTitleBn="হোস্টেল রুম"
          recordLabel={bn ? 'রুম' : 'Room'}
          recordLabelBn="রুম"
          count={filtered.length}
          previewRenderer={pdfPreviewRenderer}
          onClose={() => setShowPdfModal(false)}
          onDownload={handlePdfDownload}
          isBn={bn}
        />
      )}
    </div>
  )
}
