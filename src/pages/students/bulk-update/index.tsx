import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  Droplets,
  Grid3X3,
  Hash,
  Image,
  Info,
  Save,
  School,
  Search,
  Star,
  Upload,
  User,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'

type Op = 'photo' | 'roll' | 'class' | 'section' | 'bloodGroup' | 'religion' | 'academicYear'

const OPS: {
  id: Op
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  bn: string
  en: string
  color: string
  bg: string
}[] = [
  { id: 'photo', Icon: Image, bn: 'ছবি আপলোড', en: 'Photo Upload', color: 'var(--brand)', bg: 'var(--brand-light)' },
  { id: 'roll', Icon: Hash, bn: 'রোল পরিবর্তন', en: 'Roll Number', color: 'var(--teal)', bg: 'var(--teal-light)' },
  { id: 'class', Icon: School, bn: 'শ্রেণি পরিবর্তন', en: 'Change Class', color: 'var(--amber)', bg: 'var(--amber-light)' },
  { id: 'section', Icon: Grid3X3, bn: 'সেকশন পরিবর্তন', en: 'Change Section', color: 'var(--purple)', bg: 'var(--purple-light)' },
  { id: 'bloodGroup', Icon: Droplets, bn: 'রক্তের গ্রুপ', en: 'Blood Group', color: 'var(--red)', bg: 'var(--red-light)' },
  { id: 'religion', Icon: Star, bn: 'ধর্ম পরিবর্তন', en: 'Change Religion', color: 'var(--green)', bg: 'var(--green-light)' },
  { id: 'academicYear', Icon: Calendar, bn: 'শিক্ষাবর্ষ', en: 'Academic Year', color: 'var(--teal)', bg: 'var(--teal-light)' },
]

const STATIC_OPTS: Record<string, string[]> = {
  bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  religion: ['Islam / ইসলাম', 'Hinduism / হিন্দু', 'Christianity / খ্রিস্টান', 'Buddhism / বৌদ্ধ', 'Other / অন্যান্য'],
  academicYear: ['2024-25', '2025-26', '2026-27'],
}

// ✅ OUTSIDE — prevents cell focus loss on re-render
interface CellProps {
  value: string
  onChange: (v: string) => void
  type?: string
  opts?: string[]
}
const EditCell = React.memo(function EditCell({ value, onChange, type = 'text', opts }: CellProps) {
  if (opts)
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer"
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none"
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

export default function BulkUpdatePage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const updateStudent = useAdmissionStore((s) => s.updateStudent)
  const allStudents = useAdmissionStore((s) => s.students)
  const classes = useClassStore((s) => s.classes)
  const institution = useClassStore((s) => s.institution)
  const isBn = language === 'bn'

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((cls) => cls.sections.forEach((s) => set.add(s.name)))
    return Array.from(set).sort()
  }, [classes])

  const currentSession = institution.currentSession
  const sessions = institution.sessions

  const [op, setOp] = useState<Op>('roll')
  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fSession, setFSession] = useState(currentSession)
  const [selected, setSelected] = useState<string[]>([])
  const [batchVal, setBatchVal] = useState('')
  const [rowEdits, setRowEdits] = useState<Record<string, string>>({})
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState(false)
  const [autoStart, setAutoStart] = useState(1)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    setFSession(currentSession)
    setFClass('')
    setFSection('')
    setSelected([])
  }, [currentSession])

  const opInfo = OPS.find((x) => x.id === op)!

  const students = useMemo(
    () => allStudents.filter((s) => s.academicYear === fSession),
    [allStudents, fSession]
  )

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (fClass && s.class !== fClass) return false
        if (fSection && s.section !== fSection) return false
        if (search) {
          const q = search.toLowerCase()
          return s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(search) || s.id.includes(search) || s.roll.includes(search)
        }
        return true
      }),
    [students, search, fClass, fSection]
  )

  const allSel = filtered.length > 0 && filtered.every((s) => selected.includes(s.id))
  const toggleAll = useCallback(() => setSelected(allSel ? [] : filtered.map((s) => s.id)), [allSel, filtered])
  const toggleOne = useCallback((id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])

  const updateRowEdit = useCallback((id: string, val: string) => setRowEdits((p) => ({ ...p, [id]: val })), [])

  const handlePhotoUpload = useCallback(
    async (id: string, file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(isBn ? 'ছবি ২ এমবি এর বেশি হতে পারবে না' : 'Photo must be under 2MB')
        return
      }

      try {
        const base64 = await compressImage(file)
        setPhotoMap((prev) => ({ ...prev, [id]: base64 }))
      } catch (error) {
        console.error('Image compression failed:', error)
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

  const applyAutoRoll = useCallback(() => {
    const ids = selected.length > 0 ? selected : filtered.map((s) => s.id)
    const edits: Record<string, string> = {}
    ids.forEach((id, i) => {
      edits[id] = String(autoStart + i)
    })
    setRowEdits((p) => ({ ...p, ...edits }))
  }, [selected, filtered, autoStart])

  const applyChanges = useCallback(() => {
    const ids = selected.length > 0 ? selected : filtered.map((s) => s.id)
    let count = 0
    ids.forEach((id) => {
      if (op === 'photo') {
        if (photoMap[id]) {
          updateStudent(id, { photo: photoMap[id] })
          count++
        }
      } else {
        const val = rowEdits[id]
        if (val) {
          updateStudent(id, { [op]: val })
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
  }, [selected, filtered, op, photoMap, rowEdits, updateStudent, isBn])

  const clearAll = useCallback(() => {
    setRowEdits({})
    setPhotoMap({})
    setSelected([])
    setBatchVal('')
  }, [])

  const readyCount = op === 'photo' ? Object.keys(photoMap).length : Object.keys(rowEdits).filter((k) => rowEdits[k]).length

  return (
    <div>
      <div className="flex items-center gap-[0.625rem] mb-[1.125rem] flex-wrap">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] flex-shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'বাল্ক আপডেট' : 'Bulk Update'}</h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn ? 'একসাথে অনেক ছাত্রের তথ্য পরিবর্তন করুন' : 'Update multiple students at once'}
          </p>
        </div>
      </div>

      {/* ① Operation selector */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] px-4 py-[0.875rem] mb-3">
        <div className="text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-[0.625rem]">
          ① {isBn ? 'কোন তথ্য পরিবর্তন করতে চান?' : 'What do you want to update?'}
        </div>
        <div className={`grid gap-[0.375rem] ${isMobile ? 'grid-cols-4' : 'grid-cols-7'}`}>
          {OPS.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setOp(o.id)
                setRowEdits({})
                setPhotoMap({})
                setBatchVal('')
              }}
              className={`flex flex-col items-center gap-[0.3125rem] py-[0.625rem] px-[0.375rem] rounded-[0.625rem] border-2 font-[inherit] transition-all ${op === o.id ? `border-[${o.color}] bg-[${o.bg}]` : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}
            >
              <o.Icon size={18} style={{ color: op === o.id ? o.color : undefined }} />
              <span
                className={`text-[0.625rem] text-center leading-[1.2] ${op === o.id ? `font-semibold text-[${o.color}]` : 'font-normal text-[var(--text-secondary)]'}`}
              >
                {isBn ? o.bn : o.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ② Filter + Batch apply row */}
      <div className={`grid gap-[0.625rem] mb-[0.625rem] ${isMobile ? 'grid-cols-1' : 'grid-cols-[240px_1fr]'}`}>
        {/* Filter */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-[0.875rem] py-3">
          <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            ② {isBn ? 'ছাত্র ফিল্টার' : 'Filter Students'}
          </div>
          <div className="flex flex-col gap-[0.375rem]">
            <div className="flex items-center gap-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[0.5rem] px-[0.5625rem] py-1.5">
              <Search size={13} className="text-[var(--text-muted)] flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
                className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)] font-[inherit]"
              />
            </div>
            <select
              value={fSession}
              onChange={(e) => {
                setFSession(e.target.value)
                setFClass('')
                setFSection('')
                setSelected([])
              }}
              className="px-[0.5625rem] py-[0.4375rem] rounded-[0.5rem] border border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] text-[0.75rem] font-[inherit] cursor-pointer outline-none font-medium"
            >
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s} {s === currentSession ? (isBn ? '(বর্তমান)' : '(Current)') : ''}
                </option>
              ))}
            </select>
            <select
              value={fClass}
              onChange={(e) => {
                setFClass(e.target.value)
                setFSection('')
              }}
              className="px-[0.5625rem] py-[0.4375rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] font-[inherit] cursor-pointer outline-none"
            >
              <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={fSection}
              onChange={(e) => setFSection(e.target.value)}
              className="px-[0.5625rem] py-[0.4375rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] font-[inherit] cursor-pointer outline-none"
            >
              <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
              {(fClass ? sectionsMap[fClass] || [] : allSections).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="flex gap-[0.3125rem]">
              <button
                onClick={toggleAll}
                className={`flex-1 px-2 py-1.5 rounded-[0.4375rem] border bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit] font-medium ${allSel ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]' : 'border-[var(--border)]'}`}
              >
                {allSel ? (isBn ? 'সব বাদ' : 'Deselect All') : isBn ? 'সব বাছুন' : 'Select All'} ({filtered.length})
              </button>
              {selected.length > 0 && (
                <button
                  onClick={() => setSelected([])}
                  className="px-[0.625rem] py-1.5 rounded-[0.4375rem] border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] text-[0.6875rem] cursor-pointer font-[inherit]"
                >
                  {selected.length} ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Batch operation */}
        <div className="bg-[var(--bg-primary)] border rounded-xl px-[0.875rem] py-3" style={{ borderColor: opInfo.color }}>
          <div className="text-[0.6875rem] font-semibold uppercase tracking-wider mb-[0.625rem]" style={{ color: opInfo.color }}>
            ③ {isBn ? `এক সাথে ${opInfo.bn}` : ` Batch ${opInfo.en}`}
            {selected.length > 0 && (
              <span className="ml-[0.375rem] font-bold">
                — {selected.length} {isBn ? 'জন' : 'selected'}
              </span>
            )}
          </div>

          {op === 'photo' ? (
            <div className="py-[0.625rem] px-[0.625rem] rounded-[0.5rem] text-[0.8125rem]" style={{ background: opInfo.bg, color: opInfo.color }}>
              <Info size={14} className="inline mr-[0.3125rem] align-middle" />
              {isBn
                ? 'নিচের টেবিলে প্রতিটি ছাত্রের পাশের বাটনে ক্লিক করে ছবি আপলোড করুন'
                : 'Click the upload button next to each student in the table below'}
            </div>
          ) : op === 'roll' ? (
            <div className="flex gap-[0.625rem] items-center flex-wrap">
              <div className="flex items-center gap-[0.4375rem]">
                <span className="text-[0.75rem] text-[var(--text-muted)] whitespace-nowrap">{isBn ? 'শুরু থেকে:' : 'Start from:'}</span>
                <input
                  type="number"
                  min={1}
                  value={autoStart}
                  onChange={(e) => setAutoStart(Math.max(1, Number(e.target.value)))}
                  className="w-[3.75rem] px-2 py-[0.375rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none text-center"
                />
              </div>
              <button
                onClick={applyAutoRoll}
                className="flex items-center gap-[0.3125rem] px-[0.875rem] py-2 rounded-[0.5rem] text-white text-[0.75rem] font-medium cursor-pointer font-[inherit]"
                style={{ background: opInfo.color }}
              >
                <Wand2 size={13} />
                {isBn ? 'ক্রমানুসারে রোল দিন' : 'Auto-assign Sequential Rolls'}
              </button>
              <span className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'অথবা নিচে সরাসরি রোল লিখুন' : 'Or type rolls directly below'}
              </span>
            </div>
          ) : (
            <div className="flex gap-2 items-center flex-wrap">
              {STATIC_OPTS[op] ? (
                <select
                  value={batchVal}
                  onChange={(e) => setBatchVal(e.target.value)}
                  className="px-[0.5625rem] py-[0.4375rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] font-[inherit] cursor-pointer outline-none flex-1"
                  style={{ color: batchVal ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  <option value="">{isBn ? 'নতুন মান বেছে নিন' : 'Select new value'}</option>
                  {STATIC_OPTS[op].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={batchVal}
                  onChange={(e) => setBatchVal(e.target.value)}
                  placeholder={isBn ? 'নতুন মান লিখুন' : 'Enter new value'}
                  className="flex-1 px-[0.5625rem] py-[0.4375rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none"
                />
              )}
              <button
                onClick={applyBatch}
                disabled={!batchVal || selected.length === 0}
                className="flex items-center gap-[0.3125rem] px-[0.875rem] py-2 rounded-[0.5rem] border-none text-white text-[0.75rem] font-medium font-[inherit] whitespace-nowrap disabled:cursor-not-allowed"
                style={{
                  background: !batchVal || selected.length === 0 ? 'var(--border-2)' : opInfo.color,
                  cursor: !batchVal || selected.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Zap size={13} />
                {isBn ? `${selected.length} জনে লাগান` : `Apply to ${selected.length}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden mb-3">
        <div className="px-[0.875rem] py-[0.625rem] border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: opInfo.color }} />
            <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
              {filtered.length} {isBn ? 'জন ছাত্র' : 'students'}
              {selected.length > 0 && (
                <span className="ml-2" style={{ color: opInfo.color }}>
                  · {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </span>
          </div>
          {readyCount > 0 && (
            <span
              className="text-[0.75rem] px-[0.625rem] py-[0.1875rem] rounded-[0.375rem] font-medium"
              style={{ color: opInfo.color, background: opInfo.bg }}
            >
              {readyCount} {isBn ? 'টি পরিবর্তন প্রস্তুত' : 'changes ready'}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="px-3 py-[0.625rem] w-[2.25rem]">
                  <input
                    type="checkbox"
                    checked={allSel}
                    onChange={toggleAll}
                    className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                    style={{ accentColor: opInfo.color }}
                  />
                </th>
                <th className="px-2 py-[0.625rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-[2.25rem]">#</th>
                <th className="px-2 py-[0.625rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase min-w-[3.125rem]">
                  {isBn ? 'ছবি' : 'Photo'}
                </th>
                <th className="px-2 py-[0.625rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase min-w-[10.3125rem]">
                  {isBn ? 'নাম / আইডি' : 'Name / ID'}
                </th>
                <th className="px-2 py-[0.625rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase min-w-[5rem]">
                  {isBn ? 'বর্তমান মান' : 'Current'}
                </th>
                <th
                  className="px-2 py-[0.625rem] text-left text-[0.625rem] font-semibold uppercase min-w-[12.5rem]"
                  style={{ color: opInfo.color, background: `${opInfo.bg}55` }}
                >
                  ✏️ {isBn ? opInfo.bn : opInfo.en}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-[1.875rem] py-[1.875rem] text-center text-[var(--text-muted)]">
                    {isBn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--border)]"
                    style={{ borderBottomWidth: '0.0313rem', background: selected.includes(s.id) ? `${opInfo.bg}44` : 'transparent' }}
                    onMouseEnter={(e) => {
                      if (!selected.includes(s.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      if (!selected.includes(s.id)) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="w-[0.8125rem] h-[0.8125rem] cursor-pointer"
                        style={{ accentColor: opInfo.color }}
                      />
                    </td>
                    <td className="px-2 py-2 text-[var(--text-muted)] font-semibold text-[0.6875rem]">{i + 1}</td>
                    <td className="px-2 py-[0.4375rem]">
                      <div
                        className="relative w-[2rem] h-[2.375rem] rounded-[0.375rem] overflow-visible bg-[var(--bg-secondary)] border flex items-center justify-center"
                        style={{ borderColor: photoMap[s.id] ? opInfo.color : 'var(--border)' }}
                      >
                        {photoMap[s.id] || s.photo ? (
                          <img src={photoMap[s.id] || s.photo} alt="" className="w-full h-full object-cover rounded-[0.3125rem]" />
                        ) : (
                          <User size={14} className="text-[var(--text-muted)]" />
                        )}
                        {photoMap[s.id] && (
                          <button
                            onClick={() =>
                              setPhotoMap((p) => {
                                const n = { ...p }
                                delete n[s.id]
                                return n
                              })
                            }
                            title={isBn ? 'ছবি সরান' : 'Remove photo'}
                            className="absolute -top-[0.3125rem] -right-[0.3125rem] w-[1.125rem] h-[1.125rem] rounded-full bg-[var(--red)] border-2 border-[var(--bg-primary)] cursor-pointer flex items-center justify-center z-10 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-[0.75rem] font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[10rem]">
                        {isBn ? s.nameBn || s.nameEn : s.nameEn}
                      </div>
                      <div className="text-[0.625rem] text-[var(--brand)] font-mono">{s.id}</div>
                    </td>
                    <td className="px-2 py-2 text-[var(--text-secondary)] text-[0.6875rem]">
                      {op === 'photo'
                        ? s.photo
                          ? isBn
                            ? 'ছবি আছে'
                            : 'Has photo'
                          : isBn
                            ? 'নেই'
                            : 'None'
                        : String((s as any)[op] || '—')}
                    </td>
                    <td className="px-2 py-[0.375rem]" style={{ background: selected.includes(s.id) ? `${opInfo.bg}33` : 'transparent' }}>
                      {op === 'photo' ? (
                        <label
                          className="flex items-center gap-[0.3125rem] px-[0.625rem] py-[0.375rem] rounded-[0.4375rem] border text-[0.6875rem] cursor-pointer font-medium w-fit"
                          style={{
                            background: photoMap[s.id] ? 'var(--green-light)' : opInfo.bg,
                            borderColor: photoMap[s.id] ? 'var(--green)' : opInfo.color,
                            color: photoMap[s.id] ? 'var(--green)' : opInfo.color,
                          }}
                        >
                          {photoMap[s.id] ? <CheckCircle size={12} /> : <Upload size={12} />}
                          {photoMap[s.id] ? (isBn ? 'আপলোড হয়েছে ✓' : 'Uploaded ✓') : isBn ? 'ছবি বেছে নিন' : 'Choose Photo'}
                          <input
                            ref={(el) => {
                              fileRefs.current[s.id] = el
                            }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handlePhotoUpload(s.id, f)
                            }}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <EditCell
                          value={rowEdits[s.id] !== undefined ? rowEdits[s.id] : (s as any)[op] || ''}
                          onChange={(v) => updateRowEdit(s.id, v)}
                          opts={STATIC_OPTS[op]}
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

      {/* Apply button */}
      <div className="flex items-center justify-between flex-wrap gap-[0.625rem]">
        <div className="text-[0.75rem] text-[var(--text-muted)]">
          {readyCount > 0
            ? `${readyCount} ${isBn ? 'টি পরিবর্তন সেভের জন্য প্রস্তুত' : 'changes ready to save'}`
            : isBn
              ? 'কোনো পরিবর্তন নেই — উপরে তথ্য দিন'
              : 'No changes yet — add values above'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            className="px-[1.125rem] py-[0.625rem] rounded-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]"
          >
            {isBn ? 'পরিষ্কার করুন' : 'Clear All'}
          </button>
          <button
            onClick={applyChanges}
            disabled={readyCount === 0}
            className="flex items-center gap-[0.4375rem] px-[1.375rem] py-[0.625rem] rounded-[0.5625rem] border-none text-white text-[0.8125rem] font-semibold font-[inherit] disabled:cursor-not-allowed"
            style={{
              background: readyCount === 0 ? 'var(--border-2)' : opInfo.color,
              cursor: readyCount === 0 ? 'not-allowed' : 'pointer',
              boxShadow: readyCount > 0 ? `0 4px 14px ${opInfo.color}50` : 'none',
            }}
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
