import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Gift,
  Award,
  HandCoins,
  Briefcase,
  Calculator,
  LayoutGrid,
  Zap,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useTeacherStore } from '@/store/teacherStore'
import { useHRStore } from '@/store/hrStore'
import type { Tab, ModalType, FacModalType, PDFModalType, IncForm, BonForm, ProForm, FundForm, FacForm, AssignForm } from './types'
import { getAvatarGradient, getInitials } from './utils'
import HROverviewTab from './tabs/HROverviewTab'
import HRDecisionsTab from './tabs/HRDecisionsTab'
import HRIncrementTab from './tabs/HRIncrementTab'
import HRBonusTab from './tabs/HRBonusTab'
import HRPromotionTab from './tabs/HRPromotionTab'
import HRFundTab from './tabs/HRFundTab'
import HRSalarySetupTab from './tabs/HRSalarySetupTab'
import HRFacilitiesTab from './tabs/HRFacilitiesTab'
import HRModals from './components/HRModals'
import type { MonthlySalaryConfig } from '@/store/hrStore'
import type { HRListPDFOptions } from '@/pages/hr/listPdfTemplate'
import {
  generateIncrementPDF,
  generateBonusPDF,
  generatePromotionPDF,
  generateFundPDF,
  generateAssignmentPDF,
  generateSalaryPDF,
} from '@/pages/hr/listPdfTemplate'

function toBnNum(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).replace(/\d/g, (d) => bn[+d])
}

export default function HRPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const { teachers, departments, attendance } = useTeacherStore()
  const {
    increments,
    bonuses,
    promotions,
    funds,
    homeworkRecords,
    dailyReports,
    recommendations,
    monthlySalaryConfigs,
    facilities,
    teacherFacilities,
    addIncrement,
    deleteIncrement,
    addBonus,
    deleteBonus,
    addPromotion,
    deletePromotion,
    addFund,
    addRecommendation,
    updateRecommendation,
    upsertManyMonthlySalaryConfigs,
    addFacility,
    updateFacility,
    deleteFacility,
    assignTeacherFacility,
    updateTeacherFacility,
    removeTeacherFacility,
    upsertTeacherFacilities,
  } = useHRStore()
  const isBn = language === 'bn'

  // ─── Tab & Modal State ───
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [modalType, setModalType] = useState<ModalType>(null)
  const [facModalType, setFacModalType] = useState<FacModalType>(null)
  const [showPDFModal, setShowPDFModal] = useState<PDFModalType>(null)

  // ─── Form State ───
  const [incForm, setIncForm] = useState<IncForm>({ teacherId: '', type: 'annual', percentage: '', reason: '' })
  const [bonForm, setBonForm] = useState<BonForm>({ teacherId: '', type: 'festival', amount: '', reason: '', month: '' })
  const [proForm, setProForm] = useState<ProForm>({ teacherId: '', fromDesignation: '', toDesignation: '', reason: '' })
  const [fundForm, setFundForm] = useState<FundForm>({ type: 'contribution', amount: '', description: '' })
  const [facForm, setFacForm] = useState<FacForm>({ name: '', nameBn: '', defaultAmount: '', type: 'monthly' })
  const [editFac, setEditFac] = useState<any | null>(null)
  const [assignForm, setAssignForm] = useState<AssignForm>({ teacherId: '', facilityId: '', amount: '' })
  const [editAssign, setEditAssign] = useState<{ id: string; teacherId: string; facilityId: string; amount: number } | null>(null)

  // ─── UI State ───
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<string>('all')
  const [showGenerateRecs, setShowGenerateRecs] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [employeeView, setEmployeeView] = useState<'grid' | 'list'>('grid')

  // ─── Selection State ───
  const [selectedInc, setSelectedInc] = useState<string[]>([])
  const [selectedBon, setSelectedBon] = useState<string[]>([])
  const [selectedPro, setSelectedPro] = useState<string[]>([])
  const [selectedFund, setSelectedFund] = useState<string[]>([])
  const [selectedAssign, setSelectedAssign] = useState<string[]>([])
  const [selectedSalary, setSelectedSalary] = useState<string[]>([])
  const [selectedFacStaff, setSelectedFacStaff] = useState('')

  // ─── Date Filters ───
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 28)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [incDateFrom, setIncDateFrom] = useState('')
  const [incDateTo, setIncDateTo] = useState('')
  const [bonusDateFrom, setBonusDateFrom] = useState('')
  const [bonusDateTo, setBonusDateTo] = useState('')
  const [proDateFrom, setProDateFrom] = useState('')
  const [proDateTo, setProDateTo] = useState('')
  const [fundDateFrom, setFundDateFrom] = useState('')
  const [fundDateTo, setFundDateTo] = useState('')
  const [assignDateFrom, setAssignDateFrom] = useState('')
  const [assignDateTo, setAssignDateTo] = useState('')

  // ─── Salary Setup ───
  const [salarySetupMonth, setSalarySetupMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [salaryConfigs, setSalaryConfigs] = useState<
    Record<string, { bonus: number; festivalBonus: number; applyDeductionRule: boolean; fundContributionPercent: number }>
  >({})
  const [salarySaved, setSalarySaved] = useState(false)
  const [bulkDeductionEnabled, setBulkDeductionEnabled] = useState(false)
  const [bulkDeductionFrom, setBulkDeductionFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [bulkDeductionTo, setBulkDeductionTo] = useState(new Date().toISOString().split('T')[0])
  const [bulkFundEnabled, setBulkFundEnabled] = useState(false)
  const [bulkFundPercent, setBulkFundPercent] = useState('')

  // ─── Facilities ───
  const [facStaffFilter, setFacStaffFilter] = useState('')
  const [facStaffSearch, setFacStaffSearch] = useState('')
  const [facDeleteConfirm, setFacDeleteConfirm] = useState<string | null>(null)
  const [assignDeleteConfirm, setAssignDeleteConfirm] = useState<string | null>(null)

  useScrollLock(
    modalType !== null || showPDFModal !== null || facModalType !== null || facDeleteConfirm !== null || assignDeleteConfirm !== null
  )

  // ─── Pagination ───
  const [perPage, setPerPage] = useState(20)
  const [page, setPage] = useState(1)

  // ─── Computed Values ───
  const today = new Date().toISOString().split('T')[0]

  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])

  const allDesignations = useMemo(() => {
    const set = new Set<string>()
    teachers.forEach((t) => {
      if (t.designation) set.add(t.designation)
    })
    set.add('Head of Department')
    return Array.from(set).sort()
  }, [teachers])

  const getTeacherName = useCallback((id: string) => teachers.find((t) => t.id === id)?.nameEn || id, [teachers])
  const getTeacherDept = useCallback(
    (id: string) => {
      const t = teachers.find((t) => t.id === id)
      if (!t) return ''
      const d = departments.find((d) => d.id === t.departmentId)
      return d ? (isBn ? d.nameBn : d.name) : ''
    },
    [teachers, departments, isBn]
  )

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string; labelBn: string }> = {
      active: { cls: 'bg-[var(--green-light)] text-[var(--green)]', label: 'Active', labelBn: 'সক্রিয়' },
      inactive: { cls: 'bg-[var(--red-light)] text-[var(--red)]', label: 'Inactive', labelBn: 'নিষ্ক্রিয়' },
      'on-leave': { cls: 'bg-[var(--amber-light)] text-[var(--amber)]', label: 'On Leave', labelBn: 'ছুটিতে' },
    }
    const s = map[status] || map.active
    return (
      <span className={`text-[0.6875rem] py-[0.1875rem] px-[0.625rem] rounded-full font-medium whitespace-nowrap ${s.cls}`}>
        {isBn ? s.labelBn : s.label}
      </span>
    )
  }

  // ─── Filtered Data ───
  const filteredIncrements = useMemo(() => {
    let list = increments
    if (incDateFrom) list = list.filter((i) => i.date >= incDateFrom)
    if (incDateTo) list = list.filter((i) => i.date <= incDateTo)
    return list
  }, [increments, incDateFrom, incDateTo])

  const filteredBonuses = useMemo(() => {
    let list = bonuses
    if (bonusDateFrom) list = list.filter((b) => b.date >= bonusDateFrom)
    if (bonusDateTo) list = list.filter((b) => b.date <= bonusDateTo)
    return list
  }, [bonuses, bonusDateFrom, bonusDateTo])

  const filteredPromotions = useMemo(() => {
    let list = promotions
    if (proDateFrom) list = list.filter((p) => p.date >= proDateFrom)
    if (proDateTo) list = list.filter((p) => p.date <= proDateTo)
    return list
  }, [promotions, proDateFrom, proDateTo])

  const filteredFunds = useMemo(() => {
    let list = funds
    if (fundDateFrom) list = list.filter((f) => f.date >= fundDateFrom)
    if (fundDateTo) list = list.filter((f) => f.date <= fundDateTo)
    return list
  }, [funds, fundDateFrom, fundDateTo])

  const filteredAssignments = useMemo(() => {
    let list = teacherFacilities
    if (assignDateFrom) list = list.filter((tf) => tf.createdAt >= assignDateFrom)
    if (assignDateTo) list = list.filter((tf) => tf.createdAt <= assignDateTo + 'T23:59:59')
    return list
  }, [teacherFacilities, assignDateFrom, assignDateTo])

  const filteredFacStaff = useMemo(() => {
    let list = activeTeachers
    if (facStaffFilter) list = list.filter((t) => t.departmentId === facStaffFilter)
    if (facStaffSearch) {
      const q = facStaffSearch.toLowerCase()
      list = list.filter(
        (t) => t.nameEn.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || (t.nameBn && t.nameBn.includes(facStaffSearch))
      )
    }
    return list
  }, [activeTeachers, facStaffFilter, facStaffSearch])

  // ─── Totals ───
  const totalSalary = useMemo(() => activeTeachers.reduce((s, t) => s + t.salary, 0), [activeTeachers])
  const totalIncrements = increments.reduce((s, i) => s + i.amount, 0)
  const totalBonuses = bonuses.reduce((s, b) => s + b.amount, 0)
  const fundBalance = funds.reduce(
    (s, f) => s + (f.type === 'contribution' || f.type === 'bonus_pool' || f.type === 'increment_pool' ? f.amount : -f.amount),
    0
  )

  const attendanceToday = useMemo(() => {
    const day = attendance[today] || {}
    return {
      present: Object.values(day).filter((d: any) => d.status === 'present').length,
      absent: Object.values(day).filter((d: any) => d.status === 'absent').length,
      onLeave: Object.values(day).filter((d: any) => d.status === 'on-leave').length,
    }
  }, [attendance, today])

  // ─── Performance Metrics ───
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
    activeTeachers.forEach((t) => {
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
    activeTeachers.forEach((t) => {
      const records = homeworkRecords.filter((r) => r.teacherId === t.id && r.date >= dateFrom && r.date <= dateTo)
      const submitted = records.filter((r) => r.submitted).length
      rates[t.id] = records.length > 0 ? Math.round((submitted / records.length) * 100) : 0
    })
    return rates
  }, [homeworkRecords, activeTeachers, dateFrom, dateTo])

  const teacherReportRate = useMemo(() => {
    const rates: Record<string, { rate: number; avgScore: number }> = {}
    activeTeachers.forEach((t) => {
      const reports = dailyReports.filter((r) => r.teacherId === t.id && r.date >= dateFrom && r.date <= dateTo)
      const submitted = reports.filter((r) => r.submitted).length
      const rate = reports.length > 0 ? Math.round((submitted / reports.length) * 100) : 0
      const scored = reports.filter((r) => r.submitted && r.avgScore > 0)
      const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.avgScore, 0) / scored.length) : 0
      rates[t.id] = { rate, avgScore }
    })
    return rates
  }, [dailyReports, activeTeachers, dateFrom, dateTo])

  const attendanceRank = useMemo(
    () =>
      activeTeachers
        .map((t) => ({ ...t, rate: teacherAttendanceRate[t.id] || 0 }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5),
    [activeTeachers, teacherAttendanceRate]
  )

  const homeworkRank = useMemo(
    () =>
      activeTeachers
        .map((t) => ({ ...t, rate: teacherHomeworkRate[t.id] || 0 }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5),
    [activeTeachers, teacherHomeworkRate]
  )

  const reportRank = useMemo(
    () =>
      activeTeachers
        .map((t) => ({ ...t, rate: teacherReportRate[t.id]?.rate || 0 }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5),
    [activeTeachers, teacherReportRate]
  )

  const studentPerformanceRank = useMemo(
    () =>
      activeTeachers
        .map((t) => ({ ...t, avgScore: teacherReportRate[t.id]?.avgScore || 0 }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5),
    [activeTeachers, teacherReportRate]
  )

  const teacherCompositeScores = useMemo(
    () =>
      activeTeachers
        .map((t) => {
          const attRate = teacherAttendanceRate[t.id] || 0
          const hwRate = teacherHomeworkRate[t.id] || 0
          const repRate = teacherReportRate[t.id]?.rate || 0
          const avgScore = teacherReportRate[t.id]?.avgScore || 0
          const totalScore = Math.round(attRate * 0.3 + hwRate * 0.3 + repRate * 0.2 + avgScore * 0.002 * 20)
          return { ...t, attRate, hwRate, repRate, avgScore, totalScore: Math.min(100, Math.max(0, totalScore)) }
        })
        .sort((a, b) => b.totalScore - a.totalScore),
    [activeTeachers, teacherAttendanceRate, teacherHomeworkRate, teacherReportRate]
  )

  const salaryDeductions = useMemo(() => {
    let totalDeduction = 0
    const from = new Date(dateFrom)
    const to = new Date(dateTo)
    const daysInMonth = 30
    activeTeachers.forEach((t) => {
      if (!t.applySalaryRule || !t.salary) return
      let daysPresent = 0
      const dd = new Date(from)
      while (dd <= to) {
        if (dd.getDay() !== 0) {
          const dateStr = dd.toISOString().split('T')[0]
          if (attendance[dateStr]?.[t.id]?.status === 'present') daysPresent++
        }
        dd.setDate(dd.getDate() + 1)
      }
      if (daysPresent >= 3) {
        const dailySalary = Math.round(t.salary / daysInMonth)
        totalDeduction += dailySalary
      }
    })
    return totalDeduction
  }, [activeTeachers, attendance, dateFrom, dateTo])

  const adjustedTotalSalary = totalSalary - salaryDeductions

  const selectedStaffFacilities = useMemo(() => {
    if (!selectedFacStaff) return []
    return facilities.map((fac) => {
      const assigned = teacherFacilities.find((tf) => tf.teacherId === selectedFacStaff && tf.facilityId === fac.id)
      return { facility: fac, assigned: !!assigned, amount: assigned?.amount || fac.defaultAmount }
    })
  }, [selectedFacStaff, facilities, teacherFacilities])

  const employeeList = useMemo(
    () =>
      teachers
        .filter((t) => {
          const match = employeeSearch.toLowerCase()
          return (
            (t.nameEn.toLowerCase().includes(match) ||
              t.nameBn.includes(match) ||
              t.designation.toLowerCase().includes(match) ||
              t.phone.includes(match)) &&
            (employeeStatusFilter === 'all' || t.status === employeeStatusFilter)
          )
        })
        .map((t) => ({
          ...t,
          attRate: teacherAttendanceRate[t.id] || 0,
          hwRate: teacherHomeworkRate[t.id] || 0,
          reportRate: teacherReportRate[t.id]?.rate || 0,
          compScore: teacherCompositeScores.find((s) => s.id === t.id)?.totalScore || 0,
        })),
    [teachers, employeeSearch, employeeStatusFilter, teacherAttendanceRate, teacherHomeworkRate, teacherReportRate, teacherCompositeScores]
  )

  // ─── Selection Handlers ───
  const toggleInc = useCallback((id: string) => setSelectedInc((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])
  const toggleAllInc = useCallback(
    () => setSelectedInc((p) => (p.length === filteredIncrements.length ? [] : filteredIncrements.map((i) => i.id))),
    [filteredIncrements]
  )
  const toggleBon = useCallback((id: string) => setSelectedBon((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])
  const toggleAllBon = useCallback(
    () => setSelectedBon((p) => (p.length === filteredBonuses.length ? [] : filteredBonuses.map((b) => b.id))),
    [filteredBonuses]
  )
  const togglePro = useCallback((id: string) => setSelectedPro((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])
  const toggleAllPro = useCallback(
    () => setSelectedPro((p) => (p.length === filteredPromotions.length ? [] : filteredPromotions.map((p) => p.id))),
    [filteredPromotions]
  )
  const toggleFund = useCallback((id: string) => setSelectedFund((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])
  const toggleAllFund = useCallback(() => setSelectedFund((p) => (p.length === funds.length ? [] : funds.map((f) => f.id))), [funds])
  const toggleAssign = useCallback((id: string) => setSelectedAssign((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])
  const toggleSalary = useCallback((id: string) => setSelectedSalary((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])
  const toggleAllSalary = useCallback(
    () => setSelectedSalary((p) => (p.length === activeTeachers.length ? [] : activeTeachers.map((t) => t.id))),
    [activeTeachers]
  )

  // ─── Action Handlers ───
  const handleAddIncrement = () => {
    if (!incForm.teacherId || !incForm.percentage) return
    const t = teachers.find((t) => t.id === incForm.teacherId)
    if (!t) return
    const amount = Math.round((t.salary * Number(incForm.percentage)) / 100)
    addIncrement({
      id: `INC-${Date.now()}`,
      teacherId: incForm.teacherId,
      type: incForm.type,
      amount,
      percentage: Number(incForm.percentage),
      reason: incForm.reason,
      date: today,
      approvedBy: 'HR Admin',
    })
    setIncForm({ teacherId: '', type: 'annual', percentage: '', reason: '' })
    setModalType(null)
  }

  const handleAddBonus = () => {
    if (!bonForm.teacherId || !bonForm.amount) return
    addBonus({
      id: `BON-${Date.now()}`,
      teacherId: bonForm.teacherId,
      type: bonForm.type,
      amount: Number(bonForm.amount),
      month: bonForm.month || today.slice(0, 7),
      reason: bonForm.reason,
      date: today,
    })
    setBonForm({ teacherId: '', type: 'festival', amount: '', reason: '', month: '' })
    setModalType(null)
  }

  const handleAddPromotion = () => {
    if (!proForm.teacherId || !proForm.toDesignation) return
    addPromotion({
      id: `PRO-${Date.now()}`,
      teacherId: proForm.teacherId,
      fromDesignation: proForm.fromDesignation,
      toDesignation: proForm.toDesignation,
      date: today,
      reason: proForm.reason,
    })
    setProForm({ teacherId: '', fromDesignation: '', toDesignation: '', reason: '' })
    setModalType(null)
  }

  const handleAddFund = () => {
    if (!fundForm.amount) return
    addFund({
      id: `FND-${Date.now()}`,
      type: fundForm.type,
      amount: Number(fundForm.amount),
      description: fundForm.description,
      date: today,
    })
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
    updateFacility(editFac.id, {
      name: facForm.name.trim(),
      nameBn: facForm.nameBn.trim(),
      defaultAmount: Number(facForm.defaultAmount) || 0,
      type: facForm.type,
    })
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

  const toggleStaffFacility = useCallback(
    (facilityId: string) => {
      const existing = teacherFacilities.find((tf) => tf.teacherId === selectedFacStaff && tf.facilityId === facilityId)
      if (existing) {
        removeTeacherFacility(existing.id)
      } else {
        const fac = facilities.find((f) => f.id === facilityId)
        assignTeacherFacility({
          id: `TF-${Date.now()}-${facilityId}`,
          teacherId: selectedFacStaff,
          facilityId,
          amount: fac?.defaultAmount || 0,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        })
      }
    },
    [selectedFacStaff, teacherFacilities, facilities, assignTeacherFacility, removeTeacherFacility]
  )

  const updateStaffFacilityAmount = useCallback(
    (facilityId: string, amount: number) => {
      const existing = teacherFacilities.find((tf) => tf.teacherId === selectedFacStaff && tf.facilityId === facilityId)
      if (existing) updateTeacherFacility(existing.id, { amount })
    },
    [selectedFacStaff, teacherFacilities, updateTeacherFacility]
  )

  const handleSaveStaffFacilities = useCallback(() => {
    const items = selectedStaffFacilities
      .filter((sf) => sf.assigned)
      .map((sf) => ({
        id:
          teacherFacilities.find((tf) => tf.teacherId === selectedFacStaff && tf.facilityId === sf.facility.id)?.id ||
          `TF-${Date.now()}-${sf.facility.id}`,
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
      if (!recommendations.find((r) => r.teacherId === t.id && r.status === 'pending')) {
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

  const handleApproveRecommendation = (rec: (typeof recommendations)[0]) => {
    updateRecommendation(rec.id, 'approved' as 'approved' | 'rejected')
    if (rec.type === 'bonus') {
      addBonus({
        id: `BON-${Date.now()}`,
        teacherId: rec.teacherId,
        type: 'performance',
        amount: 5000,
        month: today.slice(0, 7),
        reason: rec.reason,
        date: today,
      })
    } else if (rec.type === 'promotion') {
      const t = teachers.find((tx) => tx.id === rec.teacherId)
      if (t)
        addPromotion({
          id: `PRO-${Date.now()}`,
          teacherId: rec.teacherId,
          fromDesignation: t.designation,
          toDesignation: 'Senior ' + t.designation,
          date: today,
          reason: rec.reason,
        })
    } else if (rec.type === 'increment') {
      const t = teachers.find((tx) => tx.id === rec.teacherId)
      if (t)
        addIncrement({
          id: `INC-${Date.now()}`,
          teacherId: rec.teacherId,
          type: 'performance',
          amount: Math.round(t.salary * 0.05),
          percentage: 5,
          reason: rec.reason,
          date: today,
          approvedBy: 'HR Admin',
        })
    }
  }

  const handleBulkApplyDeduction = () => {
    const configs: MonthlySalaryConfig[] = activeTeachers.map((t) => {
      const existing = monthlySalaryConfigs.find((c) => c.teacherId === t.id && c.month === salarySetupMonth)
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
    const configs: MonthlySalaryConfig[] = activeTeachers.map((t) => {
      const existing = monthlySalaryConfigs.find((c) => c.teacherId === t.id && c.month === salarySetupMonth)
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

  const handlePDFDownload = useCallback(
    (type: 'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary', opts: HRListPDFOptions) => {
      const win = window.open('', '_blank')
      if (!win) return
      let html = ''
      if (type === 'increment') {
        const list = selectedInc.length > 0 ? increments.filter((i) => selectedInc.includes(i.id)) : increments
        html = generateIncrementPDF(list, opts, getTeacherName)
      } else if (type === 'bonus') {
        const list = selectedBon.length > 0 ? bonuses.filter((b) => selectedBon.includes(b.id)) : bonuses
        html = generateBonusPDF(list, opts, getTeacherName)
      } else if (type === 'promotion') {
        const list = selectedPro.length > 0 ? filteredPromotions.filter((p) => selectedPro.includes(p.id)) : filteredPromotions
        html = generatePromotionPDF(list, opts, getTeacherName)
      } else if (type === 'fund') {
        const list = selectedFund.length > 0 ? funds.filter((f) => selectedFund.includes(f.id)) : funds
        html = generateFundPDF(list, opts)
      } else if (type === 'assignment') {
        const list = selectedAssign.length > 0 ? teacherFacilities.filter((tf) => selectedAssign.includes(tf.id)) : filteredAssignments
        html = generateAssignmentPDF(list, opts, getTeacherName, (id) => facilities.find((f) => f.id === id)?.name || id)
      } else if (type === 'salary') {
        const teachersToShow = selectedSalary.length > 0 ? activeTeachers.filter((t) => selectedSalary.includes(t.id)) : activeTeachers
        const salaryData = teachersToShow.map((t) => {
          const existing = monthlySalaryConfigs.find((c) => c.teacherId === t.id && c.month === salarySetupMonth)
          const local = salaryConfigs[t.id] || {}
          const applyDeduction = local.applyDeductionRule ?? existing?.applyDeductionRule ?? false
          const fundPercent = local.fundContributionPercent ?? existing?.fundContributionPercent ?? 0
          const teacherBonuses = bonuses.filter((b) => b.teacherId === t.id && b.month === salarySetupMonth)
          const perf = teacherBonuses.filter((b) => b.type === 'performance').reduce((sum, b) => sum + b.amount, 0)
          const atten = teacherBonuses.filter((b) => b.type === 'attendance').reduce((sum, b) => sum + b.amount, 0)
          const special = teacherBonuses.filter((b) => b.type === 'special').reduce((sum, b) => sum + b.amount, 0)
          const festival = teacherBonuses.filter((b) => b.type === 'festival').reduce((sum, b) => sum + b.amount, 0)
          const totalBonus = perf + atten + special + festival
          const deduction = applyDeduction ? Math.round(t.salary / 30) : 0
          const fund = Math.round((t.salary * fundPercent) / 100)
          const net = t.salary + totalBonus - deduction - fund
          return { ...t, basic: t.salary, perf, atten, special, festival, totalBonus, deduction, fundPercent, net }
        })
        html = generateSalaryPDF(salaryData, opts)
      }
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 800)
      setShowPDFModal(null)
    },
    [
      increments,
      bonuses,
      promotions,
      funds,
      teacherFacilities,
      facilities,
      filteredAssignments,
      filteredPromotions,
      getTeacherName,
      selectedInc,
      selectedBon,
      selectedPro,
      selectedFund,
      selectedAssign,
      selectedSalary,
      activeTeachers,
      monthlySalaryConfigs,
      salaryConfigs,
      salarySetupMonth,
    ]
  )

  // ─── Tab Config ───
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
    {
      labelBn: 'সক্রিয়',
      labelEn: 'Active',
      valueBn: `${toBnNum(activeTeachers.length)} জন`,
      valueEn: String(activeTeachers.length),
      icon: Users,
      colorCls: 'text-[var(--brand)]',
      bgCls: 'bg-[var(--brand-light)]',
    },
    {
      labelBn: 'উপস্থিত',
      labelEn: 'Present',
      valueBn: `${toBnNum(attendanceToday.present)} জন`,
      valueEn: String(attendanceToday.present),
      icon: CheckCircle2,
      colorCls: 'text-[var(--green)]',
      bgCls: 'bg-[var(--green-light)]',
    },
    {
      labelBn: 'অনুপস্থিত',
      labelEn: 'Absent',
      valueBn: `${toBnNum(attendanceToday.absent)} জন`,
      valueEn: String(attendanceToday.absent),
      icon: XCircle,
      colorCls: 'text-[var(--red)]',
      bgCls: 'bg-[var(--red-light)]',
    },
    {
      labelBn: 'ছুটিতে',
      labelEn: 'On Leave',
      valueBn: `${toBnNum(attendanceToday.onLeave)} জন`,
      valueEn: String(attendanceToday.onLeave),
      icon: Clock,
      colorCls: 'text-[var(--amber)]',
      bgCls: 'bg-[var(--amber-light)]',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit]"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
            {isBn ? 'HR ও কর্মচারী ব্যবস্থাপনা' : 'HR & Staff Management'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn
              ? `${activeTeachers.length} জন সক্রিয় কর্মচারী · ${departments.length} টি বিভাগ`
              : `${activeTeachers.length} active staff · ${departments.length} departments`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-[0.3125rem] mb-[0.875rem] overflow-x-auto flex-nowrap"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setPage(1)
            }}
            className={`flex items-center justify-center gap-[0.4375rem] py-[0.5625rem] px-[0.875rem] rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-all whitespace-nowrap ${isMobile ? 'shrink-0' : 'flex-1'} ${activeTab === tab.id ? 'bg-[var(--brand)]' : 'bg-transparent'} ${activeTab === tab.id ? 'text-white' : 'text-[var(--text-secondary)]'} ${activeTab === tab.id ? 'shadow-[0_4px_12px_rgba(99,102,241,0.3)]' : 'shadow-none'}`}
          >
            <tab.icon size={15} />
            {isBn ? tab.labelBn : tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <HROverviewTab
          isBn={isBn}
          isMobile={isMobile}
          isTablet={isTablet}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          employeeSearch={employeeSearch}
          setEmployeeSearch={setEmployeeSearch}
          employeeStatusFilter={employeeStatusFilter}
          setEmployeeStatusFilter={setEmployeeStatusFilter}
          employeeView={employeeView}
          setEmployeeView={setEmployeeView}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          employeeList={employeeList}
          paginatedEmployees={employeeList.slice((page - 1) * perPage, page * perPage)}
          employeeTotalPages={Math.max(1, Math.ceil(employeeList.length / perPage))}
          activeTeachers={activeTeachers}
          quickStats={quickStats}
          getStatusBadge={getStatusBadge}
          getTeacherDept={getTeacherDept}
          attendanceRank={attendanceRank}
          homeworkRank={homeworkRank}
          reportRank={reportRank}
          studentPerformanceRank={studentPerformanceRank}
          adjustedTotalSalary={adjustedTotalSalary}
          salaryDeductions={salaryDeductions}
          totalIncrements={totalIncrements}
          totalBonuses={totalBonuses}
          fundBalance={fundBalance}
        />
      )}

      {activeTab === 'decisions' && (
        <HRDecisionsTab
          isBn={isBn}
          isMobile={isMobile}
          teachers={teachers}
          recommendations={recommendations}
          teacherCompositeScores={teacherCompositeScores}
          showGenerateRecs={showGenerateRecs}
          handleGenerateRecommendations={handleGenerateRecommendations}
          handleApproveRecommendation={handleApproveRecommendation}
          updateRecommendation={(id, status) => updateRecommendation(id, status as 'approved' | 'rejected')}
          getTeacherDept={getTeacherDept}
          getAvatarGradient={getAvatarGradient}
          getInitials={getInitials}
        />
      )}

      {activeTab === 'increment' && (
        <HRIncrementTab
          isBn={isBn}
          isMobile={isMobile}
          teachers={teachers}
          filteredIncrements={filteredIncrements}
          paginatedIncrements={filteredIncrements.slice((page - 1) * perPage, page * perPage)}
          totalPages={Math.max(1, Math.ceil(filteredIncrements.length / perPage))}
          selected={selectedInc}
          toggle={toggleInc}
          toggleAll={toggleAllInc}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          incDateFrom={incDateFrom}
          setIncDateFrom={setIncDateFrom}
          incDateTo={incDateTo}
          setIncDateTo={setIncDateTo}
          setModalType={setModalType as any}
          setIncForm={setIncForm}
          deleteIncrement={deleteIncrement}
          setShowPDFModal={setShowPDFModal as any}
          getTeacherName={getTeacherName}
        />
      )}

      {activeTab === 'bonus' && (
        <HRBonusTab
          isBn={isBn}
          isMobile={isMobile}
          filteredBonuses={filteredBonuses}
          paginatedBonuses={filteredBonuses.slice((page - 1) * perPage, page * perPage)}
          totalPages={Math.max(1, Math.ceil(filteredBonuses.length / perPage))}
          selected={selectedBon}
          toggle={toggleBon}
          toggleAll={toggleAllBon}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          bonusDateFrom={bonusDateFrom}
          setBonusDateFrom={setBonusDateFrom}
          bonusDateTo={bonusDateTo}
          setBonusDateTo={setBonusDateTo}
          setModalType={setModalType as any}
          setBonForm={setBonForm}
          deleteBonus={deleteBonus}
          setShowPDFModal={setShowPDFModal as any}
          getTeacherName={getTeacherName}
        />
      )}

      {activeTab === 'promotion' && (
        <HRPromotionTab
          isBn={isBn}
          teachers={teachers}
          promotions={promotions}
          filteredPromotions={filteredPromotions}
          paginatedPromotions={filteredPromotions.slice((page - 1) * perPage, page * perPage)}
          totalPages={Math.max(1, Math.ceil(filteredPromotions.length / perPage))}
          selected={selectedPro}
          toggle={togglePro}
          toggleAll={toggleAllPro}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          proDateFrom={proDateFrom}
          setProDateFrom={setProDateFrom}
          proDateTo={proDateTo}
          setProDateTo={setProDateTo}
          setModalType={setModalType as any}
          setProForm={setProForm}
          deletePromotion={deletePromotion}
          setShowPDFModal={setShowPDFModal as any}
          getTeacherName={getTeacherName}
        />
      )}

      {activeTab === 'fund' && (
        <HRFundTab
          isBn={isBn}
          isMobile={isMobile}
          activeTeachers={activeTeachers}
          funds={funds}
          filteredFunds={filteredFunds}
          paginatedFunds={filteredFunds.slice((page - 1) * perPage, page * perPage)}
          fundTotalPages={Math.max(1, Math.ceil(filteredFunds.length / perPage))}
          selectedFund={selectedFund}
          toggleFund={toggleFund}
          toggleAllFund={toggleAllFund}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          fundDateFrom={fundDateFrom}
          setFundDateFrom={setFundDateFrom}
          fundDateTo={fundDateTo}
          setFundDateTo={setFundDateTo}
          setModalType={setModalType as any}
          setShowPDFModal={setShowPDFModal as any}
          fundBalance={fundBalance}
          monthlySalaryConfigs={monthlySalaryConfigs}
        />
      )}

      {activeTab === 'salary-setup' && (
        <HRSalarySetupTab
          isBn={isBn}
          isMobile={isMobile}
          teachers={teachers}
          activeTeachers={activeTeachers}
          bonuses={bonuses}
          paginatedActiveTeachers={activeTeachers.slice((page - 1) * perPage, page * perPage)}
          salaryTotalPages={Math.max(1, Math.ceil(activeTeachers.length / perPage))}
          selectedSalary={selectedSalary}
          toggleSalary={toggleSalary}
          toggleAllSalary={toggleAllSalary}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          salarySetupMonth={salarySetupMonth}
          setSalarySetupMonth={setSalarySetupMonth}
          salaryConfigs={salaryConfigs}
          setSalaryConfigs={setSalaryConfigs as any}
          monthlySalaryConfigs={monthlySalaryConfigs}
          salarySaved={salarySaved}
          setSalarySaved={setSalarySaved}
          bulkDeductionEnabled={bulkDeductionEnabled}
          setBulkDeductionEnabled={setBulkDeductionEnabled}
          bulkDeductionFrom={bulkDeductionFrom}
          setBulkDeductionFrom={setBulkDeductionFrom}
          bulkDeductionTo={bulkDeductionTo}
          setBulkDeductionTo={setBulkDeductionTo}
          bulkFundEnabled={bulkFundEnabled}
          setBulkFundEnabled={setBulkFundEnabled}
          bulkFundPercent={bulkFundPercent}
          setBulkFundPercent={setBulkFundPercent}
          handleBulkApplyDeduction={handleBulkApplyDeduction}
          handleBulkApplyFund={handleBulkApplyFund}
          setShowPDFModal={setShowPDFModal as any}
          upsertManyMonthlySalaryConfigs={upsertManyMonthlySalaryConfigs}
        />
      )}

      {activeTab === 'facilities' && (
        <HRFacilitiesTab
          isBn={isBn}
          isMobile={isMobile}
          teachers={teachers}
          departments={departments}
          facilities={facilities}
          teacherFacilities={teacherFacilities}
          filteredAssignments={filteredAssignments}
          paginatedAssignments={filteredAssignments.slice((page - 1) * perPage, page * perPage)}
          assignmentTotalPages={Math.max(1, Math.ceil(filteredAssignments.length / perPage))}
          selectedAssign={selectedAssign}
          setSelectedAssign={setSelectedAssign}
          toggleAssign={toggleAssign}
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          selectedFacStaff={selectedFacStaff}
          setSelectedFacStaff={setSelectedFacStaff}
          facStaffFilter={facStaffFilter}
          setFacStaffFilter={setFacStaffFilter}
          facStaffSearch={facStaffSearch}
          setFacStaffSearch={setFacStaffSearch}
          filteredFacStaff={filteredFacStaff}
          selectedStaffFacilities={selectedStaffFacilities}
          toggleStaffFacility={toggleStaffFacility}
          updateStaffFacilityAmount={updateStaffFacilityAmount}
          handleSaveStaffFacilities={handleSaveStaffFacilities}
          assignDateFrom={assignDateFrom}
          setAssignDateFrom={setAssignDateFrom}
          assignDateTo={assignDateTo}
          setAssignDateTo={setAssignDateTo}
          setFacModalType={setFacModalType as any}
          setFacForm={setFacForm}
          setEditFac={setEditFac}
          setFacDeleteConfirm={setFacDeleteConfirm}
          setAssignDeleteConfirm={setAssignDeleteConfirm}
          setShowPDFModal={setShowPDFModal as any}
          inputCls="w-full py-[0.5625rem] px-[0.6875rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none"
        />
      )}

      {/* Modals */}
        <HRModals
        modalType={modalType}
        setModalType={setModalType as any}
        incForm={incForm}
        setIncForm={setIncForm}
        bonForm={bonForm}
        setBonForm={setBonForm}
        proForm={proForm}
        setProForm={setProForm}
        fundForm={fundForm}
        setFundForm={setFundForm}
        activeTeachers={activeTeachers}
        allDesignations={allDesignations}
        handleAddIncrement={handleAddIncrement}
        handleAddBonus={handleAddBonus}
        handleAddPromotion={handleAddPromotion}
        handleAddFund={handleAddFund}
        isBn={isBn}
        isMobile={isMobile}
        showPDFModal={showPDFModal}
        setShowPDFModal={setShowPDFModal as any}
        increments={increments}
        filteredBonuses={filteredBonuses}
        filteredPromotions={filteredPromotions}
        filteredAssignments={filteredAssignments}
        funds={funds}
        handlePDFDownload={handlePDFDownload as any}
        facModalType={facModalType}
        setFacModalType={setFacModalType}
        facForm={facForm}
        setFacForm={setFacForm}
        editFac={editFac}
        setEditFac={setEditFac}
        handleAddFacility={handleAddFacility}
        handleEditFacility={handleEditFacility}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
        editAssign={editAssign}
        setEditAssign={setEditAssign}
        facilities={facilities}
        handleAssignFacility={handleAssignFacility}
        handleEditAssign={handleEditAssign}
        facDeleteConfirm={facDeleteConfirm}
        setFacDeleteConfirm={setFacDeleteConfirm}
        deleteFacility={deleteFacility}
        assignDeleteConfirm={assignDeleteConfirm}
        setAssignDeleteConfirm={setAssignDeleteConfirm}
        removeTeacherFacility={removeTeacherFacility}
      />
    </div>
  )
}
