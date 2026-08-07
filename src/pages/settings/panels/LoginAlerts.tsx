import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'

interface Props {
  isBn: boolean
  onBack: () => void
}

const alerts = [
  { key: 'login' as const, label: 'Successful login', labelBn: 'সফল লগইন' },
  { key: 'failedAttempts' as const, label: 'Failed login attempts', labelBn: 'ব্যর্থ লগইন প্রচেষ্টা' },
  { key: 'passwordChange' as const, label: 'Password changed', labelBn: 'পাসওয়ার্ড পরিবর্তিত' },
  { key: 'newDevice' as const, label: 'New device login', labelBn: 'নতুন ডিভাইসে লগইন' },
]

export function LoginAlertsPanel({ isBn, onBack }: Props) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)

  const toggle = (key: keyof typeof settings.loginAlerts) => {
    updateSettings({
      loginAlerts: {
        ...settings.loginAlerts,
        [key]: !settings.loginAlerts[key],
      },
    })
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
                  settings.loginAlerts[key] ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.loginAlerts[key] ? 'translate-x-5.5' : 'translate-x-0.5'
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
