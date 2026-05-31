import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, TrendingUp, Award, DollarSign, Clock, CheckCircle2, XCircle, Plus, Save, X, ChevronDown, ChevronUp, Target, Calendar, BarChart3, ArrowUpRight, Gift, HandCoins, Building2, UserCheck } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useHRStore } from '@/store/hrStore'

type Tab = 'overview' | 'performance' | 'increment' | 'bonus' | 'promotion' | 'fund'

export default function HRPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { teachers, departments, attendance } = useTeacherStore()
  const { increments, bonuses, promotions, funds, homeworkRecords, addIncrement, addBonus, addPromotion, addFund, addHomeworkRecord } = useHRStore()
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
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)
  const [hwDate, setHwDate] = useState(new Date().toISOString().split('T')[0])

  const activeTeachers = useMemo(() => teachers.filter(t => t.status === 'active'), [teachers])
  const totalSalary = useMemo(() => activeTeachers.reduce((s, t) => s + t.salary, 0), [activeTeachers])

  const today = new Date().toISOString().split('T')[0]
  const attendanceToday = useMemo(() => {
    const day = attendance[today] || {}
    return { present: Object.values(day).filter((d: any) => d.status === 'present').length, absent: Object.values(day).filter((d: any) => d.status === 'absent').length, onLeave: Object.values(day).filter((d: any) => d.status === 'on-leave').length }
  }, [attendance, today])

  const deptStats = useMemo(() => {
    return departments.map(d => {
      const deptTeachers = activeTeachers.filter(t => t.departmentId === d.id)
      return { ...d, teacherCount: deptTeachers.length, avgSalary: deptTeachers.length ? Math.round(deptTeachers.reduce((s, t) => s + t.salary, 0) / deptTeachers.length) : 0 }
    })
  }, [departments, activeTeachers])

  const getTeacherName = useCallback((id: string) => teachers.find(t => t.id === id)?.nameEn || id, [teachers])

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

  const totalIncrements = increments.reduce((s, i) => s + i.amount, 0)
  const totalBonuses = bonuses.reduce((s, b) => s + b.amount, 0)
  const fundBalance = funds.reduce((s, f) => s + (f.type === 'contribution' || f.type === 'bonus_pool' || f.type === 'increment_pool' ? f.amount : -f.amount), 0)

  const card: React.CSSProperties = { background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: isMobile ? '12px' : '14px' }
  const input: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }
  const label: React.CSSProperties = { fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }

  const tabs: { id: Tab; icon: any; label: string; labelBn: string; color: string }[] = [
    { id: 'overview', icon: BarChart3, label: 'Overview', labelBn: 'সারসংক্ষেপ', color: 'var(--brand)' },
    { id: 'performance', icon: Target, label: 'Performance', labelBn: 'কর্মদক্ষতা', color: 'var(--teal)' },
    { id: 'increment', icon: TrendingUp, label: 'Increment', labelBn: 'বেতন বৃদ্ধি', color: 'var(--green)' },
    { id: 'bonus', icon: Gift, label: 'Bonus', labelBn: 'বোনাস', color: 'var(--amber)' },
    { id: 'promotion', icon: Award, label: 'Promotion', labelBn: 'পদোন্নতি', color: 'var(--purple)' },
    { id: 'fund', icon: HandCoins, label: 'Fund', labelBn: 'তহবিল', color: 'var(--red)' },
  ]

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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
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

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={card}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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

            <div style={card}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={13} />{isBn ? 'বিভাগ অনুযায়ী' : 'By Department'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {deptStats.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-secondary)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--amber)' }}>{d.name[0]}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{isBn ? d.nameBn : d.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.teacherCount} {isBn ? 'জন' : 'teachers'}</div>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>৳{d.avgSalary.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <>
          <div style={{ ...card, marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} />{isBn ? 'হোমওয়ার্ক ট্র্যাকিং' : 'Homework Tracking'}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'end', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div>
                <label style={label}>{isBn ? 'তারিখ' : 'Date'}</label>
                <input type="date" value={hwDate} onChange={e => setHwDate(e.target.value)} style={{ ...input, width: '160px' }} />
              </div>
              <button onClick={() => {
                activeTeachers.forEach(t => {
                  const id = `HW-${t.id}-${hwDate}`
                  if (!homeworkRecords.find(r => r.id === id)) {
                    addHomeworkRecord({ id, teacherId: t.id, classId: '', sectionId: '', subject: '', date: hwDate, submitted: Math.random() > 0.15 })
                  }
                })
              }}
                style={{ padding: '8px 14px', borderRadius: '7px', background: 'var(--teal)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={12} /> {isBn ? 'জেনারেট' : 'Generate'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '8px' }}>
              {(() => {
                const dayRecords = homeworkRecords.filter(r => r.date === hwDate)
                const submitted = dayRecords.filter(r => r.submitted).length
                const total = dayRecords.length || activeTeachers.length
                const rate = total > 0 ? Math.round((submitted / total) * 100) : 0
                return [
                  { label: isBn ? 'মোট' : 'Total', val: total, color: 'var(--text-primary)' },
                  { label: isBn ? 'জমা' : 'Submitted', val: submitted, color: 'var(--green)' },
                  { label: isBn ? 'বাকি' : 'Pending', val: total - submitted, color: 'var(--amber)' },
                  { label: isBn ? 'হার' : 'Rate', val: `${rate}%`, color: rate >= 80 ? 'var(--green)' : 'var(--red)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* Teacher Performance List */}
          <div style={card}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={13} />{isBn ? 'শিক্ষক কর্মদক্ষতা' : 'Teacher Performance'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeTeachers.slice(0, 10).map(t => {
                const dayRecords = homeworkRecords.filter(r => r.teacherId === t.id)
                const submitted = dayRecords.filter(r => r.submitted).length
                const rate = dayRecords.length > 0 ? Math.round((submitted / dayRecords.length) * 100) : 0
                const dept = departments.find(d => d.id === t.departmentId)
                return (
                  <div key={t.id} style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                    onClick={() => setExpandedTeacher(expandedTeacher === t.id ? null : t.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {t.photo ? <img src={t.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.nameEn}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{dept?.name || t.designation}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--amber)' : 'var(--red)' }}>{rate}%</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{isBn ? 'হোমওয়ার্ক' : 'Homework'}</div>
                      </div>
                      <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${rate}%`, background: rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--amber)' : 'var(--red)', borderRadius: '3px' }} />
                      </div>
                      {expandedTeacher === t.id ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                    {expandedTeacher === t.id && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '8px' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.salary.toLocaleString()}</div><div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{isBn ? 'বেতন' : 'Salary'}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>{increments.filter(i => i.teacherId === t.id).length}</div><div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{isBn ? 'বৃদ্ধি' : 'Increments'}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--amber)' }}>{bonuses.filter(b => b.teacherId === t.id).length}</div><div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{isBn ? 'বোনাস' : 'Bonuses'}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--purple)' }}>{promotions.filter(p => p.teacherId === t.id).length}</div><div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{isBn ? 'পদোন্নতি' : 'Promotions'}</div></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
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
                <div><label style={label}>{isBn ? 'বর্তমান' : 'From'}</label><input value={proForm.fromDesignation} style={{ ...input, background: 'var(--bg-primary)' }} readOnly /></div>
                <div><label style={label}>{isBn ? 'নতুন' : 'To'}</label><input value={proForm.toDesignation} onChange={e => setProForm(p => ({ ...p, toDesignation: e.target.value }))} style={input} placeholder={isBn ? 'নতুন পদবি' : 'New designation'} /></div>
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
