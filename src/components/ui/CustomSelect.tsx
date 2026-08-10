import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface Option {
  value: string
  label: string
  labelBn?: string
  icon?: React.ReactNode
}

interface Props {
  value: string
  options: Option[]
  onChange: (val: string) => void
  placeholder?: string
  bn?: boolean
  searchable?: boolean
}

export function CustomSelect({ value, options, onChange, placeholder, bn, searchable = true }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.labelBn && o.labelBn.includes(q)) ||
      o.value.toLowerCase().includes(q)
    )
  }, [options, search])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open, searchable])

  const handleOpen = () => {
    setOpen(!open)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30 cursor-pointer text-left"
      >
        {selected?.icon && <span className="flex-shrink-0 text-[var(--text-secondary)]">{selected.icon}</span>}
        <span className="flex-1 truncate">{selected ? (bn && selected.labelBn ? selected.labelBn : selected.label) : (placeholder || 'Select')}</span>
        <ChevronDown size={14} className={`flex-shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl shadow-black/10 overflow-hidden">
          {searchable && (
            <div className="px-3 pt-2.5 pb-1.5">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full py-2 pl-8 pr-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--brand)]"
                  placeholder={bn ? 'অনুসন্ধান...' : 'Search...'}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3.5 py-4 text-center text-[0.75rem] text-[var(--text-secondary)]">
                {bn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch('') }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[0.8125rem] cursor-pointer transition-colors text-left ${
                    opt.value === value
                      ? 'bg-[var(--brand)]/10 text-[var(--brand)] font-medium'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {opt.icon && <span className="flex-shrink-0 w-5 flex justify-center text-[var(--text-secondary)]">{opt.icon}</span>}
                  <span>{bn && opt.labelBn ? opt.labelBn : opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
