import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import type { Institution } from '@/store/superAdminStore'
import { useClassStore, defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'

interface InstitutionLoginProps {
  institution: Institution
}

export default function InstitutionLogin({ institution }: InstitutionLoginProps) {
  const isBn = useBn()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadInstitutionData = (inst: Institution) => {
    useClassStore.getState().updateInstitution({
      name: inst.name, nameBn: inst.nameBn, logo: inst.logo, banner: inst.banner, bannerPosition: { x: 0, y: 0 },
      brandName: inst.brandName || 'EduTech', motto: inst.motto, mottoBn: inst.mottoBn, eiin: inst.eiin, phone: inst.phone, email: inst.email,
      address: inst.address, website: inst.website, subjects: inst.optionalSubjects || [], startTime: inst.startTime || '07:30', endTime: inst.endTime || '14:30',
      breaks: [], currentSession: inst.sessions?.[1] || '2025-26', sessions: inst.sessions || ['2024-25', '2025-26'],
      lightColors: { ...defaultThemeColors, brand: inst.brandColor }, darkColors: { ...defaultThemeColorsDark },
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate login - in real app this would be API call
    setTimeout(() => {
      // Check if it's the super admin
      const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL
      const superAdminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD

      if (email === superAdminEmail && password === superAdminPassword) {
        localStorage.setItem('edutech_user', JSON.stringify({
          email, role: 'super_admin', name: 'Super Admin'
        }))
        navigate('/super-admin')
        return
      }

      // Check if it's the institution admin
      if (email === institution.email && password === 'admin123') {
        loadInstitutionData(institution)
        localStorage.setItem('edutech_user', JSON.stringify({
          email, role: 'admin', name: institution.name, institutionId: institution.id
        }))
        localStorage.setItem('edutech_institutionId', institution.id)
        navigate('/dashboard')
        return
      }

      setError(isBn ? 'ভুল ইমেইল বা পাসওয়ার্ড' : 'Invalid email or password')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${institution.brandColor}15 0%, ${institution.brandColor}05 100%)` }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl overflow-hidden" style={{ background: `${institution.brandColor}15` }}>
            {institution.logo ? (
              <img src={institution.logo} alt={institution.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 size={36} style={{ color: institution.brandColor }} />
            )}
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{institution.name}</h1>
          {institution.nameBn && <p className="text-sm text-[var(--text-muted)] mt-0.5">{institution.nameBn}</p>}
          <p className="text-xs text-[var(--text-muted)] mt-2">{isBn ? 'স্কুল ম্যানেজমেন্ট সিস্টেম' : 'School Management System'}</p>
        </div>

        {/* Login Form */}
        <div className="bg-[var(--bg-primary)] rounded-2xl shadow-xl border border-[var(--border)] p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{isBn ? 'ইমেইল' : 'Email'}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.edu.bd"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{isBn ? 'পাসওয়ার্ড' : 'Password'}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isBn ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20">
                <p className="text-xs text-[var(--red)]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer border-none transition-opacity disabled:opacity-50"
              style={{ background: institution.brandColor }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  {isBn ? 'লগইন' : 'Login'}
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[var(--border)] text-center">
            <p className="text-[0.625rem] text-[var(--text-muted)]">
              {isBn ? 'পাসওয়ার্ড মনে নেই?' : 'Forgot password?'}{' '}
              <button className="text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-none text-[0.625rem]">
                {isBn ? 'যোগাযোগ করুন' : 'Contact Admin'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[0.625rem] text-[var(--text-muted)]">
            Powered by <span className="font-semibold" style={{ color: institution.brandColor }}>EduTech SMS</span>
          </p>
        </div>
      </div>
    </div>
  )
}
