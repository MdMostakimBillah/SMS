import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Tag, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useOthersIncomeStore, otherIncomeCategoryId, type OthersIncomeCategory } from '@/store/othersIncomeStore'

const inputCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10'
const selectCls = `${inputCls} appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_0.75rem_center] bg-[size:12px]`
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
  const [totalMonths, setTotalMonths] = useState(existing?.totalMonths?.toString() || '12')
  const [description, setDescription] = useState(existing?.description || '')
  const [descriptionBn, setDescriptionBn] = useState(existing?.descriptionBn || '')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!name.trim()) e.name = true
    if (!amount || Number(amount) <= 0) e.amount = true
    if (type === 'monthly' && (!totalMonths || Number(totalMonths) <= 0)) e.totalMonths = true
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
        totalMonths: type === 'monthly' ? Number(totalMonths) : undefined,
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
        totalMonths: type === 'monthly' ? Number(totalMonths) : undefined,
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'পরিমাণ (৳)' : 'Amount (৳)'}</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} placeholder="0" className={`${inputCls} ${errors.amount ? 'border-[var(--red)]' : ''}`} />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'ধরন' : 'Type'}</label>
              <div className="flex gap-2">
                <button onClick={() => setType('monthly')}
                  className={`flex-1 h-[2.625rem] rounded-xl border text-[12px] font-medium cursor-pointer transition-all ${type === 'monthly' ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'}`}>
                  {bn ? 'মাসিক' : 'Monthly'}
                </button>
                <button onClick={() => setType('onetime')}
                  className={`flex-1 h-[2.625rem] rounded-xl border text-[12px] font-medium cursor-pointer transition-all ${type === 'onetime' ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'}`}>
                  {bn ? 'এককালীন' : 'One-time'}
                </button>
              </div>
            </div>
          </div>
          {type === 'monthly' && (
            <div>
              <label className={labelCls}>{bn ? 'মোট মাস' : 'Total Months'}</label>
              <input type="number" value={totalMonths} onChange={(e) => setTotalMonths(e.target.value)} min={1} max={12} className={`${inputCls} max-w-[120px]} ${errors.totalMonths ? 'border-[var(--red)]' : ''}`} />
            </div>
          )}
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
