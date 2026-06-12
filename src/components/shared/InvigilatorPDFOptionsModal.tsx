import React, { useCallback } from 'react'
import {
  INVIGILATOR_CLASS_COLUMNS,
  INVIGILATOR_ROOM_COLUMNS,
  generateInvigilatorGuardListPDF,
} from '@/pages/exams/step2/pdfTemplates/invigilatorPdfTemplate'
import type { InvigilatorPDFOptions, InvigilatorGridData } from '@/pages/exams/step2/pdfTemplates/invigilatorPdfTemplate'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  count: number
  isBn: boolean
  gridData: InvigilatorGridData
  onClose: () => void
  onDownload: (opts: InvigilatorPDFOptions) => void
}

export const InvigilatorPDFOptionsModal = React.memo(function InvigilatorPDFOptionsModal({ count, isBn, gridData, onClose, onDownload }: Props) {
  const columns = gridData.type === 'class' ? INVIGILATOR_CLASS_COLUMNS : INVIGILATOR_ROOM_COLUMNS

  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) => generateInvigilatorGuardListPDF(gridData, opts),
    [gridData]
  )

  const defaultTitle = gridData.type === 'class'
    ? (gridData.examName ? `${gridData.examName} - Class Guard List` : 'Class Guard List')
    : (gridData.examName ? `${gridData.examName} - Room Guard List` : 'Room Guard List')

  const defaultTitleBn = gridData.type === 'class'
    ? (gridData.examName ? `${gridData.examName} - শ্রেণি গার্ড তালিকা` : 'শ্রেণি গার্ড তালিকা')
    : (gridData.examName ? `${gridData.examName} - কক্ষ গার্ড তালিকা` : 'কক্ষ গার্ড তালিকা')

  return (
    <GenericPDFOptionsModal
      columns={columns}
      defaultTitle={defaultTitle}
      defaultTitleBn={defaultTitleBn}
      recordLabel="assignments"
      recordLabelBn="জন নিয়োগ"
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
