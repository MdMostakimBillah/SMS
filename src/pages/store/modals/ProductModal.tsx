import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Package, Tag, GraduationCap, DollarSign, FileText, X, Check, AlertCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreProduct } from '@/store/storeStore'
import { useClassStore, extractClassNumber } from '@/store/classStore'

const unitOptions = [
  { value: 'pc', label: 'Piece', labelBn: 'পিস', icon: '📦' },
  { value: 'kg', label: 'Kilogram', labelBn: 'কেজি', icon: '⚖️' },
  { value: 'g', label: 'Gram', labelBn: 'গ্রাম', icon: '⚖️' },
  { value: 'l', label: 'Liter', labelBn: 'লিটার', icon: '🧴' },
  { value: 'ml', label: 'Milliliter', labelBn: 'মিলি', icon: '🧴' },
  { value: 'm', label: 'Meter', labelBn: 'মিটার', icon: '📏' },
  { value: 'cm', label: 'Centimeter', labelBn: 'সেমি', icon: '📏' },
  { value: 'box', label: 'Box', labelBn: 'বক্স', icon: '📦' },
  { value: 'bag', label: 'Bag', labelBn: 'ব্যাগ', icon: '🛍️' },
  { value: 'roll', label: 'Roll', labelBn: 'রোল', icon: '🧻' },
  { value: 'set', label: 'Set', labelBn: 'সেট', icon: '🎁' },
  { value: 'doz', label: 'Dozen', labelBn: 'ডজন', icon: '🔢' },
  { value: 'pack', label: 'Pack', labelBn: 'প্যাক', icon: '📦' },
]

const inputFieldCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30'
const selectFieldCls = `${inputFieldCls} appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_0.75rem_center] bg-[size:12px]`
const fieldLabelCls = 'block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5'

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
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const classOptions = classes.map((c) => ({ name: c.name, num: extractClassNumber(c.name) }))

  const toggleClass = (num: string) => {
    setClassNames((prev) => (prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]))
    setErrors((prev) => ({ ...prev, classes: false }))
  }

  const selectedUnit = useMemo(() => unitOptions.find((u) => u.value === unit), [unit])
  const profit = price && cost ? Number(price) - Number(cost) : 0
  const profitMargin = price && cost && Number(price) > 0 ? ((profit / Number(price)) * 100).toFixed(1) : '0'

  const validate = () => {
    const newErrors: Record<string, boolean> = {}
    if (!name.trim()) newErrors.name = true
    if (classNames.length === 0) newErrors.classes = true
    if (!price || Number(price) <= 0) newErrors.price = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-[36rem] max-h-[92vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/25">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {existing ? (bn ? 'পণ্য সম্পাদনা' : 'Edit Product') : (bn ? 'নতুন পণ্য যোগ করুন' : 'Add New Product')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                {existing ? (bn ? 'পণ্যের তথ্য আপডেট করুন' : 'Update product information') : (bn ? 'নতুন পণ্য তথ্য যোগ করুন' : 'Fill in the product details')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(92vh-8rem)]">

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                <FileText size={12} />
              </div>
              <span className="text-[0.75rem] font-bold text-[var(--text-primary)] uppercase tracking-wider">{bn ? 'পণ্যের তথ্য' : 'Product Info'}</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelCls}>{bn ? 'নাম (ইংরেজি)' : 'Name (English)'}<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })) }}
                    className={`${inputFieldCls} ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
                    placeholder={bn ? 'যেমন: Notebook' : 'e.g., Notebook'}
                  />
                  {errors.name && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'নাম আবশ্যক' : 'Name is required'}</p>}
                </div>
                <div>
                  <label className={fieldLabelCls}>{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
                  <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={inputFieldCls} placeholder={bn ? 'যেমন: নোটবুক' : 'e.g., নোটবুক'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelCls}>{bn ? 'ক্যাটাগরি' : 'Category'}</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectFieldCls}>
                    <option value="">{bn ? 'নির্বাচন করুন' : 'Select category'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabelCls}>{bn ? 'একক' : 'Unit'}</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className={selectFieldCls}>
                    {unitOptions.map((u) => (
                      <option key={u.value} value={u.value}>{u.icon} {bn ? u.labelBn : u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={fieldLabelCls}>{bn ? 'এসকেউ (SKU)' : 'SKU'}</label>
                <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputFieldCls} placeholder={bn ? 'অটো-জেনারেট হবে' : 'Auto-generated if empty'} />
              </div>
            </div>
          </div>

          {/* Classes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                  <GraduationCap size={12} />
                </div>
                <span className="text-[0.75rem] font-bold text-[var(--text-primary)] uppercase tracking-wider">{bn ? 'শ্রেণি নির্বাচন' : 'Available Classes'}</span>
                <span className="text-red-400 text-[0.75rem]">*</span>
              </div>
              {classNames.length > 0 && (
                <span className="text-[0.6875rem] text-[var(--brand)] font-medium">{classNames.length} {bn ? 'নির্বাচিত' : 'selected'}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {classOptions.map((c) => {
                const active = classNames.includes(c.num)
                return (
                  <button
                    key={c.num}
                    type="button"
                    onClick={() => toggleClass(c.num)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ${
                      active
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-lg shadow-[var(--brand)]/20 scale-[1.02]'
                        : errors.classes
                          ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-red-300 hover:border-red-400'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:text-[var(--text-primary)] hover:shadow-md'
                    }`}
                  >
                    {active ? <Check size={14} /> : <GraduationCap size={13} />}
                    {bn ? `শ্রেণি ${c.num}` : `Class ${c.num}`}
                  </button>
                )
              })}
            </div>
            {errors.classes && <p className="text-[0.6875rem] text-red-400 mt-2 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'অন্তত একটি শ্রেণি নির্বাচন করুন' : 'Select at least one class'}</p>}
          </div>

          {/* Price & Stock */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                <DollarSign size={12} />
              </div>
              <span className="text-[0.75rem] font-bold text-[var(--text-primary)] uppercase tracking-wider">{bn ? 'মূল্য ও স্টক' : 'Price & Stock'}</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelCls}>{bn ? 'বিক্রয় মূল্য (৳)' : 'Selling Price (৳)'}<span className="text-red-400 ml-0.5">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-[0.875rem] font-medium">৳</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: false })) }}
                      className={`${inputFieldCls} pl-8 ${errors.price ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'মূল্য আবশ্যক' : 'Price is required'}</p>}
                </div>
                <div>
                  <label className={fieldLabelCls}>{bn ? 'ক্রয়মূল্য (৳)' : 'Cost Price (৳)'}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-[0.875rem] font-medium">৳</span>
                    <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={`${inputFieldCls} pl-8`} min="0" step="0.01" placeholder="0.00" />
                  </div>
                </div>
              </div>
              {price && cost && Number(price) > 0 && Number(cost) > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'লাভ' : 'Profit'}:</span>
                    <span className={`text-[0.8125rem] font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ৳{profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-[var(--border)]" />
                  <span className="text-[0.75rem] text-[var(--text-secondary)]">
                    {bn ? 'লাভের হার' : 'Margin'}: <span className="font-semibold text-[var(--text-primary)]">{profitMargin}%</span>
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelCls}>{bn ? 'বর্তমান স্টক' : 'Current Stock'}<span className="text-red-400 ml-0.5">*</span></label>
                  <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputFieldCls} min="0" placeholder="0" />
                </div>
                <div>
                  <label className={fieldLabelCls}>{bn ? 'সর্বনিম্ন স্টক' : 'Min Stock Alert'}</label>
                  <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className={inputFieldCls} min="0" placeholder="5" />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                <Tag size={12} />
              </div>
              <span className="text-[0.75rem] font-bold text-[var(--text-primary)] uppercase tracking-wider">{bn ? 'বিবরণ' : 'Description'}</span>
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className={`${inputFieldCls} resize-none h-24`}
              placeholder={bn ? 'পণ্যের বিবরণ...' : 'Product description...'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || classNames.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Package size={15} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update Product') : (bn ? 'পণ্য যোগ করুন' : 'Add Product')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
