import { useState, useMemo } from 'react'
import { Search, BookOpen, User, Calendar, AlertCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { toBnNum } from '@/lib/i18n'
import { modalOverlayCls, modalStyleCls, labelCls } from '@/pages/hr/utils'
import type { Borrowing, BookCondition } from '../types'
import { BOOK_CONDITIONS, BOOK_CONDITIONS_BN } from '../types'

interface Props { searchQuery: string }

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function today() { return new Date().toISOString().split('T')[0] }

export function IssueTab(_props: Props) {
  const bn = useBn()
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const borrowings = useLibraryStore((s) => s.borrowings)
  const addBorrowing = useLibraryStore((s) => s.addBorrowing)
  const settings = useLibraryStore((s) => s.settings)
  const getNextBorrowingId = useLibraryStore((s) => s.getNextBorrowingId)
  const students = useAdmissionStore((s) => s.students)
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const sessionStudents = useMemo(() =>
    students.filter((s) => s.academicYear === currentSession && s.status === 'approved'),
    [students, currentSession]
  )

  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedBookId, setSelectedBookId] = useState('')
  const [selectedCopyId, setSelectedCopyId] = useState('')
  const [condition, setCondition] = useState<BookCondition>('new')
  const [note, setNote] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showBookDropdown, setShowBookDropdown] = useState(false)

  const selectedStudent = useMemo(() => sessionStudents.find((s) => s.id === selectedStudentId), [sessionStudents, selectedStudentId])
  const selectedBook = useMemo(() => books.find((b) => b.id === selectedBookId), [books, selectedBookId])
  const availableCopies = useMemo(() =>
    copies.filter((c) => c.bookId === selectedBookId && c.status === 'available' && c.isActive),
    [copies, selectedBookId]
  )

  const studentBorrowCount = useMemo(() =>
    borrowings.filter((b) => b.studentId === selectedStudentId && (b.status === 'borrowed' || b.status === 'overdue')).length,
    [borrowings, selectedStudentId]
  )

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return sessionStudents.slice(0, 50)
    const q = studentSearch.toLowerCase()
    return sessionStudents.filter((s) =>
      s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(q) || s.id.includes(q) || s.roll.includes(q)
    ).slice(0, 50)
  }, [sessionStudents, studentSearch])

  const filteredBooks = useMemo(() => {
    const activeBooks = books.filter((b) => b.isActive && b.availableCopies > 0)
    if (!bookSearch) return activeBooks.slice(0, 50)
    const q = bookSearch.toLowerCase()
    return activeBooks.filter((b) =>
      b.title.toLowerCase().includes(q) || b.titleBn.includes(q) ||
      b.author.toLowerCase().includes(q) || b.authorBn.includes(q) || b.isbn.includes(q)
    ).slice(0, 50)
  }, [books, bookSearch])

  const dueDate = addDays(today(), settings.borrowingDurationDays)

  const canIssue = selectedStudent && selectedBook && selectedCopyId && studentBorrowCount < settings.maxBooksPerStudent

  const handleIssue = () => {
    if (!canIssue || !selectedStudent || !selectedBook) return
    const id = getNextBorrowingId()
    const borrowing: Borrowing = {
      id, studentId: selectedStudentId, bookId: selectedBookId, copyId: selectedCopyId,
      issueDate: today(), dueDate, status: 'borrowed', condition, fine: 0, fineReason: '',
      renewalCount: 0, librarianNote: note, issuedBy: 'admin', createdAt: today(),
    }
    addBorrowing(borrowing)
    setSelectedStudentId('')
    setSelectedBookId('')
    setSelectedCopyId('')
    setCondition('new')
    setNote('')
    setStudentSearch('')
    setBookSearch('')
  }

  return (
    <div className="space-y-4">
      {/* Student Selection */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <User size={14} />
          {bn ? 'ছাত্র নির্বাচন' : 'Select Student'}
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={studentSearch}
            onChange={(e) => { setStudentSearch(e.target.value); setShowStudentDropdown(true) }}
            onFocus={() => setShowStudentDropdown(true)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none"
            placeholder={bn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
          />
          {showStudentDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowStudentDropdown(false)} />
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg">
                {filteredStudents.map((s) => (
                  <button key={s.id} onClick={() => { setSelectedStudentId(s.id); setStudentSearch(bn ? (s.nameBn || s.nameEn) : (s.nameEn || s.nameBn)); setShowStudentDropdown(false) }}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--surface)] text-[0.75rem] border-b border-[var(--border)] last:border-b-0">
                    <div className="font-medium text-[var(--text-primary)]">{bn ? (s.nameBn || s.nameEn) : (s.nameEn || s.nameBn)}</div>
                    <div className="text-[0.625rem] text-[var(--text-secondary)]">{s.class} | {s.section} | Roll: {s.roll} | {s.id}</div>
                  </button>
                ))}
                {filteredStudents.length === 0 && <div className="px-3 py-4 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}</div>}
              </div>
            </>
          )}
        </div>
        {selectedStudent && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--brand-light)]/5 border border-[var(--brand)]/10">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center font-bold text-sm">
              {(selectedStudent.nameEn || '').charAt(0)}
            </div>
            <div>
              <div className="font-medium text-[var(--text-primary)] text-[0.8125rem]">{bn ? (selectedStudent.nameBn || selectedStudent.nameEn) : (selectedStudent.nameEn || selectedStudent.nameBn)}</div>
              <div className="text-[0.6875rem] text-[var(--text-secondary)]">{selectedStudent.class} | {selectedStudent.section} | Roll: {selectedStudent.roll}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'ধারে' : 'Borrowed'}</div>
              <div className="font-bold text-[var(--text-primary)]">{bn ? toBnNum(studentBorrowCount) : studentBorrowCount}/{bn ? toBnNum(settings.maxBooksPerStudent) : settings.maxBooksPerStudent}</div>
            </div>
          </div>
        )}
        {selectedStudent && studentBorrowCount >= settings.maxBooksPerStudent && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-[0.75rem] text-red-500">
            <AlertCircle size={13} />
            {bn ? 'এই ছাত্র ইতিমধ্যে সর্বোচ্চ বই ধার করেছেন' : 'This student has already borrowed the maximum number of books'}
          </div>
        )}
      </div>

      {/* Book Selection */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen size={14} />
          {bn ? 'বই নির্বাচন' : 'Select Book'}
        </h3>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={bookSearch}
            onChange={(e) => { setBookSearch(e.target.value); setShowBookDropdown(true) }}
            onFocus={() => setShowBookDropdown(true)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none"
            placeholder={bn ? 'বইয়ের নাম বা লেখক দিয়ে খুঁজুন...' : 'Search by title or author...'}
          />
          {showBookDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowBookDropdown(false)} />
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg">
                {filteredBooks.map((b) => (
                  <button key={b.id} onClick={() => { setSelectedBookId(b.id); setBookSearch(bn ? (b.titleBn || b.title) : (b.title || b.titleBn)); setShowBookDropdown(false); setSelectedCopyId('') }}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--surface)] text-[0.75rem] border-b border-[var(--border)] last:border-b-0">
                    <div className="font-medium text-[var(--text-primary)]">{bn ? (b.titleBn || b.title) : (b.title || b.titleBn)}</div>
                    <div className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? (b.authorBn || b.author) : (b.author || b.authorBn)} | {b.isbn} | {b.availableCopies} {bn ? 'উপলব্ধ' : 'available'}</div>
                  </button>
                ))}
                {filteredBooks.length === 0 && <div className="px-3 py-4 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'কোনো বই পাওয়া যায়নি' : 'No books found'}</div>}
              </div>
            </>
          )}
        </div>
        {selectedBook && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="w-10 h-10 rounded-md bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--text-primary)] text-[0.8125rem] truncate">{bn ? (selectedBook.titleBn || selectedBook.title) : (selectedBook.title || selectedBook.titleBn)}</div>
              <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? (selectedBook.authorBn || selectedBook.author) : (selectedBook.author || selectedBook.authorBn)} | {selectedBook.shelf}</div>
            </div>
            <div className="text-right">
              <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'উপলব্ধ' : 'Available'}</div>
              <div className="font-bold text-[var(--green)]">{bn ? toBnNum(availableCopies.length) : availableCopies.length}</div>
            </div>
          </div>
        )}

        {selectedBook && availableCopies.length > 0 && (
          <div>
            <label className={labelCls}>{bn ? 'কপি নির্বাচন' : 'Select Copy'} *</label>
            <div className="flex flex-wrap gap-2">
              {availableCopies.map((c) => (
                <button key={c.id} onClick={() => setSelectedCopyId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border transition-all ${
                    selectedCopyId === c.id
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-md'
                      : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--brand)]/40'
                  }`}>
                  {c.barcode}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Issue Details */}
      {canIssue && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar size={14} />
            {bn ? 'ইস্যু বিবরণ' : 'Issue Details'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'অবস্থা' : 'Condition'}</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as BookCondition)} className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none">
                {BOOK_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{bn ? BOOK_CONDITIONS_BN[c] : c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{bn ? 'ফেরত তারিখ' : 'Due Date'}</label>
              <div className="py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem]">{dueDate}</div>
            </div>
          </div>
          <div>
            <label className={labelCls}>{bn ? 'নোট' : 'Note'}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none min-h-[2.5rem]" rows={2} />
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-[var(--brand-light)]/5 border border-[var(--brand)]/10 space-y-1">
            <div className="text-[0.75rem] text-[var(--text-primary)]">
              <span className="font-medium">{bn ? 'ছাত্র:' : 'Student:'}</span> {bn ? (selectedStudent?.nameBn || selectedStudent?.nameEn) : (selectedStudent?.nameEn || selectedStudent?.nameBn)}
            </div>
            <div className="text-[0.75rem] text-[var(--text-primary)]">
              <span className="font-medium">{bn ? 'বই:' : 'Book:'}</span> {bn ? (selectedBook?.titleBn || selectedBook?.title) : (selectedBook?.title || selectedBook?.titleBn)}
            </div>
            <div className="text-[0.75rem] text-[var(--text-primary)]">
              <span className="font-medium">{bn ? 'ফেরত তারিখ:' : 'Due Date:'}</span> {dueDate}
            </div>
          </div>

          <button onClick={() => setShowConfirm(true)} className="w-full py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium hover:opacity-90 transition-opacity">
            {bn ? 'বই ইস্যু করুন' : 'Issue Book'}
          </button>
        </div>
      )}

      {showConfirm && selectedStudent && selectedBook && (
        <div className={modalOverlayCls} onClick={() => setShowConfirm(false)}>
          <div className={`${modalStyleCls} max-w-[28rem]`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{bn ? 'ইস্যু নিশ্চিত করুন' : 'Confirm Issue'}</h3>
            <div className="space-y-2 text-[0.8125rem]">
              <div><span className="text-[var(--text-secondary)]">{bn ? 'ছাত্র:' : 'Student:'}</span> <span className="font-medium text-[var(--text-primary)]">{bn ? (selectedStudent.nameBn || selectedStudent.nameEn) : (selectedStudent.nameEn || selectedStudent.nameBn)}</span></div>
              <div><span className="text-[var(--text-secondary)]">{bn ? 'বই:' : 'Book:'}</span> <span className="font-medium text-[var(--text-primary)]">{bn ? (selectedBook.titleBn || selectedBook.title) : (selectedBook.title || selectedBook.titleBn)}</span></div>
              <div><span className="text-[var(--text-secondary)]">{bn ? 'ফেরত তারিখ:' : 'Due Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{dueDate}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-medium hover:bg-[var(--surface)]">
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={() => { handleIssue(); setShowConfirm(false) }} className="flex-1 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium hover:opacity-90">
                {bn ? 'নিশ্চিত করুন' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
