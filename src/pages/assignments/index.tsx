import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import gsap from 'gsap'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useVault } from '@/hooks/useVault'
import { useAssignmentStore } from '@/store/assignmentStore'
import type { Assignment } from '@/store/assignmentStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useHRStore } from '@/store/hrStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { useScrollLock } from '@/hooks/useScrollLock'
import { isLocalComputerMode } from '@/lib/storageMode'
import { getSlug } from '@/lib/storage'
import { AssignmentHeader } from './components/AssignmentHeader'
import { AssignmentCard } from './components/AssignmentCard'
import { AssignmentCalendar } from './components/AssignmentCalendar'
import { AssignmentTypeModal } from './modals/AssignmentTypeModal'
import { HomeworkFormModal } from './modals/HomeworkFormModal'
import { AssignmentFormModal } from './modals/AssignmentFormModal'
import { AssignmentDetailModal } from './modals/AssignmentDetailModal'

function PageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton variant="title" width="14rem" height="1.25rem" />
      <Skeleton variant="text" width="9rem" />
      <Skeleton variant="rect" width="100%" height="20rem" />
    </div>
  )
}

export default function AssignmentPage() {
  const isBn = useBn()
  const { slug: paramSlug } = useParams<{ slug?: string }>()
  const slug = paramSlug || getSlug() || undefined
  const { canCreate, canEdit, canDelete, canExport } = usePermission()
  const { isMobile } = useWindowSize()
  const vault = useVault()

  const classes = useClassStore((s) => s.classes)
  const teachers = useTeacherStore((s) => s.teachers)
  const subjects = useTeacherStore((s) => s.subjects)

  const assignments = useAssignmentStore((s) => s.assignments)
  const submissions = useAssignmentStore((s) => s.submissions)
  const addAssignment = useAssignmentStore((s) => s.addAssignment)
  const updateAssignment = useAssignmentStore((s) => s.updateAssignment)
  const deleteAssignment = useAssignmentStore((s) => s.deleteAssignment)
  const addSubmission = useAssignmentStore((s) => s.addSubmission)
  const updateSubmission = useAssignmentStore((s) => s.updateSubmission)
  const syncFromServer = useAssignmentStore((s) => s.syncFromServer)
  const serverSynced = useAssignmentStore((s) => s.serverSynced)
  const syncing = useAssignmentStore((s) => s.syncing)
  const syncError = useAssignmentStore((s) => s.syncError)
  const addHomeworkRecord = useHRStore((s) => s.addHomeworkRecord)

  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const isMountedRef = useRef(true)

  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  const [showTypeSelect, setShowTypeSelect] = useState(false)
  const [showHwForm, setShowHwForm] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Assignment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null)
  const [detailItem, setDetailItem] = useState<Assignment | null>(null)

  const [filterClassId, setFilterClassId] = useState('')
  const [filterSectionId, setFilterSectionId] = useState('')
  const [filterSubjectId, setFilterSubjectId] = useState('')

  useScrollLock(showForm || !!detailItem || !!deleteTarget || showTypeSelect || showHwForm)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.allSettled([
        syncFromServer(slug),
        useClassStore.getState().syncFromServer(slug),
        useTeacherStore.getState().syncFromServer(),
      ])
    } finally {
      if (isMountedRef.current) setRefreshing(false)
    }
  }, [slug, syncFromServer])

  useEffect(() => {
    isMountedRef.current = true
    handleRefresh().finally(() => {
      if (isMountedRef.current) setIsLoading(false)
    })
    return () => {
      isMountedRef.current = false
    }
  }, [handleRefresh])

  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const els = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' })
  }, [isLoading])

  const getClassName = useCallback(
    (classId: string) => classes.find((c) => c.id === classId)?.name || classId,
    [classes]
  )
  const getSectionName = useCallback(
    (classId: string, sectionId: string) => {
      const cls = classes.find((c) => c.id === classId)
      const sec = cls?.sections.find((s) => s.id === sectionId)
      return sec?.name || sectionId
    },
    [classes]
  )
  const getSubjectName = useCallback(
    (subjectId: string) => {
      const s = subjects.find((s) => s.id === subjectId)
      return s ? (isBn ? s.nameBn : s.name) : subjectId
    },
    [subjects, isBn]
  )
  const getTeacherName = useCallback(
    (teacherId: string) => {
      const t = teachers.find((t) => t.id === teacherId)
      return t ? (isBn ? t.nameBn : t.nameEn) : teacherId
    },
    [teachers, isBn]
  )

  // Calendar days calculation
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1)
    const last = new Date(calYear, calMonth + 1, 0)
    const startPad = first.getDay()

    const days: { date: string; day: number; inMonth: boolean }[] = []
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(calYear, calMonth, -i)
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), inMonth: false })
    }
    for (let i = 1; i <= last.getDate(); i++) {
      const d = new Date(calYear, calMonth, i)
      days.push({ date: d.toISOString().split('T')[0], day: i, inMonth: true })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(calYear, calMonth + 1, i)
      days.push({ date: d.toISOString().split('T')[0], day: i, inMonth: false })
    }
    return days
  }, [calMonth, calYear])

  // Filter cascading
  const filterSelectedClass = useMemo(() => classes.find((c) => c.id === filterClassId), [classes, filterClassId])
  const filterAvailableSections = useMemo(() => filterSelectedClass?.sections || [], [filterSelectedClass])
  const filterSelectedSection = useMemo(() => filterAvailableSections.find((s) => s.id === filterSectionId), [filterAvailableSections, filterSectionId])
  const filterAvailableSubjects = useMemo(() => {
    if (filterSelectedSection?.subjectIds?.length) return subjects.filter((s) => filterSelectedSection.subjectIds!.includes(s.id))
    if (filterSelectedClass?.subjectIds?.length) return subjects.filter((s) => filterSelectedClass.subjectIds!.includes(s.id))
    return subjects
  }, [filterSelectedSection, filterSelectedClass, subjects])

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    let result = assignments
    if (filterClassId) result = result.filter((a) => a.classId === filterClassId)
    if (filterSectionId) result = result.filter((a) => a.sectionId === filterSectionId)
    if (filterSubjectId) result = result.filter((a) => a.subjectId === filterSubjectId)
    return result
  }, [assignments, filterClassId, filterSectionId, filterSubjectId])

  const assignmentsOnDate = useMemo(
    () => filteredAssignments.filter((a) => a.dueDate === selectedDate),
    [filteredAssignments, selectedDate]
  )

  const assignmentsWithDots = useMemo(() => {
    const map = new Map<string, number>()
    filteredAssignments.forEach((a) => map.set(a.dueDate, (map.get(a.dueDate) || 0) + 1))
    return map
  }, [filteredAssignments])

  // Summary counts for selected date
  const homeworkPerClass = useMemo(() => {
    const hw = filteredAssignments.filter(
      (a) => a.type === 'homework' && a.status === 'active' && a.dueDate === selectedDate
    )
    const map = new Map<string, { name: string; nameBn: string; count: number }>()
    hw.forEach((a) => {
      const cls = classes.find((c) => c.id === a.classId)
      if (cls) {
        const existing = map.get(cls.id)
        if (existing) existing.count++
        else map.set(cls.id, { name: cls.name, nameBn: cls.nameBn, count: 1 })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [filteredAssignments, classes, selectedDate])

  const assignmentPerClass = useMemo(() => {
    const asg = filteredAssignments.filter(
      (a) => a.type === 'assignment' && a.status === 'active' && a.dueDate === selectedDate
    )
    const map = new Map<string, { name: string; nameBn: string; count: number }>()
    asg.forEach((a) => {
      const cls = classes.find((c) => c.id === a.classId)
      if (cls) {
        const existing = map.get(cls.id)
        if (existing) existing.count++
        else map.set(cls.id, { name: cls.name, nameBn: cls.nameBn, count: 1 })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [filteredAssignments, classes, selectedDate])

  const showSummary = homeworkPerClass.length > 0 || assignmentPerClass.length > 0

  const handleOpenEdit = (item: Assignment) => {
    setEditItem(item)
    if (item.type === 'homework') {
      setShowHwForm(true)
    } else {
      setShowForm(true)
    }
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteAssignment(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  // Local PC Export Handlers
  const handleExportJson = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            assignments,
            submissions,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        )
      )
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute(
      'download',
      `assignments-backup-${new Date().toISOString().split('T')[0]}.json`
    )
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [assignments, submissions])

  const handleExportCsv = useCallback(() => {
    const headers = ['ID', 'Type', 'Title', 'Class', 'Section', 'Subject', 'Teacher', 'DueDate', 'Marks', 'Status']
    const rows = assignments.map((a) => [
      a.id,
      a.type,
      `"${(isBn ? a.titleBn || a.title : a.title || a.titleBn).replace(/"/g, '""')}"`,
      `"${getClassName(a.classId).replace(/"/g, '""')}"`,
      `"${getSectionName(a.classId, a.sectionId).replace(/"/g, '""')}"`,
      `"${getSubjectName(a.subjectId).replace(/"/g, '""')}"`,
      `"${getTeacherName(a.teacherId).replace(/"/g, '""')}"`,
      a.dueDate,
      a.maxMarks,
      a.status,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `assignments-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }, [assignments, isBn, getClassName, getSectionName, getSubjectName, getTeacherName])

  if (isLoading) return <PageSkeleton />

  return (
    <div ref={containerRef}>
      {/* Header */}
      <AssignmentHeader
        isBn={isBn}
        isMobile={isMobile}
        isLocalComputer={isLocalComputerMode()}
        isVaultConnected={vault.connected}
        vaultFolderName={vault.folderName}
        serverSynced={serverSynced}
        syncing={syncing}
        refreshing={refreshing}
        canCreate={canCreate('assignments')}
        canExport={canExport('assignments')}
        classes={classes}
        subjects={subjects}
        filterClassId={filterClassId}
        filterSectionId={filterSectionId}
        filterSubjectId={filterSubjectId}
        availableSections={filterAvailableSections}
        availableSubjects={filterAvailableSubjects}
        onFilterClassChange={(id) => {
          setFilterClassId(id)
          setFilterSectionId('')
          setFilterSubjectId('')
        }}
        onFilterSectionChange={(id) => {
          setFilterSectionId(id)
          setFilterSubjectId('')
        }}
        onFilterSubjectChange={setFilterSubjectId}
        onRefresh={handleRefresh}
        onOpenCreate={() => setShowTypeSelect(true)}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
      />

      {/* Sync Error Banner with Retry */}
      {syncError && !serverSynced && !isLocalComputerMode() && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--red-light)] border border-[var(--red)]/20 text-[var(--red)] text-xs flex items-center justify-between">
          <span>{syncError}</span>
          <button type="button" onClick={handleRefresh} className="underline font-semibold cursor-pointer ml-2">
            {isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Main Content: Assignments List & Calendar */}
      <div
        className="gsap-fade-up"
        style={{
          display: 'flex',
          gap: isMobile ? '12px' : '1rem',
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        {/* Left: Day assignments list */}
        <div style={{ flex: isMobile ? 'none' : '1 1 65%', minWidth: 0, order: isMobile ? 2 : 0 }}>
          {assignmentsOnDate.length === 0 ? (
            <div
              className="glass flex flex-col items-center justify-center"
              style={{ borderRadius: '0.75rem', padding: '2rem', textAlign: 'center' }}
            >
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {isBn ? 'এই তারিখে কোনো অ্যাসাইনমেন্ট নেই' : 'No assignments on this date'}
              </div>
              {canCreate('assignments') && (
                <button
                  type="button"
                  onClick={() => setShowTypeSelect(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'white',
                    background: 'var(--brand)',
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={14} />
                  {isBn ? 'তৈরি করুন' : 'Create'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignmentsOnDate.map((item) => (
                <AssignmentCard
                  key={item.id}
                  item={item}
                  isBn={isBn}
                  isMobile={isMobile}
                  subjectName={getSubjectName(item.subjectId)}
                  className={getClassName(item.classId)}
                  sectionName={getSectionName(item.classId, item.sectionId)}
                  teacherName={getTeacherName(item.teacherId)}
                  canEdit={canEdit('assignments')}
                  canDelete={canDelete('assignments')}
                  onView={setDetailItem}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar: Calendar & Summary */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '12px' : '0.75rem',
            flex: isMobile ? 'none' : '0 0 16rem',
            flexShrink: 0,
            minWidth: 0,
            order: isMobile ? 1 : 0,
          }}
        >
          {/* Calendar Box */}
          <AssignmentCalendar
            isBn={isBn}
            isMobile={isMobile}
            calMonth={calMonth}
            calYear={calYear}
            selectedDate={selectedDate}
            calDays={calDays}
            assignmentsWithDots={assignmentsWithDots}
            onPrevMonth={() => {
              if (calMonth === 0) {
                setCalMonth(11)
                setCalYear((y) => y - 1)
              } else {
                setCalMonth((m) => m - 1)
              }
            }}
            onNextMonth={() => {
              if (calMonth === 11) {
                setCalMonth(0)
                setCalYear((y) => y + 1)
              } else {
                setCalMonth((m) => m + 1)
              }
            }}
            onSelectDate={setSelectedDate}
          />

          {/* Today's Summary Box */}
          {showSummary && (
            <div className="glass" style={{ borderRadius: '0.75rem', padding: isMobile ? '10px' : '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {isBn ? 'আজকের সারসংক্ষেপ' : "Today's Summary"}
              </span>
              {homeworkPerClass.length > 0 && (
                <div className="mt-1.5">
                  <span style={{ fontSize: '0.5625rem', fontWeight: 600, color: 'var(--amber)' }}>
                    {isBn ? 'গৃহকাজ' : 'Homework'}
                  </span>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {homeworkPerClass.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-1 rounded bg-[var(--bg-secondary)] text-[0.6875rem] flex items-center justify-between"
                      >
                        <span className="truncate">{isBn ? item.nameBn || item.name : item.name}</span>
                        <span className="font-semibold text-[var(--amber)] ml-1">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {assignmentPerClass.length > 0 && (
                <div className="mt-2">
                  <span style={{ fontSize: '0.5625rem', fontWeight: 600, color: 'var(--purple)' }}>
                    {isBn ? 'অ্যাসাইনমেন্ট' : 'Assignment'}
                  </span>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {assignmentPerClass.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-1 rounded bg-[var(--bg-secondary)] text-[0.6875rem] flex items-center justify-between"
                      >
                        <span className="truncate">{isBn ? item.nameBn || item.name : item.name}</span>
                        <span className="font-semibold text-[var(--purple)] ml-1">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Type Selector Modal */}
      <AssignmentTypeModal
        isOpen={showTypeSelect}
        isBn={isBn}
        isMobile={isMobile}
        onClose={() => setShowTypeSelect(false)}
        onSelectHomework={() => {
          setShowTypeSelect(false)
          setEditItem(null)
          setShowHwForm(true)
        }}
        onSelectAssignment={() => {
          setShowTypeSelect(false)
          setEditItem(null)
          setShowForm(true)
        }}
      />

      {/* Homework Form Modal */}
      <HomeworkFormModal
        isOpen={showHwForm}
        isBn={isBn}
        isMobile={isMobile}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        editItem={editItem}
        initialDate={selectedDate}
        onClose={() => {
          setShowHwForm(false)
          setEditItem(null)
        }}
        onSave={(data) => {
          if (editItem) {
            updateAssignment(editItem.id, data)
          } else {
            addAssignment(data)
            addHomeworkRecord({
              id: `HWR-${Date.now()}`,
              teacherId: data.teacherId,
              classId: data.classId,
              sectionId: data.sectionId,
              subject: data.subjectId,
              date: new Date().toISOString().split('T')[0],
              submitted: true,
            })
          }
          setShowHwForm(false)
          setEditItem(null)
        }}
      />

      {/* Assignment Form Modal */}
      <AssignmentFormModal
        isOpen={showForm}
        isBn={isBn}
        isMobile={isMobile}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        editItem={editItem}
        initialDate={selectedDate}
        onClose={() => {
          setShowForm(false)
          setEditItem(null)
        }}
        onSave={(data) => {
          if (editItem) {
            updateAssignment(editItem.id, data)
          } else {
            addAssignment(data)
          }
          setShowForm(false)
          setEditItem(null)
        }}
      />

      {/* Detail Modal */}
      <AssignmentDetailModal
        isOpen={!!detailItem}
        isBn={isBn}
        isMobile={isMobile}
        assignment={detailItem}
        submissions={submissions}
        getClassName={getClassName}
        getSectionName={getSectionName}
        getSubjectName={getSubjectName}
        getTeacherName={getTeacherName}
        canEdit={canEdit('assignments')}
        onClose={() => setDetailItem(null)}
        onEdit={handleOpenEdit}
        onAddSubmission={addSubmission}
        onUpdateSubmission={updateSubmission}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={isBn ? 'মুছে ফেলুন?' : 'Delete?'}
          message={
            isBn
              ? `"${deleteTarget.titleBn || deleteTarget.title}" মুছে ফেলা হবে।`
              : `"${deleteTarget.title}" will be deleted.`
          }
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isBn={isBn}
        />
      )}
    </div>
  )
}
