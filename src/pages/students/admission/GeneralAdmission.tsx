import React, { useState, useRef, useCallback, useMemo } from 'react'
import { CheckCircle, User, GraduationCap, ShieldCheck, IdCard, Camera, X, Download, MessageSquare, Send } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import type { StudentAdmission } from './types'
import { generateA4HTML } from './a4Template'

type FormData = Omit<StudentAdmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'approvedAt'>

const initForm = (): FormData => ({
  photo: '', nameEn: '', nameBn: '', dob: '', gender: '',
  bloodGroup: '', religion: '', nationality: 'Bangladeshi',
  phone: '', email: '', class: '', section: '', roll: '',
  academicYear: '2025-26', previousSchool: '',
  admissionDate: new Date().toISOString().split('T')[0],
  presentAddress: '', permanentAddress: '', district: '',
  fatherNameEn: '', fatherNameBn: '', fatherOccupation: '', fatherPhone: '', fatherNid: '',
  motherNameEn: '', motherNameBn: '', motherOccupation: '', motherPhone: '', motherNid: '',
  guardianName: '', guardianRelation: '', guardianPhone: '',
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

// ─── ✅ OUTSIDE parent component — fixes input focus loss ───────────────────
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

export default function GeneralAdmission() {
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { addStudent, getNextId } = useAdmissionStore()
  const { classes } = useClassStore()
  const isBn = language === 'bn'

  const classOptions = useMemo(() => classes.map(cls => cls.name), [classes])
  const sectionsMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    classes.forEach(cls => {
      map[cls.name] = cls.sections.map(s => s.name)
    })
    return map
  }, [classes])

  const [form, setForm] = useState<FormData>(initForm)
  const [studentId] = useState(() => getNextId())
  const [done, setDone] = useState(false)
  const [doneId, setDoneId] = useState('')
  const [photoErr, setPhotoErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = useCallback((key: keyof FormData, val: string) => {
    setForm(p => ({ ...p, [key]: val }))
  }, [])

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoErr('')
    if (file.size > 2 * 1024 * 1024) {
      setPhotoErr(isBn ? 'ছবির সাইজ সর্বোচ্চ ২ MB' : 'Photo must be under 2MB')
      return
    }
    try { set('photo', await compressImage(file)) }
    catch { setPhotoErr(isBn ? 'ছবি লোড করতে সমস্যা' : 'Error loading image') }
  }

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString().split('T')[0]
    addStudent({ ...form, id: studentId, createdAt: now, updatedAt: now, status: 'pending' })
    console.log(`📱 SMS → ${form.phone}: আপনার ভর্তি আবেদন আইডি ${studentId}`)
    setDoneId(studentId)
    setDone(true)
  }, [form, studentId, addStudent])

  const downloadPDF = useCallback(() => {
    const s = useAdmissionStore.getState().students.find(x => x.id === doneId)
    if (!s) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(generateA4HTML(s, isBn))
    win.document.close()
    setTimeout(() => win.print(), 800)
  }, [doneId, isBn])

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
      <span style={{ fontSize: '10px', color: 'var(--red)', marginLeft: '4px' }}>* {isBn ? 'বাধ্যতামূলক' : 'Required'}</span>
    </div>
  )

  // ── Success screen ──
  if (done) return (
    <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <CheckCircle size={30} style={{ color: 'var(--green)' }} />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
        {isBn ? 'আবেদন জমা হয়েছে!' : 'Application Submitted!'}
      </h2>
      <div style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)', borderRadius: '10px', padding: '12px 20px', display: 'inline-block', margin: '0 0 12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{isBn ? 'ছাত্র আইডি' : 'Student ID'}</div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brand)', letterSpacing: '1px' }}>{doneId}</div>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--teal)', margin: '0 0 6px' }}>
        ✅ {isBn ? `${form.phone} নম্বরে SMS পাঠানো হয়েছে` : `SMS sent to ${form.phone}`}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--amber)', marginBottom: '20px' }}>
        ⏳ {isBn ? 'আবেদনটি Pending অবস্থায় আছে। Manage থেকে Approve করুন।' : 'Pending approval. Go to Manage tab to approve.'}
      </p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={downloadPDF}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Download size={14} /> {isBn ? 'আবেদনপত্র PDF' : 'Download Application PDF'}
        </button>
        <button onClick={() => { setDone(false); setForm(initForm()) }}
          style={{ padding: '10px 18px', borderRadius: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {isBn ? 'নতুন আবেদন' : 'New Application'}
        </button>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} autoComplete="off">

      {/* ID bar */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IdCard size={20} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isBn ? 'স্বয়ংক্রিয় ছাত্র আইডি' : 'Auto Student ID'}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand)', letterSpacing: '2px' }}>{studentId}</div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          📅 {form.admissionDate}
        </div>
      </div>

      {/* Personal */}
      <div style={card}>
        {sHead(<User />, 'ব্যক্তিগত তথ্য', 'Personal Information')}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {/* Photo */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              {isBn ? 'ছবি (সর্বোচ্চ ২ MB)' : 'Photo (max 2MB)'}
            </div>
            <div onClick={() => fileRef.current?.click()}
              style={{ width: '90px', height: '110px', borderRadius: '10px', border: `2px dashed ${form.photo ? 'var(--brand)' : 'var(--border-2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
              {form.photo
                ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                    <Camera size={22} style={{ display: 'block', margin: '0 auto 4px' }} />
                    <div style={{ fontSize: '10px' }}>{isBn ? 'ছবি' : 'Photo'}</div>
                  </div>}
              {form.photo && (
                <button type="button" onClick={e => { e.stopPropagation(); set('photo', '') }}
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
              <FormField labelEn="Name (English)" labelBn="নাম (ইংরেজি)" value={form.nameEn} onChange={v => set('nameEn', v)} required isBn={isBn} />
              <FormField labelEn="Name (Bengali)" labelBn="নাম (বাংলা)" value={form.nameBn} onChange={v => set('nameBn', v)} required isBn={isBn} />
            </div>
            <div style={g(2)}>
              <FormField labelEn="Date of Birth" labelBn="জন্ম তারিখ" value={form.dob} onChange={v => set('dob', v)} type="date" required isBn={isBn} />
              <FormField labelEn="Gender" labelBn="লিঙ্গ" value={form.gender} onChange={v => set('gender', v)} required isBn={isBn}
                options={['Male / পুরুষ', 'Female / মহিলা', 'Other / অন্যান্য']} />
            </div>
          </div>
        </div>
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Blood Group" labelBn="রক্তের গ্রুপ" value={form.bloodGroup} onChange={v => set('bloodGroup', v)} required isBn={isBn}
            options={['A+','A-','B+','B-','AB+','AB-','O+','O-']} />
          <FormField labelEn="Religion" labelBn="ধর্ম" value={form.religion} onChange={v => set('religion', v)} required isBn={isBn}
            options={['Islam / ইসলাম','Hinduism / হিন্দু','Christianity / খ্রিস্টান','Buddhism / বৌদ্ধ','Other / অন্যান্য']} />
          <FormField labelEn="Nationality" labelBn="জাতীয়তা" value={form.nationality} onChange={v => set('nationality', v)} required isBn={isBn} />
        </div>
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Mobile (SMS)" labelBn="মোবাইল (SMS)" value={form.phone} onChange={v => set('phone', v)} type="tel" required isBn={isBn} />
          <FormField labelEn="Email" labelBn="ইমেইল" value={form.email} onChange={v => set('email', v)} type="email" isBn={isBn} />
          <FormField labelEn="District" labelBn="জেলা" value={form.district} onChange={v => set('district', v)} required isBn={isBn}
            options={['Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh','Other']} />
        </div>
        <div style={g(2)}>
          <FormField labelEn="Present Address" labelBn="বর্তমান ঠিকানা" value={form.presentAddress} onChange={v => set('presentAddress', v)} required isBn={isBn} />
          <FormField labelEn="Permanent Address" labelBn="স্থায়ী ঠিকানা" value={form.permanentAddress} onChange={v => set('permanentAddress', v)} required isBn={isBn} />
        </div>
      </div>

      {/* Academic */}
      <div style={card}>
        {sHead(<GraduationCap />, 'একাডেমিক তথ্য', 'Academic Info', 'var(--teal)', 'var(--teal-light)')}
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Class" labelBn="শ্রেণি" value={form.class} onChange={v => { set('class', v); set('section', '') }} required isBn={isBn}
            options={classOptions} />
          <FormField labelEn="Section" labelBn="সেকশন" value={form.section} onChange={v => set('section', v)} required isBn={isBn}
            options={form.class ? (sectionsMap[form.class] || []) : []} />
          <FormField labelEn="Roll" labelBn="রোল নম্বর" value={form.roll} onChange={v => set('roll', v)} required isBn={isBn} />
        </div>
        <div style={g(3)}>
          <FormField labelEn="Academic Year" labelBn="শিক্ষাবর্ষ" value={form.academicYear} onChange={v => set('academicYear', v)} required isBn={isBn}
            options={['2024-25','2025-26','2026-27']} />
          <FormField labelEn="Admission Date" labelBn="ভর্তির তারিখ" value={form.admissionDate} onChange={v => set('admissionDate', v)} type="date" required isBn={isBn} />
          <FormField labelEn="Previous School" labelBn="আগের স্কুল" value={form.previousSchool} onChange={v => set('previousSchool', v)} isBn={isBn} />
        </div>
      </div>

      {/* Father */}
      <div style={card}>
        {sHead(<User />, 'পিতার তথ্য', "Father's Info", 'var(--teal)', 'var(--teal-light)')}
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={form.fatherNameEn} onChange={v => set('fatherNameEn', v)} required isBn={isBn} />
          <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={form.fatherNameBn} onChange={v => set('fatherNameBn', v)} required isBn={isBn} />
          <FormField labelEn="Occupation" labelBn="পেশা" value={form.fatherOccupation} onChange={v => set('fatherOccupation', v)} required isBn={isBn} />
        </div>
        <div style={g(2)}>
          <FormField labelEn="Mobile" labelBn="মোবাইল" value={form.fatherPhone} onChange={v => set('fatherPhone', v)} type="tel" required isBn={isBn} />
          <FormField labelEn="NID" labelBn="NID নম্বর" value={form.fatherNid} onChange={v => set('fatherNid', v)} isBn={isBn} />
        </div>
      </div>

      {/* Mother */}
      <div style={card}>
        {sHead(<User />, 'মাতার তথ্য', "Mother's Info", 'var(--purple)', 'var(--purple-light)')}
        <div style={{ ...g(3), marginBottom: '10px' }}>
          <FormField labelEn="Name (EN)" labelBn="নাম (ইংরেজি)" value={form.motherNameEn} onChange={v => set('motherNameEn', v)} required isBn={isBn} />
          <FormField labelEn="Name (BN)" labelBn="নাম (বাংলা)" value={form.motherNameBn} onChange={v => set('motherNameBn', v)} required isBn={isBn} />
          <FormField labelEn="Occupation" labelBn="পেশা" value={form.motherOccupation} onChange={v => set('motherOccupation', v)} required isBn={isBn} />
        </div>
        <div style={g(2)}>
          <FormField labelEn="Mobile" labelBn="মোবাইল" value={form.motherPhone} onChange={v => set('motherPhone', v)} type="tel" required isBn={isBn} />
          <FormField labelEn="NID" labelBn="NID নম্বর" value={form.motherNid} onChange={v => set('motherNid', v)} isBn={isBn} />
        </div>
      </div>

      {/* Guardian */}
      <div style={card}>
        {sHead(<ShieldCheck />, 'অভিভাবক (ঐচ্ছিক)', 'Guardian (Optional)', 'var(--green)', 'var(--green-light)')}
        <div style={g(3)}>
          <FormField labelEn="Name" labelBn="নাম" value={form.guardianName} onChange={v => set('guardianName', v)} isBn={isBn} />
          <FormField labelEn="Relation" labelBn="সম্পর্ক" value={form.guardianRelation} onChange={v => set('guardianRelation', v)} isBn={isBn}
            options={['Uncle / চাচা','Aunt / খালা','Grand Father / দাদা','Grand Mother / দাদি','Other / অন্যান্য']} />
          <FormField labelEn="Mobile" labelBn="মোবাইল" value={form.guardianPhone} onChange={v => set('guardianPhone', v)} type="tel" isBn={isBn} />
        </div>
      </div>

      {/* SMS notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--teal-light)', border: '1px solid var(--teal)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
        <MessageSquare size={16} style={{ color: 'var(--teal)', flexShrink: 0 }} />
        <p style={{ fontSize: '12px', color: 'var(--teal)' }}>
          {isBn
            ? `আবেদন জমা দিলে ${form.phone || '...'} এ SMS যাবে।`
            : `SMS will be sent to ${form.phone || '...'} after submission.`}
        </p>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setForm(initForm())}
          style={{ padding: '10px 20px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {isBn ? 'রিসেট' : 'Reset'}
        </button>
        <button type="submit"
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 24px', borderRadius: '9px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
          <Send size={14} />
          {isBn ? 'আবেদন জমা দিন' : 'Submit Application'}
        </button>
      </div>
    </form>
  )
}
