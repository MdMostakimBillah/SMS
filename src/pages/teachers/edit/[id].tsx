import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Camera, Clock, Users, Save, Briefcase, X, IdCard } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import type { TeacherStatus } from '@/pages/teachers/types'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

// ─── FormField (outside parent component — fixes input focus loss) ───────────
interface FieldProps {
  labelEn: string; labelBn: string; value: string
  onChange: (v: string) => void; type?: string
  required?: boolean; options?: string[]; isBn: boolean
}
function FormField({ labelEn, labelBn, value, onChange, type = 'text', required = false, options, isBn }: FieldProps) {
  const base = "w-full px-3 py-[9px] rounded-[9px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] outline-none focus:border-[var(--brand)] transition-colors"
  return (
    <div>
      <label className="text-xs font-medium text-[var(--text-secondary)] mb-[5px] block">
        {isBn ? labelBn : labelEn}
        {required && <span className="text-[var(--red)] ml-[3px]">*</span>}
      </label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} required={required}
          className={`${base} cursor-pointer`}>
          <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          required={required} className={base} />
      )}
    </div>
  )
}
// ────────────────────────────────────────────────────────────────────────────

export default function EditTeacherPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { teachers, departments, subjects, designations, updateTeacher } = useTeacherStore()
  const isBn = language === 'bn'
  const fileRef = useRef<HTMLInputElement>(null)

  const teacher = useMemo(() => teachers.find(t => t.id === id), [teachers, id])

  const [photo, setPhoto] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameBn, setNameBn] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [religion, setReligion] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [nid, setNid] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [designation, setDesignation] = useState('')
  const [qualification, setQualification] = useState('')
  const [experience, setExperience] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [salary, setSalary] = useState('')
  const [overtime, setOvertime] = useState('')
  const [status, setStatus] = useState<TeacherStatus>('active')
  const [inTime, setInTime] = useState('')
  const [outTime, setOutTime] = useState('')
  const [fatherNameEn, setFatherNameEn] = useState('')
  const [fatherNameBn, setFatherNameBn] = useState('')
  const [fatherPhone, setFatherPhone] = useState('')
  const [fatherNid, setFatherNid] = useState('')
  const [motherNameEn, setMotherNameEn] = useState('')
  const [motherNameBn, setMotherNameBn] = useState('')
  const [motherPhone, setMotherPhone] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianRelation, setGuardianRelation] = useState('')
  const [parentAddress, setParentAddress] = useState('')
  const [saved, setSaved] = useState(false)
  const [photoErr, setPhotoErr] = useState('')

  useEffect(() => {
    if (!teacher) return
    setPhoto(teacher.photo || '')
    setNameEn(teacher.nameEn)
    setNameBn(teacher.nameBn)
    setGender(teacher.gender)
    setDob(teacher.dob || '')
    setBloodGroup(teacher.bloodGroup || '')
    setReligion(teacher.religion || '')
    setPhone(teacher.phone)
    setEmail(teacher.email)
    setAddress(teacher.address)
    setNid(teacher.nid || '')
    setEmergencyPhone(teacher.emergencyPhone || '')
    setDepartmentId(teacher.departmentId)
    setSubjectIds([...teacher.subjectIds])
    setDesignation(teacher.designation)
    setQualification(teacher.qualification)
    setExperience(teacher.experience)
    setJoiningDate(teacher.joiningDate || '')
    setSalary(String(teacher.salary))
    setOvertime(String(teacher.overtime || ''))
    setStatus(teacher.status)
    setInTime(teacher.inTime || '')
    setOutTime(teacher.outTime || '')
    setFatherNameEn(teacher.fatherNameEn || '')
    setFatherNameBn(teacher.fatherNameBn || '')
    setFatherPhone(teacher.fatherPhone || '')
    setFatherNid(teacher.fatherNid || '')
    setMotherNameEn(teacher.motherNameEn || '')
    setMotherNameBn(teacher.motherNameBn || '')
    setMotherPhone(teacher.motherPhone || '')
    setGuardianName(teacher.guardianName || '')
    setGuardianPhone(teacher.guardianPhone || '')
    setGuardianRelation(teacher.guardianRelation || '')
    setParentAddress(teacher.parentAddress || '')
  }, [teacher])

  const { recommendedSubjects, otherSubjects } = useMemo(() => {
    if (!departmentId) return { recommendedSubjects: subjects, otherSubjects: [] }
    return {
      recommendedSubjects: subjects.filter(s => s.departmentId === departmentId || s.departmentIds?.includes(departmentId)),
      otherSubjects: subjects.filter(s => s.departmentId !== departmentId && !s.departmentIds?.includes(departmentId)),
    }
  }, [subjects, departmentId])

  const toggleSubject = (sid: string) => setSubjectIds(p => p.includes(sid) ? p.filter(x => x !== sid) : [...p, sid])

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoErr('')
    if (file.size > 2 * 1024 * 1024) {
      setPhotoErr(isBn ? 'ছবির সাইজ সর্বোচ্চ ২ MB' : 'Photo must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher || !nameEn.trim() || !phone.trim() || !departmentId) {
      alert(isBn ? 'অনুগ্রহ করে প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill in required fields')
      return
    }
    updateTeacher(teacher.id, {
      photo, nameEn: nameEn.trim(), nameBn: nameBn.trim(),
      gender, dob, bloodGroup, religion,
      phone: phone.trim(), email: email.trim(),
      address: address.trim(), nid: nid.trim(),
      emergencyPhone: emergencyPhone.trim(),
      departmentId, subjectIds,
      designation, qualification: qualification.trim(),
      experience: experience.trim(), joiningDate,
      salary: Number(salary) || 0, overtime: Number(overtime) || 0,
      status, inTime, outTime,
      fatherNameEn: fatherNameEn.trim(), fatherNameBn: fatherNameBn.trim(),
      fatherPhone: fatherPhone.trim(), fatherNid: fatherNid.trim(),
      motherNameEn: motherNameEn.trim(), motherNameBn: motherNameBn.trim(),
      motherPhone: motherPhone.trim(),
      guardianName: guardianName.trim(), guardianPhone: guardianPhone.trim(),
      guardianRelation: guardianRelation.trim(),
      parentAddress: parentAddress.trim(),
    })
    setSaved(true)
    setTimeout(() => navigate(`/teachers/all`), 1200)
  }, [teacher, nameEn, phone, departmentId, updateTeacher, navigate, isBn])

  // ── helpers ──
  const g = (n: number) => `grid ${isMobile ? 'grid-cols-1' : `grid-cols-${n}`} gap-3`
  const card = `bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] ${isMobile ? 'p-3.5' : 'p-5'} mb-[14px]`
  const sHead = (icon: React.ReactNode, bn: string, en: string, col = 'var(--brand)', bg = 'var(--brand-light)') => (
    <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-[var(--border)]">
      <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ background: bg }}>
        {React.cloneElement(icon as React.ReactElement<{ size?: number; className?: string }>, { size: 15, className: `text-[${col}]` })}
      </div>
      <span className="text-sm font-semibold text-[var(--text-primary)]">{isBn ? bn : en}</span>
    </div>
  )

  if (!teacher) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">{isBn ? 'শিক্ষক পাওয়া যায়নি' : 'Teacher not found'}</p>
        <button onClick={() => navigate('/teachers/all')}
          className="mt-3 px-4 py-2 rounded-lg bg-[var(--brand)] border-0 text-white text-[13px] cursor-pointer">
          {isBn ? 'ফিরে যান' : 'Go Back'}
        </button>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="max-w-[600px] mx-auto px-1">
        <div className={`${card} text-center pt-10`}>
          <div className="w-[60px] h-[60px] rounded-full bg-[var(--green-light)] flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={30} className="text-[var(--green)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2.5">
            {isBn ? 'সংরক্ষণ করা হয়েছে!' : 'Saved Successfully!'}
          </h2>
          <p className="text-[13px] text-[var(--teal)] mb-5">
            ✅ {isBn ? `${nameEn} এর তথ্য আপডেট করা হয়েছে` : `${nameEn}'s info has been updated`}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => navigate('/teachers/all')}
              className="flex items-center gap-1.5 px-[18px] py-2.5 rounded-[9px] bg-[var(--brand)] border-0 text-white text-[13px] font-medium cursor-pointer">
              {isBn ? 'সকল শিক্ষক' : 'All Teachers'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off">

      {/* Header */}
      <div className="flex items-center gap-[10px] mb-4 flex-wrap">
        <button type="button" onClick={() => navigate('/teachers/all')}
          className="flex items-center gap-[5px] px-3 py-[7px] rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)]">
          ← {isBn?'ফিরে যান':'Back'}
        </button>
        <div>
          <h1 className={`${isMobile ? 'text-lg' : 'text-[22px]'} font-semibold text-[var(--text-primary)]`}>
            {isBn?'শিক্ষক সম্পাদনা':'Edit Teacher'}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-[3px]">
            {teacher.id} · {teacher.nameEn}
          </p>
        </div>
      </div>

      {/* ID bar */}
      <div className={`${card} flex items-center justify-between flex-wrap gap-[10px]`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-[40px] rounded-[10px] bg-[var(--brand-light)] flex items-center justify-center">
            <IdCard size={20} className="text-[var(--brand)]" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">{isBn ? 'শিক্ষক আইডি' : 'Teacher ID'}</div>
            <div className="text-xl font-bold text-[var(--brand)] tracking-[2px]">{teacher.id}</div>
          </div>
        </div>
      </div>

      {/* Personal */}
      <div className={card}>
        {sHead(<Users />, 'ব্যক্তিগত তথ্য', 'Personal Information')}
        <div className="flex gap-4 mb-[14px] flex-wrap">
          {/* Photo */}
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-[5px]">
              {isBn ? 'ছবি (সর্বোচ্চ ২ MB)' : 'Photo (max 2MB)'}
            </div>
            <div onClick={() => fileRef.current?.click()}
              className={`w-[90px] h-[110px] rounded-[10px] border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden bg-[var(--bg-secondary)] relative ${photo ? 'border-[var(--brand)]' : 'border-[var(--border-2)]'}`}>
              {photo
                ? <img src={photo} alt="" className="w-full h-full object-cover" />
                : <div className="text-center text-[var(--text-muted)] pointer-events-none">
                    <Camera size={22} className="block mx-auto mb-1" />
                    <div className="text-[10px]">{isBn ? 'ছবি' : 'Photo'}</div>
                  </div>}
              {photo && (
                <button type="button" onClick={e => { e.stopPropagation(); setPhoto('') }}
                  className="absolute top-[3px] right-[3px] w-[18px] h-[18px] rounded-full bg-[var(--red)] border-0 cursor-pointer flex items-center justify-center text-white">
                  <X size={10} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            {photoErr && <div className="text-[10px] text-[var(--red)] mt-[3px] max-w-[90px]">{photoErr}</div>}
          </div>
          {/* Name + DOB + Gender */}
          <div className="flex-1 min-w-[200px]">
            <div className={`${g(2)} mb-[10px]`}>
              <FormField labelEn="Name (English)" labelBn="নাম (ইংরেজি)" value={nameEn} onChange={setNameEn} required isBn={isBn} />
              <FormField labelEn="Name (Bangla)" labelBn="নাম (বাংলা)" value={nameBn} onChange={setNameBn} isBn={isBn} />
            </div>
            <div className={g(2)}>
              <FormField labelEn="Date of Birth" labelBn="জন্ম তারিখ" value={dob} onChange={setDob} type="date" isBn={isBn} />
              <FormField labelEn="Gender" labelBn="লিঙ্গ" value={gender} onChange={setGender} required isBn={isBn}
                options={['Male', 'Female']} />
            </div>
          </div>
        </div>
        <div className={`${g(3)} mb-[10px]`}>
          <FormField labelEn="Blood Group" labelBn="রক্তের গ্রুপ" value={bloodGroup} onChange={setBloodGroup} isBn={isBn}
            options={BLOOD_GROUPS} />
          <FormField labelEn="Religion" labelBn="ধর্ম" value={religion} onChange={setReligion} isBn={isBn}
            options={['Islam', 'Hinduism', 'Christianity', 'Buddhism']} />
          <FormField labelEn="NID" labelBn="জাতীয় পরিচয়পত্র" value={nid} onChange={setNid} isBn={isBn} />
        </div>
        <div className={`${g(3)} mb-[10px]`}>
          <FormField labelEn="Mobile" labelBn="মোবাইল" value={phone} onChange={setPhone} type="tel" required isBn={isBn} />
          <FormField labelEn="Email" labelBn="ইমেইল" value={email} onChange={setEmail} type="email" isBn={isBn} />
          <FormField labelEn="Emergency Phone" labelBn="জরুরি মোবাইল" value={emergencyPhone} onChange={setEmergencyPhone} type="tel" isBn={isBn} />
        </div>
        <div className={g(2)}>
          <FormField labelEn="Address" labelBn="ঠিকানা" value={address} onChange={setAddress} isBn={isBn} />
        </div>
      </div>

      {/* Schedule */}
      <div className={card}>
        {sHead(<Clock />, 'সময়সূচি', 'Schedule', 'var(--teal)', 'var(--teal-light)')}
        <div className={g(2)}>
          <div>
            <FormField labelEn="In Time" labelBn="প্রবেশ সময়" value={inTime} onChange={setInTime} type="time" isBn={isBn} />
            <div className="text-[10px] text-[var(--text-muted)] mt-[3px]">
              {isBn?'বায়োমেট্রিক থেকে পুল করা হবে':'Pulled from biometric machine'}
            </div>
          </div>
          <div>
            <FormField labelEn="Out Time" labelBn="প্রস্থান সময়" value={outTime} onChange={setOutTime} type="time" isBn={isBn} />
            <div className="text-[10px] text-[var(--text-muted)] mt-[3px]">
              {isBn?'বায়োমেট্রিক থেকে পুল করা হবে':'Pulled from biometric machine'}
            </div>
          </div>
        </div>
      </div>

      {/* Professional */}
      <div className={card}>
        {sHead(<Briefcase />, 'পেশাদার তথ্য', 'Professional Information', 'var(--amber)', 'var(--amber-light)')}
        <div className={`${g(3)} mb-[10px]`}>
          <FormField labelEn="Department" labelBn="বিভাগ" value={departmentId} onChange={v => { setDepartmentId(v); setSubjectIds([]) }} required isBn={isBn}
            options={departments.map(d => d.id)} />
          <FormField labelEn="Designation" labelBn="পদবি" value={designation} onChange={setDesignation} isBn={isBn}
            options={designations.map(d => d.name)} />
          <FormField labelEn="Qualification" labelBn="যোগ্যতা" value={qualification} onChange={setQualification} isBn={isBn} />
        </div>
        <div className={`${g(3)} mb-[10px]`}>
          <FormField labelEn="Experience" labelBn="অভিজ্ঞতা" value={experience} onChange={setExperience} isBn={isBn} />
          <FormField labelEn="Joining Date" labelBn="যোগদানের তারিখ" value={joiningDate} onChange={setJoiningDate} type="date" isBn={isBn} />
          <FormField labelEn="Status" labelBn="অবস্থা" value={status} onChange={v => setStatus(v as TeacherStatus)} isBn={isBn}
            options={['active', 'inactive', 'on-leave']} />
        </div>
        <div className={g(2)}>
          <FormField labelEn="Basic Salary (Monthly)" labelBn="মূল বেতন (মাসিক)" value={salary} onChange={setSalary} type="number" isBn={isBn} />
          <FormField labelEn="Overtime (Hourly)" labelBn="ওভারটাইম (ঘণ্টার হার)" value={overtime} onChange={setOvertime} type="number" isBn={isBn} />
        </div>

        {/* Subjects */}
        {departmentId && (
          <div className="mt-[14px]">
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
              {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subjects'}
            </label>
            {recommendedSubjects.length > 0 && (
              <div className="mb-2">
                <div className="text-[11px] text-[var(--green)] font-medium mb-1">
                  {isBn ? 'সুপারিশকৃত' : 'Recommended'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recommendedSubjects.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-[5px] rounded-lg text-xs cursor-pointer border ${
                        subjectIds.includes(s.id)
                          ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] font-semibold'
                          : 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]'
                      }`}>
                      {isBn?s.nameBn:s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {otherSubjects.length > 0 && (
              <div>
                <div className="text-[11px] text-[var(--text-muted)] font-medium mb-1">
                  {isBn ? 'অন্যান্য বিভাগ' : 'Other Departments'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {otherSubjects.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-[5px] rounded-lg text-xs cursor-pointer border ${
                        subjectIds.includes(s.id)
                          ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] font-semibold'
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                      }`}>
                      {isBn?s.nameBn:s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Father */}
      <div className={card}>
        {sHead(<Users />, 'পিতার তথ্য', "Father's Info", 'var(--teal)', 'var(--teal-light)')}
        <div className={`${g(3)} mb-[10px]`}>
          <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={fatherNameEn} onChange={setFatherNameEn} required isBn={isBn} />
          <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={fatherNameBn} onChange={setFatherNameBn} isBn={isBn} />
          <FormField labelEn="Phone" labelBn="মোবাইল" value={fatherPhone} onChange={setFatherPhone} type="tel" isBn={isBn} />
        </div>
        <div className={g(2)}>
          <FormField labelEn="NID" labelBn="NID নম্বর" value={fatherNid} onChange={setFatherNid} isBn={isBn} />
        </div>
      </div>

      {/* Mother */}
      <div className={card}>
        {sHead(<Users />, 'মাতার তথ্য', "Mother's Info", 'var(--purple)', 'var(--purple-light)')}
        <div className={`${g(3)} mb-[10px]`}>
          <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={motherNameEn} onChange={setMotherNameEn} required isBn={isBn} />
          <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={motherNameBn} onChange={setMotherNameBn} isBn={isBn} />
          <FormField labelEn="Phone" labelBn="মোবাইল" value={motherPhone} onChange={setMotherPhone} type="tel" isBn={isBn} />
        </div>
      </div>

      {/* Guardian */}
      <div className={card}>
        {sHead(<Users />, 'অভিভাবক (ঐচ্ছিক)', 'Guardian (Optional)', 'var(--green)', 'var(--green-light)')}
        <div className={`${g(3)} mb-[10px]`}>
          <FormField labelEn="Name" labelBn="নাম" value={guardianName} onChange={setGuardianName} isBn={isBn} />
          <FormField labelEn="Relation" labelBn="সম্পর্ক" value={guardianRelation} onChange={setGuardianRelation} isBn={isBn}
            options={['Uncle', 'Aunt', 'Grand Father', 'Grand Mother', 'Other']} />
          <FormField labelEn="Phone" labelBn="মোবাইল" value={guardianPhone} onChange={setGuardianPhone} type="tel" isBn={isBn} />
        </div>
        <div className={g(2)}>
          <FormField labelEn="Parent Address" labelBn="অভিভাবকের ঠিকানা" value={parentAddress} onChange={setParentAddress} isBn={isBn} />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-[10px] justify-end flex-wrap">
        <button type="button" onClick={() => navigate('/teachers/all')}
          className="px-5 py-2.5 rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] cursor-pointer">
          {isBn ? 'বাতিল' : 'Cancel'}
        </button>
        <button type="submit"
          className="flex items-center gap-[7px] px-6 py-2.5 rounded-[9px] bg-[var(--brand)] border-0 text-white text-[13px] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
          <Save size={14} />
          {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
