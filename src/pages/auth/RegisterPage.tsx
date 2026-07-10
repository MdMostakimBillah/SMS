import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, GraduationCap, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { LOGIN_PATH } from '@/lib/constants'

export default function RegisterPage() {
  const { register, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    setSubmitting(true)
    try {
      await register(email, password, name)
      navigate('/dashboard')
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      <div className="w-full max-w-sm">
        <Link
          to={LOGIN_PATH}
          className="inline-flex items-center gap-1.5 text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--brand)] mb-6 no-underline"
        >
          <ArrowLeft size={14} />
          Back to Login
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--brand)] mb-4">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Create Account</h1>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-1">Set up your admin account</p>
        </div>

        {/* Register Card */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-1">New Account</h2>
          <p className="text-[0.75rem] text-[var(--text-muted)] mb-5">Create a mother account to manage your school</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.75rem] font-medium">
              {error}
              <button onClick={clearError} className="ml-2 underline text-[0.6875rem]">dismiss</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError() }}
                placeholder="Admin Name"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                required
              />
            </div>
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
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                  required
                  minLength={8}
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
              disabled={submitting || !name || !email || !password}
              className="w-full py-2.5 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[0.6875rem] text-[var(--text-muted)] mt-4">
          Already have an account?{' '}
          <Link to={LOGIN_PATH} className="text-[var(--brand)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
