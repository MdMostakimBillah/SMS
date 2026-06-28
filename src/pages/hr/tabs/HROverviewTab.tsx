import React from 'react'
import {
  Calendar,
  Medal,
  DollarSign,
  Search,
  LayoutGrid,
  List,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react'
import { sectionCls, sectionTitleCls, inputCls, getInitials, getAvatarGradient } from '@/pages/hr/utils'

interface RankingItem {
  id: string
  nameEn: string
  rate?: number
  avgScore?: number
}

interface QuickStat {
  labelBn: string
  labelEn: string
  valueBn: string
  valueEn: string
  icon: any
  colorCls: string
  bgCls: string
}

interface Employee {
  id: string
  nameEn: string
  nameBn?: string
  photo?: string
  designation: string
  phone: string
  status: string
  salary: number
  applySalaryRule?: boolean
  attRate?: number
  hwRate?: number
  reportRate?: number
  compScore?: number
}

interface HROverviewTabProps {
  isBn: boolean
  isMobile: boolean
  isTablet: boolean
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  employeeSearch: string
  setEmployeeSearch: (v: string) => void
  employeeStatusFilter: string
  setEmployeeStatusFilter: (v: string) => void
  employeeView: 'grid' | 'list'
  setEmployeeView: (v: 'grid' | 'list') => void
  selectedEmployee: string | null
  setSelectedEmployee: (v: string | null) => void
  page: number
  setPage: (v: number | ((p: number) => number)) => void
  perPage: number
  setPerPage: (v: number) => void
  paginatedEmployees: Employee[]
  employeeTotalPages: number
  employeeList: Employee[]
  quickStats: QuickStat[]
  getStatusBadge: (status: string) => React.ReactNode
  getTeacherDept: (id: string) => string
  studentPerformanceRank: RankingItem[]
  reportRank: RankingItem[]
  homeworkRank: RankingItem[]
  attendanceRank: RankingItem[]
  adjustedTotalSalary: number
  salaryDeductions: number
  totalIncrements: number
  totalBonuses: number
  fundBalance: number
  activeTeachers: Employee[]
}

export const HROverviewTab = React.memo(function HROverviewTab({
  isBn,
  isMobile,
  isTablet,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  employeeSearch,
  setEmployeeSearch,
  employeeStatusFilter,
  setEmployeeStatusFilter,
  employeeView,
  setEmployeeView,
  selectedEmployee,
  setSelectedEmployee,
  page,
  setPage,
  perPage,
  setPerPage,
  paginatedEmployees,
  employeeTotalPages,
  employeeList,
  quickStats,
  getStatusBadge,
  getTeacherDept,
  studentPerformanceRank,
  reportRank,
  homeworkRank,
  attendanceRank,
  adjustedTotalSalary,
  salaryDeductions,
  totalIncrements,
  totalBonuses,
  fundBalance,
  activeTeachers,
}: HROverviewTabProps) {
  return (
    <>
      {/* Date Range Filter */}
      <div className={sectionCls(isMobile)}>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={14} className="text-[var(--brand)] shrink-0" />
          <span className="text-xs font-medium text-[var(--text-secondary)]">{isBn ? 'তারিখ পরিসীমা:' : 'Date Range:'}</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`${inputCls} w-auto max-w-[10rem] py-[0.375rem] px-[0.625rem] text-xs`}
          />
          <span className="text-xs text-[var(--text-muted)]">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={`${inputCls} w-auto max-w-[10rem] py-[0.375rem] px-[0.625rem] text-xs`}
          />
          <button
            onClick={() => {
              const d = new Date()
              d.setDate(d.getDate() - 7)
              setDateFrom(d.toISOString().split('T')[0])
              setDateTo(new Date().toISOString().split('T')[0])
            }}
            className="py-[0.3125rem] px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit]"
          >
            {isBn ? '৭ দিন' : '7D'}
          </button>
          <button
            onClick={() => {
              const d = new Date()
              d.setDate(d.getDate() - 30)
              setDateFrom(d.toISOString().split('T')[0])
              setDateTo(new Date().toISOString().split('T')[0])
            }}
            className="py-[0.3125rem] px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit]"
          >
            {isBn ? '৩০ দিন' : '30D'}
          </button>
          <button
            onClick={() => {
              const d = new Date()
              d.setMonth(d.getMonth() - 1)
              setDateFrom(d.toISOString().split('T')[0])
              setDateTo(new Date().toISOString().split('T')[0])
            }}
            className="py-[0.3125rem] px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit]"
          >
            {isBn ? '১ মাস' : '1M'}
          </button>
          <button
            onClick={() => {
              const d = new Date()
              d.setMonth(d.getMonth() - 3)
              setDateFrom(d.toISOString().split('T')[0])
              setDateTo(new Date().toISOString().split('T')[0])
            }}
            className="py-[0.3125rem] px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit]"
          >
            {isBn ? '৩ মাস' : '3M'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={`grid gap-2 mb-[0.875rem] ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {quickStats.map((s) => (
          <div key={s.labelEn} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3">
            <div className="flex items-center gap-[0.625rem]">
              <div className={`w-8 h-8 rounded-lg ${s.bgCls} flex items-center justify-center shrink-0`}>
                <s.icon size={15} className={s.colorCls} />
              </div>
              <div>
                <div className={`font-bold text-[var(--text-primary)] ${isMobile ? 'text-[0.9375rem]' : 'text-[1.0625rem]'}`}>
                  {isBn ? s.valueBn : s.valueEn}
                </div>
                <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? s.labelBn : s.labelEn}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Rankings */}
      <div className={sectionCls(isMobile)}>
        <div className={sectionTitleCls}>
          <Medal size={15} className="text-[var(--amber)]" />
          {isBn ? 'শীর্ষ কর্মী' : 'Top Performers'}
        </div>
        <div className={`grid gap-[0.625rem] ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {[
            {
              title: isBn ? 'শিক্ষার্থী ফলাফল' : 'Student Performance',
              data: studentPerformanceRank,
              color: 'var(--brand)',
              key: 'avgScore' as const,
              suffix: '',
            },
            { title: isBn ? 'দৈনিক রিপোর্ট' : 'Reports', data: reportRank, color: 'var(--teal)', key: 'rate' as const, suffix: '%' },
            { title: isBn ? 'হোমওয়ার্ক' : 'Homework', data: homeworkRank, color: 'var(--green)', key: 'rate' as const, suffix: '%' },
            {
              title: isBn ? 'উপস্থিতি' : 'Attendance',
              data: attendanceRank,
              color: 'var(--purple)',
              key: 'rate' as const,
              suffix: '%',
            },
          ].map((card) => (
            <div key={card.title} className="bg-[var(--bg-secondary)] rounded-[0.625rem] p-3">
              <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] mb-[0.625rem]">{card.title}</div>
              {card.data.slice(0, 3).map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 py-[0.3125rem] px-0 border-b border-[var(--border)]">
                  <span
                    className={`text-[0.6875rem] font-bold w-[1.125rem] text-center ${i === 0 ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'}`}
                  >
                    #{i + 1}
                  </span>
                  <div
                    className="w-[1.625rem] h-[1.625rem] rounded-[0.4375rem] flex items-center justify-center shrink-0 text-[0.5rem] font-semibold text-white"
                    style={{ background: getAvatarGradient(t.id) }}
                  >
                    {getInitials(t.nameEn)}
                  </div>
                  <div className="flex-1 min-w-[0]">
                    <div className="text-xs font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">
                      {t.nameEn}
                    </div>
                    <div className="text-[0.625rem] text-[var(--text-muted)]">{getTeacherDept(t.id)}</div>
                  </div>
                  <div className="text-[0.8125rem] font-bold" style={{ color: card.color }}>
                    {(t as any)[card.key]}
                    {card.suffix}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className={sectionCls(isMobile)}>
        <div className={sectionTitleCls}>
          <DollarSign size={15} className="text-[var(--green)]" />
          {isBn ? 'আর্থিক সারসংক্ষেপ' : 'Financial Summary'}
        </div>
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
          {[
            {
              label: isBn ? 'মোট বেতন' : 'Total Salary',
              val: `৳${adjustedTotalSalary.toLocaleString()}`,
              color: 'var(--text-primary)',
            },
            {
              label: isBn ? 'বেতন কাটা' : 'Deductions',
              val: salaryDeductions > 0 ? `-৳${salaryDeductions.toLocaleString()}` : '৳0',
              color: salaryDeductions > 0 ? 'var(--red)' : 'var(--text-muted)',
            },
            { label: isBn ? 'মোট বৃদ্ধি' : 'Increments', val: `৳${totalIncrements.toLocaleString()}`, color: 'var(--green)' },
            { label: isBn ? 'মোট বোনাস' : 'Bonuses', val: `৳${totalBonuses.toLocaleString()}`, color: 'var(--amber)' },
            { label: isBn ? 'তহবিল' : 'Fund Balance', val: `৳${fundBalance.toLocaleString()}`, color: 'var(--brand)' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-[var(--bg-secondary)]">
              <div className="text-[0.6875rem] text-[var(--text-muted)] mb-1">{item.label}</div>
              <div className="text-lg font-bold" style={{ color: item.color }}>
                {item.val}
              </div>
            </div>
          ))}
        </div>
        {salaryDeductions > 0 && (
          <div className="mt-2 py-2 px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[0.6875rem] text-[var(--red)] flex items-center gap-1.5">
            <DollarSign size={13} />
            {isBn
              ? `বেতন কাটার নিয়ম প্রযোজ্য: ${activeTeachers.filter((t) => t.applySalaryRule).length} জন কর্মচারীর ক্ষেত্রে ১ দিনের বেতন কাটা হয়েছে`
              : `Salary rule applied: 1 day deducted for ${activeTeachers.filter((t) => t.applySalaryRule).length} staff with ≥3 days attendance`}
          </div>
        )}
      </div>

      {/* Employees */}
      <div className={sectionCls(isMobile)}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            {isBn ? 'সকল কর্মচারী' : 'All Staff'}
            <span className="inline-flex items-center gap-[0.1875rem] ml-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-[0.25rem] h-1 rounded-full bg-[var(--brand)] opacity-30 transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.transform = 'scale(1.8)'
                    e.currentTarget.style.background = ['var(--green)', 'var(--brand)', 'var(--amber)'][i]
                  }}
                  onMouseLeave={(e) => {
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
              <Search size={13} className="absolute left-[0.625rem] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
                className={`${inputCls} pl-[1.875rem] text-xs h-[2.125rem] w-[8.125rem]`}
              />
            </div>
            <select
              value={employeeStatusFilter}
              onChange={(e) => {
                setEmployeeStatusFilter(e.target.value)
                setPage(1)
              }}
              className={`${inputCls} w-[5.625rem] text-xs h-[2.125rem]`}
            >
              <option value="all">{isBn ? 'সব' : 'All'}</option>
              <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
              <option value="inactive">{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
              <option value="on-leave">{isBn ? 'ছুটিতে' : 'Leave'}</option>
            </select>
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden shrink-0 h-[2.125rem]">
              <button
                onClick={() => setEmployeeView('grid')}
                className={`py-0 px-[0.625rem] border-none cursor-pointer font-[inherit] transition-all flex items-center ${employeeView === 'grid' ? 'bg-[var(--brand-light)]' : 'bg-transparent'} ${employeeView === 'grid' ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setEmployeeView('list')}
                className={`py-0 px-[0.625rem] border-none cursor-pointer font-[inherit] transition-all flex items-center ${employeeView === 'list' ? 'bg-[var(--brand-light)]' : 'bg-transparent'} ${employeeView === 'list' ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {employeeView === 'grid' ? (
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {paginatedEmployees.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedEmployee(selectedEmployee === t.id ? null : t.id)}
                className={`p-3 rounded-[0.625rem] cursor-pointer transition-all ${selectedEmployee === t.id ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-secondary)]'}`}
              >
                <div className="flex items-center gap-[0.625rem] mb-[0.625rem]">
                  <div
                    className="w-[2.125rem] h-[2.125rem] rounded-lg flex items-center justify-center text-[0.625rem] font-semibold text-white shrink-0 overflow-hidden"
                    style={{ background: t.photo ? 'transparent' : getAvatarGradient(t.id) }}
                  >
                    {t.photo ? (
                      <img src={t.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(t.nameEn)
                    )}
                  </div>
                  <div className="flex-1 min-w-[0]">
                    <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">
                      {t.nameEn}
                    </div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)]">{t.designation}</div>
                  </div>
                  {getStatusBadge(t.status)}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center py-[0.3125rem] px-[0.125rem] rounded-md bg-[var(--bg-primary)]">
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'উপস্থিতি' : 'Att.'}</div>
                    <div className={`text-xs font-semibold ${t.attRate! >= 80 ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>
                      {t.attRate}%
                    </div>
                  </div>
                  <div className="text-center py-[0.3125rem] px-[0.125rem] rounded-md bg-[var(--bg-primary)]">
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'হোমওয়ার্ক' : 'HW'}</div>
                    <div className={`text-xs font-semibold ${t.hwRate! >= 80 ? 'text-[var(--green)]' : 'text-[var(--amber)]'}`}>
                      {t.hwRate}%
                    </div>
                  </div>
                  <div className="text-center py-[0.3125rem] px-[0.125rem] rounded-md bg-[var(--bg-primary)]">
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? 'স্কোর' : 'Score'}</div>
                    <div className="text-xs font-bold text-[var(--brand)]">{t.compScore}</div>
                  </div>
                </div>
                {selectedEmployee === t.id && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)] flex gap-1.5 flex-wrap">
                    <span className="text-[0.6875rem] text-[var(--text-secondary)]">{t.phone}</span>
                    <span className="text-[0.6875rem] text-[var(--text-muted)]">·</span>
                    <span className="text-[0.6875rem] text-[var(--text-secondary)]">{getTeacherDept(t.id)}</span>
                    <span className="text-[0.6875rem] text-[var(--text-muted)]">·</span>
                    <span className="text-[0.6875rem] text-[var(--text-secondary)]">৳{t.salary.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))}
            {employeeList.length === 0 && (
              <div className="col-span-full p-[1.875rem] text-center text-[var(--text-muted)] text-[0.8125rem]">
                {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No staff found'}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[37.5rem]">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  {[
                    isBn ? 'কর্মচারী' : 'Employee',
                    isBn ? 'বিভাগ' : 'Dept',
                    isBn ? 'পদবি' : 'Designation',
                    isBn ? 'উপস্থিতি' : 'Att',
                    isBn ? 'হোমওয়ার্ক' : 'HW',
                    isBn ? 'স্কোর' : 'Score',
                    isBn ? 'স্ট্যাটাস' : 'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-[0.625rem] px-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.025rem] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border)]"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-[0.625rem]">
                        <div
                          className="w-[1.875rem] h-[1.875rem] rounded-[0.4375rem] flex items-center justify-center text-[0.5625rem] font-semibold text-white shrink-0 overflow-hidden"
                          style={{ background: t.photo ? 'transparent' : getAvatarGradient(t.id) }}
                        >
                          {t.photo ? (
                            <img src={t.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(t.nameEn)
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">{t.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[0.6875rem] text-[var(--text-secondary)]">{getTeacherDept(t.id)}</td>
                    <td className="py-2 px-2 text-[0.6875rem] text-[var(--text-secondary)]">{t.designation}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-[0.3125rem] rounded-[0.1875rem] bg-[var(--border)] overflow-hidden">
                          <div
                            className={`h-full rounded-[0.1875rem] ${t.attRate! >= 80 ? 'bg-[var(--green)]' : t.attRate! >= 60 ? 'bg-[var(--amber)]' : 'bg-[var(--red)]'}`}
                          />
                        </div>
                        <span
                          className={`text-[0.6875rem] font-semibold ${t.attRate! >= 80 ? 'text-[var(--green)]' : t.attRate! >= 60 ? 'text-[var(--amber)]' : 'text-[var(--red)]'}`}
                        >
                          {t.attRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`text-[0.6875rem] font-semibold ${t.hwRate! >= 80 ? 'text-[var(--green)]' : t.hwRate! >= 50 ? 'text-[var(--amber)]' : 'text-[var(--red)]'}`}
                      >
                        {t.hwRate}%
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-xs font-bold text-[var(--brand)]">{t.compScore}</span>
                    </td>
                    <td className="py-2 px-2">{getStatusBadge(t.status)}</td>
                  </tr>
                ))}
                {employeeList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-[1.875rem] text-center text-[var(--text-muted)] text-xs">
                      {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No staff found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-[0.6875rem] text-[var(--text-muted)] mt-2 text-right">
          {isBn ? `মোট ${employeeList.length} জন কর্মচারী` : `${employeeList.length} total`}
        </div>
        {employeeList.length > perPage && (
          <div className="py-[0.625rem] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, employeeList.length)} / {employeeList.length}
            </span>
            <div className="flex gap-[0.1875rem] items-center">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="py-1 px-[0.375rem] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[0.6875rem] font-[inherit] outline-none mr-[0.375rem]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              {[
                [<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean],
                [<ChevronLeft size={12} />, () => setPage((p) => Math.max(1, p - 1)), page === 1] as [
                  React.ReactNode,
                  () => void,
                  boolean,
                ],
              ].map(([ic, a, d], i) => (
                <button
                  key={i}
                  onClick={a}
                  disabled={d}
                  className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {ic}
                </button>
              ))}
              {(() => {
                const start = Math.max(1, Math.min(page - 2, employeeTotalPages - 4))
                return Array.from({ length: Math.min(5, employeeTotalPages) }, (_, i) => start + i).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}
                  >
                    {p}
                  </button>
                ))
              })()}
              {[
                [
                  <ChevronRight size={12} />,
                  () => setPage((p) => Math.min(employeeTotalPages, p + 1)),
                  page === employeeTotalPages,
                ] as [React.ReactNode, () => void, boolean],
                [<ChevronsRight size={12} />, () => setPage(employeeTotalPages), page === employeeTotalPages] as [
                  React.ReactNode,
                  () => void,
                  boolean,
                ],
              ].map(([ic, a, d], i) => (
                <button
                  key={i}
                  onClick={a}
                  disabled={d}
                  className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
})
