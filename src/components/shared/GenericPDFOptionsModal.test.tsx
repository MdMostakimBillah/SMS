import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'

describe('GenericPDFOptionsModal', () => {
  const defaultProps = {
    columns: [
      { key: 'name', label: 'Name', labelBn: 'নাম', default: true },
      { key: 'age', label: 'Age', labelBn: 'বয়স', default: false },
    ],
    defaultTitle: 'Student List',
    defaultTitleBn: 'ছাত্র তালিকা',
    recordLabel: 'student',
    recordLabelBn: 'ছাত্র',
    count: 25,
    isBn: false,
    onClose: vi.fn(),
    onDownload: vi.fn(),
  }

  it('renders title', () => {
    render(<GenericPDFOptionsModal {...defaultProps} />)
    expect(screen.getByText('Download PDF')).toBeInTheDocument()
  })

  it('renders record count', () => {
    render(<GenericPDFOptionsModal {...defaultProps} />)
    expect(screen.getByText(/25 student/)).toBeInTheDocument()
  })

  it('calls onClose when cancel clicked', () => {
    render(<GenericPDFOptionsModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onDownload when download clicked', () => {
    render(<GenericPDFOptionsModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Download PDF'))
    expect(defaultProps.onDownload).toHaveBeenCalled()
  })

  it('renders column checkboxes when showColumns is true', () => {
    render(<GenericPDFOptionsModal {...defaultProps} showColumns={true} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
  })

  it('hides columns when showColumns is false', () => {
    render(<GenericPDFOptionsModal {...defaultProps} showColumns={false} />)
    expect(screen.queryByText('Name')).not.toBeInTheDocument()
    expect(screen.queryByText('Age')).not.toBeInTheDocument()
  })

  it('renders orientation selector', () => {
    render(<GenericPDFOptionsModal {...defaultProps} />)
    expect(screen.getByText('Portrait')).toBeInTheDocument()
    expect(screen.getByText('Landscape')).toBeInTheDocument()
  })
})
