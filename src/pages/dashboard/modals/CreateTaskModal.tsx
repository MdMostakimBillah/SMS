import { useState } from 'react'
import { X, Calendar, Flag, Users } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import { useTodoStore, type TodoTask } from '@/store/todoStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'

interface Props {
  onClose: () => void
}

export function CreateTaskModal({ onClose }: Props) {
  const isBn = useBn()
  const teachers = useTeacherStore((s) => s.teachers)
  const addTodo = useTodoStore((s) => s.addTodo)

  const [title, setTitle] = useState('')
  const [titleBn, setTitleBn] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionBn, setDescriptionBn] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TodoTask['priority']>('medium')
  const [assignedTo, setAssignedTo] = useState<string[]>([])
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)

  const activeTeachers = teachers.filter((t) => t.status === 'active')

  const toggleTeacher = (id: string) => {
    setAssignedTo((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    if (!title.trim() || !dueDate) return
    const now = new Date().toISOString()
    addTodo({
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      titleBn: titleBn.trim() || title.trim(),
      description: description.trim(),
      descriptionBn: descriptionBn.trim() || description.trim(),
      dueDate,
      priority,
      status: 'pending',
      assignedTo,
      createdBy: 'Admin',
      createdAt: now,
    })
    onClose()
  }

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          width: '90vw',
          maxWidth: '32rem',
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {isBn ? 'নতুন কাজ যোগ করুন' : 'Create New Task'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Title EN */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
              {isBn ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}
            </label>
            <input
              className={inputCls}
              style={{ width: '100%' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isBn ? 'কাজের শিরোনাম' : 'Task title'}
            />
          </div>

          {/* Title BN */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
              {isBn ? 'শিরোনাম (বাংলা)' : 'Title (Bangla)'}
            </label>
            <input
              className={inputCls}
              style={{ width: '100%' }}
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder={isBn ? 'কাজের শিরোনাম বাংলায়' : 'Task title in Bangla'}
            />
          </div>

          {/* Description EN */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
              {isBn ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}
            </label>
            <textarea
              className={inputCls}
              style={{ width: '100%', height: '4rem', resize: 'vertical', padding: '0.5rem' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isBn ? 'কাজের বিবরণ' : 'Task description'}
            />
          </div>

          {/* Description BN */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
              {isBn ? 'বিবরণ (বাংলা)' : 'Description (Bangla)'}
            </label>
            <textarea
              className={inputCls}
              style={{ width: '100%', height: '4rem', resize: 'vertical', padding: '0.5rem' }}
              value={descriptionBn}
              onChange={(e) => setDescriptionBn(e.target.value)}
              placeholder={isBn ? 'কাজের বিবরণ বাংলায়' : 'Task description in Bangla'}
            />
          </div>

          {/* Due Date + Priority row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={12} /> {isBn ? 'শেষ তারিখ' : 'Due Date'}
              </label>
              <input
                type="date"
                className={inputCls}
                style={{ width: '100%' }}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Flag size={12} /> {isBn ? 'অগ্রাধিকার' : 'Priority'}
              </label>
              <select
                className={selectCls}
                style={{ width: '100%' }}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoTask['priority'])}
              >
                <option value="low">{isBn ? 'কম' : 'Low'}</option>
                <option value="medium">{isBn ? 'মাঝারি' : 'Medium'}</option>
                <option value="high">{isBn ? 'বেশি' : 'High'}</option>
              </select>
            </div>
          </div>

          {/* Assigned Teachers */}
          <div>
            <label style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Users size={12} /> {isBn ? 'নির্ধারিত শিক্ষক' : 'Assigned Teachers'}
            </label>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={selectCls}
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {assignedTo.length === 0
                    ? isBn ? 'সকল কর্মচারী' : 'All Staff'
                    : `${assignedTo.length} ${isBn ? 'জন নির্বাচিত' : 'selected'}`}
                </span>
              </button>
              {showTeacherDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    maxHeight: '10rem',
                    overflow: 'auto',
                    boxShadow: 'var(--shadow-md)',
                    marginTop: '0.25rem',
                  }}
                >
                  <div
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', cursor: 'pointer', color: assignedTo.length === 0 ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: assignedTo.length === 0 ? 600 : 400, borderBottom: '1px solid var(--border)' }}
                    onClick={() => setAssignedTo([])}
                  >
                    {isBn ? 'সকল কর্মচারী' : 'All Staff'}
                  </div>
                  {activeTeachers.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.6875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: assignedTo.includes(t.id) ? 'var(--brand-light)' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                      onClick={() => toggleTeacher(t.id)}
                    >
                      <div
                        style={{
                          width: '0.875rem',
                          height: '0.875rem',
                          borderRadius: '0.1875rem',
                          border: `1.5px solid ${assignedTo.includes(t.id) ? 'var(--brand)' : 'var(--border)'}`,
                          background: assignedTo.includes(t.id) ? 'var(--brand)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {assignedTo.includes(t.id) && (
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </div>
                      {t.nameEn}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3125rem',
              padding: '0.4375rem 0.875rem', borderRadius: '0.5rem',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            className={btnPrimary}
            onClick={handleSave}
            disabled={!title.trim() || !dueDate}
            style={{ opacity: !title.trim() || !dueDate ? 0.5 : 1 }}
          >
            {isBn ? 'সংরক্ষণ' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
