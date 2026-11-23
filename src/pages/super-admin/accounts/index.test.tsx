import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SuperAdminAccountsPage from './index'
import { useUserAccountStore, type UserAccount } from '@/store/userAccountStore'
import { useSuperAdminStore } from '@/store/superAdminStore'

describe('SuperAdminAccountsPage', () => {
  const mockAccounts: UserAccount[] = [
    {
      id: 'acc-stu-STU-001',
      schoolId: 'school-1',
      schoolName: 'Ideal School',
      role: 'student',
      studentId: 'STU-001',
      studentNameEn: 'Rahim Ahmed',
      studentNameBn: 'রহিম আহমেদ',
      class: 'Class 9',
      section: 'A',
      roll: '01',
      username: 'STU-001',
      password: 'initialPassword1',
      phone: '01711000001',
      email: 'rahim@school.com',
      status: 'active',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'acc-par-STU-001',
      schoolId: 'school-1',
      schoolName: 'Ideal School',
      role: 'parent',
      studentId: 'STU-001',
      studentNameEn: 'Rahim Ahmed',
      studentNameBn: 'রহিম আহমেদ',
      guardianName: 'Kabir Ahmed',
      guardianRelation: 'Father',
      class: 'Class 9',
      section: 'A',
      roll: '01',
      username: '01711000001',
      password: 'parentPassword1',
      phone: '01711000001',
      email: 'kabir@gmail.com',
      status: 'active',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'acc-stu-STU-002',
      schoolId: 'school-2',
      schoolName: 'Model Academy',
      role: 'student',
      studentId: 'STU-002',
      studentNameEn: 'Fatima Begum',
      studentNameBn: 'ফাতিমা বেগম',
      class: 'Class 10',
      section: 'B',
      roll: '05',
      username: 'fatima_02',
      password: 'secretPassword2',
      phone: '01811000002',
      email: 'fatima@school.com',
      status: 'locked',
      createdAt: '2026-01-02',
      updatedAt: '2026-01-02',
    },
  ]

  beforeEach(() => {
    useUserAccountStore.setState({ accounts: mockAccounts })
    useSuperAdminStore.setState({
      institutions: [
        {
          id: 'school-1',
          name: 'Ideal School',
          nameBn: 'আইডিয়াল স্কুল',
          email: 'ideal@gmail.com',
          phone: '01711000000',
          address: 'Dhaka',
          addressBn: 'ঢাকা',
          eiin: '123456',
          website: 'ideal.edu.bd',
          subdomain: 'ideal',
          slug: 'ideal',
          status: 'active',
          package: { name: 'Standard', nameBn: 'স্ট্যান্ডার্ড', maxStudents: 500, maxTeachers: 50, maxClasses: 20, pricePerStudent: 10, price: 2000, duration: 30 },
          createdAt: '2026-01-01',
          lastLogin: 'Today',
          logo: '',
          banner: '',
          brandColor: '#6366f1',
          brandName: 'Ideal',
          motto: '',
          mottoBn: '',
          startTime: '08:00',
          endTime: '14:00',
          optionalSubjects: [],
          sessions: ['2025-26'],
          accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
          language: 'en',
          theme: 'light',
        },
      ],
    })
  })

  it('renders account statistics and table rows', () => {
    render(
      <BrowserRouter>
        <SuperAdminAccountsPage />
      </BrowserRouter>
    )

    // Check header and cards
    expect(screen.getByText(/Student & Parent Credentials/i)).toBeInTheDocument()
    expect(screen.getByText('Rahim Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Kabir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Fatima Begum')).toBeInTheDocument()
  })

  it('filters by role (Students vs Parents)', () => {
    render(
      <BrowserRouter>
        <SuperAdminAccountsPage />
      </BrowserRouter>
    )

    // Click "Students" pill
    const studentBtn = screen.getByRole('button', { name: /^Students$/i })
    fireEvent.click(studentBtn)

    expect(screen.getByText('Rahim Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Fatima Begum')).toBeInTheDocument()
    expect(screen.queryByText('Kabir Ahmed')).not.toBeInTheDocument()

    // Click "Parents" pill
    const parentBtn = screen.getByRole('button', { name: /^Parents$/i })
    fireEvent.click(parentBtn)

    expect(screen.getByText('Kabir Ahmed')).toBeInTheDocument()
    expect(screen.queryByText('Fatima Begum')).not.toBeInTheDocument()
  })

  it('searches accounts by student ID or name', () => {
    render(
      <BrowserRouter>
        <SuperAdminAccountsPage />
      </BrowserRouter>
    )

    const searchInput = screen.getByPlaceholderText(/Search by name, roll, username/i)
    fireEvent.change(searchInput, { target: { value: 'Fatima' } })

    expect(screen.getByText('Fatima Begum')).toBeInTheDocument()
    expect(screen.queryByText('Kabir Ahmed')).not.toBeInTheDocument()
  })

  it('updates username for an account', async () => {
    render(
      <BrowserRouter>
        <SuperAdminAccountsPage />
      </BrowserRouter>
    )

    // Find Edit Username button for Rahim
    const editBtns = screen.getAllByTitle('Edit Username')
    fireEvent.click(editBtns[0])

    expect(screen.getByText('Edit Username')).toBeInTheDocument()
    const input = screen.getByPlaceholderText(/e\.g\. STU-2025-001/i)
    fireEvent.change(input, { target: { value: 'rahim_new_user' } })

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('rahim_new_user')).toBeInTheDocument()
    })
  })

  it('resets password and generates 6-digit PIN', async () => {
    render(
      <BrowserRouter>
        <SuperAdminAccountsPage />
      </BrowserRouter>
    )

    // Find Reset Password button for first account
    const resetBtns = screen.getAllByTitle('Reset Password')
    fireEvent.click(resetBtns[0])

    expect(screen.getByText('Reset Password')).toBeInTheDocument()

    // Click 6-Digit PIN generator
    const pinBtn = screen.getByRole('button', { name: /6-Digit PIN/i })
    fireEvent.click(pinBtn)

    const setPassBtn = screen.getByRole('button', { name: /^Set Password$/i })
    fireEvent.click(setPassBtn)

    // Password was updated
    const accounts = useUserAccountStore.getState().accounts
    expect(accounts[0].password).toMatch(/^\d{6}$/)
  })

  it('toggles lock/unlock status', () => {
    render(
      <BrowserRouter>
        <SuperAdminAccountsPage />
      </BrowserRouter>
    )

    // Fatima Begum is initially locked
    const unlockBtns = screen.getAllByTitle('Unlock Account')
    fireEvent.click(unlockBtns[0])

    const accounts = useUserAccountStore.getState().accounts
    const fatima = accounts.find((a) => a.id === 'acc-stu-STU-002')
    expect(fatima?.status).toBe('active')
  })

  it('opens bulk actions modal and applies default password', async () => {
    render(
      <BrowserRouter>
        <SuperAdminAccountsPage />
      </BrowserRouter>
    )

    const bulkBtn = screen.getByRole('button', { name: /Bulk Reset/i })
    fireEvent.click(bulkBtn)

    expect(screen.getByText('Bulk Credential Management')).toBeInTheDocument()

    // Select Default (123456)
    const defaultRadio = screen.getByText('Default (123456)')
    fireEvent.click(defaultRadio)

    const applyBtn = screen.getByRole('button', { name: /Apply Bulk Update/i })
    fireEvent.click(applyBtn)

    const accounts = useUserAccountStore.getState().accounts
    expect(accounts.every((a) => a.password === '123456')).toBe(true)
  })

  it('opens print slips and export modal', () => {
    render(
      <BrowserRouter>
        <SuperAdminAccountsPage />
      </BrowserRouter>
    )

    const exportBtn = screen.getByRole('button', { name: /Print Slips \/ Export/i })
    fireEvent.click(exportBtn)

    expect(screen.getByText('Credential Slips & Export')).toBeInTheDocument()
    expect(screen.getByText(/3 account credential slips ready/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download CSV/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Print Slips$/i })).toBeInTheDocument()
  })
})
