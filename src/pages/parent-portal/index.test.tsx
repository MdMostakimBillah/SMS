import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import ParentPortalPage from './index'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useExamStore } from '@/store/examStore'
import type { Teacher, Subject } from '@/pages/teachers/types'
import type { StudentAdmission } from '@/store/admissionStore'
import type { PortalChild } from './types'
import { format } from 'date-fns'
import { parseTimeToMinutes, isPunchLate } from './utils/dataMappers'
import { resolvePortalChildrenForUser } from './utils/studentMapper'

function makeTeacher(partial: Partial<Teacher> & { id: string; nameEn: string }): Teacher {
  return {
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    status: 'active',
    category: 'General',
    photo: '',
    nameBn: partial.nameEn,
    gender: 'Male',
    dob: '1985-01-01',
    bloodGroup: 'O+',
    religion: 'Islam',
    phone: '',
    email: '',
    address: '',
    nid: '',
    emergencyPhone: '',
    departmentId: '',
    subjectIds: [],
    designation: 'Teacher',
    qualification: 'M.Sc',
    experience: '5 Years',
    joiningDate: '2020-01-01',
    salary: 25000,
    inTime: '08:00',
    outTime: '14:00',
    fatherNameEn: '',
    fatherNameBn: '',
    fatherPhone: '',
    fatherNid: '',
    motherNameEn: '',
    motherNameBn: '',
    motherPhone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    parentAddress: '',
    ...partial,
  }
}

function makeStudent(partial: Partial<StudentAdmission> & { id: string; nameEn: string }): StudentAdmission {
  return {
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    status: 'approved',
    photo: '',
    nameBn: partial.nameEn,
    dob: '2012-01-01',
    gender: 'Male',
    bloodGroup: '',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    phone: '',
    email: '',
    class: 'Class 8',
    section: 'A',
    roll: '01',
    academicYear: '2026',
    previousSchool: '',
    admissionDate: '2026-01-01',
    presentAddress: '',
    permanentAddress: '',
    district: '',
    fatherNameEn: '',
    fatherNameBn: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherNid: '',
    motherNameEn: '',
    motherNameBn: '',
    motherOccupation: '',
    motherPhone: '',
    motherNid: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    teacherId: '',
    ...partial,
  }
}

function makeSubject(partial: Partial<Subject> & { id: string; name: string }): Subject {
  return {
    nameBn: partial.name,
    departmentId: '',
    departmentIds: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

function makePortalChild(partial: Partial<PortalChild> & { id: string; nameEn: string }): PortalChild {
  return {
    nameBn: partial.nameEn,
    photo: '',
    class: 'Class 8',
    section: 'A',
    roll: '01',
    academicYear: '2026',
    dob: '',
    gender: '',
    bloodGroup: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    emergencyContact: '',
    presentAddress: '',
    classTeacherName: '',
    classTeacherPhone: '',
    classTeacherEmail: '',
    ...partial,
  }
}

describe('ParentPortalPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAdmissionStore.persist.clearStorage()
    useClassStore.persist.clearStorage()
    useFeeStore.persist.clearStorage()
    useTeacherStore.persist.clearStorage()
    useAssignmentStore.persist.clearStorage()
    useAttendanceStore.persist.clearStorage()

    useTeacherStore.setState({
      teachers: [
        makeTeacher({
          id: 't-1',
          nameEn: 'Rafiqul Islam',
          nameBn: 'রফিকুল ইসলাম',
          designation: 'Mathematics Teacher',
          phone: '+880 1711-889900',
          email: 'rafiqul@school.edu',
        }),
      ],
    })

    useClassStore.setState({
      institution: {
        ...useClassStore.getState().institution,
        name: 'Model High School',
        nameBn: 'মডেল হাই স্কুল',
        currentSession: '2026-27',
      },
    })

    // Real student records enrolled in institution
    useAdmissionStore.setState({
      students: [
        makeStudent({
          id: 'child-1',
          nameEn: 'Tahmid Rahman',
          nameBn: 'তাহমিদ রহমান',
          roll: '01',
          class: 'Class 8',
          section: 'A',
          academicYear: '2026',
          dob: '2012-05-14',
          gender: 'Male',
          bloodGroup: 'B+',
          phone: '+880 1711-234567',
          fatherNameEn: 'Mahfuzur Rahman',
          fatherPhone: '+880 1711-234567',
          motherNameEn: 'Nasrin Sultana',
          motherPhone: '+880 1819-345678',
          guardianName: 'Mahfuzur Rahman',
          guardianPhone: '+880 1711-234567',
          presentAddress: 'House 14, Road 5, Dhanmondi, Dhaka',
        }),
        makeStudent({
          id: 'child-2',
          nameEn: 'Samia Rahman',
          nameBn: 'সামিয়া রহমান',
          roll: '04',
          class: 'Class 5',
          section: 'B',
          academicYear: '2026',
          dob: '2015-08-22',
          gender: 'Female',
          bloodGroup: 'O+',
          phone: '+880 1711-234567',
          fatherNameEn: 'Mahfuzur Rahman',
          fatherPhone: '+880 1711-234567',
          motherNameEn: 'Nasrin Sultana',
          motherPhone: '+880 1819-345678',
          guardianName: 'Mahfuzur Rahman',
          guardianPhone: '+880 1711-234567',
          presentAddress: 'House 14, Road 5, Dhanmondi, Dhaka',
        }),
      ],
    })

    // Real fee structures for enrolled student
    useFeeStore.setState({
      structures: [
        {
          id: 'fee-1',
          name: 'Monthly Tuition Fee - November 2026',
          nameBn: 'মাসিক বেতন - নভেম্বর ২০২৬',
          class: 'Class 8',
          amount: 1500,
          isActive: true,
          type: 'monthly',
          academicYear: '2026',
          description: '',
          descriptionBn: '',
          createdAt: '2026-01-01',
        },
      ],
      payments: [],
      onlinePaymentRequests: [],
    })
  })

  it('renders Parent Portal with enrolled student and overview tab', async () => {
    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Should render enrolled student
    await waitFor(() => {
      expect(screen.getByText(/Tahmid Rahman|তাহমিদ রহমান/i)).toBeInTheDocument()
    })

    // Should display tabs
    expect(screen.getByRole('button', { name: /Overview|একনজরে/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Attendance|উপস্থিতি/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Academics|ফলাফল/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fees|ফি ও পেমেন্ট/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Homework|হোমওয়ার্ক/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Notice|যোগাযোগ/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Profile|প্রোফাইল/i })).toBeInTheDocument()
  })

  it('shows empty state when no students exist in system', async () => {
    useAdmissionStore.setState({ students: [] })

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/No Students Found in System|সিস্টেমে কোনো শিক্ষার্থী পাওয়া যায়নি/i)
      ).toBeInTheDocument()
    })
  })

  it('switches tabs properly to Attendance, Academics, and Fees', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Click Attendance Tab
    const attendanceTabBtn = screen.getByRole('button', { name: /Attendance|উপস্থিতি/i })
    await user.click(attendanceTabBtn)

    await waitFor(() => {
      expect(screen.getAllByText(/Leave Requests|Leave Applications|ছুটির আবেদন/i).length).toBeGreaterThanOrEqual(1)
    })

    // Click Academics Tab
    const academicsTabBtn = screen.getByRole('button', { name: /Academics|ফলাফল/i })
    await user.click(academicsTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/Academic Results & Marksheet|একাডেমিক ফলাফল/i)).toBeInTheDocument()
    })

    // Click Fees Tab
    const feesTabBtn = screen.getByRole('button', { name: /Fees|ফি ও পেমেন্ট/i })
    await user.click(feesTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/Monthly Tuition Fee - November 2026|মাসিক বেতন - নভেম্বর ২০২৬/i)).toBeInTheDocument()
    })
  })

  it('opens and closes the Digital ID Card modal', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Find and click ID Card button
    const idCardBtns = screen.getAllByRole('button', { name: /ID Card|আইডি কার্ড/i })
    expect(idCardBtns.length).toBeGreaterThan(0)
    await user.click(idCardBtns[0])

    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByText(/Digital Student ID Card|ডিজিটাল শিক্ষার্থী আইডি কার্ড/i)).toBeInTheDocument()
    })

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close|বন্ধ করুন/i })
    await user.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Digital Student ID Card|ডিজিটাল শিক্ষার্থী আইডি কার্ড/i)).not.toBeInTheDocument()
    })
  })

  it('opens and closes the Online Payment modal', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Find and click Pay Online button
    const payBtns = screen.getAllByRole('button', { name: /Pay Online|ফি পরিশোধ/i })
    expect(payBtns.length).toBeGreaterThan(0)
    await user.click(payBtns[0])

    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByText(/Instant Online Fee Payment|অনলাইন ফি পরিশোধ/i)).toBeInTheDocument()
    })

    // Check payment methods exist
    expect(screen.getByText(/bKash/i)).toBeInTheDocument()
    expect(screen.getByText(/Nagad/i)).toBeInTheDocument()

    // Cancel modal
    const cancelBtn = screen.getByRole('button', { name: /Cancel|বাতিল/i })
    await user.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Instant Online Fee Payment|অনলাইন ফি পরিশোধ/i)).not.toBeInTheDocument()
    })
  })

  it('allows institution admin to switch between multiple children', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Open child dropdown
    const switchBtn = screen.getByRole('button', { name: /Switch Child|সন্তান পরিবর্তন/i })
    await user.click(switchBtn)

    // Find Samia Rahman and click
    const samiaBtn = screen.getByRole('button', { name: /Samia Rahman|সামিয়া রহমান/i })
    await user.click(samiaBtn)

    // Display should update to Samia Rahman
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Samia Rahman|সামিয়া রহমান/i })).toBeInTheDocument()
    })
  })

  it('allows institution admin to search students from admission records', async () => {
    const user = userEvent.setup()

    useAdmissionStore.setState({
      students: [
        makeStudent({
          id: 'STU-101',
          nameEn: 'Abrar Fahim',
          nameBn: 'আবরার ফাহিম',
          roll: '15',
          class: 'Class 9',
          section: 'B',
          academicYear: '2026',
          phone: '+880 1711-998877',
        }),
      ],
    })

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Active child should default to Abrar Fahim
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Abrar Fahim|আবরার ফাহিম/i })).toBeInTheDocument()
    })

    // Open search dropdown
    const switchBtn = screen.getByRole('button', { name: /Search Student|শিক্ষার্থী খুঁজুন/i })
    await user.click(switchBtn)

    // Search bar should be present
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by student name|নাম, রোল, শ্রেণি/i)).toBeInTheDocument()
    })
  })

  it('populates student search dropdown classes strictly from useClassStore (Classes & Sections page)', async () => {
    const user = userEvent.setup()
    useClassStore.setState({
      classes: [
        { id: 'CLS-08', name: 'Class 8', nameBn: 'শ্রেণি ৮', sections: [], subjectIds: [] },
        { id: 'CLS-09', name: 'Class 9', nameBn: 'শ্রেণি ৯', sections: [], subjectIds: [] },
      ],
      sessionClasses: {
        '2025-26': [
          { id: 'CLS-08', name: 'Class 8', nameBn: 'শ্রেণি ৮', sections: [], subjectIds: [] },
          { id: 'CLS-09', name: 'Class 9', nameBn: 'শ্রেণি ৯', sections: [], subjectIds: [] },
        ],
      },
    })

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Open search dropdown
    const switchBtn = screen.getByRole('button', { name: /Search Student|শিক্ষার্থী খুঁজুন/i })
    await user.click(switchBtn)

    // Dropdown should contain options from useClassStore (Class 8 and Class 9)
    await waitFor(() => {
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(within(select).getByRole('option', { name: 'Class 8' })).toBeInTheDocument()
      expect(within(select).getByRole('option', { name: 'Class 9' })).toBeInTheDocument()
    })
  })

  it('allows local PC storage user to access parent portal and displays Local PC Storage badge', async () => {
    localStorage.setItem('edutech_storage_mode', 'local_computer')

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Portal tabs should be fully accessible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Overview|একনজরে/i })).toBeInTheDocument()
    })

    // Local PC Storage badge is displayed
    expect(
      screen.getByText(/Local PC Storage|লোকাল পিসি স্টোরেজ/i)
    ).toBeInTheDocument()
  })

  it('displays VPS Database badge when running on personal VPS (local_server)', async () => {
    localStorage.setItem('edutech_storage_mode', 'local_server')

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/VPS Database|ভিপিএস ডাটাবেজ/i)).toBeInTheDocument()
    })
  })

  it('displays Cloud Database badge when running on provider cloud', async () => {
    localStorage.setItem('edutech_storage_mode', 'cloud')

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Cloud Database|ক্লাউড ডাটাবেজ/i)).toBeInTheDocument()
    })
  })

  it('renders institution notices cleanly without raw HTML tags, allows reading full notice modal, and removes message inquiry page', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Switch to Communication tab
    const commTabBtn = screen.getByRole('button', { name: /Notice|যোগাযোগ/i })
    await user.click(commTabBtn)

    // Verify sub-nav only contains Notice Board and Teacher Directory (no Messages & Inquiries)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Notice Board|নোটিশ বোর্ড/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Teacher Directory|শিক্ষক পরিচিতি/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Messages & Inquiries|বার্তা ও অনুসন্ধান/i })).not.toBeInTheDocument()
    })

    // Raw HTML markup like <h2> or <p> should NOT be visible as raw text
    expect(screen.queryByText(/<h2>Annual Final Examination Schedule/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/<p>Dear Students/i)).not.toBeInTheDocument()

    // Clean text preview should be present
    expect(screen.getAllByText(/Annual Final Examination Schedule 2026|বার্ষিক সমাপনী পরীক্ষা ২০২৬/i).length).toBeGreaterThanOrEqual(1)

    // Switch to Teacher Directory
    const teacherTabBtn = screen.getByRole('button', { name: /Teacher Directory|শিক্ষক পরিচিতি/i })
    await user.click(teacherTabBtn)

    // Teachers should be rendered with contact options
    await waitFor(() => {
      expect(screen.getAllByText(/Call|কল করুন/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders redesigned Student Profile page with hero banner, academic records, guardian contacts, and personal information', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Switch to Profile tab
    const profileTabBtn = screen.getByRole('button', { name: /Profile|প্রোফাইল/i })
    await user.click(profileTabBtn)

    // Verify Hero card & sections render
    await waitFor(() => {
      expect(screen.getByText(/Active Enrolled Student|নিয়মিত ও সক্রিয় শিক্ষার্থী/i)).toBeInTheDocument()
      expect(screen.getByText(/Academic & Enrollment Profile|একাডেমিক ও প্রাতিষ্ঠানিক তথ্য/i)).toBeInTheDocument()
      expect(screen.getByText(/Parents & Legal Guardian Profile|পিতামাতা ও অভিভাবকের বিবরণ/i)).toBeInTheDocument()
      expect(screen.getByText(/Personal & Residence Records|ব্যক্তিগত ও বাসস্থান বিবরণ/i)).toBeInTheDocument()
    })

    // Verify father & mother info from admission record
    expect(screen.getAllByText(/Mahfuzur Rahman/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Nasrin Sultana/i).length).toBeGreaterThanOrEqual(1)

    // Verify actions exist
    expect(screen.getAllByRole('button', { name: /Digital ID Card|ডিজিটাল আইডি কার্ড/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('renders homework and diary tasks from the institution admin assignment page and persists completion', async () => {
    const user = userEvent.setup()

    // Setup class and section in classStore matching student's "Class 8" and "A"
    useClassStore.setState({
      classes: [
        {
          id: 'cls-8',
          name: 'Class 8',
          nameBn: '৮ম শ্রেণি',
          sections: [{ id: 'sec-a', name: 'A', seatQuantity: 40, classTeacherId: 't-1', subjectIds: [] }],
          subjectIds: ['sub-math'],
          startTime: '08:00',
          endTime: '13:30',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    })

    // Populate assignmentStore with a homework/diary task and a formal assignment
    useAssignmentStore.setState({
      assignments: [
        {
          id: 'ASN-2026-001',
          type: 'homework',
          title: 'Mathematics Chapter 3 Exercise 3.2',
          titleBn: 'গণিত ৩য় অধ্যায় অনুশীলন ৩.২',
          description: 'Solve questions 1 through 10 in your class diary.',
          descriptionBn: '',
          subjectId: 'Mathematics',
          classId: 'cls-8',
          sectionId: 'sec-a',
          teacherId: 't-1',
          dueDate: '2026-11-30',
          maxMarks: 0,
          status: 'active',
          attachments: ['https://example.com/math-hw.pdf'],
          createdAt: '2026-11-20',
          updatedAt: '2026-11-20',
        },
        {
          id: 'ASN-2026-002',
          type: 'assignment',
          title: 'Physics Lab Report on Motion',
          titleBn: 'পদার্থবিজ্ঞান গতি সংক্রান্ত ল্যাব রিপোর্ট',
          description: 'Submit written report with observation table.',
          descriptionBn: '',
          subjectId: 'Physics',
          classId: 'cls-8',
          sectionId: 'sec-a',
          teacherId: 't-1',
          dueDate: '2026-12-05',
          maxMarks: 25,
          status: 'active',
          attachments: [],
          createdAt: '2026-11-22',
          updatedAt: '2026-11-22',
        },
      ],
      submissions: [],
    })

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Switch to Homework tab
    const hwTabBtn = screen.getByRole('button', { name: /Homework|ডায়েরি/i })
    await user.click(hwTabBtn)

    // Verify both items appear with appropriate badges
    await waitFor(() => {
      expect(screen.getByText(/Mathematics Chapter 3 Exercise 3.2/i)).toBeInTheDocument()
      expect(screen.getByText(/Physics Lab Report on Motion/i)).toBeInTheDocument()
      expect(screen.getAllByText(/ডায়েরি \/ গৃহকাজ|Diary \/ Homework/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/অ্যাসাইনমেন্ট|Assignment/i).length).toBeGreaterThanOrEqual(1)
    })

    // Verify attachment link exists
    expect(screen.getByText(/সংযুক্তি #1|Attachment #1/i)).toBeInTheDocument()

    // Mark homework as completed
    const markDoneBtn = screen.getAllByRole('button', { name: /Mark Completed|সম্পন্ন চিহ্নিত করুন/i })[0]
    await user.click(markDoneBtn)

    // Verify submission recorded in assignmentStore
    await waitFor(() => {
      const submissions = useAssignmentStore.getState().submissions
      expect(submissions.length).toBe(1)
      expect(submissions[0].assignmentId).toBe('ASN-2026-001')
      expect(submissions[0].status).toBe('submitted')
    })
  })

  it('renders specific student attendance from attendanceStore and derives calendar weekends from class routine', async () => {
    const user = userEvent.setup()

    // Configure class and routine with weekend on Saturday (0) and Friday (6)
    useClassStore.setState({
      classes: [
        {
          id: 'cls-8',
          name: 'Class 8',
          nameBn: '৮ম শ্রেণি',
          sections: [{ id: 'sec-a', name: 'A', seatQuantity: 40, classTeacherId: 't-1', subjectIds: [] }],
          subjectIds: [],
          startTime: '08:00',
          endTime: '14:00',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      routines: [
        {
          classId: 'cls-8',
          sectionId: 'sec-a',
          periodDuration: 45,
          weekendDays: [0, 6], // Saturday and Friday
          periods: [],
        },
      ],
    })

    // Mark real attendance for child-1 (as marked from /attendance page)
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    useAttendanceStore.setState({
      attendance: {
        [todayStr]: {
          'child-1': {
            status: 'present',
            punches: [
              { time: '08:45 AM', type: 'in', method: 'rfid', deviceId: 'DEV-01' },
              { time: '02:00 PM', type: 'out', method: 'rfid', deviceId: 'DEV-01' },
            ],
            note: 'Attended on time',
          },
        },
      },
    })

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Switch to Attendance tab
    const attendanceTabBtn = screen.getByRole('button', { name: /Attendance|উপস্থিতি/i })
    await user.click(attendanceTabBtn)

    // Verify Attendance KPI cards are rendered with Present Days
    await waitFor(() => {
      expect(screen.getByText(/Working Days|মোট কর্মদিবস/i)).toBeInTheDocument()
      expect(screen.getByText(/Present Days|উপস্থিত দিন/i)).toBeInTheDocument()
    })

    // Verify today's attendance details in SelectedDateCard
    await waitFor(() => {
      expect(screen.getByText('08:45 AM')).toBeInTheDocument()
      expect(screen.getByText('02:00 PM')).toBeInTheDocument()
      expect(screen.getAllByText(/RFID Smart Card|আরএফআইডি স্মার্ট কার্ড/i).length).toBeGreaterThanOrEqual(1)
    })

    // Verify calendar weekend badges are rendered according to routine
    expect(screen.getAllByText(/Weekend|সাপ্তাহিক ছুটি/i).length).toBeGreaterThanOrEqual(1)
  })

  it('filters exam results by selected exam, computes accurate GPA/grades, and maps subExamMarks', async () => {
    const user = userEvent.setup()
    useExamStore.persist.clearStorage()

    useTeacherStore.setState({
      subjects: [
        makeSubject({ id: 'sub-math', name: 'Mathematics', nameBn: 'গণিত' }),
        makeSubject({ id: 'sub-eng', name: 'English', nameBn: 'ইংরেজি' }),
      ],
    })

    useExamStore.setState({
      examConfigs: [
        {
          id: 'EX-1',
          name: 'Midterm Exam',
          nameBn: 'অর্ধ-বার্ষিক পরীক্ষা',
          type: 'midterm',
          session: '2026',
          startDate: '2026-06-01',
          endDate: '2026-06-15',
          isActive: true,
          isPublished: true,
          publishedAt: '2026-06-20',
          publishedClasses: ['Class 8'],
          createdAt: '2026-05-01',
        },
        {
          id: 'EX-2',
          name: 'Annual Exam',
          nameBn: 'বার্ষিক পরীক্ষা',
          type: 'annual',
          session: '2026',
          startDate: '2026-11-01',
          endDate: '2026-11-15',
          isActive: false,
          isPublished: true,
          publishedAt: '2026-11-20',
          publishedClasses: ['Class 8'],
          createdAt: '2026-10-01',
        },
      ],
      subjectMarkConfigs: [
        {
          id: 'SMC-1',
          examId: 'EX-1',
          classId: 'Class 8',
          subjectId: 'sub-math',
          fullMarks: 100,
          passMarks: 33,
          subExams: [
            { id: 'SE-W', name: 'Written', nameBn: 'লিখিত', fullMarks: 70, passMarks: 23 },
            { id: 'SE-M', name: 'MCQ', nameBn: 'বহুনির্বাচনি', fullMarks: 30, passMarks: 10 },
          ],
        },
        {
          id: 'SMC-2',
          examId: 'EX-2',
          classId: 'Class 8',
          subjectId: 'sub-eng',
          fullMarks: 100,
          passMarks: 33,
          subExams: [],
        },
      ],
      studentMarks: [
        {
          id: 'SM-1',
          examId: 'EX-1',
          studentId: 'child-1',
          subjectId: 'sub-math',
          classId: 'Class 8',
          sectionId: 'A',
          subExamMarks: { 'SE-W': 62, 'SE-M': 24 },
          totalMarks: 86,
          grade: 'A+',
          enteredAt: '2026-06-18',
          updatedAt: '2026-06-18',
        },
        {
          id: 'SM-2',
          examId: 'EX-2',
          studentId: 'child-1',
          subjectId: 'sub-eng',
          classId: 'Class 8',
          sectionId: 'A',
          subExamMarks: { written: 55 },
          totalMarks: 55,
          grade: 'B',
          enteredAt: '2026-11-18',
          updatedAt: '2026-11-18',
        },
      ],
    })

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    const academicsTabBtn = screen.getByRole('button', { name: /Academics|ফলাফল/i })
    await user.click(academicsTabBtn)

    // Both subjects appear under All Evaluations; average GPA of A+ (5.0) and B (3.0) = 4.00
    await waitFor(() => {
      expect(screen.getByText(/Mathematics|গণিত/i)).toBeInTheDocument()
      expect(screen.getByText(/English|ইংরেজি/i)).toBeInTheDocument()
      expect(screen.getByText('4.00')).toBeInTheDocument()
    })

    // Filter strictly to Midterm Exam -> only Mathematics (86, GPA 5.00) shows
    const examSelect = screen.getByRole('combobox')
    await user.selectOptions(examSelect, 'EX-1')

    await waitFor(() => {
      expect(screen.getByText(/Mathematics|গণিত/i)).toBeInTheDocument()
      expect(screen.queryByText(/English|ইংরেজি/i)).not.toBeInTheDocument()
      expect(screen.getAllByText('5.00').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('persists leave requests to localStorage per child and allows admin approval', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /Attendance|উপস্থিতি/i }))

    const applyBtn = await screen.findByRole('button', { name: /Apply|নতুন আবেদন/i })
    await user.click(applyBtn)

    const reasonInput = await screen.findByPlaceholderText(/State the reason|ছুটির বিস্তারিত কারণ/i)
    await user.type(reasonInput, 'Fever and doctor rest')
    await user.click(screen.getByRole('button', { name: /Submit Application|আবেদন জমা দিন/i }))

    await waitFor(() => {
      expect(screen.getByText('Fever and doctor rest')).toBeInTheDocument()
      const saved = JSON.parse(localStorage.getItem('edutech_parent_portal_leave_child-1') || '[]')
      expect(saved).toHaveLength(1)
      expect(saved[0].status).toBe('pending')
    })

    // Approve leave as institution admin
    const approveBtn = screen.getByTitle(/Approve Leave|অনুমোদন করুন/i)
    await user.click(approveBtn)

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('edutech_parent_portal_leave_child-1') || '[]')
      expect(saved[0].status).toBe('approved')
    })
  })

  it('parses 12h/24h punch times accurately for late check and isolates parent children by user', () => {
    expect(parseTimeToMinutes('08:45 AM')).toBe(525)
    expect(parseTimeToMinutes('10:00 AM')).toBe(600)
    expect(parseTimeToMinutes('01:30 PM')).toBe(810)
    expect(isPunchLate('08:45 AM')).toBe(false)
    expect(isPunchLate('09:15 AM')).toBe(false)
    expect(isPunchLate('09:16 AM')).toBe(true)
    expect(isPunchLate('10:00 AM')).toBe(true)

    const allChildren: PortalChild[] = [
      makePortalChild({ id: 'c1', nameEn: 'Child 1', guardianPhone: '+880 1711-111111' }),
      makePortalChild({ id: 'c2', nameEn: 'Sibling 2', guardianPhone: '+880 1711-111111' }),
      makePortalChild({ id: 'c3', nameEn: 'Other Student', guardianPhone: '+880 1999-999999' }),
    ]

    const parentUser = {
      id: 'acc-par-c1',
      email: '01711111111@portal.local',
      name: 'Parent One',
      role: 'parent',
      studentId: 'c1',
      schoolId: 'inst-1',
      schoolName: 'Test School',
      avatar: null,
      subdomain: 'inst-1',
    }

    const resolved = resolvePortalChildrenForUser(allChildren, parentUser, true)
    expect(resolved.map((c) => c.id)).toEqual(['c1', 'c2'])
  })
})
