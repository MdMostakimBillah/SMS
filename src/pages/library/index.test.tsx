import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import LibraryPage from './index'
import { useLibraryStore } from '@/store/libraryStore'
import { libraryApi } from '@/lib/api'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canRead: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canExport: () => true,
    canPrint: () => true,
  }),
}))

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    libraryApi: {
      get: vi.fn().mockImplementation(async () => ({
        books: useLibraryStore.getState().books,
        categories: useLibraryStore.getState().categories,
        copies: useLibraryStore.getState().copies,
        borrowings: useLibraryStore.getState().borrowings,
        digitalBooks: useLibraryStore.getState().digitalBooks,
        readingSessions: useLibraryStore.getState().readingSessions,
      })),
      update: vi.fn().mockResolvedValue({ success: true }),
    },
  }
})

describe('LibraryPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useLibraryStore.persist.clearStorage()
  })

  it('renders page header, stat cards, and tabs after sync', async () => {
    render(
      <TestWrapper>
        <LibraryPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Library Management|লাইব্রেরি ব্যবস্থাপনা/i)).toBeInTheDocument()
    })

    // Check tabs
    expect(screen.getByRole('button', { name: /Dashboard|ড্যাশবোর্ড/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Books|বই/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Categories|ক্যাটাগরি/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Issue|ইস্যু/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Return|ফেরত/i })).toBeInTheDocument()

    // Verify libraryApi.get was called for hydration
    expect(libraryApi.get).toHaveBeenCalled()
  })

  it('switches between tabs on click', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <LibraryPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Library Management|লাইব্রেরি ব্যবস্থাপনা/i)).toBeInTheDocument()
    })

    const booksTab = screen.getByRole('button', { name: /Books|বই/i })
    await user.click(booksTab)

    // Books tab should show Action or Add Book or book listings
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search|খুঁজুন/i)).toBeInTheDocument()
    })
  })
})
