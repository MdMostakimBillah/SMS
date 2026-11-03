import { describe, it, expect, beforeEach } from 'vitest'
import { useAdmissionStore } from './admissionStore'

describe('admissionStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAdmissionStore.setState({ students: [] })
  })

  it('has empty students by default', () => {
    expect(useAdmissionStore.getState().students).toEqual([])
  })

  it('addStudent prepends student', () => {
    const student = { id: 'STU-1', name: 'Test', status: 'pending' } as any
    useAdmissionStore.getState().addStudent(student)
    const students = useAdmissionStore.getState().students
    expect(students).toHaveLength(1)
    expect(students[0].id).toBe('STU-1')
  })

  it('addStudent prepends to beginning', () => {
    useAdmissionStore.getState().addStudent({ id: 'STU-1', name: 'First' } as any)
    useAdmissionStore.getState().addStudent({ id: 'STU-2', name: 'Second' } as any)
    const students = useAdmissionStore.getState().students
    expect(students[0].id).toBe('STU-2')
    expect(students[1].id).toBe('STU-1')
  })

  it('updateStudent merges partial data and sets updatedAt', () => {
    useAdmissionStore.getState().addStudent({ id: 'STU-1', name: 'Test', updatedAt: '' } as any)
    useAdmissionStore.getState().updateStudent('STU-1', { name: 'Updated' })
    const student = useAdmissionStore.getState().students[0]
    expect(student.name).toBe('Updated')
    expect(student.updatedAt).toBeTruthy()
  })

  it('approveStudent sets status and approvedAt', () => {
    useAdmissionStore.getState().addStudent({ id: 'STU-1', status: 'pending', approvedAt: '' } as any)
    useAdmissionStore.getState().approveStudent('STU-1')
    const student = useAdmissionStore.getState().students[0]
    expect(student.status).toBe('approved')
    expect(student.approvedAt).toBeTruthy()
  })

  it('rejectStudent sets status', () => {
    useAdmissionStore.getState().addStudent({ id: 'STU-1', status: 'pending' } as any)
    useAdmissionStore.getState().rejectStudent('STU-1')
    expect(useAdmissionStore.getState().students[0].status).toBe('rejected')
  })

  it('getNextId generates correct format', () => {
    const id = useAdmissionStore.getState().getNextId()
    const year = new Date().getFullYear()
    expect(id).toMatch(new RegExp(`^ET-${year}-\\d{5}$`))
  })

  it('getNextId increments with student count', () => {
    const id1 = useAdmissionStore.getState().getNextId()
    const year = new Date().getFullYear()
    useAdmissionStore.getState().addStudent({ id: `ET-${year}-10099` } as any)
    const id2 = useAdmissionStore.getState().getNextId()
    expect(id2).toBe(`ET-${year}-10100`)
  })

  it('updateStudent does nothing for non-existent id', () => {
    useAdmissionStore.getState().addStudent({ id: 'STU-1', name: 'Test' } as any)
    useAdmissionStore.getState().updateStudent('STU-999', { name: 'Nope' })
    expect(useAdmissionStore.getState().students[0].name).toBe('Test')
  })

  it('bulkUpdateStudents applies batch updates in a single pass', () => {
    // Add 10 students
    for (let i = 1; i <= 10; i++) {
      useAdmissionStore.getState().addStudent({
        id: `STU-${i}`,
        name: `Student ${i}`,
        className: 'Class 5',
        section: 'A',
      } as any)
    }

    // Bulk update 5 of them to Class 6, Section B
    useAdmissionStore.getState().bulkUpdateStudents([
      { id: 'STU-1', data: { className: 'Class 6', section: 'B' } },
      { id: 'STU-3', data: { className: 'Class 6', section: 'B' } },
      { id: 'STU-5', data: { className: 'Class 6', section: 'B' } },
      { id: 'STU-999', data: { className: 'Class 6', section: 'B' } }, // Non-existent, should be ignored
    ])

    const students = useAdmissionStore.getState().students
    const stu1 = students.find((s) => s.id === 'STU-1')
    const stu2 = students.find((s) => s.id === 'STU-2')
    const stu3 = students.find((s) => s.id === 'STU-3')
    const stu5 = students.find((s) => s.id === 'STU-5')

    expect(stu1?.className).toBe('Class 6')
    expect(stu1?.section).toBe('B')
    expect(stu1?.updatedAt).toBeTruthy()

    expect(stu2?.className).toBe('Class 5')
    expect(stu2?.section).toBe('A')

    expect(stu3?.className).toBe('Class 6')
    expect(stu5?.className).toBe('Class 6')
  })

  it('bulkUpdateStudents handles 1000+ students with high performance', () => {
    // Populate 1200 students
    const initialStudents = Array.from({ length: 1200 }, (_, idx) => ({
      id: `STU-${idx + 1}`,
      name: `Student ${idx + 1}`,
      className: 'Class 8',
      section: 'A',
      gender: idx % 2 === 0 ? 'male' : 'female',
      status: 'approved',
    })) as any[]

    useAdmissionStore.setState({ students: initialStudents })

    const updates = initialStudents.map((s) => ({
      id: s.id,
      data: { section: 'C', status: 'enrolled' as const },
    }))

    const start = performance.now()
    useAdmissionStore.getState().bulkUpdateStudents(updates)
    const duration = performance.now() - start

    // Bulk update of 1200 students in memory should take well under 100ms
    expect(duration).toBeLessThan(100)

    const updated = useAdmissionStore.getState().students
    expect(updated).toHaveLength(1200)
    expect(updated[0].section).toBe('C')
    expect(updated[1199].section).toBe('C')
  })
})
