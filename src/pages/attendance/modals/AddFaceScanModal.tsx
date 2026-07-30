import { createPortal } from 'react-dom'
import { ScanFace } from 'lucide-react'
import { PersonSearchInput } from '../PersonSearchInput'
import type { Person } from '../types'

interface AddFaceScanModalProps {
  isBn: boolean
  allPeople: Person[]
  newFace: { staffId: string }
  setNewFace: React.Dispatch<React.SetStateAction<{ staffId: string }>>
  onAdd: () => void
  onClose: () => void
}

export function AddFaceScanModal({ isBn, allPeople, newFace, setNewFace, onAdd, onClose }: AddFaceScanModalProps) {
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
          {isBn ? 'ফেস স্ক্যান এনরোলমেন্ট' : 'Face Scan Enrollment'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'ব্যক্তি নির্বাচন করুন' : 'Select Person'}
            </label>
            <PersonSearchInput
              value={newFace.staffId}
              onChange={(id) => setNewFace((p) => ({ ...p, staffId: id }))}
              isBn={isBn}
              people={allPeople}
            />
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <ScanFace size={40} className="mx-auto mb-2 text-[var(--green)]" />
            <p className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'ক্যামেরায় মুখ দেখান' : 'Show face to camera'}</p>
            <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1">{isBn ? '৩৬০° ঘুরে মুখ দেখান' : 'Rotate face 360°'}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer">
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={onAdd} className="px-3.5 py-2 rounded-lg bg-[var(--green)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer">
            {isBn ? 'স্ক্যান শুরু করুন' : 'Start Scan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
