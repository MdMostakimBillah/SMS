
import { User, Users, Eye, Edit2, Check, XCircle } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { Pagination } from './Pagination'
import type { StudentAdmission } from '../types'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { usePermission } from '@/hooks/usePermission'

const actBtn = (bg: string, color: string): React.CSSProperties => ({
  width: '1.625rem', height: '1.625rem', borderRadius: '0.375rem',
  background: bg, border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color,
})

interface AdmissionTableProps {
  paginated: StudentAdmission[]
  sp: number
  page: number
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
  paginated, sp, page, perPage, filtered, selected, allSel, totalPages,
  toggleAll, toggleOne, setPage,
  setViewingStudent, setEditingStudent, setApprovingStudent, setRejectingStudent,
  isBn,
}: AdmissionTableProps) {
  const { canEdit, canApprove, canReject } = usePermission()
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.875rem', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 12px', width: '2.25rem' }}>
                <ModernCheckbox
                  checked={allSel}
                  onChange={() => toggleAll()}
                  color="brand"
                  size="xs"
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
                    <ModernCheckbox
                      checked={selected.includes(s.id)}
                      onChange={() => toggleOne(s.id)}
                      color="brand"
                      size="xs"
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
                        style={actBtn('var(--brand-light)', 'var(--brand)')}
                      >
                        <Eye size={12} />
                      </button>
                      {canEdit('students.admission') && (
                        <button
                          onClick={() => setEditingStudent(s)}
                          title={isBn ? 'এডিট' : 'Edit'}
                          style={actBtn('var(--amber-light)', 'var(--amber)')}
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {s.status === 'pending' && (
                        <>
                          {canApprove('students.admission') && (
                            <button
                              onClick={() => setApprovingStudent(s)}
                              title={isBn ? 'অনুমোদন' : 'Approve'}
                              style={actBtn('var(--green-light)', 'var(--green)')}
                            >
                              <Check size={12} />
                            </button>
                          )}
                          {canReject('students.admission') && (
                            <button
                              onClick={() => setRejectingStudent(s)}
                              title={isBn ? 'প্রত্যাখ্যান' : 'Reject'}
                              style={actBtn('var(--red-light)', 'var(--red)')}
                            >
                              <XCircle size={12} />
                            </button>
                          )}
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
      <Pagination
        sp={sp}
        page={page}
        perPage={perPage}
        filteredLength={filtered.length}
        totalPages={totalPages}
        setPage={setPage}
        isBn={isBn}
      />
    </div>
  )
}
