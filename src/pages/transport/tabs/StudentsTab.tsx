import { useState, useMemo, useCallback } from 'react'
import { Users, UserPlus, Trash2, Bus, MapPin, FileText, FileSpreadsheet } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTransportStore, type TransportAssignment } from '@/store/transportStore'
import { useSessionStudents } from '@/store/admissionStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { AssignmentModal } from '../modals/AssignmentModal'
import { toBnNum } from '@/lib/i18n'

interface Props {
  searchQuery: string
}

const selectCls =
  'h-8 px-3 pr-7 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_0.5rem_center] bg-[size:10px]'

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

  const handleDelete = () => {
    if (deleteId) {
      deleteAssignment(deleteId)
      setDeleteId(null)
    }
  }

  const handleDownloadPDF = useCallback(() => {
    const rows = filtered
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${bn ? 'পরিবহন ছাত্র তালিকা' : 'Transport Student List'}</title>
<style>@page{size:A4 landscape;margin:8mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a;background:#fff;padding:8mm}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:5px 6px;text-align:center;font-size:8px;font-weight:700;text-transform:uppercase;border:0.5px solid #6366f1}td{padding:4px 6px;border:0.5px solid #e5e7eb;text-align:center}tr:nth-child(even) td{background:#f8f9fc}.hdr{display:flex;align-items:center;gap:10px;padding-bottom:6px;border-bottom:2px solid #6366f1;margin-bottom:8px}.ttl{text-align:center;font-size:12px;font-weight:700;margin-bottom:4px}.sub{text-align:center;font-size:8px;color:#666;margin-bottom:8px}.ftr{margin-top:10px;padding-top:6px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div style="width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700">ET</div><div><div style="font-size:11px;font-weight:700;color:#6366f1">${bn ? 'পরিবহন ছাত্র তালিকা' : 'Transport Student List'}</div><div style="font-size:7px;color:#888">${rows.length} ${bn ? 'জন ছাত্র বরাদ্দ' : 'students assigned'} · ${new Date().toLocaleDateString()}</div></div></div>
<table><thead><tr>
<th>#</th><th>${bn ? 'ছাত্র' : 'Student'}</th><th>${bn ? 'আইডি' : 'ID'}</th><th>${bn ? 'শ্রেণি' : 'Class'}</th><th>${bn ? 'যানবাহন' : 'Vehicle'}</th><th>${bn ? 'রুট' : 'Route'}</th><th>${bn ? 'বোর্ডিং' : 'Pickup'}</th><th>${bn ? 'ভাড়া' : 'Fare'}</th>
</tr></thead><tbody>
${rows.map((a, i) => `<tr>
<td>${i + 1}</td>
<td style="text-align:left;font-weight:500">${a.student ? (bn ? a.student.nameBn : a.student.nameEn) : '—'}</td>
<td style="font-family:monospace;font-size:8px;color:#6366f1">${a.studentId}</td>
<td>${a.student ? `${a.student.class}-${a.student.section}` : '—'}</td>
<td>${a.vehicle ? (bn ? a.vehicle.nameBn : a.vehicle.name) : '—'}</td>
<td>${a.route ? (bn ? a.route.nameBn : a.route.name) : '—'}</td>
<td>${a.pickupStop || '—'}</td>
<td style="font-weight:700;font-size:10px">৳${a.monthlyFare}</td>
</tr>`).join('')}
</tbody></table>
<div class="ftr"><span>Powered by EduTech</span><span>${new Date().toLocaleDateString()}</span></div>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (w) { w.onload = () => { w.print() } }
  }, [filtered, bn])

  const handleDownloadExcel = useCallback(() => {
    const headers = [
      bn ? '#' : '#',
      bn ? 'ছাত্র' : 'Student',
      bn ? 'আইডি' : 'ID',
      bn ? 'শ্রেণি' : 'Class',
      bn ? 'সেকশন' : 'Section',
      bn ? 'যানবাহন' : 'Vehicle',
      bn ? 'রুট' : 'Route',
      bn ? 'বোর্ডিং' : 'Pickup',
      bn ? 'ভাড়া' : 'Fare',
    ]
    const csvRows = [
      headers.join(','),
      ...filtered.map((a, i) => [
        i + 1,
        `"${a.student ? (bn ? a.student.nameBn : a.student.nameEn) : ''}"`,
        `"${a.studentId}"`,
        `"${a.student?.class || ''}"`,
        `"${a.student?.section || ''}"`,
        `"${a.vehicle ? (bn ? a.vehicle.nameBn : a.vehicle.name) : ''}"`,
        `"${a.route ? (bn ? a.route.nameBn : a.route.name) : ''}"`,
        `"${a.pickupStop || ''}"`,
        a.monthlyFare,
      ].join(','))
    ]
    const csv = '\uFEFF' + csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transport-students-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [filtered, bn])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[0.8125rem] text-[var(--text-secondary)]">
          {bn ? `${filtered.length} জন ছাত্র বরাদ্দ` : `${filtered.length} students assigned`}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FileText size={13} />
            PDF
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FileSpreadsheet size={13} />
            Excel
          </button>
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90"
          >
            <UserPlus size={15} />
            {bn ? 'ছাত্র যোগ' : 'Assign'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[0.6875rem] font-medium text-[var(--text-muted)]">{bn ? 'যানবাহন:' : 'Vehicle:'}</label>
          <select value={filterVehicle} onChange={(e) => { setFilterVehicle(e.target.value); setPage(1) }} className={selectCls}>
            <option value="">{bn ? 'সব যানবাহন' : 'All Vehicles'}</option>
            {vehicles.filter((v) => v.isActive).map((v) => (
              <option key={v.id} value={v.id}>{bn ? v.nameBn : v.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[0.6875rem] font-medium text-[var(--text-muted)]">{bn ? 'রুট:' : 'Route:'}</label>
          <select value={filterRoute} onChange={(e) => { setFilterRoute(e.target.value); setPage(1) }} className={selectCls}>
            <option value="">{bn ? 'সব রুট' : 'All Routes'}</option>
            {routes.filter((r) => r.isActive).map((r) => (
              <option key={r.id} value={r.id}>{bn ? r.nameBn : r.name}</option>
            ))}
          </select>
        </div>
        {(filterVehicle || filterRoute) && (
          <button
            onClick={() => { setFilterVehicle(''); setFilterRoute(''); setPage(1) }}
            className="text-[0.6875rem] text-[var(--red)] hover:underline cursor-pointer"
          >
            {bn ? 'ফিল্টার মুছুন' : 'Clear filters'}
          </button>
        )}
      </div>

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
                  <tr key={a.id} className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors ${(page - 1) * perPage + i % 2 === 0 ? 'bg-[var(--bg-secondary)]/50' : ''}`}>
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
