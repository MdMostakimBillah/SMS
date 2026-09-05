import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { MapPin, Pencil, Trash2, Plus, Users, FileText, FileSpreadsheet, MoreVertical, ChevronDown, Filter, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useTransportStore, type TransportRoute } from '@/store/transportStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { RouteModal } from '../modals/RouteModal'
import { toBnNum } from '@/lib/i18n'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { XLSX } from '@/lib/excelExport'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  searchQuery: string
}

export const RoutesTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { canCreate, canEdit, canDelete, canExport } = usePermission()
  const routes = useTransportStore((s) => s.routes)
  const assignments = useTransportStore((s) => s.assignments)
  const deleteRoute = useTransportStore((s) => s.deleteRoute)

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<TransportRoute | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
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

  const filtered = useMemo(() => {
    let list = [...routes]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.nameBn.includes(q) ||
          r.stops.toLowerCase().includes(q) ||
          r.stopsBn.includes(q)
      )
    }
    if (filterStatus === 'active') {
      list = list.filter((r) => r.isActive)
    }
    if (filterStatus === 'inactive') {
      list = list.filter((r) => !r.isActive)
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [routes, searchQuery, filterStatus])

  const getStudentCount = (routeId: string) => {
    return assignments.filter((a) => a.routeId === routeId && a.isActive).length
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteRoute(deleteId)
      setDeleteId(null)
    }
  }

  const hasActiveFilters = filterStatus !== ''

  const clearFilters = () => setFilterStatus('')

  const statusLabel = (isActive: boolean) => isActive
    ? (bn ? 'সক্রিয়' : 'Active')
    : (bn ? 'নিষ্ক্রিয়' : 'Inactive')

  const exportExcel = useCallback(() => {
    const rows = filtered.map((r, i) => ({
      '#': i + 1,
      [bn ? 'রুটের নাম' : 'Route Name']: bn ? r.nameBn : r.name,
      [bn ? 'স্টপ/গন্তব্য' : 'Stops']: bn ? r.stopsBn : r.stops,
      [bn ? 'দূরত্ব' : 'Distance']: r.distance || '',
      [bn ? 'ভাড়া (৳)' : 'Fare (৳)']: r.fare,
      [bn ? 'ছাত্র' : 'Students']: assignments.filter((a) => a.routeId === r.id && a.isActive).length,
      [bn ? 'অবস্থা' : 'Status']: statusLabel(r.isActive),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'রুট' : 'Routes')
    XLSX.writeFile(wb, `transport-routes-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, bn, assignments, statusLabel])

  // ─── PDF ────────────────────────────────────────────────────────────
  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'name', label: 'Route Name', labelBn: 'রুটের নাম', default: true },
    { key: 'stops', label: 'Stops', labelBn: 'স্টপ/গন্তব্য', default: true },
    { key: 'distance', label: 'Distance', labelBn: 'দূরত্ব', default: true },
    { key: 'fare', label: 'Fare', labelBn: 'ভাড়া', default: true },
    { key: 'students', label: 'Students', labelBn: 'ছাত্র', default: true },
    { key: 'status', label: 'Status', labelBn: 'অবস্থা', default: true },
  ], [])

  const buildPdfRow = useCallback((r: (typeof filtered)[number], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('name')) row[bn ? 'রুটের নাম' : 'Route Name'] = bn ? r.nameBn : r.name
    if (cols.includes('stops')) row[bn ? 'স্টপ/গন্তব্য' : 'Stops'] = bn ? r.stopsBn : r.stops
    if (cols.includes('distance')) row[bn ? 'দূরত্ব' : 'Distance'] = r.distance || '—'
    if (cols.includes('fare')) row[bn ? 'ভাড়া' : 'Fare'] = r.fare
    if (cols.includes('students')) row[bn ? 'ছাত্র' : 'Students'] = assignments.filter((a) => a.routeId === r.id && a.isActive).length
    if (cols.includes('status')) row[bn ? 'অবস্থা' : 'Status'] = statusLabel(r.isActive)
    return row
  }, [bn, assignments, statusLabel])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const rows = filtered.map((r, i) => buildPdfRow(r, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table>${
      opts.emptyColumns.length > 0 ? `<colgroup>${opts.emptyColumns.map(() => '<col style="width:24px">').join('')}</colgroup>` : ''
    }<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}${opts.emptyColumns.map((ec) => `<th>${ec}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}${opts.emptyColumns.map(() => '<td></td>').join('')}</tr>`).join('')}${Array.from({ length: opts.emptyRows }).map(() => `<tr>${headers.map(() => '<td>&nbsp;</td>').join('')}${opts.emptyColumns.map(() => '<td>&nbsp;</td>').join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = filtered.slice(0, 20).map((r, i) => buildPdfRow(r, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a"><div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:8px;margin-bottom:10px">${pdfLogoHTML(pdfBranding, 28)}<div><div style="font-size:14px;font-weight:700;color:${pdfBranding.brandColor}">${pdfBranding.schoolName}</div><div style="font-size:9px;color:#666">${pdfBranding.address}</div></div></div><div style="font-size:13px;font-weight:700;color:${pdfBranding.brandColor};margin:8px 0">${opts.title}</div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headers.map((h) => `<th style="background:${pdfBranding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>${filtered.length > 20 ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${filtered.length - 20} more records</div>` : ''}</div>`
  }, [filtered, pdfColumns, bn, buildPdfRow])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[0.8125rem] text-[var(--text-secondary)]">
            {bn ? `${filtered.length} টি রুট` : `${filtered.length} routes`}
          </span>
          <button onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium border transition-colors cursor-pointer ${showFilters || hasActiveFilters ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)]'}`}>
            <Filter size={14} />
            {bn ? 'ফিল্টার' : 'Filters'}
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer">
              <X size={12} />{bn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
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
                    {canExport('transport.routes') && (
                      <button onClick={() => { exportExcel(); setShowActionMenu(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors">
                        <FileSpreadsheet size={14} className="text-[var(--green)]" />
                        {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                      </button>
                    )}
                    <div className="h-px bg-[var(--border)] mx-2" />
                    {canExport('transport.routes') && (
                      <button onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors">
                        <FileText size={14} className="text-[var(--red)]" />
                        {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {canCreate('transport.routes') && (
            <button
              onClick={() => { setEditItem(null); setShowModal(true) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90"
            >
              <Plus size={15} />
              {bn ? 'রুট' : 'Route'}
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors cursor-pointer">
            <option value="">{bn ? 'সব অবস্থা' : 'All Status'}</option>
            <option value="active">{bn ? 'সক্রিয়' : 'Active'}</option>
            <option value="inactive">{bn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer">
              <X size={12} />{bn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <MapPin size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো রুট পাওয়া যায়নি' : 'No routes found'}</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম রুট যোগ করুন' : '+ Add your first route'}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রুটের নাম' : 'Route Name'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'স্টপ/গন্তব্য' : 'Stops'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'দূরত্ব' : 'Distance'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ভাড়া' : 'Fare'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ছাত্র' : 'Students'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'অবস্থা' : 'Status'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id}
                  className="border-b border-[var(--border)] last:border-0 transition-colors hover:!bg-[var(--brand)]/5"
                  style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                  <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">{i + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--teal)]/10 text-[var(--teal)]">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? r.nameBn : r.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="text-[0.75rem] text-[var(--text-secondary)] max-w-[250px] truncate mx-auto">
                      {bn ? r.stopsBn : r.stops || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">
                    {r.distance || '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                      ৳{bn ? toBnNum(r.fare) : r.fare}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users size={12} className="text-[var(--text-muted)]" />
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-md bg-[var(--brand)]/8 text-[var(--brand)] text-[0.75rem] font-semibold">
                        {getStudentCount(r.id)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-medium ${r.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                      {r.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {canEdit('transport.routes') && (
                        <button
                          onClick={() => { setEditItem(r); setShowModal(true) }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] cursor-pointer transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {canDelete('transport.routes') && (
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors"
                        >
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
      )}

      {showModal && <RouteModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}

      {deleteId && (
        <DeleteConfirmDialog
          title={bn ? 'রুট মুছে ফেলুন?' : 'Delete Route?'}
          message={bn ? 'এই রুটের সব বরাদ্দ ও যানবাহন সম্পর্ক মুছে যাবে।' : 'All assignments and vehicle associations for this route will be removed.'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isBn={bn}
        />
      )}

      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="Transport — Routes"
          defaultTitleBn="পরিবহন — রুট"
          recordLabel="route"
          recordLabelBn="রুট"
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
