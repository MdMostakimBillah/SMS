import React from 'react'

interface EFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  opts?: string[]
}
export const EField = React.memo(function EField({ label, value, onChange, type = 'text', opts }: EFieldProps) {
  const inputClass = 'w-full h-[2.75rem] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] hover:border-[var(--border-2)] hover:shadow-[var(--shadow-sm)] transition-all duration-200'

  if (opts) {
    return (
      <div>
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">-- Select --</option>
          {opts.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'date') {
    return (
      <div>
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {label}
        </label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </div>
    )
  }

  return (
    <div>
      <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  )
})
