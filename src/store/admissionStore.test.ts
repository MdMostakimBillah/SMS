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
    useAdmissionStore.getState().addStudent({ id: 'x' } as any)
    const id2 = useAdmissionStore.getState().getNextId()
    expect(id2 > id1).toBe(true)
  })

  it('updateStudent does nothing for non-existent id', () => {
    useAdmissionStore.getState().addStudent({ id: 'STU-1', name: 'Test' } as any)
    useAdmissionStore.getState().updateStudent('STU-999', { name: 'Nope' })
    expect(useAdmissionStore.getState().students[0].name).toBe('Test')
  })
})
