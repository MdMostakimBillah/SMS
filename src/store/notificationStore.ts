import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type NotificationType = 'info' | 'warning' | 'success' | 'error'

export interface Notification {
  id: string
  title: string
  titleBn: string
  message: string
  messageBn: string
  type: NotificationType
  read: boolean
  link?: string
  createdAt: string
}

let counter = 0
export function notificationId(): string {
  counter++
  return `NTF-${Date.now()}-${counter}`
}

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'NTF-SEED-001',
    title: 'Exam Results Published',
    titleBn: 'পরীক্ষার ফলাফল প্রকাশিত',
    message: 'The mid-term exam results for Class 10 have been published. Check the exam dashboard for details.',
    messageBn: 'দশম শ্রেণির মধ্যবর্তী পরীক্ষার ফলাফল প্রকাশিত হয়েছে। বিস্তারিত জানতে পরীক্ষার ড্যাশবোর্ড দেখুন।',
    type: 'success',
    read: false,
    link: '/exams',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'NTF-SEED-002',
    title: 'Fee Payment Overdue',
    titleBn: 'বেতন পরিশোধের মেয়াদ শেষ',
    message: 'You have 3 pending fee payments. Please clear them before the due date.',
    messageBn: 'আপনার ৩টি বকেয়া ফি পরিশোধ বাকি আছে। দয়া করে নির্ধারিত তারিখের মধ্যে পরিশোধ করুন।',
    type: 'warning',
    read: false,
    link: '/finance',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'NTF-SEED-003',
    title: 'New Admission Registered',
    titleBn: 'নতুন ভর্তি নিবন্ধিত',
    message: 'A new student "Kabir Ahmed" has been admitted to Class 8, Section A.',
    messageBn: 'একজন নতুন শিক্ষার্থী "কাবির আহমেদ" অষ্টম শ্রেণি, বিভাগ ক-এ ভর্তি হয়েছে।',
    type: 'info',
    read: false,
    link: '/students',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'NTF-SEED-004',
    title: 'System Maintenance',
    titleBn: 'সিস্টেম রক্ষণাবেক্ষণ',
    message: 'Scheduled maintenance on Sunday 2:00 AM - 4:00 AM. The system may be temporarily unavailable.',
    messageBn: 'রবিবার রাত ২টা - ৪টা নির্ধারিত রক্ষণাবেক্ষণ। সিস্টেম সাময়িকভাবে অনুপলব্ধ থাকতে পারে।',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'NTF-SEED-005',
    title: 'Backup Completed',
    titleBn: 'ব্যাকআপ সম্পন্ন',
    message: 'Daily database backup completed successfully.',
    messageBn: 'দৈনিক ডাটাবেস ব্যাকআপ সফলভাবে সম্পন্ন হয়েছে।',
    type: 'success',
    read: true,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 'NTF-SEED-006',
    title: 'Attendance Alert',
    titleBn: 'উপস্থিতি সতর্কতা',
    message: 'Class 9 Section B had 15% absence today. Please review attendance records.',
    messageBn: 'নবম শ্রেণি বিভাগ খ-তে আজ ১৫% অনুপস্থিতি ছিল। অনুগ্রহ করে উপস্থিতি রেকর্ড পর্যালোচনা করুন।',
    type: 'error',
    read: false,
    link: '/attendance',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
]

interface NotificationState {
  notifications: Notification[]
  addNotification: (n: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (n) => set((state) => ({ notifications: [n, ...state.notifications] })),
      markRead: (id) =>
        set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () =>
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
      deleteNotification: (id) =>
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'edutech-notifications',
      storage: createNamespacedStorage('edutech-notifications'),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state && state.notifications.length === 0) {
          state.notifications = SEED_NOTIFICATIONS
        }
      },
    }
  )
)

registerStoreReset(() => {
  useNotificationStore.setState({ notifications: [] })
})
