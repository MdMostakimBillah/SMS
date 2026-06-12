import React, { useCallback } from 'react'
import { ALL_TABULATION_PDF_COLUMNS, generateTabulationPDF } from '@/pages/exams/step4/tabulationPdfTemplate'
import type { TabulationPdfOptions, TabulationStudentRow } from '@/pages/exams/step4/tabulationPdfTemplate'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  count: number
  isBn: boolean
  rows: TabulationStudentRow[]
  examName?: string
  className?: string
  sectionName?: string
  onClose: () => void
  onDownload: (opts: TabulationPdfOptions) => void
}

export const TabulationPDFOptionsModal = React.memo(function TabulationPDFOptionsModal({ count, isBn, rows, examName, className, sectionName, onClose, onDownload }: Props) {
  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) =>
      generateTabulationPDF(rows, { ...opts, examName, className, sectionName }),
    [rows, examName, className, sectionName]
  )

  return (
    <GenericPDFOptionsModal
      columns={ALL_TABULATION_PDF_COLUMNS}
      defaultTitle="Tabulation Sheet"
      defaultTitleBn="ট্যাবুলেশন শিট"
      recordLabel="students"
      recordLabelBn="জন শিক্ষার্থী"
      count={count}
      isBn={isBn}
      showColumns
      previewRenderer={previewRenderer}
      onClose={onClose}
      onDownload={(opts) =>
        onDownload({
          selectedCols: opts.selectedCols,
          orientation: opts.orientation,
          isBn: opts.isBn,
        })
      }
    />
  )
})
