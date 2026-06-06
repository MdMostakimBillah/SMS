import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useExamStore } from './examStore'

let counter = 0
beforeEach(() => {
  counter = 0
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

function tick() {
  counter++
  vi.setSystemTime(new Date(2026, 0, 1, 0, 0, counter))
}

describe('examStore - exam config', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({
      examConfigs: [],
      subjectMarkConfigs: [],
      studentMarks: [],
      routines: [],
      rooms: [],
      seatPlans: [],
      invigilators: [],
      attendances: [],
      omrConfigs: [],
      omrTemplates: [],
      extraMarks: [],
      marksheetConfigs: [],
      generalAbilities: [],
      gradeScales: [],
      workingDays: [],
      promotions: [],
      cumulativeSheets: [],
      marksEntryStatuses: [],
    })
  })

  it('addExamConfig adds config', () => {
    useExamStore.getState().addExamConfig({
      name: 'Test', nameBn: 'Test', type: 'annual', session: '2025-26',
      startDate: '2025-06-01', endDate: '2025-06-10', isActive: false,
    })
    expect(useExamStore.getState().examConfigs).toHaveLength(1)
  })

  it('updateExamConfig merges data', () => {
    useExamStore.getState().addExamConfig({
      name: 'Test', nameBn: 'Test', type: 'annual', session: '2025-26',
      startDate: '2025-06-01', endDate: '2025-06-10', isActive: false,
    })
    const id = useExamStore.getState().examConfigs[0].id
    useExamStore.getState().updateExamConfig(id, { name: 'Updated' })
    expect(useExamStore.getState().examConfigs[0].name).toBe('Updated')
  })

  it('deleteExamConfig cascades to subjectMarkConfigs, studentMarks, routines', () => {
    useExamStore.getState().addExamConfig({
      name: 'Test', nameBn: 'Test', type: 'annual', session: '2025-26',
      startDate: '2025-06-01', endDate: '2025-06-10', isActive: false,
    })
    const examId = useExamStore.getState().examConfigs[0].id
    useExamStore.getState().upsertSubjectMarkConfig({
      examId, classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    useExamStore.getState().addRoutine({
      examId, classId: 'CLS-1', sectionId: 'SEC-1', subjectId: 'SUB-1',
      date: '2025-06-01', startTime: '09:00', endTime: '11:00', roomNo: 'R-1', status: 'upcoming',
    })
    useExamStore.getState().deleteExamConfig(examId)
    expect(useExamStore.getState().examConfigs).toHaveLength(0)
    expect(useExamStore.getState().subjectMarkConfigs).toHaveLength(0)
    expect(useExamStore.getState().routines).toHaveLength(0)
  })

  it('toggleExamActive deactivates all other exams', () => {
    useExamStore.getState().addExamConfig({
      name: 'Exam 1', nameBn: '', type: 'annual', session: '2025-26',
      startDate: '', endDate: '', isActive: true,
    })
    tick()
    useExamStore.getState().addExamConfig({
      name: 'Exam 2', nameBn: '', type: 'annual', session: '2025-26',
      startDate: '', endDate: '', isActive: false,
    })
    const [id1, id2] = useExamStore.getState().examConfigs.map(e => e.id)
    useExamStore.getState().toggleExamActive(id2)
    const configs = useExamStore.getState().examConfigs
    expect(configs.find(e => e.id === id2)!.isActive).toBe(true)
    expect(configs.find(e => e.id === id1)!.isActive).toBe(false)
  })
})

describe('examStore - subject mark config', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ subjectMarkConfigs: [], examConfigs: [] })
  })

  it('upsertSubjectMarkConfig creates new', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    expect(useExamStore.getState().subjectMarkConfigs).toHaveLength(1)
  })

  it('upsertSubjectMarkConfig updates existing', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 150, passMarks: 50, subExams: [],
    })
    expect(useExamStore.getState().subjectMarkConfigs).toHaveLength(1)
    expect(useExamStore.getState().subjectMarkConfigs[0].fullMarks).toBe(150)
  })

  it('copyClassMarkConfig copies configs to target class with new IDs', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33,
      subExams: [{ id: 'SE-1', name: 'CQ', nameBn: '', fullMarks: 50, passMarks: 17 }],
    })
    useExamStore.getState().copyClassMarkConfig('EXAM-1', 'CLS-1', 'CLS-2')
    const configs = useExamStore.getState().subjectMarkConfigs
    expect(configs).toHaveLength(2)
    const copied = configs.find(c => c.classId === 'CLS-2')!
    expect(copied.subjectId).toBe('SUB-1')
    expect(copied.subExams[0].id).not.toBe('SE-1')
  })

  it('copyExamPlan copies all configs to target exam', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    useExamStore.getState().copyExamPlan('EXAM-1', 'EXAM-2')
    const configs = useExamStore.getState().subjectMarkConfigs
    expect(configs).toHaveLength(2)
    expect(configs.some(c => c.examId === 'EXAM-2')).toBe(true)
  })

  it('copySubjectConfig copies config to target subjects', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    tick()
    useExamStore.getState().copySubjectConfig('EXAM-1', 'CLS-1', 'SUB-1', ['SUB-1', 'SUB-2', 'SUB-3'])
    const configs = useExamStore.getState().subjectMarkConfigs.filter(c => c.classId === 'CLS-1')
    expect(configs).toHaveLength(2)
    expect(configs.every(c => c.fullMarks === 100 && c.passMarks === 33)).toBe(true)
  })

  it('addSubExamToSubject / removeSubExam / updateSubExam', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    const configId = useExamStore.getState().subjectMarkConfigs[0].id
    useExamStore.getState().addSubExamToSubject(configId, { name: 'CQ', nameBn: '', fullMarks: 50, passMarks: 17 })
    expect(useExamStore.getState().subjectMarkConfigs[0].subExams).toHaveLength(1)
    const seId = useExamStore.getState().subjectMarkConfigs[0].subExams[0].id
    useExamStore.getState().updateSubExam(configId, seId, { fullMarks: 60 })
    expect(useExamStore.getState().subjectMarkConfigs[0].subExams[0].fullMarks).toBe(60)
    useExamStore.getState().removeSubExam(configId, seId)
    expect(useExamStore.getState().subjectMarkConfigs[0].subExams).toHaveLength(0)
  })
})

describe('examStore - student marks', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ studentMarks: [], subjectMarkConfigs: [] })
  })

  it('saveStudentMark computes total and grade', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    useExamStore.getState().saveStudentMark({
      examId: 'EXAM-1', studentId: 'STU-1', subjectId: 'SUB-1', classId: 'CLS-1', sectionId: 'A',
      subExamMarks: { CQ: 40, MCQ: 20 }, totalMarks: 0, enteredAt: '', updatedAt: '',
    } as any)
    const mark = useExamStore.getState().studentMarks[0]
    expect(mark.totalMarks).toBe(60)
    expect(mark.grade).toBe('A-')
  })

  it('saveStudentMark upserts by exam+student+subject', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    useExamStore.getState().saveStudentMark({
      examId: 'EXAM-1', studentId: 'STU-1', subjectId: 'SUB-1', classId: 'CLS-1', sectionId: 'A',
      subExamMarks: { CQ: 40 }, totalMarks: 0, enteredAt: '', updatedAt: '',
    } as any)
    useExamStore.getState().saveStudentMark({
      examId: 'EXAM-1', studentId: 'STU-1', subjectId: 'SUB-1', classId: 'CLS-1', sectionId: 'A',
      subExamMarks: { CQ: 50 }, totalMarks: 0, enteredAt: '', updatedAt: '',
    } as any)
    expect(useExamStore.getState().studentMarks).toHaveLength(1)
    expect(useExamStore.getState().studentMarks[0].totalMarks).toBe(50)
  })

  it('deleteStudentMark removes mark', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    useExamStore.getState().saveStudentMark({
      examId: 'EXAM-1', studentId: 'STU-1', subjectId: 'SUB-1', classId: 'CLS-1', sectionId: 'A',
      subExamMarks: { CQ: 40 }, totalMarks: 0, enteredAt: '', updatedAt: '',
    } as any)
    const id = useExamStore.getState().studentMarks[0].id
    useExamStore.getState().deleteStudentMark(id)
    expect(useExamStore.getState().studentMarks).toHaveLength(0)
  })

  it('getStudentMarksForExam filters correctly', () => {
    useExamStore.getState().upsertSubjectMarkConfig({
      examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1', fullMarks: 100, passMarks: 33, subExams: [],
    })
    useExamStore.getState().saveStudentMark({
      examId: 'EXAM-1', studentId: 'STU-1', subjectId: 'SUB-1', classId: 'CLS-1', sectionId: 'A',
      subExamMarks: { CQ: 40 }, totalMarks: 0, enteredAt: '', updatedAt: '',
    } as any)
    const marks = useExamStore.getState().getStudentMarksForExam('EXAM-1', 'CLS-1', 'A', 'SUB-1')
    expect(marks).toHaveLength(1)
    expect(useExamStore.getState().getStudentMarksForExam('EXAM-1', 'CLS-1', 'B', 'SUB-1')).toHaveLength(0)
  })
})

describe('examStore - attendance', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ attendances: [] })
  })

  it('addAttendance creates new record', () => {
    useExamStore.getState().addAttendance({
      examId: 'EXAM-1', studentId: 'STU-1', classId: 'CLS-1', sectionId: 'A',
      date: '2025-06-01', shift: 'morning', status: 'present', scannedBy: '', scannedAt: '',
    })
    expect(useExamStore.getState().attendances).toHaveLength(1)
  })

  it('addAttendance upserts by exam+student+date+shift', () => {
    useExamStore.getState().addAttendance({
      examId: 'EXAM-1', studentId: 'STU-1', classId: 'CLS-1', sectionId: 'A',
      date: '2025-06-01', shift: 'morning', status: 'present', scannedBy: '', scannedAt: '',
    })
    useExamStore.getState().addAttendance({
      examId: 'EXAM-1', studentId: 'STU-1', classId: 'CLS-1', sectionId: 'A',
      date: '2025-06-01', shift: 'morning', status: 'absent', scannedBy: '', scannedAt: '',
    })
    expect(useExamStore.getState().attendances).toHaveLength(1)
    expect(useExamStore.getState().attendances[0].status).toBe('absent')
  })

  it('addAttendance creates separate records for different dates', () => {
    useExamStore.getState().addAttendance({
      examId: 'EXAM-1', studentId: 'STU-1', classId: 'CLS-1', sectionId: 'A',
      date: '2025-06-01', shift: 'morning', status: 'present', scannedBy: '', scannedAt: '',
    })
    useExamStore.getState().addAttendance({
      examId: 'EXAM-1', studentId: 'STU-1', classId: 'CLS-1', sectionId: 'A',
      date: '2025-06-02', shift: 'morning', status: 'absent', scannedBy: '', scannedAt: '',
    })
    expect(useExamStore.getState().attendances).toHaveLength(2)
  })
})

describe('examStore - rooms', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ rooms: [] })
  })

  it('addRoom / updateRoom / deleteRoom', () => {
    useExamStore.getState().addRoom({ roomNo: 'R-1', roomName: 'Room 1', capacity: 40, building: 'Main', floor: '1st', isActive: true })
    expect(useExamStore.getState().rooms).toHaveLength(1)
    const id = useExamStore.getState().rooms[0].id
    useExamStore.getState().updateRoom(id, { capacity: 50 })
    expect(useExamStore.getState().rooms[0].capacity).toBe(50)
    useExamStore.getState().deleteRoom(id)
    expect(useExamStore.getState().rooms).toHaveLength(0)
  })
})

describe('examStore - OMR', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ omrConfigs: [], omrTemplates: [] })
  })

  it('upsertOMRConfig creates and updates', () => {
    useExamStore.getState().upsertOMRConfig({
      examId: 'EXAM-1', subjectId: 'SUB-1', totalQuestions: 50, correctMark: 2,
      negativeMark: 0.5, optionCount: 4, sheetFormat: 'A',
    })
    expect(useExamStore.getState().omrConfigs).toHaveLength(1)
    useExamStore.getState().upsertOMRConfig({
      examId: 'EXAM-1', subjectId: 'SUB-1', totalQuestions: 60, correctMark: 2,
      negativeMark: 0.5, optionCount: 4, sheetFormat: 'A',
    })
    expect(useExamStore.getState().omrConfigs).toHaveLength(1)
    expect(useExamStore.getState().omrConfigs[0].totalQuestions).toBe(60)
  })

  it('saveOMRTemplate / updateOMRTemplate auto-increments version', () => {
    useExamStore.getState().saveOMRTemplate({
      name: 'T1', nameBn: 'T1', examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1',
      totalCopy: 1, institutionName: '', institutionNameBn: '', institutionAddress: '',
      sessionName: '', className: '', classNameBn: '', examName: '', examNameBn: '',
      subjectName: '', subjectNameBn: '', groupName: '', groupNameBn: '', sectionName: '',
      themeColor: '#000', serialNumber: '', paperSize: 'A4', sheetFormat: 'A', totalQuestions: 50,
      optionCount: 4, correctMark: 2, negativeMark: 0, subjects: [], showStudentName: true,
      showRollNo: true, showStudentId: true, showRegistrationNo: true, showClass: true,
      showSection: true, showGroup: true, showExamName: true, showSubjectName: true,
      showSubjectCode: true, showSetCode: true, showDate: true, showStudentSignature: true,
      showStudentPhoto: true, showQRCode: true, showBarcode: true, showSerialNumber: true,
      showSecurityCode: true, showVerificationCode: true, showTeacherCode: true,
      showInvigilatorCode: true, showRoomNumber: true, showSeatNumber: true,
      showAdditionalPaper: true, showPresentAbsent: true, showExaminerRemarks: true,
      showExaminerSection: true, marksEntryStyle: 'numbers', customMarksValues: '',
      showExaminerSignature: true, showHeadExaminerSignature: true, showVerificationSignature: true,
      showCheckedBy: true, showVerifiedBy: true, showTotalMarks: true, showPracticalMarks: true,
      showVivaMarks: true, showInstructions: true, isArchived: false, isDefault: false,
      modifiedBy: '',
    } as any)
    expect(useExamStore.getState().omrTemplates[0].version).toBe(1)
    const id = useExamStore.getState().omrTemplates[0].id
    useExamStore.getState().updateOMRTemplate(id, { name: 'Updated' })
    expect(useExamStore.getState().omrTemplates[0].version).toBe(2)
    expect(useExamStore.getState().omrTemplates[0].name).toBe('Updated')
  })

  it('duplicateOMRTemplate creates clone with version 1', () => {
    useExamStore.getState().saveOMRTemplate({
      name: 'T1', nameBn: 'T1', examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1',
      totalCopy: 1, institutionName: '', institutionNameBn: '', institutionAddress: '',
      sessionName: '', className: '', classNameBn: '', examName: '', examNameBn: '',
      subjectName: '', subjectNameBn: '', groupName: '', groupNameBn: '', sectionName: '',
      themeColor: '#000', serialNumber: '', paperSize: 'A4', sheetFormat: 'A', totalQuestions: 50,
      optionCount: 4, correctMark: 2, negativeMark: 0, subjects: [], showStudentName: true,
      showRollNo: true, showStudentId: true, showRegistrationNo: true, showClass: true,
      showSection: true, showGroup: true, showExamName: true, showSubjectName: true,
      showSubjectCode: true, showSetCode: true, showDate: true, showStudentSignature: true,
      showStudentPhoto: true, showQRCode: true, showBarcode: true, showSerialNumber: true,
      showSecurityCode: true, showVerificationCode: true, showTeacherCode: true,
      showInvigilatorCode: true, showRoomNumber: true, showSeatNumber: true,
      showAdditionalPaper: true, showPresentAbsent: true, showExaminerRemarks: true,
      showExaminerSection: true, marksEntryStyle: 'numbers', customMarksValues: '',
      showExaminerSignature: true, showHeadExaminerSignature: true, showVerificationSignature: true,
      showCheckedBy: true, showVerifiedBy: true, showTotalMarks: true, showPracticalMarks: true,
      showVivaMarks: true, showInstructions: true, isArchived: false, isDefault: false,
      modifiedBy: '',
    } as any)
    const id = useExamStore.getState().omrTemplates[0].id
    useExamStore.getState().duplicateOMRTemplate(id, 'Clone')
    expect(useExamStore.getState().omrTemplates).toHaveLength(2)
    const clone = useExamStore.getState().omrTemplates[1]
    expect(clone.name).toBe('Clone')
    expect(clone.version).toBe(1)
    expect(clone.isArchived).toBe(false)
  })

  it('archiveOMRTemplate / restoreOMRTemplate', () => {
    useExamStore.getState().saveOMRTemplate({
      name: 'T1', nameBn: '', examId: 'EXAM-1', classId: 'CLS-1', subjectId: 'SUB-1',
      totalCopy: 1, institutionName: '', institutionNameBn: '', institutionAddress: '',
      sessionName: '', className: '', classNameBn: '', examName: '', examNameBn: '',
      subjectName: '', subjectNameBn: '', groupName: '', groupNameBn: '', sectionName: '',
      themeColor: '', serialNumber: '', paperSize: 'A4', sheetFormat: 'A', totalQuestions: 50,
      optionCount: 4, correctMark: 2, negativeMark: 0, subjects: [], showStudentName: false,
      showRollNo: false, showStudentId: false, showRegistrationNo: false, showClass: false,
      showSection: false, showGroup: false, showExamName: false, showSubjectName: false,
      showSubjectCode: false, showSetCode: false, showDate: false, showStudentSignature: false,
      showStudentPhoto: false, showQRCode: false, showBarcode: false, showSerialNumber: false,
      showSecurityCode: false, showVerificationCode: false, showTeacherCode: false,
      showInvigilatorCode: false, showRoomNumber: false, showSeatNumber: false,
      showAdditionalPaper: false, showPresentAbsent: false, showExaminerRemarks: false,
      showExaminerSection: false, marksEntryStyle: 'numbers', customMarksValues: '',
      showExaminerSignature: false, showHeadExaminerSignature: false, showVerificationSignature: false,
      showCheckedBy: false, showVerifiedBy: false, showTotalMarks: false, showPracticalMarks: false,
      showVivaMarks: false, showInstructions: false, isArchived: false, isDefault: false,
      modifiedBy: '',
    } as any)
    const id = useExamStore.getState().omrTemplates[0].id
    useExamStore.getState().archiveOMRTemplate(id)
    expect(useExamStore.getState().omrTemplates[0].isArchived).toBe(true)
    useExamStore.getState().restoreOMRTemplate(id)
    expect(useExamStore.getState().omrTemplates[0].isArchived).toBe(false)
  })
})

describe('examStore - grade scale', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ gradeScales: [] })
  })

  it('toggleGradeScaleActive deactivates all others', () => {
    useExamStore.getState().addGradeScale({ name: 'GS1', nameBn: '', isActive: false, grades: [] })
    tick()
    useExamStore.getState().addGradeScale({ name: 'GS2', nameBn: '', isActive: false, grades: [] })
    const ids = useExamStore.getState().gradeScales.map(g => g.id)
    const id1 = ids[0]
    const id2 = ids[1]
    useExamStore.getState().toggleGradeScaleActive(id1)
    const gs1 = useExamStore.getState().gradeScales.find(g => g.id === id1)
    const gs2 = useExamStore.getState().gradeScales.find(g => g.id === id2)
    expect(gs1!.isActive).toBe(true)
    expect(gs2!.isActive).toBe(false)
  })
})

describe('examStore - lock/unlock marks', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ marksEntryStatuses: [] })
  })

  it('lockMarks sets status to locked', () => {
    useExamStore.getState().addMarksEntryStatus({
      examId: 'EXAM-1', classId: 'CLS-1', sectionId: 'A', subjectId: 'SUB-1',
      teacherId: 'TCH-1', status: 'completed', totalStudents: 40, enteredCount: 40, lockedAt: null,
    })
    useExamStore.getState().lockMarks('EXAM-1', 'CLS-1', 'A', 'SUB-1')
    expect(useExamStore.getState().marksEntryStatuses[0].status).toBe('locked')
    expect(useExamStore.getState().marksEntryStatuses[0].lockedAt).toBeTruthy()
  })

  it('unlockMarks sets status to completed', () => {
    useExamStore.getState().addMarksEntryStatus({
      examId: 'EXAM-1', classId: 'CLS-1', sectionId: 'A', subjectId: 'SUB-1',
      teacherId: 'TCH-1', status: 'locked', totalStudents: 40, enteredCount: 40, lockedAt: '2025-06-20',
    })
    useExamStore.getState().unlockMarks('EXAM-1', 'CLS-1', 'A', 'SUB-1')
    expect(useExamStore.getState().marksEntryStatuses[0].status).toBe('completed')
    expect(useExamStore.getState().marksEntryStatuses[0].lockedAt).toBeNull()
  })
})

describe('examStore - seat plans', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ seatPlans: [], rooms: [] })
  })

  it('addSeatPlan / removeSeatPlan', () => {
    useExamStore.getState().addSeatPlan({
      examId: 'EXAM-1', roomId: 'RM-1', studentId: 'STU-1', classId: 'CLS-1',
      sectionId: 'A', seatNo: 1, roll: '001',
    })
    expect(useExamStore.getState().seatPlans).toHaveLength(1)
    const id = useExamStore.getState().seatPlans[0].id
    useExamStore.getState().removeSeatPlan(id)
    expect(useExamStore.getState().seatPlans).toHaveLength(0)
  })

  it('autoAssignSeats distributes students across rooms', () => {
    useExamStore.getState().addRoom({ roomNo: 'R-1', roomName: 'Room 1', capacity: 3, building: 'Main', floor: '1st', isActive: true })
    tick()
    useExamStore.getState().addRoom({ roomNo: 'R-2', roomName: 'Room 2', capacity: 3, building: 'Main', floor: '1st', isActive: true })
    const roomIds = useExamStore.getState().rooms.map(r => r.id)
    useExamStore.getState().autoAssignSeats('EXAM-1', 'CLS-1', 'A', ['S1', 'S2', 'S3', 'S4', 'S5'], roomIds)
    const plans = useExamStore.getState().seatPlans
    expect(plans).toHaveLength(5)
    const roomCounts: Record<string, number> = {}
    plans.forEach(p => { roomCounts[p.roomId] = (roomCounts[p.roomId] || 0) + 1 })
    const counts = Object.values(roomCounts)
    expect(counts.some(c => c === 3)).toBe(true)
    expect(counts.some(c => c === 2)).toBe(true)
  })
})

describe('examStore - routines', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ routines: [] })
  })

  it('addRoutine / deleteRoutine', () => {
    useExamStore.getState().addRoutine({
      examId: 'EXAM-1', classId: 'CLS-1', sectionId: 'A', subjectId: 'SUB-1',
      date: '2025-06-01', startTime: '09:00', endTime: '11:00', roomNo: 'R-1', status: 'upcoming',
    })
    expect(useExamStore.getState().routines).toHaveLength(1)
    const id = useExamStore.getState().routines[0].id
    useExamStore.getState().deleteRoutine(id)
    expect(useExamStore.getState().routines).toHaveLength(0)
  })

  it('bulkAddRoutines adds multiple', () => {
    useExamStore.getState().bulkAddRoutines([
      { examId: 'EXAM-1', classId: 'CLS-1', sectionId: 'A', subjectId: 'SUB-1', date: '2025-06-01', startTime: '09:00', endTime: '11:00', roomNo: 'R-1', status: 'upcoming' },
      { examId: 'EXAM-1', classId: 'CLS-1', sectionId: 'A', subjectId: 'SUB-2', date: '2025-06-02', startTime: '09:00', endTime: '11:00', roomNo: 'R-1', status: 'upcoming' },
    ])
    expect(useExamStore.getState().routines).toHaveLength(2)
  })
})

describe('examStore - extra marks', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ extraMarks: [] })
  })

  it('addExtraMark / updateExtraMark / deleteExtraMark', () => {
    useExamStore.getState().addExtraMark({
      examId: 'EXAM-1', studentId: 'STU-1', classId: 'CLS-1', sectionId: 'A',
      type: 'attendance', marks: 8, maxMarks: 10, note: 'test',
    })
    expect(useExamStore.getState().extraMarks).toHaveLength(1)
    const id = useExamStore.getState().extraMarks[0].id
    useExamStore.getState().updateExtraMark(id, { marks: 9 })
    expect(useExamStore.getState().extraMarks[0].marks).toBe(9)
    useExamStore.getState().deleteExtraMark(id)
    expect(useExamStore.getState().extraMarks).toHaveLength(0)
  })

  it('bulkAddExtraMarks adds multiple', () => {
    useExamStore.getState().bulkAddExtraMarks([
      { examId: 'EXAM-1', studentId: 'STU-1', classId: 'CLS-1', sectionId: 'A', type: 'attendance', marks: 8, maxMarks: 10, note: '' },
      { examId: 'EXAM-1', studentId: 'STU-2', classId: 'CLS-1', sectionId: 'A', type: 'attendance', marks: 9, maxMarks: 10, note: '' },
    ])
    expect(useExamStore.getState().extraMarks).toHaveLength(2)
  })
})

describe('examStore - promotions', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ promotions: [] })
  })

  it('addPromotion / bulkPromote', () => {
    useExamStore.getState().addPromotion({
      examId: 'EXAM-1', studentId: 'STU-1', fromClass: 'CLS-1', fromSection: 'A',
      toClass: 'CLS-2', toSection: 'A', status: 'promoted', totalMarks: 500,
      obtainedMarks: 425, percentage: 85, grade: 'A+', promotedAt: '', promotedBy: '',
    })
    expect(useExamStore.getState().promotions).toHaveLength(1)
    useExamStore.getState().bulkPromote([
      { examId: 'EXAM-1', studentId: 'STU-2', fromClass: 'CLS-1', fromSection: 'A', toClass: 'CLS-2', toSection: 'A', status: 'promoted', totalMarks: 500, obtainedMarks: 400, percentage: 80, grade: 'A+', promotedAt: '', promotedBy: '' },
      { examId: 'EXAM-1', studentId: 'STU-3', fromClass: 'CLS-1', fromSection: 'A', toClass: 'CLS-2', toSection: 'A', status: 'promoted', totalMarks: 500, obtainedMarks: 380, percentage: 76, grade: 'A', promotedAt: '', promotedBy: '' },
    ])
    expect(useExamStore.getState().promotions).toHaveLength(3)
  })
})

describe('examStore - cumulative marksheets', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({ cumulativeSheets: [] })
  })

  it('addCumulativeSheet / toggleCumulativePublished', () => {
    useExamStore.getState().addCumulativeSheet({
      name: 'CMS-1', nameBn: '', examIds: ['EXAM-1'], sessionId: '2025-26',
      classId: 'CLS-1', isPublished: false,
    })
    expect(useExamStore.getState().cumulativeSheets[0].isPublished).toBe(false)
    const id = useExamStore.getState().cumulativeSheets[0].id
    useExamStore.getState().toggleCumulativePublished(id)
    expect(useExamStore.getState().cumulativeSheets[0].isPublished).toBe(true)
  })
})
