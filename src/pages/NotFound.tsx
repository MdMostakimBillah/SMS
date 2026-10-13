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
    <div className="notfound-space relative flex items-center justify-center min-h-[100dvh] overflow-hidden px-6 py-12">
      <style>{`
        .notfound-space {
          background:
            radial-gradient(60rem 30rem at 12% 8%, rgba(99, 102, 241, 0.28), transparent 60%),
            radial-gradient(52rem 30rem at 88% 18%, rgba(168, 85, 247, 0.20), transparent 60%),
            radial-gradient(58rem 32rem at 82% 92%, rgba(20, 184, 166, 0.16), transparent 60%),
            linear-gradient(180deg, #0a0f26 0%, #131a3d 55%, #1c1445 100%);
        }
        .notfound-stars {
          background-image:
            radial-gradient(1.5px 1.5px at 8% 12%, #fff, transparent),
            radial-gradient(1px 1px at 22% 32%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 35% 8%, #fff, transparent),
            radial-gradient(1px 1px at 48% 22%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 62% 12%, #fff, transparent),
            radial-gradient(1px 1px at 74% 28%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 88% 10%, #fff, transparent),
            radial-gradient(1px 1px at 95% 34%, #fff, transparent),
            radial-gradient(1px 1px at 5% 48%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 18% 62%, #fff, transparent),
            radial-gradient(1px 1px at 30% 78%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 44% 88%, #fff, transparent),
            radial-gradient(1px 1px at 58% 72%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 70% 86%, #fff, transparent),
            radial-gradient(1px 1px at 82% 66%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 93% 80%, #fff, transparent),
            radial-gradient(1px 1px at 12% 90%, #fff, transparent),
            radial-gradient(1px 1px at 40% 48%, #fff, transparent);
        }
        @keyframes notfound-bob {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-0.75rem) rotate(4deg); }
        }
        .notfound-enter { opacity: 0; animation: slideUp 0.55s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .notfound-enter, .notfound-blob, .notfound-floater { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      {/* Static starfield backdrop */}
      <div aria-hidden className="notfound-stars pointer-events-none absolute inset-0 opacity-70" />

      {/* Ambient nebula blobs */}
      <div aria-hidden className="notfound-blob pointer-events-none absolute -top-10 -left-10 w-72 h-72 rounded-full bg-[var(--brand)] opacity-30 blur-3xl" style={{ animation: 'float 9s ease-in-out infinite' }} />
      <div aria-hidden className="notfound-blob pointer-events-none absolute -bottom-16 -right-12 w-80 h-80 rounded-full bg-[var(--teal)] opacity-25 blur-3xl" style={{ animation: 'float 11s ease-in-out 1.5s infinite' }} />
      <div aria-hidden className="notfound-blob pointer-events-none absolute top-1/3 left-1/2 w-56 h-56 rounded-full bg-[var(--purple)] opacity-25 blur-3xl" style={{ animation: 'float 10s ease-in-out 0.8s infinite' }} />

      {/* Floating decorative icons (hidden on small screens) */}
      {FLOATERS.map(({ Icon, className, delay, duration }, i) => (
        <div
          key={i}
          aria-hidden
          className={`notfound-floater pointer-events-none absolute hidden md:flex w-12 h-12 rounded-2xl items-center justify-center bg-white/10 border border-white/15 backdrop-blur-md ${className}`}
          style={{ animation: `notfound-bob ${duration} ease-in-out ${delay} infinite` }}
        >
          <Icon size={22} className="text-white" />
        </div>
      ))}

      <div className="relative text-center max-w-xl w-full">
        <p
          className="notfound-enter text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-white/50 mb-4"
          style={{ animationDelay: '0.05s' }}
        >
          {isBn ? 'ওহো! মহাশূন্যে হারিয়ে গেছেন?' : 'Oops! Lost in space?'}
        </p>

        <div className="notfound-enter flex justify-center mb-2" style={{ animationDelay: '0.12s' }}>
          <NotFoundArt />
        </div>

        <p
          className="notfound-enter text-[1.0625rem] font-semibold text-white mb-2"
          style={{ animationDelay: '0.2s' }}
        >
          {isBn ? 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি' : 'Page not found'}
        </p>
        <p
          className="notfound-enter text-[0.875rem] text-white/70 leading-relaxed mb-4"
          style={{ animationDelay: '0.26s' }}
        >
          {isBn
            ? 'আপনি যে ঠিকানাটি খুঁজছেন তা হয় সরানো হয়েছে, মুছে ফেলা হয়েছে, অথবা কখনো ছিলই না।'
            : 'The address you are looking for was moved, deleted, or never existed.'}
        </p>

        <div
          className="notfound-enter inline-flex items-center gap-2 max-w-full mb-6 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15"
          style={{ animationDelay: '0.32s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
          <code className="text-[0.75rem] text-white/70 truncate">
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
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white/10 border border-white/15 text-white text-[0.875rem] font-medium cursor-pointer backdrop-blur-md hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={16} />
            {isBn ? 'পেছনে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}
