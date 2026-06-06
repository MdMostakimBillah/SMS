import { useState, useMemo, useCallback } from 'react'
import { Download, CheckCircle, IdCard } from 'lucide-react'
import QRCode from 'qrcode'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import type { ExamConfig, SubjectMarkConfig, ExamRoutine } from '@/store/examStore'
import { sectionCls, sectionTitleCls, inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { generateAdmitCardHTML } from './pdfTemplates/admitCard'
import type { StudentAdmission } from '@/pages/students/admission/types'

interface AdmitCardsTabProps {
  students: StudentAdmission[]
  selectedExamId: string
  examConfigs: ExamConfig[]
  routines: ExamRoutine[]
  subjectMarkConfigs: SubjectMarkConfig[]
}

export default function AdmitCardsTab({
  students,
  selectedExamId,
  examConfigs,
  routines,
  subjectMarkConfigs,
}: AdmitCardsTabProps) {
  const isBn = useBn()
  const subjects = useTeacherStore((s) => s.subjects)

  const { classes } = useClassStore()
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [acClassId, setAcClassId] = useState('')
  const [acSectionId, setAcSectionId] = useState('')
  const [acSearch, setAcSearch] = useState('')
  const [acSelected, setAcSelected] = useState<Set<string>>(new Set())

  const acFilteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== 'approved') return false
      if (acClassId && s.class !== acClassId) return false
      if (acSectionId && s.section !== acSectionId) return false
      if (acSearch) {
        const q = acSearch.toLowerCase()
        if (!s.nameEn.toLowerCase().includes(q) && !s.nameBn.includes(acSearch) && !s.id.toLowerCase().includes(q) && !(s.roll || '').includes(acSearch)) return false
      }
      return true
    })
  }, [students, acClassId, acSectionId, acSearch])

  const subjectMap = useMemo(() => {
    const map = new Map<string, (typeof subjects)[0]>()
    for (const s of subjects) map.set(s.id, s)
    return map
  }, [subjects])

  const printAdmitCards = useCallback(async () => {
    if (!selectedExamId || acSelected.size === 0) return
    const exam = examConfigs.find((e) => e.id === selectedExamId)
    if (!exam) return
    const inst = useClassStore.getState().institution
    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#4f46e5'

    const selectedStudents = students.filter((s) => acSelected.has(s.id))

    const qrUrls: Record<string, string> = {}
    await Promise.all(
      selectedStudents.map(async (s) => {
        qrUrls[s.id] = await QRCode.toDataURL(s.id, { width: 120, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } })
      })
    )

    const cardsHTML = generateAdmitCardHTML(selectedStudents, exam, inst, subjectMap, subjectMarkConfigs, routines, qrUrls, isBn, brandColor)

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Admit Cards - ${isBn ? exam.nameBn : exam.name}</title>
<style>
  @page{size:A4 portrait;margin:8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f1f5f9;padding:10px}
  @media print{body{background:#fff;padding:0} *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}}
</style></head><body>${cardsHTML}<script>setTimeout(()=>window.print(),600)</script></body></html>`)
    win.document.close()
  }, [selectedExamId, acSelected, students, examConfigs, routines, subjectMarkConfigs, subjectMap, isBn])

  return (
    <>
      {/* Controls */}
      <div className={sectionCls}>
        <div className={sectionTitleCls}>
          <IdCard size={15} className="text-[var(--brand)]" />
          {isBn ? 'পরীক্ষার প্রবেশপত্র' : 'Exam Admit Cards'}
        </div>
        <div className="flex flex-wrap items-end gap-3 mt-3">
          <div className="flex-1 min-w-[10rem]">
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
            <select value={acClassId} onChange={(e) => { setAcClassId(e.target.value); setAcSectionId(''); setAcSelected(new Set()) }} className={selectCls + ' w-full'}>
              <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
              {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[10rem]">
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
            <select value={acSectionId} onChange={(e) => { setAcSectionId(e.target.value); setAcSelected(new Set()) }} className={selectCls + ' w-full'} disabled={!acClassId}>
              <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
              {(sectionsMap[acClassId] || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[10rem]">
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'অনুসন্ধান' : 'Search'}</label>
            <input value={acSearch} onChange={(e) => setAcSearch(e.target.value)} className={inputCls + ' w-full'} placeholder={isBn ? 'নাম, আইডি, রোল...' : 'Name, ID, Roll...'} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (acSelected.size === acFilteredStudents.length) {
                  setAcSelected(new Set())
                } else {
                  setAcSelected(new Set(acFilteredStudents.map((s) => s.id)))
                }
              }}
              className={`${btnPrimary} bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]`}
            >
              {acSelected.size === acFilteredStudents.length ? (isBn ? 'বাদ দিন' : 'Deselect All') : (isBn ? 'সব নির্বাচন' : 'Select All')}
            </button>
            <button
              onClick={() => {
                if (acSelected.size === 0) return
                printAdmitCards()
              }}
              disabled={acSelected.size === 0}
              className={`${btnPrimary} ${acSelected.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Download size={13} />
              {isBn ? `প্রিন্ট (${acSelected.size})` : `Print (${acSelected.size})`}
            </button>
          </div>
        </div>
      </div>

      {/* Student Grid */}
      {acFilteredStudents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {acFilteredStudents.map((student) => {
            const isSelected = acSelected.has(student.id)
            return (
              <div
                key={student.id}
                onClick={() => {
                  setAcSelected((prev) => {
                    const next = new Set(prev)
                    if (next.has(student.id)) next.delete(student.id)
                    else next.add(student.id)
                    return next
                  })
                }}
                className={`rounded-lg p-2.5 border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--brand-light)] border-[var(--brand)]/30 ring-1 ring-[var(--brand)]/20'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--brand)]/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: isSelected ? 'var(--brand)' : 'var(--border)', background: isSelected ? 'var(--brand)' : 'transparent' }}>
                    {isSelected && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">{student.nameEn}</div>
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{student.class}-{student.section} · Roll {student.roll || '-'}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={`${sectionCls} text-center py-10`}>
          <IdCard size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
          <p className="text-[0.8125rem] text-[var(--text-muted)]">
            {isBn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}
          </p>
        </div>
      )}
    </>
  )
}
