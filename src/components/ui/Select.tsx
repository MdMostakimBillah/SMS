import React, { useRef, useState, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  label?: string
  labelBn?: string
  required?: boolean
  error?: string
  isBn?: boolean
  disabled?: boolean
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  label,
  labelBn,
  required,
  error,
  isBn = false,
  disabled,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedLabel = options.find((o) => o.value === value)?.label

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const hasSearch = options.length > 7

  return (
    <div ref={selectRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {isBn ? labelBn || label : label}
          {required && <span className="text-[var(--red)] ml-0.5">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            setSearchQuery('')
          }
        }}
        className={`
          w-full h-[2.75rem] px-3.5 rounded-xl border
          flex items-center justify-between gap-2
          text-[0.8125rem] font-[inherit] text-left
          transition-all duration-200 ease-out
          ${disabled
            ? 'bg-[var(--bg-tertiary)] border-[var(--border)] opacity-50 cursor-not-allowed'
            : error
              ? 'bg-[var(--bg-secondary)] border-[var(--red)] hover:border-[var(--red)]'
              : isOpen
                ? 'bg-[var(--bg-secondary)] border-[var(--brand)] shadow-[0_0_0_3px_rgba(99,102,241,0.1)]'
                : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--border-2)] hover:shadow-[var(--shadow-sm)]'
          }
        `}
      >
        <span className={selectedLabel ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
          {selectedLabel || placeholder || (isBn ? 'বেছে নিন' : 'Select')}
        </span>
        <ChevronDown
          size={16}
          className={`
            text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {isOpen && !disabled && (
        <div
          ref={listRef}
          className="
            absolute z-50 w-full mt-1.5
            bg-[var(--bg-primary)] border border-[var(--border)]
            rounded-xl overflow-hidden
            shadow-[0_12px_36px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)]
            animate-in fade-in slide-in-from-top-1 duration-150
          "
          role="listbox"
        >
          {hasSearch && (
            <div className="p-2 border-b border-[var(--border)]">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={isBn ? 'অনুসন্ধান...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="
                    w-full pl-8 pr-3 py-2 text-[0.8125rem]
                    rounded-lg border border-[var(--border)]
                    bg-[var(--bg-secondary)] text-[var(--text-primary)]
                    outline-none focus:border-[var(--brand)]
                    transition-colors
                  "
                />
              </div>
            </div>
          )}

          <div className="max-h-[16rem] overflow-y-auto py-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'কোনো বিকল্প নেই' : 'No options found'}
                </p>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      w-full px-3.5 py-2.5 text-[0.8125rem] text-left
                      flex items-center justify-between gap-2
                      transition-colors duration-100
                      ${isSelected
                        ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                      }
                    `}
                  >
                    <span className={isSelected ? 'font-medium' : ''}>{opt.label}</span>
                    {isSelected && <Check size={14} className="text-[var(--brand)] flex-shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-[0.75rem] text-[var(--red)]">{error}</p>
      )}
    </div>
  )
}
