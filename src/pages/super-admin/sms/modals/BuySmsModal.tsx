import React, { useState } from 'react'
import { ShoppingCart, Loader2, AlertTriangle } from 'lucide-react'
import { SmsModalShell } from './SmsModalShell'

interface Props {
  open: boolean
  isBn: boolean
  onClose: () => void
  onSubmit: (data: {
    quantity: number
    totalCost: number
    provider: string
    refId?: string
    notes?: string
  }) => Promise<unknown>
}

const BD_VENDORS = ['BulkSMSBD', 'Alpha Net (sms.net.bd)', 'GreenWeb BD', 'MiMSMS', 'SSL Wireless', 'SIM Gateway']

export const BuySmsModal = React.memo(function BuySmsModal({ open, isBn, onClose, onSubmit }: Props) {
  const [provider, setProvider] = useState('BulkSMSBD')
  const [quantity, setQuantity] = useState(10000)
  const [totalCost, setTotalCost] = useState(3000)
  const [refId, setRefId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) return
    setSaving(true)
    setError('')
    try {
      await onSubmit({
        provider: provider.trim(),
        quantity: Number(quantity),
        totalCost: Number(totalCost),
        refId: refId.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setRefId('')
      setNotes('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SmsModalShell
      open={open}
      onClose={onClose}
      title={isBn ? 'বিডি প্রোভাইডার থেকে বাল্ক এসএমএস ক্রয়' : 'Purchase Bulk SMS Pool'}
      icon={<ShoppingCart size={18} />}
      titleId="buy-sms-title"
      closeLabel={isBn ? 'বন্ধ করুন' : 'Close'}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
            {isBn ? 'এসএমএস প্রোভাইডার / সরবরাহকারী' : 'Bangladesh Bulk SMS Provider / Vendor'}
          </label>
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
            required
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {BD_VENDORS.map((vendor) => (
              <button
                key={vendor}
                type="button"
                onClick={() => setProvider(vendor)}
                className={`text-[0.625rem] px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                  provider === vendor
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                {vendor}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
              {isBn ? 'এসএমএস পরিমাণ (সংখ্যা)' : 'SMS Quantity'}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-bold outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
              {isBn ? 'মোট মূল্য (টাকা)' : 'Total Cost (BDT)'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalCost}
              onChange={(e) => setTotalCost(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-bold outline-none"
              required
            />
          </div>
        </div>

        <div className="text-[0.6875rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] p-2.5 rounded-xl flex items-center justify-between">
          <span>{isBn ? 'প্রতি SMS হিসাবকৃত রেট:' : 'Calculated rate per SMS:'}</span>
          <span className="font-bold text-cyan-500">
            {quantity > 0 ? (totalCost / quantity).toFixed(3) : 0} ৳ / SMS
          </span>
        </div>

        <div>
          <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
            {isBn ? 'ইনভয়েস / ট্রানজেকশন রেফারেন্স' : 'Invoice / Transaction Reference'}
          </label>
          <input
            type="text"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            placeholder="e.g. INV-2026-001 or TXN-984392"
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-mono outline-none"
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[0.75rem] flex items-center gap-2">
            <AlertTriangle size={14} />
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
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[0.8125rem] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white border-none cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <span>{isBn ? 'পুল এ যোগ করুন' : 'Add to Master Pool'}</span>
          </button>
        </div>
      </form>
    </SmsModalShell>
  )
})
