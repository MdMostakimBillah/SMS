import { useState } from 'react'
import { RotateCcw, Palette, Check } from 'lucide-react'
import type { ThemeColors } from '@/store/classStore'
import { defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'
import { applyThemeColors } from '@/hooks/useThemeColors'

interface Preset {
  name: string
  nameBn: string
  brand: string
  brand2: string
  brandLight: string
  brandLightDark: string
}

const presets: Preset[] = [
  { name: 'Indigo', nameBn: 'ইন্ডিগো', brand: '#6366f1', brand2: '#818cf8', brandLight: '#eef2ff', brandLightDark: 'rgba(129,140,248,0.1)' },
  { name: 'Blue', nameBn: 'নীল', brand: '#3b82f6', brand2: '#60a5fa', brandLight: '#eff6ff', brandLightDark: 'rgba(96,165,250,0.1)' },
  { name: 'Cyan', nameBn: 'সায়ান', brand: '#06b6d4', brand2: '#22d3ee', brandLight: '#ecfeff', brandLightDark: 'rgba(34,211,238,0.1)' },
  { name: 'Teal', nameBn: 'টিল', brand: '#14b8a6', brand2: '#2dd4bf', brandLight: '#f0fdfa', brandLightDark: 'rgba(45,212,191,0.1)' },
  { name: 'Emerald', nameBn: 'পান্না', brand: '#10b981', brand2: '#34d399', brandLight: '#ecfdf5', brandLightDark: 'rgba(52,211,153,0.1)' },
  { name: 'Green', nameBn: 'সবুজ', brand: '#22c55e', brand2: '#4ade80', brandLight: '#f0fdf4', brandLightDark: 'rgba(74,222,128,0.1)' },
  { name: 'Amber', nameBn: 'অ্যাম্বার', brand: '#f59e0b', brand2: '#fbbf24', brandLight: '#fffbeb', brandLightDark: 'rgba(251,191,36,0.1)' },
  { name: 'Orange', nameBn: 'কমলা', brand: '#f97316', brand2: '#fb923c', brandLight: '#fff7ed', brandLightDark: 'rgba(251,146,60,0.1)' },
  { name: 'Rose', nameBn: 'গোলাপি', brand: '#f43f5e', brand2: '#fb7185', brandLight: '#fff1f2', brandLightDark: 'rgba(251,113,133,0.1)' },
  { name: 'Pink', nameBn: 'গোলাপ', brand: '#ec4899', brand2: '#f472b6', brandLight: '#fdf2f8', brandLightDark: 'rgba(244,114,182,0.1)' },
  { name: 'Purple', nameBn: 'বেগুনি', brand: '#a855f7', brand2: '#c084fc', brandLight: '#faf5ff', brandLightDark: 'rgba(192,132,252,0.1)' },
  { name: 'Violet', nameBn: 'ভায়োলেট', brand: '#8b5cf6', brand2: '#a78bfa', brandLight: '#f5f3ff', brandLightDark: 'rgba(167,139,250,0.1)' },
]

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
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  const defaults = isDark ? defaultThemeColorsDark : defaultThemeColors

  const activePreset = presets.find(
    (p) => p.brand === colors.brand && p.brand2 === colors.brand2
  )

  const handlePresetClick = (preset: Preset) => {
    const brandLight = isDark ? preset.brandLightDark : preset.brandLight
    const updated = { ...colors, brand: preset.brand, brand2: preset.brand2, brandLight }
    onChange(updated)
    applyThemeColors(updated)
  }

  const handleChange = (key: keyof ThemeColors, value: string) => {
    const updated = { ...colors, [key]: value }
    onChange(updated)
    applyThemeColors(updated)
  }

  const handleResetGroup = (group: ColorGroup) => {
    const updated = { ...colors }
    group.colors.forEach((c) => {
      ;(updated as any)[c.key] = defaults[c.key]
    })
    onChange(updated)
    applyThemeColors(updated)
  }

  const handleResetAll = () => {
    const reset = { ...defaults }
    onChange(reset)
    applyThemeColors(reset)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
            <Palette size={18} className="text-[var(--brand)]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'থিম রঙ কাস্টমাইজ' : 'Theme Color Customization'}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              {isBn ? 'প্রিসেট বেছে নিন বা আলাদাভাবে রঙ পরিবর্তন করুন' : 'Pick a preset or customize individually'}
            </div>
          </div>
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--red)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--red-light)]"
        >
          <RotateCcw size={12} />
          {isBn ? 'রিসেট' : 'Reset'}
        </button>
      </div>

      {/* Presets */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
          <div className="text-xs font-semibold text-[var(--text-primary)]">
            {isBn ? 'অ্যাকসেন্ট রঙ বাছাই করুন' : 'Pick Accent Color'}
          </div>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {presets.map((p) => {
              const isActive = activePreset?.name === p.name
              return (
                <button
                  key={p.name}
                  onClick={() => handlePresetClick(p)}
                  className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-[var(--brand)] bg-[var(--brand-light)]'
                      : 'border-transparent hover:border-[var(--border)] bg-[var(--bg-secondary)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm"
                      style={{ background: p.brand }}
                    />
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--brand)] flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-[0.625rem] font-medium text-[var(--text-secondary)]">
                    {isBn ? p.nameBn : p.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Advanced color groups */}
      {colorGroups.map((group) => (
        <div key={group.label} className="border border-[var(--border)] rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5">
                {group.colors.slice(0, 3).map((c) => (
                  <div
                    key={c.key}
                    className="w-4 h-4 rounded-full border-2 border-[var(--bg-secondary)]"
                    style={{ background: colors[c.key] }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {isBn ? group.labelBn : group.label}
              </span>
              <span className="text-[0.625rem] text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded-md">
                {group.colors.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleResetGroup(group)
                }}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red-light)] transition-colors"
                title={isBn ? 'গ্রুপ রিসেট' : 'Reset group'}
              >
                <RotateCcw size={12} />
              </button>
              <span className="text-[var(--text-muted)] text-xs">
                {expandedGroup === group.label ? '▾' : '▸'}
              </span>
            </div>
          </button>

          {expandedGroup === group.label && (
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.colors.map((c) => (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="text-[0.6875rem] font-medium text-[var(--text-secondary)] w-20 shrink-0">
                    {isBn ? c.labelBn : c.label}
                  </span>
                  <label className="relative cursor-pointer shrink-0 group/picker">
                    <input
                      type="color"
                      value={colors[c.key]?.startsWith('rgba') ? '#888888' : (colors[c.key] || '#000000')}
                      onChange={(e) => handleChange(c.key, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-[var(--border)] group-hover/picker:border-[var(--brand)] transition-all shadow-sm cursor-pointer"
                      style={{ background: colors[c.key] }}
                    />
                  </label>
                  <input
                    type="text"
                    value={colors[c.key] || ''}
                    onChange={(e) => handleChange(c.key, e.target.value)}
                    className="flex-1 min-w-0 text-xs font-mono px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand-light)] focus:outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
