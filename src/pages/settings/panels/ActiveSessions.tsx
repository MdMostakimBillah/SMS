import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Monitor, Smartphone, Tablet, Trash2, AlertTriangle } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

interface Session {
  id: string
  device: string
  browser: string
  ip: string
  lastActive: string
  current: boolean
}

const mockSessions: Session[] = [
  { id: '1', device: 'Windows PC', browser: 'Chrome 120', ip: '192.168.1.100', lastActive: '2 min ago', current: true },
  { id: '2', device: 'iPhone 15', browser: 'Safari', ip: '192.168.1.101', lastActive: '1 hour ago', current: false },
  { id: '3', device: 'MacBook Pro', browser: 'Firefox 121', ip: '10.0.0.50', lastActive: '3 days ago', current: false },
]

const getDeviceIcon = (device: string) => {
  if (device.includes('iPhone') || device.includes('Android')) return Smartphone
  if (device.includes('iPad') || device.includes('Tablet')) return Tablet
  return Monitor
}

export function ActiveSessionsPanel({ isBn, onBack }: Props) {
  const [sessions, setSessions] = useState<Session[]>(mockSessions)
  const [showRevokeAll, setShowRevokeAll] = useState(false)

  const handleRevoke = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  const handleRevokeAll = () => {
    setSessions((prev) => prev.filter((s) => s.current))
    setShowRevokeAll(false)
  }

  return (
    <SettingsPanel title="Active Sessions" titleBn="সক্রিয় সেশন" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'আপনার অ্যাকাউন্টে লগইন করা সকল ডিভাইস দেখুন।'
            : 'See all devices logged into your account.'}
        </p>

        <div className="space-y-3">
          {sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.device)
            return (
              <div
                key={session.id}
                className={`p-4 rounded-xl border transition-all ${
                  session.current
                    ? 'border-[var(--brand)]/30 bg-[var(--brand-light)]/30'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      session.current ? 'bg-[var(--brand)]/10' : 'bg-[var(--bg-primary)]'
                    }`}>
                      <DeviceIcon size={20} className={session.current ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                          {session.device}
                        </span>
                        {session.current && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[var(--brand)]/10 text-[0.5625rem] font-semibold text-[var(--brand)]">
                            {isBn ? 'বর্তমান' : 'CURRENT'}
                          </span>
                        )}
                      </div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                        {session.browser} • {session.ip}
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                        {isBn ? 'শেষ সক্রিয়' : 'Last active'}: {session.lastActive}
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => handleRevoke(session.id)}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 cursor-pointer bg-transparent border-none transition-colors"
                      title={isBn ? 'সেশন বাতিল করুন' : 'Revoke session'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {sessions.length > 1 && (
          <button
            onClick={() => setShowRevokeAll(true)}
            className="w-full h-10 rounded-xl bg-[var(--red)]/10 text-[var(--red)] text-[0.8125rem] font-semibold border border-[var(--red)]/20 cursor-pointer hover:bg-[var(--red)]/20 transition-colors"
          >
            {isBn ? 'অন্য সব সেশন বাতিল করুন' : 'Revoke All Other Sessions'}
          </button>
        )}
      </div>

      {showRevokeAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--red)]/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-[var(--red)]" />
              </div>
              <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'সব সেশন বাতিল করবেন?' : 'Revoke all sessions?'}
              </h3>
            </div>
            <p className="text-[0.8125rem] text-[var(--text-muted)] mb-6">
              {isBn
                ? 'এটি অন্য সকল ডিভাইসে লগইন বাতিল করবে।'
                : 'This will log you out from all other devices.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRevokeAll(false)}
                className="flex-1 h-10 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-semibold border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleRevokeAll}
                className="flex-1 h-10 rounded-xl bg-[var(--red)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
              >
                {isBn ? 'বাতিল করুন' : 'Revoke All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsPanel>
  )
}
