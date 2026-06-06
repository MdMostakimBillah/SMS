import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
  showClose?: boolean
}

export function Modal({ open, onClose, title, children, maxWidth = '26.25rem', showClose = true }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--bg-primary)] rounded-[0.875rem] w-full p-5 border border-[var(--border)] max-h-[85dvh] overflow-y-auto"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between mb-4">
            {title && <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{title}</h3>}
            {showClose && (
              <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-auto">
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
