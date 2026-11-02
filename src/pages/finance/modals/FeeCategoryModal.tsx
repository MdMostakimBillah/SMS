import { useState, useMemo } from 'react'
import { X, Edit2, Trash2, Tag, ToggleLeft, ToggleRight, Repeat, Zap } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useFeeStore } from '@/store/feeStore'
import type { FeeCategory } from '@/store/feeStore'
import { inputCls, btnPrimary } from '@/lib/styles'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { createPortal } from 'react-dom'

interface Props {
  feeType: 'monthly' | 'onetime'
  onClose: () => void
}

export function FeeCategoryModal({ feeType, onClose }: Props) {
  const bn = useBn()
  const { feeCategories, addFeeCategory, updateFeeCategory, deleteFeeCategory, toggleFeeCategoryActive } = useFeeStore()

  const filteredCategories = useMemo(() => feeCategories.filter((c) => c.type === feeType), [feeCategories, feeType])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nameBn, setNameBn] = useState('')
  const [desc, setDesc] = useState('')
  const [descBn, setDescBn] = useState('')
  const [newType, setNewType] = useState<'monthly' | 'onetime'>(feeType)
  const [saved, setSaved] = useState(false)

  const startEdit = (cat: FeeCategory) => {
    setEditingId(cat.id)
    setName(cat.name)
    setNameBn(cat.nameBn)
    setDesc(cat.description)
    setDescBn(cat.descriptionBn)
  }

  const startNew = () => {
    setEditingId(null)
    setName('')
    setNameBn('')
    setDesc('')
    setDescBn('')
    setNewType(feeType)
  }

  const handleSave = () => {
    if (!name) return
    if (editingId) {
      updateFeeCategory(editingId, {
        name,
        nameBn: nameBn || name,
        description: desc,
        descriptionBn: descBn || desc,
      })
    } else {
      addFeeCategory({
        id: `FCAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        nameBn: nameBn || name,
        description: desc,
        descriptionBn: descBn || desc,
        type: newType,
        isActive: true,
        createdAt: new Date().toISOString(),
      })
    }
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      startNew()
    }, 600)
  }

  const handleDelete = (id: string) => {
    if (confirm(bn ? 'আপনি কি নিশ্চিত? এই ক্যাটাগরির সব ফি কাঠামো থেকে ক্যাটাগরি সরানো হবে।' : 'Are you sure? All fee structures in this category will have their category removed.')) {
      deleteFeeCategory(id)
      if (editingId === id) startNew()
    }
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[28rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
              <Tag size={16} className="text-[var(--brand)]" />
            </div>
            <div>
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'ফি ক্যাটাগরি' : 'Fee Categories'}</h3>
              <p className="text-[0.65rem] text-[var(--text-muted)]">{filteredCategories.length} {bn ? 'টি ক্যাটাগরি' : 'categories'} • {feeType === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-Time')}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label={bn ? 'বন্ধ করুন' : 'Close'} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {/* Category List */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-2">
              <Tag size={20} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-1">{bn ? 'কোনো ক্যাটাগরি নেই' : 'No categories yet'}</p>
            <p className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'নিচে নতুন ক্যাটাগরি যোগ করুন' : 'Add a new category below'}</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4 max-h-[240px] overflow-y-auto pr-1">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${editingId === cat.id ? 'border-[var(--brand)] bg-[var(--brand-light)]/20' : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)]/40'} ${!cat.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {bn && cat.nameBn ? cat.nameBn : cat.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {cat.description && (
                      <p className="text-[0.65rem] text-[var(--text-muted)] truncate">{cat.description}</p>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[0.55rem] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${cat.type === 'monthly' ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
                      {cat.type === 'monthly' ? <Repeat size={8} /> : <Zap size={8} />}
                      {cat.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-Time')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeeCategoryActive(cat.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] border-0 bg-transparent cursor-pointer hover:text-[var(--brand)] transition-colors"
                  title={cat.isActive ? (bn ? 'নিষ্ক্রিয়' : 'Deactivate') : (bn ? 'সক্রিয়' : 'Activate')}
                >
                  {cat.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                </button>
                <button
                  onClick={() => startEdit(cat)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] border-0 bg-transparent cursor-pointer hover:text-[var(--amber)] transition-colors"
                  title={bn ? 'সম্পাদনা' : 'Edit'}
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] border-0 bg-transparent cursor-pointer hover:text-[var(--red)] transition-colors"
                  title={bn ? 'মুছুন' : 'Delete'}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Form */}
        <div className="border-t border-[var(--border)] pt-3">
          <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">
            {editingId ? (bn ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category') : (bn ? 'নতুন ক্যাটাগরি' : 'New Category')}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputCls} w-full h-8 text-xs`}
              placeholder={bn ? 'নাম (EN) *' : 'Name *'}
            />
            <input
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              className={`${inputCls} w-full h-8 text-xs`}
              placeholder={bn ? 'নাম (BN)' : 'Name (BN)'}
            />
          </div>
          {!editingId && (
            <div className="mb-2">
              <p className="text-[0.65rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'ক্যাটাগরির ধরন *' : 'Category Type *'}</p>
              <div className="flex items-center gap-1 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                <button
                  type="button"
                  onClick={() => setNewType('monthly')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.65rem] font-semibold cursor-pointer border-none transition-all duration-200 ${newType === 'monthly' ? 'bg-[var(--brand)] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  <Repeat size={11} />
                  {bn ? 'মাসিক' : 'Monthly'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('onetime')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.65rem] font-semibold cursor-pointer border-none transition-all duration-200 ${newType === 'onetime' ? 'bg-[var(--brand)] text-white shadow-sm' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  <Zap size={11} />
                  {bn ? 'এককালীন' : 'One-Time'}
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className={`${inputCls} flex-1 h-8 text-xs`}
              placeholder={bn ? 'বিবরণ (ঐচ্ছিক)' : 'Description (optional)'}
            />
            {editingId && (
              <button onClick={startNew} className="px-3 h-8 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!name}
              className={`${btnPrimary} h-8 text-xs disabled:opacity-50`}
            >
              {saved
                ? (editingId ? (bn ? 'আপডেট হয়েছে!' : 'Updated!') : (bn ? 'যোগ হয়েছে!' : 'Added!'))
                : (editingId ? (bn ? 'আপডেট' : 'Update') : (bn ? 'যোগ করুন' : 'Add'))
              }
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
