import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useClassStore,
  extractClassNumber,
  getClassOptions,
  buildSectionsMap,
  getAllSections,
  mapSchoolToInstitutionSettings,
  type ClassInfo,
} from './classStore'
import { classesApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  classesApi: {
    get: vi.fn(),
    update: vi.fn(),
    updateRoutines: vi.fn(),
  },
  authApi: {
    getPublicSchool: vi.fn(),
    updateSchool: vi.fn(),
  },
}))

describe('classStore pure functions', () => {
  it('extractClassNumber extracts number from "Class 1"', () => {
    expect(extractClassNumber('Class 1')).toBe('1')
  })

  it('extractClassNumber returns original if no digits', () => {
    expect(extractClassNumber('No Number')).toBe('No Number')
  })

  it('extractClassNumber handles "Class 10"', () => {
    expect(extractClassNumber('Class 10')).toBe('10')
  })

  it('getClassOptions returns class numbers', () => {
    const classes = [
      { id: '1', name: 'Class 1', sections: [] },
      { id: '2', name: 'Class 2', sections: [] },
    ] as ClassInfo[]
    expect(getClassOptions(classes)).toEqual(['1', '2'])
  })

  it('buildSectionsMap maps class numbers to section names', () => {
    const classes = [
      { id: '1', name: 'Class 1', sections: [{ id: 's1', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] }] },
      { id: '2', name: 'Class 2', sections: [{ id: 's2', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] }, { id: 's3', name: 'B', seatQuantity: 40, classTeacherId: '', subjectIds: [] }] },
    ] as ClassInfo[]
    const map = buildSectionsMap(classes)
    expect(map['1']).toEqual(['A'])
    expect(map['2']).toEqual(['A', 'B'])
  })

  it('getAllSections returns deduplicated sorted sections', () => {
    const classes = [
      { id: '1', name: 'Class 1', sections: [{ id: 's1', name: 'B', seatQuantity: 40, classTeacherId: '', subjectIds: [] }, { id: 's2', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] }] },
      { id: '2', name: 'Class 2', sections: [{ id: 's3', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] }] },
    ] as ClassInfo[]
    expect(getAllSections(classes)).toEqual(['A', 'B'])
  })
})

describe('classStore actions', () => {
  beforeEach(() => {
    localStorage.clear()
    useClassStore.setState({
      classes: [],
      routines: [],
      sessionClasses: {},
      sessionRoutines: {},
    })
  })

  it('addClass adds a class', () => {
    const cls = { id: 'CLS-1', name: 'Class 1', sections: [] } as any
    useClassStore.getState().addClass(cls)
    expect(useClassStore.getState().classes).toHaveLength(1)
  })

  it('updateClass merges data', () => {
    useClassStore.getState().addClass({ id: 'CLS-1', name: 'Class 1', updatedAt: '' } as any)
    useClassStore.getState().updateClass('CLS-1', { name: 'Updated' })
    expect(useClassStore.getState().classes[0].name).toBe('Updated')
    expect(useClassStore.getState().classes[0].updatedAt).toBeTruthy()
  })

  it('deleteClass removes class', () => {
    useClassStore.getState().addClass({ id: 'CLS-1' } as any)
    useClassStore.getState().deleteClass('CLS-1')
    expect(useClassStore.getState().classes).toHaveLength(0)
  })

  it('addSection adds section to class', () => {
    useClassStore.getState().addClass({ id: 'CLS-1', sections: [] } as any)
    useClassStore.getState().addSection('CLS-1', { id: 'SEC-1', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] })
    expect(useClassStore.getState().classes[0].sections).toHaveLength(1)
  })

  it('deleteSection removes section from class', () => {
    useClassStore.getState().addClass({ id: 'CLS-1', sections: [{ id: 'SEC-1', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] }] } as any)
    useClassStore.getState().deleteSection('CLS-1', 'SEC-1')
    expect(useClassStore.getState().classes[0].sections).toHaveLength(0)
  })

  it('updateRoutine upserts routine', () => {
    useClassStore.getState().updateRoutine('CLS-1', { sectionId: 'SEC-1', periodDuration: 40, weekendDays: [5], periods: [] })
    expect(useClassStore.getState().routines).toHaveLength(1)
    // Upsert: same classId + sectionId should update, not create
    useClassStore.getState().updateRoutine('CLS-1', { sectionId: 'SEC-1', periodDuration: 50 })
    expect(useClassStore.getState().routines).toHaveLength(1)
    expect(useClassStore.getState().routines[0].periodDuration).toBe(50)
  })

  it('setRoutineSlot creates and extends arrays', () => {
    useClassStore.getState().setRoutineSlot('CLS-1', 0, 0, { subjectId: 'SUB-1', teacherId: 'TCH-1', sectionId: 'SEC-1' })
    const routine = useClassStore.getState().routines[0]
    expect(routine.periods[0][0].subjectId).toBe('SUB-1')
  })

  it('clearRoutineSlot resets slot', () => {
    useClassStore.getState().setRoutineSlot('CLS-1', 0, 0, { subjectId: 'SUB-1', teacherId: 'TCH-1', sectionId: 'SEC-1' })
    useClassStore.getState().clearRoutineSlot('CLS-1', 0, 0, 'SEC-1')
    const routine = useClassStore.getState().routines.find(r => r.classId === 'CLS-1' && r.sectionId === 'SEC-1')
    expect(routine!.periods[0][0].subjectId).toBe('')
  })

  it('addSession adds session if not duplicate', () => {
    useClassStore.getState().addSession('2024-25')
    expect(useClassStore.getState().institution.sessions).toContain('2024-25')
    // Duplicate should not add
    useClassStore.getState().addSession('2024-25')
    const count = useClassStore.getState().institution.sessions.filter(s => s === '2024-25').length
    expect(count).toBe(1)
  })

  it('removeSession removes session and data', () => {
    useClassStore.getState().addSession('2024-25')
    useClassStore.getState().removeSession('2024-25')
    expect(useClassStore.getState().institution.sessions).not.toContain('2024-25')
  })

  it('switchSession swaps classes and routines', () => {
    useClassStore.getState().addSession('2024-25')
    useClassStore.getState().addClass({ id: 'CLS-OLD', name: 'Old Class', sections: [] } as any)
    useClassStore.getState().switchSession('2024-25')
    expect(useClassStore.getState().institution.currentSession).toBe('2024-25')
    // Classes should now be from the saved session (empty for new session)
    expect(useClassStore.getState().classes.find(c => c.id === 'CLS-OLD')).toBeUndefined()
  })

  it('updateInstitution merges data', () => {
    useClassStore.getState().updateInstitution({ name: 'New School' })
    expect(useClassStore.getState().institution.name).toBe('New School')
  })

  it('mapSchoolToInstitutionSettings maps database school and R2 image correctly', () => {
    const dbSchool = {
      name: 'Udvash Academic & Admission Care',
      nameBn: 'উদ্ভাস একাডেমি',
      brandName: 'Udvash',
      brandColor: '#a855f7',
      logo: '/api/media/public/med-1234',
      banner: '/api/media/public/med-5678',
      domain: 'udvash',
    }
    const mapped = mapSchoolToInstitutionSettings(dbSchool)
    expect(mapped.name).toBe('Udvash Academic & Admission Care')
    expect(mapped.nameBn).toBe('উদ্ভাস একাডেমি')
    expect(mapped.brandName).toBe('Udvash')
    expect(mapped.logo).toBe('/api/media/public/med-1234')
    expect(mapped.banner).toBe('/api/media/public/med-5678')
    expect(mapped.lightColors?.brand).toBe('#a855f7')
    expect(mapped.darkColors?.brand).toBeDefined()
  })

  it('syncFromServer updates store when server returns classes and routines', async () => {
    const mockClasses = [{ id: 'CLS-99', name: 'Class 99', sections: [] }]
    const mockRoutines = [{ classId: 'CLS-99', sectionId: 'SEC-1', periodDuration: 45, weekendDays: [5], periods: [] }]
    vi.mocked(classesApi.get).mockResolvedValueOnce({
      classes: mockClasses as any,
      routines: mockRoutines as any,
      sessions: ['2025-26'],
      breaks: [],
    })

    await useClassStore.getState().syncFromServer('test-slug')
    expect(useClassStore.getState().classes).toEqual(mockClasses)
    expect(useClassStore.getState().routines).toEqual(mockRoutines)
    expect(useClassStore.getState().serverSynced).toBe(true)
  })

  it('syncToServer calls classesApi.update with current classes and routines', async () => {
    vi.mocked(classesApi.update).mockResolvedValueOnce({ success: true })
    useClassStore.getState().addClass({ id: 'CLS-SYNC', name: 'Sync Class', sections: [] } as any)

    await useClassStore.getState().syncToServer()
    expect(classesApi.update).toHaveBeenCalledWith(
      expect.objectContaining({
        classes: expect.arrayContaining([expect.objectContaining({ id: 'CLS-SYNC' })]),
      })
    )
  })
})
