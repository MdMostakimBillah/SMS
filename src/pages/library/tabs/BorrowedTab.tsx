import { useState, useMemo, useEffect } from 'react'
import { BookOpen, RefreshCw } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'
import { PaginationControls } from '@/components/shared/PaginationControls'

interface Props { searchQuery: string }

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function today() { return new Date().toISOString().split('T')[0] }

function CountdownTimer({ dueDate }: { dueDate: string }) {
  const bn = useBn()
  const [now, setNow] = useState(today())
  useEffect(() => { const t = setInterval(() => setNow(today()), 60000); return () => clearInterval(t) }, [])
  const diff = daysBetween(now, dueDate)
  const isOverdue = diff < 0
  const days = Math.abs(diff)
  return (
    <span className={`font-mono text-[0.6875rem] font-bold ${isOverdue ? 'text-red-500' : diff <= 2 ? 'text-amber-500' : 'text-[var(--green)]'}`}>
      {isOverdue
        ? (bn ? `${toBnNum(days)} দিন বিলম্বিত` : `${days}d overdue`)
        : (bn ? `${toBnNum(days)} দিন বাকি` : `${days}d left`)
      }
    </span>
  )
}

export function BorrowedTab({ searchQuery }: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const renewBorrowing = useLibraryStore((s) => s.renewBorrowing)
  const settings = useLibraryStore((s) => s.settings)
  const students = useAdmissionStore((s) => s.students)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filterStatus, setFilterStatus] = useState('active')

  const enriched = useMemo(() => {
    return borrowings.map((b) => {
      const book = books.find((bk) => bk.id === b.bookId)
      const student = students.find((s) => s.id === b.studentId)
      const copy = copies.find((c) => c.id === b.copyId)
      return {
        ...b,
        bookName: bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || ''),
        studentName: bn ? (student?.nameBn || student?.nameEn || '') : (student?.nameEn || student?.nameBn || ''),
        className: student?.class || '',
        section: student?.section || '',
        barcode: copy?.barcode || '',
      }
    })
  }, [borrowings, books, students, copies, bn])

  const filtered = useMemo(() => {
    let list = enriched
    if (filterStatus === 'active') list = list.filter((b) => b.status === 'borrowed')
    else if (filterStatus === 'overdue') list = list.filter((b) => b.status === 'overdue')
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((b) =>
        b.studentName.toLowerCase().includes(q) || b.bookName.toLowerCase().includes(q) ||
        b.barcode.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [enriched, filterStatus, searchQuery])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const stats = useMemo(() => ({
    total: enriched.filter((b) => b.status === 'borrowed' || b.status === 'overdue').length,
    active: enriched.filter((b) => b.status === 'borrowed').length,
    overdue: enriched.filter((b) => b.status === 'overdue').length,
  }), [enriched])

  return (
    <div className="space-y-3">
      {/* Stats & Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: 'active', label: bn ? 'সক্রিয়' : 'Active', count: stats.active },
          { value: 'overdue', label: bn ? 'বিলম্বিত' : 'Overdue', count: stats.overdue },
          { value: 'all', label: bn ? 'সব' : 'All', count: stats.total },
        ].map((f) => (
          <button key={f.value} onClick={() => { setFilterStatus(f.value); setPage(1) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border transition-colors ${
              filterStatus === f.value
                ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20'
                : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/30'
            }`}>
            {f.label}
            <span className="text-[0.625rem] opacity-70">({bn ? toBnNum(f.count) : f.count})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">#</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ছাত্র' : 'Student'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Book'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ইস্যু' : 'Issue Date'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ফেরত' : 'Due Date'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কাউন্টডাউন' : 'Countdown'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'অবস্থা' : 'Status'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((b, idx) => (
                <tr key={b.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors">
                  <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                  <td className="py-2.5 px-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0 font-bold text-[0.625rem]">
                        {(b.studentName).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate max-w-[140px]">{b.studentName}</div>
                        <div className="text-[0.625rem] text-[var(--text-secondary)]">{b.className} | {b.section}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-left">
                    <div className="flex items-center gap-2">
                      <BookOpen size={13} className="text-[var(--brand)] flex-shrink-0" />
                      <span className="text-[var(--text-primary)] truncate max-w-[140px]">{b.bookName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)]">{b.issueDate}</td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)]">{b.dueDate}</td>
                  <td className="py-2.5 px-3 text-center"><CountdownTimer dueDate={b.dueDate} /></td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[0.625rem] font-medium ${
                      b.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--green-light)] text-[var(--green)]'
                    }`}>
                      {b.status === 'overdue' ? (bn ? 'বিলম্বিত' : 'Overdue') : (bn ? 'ধারে' : 'Borrowed')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {b.status === 'borrowed' && b.renewalCount < settings.renewalLimit && settings.allowRenewal && (
                      <button onClick={() => renewBorrowing(b.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors" title={bn ? 'পুনর্নবীকরণ' : 'Renew'}>
                        <RefreshCw size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--text-secondary)]">
                    {bn ? 'কোনো ধার পাওয়া যায়নি' : 'No borrowings found'}
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
