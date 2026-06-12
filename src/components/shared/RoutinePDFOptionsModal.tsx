import React, { useCallback } from 'react'
import { ALL_ROUTINE_PDF_COLUMNS, generateRoutineGridPDF } from '@/pages/classes/routinePdfTemplate'
import type { RoutineListPDFOptions, RoutineGridData } from '@/pages/classes/routinePdfTemplate'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from './GenericPDFOptionsModal'

interface Props {
  count: number
  isBn: boolean
  routineGridData: RoutineGridData
  onClose: () => void
  onDownload: (opts: RoutineListPDFOptions) => void
}

export const RoutinePDFOptionsModal = React.memo(function RoutinePDFOptionsModal({ count, isBn, routineGridData, onClose, onDownload }: Props) {
  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) => generateRoutineGridPDF(routineGridData, opts),
    [routineGridData]
  )

  return (
    <GenericPDFOptionsModal
      columns={ALL_ROUTINE_PDF_COLUMNS}
      defaultTitle="Routine"
      defaultTitleBn="রুটিন"
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
