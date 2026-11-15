import { createPortal } from 'react-dom'
import { CreditCard, Sparkles } from 'lucide-react'
import { PersonSearchInput } from '../PersonSearchInput'
import type { Person } from '../types'

interface AddRfidModalProps {
  isBn: boolean
  allPeople: Person[]
  newRFID: { staffId: string; rfidCard: string }
  setNewRFID: React.Dispatch<React.SetStateAction<{ staffId: string; rfidCard: string }>>
  onAdd: () => void
  onClose: () => void
}

export function AddRfidModal({ isBn, allPeople, newRFID, setNewRFID, onAdd, onClose }: AddRfidModalProps) {
  const handleAutoGenerate = () => {
    const card = `CARD-${Math.floor(Math.random() * 9000) + 1000}`
    setNewRFID((p) => ({ ...p, rfidCard: card }))
  }

  const isValid = Boolean(newRFID.staffId && newRFID.rfidCard.trim())

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '24rem' }}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-[var(--brand)]" />
          {isBn ? 'RFID কার্ড বরাদ্দ করুন' : 'Assign RFID Card'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'শিক্ষক / শিক্ষার্থী নির্বাচন করুন *' : 'Select Staff or Student *'}
            </label>
            <PersonSearchInput
              value={newRFID.staffId}
              onChange={(id) => setNewRFID((p) => ({ ...p, staffId: id }))}
              isBn={isBn}
              people={allPeople}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)]">
                {isBn ? 'RFID কার্ড নম্বর *' : 'RFID Card Number *'}
              </label>
              <button
                type="button"
                onClick={handleAutoGenerate}
                className="text-[0.625rem] text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 font-medium"
              >
                <Sparkles size={10} />
                {isBn ? 'স্বয়ংক্রিয় তৈরি' : 'Auto Generate'}
              </button>
            </div>
            <input
              value={newRFID.rfidCard}
              onChange={(e) => setNewRFID((p) => ({ ...p, rfidCard: e.target.value }))}
              placeholder="e.g. CARD-1045"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand)]"
            />
            <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1">
              {isBn
                ? 'ফিজিক্যাল কার্ড স্ক্যানারে ট্যাপ করতে পারেন অথবা নম্বর লিখুন।'
                : 'Tap physical card on scanner or enter card ID manually.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer hover:bg-[var(--border)]"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg text-white text-[0.75rem] font-semibold cursor-pointer border-0 transition-all ${
              isValid ? 'bg-[var(--brand)] hover:opacity-90 shadow-sm' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
            }`}
          >
            {isBn ? 'কার্ড যোগ করুন' : 'Assign Card'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
