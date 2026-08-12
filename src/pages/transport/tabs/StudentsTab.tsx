import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Users, UserPlus, Trash2, Bus, MapPin, FileText, FileSpreadsheet, MoreVertical, ChevronDown, Filter, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTransportStore, type TransportAssignment } from '@/store/transportStore'
import { useSessionStudents } from '@/store/admissionStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { AssignmentModal } from '../modals/AssignmentModal'
import { toBnNum } from '@/lib/i18n'
import { printRawHTML } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { XLSX } from '@/lib/excelExport'

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
      [bn ? 'ভাড়া (৳)' : 'Fare (৳)']: a.monthlyFare,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'পরিবহন ছাত্র' : 'Transport Students')
    XLSX.writeFile(wb, `transport-students-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, bn])

  const exportPDF = useCallback(() => {
    const brand = getPDFBranding()
    const rows = filtered
    const dayHeaders = `<th style="width:20px">#</th><th>${bn ? 'ছাত্র' : 'Student'}</th><th>${bn ? 'আইডি' : 'ID'}</th><th>${bn ? 'শ্রেণি' : 'Class'}</th><th>${bn ? 'যানবাহন' : 'Vehicle'}</th><th>${bn ? 'রুট' : 'Route'}</th><th>${bn ? 'বোর্ডিং' : 'Pickup'}</th><th>${bn ? 'ভাড়া' : 'Fare'}</th>`
    const bodyRows = rows.map((a, i) => `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
      <td style="padding:4px 6px;font-size:9px;text-align:center">${i + 1}</td>
      <td style="padding:4px 6px;font-size:9px;font-weight:500">${a.student ? (bn ? a.student.nameBn : a.student.nameEn) : '—'}</td>
      <td style="padding:4px 6px;font-size:8px;font-family:monospace;color:${brand.brandColor}">${a.studentId}</td>
      <td style="padding:4px 6px;font-size:9px;text-align:center">${a.student ? `${a.student.class}-${a.student.section}` : '—'}</td>
      <td style="padding:4px 6px;font-size:9px;text-align:center">${a.vehicle ? (bn ? a.vehicle.nameBn : a.vehicle.name) : '—'}</td>
      <td style="padding:4px 6px;font-size:9px;text-align:center">${a.route ? (bn ? a.route.nameBn : a.route.name) : '—'}</td>
      <td style="padding:4px 6px;font-size:9px;text-align:center">${a.pickupStop || '—'}</td>
      <td style="padding:4px 6px;font-size:10px;font-weight:700;text-align:center">৳${a.monthlyFare}</td>
    </tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${bn ? 'পরিবহন ছাত্র তালিকা' : 'Transport Student List'}</title>
<style>@page{size:A4 landscape;margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a;background:#fff;padding:6mm}table{width:100%;border-collapse:collapse}th{background:${brand.brandColor};color:#fff;padding:4px 6px;text-align:center;font-size:7px;font-weight:700;text-transform:uppercase;border:0.5px solid ${brand.brandColor}}td{padding:4px 6px;border:0.5px solid #e5e7eb}.hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid ${brand.brandColor};margin-bottom:8px}.ftr{margin-top:8px;padding-top:5px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr">${pdfLogoHTML(brand, 28)}<div><div style="font-size:11px;font-weight:700;color:${brand.brandColor}">${bn ? 'পরিবহন ছাত্র তালিকা' : 'Transport Student List'}</div><div style="font-size:7px;color:#888">${rows.length} ${bn ? 'জন ছাত্র বরাদ্দ' : 'students assigned'} · ${new Date().toLocaleDateString()}</div></div></div>
<table><thead><tr>${dayHeaders}</tr></thead><tbody>${bodyRows}</tbody></table>
<div class="ftr"><span>${brand.schoolName}</span><span>${new Date().toLocaleDateString()}</span></div>
</body></html>`
    printRawHTML(html)
  }, [filtered, bn])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[0.8125rem] text-[var(--text-secondary)]">
          {bn ? `${filtered.length} জন ছাত্র বরাদ্দ` : `${filtered.length} students assigned`}
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
                    <button onClick={() => { exportPDF(); setShowActionMenu(false) }}
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

      {/* Filters toggle */}
      <div className="flex items-center gap-2">
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
                      <span className="text-[1rem] font-bold text-[var(--text-primary)]">
                        ৳{bn ? toBnNum(a.monthlyFare) : a.monthlyFare}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setEditItem(a); setShowModal(true) }}
                          className="px-2 py-1 rounded-md text-[0.6875rem] text-[var(--brand)] bg-[var(--brand)]/8 hover:bg-[var(--brand)]/15 cursor-pointer transition-colors font-medium"
                        >
                          {bn ? 'সম্পাদনা' : 'Edit'}
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
    </div>
  )
}
