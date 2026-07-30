import { X, Copy } from 'lucide-react'
import type { ClassInfo } from '@/store/classStore'
import { inputClass, labelClass, sectionClass } from '../constants'

interface AddClassFormProps {
  classes: ClassInfo[]
  isBn: boolean
  isMobile: boolean
  newClassName: string
  setNewClassName: (v: string) => void
  newClassNameBn: string
  setNewClassNameBn: (v: string) => void
  copyFromClassId: string
  setCopyFromClassId: (v: string) => void
  handleAddClass: () => void
  setShowAddClass: (v: boolean) => void
}

export function AddClassForm({
  classes,
  isBn,
  isMobile,
  newClassName,
  setNewClassName,
  newClassNameBn,
  setNewClassNameBn,
  copyFromClassId,
  setCopyFromClassId,
  handleAddClass,
  setShowAddClass,
}: AddClassFormProps) {
  return (
    <div className={sectionClass} style={{ borderColor: 'var(--brand)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand)' }}>{isBn ? 'নতুন শ্রেণি যোগ' : 'Add New Class'}</div>
        <button
          onClick={() => setShowAddClass(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
        <Copy size={12} />
        {isBn ? 'আগের শ্রেণি থেকে কপি করুন (ঐচ্ছিক)' : 'Copy from existing class (optional)'}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', marginBottom: '0.625rem' }}>
        <div style={{ flex: 1 }}>
          <select
            value={copyFromClassId}
            onChange={(e) => setCopyFromClassId(e.target.value)}
            className={inputClass}
            style={{ width: '100%' }}
          >
            <option value="">{isBn ? '-- কোনো শ্রেণি নয় --' : '-- None --'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.nameBn}) — {c.sections.length} {isBn ? 'সেকশন' : 'sections'}, {c.subjectIds.length} {isBn ? 'বিষয়' : 'subjects'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
        <div>
          <label className={labelClass}>{isBn ? 'শ্রেণির নাম (ইং)' : 'Class Name (EN)'}</label>
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className={inputClass}
            placeholder="Class 11"
          />
        </div>
        <div>
          <label className={labelClass}>{isBn ? 'শ্রেণির নাম (বাং)' : 'Class Name (BN)'}</label>
          <input
            value={newClassNameBn}
            onChange={(e) => setNewClassNameBn(e.target.value)}
            className={inputClass}
            placeholder="শ্রেণি ১১"
          />
        </div>
        <button
          onClick={handleAddClass}
          style={{
            padding: '9px 18px',
            borderRadius: '0.5rem',
            background: 'var(--brand)',
            border: 'none',
            color: '#fff',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {isBn ? 'যোগ করুন' : 'Add'}
        </button>
      </div>
    </div>
  )
}
