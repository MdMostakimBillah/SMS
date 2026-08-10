import { useState, useMemo, useCallback } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreProduct } from '@/store/storeStore'
import { useClassStore, extractClassNumber } from '@/store/classStore'
import { toBnNum } from '@/lib/i18n'
import { selectCls, btnPrimary } from '@/lib/styles'
import { ProductModal } from '../modals/ProductModal'

interface Props {
  isMobile: boolean
  searchQuery: string
}

export const ProductsTab = ({ isMobile, searchQuery }: Props) => {
  const bn = useBn()
  const classes = useClassStore((s) => s.classes)
  const categories = useStoreStore((s) => s.categories)
  const products = useStoreStore((s) => s.products)
  const { deleteProduct, toggleProductActive, adjustStock } = useStoreStore()

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<StoreProduct | null>(null)
  const [filterClass, setFilterClass] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustQty, setAdjustQty] = useState('')

  const classOptions = classes.map((c) => ({ name: c.name, num: extractClassNumber(c.name) }))

  const filtered = useMemo(() => {
    let list = [...products]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.nameBn.includes(q) || p.sku.toLowerCase().includes(q))
    }
    if (filterClass) list = list.filter((p) => p.classNames.includes(filterClass))
    if (filterCategory) list = list.filter((p) => p.categoryId === filterCategory)
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [products, searchQuery, filterClass, filterCategory])

  const getCategoryName = useCallback((id: string) => {
    const cat = categories.find((c) => c.id === id)
    return cat ? (bn ? cat.nameBn : cat.name) : '—'
  }, [categories, bn])

  const handleAdjust = (id: string) => {
    const q = Number(adjustQty)
    if (q > 0) {
      adjustStock(id, q, 'in')
      setAdjustId(null)
      setAdjustQty('')
    }
  }

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap gap-2 mb-3">
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className={`${selectCls} w-auto min-w-[7rem]`}>
          <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
          {classOptions.map((c) => (
            <option key={c.num} value={c.num}>{bn ? `শ্রেণি ${c.num}` : `Class ${c.num}`}</option>
          ))}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${selectCls} w-auto min-w-[7rem]`}>
          <option value="">{bn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
          ))}
        </select>
        <button onClick={() => { setEditItem(null); setShowModal(true) }} className={`${btnPrimary} text-[0.8125rem] ml-auto`}>
          + {bn ? 'পণ্য' : 'Product'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-secondary)] text-[0.875rem]">
          {bn ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
        </div>
      ) : (
        <div className={isMobile ? 'space-y-2' : 'overflow-x-auto'}>
          {isMobile ? (
            filtered.map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div className="flex justify-between items-start mb-1">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[0.8125rem] truncate">{bn ? p.nameBn : p.name}</div>
                    <div className="text-[0.75rem] text-[var(--text-secondary)]">{getCategoryName(p.categoryId)}</div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <div className="font-semibold text-[0.8125rem]">{bn ? `৳${toBnNum(p.price)}` : `৳${p.price}`}</div>
                    <div className={`text-[0.6875rem] ${p.stock <= p.minStock ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                      {bn ? `স্টক: ${toBnNum(p.stock)}` : `Stock: ${p.stock}`}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.classNames.map((cn) => (
                    <span key={cn} className="px-1.5 py-0.5 rounded bg-[var(--brand)]/10 text-[var(--brand)] text-[0.625rem] font-medium">
                      {bn ? `শ্রেণি ${cn}` : `Class ${cn}`}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditItem(p); setShowModal(true) }} className="text-[0.75rem] text-[var(--brand)] cursor-pointer hover:underline">{bn ? 'সম্পাদনা' : 'Edit'}</button>
                  <button onClick={() => toggleProductActive(p.id)} className="text-[0.75rem] text-[var(--text-secondary)] cursor-pointer hover:underline">{p.isActive ? (bn ? 'নিষ্ক্রিয়' : 'Deactivate') : (bn ? 'সক্রিয়' : 'Activate')}</button>
                  {adjustId === p.id ? (
                    <div className="flex items-center gap-1 ml-auto">
                      <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-14 py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] text-[0.75rem] outline-none" placeholder="+N" />
                      <button onClick={() => handleAdjust(p.id)} className="text-[0.75rem] text-green-500 cursor-pointer">{bn ? 'যোগ' : 'Add'}</button>
                      <button onClick={() => { setAdjustId(null); setAdjustQty('') }} className="text-[0.75rem] text-[var(--text-secondary)] cursor-pointer">{bn ? 'বাতিল' : 'Cancel'}</button>
                    </div>
                  ) : (
                    <button onClick={() => { setAdjustId(p.id); setAdjustQty('') }} className="text-[0.75rem] text-green-500 cursor-pointer hover:underline ml-auto">+ {bn ? 'স্টক' : 'Stock'}</button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'নাম' : 'Name'}</th>
                  <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'শ্রেণি' : 'Classes'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'মূল্য' : 'Price'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'স্টক' : 'Stock'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)]">
                    <td className="py-2.5 px-3">
                      <div className="text-[0.8125rem] font-medium">{bn ? p.nameBn : p.name}</div>
                      <div className="text-[0.6875rem] text-[var(--text-secondary)]">{p.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[0.8125rem]">{getCategoryName(p.categoryId)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {p.classNames.map((cn) => (
                          <span key={cn} className="px-1.5 py-0.5 rounded bg-[var(--brand)]/10 text-[var(--brand)] text-[0.625rem] font-medium">
                            {cn}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[0.8125rem] font-semibold">{bn ? `৳${toBnNum(p.price)}` : `৳${p.price}`}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`text-[0.8125rem] ${p.stock <= p.minStock ? 'text-red-500 font-semibold' : ''}`}>
                        {p.stock <= p.minStock ? '⚠ ' : ''}{bn ? toBnNum(p.stock) : p.stock}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {adjustId === p.id ? (
                          <div className="flex items-center gap-1">
                            <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-14 py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] text-[0.75rem] outline-none" />
                            <button onClick={() => handleAdjust(p.id)} className="text-[0.75rem] text-green-500 cursor-pointer">{bn ? 'যোগ' : 'Add'}</button>
                            <button onClick={() => { setAdjustId(null); setAdjustQty('') }} className="text-[0.75rem] text-[var(--text-secondary)] cursor-pointer">{bn ? 'বাতিল' : 'Cancel'}</button>
                          </div>
                        ) : (
                          <button onClick={() => { setAdjustId(p.id); setAdjustQty('') }} className="text-[0.75rem] text-green-500 cursor-pointer hover:underline">+ {bn ? 'স্টক' : 'Stock'}</button>
                        )}
                        <button onClick={() => { setEditItem(p); setShowModal(true) }} className="text-[0.75rem] text-[var(--brand)] cursor-pointer hover:underline">{bn ? 'সম্পাদনা' : 'Edit'}</button>
                        <button onClick={() => deleteProduct(p.id)} className="text-[0.75rem] text-red-500 cursor-pointer hover:underline">{bn ? 'মুছুন' : 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && <ProductModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}
    </div>
  )
}
