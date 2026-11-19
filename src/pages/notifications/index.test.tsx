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

  it('opens in-place detail view and navigates back with back button', async () => {
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

    // Click card to open in-place detail
    fireEvent.click(card!)

    expect(screen.getByText('Full exam routine is now available on syllabus page')).toBeTruthy()

    // Click Back button
    const backBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(backBtn)

    // Back on list view
    expect(screen.getByText('Class 10 Routine Published')).toBeTruthy()
  })

  it('opens compose modal and sends new notification', async () => {
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

    const newBtn = screen.getByText('New Notification')
    fireEvent.click(newBtn)

    expect(screen.getByText('Compose Notification')).toBeTruthy()

    const titleInput = screen.getByPlaceholderText('e.g. System Update / Payment Reminder')
    const msgTextarea = screen.getByPlaceholderText('Enter detailed notification content...')

    fireEvent.change(titleInput, { target: { value: 'Winter Vacation Announcement' } })
    fireEvent.change(msgTextarea, { target: { value: 'School will remain closed from Dec 20.' } })

    const sendBtn = screen.getByText('Send Notification')
    fireEvent.click(sendBtn)

    expect(useNotificationStore.getState().notifications.some((n) => n.title === 'Winter Vacation Announcement')).toBe(true)
  })
})
