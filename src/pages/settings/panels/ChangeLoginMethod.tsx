import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { Key, Fingerprint } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

const methods = [
  { key: 'password' as const, icon: Key, label: 'Password', labelBn: 'পাসওয়ার্ড', desc: 'Traditional password login', descBn: 'ঐতিহ্যবাহী পাসওয়ার্ড লগইন' },
  { key: 'passkey' as const, icon: Fingerprint, label: 'Passkey', labelBn: 'পাসকি', desc: 'Biometric or security key', descBn: 'বায়োমেট্রিক বা সিকিউরিটি কী' },
]

export function ChangeLoginMethodPanel({ isBn, onBack }: Props) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsPanel title="Change Login Method" titleBn="লগইন পদ্ধতি পরিবর্তন" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'পাসওয়ার্ড বা পাসকির মধ্যে পরিবর্তন করুন।'
            : 'Switch between password or passkey login.'}
        </p>

        <div className="space-y-2">
          {methods.map(({ key, icon: Icon, label, labelBn, desc, descBn }) => (
            <button
              key={key}
              onClick={() => updateSettings({ loginMethod: key })}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-left cursor-pointer transition-all ${
                settings.loginMethod === key
                  ? 'border-[var(--brand)] bg-[var(--brand-light)]'
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                settings.loginMethod === key ? 'bg-[var(--brand)]/10' : 'bg-[var(--bg-primary)]'
              }`}>
                <Icon size={20} className={settings.loginMethod === key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} />
              </div>
              <div className="flex-1">
                <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? labelBn : label}
                </div>
                <div className="text-[0.75rem] text-[var(--text-muted)]">
                  {isBn ? descBn : desc}
                </div>
              </div>
              {settings.loginMethod === key && (
                <div className="w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full h-10 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            {saved ? (isBn ? 'সংরক্ষিত!' : 'Saved!') : (isBn ? 'পরিবর্তন করুন' : 'Change Method')}
          </button>
        </div>
      </div>
    </SettingsPanel>
  )
}
