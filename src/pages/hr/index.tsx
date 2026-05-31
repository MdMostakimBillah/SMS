import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, TrendingUp, Award, DollarSign, Clock,
  CheckCircle2, XCircle, Plus, Save, X,
  Target, BarChart3, ArrowUpRight, Gift, HandCoins,
  Building2, UserCheck, Medal, FileText, BookOpen, Percent,
  Search, Zap, ThumbsUp, AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useHRStore } from '@/store/hrStore'
import CircularChart from '@/components/ui/CircularChart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

type Tab = 'overview' | 'decisions' | 'increment' | 'bonus' | 'promotion' | 'fund'

export default function HRPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const { teachers, departments, attendance } = useTeacherStore()
  const { increments, bonuses, promotions, funds, homeworkRecords, dailyReports, recommendations, addIncrement, addBonus, addPromotion, addFund, addRecommendation, updateRecommendation } = useHRStore()
  const isBn = language === 'bn'

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showAddIncrement, setShowAddIncrement] = useState(false)
  const [showAddBonus, setShowAddBonus] = useState(false)
  const [showAddPromotion, setShowAddPromotion] = useState(false)
  const [showAddFund, setShowAddFund] = useState(false)
  const [incForm, setIncForm] = useState({ teacherId: '', type: 'annual' as const, percentage: '', reason: '' })
  const [bonForm, setBonForm] = useState({ teacherId: '', type: 'festival' as const, amount: '', reason: '', month: '' })
  const [proForm, setProForm] = useState({ teacherId: '', fromDesignation: '', toDesignation: '', reason: '' })
  const [fundForm, setFundForm] = useState({ type: 'contribution' as const, amount: '', description: '' })
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<string>('all')
  const [showGenerateRecs, setShowGenerateRecs] = useState(false)

  const activeTeachers = useMemo(() => teachers.filter(t => t.status === 'active'), [teachers])
  const totalSalary = useMemo(() => activeTeachers.reduce((s, t) => s + t.salary, 0), [activeTeachers])

  const today = new Date().toISOString().split('T')[0]
  const attendanceToday = useMemo(() => {
    const day = attendance[today] || {}
    return {
      present: Object.values(day).filter((d: any) => d.status === 'present').length,
      absent: Object.values(day).filter((d: any) => d.status === 'absent').length,
      onLeave: Object.values(day).filter((d: any) => d.status === 'on-leave').length,
    }
  }, [attendance, today])

  const allDesignations = useMemo(() => {
    const set = new Set<string>()
    teachers.forEach(t => { if (t.designation) set.add(t.designation) })
    set.add('Head of Department')
    return Array.from(set).sort()
  }, [teachers])

  const getTeacherName = useCallback((id: string) => teachers.find(t => t.id === id)?.nameEn || id, [teachers])
  const getTeacherDept = useCallback((id: string) => {
    const t = teachers.find(t => t.id === id)
    if (!t) return ''
    const d = departments.find(d => d.id === t.departmentId)
    return d ? (isBn ? d.nameBn : d.name) : ''
  }, [teachers, departments, isBn])

  // ── Performance Rankings ──

  const weeklyAttendanceTrend = useMemo(() => {
    const trends: { day: string; present: number; absent: number; onLeave: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      if (d.getDay() === 0) continue
      const dateStr = d.toISOString().split('T')[0]
      const dayData = attendance[dateStr] || {}
      const active = activeTeachers
      let present = 0, absent = 0, leave = 0
      active.forEach(t => {
        const s = dayData[t.id]?.status
        if (s === 'present') present++
        else if (s === 'absent') absent++
        else if (s === 'on-leave') leave++
      })
      const label = d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      trends.push({ day: label, present, absent, onLeave: leave })
    }
    return trends
  }, [attendance, activeTeachers, isBn])

  const teacherAttendanceRate = useMemo(() => {
    const rates: Record<string, number> = {}
    const activeTeacherIds = activeTeachers.map(t => t.id)
    let totalDays = 0
    const now = new Date()
    for (let i = 1; i <= 28; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      if (d.getDay() === 0) continue
      totalDays++
    }
    activeTeacherIds.forEach(tid => {
      let presentCount = 0
      for (let i = 1; i <= 28; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        if (d.getDay() === 0) continue
        const dateStr = d.toISOString().split('T')[0]
        if (attendance[dateStr]?.[tid]?.status === 'present') presentCount++
      }
      rates[tid] = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0
    })
    return rates
  }, [attendance, activeTeachers])

  const teacherHomeworkRate = useMemo(() => {
    const rates: Record<string, number> = {}
    activeTeachers.forEach(t => {
      const records = homeworkRecords.filter(r => r.teacherId === t.id)
      const submitted = records.filter(r => r.submitted).length
      rates[t.id] = records.length > 0 ? Math.round((submitted / records.length) * 100) : 0
    })
    return rates
  }, [homeworkRecords, activeTeachers])

  const teacherReportRate = useMemo(() => {
    const rates: Record<string, { rate: number; avgScore: number }> = {}
    activeTeachers.forEach(t => {
      const reports = dailyReports.filter(r => r.teacherId === t.id)
      const submitted = reports.filter(r => r.submitted).length
      const rate = reports.length > 0 ? Math.round((submitted / reports.length) * 100) : 0
      const scored = reports.filter(r => r.submitted && r.avgScore > 0)
      const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.avgScore, 0) / scored.length) : 0
      rates[t.id] = { rate, avgScore }
    })
    return rates
  }, [dailyReports, activeTeachers])

  const attendanceRank = useMemo(() => {
    return activeTeachers
      .map(t => ({ ...t, rate: teacherAttendanceRate[t.id] || 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [activeTeachers, teacherAttendanceRate])

  const homeworkRank = useMemo(() => {
    return activeTeachers
      .map(t => ({ ...t, rate: teacherHomeworkRate[t.id] || 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [activeTeachers, teacherHomeworkRate])

  const reportRank = useMemo(() => {
    return activeTeachers
      .map(t => ({ ...t, rate: teacherReportRate[t.id]?.rate || 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [activeTeachers, teacherReportRate])

  const studentPerformanceRank = useMemo(() => {
    return activeTeachers
      .map(t => ({ ...t, avgScore: teacherReportRate[t.id]?.avgScore || 0 }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5)
  }, [activeTeachers, teacherReportRate])

  // Composite score for recommendation engine
  const teacherCompositeScores = useMemo(() => {
    return activeTeachers.map(t => {
      const attRate = teacherAttendanceRate[t.id] || 0
      const hwRate = teacherHomeworkRate[t.id] || 0
      const repRate = teacherReportRate[t.id]?.rate || 0
      const avgScore = teacherReportRate[t.id]?.avgScore || 0
      const totalScore = Math.round(attRate * 0.3 + hwRate * 0.3 + repRate * 0.2 + avgScore * 0.002 * 20)
      return {
        ...t,
        attRate,
        hwRate,
        repRate,
        avgScore,
        totalScore: Math.min(100, Math.max(0, totalScore)),
      }
    }).sort((a, b) => b.totalScore - a.totalScore)
  }, [activeTeachers, teacherAttendanceRate, teacherHomeworkRate, teacherReportRate])

  // ── Charts Data ──

  const deptChartData = useMemo(() => {
    return departments.map(d => {
      const dt = activeTeachers.filter(t => t.departmentId === d.id)
      return { name: isBn ? d.nameBn : d.name, teachers: dt.length, avgSalary: dt.length ? Math.round(dt.reduce((s, t) => s + t.salary, 0) / dt.length) : 0 }
    })
  }, [departments, activeTeachers, isBn])

  const performanceChartData = useMemo(() => {
    return teacherCompositeScores.slice(0, 10).map(t => ({
      name: t.nameEn.split(' ').pop() || t.nameEn,
      score: t.totalScore,
      attendance: t.attRate,
      homework: t.hwRate,
    }))
  }, [teacherCompositeScores])

  const statusChartData = useMemo(() => {
    const active = teachers.filter(t => t.status === 'active').length
    const inactive = teachers.filter(t => t.status === 'inactive').length
    const onLeave = teachers.filter(t => t.status === 'on-leave').length
    return [
      { name: isBn ? 'সক্রিয়' : 'Active', value: active, color: '#22c55e' },
      { name: isBn ? 'নিষ্ক্রিয়' : 'Inactive', value: inactive, color: '#ef4444' },
      { name: isBn ? 'ছুটিতে' : 'On Leave', value: onLeave, color: '#f59e0b' },
    ]
  }, [teachers, isBn])

  const totalIncrements = increments.reduce((s, i) => s + i.amount, 0)
  const totalBonuses = bonuses.reduce((s, b) => s + b.amount, 0)
  const fundBalance = funds.reduce((s, f) => s + (f.type === 'contribution' || f.type === 'bonus_pool' || f.type === 'increment_pool' ? f.amount : -f.amount), 0)

  const card: React.CSSProperties = { background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: isMobile ? '12px' : '14px' }
  const input: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }
  const label: React.CSSProperties = { fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }

  const tabs: { id: Tab; icon: any; label: string; labelBn: string; color: string }[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview', labelBn: 'সারসংক্ষেপ', color: 'var(--brand)' },
    { id: 'decisions', icon: Zap, label: 'Decisions', labelBn: 'সিদ্ধান্ত', color: 'var(--teal)' },
    { id: 'increment', icon: TrendingUp, label: 'Increment', labelBn: 'বেতন বৃদ্ধি', color: 'var(--green)' },
    { id: 'bonus', icon: Gift, label: 'Bonus', labelBn: 'বোনাস', color: 'var(--amber)' },
    { id: 'promotion', icon: Award, label: 'Promotion', labelBn: 'পদোন্নতি', color: 'var(--purple)' },
    { id: 'fund', icon: HandCoins, label: 'Fund', labelBn: 'তহবিল', color: 'var(--red)' },
  ]

  const handleAddIncrement = () => {
    if (!incForm.teacherId || !incForm.percentage) return
    const t = teachers.find(t => t.id === incForm.teacherId)
    if (!t) return
    const amount = Math.round(t.salary * Number(incForm.percentage) / 100)
    addIncrement({ id: `INC-${Date.now()}`, teacherId: incForm.teacherId, type: incForm.type, amount, percentage: Number(incForm.percentage), reason: incForm.reason, date: today, approvedBy: 'HR Admin' })
    setIncForm({ teacherId: '', type: 'annual', percentage: '', reason: '' })
    setShowAddIncrement(false)
  }

  const handleAddBonus = () => {
    if (!bonForm.teacherId || !bonForm.amount) return
    addBonus({ id: `BON-${Date.now()}`, teacherId: bonForm.teacherId, type: bonForm.type, amount: Number(bonForm.amount), month: bonForm.month || today.slice(0, 7), reason: bonForm.reason, date: today })
    setBonForm({ teacherId: '', type: 'festival', amount: '', reason: '', month: '' })
    setShowAddBonus(false)
  }

  const handleAddPromotion = () => {
    if (!proForm.teacherId || !proForm.toDesignation) return
    addPromotion({ id: `PRO-${Date.now()}`, teacherId: proForm.teacherId, fromDesignation: proForm.fromDesignation, toDesignation: proForm.toDesignation, date: today, reason: proForm.reason })
    setProForm({ teacherId: '', fromDesignation: '', toDesignation: '', reason: '' })
    setShowAddPromotion(false)
  }

  const handleAddFund = () => {
    if (!fundForm.amount) return
    addFund({ id: `FND-${Date.now()}`, type: fundForm.type, amount: Number(fundForm.amount), description: fundForm.description, date: today })
    setFundForm({ type: 'contribution', amount: '', description: '' })
    setShowAddFund(false)
  }

  const handleGenerateRecommendations = () => {
    teacherCompositeScores.slice(0, 5).forEach((t, i) => {
      let type: 'promotion' | 'bonus' | 'increment'
      if (i === 0) type = 'promotion'
      else if (i === 1) type = 'bonus'
      else type = 'increment'
      const reasons = {
        promotion: 'Exceptional overall performance and student outcomes',
        bonus: 'Outstanding attendance and homework submission record',
        increment: 'Consistent high performance across all metrics',
      }
      if (!recommendations.find(r => r.teacherId === t.id && r.status === 'pending')) {
        addRecommendation({
          id: `REC-${Date.now()}-${i}`,
          teacherId: t.id,
          type,
          score: t.totalScore,
          reason: reasons[type],
          status: 'pending',
          createdAt: today,
        })
      }
    })
    setShowGenerateRecs(true)
    setTimeout(() => setShowGenerateRecs(false), 2500)
  }

  const handleApproveRecommendation = (rec: typeof recommendations[0]) => {
    updateRecommendation(rec.id, 'approved')
    if (rec.type === 'bonus') {
      addBonus({ id: `BON-${Date.now()}`, teacherId: rec.teacherId, type: 'performance', amount: 5000, month: today.slice(0, 7), reason: rec.reason, date: today })
    } else if (rec.type === 'promotion') {
      const t = teachers.find(tx => tx.id === rec.teacherId)
      if (t) {
        addPromotion({ id: `PRO-${Date.now()}`, teacherId: rec.teacherId, fromDesignation: t.designation, toDesignation: 'Senior ' + t.designation, date: today, reason: rec.reason })
      }
    } else if (rec.type === 'increment') {
      const t = teachers.find(tx => tx.id === rec.teacherId)
      if (t) {
        const amount = Math.round(t.salary * 0.05)
        addIncrement({ id: `INC-${Date.now()}`, teacherId: rec.teacherId, type: 'performance', amount, percentage: 5, reason: rec.reason, date: today, approvedBy: 'HR Admin' })
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string; labelBn: string }> = {
      active: { bg: 'var(--green-light)', color: 'var(--green)', label: 'Active', labelBn: 'সক্রিয়' },
      inactive: { bg: 'var(--red-light)', color: 'var(--red)', label: 'Inactive', labelBn: 'নিষ্ক্রিয়' },
      'on-leave': { bg: 'var(--amber-light)', color: 'var(--amber)', label: 'On Leave', labelBn: 'ছুটিতে' },
    }
    const s = map[status] || map.active
    return <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', background: s.bg, color: s.color, fontWeight: 500, whiteSpace: 'nowrap' }}>{isBn ? s.labelBn : s.label}</span>
  }

  const employeeList = useMemo(() => {
    return teachers
      .filter(t => {
        const match = employeeSearch.toLowerCase()
        const nameMatch = t.nameEn.toLowerCase().includes(match) || t.nameBn.includes(match) || t.designation.toLowerCase().includes(match) || t.phone.includes(match)
        const statusMatch = employeeStatusFilter === 'all' || t.status === employeeStatusFilter
        return nameMatch && statusMatch
      })
      .map(t => ({
        ...t,
        attRate: teacherAttendanceRate[t.id] || 0,
        hwRate: teacherHomeworkRate[t.id] || 0,
        reportRate: teacherReportRate[t.id]?.rate || 0,
        compScore: teacherCompositeScores.find(s => s.id === t.id)?.totalScore || 0,
      }))
  }, [teachers, employeeSearch, employeeStatusFilter, teacherAttendanceRate, teacherHomeworkRate, teacherReportRate, teacherCompositeScores])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit', flexShrink: 0 }}>
          <ArrowLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'HR ও কর্মচারী ব্যবস্থাপনা' : 'HR & Staff Management'}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {isBn ? `${activeTeachers.length} জন সক্রিয় কর্মচারী` : `${activeTeachers.length} active staff`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: `1px solid ${activeTab === tab.id ? tab.color : 'var(--border)'}`, background: activeTab === tab.id ? `${tab.color}15` : 'var(--bg-secondary)', color: activeTab === tab.id ? tab.color : 'var(--text-secondary)', fontSize: '12px', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            <tab.icon size={14} />{isBn ? tab.labelBn : tab.label}
          </button>
        ))}
      </div>

      {/* ──────────────── OVERVIEW TAB ──────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
            {[
              { label: isBn ? 'সক্রিয়' : 'Active', value: activeTeachers.length, icon: Users, color: 'var(--brand)', bg: 'var(--brand-light)' },
              { label: isBn ? 'উপস্থিত' : 'Present Today', value: attendanceToday.present, icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green-light)' },
              { label: isBn ? 'অনুপস্থিত' : 'Absent Today', value: attendanceToday.absent, icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)' },
              { label: isBn ? 'ছুটিতে' : 'On Leave', value: attendanceToday.onLeave, icon: Clock, color: 'var(--amber)', bg: 'var(--amber-light)' },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <s.icon size={15} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Rankings */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
            {/* Top Teacher by Student Performance */}
            <div style={{ ...card, borderLeft: '3px solid var(--brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Medal size={14} style={{ color: 'var(--brand)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{isBn ? 'শ্রেষ্ঠ শিক্ষক (শিক্ষার্থী ফলাফল)' : 'Top by Student Performance'}</span>
              </div>
              {studentPerformanceRank.slice(0, 3).map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--text-muted)', width: '16px' }}>#{i + 1}</span>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '8px', color: 'var(--text-muted)' }}>
                    {t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameEn}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{getTeacherDept(t.id)}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)' }}>{studentPerformanceRank.find(x => x.id === t.id)?.avgScore || 0}</div>
                </div>
              ))}
            </div>

            {/* Daily Report Submission Rank */}
            <div style={{ ...card, borderLeft: '3px solid var(--teal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <FileText size={14} style={{ color: 'var(--teal)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{isBn ? 'দৈনিক রিপোর্ট জমা' : 'Daily Report Submission'}</span>
              </div>
              {reportRank.slice(0, 3).map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--text-muted)', width: '16px' }}>#{i + 1}</span>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '8px', color: 'var(--text-muted)' }}>
                    {t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameEn}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{getTeacherDept(t.id)}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal)' }}>{reportRank.find(x => x.id === t.id)?.rate || 0}%</div>
                </div>
              ))}
            </div>

            {/* Homework Submission Rank */}
            <div style={{ ...card, borderLeft: '3px solid var(--green)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <BookOpen size={14} style={{ color: 'var(--green)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{isBn ? 'হোমওয়ার্ক জমা' : 'Homework Submission'}</span>
              </div>
              {homeworkRank.slice(0, 3).map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--text-muted)', width: '16px' }}>#{i + 1}</span>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '8px', color: 'var(--text-muted)' }}>
                    {t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameEn}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{getTeacherDept(t.id)}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>{homeworkRank.find(x => x.id === t.id)?.rate || 0}%</div>
                </div>
              ))}
            </div>

            {/* Attendance Rank */}
            <div style={{ ...card, borderLeft: '3px solid var(--purple)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <UserCheck size={14} style={{ color: 'var(--purple)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{isBn ? 'উপস্থিতি' : 'Attendance Rate'}</span>
              </div>
              {attendanceRank.slice(0, 3).map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--text-muted)', width: '16px' }}>#{i + 1}</span>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '8px', color: 'var(--text-muted)' }}>
                    {t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameEn}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{getTeacherDept(t.id)}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--purple)' }}>{attendanceRank.find(x => x.id === t.id)?.rate || 0}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            {/* Department Stats Chart */}
            <div style={{ ...card, overflow: 'hidden', padding: isMobile ? '10px' : '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={11} />{isBn ? 'বিভাগ' : 'Departments'}
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={deptChartData} margin={{ top: 2, right: 2, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barTeachers" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} /></linearGradient>
                    <linearGradient id="barSalary" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14b8a6" stopOpacity={0.9} /><stop offset="100%" stopColor="#14b8a6" stopOpacity={0.2} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} cursor={{ fill: 'var(--bg-secondary)' }} />
                  <Bar yAxisId="left" dataKey="teachers" name={isBn ? 'শিক্ষক' : 'Teachers'} fill="url(#barTeachers)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="right" dataKey="avgSalary" name={isBn ? 'বেতন' : 'Salary'} fill="url(#barSalary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Comparison Chart */}
            <div style={{ ...card, overflow: 'hidden', padding: isMobile ? '10px' : '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Target size={11} />{isBn ? 'কর্মদক্ষতা' : 'Performance'}
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={performanceChartData} margin={{ top: 2, right: 2, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barScore" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.15} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} width={20} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} cursor={{ fill: 'var(--bg-secondary)' }} />
                  <Bar dataKey="score" name={isBn ? 'স্কোর' : 'Score'} fill="url(#barScore)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Trend Chart */}
            <div style={{ ...card, overflow: 'hidden', padding: isMobile ? '10px' : '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={11} />{isBn ? 'উপস্থিতি' : 'Attendance'}
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={weeklyAttendanceTrend} margin={{ top: 2, right: 2, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="linePresent" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                    <linearGradient id="lineAbsent" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
                  <Line type="monotone" dataKey="present" name={isBn ? 'উপস্থিত' : 'Present'} stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} fill="url(#linePresent)" />
                  <Line type="monotone" dataKey="absent" name={isBn ? 'অনুপস্থিত' : 'Absent'} stroke="#ef4444" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} fill="url(#lineAbsent)" />
                  <Line type="monotone" dataKey="onLeave" name={isBn ? 'ছুটিতে' : 'On Leave'} stroke="#f59e0b" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution Pie Chart */}
            <div style={{ ...card, overflow: 'hidden', padding: isMobile ? '10px' : '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={11} />{isBn ? 'স্ট্যাটাস' : 'Status'}
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-primary)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '2px' }}>
                {statusChartData.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color }} />
                    <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)' }}>{s.name}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div style={{ marginBottom: '14px' }}>
            <div style={card}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={13} />{isBn ? 'আর্থিক সারসংক্ষেপ' : 'Financial Summary'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: isBn ? 'মোট বেতন' : 'Total Salary', val: `৳${totalSalary.toLocaleString()}`, color: 'var(--text-primary)' },
                  { label: isBn ? 'মোট বৃদ্ধি' : 'Total Increments', val: `৳${totalIncrements.toLocaleString()}`, color: 'var(--green)' },
                  { label: isBn ? 'মোট বোনাস' : 'Total Bonuses', val: `৳${totalBonuses.toLocaleString()}`, color: 'var(--amber)' },
                  { label: isBn ? 'তহবিল ব্যালেন্স' : 'Fund Balance', val: `৳${fundBalance.toLocaleString()}`, color: 'var(--brand)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: item.color }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* All Employees Overview */}
          <div style={card}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={13} />{isBn ? 'সকল কর্মচারী' : 'All Employees & Teachers'}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
                    style={{ ...input, paddingLeft: '24px', width: isMobile ? '120px' : '180px', fontSize: '11px' }} />
                </div>
                <select value={employeeStatusFilter} onChange={e => setEmployeeStatusFilter(e.target.value)}
                  style={{ ...input, width: isMobile ? '90px' : '120px', fontSize: '11px' }}>
                  <option value="all">{isBn ? 'সব' : 'All'}</option>
                  <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
                  <option value="inactive">{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
                  <option value="on-leave">{isBn ? 'ছুটিতে' : 'On Leave'}</option>
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    {[
                      isBn ? 'কর্মচারী' : 'Employee',
                      isBn ? 'বিভাগ' : 'Department',
                      isBn ? 'পদবি' : 'Designation',
                      isBn ? 'উপস্থিতি' : 'Attendance',
                      isBn ? 'হোমওয়ার্ক' : 'Homework',
                      isBn ? 'রিপোর্ট' : 'Report',
                      isBn ? 'স্কোর' : 'Score',
                      isBn ? 'স্ট্যাটাস' : 'Status',
                    ].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employeeList.map(t => (
                    <tr key={t.id} style={{ borderBottom: '0.5px solid var(--border)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', color: 'var(--text-muted)' }}>
                            {t.photo ? <img src={t.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} /> : t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{t.nameEn}</div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-secondary)' }}>{getTeacherDept(t.id)}</td>
                      <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t.designation}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '40px', height: '5px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.attRate}%`, background: t.attRate >= 80 ? 'var(--green)' : t.attRate >= 60 ? 'var(--amber)' : 'var(--red)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: t.attRate >= 80 ? 'var(--green)' : t.attRate >= 60 ? 'var(--amber)' : 'var(--red)' }}>{t.attRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: t.hwRate >= 80 ? 'var(--green)' : t.hwRate >= 50 ? 'var(--amber)' : 'var(--red)' }}>{t.hwRate}%</span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: t.reportRate >= 80 ? 'var(--green)' : t.reportRate >= 50 ? 'var(--amber)' : 'var(--red)' }}>{t.reportRate}%</span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>{t.compScore}</span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{getStatusBadge(t.status)}</td>
                    </tr>
                  ))}
                  {employeeList.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>{isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No employees found'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
              {isBn ? `মোট ${employeeList.length} জন কর্মচারী` : `${employeeList.length} employees total`}
            </div>
          </div>
        </>
      )}

      {/* ──────────────── DECISIONS TAB ──────────────── */}
      {activeTab === 'decisions' && (
        <>
          {/* Auto-generate recommendations */}
          <div style={{ ...card, marginBottom: '14px', borderLeft: '3px solid var(--brand)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} style={{ color: 'var(--brand)' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'বুদ্ধিমান সুপারিশ' : 'Intelligent Recommendations'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isBn ? 'উপস্থিতি, হোমওয়ার্ক, রিপোর্ট ও ফলাফলের ভিত্তিতে স্বয়ংক্রিয় সুপারিশ' : 'Auto-suggestions based on attendance, homework, reports & student performance'}</div>
                </div>
              </div>
              <button onClick={handleGenerateRecommendations}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Zap size={14} />{isBn ? 'সুপারিশ তৈরি করুন' : 'Generate Suggestions'}
              </button>
            </div>
            {showGenerateRecs && (
              <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', background: 'var(--green-light)', color: 'var(--green)', fontSize: '11px', fontWeight: 500 }}>
                {isBn ? 'সুপারিশ তৈরি করা হয়েছে!' : 'Recommendations generated successfully!'}
              </div>
            )}
          </div>

          {/* Top Performers Composite Scores */}
          <div style={{ ...card, marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Percent size={13} />{isBn ? 'সামগ্রিক স্কোর র‍্যাঙ্কিং' : 'Overall Performance Scores'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {teacherCompositeScores.slice(0, 10).map((t, i) => (
                <div key={t.id} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: i < 3 ? 'var(--amber)' : 'var(--text-muted)', width: '24px' }}>#{i + 1}</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '9px', color: 'var(--text-muted)' }}>
                      {t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.nameEn}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{getTeacherDept(t.id)} - {t.designation}</div>
                    </div>
                    <CircularChart value={t.totalScore} size={44} stroke={5} color={t.totalScore >= 80 ? 'var(--green)' : t.totalScore >= 60 ? 'var(--amber)' : 'var(--red)'} />
                  </div>
                  {/* Score breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isBn ? 'উপস্থিতি' : 'Attendance'}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--purple)' }}>{t.attRate}%</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isBn ? 'হোমওয়ার্ক' : 'Homework'}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>{t.hwRate}%</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isBn ? 'রিপোর্ট' : 'Reports'}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--teal)' }}>{t.repRate}%</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isBn ? 'ফলাফল' : 'Scores'}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)' }}>{t.avgScore}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Recommendations */}
          <div style={card}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ThumbsUp size={13} />{isBn ? 'সুপারিশ (বিবেচনাধীন)' : 'Pending Recommendations'}
            </div>
            {recommendations.filter(r => r.status === 'pending').length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                {isBn ? 'কোনো সুপারিশ নেই। "সুপারিশ তৈরি করুন" বাটনে ক্লিক করুন।' : 'No pending recommendations. Click "Generate Suggestions" to create recommendations.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendations.filter(r => r.status === 'pending').map(rec => {
                  const teacher = teachers.find(t => t.id === rec.teacherId)
                  const typeColors: Record<string, string> = { promotion: 'var(--purple)', bonus: 'var(--amber)', increment: 'var(--green)' }
                  const typeBg: Record<string, string> = { promotion: 'var(--purple-light)', bonus: 'var(--amber-light)', increment: 'var(--green-light)' }
                  const typeLabels: Record<string, string> = { promotion: isBn ? 'পদোন্নতি' : 'Promotion', bonus: isBn ? 'বোনাস' : 'Bonus', increment: isBn ? 'বৃদ্ধি' : 'Increment' }
                  return (
                    <div key={rec.id} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: typeBg[rec.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {rec.type === 'promotion' ? <Award size={15} style={{ color: typeColors[rec.type] }} /> : rec.type === 'bonus' ? <Gift size={15} style={{ color: typeColors[rec.type] }} /> : <TrendingUp size={15} style={{ color: typeColors[rec.type] }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{teacher?.nameEn || rec.teacherId}</span>
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', background: typeBg[rec.type], color: typeColors[rec.type], fontWeight: 500 }}>{typeLabels[rec.type]}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Score: <strong style={{ color: 'var(--brand)' }}>{rec.score}</strong></span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{rec.reason}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleApproveRecommendation(rec)}
                            style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--green)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />{isBn ? 'অনুমোদন' : 'Approve'}
                          </button>
                          <button onClick={() => updateRecommendation(rec.id, 'rejected')}
                            style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} />{isBn ? 'বাতিল' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Approved/Rejected Recommendations */}
          {recommendations.filter(r => r.status !== 'pending').length > 0 && (
            <div style={{ ...card, marginTop: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={13} />{isBn ? 'ইতিহাস' : 'Decision History'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recommendations.filter(r => r.status !== 'pending').map(rec => {
                  const teacher = teachers.find(t => t.id === rec.teacherId)
                  const typeColors: Record<string, string> = { promotion: 'var(--purple)', bonus: 'var(--amber)', increment: 'var(--green)' }
                  const typeBg: Record<string, string> = { promotion: 'var(--purple-light)', bonus: 'var(--amber-light)', increment: 'var(--green-light)' }
                  const typeLabels: Record<string, string> = { promotion: isBn ? 'পদোন্নতি' : 'Promotion', bonus: isBn ? 'বোনাস' : 'Bonus', increment: isBn ? 'বৃদ্ধি' : 'Increment' }
                  return (
                    <div key={rec.id} style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: typeBg[rec.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {rec.type === 'promotion' ? <Award size={13} style={{ color: typeColors[rec.type] }} /> : rec.type === 'bonus' ? <Gift size={13} style={{ color: typeColors[rec.type] }} /> : <TrendingUp size={13} style={{ color: typeColors[rec.type] }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{teacher?.nameEn || rec.teacherId}</span>
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: typeBg[rec.type], color: typeColors[rec.type], fontWeight: 500, marginLeft: '6px' }}>{typeLabels[rec.type]}</span>
                      </div>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '5px', background: rec.status === 'approved' ? 'var(--green-light)' : 'var(--red-light)', color: rec.status === 'approved' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                        {rec.status === 'approved' ? (isBn ? 'অনুমোদিত' : 'Approved') : (isBn ? 'বাতিল' : 'Rejected')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Increment Tab */}
      {activeTab === 'increment' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={13} />{isBn ? 'বেতন বৃদ্ধি' : 'Salary Increments'}
            </div>
            <button onClick={() => setShowAddIncrement(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '7px', background: 'var(--green-light)', border: '1px solid var(--green)', color: 'var(--green)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={12} />{isBn ? 'বৃদ্ধি যোগ' : 'Add Increment'}
            </button>
          </div>
          {showAddIncrement && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', marginBottom: '12px', border: '1px solid var(--green)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div><label style={label}>{isBn ? 'শিক্ষক' : 'Teacher'}</label><select value={incForm.teacherId} onChange={e => setIncForm(p => ({ ...p, teacherId: e.target.value }))} style={input}><option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>{activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}</select></div>
                <div><label style={label}>{isBn ? 'ধরন' : 'Type'}</label><select value={incForm.type} onChange={e => setIncForm(p => ({ ...p, type: e.target.value as any }))} style={input}><option value="annual">{isBn ? 'বার্ষিক' : 'Annual'}</option><option value="performance">{isBn ? 'কর্মদক্ষতা' : 'Performance'}</option><option value="special">{isBn ? 'বিশেষ' : 'Special'}</option></select></div>
                <div><label style={label}>{isBn ? 'শতাংশ' : 'Percentage (%)'}</label><input type="number" value={incForm.percentage} onChange={e => setIncForm(p => ({ ...p, percentage: e.target.value }))} style={input} placeholder="5" /></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}><div style={{ flex: 1 }}><label style={label}>{isBn ? 'কারণ' : 'Reason'}</label><input value={incForm.reason} onChange={e => setIncForm(p => ({ ...p, reason: e.target.value }))} style={input} /></div>
                <button onClick={handleAddIncrement} style={{ padding: '8px 16px', borderRadius: '7px', background: 'var(--green)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}><Save size={12} /> {isBn ? 'যোগ' : 'Add'}</button>
                <button onClick={() => setShowAddIncrement(false)} style={{ padding: '8px 12px', borderRadius: '7px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}><X size={12} /></button>
              </div>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {[isBn ? 'তারিখ' : 'Date', isBn ? 'শিক্ষক' : 'Teacher', isBn ? 'ধরন' : 'Type', isBn ? 'শতাংশ' : '%', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'কারণ' : 'Reason'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}</tr></thead>
              <tbody>
                {increments.map(inc => (
                  <tr key={inc.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>{inc.date}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{getTeacherName(inc.teacherId)}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', background: inc.type === 'annual' ? 'var(--green-light)' : inc.type === 'performance' ? 'var(--brand-light)' : 'var(--amber-light)', color: inc.type === 'annual' ? 'var(--green)' : inc.type === 'performance' ? 'var(--brand)' : 'var(--amber)', fontWeight: 500 }}>{inc.type}</span></td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>{inc.percentage}%</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{inc.amount.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{inc.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bonus Tab */}
      {activeTab === 'bonus' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gift size={13} />{isBn ? 'বোনাস' : 'Bonuses'}
            </div>
            <button onClick={() => setShowAddBonus(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '7px', background: 'var(--amber-light)', border: '1px solid var(--amber)', color: 'var(--amber)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={12} />{isBn ? 'বোনাস যোগ' : 'Add Bonus'}
            </button>
          </div>
          {showAddBonus && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', marginBottom: '12px', border: '1px solid var(--amber)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div><label style={label}>{isBn ? 'শিক্ষক' : 'Teacher'}</label><select value={bonForm.teacherId} onChange={e => setBonForm(p => ({ ...p, teacherId: e.target.value }))} style={input}><option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>{activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}</select></div>
                <div><label style={label}>{isBn ? 'ধরন' : 'Type'}</label><select value={bonForm.type} onChange={e => setBonForm(p => ({ ...p, type: e.target.value as any }))} style={input}><option value="festival">{isBn ? 'উৎসব' : 'Festival'}</option><option value="performance">{isBn ? 'কর্মদক্ষতা' : 'Performance'}</option><option value="attendance">{isBn ? 'উপস্থিতি' : 'Attendance'}</option><option value="special">{isBn ? 'বিশেষ' : 'Special'}</option></select></div>
                <div><label style={label}>{isBn ? 'পরিমাণ' : 'Amount'}</label><input type="number" value={bonForm.amount} onChange={e => setBonForm(p => ({ ...p, amount: e.target.value }))} style={input} placeholder="৳0" /></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}><div style={{ flex: 1 }}><label style={label}>{isBn ? 'কারণ' : 'Reason'}</label><input value={bonForm.reason} onChange={e => setBonForm(p => ({ ...p, reason: e.target.value }))} style={input} /></div>
                <button onClick={handleAddBonus} style={{ padding: '8px 16px', borderRadius: '7px', background: 'var(--amber)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}><Save size={12} /> {isBn ? 'যোগ' : 'Add'}</button>
                <button onClick={() => setShowAddBonus(false)} style={{ padding: '8px 12px', borderRadius: '7px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}><X size={12} /></button>
              </div>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {[isBn ? 'মাস' : 'Month', isBn ? 'শিক্ষক' : 'Teacher', isBn ? 'ধরন' : 'Type', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'কারণ' : 'Reason'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}</tr></thead>
              <tbody>
                {bonuses.map(bon => (
                  <tr key={bon.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>{bon.month}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{getTeacherName(bon.teacherId)}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', background: bon.type === 'festival' ? 'var(--amber-light)' : bon.type === 'performance' ? 'var(--brand-light)' : bon.type === 'attendance' ? 'var(--green-light)' : 'var(--teal-light)', color: bon.type === 'festival' ? 'var(--amber)' : bon.type === 'performance' ? 'var(--brand)' : bon.type === 'attendance' ? 'var(--green)' : 'var(--teal)', fontWeight: 500 }}>{bon.type}</span></td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{bon.amount.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{bon.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promotion Tab */}
      {activeTab === 'promotion' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={13} />{isBn ? 'পদোন্নতি' : 'Promotions'}
            </div>
            <button onClick={() => setShowAddPromotion(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '7px', background: 'var(--purple-light)', border: '1px solid var(--purple)', color: 'var(--purple)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={12} />{isBn ? 'পদোন্নতি যোগ' : 'Add Promotion'}
            </button>
          </div>
          {showAddPromotion && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', marginBottom: '12px', border: '1px solid var(--purple)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div><label style={label}>{isBn ? 'শিক্ষক' : 'Teacher'}</label><select value={proForm.teacherId} onChange={e => { const t = activeTeachers.find(t => t.id === e.target.value); setProForm(p => ({ ...p, teacherId: e.target.value, fromDesignation: t?.designation || '' })) }} style={input}><option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>{activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn} ({t.designation})</option>)}</select></div>
                <div><label style={label}>{isBn ? 'বর্তমান পদবি' : 'From Designation'}</label><select value={proForm.fromDesignation} onChange={e => setProForm(p => ({ ...p, fromDesignation: e.target.value }))} style={input}><option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>{allDesignations.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label style={label}>{isBn ? 'নতুন পদবি' : 'To Designation'}</label><select value={proForm.toDesignation} onChange={e => setProForm(p => ({ ...p, toDesignation: e.target.value }))} style={input}><option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>{allDesignations.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}><div style={{ flex: 1 }}><label style={label}>{isBn ? 'কারণ' : 'Reason'}</label><input value={proForm.reason} onChange={e => setProForm(p => ({ ...p, reason: e.target.value }))} style={input} /></div>
                <button onClick={handleAddPromotion} style={{ padding: '8px 16px', borderRadius: '7px', background: 'var(--purple)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}><Save size={12} /> {isBn ? 'যোগ' : 'Add'}</button>
                <button onClick={() => setShowAddPromotion(false)} style={{ padding: '8px 12px', borderRadius: '7px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}><X size={12} /></button>
              </div>
            </div>
          )}
          {promotions.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>{isBn ? 'কোনো পদোন্নতি নেই' : 'No promotions yet'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {promotions.map(p => (
                <div key={p.id} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Award size={16} style={{ color: 'var(--purple)' }} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{getTeacherName(p.teacherId)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{p.fromDesignation}</span><ArrowUpRight size={12} style={{ color: 'var(--green)' }} /><span style={{ color: 'var(--green)', fontWeight: 600 }}>{p.toDesignation}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.date}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{p.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fund Tab */}
      {activeTab === 'fund' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HandCoins size={13} />{isBn ? 'তহবিল' : 'Fund Management'}
            </div>
            <button onClick={() => setShowAddFund(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '7px', background: 'var(--brand-light)', border: '1px solid var(--brand)', color: 'var(--brand)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={12} />{isBn ? 'লেনদেন' : 'Add Transaction'}
            </button>
          </div>
          {showAddFund && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', marginBottom: '12px', border: '1px solid var(--brand)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div><label style={label}>{isBn ? 'ধরন' : 'Type'}</label><select value={fundForm.type} onChange={e => setFundForm(p => ({ ...p, type: e.target.value as any }))} style={input}><option value="contribution">{isBn ? 'অনুদান' : 'Contribution'}</option><option value="bonus_pool">{isBn ? 'বোনাস পুল' : 'Bonus Pool'}</option><option value="increment_pool">{isBn ? 'বৃদ্ধি পুল' : 'Increment Pool'}</option><option value="withdrawal">{isBn ? 'উত্তোলন' : 'Withdrawal'}</option></select></div>
                <div><label style={label}>{isBn ? 'পরিমাণ' : 'Amount'}</label><input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} style={input} placeholder="৳0" /></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}><div style={{ flex: 1 }}><label style={label}>{isBn ? 'বিবরণ' : 'Description'}</label><input value={fundForm.description} onChange={e => setFundForm(p => ({ ...p, description: e.target.value }))} style={input} /></div>
                <button onClick={handleAddFund} style={{ padding: '8px 16px', borderRadius: '7px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}><Save size={12} /> {isBn ? 'যোগ' : 'Add'}</button>
                <button onClick={() => setShowAddFund(false)} style={{ padding: '8px 12px', borderRadius: '7px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}><X size={12} /></button>
              </div>
            </div>
          )}
          <div style={{ padding: '12px', borderRadius: '8px', background: fundBalance >= 0 ? 'var(--green-light)' : 'var(--red-light)', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: fundBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>{isBn ? 'তহবিল ব্যালেন্স' : 'Fund Balance'}</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: fundBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>৳{fundBalance.toLocaleString()}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {[isBn ? 'তারিখ' : 'Date', isBn ? 'ধরন' : 'Type', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'বিবরণ' : 'Description'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}</tr></thead>
              <tbody>
                {funds.map(f => (
                  <tr key={f.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)' }}>{f.date}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '5px', background: f.type === 'withdrawal' ? 'var(--red-light)' : 'var(--green-light)', color: f.type === 'withdrawal' ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>{f.type.replace('_', ' ')}</span></td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: f.type === 'withdrawal' ? 'var(--red)' : 'var(--green)' }}>{f.type === 'withdrawal' ? '-' : '+'}৳{f.amount.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
