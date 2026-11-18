import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SchoolsPage from './SchoolsPage'
import { useSuperAdminStore, PACKAGES } from '@/store/superAdminStore'
import { authApi } from '@/lib/api'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'sa-1', email: 'admin@edutech.com', role: 'super_admin' },
  }),
}))

vi.mock('@/lib/api', () => ({
  authApi: {
    getSchools: vi.fn().mockResolvedValue([]),
    updateSchool: vi.fn().mockResolvedValue({}),
    deleteSchool: vi.fn().mockResolvedValue({ success: true }),
  },
  resolveMediaUrl: (url: string) => url,
}))

describe('SchoolsPage storage size badge and super admin display', () => {
  it('displays provider server storage size for institution in local_computer mode instead of "Local Storage"', async () => {
    useSuperAdminStore.setState({
      institutions: [
        {
          id: 'inst-udvash',
          name: 'Udvash Academic & Admission Care',
          nameBn: 'উদ্ভাস',
          email: 'udvash@gmail.com',
          phone: '01711000000',
          address: 'Dhaka',
          subdomain: 'udvash',
          slug: 'udvash',
          status: 'active',
          package: PACKAGES[1], // Standard
          storageMode: 'local_computer',
          storageBytes: 13002342, // ~12.4 MB
          mediaCount: 14,
          createdAt: '2026-01-01',
          lastLogin: '10m ago',
          logo: '',
          banner: '',
          brandColor: '#6366f1',
        },
      ],
      selectedId: null,
      searchQuery: '',
      statusFilter: 'all',
      packageFilter: 'all',
    })

    render(
      <BrowserRouter>
        <SchoolsPage />
      </BrowserRouter>
    )

    // Check that "12.4 MB" is rendered on the screen
    expect(screen.getByText('12.4 MB')).toBeInTheDocument()

    // Ensure the old static placeholder text "Local Storage" / "পিসি স্টোরেজ" is NOT displayed as storage size
    expect(screen.queryByText('Local Storage')).not.toBeInTheDocument()
    expect(screen.queryByText('পিসি স্টোরেজ')).not.toBeInTheDocument()

    // But the architecture badge "Local PC" is still present
    expect(screen.getByText('Local PC')).toBeInTheDocument()
  })

  it('allows super admin to delete any institution directly', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    useSuperAdminStore.setState({
      institutions: [
        {
          id: 'b903f56f-2a26-411f-81f4-d7f0122bdc52',
          name: 'Main Super Admin School',
          nameBn: 'মূল স্কুল',
          email: 'admin@edutech.local',
          phone: '01711000000',
          address: 'Dhaka',
          subdomain: 'main',
          slug: 'main',
          status: 'active',
          package: PACKAGES[0],
          storageMode: 'cloud',
          storageBytes: 1024,
          mediaCount: 1,
          createdAt: '2026-01-01',
          lastLogin: '10m ago',
          logo: '',
          banner: '',
          brandColor: '#6366f1',
        },
      ],
      selectedId: 'b903f56f-2a26-411f-81f4-d7f0122bdc52',
      searchQuery: '',
      statusFilter: 'all',
      packageFilter: 'all',
    })

    render(
      <BrowserRouter>
        <SchoolsPage />
      </BrowserRouter>
    )

    // Verify delete button is present (not disabled or replaced with lock icon)
    const deleteBtn = screen.getByTitle('Delete Institution')
    expect(deleteBtn).toBeInTheDocument()

    // Click delete
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(authApi.deleteSchool).toHaveBeenCalledWith('b903f56f-2a26-411f-81f4-d7f0122bdc52')
      expect(useSuperAdminStore.getState().institutions).toHaveLength(0)
    })
  })
})
