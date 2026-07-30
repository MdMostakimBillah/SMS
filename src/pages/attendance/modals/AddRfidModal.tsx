import { createPortal } from 'react-dom'
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
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
          {isBn ? 'RFID কার্ড যোগ করুন' : 'Add RFID Card'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'ব্যক্তি নির্বাচন করুন' : 'Select Person'}
            </label>
            <PersonSearchInput
              value={newRFID.staffId}
              onChange={(id) => setNewRFID((p) => ({ ...p, staffId: id }))}
              isBn={isBn}
              people={allPeople}
            />
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'কার্ড নম্বর (বা ট্যাপ করুন)' : 'Card Number (or tap)'}
            </label>
            <input
              value={newRFID.rfidCard}
              onChange={(e) => setNewRFID((p) => ({ ...p, rfidCard: e.target.value }))}
              placeholder="CARD-XXXX"
              className="w-full px-3 py-2 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] font-mono text-center outline-none focus:border-[var(--brand)]"
            />
            <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1 text-center">
              {isBn ? 'ডিভাইসে কার্ড ট্যাপ করুন অথবা ম্যানুয়ালি লিখুন' : 'Tap card on device or enter manually'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer">
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={onAdd} className="px-3.5 py-2 rounded-lg bg-[var(--brand)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer">
            {isBn ? 'যোগ করুন' : 'Add'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
