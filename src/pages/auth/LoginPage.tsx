import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, GraduationCap, Mail, Lock, Check, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/store/appStore'

const EMAIL_KEY = 'edutech_login_email'

interface PasswordRule {
  label: string
  labelBn: string
  test: (p: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: '8+ characters', labelBn: '৮+ অক্ষর', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', labelBn: 'বড় হাতের অক্ষর', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', labelBn: 'ছোট হাতের অক্ষর', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', labelBn: 'সংখ্যা', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character', labelBn: 'বিশেষ অক্ষর', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

function getInitialTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('edutech-settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      const t = parsed?.state?.theme
      if (t === 'light') return 'light'
      if (t === 'dark') return 'dark'
    }
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function LoginPage() {
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isBn] = useState(() => document.documentElement.dataset.lang === 'bn')
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const isDark = theme === 'dark'
  const setAppTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    localStorage.setItem(EMAIL_KEY, email)
  }, [email])

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    setAppTheme(next)
  }

  const passwordValidation = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      met: password.length > 0 && rule.test(password),
    }))
  }, [password])

  const isPasswordValid = password.length > 0 && passwordValidation.every((r) => r.met)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = isEmailValid && isPasswordValid && !submitting

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    interface RibbonLine {
      yStart: number
      yEnd: number
      curveDepth: number
      amplitude: number
      frequency: number
      speed: number
      phase: number
      opacity: number
      strokeWidth: number
      drawDelay: number
      drawSpeed: number
    }

    const lineCount = 35
    const lines: RibbonLine[] = Array.from({ length: lineCount }, (_, i) => {
      const t = i / lineCount
      return {
        yStart: 0.05 + t * 0.15,
        yEnd: 0.55 + t * 0.35,
        curveDepth: 0.3 + t * 0.15,
        amplitude: 0.012 + Math.random() * 0.018,
        frequency: 2 + Math.random() * 1.5,
        speed: 0.25 + Math.random() * 0.2,
        phase: t * Math.PI * 1.2 + Math.random() * 0.5,
        opacity: 0.06 + t * 0.12,
        strokeWidth: 0.8 + Math.random() * 0.4,
        drawDelay: i * 0.12,
        drawSpeed: 3.5 + Math.random() * 1.0,
      }
    })

    interface Balloon {
      x: number
      y: number
      size: number
      speedY: number
      swayAmp: number
      swayFreq: number
      phase: number
      opacity: number
      pulse: number
    }

    const balloonCount = 12
    const balloons: Balloon[] = Array.from({ length: balloonCount }, (_, i) => {
      const cluster = i < 8 ? 0.4 + Math.random() * 0.2 : i < 14 ? 0.3 + Math.random() * 0.4 : Math.random()
      return {
        x: cluster,
        y: 0.3 + Math.random() * 0.7,
        size: 3 + Math.random() * 5,
        speedY: 0.008 + Math.random() * 0.012,
        swayAmp: 0.01 + Math.random() * 0.02,
        swayFreq: 0.5 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.04 + Math.random() * 0.08,
        pulse: Math.random() * Math.PI * 2,
      }
    })

    interface Floater {
      x: number
      y: number
      char: string
      size: number
      speedY: number
      swayAmp: number
      swayFreq: number
      phase: number
      opacity: number
      rotation: number
      rotSpeed: number
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzঅআইঈউঋএঐওঔকখগঘচছজঝটঠডঢণতথদধনপফবভমযরলশষসহאבגדהוזחטיכלמנסעקרשתअइউएকখগघজ�ডढতদধনপবভমযরলवসহ가나다라마바사아자차카타파하的一二三四五六七八九十百千万亿零左右上下大小多少来去出入开关好坏有无الألأإآببةتثجحخدذرزسشصضطظعغفقكلمنهويءأ'.split('')

    const floaters: Floater[] = Array.from({ length: 12 }, () => ({
      x: Math.random(),
      y: 0.2 + Math.random() * 0.8,
      char: chars[Math.floor(Math.random() * chars.length)],
      size: 24 + Math.random() * 20,
      speedY: 0.003 + Math.random() * 0.006,
      swayAmp: 0.005 + Math.random() * 0.01,
      swayFreq: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.01 + Math.random() * 0.015,
      rotation: (Math.random() - 0.5) * 0.3,
      rotSpeed: (Math.random() - 0.5) * 0.15,
    }))

    let animId: number
    let time = 0
    let lastTime = performance.now()

    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)

    const isDarkMode = document.documentElement.getAttribute('data-theme') !== 'light'
    const r = isDarkMode ? 255 : 255
    const g = isDarkMode ? 255 : 255
    const b = isDarkMode ? 255 : 255
    const lineOpacityMult = isDarkMode ? 1 : 1.5
    const balloonOpacityMult = isDarkMode ? 1 : 1.8
    const floaterOpacityMult = isDarkMode ? 1 : 2

    const draw = (now: number) => {
      const dt = (now - lastTime) / 1000
      lastTime = now
      time += dt

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.clearRect(0, 0, w, h)

      // Draw balloons
      for (const bl of balloons) {
        bl.y -= bl.speedY * dt
        bl.phase += dt * bl.swayFreq
        bl.pulse += dt * 1.2

        if (bl.y < -0.1) {
          bl.y = 1.1
          bl.x = 0.3 + Math.random() * 0.4
        }

        const swayX = Math.sin(bl.phase) * bl.swayAmp
        const bobY = Math.sin(bl.pulse) * 0.003
        const px = (bl.x + swayX) * w
        const py = (bl.y + bobY) * h
        const pulseOpacity = bl.opacity * (0.7 + 0.3 * Math.sin(bl.pulse * 0.8)) * balloonOpacityMult

        ctx.beginPath()
        ctx.ellipse(px, py, bl.size * 0.8, bl.size, 0, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${pulseOpacity * 0.3})`
        ctx.fill()

        ctx.beginPath()
        ctx.ellipse(px - bl.size * 0.2, py - bl.size * 0.3, bl.size * 0.25, bl.size * 0.35, -0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${pulseOpacity * 0.6})`
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(px, py + bl.size)
        ctx.quadraticCurveTo(px + Math.sin(bl.phase * 0.7) * 3, py + bl.size + 8, px + Math.sin(bl.phase) * 2, py + bl.size + 14)
        ctx.strokeStyle = `rgba(${r},${g},${b},${pulseOpacity * 0.25})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Draw floating letters
      for (const f of floaters) {
        f.y -= f.speedY * dt
        f.phase += dt * f.swayFreq
        f.rotation += f.rotSpeed * dt

        if (f.y < -0.1) {
          f.y = 1.1
          f.x = Math.random()
          f.char = chars[Math.floor(Math.random() * chars.length)]
        }

        const swayX = Math.sin(f.phase) * f.swayAmp
        const px = (f.x + swayX) * w
        const py = f.y * h

        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(f.rotation)
        ctx.font = `${f.size}px 'Inter', sans-serif`
        ctx.fillStyle = `rgba(${r},${g},${b},${f.opacity * floaterOpacityMult})`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(f.char, 0, 0)
        ctx.restore()
      }

      // Draw lines
      const segments = 100

      for (const line of lines) {
        const lineTime = Math.max(0, time - line.drawDelay)
        const drawProgress = Math.min(1, lineTime / line.drawSpeed)
        const headT = easeOutQuad(drawProgress)

        ctx.beginPath()
        ctx.strokeStyle = `rgba(${r},${g},${b},${line.opacity * lineOpacityMult})`
        ctx.lineWidth = line.strokeWidth

        for (let s = 0; s <= segments; s++) {
          const t = s / segments

          if (t > headT) break

          const x = t * w

          const baseY = line.yStart + (line.yEnd - line.yStart) * t
          const curve = Math.sin(t * Math.PI) * line.curveDepth * h
          const wave = Math.sin(
            t * Math.PI * line.frequency + time * line.speed + line.phase
          ) * line.amplitude * h * Math.min(1, lineTime * 0.5)

          const y = baseY * h + curve + wave

          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.stroke()
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [isDark])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
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

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-colors ${
          isDark ? 'text-white/40 hover:text-white/70' : 'text-black/30 hover:text-black/60'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <>
              <circle cx="12" cy="12" r="4" style={{ animation: 'sunPulse 2s ease-in-out infinite' }} />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </>
          ) : (
            <>
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" style={{ animation: 'moonWobble 3s ease-in-out infinite' }} />
            </>
          )}
        </svg>
      </button>

      {/* ── Left Panel (branding) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(160deg, #0a0a0f 0%, #0d0d14 40%, #0f0f18 70%, #0a0a0f 100%)'
              : 'linear-gradient(160deg, #1a1d2e 0%, #1e2235 40%, #222740 70%, #1a1d2e 100%)',
          }}
        />

        {/* Flowing curved lines canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        />

        {/* Branding content */}
        <div className="relative z-10 text-center px-8">
          <GraduationCap size={72} className="text-[var(--brand)] mx-auto mb-4" />
          <h1 className="text-[2rem] font-bold mb-3 tracking-tight text-white">
            EduTech SMS
          </h1>
          <p className="text-[1rem] max-w-[280px] mx-auto leading-relaxed text-white/50">
            {isBn ? 'স্কুল ম্যানেজমেন্ট সিস্টেম' : 'School Management System'}
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-[0.75rem] text-white/30">
            <Lock size={12} />
            <span>{isBn ? 'নিরাপদ অ্যাডমিন অ্যাক্সেস' : 'Secure Admin Access'}</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className={`flex-1 flex items-center justify-center px-6 py-12 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
        <div className="w-full max-w-[22rem]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <GraduationCap size={44} className="text-[var(--brand)] mx-auto mb-4" />
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>EduTech SMS</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className={`text-[1.5rem] font-bold mb-2 ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>
              {isBn ? 'স্বাগতম' : 'Welcome Back'}
            </h2>
            <p className={`text-[0.875rem] ${isDark ? 'text-white/40' : 'text-[var(--text-secondary)]'}`}>
              {isBn ? 'অ্যাডমিন প্যানেলে সাইন ইন করুন' : 'Sign in to admin panel'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[var(--red)]/20 flex items-center justify-center shrink-0">
                <X size={12} className="text-[var(--red)]" />
              </div>
              <span className="text-[0.8125rem] text-[var(--red)] flex-1">{error}</span>
              <button onClick={clearError} className="text-[var(--red)]/60 hover:text-[var(--red)] cursor-pointer bg-transparent border-none">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className={`text-[0.75rem] font-medium mb-1.5 block ${isDark ? 'text-white/50' : 'text-[var(--text-secondary)]'}`}>
                {isBn ? 'ইমেইল' : 'Email'}
              </label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/25' : 'text-[var(--text-muted)]'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError() }}
                  placeholder="admin@example.com"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl border text-[0.875rem] outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-[var(--brand)]/50 focus:bg-white/[0.07]'
                      : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/50 focus:bg-[var(--bg-secondary)]'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`text-[0.75rem] font-medium mb-1.5 block ${isDark ? 'text-white/50' : 'text-[var(--text-secondary)]'}`}>
                {isBn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/25' : 'text-[var(--text-muted)]'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError() }}
                  placeholder="••••••••"
                  className={`w-full h-11 pl-10 pr-11 rounded-xl border text-[0.875rem] outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-[var(--brand)]/50 focus:bg-white/[0.07]'
                      : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/50 focus:bg-[var(--bg-secondary)]'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-none transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password rules */}
            {password.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5 mt-2">
                {passwordValidation.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      rule.met ? 'bg-[var(--green)]/20' : isDark ? 'bg-white/5' : 'bg-black/5'
                    }`}>
                      {rule.met ? (
                        <Check size={10} className="text-[var(--green)]" />
                      ) : (
                        <X size={10} className={isDark ? 'text-white/20' : 'text-[var(--text-muted)]'} />
                      )}
                    </div>
                    <span className={`text-[0.6875rem] transition-colors ${
                      rule.met ? 'text-[var(--green)]' : isDark ? 'text-white/30' : 'text-[var(--text-muted)]'
                    }`}>
                      {isBn ? rule.labelBn : rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-11 rounded-xl text-[0.875rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                color: canSubmit ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              }}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {submitting
                ? (isBn ? 'সাইন ইন হচ্ছে...' : 'Signing in...')
                : (isBn ? 'সাইন ইন' : 'Sign In')
              }
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <div className={`flex items-center justify-center gap-2 text-[0.6875rem] ${isDark ? 'text-white/20' : 'text-[var(--text-muted)]'}`}>
              <Lock size={11} />
              <span>{isBn ? 'নিরাপদ অ্যাডমিন অ্যাক্সেস' : 'Protected admin access'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
