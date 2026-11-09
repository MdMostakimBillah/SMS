import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DuesTab } from './DuesTab'
import { useFeeStore } from '@/store/feeStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canExport: () => true,
    canPrint: () => true,
  }),
}))

vi.mock('@/hooks/useBn', () => ({
  useBn: () => false,
}))

describe('DuesTab Filters and Table', () => {
  const currentMonthIdx = new Date().getMonth()

  const mockStudents = [
    {
      id: 'STU-001',
      nameEn: 'Arafat Rahman',
      nameBn: 'আরাফাত রহমান',
      class: 'Class 9',
      section: 'A',
      roll: '01',
      photo: '',
      status: 'approved' as const,
      active: true,
      academicYear: '2025-26',
    },
    {
      id: 'STU-002',
      nameEn: 'Nusrat Jahan',
      nameBn: 'নুসরাত জাহান',
      class: 'Class 9',
      section: 'A',
      roll: '02',
      photo: '',
      status: 'approved' as const,
      active: true,
      academicYear: '2025-26',
    },
    {
      id: 'STU-003',
      nameEn: 'Tanvir Ahmed',
      nameBn: 'তানভীর আহমেদ',
      class: 'Class 9',
      section: 'A',
      roll: '03',
      photo: '',
      status: 'approved' as const,
      active: true,
      academicYear: '2025-26',
    },
  ]

  const mockStructures = [
    {
      id: 'FEE-STRUCT-TUITION',
      name: 'Tuition Fee',
      nameBn: 'মাসিক বেতন',
      class: 'Class 9',
      academicYear: '2025-26',
      amount: 1000,
      description: 'Monthly Tuition',
      descriptionBn: 'মাসিক বেতন',
      isActive: true,
      type: 'monthly' as const,
      createdAt: '2025-01-01',
    },
  ]

  // STU-001 has fully paid the current month (1000)
  // STU-002 has partially paid the current month (400 paid, 600 due)
  // STU-003 has paid nothing (0 paid, 1000 due)
  const currentMonthKey = `${new Date().getFullYear()}-${String(currentMonthIdx + 1).padStart(2, '0')}`

  const mockPayments = [
    {
      id: 'PAY-1',
      studentId: 'STU-001',
      feeStructureId: 'FEE-STRUCT-TUITION',
      amount: 1000,
      discount: 0,
      paidAt: `${new Date().getFullYear()}-${String(currentMonthIdx + 1).padStart(2, '0')}-05T10:00:00Z`,
      method: 'cash' as const,
      reference: '',
      note: 'Full payment',
      collectedBy: 'Admin',
      createdAt: '2026-11-05',
      forMonth: currentMonthKey,
    },
    {
      id: 'PAY-2',
      studentId: 'STU-002',
      feeStructureId: 'FEE-STRUCT-TUITION',
      amount: 400,
      discount: 0,
      paidAt: `${new Date().getFullYear()}-${String(currentMonthIdx + 1).padStart(2, '0')}-06T10:00:00Z`,
      method: 'cash' as const,
      reference: '',
      note: 'Partial payment',
      collectedBy: 'Admin',
      createdAt: '2026-11-06',
      forMonth: currentMonthKey,
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useAdmissionStore.setState({
      students: mockStudents as any,
    })
    useClassStore.setState({
      institution: {
        id: 'INST-1',
        name: 'EduTech Academy',
        currentSession: '2025-26',
        sessions: ['2025-26'],
      } as any,
      classes: [
        {
          id: 'CLS-9',
          name: 'Class 9',
          nameBn: '৯ম শ্রেণি',
          sections: [{ id: 'SEC-A', name: 'A', nameBn: 'ক' }],
        } as any,
      ],
    })
    useFeeStore.setState({
      structures: mockStructures,
      payments: mockPayments,
      waiverEntries: [],
      studentWaivers: [],
    })
  })

  it('renders all students when status filter is "all"', () => {
    renderWithRouter(<DuesTab onCollect={vi.fn()} />)

    expect(screen.getByText('Arafat Rahman')).toBeInTheDocument()
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
  })

  it('filters properly for "paid": shows only fully paid student', () => {
    renderWithRouter(<DuesTab onCollect={vi.fn()} />)

    // Select "Paid" in status dropdown
    const selects = screen.getAllByRole('combobox')
    // Find the status select (which contains 'Paid' option)
    const statusSelect = selects.find((sel) => sel.querySelector('option[value="paid"]'))
    expect(statusSelect).toBeDefined()

    fireEvent.change(statusSelect!, { target: { value: 'paid' } })

    // Arafat Rahman (fully paid) should be present
    expect(screen.getByText('Arafat Rahman')).toBeInTheDocument()
    // Nusrat Jahan (partially paid) and Tanvir Ahmed (unpaid) should not be present
    expect(screen.queryByText('Nusrat Jahan')).not.toBeInTheDocument()
    expect(screen.queryByText('Tanvir Ahmed')).not.toBeInTheDocument()
  })

  it('filters properly for "paiddue": shows only students with both paid and due amounts', () => {
    renderWithRouter(<DuesTab onCollect={vi.fn()} />)

    const selects = screen.getAllByRole('combobox')
    const statusSelect = selects.find((sel) => sel.querySelector('option[value="paiddue"]'))
    expect(statusSelect).toBeDefined()

    fireEvent.change(statusSelect!, { target: { value: 'paiddue' } })

    // Nusrat Jahan (paid 400, due 600) should be present
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    // Arafat Rahman (paid 1000, due 0) and Tanvir Ahmed (paid 0, due 1000) should not be present
    expect(screen.queryByText('Arafat Rahman')).not.toBeInTheDocument()
    expect(screen.queryByText('Tanvir Ahmed')).not.toBeInTheDocument()
  })

  it('filters properly for "due": shows students who have due', () => {
    renderWithRouter(<DuesTab onCollect={vi.fn()} />)

    const selects = screen.getAllByRole('combobox')
    const statusSelect = selects.find((sel) => sel.querySelector('option[value="due"]'))
    expect(statusSelect).toBeDefined()

    fireEvent.change(statusSelect!, { target: { value: 'due' } })

    // Tanvir Ahmed (due 1000) and Nusrat Jahan (due 600) have due
    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    // Arafat Rahman (due 0) should not be present
    expect(screen.queryByText('Arafat Rahman')).not.toBeInTheDocument()
  })

  it('renders table with font size classes matching collection page (text-[0.8125rem])', () => {
    const { container } = renderWithRouter(<DuesTab onCollect={vi.fn()} />)

    const table = container.querySelector('table')
    expect(table).toHaveClass('text-[0.8125rem]')

    // Headers should have uppercase tracking-wider and text-[0.6875rem]
    const ths = container.querySelectorAll('th')
    expect(ths.length).toBeGreaterThan(0)
    expect(ths[1]).toHaveClass('text-[0.6875rem]')
  })
})
