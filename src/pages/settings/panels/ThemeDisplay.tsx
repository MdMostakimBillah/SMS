import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { Sun, Moon, Monitor } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

const themes = [
  { key: 'light', icon: Sun, label: 'Light', labelBn: 'হালকা' },
  { key: 'dark', icon: Moon, label: 'Dark', labelBn: 'গাঢ়' },
  { key: 'system', icon: Monitor, label: 'System', labelBn: 'সিস্টেম' },
]

const densities = [
  { key: 'compact', label: 'Compact', labelBn: 'সংক্ষিপ্ত', desc: 'Smaller spacing', descBn: 'ছোট স্পেসিং' },
  { key: 'default', label: 'Default', labelBn: 'ডিফল্ট', desc: 'Balanced spacing', descBn: 'সুষম স্পেসিং' },
  { key: 'comfortable', label: 'Comfortable', labelBn: 'আরামদায়ক', desc: 'Larger spacing', descBn: 'বড় স্পেসিং' },
]

export function ThemeDisplayPanel({ isBn, onBack }: Props) {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [density, setDensity] = useState(settings.density)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings({ density })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsPanel title="Theme & Display" titleBn="থিম ও প্রদর্শন" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'থিম' : 'Theme'}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ key, icon: Icon, label, labelBn }) => (
              <button
                key={key}
                onClick={() => setTheme(key as 'light' | 'dark' | 'system')}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-[0.8125rem] font-medium cursor-pointer transition-all ${
                  theme === key
                    ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)]/30'
                }`}
              >
                <Icon size={20} />
                {isBn ? labelBn : label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'কনটেন্ট ঘনত্ব' : 'Content Density'}
          </label>
          <div className="space-y-2">
            {densities.map(({ key, label, labelBn, desc, descBn }) => (
              <button
                key={key}
                onClick={() => setDensity(key as 'compact' | 'default' | 'comfortable')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left cursor-pointer transition-all ${
                  density === key
                    ? 'border-[var(--brand)] bg-[var(--brand-light)]'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/30'
                }`}
              >
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? labelBn : label}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {isBn ? descBn : desc}
                  </div>
                </div>
                {density === key && (
                  <div className="w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
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
