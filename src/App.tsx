import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import AppLayout from '@/components/layouts/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, RoleProtectedRoute } from '@/components/ProtectedRoute'
import { AuthRoute } from '@/components/AuthRoute'
import { LOGIN_PATH } from '@/lib/constants'
import { useSubdomain } from '@/hooks/useSubdomain'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const InstitutionLogin = lazy(() => import('@/pages/auth/InstitutionLogin'))
const InstitutionLoginRoute = lazy(() => import('@/pages/auth/InstitutionLoginRoute'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const SuperAdminPage = lazy(() => import('@/pages/super-admin'))
const StudentsPage = lazy(() => import('@/pages/students'))
const StudentAdmission = lazy(() => import('@/pages/students/admission'))
const AllStudentsPage = lazy(() => import('@/pages/students/all'))
const UpdateStudentPage = lazy(() => import('@/pages/students/update'))
const BulkUpdatePage = lazy(() => import('@/pages/students/bulk-update'))
const IDCardsPage = lazy(() => import('@/pages/students/id-cards'))
const PromotionPage = lazy(() => import('@/pages/students/promotion'))
const TeachersPage = lazy(() => import('@/pages/teachers'))
const AddTeacherPage = lazy(() => import('@/pages/teachers/add'))
const AllTeachersPage = lazy(() => import('@/pages/teachers/all'))
const TeacherDetailPage = lazy(() => import('@/pages/teachers/all/[id]'))
const EditTeacherPage = lazy(() => import('@/pages/teachers/edit/[id]'))
const DepartmentsPage = lazy(() => import('@/pages/teachers/departments'))
const SubjectsPage = lazy(() => import('@/pages/teachers/subjects'))
const TeacherBulkUpdatePage = lazy(() => import('@/pages/teachers/bulk-update'))
const DesignationsPage = lazy(() => import('@/pages/teachers/designations'))
const PayrollPage = lazy(() => import('@/pages/payroll'))
const ClassesPage = lazy(() => import('@/pages/classes'))
const HRPage = lazy(() => import('@/pages/hr'))
const AttendancePage = lazy(() => import('@/pages/attendance'))
const ExamDashboard = lazy(() => import('@/pages/exams/index'))
const Step1Planning = lazy(() => import('@/pages/exams/step1'))
const Step2Schedule = lazy(() => import('@/pages/exams/step2'))
const Step3Evaluation = lazy(() => import('@/pages/exams/step3'))
const Step4Results = lazy(() => import('@/pages/exams/step4'))
const Step5Marksheet = lazy(() => import('@/pages/exams/step5'))
const OMRSheetPage = lazy(() => import('@/pages/exams/omr'))
const SyllabusPage = lazy(() => import('@/pages/syllabus'))
const AssignmentsPage = lazy(() => import('@/pages/assignments'))
const OnlineClassesPage = lazy(() => import('@/pages/online'))
const FinancePage = lazy(() => import('@/pages/finance'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))

function P({ name }: { name: string }) {
  return <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 500, padding: '1.25rem' }}>{name}</div>
}

const F = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary><Suspense fallback={<LoadingSpinner />}>{children}</Suspense></ErrorBoundary>
)

function LegacyDashboardRedirect() {
  const { subdomain } = useParams<{ subdomain: string }>()
  if (subdomain) return <Navigate to={`/i/${subdomain}/admin/dashboard`} replace />
  return <Navigate to="/admin/dashboard" replace />
}

function LegacyStudentsRedirect() {
  const { subdomain } = useParams<{ subdomain: string }>()
  if (subdomain) return <Navigate to={`/i/${subdomain}/admin/students`} replace />
  return <Navigate to="/admin/students" replace />
}

function AppContent() {
  const { isSubdomain, institution, resolved } = useSubdomain()

  if (isSubdomain && institution && resolved) {
    if (resolved.mode === 'subdomain' || resolved.mode === 'custom-domain') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <InstitutionLogin institution={institution} />
        </Suspense>
      )
    }
  }

  return (
    <AuthProvider>
      <Routes>
        <Route path="/i/:slug" element={<F><InstitutionLoginRoute /></F>} />

        <Route element={<AuthRoute />}>
          <Route path={LOGIN_PATH} element={<F><LoginPage /></F>} />
          <Route path="/register" element={<F><RegisterPage /></F>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<LegacyDashboardRedirect />} />
            <Route path="/students" element={<LegacyStudentsRedirect />} />
            <Route path="/teachers" element={<Navigate to="/admin/teachers" replace />} />
            <Route path="/classes" element={<Navigate to="/admin/classes" replace />} />
            <Route path="/hr" element={<Navigate to="/admin/hr" replace />} />
            <Route path="/attendance" element={<Navigate to="/admin/attendance" replace />} />
            <Route path="/exams" element={<Navigate to="/admin/exams" replace />} />
            <Route path="/syllabus" element={<Navigate to="/admin/syllabus" replace />} />
            <Route path="/assignments" element={<Navigate to="/admin/assignments" replace />} />
            <Route path="/online" element={<Navigate to="/admin/online" replace />} />
            <Route path="/finance" element={<Navigate to="/admin/finance" replace />} />
            <Route path="/payroll" element={<Navigate to="/admin/payroll" replace />} />
            <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/:role/dashboard" element={<F><DashboardPage /></F>} />
            <Route path="/:role/students" element={<F><StudentsPage /></F>} />
            <Route path="/:role/students/admission" element={<F><StudentAdmission /></F>} />
            <Route path="/:role/students/all" element={<F><AllStudentsPage /></F>} />
            <Route path="/:role/students/update" element={<F><UpdateStudentPage /></F>} />
            <Route path="/:role/students/bulk-update" element={<F><BulkUpdatePage /></F>} />
            <Route path="/:role/students/id-cards" element={<F><IDCardsPage /></F>} />
            <Route path="/:role/students/promotion" element={<F><PromotionPage /></F>} />
            <Route path="/:role/teachers" element={<F><TeachersPage /></F>} />
            <Route path="/:role/teachers/add" element={<F><AddTeacherPage /></F>} />
            <Route path="/:role/teachers/all" element={<F><AllTeachersPage /></F>} />
            <Route path="/:role/teachers/all/:id" element={<F><TeacherDetailPage /></F>} />
            <Route path="/:role/teachers/edit/:id" element={<F><EditTeacherPage /></F>} />
            <Route path="/:role/teachers/bulk-update" element={<F><TeacherBulkUpdatePage /></F>} />
            <Route path="/:role/teachers/departments" element={<F><DepartmentsPage /></F>} />
            <Route path="/:role/teachers/subjects" element={<F><SubjectsPage /></F>} />
            <Route path="/:role/teachers/designations" element={<F><DesignationsPage /></F>} />
            <Route path="/:role/classes" element={<F><ClassesPage /></F>} />
            <Route path="/:role/hr" element={<F><HRPage /></F>} />
            <Route path="/:role/attendance" element={<F><AttendancePage /></F>} />
            <Route path="/:role/exams" element={<F><ExamDashboard /></F>} />
            <Route path="/:role/exams/planning" element={<F><Step1Planning /></F>} />
            <Route path="/:role/exams/scheduling" element={<F><Step2Schedule /></F>} />
            <Route path="/:role/exams/evaluation" element={<F><Step3Evaluation /></F>} />
            <Route path="/:role/exams/results" element={<F><Step4Results /></F>} />
            <Route path="/:role/exams/marksheet" element={<F><Step5Marksheet /></F>} />
            <Route path="/:role/exams/omr" element={<F><OMRSheetPage /></F>} />
            <Route path="/:role/syllabus" element={<F><SyllabusPage /></F>} />
            <Route path="/:role/assignments" element={<F><AssignmentsPage /></F>} />
            <Route path="/:role/online" element={<F><OnlineClassesPage /></F>} />
            <Route path="/:role/finance" element={<F><FinancePage /></F>} />
            <Route path="/:role/payroll" element={<F><PayrollPage /></F>} />
            <Route path="/:role/store" element={<P name="School Store" />} />
            <Route path="/:role/expenses" element={<P name="Expenses" />} />
            <Route path="/:role/library" element={<P name="Library" />} />
            <Route path="/:role/transport" element={<P name="Transport" />} />
            <Route path="/:role/hostel" element={<P name="Hostel" />} />
            <Route path="/:role/messages" element={<P name="Messages" />} />
            <Route path="/:role/notice" element={<P name="Notice Board" />} />
            <Route path="/:role/notifications" element={<P name="Notifications" />} />
            <Route path="/:role/parent-portal" element={<P name="Parent Portal" />} />
            <Route path="/:role/student-portal" element={<P name="Student Portal" />} />
            <Route path="/:role/analytics" element={<P name="Analytics" />} />
            <Route path="/:role/reports" element={<P name="Reports" />} />
            <Route path="/:role/settings" element={<P name="Settings" />} />
          </Route>
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/super-admin" element={<F><SuperAdminPage /></F>} />
            <Route path="/super-admin/:subpage" element={<F><SuperAdminPage /></F>} />
          </Route>
        </Route>

        <Route path="*" element={<F><NotFoundPage /></F>} />
      </Routes>
    </AuthProvider>
  )
}

export default function App() {
  return <AppContent />
}
