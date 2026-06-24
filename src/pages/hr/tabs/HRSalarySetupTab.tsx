import {
  Calculator,
  Save,
  Download,
  CheckCircle2,
  TrendingDown,
  HandCoins,
} from 'lucide-react'
import type { MonthlySalaryConfig } from '@/store/hrStore'
import type { Teacher } from '@/pages/teachers/types'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { sectionCls, sectionTitleCls, inputCls } from '@/pages/hr/utils'

interface BonusRecord {
  id: string
  teacherId: string
  month: string
  type: string
  amount: number
}

interface SalaryConfig {
  bonus?: number
  festivalBonus?: number
  applyDeductionRule?: boolean
  fundContributionPercent?: number
}

interface HRSalarySetupTabProps {
  isBn: boolean
  isMobile: boolean
  teachers: Teacher[]
  activeTeachers: Teacher[]
  bonuses: BonusRecord[]
  paginatedActiveTeachers: Teacher[]
  selectedSalary: string[]
  toggleSalary: (id: string) => void
  toggleAllSalary: () => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  perPage: number
  setPerPage: (v: number) => void
  salaryTotalPages: number
  salarySetupMonth: string
  setSalarySetupMonth: (v: string) => void
  salaryConfigs: Record<string, SalaryConfig>
  setSalaryConfigs: React.Dispatch<React.SetStateAction<Record<string, SalaryConfig>>>
  monthlySalaryConfigs: MonthlySalaryConfig[]
  salarySaved: boolean
  setSalarySaved: (v: boolean) => void
  bulkDeductionEnabled: boolean
  setBulkDeductionEnabled: (v: boolean) => void
  bulkDeductionFrom: string
  setBulkDeductionFrom: (v: string) => void
  bulkDeductionTo: string
  setBulkDeductionTo: (v: string) => void
  bulkFundEnabled: boolean
  setBulkFundEnabled: (v: boolean) => void
  bulkFundPercent: string
  setBulkFundPercent: (v: string) => void
  handleBulkApplyDeduction: () => void
  handleBulkApplyFund: () => void
  setShowPDFModal: (v: 'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary' | null) => void
  upsertManyMonthlySalaryConfigs: (configs: MonthlySalaryConfig[]) => void
}

export default function HRSalarySetupTab({
  isBn,
  isMobile,
  activeTeachers,
  bonuses,
  paginatedActiveTeachers,
  selectedSalary,
  toggleSalary,
  toggleAllSalary,
  page,
  setPage,
  perPage,
  setPerPage,
  salaryTotalPages,
  salarySetupMonth,
  setSalarySetupMonth,
  salaryConfigs,
  setSalaryConfigs,
  monthlySalaryConfigs,
  salarySaved,
  setSalarySaved,
  bulkDeductionEnabled,
  setBulkDeductionEnabled,
  bulkDeductionFrom,
  setBulkDeductionFrom,
  bulkDeductionTo,
  setBulkDeductionTo,
  bulkFundEnabled,
  setBulkFundEnabled,
  bulkFundPercent,
  setBulkFundPercent,
  handleBulkApplyDeduction,
  handleBulkApplyFund,
  setShowPDFModal,
  upsertManyMonthlySalaryConfigs,
}: HRSalarySetupTabProps) {
  return (
    <div className={sectionCls(isMobile)}>
      <div className="flex justify-between items-center mb-[0.875rem] flex-wrap gap-2">
        <div className={sectionTitleCls}>
          <Calculator size={15} className="text-[var(--teal)]" />
          {isBn ? 'মাসিক বেতন সেটআপ' : 'Monthly Salary Setup'}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="month"
            value={salarySetupMonth}
            onChange={(e) => setSalarySetupMonth(e.target.value)}
            className={`${inputCls} w-auto max-w-[10rem] py-[0.375rem] px-[0.625rem] text-xs`}
          />
          <button
            onClick={() => {
              const configs: MonthlySalaryConfig[] = activeTeachers.map((t) => {
                const existing = monthlySalaryConfigs.find((c) => c.teacherId === t.id && c.month === salarySetupMonth)
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
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-4 rounded-lg bg-[var(--teal)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
          >
            <Save size={14} />
            {isBn ? 'সংরক্ষণ' : 'Save'}
          </button>
          <button
            onClick={() => setShowPDFModal('salary')}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-4 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      {salarySaved && (
        <div className="mb-3 py-2 px-3 rounded-lg bg-[var(--green-light)] text-[var(--green)] text-xs font-medium">
          <CheckCircle2 size={14} className="inline mr-[0.375rem]" />
          {isBn ? 'বেতন সেটআপ সংরক্ষিত হয়েছে!' : 'Salary setup saved!'}
        </div>
      )}

      {/* Bulk Salary Setup Section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg py-2 px-3 mb-3 flex items-center gap-4 flex-wrap">
        <div className="text-[0.625rem] font-semibold text-[var(--text-primary)] flex items-center gap-1 whitespace-nowrap">
          <Calculator size={11} className="text-[var(--teal)]" />
          {isBn ? 'বাল্ক সেটআপ' : 'Bulk Setup'}
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer text-[0.625rem] text-[var(--text-secondary)] whitespace-nowrap">
            <input
              type="checkbox"
              checked={bulkDeductionEnabled}
              onChange={(e) => setBulkDeductionEnabled(e.target.checked)}
              className="w-[0.6875rem] h-[0.6875rem] cursor-pointer accent-[var(--red)]"
            />
            <TrendingDown size={10} className="text-[var(--red)]" />
            {isBn ? 'কাটা' : 'Deduction'}
          </label>
          {bulkDeductionEnabled && (
            <>
              <input
                type="date"
                value={bulkDeductionFrom}
                onChange={(e) => setBulkDeductionFrom(e.target.value)}
                className="py-[0.1875rem] px-[0.3125rem] rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.625rem] font-[inherit] outline-none w-[6.875rem]"
              />
              <span className="text-[0.5625rem] text-[var(--text-muted)]">-</span>
              <input
                type="date"
                value={bulkDeductionTo}
                onChange={(e) => setBulkDeductionTo(e.target.value)}
                className="py-[0.1875rem] px-[0.3125rem] rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.625rem] font-[inherit] outline-none w-[6.875rem]"
              />
            </>
          )}
          <button
            onClick={handleBulkApplyDeduction}
            className={`py-[0.1875rem] px-2 rounded border-none text-[0.5625rem] font-medium cursor-pointer font-[inherit] whitespace-nowrap ${bulkDeductionEnabled ? 'bg-[var(--red)]' : 'bg-[var(--border)]'} ${bulkDeductionEnabled ? 'text-white' : 'text-[var(--text-muted)]'}`}
          >
            {isBn ? 'প্রয়োগ' : 'Apply'}
          </button>
        </div>
        <div className="w-[0.0625rem] h-4 bg-[var(--border)]" />
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 cursor-pointer text-[0.625rem] text-[var(--text-secondary)] whitespace-nowrap">
            <input
              type="checkbox"
              checked={bulkFundEnabled}
              onChange={(e) => setBulkFundEnabled(e.target.checked)}
              className="w-[0.6875rem] h-[0.6875rem] cursor-pointer accent-[var(--brand)]"
            />
            <HandCoins size={10} className="text-[var(--brand)]" />
            {isBn ? 'তহবিল' : 'Fund'}
          </label>
          {bulkFundEnabled && (
            <input
              type="number"
              value={bulkFundPercent}
              onChange={(e) => setBulkFundPercent(e.target.value)}
              className="py-[0.1875rem] px-[0.3125rem] rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.625rem] font-[inherit] outline-none w-[2.8125rem] text-right"
              placeholder="%"
              min={0}
              max={100}
            />
          )}
          {bulkFundEnabled && <span className="text-[0.5625rem] text-[var(--text-muted)]">%</span>}
          <button
            onClick={handleBulkApplyFund}
            className={`py-[0.1875rem] px-2 rounded border-none text-[0.5625rem] font-medium cursor-pointer font-[inherit] whitespace-nowrap ${bulkFundEnabled ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'} ${bulkFundEnabled ? 'text-white' : 'text-[var(--text-muted)]'}`}
          >
            {isBn ? 'প্রয়োগ' : 'Apply'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[0.6875rem] min-w-[56.25rem]">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <th className="py-2 px-[0.625rem] text-center w-9">
                <input
                  type="checkbox"
                  checked={selectedSalary.length === activeTeachers.length && activeTeachers.length > 0}
                  onChange={toggleAllSalary}
                  className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                />
              </th>
              <th className="py-2 px-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'কর্মচারী' : 'Employee'}
              </th>
              <th className="py-2 px-2 text-right text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'মূল বেতন' : 'Basic'}
              </th>
              <th className="py-2 px-[0.375rem] text-right text-[0.5625rem] font-semibold text-[var(--green)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'কর্মদক্ষতা' : 'Perf.'}
              </th>
              <th className="py-2 px-[0.375rem] text-right text-[0.5625rem] font-semibold text-[var(--teal)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'উপস্থিতি' : 'Atten.'}
              </th>
              <th className="py-2 px-[0.375rem] text-right text-[0.5625rem] font-semibold text-[var(--purple)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'বিশেষ' : 'Special'}
              </th>
              <th className="py-2 px-[0.375rem] text-right text-[0.5625rem] font-semibold text-[var(--amber)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'উৎসব' : 'Festival'}
              </th>
              <th className="py-2 px-2 text-right text-[0.625rem] font-bold text-[var(--text-primary)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'মোট বোনাস' : 'Total B.'}
              </th>
              <th className="py-2 px-[0.375rem] text-center text-[0.5625rem] font-semibold text-[var(--red)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'কাটা' : 'Ded.'}
              </th>
              <th className="py-2 px-[0.375rem] text-right text-[0.5625rem] font-semibold text-[var(--brand)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'তহবিল' : 'Fund'}
              </th>
              <th className="py-2 px-2 text-right text-[0.625rem] font-bold text-[var(--text-primary)] uppercase tracking-[0.0187rem] whitespace-nowrap">
                {isBn ? 'নেট বেতন' : 'Net Pay'}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedActiveTeachers.map((t) => {
              const existing = monthlySalaryConfigs.find((c) => c.teacherId === t.id && c.month === salarySetupMonth)
              const local = salaryConfigs[t.id] || {}
              const applyDeduction = local.applyDeductionRule ?? existing?.applyDeductionRule ?? false
              const fundPercent = local.fundContributionPercent ?? existing?.fundContributionPercent ?? 0
              const teacherBonuses = bonuses.filter((b) => b.teacherId === t.id && b.month === salarySetupMonth)
              const perfBonus = teacherBonuses.filter((b) => b.type === 'performance').reduce((sum, b) => sum + b.amount, 0)
              const attenBonus = teacherBonuses.filter((b) => b.type === 'attendance').reduce((sum, b) => sum + b.amount, 0)
              const specialBonus = teacherBonuses.filter((b) => b.type === 'special').reduce((sum, b) => sum + b.amount, 0)
              const festivalBonus = teacherBonuses.filter((b) => b.type === 'festival').reduce((sum, b) => sum + b.amount, 0)
              const totalBonus = perfBonus + attenBonus + specialBonus + festivalBonus
              const daysInMonth = 30
              const dailySalary = Math.round(t.salary / daysInMonth)
              const deductionAmount = applyDeduction ? dailySalary : 0
              const fundAmount = Math.round((t.salary * fundPercent) / 100)
              const netPay = t.salary + totalBonus - deductionAmount - fundAmount

              return (
                <tr
                  key={t.id}
                  className="border-b border-[var(--border)]"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-[0.4375rem] px-[0.625rem] text-center">
                    <input
                      type="checkbox"
                      checked={selectedSalary.includes(t.id)}
                      onChange={() => toggleSalary(t.id)}
                      className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                    />
                  </td>
                  <td className="py-[0.4375rem] px-2">
                    <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{t.designation}</div>
                  </td>
                  <td className="py-[0.4375rem] px-2 text-right text-[0.6875rem] font-semibold text-[var(--text-primary)]">
                    ৳{t.salary.toLocaleString()}
                  </td>
                  <td
                    className={`py-[0.4375rem] px-[0.375rem] text-right text-[0.625rem] font-medium ${perfBonus > 0 ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}
                  >
                    {perfBonus > 0 ? `৳${perfBonus.toLocaleString()}` : '-'}
                  </td>
                  <td
                    className={`py-[0.4375rem] px-[0.375rem] text-right text-[0.625rem] font-medium ${attenBonus > 0 ? 'text-[var(--teal)]' : 'text-[var(--text-muted)]'}`}
                  >
                    {attenBonus > 0 ? `৳${attenBonus.toLocaleString()}` : '-'}
                  </td>
                  <td
                    className={`py-[0.4375rem] px-[0.375rem] text-right text-[0.625rem] font-medium ${specialBonus > 0 ? 'text-[var(--purple)]' : 'text-[var(--text-muted)]'}`}
                  >
                    {specialBonus > 0 ? `৳${specialBonus.toLocaleString()}` : '-'}
                  </td>
                  <td
                    className={`py-[0.4375rem] px-[0.375rem] text-right text-[0.625rem] font-medium ${festivalBonus > 0 ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'}`}
                  >
                    {festivalBonus > 0 ? `৳${festivalBonus.toLocaleString()}` : '-'}
                  </td>
                  <td
                    className={`py-[0.4375rem] px-2 text-right text-[0.6875rem] font-bold ${totalBonus > 0 ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}
                  >
                    {totalBonus > 0 ? `৳${totalBonus.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-[0.4375rem] px-[0.375rem] text-center">
                    <input
                      type="checkbox"
                      checked={applyDeduction}
                      onChange={(e) =>
                        setSalaryConfigs((p) => ({
                          ...p,
                          [t.id]: {
                            ...p[t.id],
                            applyDeductionRule: e.target.checked,
                            bonus: p[t.id]?.bonus ?? 0,
                            festivalBonus: p[t.id]?.festivalBonus ?? 0,
                            fundContributionPercent: p[t.id]?.fundContributionPercent ?? 0,
                          },
                        }))
                      }
                      className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                    />
                  </td>
                  <td
                    className={`py-[0.4375rem] px-[0.375rem] text-right text-[0.625rem] font-medium ${fundAmount > 0 ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}
                  >
                    {fundPercent > 0 ? `${fundPercent}%` : '-'}
                  </td>
                  <td className="py-[0.4375rem] px-2 text-right text-[0.6875rem] font-bold text-[var(--green)]">৳{netPay.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--bg-secondary)] border-t border-t-2 border-[var(--border)]">
              <td className="py-2 px-[0.625rem]"></td>
              <td className="py-2 px-2 text-[0.6875rem] font-bold text-[var(--text-primary)]">{isBn ? 'মোট' : 'Total'}</td>
              <td className="py-2 px-2 text-right text-[0.6875rem] font-bold">
                ৳{activeTeachers.reduce((s, t) => s + t.salary, 0).toLocaleString()}
              </td>
              <td className="py-2 px-[0.375rem] text-right text-[0.625rem] font-bold text-[var(--green)]">
                ৳
                {activeTeachers
                  .reduce(
                    (s, t) =>
                      s +
                      bonuses
                        .filter((b) => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'performance')
                        .reduce((sum, b) => sum + b.amount, 0),
                    0
                  )
                  .toLocaleString()}
              </td>
              <td className="py-2 px-[0.375rem] text-right text-[0.625rem] font-bold text-[var(--teal)]">
                ৳
                {activeTeachers
                  .reduce(
                    (s, t) =>
                      s +
                      bonuses
                        .filter((b) => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'attendance')
                        .reduce((sum, b) => sum + b.amount, 0),
                    0
                  )
                  .toLocaleString()}
              </td>
              <td className="py-2 px-[0.375rem] text-right text-[0.625rem] font-bold text-[var(--purple)]">
                ৳
                {activeTeachers
                  .reduce(
                    (s, t) =>
                      s +
                      bonuses
                        .filter((b) => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'special')
                        .reduce((sum, b) => sum + b.amount, 0),
                    0
                  )
                  .toLocaleString()}
              </td>
              <td className="py-2 px-[0.375rem] text-right text-[0.625rem] font-bold text-[var(--amber)]">
                ৳
                {activeTeachers
                  .reduce(
                    (s, t) =>
                      s +
                      bonuses
                        .filter((b) => b.teacherId === t.id && b.month === salarySetupMonth && b.type === 'festival')
                        .reduce((sum, b) => sum + b.amount, 0),
                    0
                  )
                  .toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right text-[0.6875rem] font-bold text-[var(--green)]">
                ৳
                {activeTeachers
                  .reduce(
                    (s, t) =>
                      s +
                      bonuses.filter((b) => b.teacherId === t.id && b.month === salarySetupMonth).reduce((sum, b) => sum + b.amount, 0),
                    0
                  )
                  .toLocaleString()}
              </td>
              <td className="py-2 px-[0.375rem] text-right text-[0.625rem] font-bold text-[var(--red)]">
                ৳
                {activeTeachers
                  .reduce((s, t) => {
                    const local = salaryConfigs[t.id]
                    const existing = monthlySalaryConfigs.find((c) => c.teacherId === t.id && c.month === salarySetupMonth)
                    const ded = (local?.applyDeductionRule ?? existing?.applyDeductionRule ?? false) ? Math.round(t.salary / 30) : 0
                    return s + ded
                  }, 0)
                  .toLocaleString()}
              </td>
              <td className="py-2 px-[0.375rem] text-right text-[0.625rem] font-bold text-[var(--brand)]">
                ৳
                {activeTeachers
                  .reduce((s, t) => {
                    const local = salaryConfigs[t.id]
                    const existing = monthlySalaryConfigs.find((c) => c.teacherId === t.id && c.month === salarySetupMonth)
                    const fund = Math.round(
                      (t.salary * (local?.fundContributionPercent ?? existing?.fundContributionPercent ?? 0)) / 100
                    )
                    return s + fund
                  }, 0)
                  .toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right text-xs font-bold text-[var(--green)]">
                ৳
                {activeTeachers
                  .reduce((s, t) => {
                    const local = salaryConfigs[t.id]
                    const existing = monthlySalaryConfigs.find((c) => c.teacherId === t.id && c.month === salarySetupMonth)
                    const teacherBonuses = bonuses.filter((b) => b.teacherId === t.id && b.month === salarySetupMonth)
                    const totalBon = teacherBonuses.reduce((sum, b) => sum + b.amount, 0)
                    const ded = (local?.applyDeductionRule ?? existing?.applyDeductionRule ?? false) ? Math.round(t.salary / 30) : 0
                    const fund = Math.round(
                      (t.salary * (local?.fundContributionPercent ?? existing?.fundContributionPercent ?? 0)) / 100
                    )
                    return s + t.salary + totalBon - ded - fund
                  }, 0)
                  .toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <PaginationControls
        page={page}
        setPage={setPage}
        perPage={perPage}
        setPerPage={setPerPage}
        total={activeTeachers.length}
        totalPages={salaryTotalPages}
        isBn={isBn}
      />
      {selectedSalary.length > 0 && (
        <div className="mt-2 text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[0.625rem] rounded-md inline-block">
          {selectedSalary.length} {isBn ? 'নির্বাচিত' : 'selected'}
        </div>
      )}
    </div>
  )
}
