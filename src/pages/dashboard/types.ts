export interface StudentStatSummary {
  approved: number
  pending: number
  rejected: number
  male: number
  female: number
}

export interface TeacherStatSummary {
  active: number
  onLeave: number
  inactive: number
  male: number
  female: number
  totalSalary: number
}

export interface FinanceStatSummary {
  todayIncome: number
  totalExpected: number
  monthIncome: number
  monthDue: number
  totalExpenses?: number
}

export interface TopStudentItem {
  name: string
  cls: string
  score: string
  initials: string
  color: string
}

export const DASHBOARD_COLORS = [
  '#6366f1',
  '#14b8a6',
  '#f59e0b',
  '#22c55e',
  '#a855f7',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
]

export const STATUS_COLORS = {
  approved: '#22c55e',
  pending: '#f59e0b',
  rejected: '#ef4444',
}

export const chartTooltipStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
  padding: '0.5rem 0.75rem',
  color: 'var(--text-primary)',
}
