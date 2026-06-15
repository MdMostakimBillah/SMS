import React, { useMemo, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, File, LayoutTemplate, Download, Eye, EyeOff, CheckSquare, Square, Search } from 'lucide-react'
import { generateMarksheetPDF } from './marksheetPdfTemplate'
import type { TabulationStudent, MarksheetOptions } from './MarksheetTab'

interface Props {
  students: TabulationStudent[]
  subjectStats: Record<string, { highest: number; positions: Record<string, number> }>
  examName: string
  examSession: string
  className: string
  sectionName: string
  institutionName: string
  institutionAddress: string
  isBn: boolean
  onClose: () => void
  onDownload: (html: string, filename: string) => void
}

export const MarksheetPDFOptionsModal = React.memo(function MarksheetPDFOptionsModal({
  students,
  subjectStats,
  examName,
  examSession,
  className,
  sectionName,
  institutionName,
  institutionAddress,
  isBn,
  onClose,
  onDownload,
}: Props) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [selectedIds, setSelectedIds] = useState<string[]>(students.map((s) => s.student.id))
  const [searchQuery, setSearchQuery] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [options, setOptions] = useState<MarksheetOptions>({
    showFather: true,
    showMother: true,
    showGpa: true,
    showClassRank: true,
    showSectionRank: true,
    showPhoto: true,
    showSubjectHighest: true,
    showSubExams: true,
    showGradeScale: true,
    showSignature: true,
  })

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students
    const q = searchQuery.toLowerCase()
    return students.filter((s) => s.student.nameEn.toLowerCase().includes(q) || s.student.roll.includes(q))
  }, [students, searchQuery])

  const toggleOption = useCallback((key: keyof MarksheetOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const toggleStudent = useCallback((id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => prev.length === students.length ? [] : students.map((s) => s.student.id))
  }, [students])

  const previewHtml = useMemo(() => {
    const selected = students.filter((s) => selectedIds.includes(s.student.id))
    if (selected.length === 0) return ''
    return generateMarksheetPDF(selected, subjectStats, {
      orientation,
      isBn,
      examName,
      examSession,
      className,
      sectionName,
      institutionName,
      institutionAddress,
      options,
    })
  }, [students, selectedIds, subjectStats, orientation, isBn, examName, examSession, className, sectionName, institutionName, institutionAddress, options])

  const handleDownload = async () => {
    if (selectedIds.length === 0) return
    setPdfLoading(true)
    try {
      const selected = students.filter((s) => selectedIds.includes(s.student.id))
      const html = generateMarksheetPDF(selected, subjectStats, {
        orientation,
        isBn,
        examName,
        examSession,
        className,
        sectionName,
        institutionName,
        institutionAddress,
        options,
      })
      onDownload(html, `marksheets-${className}-${sectionName}`)
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

  const displayOptions: [keyof MarksheetOptions, string, string][] = [
    ['showFather', 'Father', 'বাবা'],
    ['showMother', 'Mother', 'মা'],
    ['showGpa', 'GPA', 'জিপিএ'],
    ['showClassRank', 'Class Rank', 'শ্রেণি র‍্যাঙ্ক'],
    ['showSectionRank', 'Section Rank', 'সেকশন র‍্যাঙ্ক'],
    ['showPhoto', 'Photo', 'ছবি'],
    ['showSubjectHighest', 'Highest', 'সর্বোচ্চ'],
    ['showSubExams', 'Sub-Exam', 'উপ-পরীক্ষা'],
    ['showGradeScale', 'Grade Scale', 'গ্রেড স্কেল'],
    ['showSignature', 'Signatures', 'স্বাক্ষর'],
  ]

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
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'মার্কশিট PDF' : 'Marksheet PDF'}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {selectedIds.length} {isBn ? 'জন শিক্ষার্থী নির্বাচিত' : 'students selected'}
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
          <div style={{ flex: showPreview ? '0 0 33.333%' : 1, overflowY: 'auto', padding: '18px 20px', borderRight: showPreview ? '1px solid var(--border)' : 'none' }}>
            {/* ① Orientation */}
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    {o === 'portrait' ? <File size={15} /> : <LayoutTemplate size={15} />}
                    {isBn ? (o === 'portrait' ? 'উল্লম্ব (Portrait)' : 'আনুভূমিক (Landscape)') : o === 'portrait' ? 'Portrait' : 'Landscape'}
                  </button>
                ))}
              </div>
            </div>

            {/* ② Display Options */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={sectionLabel}>② {isBn ? 'প্রদর্শন বিকল্প' : 'Display Options'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3125rem' }}>
                {displayOptions.map(([key, label, labelBn]) => {
                  const active = options[key]
                  return (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4375rem',
                        padding: '6px 9px',
                        borderRadius: '0.5rem',
                        border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                        background: active ? 'var(--brand-light)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.1s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleOption(key)}
                        style={{ width: '0.8125rem', height: '0.8125rem', accentColor: 'var(--brand)', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          color: active ? 'var(--brand)' : 'var(--text-secondary)',
                          fontWeight: active ? 500 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isBn ? labelBn : label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* ③ Students */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={sectionLabel}>③ {isBn ? 'শিক্ষার্থী নির্বাচন' : 'Select Students'} ({selectedIds.length}/{students.length})</div>
                <div style={{ display: 'flex', gap: '0.3125rem' }}>
                  <button
                    onClick={toggleSelectAll}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '3px 9px',
                      borderRadius: '0.375rem',
                      background: 'var(--brand-light)',
                      border: '1px solid var(--brand)',
                      color: 'var(--brand)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {selectedIds.length === students.length ? (isBn ? 'পরিষ্কার' : 'Deselect') : (isBn ? 'সব' : 'Select All')}
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={isBn ? 'শিক্ষার্থী খুঁজুন...' : 'Search students...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 28px',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div style={{ maxHeight: '12rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {filteredStudents.map((s) => {
                  const sel = selectedIds.includes(s.student.id)
                  return (
                    <div
                      key={s.student.id}
                      onClick={() => toggleStudent(s.student.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '6px 8px',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        border: `1px solid ${sel ? 'var(--brand)' : 'transparent'}`,
                        background: sel ? 'var(--brand-light)' : 'transparent',
                        transition: 'all 0.1s',
                      }}
                    >
                      {sel ? <CheckSquare size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} /> : <Square size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.student.nameEn}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0 }}>Roll: {s.student.roll} · GPA: {s.gpa.toFixed(1)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Preview Panel */}
          {showPreview && (
            <div style={{ flex: '0 0 66.666%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-secondary)',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem' }}>
                  {isBn ? 'প্রিভিউ' : 'Preview'}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  A4 · {orientation}
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  background: '#e5e7eb',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    title="Marksheet Preview"
                    style={{
                      width: orientation === 'landscape' ? '100%' : '70%',
                      height: '100%',
                      minHeight: '28rem',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                      background: '#fff',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    {isBn ? 'প্রিভিউ লোড হচ্ছে...' : 'Loading preview...'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end',
            background: 'var(--bg-secondary)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: '0.5625rem',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
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
            disabled={selectedIds.length === 0 || pdfLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '9px 20px',
              borderRadius: '0.5625rem',
              background: selectedIds.length === 0 ? 'var(--border-2)' : 'var(--red)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: pdfLoading ? 0.7 : 1,
            }}
          >
            {pdfLoading ? (
              <div style={{ width: '0.875rem', height: '0.875rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <Download size={14} />
            )}
            {isBn ? 'PDF ডাউনলোড' : 'Download PDF'} ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
