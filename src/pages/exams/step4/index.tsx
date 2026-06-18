import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  BarChart2,
  Award,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  FileSpreadsheet,
  RotateCw,
  Download,
  ArrowUpDown,
  X,
  Save,
  ClipboardCheck,
  Shield,
  BookOpen,
  Star,
  Heart,
  Zap,
  Coffee,
  Music,
  Settings,
  Search,
  Edit,
  Edit3,
  GraduationCap,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap, extractClassNumber } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'
import { sectionCls, sectionTitleCls, inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { downloadHTML } from '@/lib/pdf'
import { TabulationPDFOptionsModal } from '@/components/shared/TabulationPDFOptionsModal'
import type { TabulationPdfOptions } from '@/pages/exams/step4/tabulationPdfTemplate'
import { generateTabulationPDF } from '@/pages/exams/step4/tabulationPdfTemplate'
import { MarkAdjustmentTab } from '@/pages/exams/step4/MarkAdjustmentTab'
import MarksheetTab from '@/pages/exams/step4/MarksheetTab'
import CumulativeMarkSheetTab from '@/pages/exams/step4/CumulativeMarkSheetTab'

type SubTab = 'extra-marks' | 'tabulation' | 'analysis' | 'position' | 'mark-adjustment' | 'marksheet' | 'cumulative-marksheet'

export default function Step4Results() {
  const navigate = useNavigate()
  const subjects = useTeacherStore((s) => s.subjects)
  const { classes, institution } = useClassStore()
  const currentSession = institution.currentSession
  const students = useSessionStudents()
  const isBn = useBn()

  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const examConfigs = useMemo(() => allExamConfigs.filter((e) => e.session === currentSession), [allExamConfigs, currentSession])
  const studentMarks = useExamStore((s) => s.studentMarks)
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const extraMarks = useExamStore((s) => s.extraMarks)
  const extraMarkTypes = useExamStore((s) => s.extraMarkTypes)
  const updateExtraMarkType = useExamStore((s) => s.updateExtraMarkType)
  const deleteExtraMarkType = useExamStore((s) => s.deleteExtraMarkType)
  const setMarkAdjustments = useExamStore((s) => s.setMarkAdjustments)
  const clearMarkAdjustments = useExamStore((s) => s.clearMarkAdjustments)
  const attendances = useExamStore((s) => s.attendances)

  const sessionExamIds = useMemo(() => new Set(examConfigs.map((e) => e.id)), [examConfigs])
  const sessionStudentMarks = useMemo(() => studentMarks.filter((m) => sessionExamIds.has(m.examId)), [studentMarks, sessionExamIds])
  const sessionSubjectMarkConfigs = useMemo(() => subjectMarkConfigs.filter((s) => sessionExamIds.has(s.examId)), [subjectMarkConfigs, sessionExamIds])
  const sessionExtraMarks = useMemo(() => extraMarks.filter((e) => sessionExamIds.has(e.examId)), [extraMarks, sessionExamIds])
  const addExtraMark = useExamStore((s) => s.addExtraMark)
  const bulkAddExtraMarks = useExamStore((s) => s.bulkAddExtraMarks)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('tabulation')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find((e) => e.isActive)?.id || '')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [rotateHeaders, setRotateHeaders] = useState(false)
  const [sortMode, setSortMode] = useState<'roll' | 'rank'>('roll')

  // PDF download modal
  const [showPdfModal, setShowPdfModal] = useState(false)

  // Table selection
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllStudents = () => {
    if (selectedStudents.size === tabulationData.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(tabulationData.map((d) => d.student.id)))
    }
  }

  // Auto-select active exam when examConfigs load/change
  useEffect(() => {
    if (!selectedExamId && examConfigs.length > 0) {
      const active = examConfigs.find((e) => e.isActive)
      if (active) setSelectedExamId(active.id)
    }
  }, [examConfigs, selectedExamId])

  // Extra marks form
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [showTypeManager, setShowTypeManager] = useState(false)
  const [showAddTypeForm, setShowAddTypeForm] = useState(false)
  const [editingType, setEditingType] = useState<string | null>(null)
  const [extraForm, setExtraForm] = useState({
    studentId: '',
    studentSearch: '',
    showSuggestions: false,
    typeId: '',
    marks: '0',
    maxMarks: '10',
    note: '',
  })

  // Extra marks filter & multi-select
  const [extraSelectedStudents, setExtraSelectedStudents] = useState<Set<string>>(new Set())
  const [extraSelectAll, setExtraSelectAll] = useState(false)
  const [extraBulkType, setExtraBulkType] = useState('')
  const [extraBulkMarks, setExtraBulkMarks] = useState('5')
  const [extraBulkMaxMarks, setExtraBulkMaxMarks] = useState('10')
  const [extraBulkNote, setExtraBulkNote] = useState('')
  
  // Attendance mode for Extra Marks tab (auto from attendance data or manual)
  const [extraAttMode, setExtraAttMode] = useState<'auto' | 'manual'>('auto')

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (selectedClassId ? sectionsMap[selectedClassId] || [] : []), [selectedClassId, sectionsMap])

  const classStudents = useMemo(() => {
    if (!selectedClassId || !selectedSectionId) return []
    return students.filter((s) => s.status === 'approved' && s.active !== false && s.class === selectedClassId && s.section === selectedSectionId)
  }, [students, selectedClassId, selectedSectionId])

  // Extra marks filtered students (uses top-level class/section filters)
  const extraFilteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status && s.status !== 'approved') return false
      if (s.active === false) return false
      if (selectedClassId && s.class !== selectedClassId) return false
      if (selectedSectionId && s.section !== selectedSectionId) return false
      return true
    })
  }, [students, selectedClassId, selectedSectionId])

  // Auto-calculated attendance marks per student for Extra Marks tab
  const autoAttMarksMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!selectedExamId || !selectedClassId || !selectedSectionId) return map
    
    // Find the Attendance extra mark type
    const attType = extraMarkTypes.find((t) => t.isActive && (t.name === 'Attendance' || t.nameBn === 'উপস্থিতি'))
    if (!attType) return map
    
    // Get attendance records for this exam/class/section
    const examAttendances = attendances.filter(
      (a) => a.examId === selectedExamId && a.classId === selectedClassId && a.sectionId === selectedSectionId
    )
    
    extraFilteredStudents.forEach((student) => {
      const studentAtts = examAttendances.filter((a) => a.studentId === student.id)
      const totalDays = studentAtts.length
      const presentDays = studentAtts.filter((a) => a.status === 'present' || a.status === 'late').length
      // Attendance marks = (present / total) * maxMarks
      const marks = totalDays > 0 ? Math.round((presentDays / totalDays) * attType.defaultMaxMarks) : 0
      map.set(student.id, marks)
    })
    
    return map
  }, [attendances, selectedExamId, selectedClassId, selectedSectionId, extraFilteredStudents, extraMarkTypes])

  const handleExtraSelectAll = () => {
    if (extraSelectAll) {
      setExtraSelectedStudents(new Set())
    } else {
      setExtraSelectedStudents(new Set(extraFilteredStudents.map((s) => s.id)))
    }
    setExtraSelectAll(!extraSelectAll)
  }

  const handleExtraToggleStudent = (id: string) => {
    setExtraSelectedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExtraBulkApply = () => {
    if (extraSelectedStudents.size === 0 || !extraBulkType || !selectedExamId) return
    const entries = Array.from(extraSelectedStudents).map((studentId) => ({
      examId: selectedExamId,
      studentId,
      classId: selectedClassId,
      sectionId: selectedSectionId,
      typeId: extraBulkType,
      marks: Number(extraBulkMarks) || 0,
      maxMarks: Number(extraBulkMaxMarks) || 10,
      note: extraBulkNote,
    }))
    bulkAddExtraMarks(entries)
    setExtraSelectedStudents(new Set())
    setExtraSelectAll(false)
    setExtraBulkNote('')
  }

  // Get selected section's subjectIds from Classes store
  const sectionSubjectIds = useMemo(() => {
    if (!selectedClassId || !selectedSectionId) return null
    const cls = classes.find((c) => extractClassNumber(c.name) === selectedClassId || c.name === selectedClassId)
    if (!cls) return null
    const section = cls.sections.find((s) => s.name === selectedSectionId)
    if (!section || !section.subjectIds || section.subjectIds.length === 0) return null
    return section.subjectIds
  }, [classes, selectedClassId, selectedSectionId])

  // Tabulation data
  const tabulationData = useMemo(() => {
    if (!selectedExamId || !selectedClassId || !selectedSectionId) return []
    const allExamSubjects = sessionSubjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === selectedClassId)
    // Filter by section's subjectIds if available (group-based sections like Humanity, Science, Commerce)
    const examSubjects = sectionSubjectIds
      ? allExamSubjects.filter((s) => sectionSubjectIds.includes(s.subjectId))
      : allExamSubjects
    return classStudents
      .map((student) => {
        const subjectMarks = examSubjects.map((sc) => {
          const mark = sessionStudentMarks.find(
            (m) =>
              m.examId === selectedExamId &&
              m.studentId === student.id &&
              m.subjectId === sc.subjectId &&
              m.classId === selectedClassId &&
              m.sectionId === selectedSectionId
          )
          const subject = subjects.find((s) => s.id === sc.subjectId)
          return {
            subjectId: sc.subjectId,
            subjectName: isBn ? subject?.nameBn : subject?.name,
            fullMarks: sc.fullMarks,
            passMarks: sc.passMarks,
            obtained: mark?.totalMarks || 0,
            grade: mark?.grade || '-',
            passed: (mark?.totalMarks || 0) >= sc.passMarks,
            subExams: sc.subExams || [],
            subExamMarks: mark?.subExamMarks || {},
          }
        })
        const totalObtained = subjectMarks.reduce((a, b) => a + b.obtained, 0)
        const totalFull = subjectMarks.reduce((a, b) => a + b.fullMarks, 0)
        const percentage = totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0
        const passedAll = subjectMarks.every((s) => s.passed)
        const gpa = passedAll
          ? percentage >= 80
            ? 5.0
            : percentage >= 70
              ? 4.0
              : percentage >= 60
                ? 3.5
                : percentage >= 50
                  ? 3.0
                  : percentage >= 40
                    ? 2.0
                    : percentage >= 33
                      ? 1.0
                      : 0
          : 0
        return { student, subjectMarks, totalObtained, totalFull, percentage, passedAll, gpa }
      })
      .sort((a, b) => (a.student.roll || '').localeCompare(b.student.roll || ''))
  }, [selectedExamId, selectedClassId, selectedSectionId, sectionSubjectIds, classStudents, sessionSubjectMarkConfigs, sessionStudentMarks, subjects, isBn])

  // Position check
  const positionCheck = useMemo(() => {
    const duplicates: { position: number; count: number; students: string[] }[] = []
    const positionMap = new Map<number, string[]>()
    tabulationData.forEach((d, i) => {
      const pos = i + 1
      const existing = positionMap.get(pos) || []
      existing.push(d.student.nameEn)
      positionMap.set(pos, existing)
    })
    positionMap.forEach((stuList, pos) => {
      if (stuList.length > 1) {
        duplicates.push({ position: pos, count: stuList.length, students: stuList })
      }
    })
    return duplicates
  }, [tabulationData])

  // Class rank, section rank, average per student
  const enrichedTabulationData = useMemo(() => {
    // Class rank: rank among ALL students of this class (all sections) — raw marks only
    const allClassStudents = tabulationData.length > 0
      ? students
          .filter((s) => s.status === 'approved' && s.active !== false && s.class === selectedClassId)
          .map((student) => {
            const subjectMarks = (sessionSubjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === selectedClassId))
              .filter((sc) => !sectionSubjectIds || sectionSubjectIds.includes(sc.subjectId))
              .map((sc) => {
                const mark = sessionStudentMarks.find(
                  (m) => m.examId === selectedExamId && m.studentId === student.id && m.subjectId === sc.subjectId && m.classId === selectedClassId && m.sectionId === student.section
                )
                return { obtained: mark?.totalMarks || 0, fullMarks: sc.fullMarks, passMarks: sc.passMarks, passed: (mark?.totalMarks || 0) >= sc.passMarks }
              })
            const totalObtained = subjectMarks.reduce((a, b) => a + b.obtained, 0)
            return { studentId: student.id, section: student.section, totalObtained, passedAll: subjectMarks.every((s) => s.passed) }
          })
          .sort((a, b) => b.totalObtained - a.totalObtained)
      : []

    const allClassRankMap = new Map<string, number>()
    allClassStudents.forEach((d, i) => {
      const existing = allClassRankMap.get(d.studentId)
      if (existing === undefined) allClassRankMap.set(d.studentId, i + 1)
    })

    // Section rank: rank among this section only (by raw marks)
    const sectionRankMap = new Map<string, number>()
    ;[...tabulationData]
      .sort((a, b) => b.totalObtained - a.totalObtained)
      .forEach((d, i) => {
        sectionRankMap.set(d.student.id, i + 1)
      })

    return tabulationData.map((row) => {
      const totalFull = row.subjectMarks.reduce((a, b) => a + b.fullMarks, 0)
      const percentage = totalFull > 0 ? Math.round((row.totalObtained / totalFull) * 100) : 0
      const avg = row.subjectMarks.length > 0 ? Math.round(row.totalObtained / row.subjectMarks.length) : 0
      const gpa = row.passedAll
        ? percentage >= 80 ? 5.0
        : percentage >= 70 ? 4.0
        : percentage >= 60 ? 3.5
        : percentage >= 50 ? 3.0
        : percentage >= 40 ? 2.0
        : percentage >= 33 ? 1.0
        : 0
        : 0
      return {
        ...row,
        adjustmentMarks: 0,
        adjustedTotal: row.totalObtained,
        adjustedPercentage: percentage,
        adjustedGpa: gpa,
        classRank: allClassRankMap.get(row.student.id) || 0,
        sectionRank: sectionRankMap.get(row.student.id) || 0,
        avgMark: avg,
        totalFullMarks: totalFull,
      }
    }).sort((a, b) => {
      if (sortMode === 'rank') return b.adjustedTotal - a.adjustedTotal
      return (a.student.roll || '').localeCompare(b.student.roll || '')
    })
  }, [tabulationData, students, selectedClassId, selectedExamId, sessionSubjectMarkConfigs, sessionStudentMarks, sectionSubjectIds, sortMode])

  // Analysis data
  const analysisData = useMemo(() => {
    if (!selectedExamId) return null
    const examSubjects = sessionSubjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === selectedClassId)
    const subjectStats = examSubjects.map((sc) => {
      const subject = subjects.find((s) => s.id === sc.subjectId)
      const marks = sessionStudentMarks.filter(
        (m) => m.examId === selectedExamId && m.subjectId === sc.subjectId && m.classId === selectedClassId && (!selectedSectionId || m.sectionId === selectedSectionId)
      )
      const total = marks.length
      const avg = total > 0 ? Math.round(marks.reduce((a, m) => a + m.totalMarks, 0) / total) : 0
      const passCount = marks.filter((m) => m.totalMarks >= sc.passMarks).length
      const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0
      const highest = total > 0 ? Math.max(...marks.map((m) => m.totalMarks)) : 0
      const lowest = total > 0 ? Math.min(...marks.map((m) => m.totalMarks)) : 0
      return {
        subjectId: sc.subjectId,
        subjectName: isBn ? subject?.nameBn : subject?.name,
        fullMarks: sc.fullMarks,
        total,
        avg,
        passRate,
        highest,
        lowest,
      }
    })

    const totalStudents = tabulationData.length
    const passedStudents = tabulationData.filter((d) => d.passedAll).length
    const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0
    // Use enriched data for adjusted percentage if available
    const avgPercentage = totalStudents > 0 ? Math.round(enrichedTabulationData.reduce((a, d) => a + (d.adjustedPercentage || d.percentage), 0) / totalStudents) : 0

    return { subjectStats, totalStudents, passedStudents, passRate, avgPercentage }
  }, [selectedExamId, selectedClassId, selectedSectionId, tabulationData, enrichedTabulationData, sessionSubjectMarkConfigs, sessionStudentMarks, subjects, isBn])

  const handleSaveExtra = () => {
    if (!selectedExamId || !extraForm.studentId || !extraForm.marks) return
    const typeConfig = extraMarkTypes.find((t) => t.id === extraForm.typeId)
    addExtraMark({
      examId: selectedExamId,
      studentId: extraForm.studentId,
      classId: selectedClassId,
      sectionId: selectedSectionId,
      typeId: extraForm.typeId,
      marks: Number(extraForm.marks) || 0,
      maxMarks: Number(extraForm.maxMarks) || typeConfig?.defaultMaxMarks || 10,
      note: extraForm.note,
    })
    setShowExtraForm(false)
    setExtraForm({ studentId: '', studentSearch: '', showSuggestions: false, typeId: extraMarkTypes[0]?.id || '', marks: '0', maxMarks: '10', note: '' })
  }

  // Icon mapping from string name to Lucide component
  const iconMap: Record<string, React.ElementType> = {
    ClipboardCheck, Shield, BookOpen, Award, Users, CheckCircle, TrendingUp,
    Target, FileSpreadsheet, BarChart2, Star, Heart, Zap, Coffee, Music,
  }
  const getIcon = (iconName: string) => iconMap[iconName] || Award

  const handleDownloadTabulation = (opts: TabulationPdfOptions) => {
    const selected = enrichedTabulationData.filter((d) => selectedStudents.has(d.student.id))
    if (selected.length === 0) return
    const examName = examConfigs.find((e) => e.id === selectedExamId)?.name || selectedExamId
    const html = generateTabulationPDF(selected, {
      ...opts,
      examName,
      className: selectedClassId,
      sectionName: selectedSectionId,
      institutionName: institution.name,
    })
    downloadHTML(`tabulation_${selectedExamId}_${selectedClassId}_${selectedSectionId}.html`, html)
    setShowPdfModal(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exams')}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[1rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'ধাপ ৪: ফলাফল প্রক্রিয়াকরণ' : 'Step 4: Result Processing'}
            </h1>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">
              {isBn ? 'এক্সট্রা মার্কস, ট্যাবুলেশন ও বিশ্লেষণ' : 'Extra marks, tabulation & analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'পরীক্ষা' : 'Exam'}</label>
            <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className={`${selectCls} max-w-[14rem]`}>
              <option value="">{isBn ? 'পরীক্ষা নির্বাচন করুন...' : 'Select exam...'}</option>
              {examConfigs.map((e) => (
                <option key={e.id} value={e.id}>
                  {isBn ? e.nameBn : e.name}{e.isActive ? ' (Active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'শ্রেণি' : 'Class'}</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                setSelectedSectionId('')
              }}
              className={`${selectCls} max-w-[8.75rem]`}
            >
              <option value="">{isBn ? 'শ্রেণি নির্বাচন করুন...' : 'Select class...'}</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide">{isBn ? 'সেকশন' : 'Section'}</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className={`${selectCls} max-w-[8.75rem]`}
              disabled={!selectedClassId}
            >
              <option value="">{isBn ? 'সেকশন নির্বাচন করুন...' : 'Select section...'}</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {[
          { key: 'tabulation' as SubTab, label: isBn ? 'ট্যাবুলেশন' : 'Tabulation', icon: <FileSpreadsheet size={14} /> },
          { key: 'extra-marks' as SubTab, label: isBn ? 'এক্সট্রা মার্কস' : 'Extra Marks', icon: <Award size={14} /> },
          { key: 'mark-adjustment' as SubTab, label: isBn ? 'মার্ক এডজাস্টমেন্ট' : 'Mark Adjustment', icon: <ClipboardCheck size={14} /> },
          { key: 'marksheet' as SubTab, label: isBn ? 'মার্কশিট' : 'Marksheet', icon: <GraduationCap size={14} /> },
          { key: 'cumulative-marksheet' as SubTab, label: isBn ? 'কামিউলেটিভ মার্কশিট' : 'Cumulative Marksheet', icon: <TrendingUp size={14} /> },
          { key: 'analysis' as SubTab, label: isBn ? 'বিশ্লেষণ' : 'Analysis', icon: <BarChart2 size={14} /> },
          { key: 'position' as SubTab, label: isBn ? 'পজিশন চেক' : 'Position Check', icon: <Target size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeSubTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ═══ TABULATION TAB ═══ */}
        {activeSubTab === 'tabulation' && (
          <>
            {tabulationData.length > 0 ? (
              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <div className={sectionTitleCls}>
                    <FileSpreadsheet size={15} className="text-[var(--brand)]" />
                    {isBn ? 'ট্যাবুলেশন শিট' : 'Tabulation Sheet'} ({tabulationData.length} {isBn ? 'জন' : 'students'})
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRotateHeaders(!rotateHeaders)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.625rem] font-medium cursor-pointer border transition-all ${
                        rotateHeaders
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                      }`}
                      title={isBn ? 'বিষয়ের নাম ঘুরান' : 'Rotate subject names'}
                    >
                      <RotateCw size={12} />
                      {isBn ? 'ঘুরান' : 'Rotate'}
                    </button>
                    <button
                      onClick={() => setSortMode((prev) => prev === 'roll' ? 'rank' : 'roll')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.625rem] font-medium cursor-pointer border transition-all ${
                        sortMode === 'rank'
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                      }`}
                      title={sortMode === 'rank' ? (isBn ? 'রোল অনুযায়ী সাজান' : 'Sort by Roll') : (isBn ? 'র‍্যাঙ্ক অনুযায়ী সাজান' : 'Sort by Rank')}
                    >
                      <ArrowUpDown size={12} />
                      {sortMode === 'rank' ? (isBn ? 'র‍্যাঙ্ক' : 'Rank') : (isBn ? 'রোল' : 'Roll')}
                    </button>
                    <button
                      onClick={() => setShowPdfModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.625rem] font-medium cursor-pointer border transition-all bg-[var(--brand)] text-white border-[var(--brand)] hover:opacity-90"
                      title={isBn ? 'ডাউনলোড' : 'Download'}
                    >
                      <Download size={12} />
                      {isBn ? 'ডাউনলোড' : 'Download'}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto mt-3">
                  <table className={`w-full text-xs ${rotateHeaders ? 'table-fixed' : 'min-w-[37.5rem]'}`}>
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="py-2 px-2 w-8">
                          <input
                            type="checkbox"
                            checked={selectedStudents.size === enrichedTabulationData.length && enrichedTabulationData.length > 0}
                            onChange={toggleAllStudents}
                            className="accent-[var(--brand)]"
                          />
                        </th>
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-left w-8'}`} style={rotateHeaders ? { width: '2rem', minWidth: '2rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600 }}>#</span></div> : '#'}
                        </th>
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-left'}`} style={rotateHeaders ? { width: '5rem', minWidth: '5rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600 }}>{isBn ? 'নাম' : 'Name'}</span></div> : <>{isBn ? 'নাম' : 'Name'}</>}
                        </th>
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-center'}`} style={rotateHeaders ? { width: '3rem', minWidth: '3rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600 }}>{isBn ? 'রোল' : 'Roll'}</span></div> : <>{isBn ? 'রোল' : 'Roll'}</>}
                        </th>
                        {enrichedTabulationData[0]?.subjectMarks.map((sm) => (
                          <th
                            key={sm.subjectId}
                            className={`text-center text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-1'}`}
                            style={rotateHeaders ? { width: '3rem', minWidth: '3rem' } : undefined}
                          >
                            {rotateHeaders ? (
                              <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}>
                                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                                  {sm.subjectName} ({sm.fullMarks})
                                </span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="font-semibold text-[0.625rem] leading-tight">{sm.subjectName}</div>
                                <div className="text-[0.5rem] text-[var(--text-muted)] font-normal">/{sm.fullMarks}</div>
                              </div>
                            )}
                          </th>
                        ))}
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-center'}`} style={rotateHeaders ? { width: '3rem', minWidth: '3rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600 }}>{isBn ? 'প্রাপ্ত' : 'Obt'}</span></div> : <>{isBn ? 'প্রাপ্ত' : 'Obtained'}</>}
                        </th>
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-center'}`} style={rotateHeaders ? { width: '2.5rem', minWidth: '2.5rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600 }}>%</span></div> : '%'}
                        </th>
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-center'}`} style={rotateHeaders ? { width: '2.5rem', minWidth: '2.5rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600 }}>GPA</span></div> : 'GPA'}
                        </th>
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-center'}`} style={rotateHeaders ? { width: '3rem', minWidth: '3rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 700 }}>{isBn ? 'ক্লাস' : 'CRank'}</span></div> : <>{isBn ? 'ক্লাস র‍্যাঙ্ক' : 'Class Rank'}</>}
                        </th>
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-center'}`} style={rotateHeaders ? { width: '3rem', minWidth: '3rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600 }}>{isBn ? 'সেকশন' : 'SRank'}</span></div> : <>{isBn ? 'সেকশন র‍্যাঙ্ক' : 'Sec Rank'}</>}
                        </th>
                        <th className={`text-[0.625rem] font-semibold text-[var(--text-muted)] ${rotateHeaders ? 'p-0' : 'py-2 px-2 text-center'}`} style={rotateHeaders ? { width: '3rem', minWidth: '3rem' } : undefined}>
                          {rotateHeaders ? <div className="flex items-end justify-center" style={{ height: '7rem', paddingBottom: '0.5rem' }}><span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600 }}>{isBn ? 'অবস্থা' : 'Status'}</span></div> : <>{isBn ? 'অবস্থা' : 'Status'}</>}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedTabulationData.map((row, idx) => (
                        <tr key={row.student.id} className={`border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] ${selectedStudents.has(row.student.id) ? 'bg-[var(--brand)]/5' : ''}`}>
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(row.student.id)}
                              onChange={() => toggleStudent(row.student.id)}
                              className="accent-[var(--brand)]"
                            />
                          </td>
                          <td className="py-2 px-2 text-[var(--text-muted)]">{idx + 1}</td>
                          <td className="py-2 px-2 text-[0.6875rem] font-medium text-[var(--text-primary)]">
                            {isBn ? row.student.nameBn || row.student.nameEn : row.student.nameEn}
                          </td>
                          <td className="py-2 px-2 text-center text-[0.6875rem] text-[var(--text-secondary)]">{row.student.roll || ''}</td>
                          {row.subjectMarks.map((sm) => (
                            <td key={sm.subjectId} className="py-2 px-2 text-center">
                              <span className={`text-[0.6875rem] font-medium ${sm.passed ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                {sm.obtained}
                              </span>
                            </td>
                          ))}
                          <td className="py-2 px-2 text-center text-[0.75rem] font-bold text-[var(--text-primary)]">
                            {row.adjustmentMarks !== 0 ? (
                              <span title={`Raw: ${row.totalObtained} + Adj: ${row.adjustmentMarks}`}>
                                {row.adjustedTotal}
                                <span className="text-[0.5rem] text-[var(--brand)] ml-0.5">adj</span>
                              </span>
                            ) : row.totalObtained}
                          </td>
                          <td className="py-2 px-2 text-center text-[0.6875rem] font-medium text-[var(--text-secondary)]">{row.adjustedPercentage}%</td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`text-[0.625rem] font-bold px-1.5 py-0.5 rounded ${row.adjustedGpa >= 4 ? 'bg-[#dcfce7] text-[#15803d]' : row.adjustedGpa >= 2 ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}
                            >
                              {row.adjustedGpa.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[0.625rem] font-bold px-1.5 py-0.5 rounded ${row.classRank <= 3 ? 'bg-amber-100 text-amber-700' : 'text-[var(--text-muted)]'}`}>
                              {row.classRank}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className={`text-[0.625rem] font-bold px-1.5 py-0.5 rounded ${row.sectionRank <= 3 ? 'bg-[#dcfce7] text-[#15803d]' : 'text-[var(--text-muted)]'}`}>
                              {row.sectionRank}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`text-[0.625rem] font-medium px-2 py-0.5 rounded ${row.passedAll ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}
                            >
                              {row.passedAll ? (isBn ? 'পাস' : 'Pass') : isBn ? 'ফেইল' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={`${sectionCls} text-center py-10`}>
                <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'পরীক্ষা, শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select exam, class and section to view tabulation'}
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══ EXTRA MARKS TAB ═══ */}
        {activeSubTab === 'extra-marks' && (
          <>
            {/* Header with count + add button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Award size={15} className="text-[var(--brand)]" />
                <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'এক্সট্রা মার্কস' : 'Extra Marks'}
                </span>
                <span className="text-[0.625rem] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                  {sessionExtraMarks.filter((e) => (selectedExamId ? e.examId === selectedExamId : true)).length} {isBn ? 'এন্ট্রি' : 'entries'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Attendance Auto/Manual Toggle */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setExtraAttMode('auto')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium cursor-pointer border transition-all ${
                      extraAttMode === 'auto'
                        ? 'border-[var(--green)] bg-[var(--green-light)] text-[var(--green)]'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--green)] hover:text-[var(--green)]'
                    }`}
                  >
                    <ClipboardCheck size={13} />
                    {isBn ? 'অটো' : 'Auto'}
                  </button>
                  <button
                    onClick={() => setExtraAttMode('manual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium cursor-pointer border transition-all ${
                      extraAttMode === 'manual'
                        ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                    }`}
                  >
                    <Edit3 size={13} />
                    {isBn ? 'ম্যানুয়াল' : 'Manual'}
                  </button>
                </div>
                <button
                  onClick={() => { setShowTypeManager(true); setShowAddTypeForm(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer border border-[var(--border)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
                >
                  <Settings size={13} />
                  {isBn ? 'ধরন' : 'Types'}
                </button>
                <button onClick={() => setShowExtraForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium cursor-pointer border-none hover:opacity-90 transition-all">
                  <Plus size={13} />
                  {isBn ? 'নতুন' : 'Add'}
                </button>
              </div>
            </div>

            {/* Selected count */}
            {extraSelectedStudents.size > 0 && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[0.625rem] text-[var(--brand)] font-medium">
                  {extraSelectedStudents.size} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
                <button onClick={() => { setExtraSelectedStudents(new Set()); setExtraSelectAll(false) }} className="text-[0.625rem] text-[var(--text-muted)] cursor-pointer bg-transparent border-none hover:text-[var(--text-primary)]">
                  {isBn ? 'বাতিল' : 'Clear'}
                </button>
              </div>
            )}

            {/* Bulk Apply Panel */}
            {extraSelectedStudents.size > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Award size={14} className="text-[var(--brand)]" />
                  <span className="text-[0.75rem] font-semibold text-[var(--brand)]">
                    {isBn ? `${extraSelectedStudents.size} জনকে এক্সট্রা মার্ক দিন` : `Apply to ${extraSelectedStudents.size} students`}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  <select value={extraBulkType} onChange={(e) => { setExtraBulkType(e.target.value); const t = extraMarkTypes.find((tt) => tt.id === e.target.value); if (t) setExtraBulkMaxMarks(String(t.defaultMaxMarks)) }} className={`${selectCls} text-[0.6875rem] py-1`}>
                    <option value="">{isBn ? 'ধরন' : 'Type'}</option>
                    {extraMarkTypes.filter((t) => t.isActive).map((t) => (<option key={t.id} value={t.id}>{isBn ? t.nameBn : t.name}</option>))}
                  </select>
                  <input type="number" value={extraBulkMarks} onChange={(e) => setExtraBulkMarks(e.target.value)} placeholder={isBn ? 'মার্কস' : 'Marks'} className={`${inputCls} text-[0.6875rem] py-1`} />
                  <input type="number" value={extraBulkMaxMarks} onChange={(e) => setExtraBulkMaxMarks(e.target.value)} placeholder={isBn ? 'সর্বোচ্চ' : 'Max'} className={`${inputCls} text-[0.6875rem] py-1`} />
                  <input value={extraBulkNote} onChange={(e) => setExtraBulkNote(e.target.value)} placeholder={isBn ? 'নোট' : 'Note'} className={`${inputCls} text-[0.6875rem] py-1`} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExtraBulkApply} disabled={!extraBulkType} className={`${btnPrimary} text-[0.625rem] ${!extraBulkType ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Save size={11} />{isBn ? 'প্রয়োগ' : 'Apply'}
                  </button>
                  <button onClick={() => { setExtraSelectedStudents(new Set()); setExtraSelectAll(false) }} className="text-[0.625rem] text-[var(--text-muted)] cursor-pointer bg-transparent border-none hover:text-[var(--text-primary)]">
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {/* Type summary — each type has its own max % */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
              {extraMarkTypes.filter((t) => t.isActive).map((type) => {
                const count = sessionExtraMarks.filter((e) => e.typeId === type.id && (selectedExamId ? e.examId === selectedExamId : true)).length
                const IconComponent = getIcon(type.icon)
                return (
                  <div key={type.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: `${type.color}15` }}>
                      <IconComponent size={17} style={{ color: type.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[1rem] font-bold text-[var(--text-primary)] leading-none">{count}</span>
                        <span className="text-[0.5625rem] font-medium px-1.5 py-0.5 rounded" style={{ background: `${type.color}15`, color: type.color }}>
                          {type.percentage}%
                        </span>
                      </div>
                      <div className="text-[0.5625rem] text-[var(--text-muted)] mt-1 leading-none truncate">{isBn ? type.nameBn : type.name}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Entry list with checkboxes */}
            <div className="overflow-x-auto">
              <table className="w-full text-[0.6875rem]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b-2 border-[var(--border)]">
                    <th className="p-2 text-center w-8">
                      <input type="checkbox" checked={extraSelectAll} onChange={handleExtraSelectAll} className="cursor-pointer accent-[var(--brand)]" />
                    </th>
                    <th className="p-2 text-left font-semibold text-[var(--text-primary)]">{isBn ? 'রোল' : 'Roll'}</th>
                    <th className="p-2 text-left font-semibold text-[var(--text-primary)]">{isBn ? 'নাম' : 'Name'}</th>
                    {extraMarkTypes.filter((t) => t.isActive).map((type) => {
                      const isAttType = type.name === 'Attendance' || type.nameBn === 'উপস্থিতি'
                      return (
                        <th key={type.id} className="p-2 text-center font-semibold" style={{ color: type.color }}>
                          <div>{isBn ? type.nameBn : type.name}</div>
                          <div className="text-[0.5rem] font-normal opacity-70">
                            {isAttType ? (extraAttMode === 'auto' ? '(Auto)' : `(Manual ${type.percentage}%)`) : `${type.percentage}%`}
                          </div>
                        </th>
                      )
                    })}
                    <th className="p-2 text-center font-semibold text-[var(--text-primary)]">{isBn ? 'মোট' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {extraFilteredStudents.map((student) => {
                    const marks = sessionExtraMarks.filter((e) => e.studentId === student.id && (selectedExamId ? e.examId === selectedExamId : true))
                    const manualTotal = marks.reduce((a, b) => a + b.marks, 0)
                    // Add auto attendance marks if in auto mode
                    const autoAttMarks = extraAttMode === 'auto' ? (autoAttMarksMap.get(student.id) || 0) : 0
                    // Cap total at sum of all types' percentages
                    const maxTotal = extraMarkTypes.filter((t) => t.isActive).reduce((sum, t) => sum + t.percentage, 0)
                    const total = Math.min(manualTotal + autoAttMarks, maxTotal)
                    const isSelected = extraSelectedStudents.has(student.id)
                    return (
                      <tr key={student.id} className={`border-b border-[var(--border)] transition-colors ${isSelected ? 'bg-[var(--brand-light)]' : 'hover:bg-[var(--bg-secondary)]'}`}>
                        <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={() => handleExtraToggleStudent(student.id)} className="cursor-pointer accent-[var(--brand)]" />
                        </td>
                        <td className="p-2 text-left font-medium text-[var(--text-primary)]">{student.roll || '-'}</td>
                        <td className="p-2 text-left text-[var(--text-primary)]">{isBn ? student.nameBn || student.nameEn : student.nameEn}</td>
                        {extraMarkTypes.filter((t) => t.isActive).map((type) => {
                          const entry = marks.find((m) => m.typeId === type.id)
                          const isAttType = type.name === 'Attendance' || type.nameBn === 'উপস্থিতি'
                          const isAutoAtt = isAttType && extraAttMode === 'auto'
                          const autoMarks = isAutoAtt ? (autoAttMarksMap.get(student.id) || 0) : 0
                          const maxPct = type.percentage
                          
                          return (
                            <td key={type.id} className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                              {isAutoAtt ? (
                                // Auto mode: show read-only calculated marks
                                <span className="inline-block w-14 text-center text-[0.6875rem] font-bold py-0.5 rounded bg-[var(--green-light)] text-[var(--green)]">
                                  {autoMarks}
                                </span>
                              ) : entry ? (
                                <input
                                  type="number"
                                  min={0}
                                  max={maxPct}
                                  value={entry.marks}
                                  onChange={(e) => {
                                    let newMarks = Number(e.target.value) || 0
                                    // Limit to type's max percentage
                                    if (newMarks > maxPct) newMarks = maxPct
                                    if (newMarks < 0) newMarks = 0
                                    useExamStore.getState().updateExtraMark(entry.id, { marks: newMarks })
                                  }}
                                  className="w-14 text-center text-[0.6875rem] font-bold py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                                />
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!selectedExamId) return
                                    useExamStore.getState().addExtraMark({
                                      examId: selectedExamId,
                                      studentId: student.id,
                                      classId: selectedClassId,
                                      sectionId: selectedSectionId,
                                      typeId: type.id,
                                      marks: 0,
                                      maxMarks: type.defaultMaxMarks,
                                      note: '',
                                    })
                                  }}
                                  className="w-14 text-center text-[0.6875rem] py-0.5 rounded border border-dashed border-[var(--border)] bg-transparent text-[var(--text-muted)] cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)]"
                                >
                                  +{maxPct}%
                                </button>
                              )}
                            </td>
                          )
                        })}
                        <td className="p-2 text-center font-bold text-[var(--brand)]">{total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {extraFilteredStudents.length === 0 && (
              <div className="text-center py-8 text-[var(--text-muted)] text-[0.75rem]">
                <Award size={24} className="mx-auto mb-2 opacity-30" />
                {selectedClassId ? (isBn ? 'এই শ্রেণীতে কোনো শিক্ষার্থী নেই' : 'No students in this class') : (isBn ? 'শ্রেণী নির্বাচন করুন' : 'Select a class')}
              </div>
            )}
          </>
        )}

        {/* ═══ MARK ADJUSTMENT TAB ═══ */}
        {activeSubTab === 'mark-adjustment' && (
          <>
            {selectedExamId && selectedClassId && selectedSectionId ? (
              <MarkAdjustmentTab
                examId={selectedExamId}
                classId={selectedClassId}
                sectionId={selectedSectionId}
                extraMarks={sessionExtraMarks}
                extraMarkTypes={extraMarkTypes}
                onSave={setMarkAdjustments}
                onClear={clearMarkAdjustments}
                isBn={isBn}
                tabulationData={tabulationData}
              />
            ) : (
              <div className="text-center py-12 text-[var(--text-muted)] text-[0.875rem]">
                {isBn ? 'প্রথমে পরীক্ষা, শ্রেণী ও সেকশন নির্বাচন করুন' : 'Select exam, class & section first'}
              </div>
            )}
          </>
        )}

        {/* ═══ MARKSHEET TAB ═══ */}
        {activeSubTab === 'marksheet' && (
          <>
            {selectedExamId && selectedClassId && selectedSectionId && enrichedTabulationData.length > 0 ? (
              <MarksheetTab
                enrichedData={enrichedTabulationData}
                examName={examConfigs.find((e) => e.id === selectedExamId)?.name || selectedExamId}
                examSession={examConfigs.find((e) => e.id === selectedExamId)?.session || ''}
                className={selectedClassId}
                sectionName={selectedSectionId}
                institutionName={useClassStore.getState().institution.name}
                institutionAddress={useClassStore.getState().institution.address}
                isBn={isBn}
              />
            ) : (
              <div className="text-center py-12 text-[var(--text-muted)] text-[0.875rem]">
                {isBn ? 'প্রথমে পরীক্ষা, শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select exam, class & section first'}
              </div>
            )}
          </>
        )}

        {/* ═══ CUMULATIVE MARKSHEET TAB ═══ */}
        {activeSubTab === 'cumulative-marksheet' && (
          <>
            {selectedExamId && selectedClassId && selectedSectionId && enrichedTabulationData.length > 0 ? (
              <CumulativeMarkSheetTab
                currentExamData={enrichedTabulationData}
                currentExamId={selectedExamId}
                currentExamName={examConfigs.find((e) => e.id === selectedExamId)?.name || selectedExamId}
                currentExamSession={examConfigs.find((e) => e.id === selectedExamId)?.session || ''}
                className={selectedClassId}
                sectionName={selectedSectionId}
                institutionName={useClassStore.getState().institution.name}
                institutionAddress={useClassStore.getState().institution.address}
                isBn={isBn}
              />
            ) : (
              <div className="text-center py-12 text-[var(--text-muted)] text-[0.875rem]">
                {isBn ? 'প্রথমে পরীক্ষা, শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select exam, class & section first'}
              </div>
            )}
          </>
        )}

        {/* ═══ ANALYSIS TAB ═══ */}
        {activeSubTab === 'analysis' && analysisData && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                {
                  label: isBn ? 'মোট শিক্ষার্থী' : 'Total Students',
                  value: analysisData.totalStudents,
                  color: 'var(--brand)',
                  icon: <Users size={16} />,
                },
                {
                  label: isBn ? 'পাস হার' : 'Pass Rate',
                  value: `${analysisData.passRate}%`,
                  color: 'var(--green)',
                  icon: <CheckCircle size={16} />,
                },
                {
                  label: isBn ? 'গড় শতাংশ' : 'Avg Percentage',
                  value: `${analysisData.avgPercentage}%`,
                  color: 'var(--amber)',
                  icon: <TrendingUp size={16} />,
                },
              ].map((s) => (
                <div key={s.label} className={sectionCls} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${s.color}15`, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-[1rem] font-bold text-[var(--text-primary)]">{s.value}</div>
                    <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <BarChart2 size={15} className="text-[var(--brand)]" />
                {isBn ? 'বিষয়ভিত্তিক পারফরম্যান্স' : 'Subject-wise Performance'}
              </div>
              <div className="space-y-3 mt-3">
                {analysisData.subjectStats.map((stat) => (
                  <div key={stat.subjectId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.75rem] font-medium text-[var(--text-primary)]">{stat.subjectName}</span>
                      <div className="flex items-center gap-3 text-[0.625rem]">
                        <span className="text-[var(--text-muted)]">
                          {isBn ? 'গড়' : 'Avg'}:{' '}
                          <span className="font-semibold text-[var(--text-primary)]">
                            {stat.avg}/{stat.fullMarks}
                          </span>
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {isBn ? 'পাস' : 'Pass'}:{' '}
                          <span
                            className="font-semibold"
                            style={{ color: stat.passRate >= 60 ? 'var(--green)' : stat.passRate >= 40 ? 'var(--amber)' : 'var(--red)' }}
                          >
                            {stat.passRate}%
                          </span>
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {isBn ? 'সর্বোচ্চ' : 'Highest'}: <span className="font-semibold text-[var(--green)]">{stat.highest}</span>
                        </span>
                      </div>
                    </div>
                    <div className="h-[0.375rem] bg-[var(--border)] rounded-[0.1875rem]">
                      <div
                        className="h-full rounded-[0.1875rem]"
                        style={{
                          width: `${stat.passRate}%`,
                          background: stat.passRate >= 60 ? 'var(--green)' : stat.passRate >= 40 ? 'var(--amber)' : 'var(--red)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSubTab === 'analysis' && !analysisData && (
          <div className={`${sectionCls} text-center py-10`}>
            <BarChart2 size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
            <p className="text-[0.8125rem] text-[var(--text-muted)]">{isBn ? 'পরীক্ষা নির্বাচন করুন' : 'Select an exam to view analysis'}</p>
          </div>
        )}

        {/* ═══ POSITION CHECK TAB ═══ */}
        {activeSubTab === 'position' && (
          <>
            {positionCheck.length > 0 ? (
              <div className={sectionCls}>
                <div className={sectionTitleCls}>
                  <AlertTriangle size={15} className="text-[var(--amber)]" />
                  {isBn ? 'পজিশন ডুপ্লিকেশন' : 'Position Duplications'} ({positionCheck.length})
                </div>
                <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
                  {isBn ? 'একই মার্কস পাওয়া শিক্ষার্থীদের পজিশন চেক করুন' : 'Students with same marks sharing positions'}
                </p>
                <div className="space-y-2">
                  {positionCheck.map((dup) => (
                    <div key={dup.position} className="p-3 rounded-lg bg-[var(--amber-light)] border border-[rgba(245,158,11,0.2)]">
                      <div className="text-[0.75rem] font-semibold text-[var(--text-primary)] mb-1">
                        {isBn ? `পজিশন ${dup.position}` : `Position ${dup.position}`} — {dup.count} {isBn ? 'জন শিক্ষার্থী' : 'students'}
                      </div>
                      <div className="text-[0.6875rem] text-[var(--text-secondary)]">{dup.students.join(', ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : tabulationData.length > 0 ? (
              <div className={`${sectionCls} text-center py-10`}>
                <CheckCircle size={32} className="mx-auto mb-2 opacity-30 text-[var(--green)]" />
                <p className="text-[0.8125rem] text-[var(--green)]">{isBn ? 'কোনো পজিশন ডুপ্লিকেশন নেই!' : 'No position duplications found!'}</p>
              </div>
            ) : (
              <div className={`${sectionCls} text-center py-10`}>
                <Target size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'পরীক্ষা, শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select exam, class and section'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ Extra Mark Form Modal ═══ */}
      {showExtraForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '30rem' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'এক্সট্রা মার্কস যোগ' : 'Add Extra Marks'}</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{isBn ? 'শিক্ষার্থীর এক্সট্রা মার্কস যোগ করুন' : 'Add extra marks for a student'}</p>
                </div>
              </div>
              <button onClick={() => setShowExtraForm(false)} style={{ width: '1.875rem', height: '1.875rem', borderRadius: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
              {/* Student */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.5rem' }}>
                  ① {isBn ? 'শিক্ষার্থী নির্বাচন' : 'Select Student'}
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={extraForm.studentSearch}
                    onChange={(e) => {
                      const val = e.target.value
                      setExtraForm((p) => ({ ...p, studentSearch: val, studentId: val === '' ? '' : p.studentId }))
                    }}
                    onFocus={() => setExtraForm((p) => ({ ...p, showSuggestions: true }))}
                    onBlur={() => setTimeout(() => setExtraForm((p) => ({ ...p, showSuggestions: false })), 200)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none' }}
                    placeholder={isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
                  />
                  {extraForm.studentSearch && (
                    <button onClick={() => setExtraForm((p) => ({ ...p, studentSearch: '', studentId: '' }))} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: 'var(--border)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={10} style={{ color: 'var(--text-primary)' }} />
                    </button>
                  )}
                  {extraForm.studentId && (
                    <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={12} />
                      {isBn ? 'নির্বাচিত' : 'Selected'}: {classStudents.find((s) => s.id === extraForm.studentId)?.nameEn}
                    </div>
                  )}
                  {extraForm.showSuggestions && extraForm.studentSearch && !extraForm.studentId && (
                    <div style={{ position: 'absolute', zIndex: 50, marginTop: '0.25rem', width: '100%', maxHeight: '12rem', overflowY: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {classStudents
                        .filter((s) => {
                          const q = extraForm.studentSearch.toLowerCase()
                          return s.nameEn.toLowerCase().includes(q) || (s.nameBn && s.nameBn.toLowerCase().includes(q)) || s.id.toLowerCase().includes(q) || (s.roll && s.roll.toLowerCase().includes(q))
                        })
                        .slice(0, 10)
                        .map((s) => (
                          <button key={s.id} onMouseDown={() => setExtraForm((p) => ({ ...p, studentId: s.id, studentSearch: isBn ? s.nameBn || s.nameEn : s.nameEn, showSuggestions: false }))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', flexShrink: 0 }}>
                              {(isBn ? s.nameBn || s.nameEn : s.nameEn)?.charAt(0)?.toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isBn ? s.nameBn || s.nameEn : s.nameEn}</div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{s.id}{s.roll ? ` · Roll: ${s.roll}` : ''}</div>
                            </div>
                          </button>
                        ))}
                      {classStudents.filter((s) => { const q = extraForm.studentSearch.toLowerCase(); return s.nameEn.toLowerCase().includes(q) || (s.nameBn && s.nameBn.toLowerCase().includes(q)) || s.id.toLowerCase().includes(q) || (s.roll && s.roll.toLowerCase().includes(q)) }).length === 0 && (
                        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Type */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem' }}>
                    ② {isBn ? 'ধরন' : 'Type'}
                  </div>
                  <button onClick={() => { setShowTypeManager(true); setShowAddTypeForm(true) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '4px 8px', borderRadius: '0.375rem', fontSize: '0.6875rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Settings size={11} />
                    {isBn ? 'ধরন ম্যানেজ' : 'Manage'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {extraMarkTypes.filter((t) => t.isActive).map((t) => {
                    const IconComponent = getIcon(t.icon)
                    return (
                      <button key={t.id} onClick={() => setExtraForm((p) => ({ ...p, typeId: t.id, maxMarks: String(t.defaultMaxMarks) }))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', border: `2px solid ${extraForm.typeId === t.id ? 'var(--brand)' : 'var(--border)'}`, background: extraForm.typeId === t.id ? 'var(--brand-light)' : 'var(--bg-secondary)', color: extraForm.typeId === t.id ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '0.6875rem', fontWeight: extraForm.typeId === t.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' }}>
                        <IconComponent size={12} />
                        {isBn ? t.nameBn : t.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Marks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.5rem' }}>③ {isBn ? 'প্রাপ্ত মার্কস' : 'Marks Obtained'}</div>
                  <input type="number" value={extraForm.marks} onChange={(e) => setExtraForm((p) => ({ ...p, marks: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.5rem' }}>④ {isBn ? 'সর্বোচ্চ মার্কস' : 'Maximum Marks'}</div>
                  <input type="number" value={extraForm.maxMarks} onChange={(e) => setExtraForm((p) => ({ ...p, maxMarks: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none' }} />
                </div>
              </div>

              {/* Note */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.5rem' }}>⑤ {isBn ? 'নোট' : 'Note'}</div>
                <input value={extraForm.note} onChange={(e) => setExtraForm((p) => ({ ...p, note: e.target.value }))} placeholder={isBn ? 'ঐচ্ছিক...' : 'Optional...'} style={{ width: '100%', padding: '9px 12px', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8125rem', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
              <button onClick={() => setShowExtraForm(false)} style={{ padding: '9px 16px', borderRadius: '0.5625rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveExtra} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '9px 20px', borderRadius: '0.5625rem', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Save size={14} />
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Type Manager Modal */}
      {showTypeManager && createPortal(
        <div className="modal-overlay" style={{ zIndex: 700 }}>
          <div className="modal-box modal-content" style={{ maxWidth: '28rem' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={16} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'এক্সট্রা মার্কস ধরন ম্যানেজ' : 'Manage Extra Mark Types'}</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{isBn ? 'নতুন ধরন তৈরি ও পরিচালনা করুন' : 'Create and manage mark types'}</p>
                </div>
              </div>
              <button onClick={() => setShowTypeManager(false)} style={{ width: '1.875rem', height: '1.875rem', borderRadius: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
              {/* Add Type Form */}
              {showAddTypeForm && (
                <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--brand)', background: 'var(--brand-light)' }}>
                  <AddTypeForm onClose={() => setShowAddTypeForm(false)} onAdded={() => setShowAddTypeForm(false)} />
                </div>
              )}

              {/* Existing types list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {extraMarkTypes.map((type) => {
                  const IconComponent = getIcon(type.icon)
                  const isEditing = editingType === type.id
                  return (
                    <div key={type.id} style={{ padding: '10px 12px', borderRadius: '0.625rem', border: `1px solid ${isEditing ? 'var(--brand)' : 'var(--border)'}`, background: isEditing ? 'var(--brand-light)' : 'var(--bg-primary)' }}>
                      {isEditing ? (
                        <EditTypeForm
                          type={type}
                          onClose={() => setEditingType(null)}
                          onSaved={() => setEditingType(null)}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', background: `${type.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <IconComponent size={16} style={{ color: type.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{isBn ? type.nameBn : type.name}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{type.icon} · Max: {type.defaultMaxMarks} · <span style={{ color: type.color, fontWeight: 600 }}>{type.percentage}%</span></div>
                          </div>
                          <button onClick={() => updateExtraMarkType(type.id, { isActive: !type.isActive })} style={{ padding: '4px 10px', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', border: `1px solid ${type.isActive ? 'var(--green)' : 'var(--border)'}`, background: type.isActive ? 'var(--green-light)' : 'var(--bg-secondary)', color: type.isActive ? 'var(--green)' : 'var(--text-muted)', fontFamily: 'inherit' }}>
                            {type.isActive ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                          </button>
                          <button onClick={() => setEditingType(type.id)} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            <Edit size={12} />
                          </button>
                          <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteExtraMarkType(type.id) }} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
              <button onClick={() => setShowTypeManager(false)} style={{ padding: '9px 16px', borderRadius: '0.5625rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
              <button onClick={() => setShowAddTypeForm(!showAddTypeForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '9px 20px', borderRadius: '0.5625rem', background: showAddTypeForm ? 'var(--bg-primary)' : 'var(--brand)', border: showAddTypeForm ? '1px solid var(--border)' : 'none', color: showAddTypeForm ? 'var(--text-secondary)' : '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={14} />
                {isBn ? 'নতুন যোগ' : 'Add New'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PDF Download Modal */}
      {showPdfModal && (
        <TabulationPDFOptionsModal
          count={selectedStudents.size}
          isBn={isBn}
          rows={enrichedTabulationData.filter((d) => selectedStudents.has(d.student.id))}
          subjects={
            enrichedTabulationData[0]?.subjectMarks.map((sm) => ({
              name: sm.subjectName || '',
              fullMarks: sm.fullMarks,
            })) || []
          }
          rotateHeaders={rotateHeaders}
          examName={examConfigs.find((e) => e.id === selectedExamId)?.name}
          className={selectedClassId}
          sectionName={selectedSectionId}
          onClose={() => setShowPdfModal(false)}
          onDownload={handleDownloadTabulation}
        />
      )}
    </div>
  )
}

// ─── Edit Type Form Component ───
function EditTypeForm({ type, onClose, onSaved }: { type: { id: string; name: string; nameBn: string; icon: string; color: string; defaultMaxMarks: number; percentage: number }; onClose: () => void; onSaved: () => void }) {
  const isBn = useBn()
  const updateExtraMarkType = useExamStore((s) => s.updateExtraMarkType)
  const [name, setName] = useState(type.name)
  const [nameBn, setNameBn] = useState(type.nameBn)
  const [icon, setIcon] = useState(type.icon)
  const [color, setColor] = useState(type.color)
  const [percentage, setPercentage] = useState(String(type.percentage))

  const iconOptions = [
    'ClipboardCheck', 'Shield', 'BookOpen', 'Award', 'Users', 'CheckCircle',
    'TrendingUp', 'Target', 'FileSpreadsheet', 'BarChart2', 'Star', 'Heart',
    'Zap', 'Coffee', 'Music',
  ]

  const handleSave = () => {
    if (!name.trim()) return
    updateExtraMarkType(type.id, {
      name: name.trim(),
      nameBn: nameBn.trim() || name.trim(),
      icon,
      color,
      percentage: Math.min(100, Math.max(0, Number(percentage) || 100)),
    })
    onSaved()
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'নাম' : 'Name'}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} w-full`} />
        </div>
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'নাম (বাংলা)' : 'Name (Bn)'}</label>
          <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={`${inputCls} w-full`} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'আইকন' : 'Icon'}</label>
          <select value={icon} onChange={(e) => setIcon(e.target.value)} className={`${selectCls} w-full`}>
            {iconOptions.map((i) => (<option key={i} value={i}>{i}</option>))}
          </select>
        </div>
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'রং' : 'Color'}</label>
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-md border border-[var(--border)] cursor-pointer" />
            <span className="text-[0.625rem] text-[var(--text-muted)]">{color}</span>
          </div>
        </div>
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'সর্বোচ্চ %' : 'Max %'}</label>
          <input type="number" min={0} max={100} value={percentage} onChange={(e) => setPercentage(e.target.value)} className={`${inputCls} w-full`} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer hover:border-[var(--text-muted)] transition-all">
          {isBn ? 'বাতিল' : 'Cancel'}
        </button>
        <button onClick={handleSave} disabled={!name.trim()} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium cursor-pointer border-none hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <Save size={12} />
          {isBn ? 'সংরক্ষণ' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Add Type Form Component ───
function AddTypeForm({ onClose, onAdded }: { onClose: () => void; onAdded?: () => void }) {
  const isBn = useBn()
  const addExtraMarkType = useExamStore((s) => s.addExtraMarkType)
  const [name, setName] = useState('')
  const [nameBn, setNameBn] = useState('')
  const [icon, setIcon] = useState('Award')
  const [color, setColor] = useState('#3b82f6')
  const [percentage, setPercentage] = useState('100')

  const iconOptions = [
    'ClipboardCheck', 'Shield', 'BookOpen', 'Award', 'Users', 'CheckCircle',
    'TrendingUp', 'Target', 'FileSpreadsheet', 'BarChart2', 'Star', 'Heart',
    'Zap', 'Coffee', 'Music',
  ]

  const handleAdd = () => {
    if (!name.trim()) return
    addExtraMarkType({
      name: name.trim(),
      nameBn: nameBn.trim() || name.trim(),
      icon,
      color,
      defaultMaxMarks: 0,
      percentage: Math.min(100, Math.max(0, Number(percentage) || 100)),
      isActive: true,
    })
    setName('')
    setNameBn('')
    setIcon('Award')
    setColor('#3b82f6')
    setPercentage('100')
    if (onAdded) onAdded()
    else onClose()
  }

  return (
    <div className="space-y-3">
      <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
        {isBn ? 'নতুন ধরন যোগ করুন' : 'Add New Type'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'নাম' : 'Name'}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputCls} w-full`}
            placeholder={isBn ? 'যেমন: অংশগ্রহণ' : 'e.g. Participation'}
          />
        </div>
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'নাম (বাংলা)' : 'Name (Bn)'}</label>
          <input
            value={nameBn}
            onChange={(e) => setNameBn(e.target.value)}
            className={`${inputCls} w-full`}
            placeholder={isBn ? 'যেমন: অংশগ্রহণ' : 'e.g. অংশগ্রহণ'}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'আইকন' : 'Icon'}</label>
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className={`${selectCls} w-full`}
          >
            {iconOptions.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'রং' : 'Color'}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-md border border-[var(--border)] cursor-pointer"
            />
            <span className="text-[0.625rem] text-[var(--text-muted)]">{color}</span>
          </div>
        </div>
        <div>
          <label className="text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1 block">{isBn ? 'সর্বোচ্চ %' : 'Max %'}</label>
          <input
            type="number"
            min={0}
            max={100}
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className={`${inputCls} w-full`}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-[var(--border)]">
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer hover:border-[var(--text-muted)] transition-all"
        >
          {isBn ? 'বাতিল' : 'Close'}
        </button>
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium cursor-pointer border-none hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={12} />
          {isBn ? 'সংরক্ষণ' : 'Save'}
        </button>
      </div>
    </div>
  )
}
