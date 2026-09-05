import { useState, useMemo } from 'react'
import { FileText, Save, RotateCcw, ChevronDown, ChevronRight, Plus, Trash2, Tag, Sparkles } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useMessageTemplateStore, type MessageTemplate, type TemplateTrigger } from '@/store/messageTemplateStore'

const TRIGGER_VARIABLES: Record<TemplateTrigger, { var: string; label: string; labelBn: string }[]> = {
  fee_collect: [
    { var: '{student_name}', label: 'Student Name', labelBn: 'শিক্ষার্থীর নাম' },
    { var: '{amount}', label: 'Amount', labelBn: 'পরিমাণ' },
    { var: '{month}', label: 'Month', labelBn: 'মাস' },
    { var: '{receipt_no}', label: 'Receipt No', labelBn: 'রসিদ নং' },
    { var: '{fee_name}', label: 'Fee Name', labelBn: 'ফির নাম' },
  ],
  exam_schedule: [
    { var: '{student_name}', label: 'Student Name', labelBn: 'শিক্ষার্থীর নাম' },
    { var: '{exam_name}', label: 'Exam Name', labelBn: 'পরীক্ষার নাম' },
    { var: '{start_date}', label: 'Start Date', labelBn: 'শুরুর তারিখ' },
    { var: '{end_date}', label: 'End Date', labelBn: 'শেষ তারিখ' },
    { var: '{class}', label: 'Class', labelBn: 'শ্রেণি' },
  ],
  due_reminder: [
    { var: '{student_name}', label: 'Student Name', labelBn: 'শিক্ষার্থীর নাম' },
    { var: '{due_amount}', label: 'Due Amount', labelBn: 'বকেয় পরিমাণ' },
    { var: '{month}', label: 'Month', labelBn: 'মাস' },
    { var: '{due_date}', label: 'Due Date', labelBn: 'শেষ তারিখ' },
  ],
  manual: [
    { var: '{recipient_name}', label: 'Recipient Name', labelBn: 'প্রাপকের নাম' },
    { var: '{subject}', label: 'Subject', labelBn: 'বিষয়' },
    { var: '{message}', label: 'Message', labelBn: 'বার্তা' },
    { var: '{school_name}', label: 'School Name', labelBn: 'বিদ্যালয়ের নাম' },
  ],
}

const TRIGGER_LABELS: Record<TemplateTrigger, { label: string; labelBn: string; color: string; icon: string }> = {
  fee_collect: { label: 'Fee Collection', labelBn: 'ফি আদায়', color: 'var(--green)', icon: '💰' },
  exam_schedule: { label: 'Exam Schedule', labelBn: 'পরীক্ষা সূচি', color: 'var(--brand)', icon: '📝' },
  due_reminder: { label: 'Due Reminder', labelBn: 'বকেয় পেমেন্ট', color: 'var(--orange)', icon: '⏰' },
  manual: { label: 'General/Manual', labelBn: 'সাধারণ/ম্যানুয়াল', color: 'var(--text-muted)', icon: '📝' },
}

const DEFAULT_VARIABLES: { var: string; label: string; labelBn: string }[] = [
  { var: '{student_name}', label: 'Student Name', labelBn: 'শিক্ষার্থীর নাম' },
  { var: '{recipient_name}', label: 'Recipient Name', labelBn: 'প্রাপকের নাম' },
  { var: '{subject}', label: 'Subject', labelBn: 'বিষয়' },
  { var: '{message}', label: 'Message', labelBn: 'বার্তা' },
  { var: '{school_name}', label: 'School Name', labelBn: 'বিদ্যালয়ের নাম' },
]

function getVariablesForTrigger(trigger: TemplateTrigger) {
  return TRIGGER_VARIABLES[trigger] || DEFAULT_VARIABLES
}

function getTriggerConfig(trigger: TemplateTrigger) {
  return TRIGGER_LABELS[trigger] || { label: trigger, labelBn: trigger, color: 'var(--text-muted)', icon: '📝' }
}

export function TemplatesTab() {
  const bn = useBn()
  const { canCreate, canEdit, canDelete } = usePermission()
  const templates = useMessageTemplateStore((s) => s.templates)
  const categories = useMessageTemplateStore((s) => s.categories)
  const updateTemplate = useMessageTemplateStore((s) => s.updateTemplate)
  const createTemplate = useMessageTemplateStore((s) => s.createTemplate)
  const deleteTemplate = useMessageTemplateStore((s) => s.deleteTemplate)
  const addCategory = useMessageTemplateStore((s) => s.addCategory)
  const removeCategory = useMessageTemplateStore((s) => s.removeCategory)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, { subject: string; body: string; name: string; nameBn: string; trigger: TemplateTrigger; category: string }>>({})
  const [savedId, setSavedId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    nameBn: '',
    trigger: 'manual' as TemplateTrigger,
    category: 'General',
    subject: '',
    body: '',
  })

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, MessageTemplate[]> = {}
    templates.forEach((t) => {
      const cat = t.category || 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(t)
    })
    return groups
  }, [templates])

  const getEdit = (tpl: MessageTemplate) => {
    const e = edits[tpl.id]
    if (!e) {
      const initial = {
        subject: tpl.subject,
        body: tpl.body,
        name: tpl.name,
        nameBn: tpl.nameBn,
        trigger: tpl.trigger,
        category: tpl.category || '',
      }
      return initial
    }
    return e
  }

  const setEdit = (id: string, field: string, value: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const hasChanges = (tpl: MessageTemplate) => {
    const e = edits[tpl.id]
    if (!e) return false
    return e.subject !== tpl.subject || e.body !== tpl.body || e.name !== tpl.name || e.nameBn !== tpl.nameBn || e.trigger !== tpl.trigger || e.category !== tpl.category
  }

  const handleSave = (tpl: MessageTemplate) => {
    const e = edits[tpl.id]
    if (!e) return
    updateTemplate(tpl.id, { subject: e.subject, body: e.body })
    setSavedId(tpl.id)
    setTimeout(() => setSavedId(null), 1500)
  }

  const handleReset = (tpl: MessageTemplate) => {
    setEdits((prev) => ({ ...prev, [tpl.id]: { subject: tpl.subject, body: tpl.body, name: tpl.name, nameBn: tpl.nameBn, trigger: tpl.trigger, category: tpl.category || '' } }))
  }

  const handleDelete = (tpl: MessageTemplate) => {
    if (tpl.isDefault) return
    if (window.confirm(bn ? 'এই টেমপ্লেটটি মুছে ফেলতে চান?' : 'Delete this template?')) {
      deleteTemplate(tpl.id)
      if (expandedId === tpl.id) setExpandedId(null)
    }
  }

  const insertVar = (tplId: string, variable: string) => {
    const current = edits[tplId]?.body || templates.find((t) => t.id === tplId)?.body || ''
    setEdits((prev) => ({ ...prev, [tplId]: { ...(prev[tplId] || { subject: '', body: '', name: '', nameBn: '', trigger: 'manual', category: '' }), body: current + variable } }))
  }

  const handleCreateTemplate = () => {
    if (!createForm.name.trim()) return
    const id = createTemplate({
      type: createForm.trigger,
      name: createForm.name,
      nameBn: createForm.nameBn,
      subject: createForm.subject,
      body: createForm.body,
      trigger: createForm.trigger,
      category: createForm.category,
      isDefault: false,
    })
    setCreateForm({ name: '', nameBn: '', trigger: 'manual', category: 'General', subject: '', body: '' })
    setShowCreateModal(false)
    setExpandedId(id)
  }

  const handleAddCategory = () => {
    if (!newCategory.trim()) return
    addCategory(newCategory.trim())
    setNewCategory('')
    setShowCategoryModal(false)
  }

  const handleRemoveCategory = (cat: string) => {
    if (window.confirm(bn ? `'${cat}' ক্যাটাগরি মুছে ফেলতে চান?` : `Delete category '${cat}'?`)) {
      removeCategory(cat)
    }
  }

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[var(--text-muted)]" />
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'এসএমএস টেমপ্লেট' : 'SMS Templates'}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Tag size={13} />
            {bn ? 'ক্যাটাগরি' : 'Categories'}
          </button>
          {canCreate('messages.templates') && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium text-white transition-colors"
              style={{ background: 'var(--brand)' }}
            >
              <Plus size={13} />
              {bn ? 'নতুন টেমপ্লেট' : 'New Template'}
            </button>
          )}
        </div>
      </div>
      <p className="text-[0.75rem] text-[var(--text-muted)] mb-4">{bn ? 'ফি আদায়, পরীক্ষা, বকেয় এবং সাধারণ বার্তার জন্য টেমপ্লেট সেট করুন। কাস্টম টেমপ্লেট তৈরি করতে "নতুন টেমপ্লেট" বোতামটি চাপুন।' : 'Set templates for fee collection, examination, due reminders, and general messages. Click "New Template" to create custom templates.'}</p>

      {/* Categories sidebar hint */}
      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <span key={cat} className="px-2 py-1 rounded-full text-[0.625rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Template list grouped by category */}
      <div className="space-y-3">
        {Object.entries(groupedTemplates).map(([category, catTemplates]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={11} className="text-[var(--brand)]" />
                {category}
                <span className="px-1.5 py-0.5 rounded text-[0.5625rem] bg-[var(--brand)]/10 text-[var(--brand)]">{catTemplates.length}</span>
              </h4>
            </div>
            {catTemplates.map((tpl) => {
              const cfg = getTriggerConfig(tpl.trigger)
              const isExpanded = expandedId === tpl.id
              const changed = hasChanges(tpl)
              const justSaved = savedId === tpl.id
              const edit = getEdit(tpl)

              return (
                <div key={tpl.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden mb-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{cfg.icon}</span>
                      <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? tpl.nameBn : tpl.name}</span>
                      {tpl.isDefault && <span className="px-1.5 py-0.5 rounded text-[0.5625rem] font-medium bg-[var(--brand)]/10 text-[var(--brand)]">{bn ? 'ডিফল্ট' : 'Default'}</span>}
                      <span className="px-1.5 py-0.5 rounded text-[0.5625rem] font-medium" style={{ background: `${cfg.color}15`, color: cfg.color }}>
                        {bn ? cfg.labelBn : cfg.label}
                      </span>
                      {changed && <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange)]" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {!tpl.isDefault && canDelete('messages.templates') && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(tpl) }}
                          className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--red)] transition-colors"
                          title={bn ? 'মুছুন' : 'Delete'}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      {isExpanded ? <ChevronDown size={16} className="text-[var(--text-muted)]" /> : <ChevronRight size={16} className="text-[var(--text-muted)]" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]">
                      <div className="pt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'নাম (ইংরেজি)' : 'Name (English)'}</label>
                          <input
                            value={edit.name}
                            onChange={(e) => setEdit(tpl.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
                          <input
                            value={edit.nameBn}
                            onChange={(e) => setEdit(tpl.id, 'nameBn', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'ট্রিগার/টাইপ' : 'Trigger/Type'}</label>
                          <select
                            value={edit.trigger}
                            onChange={(e) => setEdit(tpl.id, 'trigger', e.target.value as TemplateTrigger)}
                            className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer"
                          >
                            {Object.entries(TRIGGER_LABELS).map(([key, val]) => (
                              <option key={key} value={key}>{bn ? val.labelBn : val.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'ক্যাটাগরি' : 'Category'}</label>
                          <select
                            value={edit.category}
                            onChange={(e) => setEdit(tpl.id, 'category', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer"
                          >
                            <option value="">{bn ? 'ক্যাটাগরি বেছে নিন' : 'Select Category'}</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                            <option value="Custom">{bn ? 'কাস্টম' : 'Custom'}</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-3">
                        <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'বিষয়' : 'Subject'}</label>
                        <input
                          value={edit.subject}
                          onChange={(e) => setEdit(tpl.id, 'subject', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'বার্তা' : 'Message'}</label>
                        <textarea
                          value={edit.body}
                          onChange={(e) => setEdit(tpl.id, 'body', e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors resize-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1.5">{bn ? 'ভেরিয়েবল' : 'Variables'} <span className="text-[0.625rem] text-[var(--text-muted)]">({bn ? 'ক্লিক করলে যোগ হবে' : 'Click to insert'})</span></label>
                        <div className="flex flex-wrap gap-1.5">
                          {getVariablesForTrigger(edit.trigger).map((v) => (
                            <button
                              key={v.var}
                              type="button"
                              onClick={() => insertVar(tpl.id, v.var)}
                              className="px-2 py-1 rounded-md text-[0.625rem] font-mono bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer"
                              title={bn ? v.labelBn : v.label}
                            >
                              {v.var}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {canEdit('messages.templates') && (
                          <button
                            type="button"
                            onClick={() => handleSave(tpl)}
                            disabled={!changed}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium transition-all ${justSaved ? 'bg-[var(--green)]/10 text-[var(--green)]' : changed ? 'bg-[var(--brand)] text-white hover:opacity-90' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'}`}
                          >
                            <Save size={13} />
                            {justSaved ? (bn ? 'সংরক্ষিত!' : 'Saved!') : (bn ? 'সংরক্ষণ' : 'Save')}
                          </button>
                        )}
                        {changed && (
                          <button
                            type="button"
                            onClick={() => handleReset(tpl)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                          >
                            <RotateCcw size={13} />
                            {bn ? 'রিসেট' : 'Reset'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
              <h3 className="font-semibold text-[0.9375rem] text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--brand)]" />
                {bn ? 'নতুন টেমপ্লেট তৈরি করুন' : 'Create New Template'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><ChevronRight size={16} className="rotate-90" /></button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'নাম (ইংরেজি)*' : 'Name (English)*'}</label>
                  <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
                </div>
                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
                  <input value={createForm.nameBn} onChange={(e) => setCreateForm({ ...createForm, nameBn: e.target.value })} className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'ট্রিগার/টাইপ' : 'Trigger/Type'}</label>
                  <select value={createForm.trigger} onChange={(e) => setCreateForm({ ...createForm, trigger: e.target.value as TemplateTrigger })} className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                    {Object.entries(TRIGGER_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{bn ? val.labelBn : val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'ক্যাটাগরি' : 'Category'}</label>
                  <select value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                    <option value="">{bn ? 'ক্যাটাগরি বেছে নিন' : 'Select Category'}</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="Custom">{bn ? 'কাস্টম' : 'Custom'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'বিষয়' : 'Subject'}</label>
                <input value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
              </div>

              <div>
                <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'বার্তা' : 'Message'}</label>
                <textarea value={createForm.body} onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })} rows={6} className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors resize-none leading-relaxed" />
              </div>

              <div className="pt-2">
                <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1.5">{bn ? 'ভেরিয়েবল' : 'Variables'} <span className="text-[0.625rem">({bn ? 'ক্লিক করলে যোগ হবে' : 'Click to insert'})</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {getVariablesForTrigger(createForm.trigger).map((v) => (
                    <button key={v.var} type="button" onClick={() => setCreateForm({ ...createForm, body: createForm.body + v.var })} className="px-2 py-1 rounded-md text-[0.625rem] font-mono bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer" title={bn ? v.labelBn : v.label}>
                      {v.var}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button onClick={() => { setCreateForm({ name: '', nameBn: '', trigger: 'manual', category: 'General', subject: '', body: '' }); setShowCreateModal(false) }} className="px-4 py-2 rounded-lg text-[0.8125rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">{bn ? 'বাতিল' : 'Cancel'}</button>
                <button onClick={handleCreateTemplate} disabled={!createForm.name.trim() || !canCreate('messages.templates')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--brand)' }}>
                  <Save size={13} />
                  {bn ? 'টেমপ্লেট তৈরি করুন' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCategoryModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
              <h3 className="font-semibold text-[0.9375rem] text-[var(--text-primary)] flex items-center gap-2">
                <Tag size={16} className="text-[var(--brand)]" />
                {bn ? 'ক্যাটাগরি পরিচালনা' : 'Manage Categories'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><ChevronRight size={16} className="rotate-90" /></button>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <span className="text-[0.8125rem] text-[var(--text-primary)]">{cat}</span>
                  <button onClick={() => handleRemoveCategory(cat)} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--red)] transition-colors" title={bn ? 'মুছুন' : 'Delete'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div className="pt-2 border-t border-[var(--border)] flex gap-2">
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder={bn ? 'নতুন ক্যাটাগরি নাম' : 'New category name'} className="flex-1 px-3 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
                <button onClick={handleAddCategory} disabled={!newCategory.trim()} className="px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--brand)' }}>
                  {bn ? 'জোড়া দিন' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}