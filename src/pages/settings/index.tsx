import { useState, useEffect, useMemo } from 'react'
import {
  Shield, Mail, Lock, Eye, EyeOff, Save, CheckCircle, AlertTriangle, Loader2,
  Globe, Link, ToggleLeft, ToggleRight, Copy, Server,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBn } from '@/hooks/useBn'
import { authApi } from '@/lib/api'
import { useSuperAdminStore, type InstitutionAccessModes } from '@/store/superAdminStore'

export default function Page() {
  const { user } = useAuth()
  const isBn = useBn()
  const isSuperAdmin = user?.role === 'super_admin'
  const isInstAdmin = user?.role === 'admin'

  if (!isSuperAdmin && !isInstAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle size={48} className="text-[var(--amber)] mx-auto mb-4 opacity-50" />
          <div className="text-[1rem] font-semibold text-[var(--text-primary)] mb-2">
            {isBn ? 'অ্যাক্সেস অস্বীকৃত' : 'Access Denied'}
          </div>
          <div className="text-[0.8125rem] text-[var(--text-muted)]">
            {isBn ? 'শুধুমাত্র অ্যাডমিন সেটিংস অ্যাক্সেস করতে পারেন' : 'Only admin can access settings'}
          </div>
        </div>
      </div>
    )
  }

  if (isSuperAdmin) return <SettingsContent isBn={isBn} />
  return <InstitutionSettings isBn={isBn} />
}

function InstitutionSettings({ isBn }: { isBn: boolean }) {
  const { user } = useAuth()
  const storeInstitutions = useSuperAdminStore((s) => s.institutions)
  const updateStoreInstitution = useSuperAdminStore((s) => s.updateInstitution)

  const currentInst = useMemo(() => {
    return storeInstitutions.find((i) => i.subdomain === user?.subdomain) || null
  }, [storeInstitutions, user?.subdomain])

  const [modes, setModes] = useState<InstitutionAccessModes>({
    pathBased: true,
    subdomainBased: true,
    customDomain: '',
  })
  const [customDomainInput, setCustomDomainInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (currentInst?.accessModes) {
      setModes(currentInst.accessModes)
      setCustomDomainInput(currentInst.accessModes?.customDomain || '')
    }
  }, [currentInst])

  const handleSave = async () => {
    if (!currentInst) return
    setSaving(true)
    const updated: InstitutionAccessModes = {
      ...modes,
      customDomain: customDomainInput.trim(),
    }
    updateStoreInstitution(currentInst.id, { accessModes: updated })
    setModes(updated)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const baseUrl = window.location.origin
  const slug = currentInst?.slug || ''
  const subdomain = currentInst?.subdomain || ''

  const pathUrl = `${baseUrl}/i/${slug}`
  const subdomainUrl = `https://${subdomain}.smsappbd.vercel.app`
  const customUrl = customDomainInput.trim() ? `https://${customDomainInput.trim()}` : ''

  const atLeastOneMode = modes.pathBased || modes.subdomainBased || !!customDomainInput.trim()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
          <Globe size={20} className="text-[var(--brand)]" />
        </div>
        <div>
          <h1 className="text-[1.125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'অ্যাক্সেস মোড' : 'Access Modes'}
          </h1>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            {isBn ? 'কিভাবে আপনার প্রতিষ্ঠানে প্রবেশ করা যাবে' : 'How your institution can be accessed'}
          </p>
        </div>
      </div>

      {/* Warning if no modes enabled */}
      {!atLeastOneMode && (
        <div className="px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[0.75rem] text-amber-700">
            {isBn
              ? 'অন্তত একটি অ্যাক্সেস মোড সক্রিয় করুন, নাহলে আপনার প্রতিষ্ঠানে প্রবেশ করা যাবে না।'
              : 'Enable at least one access mode, otherwise your institution will be inaccessible.'}
          </div>
        </div>
      )}

      {/* Access Modes */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'অ্যাক্সেস পদ্ধতি নির্বাচন করুন' : 'Select Access Methods'}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Path-based */}
          <AccessModeCard
            enabled={modes.pathBased}
            onToggle={() => setModes((p) => ({ ...p, pathBased: !p.pathBased }))}
            title={isBn ? 'পাথ-বেসড (Path-based)' : 'Path-based'}
            description={isBn
              ? 'ব্রাউজারে URL দিয়ে সরাসরি প্রবেশ করুন'
              : 'Access directly via URL path'}
            example={isBn ? 'example.com/i/আপনার-স্লাগ' : 'example.com/i/your-slug'}
            url={pathUrl}
            copiedField={copiedField}
            fieldKey="path"
            onCopy={handleCopy}
          />

          {/* Subdomain-based */}
          <AccessModeCard
            enabled={modes.subdomainBased}
            onToggle={() => setModes((p) => ({ ...p, subdomainBased: !p.subdomainBased }))}
            title={isBn ? 'সাবডোমেইন (Subdomain)' : 'Subdomain'}
            description={isBn
              ? 'আলাদা সাবডোমেইন দিয়ে প্রবেশ করুন'
              : 'Access via a dedicated subdomain'}
            example={`${subdomain}.smsappbd.vercel.app`}
            url={subdomainUrl}
            copiedField={copiedField}
            fieldKey="subdomain"
            onCopy={handleCopy}
          />

          {/* Custom Domain */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                <Globe size={28} className={customDomainInput ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] mb-1">
                  {isBn ? 'কাস্টম ডোমেইন (Custom Domain)' : 'Custom Domain'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
                  {isBn ? 'নিজের ডোমেইন ব্যবহার করুন (ঐচ্ছিক)' : 'Use your own domain (optional)'}
                </div>
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder="abcschool.com"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
                />
                {customDomainInput && (
                  <div className="mt-3 space-y-3">
                    {/* URL preview */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                      <Link size={12} className="text-[var(--text-muted)] shrink-0" />
                      <code className="text-[0.6875rem] text-[var(--text-primary)] truncate flex-1">{customUrl}</code>
                      <button onClick={() => handleCopy(customUrl, 'custom')}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-0">
                        {copiedField === 'custom' ? <CheckCircle size={12} className="text-[var(--green)]" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* DNS Instructions */}
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                      <div className="flex items-center gap-2 mb-2">
                        <Server size={13} className="text-blue-600" />
                        <span className="text-[0.6875rem] font-semibold text-blue-700">
                          {isBn ? 'DNS কনফিগারেশন' : 'DNS Configuration'}
                        </span>
                      </div>
                      <div className="space-y-2 text-[0.6875rem] text-[var(--text-secondary)]">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-semibold shrink-0">1.</span>
                          <span>
                            {isBn ? 'আপনার ডোমেইন রেজিস্ট্রারে যান' : 'Go to your domain registrar'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-semibold shrink-0">2.</span>
                          <span>
                            {isBn ? 'একটি CNAME রেকর্ড যোগ করুন:' : 'Add a CNAME record:'}
                          </span>
                        </div>
                        <div className="ml-5 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] font-mono text-[0.625rem]">
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--text-muted)]">Type:</span>
                            <span className="text-[var(--text-primary)] font-semibold">CNAME</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[var(--text-muted)]">Name:</span>
                            <span className="text-[var(--text-primary)] font-semibold">@</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[var(--text-muted)]">Value:</span>
                            <span className="text-[var(--text-primary)] font-semibold">cname.vercel-dns.com</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-semibold shrink-0">3.</span>
                          <span>
                            {isBn
                              ? 'DNS প্রসারণে ২৪-৪৮ ঘণ্টা সময় লাগতে পারে'
                              : 'DNS propagation may take 24-48 hours'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active URLs Summary */}
      {(modes.pathBased || modes.subdomainBased || customDomainInput.trim()) && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'সক্রিয় URL' : 'Active URLs'}
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {modes.pathBased && (
              <UrlRow label="Path" url={pathUrl} copiedField={copiedField} fieldKey="path" onCopy={handleCopy} />
            )}
            {modes.subdomainBased && (
              <UrlRow label="Subdomain" url={subdomainUrl} copiedField={copiedField} fieldKey="subdomain" onCopy={handleCopy} />
            )}
            {customDomainInput.trim() && (
              <UrlRow label="Custom" url={customUrl} copiedField={copiedField} fieldKey="custom" onCopy={handleCopy} />
            )}
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !atLeastOneMode}
          className="h-10 px-6 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center gap-2 disabled:opacity-50 text-white transition-all"
          style={{ background: saved ? 'var(--green)' : 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <><CheckCircle size={14} />{isBn ? 'সংরক্ষিত!' : 'Saved!'}</> : <><Save size={14} />{isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}</>}
        </button>
      </div>
    </div>
  )
}

function AccessModeCard({
  enabled, onToggle, title, description, example, url, copiedField, fieldKey, onCopy,
}: {
  enabled: boolean; onToggle: () => void; title: string; description: string;
  example: string; url: string; copiedField: string | null; fieldKey: string;
  onCopy: (text: string, field: string) => void
}) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${enabled ? 'border-[var(--brand)]/30 bg-[var(--bg-secondary)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] opacity-60'}`}>
      <button onClick={onToggle} className="mt-0.5 cursor-pointer bg-transparent border-none p-0">
        {enabled ? (
          <ToggleRight size={28} className="text-[var(--green)]" />
        ) : (
          <ToggleLeft size={28} className="text-[var(--text-muted)]" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] mb-0.5">{title}</div>
        <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{description}</div>
        <div className="text-[0.625rem] text-[var(--text-muted)] mb-2 font-mono">{example}</div>
        {enabled && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
            <Link size={12} className="text-[var(--text-muted)] shrink-0" />
            <code className="text-[0.6875rem] text-[var(--text-primary)] truncate flex-1">{url}</code>
            <button onClick={() => onCopy(url, fieldKey)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-0">
              {copiedField === fieldKey ? <CheckCircle size={12} className="text-[var(--green)]" /> : <Copy size={12} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function UrlRow({ label, url, copiedField, fieldKey, onCopy }: {
  label: string; url: string; copiedField: string | null; fieldKey: string;
  onCopy: (text: string, field: string) => void
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
      <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-16 shrink-0">{label}</span>
      <code className="text-[0.6875rem] text-[var(--text-primary)] truncate flex-1">{url}</code>
      <button onClick={() => onCopy(url, fieldKey)}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-0 shrink-0">
        {copiedField === fieldKey ? <CheckCircle size={12} className="text-[var(--green)]" /> : <Copy size={12} />}
      </button>
    </div>
  )
}

function SettingsContent({ isBn }: { isBn: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    authApi.getSuperAdmin()
      .then((data) => setEmail(data.email))
      .catch(() => setError(isBn ? 'সার্ভার থেকে তথ্য আনতে ব্যর্থ' : 'Failed to load from server'))
  }, [isBn])

  const handleSave = async () => {
    if (!email) {
      setError(isBn ? 'ইমেইল প্রয়োজন' : 'Email is required')
      return
    }
    if (password && password.length < 6) {
      setError(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর' : 'Password must be at least 6 characters')
      return
    }

    setSaving(true)
    setError('')

    try {
      const update: { email?: string; password?: string } = {}
      if (password) update.password = password
      if (Object.keys(update).length > 0) {
        await authApi.updateSuperAdmin(update)
      }
      setSaved(true)
      setPassword('')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError(isBn ? 'সংরক্ষণ ব্যর্থ — সার্ভারে সংযোগ করুন' : 'Save failed — connect to server')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
          <Shield size={20} className="text-[var(--brand)]" />
        </div>
        <div>
          <h1 className="text-[1.125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'সেটিংস' : 'Settings'}
          </h1>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            {isBn ? 'ডাটাবেজে সংরক্ষিত' : 'Saved to database'}
          </p>
        </div>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#6366f115', color: '#6366f1' }}>
            <Mail size={17} />
          </div>
          <div>
            <h2 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'ইমেইল ও পাসওয়ার্ড' : 'Email & Password'}</h2>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'লগইন তথ্য পরিবর্তন করুন' : 'Change login credentials'}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
              <Mail size={12} />
              {isBn ? 'ইমেইল' : 'Email'}
            </label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); setSaved(false) }}
              placeholder="admin@edutech.com"
              className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]" />
          </div>

          <div>
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
              <Lock size={12} />
              {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              <span className="text-[0.625rem] font-normal text-[var(--text-muted)]">({isBn ? 'খালি রাখুন পরিবর্তন না করতে চাইলে' : 'leave blank to keep current'})</span>
            </label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); setSaved(false) }}
                placeholder={isBn ? 'নতুন পাসওয়ার্ড' : 'New password'}
                className="w-full h-10 px-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center gap-2">
              <AlertTriangle size={14} className="text-[var(--red)] shrink-0" />
              <div className="text-[0.75rem] text-[var(--red)]">{error}</div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving || !email}
            className="w-full h-10 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-white transition-all"
            style={{ background: saved ? 'var(--green)' : 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <><CheckCircle size={14} />{isBn ? 'সংরক্ষিত!' : 'Saved!'}</> : <><Save size={14} />{isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
