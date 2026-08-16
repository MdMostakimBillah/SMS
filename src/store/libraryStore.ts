import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'

import type {
  Book, BookCategory, BookCopy, Borrowing,
  DigitalBook, ReadingSession, LibrarySettings,
  BookCondition, BookCopyStatus,
} from '@/pages/library/types'
import { DEFAULT_LIBRARY_SETTINGS } from '@/pages/library/types'

function today() { return new Date().toISOString().split('T')[0] }

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function generateCopies(bookId: string, count: number, startId: number): BookCopy[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `BC-${startId + i}`,
    bookId,
    copyNumber: i + 1,
    barcode: `${bookId}-C${String(i + 1).padStart(2, '0')}`,
    condition: 'new' as BookCondition,
    status: 'available' as BookCopyStatus,
    isActive: true,
    createdAt: today(),
  }))
}

interface LibraryState {
  books: Book[]
  categories: BookCategory[]
  copies: BookCopy[]
  borrowings: Borrowing[]
  digitalBooks: DigitalBook[]
  readingSessions: ReadingSession[]
  settings: LibrarySettings

  addBook: (book: Book) => void
  updateBook: (id: string, data: Partial<Book>) => void
  deleteBook: (id: string) => void
  toggleBookActive: (id: string) => void

  addCategory: (cat: BookCategory) => void
  updateCategory: (id: string, data: Partial<BookCategory>) => void
  deleteCategory: (id: string) => void
  toggleCategoryActive: (id: string) => void

  addCopy: (copy: BookCopy) => void
  updateCopy: (id: string, data: Partial<BookCopy>) => void
  deleteCopy: (id: string) => void

  addBorrowing: (b: Borrowing) => void
  updateBorrowing: (id: string, data: Partial<Borrowing>) => void
  deleteBorrowing: (id: string) => void
  returnBook: (borrowingId: string, condition: BookCondition, fine: number, fineReason: string) => void
  renewBorrowing: (id: string) => void

  addDigitalBook: (db: DigitalBook) => void
  updateDigitalBook: (id: string, data: Partial<DigitalBook>) => void
  deleteDigitalBook: (id: string) => void

  addReadingSession: (rs: ReadingSession) => void
  updateReadingSession: (id: string, data: Partial<ReadingSession>) => void

  updateSettings: (data: Partial<LibrarySettings>) => void
  getNextBookId: () => string
  getNextBorrowingId: () => string
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      categories: [
        { id: 'CAT-001', name: 'Fiction', nameBn: 'উপন্যাস', description: 'Novels and stories', descriptionBn: 'উপন্যাস ও গল্প', isActive: true, createdAt: '2025-01-10' },
        { id: 'CAT-002', name: 'Science', nameBn: 'বিজ্ঞান', description: 'Science textbooks', descriptionBn: 'বিজ্ঞান পাঠ্যপুস্তক', isActive: true, createdAt: '2025-01-10' },
        { id: 'CAT-003', name: 'Mathematics', nameBn: 'গণিত', description: 'Math books', descriptionBn: 'গণিত বই', isActive: true, createdAt: '2025-01-10' },
        { id: 'CAT-004', name: 'History', nameBn: 'ইতিহাস', description: 'History books', descriptionBn: 'ইতিহাস বই', isActive: true, createdAt: '2025-01-10' },
        { id: 'CAT-005', name: 'Language', nameBn: 'ভাষা', description: 'Language and literature', descriptionBn: 'ভাষা ও সাহিত্য', isActive: true, createdAt: '2025-01-10' },
      ],

      books: [
        { id: 'LB-001', title: 'Mathematics for Class 10', titleBn: 'দশম শ্রেণির গণিত', author: 'Dr. A.K. Rahman', authorBn: 'ড. এ.কে. রহমান', isbn: '978-984-001-001-1', categoryId: 'CAT-003', shelf: 'A-01', description: 'Complete math textbook', descriptionBn: 'সম্পূর্ণ গণিত পাঠ্যপুস্তক', totalCopies: 4, availableCopies: 3, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-01-15' },
        { id: 'LB-002', title: 'English Grammar Basics', titleBn: 'ইংরেজি ব্যাকরণ ভিত্তি', author: 'Sarah Johnson', authorBn: 'সারাহ জনসন', isbn: '978-984-001-002-8', categoryId: 'CAT-005', shelf: 'B-02', description: 'English grammar for beginners', descriptionBn: 'শিক্ষার্থীদের জন্য ইংরেজি ব্যাকরণ', totalCopies: 3, availableCopies: 2, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-01-20' },
        { id: 'LB-003', title: 'General Science', titleBn: 'সাধারণ বিজ্ঞান', author: 'Prof. M. Khan', authorBn: 'প্রফে. এম. খান', isbn: '978-984-001-003-5', categoryId: 'CAT-002', shelf: 'C-01', description: 'Science for high school', descriptionBn: 'উচ্চ মাধ্যমিকের বিজ্ঞান', totalCopies: 3, availableCopies: 3, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-02-01' },
        { id: 'LB-004', title: 'Bangladesh History', titleBn: 'বাংলাদেশের ইতিহাস', author: 'Dr. R. Ahmed', authorBn: 'ড. আর. আহমেদ', isbn: '978-984-001-004-2', categoryId: 'CAT-004', shelf: 'D-01', description: 'History of Bangladesh', descriptionBn: 'বাংলাদেশের ইতিহাস', totalCopies: 2, availableCopies: 2, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-02-10' },
        { id: 'LB-005', title: 'Story Collection', titleBn: 'গল্প সংকলন', author: 'Various Authors', authorBn: 'নানা লেখক', isbn: '978-984-001-005-9', categoryId: 'CAT-001', shelf: 'E-01', description: 'Short stories collection', descriptionBn: 'ছোট গল্পের সংকলন', totalCopies: 2, availableCopies: 1, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-02-15' },
        { id: 'LB-006', title: 'Physics Part 1', titleBn: 'পদার্থবিজ্ঞান পার্ট ১', author: 'Dr. A. Hossain', authorBn: 'ড. এ. হোসেন', isbn: '978-984-001-006-6', categoryId: 'CAT-002', shelf: 'C-02', description: 'Physics textbook part 1', descriptionBn: 'পদার্থবিজ্ঞান পাঠ্যপুস্তক পার্ট ১', totalCopies: 3, availableCopies: 2, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-03-01' },
        { id: 'LB-007', title: 'Bengali Literature', titleBn: 'বাংলা সাহিত্য', author: 'Prof. K. Das', authorBn: 'প্রফে. ক. দাস', isbn: '978-984-001-007-3', categoryId: 'CAT-005', shelf: 'B-01', description: 'Bengali literature anthology', descriptionBn: 'বাংলা সাহিত্যের সংকলন', totalCopies: 2, availableCopies: 2, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-03-05' },
        { id: 'LB-008', title: 'Advanced Mathematics', titleBn: 'উন্নত গণিত', author: 'Dr. P. Sarker', authorBn: 'ড. পি. সরকার', isbn: '978-984-001-008-0', categoryId: 'CAT-003', shelf: 'A-02', description: 'Advanced math for higher classes', descriptionBn: 'উচ্চ শ্রেণির উন্নত গণিত', totalCopies: 2, availableCopies: 1, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-03-10' },
        { id: 'LB-009', title: 'World History', titleBn: 'বিশ্ব ইতিহাস', author: 'Dr. N. Islam', authorBn: 'ড. এন. ইসলাম', isbn: '978-984-001-009-7', categoryId: 'CAT-004', shelf: 'D-02', description: 'World history overview', descriptionBn: 'বিশ্ব ইতিহাসের সারসংক্ষেপ', totalCopies: 2, availableCopies: 2, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-03-15' },
        { id: 'LB-010', title: 'Creative Writing', titleBn: 'সৃজনশীল লেখনি', author: 'M. Ahmed', authorBn: 'ম. আহমেদ', isbn: '978-984-001-010-3', categoryId: 'CAT-001', shelf: 'E-02', description: 'Guide to creative writing', descriptionBn: 'সৃজনশীল লেখনির নির্দেশিকা', totalCopies: 2, availableCopies: 2, isDigital: false, coverUrl: '', isActive: true, createdAt: '2025-03-20' },
      ],

      copies: [
        ...generateCopies('LB-001', 4, 1),
        ...generateCopies('LB-002', 3, 5),
        ...generateCopies('LB-003', 3, 8),
        ...generateCopies('LB-004', 2, 11),
        ...generateCopies('LB-005', 2, 13),
        ...generateCopies('LB-006', 3, 15),
        ...generateCopies('LB-007', 2, 18),
        ...generateCopies('LB-008', 2, 20),
        ...generateCopies('LB-009', 2, 22),
        ...generateCopies('LB-010', 2, 24),
      ].map((c, i) => ({ ...c, id: `BC-${String(i + 1).padStart(3, '0')}` })),

      borrowings: [
        { id: 'BRW-001', studentId: 'ET-2025-10001', bookId: 'LB-001', copyId: 'BC-001', issueDate: '2025-07-01', dueDate: '2025-07-15', status: 'borrowed', condition: 'good', fine: 0, fineReason: '', renewalCount: 0, librarianNote: '', issuedBy: 'admin', createdAt: '2025-07-01' },
        { id: 'BRW-002', studentId: 'ET-2025-10002', bookId: 'LB-002', copyId: 'BC-005', issueDate: '2025-07-05', dueDate: '2025-07-19', status: 'borrowed', condition: 'new', fine: 0, fineReason: '', renewalCount: 0, librarianNote: '', issuedBy: 'admin', createdAt: '2025-07-05' },
        { id: 'BRW-003', studentId: 'ET-2025-10003', bookId: 'LB-005', copyId: 'BC-013', issueDate: '2025-06-20', dueDate: '2025-07-04', status: 'overdue', condition: 'fair', fine: 0, fineReason: '', renewalCount: 1, librarianNote: 'Overdue', issuedBy: 'admin', createdAt: '2025-06-20' },
        { id: 'BRW-004', studentId: 'ET-2025-10004', bookId: 'LB-006', copyId: 'BC-015', issueDate: '2025-07-10', dueDate: '2025-07-24', status: 'borrowed', condition: 'good', fine: 0, fineReason: '', renewalCount: 0, librarianNote: '', issuedBy: 'admin', createdAt: '2025-07-10' },
        { id: 'BRW-005', studentId: 'ET-2025-10005', bookId: 'LB-008', copyId: 'BC-020', issueDate: '2025-06-01', dueDate: '2025-06-15', status: 'returned', condition: 'good', fine: 50, fineReason: 'Late return', renewalCount: 0, librarianNote: '', issuedBy: 'admin', createdAt: '2025-06-01' },
      ],

      digitalBooks: [
        {
          id: 'DB-001', bookId: 'LB-001', fileUrl: '', totalPages: 120, isActive: true, createdAt: '2025-02-01',
          chapters: [
            { title: 'Chapter 1: Algebra', titleBn: 'অধ্যায় ১: বীজগণিত', content: 'Algebra is the study of mathematical symbols and the rules for manipulating these symbols. It is a unifying thread of almost all of mathematics.', contentBn: 'বীজগণিত হলো গাণিতিক প্রতীকগুলোর অধ্যয়ন এবং এই প্রতীকগুলো নিয়ন্ত্রণকারী নিয়মকানুন। এটি গণিতের প্রায় সমস্ত ক্ষেত্রকে একত্রিত করার একটি সুতো।' },
            { title: 'Chapter 2: Geometry', titleBn: 'অধ্যায় ২: জ্যামিতি', content: 'Geometry is a branch of mathematics that deals with the properties and relations of points, lines, surfaces, and solids.', contentBn: 'জ্যামিতি হলো গণিতের একটি শাখা যা বিন্দু, রেখা, পৃষ্ঠ এবং ক্ষেত্রফলের বৈশিষ্ট্য ও সম্পর্ক নিয়ে আলোচনা করে।' },
            { title: 'Chapter 3: Trigonometry', titleBn: 'অধ্যায় ৩: ত্রিকোণমিতি', content: 'Trigonometry studies relationships between side lengths and angles of triangles. It has many applications in science and engineering.', contentBn: 'ত্রিকোণমিতি ত্রিভুজের বাহুর দৈর্ঘ্য এবং কোণের মধ্যে সম্পর্ক অধ্যয়ন করে। এর বিজ্ঞান ও প্রকৌশলে অনেক প্রয়োগ রয়েছে।' },
            { title: 'Chapter 4: Statistics', titleBn: 'অধ্যায় ৪: পরিসংখ্যান', content: 'Statistics is the discipline that concerns the collection, organization, analysis, interpretation, and presentation of data.', contentBn: 'পরিসংখ্যান হলো যে শাস্ত্র তথ্য সংগ্রহ, সংগঠন, বিশ্লেষণ, ব্যাখ্যা এবং উপস্থাপনার সাথে সম্পর্কিত।' },
            { title: 'Chapter 5: Probability', titleBn: 'অধ্যায় ৫: সম্ভাবনা', content: 'Probability is the measure of the likelihood that an event will occur. Probability is quantified as a number between 0 and 1.', contentBn: 'সম্ভাবনা হলো একটি ঘটনার ঘটার সম্ভাব্যতার পরিমাপ। সম্ভাবনা ০ এবং ১ এর মধ্যে একটি সংখ্যা হিসাবে পরিমাপ করা হয়।' },
          ],
        },
        {
          id: 'DB-002', bookId: 'LB-002', fileUrl: '', totalPages: 80, isActive: true, createdAt: '2025-02-10',
          chapters: [
            { title: 'Chapter 1: Parts of Speech', titleBn: 'অধ্যায় ১: বাক্যের অংশ', content: 'English has eight parts of speech: noun, pronoun, verb, adjective, adverb, preposition, conjunction, and interjection.', contentBn: 'ইংরেজিতে আটটি বাক্যের অংশ রয়েছে: বিশেষ্য, সর্বনাম, ক্রিয়া, বিশেষণ, ক্রিয়াবিশেষণ, অনুসর্গ, সংযোজক এবং বিস্ময়বোধক।' },
            { title: 'Chapter 2: Tenses', titleBn: 'অধ্যায় ২: কাল', content: 'Tenses indicate when an action takes place. The three main tenses are past, present, and future.', contentBn: 'কাল নির্দেশ করে কখন একটি কাজ ঘটে। তিনটি প্রধান কাল হলো অতীত, বর্তমান এবং ভবিষ্যৎ।' },
            { title: 'Chapter 3: Active & Passive Voice', titleBn: 'অধ্যায় ৩: সকর্ম ও নিষ্কর্ম কারক', content: 'Active voice means the subject performs the action. Passive voice means the subject receives the action.', contentBn: 'সকর্ম কারকে কর্তা কাজ করে। নিষ্কর্ম কারকে কর্তা কাজ প্রাপ্ত হয়।' },
            { title: 'Chapter 4: Articles', titleBn: 'অধ্যায় ৪: অনুচ্চেদ', content: 'Articles are words that define a noun as specific or unspecific. The three articles are a, an, and the.', contentBn: 'অনুচ্চেদ হলো এমন শব্দ যা একটি বিশেষ্যকে নির্দিষ্ট বা অনির্দিষ্ট হিসাবে সংজ্ঞায়িত করে।' },
            { title: 'Chapter 5: Direct & Indirect Speech', titleBn: 'অধ্যায় ৫: প্রত্যক্ষ ও পরোক্ষ বাক্য', content: 'Direct speech quotes the exact words. Indirect speech reports what someone said without quoting exactly.', contentBn: 'প্রত্যক্ষ বাক্যে সঠিক শব্দগুলো উদ্ধৃত করা হয়। পরোক্ষ বাক্যে কেউ কী বলেছে তা রিপোর্ট করা হয়।' },
          ],
        },
        {
          id: 'DB-003', bookId: 'LB-007', fileUrl: '', totalPages: 100, isActive: true, createdAt: '2025-03-01',
          chapters: [
            { title: 'Chapter 1: Rabindranath Tagore', titleBn: 'অধ্যায় ১: রবীন্দ্রনাথ ঠাকুর', content: 'Rabindranath Tagore was a Bengali polymath who reshaped Bengali literature and music. He was the first non-European to win the Nobel Prize in Literature.', contentBn: 'রবীন্দ্রনাথ ঠাকুর ছিলেন একজন বাঙালি বহুমুখী প্রতিভা যিনি বাংলা সাহিত্য ও সংগীতকে নতুন করে গড়ে তুলেছিলেন। তিনি সাহিত্যে নোবেল জয়ী প্রথম ইউরোপীয় নন।' },
            { title: 'Chapter 2: Kazi Nazrul Islam', titleBn: 'অধ্যায় ২: কাজী নজরুল ইসলাম', content: 'Kazi Nazrul Islam was a Bengali poet, writer, and musician. He is known as the rebel poet of Bangladesh.', contentBn: 'কাজী নজরুল ইসলাম ছিলেন একজন বাঙালি কবি, লেখক এবং সংগীতশিল্পী। তাঁকে বাংলাদেশের বিপ্লবী কবি হিসেবে পরিচিত।' },
            { title: 'Chapter 3: Michael Madhusudan Dutt', titleBn: 'অধ্যায় ৩: মাইকেল মধুসূদন দত্ত', content: 'Michael Madhusudan Dutt was a 19th-century Bengali poet and playwright. He is considered the father of the Bengali sonnet.', contentBn: 'মাইকেল মধুসূদন দত্ত ছিলেন ১৯শ শতাব্দীর একজন বাঙালি কবি ও নাট্যকার। তাঁকে বাংলা সনেটের জনক হিসেবে বিবেচনা করা হয়।' },
            { title: 'Chapter 4: Bankim Chandra', titleBn: 'অধ্যায় ৪: বঙ্কিমচন্দ্র', content: 'Bankim Chandra Chattopadhyay was the first Indian novelist. He wrote Vande Mataram which became the national song of India.', contentBn: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায় ছিলেন প্রথম ভারতীয় ঔপন্যাসিক। তিনি বন্দে মাতরম্ লিখেছিলেন যা ভারতের জাতীয় সঙ্গীত হয়ে ওঠে।' },
          ],
        },
      ],

      readingSessions: [
        { id: 'RS-001', studentId: 'ET-2025-10001', digitalBookId: 'DB-001', currentPage: 45, currentChapter: 2, progress: 37, totalTime: 1800, isCompleted: false, bookmarks: [{ page: 20, label: 'Important formulas', createdAt: '2025-07-10' }], lastRead: '2025-07-14', createdAt: '2025-07-01' },
        { id: 'RS-002', studentId: 'ET-2025-10002', digitalBookId: 'DB-002', currentPage: 80, currentChapter: 5, progress: 100, totalTime: 3600, isCompleted: true, bookmarks: [], lastRead: '2025-07-12', createdAt: '2025-06-20' },
      ],

      settings: { ...DEFAULT_LIBRARY_SETTINGS },

      addBook: (book) => set((state) => {
        const newCopies = generateCopies(book.id, book.totalCopies, state.copies.length + 1)
        return { books: [...state.books, book], copies: [...state.copies, ...newCopies] }
      }),
      updateBook: (id, data) =>
        set((state) => {
          const old = state.books.find((b) => b.id === id)
          const updated = { ...old!, ...data }
          let copies = state.copies
          if (data.totalCopies !== undefined && old && data.totalCopies !== old.totalCopies) {
            const diff = data.totalCopies - old.totalCopies
            if (diff > 0) {
              const newCopies = generateCopies(id, diff, state.copies.length + 1)
              copies = [...state.copies, ...newCopies]
            } else {
              const bookCopies = state.copies.filter((c) => c.bookId === id)
              const toRemove = bookCopies.filter((c) => c.status === 'available').slice(diff)
              copies = state.copies.filter((c) => !toRemove.some((r) => r.id === c.id))
            }
          }
          return { books: state.books.map((b) => (b.id === id ? updated : b)), copies }
        }),
      deleteBook: (id) =>
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
          copies: state.copies.filter((c) => c.bookId !== id),
          borrowings: state.borrowings.filter((b) => b.bookId !== id),
          digitalBooks: state.digitalBooks.filter((d) => d.bookId !== id),
        })),
      toggleBookActive: (id) =>
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
        })),

      addCategory: (cat) => set((state) => ({ categories: [...state.categories, cat] })),
      updateCategory: (id, data) =>
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          books: state.books.map((b) => (b.categoryId === id ? { ...b, categoryId: '' } : b)),
        })),
      toggleCategoryActive: (id) =>
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
        })),

      addCopy: (copy) => set((state) => ({ copies: [...state.copies, copy] })),
      updateCopy: (id, data) =>
        set((state) => ({ copies: state.copies.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCopy: (id) =>
        set((state) => ({ copies: state.copies.filter((c) => c.id !== id) })),

      addBorrowing: (b) => {
        set((state) => {
          const book = state.books.find((bk) => bk.id === b.bookId)
          return {
            borrowings: [b, ...state.borrowings],
            copies: state.copies.map((c) => c.id === b.copyId ? { ...c, status: 'issued' as BookCopyStatus, issuedTo: b.studentId, dueDate: b.dueDate } : c),
            books: book ? state.books.map((bk) => bk.id === b.bookId ? { ...bk, availableCopies: Math.max(0, bk.availableCopies - 1) } : bk) : state.books,
          }
        })
      },
      updateBorrowing: (id, data) =>
        set((state) => ({
          borrowings: state.borrowings.map((b) => (b.id === id ? { ...b, ...data } : b)),
        })),
      deleteBorrowing: (id) =>
        set((state) => {
          const b = state.borrowings.find((br) => br.id === id)
          if (!b) return state
          const book = state.books.find((bk) => bk.id === b.bookId)
          return {
            borrowings: state.borrowings.filter((br) => br.id !== id),
            copies: state.copies.map((c) => c.id === b.copyId ? { ...c, status: 'available' as BookCopyStatus, issuedTo: undefined, dueDate: undefined } : c),
            books: book ? state.books.map((bk) => bk.id === b.bookId ? { ...bk, availableCopies: bk.availableCopies + 1 } : bk) : state.books,
          }
        }),
      returnBook: (borrowingId, condition, fine, fineReason) => {
        set((state) => {
          const b = state.borrowings.find((br) => br.id === borrowingId)
          if (!b) return state
          const returnDate = today()
          const updatedBorrowing: Borrowing = { ...b, returnDate, status: 'returned', condition, fine, fineReason }
          const copyStatus: BookCopyStatus = condition === 'damaged' ? 'damaged' : condition === 'worn' ? 'available' : 'available'
          const book = state.books.find((bk) => bk.id === b.bookId)
          return {
            borrowings: state.borrowings.map((br) => (br.id === borrowingId ? updatedBorrowing : br)),
            copies: state.copies.map((c) => c.id === b.copyId ? { ...c, status: copyStatus, issuedTo: undefined, dueDate: undefined, condition } : c),
            books: book ? state.books.map((bk) => bk.id === b.bookId ? { ...bk, availableCopies: bk.availableCopies + 1 } : bk) : state.books,
          }
        })
      },
      renewBorrowing: (id) => {
        set((state) => {
          const b = state.borrowings.find((br) => br.id === id)
          if (!b) return state
          const settings = state.settings
          const newDueDate = addDays(b.dueDate, settings.borrowingDurationDays)
          return {
            borrowings: state.borrowings.map((br) => (br.id === id ? { ...br, dueDate: newDueDate, renewalCount: br.renewalCount + 1 } : br)),
            copies: state.copies.map((c) => c.id === b.copyId ? { ...c, dueDate: newDueDate } : c),
          }
        })
      },

      addDigitalBook: (db) => set((state) => ({ digitalBooks: [...state.digitalBooks, db] })),
      updateDigitalBook: (id, data) =>
        set((state) => ({
          digitalBooks: state.digitalBooks.map((d) => (d.id === id ? { ...d, ...data } : d)),
        })),
      deleteDigitalBook: (id) =>
        set((state) => ({
          digitalBooks: state.digitalBooks.filter((d) => d.id !== id),
          readingSessions: state.readingSessions.filter((r) => r.digitalBookId !== id),
        })),

      addReadingSession: (rs) => set((state) => ({ readingSessions: [...state.readingSessions, rs] })),
      updateReadingSession: (id, data) =>
        set((state) => ({
          readingSessions: state.readingSessions.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),

      updateSettings: (data) => set((state) => ({ settings: { ...state.settings, ...data } })),

      getNextBookId: () => {
        const year = new Date().getFullYear()
        const existing = get().books
          .filter((b) => b.id.startsWith(`LB-${year}-`))
          .map((b) => parseInt(b.id.split('-')[2], 10))
          .filter((n) => !isNaN(n))
        const maxNum = existing.length > 0 ? Math.max(...existing) : 0
        return `LB-${year}-${String(maxNum + 1).padStart(3, '0')}`
      },
      getNextBorrowingId: () => {
        const existing = get().borrowings
          .map((b) => parseInt(b.id.split('-')[1], 10))
          .filter((n) => !isNaN(n))
        const maxNum = existing.length > 0 ? Math.max(...existing) : 0
        return `BRW-${String(maxNum + 1).padStart(3, '0')}`
      },
    }),
    { name: 'edutech-library', storage: createNamespacedStorage('edutech-library'), version: 1 }
  )
)

function updateOverdueStatus() {
  const { borrowings, updateBorrowing } = useLibraryStore.getState()
  const now = today()
  for (const b of borrowings) {
    if (b.status === 'borrowed' && b.dueDate < now) {
      updateBorrowing(b.id, { status: 'overdue' })
    }
  }
}

registerStoreReset(() => {
  useLibraryStore.setState({ books: [], categories: [], copies: [], borrowings: [], digitalBooks: [], readingSessions: [], settings: DEFAULT_LIBRARY_SETTINGS })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-library_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useLibraryStore.setState(parsed.state)
    }
  } catch { /* ignore */ }
  updateOverdueStatus()
})

export function calcFine(dueDate: string, finePerDay: number): number {
  const now = today()
  if (dueDate >= now) return 0
  const days = daysBetween(dueDate, now)
  return Math.max(0, days * finePerDay)
}
