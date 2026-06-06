import React from 'react'
import {
  HR_INCREMENT_COLUMNS,
  HR_BONUS_COLUMNS,
  HR_PROMOTION_COLUMNS,
  HR_FUND_COLUMNS,
  HR_ASSIGNMENT_COLUMNS,
  HR_SALARY_COLUMNS,
} from '@/pages/hr/listPdfTemplate'
import type { HRPDFColumn, HRListPDFOptions } from '@/pages/hr/listPdfTemplate'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'

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
  onClose: () => void
  onDownload: (opts: HRListPDFOptions) => void
}

export const HRPDFOptionsModal = React.memo(function HRPDFOptionsModal({ type, count, isBn, onClose, onDownload }: Props) {
  const title = TITLE_MAP[type]
  return (
    <GenericPDFOptionsModal
      columns={COLUMN_MAP[type]}
      defaultTitle={title.en}
      defaultTitleBn={title.bn}
      recordLabel="records"
      recordLabelBn="টি"
      count={count}
      isBn={isBn}
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
