import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ExpensesManagementPage from './index'
import { useExpenseStore, PREDEFINED_CATEGORIES } from '@/store/expenseStore'
import { expensesApi } from '@/lib/api'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canRead: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canExport: () => true,
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'U-1', username: 'admin', role: 'school_admin' },
  }),
}))

describe('ExpensesManagementPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useExpenseStore.setState({
      categories: [
        ...PREDEFINED_CATEGORIES,
        {
          id: 'EXP-CAT-CUSTOM',
          name: 'Annual Sports Day',
          nameBn: 'বার্ষিক ক্রীড়া প্রতিযোগিতা',
          icon: 'gift',
          isSystem: false,
          isActive: true,
          createdAt: '2026-11-06',
        },
      ],
      expenses: [
        {
          id: 'EXP-1',
          categoryId: 'EXP-CAT-001',
          amount: 15000,
          date: '2026-11-01',
          description: 'Office staff salary',
          descriptionBn: 'অফিস কর্মীদের বেতন',
          paymentMethod: 'bank',
          isRecurring: false,
          recurringMonths: [],
          academicYear: '2025-26',
          createdBy: 'Admin',
          createdAt: '2026-11-01',
          isActive: true,
        },
      ],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
    vi.restoreAllMocks()
  })

  it('renders the header and categories tab with data', async () => {
    render(<ExpensesManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument()
    })

    expect(screen.getByText('Expense Management')).toBeInTheDocument()
    expect(screen.getByText('Total Categories')).toBeInTheDocument()
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
  })

  it('switches between Categories, Expenses, and Recurring tabs', async () => {
    render(<ExpensesManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument()
    })

    // Switch to Expenses tab
    const expensesTabBtn = screen.getByRole('button', { name: /^expenses$/i })
    fireEvent.click(expensesTabBtn)

    await waitFor(() => {
      expect(screen.getByText('Office staff salary')).toBeInTheDocument()
    })

    // Switch to Recurring tab
    const recurringTabBtn = screen.getByRole('button', { name: /^recurring$/i })
    fireEvent.click(recurringTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/no recurring expenses/i)).toBeInTheDocument()
    })
  })

  it('filters categories when typing in search bar', async () => {
    render(<ExpensesManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz' } })

    await waitFor(() => {
      expect(screen.getByText(/no categories found/i)).toBeInTheDocument()
    })

    fireEvent.change(searchInput, { target: { value: 'Sports' } })

    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument()
    })
  })

  it('opens CategoryModal and creates a new category', async () => {
    render(<ExpensesManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument()
    })

    const addBtn = screen.getByRole('button', { name: /add category/i })
    fireEvent.click(addBtn)

    expect(screen.getByText('New Category')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText(/e\.g\. Salary/i)
    fireEvent.change(nameInput, { target: { value: 'Laboratory Equipment' } })

    const modalSubmitBtn = screen.getAllByRole('button', { name: /create|new category/i }).find((b) => b.getAttribute('type') !== 'button' || b.textContent === 'Create')
    expect(modalSubmitBtn).toBeDefined()
    fireEvent.click(modalSubmitBtn!)

    await waitFor(() => {
      expect(screen.getByText('Laboratory Equipment')).toBeInTheDocument()
    })

    const cat = useExpenseStore.getState().categories.find((c) => c.name === 'Laboratory Equipment')
    expect(cat).toBeDefined()
  })

  it('opens ExpenseModal and adds a new expense entry', async () => {
    render(<ExpensesManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument()
    })

    // Switch to expenses tab
    fireEvent.click(screen.getByRole('button', { name: /^expenses$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }))

    expect(screen.getByText('New Expense')).toBeInTheDocument()

    // Select category
    const categorySelect = screen.getByRole('combobox')
    fireEvent.change(categorySelect, { target: { value: 'EXP-CAT-001' } })

    // Fill amount
    const amountInput = screen.getByPlaceholderText('0')
    fireEvent.change(amountInput, { target: { value: '2500' } })

    // Fill description
    const descInput = screen.getByPlaceholderText(/e\.g\. Purchased printer ink/i)
    fireEvent.change(descInput, { target: { value: 'High-speed printer paper' } })

    const modalSubmitBtn = screen.getAllByRole('button', { name: /create/i }).find((b) => b.closest('.fixed'))
    expect(modalSubmitBtn).toBeDefined()
    fireEvent.click(modalSubmitBtn!)

    await waitFor(() => {
      expect(screen.getByText('High-speed printer paper')).toBeInTheDocument()
    })

    const exp = useExpenseStore.getState().expenses.find((e) => e.description === 'High-speed printer paper')
    expect(exp).toBeDefined()
    expect(exp?.amount).toBe(2500)
  })

  it('triggers syncFromServer when clicking the Refresh button in database mode', async () => {
    const syncSpy = vi.spyOn(useExpenseStore.getState(), 'syncFromServer').mockImplementation(async () => {})
    render(<ExpensesManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument()
    })

    const refreshBtn = screen.getByRole('button', { name: /refresh|রিফ্রেশ/i })
    expect(refreshBtn).toBeInTheDocument()
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalled()
    })
  })

  it('functions properly in Local PC mode without requiring backend database', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const getSpy = vi.spyOn(expensesApi, 'get')

    render(<ExpensesManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Annual Sports Day')).toBeInTheDocument()
    })

    // No network calls made
    expect(getSpy).not.toHaveBeenCalled()

    // Add local expense in Local PC mode
    act(() => {
      useExpenseStore.getState().addExpense({
        id: 'EXP-LOCAL-01',
        categoryId: 'EXP-CAT-001',
        amount: 8000,
        date: '2026-11-06',
        description: 'Local Vault Emergency Expense',
        descriptionBn: 'লোকাল জরুরি খরচ',
        paymentMethod: 'cash',
        isRecurring: false,
        recurringMonths: [],
        academicYear: '2025-26',
        createdBy: 'Offline Admin',
        createdAt: '2026-11-06',
        isActive: true,
      })
    })

    expect(useExpenseStore.getState().expenses.some((e) => e.id === 'EXP-LOCAL-01')).toBe(true)
    expect(getSpy).not.toHaveBeenCalled()
  })

  it('toggles expense active state with multiple expenses safely without error', async () => {
    useExpenseStore.setState({
      expenses: [
        {
          id: 'EXP-1',
          categoryId: 'EXP-CAT-001',
          amount: 5000,
          date: '2026-11-01',
          description: 'First Expense',
          descriptionBn: 'প্রথম খরচ',
          paymentMethod: 'cash',
          isRecurring: false,
          recurringMonths: [],
          academicYear: '2025-26',
          createdBy: 'Admin',
          createdAt: '2026-11-01',
          isActive: true,
        },
        {
          id: 'EXP-2',
          categoryId: 'EXP-CAT-002',
          amount: 7000,
          date: '2026-11-02',
          description: 'Second Expense',
          descriptionBn: 'দ্বিতীয় খরচ',
          paymentMethod: 'bank',
          isRecurring: false,
          recurringMonths: [],
          academicYear: '2025-26',
          createdBy: 'Admin',
          createdAt: '2026-11-02',
          isActive: true,
        },
      ],
    })

    // Toggle first expense
    expect(() => {
      useExpenseStore.getState().toggleExpenseActive('EXP-1')
    }).not.toThrow()

    const state = useExpenseStore.getState()
    expect(state.expenses.find((e) => e.id === 'EXP-1')?.isActive).toBe(false)
    expect(state.expenses.find((e) => e.id === 'EXP-2')?.isActive).toBe(true)
  })
})
