import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLibraryStore, calcFine } from './libraryStore'
import { DEFAULT_LIBRARY_SETTINGS } from '@/pages/library/types'
import { libraryApi } from '@/lib/api'
import * as storageModeModule from '@/lib/storageMode'

vi.mock('@/lib/api', () => ({
  libraryApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

describe('libraryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLibraryStore.setState({
      categories: [
        { id: 'CAT-1', name: 'Science', nameBn: 'বিজ্ঞান', description: '', descriptionBn: '', isActive: true, createdAt: '2025-01-01' },
      ],
      books: [
        {
          id: 'LB-001',
          title: 'Physics 101',
          titleBn: 'পদার্থবিজ্ঞান ১০১',
          author: 'Dr. Newton',
          authorBn: 'ড. নিউটন',
          isbn: '978-001',
          categoryId: 'CAT-1',
          shelf: 'A1',
          description: '',
          descriptionBn: '',
          totalCopies: 2,
          availableCopies: 2,
          isDigital: false,
          coverUrl: '',
          isActive: true,
          createdAt: '2025-01-01',
        },
      ],
      copies: [
        { id: 'BC-001', bookId: 'LB-001', copyNumber: 1, barcode: 'LB-001-C01', condition: 'good', status: 'available', isActive: true, createdAt: '2025-01-01' },
        { id: 'BC-002', bookId: 'LB-001', copyNumber: 2, barcode: 'LB-001-C02', condition: 'good', status: 'available', isActive: true, createdAt: '2025-01-01' },
      ],
      borrowings: [],
      digitalBooks: [],
      readingSessions: [],
      settings: { ...DEFAULT_LIBRARY_SETTINGS },
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
  })

  it('adds a book and generates copies automatically', () => {
    const store = useLibraryStore.getState()
    store.addBook({
      id: 'LB-002',
      title: 'Chemistry',
      titleBn: 'রসায়ন',
      author: 'Dr. Boyle',
      authorBn: 'ড. বয়েল',
      isbn: '978-002',
      categoryId: 'CAT-1',
      shelf: 'A2',
      description: '',
      descriptionBn: '',
      totalCopies: 3,
      availableCopies: 3,
      isDigital: false,
      coverUrl: '',
      isActive: true,
      createdAt: '2025-01-02',
    })

    const state = useLibraryStore.getState()
    expect(state.books).toHaveLength(2)
    expect(state.copies.filter((c) => c.bookId === 'LB-002')).toHaveLength(3)
  })

  it('updates a book and adjusts copies when totalCopies changes', () => {
    const store = useLibraryStore.getState()
    store.updateBook('LB-001', { totalCopies: 4 })

    const state = useLibraryStore.getState()
    const copies = state.copies.filter((c) => c.bookId === 'LB-001')
    expect(copies).toHaveLength(4)
  })

  it('deletes a book and cleans up copies and borrowings', () => {
    const store = useLibraryStore.getState()
    store.deleteBook('LB-001')

    const state = useLibraryStore.getState()
    expect(state.books).toHaveLength(0)
    expect(state.copies).toHaveLength(0)
  })

  it('adds a borrowing and decrements available copies', () => {
    const store = useLibraryStore.getState()
    store.addBorrowing({
      id: 'BRW-001',
      studentId: 'STU-100',
      bookId: 'LB-001',
      copyId: 'BC-001',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      status: 'borrowed',
      condition: 'good',
      fine: 0,
      fineReason: '',
      renewalCount: 0,
      librarianNote: '',
      issuedBy: 'admin',
      createdAt: '2026-01-01',
    })

    const state = useLibraryStore.getState()
    expect(state.borrowings).toHaveLength(1)
    const copy = state.copies.find((c) => c.id === 'BC-001')
    expect(copy?.status).toBe('issued')
    expect(copy?.issuedTo).toBe('STU-100')
    const book = state.books.find((b) => b.id === 'LB-001')
    expect(book?.availableCopies).toBe(1)
  })

  it('returns a book and increments available copies and updates condition', () => {
    const store = useLibraryStore.getState()
    store.addBorrowing({
      id: 'BRW-001',
      studentId: 'STU-100',
      bookId: 'LB-001',
      copyId: 'BC-001',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      status: 'borrowed',
      condition: 'good',
      fine: 0,
      fineReason: '',
      renewalCount: 0,
      librarianNote: '',
      issuedBy: 'admin',
      createdAt: '2026-01-01',
    })

    store.returnBook('BRW-001', 'good', 0, '', 'admin')

    const state = useLibraryStore.getState()
    const borrowing = state.borrowings.find((b) => b.id === 'BRW-001')
    expect(borrowing?.status).toBe('returned')
    expect(borrowing?.returnDate).toBeDefined()

    const copy = state.copies.find((c) => c.id === 'BC-001')
    expect(copy?.status).toBe('available')
    expect(copy?.issuedTo).toBeUndefined()

    const book = state.books.find((b) => b.id === 'LB-001')
    expect(book?.availableCopies).toBe(2)
  })

  it('renews a borrowing and extends due date', () => {
    const store = useLibraryStore.getState()
    store.addBorrowing({
      id: 'BRW-001',
      studentId: 'STU-100',
      bookId: 'LB-001',
      copyId: 'BC-001',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      status: 'borrowed',
      condition: 'good',
      fine: 0,
      fineReason: '',
      renewalCount: 0,
      librarianNote: '',
      issuedBy: 'admin',
      createdAt: '2026-01-01',
    })

    store.renewBorrowing('BRW-001')

    const state = useLibraryStore.getState()
    const borrowing = state.borrowings.find((b) => b.id === 'BRW-001')
    expect(borrowing?.renewalCount).toBe(1)
    expect(borrowing?.dueDate).toBe('2026-01-29') // 14 days added
  })

  it('calculates fine accurately for overdue books', () => {
    // 5 days overdue at 5 per day = 25
    const pastDate = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
    const fine = calcFine(pastDate, 5)
    expect(fine).toBe(25)

    // Future date = 0 fine
    const futureDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
    expect(calcFine(futureDate, 5)).toBe(0)
  })

  it('deletes a category and unassigns it from books', () => {
    const store = useLibraryStore.getState()
    store.deleteCategory('CAT-1')

    const state = useLibraryStore.getState()
    expect(state.categories).toHaveLength(0)
    const book = state.books.find((b) => b.id === 'LB-001')
    expect(book?.categoryId).toBe('')
  })

  it('syncFromServer hydrates data from API response', async () => {
    vi.mocked(libraryApi.get).mockResolvedValueOnce({
      books: [
        {
          id: 'LB-SERVER',
          title: 'Server Book',
          titleBn: 'সার্ভার বই',
          author: 'Author',
          authorBn: 'লেখক',
          isbn: '999',
          categoryId: '',
          shelf: '',
          description: '',
          descriptionBn: '',
          totalCopies: 1,
          availableCopies: 1,
          isDigital: false,
          coverUrl: '',
          isActive: true,
          createdAt: '2026-01-01',
        },
      ],
      categories: [],
      copies: [],
      borrowings: [],
      digitalBooks: [],
      readingSessions: [],
      settings: DEFAULT_LIBRARY_SETTINGS,
    })

    const store = useLibraryStore.getState()
    await store.syncFromServer('school-test')

    const state = useLibraryStore.getState()
    expect(state.serverSynced).toBe(true)
    expect(state.books).toHaveLength(1)
    expect(state.books[0].title).toBe('Server Book')
  })

  it('syncFromServer respects local_computer mode', async () => {
    vi.spyOn(storageModeModule, 'isLocalComputerMode').mockReturnValue(true)

    const store = useLibraryStore.getState()
    await store.syncFromServer('local-school')

    expect(libraryApi.get).not.toHaveBeenCalled()
    expect(useLibraryStore.getState().serverSynced).toBe(true)
  })
})
