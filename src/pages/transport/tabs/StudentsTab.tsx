import { useState, useMemo } from 'react'
import { Users, UserPlus, Trash2, Bus, MapPin } from 'lucide-react'
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

export const StudentsTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { vehicles, routes, assignments, deleteAssignment } = useTransportStore()
  const students = useSessionStudents()

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<TransportAssignment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

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
    return list.sort((a, b) => {
      const aName = a.student?.nameEn || ''
      const bName = b.student?.nameEn || ''
      return aName.localeCompare(bName)
    })
  }, [enrichedAssignments, searchQuery])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleDelete = () => {
    if (deleteId) {
      deleteAssignment(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[0.8125rem] text-[var(--text-secondary)]">
          {bn ? `${filtered.length} জন ছাত্র বরাদ্দ` : `${filtered.length} students assigned`}
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90"
        >
          <UserPlus size={15} />
          {bn ? 'ছাত্র যোগ' : 'Assign'}
        </button>
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
                  <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                  <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ছাত্র' : 'Student'}</th>
                  <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'যানবাহন' : 'Vehicle'}</th>
                  <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রুট' : 'Route'}</th>
                  <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বোর্ডিং' : 'Pickup'}</th>
                  <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ভাড়া' : 'Fare'}</th>
                  <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a, i) => (
                  <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)]">{(page - 1) * perPage + i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
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
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.75rem] font-medium text-[var(--text-secondary)]">
                        {a.student ? `${a.student.class} - ${a.student.section}` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                        <Bus size={12} className="text-[var(--text-muted)] shrink-0" />
                        {a.vehicle ? (bn ? a.vehicle.nameBn : a.vehicle.name) : '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)] max-w-[180px] truncate">
                        <MapPin size={12} className="text-[var(--text-muted)] shrink-0" />
                        {a.route ? (bn ? a.route.nameBn : a.route.name) : '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)]">
                      {a.pickupStop || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                        ৳{bn ? toBnNum(a.monthlyFare) : a.monthlyFare}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
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
