import { Routes, Route, Navigate } from "react-router-dom"
import AppLayout from "@/components/layouts/AppLayout"
import DashboardPage from "@/pages/dashboard"

// Student pages
import StudentsPage from "@/pages/students"
import StudentAdmission from "@/pages/students/admission"
import StudentAll from "@/pages/students/all"
import StudentUpdate from "@/pages/students/update"
import StudentBulkUpdate from "@/pages/students/bulk-update"
import StudentIdCards from "@/pages/students/id-cards"
import StudentPromotion from "@/pages/students/promotion"

function Placeholder({ name }: { name: string }) {
  return (
    <div style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 500 }}>
      {name}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard"      element={<DashboardPage />} />

        {/* Student routes */}
        <Route path="/students"             element={<StudentsPage />} />
        <Route path="/students/admission"   element={<StudentAdmission />} />
        <Route path="/students/all"         element={<StudentAll />} />
        <Route path="/students/update"      element={<StudentUpdate />} />
        <Route path="/students/bulk-update" element={<StudentBulkUpdate />} />
        <Route path="/students/id-cards"    element={<StudentIdCards />} />
        <Route path="/students/promotion"   element={<StudentPromotion />} />

        {/* Other pages */}
        <Route path="/teachers"       element={<Placeholder name="Teachers" />} />
        <Route path="/classes"        element={<Placeholder name="Classes" />} />
        <Route path="/hr"             element={<Placeholder name="HR & Staff" />} />
        <Route path="/attendance"     element={<Placeholder name="Attendance" />} />
        <Route path="/exams"          element={<Placeholder name="Exams" />} />
        <Route path="/syllabus"       element={<Placeholder name="Syllabus" />} />
        <Route path="/assignments"    element={<Placeholder name="Assignments" />} />
        <Route path="/online"         element={<Placeholder name="Online Classes" />} />
        <Route path="/finance"        element={<Placeholder name="Finance" />} />
        <Route path="/payroll"        element={<Placeholder name="Payroll" />} />
        <Route path="/store"          element={<Placeholder name="School Store" />} />
        <Route path="/expenses"       element={<Placeholder name="Expenses" />} />
        <Route path="/library"        element={<Placeholder name="Library" />} />
        <Route path="/transport"      element={<Placeholder name="Transport" />} />
        <Route path="/hostel"         element={<Placeholder name="Hostel" />} />
        <Route path="/messages"       element={<Placeholder name="Messages" />} />
        <Route path="/notice"         element={<Placeholder name="Notice Board" />} />
        <Route path="/notifications"  element={<Placeholder name="Notifications" />} />
        <Route path="/parent-portal"  element={<Placeholder name="Parent Portal" />} />
        <Route path="/student-portal" element={<Placeholder name="Student Portal" />} />
        <Route path="/analytics"      element={<Placeholder name="Analytics" />} />
        <Route path="/reports"        element={<Placeholder name="Reports" />} />
        <Route path="/super-admin"    element={<Placeholder name="Super Admin" />} />
        <Route path="/settings"       element={<Placeholder name="Settings" />} />
      </Route>
    </Routes>
  )
}
