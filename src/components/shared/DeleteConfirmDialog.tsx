import { AlertCircle } from 'lucide-react'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'

interface DeleteConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isBn: boolean
}

export function DeleteConfirmDialog({ title, message, onConfirm, onCancel, isBn }: DeleteConfirmDialogProps) {
  return (
    <div className={modalOverlayCls} onClick={onCancel}>
      <div className={`modal-content ${modalStyleCls} max-w-[380px]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-[10px] mb-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
            <AlertCircle size={18} className="text-[var(--red)]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{isBn ? 'মুছে ফেলুন?' : title}</h3>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] mb-4">{isBn ? message : message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="py-2 px-[14px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] cursor-pointer font-[inherit]"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-[14px] rounded-lg bg-[var(--red)] border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit]"
          >
            {isBn ? 'মুছে ফেলুন' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
