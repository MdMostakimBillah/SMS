import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type BuiltinTemplateType = 'fee' | 'exam' | 'due' | 'general' | 'exam_result'
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
    subject: 'Fee Payment Confirmation - {school_name}',
    body: 'Dear {father_name},\n\nYour child {student_name} (Class {class}-{section}, Roll {roll}) fee payment of {amount} BDT has been received for {month}.\n\nFee: {fee_name}\nTotal Fee: {total_fee} BDT\nPaid: {amount} BDT\nDue: {due_amount} BDT\nDiscount: {discount} BDT\nReceipt: {receipt_no}\nDate: {payment_date}\n\nThank you.\n{school_name}',
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
    subject: 'Pending Fee Reminder - {school_name}',
    body: 'Dear {father_name},\n\nYour child {student_name} (Class {class}-{section}, Roll {roll}) has an outstanding balance of {due_amount} BDT for {month}.\n\nFee: {fee_name}\nTotal Fee: {total_fee} BDT\nPaid: {paid_amount} BDT\nDue: {due_amount} BDT\nFine: {fine} BDT\nPlease clear your due by {due_date}.\n\nThank you.\n{school_name}',
    trigger: 'due_reminder',
    category: 'Due',
    isDefault: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TPL-EXAM-RESULT-001',
    type: 'exam_result',
    name: 'Exam Result',
    nameBn: 'পরীক্ষার ফলাফল',
    subject: 'Exam Result - {school_name}',
    body: 'Dear {father_name},\n\nYour child {student_name} (Class {class}-{section}, Roll {roll}) {exam_name} results for {subject}:\n\nObtained: {obtained_marks}/{total_marks}\nGrade: {grade}\nGPA: {gpa}\nPosition: {position} out of {total_position}\nStatus: {result_status}\n\n{remarks}\n\n{school_name}',
    trigger: 'exam_result',
    category: 'Exam',
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

const DEFAULT_CATEGORIES = ['Fee', 'Exam', 'Due', 'General', 'Result']

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
      version: 2,
      migrate: (state: any, version: number) => {
        if (version < 2) {
          const merged = DEFAULT_TEMPLATES.map((dt) => {
            const cached = state.templates?.find((t: MessageTemplate) => t.id === dt.id)
            if (cached && cached.isDefault) {
              return { ...dt, body: dt.body, subject: dt.subject }
            }
            return cached || dt
          })
          const custom = (state.templates || []).filter((t: MessageTemplate) => !t.isDefault)
          return { ...state, templates: [...merged, ...custom], categories: state.categories || DEFAULT_CATEGORIES }
        }
        return state
      },
    }
  )
)

registerStoreReset(() => {
  useMessageTemplateStore.setState({ templates: DEFAULT_TEMPLATES, categories: DEFAULT_CATEGORIES })
})