import React from 'react'
import { User, Users, Eye, Edit2, Check, XCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import type { StudentAdmission } from '../types'

interface AdmissionTableProps {
  paginated: StudentAdmission[]
  sp: number
  perPage: number
  filtered: StudentAdmission[]
  selected: string[]
  allSel: boolean
  totalPages: number
  toggleAll: () => void
  toggleOne: (id: string) => void
  setPage: (v: number) => void
  setViewingStudent: (s: StudentAdmission) => void
  setEditingStudent: (s: StudentAdmission) => void
  setApprovingStudent: (s: StudentAdmission) => void
  setRejectingStudent: (s: StudentAdmission) => void
  isBn: boolean
}
export function AdmissionTable({
  paginated, sp, perPage, filtered, selected, allSel, totalPages,
  toggleAll, toggleOne, setPage,
  setViewingStudent, setEditingStudent, setApprovingStudent, setRejectingStudent,
  isBn,
}: AdmissionTableProps) {
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.875rem', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 12px', width: '2.25rem' }}>
                <input
                  type="checkbox"
                  checked={allSel}
                  onChange={toggleAll}
                  style={{ width: '0.8125rem', height: '0.8125rem', cursor: 'pointer', accentColor: 'var(--brand)' }}
                />
              </th>
              {[
                { l: '#', w: '2.375rem' },
                { l: isBn ? 'ছবি' : 'Photo', w: '2.875rem' },
                { l: isBn ? 'ছাত্র আইডি' : 'Student ID', w: '9.0625rem' },
                { l: isBn ? 'নাম' : 'Name', w: '9.6875rem' },
                { l: isBn ? 'শ্রেণি' : 'Class', w: '4.6875rem' },
                { l: isBn ? 'লিঙ্গ' : 'Gender', w: '4.375rem' },
                { l: isBn ? 'মোবাইল' : 'Mobile', w: '6.875rem' },
                { l: isBn ? 'ধর্ম' : 'Religion', w: '5.625rem' },
                { l: isBn ? 'তারিখ' : 'Date', w: '5.5rem' },
                { l: isBn ? 'অবস্থা' : 'Status', w: '5.625rem' },
                { l: isBn ? 'অ্যাকশন' : 'Action', w: '6rem' },
              ].map((h) => (
                <th
                  key={h.l}
                  style={{
                    padding: '10px 8px',
                    textAlign: 'left',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025rem',
                    whiteSpace: 'nowrap',
                    minWidth: h.w,
                  }}
                >
                  {h.l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={30} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  {isBn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}
                </td>
              </tr>
            ) : (
              paginated.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '0.5px solid var(--border)',
                    background: selected.includes(s.id) ? 'rgba(99,102,241,0.04)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected.includes(s.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    if (!selected.includes(s.id)) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={{ padding: '8px 12px' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggleOne(s.id)}
                      style={{ width: '0.8125rem', height: '0.8125rem', cursor: 'pointer', accentColor: 'var(--brand)' }}
                    />
                  </td>
                  <td style={{ padding: '8px 8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.6875rem' }}>
                    {(sp - 1) * perPage + i + 1}
                  </td>
                  <td style={{ padding: '7px 8px' }}>
                    <div
                      style={{
                        width: '1.875rem',
                        height: '2.25rem',
                        borderRadius: '0.3125rem',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {s.photo ? (
                         <img src={s.photo} alt={s.nameEn || 'Student'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={13} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '8px 8px' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontFamily: 'monospace',
                        color: 'var(--brand)',
                        background: 'var(--brand-light)',
                        padding: '2px 6px',
                        borderRadius: '0.25rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.id}
                    </span>
                  </td>
                  <td style={{ padding: '8px 8px' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '9.375rem',
                      }}
                    >
                      {isBn ? s.nameBn || s.nameEn : s.nameEn}
                    </div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '9.375rem',
                      }}
                    >
                      {isBn ? s.nameEn : s.nameBn}
                    </div>
                  </td>
                  <td style={{ padding: '8px 8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {s.class} {s.section}
                  </td>
                  <td style={{ padding: '8px 8px' }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        borderRadius: '0.3125rem',
                        background: s.gender.includes('Female') ? 'var(--purple-light)' : 'var(--teal-light)',
                        color: s.gender.includes('Female') ? 'var(--purple)' : 'var(--teal)',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.gender.includes('Female') ? (isBn ? 'মেয়ে' : 'Female') : isBn ? 'ছেলে' : 'Male'}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '8px 8px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                      fontSize: '0.6875rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.phone}
                  </td>
                  <td style={{ padding: '8px 8px', color: 'var(--text-secondary)', fontSize: '0.6875rem', whiteSpace: 'nowrap' }}>
                    {s.religion.split(' / ')[0]}
                  </td>
                  <td style={{ padding: '8px 8px', color: 'var(--text-secondary)', fontSize: '0.6875rem', whiteSpace: 'nowrap' }}>
                    {s.admissionDate}
                  </td>
                  <td style={{ padding: '8px 8px' }}><StatusBadge status={s.status} isBn={isBn} /></td>
                  <td style={{ padding: '8px 8px' }}>
                    <div style={{ display: 'flex', gap: '0.1875rem' }}>
                      <button
                        onClick={() => setViewingStudent(s)}
                        title={isBn ? 'দেখুন' : 'View'}
                        style={{
                          width: '1.625rem',
                          height: '1.625rem',
                          borderRadius: '0.375rem',
                          background: 'var(--brand-light)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--brand)',
                        }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => setEditingStudent(s)}
                        title={isBn ? 'এডিট' : 'Edit'}
                        style={{
                          width: '1.625rem',
                          height: '1.625rem',
                          borderRadius: '0.375rem',
                          background: 'var(--amber-light)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--amber)',
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                      {s.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setApprovingStudent(s)}
                            title={isBn ? 'অনুমোদন' : 'Approve'}
                            style={{
                              width: '1.625rem',
                              height: '1.625rem',
                              borderRadius: '0.375rem',
                              background: 'var(--green-light)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--green)',
                            }}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setRejectingStudent(s)}
                            title={isBn ? 'প্রত্যাখ্যান' : 'Reject'}
                            style={{
                              width: '1.625rem',
                              height: '1.625rem',
                              borderRadius: '0.375rem',
                              background: 'var(--red-light)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--red)',
                            }}
                          >
                            <XCircle size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {isBn
            ? `${(sp - 1) * perPage + 1}–${Math.min(sp * perPage, filtered.length)} / মোট ${filtered.length}`
            : `${(sp - 1) * perPage + 1}–${Math.min(sp * perPage, filtered.length)} of ${filtered.length}`}
        </span>
        <div style={{ display: 'flex', gap: '0.1875rem', flexWrap: 'wrap' }}>
          {[
            { icon: <ChevronsLeft size={12} />, action: () => setPage(1), disabled: sp === 1 },
            { icon: <ChevronLeft size={12} />, action: () => setPage((p) => Math.max(1, p - 1)), disabled: sp === 1 },
          ].map((b, i) => (
            <button
              key={i}
              onClick={b.action}
              disabled={b.disabled}
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: b.disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: b.disabled ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {b.icon}
            </button>
          ))}
          {(() => {
            const start = Math.max(1, Math.min(sp - 2, totalPages - 4))
            return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${p === sp ? 'var(--brand)' : 'var(--border)'}`,
                  background: p === sp ? 'var(--brand)' : 'var(--bg-primary)',
                  color: p === sp ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: p === sp ? 600 : 400,
                }}
              >
                {p}
              </button>
            ))
          })()}
          {[
            { icon: <ChevronRight size={12} />, action: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: sp === totalPages },
            { icon: <ChevronsRight size={12} />, action: () => setPage(totalPages), disabled: sp === totalPages },
          ].map((b, i) => (
            <button
              key={i}
              onClick={b.action}
              disabled={b.disabled}
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: b.disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: b.disabled ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
