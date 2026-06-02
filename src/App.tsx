import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layouts/AppLayout'
import DashboardPage    from '@/pages/dashboard'
import StudentsPage     from '@/pages/students'
import StudentAdmission from '@/pages/students/admission'
import AllStudentsPage  from '@/pages/students/all'
import UpdateStudentPage from '@/pages/students/update'
import BulkUpdatePage   from '@/pages/students/bulk-update'
import IDCardsPage      from '@/pages/students/id-cards'
import PromotionPage    from '@/pages/students/promotion'
import TeachersPage     from '@/pages/teachers'
import AddTeacherPage   from '@/pages/teachers/add'
import AllTeachersPage  from '@/pages/teachers/all'
import TeacherDetailPage from '@/pages/teachers/all/[id]'
import EditTeacherPage  from '@/pages/teachers/edit/[id]'
import DepartmentsPage  from '@/pages/teachers/departments'
import SubjectsPage     from '@/pages/teachers/subjects'
import TeacherBulkUpdatePage from '@/pages/teachers/bulk-update'
import DesignationsPage    from '@/pages/teachers/designations'
import PayrollPage from '@/pages/payroll'
import ClassesPage from '@/pages/classes'
import HRPage from '@/pages/hr'
import AttendancePage from '@/pages/attendance'
import ExamsPage from '@/pages/exams'

function P({ name }: { name: string }) {
  return <div style={{ color:'var(--text-primary)', fontSize:'20px', fontWeight:500, padding:'20px' }}>{name}</div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard"             element={<DashboardPage />} />
        <Route path="/students"              element={<StudentsPage />} />
        <Route path="/students/admission"    element={<StudentAdmission />} />
        <Route path="/students/all"          element={<AllStudentsPage />} />
        <Route path="/students/update"       element={<UpdateStudentPage />} />
        <Route path="/students/bulk-update"  element={<BulkUpdatePage />} />
        <Route path="/students/id-cards"     element={<IDCardsPage />} />
        <Route path="/students/promotion"    element={<PromotionPage />} />
        <Route path="/teachers"              element={<TeachersPage />} />
        <Route path="/teachers/add"          element={<AddTeacherPage />} />
        <Route path="/teachers/all"          element={<AllTeachersPage />} />
        <Route path="/teachers/all/:id"      element={<TeacherDetailPage />} />
        <Route path="/teachers/edit/:id"    element={<EditTeacherPage />} />
        <Route path="/teachers/bulk-update" element={<TeacherBulkUpdatePage />} />
        <Route path="/teachers/departments"  element={<DepartmentsPage />} />
        <Route path="/teachers/subjects"     element={<SubjectsPage />} />
        <Route path="/teachers/designations" element={<DesignationsPage />} />
        <Route path="/classes"               element={<ClassesPage />} />
        <Route path="/hr"                    element={<HRPage />} />
        <Route path="/attendance"            element={<AttendancePage />} />
        <Route path="/exams"                 element={<ExamsPage />} />
        <Route path="/syllabus"              element={<P name="Syllabus" />} />
        <Route path="/assignments"           element={<P name="Assignments" />} />
        <Route path="/online"                element={<P name="Online Classes" />} />
        <Route path="/finance"               element={<P name="Finance" />} />
        <Route path="/payroll"               element={<PayrollPage />} />
        <Route path="/store"                 element={<P name="School Store" />} />
        <Route path="/expenses"              element={<P name="Expenses" />} />
        <Route path="/library"               element={<P name="Library" />} />
        <Route path="/transport"             element={<P name="Transport" />} />
        <Route path="/hostel"                element={<P name="Hostel" />} />
        <Route path="/messages"              element={<P name="Messages" />} />
        <Route path="/notice"                element={<P name="Notice Board" />} />
        <Route path="/notifications"         element={<P name="Notifications" />} />
        <Route path="/parent-portal"         element={<P name="Parent Portal" />} />
        <Route path="/student-portal"        element={<P name="Student Portal" />} />
        <Route path="/analytics"             element={<P name="Analytics" />} />
        <Route path="/reports"               element={<P name="Reports" />} />
        <Route path="/super-admin"           element={<P name="Super Admin" />} />
        <Route path="/settings"              element={<P name="Settings" />} />
      </Route>
    </Routes>
  )
}
