import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  DollarSign,
  Building2,
  Briefcase,
  Image,
  Phone,
  Save,
  AlertTriangle,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useNavPath } from '@/hooks/useNavPath'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import { useAuth } from '@/contexts/AuthContext'
import { teachersApi, type TeacherData } from '@/lib/api'
import { isLocalComputerMode } from '@/lib/storageMode'
import { serverTeacherToTeacher, apiErrorMessage } from '@/lib/teacherMappers'
import type { Teacher } from '../types'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { compressImageWithinLimit, imageTooLargeMessage } from '@/lib/imageUpload'
import { usePermission } from '@/hooks/usePermission'
import { TeacherRow, type BulkOp, type BulkOpMeta } from './components/TeacherRow'
import { BulkOpSelector } from './components/BulkOpSelector'
import { BulkFilterAndBatchBar } from './components/BulkFilterAndBatchBar'

/** Bulk op ids -> server column names (`department` is stored as `departmentId`). */
const OP_FIELD: Record<BulkOp, keyof TeacherData> = {
  photo: 'photo',
  salary: 'salary',
  phone: 'phone',
  department: 'departmentId',
  designation: 'designation',
  inTime: 'inTime',
  outTime: 'outTime',
}

const OPS: BulkOpMeta[] = [
  { id: 'photo', Icon: Image, bn: 'ছবি পরিবর্তন', en: 'Photo', color: 'var(--brand)', bg: 'var(--brand-light)' },
  { id: 'salary', Icon: DollarSign, bn: 'বেতন পরিবর্তন', en: 'Salary', color: 'var(--green)', bg: 'var(--green-light)' },
  { id: 'phone', Icon: Phone, bn: 'মোবাইল নম্বর', en: 'Phone', color: 'var(--teal)', bg: 'var(--teal-light)' },
  { id: 'department', Icon: Building2, bn: 'বিভাগ পরিবর্তন', en: 'Department', color: 'var(--amber)', bg: 'var(--amber-light)' },
  { id: 'designation', Icon: Briefcase, bn: 'পদবি পরিবর্তন', en: 'Designation', color: 'var(--purple)', bg: 'var(--purple-light)' },
  { id: 'inTime', Icon: Clock, bn: 'ইন টাইম', en: 'In Time', color: 'var(--teal)', bg: 'var(--teal-light)' },
  { id: 'outTime', Icon: Clock, bn: 'আউট টাইম', en: 'Out Time', color: 'var(--red)', bg: 'var(--red-light)' },
]

export default function TeacherBulkUpdatePage() {
  const navigate = useNavigate()
  const nav = useNavPath()
  const isBn = useBn()
  const { isMobile } = useWindowSize()
  const { teachers, departments, designations, bulkUpdateTeachers, serverSynced, syncing, syncError, syncFromServer } = useTeacherStore(
    useShallow((s) => ({
      teachers: s.teachers,
      departments: s.departments,
      designations: s.designations,
      bulkUpdateTeachers: s.bulkUpdateTeachers,
      serverSynced: s.serverSynced,
      syncing: s.syncing,
      syncError: s.syncError,
      syncFromServer: s.syncFromServer,
    }))
  )
  const { canEdit } = usePermission()
  const { user } = useAuth()
  /** Phase 7 RBAC policy: writes are school_admin/hr_admin only — super_admin is read-only. */
  const canWriteTeachers = user?.role !== 'super_admin'

  const departmentMap = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments])

  const [op, setOp] = useState<BulkOp>('salary')
  const [search, setSearch] = useState('')
  const [fDept, setFDept] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [batchVal, setBatchVal] = useState('')
  const [rowEdits, setRowEdits] = useState<Record<string, string>>({})
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    void syncFromServer()
  }, [syncFromServer])

  const opInfo = useMemo(() => OPS.find((x) => x.id === op)!, [op])

  const filtered = useMemo(
    () =>
      teachers.filter((t) => {
        if (fDept && t.departmentId !== fDept) return false
        if (search) {
          const q = search.toLowerCase()
          return t.nameEn.toLowerCase().includes(q) || t.nameBn.includes(search) || t.id.includes(search) || t.phone.includes(search)
        }
        return true
      }),
    [teachers, search, fDept]
  )

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const allSel = filtered.length > 0 && filtered.every((t) => selectedSet.has(t.id))

  const toggleAll = useCallback(() => {
    setSelected(allSel ? [] : filtered.map((t) => t.id))
  }, [allSel, filtered])

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return Array.from(next)
    })
  }, [])

  const updateRowEdit = useCallback((id: string, val: string) => {
    setRowEdits((p) => ({ ...p, [id]: val }))
  }, [])

  const handlePhotoUpload = useCallback(
    async (id: string, file: File) => {
      const result = await compressImageWithinLimit(file, { maxDim: 300 })
      if (!result.ok) {
        alert(
          result.reason === 'too-large'
            ? imageTooLargeMessage(isBn)
            : isBn
              ? 'ছবি প্রসেস করতে সমস্যা হয়েছে'
              : 'Failed to process image'
        )
        return
      }
      setPhotoMap((p) => ({ ...p, [id]: result.dataUrl }))
    },
    [isBn]
  )

  const applyBatch = useCallback(() => {
    if (!batchVal || selected.length === 0) return
    const edits: Record<string, string> = {}
    selected.forEach((id) => {
      edits[id] = batchVal
    })
    setRowEdits((p) => ({ ...p, ...edits }))
  }, [batchVal, selected])

  const applyChanges = useCallback(async () => {
    if (applying) return
    const changes: { id: string; payload: Partial<TeacherData> }[] = []

    if (op === 'photo') {
      for (const [id, photo] of Object.entries(photoMap)) {
        if (photo) changes.push({ id, payload: { photo } })
      }
    } else {
      const field = OP_FIELD[op]
      for (const [id, val] of Object.entries(rowEdits)) {
        if (val !== undefined && val !== '') {
          changes.push({
            id,
            payload: { [field]: op === 'salary' ? String(Number(val) || 0) : val } as Partial<TeacherData>,
          })
        }
      }
    }

    if (changes.length === 0) {
      alert(isBn ? 'কোনো পরিবর্তন নেই' : 'No changes to apply')
      return
    }

    if (isLocalComputerMode()) {
      setApplying(true)
      const updates = changes.map((c) => {
        const patch: any = { ...c.payload }
        if (patch.salary !== undefined) {
          patch.salary = Number(patch.salary) || 0
        }
        return { id: c.id, data: patch }
      })
      bulkUpdateTeachers(updates)
      setRowEdits({})
      setPhotoMap({})
      setBatchVal('')
      setSelected([])
      setApplied(true)
      setApplying(false)
      setTimeout(() => setApplied(false), 3000)
      return
    }

    // In cloud mode: update server in controlled concurrent batches
    setApplying(true)
    setApplyError('')
    let done = 0
    try {
      const BATCH_CONCURRENCY = 5
      const serverUpdated: Array<{ id: string; data: Partial<Teacher> }> = []
      for (let i = 0; i < changes.length; i += BATCH_CONCURRENCY) {
        const chunk = changes.slice(i, i + BATCH_CONCURRENCY)
        const chunkResults = await Promise.all(
          chunk.map(async (c) => {
            const updated = await teachersApi.update(c.id, c.payload)
            done++
            const mapped = serverTeacherToTeacher(updated)
            return { id: mapped.id, data: mapped }
          })
        )
        serverUpdated.push(...chunkResults)
      }
      bulkUpdateTeachers(serverUpdated)
      setRowEdits({})
      setPhotoMap({})
      setBatchVal('')
      setSelected([])
      setApplied(true)
      setTimeout(() => setApplied(false), 3000)
    } catch (err) {
      setApplyError(
        `${apiErrorMessage(err, isBn)}${done > 0 ? ` (${done}/${changes.length} ${isBn ? 'সফল' : 'saved'})` : ''}`
      )
    } finally {
      setApplying(false)
    }
  }, [applying, op, photoMap, rowEdits, bulkUpdateTeachers, isBn])

  const clearAll = useCallback(() => {
    setRowEdits({})
    setPhotoMap({})
    setSelected([])
    setBatchVal('')
  }, [])

  const handleSelectOp = useCallback((newOp: BulkOp) => {
    setOp(newOp)
    setRowEdits({})
    setPhotoMap({})
    setBatchVal('')
  }, [])

  const readyCount = op === 'photo' ? Object.keys(photoMap).length : Object.keys(rowEdits).filter((k) => rowEdits[k]).length

  if (!serverSynced) {
    return (
      <div>
        <div className="flex items-center gap-[0.625rem] mb-[1.125rem] flex-wrap">
          <button
            onClick={() => navigate(nav('/teachers'))}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.75rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
          >
            <ArrowLeft size={14} />
            {isBn ? 'ফিরে যান' : 'Back'}
          </button>
          <div>
            <h1 className={`${isMobile ? 'text-[1.125rem]' : 'text-[1.375rem]'} font-semibold text-[var(--text-primary)]`}>
              {isBn ? 'বাল্ক আপডেট শিক্ষক' : 'Bulk Update Teachers'}
            </h1>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
              {isBn ? 'একসাথে অনেক শিক্ষকের তথ্য পরিবর্তন করুন' : 'Update multiple teachers at once'}
            </p>
          </div>
        </div>
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
                {isBn ? 'শিক্ষক ডেটা লোড হচ্ছে...' : 'Loading teachers from server…'}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-[0.625rem] mb-[1.125rem] flex-wrap">
        <button
          onClick={() => navigate(nav('/teachers'))}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.75rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className={`${isMobile ? 'text-[1.125rem]' : 'text-[1.375rem]'} font-semibold text-[var(--text-primary)]`}>
            {isBn ? 'বাল্ক আপডেট শিক্ষক' : 'Bulk Update Teachers'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn ? 'একসাথে অনেক শিক্ষকের তথ্য পরিবর্তন করুন' : 'Update multiple teachers at once'}
          </p>
        </div>
      </div>

      <BulkOpSelector
        ops={OPS}
        selectedOp={op}
        onSelectOp={handleSelectOp}
        isBn={isBn}
        isMobile={isMobile}
      />

      <BulkFilterAndBatchBar
        isMobile={isMobile}
        isBn={isBn}
        op={op}
        opInfo={opInfo}
        search={search}
        onSearchChange={setSearch}
        fDept={fDept}
        onFDeptChange={setFDept}
        departments={departments}
        designations={designations}
        selectedCount={selected.length}
        filteredCount={filtered.length}
        allSel={allSel}
        onToggleAll={toggleAll}
        onClearSelection={() => setSelected([])}
        batchVal={batchVal}
        onBatchValChange={setBatchVal}
        onApplyBatch={applyBatch}
        canEdit={Boolean(canEdit('teachers.bulk-update') && canWriteTeachers)}
      />

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden mb-[0.75rem]">
        <div className="py-[0.625rem] px-[0.875rem] border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-[0.5rem]">
            <div className="w-[0.5rem] h-[0.5rem] rounded-full" style={{ background: opInfo.color } as React.CSSProperties} />
            <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
              {filtered.length} {isBn ? 'জন শিক্ষক' : 'teachers'}
            </span>
            {selected.length > 0 && (
              <span className="text-[0.75rem] text-[var(--text-muted)]">
                · {selected.length} {isBn ? 'জন নির্বাচিত' : 'selected'}
              </span>
            )}
          </div>
          <div className="text-[0.75rem] text-[var(--text-muted)]">
            {readyCount > 0 && (
              <span className="font-semibold text-[var(--green)]">
                {readyCount} {isBn ? 'টি পরিবর্তন প্রস্তুত' : 'ready to save'}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[30rem] overflow-y-auto">
          <table className="w-full border-collapse text-[0.8125rem]">
            <thead className="sticky top-0 bg-[var(--bg-secondary)] z-10">
              <tr className="border-b border-[var(--border)]">
                <th className="py-[0.625rem] px-[0.75rem] text-left w-[2.25rem]">
                  <ModernCheckbox
                    checked={allSel}
                    onChange={toggleAll}
                    color={opInfo.color}
                    size="xs"
                  />
                </th>
                <th className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-[2.5rem]">#</th>
                <th className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-[3rem]">
                  {isBn ? 'ছবি' : 'Photo'}
                </th>
                <th className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase min-w-[9.375rem]">
                  {isBn ? 'শিক্ষক' : 'Teacher'}
                </th>
                <th className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase min-w-[7.5rem]">
                  {isBn ? 'বর্তমান তথ্য' : 'Current Value'}
                </th>
                <th
                  className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold uppercase min-w-[12.5rem]"
                  style={{ color: opInfo.color, background: `${opInfo.bg}55` } as React.CSSProperties}
                >
                  ✏️ {isBn ? opInfo.bn : opInfo.en}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-[1.875rem] text-center text-[var(--text-muted)]">
                    {isBn ? 'কোনো শিক্ষক পাওয়া যায়নি' : 'No teachers found'}
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <TeacherRow
                    key={t.id}
                    teacher={t}
                    index={i}
                    op={op}
                    opInfo={opInfo}
                    isSelected={selectedSet.has(t.id)}
                    isBn={isBn}
                    departmentName={departmentMap.get(t.departmentId)?.name}
                    departments={departments}
                    designations={designations}
                    editValue={rowEdits[t.id]}
                    photoMapVal={photoMap[t.id]}
                    onToggle={toggleOne}
                    onEdit={updateRowEdit}
                    onPhotoUpload={handlePhotoUpload}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-[0.625rem]">
        <div className="text-[0.75rem] text-[var(--text-muted)]">
          {readyCount > 0
            ? `${readyCount} ${isBn ? 'টি পরিবর্তন সেভের জন্য প্রস্তুত' : 'changes ready to save'}`
            : isBn
              ? 'কোনো পরিবর্তন নেই — উপরে তথ্য দিন'
              : 'No changes yet — add values above'}
        </div>
        {applyError && (
          <div role="alert" className="flex items-center gap-2 bg-[var(--red-light)] border border-[var(--red)] rounded-[0.5rem] p-2.5 text-[0.75rem] text-[var(--red)] mb-2">
            <AlertTriangle size={13} className="shrink-0" />
            {applyError}
          </div>
        )}
        <div className="flex gap-[0.5rem]">
          <button
            onClick={clearAll}
            className="py-[0.625rem] px-[1.125rem] rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
          >
            {isBn ? 'পরিষ্কার করুন' : 'Clear All'}
          </button>
          {canEdit('teachers.bulk-update') && canWriteTeachers && (
            <button
              onClick={() => void applyChanges()}
              disabled={readyCount === 0 || applying}
              className={`flex items-center gap-[0.4375rem] py-[0.625rem] px-[1.375rem] rounded-[0.5625rem] border-none text-white text-[0.8125rem] font-semibold font-[inherit] ${readyCount === 0 || applying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              style={
                {
                  background: readyCount === 0 || applying ? 'var(--border-2)' : opInfo.color,
                  boxShadow: readyCount > 0 && !applying ? `0 4px 14px ${opInfo.color}50` : 'none',
                } as React.CSSProperties
              }
            >
              {applied ? <Check size={15} /> : <Save size={15} />}
              {applying
                ? isBn
                  ? 'আপডেট হচ্ছে...'
                  : 'Updating…'
                : applied
                  ? isBn
                    ? '✓ সফলভাবে আপডেট হয়েছে!'
                    : '✓ Updated Successfully!'
                  : isBn
                    ? `${readyCount} টি পরিবর্তন সেভ করুন`
                    : `Save ${readyCount} Changes`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
