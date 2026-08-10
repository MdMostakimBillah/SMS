import { useState, useMemo, useCallback } from 'react'
import { Tag, Pencil, Trash2, Plus, BoxSelect } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreCategory } from '@/store/storeStore'
import { CategoryModal } from '../modals/CategoryModal'

interface Props {
  searchQuery: string
}

const catColors = ['var(--brand)', 'var(--teal)', 'var(--amber)', 'var(--green)', 'var(--purple)', 'var(--red)']

export const CategoriesTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const categories = useStoreStore((s) => s.categories)
  const products = useStoreStore((s) => s.products)
  const deleteCategory = useStoreStore((s) => s.deleteCategory)

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<StoreCategory | null>(null)

  const filtered = useMemo(() => {
    let list = [...categories]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.nameBn.includes(q))
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [categories, searchQuery])

  const getProductCount = useCallback((catId: string) => {
    return products.filter((p) => p.categoryId === catId).length
  }, [products])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[0.8125rem] text-[var(--text-secondary)]">
          {bn ? `${filtered.length} টি ক্যাটাগরি` : `${filtered.length} categories`}
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90">
          <Plus size={15} />
          {bn ? 'ক্যাটাগরি' : 'Category'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Tag size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো ক্যাটাগরি পাওয়া যায়নি' : 'No categories found'}</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম ক্যাটাগরি যোগ করুন' : '+ Add your first category'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c, i) => {
            const color = catColors[i % catColors.length]
            const count = getProductCount(c.id)
            return (
              <div key={c.id} className="p-4 rounded-[0.625rem] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, color }}>
                    <Tag size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.875rem] font-semibold text-[var(--text-primary)] truncate">{bn ? c.nameBn : c.name}</div>
                    {c.description && <div className="text-[0.6875rem] text-[var(--text-secondary)] truncate mt-0.5">{c.description}</div>}
                  </div>
                  <div className="flex items-center gap-0.5 px-2 py-1 rounded-md bg-[var(--bg-secondary)]">
                    <BoxSelect size={12} className="text-[var(--text-secondary)]" />
                    <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--border)]">
                  <button
                    onClick={() => { setEditItem(c); setShowModal(true) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Pencil size={12} />
                    {bn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-red-500/8 text-red-500 text-[0.75rem] font-medium cursor-pointer hover:bg-red-500/15 transition-colors"
                  >
                    <Trash2 size={12} />
                    {bn ? 'মুছুন' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <CategoryModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}
    </div>
  )
}
