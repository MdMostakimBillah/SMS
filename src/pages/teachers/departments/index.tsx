import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, AlertTriangle, Building2, Crown, Edit2, Trash2 } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useNavChain, useNavChainClearOnMount } from '@/hooks/useNavChain'
import { useNavPath } from '@/hooks/useNavPath'
import { usePermission } from '@/hooks/usePermission'
import { useAuth } from '@/contexts/AuthContext'
import { departmentsApi } from '@/lib/api'
import { isLocalComputerMode } from '@/lib/storageMode'
import { serverDepartmentToDepartment, apiErrorMessage } from '@/lib/teacherMappers'
import type { Department } from '@/pages/teachers/types'

export default function DepartmentsPage() {
  const navigate = useNavigate()
  const nav = useNavPath()
  const isBn = useBn()
  const {
    departments, legacyDepartments, subjects, teachers,
    upsertServerDepartment, removeServerDepartment,
    serverSynced, syncing, syncError, syncFromServer,
  } = useTeacherStore(
    useShallow((s) => ({
      departments: s.departments,
      legacyDepartments: s.legacyDepartments,
      subjects: s.subjects,
      teachers: s.teachers,
      upsertServerDepartment: s.upsertServerDepartment,
      removeServerDepartment: s.removeServerDepartment,
      serverSynced: s.serverSynced,
      syncing: s.syncing,
      syncError: s.syncError,
      syncFromServer: s.syncFromServer,
    }))
  )
  const { isMobile } = useWindowSize()
  const { canCreate } = usePermission()
  const { user } = useAuth()
  /** Phase 7 RBAC policy: writes are school_admin/hr_admin only — super_admin is read-only. */
  const canWriteDepartments = user?.role !== 'super_admin'

  const { popFromChain, getChain } = useNavChain()
  useNavChainClearOnMount()

  const [showAdd, setShowAdd] = useState(false)
  const [editD, setEditD] = useState<Department | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  const [newHead, setNewHead] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [delError, setDelError] = useState('')
  useScrollLock(showAdd || editD !== null || delConfirm !== null)

  // Clear nav chain if user navigated directly (not via redirect button) and load server data
  useEffect(() => {
    void syncFromServer()
    const lastRedirect = sessionStorage.getItem('edutech_lastRedirect')
    const now = Date.now()
    if (!lastRedirect || now - Number(lastRedirect) > 30000) {
      localStorage.removeItem('edutech_navChain')
    }
  }, [syncFromServer])

  const getDeptTeacherCount = (id: string) => teachers.filter((t) => t.departmentId === id).length
  const getDeptSubjectCount = (id: string) => subjects.filter((s) => s.departmentId === id).length

  const resetForm = () => {
    setNewName('')
    setNewNameBn('')
    setNewHead('')
    setFormError('')
  }

  const handleAdd = async () => {
    if (!newName.trim() || saving) return
    setSaving(true)
    setFormError('')

    if (isLocalComputerMode()) {
      const localId = `loc-dept-${Date.now()}`
      const localDept: Department = {
        id: localId,
        name: newName.trim(),
        nameBn: newNameBn.trim(),
        head: newHead.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      upsertServerDepartment(localDept)
      resetForm()
      setShowAdd(false)
      setSaving(false)
      return
    }

    if (isLocalComputerMode()) {
      const localId = `DEP-${String(departments.length + 1).padStart(3, '0')}`
      const now = new Date().toISOString()
      upsertServerDepartment({
        id: localId,
        name: newName.trim(),
        nameBn: newNameBn.trim(),
        head: newHead.trim(),
        createdAt: now,
        updatedAt: now,
      })
      resetForm()
      setShowAdd(false)
      setSaving(false)
      return
    }

    try {
      // Server derives schoolId from session — never sent from here.
      const created = await departmentsApi.create({
        name: newName.trim(),
        nameBn: newNameBn.trim() || null,
        head: newHead.trim() || null,
      })
      upsertServerDepartment(serverDepartmentToDepartment(created))
      resetForm()
      setShowAdd(false)
    } catch (err) {
      setFormError(apiErrorMessage(err, isBn))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editD || !newName.trim() || saving) return
    setSaving(true)
    setFormError('')

    if (isLocalComputerMode()) {
      upsertServerDepartment({
        ...editD,
        name: newName.trim(),
        nameBn: newNameBn.trim(),
        head: newHead.trim(),
        updatedAt: new Date().toISOString(),
      })
      setEditD(null)
      resetForm()
      setSaving(false)
      return
    }

    try {
      const updated = await departmentsApi.update(editD.id, {
        name: newName.trim(),
        nameBn: newNameBn.trim() || null,
        head: newHead.trim() || null,
      })
      upsertServerDepartment(serverDepartmentToDepartment(updated))
      setEditD(null)
      resetForm()
    } catch (err) {
      setFormError(apiErrorMessage(err, isBn))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDelError('')
    if (isLocalComputerMode()) {
      removeServerDepartment(id)
      setDelConfirm(null)
      return
    }
    try {
      await departmentsApi.delete(id)
      removeServerDepartment(id)
      setDelConfirm(null)
    } catch (err) {
      // Keep the dialog open — never pretend the row was deleted when refused.
      setDelError(apiErrorMessage(err, isBn))
    }
  }

  const startEdit = (d: Department) => {
    setNewName(d.name)
    setNewNameBn(d.nameBn)
    setNewHead(d.head)
    setFormError('')
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
            {formError && (
              <div role="alert" className="flex items-center gap-2 bg-[var(--red-light)] border border-[var(--red)] rounded-[0.5rem] p-2.5 mt-3 text-[0.75rem] text-[var(--red)]">
                <AlertTriangle size={13} className="shrink-0" />
                {formError}
              </div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowAdd(false)
                  setEditD(null)
                  resetForm()
                }}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              {canCreate('teachers.departments') && canWriteDepartments && (
                <button
                  onClick={editD ? handleEdit : handleAdd}
                  disabled={saving}
                  className="py-2 px-[0.875rem] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-semibold cursor-pointer font-[inherit] disabled:cursor-default disabled:opacity-60"
                >
                  {saving ? '…' : editD ? (isBn ? 'সংরক্ষণ' : 'Save') : isBn ? 'যোগ করুন' : 'Add'}
                </button>
              )}
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
            {delError && (
              <div role="alert" className="flex items-center gap-2 bg-[var(--red-light)] border border-[var(--red)] rounded-[0.5rem] p-2.5 mb-3 text-[0.75rem] text-[var(--red)]">
                <AlertTriangle size={13} className="shrink-0" />
                {delError}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setDelConfirm(null); setDelError('') }}
                className="py-2 px-[0.875rem] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              {canCreate('teachers.departments') && canWriteDepartments && (
                <button
                  onClick={() => void handleDelete(delConfirm)}
                  className="py-2 px-[0.875rem] rounded-lg bg-[var(--red)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit]"
                >
                  {isBn ? 'মুছে ফেলুন' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
        <button
          onClick={() => {
            const prev = popFromChain()
            if (prev) {
              navigate(prev.path)
            } else {
              navigate(nav('/teachers'))
            }
          }}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          {/* Breadcrumb */}
          {(() => {
            const chain = getChain()
            if (chain.length === 0) return null
            return (
              <div className="flex items-center gap-1 text-[0.6875rem] text-[var(--text-muted)] mb-1 flex-wrap">
                {chain.map((item: { path: string; label: string }, idx: number) => (
                  <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-[var(--text-muted)]">›</span>}
                    <button
                      onClick={() => {
                        navigate(item.path)
                      }}
                      className="py-[0.1875rem] px-[0.5rem] rounded bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer text-[inherit] font-[inherit] transition-colors"
                    >
                      {item.label}
                    </button>
                  </span>
                ))}
                <span className="text-[var(--text-muted)]">›</span>
                <span className="py-[0.1875rem] px-[0.5rem] rounded bg-[var(--brand)] text-white font-medium">
                  {isBn ? 'বিভাগ' : 'Departments'}
                </span>
              </div>
            )
          })()}
          <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'বিভাগ ব্যবস্থাপনা' : 'Departments'}</h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn ? `মোট ${departments.length} টি বিভাগ` : `${departments.length} departments`}
          </p>
        </div>
        {canCreate('teachers.departments') && canWriteDepartments && (
          <button
            onClick={() => {
              resetForm()
              setShowAdd(true)
            }}
            className="flex items-center gap-[0.3125rem] py-2 px-[0.875rem] rounded-[0.5625rem] bg-[var(--amber-light)] border border-[var(--amber)] text-[var(--amber)] text-[0.8125rem] cursor-pointer font-[inherit] font-medium"
          >
            <Plus size={14} />
            {isBn ? 'নতুন যোগ করুন' : 'Add Department'}
          </button>
        )}
      </div>

      {!serverSynced ? (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] p-10 flex flex-col items-center gap-3 text-center">
          {syncError ? (
            <>
              <AlertTriangle size={26} className="text-[var(--red)]" />
              <div>
                <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'সার্ভার ডেটা লোড করা যায়নি' : 'Server data could not be loaded'}
                </div>
                <div className="text-[0.75rem] text-[var(--text-secondary)] mt-1">{syncError}</div>
              </div>
              <button
                onClick={() => void syncFromServer()}
                disabled={syncing}
                className="px-4 py-2 rounded-lg bg-[var(--brand)] border-0 text-white text-[0.8125rem] cursor-pointer disabled:cursor-default disabled:opacity-60"
              >
                {syncing ? (isBn ? 'লোড হচ্ছে...' : 'Loading…') : isBn ? 'আবার চেষ্টা করুন' : 'Retry'}
              </button>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--brand)] animate-spin" />
              <span className="text-[0.8125rem] text-[var(--text-muted)]">
                {isBn ? 'বিভাগ লোড হচ্ছে...' : 'Loading departments from server…'}
              </span>
            </>
          )}
        </div>
      ) : (
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
                        {canCreate('teachers.departments') && canWriteDepartments && (
                          <button
                            onClick={() => startEdit(d)}
                            title={isBn ? 'এডিট' : 'Edit'}
                            className="w-7 h-7 rounded-[0.4375rem] bg-[var(--amber-light)] border-none cursor-pointer flex items-center justify-center text-[var(--amber)]"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        {canCreate('teachers.departments') && canWriteDepartments && (
                          <button
                            onClick={() => { setDelError(''); setDelConfirm(d.id) }}
                            title={isBn ? 'মুছুন' : 'Delete'}
                            className="w-7 h-7 rounded-[0.4375rem] bg-[var(--red-light)] border-none cursor-pointer flex items-center justify-center text-[var(--red)]"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {legacyDepartments.length > 0 && (
        <div className="mt-3 bg-[var(--bg-primary)] border border-dashed border-[var(--amber)] rounded-[0.875rem] p-[0.875rem]">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTriangle size={14} className="text-[var(--amber)]" />
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
              {isBn
                ? `লোকাল বিভাগ (সার্ভারে মাইগ্রেট করা হয়নি) — ${legacyDepartments.length} টি`
                : `Legacy local departments (not migrated) — ${legacyDepartments.length}`}
            </span>
          </div>
          <p className="text-[0.75rem] text-[var(--text-secondary)] mt-1 mb-2">
            {isBn
              ? 'এগুলো সার্ভারে নেই; সংরক্ষিত ব্যাকআপ থেকে দেখানো হচ্ছে — সম্পাদনা/মুছে ফেলা যাবে না। বিষয় পুরোনো বিভাগের নাম দেখাতে এগুলো ব্যবহার করে।'
              : 'Not on the server; shown from the local backup — read-only. Used so older subjects can still resolve department names.'}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {legacyDepartments.map((d) => (
              <li
                key={d.id}
                className="font-mono text-[0.6875rem] text-[var(--amber)] bg-[var(--amber-light)] px-1.5 py-0.5 rounded"
              >
                {isBn ? d.nameBn || d.name : d.name}
                {d.head ? ` · ${d.head}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
