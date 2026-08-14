import { useMemo } from 'react'
import { BookOpen, Clock, AlertTriangle, CheckCircle, TrendingUp, Tag } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore, calcFine } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'

interface Props { searchQuery: string }

export function DashboardTab(_props: Props) {
  const bn = useBn()
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const borrowings = useLibraryStore((s) => s.borrowings)
  const categories = useLibraryStore((s) => s.categories)
  const settings = useLibraryStore((s) => s.settings)
  const students = useAdmissionStore((s) => s.students)

  const stats = useMemo(() => {
    const totalCopies = copies.filter((c) => c.isActive).length
    const available = copies.filter((c) => c.status === 'available' && c.isActive).length
    const issued = borrowings.filter((b) => b.status === 'borrowed').length
    const overdue = borrowings.filter((b) => b.status === 'overdue').length
    const totalFines = borrowings.reduce((sum, b) => sum + b.fine, 0)
    const totalBooks = books.filter((b) => b.isActive).length
    return { totalCopies, available, issued, overdue, totalFines, totalBooks }
  }, [books, copies, borrowings])

  const categoryStats = useMemo(() => {
    return categories.filter((c) => c.isActive).map((cat) => {
      const catBooks = books.filter((b) => b.categoryId === cat.id && b.isActive)
      const catCopies = copies.filter((c) => catBooks.some((b) => b.id === c.bookId) && c.isActive)
      const catIssued = borrowings.filter((b) => b.status === 'borrowed' && catBooks.some((bk) => bk.id === b.bookId))
      return { ...cat, totalBooks: catBooks.length, totalCopies: catCopies.length, issued: catIssued.length }
    })
  }, [categories, books, copies, borrowings])

  const recentActivity = useMemo(() => {
    const recent = [...borrowings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
    return recent.map((b) => {
      const book = books.find((bk) => bk.id === b.bookId)
      const student = students.find((s) => s.id === b.studentId)
      return { ...b, bookName: book?.titleBn || book?.title || '', studentName: student?.nameBn || student?.nameEn || '' }
    })
  }, [borrowings, books, students])

  const overdueList = useMemo(() => {
    return borrowings
      .filter((b) => b.status === 'overdue')
      .map((b) => {
        const book = books.find((bk) => bk.id === b.bookId)
        const student = students.find((s) => s.id === b.studentId)
        const fine = calcFine(b.dueDate, settings.finePerDay)
        return { ...b, bookName: book?.titleBn || book?.title || '', studentName: student?.nameBn || student?.nameEn || '', currentFine: fine }
      })
  }, [borrowings, books, students, settings.finePerDay])

  return (
    <div className="space-y-4">
      {/* Category Stats */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <TrendingUp size={14} />
          {bn ? 'ক্যাটাগরি অনুযায়ী পরিসংখ্যান' : 'Category Statistics'}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {categoryStats.map((cat, i) => {
            const colors = [
              { text: 'text-[var(--brand)]', bg: 'bg-[var(--brand)]/10' },
              { text: 'text-[var(--green)]', bg: 'bg-[var(--green)]/10' },
              { text: 'text-[var(--amber)]', bg: 'bg-[var(--amber)]/10' },
              { text: 'text-purple-500', bg: 'bg-purple-500/10' },
              { text: 'text-[var(--red)]', bg: 'bg-[var(--red)]/10' },
              { text: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            ]
            const c = colors[i % colors.length]
            return (
              <div key={cat.id} className={`flex flex-col items-center p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:shadow-sm transition-all`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 ${c.bg}`}>
                  <Tag size={12} className={c.text} />
                </div>
                <div className="text-center min-w-0 w-full">
                  <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] truncate">
                    {bn ? cat.nameBn : cat.name}
                  </div>
                  <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                    {bn ? toBnNum(cat.totalBooks) : cat.totalBooks}
                  </div>
                  <div className="text-[0.5625rem] text-[var(--text-secondary)]">
                    {bn ? 'মোট বই' : 'Total'}
                  </div>
                  {cat.issued > 0 && (
                    <div className={`mt-1.5 text-[0.625rem] font-medium px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                      {bn ? `${toBnNum(cat.issued)} ধারে` : `${cat.issued} issued`}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Clock size={14} />
            {bn ? 'সাম্প্রতিক কার্যক্রম' : 'Recent Activity'}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentActivity.length === 0 && (
              <div className="text-[0.75rem] text-[var(--text-secondary)] text-center py-4">
                {bn ? 'কোনো সাম্প্রতিক কার্যক্রম নেই' : 'No recent activity'}
              </div>
            )}
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--surface)] text-[0.75rem]">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                  a.status === 'returned' ? 'bg-[var(--green-light)] text-[var(--green)]' :
                  a.status === 'overdue' ? 'bg-red-500/10 text-red-500' :
                  'bg-[var(--brand-light)] text-[var(--brand)]'
                }`}>
                  {a.status === 'returned' ? <CheckCircle size={13} /> :
                   a.status === 'overdue' ? <AlertTriangle size={13} /> :
                   <BookOpen size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--text-primary)] truncate">{a.studentName}</div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)] truncate">{a.bookName}</div>
                </div>
                <div className="text-[0.625rem] text-[var(--text-secondary)] flex-shrink-0">{a.issueDate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue Books */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            {bn ? 'বিলম্বিত বই' : 'Overdue Books'} ({bn ? toBnNum(overdueList.length) : overdueList.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {overdueList.length === 0 && (
              <div className="text-[0.75rem] text-[var(--text-secondary)] text-center py-4">
                {bn ? 'কোনো বিলম্বিত বই নেই' : 'No overdue books'}
              </div>
            )}
            {overdueList.map((o) => (
              <div key={o.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-[0.75rem]">
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-red-500/10 text-red-500">
                  <AlertTriangle size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--text-primary)] truncate">{o.studentName}</div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)] truncate">{o.bookName}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[0.6875rem] text-red-500 font-medium">
                    {bn ? `৳${toBnNum(o.currentFine)}` : `৳${o.currentFine}`}
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-secondary)]">
                    {bn ? `বােঝা: ${o.dueDate}` : `Due: ${o.dueDate}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fine Summary */}
      {stats.totalFines > 0 && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            {bn ? 'আর্থিক সারসংক্ষেপ' : 'Fine Summary'}
          </h3>
          <div className="flex items-center gap-4 text-[0.8125rem]">
            <span className="text-[var(--text-secondary)]">
              {bn ? `মোট আদায়কৃত: ` : `Total Collected: `}
              <span className="font-semibold text-[var(--green)]">
                {bn ? `৳${toBnNum(stats.totalFines)}` : `৳${stats.totalFines}`}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
