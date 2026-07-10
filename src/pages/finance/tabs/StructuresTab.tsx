import { useState, useMemo } from 'react'
import React from 'react'
import { Trash2, Edit2, ToggleLeft, ToggleRight, Copy, Search, Plus, ChevronUp, Check, Repeat, Zap } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { toBnNum } from '@/lib/i18n'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeStructure } from '@/store/feeStore'
import { inputCls, selectCls, btnSecondary, btnPrimary } from '@/lib/styles'

interface Props {
  onEdit: (s: FeeStructure) => void
  onBulkAssign: () => void
}

export const StructuresTab = React.memo(function StructuresTab({ onEdit, onBulkAssign }: Props) {
  const bn = useBn()
  const { classes, institution } = useClassStore()
  const { structures, addStructure, deleteStructure, toggleStructureActive } = useFeeStore()
  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [feeType, setFeeType] = useState<'monthly' | 'onetime'>('monthly')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [qName, setQName] = useState('')
  const [qNameBn, setQNameBn] = useState('')
  const [qClass, setQClass] = useState('')
  const [qSection, setQSection] = useState('')
  const [qAmount, setQAmount] = useState('')
  const [qDesc, setQDesc] = useState('')
  const [saved, setSaved] = useState(false)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const qSectionOptions = useMemo(() => (qClass ? sectionsMap[qClass] || [] : []), [qClass, sectionsMap])

  const filtered = useMemo(() => {
    let list = structures.filter((s) => s.type === feeType)
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.nameBn.includes(q))
    }
    return list
  }, [structures, feeType, fClass, search])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const canQuickAdd = qName && qClass && qAmount

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
      setSaved(false)
      setShowQuickAdd(false)
    }, 800)
  }

  const monthlyCount = structures.filter((s) => s.type === 'monthly').length
  const onetimeCount = structures.filter((s) => s.type === 'onetime').length

  return (
    <div>
      {/* Fee Type Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setFeeType('monthly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${feeType === 'monthly' ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Repeat size={12} />
          {bn ? 'মাসিক ফি' : 'Monthly Fees'}
          <span className="text-[0.6rem] opacity-70">({toBnNum(monthlyCount)})</span>
        </button>
        <button
          onClick={() => setFeeType('onetime')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${feeType === 'onetime' ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Zap size={12} />
          {bn ? 'এককালীন ফি' : 'One-Time Fees'}
          <span className="text-[0.6rem] opacity-70">({toBnNum(onetimeCount)})</span>
        </button>
      </div>

      {/* Search & Actions */}
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
        <button onClick={() => setShowQuickAdd(!showQuickAdd)} className={`${btnSecondary} ${showQuickAdd ? '!border-[var(--brand)] !text-[var(--brand)]' : ''}`}>
          {showQuickAdd ? <ChevronUp size={13} /> : <Plus size={13} />} {bn ? 'দ্রুত যোগ' : 'Quick Add'}
        </button>
        <button onClick={onBulkAssign} className={btnSecondary}>
          <Copy size={13} /> {bn ? 'বাল্ক বরাদ্দ' : 'Bulk Assign'}
        </button>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <div className="mb-3 p-3 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-light)]/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-[var(--brand-light)] flex items-center justify-center">
              <Plus size={12} className="text-[var(--brand)]" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {feeType === 'monthly'
                ? (bn ? 'একবারে মাসিক ফি যোগ করুন' : 'Add One-Time Monthly Fee')
                : (bn ? 'একবারে ফি যোগ করুন' : 'Add One-Time Fee')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'নাম (EN) *' : 'Name *'}</label>
              <input value={qName} onChange={(e) => setQName(e.target.value)} className={`${inputCls} w-full h-7 text-xs`} placeholder={feeType === 'monthly' ? 'Tuition Fee' : 'Admission Fee'} />
            </div>
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'নাম (BN)' : 'Name (BN)'}</label>
              <input value={qNameBn} onChange={(e) => setQNameBn(e.target.value)} className={`${inputCls} w-full h-7 text-xs`} placeholder={feeType === 'monthly' ? 'টিউশন ফি' : 'ভর্তি ফি'} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'শ্রেণি *' : 'Class *'}</label>
              <select value={qClass} onChange={(e) => { setQClass(e.target.value); setQSection('') }} className={`${selectCls} w-full h-7 text-xs`}>
                <option value="">{bn ? 'বাছাই' : 'Select'}</option>
                {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'সেকশন' : 'Section'}</label>
              <select value={qSection} onChange={(e) => setQSection(e.target.value)} className={`${selectCls} w-full h-7 text-xs`}>
                <option value="">{bn ? 'সব' : 'All'}</option>
                {qSectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] font-medium text-[var(--text-muted)] block mb-0.5">{bn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
              <input type="number" min="0" value={qAmount} onChange={(e) => setQAmount(e.target.value)} className={`${inputCls} w-full h-7 text-xs`} placeholder="5000" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input value={qDesc} onChange={(e) => setQDesc(e.target.value)} className={`${inputCls} flex-1 h-7 text-xs`} placeholder={bn ? 'বিবরণ (ঐচ্ছিক)' : 'Description (optional)'} />
            <button onClick={handleQuickAdd} disabled={!canQuickAdd} className={`${btnPrimary} h-7 disabled:opacity-50`}>
              {saved ? <><Check size={12} /> {bn ? 'যোগ হয়েছে!' : 'Added!'}</> : <>{bn ? 'যোগ করুন' : 'Add Fee'}</>}
            </button>
          </div>
        </div>
      )}

      {/* Fee Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {feeType === 'monthly'
              ? (bn ? 'এখনো কোনো মাসিক ফি কাঠামো তৈরি হয়নি' : 'No monthly fee structures created yet')
              : (bn ? 'এখনো কোনো এককালীন ফি তৈরি হয়নি' : 'No one-time fee structures created yet')}
          </div>
        ) : (
          <div className="max-h-[24rem] overflow-y-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs table-fixed">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)] w-[30%]">{bn ? 'নাম' : 'Name'}</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)] w-[25%]">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)] w-[20%]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)] w-[15%]">{bn ? 'অবস্থা' : 'Status'}</th>
                  <th className="text-center px-3 py-2 font-semibold text-[var(--text-secondary)] w-[10%]">{bn ? 'কাজ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-medium text-[var(--text-primary)] truncate">{bn && s.nameBn ? s.nameBn : s.name}</p>
                      <p className="text-[0.65rem] text-[var(--text-muted)] truncate">{s.description || s.descriptionBn}</p>
                    </td>
                    <td className="px-3 py-2 text-center text-[var(--text-secondary)] truncate">{s.class}{s.section ? ` - ${s.section}` : ''}</td>
                    <td className="px-3 py-2 text-center font-semibold text-[var(--text-primary)]">{fmt(s.amount)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                        {s.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => toggleStructureActive(s.id)} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-0 cursor-pointer hover:text-[var(--brand)]" title={s.isActive ? (bn ? 'নিষ্ক্রিয় করুন' : 'Deactivate') : (bn ? 'সক্রিয় করুন' : 'Activate')}>
                          {s.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button onClick={() => onEdit(s)} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--amber-light)] text-[var(--amber)] border-0 cursor-pointer">
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => { if (confirm(bn ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) deleteStructure(s.id) }} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer">
                          <Trash2 size={11} />
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
    </div>
  )
})
