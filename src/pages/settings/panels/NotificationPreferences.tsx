import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { Bell, Mail, MessageCircle, AlertTriangle } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

interface NotificationSetting {
  key: string
  icon: typeof Bell
  label: string
  labelBn: string
  description: string
  descriptionBn: string
}

const notificationSettings: NotificationSetting[] = [
  { key: 'email', icon: Mail, label: 'Email Notifications', labelBn: 'ইমেইল নোটিফিকেশন', description: 'Receive updates via email', descriptionBn: 'ইমেইলের মাধ্যমে আপডেট পান' },
  { key: 'sms', icon: MessageCircle, label: 'SMS Notifications', labelBn: 'এসএমএস নোটিফিকেশন', description: 'Receive updates via SMS', descriptionBn: 'এসএমএসের মাধ্যমে আপডেট পান' },
  { key: 'push', icon: Bell, label: 'Push Notifications', labelBn: 'পুশ নোটিফিকেশন', description: 'Browser push notifications', descriptionBn: 'ব্রাউজার পুশ নোটিফিকেশন' },
  { key: 'security', icon: AlertTriangle, label: 'Security Alerts', labelBn: 'নিরাপত্তা সতর্কতা', description: 'Important security notifications', descriptionBn: 'গুরুত্বপূর্ণ নিরাপত্তা সতর্কতা' },
]

export function NotificationPreferencesPanel({ isBn, onBack }: Props) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)

  const notifSettings = settings.notificationPreferences || {
    email: true,
    sms: false,
    push: true,
    security: true,
  }

  const toggle = (key: string) => {
    updateSettings({
      notificationPreferences: {
        ...notifSettings,
        [key]: !notifSettings[key as keyof typeof notifSettings],
      },
    })
  }

  return (
    <SettingsPanel title="Notification Preferences" titleBn="নোটিফিকেশন পছন্দ" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'কোন নোটিফিকেশন পেতে চান তা নির্বাচন করুন।'
            : 'Choose which notifications you want to receive.'}
        </p>

        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
          {notificationSettings.map(({ key, icon: Icon, label, labelBn, description, descriptionBn }) => (
            <div
              key={key}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] last:border-b-0`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-primary)] flex-shrink-0">
                <Icon size={18} className="text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] leading-tight">
                  {isBn ? labelBn : label}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] leading-tight mt-0.5">
                  {isBn ? descriptionBn : description}
                </div>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer border-none flex-shrink-0 ${
                  notifSettings[key as keyof typeof notifSettings] ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${
                    notifSettings[key as keyof typeof notifSettings] ? 'left-[22px]' : 'left-0.5'
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
