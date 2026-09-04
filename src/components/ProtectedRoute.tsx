import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { usePermission } from '@/hooks/usePermission'
import { LOGIN_PATH } from '@/lib/constants'
import { INSTITUTION_ROLES, type InstitutionRole } from '@/lib/navUtils'

const ROUTE_TO_PERMISSION: Record<string, string> = {
  dashboard: 'dashboard',
  classes: 'classes',
  teachers: 'teachers',
  students: 'students',
  hr: 'hr',
  attendance: 'attendance',
  exams: 'exams',
  syllabus: 'syllabus',
  assignments: 'assignments',
  online: 'online',
  finance: 'finance',
  payroll: 'payroll',
  store: 'store',
  expenses: 'finance.expenses',
  'accounting-report': 'accounting',
  'others-income': 'finance.others_income',
  library: 'library',
  transport: 'transport',
  hostel: 'hostel',
  messages: 'messages',
  notice: 'notice',
  notifications: 'notifications',
  settings: 'settings',
}

function getLoginRedirect(slug?: string): string {
  const s = slug || sessionStorage.getItem('edutech_inst_slug')
  if (s) return `/i/${s}`
  return LOGIN_PATH ? `${LOGIN_PATH}/login` : '/register'
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { role, slug } = useParams<{ role: string; slug: string }>()
  const location = useLocation()
  const { canRead, isAdmin } = usePermission()
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)

  if (loading) return null
  if (!user) return <Navigate to={getLoginRedirect(slug)} replace />

  const isViewing = user.role === 'super_admin' && (!!viewingInstitutionId || !!sessionStorage.getItem('edutech_viewing_id'))

  if (role && INSTITUTION_ROLES.includes(role as InstitutionRole)) {
    if (isViewing) {
      const allowedViewingRoles = ['admin', 'teacher', 'student', 'supervisor', 'manager', 'staff', 'guardian']
      if (!allowedViewingRoles.includes(role)) {
        return <Navigate to="/super-admin/viewing/admin/dashboard" replace />
      }
    } else {
      const userRole = user.role === 'super_admin' ? 'admin' : user.role
      if (role !== userRole) {
        const slug = sessionStorage.getItem('edutech_inst_slug')
        if (user.role === 'super_admin') return <Navigate to="/super-admin/admin/dashboard" replace />
        if (slug) return <Navigate to={`/i/${slug}/${userRole}/dashboard`} replace />
        return <Navigate to="/super-admin/admin/dashboard" replace />
      }

      // Permission check for institution pages (skip for super_admin viewing)
      if (!isAdmin && user.role !== 'super_admin') {
        const pathParts = location.pathname.split('/')
        // URL structure: /i/{slug}/{role}/{page}/...
        const pageSegment = pathParts[4] || ''
        const permKey = ROUTE_TO_PERMISSION[pageSegment]
        if (permKey && !canRead(permKey)) {
          const s = sessionStorage.getItem('edutech_inst_slug')
          return <Navigate to={`/i/${s}/${userRole}/dashboard`} replace />
        }
      }
    }
  }

  return <Outlet />
}

export function ViewingRoute() {
  const { user, loading } = useAuth()
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)

  if (loading) return null
  if (!user) return <Navigate to={getLoginRedirect()} replace />
  if (user.role !== 'super_admin') return <Navigate to="/super-admin/admin/dashboard" replace />
  if (!viewingInstitutionId && !sessionStorage.getItem('edutech_viewing_id')) return <Navigate to="/super-admin/schools" replace />

  return <Outlet />
}

export function RoleProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/register" replace />
  if (!allowedRoles.includes(user.role)) {
    const slug = sessionStorage.getItem('edutech_inst_slug')
    if (user.role === 'super_admin') return <Navigate to="/super-admin/admin/dashboard" replace />
    if (slug) return <Navigate to={`/i/${slug}/${user.role}/dashboard`} replace />
    return <Navigate to="/super-admin/admin/dashboard" replace />
  }

  return <Outlet />
}
