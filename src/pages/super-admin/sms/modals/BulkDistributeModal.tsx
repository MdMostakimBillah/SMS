import React, { useState, useMemo } from 'react'
import { Building2, AlertTriangle, Loader2, Sparkles } from 'lucide-react'
import type { SmsSchoolSummary } from '@/lib/api'
import { SmsModalShell } from './SmsModalShell'

interface Props {
  open: boolean
  isBn: boolean
  institutions: SmsSchoolSummary[]
  availableMaster: number
  onClose: () => void
  onDistribute: (data: {
    mode: 'per_school' | 'split_total'
    amount: number
    onlyActive: boolean
    note?: string
  }) => Promise<{ success: boolean; error?: string }>
}

export const BulkDistributeModal = React.memo(function BulkDistributeModal({
  open,
  isBn,
  institutions,
  availableMaster,
  onClose,
  onDistribute,
}: Props) {
  const [mode, setMode] = useState<'per_school' | 'split_total'>('per_school')
  const [amount, setAmount] = useState(500)
  const [onlyActive, setOnlyActive] = useState(true)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const eligibleSchools = useMemo(
    () => (onlyActive ? institutions.filter((s) => s.status === 'active') : institutions),
    [institutions, onlyActive]
  )

  const totalRequired = mode === 'per_school' ? amount * eligibleSchools.length : amount
  const perSchoolShare =
    eligibleSchools.length > 0
      ? mode === 'per_school'
        ? amount
        : Math.floor(amount / eligibleSchools.length)
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (eligibleSchools.length === 0) {
      setError(isBn ? 'কোনো যোগ্য প্রতিষ্ঠান পাওয়া যায়নি' : 'No eligible institutions found')
      return
    }
    if (amount <= 0) {
      setError(isBn ? 'সঠিক পরিমাণ লিখুন' : 'Please enter a valid SMS amount')
      return
    }

    setSaving(true)
    const res = await onDistribute({
      mode,
      amount: Number(amount),
      onlyActive,
      note: note.trim() || undefined,
    })
    setSaving(false)

    if (!res.success) {
      setError(res.error || 'Bulk distribution failed')
      return
    }
    setNote('')
    onClose()
  }

  return (
    <SmsModalShell
      open={open}
      onClose={onClose}
      title={isBn ? 'সকল প্রতিষ্ঠানে একযোগে SMS বিতরণ' : 'Distribute SMS Across All Institutions'}
      icon={<Sparkles size={18} />}
      iconBgClass="bg-emerald-500/10 text-emerald-500"
      titleId="bulk-dist-title"
      closeLabel={isBn ? 'বন্ধ করুন' : 'Close'}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('per_school')}
            className={`flex-1 py-2 px-3 rounded-xl text-[0.75rem] font-semibold border cursor-pointer transition-colors ${
              mode === 'per_school'
                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            {isBn ? 'প্রতি প্রতিষ্ঠানে নির্দিষ্ট পরিমাণ' : 'Fixed Per Institution'}
          </button>
          <button
            type="button"
            onClick={() => setMode('split_total')}
            className={`flex-1 py-2 px-3 rounded-xl text-[0.75rem] font-semibold border cursor-pointer transition-colors ${
              mode === 'split_total'
                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            {isBn ? 'মোট পুল সমান ভাগ করুন' : 'Split Total Equally'}
          </button>
        </div>

        <div>
          <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
            {mode === 'per_school'
              ? isBn
                ? 'প্রতি প্রতিষ্ঠানের জন্য SMS সংখ্যা'
                : 'SMS Credits per Institution'
              : isBn
                ? 'মোট বিতরণযোগ্য SMS সংখ্যা'
                : 'Total Pool SMS to Split Equally'}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] font-bold outline-none"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-[0.75rem] text-[var(--text-secondary)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
            className="rounded accent-[var(--brand)]"
          />
          <span>
            {isBn ? 'শুধুমাত্র সক্রিয় (Active) প্রতিষ্ঠানগুলোতে পাঠান' : 'Distribute only to Active status institutions'}
          </span>
        </label>

        <div className="p-3 rounded-xl bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-muted)] space-y-1">
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Building2 size={12} />
              {isBn ? 'যোগ্য প্রতিষ্ঠান সংখ্যা:' : 'Target Institutions:'}
            </span>
            <span className="font-bold text-[var(--text-primary)]">{eligibleSchools.length}</span>
          </div>
          <div className="flex justify-between">
            <span>{isBn ? 'প্রতি প্রতিষ্ঠান পাবে:' : 'Each Institution Receives:'}</span>
            <span className="font-bold text-cyan-500">~{perSchoolShare.toLocaleString()} SMS</span>
          </div>
          <div className="flex justify-between">
            <span>{isBn ? 'মোট পুল প্রয়োজন:' : 'Total Credits Needed:'}</span>
            <span className={`font-bold ${totalRequired > availableMaster ? 'text-red-500' : 'text-emerald-500'}`}>
              {totalRequired.toLocaleString()} / {availableMaster.toLocaleString()} SMS
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
            {isBn ? 'নোট (ঐচ্ছিক)' : 'Distribution Note (Optional)'}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isBn ? 'যেমন: মাসিক এসএমএস বরাদ্দ' : 'e.g. Monthly institutional SMS quota'}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[0.75rem] flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[0.8125rem] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] border-none bg-transparent cursor-pointer"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={saving || eligibleSchools.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[0.8125rem] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border-none cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <span>{isBn ? 'সব প্রতিষ্ঠানে বিতরণ করুন' : 'Distribute Now'}</span>
          </button>
        </div>
      </form>
    </SmsModalShell>
  )
})
