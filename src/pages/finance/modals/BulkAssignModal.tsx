import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Repeat, Zap, ArrowRight } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeStructure } from '@/store/feeStore'
import { btnPrimary } from '@/lib/styles'
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

export function BulkAssignModal({ onSaved, onClose }: Props) {
  const bn = useBn()
  const { classes } = useClassStore()
  const { structures } = useFeeStore()
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [feeType, setFeeType] = useState<'monthly' | 'onetime'>('monthly')
  const [sourceFeeId, setSourceFeeId] = useState('')
  const [showFeeDropdown, setShowFeeDropdown] = useState(false)
  const feeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showFeeDropdown) return
    const handleClick = (e: MouseEvent) => {
      if (feeDropdownRef.current && !feeDropdownRef.current.contains(e.target as Node)) {
        setShowFeeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showFeeDropdown])

  // Class grid state
  const [classEntries, setClassEntries] = useState<Record<string, ClassEntry>>(() => {
    const entries: Record<string, ClassEntry> = {}
    for (const cls of classOptions) {
      entries[cls] = { selected: false, sections: [], amount: '' }
    }
    return entries
  })

  // Group existing structures by name for the fee selector
  const existingFees = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; structures: FeeStructure[] }>()
    for (const s of structures) {
      if (s.type !== feeType) continue
      const key = s.name
      if (!map.has(key)) map.set(key, { name: s.name, nameBn: s.nameBn, structures: [] })
      map.get(key)!.structures.push(s)
    }
    return Array.from(map.values())
  }, [structures, feeType])

  const selectedFee = useMemo(() => existingFees.find((f) => f.name === sourceFeeId), [existingFees, sourceFeeId])

  // When selecting a fee, pre-fill the class grid with existing amounts
  const handleSelectFee = (feeName: string) => {
    const fee = existingFees.find((f) => f.name === feeName)
    if (!fee) return
    setSourceFeeId(feeName)
    setShowFeeDropdown(false)

    // Pre-fill amounts from existing structures
    setClassEntries((prev) => {
      const next = { ...prev }
      // Reset all
      for (const cls of classOptions) {
        next[cls] = { selected: false, sections: [], amount: '' }
      }
      // Fill from existing structures — merge sections per class
      for (const s of fee.structures) {
        if (next[s.class]) {
          const existing = next[s.class]
          const mergedSections = s.section
            ? (existing.sections.includes(s.section) ? existing.sections : [...existing.sections, s.section])
            : existing.sections
          next[s.class] = {
            selected: true,
            sections: mergedSections,
            amount: String(s.amount),
          }
        }
      }
      return next
    })
  }

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

  // Save — update existing structures only
  const handleSave = () => {
    if (!selectedFee) return
    const updated: FeeStructure[] = []

    // Map existing structures by class+section for lookup
    const structMap = new Map<string, FeeStructure>()
    for (const s of selectedFee.structures) {
      structMap.set(`${s.class}::${s.section || ''}`, s)
    }

    for (const cls of classOptions) {
      const entry = classEntries[cls]
      if (!entry.selected) continue
      const amount = Number(entry.amount) || 0
      if (amount <= 0) continue

      if (entry.sections.length > 0) {
        for (const sec of entry.sections) {
          const key = `${cls}::${sec}`
          const existing = structMap.get(key)
          if (existing && existing.amount !== amount) {
            updated.push({ ...existing, amount })
          }
        }
      } else {
        const key = `${cls}::`
        const existing = structMap.get(key)
        if (existing && existing.amount !== amount) {
          updated.push({ ...existing, amount })
        }
      }
    }

    if (updated.length > 0) {
      onSaved(updated)
    }
  }

  const selectedCount = classOptions.filter((c) => classEntries[c]?.selected).length
  const totalStructures = classOptions.reduce((sum, c) => {
    const e = classEntries[c]
    if (!e?.selected) return sum
    return sum + (e.sections.length > 0 ? e.sections.length : 1)
  }, 0)

  const canSave = selectedFee && selectedCount > 0

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h3 className="text-base lg:text-lg font-bold text-[var(--text-primary)] m-0">
              {bn ? 'বাল্ক ফি আপডেট' : 'Bulk Fee Update'}
            </h3>
            <p className="text-xs lg:text-sm text-[var(--text-muted)] mt-0.5">
              {bn ? `${selectedCount}টি শ্রেণি নির্বাচিত • ${totalStructures}টি কাঠামো আপডেট হবে` : `${selectedCount} classes selected • ${totalStructures} structures will be updated`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body - scrollable */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
          {/* Fee Type Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => { setFeeType('monthly'); setSourceFeeId(''); setClassEntries((prev) => { const n = { ...prev }; for (const c of classOptions) n[c] = { selected: false, sections: [], amount: '' }; return n }) }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm lg:text-base font-semibold cursor-pointer transition-colors ${
                feeType === 'monthly'
                  ? 'bg-[var(--brand)] text-white border border-[var(--brand)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              <Repeat size={15} /> {bn ? 'মাসিক' : 'Monthly'}
            </button>
            <button
              onClick={() => { setFeeType('onetime'); setSourceFeeId(''); setClassEntries((prev) => { const n = { ...prev }; for (const c of classOptions) n[c] = { selected: false, sections: [], amount: '' }; return n }) }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm lg:text-base font-semibold cursor-pointer transition-colors ${
                feeType === 'onetime'
                  ? 'bg-[var(--brand)] text-white border border-[var(--brand)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              <Zap size={15} /> {bn ? 'এককালীন' : 'One-Time'}
            </button>
          </div>

          {/* Fee Selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="text-xs lg:text-sm font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'ফি নির্বাচন করুন *' : 'Select Fee *'}</label>
            <div ref={feeDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFeeDropdown(!showFeeDropdown)}
                className="flex items-center gap-2 w-full h-10 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm lg:text-base cursor-pointer text-left"
                style={{
                  color: selectedFee ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: selectedFee ? 600 : 400,
                }}
              >
                <span className="truncate">{selectedFee ? `${bn ? selectedFee.nameBn : selectedFee.name} (${selectedFee.structures.length} ${bn ? 'টি ক্লাস' : 'classes'})` : (bn ? 'ফি বাছাই করুন' : 'Select a fee')}</span>
                <ArrowRight size={14} className="ml-auto shrink-0" style={{ transform: showFeeDropdown ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {showFeeDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', maxHeight: '12rem', overflow: 'auto', boxShadow: 'var(--shadow-md)', marginTop: '0.25rem' }}>
                  {existingFees.length === 0 ? (
                    <div className="p-3 text-sm text-[var(--text-muted)] text-center">
                      {bn ? 'কোনো ফি নেই' : 'No fees found'}
                    </div>
                  ) : (
                    existingFees.map((f) => (
                      <div
                        key={f.name}
                        onClick={() => handleSelectFee(f.name)}
                        className={`p-2.5 text-sm lg:text-base cursor-pointer border-b border-[var(--border)] last:border-b-0 flex items-center justify-between ${
                          sourceFeeId === f.name ? 'text-[var(--brand)] font-semibold bg-[var(--brand-light)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <span>{bn ? f.nameBn : f.name}</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {f.structures.length} {bn ? 'টি' : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Apply Same Amount */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <button
              onClick={applySameAmount}
              disabled={!classOptions.some((c) => classEntries[c]?.selected && classEntries[c]?.amount)}
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-sm lg:text-base font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              {bn ? 'একই পরিমাণ প্রয়োগ' : 'Apply same amount'}
            </button>
          </div>

          {/* Class Fee Table */}
          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2.5rem_1fr_1fr_8rem] bg-[var(--bg-secondary)] border-b border-[var(--border)] px-3 py-2.5 text-xs lg:text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] items-center">
              <div>
                <ModernCheckbox
                  checked={classOptions.length > 0 && classOptions.every((c) => classEntries[c]?.selected)}
                  onChange={toggleAll}
                  color="brand"
                  size="sm"
                />
              </div>
              <div>{bn ? 'শ্রেণি' : 'Class'}</div>
              <div>{bn ? 'সেকশন' : 'Sections'}</div>
              <div className="text-right">{bn ? 'পরিমাণ *' : 'Amount *'}</div>
            </div>

            {/* Table Rows */}
            {classOptions.map((cls) => {
              const entry = classEntries[cls] || { selected: false, sections: [], amount: '' }
              const secs = sectionsMap[cls] || []
              const allSecsSelected = secs.length > 0 && secs.every((s) => entry.sections.includes(s))

              return (
                <div
                  key={cls}
                  className={`grid grid-cols-[2.5rem_1fr_1fr_8rem] items-center px-3 py-2.5 border-b border-[var(--border)] last:border-b-0 transition-colors ${
                    entry.selected ? 'bg-[var(--brand-light)]/40' : 'hover:bg-[var(--bg-secondary)]/30'
                  }`}
                >
                  {/* Checkbox */}
                  <div>
                    <ModernCheckbox
                      checked={entry.selected}
                      onChange={() => toggleClass(cls)}
                      color="brand"
                      size="sm"
                    />
                  </div>

                  {/* Class Name */}
                  <div className="text-sm lg:text-base font-semibold text-[var(--text-primary)]">
                    {bn ? `শ্রেণি ${cls}` : `Class ${cls}`}
                  </div>

                  {/* Section Buttons */}
                  <div className="flex flex-wrap gap-1">
                    {secs.length > 0 ? (
                      <>
                        <button
                          onClick={() => toggleAllSections(cls)}
                          className={`px-2 py-1 rounded text-xs lg:text-sm font-semibold cursor-pointer border transition-colors ${
                            allSecsSelected
                              ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]'
                          }`}
                        >
                          {bn ? 'সব' : 'All'}
                        </button>
                        {secs.map((sec) => (
                          <button
                            key={sec}
                            onClick={() => toggleSection(cls, sec)}
                            className={`px-2 py-1 rounded text-xs lg:text-sm font-semibold cursor-pointer border transition-colors ${
                              entry.sections.includes(sec)
                                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]'
                            }`}
                          >
                            {sec}
                          </button>
                        ))}
                      </>
                    ) : (
                      <span className="text-sm text-[var(--text-muted)]">—</span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-end">
                    <span className="text-sm text-[var(--text-muted)] mr-1.5">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={entry.amount}
                      onChange={(e) => setAmount(cls, e.target.value)}
                      disabled={!entry.selected}
                      className="w-24 h-9 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm lg:text-base font-semibold text-right disabled:opacity-50 focus:outline-none focus:border-[var(--brand)]"
                      placeholder="0"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-3.5 border-t border-[var(--border)] shrink-0 bg-[var(--surface)]">
          <span className="text-xs lg:text-sm text-[var(--text-muted)]">
            {totalStructures > 0 ? (bn ? `${totalStructures}টি কাঠামো আপডেট হবে` : `${totalStructures} structures will be updated`) : (bn ? 'কোনো কাঠামো নির্বাচিত হয়নি' : 'No structures selected')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-sm lg:text-base font-semibold cursor-pointer hover:bg-[var(--bg-primary)] transition-colors"
            >
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              className={`${btnPrimary} h-10 px-5 text-sm lg:text-base font-semibold disabled:opacity-50`}
              onClick={handleSave}
              disabled={!canSave}
            >
              {bn ? `সব আপডেট (${totalStructures})` : `Update All (${totalStructures})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
