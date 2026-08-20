import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Search, User, GraduationCap, X } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Person } from './types'

export function PersonSearchInput({
  value,
  onChange,
  placeholder,
  isBn: lang,
  people,
}: {
  value: string
  onChange: (id: string, name: string) => void
  placeholder?: string
  isBn: boolean
  people: Person[]
}) {
  const [query, setQuery] = useState(value ? people.find((p) => p.id === value)?.name || '' : '')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Person | null>(value ? people.find((p) => p.id === value) || null : null)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (highlightedIdx >= 0) {
      const el = document.getElementById(`psuggestion-${highlightedIdx}`)
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIdx])

  const debouncedQuery = useDebouncedValue(query, 200)

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return []
    const q = debouncedQuery.toLowerCase()
    return people.filter((p) => {
      if (p.name.toLowerCase().includes(q)) return true
      if (p.id.toLowerCase().includes(q)) return true
      if (p.dept) {
        const classSec = `${p.dept}-${p.section ?? ''}`
        if (classSec.toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [debouncedQuery, people])

  const select = useCallback(
    (p: Person) => {
      setSelected(p)
      setQuery(p.name)
      setOpen(false)
      setHighlightedIdx(-1)
      onChange(p.id, p.name)
    },
    [onChange]
  )

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-2">
        <Search size={13} className="text-[var(--text-muted)] shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(null)
            setOpen(true)
            onChange('', '')
            setHighlightedIdx(-1)
          }}
          onKeyDown={(e) => {
            if (!query.trim() || selected) return
            const max = Math.min(filtered.length, 15) - 1
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlightedIdx((prev) => (prev < max ? prev + 1 : 0))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlightedIdx((prev) => (prev > 0 ? prev - 1 : max))
            } else if (e.key === 'Enter' && highlightedIdx >= 0 && highlightedIdx <= max) {
              e.preventDefault()
              const p = filtered[highlightedIdx]
              if (p) select(p)
            } else if (e.key === 'Escape') {
              setHighlightedIdx(-1)
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || (lang ? 'নাম, আইডি বা সেকশন লিখুন...' : 'Type name, ID, or section...')}
          className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setSelected(null)
              onChange('', '')
            }}
            className="border-none bg-transparent cursor-pointer text-[var(--text-muted)]"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {open && query.trim() && !selected && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-[12rem] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl">
          {filtered.slice(0, 15).map((p, idx) => (
            <button
              key={p.id}
              id={`psuggestion-${idx}`}
              onClick={() => select(p)}
              onMouseEnter={() => setHighlightedIdx(idx)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer border-none ${
                idx === highlightedIdx ? 'bg-[var(--brand-light)]' : 'bg-transparent hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                {p.photo ? (
                  <img src={p.photo} alt={p.name || 'Person'} className="w-full h-full object-cover" />
                ) : p.type === 'staff' ? (
                  <User size={11} className="text-[var(--text-muted)]" />
                ) : (
                  <GraduationCap size={11} className="text-[var(--text-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">{p.name}</div>
                <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono truncate">
                  {p.id}
                  {p.type === 'student' && p.dept ? ` · ${p.dept}-${p.section ?? ''}` : ''}
                </div>
              </div>
              <span
                className={`text-[0.4375rem] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                  p.type === 'student' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--brand-light)] text-[var(--brand)]'
                }`}
              >
                {p.type === 'student' ? 'STU' : 'STAFF'}
              </span>
            </button>
          ))}
          {filtered.length > 15 && (
            <div className="px-3 py-1.5 text-center text-[0.5625rem] text-[var(--text-muted)] border-t border-[var(--border)]">
              +{filtered.length - 15} {lang ? 'আরও...' : 'more...'}
            </div>
          )}
        </div>
      )}
      {open && query.trim() && !selected && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl p-3 text-center">
          <div className="text-[0.6875rem] text-[var(--text-muted)]">{lang ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}</div>
        </div>
      )}
    </div>
  )
}
