import { useState, useMemo } from 'react'
import { BookOpen, Eye, Trash2, Plus, Download, Users, BarChart3, Monitor } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { toBnNum } from '@/lib/i18n'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { DigitalReaderModal } from '../modals/DigitalReaderModal'
import { DigitalBookModal } from '../modals/DigitalBookModal'

interface Props { searchQuery: string }

export function DigitalLibraryTab({ searchQuery }: Props) {
  const bn = useBn()
  const digitalBooks = useLibraryStore((s) => s.digitalBooks)
  const books = useLibraryStore((s) => s.books)
  const readingSessions = useLibraryStore((s) => s.readingSessions)
  const deleteDigitalBook = useLibraryStore((s) => s.deleteDigitalBook)

  const [showReader, setShowReader] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const enriched = useMemo(() => {
    return digitalBooks.map((db) => {
      const book = books.find((b) => b.id === db.bookId)
      const sessions = readingSessions.filter((rs) => rs.digitalBookId === db.id)
      const totalReaders = new Set(sessions.map((s) => s.studentId)).size
      const avgProgress = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.progress, 0) / sessions.length) : 0
      return {
        ...db,
        title: bn ? (book?.titleBn || book?.title || '') : (book?.title || book?.titleBn || ''),
        author: bn ? (book?.authorBn || book?.author || '') : (book?.author || book?.authorBn || ''),
        chapterCount: db.chapters.length,
        totalReaders,
        avgProgress,
      }
    })
  }, [digitalBooks, books, readingSessions, bn])

  const filtered = useMemo(() => {
    if (!searchQuery) return enriched
    const q = searchQuery.toLowerCase()
    return enriched.filter((d) =>
      d.title.toLowerCase().includes(q) || d.author.toLowerCase().includes(q)
    )
  }, [enriched, searchQuery])

  const totalReaders = enriched.reduce((s, d) => s + d.totalReaders, 0)
  const avgProgress = enriched.length > 0 ? Math.round(enriched.reduce((s, d) => s + d.avgProgress, 0) / enriched.length) : 0

  const handleDownload = (fileUrl: string, title: string) => {
    if (!fileUrl) return
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = `${title}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const statCards = [
    { labelBn: 'ডিজিটাল বই', labelEn: 'Digital Books', value: enriched.length, icon: <Monitor size={14} />, color: 'var(--brand)' },
    { labelBn: 'মোট পাঠক', labelEn: 'Total Readers', value: totalReaders, icon: <Users size={14} />, color: 'var(--green)' },
    { labelBn: 'গড় অগ্রগতি', labelEn: 'Avg Progress', value: avgProgress, icon: <BarChart3 size={14} />, color: 'var(--amber)', suffix: '%' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[0.8125rem] text-[var(--text-secondary)]">
          {bn ? `${toBnNum(enriched.length)} টি ডিজিটাল বই` : `${enriched.length} digital books`}
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90 transition-opacity">
          <Plus size={15} />
          {bn ? 'ডিজিটাল বই' : 'Digital Book'}
        </button>
      </div>

      {/* Stat Cards - Modern style matching main page */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.labelEn} className="flex items-center gap-3 p-3 rounded-[0.625rem] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
            <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[1.125rem] text-[var(--text-primary)] leading-tight">
                {bn ? toBnNum(s.value) : s.value}{s.suffix || ''}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{bn ? s.labelBn : s.labelEn}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Book Cards - Modern grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((db) => (
          <div key={db.id} className="group bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[var(--brand)]/5 hover:border-[var(--brand)]/20 transition-all duration-300">
            {/* Card Header with gradient */}
            <div className="relative h-24 bg-gradient-to-br from-[var(--brand)]/20 via-purple-500/10 to-[var(--brand)]/5 flex items-center justify-center">
              <div className="w-16 h-18 rounded-xl bg-gradient-to-br from-[var(--brand)] to-purple-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <BookOpen size={24} />
              </div>
              {db.fileUrl && (
                <button
                  onClick={() => handleDownload(db.fileUrl, db.title)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  title={bn ? 'ডাউনলোড' : 'Download'}
                >
                  <Download size={13} />
                </button>
              )}
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-[0.875rem] text-[var(--text-primary)] line-clamp-2 leading-snug min-h-[2.2rem]">{db.title}</h3>
                <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{db.author}</p>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-3 text-[0.6875rem]">
                <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
                  <span>{bn ? `${toBnNum(db.chapterCount)} অধ্যায়` : `${db.chapterCount} chapters`}</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                  <span>{bn ? `${toBnNum(db.totalReaders)} পাঠক` : `${db.totalReaders} readers`}</span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-[0.625rem] text-[var(--text-secondary)] mb-1">
                  <span>{bn ? 'অগ্রগতি' : 'Progress'}</span>
                  <span className="font-medium">{bn ? toBnNum(db.avgProgress) : db.avgProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-purple-500 transition-all duration-500"
                    style={{ width: `${db.avgProgress}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setShowReader(db.id)}
                  className="flex-1 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.75rem] font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                >
                  <Eye size={13} />
                  {bn ? 'পড়ুন' : 'Read'}
                </button>
                <button
                  onClick={() => setDeleteTarget(db.id)}
                  className="py-2 px-3 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <Monitor size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
            <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো ডিজিটাল বই পাওয়া যায়নি' : 'No digital books found'}</p>
            <button onClick={() => setShowAddModal(true)} className="mt-3 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
              {bn ? '+ প্রথম ডিজিটাল বই যোগ করুন' : '+ Add your first digital book'}
            </button>
          </div>
        )}
      </div>

      {showReader && <DigitalReaderModal digitalBookId={showReader} onClose={() => setShowReader(null)} />}
      {showAddModal && <DigitalBookModal onClose={() => setShowAddModal(false)} onSaved={() => setShowAddModal(false)} />}
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
