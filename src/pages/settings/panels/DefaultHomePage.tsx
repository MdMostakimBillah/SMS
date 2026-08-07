import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { LayoutDashboard, Users, GraduationCap, BookOpen } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

const homePages = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', desc: 'Main overview page', descBn: 'প্রধান পাতা' },
  { key: 'students', icon: Users, label: 'Students', labelBn: 'ছাত্ররা', desc: 'Student management', descBn: 'ছাত্র ব্যবস্থাপনা' },
  { key: 'teachers', icon: GraduationCap, label: 'Teachers', labelBn: 'শিক্ষকরা', desc: 'Teacher management', descBn: 'শিক্ষক ব্যবস্থাপনা' },
  { key: 'classes', icon: BookOpen, label: 'Classes', labelBn: 'শ্রেণিসমূহ', desc: 'Class management', descBn: 'শ্রেণি ব্যবস্থাপনা' },
]

export function DefaultHomePagePanel({ isBn, onBack }: Props) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <SettingsPanel title="Default Home Page" titleBn="ডিফল্ট হোম পেজ" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'লগইন করার পর কোন পেজে যাবেন তা নির্বাচন করুন।'
            : 'Choose which page opens first when you log in.'}
        </p>

        <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden">
          {homePages.map(({ key, icon: Icon, label, labelBn, desc, descBn }, index) => (
            <button
              key={key}
              onClick={() => updateSettings({ defaultHomePage: key })}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors border-none ${
                settings.defaultHomePage === key
                  ? 'bg-[var(--brand-light)]'
                  : 'bg-transparent hover:bg-[var(--bg-tertiary)]'
              } ${index < homePages.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                settings.defaultHomePage === key
                  ? 'bg-[var(--brand)]/10'
                  : 'bg-[var(--bg-primary)]'
              }`}>
                <Icon size={20} className={settings.defaultHomePage === key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} />
              </div>
              <div className="flex-1">
                <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
                  {isBn ? labelBn : label}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? descBn : desc}
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                settings.defaultHomePage === key
                  ? 'border-[var(--brand)]'
                  : 'border-[var(--text-muted)]'
              }`}>
                {settings.defaultHomePage === key && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand)]" />
                )}
              </div>
            </button>
          ))}
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
