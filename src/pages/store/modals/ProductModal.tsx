import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreProduct } from '@/store/storeStore'
import { useClassStore, extractClassNumber } from '@/store/classStore'
import { inputCls, labelCls, modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { btnPrimary } from '@/lib/styles'

interface Props {
  existing?: StoreProduct | null
  onSaved: () => void
  onClose: () => void
}

export function ProductModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const classes = useClassStore((s) => s.classes)
  const categories = useStoreStore((s) => s.categories)
  const { addProduct, updateProduct } = useStoreStore()

  const [name, setName] = useState(existing?.name || '')
  const [nameBn, setNameBn] = useState(existing?.nameBn || '')
  const [categoryId, setCategoryId] = useState(existing?.categoryId || '')
  const [classNames, setClassNames] = useState<string[]>(existing?.classNames || [])
  const [price, setPrice] = useState(existing?.price?.toString() || '')
  const [cost, setCost] = useState(existing?.cost?.toString() || '')
  const [stock, setStock] = useState(existing?.stock?.toString() || '')
  const [minStock, setMinStock] = useState(existing?.minStock?.toString() || '5')
  const [sku, setSku] = useState(existing?.sku || '')
  const [unit, setUnit] = useState(existing?.unit || 'pc')
  const [unitBn] = useState(existing?.unitBn || 'পিস')
  const [desc, setDesc] = useState(existing?.description || '')
  const [descBn] = useState(existing?.descriptionBn || '')

  const classOptions = classes.map((c) => ({ name: c.name, num: extractClassNumber(c.name) }))

  const toggleClass = (num: string) => {
    setClassNames((prev) => (prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const now = new Date().toISOString().split('T')[0]
    const data: StoreProduct = {
      id: existing?.id || `SP-${Date.now()}`,
      name: name.trim(),
      nameBn: nameBn.trim() || name.trim(),
      categoryId: categoryId || '',
      classNames,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      stock: existing ? Number(stock) || 0 : Number(stock) || 0,
      minStock: Number(minStock) || 5,
      sku: sku.trim() || `SKU-${Date.now()}`,
      unit: unit.trim() || 'pc',
      unitBn: unitBn.trim() || 'পিস',
      description: desc.trim(),
      descriptionBn: descBn.trim() || desc.trim(),
      isActive: existing?.isActive ?? true,
      createdAt: existing?.createdAt || now,
    }
    if (existing) {
      updateProduct(existing.id, data)
    } else {
      addProduct(data)
    }
    onSaved()
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[32rem] max-h-[85vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
          {existing ? (bn ? 'পণ্য সম্পাদনা' : 'Edit Product') : (bn ? 'নতুন পণ্য' : 'New Product')}
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'নাম (ইংরেজি) *' : 'Name *'}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={bn ? 'যেমন: Notebook' : 'e.g., Notebook'} />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
              <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={inputCls} placeholder={bn ? 'যেমন: নোটবুক' : 'e.g., নোটবুক'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'ক্যাটাগরি' : 'Category'}</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                <option value="">{bn ? 'নির্বাচন করুন' : 'Select'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{bn ? 'এসকেউ' : 'SKU'}</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls} placeholder={bn ? 'অটো-জেনারেট' : 'Auto-generated'} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{bn ? 'শ্রেণি নির্বাচন করুন *' : 'Available Classes *'}</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {classOptions.map((c) => (
                <button
                  key={c.num}
                  type="button"
                  onClick={() => toggleClass(c.num)}
                  className={`px-3 py-1.5 rounded-lg border text-[0.75rem] font-medium cursor-pointer transition-colors ${
                    classNames.includes(c.num)
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {bn ? `শ্রেণি ${c.num}` : `Class ${c.num}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'বিক্রয় মূল্য (৳) *' : 'Selling Price (৳) *'}</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} min="0" step="0.01" />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'ক্রয়মূল্য (৳)' : 'Cost Price (৳)'}</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={inputCls} min="0" step="0.01" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'স্টক পরিমাণ' : 'Stock Qty'}</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputCls} min="0" />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'সর্বনিম্ন স্টক' : 'Min Stock'}</label>
              <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className={inputCls} min="0" />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'একক' : 'Unit'}</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} placeholder="pc" />
            </div>
          </div>

          <div>
            <label className={labelCls}>{bn ? 'বিবরণ' : 'Description'}</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputCls} resize-none h-16`} />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} disabled={!name.trim() || classNames.length === 0} className={`${btnPrimary} disabled:opacity-50`}>
            {existing ? (bn ? 'আপডেট' : 'Update') : (bn ? 'যোগ করুন' : 'Add Product')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
