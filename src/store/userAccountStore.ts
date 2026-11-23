import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites, getSlug } from '@/lib/storage'
import type { StudentAdmission } from '@/pages/students/admission/types'

export type AccountRole = 'student' | 'parent'
export type AccountStatus = 'active' | 'locked' | 'pending'

export interface UserAccount {
  id: string
  schoolId: string
  schoolName: string
  role: AccountRole
  studentId: string
  studentNameEn: string
  studentNameBn: string
  guardianName?: string
  guardianRelation?: string
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
  findAccount: (identifier: string, schoolId?: string) => UserAccount | undefined
}

function generateRandomPin(length = 6): string {
  let pin = ''
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString()
  }
  return pin
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let res = 'Edu#'
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return res
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
            studentNameEn: data.studentNameEn || '',
            studentNameBn: data.studentNameBn || '',
            guardianName: data.guardianName,
            guardianRelation: data.guardianRelation,
            class: data.class || '',
            section: data.section || '',
            roll: data.roll || '',
            username: (data.username || data.studentId || '').trim(),
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
        const now = new Date().toISOString().split('T')[0]
        const sId = school.id || school.slug || 'INST'
        const sName = school.name || 'Institution'

        set((state) => {
          const map = new Map<string, UserAccount>()
          state.accounts.forEach((acc) => map.set(acc.id, acc))

          students.forEach((s) => {
            const stuAccId = `acc-stu-${s.id}`
            const parAccId = `acc-par-${s.id}`

            const existingStu = map.get(stuAccId)
            const stuUsername = existingStu?.username || (s.id || `stu_${s.roll || '1'}`).trim()
            const stuPassword = existingStu?.password || '123456'

            map.set(stuAccId, {
              id: stuAccId,
              schoolId: existingStu?.schoolId || sId,
              schoolName: existingStu?.schoolName || sName,
              role: 'student',
              studentId: s.id,
              studentNameEn: s.nameEn || '',
              studentNameBn: s.nameBn || s.nameEn || '',
              guardianName: s.guardianName,
              guardianRelation: s.guardianRelation,
              class: s.class || '',
              section: s.section || '',
              roll: s.roll || '',
              username: stuUsername,
              password: stuPassword,
              phone: s.phone || '',
              email: s.email || '',
              status: existingStu?.status || (s.status === 'approved' ? 'active' : 'pending'),
              createdAt: existingStu?.createdAt || s.admissionDate || now,
              updatedAt: existingStu ? existingStu.updatedAt : now,
              lastLogin: existingStu?.lastLogin,
            })

            const existingPar = map.get(parAccId)
            const parUsername = existingPar?.username || (s.guardianPhone || s.fatherPhone || `p_${s.id}`).trim()
            const parPassword = existingPar?.password || '123456'

            map.set(parAccId, {
              id: parAccId,
              schoolId: existingPar?.schoolId || sId,
              schoolName: existingPar?.schoolName || sName,
              role: 'parent',
              studentId: s.id,
              studentNameEn: s.nameEn || '',
              studentNameBn: s.nameBn || s.nameEn || '',
              guardianName: s.guardianName || s.fatherNameEn || '',
              guardianRelation: s.guardianRelation || 'Parent',
              class: s.class || '',
              section: s.section || '',
              roll: s.roll || '',
              username: parUsername,
              password: parPassword,
              phone: s.guardianPhone || s.fatherPhone || '',
              email: s.email || '',
              status: existingPar?.status || (s.status === 'approved' ? 'active' : 'pending'),
              createdAt: existingPar?.createdAt || s.admissionDate || now,
              updatedAt: existingPar ? existingPar.updatedAt : now,
              lastLogin: existingPar?.lastLogin,
            })
          })

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
