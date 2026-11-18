import { useCallback } from 'react'
import { XLSX } from '@/lib/excelExport'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { sendTemplateSMS } from '@/store/messageStore'
import { generateListPDF } from '../listPdfTemplate'
import { printRawHTML } from '@/lib/pdf'
import { formatGender } from '@/lib/gender'
import type { ListPDFOptions } from '../listPdfTemplate'
import type { StudentAdmission } from '../types'

export function useAdmissionActions() {
  const approveStudent = useAdmissionStore((s) => s.approveStudent)
  const rejectStudent = useAdmissionStore((s) => s.rejectStudent)
  const institution = useClassStore((s) => s.institution)

  const handleApprove = useCallback(
    (student: StudentAdmission, sms: boolean, billingDate: string) => {
      approveStudent(student.id, billingDate)
      if (sms && student.phone) {
        const instId = (institution as any)?.id || institution?.eiin || 'inst-default'
        const instName = institution.name || 'Institution'
        sendTemplateSMS({
          studentId: student.id,
          studentName: student.nameEn || student.nameBn,
          phoneNumber: student.phone,
          subject: `Admission Approved - ${instName}`,
          body: `Dear guardian/student, your admission has been approved! Student ID: ${student.id}, Class: ${student.class}. Welcome to ${instName}.`,
          institutionId: instId,
          institutionName: instName,
        })
      }
    },
    [approveStudent, institution]
  )

  const handleReject = useCallback(
    (student: StudentAdmission, sms: boolean) => {
      rejectStudent(student.id)
      if (sms && student.phone) {
        const instId = (institution as any)?.id || institution?.eiin || 'inst-default'
        const instName = institution.name || 'Institution'
        sendTemplateSMS({
          studentId: student.id,
          studentName: student.nameEn || student.nameBn,
          phoneNumber: student.phone,
          subject: `Admission Update - ${instName}`,
          body: `Dear guardian/student, your admission application (ID: ${student.id}) could not be accepted at this time. Thank you. - ${instName}`,
          institutionId: instId,
          institutionName: instName,
        })
      }
    },
    [rejectStudent, institution]
  )

  const exportExcel = useCallback(
    (selected: string[], filtered: StudentAdmission[]) => {
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
        Gender: formatGender(s.gender),
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
    },
    [institution]
  )

  const handleListPDF = useCallback(
    (selected: string[], filtered: StudentAdmission[], opts: ListPDFOptions, onDone: () => void) => {
      const list = selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered
      const html = generateListPDF(list, { ...opts, institutionName: institution.name })
      printRawHTML(html, 800)
      onDone()
    },
    [institution]
  )

  return { handleApprove, handleReject, exportExcel, handleListPDF }
}
