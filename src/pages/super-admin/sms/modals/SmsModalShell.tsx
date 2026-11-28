import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  icon: React.ReactNode
  iconBgClass?: string
  titleId: string
  onClose: () => void
  closeLabel: string
  children: React.ReactNode
}

export const SmsModalShell = React.memo(function SmsModalShell({
  open,
  title,
  icon,
  iconBgClass = 'bg-cyan-500/10 text-cyan-500',
  titleId,
  onClose,
  closeLabel,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open && containerRef.current) {
      const firstInput = containerRef.current.querySelector<HTMLElement>('select, input, textarea, button')
      firstInput?.focus()
    }
  }, [open])

  const handleTrap = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const list = e.currentTarget.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!list.length) return
    const first = list[0]
    const last = list[list.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={containerRef}
        onKeyDown={handleTrap}
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl max-w-lg w-full p-6 border border-[var(--border)] shadow-2xl space-y-4 my-auto relative z-10 animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-primary, #1e1e2d)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBgClass}`}>{icon}</div>
            <h3 id={titleId} className="text-[1rem] font-bold text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="w-8 h-8 rounded-lg hover:bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer transition-colors"
            title={closeLabel}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
})
