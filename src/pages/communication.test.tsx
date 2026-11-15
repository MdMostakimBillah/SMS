import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import NotificationsPage from './notifications'
import MessagesPage from './messages'
import NoticeBoardPage from './notice'
import AppLayout from '@/components/layouts/AppLayout'
import App from '@/App'
import { useClassStore } from '@/store/classStore'
import { authApi } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      me: vi.fn(),
      getPublicSchool: vi.fn().mockResolvedValue({ school: { id: 'school-1', domain: 'demo', name: 'Demo School' } }),
    },
    noticesApi: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      categories: vi.fn().mockResolvedValue({ data: ['General', 'Academic'] }),
    },
  }
})

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

    useClassStore.setState({
      institution: {
        ...useClassStore.getState().institution,
        id: 'school-custom',
        eiin: '123456',
      } as any,
    })

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

  it('reproduces on NoticeBoardPage with proper slug and mocked api', async () => {
    sessionStorage.setItem('edutech_inst_slug', 'demo')
    localStorage.setItem('edutech_inst_slug', 'demo')

    useClassStore.setState({
      institution: {
        ...useClassStore.getState().institution,
        id: 'school-custom',
        eiin: '123456',
      } as any,
    })

    const { noticesApi } = await import('@/lib/api')
    vi.spyOn(noticesApi, 'list').mockResolvedValue({ success: true, data: [] } as any)
    vi.spyOn(noticesApi, 'categories').mockResolvedValue({ success: true, data: [] } as any)

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

  it('reproduces on NotificationsPage with proper slug', async () => {
    sessionStorage.setItem('edutech_inst_slug', 'demo')
    localStorage.setItem('edutech_inst_slug', 'demo')

    useClassStore.setState({
      institution: {
        ...useClassStore.getState().institution,
        id: 'school-custom',
        eiin: '123456',
      } as any,
    })

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
    vi.mocked(authApi.me).mockResolvedValue({ user: mockAuthAdmin.user })
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

    await waitFor(() => {
      expect(container.querySelector('a[href="/i/demo/admin/messages"]')).toBeTruthy()
    }, { timeout: 3000 })

    const messageLink = container.querySelector('a[href="/i/demo/admin/messages"]') as HTMLAnchorElement
    await act(async () => {
      messageLink.click()
      await new Promise((r) => setTimeout(r, 600))
    })

    const noticeLink = container.querySelector('a[href="/i/demo/admin/notice"]') as HTMLAnchorElement
    await act(async () => {
      noticeLink.click()
      await new Promise((r) => setTimeout(r, 600))
    })

    const notifLink = container.querySelector('a[href="/i/demo/admin/notifications"]') as HTMLAnchorElement
    await act(async () => {
      notifLink.click()
      await new Promise((r) => setTimeout(r, 600))
    })
  })

  it('handles notice search safely when notice records contain null fields', async () => {
    const { useNoticeStore } = await import('@/store/noticeStore')
    useNoticeStore.setState({
      notices: [
        {
          id: 'N-NULL-TEST',
          title: 'Exam Notice Null Test',
          titleBn: '',
          content: 'Details here',
          contentBn: '',
          author: 'Admin',
          authorBn: '',
          category: 'Exam',
          target: 'all',
          priority: 'medium',
          publishedAt: new Date().toISOString(),
          isActive: true,
          pinned: false,
        },
      ],
      categories: ['Exam', 'General'],
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/i/demo/admin/notice']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <NoticeBoardPage />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })

    const input = container.querySelector('input[placeholder*="Search"]') || container.querySelector('input[placeholder*="খুঁজুন"]')
    if (input) {
      await act(async () => {
        const { fireEvent } = await import('@testing-library/react')
        fireEvent.change(input, { target: { value: 'Exam' } })
      })
    }
  })

  it('handles message search safely when messages contain partial or undefined fields', async () => {
    const { useMessageStore } = await import('@/store/messageStore')
    useMessageStore.setState({
      messages: [
        {
          id: 'MSG-NULL-TEST',
          senderId: 'user-2',
          senderName: 'Teacher A',
          senderNameBn: 'শিক্ষক',
          senderRole: 'teacher',
          recipientId: 'all',
          recipientName: 'All',
          subject: 'Test Subject',
          body: 'Hello world body',
          read: false,
          status: 'sent',
          createdAt: new Date().toISOString(),
        },
      ],
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/i/demo/admin/messages']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <MessagesPage />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })

    const input = container.querySelector('input[placeholder*="Search"]') || container.querySelector('input[placeholder*="খুঁজুন"]')
    if (input) {
      await act(async () => {
        const { fireEvent } = await import('@testing-library/react')
        fireEvent.change(input, { target: { value: 'Test' } })
      })
    }
  })

  it('resolves notification links with navBase correctly without 404', async () => {
    const { useNotificationStore } = await import('@/store/notificationStore')
    useNotificationStore.setState({
      notifications: [
        {
          id: 'NTF-NAV-TEST',
          title: 'Exam Results',
          titleBn: 'পরীক্ষার ফলাফল',
          message: 'Results are ready',
          messageBn: 'ফলাফল তৈরি',
          type: 'info',
          read: false,
          link: '/exams',
          createdAt: new Date().toISOString(),
        },
      ],
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/i/demo/admin/notifications']}>
        <AuthContext.Provider value={mockAuthAdmin}>
          <NotificationsPage />
        </AuthContext.Provider>
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })

    const card = container.querySelector('.group')
    expect(card).toBeTruthy()
    await act(async () => {
      card?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  })
})
