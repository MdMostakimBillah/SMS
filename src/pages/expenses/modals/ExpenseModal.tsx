import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Receipt, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useAuth } from '@/contexts/AuthContext'
import { getAuditUser } from '@/lib/auditUser'
import { useExpenseStore, expenseEntryId, PAYMENT_METHODS, getMonthName, type ExpenseEntry } from '@/store/expenseStore'
import { useClassStore } from '@/store/classStore'

const inputCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10'
const selectCls = `${inputCls} appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_0.75rem_center] bg-[size:12px]`
const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'

interface Props {
  existing?: ExpenseEntry | null
  onSaved: () => void
  onClose: () => void
}

export function ExpenseModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { user } = useAuth()
  const { categories, addExpense, updateExpense } = useExpenseStore()
  const currentSession = useClassStore((s) => s.institution.currentSession) || '2025-26'

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories])

  const [categoryId, setCategoryId] = useState(existing?.categoryId || '')
  const [amount, setAmount] = useState(existing?.amount?.toString() || '')
  const [date, setDate] = useState(existing?.date || new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(existing?.description || '')
  const [descriptionBn, setDescriptionBn] = useState(existing?.descriptionBn || '')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mobile'>(existing?.paymentMethod || 'cash')
  const [isRecurring, setIsRecurring] = useState(existing?.isRecurring || false)
  const [recurringMonths, setRecurringMonths] = useState<number[]>(existing?.recurringMonths || [])
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const toggleMonth = (m: number) => {
    setRecurringMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!categoryId) e.categoryId = true
    if (!amount || Number(amount) <= 0) e.amount = true
    if (!date) e.date = true
    if (isRecurring && recurringMonths.length === 0) e.months = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString()
    if (existing) {
      updateExpense(existing.id, {
        categoryId,
        amount: Number(amount),
        date,
        description: description.trim(),
        descriptionBn: descriptionBn.trim(),
        paymentMethod,
        isRecurring,
        recurringMonths: isRecurring ? recurringMonths : [],
      })
    } else {
      addExpense({
        id: expenseEntryId(),
        categoryId,
        amount: Number(amount),
        date,
        description: description.trim(),
        descriptionBn: descriptionBn.trim(),
        paymentMethod,
        isRecurring,
        recurringMonths: isRecurring ? recurringMonths : [],
        academicYear: currentSession,
        createdBy: getAuditUser(user),
        createdAt: now,
        isActive: true,
      })
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-primary)] rounded-2xl w-[520px] max-w-[90vw] max-h-[85vh] flex flex-col shadow-2xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)18', color: 'var(--brand)' }}>
              <Receipt size={15} />
            </div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)] m-0">
              {existing ? (bn ? 'খরচ সম্পাদনা' : 'Edit Expense') : (bn ? 'নতুন খরচ' : 'New Expense')}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>{bn ? 'ক্যাটাগরি' : 'Category'}</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${selectCls} ${errors.categoryId ? 'border-[var(--red)]' : ''}`}>
              <option value="">{bn ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select category'}</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'পরিমাণ (৳)' : 'Amount (৳)'}</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} placeholder="0" className={`${inputCls} ${errors.amount ? 'border-[var(--red)]' : ''}`} />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'তারিখ' : 'Date'}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} ${errors.date ? 'border-[var(--red)]' : ''}`} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{bn ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'বিবরণ (বাংলা)' : 'Description (Bengali)'}</label>
            <textarea value={descriptionBn} onChange={(e) => setDescriptionBn(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>{bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button key={pm.value} type="button" onClick={() => setPaymentMethod(pm.value)}
                  className={`flex-1 h-[2.625rem] rounded-xl border text-[12px] font-medium cursor-pointer transition-all ${paymentMethod === pm.value ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'}`}>
                  {bn ? pm.labelBn : pm.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>{bn ? 'পুনরাবৃত্তি' : 'Recurring'}</label>
            <button type="button" onClick={() => setIsRecurring(!isRecurring)}
              className={`flex items-center gap-2 h-9 px-3 rounded-xl border text-[12px] font-medium cursor-pointer transition-all ${isRecurring ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'}`}>
              <span className={`w-8 h-[18px] rounded-full transition-colors relative ${isRecurring ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}>
                <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${isRecurring ? 'left-[14px]' : 'left-[2px]'}`} />
              </span>
              {isRecurring ? (bn ? 'পুনরাবৃত্ত' : 'Recurring') : (bn ? 'এককালীন' : 'One-time')}
            </button>
          </div>

          {isRecurring && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls} style={{ marginBottom: 0 }}>{bn ? 'মাস নির্বাচন' : 'Select Months'}</label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setRecurringMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])} className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--border)] transition-colors">
                    {bn ? 'সব' : 'All'}
                  </button>
                  <button type="button" onClick={() => setRecurringMonths([])} className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--border)] transition-colors">
                    {bn ? 'পরিষ্কার' : 'Clear'}
                  </button>
                </div>
              </div>
              <div className={`grid grid-cols-4 gap-1.5 p-2.5 rounded-xl border ${errors.months ? 'border-[var(--red)]' : 'border-[var(--border)]'} bg-[var(--bg-primary)]`}>
                {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                  <button key={m} type="button" onClick={() => toggleMonth(m)}
                    className={`flex items-center justify-center gap-1 h-8 rounded-lg border text-[10px] font-medium cursor-pointer transition-all ${
                      recurringMonths.includes(m)
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                        : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'
                    }`}>
                    {getMonthName(m, bn)}
                  </button>
                ))}
              </div>
              {errors.months && <p className="text-[10px] text-[var(--red)] mt-1">{bn ? 'অন্তত একটি মাস নির্বাচন করুন' : 'Select at least one month'}</p>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[12px] font-medium cursor-pointer hover:bg-[var(--border)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} className="h-9 px-5 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity">
            {existing ? (bn ? 'সংরক্ষণ' : 'Save') : (bn ? 'তৈরি করুন' : 'Create')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
