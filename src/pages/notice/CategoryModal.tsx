import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Tag, Trash2, X, Plus } from 'lucide-react'

interface CategoryModalProps {
  categories: string[]
  onAdd: (name: string) => Promise<void>
  onRemove: (name: string) => Promise<void>
  onClose: () => void
  bn: boolean
}

export function CategoryModal({ categories, onAdd, onRemove, onClose, bn }: CategoryModalProps) {
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onAdd(trimmed)
      setNewCategory('')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (cat: string) => {
    if (window.confirm(bn ? `'${cat}' ক্যাটাগরি মুছে ফেলতে চান?` : `Delete category '${cat}'?`)) {
      await onRemove(cat)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
              <Tag size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-[0.9375rem] text-[var(--text-primary)]">
                {bn ? 'ক্যাটাগরি পরিচালনা' : 'Manage Categories'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {bn ? `মোট ${categories.length}টি বিভাগ` : `${categories.length} total categories`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category List */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <Tag size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-[0.8125rem]">{bn ? 'কোনো ক্যাটাগরি নেই' : 'No categories found'}</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--brand)]/30 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                    <Tag size={12} />
                  </div>
                  <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{cat}</span>
                </div>
                {cat !== 'General' && (
                  <button
                    onClick={() => handleRemove(cat)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
                    title={bn ? 'মুছুন' : 'Delete'}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Input Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={bn ? 'নতুন ক্যাটাগরির নাম লিখুন...' : 'Enter new category name...'}
              className="flex-1 px-3.5 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleAdd}
              disabled={!newCategory.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ background: 'var(--brand)' }}
            >
              <Plus size={14} />
              {bn ? 'যুক্ত করুন' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
