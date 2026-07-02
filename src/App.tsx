import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layouts/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AuthProvider } from '@/contexts/AuthContext'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
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

function P({ name }: { name: string }) {
  return <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 500, padding: '1.25rem' }}>{name}</div>
}

const F = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary><Suspense fallback={<LoadingSpinner />}>{children}</Suspense></ErrorBoundary>
)

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<F><LoginPage /></F>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<F><DashboardPage /></F>} />
          <Route path="/students" element={<F><StudentsPage /></F>} />
          <Route path="/students/admission" element={<F><StudentAdmission /></F>} />
          <Route path="/students/all" element={<F><AllStudentsPage /></F>} />
          <Route path="/students/update" element={<F><UpdateStudentPage /></F>} />
          <Route path="/students/bulk-update" element={<F><BulkUpdatePage /></F>} />
          <Route path="/students/id-cards" element={<F><IDCardsPage /></F>} />
          <Route path="/students/promotion" element={<F><PromotionPage /></F>} />
          <Route path="/teachers" element={<F><TeachersPage /></F>} />
          <Route path="/teachers/add" element={<F><AddTeacherPage /></F>} />
          <Route path="/teachers/all" element={<F><AllTeachersPage /></F>} />
          <Route path="/teachers/all/:id" element={<F><TeacherDetailPage /></F>} />
          <Route path="/teachers/edit/:id" element={<F><EditTeacherPage /></F>} />
          <Route path="/teachers/bulk-update" element={<F><TeacherBulkUpdatePage /></F>} />
          <Route path="/teachers/departments" element={<F><DepartmentsPage /></F>} />
          <Route path="/teachers/subjects" element={<F><SubjectsPage /></F>} />
          <Route path="/teachers/designations" element={<F><DesignationsPage /></F>} />
          <Route path="/classes" element={<F><ClassesPage /></F>} />
          <Route path="/hr" element={<F><HRPage /></F>} />
          <Route path="/attendance" element={<F><AttendancePage /></F>} />
          <Route path="/exams" element={<F><ExamDashboard /></F>} />
          <Route path="/exams/planning" element={<F><Step1Planning /></F>} />
          <Route path="/exams/scheduling" element={<F><Step2Schedule /></F>} />
          <Route path="/exams/evaluation" element={<F><Step3Evaluation /></F>} />
          <Route path="/exams/results" element={<F><Step4Results /></F>} />
          <Route path="/exams/marksheet" element={<F><Step5Marksheet /></F>} />
          <Route path="/exams/omr" element={<F><OMRSheetPage /></F>} />
          <Route path="/syllabus" element={<F><SyllabusPage /></F>} />
          <Route path="/assignments" element={<F><AssignmentsPage /></F>} />
          <Route path="/online" element={<P name="Online Classes" />} />
          <Route path="/finance" element={<P name="Finance" />} />
          <Route path="/payroll" element={<F><PayrollPage /></F>} />
          <Route path="/store" element={<P name="School Store" />} />
          <Route path="/expenses" element={<P name="Expenses" />} />
          <Route path="/library" element={<P name="Library" />} />
          <Route path="/transport" element={<P name="Transport" />} />
          <Route path="/hostel" element={<P name="Hostel" />} />
          <Route path="/messages" element={<P name="Messages" />} />
          <Route path="/notice" element={<P name="Notice Board" />} />
          <Route path="/notifications" element={<P name="Notifications" />} />
          <Route path="/parent-portal" element={<P name="Parent Portal" />} />
          <Route path="/student-portal" element={<P name="Student Portal" />} />
          <Route path="/analytics" element={<P name="Analytics" />} />
          <Route path="/reports" element={<P name="Reports" />} />
          <Route path="/super-admin" element={<P name="Super Admin" />} />
          <Route path="/settings" element={<P name="Settings" />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
