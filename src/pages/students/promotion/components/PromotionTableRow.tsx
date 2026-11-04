import React, { useCallback } from 'react'
import { User } from 'lucide-react'
import type { StudentAdmission } from '@/store/admissionStore'
import ModernCheckbox from '@/components/ui/ModernCheckbox'

interface Props {
  student: StudentAdmission
  index: number
  isSelected: boolean
  toClass: string
  toSection: string
  rollValue: string
  isBn: boolean
  onToggle: (id: string) => void
  onRollChange: (id: string, val: string) => void
}

const RollInput = React.memo(function RollInput({
  id,
  value,
  onChange,
  isBn,
}: {
  id: string
  value: string
  onChange: (id: string, v: string) => void
  isBn: boolean
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(id, e.target.value)
    },
    [id, onChange]
  )

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={isBn ? 'রোল' : 'Roll'}
      className="w-[3.125rem] p-[4px_6px] rounded-[0.375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.6875rem] font-mono outline-none text-center focus:border-[var(--brand)] transition-colors"
    />
  )
})

export const PromotionTableRow = React.memo(function PromotionTableRow({
  student,
  index,
  isSelected,
  toClass,
  toSection,
  rollValue,
  isBn,
  onToggle,
  onRollChange,
}: Props) {
  const handleCheckboxChange = useCallback(() => {
    onToggle(student.id)
  }, [student.id, onToggle])

  return (
    <tr
      className={`border-b-[0.0313rem] border-[var(--border)] transition-colors ${
        isSelected
          ? 'bg-[rgba(99,102,241,0.06)] hover:bg-[rgba(99,102,241,0.09)]'
          : 'bg-transparent hover:bg-[var(--bg-secondary)]'
      }`}
    >
      <td className="p-[8px_10px]">
        <ModernCheckbox
          checked={isSelected}
          onChange={handleCheckboxChange}
          color="brand"
          size="xs"
        />
      </td>
      <td className="p-[8px_6px] text-[var(--text-muted)] font-semibold text-[0.6875rem]">
        {index + 1}
      </td>
      <td className="p-[0.375rem]">
        <div className="w-[1.75rem] h-[2.125rem] rounded-[0.3125rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center shrink-0">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.nameEn || 'Student'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <User size={12} className="text-[var(--text-muted)]" />
          )}
        </div>
      </td>
      <td className="p-[8px_6px]">
        <div className="text-xs font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[8.75rem]">
          {student.nameEn}
        </div>
        <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">
          {student.id}
        </div>
      </td>
      <td className="p-[8px_6px]">
        <div className="flex gap-[0.1875rem] flex-wrap items-center">
          <span className="text-[0.625rem] font-semibold py-[0.125rem] px-[0.375rem] rounded-[0.3125rem] bg-[var(--brand-light)] text-[var(--brand)]">
            {student.class}
          </span>
          <span className="text-[0.625rem] py-[0.125rem] px-[0.3125rem] rounded-[0.3125rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
            {student.section}
          </span>
          {student.roll && (
            <span className="text-[0.625rem] py-[0.125rem] px-[0.3125rem] rounded-[0.3125rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              R{student.roll}
            </span>
          )}
        </div>
      </td>
      <td className="p-[8px_6px]">
        {toClass ? (
          <div className="flex gap-[0.1875rem] flex-wrap items-center">
            <span className="text-[0.625rem] font-semibold py-[0.125rem] px-[0.375rem] rounded-[0.3125rem] bg-[var(--green-light)] text-[var(--green)]">
              {toClass}
            </span>
            <span className="text-[0.625rem] py-[0.125rem] px-[0.3125rem] rounded-[0.3125rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              {toSection || student.section}
            </span>
          </div>
        ) : (
          <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
        )}
      </td>
      <td className="p-[8px_6px]">
        {toClass ? (
          <RollInput
            id={student.id}
            value={rollValue}
            onChange={onRollChange}
            isBn={isBn}
          />
        ) : (
          <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
        )}
      </td>
    </tr>
  )
})
