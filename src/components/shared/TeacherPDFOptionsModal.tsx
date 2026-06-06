import React from 'react'
import { ALL_TEACHER_PDF_COLUMNS } from '@/pages/teachers/listPdfTemplate'
import type { TeacherListPDFOptions } from '@/pages/teachers/listPdfTemplate'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'

interface Props {
  count: number
  isBn: boolean
  onClose: () => void
  onDownload: (opts: TeacherListPDFOptions) => void
}

export const TeacherPDFOptionsModal = React.memo(function TeacherPDFOptionsModal({ count, isBn, onClose, onDownload }: Props) {
  return (
    <GenericPDFOptionsModal
      columns={ALL_TEACHER_PDF_COLUMNS}
      defaultTitle="Teacher List"
      defaultTitleBn="শিক্ষক তালিকা"
      recordLabel="teachers"
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
