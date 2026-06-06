import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

describe('DeleteConfirmDialog', () => {
  const defaultProps = {
    title: 'Delete Item',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    isBn: false,
  }

  it('renders title and message', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders Cancel and Delete buttons', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onConfirm when Delete clicked', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('Delete'))
    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when Cancel clicked', () => {
    render(<DeleteConfirmDialog {...defaultProps} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('renders Bengali text when isBn', () => {
    render(<DeleteConfirmDialog {...defaultProps} isBn={true} />)
    expect(screen.getByText('মুছে ফেলুন?')).toBeInTheDocument()
    expect(screen.getByText('বাতিল')).toBeInTheDocument()
    expect(screen.getByText('মুছে ফেলুন')).toBeInTheDocument()
  })
})
