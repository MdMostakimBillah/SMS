import React, { useCallback } from 'react'
import { ALL_PDF_COLUMNS, generateListPDF } from '@/pages/students/admission/listPdfTemplate'
import type { ListPDFOptions } from '@/pages/students/admission/listPdfTemplate'
import type { StudentAdmission } from '@/pages/students/admission/types'
import type { Teacher } from '@/pages/teachers/types'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from './GenericPDFOptionsModal'

interface Props {
  count: number
  isBn: boolean
  students: StudentAdmission[]
  teachers?: Teacher[]
  onClose: () => void
  onDownload: (opts: ListPDFOptions) => void
}

export const PDFOptionsModal = React.memo(function PDFOptionsModal({ count, isBn, students, teachers, onClose, onDownload }: Props) {
  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) => generateListPDF(students, { ...opts, teachers }),
    [students, teachers]
  )

  return (
    <GenericPDFOptionsModal
      columns={ALL_PDF_COLUMNS}
      defaultTitle="Student List"
      defaultTitleBn="ছাত্র তালিকা"
      recordLabel="students"
      recordLabelBn="জন"
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
          teachers,
        })
      }
    />
  )
})
