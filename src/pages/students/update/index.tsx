import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, Camera, CheckCircle, GraduationCap, Save, Search, ShieldCheck, User, UserSearch, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore, useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import type { StudentAdmission } from '@/pages/students/admission/types'

interface FP {
  l: string
  v: string
  onChange: (v: string) => void
  type?: string
  opts?: string[]
  req?: boolean
}
const F = React.memo(function F({ l, v, onChange, type = 'text', opts, req }: FP) {
  const s =
    'w-full py-2 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none'
  return (
    <div>
      <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
        {l}
        {req && <span className="text-[var(--red)] ml-0.5">*</span>}
      </label>
      {opts ? (
        <select value={v} onChange={(e) => onChange(e.target.value)} className={`${s} cursor-pointer`}>
          <option value="">—</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={v}
          onChange={(e) => onChange(e.target.value)}
          required={req}
          className={s}
          onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      )}
    </div>
  )
})

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(),
      url = URL.createObjectURL(file)
    img.onload = () => {
      const c = document.createElement('canvas'),
        max = 300,
        r = Math.min(max / img.width, max / img.height)
      c.width = Math.round(img.width * r)
      c.height = Math.round(img.height * r)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function UpdateStudentPage() {
  const location = useLocation()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const updateStudent = useAdmissionStore((s) => s.updateStudent)
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const isBn = language === 'bn'

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [search, setSearch] = useState('')
  const [chosen, setChosen] = useState<StudentAdmission | null>(null)
  const [form, setForm] = useState<StudentAdmission | null>(null)
  const [saved, setSaved] = useState(false)
  const [photoErr, setPhotoErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const sid = (location.state as any)?.studentId
    if (sid) {
      const s = students.find((x) => x.id === sid)
      if (s) {
        setChosen(s)
        setForm({ ...s })
      }
    }
  }, [location.state, students])

  const results =
    search.length >= 2
      ? students
          .filter(
            (s) =>
              s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
              s.nameBn.includes(search) ||
              s.id.includes(search) ||
              s.phone.includes(search) ||
              s.roll.includes(search)
          )
          .slice(0, 10)
      : []

  const selectStudent = useCallback((s: StudentAdmission) => {
    setChosen(s)
    setForm({ ...s })
    setSearch('')
    setSaved(false)
  }, [])

  const set = useCallback((k: keyof StudentAdmission, v: string) => {
    setForm((p) => (p ? { ...p, [k]: v } : p))
  }, [])

  const handlePhoto = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setPhotoErr('')
      if (file.size > 2 * 1024 * 1024) {
        setPhotoErr(isBn ? 'ছবি ২ MB এর বেশি নয়' : 'Max 2MB')
        return
      }
      try {
        set('photo', await compressImage(file))
      } catch {
        setPhotoErr(isBn ? 'ছবি লোড হয়নি' : 'Error loading')
      }
    },
    [set, isBn]
  )

  const handleSave = useCallback(() => {
    if (!form) return
    updateStudent(form.id, form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [form, updateStudent])

  const g = (n: number) => ({
    className: 'grid gap-2.5',
    style: { gridTemplateColumns: isMobile ? '1fr' : `repeat(${n},1fr)` } as React.CSSProperties,
  })
  const card = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] p-[0.875rem] md:p-[1.125rem] mb-3'
  const secHead = (icon: React.ReactNode, title: string, _color = 'var(--brand)', bg = 'var(--brand-light)') => (
    <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[var(--border)]">
      <div className="w-7 h-7 rounded-[0.4375rem] bg-[var(--brand-light)] flex items-center justify-center" style={{ background: bg }}>
        {icon}
      </div>
      <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{title}</span>
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-[1.125rem] flex-wrap">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'ছাত্রের তথ্য আপডেট' : 'Update Student Info'}</h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn ? 'ছাত্র খুঁজে তার সকল তথ্য সম্পাদনা করুন' : 'Search a student and edit all their information'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: isMobile ? '1fr' : '280px 1fr' }}>
        <div className="sticky top-0">
          <div className={card}>
            <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] mb-2.5">
              {isBn ? '🔍 ছাত্র খুঁজুন' : '🔍 Find Student'}
            </div>
            <div className="relative mb-2.5">
              <div className="flex items-center gap-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[0.5625rem] py-2 px-2.5">
                <Search size={14} className="text-[var(--text-muted)] shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isBn ? 'নাম, আইডি, রোল...' : 'Name, ID, roll...'}
                  className="flex-1 border-none bg-transparent outline-none text-[0.8125rem] text-[var(--text-primary)] font-[inherit]"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="border-none bg-transparent cursor-pointer text-[var(--text-muted)] flex">
                    <X size={12} />
                  </button>
                )}
              </div>

              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.625rem] overflow-hidden z-20 mt-1 shadow-[var(--shadow-md)]">
                  {results.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => selectStudent(s)}
                      className="flex gap-2.5 py-[0.5625rem] px-3 cursor-pointer border-b-[0.0313rem] border-[var(--border)]"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="w-[1.875rem] h-[2.1875rem] rounded-[0.3125rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        {s.photo ? (
                          <img src={s.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={13} className="text-[var(--text-muted)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">
                          {s.nameEn}
                        </div>
                        <div className="text-[0.625rem] text-[var(--text-muted)]">
                          {s.id} · {s.class}
                          {s.section ? `-${s.section}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {chosen && form ? (
              <div className="p-2.5 bg-[var(--brand-light)] rounded-[0.625rem] border border-[var(--brand)]">
                <div className="flex gap-2 items-center">
                  <div className="w-9 h-[2.75rem] rounded-md overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    {form.photo ? (
                      <img src={form.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--brand)]">{form.nameEn}</div>
                    <div className="text-[0.625rem] text-[var(--brand)] font-mono opacity-80">{form.id}</div>
                    <div className="text-[0.625rem] text-[var(--brand)] opacity-70">
                      {form.class}
                      {form.section ? `-${form.section}` : ''} · {form.phone}
                    </div>
                  </div>
                </div>
                {saved && (
                  <div className="flex items-center gap-[0.3125rem] mt-2 text-xs text-[var(--green)] font-medium">
                    <CheckCircle size={13} />
                    {isBn ? 'সফলভাবে সেভ হয়েছে!' : 'Saved successfully!'}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-5 px-3 bg-[var(--bg-secondary)] rounded-[0.625rem] text-center">
                <UserSearch size={24} className="text-[var(--text-muted)] block mx-auto mb-[0.375rem] opacity-40" />
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {isBn ? 'নাম বা আইডি লিখে ছাত্র খুঁজুন' : 'Search by name or ID'}
                </p>
              </div>
            )}
          </div>
        </div>

        {form ? (
          <div>
            <div className="flex items-center justify-between mb-[0.875rem] flex-wrap gap-2">
              <h2 className="text-[1.0625rem] font-semibold text-[var(--text-primary)]">{isBn ? 'তথ্য সম্পাদনা' : 'Edit Information'}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setForm({ ...chosen! })
                    setSaved(false)
                  }}
                  className="py-2 px-3.5 rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
                >
                  {isBn ? 'রিসেট' : 'Reset'}
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 py-2 px-[1.125rem] rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                >
                  <Save size={14} />
                  {isBn ? 'সেভ করুন' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className={card}>
              {secHead(<User size={14} className="text-[var(--brand)]" />, isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Information')}
              <div className="flex gap-[0.875rem] mb-3 flex-wrap">
                <div>
                  <div className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem]">
                    {isBn ? 'ছবি (সর্বোচ্চ ২ MB)' : 'Photo (max 2MB)'}
                  </div>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--bg-secondary)] relative"
                    style={{ borderColor: form.photo ? 'var(--brand)' : 'var(--border-2)' }}
                  >
                    {form.photo ? (
                      <img src={form.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-[var(--text-muted)]">
                        <Camera size={20} className="block mx-auto mb-[0.1875rem]" />
                        <div className="text-[0.625rem]">Upload</div>
                      </div>
                    )}
                    {form.photo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          set('photo', '')
                        }}
                        className="absolute top-0.5 right-0.5 w-[1.125rem] h-[1.125rem] rounded-full bg-[var(--red)] border-none cursor-pointer flex items-center justify-center text-white"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  {photoErr && <div className="text-[0.625rem] text-[var(--red)] mt-[0.1875rem] max-w-[5rem]">{photoErr}</div>}
                </div>
                <div className="flex-1 min-w-[12.5rem]">
                  <div {...g(2)} className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)' }}>
                    <F l={isBn ? 'নাম (ইং)' : 'Name (EN)'} v={form.nameEn} onChange={(v) => set('nameEn', v)} req />
                    <F l={isBn ? 'নাম (বাং)' : 'Name (BN)'} v={form.nameBn} onChange={(v) => set('nameBn', v)} />
                  </div>
                  <div {...g(2)} className="grid gap-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)' }}>
                    <F l={isBn ? 'জন্ম তারিখ' : 'Date of Birth'} v={form.dob} onChange={(v) => set('dob', v)} type="date" />
                    <F
                      l={isBn ? 'লিঙ্গ' : 'Gender'}
                      v={form.gender}
                      onChange={(v) => set('gender', v)}
                      opts={['Male / পুরুষ', 'Female / মহিলা', 'Other / অন্যান্য']}
                    />
                  </div>
                </div>
              </div>
              <div {...g(3)} className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
                <F
                  l={isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
                  v={form.bloodGroup}
                  onChange={(v) => set('bloodGroup', v)}
                  opts={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                />
                <F
                  l={isBn ? 'ধর্ম' : 'Religion'}
                  v={form.religion}
                  onChange={(v) => set('religion', v)}
                  opts={['Islam / ইসলাম', 'Hinduism / হিন্দু', 'Christianity / খ্রিস্টান', 'Buddhism / বৌদ্ধ', 'Other / অন্যান্য']}
                />
                <F l={isBn ? 'জাতীয়তা' : 'Nationality'} v={form.nationality} onChange={(v) => set('nationality', v)} />
              </div>
              <div {...g(3)} className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
                <F l={isBn ? 'মোবাইল' : 'Mobile'} v={form.phone} onChange={(v) => set('phone', v)} type="tel" req />
                <F l="Email" v={form.email} onChange={(v) => set('email', v)} type="email" />
                <F
                  l={isBn ? 'জেলা' : 'District'}
                  v={form.district}
                  onChange={(v) => set('district', v)}
                  opts={['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Other']}
                />
              </div>
              <div {...g(2)} className="grid gap-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)' }}>
                <F l={isBn ? 'বর্তমান ঠিকানা' : 'Present Address'} v={form.presentAddress} onChange={(v) => set('presentAddress', v)} />
                <F
                  l={isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
                  v={form.permanentAddress}
                  onChange={(v) => set('permanentAddress', v)}
                />
              </div>
            </div>

            <div className={card}>
              {secHead(
                <GraduationCap size={14} className="text-[var(--teal)]" />,
                isBn ? 'একাডেমিক তথ্য' : 'Academic Info',
                'var(--teal)',
                'var(--teal-light)'
              )}
              <div {...g(3)} className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
                <F l={isBn ? 'শ্রেণি' : 'Class'} v={form.class} onChange={(v) => set('class', v)} opts={classOptions} req />
                <F
                  l={isBn ? 'সেকশন' : 'Section'}
                  v={form.section}
                  onChange={(v) => set('section', v)}
                  opts={sectionsMap[form.class] || []}
                />
                <F l={isBn ? 'রোল' : 'Roll'} v={form.roll} onChange={(v) => set('roll', v)} />
              </div>
              <div {...g(3)} className="grid gap-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
                <F
                  l={isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}
                  v={form.academicYear}
                  onChange={(v) => set('academicYear', v)}
                  opts={['2024-25', '2025-26', '2026-27']}
                />
                <F
                  l={isBn ? 'ভর্তির তারিখ' : 'Admission Date'}
                  v={form.admissionDate}
                  onChange={(v) => set('admissionDate', v)}
                  type="date"
                />
                <F l={isBn ? 'আগের স্কুল' : 'Previous School'} v={form.previousSchool} onChange={(v) => set('previousSchool', v)} />
              </div>
            </div>

            <div className={card}>
              {secHead(
                <User size={14} className="text-[var(--teal)]" />,
                isBn ? 'পিতার তথ্য' : "Father's Info",
                'var(--teal)',
                'var(--teal-light)'
              )}
              <div {...g(3)} className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
                <F l={isBn ? 'নাম (ইং)' : 'Name (EN)'} v={form.fatherNameEn} onChange={(v) => set('fatherNameEn', v)} />
                <F l={isBn ? 'নাম (বাং)' : 'Name (BN)'} v={form.fatherNameBn} onChange={(v) => set('fatherNameBn', v)} />
                <F l={isBn ? 'পেশা' : 'Occupation'} v={form.fatherOccupation} onChange={(v) => set('fatherOccupation', v)} />
              </div>
              <div {...g(2)} className="grid gap-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)' }}>
                <F l={isBn ? 'মোবাইল' : 'Mobile'} v={form.fatherPhone} onChange={(v) => set('fatherPhone', v)} type="tel" />
                <F l="NID" v={form.fatherNid} onChange={(v) => set('fatherNid', v)} />
              </div>
            </div>

            <div className={card}>
              {secHead(
                <User size={14} className="text-[var(--purple)]" />,
                isBn ? 'মাতার তথ্য' : "Mother's Info",
                'var(--purple)',
                'var(--purple-light)'
              )}
              <div {...g(3)} className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
                <F l={isBn ? 'নাম (ইং)' : 'Name (EN)'} v={form.motherNameEn} onChange={(v) => set('motherNameEn', v)} />
                <F l={isBn ? 'নাম (বাং)' : 'Name (BN)'} v={form.motherNameBn} onChange={(v) => set('motherNameBn', v)} />
                <F l={isBn ? 'পেশা' : 'Occupation'} v={form.motherOccupation} onChange={(v) => set('motherOccupation', v)} />
              </div>
              <div {...g(2)} className="grid gap-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)' }}>
                <F l={isBn ? 'মোবাইল' : 'Mobile'} v={form.motherPhone} onChange={(v) => set('motherPhone', v)} type="tel" />
                <F l="NID" v={form.motherNid} onChange={(v) => set('motherNid', v)} />
              </div>
            </div>

            <div className={card}>
              {secHead(
                <ShieldCheck size={14} className="text-[var(--green)]" />,
                isBn ? 'অভিভাবক' : 'Guardian',
                'var(--green)',
                'var(--green-light)'
              )}
              <div {...g(3)} className="grid gap-2.5" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
                <F l={isBn ? 'নাম' : 'Name'} v={form.guardianName} onChange={(v) => set('guardianName', v)} />
                <F
                  l={isBn ? 'সম্পর্ক' : 'Relation'}
                  v={form.guardianRelation}
                  onChange={(v) => set('guardianRelation', v)}
                  opts={['Uncle / চাচা', 'Aunt / খালা', 'Grand Father / দাদা', 'Grand Mother / দাদি', 'Other / অন্যান্য']}
                />
                <F l={isBn ? 'মোবাইল' : 'Mobile'} v={form.guardianPhone} onChange={(v) => set('guardianPhone', v)} type="tel" />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setForm({ ...chosen! })}
                className="py-[0.625rem] px-[1.125rem] rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
              >
                {isBn ? 'রিসেট' : 'Reset'}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 py-[0.625rem] px-[1.375rem] rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
              >
                <Save size={15} />
                {isBn ? 'পরিবর্তন সেভ করুন' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className={`${card} flex flex-col items-center justify-center py-[3.75rem] text-center`}>
            <UserSearch size={48} className="text-[var(--text-muted)] opacity-30 mb-[0.875rem]" />
            <h3 className="text-[1rem] font-medium text-[var(--text-primary)] mb-[0.375rem]">
              {isBn ? 'ছাত্র সিলেক্ট করুন' : 'Select a Student'}
            </h3>
            <p className="text-[0.8125rem] text-[var(--text-muted)]">
              {isBn ? 'বামের সার্চ বক্সে নাম বা আইডি লিখুন' : 'Search by name or ID on the left panel'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
