import { useState, useMemo, useRef, useCallback } from 'react'
import { Search, BookOpen, User, Calendar, AlertCircle, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useAuth } from '@/contexts/AuthContext'
import { useLibraryStore } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
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

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

export function IssueTab(_props: Props) {
  const bn = useBn()
  const { canCreate } = usePermission()
  const { user } = useAuth()
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const borrowings = useLibraryStore((s) => s.borrowings)
  const addBorrowing = useLibraryStore((s) => s.addBorrowing)
  const settings = useLibraryStore((s) => s.settings)
  const getNextBorrowingId = useLibraryStore((s) => s.getNextBorrowingId)
  const categories = useLibraryStore((s) => s.categories)
  const students = useAdmissionStore((s) => s.students)
  const currentSession = useClassStore((s) => s.institution.currentSession)
  const classes = useClassStore((s) => s.classes)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

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
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [studentActiveIdx, setStudentActiveIdx] = useState(-1)
  const [bookActiveIdx, setBookActiveIdx] = useState(-1)
  const [returnDate, setReturnDate] = useState(() => addDays(today(), settings.borrowingDurationDays))

  const studentDropdownRef = useRef<HTMLDivElement>(null)
  const bookDropdownRef = useRef<HTMLDivElement>(null)

  const filterSections = useMemo(() => filterClass ? (sectionsMap[filterClass] || []) : [], [filterClass, sectionsMap])

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
    let list = sessionStudents
    if (filterClass) list = list.filter((s) => s.class === filterClass)
    if (filterSection) list = list.filter((s) => s.section === filterSection)
    if (studentSearch) {
      const q = studentSearch.toLowerCase()
      list = list.filter((s) =>
        s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(q) || s.id.includes(q) || s.roll.includes(q)
      )
    }
    return list.slice(0, 50)
  }, [sessionStudents, filterClass, filterSection, studentSearch])

  const filteredBooks = useMemo(() => {
    let list = books.filter((b) => b.isActive && b.availableCopies > 0)
    if (filterCategory) list = list.filter((b) => b.categoryId === filterCategory)
    if (bookSearch) {
      const q = bookSearch.toLowerCase()
      list = list.filter((b) =>
        b.title.toLowerCase().includes(q) || b.titleBn.includes(q) ||
        b.author.toLowerCase().includes(q) || b.authorBn.includes(q) || b.isbn.includes(q)
      )
    }
    return list.slice(0, 50)
  }, [books, filterCategory, bookSearch])

  const canIssue = selectedStudent && selectedBook && selectedCopyId && studentBorrowCount < settings.maxBooksPerStudent

  const selectStudent = useCallback((s: typeof filteredStudents[0]) => {
    setSelectedStudentId(s.id)
    setStudentSearch(bn ? (s.nameBn || s.nameEn) : (s.nameEn || s.nameBn))
    setShowStudentDropdown(false)
    setStudentActiveIdx(-1)
  }, [bn])

  const selectBook = useCallback((b: typeof filteredBooks[0]) => {
    setSelectedBookId(b.id)
    setBookSearch(bn ? (b.titleBn || b.title) : (b.title || b.titleBn))
    setShowBookDropdown(false)
    setBookActiveIdx(-1)
    setSelectedCopyId('')
  }, [bn])

  const handleStudentKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showStudentDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setStudentActiveIdx((prev) => Math.min(prev + 1, filteredStudents.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setStudentActiveIdx((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && studentActiveIdx >= 0 && studentActiveIdx < filteredStudents.length) {
      e.preventDefault()
      selectStudent(filteredStudents[studentActiveIdx])
    } else if (e.key === 'Escape') {
      setShowStudentDropdown(false)
      setStudentActiveIdx(-1)
    }
  }, [showStudentDropdown, studentActiveIdx, filteredStudents, selectStudent])

  const handleBookKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showBookDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setBookActiveIdx((prev) => Math.min(prev + 1, filteredBooks.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setBookActiveIdx((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && bookActiveIdx >= 0 && bookActiveIdx < filteredBooks.length) {
      e.preventDefault()
      selectBook(filteredBooks[bookActiveIdx])
    } else if (e.key === 'Escape') {
      setShowBookDropdown(false)
      setBookActiveIdx(-1)
    }
  }, [showBookDropdown, bookActiveIdx, filteredBooks, selectBook])

  const handleIssue = () => {
    if (!canIssue || !selectedStudent || !selectedBook) return
    const id = getNextBorrowingId()
    const borrowing: Borrowing = {
      id, studentId: selectedStudentId, bookId: selectedBookId, copyId: selectedCopyId,
      issueDate: today(), dueDate: returnDate, status: 'borrowed', condition, fine: 0, fineReason: '',
      renewalCount: 0, librarianNote: note, issuedBy: user?.name || user?.email || 'admin', createdAt: today(),
    }
    addBorrowing(borrowing)
    setSelectedStudentId('')
    setSelectedBookId('')
    setSelectedCopyId('')
    setCondition('new')
    setNote('')
    setStudentSearch('')
    setBookSearch('')
    setFilterClass('')
    setFilterSection('')
    setFilterCategory('')
    setReturnDate(addDays(today(), settings.borrowingDurationDays))
  }

  return (
    <div className="space-y-4">
      {/* Student Selection */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <User size={14} />
          {bn ? 'ছাত্র নির্বাচন' : 'Select Student'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection('') }}
            className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs outline-none">
            <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs outline-none"
            disabled={!filterClass}>
            <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
            {filterSections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="relative" ref={studentDropdownRef}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={studentSearch}
            onChange={(e) => { setStudentSearch(e.target.value); setShowStudentDropdown(true); setStudentActiveIdx(-1) }}
            onFocus={() => { setShowStudentDropdown(true); setStudentActiveIdx(-1) }}
            onKeyDown={handleStudentKeyDown}
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none"
            placeholder={bn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
          />
          {studentSearch && (
            <button onClick={() => { setStudentSearch(''); setStudentActiveIdx(-1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <X size={13} />
            </button>
          )}
          {showStudentDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowStudentDropdown(false)} />
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg">
                {filteredStudents.map((s, i) => (
                  <button key={s.id} onClick={() => selectStudent(s)}
                    onMouseEnter={() => setStudentActiveIdx(i)}
                    className={`w-full text-left px-3 py-2 text-[0.75rem] border-b border-[var(--border)] last:border-b-0 ${
                      i === studentActiveIdx ? 'bg-[var(--surface)]' : 'hover:bg-[var(--surface)]'
                    }`}>
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
            <div className="min-w-0 flex-1">
              <div className="font-medium text-[var(--text-primary)] text-[0.8125rem] truncate">{bn ? (selectedStudent.nameBn || selectedStudent.nameEn) : (selectedStudent.nameEn || selectedStudent.nameBn)}</div>
              <div className="text-[0.6875rem] text-[var(--text-secondary)]">{selectedStudent.class} | {selectedStudent.section} | Roll: {selectedStudent.roll}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'ধারে' : 'Borrowed'}</div>
              <div className="font-bold text-[var(--text-primary)]">{bn ? toBnNum(studentBorrowCount) : studentBorrowCount}/{bn ? toBnNum(settings.maxBooksPerStudent) : settings.maxBooksPerStudent}</div>
            </div>
            <button onClick={() => { setSelectedStudentId(''); setStudentSearch('') }}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors">
              <X size={14} />
            </button>
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
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs outline-none">
          <option value="">{bn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
          {categories.filter((c) => c.isActive).map((c) => (
            <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
          ))}
        </select>
        <div className="relative" ref={bookDropdownRef}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={bookSearch}
            onChange={(e) => { setBookSearch(e.target.value); setShowBookDropdown(true); setBookActiveIdx(-1) }}
            onFocus={() => { setShowBookDropdown(true); setBookActiveIdx(-1) }}
            onKeyDown={handleBookKeyDown}
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none"
            placeholder={bn ? 'বইয়ের নাম বা লেখক দিয়ে খুঁজুন...' : 'Search by title or author...'}
          />
          {bookSearch && (
            <button onClick={() => { setBookSearch(''); setBookActiveIdx(-1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <X size={13} />
            </button>
          )}
          {showBookDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowBookDropdown(false)} />
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg">
                {filteredBooks.map((b, i) => (
                  <button key={b.id} onClick={() => selectBook(b)}
                    onMouseEnter={() => setBookActiveIdx(i)}
                    className={`w-full text-left px-3 py-2 text-[0.75rem] border-b border-[var(--border)] last:border-b-0 ${
                      i === bookActiveIdx ? 'bg-[var(--surface)]' : 'hover:bg-[var(--surface)]'
                    }`}>
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
            <div className="text-right flex-shrink-0">
              <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'উপলব্ধ' : 'Available'}</div>
              <div className="font-bold text-[var(--green)]">{bn ? toBnNum(availableCopies.length) : availableCopies.length}</div>
            </div>
            <button onClick={() => { setSelectedBookId(''); setSelectedCopyId(''); setBookSearch('') }}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors">
              <X size={14} />
            </button>
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
                  <option key={c} value={c}>{bn ? BOOK_CONDITIONS_BN[c] : capitalize(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{bn ? 'ফেরত তারিখ' : 'Returning Date'}</label>
              <input type="date" value={returnDate} min={today()}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none" />
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
              <span className="font-medium">{bn ? 'ফেরত তারিখ:' : 'Returning Date:'}</span> {returnDate}
            </div>
          </div>

          {canCreate('library.issue') && (
            <button onClick={() => setShowConfirm(true)} className="w-full py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium hover:opacity-90 transition-opacity">
              {bn ? 'বই ইস্যু করুন' : 'Issue Book'}
            </button>
          )}
        </div>
      )}

      {showConfirm && selectedStudent && selectedBook && (
        <div className={modalOverlayCls} onClick={() => setShowConfirm(false)}>
          <div className={`${modalStyleCls} max-w-[40rem]`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{bn ? 'ইস্যু নিশ্চিত করুন' : 'Confirm Issue'}</h3>
            <div className="space-y-2 text-[0.8125rem]">
              <div><span className="text-[var(--text-secondary)]">{bn ? 'ছাত্র:' : 'Student:'}</span> <span className="font-medium text-[var(--text-primary)]">{bn ? (selectedStudent.nameBn || selectedStudent.nameEn) : (selectedStudent.nameEn || selectedStudent.nameBn)}</span></div>
              <div><span className="text-[var(--text-secondary)]">{bn ? 'বই:' : 'Book:'}</span> <span className="font-medium text-[var(--text-primary)]">{bn ? (selectedBook.titleBn || selectedBook.title) : (selectedBook.title || selectedBook.titleBn)}</span></div>
              <div><span className="text-[var(--text-secondary)]">{bn ? 'ফেরত তারিখ:' : 'Returning Date:'}</span> <span className="font-medium text-[var(--text-primary)]">{returnDate}</span></div>
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
