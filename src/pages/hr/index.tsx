import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Users, TrendingUp, TrendingDown, Award, DollarSign, Clock,
  CheckCircle2, XCircle, Plus, Save, X,
  Gift, HandCoins, Medal, Percent,
  Search, Zap, ThumbsUp, AlertCircle, LayoutGrid,
  List, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, FileText, Calendar, Calculator, Briefcase, Edit2, Trash2, Download,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useTeacherStore } from '@/store/teacherStore'
import { useHRStore } from '@/store/hrStore'

function toBnNum(n: number): string {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯']
  return String(n).replace(/\d/g, d => bn[+d])
}
import type { MonthlySalaryConfig, Facility } from '@/store/hrStore'
import CircularChart from '@/components/ui/CircularChart'
import { HRPDFOptionsModal } from '@/components/shared/HRPDFOptionsModal'
import { generateIncrementPDF, generateBonusPDF, generatePromotionPDF, generateFundPDF, generateAssignmentPDF, generateSalaryPDF } from '@/pages/hr/listPdfTemplate'
import type { HRListPDFOptions } from '@/pages/hr/listPdfTemplate'

type Tab = 'overview' | 'decisions' | 'increment' | 'bonus' | 'promotion' | 'fund' | 'salary-setup' | 'facilities'

export default function HRPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const { teachers, departments, attendance } = useTeacherStore()
  const {
    increments, bonuses, promotions, funds, homeworkRecords,
    dailyReports, recommendations, monthlySalaryConfigs,
    facilities, teacherFacilities,
    addIncrement, deleteIncrement, addBonus, deleteBonus, addPromotion, addFund, addRecommendation,
    updateRecommendation, upsertManyMonthlySalaryConfigs,
    addFacility, updateFacility, deleteFacility,
    assignTeacherFacility, updateTeacherFacility, removeTeacherFacility,
    upsertTeacherFacilities,
  } = useHRStore()
  const isBn = language === 'bn'

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [modalType, setModalType] = useState<'increment' | 'bonus' | 'promotion' | 'fund' | null>(null)
  const [incForm, setIncForm] = useState({ teacherId: '', type: 'annual' as 'annual' | 'performance' | 'special', percentage: '', reason: '' })
  const [bonForm, setBonForm] = useState({ teacherId: '', type: 'festival' as 'festival' | 'performance' | 'attendance' | 'special', amount: '', reason: '', month: '' })
  const [proForm, setProForm] = useState({ teacherId: '', fromDesignation: '', toDesignation: '', reason: '' })
  const [fundForm, setFundForm] = useState({ type: 'contribution' as const, amount: '', description: '' })
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<string>('all')
  const [showGenerateRecs, setShowGenerateRecs] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [employeeView, setEmployeeView] = useState<'grid' | 'list'>('grid')
  const [showPDFModal, setShowPDFModal] = useState<'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary' | null>(null)
  const [selectedSalary, setSelectedSalary] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 28); return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [selectedInc, setSelectedInc] = useState<string[]>([])
  const [selectedBon, setSelectedBon] = useState<string[]>([])
  const [selectedPro, setSelectedPro] = useState<string[]>([])
  const [selectedFund, setSelectedFund] = useState<string[]>([])
  const [salarySetupMonth, setSalarySetupMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [salaryConfigs, setSalaryConfigs] = useState<Record<string, { bonus: number; festivalBonus: number; applyDeductionRule: boolean; fundContributionPercent: number }>>({})
  const [salarySaved, setSalarySaved] = useState(false)
  const [facModalType, setFacModalType] = useState<'add-facility' | 'edit-facility' | 'assign' | 'edit-assign' | null>(null)
  const [facForm, setFacForm] = useState({ name: '', nameBn: '', defaultAmount: '', type: 'monthly' as 'monthly' | 'oneTime' })
  const [editFac, setEditFac] = useState<Facility | null>(null)
  const [assignForm, setAssignForm] = useState({ teacherId: '', facilityId: '', amount: '' })
  const [editAssign, setEditAssign] = useState<{ id: string; teacherId: string; facilityId: string; amount: number } | null>(null)
  const [facDeleteConfirm, setFacDeleteConfirm] = useState<string | null>(null)
  const [assignDeleteConfirm, setAssignDeleteConfirm] = useState<string | null>(null)
  const [selectedFacStaff, setSelectedFacStaff] = useState('')
  const [facStaffFilter, setFacStaffFilter] = useState('')
  const [facStaffSearch, setFacStaffSearch] = useState('')
  const [assignDateFrom, setAssignDateFrom] = useState('')
  const [assignDateTo, setAssignDateTo] = useState('')
  const [selectedAssign, setSelectedAssign] = useState<string[]>([])
  useScrollLock(
    modalType !== null || showPDFModal !== null ||
    facModalType !== null || facDeleteConfirm !== null || assignDeleteConfirm !== null
  )
  const [bonusDateFrom, setBonusDateFrom] = useState('')
  const [bonusDateTo, setBonusDateTo] = useState('')
  const [bulkDeductionEnabled, setBulkDeductionEnabled] = useState(false)
  const [bulkDeductionFrom, setBulkDeductionFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [bulkDeductionTo, setBulkDeductionTo] = useState(new Date().toISOString().split('T')[0])
  const [bulkFundEnabled, setBulkFundEnabled] = useState(false)
  const [bulkFundPercent, setBulkFundPercent] = useState('')

  const [perPage, setPerPage] = useState(20)
  const [page, setPage] = useState(1)

  const toggleInc = useCallback((id: string) => setSelectedInc(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const toggleAllInc = useCallback(() => setSelectedInc(p => p.length === increments.length ? [] : increments.map(i => i.id)), [increments])
  const toggleBon = useCallback((id: string) => setSelectedBon(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const toggleAllBon = useCallback(() => setSelectedBon(p => p.length === bonuses.length ? [] : bonuses.map(b => b.id)), [bonuses])
  const togglePro = useCallback((id: string) => setSelectedPro(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const toggleAllPro = useCallback(() => setSelectedPro(p => p.length === promotions.length ? [] : promotions.map(p => p.id)), [promotions])
  const toggleFund = useCallback((id: string) => setSelectedFund(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const toggleAllFund = useCallback(() => setSelectedFund(p => p.length === funds.length ? [] : funds.map(f => f.id)), [funds])
  const toggleAssign = useCallback((id: string) => setSelectedAssign(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const toggleSalary = useCallback((id: string) => setSelectedSalary(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])

  const activeTeachers = useMemo(() => teachers.filter(t => t.status === 'active'), [teachers])
  const toggleAllSalary = useCallback(() => setSelectedSalary(p => p.length === activeTeachers.length ? [] : activeTeachers.map(t => t.id)), [activeTeachers])
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

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const avatarGradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #14b8a6, #0d9488)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #22c55e, #16a34a)',
    'linear-gradient(135deg, #a855f7, #9333ea)',
    'linear-gradient(135deg, #ec4899, #db2777)',
    'linear-gradient(135deg, #3b82f6, #2563eb)',
    'linear-gradient(135deg, #ef4444, #dc2626)',
  ]

  const getAvatarGradient = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i)
    return avatarGradients[Math.abs(hash) % avatarGradients.length]
  }

  const teacherAttendanceRate = useMemo(() => {
    const rates: Record<string, number> = {}
    const from = new Date(dateFrom)
    const to = new Date(dateTo)
    let totalDays = 0
    const d = new Date(from)
    while (d <= to) {
      if (d.getDay() !== 0) totalDays++
      d.setDate(d.getDate() + 1)
    }
    activeTeachers.forEach(t => {
      let presentCount = 0
      const dd = new Date(from)
      while (dd <= to) {
        if (dd.getDay() !== 0) {
          const dateStr = dd.toISOString().split('T')[0]
          if (attendance[dateStr]?.[t.id]?.status === 'present') presentCount++
        }
        dd.setDate(dd.getDate() + 1)
      }
      rates[t.id] = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0
    })
    return rates
  }, [attendance, activeTeachers, dateFrom, dateTo])

  const teacherHomeworkRate = useMemo(() => {
    const rates: Record<string, number> = {}
    activeTeachers.forEach(t => {
      const records = homeworkRecords.filter(r => r.teacherId === t.id && r.date >= dateFrom && r.date <= dateTo)
      const submitted = records.filter(r => r.submitted).length
      rates[t.id] = records.length > 0 ? Math.round((submitted / records.length) * 100) : 0
    })
    return rates
  }, [homeworkRecords, activeTeachers, dateFrom, dateTo])

  const teacherReportRate = useMemo(() => {
    const rates: Record<string, { rate: number; avgScore: number }> = {}
    activeTeachers.forEach(t => {
      const reports = dailyReports.filter(r => r.teacherId === t.id && r.date >= dateFrom && r.date <= dateTo)
      const submitted = reports.filter(r => r.submitted).length
      const rate = reports.length > 0 ? Math.round((submitted / reports.length) * 100) : 0
      const scored = reports.filter(r => r.submitted && r.avgScore > 0)
      const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.avgScore, 0) / scored.length) : 0
      rates[t.id] = { rate, avgScore }
    })
    return rates
  }, [dailyReports, activeTeachers, dateFrom, dateTo])

  const attendanceRank = useMemo(() =>
    activeTeachers.map(t => ({ ...t, rate: teacherAttendanceRate[t.id] || 0 }))
      .sort((a, b) => b.rate - a.rate).slice(0, 5), [activeTeachers, teacherAttendanceRate])

  const homeworkRank = useMemo(() =>
    activeTeachers.map(t => ({ ...t, rate: teacherHomeworkRate[t.id] || 0 }))
      .sort((a, b) => b.rate - a.rate).slice(0, 5), [activeTeachers, teacherHomeworkRate])

  const reportRank = useMemo(() =>
    activeTeachers.map(t => ({ ...t, rate: teacherReportRate[t.id]?.rate || 0 }))
      .sort((a, b) => b.rate - a.rate).slice(0, 5), [activeTeachers, teacherReportRate])

  const studentPerformanceRank = useMemo(() =>
    activeTeachers.map(t => ({ ...t, avgScore: teacherReportRate[t.id]?.avgScore || 0 }))
      .sort((a, b) => b.avgScore - a.avgScore).slice(0, 5), [activeTeachers, teacherReportRate])

  const teacherCompositeScores = useMemo(() =>
    activeTeachers.map(t => {
      const attRate = teacherAttendanceRate[t.id] || 0
      const hwRate = teacherHomeworkRate[t.id] || 0
      const repRate = teacherReportRate[t.id]?.rate || 0
      const avgScore = teacherReportRate[t.id]?.avgScore || 0
      const totalScore = Math.round(attRate * 0.3 + hwRate * 0.3 + repRate * 0.2 + avgScore * 0.002 * 20)
      return { ...t, attRate, hwRate, repRate, avgScore, totalScore: Math.min(100, Math.max(0, totalScore)) }
    }).sort((a, b) => b.totalScore - a.totalScore), [activeTeachers, teacherAttendanceRate, teacherHomeworkRate, teacherReportRate])

  const totalIncrements = increments.reduce((s, i) => s + i.amount, 0)
  const totalBonuses = bonuses.reduce((s, b) => s + b.amount, 0)
  const fundBalance = funds.reduce((s, f) => s + (f.type === 'contribution' || f.type === 'bonus_pool' || f.type === 'increment_pool' ? f.amount : -f.amount), 0)

  // Salary deduction rule: if applySalaryRule && attended >= 3 days in range, deduct 1 day salary
  const salaryDeductions = useMemo(() => {
    let totalDeduction = 0
    const from = new Date(dateFrom)
    const to = new Date(dateTo)
    // Count working days in range
    let workingDays = 0
    const d = new Date(from)
    while (d <= to) { if (d.getDay() !== 0) workingDays++; d.setDate(d.getDate() + 1) }
    // Count days in month (approximate)
    const daysInMonth = 30

    activeTeachers.forEach(t => {
      if (!t.applySalaryRule || !t.salary) return
      // Count days present for this teacher
      let daysPresent = 0
      const dd = new Date(from)
      while (dd <= to) {
        if (dd.getDay() !== 0) {
          const dateStr = dd.toISOString().split('T')[0]
          if (attendance[dateStr]?.[t.id]?.status === 'present') daysPresent++
        }
        dd.setDate(dd.getDate() + 1)
      }
      // If attended minimum 3 days, deduct 1 day salary
      if (daysPresent >= 3) {
        const dailySalary = Math.round(t.salary / daysInMonth)
        totalDeduction += dailySalary
      }
    })
    return totalDeduction
  }, [activeTeachers, attendance, dateFrom, dateTo])

  const adjustedTotalSalary = totalSalary - salaryDeductions

  // Standard styles matching other pages
  const section: React.CSSProperties = {
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: isMobile ? '14px' : '16px', marginBottom: '14px',
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: '8px',
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
  }

  const label: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)',
    marginBottom: '5px', display: 'block',
  }

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, height: '100dvh', zIndex: 100,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto',
  }

  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px', width: '100%',
    maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
  }

  const handleAddIncrement = () => {
    if (!incForm.teacherId || !incForm.percentage) return
    const t = teachers.find(t => t.id === incForm.teacherId)
    if (!t) return
    const amount = Math.round(t.salary * Number(incForm.percentage) / 100)
    addIncrement({ id: `INC-${Date.now()}`, teacherId: incForm.teacherId, type: incForm.type, amount, percentage: Number(incForm.percentage), reason: incForm.reason, date: today, approvedBy: 'HR Admin' })
    setIncForm({ teacherId: '', type: 'annual', percentage: '', reason: '' })
    setModalType(null)
  }

  const handleAddBonus = () => {
    if (!bonForm.teacherId || !bonForm.amount) return
    addBonus({ id: `BON-${Date.now()}`, teacherId: bonForm.teacherId, type: bonForm.type, amount: Number(bonForm.amount), month: bonForm.month || today.slice(0, 7), reason: bonForm.reason, date: today })
    setBonForm({ teacherId: '', type: 'festival', amount: '', reason: '', month: '' })
    setModalType(null)
  }

  const handleAddPromotion = () => {
    if (!proForm.teacherId || !proForm.toDesignation) return
    addPromotion({ id: `PRO-${Date.now()}`, teacherId: proForm.teacherId, fromDesignation: proForm.fromDesignation, toDesignation: proForm.toDesignation, date: today, reason: proForm.reason })
    setProForm({ teacherId: '', fromDesignation: '', toDesignation: '', reason: '' })
    setModalType(null)
  }

  const handleAddFund = () => {
    if (!fundForm.amount) return
    addFund({ id: `FND-${Date.now()}`, type: fundForm.type, amount: Number(fundForm.amount), description: fundForm.description, date: today })
    setFundForm({ type: 'contribution', amount: '', description: '' })
    setModalType(null)
  }

  const handleAddFacility = () => {
    if (!facForm.name.trim()) return
    const now = new Date().toISOString().split('T')[0]
    addFacility({
      id: `FAC-${Date.now()}`,
      name: facForm.name.trim(),
      nameBn: facForm.nameBn.trim(),
      defaultAmount: Number(facForm.defaultAmount) || 0,
      type: facForm.type,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    setFacForm({ name: '', nameBn: '', defaultAmount: '', type: 'monthly' })
    setFacModalType(null)
  }

  const handleEditFacility = () => {
    if (!editFac || !facForm.name.trim()) return
    updateFacility(editFac.id, { name: facForm.name.trim(), nameBn: facForm.nameBn.trim(), defaultAmount: Number(facForm.defaultAmount) || 0, type: facForm.type })
    setEditFac(null)
    setFacForm({ name: '', nameBn: '', defaultAmount: '', type: 'monthly' })
    setFacModalType(null)
  }

  const handleAssignFacility = () => {
    if (!assignForm.teacherId || !assignForm.facilityId) return
    const now = new Date().toISOString().split('T')[0]
    assignTeacherFacility({
      id: `TF-${Date.now()}`,
      teacherId: assignForm.teacherId,
      facilityId: assignForm.facilityId,
      amount: Number(assignForm.amount) || 0,
      createdAt: now,
      updatedAt: now,
    })
    setAssignForm({ teacherId: '', facilityId: '', amount: '' })
    setFacModalType(null)
  }

  const handleEditAssign = () => {
    if (!editAssign) return
    updateTeacherFacility(editAssign.id, { amount: Number(assignForm.amount) || 0 })
    setEditAssign(null)
    setAssignForm({ teacherId: '', facilityId: '', amount: '' })
    setFacModalType(null)
  }

  const filteredAssignments = useMemo(() => {
    let list = teacherFacilities
    if (assignDateFrom) list = list.filter(tf => tf.createdAt >= assignDateFrom)
    if (assignDateTo) list = list.filter(tf => tf.createdAt <= assignDateTo + 'T23:59:59')
    return list
  }, [teacherFacilities, assignDateFrom, assignDateTo])

  const filteredBonuses = useMemo(() => {
    let list = bonuses
    if (bonusDateFrom) list = list.filter(b => b.date >= bonusDateFrom)
    if (bonusDateTo) list = list.filter(b => b.date <= bonusDateTo)
    return list
  }, [bonuses, bonusDateFrom, bonusDateTo])

  // Pagination computations
  const paginatedIncrements = useMemo(() => increments.slice((page - 1) * perPage, page * perPage), [increments, page, perPage])
  const incrementTotalPages = Math.max(1, Math.ceil(increments.length / perPage))

  const paginatedBonuses = useMemo(() => bonuses.slice((page - 1) * perPage, page * perPage), [bonuses, page, perPage])
  const bonusTotalPages = Math.max(1, Math.ceil(bonuses.length / perPage))

  const paginatedPromotions = useMemo(() => promotions.slice((page - 1) * perPage, page * perPage), [promotions, page, perPage])
  const promotionTotalPages = Math.max(1, Math.ceil(promotions.length / perPage))

  const paginatedFunds = useMemo(() => funds.slice((page - 1) * perPage, page * perPage), [funds, page, perPage])
  const fundTotalPages = Math.max(1, Math.ceil(funds.length / perPage))

  const paginatedActiveTeachers = useMemo(() => activeTeachers.slice((page - 1) * perPage, page * perPage), [activeTeachers, page, perPage])
  const salaryTotalPages = Math.max(1, Math.ceil(activeTeachers.length / perPage))

  const paginatedAssignments = useMemo(() => filteredAssignments.slice((page - 1) * perPage, page * perPage), [filteredAssignments, page, perPage])
  const assignmentTotalPages = Math.max(1, Math.ceil(filteredAssignments.length / perPage))

  const paginatedFacBonuses = useMemo(() => filteredBonuses.slice((page - 1) * perPage, page * perPage), [filteredBonuses, page, perPage])
  const facBonusTotalPages = Math.max(1, Math.ceil(filteredBonuses.length / perPage))

  const handleBulkApplyDeduction = () => {
    const configs: MonthlySalaryConfig[] = activeTeachers.map(t => {
      const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
      return {
        id: existing?.id || `MSC-${Date.now()}-${t.id}`,
        month: salarySetupMonth,
        teacherId: t.id,
        bonus: existing?.bonus ?? salaryConfigs[t.id]?.bonus ?? 0,
        festivalBonus: existing?.festivalBonus ?? salaryConfigs[t.id]?.festivalBonus ?? 0,
        applyDeductionRule: bulkDeductionEnabled,
        fundContributionPercent: existing?.fundContributionPercent ?? salaryConfigs[t.id]?.fundContributionPercent ?? 0,
        createdAt: new Date().toISOString(),
      }
    })
    upsertManyMonthlySalaryConfigs(configs)
    setSalarySaved(true)
    setTimeout(() => setSalarySaved(false), 2500)
  }

  const handleBulkApplyFund = () => {
    const percent = Number(bulkFundPercent) || 0
    const configs: MonthlySalaryConfig[] = activeTeachers.map(t => {
      const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
      return {
        id: existing?.id || `MSC-${Date.now()}-${t.id}`,
        month: salarySetupMonth,
        teacherId: t.id,
        bonus: existing?.bonus ?? salaryConfigs[t.id]?.bonus ?? 0,
        festivalBonus: existing?.festivalBonus ?? salaryConfigs[t.id]?.festivalBonus ?? 0,
        applyDeductionRule: existing?.applyDeductionRule ?? salaryConfigs[t.id]?.applyDeductionRule ?? false,
        fundContributionPercent: bulkFundEnabled ? percent : 0,
        createdAt: new Date().toISOString(),
      }
    })
    upsertManyMonthlySalaryConfigs(configs)
    setSalarySaved(true)
    setTimeout(() => setSalarySaved(false), 2500)
  }

  const selectedStaffFacilities = useMemo(() => {
    if (!selectedFacStaff) return []
    return facilities.map(fac => {
      const assigned = teacherFacilities.find(tf => tf.teacherId === selectedFacStaff && tf.facilityId === fac.id)
      return { facility: fac, assigned: !!assigned, amount: assigned?.amount || fac.defaultAmount }
    })
  }, [selectedFacStaff, facilities, teacherFacilities])

  const toggleStaffFacility = useCallback((facilityId: string) => {
    const existing = teacherFacilities.find(tf => tf.teacherId === selectedFacStaff && tf.facilityId === facilityId)
    if (existing) {
      removeTeacherFacility(existing.id)
    } else {
      const fac = facilities.find(f => f.id === facilityId)
      assignTeacherFacility({
        id: `TF-${Date.now()}-${facilityId}`,
        teacherId: selectedFacStaff,
        facilityId,
        amount: fac?.defaultAmount || 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      })
    }
  }, [selectedFacStaff, teacherFacilities, facilities, assignTeacherFacility, removeTeacherFacility])

  const updateStaffFacilityAmount = useCallback((facilityId: string, amount: number) => {
    const existing = teacherFacilities.find(tf => tf.teacherId === selectedFacStaff && tf.facilityId === facilityId)
    if (existing) updateTeacherFacility(existing.id, { amount })
  }, [selectedFacStaff, teacherFacilities, updateTeacherFacility])

  const handleSaveStaffFacilities = useCallback(() => {
    const items = selectedStaffFacilities.filter(sf => sf.assigned).map(sf => ({
      id: teacherFacilities.find(tf => tf.teacherId === selectedFacStaff && tf.facilityId === sf.facility.id)?.id || `TF-${Date.now()}-${sf.facility.id}`,
      teacherId: selectedFacStaff,
      facilityId: sf.facility.id,
      amount: sf.amount,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }))
    upsertTeacherFacilities(items)
  }, [selectedStaffFacilities, selectedFacStaff, teacherFacilities, upsertTeacherFacilities])

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
        addRecommendation({ id: `REC-${Date.now()}-${i}`, teacherId: t.id, type, score: t.totalScore, reason: reasons[type], status: 'pending', createdAt: today })
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
      if (t) addPromotion({ id: `PRO-${Date.now()}`, teacherId: rec.teacherId, fromDesignation: t.designation, toDesignation: 'Senior ' + t.designation, date: today, reason: rec.reason })
    } else if (rec.type === 'increment') {
      const t = teachers.find(tx => tx.id === rec.teacherId)
      if (t) addIncrement({ id: `INC-${Date.now()}`, teacherId: rec.teacherId, type: 'performance', amount: Math.round(t.salary * 0.05), percentage: 5, reason: rec.reason, date: today, approvedBy: 'HR Admin' })
    }
  }

  const handlePDFDownload = useCallback((type: 'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary', opts: HRListPDFOptions) => {
    const win = window.open('', '_blank')
    if (!win) return
    let html = ''
    if (type === 'increment') {
      const list = selectedInc.length > 0 ? increments.filter(i => selectedInc.includes(i.id)) : increments
      html = generateIncrementPDF(list, opts, getTeacherName)
    } else if (type === 'bonus') {
      const list = selectedBon.length > 0 ? bonuses.filter(b => selectedBon.includes(b.id)) : bonuses
      html = generateBonusPDF(list, opts, getTeacherName)
    } else if (type === 'promotion') {
      const list = selectedPro.length > 0 ? promotions.filter(p => selectedPro.includes(p.id)) : promotions
      html = generatePromotionPDF(list, opts, getTeacherName)
    } else if (type === 'fund') {
      const list = selectedFund.length > 0 ? funds.filter(f => selectedFund.includes(f.id)) : funds
      html = generateFundPDF(list, opts)
    } else if (type === 'assignment') {
      const list = selectedAssign.length > 0 ? teacherFacilities.filter(tf => selectedAssign.includes(tf.id)) : filteredAssignments
      html = generateAssignmentPDF(list, opts, getTeacherName, (id) => facilities.find(f => f.id === id)?.name || id)
    } else if (type === 'salary') {
      const teachersToShow = selectedSalary.length > 0 ? activeTeachers.filter(t => selectedSalary.includes(t.id)) : activeTeachers
      const salaryData = teachersToShow.map(t => {
        const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
        const local = salaryConfigs[t.id] || {}
        const applyDeduction = local.applyDeductionRule ?? existing?.applyDeductionRule ?? false
        const fundPercent = local.fundContributionPercent ?? existing?.fundContributionPercent ?? 0
        const teacherBonuses = bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth)
        const perf = teacherBonuses.filter(b => b.type === 'performance').reduce((sum, b) => sum + b.amount, 0)
        const atten = teacherBonuses.filter(b => b.type === 'attendance').reduce((sum, b) => sum + b.amount, 0)
        const special = teacherBonuses.filter(b => b.type === 'special').reduce((sum, b) => sum + b.amount, 0)
        const festival = teacherBonuses.filter(b => b.type === 'festival').reduce((sum, b) => sum + b.amount, 0)
        const totalBonus = perf + atten + special + festival
        const deduction = applyDeduction ? Math.round(t.salary / 30) : 0
        const fund = Math.round(t.salary * fundPercent / 100)
        const net = t.salary + totalBonus - deduction - fund
        return { ...t, basic: t.salary, perf, atten, special, festival, totalBonus, deduction, fundPercent, net }
      })
      html = generateSalaryPDF(salaryData, opts)
    }
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 800)
    setShowPDFModal(null)
  }, [increments, bonuses, promotions, funds, teacherFacilities, facilities, filteredAssignments, getTeacherName, selectedInc, selectedBon, selectedPro, selectedFund, selectedAssign, selectedSalary, activeTeachers, monthlySalaryConfigs, salaryConfigs, salarySetupMonth, bonuses])

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string; labelBn: string }> = {
      active: { bg: 'var(--green-light)', color: 'var(--green)', label: 'Active', labelBn: 'সক্রিয়' },
      inactive: { bg: 'var(--red-light)', color: 'var(--red)', label: 'Inactive', labelBn: 'নিষ্ক্রিয়' },
      'on-leave': { bg: 'var(--amber-light)', color: 'var(--amber)', label: 'On Leave', labelBn: 'ছুটিতে' },
    }
    const s = map[status] || map.active
    return (
      <span style={{
        fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
        background: s.bg, color: s.color, fontWeight: 500, whiteSpace: 'nowrap',
      }}>
        {isBn ? s.labelBn : s.label}
      </span>
    )
  }

  const employeeList = useMemo(() =>
    teachers.filter(t => {
      const match = employeeSearch.toLowerCase()
      return (t.nameEn.toLowerCase().includes(match) || t.nameBn.includes(match) || t.designation.toLowerCase().includes(match) || t.phone.includes(match)) &&
        (employeeStatusFilter === 'all' || t.status === employeeStatusFilter)
    }).map(t => ({
      ...t,
      attRate: teacherAttendanceRate[t.id] || 0,
      hwRate: teacherHomeworkRate[t.id] || 0,
      reportRate: teacherReportRate[t.id]?.rate || 0,
      compScore: teacherCompositeScores.find(s => s.id === t.id)?.totalScore || 0,
    })), [teachers, employeeSearch, employeeStatusFilter, teacherAttendanceRate, teacherHomeworkRate, teacherReportRate, teacherCompositeScores])

  const paginatedEmployees = useMemo(() => employeeList.slice((page - 1) * perPage, page * perPage), [employeeList, page, perPage])
  const employeeTotalPages = Math.max(1, Math.ceil(employeeList.length / perPage))

  const tabs: { id: Tab; icon: any; label: string; labelBn: string; color: string }[] = [
    { id: 'overview', icon: LayoutGrid, label: 'Overview', labelBn: 'সারসংক্ষেপ', color: 'var(--brand)' },
    { id: 'decisions', icon: Zap, label: 'Decisions', labelBn: 'সিদ্ধান্ত', color: 'var(--teal)' },
    { id: 'increment', icon: TrendingUp, label: 'Increment', labelBn: 'বেতন বৃদ্ধি', color: 'var(--green)' },
    { id: 'bonus', icon: Gift, label: 'Bonus', labelBn: 'বোনাস', color: 'var(--amber)' },
    { id: 'promotion', icon: Award, label: 'Promotion', labelBn: 'পদোন্নতি', color: 'var(--purple)' },
    { id: 'fund', icon: HandCoins, label: 'Fund', labelBn: 'তহবিল', color: 'var(--brand)' },
    { id: 'facilities', icon: Briefcase, label: 'Facilities', labelBn: 'সুবিধা', color: 'var(--purple)' },
    { id: 'salary-setup', icon: Calculator, label: 'Salary Setup', labelBn: 'বেতন সেটআপ', color: 'var(--teal)' },
  ]

  const quickStats = [
    { labelBn: 'সক্রিয়', labelEn: 'Active', valueBn: `${toBnNum(activeTeachers.length)} জন`, valueEn: String(activeTeachers.length), icon: Users, color: 'var(--brand)', bg: 'var(--brand-light)' },
    { labelBn: 'উপস্থিত', labelEn: 'Present', valueBn: `${toBnNum(attendanceToday.present)} জন`, valueEn: String(attendanceToday.present), icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green-light)' },
    { labelBn: 'অনুপস্থিত', labelEn: 'Absent', valueBn: `${toBnNum(attendanceToday.absent)} জন`, valueEn: String(attendanceToday.absent), icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)' },
    { labelBn: 'ছুটিতে', labelEn: 'On Leave', valueBn: `${toBnNum(attendanceToday.onLeave)} জন`, valueEn: String(attendanceToday.onLeave), icon: Clock, color: 'var(--amber)', bg: 'var(--amber-light)' },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
          <ArrowLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'HR ও কর্মচারী ব্যবস্থাপনা' : 'HR & Staff Management'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {isBn ? `${activeTeachers.length} জন সক্রিয় কর্মচারী · ${departments.length} টি বিভাগ` : `${activeTeachers.length} active staff · ${departments.length} departments`}
          </p>
        </div>
      </div>

      {/* Tabs - matching other pages' segmented pill style */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '5px', marginBottom: '14px', overflowX: 'auto', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1) }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '9px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s',
              background: activeTab === tab.id ? 'var(--brand)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              whiteSpace: 'nowrap',
            }}>
            <tab.icon size={15} />
            {isBn ? tab.labelBn : tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <>
          {/* Date Range Filter */}
          <div style={section}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Calendar size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{isBn ? 'তারিখ পরিসীমা:' : 'Date Range:'}</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ ...input, width: 'auto', padding: '6px 10px', fontSize: '12px' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ ...input, width: 'auto', padding: '6px 10px', fontSize: '12px' }} />
              <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); setDateFrom(d.toISOString().split('T')[0]); setDateTo(new Date().toISOString().split('T')[0]) }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? '৭ দিন' : '7D'}
              </button>
              <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 30); setDateFrom(d.toISOString().split('T')[0]); setDateTo(new Date().toISOString().split('T')[0]) }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? '৩০ দিন' : '30D'}
              </button>
              <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 1); setDateFrom(d.toISOString().split('T')[0]); setDateTo(new Date().toISOString().split('T')[0]) }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? '১ মাস' : '1M'}
              </button>
              <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 3); setDateFrom(d.toISOString().split('T')[0]); setDateTo(new Date().toISOString().split('T')[0]) }}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? '৩ মাস' : '3M'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {quickStats.map(s => (
              <div key={s.labelEn} style={section}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <s.icon size={15} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{isBn ? s.valueBn : s.valueEn}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isBn ? s.labelBn : s.labelEn}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Rankings */}
          <div style={section}>
            <div style={sectionTitle}>
              <Medal size={15} style={{ color: 'var(--amber)' }} />{isBn ? 'শীর্ষ কর্মী' : 'Top Performers'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { title: isBn ? 'শিক্ষার্থী ফলাফল' : 'Student Performance', data: studentPerformanceRank, color: 'var(--brand)', key: 'avgScore' as const, suffix: '' },
                { title: isBn ? 'দৈনিক রিপোর্ট' : 'Reports', data: reportRank, color: 'var(--teal)', key: 'rate' as const, suffix: '%' },
                { title: isBn ? 'হোমওয়ার্ক' : 'Homework', data: homeworkRank, color: 'var(--green)', key: 'rate' as const, suffix: '%' },
                { title: isBn ? 'উপস্থিতি' : 'Attendance', data: attendanceRank, color: 'var(--purple)', key: 'rate' as const, suffix: '%' },
              ].map(card => (
                <div key={card.title} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>{card.title}</div>
                  {card.data.slice(0, 3).map((t, i) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--text-muted)', width: '18px', textAlign: 'center' }}>#{i + 1}</span>
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: getAvatarGradient(t.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '8px', fontWeight: 600, color: '#fff' }}>
                        {getInitials(t.nameEn)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameEn}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{getTeacherDept(t.id)}</div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: card.color }}>{(t as any)[card.key]}{card.suffix}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div style={section}>
            <div style={sectionTitle}>
              <DollarSign size={15} style={{ color: 'var(--green)' }} />{isBn ? 'আর্থিক সারসংক্ষেপ' : 'Financial Summary'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '8px' }}>
              {[
                { label: isBn ? 'মোট বেতন' : 'Total Salary', val: `৳${adjustedTotalSalary.toLocaleString()}`, color: 'var(--text-primary)' },
                { label: isBn ? 'বেতন কাটা' : 'Deductions', val: salaryDeductions > 0 ? `-৳${salaryDeductions.toLocaleString()}` : '৳0', color: salaryDeductions > 0 ? 'var(--red)' : 'var(--text-muted)' },
                { label: isBn ? 'মোট বৃদ্ধি' : 'Increments', val: `৳${totalIncrements.toLocaleString()}`, color: 'var(--green)' },
                { label: isBn ? 'মোট বোনাস' : 'Bonuses', val: `৳${totalBonuses.toLocaleString()}`, color: 'var(--amber)' },
                { label: isBn ? 'তহবিল' : 'Fund Balance', val: `৳${fundBalance.toLocaleString()}`, color: 'var(--brand)' },
              ].map(item => (
                <div key={item.label} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>
            {salaryDeductions > 0 && (
              <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--red-light)', border: '1px solid var(--red)', fontSize: '11px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={13} />
                {isBn ? `বেতন কাটার নিয়ম প্রযোজ্য: ${activeTeachers.filter(t => t.applySalaryRule).length} জন কর্মচারীর ক্ষেত্রে ১ দিনের বেতন কাটা হয়েছে` : `Salary rule applied: 1 day deducted for ${activeTeachers.filter(t => t.applySalaryRule).length} staff with ≥3 days attendance`}
              </div>
            )}
          </div>

          {/* Employees */}
          <div style={section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isBn ? 'সকল কর্মচারী' : 'All Staff'}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  marginLeft: '4px',
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: '4px', height: '4px', borderRadius: '50%',
                      background: 'var(--brand)', opacity: 0.3,
                      transition: 'all 0.3s ease',
                      transitionDelay: `${i * 80}ms`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.transform = 'scale(1.8)'
                      e.currentTarget.style.background = ['var(--green)', 'var(--brand)', 'var(--amber)'][i]
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = '0.3'
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.background = 'var(--brand)'
                    }}
                    />
                  ))}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input value={employeeSearch} onChange={e => { setEmployeeSearch(e.target.value); setPage(1) }}
                    placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
                    style={{ ...input, paddingLeft: '30px', width: isMobile ? '110px' : '130px', fontSize: '12px', height: '34px' }} />
                </div>
                <select value={employeeStatusFilter} onChange={e => { setEmployeeStatusFilter(e.target.value); setPage(1) }}
                  style={{ ...input, width: '90px', fontSize: '12px', height: '34px' }}>
                  <option value="all">{isBn ? 'সব' : 'All'}</option>
                  <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
                  <option value="inactive">{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
                  <option value="on-leave">{isBn ? 'ছুটিতে' : 'Leave'}</option>
                </select>
                <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, height: '34px' }}>
                  <button onClick={() => setEmployeeView('grid')}
                    style={{ padding: '0 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: employeeView === 'grid' ? 'var(--brand-light)' : 'transparent', color: employeeView === 'grid' ? 'var(--brand)' : 'var(--text-muted)', transition: 'all 0.1s', display: 'flex', alignItems: 'center' }}>
                    <LayoutGrid size={14} />
                  </button>
                  <button onClick={() => setEmployeeView('list')}
                    style={{ padding: '0 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: employeeView === 'list' ? 'var(--brand-light)' : 'transparent', color: employeeView === 'list' ? 'var(--brand)' : 'var(--text-muted)', transition: 'all 0.1s', display: 'flex', alignItems: 'center' }}>
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {employeeView === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '8px' }}>
                {paginatedEmployees.map(t => (
                  <div key={t.id} onClick={() => setSelectedEmployee(selectedEmployee === t.id ? null : t.id)}
                    style={{ padding: '12px', borderRadius: '10px', background: selectedEmployee === t.id ? 'var(--brand-light)' : 'var(--bg-secondary)', border: `1px solid ${selectedEmployee === t.id ? 'var(--brand)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: getAvatarGradient(t.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                        {getInitials(t.nameEn)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameEn}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.designation}</div>
                      </div>
                      {getStatusBadge(t.status)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      <div style={{ textAlign: 'center', padding: '5px 2px', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{isBn ? 'উপস্থিতি' : 'Att.'}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: t.attRate >= 80 ? 'var(--green)' : 'var(--amber)' }}>{t.attRate}%</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '5px 2px', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{isBn ? 'হোমওয়ার্ক' : 'HW'}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: t.hwRate >= 80 ? 'var(--green)' : 'var(--amber)' }}>{t.hwRate}%</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '5px 2px', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{isBn ? 'স্কোর' : 'Score'}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)' }}>{t.compScore}</div>
                      </div>
                    </div>
                    {selectedEmployee === t.id && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.phone}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>·</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{getTeacherDept(t.id)}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>·</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>৳{t.salary.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
                {employeeList.length === 0 && (
                  <div style={{ gridColumn: '1/-1', padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No staff found'}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                      {[isBn ? 'কর্মচারী' : 'Employee', isBn ? 'বিভাগ' : 'Dept', isBn ? 'পদবি' : 'Designation', isBn ? 'উপস্থিতি' : 'Att', isBn ? 'হোমওয়ার্ক' : 'HW', isBn ? 'স্কোর' : 'Score', isBn ? 'স্ট্যাটাস' : 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                {paginatedEmployees.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '8px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: getAvatarGradient(t.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                              {getInitials(t.nameEn)}
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.nameEn}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '8px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{getTeacherDept(t.id)}</td>
                        <td style={{ padding: '8px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t.designation}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '40px', height: '5px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${t.attRate}%`, background: t.attRate >= 80 ? 'var(--green)' : t.attRate >= 60 ? 'var(--amber)' : 'var(--red)', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: t.attRate >= 80 ? 'var(--green)' : t.attRate >= 60 ? 'var(--amber)' : 'var(--red)' }}>{t.attRate}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: t.hwRate >= 80 ? 'var(--green)' : t.hwRate >= 50 ? 'var(--amber)' : 'var(--red)' }}>{t.hwRate}%</span>
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)' }}>{t.compScore}</span>
                        </td>
                        <td style={{ padding: '8px 8px' }}>{getStatusBadge(t.status)}</td>
                      </tr>
                    ))}
                    {employeeList.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>{isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No staff found'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
              {isBn ? `মোট ${employeeList.length} জন কর্মচারী` : `${employeeList.length} total`}
            </div>
            {employeeList.length > perPage && (
              <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, employeeList.length)} / {employeeList.length}
                </span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                    style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'inherit', outline: 'none', marginRight: '6px' }}>
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                  {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ic}
                    </button>
                  ))}
                  {(() => {
                    const start = Math.max(1, Math.min(page - 2, employeeTotalPages - 4))
                    return Array.from({ length: Math.min(5, employeeTotalPages) }, (_, i) => start + i).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`, background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400 }}>
                        {p}
                      </button>
                    ))
                  })()}
                  {([[<ChevronRight size={12} />, () => setPage(p => Math.min(employeeTotalPages, p + 1)), page === employeeTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(employeeTotalPages), page === employeeTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── DECISIONS ─── */}
      {activeTab === 'decisions' && (
        <>
          <div style={section}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} style={{ color: 'var(--brand)' }} />
                  {isBn ? 'বুদ্ধিমান সুপারিশ' : 'AI Recommendations'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isBn ? 'উপস্থিতি, হোমওয়ার্ক, রিপোর্ট ও ফলাফলের ভিত্তিতে' : 'Based on attendance, homework, reports & performance'}
                </div>
              </div>
              <button onClick={handleGenerateRecommendations}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Zap size={14} />{isBn ? 'সুপারিশ তৈরি করুন' : 'Generate'}
              </button>
            </div>
            {showGenerateRecs && (
              <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: 'var(--green-light)', color: 'var(--green)', fontSize: '12px', fontWeight: 500 }}>
                <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                {isBn ? 'সুপারিশ তৈরি করা হয়েছে!' : 'Recommendations generated!'}
              </div>
            )}
          </div>

          <div style={section}>
            <div style={sectionTitle}>
              <Percent size={15} style={{ color: 'var(--teal)' }} />{isBn ? 'সামগ্রিক স্কোর' : 'Performance Scores'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {teacherCompositeScores.slice(0, 10).map((t, i) => (
                <div key={t.id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: i < 3 ? 'var(--amber)' : 'var(--text-muted)', width: '24px' }}>#{i + 1}</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: getAvatarGradient(t.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                      {getInitials(t.nameEn)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.nameEn}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getTeacherDept(t.id)} · {t.designation}</div>
                    </div>
                    <CircularChart value={t.totalScore} size={42} stroke={5} color={t.totalScore >= 80 ? 'var(--green)' : t.totalScore >= 60 ? 'var(--amber)' : 'var(--red)'} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
                    {[
                      { label: isBn ? 'উপস্থিতি' : 'Att', val: `${t.attRate}%`, color: 'var(--purple)' },
                      { label: isBn ? 'হোমওয়ার্ক' : 'HW', val: `${t.hwRate}%`, color: 'var(--green)' },
                      { label: isBn ? 'রিপোর্ট' : 'Reports', val: `${t.repRate}%`, color: 'var(--teal)' },
                      { label: isBn ? 'ফলাফল' : 'Scores', val: `${t.avgScore}`, color: 'var(--brand)' },
                    ].map(d => (
                      <div key={d.label} style={{ textAlign: 'center', padding: '4px', borderRadius: '6px', background: 'var(--bg-primary)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{d.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: d.color }}>{d.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={section}>
            <div style={sectionTitle}>
              <ThumbsUp size={15} style={{ color: 'var(--green)' }} />{isBn ? 'বিবেচনাধীন' : 'Pending'}
            </div>
            {recommendations.filter(r => r.status === 'pending').length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                {isBn ? 'কোনো সুপারিশ নেই। "সুপারিশ তৈরি করুন" বাটনে ক্লিক করুন।' : 'No pending recommendations. Click "Generate".'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recommendations.filter(r => r.status === 'pending').map(rec => {
                  const teacher = teachers.find(t => t.id === rec.teacherId)
                  const colors: Record<string, string> = { promotion: 'var(--purple)', bonus: 'var(--amber)', increment: 'var(--green)' }
                  const bg: Record<string, string> = { promotion: 'var(--purple-light)', bonus: 'var(--amber-light)', increment: 'var(--green-light)' }
                  const icons: Record<string, any> = { promotion: Award, bonus: Gift, increment: TrendingUp }
                  const IconComp = icons[rec.type]
                  const labels: Record<string, string> = { promotion: isBn ? 'পদোন্নতি' : 'Promotion', bonus: isBn ? 'বোনাস' : 'Bonus', increment: isBn ? 'বৃদ্ধি' : 'Increment' }
                  return (
                    <div key={rec.id} style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: bg[rec.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconComp size={15} style={{ color: colors[rec.type] }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{teacher?.nameEn || rec.teacherId}</span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: bg[rec.type], color: colors[rec.type], fontWeight: 500 }}>{labels[rec.type]}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isBn ? 'স্কোর' : 'Score'}: <strong style={{ color: 'var(--brand)' }}>{rec.score}</strong></span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{rec.reason}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleApproveRecommendation(rec)}
                            style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--green)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} />{isBn ? 'অনুমোদন' : 'Approve'}
                          </button>
                          <button onClick={() => updateRecommendation(rec.id, 'rejected')}
                            style={{ padding: '6px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={13} />{isBn ? 'বাতিল' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {recommendations.filter(r => r.status !== 'pending').length > 0 && (
            <div style={section}>
              <div style={sectionTitle}>
                <AlertCircle size={15} style={{ color: 'var(--text-muted)' }} />{isBn ? 'ইতিহাস' : 'History'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recommendations.filter(r => r.status !== 'pending').map(rec => {
                  const teacher = teachers.find(t => t.id === rec.teacherId)
                  const colors: Record<string, string> = { promotion: 'var(--purple)', bonus: 'var(--amber)', increment: 'var(--green)' }
                  const bg: Record<string, string> = { promotion: 'var(--purple-light)', bonus: 'var(--amber-light)', increment: 'var(--green-light)' }
                  const labels: Record<string, string> = { promotion: isBn ? 'পদোন্নতি' : 'Promotion', bonus: isBn ? 'বোনাস' : 'Bonus', increment: isBn ? 'বৃদ্ধি' : 'Increment' }
                  return (
                    <div key={rec.id} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: bg[rec.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {rec.type === 'promotion' ? <Award size={13} style={{ color: colors[rec.type] }} /> :
                         rec.type === 'bonus' ? <Gift size={13} style={{ color: colors[rec.type] }} /> :
                         <TrendingUp size={13} style={{ color: colors[rec.type] }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{teacher?.nameEn || rec.teacherId}</span>
                        <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '12px', background: bg[rec.type], color: colors[rec.type], fontWeight: 500, marginLeft: '8px' }}>{labels[rec.type]}</span>
                      </div>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: rec.status === 'approved' ? 'var(--green-light)' : 'var(--red-light)', color: rec.status === 'approved' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
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

      {/* ─── INCREMENT ─── */}
      {activeTab === 'increment' && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={sectionTitle}>
              <TrendingUp size={15} style={{ color: 'var(--green)' }} />{isBn ? 'বেতন বৃদ্ধি' : 'Increments'}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setShowPDFModal('increment')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <FileText size={13} />PDF
              </button>
              <button onClick={() => setModalType('increment')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--green)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={14} />{isBn ? 'যোগ' : 'Add'}
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '560px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 8px', width: '36px' }}>
                    <input type="checkbox" checked={selectedInc.length === increments.length && increments.length > 0} onChange={toggleAllInc}
                      style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                  </th>
                  {[isBn ? 'তারিখ' : 'Date', isBn ? 'শিক্ষক' : 'Teacher', isBn ? 'ধরন' : 'Type', isBn ? 'শতাংশ' : '%', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'কারণ' : 'Reason', ''].map(h => (
                    <th key={h || 'action'} style={{ padding: '10px 8px', textAlign: h === '' ? 'center' : 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', width: h === '' ? '80px' : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedIncrements.map(inc => (
                  <tr key={inc.id} style={{ borderBottom: '1px solid var(--border)', background: selectedInc.includes(inc.id) ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                    onMouseEnter={e => { if (!selectedInc.includes(inc.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selectedInc.includes(inc.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '8px 8px' }}>
                      <input type="checkbox" checked={selectedInc.includes(inc.id)} onChange={() => toggleInc(inc.id)}
                        style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                    </td>
                    <td style={{ padding: '8px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>{inc.date}</td>
                    <td style={{ padding: '8px 8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{getTeacherName(inc.teacherId)}</td>
                    <td style={{ padding: '8px 8px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '5px', background: inc.type === 'annual' ? 'var(--green-light)' : inc.type === 'performance' ? 'var(--brand-light)' : 'var(--amber-light)', color: inc.type === 'annual' ? 'var(--green)' : inc.type === 'performance' ? 'var(--brand)' : 'var(--amber)', fontWeight: 500 }}>{inc.type}</span>
                    </td>
                    <td style={{ padding: '8px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>{inc.percentage}%</td>
                    <td style={{ padding: '8px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{inc.amount.toLocaleString()}</td>
                    <td style={{ padding: '8px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{inc.reason}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => { setIncForm({ teacherId: inc.teacherId, type: inc.type, percentage: String(inc.percentage), reason: inc.reason }); setModalType('increment'); }}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => deleteIncrement(inc.id)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--red)', background: 'var(--red-light)', color: 'var(--red)', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {increments.length > perPage && (
            <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, increments.length)} / {increments.length}
              </span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'inherit', outline: 'none', marginRight: '6px' }}>
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic}
                  </button>
                ))}
                {(() => {
                  const start = Math.max(1, Math.min(page - 2, incrementTotalPages - 4))
                  return Array.from({ length: Math.min(5, incrementTotalPages) }, (_, i) => start + i).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`, background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400 }}>
                      {p}
                    </button>
                  ))
                })()}
                {([[<ChevronRight size={12} />, () => setPage(p => Math.min(incrementTotalPages, p + 1)), page === incrementTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(incrementTotalPages), page === incrementTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedInc.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brand)', background: 'var(--brand-light)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
              {selectedInc.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </div>
          )}
        </div>
      )}

      {/* ─── BONUS ─── */}
      {activeTab === 'bonus' && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={sectionTitle}>
              <Gift size={15} style={{ color: 'var(--amber)' }} />{isBn ? 'বোনাস' : 'Bonuses'}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setShowPDFModal('bonus')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <FileText size={13} />PDF
              </button>
              <button onClick={() => setModalType('bonus')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--amber)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={14} />{isBn ? 'যোগ' : 'Add'}
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 8px', width: '36px' }}>
                    <input type="checkbox" checked={selectedBon.length === bonuses.length && bonuses.length > 0} onChange={toggleAllBon}
                      style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                  </th>
                  {[isBn ? 'মাস' : 'Month', isBn ? 'শিক্ষক' : 'Teacher', isBn ? 'ধরন' : 'Type', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'কারণ' : 'Reason'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedBonuses.map(bon => (
                  <tr key={bon.id} style={{ borderBottom: '1px solid var(--border)', background: selectedBon.includes(bon.id) ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                    onMouseEnter={e => { if (!selectedBon.includes(bon.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selectedBon.includes(bon.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '8px 8px' }}>
                      <input type="checkbox" checked={selectedBon.includes(bon.id)} onChange={() => toggleBon(bon.id)}
                        style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                    </td>
                    <td style={{ padding: '8px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>{bon.month}</td>
                    <td style={{ padding: '8px 8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{getTeacherName(bon.teacherId)}</td>
                    <td style={{ padding: '8px 8px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '5px', background: bon.type === 'festival' ? 'var(--amber-light)' : bon.type === 'performance' ? 'var(--brand-light)' : bon.type === 'attendance' ? 'var(--green-light)' : 'var(--teal-light)', color: bon.type === 'festival' ? 'var(--amber)' : bon.type === 'performance' ? 'var(--brand)' : bon.type === 'attendance' ? 'var(--green)' : 'var(--teal)', fontWeight: 500 }}>{bon.type}</span>
                    </td>
                    <td style={{ padding: '8px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{bon.amount.toLocaleString()}</td>
                    <td style={{ padding: '8px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{bon.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bonuses.length > perPage && (
            <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, bonuses.length)} / {bonuses.length}
              </span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'inherit', outline: 'none', marginRight: '6px' }}>
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic}
                  </button>
                ))}
                {(() => {
                  const start = Math.max(1, Math.min(page - 2, bonusTotalPages - 4))
                  return Array.from({ length: Math.min(5, bonusTotalPages) }, (_, i) => start + i).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`, background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400 }}>
                      {p}
                    </button>
                  ))
                })()}
                {([[<ChevronRight size={12} />, () => setPage(p => Math.min(bonusTotalPages, p + 1)), page === bonusTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(bonusTotalPages), page === bonusTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedBon.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brand)', background: 'var(--brand-light)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
              {selectedBon.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </div>
          )}
        </div>
      )}

      {/* ─── PROMOTION ─── */}
      {activeTab === 'promotion' && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={sectionTitle}>
              <Award size={15} style={{ color: 'var(--purple)' }} />{isBn ? 'পদোন্নতি' : 'Promotions'}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setShowPDFModal('promotion')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <FileText size={13} />PDF
              </button>
              <button onClick={() => setModalType('promotion')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--purple)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={14} />{isBn ? 'যোগ' : 'Add'}
              </button>
            </div>
          </div>
          {promotions.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>{isBn ? 'কোনো পদোন্নতি নেই' : 'No promotions yet'}</div>
          ) : (
            <>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedPro.length === promotions.length} onChange={toggleAllPro}
                    style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                  {isBn ? 'সব নির্বাচন করুন' : 'Select all'}
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {paginatedPromotions.map(p => (
                  <div key={p.id} style={{ padding: '12px', borderRadius: '10px', background: selectedPro.includes(p.id) ? 'rgba(99,102,241,0.04)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.1s' }}
                    onClick={() => togglePro(p.id)}>
                    <input type="checkbox" checked={selectedPro.includes(p.id)} onChange={() => togglePro(p.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)', flexShrink: 0 }} />
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award size={16} style={{ color: 'var(--purple)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{getTeacherName(p.teacherId)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span>{p.fromDesignation}</span>
                        <ChevronRight size={14} style={{ color: 'var(--green)' }} />
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>{p.toDesignation}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.date}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{p.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
              {promotions.length > perPage && (
                <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {(page - 1) * perPage + 1}–{Math.min(page * perPage, promotions.length)} / {promotions.length}
                  </span>
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                      style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'inherit', outline: 'none', marginRight: '6px' }}>
                      <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                    </select>
                    {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                      <button key={i} onClick={a} disabled={d}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ic}
                      </button>
                    ))}
                    {(() => {
                      const start = Math.max(1, Math.min(page - 2, promotionTotalPages - 4))
                      return Array.from({ length: Math.min(5, promotionTotalPages) }, (_, i) => start + i).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                          style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`, background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400 }}>
                          {p}
                        </button>
                      ))
                    })()}
                    {([[<ChevronRight size={12} />, () => setPage(p => Math.min(promotionTotalPages, p + 1)), page === promotionTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(promotionTotalPages), page === promotionTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                      <button key={i} onClick={a} disabled={d}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedPro.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brand)', background: 'var(--brand-light)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                  {selectedPro.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── FUND ─── */}
      {activeTab === 'fund' && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={sectionTitle}>
              <HandCoins size={15} style={{ color: 'var(--brand)' }} />{isBn ? 'তহবিল' : 'Fund'}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setShowPDFModal('fund')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <FileText size={13} />PDF
              </button>
              <button onClick={() => setModalType('fund')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={14} />{isBn ? 'লেনদেন' : 'Transaction'}
              </button>
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: '10px', background: fundBalance >= 0 ? 'var(--green-light)' : 'var(--red-light)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: fundBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>{isBn ? 'তহবিল ব্যালেন্স' : 'Fund Balance'}</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: fundBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>৳{fundBalance.toLocaleString()}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 8px', width: '36px' }}>
                    <input type="checkbox" checked={selectedFund.length === funds.length && funds.length > 0} onChange={toggleAllFund}
                      style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                  </th>
                  {[isBn ? 'তারিখ' : 'Date', isBn ? 'ধরন' : 'Type', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'বিবরণ' : 'Description'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedFunds.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)', background: selectedFund.includes(f.id) ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                    onMouseEnter={e => { if (!selectedFund.includes(f.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selectedFund.includes(f.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '8px 8px' }}>
                      <input type="checkbox" checked={selectedFund.includes(f.id)} onChange={() => toggleFund(f.id)}
                        style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                    </td>
                    <td style={{ padding: '8px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>{f.date}</td>
                    <td style={{ padding: '8px 8px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '5px', background: f.type === 'withdrawal' ? 'var(--red-light)' : 'var(--green-light)', color: f.type === 'withdrawal' ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>{f.type.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '8px 8px', fontSize: '12px', fontWeight: 600, color: f.type === 'withdrawal' ? 'var(--red)' : 'var(--green)' }}>
                      {f.type === 'withdrawal' ? '-' : '+'}৳{f.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {funds.length > perPage && (
            <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, funds.length)} / {funds.length}
              </span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'inherit', outline: 'none', marginRight: '6px' }}>
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic}
                  </button>
                ))}
                {(() => {
                  const start = Math.max(1, Math.min(page - 2, fundTotalPages - 4))
                  return Array.from({ length: Math.min(5, fundTotalPages) }, (_, i) => start + i).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`, background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400 }}>
                      {p}
                    </button>
                  ))
                })()}
                {([[<ChevronRight size={12} />, () => setPage(p => Math.min(fundTotalPages, p + 1)), page === fundTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(fundTotalPages), page === fundTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedFund.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brand)', background: 'var(--brand-light)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
              {selectedFund.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </div>
          )}
        </div>
      )}

      {/* ─── SALARY SETUP ─── */}
      {activeTab === 'salary-setup' && (
        <div style={section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={sectionTitle}>
              <Calculator size={15} style={{ color: 'var(--teal)' }} />{isBn ? 'মাসিক বেতন সেটআপ' : 'Monthly Salary Setup'}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="month" value={salarySetupMonth} onChange={e => setSalarySetupMonth(e.target.value)}
                style={{ ...input, width: 'auto', padding: '6px 10px', fontSize: '12px' }} />
              <button onClick={() => {
                const configs: MonthlySalaryConfig[] = activeTeachers.map(t => {
                  const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
                  const local = salaryConfigs[t.id]
                  return {
                    id: existing?.id || `MSC-${Date.now()}-${t.id}`,
                    month: salarySetupMonth,
                    teacherId: t.id,
                    bonus: local?.bonus ?? existing?.bonus ?? 0,
                    festivalBonus: local?.festivalBonus ?? existing?.festivalBonus ?? 0,
                    applyDeductionRule: local?.applyDeductionRule ?? existing?.applyDeductionRule ?? false,
                    fundContributionPercent: local?.fundContributionPercent ?? existing?.fundContributionPercent ?? 0,
                    createdAt: new Date().toISOString(),
                  }
                })
                upsertManyMonthlySalaryConfigs(configs)
                setSalarySaved(true)
                setTimeout(() => setSalarySaved(false), 2500)
              }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', borderRadius: '8px', background: 'var(--teal)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
              <button onClick={() => setShowPDFModal('salary')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Download size={14} />PDF
              </button>
            </div>
          </div>

          {salarySaved && (
            <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--green-light)', color: 'var(--green)', fontSize: '12px', fontWeight: 500 }}>
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              {isBn ? 'বেতন সেটআপ সংরক্ষিত হয়েছে!' : 'Salary setup saved!'}
            </div>
          )}

          {/* Bulk Salary Setup Section */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <Calculator size={11} style={{ color: 'var(--teal)' }} />{isBn ? 'বাল্ক সেটআপ' : 'Bulk Setup'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={bulkDeductionEnabled} onChange={e => setBulkDeductionEnabled(e.target.checked)}
                  style={{ width: '11px', height: '11px', cursor: 'pointer', accentColor: 'var(--red)' }} />
                <TrendingDown size={10} style={{ color: 'var(--red)' }} />
                {isBn ? 'কাটা' : 'Deduction'}
              </label>
              {bulkDeductionEnabled && (
                <>
                  <input type="date" value={bulkDeductionFrom} onChange={e => setBulkDeductionFrom(e.target.value)}
                    style={{ padding: '3px 5px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '10px', fontFamily: 'inherit', outline: 'none', width: '110px' }} />
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>-</span>
                  <input type="date" value={bulkDeductionTo} onChange={e => setBulkDeductionTo(e.target.value)}
                    style={{ padding: '3px 5px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '10px', fontFamily: 'inherit', outline: 'none', width: '110px' }} />
                </>
              )}
              <button onClick={handleBulkApplyDeduction}
                style={{ padding: '3px 8px', borderRadius: '4px', background: bulkDeductionEnabled ? 'var(--red)' : 'var(--border)', border: 'none', color: bulkDeductionEnabled ? '#fff' : 'var(--text-muted)', fontSize: '9px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {isBn ? 'প্রয়োগ' : 'Apply'}
              </button>
            </div>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={bulkFundEnabled} onChange={e => setBulkFundEnabled(e.target.checked)}
                  style={{ width: '11px', height: '11px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                <HandCoins size={10} style={{ color: 'var(--brand)' }} />
                {isBn ? 'তহবিল' : 'Fund'}
              </label>
              {bulkFundEnabled && (
                <input type="number" value={bulkFundPercent} onChange={e => setBulkFundPercent(e.target.value)}
                  style={{ padding: '3px 5px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '10px', fontFamily: 'inherit', outline: 'none', width: '45px', textAlign: 'right' }}
                  placeholder="%" min={0} max={100} />
              )}
              {bulkFundEnabled && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>%</span>}
              <button onClick={handleBulkApplyFund}
                style={{ padding: '3px 8px', borderRadius: '4px', background: bulkFundEnabled ? 'var(--brand)' : 'var(--border)', border: 'none', color: bulkFundEnabled ? '#fff' : 'var(--text-muted)', fontSize: '9px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {isBn ? 'প্রয়োগ' : 'Apply'}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '36px' }}>
                    <input type="checkbox" checked={selectedSalary.length === activeTeachers.length && activeTeachers.length > 0}
                      onChange={toggleAllSalary}
                      style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                  </th>
                  <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'কর্মচারী' : 'Employee'}</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'মূল বেতন' : 'Basic'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'কর্মদক্ষতা' : 'Perf.'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'উপস্থিতি' : 'Atten.'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'বিশেষ' : 'Special'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'উৎসব' : 'Festival'}</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'মোট বোনাস' : 'Total B.'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', fontSize: '9px', fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'কাটা' : 'Ded.'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'তহবিল' : 'Fund'}</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{isBn ? 'নেট বেতন' : 'Net Pay'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActiveTeachers.map(t => {
                  const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
                  const local = salaryConfigs[t.id] || {}
                  const applyDeduction = local.applyDeductionRule ?? existing?.applyDeductionRule ?? false
                  const fundPercent = local.fundContributionPercent ?? existing?.fundContributionPercent ?? 0
                  const teacherBonuses = bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth)
                  const perfBonus = teacherBonuses.filter(b => b.type === 'performance').reduce((sum, b) => sum + b.amount, 0)
                  const attenBonus = teacherBonuses.filter(b => b.type === 'attendance').reduce((sum, b) => sum + b.amount, 0)
                  const specialBonus = teacherBonuses.filter(b => b.type === 'special').reduce((sum, b) => sum + b.amount, 0)
                  const festivalBonus = teacherBonuses.filter(b => b.type === 'festival').reduce((sum, b) => sum + b.amount, 0)
                  const totalBonus = perfBonus + attenBonus + specialBonus + festivalBonus
                  const daysInMonth = 30
                  const dailySalary = Math.round(t.salary / daysInMonth)
                  const deductionAmount = applyDeduction ? dailySalary : 0
                  const fundAmount = Math.round(t.salary * fundPercent / 100)
                  const netPay = t.salary + totalBonus - deductionAmount - fundAmount

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedSalary.includes(t.id)}
                          onChange={() => toggleSalary(t.id)}
                          style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                      </td>
                      <td style={{ padding: '7px 8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.nameEn}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t.designation}</div>
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>৳{t.salary.toLocaleString()}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 500, color: perfBonus > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                        {perfBonus > 0 ? `৳${perfBonus.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 500, color: attenBonus > 0 ? 'var(--teal)' : 'var(--text-muted)' }}>
                        {attenBonus > 0 ? `৳${attenBonus.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 500, color: specialBonus > 0 ? 'var(--purple)' : 'var(--text-muted)' }}>
                        {specialBonus > 0 ? `৳${specialBonus.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 500, color: festivalBonus > 0 ? 'var(--amber)' : 'var(--text-muted)' }}>
                        {festivalBonus > 0 ? `৳${festivalBonus.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: totalBonus > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                        {totalBonus > 0 ? `৳${totalBonus.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                        <input type="checkbox" checked={applyDeduction} onChange={e => setSalaryConfigs(p => ({ ...p, [t.id]: { ...p[t.id], applyDeductionRule: e.target.checked, bonus: p[t.id]?.bonus ?? 0, festivalBonus: p[t.id]?.festivalBonus ?? 0, fundContributionPercent: p[t.id]?.fundContributionPercent ?? 0 } }))}
                          style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                      </td>
                      <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 500, color: fundAmount > 0 ? 'var(--brand)' : 'var(--text-muted)' }}>
                        {fundPercent > 0 ? `${fundPercent}%` : '-'}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'var(--green)' }}>
                        ৳{netPay.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px' }}></td>
                  <td style={{ padding: '8px 8px', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{isBn ? 'মোট' : 'Total'}</td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 700 }}>৳{activeTeachers.reduce((s, t) => s + t.salary, 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--green)' }}>৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'performance').reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--teal)' }}>৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'attendance').reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--purple)' }}>৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'special').reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--amber)' }}>৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'festival').reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'var(--green)' }}>৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth).reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--red)' }}>৳{activeTeachers.reduce((s, t) => {
                    const local = salaryConfigs[t.id]
                    const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
                    const ded = (local?.applyDeductionRule ?? existing?.applyDeductionRule ?? false) ? Math.round(t.salary / 30) : 0
                    return s + ded
                  }, 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: 'var(--brand)' }}>৳{activeTeachers.reduce((s, t) => {
                    const local = salaryConfigs[t.id]
                    const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
                    const fund = Math.round(t.salary * (local?.fundContributionPercent ?? existing?.fundContributionPercent ?? 0) / 100)
                    return s + fund
                  }, 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>
                    ৳{activeTeachers.reduce((s, t) => {
                      const local = salaryConfigs[t.id]
                      const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
                      const teacherBonuses = bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth)
                      const totalBon = teacherBonuses.reduce((sum, b) => sum + b.amount, 0)
                      const ded = (local?.applyDeductionRule ?? existing?.applyDeductionRule ?? false) ? Math.round(t.salary / 30) : 0
                      const fund = Math.round(t.salary * (local?.fundContributionPercent ?? existing?.fundContributionPercent ?? 0) / 100)
                      return s + t.salary + totalBon - ded - fund
                    }, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {activeTeachers.length > perPage && (
            <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, activeTeachers.length)} / {activeTeachers.length}
              </span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'inherit', outline: 'none', marginRight: '6px' }}>
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic}
                  </button>
                ))}
                {(() => {
                  const start = Math.max(1, Math.min(page - 2, salaryTotalPages - 4))
                  return Array.from({ length: Math.min(5, salaryTotalPages) }, (_, i) => start + i).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`, background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400 }}>
                      {p}
                    </button>
                  ))
                })()}
                {([[<ChevronRight size={12} />, () => setPage(p => Math.min(salaryTotalPages, p + 1)), page === salaryTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(salaryTotalPages), page === salaryTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedSalary.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brand)', background: 'var(--brand-light)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
              {selectedSalary.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </div>
          )}
        </div>
      )}

      {/* ─── FACILITIES ─── */}
      {activeTab === 'facilities' && (
        <>
          {/* Facility Definitions */}
          <div style={section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={sectionTitle}>
                <Briefcase size={15} style={{ color: 'var(--purple)' }} />{isBn ? 'সুবিধার ধরন' : 'Facility Types'}
              </div>
              <button onClick={() => { setFacForm({ name: '', nameBn: '', defaultAmount: '', type: 'monthly' }); setEditFac(null); setFacModalType('add-facility') }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--purple-light)', border: '1px solid var(--purple)', color: 'var(--purple)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={14} />{isBn ? 'নতুন সুবিধা' : 'Add Facility'}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    {[
                      { l: '#', w: '50px', align: 'center' as const },
                      { l: isBn ? 'নাম (ইংরেজি)' : 'Name (EN)', align: 'left' as const },
                      { l: isBn ? 'নাম (বাংলা)' : 'Name (BN)', align: 'left' as const },
                      { l: isBn ? 'ধরন' : 'Type', w: '90px', align: 'center' as const },
                      { l: isBn ? 'ডিফল্ট পরিমাণ' : 'Default Amount', w: '120px', align: 'right' as const },
                      { l: isBn ? 'অবস্থা' : 'Status', w: '80px', align: 'center' as const },
                      { l: isBn ? 'অ্যাকশন' : 'Action', w: '90px', align: 'center' as const },
                    ].map(h => (
                      <th key={h.l} style={{ padding: '10px 8px', textAlign: h.align, fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h.l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facilities.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Briefcase size={24} style={{ display: 'block', margin: '0 auto 6px', opacity: 0.3 }} />
                      {isBn ? 'কোনো সুবিধা পাওয়া যায়নি' : 'No facilities found'}
                    </td></tr>
                  ) : facilities.map((f, i) => (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Briefcase size={13} style={{ color: 'var(--purple)' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{f.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>{f.nameBn || '—'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: f.type === 'monthly' ? 'var(--brand-light)' : 'var(--amber-light)', color: f.type === 'monthly' ? 'var(--brand)' : 'var(--amber)' }}>
                          {f.type === 'monthly' ? (isBn ? 'মাসিক' : 'Monthly') : (isBn ? 'এককালীন' : 'One-time')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>৳{f.defaultAmount.toLocaleString()}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 500, background: f.isActive ? 'var(--green-light)' : 'var(--red-light)', color: f.isActive ? 'var(--green)' : 'var(--red)' }}>
                          {f.isActive ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button onClick={() => { setFacForm({ name: f.name, nameBn: f.nameBn, defaultAmount: String(f.defaultAmount), type: f.type }); setEditFac(f); setFacModalType('edit-facility') }}
                            title={isBn ? 'এডিট' : 'Edit'}
                            style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'var(--amber-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)' }}>
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => setFacDeleteConfirm(f.id)}
                            title={isBn ? 'মুছুন' : 'Delete'}
                            style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'var(--red-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staff Facility Panel — select staff and manage all their facilities */}
          <div style={section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={sectionTitle}>
                <Users size={15} style={{ color: 'var(--brand)' }} />{isBn ? 'কর্মচারী সুবিধা প্যানেল' : 'Staff Facility Panel'}
              </div>
            </div>

            {/* Staff selector + filters */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>{isBn ? 'কর্মচারী নির্বাচন' : 'Select Staff'}</label>
                <select value={selectedFacStaff} onChange={e => setSelectedFacStaff(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', appearance: 'auto' }}>
                  <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select staff...'}</option>
                  {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn} ({t.designation})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>{isBn ? 'বিভাগ' : 'Department'}</label>
                <select value={facStaffFilter} onChange={e => setFacStaffFilter(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', appearance: 'auto' }}>
                  <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{isBn ? d.nameBn : d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>{isBn ? 'অনুসন্ধান' : 'Search'}</label>
                <input value={facStaffSearch} onChange={e => setFacStaffSearch(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  placeholder={isBn ? 'নাম, আইডি...' : 'Name, ID...'} />
              </div>
            </div>

            {/* Facility checklist for selected staff */}
            {selectedFacStaff && (
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {teachers.find(t => t.id === selectedFacStaff)?.nameEn || ''}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {isBn ? 'সুবিধা চেক করুন এবং পরিমাণ সেট করুন' : 'Check facilities and set amounts'}
                    </div>
                  </div>
                  <button onClick={handleSaveStaffFacilities}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Save size={13} />{isBn ? 'সংরক্ষণ' : 'Save'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                  {selectedStaffFacilities.map(sf => (
                    <div key={sf.facility.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: 'var(--bg-primary)', border: `1px solid ${sf.assigned ? 'var(--brand)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={sf.assigned} onChange={() => toggleStaffFacility(sf.facility.id)}
                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: 'var(--brand)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{isBn ? sf.facility.nameBn : sf.facility.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sf.facility.name}</div>
                      </div>
                      {sf.assigned && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>৳</span>
                          <input type="number" value={sf.amount} onChange={e => updateStaffFacilityAmount(sf.facility.id, Number(e.target.value) || 0)}
                            style={{ ...input, width: '70px', padding: '4px 6px', fontSize: '11px', textAlign: 'right' }}
                            placeholder="0" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isBn ? 'মোট সুবিধা' : 'Total Facilities'}: {selectedStaffFacilities.filter(sf => sf.assigned).length} / {facilities.length}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>
                    ৳{selectedStaffFacilities.filter(sf => sf.assigned).reduce((s, sf) => s + sf.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {!selectedFacStaff && (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                <Users size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                {isBn ? 'একজন কর্মচারী নির্বাচন করুন তার সুবিধা দেখতে' : 'Select a staff member to manage their facilities'}
              </div>
            )}
          </div>

          {/* All Assignments Summary */}
          <div style={section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={sectionTitle}>
                <HandCoins size={15} style={{ color: 'var(--teal)' }} />{isBn ? 'সকল বরাদ্দ' : 'All Assignments'}
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>({filteredAssignments.length})</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="date" value={assignDateFrom} onChange={e => { setAssignDateFrom(e.target.value); setPage(1) }}
                  style={{ ...input, width: 'auto', padding: '5px 8px', fontSize: '11px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                <input type="date" value={assignDateTo} onChange={e => { setAssignDateTo(e.target.value); setPage(1) }}
                  style={{ ...input, width: 'auto', padding: '5px 8px', fontSize: '11px' }} />
                {selectedAssign.length > 0 && (
                  <button onClick={() => setShowPDFModal('assignment')}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '8px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <FileText size={12} />PDF ({selectedAssign.length})
                  </button>
                )}
              </div>
            </div>

            {filteredAssignments.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                {isBn ? 'কোনো বরাদ্দ নেই' : 'No assignments yet'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '550px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px', width: '36px' }}>
                        <input type="checkbox" checked={selectedAssign.length === filteredAssignments.length && filteredAssignments.length > 0} onChange={() => setSelectedAssign(p => p.length === filteredAssignments.length ? [] : filteredAssignments.map(tf => tf.id))}
                          style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                      </th>
                      {[
                        { l: '#', w: '40px', align: 'center' as const },
                        { l: isBn ? 'কর্মচারী' : 'Employee', align: 'left' as const },
                        { l: isBn ? 'সুবিধা' : 'Facility', align: 'left' as const },
                        { l: isBn ? 'পরিমাণ' : 'Amount', w: '100px', align: 'right' as const },
                        { l: '', w: '60px', align: 'center' as const },
                      ].map(h => (
                        <th key={h.l} style={{ padding: '8px', textAlign: h.align, fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h.l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssignments.map((tf, i) => {
                      const t = teachers.find(tx => tx.id === tf.teacherId)
                      const fac = facilities.find(f => f.id === tf.facilityId)
                      const isSelected = selectedAssign.includes(tf.id)
                      return (
                        <tr key={tf.id} style={{ borderBottom: '0.5px solid var(--border)', background: isSelected ? 'var(--brand-light)' : 'transparent' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                          <td style={{ padding: '8px' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleAssign(tf.id)}
                              style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                          </td>
                          <td style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ padding: '8px', fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' }}>{t?.nameEn || tf.teacherId}</td>
                          <td style={{ padding: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{isBn ? (fac?.nameBn || fac?.name) : fac?.name}</td>
                          <td style={{ padding: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--green)', textAlign: 'right' }}>৳{tf.amount.toLocaleString()}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button onClick={() => setAssignDeleteConfirm(tf.id)} title={isBn ? 'মুছুন' : 'Delete'}
                              style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'var(--red-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                              <Trash2 size={10} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                      <td colSpan={4} style={{ padding: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{isBn ? 'মোট' : 'Total'}</td>
                      <td style={{ padding: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--green)', textAlign: 'right' }}>৳{filteredAssignments.reduce((sum, tf) => sum + tf.amount, 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {filteredAssignments.length > perPage && (
              <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredAssignments.length)} / {filteredAssignments.length}
                </span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                    style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'inherit', outline: 'none', marginRight: '6px' }}>
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                  {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ic}
                    </button>
                  ))}
                  {(() => {
                    const start = Math.max(1, Math.min(page - 2, assignmentTotalPages - 4))
                    return Array.from({ length: Math.min(5, assignmentTotalPages) }, (_, i) => start + i).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`, background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400 }}>
                        {p}
                      </button>
                    ))
                  })()}
                  {([[<ChevronRight size={12} />, () => setPage(p => Math.min(assignmentTotalPages, p + 1)), page === assignmentTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(assignmentTotalPages), page === assignmentTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedAssign.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brand)', background: 'var(--brand-light)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                {selectedAssign.length} {isBn ? 'নির্বাচিত' : 'selected'}
              </div>
            )}
          </div>

          {/* Bonus Management */}
          <div style={section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={sectionTitle}>
                <Gift size={15} style={{ color: 'var(--amber)' }} />{isBn ? 'বোনাস ব্যবস্থাপনা' : 'Bonus Management'}
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>({filteredBonuses.length})</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="date" value={bonusDateFrom} onChange={e => { setBonusDateFrom(e.target.value); setPage(1) }}
                  style={{ ...input, width: 'auto', padding: '5px 8px', fontSize: '11px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                <input type="date" value={bonusDateTo} onChange={e => { setBonusDateTo(e.target.value); setPage(1) }}
                  style={{ ...input, width: 'auto', padding: '5px 8px', fontSize: '11px' }} />
                {selectedBon.length > 0 && (
                  <button onClick={() => setShowPDFModal('bonus')}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '8px', background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <FileText size={12} />PDF ({selectedBon.length})
                  </button>
                )}
                <button onClick={() => setModalType('bonus')}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--amber)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Plus size={14} />{isBn ? 'বোনাস যোগ' : 'Add Bonus'}
                </button>
              </div>
            </div>

            {filteredBonuses.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                {isBn ? 'কোনো বোনাস নেই' : 'No bonuses yet'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '620px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px', width: '36px' }}>
                        <input type="checkbox" checked={selectedBon.length === filteredBonuses.length && filteredBonuses.length > 0} onChange={toggleAllBon}
                          style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                      </th>
                      {[
                        { l: '#', w: '40px', align: 'center' as const },
                        { l: isBn ? 'মাস' : 'Month', align: 'left' as const },
                        { l: isBn ? 'কর্মচারী' : 'Employee', align: 'left' as const },
                        { l: isBn ? 'ধরন' : 'Type', align: 'left' as const },
                        { l: isBn ? 'পরিমাণ' : 'Amount', w: '100px', align: 'right' as const },
                        { l: isBn ? 'কারণ' : 'Reason', align: 'left' as const },
                        { l: '', w: '80px', align: 'center' as const },
                      ].map(h => (
                        <th key={h.l || 'action'} style={{ padding: '8px', textAlign: h.align, fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', width: h.w }}>{h.l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFacBonuses.map((bon, i) => {
                      const isSelected = selectedBon.includes(bon.id)
                      return (
                        <tr key={bon.id} style={{ borderBottom: '1px solid var(--border)', background: isSelected ? 'var(--brand-light)' : 'transparent' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                          <td style={{ padding: '8px' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleBon(bon.id)}
                              style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                          </td>
                          <td style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>{bon.month}</td>
                          <td style={{ padding: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{getTeacherName(bon.teacherId)}</td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '5px', background: bon.type === 'festival' ? 'var(--amber-light)' : bon.type === 'performance' ? 'var(--brand-light)' : bon.type === 'attendance' ? 'var(--green-light)' : 'var(--teal-light)', color: bon.type === 'festival' ? 'var(--amber)' : bon.type === 'performance' ? 'var(--brand)' : bon.type === 'attendance' ? 'var(--green)' : 'var(--teal)', fontWeight: 500 }}>{bon.type}</span>
                          </td>
                          <td style={{ padding: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>৳{bon.amount.toLocaleString()}</td>
                          <td style={{ padding: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{bon.reason}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button onClick={() => { setBonForm({ teacherId: bon.teacherId, type: bon.type, amount: String(bon.amount), reason: bon.reason, month: bon.month }); setModalType('bonus'); }}
                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>
                                <Edit2 size={11} />
                              </button>
                              <button onClick={() => deleteBonus(bon.id)}
                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--red)', background: 'var(--red-light)', color: 'var(--red)', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                      <td colSpan={5} style={{ padding: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{isBn ? 'মোট' : 'Total'}</td>
                      <td style={{ padding: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--amber)', textAlign: 'right' }}>৳{filteredBonuses.reduce((s, b) => s + b.amount, 0).toLocaleString()}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {filteredBonuses.length > perPage && (
              <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredBonuses.length)} / {filteredBonuses.length}
                </span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                    style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'inherit', outline: 'none', marginRight: '6px' }}>
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                  {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ic}
                    </button>
                  ))}
                  {(() => {
                    const start = Math.max(1, Math.min(page - 2, facBonusTotalPages - 4))
                    return Array.from({ length: Math.min(5, facBonusTotalPages) }, (_, i) => start + i).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`, background: p === page ? 'var(--brand)' : 'var(--bg-primary)', color: p === page ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: p === page ? 600 : 400 }}>
                        {p}
                      </button>
                    ))
                  })()}
                  {([[<ChevronRight size={12} />, () => setPage(p => Math.min(facBonusTotalPages, p + 1)), page === facBonusTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(facBonusTotalPages), page === facBonusTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: d ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedBon.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brand)', background: 'var(--brand-light)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                {selectedBon.length} {isBn ? 'নির্বাচিত' : 'selected'}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── MODAL ─── */}
      {modalType && (
        <div style={modalOverlay} onClick={() => setModalType(null)}>
          <div className="modal-content" style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {modalType === 'increment' && (isBn ? 'বেতন বৃদ্ধি যোগ' : 'Add Increment')}
                {modalType === 'bonus' && (isBn ? 'বোনাস যোগ' : 'Add Bonus')}
                {modalType === 'promotion' && (isBn ? 'পদোন্নতি যোগ' : 'Add Promotion')}
                {modalType === 'fund' && (isBn ? 'লেনদেন যোগ' : 'Add Transaction')}
              </h2>
              <button onClick={() => setModalType(null)}
                style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            {modalType === 'increment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><label style={label}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select value={incForm.teacherId} onChange={e => setIncForm(p => ({ ...p, teacherId: e.target.value }))} style={input}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                  </select>
                </div>
                <div><label style={label}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select value={incForm.type} onChange={e => setIncForm(p => ({ ...p, type: e.target.value as any }))} style={input}>
                    <option value="annual">{isBn ? 'বার্ষিক' : 'Annual'}</option>
                    <option value="performance">{isBn ? 'কর্মদক্ষতা' : 'Performance'}</option>
                    <option value="special">{isBn ? 'বিশেষ' : 'Special'}</option>
                  </select>
                </div>
                <div><label style={label}>{isBn ? 'শতাংশ' : 'Percentage (%)'}</label>
                  <input type="number" value={incForm.percentage} onChange={e => setIncForm(p => ({ ...p, percentage: e.target.value }))} style={input} placeholder="5" />
                </div>
                <div><label style={label}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input value={incForm.reason} onChange={e => setIncForm(p => ({ ...p, reason: e.target.value }))} style={input} />
                </div>
                <button onClick={handleAddIncrement}
                  style={{ padding: '9px', borderRadius: '8px', background: 'var(--green)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'bonus' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><label style={label}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select value={bonForm.teacherId} onChange={e => setBonForm(p => ({ ...p, teacherId: e.target.value }))} style={input}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                  </select>
                </div>
                <div><label style={label}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select value={bonForm.type} onChange={e => setBonForm(p => ({ ...p, type: e.target.value as any }))} style={input}>
                    <option value="festival">{isBn ? 'উৎসব' : 'Festival'}</option>
                    <option value="performance">{isBn ? 'কর্মদক্ষতা' : 'Performance'}</option>
                    <option value="attendance">{isBn ? 'উপস্থিতি' : 'Attendance'}</option>
                    <option value="special">{isBn ? 'বিশেষ' : 'Special'}</option>
                  </select>
                </div>
                <div><label style={label}>{isBn ? 'পরিমাণ' : 'Amount (৳)'}</label>
                  <input type="number" value={bonForm.amount} onChange={e => setBonForm(p => ({ ...p, amount: e.target.value }))} style={input} placeholder="5000" />
                </div>
                <div><label style={label}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input value={bonForm.reason} onChange={e => setBonForm(p => ({ ...p, reason: e.target.value }))} style={input} />
                </div>
                <button onClick={handleAddBonus}
                  style={{ padding: '9px', borderRadius: '8px', background: 'var(--amber)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'promotion' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><label style={label}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select value={proForm.teacherId} onChange={e => { const t = activeTeachers.find(tx => tx.id === e.target.value); setProForm(p => ({ ...p, teacherId: e.target.value, fromDesignation: t?.designation || '' })) }} style={input}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn} ({t.designation})</option>)}
                  </select>
                </div>
                <div><label style={label}>{isBn ? 'বর্তমান পদবি' : 'From'}</label>
                  <select value={proForm.fromDesignation} onChange={e => setProForm(p => ({ ...p, fromDesignation: e.target.value }))} style={input}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {allDesignations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={label}>{isBn ? 'নতুন পদবি' : 'To'}</label>
                  <select value={proForm.toDesignation} onChange={e => setProForm(p => ({ ...p, toDesignation: e.target.value }))} style={input}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {allDesignations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={label}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input value={proForm.reason} onChange={e => setProForm(p => ({ ...p, reason: e.target.value }))} style={input} />
                </div>
                <button onClick={handleAddPromotion}
                  style={{ padding: '9px', borderRadius: '8px', background: 'var(--purple)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'fund' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><label style={label}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select value={fundForm.type} onChange={e => setFundForm(p => ({ ...p, type: e.target.value as any }))} style={input}>
                    <option value="contribution">{isBn ? 'অনুদান' : 'Contribution'}</option>
                    <option value="bonus_pool">{isBn ? 'বোনাস পুল' : 'Bonus Pool'}</option>
                    <option value="increment_pool">{isBn ? 'বৃদ্ধি পুল' : 'Increment Pool'}</option>
                    <option value="withdrawal">{isBn ? 'উত্তোলন' : 'Withdrawal'}</option>
                  </select>
                </div>
                <div><label style={label}>{isBn ? 'পরিমাণ' : 'Amount (৳)'}</label>
                  <input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} style={input} placeholder="10000" />
                </div>
                <div><label style={label}>{isBn ? 'বিবরণ' : 'Description'}</label>
                  <input value={fundForm.description} onChange={e => setFundForm(p => ({ ...p, description: e.target.value }))} style={input} />
                </div>
                <button onClick={handleAddFund}
                  style={{ padding: '9px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PDF MODAL ─── */}
      {showPDFModal && (
        <HRPDFOptionsModal
          type={showPDFModal}
          count={
            showPDFModal === 'increment' ? increments.length :
            showPDFModal === 'bonus' ? filteredBonuses.length :
            showPDFModal === 'promotion' ? promotions.length :
            showPDFModal === 'assignment' ? filteredAssignments.length :
            showPDFModal === 'salary' ? activeTeachers.length :
            funds.length
          }
          isBn={isBn}
          onClose={() => setShowPDFModal(null)}
          onDownload={(opts) => handlePDFDownload(showPDFModal, opts)}
        />
      )}

      {/* ─── FACILITY MODALS ─── */}
      {(facModalType === 'add-facility' || facModalType === 'edit-facility') && (
        <div style={modalOverlay} onClick={() => { setFacModalType(null); setEditFac(null) }}>
          <div className="modal-content" style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {facModalType === 'add-facility' ? (isBn ? 'নতুন সুবিধা যোগ' : 'Add Facility') : (isBn ? 'সুবিধা এডিট করুন' : 'Edit Facility')}
              </h2>
              <button onClick={() => { setFacModalType(null); setEditFac(null) }}
                style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={label}>{isBn ? 'নাম (ইংরেজি) *' : 'Name (English) *'}</label>
                <input value={facForm.name} onChange={e => setFacForm(p => ({ ...p, name: e.target.value }))} style={input} placeholder={isBn ? 'সুবিধার নাম' : 'Facility name'} />
              </div>
              <div><label style={label}>{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
                <input value={facForm.nameBn} onChange={e => setFacForm(p => ({ ...p, nameBn: e.target.value }))} style={input} placeholder={isBn ? 'বাংলায় নাম' : 'Bangla name'} />
              </div>
              <div><label style={label}>{isBn ? 'ডিফল্ট পরিমাণ (৳)' : 'Default Amount (৳)'}</label>
                <input type="number" value={facForm.defaultAmount} onChange={e => setFacForm(p => ({ ...p, defaultAmount: e.target.value }))} style={input} placeholder="0" />
              </div>
              <div><label style={label}>{isBn ? 'ধরন' : 'Type'}</label>
                <select value={facForm.type} onChange={e => setFacForm(p => ({ ...p, type: e.target.value as 'monthly' | 'oneTime' }))} style={input}>
                  <option value="monthly">{isBn ? 'মাসিক' : 'Monthly'}</option>
                  <option value="oneTime">{isBn ? 'এককালীন' : 'One-time'}</option>
                </select>
              </div>
              <button onClick={facModalType === 'add-facility' ? handleAddFacility : handleEditFacility}
                style={{ padding: '9px', borderRadius: '8px', background: 'var(--purple)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(facModalType === 'assign' || facModalType === 'edit-assign') && (
        <div style={modalOverlay} onClick={() => { setFacModalType(null); setEditAssign(null) }}>
          <div className="modal-content" style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {facModalType === 'assign' ? (isBn ? 'সুবিধা বরাদ্দ করুন' : 'Assign Facility') : (isBn ? 'বরাদ্দ এডিট করুন' : 'Edit Assignment')}
              </h2>
              <button onClick={() => { setFacModalType(null); setEditAssign(null) }}
                style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={label}>{isBn ? 'কর্মচারী *' : 'Employee *'}</label>
                <select value={assignForm.teacherId} onChange={e => setAssignForm(p => ({ ...p, teacherId: e.target.value }))} style={input}
                  disabled={facModalType === 'edit-assign'}>
                  <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                  {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn} ({t.designation})</option>)}
                </select>
              </div>
              <div><label style={label}>{isBn ? 'সুবিধা *' : 'Facility *'}</label>
                <select value={assignForm.facilityId} onChange={e => {
                  const fac = facilities.find(f => f.id === e.target.value)
                  setAssignForm(p => ({ ...p, facilityId: e.target.value, amount: fac ? String(fac.defaultAmount) : p.amount }))
                }} style={input}
                  disabled={facModalType === 'edit-assign'}>
                  <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                  {facilities.filter(f => f.isActive).map(f => <option key={f.id} value={f.id}>{isBn ? f.nameBn : f.name}</option>)}
                </select>
              </div>
              <div><label style={label}>{isBn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
                <input type="number" value={assignForm.amount} onChange={e => setAssignForm(p => ({ ...p, amount: e.target.value }))} style={input} placeholder="0" />
              </div>
              <button onClick={facModalType === 'assign' ? handleAssignFacility : handleEditAssign}
                style={{ padding: '9px', borderRadius: '8px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facility Delete Confirmation */}
      {facDeleteConfirm && (
        <div style={modalOverlay} onClick={() => setFacDeleteConfirm(null)}>
          <div className="modal-content" style={{ ...modalStyle, maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={18} style={{ color: 'var(--red)' }} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {isBn ? 'এই সুবিধাটি স্থায়ীভাবে মুছে ফেলা হবে। সম্পর্কিত সব বরাদ্দও মুছে ফেলা হবে।' : 'This facility will be permanently deleted. All related assignments will also be removed.'}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setFacDeleteConfirm(null)}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={() => { deleteFacility(facDeleteConfirm); setFacDeleteConfirm(null) }}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--red)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Delete Confirmation */}
      {assignDeleteConfirm && (
        <div style={modalOverlay} onClick={() => setAssignDeleteConfirm(null)}>
          <div className="modal-content" style={{ ...modalStyle, maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={18} style={{ color: 'var(--red)' }} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {isBn ? 'এই বরাদ্দটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This assignment will be permanently deleted.'}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignDeleteConfirm(null)}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={() => { removeTeacherFacility(assignDeleteConfirm); setAssignDeleteConfirm(null) }}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--red)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
