import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, IdCard, Printer, Search, User } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import type { StudentAdmission } from '@/pages/students/admission/types'

const TEMPLATES = [
  { id: 'classic', name: 'Classic', nameBn: 'ক্লাসিক', primary: '#6366f1', secondary: '#eef2ff', accent: '#4f46e5', radius: 12 },
  { id: 'ocean', name: 'Ocean', nameBn: 'ওশান', primary: '#0ea5e9', secondary: '#e0f2fe', accent: '#0284c7', radius: 16 },
  { id: 'forest', name: 'Forest', nameBn: 'ফরেস্ট', primary: '#10b981', secondary: '#d1fae5', accent: '#059669', radius: 12 },
  { id: 'sunset', name: 'Sunset', nameBn: 'সানসেট', primary: '#f59e0b', secondary: '#fef3c7', accent: '#d97706', radius: 14 },
  { id: 'rose', name: 'Rose', nameBn: 'রোজ', primary: '#f43f5e', secondary: '#ffe4e6', accent: '#e11d48', radius: 10 },
  { id: 'midnight', name: 'Midnight', nameBn: 'মিডনাইট', primary: '#1e293b', secondary: '#f1f5f9', accent: '#0f172a', radius: 16 },
]

const FIELDS = [
  { key: 'photo', label: 'Photo', labelBn: 'ছবি', default: true },
  { key: 'nameEn', label: 'Name (EN)', labelBn: 'নাম (ইং)', default: true },
  { key: 'nameBn', label: 'Name (BN)', labelBn: 'নাম (বাং)', default: true },
  { key: 'class', label: 'Class & Section', labelBn: 'শ্রেণি ও সেকশন', default: true },
  { key: 'roll', label: 'Roll', labelBn: 'রোল', default: true },
  { key: 'id', label: 'Student ID', labelBn: 'ছাত্র আইডি', default: true },
  { key: 'bloodGroup', label: 'Blood Group', labelBn: 'রক্তের গ্রুপ', default: true },
  { key: 'fatherNameEn', label: "Father's Name", labelBn: 'পিতার নাম', default: false },
  { key: 'fatherPhone', label: "Father's Mobile", labelBn: 'পিতার মোবাইল', default: false },
  { key: 'motherNameEn', label: "Mother's Name", labelBn: 'মাতার নাম', default: false },
  { key: 'phone', label: 'Student Mobile', labelBn: 'ছাত্রের মোবাইল', default: false },
  { key: 'dob', label: 'Date of Birth', labelBn: 'জন্ম তারিখ', default: false },
  { key: 'religion', label: 'Religion', labelBn: 'ধর্ম', default: false },
  { key: 'address', label: 'Address', labelBn: 'ঠিকানা', default: false },
]

function IDCard({
  student,
  template,
  fields,
  institution,
  isBn,
}: {
  student: StudentAdmission
  template: (typeof TEMPLATES)[0]
  fields: string[]
  institution: string
  isBn: boolean
}) {
  const t = template
  const show = (k: string) => fields.includes(k)

  return (
    <div
      className="w-[340px] h-[210px] overflow-hidden flex flex-col font-['Inter',sans-serif] shadow-[0_2px_8px_rgba(0,0,0,0.08)] shrink-0 bg-white"
      style={{ borderRadius: `${t.radius}px`, border: `2px solid ${t.primary}` }}
    >
      {/* Header */}
      <div className="py-2 px-3.5 flex items-center gap-2.5" style={{ background: t.primary }}>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold text-white">ET</div>
        <div>
          <div className="text-[11px] font-bold text-white tracking-wider">{institution}</div>
          <div className="text-[8px] text-white/70 mt-px">Student Identity Card</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex py-2 px-3 gap-2.5" style={{ background: t.secondary }}>
        {/* Photo */}
        {show('photo') && (
          <div
            className="w-[65px] h-20 rounded-lg border-2 overflow-hidden bg-white flex items-center justify-center shrink-0"
            style={{ borderColor: t.primary }}
          >
            {student.photo ? (
              <img src={student.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="opacity-40" style={{ color: t.primary }} />
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {show('nameEn') && (
            <div className="text-[13px] font-bold text-[#1a1a1a] overflow-hidden text-ellipsis whitespace-nowrap">{student.nameEn}</div>
          )}
          {show('nameBn') && student.nameBn && <div className="text-[10px] text-[#666] mb-0.5">{student.nameBn}</div>}
          <div className="flex flex-wrap gap-[3px] mt-0.5">
            {show('class') && (
              <span className="text-[8px] font-semibold py-0.5 px-1.5 rounded text-white" style={{ background: t.primary }}>
                {isBn ? `শ্র ${student.class}-${student.section}` : `Cls ${student.class}-${student.section}`}
              </span>
            )}
            {show('roll') && student.roll && (
              <span
                className="text-[8px] font-medium py-0.5 px-1.5 rounded bg-white"
                style={{ color: t.primary, border: `1px solid ${t.primary}` }}
              >
                {isBn ? `রোল ${student.roll}` : `Roll ${student.roll}`}
              </span>
            )}
            {show('bloodGroup') && student.bloodGroup && (
              <span className="text-[8px] font-medium py-0.5 px-1.5 rounded bg-red-50 text-red-500 border border-red-200">
                {student.bloodGroup}
              </span>
            )}
          </div>
          <div className="mt-auto flex flex-col gap-px">
            {show('id') && <div className="text-[8px] text-[#888] font-mono">ID: {student.id}</div>}
            {show('fatherNameEn') && student.fatherNameEn && (
              <div className="text-[8px] text-[#666]">
                {isBn ? 'পিতা' : 'Father'}: {student.fatherNameEn}
              </div>
            )}
            {show('fatherPhone') && student.fatherPhone && (
              <div className="text-[8px] text-[#666]">
                {isBn ? 'পিতার মোবাইল' : 'Father Mobile'}: {student.fatherPhone}
              </div>
            )}
            {show('motherNameEn') && student.motherNameEn && (
              <div className="text-[8px] text-[#666]">
                {isBn ? 'মাতা' : 'Mother'}: {student.motherNameEn}
              </div>
            )}
            {show('phone') && student.phone && (
              <div className="text-[8px] text-[#666]">
                {isBn ? 'মোবাইল' : 'Mobile'}: {student.phone}
              </div>
            )}
            {show('dob') && student.dob && (
              <div className="text-[8px] text-[#666]">
                {isBn ? 'জন্ম' : 'DOB'}: {student.dob}
              </div>
            )}
            {show('religion') && student.religion && (
              <div className="text-[8px] text-[#666]">
                {isBn ? 'ধর্ম' : 'Religion'}: {student.religion.split(' / ')[0]}
              </div>
            )}
            {show('address') && student.presentAddress && (
              <div className="text-[8px] text-[#666] overflow-hidden text-ellipsis whitespace-nowrap">
                {isBn ? 'ঠিকানা' : 'Address'}: {student.presentAddress}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-1 px-3 flex justify-between items-center" style={{ background: t.accent }}>
        <span className="text-[7px] text-white/70">Academic Year 2025–26</span>
        <div className="flex gap-5">
          <div className="text-center">
            <div className="w-12 h-px bg-white/50 mb-px" />
            <span className="text-[6px] text-white/70">Principal</span>
          </div>
          <div className="text-center">
            <div className="w-12 h-px bg-white/50 mb-px" />
            <span className="text-[6px] text-white/70">Seal</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IDCardsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const isBn = language === 'bn'

  const approved = useMemo(() => students.filter((s) => s.status === 'approved'), [students])
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((cls) => cls.sections.forEach((s) => set.add(s.name)))
    return Array.from(set).sort()
  }, [classes])

  const [template, setTemplate] = useState(TEMPLATES[0])
  const [fields, setFields] = useState<string[]>(FIELDS.filter((f) => f.default).map((f) => f.key))
  const [institution, setInstitution] = useState('EduTech — Sunrise Academy')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const filtered = useMemo(
    () =>
      approved.filter((s) => {
        if (fClass && s.class !== fClass) return false
        if (fSection && s.section !== fSection) return false
        if (search) {
          const q = search.toLowerCase()
          if (!s.nameEn.toLowerCase().includes(q) && !s.nameBn.includes(search) && !s.id.includes(search)) return false
        }
        return true
      }),
    [approved, fClass, fSection, search]
  )

  const displayList = selected.length > 0 ? approved.filter((s) => selected.includes(s.id)) : filtered

  const toggleField = useCallback((key: string) => {
    setFields((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]))
  }, [])

  const selectAll = useCallback(() => {
    setSelected((p) => (p.length === filtered.length ? [] : filtered.map((s) => s.id)))
  }, [filtered])

  const printCards = useCallback(() => {
    const win = window.open('', '_blank')
    if (!win) return
    const cards = displayList
      .map((s) => {
        const t = template
        const show = (k: string) => fields.includes(k)
        return `<div style="width:340px;height:210px;border-radius:${t.radius}px;border:2px solid ${t.primary};overflow:hidden;display:inline-flex;flex-direction:column;font-family:Arial,sans-serif;margin:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);page-break-inside:avoid;background:#fff">
        <div style="background:${t.primary};padding:8px 14px;display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff">ET</div>
          <div><div style="font-size:11px;font-weight:700;color:#fff">${institution}</div><div style="font-size:8px;color:rgba(255,255,255,0.7)">Student Identity Card</div></div>
        </div>
        <div style="flex:1;display:flex;padding:8px 12px;gap:10px;background:${t.secondary}">
          ${show('photo') ? `<div style="width:65px;height:80px;border-radius:8px;border:2px solid ${t.primary};overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${s.photo ? `<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover" />` : `<span style="font-size:24px;color:${t.primary};opacity:0.4">👤</span>`}</div>` : ''}
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
            ${show('nameEn') ? `<div style="font-size:13px;font-weight:700;color:#1a1a1a">${s.nameEn}</div>` : ''}
            ${show('nameBn') && s.nameBn ? `<div style="font-size:10px;color:#666">${s.nameBn}</div>` : ''}
            <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:2px">
              ${show('class') ? `<span style="font-size:8px;font-weight:600;padding:2px 6px;border-radius:4px;background:${t.primary};color:#fff">Cls ${s.class}-${s.section}</span>` : ''}
              ${show('roll') && s.roll ? `<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:#fff;color:${t.primary};border:1px solid ${t.primary}">Roll ${s.roll}</span>` : ''}
              ${show('bloodGroup') && s.bloodGroup ? `<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca">${s.bloodGroup}</span>` : ''}
            </div>
            <div style="margin-top:auto;display:flex;flex-direction:column;gap:1px">
              ${show('id') ? `<div style="font-size:8px;color:#888;font-family:monospace">ID: ${s.id}</div>` : ''}
              ${show('fatherNameEn') && s.fatherNameEn ? `<div style="font-size:8px;color:#666">Father: ${s.fatherNameEn}</div>` : ''}
              ${show('fatherPhone') && s.fatherPhone ? `<div style="font-size:8px;color:#666">Father Mobile: ${s.fatherPhone}</div>` : ''}
              ${show('motherNameEn') && s.motherNameEn ? `<div style="font-size:8px;color:#666">Mother: ${s.motherNameEn}</div>` : ''}
              ${show('phone') && s.phone ? `<div style="font-size:8px;color:#666">Mobile: ${s.phone}</div>` : ''}
            </div>
          </div>
        </div>
        <div style="padding:4px 12px;background:${t.accent};display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:7px;color:rgba(255,255,255,0.7)">Academic Year 2025–26</span>
          <div style="display:flex;gap:20px"><div style="text-align:center"><div style="width:50px;height:1px;background:rgba(255,255,255,0.5)"></div><span style="font-size:6px;color:rgba(255,255,255,0.7)">Principal</span></div><div style="text-align:center"><div style="width:50px;height:1px;background:rgba(255,255,255,0.5)"></div><span style="font-size:6px;color:rgba(255,255,255,0.7)">Seal</span></div></div>
        </div>
      </div>`
      })
      .join('')

    win.document.write(
      `<!DOCTYPE html><html><head><title>ID Cards</title><style>@page{size:auto;margin:10mm}body{margin:0;padding:0;font-family:Arial,sans-serif}.cards{display:flex;flex-wrap:wrap;justify-content:center;gap:0}</style></head><body><div class="cards">${cards}</div><script>setTimeout(()=>window.print(),500)</script></body></html>`
    )
    win.document.close()
  }, [displayList, template, fields, institution])

  const inp =
    "w-full py-[7px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-['inherit'] outline-none"

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-[18px] flex-wrap">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1.5 py-[7px] px-3 rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] font-['inherit'] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[22px]'}`}>
            {isBn ? 'আইডি কার্ড' : 'ID Cards'}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-[3px]">
            {isBn ? `${displayList.length} জন ছাত্রের আইডি কার্ড তৈরি করুন` : `Generate ID cards for ${displayList.length} students`}
          </p>
        </div>
        <button
          onClick={printCards}
          disabled={displayList.length === 0}
          className={`flex items-center gap-1.5 py-[9px] px-[18px] rounded-[9px] border-none text-white text-[13px] font-semibold font-['inherit'] ${displayList.length === 0 ? 'bg-[var(--border-2)] cursor-not-allowed' : 'bg-[var(--brand)] cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.3)]'}`}
        >
          <Printer size={14} />
          {isBn ? 'প্রিন্ট করুন' : 'Print'}
        </button>
      </div>

      <div className={`grid gap-4 items-start ${isMobile ? 'grid-cols-1' : 'grid-cols-[280px_1fr]'}`}>
        {/* Left sidebar */}
        <div className="flex flex-col gap-3">
          {/* Institution name */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              ① {isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'}
            </div>
            <input value={institution} onChange={(e) => setInstitution(e.target.value)} className={inp} />
          </div>

          {/* Template selector */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              ② {isBn ? 'ডিজাইন টেমপ্লেট' : 'Design Template'}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t)}
                  className="p-2 rounded-lg border-2 cursor-pointer font-['inherit'] text-left transition-all duration-150"
                  style={{
                    borderColor: template.id === t.id ? t.primary : 'var(--border)',
                    background: template.id === t.id ? t.secondary : 'var(--bg-secondary)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-[3px]">
                    <div className="w-3 h-3 rounded-full" style={{ background: t.primary }} />
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: template.id === t.id ? t.primary : 'var(--text-secondary)' }}
                    >
                      {isBn ? t.nameBn : t.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Field toggles */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              ③ {isBn ? 'তথ্য অপশন' : 'Field Options'} ({fields.length}/{FIELDS.length})
            </div>
            <div className="flex flex-col gap-1">
              {FIELDS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 py-[5px] px-2 rounded-md cursor-pointer transition-all duration-100"
                  style={{
                    border: `1px solid ${fields.includes(f.key) ? 'var(--brand)' : 'var(--border)'}`,
                    background: fields.includes(f.key) ? 'var(--brand-light)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={fields.includes(f.key)}
                    onChange={() => toggleField(f.key)}
                    className="w-3 h-3 accent-[var(--brand)] cursor-pointer"
                  />
                  <span
                    className={`text-[11px] ${fields.includes(f.key) ? 'font-medium text-[var(--brand)]' : 'font-normal text-[var(--text-secondary)]'}`}
                  >
                    {isBn ? f.labelBn : f.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              ④ {isBn ? 'ফিল্টার' : 'Filter'}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[7px] py-1.5 px-2">
                <Search size={12} className="text-[var(--text-muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
                  className="flex-1 border-none bg-transparent outline-none text-[11px] text-[var(--text-primary)] font-['inherit']"
                />
              </div>
              <select
                value={fClass}
                onChange={(e) => {
                  setFClass(e.target.value)
                  setFSection('')
                }}
                className={inp}
              >
                <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={inp}>
                <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
                {(fClass ? sectionsMap[fClass] || [] : allSections).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={selectAll}
                className="py-1.5 rounded-[7px] text-[11px] cursor-pointer font-['inherit'] font-medium"
                style={{
                  border: `1px solid ${selected.length > 0 ? 'var(--brand)' : 'var(--border)'}`,
                  background: selected.length > 0 ? 'var(--brand-light)' : 'var(--bg-secondary)',
                  color: selected.length > 0 ? 'var(--brand)' : 'var(--text-secondary)',
                }}
              >
                {selected.length > 0
                  ? `${selected.length} ${isBn ? 'নির্বাচিত' : 'selected'}`
                  : isBn
                    ? `সব বাছুন (${filtered.length})`
                    : `Select All (${filtered.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-4">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">
              {isBn ? 'প্রিভিউ' : 'Preview'} ({displayList.length} {isBn ? 'জন' : 'cards'})
            </span>
          </div>
          {displayList.length === 0 ? (
            <div className="text-center p-10 text-[var(--text-muted)]">
              <IdCard size={32} className="block mx-auto mb-2 opacity-30" />
              {isBn ? 'কোনো ছাত্র নির্বাচন করুন' : 'Select students to preview'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-start">
              {displayList.map((s) => (
                <IDCard key={s.id} student={s} template={template} fields={fields} institution={institution} isBn={isBn} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
