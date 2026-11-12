import React, { useRef } from 'react'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  isDark?: boolean
  error?: boolean
  autoFocus?: boolean
  className?: string
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  isDark = false,
  error = false,
  autoFocus = false,
  className = '',
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, d: string) => {
    if (disabled) return
    if (d.length > 1) {
      const p = d.replace(/[^a-zA-Z0-9]/g, '').slice(0, length).toUpperCase()
      onChange(p)
      setTimeout(() => refs.current[Math.min(p.length, length - 1)]?.focus(), 0)
      return
    }
    const arr = value.split('')
    arr[i] = d.toUpperCase()
    const r = arr.join('').replace(/[^a-zA-Z0-9]/g, '').slice(0, length)
    onChange(r)
    if (d && i < length - 1) {
      setTimeout(() => refs.current[i + 1]?.focus(), 0)
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      setTimeout(() => refs.current[i - 1]?.focus(), 0)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    if (disabled) return
    const text = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').slice(0, length).toUpperCase()
    onChange(text)
    setTimeout(() => refs.current[Math.min(text.length, length - 1)]?.focus(), 0)
  }

  return (
    <div className={`flex gap-1.5 sm:gap-2 justify-center ${className}`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          className={`w-9 h-11 sm:w-11 sm:h-12 text-center text-[1.125rem] font-bold rounded-xl border outline-none uppercase transition-all ${
            disabled
              ? 'opacity-40 cursor-not-allowed bg-[var(--bg-tertiary)] border-[var(--border)]'
              : error
              ? 'border-[var(--red)] bg-red-500/5 text-[var(--red)] focus:border-[var(--red)]'
              : value[i]
              ? 'border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]'
              : isDark
              ? 'border-white/15 bg-white/5 text-white focus:border-[var(--brand)]'
              : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-[var(--brand)]'
          }`}
        />
      ))}
    </div>
  )
}
