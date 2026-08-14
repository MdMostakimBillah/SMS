import { useState, useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore, calcFine } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'
import { PaginationControls } from '@/components/shared/PaginationControls'

interface Props { searchQuery: string }

export function OverdueTab({ searchQuery }: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const settings = useLibraryStore((s) => s.settings)
  const students = useAdmissionStore((s) => s.students)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<'days' | 'fine'>('days')

  const enriched = useMemo(() => {
    return borrowings
      .filter((b) => b.status === 'overdue')
      .map((b) => {
        const book = books.find((bk) => bk.id === b.bookId)
        const student = students.find((s) => s.id === b.studentId)
        const copy = copies.find((c) => c.id === b.copyId)
        const currentFine = calcFine(b.dueDate, settings.finePerDay)
        const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(b.dueDate).getTime()) / 86400000))
        return {
          ...b,
          bookName: book?.titleBn || book?.title || '',
          authorName: book?.authorBn || book?.author || '',
          studentName: student?.nameBn || student?.nameEn || '',
          className: student?.class || '',
          section: student?.section || '',
          email: student?.email || '',
          barcode: copy?.barcode || '',
          currentFine,
          daysOverdue,
        }
      })
  }, [borrowings, books, students, copies, settings.finePerDay])

  const filtered = useMemo(() => {
    let list = enriched
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((b) =>
        b.studentName.toLowerCase().includes(q) || b.bookName.toLowerCase().includes(q) ||
        b.barcode.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => sortBy === 'days' ? b.daysOverdue - a.daysOverdue : b.currentFine - a.currentFine)
  }, [enriched, searchQuery, sortBy])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const summary = useMemo(() => ({
    totalOverdue: enriched.length,
    totalFine: enriched.reduce((sum, b) => sum + b.currentFine, 0),
    avgDays: enriched.length > 0 ? Math.round(enriched.reduce((sum, b) => sum + b.daysOverdue, 0) / enriched.length) : 0,
  }), [enriched])

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { labelBn: 'মোট বিলম্বিত', labelEn: 'Total Overdue', value: summary.totalOverdue, color: 'var(--red, #ef4444)' },
          { labelBn: 'মোট জরিমানা', labelEn: 'Total Fine', value: `৳${summary.totalFine}`, color: 'var(--amber)' },
          { labelBn: 'গড় বিলম্ব', labelEn: 'Avg Days Late', value: summary.avgDays, color: 'var(--brand)' },
        ].map((s) => (
          <div key={s.labelEn} className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
            <div className="font-bold text-lg text-[var(--text-primary)]">{typeof s.value === 'number' ? (bn ? toBnNum(s.value) : s.value) : s.value}</div>
          </div>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'সাজান:' : 'Sort by:'}</span>
        {[
          { value: 'days', label: bn ? 'বিলম্বের দিন' : 'Days Overdue' },
          { value: 'fine', label: bn ? 'জরিমানা' : 'Fine Amount' },
        ].map((s) => (
          <button key={s.value} onClick={() => setSortBy(s.value as 'days' | 'fine')}
            className={`px-2.5 py-1 rounded text-[0.6875rem] font-medium border transition-colors ${
              sortBy === s.value ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20' : 'text-[var(--text-secondary)] border-[var(--border)]'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">#</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ছাত্র' : 'Student'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Book'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ফেরত তারিখ' : 'Due Date'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'দিন বিলম্বিত' : 'Days Late'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'জরিমানা' : 'Fine'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((b, idx) => (
                <tr key={b.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors">
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0 font-bold text-[0.625rem]">
                        {(b.studentName).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate max-w-[140px]">{b.studentName}</div>
                        <div className="text-[0.625rem] text-[var(--text-secondary)]">{b.className} | {b.section}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <BookOpen size={13} className="text-[var(--brand)] flex-shrink-0" />
                      <span className="text-[var(--text-primary)] truncate max-w-[140px]">{b.bookName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-primary)]">{b.dueDate}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-red-500">
                      {bn ? toBnNum(b.daysOverdue) : b.daysOverdue} {bn ? 'দিন' : 'days'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-amber-600">
                      {bn ? `৳${toBnNum(b.currentFine)}` : `৳${b.currentFine}`}
                    </span>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">
                    {bn ? 'কোনো বিলম্বিত বই নেই' : 'No overdue books'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} isBn={bn} />
      </div>
    </div>
  )
}
