import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, AlertTriangle, Briefcase, Edit2, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { Designation } from '@/pages/teachers/types'

export default function DesignationsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { designations, teachers, addDesignation, updateDesignation, deleteDesignation } = useTeacherStore()
  const { isMobile } = useWindowSize()
  const isBn = language === 'bn'

  const [showAdd, setShowAdd] = useState(false)
  const [editD, setEditD] = useState<Designation | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  useScrollLock(showAdd || editD !== null || delConfirm !== null)

  const getDesignationTeacherCount = (name: string) => teachers.filter((t) => t.designation === name).length

  const handleAdd = () => {
    if (!newName.trim()) return
    const now = new Date().toISOString().split('T')[0]
    addDesignation({
      id: `DES-${String(designations.length + 1).padStart(3, '0')}`,
      name: newName.trim(),
      nameBn: newNameBn.trim(),
      createdAt: now,
      updatedAt: now,
    })
    setNewName('')
    setNewNameBn('')
    setShowAdd(false)
  }

  const handleEdit = () => {
    if (!editD || !newName.trim()) return
    updateDesignation(editD.id, { name: newName.trim(), nameBn: newNameBn.trim() })
    setEditD(null)
    setNewName('')
    setNewNameBn('')
  }

  const startEdit = (d: Designation) => {
    setNewName(d.name)
    setNewNameBn(d.nameBn)
    setEditD(d)
  }

  const input =
    'w-full px-[11px] py-[9px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none'

  return (
    <div>
      {/* Add/Edit Modal */}
      {(showAdd || editD) && (
        <div className="fixed inset-0 bg-black/50 z-[600] flex items-center justify-center p-4 overflow-y-auto">
          <div className="modal-content bg-[var(--bg-primary)] rounded-[14px] max-w-[400px] w-full p-5 border border-[var(--border)]">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-[14px]">
              {editD ? (isBn ? 'পদবি এডিট করুন' : 'Edit Designation') : isBn ? 'নতুন পদবি' : 'New Designation'}
            </h3>
            <div className="flex flex-col gap-[10px]">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'নাম (ইংরেজি) *' : 'Name (English) *'}
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={input}
                  placeholder={isBn ? 'পদবির নাম' : 'Designation name'}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}
                </label>
                <input
                  value={newNameBn}
                  onChange={(e) => setNewNameBn(e.target.value)}
                  className={input}
                  placeholder={isBn ? 'বাংলায় নাম' : 'Bangla name'}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowAdd(false)
                  setEditD(null)
                  setNewName('')
                  setNewNameBn('')
                }}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={editD ? handleEdit : handleAdd}
                className="px-3.5 py-2 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-semibold cursor-pointer font-[inherit]"
              >
                {editD ? (isBn ? 'সংরক্ষণ' : 'Save') : isBn ? 'যোগ করুন' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {delConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[700] flex items-center justify-center p-4 overflow-y-auto">
          <div className="modal-content bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center gap-[10px] mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[var(--red)]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</h3>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-4">
              {isBn ? 'এই পদবিটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This designation will be permanently deleted.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDelConfirm(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  deleteDesignation(delConfirm)
                  setDelConfirm(null)
                }}
                className="px-3.5 py-2 rounded-lg bg-[var(--red)] border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit]"
              >
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-[10px] mb-4 flex-wrap">
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center gap-[5px] py-[7px] px-3 rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)]">{isBn ? 'পদবি ব্যবস্থাপনা' : 'Designations'}</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-[3px]">
            {isBn ? `মোট ${designations.length} টি পদবি` : `${designations.length} designations`}
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true)
            setNewName('')
            setNewNameBn('')
          }}
          className="flex items-center gap-[5px] px-3.5 py-2 rounded-[9px] bg-[var(--purple-light)] border border-[var(--purple)] text-[var(--purple)] text-[13px] cursor-pointer font-[inherit] font-medium"
        >
          <Plus size={14} />
          {isBn ? 'নতুন যোগ করুন' : 'Add Designation'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] overflow-hidden">
        <div className={`overflow-x-auto ${isMobile ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
          <table className="w-full border-collapse text-xs min-w-[500px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                {[
                  { l: '#', w: '50px', align: 'center' as const },
                  { l: isBn ? 'নাম (ইংরেজি)' : 'Name (EN)', align: 'left' as const },
                  { l: isBn ? 'নাম (বাংলা)' : 'Name (BN)', align: 'left' as const },
                  { l: isBn ? 'শিক্ষক' : 'Teachers', w: '80px', align: 'center' as const },
                  { l: isBn ? 'অ্যাকশন' : 'Action', w: '90px', align: 'center' as const },
                ].map((h) => (
                  <th
                    key={h.l}
                    className="px-3 py-[10px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap"
                    style={{ textAlign: h.align }}
                  >
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {designations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[var(--text-muted)]">
                    <Briefcase size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো পদবি পাওয়া যায়নি' : 'No designations found'}
                  </td>
                </tr>
              ) : (
                designations.map((d, i) => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--border)]"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-3 py-[10px] text-[var(--text-muted)] font-semibold text-[11px] text-center">{i + 1}</td>
                    <td className="px-3 py-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--purple-light)] flex items-center justify-center shrink-0">
                          <Briefcase size={16} className="text-[var(--purple)]" />
                        </div>
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-[10px] text-xs text-[var(--text-secondary)]">{d.nameBn || '—'}</td>
                    <td className="px-3 py-[10px] text-center">
                      <span className="text-xs font-semibold text-[var(--brand)] bg-[var(--brand-light)] py-[3px] px-2 rounded-md">
                        {getDesignationTeacherCount(d.name)}
                      </span>
                    </td>
                    <td className="px-3 py-[10px] text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => startEdit(d)}
                          title={isBn ? 'এডিট' : 'Edit'}
                          className="w-7 h-7 rounded-[7px] bg-[var(--amber-light)] border-none cursor-pointer flex items-center justify-center text-[var(--amber)]"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setDelConfirm(d.id)}
                          title={isBn ? 'মুছুন' : 'Delete'}
                          className="w-7 h-7 rounded-[7px] bg-[var(--red-light)] border-none cursor-pointer flex items-center justify-center text-[var(--red)]"
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
