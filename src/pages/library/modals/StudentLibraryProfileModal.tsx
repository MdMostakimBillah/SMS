import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, BookOpen, CheckCircle, BookMarked, AlertTriangle, Clock, DollarSign, BookCopy } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore, calcFine } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'

interface Props {
  studentId: string
  onClose: () => void
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

type Tab = 'borrowed' | 'history' | 'reading' | 'fines'

export function StudentLibraryProfileModal({ studentId, onClose }: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const books = useLibraryStore((s) => s.books)
  const readingSessions = useLibraryStore((s) => s.readingSessions)
  const digitalBooks = useLibraryStore((s) => s.digitalBooks)
  const settings = useLibraryStore((s) => s.settings)
  const students = useAdmissionStore((s) => s.students)

  const [activeTab, setActiveTab] = useState<Tab>('borrowed')

  const student = useMemo(() => students.find((s) => s.id === studentId), [students, studentId])
  const studentBorrowings = useMemo(() => borrowings.filter((b) => b.studentId === studentId), [borrowings, studentId])
  const studentSessions = useMemo(() => readingSessions.filter((r) => r.studentId === studentId), [readingSessions, studentId])

  const activeBorrowings = studentBorrowings.filter((b) => b.status === 'borrowed' || b.status === 'overdue')
  const history = studentBorrowings.filter((b) => b.status === 'returned')
  const totalFine = studentBorrowings.reduce((s, b) => s + b.fine, 0)
  const pendingFine = activeBorrowings.reduce((s, b) => s + calcFine(b.dueDate, settings.finePerDay), 0)
  const totalReadBooks = history.length + new Set(studentSessions.map((r) => r.digitalBookId)).size
  const readingTime = studentSessions.reduce((sum, r) => sum + r.totalTime, 0)

  if (!student) return null

  const tabs: { id: Tab; label: string; labelBn: string; count: number; icon: React.ReactNode; color: string }[] = [
    { id: 'borrowed', label: 'Active', labelBn: 'সক্রিয়', count: activeBorrowings.length, icon: <BookOpen size={14} />, color: 'var(--brand)' },
    { id: 'history', label: 'History', labelBn: 'ইতিহাস', count: history.length, icon: <CheckCircle size={14} />, color: 'var(--green)' },
    { id: 'reading', label: 'Reading', labelBn: 'পড়াশোনা', count: studentSessions.length, icon: <BookMarked size={14} />, color: 'var(--amber)' },
    { id: 'fines', label: 'Fines', labelBn: 'জরিমানা', count: totalFine > 0 ? 1 : 0, icon: <DollarSign size={14} />, color: totalFine > 0 ? 'var(--red, #ef4444)' : 'var(--text-secondary)' },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[90dvw] h-[85dvh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Profile Section */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-[var(--brand)]/5 via-purple-500/5 to-pink-500/5 border-b border-[var(--border)]">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>

          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-purple-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-[var(--brand)]/20 flex-shrink-0">
              {(student.nameEn || '').charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{student.nameBn || student.nameEn}</h2>
              <div className="flex items-center gap-2 mt-1 text-[0.8125rem] text-[var(--text-secondary)]">
                <span>{student.class}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
                <span>{student.section}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
                <span>{bn ? 'রোল' : 'Roll'}: {student.roll}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
                <span className="font-mono text-[0.75rem]">{student.id}</span>
              </div>

              {/* Quick Stats Row */}
              <div className="flex items-center gap-4 mt-3">
                {[
                  { icon: <BookCopy size={14} />, value: totalReadBooks, labelBn: 'পড়েছে', labelEn: 'Read', color: 'var(--green)' },
                  { icon: <BookOpen size={14} />, value: activeBorrowings.length, labelBn: 'ধারে', labelEn: 'Active', color: 'var(--brand)' },
                  { icon: <Clock size={14} />, value: formatTime(readingTime), labelBn: 'সময়', labelEn: 'Time', color: 'var(--amber)' },
                  { icon: <DollarSign size={14} />, value: `৳${pendingFine}`, labelBn: 'বকেয়', labelEn: 'Pending', color: pendingFine > 0 ? 'var(--red, #ef4444)' : 'var(--text-secondary)' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[0.8125rem] font-bold text-[var(--text-primary)] leading-tight">{s.value}</div>
                      <div className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-[var(--border)]">
          <div className="flex gap-1 p-1 bg-[var(--surface)] rounded-xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[0.8125rem] font-medium transition-all ${
                  activeTab === t.id
                    ? 'bg-[var(--brand)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                }`}
              >
                {t.icon}
                {bn ? t.labelBn : t.label}
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold ${
                    activeTab === t.id ? 'bg-white/20 text-white' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                  }`}>
                    {bn ? toBnNum(t.count) : t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'borrowed' && (
            <div className="space-y-2">
              {activeBorrowings.length > 0 ? activeBorrowings.map((b) => {
                const book = books.find((bk) => bk.id === b.bookId)
                const isOverdue = b.status === 'overdue'
                return (
                  <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    isOverdue ? 'bg-red-500/5 border-red-500/10' : 'bg-[var(--surface)] border-[var(--border)]'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-[var(--brand-light)] text-[var(--brand)]'
                    }`}>
                      <BookOpen size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[0.8125rem] text-[var(--text-primary)] truncate">{book?.titleBn || book?.title}</div>
                      <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                        {bn ? `ইস্যু: ${b.issueDate}` : `Issued: ${b.issueDate}`} · {bn ? `ফেরত: ${b.dueDate}` : `Due: ${b.dueDate}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverdue && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-[0.6875rem] font-medium">
                          <AlertTriangle size={12} />
                          {bn ? 'বিলম্বিত' : 'Overdue'}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium ${
                        isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-[var(--green-light)] text-[var(--green)]'
                      }`}>
                        {isOverdue ? (bn ? 'বিলম্বিত' : 'Overdue') : (bn ? 'সক্রিয়' : 'Active')}
                      </span>
                    </div>
                  </div>
                )
              }) : (
                <div className="py-12 text-center text-[0.8125rem] text-[var(--text-secondary)]">{bn ? 'কোনো সক্রিয় ধার নেই' : 'No active borrowings'}</div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {history.length > 0 ? history.map((b) => {
                const book = books.find((bk) => bk.id === b.bookId)
                return (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--green-light)] text-[var(--green)] flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[0.8125rem] text-[var(--text-primary)] truncate">{book?.titleBn || book?.title}</div>
                      <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                        {bn ? `ইস্যু: ${b.issueDate}` : `Issued: ${b.issueDate}`} · {bn ? `ফেরত: ${b.returnDate}` : `Returned: ${b.returnDate}`}
                      </div>
                    </div>
                    {b.fine > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[0.6875rem] font-medium">
                        <DollarSign size={12} />
                        {bn ? `৳${toBnNum(b.fine)}` : `৳${b.fine}`}
                      </span>
                    )}
                  </div>
                )
              }) : (
                <div className="py-12 text-center text-[0.8125rem] text-[var(--text-secondary)]">{bn ? 'কোনো ইতিহাস নেই' : 'No history'}</div>
              )}
            </div>
          )}

          {activeTab === 'reading' && (
            <div className="space-y-2">
              {studentSessions.length > 0 ? studentSessions.map((rs) => {
                const db = digitalBooks.find((d) => d.id === rs.digitalBookId)
                const book = db ? books.find((b) => b.id === db.bookId) : null
                return (
                  <div key={rs.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
                      <BookMarked size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[0.8125rem] text-[var(--text-primary)] truncate">{book?.titleBn || book?.title}</div>
                      <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                        {formatTime(rs.totalTime)} · {bn ? `শেষ পঠন: ${rs.lastRead}` : `Last read: ${rs.lastRead}`}
                      </div>
                    </div>
                    <div className="w-24">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? 'অগ্রগতি' : 'Progress'}</span>
                        <span className="text-[0.625rem] font-bold text-[var(--text-primary)]">{bn ? toBnNum(rs.progress) : rs.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-purple-500" style={{ width: `${rs.progress}%` }} />
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div className="py-12 text-center text-[0.8125rem] text-[var(--text-secondary)]">{bn ? 'কোনো পড়াশোনার কার্যক্রম নেই' : 'No reading activity'}</div>
              )}
            </div>
          )}

          {activeTab === 'fines' && (
            <div className="space-y-3">
              {totalFine > 0 ? (
                <>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-red-500/5 border border-amber-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <div className="text-[0.875rem] font-bold text-amber-600">
                          {bn ? `মোট জরিমানা: ৳${toBnNum(totalFine)}` : `Total Fine: ৳${totalFine}`}
                        </div>
                        <div className="text-[0.6875rem] text-[var(--text-secondary)]">
                          {bn ? `${studentBorrowings.filter((b) => b.fine > 0).length} টি বইয়ে জরিমানা` : `${studentBorrowings.filter((b) => b.fine > 0).length} books with fines`}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {studentBorrowings.filter((b) => b.fine > 0).map((b) => {
                      const book = books.find((bk) => bk.id === b.bookId)
                      return (
                        <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-[0.8125rem] text-[var(--text-primary)] truncate">{book?.titleBn || book?.title}</div>
                            <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{b.fineReason}</div>
                          </div>
                          <span className="text-[0.875rem] font-bold text-amber-600">{bn ? `৳${toBnNum(b.fine)}` : `৳${b.fine}`}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--green-light)] text-[var(--green)] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} />
                  </div>
                  <div className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'কোনো জরিমানা নেই' : 'No fines'}</div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-1">{bn ? 'সব কিছু ঠিক আছে!' : 'All clear!'}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
