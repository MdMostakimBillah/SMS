import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { CheckCircle, User, GraduationCap, ShieldCheck, IdCard, Camera, X, Download, MessageSquare, Send, Users, FileText, ChevronRight, ChevronLeft, Clock } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import type { StudentAdmission } from './types'
import { generateA4HTML } from './a4Template'
import QRCode from 'qrcode'
import { RELIGION_OPTIONS, DISTRICT_OPTIONS } from '@/lib/constants'
import { FormField } from '@/components/ui/FormField'

type FormData = Omit<StudentAdmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'approvedAt'>

const initForm = (currentSession: string): FormData => ({
  photo: '',
  nameEn: '',
  nameBn: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  religion: '',
  nationality: 'Bangladeshi',
  phone: '',
  email: '',
  class: '',
  section: '',
  roll: '',
  academicYear: currentSession,
  previousSchool: '',
  admissionDate: new Date().toISOString().split('T')[0],
  presentAddress: '',
  permanentAddress: '',
  district: '',
  fatherNameEn: '',
  fatherNameBn: '',
  fatherOccupation: '',
  fatherPhone: '',
  fatherNid: '',
  motherNameEn: '',
  motherNameBn: '',
  motherOccupation: '',
  motherPhone: '',
  motherNid: '',
  guardianName: '',
  guardianRelation: '',
  guardianPhone: '',
  teacherId: '',
})

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const max = 300
      const r = Math.min(max / img.width, max / img.height)
      canvas.width = Math.round(img.width * r)
      canvas.height = Math.round(img.height * r)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
      URL.revokeObjectURL(url)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

const tabs = [
  { key: 'personal', icon: User, labelBn: 'ব্যক্তিগত', labelEn: 'Personal' },
  { key: 'academic', icon: GraduationCap, labelBn: 'একাডেমিক', labelEn: 'Academic' },
  { key: 'guardian', icon: Users, labelBn: 'অভিভাবক', labelEn: 'Guardian' },
] as const
type TabKey = (typeof tabs)[number]['key']

const PERSONAL_REQUIRED: (keyof FormData)[] = ['nameEn', 'nameBn', 'dob', 'gender', 'bloodGroup', 'religion', 'phone', 'district', 'presentAddress', 'permanentAddress']
const ACADEMIC_REQUIRED: (keyof FormData)[] = ['class', 'section', 'roll', 'academicYear', 'admissionDate']
const GUARDIAN_REQUIRED: (keyof FormData)[] = ['fatherNameEn', 'fatherNameBn', 'fatherOccupation', 'fatherPhone', 'motherNameEn', 'motherNameBn', 'motherOccupation', 'motherPhone']

const REQUIRED_BY_TAB: Record<TabKey, (keyof FormData)[]> = {
  personal: PERSONAL_REQUIRED,
  academic: ACADEMIC_REQUIRED,
  guardian: GUARDIAN_REQUIRED,
}

function SummaryRow({ labelBn, labelEn, value, isBn }: { labelBn: string; labelEn: string; value: string; isBn: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-b-0">
      <span className="text-[0.75rem] text-[var(--text-muted)] min-w-[7.5rem] shrink-0">{isBn ? labelBn : labelEn}</span>
      <span className={`text-[0.8125rem] font-medium ${value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] italic'}`}>
        {value || '—'}
      </span>
    </div>
  )
}

export default function GeneralAdmission() {
  const { isMobile } = useWindowSize()
  const { addStudent, getNextId } = useAdmissionStore()
  const students = useAdmissionStore((s) => s.students)
  const { classes, institution } = useClassStore()
  const isBn = useBn()
  const currentSession = institution.currentSession
  const sessions = institution.sessions

  const classOptions = useMemo(() => classes.map((cls) => cls.name), [classes])
  const sectionsMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    classes.forEach((cls) => { map[cls.name] = cls.sections.map((s) => s.name) })
    return map
  }, [classes])

  const [form, setForm] = useState<FormData>(() => initForm(currentSession))
  const [studentId] = useState(() => getNextId())
  const [done, setDone] = useState(false)
  const [doneId, setDoneId] = useState('')
  const [photoErr, setPhotoErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('personal')
  const [showReview, setShowReview] = useState(false)

  const [{}, { touch, validate, hasError, reset }] = useFormValidation<FormData>(['personal', 'academic', 'guardian'])

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({
    activeTab,
    tabRefs,
    sliderRef,
    getContainer: (slider) => slider.parentElement,
  })

  const set = useCallback((key: keyof FormData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }))
  }, [])

  useEffect(() => {
    if (!form.class || !form.section || !form.academicYear) return
    const sameGroup = students.filter((s) => s.class === form.class && s.section === form.section && s.academicYear === form.academicYear)
    const maxRoll = sameGroup.reduce((max, s) => { const r = parseInt(s.roll, 10); return !isNaN(r) && r > max ? r : max }, 0)
    set('roll', String(maxRoll + 1))
  }, [form.class, form.section, form.academicYear, students, set])

  useEffect(() => {
    const missing = validate(form, activeTab, REQUIRED_BY_TAB[activeTab])
    if (missing.size > 0) {
      // Errors are set by the hook
    }
  }, [form, activeTab, validate])

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoErr('')
    if (file.size > 2 * 1024 * 1024) { setPhotoErr(isBn ? 'ছবির সাইজ সর্বোচ্চ ২ MB' : 'Photo must be under 2MB'); return }
    try { set('photo', await compressImage(file)) } catch { setPhotoErr(isBn ? 'ছবি লোড করতে সমস্যা' : 'Error loading image') }
  }

  const handleSubmit = useCallback(() => {
    const now = new Date().toISOString().split('T')[0]
    addStudent({ ...form, id: studentId, createdAt: now, updatedAt: now, status: 'pending' })
    setDoneId(studentId); setDone(true)
  }, [form, studentId, addStudent])

  const downloadPDF = useCallback(async () => {
    const s = useAdmissionStore.getState().students.find((x) => x.id === doneId)
    if (!s) return
    const qrDataUrl = await QRCode.toDataURL(s.id, { width: 120, margin: 1 })
    const tName = s.teacherId ? useTeacherStore.getState().teachers.find((t) => t.id === s.teacherId)?.nameEn : ''
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(generateA4HTML(s, isBn, qrDataUrl, tName, institution.name))
    win.document.close(); setTimeout(() => win.print(), 800)
  }, [doneId, isBn])

  const tabKeys = tabs.map((t) => t.key)
  const currentIdx = tabKeys.indexOf(activeTab)

  const goToTab = useCallback((tab: TabKey) => {
    validate(form, activeTab, REQUIRED_BY_TAB[activeTab])
    setActiveTab(tab)
    // Note: we don't clear touched here to maintain field-level validation state
  }, [activeTab, form, validate])

  const nextTab = useCallback(() => {
    if (currentIdx < tabKeys.length - 1) {
      const errors = validate(form, activeTab, REQUIRED_BY_TAB[activeTab])
      if (errors.size > 0) {
        // Mark all error fields as touched so they show red borders
        errors.forEach((k) => touch(k))
        return
      }
      setActiveTab(tabKeys[currentIdx + 1])
    }
  }, [currentIdx, tabKeys, form, activeTab, validate, touch])

  const prevTab = useCallback(() => {
    if (currentIdx > 0) setActiveTab(tabKeys[currentIdx - 1])
  }, [currentIdx, tabKeys])

  const openReview = useCallback(() => {
    const errors = validate(form, activeTab, REQUIRED_BY_TAB[activeTab])
    if (errors.size > 0) {
      errors.forEach((k) => touch(k))
      return
    }
    setShowReview(true)
  }, [form, activeTab, validate, touch])

  const g = (n: number) => isMobile ? 'grid grid-cols-1 gap-y-[0.375rem]' : `grid ${n === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-x-4 gap-y-[0.375rem]`
  const card = `bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] mb-[0.875rem] ${isMobile ? 'p-[0.875rem]' : 'p-5'}`

  const sHead = (icon: React.ReactNode, bn: string, en: string, col = 'var(--brand)', bg = 'var(--brand-light)') => (
    <div className="flex items-center gap-2 mb-4 pb-[0.625rem] border-b border-[var(--border)]">
      <div className="w-[1.875rem] h-[1.875rem] rounded-[0.5rem] flex items-center justify-center" style={{ background: bg }}>
        {React.cloneElement(icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>, { size: 15, style: { color: col } })}
      </div>
      <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? bn : en}</span>
      <span className="text-[0.625rem] text-[var(--red)] ml-1">* {isBn ? 'বাধ্যতামূলক' : 'Required'}</span>
    </div>
  )

  if (done) return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] mb-[0.875rem] text-center py-[2.5rem] px-5">
      <div className="w-[3.75rem] h-[3.75rem] rounded-full bg-[var(--green-light)] flex items-center justify-center mx-auto mb-[0.875rem]">
        <CheckCircle size={30} style={{ color: 'var(--green)' }} />
      </div>
      <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)] mb-[0.625rem]">{isBn ? 'আবেদন জমা হয়েছে!' : 'Application Submitted!'}</h2>
      <div className="bg-[var(--brand-light)] border border-[var(--brand)] rounded-[0.625rem] py-3 px-5 inline-block mb-3">
        <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{isBn ? 'ছাত্র আইডি' : 'Student ID'}</div>
        <div className="text-[1.375rem] font-bold text-[var(--brand)] tracking-[0.0625rem]">{doneId}</div>
      </div>
      <div className="flex items-center justify-center gap-1.5 text-[0.8125rem] text-[var(--teal)] mb-[0.375rem]">
        <MessageSquare size={14} />
        <span>{isBn ? `${form.phone} নম্বরে SMS পাঠানো হয়েছে` : `SMS sent to ${form.phone}`}</span>
      </div>
      <div className="flex items-center justify-center gap-1.5 text-[0.75rem] text-[var(--amber)] mb-5">
        <Clock size={13} />
        <span>{isBn ? 'আবেদনটি Pending অবস্থায় আছে। Manage থেকে Approve করুন।' : 'Pending approval. Go to Manage tab to approve.'}</span>
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        <button onClick={downloadPDF} className="flex items-center gap-[0.375rem] py-[0.625rem] px-[1.125rem] rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-medium cursor-pointer font-[inherit]">
          <Download size={14} /> {isBn ? 'আবেদনপত্র PDF' : 'Download Application PDF'}
        </button>
        <button onClick={() => { setDone(false); setForm(initForm(currentSession)); setShowReview(false); setActiveTab('personal') }} className="py-[0.625rem] px-[1.125rem] rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
          {isBn ? 'নতুন আবেদন' : 'New Application'}
        </button>
      </div>
    </div>
  )

  // ── Review Page ──
  if (showReview) return (
    <div>
      <div className="flex items-center gap-2 mb-4 px-1">
        <IdCard size={14} className="text-[var(--brand)]" />
        <span className="text-[0.75rem] text-[var(--text-muted)]">{isBn ? 'ছাত্র আইডি' : 'ID'}:</span>
        <span className="text-[0.8125rem] font-semibold text-[var(--brand)]">{studentId}</span>
        <span className="text-[0.6875rem] text-[var(--text-muted)] ml-auto">{form.admissionDate}</span>
      </div>

      <div className={`${card} !mb-4`}>
        {sHead(<FileText />, 'আবেদন পর্যালোচনা', 'Application Review', 'var(--amber)', 'var(--amber-light)')}
        <div className="flex items-center gap-2 bg-[var(--amber-light)] border border-[var(--amber)] rounded-[0.5rem] p-3 mb-4">
          <FileText size={16} className="text-[var(--amber)] shrink-0" />
          <p className="text-[0.8125rem] text-[var(--amber)]">
            {isBn ? 'সকল তথ্য যাচাই করুন। ভুল থাকলে নিচের বাটনে ক্লিক করে সম্পাদনা করুন।' : 'Verify all information below. Click Edit to make changes.'}
          </p>
        </div>

        {/* Personal */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <User size={14} style={{ color: 'var(--brand)' }} />
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Information'}</span>
            <button type="button" onClick={() => { setShowReview(false); setActiveTab('personal') }} className="text-[0.6875rem] text-[var(--brand)] ml-auto bg-transparent border-none cursor-pointer underline">{isBn ? 'সম্পাদনা' : 'Edit'}</button>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-[0.5rem] p-3">
            <div className="flex gap-4">
              {form.photo && <img src={form.photo} alt="" className="w-[4.5rem] h-[5.625rem] rounded-[0.5rem] object-cover border border-[var(--border)]" />}
              <div className="flex-1">
                <SummaryRow labelBn="নাম (EN)" labelEn="Name (EN)" value={form.nameEn} isBn={isBn} />
                <SummaryRow labelBn="নাম (BN)" labelEn="Name (BN)" value={form.nameBn} isBn={isBn} />
                <SummaryRow labelBn="জন্ম তারিখ" labelEn="Date of Birth" value={form.dob} isBn={isBn} />
                <SummaryRow labelBn="লিঙ্গ" labelEn="Gender" value={form.gender} isBn={isBn} />
                <SummaryRow labelBn="রক্তের গ্রুপ" labelEn="Blood Group" value={form.bloodGroup} isBn={isBn} />
                <SummaryRow labelBn="ধর্ম" labelEn="Religion" value={form.religion} isBn={isBn} />
                <SummaryRow labelBn="জাতীয়তা" labelEn="Nationality" value={form.nationality} isBn={isBn} />
                <SummaryRow labelBn="মোবাইল" labelEn="Mobile" value={form.phone} isBn={isBn} />
                <SummaryRow labelBn="ইমেইল" labelEn="Email" value={form.email} isBn={isBn} />
                <SummaryRow labelBn="জেলা" labelEn="District" value={form.district} isBn={isBn} />
                <SummaryRow labelBn="বর্তমান ঠিকানা" labelEn="Present Address" value={form.presentAddress} isBn={isBn} />
                <SummaryRow labelBn="স্থায়ী ঠিকানা" labelEn="Permanent Address" value={form.permanentAddress} isBn={isBn} />
              </div>
            </div>
          </div>
        </div>

        {/* Academic */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={14} style={{ color: 'var(--teal)' }} />
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{isBn ? 'একাডেমিক তথ্য' : 'Academic Information'}</span>
            <button type="button" onClick={() => { setShowReview(false); setActiveTab('academic') }} className="text-[0.6875rem] text-[var(--brand)] ml-auto bg-transparent border-none cursor-pointer underline">{isBn ? 'সম্পাদনা' : 'Edit'}</button>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-[0.5rem] p-3">
            <SummaryRow labelBn="শ্রেণি" labelEn="Class" value={form.class} isBn={isBn} />
            <SummaryRow labelBn="সেকশন" labelEn="Section" value={form.section} isBn={isBn} />
            <SummaryRow labelBn="রোল" labelEn="Roll" value={form.roll} isBn={isBn} />
            <SummaryRow labelBn="শিক্ষাবর্ষ" labelEn="Academic Year" value={form.academicYear} isBn={isBn} />
            <SummaryRow labelBn="ভর্তির তারিখ" labelEn="Admission Date" value={form.admissionDate} isBn={isBn} />
            <SummaryRow labelBn="আগের স্কুল" labelEn="Previous School" value={form.previousSchool} isBn={isBn} />
          </div>
        </div>

        {/* Guardian */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} style={{ color: 'var(--purple)' }} />
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{isBn ? 'অভিভাবক তথ্য' : 'Guardian Information'}</span>
            <button type="button" onClick={() => { setShowReview(false); setActiveTab('guardian') }} className="text-[0.6875rem] text-[var(--brand)] ml-auto bg-transparent border-none cursor-pointer underline">{isBn ? 'সম্পাদনা' : 'Edit'}</button>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-[0.5rem] p-3">
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">{isBn ? 'পিতা' : 'Father'}</div>
            <SummaryRow labelBn="নাম (EN)" labelEn="Name (EN)" value={form.fatherNameEn} isBn={isBn} />
            <SummaryRow labelBn="নাম (BN)" labelEn="Name (BN)" value={form.fatherNameBn} isBn={isBn} />
            <SummaryRow labelBn="পেশা" labelEn="Occupation" value={form.fatherOccupation} isBn={isBn} />
            <SummaryRow labelBn="মোবাইল" labelEn="Mobile" value={form.fatherPhone} isBn={isBn} />
            <SummaryRow labelBn="NID" labelEn="NID" value={form.fatherNid} isBn={isBn} />
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mt-3 mb-1">{isBn ? 'মাতা' : 'Mother'}</div>
            <SummaryRow labelBn="নাম (EN)" labelEn="Name (EN)" value={form.motherNameEn} isBn={isBn} />
            <SummaryRow labelBn="নাম (BN)" labelEn="Name (BN)" value={form.motherNameBn} isBn={isBn} />
            <SummaryRow labelBn="পেশা" labelEn="Occupation" value={form.motherOccupation} isBn={isBn} />
            <SummaryRow labelBn="মোবাইল" labelEn="Mobile" value={form.motherPhone} isBn={isBn} />
            <SummaryRow labelBn="NID" labelEn="NID" value={form.motherNid} isBn={isBn} />
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mt-3 mb-1">{isBn ? 'অভিভাবক (ঐচ্ছিক)' : 'Guardian (Optional)'}</div>
            <SummaryRow labelBn="নাম" labelEn="Name" value={form.guardianName} isBn={isBn} />
            <SummaryRow labelBn="সম্পর্ক" labelEn="Relation" value={form.guardianRelation} isBn={isBn} />
            <SummaryRow labelBn="মোবাইল" labelEn="Mobile" value={form.guardianPhone} isBn={isBn} />
          </div>
        </div>

        <div className="flex items-center gap-[0.625rem] bg-[var(--teal-light)] border border-[var(--teal)] rounded-[0.625rem] py-[0.625rem] px-[0.875rem]">
          <MessageSquare size={16} className="text-[var(--teal)] shrink-0" />
          <p className="text-[0.75rem] text-[var(--teal)]">{isBn ? `আবেদন জমা দিলে ${form.phone || '...'} এ SMS যাবে।` : `SMS will be sent to ${form.phone || '...'} after submission.`}</p>
        </div>
      </div>

      <div className="flex gap-[0.625rem] justify-between flex-wrap">
        <div className="flex gap-[0.625rem]">
          <button type="button" onClick={() => setShowReview(false)} className="flex items-center gap-1 py-[0.625rem] px-4 rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
            <ChevronLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
          </button>
          <button type="button" onClick={() => { setActiveTab('personal'); setForm(initForm(currentSession)); setShowReview(false); reset() }}
            className="py-[0.625rem] px-5 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
            {isBn ? 'রিসেট' : 'Reset'}
          </button>
        </div>
        <button type="button" onClick={handleSubmit} className="flex items-center gap-[0.4375rem] py-[0.625rem] px-6 rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
          <Send size={14} />{isBn ? 'আবেদন জমা দিন' : 'Submit Application'}
        </button>
      </div>
    </div>
  )

  // ── Form Tabs ──
  return (
    <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      <input type="hidden" name="studentId" value={studentId} />

      <div className="flex items-center gap-2 mb-3 px-1">
        <IdCard size={14} className="text-[var(--brand)]" />
        <span className="text-[0.75rem] text-[var(--text-muted)]">{isBn ? 'ছাত্র আইডি' : 'ID'}:</span>
        <span className="text-[0.8125rem] font-semibold text-[var(--brand)]">{studentId}</span>
        <span className="text-[0.6875rem] text-[var(--text-muted)] ml-auto">{form.admissionDate}</span>
      </div>

      <div className={`relative flex gap-[0.375rem] glass rounded-xl p-[0.3125rem] w-full mb-4 ${isMobile ? 'flex-wrap' : 'flex-nowrap'}`}>
        <div
          ref={sliderRef}
          className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
          style={{ background: 'var(--brand)', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)', zIndex: 0 }}
        />
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              ref={(el) => { if (el) tabRefs.current.set(tab.key, el) }}
              onClick={() => goToTab(tab.key)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-[0.4375rem] px-[0.875rem] py-[0.5625rem] rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200
                ${activeTab === tab.key ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              style={{ background: 'transparent' }}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{isBn ? tab.labelBn : tab.labelEn}</span>
              <span className="sm:hidden">{tabs.indexOf(tab) + 1}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'personal' && (
        <div className={card}>
          {sHead(<User />, 'ব্যক্তিগত তথ্য', 'Personal Information')}
          <div className="flex gap-4 mb-[0.875rem] flex-wrap">
            <div>
              <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem]">{isBn ? 'ছবি (সর্বোচ্চ ২ MB)' : 'Photo (max 2MB)'}</div>
              <div onClick={() => fileRef.current?.click()} className="w-[5.625rem] h-[6.875rem] rounded-[0.625rem] flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--bg-secondary)] relative" style={{ border: `2px dashed ${form.photo ? 'var(--brand)' : 'var(--border-2)'}` }}>
                {form.photo ? <img src={form.photo} alt="" className="w-full h-full object-cover" /> : <div className="text-center text-[var(--text-muted)] pointer-events-none"><Camera size={22} className="block mx-auto mb-1" /><div className="text-[0.625rem]">{isBn ? 'ছবি' : 'Photo'}</div></div>}
                {form.photo && <button type="button" onClick={(e) => { e.stopPropagation(); set('photo', '') }} className="absolute top-[0.1875rem] right-[0.1875rem] w-[1.125rem] h-[1.125rem] rounded-full bg-[var(--red)] border-none cursor-pointer flex items-center justify-center text-white"><X size={10} /></button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              {photoErr && <div className="text-[0.625rem] text-[var(--red)] mt-[0.1875rem] max-w-[5.625rem]">{photoErr}</div>}
            </div>
            <div className="flex-1 min-w-[12.5rem]">
              <div className={`${g(2)} mb-[0.625rem]`}>
                <FormField labelEn="Name (English)" labelBn="নাম (ইংরেজি)" value={form.nameEn} onChange={(v) => set('nameEn', v)} required isBn={isBn} error={hasError('nameEn', activeTab)} onBlur={() => touch('nameEn')} />
                <FormField labelEn="Name (Bengali)" labelBn="নাম (বাংলা)" value={form.nameBn} onChange={(v) => set('nameBn', v)} required isBn={isBn} error={hasError('nameBn', activeTab)} onBlur={() => touch('nameBn')} />
              </div>
              <div className={g(2)}>
                <FormField labelEn="Date of Birth" labelBn="জন্ম তারিখ" value={form.dob} onChange={(v) => set('dob', v)} type="date" required isBn={isBn} error={hasError('dob', activeTab)} onBlur={() => touch('dob')} />
                <FormField labelEn="Gender" labelBn="লিঙ্গ" value={form.gender} onChange={(v) => set('gender', v)} required isBn={isBn} options={['Male / পুরুষ', 'Female / মহিলা', 'Other / অন্যান্য']} error={hasError('gender', activeTab)} onBlur={() => touch('gender')} />
              </div>
            </div>
          </div>
          <div className={`${g(3)} mb-[0.625rem]`}>
            <FormField labelEn="Blood Group" labelBn="রক্তের গ্রুপ" value={form.bloodGroup} onChange={(v) => set('bloodGroup', v)} required isBn={isBn} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} error={hasError('bloodGroup', activeTab)} onBlur={() => touch('bloodGroup')} />
            <FormField labelEn="Religion" labelBn="ধর্ম" value={form.religion} onChange={(v) => set('religion', v)} required isBn={isBn} options={RELIGION_OPTIONS.map(o => o.value)} error={hasError('religion', activeTab)} onBlur={() => touch('religion')} />
            <FormField labelEn="Nationality" labelBn="জাতীয়তা" value={form.nationality} onChange={(v) => set('nationality', v)} required isBn={isBn} />
          </div>
          <div className={`${g(3)} mb-[0.625rem]`}>
            <FormField labelEn="Mobile (SMS)" labelBn="মোবাইল (SMS)" value={form.phone} onChange={(v) => set('phone', v)} type="tel" required isBn={isBn} error={hasError('phone', activeTab)} onBlur={() => touch('phone')} />
            <FormField labelEn="Email" labelBn="ইমেইল" value={form.email} onChange={(v) => set('email', v)} type="email" isBn={isBn} />
            <FormField labelEn="District" labelBn="জেলা" value={form.district} onChange={(v) => set('district', v)} required isBn={isBn} options={DISTRICT_OPTIONS} error={hasError('district', activeTab)} onBlur={() => touch('district')} />
          </div>
          <div className={g(2)}>
            <FormField labelEn="Present Address" labelBn="বর্তমান ঠিকানা" value={form.presentAddress} onChange={(v) => set('presentAddress', v)} required isBn={isBn} error={hasError('presentAddress', activeTab)} onBlur={() => touch('presentAddress')} />
            <FormField labelEn="Permanent Address" labelBn="স্থায়ী ঠিকানা" value={form.permanentAddress} onChange={(v) => set('permanentAddress', v)} required isBn={isBn} error={hasError('permanentAddress', activeTab)} onBlur={() => touch('permanentAddress')} />
          </div>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className={card}>
          {sHead(<GraduationCap />, 'একাডেমিক তথ্য', 'Academic Info', 'var(--teal)', 'var(--teal-light)')}
          <div className={`${g(3)} mb-[0.625rem]`}>
            <FormField labelEn="Class" labelBn="শ্রেণি" value={form.class} onChange={(v) => { set('class', v); set('section', '') }} required isBn={isBn} options={classOptions} error={hasError('class', activeTab)} onBlur={() => touch('class')} />
            <FormField labelEn="Section" labelBn="সেকশন" value={form.section} onChange={(v) => set('section', v)} required isBn={isBn} options={form.class ? sectionsMap[form.class] || [] : []} error={hasError('section', activeTab)} onBlur={() => touch('section')} />
            <FormField labelEn="Roll" labelBn="রোল নম্বর" value={form.roll} onChange={(v) => set('roll', v)} required isBn={isBn} error={hasError('roll', activeTab)} onBlur={() => touch('roll')} />
          </div>
          <div className={`${g(3)} mb-[0.625rem]`}>
            <FormField labelEn="Academic Year" labelBn="শিক্ষাবর্ষ" value={form.academicYear} onChange={(v) => set('academicYear', v)} required isBn={isBn} options={sessions} error={hasError('academicYear', activeTab)} onBlur={() => touch('academicYear')} />
            <FormField labelEn="Admission Date" labelBn="ভর্তির তারিখ" value={form.admissionDate} onChange={(v) => set('admissionDate', v)} type="date" required isBn={isBn} error={hasError('admissionDate', activeTab)} onBlur={() => touch('admissionDate')} />
            <FormField labelEn="Previous School" labelBn="আগের স্কুল" value={form.previousSchool} onChange={(v) => set('previousSchool', v)} isBn={isBn} />
          </div>
        </div>
      )}

      {activeTab === 'guardian' && (<>
        <div className={card}>
          {sHead(<User />, 'পিতার তথ্য', "Father's Info", 'var(--teal)', 'var(--teal-light)')}
          <div className={`${g(3)} mb-[0.625rem]`}>
            <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={form.fatherNameEn} onChange={(v) => set('fatherNameEn', v)} required isBn={isBn} error={hasError('fatherNameEn', activeTab)} onBlur={() => touch('fatherNameEn')} />
            <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={form.fatherNameBn} onChange={(v) => set('fatherNameBn', v)} required isBn={isBn} error={hasError('fatherNameBn', activeTab)} onBlur={() => touch('fatherNameBn')} />
            <FormField labelEn="Occupation" labelBn="পেশা" value={form.fatherOccupation} onChange={(v) => set('fatherOccupation', v)} required isBn={isBn} error={hasError('fatherOccupation', activeTab)} onBlur={() => touch('fatherOccupation')} />
          </div>
          <div className={g(2)}>
            <FormField labelEn="Mobile" labelBn="মোবাইল" value={form.fatherPhone} onChange={(v) => set('fatherPhone', v)} type="tel" required isBn={isBn} error={hasError('fatherPhone', activeTab)} onBlur={() => touch('fatherPhone')} />
            <FormField labelEn="NID" labelBn="NID নম্বর" value={form.fatherNid} onChange={(v) => set('fatherNid', v)} isBn={isBn} />
          </div>
        </div>
        <div className={card}>
          {sHead(<User />, 'মাতার তথ্য', "Mother's Info", 'var(--purple)', 'var(--purple-light)')}
          <div className={`${g(3)} mb-[0.625rem]`}>
            <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={form.motherNameEn} onChange={(v) => set('motherNameEn', v)} required isBn={isBn} error={hasError('motherNameEn', activeTab)} onBlur={() => touch('motherNameEn')} />
            <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={form.motherNameBn} onChange={(v) => set('motherNameBn', v)} required isBn={isBn} error={hasError('motherNameBn', activeTab)} onBlur={() => touch('motherNameBn')} />
            <FormField labelEn="Occupation" labelBn="পেশা" value={form.motherOccupation} onChange={(v) => set('motherOccupation', v)} required isBn={isBn} error={hasError('motherOccupation', activeTab)} onBlur={() => touch('motherOccupation')} />
          </div>
          <div className={g(2)}>
            <FormField labelEn="Mobile" labelBn="মোবাইল" value={form.motherPhone} onChange={(v) => set('motherPhone', v)} type="tel" required isBn={isBn} error={hasError('motherPhone', activeTab)} onBlur={() => touch('motherPhone')} />
            <FormField labelEn="NID" labelBn="NID নম্বর" value={form.motherNid} onChange={(v) => set('motherNid', v)} isBn={isBn} />
          </div>
        </div>
        <div className={card}>
          {sHead(<ShieldCheck />, 'অভিভাবক (ঐচ্ছিক)', 'Guardian (Optional)', 'var(--green)', 'var(--green-light)')}
          <div className={g(3)}>
            <FormField labelEn="Name" labelBn="নাম" value={form.guardianName} onChange={(v) => set('guardianName', v)} isBn={isBn} />
            <FormField labelEn="Relation" labelBn="সম্পর্ক" value={form.guardianRelation} onChange={(v) => set('guardianRelation', v)} isBn={isBn} options={['Uncle / চাচা', 'Aunt / খালা', 'Grand Father / দাদা', 'Grand Mother / দাদি', 'Other / অন্যান্য']} />
            <FormField labelEn="Mobile" labelBn="মোবাইল" value={form.guardianPhone} onChange={(v) => set('guardianPhone', v)} type="tel" isBn={isBn} />
          </div>
        </div>
      </>)}

      <div className="flex gap-[0.625rem] justify-between flex-wrap">
        <div className="flex gap-[0.625rem]">
          {currentIdx > 0 && (
            <button type="button" onClick={prevTab} className="flex items-center gap-1 py-[0.625rem] px-4 rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
              <ChevronLeft size={14} />{isBn ? 'আগের' : 'Back'}
            </button>
          )}
            <button type="button" onClick={() => { setActiveTab('personal'); setForm(initForm(currentSession)); reset() }}
              className="py-[0.625rem] px-5 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
              {isBn ? 'রিসেট' : 'Reset'}
            </button>
        </div>
        <div className="flex gap-[0.625rem]">
          {activeTab !== 'guardian' ? (
            <button type="button" onClick={nextTab} className="flex items-center gap-1 py-[0.625rem] px-5 rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
              {isBn ? 'পরবর্তী' : 'Next'}<ChevronRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={openReview} className="flex items-center gap-1 py-[0.625rem] px-5 rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
              <FileText size={14} />{isBn ? 'পর্যালোচনা' : 'Review'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
