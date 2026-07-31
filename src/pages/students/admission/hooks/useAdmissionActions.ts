import { useCallback } from 'react'
import { XLSX } from '@/lib/excelExport'
import { logger } from '@/lib/logger'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { generateListPDF } from '../listPdfTemplate'
import { printRawHTML } from '@/lib/pdf'
import type { ListPDFOptions } from '../listPdfTemplate'
import type { StudentAdmission } from '../types'

export function useAdmissionActions() {
  const approveStudent = useAdmissionStore((s) => s.approveStudent)
  const rejectStudent = useAdmissionStore((s) => s.rejectStudent)
  const institution = useClassStore((s) => s.institution)

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
