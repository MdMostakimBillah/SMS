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
    addIncrement, deleteIncrement, addBonus, deleteBonus, addPromotion, deletePromotion, addFund, addRecommendation,
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
  const [proDateFrom, setProDateFrom] = useState('')
  const [proDateTo, setProDateTo] = useState('')
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
  const [incDateFrom, setIncDateFrom] = useState('')
  const [incDateTo, setIncDateTo] = useState('')
  const [bulkDeductionEnabled, setBulkDeductionEnabled] = useState(false)
  const [bulkDeductionFrom, setBulkDeductionFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [bulkDeductionTo, setBulkDeductionTo] = useState(new Date().toISOString().split('T')[0])
  const [bulkFundEnabled, setBulkFundEnabled] = useState(false)
  const [bulkFundPercent, setBulkFundPercent] = useState('')
  const [fundDateFrom, setFundDateFrom] = useState('')
  const [fundDateTo, setFundDateTo] = useState('')

  const [perPage, setPerPage] = useState(20)
  const [page, setPage] = useState(1)

  const filteredIncrements = useMemo(() => {
    let list = increments
    if (incDateFrom) list = list.filter(i => i.date >= incDateFrom)
    if (incDateTo) list = list.filter(i => i.date <= incDateTo)
    return list
  }, [increments, incDateFrom, incDateTo])

  const filteredBonuses = useMemo(() => {
    let list = bonuses
    if (bonusDateFrom) list = list.filter(b => b.date >= bonusDateFrom)
    if (bonusDateTo) list = list.filter(b => b.date <= bonusDateTo)
    return list
  }, [bonuses, bonusDateFrom, bonusDateTo])

  const filteredPromotions = useMemo(() => {
    let list = promotions
    if (proDateFrom) list = list.filter(p => p.date >= proDateFrom)
    if (proDateTo) list = list.filter(p => p.date <= proDateTo)
    return list
  }, [promotions, proDateFrom, proDateTo])

  const filteredFunds = useMemo(() => {
    let list = funds
    if (fundDateFrom) list = list.filter(f => f.date >= fundDateFrom)
    if (fundDateTo) list = list.filter(f => f.date <= fundDateTo)
    return list
  }, [funds, fundDateFrom, fundDateTo])

  const toggleInc = useCallback((id: string) => setSelectedInc(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const toggleAllInc = useCallback(() => setSelectedInc(p => p.length === filteredIncrements.length ? [] : filteredIncrements.map(i => i.id)), [filteredIncrements])
  const toggleBon = useCallback((id: string) => setSelectedBon(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const toggleAllBon = useCallback(() => setSelectedBon(p => p.length === filteredBonuses.length ? [] : filteredBonuses.map(b => b.id)), [filteredBonuses])
  const togglePro = useCallback((id: string) => setSelectedPro(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])
  const toggleAllPro = useCallback(() => setSelectedPro(p => p.length === filteredPromotions.length ? [] : filteredPromotions.map(p => p.id)), [filteredPromotions])
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
  const sectionCls = `bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl ${isMobile ? 'p-[14px]' : 'p-4'} mb-3.5`

  const sectionTitleCls = 'text-sm font-semibold text-[var(--text-primary)] mb-3.5 pb-2 border-b border-[var(--border)] flex items-center gap-2'

  const inputCls = 'w-full py-[9px] px-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none'

  const labelCls = 'text-[11px] font-medium text-[var(--text-secondary)] mb-[5px] block'

  const modalOverlayCls = 'fixed top-0 left-0 right-0 h-[100dvh] z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto'

  const modalStyleCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-5 w-full max-w-[460px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.12)]'

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

  const filteredFacStaff = useMemo(() => {
    let list = activeTeachers
    if (facStaffFilter) list = list.filter(t => t.departmentId === facStaffFilter)
    if (facStaffSearch) {
      const q = facStaffSearch.toLowerCase()
      list = list.filter(t => t.nameEn.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || (t.nameBn && t.nameBn.includes(facStaffSearch)))
    }
    return list
  }, [activeTeachers, facStaffFilter, facStaffSearch])

  // Pagination computations
  const paginatedIncrements = useMemo(() => filteredIncrements.slice((page - 1) * perPage, page * perPage), [filteredIncrements, page, perPage])
  const incrementTotalPages = Math.max(1, Math.ceil(filteredIncrements.length / perPage))

  const paginatedBonuses = useMemo(() => filteredBonuses.slice((page - 1) * perPage, page * perPage), [filteredBonuses, page, perPage])
  const bonusTotalPages = Math.max(1, Math.ceil(filteredBonuses.length / perPage))

  const paginatedPromotions = useMemo(() => filteredPromotions.slice((page - 1) * perPage, page * perPage), [filteredPromotions, page, perPage])
  const promotionTotalPages = Math.max(1, Math.ceil(filteredPromotions.length / perPage))

  const paginatedFunds = useMemo(() => filteredFunds.slice((page - 1) * perPage, page * perPage), [filteredFunds, page, perPage])
  const fundTotalPages = Math.max(1, Math.ceil(filteredFunds.length / perPage))

  const paginatedActiveTeachers = useMemo(() => activeTeachers.slice((page - 1) * perPage, page * perPage), [activeTeachers, page, perPage])
  const salaryTotalPages = Math.max(1, Math.ceil(activeTeachers.length / perPage))

  const paginatedAssignments = useMemo(() => filteredAssignments.slice((page - 1) * perPage, page * perPage), [filteredAssignments, page, perPage])
  const assignmentTotalPages = Math.max(1, Math.ceil(filteredAssignments.length / perPage))

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
      const list = selectedPro.length > 0 ? filteredPromotions.filter(p => selectedPro.includes(p.id)) : filteredPromotions
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
    const map: Record<string, { cls: string; label: string; labelBn: string }> = {
      active: { cls: 'bg-[var(--green-light)] text-[var(--green)]', label: 'Active', labelBn: 'সক্রিয়' },
      inactive: { cls: 'bg-[var(--red-light)] text-[var(--red)]', label: 'Inactive', labelBn: 'নিষ্ক্রিয়' },
      'on-leave': { cls: 'bg-[var(--amber-light)] text-[var(--amber)]', label: 'On Leave', labelBn: 'ছুটিতে' },
    }
    const s = map[status] || map.active
    return (
      <span className={`text-[11px] py-[3px] px-[10px] rounded-full font-medium whitespace-nowrap ${s.cls}`}>
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
    { id: 'facilities', icon: Briefcase, label: 'Facilities', labelBn: 'সুবিধা', color: 'var(--purple)' },
    { id: 'salary-setup', icon: Calculator, label: 'Salary Setup', labelBn: 'বেতন সেটআপ', color: 'var(--teal)' },
    { id: 'fund', icon: HandCoins, label: 'Fund', labelBn: 'তহবিল', color: 'var(--brand)' },
  ]

  const quickStats = [
    { labelBn: 'সক্রিয়', labelEn: 'Active', valueBn: `${toBnNum(activeTeachers.length)} জন`, valueEn: String(activeTeachers.length), icon: Users, colorCls: 'text-[var(--brand)]', bgCls: 'bg-[var(--brand-light)]' },
    { labelBn: 'উপস্থিত', labelEn: 'Present', valueBn: `${toBnNum(attendanceToday.present)} জন`, valueEn: String(attendanceToday.present), icon: CheckCircle2, colorCls: 'text-[var(--green)]', bgCls: 'bg-[var(--green-light)]' },
    { labelBn: 'অনুপস্থিত', labelEn: 'Absent', valueBn: `${toBnNum(attendanceToday.absent)} জন`, valueEn: String(attendanceToday.absent), icon: XCircle, colorCls: 'text-[var(--red)]', bgCls: 'bg-[var(--red-light)]' },
    { labelBn: 'ছুটিতে', labelEn: 'On Leave', valueBn: `${toBnNum(attendanceToday.onLeave)} জন`, valueEn: String(attendanceToday.onLeave), icon: Clock, colorCls: 'text-[var(--amber)]', bgCls: 'bg-[var(--amber-light)]' },
  ]

  return (
    <div className="max-w-[1200px] m-[0 auto]">
      {/* Header */}
      <div className="flex items-center gap-[10px] mb-4 flex-wrap">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-[5px] py-[7px] px-3 rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] font-[inherit]">
          <ArrowLeft size={14} />{isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[22px]'}`}>
            {isBn ? 'HR ও কর্মচারী ব্যবস্থাপনা' : 'HR & Staff Management'}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-[3px]">
            {isBn ? `${activeTeachers.length} জন সক্রিয় কর্মচারী · ${departments.length} টি বিভাগ` : `${activeTeachers.length} active staff · ${departments.length} departments`}
          </p>
        </div>
      </div>

      {/* Tabs - matching other pages' segmented pill style */}
      <div className={`flex gap-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-[5px] mb-[14px] overflow-x-auto ${isMobile ? 'flex-wrap' : 'flex-nowrap'}`}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1) }}
            className={`flex-1 flex items-center justify-center gap-[7px] py-[9px] px-[14px] rounded-[9px] border-none cursor-pointer text-[13px] font-medium font-[inherit] transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)]' : 'bg-transparent'} ${activeTab === tab.id ? 'text-white' : 'text-[var(--text-secondary)]'} ${activeTab === tab.id ? 'shadow-[0_4px_12px_rgba(99,102,241,0.3)]' : 'shadow-none'}`}>
            <tab.icon size={15} />
            {isBn ? tab.labelBn : tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <>
          {/* Date Range Filter */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar size={14} className="text-[var(--brand)] shrink-0" />
              <span className="text-xs font-medium text-[var(--text-secondary)]">{isBn ? 'তারিখ পরিসীমা:' : 'Date Range:'}</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className={`${inputCls} w-auto max-w-[160px] py-[6px] px-[10px] text-xs`} />
              <span className="text-xs text-[var(--text-muted)]">—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className={`${inputCls} w-auto max-w-[160px] py-[6px] px-[10px] text-xs`} />
              <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); setDateFrom(d.toISOString().split('T')[0]); setDateTo(new Date().toISOString().split('T')[0]) }}
                className="py-[5px] px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit]">
                {isBn ? '৭ দিন' : '7D'}
              </button>
              <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 30); setDateFrom(d.toISOString().split('T')[0]); setDateTo(new Date().toISOString().split('T')[0]) }}
                className="py-[5px] px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit]">
                {isBn ? '৩০ দিন' : '30D'}
              </button>
              <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 1); setDateFrom(d.toISOString().split('T')[0]); setDateTo(new Date().toISOString().split('T')[0]) }}
                className="py-[5px] px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit]">
                {isBn ? '১ মাস' : '1M'}
              </button>
              <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 3); setDateFrom(d.toISOString().split('T')[0]); setDateTo(new Date().toISOString().split('T')[0]) }}
                className="py-[5px] px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit]">
                {isBn ? '৩ মাস' : '3M'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`grid gap-2 mb-[14px] ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {quickStats.map(s => (
              <div key={s.labelEn} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3">
                <div className="flex items-center gap-[10px]">
                  <div className={`w-8 h-8 rounded-lg ${s.bgCls} flex items-center justify-center shrink-0`}>
                    <s.icon size={15} className={s.colorCls} />
                  </div>
                  <div>
                    <div className={`font-bold text-[var(--text-primary)] ${isMobile ? 'text-[15px]' : 'text-[17px]'}`}>{isBn ? s.valueBn : s.valueEn}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{isBn ? s.labelBn : s.labelEn}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Rankings */}
          <div className={sectionCls}>
            <div className={sectionTitleCls}>
              <Medal size={15} className="text-[var(--amber)]" />{isBn ? 'শীর্ষ কর্মী' : 'Top Performers'}
            </div>
            <div className={`grid gap-[10px] ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'}`}>
              {[
                { title: isBn ? 'শিক্ষার্থী ফলাফল' : 'Student Performance', data: studentPerformanceRank, color: 'var(--brand)', key: 'avgScore' as const, suffix: '' },
                { title: isBn ? 'দৈনিক রিপোর্ট' : 'Reports', data: reportRank, color: 'var(--teal)', key: 'rate' as const, suffix: '%' },
                { title: isBn ? 'হোমওয়ার্ক' : 'Homework', data: homeworkRank, color: 'var(--green)', key: 'rate' as const, suffix: '%' },
                { title: isBn ? 'উপস্থিতি' : 'Attendance', data: attendanceRank, color: 'var(--purple)', key: 'rate' as const, suffix: '%' },
              ].map(card => (
                <div key={card.title} className="bg-[var(--bg-secondary)] rounded-[10px] p-3">
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-[10px]">{card.title}</div>
                  {card.data.slice(0, 3).map((t, i) => (
                    <div key={t.id} className="flex items-center gap-2 py-[5px] px-0 border-b border-[var(--border)]">
                      <span className={`text-[11px] font-bold w-[18px] text-center ${i === 0 ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'}`}>#{i + 1}</span>
                      <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 text-[8px] font-semibold text-white" style={{ background: getAvatarGradient(t.id) }}>
                        {getInitials(t.nameEn)}
                      </div>
                      <div className="flex-1 min-w-[0]">
                        <div className="text-xs font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">{t.nameEn}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{getTeacherDept(t.id)}</div>
                      </div>
                      <div className="text-[13px] font-bold" style={{ color: card.color }}>{(t as any)[card.key]}{card.suffix}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className={sectionCls}>
            <div className={sectionTitleCls}>
              <DollarSign size={15} className="text-[var(--green)]" />{isBn ? 'আর্থিক সারসংক্ষেপ' : 'Financial Summary'}
            </div>
            <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
              {[
                { label: isBn ? 'মোট বেতন' : 'Total Salary', val: `৳${adjustedTotalSalary.toLocaleString()}`, color: 'var(--text-primary)' },
                { label: isBn ? 'বেতন কাটা' : 'Deductions', val: salaryDeductions > 0 ? `-৳${salaryDeductions.toLocaleString()}` : '৳0', color: salaryDeductions > 0 ? 'var(--red)' : 'var(--text-muted)' },
                { label: isBn ? 'মোট বৃদ্ধি' : 'Increments', val: `৳${totalIncrements.toLocaleString()}`, color: 'var(--green)' },
                { label: isBn ? 'মোট বোনাস' : 'Bonuses', val: `৳${totalBonuses.toLocaleString()}`, color: 'var(--amber)' },
                { label: isBn ? 'তহবিল' : 'Fund Balance', val: `৳${fundBalance.toLocaleString()}`, color: 'var(--brand)' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="text-[11px] text-[var(--text-muted)] mb-1">{item.label}</div>
                  <div className="text-lg font-bold" style={{ color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>
            {salaryDeductions > 0 && (
              <div className="mt-2 py-2 px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[11px] text-[var(--red)] flex items-center gap-1.5">
                <DollarSign size={13} />
                {isBn ? `বেতন কাটার নিয়ম প্রযোজ্য: ${activeTeachers.filter(t => t.applySalaryRule).length} জন কর্মচারীর ক্ষেত্রে ১ দিনের বেতন কাটা হয়েছে` : `Salary rule applied: 1 day deducted for ${activeTeachers.filter(t => t.applySalaryRule).length} staff with ≥3 days attendance`}
              </div>
            )}
          </div>

          {/* Employees */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                {isBn ? 'সকল কর্মচারী' : 'All Staff'}
                <span className="inline-flex items-center gap-[3px] ml-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-[4px] h-1 rounded-full bg-[var(--brand)] opacity-30 transition-all"
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
              <div className="flex gap-1.5 items-center">
                <div className="relative">
                  <Search size={13} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input value={employeeSearch} onChange={e => { setEmployeeSearch(e.target.value); setPage(1) }}
                    placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
                    className={`${inputCls} pl-[30px] text-xs h-[34px] w-[130px]`} />
                </div>
                <select value={employeeStatusFilter} onChange={e => { setEmployeeStatusFilter(e.target.value); setPage(1) }}
                  className={`${inputCls} w-[90px] text-xs h-[34px]`}>
                  <option value="all">{isBn ? 'সব' : 'All'}</option>
                  <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
                  <option value="inactive">{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
                  <option value="on-leave">{isBn ? 'ছুটিতে' : 'Leave'}</option>
                </select>
                <div className="flex rounded-lg border border-[var(--border)] overflow-hidden shrink-0 h-[34px]">
                  <button onClick={() => setEmployeeView('grid')}
                    className={`py-0 px-[10px] border-none cursor-pointer font-[inherit] transition-all flex items-center ${employeeView === 'grid' ? 'bg-[var(--brand-light)]' : 'bg-transparent'} ${employeeView === 'grid' ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>
                    <LayoutGrid size={14} />
                  </button>
                  <button onClick={() => setEmployeeView('list')}
                    className={`py-0 px-[10px] border-none cursor-pointer font-[inherit] transition-all flex items-center ${employeeView === 'list' ? 'bg-[var(--brand-light)]' : 'bg-transparent'} ${employeeView === 'list' ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {employeeView === 'grid' ? (
              <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {paginatedEmployees.map(t => (
                  <div key={t.id} onClick={() => setSelectedEmployee(selectedEmployee === t.id ? null : t.id)}
                    className={`p-3 rounded-[10px] cursor-pointer transition-all ${selectedEmployee === t.id ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-secondary)]'}`}>
                    <div className="flex items-center gap-[10px] mb-[10px]">
                      <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[10px] font-semibold text-white shrink-0" style={{ background: getAvatarGradient(t.id) }}>
                        {getInitials(t.nameEn)}
                      </div>
                      <div className="flex-1 min-w-[0]">
                        <div className="text-[13px] font-semibold text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">{t.nameEn}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{t.designation}</div>
                      </div>
                      {getStatusBadge(t.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="text-center py-[5px] px-[2px] rounded-md bg-[var(--bg-primary)]">
                        <div className="text-[9px] text-[var(--text-muted)]">{isBn ? 'উপস্থিতি' : 'Att.'}</div>
                        <div className={`text-xs font-semibold ${t.attRate >= 80 ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>{t.attRate}%</div>
                      </div>
                      <div className="text-center py-[5px] px-[2px] rounded-md bg-[var(--bg-primary)]">
                        <div className="text-[9px] text-[var(--text-muted)]">{isBn ? 'হোমওয়ার্ক' : 'HW'}</div>
                        <div className={`text-xs font-semibold ${t.hwRate >= 80 ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>{t.hwRate}%</div>
                      </div>
                      <div className="text-center py-[5px] px-[2px] rounded-md bg-[var(--bg-primary)]">
                        <div className="text-[9px] text-[var(--text-muted)]">{isBn ? 'স্কোর' : 'Score'}</div>
                        <div className="text-xs font-bold text-[var(--brand)]">{t.compScore}</div>
                      </div>
                    </div>
                    {selectedEmployee === t.id && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)] flex gap-1.5 flex-wrap">
                        <span className="text-[11px] text-[var(--text-secondary)]">{t.phone}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">·</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">{getTeacherDept(t.id)}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">·</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">৳{t.salary.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
                {employeeList.length === 0 && (
                  <div className="col-span-full p-[30px] text-center text-[var(--text-muted)] text-[13px]">
                    {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No staff found'}
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                      {[isBn ? 'কর্মচারী' : 'Employee', isBn ? 'বিভাগ' : 'Dept', isBn ? 'পদবি' : 'Designation', isBn ? 'উপস্থিতি' : 'Att', isBn ? 'হোমওয়ার্ক' : 'HW', isBn ? 'স্কোর' : 'Score', isBn ? 'স্ট্যাটাস' : 'Status'].map(h => (
                        <th key={h} className="py-[10px] px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                {paginatedEmployees.map(t => (
                      <tr key={t.id} className="border-b border-[var(--border)]"
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-[10px]">
                            <div className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[9px] font-semibold text-white shrink-0" style={{ background: getAvatarGradient(t.id) }}>
                              {getInitials(t.nameEn)}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">{t.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{getTeacherDept(t.id)}</td>
                        <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{t.designation}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-10 h-[5px] rounded-[3px] bg-[var(--border)] overflow-hidden">
                              <div className={`h-full rounded-[3px] ${t.attRate >= 80 ? 'bg-[var(--green)]' : t.attRate >= 60 ? 'bg-[var(--amber)]' : 'bg-[var(--red)]'}`} />
                            </div>
                            <span className={`text-[11px] font-semibold ${t.attRate >= 80 ? 'text-[var(--green)]' : t.attRate >= 60 ? 'text-[var(--amber)]' : 'text-[var(--red)]'}`}>{t.attRate}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`text-[11px] font-semibold ${t.hwRate >= 80 ? 'text-[var(--green)]' : t.hwRate >= 50 ? 'text-[var(--amber)]' : 'text-[var(--red)]'}`}>{t.hwRate}%</span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-xs font-bold text-[var(--brand)]">{t.compScore}</span>
                        </td>
                        <td className="py-2 px-2">{getStatusBadge(t.status)}</td>
                      </tr>
                    ))}
                    {employeeList.length === 0 && (
                      <tr><td colSpan={7} className="p-[30px] text-center text-[var(--text-muted)] text-xs">{isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No staff found'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-[11px] text-[var(--text-muted)] mt-2 text-right">
              {isBn ? `মোট ${employeeList.length} জন কর্মচারী` : `${employeeList.length} total`}
            </div>
            {employeeList.length > perPage && (
              <div className="py-[10px] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
                <span className="text-xs text-[var(--text-muted)]">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, employeeList.length)} / {employeeList.length}
                </span>
                <div className="flex gap-[3px] items-center">
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                    className="py-1 px-[6px] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] font-[inherit] outline-none mr-[6px]">
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                  {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                      {ic}
                    </button>
                  ))}
                  {(() => {
                    const start = Math.max(1, Math.min(page - 2, employeeTotalPages - 4))
                    return Array.from({ length: Math.min(5, employeeTotalPages) }, (_, i) => start + i).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}>
                        {p}
                      </button>
                    ))
                  })()}
                  {([[<ChevronRight size={12} />, () => setPage(p => Math.min(employeeTotalPages, p + 1)), page === employeeTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(employeeTotalPages), page === employeeTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
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
          <div className={sectionCls}>
            <div className="flex items-center gap-[10px] justify-between flex-wrap">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Zap size={16} className="text-[var(--brand)]" />
                  {isBn ? 'বুদ্ধিমান সুপারিশ' : 'AI Recommendations'}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-[2px]">
                  {isBn ? 'উপস্থিতি, হোমওয়ার্ক, রিপোর্ট ও ফলাফলের ভিত্তিতে' : 'Based on attendance, homework, reports & performance'}
                </div>
              </div>
              <button onClick={handleGenerateRecommendations}
                className="flex items-center gap-[5px] py-2 px-4 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
                <Zap size={14} />{isBn ? 'সুপারিশ তৈরি করুন' : 'Generate'}
              </button>
            </div>
            {showGenerateRecs && (
              <div className="mt-[10px] py-2 px-3 rounded-lg bg-[var(--green-light)] text-[var(--green)] text-xs font-medium">
                <CheckCircle2 size={14} className="inline mr-[6px]" />
                {isBn ? 'সুপারিশ তৈরি করা হয়েছে!' : 'Recommendations generated!'}
              </div>
            )}
          </div>

          <div className={sectionCls}>
            <div className={sectionTitleCls}>
              <Percent size={15} className="text-[var(--teal)]" />{isBn ? 'সামগ্রিক স্কোর' : 'Performance Scores'}
            </div>
            <div className="flex flex-col gap-1.5">
              {teacherCompositeScores.slice(0, 10).map((t, i) => (
                <div key={t.id} className="py-[10px] px-3 rounded-lg bg-[var(--bg-secondary)] transition-all">
                  <div className="flex items-center gap-[10px]">
                    <span className={`text-[13px] font-bold w-[24px] ${i < 3 ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'}`}>#{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-semibold text-white shrink-0" style={{ background: getAvatarGradient(t.id) }}>
                      {getInitials(t.nameEn)}
                    </div>
                    <div className="flex-1 min-w-[0]">
                      <div className="text-[13px] font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{getTeacherDept(t.id)} · {t.designation}</div>
                    </div>
                    <CircularChart value={t.totalScore} size={42} stroke={5} color={t.totalScore >= 80 ? 'var(--green)' : t.totalScore >= 60 ? 'var(--amber)' : 'var(--red)'} />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[
                      { label: isBn ? 'উপস্থিতি' : 'Att', val: `${t.attRate}%`, color: 'var(--purple)' },
                      { label: isBn ? 'হোমওয়ার্ক' : 'HW', val: `${t.hwRate}%`, color: 'var(--green)' },
                      { label: isBn ? 'রিপোর্ট' : 'Reports', val: `${t.repRate}%`, color: 'var(--teal)' },
                      { label: isBn ? 'ফলাফল' : 'Scores', val: `${t.avgScore}`, color: 'var(--brand)' },
                    ].map(d => (
                      <div key={d.label} className="text-center p-1 rounded-md bg-[var(--bg-primary)]">
                        <div className="text-[10px] text-[var(--text-muted)]">{d.label}</div>
                        <div className="text-[13px] font-semibold" style={{ color: d.color }}>{d.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={sectionCls}>
            <div className={sectionTitleCls}>
              <ThumbsUp size={15} className="text-[var(--green)]" />{isBn ? 'বিবেচনাধীন' : 'Pending'}
            </div>
            {recommendations.filter(r => r.status === 'pending').length === 0 ? (
              <div className="p-5 text-center text-[var(--text-muted)] text-[13px]">
                {isBn ? 'কোনো সুপারিশ নেই। "সুপারিশ তৈরি করুন" বাটনে ক্লিক করুন।' : 'No pending recommendations. Click "Generate".'}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {recommendations.filter(r => r.status === 'pending').map(rec => {
                  const teacher = teachers.find(t => t.id === rec.teacherId)
                  const colors: Record<string, string> = { promotion: 'var(--purple)', bonus: 'var(--amber)', increment: 'var(--green)' }
                  const bg: Record<string, string> = { promotion: 'var(--purple-light)', bonus: 'var(--amber-light)', increment: 'var(--green-light)' }
                  const icons: Record<string, any> = { promotion: Award, bonus: Gift, increment: TrendingUp }
                  const IconComp = icons[rec.type]
                  const labels: Record<string, string> = { promotion: isBn ? 'পদোন্নতি' : 'Promotion', bonus: isBn ? 'বোনাস' : 'Bonus', increment: isBn ? 'বৃদ্ধি' : 'Increment' }
                  return (
                    <div key={rec.id} className="p-3 rounded-[10px] bg-[var(--bg-secondary)]">
                      <div className="flex items-center gap-[10px] flex-wrap">
                        <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0" style={{ background: bg[rec.type] }}>
                          <IconComp size={15} style={{ color: colors[rec.type] }} />
                        </div>
                        <div className="flex-1 min-w-[0]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{teacher?.nameEn || rec.teacherId}</span>
                            <span className="text-[11px] py-[2px] px-2 rounded-full font-medium" style={{ background: bg[rec.type], color: colors[rec.type] }}>{labels[rec.type]}</span>
                            <span className="text-[11px] text-[var(--text-muted)]">{isBn ? 'স্কোর' : 'Score'}: <strong className="text-[var(--brand)]">{rec.score}</strong></span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-[2px]">{rec.reason}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleApproveRecommendation(rec)}
                            className="py-[6px] px-3 rounded-lg bg-[var(--green)] border-none text-white text-xs font-medium cursor-pointer font-[inherit] flex items-center gap-1">
                            <CheckCircle2 size={13} />{isBn ? 'অনুমোদন' : 'Approve'}
                          </button>
                          <button onClick={() => updateRecommendation(rec.id, 'rejected')}
                            className="py-[6px] px-3 rounded-lg bg-transparent border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit] flex items-center gap-1">
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
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <AlertCircle size={15} className="text-[var(--text-muted)]" />{isBn ? 'ইতিহাস' : 'History'}
              </div>
              <div className="flex flex-col gap-1">
                {recommendations.filter(r => r.status !== 'pending').map(rec => {
                  const teacher = teachers.find(t => t.id === rec.teacherId)
                  const colors: Record<string, string> = { promotion: 'var(--purple)', bonus: 'var(--amber)', increment: 'var(--green)' }
                  const bg: Record<string, string> = { promotion: 'var(--purple-light)', bonus: 'var(--amber-light)', increment: 'var(--green-light)' }
                  const labels: Record<string, string> = { promotion: isBn ? 'পদোন্নতি' : 'Promotion', bonus: isBn ? 'বোনাস' : 'Bonus', increment: isBn ? 'বৃদ্ধি' : 'Increment' }
                  return (
                    <div key={rec.id} className="py-2 px-3 rounded-lg bg-[var(--bg-secondary)] flex items-center gap-[10px]">
                      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0" style={{ background: bg[rec.type] }}>
                        {rec.type === 'promotion' ? <Award size={13} style={{ color: colors[rec.type] }} /> :
                         rec.type === 'bonus' ? <Gift size={13} style={{ color: colors[rec.type] }} /> :
                         <TrendingUp size={13} style={{ color: colors[rec.type] }} />}
                      </div>
                      <div className="flex-1">
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">{teacher?.nameEn || rec.teacherId}</span>
                        <span className="text-[11px] py-px px-2 rounded-xl font-medium ml-2" style={{ background: bg[rec.type], color: colors[rec.type] }}>{labels[rec.type]}</span>
                      </div>
                      <span className={`text-[11px] py-[3px] px-2 rounded-full font-medium ${rec.status === 'approved' ? 'bg-[var(--green-light)]' : 'bg-[var(--red-light)]'} ${rec.status === 'approved' ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
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
        <div className={sectionCls}>
          <div className="flex justify-between items-center mb-[14px]">
            <div className={sectionTitleCls}>
              <TrendingUp size={15} className="text-[var(--green)]" />{isBn ? 'বেতন বৃদ্ধি' : 'Increments'}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowPDFModal('increment')}
                className="flex items-center gap-[5px] py-[7px] px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs font-medium cursor-pointer font-[inherit]">
                <FileText size={13} />PDF
              </button>
              <button onClick={() => setModalType('increment')}
                className="flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--green)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
                <Plus size={14} />{isBn ? 'যোগ' : 'Add'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Calendar size={13} className="text-[var(--text-muted)]" />
            <input type="date" value={incDateFrom} onChange={e => { setIncDateFrom(e.target.value); setPage(1) }}
              className={`${inputCls} w-auto max-w-[160px] h-[32px] py-0 px-2 text-[11px]`} />
            <span className="text-[11px] text-[var(--text-muted)]">—</span>
            <input type="date" value={incDateTo} onChange={e => { setIncDateTo(e.target.value); setPage(1) }}
              className={`${inputCls} w-auto max-w-[160px] h-[32px] py-0 px-2 text-[11px]`} />
            <div className="flex h-[32px] shrink-0">
              <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 6); setIncDateFrom(d.toISOString().split('T')[0]); setIncDateTo(new Date().toISOString().split('T')[0]) }}
                className="px-[10px] border border-[var(--border)] border-r-0 cursor-pointer font-[inherit] text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all rounded-l-lg">
                6{isBn ? 'মাস' : 'M'}
              </button>
              <button onClick={() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); setIncDateFrom(d.toISOString().split('T')[0]); setIncDateTo(new Date().toISOString().split('T')[0]) }}
                className={`px-[10px] border border-[var(--border)] cursor-pointer font-[inherit] text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all ${incDateFrom || incDateTo ? 'border-r-0' : 'rounded-r-lg'}`}>
                1{isBn ? 'বছর' : 'Y'}
              </button>
              {(incDateFrom || incDateTo) && (
                <button onClick={() => { setIncDateFrom(''); setIncDateTo(''); setPage(1) }}
                  className="px-[10px] border border-[var(--border)] cursor-pointer font-[inherit] text-[11px] bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all rounded-r-lg">
                  {isBn ? 'মুছুন' : 'Clear'}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="py-[10px] px-2 w-9">
                    <input type="checkbox" checked={selectedInc.length === filteredIncrements.length && filteredIncrements.length > 0} onChange={toggleAllInc}
                      className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                  </th>
                  {[isBn ? 'তারিখ' : 'Date', isBn ? 'শিক্ষক' : 'Teacher', isBn ? 'ধরন' : 'Type', isBn ? 'শতাংশ' : '%', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'মোট' : 'Total', isBn ? 'কারণ' : 'Reason', ''].map(h => (
                    <th key={h || 'action'} className={`py-[10px] px-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap ${h === '' ? 'text-center w-[80px]' : (h === (isBn ? 'পরিমাণ' : 'Amount') || h === (isBn ? 'মোট' : 'Total')) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedIncrements.map(inc => {
                  const t = teachers.find(tx => tx.id === inc.teacherId)
                  const baseSalary = t?.salary || 0
                  const totalWithInc = baseSalary + inc.amount
                  return (
                    <tr key={inc.id} className={`border-b border-[var(--border)] ${selectedInc.includes(inc.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                      onMouseEnter={e => { if (!selectedInc.includes(inc.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                      onMouseLeave={e => { if (!selectedInc.includes(inc.id)) e.currentTarget.style.background = 'transparent' }}>
                      <td className="py-2 px-2">
                        <input type="checkbox" checked={selectedInc.includes(inc.id)} onChange={() => toggleInc(inc.id)}
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                      </td>
                      <td className="py-2 px-2 text-[11px] text-[var(--text-muted)]">{inc.date}</td>
                      <td className="py-2 px-2 text-xs font-medium text-[var(--text-primary)]">{getTeacherName(inc.teacherId)}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium ${inc.type === 'annual' ? 'bg-[var(--green-light)]' : inc.type === 'performance' ? 'bg-[var(--brand-light)]' : 'bg-[var(--amber-light)]'} ${inc.type === 'annual' ? 'text-[var(--green)]' : inc.type === 'performance' ? 'text-[var(--brand)]' : 'text-[var(--amber)]'}`}>{inc.type}</span>
                      </td>
                      <td className="py-2 px-2 text-xs font-semibold text-[var(--green)]">{inc.percentage}%</td>
                      <td className="py-2 px-2 text-xs font-semibold text-[var(--text-primary)] text-right">৳{inc.amount.toLocaleString()}</td>
                      <td className="py-2 px-2 text-xs font-bold text-[var(--green)] text-right">৳{totalWithInc.toLocaleString()}</td>
                      <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{inc.reason}</td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => { setIncForm({ teacherId: inc.teacherId, type: inc.type, percentage: String(inc.percentage), reason: inc.reason }); setModalType('increment'); }}
                            className="py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer text-[10px] font-[inherit]">
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => deleteIncrement(inc.id)}
                            className="py-1 px-2 rounded border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] cursor-pointer text-[10px] font-[inherit]">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--bg-secondary)] border-t border-t-2 border-[var(--border)]">
                  <td className="py-2 px-2"></td>
                  <td colSpan={3} className="py-2 px-2 text-[11px] font-bold text-[var(--text-primary)]">{isBn ? 'মোট' : 'Total'}</td>
                  <td className="py-2 px-2 text-xs font-bold text-[var(--green)] text-right">৳{filteredIncrements.reduce((s, i) => s + i.amount, 0).toLocaleString()}</td>
                  <td className="py-2 px-2 text-xs font-bold text-[var(--green)] text-right">৳{filteredIncrements.reduce((s, i) => {
                    const t = teachers.find(tx => tx.id === i.teacherId)
                    return s + (t?.salary || 0) + i.amount
                  }, 0).toLocaleString()}</td>
                  <td className="py-2 px-2"></td>
                  <td className="py-2 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filteredIncrements.length > perPage && (
            <div className="py-[10px] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredIncrements.length)} / {filteredIncrements.length}
              </span>
              <div className="flex gap-[3px] items-center">
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  className="py-1 px-[6px] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] font-[inherit] outline-none mr-[6px]">
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                    {ic}
                  </button>
                ))}
                {(() => {
                  const start = Math.max(1, Math.min(page - 2, incrementTotalPages - 4))
                  return Array.from({ length: Math.min(5, incrementTotalPages) }, (_, i) => start + i).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}>
                      {p}
                    </button>
                  ))
                })()}
                {([[<ChevronRight size={12} />, () => setPage(p => Math.min(incrementTotalPages, p + 1)), page === incrementTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(incrementTotalPages), page === incrementTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedInc.length > 0 && (
            <div className="mt-2 text-[11px] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[10px] rounded-md inline-block">
              {selectedInc.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </div>
          )}
        </div>
      )}

      {/* ─── BONUS ─── */}
      {activeTab === 'bonus' && (
        <div className={sectionCls}>
          <div className="flex justify-between items-center mb-[14px]">
            <div className={sectionTitleCls}>
              <Gift size={15} className="text-[var(--amber)]" />{isBn ? 'বোনাস' : 'Bonuses'}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowPDFModal('bonus')}
                className="flex items-center gap-[5px] py-[7px] px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs font-medium cursor-pointer font-[inherit]">
                <FileText size={13} />PDF
              </button>
              <button onClick={() => setModalType('bonus')}
                className="flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--amber)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
                <Plus size={14} />{isBn ? 'যোগ' : 'Add'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Calendar size={13} className="text-[var(--text-muted)]" />
            <input type="date" value={bonusDateFrom} onChange={e => { setBonusDateFrom(e.target.value); setPage(1) }}
              className={`${inputCls} w-auto max-w-[160px] h-[32px] py-0 px-2 text-[11px]`} />
            <span className="text-[11px] text-[var(--text-muted)]">—</span>
            <input type="date" value={bonusDateTo} onChange={e => { setBonusDateTo(e.target.value); setPage(1) }}
              className={`${inputCls} w-auto max-w-[160px] h-[32px] py-0 px-2 text-[11px]`} />
            <div className="flex h-[32px] shrink-0">
              <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 6); setBonusDateFrom(d.toISOString().split('T')[0]); setBonusDateTo(new Date().toISOString().split('T')[0]) }}
                className="px-[10px] border border-[var(--border)] border-r-0 cursor-pointer font-[inherit] text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all rounded-l-lg">
                6{isBn ? 'মাস' : 'M'}
              </button>
              <button onClick={() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); setBonusDateFrom(d.toISOString().split('T')[0]); setBonusDateTo(new Date().toISOString().split('T')[0]) }}
                className={`px-[10px] border border-[var(--border)] cursor-pointer font-[inherit] text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all ${bonusDateFrom || bonusDateTo ? 'border-r-0' : 'rounded-r-lg'}`}>
                1{isBn ? 'বছর' : 'Y'}
              </button>
              {(bonusDateFrom || bonusDateTo) && (
                <button onClick={() => { setBonusDateFrom(''); setBonusDateTo(''); setPage(1) }}
                  className="px-[10px] border border-[var(--border)] cursor-pointer font-[inherit] text-[11px] bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all rounded-r-lg">
                  {isBn ? 'মুছুন' : 'Clear'}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="py-[10px] px-2 w-9">
                    <input type="checkbox" checked={selectedBon.length === filteredBonuses.length && filteredBonuses.length > 0} onChange={toggleAllBon}
                      className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                  </th>
                  {[isBn ? 'মাস' : 'Month', isBn ? 'শিক্ষক' : 'Teacher', isBn ? 'ধরন' : 'Type', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'মোট' : 'Total', isBn ? 'কারণ' : 'Reason', ''].map(h => (
                    <th key={h || 'action'} className={`py-[10px] px-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap ${h === '' ? 'text-center w-[80px]' : (h === (isBn ? 'পরিমাণ' : 'Amount') || h === (isBn ? 'মোট' : 'Total')) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedBonuses.map(bon => (
                  <tr key={bon.id} className={`border-b border-[var(--border)] ${selectedBon.includes(bon.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                    onMouseEnter={e => { if (!selectedBon.includes(bon.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selectedBon.includes(bon.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td className="py-2 px-2">
                      <input type="checkbox" checked={selectedBon.includes(bon.id)} onChange={() => toggleBon(bon.id)}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                    </td>
                    <td className="py-2 px-2 text-[11px] text-[var(--text-muted)]">{bon.month}</td>
                    <td className="py-2 px-2 text-xs font-medium text-[var(--text-primary)]">{getTeacherName(bon.teacherId)}</td>
                    <td className="py-2 px-2">
                      <span className={`text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium ${bon.type === 'festival' ? 'bg-[var(--amber-light)]' : bon.type === 'performance' ? 'bg-[var(--brand-light)]' : bon.type === 'attendance' ? 'bg-[var(--green-light)]' : 'bg-[var(--teal-light)]'} ${bon.type === 'festival' ? 'text-[var(--amber)]' : bon.type === 'performance' ? 'text-[var(--brand)]' : bon.type === 'attendance' ? 'text-[var(--green)]' : 'text-[var(--teal)]'}`}>{bon.type}</span>
                    </td>
                    <td className="py-2 px-2 text-xs font-semibold text-[var(--text-primary)] text-right">৳{bon.amount.toLocaleString()}</td>
                    <td className="py-2 px-2 text-xs font-bold text-[var(--amber)] text-right">৳{bon.amount.toLocaleString()}</td>
                    <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{bon.reason}</td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => { setBonForm({ teacherId: bon.teacherId, type: bon.type, amount: String(bon.amount), reason: bon.reason, month: bon.month }); setModalType('bonus'); }}
                          className="py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer text-[10px] font-[inherit]">
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => deleteBonus(bon.id)}
                          className="py-1 px-2 rounded border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] cursor-pointer text-[10px] font-[inherit]">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--bg-secondary)] border-t border-t-2 border-[var(--border)]">
                  <td colSpan={4} className="py-2 px-2 text-[11px] font-bold text-[var(--text-primary)]">{isBn ? 'মোট' : 'Total'}</td>
                  <td className="py-2 px-2 text-xs font-bold text-[var(--amber)] text-right">৳{filteredBonuses.reduce((s, b) => s + b.amount, 0).toLocaleString()}</td>
                  <td className="py-2 px-2 text-xs font-bold text-[var(--amber)] text-right">৳{filteredBonuses.reduce((s, b) => s + b.amount, 0).toLocaleString()}</td>
                  <td className="py-2 px-2"></td>
                  <td className="py-2 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filteredBonuses.length > perPage && (
            <div className="py-[10px] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredBonuses.length)} / {filteredBonuses.length}
              </span>
              <div className="flex gap-[3px] items-center">
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  className="py-1 px-[6px] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] font-[inherit] outline-none mr-[6px]">
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                    {ic}
                  </button>
                ))}
                {(() => {
                  const start = Math.max(1, Math.min(page - 2, bonusTotalPages - 4))
                  return Array.from({ length: Math.min(5, bonusTotalPages) }, (_, i) => start + i).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}>
                      {p}
                    </button>
                  ))
                })()}
                {([[<ChevronRight size={12} />, () => setPage(p => Math.min(bonusTotalPages, p + 1)), page === bonusTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(bonusTotalPages), page === bonusTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedBon.length > 0 && (
            <div className="mt-2 text-[11px] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[10px] rounded-md inline-block">
              {selectedBon.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </div>
          )}
        </div>
      )}

      {/* ─── PROMOTION ─── */}
      {activeTab === 'promotion' && (
        <div className={sectionCls}>
          <div className="flex justify-between items-center mb-[14px]">
            <div className={sectionTitleCls}>
              <Award size={15} className="text-[var(--purple)]" />{isBn ? 'পদোন্নতি' : 'Promotions'}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowPDFModal('promotion')}
                className="flex items-center gap-[5px] py-[7px] px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs font-medium cursor-pointer font-[inherit]">
                <FileText size={13} />PDF
              </button>
              <button onClick={() => setModalType('promotion')}
                className="flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--purple)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
                <Plus size={14} />{isBn ? 'যোগ' : 'Add'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Calendar size={13} className="text-[var(--text-muted)]" />
            <input type="date" value={proDateFrom} onChange={e => { setProDateFrom(e.target.value); setPage(1) }}
              className={`${inputCls} w-auto max-w-[160px] h-[32px] py-0 px-2 text-[11px]`} />
            <span className="text-[11px] text-[var(--text-muted)]">—</span>
            <input type="date" value={proDateTo} onChange={e => { setProDateTo(e.target.value); setPage(1) }}
              className={`${inputCls} w-auto max-w-[160px] h-[32px] py-0 px-2 text-[11px]`} />
            <div className="flex h-[32px] shrink-0">
              <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 6); setProDateFrom(d.toISOString().split('T')[0]); setProDateTo(new Date().toISOString().split('T')[0]) }}
                className="px-[10px] border border-[var(--border)] border-r-0 cursor-pointer font-[inherit] text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all rounded-l-lg">
                6{isBn ? 'মাস' : 'M'}
              </button>
              <button onClick={() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); setProDateFrom(d.toISOString().split('T')[0]); setProDateTo(new Date().toISOString().split('T')[0]) }}
                className={`px-[10px] border border-[var(--border)] cursor-pointer font-[inherit] text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all ${proDateFrom || proDateTo ? 'border-r-0' : 'rounded-r-lg'}`}>
                1{isBn ? 'বছর' : 'Y'}
              </button>
              {(proDateFrom || proDateTo) && (
                <button onClick={() => { setProDateFrom(''); setProDateTo(''); setPage(1) }}
                  className="px-[10px] border border-[var(--border)] cursor-pointer font-[inherit] text-[11px] bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all rounded-r-lg">
                  {isBn ? 'মুছুন' : 'Clear'}
                </button>
              )}
            </div>
          </div>
          {filteredPromotions.length === 0 ? (
            <div className="p-[30px] text-center text-[var(--text-muted)] text-[13px]">{isBn ? 'কোনো পদোন্নতি নেই' : 'No promotions yet'}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                      <th className="py-[10px] px-2 w-9">
                        <input type="checkbox" checked={selectedPro.length === filteredPromotions.length && filteredPromotions.length > 0} onChange={toggleAllPro}
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                      </th>
                      {[isBn ? 'তারিখ' : 'Date', isBn ? 'শিক্ষক' : 'Teacher', isBn ? 'পূর্ববর্তী' : 'From', isBn ? 'নতুন' : 'To', isBn ? 'কারণ' : 'Reason', ''].map(h => (
                        <th key={h || 'action'} className={`py-[10px] px-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap ${h === '' ? 'text-center w-[80px]' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPromotions.map(p => (
                      <tr key={p.id} className={`border-b border-[var(--border)] ${selectedPro.includes(p.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                        onMouseEnter={e => { if (!selectedPro.includes(p.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                        onMouseLeave={e => { if (!selectedPro.includes(p.id)) e.currentTarget.style.background = 'transparent' }}>
                        <td className="py-2 px-2">
                          <input type="checkbox" checked={selectedPro.includes(p.id)} onChange={() => togglePro(p.id)}
                            className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                        </td>
                        <td className="py-2 px-2 text-[11px] text-[var(--text-muted)]">{p.date}</td>
                        <td className="py-2 px-2 text-xs font-medium text-[var(--text-primary)]">{getTeacherName(p.teacherId)}</td>
                        <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{p.fromDesignation}</td>
                        <td className="py-2 px-2 text-xs font-semibold text-[var(--green)]">{p.toDesignation}</td>
                        <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{p.reason}</td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => { setProForm({ teacherId: p.teacherId, fromDesignation: p.fromDesignation, toDesignation: p.toDesignation, reason: p.reason }); setModalType('promotion'); }}
                              className="py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer text-[10px] font-[inherit]">
                              <Edit2 size={11} />
                            </button>
                            <button onClick={() => deletePromotion(p.id)}
                              className="py-1 px-2 rounded border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] cursor-pointer text-[10px] font-[inherit]">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPromotions.length > perPage && (
                <div className="py-[10px] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
                  <span className="text-xs text-[var(--text-muted)]">
                    {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredPromotions.length)} / {filteredPromotions.length}
                  </span>
                  <div className="flex gap-[3px] items-center">
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                      className="py-1 px-[6px] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] font-[inherit] outline-none mr-[6px]">
                      <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                    </select>
                    {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                      <button key={i} onClick={a} disabled={d}
                        className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                        {ic}
                      </button>
                    ))}
                    {(() => {
                      const start = Math.max(1, Math.min(page - 2, promotionTotalPages - 4))
                      return Array.from({ length: Math.min(5, promotionTotalPages) }, (_, i) => start + i).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}>
                          {p}
                        </button>
                      ))
                    })()}
                    {([[<ChevronRight size={12} />, () => setPage(p => Math.min(promotionTotalPages, p + 1)), page === promotionTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(promotionTotalPages), page === promotionTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                      <button key={i} onClick={a} disabled={d}
                        className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedPro.length > 0 && (
                <div className="mt-2 text-[11px] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[10px] rounded-md inline-block">
                  {selectedPro.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── FUND ─── */}
      {activeTab === 'fund' && (
        <>
          {/* Institution Fund */}
          <div className={sectionCls}>
            <div className="flex justify-between items-center mb-[14px]">
              <div className={sectionTitleCls}>
                <HandCoins size={15} className="text-[var(--brand)]" />{isBn ? 'প্রতিষ্ঠান তহবিল' : 'Institution Fund'}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setShowPDFModal('fund')}
                  className="flex items-center gap-[5px] py-[7px] px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs font-medium cursor-pointer font-[inherit]">
                  <FileText size={13} />PDF
                </button>
                <button onClick={() => setModalType('fund')}
                  className="flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
                  <Plus size={14} />{isBn ? 'লেনদেন' : 'Transaction'}
                </button>
              </div>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2 mb-[14px] flex-wrap">
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Calendar size={13} />
                <span className="text-[11px] font-medium">{isBn ? 'তারিখ' : 'Date'}:</span>
              </div>
              <input type="date" value={fundDateFrom} onChange={e => { setFundDateFrom(e.target.value); setPage(1) }}
                className="h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none" />
              <span className="text-[var(--text-muted)] text-[11px]">–</span>
              <input type="date" value={fundDateTo} onChange={e => { setFundDateTo(e.target.value); setPage(1) }}
                className="h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none" />
              <div className="flex">
                <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() - 6); setFundDateFrom(d.toISOString().split('T')[0]); setFundDateTo(new Date().toISOString().split('T')[0]); setPage(1) }}
                  className="h-8 px-3 rounded-l-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-primary)]">6M</button>
                <button onClick={() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); setFundDateFrom(d.toISOString().split('T')[0]); setFundDateTo(new Date().toISOString().split('T')[0]); setPage(1) }}
                  className={`h-8 px-3 border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-primary)] ${(fundDateFrom || fundDateTo) ? 'border-r-0' : 'rounded-r-lg'}`}>1Y</button>
                {(fundDateFrom || fundDateTo) && (
                  <button onClick={() => { setFundDateFrom(''); setFundDateTo(''); setPage(1) }}
                    className="h-8 px-3 rounded-r-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--red)] cursor-pointer hover:bg-[var(--bg-primary)]">✕</button>
                )}
              </div>
            </div>

            {/* Fund Balance Summary */}
            <div className={`p-[14px] rounded-[10px] mb-[14px] ${fundBalance >= 0 ? 'bg-[var(--green-light)]' : 'bg-[var(--red-light)]'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[13px] font-semibold ${fundBalance >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{isBn ? 'মোট ব্যালেন্স' : 'Total Balance'}</span>
                <span className={`text-xl font-bold ${fundBalance >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>৳{fundBalance.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--bg-primary)] rounded-lg p-2">
                  <div className="text-[10px] text-[var(--green)] font-medium">{isBn ? 'আয়' : 'Income'}</div>
                  <div className="text-sm font-bold text-[var(--green)]">৳{funds.filter(f => f.type !== 'withdrawal').reduce((s, f) => s + f.amount, 0).toLocaleString()}</div>
                </div>
                <div className="bg-[var(--bg-primary)] rounded-lg p-2">
                  <div className="text-[10px] text-[var(--red)] font-medium">{isBn ? 'খরচ' : 'Expense'}</div>
                  <div className="text-sm font-bold text-[var(--red)]">৳{funds.filter(f => f.type === 'withdrawal').reduce((s, f) => s + f.amount, 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="py-[10px] px-2 w-9">
                      <input type="checkbox" checked={selectedFund.length === filteredFunds.length && filteredFunds.length > 0} onChange={toggleAllFund}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                    </th>
                    {[isBn ? 'তারিখ' : 'Date', isBn ? 'ধরন' : 'Type', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'বিবরণ' : 'Description'].map(h => (
                      <th key={h} className="py-[10px] px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedFunds.map(f => (
                    <tr key={f.id} className={`border-b border-[var(--border)] ${selectedFund.includes(f.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                      onMouseEnter={e => { if (!selectedFund.includes(f.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                      onMouseLeave={e => { if (!selectedFund.includes(f.id)) e.currentTarget.style.background = 'transparent' }}>
                      <td className="py-2 px-2">
                        <input type="checkbox" checked={selectedFund.includes(f.id)} onChange={() => toggleFund(f.id)}
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                      </td>
                      <td className="py-2 px-2 text-[11px] text-[var(--text-muted)]">{f.date}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium ${f.type === 'withdrawal' ? 'bg-[var(--red-light)]' : 'bg-[var(--green-light)]'} ${f.type === 'withdrawal' ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>{f.type.replace('_', ' ')}</span>
                      </td>
                      <td className={`py-2 px-2 text-xs font-semibold ${f.type === 'withdrawal' ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
                        {f.type === 'withdrawal' ? '-' : '+'}৳{f.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredFunds.length > perPage && (
              <div className="py-[10px] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
                <span className="text-xs text-[var(--text-muted)]">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredFunds.length)} / {filteredFunds.length}
                </span>
                <div className="flex gap-[3px] items-center">
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                    className="py-1 px-[6px] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] font-[inherit] outline-none mr-[6px]">
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                  {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                      {ic}
                    </button>
                  ))}
                  {(() => {
                    const start = Math.max(1, Math.min(page - 2, fundTotalPages - 4))
                    return Array.from({ length: Math.min(5, fundTotalPages) }, (_, i) => start + i).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}>
                        {p}
                      </button>
                    ))
                  })()}
                  {([[<ChevronRight size={12} />, () => setPage(p => Math.min(fundTotalPages, p + 1)), page === fundTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(fundTotalPages), page === fundTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedFund.length > 0 && (
              <div className="mt-2 text-[11px] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[10px] rounded-md inline-block">
                {selectedFund.length} {isBn ? 'নির্বাচিত' : 'selected'}
              </div>
            )}
          </div>

          {/* Employee Fund */}
          <div className={sectionCls}>
            <div className={sectionTitleCls}>
              <Users size={15} className="text-[var(--teal)]" />{isBn ? 'কর্মচারী তহবিল' : 'Employee Fund'}
            </div>
            <div className="text-[12px] text-[var(--text-secondary)] mb-3 leading-relaxed">
              {isBn
                ? 'প্রতিটি কর্মচারীর বেতন থেকে মাসিক তহবিল কাটা হয়। চাকরি ছাড়লে তাদের তহবিল + নাফা ফেরত দেওয়া হয়।'
                : 'A monthly fund is deducted from each employee\'s salary. When an employee resigns, their fund + profit is returned.'}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    {[isBn ? 'কর্মচারী' : 'Employee', isBn ? 'বেতন' : 'Salary', isBn ? 'তহবিল %' : 'Fund %', isBn ? 'মাসিক কাটা' : 'Monthly Deduction', isBn ? 'মোট জমা' : 'Total Deposited'].map(h => (
                      <th key={h} className="py-[10px] px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeTeachers.map(t => {
                    const fundPercents = monthlySalaryConfigs
                      .filter(c => c.teacherId === t.id && c.fundContributionPercent > 0)
                      .map(c => c.fundContributionPercent)
                    const avgPercent = fundPercents.length > 0 ? Math.round(fundPercents.reduce((a, b) => a + b, 0) / fundPercents.length) : 0
                    const monthlyDeduction = Math.round(t.salary * avgPercent / 100)
                    const monthsWithFund = fundPercents.length
                    const totalDeposited = monthlyDeduction * monthsWithFund
                    return (
                      <tr key={t.id} className="border-b border-[var(--border)]"
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="py-2 px-2">
                          <div className="text-xs font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{t.designation}</div>
                        </td>
                        <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">৳{t.salary.toLocaleString()}</td>
                        <td className="py-2 px-2 text-xs font-medium text-[var(--brand)]">{avgPercent > 0 ? `${avgPercent}%` : '—'}</td>
                        <td className="py-2 px-2 text-xs font-semibold text-[var(--red)]">{monthlyDeduction > 0 ? `৳${monthlyDeduction.toLocaleString()}` : '—'}</td>
                        <td className="py-2 px-2 text-xs font-bold text-[var(--green)]">{totalDeposited > 0 ? `৳${totalDeposited.toLocaleString()}` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── SALARY SETUP ─── */}
      {activeTab === 'salary-setup' && (
        <div className={sectionCls}>
          <div className="flex justify-between items-center mb-[14px] flex-wrap gap-2">
            <div className={sectionTitleCls}>
              <Calculator size={15} className="text-[var(--teal)]" />{isBn ? 'মাসিক বেতন সেটআপ' : 'Monthly Salary Setup'}
            </div>
            <div className="flex gap-2 items-center">
              <input type="month" value={salarySetupMonth} onChange={e => setSalarySetupMonth(e.target.value)}
                className={`${inputCls} w-auto max-w-[160px] py-[6px] px-[10px] text-xs`} />
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
                className="flex items-center gap-[5px] py-[7px] px-4 rounded-lg bg-[var(--teal)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
                <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
              <button onClick={() => setShowPDFModal('salary')}
                className="flex items-center gap-[5px] py-[7px] px-4 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
                <Download size={14} />PDF
              </button>
            </div>
          </div>

          {salarySaved && (
            <div className="mb-3 py-2 px-3 rounded-lg bg-[var(--green-light)] text-[var(--green)] text-xs font-medium">
              <CheckCircle2 size={14} className="inline mr-[6px]" />
              {isBn ? 'বেতন সেটআপ সংরক্ষিত হয়েছে!' : 'Salary setup saved!'}
            </div>
          )}

          {/* Bulk Salary Setup Section */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg py-2 px-3 mb-3 flex items-center gap-4 flex-wrap">
            <div className="text-[10px] font-semibold text-[var(--text-primary)] flex items-center gap-1 whitespace-nowrap">
              <Calculator size={11} className="text-[var(--teal)]" />{isBn ? 'বাল্ক সেটআপ' : 'Bulk Setup'}
            </div>
            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                <input type="checkbox" checked={bulkDeductionEnabled} onChange={e => setBulkDeductionEnabled(e.target.checked)}
                  className="w-[11px] h-[11px] cursor-pointer accent-[var(--red)]" />
                <TrendingDown size={10} className="text-[var(--red)]" />
                {isBn ? 'কাটা' : 'Deduction'}
              </label>
              {bulkDeductionEnabled && (
                <>
                  <input type="date" value={bulkDeductionFrom} onChange={e => setBulkDeductionFrom(e.target.value)}
                    className="py-[3px] px-[5px] rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[10px] font-[inherit] outline-none w-[110px]" />
                  <span className="text-[9px] text-[var(--text-muted)]">-</span>
                  <input type="date" value={bulkDeductionTo} onChange={e => setBulkDeductionTo(e.target.value)}
                    className="py-[3px] px-[5px] rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[10px] font-[inherit] outline-none w-[110px]" />
                </>
              )}
              <button onClick={handleBulkApplyDeduction}
                className={`py-[3px] px-2 rounded border-none text-[9px] font-medium cursor-pointer font-[inherit] whitespace-nowrap ${bulkDeductionEnabled ? 'bg-[var(--red)]' : 'bg-[var(--border)]'} ${bulkDeductionEnabled ? 'text-white' : 'text-[var(--text-muted)]'}`}>
                {isBn ? 'প্রয়োগ' : 'Apply'}
              </button>
            </div>
            <div className="w-[1px] h-4 bg-[var(--border)]" />
            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                <input type="checkbox" checked={bulkFundEnabled} onChange={e => setBulkFundEnabled(e.target.checked)}
                  className="w-[11px] h-[11px] cursor-pointer accent-[var(--brand)]" />
                <HandCoins size={10} className="text-[var(--brand)]" />
                {isBn ? 'তহবিল' : 'Fund'}
              </label>
              {bulkFundEnabled && (
                <input type="number" value={bulkFundPercent} onChange={e => setBulkFundPercent(e.target.value)}
                  className="py-[3px] px-[5px] rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[10px] font-[inherit] outline-none w-[45px] text-right"
                  placeholder="%" min={0} max={100} />
              )}
              {bulkFundEnabled && <span className="text-[9px] text-[var(--text-muted)]">%</span>}
              <button onClick={handleBulkApplyFund}
                className={`py-[3px] px-2 rounded border-none text-[9px] font-medium cursor-pointer font-[inherit] whitespace-nowrap ${bulkFundEnabled ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'} ${bulkFundEnabled ? 'text-white' : 'text-[var(--text-muted)]'}`}>
                {isBn ? 'প্রয়োগ' : 'Apply'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[900px]">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="py-2 px-[10px] text-center w-9">
                    <input type="checkbox" checked={selectedSalary.length === activeTeachers.length && activeTeachers.length > 0}
                      onChange={toggleAllSalary}
                      className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                  </th>
                  <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'কর্মচারী' : 'Employee'}</th>
                  <th className="py-2 px-2 text-right text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'মূল বেতন' : 'Basic'}</th>
                  <th className="py-2 px-[6px] text-right text-[9px] font-semibold text-[var(--green)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'কর্মদক্ষতা' : 'Perf.'}</th>
                  <th className="py-2 px-[6px] text-right text-[9px] font-semibold text-[var(--teal)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'উপস্থিতি' : 'Atten.'}</th>
                  <th className="py-2 px-[6px] text-right text-[9px] font-semibold text-[var(--purple)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'বিশেষ' : 'Special'}</th>
                  <th className="py-2 px-[6px] text-right text-[9px] font-semibold text-[var(--amber)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'উৎসব' : 'Festival'}</th>
                  <th className="py-2 px-2 text-right text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'মোট বোনাস' : 'Total B.'}</th>
                  <th className="py-2 px-[6px] text-center text-[9px] font-semibold text-[var(--red)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'কাটা' : 'Ded.'}</th>
                  <th className="py-2 px-[6px] text-right text-[9px] font-semibold text-[var(--brand)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'তহবিল' : 'Fund'}</th>
                  <th className="py-2 px-2 text-right text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.3px] whitespace-nowrap">{isBn ? 'নেট বেতন' : 'Net Pay'}</th>
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
                    <tr key={t.id} className="border-b border-[var(--border)]"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-[7px] px-[10px] text-center">
                        <input type="checkbox" checked={selectedSalary.includes(t.id)}
                          onChange={() => toggleSalary(t.id)}
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                      </td>
                      <td className="py-[7px] px-2">
                        <div className="text-[11px] font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">{t.designation}</div>
                      </td>
                      <td className="py-[7px] px-2 text-right text-[11px] font-semibold text-[var(--text-primary)]">৳{t.salary.toLocaleString()}</td>
                      <td className={`py-[7px] px-[6px] text-right text-[10px] font-medium ${perfBonus > 0 ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>
                        {perfBonus > 0 ? `৳${perfBonus.toLocaleString()}` : '-'}
                      </td>
                      <td className={`py-[7px] px-[6px] text-right text-[10px] font-medium ${attenBonus > 0 ? 'text-[var(--teal)]' : 'text-[var(--text-muted)]'}`}>
                        {attenBonus > 0 ? `৳${attenBonus.toLocaleString()}` : '-'}
                      </td>
                      <td className={`py-[7px] px-[6px] text-right text-[10px] font-medium ${specialBonus > 0 ? 'text-[var(--purple)]' : 'text-[var(--text-muted)]'}`}>
                        {specialBonus > 0 ? `৳${specialBonus.toLocaleString()}` : '-'}
                      </td>
                      <td className={`py-[7px] px-[6px] text-right text-[10px] font-medium ${festivalBonus > 0 ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'}`}>
                        {festivalBonus > 0 ? `৳${festivalBonus.toLocaleString()}` : '-'}
                      </td>
                      <td className={`py-[7px] px-2 text-right text-[11px] font-bold ${totalBonus > 0 ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>
                        {totalBonus > 0 ? `৳${totalBonus.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-[7px] px-[6px] text-center">
                        <input type="checkbox" checked={applyDeduction} onChange={e => setSalaryConfigs(p => ({ ...p, [t.id]: { ...p[t.id], applyDeductionRule: e.target.checked, bonus: p[t.id]?.bonus ?? 0, festivalBonus: p[t.id]?.festivalBonus ?? 0, fundContributionPercent: p[t.id]?.fundContributionPercent ?? 0 } }))}
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                      </td>
                      <td className={`py-[7px] px-[6px] text-right text-[10px] font-medium ${fundAmount > 0 ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>
                        {fundPercent > 0 ? `${fundPercent}%` : '-'}
                      </td>
                      <td className="py-[7px] px-2 text-right text-[11px] font-bold text-[var(--green)]">
                        ৳{netPay.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--bg-secondary)] border-t border-t-2 border-[var(--border)]">
                  <td className="py-2 px-[10px]"></td>
                  <td className="py-2 px-2 text-[11px] font-bold text-[var(--text-primary)]">{isBn ? 'মোট' : 'Total'}</td>
                  <td className="py-2 px-2 text-right text-[11px] font-bold">৳{activeTeachers.reduce((s, t) => s + t.salary, 0).toLocaleString()}</td>
                  <td className="py-2 px-[6px] text-right text-[10px] font-bold text-[var(--green)]">৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'performance').reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td className="py-2 px-[6px] text-right text-[10px] font-bold text-[var(--teal)]">৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'attendance').reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td className="py-2 px-[6px] text-right text-[10px] font-bold text-[var(--purple)]">৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'special').reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td className="py-2 px-[6px] text-right text-[10px] font-bold text-[var(--amber)]">৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'festival').reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-[11px] font-bold text-[var(--green)]">৳{activeTeachers.reduce((s, t) => s + bonuses.filter(b => b.teacherId === t.id && b.month === salarySetupMonth).reduce((sum, b) => sum + b.amount, 0), 0).toLocaleString()}</td>
                  <td className="py-2 px-[6px] text-right text-[10px] font-bold text-[var(--red)]">৳{activeTeachers.reduce((s, t) => {
                    const local = salaryConfigs[t.id]
                    const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
                    const ded = (local?.applyDeductionRule ?? existing?.applyDeductionRule ?? false) ? Math.round(t.salary / 30) : 0
                    return s + ded
                  }, 0).toLocaleString()}</td>
                  <td className="py-2 px-[6px] text-right text-[10px] font-bold text-[var(--brand)]">৳{activeTeachers.reduce((s, t) => {
                    const local = salaryConfigs[t.id]
                    const existing = monthlySalaryConfigs.find(c => c.teacherId === t.id && c.month === salarySetupMonth)
                    const fund = Math.round(t.salary * (local?.fundContributionPercent ?? existing?.fundContributionPercent ?? 0) / 100)
                    return s + fund
                  }, 0).toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-xs font-bold text-[var(--green)]">
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
            <div className="py-[10px] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                {(page - 1) * perPage + 1}–{Math.min(page * perPage, activeTeachers.length)} / {activeTeachers.length}
              </span>
              <div className="flex gap-[3px] items-center">
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                  className="py-1 px-[6px] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] font-[inherit] outline-none mr-[6px]">
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                    {ic}
                  </button>
                ))}
                {(() => {
                  const start = Math.max(1, Math.min(page - 2, salaryTotalPages - 4))
                  return Array.from({ length: Math.min(5, salaryTotalPages) }, (_, i) => start + i).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}>
                      {p}
                    </button>
                  ))
                })()}
                {([[<ChevronRight size={12} />, () => setPage(p => Math.min(salaryTotalPages, p + 1)), page === salaryTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(salaryTotalPages), page === salaryTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                  <button key={i} onClick={a} disabled={d}
                    className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedSalary.length > 0 && (
            <div className="mt-2 text-[11px] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[10px] rounded-md inline-block">
              {selectedSalary.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </div>
          )}
        </div>
      )}

      {/* ─── FACILITIES ─── */}
      {activeTab === 'facilities' && (
        <>
          {/* Facility Definitions */}
          <div className={sectionCls}>
            <div className="flex justify-between items-center mb-[14px] flex-wrap gap-2">
              <div className={sectionTitleCls}>
                <Briefcase size={15} className="text-[var(--purple)]" />{isBn ? 'সুবিধার ধরন' : 'Facility Types'}
              </div>
              <button onClick={() => { setFacForm({ name: '', nameBn: '', defaultAmount: '', type: 'monthly' }); setEditFac(null); setFacModalType('add-facility') }}
                className="flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--purple-light)] border border-[var(--purple)] text-[var(--purple)] text-xs font-medium cursor-pointer font-[inherit]">
                <Plus size={14} />{isBn ? 'নতুন সুবিধা' : 'Add Facility'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    {[
                      { l: '#', w: '50px', align: 'center' as const },
                      { l: isBn ? 'নাম (ইংরেজি)' : 'Name (EN)', align: 'left' as const },
                      { l: isBn ? 'নাম (বাংলা)' : 'Name (BN)', align: 'left' as const },
                      { l: isBn ? 'ধরন' : 'Type', w: '90px', align: 'center' as const },
                      { l: isBn ? 'ডিফল্ট পরিমাণ' : 'Default Amount', w: '120px', align: 'right' as const },
                      { l: isBn ? 'অবস্থা' : 'Status', w: '80px', align: 'center' as const },
                      { l: isBn ? 'অ্যাকশন' : 'Action', w: '90px', align: 'center' as const },
                    ].map(h => (
                      <th key={h.l} className="py-[10px] px-2 h.align text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap">{h.l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {facilities.length === 0 ? (
                    <tr><td colSpan={7} className="p-[30px] text-center text-[var(--text-muted)]">
                      <Briefcase size={24} className="block m-[0 auto 6px] opacity-30" />
                      {isBn ? 'কোনো সুবিধা পাওয়া যায়নি' : 'No facilities found'}
                    </td></tr>
                  ) : facilities.map((f, i) => (
                    <tr key={f.id} className="border-b border-[var(--border)]"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-[10px] px-2 text-[var(--text-muted)] text-[11px] text-center">{i + 1}</td>
                      <td className="py-[10px] px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-[var(--purple-light)] flex items-center justify-center shrink-0">
                            <Briefcase size={13} className="text-[var(--purple)]" />
                          </div>
                          <span className="text-xs font-medium text-[var(--text-primary)]">{f.name}</span>
                        </div>
                      </td>
                      <td className="py-[10px] px-2 text-xs text-[var(--text-secondary)]">{f.nameBn || '—'}</td>
                      <td className="py-[10px] px-2 text-center">
                        <span className={`text-[10px] py-[2px] px-2 rounded-full font-medium ${f.type === 'monthly' ? 'bg-[var(--brand-light)]' : 'bg-[var(--amber-light)]'} ${f.type === 'monthly' ? 'text-[var(--brand)]' : 'text-[var(--amber)]'}`}>
                          {f.type === 'monthly' ? (isBn ? 'মাসিক' : 'Monthly') : (isBn ? 'এককালীন' : 'One-time')}
                        </span>
                      </td>
                      <td className="py-[10px] px-2 text-xs font-semibold text-[var(--text-primary)] text-right">৳{f.defaultAmount.toLocaleString()}</td>
                      <td className="py-[10px] px-2 text-center">
                        <span className={`text-[10px] py-[3px] px-2 rounded-full font-medium ${f.isActive ? 'bg-[var(--green-light)]' : 'bg-[var(--red-light)]'} ${f.isActive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                          {f.isActive ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                        </span>
                      </td>
                      <td className="py-[10px] px-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => { setFacForm({ name: f.name, nameBn: f.nameBn, defaultAmount: String(f.defaultAmount), type: f.type }); setEditFac(f); setFacModalType('edit-facility') }}
                            title={isBn ? 'এডিট' : 'Edit'}
                            className="w-[26px] h-[26px] rounded-md bg-[var(--amber-light)] border-none cursor-pointer flex items-center justify-center text-[var(--amber)]">
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => setFacDeleteConfirm(f.id)}
                            title={isBn ? 'মুছুন' : 'Delete'}
                            className="w-[26px] h-[26px] rounded-md bg-[var(--red-light)] border-none cursor-pointer flex items-center justify-center text-[var(--red)]">
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
          <div className={sectionCls}>
            <div className="flex justify-between items-center mb-[14px] flex-wrap gap-2">
              <div className={sectionTitleCls}>
                <Users size={15} className="text-[var(--brand)]" />{isBn ? 'কর্মচারী সুবিধা প্যানেল' : 'Staff Facility Panel'}
              </div>
            </div>

            {/* Staff selector + filters */}
            <div className={`grid gap-[10px] mb-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-[5px] block">{isBn ? 'কর্মচারী নির্বাচন' : 'Select Staff'}</label>
                <select value={selectedFacStaff} onChange={e => setSelectedFacStaff(e.target.value)}
                  className="w-full h-9 py-0 px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border appearance-auto">
                  <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select staff...'}</option>
                  {filteredFacStaff.map(t => <option key={t.id} value={t.id}>{t.nameEn} ({t.designation})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-[5px] block">{isBn ? 'বিভাগ' : 'Department'}</label>
                <select value={facStaffFilter} onChange={e => setFacStaffFilter(e.target.value)}
                  className="w-full h-9 py-0 px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border appearance-auto">
                  <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{isBn ? d.nameBn : d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-[5px] block">{isBn ? 'অনুসন্ধান' : 'Search'}</label>
                <input value={facStaffSearch} onChange={e => setFacStaffSearch(e.target.value)}
                  className="w-full h-9 py-0 px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border"
                  placeholder={isBn ? 'নাম, আইডি...' : 'Name, ID...'} />
              </div>
            </div>

            {/* Facility checklist for selected staff */}
            {selectedFacStaff && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] p-[14px]">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {teachers.find(t => t.id === selectedFacStaff)?.nameEn || ''}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {isBn ? 'সুবিধা চেক করুন এবং পরিমাণ সেট করুন' : 'Check facilities and set amounts'}
                    </div>
                  </div>
                  <button onClick={handleSaveStaffFacilities}
                    className="flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]">
                    <Save size={13} />{isBn ? 'সংরক্ষণ' : 'Save'}
                  </button>
                </div>

                <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {selectedStaffFacilities.map(sf => (
                    <div key={sf.facility.id} className="flex items-center gap-[10px] p-[10px] rounded-lg bg-[var(--bg-primary)] transition-all">
                      <input type="checkbox" checked={sf.assigned} onChange={() => toggleStaffFacility(sf.facility.id)}
                        className="w-[15px] h-[15px] cursor-pointer accent-[var(--brand)] shrink-0" />
                      <div className="flex-1 min-w-[0]">
                        <div className="text-xs font-medium text-[var(--text-primary)]">{isBn ? sf.facility.nameBn : sf.facility.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{sf.facility.name}</div>
                      </div>
                      {sf.assigned && (
                        <div className="flex items-center gap-[3px] shrink-0">
                          <span className="text-[11px] text-[var(--text-muted)]">৳</span>
                          <input type="number" value={sf.amount} onChange={e => updateStaffFacilityAmount(sf.facility.id, Number(e.target.value) || 0)}
                            className={`${inputCls} w-[70px] py-1 px-[6px] text-[11px] text-right`}
                            placeholder="0" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-3 py-2 px-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] flex justify-between items-center">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {isBn ? 'মোট সুবিধা' : 'Total Facilities'}: {selectedStaffFacilities.filter(sf => sf.assigned).length} / {facilities.length}
                  </span>
                  <span className="text-[13px] font-bold text-[var(--green)]">
                    ৳{selectedStaffFacilities.filter(sf => sf.assigned).reduce((s, sf) => s + sf.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {!selectedFacStaff && (
              <div className="p-[30px] text-center text-[var(--text-muted)] text-xs">
                <Users size={24} className="block m-[0 auto 8px] opacity-30" />
                {isBn ? 'একজন কর্মচারী নির্বাচন করুন তার সুবিধা দেখতে' : 'Select a staff member to manage their facilities'}
              </div>
            )}
          </div>

          {/* All Assignments Summary */}
          <div className={sectionCls}>
            <div className="flex justify-between items-center mb-[14px] flex-wrap gap-2">
              <div className={sectionTitleCls}>
                <HandCoins size={15} className="text-[var(--teal)]" />{isBn ? 'সকল বরাদ্দ' : 'All Assignments'}
                <span className="text-[11px] font-medium text-[var(--text-muted)] ml-2">({filteredAssignments.length})</span>
              </div>
              <div className="flex gap-1.5 items-center flex-wrap">
                <input type="date" value={assignDateFrom} onChange={e => { setAssignDateFrom(e.target.value); setPage(1) }}
                  className={`${inputCls} w-auto max-w-[160px] py-[5px] px-2 text-[11px]`} />
                <span className="text-[11px] text-[var(--text-muted)]">—</span>
                <input type="date" value={assignDateTo} onChange={e => { setAssignDateTo(e.target.value); setPage(1) }}
                  className={`${inputCls} w-auto max-w-[160px] py-[5px] px-2 text-[11px]`} />
                {selectedAssign.length > 0 && (
                  <button onClick={() => setShowPDFModal('assignment')}
                    className="flex items-center gap-[5px] py-[6px] px-[10px] rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[11px] font-medium cursor-pointer font-[inherit]">
                    <FileText size={12} />PDF ({selectedAssign.length})
                  </button>
                )}
              </div>
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="p-5 text-center text-[var(--text-muted)] text-xs">
                {isBn ? 'কোনো বরাদ্দ নেই' : 'No assignments yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[550px]">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                      <th className="p-2 w-9">
                        <input type="checkbox" checked={selectedAssign.length === filteredAssignments.length && filteredAssignments.length > 0} onChange={() => setSelectedAssign(p => p.length === filteredAssignments.length ? [] : filteredAssignments.map(tf => tf.id))}
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                      </th>
                      {[
                        { l: '#', w: '40px', align: 'center' as const },
                        { l: isBn ? 'কর্মচারী' : 'Employee', align: 'left' as const },
                        { l: isBn ? 'সুবিধা' : 'Facility', align: 'left' as const },
                        { l: isBn ? 'পরিমাণ' : 'Amount', w: '100px', align: 'right' as const },
                        { l: '', w: '60px', align: 'center' as const },
                      ].map(h => (
                        <th key={h.l} className="p-2 h.align text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap">{h.l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssignments.map((tf, i) => {
                      const t = teachers.find(tx => tx.id === tf.teacherId)
                      const fac = facilities.find(f => f.id === tf.facilityId)
                      const isSelected = selectedAssign.includes(tf.id)
                      return (
                        <tr key={tf.id} className={`border-b border-b-[0.5px] border-[var(--border)] ${isSelected ? 'bg-[var(--brand-light)]' : 'bg-transparent'}`}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                          <td className="p-2">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleAssign(tf.id)}
                              className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                          </td>
                          <td className="p-2 text-[var(--text-muted)] text-[10px] text-center">{i + 1}</td>
                          <td className="p-2 text-[11px] font-medium text-[var(--text-primary)]">{t?.nameEn || tf.teacherId}</td>
                          <td className="p-2 text-[11px] text-[var(--text-secondary)]">{isBn ? (fac?.nameBn || fac?.name) : fac?.name}</td>
                          <td className="p-2 text-[11px] font-semibold text-[var(--green)] text-right">৳{tf.amount.toLocaleString()}</td>
                          <td className="p-2 text-center">
                            <button onClick={() => setAssignDeleteConfirm(tf.id)} title={isBn ? 'মুছুন' : 'Delete'}
                              className="w-[22px] h-[22px] rounded-[5px] bg-[var(--red-light)] border-none cursor-pointer flex items-center justify-center text-[var(--red)]">
                              <Trash2 size={10} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--bg-secondary)] border-t border-t-2 border-[var(--border)]">
                      <td colSpan={4} className="p-2 text-[11px] font-bold text-[var(--text-primary)]">{isBn ? 'মোট' : 'Total'}</td>
                      <td className="p-2 text-xs font-bold text-[var(--green)] text-right">৳{filteredAssignments.reduce((sum, tf) => sum + tf.amount, 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {filteredAssignments.length > perPage && (
              <div className="py-[10px] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
                <span className="text-xs text-[var(--text-muted)]">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredAssignments.length)} / {filteredAssignments.length}
                </span>
                <div className="flex gap-[3px] items-center">
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                    className="py-1 px-[6px] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] font-[inherit] outline-none mr-[6px]">
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                  {([[<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean], [<ChevronLeft size={12} />, () => setPage(p => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                      {ic}
                    </button>
                  ))}
                  {(() => {
                    const start = Math.max(1, Math.min(page - 2, assignmentTotalPages - 4))
                    return Array.from({ length: Math.min(5, assignmentTotalPages) }, (_, i) => start + i).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}>
                        {p}
                      </button>
                    ))
                  })()}
                  {([[<ChevronRight size={12} />, () => setPage(p => Math.min(assignmentTotalPages, p + 1)), page === assignmentTotalPages] as [React.ReactNode, () => void, boolean], [<ChevronsRight size={12} />, () => setPage(assignmentTotalPages), page === assignmentTotalPages] as [React.ReactNode, () => void, boolean]]).map(([ic, a, d], i) => (
                    <button key={i} onClick={a} disabled={d}
                      className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedAssign.length > 0 && (
              <div className="mt-2 text-[11px] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[10px] rounded-md inline-block">
                {selectedAssign.length} {isBn ? 'নির্বাচিত' : 'selected'}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── MODAL ─── */}
      {modalType && (
        <div className={modalOverlayCls} onClick={() => setModalType(null)}>
          <div className={`modal-content ${modalStyleCls}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {modalType === 'increment' && (isBn ? 'বেতন বৃদ্ধি যোগ' : 'Add Increment')}
                {modalType === 'bonus' && (isBn ? 'বোনাস যোগ' : 'Add Bonus')}
                {modalType === 'promotion' && (isBn ? 'পদোন্নতি যোগ' : 'Add Promotion')}
                {modalType === 'fund' && (isBn ? 'লেনদেন যোগ' : 'Add Transaction')}
              </h2>
              <button onClick={() => setModalType(null)}
                className="p-[6px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] flex">
                <X size={16} />
              </button>
            </div>

            {modalType === 'increment' && (
              <div className="flex flex-col gap-3">
                <div><label className={labelCls}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select value={incForm.teacherId} onChange={e => setIncForm(p => ({ ...p, teacherId: e.target.value }))} className={inputCls}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select value={incForm.type} onChange={e => setIncForm(p => ({ ...p, type: e.target.value as any }))} className={inputCls}>
                    <option value="annual">{isBn ? 'বার্ষিক' : 'Annual'}</option>
                    <option value="performance">{isBn ? 'কর্মদক্ষতা' : 'Performance'}</option>
                    <option value="special">{isBn ? 'বিশেষ' : 'Special'}</option>
                  </select>
                </div>
                <div><label className={labelCls}>{isBn ? 'শতাংশ' : 'Percentage (%)'}</label>
                  <input type="number" value={incForm.percentage} onChange={e => setIncForm(p => ({ ...p, percentage: e.target.value }))} className={inputCls} placeholder="5" />
                </div>
                <div><label className={labelCls}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input value={incForm.reason} onChange={e => setIncForm(p => ({ ...p, reason: e.target.value }))} className={inputCls} />
                </div>
                <button onClick={handleAddIncrement}
                  className="p-[9px] rounded-lg bg-[var(--green)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5">
                  <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'bonus' && (
              <div className="flex flex-col gap-3">
                <div><label className={labelCls}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select value={bonForm.teacherId} onChange={e => setBonForm(p => ({ ...p, teacherId: e.target.value }))} className={inputCls}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select value={bonForm.type} onChange={e => setBonForm(p => ({ ...p, type: e.target.value as any }))} className={inputCls}>
                    <option value="festival">{isBn ? 'উৎসব' : 'Festival'}</option>
                    <option value="performance">{isBn ? 'কর্মদক্ষতা' : 'Performance'}</option>
                    <option value="attendance">{isBn ? 'উপস্থিতি' : 'Attendance'}</option>
                    <option value="special">{isBn ? 'বিশেষ' : 'Special'}</option>
                  </select>
                </div>
                <div><label className={labelCls}>{isBn ? 'পরিমাণ' : 'Amount (৳)'}</label>
                  <input type="number" value={bonForm.amount} onChange={e => setBonForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} placeholder="5000" />
                </div>
                <div><label className={labelCls}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input value={bonForm.reason} onChange={e => setBonForm(p => ({ ...p, reason: e.target.value }))} className={inputCls} />
                </div>
                <button onClick={handleAddBonus}
                  className="p-[9px] rounded-lg bg-[var(--amber)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5">
                  <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'promotion' && (
              <div className="flex flex-col gap-3">
                <div><label className={labelCls}>{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                  <select value={proForm.teacherId} onChange={e => { const t = activeTeachers.find(tx => tx.id === e.target.value); setProForm(p => ({ ...p, teacherId: e.target.value, fromDesignation: t?.designation || '' })) }} className={inputCls}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn} ({t.designation})</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>{isBn ? 'বর্তমান পদবি' : 'From'}</label>
                  <select value={proForm.fromDesignation} onChange={e => setProForm(p => ({ ...p, fromDesignation: e.target.value }))} className={inputCls}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {allDesignations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>{isBn ? 'নতুন পদবি' : 'To'}</label>
                  <select value={proForm.toDesignation} onChange={e => setProForm(p => ({ ...p, toDesignation: e.target.value }))} className={inputCls}>
                    <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                    {allDesignations.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>{isBn ? 'কারণ' : 'Reason'}</label>
                  <input value={proForm.reason} onChange={e => setProForm(p => ({ ...p, reason: e.target.value }))} className={inputCls} />
                </div>
                <button onClick={handleAddPromotion}
                  className="p-[9px] rounded-lg bg-[var(--purple)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5">
                  <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            {modalType === 'fund' && (
              <div className="flex flex-col gap-3">
                <div><label className={labelCls}>{isBn ? 'ধরন' : 'Type'}</label>
                  <select value={fundForm.type} onChange={e => setFundForm(p => ({ ...p, type: e.target.value as any }))} className={inputCls}>
                    <option value="contribution">{isBn ? 'অনুদান' : 'Contribution'}</option>
                    <option value="bonus_pool">{isBn ? 'বোনাস পুল' : 'Bonus Pool'}</option>
                    <option value="increment_pool">{isBn ? 'বৃদ্ধি পুল' : 'Increment Pool'}</option>
                    <option value="withdrawal">{isBn ? 'উত্তোলন' : 'Withdrawal'}</option>
                  </select>
                </div>
                <div><label className={labelCls}>{isBn ? 'পরিমাণ' : 'Amount (৳)'}</label>
                  <input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} placeholder="10000" />
                </div>
                <div><label className={labelCls}>{isBn ? 'বিবরণ' : 'Description'}</label>
                  <input value={fundForm.description} onChange={e => setFundForm(p => ({ ...p, description: e.target.value }))} className={inputCls} />
                </div>
                <button onClick={handleAddFund}
                  className="p-[9px] rounded-lg bg-[var(--brand)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5">
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
            showPDFModal === 'promotion' ? filteredPromotions.length :
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
        <div className={modalOverlayCls} onClick={() => { setFacModalType(null); setEditFac(null) }}>
          <div className={`modal-content ${modalStyleCls}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {facModalType === 'add-facility' ? (isBn ? 'নতুন সুবিধা যোগ' : 'Add Facility') : (isBn ? 'সুবিধা এডিট করুন' : 'Edit Facility')}
              </h2>
              <button onClick={() => { setFacModalType(null); setEditFac(null) }}
                className="p-[6px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] flex">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div><label className={labelCls}>{isBn ? 'নাম (ইংরেজি) *' : 'Name (English) *'}</label>
                <input value={facForm.name} onChange={e => setFacForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder={isBn ? 'সুবিধার নাম' : 'Facility name'} />
              </div>
              <div><label className={labelCls}>{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</label>
                <input value={facForm.nameBn} onChange={e => setFacForm(p => ({ ...p, nameBn: e.target.value }))} className={inputCls} placeholder={isBn ? 'বাংলায় নাম' : 'Bangla name'} />
              </div>
              <div><label className={labelCls}>{isBn ? 'ডিফল্ট পরিমাণ (৳)' : 'Default Amount (৳)'}</label>
                <input type="number" value={facForm.defaultAmount} onChange={e => setFacForm(p => ({ ...p, defaultAmount: e.target.value }))} className={inputCls} placeholder="0" />
              </div>
              <div><label className={labelCls}>{isBn ? 'ধরন' : 'Type'}</label>
                <select value={facForm.type} onChange={e => setFacForm(p => ({ ...p, type: e.target.value as 'monthly' | 'oneTime' }))} className={inputCls}>
                  <option value="monthly">{isBn ? 'মাসিক' : 'Monthly'}</option>
                  <option value="oneTime">{isBn ? 'এককালীন' : 'One-time'}</option>
                </select>
              </div>
              <button onClick={facModalType === 'add-facility' ? handleAddFacility : handleEditFacility}
                className="p-[9px] rounded-lg bg-[var(--purple)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5">
                <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(facModalType === 'assign' || facModalType === 'edit-assign') && (
        <div className={modalOverlayCls} onClick={() => { setFacModalType(null); setEditAssign(null) }}>
          <div className={`modal-content ${modalStyleCls}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {facModalType === 'assign' ? (isBn ? 'সুবিধা বরাদ্দ করুন' : 'Assign Facility') : (isBn ? 'বরাদ্দ এডিট করুন' : 'Edit Assignment')}
              </h2>
              <button onClick={() => { setFacModalType(null); setEditAssign(null) }}
                className="p-[6px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer text-[var(--text-muted)] flex">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div><label className={labelCls}>{isBn ? 'কর্মচারী *' : 'Employee *'}</label>
                <select value={assignForm.teacherId} onChange={e => setAssignForm(p => ({ ...p, teacherId: e.target.value }))} className={inputCls}
                  disabled={facModalType === 'edit-assign'}>
                  <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                  {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.nameEn} ({t.designation})</option>)}
                </select>
              </div>
              <div><label className={labelCls}>{isBn ? 'সুবিধা *' : 'Facility *'}</label>
                <select value={assignForm.facilityId} onChange={e => {
                  const fac = facilities.find(f => f.id === e.target.value)
                  setAssignForm(p => ({ ...p, facilityId: e.target.value, amount: fac ? String(fac.defaultAmount) : p.amount }))
                }} className={inputCls}
                  disabled={facModalType === 'edit-assign'}>
                  <option value="">{isBn ? 'নির্বাচন করুন' : 'Select...'}</option>
                  {facilities.filter(f => f.isActive).map(f => <option key={f.id} value={f.id}>{isBn ? f.nameBn : f.name}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>{isBn ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</label>
                <input type="number" value={assignForm.amount} onChange={e => setAssignForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} placeholder="0" />
              </div>
              <button onClick={facModalType === 'assign' ? handleAssignFacility : handleEditAssign}
                className="p-[9px] rounded-lg bg-[var(--brand)] border-none text-white text-[13px] font-medium cursor-pointer font-[inherit] flex items-center justify-center gap-1.5">
                <Save size={14} />{isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facility Delete Confirmation */}
      {facDeleteConfirm && (
        <div className={modalOverlayCls} onClick={() => setFacDeleteConfirm(null)}>
          <div className={`modal-content ${modalStyleCls} max-w-[380px]`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-[10px] mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
                <AlertCircle size={18} className="text-[var(--red)]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</h3>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-4">
              {isBn ? 'এই সুবিধাটি স্থায়ীভাবে মুছে ফেলা হবে। সম্পর্কিত সব বরাদ্দও মুছে ফেলা হবে।' : 'This facility will be permanently deleted. All related assignments will also be removed.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setFacDeleteConfirm(null)}
                className="py-2 px-[14px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] cursor-pointer font-[inherit]">
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={() => { deleteFacility(facDeleteConfirm); setFacDeleteConfirm(null) }}
                className="py-2 px-[14px] rounded-lg bg-[var(--red)] border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit]">
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Delete Confirmation */}
      {assignDeleteConfirm && (
        <div className={modalOverlayCls} onClick={() => setAssignDeleteConfirm(null)}>
          <div className={`modal-content ${modalStyleCls} max-w-[380px]`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-[10px] mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
                <AlertCircle size={18} className="text-[var(--red)]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</h3>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-4">
              {isBn ? 'এই বরাদ্দটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This assignment will be permanently deleted.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAssignDeleteConfirm(null)}
                className="py-2 px-[14px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] cursor-pointer font-[inherit]">
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={() => { removeTeacherFacility(assignDeleteConfirm); setAssignDeleteConfirm(null) }}
                className="py-2 px-[14px] rounded-lg bg-[var(--red)] border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit]">
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
