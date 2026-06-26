import React, { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Eye, EyeOff } from 'lucide-react'
import { generateSyllabusPDFHTML } from './pdfTemplate'
import type { SyllabusPDFOptions } from './pdfTemplate'

interface SyllabusChapterPDF {
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  topics: {
    title: string
    titleBn: string
    description: string
    descriptionBn: string
    marks: number
    status: string
    weekNo?: number
    startDate?: string
    endDate?: string
  }[]
}

interface Props {
  className: string
  subjectName: string
  sessionId: string
  chapters: SyllabusChapterPDF[]
  isBn: boolean
  onClose: () => void
  onDownload: (html: string, filename: string) => void
}

export const SyllabusPDFOptionsModal = React.memo(function SyllabusPDFOptionsModal({
  className,
  subjectName,
  sessionId,
  chapters,
  isBn,
  onClose,
  onDownload,
}: Props) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [showChapterDesc, setShowChapterDesc] = useState(true)
  const [showTopicDesc, setShowTopicDesc] = useState(true)
  const [showPreview, setShowPreview] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const previewCancelledRef = useRef(false)

  const options: SyllabusPDFOptions = useMemo(() => ({ orientation, showChapterDesc, showTopicDesc }), [orientation, showChapterDesc, showTopicDesc])

  useEffect(() => {
    previewCancelledRef.current = false
    const html = generateSyllabusPDFHTML({ className, subjectName, sessionId, chapters }, isBn, options)
    if (!previewCancelledRef.current) setPreviewHtml(html)
    return () => { previewCancelledRef.current = true }
  }, [className, subjectName, sessionId, chapters, isBn, options])

  const handleDownload = () => {
    setPdfLoading(true)
    try {
      const html = generateSyllabusPDFHTML({ className, subjectName, sessionId, chapters }, isBn, options)
      onDownload(html, `syllabus-${className}-${subjectName}`)
    } finally {
      setPdfLoading(false)
    }
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.0313rem',
    marginBottom: '0.5rem',
  }

  return createPortal(
    <div className="modal-overlay">
      <div
        className="modal-box modal-content"
        style={{
          maxWidth: showPreview ? '90%' : '30rem',
          transition: 'max-width 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'সিলেবাস PDF' : 'Syllabus PDF'}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {className} — {subjectName}
              {' · '}
              {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? (isBn ? 'প্রিভিউ লুকান' : 'Hide Preview') : (isBn ? 'প্রিভিউ দেখান' : 'Show Preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '6px 10px',
                borderRadius: '0.5rem',
                background: showPreview ? 'var(--brand-light)' : 'var(--bg-tertiary)',
                border: `1px solid ${showPreview ? 'var(--brand)' : 'var(--border)'}`,
                color: showPreview ? 'var(--brand)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {isBn ? 'প্রিভিউ' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: '1.875rem',
                height: '1.875rem',
                borderRadius: '0.5rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            maxHeight: 'calc(100vh - 10rem)',
          }}
        >
          {/* Left: Options */}
          <div style={{ flex: showPreview ? '0 0 33.333%' : 1, overflowY: 'auto', padding: '18px 20px', borderRight: showPreview ? '1px solid var(--border)' : 'none', minWidth: 0 }}>
            {/* Orientation */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sectionLabel}>① {isBn ? 'কাগজের দিক' : 'Page Orientation'}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['portrait', 'landscape'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrientation(o)}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      borderRadius: '0.625rem',
                      border: `2px solid ${orientation === o ? 'var(--brand)' : 'var(--border)'}`,
                      background: orientation === o ? 'var(--brand-light)' : 'var(--bg-secondary)',
                      color: orientation === o ? 'var(--brand)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: orientation === o ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {o === 'portrait' ? (isBn ? 'পোর্ট্রেট' : 'Portrait') : (isBn ? 'ল্যান্ডস্কেপ' : 'Landscape')}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sectionLabel}>② {isBn ? 'প্রদর্শন' : 'Display Options'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {([
                  [showChapterDesc, setShowChapterDesc, 'Chapter Description', 'অধ্যায় বিবরণ'],
                  [showTopicDesc, setShowTopicDesc, 'Topic Description', 'টপিক বিবরণ'],
                ] as const).map(([val, setter, en, bn]) => (
                  <button
                    key={en}
                    onClick={() => setter(!val)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${val ? 'var(--brand)' : 'var(--border)'}`,
                      background: val ? 'var(--brand-light)' : 'var(--bg-secondary)',
                      color: val ? 'var(--brand)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `2px solid ${val ? 'var(--brand)' : 'var(--border)'}`,
                      background: val ? 'var(--brand)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {val && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {isBn ? bn : en}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{isBn ? 'সারসংক্ষেপ' : 'Summary'}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {chapters.length} {isBn ? 'অধ্যায়' : 'chapters'} · {chapters.reduce((s, c) => s + c.topics.length, 0)} {isBn ? 'টপিক' : 'topics'}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div style={{ flex: 1, overflow: 'auto', background: '#f1f5f9', padding: '12px', minWidth: 0 }}>
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="PDF Preview"
                  style={{ width: '100%', height: '100%', minHeight: '500px', border: 'none', borderRadius: '0.5rem', background: 'white' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  {isBn ? 'প্রিভিউ লোড হচ্ছে...' : 'Loading preview...'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            background: 'var(--bg-secondary)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleDownload}
            disabled={pdfLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#dc2626',
              color: 'white',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            <Download size={14} />
            {pdfLoading ? (isBn ? 'লোড হচ্ছে...' : 'Loading...') : (isBn ? 'ডাউনলোড' : 'Download')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
