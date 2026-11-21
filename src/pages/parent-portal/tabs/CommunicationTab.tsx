import React, { useState, useMemo } from 'react'
import { Bell, User, MessageSquare, CheckCircle2 } from 'lucide-react'
import type { PortalChild } from '../types'
import { useNoticeStore } from '@/store/noticeStore'
import { NoticesSection } from './communication/NoticesSection'
import { TeachersSection } from './communication/TeachersSection'
import { MessagesSection, type ParentMessage } from './communication/MessagesSection'

interface CommunicationTabProps {
  child: PortalChild
  isBn: boolean
}

const INITIAL_MESSAGES: ParentMessage[] = [
  {
    id: 'msg-1',
    subject: 'Regarding Upcoming Science Fair Project',
    body: 'Could you please confirm if the students need to bring their own presentation board tomorrow?',
    recipient: 'Md. Anwar Hossain (Class Teacher)',
    date: '2026-11-18 10:30 AM',
    status: 'replied',
    reply: 'Yes, students should bring standard 3x2 ft presentation boards. School will provide markers and adhesives.',
  },
]

export const CommunicationTab = React.memo(function CommunicationTab({
  child,
  isBn,
}: CommunicationTabProps) {
  const notices = useNoticeStore((s) => s.notices)

  const [activeSection, setActiveSection] = useState<'notices' | 'teachers' | 'messages'>('notices')
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgRecipient, setMsgRecipient] = useState(child.classTeacherName)
  const [messages, setMessages] = useState<ParentMessage[]>(INITIAL_MESSAGES)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const parentNotices = useMemo(() => {
    return notices
      .filter((n) => n && n.isActive && (n.target === 'parents' || n.target === 'all'))
      .slice(0, 10)
  }, [notices])

  const teachers = useMemo(
    () => [
      {
        name: child.classTeacherName,
        roleEn: 'Class Teacher & Mathematics',
        roleBn: 'শ্রেণি শিক্ষক ও গণিত',
        phone: child.classTeacherPhone,
        email: child.classTeacherEmail,
        isClassTeacher: true,
      },
      {
        name: 'Sabrina Yasmin',
        roleEn: 'English Language & Literature',
        roleBn: 'ইংরেজি ভাষা ও সাহিত্য',
        phone: '+880 1819-778899',
        email: 'sabrina.yasmin@edutech.edu.bd',
        isClassTeacher: false,
      },
      {
        name: 'Kazi Farhan',
        roleEn: 'General Science',
        roleBn: 'সাধারণ বিজ্ঞান',
        phone: '+880 1912-334455',
        email: 'farhan.kazi@edutech.edu.bd',
        isClassTeacher: false,
      },
      {
        name: 'Shamsul Alam',
        roleEn: 'Bangla Language & Literature',
        roleBn: 'বাংলা ভাষা ও সাহিত্য',
        phone: '+880 1713-112233',
        email: 'shamsul.alam@edutech.edu.bd',
        isClassTeacher: false,
      },
    ],
    [child]
  )

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgSubject.trim() || !msgBody.trim()) return

    const newMsg: ParentMessage = {
      id: `msg-${Date.now()}`,
      subject: msgSubject,
      body: msgBody,
      recipient: msgRecipient,
      date:
        new Date().toLocaleDateString('en-GB') +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    }

    setMessages([newMsg, ...messages])
    setMsgSubject('')
    setMsgBody('')
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 4000)
    setActiveSection('messages')
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation pills */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('notices')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSection === 'notices'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{isBn ? 'নোটিশ বোর্ড' : 'Notice Board'}</span>
          {parentNotices.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[0.625rem] rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {parentNotices.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('teachers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSection === 'teachers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{isBn ? 'শিক্ষক পরিচিতি ও যোগাযোগ' : 'Teacher Directory'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('messages')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSection === 'messages'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isBn ? 'বার্তা ও অনুসন্ধান' : 'Messages & Inquiries'}</span>
        </button>
      </div>

      {showSuccessToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isBn
                ? 'আপনার বার্তা সফলভাবে শিক্ষকের নিকট পাঠানো হয়েছে।'
                : 'Your message has been sent successfully to the teacher.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      {activeSection === 'notices' && (
        <NoticesSection parentNotices={parentNotices} isBn={isBn} />
      )}

      {activeSection === 'teachers' && (
        <TeachersSection
          child={child}
          teachers={teachers}
          onSelectTeacherForMessage={(tName) => {
            setMsgRecipient(tName)
            setActiveSection('messages')
          }}
          isBn={isBn}
        />
      )}

      {activeSection === 'messages' && (
        <MessagesSection
          messages={messages}
          teachers={teachers}
          msgSubject={msgSubject}
          setMsgSubject={setMsgSubject}
          msgBody={msgBody}
          setMsgBody={setMsgBody}
          msgRecipient={msgRecipient}
          setMsgRecipient={setMsgRecipient}
          onSendMessage={handleSendMessage}
          isBn={isBn}
        />
      )}
    </div>
  )
})
