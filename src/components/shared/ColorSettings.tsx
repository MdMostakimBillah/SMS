import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { ThemeColors } from '@/store/classStore'
import { defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'

interface ColorGroup {
  label: string
  labelBn: string
  colors: { key: keyof ThemeColors; label: string; labelBn: string }[]
}

const colorGroups: ColorGroup[] = [
  {
    label: 'Brand',
    labelBn: 'ব্র্যান্ড',
    colors: [
      { key: 'brand', label: 'Primary', labelBn: 'প্রাথমিক' },
      { key: 'brand2', label: 'Secondary', labelBn: 'সেকেন্ডারি' },
      { key: 'brandLight', label: 'Light', labelBn: 'হালকা' },
    ],
  },
  {
    label: 'Background',
    labelBn: 'ব্যাকগ্রাউন্ড',
    colors: [
      { key: 'bgPrimary', label: 'Primary', labelBn: 'প্রাথমিক' },
      { key: 'bgSecondary', label: 'Secondary', labelBn: 'সেকেন্ডারি' },
      { key: 'bgTertiary', label: 'Tertiary', labelBn: 'তৃতীয়' },
      { key: 'surface', label: 'Surface', labelBn: 'সারফেস' },
      { key: 'surface2', label: 'Surface 2', labelBn: 'সারফেস ২' },
    ],
  },
  {
    label: 'Text',
    labelBn: 'টেক্সট',
    colors: [
      { key: 'textPrimary', label: 'Primary', labelBn: 'প্রাথমিক' },
      { key: 'textSecondary', label: 'Secondary', labelBn: 'সেকেন্ডারি' },
      { key: 'textMuted', label: 'Muted', labelBn: 'মিউটেড' },
    ],
  },
  {
    label: 'Border',
    labelBn: 'বর্ডার',
    colors: [
      { key: 'border', label: 'Default', labelBn: 'ডিফল্ট' },
      { key: 'border2', label: 'Strong', labelBn: 'শক্তিশালী' },
    ],
  },
  {
    label: 'Teal',
    labelBn: 'টিল',
    colors: [
      { key: 'teal', label: 'Default', labelBn: 'ডিফল্ট' },
      { key: 'tealLight', label: 'Light', labelBn: 'হালকা' },
    ],
  },
  {
    label: 'Green',
    labelBn: 'সবুজ',
    colors: [
      { key: 'green', label: 'Default', labelBn: 'ডিফল্ট' },
      { key: 'greenLight', label: 'Light', labelBn: 'হালকা' },
    ],
  },
  {
    label: 'Red',
    labelBn: 'লাল',
    colors: [
      { key: 'red', label: 'Default', labelBn: 'ডিফল্ট' },
      { key: 'redLight', label: 'Light', labelBn: 'হালকা' },
    ],
  },
  {
    label: 'Amber',
    labelBn: 'অ্যাম্বার',
    colors: [
      { key: 'amber', label: 'Default', labelBn: 'ডিফল্ট' },
      { key: 'amberLight', label: 'Light', labelBn: 'হালকা' },
    ],
  },
  {
    label: 'Purple',
    labelBn: 'বেগুনি',
    colors: [
      { key: 'purple', label: 'Default', labelBn: 'ডিফল্ট' },
      { key: 'purpleLight', label: 'Light', labelBn: 'হালকা' },
    ],
  },
  {
    label: 'Cards',
    labelBn: 'কার্ড',
    colors: [
      { key: 'cardBlue', label: 'Blue', labelBn: 'নীল' },
      { key: 'cardYellow', label: 'Yellow', labelBn: 'হলুদ' },
      { key: 'cardGreen', label: 'Green', labelBn: 'সবুজ' },
      { key: 'cardPurple', label: 'Purple', labelBn: 'বেগুনি' },
    ],
  },
]

interface Props {
  colors: ThemeColors
  onChange: (colors: ThemeColors) => void
  isBn: boolean
}

export default function ColorSettings({ colors, onChange, isBn }: Props) {
  const theme = useAppStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Brand')

  const defaults = isDark ? defaultThemeColorsDark : defaultThemeColors

  const handleChange = (key: keyof ThemeColors, value: string) => {
    onChange({ ...colors, [key]: value })
  }

  const handleResetGroup = (group: ColorGroup) => {
    const updated = { ...colors }
    group.colors.forEach((c) => {
      ;(updated as any)[c.key] = defaults[c.key]
    })
    onChange(updated)
  }

  const handleResetAll = () => {
    onChange({ ...defaults })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            {isBn ? 'থিম রঙ কাস্টমাইজ' : 'Theme Color Customization'}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            {isBn ? 'প্রতিটি রঙ পরিবর্তন করুন' : 'Change individual colors'}
          </div>
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--red)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--red-light)]"
        >
          <RotateCcw size={12} />
          {isBn ? 'সব রিসেট' : 'Reset All'}
        </button>
      </div>

      {colorGroups.map((group) => (
        <div key={group.label} className="border border-[var(--border)] rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {group.colors.slice(0, 3).map((c) => (
                  <div
                    key={c.key}
                    className="w-3.5 h-3.5 rounded-full border border-[var(--border)]"
                    style={{ background: colors[c.key] }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {isBn ? group.labelBn : group.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleResetGroup(group)
                }}
                className="text-[0.625rem] text-[var(--text-muted)] hover:text-[var(--red)] transition-colors"
                title={isBn ? 'গ্রুপ রিসেট' : 'Reset group'}
              >
                <RotateCcw size={10} />
              </button>
              <span className="text-[var(--text-muted)] text-xs">
                {expandedGroup === group.label ? '▾' : '▸'}
              </span>
            </div>
          </button>

          {expandedGroup === group.label && (
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {group.colors.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <label className="relative cursor-pointer">
                    <input
                      type="color"
                      value={colors[c.key]?.startsWith('rgba') ? '#888888' : (colors[c.key] || '#000000')}
                      onChange={(e) => handleChange(c.key, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-[var(--border)] hover:border-[var(--brand)] transition-colors shadow-sm cursor-pointer"
                      style={{ background: colors[c.key] }}
                    />
                  </label>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">
                      {isBn ? c.labelBn : c.label}
                    </div>
                    <input
                      type="text"
                      value={colors[c.key] || ''}
                      onChange={(e) => handleChange(c.key, e.target.value)}
                      className="w-full text-[0.625rem] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] focus:border-[var(--brand)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
