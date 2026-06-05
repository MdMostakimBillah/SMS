import { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'

const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] p-[0.875rem] mb-[0.875rem]'
const sectionTitleCls = 'flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--text-primary)]'
const inputCls =
  'h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border'
const btnPrimary =
  'flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.875rem] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]'

type SubTab = 'extra-marks' | 'tabulation' | 'analysis' | 'position'

export default function Step4Results() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const subjects = useTeacherStore((s) => s.subjects)
  const { classes } = useClassStore()
  const currentSession = useClassStore((s) => s.institution.currentSession)
  const students = useSessionStudents()
  const isBn = language === 'bn'

  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const examConfigs = useMemo(() => allExamConfigs.filter((e) => e.session === currentSession), [allExamConfigs, currentSession])
  const studentMarks = useExamStore((s) => s.studentMarks)
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const extraMarks = useExamStore((s) => s.extraMarks)
  const addExtraMark = useExamStore((s) => s.addExtraMark)
  const deleteExtraMark = useExamStore((s) => s.deleteExtraMark)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('tabulation')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find((e) => e.isActive)?.id || '')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')

  // Extra marks form
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [extraForm, setExtraForm] = useState({
    studentId: '',
    type: 'attendance' as 'attendance' | 'discipline' | 'homework',
    marks: '0',
    maxMarks: '10',
    note: '',
  })

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (selectedClassId ? sectionsMap[selectedClassId] || [] : []), [selectedClassId, sectionsMap])

  const classStudents = useMemo(() => {
    if (!selectedClassId || !selectedSectionId) return []
    return students.filter((s) => s.status === 'approved' && s.class === selectedClassId && s.section === selectedSectionId)
  }, [students, selectedClassId, selectedSectionId])

  // Tabulation data
  const tabulationData = useMemo(() => {
    if (!selectedExamId || !selectedClassId || !selectedSectionId) return []
    const examSubjects = subjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === selectedClassId)
    return classStudents
      .map((student) => {
        const subjectMarks = examSubjects.map((sc) => {
          const mark = studentMarks.find(
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
      .sort((a, b) => b.totalObtained - a.totalObtained)
  }, [selectedExamId, selectedClassId, selectedSectionId, classStudents, subjectMarkConfigs, studentMarks, subjects, isBn])

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

  // Analysis data
  const analysisData = useMemo(() => {
    if (!selectedExamId) return null
    const examSubjects = subjectMarkConfigs.filter((s) => s.examId === selectedExamId && s.classId === selectedClassId)
    const subjectStats = examSubjects.map((sc) => {
      const subject = subjects.find((s) => s.id === sc.subjectId)
      const marks = studentMarks.filter((m) => m.examId === selectedExamId && m.subjectId === sc.subjectId)
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
    const avgPercentage = totalStudents > 0 ? Math.round(tabulationData.reduce((a, d) => a + d.percentage, 0) / totalStudents) : 0

    return { subjectStats, totalStudents, passedStudents, passRate, avgPercentage }
  }, [selectedExamId, selectedClassId, tabulationData, subjectMarkConfigs, studentMarks, subjects, isBn])

  const handleSaveExtra = () => {
    if (!selectedExamId || !extraForm.studentId || !extraForm.marks) return
    addExtraMark({
      examId: selectedExamId,
      studentId: extraForm.studentId,
      classId: selectedClassId,
      sectionId: selectedSectionId,
      type: extraForm.type,
      marks: Number(extraForm.marks) || 0,
      maxMarks: Number(extraForm.maxMarks) || 10,
      note: extraForm.note,
    })
    setShowExtraForm(false)
    setExtraForm({ studentId: '', type: 'attendance', marks: '0', maxMarks: '10', note: '' })
  }

  const extraMarkTypes = [
    { key: 'attendance' as const, label: isBn ? 'উপস্থিতি' : 'Attendance', icon: '📋', color: 'var(--green)' },
    { key: 'discipline' as const, label: isBn ? 'শৃঙ্খলা' : 'Discipline', icon: '🎯', color: 'var(--brand)' },
    { key: 'homework' as const, label: isBn ? 'হোমওয়ার্ক' : 'Homework', icon: '📝', color: 'var(--amber)' },
  ]

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
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 items-center flex-wrap">
        <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className={`${inputCls} max-w-[12.5rem]`}>
          <option value="">{isBn ? 'পরীক্ষা...' : 'Exam...'}</option>
          {examConfigs.map((e) => (
            <option key={e.id} value={e.id}>
              {isBn ? e.nameBn : e.name}
            </option>
          ))}
        </select>
        <select
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value)
            setSelectedSectionId('')
          }}
          className={`${inputCls} max-w-[8.75rem]`}
        >
          <option value="">{isBn ? 'শ্রেণি...' : 'Class...'}</option>
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
          className={`${inputCls} max-w-[8.75rem]`}
          disabled={!selectedClassId}
        >
          <option value="">{isBn ? 'সেকশন...' : 'Section...'}</option>
          {sectionOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {[
          { key: 'tabulation' as SubTab, label: isBn ? 'ট্যাবুলেশন' : 'Tabulation', icon: <FileSpreadsheet size={14} /> },
          { key: 'extra-marks' as SubTab, label: isBn ? 'এক্সট্রা মার্কস' : 'Extra Marks', icon: <Award size={14} /> },
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
                <div className={sectionTitleCls}>
                  <FileSpreadsheet size={15} className="text-[var(--brand)]" />
                  {isBn ? 'ট্যাবুলেশন শিট' : 'Tabulation Sheet'} ({tabulationData.length} {isBn ? 'জন' : 'students'})
                </div>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-xs min-w-[37.5rem]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="py-2 px-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] w-8">#</th>
                        <th className="py-2 px-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                        {tabulationData[0]?.subjectMarks.map((sm) => (
                          <th key={sm.subjectId} className="py-2 px-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                            <div className="truncate max-w-[5rem]">{sm.subjectName}</div>
                          </th>
                        ))}
                        <th className="py-2 px-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'মোট' : 'Total'}
                        </th>
                        <th className="py-2 px-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">%</th>
                        <th className="py-2 px-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">GPA</th>
                        <th className="py-2 px-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অবস্থা' : 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabulationData.map((row, idx) => (
                        <tr key={row.student.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                          <td className="py-2 px-2 text-[var(--text-muted)]">{idx + 1}</td>
                          <td className="py-2 px-2 text-[0.6875rem] font-medium text-[var(--text-primary)]">
                            {isBn ? row.student.nameBn || row.student.nameEn : row.student.nameEn}
                          </td>
                          {row.subjectMarks.map((sm) => (
                            <td key={sm.subjectId} className="py-2 px-2 text-center">
                              <span className={`text-[0.6875rem] font-medium ${sm.passed ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                                {sm.obtained}
                              </span>
                              <span className="text-[0.5625rem] text-[var(--text-muted)]">/{sm.fullMarks}</span>
                            </td>
                          ))}
                          <td className="py-2 px-2 text-center text-[0.75rem] font-bold text-[var(--text-primary)]">{row.totalObtained}</td>
                          <td className="py-2 px-2 text-center text-[0.6875rem] font-medium text-[var(--text-secondary)]">{row.percentage}%</td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`text-[0.625rem] font-bold px-1.5 py-0.5 rounded ${row.gpa >= 4 ? 'bg-[#dcfce7] text-[#15803d]' : row.gpa >= 2 ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}
                            >
                              {row.gpa.toFixed(1)}
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
            <div className="flex justify-between items-center mb-3">
              <span className="text-[0.75rem] text-[var(--text-secondary)]">
                {extraMarks.filter((e) => (selectedExamId ? e.examId === selectedExamId : true)).length} {isBn ? 'টি এন্ট্রি' : 'entries'}
              </span>
              <button onClick={() => setShowExtraForm(true)} className={btnPrimary}>
                <Plus size={14} />
                {isBn ? 'নতুন এন্ট্রি' : 'New Entry'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {extraMarkTypes.map((type) => {
                const count = extraMarks.filter((e) => e.type === type.key && (selectedExamId ? e.examId === selectedExamId : true)).length
                return (
                  <div key={type.key} className={sectionCls} style={{ borderColor: `${type.color}30` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[1rem]">{type.icon}</span>
                      <div>
                        <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{type.label}</div>
                        <div className="text-[0.625rem] text-[var(--text-muted)]">
                          {count} {isBn ? 'টি এন্ট্রি' : 'entries'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={sectionCls}>
              <div className="space-y-2">
                {extraMarks
                  .filter((e) => (selectedExamId ? e.examId === selectedExamId : true))
                  .map((entry) => {
                    const student = students.find((s) => s.id === entry.studentId)
                    const typeInfo = extraMarkTypes.find((t) => t.key === entry.type)
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
                      >
                        <span className="text-[0.875rem]">{typeInfo?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.75rem] font-medium text-[var(--text-primary)]">{student?.nameEn || entry.studentId}</div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">
                            {entry.note} · {entry.classId} {entry.sectionId}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
                            {entry.marks}/{entry.maxMarks}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteExtraMark(entry.id)
                          }}
                          className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)] shrink-0"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )
                  })}
              </div>
            </div>
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
      {showExtraForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[0.875rem] max-w-[23.75rem] w-full p-5 border border-[var(--border)]">
            <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-3">
              {isBn ? 'এক্সট্রা মার্কস যোগ' : 'Add Extra Marks'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিক্ষার্থী' : 'Student'}</label>
                <select
                  value={extraForm.studentId}
                  onChange={(e) => setExtraForm((p) => ({ ...p, studentId: e.target.value }))}
                  className={`${inputCls} w-full`}
                >
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isBn ? s.nameBn || s.nameEn : s.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ধরন' : 'Type'}</label>
                <select
                  value={extraForm.type}
                  onChange={(e) => setExtraForm((p) => ({ ...p, type: e.target.value as 'attendance' | 'discipline' | 'homework' }))}
                  className={`${inputCls} w-full`}
                >
                  {extraMarkTypes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'প্রাপ্ত' : 'Marks'}</label>
                  <input
                    type="number"
                    value={extraForm.marks}
                    onChange={(e) => setExtraForm((p) => ({ ...p, marks: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সর্বোচ্চ' : 'Max'}</label>
                  <input
                    type="number"
                    value={extraForm.maxMarks}
                    onChange={(e) => setExtraForm((p) => ({ ...p, maxMarks: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নোট' : 'Note'}</label>
                <input
                  value={extraForm.note}
                  onChange={(e) => setExtraForm((p) => ({ ...p, note: e.target.value }))}
                  className={`${inputCls} w-full`}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowExtraForm(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveExtra} className={`${btnPrimary} text-[0.75rem]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
