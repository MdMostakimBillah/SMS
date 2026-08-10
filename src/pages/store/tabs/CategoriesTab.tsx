import { useState, useMemo, useCallback } from 'react'
import { Tag, Pencil, Trash2, Plus } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreCategory } from '@/store/storeStore'
import { CategoryModal } from '../modals/CategoryModal'

interface Props {
  searchQuery: string
}

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
        <div className="overflow-x-auto rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'নাম' : 'Name'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'একক' : 'Unit'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বিবরণ' : 'Description'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পণ্য' : 'Products'}</th>
                <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const count = getProductCount(c.id)
                return (
                  <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)]">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-[var(--brand)]/10 text-[var(--brand)]">
                          <Tag size={13} />
                        </div>
                        <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? c.nameBn : c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.75rem] font-medium text-[var(--text-secondary)]">
                        {bn ? c.unitBn : c.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] max-w-[200px] truncate">
                      {c.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-md bg-[var(--brand)]/8 text-[var(--brand)] text-[0.75rem] font-semibold">
                        {count}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setEditItem(c); setShowModal(true) }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] cursor-pointer transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteCategory(c.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CategoryModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}
    </div>
  )
}
