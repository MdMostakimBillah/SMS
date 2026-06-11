import React, { useRef, useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

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

const ChevronDownIcon = () => <ChevronDown size={16} className="text-[var(--text-muted)]" />
const ChevronUpIcon = () => <ChevronUp size={16} className="text-[var(--text-muted)]" />

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
    const selectRef = useRef<HTMLDivElement>(null)
    const optionsRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelect = (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    return (
      <div ref={selectRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
        {label && (
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-[0.375rem] block">
            {isBn ? labelBn : label}
            {required && <span className="text-[var(--red)] ml-[0.1875rem]">*</span>}
          </label>
        )}

        <div
          className={`
            w-full h-[2.5rem] px-3.5 rounded-[0.5625rem] border transition-colors
            bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem]
            flex items-center justify-between cursor-pointer
            ${disabled
              ? 'border-[var(--border)] opacity-50 cursor-not-allowed'
              : 'border-[var(--border)] focus-within:border-[var(--brand)] hover:border-[var(--border-2)]'
            }
            ${error ? 'border-[var(--red)] focus-within:border-[var(--red)]' : ''}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
            {value ? options.find((o) => o.value === value)?.label : placeholder || (isBn ? 'বেছে নিন' : 'Select')}
          </span>
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>

        {isOpen && !disabled && (
          <div
            className="absolute z-50 w-full mt-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.5625rem] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
            ref={optionsRef}
            role="listbox"
          >
            {options.length > 7 && (
              <div className="p-2 border-b border-[var(--border)]">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={isBn ? 'অনুসন্ধান...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1.5 text-[0.75rem] rounded-[0.375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                  autoFocus
                />
              </div>
            )}
            <ul className="max-h-[14rem] overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <li className="px-3.5 py-2 text-[0.8125rem] text-[var(--text-muted)] text-center">
                  {isBn ? 'কোনো বিকল্প নেই' : 'No options found'}
                </li>
              ) : (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={value === opt.value}
                    className={`
                      px-3.5 py-2 text-[0.8125rem] cursor-pointer transition-colors
                      ${value === opt.value
                        ? 'bg-[var(--brand-light)] text-[var(--brand)] font-medium'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                      }
                    `}
                    onClick={() => handleSelect(opt.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {opt.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {error && <p className="mt-1 text-[0.6875rem] text-[var(--red)]">{error}</p>}
      </div>
    )
  }