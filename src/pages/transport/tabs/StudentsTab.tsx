import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Users, UserPlus, Pencil, Trash2, Bus, MapPin, FileText, FileSpreadsheet, MoreVertical, ChevronDown, Filter, X, CalendarDays } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTransportStore, type TransportAssignment, computeExpiryDate } from '@/store/transportStore'
import { useSessionStudents } from '@/store/admissionStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { AssignmentModal } from '../modals/AssignmentModal'
import { toBnNum } from '@/lib/i18n'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { XLSX } from '@/lib/excelExport'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  searchQuery: string
}

export const StudentsTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { vehicles, routes, assignments, deleteAssignment } = useTransportStore()
  const students = useSessionStudents()

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<TransportAssignment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filterVehicle, setFilterVehicle] = useState('')
  const [filterRoute, setFilterRoute] = useState('')
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

  const enrichedAssignments = useMemo(() => {
    return assignments.map((a) => {
      const student = students.find((s) => s.id === a.studentId)
      const vehicle = vehicles.find((v) => v.id === a.vehicleId)
      const route = routes.find((r) => r.id === a.routeId)
      return { ...a, student, vehicle, route }
    })
  }, [assignments, students, vehicles, routes])

  const filtered = useMemo(() => {
    let list = enrichedAssignments
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) =>
          a.student?.nameEn?.toLowerCase().includes(q) ||
          a.student?.nameBn?.includes(q) ||
          a.student?.class?.toLowerCase().includes(q) ||
          a.vehicle?.name?.toLowerCase().includes(q) ||
          a.vehicle?.nameBn?.includes(q) ||
          a.route?.name?.toLowerCase().includes(q) ||
          a.route?.nameBn?.includes(q) ||
          a.pickupStop?.toLowerCase().includes(q)
      )
    }
    if (filterVehicle) {
      list = list.filter((a) => a.vehicleId === filterVehicle)
    }
    if (filterRoute) {
      list = list.filter((a) => a.routeId === filterRoute)
    }
    return list.sort((a, b) => {
      const aName = a.student?.nameEn || ''
      const bName = b.student?.nameEn || ''
      return aName.localeCompare(bName)
    })
  }, [enrichedAssignments, searchQuery, filterVehicle, filterRoute])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const totalFare = filtered.reduce((sum, a) => sum + a.monthlyFare, 0)

  const hasActiveFilters = filterVehicle || filterRoute

  const clearFilters = () => { setFilterVehicle(''); setFilterRoute(''); setPage(1) }

  const handleDelete = () => {
    if (deleteId) {
      deleteAssignment(deleteId)
      setDeleteId(null)
    }
  }

  const exportExcel = useCallback(() => {
    const rows = filtered.map((a, i) => ({
      '#': i + 1,
      [bn ? 'ছাত্র' : 'Student']: a.student ? (bn ? a.student.nameBn : a.student.nameEn) : '',
      [bn ? 'আইডি' : 'ID']: a.studentId,
      [bn ? 'শ্রেণি' : 'Class']: a.student ? `${a.student.class}-${a.student.section}` : '',
      [bn ? 'যানবাহন' : 'Vehicle']: a.vehicle ? (bn ? a.vehicle.nameBn : a.vehicle.name) : '',
      [bn ? 'রুট' : 'Route']: a.route ? (bn ? a.route.nameBn : a.route.name) : '',
      [bn ? 'বোর্ডিং' : 'Pickup']: a.pickupStop || '',
      [bn ? 'মেয়াদ (মাস)' : 'Duration (mo)']: a.durationMonths,
      [bn ? 'মেয়াদ শেষ' : 'Expiry']: computeExpiryDate(a.assignedDate, a.durationMonths),
      [bn ? 'ভাড়া (৳)' : 'Fare (৳)']: a.monthlyFare,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'পরিবহন ছাত্র' : 'Transport Students')
    XLSX.writeFile(wb, `transport-students-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, bn])

  // ─── PDF ────────────────────────────────────────────────────────────
  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', default: true },
    { key: 'id', label: 'ID', labelBn: 'আইডি', default: true },
    { key: 'class', label: 'Class', labelBn: 'শ্রেণি', default: true },
    { key: 'vehicle', label: 'Vehicle', labelBn: 'যানবাহন', default: true },
    { key: 'route', label: 'Route', labelBn: 'রুট', default: true },
    { key: 'pickup', label: 'Pickup', labelBn: 'বোর্ডিং', default: true },
    { key: 'duration', label: 'Duration', labelBn: 'মেয়াদ', default: true },
    { key: 'expiry', label: 'Expiry', labelBn: 'শেষ তারিখ', default: true },
    { key: 'fare', label: 'Fare', labelBn: 'ভাড়া', default: true },
  ], [])

  const buildPdfRow = useCallback((a: (typeof filtered)[number], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = a.student ? (bn ? a.student.nameBn : a.student.nameEn) : '—'
    if (cols.includes('id')) row[bn ? 'আইডি' : 'ID'] = a.studentId
    if (cols.includes('class')) row[bn ? 'শ্রেণি' : 'Class'] = a.student ? `${a.student.class}-${a.student.section}` : '—'
    if (cols.includes('vehicle')) row[bn ? 'যানবাহন' : 'Vehicle'] = a.vehicle ? (bn ? a.vehicle.nameBn : a.vehicle.name) : '—'
    if (cols.includes('route')) row[bn ? 'রুট' : 'Route'] = a.route ? (bn ? a.route.nameBn : a.route.name) : '—'
    if (cols.includes('pickup')) row[bn ? 'বোর্ডিং' : 'Pickup'] = a.pickupStop || '—'
    if (cols.includes('duration')) row[bn ? 'মেয়াদ' : 'Duration'] = `${a.durationMonths} ${bn ? 'মাস' : 'mo'}`
    if (cols.includes('expiry')) row[bn ? 'শেষ তারিখ' : 'Expiry'] = computeExpiryDate(a.assignedDate, a.durationMonths) || '—'
    if (cols.includes('fare')) row[bn ? 'ভাড়া' : 'Fare'] = a.monthlyFare
    return row
  }, [bn, filtered])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const rows = filtered.map((a, i) => buildPdfRow(a, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const totalRow: Record<string, string | number> = {}
    totalRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    totalRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('fare')) totalRow[bn ? 'ভাড়া' : 'Fare'] = filtered.reduce((sum, a) => sum + a.monthlyFare, 0)
    rows.push(totalRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table>${
      opts.emptyColumns.length > 0 ? `<colgroup>${opts.emptyColumns.map(() => '<col style="width:24px">').join('')}</colgroup>` : ''
    }<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}${opts.emptyColumns.map((ec) => `<th>${ec}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${i === rows.length - 1 ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}${opts.emptyColumns.map(() => '<td></td>').join('')}</tr>`).join('')}${Array.from({ length: opts.emptyRows }).map(() => `<tr>${headers.map(() => '<td>&nbsp;</td>').join('')}${opts.emptyColumns.map(() => '<td>&nbsp;</td>').join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = filtered.slice(0, 20).map((a, i) => buildPdfRow(a, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a"><div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:8px;margin-bottom:10px">${pdfLogoHTML(pdfBranding, 28)}<div><div style="font-size:14px;font-weight:700;color:${pdfBranding.brandColor}">${pdfBranding.schoolName}</div><div style="font-size:9px;color:#666">${pdfBranding.address}</div></div></div><div style="font-size:13px;font-weight:700;color:${pdfBranding.brandColor};margin:8px 0">${opts.title}</div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headers.map((h) => `<th style="background:${pdfBranding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>${filtered.length > 20 ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${filtered.length - 20} more records</div>` : ''}</div>`
  }, [filtered, pdfColumns, bn, buildPdfRow])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[0.8125rem] text-[var(--text-secondary)] hidden sm:inline">
            {bn ? `${filtered.length} জন ছাত্র বরাদ্দ` : `${filtered.length} students assigned`}
          </span>
          {filtered.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--brand)]/8 text-[var(--brand)] text-[0.75rem] font-semibold whitespace-nowrap">
              {bn ? 'মোট ভাড়া' : 'Total'}: ৳{bn ? toBnNum(totalFare) : totalFare.toLocaleString()}
            </span>
          )}
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
            <UserPlus size={15} />
            {bn ? 'ছাত্র যোগ' : 'Assign'}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <select value={filterVehicle} onChange={(e) => { setFilterVehicle(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors cursor-pointer">
            <option value="">{bn ? 'সব যানবাহন' : 'All Vehicles'}</option>
            {vehicles.filter((v) => v.isActive).map((v) => (
              <option key={v.id} value={v.id}>{bn ? v.nameBn : v.name}</option>
            ))}
          </select>
          <select value={filterRoute} onChange={(e) => { setFilterRoute(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors cursor-pointer">
            <option value="">{bn ? 'সব রুট' : 'All Routes'}</option>
            {routes.filter((r) => r.isActive).map((r) => (
              <option key={r.id} value={r.id}>{bn ? r.nameBn : r.name}</option>
            ))}
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
          <Users size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো ছাত্র বরাদ্দ করা হয়নি' : 'No students assigned yet'}</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম ছাত্র বরাদ্দ করুন' : '+ Assign your first student'}
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ছাত্র' : 'Student'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'যানবাহন' : 'Vehicle'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রুট' : 'Route'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বোর্ডিং' : 'Pickup'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'মেয়াদ' : 'Duration'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ভাড়া' : 'Fare'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a, i) => (
                  <tr key={a.id}
                    className="border-b border-[var(--border)] last:border-0 transition-colors hover:!bg-[var(--brand)]/5"
                    style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">{(page - 1) * perPage + i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--brand)]/10 text-[var(--brand)] text-[0.75rem] font-bold">
                          {a.student ? (a.student.nameEn || '?')[0] : '?'}
                        </div>
                        <div>
                          <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
                            {a.student ? (bn ? a.student.nameBn : a.student.nameEn) : '—'}
                          </div>
                          <div className="text-[0.6875rem] text-[var(--text-muted)]">{a.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.75rem] font-medium text-[var(--text-secondary)]">
                        {a.student ? `${a.student.class} - ${a.student.section}` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                        <Bus size={12} className="text-[var(--text-muted)] shrink-0" />
                        {a.vehicle ? (bn ? a.vehicle.nameBn : a.vehicle.name) : '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)] max-w-[180px] truncate mx-auto">
                        <MapPin size={12} className="text-[var(--text-muted)] shrink-0" />
                        {a.route ? (bn ? a.route.nameBn : a.route.name) : '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">
                      {a.pickupStop || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(() => {
                        const expiry = computeExpiryDate(a.assignedDate, a.durationMonths)
                        const today = new Date().toISOString().split('T')[0]
                        const expired = expiry ? expiry < today : false
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                              {bn ? `${toBnNum(a.durationMonths)} মাস` : `${a.durationMonths} ${a.durationMonths === 1 ? 'mo' : 'mos'}`}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.625rem] font-medium whitespace-nowrap ${
                              expired || !a.isActive
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-[var(--green-light)] text-[var(--green)]'
                            }`}>
                              <CalendarDays size={9} />
                              {expired ? (bn ? `মেয়াদোত্তীর্ণ ${expiry}` : `Expired ${expiry}`) : (bn ? `${expiry}` : `${expiry}`)}
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                        ৳{bn ? toBnNum(a.monthlyFare) : a.monthlyFare}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setEditItem(a); setShowModal(true) }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] cursor-pointer transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(a.id)}
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

      {showModal && <AssignmentModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null); setPage(1) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}

      {deleteId && (
        <DeleteConfirmDialog
          title={bn ? 'বরাদ্দ মুছে ফেলুন?' : 'Delete Assignment?'}
          message={bn ? 'এই ছাত্রের পরিবহন বরাদ্দ মুছে ফেলা হবে।' : "This student's transport assignment will be removed."}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isBn={bn}
        />
      )}

      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="Transport — Student Assignments"
          defaultTitleBn="পরিবহন — ছাত্র বরাদ্দ"
          recordLabel="assignment"
          recordLabelBn="বরাদ্দ"
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
