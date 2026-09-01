import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Mail, Inbox, Send, Plus, Search, Trash2, ArrowLeft, X, RotateCcw, Clock, CheckCircle2, AlertCircle, Minus, Maximize2, Paperclip, Link2, Smile, Image, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote, Undo2, Redo2, FileText, Smartphone } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExt from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useMessageStore, type Message, type MessageRecipient, messageId, type MessageStatus } from '@/store/messageStore'
import { useMessageTemplateStore } from '@/store/messageTemplateStore'
import { useAuth } from '@/contexts/AuthContext'
import { useTabSlider } from '@/hooks/useTabSlider'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { useSessionStudents } from '@/store/admissionStore'
import { usePermission } from '@/hooks/usePermission'
import { TemplatesTab } from './tabs/TemplatesTab'

const inputCls = 'px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'

const COMPOSE_BG = 'var(--bg-primary, #1a1a2e)'

export default function MessagesPage() {
  const bn = useBn()
  const { isMobile } = useWindowSize()
  const { user } = useAuth()
  const messages = useMessageStore((s) => s.messages)
  const markRead = useMessageStore((s) => s.markRead)
  const deleteMessage = useMessageStore((s) => s.deleteMessage)
  const resendMessage = useMessageStore((s) => s.resendMessage)

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'outgoing' | 'templates'>('inbox')
  const [search, setSearch] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [viewMessage, setViewMessage] = useState<Message | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resendConfirm, setResendConfirm] = useState<string | null>(null)
  const { canRead, canCreate, canDelete } = usePermission()

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const inboxMessages = useMemo(() => {
    let list = messages.filter((m) => m.senderId !== 'me')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((m) => m.subject.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q) || m.body.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [messages, search])

  const sentMessages = useMemo(() => {
    let list = messages.filter((m) => m.senderId === 'me')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((m) => m.subject.toLowerCase().includes(q) || m.recipientName.toLowerCase().includes(q) || m.body.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [messages, search])

  const outgoingMessages = useMemo(() => {
    let list = messages.filter((m) => m.senderId === 'me' && m.status !== 'delivered')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((m) => m.subject.toLowerCase().includes(q) || m.recipientName.toLowerCase().includes(q) || m.body.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [messages, search])

  const unreadCount = useMemo(() => messages.filter((m) => m.senderId !== 'me' && !m.read).length, [messages])

  const currentList = activeTab === 'inbox' ? inboxMessages : activeTab === 'sent' ? sentMessages : outgoingMessages
  const allTabs = [
    { key: 'inbox', label: bn ? 'ইনবক্স' : 'Inbox', icon: Inbox, count: unreadCount },
    { key: 'sent', label: bn ? 'পাঠানো' : 'Sent', icon: Send, count: 0 },
    { key: 'outgoing', label: bn ? 'বহিঃগামী' : 'Outgoing', icon: Clock, count: outgoingMessages.length },
    { key: 'templates', label: bn ? 'টেমপ্লেট' : 'Templates', icon: FileText, count: 0 },
  ]
  const tabs = allTabs.filter((t) => canRead('messages', t.key))

  const handleSend = (data: { recipientId: MessageRecipient; recipientName: string; subject: string; body: string }) => {
    const msg: Message = {
      id: messageId(),
      senderId: 'me',
      senderName: user?.name || 'Admin',
      senderNameBn: user?.name || 'Admin',
      senderRole: user?.role || 'admin',
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      subject: data.subject,
      body: data.body,
      read: false,
      status: 'sent',
      createdAt: new Date().toISOString(),
    }
    useMessageStore.getState().addMessage(msg)
    setShowCompose(false)
  }

  if (viewMessage) {
    return (
      <MessageDetail
        message={viewMessage}
        onBack={() => { setViewMessage(null); if (!viewMessage.read) markRead(viewMessage.id) }}
        onReply={() => { setViewMessage(null); setShowCompose(true) }}
        onDelete={(id) => { deleteMessage(id); setViewMessage(null) }}
        bn={bn}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
            {bn ? 'বার্তা' : 'Messages'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5">
            {bn ? `মোট: ${messages.length}টি বার্তা` : `Total: ${messages.length} messages`}
            {unreadCount > 0 && ` · ${unreadCount} ${bn ? 'টি নতুন' : 'unread'}`}
          </p>
        </div>
        {canCreate('messages') && (
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white transition-colors"
            style={{ background: 'var(--brand)' }}
          >
            <Plus size={16} />
            {bn ? 'নতুন বার্তা' : 'Compose'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="relative mb-4">
        <div ref={sliderRef} className="absolute bottom-0 h-[2px] bg-[var(--brand)] transition-all duration-200 rounded-full" style={{ zIndex: 1 }} />
        <div className="flex gap-1 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => { if (el) tabRefs.current.set(tab.key, el) }}
              onClick={() => setActiveTab(tab.key as 'inbox' | 'sent' | 'outgoing' | 'templates')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors relative ${
                activeTab === tab.key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0 rounded-full text-[0.625rem] font-bold text-white" style={{ background: 'var(--brand)' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Tab Content */}
      {activeTab === 'templates' ? (
        <TemplatesTab />
      ) : (
        <>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={bn ? 'বার্তা খুঁজুন...' : 'Search messages...'}
          className={inputCls + ' w-full pl-9'}
        />
      </div>

      {/* Message List */}
      {currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <Mail size={48} className="mb-3 opacity-30" />
          <p className="text-[0.9375rem]">
            {search ? (bn ? 'কোনো বার্তা পাওয়া যায়নি' : 'No messages found') :
              activeTab === 'inbox' ? (bn ? 'ইনবক্স খালি' : 'Inbox is empty') :
              activeTab === 'outgoing' ? (bn ? 'কোনো বহিঃগামী বার্তা নেই' : 'No outgoing messages') :
              (bn ? 'কোনো বার্তা পাঠানো হয়নি' : 'No sent messages')}
          </p>
          {!search && activeTab === 'inbox' && (
            <p className="text-[0.75rem] mt-1">{bn ? 'নতুন বার্তা এখানে দেখা যাবে' : 'New messages will appear here'}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {currentList.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setViewMessage(msg)}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                msg.read
                  ? 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]'
                  : 'border-[var(--brand)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]'
              }`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[0.75rem] font-bold text-white shrink-0" style={{ background: 'var(--brand)' }}>
                {(activeTab === 'inbox' ? msg.senderName : msg.recipientName).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[0.8125rem] ${!msg.read ? 'font-semibold' : 'font-medium'} text-[var(--text-primary)] truncate`}>
                    {activeTab === 'inbox' ? msg.senderName : msg.recipientName}
                  </span>
                  {!msg.read && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--brand)' }} />}
                  {msg.isSMS && (
                    <span className="inline-flex items-center gap-0.5 text-[0.5625rem] font-medium px-1 py-px rounded-full bg-[var(--teal)]/10 text-[var(--teal)]">
                      <Smartphone size={9} />
                      SMS
                    </span>
                  )}
                  {activeTab === 'outgoing' && (
                    <StatusBadge status={msg.status} bn={bn} />
                  )}
                  <span className="text-[0.625rem] text-[var(--text-muted)] ml-auto shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">{msg.subject}</p>
                <p className="text-[0.75rem] text-[var(--text-muted)] truncate mt-0.5">{msg.body.replace(/<[^>]*>/g, '')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {activeTab === 'outgoing' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setResendConfirm(msg.id) }}
                    className="p-1.5 rounded-lg hover:bg-[var(--brand)]10 text-[var(--brand)] transition-colors"
                    title={bn ? 'পুনঃপাঠান' : 'Resend'}
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                {canDelete('messages') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(msg.id) }}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          onSave={handleSend}
          onClose={() => setShowCompose(false)}
          bn={bn}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          onConfirm={() => { deleteMessage(deleteTarget); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
          title={bn ? 'বার্তা মুছুন' : 'Delete Message'}
          message={bn ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'}
          isBn={bn}
        />
      )}

      {resendConfirm && (
        <DeleteConfirmDialog
          onConfirm={() => { resendMessage(resendConfirm); setResendConfirm(null) }}
          onCancel={() => setResendConfirm(null)}
          title={bn ? 'বার্তা পুনঃপাঠান' : 'Resend Message'}
          message={bn ? 'আপনি কি এই বার্তাটি পুনঃপাঠাতে চান?' : 'Are you sure you want to resend this message?'}
          isBn={bn}
        />
      )}
        </>
      )}
    </div>
  )
}

function StatusBadge({ status, bn }: { status: MessageStatus; bn: boolean }) {
  const config: Record<MessageStatus, { icon: typeof Clock; color: string; bg: string; label: string; labelBn: string }> = {
    sent: { icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green)', label: 'Sent', labelBn: 'পাঠানো' },
    queued: { icon: Clock, color: 'var(--orange)', bg: 'var(--orange)', label: 'Queued', labelBn: 'সারিবদ্ধ' },
    failed: { icon: AlertCircle, color: 'var(--red)', bg: 'var(--red)', label: 'Failed', labelBn: 'ব্যর্থ' },
    delivered: { icon: CheckCircle2, color: 'var(--text-muted)', bg: 'var(--text-muted)', label: 'Delivered', labelBn: 'পৌঁছেছে' },
  }
  const c = config[status] || config.sent
  return (
    <span className="inline-flex items-center gap-0.5 text-[0.5625rem] font-medium px-1 py-px rounded-full" style={{ color: c.color, background: `${c.color}15` }}>
      <c.icon size={10} />
      {bn ? c.labelBn : c.label}
    </span>
  )
}

function MessageDetail({ message, onBack, onReply, onDelete, bn }: { message: Message; onBack: () => void; onReply: (m: Message) => void; onDelete: (id: string) => void; bn: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-[1rem] text-[var(--text-primary)]">{message.subject}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.625rem] font-bold text-white" style={{ background: 'var(--brand)' }}>
              {message.senderName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[0.75rem] font-medium text-[var(--text-primary)]">{message.senderName}</span>
              <span className="text-[0.625rem] text-[var(--text-muted)] ml-2">
                {new Date(message.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onReply(message)}
            className="px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            {bn ? 'উত্তর' : 'Reply'}
          </button>
          <button
            onClick={() => onDelete(message.id)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--red)]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="msg-content text-[0.875rem] text-[var(--text-primary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: message.body }} />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[0.6875rem] text-[var(--text-muted)]">
        <span>{bn ? 'প্রাপক' : 'To'}: {message.recipientName}</span>
      </div>
    </div>
  )
}

function RecipientField({ recipientId, recipientName, recipientSearch, showDrop, groups, filteredStudents, bn, onSelect, onSearch, onToggleDrop, dropRef }: {
  recipientId: string; recipientName: string; recipientSearch: string; showDrop: boolean
  groups: { value: string; label: string; labelBn: string }[]; filteredStudents: { id: string; nameEn: string; nameBn: string; class: string; roll: string }[]
  bn: boolean; onSelect: (id: string, name: string) => void; onSearch: (v: string) => void; onToggleDrop: () => void; dropRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="flex items-center gap-2 flex-1 relative" ref={dropRef}>
      <span className="text-[0.8125rem] text-[var(--text-muted)] shrink-0">{bn ? 'প্রাপক' : 'To'}</span>
      <button type="button" onClick={onToggleDrop} className="flex-1 text-left border-none outline-none text-[0.8125rem] text-[var(--text-primary)] cursor-pointer bg-transparent truncate">
        {recipientName}
      </button>
      {showDrop && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[var(--border)] shadow-xl z-20 max-h-[300px] overflow-auto" style={{ background: 'var(--bg-primary)' }}>
          <div className="p-2 border-b border-[var(--border)]">
            <input
              autoFocus
              value={recipientSearch}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={bn ? 'অনুসন্ধান...' : 'Search...'}
              className="w-full px-2.5 py-1.5 rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
            />
          </div>
          <div className="py-1">
            {groups.map((g) => (
              <button key={g.value} type="button" onClick={() => onSelect(g.value, bn ? g.labelBn : g.label)}
                className={`w-full text-left px-3 py-2 text-[0.75rem] hover:bg-[var(--bg-secondary)] transition-colors ${recipientId === g.value && !filteredStudents.length ? 'text-[var(--brand)] bg-[var(--brand)]/5' : 'text-[var(--text-primary)]'}`}>
                {bn ? g.labelBn : g.label}
              </button>
            ))}
            {filteredStudents.length > 0 && (
              <>
                <div className="px-3 py-1 text-[0.625rem] font-medium text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'শিক্ষার্থী' : 'Students'}</div>
                {filteredStudents.slice(0, 50).map((s) => (
                  <button key={s.id} type="button" onClick={() => onSelect(s.id, bn ? s.nameBn : s.nameEn)}
                    className={`w-full text-left px-3 py-2 text-[0.75rem] hover:bg-[var(--bg-secondary)] transition-colors ${recipientId === s.id ? 'text-[var(--brand)] bg-[var(--brand)]/5' : 'text-[var(--text-primary)]'}`}>
                    <span className="font-medium">{bn ? s.nameBn : s.nameEn}</span>
                    <span className="text-[var(--text-muted)] ml-1.5">{s.class} • {s.roll}</span>
                    <span className="text-[var(--text-muted)] ml-1 text-[0.625rem]">({s.id})</span>
                  </button>
                ))}
                {filteredStudents.length > 50 && <div className="px-3 py-1.5 text-[0.625rem] text-[var(--text-muted)] text-center">{bn ? `আরো ${filteredStudents.length - 50} জন...` : `${filteredStudents.length - 50} more...`}</div>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ComposeModal({ onSave, onClose, bn }: { onSave: (data: { recipientId: MessageRecipient; recipientName: string; subject: string; body: string }) => void; onClose: () => void; bn: boolean }) {
  const students = useSessionStudents()
  const templates = useMessageTemplateStore((s) => s.templates)
  const [recipientId, setRecipientId] = useState<MessageRecipient>('all')
  const [recipientName, setRecipientName] = useState(bn ? 'সকল ব্যবহারকারী' : 'All Users')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [showRecipientDrop, setShowRecipientDrop] = useState(false)
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [subject, setSubject] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const recipientDropRef = useRef<HTMLDivElement>(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024

  const EMOJIS = ['😀','😂','😍','🥰','😊','👍','❤️','🔥','✅','🎉','👏','🙌','💪','🙏','😢','😮','🤔','💯','⭐','🌟','✨','🚀','📌','📝','💡','🎯','🏆','📚','✏️','🎒']

  const GROUP_OPTIONS = [
    { value: 'all', label: 'All Users', labelBn: 'সকল ব্যবহারকারী' },
    { value: 'students', label: 'All Students', labelBn: 'সকল শিক্ষার্থী' },
    { value: 'teachers', label: 'All Teachers', labelBn: 'সকল শিক্ষক' },
    { value: 'parents', label: 'All Parents', labelBn: 'সকল অভিভাবক' },
  ]

  const filteredStudents = useMemo(() => {
    if (!recipientSearch) return students.filter((s) => s.active !== false)
    const q = recipientSearch.toLowerCase()
    return students.filter((s) => s.active !== false && (s.id.toLowerCase().includes(q) || s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(q) || s.class.toLowerCase().includes(q) || s.roll.includes(q)))
  }, [students, recipientSearch])

  const selectRecipient = (id: string, name: string) => {
    setRecipientId(id)
    setRecipientName(name)
    setShowRecipientDrop(false)
    setRecipientSearch('')
  }

  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplateId(tplId)
    if (!tplId) return
    const tpl = templates.find((t) => t.id === tplId)
    if (!tpl) return
    setSubject(tpl.subject)
    if (editor) {
      editor.commands.setContent(tpl.body)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      UnderlineExt,
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder: bn ? 'বার্তা লিখুন...' : 'Write your message...' }),
      LinkExt.configure({ openOnClick: false }),
      ImageExt,
    ],
    editorProps: {
      attributes: {
        class: 'w-full min-h-[180px] border-none outline-none text-[0.8125rem] text-[var(--text-primary)] leading-relaxed',
        style: `background: ${COMPOSE_BG}; white-space: pre-wrap; word-break: break-word;`,
      },
    },
  })

  useEffect(() => {
    return () => editor?.destroy()
  }, [editor])

  useEffect(() => {
    if (!showRecipientDrop) return
    const handler = (e: MouseEvent) => {
      if (recipientDropRef.current && !recipientDropRef.current.contains(e.target as Node)) {
        setShowRecipientDrop(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showRecipientDrop])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const bodyHtml = editor?.getHTML() || ''
    const bodyText = editor?.getText()?.trim() || ''
    if (!subject.trim() || !bodyText) return
    onSave({
      recipientId,
      recipientName,
      subject: subject.trim(),
      body: bodyHtml,
    })
  }

  const insertEmoji = (emoji: string) => {
    editor?.chain().focus().insertContent(emoji).run()
    setShowEmoji(false)
  }

  const insertLink = () => {
    const url = prompt(bn ? 'লিংক URL দিন:' : 'Enter link URL:')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const validFiles: File[] = []
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(bn ? `"${file.name}" ৫ এমবির বেশি। সর্বোচ্চ সাইজ ৫ এমবি।` : `"${file.name}" exceeds 5MB max size.`)
        continue
      }
      validFiles.push(file)
    }
    setAttachments((prev) => [...prev, ...validFiles])
    e.target.value = ''
  }

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      alert(bn ? 'ছবি ৫ এমবির বেশি। সর্বোচ্চ সাইজ ৫ এমবি।' : 'Image exceeds 5MB max size.')
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

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const ToolbarBtn = ({ onClick, active, disabled, children, title }: { onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title?: string }) => (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} disabled={disabled} title={title}
      className={`p-1.5 rounded hover:bg-[var(--bg-secondary)] transition-colors ${active ? 'text-[var(--brand)] bg-[var(--brand)]/10' : 'text-[var(--text-muted)]'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  )

  const ToolbarSep = () => <div className="w-px h-4 bg-[var(--border)] mx-1" />

  const toolbarBlock = (compact: boolean) => editor && (
    <div className={`flex items-center gap-0.5 px-${compact ? '3' : '4'} py-1.5 border-t border-[var(--border)]`} style={{ background: COMPOSE_BG }}>
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title={bn ? 'পূর্বাবস্থায় ফেরান' : 'Undo'}>
        <Undo2 size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title={bn ? 'পুনরায়' : 'Redo'}>
        <Redo2 size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title={bn ? 'মোটা' : 'Bold'}>
        <Bold size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title={bn ? 'তির্যক' : 'Italic'}>
        <Italic size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title={bn ? 'আন্ডারলাইন' : 'Underline'}>
        <UnderlineIcon size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title={bn ? 'বামে সাজান' : 'Align Left'}>
        <AlignLeft size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title={bn ? 'মাঝে সাজান' : 'Align Center'}>
        <AlignCenter size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title={bn ? 'ডানে সাজান' : 'Align Right'}>
        <AlignRight size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title={bn ? 'তালিকা' : 'Bullet List'}>
        <List size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title={bn ? 'নম্বর তালিকা' : 'Numbered List'}>
        <ListOrdered size={compact ? 14 : 15} />
      </ToolbarBtn>
      <ToolbarSep />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title={bn ? 'উদ্ধৃতি' : 'Quote'}>
        <Quote size={compact ? 14 : 15} />
      </ToolbarBtn>
    </div>
  )

  const actionBarBlock = (compact: boolean) => (
    <div className={`flex items-center justify-between px-${compact ? '3' : '4'} py-${compact ? '2' : '2.5'} border-t border-[var(--border)] rounded-b-2xl`} style={{ background: COMPOSE_BG }}>
      <div className="flex items-center gap-1">
        <button type="submit" className={`flex items-center gap-1.5 px-${compact ? '4' : '5'} py-${compact ? '1.5' : '2'} rounded-full text-[0.875rem] font-medium text-white bg-[var(--brand)] hover:opacity-90 transition-opacity`}>
          <Send size={compact ? 13 : 14} />
          {bn ? 'পাঠান' : 'Send'}
        </button>
      </div>
      <div className="flex items-center gap-0.5 relative">
        <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-${compact ? '1.5' : '2'} rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]`} title={bn ? 'সংযুক্তি (সর্বোচ্চ ৫ এমবি)' : 'Attach file (max 5MB)'}>
          <Paperclip size={compact ? 15 : 16} />
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertLink} className={`p-${compact ? '1.5' : '2'} rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]`} title={bn ? 'লিংক' : 'Insert link'}>
          <Link2 size={compact ? 15 : 16} />
        </button>
        <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`p-${compact ? '1.5' : '2'} rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]`} title={bn ? 'ইমোজি' : 'Emoji'}>
          <Smile size={compact ? 15 : 16} />
        </button>
        {showEmoji && (
          <div className="absolute bottom-full right-0 mb-2 p-3 rounded-xl border border-[var(--border)] shadow-xl grid grid-cols-6 gap-1.5 z-10" style={{ background: COMPOSE_BG, minWidth: '220px' }}>
            {EMOJIS.map((e) => (
              <button key={e} type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => insertEmoji(e)} className="text-xl hover:bg-[var(--bg-secondary)] rounded-lg p-1 transition-colors">{e}</button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => imageInputRef.current?.click()} className={`p-${compact ? '1.5' : '2'} rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]`} title={bn ? 'ছবি (সর্বোচ্চ ৫ এমবি)' : 'Insert photo (max 5MB)'}>
          <Image size={compact ? 15 : 16} />
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInsert} />
      </div>
    </div>
  )

  const attachmentList = attachments.length > 0 && (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-[var(--border)]" style={{ background: COMPOSE_BG }}>
      {attachments.map((file, idx) => (
        <div key={`${file.name}-${idx}`} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)]">
          <Paperclip size={11} className="text-[var(--text-muted)]" />
          <span className="max-w-[120px] truncate">{file.name}</span>
          <span className="text-[var(--text-muted)]">({formatFileSize(file.size)})</span>
          <button type="button" onClick={() => removeAttachment(idx)} className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"><X size={10} /></button>
        </div>
      ))}
    </div>
  )

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: COMPOSE_BG }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
          <h2 className="font-medium text-[0.9375rem] text-[var(--text-primary)]">
            {bn ? 'নতুন বার্তা' : 'New Message'}
          </h2>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setIsFullscreen(false)} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'ছোট করুন' : 'Minimize'}>
              <Minus size={16} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'বন্ধ করুন' : 'Close'}>
              <X size={16} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]" style={{ background: COMPOSE_BG }}>
            <RecipientField recipientId={recipientId} recipientName={recipientName} recipientSearch={recipientSearch} showDrop={showRecipientDrop} groups={GROUP_OPTIONS} filteredStudents={filteredStudents} bn={bn} onSelect={selectRecipient} onSearch={setRecipientSearch} onToggleDrop={() => setShowRecipientDrop(!showRecipientDrop)} dropRef={recipientDropRef} />
            <button type="button" onClick={() => setShowCcBcc(!showCcBcc)} className="text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0">
              Cc Bcc
            </button>
          </div>
          <div className="px-4 py-2.5 border-b border-[var(--border)]" style={{ background: COMPOSE_BG }}>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={bn ? 'বিষয়' : 'Subject'}
              className="w-full border-none outline-none text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{ background: COMPOSE_BG }}
              required
            />
          </div>
          <div className="px-4 py-1.5 border-b border-[var(--border)] flex items-center gap-2" style={{ background: COMPOSE_BG }}>
            <FileText size={13} className="text-[var(--text-muted)] shrink-0" />
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="flex-1 text-[0.75rem] border-none outline-none cursor-pointer bg-transparent text-[var(--text-primary)] truncate"
              style={{ background: COMPOSE_BG }}
            >
              <option value="">{bn ? '— টেমপ্লেট বাছাই করুন —' : '— Select a template —'}</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{bn ? tpl.nameBn : tpl.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-auto px-4 py-3" style={{ background: COMPOSE_BG }}>
            <EditorContent editor={editor} className="h-full [&_.tiptap]:min-h-[300px] [&_.tiptap]:h-full" />
          </div>
          {attachmentList}
          {toolbarBlock(false)}
          {actionBarBlock(false)}
        </form>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-[36rem] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '85vh', background: COMPOSE_BG }}>
        <div className="flex items-center justify-between px-4 py-2.5 rounded-t-2xl" style={{ background: 'var(--brand)' }}>
          <h2 className="font-medium text-[0.875rem] text-white">
            {bn ? 'নতুন বার্তা' : 'New Message'}
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
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(85vh - 2.5rem)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]" style={{ background: COMPOSE_BG }}>
            <RecipientField recipientId={recipientId} recipientName={recipientName} recipientSearch={recipientSearch} showDrop={showRecipientDrop} groups={GROUP_OPTIONS} filteredStudents={filteredStudents} bn={bn} onSelect={selectRecipient} onSearch={setRecipientSearch} onToggleDrop={() => setShowRecipientDrop(!showRecipientDrop)} dropRef={recipientDropRef} />
            <button type="button" onClick={() => setShowCcBcc(!showCcBcc)} className="text-[0.6875rem] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0">
              Cc Bcc
            </button>
          </div>
          <div className="px-4 py-2 border-b border-[var(--border)]" style={{ background: COMPOSE_BG }}>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={bn ? 'বিষয়' : 'Subject'}
              className="w-full border-none outline-none text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{ background: COMPOSE_BG }}
              required
            />
          </div>
          <div className="px-4 py-1.5 border-b border-[var(--border)] flex items-center gap-2" style={{ background: COMPOSE_BG }}>
            <FileText size={13} className="text-[var(--text-muted)] shrink-0" />
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="flex-1 text-[0.6875rem] border-none outline-none cursor-pointer bg-transparent text-[var(--text-primary)] truncate"
              style={{ background: COMPOSE_BG }}
            >
              <option value="">{bn ? '— টেমপ্লেট বাছাই করুন —' : '— Select a template —'}</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{bn ? tpl.nameBn : tpl.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-auto px-4 py-3 min-h-[200px]" style={{ background: COMPOSE_BG }}>
            <EditorContent editor={editor} className="h-full [&_.tiptap]:min-h-[180px] [&_.tiptap]:h-full" />
          </div>
          {attachmentList}
          {toolbarBlock(true)}
          {actionBarBlock(true)}
        </form>
      </div>
    </div>,
    document.body
  )
}
