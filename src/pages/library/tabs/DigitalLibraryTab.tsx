import { useState, useMemo } from 'react'
import { BookOpen, Eye, Trash2 } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { toBnNum } from '@/lib/i18n'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { DigitalReaderModal } from '../modals/DigitalReaderModal'

interface Props { searchQuery: string }

export function DigitalLibraryTab({ searchQuery }: Props) {
  const bn = useBn()
  const digitalBooks = useLibraryStore((s) => s.digitalBooks)
  const books = useLibraryStore((s) => s.books)
  const readingSessions = useLibraryStore((s) => s.readingSessions)
  const deleteDigitalBook = useLibraryStore((s) => s.deleteDigitalBook)


  const [showReader, setShowReader] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const enriched = useMemo(() => {
    return digitalBooks.map((db) => {
      const book = books.find((b) => b.id === db.bookId)
      const sessions = readingSessions.filter((rs) => rs.digitalBookId === db.id)
      const totalReaders = new Set(sessions.map((s) => s.studentId)).size
      const avgProgress = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.progress, 0) / sessions.length) : 0
      return {
        ...db,
        title: book?.titleBn || book?.title || '',
        author: book?.authorBn || book?.author || '',
        chapterCount: db.chapters.length,
        totalReaders,
        avgProgress,
      }
    })
  }, [digitalBooks, books, readingSessions])

  const filtered = useMemo(() => {
    if (!searchQuery) return enriched
    const q = searchQuery.toLowerCase()
    return enriched.filter((d) =>
      d.title.toLowerCase().includes(q) || d.author.toLowerCase().includes(q)
    )
  }, [enriched, searchQuery])

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { labelBn: 'ডিজিটাল বই', labelEn: 'Digital Books', value: enriched.length, color: 'var(--brand)' },
          { labelBn: 'মোট পাঠক', labelEn: 'Total Readers', value: enriched.reduce((s, d) => s + d.totalReaders, 0), color: 'var(--green)' },
          { labelBn: 'গড় অগ্রগতি', labelEn: 'Avg Progress', value: enriched.length > 0 ? Math.round(enriched.reduce((s, d) => s + d.avgProgress, 0) / enriched.length) : 0, color: 'var(--amber)' },
        ].map((s) => (
          <div key={s.labelEn} className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? s.labelBn : s.labelEn}</div>
            <div className="font-bold text-lg text-[var(--text-primary)]">{bn ? toBnNum(s.value) : s.value}{s.labelEn.includes('Progress') ? '%' : ''}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((db) => (
          <div key={db.id} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-12 h-14 rounded-lg bg-gradient-to-br from-[var(--brand)] to-purple-500 text-white flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[0.875rem] text-[var(--text-primary)] truncate">{db.title}</div>
                <div className="text-[0.6875rem] text-[var(--text-secondary)]">{db.author}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[0.6875rem]">
              <div className="p-2 rounded bg-[var(--surface)]">
                <div className="text-[var(--text-secondary)]">{bn ? 'অধ্যায়' : 'Chapters'}</div>
                <div className="font-bold text-[var(--text-primary)]">{bn ? toBnNum(db.chapterCount) : db.chapterCount}</div>
              </div>
              <div className="p-2 rounded bg-[var(--surface)]">
                <div className="text-[var(--text-secondary)]">{bn ? 'পাঠক' : 'Readers'}</div>
                <div className="font-bold text-[var(--text-primary)]">{bn ? toBnNum(db.totalReaders) : db.totalReaders}</div>
              </div>
            </div>
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[0.625rem] text-[var(--text-secondary)] mb-1">
                <span>{bn ? 'গড় অগ্রগতি' : 'Avg Progress'}</span>
                <span>{bn ? toBnNum(db.avgProgress) : db.avgProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${db.avgProgress}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowReader(db.id)} className="flex-1 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.75rem] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                <Eye size={12} /> {bn ? 'পড়ুন' : 'Read'}
              </button>
              <button onClick={() => setDeleteTarget(db.id)} className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/30 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-[0.8125rem] text-[var(--text-secondary)]">
            {bn ? 'কোনো ডিজিটাল বই পাওয়া যায়নি' : 'No digital books found'}
          </div>
        )}
      </div>

      {showReader && <DigitalReaderModal digitalBookId={showReader} onClose={() => setShowReader(null)} />}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={bn ? 'ডিজিটাল বই মুছুন' : 'Delete Digital Book'}
          message={bn ? 'এই ডিজিটাল বই মুছে ফেলতে চান?' : 'Delete this digital book?'}
          onConfirm={() => { deleteDigitalBook(deleteTarget); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
          isBn={bn}
        />
      )}
    </div>
  )
}
