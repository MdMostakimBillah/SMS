import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, X } from 'lucide-react'
import { useUpdateStore } from '@/store/updateStore'

export function UpdateToast() {
  const { isUpdateAvailable, dismiss, checkForUpdate, startPeriodicCheck, stopPeriodicCheck } = useUpdateStore()

  useEffect(() => {
    checkForUpdate()
    startPeriodicCheck()
    return () => stopPeriodicCheck()
  }, [checkForUpdate, startPeriodicCheck, stopPeriodicCheck])

  if (!isUpdateAvailable) return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[99999] [animation:slideInRight_0.3s_ease-out]">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-2xl shadow-black/10 max-w-xs">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)] shrink-0">
          <RefreshCw size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            Update available
          </p>
          <p className="text-[0.6875rem] text-[var(--text-muted)]">
            New version ready
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.75rem] font-semibold cursor-pointer hover:opacity-90 transition-opacity shrink-0"
        >
          Reload
        </button>
        <button
          onClick={dismiss}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    </div>,
    document.body
  )
}
