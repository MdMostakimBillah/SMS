import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Award, FileText, CheckCircle,
  Users, GraduationCap, Eye, X,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'

const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] mb-[14px]'
const sectionTitleCls = 'flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]'
const inputCls = 'h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border'
const btnPrimary = 'flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]'

type SubTab = 'marksheets' | 'cumulative' | 'promotion'

export default function Step5Marksheet() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { classes } = useClassStore()
  const students = useSessionStudents()
  const isBn = language === 'bn'

  const examConfigs = useExamStore(s => s.examConfigs)
  const subjectMarkConfigs = useExamStore(s => s.subjectMarkConfigs)
  const studentMarks = useExamStore(s => s.studentMarks)
  const marksheetConfigs = useExamStore(s => s.marksheetConfigs)
  const cumulativeSheets = useExamStore(s => s.cumulativeSheets)
  const promotions = useExamStore(s => s.promotions)
  const addMarksheetConfig = useExamStore(s => s.addMarksheetConfig)
  const deleteMarksheetConfig = useExamStore(s => s.deleteMarksheetConfig)
  const toggleMarksheetPublished = useExamStore(s => s.toggleMarksheetPublished)
  const addCumulativeSheet = useExamStore(s => s.addCumulativeSheet)
  const toggleCumulativePublished = useExamStore(s => s.toggleCumulativePublished)
  const deleteCumulativeSheet = useExamStore(s => s.deleteCumulativeSheet)
  const bulkPromote = useExamStore(s => s.bulkPromote)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('promotion')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find(e => e.isActive)?.id || '')

  // Marksheet form
  const [showMarksheetForm, setShowMarksheetForm] = useState(false)
  const [marksheetForm, setMarksheetForm] = useState({ name: '', nameBn: '', examId: '', sessionId: '2025-26', headSubjectId: '', workingDays: '120', schoolName: 'EduTech International School', schoolNameBn: 'এডুটেক ইন্টারন্যাশনাল স্কুল', schoolAddress: 'Dhaka, Bangladesh' })

  // Promotion
  const [promoClassId, setPromoClassId] = useState('')
  const [promoSectionId, setPromoSectionId] = useState('')
  const [showPromoConfirm, setShowPromoConfirm] = useState(false)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const promoSectionOptions = useMemo(() => promoClassId ? (sectionsMap[promoClassId] || []) : [], [promoClassId, sectionsMap])

  const promoStudents = useMemo(() => {
    if (!promoClassId || !promoSectionId) return []
    return students.filter(s => s.status === 'approved' && s.class === promoClassId && s.section === promoSectionId)
  }, [students, promoClassId, promoSectionId])

  // Promotion eligibility
  const promotionData = useMemo(() => {
    if (!selectedExamId || !promoClassId || !promoSectionId) return []
    const examSubjects = subjectMarkConfigs.filter(s => s.examId === selectedExamId && s.classId === promoClassId)
    return promoStudents.map(student => {
      const subjectResults = examSubjects.map(sc => {
        const mark = studentMarks.find(m =>
          m.examId === selectedExamId && m.studentId === student.id &&
          m.subjectId === sc.subjectId && m.classId === promoClassId && m.sectionId === promoSectionId
        )
        return { obtained: mark?.totalMarks || 0, full: sc.fullMarks, passed: (mark?.totalMarks || 0) >= sc.passMarks }
      })
      const totalObtained = subjectResults.reduce((a, b) => a + b.obtained, 0)
      const totalFull = subjectResults.reduce((a, b) => a + b.full, 0)
      const percentage = totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0
      const passedAll = subjectResults.every(s => s.passed)
      const grade = percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' : percentage >= 60 ? 'A-' : percentage >= 50 ? 'B' : percentage >= 40 ? 'C' : percentage >= 33 ? 'D' : 'F'
      const existingPromo = promotions.find(p => p.studentId === student.id && p.examId === selectedExamId)
      return { student, totalObtained, totalFull, percentage, passedAll, grade, status: existingPromo?.status || (passedAll ? 'eligible' : 'not-eligible') }
    }).sort((a, b) => b.totalObtained - a.totalObtained)
  }, [selectedExamId, promoClassId, promoSectionId, promoStudents, subjectMarkConfigs, studentMarks, promotions])

  const promoStats = useMemo(() => {
    const total = promotionData.length
    const eligible = promotionData.filter(p => p.status === 'eligible' || p.status === 'promoted').length
    const promoted = promotionData.filter(p => p.status === 'promoted').length
    const notEligible = promotionData.filter(p => p.status === 'not-eligible' || p.status === 'detained').length
    return { total, eligible, promoted, notEligible }
  }, [promotionData])

  const handleBulkPromote = () => {
    const eligibleStudents = promotionData.filter(p => p.status === 'eligible')
    if (eligibleStudents.length === 0) return
    const nextClassNum = parseInt(promoClassId.replace('Class-', '')) + 1
    const newPromotions = eligibleStudents.map(p => ({
      examId: selectedExamId,
      studentId: p.student.id,
      fromClass: promoClassId,
      fromSection: promoSectionId,
      toClass: `Class-${nextClassNum}`,
      toSection: promoSectionId,
      status: 'promoted' as const,
      totalMarks: p.totalFull,
      obtainedMarks: p.totalObtained,
      percentage: p.percentage,
      grade: p.grade,
      promotedAt: new Date().toISOString(),
      promotedBy: 'Admin',
    }))
    bulkPromote(newPromotions)
    setShowPromoConfirm(false)
  }

  const handleSaveMarksheet = () => {
    if (!marksheetForm.name || !marksheetForm.examId) return
    addMarksheetConfig({
      ...marksheetForm,
      nameBn: marksheetForm.nameBn || marksheetForm.name,
      headSubjectId: marksheetForm.headSubjectId || 'SUB-001',
      workingDays: Number(marksheetForm.workingDays) || 120,
      logo: '', footer: 'This is a system-generated marksheet.', footerBn: 'এটি একটি সিস্টেম-জেনারেটেড মার্কশিট।',
      isPublished: false,
    })
    setShowMarksheetForm(false)
    setMarksheetForm({ name: '', nameBn: '', examId: '', sessionId: '2025-26', headSubjectId: '', workingDays: '120', schoolName: 'EduTech International School', schoolNameBn: 'এডুটেক ইন্টারন্যাশনাল স্কুল', schoolAddress: 'Dhaka, Bangladesh' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/exams')} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text-primary)]">{isBn ? 'ধাপ ৫: মার্কশিট ও প্রমোশন' : 'Step 5: Marksheet & Promotion'}</h1>
            <p className="text-[11px] text-[var(--text-muted)]">{isBn ? 'মার্কশিট তৈরি, কিউমুলেটিভ ও শিক্ষার্থী প্রমোশন' : 'Marksheet, cumulative & student promotion'}</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {([
          { key: 'marksheets' as SubTab, label: isBn ? 'মার্কশিট' : 'Marksheets', icon: <FileText size={14} /> },
          { key: 'cumulative' as SubTab, label: isBn ? 'কিউমুলেটিভ' : 'Cumulative', icon: <Award size={14} /> },
          { key: 'promotion' as SubTab, label: isBn ? 'প্রমোশন' : 'Promotion', icon: <GraduationCap size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeSubTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ═══ MARKSHEETS TAB ═══ */}
        {activeSubTab === 'marksheets' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{marksheetConfigs.length} {isBn ? 'টি মার্কশিট' : 'marksheets'}</span>
              <button onClick={() => setShowMarksheetForm(true)} className={btnPrimary}><Plus size={14} />{isBn ? 'নতুন মার্কশিট' : 'New Marksheet'}</button>
            </div>
            <div className="space-y-3">
              {marksheetConfigs.map(ms => {
                const exam = examConfigs.find(e => e.id === ms.examId)
                return (
                  <div key={ms.id} className={`${sectionCls} transition-all hover:shadow-sm`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={14} className="text-[var(--brand)]" />
                          <span className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? ms.nameBn : ms.name}</span>
                          {ms.isPublished && <span className="text-[9px] py-[2px] px-[5px] rounded font-medium bg-[var(--green-light)] text-[var(--green)]">{isBn ? 'প্রকাশিত' : 'Published'}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] flex-wrap">
                          <span>{isBn ? 'পরীক্ষা' : 'Exam'}: {isBn ? exam?.nameBn : exam?.name}</span>
                          <span>{isBn ? 'সেশন' : 'Session'}: {ms.sessionId}</span>
                          <span>{isBn ? 'কার্যদিবস' : 'Working Days'}: {ms.workingDays}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => toggleMarksheetPublished(ms.id)}
                          className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer ${ms.isPublished ? 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                          {ms.isPublished ? <CheckCircle size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteMarksheetConfig(ms.id) }}
                          className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {marksheetConfigs.length === 0 && (
                <div className={`${sectionCls} text-center py-10`}>
                  <FileText size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                  <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'কোনো মার্কশিট নেই' : 'No marksheets created'}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ CUMULATIVE TAB ═══ */}
        {activeSubTab === 'cumulative' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{cumulativeSheets.length} {isBn ? 'টি কিউমুলেটিভ' : 'cumulative sheets'}</span>
              <button onClick={() => {
                if (!selectedExamId) return
                addCumulativeSheet({ name: 'Cumulative Marksheet', nameBn: 'কিউমুলেটিভ মার্কশিট', examIds: [selectedExamId], sessionId: '2025-26', classId: 'Class-1', isPublished: false })
              }} className={btnPrimary} disabled={!selectedExamId}><Plus size={14} />{isBn ? 'নতুন কিউমুলেটিভ' : 'New Cumulative'}</button>
            </div>
            <div className="space-y-3">
              {cumulativeSheets.map(cs => (
                <div key={cs.id} className={`${sectionCls} transition-all hover:shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Award size={14} className="text-[var(--purple)]" />
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? cs.nameBn : cs.name}</span>
                        {cs.isPublished && <span className="text-[9px] py-[2px] px-[5px] rounded font-medium bg-[var(--green-light)] text-[var(--green)]">{isBn ? 'প্রকাশিত' : 'Published'}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                        <span>{cs.examIds.length} {isBn ? 'টি পরীক্ষা' : 'exams'}</span>
                        <span>{cs.sessionId}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleCumulativePublished(cs.id)}
                        className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer ${cs.isPublished ? 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                        {cs.isPublished ? <CheckCircle size={12} /> : <Eye size={12} />}
                      </button>
                      <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteCumulativeSheet(cs.id) }}
                        className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cumulativeSheets.length === 0 && (
                <div className={`${sectionCls} text-center py-10`}>
                  <Award size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                  <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'কোনো কিউমুলেটিভ মার্কশিট নেই' : 'No cumulative marksheets'}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ PROMOTION TAB ═══ */}
        {activeSubTab === 'promotion' && (
          <>
            {/* Selector */}
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <GraduationCap size={15} className="text-[var(--brand)]" />{isBn ? 'প্রমোশন নির্বাচন' : 'Promotion Selection'}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
                  <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {examConfigs.map(e => <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বর্তমান শ্রেণি' : 'From Class'}</label>
                  <select value={promoClassId} onChange={e => { setPromoClassId(e.target.value); setPromoSectionId('') }} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select value={promoSectionId} onChange={e => setPromoSectionId(e.target.value)} className={`${inputCls} w-full`} disabled={!promoClassId}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {promoSectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats */}
            {promotionData.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-3">
                {[
                  { label: isBn ? 'মোট' : 'Total', value: promoStats.total, color: 'var(--brand)' },
                  { label: isBn ? 'যোগ্য' : 'Eligible', value: promoStats.eligible, color: 'var(--green)' },
                  { label: isBn ? 'প্রমোটেড' : 'Promoted', value: promoStats.promoted, color: 'var(--teal)' },
                  { label: isBn ? 'অযোগ্য' : 'Not Eligible', value: promoStats.notEligible, color: 'var(--red)' },
                ].map(s => (
                  <div key={s.label} className={sectionCls} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15`, color: s.color }}>
                      <GraduationCap size={14} />
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-[var(--text-primary)]">{s.value}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Promote Button */}
            {promoStats.eligible > 0 && promoStats.promoted === 0 && (
              <div className="mb-3">
                <button onClick={() => setShowPromoConfirm(true)} className={`${btnPrimary}`}>
                  <GraduationCap size={14} />{isBn ? `${promoStats.eligible} জনকে প্রমোট করুন` : `Promote ${promoStats.eligible} Students`}
                </button>
              </div>
            )}

            {/* Student List */}
            {promotionData.length > 0 && (
              <div className={sectionCls}>
                <div className={sectionTitleCls}>
                  <Users size={15} className="text-[var(--teal)]" />{isBn ? 'শিক্ষার্থীদের তালিকা' : 'Student List'} ({promotionData.length})
                </div>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] w-8">#</th>
                        <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                        <th className="py-2 px-2 text-center text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'মোট' : 'Total'}</th>
                        <th className="py-2 px-2 text-center text-[10px] font-semibold text-[var(--text-muted)]">%</th>
                        <th className="py-2 px-2 text-center text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'গ্রেড' : 'Grade'}</th>
                        <th className="py-2 px-2 text-center text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'অবস্থা' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promotionData.map((row, idx) => (
                        <tr key={row.student.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                          <td className="py-2 px-2 text-[var(--text-muted)]">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <div className="text-[11px] font-medium text-[var(--text-primary)]">{isBn ? row.student.nameBn || row.student.nameEn : row.student.nameEn}</div>
                            <div className="text-[9px] text-[var(--text-muted)]">{row.student.id}</div>
                          </td>
                          <td className="py-2 px-2 text-center text-[12px] font-bold text-[var(--text-primary)]">{row.totalObtained}/{row.totalFull}</td>
                          <td className="py-2 px-2 text-center text-[11px] font-medium text-[var(--text-secondary)]">{row.percentage}%</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              row.grade === 'A+' ? 'bg-[#dcfce7] text-[#15803d]' :
                              row.grade === 'A' || row.grade === 'A-' ? 'bg-[#dbeafe] text-[#1d4ed8]' :
                              row.grade === 'B' || row.grade === 'C' ? 'bg-[var(--amber-light)] text-[var(--amber)]' :
                              'bg-[var(--red-light)] text-[var(--red)]'
                            }`}>{row.grade}</span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                              row.status === 'promoted' ? 'bg-[var(--teal-light)] text-[var(--teal)]' :
                              row.status === 'eligible' ? 'bg-[var(--green-light)] text-[var(--green)]' :
                              'bg-[var(--red-light)] text-[var(--red)]'
                            }`}>
                              {row.status === 'promoted' ? (isBn ? 'প্রমোটেড' : 'Promoted') :
                               row.status === 'eligible' ? (isBn ? 'যোগ্য' : 'Eligible') :
                               (isBn ? 'অযোগ্য' : 'Not Eligible')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {promotionData.length === 0 && promoClassId && promoSectionId && (
              <div className={`${sectionCls} text-center py-10`}>
                <GraduationCap size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'এই সেকশনে কোনো শিক্ষার্থী নেই' : 'No students in this section'}</p>
              </div>
            )}

            {!promoClassId && (
              <div className={`${sectionCls} text-center py-10`}>
                <GraduationCap size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'পরীক্ষা, শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select exam, class and section'}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ Marksheet Form Modal ═══ */}
      {showMarksheetForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[420px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? 'নতুন মার্কশিট' : 'New Marksheet'}</h3>
              <button onClick={() => setShowMarksheetForm(false)} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (ইংরেজি)' : 'Name'}</label>
                  <input value={marksheetForm.name} onChange={e => setMarksheetForm(p => ({ ...p, name: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
                  <input value={marksheetForm.nameBn} onChange={e => setMarksheetForm(p => ({ ...p, nameBn: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
                <select value={marksheetForm.examId} onChange={e => setMarksheetForm(p => ({ ...p, examId: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {examConfigs.map(e => <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেশন' : 'Session'}</label>
                  <input value={marksheetForm.sessionId} onChange={e => setMarksheetForm(p => ({ ...p, sessionId: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কার্যদিবস' : 'Working Days'}</label>
                  <input type="number" value={marksheetForm.workingDays} onChange={e => setMarksheetForm(p => ({ ...p, workingDays: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'স্কুলের নাম' : 'School Name'}</label>
                <input value={marksheetForm.schoolName} onChange={e => setMarksheetForm(p => ({ ...p, schoolName: e.target.value }))} className={`${inputCls} w-full`} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowMarksheetForm(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleSaveMarksheet} className={`${btnPrimary} text-[12px]`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Promotion Confirmation Modal ═══ */}
      {showPromoConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[400px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--green-light)] flex items-center justify-center">
                <GraduationCap size={20} className="text-[var(--green)]" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? 'প্রমোশন নিশ্চিত করুন' : 'Confirm Promotion'}</h3>
                <p className="text-[11px] text-[var(--text-muted)]">{isBn ? 'এই কাজটি অপরিবর্তনীয়' : 'This action cannot be undone'}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] mb-4">
              <div className="text-[12px] text-[var(--text-primary)]">
                <span className="font-semibold">{promoStats.eligible}</span> {isBn ? 'জন শিক্ষার্থীকে' : 'students'} <span className="font-semibold text-[var(--green)]">{isBn ? 'প্রমোট' : 'promote'}</span> {isBn ? 'করা হবে' : 'to'} <span className="font-semibold">Class-{promoClassId ? parseInt(promoClassId.replace('Class-', '')) + 1 : '?'}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPromoConfirm(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleBulkPromote} className="flex items-center gap-1.5 py-[7px] px-[14px] rounded-lg bg-[var(--green)] border-none text-white text-[12px] font-medium cursor-pointer">
                <CheckCircle size={13} />{isBn ? 'প্রমোট করুন' : 'Promote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
