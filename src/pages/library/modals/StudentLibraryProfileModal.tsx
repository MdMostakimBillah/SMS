import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, BookOpen, CheckCircle, BookMarked } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore, calcFine } from '@/store/libraryStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { toBnNum } from '@/lib/i18n'
import { modalOverlayCls } from '@/pages/hr/utils'

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

  if (!student) return null

  const tabs: { id: Tab; label: string; labelBn: string; count: number }[] = [
    { id: 'borrowed', label: 'Active', labelBn: 'সক্রিয়', count: activeBorrowings.length },
    { id: 'history', label: 'History', labelBn: 'ইতিহাস', count: history.length },
    { id: 'reading', label: 'Reading', labelBn: 'পড়াশোনা', count: studentSessions.length },
    { id: 'fines', label: 'Fines', labelBn: 'জরিমানা', count: totalFine > 0 ? 1 : 0 },
  ]

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className="modal-box modal-content max-w-[52rem] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center font-bold text-lg">
            {(student.nameEn || '').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">{student.nameBn || student.nameEn}</h2>
            <div className="text-[0.75rem] text-[var(--text-secondary)]">{student.class} | {student.section} | Roll: {student.roll} | {student.id}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)]">
            <X size={18} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { labelBn: 'ধারে', labelEn: 'Active', value: activeBorrowings.length, color: 'var(--brand)' },
            { labelBn: 'ইতিহাস', labelEn: 'History', value: history.length, color: 'var(--green)' },
            { labelBn: 'ডিজিটাল', labelEn: 'Digital', value: studentSessions.length, color: 'var(--amber)' },
            { labelBn: 'বকেয়া', labelEn: 'Pending', value: `৳${pendingFine}`, color: pendingFine > 0 ? 'var(--red, #ef4444)' : 'var(--text-secondary)' },
          ].map((s) => (
            <div key={s.labelEn} className="p-2 rounded-lg bg-[var(--surface)] text-center">
              <div className="font-bold text-[0.875rem]" style={{ color: s.color }}>{typeof s.value === 'number' ? (bn ? toBnNum(s.value) : s.value) : s.value}</div>
              <div className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3 bg-[var(--surface)] rounded-lg p-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-1.5 rounded-md text-[0.75rem] font-medium transition-colors ${
                activeTab === t.id ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}>
              {bn ? t.labelBn : t.label}
              {t.count > 0 && <span className="ml-1 text-[0.625rem] opacity-70">({bn ? toBnNum(t.count) : t.count})</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[40vh] overflow-y-auto space-y-2">
          {activeTab === 'borrowed' && activeBorrowings.map((b) => {
            const book = books.find((bk) => bk.id === b.bookId)
            return (
              <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${b.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--brand-light)] text-[var(--brand)]'}`}>
                  <BookOpen size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[0.75rem] text-[var(--text-primary)] truncate">{book?.titleBn || book?.title}</div>
                  <div className="text-[0.625rem] text-[var(--text-secondary)]">
                    {bn ? `ইস্যু: ${b.issueDate} | ফেরত: ${b.dueDate}` : `Issued: ${b.issueDate} | Due: ${b.dueDate}`}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[0.625rem] font-medium ${
                  b.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-[var(--green-light)] text-[var(--green)]'
                }`}>
                  {b.status === 'overdue' ? (bn ? 'বিলম্বিত' : 'Overdue') : (bn ? 'ধারে' : 'Active')}
                </span>
              </div>
            )
          })}
          {activeTab === 'borrowed' && activeBorrowings.length === 0 && <div className="py-6 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'কোনো সক্রিয় ধার নেই' : 'No active borrowings'}</div>}

          {activeTab === 'history' && history.map((b) => {
            const book = books.find((bk) => bk.id === b.bookId)
            return (
              <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--green-light)] text-[var(--green)] flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[0.75rem] text-[var(--text-primary)] truncate">{book?.titleBn || book?.title}</div>
                  <div className="text-[0.625rem] text-[var(--text-secondary)]">
                    {bn ? `ইস্যু: ${b.issueDate} | ফেরত: ${b.returnDate}` : `Issued: ${b.issueDate} | Returned: ${b.returnDate}`}
                  </div>
                </div>
                {b.fine > 0 && <span className="text-[0.625rem] text-amber-600 font-medium">{bn ? `৳${toBnNum(b.fine)} জরিমানা` : `৳${b.fine} fine`}</span>}
              </div>
            )
          })}
          {activeTab === 'history' && history.length === 0 && <div className="py-6 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'কোনো ইতিহাস নেই' : 'No history'}</div>}

          {activeTab === 'reading' && studentSessions.map((rs) => {
            const db = digitalBooks.find((d) => d.id === rs.digitalBookId)
            const book = db ? books.find((b) => b.id === db.bookId) : null
            return (
              <div key={rs.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
                  <BookMarked size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[0.75rem] text-[var(--text-primary)] truncate">{book?.titleBn || book?.title}</div>
                  <div className="text-[0.625rem] text-[var(--text-secondary)]">
                    {formatTime(rs.totalTime)} | {bn ? `শেষ পঠন: ${rs.lastRead}` : `Last read: ${rs.lastRead}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-1.5 rounded-full bg-[var(--bg-primary)] overflow-hidden mb-1">
                    <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${rs.progress}%` }} />
                  </div>
                  <span className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? toBnNum(rs.progress) : rs.progress}%</span>
                </div>
              </div>
            )
          })}
          {activeTab === 'reading' && studentSessions.length === 0 && <div className="py-6 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'কোনো পড়াশোনার কার্যক্রম নেই' : 'No reading activity'}</div>}

          {activeTab === 'fines' && (
            <div className="space-y-3">
              {totalFine > 0 ? (
                <>
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <div className="text-[0.8125rem] font-medium text-amber-600">
                      {bn ? `মোট জরিমানা: ৳${toBnNum(totalFine)}` : `Total Fine: ৳${totalFine}`}
                    </div>
                  </div>
                  {studentBorrowings.filter((b) => b.fine > 0).map((b) => {
                    const book = books.find((bk) => bk.id === b.bookId)
                    return (
                      <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                        <div className="text-[0.75rem] text-[var(--text-primary)] flex-1 truncate">{book?.titleBn || book?.title}</div>
                        <span className="text-[0.75rem] font-bold text-amber-600">{bn ? `৳${toBnNum(b.fine)}` : `৳${b.fine}`}</span>
                        <span className="text-[0.625rem] text-[var(--text-secondary)]">{b.fineReason}</span>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="py-6 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'কোনো জরিমানা নেই' : 'No fines'}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
