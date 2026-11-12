import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import NotificationsPage from './notifications'
import MessagesPage from './messages'
import NoticeBoardPage from './notice'
import AppLayout from '@/components/layouts/AppLayout'
import App from '@/App'

const mockAuthAdmin = {
  user: {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@school.com',
    role: 'admin',
    schoolId: 'school-1',
    institutionId: 'school-1',
    permissions: [],
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

const mockAuthTeacher = {
  user: {
    id: 'teacher-1',
    name: 'Teacher User',
    email: 'teacher@school.com',
    role: 'teacher',
    schoolId: 'school-1',
    institutionId: 'school-1',
    permissions: [],
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

const mockAuthStudent = {
  user: {
    id: 'student-1',
    name: 'Student User',
    email: 'student@school.com',
    role: 'student',
    schoolId: 'school-1',
    institutionId: 'school-1',
    permissions: [],
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

describe('Communication pages rendering with logged in admin and elapsed time', () => {
  it('reproduces with proper slug and navBase matching', async () => {
    sessionStorage.setItem('edutech_inst_slug', 'demo')
    localStorage.setItem('edutech_inst_slug', 'demo')

    render(
      <MemoryRouter initialEntries={['/i/demo/admin/messages']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/i/:slug/:role/messages" element={<MessagesPage />} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
  })

  it('renders NotificationsPage with admin after delay', async () => {
    render(
      <MemoryRouter initialEntries={['/i/demo/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <NotificationsPage />
        </AuthContext.Provider>
      </MemoryRouter>
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
  })

  it('renders MessagesPage with admin after delay', async () => {
    render(
      <MemoryRouter initialEntries={['/i/demo/admin/messages']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <MessagesPage />
        </AuthContext.Provider>
      </MemoryRouter>
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
  })

  it('renders NoticeBoardPage with admin after delay', async () => {
    render(
      <MemoryRouter initialEntries={['/i/demo/admin/notice']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <NoticeBoardPage />
        </AuthContext.Provider>
      </MemoryRouter>
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
  })

  it('renders AppLayout with Messages route for admin after delay', async () => {
    render(
      <MemoryRouter initialEntries={['/i/demo/admin/messages']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/i/:slug/:role/messages" element={<MessagesPage />} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
  })

  it('renders AppLayout with Notifications route for admin after delay', async () => {
    render(
      <MemoryRouter initialEntries={['/i/demo/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/i/:slug/:role/notifications" element={<NotificationsPage />} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
  })

  it('renders AppLayout with Notice route for admin after delay', async () => {
    render(
      <MemoryRouter initialEntries={['/i/demo/admin/notice']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/i/:slug/:role/notice" element={<NoticeBoardPage />} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
  })

  it('renders with teacher role on messages, notifications, notice', async () => {
    sessionStorage.setItem('edutech_inst_slug', 'demo')
    localStorage.setItem('edutech_inst_slug', 'demo')
    for (const page of ['messages', 'notifications', 'notice']) {
      render(
        <MemoryRouter initialEntries={[`/i/demo/teacher/${page}`]}>
          <AuthContext.Provider value={mockAuthTeacher}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/i/:slug/:role/messages" element={<MessagesPage />} />
                <Route path="/i/:slug/:role/notifications" element={<NotificationsPage />} />
                <Route path="/i/:slug/:role/notice" element={<NoticeBoardPage />} />
              </Route>
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      )
      await act(async () => {
        await new Promise((r) => setTimeout(r, 600))
      })
    }
  })

  it('navigates from dashboard to communication pages via sidebar click', async () => {
    sessionStorage.setItem('edutech_inst_slug', 'demo')
    localStorage.setItem('edutech_inst_slug', 'demo')
    localStorage.setItem(
      'edutech_offline_session',
      JSON.stringify({
        user: mockAuthAdmin.user,
        savedAt: Date.now(),
        slug: 'demo',
        role: 'admin',
      })
    )

    const { container } = render(
      <MemoryRouter initialEntries={['/i/demo/admin/dashboard']}>
        <App />
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })

    // Find sidebar link for messages
    const messageLink = container.querySelector('a[href="/i/demo/admin/messages"]')
    expect(messageLink).toBeTruthy()
    if (messageLink) {
      await act(async () => {
        messageLink.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await new Promise((r) => setTimeout(r, 600))
      })
    }

    // Find sidebar link for notice
    const noticeLink = container.querySelector('a[href="/i/demo/admin/notice"]')
    expect(noticeLink).toBeTruthy()
    if (noticeLink) {
      await act(async () => {
        noticeLink.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await new Promise((r) => setTimeout(r, 600))
      })
    }

    // Find sidebar link for notifications
    const notifLink = container.querySelector('a[href="/i/demo/admin/notifications"]')
    expect(notifLink).toBeTruthy()
    if (notifLink) {
      await act(async () => {
        notifLink.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await new Promise((r) => setTimeout(r, 600))
      })
    }
  })
})
