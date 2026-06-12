import React from 'react'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'

export interface AttendancePDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  orientation: 'portrait' | 'landscape'
  isBn: boolean
}

interface Props {
  count: number
  isBn: boolean
  type: 'student' | 'employee'
  onClose: () => void
  onDownload: (opts: AttendancePDFOptions) => void
  onPreview?: (opts: AttendancePDFOptions) => void
}

export const AttendancePDFOptionsModal = React.memo(function AttendancePDFOptionsModal({ count, isBn, type, onClose, onDownload, onPreview }: Props) {
  return (
    <GenericPDFOptionsModal
      columns={[]}
      defaultTitle={type === 'student' ? 'Student Monthly Attendance' : 'Employee Monthly Attendance'}
      defaultTitleBn={type === 'student' ? 'শিক্ষার্থীদের মাসিক উপস্থিতি' : 'কর্মচারীদের মাসিক উপস্থিতি'}
      recordLabel={type === 'student' ? 'students' : 'employees'}
      recordLabelBn={type === 'student' ? 'জন শিক্ষার্থী' : 'জন কর্মচারী'}
      count={count}
      isBn={isBn}
      showColumns={false}
      onClose={onClose}
      onDownload={(opts) =>
        onDownload({
          title: opts.title,
          selectedCols: [],
          emptyRows: 0,
          orientation: opts.orientation,
          isBn: opts.isBn,
        })
      }
      onPreview={onPreview ? (opts) =>
        onPreview({
          title: opts.title,
          selectedCols: [],
          emptyRows: 0,
          orientation: opts.orientation,
          isBn: opts.isBn,
        })
      : undefined}
    />
  )
})
