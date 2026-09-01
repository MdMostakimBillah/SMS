import { useNavigate } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import { useBn } from '@/hooks/useBn'

export function AccessRestricted() {
  const isBn = useBn()
  const navigate = useNavigate()

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--red)]/8 flex items-center justify-center mx-auto mb-5">
          <ShieldOff size={28} className="text-[var(--red)]/70" />
        </div>
        <h2 className="text-[1.25rem] font-bold text-[var(--text-primary)] mb-2">
          {isBn ? 'অ্যাক্সেস নিষিদ্ধ' : 'Access Restricted'}
        </h2>
        <p className="text-[0.875rem] text-[var(--text-muted)] mb-6 leading-relaxed">
          {isBn
            ? 'আপনার এই পৃষ্ঠাটি দেখার অনুমতি নেই। আপনি যদি মনে করেন এটি ভুল, তবে অনুগ্রহ করে আপনার প্রশাসকের সাথে যোগাযোগ করুন।'
            : "You don't have permission to access this page. Contact your administrator if you believe this is incorrect."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--brand)] text-white text-[0.875rem] font-medium border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={16} />
          {isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
        </button>
      </div>
    </div>
  )
}
