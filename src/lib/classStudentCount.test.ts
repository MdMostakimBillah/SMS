import { describe, it, expect } from 'vitest'
import {
  isMatchingSession,
  isStudentInClass,
  isStudentInSection,
  getSectionStudentCount,
  getClassStudentCount,
} from './classStudentCount'
import type { ClassInfo, ClassSection } from '@/store/classStore'
import type { StudentAdmission } from '@/pages/students/admission/types'

describe('classStudentCount utilities', () => {
  const pscClass: ClassInfo = {
    id: 'CLS-01',
    name: 'PSC',
    nameBn: 'পিএসসি',
    startTime: '07:30',
    endTime: '14:30',
    subjectIds: [],
    sections: [
      {
        id: 'SEC-CLS-01-General',
        name: 'General',
        seatQuantity: 250,
        classTeacherId: '',
        subjectIds: [],
      },
    ],
  }

  const classOne: ClassInfo = {
    id: 'CLS-02',
    name: 'Class 1',
    nameBn: '১ম শ্রেণি',
    startTime: '07:30',
    endTime: '14:30',
    subjectIds: [],
    sections: [
      {
        id: 'SEC-CLS-02-A',
        name: 'A',
        seatQuantity: 40,
        classTeacherId: '',
        subjectIds: [],
      },
      {
        id: 'SEC-CLS-02-B',
        name: 'B',
        seatQuantity: 40,
        classTeacherId: '',
        subjectIds: [],
      },
    ],
  }

  const baseStudent: StudentAdmission = {
    id: 'ET-2026-00001',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
    status: 'pending',
    active: true,
    photo: '',
    nameEn: 'John Doe',
    nameBn: 'জন ডো',
    dob: '2015-01-01',
    gender: 'Male',
    bloodGroup: 'A+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    phone: '01700000000',
    email: '',
    class: 'PSC',
    section: 'General',
    roll: '1',
    academicYear: '2025-26',
    previousSchool: '',
    admissionDate: '2026-11-01',
    presentAddress: '',
    permanentAddress: '',
    district: '',
    fatherNameEn: '',
    fatherNameBn: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherNid: '',
    motherNameEn: '',
    motherNameBn: '',
    motherOccupation: '',
    motherPhone: '',
    motherNid: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    teacherId: '',
  }

  describe('isMatchingSession', () => {
    it('matches exact session strings', () => {
      expect(isMatchingSession('2025-26', '2025-26')).toBe(true)
    })

    it('matches session strings with 4-digit year differences', () => {
      expect(isMatchingSession('2025-2026', '2025-26')).toBe(true)
      expect(isMatchingSession('2025-26', '2025-2026')).toBe(true)
    })

    it('matches when either is empty or undefined', () => {
      expect(isMatchingSession(undefined, '2025-26')).toBe(true)
      expect(isMatchingSession('', '2025-26')).toBe(true)
      expect(isMatchingSession('2025-26', undefined)).toBe(true)
    })

    it('does not match different school years', () => {
      expect(isMatchingSession('2024-25', '2025-26')).toBe(false)
    })
  })

  describe('isStudentInClass', () => {
    it('matches exact name ("PSC")', () => {
      expect(isStudentInClass({ class: 'PSC' }, pscClass)).toBe(true)
      expect(isStudentInClass({ class: 'psc' }, pscClass)).toBe(true)
    })

    it('matches Bengali name ("পিএসসি")', () => {
      expect(isStudentInClass({ class: 'পিএসসি' }, pscClass)).toBe(true)
    })

    it('matches ID ("CLS-01")', () => {
      expect(isStudentInClass({ class: 'CLS-01' }, pscClass)).toBe(true)
    })

    it('matches numbered class variations for Class 1', () => {
      expect(isStudentInClass({ class: 'Class 1' }, classOne)).toBe(true)
      expect(isStudentInClass({ class: '1' }, classOne)).toBe(true)
      expect(isStudentInClass({ class: '01' }, classOne)).toBe(true)
      expect(isStudentInClass({ class: 'Class 01' }, classOne)).toBe(true)
      expect(isStudentInClass({ class: '১' }, classOne)).toBe(true)
    })

    it('does not match unrelated class', () => {
      expect(isStudentInClass({ class: 'Class 2' }, pscClass)).toBe(false)
      expect(isStudentInClass({ class: 'Class 2' }, classOne)).toBe(false)
    })
  })

  describe('isStudentInSection', () => {
    it('matches exact section name ("General")', () => {
      expect(isStudentInSection({ class: 'PSC', section: 'General' }, pscClass, pscClass.sections[0])).toBe(true)
    })

    it('matches with "Section" prefix ("Section General")', () => {
      expect(isStudentInSection({ class: 'PSC', section: 'Section General' }, pscClass, pscClass.sections[0])).toBe(true)
    })

    it('matches single section class when student section is blank', () => {
      expect(isStudentInSection({ class: 'PSC', section: '' }, pscClass, pscClass.sections[0])).toBe(true)
    })

    it('matches section A for multi-section class', () => {
      expect(isStudentInSection({ class: 'Class 1', section: 'A' }, classOne, classOne.sections[0])).toBe(true)
      expect(isStudentInSection({ class: 'Class 1', section: 'B' }, classOne, classOne.sections[0])).toBe(false)
    })
  })

  describe('getSectionStudentCount & getClassStudentCount', () => {
    const students: StudentAdmission[] = [
      // Pending student in PSC / General
      { ...baseStudent, id: 'ST-1', class: 'PSC', section: 'General', status: 'pending', active: true },
      // Approved student in PSC / Section General
      { ...baseStudent, id: 'ST-2', class: 'PSC', section: 'Section General', status: 'approved', active: true },
      // Deactivated student in PSC / General (should NOT count)
      { ...baseStudent, id: 'ST-3', class: 'PSC', section: 'General', status: 'approved', active: false },
      // Rejected student in PSC / General (should NOT count)
      { ...baseStudent, id: 'ST-4', class: 'PSC', section: 'General', status: 'rejected', active: true },
      // Student in Class 1 Section A
      { ...baseStudent, id: 'ST-5', class: '1', section: 'A', status: 'approved', active: true },
      // Student in different academic year
      { ...baseStudent, id: 'ST-6', class: 'PSC', section: 'General', academicYear: '2023-24', status: 'approved', active: true },
    ]

    it('counts active and pending students matching section', () => {
      const count = getSectionStudentCount(students, pscClass, pscClass.sections[0], '2025-26')
      // ST-1 (pending) + ST-2 (approved) = 2
      expect(count).toBe(2)
    })

    it('counts students for Class 1 Section A', () => {
      const countA = getSectionStudentCount(students, classOne, classOne.sections[0], '2025-26')
      const countB = getSectionStudentCount(students, classOne, classOne.sections[1], '2025-26')
      expect(countA).toBe(1)
      expect(countB).toBe(0)
    })

    it('counts total students for class', () => {
      const pscTotal = getClassStudentCount(students, pscClass, '2025-26')
      expect(pscTotal).toBe(2)
    })
  })
})
