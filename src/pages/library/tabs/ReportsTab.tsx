import { useMemo } from 'react'
import { BarChart3, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'

interface Props { searchQuery: string }

export function ReportsTab(_props: Props) {
  const bn = useBn()
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const borrowings = useLibraryStore((s) => s.borrowings)
  const categories = useLibraryStore((s) => s.categories)
  const readingSessions = useLibraryStore((s) => s.readingSessions)
  const digitalBooks = useLibraryStore((s) => s.digitalBooks)
  const students = useAdmissionStore((s) => s.students)

  const categoryReport = useMemo(() => {
    return categories.filter((c) => c.isActive).map((cat) => {
      const catBooks = books.filter((b) => b.categoryId === cat.id && b.isActive)
      const catCopies = copies.filter((c) => catBooks.some((b) => b.id === c.bookId))
      const issued = borrowings.filter((b) => b.status === 'borrowed' && catBooks.some((bk) => bk.id === b.bookId))
      const overdue = borrowings.filter((b) => b.status === 'overdue' && catBooks.some((bk) => bk.id === b.bookId))
      return {
        category: bn ? cat.nameBn : cat.name,
        totalBooks: catBooks.length,
        totalCopies: catCopies.length,
        issued: issued.length,
        overdue: overdue.length,
        utilization: catCopies.length > 0 ? Math.round((issued.length / catCopies.length) * 100) : 0,
      }
    })
  }, [categories, books, copies, borrowings, bn])

  const mostBorrowed = useMemo(() => {
    const counts: Record<string, number> = {}
    borrowings.forEach((b) => { counts[b.bookId] = (counts[b.bookId] || 0) + 1 })
    return Object.entries(counts)
      .map(([bookId, count]) => {
        const book = books.find((b) => b.id === bookId)
        return { title: bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || ''), count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [borrowings, books, bn])

  const topDefaulters = useMemo(() => {
    const fines: Record<string, { name: string; fine: number; count: number }> = {}
    borrowings.filter((b) => b.status === 'overdue' || b.fine > 0).forEach((b) => {
      const student = students.find((s) => s.id === b.studentId)
      const name = bn ? (student?.nameBn || student?.nameEn || b.studentId) : (student?.nameEn || student?.nameBn || b.studentId)
      if (!fines[b.studentId]) fines[b.studentId] = { name, fine: 0, count: 0 }
      fines[b.studentId].fine += b.fine
      if (b.status === 'overdue') fines[b.studentId].count++
    })
    return Object.values(fines).sort((a, b) => b.fine - a.fine).slice(0, 5)
  }, [borrowings, students, bn])

  const digitalReport = useMemo(() => {
    const totalSessions = readingSessions.length
    const completed = readingSessions.filter((r) => r.isCompleted).length
    const totalTime = readingSessions.reduce((s, r) => s + r.totalTime, 0)
    const avgProgress = totalSessions > 0 ? Math.round(readingSessions.reduce((s, r) => s + r.progress, 0) / totalSessions) : 0
    return { totalSessions, completed, totalTime, avgProgress, totalBooks: digitalBooks.length }
  }, [readingSessions, digitalBooks])

  return (
    <div className="space-y-4">
      {/* Category Report */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <BarChart3 size={14} />
          {bn ? 'ক্যাটাগরি রিপোর্ট' : 'Category Report'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-2 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Books'}</th>
                <th className="py-2 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'কপি' : 'Copies'}</th>
                <th className="py-2 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'প্রদত্ত' : 'Issued'}</th>
                <th className="py-2 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'বিলম্বিত' : 'Overdue'}</th>
                <th className="py-2 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ব্যবহার' : 'Utilization'}</th>
              </tr>
            </thead>
            <tbody>
              {categoryReport.map((r) => (
                <tr key={r.category} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="py-2 px-3 font-medium text-[var(--text-primary)]">{r.category}</td>
                  <td className="py-2 px-3 text-[var(--text-primary)]">{bn ? toBnNum(r.totalBooks) : r.totalBooks}</td>
                  <td className="py-2 px-3 text-[var(--text-primary)]">{bn ? toBnNum(r.totalCopies) : r.totalCopies}</td>
                  <td className="py-2 px-3 text-[var(--brand)] font-medium">{bn ? toBnNum(r.issued) : r.issued}</td>
                  <td className="py-2 px-3 text-red-500 font-medium">{bn ? toBnNum(r.overdue) : r.overdue}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${r.utilization}%` }} />
                      </div>
                      <span className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? toBnNum(r.utilization) : r.utilization}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Borrowed */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <TrendingUp size={14} />
            {bn ? 'সর্বাধিক ধারৃত' : 'Most Borrowed'}
          </h3>
          <div className="space-y-2">
            {mostBorrowed.map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--surface)]">
                <span className="w-6 h-6 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center text-[0.625rem] font-bold">{i + 1}</span>
                <span className="flex-1 text-[0.75rem] text-[var(--text-primary)] truncate">{b.title}</span>
                <span className="text-[0.6875rem] font-bold text-[var(--brand)]">{bn ? toBnNum(b.count) : b.count}x</span>
              </div>
            ))}
            {mostBorrowed.length === 0 && <div className="py-4 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'তথ্য নেই' : 'No data'}</div>}
          </div>
        </div>

        {/* Top Defaulters */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            {bn ? 'শীর্ষ বিলম্বিতকারী' : 'Top Defaulters'}
          </h3>
          <div className="space-y-2">
            {topDefaulters.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-[0.625rem] font-bold">{i + 1}</span>
                <span className="flex-1 text-[0.75rem] text-[var(--text-primary)] truncate">{d.name}</span>
                <span className="text-[0.6875rem] font-bold text-red-500">{bn ? `৳${toBnNum(d.fine)}` : `৳${d.fine}`}</span>
              </div>
            ))}
            {topDefaulters.length === 0 && <div className="py-4 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'কোনো বিলম্বিতকারী নেই' : 'No defaulters'}</div>}
          </div>
        </div>
      </div>

      {/* Digital Report */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <BookOpen size={14} />
          {bn ? 'ডিজিটাল লাইব্রেরি রিপোর্ট' : 'Digital Library Report'}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { labelBn: 'ডিজিটাল বই', labelEn: 'Digital Books', value: digitalReport.totalBooks },
            { labelBn: 'মোট সেশন', labelEn: 'Sessions', value: digitalReport.totalSessions },
            { labelBn: 'সম্পন্ন', labelEn: 'Completed', value: digitalReport.completed },
            { labelBn: 'গড় অগ্রগতি', labelEn: 'Avg Progress', value: `${digitalReport.avgProgress}%` },
            { labelBn: 'মোট সময়', labelEn: 'Total Time', value: `${Math.round(digitalReport.totalTime / 3600)}h` },
          ].map((s) => (
            <div key={s.labelEn} className="p-2.5 rounded-lg bg-[var(--surface)] text-center">
              <div className="font-bold text-[0.875rem] text-[var(--text-primary)]">{typeof s.value === 'number' ? (bn ? toBnNum(s.value) : s.value) : s.value}</div>
              <div className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
