import { describe, it, expect } from 'vitest'
import QRCode from 'qrcode'
import { generateAdmitCardHTML } from './admitCard'
import type { ExamConfig, SubjectMarkConfig, ExamRoutine } from '@/store/examStore'
import type { Subject } from '@/pages/teachers/types'

describe('generateAdmitCardHTML', () => {
  const mockExam: ExamConfig = {
    id: 'exam-101',
    name: 'Annual Examination - 2026',
    nameBn: 'বার্ষিক পরীক্ষা - ২০২৬',
    startDate: '2026-12-01',
    endDate: '2026-12-15',
    session: '2026-2027',
    examType: 'final',
    status: 'active',
    gradingSystemId: 'g1',
    classes: ['Four'],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }

  const mockInst = {
    name: 'Tanjimul Hikmah Residential Model Academy',
    nameBn: 'তানজিমুল হিকমাহ রেসিডেন্সিয়াল মডেল একাডেমি',
    address: 'Pirgachha, Rangpur',
    phone: '01700000000',
    email: 'info@tanjimul.edu.bd',
    eiin: '123456',
    brandName: 'Bangladesh Madrasah Association',
    currentSession: '2026-2027',
  }

  const mockStudents = [
    {
      id: '2026000334',
      nameEn: 'Most Afiya Jannat Humira',
      nameBn: 'মোছাঃ আফিয়া জান্নাত হুমিরা',
      photo: '',
      class: 'One',
      section: 'A',
      roll: '33',
      fatherNameEn: 'Md Azad Ul Islam',
      fatherNameBn: 'মোঃ আজাদ উল ইসলাম',
      motherNameEn: 'Most Hanufa Akter',
      motherNameBn: 'মোছাঃ হনুফা আক্তার',
      dob: '2020-01-01',
      academicYear: '2026-2027',
    },
  ]

  const mockSubjectMap = new Map<string, Subject>([
    ['sub-1', { id: 'sub-1', name: 'Bangla', nameBn: 'বাংলা', departmentId: 'd1', departmentIds: [], createdAt: '', updatedAt: '' }],
    ['sub-2', { id: 'sub-2', name: 'English', nameBn: 'ইংরেজি', departmentId: 'd1', departmentIds: [], createdAt: '', updatedAt: '' }],
    ['sub-3', { id: 'sub-3', name: 'Math', nameBn: 'গণিত', departmentId: 'd1', departmentIds: [], createdAt: '', updatedAt: '' }],
    ['sub-4', { id: 'sub-4', name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', departmentId: 'd1', departmentIds: [], createdAt: '', updatedAt: '' }],
  ])

  const mockRoutines: ExamRoutine[] = [
    { id: 'r1', examId: 'exam-101', classId: 'One', sectionId: 'A', subjectId: 'sub-1', date: '2026-12-01', startTime: '10:00', endTime: '13:00', roomNo: 'R-101', status: 'upcoming', createdAt: '' },
    { id: 'r2', examId: 'exam-101', classId: 'One', sectionId: 'A', subjectId: 'sub-2', date: '2026-12-03', startTime: '10:00', endTime: '13:00', roomNo: 'R-101', status: 'upcoming', createdAt: '' },
    { id: 'r3', examId: 'exam-101', classId: 'One', sectionId: 'A', subjectId: 'sub-3', date: '2026-12-05', startTime: '14:00', endTime: '17:00', roomNo: 'R-102', status: 'upcoming', createdAt: '' },
    { id: 'r4', examId: 'exam-101', classId: 'One', sectionId: 'A', subjectId: 'sub-4', date: '2026-12-08', startTime: '14:00', endTime: '17:00', roomNo: 'R-102', status: 'upcoming', createdAt: '' },
  ]

  const mockSubjectConfigs: SubjectMarkConfig[] = []

  it('renders official institutional admit card structure in English', async () => {
    const qrUrl = await QRCode.toDataURL('2026000334', { width: 120, margin: 1 })
    const mockQrUrls = { '2026000334': qrUrl }

    const html = generateAdmitCardHTML(
      mockStudents,
      mockExam,
      mockInst,
      mockSubjectMap,
      mockSubjectConfigs,
      mockRoutines,
      mockQrUrls,
      false,
      '#4f46e5'
    )

    // Header checks
    expect(html).toContain('BANGLADESH MADRASAH ASSOCIATION')
    expect(html).toContain('Tanjimul Hikmah Residential Model Academy')
    expect(html).toContain('Annual Examination - 2026')
    expect(html).toContain('ADMIT CARD')

    // Examinee details table checks
    expect(html).toContain('Examination Code')
    expect(html).toContain('Most Afiya Jannat Humira')
    expect(html).toContain('2026000334')
    expect(html).toContain('Md Azad Ul Islam')
    expect(html).toContain('Most Hanufa Akter')
    expect(html).toContain('33')
    expect(html).toContain('One / A')
    expect(html).toContain('INST-123456-Tanjimul Hikmah Residential Model Academy')

    // Subject routine table checks
    expect(html).toContain('Subject Code &amp; name')
    expect(html).toContain('Bangla')
    expect(html).toContain('English')
    expect(html).toContain('Math')
    expect(html).toContain('ICT')
    expect(html).toContain('101')
    expect(html).toContain('102')
    expect(html).toContain('103')
    expect(html).toContain('104')

    // Signatures and instructions
    expect(html).toContain('Seal &amp; Signature of Principal')
    expect(html).toContain('Controller of Examinations')
    expect(html).toContain('Instructions to Candidates')
    expect(html).toContain('Report 30 minutes early with the admit card.')
    expect(html).toContain('ID No: 2026000334')
  })

  it('renders localized admit card in Bengali mode', () => {
    const html = generateAdmitCardHTML(
      mockStudents,
      mockExam,
      mockInst,
      mockSubjectMap,
      mockSubjectConfigs,
      mockRoutines,
      {},
      true,
      '#4f46e5'
    )

    expect(html).toContain('তানজিমুল হিকমাহ রেসিডেন্সিয়াল মডেল একাডেমি')
    expect(html).toContain('বার্ষিক পরীক্ষা - ২০২৬')
    expect(html).toContain('প্রবেশপত্র')
    expect(html).toContain('পরীক্ষার্থীর নাম')
    expect(html).toContain('মোছাঃ আফিয়া জান্নাত হুমিরা')
    expect(html).toContain('পিতার নাম')
    expect(html).toContain('মোছাঃ হনুফা আক্তার')
    expect(html).toContain('বিষয় কোড ও নাম')
    expect(html).toContain('অধ্যক্ষের সিল ও স্বাক্ষর')
    expect(html).toContain('পরীক্ষা নিয়ন্ত্রক')
  })
})
