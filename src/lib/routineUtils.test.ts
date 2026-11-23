import { describe, it, expect } from 'vitest'
import {
  normalizeClassString,
  matchRoutineForStudent,
  isDateRoutineWeekend,
  getRoutineWeekendDayNames,
  formatPunchMethod,
} from './routineUtils'
import type { ClassInfo, ClassRoutine } from '@/store/classStore'

describe('routineUtils', () => {
  describe('normalizeClassString', () => {
    it('extracts number from "Class 10"', () => {
      expect(normalizeClassString('Class 10')).toBe('10')
    })

    it('extracts number from "Grade 8"', () => {
      expect(normalizeClassString('Grade 8')).toBe('8')
    })

    it('returns lowercase for non-numeric classes like "Play"', () => {
      expect(normalizeClassString('Play')).toBe('play')
    })
  })

  describe('matchRoutineForStudent', () => {
    const mockClasses: ClassInfo[] = [
      {
        id: 'cls-10',
        name: 'Class 10',
        nameBn: '১০ম শ্রেণি',
        sections: [
          {
            id: 'sec-a',
            name: 'A',
            seatQuantity: 40,
            classTeacherId: 'tch-1',
            subjectIds: [],
          },
          {
            id: 'sec-b',
            name: 'B',
            seatQuantity: 40,
            classTeacherId: 'tch-2',
            subjectIds: [],
          },
        ],
        subjectIds: [],
        startTime: '08:00',
        endTime: '14:00',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]

    const mockRoutines: ClassRoutine[] = [
      {
        classId: 'cls-10',
        sectionId: 'sec-a',
        periodDuration: 45,
        weekendDays: [6], // Friday (index 6 in routine order)
        periods: [],
      },
      {
        classId: 'cls-10',
        sectionId: 'sec-b',
        periodDuration: 40,
        weekendDays: [0, 6], // Saturday (0) and Friday (6)
        periods: [],
      },
    ]

    it('matches section-specific routine with class ID and section ID', () => {
      const routine = matchRoutineForStudent('cls-10', 'sec-a', mockClasses, mockRoutines)
      expect(routine).toBeDefined()
      expect(routine?.sectionId).toBe('sec-a')
      expect(routine?.weekendDays).toEqual([6])
    })

    it('matches section-specific routine with friendly class name and section name', () => {
      const routine = matchRoutineForStudent('Class 10', 'A', mockClasses, mockRoutines)
      expect(routine).toBeDefined()
      expect(routine?.sectionId).toBe('sec-a')
    })

    it('matches section B routine', () => {
      const routine = matchRoutineForStudent('10', 'B', mockClasses, mockRoutines)
      expect(routine).toBeDefined()
      expect(routine?.sectionId).toBe('sec-b')
      expect(routine?.weekendDays).toEqual([0, 6])
    })

    it('falls back to class-wide routine if section not found', () => {
      const generalRoutines: ClassRoutine[] = [
        {
          classId: 'cls-10',
          sectionId: '',
          periodDuration: 40,
          weekendDays: [6],
          periods: [],
        },
      ]
      const routine = matchRoutineForStudent('Class 10', 'Unknown', mockClasses, generalRoutines)
      expect(routine).toBeDefined()
      expect(routine?.classId).toBe('cls-10')
    })
  })

  describe('isDateRoutineWeekend', () => {
    // 2026-11-20 is Friday (getDay() = 5, routineDayIndex = 6)
    // 2026-11-21 is Saturday (getDay() = 6, routineDayIndex = 0)
    // 2026-11-22 is Sunday (getDay() = 0, routineDayIndex = 1)
    // 2026-11-23 is Monday (getDay() = 1, routineDayIndex = 2)
    const friday = new Date('2026-11-20T10:00:00Z')
    const saturday = new Date('2026-11-21T10:00:00Z')
    const sunday = new Date('2026-11-22T10:00:00Z')
    const monday = new Date('2026-11-23T10:00:00Z')

    it('identifies Friday as weekend when routine has weekendDays: [6]', () => {
      const routine: ClassRoutine = {
        classId: 'c1',
        sectionId: 's1',
        periodDuration: 40,
        weekendDays: [6], // Friday
        periods: [],
      }
      expect(isDateRoutineWeekend(friday, routine)).toBe(true)
      expect(isDateRoutineWeekend(saturday, routine)).toBe(false)
      expect(isDateRoutineWeekend(monday, routine)).toBe(false)
    })

    it('identifies both Friday and Saturday when routine has [0, 6]', () => {
      const routine: ClassRoutine = {
        classId: 'c1',
        sectionId: 's1',
        periodDuration: 40,
        weekendDays: [0, 6], // Saturday and Friday
        periods: [],
      }
      expect(isDateRoutineWeekend(friday, routine)).toBe(true)
      expect(isDateRoutineWeekend(saturday, routine)).toBe(true)
      expect(isDateRoutineWeekend(sunday, routine)).toBe(false)
    })

    it('handles legacy weekendDays: [5] (where 5 represents Friday)', () => {
      const routine: ClassRoutine = {
        classId: 'c1',
        sectionId: 's1',
        periodDuration: 40,
        weekendDays: [5],
        periods: [],
      }
      expect(isDateRoutineWeekend(friday, routine)).toBe(true)
    })

    it('defaults to Friday as weekend when routine is undefined or has empty weekendDays', () => {
      expect(isDateRoutineWeekend(friday)).toBe(true)
      expect(isDateRoutineWeekend(saturday)).toBe(false)
      expect(isDateRoutineWeekend(sunday)).toBe(false)
    })
  })

  describe('formatPunchMethod', () => {
    it('formats RFID method in English and Bengali', () => {
      expect(formatPunchMethod('rfid', false)).toBe('RFID Smart Card')
      expect(formatPunchMethod('rfid', true)).toBe('আরএফআইডি স্মার্ট কার্ড')
    })

    it('formats fingerprint and facial recognition', () => {
      expect(formatPunchMethod('fingerprint', false)).toBe('Biometric Fingerprint')
      expect(formatPunchMethod('face', false)).toBe('Facial Recognition')
    })
  })
})
