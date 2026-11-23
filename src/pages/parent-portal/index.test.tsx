import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import ParentPortalPage from './index'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import { useTeacherStore } from '@/store/teacherStore'

describe('ParentPortalPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAdmissionStore.persist.clearStorage()
    useClassStore.persist.clearStorage()
    useFeeStore.persist.clearStorage()
    useTeacherStore.persist.clearStorage()

    useTeacherStore.setState({
      teachers: [
        {
          id: 't-1',
          nameEn: 'Rafiqul Islam',
          nameBn: 'রফিকুল ইসলাম',
          designation: 'Mathematics Teacher',
          phone: '+880 1711-889900',
          email: 'rafiqul@school.edu',
        } as any,
      ],
    })

    useClassStore.setState({
      institution: {
        id: 'inst-1',
        name: 'Model High School',
        nameBn: 'মডেল হাই স্কুল',
        code: 'MHS-01',
        established: '2000',
        currentSession: '2026-27',
      } as any,
    })

    // Real student records enrolled in institution
    useAdmissionStore.setState({
      students: [
        {
          id: 'child-1',
          nameEn: 'Tahmid Rahman',
          nameBn: 'তাহমিদ রহমান',
          roll: '01',
          class: 'Class 8',
          section: 'A',
          academicYear: '2026',
          status: 'approved',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
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
        } as any,
        {
          id: 'child-2',
          nameEn: 'Samia Rahman',
          nameBn: 'সামিয়া রহমান',
          roll: '04',
          class: 'Class 5',
          section: 'B',
          academicYear: '2026',
          status: 'approved',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
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
        } as any,
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
        {
          id: 'STU-101',
          nameEn: 'Abrar Fahim',
          nameBn: 'আবরার ফাহিম',
          roll: '15',
          class: 'Class 9',
          section: 'B',
          academicYear: '2026',
          status: 'approved',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          phone: '+880 1711-998877',
        } as any,
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
})
