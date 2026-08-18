import { useState, useMemo } from 'react'
import { Eye } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore, calcFine } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { toBnNum } from '@/lib/i18n'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { StudentLibraryProfileModal } from '../modals/StudentLibraryProfileModal'

interface Props { searchQuery: string }

export function StudentProfilesTab({ searchQuery }: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const readingSessions = useLibraryStore((s) => s.readingSessions)
  const settings = useLibraryStore((s) => s.settings)
  const students = useAdmissionStore((s) => s.students)
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const sessionStudents = useMemo(() =>
    students.filter((s) => s.academicYear === currentSession && s.status === 'approved'),
    [students, currentSession]
  )

  const profiles = useMemo(() => {
    return sessionStudents.map((s) => {
      const studentBorrowings = borrowings.filter((b) => b.studentId === s.id)
      const activeBorrowings = studentBorrowings.filter((b) => b.status === 'borrowed' || b.status === 'overdue')
      const overdueCount = studentBorrowings.filter((b) => b.status === 'overdue').length
      const totalFine = studentBorrowings.reduce((sum, b) => sum + b.fine, 0)
      const pendingFine = activeBorrowings.reduce((sum, b) => sum + calcFine(b.dueDate, settings.finePerDay), 0)
      const totalBorrowed = studentBorrowings.filter((b) => b.status === 'returned').length
      const sessions = readingSessions.filter((r) => r.studentId === s.id)
      const digitalBooksRead = new Set(sessions.map((r) => r.digitalBookId)).size
      const readingTime = sessions.reduce((sum, r) => sum + r.totalTime, 0)
      const totalReadBooks = totalBorrowed + digitalBooksRead
      return {
        ...s, activeCount: activeBorrowings.length, overdueCount, totalFine, pendingFine,
        totalBorrowed, digitalBooksRead, readingTime, totalReadBooks,
      }
    })
  }, [sessionStudents, borrowings, readingSessions, settings.finePerDay])

  const filtered = useMemo(() => {
    if (!searchQuery) return profiles
    const q = searchQuery.toLowerCase()
    return profiles.filter((p) =>
      p.nameEn.toLowerCase().includes(q) || p.nameBn.includes(q) ||
      p.id.includes(q) || p.roll.includes(q) || p.class.includes(q)
    )
  }, [profiles, searchQuery])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {[
          { labelBn: 'মোট ছাত্র', labelEn: 'Total Students', value: profiles.length, color: 'var(--brand)' },
          { labelBn: 'মোট পড়েছে', labelEn: 'Total Read', value: profiles.reduce((sum, p) => sum + p.totalReadBooks, 0), color: 'var(--green)' },
          { labelBn: 'সক্রিয় ধারী', labelEn: 'Active Borrowers', value: profiles.filter((p) => p.activeCount > 0).length, color: 'var(--amber)' },
          { labelBn: 'বিলম্বিত', labelEn: 'With Overdue', value: profiles.filter((p) => p.overdueCount > 0).length, color: 'var(--red, #ef4444)' },
        ].map((s) => (
          <div key={s.labelEn} className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
            <div className="font-bold text-lg text-[var(--text-primary)]">{bn ? toBnNum(s.value) : s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">#</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ছাত্র' : 'Student'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'পড়েছে' : 'Read'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ধারে' : 'Active'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'বিলম্বিত' : 'Overdue'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ডিজিটাল' : 'Digital'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'জরিমানা' : 'Fine'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p, idx) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors">
                  <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                  <td className="py-2.5 px-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0 font-bold text-[0.6875rem]">
                        {(p.nameEn || '').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate max-w-[140px]">{bn ? (p.nameBn || p.nameEn) : (p.nameEn || p.nameBn)}</div>
                        <div className="text-[0.625rem] text-[var(--text-secondary)]">{p.class} | {p.section} | Roll: {p.roll}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[var(--green)]">{bn ? toBnNum(p.totalReadBooks) : p.totalReadBooks}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[var(--text-primary)]">{bn ? toBnNum(p.activeCount) : p.activeCount}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-bold ${p.overdueCount > 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                      {bn ? toBnNum(p.overdueCount) : p.overdueCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[var(--brand)]">{bn ? toBnNum(p.digitalBooksRead) : p.digitalBooksRead}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-bold ${p.pendingFine > 0 ? 'text-amber-600' : 'text-[var(--text-secondary)]'}`}>
                      {p.pendingFine > 0 ? (bn ? `৳${toBnNum(p.pendingFine)}` : `৳${p.pendingFine}`) : '৳০'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => setSelectedStudentId(p.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-[var(--text-secondary)]">{bn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} isBn={bn} />
      </div>

      {selectedStudentId && <StudentLibraryProfileModal studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />}
    </div>
  )
}
