import { useEffect, useRef, useState, useMemo } from 'react'
import {
  Users,
  GraduationCap,
  ClipboardList,
  FlaskConical,
  Award,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import CircularChart from '@/components/ui/CircularChart'
import gsap from 'gsap'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#ec4899', '#06b6d4']
const STATUS_COLORS = { approved: '#22c55e', pending: '#f59e0b', rejected: '#ef4444' }

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="skeleton skeleton-title" style={{ width: '12.5rem' }} />
          <div className="skeleton skeleton-text" style={{ width: '9.375rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '5rem', height: '2rem', borderRadius: '0.5rem' }} />
          <div className="skeleton" style={{ width: '6.25rem', height: '2rem', borderRadius: '0.5rem' }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '15.625rem', height: '2.25rem', borderRadius: '1.25rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div className="skeleton skeleton-circle" style={{ width: '2.25rem', height: '2.25rem' }} />
              <div className="skeleton" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem' }} />
            </div>
            <div className="skeleton" style={{ width: '5rem', height: '1.5rem', marginBottom: '0.375rem' }} />
            <div className="skeleton skeleton-text" style={{ width: '6.25rem' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ minHeight: '11.25rem' }} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const isBn = useBn()
  const students = useSessionStudents()
  const { teachers } = useTeacherStore()
  const { isMobile, isTablet } = useWindowSize()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(cards, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' })
  }, [isLoading])

  // Derived data — single-pass computation
  const studentStats = useMemo(() => {
    let approved = 0, pending = 0, rejected = 0, male = 0, female = 0
    for (const s of students) {
      if (s.status === 'approved') approved++
      else if (s.status === 'pending') pending++
      else if (s.status === 'rejected') rejected++
      if (s.gender === 'Male') male++
      else if (s.gender === 'Female') female++
    }
    return { approved, pending, rejected, male, female }
  }, [students])

  const teacherStats = useMemo(() => {
    let active = 0, onLeave = 0, inactive = 0
    for (const t of teachers) {
      if (t.status === 'active') active++
      else if (t.status === 'on-leave') onLeave++
      else if (t.status === 'inactive') inactive++
    }
    return { active, onLeave, inactive }
  }, [teachers])

  const totalStudents = students.length
  const totalTeachers = teachers.length
  const { approved: approvedStudents, pending: pendingStudents, rejected: rejectedStudents, male: maleStudents, female: femaleStudents } = studentStats
  const { active: activeTeachers } = teacherStats

  // Class distribution
  const classDist = useMemo(() => {
    const map = new Map<string, number>()
    students.forEach((s) => {
      const cls = `Class ${s.class}`
      map.set(cls, (map.get(cls) || 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }))
  }, [students])

  // Status distribution
  const statusData = useMemo(() => [
    { name: isBn ? 'অনুমোদিত' : 'Approved', value: approvedStudents, color: STATUS_COLORS.approved },
    { name: isBn ? 'বিচারাধীন' : 'Pending', value: pendingStudents, color: STATUS_COLORS.pending },
    { name: isBn ? 'বাতিল' : 'Rejected', value: rejectedStudents, color: STATUS_COLORS.rejected },
  ], [approvedStudents, pendingStudents, rejectedStudents, isBn])

  // Weekly enrollment trend (last 7 days of data, simulated from our dataset)
  const weeklyTrend = useMemo(() => {
    const days: { name: string; students: number; teachers: number }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayStudents = students.filter((s) => s.createdAt === dateStr).length
      const dayTeachers = teachers.filter((t) => t.createdAt === dateStr).length
      const label = d.toLocaleDateString(isBn ? 'bn' : 'en', { weekday: 'short' })
      days.push({ name: label, students: dayStudents, teachers: dayTeachers })
    }
    return days
  }, [students, teachers, isBn])

  // Recent students (latest 4)
  const recentStudents = useMemo(() => [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4), [students])

  // Top students (approved, roll number sorted)
  const topStudentsList = useMemo(() =>
    [...students]
      .filter((s) => s.status === 'approved')
      .slice(0, 5)
      .map((s, i) => ({
        name: s.nameEn,
        cls: `Class ${s.class} ${s.section}`,
        score: `${85 + Math.floor(Math.random() * 15)}%`,
        initials: s.nameEn
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join(''),
        color: COLORS[i % COLORS.length],
      }))
  , [students])

  // Teacher status distribution
  const { active: activeT, onLeave: onLeaveT, inactive: inactiveT } = teacherStats

  const col4 = isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)'
  const col3 = isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3,1fr)'
  const col2 = isMobile ? '1fr' : '1fr 1fr'
  const gap = isMobile ? '10px' : '0.875rem'

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: isMobile ? '14px' : '1rem',
    boxShadow: 'var(--shadow-xs)',
  }

  const sectionHead = (color: string) => (
    <div style={{ width: '0.1875rem', height: '0.875rem', background: color, borderRadius: '0.125rem', flexShrink: 0 }} />
  )

  const chartTooltipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    padding: '8px 12px',
  }

  if (isLoading) return <DashboardSkeleton />

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {/* Header */}
      <div
        className="gsap-fade-up"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.625rem' }}
      >
        <div>
          <h1 style={{ fontSize: isMobile ? '18px' : '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {isBn ? 'সুপ্রভাত, Admin 👋' : 'Good morning, Admin 👋'}
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1875rem' }}>
            {isBn ? 'শুক্রবার, ৮ মে ২০২৬ · টার্ম ২' : 'Friday, 8 May 2026 · Term 2'}
          </p>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-minimal">
              <Download size={14} /> Export
            </button>
            <button className="btn-minimal btn-brand">
              <Plus size={14} />
              {isBn ? 'নতুন' : 'Add New'}
            </button>
          </div>
        )}
      </div>

      {/* Alert */}
      <div
        className="gsap-fade-up"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--brand-light)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '0.5rem',
          padding: '8px 14px',
          fontSize: '0.75rem',
          color: 'var(--brand)',
          alignSelf: 'flex-start',
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: '0.375rem',
            height: '0.375rem',
            borderRadius: '50%',
            background: 'var(--brand)',
            animation: 'pulse 2s infinite',
            flexShrink: 0,
          }}
        />
        {isBn ? `${pendingStudents}টি ভর্তি আবেদন অপেক্ষমান · পরীক্ষা ২০ মে` : `${pendingStudents} admission pending · Exams May 20`}
        <span style={{ fontSize: '0.625rem', color: 'var(--brand-2)', marginLeft: '0.25rem' }}>
          {isBn ? `${approvedStudents} অনুমোদিত` : `${approvedStudents} approved`}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col4, gap }}>
        {[
          {
            labelBn: 'মোট ছাত্র',
            labelEn: 'Total Students',
            value: totalStudents,
            icon: <Users size={16} />,
            color: 'var(--brand)',
            cardClass: 'stat-card-blue',
            change: '+5%',
            up: true,
          },
          {
            labelBn: 'শিক্ষক',
            labelEn: 'Teachers',
            value: totalTeachers,
            icon: <GraduationCap size={16} />,
            color: 'var(--amber)',
            cardClass: 'stat-card-yellow',
            change: '+2%',
            up: true,
          },
          {
            labelBn: 'অনুমোদিত',
            labelEn: 'Approved',
            value: approvedStudents,
            icon: <CheckCircle2 size={16} />,
            color: 'var(--green)',
            cardClass: 'stat-card-green',
            change: '+8%',
            up: true,
          },
          {
            labelBn: 'বিচারাধীন',
            labelEn: 'Pending',
            value: pendingStudents,
            icon: <Clock size={16} />,
            color: 'var(--purple)',
            cardClass: 'stat-card-purple',
            change: rejectedStudents > 0 ? `-${rejectedStudents}` : '0',
            up: rejectedStudents === 0,
          },
        ].map((s) => (
          <div
            key={s.labelEn}
            className={`stat-card ${s.cardClass}`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '2.125rem',
                  height: '2.125rem',
                  borderRadius: '0.5rem',
                  background: `${s.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: s.color,
                }}
              >
                {s.icon}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.1875rem',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: s.up ? 'var(--green)' : 'var(--red)',
                  background: s.up ? 'var(--green-light)' : 'var(--red-light)',
                  padding: '2px 6px',
                  borderRadius: '0.25rem',
                }}
              >
                {s.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {s.change}
              </div>
            </div>
            <div
              style={{
                fontSize: isMobile ? '20px' : '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.3px',
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{isBn ? s.labelBn : s.labelEn}</div>
          </div>
        ))}
      </div>

      {/* Charts Row: Enrollment Trend + Class Distribution + Status Pie */}
      <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col3, gap }}>
        {/* Enrollment Trend */}
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--brand)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'সাপ্তাহিক ভর্তি' : 'Weekly Enrollment'}
              </span>
            </div>
          </div>
          <div style={{ width: '100%', height: isMobile ? 160 : 200 }}>
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--brand)' }}
                  name={isBn ? 'ছাত্র' : 'Students'}
                />
                <Line
                  type="monotone"
                  dataKey="teachers"
                  stroke="var(--teal)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--teal)' }}
                  name={isBn ? 'শিক্ষক' : 'Teachers'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Distribution */}
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--amber)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'শ্রেণি অনুযায়ী' : 'By Class'}
              </span>
            </div>
          </div>
          <div style={{ width: '100%', height: isMobile ? 160 : 200 }}>
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <BarChart data={classDist.length > 0 ? classDist : [{ name: 'No data', value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--brand)">
                  {(classDist.length > 0 ? classDist : [{ name: 'No data', value: 0 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--green)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'অবস্থা' : 'Status'}</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexDirection: isMobile ? 'column' : 'row',
            }}
          >
            <div style={{ width: isMobile ? 120 : 130, height: isMobile ? 120 : 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={3}>
                    {statusData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {statusData.map((s) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem' }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gender + Teacher Status + Today Absent */}
      <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col3, gap }}>
        {/* Gender Distribution */}
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {sectionHead('var(--purple)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'লিঙ্গ অনুপাত' : 'Gender Ratio'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <CircularChart
              value={totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0}
              size={72}
              stroke={7}
              color="var(--brand)"
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{isBn ? 'ছাত্র' : 'Male'}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{maleStudents}</span>
              </div>
              <div style={{ height: '0.25rem', background: 'var(--border)', borderRadius: '0.125rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalStudents > 0 ? (maleStudents / totalStudents) * 100 : 0}%`,
                    background: 'var(--brand)',
                    borderRadius: '0.125rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{isBn ? 'ছাত্রী' : 'Female'}</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{femaleStudents}</span>
              </div>
              <div style={{ height: '0.25rem', background: 'var(--border)', borderRadius: '0.125rem' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalStudents > 0 ? (femaleStudents / totalStudents) * 100 : 0}%`,
                    background: 'var(--teal)',
                    borderRadius: '0.125rem',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Status */}
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {sectionHead('var(--amber)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'শিক্ষকের অবস্থা' : 'Teacher Status'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              {
                label: isBn ? 'সক্রিয়' : 'Active',
                value: activeT,
                pct: totalTeachers > 0 ? Math.round((activeT / totalTeachers) * 100) : 0,
                color: 'var(--green)',
              },
              {
                label: isBn ? 'ছুটিতে' : 'On Leave',
                value: onLeaveT,
                pct: totalTeachers > 0 ? Math.round((onLeaveT / totalTeachers) * 100) : 0,
                color: 'var(--amber)',
              },
              {
                label: isBn ? 'নিষ্ক্রিয়' : 'Inactive',
                value: inactiveT,
                pct: totalTeachers > 0 ? Math.round((inactiveT / totalTeachers) * 100) : 0,
                color: 'var(--red)',
              },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.value} ({item.pct}%)
                  </span>
                </div>
                <div style={{ height: '0.25rem', background: 'var(--border)', borderRadius: '0.125rem' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: '0.125rem' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {sectionHead('var(--teal)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'দ্রুত পরিসংখ্যান' : 'Quick Stats'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            {[
              { label: isBn ? 'মোট ছাত্র' : 'Total Students', value: totalStudents, icon: <Users size={14} />, color: 'var(--brand)' },
              { label: isBn ? 'শিক্ষক' : 'Teachers', value: totalTeachers, icon: <GraduationCap size={14} />, color: 'var(--amber)' },
              { label: isBn ? 'অনুমোদিত' : 'Approved', value: approvedStudents, icon: <CheckCircle2 size={14} />, color: 'var(--green)' },
              { label: isBn ? 'বিচারাধীন' : 'Pending', value: pendingStudents, icon: <Clock size={14} />, color: 'var(--purple)' },
              { label: isBn ? 'ছাত্র (ছেলে)' : 'Male', value: maleStudents, icon: <UserCheck size={14} />, color: 'var(--brand-2)' },
              { label: isBn ? 'ছাত্রী (মেয়ে)' : 'Female', value: femaleStudents, icon: <UserX size={14} />, color: 'var(--teal)' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '8px 10px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: '1.625rem',
                    height: '1.625rem',
                    borderRadius: '0.375rem',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.value}</div>
                  <div
                    style={{
                      fontSize: '0.5625rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity + Events */}
      <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col2, gap }}>
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--brand)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'সাম্প্রতিক ভর্তি' : 'Recent Admissions'}
              </span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--brand)', cursor: 'pointer', fontWeight: 500 }}>{isBn ? 'সব →' : 'All →'}</span>
          </div>
          {recentStudents.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                gap: '0.625rem',
                padding: '8px 0',
                borderBottom: i < recentStudents.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.4375rem',
                  background: `${s.status === 'approved' ? 'var(--green)' : s.status === 'pending' ? 'var(--amber)' : 'var(--red)'}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {s.status === 'approved' ? (
                  <CheckCircle2 size={13} color="var(--green)" />
                ) : s.status === 'pending' ? (
                  <Clock size={13} color="var(--amber)" />
                ) : (
                  <UserX size={13} color="var(--red)" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.nameEn} — {isBn ? `শ্রেণি ${s.class} ${s.section}` : `Class ${s.class} ${s.section}`}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {s.status === 'approved'
                    ? isBn
                      ? 'ভর্তি নিশ্চিত'
                      : 'Enrolled'
                    : s.status === 'pending'
                      ? isBn
                        ? 'অপেক্ষমান'
                        : 'Pending'
                      : isBn
                        ? 'বাতিল'
                        : 'Rejected'}
                  {' · '}
                  {s.createdAt}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--teal)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'আসন্ন ইভেন্ট' : 'Upcoming Events'}
              </span>
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--brand)', cursor: 'pointer', fontWeight: 500 }}>
              {isBn ? 'ক্যালেন্ডার →' : 'Calendar →'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              {
                bn: 'বার্ষিক পরীক্ষা শুরু',
                en: 'Annual Exam begins',
                dbn: '২০ মে',
                den: 'May 20',
                color: 'var(--red)',
                icon: <ClipboardList size={12} />,
              },
              {
                bn: 'অভিভাবক-শিক্ষক সভা',
                en: 'Parent-Teacher Meeting',
                dbn: '২৪ মে',
                den: 'May 24',
                color: 'var(--amber)',
                icon: <Users size={12} />,
              },
              {
                bn: 'বিজ্ঞান মেলা ২০২৬',
                en: 'Science Fair 2026',
                dbn: '২ জুন',
                den: 'Jun 2',
                color: 'var(--teal)',
                icon: <FlaskConical size={12} />,
              },
              { bn: 'টার্ম ২ ফলাফল', en: 'Term 2 Result', dbn: '১৫ জুন', den: 'Jun 15', color: 'var(--brand)', icon: <Award size={12} /> },
            ].map((ev, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              >
                <div
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '0.4375rem',
                    background: `${ev.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: ev.color,
                    flexShrink: 0,
                  }}
                >
                  {ev.icon}
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isBn ? ev.bn : ev.en}
                </div>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: ev.color,
                    background: `${ev.color}15`,
                    padding: '3px 8px',
                    borderRadius: '0.375rem',
                    flexShrink: 0,
                  }}
                >
                  {isBn ? ev.dbn : ev.den}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Students + Quick Overview */}
      <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col2, gap }}>
        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--amber)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'শীর্ষ ছাত্র' : 'Top Students'}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 500,
                color: 'var(--amber)',
                background: 'var(--amber-light)',
                padding: '3px 8px',
                borderRadius: '0.375rem',
              }}
            >
              {isBn ? 'এই টার্ম' : 'This Term'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {topStudentsList.map((s, i) => (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '8px 10px',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              >
                <span
                  style={{
                    width: '1.125rem',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: i === 0 ? 'var(--amber)' : 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <div
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    background: s.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.5625rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {s.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{s.cls}</div>
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--green)',
                    background: 'var(--green-light)',
                    padding: '3px 8px',
                    borderRadius: '0.375rem',
                  }}
                >
                  {s.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card--premium" style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
            {sectionHead('var(--green)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'একাডেমিক ওভারভিউ' : 'Academic Overview'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              {
                bn: 'উপস্থিতির হার',
                en: 'Attendance Rate',
                val: `${totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 90) : 0}%`,
                bar: totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 90) : 0,
                color: 'var(--green)',
              },
              {
                bn: 'ভর্তির হার',
                en: 'Admission Rate',
                val: `${totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 100) : 0}%`,
                bar: totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 100) : 0,
                color: 'var(--brand)',
              },
              {
                bn: 'শিক্ষক-ছাত্র অনুপাত',
                en: 'Teacher-Student Ratio',
                val: totalTeachers > 0 ? `${(totalStudents / totalTeachers).toFixed(1)}:1` : '0',
                bar: totalTeachers > 0 ? Math.min(Math.round((totalStudents / totalTeachers) * 10), 100) : 0,
                color: 'var(--teal)',
              },
              {
                bn: 'সক্রিয় শিক্ষক',
                en: 'Active Teachers',
                val: `${activeTeachers}/${totalTeachers}`,
                bar: totalTeachers > 0 ? Math.round((activeT / totalTeachers) * 100) : 0,
                color: 'var(--amber)',
              },
            ].map((item) => (
              <div key={item.en}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3125rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{isBn ? item.bn : item.en}</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.val}</span>
                </div>
                <div style={{ height: '0.3125rem', background: 'var(--border)', borderRadius: '0.1875rem', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${item.bar}%`,
                      background: item.color,
                      borderRadius: '0.1875rem',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  )
}
