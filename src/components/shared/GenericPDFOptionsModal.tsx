import React, { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, File, LayoutTemplate, Plus, Trash2, Download, Eye, EyeOff } from 'lucide-react'

export interface PDFColumnDef {
  key: string
  label: string
  labelBn: string
  default?: boolean
}

export interface GenericPDFOptionsResult {
  title: string
  selectedCols: string[]
  emptyRows: number
  emptyColumns: string[]
  orientation: 'portrait' | 'landscape'
  isBn: boolean
}

interface Props {
  columns: PDFColumnDef[]
  defaultTitle: string
  defaultTitleBn: string
  recordLabel: string
  recordLabelBn: string
  count: number
  isBn: boolean
  showColumns?: boolean
  previewRenderer?: (opts: GenericPDFOptionsResult) => string
  onClose: () => void
  onDownload: (opts: GenericPDFOptionsResult) => void
}

export const GenericPDFOptionsModal = React.memo(function GenericPDFOptionsModal({
  columns,
  defaultTitle,
  defaultTitleBn,
  recordLabel,
  recordLabelBn,
  count,
  isBn,
  showColumns = true,
  previewRenderer,
  onClose,
  onDownload,
}: Props) {
  const [cols, setCols] = useState<string[]>(columns.filter((c) => c.default).map((c) => c.key))
  const [title, setTitle] = useState(isBn ? defaultTitleBn : defaultTitle)
  const [emptyRows, setEmptyRows] = useState(0)
  const [emptyColumns, setEmptyColumns] = useState<string[]>([])
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')
  const [showPreview, setShowPreview] = useState(true)

  const currentOpts: GenericPDFOptionsResult = useMemo(
    () => ({ title, selectedCols: showColumns ? cols : [], emptyRows, emptyColumns, orientation, isBn }),
    [title, cols, emptyRows, emptyColumns, orientation, isBn, showColumns]
  )

  const previewHtml = useMemo(() => {
    if (!previewRenderer) return ''
    return previewRenderer(currentOpts)
  }, [previewRenderer, currentOpts])

  const toggleCol = useCallback((key: string) => setCols((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key])), [])
  const selectAll = useCallback(() => setCols(columns.map((c) => c.key)), [columns])
  const clearAll = useCallback(() => setCols(['serial']), [])
  const addEmptyCol = useCallback(() => setEmptyColumns((p) => [...p, '']), [])
  const removeEmptyCol = useCallback((i: number) => setEmptyColumns((p) => p.filter((_, idx) => idx !== i)), [])
  const updateEmptyCol = useCallback((i: number, val: string) => setEmptyColumns((p) => p.map((v, idx) => (idx === i ? val : v))), [])

  const hasPreview = !!previewRenderer
  const showPreviewPanel = hasPreview && showPreview

  const inp: React.CSSProperties = {
    flex: 1,
    padding: '7px 10px',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.8125rem',
    fontFamily: 'inherit',
    outline: 'none',
  }

  return createPortal(
    <div className="modal-overlay">
      <div
        className="modal-box modal-content"
        style={{
          maxWidth: showPreviewPanel ? '90%' : showColumns ? '40rem' : '30rem',
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
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'PDF বিকল্প' : 'PDF Options'}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {showColumns ? `${cols.length} ${isBn ? 'টি কলাম' : 'columns'}` : ''}
              {!showColumns && emptyColumns.length > 0 ? ` + ${emptyColumns.length} ${isBn ? 'ফাঁকা কলাম' : 'empty cols'}` : ''}
              {emptyColumns.length > 0 ? ` + ${emptyColumns.length} ${isBn ? 'ফাঁকা কলাম' : 'empty cols'}` : ''}
              {emptyRows > 0 ? ` + ${emptyRows} ${isBn ? 'ফাঁকা সারি' : 'empty rows'}` : ''}
              {' · '}
              {count} {isBn ? recordLabelBn : recordLabel}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasPreview && (
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
            )}
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

        {/* Body — two-column when preview is active */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            maxHeight: 'calc(100vh - 10rem)',
          }}
        >
          {/* Left: Options */}
          <div style={{ flex: showPreviewPanel ? '0 0 33.333%' : 1, overflowY: 'auto', padding: '18px 20px', borderRight: showPreviewPanel ? '1px solid var(--border)' : 'none' }}>
            {/* Title */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.0313rem',
                  marginBottom: '0.5rem',
                }}
              >
                ① {isBn ? 'তালিকার শিরোনাম' : 'List Title'}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isBn ? 'তালিকার শিরোনাম লিখুন' : 'Enter list title'}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Orientation */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.0313rem',
                  marginBottom: '0.5rem',
                }}
              >
                ② {isBn ? 'কাগজের দিক' : 'Page Orientation'}
              </div>
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

            {showColumns && columns.length > 0 && (
              <>
                {/* Data Columns */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.0313rem',
                      }}
                    >
                      ③ {isBn ? 'ডাটা কলাম বেছে নিন' : 'Select Data Columns'} ({cols.length}/{columns.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.3125rem' }}>
                      <button
                        onClick={selectAll}
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
                        {isBn ? 'সব' : 'All'}
                      </button>
                      <button
                        onClick={clearAll}
                        style={{
                          fontSize: '0.6875rem',
                          padding: '3px 9px',
                          borderRadius: '0.375rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {isBn ? 'পরিষ্কার' : 'Clear'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3125rem' }}>
                    {columns.map((c) => (
                      <label
                        key={c.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4375rem',
                          padding: '6px 9px',
                          borderRadius: '0.5rem',
                          border: `1px solid ${cols.includes(c.key) ? 'var(--brand)' : 'var(--border)'}`,
                          background: cols.includes(c.key) ? 'var(--brand-light)' : 'var(--bg-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.1s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={cols.includes(c.key)}
                          onChange={() => toggleCol(c.key)}
                          style={{ width: '0.8125rem', height: '0.8125rem', accentColor: 'var(--brand)', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: cols.includes(c.key) ? 'var(--brand)' : 'var(--text-secondary)',
                            fontWeight: cols.includes(c.key) ? 500 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isBn ? c.labelBn : c.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Extra Empty Columns */}
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.875rem',
                background: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.0313rem',
                    }}
                  >
                    {showColumns && columns.length > 0 ? '④' : '③'} {isBn ? 'অতিরিক্ত ফাঁকা কলাম' : 'Extra Empty Columns'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                    {isBn ? 'হাতে লেখার জন্য (যেমন: স্বাক্ষর, তারিখ)' : 'For handwriting (e.g. Signature, Date)'}
                  </div>
                </div>
                <button
                  onClick={addEmptyCol}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3125rem',
                    padding: '6px 12px',
                    borderRadius: '0.5rem',
                    background: 'var(--brand)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={12} />
                  {isBn ? 'কলাম যোগ' : 'Add Column'}
                </button>
              </div>

              {emptyColumns.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '0.75rem',
                    border: '1px dashed var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                  }}
                >
                  {isBn ? 'এখনো কোনো ফাঁকা কলাম নেই' : 'No empty columns added yet'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {emptyColumns.map((col, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '1.375rem',
                          height: '1.375rem',
                          borderRadius: '0.375rem',
                          background: 'var(--brand-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--brand)' }}>{i + 1}</span>
                      </div>
                      <input
                        value={col}
                        onChange={(e) => updateEmptyCol(i, e.target.value)}
                        placeholder={isBn ? `কলামের শিরোনাম (যেমন: স্বাক্ষর, তারিখ)` : `Column header (e.g. Signature, Date)`}
                        style={inp}
                        onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                      />
                      <button
                        onClick={() => removeEmptyCol(i)}
                        style={{
                          width: '1.75rem',
                          height: '1.75rem',
                          borderRadius: '0.4375rem',
                          background: 'var(--red-light)',
                          border: '1px solid var(--red)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--red)',
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extra Empty Rows */}
            <div style={{ padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.0313rem',
                  marginBottom: '0.25rem',
                }}
              >
                {showColumns && columns.length > 0 ? '⑤' : '④'} {isBn ? 'অতিরিক্ত ফাঁকা সারি' : 'Extra Empty Rows'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {isBn ? 'ডাটার পরে ফাঁকা সারি যোগ হবে' : 'Blank rows added after data'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                {[0, 2, 5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setEmptyRows(n)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '0.5rem',
                      border: `1px solid ${emptyRows === n ? 'var(--teal)' : 'var(--border)'}`,
                      background: emptyRows === n ? 'var(--teal-light)' : 'var(--bg-primary)',
                      color: emptyRows === n ? 'var(--teal)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: emptyRows === n ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {n === 0 ? (isBn ? 'নেই' : 'None') : n}
                  </button>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'কাস্টম:' : 'Custom:'}</span>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={emptyRows}
                    onChange={(e) => setEmptyRows(Math.max(0, Math.min(500, Number(e.target.value))))}
                    style={{
                      width: '3.75rem',
                      padding: '5px 8px',
                      borderRadius: '0.4375rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      textAlign: 'center',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview Panel */}
          {showPreviewPanel && (
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
                    title="PDF Preview"
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
            onClick={() => onDownload({ title, selectedCols: showColumns ? cols : [], emptyRows, emptyColumns, orientation, isBn })}
            disabled={showColumns && cols.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '9px 20px',
              borderRadius: '0.5625rem',
              background: showColumns && cols.length === 0 ? 'var(--border-2)' : 'var(--red)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: showColumns && cols.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Download size={14} />
            {isBn ? 'PDF ডাউনলোড' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
