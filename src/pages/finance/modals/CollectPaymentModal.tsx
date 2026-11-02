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
      <div className={`modal-content ${modalStyleCls} max-w-[28rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--green-light)] flex items-center justify-center">
            <CheckCircle size={20} className="text-[var(--green)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'পেমেন্ট সংগ্রহ' : 'Collect Payment'}</h3>
            <p className="text-xs lg:text-sm text-[var(--text-secondary)] mt-0.5">{bn ? due.studentNameBn || due.studentName : due.studentName} — {bn ? due.feeNameBn || due.feeName : due.feeName}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] mb-4 text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{bn ? 'মোট ফি' : 'Total Fee'}</span><span className="font-semibold">{fmt(due.totalAmount)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{bn ? 'পরিশোধিত' : 'Paid'}</span><span className="font-semibold text-[var(--green)]">{fmt(due.paidAmount)}</span></div>
          {due.waivedAmount > 0 && <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{bn ? 'ছাড়' : 'Waived'}</span><span className="font-semibold text-[var(--purple)]">{fmt(due.waivedAmount)}</span></div>}
          <div className="flex justify-between border-t border-[var(--border)] mt-2 pt-2"><span className="text-[var(--text-secondary)] font-semibold">{bn ? 'বকেয়' : 'Due'}</span><span className="font-bold text-[var(--red)]">{fmt(due.dueAmount)}</span></div>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-xs lg:text-sm font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
            <input type="number" min="1" max={due.dueAmount} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full h-10 text-sm`} />
          </div>
          <div>
            <label className="text-xs lg:text-sm font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</label>
            <div className="flex gap-2">
              {(['cash', 'bank', 'mobile', 'other'] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`flex-1 py-2 rounded-lg text-xs lg:text-sm font-semibold border cursor-pointer transition-all ${method === m ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                  {m === 'cash' ? (bn ? 'নগদ' : 'Cash') : m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') : m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') : (bn ? 'অন্যান্য' : 'Other')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs lg:text-sm font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'নোট' : 'Note'}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} w-full h-10 text-sm`} placeholder={bn ? 'পেমেন্ট নোট...' : 'Payment note...'} />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="h-10 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium cursor-pointer font-[inherit]">{bn ? 'বাতিল' : 'Cancel'}</button>
          <button onClick={handleCollect} disabled={!amount || Number(amount) <= 0} className={`${btnPrimary} h-10 px-4 text-sm font-semibold disabled:opacity-50`}>{bn ? 'পরিশোধ নিন' : 'Collect'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
