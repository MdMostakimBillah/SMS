import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Plus,
  Calendar,
  Settings,
  Edit2,
  BarChart2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useExamStore } from '@/store/examStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import StepProgress from '@/components/ui/StepProgress'
import WorkflowCard from '@/components/ui/WorkflowCard'
import gsap from 'gsap'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const chartTooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  padding: '8px 12px',
}

const SectionHead = memo(function SectionHead({ color }: { color: string }) {
  return <div style={{ width: '3px', height: '14px', background: color, borderRadius: '2px', flexShrink: 0 }} />
})

const gradeColors: Record<string, string> = {
  'A+': '#10b981',
  A: '#34d399',
  'A-': '#6ee7b7',
  B: '#60a5fa',
  C: '#fbbf24',
  D: '#f97316',
  F: '#ef4444',
}

function ExamSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <div className="skeleton skeleton-title" style={{ width: '220px' }} />
        <div className="skeleton skeleton-text" style={{ width: '160px' }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: '60px', borderRadius: '12px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ height: '80px' }} />
        ))}
      </div>
    </div>
  )
}

export default function ExamDashboard() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const students = useSessionStudents()
  const subjects = useTeacherStore((s) => s.subjects)
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const examConfigs = useMemo(() => allExamConfigs.filter((e) => e.session === currentSession), [allExamConfigs, currentSession])
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const studentMarks = useExamStore((s) => s.studentMarks)
  const routines = useExamStore((s) => s.routines)
  const seatPlans = useExamStore((s) => s.seatPlans)
  const invigilators = useExamStore((s) => s.invigilators)
  const marksEntryStatuses = useExamStore((s) => s.marksEntryStatuses)
  const promotions = useExamStore((s) => s.promotions)
  const omrConfigs = useExamStore((s) => s.omrConfigs)
  const rooms = useExamStore((s) => s.rooms)
  const gradeScales = useExamStore((s) => s.gradeScales)

  const isBn = language === 'bn'
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(cards, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' })
  }, [isLoading])

  // ── Derived Stats (memoized) ──
  const activeExam = useMemo(() => examConfigs.find((e) => e.isActive), [examConfigs])

  const activeExamId = activeExam?.id

  const activeExamSubjects = useMemo(
    () => (activeExamId ? subjectMarkConfigs.filter((s) => s.examId === activeExamId) : []),
    [subjectMarkConfigs, activeExamId]
  )

  const activeExamRoutines = useMemo(
    () => (activeExamId ? routines.filter((r) => r.examId === activeExamId) : []),
    [routines, activeExamId]
  )

  const activeExamSeats = useMemo(
    () => (activeExamId ? seatPlans.filter((sp) => sp.examId === activeExamId) : []),
    [seatPlans, activeExamId]
  )

  const completedRoutines = useMemo(() => activeExamRoutines.filter((r) => r.status === 'completed').length, [activeExamRoutines])
  const totalRoutines = activeExamRoutines.length
  const totalSubjects = activeExamSubjects.length

  const completedSubjects = useMemo(
    () => activeExamSubjects.filter((s) => studentMarks.some((m) => m.examId === s.examId && m.subjectId === s.subjectId)).length,
    [activeExamSubjects, studentMarks]
  )

  const publishedResults = useMemo(() => examConfigs.filter((e) => e.isActive).length, [examConfigs])
  const pendingPromotions = useMemo(() => promotions.filter((p) => p.status === 'eligible').length, [promotions])
  const promotedCount = useMemo(() => promotions.filter((p) => p.status === 'promoted').length, [promotions])
  const notEligibleCount = useMemo(() => promotions.filter((p) => p.status === 'not-eligible').length, [promotions])

  // ── Step Status ──
  const steps = useMemo(() => {
    const s1 = examConfigs.length > 0 && subjectMarkConfigs.length > 0
    const s2 = activeExamRoutines.length > 0 && completedRoutines === totalRoutines && totalRoutines > 0
    const s3 = totalSubjects > 0 && completedSubjects === totalSubjects
    const s4 = studentMarks.length > 0
    const s5 = promotions.some((p) => p.status === 'promoted')
    return [
      {
        key: 'planning',
        label: 'Planning',
        labelBn: 'পরিকল্পনা',
        icon: Settings,
        status: s1 ? ('completed' as const) : ('current' as const),
      },
      {
        key: 'scheduling',
        label: 'Scheduling',
        labelBn: 'সময়সূচী',
        icon: Calendar,
        status: s1 ? (s2 ? ('completed' as const) : ('current' as const)) : ('upcoming' as const),
      },
      {
        key: 'evaluation',
        label: 'Evaluation',
        labelBn: 'মূল্যায়ন',
        icon: Edit2,
        status: s2 ? (s3 ? ('completed' as const) : ('current' as const)) : ('upcoming' as const),
      },
      {
        key: 'results',
        label: 'Results',
        labelBn: 'ফলাফল',
        icon: BarChart2,
        status: s3 ? (s4 ? ('completed' as const) : ('current' as const)) : ('upcoming' as const),
      },
      {
        key: 'promotion',
        label: 'Promotion',
        labelBn: 'প্রমোশন',
        icon: GraduationCap,
        status: s4 ? (s5 ? ('completed' as const) : ('current' as const)) : ('upcoming' as const),
      },
    ]
  }, [
    examConfigs,
    subjectMarkConfigs,
    activeExamRoutines,
    completedRoutines,
    totalRoutines,
    totalSubjects,
    completedSubjects,
    studentMarks,
    promotions,
  ])

  const handleStepClick = useCallback(
    (key: string) => {
      const routeMap: Record<string, string> = {
        planning: '/exams/planning',
        scheduling: '/exams/scheduling',
        evaluation: '/exams/evaluation',
        results: '/exams/results',
        promotion: '/exams/marksheet',
      }
      navigate(routeMap[key] || '/exams')
    },
    [navigate]
  )

  const col4 = isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'
  const col2 = isMobile ? '1fr' : '1fr 1fr'
  const gap = isMobile ? '10px' : '14px'

  const card: React.CSSProperties = useMemo(
    () => ({
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: isMobile ? '14px' : '16px',
      boxShadow: 'var(--shadow-xs)',
    }),
    [isMobile]
  )

  const gradeDistribution = useMemo(() => {
    const gradeCount: Record<string, number> = {}
    for (const m of studentMarks) gradeCount[m.grade] = (gradeCount[m.grade] || 0) + 1
    return Object.entries(gradeCount).map(([name, value]) => ({ name, value, color: gradeColors[name] || '#94a3b8' }))
  }, [studentMarks])

  const completedCount = useMemo(() => steps.filter((s) => s.status === 'completed').length, [steps])

  // ── Subject map for O(n) lookups ──
  const subjectMap = useMemo(() => {
    const map = new Map<string, (typeof subjects)[0]>()
    for (const s of subjects) map.set(s.id, s)
    return map
  }, [subjects])

  // ── Pre-computed subject names for marksEntryStatuses ──
  const entryStatusSubjects = useMemo(
    () =>
      marksEntryStatuses.slice(0, 5).map((entry) => ({
        ...entry,
        subjectName: subjectMap.get(entry.subjectId),
      })),
    [marksEntryStatuses, subjectMap]
  )

  const approvedStudentCount = useMemo(() => students.filter((s) => s.status === 'approved').length, [students])

  // ── Handlers ──
  const navPlanning = useCallback(() => navigate('/exams/planning'), [navigate])
  const navScheduling = useCallback(() => navigate('/exams/scheduling'), [navigate])
  const navEvaluation = useCallback(() => navigate('/exams/evaluation'), [navigate])
  const navResults = useCallback(() => navigate('/exams/results'), [navigate])
  const navMarksheet = useCallback(() => navigate('/exams/marksheet'), [navigate])

  // ── Static stat data ──
  const quickStats = useMemo(
    () => [
      { labelBn: 'নির্ধারিত পরীক্ষা', labelEn: 'Scheduled', value: totalRoutines, color: 'var(--teal)', cardBg: 'var(--teal-light)' },
      {
        labelBn: 'মার্কস বাকি',
        labelEn: 'Pending Entry',
        value: Math.max(0, totalSubjects * 5 - studentMarks.length),
        color: 'var(--amber)',
        cardBg: 'var(--amber-light)',
      },
      { labelBn: 'প্রকাশিত ফলাফল', labelEn: 'Published', value: publishedResults, color: 'var(--green)', cardBg: 'var(--green-light)' },
      {
        labelBn: 'প্রমোশন বাকি',
        labelEn: 'Ready to Promote',
        value: pendingPromotions,
        color: 'var(--purple)',
        cardBg: 'var(--purple-light)',
      },
    ],
    [totalRoutines, totalSubjects, studentMarks.length, publishedResults, pendingPromotions]
  )

  const progressItems = useMemo(() => {
    if (!activeExam) return []
    const invigCount = invigilators.filter((i) => i.examId === activeExam.id).length
    return [
      {
        bn: 'বিষয় কনফিগারেশন',
        en: 'Subject Configuration',
        val: `${completedSubjects}/${totalSubjects}`,
        bar: totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0,
        color: 'var(--brand)',
      },
      {
        bn: 'রুটিন সম্পন্ন',
        en: 'Routine Completed',
        val: `${completedRoutines}/${totalRoutines}`,
        bar: totalRoutines > 0 ? Math.round((completedRoutines / totalRoutines) * 100) : 0,
        color: 'var(--teal)',
      },
      {
        bn: 'আসন বরাদ্দ',
        en: 'Seats Assigned',
        val: `${activeExamSeats.length}/${approvedStudentCount}`,
        bar: approvedStudentCount > 0 ? Math.round((activeExamSeats.length / approvedStudentCount) * 100) : 0,
        color: 'var(--amber)',
      },
      { bn: 'ইনভিজিলেটর', en: 'Invigilators', val: `${invigCount}`, bar: Math.min(100, invigCount * 33), color: 'var(--purple)' },
    ]
  }, [activeExam, completedSubjects, totalSubjects, completedRoutines, totalRoutines, activeExamSeats, approvedStudentCount, invigilators])

  const checklist = useMemo(() => {
    const totalSubjects = subjects.length || 1
    const allConfigs = subjectMarkConfigs
    const uniqueClassIds = new Set(allConfigs.map((c) => c.classId))
    const classesWithConfigs = uniqueClassIds.size || 1
    const totalConfigured = allConfigs.length
    const totalExpected = classesWithConfigs * totalSubjects
    const subjectPct = totalExpected > 0 ? Math.round((totalConfigured / totalExpected) * 100) : 0
    return [
      { done: examConfigs.length > 0, label: isBn ? 'পরীক্ষা তৈরি' : 'Exam Created', link: '/exams/planning' },
      {
        done: subjectMarkConfigs.length > 0,
        label: isBn ? `বিষয় কনফিগ (${subjectPct}%)` : `Subject Configured (${subjectPct}%)`,
        pct: subjectPct,
        link: '/exams/planning',
      },
      {
        done: subjectMarkConfigs.some((s) => s.subExams.length > 0),
        label: isBn ? 'সাব-এক্সাম সেটআপ' : 'Sub-exams Set Up',
        link: '/exams/planning',
      },
      { done: gradeScales.length > 0, label: isBn ? 'গ্রেড স্কেল' : 'Grade Scale', link: '/exams/planning' },
      { done: omrConfigs.length > 0, label: isBn ? 'OMR সেটআপ' : 'OMR Setup', link: '/exams/omr' },
      { done: rooms.length > 0, label: isBn ? 'কক্ষ সেটআপ' : 'Room Setup', link: '/exams/scheduling' },
      { done: activeExamRoutines.length > 0, label: isBn ? 'রুটিন তৈরি' : 'Routine Created', link: '/exams/scheduling' },
      { done: invigilators.length > 0, label: isBn ? 'ইনভিজিলেটর নিয়োগ' : 'Invigilator Assigned', link: '/exams/scheduling' },
      { done: studentMarks.length > 0, label: isBn ? 'মার্কস এন্ট্রি' : 'Marks Entered', link: '/exams/evaluation' },
      { done: promotions.length > 0, label: isBn ? 'প্রমোশন সম্পন্ন' : 'Promotion Done', link: '/exams/marksheet' },
    ]
  }, [
    examConfigs,
    subjectMarkConfigs,
    omrConfigs,
    rooms,
    activeExamRoutines,
    invigilators,
    studentMarks,
    promotions,
    gradeScales,
    subjects,
    isBn,
  ])

  const checklistPct = useMemo(() => {
    if (checklist.length === 0) return 0
    return Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
  }, [checklist])

  const promoSummary = useMemo(
    () => [
      { label: isBn ? 'মোট শিক্ষার্থী' : 'Total Students', value: approvedStudentCount, color: 'var(--brand)' },
      { label: isBn ? 'যোগ্য' : 'Eligible', value: promotions.filter((p) => p.status === 'eligible').length, color: 'var(--green)' },
      { label: isBn ? 'প্রমোটেড' : 'Promoted', value: promotedCount, color: 'var(--teal)' },
      { label: isBn ? 'অযোগ্য' : 'Not Eligible', value: notEligibleCount, color: 'var(--red)' },
    ],
    [approvedStudentCount, promotions, promotedCount, notEligibleCount, isBn]
  )

  if (isLoading) return <ExamSkeleton />

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {/* Header */}
      <div
        className="gsap-fade-up"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ClipboardList size={20} style={{ color: 'var(--brand)' }} />
            {isBn ? 'পরীক্ষা ও ফলাফল ব্যবস্থাপনা' : 'Examination & Results'}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {isBn ? 'পরীক্ষার পুরো প্রক্রিয়া পরিচালনা করুন' : 'Manage the complete examination lifecycle'}
          </p>
        </div>
        <button className="btn-minimal" onClick={navPlanning}>
          <Plus size={14} /> {isBn ? 'নতুন পরীক্ষা' : 'New Exam'}
        </button>
      </div>

      {/* Active Exam Alert */}
      {activeExam && (
        <div
          className="gsap-fade-up"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--brand-light)',
            border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            color: 'var(--brand)',
            alignSelf: 'flex-start',
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--brand)',
              animation: 'pulse 2s infinite',
              flexShrink: 0,
            }}
          />
          {isBn ? `সক্রিয় পরীক্ষা: ${activeExam.nameBn}` : `Active Exam: ${activeExam.name}`}
          <span style={{ fontSize: '10px', color: 'var(--brand-2)', marginLeft: '4px' }}>
            {activeExam.startDate} – {activeExam.endDate}
          </span>
        </div>
      )}

      {/* Workflow Progress */}
      <div className="gsap-fade-up" style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '12px' : '14px' }}>
          <SectionHead color="var(--brand)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'পরীক্ষার ধাপসমূহ' : 'Examination Workflow'}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: 'var(--green)',
              background: 'var(--green-light)',
              padding: '2px 8px',
              borderRadius: '6px',
              marginLeft: 'auto',
            }}
          >
            {completedCount}/{steps.length} {isBn ? 'সম্পন্ন' : 'Done'}
          </span>
        </div>
        <StepProgress steps={steps} onStepClick={handleStepClick} />
      </div>

      {/* Quick Stats */}
      <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col4, gap }}>
        {quickStats.map((s) => (
          <div
            key={s.labelEn}
            style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'default', transition: 'all 0.15s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: s.cardBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.color,
                flexShrink: 0,
                fontSize: '16px',
              }}
            >
              {s.labelEn === 'Scheduled' ? (
                <Calendar size={16} />
              ) : s.labelEn === 'Pending Entry' ? (
                <Edit2 size={16} />
              ) : s.labelEn === 'Published' ? (
                <FileText size={16} />
              ) : (
                <GraduationCap size={16} />
              )}
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{isBn ? s.labelBn : s.labelEn}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grade Distribution + Active Exam Progress */}
      <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col2, gap }}>
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <SectionHead color="var(--brand)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'গ্রেড বিতরণ' : 'Grade Distribution'}
            </span>
          </div>
          {gradeDistribution.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: isMobile ? 100 : 120, height: isMobile ? 100 : 120 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={24} outerRadius={40} dataKey="value" paddingAngle={2}>
                      {gradeDistribution.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {gradeDistribution.map((g) => (
                  <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{g.name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
              <BarChart2 size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
              {isBn ? 'এখনো কোনো মার্কস এন্ট্রি হয়নি' : 'No marks entered yet'}
            </div>
          )}
        </div>

        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <SectionHead color="var(--green)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'সক্রিয় পরীক্ষার অগ্রগতি' : 'Active Exam Progress'}
            </span>
          </div>
          {activeExam ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {progressItems.map((item) => (
                <div key={item.en}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{isBn ? item.bn : item.en}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.val}</span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${item.bar}%`,
                        background: item.color,
                        borderRadius: '3px',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
              <AlertTriangle size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
              {isBn ? 'কোনো সক্রিয় পরীক্ষা নেই' : 'No active exam'}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="gsap-fade-up">
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '10px',
          }}
        >
          {isBn ? 'দ্রুত কাজ' : 'Quick Actions'}
        </div>
        <div
          className="gsap-fade-up"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
            gap: '10px',
          }}
        >
          <WorkflowCard
            icon={Plus}
            iconColor="var(--brand)"
            iconBg="var(--brand-light)"
            title={isBn ? 'নতুন পরীক্ষা তৈরি' : 'Create Exam'}
            titleBn="নতুন পরীক্ষা"
            description={isBn ? 'পরীক্ষা সেটআপ শুরু করুন' : 'Start exam setup'}
            descriptionBn="পরীক্ষা সেটআপ"
            stat={`${examConfigs.length} ${isBn ? 'টি পরীক্ষা' : 'exams'}`}
            statColor="var(--brand)"
            onClick={navPlanning}
          />
          <WorkflowCard
            icon={Calendar}
            iconColor="var(--teal)"
            iconBg="var(--teal-light)"
            title={isBn ? 'রুটিন তৈরি' : 'Generate Routine'}
            titleBn="রুটিন তৈরি"
            description={isBn ? 'পরীক্ষার সময়সূচী তৈরি' : 'Create exam timetable'}
            descriptionBn="সময়সূচী তৈরি"
            stat={`${totalRoutines} ${isBn ? 'টি রুটিন' : 'routines'}`}
            statColor="var(--teal)"
            onClick={navScheduling}
          />
          <WorkflowCard
            icon={FileSpreadsheet}
            iconColor="var(--amber)"
            iconBg="var(--amber-light)"
            title={isBn ? 'আসন পরিকল্পনা' : 'Create Seat Plan'}
            titleBn="আসন পরিকল্পনা"
            description={isBn ? 'কক্ষ ও আসন বরাদ্দ' : 'Room & seat assignment'}
            descriptionBn="কক্ষ ও আসন বরাদ্দ"
            stat={`${activeExamSeats.length} ${isBn ? 'টি আসন' : 'seats'}`}
            statColor="var(--amber)"
            onClick={navScheduling}
          />
          <WorkflowCard
            icon={Edit2}
            iconColor="var(--green)"
            iconBg="var(--green-light)"
            title={isBn ? 'মার্কস এন্ট্রি' : 'Enter Marks'}
            titleBn="মার্কস এন্ট্রি"
            description={isBn ? 'শিক্ষার্থীদের মার্কস প্রবেশ' : 'Enter student marks'}
            descriptionBn="মার্কস প্রবেশ"
            stat={`${studentMarks.length} ${isBn ? 'টি এন্ট্রি' : 'entries'}`}
            statColor="var(--green)"
            onClick={navEvaluation}
          />
          <WorkflowCard
            icon={FileText}
            iconColor="var(--purple)"
            iconBg="var(--purple-light)"
            title={isBn ? 'ফলাফল প্রকাশ' : 'Publish Result'}
            titleBn="ফলাফল প্রকাশ"
            description={isBn ? 'ফলাফল প্রকাশ ও বিশ্লেষণ' : 'Publish & analyze results'}
            descriptionBn="ফলাফল প্রকাশ"
            stat={`${publishedResults} ${isBn ? 'টি প্রকাশিত' : 'published'}`}
            statColor="var(--purple)"
            onClick={navResults}
          />
          <WorkflowCard
            icon={GraduationCap}
            iconColor="var(--red)"
            iconBg="var(--red-light)"
            title={isBn ? 'শিক্ষার্থী প্রমোশন' : 'Promote Students'}
            titleBn="প্রমোশন"
            description={isBn ? 'পরবর্তী ক্লাসে প্রমোট' : 'Promote to next class'}
            descriptionBn="পরবর্তী ক্লাসে প্রমোট"
            stat={`${promotedCount} ${isBn ? 'জন প্রমোটেড' : 'promoted'}`}
            statColor="var(--red)"
            onClick={navMarksheet}
          />
        </div>
      </div>

      {/* Marks Entry Status + Setup Checklist */}
      <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col2, gap }}>
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <SectionHead color="var(--amber)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'মার্কস এন্ট্রি অবস্থা' : 'Marks Entry Status'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {entryStatusSubjects.map((entry) => {
              const statusColors: Record<string, { bg: string; color: string; label: string; labelBn: string }> = {
                completed: { bg: 'var(--green-light)', color: 'var(--green)', label: 'Completed', labelBn: 'সম্পন্ন' },
                'in-progress': { bg: 'var(--amber-light)', color: 'var(--amber)', label: 'In Progress', labelBn: 'চলমান' },
                pending: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', label: 'Pending', labelBn: 'অপেক্ষমান' },
                locked: { bg: 'var(--red-light)', color: 'var(--red)', label: 'Locked', labelBn: 'লক' },
              }
              const st = statusColors[entry.status]
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {isBn ? entry.subjectName?.nameBn : entry.subjectName?.name} — {entry.classId} {entry.sectionId}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {entry.enteredCount}/{entry.totalStudents} {isBn ? 'জন এন্ট্রি' : 'entered'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${entry.totalStudents > 0 ? Math.round((entry.enteredCount / entry.totalStudents) * 100) : 0}%`,
                          background: st.color,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: st.bg,
                        color: st.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isBn ? st.labelBn : st.label}
                    </span>
                  </div>
                </div>
              )
            })}
            {marksEntryStatuses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                <Clock size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                {isBn ? 'এখনো মার্কস এন্ট্রি শুরু হয়নি' : 'No marks entry started yet'}
              </div>
            )}
          </div>
        </div>

        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SectionHead color="var(--teal)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'সেটআপ চেকলিস্ট' : 'Setup Checklist'}
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                background: checklistPct === 100 ? 'var(--green-light)' : checklistPct >= 50 ? 'var(--amber-light)' : 'var(--red-light)',
                color: checklistPct === 100 ? 'var(--green)' : checklistPct >= 50 ? 'var(--amber)' : 'var(--red)',
              }}
            >
              {checklistPct}%
            </div>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '12px' }}>
            <div
              style={{
                height: '100%',
                width: `${checklistPct}%`,
                background: checklistPct === 100 ? 'var(--green)' : checklistPct >= 50 ? 'var(--amber)' : 'var(--red)',
                borderRadius: '2px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {checklist.map((item, i) => (
              <div
                key={i}
                onClick={() => navigate(item.link)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: item.done ? 'var(--green-light)' : 'var(--bg-secondary)',
                  border: `1px solid ${item.done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: item.done ? 'var(--green)' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.done && <CheckCircle2 size={11} color="#fff" />}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    flex: 1,
                    color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: item.done ? 500 : 400,
                  }}
                >
                  {item.label}
                </span>
                <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promotion Summary */}
      <div className="gsap-fade-up" style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <SectionHead color="var(--purple)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'প্রমোশন সারসংক্ষেপ' : 'Promotion Summary'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
          {promoSummary.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  flexShrink: 0,
                }}
              >
                <GraduationCap size={15} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}
