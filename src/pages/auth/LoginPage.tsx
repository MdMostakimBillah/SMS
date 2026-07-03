import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, GraduationCap, Mail, Lock, Check, X, Sun, Moon } from 'lucide-react'
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

export default function LoginPage() {
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useAppStore()
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isBn] = useState(() => document.documentElement.dataset.lang === 'bn')

  useEffect(() => {
    localStorage.setItem(EMAIL_KEY, email)
  }, [email])

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

    const balloonCount = 20
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

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzঅআইঈউঋএঐওঔকখগঘচছজঝটঠডঢণতথদধনপফবভমযরলশষসহאבגדהוזחטיכלמנסעקרשתअइउएकखगघजझडढतदधनपबभमयरलवसह가나다라마바사아자차카타파하的一二三四五六七八九十百千万亿零左右上下大小多少来去出入开关好坏有无الألأإآببةتثجحخدذرزسشصضطظعغفقكلمنهويءأ'.split('')

    const floaters: Floater[] = Array.from({ length: 35 }, () => ({
      x: Math.random(),
      y: 0.2 + Math.random() * 0.8,
      char: chars[Math.floor(Math.random() * chars.length)],
      size: 28 + Math.random() * 30,
      speedY: 0.005 + Math.random() * 0.01,
      swayAmp: 0.008 + Math.random() * 0.015,
      swayFreq: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.015 + Math.random() * 0.025,
      rotation: (Math.random() - 0.5) * 0.4,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    }))

    let animId: number
    let time = 0
    let lastTime = performance.now()

    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)

    const draw = (now: number) => {
      const dt = (now - lastTime) / 1000
      lastTime = now
      time += dt

      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.clearRect(0, 0, w, h)

      // Draw balloons
      for (const b of balloons) {
        b.y -= b.speedY * dt
        b.phase += dt * b.swayFreq
        b.pulse += dt * 1.2

        if (b.y < -0.1) {
          b.y = 1.1
          b.x = 0.3 + Math.random() * 0.4
        }

        const swayX = Math.sin(b.phase) * b.swayAmp
        const bobY = Math.sin(b.pulse) * 0.003
        const px = (b.x + swayX) * w
        const py = (b.y + bobY) * h
        const pulseOpacity = b.opacity * (0.7 + 0.3 * Math.sin(b.pulse * 0.8))

        // Balloon body
        ctx.beginPath()
        ctx.ellipse(px, py, b.size * 0.8, b.size, 0, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${pulseOpacity * 0.3})`
        ctx.fill()

        // Balloon highlight
        ctx.beginPath()
        ctx.ellipse(px - b.size * 0.2, py - b.size * 0.3, b.size * 0.25, b.size * 0.35, -0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${pulseOpacity * 0.6})`
        ctx.fill()

        // Balloon string
        ctx.beginPath()
        ctx.moveTo(px, py + b.size)
        ctx.quadraticCurveTo(px + Math.sin(b.phase * 0.7) * 3, py + b.size + 8, px + Math.sin(b.phase) * 2, py + b.size + 14)
        ctx.strokeStyle = `rgba(255,255,255,${pulseOpacity * 0.25})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Draw floating letters & brand text
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
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`
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
        ctx.strokeStyle = `rgba(255,255,255,${line.opacity})`
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
  }, [])

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
    <div className="min-h-screen flex bg-[var(--bg-tertiary)] relative">
      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--brand-light)] hover:border-[var(--brand)] transition-all"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun size={16} className="text-[var(--amber)]" />
        ) : (
          <Moon size={16} className="text-[var(--brand)]" />
        )}
      </button>
      {/* ── Left Panel (branding) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Dark background with subtle gradient */}
        <div className="absolute inset-0" style={{ background: 'var(--bg-tertiary)' }} />

        {/* Flowing curved lines canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        />

        {/* Branding content */}
        <div className="relative z-10 text-center px-8">
          <GraduationCap size={72} className="text-[var(--brand)] mx-auto mb-4" />
          <h1 className="text-[2rem] font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            EduTech SMS
          </h1>
          <p className="text-[1rem] text-[var(--text-secondary)] max-w-[280px] mx-auto leading-relaxed">
            {isBn ? 'স্কুল ম্যানেজমেন্ট সিস্টেম' : 'School Management System'}
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-[0.75rem] text-[var(--text-muted)]">
            <Lock size={12} />
            <span>{isBn ? 'নিরাপদ অ্যাডমিন অ্যাক্সেস' : 'Secure Admin Access'}</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--bg-tertiary)]">
        <div className="w-full max-w-[22rem]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <GraduationCap size={44} className="text-[var(--brand)] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[var(--text-primary)]">EduTech SMS</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[1.5rem] font-bold text-[var(--text-primary)] mb-2">
              {isBn ? 'স্বাগতম' : 'Welcome Back'}
            </h2>
            <p className="text-[0.875rem] text-[var(--text-secondary)]">
              {isBn ? 'অ্যাডমিন প্যানেলে সাইন ইন করুন' : 'Sign in to admin panel'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-[var(--red-light)] border border-[var(--red)]/20 flex items-center gap-3">
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
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
                {isBn ? 'ইমেইল' : 'Email'}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError() }}
                  placeholder="admin@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand)] focus:bg-[var(--bg-primary)] transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
                {isBn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError() }}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand)] focus:bg-[var(--bg-primary)] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none transition-colors"
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
                      rule.met ? 'bg-[var(--green)]/20' : 'bg-[var(--bg-secondary)]'
                    }`}>
                      {rule.met ? (
                        <Check size={10} className="text-[var(--green)]" />
                      ) : (
                        <X size={10} className="text-[var(--text-muted)]" />
                      )}
                    </div>
                    <span className={`text-[0.6875rem] transition-colors ${
                      rule.met ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'
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
                  ? 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)'
                  : 'var(--bg-secondary)',
                color: canSubmit ? '#fff' : 'var(--text-muted)',
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
            <div className="flex items-center justify-center gap-2 text-[0.6875rem] text-[var(--text-muted)]">
              <Lock size={11} />
              <span>{isBn ? 'নিরাপদ অ্যাডমিন অ্যাক্সেস' : 'Protected admin access'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
