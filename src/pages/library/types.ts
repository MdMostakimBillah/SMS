export type BookCondition = 'new' | 'good' | 'fair' | 'worn' | 'damaged'
export type BookCopyStatus = 'available' | 'issued' | 'lost' | 'damaged'
export type BorrowingStatus = 'borrowed' | 'returned' | 'overdue' | 'lost'

export interface BookCategory {
  id: string
  name: string
  nameBn: string
  description: string
  descriptionBn: string
  isActive: boolean
  createdAt: string
}

export interface Book {
  id: string
  title: string
  titleBn: string
  author: string
  authorBn: string
  isbn: string
  categoryId: string
  shelf: string
  description: string
  descriptionBn: string
  totalCopies: number
  availableCopies: number
  isDigital: boolean
  coverUrl: string
  isActive: boolean
  createdAt: string
}

export interface BookCopy {
  id: string
  bookId: string
  copyNumber: number
  barcode: string
  condition: BookCondition
  status: BookCopyStatus
  issuedTo?: string
  dueDate?: string
  isActive: boolean
  createdAt: string
}

export interface Borrowing {
  id: string
  studentId: string
  bookId: string
  copyId: string
  issueDate: string
  dueDate: string
  returnDate?: string
  status: BorrowingStatus
  condition: BookCondition
  fine: number
  fineReason: string
  renewalCount: number
  librarianNote: string
  issuedBy: string
  createdAt: string
}

export interface DigitalBookChapter {
  title: string
  titleBn: string
  content: string
  contentBn: string
}

export interface DigitalBook {
  id: string
  bookId: string
  fileUrl: string
  chapters: DigitalBookChapter[]
  totalPages: number
  isActive: boolean
  createdAt: string
}

export interface ReadingBookmark {
  page: number
  label: string
  createdAt: string
}

export interface ReadingSession {
  id: string
  studentId: string
  digitalBookId: string
  currentPage: number
  currentChapter: number
  progress: number
  totalTime: number
  isCompleted: boolean
  bookmarks: ReadingBookmark[]
  lastRead: string
  createdAt: string
}

export interface LibrarySettings {
  maxBooksPerStudent: number
  borrowingDurationDays: number
  renewalLimit: number
  finePerDay: number
  lostBookFee: number
  damagedBookFee: number
  allowRenewal: boolean
  digitalAccessEnabled: boolean
  maxDigitalReaders: number
}

export const DEFAULT_LIBRARY_SETTINGS: LibrarySettings = {
  maxBooksPerStudent: 3,
  borrowingDurationDays: 14,
  renewalLimit: 2,
  finePerDay: 5,
  lostBookFee: 500,
  damagedBookFee: 200,
  allowRenewal: true,
  digitalAccessEnabled: true,
  maxDigitalReaders: 50,
}

export const BOOK_CONDITIONS: BookCondition[] = ['new', 'good', 'fair', 'worn', 'damaged']
export const BOOK_CONDITIONS_BN: Record<BookCondition, string> = {
  new: 'নতুন', good: 'ভালো', fair: 'গড়', worn: 'পুরানো', damaged: 'ক্ষতিগ্রস্ত',
}
export const BOOK_COPY_STATUSES: BookCopyStatus[] = ['available', 'issued', 'lost', 'damaged']
export const BOOK_COPY_STATUSES_BN: Record<BookCopyStatus, string> = {
  available: 'উপলব্ধ', issued: 'প্রদত্ত', lost: 'হারানো', damaged: 'ক্ষতিগ্রস্ত',
}
export const BORROWING_STATUSES: BorrowingStatus[] = ['borrowed', 'returned', 'overdue', 'lost']
export const BORROWING_STATUSES_BN: Record<BorrowingStatus, string> = {
  borrowed: 'ধারে', returned: 'ফেরত', overdue: 'বিলম্বিত', lost: 'হারানো',
}
