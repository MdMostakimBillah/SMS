import React, { useRef } from 'react'
import { CheckCircle, Upload } from 'lucide-react'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import type { Teacher, Department, Designation } from '@/pages/teachers/types'

export type BulkOp = 'salary' | 'phone' | 'photo' | 'department' | 'designation' | 'inTime' | 'outTime'

export interface BulkOpMeta {
  id: BulkOp
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  bn: string
  en: string
  color: string
  bg: string
}

export interface TeacherRowProps {
  teacher: Teacher
  index: number
  op: BulkOp
  opInfo: BulkOpMeta
  isSelected: boolean
  isBn: boolean
  departmentName?: string
  departments: Department[]
  designations: Designation[]
  editValue?: string
  photoMapVal?: string
  onToggle: (id: string) => void
  onEdit: (id: string, val: string) => void
  onPhotoUpload: (id: string, file: File) => void
}

export const TeacherRow = React.memo(function TeacherRow({
  teacher: t,
  index: i,
  op,
  opInfo,
  isSelected,
  isBn,
  departmentName,
  departments,
  designations,
  editValue,
  photoMapVal,
  onToggle,
  onEdit,
  onPhotoUpload,
}: TeacherRowProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const currentValue =
    op === 'salary'
      ? `৳${t.salary.toLocaleString()}`
      : op === 'phone'
        ? t.phone
        : op === 'photo'
          ? t.photo
            ? isBn
              ? 'ছবি আছে'
              : 'Has photo'
            : isBn
              ? 'নেই'
              : 'None'
          : op === 'department'
            ? departmentName || t.departmentId
            : op === 'designation'
              ? t.designation || '—'
              : op === 'inTime'
                ? t.inTime || '—'
                : op === 'outTime'
                  ? t.outTime || '—'
                  : '—'

  return (
    <tr
      className="border-b-[0.0313rem] border-[var(--border)] transition-colors duration-100"
      style={{ background: isSelected ? `${opInfo.bg}44` : 'transparent' } as React.CSSProperties}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)'
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      <td className="py-[0.5rem] px-[0.75rem]">
        <ModernCheckbox
          checked={isSelected}
          onChange={() => onToggle(t.id)}
          color={opInfo.color}
          size="xs"
        />
      </td>
      <td className="py-[0.5rem] px-[0.5rem] text-[var(--text-muted)] font-semibold text-[0.6875rem]">
        {i + 1}
      </td>
      <td className="py-[0.4375rem] px-[0.5rem]">
        <div className="w-[2rem] h-[2.375rem] rounded-[0.375rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
          {t.photo ? (
            <img src={t.photo} alt={t.nameEn || 'Teacher'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[0.625rem] text-[var(--text-muted)]">
              {t.nameEn
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </span>
          )}
        </div>
      </td>
      <td className="py-[0.5rem] px-[0.5rem]">
        <div className="text-[0.75rem] font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[10rem]">
          {isBn ? t.nameBn || t.nameEn : t.nameEn}
        </div>
        <div className="text-[0.625rem] text-[var(--brand)] font-mono">{t.id}</div>
      </td>
      <td className="py-[0.5rem] px-[0.5rem] text-[var(--text-secondary)] text-[0.6875rem]">
        {currentValue}
      </td>
      <td
        className="py-[0.375rem] px-[0.5rem]"
        style={{ background: isSelected ? `${opInfo.bg}33` : 'transparent' } as React.CSSProperties}
      >
        {op === 'photo' ? (
          <label
            className={`flex items-center gap-[0.3125rem] py-[0.375rem] px-[0.625rem] rounded-[0.4375rem] border text-[0.6875rem] cursor-pointer font-medium w-fit ${photoMapVal ? 'border-[var(--green)] text-[var(--green)]' : ''}`}
            style={
              {
                background: photoMapVal ? 'var(--green-light)' : opInfo.bg,
                borderColor: photoMapVal ? 'var(--green)' : opInfo.color,
                color: photoMapVal ? 'var(--green)' : opInfo.color,
              } as React.CSSProperties
            }
          >
            {photoMapVal ? <CheckCircle size={12} /> : <Upload size={12} />}
            {photoMapVal ? (isBn ? 'আপলোড হয়েছে ✓' : 'Uploaded ✓') : isBn ? 'ছবি বেছে নিন' : 'Choose Photo'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onPhotoUpload(t.id, f)
              }}
              className="hidden"
            />
          </label>
        ) : op === 'department' ? (
          <select
            value={editValue !== undefined ? editValue : t.departmentId || ''}
            onChange={(e) => onEdit(t.id, e.target.value)}
            className="w-full py-[0.375rem] px-[0.5rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none cursor-pointer focus:border-[var(--brand)]"
          >
            <option value="">{isBn ? 'বিভাগ নির্বাচন' : 'Select Dept'}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {isBn ? d.nameBn : d.name}
              </option>
            ))}
          </select>
        ) : op === 'designation' ? (
          <select
            value={editValue !== undefined ? editValue : t.designation || ''}
            onChange={(e) => onEdit(t.id, e.target.value)}
            className="w-full py-[0.375rem] px-[0.5rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none cursor-pointer focus:border-[var(--brand)]"
          >
            <option value="">{isBn ? 'পদবি নির্বাচন' : 'Select Designation'}</option>
            {designations.map((d) => (
              <option key={d.id} value={d.name}>
                {isBn ? d.nameBn : d.name}
              </option>
            ))}
          </select>
        ) : op === 'inTime' || op === 'outTime' ? (
          <input
            type="time"
            value={editValue !== undefined ? editValue : (op === 'inTime' ? t.inTime : t.outTime) || ''}
            onChange={(e) => onEdit(t.id, e.target.value)}
            className="w-full py-[0.375rem] px-[0.5rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none focus:border-[var(--brand)]"
          />
        ) : op === 'salary' ? (
          <input
            type="number"
            value={editValue !== undefined ? editValue : String(t.salary || '')}
            onChange={(e) => onEdit(t.id, e.target.value)}
            placeholder={isBn ? 'বেতন' : 'Salary'}
            className="w-full py-[0.375rem] px-[0.5rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none focus:border-[var(--brand)]"
          />
        ) : (
          <input
            type="text"
            value={editValue !== undefined ? editValue : (t as any)[op] || ''}
            onChange={(e) => onEdit(t.id, e.target.value)}
            className="w-full py-[0.375rem] px-[0.5rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none focus:border-[var(--brand)]"
          />
        )}
      </td>
    </tr>
  )
})
