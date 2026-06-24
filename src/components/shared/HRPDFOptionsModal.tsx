import React, { useCallback } from 'react'
import {
  HR_INCREMENT_COLUMNS,
  HR_BONUS_COLUMNS,
  HR_PROMOTION_COLUMNS,
  HR_FUND_COLUMNS,
  HR_ASSIGNMENT_COLUMNS,
  HR_SALARY_COLUMNS,
  generateIncrementPDF,
  generateBonusPDF,
  generatePromotionPDF,
  generateFundPDF,
  generateAssignmentPDF,
  generateSalaryPDF,
} from '@/pages/hr/listPdfTemplate'
import type { HRPDFColumn, HRListPDFOptions } from '@/pages/hr/listPdfTemplate'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from './GenericPDFOptionsModal'
import type { IncrementRecord, BonusRecord, PromotionRecord, FundRecord, TeacherFacility, MonthlySalaryConfig } from '@/store/hrStore'

type HRType = 'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary'

const COLUMN_MAP: Record<HRType, HRPDFColumn[]> = {
  increment: HR_INCREMENT_COLUMNS,
  bonus: HR_BONUS_COLUMNS,
  promotion: HR_PROMOTION_COLUMNS,
  fund: HR_FUND_COLUMNS,
  assignment: HR_ASSIGNMENT_COLUMNS,
  salary: HR_SALARY_COLUMNS,
}

const TITLE_MAP: Record<HRType, { en: string; bn: string }> = {
  increment: { en: 'Increment List', bn: 'বৃদ্ধি তালিকা' },
  bonus: { en: 'Bonus List', bn: 'বোনাস তালিকা' },
  promotion: { en: 'Promotion List', bn: 'পদোন্নতি তালিকা' },
  fund: { en: 'Fund Transactions', bn: 'তহবিল লেনদেন' },
  assignment: { en: 'Facility Assignments', bn: 'সুবিধা বরাদ্দ' },
  salary: { en: 'Salary Statement', bn: 'বেতন স্টেটমেন্ট' },
}

interface Props {
  type: HRType
  count: number
  isBn: boolean
  institutionName?: string
  increments?: unknown[]
  filteredBonuses?: unknown[]
  filteredPromotions?: unknown[]
  filteredAssignments?: unknown[]
  funds?: unknown[]
  salaryData?: unknown[]
  getTeacherName?: (id: string) => string
  getFacilityName?: (id: string) => string
  onClose: () => void
  onDownload: (opts: HRListPDFOptions) => void
}

export const HRPDFOptionsModal = React.memo(function HRPDFOptionsModal({
  type,
  count,
  isBn,
  institutionName,
  increments,
  filteredBonuses,
  filteredPromotions,
  filteredAssignments,
  funds,
  salaryData,
  getTeacherName,
  getFacilityName,
  onClose,
  onDownload,
}: Props) {
  const title = TITLE_MAP[type]

  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) => {
      const pdfOpts: HRListPDFOptions = { ...opts, institutionName }
      const teacherNameFn = getTeacherName || ((id: string) => id)
      const facilityNameFn = getFacilityName || ((id: string) => id)

      switch (type) {
        case 'increment':
          return generateIncrementPDF(increments as IncrementRecord[], pdfOpts, teacherNameFn)
        case 'bonus':
          return generateBonusPDF(filteredBonuses as BonusRecord[], pdfOpts, teacherNameFn)
        case 'promotion':
          return generatePromotionPDF(filteredPromotions as PromotionRecord[], pdfOpts, teacherNameFn)
        case 'fund':
          return generateFundPDF(funds as FundRecord[], pdfOpts)
        case 'assignment':
          return generateAssignmentPDF(filteredAssignments as TeacherFacility[], pdfOpts, teacherNameFn, facilityNameFn)
        case 'salary':
          return generateSalaryPDF(salaryData as MonthlySalaryConfig[], pdfOpts)
        default:
          return ''
      }
    },
    [type, institutionName, increments, filteredBonuses, filteredPromotions, filteredAssignments, funds, salaryData, getTeacherName, getFacilityName]
  )

  return (
    <GenericPDFOptionsModal
      columns={COLUMN_MAP[type]}
      defaultTitle={title.en}
      defaultTitleBn={title.bn}
      recordLabel="records"
      recordLabelBn="টি"
      count={count}
      isBn={isBn}
      previewRenderer={previewRenderer}
      onClose={onClose}
      onDownload={(opts) =>
        onDownload({
          title: opts.title,
          selectedCols: opts.selectedCols,
          emptyRows: opts.emptyRows,
          emptyColumns: opts.emptyColumns,
          orientation: opts.orientation,
          isBn: opts.isBn,
        })
      }
    />
  )
})
