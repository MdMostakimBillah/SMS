import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Clock, Users, Check } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import type { Teacher, TeacherStatus } from '@/pages/teachers/types'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const GENDERS = ['Male', 'Female']
const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Head of Department', 'Lab Assistant']
const RELIGIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism']

export default function AddTeacherPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { departments, subjects, addTeacher, getNextTeacherId } = useTeacherStore()
  const isBn = language === 'bn'
  const fileRef = useRef<HTMLInputElement>(null)

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
  const [bonus, setBonus] = useState('')
  const [overtime, setOvertime] = useState('')
  const [festivalBonus, setFestivalBonus] = useState('')
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
  const [saving, setSaving] = useState(false)

  const filteredSubjects = subjects.filter(s => !departmentId || s.departmentId === departmentId)

  const toggleSubject = (id: string) => {
    setSubjectIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!nameEn.trim() || !phone.trim() || !departmentId) {
      alert(isBn ? 'অনুগ্রহ করে প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill in required fields')
      return
    }
    setSaving(true)
    const now = new Date().toISOString().split('T')[0]
    const teacher: Teacher = {
      id: getNextTeacherId(),
      createdAt: now, updatedAt: now,
      status, photo,
      nameEn: nameEn.trim(), nameBn: nameBn.trim(),
      gender, dob, bloodGroup, religion,
      phone: phone.trim(), email: email.trim(),
      address: address.trim(), nid: nid.trim(),
      emergencyPhone: emergencyPhone.trim(),
      departmentId, subjectIds,
      designation, qualification: qualification.trim(),
      experience: experience.trim(), joiningDate,
      salary: Number(salary) || 0,
      bonus: Number(bonus) || 0,
      overtime: Number(overtime) || 0,
      festivalBonus: Number(festivalBonus) || 0,
      inTime, outTime,
      fatherNameEn: fatherNameEn.trim(), fatherNameBn: fatherNameBn.trim(),
      fatherPhone: fatherPhone.trim(), fatherNid: fatherNid.trim(),
      motherNameEn: motherNameEn.trim(), motherNameBn: motherNameBn.trim(),
      motherPhone: motherPhone.trim(),
      guardianName: guardianName.trim(), guardianPhone: guardianPhone.trim(),
      guardianRelation: guardianRelation.trim(),
      parentAddress: parentAddress.trim(),
      signature: '',
    }
    addTeacher(teacher)
    setSaving(false)
    navigate('/teachers/all')
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
  }
  const label: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)',
    marginBottom: '5px', display: 'block',
  }
  const section: React.CSSProperties = {
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px', marginBottom: '14px',
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--border)',
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '0 4px' : '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/teachers')}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px',
            background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer',
            fontSize:'13px', color:'var(--text-secondary)', fontFamily:'inherit' }}>
          <ArrowLeft size={14} />
          {isBn?'ফিরে যান':'Back'}
        </button>
        <div>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn?'নতুন শিক্ষক যোগ':'Add Teacher'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {isBn?'সকল তথ্য পূরণ করে সাবমিট করুন':'Fill in all details and submit'}
          </p>
        </div>
      </div>

      {/* Photo + Basic Info */}
      <div style={section}>
        <div style={sectionTitle}>{isBn?'ব্যক্তিগত তথ্য':'Personal Information'}</div>
        {/* Photo centered */}
        <div style={{ textAlign:'center', marginBottom:'16px' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }} />
          <div onClick={() => fileRef.current?.click()}
            style={{ width:'100px', height:'120px', borderRadius:'10px', border:'2px dashed var(--border)',
              background:'var(--bg-secondary)', cursor:'pointer', display:'inline-flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            {photo ? <img src={photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <><Camera size={24} style={{ color:'var(--text-muted)' }} />
                 <span style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'4px' }}>{isBn?'ছবি':'Photo'}</span></>}
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()}
              style={{ marginTop:'6px', padding:'4px 10px', borderRadius:'6px', fontSize:'11px', cursor:'pointer',
                background:'var(--brand-light)', border:'1px solid var(--brand)', color:'var(--brand)',
                fontFamily:'inherit' }}>
              {isBn?'ছবি আপলোড':'Upload'}
            </button>
          </div>
        </div>

        {/* Fields - full width on mobile, 2-col on desktop */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'10px' }}>
            <div>
              <label style={label}>{isBn?'নাম (ইংরেজি) *':'Name (English) *'}</label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} style={input}
                placeholder={isBn?'ইংরেজিতে নাম':'English name'} />
            </div>
            <div>
              <label style={label}>{isBn?'নাম (বাংলা)':'Name (Bangla)'}</label>
              <input value={nameBn} onChange={e => setNameBn(e.target.value)} style={input}
                placeholder={isBn?'বাংলায় নাম':'Bangla name'} />
            </div>
            <div>
              <label style={label}>{isBn?'লিঙ্গ':'Gender'}</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={input}>
                <option value="">{isBn?'নির্বাচন করুন':'Select'}</option>
                {GENDERS.map(g => <option key={g} value={g}>{isBn?(g==='Male'?'পুরুষ':'মহিলা'):g}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>{isBn?'জন্ম তারিখ':'Date of Birth'}</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn?'রক্তের গ্রুপ':'Blood Group'}</label>
              <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} style={input}>
                <option value="">{isBn?'নির্বাচন করুন':'Select'}</option>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>{isBn?'ধর্ম':'Religion'}</label>
              <select value={religion} onChange={e => setReligion(e.target.value)} style={input}>
                <option value="">{isBn?'নির্বাচন করুন':'Select'}</option>
                {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>{isBn?'মোবাইল *':'Phone *'}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} style={input}
                placeholder="01XXX-XXXXXX" />
            </div>
            <div>
              <label style={label}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={input}
                placeholder="teacher@email.com" />
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <label style={label}>{isBn?'ঠিকানা':'Address'}</label>
              <input value={address} onChange={e => setAddress(e.target.value)} style={input}
                placeholder={isBn?'সম্পূর্ণ ঠিকানা':'Full address'} />
            </div>
            <div>
              <label style={label}>NID</label>
              <input value={nid} onChange={e => setNid(e.target.value)} style={input}
                placeholder={isBn?'জাতীয় পরিচয়পত্র নম্বর':'National ID number'} />
            </div>
            <div>
              <label style={label}>{isBn?'জরুরি মোবাইল':'Emergency Phone'}</label>
              <input value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} style={input}
                placeholder="01XXX-XXXXXX" />
            </div>
          </div>
      </div>

      {/* Schedule Info */}
      <div style={section}>
        <div style={sectionTitle}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <Clock size={18} style={{ color:'var(--teal)' }} />
            {isBn?'সময়সূচি':'Schedule'}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'10px' }}>
          <div>
            <label style={label}>{isBn?'প্রবেশ সময় (In Time)':'In Time'}</label>
            <input type="time" value={inTime} onChange={e => setInTime(e.target.value)} style={input} />
            <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>
              {isBn?'বায়োমেট্রিক / ফিঙ্গারপ্রিন্ট মেশিন থেকে পুল করা হবে':'Pulled from biometric / fingerprint machine'}
            </div>
          </div>
          <div>
            <label style={label}>{isBn?'প্রস্থান সময় (Out Time)':'Out Time'}</label>
            <input type="time" value={outTime} onChange={e => setOutTime(e.target.value)} style={input} />
            <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'3px' }}>
              {isBn?'বায়োমেট্রিক / ফিঙ্গারপ্রিন্ট মেশিন থেকে পুল করা হবে':'Pulled from biometric / fingerprint machine'}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div style={section}>
        <div style={sectionTitle}>{isBn?'পেশাদার তথ্য':'Professional Information'}</div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'10px' }}>
          <div>
            <label style={label}>{isBn?'বিভাগ *':'Department *'}</label>
            <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); setSubjectIds([]) }}
              style={input}>
              <option value="">{isBn?'নির্বাচন করুন':'Select'}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{isBn?d.nameBn:d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>{isBn?'পদবি':'Designation'}</label>
            <select value={designation} onChange={e => setDesignation(e.target.value)} style={input}>
              <option value="">{isBn?'নির্বাচন করুন':'Select'}</option>
              {DESIGNATIONS.map(d => <option key={d} value={d}>{isBn?
                d==='Professor'?'অধ্যাপক':d==='Associate Professor'?'সহযোগী অধ্যাপক':d==='Assistant Professor'?'সহকারী অধ্যাপক':
                d==='Lecturer'?'প্রভাষক':d==='Head of Department'?'বিভাগ প্রধান':'ল্যাব সহকারী':d}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>{isBn?'যোগ্যতা':'Qualification'}</label>
            <input value={qualification} onChange={e => setQualification(e.target.value)} style={input}
              placeholder={isBn?'শিক্ষাগত যোগ্যতা':'Educational qualification'} />
          </div>
          <div>
            <label style={label}>{isBn?'অভিজ্ঞতা':'Experience'}</label>
            <input value={experience} onChange={e => setExperience(e.target.value)} style={input}
              placeholder={isBn?'৫ বছর':'5 years'} />
          </div>
          <div>
            <label style={label}>{isBn?'যোগদানের তারিখ':'Joining Date'}</label>
            <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} style={input} />
          </div>
          <div>
            <label style={label}>{isBn?'মূল বেতন (মাসিক)':'Basic Salary (Monthly)'}</label>
            <input type="number" value={salary} onChange={e => setSalary(e.target.value)} style={input}
              placeholder="৳0" />
          </div>
          <div>
            <label style={label}>{isBn?'বোনাস (মাসিক)':'Bonus (Monthly)'}</label>
            <input type="number" value={bonus} onChange={e => setBonus(e.target.value)} style={input}
              placeholder="৳0" />
          </div>
          <div>
            <label style={label}>{isBn?'ওভারটাইম':'Overtime'}</label>
            <input type="number" value={overtime} onChange={e => setOvertime(e.target.value)} style={input}
              placeholder="৳0" />
          </div>
          <div>
            <label style={label}>{isBn?'উৎসব বোনাস':'Festival Bonus'}</label>
            <input type="number" value={festivalBonus} onChange={e => setFestivalBonus(e.target.value)} style={input}
              placeholder="৳0" />
          </div>
          <div>
            <label style={label}>{isBn?'অবস্থা':'Status'}</label>
            <select value={status} onChange={e => setStatus(e.target.value as TeacherStatus)} style={input}>
              <option value="active">{isBn?'সক্রিয়':'Active'}</option>
              <option value="inactive">{isBn?'নিষ্ক্রিয়':'Inactive'}</option>
              <option value="on-leave">{isBn?'ছুটিতে':'On Leave'}</option>
            </select>
          </div>
        </div>

        {/* Subjects */}
        {departmentId && (
          <div style={{ marginTop:'14px' }}>
            <label style={label}>{isBn?'বিষয় নির্বাচন করুন':'Select Subjects'}</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'4px' }}>
              {filteredSubjects.map(s => (
                <button key={s.id} onClick={() => toggleSubject(s.id)}
                  style={{ padding:'5px 12px', borderRadius:'8px', fontSize:'12px', cursor:'pointer',
                    fontFamily:'inherit', border:'1px solid',
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

      {/* Parent / Guardian Info */}
      <div style={section}>
        <div style={sectionTitle}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <Users size={18} style={{ color:'var(--amber)' }} />
            {isBn?'অভিভাবক তথ্য':'Parent / Guardian Information'}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'10px' }}>
          {/* Father */}
          <div style={{ gridColumn:'1 / -1' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text-primary)', marginBottom:'8px' }}>
              {isBn?'পিতার তথ্য':'Father\'s Information'}
            </div>
          </div>
          <div>
            <label style={label}>{isBn?'পিতার নাম (ইং)':'Father Name (EN)'}</label>
            <input value={fatherNameEn} onChange={e => setFatherNameEn(e.target.value)} style={input}
              placeholder={isBn?'ইংরেজিতে নাম':'English name'} />
          </div>
          <div>
            <label style={label}>{isBn?'পিতার নাম (বা)':'Father Name (BN)'}</label>
            <input value={fatherNameBn} onChange={e => setFatherNameBn(e.target.value)} style={input}
              placeholder={isBn?'বাংলায় নাম':'Bangla name'} />
          </div>
          <div>
            <label style={label}>{isBn?'পিতার মোবাইল':'Father Phone'}</label>
            <input value={fatherPhone} onChange={e => setFatherPhone(e.target.value)} style={input}
              placeholder="01XXX-XXXXXX" />
          </div>
          <div>
            <label style={label}>{isBn?'পিতার NID':'Father NID'}</label>
            <input value={fatherNid} onChange={e => setFatherNid(e.target.value)} style={input}
              placeholder={isBn?'জাতীয় পরিচয়পত্র':'National ID'} />
          </div>

          {/* Mother */}
          <div style={{ gridColumn:'1 / -1', marginTop:'8px' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text-primary)', marginBottom:'8px' }}>
              {isBn?'মাতার তথ্য':'Mother\'s Information'}
            </div>
          </div>
          <div>
            <label style={label}>{isBn?'মাতার নাম (ইং)':'Mother Name (EN)'}</label>
            <input value={motherNameEn} onChange={e => setMotherNameEn(e.target.value)} style={input}
              placeholder={isBn?'ইংরেজিতে নাম':'English name'} />
          </div>
          <div>
            <label style={label}>{isBn?'মাতার নাম (বা)':'Mother Name (BN)'}</label>
            <input value={motherNameBn} onChange={e => setMotherNameBn(e.target.value)} style={input}
              placeholder={isBn?'বাংলায় নাম':'Bangla name'} />
          </div>
          <div>
            <label style={label}>{isBn?'মাতার মোবাইল':'Mother Phone'}</label>
            <input value={motherPhone} onChange={e => setMotherPhone(e.target.value)} style={input}
              placeholder="01XXX-XXXXXX" />
          </div>

          {/* Guardian */}
          <div style={{ gridColumn:'1 / -1', marginTop:'8px' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text-primary)', marginBottom:'8px' }}>
              {isBn?'অভিভাবক তথ্য (ঐচ্ছিক)':'Guardian Information (Optional)'}
            </div>
          </div>
          <div>
            <label style={label}>{isBn?'অভিভাবকের নাম':'Guardian Name'}</label>
            <input value={guardianName} onChange={e => setGuardianName(e.target.value)} style={input}
              placeholder={isBn?'অভিভাবকের নাম':'Guardian name'} />
          </div>
          <div>
            <label style={label}>{isBn?'অভিভাবকের মোবাইল':'Guardian Phone'}</label>
            <input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} style={input}
              placeholder="01XXX-XXXXXX" />
          </div>
          <div>
            <label style={label}>{isBn?'সম্পর্ক':'Relation'}</label>
            <input value={guardianRelation} onChange={e => setGuardianRelation(e.target.value)} style={input}
              placeholder={isBn?'সম্পর্ক (যেমন: চাচা, খালা)':'Relation (e.g. Uncle, Aunt)'} />
          </div>
          <div>
            <label style={label}>{isBn?'অভিভাবকের ঠিকানা':'Parent Address'}</label>
            <input value={parentAddress} onChange={e => setParentAddress(e.target.value)} style={input}
              placeholder={isBn?'সম্পূর্ণ ঠিকানা':'Full address'} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'14px', flexWrap:'wrap' }}>
        <button onClick={() => navigate('/teachers')}
          style={{ padding:'9px 18px', borderRadius:'9px', background:'var(--bg-secondary)',
            border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px',
            cursor:'pointer', fontFamily:'inherit' }}>
          {isBn?'বাতিল':'Cancel'}
        </button>
        <button onClick={handleSubmit} disabled={saving}
          style={{ padding:'9px 22px', borderRadius:'9px', background: saving ? 'var(--text-muted)' : 'var(--brand)',
            border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor: saving ? 'default' : 'pointer',
            fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px' }}>
          <Check size={14} />
          {saving ? (isBn?'সংরক্ষণ হচ্ছে...':'Saving...') : (isBn?'সাবমিট':'Submit')}
        </button>
      </div>
    </div>
  )
}
