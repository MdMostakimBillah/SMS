import { useState, useMemo } from 'react'
import { X, Copy, Check, Repeat, Zap } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeStructure } from '@/store/feeStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { createPortal } from 'react-dom'

interface Props {
  onSaved: (structures: FeeStructure[]) => void
  onClose: () => void
}

export function BulkAssignModal({ onSaved, onClose }: Props) {
  const bn = useBn()
  const { classes, institution } = useClassStore()
  const { structures } = useFeeStore()
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [selectedSections, setSelectedSections] = useState<Record<string, string[]>>({})
  const [sourceStructure, setSourceStructure] = useState('')
  const [customName, setCustomName] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [mode, setMode] = useState<'copy' | 'custom'>('custom')
  const [feeType, setFeeType] = useState<'monthly' | 'onetime'>('monthly')

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) => prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls])
  }

  const toggleSection = (cls: string, sec: string) => {
    setSelectedSections((prev) => {
      const current = prev[cls] || []
      const updated = current.includes(sec) ? current.filter((s) => s !== sec) : [...current, sec]
      return { ...prev, [cls]: updated }
    })
  }

  const handleSave = () => {
    const newStructures: FeeStructure[] = []
    const today = new Date().toISOString().split('T')[0]

    for (const cls of selectedClasses) {
      const secs = selectedSections[cls]
      if (secs && secs.length > 0) {
        for (const sec of secs) {
          if (mode === 'copy' && sourceStructure) {
            const src = structures.find((s) => s.id === sourceStructure)
            if (src) {
              newStructures.push({
                ...src,
                id: `FEE-${Date.now()}-${cls}-${sec}`,
                class: cls,
                section: sec,
                academicYear: institution.currentSession,
                type: feeType,
                createdAt: today,
              })
            }
          } else if (mode === 'custom' && customName && customAmount) {
            newStructures.push({
              id: `FEE-${Date.now()}-${cls}-${sec}`,
              name: customName,
              nameBn: customName,
              class: cls,
              section: sec,
              academicYear: institution.currentSession,
              amount: Number(customAmount),
              description: customDesc,
              descriptionBn: customDesc,
              isActive: true,
              type: feeType,
              createdAt: today,
            })
          }
        }
      } else {
        if (mode === 'copy' && sourceStructure) {
          const src = structures.find((s) => s.id === sourceStructure)
          if (src) {
            newStructures.push({
              ...src,
              id: `FEE-${Date.now()}-${cls}`,
              class: cls,
              section: undefined,
              academicYear: institution.currentSession,
              type: feeType,
              createdAt: today,
            })
          }
        } else if (mode === 'custom' && customName && customAmount) {
          newStructures.push({
            id: `FEE-${Date.now()}-${cls}`,
            name: customName,
            nameBn: customName,
            class: cls,
            section: undefined,
            academicYear: institution.currentSession,
            amount: Number(customAmount),
            description: customDesc,
            descriptionBn: customDesc,
            isActive: true,
            type: feeType,
            createdAt: today,
          })
        }
      }
    }

    if (newStructures.length > 0) {
      onSaved(newStructures)
    }
  }

  const canSave = selectedClasses.length > 0 && (
    (mode === 'copy' && sourceStructure) ||
    (mode === 'custom' && customName && customAmount)
  )

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[36rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] flex items-center justify-center">
              <Copy size={16} className="text-[var(--brand)]" />
            </div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'বাল্ক ফি বরাদ্দ' : 'Bulk Fee Assignment'}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-3">
          <button onClick={() => setMode('custom')} className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${mode === 'custom' ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
            {bn ? 'কাস্টম ফি' : 'Custom Fee'}
          </button>
          <button onClick={() => setMode('copy')} className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${mode === 'copy' ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
            {bn ? 'বিদ্যমান ফি কপি' : 'Copy Existing Fee'}
          </button>
        </div>

        {/* Fee Type Toggle */}
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setFeeType('monthly')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${feeType === 'monthly' ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
            <Repeat size={12} />
            {bn ? 'মাসিক' : 'Monthly'}
          </button>
          <button type="button" onClick={() => setFeeType('onetime')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all ${feeType === 'onetime' ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
            <Zap size={12} />
            {bn ? 'এককালীন' : 'One-Time'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Fee Details */}
          {mode === 'custom' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'ফির নাম *' : 'Fee Name *'}</label>
                  <input value={customName} onChange={(e) => setCustomName(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="Tuition Fee" />
                </div>
                <div>
                  <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
                  <input type="number" min="0" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="5000" />
                </div>
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'বিবরণ' : 'Description'}</label>
                <input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder={bn ? 'বিবরণ' : 'Description'} />
              </div>
            </>
          ) : (
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'ফি কাঠামো বাছাই *' : 'Select Fee Structure *'}</label>
              <select value={sourceStructure} onChange={(e) => setSourceStructure(e.target.value)} className={`${selectCls} w-full text-xs`}>
                <option value="">{bn ? 'বাছাই করুন' : 'Select...'}</option>
                {structures.map((s) => <option key={s.id} value={s.id}>{s.name} — ৳{s.amount} ({s.class})</option>)}
              </select>
            </div>
          )}

          {/* Class Selection */}
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1.5">{bn ? 'শ্রেণি বাছাই *' : 'Select Classes *'}</label>
            <div className="flex flex-wrap gap-1.5">
              {classOptions.map((c) => (
                <button key={c} onClick={() => toggleClass(c)} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium border cursor-pointer transition-all ${selectedClasses.includes(c) ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                  {selectedClasses.includes(c) && <Check size={10} className="inline mr-1" />}{c}
                </button>
              ))}
            </div>
          </div>

          {/* Section Selection per Class */}
          {selectedClasses.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <p className="text-[0.65rem] font-semibold text-[var(--text-muted)] mb-2">{bn ? 'সেকশন বাছাই (ঐচ্ছিক)' : 'Select Sections (Optional)'}</p>
              <div className="space-y-2">
                {selectedClasses.map((cls) => {
                  const secs = sectionsMap[cls] || []
                  if (secs.length === 0) return null
                  return (
                    <div key={cls}>
                      <p className="text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{cls}</p>
                      <div className="flex flex-wrap gap-1">
                        {secs.map((s) => (
                          <button key={s} onClick={() => toggleSection(cls, s)} className={`px-2 py-1 rounded text-[0.6rem] font-medium border cursor-pointer transition-all ${(selectedSections[cls] || []).includes(s) ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{bn ? 'বাতিল' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!canSave} className={`${btnPrimary} disabled:opacity-50`}>{bn ? 'বরাদ্দ করুন' : 'Assign'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
