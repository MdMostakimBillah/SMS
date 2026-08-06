import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'

interface Props {
  isBn: boolean
  onBack: () => void
}

const alerts = [
  { key: 'login_new_device', label: 'New device login', labelBn: 'নতুন ডিভাইসে লগইন' },
  { key: 'login_from_new_location', label: 'Login from new location', labelBn: 'নতুন স্থান থেকে লগইন' },
  { key: 'password_changed', label: 'Password changed', labelBn: 'পাসওয়ার্ড পরিবর্তিত' },
  { key: 'email_changed', label: 'Email changed', labelBn: 'ইমেইল পরিবর্তিত' },
]

export function LoginAlertsPanel({ isBn, onBack }: Props) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    login_new_device: true,
    login_from_new_location: true,
    password_changed: true,
    email_changed: false,
  })

  const toggle = (key: string) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <SettingsPanel title="Login Alerts" titleBn="লগইন সতর্কতা" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'আপনার অ্যাক্সেস করা হলে সতর্কতা পান।'
            : 'Get notified whenever your account is accessed.'}
        </p>

        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
          {alerts.map(({ key, label, labelBn }) => (
            <div key={key} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[0.8125rem] text-[var(--text-primary)]">
                {isBn ? labelBn : label}
              </span>
              <button
                onClick={() => toggle(key)}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${
                  enabled[key] ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    enabled[key] ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </SettingsPanel>
  )
}
