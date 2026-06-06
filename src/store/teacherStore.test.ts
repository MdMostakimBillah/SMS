import { describe, it, expect, beforeEach } from 'vitest'
import { useTeacherStore } from './teacherStore'

describe('teacherStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useTeacherStore.setState({
      teachers: [],
      departments: [],
      subjects: [],
      designations: [],
      attendance: {},
    })
  })

  it('has empty state by default', () => {
    const state = useTeacherStore.getState()
    expect(state.teachers).toEqual([])
    expect(state.departments).toEqual([])
    expect(state.subjects).toEqual([])
    expect(state.designations).toEqual([])
    expect(state.attendance).toEqual({})
  })

  it('addTeacher prepends teacher', () => {
    const teacher = { id: 'TCH-1', name: 'Test Teacher', status: 'active' } as any
    useTeacherStore.getState().addTeacher(teacher)
    expect(useTeacherStore.getState().teachers).toHaveLength(1)
    expect(useTeacherStore.getState().teachers[0].id).toBe('TCH-1')
  })

  it('updateTeacher merges data and sets updatedAt', () => {
    useTeacherStore.getState().addTeacher({ id: 'TCH-1', name: 'Original', updatedAt: '' } as any)
    useTeacherStore.getState().updateTeacher('TCH-1', { name: 'Updated' })
    const t = useTeacherStore.getState().teachers[0]
    expect(t.name).toBe('Updated')
    expect(t.updatedAt).toBeTruthy()
  })

  it('deleteTeacher removes teacher', () => {
    useTeacherStore.getState().addTeacher({ id: 'TCH-1' } as any)
    useTeacherStore.getState().deleteTeacher('TCH-1')
    expect(useTeacherStore.getState().teachers).toHaveLength(0)
  })

  it('getNextTeacherId generates correct format', () => {
    const id = useTeacherStore.getState().getNextTeacherId()
    const year = new Date().getFullYear()
    expect(id).toMatch(new RegExp(`^TCH-${year}-\\d{3}$`))
  })

  it('addDepartment / deleteDepartment', () => {
    const dept = { id: 'DEPT-1', name: 'Science' } as any
    useTeacherStore.getState().addDepartment(dept)
    expect(useTeacherStore.getState().departments).toHaveLength(1)
    useTeacherStore.getState().deleteDepartment('DEPT-1')
    expect(useTeacherStore.getState().departments).toHaveLength(0)
  })

  it('addSubject / deleteSubject', () => {
    const sub = { id: 'SUB-1', name: 'Math' } as any
    useTeacherStore.getState().addSubject(sub)
    expect(useTeacherStore.getState().subjects).toHaveLength(1)
    useTeacherStore.getState().deleteSubject('SUB-1')
    expect(useTeacherStore.getState().subjects).toHaveLength(0)
  })

  it('addDesignation / deleteDesignation', () => {
    const des = { id: 'DES-1', name: 'Lecturer' } as any
    useTeacherStore.getState().addDesignation(des)
    expect(useTeacherStore.getState().designations).toHaveLength(1)
    useTeacherStore.getState().deleteDesignation('DES-1')
    expect(useTeacherStore.getState().designations).toHaveLength(0)
  })

  it('markAttendance creates day record with punches', () => {
    useTeacherStore.getState().addTeacher({ id: 'TCH-1', status: 'active' } as any)
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-1', 'present')
    const dayAtt = useTeacherStore.getState().attendance['2026-06-01']
    expect(dayAtt).toBeDefined()
    expect(dayAtt['TCH-1'].status).toBe('present')
    expect(dayAtt['TCH-1'].punches.length).toBeGreaterThan(0)
    expect(dayAtt['TCH-1'].punches[0].type).toBe('in')
  })

  it('markAttendance for absent does not add punches', () => {
    useTeacherStore.getState().addTeacher({ id: 'TCH-1', status: 'active' } as any)
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-1', 'absent')
    const dayAtt = useTeacherStore.getState().attendance['2026-06-01']
    expect(dayAtt['TCH-1'].status).toBe('absent')
    expect(dayAtt['TCH-1'].punches).toHaveLength(0)
  })

  it('markAllPresent only marks active teachers', () => {
    useTeacherStore.getState().addTeacher({ id: 'TCH-1', status: 'active' } as any)
    useTeacherStore.getState().addTeacher({ id: 'TCH-2', status: 'inactive' } as any)
    useTeacherStore.getState().markAllPresent('2026-06-01')
    const dayAtt = useTeacherStore.getState().attendance['2026-06-01']
    expect(dayAtt['TCH-1']).toBeDefined()
    expect(dayAtt['TCH-1'].status).toBe('present')
    expect(dayAtt['TCH-2']).toBeUndefined()
  })

  it('getAttendanceStats counts correctly', () => {
    useTeacherStore.getState().addTeacher({ id: 'TCH-1', status: 'active' } as any)
    useTeacherStore.getState().addTeacher({ id: 'TCH-2', status: 'active' } as any)
    useTeacherStore.getState().addTeacher({ id: 'TCH-3', status: 'active' } as any)
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-1', 'present')
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-2', 'absent')
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-3', 'on-leave')
    const stats = useTeacherStore.getState().getAttendanceStats('2026-06-01')
    expect(stats.present).toBe(1)
    expect(stats.absent).toBe(1)
    expect(stats.onLeave).toBe(1)
  })

  it('getAttendanceStats ignores inactive teachers', () => {
    useTeacherStore.getState().addTeacher({ id: 'TCH-1', status: 'active' } as any)
    useTeacherStore.getState().addTeacher({ id: 'TCH-2', status: 'inactive' } as any)
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-1', 'present')
    const stats = useTeacherStore.getState().getAttendanceStats('2026-06-01')
    expect(stats.present).toBe(1)
    expect(stats.absent).toBe(0)
  })
})
