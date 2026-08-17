import { useState, useMemo } from 'react'

import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'
import { PaginationControls } from '@/components/shared/PaginationControls'

interface Props { searchQuery: string }

type TxType = 'all' | 'issue' | 'return' | 'fine' | 'renewal'

export function TransactionsTab({ searchQuery }: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const books = useLibraryStore((s) => s.books)
  const students = useAdmissionStore((s) => s.students)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [filterType, setFilterType] = useState<TxType>('all')

  const transactions = useMemo(() => {
    const items: { id: string; type: string; date: string; studentName: string; bookName: string; amount: number; note: string }[] = []

    borrowings.forEach((b) => {
      const book = books.find((bk) => bk.id === b.bookId)
      const student = students.find((s) => s.id === b.studentId)
      const name = bn ? (student?.nameBn || student?.nameEn || '') : (student?.nameEn || student?.nameBn || '')
      const bookName = bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || '')

      items.push({ id: `t-issue-${b.id}`, type: 'issue', date: b.issueDate, studentName: name, bookName, amount: 0, note: bn ? 'বই ইস্যু' : 'Book issued' })
      if (b.returnDate) {
        items.push({ id: `t-return-${b.id}`, type: 'return', date: b.returnDate, studentName: name, bookName, amount: 0, note: bn ? 'বই ফেরত' : 'Book returned' })
      }
      if (b.fine > 0) {
        items.push({ id: `t-fine-${b.id}`, type: 'fine', date: b.returnDate || b.dueDate, studentName: name, bookName, amount: b.fine, note: b.fineReason })
      }
      if (b.renewalCount > 0) {
        items.push({ id: `t-renew-${b.id}`, type: 'renewal', date: b.dueDate, studentName: name, bookName, amount: 0, note: bn ? `${b.renewalCount} বার পুনর্নবীকৃত` : `Renewed ${b.renewalCount}x` })
      }
    })

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [borrowings, books, students, bn])

  const filtered = useMemo(() => {
    let list = transactions
    if (filterType !== 'all') list = list.filter((t) => t.type === filterType)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((t) => t.studentName.toLowerCase().includes(q) || t.bookName.toLowerCase().includes(q))
    }
    return list
  }, [transactions, filterType, searchQuery])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const summary = useMemo(() => ({
    issues: transactions.filter((t) => t.type === 'issue').length,
    returns: transactions.filter((t) => t.type === 'return').length,
    fines: transactions.filter((t) => t.type === 'fine').reduce((s, t) => s + t.amount, 0),
    renewals: transactions.filter((t) => t.type === 'renewal').length,
  }), [transactions])

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { labelBn: 'ইস্যু', labelEn: 'Issues', value: summary.issues, color: 'var(--brand)' },
          { labelBn: 'ফেরত', labelEn: 'Returns', value: summary.returns, color: 'var(--green)' },
          { labelBn: 'জরিমানা', labelEn: 'Fines', value: `৳${summary.fines}`, color: 'var(--amber)' },
          { labelBn: 'পুনর্নবীকরণ', labelEn: 'Renewals', value: summary.renewals, color: 'var(--brand)' },
        ].map((s) => (
          <div key={s.labelEn} className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
            <div className="font-bold text-[0.875rem] text-[var(--text-primary)]">{typeof s.value === 'number' ? (bn ? toBnNum(s.value) : s.value) : s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { value: 'all', label: 'All', labelBn: 'সব' },
          { value: 'issue', label: 'Issues', labelBn: 'ইস্যু' },
          { value: 'return', label: 'Returns', labelBn: 'ফেরত' },
          { value: 'fine', label: 'Fines', labelBn: 'জরিমানা' },
          { value: 'renewal', label: 'Renewals', labelBn: 'পুনর্নবীকরণ' },
        ] as { value: TxType; label: string; labelBn: string }[]).map((f) => (
          <button key={f.value} onClick={() => { setFilterType(f.value); setPage(1) }}
            className={`px-2.5 py-1 rounded-lg text-[0.75rem] font-medium border transition-colors ${
              filterType === f.value ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20' : 'text-[var(--text-secondary)] border-[var(--border)]'
            }`}>
            {bn ? f.labelBn : f.label}
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
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ধরন' : 'Type'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ছাত্র' : 'Student'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Book'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'নোট' : 'Note'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t, idx) => (
                <tr key={t.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors">
                  <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                  <td className="py-2.5 px-3 text-center text-[var(--text-primary)]">{t.date}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[0.625rem] font-medium ${
                      t.type === 'issue' ? 'bg-[var(--brand-light)] text-[var(--brand)]' :
                      t.type === 'return' ? 'bg-[var(--green-light)] text-[var(--green)]' :
                      t.type === 'fine' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-purple-500/10 text-purple-600'
                    }`}>
                      {t.type === 'issue' ? (bn ? 'ইস্যু' : 'Issue') :
                       t.type === 'return' ? (bn ? 'ফেরত' : 'Return') :
                       t.type === 'fine' ? (bn ? 'জরিমানা' : 'Fine') :
                       (bn ? 'পুনর্নবীকরণ' : 'Renewal')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-left text-[var(--text-primary)] truncate max-w-[120px]">{t.studentName}</td>
                  <td className="py-2.5 px-3 text-left text-[var(--text-primary)] truncate max-w-[140px]">{t.bookName}</td>
                  <td className="py-2.5 px-3 text-center">
                    {t.amount > 0 ? <span className="font-bold text-amber-600">{bn ? `৳${toBnNum(t.amount)}` : `৳${t.amount}`}</span> : <span className="text-[var(--text-secondary)]">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-left text-[var(--text-secondary)] truncate max-w-[140px]">{t.note}</td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-[var(--text-secondary)]">{bn ? 'কোনো লেনদেন নেই' : 'No transactions found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} isBn={bn} />
      </div>
    </div>
  )
}
