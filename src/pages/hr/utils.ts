export function toBnNum(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).replace(/\d/g, (d) => bn[+d])
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const avatarGradients = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #22c55e, #16a34a)',
  'linear-gradient(135deg, #a855f7, #9333ea)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #3b82f6, #2563eb)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
]

export function getAvatarGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i)
  return avatarGradients[Math.abs(hash) % avatarGradients.length]
}

export const sectionCls = (isMobile: boolean) =>
  `bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl ${isMobile ? 'p-[14px]' : 'p-4'} mb-3.5 overflow-hidden`

export const sectionTitleCls =
  'text-sm font-semibold text-[var(--text-primary)] mb-3.5 pb-2 border-b border-[var(--border)] flex items-center gap-2'

export const inputCls =
  'w-full py-[9px] px-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none'

export const labelCls = 'text-[11px] font-medium text-[var(--text-secondary)] mb-[5px] block'

export const modalOverlayCls =
  'fixed top-0 left-0 right-0 h-[100dvh] z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto'

export const modalStyleCls =
  'bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-5 w-full max-w-[460px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.12)]'
