import { X, Printer, CheckCircle, Calendar, CreditCard, Hash } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { createPortal } from 'react-dom'

interface ReceiptData {
  id: string
  studentName: string
  studentNameBn: string
  feeName: string
  feeNameBn: string
  amount: number
  paidAt: string
  method: string
  note: string
}

interface Props {
  data: ReceiptData
  onClose: () => void
}

export function PaymentReceiptModal({ data, onClose }: Props) {
  const bn = useBn()

  const fmt = (n: number) => `৳${n.toLocaleString()}`
  const methodLabel = (m: string) => m === 'cash' ? (bn ? 'নগদ' : 'Cash') : m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') : m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') : (bn ? 'অন্যান্য' : 'Other')

  const handlePrint = () => {
    window.print()
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[24rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'পেমেন্ট রসিদ' : 'Payment Receipt'}</h3>
          <div className="flex items-center gap-1">
            <button onClick={handlePrint} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer hover:text-[var(--brand)]">
              <Printer size={14} />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          {/* Header */}
          <div className="text-center mb-4 pb-3 border-b border-[var(--border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--green-light)] flex items-center justify-center mx-auto mb-2">
              <CheckCircle size={22} className="text-[var(--green)]" />
            </div>
            <p className="text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'পেমেন্ট রসিদ' : 'Payment Receipt'}</p>
          </div>

          {/* Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Hash size={12} className="text-[var(--text-muted)]" />
              <div className="flex-1">
                <p className="text-[0.6rem] text-[var(--text-muted)]">{bn ? 'পেমেন্ট আইডি' : 'Payment ID'}</p>
                <p className="font-mono font-medium text-[var(--text-primary)]">{data.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-[var(--text-muted)]" />
              <div className="flex-1">
                <p className="text-[0.6rem] text-[var(--text-muted)]">{bn ? 'তারিখ' : 'Date'}</p>
                <p className="font-medium text-[var(--text-primary)]">{data.paidAt}</p>
              </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div>
              <p className="text-[0.6rem] text-[var(--text-muted)] mb-0.5">{bn ? 'শিক্ষার্থী' : 'Student'}</p>
              <p className="font-medium text-[var(--text-primary)]">{bn ? data.studentNameBn || data.studentName : data.studentName}</p>
            </div>

            <div>
              <p className="text-[0.6rem] text-[var(--text-muted)] mb-0.5">{bn ? 'ফি' : 'Fee'}</p>
              <p className="font-medium text-[var(--text-primary)]">{bn ? data.feeNameBn || data.feeName : data.feeName}</p>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div className="flex items-center gap-2">
              <CreditCard size={12} className="text-[var(--text-muted)]" />
              <div className="flex-1">
                <p className="text-[0.6rem] text-[var(--text-muted)]">{bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</p>
                <p className="font-medium text-[var(--text-primary)]">{methodLabel(data.method)}</p>
              </div>
            </div>

            {data.note && (
              <div>
                <p className="text-[0.6rem] text-[var(--text-muted)] mb-0.5">{bn ? 'নোট' : 'Note'}</p>
                <p className="text-[var(--text-secondary)]">{data.note}</p>
              </div>
            )}

            <div className="h-px bg-[var(--border)]" />

            <div className="text-center pt-1">
              <p className="text-[0.6rem] text-[var(--text-muted)] mb-0.5">{bn ? 'পরিশোধিত পরিমাণ' : 'Amount Paid'}</p>
              <p className="text-2xl font-bold text-[var(--green)]">{fmt(data.amount)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{bn ? 'বন্ধ' : 'Close'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
