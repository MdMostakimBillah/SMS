import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAssignmentStore } from './assignmentStore'
import { assignmentsApi } from '@/lib/api'

describe('assignmentStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAssignmentStore.persist.clearStorage()
    useAssignmentStore.setState({
      assignments: [],
      submissions: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
    vi.restoreAllMocks()
  })

  it('addAssignment generates an ASN id and stores the item', () => {
    useAssignmentStore.getState().addAssignment({
      type: 'assignment',
      title: 'Physics Project',
      titleBn: 'পদার্থবিজ্ঞান প্রকল্প',
      description: 'Build a circuit',
      descriptionBn: '',
      subjectId: 'SUB-1',
      classId: 'CLS-1',
      sectionId: 'SEC-A',
      teacherId: 'TCH-1',
      dueDate: '2026-11-20',
      maxMarks: 50,
      status: 'active',
      attachments: [],
    })

    const { assignments } = useAssignmentStore.getState()
    expect(assignments).toHaveLength(1)
    expect(assignments[0].id).toMatch(/^ASN-\d{4}-\d{3}$/)
    expect(assignments[0].title).toBe('Physics Project')
  })

  it('updateAssignment modifies assignment details', () => {
    useAssignmentStore.getState().addAssignment({
      type: 'assignment',
      title: 'Chemistry Lab',
      titleBn: '',
      description: 'Lab experiment',
      descriptionBn: '',
      subjectId: 'SUB-2',
      classId: 'CLS-1',
      sectionId: 'SEC-A',
      teacherId: 'TCH-1',
      dueDate: '2026-11-22',
      maxMarks: 25,
      status: 'active',
      attachments: [],
    })

    const id = useAssignmentStore.getState().assignments[0].id
    useAssignmentStore.getState().updateAssignment(id, { title: 'Chemistry Lab Updated', maxMarks: 30 })

    const updated = useAssignmentStore.getState().assignments.find((a) => a.id === id)
    expect(updated?.title).toBe('Chemistry Lab Updated')
    expect(updated?.maxMarks).toBe(30)
  })

  it('deleteAssignment removes assignment and its submissions', () => {
    useAssignmentStore.getState().addAssignment({
      type: 'assignment',
      title: 'To Be Deleted',
      titleBn: '',
      description: '',
      descriptionBn: '',
      subjectId: 'SUB-1',
      classId: 'CLS-1',
      sectionId: 'SEC-A',
      teacherId: 'TCH-1',
      dueDate: '2026-11-25',
      maxMarks: 10,
      status: 'active',
      attachments: [],
    })

    const id = useAssignmentStore.getState().assignments[0].id

    useAssignmentStore.getState().addSubmission({
      assignmentId: id,
      studentId: 'STU-1',
      studentName: 'Ali',
      studentNameBn: '',
      submittedAt: '2026-11-10',
      fileUrl: '',
      marks: null,
      feedback: '',
      feedbackBn: '',
      status: 'submitted',
    })

    expect(useAssignmentStore.getState().assignments).toHaveLength(1)
    expect(useAssignmentStore.getState().submissions).toHaveLength(1)

    useAssignmentStore.getState().deleteAssignment(id)

    expect(useAssignmentStore.getState().assignments).toHaveLength(0)
    expect(useAssignmentStore.getState().submissions).toHaveLength(0)
  })

  it('addSubmission and updateSubmission handle submission entries', () => {
    useAssignmentStore.getState().addSubmission({
      assignmentId: 'ASN-1',
      studentId: 'STU-100',
      studentName: 'Karim',
      studentNameBn: 'করিম',
      submittedAt: '2026-11-09',
      fileUrl: 'https://example.com/file.pdf',
      marks: null,
      feedback: '',
      feedbackBn: '',
      status: 'submitted',
    })

    const sub = useAssignmentStore.getState().submissions[0]
    expect(sub.id).toMatch(/^SUB-\d{4}-\d{3}$/)
    expect(sub.studentName).toBe('Karim')

    useAssignmentStore.getState().updateSubmission(sub.id, {
      marks: 95,
      status: 'reviewed',
      feedback: 'Excellent work',
    })

    const updated = useAssignmentStore.getState().submissions.find((s) => s.id === sub.id)
    expect(updated?.marks).toBe(95)
    expect(updated?.status).toBe('reviewed')
    expect(updated?.feedback).toBe('Excellent work')
  })

  it('syncFromServer hydrates data from API in database / cloud mode', async () => {
    const mockAssignments = [
      {
        id: 'ASN-2026-099',
        type: 'homework' as const,
        title: 'Server HW',
        titleBn: '',
        description: 'Server fetched homework',
        descriptionBn: '',
        subjectId: 'SUB-1',
        classId: 'CLS-1',
        sectionId: 'SEC-A',
        teacherId: 'TCH-1',
        dueDate: '2026-11-15',
        maxMarks: 0,
        status: 'active' as const,
        attachments: [],
        createdAt: '2026-11-08',
        updatedAt: '2026-11-08',
      },
    ]

    vi.spyOn(assignmentsApi, 'get').mockResolvedValue({
      assignments: mockAssignments,
      submissions: [],
    })

    await useAssignmentStore.getState().syncFromServer('test-school')

    const state = useAssignmentStore.getState()
    expect(state.assignments).toHaveLength(1)
    expect(state.assignments[0].title).toBe('Server HW')
    expect(state.serverSynced).toBe(true)
    expect(state.syncing).toBe(false)
  })

  it('syncFromServer bypasses network in local_computer mode', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const getSpy = vi.spyOn(assignmentsApi, 'get')

    await useAssignmentStore.getState().syncFromServer()

    expect(getSpy).not.toHaveBeenCalled()
    expect(useAssignmentStore.getState().serverSynced).toBe(true)
  })

  it('syncFromServer pushes local data to server if server is empty', async () => {
    useAssignmentStore.getState().addAssignment({
      type: 'assignment',
      title: 'Local Item To Push',
      titleBn: '',
      description: '',
      descriptionBn: '',
      subjectId: 'SUB-1',
      classId: 'CLS-1',
      sectionId: 'SEC-A',
      teacherId: 'TCH-1',
      dueDate: '2026-11-20',
      maxMarks: 100,
      status: 'active',
      attachments: [],
    })

    vi.spyOn(assignmentsApi, 'get').mockResolvedValue({
      assignments: [],
      submissions: [],
    })
    const updateSpy = vi.spyOn(assignmentsApi, 'update').mockResolvedValue({
      success: true,
      count: 1,
      submissionsCount: 0,
    })

    await useAssignmentStore.getState().syncFromServer('test-school')

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: 'test-school',
        assignments: expect.arrayContaining([
          expect.objectContaining({ title: 'Local Item To Push' }),
        ]),
      })
    )
    expect(useAssignmentStore.getState().serverSynced).toBe(true)
  })

  it('deleteAssignment triggers markExplicitUserDelete', async () => {
    const bridge = await import('@/lib/vault/bridge')
    const deleteSpy = vi.spyOn(bridge, 'markExplicitUserDelete')

    useAssignmentStore.getState().addAssignment({
      type: 'assignment',
      title: 'Explicit Delete Item',
      titleBn: '',
      description: '',
      descriptionBn: '',
      subjectId: 'SUB-1',
      classId: 'CLS-1',
      sectionId: 'SEC-A',
      teacherId: 'TCH-1',
      dueDate: '2026-11-20',
      maxMarks: 50,
      status: 'active',
      attachments: [],
    })

    const id = useAssignmentStore.getState().assignments[0].id
    useAssignmentStore.getState().deleteAssignment(id)

    expect(deleteSpy).toHaveBeenCalled()
    expect(bridge.isRecentExplicitDelete()).toBe(true)
  })

  it('mutations call flushVaultWrites for immediate local PC vault synchronization', async () => {
    const vault = await import('@/lib/vault/vault')
    const flushSpy = vi.spyOn(vault, 'flushVaultWrites').mockResolvedValue()

    useAssignmentStore.getState().addAssignment({
      type: 'assignment',
      title: 'Vault Sync Test',
      titleBn: '',
      description: '',
      descriptionBn: '',
      subjectId: 'SUB-1',
      classId: 'CLS-1',
      sectionId: 'SEC-A',
      teacherId: 'TCH-1',
      dueDate: '2026-11-20',
      maxMarks: 50,
      status: 'active',
      attachments: [],
    })

    expect(flushSpy).toHaveBeenCalled()
  })
})
