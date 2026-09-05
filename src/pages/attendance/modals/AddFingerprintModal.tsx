import { createPortal } from 'react-dom'
import { Fingerprint } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import { PersonSearchInput } from '../PersonSearchInput'
import type { Person } from '../types'

interface AddFingerprintModalProps {
  isBn: boolean
  allPeople: Person[]
  newFP: { staffId: string }
  setNewFP: React.Dispatch<React.SetStateAction<{ staffId: string }>>
  onAdd: () => void
  onClose: () => void
}

export function AddFingerprintModal({ isBn, allPeople, newFP, setNewFP, onAdd, onClose }: AddFingerprintModalProps) {
  const { canCreate } = usePermission()
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
          {isBn ? 'ফিঙ্গারপ্রিন্ট এনরোলমেন্ট' : 'Fingerprint Enrollment'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'ব্যক্তি নির্বাচন করুন' : 'Select Person'}
            </label>
            <PersonSearchInput
              value={newFP.staffId}
              onChange={(id) => setNewFP((p) => ({ ...p, staffId: id }))}
              isBn={isBn}
              people={allPeople}
            />
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <Fingerprint size={40} className="mx-auto mb-2 text-[var(--amber)]" />
            <p className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'ডিভাইসে আঙুল রাখুন' : 'Place finger on device'}</p>
            <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1">{isBn ? '২ বার আঙুল রাখুন' : 'Tap finger twice'}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer">
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          {canCreate('attendance.device') && (
            <button onClick={onAdd} className="px-3.5 py-2 rounded-lg bg-[var(--amber)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer">
              {isBn ? 'এনরোল শুরু করুন' : 'Start Enrollment'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
