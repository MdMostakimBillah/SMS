import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, Save, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import type { TeacherStatus } from '@/pages/teachers/types'

export default function EditTeacherPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { language } = useAppStore()
  const { teachers, departments, subjects, updateTeacher } = useTeacherStore()
  const isBn = language === 'bn'

  const teacher = useMemo(() => teachers.find(t => t.id === id), [teachers, id])

  const [nameEn, setNameEn] = useState('')
  const [nameBn, setNameBn] = useState('')
  const [gender, setGender] = useState('Male')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [designation, setDesignation] = useState('')
  const [qualification, setQualification] = useState('')
  const [experience, setExperience] = useState('')
  const [salary, setSalary] = useState('')
  const [status, setStatus] = useState<TeacherStatus>('active')
  const [inTime, setInTime] = useState('')
  const [outTime, setOutTime] = useState('')
  const [photo, setPhoto] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!teacher) return
    setNameEn(teacher.nameEn)
    setNameBn(teacher.nameBn)
    setGender(teacher.gender)
    setPhone(teacher.phone)
    setEmail(teacher.email)
    setAddress(teacher.address)
    setDepartmentId(teacher.departmentId)
    setSubjectIds([...teacher.subjectIds])
    setDesignation(teacher.designation)
    setQualification(teacher.qualification)
    setExperience(teacher.experience)
    setSalary(String(teacher.salary))
    setStatus(teacher.status)
    setInTime(teacher.inTime || '')
    setOutTime(teacher.outTime || '')
    setPhoto(teacher.photo || '')
  }, [teacher])

  const filteredSubjects = subjects.filter(s => !departmentId || s.departmentId === departmentId)
  const toggleSubject = (sid: string) => setSubjectIds(p => p.includes(sid) ? p.filter(x => x !== sid) : [...p, sid])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!teacher) return
    updateTeacher(teacher.id, {
      nameEn, nameBn, gender, phone, email, address, departmentId, subjectIds,
      designation, qualification, experience, salary: Number(salary) || 0,
      status, inTime, outTime, photo,
    })
    setSaved(true)
    setTimeout(() => navigate(`/teachers/all/${teacher.id}`), 800)
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
  }
  const label: React.CSSProperties = { fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }
  const col2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }

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
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Save size={20} style={{ color: 'var(--green)' }} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          {isBn ? 'সংরক্ষণ করা হয়েছে!' : 'Saved Successfully!'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{isBn ? 'পুনঃনির্দেশিত হচ্ছে...' : 'Redirecting...'}</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate(`/teachers/all/${teacher.id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px',
            background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px',
            color: 'var(--text-secondary)', fontFamily: 'inherit', flexShrink: 0 }}>
          <ArrowLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'শিক্ষক সম্পাদনা' : 'Edit Teacher'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {teacher.id} · {teacher.nameEn}
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Photo */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '80px', height: '95px', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={28} style={{ color: 'var(--text-muted)' }} />}
            </div>
            <div>
              <label style={label}>{isBn ? 'ছবি' : 'Photo'}</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              {photo && <button onClick={() => setPhoto('')} style={{ marginTop: '4px', padding: '3px 8px', borderRadius: '5px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>{isBn ? 'ছবি সরান' : 'Remove Photo'}</button>}
            </div>
          </div>

          <div style={col2}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>{isBn ? 'নাম (ইংরেজি) *' : 'Name (English) *'}</label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} style={input} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
              <input value={nameBn} onChange={e => setNameBn(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'লিঙ্গ' : 'Gender'}</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={input}>
                <option value="Male">{isBn ? 'পুরুষ' : 'Male'}</option>
                <option value="Female">{isBn ? 'মহিলা' : 'Female'}</option>
              </select>
            </div>
            <div>
              <label style={label}>{isBn ? 'মোবাইল' : 'Phone'}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'বিভাগ' : 'Department'}</label>
              <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); setSubjectIds([]) }} style={input}>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{isBn ? d.nameBn : d.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>{isBn ? 'ঠিকানা' : 'Address'}</label>
              <input value={address} onChange={e => setAddress(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'পদবি' : 'Designation'}</label>
              <input value={designation} onChange={e => setDesignation(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'যোগ্যতা' : 'Qualification'}</label>
              <input value={qualification} onChange={e => setQualification(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'অভিজ্ঞতা' : 'Experience'}</label>
              <input value={experience} onChange={e => setExperience(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'বেতন' : 'Salary'}</label>
              <input type="number" value={salary} onChange={e => setSalary(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'ইন টাইম' : 'In Time'}</label>
              <input type="time" value={inTime} onChange={e => setInTime(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'আউট টাইম' : 'Out Time'}</label>
              <input type="time" value={outTime} onChange={e => setOutTime(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>{isBn ? 'অবস্থা' : 'Status'}</label>
              <select value={status} onChange={e => setStatus(e.target.value as TeacherStatus)} style={input}>
                <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
                <option value="inactive">{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
                <option value="on-leave">{isBn ? 'ছুটিতে' : 'On Leave'}</option>
              </select>
            </div>
          </div>

          {departmentId && (
            <div>
              <label style={label}>{isBn ? 'বিষয়' : 'Subjects'}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {filteredSubjects.map((s: any) => (
                  <button key={s.id} onClick={() => toggleSubject(s.id)}
                    style={{ padding: '5px 12px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'inherit', border: '1px solid',
                      borderColor: subjectIds.includes(s.id) ? 'var(--brand)' : 'var(--border)',
                      background: subjectIds.includes(s.id) ? 'var(--brand-light)' : 'var(--bg-secondary)',
                      color: subjectIds.includes(s.id) ? 'var(--brand)' : 'var(--text-secondary)' }}>
                    {isBn ? s.nameBn : s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => navigate(`/teachers/all/${teacher.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 16px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <X size={14} />{isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 18px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
