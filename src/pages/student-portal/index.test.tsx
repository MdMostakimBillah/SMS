import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import StudentPortalPage from './index'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useExamStore } from '@/store/examStore'

describe('StudentPortalPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAdmissionStore.persist.clearStorage()
    useClassStore.persist.clearStorage()
    useFeeStore.persist.clearStorage()
    useTeacherStore.persist.clearStorage()
    useAssignmentStore.persist.clearStorage()
    useExamStore.persist.clearStorage()

    useTeacherStore.setState({
      teachers: [
        {
          id: 't-1',
          nameEn: 'Rafiqul Islam',
          nameBn: 'রফিকুল ইসলাম',
          designation: 'Senior Teacher',
          phone: '+880 1711-889900',
          email: 'rafiqul@school.edu',
        } as any,
      ],
      subjects: [
        {
          id: 'sub-math',
          name: 'General Mathematics',
          nameBn: 'সাধারণ গণিত',
          code: '109',
        } as any,
      ],
    })

    useClassStore.setState({
      institution: {
        id: 'inst-1',
        name: 'Model High School',
        nameBn: 'মডেল হাই স্কুল',
        startTime: '08:00',
        endTime: '14:00',
      } as any,
      classes: [
        {
          id: 'cls-8',
          name: 'Class 8',
          numericValue: 8,
          sections: [{ id: 'sec-a', name: 'A', classTeacherId: 't-1' }],
        } as any,
      ],
      routines: [
        {
          classId: 'cls-8',
          sectionId: 'sec-a',
          periodDuration: 45,
          weekendDays: [5], // Friday is weekend
          periods: [
            // Saturday (dayIdx=0)
            [
              { subjectId: 'sub-math', teacherId: 't-1', sectionId: 'sec-a' },
            ],
          ],
        } as any,
      ],
    })

    useAdmissionStore.setState({
      students: [
        {
          id: 'stu-1',
          nameEn: 'Tahmid Rahman',
          nameBn: 'তাহমিদ রহমান',
          roll: '01',
          class: 'Class 8',
          section: 'A',
          academicYear: '2026',
          status: 'approved',
          dob: '2012-05-14',
          gender: 'Male',
          bloodGroup: 'B+',
          phone: '+880 1711-234567',
          guardianPhone: '+880 1711-234567',
          fatherNameEn: 'Mahfuzur Rahman',
          motherNameEn: 'Nasrin Sultana',
          presentAddress: 'Dhanmondi, Dhaka',
        } as any,
        {
          id: 'stu-2',
          nameEn: 'Samia Rahman',
          nameBn: 'সামিয়া রহমান',
          roll: '02',
          class: 'Class 8',
          section: 'A',
          academicYear: '2026',
          status: 'approved',
          dob: '2012-07-20',
          gender: 'Female',
          bloodGroup: 'A+',
          phone: '+880 1711-998877',
        } as any,
      ],
    })

    useAssignmentStore.setState({
      assignments: [
        {
          id: 'asg-1',
          title: 'Algebra Exercise 3.2',
          titleBn: 'বীজগণিত অনুশীলনী ৩.২',
          classId: 'Class 8',
          sectionId: 'A',
          subjectId: 'sub-math',
          teacherId: 't-1',
          dueDate: '2026-12-01',
          maxMarks: 20,
          status: 'active',
          description: 'Solve questions 1 through 10 from chapter 3.',
          createdAt: '2026-11-20T10:00:00Z',
        } as any,
      ],
      submissions: [],
    })

    useFeeStore.setState({
      structures: [
        {
          id: 'fee-tuition',
          name: 'Monthly Tuition Fee',
          nameBn: 'মাসিক বেতন',
          type: 'monthly',
          amount: 1500,
          isActive: true,
          class: 'Class 8',
        } as any,
      ],
      payments: [],
      onlinePaymentRequests: [],
    })

    useExamStore.setState({
      examConfigs: [
        {
          id: 'exam-midterm',
          name: 'Midterm Examination 2026',
          nameBn: 'অর্ধবার্ষিক পরীক্ষা ২০২৬',
          isActive: true,
        } as any,
      ],
      studentMarks: [
        {
          id: 'mark-1',
          examId: 'exam-midterm',
          studentId: 'stu-1',
          subjectId: 'sub-math',
          classId: 'Class 8',
          sectionId: 'A',
          subExamMarks: { written: 75, mcq: 20 },
          totalMarks: 95,
          grade: 'A+',
          enteredAt: '2026-11-01',
        } as any,
      ],
      subjectMarkConfigs: [
        {
          id: 'cfg-1',
          examId: 'exam-midterm',
          classId: 'Class 8',
          subjectId: 'sub-math',
          fullMarks: 100,
          passMarks: 33,
        } as any,
      ],
    })
  })

  it('renders student portal header and details with real student data', async () => {
    render(
      <TestWrapper>
        <StudentPortalPage />
      </TestWrapper>
    )

    // Verify student name and details
    expect(screen.getByText('Tahmid Rahman')).toBeInTheDocument()
    expect(screen.getByText(/Roll:\s*01/i)).toBeInTheDocument()
    expect(screen.getByText('Class 8')).toBeInTheDocument()
    expect(screen.getByText(/ID:\s*stu-1/i)).toBeInTheDocument()

    // Default overview tab KPIs
    expect(screen.getByText(/Attendance Rate/i)).toBeInTheDocument()
    expect(screen.getByText(/Today's Classes/i)).toBeInTheDocument()
    expect(screen.getByText(/Outstanding Fees/i)).toBeInTheDocument()
  })

  it('renders empty notice when no students are enrolled', async () => {
    useAdmissionStore.setState({ students: [] })

    render(
      <TestWrapper>
        <StudentPortalPage />
      </TestWrapper>
    )

    expect(screen.getByText(/No Students Enrolled Yet/i)).toBeInTheDocument()
  })

  it('switches between portal tabs seamlessly', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StudentPortalPage />
      </TestWrapper>
    )

    // Switch to Routine tab
    const routineTabBtn = screen.getByRole('button', { name: /Class Routine/i })
    await user.click(routineTabBtn)
    expect(screen.getByText(/Weekly Class Routine & Schedule/i)).toBeInTheDocument()

    // Switch to Academics tab
    const academicsTabBtn = screen.getByRole('button', { name: /Results & Grades/i })
    await user.click(academicsTabBtn)
    expect(screen.getByText(/Academic Results & Marksheet/i)).toBeInTheDocument()
    expect(screen.getByText('General Mathematics')).toBeInTheDocument()

    // Switch to Homework tab
    const homeworkTabBtn = screen.getByRole('button', { name: /Homework/i })
    await user.click(homeworkTabBtn)
    expect(screen.getAllByText(/Homework & Diary/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Algebra Exercise 3.2')).toBeInTheDocument()

    // Switch to Attendance tab
    const attendanceTabBtn = screen.getByRole('button', { name: /Attendance/i })
    await user.click(attendanceTabBtn)
    expect(screen.getByText(/Working Days/i)).toBeInTheDocument()

    // Switch to Fees tab
    const feesTabBtn = screen.getByRole('button', { name: /Fees & Payments/i })
    await user.click(feesTabBtn)
    expect(screen.getByText(/Fee Invoices & Payments/i)).toBeInTheDocument()
    expect(screen.getByText('Monthly Tuition Fee')).toBeInTheDocument()

    // Switch to Profile tab
    const profileTabBtn = screen.getByRole('button', { name: /My Profile/i })
    await user.click(profileTabBtn)
    expect(screen.getByText(/Academic Record/i)).toBeInTheDocument()
    expect(screen.getByText(/Personal Details/i)).toBeInTheDocument()
  })

  it('opens and displays the Digital Student ID Card modal', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StudentPortalPage />
      </TestWrapper>
    )

    const idCardBtn = screen.getByRole('button', { name: /Digital ID/i })
    await user.click(idCardBtn)

    expect(screen.getByText(/Digital Student ID Card/i)).toBeInTheDocument()
    expect(screen.getByText(/STUDENT IDENTITY CARD/i)).toBeInTheDocument()
  })

  it('allows student to submit homework assignment', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StudentPortalPage />
      </TestWrapper>
    )

    // Go to homework tab
    const homeworkTabBtn = screen.getByRole('button', { name: /Homework/i })
    await user.click(homeworkTabBtn)

    // Click submit button on the homework card
    const submitBtn = screen.getByRole('button', { name: /^Submit$/i })
    await user.click(submitBtn)

    // Verify modal is open
    expect(screen.getByText(/Submit Homework Assignment/i)).toBeInTheDocument()

    // Fill notes
    const textarea = screen.getByPlaceholderText(/Type your answer or explanation here/i)
    await user.type(textarea, 'I have completed exercises 1 to 10.')

    // Submit
    const confirmSubmitBtn = screen.getByRole('button', { name: /Submit Work/i })
    await user.click(confirmSubmitBtn)

    // Verify submission is recorded in assignment store
    const submissions = useAssignmentStore.getState().submissions
    expect(submissions.length).toBe(1)
    expect(submissions[0].studentId).toBe('stu-1')
    expect(submissions[0].feedback).toBe('I have completed exercises 1 to 10.')
  })

  it('allows fee payment submission with TrxID', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StudentPortalPage />
      </TestWrapper>
    )

    // Go to Fees tab
    const feesTabBtn = screen.getByRole('button', { name: /Fees & Payments/i })
    await user.click(feesTabBtn)

    // Click Pay Online button
    const payBtn = screen.getByRole('button', { name: /Pay Online/i })
    await user.click(payBtn)

    // Verify modal opens
    expect(screen.getByText(/Online Fee Payment/i)).toBeInTheDocument()

    // Enter phone and TrxID
    const phoneInput = screen.getByPlaceholderText('01XXXXXXXXX')
    await user.clear(phoneInput)
    await user.type(phoneInput, '01711234567')

    const trxInput = screen.getByPlaceholderText(/e\.g\. 9H7X8KL2M/i)
    await user.type(trxInput, 'BKASH992831')

    // Confirm payment
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Pay/i })
    await user.click(confirmBtn)

    // Wait for submission confirmation
    await waitFor(() => {
      expect(screen.getByText(/Payment Submitted for Verification/i)).toBeInTheDocument()
    })

    // Check feeStore has online payment request
    const requests = useFeeStore.getState().onlinePaymentRequests
    expect(requests.length).toBe(1)
    expect(requests[0].studentId).toBe('stu-1')
    expect(requests[0].trxId).toBe('BKASH992831')
  })

  it('renders with Local PC Storage badge when running in local computer mode', async () => {
    localStorage.setItem('edutech_storage_mode', 'local_computer')

    render(
      <TestWrapper>
        <StudentPortalPage />
      </TestWrapper>
    )

    expect(screen.getByText(/Local PC Storage/i)).toBeInTheDocument()
    expect(screen.getByText(/Secure Local Vault/i)).toBeInTheDocument()
  })
})
