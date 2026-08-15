import { useState, useMemo, useEffect } from 'react'
import { RotateCcw, Search, BookOpen, Clock, AlertCircle, Trash2, Edit } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore, calcFine } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'
import { modalOverlayCls, modalStyleCls, labelCls } from '@/pages/hr/utils'
import { BOOK_CONDITIONS, BOOK_CONDITIONS_BN, type BookCondition } from '../types'

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

export function ReturnTab(_props: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const returnBook = useLibraryStore((s) => s.returnBook)
  const deleteBorrowing = useLibraryStore((s) => s.deleteBorrowing)
  const updateBorrowing = useLibraryStore((s) => s.updateBorrowing)
  const settings = useLibraryStore((s) => s.settings)
  const students = useAdmissionStore((s) => s.students)

  const [search, setSearch] = useState('')
  const [selectedBorrowing, setSelectedBorrowing] = useState<string | null>(null)
  const [returnCondition, setReturnCondition] = useState<BookCondition>('good')
  const [fine, setFine] = useState(0)
  const [fineReason, setFineReason] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDueDate, setEditDueDate] = useState('')

  const activeBorrowings = useMemo(() =>
    borrowings.filter((b) => b.status === 'borrowed' || b.status === 'overdue'),
    [borrowings]
  )

  const enriched = useMemo(() => {
    return activeBorrowings.map((b) => {
      const book = books.find((bk) => bk.id === b.bookId)
      const student = students.find((s) => s.id === b.studentId)
      const copy = copies.find((c) => c.id === b.copyId)
      const currentFine = calcFine(b.dueDate, settings.finePerDay)
      return {
        ...b,
        bookName: bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || ''),
        studentName: bn ? (student?.nameBn || student?.nameEn || '') : (student?.nameEn || student?.nameBn || ''),
        barcode: copy?.barcode || '',
        currentFine,
      }
    })
  }, [activeBorrowings, books, students, copies, settings.finePerDay, bn])

  const filtered = useMemo(() => {
    if (!search) return enriched
    const q = search.toLowerCase()
    return enriched.filter((b) =>
      b.bookName.toLowerCase().includes(q) || b.studentName.toLowerCase().includes(q) ||
      b.barcode.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
    )
  }, [enriched, search])

  const selected = useMemo(() => enriched.find((b) => b.id === selectedBorrowing), [enriched, selectedBorrowing])

  useEffect(() => {
    if (selected) {
      const currentFine = calcFine(selected.dueDate, settings.finePerDay)
      setFine(currentFine)
      setFineReason(currentFine > 0 ? 'Late return' : '')
    }
  }, [selected, settings.finePerDay])

  const handleReturn = () => {
    if (!selectedBorrowing) return
    returnBook(selectedBorrowing, returnCondition, fine, fineReason)
    setSelectedBorrowing(null)
    setReturnCondition('good')
    setFine(0)
    setFineReason('')
    setShowConfirm(false)
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteBorrowing(deleteId)
    setDeleteId(null)
  }

  const handleEdit = () => {
    if (!editId || !editDueDate) return
    updateBorrowing(editId, { dueDate: editDueDate })
    setEditId(null)
    setEditDueDate('')
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none"
          placeholder={bn ? 'ছাত্র, বই, বারকোড দিয়ে খুঁজুন...' : 'Search by student, book, barcode...'}
        />
      </div>

      {/* Active Borrowings */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Clock size={14} />
            {bn ? 'সক্রিয় ধার' : 'Active Borrowings'} ({bn ? toBnNum(filtered.length) : filtered.length})
          </h3>
        </div>
        <div className="max-h-[28rem] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="py-8 text-center text-[0.75rem] text-[var(--text-secondary)]">
              {bn ? 'কোনো সক্রিয় ধার নেই' : 'No active borrowings'}
            </div>
          )}
          {filtered.map((b) => (
            <div key={b.id} onClick={() => setSelectedBorrowing(b.id)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 cursor-pointer transition-colors ${
                selectedBorrowing === b.id ? 'bg-[var(--brand-light)]/10 border-l-2 border-l-[var(--brand)]' : 'hover:bg-[var(--surface)]'
              }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                b.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--brand-light)] text-[var(--brand)]'
              }`}>
                {b.status === 'overdue' ? <AlertCircle size={16} /> : <BookOpen size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[0.8125rem] text-[var(--text-primary)] truncate">{b.studentName}</div>
                <div className="text-[0.6875rem] text-[var(--text-secondary)] truncate">{b.bookName}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <CountdownTimer dueDate={b.dueDate} />
                {b.currentFine > 0 && (
                  <div className="text-[0.625rem] text-red-500 font-medium">
                    {bn ? `৳${toBnNum(b.currentFine)} জরিমানা` : `৳${b.currentFine} fine`}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setEditId(b.id); setEditDueDate(b.dueDate) }}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors"
                  title={bn ? 'সম্পাদনা' : 'Edit'}>
                  <Edit size={13} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(b.id) }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                  title={bn ? 'মুছুন' : 'Delete'}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return Form */}
      {selected && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <RotateCcw size={14} />
            {bn ? 'ফেরত বিবরণ' : 'Return Details'}
          </h3>
          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <div className="text-[0.75rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ছাত্র:' : 'Student:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.studentName}</span></div>
            <div className="text-[0.75rem]"><span className="text-[var(--text-secondary)]">{bn ? 'বই:' : 'Book:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.bookName}</span></div>
            <div className="text-[0.75rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ইস্যু তারিখ:' : 'Issue Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.issueDate}</span></div>
            <div className="text-[0.75rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ফেরত তারিখ:' : 'Due Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.dueDate}</span></div>
            {selected.barcode && <div className="text-[0.75rem]"><span className="text-[var(--text-secondary)]">{bn ? 'বারকোড:' : 'Barcode:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.barcode}</span></div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'বইয়ের অবস্থা' : 'Book Condition'}</label>
              <select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as BookCondition)} className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none">
                {BOOK_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{bn ? BOOK_CONDITIONS_BN[c] : c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{bn ? 'জরিমানা (৳)' : 'Fine (৳)'}</label>
              <input type="number" min={0} value={fine} onChange={(e) => setFine(Math.max(0, parseInt(e.target.value) || 0))} className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none" />
            </div>
          </div>
          <div>
            <label className={labelCls}>{bn ? 'জরিমানার কারণ' : 'Fine Reason'}</label>
            <input value={fineReason} onChange={(e) => setFineReason(e.target.value)} className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none" placeholder={bn ? 'কারণ লিখুন...' : 'Enter reason...'} />
          </div>

          <button onClick={() => setShowConfirm(true)} className="w-full py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium hover:opacity-90 transition-opacity">
            {bn ? 'বই ফেরত নিন' : 'Return Book'}
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && selected && (
        <div className={modalOverlayCls} onClick={() => setShowConfirm(false)}>
          <div className={`${modalStyleCls} max-w-[40rem]`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{bn ? 'ফেরত নিশ্চিত করুন' : 'Confirm Return'}</h3>
            <div className="space-y-2 text-[0.8125rem]">
              <div><span className="text-[var(--text-secondary)]">{bn ? 'ছাত্র:' : 'Student:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.studentName}</span></div>
              <div><span className="text-[var(--text-secondary)]">{bn ? 'বই:' : 'Book:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.bookName}</span></div>
              {fine > 0 && (
                <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-600">
                  {bn ? `জরিমানা: ৳${toBnNum(fine)} — ${fineReason}` : `Fine: ৳${fine} — ${fineReason}`}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-medium hover:bg-[var(--surface)]">
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleReturn} className="flex-1 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium hover:opacity-90">
                {bn ? 'নিশ্চিত করুন' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className={modalOverlayCls} onClick={() => setDeleteId(null)}>
          <div className={`${modalStyleCls} max-w-[28rem]`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{bn ? 'ধার মুছুন' : 'Delete Borrowing'}</h3>
            <p className="text-[0.8125rem] text-[var(--text-secondary)]">
              {bn ? 'আপনি কি নিশ্চিত এই ধার মুছে ফেলতে চান? এটি অপরিবর্তনীয়।' : 'Are you sure you want to delete this borrowing? This cannot be undone.'}
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-medium hover:bg-[var(--surface)]">
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[0.8125rem] font-medium hover:opacity-90">
                {bn ? 'মুছুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Due Date Modal */}
      {editId && (
        <div className={modalOverlayCls} onClick={() => setEditId(null)}>
          <div className={`${modalStyleCls} max-w-[28rem]`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{bn ? 'ফেরত তারিখ পরিবর্তন' : 'Edit Due Date'}</h3>
            <div>
              <label className={labelCls}>{bn ? 'নতুন ফেরত তারিখ' : 'New Due Date'}</label>
              <input type="date" value={editDueDate} min={today()}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditId(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-medium hover:bg-[var(--surface)]">
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleEdit} className="flex-1 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium hover:opacity-90">
                {bn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
