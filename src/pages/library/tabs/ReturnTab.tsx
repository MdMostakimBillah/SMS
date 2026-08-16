import { useState, useMemo, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw, BookOpen, Clock, AlertCircle, Trash2, Edit, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore, calcFine } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'
import { labelCls } from '@/pages/hr/utils'
import { BOOK_CONDITIONS, BOOK_CONDITIONS_BN, type BookCondition } from '../types'

interface Props { searchQuery: string }

function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

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

export function ReturnTab({ searchQuery }: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const returnBook = useLibraryStore((s) => s.returnBook)
  const deleteBorrowing = useLibraryStore((s) => s.deleteBorrowing)
  const updateBorrowing = useLibraryStore((s) => s.updateBorrowing)
  const settings = useLibraryStore((s) => s.settings)
  const students = useAdmissionStore((s) => s.students)

  const [selectedBorrowing, setSelectedBorrowing] = useState<string | null>(null)
  const [returnCondition, setReturnCondition] = useState<BookCondition>('good')
  const [fine, setFine] = useState(0)
  const [fineReason, setFineReason] = useState('')
  const [showReturnModal, setShowReturnModal] = useState(false)
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
    if (!searchQuery) return enriched
    const q = searchQuery.toLowerCase()
    return enriched.filter((b) =>
      b.bookName.toLowerCase().includes(q) || b.studentName.toLowerCase().includes(q) ||
      b.barcode.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
    )
  }, [enriched, searchQuery])

  const selected = useMemo(() => enriched.find((b) => b.id === selectedBorrowing), [enriched, selectedBorrowing])
  const deleteTarget = useMemo(() => enriched.find((b) => b.id === deleteId), [enriched, deleteId])
  const editTarget = useMemo(() => enriched.find((b) => b.id === editId), [enriched, editId])

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
    setShowReturnModal(false)
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
            <div key={b.id}
              className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface)]`}>
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
                <button onClick={() => { setSelectedBorrowing(b.id); setShowReturnModal(true) }}
                  className="p-1.5 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/20 transition-colors"
                  title={bn ? 'ফেরত নিন' : 'Return'}>
                  <RotateCcw size={13} />
                </button>
                <button onClick={() => { setEditId(b.id); setEditDueDate(b.dueDate) }}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors"
                  title={bn ? 'সম্পাদনা' : 'Edit'}>
                  <Edit size={13} />
                </button>
                <button onClick={() => setDeleteId(b.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                  title={bn ? 'মুছুন' : 'Delete'}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return Details Modal */}
      {showReturnModal && selected && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReturnModal(false)}>
            <div className="relative w-full max-w-[40rem] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center">
                  <RotateCcw size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'ফেরত বিবরণ' : 'Return Details'}</h3>
                  <p className="text-[0.6875rem] text-[var(--text-secondary)]">{selected.id}</p>
                </div>
                <button onClick={() => setShowReturnModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ছাত্র:' : 'Student:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.studentName}</span></div>
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'বই:' : 'Book:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.bookName}</span></div>
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ইস্যু তারিখ:' : 'Issue Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.issueDate}</span></div>
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ফেরত তারিখ:' : 'Due Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.dueDate}</span></div>
                  {selected.barcode && <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'বারকোড:' : 'Barcode:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.barcode}</span></div>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{bn ? 'বইয়ের অবস্থা' : 'Book Condition'}</label>
                    <select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value as BookCondition)} className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30">
                      {BOOK_CONDITIONS.map((c) => (
                        <option key={c} value={c}>{bn ? BOOK_CONDITIONS_BN[c] : c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{bn ? 'জরিমানা (৳)' : 'Fine (৳)'}</label>
                    <input type="number" min={0} value={fine} onChange={(e) => setFine(Math.max(0, parseInt(e.target.value) || 0))} className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'জরিমানার কারণ' : 'Fine Reason'}</label>
                  <input value={fineReason} onChange={(e) => setFineReason(e.target.value)} className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30" placeholder={bn ? 'কারণ লিখুন...' : 'Enter reason...'} />
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
                <button onClick={() => setShowReturnModal(false)} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button onClick={() => setShowConfirm(true)} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]">
                  {bn ? 'বই ফেরত নিন' : 'Return Book'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Confirm Return Modal */}
      {showConfirm && selected && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
            <div className="relative w-full max-w-[40rem] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center">
                  <RotateCcw size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'ফেরত নিশ্চিত করুন' : 'Confirm Return'}</h3>
                </div>
                <button onClick={() => setShowConfirm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-2 text-[0.8125rem]">
                <div><span className="text-[var(--text-secondary)]">{bn ? 'ছাত্র:' : 'Student:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.studentName}</span></div>
                <div><span className="text-[var(--text-secondary)]">{bn ? 'বই:' : 'Book:'}</span> <span className="font-medium text-[var(--text-primary)]">{selected.bookName}</span></div>
                {fine > 0 && (
                  <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-600">
                    {bn ? `জরিমানা: ৳${toBnNum(fine)} — ${fineReason}` : `Fine: ৳${fine} — ${fineReason}`}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button onClick={handleReturn} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]">
                  {bn ? 'নিশ্চিত করুন' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && deleteTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
            <div className="relative w-full max-w-[40rem] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-red-500/5 to-red-500/10">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'ধার মুছুন' : 'Delete Borrowing'}</h3>
                  <p className="text-[0.6875rem] text-[var(--text-secondary)]">{deleteTarget.id}</p>
                </div>
                <button onClick={() => setDeleteId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1.5">
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ছাত্র:' : 'Student:'}</span> <span className="font-medium text-[var(--text-primary)]">{deleteTarget.studentName}</span></div>
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'বই:' : 'Book:'}</span> <span className="font-medium text-[var(--text-primary)]">{deleteTarget.bookName}</span></div>
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ইস্যু তারিখ:' : 'Issue Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{deleteTarget.issueDate}</span></div>
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ফেরত তারিখ:' : 'Due Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{deleteTarget.dueDate}</span></div>
                </div>
                <p className="text-[0.8125rem] text-[var(--text-secondary)]">
                  {bn ? 'আপনি কি নিশ্চিত এই ধার মুছে ফেলতে চান? এটি অপরিবর্তনীয়।' : 'Are you sure you want to delete this borrowing? This action cannot be undone.'}
                </p>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500 text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-red-500/25 hover:scale-[1.01] active:scale-[0.99]">
                  {bn ? 'মুছুন' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Edit Due Date Modal */}
      {editId && editTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditId(null)}>
            <div className="relative w-full max-w-[40rem] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center">
                  <Edit size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'ফেরত তারিখ পরিবর্তন' : 'Edit Due Date'}</h3>
                  <p className="text-[0.6875rem] text-[var(--text-secondary)]">{editTarget.id}</p>
                </div>
                <button onClick={() => setEditId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'ছাত্র:' : 'Student:'}</span> <span className="font-medium text-[var(--text-primary)]">{editTarget.studentName}</span></div>
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'বই:' : 'Book:'}</span> <span className="font-medium text-[var(--text-primary)]">{editTarget.bookName}</span></div>
                  <div className="text-[0.8125rem]"><span className="text-[var(--text-secondary)]">{bn ? 'বর্তমান ফেরত তারিখ:' : 'Current Due Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{editTarget.dueDate}</span></div>
                </div>

                <div>
                  <label className={labelCls}>{bn ? 'নতুন ফেরত তারিখ' : 'New Due Date'}</label>
                  <input type="date" value={editDueDate} min={today()}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30" />
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
                <button onClick={() => setEditId(null)} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]">
                  {bn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
