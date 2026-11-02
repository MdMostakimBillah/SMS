import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import type { FeeDue } from '@/store/feeStore'
import { inputCls, btnPrimary } from '@/lib/styles'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { createPortal } from 'react-dom'

interface Props {
  due: FeeDue
  onCollected: (amount: number, method: 'cash' | 'bank' | 'mobile' | 'other', note: string) => void
  onClose: () => void
}

export function CollectPaymentModal({ due, onCollected, onClose }: Props) {
  const bn = useBn()
  const [amount, setAmount] = useState(String(due.dueAmount))
  const [method, setMethod] = useState<'cash' | 'bank' | 'mobile' | 'other'>('cash')
  const [note, setNote] = useState('')

  const handleCollect = () => {
    const a = Number(amount)
    if (a <= 0) return
    onCollected(a, method, note)
  }

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[26rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[var(--green-light)] flex items-center justify-center">
            <CheckCircle size={18} className="text-[var(--green)]" />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'পেমেন্ট সংগ্রহ' : 'Collect Payment'}</h3>
            <p className="text-[0.7rem] text-[var(--text-secondary)]">{bn ? due.studentNameBn || due.studentName : due.studentName} — {bn ? due.feeNameBn || due.feeName : due.feeName}</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] mb-4 text-xs">
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{bn ? 'মোট ফি' : 'Total Fee'}</span><span className="font-medium">{fmt(due.totalAmount)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{bn ? 'পরিশোধিত' : 'Paid'}</span><span className="font-medium text-[var(--green)]">{fmt(due.paidAmount)}</span></div>
          {due.waivedAmount > 0 && <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{bn ? 'ছাড়' : 'Waived'}</span><span className="font-medium text-[var(--purple)]">{fmt(due.waivedAmount)}</span></div>}
          <div className="flex justify-between border-t border-[var(--border)] mt-1 pt-1"><span className="text-[var(--text-secondary)] font-semibold">{bn ? 'বকেয়' : 'Due'}</span><span className="font-bold text-[var(--red)]">{fmt(due.dueAmount)}</span></div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
            <input type="number" min="1" max={due.dueAmount} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full text-xs`} />
          </div>
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</label>
            <div className="flex gap-2">
              {(['cash', 'bank', 'mobile', 'other'] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`flex-1 py-1.5 rounded-lg text-[0.7rem] font-medium border cursor-pointer transition-all ${method === m ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                  {m === 'cash' ? (bn ? 'নগদ' : 'Cash') : m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') : m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') : (bn ? 'অন্যান্য' : 'Other')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'নোট' : 'Note'}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder={bn ? 'পেমেন্ট নোট...' : 'Payment note...'} />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{bn ? 'বাতিল' : 'Cancel'}</button>
          <button onClick={handleCollect} disabled={!amount || Number(amount) <= 0} className={`${btnPrimary} disabled:opacity-50`}>{bn ? 'পরিশোধ নিন' : 'Collect'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
