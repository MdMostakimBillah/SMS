import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layouts/AppLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import DashboardPage from '@/pages/dashboard'
import StudentsPage from '@/pages/students'
import StudentAdmission from '@/pages/students/admission'
import AllStudentsPage from '@/pages/students/all'
import UpdateStudentPage from '@/pages/students/update'
import BulkUpdatePage from '@/pages/students/bulk-update'
import IDCardsPage from '@/pages/students/id-cards'
import PromotionPage from '@/pages/students/promotion'
import TeachersPage from '@/pages/teachers'
import AddTeacherPage from '@/pages/teachers/add'
import AllTeachersPage from '@/pages/teachers/all'
import TeacherDetailPage from '@/pages/teachers/all/[id]'
import EditTeacherPage from '@/pages/teachers/edit/[id]'
import DepartmentsPage from '@/pages/teachers/departments'
import SubjectsPage from '@/pages/teachers/subjects'
import TeacherBulkUpdatePage from '@/pages/teachers/bulk-update'
import DesignationsPage from '@/pages/teachers/designations'
import PayrollPage from '@/pages/payroll'
import ClassesPage from '@/pages/classes'
import HRPage from '@/pages/hr'
import AttendancePage from '@/pages/attendance'
import ExamDashboard from '@/pages/exams/index'
import Step1Planning from '@/pages/exams/step1'
import Step2Schedule from '@/pages/exams/step2'
import Step3Evaluation from '@/pages/exams/step3'
import Step4Results from '@/pages/exams/step4'
import Step5Marksheet from '@/pages/exams/step5'
import OMRSheetPage from '@/pages/exams/omr'
import SyllabusPage from '@/pages/syllabus'

function P({ name }: { name: string }) {
  return <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 500, padding: '1.25rem' }}>{name}</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
        <Route path="/students" element={<ErrorBoundary><StudentsPage /></ErrorBoundary>} />
        <Route path="/students/admission" element={<ErrorBoundary><StudentAdmission /></ErrorBoundary>} />
        <Route path="/students/all" element={<ErrorBoundary><AllStudentsPage /></ErrorBoundary>} />
        <Route path="/students/update" element={<ErrorBoundary><UpdateStudentPage /></ErrorBoundary>} />
        <Route path="/students/bulk-update" element={<ErrorBoundary><BulkUpdatePage /></ErrorBoundary>} />
        <Route path="/students/id-cards" element={<ErrorBoundary><IDCardsPage /></ErrorBoundary>} />
        <Route path="/students/promotion" element={<ErrorBoundary><PromotionPage /></ErrorBoundary>} />
        <Route path="/teachers" element={<ErrorBoundary><TeachersPage /></ErrorBoundary>} />
        <Route path="/teachers/add" element={<ErrorBoundary><AddTeacherPage /></ErrorBoundary>} />
        <Route path="/teachers/all" element={<ErrorBoundary><AllTeachersPage /></ErrorBoundary>} />
        <Route path="/teachers/all/:id" element={<ErrorBoundary><TeacherDetailPage /></ErrorBoundary>} />
        <Route path="/teachers/edit/:id" element={<ErrorBoundary><EditTeacherPage /></ErrorBoundary>} />
        <Route path="/teachers/bulk-update" element={<ErrorBoundary><TeacherBulkUpdatePage /></ErrorBoundary>} />
        <Route path="/teachers/departments" element={<ErrorBoundary><DepartmentsPage /></ErrorBoundary>} />
        <Route path="/teachers/subjects" element={<ErrorBoundary><SubjectsPage /></ErrorBoundary>} />
        <Route path="/teachers/designations" element={<ErrorBoundary><DesignationsPage /></ErrorBoundary>} />
        <Route path="/classes" element={<ErrorBoundary><ClassesPage /></ErrorBoundary>} />
        <Route path="/hr" element={<ErrorBoundary><HRPage /></ErrorBoundary>} />
        <Route path="/attendance" element={<ErrorBoundary><AttendancePage /></ErrorBoundary>} />
        <Route path="/exams" element={<ErrorBoundary><ExamDashboard /></ErrorBoundary>} />
        <Route path="/exams/planning" element={<ErrorBoundary><Step1Planning /></ErrorBoundary>} />
        <Route path="/exams/scheduling" element={<ErrorBoundary><Step2Schedule /></ErrorBoundary>} />
        <Route path="/exams/evaluation" element={<ErrorBoundary><Step3Evaluation /></ErrorBoundary>} />
        <Route path="/exams/results" element={<ErrorBoundary><Step4Results /></ErrorBoundary>} />
        <Route path="/exams/marksheet" element={<ErrorBoundary><Step5Marksheet /></ErrorBoundary>} />
        <Route path="/exams/omr" element={<ErrorBoundary><OMRSheetPage /></ErrorBoundary>} />
        <Route path="/syllabus" element={<ErrorBoundary><SyllabusPage /></ErrorBoundary>} />
        <Route path="/assignments" element={<P name="Assignments" />} />
        <Route path="/online" element={<P name="Online Classes" />} />
        <Route path="/finance" element={<P name="Finance" />} />
        <Route path="/payroll" element={<ErrorBoundary><PayrollPage /></ErrorBoundary>} />
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
  )
}
