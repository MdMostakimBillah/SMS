import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreCategory } from '@/store/storeStore'
import { inputCls, labelCls, modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { btnPrimary } from '@/lib/styles'

const unitOptions = [
  { value: 'pc', label: 'Piece (pc)', labelBn: 'পিস' },
  { value: 'kg', label: 'Kilogram (kg)', labelBn: 'কেজি' },
  { value: 'g', label: 'Gram (g)', labelBn: 'গ্রাম' },
  { value: 'l', label: 'Liter (L)', labelBn: 'লিটার' },
  { value: 'ml', label: 'Milliliter (ml)', labelBn: 'মিলি' },
  { value: 'm', label: 'Meter (m)', labelBn: 'মিটার' },
  { value: 'cm', label: 'Centimeter (cm)', labelBn: 'সেমি' },
  { value: 'box', label: 'Box', labelBn: 'বক্স' },
  { value: 'bag', label: 'Bag', labelBn: 'ব্যাগ' },
  { value: 'roll', label: 'Roll', labelBn: 'রোল' },
  { value: 'set', label: 'Set', labelBn: 'সেট' },
  { value: 'doz', label: 'Dozen (doz)', labelBn: 'ডজন' },
  { value: 'pack', label: 'Pack', labelBn: 'প্যাক' },
]

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
  const [descBn] = useState(existing?.descriptionBn || '')

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
        descriptionBn: descBn.trim(),
      })
    } else {
      addCategory({
        id: `SCAT-${Date.now()}`,
        name: name.trim(),
        nameBn: nameBn.trim() || name.trim(),
        unit,
        unitBn: selectedUnit?.labelBn || unit,
        description: desc.trim(),
        descriptionBn: descBn.trim() || desc.trim(),
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      })
    }
    onSaved()
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[24rem]`} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
          {existing ? (bn ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category') : (bn ? 'নতুন ক্যাটাগরি' : 'New Category')}
        </h3>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>{bn ? 'নাম (ইংরেজি) *' : 'Name *'}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={bn ? 'যেমন: Books' : 'e.g., Books'} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
            <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={inputCls} placeholder={bn ? 'যেমন: বই' : 'e.g., বই'} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'একক (Unit) *' : 'Unit *'}</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              {unitOptions.map((u) => (
                <option key={u.value} value={u.value}>{bn ? u.labelBn : u.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{bn ? 'বিবরণ' : 'Description'}</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} disabled={!name.trim()} className={`${btnPrimary} disabled:opacity-50`}>
            {existing ? (bn ? 'আপডেট' : 'Update') : (bn ? 'যোগ করুন' : 'Add')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
