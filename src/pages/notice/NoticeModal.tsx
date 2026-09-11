import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Megaphone, X, Bold, Italic, Underline, List, ListOrdered, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, Quote, Code, Minus, Link2, Image as ImageIcon, Table as TableIcon, Heading1, Heading2, Heading3, Maximize2, Minus as MinusIcon } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import LinkExt from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useAuth } from '@/contexts/AuthContext'
import { useClassStore } from '@/store/classStore'
import type { Notice, NoticeTarget, NoticePriority } from '@/store/noticeStore'

const COMPOSE_BG = 'var(--bg-primary, #1a1a2e)'

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

function ToolbarBtn({ active, onClick, disabled, children, title }: { active?: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} disabled={disabled} title={title}
      className={`p-1.5 rounded hover:bg-[var(--bg-secondary)] transition-colors ${active ? 'text-[var(--brand)] bg-[var(--brand)]/10' : 'text-[var(--text-muted)]'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  )
}

function ToolbarSep() {
  return <div className="w-px h-4 bg-[var(--border)] mx-1" />
}

export function NoticeModal({ item, categories, onSave, onClose, bn }: Props) {
  const { user } = useAuth()
  const institution = useClassStore((s) => s.institution)
  const [title, setTitle] = useState(item?.title || '')
  const [titleBn, setTitleBn] = useState(item?.titleBn || '')
  const [content, setContent] = useState(item?.content || '')
  const [contentBn, setContentBn] = useState(item?.contentBn || '')
  const [target, setTarget] = useState<NoticeTarget>(item?.target || 'all')
  const [priority, setPriority] = useState<NoticePriority>(item?.priority || 'medium')
  const [category, setCategory] = useState(item?.category || 'General')
  const [expiresAt, setExpiresAt] = useState(item?.expiresAt || '')
  const [storage, setStorage] = useState(item?.storage || '')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      UnderlineExt,
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      LinkExt.configure({ openOnClick: false }),
      ImageExt,
      Placeholder.configure({ placeholder: bn ? 'নোটিশের বিষয়বস্তু লিখুন...' : 'Write notice content...' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: item?.content || '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-[200px] outline-none text-[0.8125rem] text-[var(--text-primary)] leading-relaxed',
        style: `background: ${COMPOSE_BG}; white-space: pre-wrap; word-break: break-word;`,
      },
    },
    onUpdate: ({ editor: e }) => setContent(e.getHTML()),
  })

  const editorBn = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      UnderlineExt,
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      LinkExt.configure({ openOnClick: false }),
      ImageExt,
      Placeholder.configure({ placeholder: bn ? 'বাংলায় নোটিশের বিষয়বস্তু লিখুন...' : 'Write notice content in Bangla...' }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: item?.contentBn || '',
    editorProps: {
      attributes: {
        class: 'w-full min-h-[200px] outline-none text-[0.8125rem] text-[var(--text-primary)] leading-relaxed',
        style: `background: ${COMPOSE_BG}; white-space: pre-wrap; word-break: break-word;`,
      },
    },
    onUpdate: ({ editor: e }) => setContentBn(e.getHTML()),
  })

  useEffect(() => {
    return () => { editor?.destroy(); editorBn?.destroy() }
  }, [editor, editorBn])

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
      storage: storage || undefined,
    })
  }

  const insertLink = () => {
    const url = prompt(bn ? 'লিংক URL দিন:' : 'Enter link URL:')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertLinkBn = () => {
    const url = prompt(bn ? 'লিংক URL দিন:' : 'Enter link URL:')
    if (url) {
      editorBn?.chain().focus().setLink({ href: url }).run()
    }
  }

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertTableBn = () => {
    editorBn?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert(bn ? 'ছবি ২ এমবির বেশি। সর্বোচ্চ সাইজ ২ এমবি।' : 'Image exceeds 2MB max size.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      editor?.chain().focus().setImage({ src: ev.target?.result as string }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const insertImageBn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert(bn ? 'ছবি ২ এমবির বেশি। সর্বোচ্চ সাইজ ২ এমবি।' : 'Image exceeds 2MB max size.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      editorBn?.chain().focus().setImage({ src: ev.target?.result as string }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert(bn ? 'লোগো ২ এমবির বেশি। সর্বোচ্চ সাইজ ২ এমবি।' : 'Logo exceeds 2MB max size.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setStorage(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const toolbarBlock = (e: typeof editor, insertLinkFn: () => void, insertTableFn: () => void, insertImageFn: (ev: React.ChangeEvent<HTMLInputElement>) => void, imgInputId: string, compact: boolean) => e && (
    <div className={`flex items-center gap-0.5 px-${compact ? '3' : '4'} py-1.5 border-t border-[var(--border)]`} style={{ background: COMPOSE_BG }}>
      <ToolbarBtn onClick={() => e.chain().focus().undo().run()} disabled={!e.can().undo()} title={bn ? 'পূর্বাবস্থায় ফেরান' : 'Undo'}>
        <Undo2 size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().redo().run()} disabled={!e.can().redo()} title={bn ? 'পুনরায়' : 'Redo'}>
        <Redo2 size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn onClick={() => e.chain().focus().toggleBold().run()} active={e.isActive('bold')} title={bn ? 'মোটা' : 'Bold'}>
        <Bold size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleItalic().run()} active={e.isActive('italic')} title={bn ? 'তির্যক' : 'Italic'}>
        <Italic size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleUnderline().run()} active={e.isActive('underline')} title={bn ? 'আন্ডারলাইন' : 'Underline'}>
        <Underline size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleCode().run()} active={e.isActive('code')} title={bn ? 'কোড' : 'Code'}>
        <Code size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 1 }).run()} active={e.isActive('heading', { level: 1 })} title={bn ? 'শিরোনাম ১' : 'Heading 1'}>
        <Heading1 size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()} active={e.isActive('heading', { level: 2 })} title={bn ? 'শিরোনাম ২' : 'Heading 2'}>
        <Heading2 size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 3 }).run()} active={e.isActive('heading', { level: 3 })} title={bn ? 'শিরোনাম ৩' : 'Heading 3'}>
        <Heading3 size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn onClick={() => e.chain().focus().setTextAlign('left').run()} active={e.isActive({ textAlign: 'left' })} title={bn ? 'বামে সাজান' : 'Align Left'}>
        <AlignLeft size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().setTextAlign('center').run()} active={e.isActive({ textAlign: 'center' })} title={bn ? 'মাঝে সাজান' : 'Align Center'}>
        <AlignCenter size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().setTextAlign('right').run()} active={e.isActive({ textAlign: 'right' })} title={bn ? 'ডানে সাজান' : 'Align Right'}>
        <AlignRight size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn onClick={() => e.chain().focus().toggleBulletList().run()} active={e.isActive('bulletList')} title={bn ? 'তালিকা' : 'Bullet List'}>
        <List size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleOrderedList().run()} active={e.isActive('orderedList')} title={bn ? 'নম্বর তালিকা' : 'Numbered List'}>
        <ListOrdered size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().toggleBlockquote().run()} active={e.isActive('blockquote')} title={bn ? 'উদ্ধৃতি' : 'Quote'}>
        <Quote size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={insertLinkFn} title={bn ? 'লিংক' : 'Insert link'}>
        <Link2 size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => document.getElementById(imgInputId)?.click()} title={bn ? 'ছবি (সর্বোচ্চ ২ এমবি)' : 'Insert image (max 2MB)'}>
        <ImageIcon size={compact ? 14 : 15} />
      </ToolbarBtn>
      <input id={imgInputId} type="file" accept="image/*" className="hidden" onChange={insertImageFn} />
      <ToolbarSep />
      <ToolbarBtn onClick={insertTableFn} title={bn ? 'টেবিল' : 'Insert Table'}>
        <TableIcon size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => e.chain().focus().setHorizontalRule().run()} title={bn ? 'সমান্তরাল রেখা' : 'Horizontal Rule'}>
        <Minus size={compact ? 14 : 15} />
      </ToolbarBtn>
    </div>
  )

  const contentBlock = (label: string, editorInstance: typeof editor, insertLinkFn: () => void, insertTableFn: () => void, insertImageFn: (ev: React.ChangeEvent<HTMLInputElement>) => void, imgInputId: string, placeholder: string) => (
    <div>
      <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: COMPOSE_BG }}>
        {editorInstance && (
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-t border-[var(--border)]" style={{ background: COMPOSE_BG }}>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().undo().run()} disabled={!editorInstance.can().undo()} title={bn ? 'পূর্বাবস্থায় ফেরান' : 'Undo'}>
              <Undo2 size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().redo().run()} disabled={!editorInstance.can().redo()} title={bn ? 'পুনরায়' : 'Redo'}>
              <Redo2 size={14} />
            </ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleBold().run()} active={editorInstance.isActive('bold')} title={bn ? 'মোটা' : 'Bold'}>
              <Bold size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleItalic().run()} active={editorInstance.isActive('italic')} title={bn ? 'তির্যক' : 'Italic'}>
              <Italic size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleUnderline().run()} active={editorInstance.isActive('underline')} title={bn ? 'আন্ডারলাইন' : 'Underline'}>
              <Underline size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleCode().run()} active={editorInstance.isActive('code')} title={bn ? 'কোড' : 'Code'}>
              <Code size={14} />
            </ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleHeading({ level: 1 }).run()} active={editorInstance.isActive('heading', { level: 1 })} title={bn ? 'শিরোনাম ১' : 'Heading 1'}>
              <Heading1 size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleHeading({ level: 2 }).run()} active={editorInstance.isActive('heading', { level: 2 })} title={bn ? 'শিরোনাম ২' : 'Heading 2'}>
              <Heading2 size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleHeading({ level: 3 }).run()} active={editorInstance.isActive('heading', { level: 3 })} title={bn ? 'শিরোনাম ৩' : 'Heading 3'}>
              <Heading3 size={14} />
            </ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn onClick={() => editorInstance.chain().focus().setTextAlign('left').run()} active={editorInstance.isActive({ textAlign: 'left' })} title={bn ? 'বামে সাজান' : 'Align Left'}>
              <AlignLeft size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().setTextAlign('center').run()} active={editorInstance.isActive({ textAlign: 'center' })} title={bn ? 'মাঝে সাজান' : 'Align Center'}>
              <AlignCenter size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().setTextAlign('right').run()} active={editorInstance.isActive({ textAlign: 'right' })} title={bn ? 'ডানে সাজান' : 'Align Right'}>
              <AlignRight size={14} />
            </ToolbarBtn>
            <ToolbarSep />
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleBulletList().run()} active={editorInstance.isActive('bulletList')} title={bn ? 'তালিকা' : 'Bullet List'}>
              <List size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleOrderedList().run()} active={editorInstance.isActive('orderedList')} title={bn ? 'নম্বর তালিকা' : 'Numbered List'}>
              <ListOrdered size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().toggleBlockquote().run()} active={editorInstance.isActive('blockquote')} title={bn ? 'উদ্ধৃতি' : 'Quote'}>
              <Quote size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={insertLinkFn} title={bn ? 'লিংক' : 'Insert link'}>
              <Link2 size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => document.getElementById(imgInputId)?.click()} title={bn ? 'ছবি (সর্বোচ্চ ২ এমবি)' : 'Insert image (max 2MB)'}>
              <ImageIcon size={14} />
            </ToolbarBtn>
            <input id={imgInputId} type="file" accept="image/*" className="hidden" onChange={insertImageFn} />
            <ToolbarSep />
            <ToolbarBtn onClick={insertTableFn} title={bn ? 'টেবিল' : 'Insert Table'}>
              <TableIcon size={14} />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editorInstance.chain().focus().setHorizontalRule().run()} title={bn ? 'সমান্তরাল রেখা' : 'Horizontal Rule'}>
              <Minus size={14} />
            </ToolbarBtn>
          </div>
        )}
        <EditorContent editor={editorInstance} className="[&_.tiptap]:min-h-[200px] [&_.tiptap]:p-3 [&_.tiptap]:outline-none [&_.tiptap_table]:border-collapse [&_.tiptap_table]:w-full [&_.tiptap_td]:border [&_.tiptap_td]:border-[var(--border)] [&_.tiptap_td]:p-2 [&_.tiptap_th]:border [&_.tiptap_th]:border-[var(--border)] [&_.tiptap_th]:p-2 [&_.tiptap_th]:bg-[var(--bg-secondary)] [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[var(--brand)] [&_.tiptap_blockquote]:pl-3 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:text-[var(--text-muted)] [&_.tiptap_code]:bg-[var(--bg-secondary)] [&_.tiptap_code]:px-1.5 [&_.tiptap_code]:py-0.5 [&_.tiptap_code]:rounded [&_.tiptap_code]:text-[var(--brand)] [&_.tiptap_hr]:border-[var(--border)] [&_.tiptap_h1]:text-xl [&_.tiptap_h1]:font-bold [&_.tiptap_h2]:text-lg [&_.tiptap_h2]:font-bold [&_.tiptap_h3]:text-base [&_.tiptap_h3]:font-bold" />
      </div>
    </div>
  )

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden" style={isFullscreen ? { height: '100%' } : { maxHeight: 'calc(85vh - 2.5rem)' }}>
      <div className="p-4 space-y-3 overflow-auto flex-1" style={{ background: COMPOSE_BG }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'শিরোনাম (ইংরেজি)*' : 'Title (English)*'}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" style={{ background: COMPOSE_BG }} required />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'শিরোনাম (বাংলা)' : 'Title (Bangla)'}</label>
            <input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" style={{ background: COMPOSE_BG }} placeholder={bn ? 'বাংলায় শিরোনাম' : 'Title in Bangla'} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'ক্যাটাগরি' : 'Category'}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer" style={{ background: COMPOSE_BG }}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'মূল্যায়ন' : 'Target'}</label>
            <select value={target} onChange={(e) => setTarget(e.target.value as NoticeTarget)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer" style={{ background: COMPOSE_BG }}>
              {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'অগ্রাধিকার' : 'Priority'}</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as NoticePriority)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer" style={{ background: COMPOSE_BG }}>
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'মেয়াদ শেষ' : 'Expires At'}</label>
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" style={{ background: COMPOSE_BG }} />
        </div>

        <div className="flex items-center gap-3">
          {storage && (
            <div className="relative">
              <img src={storage} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-[var(--border)]" />
              <button type="button" onClick={() => setStorage('')} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--red)] text-white flex items-center justify-center">
                <X size={10} />
              </button>
            </div>
          )}
          <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.6875rem] font-medium border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors">
            <ImageIcon size={13} />
            {storage ? (bn ? 'লোগো পরিবর্তন' : 'Change Logo') : (bn ? 'লোগো যোগ করুন' : 'Add Logo')}
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>

        {contentBlock(
          bn ? 'বিষয়বস্তু (ইংরেজি)*' : 'Content (English)*',
          editor,
          insertLink,
          insertTable,
          insertImage,
          'notice-img-en',
          bn ? 'নোটিশের বিষয়বস্তু লিখুন...' : 'Write notice content...'
        )}

        {contentBlock(
          bn ? 'বিষয়বস্তু (বাংলা)' : 'Content (Bangla)',
          editorBn,
          insertLinkBn,
          insertTableBn,
          insertImageBn,
          'notice-img-bn',
          bn ? 'বাংলায় নোটিশের বিষয়বস্তু লিখুন...' : 'Write notice content in Bangla...'
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]" style={{ background: COMPOSE_BG }}>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
          {bn ? 'বাতিল' : 'Cancel'}
        </button>
        <button type="submit" className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[0.875rem] font-medium text-white bg-[var(--brand)] hover:opacity-90 transition-opacity">
          <Megaphone size={14} />
          {item ? (bn ? 'আপডেট' : 'Update') : (bn ? 'প্রকাশ' : 'Publish')}
        </button>
      </div>
    </form>
  )

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: COMPOSE_BG }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
          <h2 className="font-medium text-[0.9375rem] text-[var(--text-primary)]">
            {item ? (bn ? 'নোটিশ সম্পাদনা' : 'Edit Notice') : (bn ? 'নতুন নোটিশ' : 'New Notice')}
          </h2>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setIsFullscreen(false)} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'ছোট করুন' : 'Minimize'}>
              <MinusIcon size={16} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'বন্ধ করুন' : 'Close'}>
              <X size={16} />
            </button>
          </div>
        </div>
        {formContent}
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-[42rem] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '85vh', background: COMPOSE_BG }}>
        <div className="flex items-center justify-between px-4 py-2.5 rounded-t-2xl" style={{ background: 'var(--brand)' }}>
          <h2 className="font-medium text-[0.875rem] text-white flex items-center gap-2">
            <Megaphone size={15} />
            {item ? (bn ? 'নোটিশ সম্পাদনা' : 'Edit Notice') : (bn ? 'নতুন নোটিশ' : 'New Notice')}
          </h2>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setIsFullscreen(true)} className="p-1.5 rounded-lg hover:bg-white/20 text-white" title={bn ? 'পূর্ণ পর্দা' : 'Fullscreen'}>
              <Maximize2 size={14} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white" title={bn ? 'বন্ধ করুন' : 'Close'}>
              <X size={14} />
            </button>
          </div>
        </div>
        {formContent}
      </div>
    </div>,
    document.body
  )
}
