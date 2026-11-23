import type { PortalChild } from '../types'
import type { StudentAdmission } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'

/**
 * Maps admitted students to portal child models using genuine student attributes.
 * Returns an empty array if no students are admitted (never uses mock/demo children).
 */
export function mapAdmittedStudentsToPortalChildren(
  admittedStudents: StudentAdmission[] | undefined
): PortalChild[] {
  if (!admittedStudents || admittedStudents.length === 0) {
    return []
  }

  const teachers = useTeacherStore.getState().teachers || []
  const classes = useClassStore.getState().classes || []

  return admittedStudents.map((s, idx) => {
    // Resolve class teacher from student teacherId or class section
    let teacher = s.teacherId ? teachers.find((t) => t.id === s.teacherId) : undefined
    if (!teacher && s.class) {
      const sClass = s.class.toLowerCase().trim()
      const cls = classes.find(
        (c) =>
          c.name.toLowerCase().trim() === sClass ||
          c.name.toLowerCase().trim() === `class ${sClass}` ||
          sClass === `class ${c.name.toLowerCase().trim()}` ||
          c.id === s.class
      )
      if (cls) {
        const sec = cls.sections.find(
          (sc) => sc.name.toLowerCase().trim() === (s.section || '').toLowerCase().trim()
        )
        if (sec?.classTeacherId) {
          teacher = teachers.find((t) => t.id === sec.classTeacherId)
        }
      }
    }

    const father = s.fatherNameEn || s.fatherNameBn || ''
    const mother = s.motherNameEn || s.motherNameBn || ''
    const guardian = s.guardianName || father || mother || ''
    const emergency = s.phone || s.guardianPhone || s.fatherPhone || s.motherPhone || ''

    return {
      id: s.id || `student-${idx}`,
      nameEn: s.nameEn || '',
      nameBn: s.nameBn || s.nameEn || '',
      photo: s.photo || '',
      class: s.class || '',
      section: s.section || '',
      roll: s.roll || '',
      academicYear: s.academicYear || '',
      dob: s.dob || '',
      gender: s.gender || '',
      bloodGroup: s.bloodGroup || '',
      fatherName: father,
      fatherPhone: s.fatherPhone || '',
      motherName: mother,
      motherPhone: s.motherPhone || '',
      guardianName: guardian,
      guardianPhone: s.guardianPhone || s.phone || s.fatherPhone || '',
      guardianRelation: s.guardianRelation || (father ? 'Father' : mother ? 'Mother' : 'Guardian'),
      emergencyContact: emergency,
      presentAddress: s.presentAddress || '',
      permanentAddress: s.permanentAddress || s.presentAddress || '',
      district: s.district || '',
      religion: s.religion || '',
      nationality: s.nationality || 'Bangladeshi',
      admissionDate: s.admissionDate || s.createdAt || '',
      previousSchool: s.previousSchool || '',
      fatherOccupation: s.fatherOccupation || '',
      motherOccupation: s.motherOccupation || '',
      fatherNid: s.fatherNid || '',
      motherNid: s.motherNid || '',
      studentPhone: s.phone || '',
      studentEmail: s.email || '',
      status: s.status || 'approved',
      classTeacherName: teacher ? teacher.nameEn || teacher.nameBn || '' : '',
      classTeacherPhone: teacher?.phone || '',
      classTeacherEmail: teacher?.email || '',
    }
  })
}
