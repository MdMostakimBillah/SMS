import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import InstitutionLoginRoute from './InstitutionLoginRoute'
import InstitutionLanding from '@/pages/institution/InstitutionLanding'
import { useSuperAdminStore, PACKAGES } from '@/store/superAdminStore'
import { authApi } from '@/lib/api'
import { purgeInstitutionStorage } from '@/lib/storage'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    restoreFailed: false,
    retryRestore: vi.fn(),
  }),
  AuthContext: {
    Consumer: ({ children }: any) => children({ user: null }),
    Provider: ({ children }: any) => children,
  },
}))

vi.mock('@/lib/api', () => ({
  authApi: {
    getPublicSchool: vi.fn(),
    deleteSchool: vi.fn().mockResolvedValue({ success: true }),
  },
  resolveMediaUrl: (url: string) => url,
}))

describe('Institution path removal when deleted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    useSuperAdminStore.setState({
      institutions: [],
      viewingInstitutionId: null,
    })
  })

  it('renders 404 NotFoundPage on /i/:slug/login when institution does not exist on server', async () => {
    vi.mocked(authApi.getPublicSchool).mockResolvedValueOnce(null as any)

    render(
      <MemoryRouter initialEntries={['/i/removed-school/login']}>
        <Routes>
          <Route path="/i/:slug/login" element={<InstitutionLoginRoute />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Page not found')).toBeInTheDocument()
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
    })
  })

  it('renders 404 NotFoundPage on /i/:slug when institution does not exist on server', async () => {
    vi.mocked(authApi.getPublicSchool).mockResolvedValueOnce(null as any)

    render(
      <MemoryRouter initialEntries={['/i/removed-school']}>
        <Routes>
          <Route path="/i/:slug" element={<InstitutionLanding />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Page not found')).toBeInTheDocument()
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
    })
  })

  it('removes institution from client store and renders 404 if server returns 404 for previously cached institution', async () => {
    // Add cached institution to superAdminStore
    useSuperAdminStore.setState({
      institutions: [
        {
          id: 'inst-removed',
          name: 'Deleted High School',
          nameBn: 'মুছে ফেলা স্কুল',
          email: 'deleted@school.com',
          phone: '01700000000',
          address: 'Dhaka',
          subdomain: 'deleted-school',
          slug: 'deleted-school',
          status: 'active',
          package: PACKAGES[0],
          storageMode: 'cloud',
          storageBytes: 0,
          mediaCount: 0,
          createdAt: '2026-01-01',
          lastLogin: 'Never',
          logo: '',
          banner: '',
          brandColor: '#6366f1',
        },
      ],
    })

    // Server returns not found (e.g. 404 or null)
    vi.mocked(authApi.getPublicSchool).mockRejectedValueOnce({ status: 404, message: 'Institution not found' })

    render(
      <MemoryRouter initialEntries={['/i/deleted-school/login']}>
        <Routes>
          <Route path="/i/:slug/login" element={<InstitutionLoginRoute />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Page not found')).toBeInTheDocument()
      // Store should have pruned the deleted institution
      expect(
        useSuperAdminStore.getState().institutions.some((i) => i.slug === 'deleted-school')
      ).toBe(false)
    })
  })

  it('purgeInstitutionStorage cleans up localStorage keys and active slug for removed institution', () => {
    localStorage.setItem('edutech_inst_slug', 'demo-school')
    localStorage.setItem('edutech_teachers_demo-school', JSON.stringify([{ id: '1' }]))
    localStorage.setItem('edutech_classes_demo-school', JSON.stringify([{ id: '2' }]))
    localStorage.setItem('edutech_unrelated_other-school', JSON.stringify([{ id: '3' }]))

    purgeInstitutionStorage('demo-school')

    expect(localStorage.getItem('edutech_inst_slug')).toBeNull()
    expect(localStorage.getItem('edutech_teachers_demo-school')).toBeNull()
    expect(localStorage.getItem('edutech_classes_demo-school')).toBeNull()
    // Unrelated institution data must stay intact
    expect(localStorage.getItem('edutech_unrelated_other-school')).not.toBeNull()
  })
})
