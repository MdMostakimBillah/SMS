import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Check, Copy, Search, X } from 'lucide-react'
import { useNavChain } from '@/hooks/useNavChain'
import { useNavPath } from '@/hooks/useNavPath'
import type { Subject } from '@/pages/teachers/types'
import type { ClassInfo, ClassSection } from '@/store/classStore'
import { useClassStore } from '@/store/classStore'
import { flushPendingWrites } from '@/lib/storage'
import { flushVaultWrites } from '@/lib/vault/vault'

export interface SubjectModalTarget {
  classId: string
  sectionId?: string
  className?: string
  sectionName?: string
}

interface SubjectSelectionModalProps {
  subjects: Subject[]
  showSubjectModal: SubjectModalTarget
  setShowSubjectModal: React.Dispatch<React.SetStateAction<SubjectModalTarget | null>>
  tempSelectedSubjects: string[]
  setTempSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>
  updateSection: (classId: string, sectionId: string, data: Partial<ClassSection>) => void
  updateClass?: (classId: string, data: Partial<ClassInfo>) => void
  classes?: ClassInfo[]
  institutionSubjects?: string[]
  isBn: boolean
}

export function SubjectSelectionModal({
  subjects,
  showSubjectModal,
  setShowSubjectModal,
  tempSelectedSubjects,
  setTempSelectedSubjects,
  updateSection,
  updateClass,
  classes = [],
  institutionSubjects = [],
  isBn,
}: SubjectSelectionModalProps) {
  const navigate = useNavigate()
  const nav = useNavPath()
  const { pushToChain, setRedirectTimestamp } = useNavChain()
  const [searchQuery, setSearchQuery] = useState('')

  const isSectionMode = Boolean(showSubjectModal.sectionId)
  const targetClass = classes.find((c) => c.id === showSubjectModal.classId)
  const targetSection = isSectionMode
    ? targetClass?.sections?.find((s) => s.id === showSubjectModal.sectionId)
    : undefined

  // Combine subjects from teacherStore with any institution-level subjects not yet in teacherStore
  const combinedSubjects: Subject[] = useMemo(() => {
    const list: Subject[] = [...subjects]
    const existingNames = new Set(subjects.map((s) => s.name.trim().toLowerCase()))
    const nowIso = new Date().toISOString()
    for (const instSub of institutionSubjects) {
      const trimmed = instSub.trim()
      if (trimmed && !existingNames.has(trimmed.toLowerCase())) {
        list.push({
          id: `INST-${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
          name: trimmed,
          nameBn: trimmed,
          departmentId: '',
          departmentIds: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        existingNames.add(trimmed.toLowerCase())
      }
    }
    return list
  }, [subjects, institutionSubjects])

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return combinedSubjects
    return combinedSubjects.filter((sub) => {
      const nameEn = (sub.name || '').toLowerCase()
      const nameBn = (sub.nameBn || '').toLowerCase()
      const code = (sub.id || '').toLowerCase()
      return nameEn.includes(q) || nameBn.includes(q) || code.includes(q)
    })
  }, [combinedSubjects, searchQuery])

  const handleCopyFromClass = () => {
    if (!targetClass?.subjectIds?.length) return
    setTempSelectedSubjects((prev) => Array.from(new Set([...prev, ...(targetClass.subjectIds || [])])))
  }

  const handleSave = async () => {
    if (isSectionMode && showSubjectModal.sectionId) {
      updateSection(showSubjectModal.classId, showSubjectModal.sectionId, { subjectIds: tempSelectedSubjects })
      // Keep parent class subjectIds aligned with the union of its sections' subjects
      if (updateClass && targetClass) {
        const otherSectionsSubs = (targetClass.sections || [])
          .filter((s) => s.id !== showSubjectModal.sectionId)
          .flatMap((s) => s.subjectIds || [])
        const unionSubs = Array.from(new Set([...otherSectionsSubs, ...tempSelectedSubjects]))
        updateClass(showSubjectModal.classId, { subjectIds: unionSubs })
      }
    } else if (updateClass) {
      updateClass(showSubjectModal.classId, { subjectIds: tempSelectedSubjects })
      // Propagate class subjects to all sections in this class so sections inherit them
      if (targetClass?.sections?.length) {
        const removedFromClass = new Set((targetClass.subjectIds || []).filter((id) => !tempSelectedSubjects.includes(id)))
        targetClass.sections.forEach((sec) => {
          const preserved = (sec.subjectIds || []).filter((id) => !removedFromClass.has(id))
          const mergedSec = Array.from(new Set([...preserved, ...tempSelectedSubjects]))
          updateSection(showSubjectModal.classId, sec.id, { subjectIds: mergedSec })
        })
      }
    }
    flushPendingWrites()
    await flushVaultWrites()
    await useClassStore.getState().syncToServer()
    setShowSubjectModal(null)
  }

  const displayName = isSectionMode
    ? `${showSubjectModal.className || targetClass?.name || ''} — ${isBn ? 'সেকশন' : 'Section'} ${showSubjectModal.sectionName || targetSection?.name || ''}`
    : `${showSubjectModal.className || targetClass?.name || ''}`

  return createPortal(
    <div
      onClick={() => setShowSubjectModal(null)}
      className="modal-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-box modal-content"
        style={{ maxWidth: '26rem' }}
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
            <p style={{ fontSize: '0.6875rem', color: 'var(--brand)', margin: '4px 0 0', fontWeight: 500 }}>
              {displayName}
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

        {/* Quick actions row: copy class subjects and search */}
        <div style={{ padding: '10px 20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isSectionMode && targetClass?.subjectIds && targetClass.subjectIds.length > 0 && (
            <button
              type="button"
              onClick={handleCopyFromClass}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '0.5rem',
                background: 'var(--brand-light)',
                border: '1px dashed var(--brand)',
                color: 'var(--brand)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Copy size={12} />
              {isBn
                ? `শ্রেণির বিষয়সমূহ যোগ করুন (${targetClass.subjectIds.length}টি)`
                : `Copy from class subjects (${targetClass.subjectIds.length})`}
            </button>
          )}

          {/* Search subject input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'বিষয়ের নাম দিয়ে অনুসন্ধান করুন...' : 'Search subject name...'}
              style={{
                width: '100%',
                padding: '7px 28px 7px 30px',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={isBn ? 'মুছুন' : 'Clear'}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, maxHeight: '20rem' }}>
          {combinedSubjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <BookOpen size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {isBn ? 'কোনো বিষয় পাওয়া যায়নি' : 'No subjects found'}
              </p>
              <p style={{ margin: '0 0 1rem', fontSize: '0.6875rem' }}>
                {isBn
                  ? 'বিষয় যুক্ত করতে শিক্ষক ব্যবস্থাপনায় যান'
                  : 'Manage and create subjects in Teacher Management'}
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
                {isBn ? 'শিক্ষক ব্যবস্থাপনায় বিষয় যোগ করুন →' : 'Go to Teacher Management →'}
              </button>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Search size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {isBn ? `"${searchQuery}" এর সাথে কোনো বিষয় মেলেনি` : `No subjects found matching "${searchQuery}"`}
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '0.375rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.6875rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {isBn ? 'অনুসন্ধান মুছুন' : 'Clear search'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {filteredSubjects.map((sub) => {
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
                        {isBn ? (sub.nameBn || sub.name) : (sub.name || sub.nameBn)}
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
            onClick={handleSave}
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

