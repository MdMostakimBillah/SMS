import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OthersIncomePage from './index'
import { useOthersIncomeStore } from '@/store/othersIncomeStore'
import { useAdmissionStore } from '@/store/admissionStore'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canRead: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canExport: () => true,
  }),
}))

describe('OthersIncomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useOthersIncomeStore.setState({
      categories: [
        {
          id: 'OIC-1',
          name: 'Daycare Service',
          nameBn: 'ডেকেয়ার সার্ভিস',
          amount: 1500,
          type: 'monthly',
          totalMonths: [0, 1, 2, 3],
          description: 'Full day care',
          descriptionBn: 'সারাদিনের যত্ন',
          isActive: true,
          createdAt: '2026-11-06',
        },
      ],
      assignments: [],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
    useAdmissionStore.setState({
      students: [
        {
          id: 'ST-001',
          nameEn: 'Sadman Sakib',
          nameBn: 'সাদমান সাকিব',
          class: 'Class 6',
          section: 'A',
          roll: '1',
          status: 'approved',
          active: true,
          phone: '01700000000',
        } as any,
      ],
    })
    vi.restoreAllMocks()
  })

  it('renders the header and categories tab with data', async () => {
    render(<OthersIncomePage />)

    // Wait for initial skeleton loading to finish
    await waitFor(() => {
      expect(screen.getByText('Daycare Service')).toBeInTheDocument()
    })

    expect(screen.getByText('Others Income')).toBeInTheDocument()
    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(screen.getByText('Assignments')).toBeInTheDocument()
  })

  it('switches between Categories and Assignments tabs', async () => {
    render(<OthersIncomePage />)

    await waitFor(() => {
      expect(screen.getByText('Daycare Service')).toBeInTheDocument()
    })

    const assignmentsTabBtn = screen.getByRole('button', { name: /assignments/i })
    fireEvent.click(assignmentsTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/no assignments found/i)).toBeInTheDocument()
    })
  })

  it('filters categories when typing in the search bar', async () => {
    render(<OthersIncomePage />)

    await waitFor(() => {
      expect(screen.getByText('Daycare Service')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText(/no categories found/i)).toBeInTheDocument()
    })

    fireEvent.change(searchInput, { target: { value: 'Daycare' } })

    await waitFor(() => {
      expect(screen.getByText('Daycare Service')).toBeInTheDocument()
    })
  })

  it('opens CategoryModal and adds a new category', async () => {
    render(<OthersIncomePage />)

    await waitFor(() => {
      expect(screen.getByText('Daycare Service')).toBeInTheDocument()
    })

    const addBtn = screen.getByRole('button', { name: /add category/i })
    fireEvent.click(addBtn)

    expect(screen.getByText('New Category')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText(/e\.g\. Daycare Fee/i)
    fireEvent.change(nameInput, { target: { value: 'Transport Special' } })

    const amountInput = screen.getByPlaceholderText('0')
    fireEvent.change(amountInput, { target: { value: '800' } })

    const createBtn = screen.getByRole('button', { name: /create/i })
    fireEvent.click(createBtn)

    await waitFor(() => {
      expect(screen.getByText('Transport Special')).toBeInTheDocument()
    })

    const cat = useOthersIncomeStore.getState().categories.find((c) => c.name === 'Transport Special')
    expect(cat).toBeDefined()
    expect(cat?.amount).toBe(800)
  })

  it('assigns a student to a category via AssignmentModal', async () => {
    render(<OthersIncomePage />)

    await waitFor(() => {
      expect(screen.getByText('Daycare Service')).toBeInTheDocument()
    })

    // Switch to assignments tab
    fireEvent.click(screen.getByRole('button', { name: /^assignments$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^assign$/i })).toBeInTheDocument()
    })

    // Click assign button
    fireEvent.click(screen.getByRole('button', { name: /^assign$/i }))

    expect(screen.getByText('New Assignment')).toBeInTheDocument()

    // Select category
    const catSelect = screen.getByRole('combobox')
    fireEvent.change(catSelect, { target: { value: 'OIC-1' } })

    // Open student dropdown
    const studentInput = screen.getByPlaceholderText(/select student/i)
    fireEvent.click(studentInput)

    // Select Sadman Sakib
    const studentOption = screen.getByText('Sadman Sakib')
    fireEvent.click(studentOption)

    // Submit assignment (modal footer button)
    const assignBtns = screen.getAllByRole('button', { name: /^assign$/i })
    const submitBtn = assignBtns[assignBtns.length - 1]
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Sadman Sakib')).toBeInTheDocument()
    })

    expect(useOthersIncomeStore.getState().assignments).toHaveLength(1)
    expect(useOthersIncomeStore.getState().assignments[0].studentId).toBe('ST-001')
  })
})
