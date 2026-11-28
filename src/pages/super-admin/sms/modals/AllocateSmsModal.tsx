import React, { useState, useEffect } from 'react'
import { Building2, AlertTriangle, Loader2 } from 'lucide-react'
import type { SmsSchoolSummary } from '@/lib/api'
import type { InstitutionSMSBalance } from '@/store/smsStore'
import { SmsModalShell } from './SmsModalShell'

interface Props {
  open: boolean
  isBn: boolean
  institutions: SmsSchoolSummary[]
  balances: Record<string, InstitutionSMSBalance>
  availableMaster: number
  initialInstId?: string
  onClose: () => void
  onSubmit: (data: {
    institutionId: string
    institutionName: string
    amount: number
    type: 'credit' | 'debit'
    note?: string
  }) => Promise<{ success: boolean; error?: string }>
}

export const AllocateSmsModal = React.memo(function AllocateSmsModal({
  open,
  isBn,
  institutions,
  balances,
  availableMaster,
  initialInstId = '',
  onClose,
  onSubmit,
}: Props) {
  const [instId, setInstId] = useState(initialInstId)
  const [amount, setAmount] = useState(1000)
  const [type, setType] = useState<'credit' | 'debit'>('credit')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setInstId(initialInstId)
      setError('')
    }
  }, [open, initialInstId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const target = institutions.find((i) => i.id === instId)
    if (!target) {
      setError(isBn ? 'অনুগ্রহ করে প্রতিষ্ঠান নির্বাচন করুন' : 'Please select an institution')
      return
    }
    if (amount <= 0) {
      setError(isBn ? 'সঠিক পরিমাণ লিখুন' : 'Please enter a valid amount')
      return
    }

    setSaving(true)
    const res = await onSubmit({
      institutionId: target.id,
      institutionName: isBn ? target.nameBn || target.name : target.name,
      amount: Number(amount),
      type,
      note: note.trim() || undefined,
    })
    setSaving(false)

    if (!res.success) {
      setError(res.error || 'Allocation failed')
      return
    }
    setNote('')
    onClose()
  }

  return (
    <SmsModalShell
      open={open}
      onClose={onClose}
      title={isBn ? 'প্রতিষ্ঠানে এসএমএস ক্রেডিট বরাদ্দ' : 'Allocate SMS Credits to Institution'}
      icon={<Building2 size={18} />}
      iconBgClass="bg-indigo-500/10 text-indigo-500"
      titleId="alloc-sms-title"
      closeLabel={isBn ? 'বন্ধ করুন' : 'Close'}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
            {isBn ? 'প্রতিষ্ঠান নির্বাচন করুন' : 'Select Institution'}
          </label>
          <select
            value={instId}
            onChange={(e) => setInstId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
            required
          >
            <option value="">{isBn ? '— প্রতিষ্ঠান নির্বাচন করুন —' : '— Choose an institution —'}</option>
            {institutions.map((i) => {
              const current = balances[i.id]?.remaining ?? i.balance?.remaining ?? 0
              return (
                <option key={i.id} value={i.id}>
                  {isBn ? i.nameBn || i.name : i.name} ({i.subdomain}) — {isBn ? 'বর্তমান ব্যালেন্স:' : 'Current:'} {current} SMS
                </option>
              )
            })}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('credit')}
            className={`flex-1 py-1.5 rounded-lg text-[0.75rem] font-semibold border cursor-pointer transition-colors ${
              type === 'credit'
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]'
            }`}
          >
            {isBn ? '+ ক্রেডিট যোগ করুন' : '+ Add Credits'}
          </button>
          <button
            type="button"
            onClick={() => setType('debit')}
            className={`flex-1 py-1.5 rounded-lg text-[0.75rem] font-semibold border cursor-pointer transition-colors ${
              type === 'debit'
                ? 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]'
            }`}
          >
            {isBn ? '- ক্রেডিট ফেরত নিন' : '- Reclaim Unused'}
          </button>
        </div>

        <div>
          <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
            {isBn ? 'এসএমএস পরিমাণ' : 'SMS Quantity'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] font-bold outline-none"
              required
            />
            {[500, 1000, 2000, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="px-2.5 py-2 rounded-xl text-[0.6875rem] font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--brand)] hover:text-white transition-all text-[var(--text-secondary)] border border-[var(--border)] cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[0.6875rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] p-3 rounded-xl space-y-1">
          <div className="flex justify-between">
            <span>{isBn ? 'মাস্টার পুল অবশিষ্ট ব্যালেন্স:' : 'Available in Master Pool:'}</span>
            <span className="font-bold text-emerald-500">{availableMaster.toLocaleString()} SMS</span>
          </div>
          {type === 'credit' && (
            <div className="flex justify-between">
              <span>{isBn ? 'বরাদ্দের পর মাস্টার পুল অবশিষ্ট:' : 'Master Pool after allocation:'}</span>
              <span className="font-bold text-cyan-500">{Math.max(0, availableMaster - amount).toLocaleString()} SMS</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
            {isBn ? 'নোট / রেফারেন্স (ঐচ্ছিক)' : 'Note / Reason (Optional)'}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Monthly SMS quota, Exam notice pack"
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
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 border-none cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <span>{isBn ? 'ক্রেডিট বরাদ্দ করুন' : 'Confirm Allocation'}</span>
          </button>
        </div>
      </form>
    </SmsModalShell>
  )
})
