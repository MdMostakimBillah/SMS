import React from 'react'
import { GraduationCap, Users, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNavPath } from '@/hooks/useNavPath'

interface StudentPortalEmptyStateProps {
  isBn: boolean
  isLocalPC: boolean
}

export const StudentPortalEmptyState = React.memo(function StudentPortalEmptyState({
  isBn,
  isLocalPC,
}: StudentPortalEmptyStateProps) {
  const getNavPath = useNavPath()

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brandLight)] text-[var(--brand)] flex items-center justify-center mx-auto mb-4">
        <GraduationCap size={32} />
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2">
        {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No Students Enrolled Yet'}
      </h2>

      <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
        {isLocalPC
          ? isBn
            ? 'আপনার লোকাল পিসি ফাইল ভল্টে এখনও কোনো শিক্ষার্থী ভর্তি করা হয়নি। পোর্টাল দেখতে অনুগ্রহ করে প্রথমে শিক্ষার্থী ভর্তি বা ইমপোর্ট করুন।'
            : 'No students are recorded in your local PC file storage yet. Please enroll or import students from the Student Admission section.'
          : isBn
            ? 'ক্লাউড ডাটাবেজে এখনও কোনো শিক্ষার্থী অন্তর্ভুক্ত হয়নি। অনুগ্রহ করে শিক্ষার্থী ভর্তি ফরম থেকে শিক্ষার্থী যোগ করুন।'
            : 'No students exist in the central database yet. Please register students to activate the student portal view.'}
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link
          to={getNavPath('/students/admission')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <PlusCircle size={16} />
          <span>{isBn ? 'নতুন শিক্ষার্থী ভর্তি' : 'New Admission'}</span>
        </Link>
        <Link
          to={getNavPath('/students/all')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] text-xs sm:text-sm font-medium transition-colors"
        >
          <Users size={16} />
          <span>{isBn ? 'শিক্ষার্থী তালিকা' : 'Student List'}</span>
        </Link>
      </div>
    </div>
  )
})
