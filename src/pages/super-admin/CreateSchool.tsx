import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, MapPin, Phone, Mail, Clock,
  ChevronRight, ChevronLeft, Check, X, Eye, EyeOff, Sparkles,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSuperAdminStore, PACKAGES, type Institution, type InstitutionPackage } from '@/store/superAdminStore'
import { defaultThemeColors } from '@/store/classStore'

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
  motto: string
  mottoBn: string
  subjects: string[]
  sessions: string[]
  startTime: string
  endTime: string
  package: InstitutionPackage
  adminEmail: string
  adminPassword: string
  brandColor: string
}

const defaultForm: SchoolForm = {
  name: '', nameBn: '', email: '', phone: '', address: '', addressBn: '',
  eiin: '', website: '', brandName: '', logo: '', motto: '', mottoBn: '',
  subjects: ['Bangla', 'English', 'Mathematics'],
  sessions: ['2025-26'], startTime: '07:30', endTime: '14:30',
  package: PACKAGES[0], adminEmail: '', adminPassword: '',
  brandColor: defaultThemeColors.brand,
}

interface FieldStep {
  key: string
  section: string
  labelEn: string
  labelBn: string
  required?: boolean
}

const FIELD_STEPS: FieldStep[] = [
  { key: 'name', section: 'basic', labelEn: 'School Name', labelBn: 'স্কুলের নাম', required: true },
  { key: 'nameBn', section: 'basic', labelEn: 'Bengali Name', labelBn: 'বাংলায় নাম' },
  { key: 'email', section: 'contact', labelEn: 'Email', labelBn: 'ইমেইল' },
  { key: 'phone', section: 'contact', labelEn: 'Phone', labelBn: 'ফোন' },
  { key: 'address', section: 'contact', labelEn: 'Address', labelBn: 'ঠিকানা' },
  { key: 'addressBn', section: 'contact', labelEn: 'Address (Bengali)', labelBn: 'ঠিকানা (বাংলা)' },
  { key: 'eiin', section: 'extra', labelEn: 'EIIN', labelBn: 'EIIN' },
  { key: 'website', section: 'extra', labelEn: 'Website', labelBn: 'ওয়েবসাইট' },
  { key: 'brandName', section: 'brand', labelEn: 'Brand Name', labelBn: 'ব্র্যান্ড নাম' },
  { key: 'motto', section: 'brand', labelEn: 'Motto (English)', labelBn: 'মোটো (ইংরেজি)' },
  { key: 'mottoBn', section: 'brand', labelEn: 'Motto (Bengali)', labelBn: 'মোটো (বাংলা)' },
  { key: 'logo', section: 'brand', labelEn: 'Logo URL', labelBn: 'লোগো URL' },
  { key: 'brandColor', section: 'brand', labelEn: 'Brand Color', labelBn: 'ব্র্যান্ড রং' },
  { key: 'subjects', section: 'academic', labelEn: 'Subjects', labelBn: 'বিষয়সমূহ', required: true },
  { key: 'sessions', section: 'academic', labelEn: 'Sessions', labelBn: 'সেশন', required: true },
  { key: 'schedule', section: 'academic', labelEn: 'Class Schedule', labelBn: 'ক্লাস সময়সূচি' },
  { key: 'package', section: 'package', labelEn: 'Package', labelBn: 'প্যাকেজ' },
  { key: 'adminEmail', section: 'admin', labelEn: 'Admin Email', labelBn: 'অ্যাডমিন ইমেইল', required: true },
  { key: 'adminPassword', section: 'admin', labelEn: 'Admin Password', labelBn: 'পাসওয়ার্ড', required: true },
]

const PRESET_COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#06b6d4', '#f97316']

export default function CreateSchool() {
  const isBn = useBn()
  const navigate = useNavigate()
  const addInstitution = useSuperAdminStore((s) => s.addInstitution)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<SchoolForm>(defaultForm)
  const [newSubject, setNewSubject] = useState('')
  const [newSession, setNewSession] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [created, setCreated] = useState(false)
  const [exiting, setExiting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentStep = FIELD_STEPS[step]
  const isLastStep = step === FIELD_STEPS.length - 1

  const set = <K extends keyof SchoolForm>(key: K, val: SchoolForm[K]) => setForm((f) => ({ ...f, [key]: val }))

  const canNext = useMemo(() => {
    if (!currentStep) return true
    switch (currentStep.key) {
      case 'name': return form.name.trim().length > 0
      case 'subjects': return form.subjects.length > 0
      case 'sessions': return form.sessions.length > 0
      case 'adminEmail': return form.adminEmail.trim().length > 0
      case 'adminPassword': return form.adminPassword.trim().length >= 4
      default: return true
    }
  }, [currentStep, form])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [step])

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => navigate('/super-admin/schools'), 200)
  }

  const handleCreate = () => {
    const inst: Institution = {
      id: `INST-${Date.now()}`,
      name: form.name,
      nameBn: form.nameBn || form.name,
      email: form.adminEmail || form.email,
      phone: form.phone,
      address: form.address,
      addressBn: form.addressBn || form.address,
      eiin: form.eiin,
      website: form.website,
      status: 'active',
      package: form.package,
      usedStorageMB: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: '-',
      logo: form.logo,
      brandColor: form.brandColor,
    }
    addInstitution(inst)
    setCreated(true)
  }

  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--bg-primary)] rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--green)] flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{isBn ? 'স্কুল তৈরি হয়েছে!' : 'School Created!'}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{isBn ? `${form.name} সফলভাবে নিবন্ধন করা হয়েছে` : `${form.name} has been registered successfully`}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/super-admin/schools')} className="px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold cursor-pointer border-none">
              {isBn ? 'স্কুল দেখুন' : 'View Schools'}
            </button>
            <button onClick={() => { setForm(defaultForm); setCreated(false); setStep(0) }} className="px-5 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-semibold cursor-pointer border border-[var(--border)]">
              {isBn ? 'আরেকটি যোগ করুন' : 'Add Another'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Left - Input Panel (1/3) */}
      <div className={`w-full lg:w-[380px] xl:w-[420px] bg-[var(--bg-primary)] flex flex-col shadow-2xl transition-transform duration-200 ${exiting ? '-translate-x-full' : 'translate-x-0'}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--brand-light)]">
              <Sparkles size={16} className="text-[var(--brand)]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">{isBn ? 'নতুন স্কুল' : 'New School'}</h2>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">{step + 1}/{FIELD_STEPS.length} — {isBn ? currentStep?.labelBn : currentStep?.labelEn}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer border-none bg-transparent transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-5 py-3">
          <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-300" style={{ width: `${((step + 1) / FIELD_STEPS.length) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            {FIELD_STEPS.map((s, i) => (
              <div key={s.key} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < step ? 'bg-[var(--brand)]' : i === step ? 'bg-[var(--brand)]' : 'bg-[var(--bg-secondary)]'}`} />
            ))}
          </div>
        </div>

        {/* Field Input */}
        <div className="flex-1 px-5 py-4 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
              {isBn ? currentStep?.labelBn : currentStep?.labelEn}
              {currentStep?.required && <span className="text-[var(--red)] ml-1">*</span>}
            </label>
            <p className="text-xs text-[var(--text-muted)]">
              {getHint(currentStep?.key || '', isBn)}
            </p>
          </div>

          <div className="space-y-4">
            {currentStep && renderField(currentStep.key, form, set, {
              newSubject, setNewSubject, newSession, setNewSession,
              showPassword, setShowPassword, isBn, inputRef,
            })}
          </div>

          {currentStep?.key === 'adminPassword' && form.adminPassword && form.adminPassword.length < 4 && (
            <p className="text-xs text-[var(--red)] mt-2">{isBn ? 'কমপক্ষে ৪ অক্ষর প্রয়োজন' : 'Minimum 4 characters required'}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex items-center gap-3">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            <ChevronLeft size={14} />
            {isBn ? 'আগে' : 'Back'}
          </button>

          {isLastStep ? (
            <button
              onClick={handleCreate}
              disabled={!canNext}
              className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--green)] text-white cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
            >
              <Check size={14} />
              {isBn ? 'স্কুল তৈরি করুন' : 'Create School'}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
            >
              {isBn ? 'পরবর্তী' : 'Next'}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right - Live Preview (2/3) */}
      <div className="hidden lg:flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={16} className="text-white/60" />
          <span className="text-sm font-semibold text-white/80">{isBn ? 'লাইভ প্রিভিউ' : 'Live Preview'}</span>
        </div>
        <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl bg-[var(--bg-primary)]">
          <PreviewPanel form={form} isBn={isBn} activeSection={currentStep?.section} />
        </div>
      </div>

      {/* Mobile Preview Toggle */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <button className="w-14 h-14 rounded-full bg-[var(--brand)] text-white shadow-lg flex items-center justify-center cursor-pointer border-none">
          <Eye size={20} />
        </button>
      </div>
    </div>
  )
}

/* ─── Field Renderer ─── */
function renderField(key: string, form: SchoolForm, set: <K extends keyof SchoolForm>(k: K, v: SchoolForm[K]) => void, opts: {
  newSubject: string; setNewSubject: (v: string) => void
  newSession: string; setNewSession: (v: string) => void
  showPassword: boolean; setShowPassword: (v: boolean) => void
  isBn: boolean; inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const { newSubject, setNewSubject, newSession, setNewSession, showPassword, setShowPassword, isBn, inputRef } = opts

  switch (key) {
    case 'name':
      return <InputField ref={inputRef} value={form.name} onChange={(v) => set('name', v)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. Sunrise Academy'} />
    case 'nameBn':
      return <InputField ref={inputRef} value={form.nameBn} onChange={(v) => set('nameBn', v)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. সানরাইজ একাডেমি'} />
    case 'email':
      return <InputField ref={inputRef} type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="info@school.edu.bd" />
    case 'phone':
      return <InputField ref={inputRef} value={form.phone} onChange={(v) => set('phone', v)} placeholder="+880-2-1234567" />
    case 'address':
      return <InputField ref={inputRef} value={form.address} onChange={(v) => set('address', v)} placeholder={isBn ? 'বাসা নং, রাস্তা, শহর' : 'House, Road, City'} />
    case 'addressBn':
      return <InputField ref={inputRef} value={form.addressBn} onChange={(v) => set('addressBn', v)} placeholder={isBn ? 'বাসা নং, রাস্তা, শহর' : 'বাসা নং, রাস্তা, শহর'} />
    case 'eiin':
      return <InputField ref={inputRef} value={form.eiin} onChange={(v) => set('eiin', v)} placeholder="123456" />
    case 'website':
      return <InputField ref={inputRef} value={form.website} onChange={(v) => set('website', v)} placeholder="www.school.edu.bd" />
    case 'brandName':
      return <InputField ref={inputRef} value={form.brandName} onChange={(v) => set('brandName', v)} placeholder={isBn ? 'যেমন: EduTech' : 'e.g. EduTech'} />
    case 'motto':
      return <InputField ref={inputRef} value={form.motto} onChange={(v) => set('motto', v)} placeholder="Knowledge is Power" />
    case 'mottoBn':
      return <InputField ref={inputRef} value={form.mottoBn} onChange={(v) => set('mottoBn', v)} placeholder="জ্ঞাই হলো শক্তি" />
    case 'logo':
      return <InputField ref={inputRef} value={form.logo} onChange={(v) => set('logo', v)} placeholder="https://..." />
    case 'brandColor':
      return <ColorPicker value={form.brandColor} onChange={(v) => set('brandColor', v)} />
    case 'subjects':
      return <TagInput ref={inputRef} tags={form.subjects} onAdd={(t) => set('subjects', [...form.subjects, t])} onRemove={(t) => set('subjects', form.subjects.filter((x) => x !== t))} newTag={newSubject} setNewTag={setNewSubject} placeholder={isBn ? 'বিষয় যোগ করুন' : 'Add subject'} color="brand" />
    case 'sessions':
      return <TagInput ref={inputRef} tags={form.sessions} onAdd={(t) => set('sessions', [...form.sessions, t])} onRemove={(t) => set('sessions', form.sessions.filter((x) => x !== t))} newTag={newSession} setNewTag={setNewSession} placeholder="2026-27" color="green" />
    case 'schedule':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">{isBn ? 'শুরুর সময়' : 'Start Time'}</label>
            <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">{isBn ? 'শেষের সময়' : 'End Time'}</label>
            <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
          </div>
        </div>
      )
    case 'package':
      return <PackagePicker value={form.package} onChange={(v) => set('package', v)} isBn={isBn} />
    case 'adminEmail':
      return <InputField ref={inputRef} type="email" value={form.adminEmail} onChange={(v) => set('adminEmail', v)} placeholder="admin@school.edu.bd" />
    case 'adminPassword':
      return (
        <div className="relative">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={showPassword ? 'text' : 'password'}
            value={form.adminPassword}
            onChange={(e) => set('adminPassword', e.target.value)}
            placeholder={isBn ? 'কমপক্ষে ৪ অক্ষর' : 'At least 4 characters'}
            className="w-full px-3 py-2 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
          />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      )
    default:
      return null
  }
}

/* ─── Hint Text ─── */
function getHint(key: string, isBn: boolean): string {
  const hints: Record<string, { en: string; bn: string }> = {
    name: { en: 'The official name of the school', bn: 'স্কুলের আনুষ্ঠানিক নাম' },
    nameBn: { en: 'School name in Bengali script', bn: 'বাংলা লিপিতে স্কুলের নাম' },
    email: { en: 'General contact email', bn: 'যোগাযোগের ইমেইল' },
    phone: { en: 'School phone number', bn: 'স্কুলের ফোন নম্বর' },
    address: { en: 'Full address of the school', bn: 'স্কুলের সম্পূর্ণ ঠিকানা' },
    addressBn: { en: 'Address in Bengali', bn: 'বাংলায় ঠিকানা' },
    eiin: { en: 'Education Institution Identification Number', bn: 'শিক্ষা প্রতিষ্ঠান শনাক্তকরণ নম্বর' },
    website: { en: 'School website URL', bn: 'স্কুলের ওয়েবসাইট' },
    brandName: { en: 'Short brand name for the system', bn: 'সিস্টেমের জন্য ছোট ব্র্যান্ড নাম' },
    motto: { en: 'School motto in English', bn: 'ইংরেজিতে স্কুলের মোটো' },
    mottoBn: { en: 'School motto in Bengali', bn: 'বাংলায় স্কুলের মোটো' },
    logo: { en: 'URL to the school logo image', bn: 'স্কুল লোগোর URL' },
    brandColor: { en: 'Primary brand color for the UI', bn: 'ইউআই-এর প্রাথমিক ব্র্যান্ড রং' },
    subjects: { en: 'Press Enter or click Add to insert', bn: 'এন্টার চাপুন বা যোগ ক্লিক করুন' },
    sessions: { en: 'Academic sessions (e.g. 2025-26)', bn: 'একাডেমিক সেশন (যেমন: 2025-26)' },
    schedule: { en: 'Daily class start and end time', bn: 'দৈনিক ক্লাসের শুরু ও শেষের সময়' },
    package: { en: 'Storage and limit plan', bn: 'স্টোরেজ ও লিমিট প্ল্যান' },
    adminEmail: { en: 'Login email for the school admin', bn: 'স্কুল অ্যাডমিনের লগইন ইমেইল' },
    adminPassword: { en: 'Minimum 4 characters', bn: 'কমপক্ষে ৪ অক্ষর' },
  }
  const h = hints[key]
  return h ? (isBn ? h.bn : h.en) : ''
}

/* ─── Shared Components ─── */
const InputField = ({ ref, type = 'text', value, onChange, placeholder }: {
  ref?: React.Ref<HTMLInputElement>; type?: string; value: string; onChange: (v: string) => void; placeholder?: string
}) => (
  <input
    ref={ref}
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all"
  />
)

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-10 h-10 rounded-xl cursor-pointer border-2 transition-all ${value === c ? 'border-[var(--text-primary)] scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border border-[var(--border)]" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand)]" />
      </div>
    </div>
  )
}

function TagInput({ ref, tags, onAdd, onRemove, newTag, setNewTag, placeholder, color }: {
  ref?: React.Ref<HTMLInputElement>; tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void
  newTag: string; setNewTag: (v: string) => void; placeholder: string; color: 'brand' | 'green'
}) {
  const add = () => {
    const t = newTag.trim()
    if (t && !tags.includes(t)) { onAdd(t); setNewTag('') }
  }
  const colorClass = color === 'brand' ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'bg-[var(--green-light)] text-[var(--green)]'
  const hoverClass = color === 'brand' ? 'hover:bg-[var(--brand)]' : 'hover:bg-[var(--green)]'
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {tags.map((t) => (
          <span key={t} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {t}
            <button onClick={() => onRemove(t)} className={`ml-0.5 rounded-full hover:text-white transition-colors cursor-pointer border-none bg-transparent p-0 ${colorClass.split(' ')[1]} ${hoverClass}`}><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input ref={ref} value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={placeholder} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
        <button onClick={add} className="px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold cursor-pointer border-none">{isBnShort() ? 'যোগ' : 'Add'}</button>
      </div>
    </div>
  )
}

function isBnShort() {
  try { return document.documentElement.lang === 'bn' } catch { return false }
}

function PackagePicker({ value, onChange, isBn }: { value: InstitutionPackage; onChange: (v: InstitutionPackage) => void; isBn: boolean }) {
  return (
    <div className="space-y-2">
      {PACKAGES.map((pkg) => {
        const selected = value.name === pkg.name
        return (
          <button
            key={pkg.name}
            onClick={() => onChange(pkg)}
            className={`w-full p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
              selected ? 'border-[var(--brand)] bg-[var(--brand-light)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-[var(--text-primary)]">{isBn ? pkg.nameBn : pkg.name}</span>
              {selected && <div className="w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center"><Check size={12} className="text-white" /></div>}
            </div>
            <div className="text-base font-bold text-[var(--brand)] mb-1">{pkg.price === 0 ? (isBn ? 'ফ্রি' : 'Free') : `৳${pkg.price}/${isBn ? 'মাস' : 'mo'}`}</div>
            <div className="flex gap-3 text-[0.6875rem] text-[var(--text-secondary)]">
              <span>👥 {pkg.maxStudents}</span>
              <span>👨‍🏫 {pkg.maxTeachers}</span>
              <span>🏫 {pkg.maxClasses}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Preview Panel ─── */
function PreviewPanel({ form, isBn, activeSection }: { form: SchoolForm; isBn: boolean; activeSection?: string }) {
  const highlight = (section: string) => activeSection === section ? 'ring-2 ring-[var(--brand)] ring-offset-2 rounded-xl' : ''

  return (
    <div className="h-full overflow-y-auto">
      {/* Banner */}
      <div className={`relative h-32 sm:h-40 transition-all duration-300 ${highlight('brand')}`} style={{ background: `linear-gradient(135deg, ${form.brandColor} 0%, ${form.brandColor}99 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Profile */}
      <div className="relative px-6 pb-6">
        <div className="absolute -top-10 left-6">
          <div className={`w-20 h-20 rounded-2xl border-4 border-[var(--bg-primary)] bg-[var(--bg-secondary)] shadow-lg overflow-hidden transition-all duration-300 ${highlight('basic')}`} style={{ borderWidth: '4px' }}>
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: `${form.brandColor}15` }}>
                <Building2 size={28} className="text-[var(--brand)]" />
              </div>
            )}
          </div>
        </div>

        <div className="pt-12">
          <h3 className={`text-lg sm:text-xl font-bold text-[var(--text-primary)] m-0 leading-tight transition-all duration-300 ${highlight('basic')}`}>
            {form.name || (isBn ? 'আপনার স্কুলের নাম' : 'Your School Name')}
          </h3>
          {form.nameBn && <p className={`text-sm text-[var(--text-muted)] m-0 mt-1 transition-all duration-300 ${highlight('basic')}`}>{form.nameBn}</p>}

          {form.brandName && (
            <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-300 ${highlight('brand')}`} style={{ background: `${form.brandColor}12` }}>
              <span className="text-xs font-semibold" style={{ color: form.brandColor }}>{form.brandName}</span>
            </div>
          )}

          {form.motto && (
            <p className={`text-xs text-[var(--text-muted)] italic m-0 mt-2 transition-all duration-300 ${highlight('brand')}`}>"{form.motto}"{form.mottoBn ? ` / "${form.mottoBn}"` : ''}</p>
          )}

          {/* Contact */}
          <div className={`mt-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] transition-all duration-300 ${highlight('contact')}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {form.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}12` }}>
                    <Phone size={14} style={{ color: form.brandColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ফোন' : 'Phone'}</div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{form.phone}</div>
                  </div>
                </div>
              )}
              {form.email && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}12` }}>
                    <Mail size={14} style={{ color: form.brandColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ইমেইল' : 'Email'}</div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{form.email}</div>
                  </div>
                </div>
              )}
              {form.address && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}12` }}>
                    <MapPin size={14} style={{ color: form.brandColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ঠিকানা' : 'Address'}</div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{form.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className={`mt-3 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] transition-all duration-300 ${highlight('academic')}`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} style={{ color: form.brandColor }} />
              <span className="text-xs font-semibold text-[var(--text-primary)]">{isBn ? 'সময়সূচি' : 'Schedule'}</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 p-2.5 rounded-xl bg-[var(--bg-primary)] text-center">
                <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'শুরু' : 'Start'}</div>
                <div className="text-sm font-bold" style={{ color: form.brandColor }}>{form.startTime || '--:--'}</div>
              </div>
              <div className="flex-1 p-2.5 rounded-xl bg-[var(--bg-primary)] text-center">
                <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'শেষ' : 'End'}</div>
                <div className="text-sm font-bold" style={{ color: form.brandColor }}>{form.endTime || '--:--'}</div>
              </div>
            </div>
          </div>

          {/* Package */}
          <div className={`mt-3 flex items-center gap-3 transition-all duration-300 ${highlight('package')}`}>
            <div className="px-3 py-1.5 rounded-xl bg-[var(--brand-light)] text-xs font-semibold text-[var(--brand)]">
              {isBn ? form.package.nameBn : form.package.name}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">
              {form.package.maxStudents} {isBn ? 'জন ছাত্র' : 'students'} · {form.package.maxTeachers} {isBn ? 'জন শিক্ষক' : 'teachers'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
