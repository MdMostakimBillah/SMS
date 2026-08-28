import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Mail, Inbox, Send, Plus, Search, Trash2, ArrowLeft, X, RotateCcw, Clock, CheckCircle2, AlertCircle, Minus, Maximize2, Paperclip, Link2, Smile, Image, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote, Undo2, Redo2, ChevronDown } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useMessageStore, type Message, type MessageRecipient, messageId, type MessageStatus } from '@/store/messageStore'
import { useAuth } from '@/contexts/AuthContext'
import { useTabSlider } from '@/hooks/useTabSlider'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

const inputCls = 'px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'

const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'All Users', labelBn: 'সকল ব্যবহারকারী' },
  { value: 'students', label: 'Students', labelBn: 'শিক্ষার্থী' },
  { value: 'teachers', label: 'Teachers', labelBn: 'শিক্ষক' },
  { value: 'parents', label: 'Parents', labelBn: 'অভিভাবক' },
]

export default function MessagesPage() {
  const bn = useBn()
  const { isMobile } = useWindowSize()
  const { user } = useAuth()
  const messages = useMessageStore((s) => s.messages)
  const markRead = useMessageStore((s) => s.markRead)
  const deleteMessage = useMessageStore((s) => s.deleteMessage)
  const resendMessage = useMessageStore((s) => s.resendMessage)

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'outgoing'>('inbox')
  const [search, setSearch] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [viewMessage, setViewMessage] = useState<Message | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resendConfirm, setResendConfirm] = useState<string | null>(null)

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
  const tabs = [
    { key: 'inbox', label: bn ? 'ইনবক্স' : 'Inbox', icon: Inbox, count: unreadCount },
    { key: 'sent', label: bn ? 'পাঠানো' : 'Sent', icon: Send, count: 0 },
    { key: 'outgoing', label: bn ? 'বহিঃগামী' : 'Outgoing', icon: Clock, count: outgoingMessages.length },
  ]

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
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white transition-colors"
          style={{ background: 'var(--brand)' }}
        >
          <Plus size={16} />
          {bn ? 'নতুন বার্তা' : 'Compose'}
        </button>
      </div>

      {/* Tabs */}
      <div className="relative mb-4">
        <div ref={sliderRef} className="absolute bottom-0 h-[2px] bg-[var(--brand)] transition-all duration-200 rounded-full" style={{ zIndex: 1 }} />
        <div className="flex gap-1 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => { if (el) tabRefs.current.set(tab.key, el) }}
              onClick={() => setActiveTab(tab.key as 'inbox' | 'sent' | 'outgoing')}
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
        <div className="space-y-1">
          {currentList.map((msg) => (
            <div
              key={msg.id}
              onClick={() => setViewMessage(msg)}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                msg.read
                  ? 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--brand)]'
                  : 'border-[var(--brand)] bg-[var(--brand)]05 hover:border-[var(--brand)]'
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
                  {activeTab === 'outgoing' && (
                    <StatusBadge status={msg.status} bn={bn} />
                  )}
                  <span className="text-[0.625rem] text-[var(--text-muted)] ml-auto shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">{msg.subject}</p>
                <p className="text-[0.75rem] text-[var(--text-muted)] truncate mt-0.5">{msg.body}</p>
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
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(msg.id) }}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                >
                  <Trash2 size={14} />
                </button>
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
        <p className="text-[0.875rem] text-[var(--text-primary)] whitespace-pre-line leading-relaxed">
          {message.body}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[0.6875rem] text-[var(--text-muted)]">
        <span>{bn ? 'প্রাপক' : 'To'}: {message.recipientName}</span>
      </div>
    </div>
  )
}

function ComposeModal({ onSave, onClose, bn }: { onSave: (data: { recipientId: MessageRecipient; recipientName: string; subject: string; body: string }) => void; onClose: () => void; bn: boolean }) {
  const [recipientId, setRecipientId] = useState<MessageRecipient>('all')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedRecipient = RECIPIENT_OPTIONS.find((o) => o.value === recipientId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    onSave({
      recipientId,
      recipientName: bn ? selectedRecipient?.labelBn || 'All' : selectedRecipient?.label || 'All',
      subject: subject.trim(),
      body: body.trim(),
    })
  }

  const handleFormatting = (action: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = body.substring(start, end)
    let wrapped = ''
    switch (action) {
      case 'bold': wrapped = `**${selected || 'text'}**`; break
      case 'italic': wrapped = `_${selected || 'text'}_`; break
      case 'underline': wrapped = `__${selected || 'text'}__`; break
      default: return
    }
    setBody(body.substring(0, start) + wrapped + body.substring(end))
  }

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg-card)' }}>
        {/* Fullscreen Header */}
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
          {/* To */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
            <span className="text-[0.8125rem] text-[var(--text-muted)] shrink-0">{bn ? 'প্রাপক' : 'To'}</span>
            <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="flex-1 border-none outline-none text-[0.875rem] text-[var(--text-primary)] cursor-pointer appearance-none" style={{ background: 'var(--bg-card)' }}>
              {RECIPIENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
            </select>
            <button type="button" onClick={() => setShowCcBcc(!showCcBcc)} className="text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0">
              Cc Bcc
            </button>
          </div>

          {/* Subject */}
          <div className="px-4 py-2.5 border-b border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={bn ? 'বিষয়' : 'Subject'}
              className="w-full border-none outline-none text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-card)' }}
              required
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto px-4 py-3" style={{ background: 'var(--bg-card)' }}>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={bn ? 'বার্তা লিখুন...' : 'Write your message...'}
              className="w-full h-full min-h-[300px] border-none outline-none text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none leading-relaxed"
              style={{ background: 'var(--bg-card)' }}
              required
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-0.5 px-4 py-1.5 border-t border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
            <button type="button" onClick={() => {}} className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Undo2 size={15} /></button>
            <button type="button" onClick={() => {}} className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Redo2 size={15} /></button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <button type="button" className="flex items-center gap-0.5 px-2 py-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[0.75rem]">
              Sans Serif <ChevronDown size={12} />
            </button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <button type="button" onClick={() => handleFormatting('bold')} className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Bold size={15} /></button>
            <button type="button" onClick={() => handleFormatting('italic')} className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Italic size={15} /></button>
            <button type="button" onClick={() => handleFormatting('underline')} className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><UnderlineIcon size={15} /></button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <button type="button" className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><AlignLeft size={15} /></button>
            <button type="button" className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><AlignCenter size={15} /></button>
            <button type="button" className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><AlignRight size={15} /></button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <button type="button" className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><List size={15} /></button>
            <button type="button" className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><ListOrdered size={15} /></button>
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <button type="button" className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Quote size={15} /></button>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-1">
              <button type="submit" className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[0.875rem] font-medium text-white bg-[var(--brand)] hover:opacity-90 transition-opacity">
                <Send size={14} />
                {bn ? 'পাঠান' : 'Send'}
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button type="button" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'সংযুক্তি' : 'Attach'}>
                <Paperclip size={16} />
              </button>
              <button type="button" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'লিংক' : 'Link'}>
                <Link2 size={16} />
              </button>
              <button type="button" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'ইমোজি' : 'Emoji'}>
                <Smile size={16} />
              </button>
              <button type="button" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'ছবি' : 'Photo'}>
                <Image size={16} />
              </button>
            </div>
          </div>
        </form>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-[36rem] rounded-t-2xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '85vh', background: 'var(--bg-card)' }}>
        {/* Header */}
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
          {/* To */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
            <span className="text-[0.8125rem] text-[var(--text-muted)] shrink-0">{bn ? 'প্রাপক' : 'To'}</span>
            <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="flex-1 border-none outline-none text-[0.8125rem] text-[var(--text-primary)] cursor-pointer appearance-none" style={{ background: 'var(--bg-card)' }}>
              {RECIPIENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
            </select>
            <button type="button" onClick={() => setShowCcBcc(!showCcBcc)} className="text-[0.6875rem] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0">
              Cc Bcc
            </button>
          </div>

          {/* Subject */}
          <div className="px-4 py-2 border-b border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={bn ? 'বিষয়' : 'Subject'}
              className="w-full border-none outline-none text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-card)' }}
              required
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto px-4 py-3 min-h-[200px]" style={{ background: 'var(--bg-card)' }}>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={bn ? 'বার্তা লিখুন...' : 'Write your message...'}
              className="w-full h-full min-h-[180px] border-none outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none leading-relaxed"
              style={{ background: 'var(--bg-card)' }}
              required
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-t border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
            <button type="button" onClick={() => {}} className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Undo2 size={14} /></button>
            <button type="button" onClick={() => {}} className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Redo2 size={14} /></button>
            <div className="w-px h-3.5 bg-[var(--border)] mx-0.5" />
            <button type="button" className="flex items-center gap-0.5 px-1.5 py-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[0.6875rem]">
              Sans Serif <ChevronDown size={10} />
            </button>
            <div className="w-px h-3.5 bg-[var(--border)] mx-0.5" />
            <button type="button" onClick={() => handleFormatting('bold')} className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Bold size={14} /></button>
            <button type="button" onClick={() => handleFormatting('italic')} className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Italic size={14} /></button>
            <button type="button" onClick={() => handleFormatting('underline')} className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><UnderlineIcon size={14} /></button>
            <div className="w-px h-3.5 bg-[var(--border)] mx-0.5" />
            <button type="button" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><AlignLeft size={14} /></button>
            <button type="button" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><AlignRight size={14} /></button>
            <div className="w-px h-3.5 bg-[var(--border)] mx-0.5" />
            <button type="button" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><List size={14} /></button>
            <button type="button" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><ListOrdered size={14} /></button>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--border)] rounded-b-2xl" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-1">
              <button type="submit" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[0.8125rem] font-medium text-white bg-[var(--brand)] hover:opacity-90 transition-opacity">
                <Send size={13} />
                {bn ? 'পাঠান' : 'Send'}
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button type="button" className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'সংযুক্তি' : 'Attach'}>
                <Paperclip size={15} />
              </button>
              <button type="button" className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'লিংক' : 'Link'}>
                <Link2 size={15} />
              </button>
              <button type="button" className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'ইমোজি' : 'Emoji'}>
                <Smile size={15} />
              </button>
              <button type="button" className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title={bn ? 'ছবি' : 'Photo'}>
                <Image size={15} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
