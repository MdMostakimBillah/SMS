import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, AlertTriangle, BookOpen, Filter, X, Edit2, Trash2 } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { Subject } from '@/pages/teachers/types'

const sel =
  'py-[0.4375rem] px-[0.5625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-[inherit] cursor-pointer outline-none'

export default function SubjectsPage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { subjects, departments, teachers, addSubject, updateSubject, deleteSubject } = useTeacherStore()
  const { isMobile } = useWindowSize()

  const [fDept, setFDept] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editS, setEditS] = useState<Subject | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  const [newDeptIds, setNewDeptIds] = useState<string[]>([])
  useScrollLock(showAdd || editS !== null || delConfirm !== null)

  const filtered = useMemo(
    () => (fDept ? subjects.filter((s) => s.departmentIds?.includes(fDept) || s.departmentId === fDept) : subjects),
    [subjects, fDept]
  )

  const getDeptName = (id: string) => {
    const d = departments.find((x) => x.id === id)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }

  const getSubjectTeacherCount = (id: string) => teachers.filter((t) => t.subjectIds.includes(id)).length

  const handleAdd = () => {
    if (!newName.trim() || newDeptIds.length === 0) return
    const now = new Date().toISOString().split('T')[0]
    addSubject({
      id: `SUB-${String(subjects.length + 1).padStart(3, '0')}`,
      name: newName.trim(),
      nameBn: newNameBn.trim(),
      departmentId: newDeptIds[0],
      departmentIds: newDeptIds,
      createdAt: now,
      updatedAt: now,
    })
    setNewName('')
    setNewNameBn('')
    setNewDeptIds([])
    setShowAdd(false)
  }

  const handleEdit = () => {
    if (!editS || !newName.trim() || newDeptIds.length === 0) return
    updateSubject(editS.id, { name: newName.trim(), nameBn: newNameBn.trim(), departmentId: newDeptIds[0], departmentIds: newDeptIds })
    setEditS(null)
    setNewName('')
    setNewNameBn('')
    setNewDeptIds([])
  }

  const startEdit = (s: Subject) => {
    setNewName(s.name)
    setNewNameBn(s.nameBn)
    setNewDeptIds(s.departmentIds || [s.departmentId])
    setEditS(s)
  }

  const toggleDept = (deptId: string) => {
    setNewDeptIds((prev) => (prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]))
  }

  const input =
    'w-full py-[0.5625rem] px-[0.6875rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none'

  return (
    <div>
      {/* Add/Edit Modal */}
      {(showAdd || editS) && (
        <div className="fixed top-0 left-0 right-0 h-[100dvh] bg-black/50 z-[600] flex items-center justify-center p-4 overflow-y-auto">
          <div className="modal-content bg-[var(--bg-primary)] rounded-[0.875rem] max-w-[25rem] w-full p-5 border border-[var(--border)]">
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-[0.875rem]">
              {editS ? (isBn ? 'বিষয় এডিট করুন' : 'Edit Subject') : isBn ? 'নতুন বিষয়' : 'New Subject'}
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
                  placeholder={isBn ? 'বিষয়ের নাম' : 'Subject name'}
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
                  {isBn ? 'বিভাগ * (একাধিক নির্বাচন করতে পারেন)' : 'Departments * (select multiple)'}
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg min-h-[2.5rem]">
                  {departments.map((d) => (
                    <label
                      key={d.id}
                      className={`flex items-center gap-[0.3125rem] cursor-pointer py-1 px-2 rounded-md text-xs transition-all ${newDeptIds.includes(d.id) ? 'bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)]'}`}
                    >
                      <input
                        type="checkbox"
                        checked={newDeptIds.includes(d.id)}
                        onChange={() => toggleDept(d.id)}
                        className="w-[0.875rem] h-[0.875rem] accent-[var(--brand)] cursor-pointer"
                      />
                      {isBn ? d.nameBn : d.name}
                    </label>
                  ))}
                </div>
                {newDeptIds.length === 0 && (
                  <div className="text-[0.625rem] text-[var(--red)] mt-1">
                    {isBn ? 'কমপক্ষে একটি বিভাগ নির্বাচন করুন' : 'Select at least one department'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowAdd(false)
                  setEditS(null)
                  setNewName('')
                  setNewNameBn('')
                  setNewDeptIds([])
                }}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={editS ? handleEdit : handleAdd}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-semibold cursor-pointer font-[inherit]"
              >
                {editS ? (isBn ? 'সংরক্ষণ' : 'Save') : isBn ? 'যোগ করুন' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {delConfirm && (
        <div className="fixed top-0 left-0 right-0 h-[100dvh] bg-black/50 z-[700] flex items-center justify-center p-4 overflow-y-auto">
          <div className="modal-content bg-[var(--bg-primary)] rounded-[0.875rem] max-w-[23.75rem] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center gap-[0.625rem] mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[var(--red)]" />
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</h3>
            </div>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mb-4">
              {isBn ? 'এই বিষয়টি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This subject will be permanently deleted.'}
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
                  deleteSubject(delConfirm)
                  setDelConfirm(null)
                }}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--red)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit]"
              >
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'বিষয় ব্যবস্থাপনা' : 'Subjects'}</h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn ? `মোট ${filtered.length} টি বিষয়` : `${filtered.length} subjects`}
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true)
            setNewName('')
            setNewNameBn('')
            setNewDeptIds([])
          }}
          className="flex items-center gap-[0.3125rem] py-2 px-[0.875rem] rounded-[0.5625rem] bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.8125rem] cursor-pointer font-[inherit] font-medium"
        >
          <Plus size={14} />
          {isBn ? 'নতুন যোগ করুন' : 'Add Subject'}
        </button>
      </div>

      {/* Filter */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl py-3 px-[0.875rem] mb-[0.625rem]">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--text-muted)]" />
          <select value={fDept} onChange={(e) => setFDept(e.target.value)} className={sel}>
            <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {isBn ? d.nameBn : d.name}
              </option>
            ))}
          </select>
          {fDept && (
            <button
              onClick={() => setFDept('')}
              className="flex items-center gap-1 py-1 px-[0.625rem] rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.6875rem] cursor-pointer font-[inherit]"
            >
              <X size={11} />
              {isBn ? 'ফিল্টার সরান' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
        <div className={`overflow-x-auto ${isMobile ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
          <table className="w-full border-collapse text-xs min-w-[31.25rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                {[
                  { l: '#', w: '3.125rem', align: 'center' as const },
                  { l: isBn ? 'নাম (ইংরেজি)' : 'Name (EN)', align: 'left' as const },
                  { l: isBn ? 'নাম (বাংলা)' : 'Name (BN)', align: 'left' as const },
                  { l: isBn ? 'বিভাগ' : 'Department', align: 'left' as const },
                  { l: isBn ? 'শিক্ষক' : 'Teachers', w: '5rem', align: 'center' as const },
                  { l: isBn ? 'অ্যাকশন' : 'Action', w: '5.625rem', align: 'center' as const },
                ].map((h) => (
                  <th
                    key={h.l}
                    className={`py-3 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap text-${h.align}`}
                  >
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[var(--text-muted)]">
                    <BookOpen size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো বিষয় পাওয়া যায়নি' : 'No subjects found'}
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                    <td className="py-3 px-3 text-[var(--text-muted)] font-semibold text-[0.6875rem] text-center">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--green-light)] flex items-center justify-center shrink-0">
                          <BookOpen size={16} className="text-[var(--green)]" />
                        </div>
                        <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-[var(--text-secondary)]">{s.nameBn || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.departmentIds || [s.departmentId]).map((deptId) => (
                          <span
                            key={deptId}
                            className="text-[0.625rem] font-medium py-[0.125rem] px-[0.375rem] rounded bg-[var(--amber-light)] text-[var(--amber)]"
                          >
                            {getDeptName(deptId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs font-semibold text-[var(--brand)] bg-[var(--brand-light)] py-[0.1875rem] px-2 rounded-md">
                        {getSubjectTeacherCount(s.id)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => startEdit(s)}
                          title={isBn ? 'এডিট' : 'Edit'}
                          className="w-7 h-7 rounded-[0.4375rem] bg-[var(--amber-light)] border-none cursor-pointer flex items-center justify-center text-[var(--amber)]"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDelConfirm(s.id)}
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
