import React, { useState } from 'react'
import { ChevronDown, CalendarDays, AlertTriangle, Trash2 } from 'lucide-react'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import type { TodoTask } from '@/store/todoStore'
import type { Teacher } from '@/pages/teachers/types'

interface Props {
  isBn: boolean
  todos: TodoTask[]
  teachers: Teacher[]
  selectedTeacherId: string
  setSelectedTeacherId: (id: string) => void
  updateTodo: (id: string, updates: Partial<TodoTask>) => void
  deleteTodo?: (id: string) => void
  cardStyle: React.CSSProperties
  sectionHead: (color: string) => React.ReactNode
  col2: string
  gap: string
}

export const TodoSection: React.FC<Props> = ({
  isBn,
  todos,
  teachers,
  selectedTeacherId,
  setSelectedTeacherId,
  updateTodo,
  deleteTodo,
  cardStyle,
  sectionHead,
  col2,
  gap,
}) => {
  const [showTeacherPicker, setShowTeacherPicker] = useState(false)

  const activeTeachers = teachers.filter((t) => t.status === 'active')

  const filtered =
    selectedTeacherId === 'all'
      ? todos
      : todos.filter((t) => t.assignedTo.length === 0 || t.assignedTo.includes(selectedTeacherId))

  const total = filtered.length
  const pending = filtered.filter((t) => t.status === 'pending').length
  const inProgress = filtered.filter((t) => t.status === 'in-progress').length
  const completed = filtered.filter((t) => t.status === 'completed').length
  const overdue = filtered.filter(
    (t) => t.dueDate && t.dueDate < new Date().toISOString().split('T')[0] && t.status !== 'completed'
  ).length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col2, gap }}>
      {/* Tasks List */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {sectionHead('var(--brand)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'আমার কাজ' : 'My Tasks'}
            </span>
          </div>

          {/* Teacher Selector */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowTeacherPicker(!showTeacherPicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.625rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {selectedTeacherId === 'all'
                ? isBn
                  ? 'সকল কর্মচারী'
                  : 'All Staff'
                : teachers.find((t) => t.id === selectedTeacherId)?.nameEn || 'Teacher'}
              <ChevronDown size={10} />
            </button>

            {showTeacherPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  zIndex: 20,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  maxHeight: '12rem',
                  overflow: 'auto',
                  boxShadow: 'var(--shadow-md)',
                  marginTop: '0.25rem',
                  minWidth: '10rem',
                }}
              >
                <div
                  style={{
                    padding: '0.4rem 0.625rem',
                    fontSize: '0.625rem',
                    cursor: 'pointer',
                    color: selectedTeacherId === 'all' ? 'var(--brand)' : 'var(--text-secondary)',
                    fontWeight: selectedTeacherId === 'all' ? 600 : 400,
                    borderBottom: '1px solid var(--border)',
                  }}
                  onClick={() => {
                    setSelectedTeacherId('all')
                    setShowTeacherPicker(false)
                  }}
                >
                  {isBn ? 'সকল কর্মচারী' : 'All Staff'}
                </div>
                {activeTeachers.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '0.4rem 0.625rem',
                      fontSize: '0.625rem',
                      cursor: 'pointer',
                      color: selectedTeacherId === t.id ? 'var(--brand)' : 'var(--text-primary)',
                      fontWeight: selectedTeacherId === t.id ? 600 : 400,
                      background: selectedTeacherId === t.id ? 'var(--brand-light)' : 'transparent',
                    }}
                    onClick={() => {
                      setSelectedTeacherId(t.id)
                      setShowTeacherPicker(false)
                    }}
                  >
                    {t.nameEn}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            maxHeight: '16rem',
            overflow: 'auto',
          }}
        >
          {todos.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem 0',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
              }}
            >
              {isBn ? 'কোনো কাজ নেই' : 'No tasks yet'}
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem 0',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
              }}
            >
              {isBn ? 'এই শিক্ষকের জন্য কাজ নেই' : 'No tasks for this teacher'}
            </div>
          ) : (
            [...filtered]
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
              })
              .map((task) => {
                const isOverdue =
                  task.dueDate &&
                  task.dueDate < new Date().toISOString().split('T')[0] &&
                  task.status !== 'completed'

                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      padding: '0.5rem 0.625rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <ModernCheckbox
                      checked={task.status === 'completed'}
                      onChange={() =>
                        updateTodo(task.id, {
                          status: task.status === 'completed' ? 'pending' : 'completed',
                          completedAt:
                            task.status === 'completed' ? undefined : new Date().toISOString(),
                        })
                      }
                      color="brand"
                      size="xs"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 500,
                            color:
                              task.status === 'completed'
                                ? 'var(--text-muted)'
                                : 'var(--text-primary)',
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                          }}
                        >
                          {isBn ? task.titleBn : task.title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.5rem',
                            fontWeight: 600,
                            padding: '1px 4px',
                            borderRadius: '0.25rem',
                            color:
                              task.priority === 'high'
                                ? 'var(--red)'
                                : task.priority === 'medium'
                                  ? 'var(--amber)'
                                  : 'var(--green)',
                            background:
                              task.priority === 'high'
                                ? 'var(--red-light)'
                                : task.priority === 'medium'
                                  ? 'var(--amber-light)'
                                  : 'var(--green-light)',
                          }}
                        >
                          {task.priority === 'high'
                            ? isBn
                              ? 'বেশি'
                              : 'HIGH'
                            : task.priority === 'medium'
                              ? isBn
                                ? 'মাঝারি'
                                : 'MED'
                              : isBn
                                ? 'কম'
                                : 'LOW'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.1875rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.5625rem',
                            color: isOverdue ? 'var(--red)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.1875rem',
                          }}
                        >
                          <CalendarDays size={9} />
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.5rem',
                            fontWeight: 500,
                            padding: '1px 4px',
                            borderRadius: '0.25rem',
                            color:
                              task.status === 'completed'
                                ? 'var(--green)'
                                : task.status === 'in-progress'
                                  ? 'var(--brand)'
                                  : 'var(--text-muted)',
                            background:
                              task.status === 'completed'
                                ? 'var(--green-light)'
                                : task.status === 'in-progress'
                                  ? 'var(--brand-light)'
                                  : 'var(--bg-secondary)',
                          }}
                        >
                          {task.status === 'completed'
                            ? isBn
                              ? 'সম্পন্ন'
                              : 'Done'
                            : task.status === 'in-progress'
                              ? isBn
                                ? 'চলমান'
                                : 'In Progress'
                              : isBn
                                ? 'বাকি'
                                : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {deleteTodo && (
                      <button
                        type="button"
                        aria-label={isBn ? 'কাজটি মুছুন' : 'Delete task'}
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTodo(task.id)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.1875rem',
                          borderRadius: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.7,
                          transition: 'opacity 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1'
                          e.currentTarget.style.color = 'var(--red)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.7'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )
              })
          )}
        </div>
      </div>

      {/* Task Summary */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          {sectionHead('var(--teal)')}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'কাজের সারসংক্ষেপ' : 'Task Summary'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Progress bar */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.25rem',
              }}
            >
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                {isBn ? 'সম্পন্ন' : 'Completed'}
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {pct}%
              </span>
            </div>
            <div
              style={{
                height: '0.375rem',
                background: 'var(--border)',
                borderRadius: '0.1875rem',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'var(--green)',
                  borderRadius: '0.1875rem',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              { label: isBn ? 'মোট' : 'Total', value: total, color: 'var(--brand)' },
              { label: isBn ? 'বাকি' : 'Pending', value: pending, color: 'var(--amber)' },
              { label: isBn ? 'চলমান' : 'In Progress', value: inProgress, color: 'var(--brand)' },
              { label: isBn ? 'সম্পন্ন' : 'Done', value: completed, color: 'var(--green)' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '0.125rem',
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {overdue > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                background: 'var(--red-light)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <AlertTriangle size={12} color="var(--red)" />
              <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--red)' }}>
                {overdue} {isBn ? 'টি কাজ বিলম্বিত' : 'overdue task(s)'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
