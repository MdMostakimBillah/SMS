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
  const base: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '9px',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
  }
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>
        {isBn ? labelBn : labelEn}
        {required && <span style={{ color: 'var(--red)', marginLeft: '3px' }}>*</span>}
      </label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} required={required}
          style={{ ...base, cursor: 'pointer' }}>
          <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          required={required} style={base}
          onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
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

  const g = (n: number): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : `repeat(${n}, 1fr)`,
    gap: '12px',
  })
  const card: React.CSSProperties = {
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: isMobile ? '14px' : '20px', marginBottom: '14px',
  }
  const sHead = (icon: React.ReactNode, bn: string, en: string, col = 'var(--brand)', bg = 'var(--brand-light)') => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.cloneElement(icon as React.ReactElement<{ size?: number; style?: React.CSSProperties }>, { size: 15, style: { color: col } })}
      </div>
      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? bn : en}</span>
    </div>
  )

  if (!teacher) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{isBn ? 'শিক্ষক পাওয়া যায়নি' : 'Teacher not found'}</p>
        <button onClick={() => navigate('/teachers/all')} style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {isBn ? 'ফিরে যান' : 'Go Back'}
        </button>
      </div>
    )
  }

  if (saved) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <CheckCircle size={30} style={{ color: 'var(--green)' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
            {isBn ? 'সংরক্ষণ করা হয়েছে!' : 'Saved Successfully!'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--teal)', marginBottom: '20px' }}>
            ✅ {isBn ? `${nameEn} এর তথ্য আপডেট করা হয়েছে` : `${nameEn}'s info has been updated`}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/teachers/all')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate('/teachers/all')}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px',
            background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer',
            fontSize:'13px', color:'var(--text-secondary)', fontFamily:'inherit' }}>
          ← {isBn?'ফিরে যান':'Back'}
        </button>
        <div>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn?'শিক্ষক সম্পাদনা':'Edit Teacher'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {teacher.id} · {teacher.nameEn}
          </p>
        </div>
      </div>

      {/* ID bar */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IdCard size={20} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isBn ? 'শিক্ষক আইডি' : 'Teacher ID'}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand)', letterSpacing: '2px' }}>{teacher.id}</div>
          </div>
        </div>
      </div>

      {/* Personal */}
      <div style={card}>
        {sHead(<Users />, 'ব্যক্তিগত তথ্য', 'Personal Information')}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {/* Photo */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              {isBn ? 'ছবি (সর্বোচ্চ ২ MB)' : 'Photo (max 2MB)'}
            </div>
            <div onClick={() => fileRef.current?.click()}
              style={{ width: '90px', height: '110px', borderRadius: '10px', border: `2px dashed ${photo ? 'var(--brand)' : 'var(--border-2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
              {photo
                ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                    <Camera size={22} style={{ display: 'block', margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '10px' }}>{isBn ? 'ছবি' : 'Photo'}</div>
                  </div>}
              {photo && (
                <button type="button" onClick={e => { e.stopPropagation(); setPhoto('') }}
                  style={{ position: 'absolute', top: 3, right: 3, width: '18px', height: '18px', borderRadius: '50%', background: 'var(--red)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <X size={10} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            {photoErr && <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '3px', maxWidth: '90px' }}>{photoErr}</div>}
          </div>
          {/* Name + DOB + Gender */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ ...g(2), marginBottom: '10px' }}>
              <FormField labelEn="Name (English)" labelBn="নাম (ইংরেজি)" value={nameEn} onChange={setNameEn} required isBn={isBn} />
              <FormField labelEn="Name (Bangla)" labelBn="নাম (বাংলা)" value={nameBn} onChange={setNameBn} isBn={isBn} />
            </div>
            <div style={g(2)}>
              <FormField labelEn="Date of Birth" labelBn="জন্ম তারিখ" value={dob} onChange={setDob} type="date" isBn={isBn} />
              <FormField labelEn="Gender" labelBn="লিঙ্গ" value={gender} onChange={setGender} required isBn={isBn}
                options={['Male', 'Female']} />
            </div>
          </div>
        </div>
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Blood Group" labelBn="রক্তের গ্রুপ" value={bloodGroup} onChange={setBloodGroup} isBn={isBn}
            options={BLOOD_GROUPS} />
          <FormField labelEn="Religion" labelBn="ধর্ম" value={religion} onChange={setReligion} isBn={isBn}
            options={['Islam', 'Hinduism', 'Christianity', 'Buddhism']} />
          <FormField labelEn="NID" labelBn="জাতীয় পরিচয়পত্র" value={nid} onChange={setNid} isBn={isBn} />
        </div>
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Mobile" labelBn="মোবাইল" value={phone} onChange={setPhone} type="tel" required isBn={isBn} />
          <FormField labelEn="Email" labelBn="ইমেইল" value={email} onChange={setEmail} type="email" isBn={isBn} />
          <FormField labelEn="Emergency Phone" labelBn="জরুরি মোবাইল" value={emergencyPhone} onChange={setEmergencyPhone} type="tel" isBn={isBn} />
        </div>
        <div style={g(2)}>
          <FormField labelEn="Address" labelBn="ঠিকানা" value={address} onChange={setAddress} isBn={isBn} />
        </div>
      </div>

      {/* Schedule */}
      <div style={card}>
        {sHead(<Clock />, 'সময়সূচি', 'Schedule', 'var(--teal)', 'var(--teal-light)')}
        <div style={g(2)}>
          <div>
            <FormField labelEn="In Time" labelBn="প্রবেশ সময়" value={inTime} onChange={setInTime} type="time" isBn={isBn} />
            <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>
              {isBn?'বায়োমেট্রিক থেকে পুল করা হবে':'Pulled from biometric machine'}
            </div>
          </div>
          <div>
            <FormField labelEn="Out Time" labelBn="প্রস্থান সময়" value={outTime} onChange={setOutTime} type="time" isBn={isBn} />
            <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>
              {isBn?'বায়োমেট্রিক থেকে পুল করা হবে':'Pulled from biometric machine'}
            </div>
          </div>
        </div>
      </div>

      {/* Professional */}
      <div style={card}>
        {sHead(<Briefcase />, 'পেশাদার তথ্য', 'Professional Information', 'var(--amber)', 'var(--amber-light)')}
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Department" labelBn="বিভাগ" value={departmentId} onChange={v => { setDepartmentId(v); setSubjectIds([]) }} required isBn={isBn}
            options={departments.map(d => d.id)} />
          <FormField labelEn="Designation" labelBn="পদবি" value={designation} onChange={setDesignation} isBn={isBn}
            options={designations.map(d => d.name)} />
          <FormField labelEn="Qualification" labelBn="যোগ্যতা" value={qualification} onChange={setQualification} isBn={isBn} />
        </div>
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Experience" labelBn="অভিজ্ঞতা" value={experience} onChange={setExperience} isBn={isBn} />
          <FormField labelEn="Joining Date" labelBn="যোগদানের তারিখ" value={joiningDate} onChange={setJoiningDate} type="date" isBn={isBn} />
          <FormField labelEn="Status" labelBn="অবস্থা" value={status} onChange={v => setStatus(v as TeacherStatus)} isBn={isBn}
            options={['active', 'inactive', 'on-leave']} />
        </div>
        <div style={g(2)}>
          <FormField labelEn="Basic Salary (Monthly)" labelBn="মূল বেতন (মাসিক)" value={salary} onChange={setSalary} type="number" isBn={isBn} />
          <FormField labelEn="Overtime (Hourly)" labelBn="ওভারটাইম (ঘণ্টার হার)" value={overtime} onChange={setOvertime} type="number" isBn={isBn} />
        </div>

        {/* Subjects */}
        {departmentId && (
          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subjects'}
            </label>
            {recommendedSubjects.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 500, marginBottom: '4px' }}>
                  {isBn ? 'সুপারিশকৃত' : 'Recommended'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {recommendedSubjects.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                      style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                        fontFamily: 'inherit', border: '1px solid',
                        borderColor: subjectIds.includes(s.id) ? 'var(--brand)' : 'var(--green)',
                        background: subjectIds.includes(s.id) ? 'var(--brand-light)' : 'var(--green-light)',
                        color: subjectIds.includes(s.id) ? 'var(--brand)' : 'var(--green)',
                        fontWeight: subjectIds.includes(s.id) ? 600 : 400,
                      }}>
                      {isBn?s.nameBn:s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {otherSubjects.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px' }}>
                  {isBn ? 'অন্যান্য বিভাগ' : 'Other Departments'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {otherSubjects.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                      style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                        fontFamily: 'inherit', border: '1px solid',
                        borderColor: subjectIds.includes(s.id) ? 'var(--brand)' : 'var(--border)',
                        background: subjectIds.includes(s.id) ? 'var(--brand-light)' : 'var(--bg-secondary)',
                        color: subjectIds.includes(s.id) ? 'var(--brand)' : 'var(--text-secondary)',
                        fontWeight: subjectIds.includes(s.id) ? 600 : 400,
                      }}>
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
      <div style={card}>
        {sHead(<Users />, 'পিতার তথ্য', "Father's Info", 'var(--teal)', 'var(--teal-light)')}
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={fatherNameEn} onChange={setFatherNameEn} required isBn={isBn} />
          <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={fatherNameBn} onChange={setFatherNameBn} isBn={isBn} />
          <FormField labelEn="Phone" labelBn="মোবাইল" value={fatherPhone} onChange={setFatherPhone} type="tel" isBn={isBn} />
        </div>
        <div style={g(2)}>
          <FormField labelEn="NID" labelBn="NID নম্বর" value={fatherNid} onChange={setFatherNid} isBn={isBn} />
        </div>
      </div>

      {/* Mother */}
      <div style={card}>
        {sHead(<Users />, 'মাতার তথ্য', "Mother's Info", 'var(--purple)', 'var(--purple-light)')}
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={motherNameEn} onChange={setMotherNameEn} required isBn={isBn} />
          <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={motherNameBn} onChange={setMotherNameBn} isBn={isBn} />
          <FormField labelEn="Phone" labelBn="মোবাইল" value={motherPhone} onChange={setMotherPhone} type="tel" isBn={isBn} />
        </div>
      </div>

      {/* Guardian */}
      <div style={card}>
        {sHead(<Users />, 'অভিভাবক (ঐচ্ছিক)', 'Guardian (Optional)', 'var(--green)', 'var(--green-light)')}
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Name" labelBn="নাম" value={guardianName} onChange={setGuardianName} isBn={isBn} />
          <FormField labelEn="Relation" labelBn="সম্পর্ক" value={guardianRelation} onChange={setGuardianRelation} isBn={isBn}
            options={['Uncle', 'Aunt', 'Grand Father', 'Grand Mother', 'Other']} />
          <FormField labelEn="Phone" labelBn="মোবাইল" value={guardianPhone} onChange={setGuardianPhone} type="tel" isBn={isBn} />
        </div>
        <div style={g(2)}>
          <FormField labelEn="Parent Address" labelBn="অভিভাবকের ঠিকানা" value={parentAddress} onChange={setParentAddress} isBn={isBn} />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate('/teachers/all')}
          style={{ padding: '10px 20px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {isBn ? 'বাতিল' : 'Cancel'}
        </button>
        <button type="submit"
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 24px', borderRadius: '9px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
          <Save size={14} />
          {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
