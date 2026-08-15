import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, BookOpen, ChevronLeft, ChevronRight, Bookmark, ZoomIn, ZoomOut } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { toBnNum } from '@/lib/i18n'


interface Props {
  digitalBookId: string
  onClose: () => void
}

type Theme = 'light' | 'dark' | 'sepia'

export function DigitalReaderModal({ digitalBookId, onClose }: Props) {
  const bn = useBn()
  const digitalBooks = useLibraryStore((s) => s.digitalBooks)
  const books = useLibraryStore((s) => s.books)

  const db = useMemo(() => digitalBooks.find((d) => d.id === digitalBookId), [digitalBooks, digitalBookId])
  const book = useMemo(() => db ? books.find((b) => b.id === db.bookId) : null, [db, books])

  const [currentChapter, setCurrentChapter] = useState(0)
  const [fontSize, setFontSize] = useState(16)
  const [theme, setTheme] = useState<Theme>('light')
  const [bookmarks, setBookmarks] = useState<number[]>([])

  if (!db || !book) return null

  const chapter = db.chapters[currentChapter]
  const progress = Math.round(((currentChapter + 1) / db.chapters.length) * 100)

  const themeClasses: Record<Theme, string> = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
  }

  const toggleBookmark = () => {
    setBookmarks((prev) =>
      prev.includes(currentChapter)
        ? prev.filter((c) => c !== currentChapter)
        : [...prev, currentChapter]
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className={`relative w-full max-w-[64rem] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${themeClasses[theme]}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[0.875rem] text-[var(--text-primary)] truncate">{book.titleBn || book.title}</div>
              <div className="text-[0.625rem] text-[var(--text-secondary)]">
                {bn ? `অধ্যায় ${toBnNum(currentChapter + 1)}/${toBnNum(db.chapters.length)}` : `Chapter ${currentChapter + 1}/${db.chapters.length}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFontSize((s) => Math.max(12, s - 2))} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)]" title="Decrease font">
              <ZoomOut size={14} />
            </button>
            <span className="text-[0.625rem] text-[var(--text-secondary)] w-8 text-center">{fontSize}px</span>
            <button onClick={() => setFontSize((s) => Math.min(24, s + 2))} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)]" title="Increase font">
              <ZoomIn size={14} />
            </button>
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            {(['light', 'dark', 'sepia'] as Theme[]).map((t) => (
              <button key={t} onClick={() => setTheme(t)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  theme === t ? 'border-[var(--brand)] scale-110' : 'border-[var(--border)]'
                } ${
                  t === 'light' ? 'bg-white' : t === 'dark' ? 'bg-gray-900' : 'bg-[#f4ecd8]'
                }`}
              />
            ))}
            <div className="w-px h-5 bg-[var(--border)] mx-1" />
            <button onClick={toggleBookmark}
              className={`p-1.5 rounded-lg transition-colors ${
                bookmarks.includes(currentChapter) ? 'text-[var(--brand)] bg-[var(--brand-light)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'
              }`}
              title={bn ? 'বুকমার্ক' : 'Bookmark'}>
              <Bookmark size={14} fill={bookmarks.includes(currentChapter) ? 'currentColor' : 'none'} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)]">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--surface)]">
          <div className="h-full bg-[var(--brand)] transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6" style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
          <h2 className="text-xl font-bold mb-4">{bn ? chapter.titleBn : chapter.title}</h2>
          <div className="whitespace-pre-wrap">{bn ? chapter.contentBn : chapter.content}</div>
        </div>

        {/* Chapter navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-primary)]">
          <button onClick={() => setCurrentChapter((c) => Math.max(0, c - 1))} disabled={currentChapter === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--surface)] transition-colors">
            <ChevronLeft size={14} /> {bn ? 'আগের' : 'Previous'}
          </button>
          <div className="flex items-center gap-1.5">
            {db.chapters.map((_, i) => (
              <button key={i} onClick={() => setCurrentChapter(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentChapter ? 'bg-[var(--brand)] scale-125' : bookmarks.includes(i) ? 'bg-[var(--amber)]' : 'bg-[var(--border)]'
                }`}
              />
            ))}
          </div>
          <button onClick={() => setCurrentChapter((c) => Math.min(db.chapters.length - 1, c + 1))} disabled={currentChapter === db.chapters.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--surface)] transition-colors">
            {bn ? 'পরবর্তী' : 'Next'} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
