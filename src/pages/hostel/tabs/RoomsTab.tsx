import { useState, useMemo, useCallback } from 'react'
import { Home, Pencil, Trash2, Users, Plus, FileSpreadsheet } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useHostelStore, type HostelRoom } from '@/store/hostelStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { RoomModal } from '../modals/RoomModal'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.8125rem] text-[var(--text-secondary)] hidden sm:inline">
          {bn ? `${filtered.length}টি রুম` : `${filtered.length} rooms`}
        </span>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors cursor-pointer">
              <FileSpreadsheet size={14} />
              {bn ? 'এক্সেল' : 'Excel'}
            </button>
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
    </div>
  )
}
