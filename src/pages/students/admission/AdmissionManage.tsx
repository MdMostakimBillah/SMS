import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { PDFOptionsModal } from '@/components/shared/PDFOptionsModal'
import { useTeacherStore } from '@/store/teacherStore'
import { XLSX } from '@/lib/excelExport'
import { logger } from '@/lib/logger'
import { generateListPDF } from './listPdfTemplate'
import type { ListPDFOptions } from './listPdfTemplate'
import type { StudentAdmission } from './types'
import { ApproveModal } from './modals/ApproveModal'
import { RejectModal } from './modals/RejectModal'
import { EditModal } from './modals/EditModal'
import { ViewModal } from './modals/ViewModal'
import { StatsBar } from './components/StatsBar'
import { FilterBar } from './components/FilterBar'
import { ActionMenu } from './components/ActionMenu'
import { AdmissionTable } from './components/AdmissionTable'

const PER_PAGE = [10, 20, 30, 50, 100, 200, 500, 1000]

export default function AdmissionManage() {
  const { isMobile } = useWindowSize()
  const updateStudent = useAdmissionStore((s) => s.updateStudent)
  const approveStudent = useAdmissionStore((s) => s.approveStudent)
  const rejectStudent = useAdmissionStore((s) => s.rejectStudent)
  const allStudents = useAdmissionStore((s) => s.students)
  const { classes, institution } = useClassStore()
  const teachers = useTeacherStore((s) => s.teachers)
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers])
  const currentSession = institution.currentSession

  const students = useMemo(
    () => allStudents.filter((s) => s.academicYear === currentSession),
    [allStudents, currentSession]
  )
  const isBn = useBn()

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((cls) => cls.sections.forEach((s) => set.add(s.name)))
    return Array.from(set).sort()
  }, [classes])

  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fGender, setFGender] = useState('')
  const [fReligion, setFReligion] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fDate, setFDate] = useState<'today' | 'week' | 'month' | 'custom' | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])

  const [approvingStudent, setApprovingStudent] = useState<StudentAdmission | null>(null)
  const [rejectingStudent, setRejectingStudent] = useState<StudentAdmission | null>(null)
  const [editingStudent, setEditingStudent] = useState<StudentAdmission | null>(null)
  const [viewingStudent, setViewingStudent] = useState<StudentAdmission | null>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false)
      }
    }
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActionMenu])

  useScrollLock(approvingStudent !== null || rejectingStudent !== null || editingStudent !== null || viewingStudent !== null || showPDFModal)

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (search) {
          const q = search.toLowerCase()
          if (!s.nameEn.toLowerCase().includes(q) && !s.nameBn.includes(search) && !s.id.includes(search) && !s.phone.includes(search))
            return false
        }
        if (fClass && s.class !== fClass) return false
        if (fSection && s.section !== fSection) return false
        if (fGender && !s.gender.includes(fGender)) return false
        if (fReligion && !s.religion.includes(fReligion)) return false
        if (fStatus && s.status !== fStatus) return false
        if (fDate) {
          const d = new Date(s.admissionDate),
            now = new Date()
          if (fDate === 'today' && d.toDateString() !== now.toDateString()) return false
          if (fDate === 'week' && d < new Date(now.getTime() - 7 * 86400000)) return false
          if (fDate === 'month' && d < new Date(now.getTime() - 30 * 86400000)) return false
          if (fDate === 'custom' && dateFrom && dateTo && (d < new Date(dateFrom) || d > new Date(dateTo))) return false
        }
        return true
      }),
    [students, currentSession, search, fClass, fSection, fGender, fReligion, fStatus, fDate, dateFrom, dateTo]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const sp = Math.min(page, totalPages)
  const paginated = useMemo(() => filtered.slice((sp - 1) * perPage, sp * perPage), [filtered, sp, perPage])

  const stats = useMemo(
    () => ({
      total: filtered.length,
      pending: filtered.filter((s) => s.status === 'pending').length,
      approved: filtered.filter((s) => s.status === 'approved').length,
      rejected: filtered.filter((s) => s.status === 'rejected').length,
      male: filtered.filter((s) => s.gender.includes('Male')).length,
      female: filtered.filter((s) => s.gender.includes('Female')).length,
    }),
    [filtered]
  )

  const pageIds = paginated.map((s) => s.id)
  const allSel = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))
  const toggleAll = useCallback(() => {
    setSelected((p) => (allSel ? p.filter((id) => !pageIds.includes(id)) : [...new Set([...p, ...pageIds])]))
  }, [allSel, pageIds])
  const toggleOne = useCallback((id: string) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }, [])

  const handleApprove = useCallback(
    (student: StudentAdmission, sms: boolean, billingDate: string) => {
      approveStudent(student.id, billingDate)
      if (sms) logger.sms(student.phone, `আপনার ভর্তি অনুমোদিত হয়েছে! আইডি: ${student.id} — Sunrise Academy`)
    },
    [approveStudent]
  )

  const handleReject = useCallback(
    (student: StudentAdmission, sms: boolean) => {
      rejectStudent(student.id)
      if (sms) logger.sms(student.phone, `আপনার ভর্তি আবেদন প্রত্যাখ্যাত হয়েছে। আইডি: ${student.id}`)
    },
    [rejectStudent]
  )

  const exportExcel = useCallback(() => {
    const instName = institution.name || 'Institution'
    const instNameBn = institution.nameBn || ''
    const instAddress = institution.address || ''
    const instPhone = institution.phone || ''
    const instEmail = institution.email || ''

    const studentsData = (selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered).map((s, i) => ({
      '#': i + 1,
      'Student ID': s.id,
      'Name EN': s.nameEn,
      'Name BN': s.nameBn,
      Class: s.class,
      Section: s.section,
      Roll: s.roll,
      Gender: s.gender.split(' / ')[0],
      DOB: s.dob,
      'Blood Group': s.bloodGroup,
      Religion: s.religion.split(' / ')[0],
      Mobile: s.phone,
      Email: s.email,
      District: s.district,
      Father: s.fatherNameEn,
      'Father Mobile': s.fatherPhone,
      Mother: s.motherNameEn,
      'Mother Mobile': s.motherPhone,
      'Admission Date': s.admissionDate,
      Status: s.status,
    }))

    const ws = XLSX.utils.json_to_sheet(studentsData)
    XLSX.utils.sheet_add_aoa(ws, [
      [instName],
      [instNameBn],
      [instAddress],
      [`Phone: ${instPhone} | Email: ${instEmail}`],
      [],
    ], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Admissions')
    XLSX.writeFile(wb, `admissions_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [selected, filtered, institution])

  const handleListPDF = useCallback(
    (opts: ListPDFOptions) => {
      const list = selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered
      const html = generateListPDF(list, { ...opts, institutionName: institution.name })
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 800)
      setShowPDFModal(false)
    },
    [selected, filtered]
  )

  const clearFilters = useCallback(() => {
    setSearch('')
    setFClass('')
    setFSection('')
    setFGender('')
    setFReligion('')
    setFStatus('')
    setFDate('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }, [])
  const hasFilter = search || fClass || fSection || fGender || fReligion || fStatus || fDate

  return (
    <div>
      {/* Modals */}
      {approvingStudent && (
        <ApproveModal
          student={approvingStudent}
          isBn={isBn}
          onClose={() => setApprovingStudent(null)}
          onApprove={(sms, billingDate) => handleApprove(approvingStudent, sms, billingDate)}
        />
      )}
      {rejectingStudent && (
        <RejectModal
          student={rejectingStudent}
          isBn={isBn}
          onClose={() => setRejectingStudent(null)}
          onReject={(sms) => handleReject(rejectingStudent, sms)}
        />
      )}
      {editingStudent && (
        <EditModal
          student={editingStudent}
          isBn={isBn}
          onClose={() => setEditingStudent(null)}
          onSave={(d) => updateStudent(editingStudent.id, d)}
        />
      )}
      {viewingStudent && <ViewModal student={viewingStudent} isBn={isBn} onClose={() => setViewingStudent(null)} teacherMap={teacherMap} />}
      {showPDFModal && (
        <PDFOptionsModal
          count={selected.length > 0 ? selected.length : filtered.length}
          isBn={isBn}
          students={selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered}
          teachers={teachers}
          onClose={() => setShowPDFModal(false)}
          onDownload={handleListPDF}
        />
      )}

      {/* Stats */}
      <StatsBar stats={stats} isBn={isBn} isMobile={isMobile} />

      {/* Filters */}
      <FilterBar
        search={search} setSearch={setSearch}
        fClass={fClass} setFClass={setFClass}
        fSection={fSection} setFSection={setFSection}
        fGender={fGender} setFGender={setFGender}
        fReligion={fReligion} setFReligion={setFReligion}
        fStatus={fStatus} setFStatus={setFStatus}
        fDate={fDate} setFDate={setFDate}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        classOptions={classOptions} sectionsMap={sectionsMap} allSections={allSections}
        setPage={setPage} clearFilters={clearFilters} hasFilter={hasFilter}
        isBn={isBn} isMobile={isMobile}
      />

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{isBn ? 'প্রতি পাতায়:' : 'Per page:'}</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setPage(1)
            }}
            style={{
              padding: '5px 8px',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {PER_PAGE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {selected.length > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--brand)',
                background: 'var(--brand-light)',
                padding: '3px 10px',
                borderRadius: '0.375rem',
                fontWeight: 500,
              }}
            >
              {selected.length} {isBn ? 'টি নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>
        <ActionMenu
          showActionMenu={showActionMenu}
          setShowActionMenu={setShowActionMenu}
          actionMenuRef={actionMenuRef}
          exportExcel={exportExcel}
          setShowPDFModal={setShowPDFModal}
          isBn={isBn}
        />
      </div>

      {/* Table */}
      <AdmissionTable
        paginated={paginated}
        sp={sp}
        perPage={perPage}
        filtered={filtered}
        selected={selected}
        allSel={allSel}
        totalPages={totalPages}
        toggleAll={toggleAll}
        toggleOne={toggleOne}
        setPage={setPage}
        setViewingStudent={setViewingStudent}
        setEditingStudent={setEditingStudent}
        setApprovingStudent={setApprovingStudent}
        setRejectingStudent={setRejectingStudent}
        isBn={isBn}
      />
    </div>
  )
}
