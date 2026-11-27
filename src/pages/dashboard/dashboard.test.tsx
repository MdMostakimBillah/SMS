import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './index'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { useAdmissionStore } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useFeeStore } from '@/store/feeStore'
import { useClassStore } from '@/store/classStore'
import { useExpenseStore } from '@/store/expenseStore'
import { useOthersIncomeStore } from '@/store/othersIncomeStore'
import { useExamStore } from '@/store/examStore'
import { useHRStore } from '@/store/hrStore'
import { useSyllabusStore } from '@/store/syllabusStore'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useTodoStore } from '@/store/todoStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useMessageStore } from '@/store/messageStore'
import * as storageModeModule from '@/lib/storageMode'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      name: 'Super Admin',
      role: 'school_admin',
      schoolName: 'Model High School',
    },
  }),
}))

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canRead: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}))

describe('DashboardPage - Backend, Database & Local PC Functionality', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()

    // Populate mock data in stores
    useAdmissionStore.setState({
      students: [
        {
          id: 'STU-1',
          nameEn: 'Rahim Ahmed',
          nameBn: 'রহিম আহমেদ',
          class: '10',
          section: 'A',
          gender: 'male',
          status: 'approved',
          createdAt: '2026-11-01',
        } as any,
        {
          id: 'STU-2',
          nameEn: 'Fatima Begum',
          nameBn: 'ফাতেমা বেগম',
          class: '10',
          section: 'B',
          gender: 'female',
          status: 'approved',
          createdAt: '2026-11-02',
        } as any,
      ],
    })

    useTeacherStore.setState({
      teachers: [
        {
          id: 'T-1',
          nameEn: 'Md. Karim',
          nameBn: 'মোঃ করিম',
          gender: 'male',
          status: 'active',
          salary: 35000,
          createdAt: '2026-10-15',
        } as any,
        {
          id: 'T-2',
          nameEn: 'Nasrin Akter',
          nameBn: 'নাসরিন আক্তার',
          gender: 'female',
          status: 'active',
          salary: 32000,
          createdAt: '2026-10-16',
        } as any,
      ],
      departments: [],
      subjects: [],
      designations: [],
    })

    useFeeStore.setState({
      structures: [
        {
          id: 'FEE-1',
          name: 'Monthly Tuition',
          amount: 1500,
          type: 'monthly',
          isActive: true,
        } as any,
      ],
      payments: [
        {
          id: 'PAY-1',
          studentId: 'STU-1',
          amount: 1500,
          paidAt: new Date().toISOString(),
        } as any,
      ],
      generateWaivers: () => [],
    })

    useClassStore.setState({
      classes: [{ id: 'CLS-1', name: 'Class 10', sections: ['A', 'B'] } as any],
      routines: [],
    })

    useTodoStore.setState({
      todos: [
        {
          id: 'TODO-1',
          title: 'Prepare Class Routine',
          titleBn: 'ক্লাস রুটিন তৈরি করুন',
          description: 'Finalize routine for Class 10',
          descriptionBn: 'শ্রেণি ১০ এর রুটিন চূড়ান্ত করুন',
          dueDate: '2026-11-15',
          priority: 'high',
          status: 'pending',
          assignedTo: ['T-1'],
          createdBy: 'Admin',
          createdAt: '2026-11-01T00:00:00Z',
        },
      ],
    })
  })

  it('renders all sections and connects to backend database on mount', async () => {
    const admissionSpy = vi.spyOn(useAdmissionStore.getState(), 'syncFromServer').mockResolvedValue()
    const teacherSpy = vi.spyOn(useTeacherStore.getState(), 'syncFromServer').mockResolvedValue()
    const feeSpy = vi.spyOn(useFeeStore.getState(), 'syncFromServer').mockResolvedValue()

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    // Verify initial mount triggers syncFromServer across backend stores
    expect(admissionSpy).toHaveBeenCalled()
    expect(teacherSpy).toHaveBeenCalled()
    expect(feeSpy).toHaveBeenCalled()

    // Verify greeting and user name
    await waitFor(() => {
      expect(screen.getByText(/Super Admin/i)).toBeInTheDocument()
    })

    // Verify Local PC & Database Integration hub is NOT rendered on the dashboard
    expect(screen.queryByText(/Local PC & Database Hub|লোকাল পিসি ও ডাটাবেজ ইন্টিগ্রেশন/i)).not.toBeInTheDocument()

    // Verify Total Students card
    expect(screen.getAllByText(/Total Students|মোট ছাত্র/i).length).toBeGreaterThan(0)

    // Verify Financial Cards
    expect(screen.getByText(/Today's Income|আজকের আয়/i)).toBeInTheDocument()
  })

  it('triggers manual database sync when clicking the DB Sync button', async () => {
    const admissionSpy = vi.spyOn(useAdmissionStore.getState(), 'syncFromServer').mockResolvedValue()
    const teacherSpy = vi.spyOn(useTeacherStore.getState(), 'syncFromServer').mockResolvedValue()

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/DB Sync|ডাটাবেজ সিঙ্ক/i)).toBeInTheDocument()
    })

    const refreshBtn = screen.getByText(/DB Sync|ডাটাবেজ সিঙ্ক/i)
    fireEvent.click(refreshBtn)

    expect(admissionSpy).toHaveBeenCalledTimes(2)
    expect(teacherSpy).toHaveBeenCalledTimes(2)
  })

  it('ensures Local PC Mode text in header and Local PC Hub section are not rendered', async () => {
    vi.spyOn(storageModeModule, 'getActiveStorageMode').mockReturnValue('local_computer')

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/Local PC Mode|লোকাল পিসি মোড/i)).not.toBeInTheDocument()
    })

    expect(screen.queryByText(/Local PC & Database Hub|লোকাল পিসি ও ডাটাবেজ ইন্টিগ্রেশন/i)).not.toBeInTheDocument()
  })

  it('supports filtering tasks by teacher, completing tasks, and deleting tasks', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Prepare Class Routine')).toBeInTheDocument()
    })

    // Toggle completion status via checkbox
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
    fireEvent.click(checkboxes[0])

    // Verify task state updated in store
    const updatedTodo = useTodoStore.getState().todos.find((t) => t.id === 'TODO-1')
    expect(updatedTodo?.status).toBe('completed')

    // Filter by staff
    const staffDropdownBtn = screen.getByText(/All Staff|সকল কর্মচারী/i)
    fireEvent.click(staffDropdownBtn)

    // Select Nasrin Akter who has no tasks assigned
    const nasrinOption = screen.getByText('Nasrin Akter')
    fireEvent.click(nasrinOption)

    await waitFor(() => {
      expect(screen.getByText(/No tasks for this teacher|এই শিক্ষকের জন্য কাজ নেই/i)).toBeInTheDocument()
    })

    // Switch back to All Staff
    const staffDropdownBtn2 = screen.getByText('Nasrin Akter')
    fireEvent.click(staffDropdownBtn2)
    const allStaffOption = screen.getByText(/All Staff|সকল কর্মচারী/i)
    fireEvent.click(allStaffOption)

    // Delete task
    const deleteBtn = screen.getByLabelText(/Delete task|কাজটি মুছুন/i)
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(screen.getByText(/No tasks yet|কোনো কাজ নেই/i)).toBeInTheDocument()
    })
  })

  it('navigates to relevant pages when clicking Recent Admissions and Upcoming Events', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Recent Admissions|সাম্প্রতিক ভর্তি/i)).toBeInTheDocument()
    })

    // Click "All →" in Recent Admissions
    const allAdmissionsBtn = screen.getByText(/All →|সব →/i)
    fireEvent.click(allAdmissionsBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/students/all')

    // Click "Calendar →" in Upcoming Events
    const calendarBtn = screen.getByText(/Calendar →|ক্যালেন্ডার →/i)
    fireEvent.click(calendarBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/notice')
  })

  it('opens and closes the Create Task modal', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Add Task|নতুন কাজ/i)).toBeInTheDocument()
    })

    // Open modal
    const addTaskBtn = screen.getByText(/Add Task|নতুন কাজ/i)
    fireEvent.click(addTaskBtn)

    await waitFor(() => {
      expect(screen.getByText(/Create New Task|নতুন কাজ যোগ করুন/i)).toBeInTheDocument()
    })

    // Close modal
    const cancelBtn = screen.getByText(/Cancel|বাতিল/i)
    fireEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Create New Task|নতুন কাজ যোগ করুন/i)).not.toBeInTheDocument()
    })
  })

  it('displays new teacher, attendance, message, birthday KPI cards and full-month income progress graph', async () => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    useAdmissionStore.setState({
      students: [
        {
          id: 'STU-BDAY',
          nameEn: 'Samia Rahman',
          nameBn: 'সামিয়া রহমান',
          class: '8',
          section: 'A',
          gender: 'female',
          status: 'approved',
          dob: `2012-${mmdd}`,
          academicYear: useClassStore.getState().institution?.currentSession || '2026',
          createdAt: '2026-11-01',
        } as any,
      ],
    })

    useTeacherStore.setState({
      teachers: [
        {
          id: 'T-BDAY',
          nameEn: 'Karim Uddin',
          nameBn: 'করিম উদ্দিন',
          gender: 'male',
          status: 'active',
          salary: 35000,
          dob: `1988-${mmdd}`,
          createdAt: '2026-10-01',
        } as any,
        {
          id: 'T-ABS',
          nameEn: 'Salma Khatun',
          nameBn: 'সালমা খাতুন',
          gender: 'female',
          status: 'active',
          salary: 30000,
          dob: '1992-01-15',
          createdAt: '2026-10-02',
        } as any,
      ],
    })

    useAttendanceStore.setState({
      attendance: {
        [todayStr]: {
          'T-BDAY': { status: 'present', punches: [] },
        },
      },
    })

    useMessageStore.setState({
      messages: [
        {
          id: 'M-1',
          senderId: 'me',
          senderName: 'Admin',
          senderNameBn: 'Admin',
          senderRole: 'admin',
          recipientId: 'all',
          recipientName: 'All',
          subject: 'Notice',
          body: 'Test',
          read: true,
          status: 'sent',
          createdAt: now.toISOString(),
        },
      ],
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Total Teachers|মোট শিক্ষক/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/M\/F Teachers|শিক্ষক \(পুরুষ\/মহিলা\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Present Teachers Today|আজ উপস্থিত শিক্ষক/i)).toBeInTheDocument()
    expect(screen.getByText(/Absent Teachers Today|আজ অনুপস্থিত শিক্ষক/i)).toBeInTheDocument()
    expect(screen.getByText(/Messages Quantity|মোট বার্তা/i)).toBeInTheDocument()
    expect(screen.getByText(/Student Birthdays Today|আজ ছাত্রদের জন্মদিন/i)).toBeInTheDocument()
    expect(screen.getByText(/Teacher Birthdays Today|আজ শিক্ষকদের জন্মদিন/i)).toBeInTheDocument()
    expect(screen.getByText(/Software Last Payment/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Monthly Income & Daily Collection Progress|মাসিক আয় ও দৈনিক সংগ্রহের অগ্রগতি/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/^Income$|^আয়$/)).toBeInTheDocument()
    expect(screen.getByText(/^Expense$|^ব্যয়$/)).toBeInTheDocument()

    // Month switcher buttons navigate between current and previous months
    const prevMonthBtn = screen.getByRole('button', { name: /Previous month|আগের মাস/i })
    const nextMonthBtn = screen.getByRole('button', { name: /Next month|পরের মাস/i })
    expect(nextMonthBtn).toBeDisabled()

    fireEvent.click(prevMonthBtn)
    await waitFor(() => {
      expect(nextMonthBtn).not.toBeDisabled()
    })

    fireEvent.click(nextMonthBtn)
    await waitFor(() => {
      expect(nextMonthBtn).toBeDisabled()
    })

    // Click student birthdays card -> opens birthday modal with Samia Rahman
    fireEvent.click(screen.getByText(/Student Birthdays Today|আজ ছাত্রদের জন্মদিন/i))
    await waitFor(() => {
      expect(screen.getByText(/Today's Student Birthdays|আজ যেসব শিক্ষার্থীর জন্মদিন/i)).toBeInTheDocument()
    })

    // Click software last payment card -> navigates to subscription payment settings
    fireEvent.click(screen.getByText(/Software Last Payment/i))
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/settings?panel=subscription-payment'))
  })

  it('renders updated DashboardSkeleton matching the current dashboard sections', () => {
    render(<DashboardSkeleton />)

    const skeleton = screen.getByTestId('dashboard-skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveAttribute('role', 'status')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading dashboard')
  })
})
