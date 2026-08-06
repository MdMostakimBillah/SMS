import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Shield, Copy, CheckCircle } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function AuthenticatorAppPanel({ isBn, onBack }: Props) {
  const [setup, setSetup] = useState(false)
  const [code, setCode] = useState('')
  const [verified, setVerified] = useState(false)
  const [copied, setCopied] = useState(false)
  const secret = 'JBSWY3DPEHPK3PXP'

  const handleCopy = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleVerify = () => {
    if (code.length === 6) {
      setVerified(true)
    }
  }

  if (verified) {
    return (
      <SettingsPanel title="Authenticator App" titleBn="প্রমাণীকরণ অ্যাপ" isBn={isBn} onBack={onBack}>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[var(--green)]" />
          </div>
          <h3 className="text-[1rem] font-bold text-[var(--text-primary)] mb-2">
            {isBn ? 'সক্রিয় হয়েছে!' : 'Activated!'}
          </h3>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mb-6">
            {isBn
              ? 'দুই-ফ্যাক্টর প্রমাণীকরণ সফলভাবে সক্রিয় হয়েছে।'
              : 'Two-factor authentication has been enabled.'}
          </p>
          <button
            onClick={onBack}
            className="h-10 px-6 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer"
          >
            {isBn ? 'ফিরে যান' : 'Go Back'}
          </button>
        </div>
      </SettingsPanel>
    )
  }

  return (
    <SettingsPanel title="Authenticator App" titleBn="প্রমাণীকরণ অ্যাপ" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'Google Authenticator বা Authy সংযুক্ত করুন।'
            : 'Connect Google Authenticator or Authy.'}
        </p>

        {!setup ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[var(--brand-light)] flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-[var(--brand)]" />
            </div>
            <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)] mb-2">
              {isBn ? 'দুই-ফ্যাক্টর প্রমাণীকরণ সক্রিয় করুন' : 'Enable Two-Factor Authentication'}
            </h3>
            <p className="text-[0.8125rem] text-[var(--text-muted)] mb-5">
              {isBn
                ? 'আপনার অ্যাকাউন্টে অতিরিক্ত নিরাপত্তা যোগ করুন'
                : 'Add an extra layer of security to your account'}
            </p>
            <button
              onClick={() => setSetup(true)}
              className="h-10 px-6 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer"
            >
              {isBn ? 'সেটআপ শুরু করুন' : 'Start Setup'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2">
                {isBn ? '১. এই কী কপি করুন' : '1. Copy this key'}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[0.8125rem] font-mono text-[var(--text-primary)]">
                  {secret}
                </code>
                <button
                  onClick={handleCopy}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer hover:bg-[var(--brand-light)] transition-colors"
                >
                  {copied ? <CheckCircle size={14} className="text-[var(--green)]" /> : <Copy size={14} className="text-[var(--text-muted)]" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
                {isBn ? '২. ৬-অঙ্কের কোড প্রবেশ করুন' : '2. Enter the 6-digit code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)] text-center tracking-[0.5em]"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={code.length !== 6}
              className="w-full h-10 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer disabled:opacity-50"
            >
              {isBn ? 'যাচাই করুন' : 'Verify & Enable'}
            </button>
          </div>
        )}
      </div>
    </SettingsPanel>
  )
}
