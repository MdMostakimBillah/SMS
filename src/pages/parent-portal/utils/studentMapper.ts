import type { PortalChild } from '../types'
import type { StudentAdmission } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import type { User } from '@/contexts/AuthContext'

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

function normalizeDigits(val?: string | null): string {
  return (val || '').replace(/\D/g, '')
}

/**
 * Filters portal children to only those belonging to the authenticated parent/guardian account,
 * including siblings linked to the same guardian phone or email.
 * Institution admins and super admins receive the full list.
 */
export function resolvePortalChildrenForUser(
  allChildren: PortalChild[],
  user: User | null | undefined,
  isParentAccount: boolean
): PortalChild[] {
  if (!isParentAccount || !user) {
    return allChildren
  }

  const userEmail = (user.email || '').trim().toLowerCase()
  const userEmailPrefix = userEmail.split('@')[0] || ''
  const userDigits = normalizeDigits(user.email || user.id)

  // First pass: direct match via studentId, email, or phone
  const directMatches = allChildren.filter((child) => {
    if (user.studentId && child.id === user.studentId) return true
    if (userEmail && child.studentEmail && child.studentEmail.trim().toLowerCase() === userEmail) return true

    const phones = [child.guardianPhone, child.fatherPhone, child.motherPhone, child.studentPhone]
      .map(normalizeDigits)
      .filter((p) => p.length >= 8)

    if (userDigits.length >= 8 && phones.some((p) => p.endsWith(userDigits.slice(-8)) || userDigits.endsWith(p.slice(-8)))) {
      return true
    }
    if (userEmailPrefix && phones.some((p) => p === userEmailPrefix)) {
      return true
    }
    return false
  })

  if (directMatches.length === 0) {
    return []
  }

  // Second pass: include siblings sharing the same guardian/father phone
  const familyPhones = new Set<string>()
  for (const m of directMatches) {
    for (const raw of [m.guardianPhone, m.fatherPhone, m.motherPhone]) {
      const digits = normalizeDigits(raw)
      if (digits.length >= 8) {
        familyPhones.add(digits.slice(-8))
      }
    }
  }

  if (familyPhones.size === 0) {
    return directMatches
  }

  return allChildren.filter((child) => {
    if (directMatches.some((d) => d.id === child.id)) return true
    return [child.guardianPhone, child.fatherPhone, child.motherPhone].some((raw) => {
      const digits = normalizeDigits(raw)
      return digits.length >= 8 && familyPhones.has(digits.slice(-8))
    })
  })
}
