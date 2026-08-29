import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type BuiltinTemplateType = 'fee' | 'exam' | 'due' | 'general'
export type TemplateType = BuiltinTemplateType | string

export type TemplateTrigger = 'fee_collect' | 'exam_schedule' | 'due_reminder' | 'manual' | string

export interface MessageTemplate {
  id: string
  type: TemplateType
  name: string
  nameBn: string
  subject: string
  body: string
  trigger: TemplateTrigger
  category?: string
  isDefault: boolean
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
    trigger: 'fee_collect',
    category: 'Fee',
    isDefault: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TPL-EXAM-001',
    type: 'exam',
    name: 'Examination',
    nameBn: 'পরীক্ষা',
    subject: 'Exam Schedule Notice',
    body: 'Dear {student_name},\n\n{exam_name} is scheduled from {start_date} to {end_date}. Please prepare accordingly.\n\nBest wishes.',
    trigger: 'exam_schedule',
    category: 'Exam',
    isDefault: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TPL-DUE-001',
    type: 'due',
    name: 'Due Payment',
    nameBn: 'বকেয় পেমেন্ট',
    subject: 'Pending Fee Reminder',
    body: 'Dear {student_name},\n\nYou have an outstanding balance of {due_amount} for {month}. Please clear your due by {due_date}.\n\nRegards.',
    trigger: 'due_reminder',
    category: 'Due',
    isDefault: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TPL-GEN-001',
    type: 'general',
    name: 'General Message',
    nameBn: 'সাধারণ বার্তা',
    subject: '{subject}',
    body: 'Dear {recipient_name},\n\n{message}\n\nBest regards,\n{school_name}',
    trigger: 'manual',
    category: 'General',
    isDefault: true,
    updatedAt: new Date().toISOString(),
  },
]

const DEFAULT_CATEGORIES = ['Fee', 'Exam', 'Due', 'General']

interface MessageTemplateState {
  templates: MessageTemplate[]
  categories: string[]
  getTemplate: (type: TemplateType) => MessageTemplate | undefined
  getTemplatesByType: (type: TemplateType) => MessageTemplate[]
  getTemplatesByTrigger: (trigger: TemplateTrigger) => MessageTemplate[]
  getTemplatesByCategory: (category: string) => MessageTemplate[]
  updateTemplate: (id: string, data: Partial<Pick<MessageTemplate, 'subject' | 'body'>>) => void
  createTemplate: (data: Omit<MessageTemplate, 'id' | 'updatedAt'>) => string
  deleteTemplate: (id: string) => void
  addCategory: (name: string) => void
  removeCategory: (name: string) => void
}

export const useMessageTemplateStore = create<MessageTemplateState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      categories: DEFAULT_CATEGORIES,

      getTemplate: (type) => get().templates.find((t) => t.type === type),

      getTemplatesByType: (type) => get().templates.filter((t) => t.type === type),

      getTemplatesByTrigger: (trigger) => get().templates.filter((t) => t.trigger === trigger),

      getTemplatesByCategory: (category) => get().templates.filter((t) => t.category === category),

      updateTemplate: (id, data) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        })),

      createTemplate: (data) => {
        const id = `TPL-CUSTOM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const newTemplate: MessageTemplate = {
          ...data,
          id,
          isDefault: false,
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }))
        if (data.category && !get().categories.includes(data.category)) {
          set((state) => ({ categories: [...state.categories, data.category!] }))
        }
        return id
      },

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id || t.isDefault),
        })),

      addCategory: (name) =>
        set((state) => ({
          categories: state.categories.includes(name) ? state.categories : [...state.categories, name],
        })),

      removeCategory: (name) =>
        set((state) => ({
          categories: state.categories.filter((c) => c !== name),
          templates: state.templates.map((t) => (t.category === name ? { ...t, category: undefined } : t)),
        })),
    }),
    {
      name: 'edutech-message-templates',
      storage: createNamespacedStorage('edutech-message-templates'),
    }
  )
)

registerStoreReset(() => {
  useMessageTemplateStore.setState({ templates: DEFAULT_TEMPLATES, categories: DEFAULT_CATEGORIES })
})