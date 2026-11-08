import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountingReportPage from './index'
import { AuthContext } from '@/contexts/AuthContext'
import { useFeeStore } from '@/store/feeStore'
import { useOthersIncomeStore } from '@/store/othersIncomeStore'
import { useExpenseStore } from '@/store/expenseStore'
import { useStoreStore } from '@/store/storeStore'
import { expensesApi, feesApi, othersIncomeApi, storeApi } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    expensesApi: {
      get: vi.fn().mockResolvedValue({ categories: [], expenses: [] }),
      update: vi.fn().mockResolvedValue({ success: true }),
    },
    feesApi: {
      get: vi.fn().mockResolvedValue({ structures: [], payments: [] }),
      update: vi.fn().mockResolvedValue({ success: true }),
    },
    othersIncomeApi: {
      get: vi.fn().mockResolvedValue({ categories: [], assignments: [] }),
      update: vi.fn().mockResolvedValue({ success: true }),
    },
    storeApi: {
      get: vi.fn().mockResolvedValue({ products: [], sales: [] }),
      update: vi.fn().mockResolvedValue({ success: true }),
    },
  }
})

const mockAuthValue: any = {
  user: {
    id: 'u-1',
    email: 'admin@school.com',
    name: 'Admin',
    role: 'school_admin',
    schoolId: 'sch-1',
    schoolName: 'School',
    avatar: null,
    subdomain: 'school',
  },
  loading: false,
  restoreFailed: false,
  sessionSource: 'server',
  retryRestore: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  error: null,
  clearError: vi.fn(),
  isLockedOut: false,
  lockoutRemaining: 0,
}

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <AuthContext.Provider value={mockAuthValue}>
      {ui}
    </AuthContext.Provider>
  )
}

describe('AccountingReportPage — Database and Local PC Support', () => {
  const today = new Date().toISOString().split('T')[0]

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('edutech_user_role', 'admin')
    vi.clearAllMocks()

    // Reset and seed stores
    useFeeStore.setState({
      structures: [
        {
          id: 'FEE-1',
          name: 'Monthly Tuition',
          nameBn: 'মাসিক বেতন',
          type: 'monthly',
          amount: 1500,
          description: '',
          descriptionBn: '',
          isActive: true,
          createdAt: today,
        },
      ],
      payments: [
        {
          id: 'PAY-1',
          studentId: 'STU-1',
          feeStructureId: 'FEE-1',
          amount: 1500,
          discount: 0,
          paidAt: `${today}T10:00:00Z`,
          method: 'cash',
          reference: '',
          note: '',
          collectedBy: 'Admin',
        },
      ],
      serverSynced: true,
    })

    useOthersIncomeStore.setState({
      categories: [
        {
          id: 'OTH-CAT-1',
          name: 'Picnic Fee',
          nameBn: 'পিকনিক ফি',
          description: '',
          descriptionBn: '',
          isActive: true,
          createdAt: today,
        },
      ],
      assignments: [
        {
          id: 'OTH-ASN-1',
          categoryId: 'OTH-CAT-1',
          studentId: 'STU-2',
          amount: 500,
          description: 'Annual Picnic',
          isActive: true,
          createdAt: today,
        },
      ],
      serverSynced: true,
    })

    // Add corresponding payment for Others Income
    useFeeStore.setState((s) => ({
      payments: [
        ...s.payments,
        {
          id: 'PAY-OTH-1',
          studentId: 'STU-2',
          feeStructureId: 'FEE-OTHER-OTH-ASN-1',
          amount: 500,
          discount: 0,
          paidAt: `${today}T11:00:00Z`,
          method: 'cash',
          reference: '',
          note: '',
          collectedBy: 'Admin',
        },
      ],
    }))

    useExpenseStore.setState({
      categories: [
        {
          id: 'EXP-1',
          name: 'Office Supplies',
          nameBn: 'অফিস স্টেশনারি',
          icon: 'tag',
          isSystem: false,
          isActive: true,
          createdAt: today,
        },
      ],
      expenses: [
        {
          id: 'EXP-E-1',
          categoryId: 'EXP-1',
          amount: 800,
          date: today,
          description: 'Paper and pens',
          descriptionBn: '',
          paymentMethod: 'cash',
          isRecurring: false,
          recurringMonths: [],
          academicYear: '2026',
          createdBy: 'Admin',
          createdAt: today,
          isActive: true,
        },
      ],
      serverSynced: true,
    })

    useStoreStore.setState({
      products: [
        {
          id: 'PRD-1',
          name: 'Notebook',
          nameBn: 'খাতা',
          sku: 'NB01',
          categoryId: 'CAT-1',
          price: 100,
          costPrice: 60,
          stock: 50,
          minStock: 5,
          unit: 'pcs',
          isActive: true,
          createdAt: today,
        },
      ],
      sales: [
        {
          id: 'SALE-1',
          receiptNo: 'REC-001',
          customerName: 'Rahim',
          customerType: 'student',
          studentId: 'STU-3',
          items: [
            {
              productId: 'PRD-1',
              qty: 2,
              unitPrice: 100,
              subtotal: 200,
            },
          ],
          totalAmount: 200,
          discount: 0,
          paidAmount: 200,
          paymentMethod: 'cash',
          status: 'completed',
          createdBy: 'Admin',
          createdAt: `${today}T12:00:00Z`,
        },
      ],
      serverSynced: true,
    })
  })

  it('synchronizes data across all 4 financial stores in database mode', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'cloud')
    sessionStorage.setItem('edutech_inst_slug', 'demo-school')

    renderWithAuth(
      <MemoryRouter initialEntries={['/i/demo-school/admin/accounting-report']}>
        <AccountingReportPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // In database/cloud mode, all 4 stores trigger syncFromServer
    expect(expensesApi.get).toHaveBeenCalled()
    expect(feesApi.get).toHaveBeenCalled()
    expect(othersIncomeApi.get).toHaveBeenCalled()
    expect(storeApi.get).toHaveBeenCalled()
  })

  it('works seamlessly in Local PC mode without requiring backend database', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    sessionStorage.setItem('edutech_inst_slug', 'local-school')

    renderWithAuth(
      <MemoryRouter initialEntries={['/i/local-school/admin/accounting-report']}>
        <AccountingReportPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Title and stat cards render
      expect(screen.getByText('Accounting Report')).toBeInTheDocument()
    })

    // In Local PC mode, no cloud API mutations or fetches are triggered
    expect(feesApi.get).not.toHaveBeenCalled()
    expect(expensesApi.get).not.toHaveBeenCalled()
    expect(othersIncomeApi.get).not.toHaveBeenCalled()
    expect(storeApi.get).not.toHaveBeenCalled()

    // Calculations:
    // Total Income = 1500 (tuition) + 500 (picnic) + 200 (store notebook) = 2200
    // Total Expenses = 800
    // Net Profit = 2200 - 800 = 1400
    // Profit Margin = (1400 / 2200) * 100 = 64%
    expect(screen.getAllByText(/2,200/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/800/).length).toBeGreaterThan(0)
    expect(screen.getByText('+1,400')).toBeInTheDocument()
    expect(screen.getByText('64%')).toBeInTheDocument()
  })

  it('switches between tabs and displays category records properly', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')

    renderWithAuth(
      <MemoryRouter initialEntries={['/i/local-school/admin/accounting-report']}>
        <AccountingReportPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Accounting Report')).toBeInTheDocument()
    })

    // Income Tab: shows Tuition, Picnic Fee, Notebook
    expect(screen.getByText('Monthly Tuition')).toBeInTheDocument()
    expect(screen.getByText('Picnic Fee')).toBeInTheDocument()
    expect(screen.getByText('Notebook')).toBeInTheDocument()

    // Switch to Expenses Tab via tab button
    const expenseTab = screen.getByRole('button', { name: /^Expenses$/i })
    fireEvent.click(expenseTab)
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument()
    })

    // Switch to Profit/Loss Tab via tab button
    const profitLossTab = screen.getByRole('button', { name: /Profit\/Loss/i })
    fireEvent.click(profitLossTab)
    await waitFor(() => {
      expect(screen.getByText('Income Categories')).toBeInTheDocument()
      expect(screen.getByText('Expense Categories')).toBeInTheDocument()
      expect(screen.getAllByText('Net Profit').length).toBeGreaterThanOrEqual(1)
    })
  })
})
