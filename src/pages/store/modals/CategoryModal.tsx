import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Tag, X, Package, Weight, Droplets, Ruler, ShoppingBag, Scroll, Gift, Hash, Box } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreCategory } from '@/store/storeStore'
import { CustomSelect } from '@/components/ui/CustomSelect'

const unitOptions = [
  { value: 'pc', label: 'Piece', labelBn: 'পিস', icon: <Package size={14} /> },
  { value: 'kg', label: 'Kilogram', labelBn: 'কেজি', icon: <Weight size={14} /> },
  { value: 'g', label: 'Gram', labelBn: 'গ্রাম', icon: <Weight size={14} /> },
  { value: 'l', label: 'Liter', labelBn: 'লিটার', icon: <Droplets size={14} /> },
  { value: 'ml', label: 'Milliliter', labelBn: 'মিলি', icon: <Droplets size={14} /> },
  { value: 'm', label: 'Meter', labelBn: 'মিটার', icon: <Ruler size={14} /> },
  { value: 'cm', label: 'Centimeter', labelBn: 'সেমি', icon: <Ruler size={14} /> },
  { value: 'box', label: 'Box', labelBn: 'বক্স', icon: <Box size={14} /> },
  { value: 'bag', label: 'Bag', labelBn: 'ব্যাগ', icon: <ShoppingBag size={14} /> },
  { value: 'roll', label: 'Roll', labelBn: 'রোল', icon: <Scroll size={14} /> },
  { value: 'set', label: 'Set', labelBn: 'সেট', icon: <Gift size={14} /> },
  { value: 'doz', label: 'Dozen', labelBn: 'ডজন', icon: <Hash size={14} /> },
  { value: 'pack', label: 'Pack', labelBn: 'প্যাক', icon: <Package size={14} /> },
]

const inputFieldCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30'
const fieldLabelCls = 'block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5'

interface Props {
  existing?: StoreCategory | null
  onSaved: () => void
  onClose: () => void
}

export function CategoryModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { addCategory, updateCategory } = useStoreStore()
  const [name, setName] = useState(existing?.name || '')
  const [nameBn, setNameBn] = useState(existing?.nameBn || '')
  const [unit, setUnit] = useState(existing?.unit || 'pc')
  const [desc, setDesc] = useState(existing?.description || '')

  const handleSave = () => {
    if (!name.trim()) return
    const selectedUnit = unitOptions.find((u) => u.value === unit)
    if (existing) {
      updateCategory(existing.id, {
        name: name.trim(),
        nameBn: nameBn.trim(),
        unit,
        unitBn: selectedUnit?.labelBn || unit,
        description: desc.trim(),
        descriptionBn: desc.trim(),
      })
    } else {
      addCategory({
        id: `SCAT-${Date.now()}`,
        name: name.trim(),
        nameBn: nameBn.trim() || name.trim(),
        unit,
        unitBn: selectedUnit?.labelBn || unit,
        description: desc.trim(),
        descriptionBn: desc.trim() || desc.trim(),
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      })
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-[28rem] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/25">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {existing ? (bn ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category') : (bn ? 'নতুন ক্যাটাগরি' : 'New Category')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                {existing ? (bn ? 'ক্যাটাগরি তথ্য আপডেট করুন' : 'Update category information') : (bn ? 'নতুন ক্যাটাগরি তথ্য যোগ করুন' : 'Fill in the category details')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelCls}>{bn ? 'নাম (ইংরেজি)' : 'Name (English)'}<span className="text-red-400 ml-0.5">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputFieldCls} placeholder={bn ? 'যেমন: Books' : 'e.g., Books'} />
            </div>
            <div>
              <label className={fieldLabelCls}>{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
              <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={inputFieldCls} placeholder={bn ? 'যেমন: বই' : 'e.g., বই'} />
            </div>
          </div>

          <div>
            <label className={fieldLabelCls}>{bn ? 'একক (Unit)' : 'Unit'}</label>
            <CustomSelect value={unit} options={unitOptions} onChange={setUnit} bn={bn} />
          </div>

          <div>
            <label className={fieldLabelCls}>{bn ? 'বিবরণ' : 'Description'}</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputFieldCls} resize-none h-20`} placeholder={bn ? 'ক্যাটাগরি বিবরণ...' : 'Category description...'} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]">
            <Package size={15} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update') : (bn ? 'যোগ করুন' : 'Add Category')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
