import { useState, useMemo, useRef, useCallback } from 'react'
import React from 'react'
import { Search, Trash2, Plus, Gift, ChevronDown, ChevronRight, Tag, Edit2, Check, X, Award, Heart, Briefcase, Users, Percent, HandCoins, MoreVertical, FileSpreadsheet, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useSessionStudents } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { inputCls } from '@/lib/styles'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { XLSX } from '@/lib/excelExport'
import ModernCheckbox from '@/components/ui/ModernCheckbox'

interface Props {
  onAddWaiver: (mode: 'category' | 'full') => void
  onAddStudentWaiver: () => void
}

const MONTH_LABELS = [
  { en: 'Jan', bn: 'জানুয়ারি' },
  { en: 'Feb', bn: 'ফেব্রুয়ারি' },
  { en: 'Mar', bn: 'মার্চ' },
  { en: 'Apr', bn: 'এপ্রিল' },
  { en: 'May', bn: 'মে' },
  { en: 'Jun', bn: 'জুন' },
  { en: 'Jul', bn: 'জুলাই' },
  { en: 'Aug', bn: 'আগস্ট' },
  { en: 'Sep', bn: 'সেপ্টেম্বর' },
  { en: 'Oct', bn: 'অক্টোবর' },
  { en: 'Nov', bn: 'নভেম্বর' },
  { en: 'Dec', bn: 'ডিসেম্বর' },
]

const selectCls = 'h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer'

const CATEGORY_ICON_KEYWORDS: { icon: LucideIcon; keywords: string[] }[] = [
  { icon: Award, keywords: ['scholarship', 'বৃত্তি', 'merit', 'সুমেরু', 'award', 'পুরস্কার'] },
  { icon: Heart, keywords: ['orphan', 'এতিম', 'widow', 'বিধবা', 'poor', 'গরিব', 'poverty', 'দুঃখিত'] },
  { icon: Briefcase, keywords: ['staff', 'কর্মচারী', 'employee', 'employee', 'teacher', 'শিক্ষক'] },
  { icon: Users, keywords: ['sibling', 'ভাই', 'বোন', 'brother', 'sister', 'family', 'পরিবার', 'twin', 'যমজ'] },
  { icon: Percent, keywords: ['discount', 'ছাড়', 'rebate', 'স্বার্থ', 'concession'] },
  { icon: HandCoins, keywords: ['financial', 'অর্থ', 'aid', 'help', 'সাহায্য', 'support', 'মাসিক'] },
]

function getCategoryIcon(name: string, nameBn: string): LucideIcon {
  const combined = `${name} ${nameBn}`.toLowerCase()
  for (const { icon, keywords } of CATEGORY_ICON_KEYWORDS) {
    if (keywords.some((kw) => combined.includes(kw))) return icon
  }
  return Tag
}

export const WaiversTab = React.memo(function WaiversTab({ onAddWaiver, onAddStudentWaiver }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { waiverCategories, waiverEntries, structures, studentWaivers, deleteWaiverCategory, deleteWaiverEntry, deleteStudentWaiver, updateWaiverCategory, updateWaiverEntry, updateStudentWaiver } = useFeeStore()
  const { institution, classes } = useClassStore()
  const sessions = institution?.sessions || []

  const [subTab, setSubTab] = useState<'categories' | 'students'>('students')
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  const [fSession, setFSession] = useState(() => institution?.currentSession || '')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNameBn, setEditNameBn] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDescBn, setEditDescBn] = useState('')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'amount' | 'percent'>('amount')
  const [editValue, setEditValue] = useState('')
  const [editReason, setEditReason] = useState('')
  const [editReasonBn, setEditReasonBn] = useState('')

  useTabSlider({ activeTab: subTab, tabRefs, sliderRef, getContainer: (s) => s.parentElement })

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const studentMap = useMemo(() => {
    const map: Record<string, { nameEn: string; nameBn: string; class: string; section: string; roll: string; academicYear: string; photo: string }> = {}
    students.forEach((s) => { map[s.id] = { nameEn: s.nameEn, nameBn: s.nameBn, class: s.class, section: s.section, roll: s.roll, academicYear: s.academicYear || '', photo: s.photo || '' } })
    return map
  }, [students])

  const structureMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string; type: string; amount: number }> = {}
    structures.forEach((s) => { map[s.id] = { name: s.name, nameBn: s.nameBn, type: s.type, amount: s.amount } })
    return map
  }, [structures])

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string }> = {}
    waiverCategories.forEach((c) => { map[c.id] = { name: c.name, nameBn: c.nameBn } })
    return map
  }, [waiverCategories])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllRows = () => {
    if (selectedRows.size === groupedStudents.length) setSelectedRows(new Set())
    else setSelectedRows(new Set(groupedStudents.map((g) => g.studentId)))
  }

  const startEditCat = (cat: { id: string; name: string; nameBn: string; description: string; descriptionBn: string }) => {
    setEditingCatId(cat.id)
    setEditName(cat.name)
    setEditNameBn(cat.nameBn)
    setEditDesc(cat.description)
    setEditDescBn(cat.descriptionBn)
  }

  const saveEditCat = () => {
    if (!editingCatId || !editName) return
    updateWaiverCategory(editingCatId, {
      name: editName,
      nameBn: editNameBn || editName,
      description: editDesc,
      descriptionBn: editDescBn || editDesc,
    })
    setEditingCatId(null)
  }

  const cancelEditCat = () => {
    setEditingCatId(null)
  }

  const startEditEntry = (entry: { id: string; originalId: string; mode: 'amount' | 'percent'; value: number; reason: string; reasonBn: string; source: 'legacy' | 'student' }) => {
    setEditingEntryId(entry.id)
    setEditMode(entry.mode)
    setEditValue(String(entry.value))
    setEditReason(entry.reason)
    setEditReasonBn(entry.reasonBn)
  }

  const saveEditEntry = () => {
    if (!editingEntryId) return
    const val = Number(editValue)
    if (val <= 0) return
    const entry = groupedStudents.flatMap((g) => g.entries).find((e) => e.id === editingEntryId)
    if (!entry) return
    if (entry.source === 'student') {
      updateStudentWaiver(entry.originalId, { mode: editMode, value: val, reason: editReason, reasonBn: editReasonBn || editReason })
    } else {
      updateWaiverEntry(entry.originalId, { mode: editMode, value: val, reason: editReason, reasonBn: editReasonBn || editReason })
    }
    setEditingEntryId(null)
  }

  const cancelEditEntry = () => {
    setEditingEntryId(null)
  }

  // Categories data
  const categoryStats = useMemo(() => {
    return waiverCategories.map((cat) => {
      const legacyEntries = waiverEntries.filter((e) => e.categoryId === cat.id)
      const legacyStudentIds = new Set(legacyEntries.map((e) => e.studentId))
      const studentWaiversForCat = studentWaivers.filter((w) => w.waiverCategoryId === cat.id && w.isActive)
      const swStudentIds = new Set(studentWaiversForCat.map((w) => w.studentId))
      const allStudentIds = new Set([...legacyStudentIds, ...swStudentIds])
      const entryCount = allStudentIds.size

      let totalWaived = 0

      for (const entry of legacyEntries) {
        const struct = structures.find((s) => s.id === entry.feeStructureId)
        if (!struct) continue
        const perPeriod = entry.mode === 'percent' ? Math.round(struct.amount * entry.value / 100) : entry.value
        if (entry.months.length > 0) {
          totalWaived += perPeriod * entry.months.length
        } else {
          totalWaived += perPeriod
        }
      }

      for (const sw of studentWaiversForCat) {
        const student = students.find((s) => s.id === sw.studentId)
        if (!student) continue
        const structure = structures.find((s) => s.id === sw.feeStructureId)
        if (!structure) continue
        const perPeriod = sw.mode === 'percent' ? Math.round(structure.amount * sw.value / 100) : Math.min(sw.value, structure.amount)
        if (structure.type === 'monthly') {
          totalWaived += perPeriod * 12
        } else {
          totalWaived += perPeriod
        }
      }

      return { ...cat, entryCount, totalWaived }
    })
  }, [waiverCategories, waiverEntries, studentWaivers, structures, students])

  // Students grouped data — merge both waiverEntries (legacy) and studentWaivers (persistent)
  const groupedStudents = useMemo(() => {
    type GroupEntry = { id: string; originalId: string; categoryId: string; studentId: string; feeStructureId: string; mode: 'amount' | 'percent'; value: number; months: number[]; reason: string; reasonBn: string; source: 'legacy' | 'student' }

    const groups = new Map<string, {
      studentId: string
      studentName: string
      studentNameBn: string
      class: string
      section: string
      roll: string
      photo: string
      entries: GroupEntry[]
      totalWaived: number
    }>()

    const ensureGroup = (studentId: string) => {
      if (groups.has(studentId)) return groups.get(studentId)!
      const sn = studentMap[studentId]
      if (!sn) return null
      const group = { studentId, studentName: sn.nameEn, studentNameBn: sn.nameBn, class: sn.class, section: sn.section, roll: sn.roll, photo: sn.photo, entries: [] as GroupEntry[], totalWaived: 0 }
      groups.set(studentId, group)
      return group
    }

    // Process legacy waiverEntries
    let legacyFiltered = waiverEntries
    if (fCategory) legacyFiltered = legacyFiltered.filter((e) => e.categoryId === fCategory)
    if (fClass) legacyFiltered = legacyFiltered.filter((e) => studentMap[e.studentId]?.class === fClass)
    if (fSection) legacyFiltered = legacyFiltered.filter((e) => studentMap[e.studentId]?.section === fSection)
    if (fSession) legacyFiltered = legacyFiltered.filter((e) => studentMap[e.studentId]?.academicYear === fSession)

    for (const entry of legacyFiltered) {
      const group = ensureGroup(entry.studentId)
      if (!group) continue
      group.entries.push({ ...entry, originalId: entry.id, source: 'legacy' })
    }

    // Process studentWaivers — expand each to per-structure entries
    let swFiltered = studentWaivers.filter((w) => w.isActive)
    if (fCategory) swFiltered = swFiltered.filter((w) => w.waiverCategoryId === fCategory)
    if (fClass) swFiltered = swFiltered.filter((w) => studentMap[w.studentId]?.class === fClass)
    if (fSection) swFiltered = swFiltered.filter((w) => studentMap[w.studentId]?.section === fSection)
    if (fSession) swFiltered = swFiltered.filter((w) => studentMap[w.studentId]?.academicYear === fSession)

    for (const sw of swFiltered) {
      const student = students.find((s) => s.id === sw.studentId)
      if (!student) continue
      const structure = structures.find((s) => s.id === sw.feeStructureId)
      if (!structure) continue
      const group = ensureGroup(sw.studentId)
      if (!group) continue
      group.entries.push({
        id: `${sw.id}-${structure.id}`,
        originalId: sw.id,
        categoryId: sw.waiverCategoryId,
        studentId: sw.studentId,
        feeStructureId: structure.id,
        mode: sw.mode,
        value: sw.value,
        months: structure.type === 'monthly' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [],
        reason: sw.reason,
        reasonBn: sw.reasonBn,
        source: 'student',
      })
    }

    // Compute totalWaived for each group
    for (const group of groups.values()) {
      for (const entry of group.entries) {
        const struct = structures.find((s) => s.id === entry.feeStructureId)
        if (!struct) continue
        const perPeriod = entry.mode === 'percent' ? Math.round(struct.amount * entry.value / 100) : Math.min(entry.value, struct.amount)
        if (entry.months.length > 0) {
          group.totalWaived += perPeriod * entry.months.length
        } else {
          group.totalWaived += perPeriod
        }
      }
    }

    let list = Array.from(groups.values()).sort((a, b) => a.studentName.localeCompare(b.studentName))

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((g) =>
        g.studentName.toLowerCase().includes(q) ||
        g.studentNameBn.includes(q) ||
        g.roll.includes(q)
      )
    }

    return list
  }, [waiverEntries, studentWaivers, studentMap, structures, students, fClass, fSection, fCategory, fSession, search])

  const exportData = useMemo(() => {
    if (selectedRows.size > 0) return groupedStudents.filter((g) => selectedRows.has(g.studentId))
    return groupedStudents
  }, [groupedStudents, selectedRows])

  const totalWaived = useMemo(() => groupedStudents.reduce((sum, g) => sum + g.totalWaived, 0), [groupedStudents])

  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'studentId', label: 'Student ID', labelBn: 'শিক্ষার্থী আইডি', default: true },
    { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', default: true },
    { key: 'roll', label: 'Roll', labelBn: 'রোল', default: true },
    { key: 'class', label: 'Class', labelBn: 'শ্রেণি', default: true },
    { key: 'category', label: 'Category', labelBn: 'ক্যাটাগরি', default: true },
    { key: 'fee', label: 'Fee', labelBn: 'ফি', default: true },
    { key: 'perMonth', label: 'Per Month', labelBn: 'প্রতি মাসে', default: true },
    { key: 'totalWaived', label: 'Total Waived', labelBn: 'মোট ছাড়', default: true },
  ], [])

  const buildPdfRow = useCallback((g: typeof groupedStudents[0], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    const firstEntry = g.entries[0]
    const catName = firstEntry ? categoryMap[firstEntry.categoryId] : null
    const feeNames = [...new Set(g.entries.map((e) => {
      const s = structureMap[e.feeStructureId]
      return s ? (bn ? s.nameBn || s.name : s.name) : '—'
    }))]

    let perMonthTotal = 0
    for (const entry of g.entries) {
      const struct = structures.find((s) => s.id === entry.feeStructureId)
      if (!struct) continue
      const perPeriod = entry.mode === 'percent' ? Math.round(struct.amount * entry.value / 100) : entry.value
      if (entry.months.length > 0) {
        perMonthTotal += perPeriod
      } else {
        perMonthTotal += perPeriod
      }
    }

    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('studentId')) row[bn ? 'শিক্ষার্থী আইডি' : 'Student ID'] = g.studentId
    if (cols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? g.studentNameBn || g.studentName : g.studentName
    if (cols.includes('roll')) row[bn ? 'রোল' : 'Roll'] = g.roll
    if (cols.includes('class')) row[bn ? 'শ্রেণি' : 'Class'] = `${g.class} - ${g.section}`
    if (cols.includes('category')) row[bn ? 'ক্যাটাগরি' : 'Category'] = catName ? (bn ? catName.nameBn || catName.name : catName.name) : '—'
    if (cols.includes('fee')) row[bn ? 'ফি' : 'Fee'] = feeNames.join(', ')
    if (cols.includes('perMonth')) row[bn ? 'প্রতি মাসে' : 'Per Month'] = fmt(perMonthTotal)
    if (cols.includes('totalWaived')) row[bn ? 'মোট ছাড়' : 'Total Waived'] = fmt(g.totalWaived)
    row.__photo = g.photo || ''
    return row
  }, [bn, categoryMap, structureMap, structures])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const rows = exportData.map((g, i) => buildPdfRow(g, opts.selectedCols, i))
    const summaryRow: Record<string, string | number> = {}
    if (opts.selectedCols.includes('sn')) summaryRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    if (opts.selectedCols.includes('studentId')) summaryRow[bn ? 'শিক্ষার্থী আইডি' : 'Student ID'] = ''
    summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('roll')) summaryRow[bn ? 'রোল' : 'Roll'] = ''
    if (opts.selectedCols.includes('class')) summaryRow[bn ? 'শ্রেণি' : 'Class'] = ''
    if (opts.selectedCols.includes('category')) summaryRow[bn ? 'ক্যাটাগরি' : 'Category'] = ''
    if (opts.selectedCols.includes('fee')) summaryRow[bn ? 'ফি' : 'Fee'] = ''
    if (opts.selectedCols.includes('perMonth')) summaryRow[bn ? 'প্রতি মাসে' : 'Per Month'] = ''
    if (opts.selectedCols.includes('totalWaived')) summaryRow[bn ? 'মোট ছাড়' : 'Total Waived'] = fmt(exportData.reduce((s, g) => s + g.totalWaived, 0))
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}td img{width:28px;height:28px;border-radius:50%;object-fit:cover}`
    const photoHeaders = opts.includeImage ? [bn ? 'ছবি' : 'Photo'] : []
    const headers = [...photoHeaders, ...opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })]
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${[...(opts.includeImage ? [`<td>${r.__photo ? `<img src="${r.__photo}" />` : ''}</td>`] : []), ...opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); const h = col ? (opts.isBn ? col.labelBn : col.label) : c; return `<td>${r[h] ?? ''}</td>` })].join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [exportData, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = exportData.map((g, i) => buildPdfRow(g, opts.selectedCols, i))
    const summaryRow: Record<string, string | number> = {}
    if (opts.selectedCols.includes('sn')) summaryRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    if (opts.selectedCols.includes('studentId')) summaryRow[bn ? 'শিক্ষার্থী আইডি' : 'Student ID'] = ''
    summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('roll')) summaryRow[bn ? 'রোল' : 'Roll'] = ''
    if (opts.selectedCols.includes('class')) summaryRow[bn ? 'শ্রেণি' : 'Class'] = ''
    if (opts.selectedCols.includes('category')) summaryRow[bn ? 'ক্যাটাগরি' : 'Category'] = ''
    if (opts.selectedCols.includes('fee')) summaryRow[bn ? 'ফি' : 'Fee'] = ''
    if (opts.selectedCols.includes('perMonth')) summaryRow[bn ? 'প্রতি মাসে' : 'Per Month'] = ''
    if (opts.selectedCols.includes('totalWaived')) summaryRow[bn ? 'মোট ছাড়' : 'Total Waived'] = fmt(exportData.reduce((s, g) => s + g.totalWaived, 0))
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const photoHeaders = opts.includeImage ? [bn ? 'ছবি' : 'Photo'] : []
    const headers = [...photoHeaders, ...opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })]
    return `<div style="display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px">${logoHtml}<div><div style="font-size:16px;font-weight:700;color:${pdfBranding.brandColor}">${pdfBranding.schoolName}</div><div style="font-size:10px;color:#666">${pdfBranding.address}</div></div></div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headers.map((h) => `<th style="background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${[...(opts.includeImage ? [`<td style="padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center">${r.__photo ? `<img src="${r.__photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" />` : ''}</td>`] : []), ...opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); const h = col ? (opts.isBn ? col.labelBn : col.label) : c; return `<td style="padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>` })].join('')}</tr>`).join('')}</tbody></table>`
  }, [exportData, pdfColumns, bn, buildPdfRow])

  const exportExcel = useCallback(() => {
    const sheetData = exportData.map((g, idx) => {
      let perMonthTotal = 0
      for (const entry of g.entries) {
        const struct = structures.find((s) => s.id === entry.feeStructureId)
        if (!struct) continue
        const perPeriod = entry.mode === 'percent' ? Math.round(struct.amount * entry.value / 100) : entry.value
        perMonthTotal += perPeriod
      }
      const firstEntry = g.entries[0]
      const catName = firstEntry ? categoryMap[firstEntry.categoryId] : null
      const feeNames = [...new Set(g.entries.map((e) => {
        const s = structureMap[e.feeStructureId]
        return s ? (bn ? s.nameBn || s.name : s.name) : '—'
      }))]
      const row: Record<string, string | number> = {
        [bn ? 'ক্রমিক' : 'S/N']: idx + 1,
        [bn ? 'শিক্ষার্থী আইডি' : 'Student ID']: g.studentId,
        [bn ? 'শিক্ষার্থী' : 'Student']: bn ? g.studentNameBn || g.studentName : g.studentName,
        [bn ? 'রোল' : 'Roll']: g.roll,
        [bn ? 'শ্রেণি' : 'Class']: `${g.class} - ${g.section}`,
        [bn ? 'ক্যাটাগরি' : 'Category']: catName ? (bn ? catName.nameBn || catName.name : catName.name) : '—',
        [bn ? 'ফি' : 'Fee']: feeNames.join(', '),
        [bn ? 'প্রতি মাসে' : 'Per Month']: perMonthTotal,
        [bn ? 'মোট ছাড়' : 'Total Waived']: g.totalWaived,
      }
      return row
    })
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'ছাড়' : 'Waivers')
    XLSX.writeFile(wb, `waivers-${fSession || 'all'}.xlsx`)
  }, [exportData, structures, categoryMap, structureMap, bn, fSession])

  return (
    <div>
      {/* Summary */}
      <div className="mb-4">
        <div
          className="glass rounded-[0.75rem] flex items-center justify-between p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="flex items-center gap-[0.625rem]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--purple-light)' }}>
              <Gift size={15} style={{ color: 'var(--purple)' }} />
            </div>
            <div className="min-w-0">
              <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(totalWaived)}</div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'মোট ছাড়' : 'Total Waived'}</div>
            </div>
          </div>
        <button onClick={() => subTab === 'students' ? onAddStudentWaiver() : onAddWaiver('category')} className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer">
          <Plus size={13} /> {subTab === 'students' ? (bn ? 'শিক্ষার্থী যোগ করুন' : 'Add Student') : (bn ? 'ক্যাটাগরি যোগ করুন' : 'Add Category')}
        </button>
        </div>
      </div>

      {/* Sub-tab Bar */}
      <div className="relative flex gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] mb-3">
        <div
          ref={sliderRef}
          className="absolute top-1 bottom-1 rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
          style={{
            background: 'var(--brand)',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            zIndex: 0,
          }}
        />
        <button
          ref={(el) => { if (el) tabRefs.current.set('categories', el) }}
          onClick={() => setSubTab('categories')}
          className={`relative z-10 flex-1 py-2 rounded-[0.5625rem] text-xs font-semibold cursor-pointer border-none transition-colors duration-200 ${
            subTab === 'categories' ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Tag size={12} className="inline mr-1" />
          {bn ? 'ক্যাটাগরি' : 'Categories'}
        </button>
        <button
          ref={(el) => { if (el) tabRefs.current.set('students', el) }}
          onClick={() => setSubTab('students')}
          className={`relative z-10 flex-1 py-2 rounded-[0.5625rem] text-xs font-semibold cursor-pointer border-none transition-colors duration-200 ${
            subTab === 'students' ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Gift size={12} className="inline mr-1" />
          {bn ? 'শিক্ষার্থী' : 'Students'}
        </button>
      </div>

      {subTab === 'categories' ? (
        /* Categories View */
        <div className="space-y-2">
          {categoryStats.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              {bn ? 'কোনো ক্যাটাগরি নেই। "ছাড় যোগ করুন" এ ক্লিক করে প্রথম ক্যাটাগরি তৈরি করুন।' : 'No categories yet. Click "Add Waiver" to create the first category.'}
            </div>
          ) : (
            categoryStats.map((cat) => {
              const CatIcon = getCategoryIcon(cat.name, cat.nameBn)
              const isEditing = editingCatId === cat.id
              return (
                <div key={cat.id} className={`p-3 rounded-xl border transition-all ${cat.isActive ? 'border-[var(--border)] bg-[var(--bg-primary)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--purple-light)] flex items-center justify-center flex-shrink-0">
                      <CatIcon size={16} className="text-[var(--purple)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} className={`${selectCls} w-full !h-7 !text-[0.65rem]`} placeholder="Name *" />
                            <input value={editNameBn} onChange={(e) => setEditNameBn(e.target.value)} className={`${selectCls} w-full !h-7 !text-[0.65rem]`} placeholder="নাম" />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={`${selectCls} w-full !h-7 !text-[0.65rem]`} placeholder="Description" />
                            <input value={editDescBn} onChange={(e) => setEditDescBn(e.target.value)} className={`${selectCls} w-full !h-7 !text-[0.65rem]`} placeholder="বিবরণ" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{bn ? cat.nameBn || cat.name : cat.name}</p>
                          {cat.description && <p className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{bn ? cat.descriptionBn || cat.description : cat.description}</p>}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[0.65rem] text-[var(--text-muted)]">{cat.entryCount} {bn ? 'জন শিক্ষার্থী' : 'students'}</p>
                        <p className="text-xs font-bold text-[var(--purple)]">{fmt(cat.totalWaived)}</p>
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button onClick={saveEditCat} disabled={!editName} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--green-light)] text-[var(--green)] border-0 cursor-pointer disabled:opacity-40" title={bn ? 'সংরক্ষণ' : 'Save'}>
                            <Check size={11} />
                          </button>
                          <button onClick={cancelEditCat} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] border-0 cursor-pointer" title={bn ? 'বাতিল' : 'Cancel'}>
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEditCat(cat)} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)] border-0 cursor-pointer" title={bn ? 'সম্পাদনা' : 'Edit'}>
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(bn ? `ক্যাটাগরি মুছে ফেলতে চান? ${cat.entryCount} জন শিক্ষার্থীর ছাড় মুছে যাবে।` : `Delete this category? ${cat.entryCount} student waivers will be removed.`)) {
                                deleteWaiverCategory(cat.id)
                              }
                            }}
                            className="w-6 h-6 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Students View */
        <>
          {/* Filters */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={fSession} onChange={(e) => setFSession(e.target.value)} className={selectCls}>
                <option value="">{bn ? 'সব সেশন' : 'All Sessions'}</option>
                {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className={selectCls}>
                <option value="">{bn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
                {waiverCategories.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{bn ? c.nameBn || c.name : c.name}</option>)}
              </select>
              <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection('') }} className={selectCls}>
                <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
                {classOptions.map((c) => <option key={c} value={c}>{bn ? `শ্রেণি ${c}` : `Class ${c}`}</option>)}
              </select>
              <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={selectCls} disabled={!fClass}>
                <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
                {fClass && (sectionsMap[fClass] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder={bn ? 'শিক্ষার্থী খুঁজুন...' : 'Search students...'} value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} w-full pl-9 h-8 text-xs`} />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 mt-3">
            <span className="text-[0.65rem] text-[var(--text-muted)]">
              {selectedRows.size > 0
                ? `${selectedRows.size} ${bn ? 'নির্বাচিত' : 'selected'} / ${groupedStudents.length} ${bn ? 'শিক্ষার্থী' : 'students'}`
                : `${groupedStudents.length} ${bn ? 'শিক্ষার্থী' : 'students'}`}
            </span>
            {groupedStudents.length > 0 && (
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-[var(--brand)] border-none text-white text-[0.65rem] font-medium cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <MoreVertical size={12} />
                  {bn ? 'অ্যাকশন' : 'Action'}
                  <ChevronDown size={11} />
                </button>
                {showActionMenu && (
                  <div className="absolute top-full right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-[100] overflow-hidden">
                    <button
                      onClick={() => { exportExcel(); setShowActionMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors"
                    >
                      <FileSpreadsheet size={14} className="text-[var(--green)]" />
                      {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                    </button>
                    <div className="h-px bg-[var(--border)] mx-2" />
                    <button
                      onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors"
                    >
                      <FileText size={14} className="text-[var(--red)]" />
                      {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                    </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Grouped Table */}
          <div className="border border-[var(--border)] rounded-xl overflow-hidden mt-2">
            {groupedStudents.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                {bn ? 'কোনো ছাড় নেই' : 'No waivers found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)]">
                      <th className="w-8 px-2 py-2">
                        <ModernCheckbox checked={groupedStudents.length > 0 && selectedRows.size === groupedStudents.length} onChange={() => toggleAllRows()} color="brand" size="xs" />
                      </th>
                      <th className="w-8 px-2 py-2"></th>
                      <th className="w-10 px-2 py-2"></th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী আইডি' : 'Student ID'}</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ফি' : 'Fee'}</th>
                      <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'প্রতি মাসে' : 'Per Month'}</th>
                      <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'মোট ছাড়' : 'Total Waived'}</th>
                      <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কাজ' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedStudents.map((group, idx) => {
                      const isExpanded = expandedId === group.studentId
                      const firstEntry = group.entries[0]
                      const catName = firstEntry ? categoryMap[firstEntry.categoryId] : null
                      const feeNames = [...new Set(group.entries.map((e) => {
                        const s = structureMap[e.feeStructureId]
                        return s ? (bn ? s.nameBn || s.name : s.name) : '—'
                      }))]

                      let perMonthTotal = 0
                      for (const entry of group.entries) {
                        const struct = structures.find((s) => s.id === entry.feeStructureId)
                        if (!struct) continue
                        const perPeriod = entry.mode === 'percent' ? Math.round(struct.amount * entry.value / 100) : entry.value
                        perMonthTotal += perPeriod
                      }

                      return (
                        <React.Fragment key={group.studentId}>
                          <tr className={`border-t border-[var(--border)] transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]/40'} hover:bg-[var(--brand-light)]/50 ${selectedRows.has(group.studentId) ? 'bg-[var(--brand-light)]/20' : ''}`} onClick={() => setExpandedId(isExpanded ? null : group.studentId)}>
                            <td className="px-2 py-2">
                              <ModernCheckbox checked={selectedRows.has(group.studentId)} onChange={() => toggleRow(group.studentId)} onClick={(e) => e.stopPropagation()} color="brand" size="xs" />
                            </td>
                            <td className="px-2 py-2 text-[var(--text-muted)]">
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </td>
                            <td className="px-2 py-2">
                              <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden flex items-center justify-center flex-shrink-0">
                                {group.photo ? (
                                   <img src={group.photo} alt={group.studentName || 'Student'} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[11px] font-bold text-[var(--brand)]">{group.studentName.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-[0.65rem] font-mono text-[var(--text-muted)]">{group.studentId.slice(-6).toUpperCase()}</td>
                            <td className="px-3 py-2">
                              <p className="font-medium text-[var(--text-primary)]">{bn ? group.studentNameBn || group.studentName : group.studentName}</p>
                              <p className="text-[0.65rem] text-[var(--text-muted)]">Roll: {group.roll}</p>
                            </td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{group.class} - {group.section}</td>
                            <td className="px-3 py-2">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--purple-light)] text-[var(--purple)] text-[0.65rem] font-medium">
                                {catName ? (bn ? catName.nameBn || catName.name : catName.name) : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{feeNames.join(', ')}</td>
                            <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{fmt(perMonthTotal)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-[var(--purple)]">{fmt(group.totalWaived)}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-end">
                              <button onClick={(e) => { e.stopPropagation(); if (confirm(bn ? 'এই শিক্ষার্থীর সব ছাড় মুছে ফেলতে চান?' : 'Delete all waivers for this student?')) { group.entries.forEach((en) => { if (en.source === 'legacy') deleteWaiverEntry(en.originalId) }); const swForStudent = studentWaivers.filter((w) => w.studentId === group.studentId); swForStudent.forEach((w) => deleteStudentWaiver(w.id)) } }} className="w-7 h-7 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer hover:bg-[var(--red)] hover:text-white transition-colors">
                                <Trash2 size={13} />
                              </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={11} className="px-4 py-3 bg-[var(--bg-secondary)]/50">
                                <div className="space-y-1.5">
                                  {group.entries.map((entry) => {
                                    const struct = structureMap[entry.feeStructureId]
                                    let perPeriod = entry.mode === 'amount' ? entry.value : (struct ? Math.round(struct.amount * entry.value / 100) : 0)
                                    const months = entry.months.length > 0 ? entry.months : []
                                    const totalForEntry = months.length > 0 ? perPeriod * months.length : perPeriod
                                    const isEditing = editingEntryId === entry.id

                                    if (isEditing) {
                                      return (
                                        <div key={entry.id} className="p-2.5 rounded-lg bg-[var(--purple-light)]/20 border border-[var(--purple)]/30 space-y-2">
                                          <div className="flex items-center gap-3">
                                            <p className="text-[0.7rem] font-medium text-[var(--text-primary)] flex-1">
                                              {struct ? (bn ? struct.nameBn || struct.name : struct.name) : '—'}
                                            </p>
                                          </div>
                                          <div className="flex gap-2 items-center">
                                            <div className="flex gap-1">
                                              <button type="button" onClick={() => setEditMode('amount')} className={`px-2 py-0.5 rounded text-[0.6rem] font-medium border cursor-pointer transition-all ${editMode === 'amount' ? 'bg-[var(--purple)] text-white border-[var(--purple)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                                                {bn ? 'পরিমাণ' : 'Amount'}
                                              </button>
                                              <button type="button" onClick={() => setEditMode('percent')} className={`px-2 py-0.5 rounded text-[0.6rem] font-medium border cursor-pointer transition-all ${editMode === 'percent' ? 'bg-[var(--purple)] text-white border-[var(--purple)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'}`}>
                                                {bn ? 'শতাংশ' : 'Percent'}
                                              </button>
                                            </div>
                                            <input type="number" min="1" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-[26px] text-[0.65rem] px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--purple)] w-20" placeholder={editMode === 'percent' ? '%' : '৳'} />
                                            {editMode === 'percent' && <span className="text-[0.65rem] text-[var(--text-muted)]">%</span>}
                                          </div>
                                          <div className="flex gap-2">
                                            <input type="text" value={editReason} onChange={(e) => setEditReason(e.target.value)} className="h-[26px] text-[0.65rem] px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--purple)] flex-1" placeholder={bn ? 'কারণ (EN)' : 'Reason (EN)'} />
                                            <input type="text" value={editReasonBn} onChange={(e) => setEditReasonBn(e.target.value)} className="h-[26px] text-[0.65rem] px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--purple)] flex-1" placeholder={bn ? 'কারণ (BN)' : 'Reason (BN)'} />
                                          </div>
                                          <div className="flex gap-1.5 justify-end">
                                            <button type="button" onClick={cancelEditEntry} className="px-2 py-0.5 rounded text-[0.6rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-primary)]">{bn ? 'বাতিল' : 'Cancel'}</button>
                                            <button type="button" onClick={saveEditEntry} disabled={!editValue || Number(editValue) <= 0 || !editReason} className="px-2 py-0.5 rounded text-[0.6rem] font-medium bg-[var(--purple)] text-white border-0 cursor-pointer disabled:opacity-50">{bn ? 'সংরক্ষণ' : 'Save'}</button>
                                          </div>
                                        </div>
                                      )
                                    }

                                    return (
                                      <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                                        <div className="flex-1">
                                          <p className="text-[0.7rem] font-medium text-[var(--text-primary)]">
                                            {struct ? (bn ? struct.nameBn || struct.name : struct.name) : '—'}
                                          </p>
                                          <p className="text-[0.6rem] text-[var(--text-muted)]">
                                            {entry.mode === 'amount'
                                              ? `${fmt(entry.value)} ${bn ? 'প্রতি মাসে' : 'per month'}`
                                              : `${entry.value}% = ${fmt(perPeriod)} ${bn ? 'প্রতি মাসে' : 'per month'}`
                                            }
                                          </p>
                                          {entry.reason && <p className="text-[0.55rem] text-[var(--text-muted)] italic">{bn ? `কারণ: ${entry.reasonBn || entry.reason}` : `Reason: ${entry.reason}`}</p>}
                                        </div>
                                        {months.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {months.sort((a, b) => a - b).map((m) => (
                                              <span key={m} className="inline-block px-1.5 py-0.5 rounded bg-[var(--purple-light)] text-[var(--purple)] text-[0.55rem] font-medium">
                                                {bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        <span className="text-[0.7rem] font-semibold text-[var(--purple)]">{fmt(totalForEntry)}</span>
                                        <button onClick={(e) => { e.stopPropagation(); startEditEntry(entry) }} className="w-5 h-5 rounded flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--brand)] border-0 cursor-pointer transition-colors">
                                          <Edit2 size={10} />
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle={bn ? 'ছাড়ের তালিকা' : 'Waivers List'}
          defaultTitleBn={bn ? 'ছাড়ের তালিকা' : 'Waivers List'}
          recordLabel={bn ? 'শিক্ষার্থী' : 'student'}
          recordLabelBn={bn ? 'শিক্ষার্থী' : 'student'}
          count={exportData.length}
          isBn={bn}
          onDownload={handlePdfDownload}
          onClose={() => setShowPdfModal(false)}
          previewRenderer={pdfPreviewRenderer}
        />
      )}
    </div>
  )
})
