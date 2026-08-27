import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type NoticeTarget = 'all' | 'students' | 'teachers' | 'parents'
export type NoticePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notice {
  id: string
  title: string
  titleBn: string
  content: string
  contentBn: string
  author: string
  authorBn: string
  target: NoticeTarget
  priority: NoticePriority
  pinned: boolean
  isActive: boolean
  publishedAt: string
  expiresAt: string
}

let counter = 0
export function noticeId(): string {
  counter++
  return `NOTICE-${Date.now()}-${counter}`
}

const SEED_NOTICES: Notice[] = [
  {
    id: 'NOTICE-SEED-001',
    title: 'Annual Sports Day',
    titleBn: 'বার্ষিক ক্রীড়া দিবস',
    content: 'We are excited to announce our Annual Sports Day on October 20th. All students must participate in at least one event. Registration forms are available at the sports office.',
    contentBn: 'আমরা আমাদের বার্ষিক ক্রীড়া দিবস অক্টোবর ২০ তারিখে ঘোষণা করতে উত্সাহিত। সকল শিক্ষার্থীকে অন্তত একটি ইভেন্টে অংশ নিতে হবে।',
    author: 'Principal',
    authorBn: 'অধ্যক্ষ',
    target: 'all',
    priority: 'high',
    pinned: true,
    isActive: true,
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    expiresAt: '',
  },
  {
    id: 'NOTICE-SEED-002',
    title: 'Mid-Term Exam Schedule Released',
    titleBn: 'মধ্যবর্তী পরীক্ষার সময়সূচি প্রকাশিত',
    content: 'The mid-term examination schedule for all classes has been published. Please check the exam dashboard for detailed timetables. Exams begin on September 15th.',
    contentBn: 'সকল শ্রেণির মধ্যবর্তী পরীক্ষার সময়সূচি প্রকাশিত হয়েছে। বিস্তারিত সময়সূচির জন্য পরীক্ষার ড্যাশবোর্ড দেখুন। পরীক্ষা সেপ্টেম্বর ১৫ তারিখ থেকে শুরু।',
    author: 'Academic Coordinator',
    authorBn: 'একাডেমিক সমন্বয়কারী',
    target: 'students',
    priority: 'high',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    expiresAt: '',
  },
  {
    id: 'NOTICE-SEED-003',
    title: 'Parent-Teacher Meeting',
    titleBn: 'অভিভাবক-শিক্ষক সাক্ষাৎ',
    content: 'A parent-teacher meeting is scheduled for this Friday at 3:00 PM. All parents are requested to attend to discuss their child\'s academic progress.',
    contentBn: 'এই শুক্রবার বিকাল ৩টায় একটি অভিভাবক-শিক্ষক সাক্ষাৎ অনুষ্ঠিত হবে। আপনার সন্তানের একাডেমিক অগ্রগতি নিয়ে আলোচনা করতে সকল অভিভাবকদের উপস্থিত হওয়া কাম্য।',
    author: 'Vice Principal',
    authorBn: 'উপাধ্যক্ষ',
    target: 'parents',
    priority: 'medium',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 604800000).toISOString(),
    expiresAt: '',
  },
  {
    id: 'NOTICE-SEED-004',
    title: 'Staff Training Workshop',
    titleBn: 'কর্মচারী প্রশিক্ষণ কর্মশালা',
    content: 'A mandatory training workshop on the new digital attendance system will be held on Saturday at 2:00 PM in the computer lab. All teachers must attend.',
    contentBn: 'নতুন ডিজিটাল উপস্থিতি সিস্টেমে একটি বাধ্যতামূলক প্রশিক্ষণ কর্মশালা শনিবার বিকাল ২টায় কম্পিউটার ল্যাবে অনুষ্ঠিত হবে। সকল শিক্ষকদের উপস্থিত হতে হবে।',
    author: 'Admin',
    authorBn: 'অ্যাডমিন',
    target: 'teachers',
    priority: 'medium',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: '',
  },
  {
    id: 'NOTICE-SEED-005',
    title: 'Library Hours Extended',
    titleBn: 'গ্রন্থাগারের সময় বৃদ্ধি',
    content: 'The library will remain open until 6:00 PM during exam preparation period (Sept 1-20). Students are encouraged to use the extended hours for study.',
    contentBn: 'পরীক্ষার প্রস্তুতি সময়কালে (সেপ্ট ১-২০) গ্রন্থাগার বিকাল ৬টা পর্যন্ত খোলা থাকবে। পড়াশোনার জন্য এই বর্ধিত সময় ব্যবহার করার জন্য শিক্ষার্থীদের উৎসাহিত করা হচ্ছে।',
    author: 'Librarian',
    authorBn: 'গ্রন্থপাল',
    target: 'students',
    priority: 'low',
    pinned: false,
    isActive: true,
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    expiresAt: '',
  },
]

interface NoticeState {
  notices: Notice[]
  addNotice: (n: Notice) => void
  updateNotice: (id: string, data: Partial<Notice>) => void
  deleteNotice: (id: string) => void
  togglePin: (id: string) => void
  toggleActive: (id: string) => void
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set) => ({
      notices: [],

      addNotice: (n) => set((state) => ({ notices: [n, ...state.notices] })),
      updateNotice: (id, data) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, ...data } : n)) })),
      deleteNotice: (id) =>
        set((state) => ({ notices: state.notices.filter((n) => n.id !== id) })),
      togglePin: (id) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) })),
      toggleActive: (id) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, isActive: !n.isActive } : n)) })),
    }),
    {
      name: 'edutech-notices',
      storage: createNamespacedStorage('edutech-notices'),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state && state.notices.length === 0) {
          state.notices = SEED_NOTICES
        }
      },
    }
  )
)

registerStoreReset(() => {
  useNoticeStore.setState({ notices: [] })
})
