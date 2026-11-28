import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'
import { useSmsStore } from './smsStore'

export type MessageRecipient = 'all' | 'students' | 'teachers' | 'parents' | string
export type MessageStatus = 'sent' | 'queued' | 'failed' | 'delivered'

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
  status: MessageStatus
  createdAt: string
  isSMS?: boolean
  phoneNumber?: string
  templateId?: string
  studentId?: string
}

let counter = 0
export function messageId(): string {
  counter++
  return `MSG-${Date.now()}-${counter}`
}

export function sendTemplateSMS(data: {
  studentId: string
  studentName: string
  phoneNumber: string
  subject: string
  body: string
  templateId?: string
  institutionId?: string
  institutionName?: string
  triggerType?: 'fee' | 'exam' | 'attendance' | 'admission' | 'manual'
}): Message {
  const instId = data.institutionId || sessionStorage.getItem('edutech_inst_slug') || 'inst-default'
  const instName = data.institutionName || 'Institution'

  const smsStore = useSmsStore.getState()
  const bal = smsStore.getInstitutionBalance(instId)
  const hasBalance = bal.remaining > 0

  const msg: Message = {
    id: messageId(),
    senderId: 'me',
    senderName: 'Admin',
    senderNameBn: 'Admin',
    senderRole: 'admin',
    recipientId: data.studentId,
    recipientName: data.studentName,
    subject: data.subject,
    body: data.body,
    read: true,
    status: hasBalance ? 'sent' : 'failed',
    createdAt: new Date().toISOString(),
    isSMS: true,
    phoneNumber: data.phoneNumber,
    templateId: data.templateId,
    studentId: data.studentId,
  }
  useMessageStore.getState().addMessage(msg)

  if (hasBalance) {
    void smsStore
      .sendSMS({
        institutionId: instId,
        institutionName: instName,
        phone: data.phoneNumber,
        message: `${data.subject}\n${data.body.replace(/<[^>]*>/g, '')}`,
        type: data.triggerType || 'fee',
      })
      .then((res) => {
        if (!res.success) {
          useMessageStore.setState((s) => ({
            messages: s.messages.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m)),
          }))
        } else {
          useMessageStore.setState((s) => ({
            messages: s.messages.map((m) => (m.id === msg.id ? { ...m, status: 'delivered' } : m)),
          }))
        }
      })
  }

  return msg
}

interface MessageState {
  messages: Message[]
  addMessage: (m: Message) => void
  markRead: (id: string) => void
  markAllRead: (inbox: boolean) => void
  deleteMessage: (id: string) => void
  resendMessage: (id: string) => void
}

export const useMessageStore = create<MessageState>()(
  persist(
    (set) => ({
      // Zero hardcoded demo messages — Super Admin and clean institutions start empty
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
      resendMessage: (id) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, status: 'sent' as MessageStatus, createdAt: new Date().toISOString() } : m
          ),
        })),
    }),
    {
      name: 'edutech-messages',
      storage: createNamespacedStorage('edutech-messages'),
      version: 1,
    }
  )
)

registerStoreReset(() => {
  useMessageStore.setState({ messages: [] })
})
