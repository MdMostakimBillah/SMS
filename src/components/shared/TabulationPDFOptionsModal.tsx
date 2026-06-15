import React, { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, BookOpen, Check, ChevronRight } from 'lucide-react'
import { ALL_TABULATION_PDF_COLUMNS, generateTabulationPDF } from '@/pages/exams/step4/tabulationPdfTemplate'
import type { TabulationPdfOptions, TabulationStudentRow } from '@/pages/exams/step4/tabulationPdfTemplate'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Subject {
  name: string
  fullMarks: number
}

interface Props {
  count: number
  isBn: boolean
  rows: TabulationStudentRow[]
  subjects: Subject[]
  rotateHeaders: boolean
  examName?: string
  className?: string
  sectionName?: string
  onClose: () => void
  onDownload: (opts: TabulationPdfOptions) => void
}

export const TabulationPDFOptionsModal = React.memo(function TabulationPDFOptionsModal({ count, isBn, rows, subjects, rotateHeaders, examName, className, sectionName, onClose, onDownload }: Props) {
  const [step, setStep] = useState<'subjects' | 'options'>('subjects')
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>(() => subjects.map((_, i) => i))

  const toggleSubject = useCallback((idx: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }, [])

  const selectAllSubjects = useCallback(() => {
    setSelectedSubjects(subjects.map((_, i) => i))
  }, [subjects])

  const clearAllSubjects = useCallback(() => {
    setSelectedSubjects([])
  }, [])

  const handleSubjectsConfirm = useCallback(() => {
    if (selectedSubjects.length === 0) return
    setStep('options')
  }, [selectedSubjects])

  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) =>
      generateTabulationPDF(rows, { ...opts, selectedSubjects, rotateHeaders, examName, className, sectionName }),
    [rows, selectedSubjects, rotateHeaders, examName, className, sectionName]
  )

  return (
    <>
      {/* Step 1: Subject Selection */}
      {step === 'subjects' && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '90%' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={15} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subjects'}
                  </h2>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.0625rem' }}>
                    {isBn ? `সর্বোচ্চ ${subjects.length} টি বিষয়` : `Up to ${subjects.length} subjects`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.4375rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 18px' }}>
              {/* Select All / Clear */}
              <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem' }}>
                <button
                  onClick={selectAllSubjects}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '0.4375rem',
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    background: selectedSubjects.length === subjects.length ? 'var(--brand)' : 'var(--brand-light)',
                    border: `1px solid ${selectedSubjects.length === subjects.length ? 'var(--brand)' : 'var(--brand)'}`,
                    color: selectedSubjects.length === subjects.length ? '#fff' : 'var(--brand)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {isBn ? 'সব নির্বাচন' : 'Select All'}
                </button>
                <button
                  onClick={clearAllSubjects}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '0.4375rem',
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    background: selectedSubjects.length === 0 ? 'var(--red)' : 'var(--bg-secondary)',
                    border: `1px solid ${selectedSubjects.length === 0 ? 'var(--red)' : 'var(--border)'}`,
                    color: selectedSubjects.length === 0 ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {isBn ? 'পরিষ্কার' : 'Clear All'}
                </button>
              </div>

              {/* Subject list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3125rem', maxHeight: '18rem', overflowY: 'auto' }}>
                {subjects.map((subj, idx) => {
                  const isSelected = selectedSubjects.includes(idx)
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSubject(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '8px 10px',
                        borderRadius: '0.5rem',
                        border: `1px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--brand-light)' : 'var(--bg-primary)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        transition: 'all 0.1s',
                      }}
                    >
                      <div
                        style={{
                          width: '1.125rem',
                          height: '1.125rem',
                          borderRadius: '0.25rem',
                          border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--brand)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.1s',
                        }}
                      >
                        {isSelected && <Check size={10} style={{ color: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--brand)' : 'var(--text-primary)' }}>
                          {subj.name}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        /{subj.fullMarks}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {selectedSubjects.length} {isBn ? 'টি নির্বাচিত' : 'selected'}
              </span>
              <button
                onClick={handleSubjectsConfirm}
                disabled={selectedSubjects.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '8px 18px',
                  borderRadius: '0.5rem',
                  background: selectedSubjects.length === 0 ? 'var(--border)' : 'var(--brand)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: selectedSubjects.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {isBn ? 'পরবর্তী' : 'Next'}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Step 2: PDF Options */}
      {step === 'options' && (
        <GenericPDFOptionsModal
          columns={ALL_TABULATION_PDF_COLUMNS}
          defaultTitle="Tabulation Sheet"
          defaultTitleBn="ট্যাবুলেশন শিট"
          recordLabel="students"
          recordLabelBn="জন শিক্ষার্থী"
          count={count}
          isBn={isBn}
          showColumns
          previewRenderer={previewRenderer}
          onClose={onClose}
          onDownload={(opts) =>
            onDownload({
              selectedCols: opts.selectedCols,
              selectedSubjects,
              orientation: opts.orientation,
              isBn: opts.isBn,
              rotateHeaders,
            })
          }
        />
      )}
    </>
  )
})
