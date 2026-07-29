import { useState, useMemo, useRef } from 'react'
import React from 'react'
import { Trash2, Edit2, ToggleLeft, ToggleRight, Copy, Search, Plus, Repeat, Zap, DollarSign, Tag } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { toBnNum } from '@/lib/i18n'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeStructure } from '@/store/feeStore'
import { inputCls, selectCls, btnSecondary, btnPrimary } from '@/lib/styles'

interface Props {
  onEdit: (s: FeeStructure) => void
  onBulkAssign: () => void
  onManageCategories: (feeType: 'monthly' | 'onetime') => void
}

export const StructuresTab = React.memo(function StructuresTab({ onEdit, onBulkAssign, onManageCategories }: Props) {
  const bn = useBn()
  const { classes, institution } = useClassStore()
  const { structures, feeCategories, addStructure, deleteStructure, toggleStructureActive } = useFeeStore()
  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [feeType, setFeeType] = useState<'monthly' | 'onetime'>('monthly')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [qName, setQName] = useState('')
  const [qNameBn, setQNameBn] = useState('')
  const [qClass, setQClass] = useState('')
  const [qSection, setQSection] = useState('')
  const [qAmount, setQAmount] = useState('')
  const [qDesc, setQDesc] = useState('')
  const [qCategoryId, setQCategoryId] = useState('')
  const [saved, setSaved] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({ activeTab: feeType, tabRefs, sliderRef, getContainer: (s) => s.parentElement })

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const qSectionOptions = useMemo(() => (qClass ? sectionsMap[qClass] || [] : []), [qClass, sectionsMap])

  const filtered = useMemo(() => {
    let list = structures.filter((s) => s.type === feeType)
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (fCategory) list = list.filter((s) => s.categoryId === fCategory)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.nameBn.includes(q))
    }
    return list
  }, [structures, feeType, fClass, fCategory, search])

  const totalAmount = useMemo(() => filtered.reduce((sum, s) => sum + s.amount, 0), [filtered])
  const monthlyCount = structures.filter((s) => s.type === 'monthly').length
  const onetimeCount = structures.filter((s) => s.type === 'onetime').length

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const canQuickAdd = qName && qClass && qAmount

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length) return new Set()
      return new Set(filtered.map((s) => s.id))
    })
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    const msg = bn
      ? `আপনি কি ${selectedIds.size}টি ফি মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।`
      : `Delete ${selectedIds.size} fee structure(s)? This cannot be undone.`
    if (!confirm(msg)) return
    for (const id of selectedIds) deleteStructure(id)
    setSelectedIds(new Set())
  }

  const handleQuickAdd = () => {
    if (!canQuickAdd) return
    const today = new Date().toISOString().split('T')[0]
    addStructure({
      id: `FEE-${Date.now()}`,
      name: qName,
      nameBn: qNameBn || qName,
      class: qClass,
      section: qSection || undefined,
      academicYear: institution?.currentSession || '2025-26',
      amount: Number(qAmount),
      description: qDesc,
      descriptionBn: qDesc,
      isActive: true,
      type: feeType,
      categoryId: qCategoryId || undefined,
      createdAt: today,
    })
    setSaved(true)
    setTimeout(() => {
      setQName('')
      setQNameBn('')
      setQClass('')
      setQSection('')
      setQAmount('')
      setQDesc('')
      setQCategoryId('')
      setSaved(false)
      setShowQuickAdd(false)
    }, 800)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {feeType === 'monthly' ? (bn ? 'মাসিক ফি' : 'Monthly Fees') : (bn ? 'এককালীন ফি' : 'One-Time Fees')}
          </h3>
          <p className="text-[0.7rem] text-[var(--text-muted)] mt-0.5">
            {bn ? `${toBnNum(filtered.length)}টি ফি কাঠামো • মোট ${fmt(totalAmount)}` : `${filtered.length} structures • Total ${fmt(totalAmount)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onManageCategories(feeType)} className={`${btnSecondary} text-xs`}>
            <Tag size={12} /> {bn ? 'ক্যাটাগরি' : 'Categories'}
          </button>
          <button onClick={onBulkAssign} className={`${btnSecondary} text-xs`}>
            <Copy size={12} /> {bn ? 'বাল্ক আপডেট' : 'Bulk Update'}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--red)] text-white border-0 cursor-pointer hover:bg-[var(--red)]/80 transition-colors"
            >
              <Trash2 size={12} />
              {bn ? `মুছুন (${toBnNum(selectedIds.size)})` : `Delete (${selectedIds.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Tab Slider */}
      <div className="relative flex gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] mb-4">
        <div
          ref={sliderRef}
          className="absolute top-1 bottom-1 rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
          style={{
            background: 'var(--brand)',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            zIndex: 0,
          }}
        />
        <button
          ref={(el) => { if (el) tabRefs.current.set('monthly', el) }}
          onClick={() => setFeeType('monthly')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[0.5625rem] text-xs font-semibold cursor-pointer border-none transition-colors duration-200 ${feeType === 'monthly' ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Repeat size={12} />
          {bn ? 'মাসিক' : 'Monthly'}
          <span className="text-[0.6rem] opacity-70">({bn ? toBnNum(monthlyCount) : monthlyCount})</span>
        </button>
        <button
          ref={(el) => { if (el) tabRefs.current.set('onetime', el) }}
          onClick={() => setFeeType('onetime')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[0.5625rem] text-xs font-semibold cursor-pointer border-none transition-colors duration-200 ${feeType === 'onetime' ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Zap size={12} />
          {bn ? 'এককালীন' : 'One-Time'}
          <span className="text-[0.6rem] opacity-70">({bn ? toBnNum(onetimeCount) : onetimeCount})</span>
        </button>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <div className="mb-4 p-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-light)]/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--brand-light)] flex items-center justify-center">
              <Plus size={13} className="text-[var(--brand)]" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {feeType === 'monthly'
                ? (bn ? 'মাসিক ফি যোগ করুন' : 'Add Monthly Fee')
                : (bn ? 'এককালীন ফি যোগ করুন' : 'Add One-Time Fee')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'নাম (EN) *' : 'Name *'}</label>
              <input value={qName} onChange={(e) => setQName(e.target.value)} className={`${inputCls} w-full h-8 text-xs`} placeholder={feeType === 'monthly' ? 'Tuition Fee' : 'Admission Fee'} />
            </div>
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'নাম (BN)' : 'Name (BN)'}</label>
              <input value={qNameBn} onChange={(e) => setQNameBn(e.target.value)} className={`${inputCls} w-full h-8 text-xs`} placeholder={feeType === 'monthly' ? 'টিউশন ফি' : 'ভর্তি ফি'} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'শ্রেণি *' : 'Class *'}</label>
              <select value={qClass} onChange={(e) => { setQClass(e.target.value); setQSection('') }} className={`${selectCls} w-full h-8 text-xs`}>
                <option value="">{bn ? 'বাছাই' : 'Select'}</option>
                {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'সেকশন' : 'Section'}</label>
              <select value={qSection} onChange={(e) => setQSection(e.target.value)} className={`${selectCls} w-full h-8 text-xs`}>
                <option value="">{bn ? 'সব' : 'All'}</option>
                {qSectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'পরিমাণ *' : 'Amount *'}</label>
              <input type="number" min="0" value={qAmount} onChange={(e) => setQAmount(e.target.value)} className={`${inputCls} w-full h-8 text-xs`} placeholder="5000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'ক্যাটাগরি' : 'Category'}</label>
              <select value={qCategoryId} onChange={(e) => setQCategoryId(e.target.value)} className={`${selectCls} w-full h-8 text-xs`}>
                <option value="">{bn ? 'নেই' : 'None'}</option>
                {feeCategories.filter((c) => c.isActive && c.type === feeType).map((c) => (
                  <option key={c.id} value={c.id}>{bn && c.nameBn ? c.nameBn : c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'বিবরণ' : 'Description'}</label>
              <input value={qDesc} onChange={(e) => setQDesc(e.target.value)} className={`${inputCls} w-full h-8 text-xs`} placeholder={bn ? 'ঐচ্ছিক' : 'Optional'} />
            </div>
          </div>
          <div className="flex items-center justify-end">
            <button onClick={handleQuickAdd} disabled={!canQuickAdd} className={`${btnPrimary} h-8 text-xs disabled:opacity-50`}>
              {saved ? (bn ? 'যোগ হয়েছে!' : 'Added!') : (bn ? 'যোগ করুন' : 'Add')}
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={bn ? 'ফি খুঁজুন...' : 'Search fees...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-9 h-8 text-xs`}
          />
        </div>
        <select value={fClass} onChange={(e) => setFClass(e.target.value)} className={`${selectCls} h-8 text-xs w-auto`}>
          <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
          {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className={`${selectCls} h-8 text-xs w-auto`}>
          <option value="">{bn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
          {feeCategories.filter((c) => c.isActive && c.type === feeType).map((c) => (
            <option key={c.id} value={c.id}>{bn && c.nameBn ? c.nameBn : c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-3">
            <DollarSign size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-1">
            {feeType === 'monthly'
              ? (bn ? 'কোনো মাসিক ফি নেই' : 'No monthly fees yet')
              : (bn ? 'কোনো এককালীন ফি নেই' : 'No one-time fees yet')}
          </p>
          <p className="text-[0.7rem] text-[var(--text-muted)]">
            {bn ? '"ফি যোগ" বাটনে ক্লিক করে প্রথম ফি তৈরি করুন' : 'Click "Add Fee" to create your first fee structure'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="w-10 px-2 py-2.5">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="accent-[var(--brand)] w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'নাম' : 'Name'}</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="text-right px-4 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[var(--text-secondary)]">{bn ? 'অবস্থা' : 'Status'}</th>
                <th className="text-right px-4 py-2.5 font-semibold text-[var(--text-secondary)] w-[100px]">{bn ? 'কাজ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr
                  key={s.id}
                  className={`border-t border-[var(--border)] transition-colors duration-150 ${idx % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]/40'} ${selectedIds.has(s.id) ? 'bg-[var(--brand-light)]/30' : ''} ${s.isActive ? 'hover:bg-[var(--brand-light)]/50 hover:shadow-[inset_0_0_0_1px_var(--brand)]/10' : 'opacity-50'}`}
                >
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="accent-[var(--brand)] w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-[var(--text-primary)] truncate">{bn && s.nameBn ? s.nameBn : s.name}</p>
                    {s.description && <p className="text-[0.65rem] text-[var(--text-muted)] truncate mt-0.5">{s.description}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md text-[0.7rem]">
                      {s.class}{s.section ? ` - ${s.section}` : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {s.categoryId ? (
                      <span className="text-[var(--brand)] bg-[var(--brand-light)] px-2 py-0.5 rounded-md text-[0.7rem] font-medium">
                        {(() => {
                          const cat = feeCategories.find((c) => c.id === s.categoryId)
                          return cat ? (bn && cat.nameBn ? cat.nameBn : cat.name) : '—'
                        })()}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)] text-[0.7rem]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-[var(--text-primary)]">{fmt(s.amount)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block text-[0.65rem] font-semibold px-2.5 py-0.5 rounded-full ${s.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                      {s.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleStructureActive(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] border-0 bg-transparent cursor-pointer hover:text-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors"
                        title={s.isActive ? (bn ? 'নিষ্ক্রিয়' : 'Deactivate') : (bn ? 'সক্রিয়' : 'Activate')}
                      >
                        {s.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                      <button
                        onClick={() => onEdit(s)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] border-0 bg-transparent cursor-pointer hover:text-[var(--amber)] hover:bg-[var(--amber-light)] transition-colors"
                        title={bn ? 'সম্পাদনা' : 'Edit'}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => { if (confirm(bn ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) deleteStructure(s.id) }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] border-0 bg-transparent cursor-pointer hover:text-[var(--red)] hover:bg-[var(--red-light)] transition-colors"
                        title={bn ? 'মুছুন' : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})
