import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, UserX } from 'lucide-react'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'

interface Props {
  studentName: string
  isBn: boolean
  onConfirm: (inactiveAt: string, inactiveReason: string) => void
  onCancel: () => void
}

const reasons = [
  { en: 'Transferred', bn: 'স্থানান্তরিত' },
  { en: 'Dropout', bn: 'পড়া ছেড়ে দিয়েছে' },
  { en: 'Expelled', bn: 'বহিস্কৃত' },
  { en: 'Graduated', bn: 'স্নাতক' },
  { en: 'Financial issues', bn: 'আর্থিক সমস্যা' },
  { en: 'Health issues', bn: 'স্বাস্থ্য সমস্যা' },
  { en: 'Relocated', bn: 'বাসস্থান পরিবর্তন' },
  { en: 'Other', bn: 'অন্যান্য' },
]

export function InactivationModal({ studentName, isBn, onConfirm, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [inactiveAt, setInactiveAt] = useState(today)
  const [inactiveReason, setInactiveReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const finalReason = inactiveReason === 'Other' ? customReason : inactiveReason

  const handleConfirm = () => {
    if (!inactiveAt || !finalReason.trim()) return
    onConfirm(inactiveAt, finalReason.trim())
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onCancel}>
      <div className={`modal-content ${modalStyleCls} max-w-[28rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-light)' }}>
            <UserX size={20} style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'শিক্ষার্থী নিষ্ক্রিয় করুন' : 'Deactivate Student'}
            </h3>
            <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
              {studentName}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg mb-4 flex items-start gap-2" style={{ background: 'var(--amber-light)' }}>
          <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--amber)' }} />
          <p className="text-[0.75rem] text-[var(--text-secondary)]">
            {isBn
              ? 'নিষ্ক্রিয় করলে এই শিক্ষার্থী সব জায়গা থেকে সরিয়ে ফেলা হবে (পরীক্ষা, উপস্থিতি, মার্কশিট ইত্যাদি)।'
              : 'Deactivating will remove this student from all modules (exams, attendance, marksheet, etc.).'}
          </p>
        </div>

        <div className="mb-3">
          <label className="text-[0.75rem] font-semibold text-[var(--text-secondary)] block mb-1.5">
            {isBn ? 'নিষ্ক্রিয়ের তারিখ *' : 'Inactive Date *'}
          </label>
          <input
            type="date"
            value={inactiveAt}
            onChange={(e) => setInactiveAt(e.target.value)}
            className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--brand)]"
          />
        </div>

        <div className="mb-4">
          <label className="text-[0.75rem] font-semibold text-[var(--text-secondary)] block mb-1.5">
            {isBn ? 'নিষ্ক্রিয়ের কারণ *' : 'Reason for Inactivation *'}
          </label>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {reasons.map((r) => {
              const val = isBn ? r.bn : r.en
              const active = inactiveReason === val
              return (
                <button
                  key={r.en}
                  onClick={() => setInactiveReason(val)}
                  className="py-1.5 px-2.5 rounded-lg text-[0.75rem] font-medium transition-all border text-left cursor-pointer"
                  style={{
                    background: active ? 'var(--red-light)' : 'var(--bg-secondary)',
                    borderColor: active ? 'var(--red)' : 'var(--border)',
                    color: active ? 'var(--red)' : 'var(--text-secondary)',
                  }}
                >
                  {val}
                </button>
              )
            })}
          </div>
          {inactiveReason === (isBn ? 'অন্যান্য' : 'Other') && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={isBn ? 'কারণ লিখুন...' : 'Enter reason...'}
              className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--brand)]"
            />
          )}
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
            disabled={!inactiveAt || !finalReason.trim()}
            className="py-2 px-4 rounded-lg bg-[var(--red)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBn ? 'নিষ্ক্রিয় করুন' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
