import { useState } from 'react'
import { FileText, Save, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useMessageTemplateStore, type TemplateType, type MessageTemplate } from '@/store/messageTemplateStore'

const VARIABLES: Record<TemplateType, { var: string; label: string; labelBn: string }[]> = {
  fee: [
    { var: '{student_name}', label: 'Student Name', labelBn: 'শিক্ষার্থীর নাম' },
    { var: '{amount}', label: 'Amount', labelBn: 'পরিমাণ' },
    { var: '{month}', label: 'Month', labelBn: 'মাস' },
    { var: '{receipt_no}', label: 'Receipt No', labelBn: 'রসিদ নং' },
  ],
  exam: [
    { var: '{student_name}', label: 'Student Name', labelBn: 'শিক্ষার্থীর নাম' },
    { var: '{exam_name}', label: 'Exam Name', labelBn: 'পরীক্ষার নাম' },
    { var: '{start_date}', label: 'Start Date', labelBn: 'শুরুর তারিখ' },
    { var: '{end_date}', label: 'End Date', labelBn: 'শেষ তারিখ' },
  ],
  due: [
    { var: '{student_name}', label: 'Student Name', labelBn: 'শিক্ষার্থীর নাম' },
    { var: '{due_amount}', label: 'Due Amount', labelBn: 'বকেয় পরিমাণ' },
    { var: '{month}', label: 'Month', labelBn: 'মাস' },
    { var: '{due_date}', label: 'Due Date', labelBn: 'শেষ তারিখ' },
  ],
  general: [
    { var: '{recipient_name}', label: 'Recipient Name', labelBn: 'প্রাপকের নাম' },
    { var: '{subject}', label: 'Subject', labelBn: 'বিষয়' },
    { var: '{message}', label: 'Message', labelBn: 'বার্তা' },
    { var: '{school_name}', label: 'School Name', labelBn: 'বিদ্যালয়ের নাম' },
  ],
}

const TYPE_CONFIG: Record<TemplateType, { label: string; labelBn: string; color: string }> = {
  fee: { label: 'Fee Collection', labelBn: 'ফি আদায়', color: 'var(--green)' },
  exam: { label: 'Examination', labelBn: 'পরীক্ষা', color: 'var(--brand)' },
  due: { label: 'Due Payment', labelBn: 'বকেয় পেমেন্ট', color: 'var(--orange)' },
  general: { label: 'General Message', labelBn: 'সাধারণ বার্তা', color: 'var(--text-muted)' },
}

export function TemplatesTab() {
  const bn = useBn()
  const templates = useMessageTemplateStore((s) => s.templates)
  const updateTemplate = useMessageTemplateStore((s) => s.updateTemplate)
  const [expandedType, setExpandedType] = useState<TemplateType | null>('fee')
  const [edits, setEdits] = useState<Record<string, { subject: string; body: string }>>({})
  const [savedId, setSavedId] = useState<string | null>(null)

  const getEdit = (tpl: MessageTemplate) => edits[tpl.id] || { subject: tpl.subject, body: tpl.body }

  const setEdit = (id: string, field: 'subject' | 'body', value: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const hasChanges = (tpl: MessageTemplate) => {
    const e = edits[tpl.id]
    if (!e) return false
    return e.subject !== tpl.subject || e.body !== tpl.body
  }

  const handleSave = (tpl: MessageTemplate) => {
    const e = edits[tpl.id]
    if (!e) return
    updateTemplate(tpl.id, { subject: e.subject, body: e.body })
    setSavedId(tpl.id)
    setTimeout(() => setSavedId(null), 1500)
  }

  const handleReset = (tpl: MessageTemplate) => {
    setEdits((prev) => ({ ...prev, [tpl.id]: { subject: tpl.subject, body: tpl.body } }))
  }

  const insertVar = (tplId: string, variable: string) => {
    const current = edits[tplId]?.body || templates.find((t) => t.id === tplId)?.body || ''
    setEdits((prev) => ({ ...prev, [tplId]: { ...(prev[tplId] || { subject: '', body: '' }), body: current + variable } }))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-[var(--text-muted)]" />
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'এসএমএস টেমপ্লেট' : 'SMS Templates'}</h3>
      </div>
      <p className="text-[0.75rem] text-[var(--text-muted)] mb-4">{bn ? 'ফি আদায়, পরীক্ষা, বকেয় এবং সাধারণ বার্তার জন্য টেমপ্লেট সেট করুন।' : 'Set templates for fee collection, examination, due reminders, and general messages.'}</p>

      {(['fee', 'exam', 'due', 'general'] as TemplateType[]).map((type) => {
        const tpl = templates.find((t) => t.type === type)
        if (!tpl) return null
        const cfg = TYPE_CONFIG[type]
        const isExpanded = expandedType === type
        const changed = hasChanges(tpl)
        const justSaved = savedId === tpl.id
        const edit = getEdit(tpl)

        return (
          <div key={type} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden mb-2">
            <button
              type="button"
              onClick={() => setExpandedType(isExpanded ? null : type)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? cfg.labelBn : cfg.label}</span>
                {changed && <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange)]" />}
              </div>
              {isExpanded ? <ChevronDown size={16} className="text-[var(--text-muted)]" /> : <ChevronRight size={16} className="text-[var(--text-muted)]" />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]">
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
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1.5">{bn ? 'ভেরিয়েবল' : 'Variables'}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLES[type].map((v) => (
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
                  <button
                    type="button"
                    onClick={() => handleSave(tpl)}
                    disabled={!changed}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium transition-all ${justSaved ? 'bg-[var(--green)]/10 text-[var(--green)]' : changed ? 'bg-[var(--brand)] text-white hover:opacity-90' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'}`}
                  >
                    <Save size={13} />
                    {justSaved ? (bn ? 'সংরক্ষিত!' : 'Saved!') : (bn ? 'সংরক্ষণ' : 'Save')}
                  </button>
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
  )
}
