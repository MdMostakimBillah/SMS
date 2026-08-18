import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, FileText, Plus, Trash2, BookOpen, Link } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { labelCls } from '@/pages/hr/utils'
import type { DigitalBook, DigitalBookChapter, Book } from '../types'

interface Props {
  onClose: () => void
  onSaved: () => void
}

function today() { return new Date().toISOString().split('T')[0] }

function generateBookId() {
  return `LB-${String(Date.now()).slice(-6)}`
}

export function DigitalBookModal({ onClose, onSaved }: Props) {
  const bn = useBn()
  const books = useLibraryStore((s) => s.books)
  const categories = useLibraryStore((s) => s.categories)
  const addBook = useLibraryStore((s) => s.addBook)
  const addDigitalBook = useLibraryStore((s) => s.addDigitalBook)

  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [bookId, setBookId] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [chapters, setChapters] = useState<DigitalBookChapter[]>([
    { title: '', titleBn: '', content: '', contentBn: '' }
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New book fields
  const [title, setTitle] = useState('')
  const [titleBn, setTitleBn] = useState('')
  const [author, setAuthor] = useState('')
  const [authorBn, setAuthorBn] = useState('')
  const [isbn, setIsbn] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [shelf, setShelf] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionBn, setDescriptionBn] = useState('')
  const [totalCopies, setTotalCopies] = useState(1)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, file: bn ? 'শুধুমাত্র PDF ফাইল অনুমোদিত' : 'Only PDF files are allowed' }))
      return
    }
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    setFileName(file.name)
    setErrors((prev) => ({ ...prev, file: '' }))
  }

  const addChapter = () => {
    setChapters([...chapters, { title: '', titleBn: '', content: '', contentBn: '' }])
  }

  const removeChapter = (idx: number) => {
    if (chapters.length <= 1) return
    setChapters(chapters.filter((_, i) => i !== idx))
  }

  const updateChapter = (idx: number, field: keyof DigitalBookChapter, value: string) => {
    setChapters(chapters.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (mode === 'existing' && !bookId) {
      errs.bookId = bn ? 'বই নির্বাচন করুন' : 'Select a book'
    }
    if (mode === 'new') {
      if (!title && !titleBn) errs.title = bn ? 'বইয়ের নাম দিন' : 'Enter book title'
      if (!author && !authorBn) errs.author = bn ? 'লেখকের নাম দিন' : 'Enter author name'
    }
    if (!fileUrl) errs.file = bn ? 'PDF ফাইল আপলোড করুন' : 'Upload a PDF file'
    if (chapters.length === 0 || !chapters.some((c) => c.title || c.titleBn)) {
      errs.chapters = bn ? 'অন্তত একটি অধ্যায় যোগ করুন' : 'Add at least one chapter'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    let finalBookId = bookId

    // If new mode, create the book first
    if (mode === 'new') {
      finalBookId = generateBookId()
      const newBook: Book = {
        id: finalBookId,
        title: title || titleBn,
        titleBn: titleBn || title,
        author: author || authorBn,
        authorBn: authorBn || author,
        isbn,
        categoryId,
        shelf,
        description: description || descriptionBn,
        descriptionBn: descriptionBn || description,
        totalCopies,
        availableCopies: totalCopies,
        isDigital: true,
        coverUrl: '',
        isActive: true,
        createdAt: today(),
      }
      addBook(newBook)
    }

    const id = `DB-${Date.now()}`
    const digitalBook: DigitalBook = {
      id,
      bookId: finalBookId,
      fileUrl,
      chapters: chapters.filter((c) => c.title || c.titleBn),
      totalPages: totalPages || chapters.length * 10,
      isActive: true,
      createdAt: today(),
    }
    addDigitalBook(digitalBook)
    onSaved()
  }

  const existingBooks = books.filter((b) => b.isActive)

  const inputCls = "w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10"

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-[52rem] max-h-[90vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--brand)]/5 to-purple-500/5">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'নতুন ডিজিটাল বই' : 'New Digital Book'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <button
              onClick={() => setMode('existing')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[0.8125rem] font-medium transition-all ${
                mode === 'existing' ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Link size={14} />
              {bn ? 'বিদ্যমান বই' : 'Existing Book'}
            </button>
            <button
              onClick={() => setMode('new')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[0.8125rem] font-medium transition-all ${
                mode === 'new' ? 'bg-[var(--brand)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <BookOpen size={14} />
              {bn ? 'নতুন বই তৈরি' : 'Create New Book'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Existing Book Selection */}
          {mode === 'existing' && (
            <div>
              <label className={labelCls}>{bn ? 'বই নির্বাচন' : 'Select Book'} *</label>
              <select value={bookId} onChange={(e) => setBookId(e.target.value)}
                className={`${inputCls} ${errors.bookId ? 'border-red-500' : ''}`}>
                <option value="">{bn ? 'বই নির্বাচন করুন...' : 'Select a book...'}</option>
                {existingBooks.map((b) => (
                  <option key={b.id} value={b.id}>{bn ? b.titleBn : b.title} ({b.isbn})</option>
                ))}
              </select>
              {errors.bookId && <p className="text-red-500 text-[0.6875rem] mt-1">{errors.bookId}</p>}
            </div>
          )}

          {/* New Book Fields */}
          {mode === 'new' && (
            <div className="space-y-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-[var(--brand)]" />
                <h4 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{bn ? 'বইয়ের তথ্য' : 'Book Information'}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{bn ? 'বইয়ের নাম (English)' : 'Title (English)'} *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Book title..." />
                  {errors.title && <p className="text-red-500 text-[0.6875rem] mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'বইয়ের নাম (বাংলা)' : 'Title (Bengali)'}</label>
                  <input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} className={inputCls} placeholder="বইয়ের নাম..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{bn ? 'লেখক (English)' : 'Author (English)'} *</label>
                  <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputCls} placeholder="Author name..." />
                  {errors.author && <p className="text-red-500 text-[0.6875rem] mt-1">{errors.author}</p>}
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'লেখক (বাংলা)' : 'Author (Bengali)'}</label>
                  <input value={authorBn} onChange={(e) => setAuthorBn(e.target.value)} className={inputCls} placeholder="লেখকের নাম..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>{bn ? 'আইএসবিএন' : 'ISBN'}</label>
                  <input value={isbn} onChange={(e) => setIsbn(e.target.value)} className={inputCls} placeholder="978-..." />
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'ক্যাটাগরি' : 'Category'}</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                    <option value="">{bn ? 'নির্বাচন...' : 'Select...'}</option>
                    {categories.filter((c) => c.isActive).map((c) => (
                      <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'শেল্ফ' : 'Shelf'}</label>
                  <input value={shelf} onChange={(e) => setShelf(e.target.value)} className={inputCls} placeholder="A-01" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{bn ? 'বিবরণ (English)' : 'Description (English)'}</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} placeholder="Brief description..." />
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}</label>
                  <textarea value={descriptionBn} onChange={(e) => setDescriptionBn(e.target.value)} rows={2} className={inputCls} placeholder="সংক্ষিপ্ত বিবরণ..." />
                </div>
              </div>

              <div>
                <label className={labelCls}>{bn ? 'মোট কপি' : 'Total Copies'}</label>
                <input type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(parseInt(e.target.value) || 1)} className={inputCls} />
              </div>
            </div>
          )}

          {/* PDF Upload */}
          <div>
            <label className={labelCls}>{bn ? 'PDF ফাইল' : 'PDF File'} *</label>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                errors.file ? 'border-red-500 bg-red-500/5' : fileUrl ? 'border-[var(--green)] bg-[var(--green)]/5' : 'border-[var(--border)] hover:border-[var(--brand)]/40 bg-[var(--surface)]'
              }`}
            >
              {fileUrl ? (
                <>
                  <FileText size={20} className="text-[var(--green)]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">{fileName}</div>
                    <div className="text-[0.6875rem] text-[var(--green)]">{bn ? 'ফাইল আপলোড হয়েছে' : 'File uploaded'}</div>
                  </div>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-[var(--text-secondary)]" />
                  <div>
                    <div className="text-[0.8125rem] text-[var(--text-primary)]">{bn ? 'PDF ফাইল আপলোড করতে ক্লিক করুন' : 'Click to upload PDF file'}</div>
                    <div className="text-[0.6875rem] text-[var(--text-secondary)]">PDF {bn ? 'ফরম্যাট' : 'format only'}</div>
                  </div>
                </>
              )}
            </div>
            {errors.file && <p className="text-red-500 text-[0.6875rem] mt-1">{errors.file}</p>}
          </div>

          {/* Total Pages */}
          <div>
            <label className={labelCls}>{bn ? 'মোট পৃষ্ঠা' : 'Total Pages'}</label>
            <input type="number" min={1} value={totalPages || ''} onChange={(e) => setTotalPages(parseInt(e.target.value) || 0)}
              className={inputCls}
              placeholder={bn ? 'পৃষ্ঠা সংখ্যা...' : 'Number of pages...'} />
          </div>

          {/* Chapters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls + ' mb-0'}>{bn ? 'অধ্যায়সমূহ' : 'Chapters'} *</label>
              <button onClick={addChapter} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.6875rem] font-medium text-[var(--brand)] hover:bg-[var(--brand)]/5 transition-colors">
                <Plus size={12} /> {bn ? 'যোগ করুন' : 'Add'}
              </button>
            </div>
            {errors.chapters && <p className="text-red-500 text-[0.6875rem] mb-2">{errors.chapters}</p>}
            <div className="space-y-2 max-h-[15rem] overflow-y-auto">
              {chapters.map((ch, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[0.6875rem] text-[var(--text-secondary)] mt-2.5 w-5 text-center">{idx + 1}</span>
                  <div className="flex-1 space-y-1.5">
                    <input value={ch.title} onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                      className="w-full py-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] outline-none focus:border-[var(--brand)]"
                      placeholder={bn ? 'অধ্যায়ের নাম (English)' : 'Chapter title (English)'} />
                    <input value={ch.titleBn} onChange={(e) => updateChapter(idx, 'titleBn', e.target.value)}
                      className="w-full py-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] outline-none focus:border-[var(--brand)]"
                      placeholder={bn ? 'অধ্যায়ের নাম (বাংলা)' : 'Chapter title (Bengali)'} />
                  </div>
                  {chapters.length > 1 && (
                    <button onClick={() => removeChapter(idx)} className="p-1 rounded text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors mt-1">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-primary)]">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} className="flex-1 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer hover:shadow-lg hover:shadow-[var(--brand)]/25 transition-all">
            {bn ? 'সংরক্ষণ' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
