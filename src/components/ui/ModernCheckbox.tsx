import React from 'react'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  color?: 'brand' | 'teal' | 'purple' | 'red' | string
  size?: 'xs' | 'sm' | 'md'
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

function ModernCheckbox({ checked, onChange, color = 'brand', size = 'sm', onClick }: Props) {
  const colorMap: Record<string, string> = { brand: 'var(--brand)', teal: 'var(--teal)', purple: 'var(--purple)', red: 'var(--red)' }
  const c = colorMap[color] || color
  const sizeMap = { xs: 'w-4 h-4', sm: 'w-5 h-5', md: 'w-6 h-6' }
  const svgSize = size === 'xs' ? 10 : size === 'md' ? 14 : 12
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={(e) => { onClick?.(e); onChange(!checked); }}
      className={`relative ${sizeMap[size]} rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200`}
      style={{
        borderColor: checked ? c : 'var(--border)',
        background: checked ? c : 'transparent',
      }}>
      <svg width={svgSize} height={svgSize} viewBox="0 0 12 12" fill="none" className="transition-all duration-200"
        style={{ opacity: checked ? 1 : 0, transform: checked ? 'scale(1)' : 'scale(0.5)' }}>
        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default React.memo(ModernCheckbox)
