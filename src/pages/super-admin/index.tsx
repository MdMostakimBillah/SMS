import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  Crown, Building2, Users, Mail, Lock, Eye, EyeOff,
  CheckCircle, AlertTriangle, Plus, Database, CreditCard, MessageSquare, FileText, Globe,
  Bell,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useAuth } from '@/contexts/AuthContext'
import { useCardReveal } from '@/hooks/useCardReveal'
import { getAdminCredentials, isDefaultCredentials } from '@/lib/adminAuth'
import { SUPER_ADMIN_ROUTES, SUPER_ADMIN_PATH_MAP, SUPER_ADMIN_REVERSE_MAP } from '@/lib/superAdminRoutes'
import { Placeholder } from '@/components/shared/Placeholder'

const iconMap: Record<string, React.ReactNode> = {
  lock: <Lock size={20} />,
  'building-2': <Building2 size={20} />,
  users: <Users size={20} />,
  'credit-card': <CreditCard size={20} />,
  'message-square': <MessageSquare size={20} />,
  database: <Database size={20} />,
  crown: <Plus size={20} />,
  bell: <Bell size={20} />,
  globe: <Globe size={20} />,
  'file-text': <FileText size={20} />,
}

const iconMapLg: Record<string, React.ReactNode> = {
  lock: <Lock size={28} />,
  'building-2': <Building2 size={28} />,
  users: <Users size={28} />,
  'credit-card': <CreditCard size={28} />,
  'message-square': <MessageSquare size={28} />,
  database: <Database size={28} />,
  crown: <Plus size={28} />,
  bell: <Bell size={28} />,
  globe: <Globe size={28} />,
  'file-text': <FileText size={28} />,
}

export default function SuperAdminPage() {
  const isBn = useBn()
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useCardReveal([location.pathname])
  const { user } = useAuth()

  const currentPage = SUPER_ADMIN_PATH_MAP[location.pathname] || 'home'

  if (user && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />
  }

  const goTo = (id: string) => navigate(SUPER_ADMIN_REVERSE_MAP[id])

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-5">
      {currentPage !== 'home' && (
        <button onClick={() => goTo('home')}
          className="anim-card flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
      )}

      {currentPage === 'home' && (
        <>
          <div className="anim-card relative overflow-hidden rounded-3xl p-6" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm">
                <Crown size={26} className="text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-[1.25rem] font-bold text-white">{isBn ? 'সুপার অ্যাডমিন' : 'Super Admin'}</h1>
                <p className="text-[0.8125rem] text-white/60 mt-0.5">{getAdminCredentials().email}</p>
              </div>
              {isDefaultCredentials() && (
                <span className="px-3 py-1.5 rounded-full text-[0.6875rem] font-semibold bg-amber-400/20 text-amber-300 backdrop-blur-sm">
                  {isBn ? 'ডিফল্ট পাসওয়ার্ড' : 'Default Password'}
                </span>
              )}
            </div>
          </div>

          <div className="anim-card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SUPER_ADMIN_ROUTES.map((a) => (
              <button key={a.id} onClick={() => goTo(a.id)}
                className="group relative p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] cursor-pointer text-left hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
                {!a.functional && (
                  <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[0.5rem] font-semibold bg-[var(--bg-secondary)] text-[var(--text-muted)] uppercase">
                    {isBn ? 'শীঘ্রই' : 'Soon'}
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  style={{ background: `${a.color}12`, color: a.color }}>
                  {iconMap[a.icon]}
                </div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] mb-0.5 leading-tight">{isBn ? a.labelBn : a.label}</div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] leading-snug">{isBn ? a.descBn : a.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {currentPage === 'account' && <AccountSettings isBn={isBn} />}

      {currentPage !== 'home' && currentPage !== 'account' && (() => {
        const route = SUPER_ADMIN_ROUTES.find((r) => r.id === currentPage)
        if (!route) return null
        return <Placeholder title={isBn ? route.labelBn : route.label} icon={iconMapLg[route.icon]} color={route.color} isBn={isBn} />
      })()}
    </div>
  )
}

function AccountSettings({ isBn }: { isBn: boolean }) {
  const creds = getAdminCredentials()
  const isDefault = isDefaultCredentials()
  const [showPw, setShowPw] = useState(false)

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="anim-card bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#6366f115', color: '#6366f1' }}>
            <Mail size={17} />
          </div>
          <div>
            <h2 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'সুপার অ্যাডমিন ইমেইল' : 'Super Admin Email'}</h2>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? '.env ফাইল থেকে পড়া হচ্ছে' : 'Read from .env file'}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
              <Mail size={16} className="text-[var(--brand)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.6875rem] text-[var(--text-muted)] mb-0.5">{isBn ? 'ইমেইল' : 'Email'}</div>
              <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)] truncate">{creds.email}</div>
            </div>
            <CheckCircle size={18} className="text-[var(--green)] shrink-0" />
          </div>

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <div className="flex items-start gap-3">
              <FileText size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="text-[0.75rem] text-[var(--text-secondary)]">
                {isBn ? (
                  <>ইমেইল পরিবর্তন করতে <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.6875rem] font-mono">.env</code> ফাইলে <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.6875rem] font-mono">VITE_SUPER_ADMIN_EMAIL</code> আপডেট করুন এবং পুনর্নির্মাণ করুন।</>
                ) : (
                  <>To change email, update <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.6875rem] font-mono">VITE_SUPER_ADMIN_EMAIL</code> in <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.6875rem] font-mono">.env</code> and rebuild.</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="anim-card bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#8b5cf615', color: '#8b5cf6' }}>
            <Lock size={17} />
          </div>
          <div>
            <h2 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'সুপার অ্যাডমিন পাসওয়ার্ড' : 'Super Admin Password'}</h2>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? '.env ফাইল থেকে পড়া হচ্ছে' : 'Read from .env file'}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#8b5cf615' }}>
              <Lock size={16} className="text-[#8b5cf6]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.6875rem] text-[var(--text-muted)] mb-0.5">{isBn ? 'পাসওয়ার্ড' : 'Password'}</div>
              <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)] font-mono">
                {showPw ? creds.password : '\u2022'.repeat(creds.password.length)}
              </div>
            </div>
            <button onClick={() => setShowPw(!showPw)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] cursor-pointer border-none bg-transparent transition-colors">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {isDefault && (
            <div className="px-4 py-3 rounded-xl bg-[var(--amber)]/8 border border-[var(--amber)]/20 flex items-center gap-2">
              <AlertTriangle size={14} className="text-[var(--amber)] shrink-0" />
              <div className="text-[0.75rem] text-[var(--amber)]">{isBn ? 'ডিফল্ট পাসওয়ার্ড ব্যবহার করছেন — নিরাপত্তার জন্য পরিবর্তন করুন' : 'Using default password — change for security'}</div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <div className="flex items-start gap-3">
              <FileText size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="text-[0.75rem] text-[var(--text-secondary)]">
                {isBn ? (
                  <>পাসওয়ার্ড পরিবর্তন করতে <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.6875rem] font-mono">.env</code> ফাইলে <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.6875rem] font-mono">VITE_SUPER_ADMIN_PASSWORD</code> আপডেট করুন এবং পুনর্নির্মাণ করুন।</>
                ) : (
                  <>To change password, update <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.6875rem] font-mono">VITE_SUPER_ADMIN_PASSWORD</code> in <code className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.6875rem] font-mono">.env</code> and rebuild.</>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
