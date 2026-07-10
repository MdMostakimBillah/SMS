import { useState, useMemo } from 'react'
import { Gift } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeWaiver } from '@/store/feeStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { createPortal } from 'react-dom'

interface Props {
  onSaved: (waiver: FeeWaiver) => void
  onClose: () => void
}

export function WaiverModal({ onSaved, onClose }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { structures } = useFeeStore()

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])
  const activeStructures = useMemo(() => structures.filter((s) => s.isActive), [structures])

  const [studentId, setStudentId] = useState('')
  const [feeStructureId, setFeeStructureId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [reasonBn, setReasonBn] = useState('')

  const selectedStudent = useMemo(() => activeStudents.find((s) => s.id === studentId), [activeStudents, studentId])
  const selectedFee = useMemo(() => activeStructures.find((s) => s.id === feeStructureId), [activeStructures, feeStructureId])

  const handleSave = () => {
    if (!studentId || !feeStructureId || !amount || !reason) return
    onSaved({
      id: `WVR-${Date.now()}`,
      studentId,
      feeStructureId,
      amount: Number(amount),
      reason,
      reasonBn: reasonBn || reason,
      approvedBy: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
    })
  }

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[28rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[var(--purple-light)] flex items-center justify-center">
            <Gift size={18} className="text-[var(--purple)]" />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'ফি ছাড় যোগ করুন' : 'Add Fee Waiver'}</h3>
            <p className="text-[0.7rem] text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থীর ফি থেকে ছাড় প্রদান করুন' : 'Grant a fee discount to a student'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'শিক্ষার্থী *' : 'Student *'}</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={`${selectCls} w-full text-xs`}>
              <option value="">{bn ? 'শিক্ষার্থী বাছাই' : 'Select student'}</option>
              {activeStudents.map((s) => <option key={s.id} value={s.id}>{s.nameEn} ({s.class} - {s.section})</option>)}
            </select>
          </div>

          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'ফি কাঠামো *' : 'Fee Structure *'}</label>
            <select value={feeStructureId} onChange={(e) => setFeeStructureId(e.target.value)} className={`${selectCls} w-full text-xs`}>
              <option value="">{bn ? 'ফি বাছাই' : 'Select fee'}</option>
              {activeStructures.map((s) => <option key={s.id} value={s.id}>{s.name} — {fmt(s.amount)} ({s.class})</option>)}
            </select>
          </div>

          {selectedStudent && selectedFee && (
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] text-xs space-y-1">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">{bn ? 'শিক্ষার্থী' : 'Student'}</span><span className="font-medium">{selectedStudent.nameEn}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">{bn ? 'ফি' : 'Fee'}</span><span className="font-medium">{selectedFee.name}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">{bn ? 'মোট ফি' : 'Total Fee'}</span><span className="font-medium">{fmt(selectedFee.amount)}</span></div>
            </div>
          )}

          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'ছাড়ের পরিমাণ (৳) *' : 'Waiver Amount (৳) *'}</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="1000" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'কারণ (EN) *' : 'Reason *'}</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="Scholarship" />
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'কারণ (BN)' : 'Reason (BN)'}</label>
              <input value={reasonBn} onChange={(e) => setReasonBn(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="বৃত্তি" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{bn ? 'বাতিল' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!studentId || !feeStructureId || !amount || !reason} className={`${btnPrimary} disabled:opacity-50`}>{bn ? 'সংরক্ষণ' : 'Save'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
