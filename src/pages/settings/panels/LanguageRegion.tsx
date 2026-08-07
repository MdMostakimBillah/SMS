import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'

interface Props {
  isBn: boolean
  onBack: () => void
}

const languages = [
  { code: 'en', label: 'English', labelBn: 'ইংরেজি', desc: 'English language', descBn: 'ইংরেজি ভাষা' },
  { code: 'bn', label: 'Bengali', labelBn: 'বাংলা', desc: 'Bangla language', descBn: 'বাংলা ভাষা' },
]

const timezones = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:30', 'UTC-09:00',
  'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00',
  'UTC-03:00', 'UTC-02:00', 'UTC-01:00', 'UTC+00:00', 'UTC+01:00',
  'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00', 'UTC+05:30',
  'UTC+06:00', 'UTC+06:30', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00',
]

export function LanguageRegionPanel({ isBn, onBack }: Props) {
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [timezone, setTimezone] = useState(settings.timezone)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings({ timezone })
    setLanguage(language)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsPanel title="Language & Region" titleBn="ভাষা ও অঞ্চল" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'ভাষা' : 'Language'}
          </label>
          <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden">
            {languages.map(({ code, label, labelBn, desc, descBn }) => (
              <button
                key={code}
                onClick={() => setLanguage(code as 'en' | 'bn')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors border-none border-b border-[var(--border)] last:border-b-0 ${
                  language === code
                    ? 'bg-[var(--brand-light)]'
                    : 'bg-transparent hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] leading-tight">
                    {isBn ? labelBn : label}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] leading-tight mt-0.5">
                    {isBn ? descBn : desc}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  language === code
                    ? 'border-[var(--brand)]'
                    : 'border-[var(--text-muted)]'
                }`}>
                  {language === code && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand)]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'টাইমজোন' : 'Timezone'}
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full h-10 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            {saved ? (isBn ? 'সংরক্ষিত!' : 'Saved!') : (isBn ? 'সংরক্ষণ করুন' : 'Save Changes')}
          </button>
        </div>
      </div>
    </SettingsPanel>
  )
}
