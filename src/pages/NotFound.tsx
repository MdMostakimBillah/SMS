import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, LayoutDashboard, Rocket, Sparkles } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { getDashboardPath } from '@/lib/navUtils'
import { useAuth } from '@/contexts/AuthContext'
import { NotFoundArt } from './NotFoundArt'

const FLOATERS = [
  { Icon: Rocket, className: 'left-[8%] top-[18%]', delay: '0s', duration: '7s' },
  { Icon: Compass, className: 'right-[10%] top-[24%]', delay: '1.2s', duration: '8s' },
  { Icon: Sparkles, className: 'left-[14%] bottom-[20%]', delay: '2s', duration: '9s' },
  { Icon: Compass, className: 'right-[14%] bottom-[16%]', delay: '0.6s', duration: '7.5s' },
] as const

export default function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isBn = useBn()
  const { user } = useAuth()

  return (
    <div className="relative flex items-center justify-center min-h-[100dvh] overflow-hidden px-6 py-12">
      <style>{`
        @keyframes notfound-bob {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-0.75rem) rotate(4deg); }
        }
        .notfound-enter { opacity: 0; animation: slideUp 0.55s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .notfound-enter, .notfound-blob, .notfound-floater { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      {/* Ambient gradient blobs */}
      <div aria-hidden className="notfound-blob pointer-events-none absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[var(--brand)] opacity-15 blur-3xl" style={{ animation: 'float 9s ease-in-out infinite' }} />
      <div aria-hidden className="notfound-blob pointer-events-none absolute -bottom-16 -right-12 w-80 h-80 rounded-full bg-[var(--teal)] opacity-15 blur-3xl" style={{ animation: 'float 11s ease-in-out 1.5s infinite' }} />
      <div aria-hidden className="notfound-blob pointer-events-none absolute top-1/3 left-1/2 w-56 h-56 rounded-full bg-[var(--purple)] opacity-10 blur-3xl" style={{ animation: 'float 10s ease-in-out 0.8s infinite' }} />

      {/* Floating decorative icons (hidden on small screens) */}
      {FLOATERS.map(({ Icon, className, delay, duration }, i) => (
        <div
          key={i}
          aria-hidden
          className={`notfound-floater pointer-events-none absolute hidden md:flex w-12 h-12 rounded-2xl glass items-center justify-center ${className}`}
          style={{ animation: `notfound-bob ${duration} ease-in-out ${delay} infinite` }}
        >
          <Icon size={22} className="text-[var(--brand)]" />
        </div>
      ))}

      <div className="relative text-center max-w-xl w-full">
        <p
          className="notfound-enter text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4"
          style={{ animationDelay: '0.05s' }}
        >
          {isBn ? 'ওহো! মহাশূন্যে হারিয়ে গেছেন?' : 'Oops! Lost in space?'}
        </p>

        <div className="notfound-enter flex justify-center mb-2" style={{ animationDelay: '0.12s' }}>
          <NotFoundArt />
        </div>

        <p
          className="notfound-enter text-[1.0625rem] font-semibold text-[var(--text-primary)] mb-2"
          style={{ animationDelay: '0.2s' }}
        >
          {isBn ? 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি' : 'Page not found'}
        </p>
        <p
          className="notfound-enter text-[0.875rem] text-[var(--text-secondary)] leading-relaxed mb-4"
          style={{ animationDelay: '0.26s' }}
        >
          {isBn
            ? 'আপনি যে ঠিকানাটি খুঁজছেন তা হয় সরানো হয়েছে, মুছে ফেলা হয়েছে, অথবা কখনো ছিলই না।'
            : 'The address you are looking for was moved, deleted, or never existed.'}
        </p>

        <div
          className="notfound-enter inline-flex items-center gap-2 max-w-full mb-6 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
          style={{ animationDelay: '0.32s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
          <code className="text-[0.75rem] text-[var(--text-muted)] truncate">
            {location.pathname}
          </code>
        </div>

        <div
          className="notfound-enter flex items-center justify-center gap-3 flex-wrap"
          style={{ animationDelay: '0.38s' }}
        >
          <button
            onClick={() => navigate(getDashboardPath(user))}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[var(--brand)] text-white text-[0.875rem] font-semibold border-none cursor-pointer shadow-lg hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all"
            style={{ boxShadow: '0 0.5rem 1.5rem rgba(99,102,241,0.35)' }}
          >
            <LayoutDashboard size={16} />
            {isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-[0.875rem] font-medium cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ArrowLeft size={16} />
            {isBn ? 'পেছনে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}
