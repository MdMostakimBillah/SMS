import { useState, useMemo, type ReactNode } from 'react'
import { BookOpen, RotateCcw, Eye, AlertTriangle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'

import { PaginationControls } from '@/components/shared/PaginationControls'

interface Props { searchQuery: string }

type ActivityType = 'all' | 'issue' | 'return' | 'overdue' | 'reading'

export function HistoryTab({ searchQuery }: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const books = useLibraryStore((s) => s.books)
  const readingSessions = useLibraryStore((s) => s.readingSessions)
  const digitalBooks = useLibraryStore((s) => s.digitalBooks)
  const students = useAdmissionStore((s) => s.students)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [filterType, setFilterType] = useState<ActivityType>('all')

  const allActivities = useMemo(() => {
    const items: { id: string; type: string; date: string; studentName: string; detail: string; icon: string }[] = []

    borrowings.forEach((b) => {
      const book = books.find((bk) => bk.id === b.bookId)
      const student = students.find((s) => s.id === b.studentId)
      const name = student?.nameBn || student?.nameEn || ''
      const bookName = book?.titleBn || book?.title || ''

      items.push({ id: `issue-${b.id}`, type: 'issue', date: b.issueDate, studentName: name, detail: bookName, icon: 'issue' })
      if (b.returnDate) {
        items.push({ id: `return-${b.id}`, type: 'return', date: b.returnDate, studentName: name, detail: bookName, icon: 'return' })
      }
      if (b.status === 'overdue') {
        items.push({ id: `overdue-${b.id}`, type: 'overdue', date: b.dueDate, studentName: name, detail: bookName, icon: 'overdue' })
      }
    })

    readingSessions.forEach((rs) => {
      const db = digitalBooks.find((d) => d.id === rs.digitalBookId)
      const book = db ? books.find((b) => b.id === db.bookId) : null
      const student = students.find((s) => s.id === rs.studentId)
      items.push({
        id: `read-${rs.id}`, type: 'reading', date: rs.lastRead,
        studentName: student?.nameBn || student?.nameEn || '',
        detail: book?.titleBn || book?.title || '',
        icon: 'reading',
      })
    })

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [borrowings, books, readingSessions, digitalBooks, students])

  const filtered = useMemo(() => {
    let list = allActivities
    if (filterType !== 'all') list = list.filter((a) => a.type === filterType)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((a) => a.studentName.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q))
    }
    return list
  }, [allActivities, filterType, searchQuery])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const iconMap: Record<string, { icon: ReactNode; color: string }> = {
    issue: { icon: <BookOpen size={13} />, color: 'var(--brand)' },
    return: { icon: <RotateCcw size={13} />, color: 'var(--green)' },
    overdue: { icon: <AlertTriangle size={13} />, color: 'var(--red, #ef4444)' },
    reading: { icon: <Eye size={13} />, color: 'var(--amber)' },
  }

  const typeLabels: Record<ActivityType, { en: string; bn: string }> = {
    all: { en: 'All', bn: 'সব' },
    issue: { en: 'Issues', bn: 'ইস্যু' },
    return: { en: 'Returns', bn: 'ফেরত' },
    overdue: { en: 'Overdue', bn: 'বিলম্বিত' },
    reading: { en: 'Reading', bn: 'পড়াশোনা' },
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(typeLabels) as ActivityType[]).map((t) => (
          <button key={t} onClick={() => { setFilterType(t); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border transition-colors ${
              filterType === t ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20' : 'text-[var(--text-secondary)] border-[var(--border)]'
            }`}>
            {bn ? typeLabels[t].bn : typeLabels[t].en}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">#</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ধরন' : 'Type'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ছাত্র' : 'Student'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'বিবরণ' : 'Detail'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((a, idx) => {
                const ic = iconMap[a.icon] || iconMap.issue
                return (
                  <tr key={a.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors">
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                    <td className="py-2.5 px-3 text-[var(--text-primary)]">{a.date}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium" style={{ background: `${ic.color}18`, color: ic.color }}>
                        {ic.icon}
                        {a.type === 'issue' ? (bn ? 'ইস্যু' : 'Issue') :
                         a.type === 'return' ? (bn ? 'ফেরত' : 'Return') :
                         a.type === 'overdue' ? (bn ? 'বিলম্বিত' : 'Overdue') :
                         (bn ? 'পড়াশোনা' : 'Reading')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-primary)] truncate max-w-[140px]">{a.studentName}</td>
                    <td className="py-2.5 px-3 text-[var(--text-primary)] truncate max-w-[180px]">{a.detail}</td>
                  </tr>
                )
              })}
              {paged.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">{bn ? 'কোনো ইতিহাস নেই' : 'No history found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} isBn={bn} />
      </div>
    </div>
  )
}
