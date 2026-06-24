import React from 'react'

/** Props for the bilingual {@link FormField} component. */
interface FormFieldProps {
  /** English label text. */
  labelEn: string
  /** Bengali label text. */
  labelBn: string
  /** Current field value. */
  value: string
  /** Change handler receiving the new string value. */
  onChange: (v: string) => void
  /** Input type; renders a `<select>` when `options` is provided. */
  type?: 'text' | 'date' | 'tel' | 'email' | 'number' | 'time'
  /** Whether the field is required. */
  required?: boolean
  /** If true, displays the Bengali label. */
  isBn: boolean
  /** When provided, renders a dropdown instead of a text input. */
  options?: string[]
  /** Shows red border styling when true. */
  error?: boolean
  /** Blur event handler. */
  onBlur?: () => void
  /** Outer wrapper className override. */
  className?: string
  /** Select element className override. */
  selectClassName?: string
}

const INPUT_BASE = 'w-full py-[0.625rem] px-3 rounded-[0.5rem] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none transition-colors duration-200 box-border'
const INPUT_NORMAL = `${INPUT_BASE} border border-[var(--border)] focus:border-[var(--brand)]`
const INPUT_ERROR = `${INPUT_BASE} border border-[var(--red)] focus:border-[var(--red)]`

/**
 * Bilingual form field that renders a text input, date picker, or dropdown
 * based on props. Supports Bengali/English labels and error styling.
 */
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