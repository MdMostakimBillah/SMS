import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSuperAdminStore, type Institution } from '@/store/superAdminStore'
import { useClassStore, defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'

const fallbackInstitutions: Institution[] = [
  {
    id: 'INST-001', name: 'Sunrise Academy', nameBn: 'সানরাইজ একাডেমি',
    email: 'admin@sunrise.edu.bd', phone: '+880-1712-345678',
    address: 'Banani, Dhaka 1213', addressBn: 'বনানী, ঢাকা-১২১৩',
    eiin: '123456', website: 'smsappbd.vercel.app/i/sunrise', subdomain: 'sunrise',
    status: 'active', package: { name: 'Premium', nameBn: 'প্রিমিয়াম', maxStudents: 400, maxTeachers: 40, maxClasses: 999, storageMB: 10240, price: 3000, duration: 30 },
    usedStorageMB: 4520, createdAt: '2024-08-15', lastLogin: '2026-07-30',
    logo: '', banner: '', brandColor: '#6366f1', brandName: 'Sunrise Academy',
    motto: 'Knowledge is Power', mottoBn: 'জ্ঞাই হলো শক্তি',
    startTime: '07:30', endTime: '14:30', optionalSubjects: [], sessions: ['2024-25', '2025-26'],
  },
  {
    id: 'INST-002', name: 'Dhaka International School', nameBn: 'ঢাকা ইন্টারন্যাশনাল স্কুল',
    email: 'info@dis.edu.bd', phone: '+880-1812-456789',
    address: 'Gulshan, Dhaka 1212', addressBn: 'গুলশান, ঢাকা-১২১২',
    eiin: '234567', website: 'smsappbd.vercel.app/i/dis', subdomain: 'dis',
    status: 'active', package: { name: 'Enterprise', nameBn: 'এন্টারপ্রাইজ', maxStudents: 500, maxTeachers: 50, maxClasses: 999, storageMB: 20480, price: 3500, duration: 30 },
    usedStorageMB: 18750, createdAt: '2024-06-20', lastLogin: '2026-07-31',
    logo: '', banner: '', brandColor: '#3b82f6', brandName: 'DIS',
    motto: '', mottoBn: '', startTime: '08:00', endTime: '15:00',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'],
  },
  {
    id: 'INST-003', name: 'Green Valley School', nameBn: 'গ্রিন ভ্যালি স্কুল',
    email: 'contact@greenvalley.edu.bd', phone: '+880-1912-567890',
    address: 'Uttara, Dhaka 1230', addressBn: 'উত্তরা, ঢাকা-১২৩০',
    eiin: '345678', website: 'smsappbd.vercel.app/i/greenvalley', subdomain: 'greenvalley',
    status: 'trial', package: { name: 'Standard', nameBn: 'স্ট্যান্ডার্ড', maxStudents: 250, maxTeachers: 30, maxClasses: 999, storageMB: 5120, price: 2200, duration: 30 },
    usedStorageMB: 340, createdAt: '2026-07-01', lastLogin: '2026-07-28',
    logo: '', banner: '', brandColor: '#22c55e', brandName: 'Green Valley',
    motto: '', mottoBn: '', startTime: '07:30', endTime: '14:00',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'],
  },
  {
    id: 'INST-004', name: 'Rajshahi Collegiate School', nameBn: 'রাজশাহী কলেজিয়েট স্কুল',
    email: 'admin@rajshahi-cs.edu.bd', phone: '+880-1712-678901',
    address: 'Boalia, Rajshahi 6205', addressBn: 'বোয়ালিয়া, রাজশাহী-৬২০৫',
    eiin: '456789', website: 'smsappbd.vercel.app/i/rajshahi-cs', subdomain: 'rajshahi-cs',
    status: 'suspended', package: { name: 'Basic', nameBn: 'বেসিক', maxStudents: 150, maxTeachers: 20, maxClasses: 999, storageMB: 2048, price: 1500, duration: 30 },
    usedStorageMB: 120, createdAt: '2025-11-10', lastLogin: '2026-05-15',
    logo: '', banner: '', brandColor: '#f59e0b', brandName: 'Rajshahi CS',
    motto: '', mottoBn: '', startTime: '08:00', endTime: '14:30',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'],
  },
]

function loadInstitutionData(inst: Institution) {
  useClassStore.getState().updateInstitution({
    name: inst.name, nameBn: inst.nameBn, logo: inst.logo, banner: inst.banner, bannerPosition: { x: 0, y: 0 },
    brandName: inst.brandName || inst.name, motto: inst.motto, mottoBn: inst.mottoBn, eiin: inst.eiin, phone: inst.phone, email: inst.email,
    address: inst.address, website: inst.website, subjects: inst.optionalSubjects || [], startTime: inst.startTime || '07:30', endTime: inst.endTime || '14:30',
    breaks: [], currentSession: inst.sessions?.[1] || '2025-26', sessions: inst.sessions || ['2024-25', '2025-26'],
    lightColors: { ...defaultThemeColors, brand: inst.brandColor }, darkColors: { ...defaultThemeColorsDark },
  })
}

export { loadInstitutionData, fallbackInstitutions }

export default function InstitutionLogin({ subdomain, institution: propInstitution }: { subdomain?: string; institution?: Institution }) {
  const isBn = useBn()
  const navigate = useNavigate()
  const storeInstitutions = useSuperAdminStore((s) => s.institutions)

  const institution = useMemo(() => {
    if (propInstitution) return propInstitution
    if (!subdomain) return null
    const all = storeInstitutions.length > 0 ? storeInstitutions : fallbackInstitutions
    return all.find((i) => i.subdomain === subdomain) || null
  }, [propInstitution, subdomain, storeInstitutions])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!institution) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {isBn ? 'প্রতিষ্ঠান পাওয়া যায়নি' : 'Institution Not Found'}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {isBn ? 'এই সাবডোমেইনে কোনো প্রতিষ্ঠান নেই' : 'No institution found for this URL'}
          </p>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL
      const superAdminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD

      if (email === superAdminEmail && password === superAdminPassword) {
        localStorage.setItem('edutech_user', JSON.stringify({
          email, role: 'super_admin', name: 'Super Admin'
        }))
        navigate('/super-admin')
        return
      }

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

        <div className="text-center mt-6">
          <p className="text-[0.625rem] text-[var(--text-muted)]">
            Powered by <span className="font-semibold" style={{ color: institution.brandColor }}>EduTech SMS</span>
          </p>
        </div>
      </div>
    </div>
  )
}
