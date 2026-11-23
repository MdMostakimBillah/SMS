import type { UserAccount, AccountRole, AccountStatus } from '@/store/userAccountStore'

export interface AccountFilters {
  schoolId: string
  role: 'all' | AccountRole
  className: string
  section: string
  status: 'all' | AccountStatus
  search: string
}

export interface AccountsHeaderProps {
  isBn: boolean
  totalCount: number
  studentCount: number
  parentCount: number
  teacherCount: number
  activeCount: number
  lockedCount: number
  selectedCount: number
  onOpenBulkModal: () => void
  onOpenExportModal: () => void
}

export interface AccountsFilterBarProps {
  isBn: boolean
  filters: AccountFilters
  onFilterChange: (key: keyof AccountFilters, value: string) => void
  schools: Array<{ id: string; name: string; nameBn?: string; slug?: string }>
  availableClasses: string[]
  availableSections: string[]
  availableDepartments?: string[]
  onResetFilters: () => void
}

export interface AccountTableRowProps {
  isBn: boolean
  account: UserAccount
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onEditUsername: (account: UserAccount) => void
  onResetPassword: (account: UserAccount) => void
  onToggleStatus: (id: string) => void
}

export interface AccountsTableProps {
  isBn: boolean
  accounts: UserAccount[]
  selectedIds: Set<string>
  onToggleSelectAll: () => void
  onToggleSelect: (id: string) => void
  onEditUsername: (account: UserAccount) => void
  onResetPassword: (account: UserAccount) => void
  onToggleStatus: (id: string) => void
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export interface EditUsernameModalProps {
  isBn: boolean
  account: UserAccount | null
  existingUsernames: Set<string>
  onClose: () => void
  onSave: (id: string, newUsername: string) => void
}

export interface ResetPasswordModalProps {
  isBn: boolean
  account: UserAccount | null
  onClose: () => void
  onSave: (id: string, newPassword: string) => void
}

export interface BulkPasswordModalProps {
  isBn: boolean
  selectedAccounts: UserAccount[]
  isOpen: boolean
  onClose: () => void
  onApply: (mode: 'random_pin' | 'random_pass' | 'default' | 'custom', customValue?: string, setStatus?: AccountStatus) => void
}

export interface ExportCredentialsModalProps {
  isBn: boolean
  accounts: UserAccount[]
  isOpen: boolean
  onClose: () => void
}
