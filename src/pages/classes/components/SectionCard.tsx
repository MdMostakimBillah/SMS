import { Trash2, Save, Copy, BookOpen, X } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import type { ClassInfo, ClassSection, InstitutionSettings } from '@/store/classStore'
import type { Teacher, Subject } from '@/pages/teachers/types'
import { TeacherPreviewCard } from './TeacherPreviewCard'

interface SectionCardProps {
  cls: ClassInfo
  sec: ClassSection
  isEditing: boolean
  isBn: boolean
  getTeacher: (id: string) => Teacher | undefined
  getStudentCount: (classNum: string, sectionName: string) => number
  subjectMap: Map<string, Subject>
  teachers: Teacher[]
  institution: InstitutionSettings
  setEditingSection: React.Dispatch<React.SetStateAction<string | null>>
  secForm: { name: string; seatQuantity: number; classTeacherId: string }
  setSecForm: React.Dispatch<React.SetStateAction<{ name: string; seatQuantity: number; classTeacherId: string }>>
  updateSection: (classId: string, sectionId: string, data: Partial<ClassSection>) => void
  deleteSection: (classId: string, sectionId: string) => void
  setCopySectionModal: (v: { fromClassId: string; fromSectionId: string }) => void
  setCopyTarget: (v: { classId: string; sectionId: string }) => void
  setTempSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>
  setShowSubjectModal: React.Dispatch<React.SetStateAction<{ classId: string; sectionId: string } | null>>
}

export function SectionCard({
  cls,
  sec,
  isEditing,
  isBn,
  getTeacher,
  getStudentCount,
  subjectMap,
  teachers,
  institution,
  setEditingSection,
  secForm,
  setSecForm,
  updateSection,
  deleteSection,
  setCopySectionModal,
  setCopyTarget,
  setTempSelectedSubjects,
  setShowSubjectModal,
}: SectionCardProps) {
  const { canDelete } = usePermission()
  const teacher = sec.classTeacherId ? getTeacher(sec.classTeacherId) : undefined

  return (
    <div
      style={{
        borderRadius: '0.625rem',
        border: `1px solid ${isEditing ? 'var(--brand)' : 'var(--border)'}`,
        background: isEditing ? 'var(--bg-primary)' : 'var(--bg-secondary)',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {/* Compact header — always visible */}
      <div
        style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}
        onClick={() => {
          if (isEditing) {
            setEditingSection(null)
            return
          }
          setEditingSection(sec.id)
          setSecForm({ name: sec.name, seatQuantity: sec.seatQuantity, classTeacherId: sec.classTeacherId })
        }}
      >
        <div
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '0.5rem',
            background: isEditing ? 'var(--brand)' : 'var(--brand-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ color: isEditing ? '#fff' : 'var(--brand)', fontSize: '0.6875rem', fontWeight: 700 }}>
            {cls.id.replace('CLS-', '')}
            {sec.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'সেকশন' : 'Section'} {sec.name}
          </div>
          <div
            style={{
              fontSize: '0.625rem',
              color: 'var(--text-muted)',
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {(() => {
              const count = getStudentCount(cls.id.replace('CLS-', '').replace(/^0/, ''), sec.name)
              const available = sec.seatQuantity - count
              const isFull = available <= 0
              return (
                <>
                  <span style={{ color: isFull ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                    {count}/{sec.seatQuantity}
                  </span>
                  <span style={{ color: isFull ? 'var(--red)' : 'var(--text-muted)' }}>
                    {isBn
                      ? isFull
                        ? 'ফুল'
                        : `${available} আসন বাকি`
                      : isFull
                        ? 'Full'
                        : `${available} seats left`}
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
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCopySectionModal({ fromClassId: cls.id, fromSectionId: sec.id })
              setCopyTarget({ classId: '', sectionId: '' })
            }}
            style={{
              padding: '0.25rem',
              borderRadius: '0.3125rem',
              background: 'var(--brand-light)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--brand)',
            }}
            title={isBn ? 'সেকশন কপি করুন' : 'Copy Section'}
          >
            <Copy size={11} />
          </button>
          {canDelete('classes.classes') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteSection(cls.id, sec.id)
              }}
              style={{
                padding: '0.25rem',
                borderRadius: '0.3125rem',
                background: 'var(--red-light)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--red)',
              }}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded edit form */}
      {isEditing && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
          <div style={{ paddingTop: '0.625rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{isBn ? 'সেকশন নাম' : 'Section Name'}</label>
              <input value={secForm.name} onChange={(e) => setSecForm((p) => ({ ...p, name: e.target.value }))}
                style={{ width: '100%', padding: '7px 9px', borderRadius: '0.4375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.75rem', fontFamily: 'inherit', fontWeight: 500, textTransform: 'capitalize' }}
                placeholder={isBn ? 'যেমন: বিজ্ঞান, মানবিক' : 'e.g. Science, Humanity'} />
            </div>
            <div>
              <label style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{isBn ? 'আসন সংখ্যা' : 'Seat Quantity'}</label>
              <input type="number" value={secForm.seatQuantity} min={1} onChange={(e) => setSecForm((p) => ({ ...p, seatQuantity: Number(e.target.value) || 1 }))}
                style={{ width: '100%', padding: '7px 9px', borderRadius: '0.4375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.75rem', fontFamily: 'inherit', textAlign: 'center' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</label>
              <select value={secForm.classTeacherId} onChange={(e) => setSecForm((p) => ({ ...p, classTeacherId: e.target.value }))}
                style={{ width: '100%', padding: '7px 9px', borderRadius: '0.4375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.6875rem', fontFamily: 'inherit' }}>
                <option value="">{isBn ? 'নির্বাচন করুন' : 'Select'}</option>
                {teachers.filter((t) => t.status === 'active').map((t) => (
                  <option key={t.id} value={t.id}>{t.nameEn} ({t.id})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher preview */}
          {(() => {
            const t = secForm.classTeacherId ? getTeacher(secForm.classTeacherId) : teacher
            if (!t) return null
            return <TeacherPreviewCard teacher={t} institution={institution} />
          })()}

          {/* Assigned subjects */}
          {sec.subjectIds && sec.subjectIds.length > 0 && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--teal-light)', border: '1px solid var(--teal-border)' }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--teal)', marginBottom: '0.375rem' }}>
                {isBn ? 'নির্ধারিত বিষয়সমূহ' : 'Assigned Subjects'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {sec.subjectIds.map((sid: string) => {
                  const sub = subjectMap.get(sid)
                  if (!sub) return null
                  return (
                    <span key={sid} style={{ padding: '3px 8px', borderRadius: '0.625rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {isBn ? sub.nameBn : sub.name}
                      <button
                        onClick={() => {
                          const updated = sec.subjectIds.filter((s) => s !== sid)
                          updateSection(cls.id, sec.id, { subjectIds: updated })
                          setSecForm((p) => ({ ...p, subjectIds: updated }))
                        }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={() => {
                setTempSelectedSubjects(sec.subjectIds || [])
                setShowSubjectModal({ classId: cls.id, sectionId: sec.id })
              }}
              style={{ flex: 1, padding: '0.4375rem', borderRadius: '0.4375rem', background: 'var(--teal)', border: 'none', color: '#fff', fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
            >
              <BookOpen size={11} />
              {isBn ? 'বিষয় যোগ করুন' : 'Add Subject'}
            </button>
          </div>

          {/* Save button */}
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={() => {
                updateSection(cls.id, sec.id, { name: secForm.name || sec.name, seatQuantity: secForm.seatQuantity, classTeacherId: secForm.classTeacherId })
                setEditingSection(null)
              }}
              style={{ flex: 1, padding: '0.4375rem', borderRadius: '0.4375rem', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
            >
              <Save size={11} />
              {isBn ? 'সেভ' : 'Save'}
            </button>
            <button
              onClick={() => setEditingSection(null)}
              style={{ padding: '7px 12px', borderRadius: '0.4375rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
