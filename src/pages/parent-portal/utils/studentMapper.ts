import type { PortalChild } from '../types'
import { DEMO_CHILDREN } from '../mockData'
import type { StudentAdmission } from '@/store/admissionStore'

export function mapAdmittedStudentsToPortalChildren(
  admittedStudents: StudentAdmission[] | undefined
): PortalChild[] {
  if (admittedStudents && admittedStudents.length > 0) {
    return admittedStudents.map((s, idx) => ({
      id: s.id || `student-${idx}`,
      nameEn: s.nameEn || `Student ${idx + 1}`,
      nameBn: s.nameBn || s.nameEn || `শিক্ষার্থী ${idx + 1}`,
      photo: s.photo || '',
      class: s.class || 'Class 8',
      section: s.section || 'A',
      roll: s.roll || `0${idx + 1}`,
      academicYear: s.academicYear || '2026',
      dob: s.dob || '2012-05-14',
      gender: s.gender || 'Male',
      bloodGroup: s.bloodGroup || 'B+',
      fatherName: s.fatherNameEn || 'Dr. Mahfuzur Rahman',
      fatherPhone: s.fatherPhone || s.phone || '+880 1711-234567',
      motherName: s.motherNameEn || 'Nasrin Sultana',
      motherPhone: s.motherPhone || '+880 1819-345678',
      guardianName: s.guardianName || s.fatherNameEn || 'Dr. Mahfuzur Rahman',
      guardianPhone: s.guardianPhone || s.phone || '+880 1711-234567',
      guardianRelation: s.guardianRelation || 'Father',
      emergencyContact: s.phone || s.guardianPhone || '+880 1711-234567',
      presentAddress: s.presentAddress || 'House 14, Road 5, Dhanmondi, Dhaka',
      classTeacherName: 'Md. Anwar Hossain',
      classTeacherPhone: '+880 1712-889900',
      classTeacherEmail: 'anwar.hossain@edutech.edu.bd',
    }))
  }
  return DEMO_CHILDREN
}
