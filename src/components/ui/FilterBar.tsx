import { inputCls, selectCls } from '@/lib/styles'

interface FilterBarProps {
  classValue: string
  onClassChange: (v: string) => void
  sectionValue: string
  onSectionChange: (v: string) => void
  searchValue: string
  onSearchChange: (v: string) => void
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  isBn?: boolean
  placeholder?: string
  showSearch?: boolean
  disabled?: boolean
}

export function FilterBar({
  classValue,
  onClassChange,
  sectionValue,
  onSectionChange,
  searchValue,
  onSearchChange,
  classOptions,
  sectionsMap,
  isBn,
  placeholder,
  showSearch = true,
  disabled = false,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[10rem]">
        <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
          {isBn ? 'শ্রেণি' : 'Class'}
        </label>
        <select
          value={classValue}
          onChange={(e) => {
            onClassChange(e.target.value)
            onSectionChange('')
          }}
          className={selectCls + ' w-full'}
        >
          <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
          {classOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[10rem]">
        <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
          {isBn ? 'সেকশন' : 'Section'}
        </label>
        <select
          value={sectionValue}
          onChange={(e) => onSectionChange(e.target.value)}
          className={selectCls + ' w-full'}
          disabled={!classValue || disabled}
        >
          <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
          {(sectionsMap[classValue] || []).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {showSearch && (
        <div className="flex-1 min-w-[10rem]">
          <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
            {isBn ? 'অনুসন্ধান' : 'Search'}
          </label>
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={inputCls + ' w-full'}
            placeholder={placeholder || (isBn ? 'নাম, আইডি...' : 'Name, ID...')}
          />
        </div>
      )}
    </div>
  )
}
