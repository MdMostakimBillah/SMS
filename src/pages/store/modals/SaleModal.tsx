import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreSaleItem } from '@/store/storeStore'
import { useClassStore, extractClassNumber } from '@/store/classStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { inputCls, labelCls, modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { btnPrimary, btnSecondary } from '@/lib/styles'
import { toBnNum } from '@/lib/i18n'

interface Props {
  onSaved: () => void
  onClose: () => void
  initialStudentId?: string
}

export function SaleModal({ onSaved, onClose, initialStudentId }: Props) {
  const bn = useBn()
  const classes = useClassStore((s) => s.classes)
  const students = useAdmissionStore((s) => s.students)
  const products = useStoreStore((s) => s.products)
  const addSale = useStoreStore((s) => s.addSale)

  const [selectedClass, setSelectedClass] = useState('')
  const [studentId, setStudentId] = useState(initialStudentId || '')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'mobile' | 'other'>('cash')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<StoreSaleItem[]>([])

  const classOptions = classes.map((c) => ({ name: c.name, num: extractClassNumber(c.name) }))

  const availableProducts = useMemo(() => {
    if (!selectedClass) return []
    return products.filter((p) => p.isActive && p.classNames.includes(selectedClass) && p.stock > 0)
  }, [selectedClass, products])

  const classStudents = useMemo(() => {
    if (!selectedClass) return []
    return students.filter((s) => s.status === 'approved' && s.active && extractClassNumber(s.class) === selectedClass)
  }, [selectedClass, students])

  const selectedStudent = classStudents.find((s) => s.id === studentId)

  const updateItemQty = (productIdx: number, qty: number) => {
    const product = availableProducts[productIdx]
    if (!product) return
    const q = Math.max(0, Math.min(qty, product.stock))
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (q === 0) return prev.filter((i) => i.productId !== product.id)
      if (existing) return prev.map((i) => (i.productId === product.id ? { ...i, qty: q, subtotal: q * i.unitPrice } : i))
      return [...prev, { productId: product.id, productName: product.name, productNameBn: product.nameBn, qty: q, unitPrice: product.price, subtotal: q * product.price }]
    })
  }

  const total = items.reduce((sum, i) => sum + i.subtotal, 0)

  const handleSave = () => {
    if (!selectedStudent || items.length === 0) return
    addSale({
      id: `SS-${Date.now()}`,
      items,
      total,
      paymentMethod,
      soldToId: selectedStudent.id,
      soldToName: selectedStudent.nameEn,
      soldToNameBn: selectedStudent.nameBn,
      soldToClass: selectedStudent.class,
      soldToSection: selectedStudent.section,
      note: note.trim(),
      createdBy: 'Admin',
      createdAt: new Date().toISOString(),
    })
    onSaved()
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[36rem] max-h-[85vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
          {bn ? 'নতুন বিক্রয়' : 'New Sale'}
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'শ্রেণি নির্বাচন করুন *' : 'Select Class *'}</label>
              <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setStudentId(''); setItems([]) }} className={inputCls}>
                <option value="">{bn ? 'নির্বাচন করুন' : 'Select'}</option>
                {classOptions.map((c) => (
                  <option key={c.num} value={c.num}>{bn ? `শ্রেণি ${c.num}` : `Class ${c.num}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{bn ? 'ছাত্র/ছাত্রী *' : 'Student *'}</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls} disabled={!selectedClass}>
                <option value="">{bn ? 'নির্বাচন করুন' : 'Select'}</option>
                {classStudents.map((s) => (
                  <option key={s.id} value={s.id}>{bn ? s.nameBn : s.nameEn} ({s.roll})</option>
                ))}
              </select>
            </div>
          </div>

          {selectedStudent && (
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.8125rem]">
              <span className="font-medium">{bn ? selectedStudent.nameBn : selectedStudent.nameEn}</span>
              <span className="text-[var(--text-secondary)] ml-2">
                {bn ? selectedStudent.class : selectedStudent.class} — {bn ? 'শিফট' : 'Shift'}: {selectedStudent.section}
              </span>
            </div>
          )}

          {selectedClass && (
            <div>
              <label className={labelCls}>{bn ? 'পণ্য নির্বাচন করুন' : 'Select Products'}</label>
              {availableProducts.length === 0 ? (
                <p className="text-[0.8125rem] text-[var(--text-secondary)] py-3 text-center">
                  {bn ? 'এই শ্রেণির জন্য কোনো পণ্য পাওয়া যায়নি' : 'No products available for this class'}
                </p>
              ) : (
                <div className="space-y-2 mt-1">
                  {availableProducts.map((p) => {
                    const item = items.find((i) => i.productId === p.id)
                    const qty = item?.qty || 0
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.8125rem] font-medium truncate">{bn ? p.nameBn : p.name}</div>
                          <div className="text-[0.75rem] text-[var(--text-secondary)]">
                            {bn ? `৳${toBnNum(p.price)}` : `৳${p.price}`} — {bn ? `স্টক: ${toBnNum(p.stock)}` : `Stock: ${p.stock}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateItemQty(availableProducts.indexOf(p), qty - 1)} className="w-7 h-7 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--border)]">-</button>
                          <span className="w-8 text-center text-[0.8125rem] font-medium">{bn ? toBnNum(qty) : qty}</span>
                          <button onClick={() => updateItemQty(availableProducts.indexOf(p), qty + 1)} className="w-7 h-7 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--border)]">+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {items.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="flex justify-between text-[0.8125rem] mb-1">
                <span className="text-[var(--text-secondary)]">{bn ? 'মোট' : 'Total'}</span>
                <span className="font-semibold">{bn ? `৳${toBnNum(total)}` : `৳${total}`}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)} className={inputCls}>
                <option value="cash">{bn ? 'নগদ' : 'Cash'}</option>
                <option value="bank">{bn ? 'ব্যাংক' : 'Bank'}</option>
                <option value="mobile">{bn ? 'মোবাইল' : 'Mobile'}</option>
                <option value="other">{bn ? 'অন্যান্য' : 'Other'}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{bn ? 'নোট' : 'Note'}</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className={`${btnSecondary} text-[0.8125rem]`}>
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} disabled={!selectedStudent || items.length === 0} className={`${btnPrimary} disabled:opacity-50 text-[0.8125rem]`}>
            {bn ? 'বিক্রয় সম্পন্ন' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
