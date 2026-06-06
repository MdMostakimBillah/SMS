import React from 'react'
import { ALL_PDF_COLUMNS } from '@/pages/students/admission/listPdfTemplate'
import type { ListPDFOptions } from '@/pages/students/admission/listPdfTemplate'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'

interface Props {
  count: number
  isBn: boolean
  onClose: () => void
  onDownload: (opts: ListPDFOptions) => void
}

export const PDFOptionsModal = React.memo(function PDFOptionsModal({ count, isBn, onClose, onDownload }: Props) {
  return (
    <GenericPDFOptionsModal
      columns={ALL_PDF_COLUMNS}
      defaultTitle="Student List"
      defaultTitleBn="ছাত্র তালিকা"
      recordLabel="students"
      recordLabelBn="জন"
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
