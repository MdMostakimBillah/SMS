import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Repeat, Zap, Copy, ArrowRight } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeStructure } from '@/store/feeStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { createPortal } from 'react-dom'

interface Props {
  onSaved: (structures: FeeStructure[]) => void
  onClose: () => void
}

interface ClassEntry {
  selected: boolean
  sections: string[]
  amount: string
}

export function FeeBatchCreateModal({ onSaved, onClose }: Props) {
  const bn = useBn()
  const { classes, institution } = useClassStore()
  const { structures, feeCategories } = useFeeStore()
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [feeType, setFeeType] = useState<'monthly' | 'onetime'>('monthly')
  const [name, setName] = useState('')
  const [nameBn, setNameBn] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionBn, setDescriptionBn] = useState('')
  const [copyFromId, setCopyFromId] = useState('')
  const [showCopyDropdown, setShowCopyDropdown] = useState(false)
  const copyDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showCopyDropdown) return
    const handleClick = (e: MouseEvent) => {
      if (copyDropdownRef.current && !copyDropdownRef.current.contains(e.target as Node)) {
        setShowCopyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCopyDropdown])

  // Class grid state
  const [classEntries, setClassEntries] = useState<Record<string, ClassEntry>>(() => {
    const entries: Record<string, ClassEntry> = {}
    for (const cls of classOptions) {
      entries[cls] = { selected: false, sections: [], amount: '' }
    }
    return entries
  })

  const activeCategories = useMemo(() => feeCategories.filter((c) => c.isActive && c.type === feeType), [feeCategories, feeType])

  // Existing structures grouped by name for copy dropdown
  const existingFees = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; structures: FeeStructure[] }>()
    for (const s of structures) {
      const key = s.name
      if (!map.has(key)) map.set(key, { name: s.name, nameBn: s.nameBn, structures: [] })
      map.get(key)!.structures.push(s)
    }
    return Array.from(map.values())
  }, [structures])

  // Toggle class selection
  const toggleClass = (cls: string) => {
    setClassEntries((prev) => ({
      ...prev,
      [cls]: { ...prev[cls], selected: !prev[cls].selected },
    }))
  }

  // Toggle all classes
  const toggleAll = () => {
    const allSelected = classOptions.every((c) => classEntries[c]?.selected)
    setClassEntries((prev) => {
      const next = { ...prev }
      for (const c of classOptions) {
        next[c] = { ...next[c], selected: !allSelected }
      }
      return next
    })
  }

  // Toggle section for a class
  const toggleSection = (cls: string, sec: string) => {
    setClassEntries((prev) => {
      const current = prev[cls].sections
      const updated = current.includes(sec) ? current.filter((s) => s !== sec) : [...current, sec]
      return { ...prev, [cls]: { ...prev[cls], sections: updated } }
    })
  }

  // Toggle all sections for a class
  const toggleAllSections = (cls: string) => {
    const allSecs = sectionsMap[cls] || []
    setClassEntries((prev) => {
      const current = prev[cls].sections
      const allSelected = allSecs.length > 0 && allSecs.every((s) => current.includes(s))
      return { ...prev, [cls]: { ...prev[cls], sections: allSelected ? [] : [...allSecs] } }
    })
  }

  // Update amount for a class
  const setAmount = (cls: string, amount: string) => {
    setClassEntries((prev) => ({ ...prev, [cls]: { ...prev[cls], amount } }))
  }

  // Apply same amount to all selected classes
  const applySameAmount = () => {
    const firstSelected = classOptions.find((c) => classEntries[c]?.selected && classEntries[c]?.amount)
    if (!firstSelected) return
    const amt = classEntries[firstSelected].amount
    setClassEntries((prev) => {
      const next = { ...prev }
      for (const c of classOptions) {
        if (next[c].selected) next[c] = { ...next[c], amount: amt }
      }
      return next
    })
  }

  // Copy from existing fee
  const handleCopyFrom = (feeName: string) => {
    const fee = existingFees.find((f) => f.name === feeName)
    if (!fee) return
    setName(fee.name)
    setNameBn(fee.nameBn)
    // Copy amounts per class from the existing structures
    setClassEntries((prev) => {
      const next = { ...prev }
      for (const s of fee.structures) {
        if (next[s.class]) {
          next[s.class] = { ...next[s.class], amount: String(s.amount), selected: true }
        }
      }
      return next
    })
    setCopyFromId(feeName)
    setShowCopyDropdown(false)
  }

  // Save
  const handleSave = () => {
    if (!name.trim()) return
    const newStructures: FeeStructure[] = []
    const today = new Date().toISOString().split('T')[0]
    const academicYear = institution?.currentSession || '2025-26'

    for (const cls of classOptions) {
      const entry = classEntries[cls]
      if (!entry.selected) continue
      const amount = Number(entry.amount) || 0
      if (amount <= 0) continue

      if (entry.sections.length > 0) {
        // Create one structure per section
        for (const sec of entry.sections) {
          newStructures.push({
            id: `FEE-${Date.now()}-${cls}-${sec}-${Math.random().toString(36).slice(2, 6)}`,
            name: name.trim(),
            nameBn: nameBn.trim() || name.trim(),
            class: cls,
            section: sec,
            academicYear,
            amount,
            description: description.trim(),
            descriptionBn: descriptionBn.trim() || description.trim(),
            isActive: true,
            type: feeType,
            categoryId: categoryId || undefined,
            createdAt: today,
          })
        }
      } else {
        // Create one structure for the class (no section)
        newStructures.push({
          id: `FEE-${Date.now()}-${cls}-${Math.random().toString(36).slice(2, 6)}`,
          name: name.trim(),
          nameBn: nameBn.trim() || name.trim(),
          class: cls,
          academicYear,
          amount,
          description: description.trim(),
          descriptionBn: descriptionBn.trim() || description.trim(),
          isActive: true,
          type: feeType,
          categoryId: categoryId || undefined,
          createdAt: today,
        })
      }
    }

    if (newStructures.length > 0) {
      onSaved(newStructures)
    }
  }

  const selectedCount = classOptions.filter((c) => classEntries[c]?.selected).length
  const totalStructures = classOptions.reduce((sum, c) => {
    const e = classEntries[c]
    if (!e?.selected) return sum
    return sum + (e.sections.length > 0 ? e.sections.length : 1)
  }, 0)

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          width: '95vw',
          maxWidth: '52rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {bn ? 'ফি কাঠামো তৈরি করুন' : 'Create Fee Structures'}
            </h3>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>
              {bn ? `${selectedCount}টি শ্রেণি নির্বাচিত • ${totalStructures}টি কাঠামো তৈরি হবে` : `${selectedCount} classes selected • ${totalStructures} structures will be created`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
          {/* Fee Type Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setFeeType('monthly')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4375rem 0.875rem', borderRadius: '0.5rem',
                background: feeType === 'monthly' ? 'var(--brand)' : 'var(--bg-secondary)',
                border: `1px solid ${feeType === 'monthly' ? 'var(--brand)' : 'var(--border)'}`,
                color: feeType === 'monthly' ? 'white' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Repeat size={12} /> {bn ? 'মাসিক' : 'Monthly'}
            </button>
            <button
              onClick={() => setFeeType('onetime')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4375rem 0.875rem', borderRadius: '0.5rem',
                background: feeType === 'onetime' ? 'var(--brand)' : 'var(--bg-secondary)',
                border: `1px solid ${feeType === 'onetime' ? 'var(--brand)' : 'var(--border)'}`,
                color: feeType === 'onetime' ? 'white' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Zap size={12} /> {bn ? 'এককালীন' : 'One-Time'}
            </button>
          </div>

          {/* Fee Details Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{bn ? 'নাম (ইংরেজি) *' : 'Name (EN) *'}</label>
              <input className={inputCls} style={{ width: '100%' }} value={name} onChange={(e) => setName(e.target.value)} placeholder={feeType === 'monthly' ? 'Tuition Fee' : 'Admission Fee'} />
            </div>
            <div>
              <label style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{bn ? 'নাম (বাংলা)' : 'Name (BN)'}</label>
              <input className={inputCls} style={{ width: '100%' }} value={nameBn} onChange={(e) => setNameBn(e.target.value)} placeholder={feeType === 'monthly' ? 'টিউশন ফি' : 'ভর্তি ফি'} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{bn ? 'ক্যাটাগরি' : 'Category'}</label>
              <select className={selectCls} style={{ width: '100%' }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">{bn ? 'নির্বাচন করুন' : 'Select'}</option>
                {activeCategories.map((c) => <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{bn ? 'বিবরণ (ইংরেজি)' : 'Description (EN)'}</label>
              <input className={inputCls} style={{ width: '100%' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={bn ? 'ঐচ্ছিক' : 'Optional'} />
            </div>
            <div>
              <label style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{bn ? 'বিবরণ (বাংলা)' : 'Description (BN)'}</label>
              <input className={inputCls} style={{ width: '100%' }} value={descriptionBn} onChange={(e) => setDescriptionBn(e.target.value)} placeholder={bn ? 'ঐচ্ছিক' : 'Optional'} />
            </div>
          </div>

          {/* Copy From + Apply Same Amount */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div ref={copyDropdownRef} style={{ position: 'relative', flex: 1 }}>
              <button
                onClick={() => setShowCopyDropdown(!showCopyDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem', width: '100%',
                  padding: '0.4375rem 0.75rem', borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: '0.6875rem', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Copy size={12} />
                {copyFromId || (bn ? 'অন্য ফি থেকে কপি করুন' : 'Copy from existing fee')}
                <ArrowRight size={10} style={{ marginLeft: 'auto' }} />
              </button>
              {showCopyDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', maxHeight: '10rem', overflow: 'auto', boxShadow: 'var(--shadow-md)', marginTop: '0.25rem' }}>
                  {existingFees.length === 0 ? (
                    <div style={{ padding: '0.75rem', fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      {bn ? 'কোনো ফি নেই' : 'No existing fees'}
                    </div>
                  ) : (
                    existingFees.map((f) => (
                      <div
                        key={f.name}
                        onClick={() => handleCopyFrom(f.name)}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', cursor: 'pointer', color: copyFromId === f.name ? 'var(--brand)' : 'var(--text-primary)', fontWeight: copyFromId === f.name ? 600 : 400, background: copyFromId === f.name ? 'var(--brand-light)' : 'transparent', borderBottom: '1px solid var(--border)' }}
                      >
                        {bn ? f.nameBn : f.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.625rem' }}>({f.structures.length})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={applySameAmount}
              disabled={!classOptions.some((c) => classEntries[c]?.selected && classEntries[c]?.amount)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.4375rem 0.75rem', borderRadius: '0.5rem',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: '0.6875rem', cursor: 'pointer', whiteSpace: 'nowrap',
                opacity: classOptions.some((c) => classEntries[c]?.selected && classEntries[c]?.amount) ? 1 : 0.5,
              }}
            >
              {bn ? 'একই পরিমাণ প্রয়োগ' : 'Apply same amount'}
            </button>
          </div>

          {/* Class Fee Table */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2rem 1fr 1fr 7rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0.5rem 0.75rem', fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              <div>
                <ModernCheckbox
                  checked={classOptions.length > 0 && classOptions.every((c) => classEntries[c]?.selected)}
                  onChange={toggleAll}
                  color="brand"
                  size="xs"
                />
              </div>
              <div>{bn ? 'শ্রেণি' : 'Class'}</div>
              <div>{bn ? 'সেকশন' : 'Sections'}</div>
              <div style={{ textAlign: 'right' }}>{bn ? 'পরিমাণ *' : 'Amount *'}</div>
            </div>

            {/* Table Rows */}
            {classOptions.map((cls) => {
              const entry = classEntries[cls] || { selected: false, sections: [], amount: '' }
              const secs = sectionsMap[cls] || []
              const allSecsSelected = secs.length > 0 && secs.every((s) => entry.sections.includes(s))

              return (
                <div
                  key={cls}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2rem 1fr 1fr 7rem',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid var(--border)',
                    background: entry.selected ? 'var(--brand-light)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Checkbox */}
                  <div>
                    <ModernCheckbox
                      checked={entry.selected}
                      onChange={() => toggleClass(cls)}
                      color="brand"
                      size="xs"
                    />
                  </div>

                  {/* Class Name */}
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {bn ? `শ্রেণি ${cls}` : `Class ${cls}`}
                  </div>

                  {/* Section Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {secs.length > 0 ? (
                      <>
                        <button
                          onClick={() => toggleAllSections(cls)}
                          style={{
                            padding: '0.1875rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.5625rem',
                            fontWeight: 600, cursor: 'pointer', border: `1px solid ${allSecsSelected ? 'var(--brand)' : 'var(--border)'}`,
                            background: allSecsSelected ? 'var(--brand)' : 'transparent',
                            color: allSecsSelected ? 'white' : 'var(--text-secondary)',
                          }}
                        >
                          {bn ? 'সব' : 'All'}
                        </button>
                        {secs.map((sec) => (
                          <button
                            key={sec}
                            onClick={() => toggleSection(cls, sec)}
                            style={{
                              padding: '0.1875rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.5625rem',
                              fontWeight: 600, cursor: 'pointer', border: `1px solid ${entry.sections.includes(sec) ? 'var(--brand)' : 'var(--border)'}`,
                              background: entry.sections.includes(sec) ? 'var(--brand)' : 'transparent',
                              color: entry.sections.includes(sec) ? 'white' : 'var(--text-secondary)',
                            }}
                          >
                            {sec}
                          </button>
                        ))}
                      </>
                    ) : (
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </div>

                  {/* Amount */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>৳</span>
                    <input
                      type="number"
                      min="0"
                      value={entry.amount}
                      onChange={(e) => setAmount(cls, e.target.value)}
                      disabled={!entry.selected}
                      style={{
                        width: '5rem', padding: '0.25rem 0.375rem', borderRadius: '0.25rem',
                        border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', fontSize: '0.75rem', textAlign: 'right',
                        opacity: entry.selected ? 1 : 0.5,
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            {totalStructures > 0 ? (bn ? `${totalStructures}টি কাঠামো তৈরি হবে` : `${totalStructures} structures will be created`) : (bn ? 'কোনো কাঠামো নির্বাচিত হয়নি' : 'No structures selected')}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3125rem',
                padding: '0.4375rem 0.875rem', borderRadius: '0.5rem',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: '0.75rem', cursor: 'pointer',
              }}
            >
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              className={btnPrimary}
              onClick={handleSave}
              disabled={!name.trim() || totalStructures === 0}
              style={{ opacity: !name.trim() || totalStructures === 0 ? 0.5 : 1 }}
            >
              {bn ? `সব সংরক্ষণ (${totalStructures})` : `Save All (${totalStructures})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
