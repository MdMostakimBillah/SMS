import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites, getSlug } from '@/lib/storage'
import type { StudentAdmission } from '@/pages/students/admission/types'
import type { Teacher, Department } from '@/pages/teachers/types'
import {
  generateRandomPin,
  generateRandomPassword,
  buildStudentAndParentAccounts,
  buildTeacherAccounts,
} from './userAccountUtils'

export type AccountRole = 'student' | 'parent' | 'teacher'
export type AccountStatus = 'active' | 'locked' | 'pending'

export interface UserAccount {
  id: string
  schoolId: string
  schoolName: string
  role: AccountRole
  studentId: string
  staffId?: string
  studentNameEn: string
  studentNameBn: string
  guardianName?: string
  guardianRelation?: string
  department?: string
  designation?: string
  class: string
  section: string
  roll: string
  username: string
  password: string
  phone: string
  email: string
  status: AccountStatus
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

interface UserAccountState {
  accounts: UserAccount[]
  setAccounts: (accounts: UserAccount[]) => void
  addOrUpdateAccount: (acc: Partial<UserAccount> & { id: string }) => void
  updateUsername: (id: string, username: string) => void
  updatePassword: (id: string, password: string) => void
  toggleAccountStatus: (id: string) => void
  setAccountStatus: (id: string, status: AccountStatus) => void
  bulkResetPasswords: (accountIds: string[], mode: 'random_pin' | 'random_pass' | 'default' | 'custom', customValue?: string) => void
  bulkSetStatus: (accountIds: string[], status: AccountStatus) => void
  syncFromStudents: (students: StudentAdmission[], school: { id: string; name: string; slug?: string }) => void
  syncFromTeachers: (teachers: Teacher[], school: { id: string; name: string; slug?: string }, departments?: Department[]) => void
  findAccount: (identifier: string, schoolId?: string) => UserAccount | undefined
}

export const useUserAccountStore = create<UserAccountState>()(
  persist(
    (set, get) => ({
      accounts: [],

      setAccounts: (accounts) => {
        set({ accounts })
        flushPendingWrites()
      },

      addOrUpdateAccount: (data) => {
        set((state) => {
          const now = new Date().toISOString().split('T')[0]
          const idx = state.accounts.findIndex((a) => a.id === data.id)
          if (idx >= 0) {
            const next = [...state.accounts]
            next[idx] = { ...next[idx], ...data, updatedAt: now }
            return { accounts: next }
          }
          const newAcc: UserAccount = {
            id: data.id,
            schoolId: data.schoolId || '',
            schoolName: data.schoolName || '',
            role: data.role || 'student',
            studentId: data.studentId || '',
            staffId: data.staffId,
            studentNameEn: data.studentNameEn || '',
            studentNameBn: data.studentNameBn || '',
            guardianName: data.guardianName,
            guardianRelation: data.guardianRelation,
            department: data.department,
            designation: data.designation,
            class: data.class || '',
            section: data.section || '',
            roll: data.roll || '',
            username: (data.username || data.studentId || data.staffId || '').trim(),
            password: data.password || '123456',
            phone: data.phone || '',
            email: data.email || '',
            status: data.status || 'active',
            createdAt: data.createdAt || now,
            updatedAt: now,
            lastLogin: data.lastLogin,
          }
          return { accounts: [newAcc, ...state.accounts] }
        })
        flushPendingWrites()
      },

      updateUsername: (id, username) => {
        const clean = username.trim()
        if (!clean) return
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, username: clean, updatedAt: new Date().toISOString().split('T')[0] } : a
          ),
        }))
        flushPendingWrites()
      },

      updatePassword: (id, password) => {
        const clean = password.trim()
        if (!clean) return
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, password: clean, updatedAt: new Date().toISOString().split('T')[0] } : a
          ),
        }))
        flushPendingWrites()
      },

      toggleAccountStatus: (id) => {
        set((state) => ({
          accounts: state.accounts.map((a) => {
            if (a.id !== id) return a
            const nextStatus: AccountStatus = a.status === 'active' ? 'locked' : 'active'
            return { ...a, status: nextStatus, updatedAt: new Date().toISOString().split('T')[0] }
          }),
        }))
        flushPendingWrites()
      },

      setAccountStatus: (id, status) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, status, updatedAt: new Date().toISOString().split('T')[0] } : a
          ),
        }))
        flushPendingWrites()
      },

      bulkResetPasswords: (accountIds, mode, customValue) => {
        const idSet = new Set(accountIds)
        const now = new Date().toISOString().split('T')[0]
        set((state) => ({
          accounts: state.accounts.map((a) => {
            if (!idSet.has(a.id)) return a
            let newPass = '123456'
            if (mode === 'random_pin') newPass = generateRandomPin(6)
            else if (mode === 'random_pass') newPass = generateRandomPassword()
            else if (mode === 'custom' && customValue) newPass = customValue.trim()
            return { ...a, password: newPass, updatedAt: now }
          }),
        }))
        flushPendingWrites()
      },

      bulkSetStatus: (accountIds, status) => {
        const idSet = new Set(accountIds)
        const now = new Date().toISOString().split('T')[0]
        set((state) => ({
          accounts: state.accounts.map((a) =>
            idSet.has(a.id) ? { ...a, status, updatedAt: now } : a
          ),
        }))
        flushPendingWrites()
      },

      syncFromStudents: (students, school) => {
        if (!students || students.length === 0) return
        set((state) => {
          const map = new Map<string, UserAccount>()
          state.accounts.forEach((acc) => map.set(acc.id, acc))
          const generated = buildStudentAndParentAccounts(students, school, map)
          generated.forEach((g) => map.set(g.id, g))
          return { accounts: Array.from(map.values()) }
        })
        flushPendingWrites()
      },

      syncFromTeachers: (teachers, school, departments) => {
        if (!teachers || teachers.length === 0) return
        set((state) => {
          const map = new Map<string, UserAccount>()
          state.accounts.forEach((acc) => map.set(acc.id, acc))
          const generated = buildTeacherAccounts(teachers, school, departments, map)
          generated.forEach((g) => map.set(g.id, g))
          return { accounts: Array.from(map.values()) }
        })
        flushPendingWrites()
      },

      findAccount: (identifier, schoolId) => {
        const clean = identifier.trim().toLowerCase()
        if (!clean) return undefined
        const { accounts } = get()
        return accounts.find((a) => {
          if (schoolId && a.schoolId && a.schoolId !== schoolId) return false
          return (
            a.username.toLowerCase() === clean ||
            a.studentId.toLowerCase() === clean ||
            (a.staffId && a.staffId.toLowerCase() === clean) ||
            (a.phone && a.phone.trim() === clean) ||
            (a.email && a.email.toLowerCase() === clean)
          )
        })
      },
    }),
    {
      name: 'edutech-user-accounts',
      storage: createNamespacedStorage('edutech-user-accounts'),
    }
  )
)

registerStoreReset(() => {
  useUserAccountStore.setState({ accounts: [] })
})

registerStoreLoad(() => {
  const slug = getSlug()
  try {
    const key = slug ? `edutech-user-accounts_${slug}` : 'edutech-user-accounts'
    const raw = localStorage.getItem(key) || (slug ? localStorage.getItem('edutech-user-accounts') : null)
    if (raw) {
      const parsed = JSON.parse(raw)
      const st = parsed?.state || parsed
      if (Array.isArray(st?.accounts)) {
        useUserAccountStore.setState({ accounts: st.accounts })
      }
    }
  } catch {
    /* ignore */
  }
})
