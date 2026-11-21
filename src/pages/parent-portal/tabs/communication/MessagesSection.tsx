import React from 'react'
import { Send, MessageSquare, CheckCircle2 } from 'lucide-react'

export interface ParentMessage {
  id: string
  subject: string
  body: string
  recipient: string
  date: string
  status: 'sent' | 'replied'
  reply?: string
}

interface TeacherOption {
  name: string
  roleEn: string
  roleBn: string
}

interface MessagesSectionProps {
  messages: ParentMessage[]
  teachers: TeacherOption[]
  msgSubject: string
  setMsgSubject: (val: string) => void
  msgBody: string
  setMsgBody: (val: string) => void
  msgRecipient: string
  setMsgRecipient: (val: string) => void
  onSendMessage: (e: React.FormEvent) => void
  isBn: boolean
}

export const MessagesSection = React.memo(function MessagesSection({
  messages,
  teachers,
  msgSubject,
  setMsgSubject,
  msgBody,
  setMsgBody,
  msgRecipient,
  setMsgRecipient,
  onSendMessage,
  isBn,
}: MessagesSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Compose form */}
      <div className="lg:col-span-2 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-[var(--brand)]" />
          <span>{isBn ? 'শিক্ষককে বার্তা লিখুন' : 'Write to Teacher'}</span>
        </h3>

        <form onSubmit={onSendMessage} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'প্রাপক শিক্ষক' : 'Recipient'}
            </label>
            <select
              value={msgRecipient}
              onChange={(e) => setMsgRecipient(e.target.value)}
              className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 focus:ring-1 focus:ring-[var(--brand)] outline-none"
            >
              {teachers.map((t, i) => (
                <option key={i} value={t.name}>
                  {t.name} ({isBn ? t.roleBn : t.roleEn})
                </option>
              ))}
              <option value="School Administration">
                {isBn ? 'বিদ্যালয় প্রশাসন' : 'School Administration'}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'বিষয় / শিরোনাম' : 'Subject'}
            </label>
            <input
              type="text"
              required
              placeholder={isBn ? 'বার্তার বিষয় লিখুন...' : 'Enter message subject...'}
              value={msgSubject}
              onChange={(e) => setMsgSubject(e.target.value)}
              className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 focus:ring-1 focus:ring-[var(--brand)] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              {isBn ? 'বার্তার বিবরণ' : 'Message Details'}
            </label>
            <textarea
              required
              rows={4}
              placeholder={isBn ? 'আপনার বার্তা বা জিজ্ঞাসা বিস্তারিত লিখুন...' : 'Write your detailed inquiry or message...'}
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 focus:ring-1 focus:ring-[var(--brand)] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg bg-[var(--brand)] hover:opacity-90 text-white font-semibold text-xs shadow-xs transition-opacity flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isBn ? 'বার্তা প্রেরণ করুন' : 'Send Message'}</span>
          </button>
        </form>
      </div>

      {/* Right Message History */}
      <div className="lg:col-span-3 space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          {isBn ? 'বার্তার ইতিহাস ও উত্তর' : 'Message History & Replies'}
        </h3>

        {messages.length === 0 ? (
          <div className="text-center py-10 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <MessageSquare className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-secondary)]">
              {isBn ? 'এখনও কোনো বার্তা পাঠানো হয়নি' : 'No messages sent yet'}
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] space-y-2.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">{m.subject}</h4>
                  <p className="text-[0.6875rem] text-[var(--text-secondary)]">
                    {isBn ? 'প্রাপক: ' : 'To: '}{m.recipient} • {m.date}
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[0.625rem] font-bold rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                  {m.status === 'replied' ? (isBn ? 'উত্তর প্রাপ্ত' : 'Replied') : isBn ? 'পাঠানো হয়েছে' : 'Sent'}
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2.5 rounded-lg border border-[var(--border)]">
                {m.body}
              </p>

              {m.reply && (
                <div className="p-2.5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] text-xs">
                  <div className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand)]" />
                    <span>{isBn ? 'শিক্ষকের জবাব:' : "Teacher's Reply:"}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{m.reply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
})
