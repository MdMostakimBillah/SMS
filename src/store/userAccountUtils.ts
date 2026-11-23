import type { StudentAdmission } from '@/pages/students/admission/types'
import type { Teacher, Department } from '@/pages/teachers/types'
import type { UserAccount } from './userAccountStore'

export function generateRandomPin(length = 6): string {
  let pin = ''
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString()
  }
  return pin
}

export function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let res = 'Edu#'
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return res
}

export function buildStudentAndParentAccounts(
  students: StudentAdmission[],
  school: { id: string; name: string; slug?: string },
  existingMap: Map<string, UserAccount>
): UserAccount[] {
  const now = new Date().toISOString().split('T')[0]
  const sId = school.id || school.slug || 'INST'
  const sName = school.name || 'Institution'
  const result: UserAccount[] = []

  students.forEach((s) => {
    const stuAccId = `acc-stu-${s.id}`
    const parAccId = `acc-par-${s.id}`

    const existingStu = existingMap.get(stuAccId)
    const stuUsername = existingStu?.username || (s.id || `stu_${s.roll || '1'}`).trim()
    const stuPassword = existingStu?.password || '123456'

    const stuAcc: UserAccount = {
      id: stuAccId,
      schoolId: existingStu?.schoolId || sId,
      schoolName: existingStu?.schoolName || sName,
      role: 'student',
      studentId: s.id,
      studentNameEn: s.nameEn || '',
      studentNameBn: s.nameBn || s.nameEn || '',
      guardianName: s.guardianName,
      guardianRelation: s.guardianRelation,
      class: s.class || '',
      section: s.section || '',
      roll: s.roll || '',
      username: stuUsername,
      password: stuPassword,
      phone: s.phone || '',
      email: s.email || '',
      status: existingStu?.status || (s.status === 'approved' ? 'active' : 'pending'),
      createdAt: existingStu?.createdAt || s.admissionDate || now,
      updatedAt: existingStu ? existingStu.updatedAt : now,
      lastLogin: existingStu?.lastLogin,
    }
    result.push(stuAcc)

    const existingPar = existingMap.get(parAccId)
    const parUsername = existingPar?.username || (s.guardianPhone || s.fatherPhone || `p_${s.id}`).trim()
    const parPassword = existingPar?.password || '123456'

    const parAcc: UserAccount = {
      id: parAccId,
      schoolId: existingPar?.schoolId || sId,
      schoolName: existingPar?.schoolName || sName,
      role: 'parent',
      studentId: s.id,
      studentNameEn: s.nameEn || '',
      studentNameBn: s.nameBn || s.nameEn || '',
      guardianName: s.guardianName || s.fatherNameEn || '',
      guardianRelation: s.guardianRelation || 'Parent',
      class: s.class || '',
      section: s.section || '',
      roll: s.roll || '',
      username: parUsername,
      password: parPassword,
      phone: s.guardianPhone || s.fatherPhone || '',
      email: s.email || '',
      status: existingPar?.status || (s.status === 'approved' ? 'active' : 'pending'),
      createdAt: existingPar?.createdAt || s.admissionDate || now,
      updatedAt: existingPar ? existingPar.updatedAt : now,
      lastLogin: existingPar?.lastLogin,
    }
    result.push(parAcc)
  })

  return result
}

export function buildTeacherAccounts(
  teachers: Teacher[],
  school: { id: string; name: string; slug?: string },
  departments: Department[] | undefined,
  existingMap: Map<string, UserAccount>
): UserAccount[] {
  const now = new Date().toISOString().split('T')[0]
  const sId = school.id || school.slug || 'INST'
  const sName = school.name || 'Institution'
  const deptMap = new Map<string, string>()
  if (departments) {
    departments.forEach((d) => deptMap.set(d.id, d.name))
  }

  return teachers.map((t) => {
    const tchAccId = `acc-tch-${t.id}`
    const existingTch = existingMap.get(tchAccId)
    const deptName = deptMap.get(t.departmentId) || t.departmentId || ''
    const tchUsername = existingTch?.username || (t.phone || t.email || t.id).trim()
    const tchPassword = existingTch?.password || '123456'

    return {
      id: tchAccId,
      schoolId: existingTch?.schoolId || sId,
      schoolName: existingTch?.schoolName || sName,
      role: 'teacher',
      studentId: t.id,
      staffId: t.id,
      studentNameEn: t.nameEn || '',
      studentNameBn: t.nameBn || t.nameEn || '',
      department: deptName,
      designation: t.designation || 'Teacher',
      class: '',
      section: '',
      roll: '',
      username: tchUsername,
      password: tchPassword,
      phone: t.phone || '',
      email: t.email || '',
      status: existingTch?.status || (t.status === 'active' ? 'active' : 'pending'),
      createdAt: existingTch?.createdAt || t.joiningDate || now,
      updatedAt: existingTch ? existingTch.updatedAt : now,
      lastLogin: existingTch?.lastLogin,
    }
  })
}
