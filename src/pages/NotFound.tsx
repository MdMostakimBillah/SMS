import { useNavigate } from 'react-router-dom'
import { FileQuestion, ArrowLeft } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useAuth } from '@/contexts/AuthContext'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { user } = useAuth()

  const goHome = () => {
    if (!user) return navigate('/')
    const slug = sessionStorage.getItem('edutech_inst_slug')
    const viewingId = sessionStorage.getItem('edutech_viewing_id')
    if (viewingId) return navigate('/super-admin/viewing/admin/dashboard')
    if (slug) return navigate(`/i/${slug}/${user.role}/dashboard`)
    if (user.role === 'super_admin') return navigate('/super-admin')
    return navigate('/')
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-6">
          <FileQuestion size={32} className="text-[var(--text-muted)]" />
        </div>
        <h1 className="text-[2rem] font-bold text-[var(--text-primary)] mb-2">404</h1>
        <p className="text-[0.9375rem] text-[var(--text-secondary)] mb-6">
          {isBn ? 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি' : 'Page not found'}
        </p>
        <button
          onClick={goHome}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={16} />
          {isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
        </button>
      </div>
    </div>
  )
}
