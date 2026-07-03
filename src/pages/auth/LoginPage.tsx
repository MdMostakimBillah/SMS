import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, Users, User, Shield, GraduationCap, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authApi, type AccountInfo } from '@/lib/api'

const ROLE_ICONS: Record<string, typeof User> = {
  super_admin: Shield,
  school_admin: Shield,
  teacher: GraduationCap,
  student: User,
  hr_admin: User,
}

const ROLE_COLORS: Record<string, { bg: string; fg: string }> = {
  super_admin: { bg: 'var(--purple-light)', fg: 'var(--purple)' },
  school_admin: { bg: 'var(--brand-light)', fg: 'var(--brand)' },
  teacher: { bg: 'var(--teal-light)', fg: 'var(--teal)' },
  student: { bg: 'var(--green-light)', fg: 'var(--green)' },
  hr_admin: { bg: 'var(--amber-light)', fg: 'var(--amber)' },
}

export default function LoginPage() {
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  useEffect(() => {
    if (showAccounts) {
      setLoadingAccounts(true)
      authApi.accounts()
        .then(setAccounts)
        .catch(() => setAccounts([]))
        .finally(() => setLoadingAccounts(false))
    }
  }, [showAccounts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  const selectAccount = (account: AccountInfo) => {
    setEmail(account.email)
    setShowAccounts(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--brand)] mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">EduTech SMS</h1>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-1">School Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-1">Sign in</h2>
          <p className="text-[0.75rem] text-[var(--text-muted)] mb-5">Enter your credentials to continue</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.75rem] font-medium">
              {error}
              <button onClick={clearError} className="ml-2 underline text-[0.6875rem]">dismiss</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError() }}
                placeholder="admin@school.com"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError() }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full py-2.5 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setShowAccounts(true)}
            className="w-full mt-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer flex items-center justify-center gap-2 hover:bg-[var(--border)] transition-colors"
          >
            <Users size={14} />
            View All Accounts
          </button>
        </div>
      </div>

      {/* Accounts Modal */}
      {showAccounts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">All Accounts</h3>
                <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">Click an account to login</p>
              </div>
              <button
                onClick={() => setShowAccounts(false)}
                className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
              >
                <X size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingAccounts ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-[0.8125rem]">
                  Loading accounts...
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-[0.8125rem]">
                  No accounts found. Register to create one.
                </div>
              ) : (
                accounts.map((account) => {
                  const Icon = ROLE_ICONS[account.role] || User
                  const colors = ROLE_COLORS[account.role] || { bg: 'var(--bg-secondary)', fg: 'var(--text-secondary)' }
                  return (
                    <button
                      key={account.id}
                      onClick={() => selectAccount(account)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: colors.bg }}
                      >
                        <Icon size={18} style={{ color: colors.fg }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
                          {account.name || account.email}
                        </div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] truncate">
                          {account.email}
                        </div>
                      </div>
                      <span
                        className="text-[0.5625rem] font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{ background: colors.bg, color: colors.fg }}
                      >
                        {account.role.replace('_', ' ')}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
