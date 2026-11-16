import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Fingerprint, CheckCircle2, Loader2, Cpu, Laptop, AlertCircle, RefreshCw } from 'lucide-react'
import { PersonSearchInput } from '../PersonSearchInput'
import { registerWebAuthnDevice, getWebAuthnErrorMessage, isSecureContext } from '@/hooks/useWebAuthn'
import type { Person } from '../types'

interface AddFingerprintModalProps {
  isBn: boolean
  allPeople: Person[]
  newFP: { staffId: string }
  setNewFP: React.Dispatch<React.SetStateAction<{ staffId: string }>>
  onAdd: (details?: { credentialId?: string; biometricType?: 'hardware_webauthn' | 'simulated' }) => void
  onClose: () => void
}

export function AddFingerprintModal({ isBn, allPeople, newFP, setNewFP, onAdd, onClose }: AddFingerprintModalProps) {
  const hasWebAuthn = useMemo(() => {
    return typeof window !== 'undefined' && Boolean(window.PublicKeyCredential) && isSecureContext()
  }, [])

  const [scanMode, setScanMode] = useState<'hardware' | 'simulate'>(hasWebAuthn ? 'hardware' : 'simulate')
  const [scanStep, setScanStep] = useState<0 | 1 | 2>(0) // 0: waiting, 1: scanning, 2: completed
  const [biometricError, setBiometricError] = useState<string | null>(null)

  const selectedPerson = useMemo(() => {
    return allPeople.find((p) => p.id === newFP.staffId)
  }, [allPeople, newFP.staffId])

  const handleHardwareScan = async () => {
    if (!newFP.staffId || !selectedPerson) return
    setBiometricError(null)
    setScanStep(1)

    try {
      const res = await registerWebAuthnDevice({
        teacherId: selectedPerson.id,
        displayName: selectedPerson.name,
      })

      if (res?.credentialId) {
        setScanStep(2)
        setTimeout(() => {
          onAdd({ credentialId: res.credentialId, biometricType: 'hardware_webauthn' })
        }, 800)
      } else {
        setScanStep(0)
        setBiometricError(isBn ? 'বায়োমেট্রিক স্ক্যান সম্পন্ন হয়নি।' : 'Biometric capture incomplete.')
      }
    } catch (err) {
      setScanStep(0)
      setBiometricError(getWebAuthnErrorMessage(err, isBn))
    }
  }

  const handleSimulateScan = () => {
    if (!newFP.staffId) return
    setBiometricError(null)
    setScanStep(1)
    setTimeout(() => {
      setScanStep(2)
      setTimeout(() => {
        onAdd({ biometricType: 'simulated' })
      }, 700)
    }, 1200)
  }

  const handleStartScan = () => {
    if (scanMode === 'hardware') {
      handleHardwareScan()
    } else {
      handleSimulateScan()
    }
  }

  const isValid = Boolean(newFP.staffId)

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '26rem' }}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Fingerprint size={18} className="text-[var(--amber)]" />
          {isBn ? 'বায়োমেট্রিক ফিঙ্গারপ্রিন্ট এনরোলমেন্ট' : 'Biometric Fingerprint Enrollment'}
        </h3>

        {/* Scan Mode Switcher */}
        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border)] mb-3">
          <button
            type="button"
            onClick={() => {
              setScanMode('hardware')
              setBiometricError(null)
              setScanStep(0)
            }}
            className={`flex-1 py-1.5 px-2 rounded-md text-[0.6875rem] font-semibold cursor-pointer border-0 transition-all flex items-center justify-center gap-1.5 ${
              scanMode === 'hardware'
                ? 'bg-[var(--amber)] text-white shadow-xs'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Laptop size={12} />
            {isBn ? 'হার্ডওয়্যার বায়োমেট্রিক' : 'Hardware Biometric'}
          </button>
          <button
            type="button"
            onClick={() => {
              setScanMode('simulate')
              setBiometricError(null)
              setScanStep(0)
            }}
            className={`flex-1 py-1.5 px-2 rounded-md text-[0.6875rem] font-semibold cursor-pointer border-0 transition-all flex items-center justify-center gap-1.5 ${
              scanMode === 'simulate'
                ? 'bg-[var(--amber)] text-white shadow-xs'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Cpu size={12} />
            {isBn ? 'টেস্ট সিমুলেটর' : 'Test Simulator'}
          </button>
        </div>

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
                setBiometricError(null)
              }}
              isBn={isBn}
              people={allPeople}
            />
          </div>

          {/* Scanner Visual Box */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 text-center">
            {scanStep === 0 && (
              <>
                <Fingerprint
                  size={46}
                  className="mx-auto mb-2 text-[var(--amber)] opacity-90 transition-transform hover:scale-105 cursor-pointer"
                  onClick={() => isValid && handleStartScan()}
                />
                <p className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                  {scanMode === 'hardware'
                    ? isBn
                      ? 'ল্যাপটপ / ডিভাইসের ফিঙ্গারপ্রিন্ট সেন্সরে আঙুল রাখুন'
                      : 'Touch laptop / device biometric fingerprint sensor'
                    : isBn
                      ? 'টেস্ট সিমুলেটরে আঙুল রাখুন'
                      : 'Place finger on simulator'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {scanMode === 'hardware'
                    ? isBn
                      ? 'Windows Hello, Touch ID বা Android বায়োমেট্রিক সক্রিয় হবে'
                      : 'Prompts Windows Hello, Mac Touch ID, or native biometrics'
                    : isBn
                      ? 'অপটিক্যাল ৫00 DPI বায়োমেট্রিক সিমুলেশন (টেস্টিংয়ের জন্য)'
                      : '500 DPI optical biometric simulation (for instant testing)'}
                </p>
              </>
            )}

            {scanStep === 1 && (
              <>
                <Loader2 size={46} className="mx-auto mb-2 text-[var(--amber)] animate-spin" />
                <p className="text-[0.75rem] font-semibold text-[var(--amber)]">
                  {scanMode === 'hardware'
                    ? isBn
                      ? 'বায়োমেট্রিক যাচাই হচ্ছে... অনুগ্রহ করে সেন্সর স্পর্শ করুন'
                      : 'Awaiting biometric touch on device sensor...'
                    : isBn
                      ? 'ফিঙ্গারপ্রিন্ট মিনুশিয়া বিশ্লেষণ হচ্ছে... (৯৮% কোয়ালিটি)'
                      : 'Extracting Minutiae Points... (98% Quality)'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {isBn ? 'এনক্রিপ্টেড টেমপ্লেট ডাটাবেসে সংরক্ষিত হচ্ছে' : 'Generating encrypted biometric template'}
                </p>
              </>
            )}

            {scanStep === 2 && (
              <>
                <CheckCircle2 size={46} className="mx-auto mb-2 text-[var(--green)] animate-bounce" />
                <p className="text-[0.75rem] font-semibold text-[var(--green)]">
                  {isBn ? 'বায়োমেট্রিক ফিঙ্গারপ্রিন্ট সফলভাবে নিবন্ধিত!' : 'Biometric Enrolled Successfully!'}
                </p>
                <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                  {isBn ? 'দ্বৈত টেমপ্লেট ও নিরাপত্তা কি সংরক্ষিত হয়েছে' : 'Biometric keys saved to database & attendance store'}
                </p>
              </>
            )}
          </div>

          {/* Biometric Error Alert */}
          {biometricError && (
            <div className="p-2.5 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.6875rem] flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">{biometricError}</span>
                <span className="text-[0.625rem] text-[var(--text-secondary)] block mt-0.5">
                  {isBn
                    ? 'আপনার পিসিতে ফিঙ্গারপ্রিন্ট রিডার না থাকলে উপরে "টেস্ট সিমুলেটর" নির্বাচন করুন।'
                    : 'If this PC lacks a fingerprint reader, switch to "Test Simulator" mode above.'}
                </span>
              </div>
            </div>
          )}
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
            onClick={handleStartScan}
            disabled={!isValid || scanStep === 1}
            className={`px-4 py-2 rounded-lg text-white text-[0.75rem] font-semibold cursor-pointer border-0 transition-all flex items-center gap-1.5 ${
              isValid && scanStep !== 1
                ? 'bg-[var(--amber)] hover:opacity-90 shadow-sm'
                : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
            }`}
          >
            {scanStep === 1 ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                {isBn ? 'যাচাই হচ্ছে...' : 'Verifying...'}
              </>
            ) : (
              <>
                <Fingerprint size={13} />
                {scanMode === 'hardware'
                  ? isBn
                    ? 'বায়োমেট্রিক স্ক্যান ও এনরোল'
                    : 'Scan Biometric Fingerprint'
                  : isBn
                    ? 'টেস্ট এনরোল করুন'
                    : 'Simulate & Enroll'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
