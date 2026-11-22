import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, UserPlus } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useNavPath } from '@/hooks/useNavPath'

interface Props {
  isInstitutionAdmin: boolean
}

export const PortalNoStudentsNotice = React.memo(function PortalNoStudentsNotice({
  isInstitutionAdmin,
}: Props) {
  const isBn = useBn()
  const navigate = useNavigate()
  const getNavPath = useNavPath()

  return (
    <div className="w-full max-w-xl mx-auto py-16 px-4 text-center">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xs space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
          <GraduationCap size={28} />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {isBn ? 'সিস্টেমে কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No Students Found in System'}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
          {isBn
            ? 'অভিভাবক পোর্টালে শিক্ষার্থীদের তথ্য প্রদর্শনের জন্য প্রথমে শিক্ষার্থী ভর্তি বা তথ্য যুক্ত থাকতে হবে। কোনো ডেমো বা কৃত্রিম তথ্য ছাড়াই বাস্তব শিক্ষার্থী ডাটাবেজের সাথে এটি সংযুক্ত।'
            : 'The Parent Portal operates directly on live student records with no mock data. Once students are admitted or imported, their complete profile, fees, and attendance will appear here.'}
        </p>
        {isInstitutionAdmin && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate(getNavPath('/students/admission'))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-90 cursor-pointer border-none"
            >
              <UserPlus size={14} />
              <span>{isBn ? 'শিক্ষার্থী ভর্তি পৃষ্ঠায় যান' : 'Go to Student Admission'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
