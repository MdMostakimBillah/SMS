import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'

import { modalOverlayCls, modalStyleCls, labelCls } from '@/pages/hr/utils'
import type { Book } from '../types'

interface Props {
  existing?: Book | null
  onSaved: () => void
  onClose: () => void
}

const inputFieldCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30'

export function BookModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const addBook = useLibraryStore((s) => s.addBook)
  const updateBook = useLibraryStore((s) => s.updateBook)
  const categories = useLibraryStore((s) => s.categories)
  const getNextBookId = useLibraryStore((s) => s.getNextBookId)

  const [title, setTitle] = useState(existing?.title || '')
  const [titleBn, setTitleBn] = useState(existing?.titleBn || '')
  const [author, setAuthor] = useState(existing?.author || '')
  const [authorBn, setAuthorBn] = useState(existing?.authorBn || '')
  const [isbn, setIsbn] = useState(existing?.isbn || '')
  const [categoryId, setCategoryId] = useState(existing?.categoryId || '')
  const [shelf, setShelf] = useState(existing?.shelf || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [descriptionBn, setDescriptionBn] = useState(existing?.descriptionBn || '')
  const [totalCopies, setTotalCopies] = useState(existing?.totalCopies || 1)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!title.trim()) e.title = true
    if (!author.trim()) e.author = true
    if (!categoryId) e.categoryId = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString().split('T')[0]
    if (existing) {
      updateBook(existing.id, {
        title, titleBn, author, authorBn, isbn, categoryId, shelf,
        description, descriptionBn, totalCopies,
        availableCopies: existing.availableCopies + (totalCopies - existing.totalCopies),
      })
    } else {
      const id = getNextBookId()
      addBook({
        id, title, titleBn, author, authorBn, isbn, categoryId, shelf,
        description, descriptionBn, totalCopies, availableCopies: totalCopies,
        isDigital: false, coverUrl: '', isActive: true, createdAt: now,
      })
    }
    onSaved()
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`${modalStyleCls} max-w-[52rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {existing ? (bn ? 'বই সম্পাদনা' : 'Edit Book') : (bn ? 'নতুন বই যোগ' : 'Add New Book')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'ইংরেজি শিরোনাম' : 'English Title'} *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputFieldCls} ${errors.title ? 'border-red-500' : ''}`} placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'বাংলা শিরোনাম' : 'Bengali Title'}</label>
              <input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} className={inputFieldCls} placeholder="e.g. গণিত" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'ইংরেজি লেখক' : 'English Author'} *</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className={`${inputFieldCls} ${errors.author ? 'border-red-500' : ''}`} placeholder="e.g. Dr. A.K. Rahman" />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'বাংলা লেখক' : 'Bengali Author'}</label>
              <input value={authorBn} onChange={(e) => setAuthorBn(e.target.value)} className={inputFieldCls} placeholder="e.g. ড. এ.কে. রহমান" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>ISBN</label>
              <input value={isbn} onChange={(e) => setIsbn(e.target.value)} className={inputFieldCls} placeholder="978-..." />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'ক্যাটাগরি' : 'Category'} *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputFieldCls} ${errors.categoryId ? 'border-red-500' : ''}`}>
                <option value="">{bn ? 'নির্বাচন করুন' : 'Select'}</option>
                {categories.filter((c) => c.isActive).map((c) => (
                  <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{bn ? 'শেল্ফ' : 'Shelf'}</label>
              <input value={shelf} onChange={(e) => setShelf(e.target.value)} className={inputFieldCls} placeholder="A-01" />
            </div>
          </div>

          <div>
            <label className={labelCls}>{bn ? 'ইংরেজি বিবরণ' : 'Description'}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputFieldCls} min-h-[3rem]`} rows={2} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'বাংলা বিবরণ' : 'Description (Bengali)'}</label>
            <textarea value={descriptionBn} onChange={(e) => setDescriptionBn(e.target.value)} className={`${inputFieldCls} min-h-[3rem]`} rows={2} />
          </div>

          <div>
            <label className={labelCls}>{bn ? 'মোট কপি' : 'Total Copies'}</label>
            <input type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(Math.max(1, parseInt(e.target.value) || 1))} className={inputFieldCls} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-medium hover:bg-[var(--surface)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium hover:opacity-90 transition-opacity">
            {existing ? (bn ? 'আপডেট' : 'Update') : (bn ? 'সংরক্ষণ' : 'Save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
