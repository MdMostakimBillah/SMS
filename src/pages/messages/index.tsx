import { useState, useMemo, useEffect, useRef } from 'react'
import { Mail, Inbox, Send, Plus, Search, Trash2, ArrowLeft, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useMessageStore, type Message, type MessageRecipient, messageId } from '@/store/messageStore'
import { useAuth } from '@/contexts/AuthContext'
import { useTabSlider } from '@/hooks/useTabSlider'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

const inputCls = 'px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'
const selectCls = inputCls + ' cursor-pointer appearance-none pr-7 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")]'
const textareaCls = inputCls + ' resize-none'

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

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')
  const [search, setSearch] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [viewMessage, setViewMessage] = useState<Message | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const unreadCount = useMemo(() => messages.filter((m) => m.senderId !== 'me' && !m.read).length, [messages])

  const currentList = activeTab === 'inbox' ? inboxMessages : sentMessages
  const tabs = [
    { key: 'inbox', label: bn ? 'ইনবক্স' : 'Inbox', icon: Inbox, count: unreadCount },
    { key: 'sent', label: bn ? 'পাঠানো' : 'Sent', icon: Send, count: 0 },
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
              onClick={() => setActiveTab(tab.key as 'inbox' | 'sent')}
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
              activeTab === 'inbox' ? (bn ? 'ইনবক্স খালি' : 'Inbox is empty') : (bn ? 'কোনো বার্তা পাঠানো হয়নি' : 'No sent messages')}
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
                  <span className="text-[0.625rem] text-[var(--text-muted)] ml-auto shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <p className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">{msg.subject}</p>
                <p className="text-[0.75rem] text-[var(--text-muted)] truncate mt-0.5">{msg.body}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(msg.id) }}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] shrink-0"
              >
                <Trash2 size={14} />
              </button>
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
          userName={user?.name || 'Admin'}
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
    </div>
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

function ComposeModal({ onSave, onClose, bn, userName }: { onSave: (data: { recipientId: MessageRecipient; recipientName: string; subject: string; body: string }) => void; onClose: () => void; bn: boolean; userName: string }) {
  const [recipientId, setRecipientId] = useState<MessageRecipient>('all')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[1rem] text-[var(--text-primary)]">
            {bn ? 'নতুন বার্তা' : 'New Message'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-[0.75rem] text-[var(--text-muted)]">
            <span>{bn ? 'প্রেরক' : 'From'}:</span>
            <span className="font-medium text-[var(--text-primary)]">{userName}</span>
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'প্রাপক' : 'To'} *</label>
            <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className={selectCls + ' w-full'}>
              {RECIPIENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'বিষয়' : 'Subject'} *</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls + ' w-full'} required />
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'বার্তা' : 'Message'} *</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className={textareaCls + ' w-full'} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white" style={{ background: 'var(--brand)' }}>
              <Send size={14} />
              {bn ? 'পাঠান' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
