import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  Crown, Building2, Users, Mail, Lock, Eye, EyeOff,
  CheckCircle, AlertTriangle, Plus, Database, CreditCard, MessageSquare, FileText, Globe,
  Bell,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useAuth } from '@/contexts/AuthContext'
import { getAdminCredentials, isDefaultCredentials } from '@/lib/adminAuth'
import gsap from 'gsap'

type Page = 'home' | 'account' | 'schools' | 'requests' | 'subscriptions' | 'sms' | 'database' | 'add-school' | 'notices' | 'status' | 'payments'

const PATH_MAP: Record<string, Page> = {
  '/super-admin': 'home',
  '/super-admin/account': 'account',
  '/super-admin/schools': 'schools',
  '/super-admin/requests': 'requests',
  '/super-admin/subscriptions': 'subscriptions',
  '/super-admin/sms': 'sms',
  '/super-admin/database': 'database',
  '/super-admin/add-school': 'add-school',
  '/super-admin/notices': 'notices',
  '/super-admin/status': 'status',
  '/super-admin/payments': 'payments',
}

const REVERSE_MAP: Record<Page, string> = {
  home: '/super-admin',
  account: '/super-admin/account',
  schools: '/super-admin/schools',
  requests: '/super-admin/requests',
  subscriptions: '/super-admin/subscriptions',
  sms: '/super-admin/sms',
  database: '/super-admin/database',
  'add-school': '/super-admin/add-school',
  notices: '/super-admin/notices',
  status: '/super-admin/status',
  payments: '/super-admin/payments',
}

export default function SuperAdminPage() {
  const isBn = useBn()
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const currentPage = PATH_MAP[location.pathname] || 'home'

  useEffect(() => {
    if (!containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.anim-card')
    gsap.fromTo(cards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' })
  }, [currentPage])

  const goTo = (page: Page) => navigate(REVERSE_MAP[page])

  // Role check after all hooks
  if (user && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />
  }

  const actions = [
    { id: 'account' as Page, icon: <Lock size={20} />, label: isBn ? 'অ্যাকাউন্ট' : 'Account', desc: isBn ? 'ইমেইল ও পাসওয়ার্ড' : 'Email & password', color: '#6366f1', functional: true },
    { id: 'schools' as Page, icon: <Building2 size={20} />, label: isBn ? 'স্কুল' : 'Schools', desc: isBn ? 'নিবন্ধিত' : 'Registered', color: '#14b8a6', functional: false },
    { id: 'requests' as Page, icon: <Users size={20} />, label: isBn ? 'অনুরোধ' : 'Requests', desc: isBn ? 'পেন্ডিং' : 'Pending', color: '#f59e0b', functional: false },
    { id: 'subscriptions' as Page, icon: <CreditCard size={20} />, label: isBn ? 'প্যাকেজ' : 'Packages', desc: isBn ? 'সাবস্ক্রিপশন' : 'Subscriptions', color: '#ec4899', functional: false },
    { id: 'sms' as Page, icon: <MessageSquare size={20} />, label: isBn ? 'SMS' : 'SMS', desc: isBn ? 'প্রোভাইডার' : 'Provider', color: '#06b6d4', functional: false },
    { id: 'database' as Page, icon: <Database size={20} />, label: isBn ? 'ডাটাবেজ' : 'Database', desc: isBn ? 'ব্যাকআপ' : 'Backup', color: '#22c55e', functional: false },
    { id: 'add-school' as Page, icon: <Plus size={20} />, label: isBn ? 'নতুন স্কুল' : 'Add School', desc: isBn ? 'যোগ' : 'Register', color: '#3b82f6', functional: false },
    { id: 'notices' as Page, icon: <Bell size={20} />, label: isBn ? 'নোটিশ' : 'Notices', desc: isBn ? 'বার্তা' : 'System', color: '#f97316', functional: false },
    { id: 'status' as Page, icon: <Globe size={20} />, label: isBn ? 'স্ট্যাটাস' : 'Status', desc: isBn ? 'সিস্টেম' : 'App', color: '#10b981', functional: false },
    { id: 'payments' as Page, icon: <FileText size={20} />, label: isBn ? 'পেমেন্ট' : 'Payments', desc: isBn ? 'প্রতিষ্ঠান' : 'Institution', color: '#a855f7', functional: false },
  ]

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
            {actions.map((a) => (
              <button key={a.id} onClick={() => goTo(a.id)}
                className="group relative p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] cursor-pointer text-left hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
                {!a.functional && (
                  <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[0.5rem] font-semibold bg-[var(--bg-secondary)] text-[var(--text-muted)] uppercase">
                    {isBn ? 'শীঘ্রই' : 'Soon'}
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  style={{ background: `${a.color}12`, color: a.color }}>
                  {a.icon}
                </div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] mb-0.5 leading-tight">{a.label}</div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] leading-snug">{a.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {currentPage === 'account' && <AccountSettings isBn={isBn} />}

      {currentPage === 'schools' && <Placeholder title={isBn ? 'সকল স্কুল' : 'All Schools'} icon={<Building2 size={28} />} color="#14b8a6" isBn={isBn} />}
      {currentPage === 'requests' && <Placeholder title={isBn ? 'রেজিস্ট্রেশন' : 'Requests'} icon={<Users size={28} />} color="#f59e0b" isBn={isBn} />}
      {currentPage === 'subscriptions' && <Placeholder title={isBn ? 'প্যাকেজ' : 'Packages'} icon={<CreditCard size={28} />} color="#ec4899" isBn={isBn} />}
      {currentPage === 'sms' && <Placeholder title={isBn ? 'SMS সেবা' : 'SMS Service'} icon={<MessageSquare size={28} />} color="#06b6d4" isBn={isBn} />}
      {currentPage === 'database' && <Placeholder title={isBn ? 'ডাটাবেজ' : 'Database'} icon={<Database size={28} />} color="#22c55e" isBn={isBn} />}
      {currentPage === 'add-school' && <Placeholder title={isBn ? 'নতুন স্কুল' : 'Add School'} icon={<Plus size={28} />} color="#3b82f6" isBn={isBn} />}
      {currentPage === 'notices' && <Placeholder title={isBn ? 'নোটিশ' : 'Notices'} icon={<Bell size={28} />} color="#f97316" isBn={isBn} />}
      {currentPage === 'status' && <Placeholder title={isBn ? 'স্ট্যাটাস' : 'Status'} icon={<Globe size={28} />} color="#10b981" isBn={isBn} />}
      {currentPage === 'payments' && <Placeholder title={isBn ? 'পেমেন্ট' : 'Payments'} icon={<FileText size={28} />} color="#a855f7" isBn={isBn} />}
    </div>
  )
}

/* ── Account Settings ────────────────────────────────────────── */

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

/* ── Placeholder ─────────────────────────────────────────────── */

function Placeholder({ title, icon, color, isBn }: { title: string; icon: React.ReactNode; color: string; isBn: boolean }) {
  return (
    <div className="anim-card flex flex-col items-center justify-center py-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${color}12`, color }}>{icon}</div>
      <div className="text-[1rem] font-semibold text-[var(--text-primary)] mb-1">{title}</div>
      <div className="text-[0.8125rem] text-[var(--text-muted)]">{isBn ? 'শীঘ্রই আসছে' : 'Coming soon'}</div>
    </div>
  )
}
