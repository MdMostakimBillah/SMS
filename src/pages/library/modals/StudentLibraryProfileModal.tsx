import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, BookOpen, CheckCircle, BookMarked, AlertTriangle, Clock, DollarSign, Star, TrendingUp } from 'lucide-react'
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

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#64748b']

export function StudentLibraryProfileModal({ studentId, onClose }: Props) {
  const bn = useBn()
  const borrowings = useLibraryStore((s) => s.borrowings)
  const books = useLibraryStore((s) => s.books)
  const categories = useLibraryStore((s) => s.categories)
  const readingSessions = useLibraryStore((s) => s.readingSessions)
  const digitalBooks = useLibraryStore((s) => s.digitalBooks)
  const settings = useLibraryStore((s) => s.settings)
  const students = useAdmissionStore((s) => s.students)

  const [activeTab, setActiveTab] = useState<'all' | 'borrowed' | 'history' | 'reading'>('all')
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')

  const student = useMemo(() => students.find((s) => s.id === studentId), [students, studentId])
  const studentBorrowings = useMemo(() => borrowings.filter((b) => b.studentId === studentId), [borrowings, studentId])
  const studentSessions = useMemo(() => readingSessions.filter((r) => r.studentId === studentId), [readingSessions, studentId])

  const activeBorrowings = studentBorrowings.filter((b) => b.status === 'borrowed' || b.status === 'overdue')
  const history = studentBorrowings.filter((b) => b.status === 'returned')
  const totalFine = studentBorrowings.reduce((s, b) => s + b.fine, 0)
  const pendingFine = activeBorrowings.reduce((s, b) => s + calcFine(b.dueDate, settings.finePerDay), 0)
  const totalReadBooks = history.length + new Set(studentSessions.map((r) => r.digitalBookId)).size
  const readingTime = studentSessions.reduce((sum, r) => sum + r.totalTime, 0)

  // Category preferences - count how many books from each category the student has read
  const categoryPreferences = useMemo(() => {
    const counts: Record<string, number> = {}
    // Count from physical borrowings (returned = read)
    history.forEach((b) => {
      const book = books.find((bk) => bk.id === b.bookId)
      if (book?.categoryId) {
        counts[book.categoryId] = (counts[book.categoryId] || 0) + 1
      }
    })
    // Count from digital reading sessions
    studentSessions.forEach((rs) => {
      const db = digitalBooks.find((d) => d.id === rs.digitalBookId)
      if (db) {
        const book = books.find((b) => b.id === db.bookId)
        if (book?.categoryId) {
          counts[book.categoryId] = (counts[book.categoryId] || 0) + 1
        }
      }
    })
    return Object.entries(counts)
      .map(([catId, count]) => {
        const cat = categories.find((c) => c.id === catId)
        return {
          id: catId,
          name: bn ? (cat?.nameBn || cat?.name || catId) : (cat?.name || cat?.nameBn || catId),
          count,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [history, studentSessions, books, categories, digitalBooks, bn])

  const totalCategoryBooks = categoryPreferences.reduce((sum, c) => sum + c.count, 0)

  if (!student) return null

  // Build donut chart segments
  const buildDonutChart = () => {
    if (categoryPreferences.length === 0) return null
    let cumulativePercent = 0
    const segments = categoryPreferences.map((cat, i) => {
      const percent = (cat.count / totalCategoryBooks) * 100
      const start = cumulativePercent
      cumulativePercent += percent
      return { ...cat, start, percent, color: CHART_COLORS[i % CHART_COLORS.length] }
    })
    // Build conic-gradient
    const gradientParts = segments.map((s) => `${s.color} ${s.start}% ${s.start + s.percent}%`)
    return { segments, gradient: `conic-gradient(${gradientParts.join(', ')})` }
  }

  const donut = buildDonutChart()

  // All activities combined
  const allActivities = useMemo(() => {
    const items: { type: string; bookName: string; date: string; detail: string; color: string }[] = []
    activeBorrowings.forEach((b) => {
      const book = books.find((bk) => bk.id === b.bookId)
      items.push({
        type: 'active',
        bookName: bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || ''),
        date: b.issueDate,
        detail: `${bn ? 'ফেরত' : 'Due'}: ${b.dueDate}`,
        color: b.status === 'overdue' ? 'var(--red, #ef4444)' : 'var(--brand)',
      })
    })
    history.slice(0, 10).forEach((b) => {
      const book = books.find((bk) => bk.id === b.bookId)
      items.push({
        type: 'history',
        bookName: bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || ''),
        date: b.issueDate,
        detail: `${bn ? 'ফেরত' : 'Returned'}: ${b.returnDate}`,
        color: 'var(--green)',
      })
    })
    studentSessions.slice(0, 5).forEach((rs) => {
      const db = digitalBooks.find((d) => d.id === rs.digitalBookId)
      const book = db ? books.find((b) => b.id === db.bookId) : null
      items.push({
        type: 'reading',
        bookName: bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || ''),
        date: rs.lastRead,
        detail: `${formatTime(rs.totalTime)} · ${rs.progress}%`,
        color: 'var(--amber)',
      })
    })
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15)
  }, [activeBorrowings, history, studentSessions, books, digitalBooks, bn])

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[90dvw] h-[85dvh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
          <X size={18} />
        </button>

        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Student Info & History */}
          <div className="flex-1 flex flex-col border-r border-[var(--border)] overflow-hidden">
            {/* Profile Header */}
            <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-[var(--brand)]/5 via-purple-500/5 to-pink-500/5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-[var(--brand)]/20 flex-shrink-0">
                  {(student.nameEn || '').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{student.nameBn || student.nameEn}</h2>
                  <div className="flex items-center gap-1.5 mt-1 text-[0.75rem] text-[var(--text-secondary)] flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--brand-light)] text-[var(--brand)] font-medium">{student.class}</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 font-medium">{student.section}</span>
                    <span>{bn ? 'রোল' : 'Roll'}: {student.roll}</span>
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-1 font-mono">{student.id}</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[
                  { icon: <BookOpen size={13} />, value: totalReadBooks, labelBn: 'পড়েছে', labelEn: 'Read', color: 'var(--green)' },
                  { icon: <CheckCircle size={13} />, value: activeBorrowings.length, labelBn: 'ধারে', labelEn: 'Active', color: 'var(--brand)' },
                  { icon: <Clock size={13} />, value: formatTime(readingTime), labelBn: 'সময়', labelEn: 'Time', color: 'var(--amber)' },
                  { icon: <DollarSign size={13} />, value: `৳${pendingFine}`, labelBn: 'বকেয়', labelEn: 'Pending', color: pendingFine > 0 ? 'var(--red, #ef4444)' : 'var(--text-secondary)' },
                ].map((s, i) => (
                  <div key={i} className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-center">
                    <div className="w-6 h-6 rounded flex items-center justify-center mx-auto mb-1" style={{ background: `${s.color}18`, color: s.color }}>
                      {s.icon}
                    </div>
                    <div className="text-[0.8125rem] font-bold text-[var(--text-primary)] leading-tight">{s.value}</div>
                    <div className="text-[0.5625rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Filter */}
            <div className="px-6 pt-3 pb-2 border-b border-[var(--border)]">
              <div className="flex gap-1">
                {([
                  { id: 'all' as const, label: bn ? 'সব' : 'All' },
                  { id: 'borrowed' as const, label: bn ? 'ধারে' : 'Active' },
                  { id: 'history' as const, label: bn ? 'ইতিহাস' : 'History' },
                  { id: 'reading' as const, label: bn ? 'পড়াশোনা' : 'Reading' },
                ]).map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium transition-colors ${
                      activeTab === t.id ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity List */}
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
              {allActivities
                .filter((a) => activeTab === 'all' || (activeTab === 'borrowed' && a.type === 'active') || (activeTab === 'history' && a.type === 'history') || (activeTab === 'reading' && a.type === 'reading'))
                .map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${activity.color}18`, color: activity.color }}>
                    {activity.type === 'active' && <BookOpen size={14} />}
                    {activity.type === 'history' && <CheckCircle size={14} />}
                    {activity.type === 'reading' && <BookMarked size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[0.75rem] text-[var(--text-primary)] truncate">{activity.bookName}</div>
                    <div className="text-[0.625rem] text-[var(--text-secondary)]">{activity.detail}</div>
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-secondary)] whitespace-nowrap">{activity.date}</div>
                </div>
              ))}
              {allActivities.length === 0 && (
                <div className="py-8 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'কোনো কার্যক্রম নেই' : 'No activity'}</div>
              )}
            </div>
          </div>

          {/* Right Column - Preferences & Review */}
          <div className="w-[22rem] flex flex-col overflow-y-auto">
            {/* Reading Preferences */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[var(--brand)]" />
                <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">{bn ? 'পঠন পছন্দ' : 'Reading Preferences'}</h3>
              </div>

              {donut ? (
                <div className="flex flex-col items-center">
                  {/* Donut Chart */}
                  <div className="relative w-40 h-40 mb-4">
                    <div className="w-full h-full rounded-full" style={{ background: donut.gradient }} />
                    <div className="absolute inset-5 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--text-primary)]">{bn ? toBnNum(totalCategoryBooks) : totalCategoryBooks}</div>
                        <div className="text-[0.5625rem] text-[var(--text-secondary)]">{bn ? 'বই পড়েছে' : 'Books Read'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full space-y-1.5">
                    {donut.segments.map((seg) => (
                      <div key={seg.id} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
                        <span className="flex-1 text-[0.6875rem] text-[var(--text-primary)] truncate">{seg.name}</span>
                        <span className="text-[0.625rem] font-bold text-[var(--text-secondary)]">{bn ? toBnNum(seg.count) : seg.count}</span>
                        <span className="text-[0.5625rem] text-[var(--text-secondary)] w-8 text-right">{Math.round(seg.percent)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] text-[var(--text-secondary)] flex items-center justify-center mx-auto mb-2">
                    <BookOpen size={22} />
                  </div>
                  <div className="text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'এখনো কোনো বই পড়েনি' : 'No books read yet'}</div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-[var(--border)]" />

            {/* Review & Rating */}
            <div className="px-5 py-4">
              <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)] mb-3">{bn ? 'রিভিউ ও রেটিং' : 'Review & Rating'}</h3>

              {/* Star Rating */}
              <div className="mb-3">
                <div className="text-[0.6875rem] text-[var(--text-secondary)] mb-2">{bn ? 'পঠন অভিজ্ঞতা রেটিং দিন' : 'Rate reading experience'}</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="cursor-pointer transition-transform hover:scale-110">
                      <Star
                        size={24}
                        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--border)]'}
                      />
                    </button>
                  ))}
                  {rating > 0 && <span className="ml-2 text-[0.75rem] font-medium text-amber-500">{rating}/5</span>}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  className="w-full py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none resize-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all"
                  placeholder={bn ? 'এই ছাত্রের পঠন সম্পর্কে আপনার মতামত লিখুন...' : 'Write your feedback about this student\'s reading...'}
                />
              </div>

              {rating > 0 && (
                <button className="w-full mt-3 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer hover:shadow-lg hover:shadow-[var(--brand)]/25 transition-all">
                  {bn ? 'রিভিউ সংরক্ষণ' : 'Save Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
