import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type TemplateType = 'fee' | 'exam' | 'due' | 'general'

export interface MessageTemplate {
  id: string
  type: TemplateType
  name: string
  nameBn: string
  subject: string
  body: string
  updatedAt: string
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'TPL-FEE-001',
    type: 'fee',
    name: 'Fee Collection',
    nameBn: 'ফি আদায়',
    subject: 'Fee Payment Confirmation',
    body: 'Dear {student_name},\n\nYour fee payment of {amount} has been received for {month}. Receipt No: {receipt_no}.\n\nThank you.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TPL-EXAM-001',
    type: 'exam',
    name: 'Examination',
    nameBn: 'পরীক্ষা',
    subject: 'Exam Schedule Notice',
    body: 'Dear {student_name},\n\n{exam_name} is scheduled from {start_date} to {end_date}. Please prepare accordingly.\n\nBest wishes.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TPL-DUE-001',
    type: 'due',
    name: 'Due Payment',
    nameBn: 'বকেয় পেমেন্ট',
    subject: 'Pending Fee Reminder',
    body: 'Dear {student_name},\n\nYou have an outstanding balance of {due_amount} for {month}. Please clear your due by {due_date}.\n\nRegards.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TPL-GEN-001',
    type: 'general',
    name: 'General Message',
    nameBn: 'সাধারণ বার্তা',
    subject: '{subject}',
    body: 'Dear {recipient_name},\n\n{message}\n\nBest regards,\n{school_name}',
    updatedAt: new Date().toISOString(),
  },
]

interface MessageTemplateState {
  templates: MessageTemplate[]
  getTemplate: (type: TemplateType) => MessageTemplate | undefined
  updateTemplate: (id: string, data: Partial<Pick<MessageTemplate, 'subject' | 'body'>>) => void
}

export const useMessageTemplateStore = create<MessageTemplateState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,

      getTemplate: (type) => get().templates.find((t) => t.type === type),

      updateTemplate: (id, data) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        })),
    }),
    {
      name: 'edutech-message-templates',
      storage: createNamespacedStorage('edutech-message-templates'),
    }
  )
)

registerStoreReset(() => {
  useMessageTemplateStore.setState({ templates: DEFAULT_TEMPLATES })
})
