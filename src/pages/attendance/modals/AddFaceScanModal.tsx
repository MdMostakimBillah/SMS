import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ScanFace, CheckCircle2, Loader2, Camera } from 'lucide-react'
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
  const [scanStep, setScanStep] = useState<0 | 1 | 2>(0) // 0: ready, 1: scanning, 2: success

  const handleSimulateScan = () => {
    if (!newFace.staffId) return
    setScanStep(1)
    setTimeout(() => {
      setScanStep(2)
      setTimeout(() => {
        onAdd()
      }, 700)
    }, 1300)
  }

  const isValid = Boolean(newFace.staffId)

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '24rem' }}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <ScanFace size={18} className="text-[var(--green)]" />
          {isBn ? 'ফেস স্ক্যান এনরোলমেন্ট' : 'Face Scan Enrollment'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'শিক্ষক / শিক্ষার্থী নির্বাচন করুন *' : 'Select Staff or Student *'}
            </label>
            <PersonSearchInput
              value={newFace.staffId}
              onChange={(id) => {
                setNewFace((p) => ({ ...p, staffId: id }))
                setScanStep(0)
              }}
              isBn={isBn}
              people={allPeople}
            />
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 text-center">
            {scanStep === 0 && (
              <>
                <div className="relative w-16 h-16 mx-auto mb-2 rounded-full bg-[var(--green-light)] flex items-center justify-center">
                  <ScanFace size={36} className="text-[var(--green)]" />
                  <Camera size={14} className="absolute bottom-0 right-0 text-[var(--text-primary)]" />
                </div>
                <p className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                  {isBn ? 'ক্যামেরায় মুখ স্থির রাখুন' : 'Look directly at camera'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {isBn ? 'লাইভনেস ডিটেকশন ও ১২৮-ডি ফেস এম্বেডিং নিষ্কাশন' : 'Liveness detection & 128-D face embedding extraction'}
                </p>
              </>
            )}

            {scanStep === 1 && (
              <>
                <Loader2 size={42} className="mx-auto mb-2 text-[var(--green)] animate-spin" />
                <p className="text-[0.75rem] font-semibold text-[var(--green)]">
                  {isBn ? 'ফেস স্ক্যান ও ল্যান্ডমার্ক যাচাই হচ্ছে... (৯৭% কোয়ালিটি)' : 'Extracting 3D Facial Landmarks... (97% Quality)'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {isBn ? 'বায়োমেট্রিক মডেল এনক্রিপ্ট করা হচ্ছে' : 'Encoding face embedding vector'}
                </p>
              </>
            )}

            {scanStep === 2 && (
              <>
                <CheckCircle2 size={42} className="mx-auto mb-2 text-[var(--green)] animate-bounce" />
                <p className="text-[0.75rem] font-semibold text-[var(--green)]">
                  {isBn ? 'ফেস এনরোলমেন্ট সফল হয়েছে!' : 'Face Enrolled Successfully!'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {isBn ? 'কিয়োস্ক ও ডিভাইসে মুখ শনাক্তকরণ সক্রিয়' : 'Facial recognition active for attendance'}
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
                ? 'bg-[var(--green)] hover:opacity-90 shadow-sm'
                : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
            }`}
          >
            {scanStep === 1
              ? (isBn ? 'স্ক্যান হচ্ছে...' : 'Scanning...')
              : (isBn ? 'ফেস স্ক্যান ও এনরোল করুন' : 'Capture & Enroll Face')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
