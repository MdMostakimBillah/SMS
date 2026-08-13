import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layouts/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { RouteLoadingTracker } from '@/components/ui/RouteLoadingTracker'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, RoleProtectedRoute, ViewingRoute } from '@/components/ProtectedRoute'
import { AuthRoute } from '@/components/AuthRoute'
import { LOGIN_PATH } from '@/lib/constants'
import { useSubdomain } from '@/hooks/useSubdomain'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const InstitutionRegister = lazy(() => import('@/pages/auth/InstitutionRegister'))
const InstitutionLoginRoute = lazy(() => import('@/pages/auth/InstitutionLoginRoute'))
const InstitutionLanding = lazy(() => import('@/pages/institution/InstitutionLanding'))
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
const StorePage = lazy(() => import('@/pages/store'))
const TransportPage = lazy(() => import('@/pages/transport'))
const HostelPage = lazy(() => import('@/pages/hostel'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))
const SettingsPage = lazy(() => import('@/pages/settings'))

function P({ name }: { name: string }) {
  return <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 500, padding: '1.25rem' }}>{name}</div>
}

const F = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary><Suspense fallback={<LoadingSpinner />}>{children}</Suspense></ErrorBoundary>
)

function AppContent() {
  const { isSubdomain, institution, resolved } = useSubdomain()

  if (isSubdomain && institution && resolved) {
    if (resolved.mode === 'subdomain' || resolved.mode === 'custom-domain') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <InstitutionLanding />
        </Suspense>
      )
    }
  }

  return (
    <AuthProvider>
      <RouteLoadingTracker />
      <Routes>
        <Route path="/i/:slug" element={<F><InstitutionLanding /></F>} />
        <Route path="/i/:slug/login" element={<F><InstitutionLoginRoute /></F>} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/i/:slug/:role/dashboard" element={<F><DashboardPage /></F>} />
            <Route path="/i/:slug/:role/students" element={<F><StudentsPage /></F>} />
            <Route path="/i/:slug/:role/students/admission" element={<F><StudentAdmission /></F>} />
            <Route path="/i/:slug/:role/students/all" element={<F><AllStudentsPage /></F>} />
            <Route path="/i/:slug/:role/students/update" element={<F><UpdateStudentPage /></F>} />
            <Route path="/i/:slug/:role/students/bulk-update" element={<F><BulkUpdatePage /></F>} />
            <Route path="/i/:slug/:role/students/id-cards" element={<F><IDCardsPage /></F>} />
            <Route path="/i/:slug/:role/students/promotion" element={<F><PromotionPage /></F>} />
            <Route path="/i/:slug/:role/teachers" element={<F><TeachersPage /></F>} />
            <Route path="/i/:slug/:role/teachers/add" element={<F><AddTeacherPage /></F>} />
            <Route path="/i/:slug/:role/teachers/all" element={<F><AllTeachersPage /></F>} />
            <Route path="/i/:slug/:role/teachers/all/:id" element={<F><TeacherDetailPage /></F>} />
            <Route path="/i/:slug/:role/teachers/edit/:id" element={<F><EditTeacherPage /></F>} />
            <Route path="/i/:slug/:role/teachers/bulk-update" element={<F><TeacherBulkUpdatePage /></F>} />
            <Route path="/i/:slug/:role/teachers/departments" element={<F><DepartmentsPage /></F>} />
            <Route path="/i/:slug/:role/teachers/subjects" element={<F><SubjectsPage /></F>} />
            <Route path="/i/:slug/:role/teachers/designations" element={<F><DesignationsPage /></F>} />
            <Route path="/i/:slug/:role/classes" element={<F><ClassesPage /></F>} />
            <Route path="/i/:slug/:role/hr" element={<F><HRPage /></F>} />
            <Route path="/i/:slug/:role/attendance" element={<F><AttendancePage /></F>} />
            <Route path="/i/:slug/:role/exams" element={<F><ExamDashboard /></F>} />
            <Route path="/i/:slug/:role/exams/planning" element={<F><Step1Planning /></F>} />
            <Route path="/i/:slug/:role/exams/scheduling" element={<F><Step2Schedule /></F>} />
            <Route path="/i/:slug/:role/exams/evaluation" element={<F><Step3Evaluation /></F>} />
            <Route path="/i/:slug/:role/exams/results" element={<F><Step4Results /></F>} />
            <Route path="/i/:slug/:role/exams/marksheet" element={<F><Step5Marksheet /></F>} />
            <Route path="/i/:slug/:role/exams/omr" element={<F><OMRSheetPage /></F>} />
            <Route path="/i/:slug/:role/syllabus" element={<F><SyllabusPage /></F>} />
            <Route path="/i/:slug/:role/assignments" element={<F><AssignmentsPage /></F>} />
            <Route path="/i/:slug/:role/online" element={<F><OnlineClassesPage /></F>} />
            <Route path="/i/:slug/:role/finance" element={<F><FinancePage /></F>} />
            <Route path="/i/:slug/:role/payroll" element={<F><PayrollPage /></F>} />
            <Route path="/i/:slug/:role/store" element={<F><StorePage /></F>} />
            <Route path="/i/:slug/:role/expenses" element={<P name="Expenses" />} />
            <Route path="/i/:slug/:role/library" element={<P name="Library" />} />
            <Route path="/i/:slug/:role/transport" element={<F><TransportPage /></F>} />
            <Route path="/i/:slug/:role/hostel" element={<F><HostelPage /></F>} />
            <Route path="/i/:slug/:role/messages" element={<P name="Messages" />} />
            <Route path="/i/:slug/:role/notice" element={<P name="Notice Board" />} />
            <Route path="/i/:slug/:role/notifications" element={<P name="Notifications" />} />
            <Route path="/i/:slug/:role/parent-portal" element={<P name="Parent Portal" />} />
            <Route path="/i/:slug/:role/student-portal" element={<P name="Student Portal" />} />
            <Route path="/i/:slug/:role/analytics" element={<P name="Analytics" />} />
            <Route path="/i/:slug/:role/reports" element={<P name="Reports" />} />
            <Route path="/i/:slug/:role/settings" element={<F><SettingsPage /></F>} />
          </Route>
        </Route>

        <Route element={<AuthRoute />}>
          {LOGIN_PATH && <Route path={`${LOGIN_PATH}/login`} element={<F><LoginPage /></F>} />}
          <Route path="/register" element={<F><InstitutionRegister /></F>} />
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/login" element={<Navigate to="/register" replace />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/super-admin" element={<F><SuperAdminPage /></F>} />
            <Route path="/super-admin/:subpage" element={<F><SuperAdminPage /></F>} />
          </Route>
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/super-admin/admin/dashboard" element={<F><DashboardPage /></F>} />
            <Route path="/super-admin/admin/students" element={<F><StudentsPage /></F>} />
            <Route path="/super-admin/admin/students/admission" element={<F><StudentAdmission /></F>} />
            <Route path="/super-admin/admin/students/all" element={<F><AllStudentsPage /></F>} />
            <Route path="/super-admin/admin/students/update" element={<F><UpdateStudentPage /></F>} />
            <Route path="/super-admin/admin/students/bulk-update" element={<F><BulkUpdatePage /></F>} />
            <Route path="/super-admin/admin/students/id-cards" element={<F><IDCardsPage /></F>} />
            <Route path="/super-admin/admin/students/promotion" element={<F><PromotionPage /></F>} />
            <Route path="/super-admin/admin/teachers" element={<F><TeachersPage /></F>} />
            <Route path="/super-admin/admin/teachers/add" element={<F><AddTeacherPage /></F>} />
            <Route path="/super-admin/admin/teachers/all" element={<F><AllTeachersPage /></F>} />
            <Route path="/super-admin/admin/teachers/all/:id" element={<F><TeacherDetailPage /></F>} />
            <Route path="/super-admin/admin/teachers/edit/:id" element={<F><EditTeacherPage /></F>} />
            <Route path="/super-admin/admin/teachers/bulk-update" element={<F><TeacherBulkUpdatePage /></F>} />
            <Route path="/super-admin/admin/teachers/departments" element={<F><DepartmentsPage /></F>} />
            <Route path="/super-admin/admin/teachers/subjects" element={<F><SubjectsPage /></F>} />
            <Route path="/super-admin/admin/teachers/designations" element={<F><DesignationsPage /></F>} />
            <Route path="/super-admin/admin/classes" element={<F><ClassesPage /></F>} />
            <Route path="/super-admin/admin/hr" element={<F><HRPage /></F>} />
            <Route path="/super-admin/admin/attendance" element={<F><AttendancePage /></F>} />
            <Route path="/super-admin/admin/exams" element={<F><ExamDashboard /></F>} />
            <Route path="/super-admin/admin/exams/planning" element={<F><Step1Planning /></F>} />
            <Route path="/super-admin/admin/exams/scheduling" element={<F><Step2Schedule /></F>} />
            <Route path="/super-admin/admin/exams/evaluation" element={<F><Step3Evaluation /></F>} />
            <Route path="/super-admin/admin/exams/results" element={<F><Step4Results /></F>} />
            <Route path="/super-admin/admin/exams/marksheet" element={<F><Step5Marksheet /></F>} />
            <Route path="/super-admin/admin/exams/omr" element={<F><OMRSheetPage /></F>} />
            <Route path="/super-admin/admin/syllabus" element={<F><SyllabusPage /></F>} />
            <Route path="/super-admin/admin/assignments" element={<F><AssignmentsPage /></F>} />
            <Route path="/super-admin/admin/online" element={<F><OnlineClassesPage /></F>} />
            <Route path="/super-admin/admin/finance" element={<F><FinancePage /></F>} />
            <Route path="/super-admin/admin/payroll" element={<F><PayrollPage /></F>} />
            <Route path="/super-admin/admin/store" element={<F><StorePage /></F>} />
            <Route path="/super-admin/admin/expenses" element={<P name="Expenses" />} />
            <Route path="/super-admin/admin/library" element={<P name="Library" />} />
            <Route path="/super-admin/admin/transport" element={<F><TransportPage /></F>} />
            <Route path="/super-admin/admin/hostel" element={<F><HostelPage /></F>} />
            <Route path="/super-admin/admin/messages" element={<P name="Messages" />} />
            <Route path="/super-admin/admin/notice" element={<P name="Notice Board" />} />
            <Route path="/super-admin/admin/notifications" element={<P name="Notifications" />} />
            <Route path="/super-admin/admin/parent-portal" element={<P name="Parent Portal" />} />
            <Route path="/super-admin/admin/student-portal" element={<P name="Student Portal" />} />
            <Route path="/super-admin/admin/analytics" element={<P name="Analytics" />} />
            <Route path="/super-admin/admin/reports" element={<P name="Reports" />} />
            <Route path="/super-admin/admin/settings" element={<F><SettingsPage /></F>} />
          </Route>
        </Route>

        <Route element={<ViewingRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/super-admin/viewing/:role/dashboard" element={<F><DashboardPage /></F>} />
            <Route path="/super-admin/viewing/:role/students" element={<F><StudentsPage /></F>} />
            <Route path="/super-admin/viewing/:role/students/admission" element={<F><StudentAdmission /></F>} />
            <Route path="/super-admin/viewing/:role/students/all" element={<F><AllStudentsPage /></F>} />
            <Route path="/super-admin/viewing/:role/students/update" element={<F><UpdateStudentPage /></F>} />
            <Route path="/super-admin/viewing/:role/students/bulk-update" element={<F><BulkUpdatePage /></F>} />
            <Route path="/super-admin/viewing/:role/students/id-cards" element={<F><IDCardsPage /></F>} />
            <Route path="/super-admin/viewing/:role/students/promotion" element={<F><PromotionPage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers" element={<F><TeachersPage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers/add" element={<F><AddTeacherPage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers/all" element={<F><AllTeachersPage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers/all/:id" element={<F><TeacherDetailPage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers/edit/:id" element={<F><EditTeacherPage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers/bulk-update" element={<F><TeacherBulkUpdatePage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers/departments" element={<F><DepartmentsPage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers/subjects" element={<F><SubjectsPage /></F>} />
            <Route path="/super-admin/viewing/:role/teachers/designations" element={<F><DesignationsPage /></F>} />
            <Route path="/super-admin/viewing/:role/classes" element={<F><ClassesPage /></F>} />
            <Route path="/super-admin/viewing/:role/hr" element={<F><HRPage /></F>} />
            <Route path="/super-admin/viewing/:role/attendance" element={<F><AttendancePage /></F>} />
            <Route path="/super-admin/viewing/:role/exams" element={<F><ExamDashboard /></F>} />
            <Route path="/super-admin/viewing/:role/exams/planning" element={<F><Step1Planning /></F>} />
            <Route path="/super-admin/viewing/:role/exams/scheduling" element={<F><Step2Schedule /></F>} />
            <Route path="/super-admin/viewing/:role/exams/evaluation" element={<F><Step3Evaluation /></F>} />
            <Route path="/super-admin/viewing/:role/exams/results" element={<F><Step4Results /></F>} />
            <Route path="/super-admin/viewing/:role/exams/marksheet" element={<F><Step5Marksheet /></F>} />
            <Route path="/super-admin/viewing/:role/exams/omr" element={<F><OMRSheetPage /></F>} />
            <Route path="/super-admin/viewing/:role/syllabus" element={<F><SyllabusPage /></F>} />
            <Route path="/super-admin/viewing/:role/assignments" element={<F><AssignmentsPage /></F>} />
            <Route path="/super-admin/viewing/:role/online" element={<F><OnlineClassesPage /></F>} />
            <Route path="/super-admin/viewing/:role/finance" element={<F><FinancePage /></F>} />
            <Route path="/super-admin/viewing/:role/payroll" element={<F><PayrollPage /></F>} />
            <Route path="/super-admin/viewing/:role/store" element={<F><StorePage /></F>} />
            <Route path="/super-admin/viewing/:role/expenses" element={<P name="Expenses" />} />
            <Route path="/super-admin/viewing/:role/library" element={<P name="Library" />} />
            <Route path="/super-admin/viewing/:role/transport" element={<F><TransportPage /></F>} />
            <Route path="/super-admin/viewing/:role/hostel" element={<F><HostelPage /></F>} />
            <Route path="/super-admin/viewing/:role/messages" element={<P name="Messages" />} />
            <Route path="/super-admin/viewing/:role/notice" element={<P name="Notice Board" />} />
            <Route path="/super-admin/viewing/:role/notifications" element={<P name="Notifications" />} />
            <Route path="/super-admin/viewing/:role/parent-portal" element={<P name="Parent Portal" />} />
            <Route path="/super-admin/viewing/:role/student-portal" element={<P name="Student Portal" />} />
            <Route path="/super-admin/viewing/:role/analytics" element={<P name="Analytics" />} />
            <Route path="/super-admin/viewing/:role/reports" element={<P name="Reports" />} />
            <Route path="/super-admin/viewing/:role/settings" element={<F><SettingsPage /></F>} />
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
