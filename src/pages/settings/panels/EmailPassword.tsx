import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'
import { Mail, Lock, KeyRound } from 'lucide-react'
import { ChangeEmailTab } from './email-password/ChangeEmailTab'
import { ChangePasswordTab } from './email-password/ChangePasswordTab'
import { ChangeLoginPathTab } from './email-password/ChangeLoginPathTab'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function EmailPasswordPanel({ isBn, onBack }: Props) {
  const { user, updateCurrentUser } = useAuth()
  const [searchParams] = useSearchParams()
  const isSuperAdmin = user?.role === 'super_admin'
  const initialTab = (searchParams.get('tab') === 'login-path' && isSuperAdmin) ? 'login-path' : 'email'
  const [activeTab, setActiveTab] = useState<'email' | 'password' | 'login-path'>(initialTab)
  const [currentEmail, setCurrentEmail] = useState(user?.email || '')

  useEffect(() => {
    if (user?.email) {
      setCurrentEmail(user.email)
    }
    if (isSuperAdmin) {
      authApi.getSuperAdmin()
        .then((data) => {
          if (data.email) setCurrentEmail(data.email)
        })
        .catch(() => {})
    }
  }, [isSuperAdmin, user?.email])

  const handleEmailUpdated = (newEmail: string) => {
    setCurrentEmail(newEmail)
    updateCurrentUser({ email: newEmail })
  }

  return (
    <SettingsPanel title="Email & Password" titleBn="ইমেইল ও পাসওয়ার্ড" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 rounded-lg text-[0.75rem] font-semibold flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${
              activeTab === 'email'
                ? 'bg-[var(--brand)] text-white shadow-sm'
                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Mail size={13} />
            <span>{isBn ? 'ইমেইল পরিবর্তন' : 'Change Email'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 rounded-lg text-[0.75rem] font-semibold flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${
              activeTab === 'password'
                ? 'bg-[var(--brand)] text-white shadow-sm'
                : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Lock size={13} />
            <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('login-path')}
              className={`flex-1 py-2 rounded-lg text-[0.75rem] font-semibold flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${
                activeTab === 'login-path'
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <KeyRound size={13} />
              <span>{isBn ? 'লগইন পাথ' : 'Login Path'}</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'email' ? (
          <ChangeEmailTab
            isBn={isBn}
            currentEmail={currentEmail}
            onEmailUpdated={handleEmailUpdated}
            isSuperAdmin={isSuperAdmin}
          />
        ) : activeTab === 'password' ? (
          <ChangePasswordTab
            isBn={isBn}
            currentEmail={currentEmail}
            isSuperAdmin={isSuperAdmin}
          />
        ) : (
          <ChangeLoginPathTab isBn={isBn} />
        )}
      </div>
    </SettingsPanel>
  )
}
