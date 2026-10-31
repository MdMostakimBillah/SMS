import type { StudentRecord } from './api'
import type { StudentAdmission, AdmissionStatus } from '@/pages/students/admission/types'

export function serverStudentToStudent(rec: StudentRecord): StudentAdmission {
  return {
    id: rec.id,
    createdAt: rec.createdAt ? new Date(rec.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    updatedAt: rec.updatedAt ? new Date(rec.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: (rec.status as AdmissionStatus) || 'approved',
    active: rec.active !== undefined ? rec.active : rec.status === 'approved',
    approvedAt: rec.approvedAt || undefined,
    approvedBy: rec.approvedBy || undefined,
    inactiveAt: rec.inactiveAt || undefined,
    inactiveReason: rec.inactiveReason || undefined,
    photo: rec.photo || '',
    nameEn: rec.nameEn || '',
    nameBn: rec.nameBn || '',
    dob: rec.dob || '',
    gender: rec.gender || '',
    bloodGroup: rec.bloodGroup || '',
    religion: rec.religion || '',
    nationality: rec.nationality || 'Bangladeshi',
    phone: rec.phone || '',
    email: rec.email || '',
    class: rec.class || '',
    section: rec.section || '',
    roll: rec.roll || '',
    academicYear: rec.academicYear || '',
    previousSchool: rec.previousSchool || '',
    admissionDate: rec.admissionDate || (rec.createdAt ? new Date(rec.createdAt).toISOString().split('T')[0] : ''),
    presentAddress: rec.presentAddress || '',
    permanentAddress: rec.permanentAddress || '',
    district: rec.district || '',
    fatherNameEn: rec.fatherNameEn || '',
    fatherNameBn: rec.fatherNameBn || '',
    fatherOccupation: rec.fatherOccupation || '',
    fatherPhone: rec.fatherPhone || '',
    fatherNid: rec.fatherNid || '',
    motherNameEn: rec.motherNameEn || '',
    motherNameBn: rec.motherNameBn || '',
    motherOccupation: rec.motherOccupation || '',
    motherPhone: rec.motherPhone || '',
    motherNid: rec.motherNid || '',
    guardianName: rec.guardianName || '',
    guardianRelation: rec.guardianRelation || '',
    guardianPhone: rec.guardianPhone || '',
    teacherId: rec.teacherId || '',
    billingDate: rec.billingDate || undefined,
  }
}

export function studentToPayload(s: Partial<StudentAdmission>): Partial<StudentRecord> {
  const payload: Partial<StudentRecord> = {}
  if (s.id) payload.id = s.id
  if (s.nameEn !== undefined) payload.nameEn = s.nameEn.trim()
  if (s.nameBn !== undefined) payload.nameBn = s.nameBn.trim() || null
  if (s.phone !== undefined) payload.phone = s.phone.trim() || null
  if (s.email !== undefined) payload.email = s.email.trim() || null
  if (s.photo !== undefined) payload.photo = s.photo || null
  if (s.class !== undefined) payload.class = s.class.trim() || null
  if (s.section !== undefined) payload.section = s.section.trim() || null
  if (s.roll !== undefined) payload.roll = s.roll.trim() || null
  if (s.academicYear !== undefined) payload.academicYear = s.academicYear.trim() || null
  if (s.dob !== undefined) payload.dob = s.dob.trim() || null
  if (s.gender !== undefined) payload.gender = s.gender.trim() || null
  if (s.bloodGroup !== undefined) payload.bloodGroup = s.bloodGroup.trim() || null
  if (s.religion !== undefined) payload.religion = s.religion.trim() || null
  if (s.nationality !== undefined) payload.nationality = s.nationality.trim() || null
  if (s.admissionDate !== undefined) payload.admissionDate = s.admissionDate.trim() || null
  if (s.previousSchool !== undefined) payload.previousSchool = s.previousSchool.trim() || null
  if (s.presentAddress !== undefined) payload.presentAddress = s.presentAddress.trim() || null
  if (s.permanentAddress !== undefined) payload.permanentAddress = s.permanentAddress.trim() || null
  if (s.status !== undefined) payload.status = s.status
  if (s.fatherNameEn !== undefined) payload.fatherNameEn = s.fatherNameEn.trim() || null
  if (s.fatherNameBn !== undefined) payload.fatherNameBn = s.fatherNameBn.trim() || null
  if (s.fatherOccupation !== undefined) payload.fatherOccupation = s.fatherOccupation.trim() || null
  if (s.fatherPhone !== undefined) payload.fatherPhone = s.fatherPhone.trim() || null
  if (s.fatherNid !== undefined) payload.fatherNid = s.fatherNid.trim() || null
  if (s.motherNameEn !== undefined) payload.motherNameEn = s.motherNameEn.trim() || null
  if (s.motherNameBn !== undefined) payload.motherNameBn = s.motherNameBn.trim() || null
  if (s.motherOccupation !== undefined) payload.motherOccupation = s.motherOccupation.trim() || null
  if (s.motherPhone !== undefined) payload.motherPhone = s.motherPhone.trim() || null
  if (s.motherNid !== undefined) payload.motherNid = s.motherNid.trim() || null
  if (s.guardianName !== undefined) payload.guardianName = s.guardianName.trim() || null
  if (s.guardianRelation !== undefined) payload.guardianRelation = s.guardianRelation.trim() || null
  if (s.guardianPhone !== undefined) payload.guardianPhone = s.guardianPhone.trim() || null
  if (s.district !== undefined) payload.district = s.district.trim() || null
  if (s.teacherId !== undefined) payload.teacherId = s.teacherId.trim() || null
  if (s.billingDate !== undefined) payload.billingDate = s.billingDate.trim() || null
  if (s.approvedAt !== undefined) payload.approvedAt = s.approvedAt.trim() || null
  if (s.approvedBy !== undefined) payload.approvedBy = s.approvedBy.trim() || null
  if (s.inactiveAt !== undefined) payload.inactiveAt = s.inactiveAt.trim() || null
  if (s.inactiveReason !== undefined) payload.inactiveReason = s.inactiveReason.trim() || null
  if (s.active !== undefined) payload.active = s.active

  return payload
}
