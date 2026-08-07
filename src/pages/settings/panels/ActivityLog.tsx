import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Activity, LogIn, LogOut, Settings, Shield, User, Download } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

interface ActivityLog {
  id: string
  action: string
  actionBn: string
  details: string
  detailsBn: string
  timestamp: string
  ip: string
  type: 'login' | 'logout' | 'settings' | 'security' | 'user' | 'export'
}

const typeIcons: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogOut,
  settings: Settings,
  security: Shield,
  user: User,
  export: Download,
}

const typeColors: Record<string, string> = {
  login: 'var(--green)',
  logout: 'var(--text-muted)',
  settings: 'var(--brand)',
  security: 'var(--amber)',
  user: 'var(--brand)',
  export: 'var(--text-muted)',
}

const mockLogs: ActivityLog[] = [
  { id: '1', action: 'Login', actionBn: 'লগইন', details: 'Chrome on Windows', detailsBn: 'Chrome ব্রাউজার, Windows', timestamp: '2 min ago', ip: '192.168.1.100', type: 'login' },
  { id: '2', action: 'Changed password', actionBn: 'পাসওয়ার্ড পরিবর্তন', details: 'Password updated successfully', detailsBn: 'পাসওয়ার্ড সফলভাবে আপডেট হয়েছে', timestamp: '1 hour ago', ip: '192.168.1.100', type: 'security' },
  { id: '3', action: 'Exported students', actionBn: 'ছাত্র ডেটা এক্সপোর্ট', details: 'Downloaded CSV file', detailsBn: 'CSV ফাইল ডাউনলোড হয়েছে', timestamp: '3 hours ago', ip: '192.168.1.100', type: 'export' },
  { id: '4', action: 'Updated settings', actionBn: 'সেটিংস আপডেট', details: 'Changed theme to dark mode', detailsBn: 'থিম গাঢ় মোডে পরিবর্তন', timestamp: 'Yesterday', ip: '192.168.1.100', type: 'settings' },
  { id: '5', action: 'Logout', actionBn: 'লগআউট', details: 'Safari on iPhone', detailsBn: 'Safari ব্রাউজার, iPhone', timestamp: '2 days ago', ip: '192.168.1.101', type: 'logout' },
]

export function ActivityLogPanel({ isBn, onBack }: Props) {
  const [logs] = useState<ActivityLog[]>(mockLogs)

  return (
    <SettingsPanel title="Activity Log" titleBn="কার্যক্রম লগ" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'আপনার অ্যাকাউন্টের সাম্প্রতিক কার্যক্রম।'
            : 'Recent activity on your account.'}
        </p>

        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--border)]" />

          <div className="space-y-4">
            {logs.map((log) => {
              const Icon = typeIcons[log.type] || Activity
              const color = typeColors[log.type] || 'var(--text-muted)'
              return (
                <div key={log.id} className="flex items-start gap-3 relative">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                    style={{ background: `${color}15`, color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
                        {isBn ? log.actionBn : log.action}
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">
                        {log.timestamp}
                      </div>
                    </div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                      {isBn ? log.detailsBn : log.details}
                    </div>
                    <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5 font-mono">
                      IP: {log.ip}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}
