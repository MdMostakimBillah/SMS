import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoticeCard } from './NoticeCard'
import type { Notice } from '@/store/noticeStore'

const mockNotice: Notice = {
  id: 'NOTICE-TEST-001',
  title: 'Test Notice',
  titleBn: 'টেস্ট নোটিশ',
  content: '<p>Test content</p>',
  contentBn: '<p>টেস্ট কন্টেন্ট</p>',
  author: 'Principal',
  authorBn: 'অধ্যক্ষ',
  target: 'all',
  priority: 'high',
  category: 'Events',
  pinned: true,
  isActive: true,
  publishedAt: new Date().toISOString(),
  expiresAt: '2026-12-31',
}

describe('NoticeCard', () => {
  it('renders the notice title', () => {
    render(<NoticeCard notice={mockNotice} onClick={() => {}} bn={false} />)
    expect(screen.getByText('Test Notice')).toBeInTheDocument()
  })

  it('renders the Bengali title when bn=true', () => {
    render(<NoticeCard notice={mockNotice} onClick={() => {}} bn={true} />)
    expect(screen.getByText('টেস্ট নোটিশ')).toBeInTheDocument()
  })

  it('renders the author name', () => {
    render(<NoticeCard notice={mockNotice} onClick={() => {}} bn={false} />)
    expect(screen.getByText('Principal')).toBeInTheDocument()
  })

  it('renders the priority badge', () => {
    render(<NoticeCard notice={mockNotice} onClick={() => {}} bn={false} />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    render(<NoticeCard notice={mockNotice} onClick={() => {}} bn={false} />)
    expect(screen.getByText('Events')).toBeInTheDocument()
  })

  it('applies pinned border class when pinned', () => {
    const { container } = render(<NoticeCard notice={mockNotice} onClick={() => {}} bn={false} />)
    expect(container.firstChild).toHaveClass('glass')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    const { container } = render(<NoticeCard notice={mockNotice} onClick={handleClick} bn={false} />)
    const card = container.firstChild as HTMLElement
    card.click()
    expect(handleClick).toHaveBeenCalled()
  })
})
