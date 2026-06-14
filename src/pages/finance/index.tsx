import { useState, useMemo } from 'react'
import { Plus, Trash2, Edit2, DollarSign, AlertTriangle, Users, Search, CheckCircle, Clock, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeStructure, FeeDue } from '@/store/feeStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { createPortal } from 'react-dom'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'

export default function FeeManagementPage() {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  const { structures, payments, addStructure, updateStructure, deleteStructure, addPayment, calculateDues } = useFeeStore()

  const [tab, setTab] = useState<'structures' | 'dues' | 'inactive'>('structures')
  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editStruct, setEditStruct] = useState<FeeStructure | null>(null)
  const [collectPayment, setCollectPayment] = useState<FeeDue | null>(null)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (fClass ? sectionsMap[fClass] || [] : []), [fClass, sectionsMap])

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])
  const inactiveStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active === false), [students])

  const dues = useMemo(() => calculateDues(activeStudents, fClass || undefined, fSection || undefined), [activeStudents, fClass, fSection, structures, payments])
  const inactiveDues = useMemo(() => calculateDues(inactiveStudents, fClass || undefined, fSection || undefined, true), [inactiveStudents, fClass, fSection, structures, payments])

  const filteredDues = useMemo(() => {
    if (!search) return tab === 'inactive' ? inactiveDues : dues
    const q = search.toLowerCase()
    const list = tab === 'inactive' ? inactiveDues : dues
    return list.filter((d) => d.studentName.toLowerCase().includes(q) || d.roll.includes(q) || d.feeName.toLowerCase().includes(q))
  }, [dues, inactiveDues, search, tab])

  const totalDue = useMemo(() => (tab === 'inactive' ? inactiveDues : dues).reduce((sum, d) => sum + d.dueAmount, 0), [dues, inactiveDues, tab])
  const totalOverdue = useMemo(() => (tab === 'inactive' ? inactiveDues : dues).filter((d) => d.isOverdue).reduce((sum, d) => sum + d.dueAmount, 0), [dues, inactiveDues, tab])

  const fmt = (n: number) => `৳${n.toLocaleString()}`
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'ফি ব্যবস্থাপনা' : 'Fee Management'}</h1>
          <p className="text-[0.75rem] text-[var(--text-secondary)]">{structures.length} {bn ? 'টি ফি কাঠামো' : 'fee structures'} · {payments.length} {bn ? 'টি পেমেন্ট' : 'payments'}</p>
        </div>
        {tab === 'structures' && (
          <button onClick={() => setShowAddModal(true)} className={btnPrimary}>
            <Plus size={14} /> {bn ? 'ফি যোগ করুন' : 'Add Fee'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
        {([
          ['structures', bn ? 'ফি কাঠামো' : 'Fee Structures', structures.length],
          ['dues', bn ? 'বকেয়' : 'Due Fees', dues.length],
          ['inactive', bn ? 'নিষ্ক্রিয় বকেয়' : 'Inactive Dues', inactiveDues.length],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${tab === key ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab !== 'structures' && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: bn ? 'মোট বকেয়' : 'Total Due', value: fmt(totalDue), color: 'var(--brand)', icon: <DollarSign size={16} /> },
            { label: bn ? 'বকেয় শিক্ষার্থী' : 'Students with Dues', value: String(new Set((tab === 'inactive' ? inactiveDues : dues).map((d) => d.studentId)).size), color: 'var(--amber)', icon: <Users size={16} /> },
            { label: bn ? 'অতিক্রান্ত' : 'Overdue', value: fmt(totalOverdue), color: 'var(--red)', icon: <AlertTriangle size={16} /> },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</span>
                <span className="text-[0.7rem] text-[var(--text-secondary)]">{s.label}</span>
              </div>
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {tab !== 'structures' && (
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={bn ? 'শিক্ষার্থী খুঁজুন...' : 'Search students...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} w-full pl-9 h-8 text-xs`}
            />
          </div>
          <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection('') }} className={`${selectCls} h-8 text-xs w-auto`}>
            <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {fClass && (
            <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={`${selectCls} h-8 text-xs w-auto`}>
              <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
              {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Tab: Fee Structures */}
      {tab === 'structures' && (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
          {structures.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              {bn ? 'এখনো কোনো ফি কাঠামো তৈরি হয়নি' : 'No fee structures created yet'}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'নাম' : 'Name'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শেষ তারিখ' : 'Due Date'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'অবস্থা' : 'Status'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কাজ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s) => {
                  return (
                    <tr key={s.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">
                        <p className="font-medium text-[var(--text-primary)]">{s.name}</p>
                        <p className="text-[0.65rem] text-[var(--text-muted)]">{s.description}</p>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{s.class}{s.section ? ` - ${s.section}` : ''}</td>
                      <td className="px-3 py-2 font-semibold text-[var(--text-primary)]">{fmt(s.amount)}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{s.dueDate}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                          {s.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditStruct(s)} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--amber-light)] text-[var(--amber)] border-0 cursor-pointer">
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => deleteStructure(s.id)} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Due Fees */}
      {(tab === 'dues' || tab === 'inactive') && (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
          {filteredDues.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              {tab === 'inactive' ? (bn ? 'নিষ্ক্রিয় শিক্ষার্থীদের কোনো বকেয় নেই' : 'No dues for inactive students') : (bn ? 'কোনো বকেয় নেই' : 'No dues found')}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ফি' : 'Fee'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'মোট' : 'Total'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিশোধিত' : 'Paid'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'বকেয়' : 'Due'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শেষ তারিখ' : 'Due Date'}</th>
                  {tab === 'inactive' && <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কারণ' : 'Reason'}</th>}
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কাজ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map((d, i) => (
                  <tr key={`${d.studentId}-${d.feeStructureId}-${i}`} className="border-t border-[var(--border)]" style={{ opacity: d.isActive ? 1 : 0.7 }}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-[var(--text-primary)]">{d.studentName}</p>
                      <p className="text-[0.65rem] text-[var(--text-muted)]">Roll: {d.roll}</p>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{d.class} - {d.section}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{d.feeName}</td>
                    <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{fmt(d.totalAmount)}</td>
                    <td className="px-3 py-2 text-right text-[var(--green)]">{fmt(d.paidAmount)}</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: d.isOverdue ? 'var(--red)' : 'var(--amber)' }}>{fmt(d.dueAmount)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[0.65rem] font-medium ${d.isOverdue ? 'text-[var(--red)]' : 'text-[var(--text-secondary)]'}`}>
                        {d.isOverdue && <Clock size={10} className="inline mr-0.5" />}{d.dueDate}
                      </span>
                    </td>
                    {tab === 'inactive' && (
                      <td className="px-3 py-2">
                        <span className="text-[0.65rem] text-[var(--red)] bg-[var(--red-light)] px-1.5 py-0.5 rounded">{d.inactiveReason || '-'}</span>
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      {d.isActive && (
                        <button onClick={() => setCollectPayment(d)} className="text-[0.65rem] font-medium px-2 py-1 rounded bg-[var(--green-light)] text-[var(--green)] border-0 cursor-pointer">
                          {bn ? 'পরিশোধ' : 'Collect'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add/Edit Fee Structure Modal */}
      {(showAddModal || editStruct) && (
        <FeeStructureModal
          isBn={bn}
          classes={classOptions}
          sectionsMap={sectionsMap}
          existing={editStruct}
          onSaved={(data) => {
            if (editStruct) {
              updateStructure(editStruct.id, data)
            } else {
              addStructure({
                ...data,
                id: `FEE-${Date.now()}`,
                academicYear: institution.currentSession,
                isActive: true,
                createdAt: today,
              } as FeeStructure)
            }
            setShowAddModal(false)
            setEditStruct(null)
          }}
          onClose={() => { setShowAddModal(false); setEditStruct(null) }}
        />
      )}

      {/* Collect Payment Modal */}
      {collectPayment && (
        <CollectPaymentModal
          isBn={bn}
          due={collectPayment}
          onCollected={(amount, method, note) => {
            addPayment({
              id: `PAY-${Date.now()}`,
              studentId: collectPayment.studentId,
              feeStructureId: collectPayment.feeStructureId,
              amount,
              paidAt: today,
              method,
              reference: '',
              note,
              collectedBy: 'admin',
              createdAt: today,
            })
            setCollectPayment(null)
          }}
          onClose={() => setCollectPayment(null)}
        />
      )}
    </div>
  )
}

function FeeStructureModal({ isBn, classes, sectionsMap, existing, onSaved, onClose }: {
  isBn: boolean
  classes: string[]
  sectionsMap: Record<string, string[]>
  existing: FeeStructure | null
  onSaved: (data: Partial<FeeStructure>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(existing?.name || '')
  const [nameBn, setNameBn] = useState(existing?.nameBn || '')
  const [cls, setCls] = useState(existing?.class || '')
  const [section, setSection] = useState(existing?.section || '')
  const [amount, setAmount] = useState(String(existing?.amount || ''))
  const [dueDate, setDueDate] = useState(existing?.dueDate || new Date().toISOString().split('T')[0])
  const [desc, setDesc] = useState(existing?.description || '')
  const descBn = existing?.descriptionBn || ''

  const sectionOptions = useMemo(() => (cls ? sectionsMap[cls] || [] : []), [cls, sectionsMap])

  const handleSave = () => {
    if (!name || !cls || !amount || !dueDate) return
    onSaved({ name, nameBn: nameBn || name, class: cls, section: section || undefined, amount: Number(amount), dueDate, description: desc, descriptionBn: descBn || desc })
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[30rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{existing ? (isBn ? 'ফি সম্পাদনা' : 'Edit Fee') : (isBn ? 'নতুন ফি কাঠামো' : 'New Fee Structure')}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] cursor-pointer"><X size={14} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'নাম (EN) *' : 'Name *'}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="Tuition Fee" />
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'নাম (BN)' : 'Name (BN)'}</label>
              <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="টিউশন ফি" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'শ্রেণি *' : 'Class *'}</label>
              <select value={cls} onChange={(e) => { setCls(e.target.value); setSection('') }} className={`${selectCls} w-full text-xs`}>
                <option value="">{isBn ? 'শ্রেণি বাছাই' : 'Select class'}</option>
                {classes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'সেকশন' : 'Section'}</label>
              <select value={section} onChange={(e) => setSection(e.target.value)} className={`${selectCls} w-full text-xs`}>
                <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
                {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
              <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="5000" />
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'শেষ তারিখ *' : 'Due Date *'}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${inputCls} w-full text-xs`} />
            </div>
          </div>
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'বিবরণ' : 'Description'}</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder={isBn ? 'ফি সম্পর্কে বিবরণ' : 'Description of the fee'} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{isBn ? 'বাতিল' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!name || !cls || !amount} className={`${btnPrimary} disabled:opacity-50`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function CollectPaymentModal({ isBn, due, onCollected, onClose }: {
  isBn: boolean
  due: FeeDue
  onCollected: (amount: number, method: 'cash' | 'bank' | 'mobile' | 'other', note: string) => void
  onClose: () => void
}) {
  const [amount, setAmount] = useState(String(due.dueAmount))
  const [method, setMethod] = useState<'cash' | 'bank' | 'mobile' | 'other'>('cash')
  const [note, setNote] = useState('')

  const handleCollect = () => {
    const a = Number(amount)
    if (a <= 0) return
    onCollected(a, method, note)
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[26rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[var(--green-light)] flex items-center justify-center"><CheckCircle size={18} className="text-[var(--green)]" /></div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'পেমেন্ট সংগ্রহ' : 'Collect Payment'}</h3>
            <p className="text-[0.7rem] text-[var(--text-secondary)]">{due.studentName} — {due.feeName}</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] mb-4 text-xs">
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{isBn ? 'মোট ফি' : 'Total Fee'}</span><span className="font-medium">{`৳${due.totalAmount.toLocaleString()}`}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{isBn ? 'পরিশোধিত' : 'Paid'}</span><span className="font-medium text-[var(--green)]">{`৳${due.paidAmount.toLocaleString()}`}</span></div>
          <div className="flex justify-between border-t border-[var(--border)] mt-1 pt-1"><span className="text-[var(--text-secondary)] font-semibold">{isBn ? 'বকেয়' : 'Due'}</span><span className="font-bold text-[var(--red)]">{`৳${due.dueAmount.toLocaleString()}`}</span></div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
            <input type="number" min="1" max={due.dueAmount} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full text-xs`} />
          </div>
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</label>
            <div className="flex gap-2">
              {(['cash', 'bank', 'mobile', 'other'] as const).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`flex-1 py-1.5 rounded-lg text-[0.7rem] font-medium border cursor-pointer transition-all ${method === m ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                  {m === 'cash' ? (isBn ? 'নগদ' : 'Cash') : m === 'bank' ? (isBn ? 'ব্যাংক' : 'Bank') : m === 'mobile' ? (isBn ? 'মোবাইল' : 'Mobile') : isBn ? 'অন্যান্য' : 'Other'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{isBn ? 'নোট' : 'Note'}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder={isBn ? 'পেমেন্ট নোট...' : 'Payment note...'} />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{isBn ? 'বাতিল' : 'Cancel'}</button>
          <button onClick={handleCollect} disabled={!amount || Number(amount) <= 0} className={`${btnPrimary} disabled:opacity-50`}>{isBn ? 'পরিশোধ নিন' : 'Collect'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
