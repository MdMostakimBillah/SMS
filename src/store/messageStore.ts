import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type MessageRecipient = 'all' | 'students' | 'teachers' | 'parents' | string

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderNameBn: string
  senderRole: string
  recipientId: MessageRecipient
  recipientName: string
  subject: string
  body: string
  read: boolean
  createdAt: string
}

let counter = 0
export function messageId(): string {
  counter++
  return `MSG-${Date.now()}-${counter}`
}

const SEED_MESSAGES: Message[] = [
  {
    id: 'MSG-SEED-001',
    senderId: 'TEA-001',
    senderName: 'Rahim Uddin',
    senderNameBn: 'রহিম উদ্দিন',
    senderRole: 'teacher',
    recipientId: 'all',
    recipientName: 'All Users',
    subject: 'Parent-Teacher Meeting Next Friday',
    body: 'Dear parents and guardians,\n\nWe are scheduling a parent-teacher meeting this Friday at 3:00 PM. Please attend to discuss your child\'s academic progress.\n\nBest regards,\nRahim Uddin',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'MSG-SEED-002',
    senderId: 'ADM-001',
    senderName: 'Admin Office',
    senderNameBn: 'অ্যাডমিন অফিস',
    senderRole: 'admin',
    recipientId: 'teachers',
    recipientName: 'Teachers',
    subject: 'Monthly Staff Meeting — August',
    body: 'All teachers are requested to attend the monthly staff meeting on Monday at 10:00 AM in the conference room.\n\nAgenda:\n1. Exam schedule review\n2. New curriculum updates\n3. Student attendance concerns',
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'MSG-SEED-003',
    senderId: 'LIB-001',
    senderName: 'Library Department',
    senderNameBn: 'গ্রন্থাগার বিভাগ',
    senderRole: 'staff',
    recipientId: 'students',
    recipientName: 'Students',
    subject: 'Overdue Library Books Reminder',
    body: 'Dear students,\n\nThis is a reminder that you have overdue library books. Please return them at the earliest to avoid late fees.\n\nThank you,\nLibrary Department',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'MSG-SEED-004',
    senderId: 'FIN-001',
    senderName: 'Finance Department',
    senderNameBn: 'অর্থ বিভাগ',
    senderRole: 'staff',
    recipientId: 'parents',
    recipientName: 'Parents',
    subject: 'Fee Payment Reminder — September',
    body: 'Dear parents,\n\nThis is a friendly reminder that the tuition fee for September is due by the 15th. Please make the payment at your earliest convenience.\n\nYou can pay online or visit the accounts office.\n\nThank you,\nFinance Department',
    read: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'MSG-SEED-005',
    senderId: 'PRINC-001',
    senderName: 'Principal',
    senderNameBn: 'অধ্যক্ষ',
    senderRole: 'admin',
    recipientId: 'all',
    recipientName: 'All Users',
    subject: 'Annual Sports Day Announcement',
    body: 'Dear all,\n\nI am pleased to announce that our Annual Sports Day will be held on October 20th. All students are encouraged to participate.\n\nMore details will follow soon.\n\nWarm regards,\nThe Principal',
    read: true,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 'MSG-SEED-006',
    senderId: 'me',
    senderName: 'Admin',
    senderNameBn: 'Admin',
    senderRole: 'admin',
    recipientId: 'teachers',
    recipientName: 'Teachers',
    subject: 'Updated Exam Grading Policy',
    body: 'Dear teachers,\n\nPlease note that the grading policy has been updated for this semester. Refer to the attached document for the new grade boundaries.\n\nRegards,\nAdmin',
    read: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'MSG-SEED-007',
    senderId: 'me',
    senderName: 'Admin',
    senderNameBn: 'Admin',
    senderRole: 'admin',
    recipientId: 'students',
    recipientName: 'Students',
    subject: 'Welcome Back — New Semester',
    body: 'Dear students,\n\nWelcome back to a new semester! We hope you had a great break. Let\'s make this semester a productive and enjoyable one.\n\nBest wishes,\nAdmin',
    read: true,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
]

interface MessageState {
  messages: Message[]
  addMessage: (m: Message) => void
  markRead: (id: string) => void
  markAllRead: (inbox: boolean) => void
  deleteMessage: (id: string) => void
}

export const useMessageStore = create<MessageState>()(
  persist(
    (set) => ({
      messages: [],

      addMessage: (m) => set((state) => ({ messages: [m, ...state.messages] })),
      markRead: (id) =>
        set((state) => ({ messages: state.messages.map((m) => (m.id === id ? { ...m, read: true } : m)) })),
      markAllRead: (inbox) =>
        set((state) => ({
          messages: state.messages.map((m) => {
            const isTarget = inbox
              ? m.recipientId === 'all' || m.recipientId === 'students' || m.recipientId === 'teachers' || m.recipientId === 'parents'
              : m.senderId === 'me'
            return isTarget && !m.read ? { ...m, read: true } : m
          }),
        })),
      deleteMessage: (id) =>
        set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),
    }),
    {
      name: 'edutech-messages',
      storage: createNamespacedStorage('edutech-messages'),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state && state.messages.length === 0) {
          state.messages = SEED_MESSAGES
        }
      },
    }
  )
)

registerStoreReset(() => {
  useMessageStore.setState({ messages: [] })
})
