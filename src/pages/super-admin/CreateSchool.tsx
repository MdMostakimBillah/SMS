import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, MapPin, Phone, Mail, Clock,
  ChevronRight, ChevronLeft, Check, Plus, X, Palette,
  GraduationCap, CreditCard, Shield, Eye, EyeOff,
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

const STEPS = [
  { key: 'basic', icon: Building2, labelEn: 'Basic Info', labelBn: 'মৌলিক তথ্য' },
  { key: 'brand', icon: Palette, labelEn: 'Branding', labelBn: 'ব্র্যান্ডিং' },
  { key: 'academic', icon: GraduationCap, labelEn: 'Academic', labelBn: 'একাডেমিক' },
  { key: 'package', icon: CreditCard, labelEn: 'Package', labelBn: 'প্যাকেজ' },
  { key: 'admin', icon: Shield, labelEn: 'Admin', labelBn: 'অ্যাডমিন' },
  { key: 'review', icon: Eye, labelEn: 'Review', labelBn: 'পর্যালোচনা' },
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

  const set = <K extends keyof SchoolForm>(key: K, val: SchoolForm[K]) => setForm((f) => ({ ...f, [key]: val }))

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return form.name.trim().length > 0
      case 1: return true
      case 2: return form.subjects.length > 0 && form.sessions.length > 0
      case 3: return true
      case 4: return form.adminEmail.trim().length > 0 && form.adminPassword.trim().length >= 4
      case 5: return true
      default: return true
    }
  }, [step, form])

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
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--green)] flex items-center justify-center">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{isBn ? 'স্কুল তৈরি হয়েছে!' : 'School Created!'}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{isBn ? `${form.name} সফলভাবে নিবন্ধন করা হয়েছে` : `${form.name} has been registered successfully`}</p>
        <div className="flex gap-2 mt-2">
          <button onClick={() => navigate('/super-admin/schools')} className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold cursor-pointer border-none">
            {isBn ? 'স্কুল দেখুন' : 'View Schools'}
          </button>
          <button onClick={() => { setForm(defaultForm); setCreated(false); setStep(0) }} className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-semibold cursor-pointer border border-[var(--border)]">
            {isBn ? 'আরেকটি যোগ করুন' : 'Add Another'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 min-h-[calc(100vh-6rem)]">
      {/* Left - Live Preview (2/3 width) */}
      <div className="hidden lg:flex w-2/3 flex-col sticky top-0 h-[calc(100vh-6rem)]">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={16} className="text-[var(--brand)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{isBn ? 'লাইভ প্রিভিউ' : 'Live Preview'}</span>
        </div>
        <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden shadow-lg">
          <PreviewPanel form={form} isBn={isBn} />
        </div>
      </div>

      {/* Right - Form (1/3 width) */}
      <div className="flex-1 lg:w-1/3 flex flex-col">
        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const active = i === step
            const done = i < step
            return (
              <button
                key={s.key}
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer border-none transition-all ${
                  active ? 'bg-[var(--brand)] text-white' : done ? 'bg-[var(--brand-light)] text-[var(--brand)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                } ${i <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                {done ? <Check size={12} /> : <Icon size={12} />}
                <span className="hidden sm:inline">{isBn ? s.labelBn : s.labelEn}</span>
              </button>
            )
          })}
        </div>

        {/* Mobile Preview Toggle */}
        <div className="lg:hidden mb-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden max-h-60">
            <PreviewPanel form={form} isBn={isBn} compact />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5">
          {step === 0 && <StepBasic form={form} set={set} isBn={isBn} />}
          {step === 1 && <StepBrand form={form} set={set} isBn={isBn} />}
          {step === 2 && <StepAcademic form={form} set={set} newSubject={newSubject} setNewSubject={setNewSubject} newSession={newSession} setNewSession={setNewSession} isBn={isBn} />}
          {step === 3 && <StepPackage form={form} set={set} isBn={isBn} />}
          {step === 4 && <StepAdmin form={form} set={set} showPassword={showPassword} setShowPassword={setShowPassword} isBn={isBn} />}
          {step === 5 && <StepReview form={form} isBn={isBn} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            <ChevronLeft size={14} />
            {isBn ? 'আগে' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {isBn ? 'পরবর্তী' : 'Next'}
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--green)] text-white cursor-pointer border-none transition-opacity hover:opacity-90"
            >
              <Plus size={14} />
              {isBn ? 'স্কুল তৈরি করুন' : 'Create School'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Preview Panel ─── */
function PreviewPanel({ form, isBn, compact }: { form: SchoolForm; isBn: boolean; compact?: boolean }) {
  return (
    <div className="overflow-y-auto" style={{ maxHeight: compact ? '15rem' : undefined }}>
      {/* Banner */}
      <div className="relative h-24 sm:h-32" style={{ background: `linear-gradient(135deg, ${form.brandColor} 0%, ${form.brandColor}99 100%)` }}>
        {!compact && (
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Profile */}
      <div className="relative px-4 pb-4">
        <div className="absolute -top-8 left-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-3 border-[var(--bg-primary)] bg-[var(--bg-secondary)] shadow-lg overflow-hidden" style={{ borderWidth: '3px' }}>
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: `${form.brandColor}15` }}>
                <Building2 size={24} className="text-[var(--brand)]" />
              </div>
            )}
          </div>
        </div>

        <div className="pt-10 sm:pt-12">
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] m-0 leading-tight">
            {form.name || (isBn ? 'আপনার স্কুলের নাম' : 'Your School Name')}
          </h3>
          {form.nameBn && <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">{form.nameBn}</p>}
          {!form.nameBn && !form.name && <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">{isBn ? 'বাংলায় নাম' : 'Bengali name'}</p>}

          {form.brandName && (
            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${form.brandColor}12` }}>
              <span className="text-[0.625rem] font-semibold" style={{ color: form.brandColor }}>{form.brandName}</span>
            </div>
          )}

          {form.motto && (
            <p className="text-[0.625rem] text-[var(--text-muted)] italic m-0 mt-1">"{form.motto}"{form.mottoBn ? ` / "${form.mottoBn}"` : ''}</p>
          )}

          {/* Contact */}
          {(form.phone || form.email || form.address) && (
            <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-2 lg:grid-cols-3 gap-2'}`}>
                {form.phone && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}12` }}>
                      <Phone size={11} style={{ color: form.brandColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'ফোন' : 'Phone'}</div>
                      <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] truncate">{form.phone}</div>
                    </div>
                  </div>
                )}
                {form.email && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}12` }}>
                      <Mail size={11} style={{ color: form.brandColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'ইমেইল' : 'Email'}</div>
                      <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] truncate">{form.email}</div>
                    </div>
                  </div>
                )}
                {form.address && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}12` }}>
                      <MapPin size={11} style={{ color: form.brandColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'ঠিকানা' : 'Address'}</div>
                      <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] truncate">{form.address}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule */}
          {!compact && (form.startTime || form.endTime) && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={11} style={{ color: form.brandColor }} />
                <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'সময়সূচি' : 'Schedule'}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 p-1.5 rounded-md bg-[var(--bg-primary)] text-center">
                  <div className="text-[0.5rem] text-[var(--text-muted)]">{isBn ? 'শুরু' : 'Start'}</div>
                  <div className="text-xs font-bold" style={{ color: form.brandColor }}>{form.startTime || '--:--'}</div>
                </div>
                <div className="flex-1 p-1.5 rounded-md bg-[var(--bg-primary)] text-center">
                  <div className="text-[0.5rem] text-[var(--text-muted)]">{isBn ? 'শেষ' : 'End'}</div>
                  <div className="text-xs font-bold" style={{ color: form.brandColor }}>{form.endTime || '--:--'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Package Badge */}
          {!compact && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-[var(--brand-light)] text-[0.625rem] font-semibold text-[var(--brand)]">
                {isBn ? form.package.nameBn : form.package.name}
              </div>
              <div className="text-[0.5625rem] text-[var(--text-muted)]">
                {form.package.maxStudents} {isBn ? 'জন ছাত্র' : 'students'} · {form.package.maxTeachers} {isBn ? 'জন শিক্ষক' : 'teachers'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Step: Basic Info ─── */
function StepBasic({ form, set, isBn }: { form: SchoolForm; set: <K extends keyof SchoolForm>(k: K, v: SchoolForm[K]) => void; isBn: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{isBn ? 'মৌলিক তথ্য' : 'Basic Information'}</h3>
        <p className="text-xs text-[var(--text-muted)]">{isBn ? 'স্কুলের মৌলিক তথ্য দিন' : 'Enter the basic details of the school'}</p>
      </div>
      <Field label={isBn ? 'স্কুলের নাম *' : 'School Name *'} value={form.name} onChange={(v) => set('name', v)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. Sunrise Academy'} />
      <Field label={isBn ? 'বাংলায় নাম' : 'Name (Bengali)'} value={form.nameBn} onChange={(v) => set('nameBn', v)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. সানরাইজ একাডেমি'} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={isBn ? 'ইমেইল' : 'Email'} value={form.email} onChange={(v) => set('email', v)} placeholder="info@school.edu.bd" type="email" />
        <Field label={isBn ? 'ফোন' : 'Phone'} value={form.phone} onChange={(v) => set('phone', v)} placeholder="+880-2-1234567" />
      </div>
      <Field label={isBn ? 'ঠিকানা' : 'Address'} value={form.address} onChange={(v) => set('address', v)} placeholder={isBn ? 'বাসা নং, রাস্তা, শহর' : 'House, Road, City'} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="EIIN" value={form.eiin} onChange={(v) => set('eiin', v)} placeholder="123456" />
        <Field label={isBn ? 'ওয়েবসাইট' : 'Website'} value={form.website} onChange={(v) => set('website', v)} placeholder="www.school.edu.bd" />
      </div>
    </div>
  )
}

/* ─── Step: Branding ─── */
function StepBrand({ form, set, isBn }: { form: SchoolForm; set: <K extends keyof SchoolForm>(k: K, v: SchoolForm[K]) => void; isBn: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{isBn ? 'ব্র্যান্ডিং' : 'Branding'}</h3>
        <p className="text-xs text-[var(--text-muted)]">{isBn ? 'স্কুলের ব্র্যান্ড পরিচিতি সেট করুন' : 'Set up the school brand identity'}</p>
      </div>
      <Field label={isBn ? 'ব্র্যান্ড নাম' : 'Brand Name'} value={form.brandName} onChange={(v) => set('brandName', v)} placeholder={isBn ? 'যেমন: EduTech' : 'e.g. EduTech'} />
      <Field label={isBn ? 'মোটো (ইংরেজি)' : 'Motto (English)'} value={form.motto} onChange={(v) => set('motto', v)} placeholder="Knowledge is Power" />
      <Field label={isBn ? 'মোটো (বাংলা)' : 'Motto (Bengali)'} value={form.mottoBn} onChange={(v) => set('mottoBn', v)} placeholder="জ্ঞাই হলো শক্তি" />
      <Field label={isBn ? 'লোগো URL' : 'Logo URL'} value={form.logo} onChange={(v) => set('logo', v)} placeholder="https://..." />

      {/* Brand Color */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{isBn ? 'ব্র্যান্ড রং' : 'Brand Color'}</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => set('brandColor', c)}
              className={`w-8 h-8 rounded-lg cursor-pointer border-2 transition-all ${form.brandColor === c ? 'border-[var(--text-primary)] scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.brandColor}
            onChange={(e) => set('brandColor', e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--border)]"
          />
          <input
            type="text"
            value={form.brandColor}
            onChange={(e) => set('brandColor', e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand)]"
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Step: Academic ─── */
function StepAcademic({ form, set, newSubject, setNewSubject, newSession, setNewSession, isBn }: {
  form: SchoolForm; set: <K extends keyof SchoolForm>(k: K, v: SchoolForm[K]) => void
  newSubject: string; setNewSubject: (v: string) => void
  newSession: string; setNewSession: (v: string) => void
  isBn: boolean
}) {
  const addSubject = () => {
    const t = newSubject.trim()
    if (t && !form.subjects.includes(t)) { set('subjects', [...form.subjects, t]); setNewSubject('') }
  }
  const addSession = () => {
    const t = newSession.trim()
    if (t && !form.sessions.includes(t)) { set('sessions', [...form.sessions, t]); setNewSession('') }
  }
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{isBn ? 'একাডেমিক তথ্য' : 'Academic Details'}</h3>
        <p className="text-xs text-[var(--text-muted)]">{isBn ? 'বিষয়, সেশন ও সময়সূচি সেট করুন' : 'Set subjects, sessions, and schedule'}</p>
      </div>

      {/* Subjects */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{isBn ? 'বিষয়সমূহ *' : 'Subjects *'}</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.subjects.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[0.6875rem] font-medium text-[var(--brand)]">
              {s}
              <button onClick={() => set('subjects', form.subjects.filter((x) => x !== s))} className="ml-0.5 rounded-full hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border-none bg-transparent p-0 text-[var(--brand)]"><X size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubject()} placeholder={isBn ? 'বিষয় যোগ করুন' : 'Add subject'} className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" />
          <button onClick={addSubject} className="px-2.5 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer border-none">{isBn ? 'যোগ' : 'Add'}</button>
        </div>
      </div>

      {/* Sessions */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{isBn ? 'একাডেমিক সেশন *' : 'Academic Sessions *'}</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.sessions.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--green-light)] text-[0.6875rem] font-medium text-[var(--green)]">
              {s}
              <button onClick={() => set('sessions', form.sessions.filter((x) => x !== s))} className="ml-0.5 rounded-full hover:bg-[var(--green)] hover:text-white transition-colors cursor-pointer border-none bg-transparent p-0 text-[var(--green)]"><X size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input value={newSession} onChange={(e) => setNewSession(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSession()} placeholder="2026-27" className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" />
          <button onClick={addSession} className="px-2.5 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold cursor-pointer border-none">{isBn ? 'যোগ' : 'Add'}</button>
        </div>
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{isBn ? 'শুরুর সময়' : 'Start Time'}</label>
          <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{isBn ? 'শেষের সময়' : 'End Time'}</label>
          <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)]" />
        </div>
      </div>
    </div>
  )
}

/* ─── Step: Package ─── */
function StepPackage({ form, set, isBn }: { form: SchoolForm; set: <K extends keyof SchoolForm>(k: K, v: SchoolForm[K]) => void; isBn: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{isBn ? 'প্যাকেজ নির্বাচন' : 'Select Package'}</h3>
        <p className="text-xs text-[var(--text-muted)]">{isBn ? 'স্কুলের জন্য উপযুক্ত প্যাকেজ বাছাই করুন' : 'Choose a plan for this school'}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PACKAGES.map((pkg) => {
          const selected = form.package.name === pkg.name
          return (
            <button
              key={pkg.name}
              onClick={() => set('package', pkg)}
              className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                selected ? 'border-[var(--brand)] bg-[var(--brand-light)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">{isBn ? pkg.nameBn : pkg.name}</span>
                {selected && <div className="w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center"><Check size={12} className="text-white" /></div>}
              </div>
              <div className="text-lg font-bold text-[var(--brand)] mb-2">{pkg.price === 0 ? (isBn ? 'ফ্রি' : 'Free') : `৳${pkg.price}/${isBn ? 'মাস' : 'mo'}`}</div>
              <div className="space-y-1">
                <div className="text-[0.6875rem] text-[var(--text-secondary)]">👥 {pkg.maxStudents} {isBn ? 'জন ছাত্র' : 'students'}</div>
                <div className="text-[0.6875rem] text-[var(--text-secondary)]">👨‍🏫 {pkg.maxTeachers} {isBn ? 'জন শিক্ষক' : 'teachers'}</div>
                <div className="text-[0.6875rem] text-[var(--text-secondary)]">🏫 {pkg.maxClasses} {isBn ? 'টি ক্লাস' : 'classes'}</div>
                <div className="text-[0.6875rem] text-[var(--text-secondary)]">💾 {pkg.storageMB >= 1024 ? `${pkg.storageMB / 1024} GB` : `${pkg.storageMB} MB`} {isBn ? 'স্টোরেজ' : 'storage'}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Step: Admin ─── */
function StepAdmin({ form, set, showPassword, setShowPassword, isBn }: {
  form: SchoolForm; set: <K extends keyof SchoolForm>(k: K, v: SchoolForm[K]) => void
  showPassword: boolean; setShowPassword: (v: boolean) => void; isBn: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{isBn ? 'অ্যাডমিন অ্যাকাউন্ট' : 'Admin Account'}</h3>
        <p className="text-xs text-[var(--text-muted)]">{isBn ? 'এই স্কুলের অ্যাডমিন লগইন তৈরি করুন' : 'Create admin login for this school'}</p>
      </div>
      <Field label={isBn ? 'অ্যাডমিন ইমেইল *' : 'Admin Email *'} value={form.adminEmail} onChange={(v) => set('adminEmail', v)} placeholder="admin@school.edu.bd" type="email" />
      <div>
        <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{isBn ? 'পাসওয়ার্ড *' : 'Password *'}</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.adminPassword}
            onChange={(e) => set('adminPassword', e.target.value)}
            placeholder={isBn ? 'কমপক্ষে ৪ অক্ষর' : 'At least 4 characters'}
            className="w-full px-3 py-2 pr-9 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
          />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none">
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {form.adminPassword && form.adminPassword.length < 4 && (
          <p className="text-[0.625rem] text-[var(--red)] mt-1">{isBn ? 'কমপক্ষে ৪ অক্ষর প্রয়োজন' : 'Minimum 4 characters required'}</p>
        )}
      </div>
      <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
        <div className="text-[0.6875rem] text-[var(--text-secondary)]">
          {isBn ? 'এই ইমেইল ও পাসওয়ার্ড দিয়ে স্কুলের অ্যাডমিন লগইন করতে পারবেন।' : 'Use these credentials to login as the school admin.'}
        </div>
      </div>
    </div>
  )
}

/* ─── Step: Review ─── */
function StepReview({ form, isBn }: { form: SchoolForm; isBn: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{isBn ? 'পর্যালোচনা' : 'Review Details'}</h3>
        <p className="text-xs text-[var(--text-muted)]">{isBn ? 'সব তথ্য যাচাই করুন, তারপর স্কুল তৈরি করুন' : 'Verify all details, then create the school'}</p>
      </div>
      <div className="space-y-2.5">
        <ReviewRow label={isBn ? 'স্কুলের নাম' : 'School Name'} value={form.name || '-'} />
        <ReviewRow label={isBn ? 'বাংলায় নাম' : 'Bengali Name'} value={form.nameBn || '-'} />
        <ReviewRow label={isBn ? 'ইমেইল' : 'Email'} value={form.email || '-'} />
        <ReviewRow label={isBn ? 'ফোন' : 'Phone'} value={form.phone || '-'} />
        <ReviewRow label={isBn ? 'ঠিকানা' : 'Address'} value={form.address || '-'} />
        <ReviewRow label="EIIN" value={form.eiin || '-'} />
        <ReviewRow label={isBn ? 'ওয়েবসাইট' : 'Website'} value={form.website || '-'} />
        <ReviewRow label={isBn ? 'ব্র্যান্ড' : 'Brand'} value={form.brandName || '-'} />
        <ReviewRow label={isBn ? 'মোটো' : 'Motto'} value={form.motto || '-'} />
        <ReviewRow label={isBn ? 'বিষয়' : 'Subjects'} value={form.subjects.join(', ') || '-'} />
        <ReviewRow label={isBn ? 'সেশন' : 'Sessions'} value={form.sessions.join(', ') || '-'} />
        <ReviewRow label={isBn ? 'সময়' : 'Schedule'} value={`${form.startTime} - ${form.endTime}`} />
        <ReviewRow label={isBn ? 'প্যাকেজ' : 'Package'} value={`${isBn ? form.package.nameBn : form.package.name} (${form.package.price === 0 ? (isBn ? 'ফ্রি' : 'Free') : `৳${form.package.price}`})`} />
        <ReviewRow label={isBn ? 'অ্যাডমিন' : 'Admin'} value={form.adminEmail} />
      </div>
    </div>
  )
}

/* ─── Shared Components ─── */
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
      />
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-muted)] w-28 shrink-0">{label}</span>
      <span className="text-xs font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
