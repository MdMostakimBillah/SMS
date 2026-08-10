import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

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
}

export function CustomSelect({ value, options, onChange, placeholder, bn }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30 cursor-pointer text-left"
      >
        {selected?.icon && <span className="flex-shrink-0 text-[var(--text-secondary)]">{selected.icon}</span>}
        <span className="flex-1 truncate">{selected ? (bn && selected.labelBn ? selected.labelBn : selected.label) : (placeholder || 'Select')}</span>
        <ChevronDown size={14} className={`flex-shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl shadow-black/10 py-1.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[0.8125rem] cursor-pointer transition-colors text-left ${
                opt.value === value
                  ? 'bg-[var(--brand)]/10 text-[var(--brand)] font-medium'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {opt.icon && <span className="flex-shrink-0 w-5 flex justify-center text-[var(--text-secondary)]">{opt.icon}</span>}
              <span>{bn && opt.labelBn ? opt.labelBn : opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
