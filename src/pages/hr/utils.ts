export { toBnNum, getInitials, getAvatarGradient } from '@/lib/i18n'

export const sectionCls = (isMobile: boolean) =>
  `bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl ${isMobile ? 'p-[0.875rem]' : 'p-4'} mb-3.5 overflow-hidden`

export const sectionTitleCls =
  'text-sm font-semibold text-[var(--text-primary)] mb-3.5 pb-2 border-b border-[var(--border)] flex items-center gap-2'

export const inputCls =
  'w-full py-[0.5625rem] px-[0.6875rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none'

export const labelCls = 'text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem] block'

export const modalOverlayCls = 'modal-overlay'

export const modalStyleCls = 'modal-box modal-content'
