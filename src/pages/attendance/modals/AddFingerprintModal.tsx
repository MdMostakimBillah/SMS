import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Fingerprint, CheckCircle2, Loader2 } from 'lucide-react'
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
  const [scanStep, setScanStep] = useState<0 | 1 | 2>(0) // 0: waiting, 1: scanning 1st, 2: completed

  const handleSimulateScan = () => {
    if (!newFP.staffId) return
    setScanStep(1)
    setTimeout(() => {
      setScanStep(2)
      setTimeout(() => {
        onAdd()
      }, 700)
    }, 1200)
  }

  const isValid = Boolean(newFP.staffId)

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '24rem' }}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Fingerprint size={18} className="text-[var(--amber)]" />
          {isBn ? 'ফিঙ্গারপ্রিন্ট এনরোলমেন্ট' : 'Fingerprint Enrollment'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'শিক্ষক / শিক্ষার্থী নির্বাচন করুন *' : 'Select Staff or Student *'}
            </label>
            <PersonSearchInput
              value={newFP.staffId}
              onChange={(id) => {
                setNewFP((p) => ({ ...p, staffId: id }))
                setScanStep(0)
              }}
              isBn={isBn}
              people={allPeople}
            />
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 text-center">
            {scanStep === 0 && (
              <>
                <Fingerprint size={42} className="mx-auto mb-2 text-[var(--amber)] opacity-85 transition-transform hover:scale-105" />
                <p className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                  {isBn ? 'ফিঙ্গারপ্রিন্ট স্ক্যানারে আঙুল রাখুন' : 'Place finger on biometric scanner'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {isBn ? 'অপটিক্যাল/ক্যাপাসিটিভ সেন্সরে ২ বার স্পর্শ করুন' : 'Tap finger on sensor (500 DPI ZKTeco/SilkID)'}
                </p>
              </>
            )}

            {scanStep === 1 && (
              <>
                <Loader2 size={42} className="mx-auto mb-2 text-[var(--amber)] animate-spin" />
                <p className="text-[0.75rem] font-semibold text-[var(--amber)]">
                  {isBn ? 'ফিঙ্গারপ্রিন্ট স্ক্যান হচ্ছে... (৯৮% কোয়ালিটি)' : 'Capturing Minutiae... (98% Quality)'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {isBn ? 'বায়োমেট্রিক টেমপ্লেট প্রক্রিয়াকরণ হচ্ছে' : 'Generating encrypted biometric template'}
                </p>
              </>
            )}

            {scanStep === 2 && (
              <>
                <CheckCircle2 size={42} className="mx-auto mb-2 text-[var(--green)] animate-bounce" />
                <p className="text-[0.75rem] font-semibold text-[var(--green)]">
                  {isBn ? 'এনরোলমেন্ট সফল হয়েছে!' : 'Enrolled Successfully!'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {isBn ? 'ডাটাবেস ও ডিভাইসে সংরক্ষিত হয়েছে' : 'Saved to database & device store'}
                </p>
              </>
            )}
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
            onClick={handleSimulateScan}
            disabled={!isValid || scanStep === 1}
            className={`px-4 py-2 rounded-lg text-white text-[0.75rem] font-semibold cursor-pointer border-0 transition-all ${
              isValid && scanStep !== 1
                ? 'bg-[var(--amber)] hover:opacity-90 shadow-sm'
                : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
            }`}
          >
            {scanStep === 1
              ? (isBn ? 'স্ক্যান হচ্ছে...' : 'Scanning...')
              : (isBn ? 'স্ক্যান ও এনরোল করুন' : 'Scan & Enroll')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
