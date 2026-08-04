import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Building2, MapPin, Phone, Clock, Globe, CalendarDays,
  ChevronRight, ChevronLeft, Check, X, Eye, EyeOff, Sparkles,
  Palette, GraduationCap, Shield, Copy, Upload,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSuperAdminStore, PACKAGES, type Institution, type InstitutionPackage } from '@/store/superAdminStore'
import { defaultThemeColors } from '@/store/classStore'
import { sendVerificationCode } from '@/lib/emailService'

interface SchoolForm {
  name: string
  nameBn: string
  email: string
  phone: string
  address: string
  addressBn: string
  eiin: string
  website: string
  brandName: string
  logo: string
  banner: string
  motto: string
  mottoBn: string
  optionalSubjects: string[]
  sessions: string[]
  startTime: string
  endTime: string
  package: InstitutionPackage
  adminEmail: string
  adminPassword: string
  brandColor: string
  subdomain: string
}

const BASE_URL = 'smsappbd.vercel.app'

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

const defaultForm: SchoolForm = {
  name: '', nameBn: '', email: '', phone: '', address: '', addressBn: '',
  eiin: '', website: '', brandName: '', logo: '', banner: '', motto: '', mottoBn: '',
  optionalSubjects: [], sessions: ['2025-26'], startTime: '07:30', endTime: '14:30',
  package: PACKAGES[0], adminEmail: '', adminPassword: '',
  brandColor: defaultThemeColors.brand, subdomain: '',
}

interface SectionStep {
  key: string
  labelEn: string
  labelBn: string
  icon: React.ReactNode
}

const SECTION_STEPS: SectionStep[] = [
  { key: 'basic', labelEn: 'School Info', labelBn: 'স্কুল তথ্য', icon: <Building2 size={14} /> },
  { key: 'contact', labelEn: 'Contact', labelBn: 'যোগাযোগ', icon: <Phone size={14} /> },
  { key: 'brand', labelEn: 'Branding', labelBn: 'ব্র্যান্ডিং', icon: <Palette size={14} /> },
  { key: 'academic', labelEn: 'Academic & Package', labelBn: 'একাডেমিক ও প্যাকেজ', icon: <GraduationCap size={14} /> },
  { key: 'admin', labelEn: 'Admin Account', labelBn: 'অ্যাডমিন', icon: <Shield size={14} /> },
]

const PRESET_COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#06b6d4', '#f97316']

export default function CreateSchool() {
  const isBn = useBn()
  const navigate = useNavigate()
  const addInstitution = useSuperAdminStore((s) => s.addInstitution)
  const institutions = useSuperAdminStore((s) => s.institutions)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<SchoolForm>(defaultForm)
  const [newSubject, setNewSubject] = useState('')
  const [newSession, setNewSession] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [created, setCreated] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailCodeInput, setEmailCodeInput] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [emailError, setEmailError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const currentSection = SECTION_STEPS[step]
  const isLastStep = step === SECTION_STEPS.length - 1

  const set = <K extends keyof SchoolForm>(key: K, val: SchoolForm[K]) => setForm((f) => ({ ...f, [key]: val }))

  const passwordValidation = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      met: form.adminPassword.length > 0 && rule.test(form.adminPassword),
    }))
  }, [form.adminPassword])

  const isPasswordValid = form.adminPassword.length > 0 && passwordValidation.every((r) => r.met)

  const canNext = useMemo(() => {
    if (!currentSection) return true
    switch (currentSection.key) {
      case 'basic': return form.name.trim().length > 0
      case 'academic': return form.sessions.length > 0
      case 'admin': return form.adminEmail.trim().length > 0 && emailVerified && isPasswordValid
      default: return true
    }
  }, [currentSection, form, emailVerified, isPasswordValid])

  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => navigate('/super-admin/schools'), 300)
  }

  const handleCreate = () => {
    const subdomain = form.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const inst: Institution = {
      id: `INST-${Date.now()}`,
      name: form.name,
      nameBn: form.nameBn || form.name,
      email: form.adminEmail || form.email,
      phone: form.phone,
      address: form.address,
      addressBn: form.addressBn || form.address,
      eiin: form.eiin,
      website: subdomain ? `${BASE_URL}/i/${subdomain}` : BASE_URL,
      subdomain: subdomain || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      slug: subdomain || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      status: 'active',
      package: form.package,
      usedStorageMB: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: '-',
      logo: form.logo,
      banner: form.banner,
      brandColor: form.brandColor,
      brandName: form.brandName || 'EduTech',
      motto: form.motto,
      mottoBn: form.mottoBn,
      startTime: form.startTime,
      endTime: form.endTime,
      optionalSubjects: form.optionalSubjects,
      sessions: form.sessions,
      password: form.adminPassword,
      accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
    }
    addInstitution(inst)
    setCreated(true)
    setTimeout(() => navigate('/super-admin/schools'), 1500)
  }

  if (created) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--bg-primary)] rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--green)] flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{isBn ? 'স্কুল তৈরি হয়েছে!' : 'School Created!'}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{isBn ? `${form.name} সফলভাবে নিবন্ধন করা হয়েছে` : `${form.name} has been registered successfully`}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setCreated(false); navigate('/super-admin/schools') }} className="px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold cursor-pointer border-none">
              {isBn ? 'স্কুল দেখুন' : 'View Schools'}
            </button>
            <button onClick={() => { setForm(defaultForm); setCreated(false); setStep(0) }} className="px-5 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-semibold cursor-pointer border border-[var(--border)]">
              {isBn ? 'আরেকটি যোগ করুন' : 'Add Another'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Popup Window - Full Width x Full Height */}
      <div className={`w-full h-full bg-[var(--bg-primary)] shadow-2xl flex overflow-hidden transition-all duration-300 ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>

        {/* Left Column - Live Preview */}
        <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
          <PreviewPanel form={form} isBn={isBn} />
        </div>

        {/* Right Column - Input */}
        <div className="w-full lg:w-[420px] flex flex-col border-l border-[var(--border)] overflow-hidden shrink-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--brand-light)]">
                <Sparkles size={16} className="text-[var(--brand)]" />
              </div>
              <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">{isBn ? 'নতুন স্কুল' : 'New School'}</h2>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">{step + 1}/{SECTION_STEPS.length} — {isBn ? currentSection?.labelBn : currentSection?.labelEn}</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer border-none bg-transparent transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 py-2.5 border-b border-[var(--border)] shrink-0">
            <div className="h-1 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-500" style={{ width: `${((step + 1) / SECTION_STEPS.length) * 100}%` }} />
            </div>
          </div>

          {/* Field */}
          <div className="flex-1 px-6 py-5 overflow-y-auto">
            <div className="min-h-full flex flex-col justify-center">
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] text-[0.625rem] font-medium text-[var(--text-muted)] mb-2.5">
                  <span className="text-[var(--brand)]">{currentSection?.icon}</span>
                  {isBn ? currentSection?.labelBn : currentSection?.labelEn}
                </div>
              </div>

              <div className="space-y-4">
                {currentSection?.key === 'basic' && (
                  <>
                    <FieldInput ref={inputRef} label={isBn ? 'স্কুলের নাম *' : 'School Name *'} value={form.name} onChange={(v) => set('name', v)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. Sunrise Academy'} hint={isBn ? 'স্কুলের আনুষ্ঠানিক নাম' : 'The official name of the school'} />
                    <FieldInput label={isBn ? 'বাংলায় নাম' : 'Bengali Name'} value={form.nameBn} onChange={(v) => set('nameBn', v)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. সানরাইজ একাডেমি'} hint={isBn ? 'বাংলা লিপিতে স্কুলের নাম' : 'School name in Bengali script'} />
                    <FieldInput label={isBn ? 'ব্র্যান্ড নাম' : 'Brand Name'} value={form.brandName} onChange={(v) => set('brandName', v)} placeholder={isBn ? 'যেমন: EduTech' : 'e.g. EduTech'} hint={isBn ? 'সিস্টেমের জন্য ছোট ব্র্যান্ড নাম' : 'Short brand name for the system'} />
                    <FieldInput label="EIIN" value={form.eiin} onChange={(v) => set('eiin', v)} placeholder="123456" hint={isBn ? 'শিক্ষা প্রতিষ্ঠান শনাক্তকরণ নম্বর' : 'Education Institution Identification Number'} />
                    <SubdomainInput value={form.subdomain} onChange={(v) => set('subdomain', v)} institutions={institutions} isBn={isBn} />
                  </>
                )}
                {currentSection?.key === 'contact' && (
                  <>
                    <FieldInput ref={inputRef} label={isBn ? 'ইমেইল' : 'Email'} type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="info@school.edu.bd" hint={isBn ? 'যোগাযোগের ইমেইল' : 'General contact email'} />
                    <FieldInput label={isBn ? 'ফোন' : 'Phone'} value={form.phone} onChange={(v) => set('phone', v)} placeholder="+880-2-1234567" hint={isBn ? 'স্কুলের ফোন নম্বর' : 'School phone number'} />
                    <FieldInput label={isBn ? 'ঠিকানা' : 'Address'} value={form.address} onChange={(v) => set('address', v)} placeholder={isBn ? 'বাসা নং, রাস্তা, শহর' : 'House, Road, City'} hint={isBn ? 'স্কুলের সম্পূর্ণ ঠিকানা' : 'Full address of the school'} />
                    <FieldInput label={isBn ? 'ঠিকানা (বাংলা)' : 'Address (Bengali)'} value={form.addressBn} onChange={(v) => set('addressBn', v)} placeholder={isBn ? 'বাসা নং, রাস্তা, শহর' : 'বাসা নং, রাস্তা, শহর'} hint={isBn ? 'বাংলায় ঠিকানা' : 'Address in Bengali'} />
                  </>
                )}
                {currentSection?.key === 'brand' && (
                  <>
                    <FieldInput label={isBn ? 'মোটো (ইংরেজি)' : 'Motto (English)'} value={form.motto} onChange={(v) => set('motto', v)} placeholder="Knowledge is Power" hint={isBn ? 'ইংরেজিতে স্কুলের মোটো' : 'School motto in English'} />
                    <FieldInput label={isBn ? 'মোটো (বাংলা)' : 'Motto (Bengali)'} value={form.mottoBn} onChange={(v) => set('mottoBn', v)} placeholder="জ্ঞাই হলো শক্তি" hint={isBn ? 'বাংলায় স্কুলের মোটো' : 'School motto in Bengali'} />
                    <FileUpload label={isBn ? 'লোগো' : 'Logo'} value={form.logo} onChange={(v) => set('logo', v)} accept="image/*" isBn={isBn} />
                    <FileUpload label={isBn ? 'ব্যানার' : 'Banner'} value={form.banner} onChange={(v) => set('banner', v)} accept="image/*" isBn={isBn} aspect="banner" />
                    <ColorPicker value={form.brandColor} onChange={(v) => set('brandColor', v)} />
                  </>
                )}
                {currentSection?.key === 'academic' && (
                  <>
                    <TagInput ref={inputRef} tags={form.optionalSubjects} onAdd={(t) => set('optionalSubjects', [...form.optionalSubjects, t])} onRemove={(t) => set('optionalSubjects', form.optionalSubjects.filter((x) => x !== t))} newTag={newSubject} setNewTag={setNewSubject} placeholder={isBn ? 'ঐচ্ছিক বিষয় যোগ করুন' : 'Add optional subject'} label={isBn ? 'ঐচ্ছিক বিষয়সমূহ' : 'Optional Subjects'} hint={isBn ? 'যেমন: উচ্চতর গণিত, কৃষি, আইসিটি' : 'e.g. Higher Math, Agriculture, ICT'} />
                    <TagInput tags={form.sessions} onAdd={(t) => set('sessions', [...form.sessions, t])} onRemove={(t) => set('sessions', form.sessions.filter((x) => x !== t))} newTag={newSession} setNewTag={setNewSession} placeholder="2026-27" label={isBn ? 'একাডেমিক সেশন *' : 'Academic Sessions *'} hint={isBn ? 'একাডেমিক সেশন (যেমন: 2025-26)' : 'Academic sessions (e.g. 2025-26)'} />
                    <ScheduleInput form={form} set={set} isBn={isBn} />
                    <PackagePicker value={form.package} onChange={(v) => set('package', v)} isBn={isBn} />
                  </>
                )}
                {currentSection?.key === 'admin' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{isBn ? 'অ্যাডমিন ইমেইল *' : 'Admin Email *'}</label>
                      <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'স্কুল অ্যাডমিনের লগইন ইমেইল' : 'Login email for the school admin'}</p>
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          type="email"
                          value={form.adminEmail}
                          onChange={(e) => { set('adminEmail', e.target.value); setEmailSent(false); setEmailVerified(false); setEmailCode(''); setEmailError('') }}
                          placeholder="admin@school.edu.bd"
                          disabled={emailVerified}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all disabled:opacity-50"
                        />
                        {!emailVerified && (
                          <button
                            onClick={async () => {
                              if (form.adminEmail.includes('@')) {
                                setSendingCode(true)
                                setEmailError('')
                                const code = Math.random().toString(36).slice(-6).toUpperCase()
                                const result = await sendVerificationCode(form.adminEmail, code)
                                if (result.success) {
                                  setEmailCode(code)
                                  setEmailSent(true)
                                } else {
                                  setEmailError(isBn ? 'কোড পাঠাতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Failed to send code. Please try again.')
                                }
                                setSendingCode(false)
                              }
                            }}
                            disabled={!form.adminEmail.includes('@') || emailSent || sendingCode}
                            className="px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            {sendingCode ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : emailSent ? (isBn ? 'পাঠানো হয়েছে' : 'Sent') : (isBn ? 'কোড পাঠান' : 'Send Code')}
                          </button>
                        )}
                        {emailVerified && (
                          <div className="px-3 py-2.5 rounded-xl bg-[var(--green)]/10 text-[var(--green)] text-xs font-semibold flex items-center gap-1.5 shrink-0">
                            <Check size={14} /> {isBn ? 'যাচাইকৃত' : 'Verified'}
                          </div>
                        )}
                      </div>
                      {emailError && (
                        <p className="text-[0.6875rem] text-[var(--red)] mt-1.5">{emailError}</p>
                      )}
                    </div>
                    {emailSent && !emailVerified && (
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{isBn ? 'যাচাইকরণ কোড' : 'Verification Code'}</label>
                        <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBn ? `${form.adminEmail}-এ ৬-ডিজিট কোড পাঠানো হয়েছে` : `A 6-digit code was sent to ${form.adminEmail}`}</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={emailCodeInput}
                            onChange={(e) => setEmailCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                            placeholder="XXXXXX"
                            maxLength={6}
                            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-mono tracking-widest outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all"
                          />
                          <button
                            onClick={() => { if (emailCodeInput === emailCode) setEmailVerified(true) }}
                            disabled={emailCodeInput.length < 6}
                            className="px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            {isBn ? 'যাচাই করুন' : 'Verify'}
                          </button>
                        </div>
                        {emailCodeInput && emailCodeInput !== emailCode && (
                          <p className="text-[0.6875rem] text-[var(--red)] mt-1">{isBn ? 'ভুল কোড' : 'Invalid code'}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{isBn ? 'পাসওয়ার্ড *' : 'Password *'}</label>
                      <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'অ্যাডমিন অ্যাকাউন্টের পাসওয়ার্ড' : 'Password for the admin account'}</p>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.adminPassword}
                          onChange={(e) => set('adminPassword', e.target.value)}
                          placeholder={isBn ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
                          className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    {form.adminPassword.length > 0 && (
                      <div className="space-y-1.5">
                        {passwordValidation.map((rule) => (
                          <div key={rule.label} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${rule.met ? 'bg-[var(--green)]' : 'bg-[var(--bg-secondary)] border border-[var(--border)]'}`}>
                              {rule.met && <Check size={10} className="text-white" />}
                            </div>
                            <span className={`text-[0.6875rem] ${rule.met ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>{isBn ? rule.labelBn : rule.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center gap-3 shrink-0">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--bg-tertiary)]"
            >
              <ChevronLeft size={13} />
              {isBn ? 'আগে' : 'Back'}
            </button>

            {isLastStep ? (
              <button
                onClick={handleCreate}
                disabled={!canNext}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--green)] text-white cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              >
                <Check size={13} />
                {isBn ? 'তৈরি করুন' : 'Create'}
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              >
                {isBn ? 'পরবর্তী' : 'Next'}
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ─── Preview Panel — matches InstitutionTab view mode ─── */
function PreviewPanel({ form, isBn }: { form: SchoolForm; isBn: boolean }) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden">
        {form.banner ? (
          <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${form.brandColor} 0%, ${form.brandColor}aa 100%)` }} />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Profile */}
      <div className="relative px-5 pb-6">
        {/* Logo */}
        <div className="absolute -top-14 left-5">
          <div className="w-28 h-28 rounded-2xl border-4 border-[var(--bg-secondary)] bg-[var(--bg-primary)] shadow-xl overflow-hidden">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: `${form.brandColor}15` }}>
                <Building2 size={36} className="text-[var(--brand)]" />
              </div>
            )}
          </div>
        </div>

        {/* Institution Info */}
        <div className="pt-16">
          <div className="p-2 -mx-2 rounded-xl">
            <h2 className="text-base font-bold text-[var(--text-primary)] m-0 leading-tight">
              {form.name || (isBn ? 'আপনার স্কুলের নাম' : 'Your School Name')}
            </h2>
            <p className="text-[0.6875rem] text-[var(--text-muted)] m-0 mt-0.5">
              {form.nameBn || (isBn ? 'বাংলায় নাম' : 'Bengali name')}
            </p>
          </div>

          {form.brandName && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--brand-light)]">
              <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">{isBn ? 'ব্র্যান্ড' : 'Brand'}: {form.brandName}</span>
            </div>
          )}

          {form.motto && (
            <p className="text-[0.6875rem] text-[var(--text-muted)] italic m-0 mt-1.5">
              "{form.motto}"{form.mottoBn ? ` / "${form.mottoBn}"` : ''}
            </p>
          )}

          {/* Contact Card */}
          {(form.phone || form.email || form.website || form.address) && (
            <div className="mt-4 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {form.phone && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}15` }}>
                      <Phone size={14} style={{ color: form.brandColor }} />
                    </div>
                    <div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ফোন' : 'Phone'}</div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{form.phone}</div>
                      {form.eiin && <div className="text-[0.625rem] text-[var(--text-muted)]">EIIN: {form.eiin}</div>}
                    </div>
                  </div>
                )}
                {(form.email || form.subdomain) && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}15` }}>
                      <Globe size={14} style={{ color: form.brandColor }} />
                    </div>
                    <div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ইমেইল / ওয়েবসাইট' : 'Email / Website'}</div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{form.email}</div>
                      {form.subdomain && <div className="text-[0.625rem] text-[var(--text-muted)]">{BASE_URL}/i/{form.subdomain}</div>}
                    </div>
                  </div>
                )}
                {form.address && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}15` }}>
                      <MapPin size={14} style={{ color: form.brandColor }} />
                    </div>
                    <div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ঠিকানা' : 'Address'}</div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{form.address}{form.addressBn ? ` / ${form.addressBn}` : ''}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Schedule Card */}
            <div className={`p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${form.brandColor}15` }}>
                  <Clock size={12} style={{ color: form.brandColor }} />
                </div>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{isBn ? 'সময়সূচি' : 'Schedule'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-[0.625rem] text-[var(--text-muted)] mb-0.5">{isBn ? 'শুরু' : 'Start'}</div>
                  <div className="text-sm font-bold" style={{ color: form.brandColor }}>{form.startTime || '--:--'}</div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-[0.625rem] text-[var(--text-muted)] mb-0.5">{isBn ? 'শেষ' : 'End'}</div>
                  <div className="text-sm font-bold" style={{ color: form.brandColor }}>{form.endTime || '--:--'}</div>
                </div>
              </div>
            </div>

            {/* Session & Subjects Card */}
            <div className={`p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${form.brandColor}15` }}>
                  <CalendarDays size={12} style={{ color: form.brandColor }} />
                </div>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{isBn ? 'একাডেমিক সেশন' : 'Academic Session'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold" style={{ color: form.brandColor }}>{form.sessions[0] || '—'}</span>
                  <span className="text-[0.625rem] text-[var(--text-muted)]">({isBn ? 'বর্তমান' : 'Current'})</span>
                </div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                  {form.sessions.length} {isBn ? 'টি সেশন সংরক্ষিত' : 'sessions saved'}
                </div>
              </div>
              {form.optionalSubjects.length > 0 && (
                <div>
                  <div className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'ঐচ্ছিক বিষয়' : 'Optional Subjects'}</div>
                  <div className="flex flex-wrap gap-1">
                    {form.optionalSubjects.map((s) => (
                      <span key={s} className="text-[0.625rem] px-2 py-0.5 rounded-full font-medium" style={{ background: `${form.brandColor}15`, color: form.brandColor }}>{s}</span>
                    ))}
                      </div>
                    </div>
              )}
            </div>
          </div>

          {/* Package Badge */}
          <div className="mt-3 flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[var(--brand-light)] text-[0.6875rem] font-semibold text-[var(--brand)]">
              {isBn ? form.package.nameBn : form.package.name}
            </div>
            <div className="text-[0.625rem] text-[var(--text-muted)]">
              {form.package.maxStudents} {isBn ? 'জন ছাত্র' : 'students'} · {form.package.maxTeachers} {isBn ? 'জন শিক্ষক' : 'teachers'} · {form.package.maxClasses} {isBn ? 'টি ক্লাস' : 'classes'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Shared Components ─── */
function FieldInput({ ref, label, type = 'text', value, onChange, placeholder, hint }: {
  ref?: React.Ref<HTMLInputElement>; label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{label}</label>
      {hint && <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{hint}</p>}
      <input ref={ref} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all" />
    </div>
  )
}

function ScheduleInput({ form, set, isBn }: { form: SchoolForm; set: <K extends keyof SchoolForm>(k: K, v: SchoolForm[K]) => void; isBn: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{isBn ? 'ক্লাস সময়সূচি' : 'Class Schedule'}</label>
      <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'দৈনিক ক্লাসের শুরু ও শেষের সময়' : 'Daily class start and end time'}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.625rem] text-[var(--text-muted)] mb-1">{isBn ? 'শুরুর সময়' : 'Start Time'}</label>
          <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
        </div>
        <div>
          <label className="block text-[0.625rem] text-[var(--text-muted)] mb-1">{isBn ? 'শেষের সময়' : 'End Time'}</label>
          <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
        </div>
      </div>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{isBnShort() ? 'ব্র্যান্ড রং' : 'Brand Color'}</label>
      <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBnShort() ? 'ইউআই-এর প্রাথমিক ব্র্যান্ড রং' : 'Primary brand color for the UI'}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {PRESET_COLORS.map((c) => (
          <button key={c} onClick={() => onChange(c)} className={`w-8 h-8 rounded-lg cursor-pointer border-2 transition-all ${value === c ? 'border-[var(--text-primary)] scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--border)]" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand)]" />
      </div>
    </div>
  )
}

function FileUpload({ label, value, onChange, accept, isBn, aspect = 'logo' }: {
  label: string; value: string; onChange: (v: string) => void; accept: string; isBn: boolean; aspect?: 'logo' | 'banner'
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const isBanner = aspect === 'banner'

  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{label}</label>
      <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'ফাইল থেকে ছবি নির্বাচন করুন' : 'Select image from file'}</p>
      <input ref={fileRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      <div
        onClick={() => fileRef.current?.click()}
        className={`relative group cursor-pointer rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--brand)] transition-colors overflow-hidden ${isBanner ? 'h-32' : 'h-28'}`}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs text-white font-medium">{isBn ? 'পরিবর্তন করুন' : 'Change'}</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[var(--bg-secondary)]">
            <Upload size={20} className="text-[var(--text-muted)]" />
            <span className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ক্লিক করুন' : 'Click to upload'}</span>
          </div>
        )}
      </div>
      {value && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange('') }}
          className="mt-1.5 text-[0.625rem] text-[var(--red)] hover:underline cursor-pointer bg-transparent border-none"
        >
          {isBn ? 'মুছুন' : 'Remove'}
        </button>
      )}
    </div>
  )
}

function TagInput({ ref, tags, onAdd, onRemove, newTag, setNewTag, placeholder, label, hint }: {
  ref?: React.Ref<HTMLInputElement>; tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void
  newTag: string; setNewTag: (v: string) => void; placeholder: string; label: string; hint?: string
}) {
  const add = () => {
    const t = newTag.trim()
    if (t && !tags.includes(t)) { onAdd(t); setNewTag('') }
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{label}</label>
      {hint && <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{hint}</p>}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--brand-light)] text-[var(--brand)]">
            {t}
            <button onClick={() => onRemove(t)} className="ml-0.5 rounded-full hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border-none bg-transparent p-0 text-[var(--brand)]"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input ref={ref} value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={placeholder} className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
        <button onClick={add} className="px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer border-none">{isBnShort() ? 'যোগ' : 'Add'}</button>
      </div>
    </div>
  )
}

function isBnShort() {
  try { return document.documentElement.lang === 'bn' } catch { return false }
}

function SubdomainInput({ value, onChange, institutions, isBn }: {
  value: string; onChange: (v: string) => void; institutions: Institution[]; isBn: boolean
}) {
  const [slug, setSlug] = useState(value)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)

  const checkAvailability = (v: string) => {
    setSlug(v)
    onChange(v)
    if (!v.trim()) { setAvailable(null); return }
    const taken = institutions.some((inst) => inst.subdomain === v.toLowerCase())
    setAvailable(!taken)
  }

  const displayUrl = slug ? `${BASE_URL}/i/${slug}` : `${BASE_URL}`

  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">{isBn ? 'ইনস্টিটিউশন লগইন URL' : 'Institution Login URL'}</label>
      <p className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'ইন্সটিটিউশনের ইউনিক পাথ' : 'Unique path for this institution'}</p>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/10 transition-all overflow-hidden">
        <div className="flex items-center">
          <span className="px-3.5 py-2.5 text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] border-r border-[var(--border)] shrink-0">{BASE_URL}/i/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => checkAvailability(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder={isBn ? 'সাবডোমেইন' : 'subdomain'}
            className="flex-1 min-w-0 px-3.5 py-2.5 bg-transparent text-sm text-[var(--text-primary)] outline-none"
          />
          <button
            onClick={() => { navigator.clipboard.writeText(displayUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="px-3 py-2.5 bg-[var(--bg-primary)] border-l border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--brand)] cursor-pointer border-none transition-colors"
            title={isBn ? 'কপি করুন' : 'Copy URL'}
          >
            {copied ? <Check size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
          </button>
        </div>
        {slug && (
          <div className="px-3.5 py-2 border-t border-[var(--border)] bg-[var(--bg-primary)]">
            <p className="text-[0.625rem] text-[var(--brand)] font-mono truncate">{displayUrl}</p>
          </div>
        )}
      </div>
      {slug && (
        <p className={`text-[0.625rem] mt-1.5 ${available === false ? 'text-[var(--red)]' : available === true ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>
          {available === false ? (isBn ? 'এই URL ইতিমধ্যে ব্যবহৃত' : 'This URL is already taken') :
           available === true ? (isBn ? 'URL পাওয়া যাচ্ছে' : 'URL is available') :
           (isBn ? 'URL চেক করা হচ্ছে...' : 'Checking availability...')}
        </p>
      )}
    </div>
  )
}

function PackagePicker({ value, onChange, isBn }: { value: InstitutionPackage; onChange: (v: InstitutionPackage) => void; isBn: boolean }) {
  return (
    <div className="space-y-2">
      {PACKAGES.map((pkg) => {
        const selected = value.name === pkg.name
        return (
          <button key={pkg.name} onClick={() => onChange(pkg)} className={`w-full p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${selected ? 'border-[var(--brand)] bg-[var(--brand-light)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[var(--text-primary)]">{isBn ? pkg.nameBn : pkg.name}</span>
              {selected && <div className="w-4 h-4 rounded-full bg-[var(--brand)] flex items-center justify-center"><Check size={10} className="text-white" /></div>}
            </div>
            <div className="text-sm font-bold text-[var(--brand)] mb-1">{pkg.price === 0 ? (isBn ? 'ফ্রি' : 'Free') : `৳${pkg.price}/${isBn ? 'মাস' : 'mo'}`}</div>
            <div className="flex gap-3 text-[0.625rem] text-[var(--text-secondary)]">
              <span>{pkg.maxStudents} students</span>
              <span>{pkg.maxTeachers} teachers</span>
              <span>{pkg.maxClasses >= 999 ? 'Unlimited' : pkg.maxClasses} classes</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
