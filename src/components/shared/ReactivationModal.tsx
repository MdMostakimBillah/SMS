import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, UserCheck } from 'lucide-react'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'

interface Props {
  studentName: string
  currentBillingDate?: string
  isBn: boolean
  onConfirm: (billingDate: string) => void
  onCancel: () => void
}

export function ReactivationModal({ studentName, currentBillingDate, isBn, onConfirm, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [billingDate, setBillingDate] = useState(currentBillingDate || today)
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!billingDate) {
      setError(isBn ? 'বিলিং তারিখ আবশ্যক' : 'Billing date is required')
      return
    }
    onConfirm(billingDate)
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onCancel}>
      <div className={`modal-content ${modalStyleCls} max-w-[28rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-light)' }}>
            <UserCheck size={20} style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'শিক্ষার্থী পুনঃসক্রিয় করুন' : 'Reactivate Student'}
            </h3>
            <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
              {studentName}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg mb-4 flex items-start gap-2" style={{ background: 'var(--green-light)' }}>
          <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--green)' }} />
          <p className="text-[0.75rem] text-[var(--text-secondary)]">
            {isBn
              ? 'পুনঃসক্রিয় করলে শিক্ষার্থী আবার সব জায়গায় যোগ হবে। নতুন বিলিং তারিখ সেট করুন।'
              : 'Reactivating will add the student back to all modules. Set a new billing date.'}
          </p>
        </div>

        <div className="mb-4">
          <label className="text-[0.75rem] font-semibold text-[var(--text-secondary)] block mb-1.5">
            {isBn ? 'নতুন বিলিং তারিখ *' : 'New Billing Date *'}
          </label>
          <input
            type="date"
            value={billingDate}
            onChange={(e) => { setBillingDate(e.target.value); setError('') }}
            className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--brand)]"
          />
          {error && (
            <p className="text-[0.6875rem] mt-1" style={{ color: 'var(--red)' }}>{error}</p>
          )}
          <p className="text-[0.625rem] mt-1" style={{ color: 'var(--text-muted)' }}>
            {isBn ? 'এই তারিখ থেকে বিল গণনা আবার শুরু হবে' : 'Bills will restart from this date'}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!billingDate}
            className="py-2 px-4 rounded-lg bg-[var(--green)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBn ? 'পুনঃসক্রিয় করুন' : 'Reactivate'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
