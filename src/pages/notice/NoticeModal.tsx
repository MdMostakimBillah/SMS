import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Megaphone, X, Bold, Italic, Underline, List, ListOrdered, Undo2, Redo2 } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import { useAuth } from '@/contexts/AuthContext'
import type { Notice, NoticeTarget, NoticePriority } from '@/store/noticeStore'

const TARGET_OPTIONS = [
  { value: 'all', label: 'All', labelBn: 'সকল' },
  { value: 'students', label: 'Students', labelBn: 'শিক্ষার্থী' },
  { value: 'teachers', label: 'Teachers', labelBn: 'শিক্ষক' },
  { value: 'parents', label: 'Parents', labelBn: 'অভিভাবক' },
]
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', labelBn: 'কম', color: 'var(--text-muted)' },
  { value: 'medium', label: 'Medium', labelBn: 'মাঝারি', color: 'var(--brand)' },
  { value: 'high', label: 'High', labelBn: 'বেশি', color: 'var(--orange)' },
  { value: 'urgent', label: 'Urgent', labelBn: 'জরুরি', color: 'var(--red)' },
]

interface Props {
  item: Notice | null
  categories: string[]
  onSave: (data: Omit<Notice, 'id'>) => void
  onClose: () => void
  bn: boolean
}

function ToolbarBtn({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title} className={`p-1.5 rounded transition-colors ${active ? 'text-[var(--brand)] bg-[var(--brand)]/10' : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'}`}>
      {children}
    </button>
  )
}

function ToolbarSep() {
  return <div className="w-px h-4 bg-[var(--border)] mx-1" />
}

export function NoticeModal({ item, categories, onSave, onClose, bn }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState(item?.title || '')
  const [titleBn, setTitleBn] = useState(item?.titleBn || '')
  const [content, setContent] = useState(item?.content || '')
  const [contentBn, setContentBn] = useState(item?.contentBn || '')
  const [target, setTarget] = useState<NoticeTarget>(item?.target || 'all')
  const [priority, setPriority] = useState<NoticePriority>(item?.priority || 'medium')
  const [category, setCategory] = useState(item?.category || 'General')
  const [expiresAt, setExpiresAt] = useState(item?.expiresAt || '')

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false }), UnderlineExt],
    content: item?.content || '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-[200px] outline-none text-[0.8125rem] text-[var(--text-primary)] leading-relaxed',
      },
    },
    onUpdate: ({ editor: e }) => setContent(e.getText()),
  })

  const editorBn = useEditor({
    extensions: [StarterKit.configure({ heading: false }), UnderlineExt],
    content: item?.contentBn || '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-[200px] outline-none text-[0.8125rem] text-[var(--text-primary)] leading-relaxed',
      },
    },
    onUpdate: ({ editor: e }) => setContentBn(e.getText()),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onSave({
      title: title.trim(),
      titleBn: titleBn.trim() || title.trim(),
      content: content.trim(),
      contentBn: contentBn.trim() || content.trim(),
      author: user?.name || 'Admin',
      authorBn: user?.name || 'Admin',
      target,
      priority,
      category,
      pinned: item?.pinned || false,
      isActive: item?.isActive ?? true,
      publishedAt: item?.publishedAt || new Date().toISOString(),
      expiresAt: expiresAt || '',
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-primary)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl" style={{ background: 'var(--brand)' }}>
          <h3 className="font-semibold text-[0.9375rem] text-white flex items-center gap-2">
            <Megaphone size={16} />
            {item ? (bn ? 'নোটিশ সম্পাদনা' : 'Edit Notice') : (bn ? 'নতুন নোটিশ' : 'New Notice')}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-auto">
          <div className="p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'শিরোনাম (ইংরেজি)*' : 'Title (English)*'}</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" required />
              </div>
              <div>
                <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'শিরোনাম (বাংলা)' : 'Title (Bangla)'}</label>
                <input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" placeholder={bn ? 'বাংলায় শিরোনাম' : 'Title in Bangla'} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'ক্যাটাগরি' : 'Category'}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'মূল্যায়ন' : 'Target'}</label>
                <select value={target} onChange={(e) => setTarget(e.target.value as NoticeTarget)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                  {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'অগ্রাধিকার' : 'Priority'}</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as NoticePriority)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'বিষয়বস্তু (ইংরেজি)*' : 'Content (English)*'}</label>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
                {editor && (
                  <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border)]">
                    <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></ToolbarBtn>
                    <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></ToolbarBtn>
                    <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><Underline size={14} /></ToolbarBtn>
                    <ToolbarSep />
                    <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={14} /></ToolbarBtn>
                    <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered size={14} /></ToolbarBtn>
                    <ToolbarSep />
                    <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={14} /></ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={14} /></ToolbarBtn>
                  </div>
                )}
                <EditorContent editor={editor} className="[&_.tiptap]:min-h-[200px] [&_.tiptap]:p-3 [&_.tiptap]:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'বিষয়বস্তু (বাংলা)' : 'Content (Bangla)'}</label>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
                {editorBn && (
                  <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border)]">
                    <ToolbarBtn active={editorBn.isActive('bold')} onClick={() => editorBn.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></ToolbarBtn>
                    <ToolbarBtn active={editorBn.isActive('italic')} onClick={() => editorBn.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></ToolbarBtn>
                    <ToolbarBtn active={editorBn.isActive('underline')} onClick={() => editorBn.chain().focus().toggleUnderline().run()} title="Underline"><Underline size={14} /></ToolbarBtn>
                    <ToolbarSep />
                    <ToolbarBtn active={editorBn.isActive('bulletList')} onClick={() => editorBn.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={14} /></ToolbarBtn>
                    <ToolbarBtn active={editorBn.isActive('orderedList')} onClick={() => editorBn.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered size={14} /></ToolbarBtn>
                    <ToolbarSep />
                    <ToolbarBtn onClick={() => editorBn.chain().focus().undo().run()} title="Undo"><Undo2 size={14} /></ToolbarBtn>
                    <ToolbarBtn onClick={() => editorBn.chain().focus().redo().run()} title="Redo"><Redo2 size={14} /></ToolbarBtn>
                  </div>
                )}
                <EditorContent editor={editorBn} className="[&_.tiptap]:min-h-[200px] [&_.tiptap]:p-3 [&_.tiptap]:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'মেয়াদ শেষ' : 'Expires At'}</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
            </div>
          </div>

          <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium text-white transition-opacity hover:opacity-90" style={{ background: 'var(--brand)' }}>
              {item ? (bn ? 'আপডেট' : 'Update') : (bn ? 'প্রকাশ' : 'Publish')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
