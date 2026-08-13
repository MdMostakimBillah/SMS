import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Users, UserPlus, Pencil, Trash2, Home, BedDouble, FileSpreadsheet, Filter, X, CalendarDays } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useHostelStore, type HostelAssignment } from '@/store/hostelStore'
import { MONTH_NAMES, MONTH_NAMES_BN } from '@/store/transportStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { AssignmentModal } from '../modals/AssignmentModal'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'

interface Props {
  searchQuery: string
}

export const StudentsTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { rooms, assignments, deleteAssignment } = useHostelStore()
  const students = useSessionStudents()
  const currentSession = useClassStore((s) => s.institution.currentSession) || '2025-26'

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<HostelAssignment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filterRoom, setFilterRoom] = useState('')
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
      const room = rooms.find((r) => r.id === a.roomId)
      return { ...a, student, room }
    })
  }, [assignments, students, rooms])

  const filtered = useMemo(() => {
    let list = enrichedAssignments
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) =>
          a.student?.nameEn?.toLowerCase().includes(q) ||
          a.student?.nameBn?.includes(q) ||
          a.student?.class?.toLowerCase().includes(q) ||
          a.room?.roomNumber?.toLowerCase().includes(q) ||
          a.bedNumber?.toLowerCase().includes(q)
      )
    }
    if (filterRoom) {
      list = list.filter((a) => a.roomId === filterRoom)
    }
    return list.sort((a, b) => {
      const aName = a.student?.nameEn || ''
      const bName = b.student?.nameEn || ''
      return aName.localeCompare(bName)
    })
  }, [enrichedAssignments, searchQuery, filterRoom])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const totalRent = filtered.reduce((sum, a) => sum + a.monthlyRent, 0)

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
      [bn ? 'রুম' : 'Room']: a.room?.roomNumber || '',
      [bn ? 'বেড' : 'Bed']: a.bedNumber,
      [bn ? 'বছর' : 'Year']: a.academicYear,
      [bn ? 'মাস' : 'Months']: (a.months || []).map((m) => (bn ? MONTH_NAMES_BN[m] : MONTH_NAMES[m])).join(', '),
      [bn ? 'ভাড়া (৳)' : 'Rent (৳)']: a.monthlyRent,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'হোস্টেল ছাত্র' : 'Hostel Students')
    XLSX.writeFile(wb, `hostel-students-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, bn])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[0.8125rem] text-[var(--text-secondary)] hidden sm:inline">
            {bn ? `${filtered.length} জন ছাত্র বরাদ্দ` : `${filtered.length} students assigned`}
          </span>
          {filtered.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--brand)]/8 text-[var(--brand)] text-[0.75rem] font-semibold whitespace-nowrap">
              {bn ? 'মোট ভাড়া' : 'Total'}: ৳{bn ? toBnNum(totalRent) : totalRent.toLocaleString()}
            </span>
          )}
          <button onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium border transition-colors cursor-pointer ${showFilters || filterRoom ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)]'}`}>
            <Filter size={14} />
            {bn ? 'ফিল্টার' : 'Filters'}
            {filterRoom && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
          </button>
          {filterRoom && (
            <button onClick={() => { setFilterRoom(''); setPage(1) }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer">
              <X size={12} />{bn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
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
            <UserPlus size={15} />
            {bn ? 'ছাত্র যোগ' : 'Assign'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <select value={filterRoom} onChange={(e) => { setFilterRoom(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors cursor-pointer">
            <option value="">{bn ? 'সব রুম' : 'All Rooms'}</option>
            {rooms.filter((r) => r.isActive).map((r) => (
              <option key={r.id} value={r.id}>{r.roomNumber} — {bn ? r.nameBn : r.name}</option>
            ))}
          </select>
          {filterRoom && (
            <button onClick={() => { setFilterRoom(''); setPage(1) }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer">
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
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রুম' : 'Room'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বেড' : 'Bed'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'মাস' : 'Months'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ভাড়া' : 'Rent'}</th>
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
                        <Home size={12} className="text-[var(--text-muted)] shrink-0" />
                        {a.room?.roomNumber || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-[0.8125rem] text-[var(--text-secondary)]">
                        <BedDouble size={12} className="text-[var(--text-muted)]" />
                        {a.bedNumber || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                          {(() => {
                            const mArr = a.months || []
                            if (mArr.length === 0) return bn ? 'কোনো মাস নির্বাচিত হয়নি' : 'No months'
                            return bn ? `${toBnNum(mArr.length)} মাস` : `${mArr.length} ${mArr.length === 1 ? 'mo' : 'mos'}`
                          })()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.625rem] font-medium whitespace-nowrap ${
                          !a.isActive || a.academicYear !== currentSession
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-[var(--green-light)] text-[var(--green)]'
                        }`}>
                          <CalendarDays size={9} />
                          {!a.isActive || a.academicYear !== currentSession
                            ? (bn ? `নিষ্ক্রিয় ${a.academicYear}` : `Inactive ${a.academicYear}`)
                            : (() => {
                                const mArr = a.months || []
                                if (mArr.length === 0) return a.academicYear || '—'
                                const first = bn ? MONTH_NAMES_BN[mArr[0]].slice(0, 3) : MONTH_NAMES[mArr[0]].slice(0, 3)
                                const last = bn ? MONTH_NAMES_BN[mArr[mArr.length - 1]].slice(0, 3) : MONTH_NAMES[mArr[mArr.length - 1]].slice(0, 3)
                                return mArr.length === 1 ? first : `${first}–${last}`
                              })()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                        ৳{bn ? toBnNum(a.monthlyRent) : a.monthlyRent}
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
          message={bn ? 'এই ছাত্রের হোস্টেল বরাদ্দ মুছে ফেলা হবে।' : "This student's hostel assignment will be removed."}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isBn={bn}
        />
      )}
    </div>
  )
}
