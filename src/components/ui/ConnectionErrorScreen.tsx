import { WifiOff, RefreshCw, LogIn } from 'lucide-react'
import { BrandLogo } from './BrandLogo'

interface ConnectionErrorScreenProps {
  /** Re-runs the server session check. */
  onRetry: () => void
  /** Navigates to sign-in (falls back to '/'). */
  onSignIn: () => void
}

/**
 * Shown when the initial `/api/auth/me` check failed for a NON-401 reason
 * (server unreachable / timeout / 5xx). Distinct from "not signed in":
 * we cannot know whether a session exists, so we never silently redirect to
 * the login page (which would imply the session ended) and never fall back
 * to cached localStorage identity.
 */
export function ConnectionErrorScreen({ onRetry, onSignIn }: ConnectionErrorScreenProps) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: 'var(--bg-primary)' }}
      role="alertdialog"
      aria-live="polite"
    >
      <BrandLogo size={64} />
      <div className="flex items-center gap-2 text-[var(--red)]">
        <WifiOff size={18} />
        <span className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
          সার্ভারে সংযোগ করা যায়নি
        </span>
      </div>
      <p className="text-[0.8125rem] text-[var(--text-secondary)] max-w-[22rem] leading-relaxed">
        Couldn&apos;t reach the server to verify your session. Your session has not been cleared —
        check your connection and try again.
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brand)] border-0 text-white text-[0.8125rem] font-medium cursor-pointer"
        >
          <RefreshCw size={14} />
          আবার চেষ্টা করুন / Try again
        </button>
        <button
          onClick={onSignIn}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer"
        >
          <LogIn size={14} />
          সাইন ইন / Sign in
        </button>
      </div>
    </div>
  )
}
