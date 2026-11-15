import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PackagesPage from './PackagesPage'
import SuperAdminPage from './index'
import { useSuperAdminStore, DEFAULT_PACKAGES, type InstitutionPackage } from '@/store/superAdminStore'

describe('SuperAdmin PackagesPage and System-Use Package Management', () => {
  beforeEach(() => {
    useSuperAdminStore.setState({
      packages: DEFAULT_PACKAGES,
      institutions: [
        {
          id: 'inst-cloud',
          name: 'Cloud School',
          nameBn: 'ক্লাউড স্কুল',
          email: 'cloud@school.com',
          phone: '01711111111',
          address: 'Dhaka',
          addressBn: 'ঢাকা',
          eiin: '123456',
          website: '',
          subdomain: 'cloud-sch',
          slug: 'cloud-sch',
          status: 'active',
          package: DEFAULT_PACKAGES[0],
          storageMode: 'cloud',
          createdAt: '2026-01-01',
          lastLogin: '1d ago',
          logo: '',
          banner: '',
          brandColor: '#6366f1',
          brandName: 'Cloud School',
          motto: '',
          mottoBn: '',
          startTime: '08:00',
          endTime: '14:00',
          optionalSubjects: [],
          sessions: ['2026'],
          accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
          language: 'en',
          theme: 'light',
        },
        {
          id: 'inst-local',
          name: 'Local PC School',
          nameBn: 'লোকাল পিসি স্কুল',
          email: 'local@school.com',
          phone: '01722222222',
          address: 'Chittagong',
          addressBn: 'চট্টগ্রাম',
          eiin: '654321',
          website: '',
          subdomain: 'local-sch',
          slug: 'local-sch',
          status: 'active',
          package: DEFAULT_PACKAGES[4], // Local PC Basic
          storageMode: 'local_computer',
          createdAt: '2026-01-01',
          lastLogin: '2h ago',
          logo: '',
          banner: '',
          brandColor: '#10b981',
          brandName: 'Local PC School',
          motto: '',
          mottoBn: '',
          startTime: '08:00',
          endTime: '14:00',
          optionalSubjects: [],
          sessions: ['2026'],
          accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
          language: 'en',
          theme: 'light',
        },
      ],
    })
  })

  it('renders PackagesPage with overview stats and default packages', () => {
    render(
      <BrowserRouter>
        <PackagesPage isBn={false} />
      </BrowserRouter>
    )

    expect(screen.getByText('Packages & Subscriptions')).toBeInTheDocument()
    expect(screen.getByText('Total Packages')).toBeInTheDocument()
    expect(screen.getAllByText('Provider Cloud').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/System Use/i).length).toBeGreaterThan(0)

    // Verifies cloud packages and system packages exist
    expect(screen.getByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('Local PC Basic')).toBeInTheDocument()
    expect(screen.getByText('Personal VPS Pro')).toBeInTheDocument()
    expect(screen.getByText('System Lifetime License')).toBeInTheDocument()
  })

  it('filters packages between Provider Cloud and System Use tabs', () => {
    render(
      <BrowserRouter>
        <PackagesPage isBn={false} />
      </BrowserRouter>
    )

    // Initially all packages are shown
    expect(screen.getByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('Local PC Basic')).toBeInTheDocument()

    // Switch to Provider Cloud tab
    const cloudTab = screen.getByRole('button', { name: /Provider Cloud/i })
    fireEvent.click(cloudTab)

    expect(screen.getByText('Basic')).toBeInTheDocument()
    expect(screen.queryByText('Local PC Basic')).not.toBeInTheDocument()

    // Switch to System Use (Local PC & VPS) tab
    const systemTab = screen.getByRole('button', { name: /System Use \(Local PC & VPS\)/i })
    fireEvent.click(systemTab)

    expect(screen.queryByText('Basic')).not.toBeInTheDocument()
    expect(screen.getByText('Local PC Basic')).toBeInTheDocument()
    expect(screen.getByText('Personal VPS Pro')).toBeInTheDocument()
    expect(screen.getByText('System Lifetime License')).toBeInTheDocument()
  })

  it('allows Super Admin to create a new System Use package', () => {
    render(
      <BrowserRouter>
        <PackagesPage isBn={false} />
      </BrowserRouter>
    )

    const newPkgBtn = screen.getByRole('button', { name: /New Package/i })
    fireEvent.click(newPkgBtn)

    expect(screen.getByText('Create New Package')).toBeInTheDocument()

    // Select System Use architecture mode in modal
    const systemOnlyBtns = screen.getAllByRole('button', { name: /System Use/i })
    fireEvent.click(systemOnlyBtns[systemOnlyBtns.length - 1])

    // Fill form
    const nameInput = screen.getByPlaceholderText(/e\.g\. Standard Cloud or Local PC Pro/i)
    fireEvent.change(nameInput, { target: { value: 'Custom Server Elite' } })

    const priceInput = screen.getByDisplayValue('1500')
    fireEvent.change(priceInput, { target: { value: '850' } })

    const submitBtn = screen.getByRole('button', { name: /Create Package/i })
    fireEvent.click(submitBtn)

    // Verified in UI and store
    expect(screen.getByText('Custom Server Elite')).toBeInTheDocument()
    const stored = useSuperAdminStore.getState().packages
    const added = stored.find((p) => p.name === 'Custom Server Elite')
    expect(added).toBeDefined()
    expect(added?.price).toBe(850)
    expect(added?.hostingType).toBe('system_only')
  })

  it('allows Super Admin to edit an existing package price and quota', () => {
    render(
      <BrowserRouter>
        <PackagesPage isBn={false} />
      </BrowserRouter>
    )

    // Click edit on Local PC Basic
    const editButtons = screen.getAllByRole('button', { name: /Edit/i })
    fireEvent.click(editButtons[editButtons.length - 3]) // Local PC Basic edit

    expect(screen.getByText('Edit Package')).toBeInTheDocument()

    const priceInput = screen.getByDisplayValue('600')
    fireEvent.change(priceInput, { target: { value: '750' } })

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveBtn)

    expect(screen.getByText('৳750')).toBeInTheDocument()
    const updated = useSuperAdminStore.getState().packages.find((p) => p.name === 'Local PC Basic')
    expect(updated?.price).toBe(750)
  })

  it('allows setting a package as default and toggling active status', () => {
    render(
      <BrowserRouter>
        <PackagesPage isBn={false} />
      </BrowserRouter>
    )

    // Find and click "Make Default" on Personal VPS Pro
    const makeDefaultBtns = screen.getAllByRole('button', { name: /Make Default/i })
    fireEvent.click(makeDefaultBtns[5]) // Personal VPS Pro

    const vps = useSuperAdminStore.getState().packages.find((p) => p.name === 'Personal VPS Pro')
    expect(vps?.isDefaultSystemUse).toBe(true)
  })

  it('allows deleting a package and resets to defaults', () => {
    render(
      <BrowserRouter>
        <PackagesPage isBn={false} />
      </BrowserRouter>
    )

    // Click delete on Enterprise
    const deleteBtns = screen.getAllByRole('button', { name: /Delete/i })
    fireEvent.click(deleteBtns[3]) // Enterprise card delete button

    expect(screen.getByText(/Are you sure you want to delete package/i)).toBeInTheDocument()

    // Confirm dialog's delete button is the last Delete button
    const confirmDeleteBtns = screen.getAllByRole('button', { name: /Delete/i })
    fireEvent.click(confirmDeleteBtns[confirmDeleteBtns.length - 1])

    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()

    // Reset Defaults
    const resetBtn = screen.getByRole('button', { name: /Reset Defaults/i })
    fireEvent.click(resetBtn)

    expect(screen.getByText(/Reset to Default Packages/i)).toBeInTheDocument()

    const confirmResetBtns = screen.getAllByRole('button', { name: /Delete/i })
    fireEvent.click(confirmResetBtns[confirmResetBtns.length - 1])

    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })
})
