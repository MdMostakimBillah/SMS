import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Building2,
  Briefcase,
  Image,
  Info,
  Phone,
  Save,
  Search,
  Upload,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'

type Op = 'salary' | 'phone' | 'photo' | 'department' | 'designation' | 'inTime' | 'outTime'

const OPS: {
  id: Op
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  bn: string
  en: string
  color: string
  bg: string
}[] = [
  { id: 'photo', Icon: Image, bn: 'ছবি পরিবর্তন', en: 'Photo', color: 'var(--brand)', bg: 'var(--brand-light)' },
  { id: 'salary', Icon: DollarSign, bn: 'বেতন পরিবর্তন', en: 'Salary', color: 'var(--green)', bg: 'var(--green-light)' },
  { id: 'phone', Icon: Phone, bn: 'মোবাইল নম্বর', en: 'Phone', color: 'var(--teal)', bg: 'var(--teal-light)' },
  { id: 'department', Icon: Building2, bn: 'বিভাগ পরিবর্তন', en: 'Department', color: 'var(--amber)', bg: 'var(--amber-light)' },
  { id: 'designation', Icon: Briefcase, bn: 'পদবি পরিবর্তন', en: 'Designation', color: 'var(--purple)', bg: 'var(--purple-light)' },
  { id: 'inTime', Icon: Clock, bn: 'ইন টাইম', en: 'In Time', color: 'var(--teal)', bg: 'var(--teal-light)' },
  { id: 'outTime', Icon: Clock, bn: 'আউট টাইম', en: 'Out Time', color: 'var(--red)', bg: 'var(--red-light)' },
]

interface CellProps {
  value: string
  onChange: (v: string) => void
  type?: string
}
const EditCell = React.memo(function EditCell({ value, onChange, type = 'text' }: CellProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-[0.375rem] px-[0.5rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none"
      onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
    />
  )
})

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img'),
      url = URL.createObjectURL(file)
    img.onload = () => {
      const c = document.createElement('canvas'),
        max = 300,
        r = Math.min(max / img.width, max / img.height)
      c.width = Math.round(img.width * r)
      c.height = Math.round(img.height * r)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function TeacherBulkUpdatePage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { teachers, updateTeacher, departments, designations } = useTeacherStore()
  const isBn = language === 'bn'

  const [op, setOp] = useState<Op>('salary')
  const [search, setSearch] = useState('')
  const [fDept, setFDept] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [batchVal, setBatchVal] = useState('')
  const [rowEdits, setRowEdits] = useState<Record<string, string>>({})
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState(false)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const opInfo = OPS.find((x) => x.id === op)!

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

  const allSel = filtered.length > 0 && filtered.every((t) => selected.includes(t.id))
  const toggleAll = useCallback(() => setSelected(allSel ? [] : filtered.map((t) => t.id)), [allSel, filtered])
  const toggleOne = useCallback((id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])

  const updateRowEdit = useCallback((id: string, val: string) => setRowEdits((p) => ({ ...p, [id]: val })), [])

  const handlePhotoUpload = useCallback(
    async (id: string, file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(isBn ? 'ছবি ২ এমবি এর বেশি হতে পারবে না' : 'Image must be under 2MB')
        return
      }
      try {
        const base64 = await compressImage(file)
        setPhotoMap((p) => ({ ...p, [id]: base64 }))
      } catch {
        alert(isBn ? 'ছবি প্রসেস করতে সমস্যা হয়েছে' : 'Failed to process image')
      }
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

  const applyChanges = useCallback(() => {
    const ids = selected.length > 0 ? selected : filtered.map((t) => t.id)
    let count = 0
    ids.forEach((id) => {
      if (op === 'photo') {
        if (photoMap[id]) {
          updateTeacher(id, { photo: photoMap[id] })
          count++
        }
      } else {
        const val = rowEdits[id]
        if (val) {
          const update: Record<string, any> = {}
          if (op === 'salary') update[op] = Number(val) || 0
          else update[op] = val
          updateTeacher(id, update)
          count++
        }
      }
    })
    if (count === 0) {
      alert(isBn ? 'কোনো পরিবর্তন নেই' : 'No changes to apply')
      return
    }
    setApplied(true)
    setTimeout(() => setApplied(false), 3000)
  }, [selected, filtered, op, photoMap, rowEdits, updateTeacher, isBn])

  const clearAll = useCallback(() => {
    setRowEdits({})
    setPhotoMap({})
    setSelected([])
    setBatchVal('')
  }, [])

  const readyCount = op === 'photo' ? Object.keys(photoMap).length : Object.keys(rowEdits).filter((k) => rowEdits[k]).length

  const inpCls =
    'py-[0.4375rem] px-[0.5625rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] font-[inherit] cursor-pointer outline-none'

  return (
    <div>
      <div className="flex items-center gap-[0.625rem] mb-[1.125rem] flex-wrap">
        <button
          onClick={() => navigate('/teachers')}
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

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] py-[0.875rem] px-[1rem] mb-[0.75rem]">
        <div className="text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-[0.625rem]">
          ① {isBn ? 'কোন তথ্য পরিবর্তন করতে চান?' : 'What do you want to update?'}
        </div>
        <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} gap-[0.375rem]`}>
          {OPS.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setOp(o.id)
                setRowEdits({})
                setPhotoMap({})
                setBatchVal('')
              }}
              className={`flex flex-col items-center gap-[0.3125rem] py-[0.625rem] px-[0.375rem] rounded-[0.625rem] border-2 ${op === o.id ? 'border-[color:var(--o-color)]' : 'border-[var(--border)]'} ${op === o.id ? 'bg-[color:var(--o-bg)]' : 'bg-[var(--bg-secondary)]'} cursor-pointer font-[inherit] transition-all duration-150`}
              style={{ '--o-color': o.color, '--o-bg': o.bg } as React.CSSProperties}
            >
              <o.Icon size={18} style={{ color: op === o.id ? o.color : undefined }} />
              <span
                className={`text-[0.625rem] ${op === o.id ? 'font-semibold' : 'font-normal'} ${op === o.id ? 'text-[color:var(--o-color)]' : 'text-[var(--text-secondary)]'} text-center leading-[1.2]`}
              >
                {isBn ? o.bn : o.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-[240px_1fr]'} gap-[0.625rem] mb-[0.625rem]`}>
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.75rem] py-[0.75rem] px-[0.875rem]">
          <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-[0.5rem]">
            ② {isBn ? 'শিক্ষক ফিল্টার' : 'Filter Teachers'}
          </div>
          <div className="flex flex-col gap-[0.375rem]">
            <div className="flex items-center gap-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[0.5rem] py-[0.375rem] px-[0.5625rem]">
              <Search size={13} className="text-[var(--text-muted)] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
                className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)] font-[inherit]"
              />
            </div>
            <select value={fDept} onChange={(e) => setFDept(e.target.value)} className={inpCls}>
              <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="flex gap-[0.3125rem]">
              <button
                onClick={toggleAll}
                className={`flex-1 py-[0.375rem] px-[0.5rem] rounded-[0.4375rem] border ${allSel ? 'border-[var(--brand)]' : 'border-[var(--border)]'} ${allSel ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-secondary)]'} ${allSel ? 'text-[var(--brand)]' : 'text-[var(--text-secondary)]'} text-[0.6875rem] cursor-pointer font-[inherit] font-medium`}
              >
                {allSel ? (isBn ? 'সব বাদ' : 'Deselect All') : isBn ? 'সব বাছুন' : 'Select All'} ({filtered.length})
              </button>
              {selected.length > 0 && (
                <button
                  onClick={() => setSelected([])}
                  className="py-[0.375rem] px-[0.625rem] rounded-[0.4375rem] border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] text-[0.6875rem] cursor-pointer font-[inherit]"
                >
                  {selected.length} ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className="bg-[var(--bg-primary)] border border-[color:var(--op-color)] rounded-[0.75rem] py-[0.75rem] px-[0.875rem]"
          style={{ '--op-color': opInfo.color } as React.CSSProperties}
        >
          <div
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.0313rem] mb-[0.625rem]"
            style={{ color: opInfo.color } as React.CSSProperties}
          >
            ③ {isBn ? `এক সাথে ${opInfo.bn}` : `Batch ${opInfo.en}`}
            {selected.length > 0 && (
              <span className="ml-[0.375rem] font-bold">
                — {selected.length} {isBn ? 'জন' : 'selected'}
              </span>
            )}
          </div>

          {op === 'photo' ? (
            <div
              className="py-[0.625rem] px-[0.625rem] rounded-[0.5rem] text-[0.8125rem]"
              style={{ background: opInfo.bg, color: opInfo.color } as React.CSSProperties}
            >
              <Info size={14} className="inline mr-[0.3125rem] align-middle" />
              {isBn
                ? 'নিচের টেবিলে প্রতিটি শিক্ষকের পাশের বাটনে ক্লিক করে ছবি আপলোড করুন'
                : 'Click the upload button next to each teacher in the table below'}
            </div>
          ) : op === 'department' ? (
            <div className="flex gap-[0.5rem] items-center flex-wrap">
              <select
                value={batchVal}
                onChange={(e) => setBatchVal(e.target.value)}
                className={`${inpCls} flex-1`}
                style={{ color: batchVal ? 'var(--text-primary)' : 'var(--text-secondary)' } as React.CSSProperties}
              >
                <option value="">{isBn ? 'নতুন বিভাগ বেছে নিন' : 'Select new department'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {isBn ? d.nameBn : d.name}
                  </option>
                ))}
              </select>
              <button
                onClick={applyBatch}
                disabled={!batchVal || selected.length === 0}
                className={`flex items-center gap-[0.3125rem] py-[0.5rem] px-[0.875rem] rounded-[0.5rem] border-none text-white text-[0.75rem] font-medium font-[inherit] whitespace-nowrap ${!batchVal || selected.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ background: !batchVal || selected.length === 0 ? 'var(--border-2)' : opInfo.color } as React.CSSProperties}
              >
                <Zap size={13} />
                {isBn ? `${selected.length} জনে লাগান` : `Apply to ${selected.length}`}
              </button>
            </div>
          ) : op === 'designation' ? (
            <div className="flex gap-[0.5rem] items-center flex-wrap">
              <select
                value={batchVal}
                onChange={(e) => setBatchVal(e.target.value)}
                className={`${inpCls} flex-1`}
                style={{ color: batchVal ? 'var(--text-primary)' : 'var(--text-secondary)' } as React.CSSProperties}
              >
                <option value="">{isBn ? 'নতুন পদবি বেছে নিন' : 'Select new designation'}</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.name}>
                    {isBn ? d.nameBn : d.name}
                  </option>
                ))}
              </select>
              <button
                onClick={applyBatch}
                disabled={!batchVal || selected.length === 0}
                className={`flex items-center gap-[0.3125rem] py-[0.5rem] px-[0.875rem] rounded-[0.5rem] border-none text-white text-[0.75rem] font-medium font-[inherit] whitespace-nowrap ${!batchVal || selected.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ background: !batchVal || selected.length === 0 ? 'var(--border-2)' : opInfo.color } as React.CSSProperties}
              >
                <Zap size={13} />
                {isBn ? `${selected.length} জনে লাগান` : `Apply to ${selected.length}`}
              </button>
            </div>
          ) : (
            <div className="flex gap-[0.5rem] items-center flex-wrap">
              {op === 'inTime' || op === 'outTime' ? (
                <input
                  type="time"
                  value={batchVal}
                  onChange={(e) => setBatchVal(e.target.value)}
                  className={`${inpCls} flex-1 text-[var(--text-primary)]`}
                />
              ) : op === 'salary' ? (
                <input
                  type="number"
                  value={batchVal}
                  onChange={(e) => setBatchVal(e.target.value)}
                  placeholder={isBn ? 'নতুন বেতন লিখুন' : 'Enter new salary'}
                  className={`${inpCls} flex-1 text-[var(--text-primary)]`}
                />
              ) : (
                <input
                  value={batchVal}
                  onChange={(e) => setBatchVal(e.target.value)}
                  placeholder={isBn ? 'নতুন মান লিখুন' : 'Enter new value'}
                  className={`${inpCls} flex-1 text-[var(--text-primary)]`}
                />
              )}
              <button
                onClick={applyBatch}
                disabled={!batchVal || selected.length === 0}
                className={`flex items-center gap-[0.3125rem] py-[0.5rem] px-[0.875rem] rounded-[0.5rem] border-none text-white text-[0.75rem] font-medium font-[inherit] whitespace-nowrap ${!batchVal || selected.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ background: !batchVal || selected.length === 0 ? 'var(--border-2)' : opInfo.color } as React.CSSProperties}
              >
                <Zap size={13} />
                {isBn ? `${selected.length} জনে লাগান` : `Apply to ${selected.length}`}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden mb-[0.75rem]">
        <div className="py-[0.625rem] px-[0.875rem] border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-[0.5rem]">
            <div className="w-[0.5rem] h-[0.5rem] rounded-full" style={{ background: opInfo.color } as React.CSSProperties} />
            <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
              {filtered.length} {isBn ? 'জন শিক্ষক' : 'teachers'}
              {selected.length > 0 && (
                <span className="ml-[0.5rem]" style={{ color: opInfo.color } as React.CSSProperties}>
                  · {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </span>
          </div>
          {readyCount > 0 && (
            <span
              className="text-[0.75rem] py-[0.1875rem] px-[0.625rem] rounded-[0.375rem] font-medium"
              style={{ color: opInfo.color, background: opInfo.bg } as React.CSSProperties}
            >
              {readyCount} {isBn ? 'টি পরিবর্তন প্রস্তুত' : 'changes ready'}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="py-[0.625rem] px-[0.75rem] w-[2.25rem]">
                  <input
                    type="checkbox"
                    checked={allSel}
                    onChange={toggleAll}
                    className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[color:var(--op-color)]"
                    style={{ accentColor: opInfo.color } as React.CSSProperties}
                  />
                </th>
                <th className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-[2.25rem]">#</th>
                <th className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase min-w-[3.125rem]">
                  {isBn ? 'ছবি' : 'Photo'}
                </th>
                <th className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase min-w-[10.3125rem]">
                  {isBn ? 'নাম / আইডি' : 'Name / ID'}
                </th>
                <th className="py-[0.625rem] px-[0.5rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase min-w-[5rem]">
                  {isBn ? 'বর্তমান মান' : 'Current'}
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
                  <tr
                    key={t.id}
                    className="border-b-[0.0313rem] border-[var(--border)]"
                    style={{ background: selected.includes(t.id) ? `${opInfo.bg}44` : 'transparent' } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      if (!selected.includes(t.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      if (!selected.includes(t.id)) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td className="py-[0.5rem] px-[0.75rem]">
                      <input
                        type="checkbox"
                        checked={selected.includes(t.id)}
                        onChange={() => toggleOne(t.id)}
                        className="w-[0.8125rem] h-[0.8125rem] cursor-pointer"
                        style={{ accentColor: opInfo.color } as React.CSSProperties}
                      />
                    </td>
                    <td className="py-[0.5rem] px-[0.5rem] text-[var(--text-muted)] font-semibold text-[0.6875rem]">{i + 1}</td>
                    <td className="py-[0.4375rem] px-[0.5rem]">
                      <div className="w-[2rem] h-[2.375rem] rounded-[0.375rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                        {t.photo ? (
                          <img src={t.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[0.625rem] text-[var(--text-muted)]">
                            {t.nameEn
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-[0.5rem] px-[0.5rem]">
                      <div className="text-[0.75rem] font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[10rem]">
                        {isBn ? t.nameBn || t.nameEn : t.nameEn}
                      </div>
                      <div className="text-[0.625rem] text-[var(--brand)] font-mono">{t.id}</div>
                    </td>
                    <td className="py-[0.5rem] px-[0.5rem] text-[var(--text-secondary)] text-[0.6875rem]">
                      {op === 'salary'
                        ? `৳${t.salary.toLocaleString()}`
                        : op === 'phone'
                          ? t.phone
                          : op === 'photo'
                            ? t.photo
                              ? isBn
                                ? 'ছবি আছে'
                                : 'Has photo'
                              : isBn
                                ? 'নেই'
                                : 'None'
                            : op === 'department'
                              ? departments.find((d) => d.id === t.departmentId)?.name || t.departmentId
                              : op === 'designation'
                                ? t.designation || '—'
                                : op === 'inTime'
                                  ? t.inTime
                                  : op === 'outTime'
                                    ? t.outTime
                                    : '—'}
                    </td>
                    <td
                      className="py-[0.375rem] px-[0.5rem]"
                      style={{ background: selected.includes(t.id) ? `${opInfo.bg}33` : 'transparent' } as React.CSSProperties}
                    >
                      {op === 'photo' ? (
                        <label
                          className={`flex items-center gap-[0.3125rem] py-[0.375rem] px-[0.625rem] rounded-[0.4375rem] border text-[0.6875rem] cursor-pointer font-medium w-fit ${photoMap[t.id] ? 'border-[var(--green)] text-[var(--green)]' : ''}`}
                          style={
                            {
                              background: photoMap[t.id] ? 'var(--green-light)' : opInfo.bg,
                              borderColor: photoMap[t.id] ? 'var(--green)' : opInfo.color,
                              color: photoMap[t.id] ? 'var(--green)' : opInfo.color,
                            } as React.CSSProperties
                          }
                        >
                          {photoMap[t.id] ? <CheckCircle size={12} /> : <Upload size={12} />}
                          {photoMap[t.id] ? (isBn ? 'আপলোড হয়েছে ✓' : 'Uploaded ✓') : isBn ? 'ছবি বেছে নিন' : 'Choose Photo'}
                          <input
                            ref={(el) => {
                              fileRefs.current[t.id] = el
                            }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handlePhotoUpload(t.id, f)
                            }}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <EditCell
                          value={rowEdits[t.id] !== undefined ? rowEdits[t.id] : op === 'salary' ? String(t.salary) : (t as any)[op] || ''}
                          onChange={(v) => updateRowEdit(t.id, v)}
                          type={op === 'salary' ? 'number' : 'text'}
                        />
                      )}
                    </td>
                  </tr>
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
        <div className="flex gap-[0.5rem]">
          <button
            onClick={clearAll}
            className="py-[0.625rem] px-[1.125rem] rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
          >
            {isBn ? 'পরিষ্কার করুন' : 'Clear All'}
          </button>
          <button
            onClick={applyChanges}
            disabled={readyCount === 0}
            className={`flex items-center gap-[0.4375rem] py-[0.625rem] px-[1.375rem] rounded-[0.5625rem] border-none text-white text-[0.8125rem] font-semibold font-[inherit] ${readyCount === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            style={
              {
                background: readyCount === 0 ? 'var(--border-2)' : opInfo.color,
                boxShadow: readyCount > 0 ? `0 4px 14px ${opInfo.color}50` : 'none',
              } as React.CSSProperties
            }
          >
            {applied ? <Check size={15} /> : <Save size={15} />}
            {applied
              ? isBn
                ? '✓ সফলভাবে আপডেট হয়েছে!'
                : '✓ Updated Successfully!'
              : isBn
                ? `${readyCount} টি পরিবর্তন সেভ করুন`
                : `Save ${readyCount} Changes`}
          </button>
        </div>
      </div>
    </div>
  )
}
