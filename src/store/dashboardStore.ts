import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WidgetId =
  | 'stat-students'
  | 'stat-teachers'
  | 'stat-approved'
  | 'stat-pending'
  | 'enrollment-trend'
  | 'class-distribution'
  | 'status-distribution'
  | 'gender-ratio'
  | 'teacher-status'
  | 'quick-stats'
  | 'recent-admissions'
  | 'upcoming-events'
  | 'top-students'
  | 'academic-overview'
  | 'exam-overview'
  | 'hr-summary'

export interface WidgetConfig {
  id: WidgetId
  visible: boolean
  labelEn: string
  labelBn: string
}

const DEFAULT_ORDER: WidgetId[] = [
  'stat-students',
  'stat-teachers',
  'stat-approved',
  'stat-pending',
  'enrollment-trend',
  'class-distribution',
  'status-distribution',
  'gender-ratio',
  'teacher-status',
  'quick-stats',
  'recent-admissions',
  'upcoming-events',
  'top-students',
  'academic-overview',
  'exam-overview',
  'hr-summary',
]

const WIDGET_LABELS: Record<WidgetId, { en: string; bn: string }> = {
  'stat-students': { en: 'Total Students', bn: 'মোট ছাত্র' },
  'stat-teachers': { en: 'Teachers', bn: 'শিক্ষক' },
  'stat-approved': { en: 'Approved', bn: 'অনুমোদিত' },
  'stat-pending': { en: 'Pending', bn: 'বিচারাধীন' },
  'enrollment-trend': { en: 'Weekly Enrollment', bn: 'সাপ্তাহিক ভর্তি' },
  'class-distribution': { en: 'Class Distribution', bn: 'শ্রেণি অনুযায়ী' },
  'status-distribution': { en: 'Status Distribution', bn: 'অবস্থা' },
  'gender-ratio': { en: 'Gender Ratio', bn: 'লিঙ্গ অনুপাত' },
  'teacher-status': { en: 'Teacher Status', bn: 'শিক্ষকের অবস্থা' },
  'quick-stats': { en: 'Quick Stats', bn: 'দ্রুত পরিসংখ্যান' },
  'recent-admissions': { en: 'Recent Admissions', bn: 'সাম্প্রতিক ভর্তি' },
  'upcoming-events': { en: 'Upcoming Events', bn: 'আসন্ন ইভেন্ট' },
  'top-students': { en: 'Top Students', bn: 'শীর্ষ ছাত্র' },
  'academic-overview': { en: 'Academic Overview', bn: 'একাডেমিক ওভারভিউ' },
  'exam-overview': { en: 'Exam Overview', bn: 'পরীক্ষার সারসংক্ষেপ' },
  'hr-summary': { en: 'HR Summary', bn: 'এইচআর সারসংক্ষেপ' },
}

export type WidgetColSpan = 1 | 2 | 3 | 4

interface DashboardState {
  order: WidgetId[]
  visibility: Record<WidgetId, boolean>
  colSpans: Record<WidgetId, WidgetColSpan>
  setOrder: (order: WidgetId[]) => void
  toggleVisibility: (id: WidgetId) => void
  setColSpan: (id: WidgetId, span: WidgetColSpan) => void
  resetLayout: () => void
}

function buildDefaultVisibility(): Record<WidgetId, boolean> {
  const v = {} as Record<WidgetId, boolean>
  for (const id of DEFAULT_ORDER) v[id] = true
  return v
}

function buildDefaultColSpans(): Record<WidgetId, WidgetColSpan> {
  const s = {} as Record<WidgetId, WidgetColSpan>
  for (const id of DEFAULT_ORDER) {
    if (id.startsWith('stat-')) s[id] = 1
    else s[id] = 2
  }
  return s
}

export function getWidgetLabel(id: WidgetId, isBn: boolean): string {
  return isBn ? WIDGET_LABELS[id].bn : WIDGET_LABELS[id].en
}

export function getAllWidgetLabels(): Record<WidgetId, { en: string; bn: string }> {
  return WIDGET_LABELS
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      order: [...DEFAULT_ORDER],
      visibility: buildDefaultVisibility(),
      colSpans: buildDefaultColSpans(),

      setOrder: (order) => set({ order }),

      toggleVisibility: (id) =>
        set((state) => ({
          visibility: { ...state.visibility, [id]: !state.visibility[id] },
        })),

      setColSpan: (id, span) =>
        set((state) => ({
          colSpans: { ...state.colSpans, [id]: span },
        })),

      resetLayout: () =>
        set({
          order: [...DEFAULT_ORDER],
          visibility: buildDefaultVisibility(),
          colSpans: buildDefaultColSpans(),
        }),
    }),
    {
      name: 'edutech-dashboard-layout',
    }
  )
)
