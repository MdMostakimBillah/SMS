import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import NotificationsPage from './index'
import { useNotificationStore } from '@/store/notificationStore'
import { AuthContext } from '@/contexts/AuthContext'
import { notificationsApi } from '@/lib/api'

const mockAuthAdmin = {
  user: {
    id: 'user-admin',
    name: 'School Principal',
    email: 'admin@school.com',
    role: 'school_admin',
    schoolId: 'school-test',
    institutionId: 'school-test',
    permissions: [
      'notifications.view',
      'notifications.create',
      'notifications.edit',
      'notifications.delete',
    ],
  },
  token: 'mock-token',
  login: async () => {},
  logout: () => {},
  register: async () => {},
  isLoading: false,
  error: null,
  isAuthenticated: true,
  checkAuth: async () => {},
} as any

describe('NotificationsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('edutech_inst_slug', 'school-test')
    useNotificationStore.setState({
      notifications: [],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
    vi.spyOn(notificationsApi, 'get').mockResolvedValue({ notifications: [] })
    vi.spyOn(notificationsApi, 'update').mockResolvedValue({ success: true })
  })

  it('renders message page style layout with tabs and auto-generated system and billing alerts', async () => {
    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="*" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    // Header and Tabs
    expect(screen.getByText('Notifications & Announcements')).toBeTruthy()
    expect(screen.getByRole('button', { name: /^All/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Software & Updates/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Monthly Payment & Billing/i })).toBeTruthy()

    // System update and Monthly billing reminder auto-generated
    expect(screen.getByText(/Monthly Subscription Payment Reminder/i)).toBeTruthy()
    expect(screen.getByText(/Software System Update: Version 2.4 Released/i)).toBeTruthy()
  })

  it('filters notifications by tab and search query', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'NTF-1',
          title: 'Mathematics Olympiad',
          titleBn: 'গণিত অলিম্পিয়াড',
          message: 'Registration is open until Friday',
          messageBn: 'শুক্রবার পর্যন্ত নিবন্ধন খোলা',
          type: 'info',
          category: 'academic',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'NTF-2',
          title: 'Server Maintenance Window',
          titleBn: 'সার্ভার রক্ষণাবেক্ষণ',
          message: 'Upgrading core database infrastructure',
          messageBn: 'ডাটাবেস অবকাঠামো উন্নয়ন',
          type: 'warning',
          category: 'system',
          read: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'NTF-3',
          title: 'Institution Billing Invoice',
          titleBn: 'প্রাতিষ্ঠানিক বিলিং চালান',
          message: 'Monthly subscription invoice generated',
          messageBn: 'মাসিক সাবস্ক্রিপশন চালান তৈরি হয়েছে',
          type: 'warning',
          category: 'billing',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="*" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    expect(screen.getByText('Mathematics Olympiad')).toBeTruthy()

    // Switch to "Monthly Payment & Billing" tab button
    const billingTab = screen.getByRole('button', { name: /Monthly Payment & Billing/i })
    fireEvent.click(billingTab)

    expect(screen.getByText('Institution Billing Invoice')).toBeTruthy()
    expect(screen.queryByText('Mathematics Olympiad')).toBeNull()

    // Search within tab
    const searchInput = screen.getByPlaceholderText('Search notifications, updates, or billing alerts...')
    fireEvent.change(searchInput, { target: { value: 'Invoice' } })

    expect(screen.getByText('Institution Billing Invoice')).toBeTruthy()
  })

  it('opens notification in animated pop up modal and closes it', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'NTF-DETAIL-TEST',
          title: 'Class 10 Routine Published',
          titleBn: 'দশম শ্রেণির রুটিন',
          message: 'Full exam routine is now available on syllabus page',
          messageBn: 'পরীক্ষার বিস্তারিত রুটিন প্রকাশিত',
          type: 'info',
          category: 'academic',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="*" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    const routineText = screen.getByText('Class 10 Routine Published')
    const card = routineText.closest('.group')
    expect(card).toBeTruthy()

    // Click card to open modal
    fireEvent.click(card!)

    // Modal is opened and displays message and controls
    const matches = screen.getAllByText('Full exam routine is now available on syllabus page')
    expect(matches.length).toBeGreaterThanOrEqual(2)
    const closeButtons = screen.getAllByRole('button', { name: 'Close' })
    expect(closeButtons.length).toBeGreaterThanOrEqual(1)

    // Click Close button
    fireEvent.click(closeButtons[0])

    // Modal is dismissed, list still has the card
    expect(screen.queryAllByRole('button', { name: 'Close' }).length).toBe(0)
    expect(screen.getByText('Class 10 Routine Published')).toBeTruthy()
  })

  it('does not render create notification button for institute accounts', async () => {
    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="*" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    expect(screen.queryByText('Create Notification')).toBeNull()
    expect(screen.queryByText('New Notification')).toBeNull()
  })

  it('allows super admin to compose and broadcast notification to all institutes', async () => {
    const mockAuthSuperAdmin = {
      user: {
        id: 'super-admin-1',
        name: 'Super Admin',
        email: 'superadmin@edutech.pro.bd',
        role: 'super_admin',
      },
      token: 'mock-token',
      login: async () => {},
      logout: () => {},
      register: async () => {},
      isLoading: false,
      error: null,
      isAuthenticated: true,
      checkAuth: async () => {},
    } as any

    vi.spyOn(notificationsApi, 'broadcast').mockResolvedValue({ success: true, count: 5 } as any)

    render(
      <MemoryRouter initialEntries={['/super-admin/admin/notifications']}>
        <AuthContext.Provider value={mockAuthSuperAdmin}>
          <Routes>
            <Route path="*" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    const createBtn = screen.getByText('Create Notification')
    fireEvent.click(createBtn)

    expect(screen.getByText('Compose Notification')).toBeTruthy()
    expect(screen.getByText(/Broadcast to all institutions/i)).toBeTruthy()

    const titleInput = screen.getByPlaceholderText('e.g. System Update / Payment Reminder')
    const msgTextarea = screen.getByPlaceholderText('Enter detailed notification content...')

    fireEvent.change(titleInput, { target: { value: 'Winter Vacation Announcement' } })
    fireEvent.change(msgTextarea, { target: { value: 'School will remain closed from Dec 20.' } })

    const sendBtn = screen.getByText('Send Notification')
    await act(async () => {
      fireEvent.click(sendBtn)
    })

    expect(useNotificationStore.getState().notifications.some((n) => n.title === 'Winter Vacation Announcement')).toBe(true)
    expect(notificationsApi.broadcast).toHaveBeenCalled()
  })

  it('clicking a notification card with action link opens pop up modal without navigating to settings', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'NTF-BILLING-LINK-TEST',
          title: 'Custom Tuition Billing Alert',
          titleBn: 'কাস্টম টিউশন বিলিং সতর্কতা',
          message: 'Please complete your payment to avoid service interruption.',
          messageBn: 'অনুগ্রহ করে পেমেন্ট সম্পন্ন করুন।',
          type: 'warning',
          category: 'billing',
          read: false,
          link: '/settings?panel=subscription-payment',
          createdAt: new Date().toISOString(),
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="*" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    const titleEl = screen.getByText('Custom Tuition Billing Alert')
    const card = titleEl.closest('.group')
    expect(card).toBeTruthy()

    // Click the notification card
    fireEvent.click(card!)

    // Modal popup appears with action button rather than navigating immediately
    expect(screen.getByText('Go to Page')).toBeTruthy()
    expect(screen.getByText('/settings?panel=subscription-payment')).toBeTruthy()

    // The notification is marked read
    expect(useNotificationStore.getState().notifications.find((n) => n.id === 'NTF-BILLING-LINK-TEST')?.read).toBe(true)
  })

  it('allows super admin to compose notification targeted to a specific institution', async () => {
    const mockAuthSuperAdmin = {
      user: {
        id: 'super-admin-1',
        name: 'Super Admin',
        email: 'superadmin@edutech.pro.bd',
        role: 'super_admin',
      },
      token: 'mock-token',
      login: async () => {},
      logout: () => {},
      register: async () => {},
      isLoading: false,
      error: null,
      isAuthenticated: true,
      checkAuth: async () => {},
    } as any

    vi.spyOn(notificationsApi, 'broadcast').mockResolvedValue({ success: true } as any)

    render(
      <MemoryRouter initialEntries={['/super-admin/admin/notifications']}>
        <AuthContext.Provider value={mockAuthSuperAdmin}>
          <Routes>
            <Route path="*" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    fireEvent.click(screen.getByText('Create Notification'))

    // Switch to Specific Institution(s)
    const specificBtn = screen.getByText('Targeted Institution(s)')
    fireEvent.click(specificBtn)

    // Select the institution (Daffodil Model High School)
    const daffodilItem = screen.getByText('Daffodil Model High School')
    fireEvent.click(daffodilItem)

    // Enter title & message
    const titleInput = screen.getByPlaceholderText('e.g. System Update / Payment Reminder')
    const msgTextarea = screen.getByPlaceholderText('Enter detailed notification content...')
    fireEvent.change(titleInput, { target: { value: 'Special Inspection Notice' } })
    fireEvent.change(msgTextarea, { target: { value: 'Inspection scheduled for next Monday.' } })

    const sendBtn = screen.getByText('Send Notification')
    await act(async () => {
      fireEvent.click(sendBtn)
    })

    const created = useNotificationStore.getState().notifications.find((n) => n.title === 'Special Inspection Notice')
    expect(created).toBeTruthy()
    expect(created?.targetType).toBe('specific')
    expect(created?.broadcastToAll).toBe(false)
    expect(created?.targetInstitutions).toContain('inst-daffodil')
  })

  it('shows targeted notification only to targeted institution and hides it from other institutions', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'NTF-TARGET-FOR-TEST',
          title: 'Targeted Notice For School-Test',
          titleBn: 'স্কুল-টেস্ট এর জন্য নোটিশ',
          message: 'Only visible to school-test',
          messageBn: 'শুধুমাত্র স্কুল-টেস্ট দেখতে পাবে',
          type: 'info',
          category: 'academic',
          read: false,
          targetType: 'specific',
          targetInstitutions: ['school-test'],
          targetInstitutionNames: ['School Test Academy'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'NTF-TARGET-FOR-OTHER',
          title: 'Targeted Notice For Other-School',
          titleBn: 'অন্য স্কুলের জন্য নোটিশ',
          message: 'Should NOT be visible to school-test',
          messageBn: 'স্কুল-টেস্ট দেখতে পাবে না',
          type: 'warning',
          category: 'academic',
          read: false,
          targetType: 'specific',
          targetInstitutions: ['other-school-slug'],
          targetInstitutionNames: ['Other School'],
          createdAt: new Date().toISOString(),
        },
      ],
    })

    // Render as school-test user
    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="*" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    // School-test sees their targeted notification
    expect(screen.getByText('Targeted Notice For School-Test')).toBeTruthy()

    // School-test does NOT see the notification targeted to other school
    expect(screen.queryByText('Targeted Notice For Other-School')).toBeNull()
  })
})
