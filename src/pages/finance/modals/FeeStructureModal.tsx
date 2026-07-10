import { useState, useMemo } from 'react'
import { X, Repeat, Zap } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import type { FeeStructure } from '@/store/feeStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { createPortal } from 'react-dom'

interface Props {
  existing: FeeStructure | null
  onSaved: (data: Partial<FeeStructure>) => void
  onClose: () => void
}

export function FeeStructureModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { classes } = useClassStore()
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [name, setName] = useState(existing?.name || '')
  const [nameBn, setNameBn] = useState(existing?.nameBn || '')
  const [cls, setCls] = useState(existing?.class || '')
  const [section, setSection] = useState(existing?.section || '')
  const [amount, setAmount] = useState(String(existing?.amount || ''))
  const [desc, setDesc] = useState(existing?.description || '')
  const [descBn, setDescBn] = useState(existing?.descriptionBn || '')
  const [type, setType] = useState<'monthly' | 'onetime'>(existing?.type || 'monthly')

  const sectionOptions = useMemo(() => (cls ? sectionsMap[cls] || [] : []), [cls, sectionsMap])

  const handleSave = () => {
    if (!name || !cls || !amount) return
    onSaved({
      name,
      nameBn: nameBn || name,
      class: cls,
      section: section || undefined,
      amount: Number(amount),
      description: desc,
      descriptionBn: descBn || desc,
      type,
    })
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[32rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            {existing ? (bn ? 'ফি সম্পাদনা' : 'Edit Fee') : (bn ? 'নতুন ফি কাঠামো' : 'New Fee Structure')}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {/* Fee Type Toggle */}
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1.5">{bn ? 'ফির ধরন *' : 'Fee Type *'}</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('monthly')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${type === 'monthly' ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                <Repeat size={12} />
                {bn ? 'মাসিক' : 'Monthly'}
              </button>
              <button type="button" onClick={() => setType('onetime')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${type === 'onetime' ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                <Zap size={12} />
                {bn ? 'এককালীন' : 'One-Time'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'নাম (EN) *' : 'Name *'}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="Tuition Fee" />
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'নাম (BN)' : 'Name (BN)'}</label>
              <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="টিউশন ফি" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'শ্রেণি *' : 'Class *'}</label>
              <select value={cls} onChange={(e) => { setCls(e.target.value); setSection('') }} className={`${selectCls} w-full text-xs`}>
                <option value="">{bn ? 'শ্রেণি বাছাই' : 'Select class'}</option>
                {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'সেকশন' : 'Section'}</label>
              <select value={section} onChange={(e) => setSection(e.target.value)} className={`${selectCls} w-full text-xs`}>
                <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
                {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="5000" />
          </div>
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'বিবরণ (EN)' : 'Description (EN)'}</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder={bn ? 'ফি সম্পর্কে বিবরণ' : 'Description of the fee'} />
          </div>
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'বিবরণ (BN)' : 'Description (BN)'}</label>
            <input value={descBn} onChange={(e) => setDescBn(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="ফি সম্পর্কে বিবরণ" />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{bn ? 'বাতিল' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!name || !cls || !amount} className={`${btnPrimary} disabled:opacity-50`}>{bn ? 'সংরক্ষণ' : 'Save'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
