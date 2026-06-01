import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Clock, Users, Plus, Trash2, Save, Check, Building2, Phone, Globe, MapPin, Edit2, X, Signature, CalendarDays, Download, BookOpen } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore } from '@/store/admissionStore'

export default function ClassesPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { institution, classes, routines, updateInstitution, addClass, updateClass, deleteClass, addSection, updateSection, deleteSection, updateRoutine, setRoutineSlot, clearRoutineSlot } = useClassStore()
  const { teachers, subjects } = useTeacherStore()
  const { students } = useAdmissionStore()
  const isBn = language === 'bn'

  const [activeTab, setActiveTab] = useState<'institution' | 'classes' | 'routine'>('institution')
  const [editingInst, setEditingInst] = useState(false)
  const [instForm, setInstForm] = useState(() => ({
    ...institution,
    breaks: institution.breaks?.length > 0 ? institution.breaks : [{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }],
  }))
  const [saved, setSaved] = useState(false)
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [showAddClass, setShowAddClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassNameBn, setNewClassNameBn] = useState('')
  const [editingClassTime, setEditingClassTime] = useState<string | null>(null)
  const [classTimeForm, setClassTimeForm] = useState({ startTime: '', endTime: '' })
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [secForm, setSecForm] = useState({ name: '', seatQuantity: 40, classTeacherId: '' })
  const [showSubjectModal, setShowSubjectModal] = useState<{ classId: string; sectionId: string } | null>(null)
  const [tempSelectedSubjects, setTempSelectedSubjects] = useState<string[]>([])

  const getTeacher = useCallback((id: string) => teachers.find(t => t.id === id), [teachers])

  const getStudentCount = useCallback((classNum: string, sectionName: string) => {
    return students.filter(s => s.status === 'approved' && s.class === classNum && s.section === sectionName).length
  }, [students])

  const handleSaveInstitution = () => {
    updateInstitution(instForm)
    setEditingInst(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddClass = () => {
    if (!newClassName.trim()) return
    const id = `CLS-${String(classes.length + 1).padStart(2, '0')}`
    const now = new Date().toISOString().split('T')[0]
    addClass({
      id, name: newClassName.trim(), nameBn: newClassNameBn.trim() || newClassName.trim(),
      startTime: institution.startTime, endTime: institution.endTime,
      sections: [], createdAt: now, updatedAt: now,
    })
    setNewClassName(''); setNewClassNameBn(''); setShowAddClass(false)
  }

  const handleAddSection = (classId: string) => {
    const cls = classes.find(c => c.id === classId)
    if (!cls) return
    const secLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nextLetter = secLetters[cls.sections.length] || 'A'
    const id = `SEC-${classId}-${nextLetter}`
    addSection(classId, { id, name: nextLetter, seatQuantity: 40, classTeacherId: '', subjectIds: [] })
  }

  const handleSaveClassTime = (classId: string) => {
    updateClass(classId, classTimeForm)
    setEditingClassTime(null)
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit', flexShrink: 0 }}>
          <ArrowLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'শ্রেণি ব্যবস্থাপনা' : 'Classes Management'}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isBn ? 'প্রতিষ্ঠান সেটিংস এবং শ্রেণি পরিচালনা' : 'Institution settings & class management'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { id: 'institution' as const, icon: Settings, label: isBn ? 'প্রতিষ্ঠান' : 'Institution', color: 'var(--brand)' },
          { id: 'classes' as const, icon: Users, label: isBn ? 'শ্রেণি' : 'Classes', color: 'var(--teal)' },
          { id: 'routine' as const, icon: CalendarDays, label: isBn ? 'রুটিন' : 'Routine', color: 'var(--purple)' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${activeTab === tab.id ? tab.color : 'var(--border)'}`, background: activeTab === tab.id ? `${tab.color}15` : 'var(--bg-secondary)', color: activeTab === tab.id ? tab.color : 'var(--text-secondary)', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            <tab.icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* Institution Tab */}
      {activeTab === 'institution' && (
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} style={{ color: 'var(--brand)' }} />
              {isBn ? 'প্রতিষ্ঠানের তথ্য' : 'Institution Information'}
            </div>
            {!editingInst ? (
              <button onClick={() => { setInstForm({ ...institution }); setEditingInst(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'var(--brand-light)', border: '1px solid var(--brand)', color: 'var(--brand)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Edit2 size={13} />{isBn ? 'এডিট' : 'Edit'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setEditingInst(false)}
                  style={{ padding: '6px 12px', borderRadius: '7px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button onClick={handleSaveInstitution}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saved ? <Check size={13} /> : <Save size={13} />}{saved ? (isBn ? 'সেভ হয়েছে' : 'Saved') : (isBn ? 'সেভ' : 'Save')}
                </button>
              </div>
            )}
          </div>

          {/* View mode */}
          {!editingInst && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={11} />{isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{institution.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{institution.nameBn}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11} />{isBn ? 'ফোন' : 'Phone'}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{institution.phone}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={11} />Email / {isBn?'ওয়েবসাইট':'Website'}</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{institution.email}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{institution.website}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} />{isBn ? 'ঠিকানা' : 'Address'}</div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{institution.address}</div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} />{isBn ? 'সময়সূচি' : 'Schedule'}</div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isBn ? 'শুরু' : 'Start'}:</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-light)', padding: '3px 8px', borderRadius: '5px' }}>{institution.startTime}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isBn ? 'শেষ' : 'End'}:</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-light)', padding: '3px 8px', borderRadius: '5px' }}>{institution.endTime}</span>
                  </div>
                  {(institution.breaks || []).map(brk => (
                    <div key={brk.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{brk.label}:</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--amber)', background: 'var(--amber-light)', padding: '3px 8px', borderRadius: '5px' }}>{brk.start} - {brk.end}</span>
                    </div>
                  ))}
                  {(institution.breaks || []).length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{isBn ? 'কোনো বিরতি নেই' : 'No breaks'}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Edit mode */}
          {editingInst && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={label}>{isBn ? 'প্রতিষ্ঠানের নাম (ইং)' : 'Name (EN)'}</label>
                <input value={instForm.name} onChange={e => setInstForm(p => ({ ...p, name: e.target.value }))} style={input} />
              </div>
              <div>
                <label style={label}>{isBn ? 'প্রতিষ্ঠানের নাম (বাং)' : 'Name (BN)'}</label>
                <input value={instForm.nameBn} onChange={e => setInstForm(p => ({ ...p, nameBn: e.target.value }))} style={input} />
              </div>
              <div>
                <label style={label}>{isBn ? 'ফোন' : 'Phone'}</label>
                <input value={instForm.phone} onChange={e => setInstForm(p => ({ ...p, phone: e.target.value }))} style={input} />
              </div>
              <div>
                <label style={label}>Email</label>
                <input value={instForm.email} onChange={e => setInstForm(p => ({ ...p, email: e.target.value }))} style={input} />
              </div>
              <div>
                <label style={label}>{isBn ? 'ওয়েবসাইট' : 'Website'}</label>
                <input value={instForm.website} onChange={e => setInstForm(p => ({ ...p, website: e.target.value }))} style={input} />
              </div>
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <label style={label}>{isBn ? 'ঠিকানা' : 'Address'}</label>
                <input value={instForm.address} onChange={e => setInstForm(p => ({ ...p, address: e.target.value }))} style={input} />
              </div>
              <div>
                <label style={label}>{isBn ? 'ক্লাস শুরুর সময়' : 'Class Start Time'}</label>
                <input type="time" value={instForm.startTime} onChange={e => setInstForm(p => ({ ...p, startTime: e.target.value }))} style={input} />
              </div>
              <div>
                <label style={label}>{isBn ? 'ক্লাস শেষের সময়' : 'Class End Time'}</label>
                <input type="time" value={instForm.endTime} onChange={e => setInstForm(p => ({ ...p, endTime: e.target.value }))} style={input} />
              </div>
              {/* Dynamic breaks */}
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ ...label, marginBottom: 0 }}>{isBn ? 'বিরতির সময়' : 'Break Times'}</label>
                  <button type="button" onClick={() => setInstForm(p => ({
                    ...p,
                    breaks: [...p.breaks, { id: `BRK-${Date.now()}`, label: `${isBn ? 'বিরতি' : 'Break'} ${p.breaks.length + 1}`, start: '12:00', end: '12:30' }],
                  }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '5px', background: 'var(--green-light)', border: '1px solid var(--green)', color: 'var(--green)', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Plus size={10} />{isBn ? 'বিরতি যোগ' : 'Add Break'}
                  </button>
                </div>
                {instForm.breaks.length === 0 ? (
                  <div style={{ padding: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                    {isBn ? 'কোনো বিরতি সেট করা হয়নি' : 'No breaks configured'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {instForm.breaks.map((brk, i) => (
                      <div key={brk.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <input value={brk.label} onChange={e => {
                          const breaks = [...instForm.breaks]; breaks[i] = { ...brk, label: e.target.value }; setInstForm(p => ({ ...p, breaks }))
                        }}
                          style={{ width: '80px', padding: '4px 6px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '11px', fontFamily: 'inherit' }}
                          placeholder={isBn ? 'নাম' : 'Label'} />
                        <input type="time" value={brk.start} onChange={e => {
                          const breaks = [...instForm.breaks]; breaks[i] = { ...brk, start: e.target.value }; setInstForm(p => ({ ...p, breaks }))
                        }}
                          style={{ padding: '4px 6px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '11px', fontFamily: 'inherit' }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>-</span>
                        <input type="time" value={brk.end} onChange={e => {
                          const breaks = [...instForm.breaks]; breaks[i] = { ...brk, end: e.target.value }; setInstForm(p => ({ ...p, breaks }))
                        }}
                          style={{ padding: '4px 6px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '11px', fontFamily: 'inherit' }} />
                        <button type="button" onClick={() => setInstForm(p => ({ ...p, breaks: p.breaks.filter(b => b.id !== brk.id) }))}
                          style={{ padding: '3px', borderRadius: '4px', background: 'var(--red-light)', border: 'none', cursor: 'pointer', color: 'var(--red)', marginLeft: 'auto' }}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {classes.length} {isBn ? 'টি শ্রেণি' : 'classes'} · {classes.reduce((s, c) => s + c.sections.length, 0)} {isBn ? 'টি সেকশন' : 'sections'}
            </div>
            <button onClick={() => setShowAddClass(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={14} />{isBn ? 'নতুন শ্রেণি' : 'Add Class'}
            </button>
          </div>

          {/* Add class form */}
          {showAddClass && (
            <div style={{ ...section, borderColor: 'var(--brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand)' }}>{isBn ? 'নতুন শ্রেণি যোগ' : 'Add New Class'}</div>
                <button onClick={() => setShowAddClass(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                <div>
                  <label style={label}>{isBn ? 'শ্রেণির নাম (ইং)' : 'Class Name (EN)'}</label>
                  <input value={newClassName} onChange={e => setNewClassName(e.target.value)} style={input} placeholder="Class 11" />
                </div>
                <div>
                  <label style={label}>{isBn ? 'শ্রেণির নাম (বাং)' : 'Class Name (BN)'}</label>
                  <input value={newClassNameBn} onChange={e => setNewClassNameBn(e.target.value)} style={input} placeholder="শ্রেণি ১১" />
                </div>
                <button onClick={handleAddClass}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {isBn ? 'যোগ করুন' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* Class cards */}
          {classes.map(cls => {
            const isExpanded = expandedClass === cls.id
            const totalSeats = cls.sections.reduce((s, sec) => s + sec.seatQuantity, 0)
            return (
              <div key={cls.id} style={{ ...section, marginBottom: '10px' }}>
                {/* Class header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  onClick={() => setExpandedClass(isExpanded ? null : cls.id)}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)' }}>{cls.id.replace('CLS-', '')}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? cls.nameBn : cls.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span>{cls.sections.length} {isBn ? 'সেকশন' : 'sections'}</span>
                      <span>{totalSeats} {isBn ? 'আসন' : 'seats'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} />{cls.startTime} - {cls.endTime}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setEditingClassTime(cls.id); setClassTimeForm({ startTime: cls.startTime, endTime: cls.endTime }) }}
                    style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                    <Clock size={11} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if(confirm(isBn ? 'এই শ্রেণি মুছে ফেলতে চান?' : 'Delete this class?')) deleteClass(cls.id) }}
                    style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--red-light)', border: '1px solid var(--red)', cursor: 'pointer', fontSize: '10px', color: 'var(--red)', fontFamily: 'inherit' }}>
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Edit class time */}
                {editingClassTime === cls.id && (
                  <div style={{ marginTop: '10px', padding: '14px', background: 'var(--bg-primary)', border: '1px solid var(--brand)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} />{isBn ? 'ক্লাস সময় পরিবর্তন' : 'Change Class Time'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>{isBn ? 'শুরুর সময়' : 'Start Time'}</label>
                        <input type="time" value={classTimeForm.startTime} onChange={e => setClassTimeForm(p => ({ ...p, startTime: e.target.value }))}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>{isBn ? 'শেষের সময়' : 'End Time'}</label>
                        <input type="time" value={classTimeForm.endTime} onChange={e => setClassTimeForm(p => ({ ...p, endTime: e.target.value }))}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleSaveClassTime(cls.id)}
                          style={{ padding: '8px 16px', borderRadius: '7px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Save size={12} />{isBn ? 'সেভ' : 'Save'}
                        </button>
                        <button onClick={() => setEditingClassTime(null)}
                          style={{ padding: '8px 12px', borderRadius: '7px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {isBn ? 'বাতিল' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sections */}
                {isExpanded && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isBn ? 'সেকশন সমূহ' : 'Sections'}
                      </div>
                      <button onClick={() => handleAddSection(cls.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', background: 'var(--teal-light)', border: '1px solid var(--teal)', color: 'var(--teal)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Plus size={12} />{isBn ? 'সেকশন যোগ' : 'Add Section'}
                      </button>
                    </div>

                    {cls.sections.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {isBn ? 'কোনো সেকশন নেই' : 'No sections yet'}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                        {cls.sections.map(sec => {
                          const teacher = sec.classTeacherId ? getTeacher(sec.classTeacherId) : null
                          const isEditing = editingSection === sec.id
                          return (
                            <div key={sec.id} style={{ borderRadius: '10px', border: `1px solid ${isEditing ? 'var(--brand)' : 'var(--border)'}`, background: isEditing ? 'var(--bg-primary)' : 'var(--bg-secondary)', overflow: 'hidden', transition: 'all 0.2s' }}>
                              {/* Compact header — always visible */}
                              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                onClick={() => {
                                  if (isEditing) { setEditingSection(null); return }
                                  setEditingSection(sec.id)
                                  setSecForm({ name: sec.name, seatQuantity: sec.seatQuantity, classTeacherId: sec.classTeacherId })
                                }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isEditing ? 'var(--brand)' : 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                  <span style={{ color: isEditing ? '#fff' : 'var(--brand)', fontSize: '11px', fontWeight: 700 }}>{cls.id.replace('CLS-', '')}{sec.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {isBn ? 'সেকশন' : 'Section'} {sec.name}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {(() => {
                                      const count = getStudentCount(cls.id.replace('CLS-', '').replace(/^0/, ''), sec.name)
                                      const available = sec.seatQuantity - count
                                      const isFull = available <= 0
                                      return (
                                        <>
                                          <span style={{ color: isFull ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{count}/{sec.seatQuantity}</span>
                                          <span style={{ color: isFull ? 'var(--red)' : 'var(--text-muted)' }}>
                                            {isBn ? (isFull ? 'ফুল' : `${available} আসন বাকি`) : (isFull ? 'Full' : `${available} seats left`)}
                                          </span>
                                        </>
                                      )
                                    })()}
                                    {teacher && <span style={{ color: 'var(--brand)' }}>{teacher.nameEn.split(' ')[0]}</span>}
                                    {sec.subjectIds && sec.subjectIds.length > 0 && (
                                      <span style={{ color: 'var(--teal)', fontWeight: 500 }}>
                                        {sec.subjectIds.length} {isBn ? 'বিষয়' : 'subjects'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                  <button onClick={(e) => { e.stopPropagation(); deleteSection(cls.id, sec.id) }}
                                    style={{ padding: '4px', borderRadius: '5px', background: 'var(--red-light)', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded edit form */}
                              {isEditing && (
                                <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                                  <div style={{ paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <div>
                                      <label style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>{isBn ? 'সেকশন নাম' : 'Section Name'}</label>
                                      <input value={secForm.name}
                                        onChange={e => setSecForm(p => ({ ...p, name: e.target.value }))}
                                        style={{ width: '100%', padding: '7px 9px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', fontWeight: 500, textTransform: 'capitalize' }}
                                        placeholder={isBn ? 'যেমন: বিজ্ঞান, মানবিক' : 'e.g. Science, Humanity'} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>{isBn ? 'আসন সংখ্যা' : 'Seat Quantity'}</label>
                                      <input type="number" value={secForm.seatQuantity} min={1}
                                        onChange={e => setSecForm(p => ({ ...p, seatQuantity: Number(e.target.value) || 1 }))}
                                        style={{ width: '100%', padding: '7px 9px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', textAlign: 'center' }} />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>{isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</label>
                                      <select value={secForm.classTeacherId} onChange={e => setSecForm(p => ({ ...p, classTeacherId: e.target.value }))}
                                        style={{ width: '100%', padding: '7px 9px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '11px', fontFamily: 'inherit' }}>
                                        <option value="">{isBn ? 'নির্বাচন করুন' : 'Select'}</option>
                                        {teachers.filter(t => t.status === 'active').map(t => (
                                          <option key={t.id} value={t.id}>{t.nameEn} ({t.id})</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Teacher preview */}
                                  {(() => {
                                    const t = secForm.classTeacherId ? getTeacher(secForm.classTeacherId) : teacher
                                    if (!t) return null
                                    return (
                                      <div style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {t.photo ? <img src={t.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>}
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameEn}</div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t.designation || ''}</div>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                            <Phone size={9} style={{ color: 'var(--text-muted)' }} />
                                            <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{institution.phone}</span>
                                          </div>
                                        </div>
                                        {t.signature && (
                                          <div style={{ marginTop: '6px', padding: '4px 6px', borderRadius: '5px', background: 'var(--bg-primary)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Signature size={10} style={{ color: 'var(--text-muted)' }} />
                                            <img src={t.signature} alt="Sig" style={{ height: '16px', objectFit: 'contain' }} />
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}

                                  {/* Assigned subjects */}
                                  {sec.subjectIds && sec.subjectIds.length > 0 && (
                                    <div style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', background: 'var(--teal-light)', border: '1px solid var(--teal-border)' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--teal)', marginBottom: '6px' }}>{isBn ? 'নির্ধারিত বিষয়সমূহ' : 'Assigned Subjects'}</div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {sec.subjectIds.map(sid => {
                                          const sub = subjects.find(s => s.id === sid)
                                          if (!sub) return null
                                          return (
                                            <span key={sid} style={{ padding: '3px 8px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '10px', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              {isBn ? sub.nameBn : sub.name}
                                              <button onClick={() => {
                                                const updated = sec.subjectIds.filter(s => s !== sid)
                                                updateSection(cls.id, sec.id, { subjectIds: updated })
                                                setSecForm(p => ({ ...p, subjectIds: updated }))
                                              }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                                <X size={10} />
                                              </button>
                                            </span>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                                    <button onClick={() => { setTempSelectedSubjects(sec.subjectIds || []); setShowSubjectModal({ classId: cls.id, sectionId: sec.id }) }}
                                      style={{ flex: 1, padding: '7px', borderRadius: '7px', background: 'var(--teal)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                      <BookOpen size={11} />{isBn ? 'বিষয় যোগ করুন' : 'Add Subject'}
                                    </button>
                                  </div>

                                  {/* Save button */}
                                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                                    <button onClick={() => { updateSection(cls.id, sec.id, { name: secForm.name || sec.name, seatQuantity: secForm.seatQuantity, classTeacherId: secForm.classTeacherId }); setEditingSection(null) }}
                                      style={{ flex: 1, padding: '7px', borderRadius: '7px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                      <Save size={11} />{isBn ? 'সেভ' : 'Save'}
                                    </button>
                                    <button onClick={() => setEditingSection(null)}
                                      style={{ padding: '7px 12px', borderRadius: '7px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                      {isBn ? 'বাতিল' : 'Cancel'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* Routine Tab */}
      {activeTab === 'routine' && (
        <RoutineTab classes={classes} routines={routines} teachers={teachers} subjects={subjects} institution={institution} updateRoutine={updateRoutine} setRoutineSlot={setRoutineSlot} clearRoutineSlot={clearRoutineSlot} isBn={isBn} isMobile={isMobile} />
      )}

      {/* Subject Selection Modal */}
      {showSubjectModal && (
        <div onClick={() => setShowSubjectModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subjects'}</h3>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{isBn ? 'শিক্ষক ব্যবস্থাপনা থেকে বিষয় নির্বাচন করুন' : 'Select subjects from Teacher Management'}</p>
              </div>
              <button onClick={() => setShowSubjectModal(null)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1 }}>
              {subjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {isBn ? 'কোনো বিষয় পাওয়া যায়নি। প্রথমে শিক্ষক ব্যবস্থাপনায় বিষয় যোগ করুন।' : 'No subjects found. Add subjects in Teacher Management first.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {subjects.map(sub => {
                    const isSelected = tempSelectedSubjects.includes(sub.id)
                    return (
                      <button key={sub.id}
                        onClick={() => setTempSelectedSubjects(prev => isSelected ? prev.filter(s => s !== sub.id) : [...prev, sub.id])}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`, background: isSelected ? 'var(--teal-light)' : 'var(--bg-secondary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`, background: isSelected ? 'var(--teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {isSelected && <Check size={11} style={{ color: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {isBn ? sub.nameBn : sub.name}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowSubjectModal(null)}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={() => {
                if (showSubjectModal) {
                  updateSection(showSubjectModal.classId, showSubjectModal.sectionId, { subjectIds: tempSelectedSubjects })
                }
                setShowSubjectModal(null)
              }}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--teal)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? 'সেভ করুন' : 'Save'} ({tempSelectedSubjects.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAYS_BN = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার']

function RoutineTab({ classes, routines, teachers, subjects, institution, updateRoutine, setRoutineSlot, clearRoutineSlot, isBn, isMobile }: {
  classes: any[]
  routines: any[]
  teachers: any[]
  subjects: any[]
  institution: any
  updateRoutine: (classId: string, data: any) => void
  setRoutineSlot: (classId: string, day: number, period: number, slot: any) => void
  clearRoutineSlot: (classId: string, day: number, period: number, sectionId?: string) => void
  isBn: boolean
  isMobile: boolean
}) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '')
  const [selectedSection, setSelectedSection] = useState('')
  const [editSlot, setEditSlot] = useState<{ day: number; period: number } | null>(null)
  const [slotForm, setSlotForm] = useState({ subjectId: '', teacherId: '' })

  const cls = classes.find(c => c.id === selectedClass)
  const sections = cls?.sections || []
  const effectiveSection = selectedSection || sections[0]?.id || ''
  const routine = routines.find(r => r.classId === selectedClass && r.sectionId === effectiveSection)
  const periodDuration = routine?.periodDuration || 40
  const weekendDays = routine?.weekendDays || [5]
  const periods = routine?.periods || []

  const startTime = cls?.startTime || institution.startTime || '07:30'

  const activeDays = useMemo(() => DAYS.map((d, i) => ({ name: d, nameBn: DAYS_BN[i], index: i })).filter(d => !weekendDays.includes(d.index)), [weekendDays])

  const getPeriodTime = (periodIndex: number) => {
    const [h, m] = startTime.split(':').map(Number)
    const startMin = h * 60 + m + periodIndex * periodDuration
    const endMin = startMin + periodDuration
    const pad = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
    return { start: pad(startMin), end: pad(endMin) }
  }

  const totalPeriods = useMemo(() => {
    const [sh, sm] = (cls?.startTime || institution.startTime || '07:30').split(':').map(Number)
    const [eh, em] = (cls?.endTime || institution.endTime || '14:30').split(':').map(Number)
    const totalMin = (eh * 60 + em) - (sh * 60 + sm)
    return Math.floor(totalMin / periodDuration) || 7
  }, [cls, institution, periodDuration])

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.nameEn || id

  const handleSaveSlot = () => {
    if (editSlot && slotForm.subjectId) {
      setRoutineSlot(selectedClass, editSlot.day, editSlot.period, { ...slotForm, sectionId: effectiveSection })
    }
    setEditSlot(null)
    setSlotForm({ subjectId: '', teacherId: '' })
  }

  const handlePeriodDurationChange = (val: number) => {
    updateRoutine(selectedClass, { sectionId: effectiveSection, periodDuration: val })
  }

  const toggleWeekend = (dayIndex: number) => {
    const newWeekends = weekendDays.includes(dayIndex)
      ? weekendDays.filter((d: number) => d !== dayIndex)
      : [...weekendDays, dayIndex]
    updateRoutine(selectedClass, { sectionId: effectiveSection, weekendDays: newWeekends })
  }

  return (
    <div>
      {/* Class + Section selector + Period config */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            {isBn ? 'শ্রেণি নির্বাচন' : 'Select Class'}
          </div>
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); setEditSlot(null) }}
            style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit' }}>
            {classes.map(c => <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.name}</option>)}
          </select>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            {isBn ? 'সেকশন' : 'Section'}
          </div>
          <select value={effectiveSection} onChange={e => { setSelectedSection(e.target.value); setEditSlot(null) }}
            style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit' }}>
            {sections.length === 0 && <option value="">{isBn ? 'কোনো সেকশন নেই' : 'No sections'}</option>}
            {sections.map((s: any) => <option key={s.id} value={s.id}>{isBn ? 'সেকশন' : 'Section'} {s.name}</option>)}
          </select>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            {isBn ? 'পিরিয়ড সময়কাল' : 'Period Duration'}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[30, 35, 40, 45, 50, 60].map(d => (
              <button key={d} onClick={() => handlePeriodDurationChange(d)}
                style={{ flex: 1, padding: '8px', borderRadius: '7px', border: `1px solid ${periodDuration === d ? 'var(--purple)' : 'var(--border)'}`, background: periodDuration === d ? 'var(--purple-light)' : 'var(--bg-secondary)', color: periodDuration === d ? 'var(--purple)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: periodDuration === d ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                {d}m
              </button>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {isBn ? `প্রতি পিরিয়ড ${periodDuration} মিনিট · ${totalPeriods} পিরিয়ড/দিন` : `Each period ${periodDuration} min · ${totalPeriods} periods/day`}
          </div>
        </div>
      </div>

      {/* Download button */}
      {periods.some((day: any) => day?.some((slot: any) => slot?.subjectId)) && (
        <div style={{ marginBottom: '14px' }}>
          <button onClick={() => {
            const clsObj = classes.find(c => c.id === selectedClass)
            const secObj = clsObj?.sections.find((s: any) => s.id === effectiveSection)
            const secName = secObj?.name || ''

            const gridRows = activeDays.map(d => {
              const cells = Array.from({ length: totalPeriods }, (_, p) => {
                const slot = periods[d.index]?.[p]
                const time = getPeriodTime(p)
                if (slot?.subjectId) {
                  return `<td style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;vertical-align:middle">
                    <div style="font-size:9px;color:#8b5cf6;font-weight:600;margin-bottom:3px">P${p+1} · ${time.start}</div>
                    <div style="font-size:11px;font-weight:600;color:#1a1a1a;margin-bottom:2px">${getSubjectName(slot.subjectId)}</div>
                    <div style="font-size:9px;color:#6b7280">${getTeacherName(slot.teacherId)}</div>
                  </td>`
                }
                return `<td style="padding:10px 8px;border:1px solid #e5e7eb;text-align:center;vertical-align:middle"><span style="font-size:10px;color:#d1d5db">—</span></td>`
              }).join('')
              return `<tr>
                <td style="padding:10px 14px;font-weight:600;font-size:12px;text-align:center;white-space:nowrap;border:1px solid #e5e7eb;background:#f9fafb">${isBn ? d.nameBn : d.name}</td>
                ${cells}
              </tr>`
            }).join('')

            const headerCells = Array.from({ length: totalPeriods }, (_, p) => {
              const time = getPeriodTime(p)
              return `<th style="padding:8px 6px;font-size:10px;font-weight:600;text-align:center;border:1px solid #e5e7eb;background:#f3f4f6">P${p+1}<br/><span style="font-weight:400;color:#6b7280">${time.start}</span></th>`
            }).join('')

            const win = window.open('','_blank')
            if (!win) return
            win.document.write(`<!DOCTYPE html><html><head><title>Routine - ${clsObj?.name} ${secName}</title>
<style>
  @page{size:A4 landscape;margin:8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI','Arial',sans-serif;color:#1a1a1a;background:#fff;padding:20px}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #6366f1">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">ET</div>
      <div>
        <div style="font-size:16px;font-weight:700;color:#6366f1">EduTech School Management</div>
        <div style="font-size:10px;color:#6b7280">${institution?.address || ''}</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;font-weight:600;color:#1a1a1a">${clsObj?.name || ''} — ${isBn ? 'সেকশন' : 'Section'} ${secName}</div>
      <div style="font-size:10px;color:#6b7280">${isBn ? 'প্রতি পিরিয়ড' : 'Period'}: ${periodDuration} ${isBn ? 'মিনিট' : 'min'} · Generated: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb">
    <thead><tr><th style="padding:8px 12px;font-size:10px;font-weight:600;text-align:center;border:1px solid #e5e7eb;background:#f3f4f6;min-width:80px">${isBn ? 'দিন' : 'Day'}</th>${headerCells}</tr></thead>
    <tbody>${gridRows}</tbody>
  </table>
  <div style="margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between">
    <div style="font-size:9px;color:#9ca3af">EduTech School Management System</div>
    <div style="font-size:9px;color:#9ca3af">${isBn ? 'মুদ্রণের তারিখ' : 'Printed'}: ${new Date().toLocaleDateString()}</div>
  </div>
</body></html>`)
            win.document.close()
            setTimeout(() => win.print(), 600)
          }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            <Download size={15} />{isBn ? 'রুটিন ডাউনলোড' : 'Download Routine'}
          </button>
        </div>
      )}

      {/* Edit slot modal */}
      {editSlot && (
        <div style={{ background: 'var(--bg-primary)', border: '2px solid var(--purple)', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 8px 24px rgba(139,92,246,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} style={{ color: 'var(--purple)' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isBn ? DAYS_BN[editSlot.day] : DAYS[editSlot.day]}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {isBn ? 'পিরিয়ড' : 'Period'} {editSlot.period + 1} · {getPeriodTime(editSlot.period).start} - {getPeriodTime(editSlot.period).end}
                </div>
              </div>
            </div>
            <button onClick={() => setEditSlot(null)}
              style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BookOpen size={12} style={{ color: 'var(--purple)' }} />{isBn ? 'বিষয় নির্বাচন' : 'Select Subject'}
              </label>
              <select value={slotForm.subjectId} onChange={e => setSlotForm(p => ({ ...p, subjectId: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                <option value="">{isBn ? 'বিষয় বাছুন' : 'Choose subject'}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={12} style={{ color: 'var(--purple)' }} />{isBn ? 'শিক্ষক নির্বাচন' : 'Select Teacher'}
              </label>
              <select value={slotForm.teacherId} onChange={e => setSlotForm(p => ({ ...p, teacherId: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                <option value="">{isBn ? 'শিক্ষক বাছুন' : 'Choose teacher'}</option>
                {(() => {
                  const active = teachers.filter(t => t.status === 'active')
                  if (!slotForm.subjectId) return active.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)
                  const related = active.filter(t => t.subjectIds.includes(slotForm.subjectId))
                  const others = active.filter(t => !t.subjectIds.includes(slotForm.subjectId))
                  return [
                    related.length > 0 && <optgroup key="related" label={isBn ? '★ বিষয় সম্পর্কিত' : '★ Subject Related'}>
                      {related.map(t => <option key={t.id} value={t.id}>{t.nameEn} — {t.designation || ''}</option>)}
                    </optgroup>,
                    others.length > 0 && <optgroup key="others" label={isBn ? 'অন্যান্য' : 'Others'}>
                      {others.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                    </optgroup>
                  ]
                })()}
              </select>
            </div>
          </div>

          {/* Preview */}
          {slotForm.subjectId && slotForm.teacherId && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'var(--purple-light)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--purple)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)' }}>{getSubjectName(slotForm.subjectId)}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{getTeacherName(slotForm.teacherId)}</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { clearRoutineSlot(selectedClass, editSlot.day, editSlot.period, effectiveSection); setEditSlot(null) }}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              {isBn ? 'মুছুন' : 'Clear'}
            </button>
            <button onClick={handleSaveSlot} disabled={!slotForm.subjectId}
              style={{ padding: '8px 20px', borderRadius: '8px', background: slotForm.subjectId ? 'var(--purple)' : 'var(--border-2)', border: 'none', color: slotForm.subjectId ? '#fff' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: slotForm.subjectId ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Save size={13} />{isBn ? 'সেভ করুন' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Routine grid */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            {isBn ? 'সাপ্তাহিক ছুটি দিন' : 'Weekend Days'}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {DAYS.map((d, i) => {
              const isWeekend = weekendDays.includes(i)
              return (
                <button key={d} onClick={() => toggleWeekend(i)}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${isWeekend ? 'var(--red)' : 'var(--border)'}`, background: isWeekend ? 'var(--red-light)' : 'var(--bg-primary)', color: isWeekend ? 'var(--red)' : 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: isWeekend ? 600 : 400, transition: 'all 0.15s' }}>
                  {isBn ? DAYS_BN[i] : d}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 8px', width: '80px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                  {isBn ? 'সময়' : 'Time'}
                </th>
                {activeDays.map(d => (
                  <th key={d.index} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '120px' }}>
                    {isBn ? d.nameBn : d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalPeriods }, (_, p) => {
                const time = getPeriodTime(p)
                return (
                  <tr key={p} style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td style={{ padding: '8px', fontSize: '10px', color: 'var(--text-muted)', position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>P{p + 1}</div>
                      <div>{time.start}</div>
                      <div>{time.end}</div>
                    </td>
                    {activeDays.map(d => {
                      const slot = periods[d.index]?.[p]
                      const hasSubject = slot?.subjectId
                      return (
                        <td key={d.index} style={{ padding: '4px', textAlign: 'center', verticalAlign: 'top' }}>
                          <button onClick={() => { setEditSlot({ day: d.index, period: p }); setSlotForm({ subjectId: slot?.subjectId || '', teacherId: slot?.teacherId || '' }) }}
                            style={{ width: '100%', minHeight: '48px', padding: '6px', borderRadius: '6px', border: `1px solid ${hasSubject ? 'var(--purple)' : 'var(--border)'}`, background: hasSubject ? 'var(--purple-light)' : 'var(--bg-secondary)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.transform = 'scale(1.02)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = hasSubject ? 'var(--purple)' : 'var(--border)'; e.currentTarget.style.transform = 'scale(1)' }}>
                            {hasSubject ? (
                              <>
                                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--purple)', lineHeight: 1.2 }}>
                                  {getSubjectName(slot.subjectId)}
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                                  {getTeacherName(slot.teacherId)}
                                </div>
                              </>
                            ) : (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+</span>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
