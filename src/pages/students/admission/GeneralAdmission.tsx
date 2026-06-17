import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { CheckCircle, User, GraduationCap, ShieldCheck, IdCard, Camera, X, Download, MessageSquare, Send } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import type { StudentAdmission } from './types'
import { generateA4HTML } from './a4Template'
import QRCode from 'qrcode'

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
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = url
  })
}

interface FieldProps {
  labelEn: string
  labelBn: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  options?: string[]
  isBn: boolean
}
function FormField({ labelEn, labelBn, value, onChange, type = 'text', required = false, options, isBn }: FieldProps) {
  const inputClass = 'w-full h-[2.75rem] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] hover:border-[var(--border-2)] hover:shadow-[var(--shadow-sm)] transition-all duration-200'

  if (options) {
    return (
      <div className="mb-[0.625rem]">
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {isBn ? labelBn : labelEn}
          {required && <span className="text-[var(--red)] ml-0.5">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClass}
        >
          <option value="">{isBn ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'date') {
    return (
      <div className="mb-[0.625rem]">
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {isBn ? labelBn : labelEn}
          {required && <span className="text-[var(--red)] ml-0.5">*</span>}
        </label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClass}
        />
      </div>
    )
  }

  return (
    <div className="mb-[0.625rem]">
      <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
        {isBn ? labelBn : labelEn}
        {required && <span className="text-[var(--red)] ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={inputClass}
      />
    </div>
  )
}

export default function GeneralAdmission() {
  const { isMobile } = useWindowSize()
  const { addStudent, getNextId } = useAdmissionStore()
  const students = useAdmissionStore((s) => s.students)
  const { classes, institution } = useClassStore()
  const { teachers } = useTeacherStore()
  const isBn = useBn()

  const currentSession = institution.currentSession
  const sessions = institution.sessions

  const classOptions = useMemo(() => classes.map((cls) => cls.name), [classes])
  const teacherOptions = useMemo(
    () => teachers.filter((t) => t.status === 'active').map((t) => `${t.id} - ${t.nameEn}`),
    [teachers]
  )
  const sectionsMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    classes.forEach((cls) => {
      map[cls.name] = cls.sections.map((s) => s.name)
    })
    return map
  }, [classes])

  const [form, setForm] = useState<FormData>(() => initForm(currentSession))
  const [studentId] = useState(() => getNextId())
  const [done, setDone] = useState(false)
  const [doneId, setDoneId] = useState('')
  const [photoErr, setPhotoErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = useCallback((key: keyof FormData, val: string) => {
    setForm((p) => ({ ...p, [key]: val }))
  }, [])

  // Auto-set roll number when class, section, or academic year changes
  useEffect(() => {
    if (!form.class || !form.section || !form.academicYear) return
    const sameGroup = students.filter(
      (s) => s.class === form.class && s.section === form.section && s.academicYear === form.academicYear
    )
    const maxRoll = sameGroup.reduce((max, s) => {
      const r = parseInt(s.roll, 10)
      return !isNaN(r) && r > max ? r : max
    }, 0)
    set('roll', String(maxRoll + 1))
  }, [form.class, form.section, form.academicYear, students, set])

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoErr('')
    if (file.size > 2 * 1024 * 1024) {
      setPhotoErr(isBn ? 'ছবির সাইজ সর্বোচ্চ ২ MB' : 'Photo must be under 2MB')
      return
    }
    try {
      set('photo', await compressImage(file))
    } catch {
      setPhotoErr(isBn ? 'ছবি লোড করতে সমস্যা' : 'Error loading image')
    }
  }

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const now = new Date().toISOString().split('T')[0]
      addStudent({ ...form, id: studentId, createdAt: now, updatedAt: now, status: 'pending' })
      console.log(`📱 SMS → ${form.phone}: আপনার ভর্তি আবেদন আইডি ${studentId}`)
      setDoneId(studentId)
      setDone(true)
    },
    [form, studentId, addStudent]
  )

  const downloadPDF = useCallback(async () => {
    const s = useAdmissionStore.getState().students.find((x) => x.id === doneId)
    if (!s) return
    const qrDataUrl = await QRCode.toDataURL(s.id, { width: 120, margin: 1 })
    const tName = s.teacherId ? useTeacherStore.getState().teachers.find((t) => t.id === s.teacherId)?.nameEn : ''
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(generateA4HTML(s, isBn, qrDataUrl, tName))
    win.document.close()
    setTimeout(() => win.print(), 800)
  }, [doneId, isBn])

  const g = (n: number) => {
    const cols = n === 3 ? 'grid-cols-3' : 'grid-cols-2'
    return isMobile ? 'grid grid-cols-1 gap-y-[0.375rem]' : `grid ${cols} gap-x-4 gap-y-[0.375rem]`
  }

  const card = `bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] mb-[0.875rem] ${isMobile ? 'p-[0.875rem]' : 'p-5'}`

  const sHead = (icon: React.ReactNode, bn: string, en: string, col = 'var(--brand)', bg = 'var(--brand-light)') => (
    <div className="flex items-center gap-2 mb-4 pb-[0.625rem] border-b border-[var(--border)]">
      <div className="w-[1.875rem] h-[1.875rem] rounded-[0.5rem] flex items-center justify-center" style={{ background: bg }}>
        {React.cloneElement(icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>, {
          size: 15,
          style: { color: col },
        })}
      </div>
      <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? bn : en}</span>
      <span className="text-[0.625rem] text-[var(--red)] ml-1">* {isBn ? 'বাধ্যতামূলক' : 'Required'}</span>
    </div>
  )

  // ── Success screen ──
  if (done)
    return (
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] mb-[0.875rem] text-center py-[2.5rem] px-5">
        <div className="w-[3.75rem] h-[3.75rem] rounded-full bg-[var(--green-light)] flex items-center justify-center mx-auto mb-[0.875rem]">
          <CheckCircle size={30} style={{ color: 'var(--green)' }} />
        </div>
        <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)] mb-[0.625rem]">
          {isBn ? 'আবেদন জমা হয়েছে!' : 'Application Submitted!'}
        </h2>
        <div className="bg-[var(--brand-light)] border border-[var(--brand)] rounded-[0.625rem] py-3 px-5 inline-block mb-3">
          <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{isBn ? 'ছাত্র আইডি' : 'Student ID'}</div>
          <div className="text-[1.375rem] font-bold text-[var(--brand)] tracking-[0.0625rem]">{doneId}</div>
        </div>
        <p className="text-[0.8125rem] text-[var(--teal)] mb-[0.375rem]">
          ✅ {isBn ? `${form.phone} নম্বরে SMS পাঠানো হয়েছে` : `SMS sent to ${form.phone}`}
        </p>
        <p className="text-[0.75rem] text-[var(--amber)] mb-5">
          ⏳ {isBn ? 'আবেদনটি Pending অবস্থায় আছে। Manage থেকে Approve করুন।' : 'Pending approval. Go to Manage tab to approve.'}
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-[0.375rem] py-[0.625rem] px-[1.125rem] rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-medium cursor-pointer font-[inherit]"
          >
            <Download size={14} /> {isBn ? 'আবেদনপত্র PDF' : 'Download Application PDF'}
          </button>
          <button
            onClick={() => {
              setDone(false)
              setForm(initForm(currentSession))
            }}
            className="py-[0.625rem] px-[1.125rem] rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
          >
            {isBn ? 'নতুন আবেদন' : 'New Application'}
          </button>
        </div>
      </div>
    )

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      {/* ID bar */}
      <div className={`${card} flex items-center justify-between flex-wrap gap-[0.625rem]`}>
        <div className="flex items-center gap-3">
          <div className="w-[2.5rem] h-[2.5rem] rounded-[0.625rem] bg-[var(--brand-light)] flex items-center justify-center">
            <IdCard size={20} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'স্বয়ংক্রিয় ছাত্র আইডি' : 'Auto Student ID'}</div>
            <div className="text-[1.25rem] font-bold text-[var(--brand)] tracking-[0.125rem]">{studentId}</div>
          </div>
        </div>
        <div className="text-[0.75rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] py-[0.375rem] px-3 rounded-[0.5rem] border border-[var(--border)]">
          📅 {form.admissionDate}
        </div>
      </div>

      {/* Personal */}
      <div className={card}>
        {sHead(<User />, 'ব্যক্তিগত তথ্য', 'Personal Information')}
        <div className="flex gap-4 mb-[0.875rem] flex-wrap">
          {/* Photo */}
          <div>
            <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem]">
              {isBn ? 'ছবি (সর্বোচ্চ ২ MB)' : 'Photo (max 2MB)'}
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              className="w-[5.625rem] h-[6.875rem] rounded-[0.625rem] flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--bg-secondary)] relative"
              style={{ border: `2px dashed ${form.photo ? 'var(--brand)' : 'var(--border-2)'}` }}
            >
              {form.photo ? (
                <img src={form.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-[var(--text-muted)] pointer-events-none">
                  <Camera size={22} className="block mx-auto mb-1" />
                  <div className="text-[0.625rem]">{isBn ? 'ছবি' : 'Photo'}</div>
                </div>
              )}
              {form.photo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    set('photo', '')
                  }}
                  className="absolute top-[0.1875rem] right-[0.1875rem] w-[1.125rem] h-[1.125rem] rounded-full bg-[var(--red)] border-none cursor-pointer flex items-center justify-center text-white"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            {photoErr && <div className="text-[0.625rem] text-[var(--red)] mt-[0.1875rem] max-w-[5.625rem]">{photoErr}</div>}
          </div>
          {/* Name + DOB + Gender */}
          <div className="flex-1 min-w-[12.5rem]">
            <div className={`${g(2)} mb-[0.625rem]`}>
              <FormField
                labelEn="Name (English)"
                labelBn="নাম (ইংরেজি)"
                value={form.nameEn}
                onChange={(v) => set('nameEn', v)}
                required
                isBn={isBn}
              />
              <FormField
                labelEn="Name (Bengali)"
                labelBn="নাম (বাংলা)"
                value={form.nameBn}
                onChange={(v) => set('nameBn', v)}
                required
                isBn={isBn}
              />
            </div>
            <div className={g(2)}>
              <FormField
                labelEn="Date of Birth"
                labelBn="জন্ম তারিখ"
                value={form.dob}
                onChange={(v) => set('dob', v)}
                type="date"
                required
                isBn={isBn}
              />
              <FormField
                labelEn="Gender"
                labelBn="লিঙ্গ"
                value={form.gender}
                onChange={(v) => set('gender', v)}
                required
                isBn={isBn}
                options={['Male / পুরুষ', 'Female / মহিলা', 'Other / অন্যান্য']}
              />
            </div>
          </div>
        </div>
        <div className={`${g(3)} mb-[0.625rem]`}>
          <FormField
            labelEn="Blood Group"
            labelBn="রক্তের গ্রুপ"
            value={form.bloodGroup}
            onChange={(v) => set('bloodGroup', v)}
            required
            isBn={isBn}
            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
          />
          <FormField
            labelEn="Religion"
            labelBn="ধর্ম"
            value={form.religion}
            onChange={(v) => set('religion', v)}
            required
            isBn={isBn}
            options={['Islam / ইসলাম', 'Hinduism / হিন্দু', 'Christianity / খ্রিস্টান', 'Buddhism / বৌদ্ধ', 'Other / অন্যান্য']}
          />
          <FormField
            labelEn="Nationality"
            labelBn="জাতীয়তা"
            value={form.nationality}
            onChange={(v) => set('nationality', v)}
            required
            isBn={isBn}
          />
        </div>
        <div className={`${g(3)} mb-[0.625rem]`}>
          <FormField
            labelEn="Mobile (SMS)"
            labelBn="মোবাইল (SMS)"
            value={form.phone}
            onChange={(v) => set('phone', v)}
            type="tel"
            required
            isBn={isBn}
          />
          <FormField labelEn="Email" labelBn="ইমেইল" value={form.email} onChange={(v) => set('email', v)} type="email" isBn={isBn} />
          <FormField
            labelEn="District"
            labelBn="জেলা"
            value={form.district}
            onChange={(v) => set('district', v)}
            required
            isBn={isBn}
            options={['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Other']}
          />
        </div>
        <div className={g(2)}>
          <FormField
            labelEn="Present Address"
            labelBn="বর্তমান ঠিকানা"
            value={form.presentAddress}
            onChange={(v) => set('presentAddress', v)}
            required
            isBn={isBn}
          />
          <FormField
            labelEn="Permanent Address"
            labelBn="স্থায়ী ঠিকানা"
            value={form.permanentAddress}
            onChange={(v) => set('permanentAddress', v)}
            required
            isBn={isBn}
          />
        </div>
      </div>

      {/* Academic */}
      <div className={card}>
        {sHead(<GraduationCap />, 'একাডেমিক তথ্য', 'Academic Info', 'var(--teal)', 'var(--teal-light)')}
        <div className={`${g(3)} mb-[0.625rem]`}>
          <FormField
            labelEn="Class"
            labelBn="শ্রেণি"
            value={form.class}
            onChange={(v) => {
              set('class', v)
              set('section', '')
            }}
            required
            isBn={isBn}
            options={classOptions}
          />
          <FormField
            labelEn="Section"
            labelBn="সেকশন"
            value={form.section}
            onChange={(v) => set('section', v)}
            required
            isBn={isBn}
            options={form.class ? sectionsMap[form.class] || [] : []}
          />
          <FormField labelEn="Roll" labelBn="রোল নম্বর" value={form.roll} onChange={(v) => set('roll', v)} required isBn={isBn} />
          <FormField
            labelEn="Class Teacher"
            labelBn="শ্রেণি শিক্ষক"
            value={form.teacherId}
            onChange={(v) => set('teacherId', v)}
            isBn={isBn}
            options={teacherOptions}
          />
        </div>
        <div className={g(3)}>
          <FormField
            labelEn="Academic Year"
            labelBn="শিক্ষাবর্ষ"
            value={form.academicYear}
            onChange={(v) => set('academicYear', v)}
            required
            isBn={isBn}
            options={sessions}
          />
          <FormField
            labelEn="Admission Date"
            labelBn="ভর্তির তারিখ"
            value={form.admissionDate}
            onChange={(v) => set('admissionDate', v)}
            type="date"
            required
            isBn={isBn}
          />
          <FormField
            labelEn="Previous School"
            labelBn="আগের স্কুল"
            value={form.previousSchool}
            onChange={(v) => set('previousSchool', v)}
            isBn={isBn}
          />
        </div>
      </div>

      {/* Father */}
      <div className={card}>
        {sHead(<User />, 'পিতার তথ্য', "Father's Info", 'var(--teal)', 'var(--teal-light)')}
        <div className={`${g(3)} mb-[0.625rem]`}>
          <FormField
            labelEn="Name (EN)"
            labelBn="নাম (ইংরেজি)"
            value={form.fatherNameEn}
            onChange={(v) => set('fatherNameEn', v)}
            required
            isBn={isBn}
          />
          <FormField
            labelEn="Name (BN)"
            labelBn="নাম (বাংলা)"
            value={form.fatherNameBn}
            onChange={(v) => set('fatherNameBn', v)}
            required
            isBn={isBn}
          />
          <FormField
            labelEn="Occupation"
            labelBn="পেশা"
            value={form.fatherOccupation}
            onChange={(v) => set('fatherOccupation', v)}
            required
            isBn={isBn}
          />
        </div>
        <div className={g(2)}>
          <FormField
            labelEn="Mobile"
            labelBn="মোবাইল"
            value={form.fatherPhone}
            onChange={(v) => set('fatherPhone', v)}
            type="tel"
            required
            isBn={isBn}
          />
          <FormField labelEn="NID" labelBn="NID নম্বর" value={form.fatherNid} onChange={(v) => set('fatherNid', v)} isBn={isBn} />
        </div>
      </div>

      {/* Mother */}
      <div className={card}>
        {sHead(<User />, 'মাতার তথ্য', "Mother's Info", 'var(--purple)', 'var(--purple-light)')}
        <div className={`${g(3)} mb-[0.625rem]`}>
          <FormField
            labelEn="Name (EN)"
            labelBn="নাম (ইংরেজি)"
            value={form.motherNameEn}
            onChange={(v) => set('motherNameEn', v)}
            required
            isBn={isBn}
          />
          <FormField
            labelEn="Name (BN)"
            labelBn="নাম (বাংলা)"
            value={form.motherNameBn}
            onChange={(v) => set('motherNameBn', v)}
            required
            isBn={isBn}
          />
          <FormField
            labelEn="Occupation"
            labelBn="পেশা"
            value={form.motherOccupation}
            onChange={(v) => set('motherOccupation', v)}
            required
            isBn={isBn}
          />
        </div>
        <div className={g(2)}>
          <FormField
            labelEn="Mobile"
            labelBn="মোবাইল"
            value={form.motherPhone}
            onChange={(v) => set('motherPhone', v)}
            type="tel"
            required
            isBn={isBn}
          />
          <FormField labelEn="NID" labelBn="NID নম্বর" value={form.motherNid} onChange={(v) => set('motherNid', v)} isBn={isBn} />
        </div>
      </div>

      {/* Guardian */}
      <div className={card}>
        {sHead(<ShieldCheck />, 'অভিভাবক (ঐচ্ছিক)', 'Guardian (Optional)', 'var(--green)', 'var(--green-light)')}
        <div className={g(3)}>
          <FormField labelEn="Name" labelBn="নাম" value={form.guardianName} onChange={(v) => set('guardianName', v)} isBn={isBn} />
          <FormField
            labelEn="Relation"
            labelBn="সম্পর্ক"
            value={form.guardianRelation}
            onChange={(v) => set('guardianRelation', v)}
            isBn={isBn}
            options={['Uncle / চাচা', 'Aunt / খালা', 'Grand Father / দাদা', 'Grand Mother / দাদি', 'Other / অন্যান্য']}
          />
          <FormField
            labelEn="Mobile"
            labelBn="মোবাইল"
            value={form.guardianPhone}
            onChange={(v) => set('guardianPhone', v)}
            type="tel"
            isBn={isBn}
          />
        </div>
      </div>

      {/* SMS notice */}
      <div className="flex items-center gap-[0.625rem] bg-[var(--teal-light)] border border-[var(--teal)] rounded-[0.625rem] py-[0.625rem] px-[0.875rem] mb-[0.875rem]">
        <MessageSquare size={16} className="text-[var(--teal)] shrink-0" />
        <p className="text-[0.75rem] text-[var(--teal)]">
          {isBn ? `আবেদন জমা দিলে ${form.phone || '...'} এ SMS যাবে।` : `SMS will be sent to ${form.phone || '...'} after submission.`}
        </p>
      </div>

      {/* Submit */}
      <div className="flex gap-[0.625rem] justify-end flex-wrap">
        <button
          type="button"
          onClick={() => setForm(initForm(currentSession))}
          className="py-[0.625rem] px-5 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
        >
          {isBn ? 'রিসেট' : 'Reset'}
        </button>
        <button
          type="submit"
          className="flex items-center gap-[0.4375rem] py-[0.625rem] px-6 rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
        >
          <Send size={14} />
          {isBn ? 'আবেদন জমা দিন' : 'Submit Application'}
        </button>
      </div>
    </form>
  )
}
