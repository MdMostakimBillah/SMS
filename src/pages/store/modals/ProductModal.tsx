import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Package, Tag, GraduationCap, DollarSign, FileText } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreProduct } from '@/store/storeStore'
import { useClassStore, extractClassNumber } from '@/store/classStore'
import { inputCls, labelCls, modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { btnPrimary } from '@/lib/styles'

const unitOptions = [
  { value: 'pc', label: 'Piece', labelBn: 'পিস' },
  { value: 'kg', label: 'Kilogram', labelBn: 'কেজি' },
  { value: 'g', label: 'Gram', labelBn: 'গ্রাম' },
  { value: 'l', label: 'Liter', labelBn: 'লিটার' },
  { value: 'ml', label: 'Milliliter', labelBn: 'মিলি' },
  { value: 'm', label: 'Meter', labelBn: 'মিটার' },
  { value: 'cm', label: 'Centimeter', labelBn: 'সেমি' },
  { value: 'box', label: 'Box', labelBn: 'বক্স' },
  { value: 'bag', label: 'Bag', labelBn: 'ব্যাগ' },
  { value: 'roll', label: 'Roll', labelBn: 'রোল' },
  { value: 'set', label: 'Set', labelBn: 'সেট' },
  { value: 'doz', label: 'Dozen', labelBn: 'ডজন' },
  { value: 'pack', label: 'Pack', labelBn: 'প্যাক' },
]

function Required() {
  return <span className="text-red-400 ml-0.5 text-[0.75rem]">*</span>
}

function SectionHeader({ icon: Icon, label }: { icon: typeof Package; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border)]">
      <Icon size={14} className="text-[var(--brand)]" />
      <span className="text-[0.75rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
    </div>
  )
}

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
  const [desc, setDesc] = useState(existing?.description || '')

  const classOptions = classes.map((c) => ({ name: c.name, num: extractClassNumber(c.name) }))

  const toggleClass = (num: string) => {
    setClassNames((prev) => (prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]))
  }

  const handleSave = () => {
    if (!name.trim()) return
    const selectedUnit = unitOptions.find((u) => u.value === unit)
    const now = new Date().toISOString().split('T')[0]
    const data: StoreProduct = {
      id: existing?.id || `SP-${Date.now()}`,
      name: name.trim(),
      nameBn: nameBn.trim() || name.trim(),
      categoryId: categoryId || '',
      classNames,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 5,
      sku: sku.trim() || `SKU-${Date.now()}`,
      unit: unit || 'pc',
      unitBn: selectedUnit?.labelBn || 'পিস',
      description: desc.trim(),
      descriptionBn: desc.trim(),
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
      <div className={`modal-content ${modalStyleCls} max-w-[34rem] max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
            <Package size={18} />
          </div>
          <div>
            <h3 className="text-[1rem] font-semibold text-[var(--text-primary)]">
              {existing ? (bn ? 'পণ্য সম্পাদনা' : 'Edit Product') : (bn ? 'নতুন পণ্য যোগ করুন' : 'Add New Product')}
            </h3>
            <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
              {existing ? (bn ? 'পণ্যের তথ্য আপডেট করুন' : 'Update product information') : (bn ? 'নতুন পণ্য তথ্য যোগ করুন' : 'Fill in the product details')}
            </p>
          </div>
        </div>

        <div className="space-y-5">

          <div>
            <SectionHeader icon={FileText} label={bn ? 'পণ্যের তথ্য' : 'Product Info'} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{bn ? 'নাম (ইংরেজি)' : 'Name (English)'}<Required /></label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={bn ? 'যেমন: Notebook' : 'e.g., Notebook'} />
              </div>
              <div>
                <label className={labelCls}>{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
                <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={inputCls} placeholder={bn ? 'যেমন: নোটবুক' : 'e.g., নোটবুক'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelCls}>{bn ? 'ক্যাটাগরি' : 'Category'}</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                  <option value="">{bn ? 'নির্বাচন করুন' : 'Select category'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{bn ? 'একক' : 'Unit'}</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
                  {unitOptions.map((u) => (
                    <option key={u.value} value={u.value}>{bn ? u.labelBn : u.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>{bn ? 'এসকেউ (SKU)' : 'SKU'}</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls} placeholder={bn ? 'অটো-জেনারেট হবে' : 'Auto-generated if empty'} />
            </div>
          </div>

          <div>
            <SectionHeader icon={GraduationCap} label={bn ? 'শ্রেণি নির্বাচন' : 'Available Classes'} />
            <div className="flex flex-wrap gap-2">
              {classOptions.map((c) => {
                const active = classNames.includes(c.num)
                return (
                  <button
                    key={c.num}
                    type="button"
                    onClick={() => toggleClass(c.num)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm shadow-[var(--brand)]/20'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <GraduationCap size={13} />
                    {bn ? `শ্রেণি ${c.num}` : `Class ${c.num}`}
                  </button>
                )
              })}
            </div>
            {classNames.length === 0 && (
              <p className="text-[0.6875rem] text-red-400 mt-1.5">{bn ? 'অন্তত একটি শ্রেণি নির্বাচন করুন' : 'Select at least one class'}</p>
            )}
          </div>

          <div>
            <SectionHeader icon={DollarSign} label={bn ? 'মূল্য ও স্টক' : 'Price & Stock'} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{bn ? 'বিক্রয় মূল্য (৳)' : 'Selling Price (৳)'}<Required /></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-[0.8125rem]">৳</span>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={`${inputCls} pl-7`} min="0" step="0.01" placeholder="0" />
                </div>
              </div>
              <div>
                <label className={labelCls}>{bn ? 'ক্রয়মূল্য (৳)' : 'Cost Price (৳)'}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-[0.8125rem]">৳</span>
                  <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={`${inputCls} pl-7`} min="0" step="0.01" placeholder="0" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelCls}>{bn ? 'বর্তমান স্টক' : 'Current Stock'}<Required /></label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputCls} min="0" placeholder="0" />
              </div>
              <div>
                <label className={labelCls}>{bn ? 'সর্বনিম্ন স্টক' : 'Min Stock Alert'}</label>
                <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className={inputCls} min="0" placeholder="5" />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader icon={Tag} label={bn ? 'অতিরিক্ত তথ্য' : 'Additional Info'} />
            <div>
              <label className={labelCls}>{bn ? 'বিবরণ' : 'Description'}</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputCls} resize-none h-20`} placeholder={bn ? 'পণ্যের বিবরণ...' : 'Product description...'} />
            </div>
          </div>

        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-medium cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} disabled={!name.trim() || classNames.length === 0} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[0.8125rem] font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${btnPrimary}`}>
            <Package size={15} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update Product') : (bn ? 'পণ্য যোগ করুন' : 'Add Product')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
