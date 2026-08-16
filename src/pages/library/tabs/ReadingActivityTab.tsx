import { useState, useMemo } from 'react'
import { BookOpen, Clock, CheckCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'
import { PaginationControls } from '@/components/shared/PaginationControls'

interface Props { searchQuery: string }

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function ReadingActivityTab({ searchQuery }: Props) {
  const bn = useBn()
  const readingSessions = useLibraryStore((s) => s.readingSessions)
  const digitalBooks = useLibraryStore((s) => s.digitalBooks)
  const books = useLibraryStore((s) => s.books)
  const students = useAdmissionStore((s) => s.students)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const enriched = useMemo(() => {
    return readingSessions.map((rs) => {
      const db = digitalBooks.find((d) => d.id === rs.digitalBookId)
      const book = db ? books.find((b) => b.id === db.bookId) : null
      const student = students.find((s) => s.id === rs.studentId)
      return {
        ...rs,
        bookTitle: bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || ''),
        studentName: bn ? (student?.nameBn || student?.nameEn || '') : (student?.nameEn || student?.nameBn || ''),
        className: student?.class || '',
        chapterCount: db?.chapters.length || 0,
      }
    })
  }, [readingSessions, digitalBooks, books, students, bn])

  const filtered = useMemo(() => {
    if (!searchQuery) return enriched
    const q = searchQuery.toLowerCase()
    return enriched.filter((r) =>
      r.studentName.toLowerCase().includes(q) || r.bookTitle.toLowerCase().includes(q)
    )
  }, [enriched, searchQuery])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const summary = useMemo(() => ({
    totalSessions: enriched.length,
    completed: enriched.filter((r) => r.isCompleted).length,
    inProgress: enriched.filter((r) => !r.isCompleted).length,
    totalTime: enriched.reduce((s, r) => s + r.totalTime, 0),
    avgProgress: enriched.length > 0 ? Math.round(enriched.reduce((s, r) => s + r.progress, 0) / enriched.length) : 0,
  }), [enriched])

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { labelBn: 'মোট সেশন', labelEn: 'Total Sessions', value: summary.totalSessions, icon: <BookOpen size={13} />, color: 'var(--brand)' },
          { labelBn: 'সম্পন্ন', labelEn: 'Completed', value: summary.completed, icon: <CheckCircle size={13} />, color: 'var(--green)' },
          { labelBn: 'চলমান', labelEn: 'In Progress', value: summary.inProgress, icon: <Clock size={13} />, color: 'var(--amber)' },
          { labelBn: 'মোট সময়', labelEn: 'Total Time', value: formatTime(summary.totalTime), icon: <Clock size={13} />, color: 'var(--brand)' },
        ].map((s) => (
          <div key={s.labelEn} className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="font-bold text-[0.875rem] text-[var(--text-primary)]">{typeof s.value === 'number' ? (bn ? toBnNum(s.value) : s.value) : s.value}</div>
              <div className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">#</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ছাত্র' : 'Student'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Book'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'অগ্রগতি' : 'Progress'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'সময়' : 'Time'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'শেষ পঠন' : 'Last Read'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'অবস্থা' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, idx) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors">
                  <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0 font-bold text-[0.625rem]">
                        {(r.studentName).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate max-w-[120px]">{r.studentName}</div>
                        <div className="text-[0.625rem] text-[var(--text-secondary)]">{r.className}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)] truncate max-w-[140px]">{r.bookTitle}</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${r.progress}%` }} />
                      </div>
                      <span className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? toBnNum(r.progress) : r.progress}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)]">{formatTime(r.totalTime)}</td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">{r.lastRead}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[0.625rem] font-medium ${
                      r.isCompleted ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--brand-light)] text-[var(--brand)]'
                    }`}>
                      {r.isCompleted ? (bn ? 'সম্পন্ন' : 'Completed') : (bn ? 'চলমান' : 'In Progress')}
                    </span>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">
                    {bn ? 'কোনো পড়াশোনার কার্যক্রম নেই' : 'No reading activity found'}
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
