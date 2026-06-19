import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, AlertTriangle, Building2, Crown, Edit2, Trash2 } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { Department } from '@/pages/teachers/types'

export default function DepartmentsPage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { departments, subjects, teachers, addDepartment, updateDepartment, deleteDepartment } = useTeacherStore()
  const { isMobile } = useWindowSize()

  const [showAdd, setShowAdd] = useState(false)
  const [editD, setEditD] = useState<Department | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  const [newHead, setNewHead] = useState('')
  useScrollLock(showAdd || editD !== null || delConfirm !== null)

  const getDeptTeacherCount = (id: string) => teachers.filter((t) => t.departmentId === id).length
  const getDeptSubjectCount = (id: string) => subjects.filter((s) => s.departmentId === id).length

  const handleAdd = () => {
    if (!newName.trim()) return
    const now = new Date().toISOString().split('T')[0]
    addDepartment({
      id: `DEPT-${String(departments.length + 1).padStart(3, '0')}`,
      name: newName.trim(),
      nameBn: newNameBn.trim(),
      head: newHead.trim(),
      createdAt: now,
      updatedAt: now,
    })
    setNewName('')
    setNewNameBn('')
    setNewHead('')
    setShowAdd(false)
  }

  const handleEdit = () => {
    if (!editD || !newName.trim()) return
    updateDepartment(editD.id, { name: newName.trim(), nameBn: newNameBn.trim(), head: newHead.trim() })
    setEditD(null)
    setNewName('')
    setNewNameBn('')
    setNewHead('')
  }

  const startEdit = (d: Department) => {
    setNewName(d.name)
    setNewNameBn(d.nameBn)
    setNewHead(d.head)
    setEditD(d)
  }

  const input =
    'w-full py-[0.5625rem] px-[0.6875rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none'

  return (
    <div>
      {(showAdd || editD) && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box" style={{ maxWidth: '25rem' }}>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-[0.875rem]">
              {editD ? (isBn ? 'বিভাগ এডিট করুন' : 'Edit Department') : isBn ? 'নতুন বিভাগ' : 'New Department'}
            </h3>
            <div className="flex flex-col gap-[0.625rem]">
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'নাম (ইংরেজি) *' : 'Name (English) *'}
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={input}
                  placeholder={isBn ? 'বিভাগের নাম' : 'Department name'}
                />
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}
                </label>
                <input
                  value={newNameBn}
                  onChange={(e) => setNewNameBn(e.target.value)}
                  className={input}
                  placeholder={isBn ? 'বাংলায় নাম' : 'Bangla name'}
                />
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'বিভাগ প্রধান' : 'Head of Department'}
                </label>
                <select value={newHead} onChange={(e) => setNewHead(e.target.value)} className={input}>
                  <option value="">{isBn ? 'নির্বাচন করুন' : 'Select Head'}</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.nameEn}>
                      {t.nameEn} ({t.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowAdd(false)
                  setEditD(null)
                  setNewName('')
                  setNewNameBn('')
                  setNewHead('')
                }}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={editD ? handleEdit : handleAdd}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-semibold cursor-pointer font-[inherit]"
              >
                {editD ? (isBn ? 'সংরক্ষণ' : 'Save') : isBn ? 'যোগ করুন' : 'Add'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {delConfirm && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
            <div className="flex items-center gap-[0.625rem] mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[var(--red)]" />
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</h3>
            </div>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mb-4">
              {isBn ? 'এই বিভাগটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This department will be permanently deleted.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDelConfirm(null)}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  deleteDepartment(delConfirm)
                  setDelConfirm(null)
                }}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--red)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit]"
              >
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
        <button
          onClick={() => {
            const prev = localStorage.getItem('edutech_prevPath')
            navigate(prev || '/teachers')
            localStorage.removeItem('edutech_prevPath')
          }}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          {/* Breadcrumb */}
          {localStorage.getItem('edutech_prevPath') && (
            <div className="flex items-center gap-1 text-[0.6875rem] text-[var(--text-muted)] mb-1">
              <button
                onClick={() => {
                  const prev = localStorage.getItem('edutech_prevPath')
                  navigate(prev || '/teachers')
                  localStorage.removeItem('edutech_prevPath')
                }}
                className="py-[0.1875rem] px-[0.5rem] rounded bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer text-[inherit] font-[inherit] transition-colors"
              >
                {localStorage.getItem('edutech_prevPath') === '/teachers/add'
                  ? (isBn ? 'শিক্ষক যোগ' : 'Add Teacher')
                  : (isBn ? 'বিষয়' : 'Subjects')}
              </button>
              <span className="text-[var(--text-muted)]">›</span>
              <span className="py-[0.1875rem] px-[0.5rem] rounded bg-[var(--brand)] text-white font-medium">
                {isBn ? 'বিভাগ' : 'Departments'}
              </span>
            </div>
          )}
          <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'বিভাগ ব্যবস্থাপনা' : 'Departments'}</h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn ? `মোট ${departments.length} টি বিভাগ` : `${departments.length} departments`}
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true)
            setNewName('')
            setNewNameBn('')
            setNewHead('')
          }}
          className="flex items-center gap-[0.3125rem] py-2 px-[0.875rem] rounded-[0.5625rem] bg-[var(--amber-light)] border border-[var(--amber)] text-[var(--amber)] text-[0.8125rem] cursor-pointer font-[inherit] font-medium"
        >
          <Plus size={14} />
          {isBn ? 'নতুন যোগ করুন' : 'Add Department'}
        </button>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
        <div className={`overflow-x-auto ${isMobile ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
          <table className={`w-full border-collapse text-xs ${isMobile ? 'min-w-[37.5rem]' : ''}`}>
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                {[
                  { l: '#', w: '3.125rem', align: 'center' as const },
                  { l: isBn ? 'নাম (ইংরেজি)' : 'Name (EN)', align: 'left' as const },
                  { l: isBn ? 'নাম (বাংলা)' : 'Name (BN)', align: 'left' as const },
                  { l: isBn ? 'বিভাগ প্রধান' : 'Head of Dept', align: 'left' as const },
                  { l: isBn ? 'শিক্ষক' : 'Teachers', w: '5rem', align: 'center' as const },
                  { l: isBn ? 'বিষয়' : 'Subjects', w: '5rem', align: 'center' as const },
                  { l: isBn ? 'অ্যাকশন' : 'Action', w: '5.625rem', align: 'center' as const },
                ].map((h) => (
                  <th
                    key={h.l}
                    className={`py-[0.625rem] px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.025rem] whitespace-nowrap ${h.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[var(--text-muted)]">
                    <Building2 size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No departments found'}
                  </td>
                </tr>
              ) : (
                departments.map((d, i) => (
                  <tr
                    key={d.id}
                    className="border-b-[0.0313rem] border-[var(--border)]"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-[0.625rem] px-3 text-[var(--text-muted)] font-semibold text-[0.6875rem] text-center">{i + 1}</td>
                    <td className="py-[0.625rem] px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--amber-light)] flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-[var(--amber)]" />
                        </div>
                        <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{d.name}</span>
                      </div>
                    </td>
                    <td className="py-[0.625rem] px-3 text-xs text-[var(--text-secondary)]">{d.nameBn || '—'}</td>
                    <td className="py-[0.625rem] px-3 text-xs text-[var(--text-secondary)]">
                      {d.head ? (
                        <div className="flex items-center gap-[0.3125rem]">
                          <Crown size={12} className="text-[var(--amber)]" />
                          {d.head}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-[0.625rem] px-3 text-center">
                      <span className="text-xs font-semibold text-[var(--brand)] bg-[var(--brand-light)] py-[0.1875rem] px-2 rounded-md">
                        {getDeptTeacherCount(d.id)}
                      </span>
                    </td>
                    <td className="py-[0.625rem] px-3 text-center">
                      <span className="text-xs font-semibold text-[var(--green)] bg-[var(--green-light)] py-[0.1875rem] px-2 rounded-md">
                        {getDeptSubjectCount(d.id)}
                      </span>
                    </td>
                    <td className="py-[0.625rem] px-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => startEdit(d)}
                          title={isBn ? 'এডিট' : 'Edit'}
                          className="w-7 h-7 rounded-[0.4375rem] bg-[var(--amber-light)] border-none cursor-pointer flex items-center justify-center text-[var(--amber)]"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDelConfirm(d.id)}
                          title={isBn ? 'মুছুন' : 'Delete'}
                          className="w-7 h-7 rounded-[0.4375rem] bg-[var(--red-light)] border-none cursor-pointer flex items-center justify-center text-[var(--red)]"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
