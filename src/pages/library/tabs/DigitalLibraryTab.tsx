import { useState, useMemo } from 'react'
import { BookOpen, Eye, Trash2, Plus, Download, Users, BarChart3, Monitor } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { toBnNum } from '@/lib/i18n'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { DigitalReaderModal } from '../modals/DigitalReaderModal'
import { DigitalBookModal } from '../modals/DigitalBookModal'

interface Props { searchQuery: string }

const bookColors = [
  'from-amber-700 to-amber-900',
  'from-slate-600 to-slate-800',
  'from-emerald-600 to-emerald-800',
  'from-amber-500 to-amber-700',
  'from-yellow-500 to-yellow-700',
  'from-red-600 to-red-800',
  'from-teal-600 to-teal-800',
  'from-indigo-600 to-indigo-800',
  'from-rose-600 to-rose-800',
  'from-cyan-600 to-cyan-800',
]

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
    return digitalBooks.map((db, idx) => {
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
        colorIndex: idx % bookColors.length,
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
    <div className="space-y-5">
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

      {/* Stat Cards */}
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

      {/* Bookshelf Section */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {bn ? 'বইয়ের আলমারি' : 'Bookshelf'}
          </h3>
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {filtered.map((db) => (
              <div key={db.id} className="flex-shrink-0 w-[160px] group cursor-pointer" onClick={() => setShowReader(db.id)}>
                {/* Book Cover */}
                <div className="relative">
                  <div className={`w-full h-[200px] rounded-lg bg-gradient-to-br ${bookColors[db.colorIndex]} shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center p-4`}>
                    <div className="text-center">
                      <BookOpen size={28} className="mx-auto text-white/80 mb-2" />
                      <p className="text-[0.5625rem] text-white/60 leading-tight line-clamp-4">{db.title}</p>
                    </div>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowReader(db.id) }}
                        className="p-2 rounded-full bg-white text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors"
                        title={bn ? 'পড়ুন' : 'Read'}
                      >
                        <Eye size={14} />
                      </button>
                      {db.fileUrl && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(db.fileUrl, db.title) }}
                          className="p-2 rounded-full bg-white text-[var(--green)] hover:bg-[var(--green)] hover:text-white transition-colors"
                          title={bn ? 'ডাউনলোড' : 'Download'}
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Book Info */}
                <div className="mt-3 px-0.5">
                  <h4 className="font-semibold text-[0.8125rem] text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--brand)] transition-colors">{db.title}</h4>
                  <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {bn ? 'লেখক:' : 'by'} {db.author}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[0.5625rem] text-[var(--text-secondary)]">
                      {bn ? `${toBnNum(db.chapterCount)} অধ্যায়` : `${db.chapterCount} chapters`}
                    </span>
                    <span className="text-[var(--text-secondary)]">·</span>
                    <span className="text-[0.5625rem] text-[var(--text-secondary)]">
                      {bn ? `${toBnNum(db.totalReaders)} পাঠক` : `${db.totalReaders} readers`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center">
          <Monitor size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো ডিজিটাল বই পাওয়া যায়নি' : 'No digital books found'}</p>
          <button onClick={() => setShowAddModal(true)} className="mt-3 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম ডিজিটাল বই যোগ করুন' : '+ Add your first digital book'}
          </button>
        </div>
      )}

      {/* Details Table */}
      {filtered.length > 0 && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {bn ? 'বিস্তারিত' : 'Details'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[0.75rem]">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">#</th>
                  <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Book'}</th>
                  <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'লেখক' : 'Author'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'অধ্যায়' : 'Chapters'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'পাঠক' : 'Readers'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'অগ্রগতি' : 'Progress'}</th>
                  <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((db, idx) => (
                  <tr key={db.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors">
                    <td className="py-2.5 px-3 text-center text-[var(--text-secondary)]">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-left">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-10 rounded-md bg-gradient-to-br ${bookColors[db.colorIndex]} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <BookOpen size={12} />
                        </div>
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">{db.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-left text-[var(--text-primary)]">{db.author}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[0.625rem] font-medium">
                        {bn ? toBnNum(db.chapterCount) : db.chapterCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--green-light)] text-[var(--green)] text-[0.625rem] font-medium">
                        {bn ? toBnNum(db.totalReaders) : db.totalReaders}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-purple-500" style={{ width: `${db.avgProgress}%` }} />
                        </div>
                        <span className="text-[0.625rem] text-[var(--text-secondary)] font-medium w-7">{bn ? toBnNum(db.avgProgress) : db.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <button onClick={() => setShowReader(db.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors" title={bn ? 'পড়ুন' : 'Read'}>
                          <Eye size={13} />
                        </button>
                        {db.fileUrl && (
                          <button onClick={() => handleDownload(db.fileUrl, db.title)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--green)] transition-colors" title={bn ? 'ডাউনলোড' : 'Download'}>
                            <Download size={13} />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(db.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
