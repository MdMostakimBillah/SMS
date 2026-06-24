import React from 'react'

interface FormFieldProps {
  labelEn: string
  labelBn: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'date' | 'tel' | 'email' | 'number' | 'time'
  required?: boolean
  isBn: boolean
  options?: string[]
  error?: boolean
  onBlur?: () => void
  className?: string
  selectClassName?: string
}

const INPUT_BASE = 'w-full py-[0.625rem] px-3 rounded-[0.5rem] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none transition-colors duration-200 box-border'
const INPUT_NORMAL = `${INPUT_BASE} border border-[var(--border)] focus:border-[var(--brand)]`
const INPUT_ERROR = `${INPUT_BASE} border border-[var(--red)] focus:border-[var(--red)]`

export const FormField: React.FC<FormFieldProps> = ({
  labelEn,
  labelBn,
  value,
  onChange,
  type = 'text',
  required = false,
  isBn,
  options,
  error,
  onBlur,
  className,
  selectClassName,
}) => {
  const inputCls = error ? INPUT_ERROR : INPUT_NORMAL
  const selectCls = selectClassName || (error ? INPUT_ERROR : INPUT_NORMAL)

  const label = (
    <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
      {isBn ? labelBn : labelEn}{required && <span className="text-[var(--red)] ml-0.5">*</span>}
    </label>
  )

  if (options && options.length > 0) {
    return (
      <div className={className || 'mb-[0.625rem]'}>
        {label}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          required={required}
          className={selectCls}
        >
          <option value="">{isBn ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'date') {
    return (
      <div className={className || 'mb-[0.625rem]'}>
        {label}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          required={required}
          className={inputCls}
        />
      </div>
    )
  }

  return (
    <div className={className || 'mb-[0.625rem]'}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        className={inputCls}
      />
    </div>
  )
}