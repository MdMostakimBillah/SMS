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
      institution: {
        ...useClassStore.getState().institution,
        currentSession: '2025-26',
        sessions: ['2024-25', '2025-26'],
      },
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

  it('switchSession swaps classes and routines and preserves independence', () => {
    useClassStore.getState().addSession('2026-27')
    useClassStore.getState().addClass({ id: 'CLS-2025', name: 'Class 2025', sections: [] } as any)
    
    // Switch to new session
    useClassStore.getState().switchSession('2026-27')
    expect(useClassStore.getState().institution.currentSession).toBe('2026-27')
    expect(useClassStore.getState().classes.find(c => c.id === 'CLS-2025')).toBeUndefined()
    expect(useClassStore.getState().classes).toHaveLength(0)

    // Add a class to the new session
    useClassStore.getState().addClass({ id: 'CLS-2026', name: 'Class 2026', sections: [] } as any)
    expect(useClassStore.getState().classes).toHaveLength(1)
    expect(useClassStore.getState().classes[0].id).toBe('CLS-2026')

    // Switch back to 2025-26
    useClassStore.getState().switchSession('2025-26')
    expect(useClassStore.getState().institution.currentSession).toBe('2025-26')
    expect(useClassStore.getState().classes.find(c => c.id === 'CLS-2025')).toBeDefined()
    expect(useClassStore.getState().classes.find(c => c.id === 'CLS-2026')).toBeUndefined()

    // Switch back to 2026-27
    useClassStore.getState().switchSession('2026-27')
    expect(useClassStore.getState().institution.currentSession).toBe('2026-27')
    expect(useClassStore.getState().classes.find(c => c.id === 'CLS-2026')).toBeDefined()
    expect(useClassStore.getState().classes.find(c => c.id === 'CLS-2025')).toBeUndefined()
  })

  it('updateInstitution with different currentSession performs session switch', () => {
    useClassStore.getState().addSession('2026-27')
    useClassStore.getState().addClass({ id: 'CLS-2025-A', name: 'Class A', sections: [] } as any)

    useClassStore.getState().updateInstitution({ currentSession: '2026-27' })
    expect(useClassStore.getState().institution.currentSession).toBe('2026-27')
    expect(useClassStore.getState().classes).toHaveLength(0)

    useClassStore.getState().updateInstitution({ currentSession: '2025-26' })
    expect(useClassStore.getState().institution.currentSession).toBe('2025-26')
    expect(useClassStore.getState().classes.find(c => c.id === 'CLS-2025-A')).toBeDefined()
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
    const mockClasses = [{ id: 'CLS-99', name: 'Class 99', sections: [], subjectIds: [] }]
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

  it('in local_computer mode, syncFromServer and syncToServer skip server mutations', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    useClassStore.setState({
      institution: {
        ...useClassStore.getState().institution,
        storageMode: 'local_computer',
      },
    })
    vi.mocked(classesApi.get).mockClear()
    vi.mocked(classesApi.update).mockClear()

    await useClassStore.getState().syncFromServer('test-slug')
    expect(classesApi.get).not.toHaveBeenCalled()

    await useClassStore.getState().syncToServer()
    expect(classesApi.update).not.toHaveBeenCalled()
  })

  it('in local_computer mode, creating new session and switching isolates session classes and routines in localStorage', () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    useClassStore.setState({
      institution: {
        ...useClassStore.getState().institution,
        storageMode: 'local_computer',
        currentSession: '2025-26',
        sessions: ['2025-26'],
      },
    })

    // Add class to 2025-26
    useClassStore.getState().addClass({
      id: 'CLS-2025',
      name: 'Class 2025',
      sections: [],
      subjectIds: [],
      startTime: '08:00',
      endTime: '13:00',
    })
    expect(useClassStore.getState().classes).toHaveLength(1)
    expect(useClassStore.getState().sessionClasses['2025-26']).toHaveLength(1)

    // User creates new session '2026-27'
    useClassStore.getState().addSession('2026-27')
    expect(useClassStore.getState().sessionClasses['2026-27']).toEqual([])

    // User switches to '2026-27'
    useClassStore.getState().switchSession('2026-27')
    expect(useClassStore.getState().institution.currentSession).toBe('2026-27')
    expect(useClassStore.getState().classes).toEqual([]) // Must be empty!

    // Add a class specific to 2026-27
    useClassStore.getState().addClass({
      id: 'CLS-2026',
      name: 'Class 2026',
      sections: [],
      subjectIds: [],
      startTime: '08:00',
      endTime: '13:00',
    })
    expect(useClassStore.getState().classes).toHaveLength(1)
    expect(useClassStore.getState().classes[0].id).toBe('CLS-2026')
    expect(useClassStore.getState().sessionClasses['2026-27']).toHaveLength(1)
    expect(useClassStore.getState().sessionClasses['2025-26']).toHaveLength(1)
    expect(useClassStore.getState().sessionClasses['2025-26'][0].id).toBe('CLS-2025')

    // Switch back to 2025-26
    useClassStore.getState().switchSession('2025-26')
    expect(useClassStore.getState().institution.currentSession).toBe('2025-26')
    expect(useClassStore.getState().classes).toHaveLength(1)
    expect(useClassStore.getState().classes[0].id).toBe('CLS-2025')
  })

  it('in cloud mode, adding and switching session syncs to server and syncFromServer merges sessions', async () => {
    vi.useFakeTimers()
    try {
      sessionStorage.removeItem('edutech_storage_mode')
      useClassStore.setState({
        institution: {
          ...useClassStore.getState().institution,
          storageMode: 'cloud',
          currentSession: '2025-26',
          sessions: ['2025-26'],
        },
        serverSynced: true,
      })
      vi.mocked(classesApi.update).mockResolvedValue({
        success: true,
        sessions: ['2025-26', '2026-27'],
        currentSession: '2026-27',
      })

      useClassStore.getState().addSession('2026-27')
      useClassStore.getState().switchSession('2026-27')

      expect(useClassStore.getState().institution.sessions).toContain('2026-27')
      expect(useClassStore.getState().institution.currentSession).toBe('2026-27')

      // Advance timers for queueServerSync debounce
      await vi.advanceTimersByTimeAsync(500)
      expect(classesApi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          currentSession: '2026-27',
          sessions: ['2025-26', '2026-27'],
        })
      )

      // syncFromServer should merge sessions without wiping 2026-27
      vi.mocked(classesApi.get).mockResolvedValue({
        classes: [],
        routines: [],
        sessionClasses: { '2025-26': [] },
        sessionRoutines: { '2025-26': [] },
        sessions: ['2024-25', '2025-26'],
        currentSession: '2025-26',
      })

      await useClassStore.getState().syncFromServer('test-slug')
      expect(useClassStore.getState().institution.sessions).toEqual(
        expect.arrayContaining(['2024-25', '2025-26', '2026-27'])
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('syncToServer includes both class-level and section-level subjectIds in server payload', async () => {
    vi.mocked(classesApi.update).mockResolvedValueOnce({ success: true })
    useClassStore.getState().addClass({
      id: 'CLS-SUBJ-1',
      name: 'Class with subjects',
      sections: [
        {
          id: 'SEC-CLS-SUBJ-1-A',
          name: 'A',
          seatQuantity: 40,
          classTeacherId: 'TEA-1',
          subjectIds: ['SUB-01', 'SUB-02'],
        },
      ],
      subjectIds: ['SUB-01', 'SUB-02', 'SUB-03'],
    } as any)

    await useClassStore.getState().syncToServer()

    expect(classesApi.update).toHaveBeenCalledWith(
      expect.objectContaining({
        classes: expect.arrayContaining([
          expect.objectContaining({
            id: 'CLS-SUBJ-1',
            subjectIds: ['SUB-01', 'SUB-02', 'SUB-03'],
            sections: expect.arrayContaining([
              expect.objectContaining({
                id: 'SEC-CLS-SUBJ-1-A',
                subjectIds: ['SUB-01', 'SUB-02'],
              }),
            ]),
          }),
        ]),
      })
    )
  })

  it('syncFromServer normalizes missing or legacy subjects into subjectIds array', async () => {
    vi.mocked(classesApi.get).mockResolvedValueOnce({
      classes: [
        {
          id: 'CLS-LEGACY',
          name: 'Legacy Class',
          subjects: ['SUB-L1', 'SUB-L2'],
          sections: [
            {
              id: 'SEC-CLS-LEGACY-A',
              name: 'A',
              subjects: ['SUB-L1'],
            },
          ],
        },
      ] as any,
      routines: [],
      sessions: ['2025-26'],
    })

    await useClassStore.getState().syncFromServer('test-slug')

    const cls = useClassStore.getState().classes.find((c) => c.id === 'CLS-LEGACY')
    expect(cls).toBeDefined()
    expect(cls?.subjectIds).toEqual(['SUB-L1', 'SUB-L2'])
    expect(cls?.sections[0].subjectIds).toEqual(['SUB-L1'])
  })
})
