import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Camera, Clock, Users, Send, Briefcase, X, IdCard, MessageSquare, FileText, ChevronRight, ChevronLeft } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useTeacherStore } from '@/store/teacherStore'
import type { Teacher, TeacherStatus } from '@/pages/teachers/types'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const CATEGORIES = ['Teacher', 'Staff', 'Employee', 'Admin', 'Librarian', 'Accountant']

const inputBase = 'w-full py-[0.625rem] px-3 rounded-[0.5rem] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none transition-colors duration-200 box-border'
const inputNormal = inputBase + ' border border-[var(--border)] focus:border-[var(--brand)]'
const inputError = inputBase + ' border border-[var(--red)] focus:border-[var(--red)]'

function FormField({ labelEn, labelBn, value, onChange, type = 'text', required = false, isBn, options, error, onBlur }: {
  labelEn: string; labelBn: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; isBn: boolean; options?: string[]; error?: boolean; onBlur?: () => void
}) {
  const cls = error ? inputError : inputNormal
  if (options) {
    return (
      <div className="mb-[0.625rem]">
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {isBn ? labelBn : labelEn}{required && <span className="text-[var(--red)] ml-0.5">*</span>}
        </label>
        <select value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} required={required} className={cls}>
          <option value="">{isBn ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }
  if (type === 'date') {
    return (
      <div className="mb-[0.625rem]">
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {isBn ? labelBn : labelEn}{required && <span className="text-[var(--red)] ml-0.5">*</span>}
        </label>
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} required={required} className={cls} />
      </div>
    )
  }
  return (
    <div className="mb-[0.625rem]">
      <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
        {isBn ? labelBn : labelEn}{required && <span className="text-[var(--red)] ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} required={required} className={cls} />
    </div>
  )
}

const tabs = [
  { key: 'personal', icon: Users, labelBn: 'ব্যক্তিগত', labelEn: 'Personal' },
  { key: 'professional', icon: Briefcase, labelBn: 'পেশাদার', labelEn: 'Professional' },
  { key: 'family', icon: Users, labelBn: 'পরিবার', labelEn: 'Family' },
] as const
type TabKey = (typeof tabs)[number]['key']

type FormData = {
  photo: string; nameEn: string; nameBn: string; gender: string; dob: string; bloodGroup: string
  religion: string; phone: string; email: string; address: string; nid: string; emergencyPhone: string
  inTime: string; outTime: string
  departmentId: string; subjectIds: string[]; designation: string; category: string; qualification: string
  experience: string; joiningDate: string; salary: string; salaryStartDate: string; overtime: string
  status: TeacherStatus; signature: string
  fatherNameEn: string; fatherNameBn: string; fatherPhone: string; fatherNid: string
  motherNameEn: string; motherNameBn: string; motherPhone: string
  guardianName: string; guardianPhone: string; guardianRelation: string; parentAddress: string
}

const initForm = (): FormData => ({
  photo: '', nameEn: '', nameBn: '', gender: '', dob: '', bloodGroup: '',
  religion: '', phone: '', email: '', address: '', nid: '', emergencyPhone: '',
  inTime: '', outTime: '',
  departmentId: '', subjectIds: [], designation: '', category: 'Teacher', qualification: '',
  experience: '', joiningDate: '', salary: '', salaryStartDate: '', overtime: '',
  status: 'active', signature: '',
  fatherNameEn: '', fatherNameBn: '', fatherPhone: '', fatherNid: '',
  motherNameEn: '', motherNameBn: '', motherPhone: '',
  guardianName: '', guardianPhone: '', guardianRelation: '', parentAddress: '',
})

function validateTab(form: FormData, tab: TabKey): Set<string> {
  const e = new Set<string>()
  if (tab === 'personal') {
    if (!form.nameEn) e.add('nameEn')
    if (!form.phone) e.add('phone')
  }
  if (tab === 'professional') {
    if (!form.departmentId) e.add('departmentId')
  }
  return e
}

function SummaryRow({ labelBn, labelEn, value, isBn }: { labelBn: string; labelEn: string; value: string; isBn: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-b-0">
      <span className="text-[0.75rem] text-[var(--text-muted)] min-w-[7.5rem] shrink-0">{isBn ? labelBn : labelEn}</span>
      <span className={'text-[0.8125rem] font-medium ' + (value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] italic')}>
        {value || '\u2014'}
      </span>
    </div>
  )
}

export default function AddTeacherPage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { isMobile } = useWindowSize()
  const { departments, subjects, designations, addTeacher, getNextTeacherId } = useTeacherStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const signatureRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>(initForm)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [doneId, setDoneId] = useState('')
  const [photoErr, setPhotoErr] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('personal')
  const [showReview, setShowReview] = useState(false)
  const [tabErrors, setTabErrors] = useState<Record<TabKey, Set<string>>>({ personal: new Set(), professional: new Set(), family: new Set() })
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  const setField = useCallback((key: keyof FormData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }))
  }, [])

  const setArr = useCallback((key: 'subjectIds', val: string[]) => {
    setForm((p) => ({ ...p, [key]: val }))
  }, [])

  const touch = useCallback((key: string) => {
    setTouched((prev) => { const next = new Set(prev); next.add(key); return next })
  }, [])

  const hasError = useCallback((key: string) => {
    return touched.has(key) && tabErrors[activeTab]?.has(key)
  }, [touched, tabErrors, activeTab])

  useTabSlider({
    activeTab,
    tabRefs,
    sliderRef,
    getContainer: (slider) => slider.parentElement,
    useScrollLeft: false,
  })

  const toggleSubject = (id: string) => {
    setArr('subjectIds', form.subjectIds.includes(id) ? form.subjectIds.filter((x) => x !== id) : [...form.subjectIds, id])
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoErr('')
    if (file.size > 2 * 1024 * 1024) { setPhotoErr(isBn ? 'ছবির সাইজ সর্বোচ্চ ২ MB' : 'Photo must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setField('photo', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1 * 1024 * 1024) { alert(isBn ? 'সিগনেচারের সাইজ সর্বোচ্চ ১ MB' : 'Signature must be under 1MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setField('signature', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = useCallback(() => {
    setSaving(true)
    const now = new Date().toISOString().split('T')[0]
    const teacherId = getNextTeacherId()
    const teacher: Teacher = {
      id: teacherId, createdAt: now, updatedAt: now, status: form.status,
      photo: form.photo, nameEn: form.nameEn.trim(), nameBn: form.nameBn.trim(),
      gender: form.gender, dob: form.dob, bloodGroup: form.bloodGroup, religion: form.religion,
      phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim(),
      nid: form.nid.trim(), emergencyPhone: form.emergencyPhone.trim(),
      departmentId: form.departmentId, subjectIds: form.subjectIds,
      designation: form.designation, category: form.category,
      qualification: form.qualification.trim(), experience: form.experience.trim(),
      joiningDate: form.joiningDate, salary: Number(form.salary) || 0,
      salaryStartDate: form.salaryStartDate || undefined, overtime: Number(form.overtime) || 0,
      inTime: form.inTime, outTime: form.outTime,
      fatherNameEn: form.fatherNameEn.trim(), fatherNameBn: form.fatherNameBn.trim(),
      fatherPhone: form.fatherPhone.trim(), fatherNid: form.fatherNid.trim(),
      motherNameEn: form.motherNameEn.trim(), motherNameBn: form.motherNameBn.trim(),
      motherPhone: form.motherPhone.trim(),
      guardianName: form.guardianName.trim(), guardianPhone: form.guardianPhone.trim(),
      guardianRelation: form.guardianRelation.trim(), parentAddress: form.parentAddress.trim(),
      signature: form.signature,
    }
    addTeacher(teacher)
    setSaving(false)
    setDoneId(teacherId)
    setDone(true)
  }, [form, getNextTeacherId, addTeacher])

  const tabKeys = tabs.map((t) => t.key)
  const currentIdx = tabKeys.indexOf(activeTab)

  const goToTab = useCallback((tab: TabKey) => {
    setTabErrors((prev) => ({ ...prev, [activeTab]: validateTab(form, activeTab) }))
    setActiveTab(tab)
    setTouched(new Set())
  }, [activeTab, form])

  const nextTab = useCallback(() => {
    if (currentIdx < tabKeys.length - 1) {
      const errors = validateTab(form, activeTab)
      setTabErrors((prev) => ({ ...prev, [activeTab]: errors }))
      if (errors.size > 0) { const allKeys = new Set<string>(); errors.forEach((k) => allKeys.add(k)); setTouched(allKeys); return }
      setActiveTab(tabKeys[currentIdx + 1])
      setTouched(new Set())
    }
  }, [currentIdx, tabKeys, form, activeTab])

  const prevTab = useCallback(() => {
    if (currentIdx > 0) setActiveTab(tabKeys[currentIdx - 1])
  }, [currentIdx, tabKeys])

  const openReview = useCallback(() => {
    const errors = validateTab(form, activeTab)
    setTabErrors((prev) => ({ ...prev, [activeTab]: errors }))
    if (errors.size > 0) { const allKeys = new Set<string>(); errors.forEach((k) => allKeys.add(k)); setTouched(allKeys); return }
    setShowReview(true)
  }, [form, activeTab])

  const g = (n: number) => isMobile ? 'grid grid-cols-1 gap-y-[0.375rem]' : n === 2 ? 'grid grid-cols-2 gap-x-4 gap-y-[0.375rem]' : 'grid grid-cols-3 gap-x-4 gap-y-[0.375rem]'
  const card = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] mb-[0.875rem] ' + (isMobile ? 'p-[0.875rem]' : 'p-5')

  function sHead(icon: React.ReactNode, bn: string, en: string, col?: string, bg?: string) {
    const c = col || 'var(--brand)'
    const b = bg || 'var(--brand-light)'
    return (
      <div className="flex items-center gap-2 mb-4 pb-[0.625rem] border-b border-[var(--border)]">
        <div className="w-[1.875rem] h-[1.875rem] rounded-[0.5rem] flex items-center justify-center" style={{ background: b }}>
          {React.cloneElement(icon as React.ReactElement<Record<string, unknown>>, { size: 15, style: { color: c } })}
        </div>
        <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? bn : en}</span>
        <span className="text-[0.625rem] text-[var(--red)] ml-1">* {isBn ? 'বাধ্যতামূলক' : 'Required'}</span>
      </div>
    )
  }

  if (done) return (
    <div className="max-w-[37.5rem] mx-auto px-1">
      <div className={card + ' !text-center !pt-10'}>
        <div className="w-[3.75rem] h-[3.75rem] rounded-full bg-[var(--green-light)] flex items-center justify-center mx-auto mb-[0.875rem]">
          <CheckCircle size={30} className="text-[var(--green)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-[0.625rem]">{isBn ? 'শিক্ষক যোগ হয়েছে!' : 'Teacher Added!'}</h2>
        <div className="bg-[var(--brand-light)] border border-[var(--brand)] rounded-[0.625rem] py-3 px-5 inline-block mb-3">
          <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{isBn ? 'শিক্ষক আইডি' : 'Teacher ID'}</div>
          <div className="text-[1.375rem] font-bold text-[var(--brand)] tracking-[0.0625rem]">{doneId}</div>
        </div>
        <p className="text-[0.8125rem] text-[var(--teal)] mb-5">{isBn ? form.nameEn + ' সফলভাবে যোগ করা হয়েছে' : form.nameEn + ' has been added successfully'}</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <button type="button" onClick={() => { setDone(false); setForm(initForm()); setShowReview(false); setActiveTab('personal') }} className="flex items-center gap-1.5 px-[1.125rem] py-2.5 rounded-[0.5625rem] bg-[var(--brand)] border-0 text-white text-[0.8125rem] font-medium cursor-pointer">
            <Send size={14} /> {isBn ? 'নতুন শিক্ষক যোগ করুন' : 'Add Another Teacher'}
          </button>
          <button type="button" onClick={() => navigate('/teachers/all')} className="px-[1.125rem] py-2.5 rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer">
            {isBn ? 'সকল শিক্ষক' : 'All Teachers'}
          </button>
        </div>
      </div>
    </div>
  )

  if (showReview) return (
    <div>
      <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
        <button type="button" onClick={() => navigate('/teachers')} className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)]">
          {'\u2190'} {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className={(isMobile ? 'text-lg' : 'text-[1.375rem]') + ' font-semibold text-[var(--text-primary)]'}>{isBn ? 'পর্যালোচনা' : 'Review'}</h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">{isBn ? 'সকল তথ্য যাচাই করুন' : 'Verify all information'}</p>
        </div>
      </div>

      <div className={card + ' flex items-center justify-between flex-wrap gap-[0.625rem]'}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-[2.5rem] rounded-[0.625rem] bg-[var(--brand-light)] flex items-center justify-center"><IdCard size={20} className="text-[var(--brand)]" /></div>
          <div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'স্বয়ংক্রিয় শিক্ষক আইডি' : 'Auto Teacher ID'}</div>
            <div className="text-xl font-bold text-[var(--brand)] tracking-[0.125rem]">{getNextTeacherId()}</div>
          </div>
        </div>
      </div>

      <div className={card + ' !mb-4'}>
        {sHead(<FileText />, 'শিক্ষক পর্যালোচনা', 'Teacher Review', 'var(--amber)', 'var(--amber-light)')}
        <div className="flex items-center gap-2 bg-[var(--amber-light)] border border-[var(--amber)] rounded-[0.5rem] p-3 mb-4">
          <FileText size={16} className="text-[var(--amber)] shrink-0" />
          <p className="text-[0.8125rem] text-[var(--amber)]">{isBn ? 'সকল তথ্য যাচাই করুন। ভুল থাকলে Edit এ ক্লিক করুন।' : 'Verify all information. Click Edit to make changes.'}</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} style={{ color: 'var(--brand)' }} />
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
                <SummaryRow labelBn="NID" labelEn="NID" value={form.nid} isBn={isBn} />
                <SummaryRow labelBn="মোবাইল" labelEn="Mobile" value={form.phone} isBn={isBn} />
                <SummaryRow labelBn="ইমেইল" labelEn="Email" value={form.email} isBn={isBn} />
                <SummaryRow labelBn="জরুরি মোবাইল" labelEn="Emergency Phone" value={form.emergencyPhone} isBn={isBn} />
                <SummaryRow labelBn="ঠিকানা" labelEn="Address" value={form.address} isBn={isBn} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={14} style={{ color: 'var(--amber)' }} />
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{isBn ? 'পেশাদার তথ্য' : 'Professional Information'}</span>
            <button type="button" onClick={() => { setShowReview(false); setActiveTab('professional') }} className="text-[0.6875rem] text-[var(--brand)] ml-auto bg-transparent border-none cursor-pointer underline">{isBn ? 'সম্পাদনা' : 'Edit'}</button>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-[0.5rem] p-3">
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">{isBn ? 'সময়সূচি' : 'Schedule'}</div>
            <SummaryRow labelBn="প্রবেশ সময়" labelEn="In Time" value={form.inTime} isBn={isBn} />
            <SummaryRow labelBn="প্রস্থান সময়" labelEn="Out Time" value={form.outTime} isBn={isBn} />
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mt-3 mb-1">{isBn ? 'বিভাগ ও পদবি' : 'Department & Designation'}</div>
            <SummaryRow labelBn="বিভাগ" labelEn="Department" value={departments.find((d) => d.id === form.departmentId) ? (isBn ? departments.find((d) => d.id === form.departmentId)!.nameBn : departments.find((d) => d.id === form.departmentId)!.name) : ''} isBn={isBn} />
            <SummaryRow labelBn="পদবি" labelEn="Designation" value={form.designation} isBn={isBn} />
            <SummaryRow labelBn="ক্যাটাগরি" labelEn="Category" value={form.category} isBn={isBn} />
            <SummaryRow labelBn="যোগ্যতা" labelEn="Qualification" value={form.qualification} isBn={isBn} />
            <SummaryRow labelBn="অভিজ্ঞতা" labelEn="Experience" value={form.experience} isBn={isBn} />
            <SummaryRow labelBn="যোগদানের তারিখ" labelEn="Joining Date" value={form.joiningDate} isBn={isBn} />
            <SummaryRow labelBn="অবস্থা" labelEn="Status" value={form.status} isBn={isBn} />
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mt-3 mb-1">{isBn ? 'বেতন' : 'Salary'}</div>
            <SummaryRow labelBn="মূল বেতন" labelEn="Basic Salary" value={form.salary} isBn={isBn} />
            <SummaryRow labelBn="ওভারটাইম" labelEn="Overtime" value={form.overtime} isBn={isBn} />
            <SummaryRow labelBn="বেতন শুরুর তারিখ" labelEn="Salary Start Date" value={form.salaryStartDate} isBn={isBn} />
            {form.signature && <SummaryRow labelBn="সিগনেচার" labelEn="Signature" value="Uploaded" isBn={isBn} />}
            {form.subjectIds.length > 0 && <SummaryRow labelBn="বিষয়" labelEn="Subjects" value={form.subjectIds.map((id) => subjects.find((s) => s.id === id)?.name || id).join(', ')} isBn={isBn} />}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} style={{ color: 'var(--purple)' }} />
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{isBn ? 'পরিবার' : 'Family Information'}</span>
            <button type="button" onClick={() => { setShowReview(false); setActiveTab('family') }} className="text-[0.6875rem] text-[var(--brand)] ml-auto bg-transparent border-none cursor-pointer underline">{isBn ? 'সম্পাদনা' : 'Edit'}</button>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-[0.5rem] p-3">
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">{isBn ? 'পিতা' : 'Father'}</div>
            <SummaryRow labelBn="নাম (EN)" labelEn="Name (EN)" value={form.fatherNameEn} isBn={isBn} />
            <SummaryRow labelBn="নাম (BN)" labelEn="Name (BN)" value={form.fatherNameBn} isBn={isBn} />
            <SummaryRow labelBn="মোবাইল" labelEn="Phone" value={form.fatherPhone} isBn={isBn} />
            <SummaryRow labelBn="NID" labelEn="NID" value={form.fatherNid} isBn={isBn} />
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mt-3 mb-1">{isBn ? 'মাতা' : 'Mother'}</div>
            <SummaryRow labelBn="নাম (EN)" labelEn="Name (EN)" value={form.motherNameEn} isBn={isBn} />
            <SummaryRow labelBn="নাম (BN)" labelEn="Name (BN)" value={form.motherNameBn} isBn={isBn} />
            <SummaryRow labelBn="মোবাইল" labelEn="Phone" value={form.motherPhone} isBn={isBn} />
            <div className="text-[0.75rem] font-medium text-[var(--text-muted)] mt-3 mb-1">{isBn ? 'অভিভাবক (ঐচ্ছিক)' : 'Guardian (Optional)'}</div>
            <SummaryRow labelBn="নাম" labelEn="Name" value={form.guardianName} isBn={isBn} />
            <SummaryRow labelBn="সম্পর্ক" labelEn="Relation" value={form.guardianRelation} isBn={isBn} />
            <SummaryRow labelBn="মোবাইল" labelEn="Phone" value={form.guardianPhone} isBn={isBn} />
            <SummaryRow labelBn="ঠিকানা" labelEn="Address" value={form.parentAddress} isBn={isBn} />
          </div>
        </div>

        <div className="flex items-center gap-[0.625rem] bg-[var(--teal-light)] border border-[var(--teal)] rounded-[0.625rem] py-[0.625rem] px-[0.875rem]">
          <MessageSquare size={16} className="text-[var(--teal)] shrink-0" />
          <p className="text-[0.75rem] text-[var(--teal)]">{isBn ? 'শিক্ষক যোগ করলে ' + (form.phone || '...') + ' এ SMS যাবে।' : 'SMS will be sent to ' + (form.phone || '...') + ' after submission.'}</p>
        </div>
      </div>

      <div className="flex gap-[0.625rem] justify-between flex-wrap">
        <div className="flex gap-[0.625rem]">
          <button type="button" onClick={() => setShowReview(false)} className="flex items-center gap-1 py-[0.625rem] px-4 rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
            <ChevronLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
          </button>
          <button type="button" onClick={() => { setActiveTab('personal'); setForm(initForm()); setShowReview(false); setTabErrors({ personal: new Set(), professional: new Set(), family: new Set() }); setTouched(new Set()) }}
            className="py-[0.625rem] px-5 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
            {isBn ? 'রিসেট' : 'Reset'}
          </button>
        </div>
        <button type="button" onClick={handleSubmit} disabled={saving}
          className={'flex items-center gap-[0.4375rem] py-[0.625rem] px-6 rounded-[0.5625rem] border-none text-white text-[0.8125rem] font-semibold ' + (saving ? 'bg-[var(--text-muted)] cursor-default' : 'bg-[var(--brand)] cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.35)]')}>
          <Send size={14} />{saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : isBn ? 'সাবমিট' : 'Submit'}
        </button>
      </div>
    </div>
  )

  return (
    <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
      <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
        <button type="button" onClick={() => navigate('/teachers')} className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)]">
          {'\u2190'} {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className={(isMobile ? 'text-lg' : 'text-[1.375rem]') + ' font-semibold text-[var(--text-primary)]'}>{isBn ? 'নতুন শিক্ষক যোগ' : 'Add Teacher'}</h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">{isBn ? 'সকল তথ্য পূরণ করে সাবমিট করুন' : 'Fill in all details and submit'}</p>
        </div>
      </div>

      <div className={card + ' flex items-center justify-between flex-wrap gap-[0.625rem]'}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-[2.5rem] rounded-[0.625rem] bg-[var(--brand-light)] flex items-center justify-center"><IdCard size={20} className="text-[var(--brand)]" /></div>
          <div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'স্বয়ংক্রিয় শিক্ষক আইডি' : 'Auto Teacher ID'}</div>
            <div className="text-xl font-bold text-[var(--brand)] tracking-[0.125rem]">{getNextTeacherId()}</div>
          </div>
        </div>
      </div>

      <div className={'relative flex gap-[0.375rem] glass rounded-xl p-[0.3125rem] w-full mb-4 ' + (isMobile ? 'flex-wrap' : 'flex-nowrap')}>
        <div ref={sliderRef} className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] transition-all duration-300 ease-out" style={{ background: 'var(--brand)', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)', zIndex: 0 }} />
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.key} ref={(el) => { if (el) tabRefs.current.set(tab.key, el) }} onClick={() => goToTab(tab.key)}
              className={'relative z-10 flex-1 flex items-center justify-center gap-[0.4375rem] px-[0.875rem] py-[0.5625rem] rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 ' +
                (activeTab === tab.key ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}
              style={{ background: 'transparent' }}>
              <Icon size={15} />
              <span className="hidden sm:inline">{isBn ? tab.labelBn : tab.labelEn}</span>
              <span className="sm:hidden">{tabs.indexOf(tab) + 1}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'personal' && (
        <div className={card}>
          {sHead(<Users />, 'ব্যক্তিগত তথ্য', 'Personal Information')}
          <div className="flex gap-4 mb-[0.875rem] flex-wrap">
            <div>
              <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem]">{isBn ? 'ছবি (সর্বোচ্চ ২ MB)' : 'Photo (max 2MB)'}</div>
              <div onClick={() => fileRef.current?.click()} className={'w-[5.625rem] h-[6.875rem] rounded-[0.625rem] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--bg-secondary)] relative ' + (form.photo ? 'border-[var(--brand)]' : 'border-[var(--border-2)]')}>
                {form.photo ? <img src={form.photo} alt="" className="w-full h-full object-cover" /> : <div className="text-center text-[var(--text-muted)] pointer-events-none"><Camera size={22} className="block mx-auto mb-1" /><div className="text-[0.625rem]">{isBn ? 'ছবি' : 'Photo'}</div></div>}
                {form.photo && <button type="button" onClick={(e) => { e.stopPropagation(); setField('photo', '') }} className="absolute top-[0.1875rem] right-[0.1875rem] w-[1.125rem] h-[1.125rem] rounded-full bg-[var(--red)] border-0 cursor-pointer flex items-center justify-center text-white"><X size={10} /></button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              {photoErr && <div className="text-[0.625rem] text-[var(--red)] mt-[0.1875rem] max-w-[5.625rem]">{photoErr}</div>}
            </div>
            <div className="flex-1 min-w-[12.5rem]">
              <div className={g(2)}>
                <FormField labelEn="Name (English)" labelBn="নাম (ইংরেজি)" value={form.nameEn} onChange={(v) => setField('nameEn', v)} required isBn={isBn} error={hasError('nameEn')} onBlur={() => touch('nameEn')} />
                <FormField labelEn="Name (Bangla)" labelBn="নাম (বাংলা)" value={form.nameBn} onChange={(v) => setField('nameBn', v)} isBn={isBn} />
              </div>
              <div className={g(2)}>
                <FormField labelEn="Date of Birth" labelBn="জন্ম তারিখ" value={form.dob} onChange={(v) => setField('dob', v)} type="date" isBn={isBn} />
                <FormField labelEn="Gender" labelBn="লিঙ্গ" value={form.gender} onChange={(v) => setField('gender', v)} required isBn={isBn} options={['Male', 'Female']} error={hasError('gender')} onBlur={() => touch('gender')} />
              </div>
            </div>
          </div>
          <div className={g(3)}>
            <FormField labelEn="Blood Group" labelBn="রক্তের গ্রুপ" value={form.bloodGroup} onChange={(v) => setField('bloodGroup', v)} isBn={isBn} options={BLOOD_GROUPS} />
            <FormField labelEn="Religion" labelBn="ধর্ম" value={form.religion} onChange={(v) => setField('religion', v)} isBn={isBn} options={['Islam', 'Hinduism', 'Christianity', 'Buddhism']} />
            <FormField labelEn="NID" labelBn="জাতীয় পরিচয়পত্র" value={form.nid} onChange={(v) => setField('nid', v)} isBn={isBn} />
          </div>
          <div className={g(3)}>
            <FormField labelEn="Mobile" labelBn="মোবাইল" value={form.phone} onChange={(v) => setField('phone', v)} type="tel" required isBn={isBn} error={hasError('phone')} onBlur={() => touch('phone')} />
            <FormField labelEn="Email" labelBn="ইমেইল" value={form.email} onChange={(v) => setField('email', v)} type="email" isBn={isBn} />
            <FormField labelEn="Emergency Phone" labelBn="জরুরি মোবাইল" value={form.emergencyPhone} onChange={(v) => setField('emergencyPhone', v)} type="tel" isBn={isBn} />
          </div>
          <div className={g(2)}>
            <FormField labelEn="Address" labelBn="ঠিকানা" value={form.address} onChange={(v) => setField('address', v)} isBn={isBn} />
          </div>
        </div>
      )}

      {activeTab === 'professional' && (
        <div className={card}>
          {sHead(<Clock />, 'সময়সূচি', 'Schedule', 'var(--teal)', 'var(--teal-light)')}
          <div className={g(2)}>
            <div>
              <FormField labelEn="In Time" labelBn="প্রবেশ সময়" value={form.inTime} onChange={(v) => setField('inTime', v)} type="time" isBn={isBn} />
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.1875rem]">{isBn ? 'বায়োমেট্রিক থেকে পুল করা হবে' : 'Pulled from biometric machine'}</div>
            </div>
            <div>
              <FormField labelEn="Out Time" labelBn="প্রস্থান সময়" value={form.outTime} onChange={(v) => setField('outTime', v)} type="time" isBn={isBn} />
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.1875rem]">{isBn ? 'বায়োমেট্রিক থেকে পুল করা হবে' : 'Pulled from biometric machine'}</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            {sHead(<Briefcase />, 'পেশাদার তথ্য', 'Professional Information', 'var(--amber)', 'var(--amber-light)')}
            <div className={g(3)}>
              <div className="mb-[0.625rem]">
                <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
                  {isBn ? 'বিভাগ' : 'Department'}<span className="text-[var(--red)] ml-0.5">*</span>
                </label>
                {departments.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <input value="" disabled placeholder={isBn ? 'কোনো বিভাগ নেই' : 'No departments'} className={inputNormal + ' opacity-60'} style={{ flex: 1 }} />
                    <button onClick={() => { localStorage.setItem('edutech_navChain', JSON.stringify([{ path: '/teachers/add', label: isBn ? 'শিক্ষক যোগ' : 'Add Teacher' }])); navigate('/teachers/departments') }}
                      className="py-[0.5rem] px-[0.75rem] rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer border-none whitespace-nowrap">
                      {isBn ? 'বিভাগ তৈরি করুন \u2192' : 'Create Dept \u2192'}
                    </button>
                  </div>
                ) : (
                  <select value={form.departmentId} onChange={(e) => { setField('departmentId', e.target.value); setArr('subjectIds', []) }} onBlur={() => touch('departmentId')} required
                    className={hasError('departmentId') ? inputError : inputNormal}>
                    <option value="">{isBn ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{isBn ? d.nameBn : d.name}</option>)}
                  </select>
                )}
              </div>
              <div className="mb-[0.625rem]">
                <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">{isBn ? 'পদবি' : 'Designation'}</label>
                {designations.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <input value="" disabled placeholder={isBn ? 'কোনো পদবি নেই' : 'No designations'} className={inputNormal + ' opacity-60'} style={{ flex: 1 }} />
                    <button onClick={() => { localStorage.setItem('edutech_navChain', JSON.stringify([{ path: '/teachers/add', label: isBn ? 'শিক্ষক যোগ' : 'Add Teacher' }])); navigate('/teachers/designations') }}
                      className="py-[0.5rem] px-[0.75rem] rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer border-none whitespace-nowrap">
                      {isBn ? 'পদবি তৈরি করুন \u2192' : 'Create Designation \u2192'}
                    </button>
                  </div>
                ) : (
                  <select value={form.designation} onChange={(e) => setField('designation', e.target.value)} className={inputNormal}>
                    <option value="">{isBn ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
                    {designations.map((d) => <option key={d.id} value={d.name}>{isBn ? d.nameBn : d.name}</option>)}
                  </select>
                )}
              </div>
              <FormField labelEn="Category" labelBn="ক্যাটাগরি" value={form.category} onChange={(v) => setField('category', v)} isBn={isBn} options={CATEGORIES} />
              <FormField labelEn="Qualification" labelBn="যোগ্যতা" value={form.qualification} onChange={(v) => setField('qualification', v)} isBn={isBn} />
            </div>
            <div className={g(3)}>
              <FormField labelEn="Experience" labelBn="অভিজ্ঞতা" value={form.experience} onChange={(v) => setField('experience', v)} isBn={isBn} />
              <FormField labelEn="Joining Date" labelBn="যোগদানের তারিখ" value={form.joiningDate} onChange={(v) => setField('joiningDate', v)} type="date" isBn={isBn} />
              <FormField labelEn="Status" labelBn="অবস্থা" value={form.status} onChange={(v) => setField('status', v as TeacherStatus)} isBn={isBn} options={['active', 'inactive', 'on-leave']} />
            </div>
            <div className={g(2)}>
              <FormField labelEn="Basic Salary (Monthly)" labelBn="মূল বেতন (মাসিক)" value={form.salary} onChange={(v) => setField('salary', v)} type="number" isBn={isBn} />
              <FormField labelEn="Overtime (Hourly)" labelBn="ওভারটাইম (ঘণ্টার হার)" value={form.overtime} onChange={(v) => setField('overtime', v)} type="number" isBn={isBn} />
            </div>
            <div className={g(2)}>
              <FormField labelEn="Salary Start Date (Billing)" labelBn="বেতন শুরুর তারিখ (বিলিং)" value={form.salaryStartDate} onChange={(v) => setField('salaryStartDate', v)} type="date" isBn={isBn} />
            </div>

            <div className="mt-[0.875rem]">
              <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem]">{isBn ? 'সিগনেচার (সর্বোচ্চ ১ MB)' : 'Signature (max 1MB)'}</div>
              <div className="flex items-center gap-3">
                <div onClick={() => signatureRef.current?.click()} className={'w-[10rem] h-[3.5rem] rounded-[0.5rem] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--bg-secondary)] relative ' + (form.signature ? 'border-[var(--brand)]' : 'border-[var(--border-2)]')}>
                  {form.signature ? <img src={form.signature} alt="" className="w-full h-full object-contain" /> : <div className="text-center text-[var(--text-muted)] pointer-events-none"><div className="text-[0.625rem]">{isBn ? 'সিগনেচার' : 'Signature'}</div></div>}
                  {form.signature && <button type="button" onClick={(e) => { e.stopPropagation(); setField('signature', '') }} className="absolute top-[0.1875rem] right-[0.1875rem] w-[1.125rem] h-[1.125rem] rounded-full bg-[var(--red)] border-0 cursor-pointer flex items-center justify-center text-white"><X size={10} /></button>}
                </div>
                <input ref={signatureRef} type="file" accept="image/*" onChange={handleSignature} className="hidden" />
              </div>
            </div>

            {form.departmentId && (
              <div className="mt-[0.875rem]">
                <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">{isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subjects'}</label>
                {subjects.filter((s) => s.departmentId === form.departmentId || s.departmentIds?.includes(form.departmentId)).length > 0 && (
                  <div className="mb-2">
                    <div className="text-[0.6875rem] text-[var(--green)] font-medium mb-1">{isBn ? 'সুপারিশকৃত' : 'Recommended'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {subjects.filter((s) => s.departmentId === form.departmentId || s.departmentIds?.includes(form.departmentId)).map((s) => (
                        <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                          className={'px-3 py-[0.3125rem] rounded-lg text-xs cursor-pointer border ' + (form.subjectIds.includes(s.id) ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] font-semibold' : 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]')}>
                          {isBn ? s.nameBn : s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {subjects.filter((s) => s.departmentId !== form.departmentId && !s.departmentIds?.includes(form.departmentId)).length > 0 && (
                  <div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)] font-medium mb-1">{isBn ? 'অন্যান্য বিভাগ' : 'Other Departments'}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {subjects.filter((s) => s.departmentId !== form.departmentId && !s.departmentIds?.includes(form.departmentId)).map((s) => (
                        <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                          className={'px-3 py-[0.3125rem] rounded-lg text-xs cursor-pointer border ' + (form.subjectIds.includes(s.id) ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] font-semibold' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
                          {isBn ? s.nameBn : s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'family' && (<>
        <div className={card}>
          {sHead(<Users />, 'পিতার তথ্য', "Father's Info", 'var(--teal)', 'var(--teal-light)')}
          <div className={g(3)}>
            <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={form.fatherNameEn} onChange={(v) => setField('fatherNameEn', v)} isBn={isBn} />
            <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={form.fatherNameBn} onChange={(v) => setField('fatherNameBn', v)} isBn={isBn} />
            <FormField labelEn="Phone" labelBn="মোবাইল" value={form.fatherPhone} onChange={(v) => setField('fatherPhone', v)} type="tel" isBn={isBn} />
          </div>
          <div className={g(2)}>
            <FormField labelEn="NID" labelBn="NID নম্বর" value={form.fatherNid} onChange={(v) => setField('fatherNid', v)} isBn={isBn} />
          </div>
        </div>
        <div className={card}>
          {sHead(<Users />, 'মাতার তথ্য', "Mother's Info", 'var(--purple)', 'var(--purple-light)')}
          <div className={g(3)}>
            <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={form.motherNameEn} onChange={(v) => setField('motherNameEn', v)} isBn={isBn} />
            <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={form.motherNameBn} onChange={(v) => setField('motherNameBn', v)} isBn={isBn} />
            <FormField labelEn="Phone" labelBn="মোবাইল" value={form.motherPhone} onChange={(v) => setField('motherPhone', v)} type="tel" isBn={isBn} />
          </div>
        </div>
        <div className={card}>
          {sHead(<Users />, 'অভিভাবক (ঐচ্ছিক)', 'Guardian (Optional)', 'var(--green)', 'var(--green-light)')}
          <div className={g(3)}>
            <FormField labelEn="Name" labelBn="নাম" value={form.guardianName} onChange={(v) => setField('guardianName', v)} isBn={isBn} />
            <FormField labelEn="Relation" labelBn="সম্পর্ক" value={form.guardianRelation} onChange={(v) => setField('guardianRelation', v)} isBn={isBn} options={['Uncle', 'Aunt', 'Grand Father', 'Grand Mother', 'Other']} />
            <FormField labelEn="Phone" labelBn="মোবাইল" value={form.guardianPhone} onChange={(v) => setField('guardianPhone', v)} type="tel" isBn={isBn} />
          </div>
          <div className={g(2)}>
            <FormField labelEn="Parent Address" labelBn="অভিভাবকের ঠিকানা" value={form.parentAddress} onChange={(v) => setField('parentAddress', v)} isBn={isBn} />
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
          <button type="button" onClick={() => { setActiveTab('personal'); setForm(initForm()); setTabErrors({ personal: new Set(), professional: new Set(), family: new Set() }); setTouched(new Set()) }}
            className="py-[0.625rem] px-5 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
            {isBn ? 'রিসেট' : 'Reset'}
          </button>
        </div>
        <div className="flex gap-[0.625rem]">
          {activeTab !== 'family' ? (
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
