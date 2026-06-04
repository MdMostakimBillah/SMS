export type Tab = 'overview' | 'decisions' | 'increment' | 'bonus' | 'promotion' | 'fund' | 'salary-setup' | 'facilities'

export type ModalType = 'increment' | 'bonus' | 'promotion' | 'fund' | null
export type FacModalType = 'add-facility' | 'edit-facility' | 'assign' | 'edit-assign' | null
export type PDFModalType = 'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary' | null

export interface IncForm {
  teacherId: string
  type: 'annual' | 'performance' | 'special'
  percentage: string
  reason: string
}

export interface BonForm {
  teacherId: string
  type: 'festival' | 'performance' | 'attendance' | 'special'
  amount: string
  reason: string
  month: string
}

export interface ProForm {
  teacherId: string
  fromDesignation: string
  toDesignation: string
  reason: string
}

export interface FundForm {
  type: 'contribution' | 'bonus_pool' | 'increment_pool' | 'withdrawal'
  amount: string
  description: string
}

export interface FacForm {
  name: string
  nameBn: string
  defaultAmount: string
  type: 'monthly' | 'oneTime'
}

export interface AssignForm {
  teacherId: string
  facilityId: string
  amount: string
}
