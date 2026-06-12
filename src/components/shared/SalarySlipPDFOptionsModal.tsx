import React, { useCallback } from 'react'
import { ALL_SALARY_SLIP_PDF_COLUMNS, generateSingleSalarySlipPDF, generateAllSalarySlipsPDF } from '@/pages/payroll/pdfTemplates/salarySlipPdfTemplate'
import type { SalarySlipEmployee, SalarySlipPdfOptions } from '@/pages/payroll/pdfTemplates/salarySlipPdfTemplate'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface SingleSlipProps {
  mode: 'single'
  employee: SalarySlipEmployee
  month: string
  isBn: boolean
  onClose: () => void
  onDownload: (html: string) => void
}

interface BatchProps {
  mode: 'batch'
  employees: SalarySlipEmployee[]
  month: string
  isBn: boolean
  onClose: () => void
  onDownload: (html: string) => void
}

type Props = SingleSlipProps | BatchProps

export const SalarySlipPDFOptionsModal = React.memo(function SalarySlipPDFOptionsModal(props: Props) {
  const { mode, month, isBn, onClose, onDownload } = props

  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) => {
      const pdfOpts: SalarySlipPdfOptions = { orientation: opts.orientation, isBn: opts.isBn }
      if (mode === 'single') {
        return generateSingleSalarySlipPDF(props.employee, month, pdfOpts)
      }
      return generateAllSalarySlipsPDF(props.employees, month, pdfOpts)
    },
    [mode, month, props]
  )

  const handleDownload = useCallback(
    (opts: GenericPDFOptionsResult) => {
      const pdfOpts: SalarySlipPdfOptions = { orientation: opts.orientation, isBn: opts.isBn }
      if (mode === 'single') {
        onDownload(generateSingleSalarySlipPDF(props.employee, month, pdfOpts))
      } else {
        onDownload(generateAllSalarySlipsPDF(props.employees, month, pdfOpts))
      }
    },
    [mode, month, props, onDownload]
  )

  const count = mode === 'single' ? 1 : props.employees.length
  const title = mode === 'single' ? (isBn ? 'বেতন পর্চি' : 'Salary Slip') : (isBn ? 'সকল কর্মচারীর বেতন পর্চি' : 'All Salary Slips')

  return (
    <GenericPDFOptionsModal
      columns={ALL_SALARY_SLIP_PDF_COLUMNS}
      defaultTitle={title}
      defaultTitleBn={title}
      recordLabel={mode === 'single' ? 'employee' : 'employees'}
      recordLabelBn={mode === 'single' ? 'জন কর্মচারী' : 'জন কর্মচারী'}
      count={count}
      isBn={isBn}
      showColumns={false}
      previewRenderer={previewRenderer}
      onClose={onClose}
      onDownload={handleDownload}
    />
  )
})
