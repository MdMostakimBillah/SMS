import React from 'react'
import { CheckSquare, Square } from 'lucide-react'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  color?: 'brand' | 'teal' | 'purple' | 'red' | string
  size?: 'xs' | 'sm' | 'md'
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

const SIZE_MAP = { xs: 14, sm: 16, md: 18 }
const COLOR_MAP: Record<string, string> = {
  brand: 'var(--brand)',
  teal: 'var(--teal)',
  purple: 'var(--purple)',
  red: 'var(--red)',
}

function ModernCheckbox({ checked, onChange, color = 'brand', size = 'sm', onClick }: Props) {
  const px = SIZE_MAP[size]
  const fillColor = COLOR_MAP[color] || color

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => { onClick?.(e); onChange(!checked) }}
      className="cursor-pointer flex items-center justify-center shrink-0"
    >
      {checked ? (
        <CheckSquare size={px} style={{ color: fillColor }} />
      ) : (
        <Square size={px} className="text-[var(--text-muted)]" />
      )}
    </button>
  )
}

export default React.memo(ModernCheckbox)
