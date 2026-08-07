import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { LayoutDashboard, Users, GraduationCap, BookOpen } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

const homePages = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', labelBn: 'ড্যাশবোর্ড' },
  { key: 'students', icon: Users, label: 'Students', labelBn: 'ছাত্ররা' },
  { key: 'teachers', icon: GraduationCap, label: 'Teachers', labelBn: 'শিক্ষকরা' },
  { key: 'classes', icon: BookOpen, label: 'Classes', labelBn: 'শ্রেণিসমূহ' },
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

        <div className="grid grid-cols-2 gap-2">
          {homePages.map(({ key, icon: Icon, label, labelBn }) => (
            <button
              key={key}
              onClick={() => updateSettings({ defaultHomePage: key })}
              className={`flex flex-col items-center gap-2 px-4 py-5 rounded-xl border text-[0.8125rem] font-medium cursor-pointer transition-all ${
                settings.defaultHomePage === key
                  ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]'
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)]/30'
              }`}
            >
              <Icon size={22} />
              {isBn ? labelBn : label}
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
