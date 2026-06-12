import React, { useCallback } from 'react'
import { ALL_TEACHER_PDF_COLUMNS, generateTeacherListPDF } from '@/pages/teachers/listPdfTemplate'
import type { TeacherListPDFOptions } from '@/pages/teachers/listPdfTemplate'
import type { Teacher } from '@/pages/teachers/types'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from './GenericPDFOptionsModal'

interface Props {
  count: number
  isBn: boolean
  teachers: Teacher[]
  departments: { id: string; name: string; nameBn: string }[]
  onClose: () => void
  onDownload: (opts: TeacherListPDFOptions) => void
}

export const TeacherPDFOptionsModal = React.memo(function TeacherPDFOptionsModal({ count, isBn, teachers, departments, onClose, onDownload }: Props) {
  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) => generateTeacherListPDF(teachers, opts, departments),
    [teachers, departments]
  )

  return (
    <GenericPDFOptionsModal
      columns={ALL_TEACHER_PDF_COLUMNS}
      defaultTitle="Teacher List"
      defaultTitleBn="শিক্ষক তালিকা"
      recordLabel="teachers"
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
        })
      }
    />
  )
})
