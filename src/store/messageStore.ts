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
    { name: 'edutech-messages', storage: createNamespacedStorage('edutech-messages'), version: 1 }
  )
)

registerStoreReset(() => {
  useMessageStore.setState({ messages: [] })
})
