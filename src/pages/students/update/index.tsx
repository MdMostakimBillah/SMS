import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, Camera, CheckCircle, GraduationCap, Save, Search, ShieldCheck, User, UserSearch, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'
import type { StudentAdmission } from '@/pages/students/admission/types'

// ✅ OUTSIDE — prevents input focus loss
interface FP { l:string; v:string; onChange:(v:string)=>void; type?:string; opts?:string[]; req?:boolean }
const F = React.memo(function F({ l, v, onChange, type='text', opts, req }: FP) {
  const s: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'13px', fontFamily:'inherit', outline:'none' }
  return (
    <div>
      <label style={{ fontSize:'11px', fontWeight:500, color:'var(--text-secondary)', marginBottom:'4px', display:'block' }}>
        {l}{req&&<span style={{ color:'var(--red)', marginLeft:'2px' }}>*</span>}
      </label>
      {opts
        ? <select value={v} onChange={e=>onChange(e.target.value)} style={{ ...s, cursor:'pointer' }}>
            <option value="">—</option>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={type} value={v} onChange={e=>onChange(e.target.value)} required={req} style={s}
            onFocus={e=>(e.target.style.borderColor='var(--brand)')}
            onBlur={e=>(e.target.style.borderColor='var(--border)')} />}
    </div>
  )
})

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve,reject) => {
    const img = new Image(), url = URL.createObjectURL(file)
    img.onload = () => {
      const c=document.createElement('canvas'), max=300, r=Math.min(max/img.width,max/img.height)
      c.width=Math.round(img.width*r); c.height=Math.round(img.height*r)
      c.getContext('2d')!.drawImage(img,0,0,c.width,c.height)
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg',0.82))
    }
    img.onerror=reject; img.src=url
  })
}

export default function UpdateStudentPage() {
  const location = useLocation()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { students, updateStudent } = useAdmissionStore()
  const isBn = language === 'bn'

  const [search,  setSearch]  = useState('')
  const [chosen,  setChosen]  = useState<StudentAdmission|null>(null)
  const [form,    setForm]    = useState<StudentAdmission|null>(null)
  const [saved,   setSaved]   = useState(false)
  const [photoErr,setPhotoErr]= useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // If navigated from All Students page with studentId
  useEffect(() => {
    const sid = (location.state as any)?.studentId
    if (sid) {
      const s = students.find(x => x.id === sid)
      if (s) { setChosen(s); setForm({...s}) }
    }
  }, [location.state, students])

  const results = search.length >= 2
    ? students.filter(s =>
        s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        s.nameBn.includes(search) || s.id.includes(search) ||
        s.phone.includes(search) || s.roll.includes(search)
      ).slice(0, 10)
    : []

  const selectStudent = useCallback((s: StudentAdmission) => {
    setChosen(s); setForm({...s}); setSearch(''); setSaved(false)
  }, [])

  const set = useCallback((k: keyof StudentAdmission, v: string) => {
    setForm(p => p ? {...p,[k]:v} : p)
  }, [])

  const handlePhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPhotoErr('')
    if (file.size > 2*1024*1024) { setPhotoErr(isBn?'ছবি ২ MB এর বেশি নয়':'Max 2MB'); return }
    try { set('photo', await compressImage(file)) }
    catch { setPhotoErr(isBn?'ছবি লোড হয়নি':'Error loading') }
  }, [set, isBn])

  const handleSave = useCallback(() => {
    if (!form) return
    updateStudent(form.id, form)
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }, [form, updateStudent])

  const g = (n: number): React.CSSProperties => ({
    display:'grid', gridTemplateColumns:isMobile?'1fr':`repeat(${n},1fr)`, gap:'10px',
  })
  const card: React.CSSProperties = {
    background:'var(--bg-primary)', border:'1px solid var(--border)',
    borderRadius:'14px', padding:isMobile?'14px':'18px', marginBottom:'12px',
  }
  const secHead = (icon: React.ReactNode, title: string, _color='var(--brand)', bg='var(--brand-light)') => (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', paddingBottom:'10px', borderBottom:'1px solid var(--border)' }}>
      <div style={{ width:'28px', height:'28px', borderRadius:'7px', background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {icon}
      </div>
      <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>{title}</span>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px', flexWrap:'wrap' }}>
        <button onClick={() => window.history.back()}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px', background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer', fontSize:'13px', color:'var(--text-secondary)', fontFamily:'inherit', flexShrink:0 }}>
          <ArrowLeft size={14} />
          {isBn?'ফিরে যান':'Back'}
        </button>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:600, color:'var(--text-primary)' }}>
            {isBn?'ছাত্রের তথ্য আপডেট':'Update Student Info'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {isBn?'ছাত্র খুঁজে তার সকল তথ্য সম্পাদনা করুন':'Search a student and edit all their information'}
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'280px 1fr', gap:'16px', alignItems:'start' }}>

        {/* LEFT: Search panel */}
        <div style={{ position:'sticky', top:0 }}>
          <div style={card}>
            <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)', marginBottom:'10px' }}>
              {isBn?'🔍 ছাত্র খুঁজুন':'🔍 Find Student'}
            </div>
            <div style={{ position:'relative', marginBottom:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'9px', padding:'8px 10px' }}>
                <Search size={14} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder={isBn?'নাম, আইডি, রোল...':'Name, ID, roll...'}
                  style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'13px', color:'var(--text-primary)', fontFamily:'inherit' }} />
                {search && <button onClick={()=>setSearch('')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={12} /></button>}
              </div>

              {results.length > 0 && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'10px', overflow:'hidden', zIndex:20, marginTop:'4px', boxShadow:'var(--shadow-md)' }}>
                  {results.map(s => (
                    <div key={s.id} onClick={() => selectStudent(s)}
                      style={{ display:'flex', gap:'10px', padding:'9px 12px', cursor:'pointer', borderBottom:'0.5px solid var(--border)' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-secondary)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <div style={{ width:'30px', height:'35px', borderRadius:'5px', overflow:'hidden', background:'var(--bg-secondary)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {s.photo ? <img src={s.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <User size={13} style={{ color:'var(--text-muted)' }} />}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.nameEn}</div>
                        <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>{s.id} · {isBn?`শ্রেণি ${s.class}`:`Class ${s.class}`}{s.section?`-${s.section}`:''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {chosen && form ? (
              <div style={{ padding:'10px', background:'var(--brand-light)', borderRadius:'10px', border:'1px solid var(--brand)' }}>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <div style={{ width:'36px', height:'44px', borderRadius:'6px', overflow:'hidden', background:'var(--bg-secondary)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {form.photo ? <img src={form.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <User size={16} style={{ color:'var(--text-muted)' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:600, color:'var(--brand)' }}>{form.nameEn}</div>
                    <div style={{ fontSize:'10px', color:'var(--brand)', fontFamily:'monospace', opacity:0.8 }}>{form.id}</div>
                    <div style={{ fontSize:'10px', color:'var(--brand)', opacity:0.7 }}>
                      {isBn?`শ্রেণি ${form.class}`:`Class ${form.class}`}{form.section?`-${form.section}`:''} · {form.phone}
                    </div>
                  </div>
                </div>
                {saved && (
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'8px', fontSize:'12px', color:'var(--green)', fontWeight:500 }}>
                    <CheckCircle size={13} />
                    {isBn?'সফলভাবে সেভ হয়েছে!':'Saved successfully!'}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding:'20px 12px', background:'var(--bg-secondary)', borderRadius:'10px', textAlign:'center' }}>
                <UserSearch size={24} style={{ color:'var(--text-muted)', display:'block', margin:'0 auto 6px', opacity:0.4 }} />
                <p style={{ fontSize:'12px', color:'var(--text-muted)', lineHeight:1.5 }}>
                  {isBn?'নাম বা আইডি লিখে ছাত্র খুঁজুন':'Search by name or ID'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Edit form */}
        {form ? (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'8px' }}>
              <h2 style={{ fontSize:'17px', fontWeight:600, color:'var(--text-primary)' }}>
                {isBn?'তথ্য সম্পাদনা':'Edit Information'}
              </h2>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => { setForm({...chosen!}); setSaved(false) }}
                  style={{ padding:'8px 14px', borderRadius:'9px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                  {isBn?'রিসেট':'Reset'}
                </button>
                <button onClick={handleSave}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 18px', borderRadius:'9px', background:'var(--brand)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }}>
                  <Save size={14} />{isBn?'সেভ করুন':'Save Changes'}
                </button>
              </div>
            </div>

            {/* Personal */}
            <div style={card}>
              {secHead(<User size={14} style={{ color:'var(--brand)' }} />, isBn?'ব্যক্তিগত তথ্য':'Personal Information')}
              <div style={{ display:'flex', gap:'14px', marginBottom:'12px', flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:'11px', fontWeight:500, color:'var(--text-secondary)', marginBottom:'5px' }}>{isBn?'ছবি (সর্বোচ্চ ২ MB)':'Photo (max 2MB)'}</div>
                  <div onClick={() => fileRef.current?.click()}
                    style={{ width:'80px', height:'96px', borderRadius:'8px', border:`2px dashed ${form.photo?'var(--brand)':'var(--border-2)'}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', background:'var(--bg-secondary)', position:'relative' }}>
                    {form.photo
                      ? <img src={form.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <div style={{ textAlign:'center', color:'var(--text-muted)' }}>
                          <Camera size={20} style={{ display:'block', margin:'0 auto 3px' }} />
                          <div style={{ fontSize:'10px' }}>Upload</div>
                        </div>}
                    {form.photo && (
                      <button type="button" onClick={e=>{e.stopPropagation();set('photo','')}}
                        style={{ position:'absolute', top:2, right:2, width:'18px', height:'18px', borderRadius:'50%', background:'var(--red)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                        <X size={10} />
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }} />
                  {photoErr && <div style={{ fontSize:'10px', color:'var(--red)', marginTop:'3px', maxWidth:'80px' }}>{photoErr}</div>}
                </div>
                <div style={{ flex:1, minWidth:'200px' }}>
                  <div style={{ ...g(2), marginBottom:'10px' }}>
                    <F l={isBn?'নাম (ইং)':'Name (EN)'} v={form.nameEn} onChange={v=>set('nameEn',v)} req />
                    <F l={isBn?'নাম (বাং)':'Name (BN)'} v={form.nameBn} onChange={v=>set('nameBn',v)} />
                  </div>
                  <div style={g(2)}>
                    <F l={isBn?'জন্ম তারিখ':'Date of Birth'} v={form.dob} onChange={v=>set('dob',v)} type="date" />
                    <F l={isBn?'লিঙ্গ':'Gender'} v={form.gender} onChange={v=>set('gender',v)}
                      opts={['Male / পুরুষ','Female / মহিলা','Other / অন্যান্য']} />
                  </div>
                </div>
              </div>
              <div style={{ ...g(3), marginBottom:'10px' }}>
                <F l={isBn?'রক্তের গ্রুপ':'Blood Group'} v={form.bloodGroup} onChange={v=>set('bloodGroup',v)} opts={['A+','A-','B+','B-','AB+','AB-','O+','O-']} />
                <F l={isBn?'ধর্ম':'Religion'} v={form.religion} onChange={v=>set('religion',v)} opts={['Islam / ইসলাম','Hinduism / হিন্দু','Christianity / খ্রিস্টান','Buddhism / বৌদ্ধ','Other / অন্যান্য']} />
                <F l={isBn?'জাতীয়তা':'Nationality'} v={form.nationality} onChange={v=>set('nationality',v)} />
              </div>
              <div style={{ ...g(3), marginBottom:'10px' }}>
                <F l={isBn?'মোবাইল':'Mobile'} v={form.phone} onChange={v=>set('phone',v)} type="tel" req />
                <F l="Email" v={form.email} onChange={v=>set('email',v)} type="email" />
                <F l={isBn?'জেলা':'District'} v={form.district} onChange={v=>set('district',v)} opts={['Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh','Other']} />
              </div>
              <div style={g(2)}>
                <F l={isBn?'বর্তমান ঠিকানা':'Present Address'} v={form.presentAddress} onChange={v=>set('presentAddress',v)} />
                <F l={isBn?'স্থায়ী ঠিকানা':'Permanent Address'} v={form.permanentAddress} onChange={v=>set('permanentAddress',v)} />
              </div>
            </div>

            {/* Academic */}
            <div style={card}>
              {secHead(<GraduationCap size={14} style={{ color:'var(--teal)' }} />, isBn?'একাডেমিক তথ্য':'Academic Info', 'var(--teal)', 'var(--teal-light)')}
              <div style={{ ...g(3), marginBottom:'10px' }}>
                <F l={isBn?'শ্রেণি':'Class'} v={form.class} onChange={v=>set('class',v)} opts={['1','2','3','4','5','6','7','8','9','10']} req />
                <F l={isBn?'সেকশন':'Section'} v={form.section} onChange={v=>set('section',v)} opts={['A','B','C','D','E']} />
                <F l={isBn?'রোল':'Roll'} v={form.roll} onChange={v=>set('roll',v)} />
              </div>
              <div style={g(3)}>
                <F l={isBn?'শিক্ষাবর্ষ':'Academic Year'} v={form.academicYear} onChange={v=>set('academicYear',v)} opts={['2024-25','2025-26','2026-27']} />
                <F l={isBn?'ভর্তির তারিখ':'Admission Date'} v={form.admissionDate} onChange={v=>set('admissionDate',v)} type="date" />
                <F l={isBn?'আগের স্কুল':'Previous School'} v={form.previousSchool} onChange={v=>set('previousSchool',v)} />
              </div>
            </div>

            {/* Father */}
            <div style={card}>
              {secHead(<User size={14} style={{ color:'var(--teal)' }} />, isBn?'পিতার তথ্য':"Father's Info", 'var(--teal)', 'var(--teal-light)')}
              <div style={{ ...g(3), marginBottom:'10px' }}>
                <F l={isBn?'নাম (ইং)':'Name (EN)'} v={form.fatherNameEn} onChange={v=>set('fatherNameEn',v)} />
                <F l={isBn?'নাম (বাং)':'Name (BN)'} v={form.fatherNameBn} onChange={v=>set('fatherNameBn',v)} />
                <F l={isBn?'পেশা':'Occupation'} v={form.fatherOccupation} onChange={v=>set('fatherOccupation',v)} />
              </div>
              <div style={g(2)}>
                <F l={isBn?'মোবাইল':'Mobile'} v={form.fatherPhone} onChange={v=>set('fatherPhone',v)} type="tel" />
                <F l="NID" v={form.fatherNid} onChange={v=>set('fatherNid',v)} />
              </div>
            </div>

            {/* Mother */}
            <div style={card}>
              {secHead(<User size={14} style={{ color:'var(--purple)' }} />, isBn?'মাতার তথ্য':"Mother's Info", 'var(--purple)', 'var(--purple-light)')}
              <div style={{ ...g(3), marginBottom:'10px' }}>
                <F l={isBn?'নাম (ইং)':'Name (EN)'} v={form.motherNameEn} onChange={v=>set('motherNameEn',v)} />
                <F l={isBn?'নাম (বাং)':'Name (BN)'} v={form.motherNameBn} onChange={v=>set('motherNameBn',v)} />
                <F l={isBn?'পেশা':'Occupation'} v={form.motherOccupation} onChange={v=>set('motherOccupation',v)} />
              </div>
              <div style={g(2)}>
                <F l={isBn?'মোবাইল':'Mobile'} v={form.motherPhone} onChange={v=>set('motherPhone',v)} type="tel" />
                <F l="NID" v={form.motherNid} onChange={v=>set('motherNid',v)} />
              </div>
            </div>

            {/* Guardian */}
            <div style={card}>
              {secHead(<ShieldCheck size={14} style={{ color:'var(--green)' }} />, isBn?'অভিভাবক':'Guardian', 'var(--green)', 'var(--green-light)')}
              <div style={g(3)}>
                <F l={isBn?'নাম':'Name'} v={form.guardianName} onChange={v=>set('guardianName',v)} />
                <F l={isBn?'সম্পর্ক':'Relation'} v={form.guardianRelation} onChange={v=>set('guardianRelation',v)} opts={['Uncle / চাচা','Aunt / খালা','Grand Father / দাদা','Grand Mother / দাদি','Other / অন্যান্য']} />
                <F l={isBn?'মোবাইল':'Mobile'} v={form.guardianPhone} onChange={v=>set('guardianPhone',v)} type="tel" />
              </div>
            </div>

            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={()=>setForm({...chosen!})}
                style={{ padding:'10px 18px', borderRadius:'9px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'রিসেট':'Reset'}
              </button>
              <button onClick={handleSave}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 22px', borderRadius:'9px', background:'var(--brand)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
                <Save size={15} />{isBn?'পরিবর্তন সেভ করুন':'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ ...card, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px', textAlign:'center' }}>
            <UserSearch size={48} style={{ color:'var(--text-muted)', opacity:0.3, marginBottom:'14px' }} />
            <h3 style={{ fontSize:'16px', fontWeight:500, color:'var(--text-primary)', marginBottom:'6px' }}>
              {isBn?'ছাত্র সিলেক্ট করুন':'Select a Student'}
            </h3>
            <p style={{ fontSize:'13px', color:'var(--text-muted)' }}>
              {isBn?'বামের সার্চ বক্সে নাম বা আইডি লিখুন':'Search by name or ID on the left panel'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
