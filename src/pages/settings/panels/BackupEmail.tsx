import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { Mail, CheckCircle } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function BackupEmailPanel({ isBn, onBack }: Props) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [email, setEmail] = useState(settings.backupEmail)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!email) return
    updateSettings({ backupEmail: email })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsPanel title="Backup Email" titleBn="ব্যাকআপ ইমেইল" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'ব্যাকআপ ইমেইল ঠিকানার মাধ্যমে পুনরুদ্ধার লিংক পান।'
            : 'Receive recovery links via a backup address.'}
        </p>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
            <Mail size={12} />
            {isBn ? 'ব্যাকআপ ইমেইল' : 'Backup Email'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="backup@example.com"
            className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!email}
          className="w-full h-10 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-white transition-all"
          style={{ background: saved ? 'var(--green)' : 'var(--brand)' }}
        >
          {saved ? (
            <><CheckCircle size={14} />{isBn ? 'সংরক্ষিত!' : 'Saved!'}</>
          ) : (
            isBn ? 'সংরক্ষণ করুন' : 'Save Changes'
          )}
        </button>
      </div>
    </SettingsPanel>
  )
}
