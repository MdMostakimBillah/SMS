import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBn } from '@/hooks/useBn'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useUserAccountStore, type UserAccount, type AccountStatus } from '@/store/userAccountStore'
import type { AccountFilters } from './types'
import { AccountsHeader } from './components/AccountsHeader'
import { AccountsFilterBar } from './components/AccountsFilterBar'
import { AccountsTable } from './components/AccountsTable'
import { EditUsernameModal } from './components/EditUsernameModal'
import { ResetPasswordModal } from './components/ResetPasswordModal'
import { BulkPasswordModal } from './components/BulkPasswordModal'
import { ExportCredentialsModal } from './components/ExportCredentialsModal'

export default function SuperAdminAccountsPage({ isBn: propIsBn }: { isBn?: boolean }) {
  const hookIsBn = useBn()
  const isBn = propIsBn ?? hookIsBn
  const [searchParams] = useSearchParams()

  const institutions = useSuperAdminStore((s) => s.institutions) || []
  const admissionStudents = useAdmissionStore((s) => s.students) || []
  const teachers = useTeacherStore((s) => s.teachers) || []
  const departments = useTeacherStore((s) => s.departments) || []

  const {
    accounts,
    updateUsername,
    updatePassword,
    toggleAccountStatus,
    bulkResetPasswords,
    bulkSetStatus,
    syncFromStudents,
    syncFromTeachers,
  } = useUserAccountStore()

  // Auto-sync students and teachers from active institution or store into accounts
  useEffect(() => {
    const activeSchool = institutions[0] || { id: 'default', name: 'Demo School', slug: 'demo' }
    if (admissionStudents.length > 0) {
      syncFromStudents(admissionStudents, activeSchool)
    }
    if (teachers.length > 0) {
      syncFromTeachers(teachers, activeSchool, departments)
    }
  }, [admissionStudents, teachers, departments, institutions, syncFromStudents, syncFromTeachers])

  // Filters State
  const initialSchool = searchParams.get('school') || 'all'
  const [filters, setFilters] = useState<AccountFilters>({
    schoolId: initialSchool,
    role: 'all',
    className: 'all',
    section: 'all',
    status: 'all',
    search: '',
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal States
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null)
  const [resetAccount, setResetAccount] = useState<UserAccount | null>(null)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const handleFilterChange = (key: keyof AccountFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setFilters({
      schoolId: 'all',
      role: 'all',
      className: 'all',
      section: 'all',
      status: 'all',
      search: '',
    })
    setCurrentPage(1)
  }

  // Derive dynamic options for filters
  const availableClasses = useMemo(() => {
    const set = new Set<string>()
    accounts.forEach((a) => {
      if (a.class) set.add(a.class)
    })
    return Array.from(set).sort()
  }, [accounts])

  const availableSections = useMemo(() => {
    const set = new Set<string>()
    accounts.forEach((a) => {
      if (a.section) set.add(a.section)
    })
    return Array.from(set).sort()
  }, [accounts])

  const existingUsernames = useMemo(() => {
    return new Set(accounts.map((a) => a.username.toLowerCase()))
  }, [accounts])

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return accounts.filter((a) => {
      if (filters.schoolId !== 'all' && a.schoolId !== filters.schoolId) return false
      if (filters.role !== 'all' && a.role !== filters.role) return false
      if (filters.className !== 'all' && a.class !== filters.className) return false
      if (filters.section !== 'all' && a.section !== filters.section) return false
      if (filters.status !== 'all' && a.status !== filters.status) return false
      if (q) {
        const matches =
          a.username.toLowerCase().includes(q) ||
          a.studentId.toLowerCase().includes(q) ||
          (a.staffId && a.staffId.toLowerCase().includes(q)) ||
          a.studentNameEn.toLowerCase().includes(q) ||
          a.studentNameBn.toLowerCase().includes(q) ||
          (a.guardianName && a.guardianName.toLowerCase().includes(q)) ||
          (a.department && a.department.toLowerCase().includes(q)) ||
          (a.designation && a.designation.toLowerCase().includes(q)) ||
          a.roll.toLowerCase().includes(q) ||
          a.phone.includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [accounts, filters])

  // Pagination Slice
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAccounts.slice(start, start + pageSize)
  }, [filteredAccounts, currentPage, pageSize])

  // Metrics
  const metrics = useMemo(() => {
    let studentCount = 0
    let parentCount = 0
    let teacherCount = 0
    let activeCount = 0
    let lockedCount = 0
    accounts.forEach((a) => {
      if (a.role === 'student') studentCount++
      else if (a.role === 'parent') parentCount++
      else if (a.role === 'teacher') teacherCount++
      if (a.status === 'active') activeCount++
      else lockedCount++
    })
    return { total: accounts.length, studentCount, parentCount, teacherCount, activeCount, lockedCount }
  }, [accounts])

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (paginatedAccounts.every((a) => selectedIds.has(a.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedAccounts.forEach((a) => next.delete(a.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginatedAccounts.forEach((a) => next.add(a.id))
        return next
      })
    }
  }

  const selectedAccounts = useMemo(() => {
    if (selectedIds.size === 0) return filteredAccounts
    return accounts.filter((a) => selectedIds.has(a.id))
  }, [accounts, selectedIds, filteredAccounts])

  const handleApplyBulk = (
    mode: 'random_pin' | 'random_pass' | 'default' | 'custom',
    customValue?: string,
    targetStatus?: AccountStatus
  ) => {
    const targetIds = selectedAccounts.map((a) => a.id)
    bulkResetPasswords(targetIds, mode, customValue)
    if (targetStatus) {
      bulkSetStatus(targetIds, targetStatus)
    }
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-4">
      <AccountsHeader
        isBn={isBn}
        totalCount={metrics.total}
        studentCount={metrics.studentCount}
        parentCount={metrics.parentCount}
        teacherCount={metrics.teacherCount}
        activeCount={metrics.activeCount}
        lockedCount={metrics.lockedCount}
        selectedCount={selectedIds.size}
        onOpenBulkModal={() => setBulkModalOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
      />

      <AccountsFilterBar
        isBn={isBn}
        filters={filters}
        onFilterChange={handleFilterChange}
        schools={institutions}
        availableClasses={availableClasses}
        availableSections={availableSections}
        onResetFilters={handleResetFilters}
      />

      <AccountsTable
        isBn={isBn}
        accounts={paginatedAccounts}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelect={handleToggleSelect}
        onEditUsername={(acc) => setEditingAccount(acc)}
        onResetPassword={(acc) => setResetAccount(acc)}
        onToggleStatus={(id) => toggleAccountStatus(id)}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredAccounts.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setCurrentPage(1)
        }}
      />

      {/* Modals */}
      <EditUsernameModal
        isBn={isBn}
        account={editingAccount}
        existingUsernames={existingUsernames}
        onClose={() => setEditingAccount(null)}
        onSave={(id, newUsername) => updateUsername(id, newUsername)}
      />

      <ResetPasswordModal
        isBn={isBn}
        account={resetAccount}
        onClose={() => setResetAccount(null)}
        onSave={(id, newPassword) => updatePassword(id, newPassword)}
      />

      <BulkPasswordModal
        isBn={isBn}
        selectedAccounts={selectedAccounts}
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onApply={handleApplyBulk}
      />

      <ExportCredentialsModal
        isBn={isBn}
        accounts={selectedAccounts}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  )
}
