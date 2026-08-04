import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Check, X } from 'lucide-react'
import { useNavChain } from '@/hooks/useNavChain'
import { useNavPath } from '@/hooks/useNavPath'
import type { Subject } from '@/pages/teachers/types'
import type { ClassSection } from '@/store/classStore'

interface SubjectSelectionModalProps {
  subjects: Subject[]
  showSubjectModal: { classId: string; sectionId: string }
  setShowSubjectModal: React.Dispatch<React.SetStateAction<{ classId: string; sectionId: string } | null>>
  tempSelectedSubjects: string[]
  setTempSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>
  updateSection: (classId: string, sectionId: string, data: Partial<ClassSection>) => void
  isBn: boolean
}

export function SubjectSelectionModal({
  subjects,
  showSubjectModal,
  setShowSubjectModal,
  tempSelectedSubjects,
  setTempSelectedSubjects,
  updateSection,
  isBn,
}: SubjectSelectionModalProps) {
  const navigate = useNavigate()
  const nav = useNavPath()
  const { pushToChain, setRedirectTimestamp } = useNavChain()

  return createPortal(
    <div
      onClick={() => setShowSubjectModal(null)}
      className="modal-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-box modal-content"
        style={{ maxWidth: '25rem' }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subjects'}
            </h3>
            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {isBn ? 'শিক্ষক ব্যবস্থাপনা থেকে বিষয় নির্বাচন করুন' : 'Select subjects from Teacher Management'}
            </p>
          </div>
          <button
            onClick={() => setShowSubjectModal(null)}
            style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1 }}>
          {subjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <BookOpen size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {isBn ? 'কোনো বিষয় পাওয়া যায়নি' : 'No subjects found'}
              </p>
              <p style={{ margin: '0 0 1rem', fontSize: '0.6875rem' }}>
                {isBn ? 'শিক্ষক ব্যবস্থাপনায় বিষয় যোগ করুন' : 'Add subjects in Teacher Management'}
              </p>
              <button
                onClick={() => {
                  setShowSubjectModal(null)
                  pushToChain({ path: nav('/classes'), label: isBn ? 'শ্রেণী ব্যবস্থাপনা' : 'Classes Management' })
                  setRedirectTimestamp()
                  navigate(nav('/teachers/subjects'))
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'var(--brand)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                {isBn ? 'বিষয় যোগ করুন →' : 'Add Subjects →'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {subjects.map((sub) => {
                const isSelected = tempSelectedSubjects.includes(sub.id)
                return (
                  <button
                    key={sub.id}
                    onClick={() =>
                      setTempSelectedSubjects((prev) => (isSelected ? prev.filter((s) => s !== sub.id) : [...prev, sub.id]))
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '10px 12px',
                      borderRadius: '0.625rem',
                      border: `1px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--teal-light)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: '1.125rem',
                        height: '1.125rem',
                        borderRadius: '0.3125rem',
                        border: `2px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--teal)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isSelected && <Check size={11} style={{ color: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {isBn ? sub.nameBn : sub.name}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowSubjectModal(null)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '0.6875rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              if (showSubjectModal) {
                updateSection(showSubjectModal.classId, showSubjectModal.sectionId, { subjectIds: tempSelectedSubjects })
              }
              setShowSubjectModal(null)
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.5rem',
              background: 'var(--teal)',
              border: 'none',
              color: '#fff',
              fontSize: '0.6875rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isBn ? 'সেভ করুন' : 'Save'} ({tempSelectedSubjects.length})
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
