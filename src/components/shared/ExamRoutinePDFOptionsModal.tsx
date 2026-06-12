import React, { useCallback } from 'react'
import { ALL_EXAM_ROUTINE_PDF_COLUMNS, generateExamRoutineGridPDF } from '@/pages/exams/step2/pdfTemplates/examRoutinePdfTemplate'
import type { ExamRoutinePDFOptions, ExamRoutineGridData } from '@/pages/exams/step2/pdfTemplates/examRoutinePdfTemplate'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  count: number
  isBn: boolean
  gridData: ExamRoutineGridData
  onClose: () => void
  onDownload: (opts: ExamRoutinePDFOptions) => void
}

export const ExamRoutinePDFOptionsModal = React.memo(function ExamRoutinePDFOptionsModal({ count, isBn, gridData, onClose, onDownload }: Props) {
  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) => generateExamRoutineGridPDF(gridData, opts),
    [gridData]
  )

  return (
    <GenericPDFOptionsModal
      columns={ALL_EXAM_ROUTINE_PDF_COLUMNS}
      defaultTitle={gridData.examName || 'Exam Routine'}
      defaultTitleBn={gridData.examName || 'পরীক্ষার রুটিন'}
      recordLabel="days"
      recordLabelBn="টি দিন"
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
