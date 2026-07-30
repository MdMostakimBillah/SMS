import React from 'react'
import { Clock, Trash2, Save, Check, Plus, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react'
import type { ClassInfo, ClassSection, InstitutionSettings } from '@/store/classStore'
import type { Teacher, Subject } from '@/pages/teachers/types'
import { inputClass } from '../constants'
import { ClassTimeEditForm } from './ClassTimeEditForm'
import { SectionCard } from './SectionCard'

interface ClassCardProps {
  cls: ClassInfo
  isExpanded: boolean
  bulkMode: boolean
  isSelected: boolean
  isBn: boolean
  isMobile: boolean
  editingClassName: string | null
  setEditingClassName: React.Dispatch<React.SetStateAction<string | null>>
  classNameForm: { name: string; nameBn: string }
  setClassNameForm: React.Dispatch<React.SetStateAction<{ name: string; nameBn: string }>>
  editingClassTime: string | null
  setEditingClassTime: React.Dispatch<React.SetStateAction<string | null>>
  classTimeForm: { startTime: string; endTime: string }
  setClassTimeForm: React.Dispatch<React.SetStateAction<{ startTime: string; endTime: string }>>
  editingSection: string | null
  setEditingSection: React.Dispatch<React.SetStateAction<string | null>>
  secForm: { name: string; seatQuantity: number; classTeacherId: string }
  setSecForm: React.Dispatch<React.SetStateAction<{ name: string; seatQuantity: number; classTeacherId: string }>>
  handleSaveClassName: (classId: string) => void
  handleSaveClassTime: (classId: string) => void
  handleAddSection: (classId: string) => void
  deleteClass: (id: string) => void
  toggleSelectClass: (classId: string) => void
  setExpandedClass: React.Dispatch<React.SetStateAction<string | null>>
  teachers: Teacher[]
  institution: InstitutionSettings
  getTeacher: (id: string) => Teacher | undefined
  getStudentCount: (classNum: string, sectionName: string) => number
  subjectMap: Map<string, Subject>
  updateSection: (classId: string, sectionId: string, data: Partial<ClassSection>) => void
  deleteSection: (classId: string, sectionId: string) => void
  setCopySectionModal: (v: { fromClassId: string; fromSectionId: string }) => void
  setCopyTarget: (v: { classId: string; sectionId: string }) => void
  setTempSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>
  setShowSubjectModal: React.Dispatch<React.SetStateAction<{ classId: string; sectionId: string } | null>>
}

export const ClassCard = React.memo(function ClassCard({
  cls,
  isExpanded,
  bulkMode,
  isSelected,
  isBn,
  isMobile,
  editingClassName,
  setEditingClassName,
  classNameForm,
  setClassNameForm,
  editingClassTime,
  setEditingClassTime,
  classTimeForm,
  setClassTimeForm,
  editingSection,
  setEditingSection,
  secForm,
  setSecForm,
  handleSaveClassName,
  handleSaveClassTime,
  handleAddSection,
  deleteClass,
  toggleSelectClass,
  setExpandedClass,
  teachers,
  institution,
  getTeacher,
  getStudentCount,
  subjectMap,
  updateSection,
  deleteSection,
  setCopySectionModal,
  setCopyTarget,
  setTempSelectedSubjects,
  setShowSubjectModal,
}: ClassCardProps) {
  const totalSeats = cls.sections.reduce((s, sec) => s + sec.seatQuantity, 0)

  return (
    <div
      className={`mb-[0.625rem] rounded-[0.625rem] border bg-[var(--bg-primary)] p-[0.75rem] transition-all duration-150 ${bulkMode && isSelected ? 'border-[var(--brand)]' : 'border-[var(--border)]'}`}
    >
      {/* Class header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}
        onClick={() => {
          if (bulkMode) {
            toggleSelectClass(cls.id)
          } else {
            setExpandedClass(isExpanded ? null : cls.id)
          }
        }}
      >
        {bulkMode && (
          <div
            className={`w-[1.125rem] h-[1.125rem] rounded-[0.25rem] border-[0.0938rem] flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${isSelected ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border)] hover:border-[var(--brand)]'}`}
            onClick={(e) => { e.stopPropagation(); toggleSelectClass(cls.id) }}
          >
            {isSelected && <Check size={10} className="text-white" />}
          </div>
        )}
        <div style={{
          width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
          background: 'var(--brand-light)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand)' }}>{cls.id.replace('CLS-', '')}</span>
        </div>
        <div style={{ flex: 1 }}>
          {editingClassName === cls.id ? (
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
              <input
                value={classNameForm.name}
                onChange={(e) => setClassNameForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
                style={{ fontSize: '0.8125rem', padding: '0.4375rem 0.6875rem', flex: 1 }}
                placeholder="Class Name"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveClassName(cls.id); if (e.key === 'Escape') setEditingClassName(null) }}
              />
              <input
                value={classNameForm.nameBn}
                onChange={(e) => setClassNameForm((p) => ({ ...p, nameBn: e.target.value }))}
                className={inputClass}
                style={{ fontSize: '0.8125rem', padding: '0.4375rem 0.6875rem', flex: 1 }}
                placeholder="নাম (বাং)"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveClassName(cls.id); if (e.key === 'Escape') setEditingClassName(null) }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleSaveClassName(cls.id) }}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--brand)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'inherit', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}
              >
                <Save size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingClassName(null) }}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8125rem', fontFamily: 'inherit', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {isBn ? cls.nameBn : cls.name}
              {!bulkMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingClassName(cls.id); setClassNameForm({ name: cls.name, nameBn: cls.nameBn }) }}
                  style={{ padding: '2px', borderRadius: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  title={isBn ? 'নাম পরিবর্তন' : 'Rename'}
                >
                  <Pencil size={11} />
                </button>
              )}
            </div>
          )}
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
            <span>{cls.sections.length} {isBn ? 'সেকশন' : 'sections'}</span>
            <span>{totalSeats} {isBn ? 'আসন' : 'seats'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.1875rem' }}>
              <Clock size={10} />
              {cls.startTime} - {cls.endTime}
            </span>
          </div>
        </div>
        {!bulkMode && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setEditingClassTime(cls.id); setClassTimeForm({ startTime: cls.startTime, endTime: cls.endTime }) }}
              style={{ padding: '4px 8px', borderRadius: '0.375rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.625rem', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
            >
              <Clock size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(isBn ? 'এই শ্রেণি মুছে ফেলতে চান?' : 'Delete this class?')) deleteClass(cls.id) }}
              style={{ padding: '4px 8px', borderRadius: '0.375rem', background: 'var(--red-light)', border: '1px solid var(--red)', cursor: 'pointer', fontSize: '0.625rem', color: 'var(--red)', fontFamily: 'inherit' }}
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
        {!bulkMode && (
          <div className="text-[var(--text-muted)] ml-1">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
        )}
      </div>

      {/* Edit class time */}
      {editingClassTime === cls.id && (
        <ClassTimeEditForm
          classId={cls.id}
          classTimeForm={classTimeForm}
          setClassTimeForm={setClassTimeForm}
          handleSaveClassTime={handleSaveClassTime}
          setEditingClassTime={setEditingClassTime}
          isBn={isBn}
          isMobile={isMobile}
        />
      )}

      {/* Sections */}
      {isExpanded && !bulkMode && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem' }}>
              {isBn ? 'সেকশন সমূহ' : 'Sections'}
            </div>
            <button
              onClick={() => handleAddSection(cls.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '5px 10px', borderRadius: '0.375rem', background: 'var(--teal-light)', border: '1px solid var(--teal)', color: 'var(--teal)', fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus size={12} />
              {isBn ? 'সেকশন যোগ' : 'Add Section'}
            </button>
          </div>

          {cls.sections.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {isBn ? 'কোনো সেকশন নেই' : 'No sections yet'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.625rem' }}>
              {cls.sections.map((sec) => (
                <SectionCard
                  key={sec.id}
                  cls={cls}
                  sec={sec}
                  isEditing={editingSection === sec.id}
                  isBn={isBn}
                  getTeacher={getTeacher}
                  getStudentCount={getStudentCount}
                  subjectMap={subjectMap}
                  teachers={teachers}
                  institution={institution}
                  setEditingSection={setEditingSection}
                  secForm={secForm}
                  setSecForm={setSecForm}
                  updateSection={updateSection}
                  deleteSection={deleteSection}
                  setCopySectionModal={setCopySectionModal}
                  setCopyTarget={setCopyTarget}
                  setTempSelectedSubjects={setTempSelectedSubjects}
                  setShowSubjectModal={setShowSubjectModal}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
