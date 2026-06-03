import React, { useState, useCallback } from 'react'
import { X, File, LayoutTemplate, Plus, Trash2, Download } from 'lucide-react'
import { ALL_TEACHER_PDF_COLUMNS } from '@/pages/teachers/listPdfTemplate'
import type { TeacherListPDFOptions } from '@/pages/teachers/listPdfTemplate'

interface Props {
  count: number
  isBn: boolean
  onClose: () => void
  onDownload: (opts: TeacherListPDFOptions) => void
}

export const TeacherPDFOptionsModal = React.memo(function TeacherPDFOptionsModal({ count, isBn, onClose, onDownload }: Props) {
  const [cols, setCols] = useState<string[]>(ALL_TEACHER_PDF_COLUMNS.filter((c) => c.default).map((c) => c.key))
  const [title, setTitle] = useState('Teacher List')
  const [emptyRows, setEmptyRows] = useState(0)
  const [emptyColumns, setEmptyColumns] = useState<string[]>([])
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')

  const toggleCol = useCallback((key: string) => setCols((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key])), [])
  const selectAll = useCallback(() => setCols(ALL_TEACHER_PDF_COLUMNS.map((c) => c.key)), [])
  const clearAll = useCallback(() => setCols(['serial']), [])
  const addEmptyCol = useCallback(() => setEmptyColumns((p) => [...p, '']), [])
  const removeEmptyCol = useCallback((i: number) => setEmptyColumns((p) => p.filter((_, idx) => idx !== i)), [])
  const updateEmptyCol = useCallback((i: number, val: string) => setEmptyColumns((p) => p.map((v, idx) => (idx === i ? val : v))), [])

  const inp: React.CSSProperties = {
    flex: 1,
    padding: '7px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '100dvh',
        background: 'rgba(0,0,0,0.55)',
        zIndex: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
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
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'PDF বিকল্প' : 'PDF Options'}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {cols.length} {isBn ? 'টি কলাম' : 'columns'}
              {emptyColumns.length > 0 ? ` + ${emptyColumns.length} ${isBn ? 'ফাঁকা কলাম' : 'empty cols'}` : ''}
              {emptyRows > 0 ? ` + ${emptyRows} ${isBn ? 'ফাঁকা সারি' : 'empty rows'}` : ''}
              {' · '}
              {count} {isBn ? 'জন' : 'teachers'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
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

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
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
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Orientation */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              ② {isBn ? 'কাগজের দিক' : 'Page Orientation'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['portrait', 'landscape'] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setOrientation(o)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: `2px solid ${orientation === o ? 'var(--brand)' : 'var(--border)'}`,
                    background: orientation === o ? 'var(--brand-light)' : 'var(--bg-secondary)',
                    color: orientation === o ? 'var(--brand)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: orientation === o ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {o === 'portrait' ? <File size={15} /> : <LayoutTemplate size={15} />}
                  {isBn ? (o === 'portrait' ? 'উল্লম্ব (Portrait)' : 'আনুভূমিক (Landscape)') : o === 'portrait' ? 'Portrait' : 'Landscape'}
                </button>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                ③ {isBn ? 'ডাটা কলাম বেছে নিন' : 'Select Data Columns'} ({cols.length}/{ALL_TEACHER_PDF_COLUMNS.length})
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={selectAll}
                  style={{
                    fontSize: '11px',
                    padding: '3px 9px',
                    borderRadius: '6px',
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
                    fontSize: '11px',
                    padding: '3px 9px',
                    borderRadius: '6px',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
              {ALL_TEACHER_PDF_COLUMNS.map((c) => (
                <label
                  key={c.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 9px',
                    borderRadius: '8px',
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
                    style={{ width: '13px', height: '13px', accentColor: 'var(--brand)', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
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

          {/* Empty Columns */}
          <div
            style={{
              marginBottom: '20px',
              padding: '14px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  ④ {isBn ? 'অতিরিক্ত ফাঁকা কলাম' : 'Extra Empty Columns'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isBn ? 'হাতে লেখার জন্য (যেমন: স্বাক্ষর, তারিখ)' : 'For handwriting (e.g. Signature, Date)'}
                </div>
              </div>
              <button
                onClick={addEmptyCol}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'var(--brand)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
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
                  padding: '12px',
                  border: '1px dashed var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                }}
              >
                {isBn ? 'এখনো কোনো ফাঁকা কলাম নেই' : 'No empty columns added yet'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {emptyColumns.map((col, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        background: 'var(--brand-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>{i + 1}</span>
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
                        width: '28px',
                        height: '28px',
                        borderRadius: '7px',
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

          {/* Empty Rows */}
          <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px',
              }}
            >
              ⑤ {isBn ? 'অতিরিক্ত ফাঁকা সারি' : 'Extra Empty Rows'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {isBn ? 'ডাটার পরে ফাঁকা সারি যোগ হবে' : 'Blank rows added after data'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {[0, 2, 5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setEmptyRows(n)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${emptyRows === n ? 'var(--teal)' : 'var(--border)'}`,
                    background: emptyRows === n ? 'var(--teal-light)' : 'var(--bg-primary)',
                    color: emptyRows === n ? 'var(--teal)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: emptyRows === n ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {n === 0 ? (isBn ? 'নেই' : 'None') : n}
                </button>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isBn ? 'কাস্টম:' : 'Custom:'}</span>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={emptyRows}
                  onChange={(e) => setEmptyRows(Math.max(0, Math.min(500, Number(e.target.value))))}
                  style={{
                    width: '60px',
                    padding: '5px 8px',
                    borderRadius: '7px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            background: 'var(--bg-secondary)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: '9px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={() => onDownload({ title, selectedCols: cols, emptyRows, emptyColumns, orientation, isBn })}
            disabled={cols.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              borderRadius: '9px',
              background: cols.length === 0 ? 'var(--border-2)' : 'var(--red)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: cols.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Download size={14} />
            {isBn ? 'PDF ডাউনলোড' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
})
