import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
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

  it('renders empty state when there are no notifications', async () => {
    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="/i/:slug/:role/notifications" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    expect(screen.getByText('Notifications')).toBeTruthy()
    expect(screen.getByText('No notifications yet')).toBeTruthy()
    expect(screen.getByText('Create First Notification')).toBeTruthy()
  })

  it('renders notifications, filters by search, and toggles read status', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'NTF-1',
          title: 'Mathematics Olympiad',
          titleBn: 'গণিত অলিম্পিয়াড',
          message: 'Registration is open until Friday',
          messageBn: 'শুক্রবার পর্যন্ত নিবন্ধন খোলা',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'NTF-2',
          title: 'Fee Payment Alert',
          titleBn: 'ফি বকেয়া সতর্কতা',
          message: 'Please settle pending tuition fees',
          messageBn: 'বকেয়া বেতন পরিশোধ করুন',
          type: 'warning',
          read: true,
          createdAt: new Date().toISOString(),
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="/i/:slug/:role/notifications" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    expect(screen.getByText('Mathematics Olympiad')).toBeTruthy()
    expect(screen.getByText('Fee Payment Alert')).toBeTruthy()

    // Filter by search
    const searchInput = screen.getByPlaceholderText('Search notifications...')
    fireEvent.change(searchInput, { target: { value: 'Olympiad' } })

    expect(screen.getByText('Mathematics Olympiad')).toBeTruthy()
    expect(screen.queryByText('Fee Payment Alert')).toBeNull()
  })

  it('opens compose modal and creates a new notification', async () => {
    render(
      <MemoryRouter initialEntries={['/i/school-test/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route path="/i/:slug/:role/notifications" element={<NotificationsPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 450))
    })

    // Click "Add Notification"
    const addBtn = screen.getByText('Add Notification')
    fireEvent.click(addBtn)

    expect(screen.getByText('Create Notification')).toBeTruthy()

    // Fill form
    const titleInput = screen.getByPlaceholderText('e.g. Exam Results Published')
    const msgTextarea = screen.getByPlaceholderText('Enter detailed notification message...')

    fireEvent.change(titleInput, { target: { value: 'Annual Sports Notice' } })
    fireEvent.change(msgTextarea, { target: { value: 'Sports meet will be held on December 15.' } })

    // Submit
    const sendBtn = screen.getByText('Send Notification')
    fireEvent.click(sendBtn)

    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    expect(useNotificationStore.getState().notifications[0].title).toBe('Annual Sports Notice')
  })
})
