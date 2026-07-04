import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Link, Calendar } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useOnlineStore, detectPlatform, getThumbnail, platformColors, platformLabels } from '@/store/onlineStore'
import type { OnlineClass, Platform } from '@/store/onlineStore'

const inputCls = 'w-full px-3 py-[0.625rem] rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'
const selectCls = inputCls + ' cursor-pointer appearance-none pr-7 bg-no-repeat bg-[right_0.625rem_center] bg-[length:0.75rem] bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")]'

interface Props {
  open: boolean
  onClose: () => void
  editItem?: OnlineClass | null
}

export function CreateClassModal({ open, onClose, editItem }: Props) {
  const isBn = useBn()
  const { classes } = useClassStore()
  const { teachers, subjects } = useTeacherStore()
  const addClass = useOnlineStore((s) => s.addClass)
  const updateClass = useOnlineStore((s) => s.updateClass)

  const [form, setForm] = useState({
    title: '', titleBn: '', description: '', descriptionBn: '',
    classId: '', sectionId: '', subjectId: '', teacherId: '',
    url: '', scheduledAt: '', status: 'scheduled' as OnlineClass['status'],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          title: editItem.title, titleBn: editItem.titleBn,
          description: editItem.description, descriptionBn: editItem.descriptionBn,
          classId: editItem.classId, sectionId: editItem.sectionId,
          subjectId: editItem.subjectId, teacherId: editItem.teacherId,
          url: editItem.url, scheduledAt: editItem.scheduledAt.slice(0, 16),
          status: editItem.status,
        })
      } else {
        setForm({ title: '', titleBn: '', description: '', descriptionBn: '', classId: '', sectionId: '', subjectId: '', teacherId: '', url: '', scheduledAt: '', status: 'scheduled' })
      }
      setErrors({})
    }
  }, [open, editItem])

  const selectedClass = classes.find((c) => c.id === form.classId)
  const sections = selectedClass?.sections || []
  const selectedSection = sections.find((s) => s.id === form.sectionId)
  const sectionSubjectIds = selectedSection?.subjectIds || selectedClass?.subjectIds || []
  const filteredSubjects = subjects.filter((s) => sectionSubjectIds.includes(s.id))

  const detectedPlatform: Platform = form.url ? detectPlatform(form.url) : 'other'

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = isBn ? 'শিরোনাম আবশ্যক' : 'Required'
    if (!form.url.trim()) e.url = isBn ? 'লিংক আবশ্যক' : 'Required'
    if (!form.classId) e.classId = isBn ? 'শ্রেণি আবশ্যক' : 'Required'
    if (!form.sectionId) e.sectionId = isBn ? 'শাখা আবশ্যক' : 'Required'
    if (!form.subjectId) e.subjectId = isBn ? 'বিষয় আবশ্যক' : 'Required'
    if (!form.teacherId) e.teacherId = isBn ? 'শিক্ষক আবশ্যক' : 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const thumbnail = getThumbnail(form.url)
    if (editItem) {
      updateClass(editItem.id, { ...form, platform: detectedPlatform, thumbnailUrl: thumbnail })
    } else {
      addClass({ ...form, platform: detectedPlatform, thumbnailUrl: thumbnail, createdBy: 'admin' })
    }
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-box" style={{ maxWidth: '32rem' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {editItem ? (isBn ? 'আপডেট করুন' : 'Update') : (isBn ? 'নতুন অনলাইন ক্লাস' : 'New Online Class')}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শিরোনাম (EN)' : 'Title (EN)'} *</label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <span className="text-[var(--red)] text-[0.625rem]">{errors.title}</span>}
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শিরোনাম (BN)' : 'Title (BN)'}</label>
            <input className={inputCls} value={form.titleBn} onChange={(e) => setForm({ ...form, titleBn: e.target.value })} />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
              <Link size={12} className="inline mr-1" />
              {isBn ? 'লাইভ লিংক' : 'Live Link'} *
            </label>
            <input className={inputCls} placeholder="https://youtube.com/watch?v=..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            {errors.url && <span className="text-[var(--red)] text-[0.625rem]">{errors.url}</span>}
            {form.url && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[0.625rem] px-2 py-0.5 rounded-full font-medium" style={{ background: `${platformColors[detectedPlatform]}20`, color: platformColors[detectedPlatform] }}>
                  {platformLabels[detectedPlatform][isBn ? 'bn' : 'en']}
                </span>
              </div>
            )}
            {form.url && getThumbnail(form.url) && (
              <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border)]">
                <img src={getThumbnail(form.url)} alt="" className="w-full h-auto object-cover" style={{ maxHeight: '12rem' }} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শ্রেণি' : 'Class'} *</label>
              <select className={selectCls} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: '', subjectId: '' })}>
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.name}</option>)}
              </select>
              {errors.classId && <span className="text-[var(--red)] text-[0.625rem]">{errors.classId}</span>}
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শাখা' : 'Section'} *</label>
              <select className={selectCls} value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value, subjectId: '' })}>
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.sectionId && <span className="text-[var(--red)] text-[0.625rem]">{errors.sectionId}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'বিষয়' : 'Subject'} *</label>
              <select className={selectCls} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
              </select>
              {errors.subjectId && <span className="text-[var(--red)] text-[0.625rem]">{errors.subjectId}</span>}
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শিক্ষক' : 'Teacher'} *</label>
              <select className={selectCls} value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{isBn ? t.nameBn : t.nameEn}</option>)}
              </select>
              {errors.teacherId && <span className="text-[var(--red)] text-[0.625rem]">{errors.teacherId}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">
                <Calendar size={12} className="inline mr-1" />
                {isBn ? 'সময়সূচী' : 'Scheduled At'}
              </label>
              <input type="datetime-local" className={inputCls} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'অবস্থা' : 'Status'}</label>
              <select className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OnlineClass['status'] })}>
                <option value="scheduled">{isBn ? 'নির্ধারিত' : 'Scheduled'}</option>
                <option value="live">{isBn ? 'লাইভ' : 'Live'}</option>
                <option value="ended">{isBn ? 'শেষ' : 'Ended'}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'বিবরণ (EN)' : 'Description (EN)'}</label>
            <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'বিবরণ (BN)' : 'Description (BN)'}</label>
            <textarea className={inputCls} rows={2} value={form.descriptionBn} onChange={(e) => setForm({ ...form, descriptionBn: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-[0.8125rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] cursor-pointer hover:shadow-sm transition-all">
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSubmit} className="flex-1 py-2 rounded-xl text-[0.8125rem] font-medium border-none bg-[var(--brand)] text-white cursor-pointer hover:opacity-90 transition-opacity">
            {editItem ? (isBn ? 'আপডেট' : 'Update') : (isBn ? 'তৈরি করুন' : 'Create')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
