import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Tag, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useOthersIncomeStore, otherIncomeCategoryId, type OthersIncomeCategory } from '@/store/othersIncomeStore'

const inputCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10'
const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'

interface Props {
  existing?: OthersIncomeCategory | null
  onSaved: () => void
  onClose: () => void
}

export function CategoryModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { addCategory, updateCategory } = useOthersIncomeStore()

  const [name, setName] = useState(existing?.name || '')
  const [nameBn, setNameBn] = useState(existing?.nameBn || '')
  const [amount, setAmount] = useState(existing?.amount?.toString() || '')
  const [type, setType] = useState<'monthly' | 'onetime'>(existing?.type || 'monthly')
  const [description, setDescription] = useState(existing?.description || '')
  const [descriptionBn, setDescriptionBn] = useState(existing?.descriptionBn || '')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!name.trim()) e.name = true
    if (!amount || Number(amount) <= 0) e.amount = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString()
    if (existing) {
      updateCategory(existing.id, {
        name: name.trim(),
        nameBn: nameBn.trim(),
        amount: Number(amount),
        type,
        description: description.trim(),
        descriptionBn: descriptionBn.trim(),
      })
    } else {
      addCategory({
        id: otherIncomeCategoryId(),
        name: name.trim(),
        nameBn: nameBn.trim(),
        amount: Number(amount),
        type,
        totalMonths: type === 'monthly' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [],
        description: description.trim(),
        descriptionBn: descriptionBn.trim(),
        isActive: true,
        createdAt: now,
      })
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-primary)] rounded-2xl w-[480px] max-w-[90vw] max-h-[85vh] flex flex-col shadow-2xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)18', color: 'var(--brand)' }}>
              <Tag size={15} />
            </div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)] m-0">
              {existing ? (bn ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category') : (bn ? 'নতুন ক্যাটাগরি' : 'New Category')}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>{bn ? 'নাম (ইংরেজি)' : 'Name (English)'}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daycare Fee" className={`${inputCls} ${errors.name ? 'border-[var(--red)]' : ''}`} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
            <input type="text" value={nameBn} onChange={(e) => setNameBn(e.target.value)} placeholder="e.g. ডেকেয়ার ফি" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'পরিমাণ (৳)' : 'Amount (৳)'}</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} placeholder="0" className={`${inputCls} max-w-[200px] ${errors.amount ? 'border-[var(--red)]' : ''}`} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'ধরন' : 'Type'}</label>
            <div className="flex gap-2">
              <button onClick={() => setType('monthly')} type="button"
                className={`flex-1 h-[2.625rem] rounded-xl border text-[12px] font-medium cursor-pointer transition-all ${type === 'monthly' ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'}`}>
                {bn ? 'মাসিক' : 'Monthly'}
              </button>
              <button onClick={() => setType('onetime')} type="button"
                className={`flex-1 h-[2.625rem] rounded-xl border text-[12px] font-medium cursor-pointer transition-all ${type === 'onetime' ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'}`}>
                {bn ? 'এককালীন' : 'One-time'}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>{bn ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}</label>
            <textarea value={descriptionBn} onChange={(e) => setDescriptionBn(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[12px] font-medium cursor-pointer hover:bg-[var(--border)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} className="h-9 px-5 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity">
            {existing ? (bn ? 'সংরক্ষণ' : 'Save') : (bn ? 'তৈরি করুন' : 'Create')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
