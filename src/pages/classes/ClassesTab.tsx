import { useState, useCallback, useMemo } from 'react'
import { CalendarDays, Download, Check } from 'lucide-react'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { ClassSection, ClassInfo, InstitutionSettings } from '@/store/classStore'
import type { Teacher, Subject } from '@/pages/teachers/types'
import type { StudentAdmission } from '@/pages/students/admission/types'
import { TopBar } from './components/TopBar'
import { AddClassForm } from './components/AddClassForm'
import { ClassCard } from './components/ClassCard'
import { BulkTimeModal } from './modals/BulkTimeModal'
import { BulkSubjectModal } from './modals/BulkSubjectModal'
import { BulkSectionModal } from './modals/BulkSectionModal'
import { SubjectSelectionModal } from './modals/SubjectSelectionModal'
import { CopySectionModal } from './modals/CopySectionModal'

interface ClassesTabProps {
  institution: InstitutionSettings
  classes: ClassInfo[]
  teachers: Teacher[]
  subjects: Subject[]
  students: StudentAdmission[]
  addClass: (data: ClassInfo) => void
  updateClass: (id: string, data: Partial<ClassInfo>) => void
  deleteClass: (id: string) => void
  addSection: (classId: string, data: ClassSection) => void
  updateSection: (classId: string, sectionId: string, data: Partial<ClassSection>) => void
  deleteSection: (classId: string, sectionId: string) => void
  switchSession: (session: string) => void
  importFromSession: (session: string) => void
  isBn: boolean
  isMobile: boolean
}

export default function ClassesTab({
  institution,
  classes,
  teachers,
  subjects,
  students,
  addClass,
  updateClass,
  deleteClass,
  addSection,
  updateSection,
  deleteSection,
  switchSession,
  importFromSession,
  isBn,
  isMobile,
}: ClassesTabProps) {
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [showAddClass, setShowAddClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassNameBn, setNewClassNameBn] = useState('')
  const [copyFromClassId, setCopyFromClassId] = useState('')
  const [editingClassTime, setEditingClassTime] = useState<string | null>(null)
  const [classTimeForm, setClassTimeForm] = useState({ startTime: '', endTime: '' })
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [secForm, setSecForm] = useState({ name: '', seatQuantity: 40, classTeacherId: '' })
  const [showSubjectModal, setShowSubjectModal] = useState<{ classId: string; sectionId: string } | null>(null)
  const [tempSelectedSubjects, setTempSelectedSubjects] = useState<string[]>([])
  const [editingClassName, setEditingClassName] = useState<string | null>(null)
  const [classNameForm, setClassNameForm] = useState({ name: '', nameBn: '' })
  const [copySectionModal, setCopySectionModal] = useState<{ fromClassId: string; fromSectionId: string } | null>(null)
  const [copyTarget, setCopyTarget] = useState({ classId: '', sectionId: '' })
  const [showCopyConfirm, setShowCopyConfirm] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [showBulkTime, setShowBulkTime] = useState(false)
  const [showBulkSubject, setShowBulkSubject] = useState(false)
  const [showBulkSection, setShowBulkSection] = useState(false)
  const [bulkTimeForm, setBulkTimeForm] = useState({ startTime: '07:30', endTime: '14:30' })
  const [bulkSubjectIds, setBulkSubjectIds] = useState<string[]>([])
  const [bulkSectionCount, setBulkSectionCount] = useState(2)
  const [bulkSeatQuantity, setBulkSeatQuantity] = useState(40)

  useScrollLock(showSubjectModal !== null || showBulkTime || showBulkSubject || showBulkSection || copySectionModal !== null)

  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const getTeacher = useCallback((id: string) => teacherMap.get(id), [teacherMap])

  const getStudentCount = useCallback(
    (classNum: string, sectionName: string) => {
      return students.filter(
        (s) => s.status === 'approved' && s.class === classNum && s.section === sectionName && s.academicYear === institution.currentSession
      ).length
    },
    [students, institution.currentSession]
  )

  const handleAddClass = () => {
    if (!newClassName.trim()) return
    const id = `CLS-${String(classes.length + 1).padStart(2, '0')}`
    const now = new Date().toISOString().split('T')[0]
    let sections: ClassSection[] = []
    let subjectIds: string[] = []
    if (copyFromClassId) {
      const sourceClass = classes.find((c) => c.id === copyFromClassId)
      if (sourceClass) {
        sections = sourceClass.sections.map((sec: ClassSection) => ({ ...sec, id: `SEC-${id}-${sec.name}`, classTeacherId: '' }))
        subjectIds = [...sourceClass.subjectIds]
      }
    }
    addClass({ id, name: newClassName.trim(), nameBn: newClassNameBn.trim() || newClassName.trim(), startTime: institution.startTime, endTime: institution.endTime, sections, subjectIds, createdAt: now, updatedAt: now })
    setNewClassName(''); setNewClassNameBn(''); setCopyFromClassId(''); setShowAddClass(false)
  }

  const handleAddSection = (classId: string) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return
    const secLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nextLetter = secLetters[cls.sections.length] || 'A'
    const secId = `SEC-${classId}-${nextLetter}`
    addSection(classId, { id: secId, name: nextLetter, seatQuantity: 40, classTeacherId: '', subjectIds: [] })
  }

  const handleSaveClassName = (classId: string) => {
    if (!classNameForm.name.trim()) return
    updateClass(classId, { name: classNameForm.name.trim(), nameBn: classNameForm.nameBn.trim() || classNameForm.name.trim() })
    setEditingClassName(null)
  }

  const handleCopySection = () => {
    if (!copySectionModal || !copyTarget.classId || !copyTarget.sectionId) return
    const sourceClass = classes.find((c) => c.id === copySectionModal.fromClassId)
    const sourceSection = sourceClass?.sections.find((s) => s.id === copySectionModal.fromSectionId)
    if (!sourceClass || !sourceSection) return
    const targetClass = classes.find((c) => c.id === copyTarget.classId)
    if (!targetClass) return
    const secLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nextLetter = secLetters[targetClass.sections.length] || 'A'
    const newSecId = `SEC-${copyTarget.classId}-${nextLetter}`
    addSection(copyTarget.classId, { id: newSecId, name: nextLetter, seatQuantity: sourceSection.seatQuantity, classTeacherId: '', subjectIds: [...(sourceSection.subjectIds || [])] })
    setCopySectionModal(null); setCopyTarget({ classId: '', sectionId: '' })
  }

  const handleSaveClassTime = (classId: string) => {
    updateClass(classId, classTimeForm)
    setEditingClassTime(null)
  }

  const toggleSelectAll = () => {
    if (selectedClasses.length === classes.length) { setSelectedClasses([]) } else { setSelectedClasses(classes.map((c) => c.id)) }
  }

  const toggleSelectClass = (classId: string) => {
    setSelectedClasses((prev) => (prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]))
  }

  const handleBulkTimeApply = () => {
    selectedClasses.forEach((classId) => { updateClass(classId, { startTime: bulkTimeForm.startTime, endTime: bulkTimeForm.endTime }) })
    setShowBulkTime(false); setSelectedClasses([]); setBulkMode(false)
  }

  const handleBulkSubjectApply = () => {
    selectedClasses.forEach((classId) => {
      const cls = classes.find((c) => c.id === classId)
      if (!cls) return
      cls.sections.forEach((sec: ClassSection) => {
        const existing = sec.subjectIds || []
        const merged = [...new Set([...existing, ...bulkSubjectIds])]
        updateSection(classId, sec.id, { subjectIds: merged })
      })
    })
    setShowBulkSubject(false); setSelectedClasses([]); setBulkMode(false)
  }

  const handleBulkSectionApply = () => {
    selectedClasses.forEach((classId) => {
      const cls = classes.find((c) => c.id === classId)
      if (!cls) return
      const secLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      for (let i = 0; i < bulkSectionCount; i++) {
        const idx = cls.sections.length + i
        const letter = secLetters[idx] || String(idx + 1)
        const secId = `SEC-${classId}-${letter}`
        addSection(classId, { id: secId, name: letter, seatQuantity: bulkSeatQuantity, classTeacherId: '', subjectIds: [] })
      }
    })
    setShowBulkSection(false); setSelectedClasses([]); setBulkMode(false)
  }

  return (
    <>
      {/* Session indicator */}
      <div className="flex items-center gap-2 mb-3 py-2 px-3 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]">
        <CalendarDays size={14} className="text-[var(--brand)]" />
        <span className="text-[0.75rem] font-semibold text-[var(--brand)]">{institution.currentSession}</span>
        <span className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'বর্তমান সেশন' : 'Current Session'}</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {institution.sessions.filter((s) => s !== institution.currentSession).map((s) => (
            <button key={s} onClick={() => switchSession(s)} className="text-[0.625rem] py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] cursor-pointer font-[inherit] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">
              {isBn ? 'পরিবর্তন' : 'Switch to'} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Import from previous session prompt */}
      {classes.length === 0 && institution.sessions.filter((s) => s !== institution.currentSession).length > 0 && (
        <div className="flex items-center gap-3 mb-3 py-3 px-4 rounded-xl bg-[var(--purple-light)] border border-[var(--purple)] border-dashed">
          <div className="w-9 h-9 rounded-lg bg-[var(--purple)] flex items-center justify-center shrink-0">
            <Download size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.8125rem] font-semibold text-[var(--purple)]">{isBn ? 'আগের বছর থেকে আমদানি করুন' : 'Import from Previous Session'}</div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'এই সেশনে কোনো শ্রেণি নেই। আগের সেশন থেকে শ্রেণি ও রুটিন আমদানি করুন।' : 'No classes in this session. Import classes and routines from a previous session.'}</div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {institution.sessions.filter((s) => s !== institution.currentSession).map((s) => (
              <button key={s} onClick={() => { if (window.confirm(isBn ? `"${s}" থেকে সব শ্রেণি ও রুটিন আমদানি করবেন?` : `Import all classes and routines from "${s}"?`)) { importFromSession(s) } }} className="flex items-center gap-[0.25rem] py-[0.375rem] px-3 rounded-lg bg-[var(--purple)] border-none text-white text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:opacity-90 transition-all">
                <Download size={11} />
                {isBn ? `${s} থেকে আমদানি` : `Import from ${s}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <TopBar
        classes={classes}
        bulkMode={bulkMode}
        setBulkMode={setBulkMode}
        selectedClasses={selectedClasses}
        setShowBulkTime={setShowBulkTime}
        setShowBulkSubject={setShowBulkSubject}
        setShowBulkSection={setShowBulkSection}
        setShowAddClass={setShowAddClass}
        setSelectedClasses={setSelectedClasses}
        isBn={isBn}
      />

      {showAddClass && (
        <AddClassForm
          classes={classes}
          isBn={isBn}
          isMobile={isMobile}
          newClassName={newClassName}
          setNewClassName={setNewClassName}
          newClassNameBn={newClassNameBn}
          setNewClassNameBn={setNewClassNameBn}
          copyFromClassId={copyFromClassId}
          setCopyFromClassId={setCopyFromClassId}
          handleAddClass={handleAddClass}
          setShowAddClass={setShowAddClass}
        />
      )}

      {/* Bulk mode: select all bar */}
      {bulkMode && (
        <div className="flex items-center gap-3 py-2 px-3 mb-3">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 cursor-pointer bg-transparent border-none font-[inherit] text-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <div className={`w-[1.125rem] h-[1.125rem] rounded-[0.25rem] border-[0.0938rem] flex items-center justify-center transition-all ${selectedClasses.length === classes.length ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border)]'}`}>
              {selectedClasses.length === classes.length && <Check size={11} className="text-white" />}
            </div>
            {isBn ? 'সব নির্বাচন' : 'Select All'}
          </button>
          {selectedClasses.length > 0 && (
            <span className="text-[0.6875rem] text-[var(--brand)] font-medium">
              {selectedClasses.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>
      )}

      {/* Class cards */}
      {classes.map((cls) => (
        <ClassCard
          key={cls.id}
          cls={cls}
          isExpanded={expandedClass === cls.id}
          bulkMode={bulkMode}
          isSelected={selectedClasses.includes(cls.id)}
          isBn={isBn}
          isMobile={isMobile}
          editingClassName={editingClassName}
          setEditingClassName={setEditingClassName}
          classNameForm={classNameForm}
          setClassNameForm={setClassNameForm}
          editingClassTime={editingClassTime}
          setEditingClassTime={setEditingClassTime}
          classTimeForm={classTimeForm}
          setClassTimeForm={setClassTimeForm}
          editingSection={editingSection}
          setEditingSection={setEditingSection}
          secForm={secForm}
          setSecForm={setSecForm}
          handleSaveClassName={handleSaveClassName}
          handleSaveClassTime={handleSaveClassTime}
          handleAddSection={handleAddSection}
          deleteClass={deleteClass}
          toggleSelectClass={toggleSelectClass}
          setExpandedClass={setExpandedClass}
          teachers={teachers}
          subjects={subjects}
          institution={institution}
          getTeacher={getTeacher}
          getStudentCount={getStudentCount}
          subjectMap={subjectMap}
          updateSection={updateSection}
          deleteSection={deleteSection}
          setCopySectionModal={setCopySectionModal}
          setCopyTarget={setCopyTarget}
          setTempSelectedSubjects={setTempSelectedSubjects}
          setShowSubjectModal={setShowSubjectModal}
        />
      ))}

      {/* Bulk modals */}
      {showBulkTime && (
        <BulkTimeModal
          classes={classes}
          selectedClasses={selectedClasses}
          bulkTimeForm={bulkTimeForm}
          setBulkTimeForm={setBulkTimeForm}
          handleBulkTimeApply={handleBulkTimeApply}
          setShowBulkTime={setShowBulkTime}
          isBn={isBn}
        />
      )}

      {showBulkSubject && (
        <BulkSubjectModal
          subjects={subjects}
          selectedClasses={selectedClasses}
          bulkSubjectIds={bulkSubjectIds}
          setBulkSubjectIds={setBulkSubjectIds}
          handleBulkSubjectApply={handleBulkSubjectApply}
          setShowBulkSubject={setShowBulkSubject}
          isBn={isBn}
        />
      )}

      {showBulkSection && (
        <BulkSectionModal
          classes={classes}
          selectedClasses={selectedClasses}
          bulkSectionCount={bulkSectionCount}
          setBulkSectionCount={setBulkSectionCount}
          bulkSeatQuantity={bulkSeatQuantity}
          setBulkSeatQuantity={setBulkSeatQuantity}
          handleBulkSectionApply={handleBulkSectionApply}
          setShowBulkSection={setShowBulkSection}
          isBn={isBn}
        />
      )}

      {showSubjectModal && (
        <SubjectSelectionModal
          subjects={subjects}
          showSubjectModal={showSubjectModal}
          setShowSubjectModal={setShowSubjectModal}
          tempSelectedSubjects={tempSelectedSubjects}
          setTempSelectedSubjects={setTempSelectedSubjects}
          updateSection={updateSection}
          isBn={isBn}
        />
      )}

      {copySectionModal && (
        <CopySectionModal
          classes={classes}
          copySectionModal={copySectionModal}
          setCopySectionModal={setCopySectionModal}
          copyTarget={copyTarget}
          setCopyTarget={setCopyTarget}
          showCopyConfirm={showCopyConfirm}
          setShowCopyConfirm={setShowCopyConfirm}
          handleCopySection={handleCopySection}
          isBn={isBn}
        />
      )}
    </>
  )
}
