import { describe, it, expect } from 'vitest'
import {
  generateSimpleTeacherId,
  teacherToPayload,
  serverTeacherToTeacher,
  apiErrorMessage,
} from './teacherMappers'
import type { Teacher } from '@/pages/teachers/types'

describe('generateSimpleTeacherId', () => {
  it('generates ET0001 for empty teachers list', () => {
    expect(generateSimpleTeacherId([])).toBe('ET0001')
  })

  it('increments sequentially from existing ET IDs', () => {
    const teachers = [{ id: 'ET0001' }, { id: 'ET0002' }, { id: 'ET0003' }]
    expect(generateSimpleTeacherId(teachers)).toBe('ET0004')
  })

  it('finds maximum numeric sequence and increments', () => {
    const teachers = [{ id: 'ET0001' }, { id: 'ET0042' }]
    expect(generateSimpleTeacherId(teachers)).toBe('ET0043')
  })

  it('handles mixed legacy UUIDs or custom IDs alongside ET IDs', () => {
    const teachers = [
      { id: '9504a261-0000-0000-0000-000000000000' },
      { id: 'ET0007' },
      { id: 'tch-old-123' },
    ]
    expect(generateSimpleTeacherId(teachers)).toBe('ET0008')
  })

  it('falls back to length + 1 when no ET prefix exists', () => {
    const teachers = [{ id: 'custom-1' }, { id: 'custom-2' }]
    expect(generateSimpleTeacherId(teachers)).toBe('ET0003')
  })
})

describe('apiErrorMessage', () => {
  it('returns appropriate message for 401', () => {
    expect(apiErrorMessage({ status: 401, message: 'Unauthorized' }, false)).toContain('Session expired')
    expect(apiErrorMessage({ status: 401, message: 'Unauthorized' }, true)).toContain('মেয়াদ শেষ')
  })

  it('returns appropriate message for 403', () => {
    expect(apiErrorMessage({ status: 403, message: 'Forbidden' }, false)).toContain('not allowed')
  })

  it('returns appropriate message for 404', () => {
    expect(apiErrorMessage({ status: 404, message: 'Not found' }, false)).toContain('Record not found')
  })
})

describe('teacherToPayload & serverTeacherToTeacher', () => {
  it('maps teacher fields properly to and from server shape', () => {
    const teacher: Teacher = {
      id: 'ET0001',
      nameEn: 'Rahim Uddin',
      nameBn: 'রহিম উদ্দিন',
      gender: 'male',
      phone: '01700000000',
      email: 'rahim@example.com',
      designation: 'Assistant Teacher',
      departmentId: 'DEP-01',
      subjectIds: ['SUB-01', 'SUB-02'],
      salary: 25000,
      joiningDate: '2025-01-01',
      qualification: 'B.Ed',
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    const payload = teacherToPayload(teacher)
    expect(payload.nameEn).toBe('Rahim Uddin')
    expect(payload.salary).toBe('25000')

    const backToTeacher = serverTeacherToTeacher({
      id: 'ET0001',
      schoolId: 'sch-1',
      nameEn: 'Rahim Uddin',
      nameBn: 'রহিম উদ্দিন',
      gender: 'male',
      phone: '01700000000',
      email: 'rahim@example.com',
      designation: 'Assistant Teacher',
      departmentId: 'DEP-01',
      subjectIds: ['SUB-01', 'SUB-02'],
      salary: 25000,
      joiningDate: '2025-01-01',
      qualification: 'B.Ed',
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    })

    expect(backToTeacher.id).toBe('ET0001')
    expect(backToTeacher.salary).toBe(25000)
  })
})
