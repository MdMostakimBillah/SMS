import { useState, useMemo, useCallback, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Eye, BookOpen } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { toBnNum } from '@/lib/i18n'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { BookModal } from '../modals/BookModal'
import type { Book } from '../types'

interface Props { searchQuery: string }

export function BooksTab({ searchQuery }: Props) {
  const bn = useBn()
  const books = useLibraryStore((s) => s.books)
  const categories = useLibraryStore((s) => s.categories)
  const copies = useLibraryStore((s) => s.copies)
  const toggleBookActive = useLibraryStore((s) => s.toggleBookActive)
  const deleteBook = useLibraryStore((s) => s.deleteBook)

  const [showModal, setShowModal] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filterCategory, setFilterCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const enrichedBooks = useMemo(() => {
    return books.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId)
      const bookCopies = copies.filter((c) => c.bookId === b.id && c.isActive)
      const available = bookCopies.filter((c) => c.status === 'available').length
      return { ...b, categoryName: cat?.nameBn || cat?.name || '', available, totalActiveCopies: bookCopies.length }
    })
  }, [books, categories, copies])

  const filtered = useMemo(() => {
    let list = enrichedBooks
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((b) =>
        b.title.toLowerCase().includes(q) || b.titleBn.includes(q) ||
        b.author.toLowerCase().includes(q) || b.authorBn.includes(q) ||
        b.isbn.includes(q) || b.shelf.toLowerCase().includes(q)
      )
    }
    if (filterCategory) list = list.filter((b) => b.categoryId === filterCategory)
    return list
  }, [enrichedBooks, searchQuery, filterCategory])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [searchQuery, filterCategory])

  const handleEdit = useCallback((b: Book) => { setEditBook(b); setShowModal(true) }, [])
  const handleAdd = useCallback(() => { setEditBook(null); setShowModal(true) }, [])

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border transition-colors ${
            showFilters || filterCategory
              ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20'
              : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/30'
          }`}
        >
          <Search size={12} />
          {bn ? 'ফিল্টার' : 'Filter'}
          {filterCategory && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
        </button>
        {filterCategory && (
          <button onClick={() => setFilterCategory('')} className="flex items-center gap-1 px-2 py-1 rounded text-[0.6875rem] text-red-500 border border-red-500/30 hover:bg-red-500/10">
            {bn ? 'মুছুন' : 'Clear'}
          </button>
        )}
        <div className="flex-1" />
        <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity">
          <Plus size={13} />
          {bn ? 'বই যোগ করুন' : 'Add Book'}
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] outline-none"
          >
            <option value="">{bn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
            {categories.filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">#</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'বই' : 'Book'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'লেখক' : 'Author'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'শেল্ফ' : 'Shelf'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'কপি' : 'Copies'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'অবস্থা' : 'Status'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((b, idx) => (
                <tr key={b.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors">
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">{(page - 1) * perPage + idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
                        <BookOpen size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">{bn ? b.titleBn : b.title}</div>
                        <div className="text-[0.625rem] text-[var(--text-secondary)]">{b.isbn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-primary)]">{bn ? b.authorBn : b.author}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[0.625rem] font-medium">
                      {b.categoryName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-primary)]">{b.shelf}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[var(--text-primary)]">{bn ? toBnNum(b.available) : b.available}</span>
                    <span className="text-[var(--text-secondary)]">/{bn ? toBnNum(b.totalActiveCopies) : b.totalActiveCopies}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[0.625rem] font-medium ${
                      b.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {b.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(b)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => toggleBookActive(b.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(b)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--text-secondary)]">
                    {bn ? 'কোনো বই পাওয়া যায়নি' : 'No books found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} isBn={bn} />
      </div>

      {showModal && <BookModal existing={editBook} onSaved={() => { setShowModal(false); setEditBook(null) }} onClose={() => { setShowModal(false); setEditBook(null) }} />}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={bn ? 'বই মুছুন' : 'Delete Book'}
          message={bn ? `"${deleteTarget.titleBn}" মুছে ফেলতে চান?` : `Delete "${deleteTarget.title}"?`}
          onConfirm={() => { deleteBook(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
          isBn={bn}
        />
      )}
    </div>
  )
}
