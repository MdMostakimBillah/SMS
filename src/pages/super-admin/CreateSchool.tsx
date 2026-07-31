import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Building2, MapPin, Phone, Clock, Globe, CalendarDays,
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
    inputRef.current?.focus()
  }, [step])

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => navigate('/super-admin/schools'), 300)
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
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Popup Window - 95vw x 98vh */}
      <div className={`w-[95vw] h-[98vh] bg-[var(--bg-primary)] rounded-2xl shadow-2xl flex overflow-hidden transition-all duration-300 ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>

        {/* Left Column - Live Preview (70%) */}
        <div className="hidden lg:flex w-[70%] flex-col bg-[var(--bg-secondary)] overflow-hidden">
          <PreviewPanel form={form} isBn={isBn} activeSection={currentStep?.section} />
        </div>

        {/* Right Column - Input (30%) */}
        <div className="w-full lg:w-[30%] flex flex-col border-l border-[var(--border)]/50">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)]/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--brand-light)]">
                <Sparkles size={16} className="text-[var(--brand)]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">{isBn ? 'নতুন স্কুল' : 'New School'}</h2>
                <p className="text-[0.6875rem] text-[var(--text-muted)]">{step + 1}/{FIELD_STEPS.length}</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer border-none bg-transparent transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 py-3 shrink-0">
            <div className="h-1 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-500" style={{ width: `${((step + 1) / FIELD_STEPS.length) * 100}%` }} />
            </div>
          </div>

          {/* Field */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] text-[0.625rem] font-medium text-[var(--text-muted)] mb-3">
                {getSectionIcon(currentStep?.section || 'basic')}
                {getSectionLabel(currentStep?.section || 'basic', isBn)}
              </div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                {isBn ? currentStep?.labelBn : currentStep?.labelEn}
                {currentStep?.required && <span className="text-[var(--red)] ml-1">*</span>}
              </label>
              <p className="text-[0.6875rem] text-[var(--text-muted)] leading-relaxed">
                {getHint(currentStep?.key || '', isBn)}
              </p>
            </div>

            {currentStep && renderField(currentStep.key, form, set, {
              newSubject, setNewSubject, newSession, setNewSession,
              showPassword, setShowPassword, isBn, inputRef,
            })}

            {currentStep?.key === 'adminPassword' && form.adminPassword && form.adminPassword.length < 4 && (
              <p className="text-[0.6875rem] text-[var(--red)] mt-2">{isBn ? 'কমপক্ষে ৪ অক্ষর প্রয়োজন' : 'Minimum 4 characters required'}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-[var(--border)]/50 flex items-center gap-3 shrink-0">
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
function PreviewPanel({ form, isBn, activeSection }: { form: SchoolForm; isBn: boolean; activeSection?: string }) {
  const hl = (section: string) => activeSection === section ? 'bg-[var(--brand)]/5 ring-1 ring-[var(--brand)]/20' : ''

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Banner */}
      <div className="relative h-40 rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${form.brandColor} 0%, ${form.brandColor}aa 100%)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Profile */}
      <div className="relative px-2 pb-4">
        {/* Logo */}
        <div className="absolute -top-12 left-2">
          <div className="w-24 h-24 rounded-2xl border-[3px] border-[var(--bg-secondary)] bg-[var(--bg-primary)] shadow-lg overflow-hidden">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: `${form.brandColor}12` }}>
                <Building2 size={30} style={{ color: form.brandColor }} />
              </div>
            )}
          </div>
        </div>

        {/* Institution Info */}
        <div className="pt-14">
          <h2 className="text-sm font-bold text-[var(--text-primary)] m-0 leading-tight">
            {form.name || (isBn ? 'আপনার স্কুলের নাম' : 'Your School Name')}
          </h2>
          <p className="text-[0.6875rem] text-[var(--text-muted)] m-0 mt-0.5">
            {form.nameBn || (isBn ? 'বাংলায় নাম' : 'Bengali name')}
          </p>

          {form.brandName && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: `${form.brandColor}12` }}>
              <span className="text-[0.625rem] font-semibold" style={{ color: form.brandColor }}>{form.brandName}</span>
            </div>
          )}

          {form.motto && (
            <p className="text-[0.625rem] text-[var(--text-muted)] italic m-0 mt-1">
              "{form.motto}"{form.mottoBn ? ` / "${form.mottoBn}"` : ''}
            </p>
          )}

          {/* Contact Card */}
          <div className={`mt-4 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]/60 transition-all duration-200 ${hl('contact')}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {form.phone && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}10` }}>
                    <Phone size={13} style={{ color: form.brandColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'ফোন' : 'Phone'}</div>
                    <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] truncate">{form.phone}</div>
                    {form.eiin && <div className="text-[0.5625rem] text-[var(--text-muted)]">EIIN: {form.eiin}</div>}
                  </div>
                </div>
              )}
              {(form.email || form.website) && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}10` }}>
                    <Globe size={13} style={{ color: form.brandColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'ইমেইল / ওয়েবসাইট' : 'Email / Website'}</div>
                    <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] truncate">{form.email}</div>
                    {form.website && <div className="text-[0.5625rem] text-[var(--text-muted)] truncate">{form.website}</div>}
                  </div>
                </div>
              )}
              {form.address && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${form.brandColor}10` }}>
                    <MapPin size={13} style={{ color: form.brandColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'ঠিকানা' : 'Address'}</div>
                    <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] truncate">{form.address}{form.addressBn ? ` / ${form.addressBn}` : ''}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Schedule Card */}
            <div className={`p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]/60 transition-all duration-200 ${hl('academic')}`}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${form.brandColor}10` }}>
                  <Clock size={11} style={{ color: form.brandColor }} />
                </div>
                <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'সময়সূচি' : 'Schedule'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-[0.5625rem] text-[var(--text-muted)] mb-0.5">{isBn ? 'শুরু' : 'Start'}</div>
                  <div className="text-xs font-bold" style={{ color: form.brandColor }}>{form.startTime || '--:--'}</div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-[0.5625rem] text-[var(--text-muted)] mb-0.5">{isBn ? 'শেষ' : 'End'}</div>
                  <div className="text-xs font-bold" style={{ color: form.brandColor }}>{form.endTime || '--:--'}</div>
                </div>
              </div>
            </div>

            {/* Session & Subjects Card */}
            <div className={`p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]/60 transition-all duration-200 ${hl('academic')}`}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${form.brandColor}10` }}>
                  <CalendarDays size={11} style={{ color: form.brandColor }} />
                </div>
                <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'একাডেমিক সেশন' : 'Academic Session'}</span>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-secondary)] mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: form.brandColor }}>{form.sessions[0] || '—'}</span>
                  <span className="text-[0.5625rem] text-[var(--text-muted)]">({isBn ? 'বর্তমান' : 'Current'})</span>
                </div>
                <div className="text-[0.5625rem] text-[var(--text-muted)] mt-0.5">
                  {form.sessions.length} {isBn ? 'টি সেশন' : 'sessions'}
                </div>
              </div>
              {form.subjects.length > 0 && (
                <div>
                  <div className="text-[0.5625rem] text-[var(--text-muted)] mb-1">{isBn ? 'বিষয়' : 'Subjects'}</div>
                  <div className="flex flex-wrap gap-1">
                    {form.subjects.map((s) => (
                      <span key={s} className="text-[0.5625rem] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${form.brandColor}10`, color: form.brandColor }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Package Badge */}
          <div className="mt-3 flex items-center gap-2">
            <div className="px-2 py-1 rounded-lg bg-[var(--brand-light)] text-[0.625rem] font-semibold text-[var(--brand)]">
              {isBn ? form.package.nameBn : form.package.name}
            </div>
            <div className="text-[0.5625rem] text-[var(--text-muted)]">
              {form.package.maxStudents} students · {form.package.maxTeachers} teachers · {form.package.maxClasses} classes
            </div>
          </div>
        </div>
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

  const inputCls = "w-full px-4 py-3 rounded-xl border border-transparent bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all placeholder:text-[var(--text-muted)]/50"

  switch (key) {
    case 'name':
      return <input ref={inputRef} type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. Sunrise Academy'} className={inputCls} />
    case 'nameBn':
      return <input ref={inputRef} type="text" value={form.nameBn} onChange={(e) => set('nameBn', e.target.value)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. সানরাইজ একাডেমি'} className={inputCls} />
    case 'email':
      return <input ref={inputRef} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="info@school.edu.bd" className={inputCls} />
    case 'phone':
      return <input ref={inputRef} type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+880-2-1234567" className={inputCls} />
    case 'address':
      return <input ref={inputRef} type="text" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder={isBn ? 'বাসা নং, রাস্তা, শহর' : 'House, Road, City'} className={inputCls} />
    case 'addressBn':
      return <input ref={inputRef} type="text" value={form.addressBn} onChange={(e) => set('addressBn', e.target.value)} placeholder={isBn ? 'বাসা নং, রাস্তা, শহর' : 'বাসা নং, রাস্তা, শহর'} className={inputCls} />
    case 'eiin':
      return <input ref={inputRef} type="text" value={form.eiin} onChange={(e) => set('eiin', e.target.value)} placeholder="123456" className={inputCls} />
    case 'website':
      return <input ref={inputRef} type="text" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="www.school.edu.bd" className={inputCls} />
    case 'brandName':
      return <input ref={inputRef} type="text" value={form.brandName} onChange={(e) => set('brandName', e.target.value)} placeholder={isBn ? 'যেমন: EduTech' : 'e.g. EduTech'} className={inputCls} />
    case 'motto':
      return <input ref={inputRef} type="text" value={form.motto} onChange={(e) => set('motto', e.target.value)} placeholder="Knowledge is Power" className={inputCls} />
    case 'mottoBn':
      return <input ref={inputRef} type="text" value={form.mottoBn} onChange={(e) => set('mottoBn', e.target.value)} placeholder="জ্ঞাই হলো শক্তি" className={inputCls} />
    case 'logo':
      return <input ref={inputRef} type="text" value={form.logo} onChange={(e) => set('logo', e.target.value)} placeholder="https://..." className={inputCls} />
    case 'brandColor':
      return <ColorPicker value={form.brandColor} onChange={(v) => set('brandColor', v)} />
    case 'subjects':
      return <TagInput ref={inputRef} tags={form.subjects} onAdd={(t) => set('subjects', [...form.subjects, t])} onRemove={(t) => set('subjects', form.subjects.filter((x) => x !== t))} newTag={newSubject} setNewTag={setNewSubject} placeholder={isBn ? 'বিষয় যোগ করুন' : 'Add subject'} />
    case 'sessions':
      return <TagInput ref={inputRef} tags={form.sessions} onAdd={(t) => set('sessions', [...form.sessions, t])} onRemove={(t) => set('sessions', form.sessions.filter((x) => x !== t))} newTag={newSession} setNewTag={setNewSession} placeholder="2026-27" />
    case 'schedule':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[0.6875rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'শুরুর সময়' : 'Start Time'}</label>
            <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-[0.6875rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'শেষের সময়' : 'End Time'}</label>
            <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputCls} />
          </div>
        </div>
      )
    case 'package':
      return <PackagePicker value={form.package} onChange={(v) => set('package', v)} isBn={isBn} />
    case 'adminEmail':
      return <input ref={inputRef} type="email" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} placeholder="admin@school.edu.bd" className={inputCls} />
    case 'adminPassword':
      return (
        <div className="relative">
          <input ref={inputRef} type={showPassword ? 'text' : 'password'} value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} placeholder={isBn ? 'কমপক্ষে ৪ অক্ষর' : 'At least 4 characters'} className={`${inputCls} pr-10`} />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none">
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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

function getSectionIcon(section: string): string {
  const icons: Record<string, string> = {
    basic: '🏫', contact: '📞', extra: '📋', brand: '🎨', academic: '📚', package: '💳', admin: '🔑',
  }
  return icons[section] || '📝'
}

function getSectionLabel(section: string, isBn: boolean): string {
  const labels: Record<string, { en: string; bn: string }> = {
    basic: { en: 'Basic Info', bn: 'মৌলিক তথ্য' },
    contact: { en: 'Contact', bn: 'যোগাযোগ' },
    extra: { en: 'Extra Details', bn: 'অতিরিক্ত তথ্য' },
    brand: { en: 'Branding', bn: 'ব্র্যান্ডিং' },
    academic: { en: 'Academic', bn: 'একাডেমিক' },
    package: { en: 'Package', bn: 'প্যাকেজ' },
    admin: { en: 'Admin Account', bn: 'অ্যাডমিন অ্যাকাউন্ট' },
  }
  const l = labels[section]
  return l ? (isBn ? l.bn : l.en) : section
}

/* ─── Shared Components ─── */
function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button key={c} onClick={() => onChange(c)} className={`w-9 h-9 rounded-xl cursor-pointer border-2 transition-all ${value === c ? 'border-[var(--text-primary)] scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 rounded-xl cursor-pointer border border-[var(--border)]" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand)]" />
      </div>
    </div>
  )
}

function TagInput({ ref, tags, onAdd, onRemove, newTag, setNewTag, placeholder }: {
  ref?: React.Ref<HTMLInputElement>; tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void
  newTag: string; setNewTag: (v: string) => void; placeholder: string
}) {
  const add = () => {
    const t = newTag.trim()
    if (t && !tags.includes(t)) { onAdd(t); setNewTag('') }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
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
