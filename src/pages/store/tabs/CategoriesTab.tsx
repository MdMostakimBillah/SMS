import { useState, useMemo, useCallback } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreCategory } from '@/store/storeStore'
import { btnPrimary } from '@/lib/styles'
import { CategoryModal } from '../modals/CategoryModal'

interface Props {
  isMobile: boolean
  searchQuery: string
}

export const CategoriesTab = ({ isMobile, searchQuery }: Props) => {
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
    <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditItem(null); setShowModal(true) }} className={`${btnPrimary} text-[0.8125rem]`}>
          + {bn ? 'ক্যাটাগরি' : 'Category'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-secondary)] text-[0.875rem]">
          {bn ? 'কোনো ক্যাটাগরি পাওয়া যায়নি' : 'No categories found'}
        </div>
      ) : (
        <div className={isMobile ? 'space-y-2' : 'grid grid-cols-2 lg:grid-cols-3 gap-3'}>
          {filtered.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-[0.875rem]">{bn ? c.nameBn : c.name}</div>
                  {c.description && <div className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">{c.description}</div>}
                </div>
                <span className="text-[0.75rem] text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                  {getProductCount(c.id)} {bn ? 'পণ্য' : 'items'}
                </span>
              </div>
              <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--border)]">
                <button onClick={() => { setEditItem(c); setShowModal(true) }} className="text-[0.75rem] text-[var(--brand)] cursor-pointer hover:underline">{bn ? 'সম্পাদনা' : 'Edit'}</button>
                <button onClick={() => deleteCategory(c.id)} className="text-[0.75rem] text-red-500 cursor-pointer hover:underline">{bn ? 'মুছুন' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <CategoryModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}
    </div>
  )
}
