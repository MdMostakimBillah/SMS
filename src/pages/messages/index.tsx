import { MessageSquare, Settings, User, Phone, Video } from 'lucide-react'
import AnimatedIcon from '@/components/ui/AnimatedIcon'
import Card from '@/components/ui/Card'
import { useState } from 'react'

const contacts = [
  { id: 1, name: 'Mrs. Alvarez', last: 'Sent grades for math', unread: 2 },
  { id: 2, name: 'Grade 10 - A', last: 'Homework update', unread: 0 },
  { id: 3, name: 'Library', last: 'New books arrived', unread: 1 },
]

export default function Page() {
  const [active, setActive] = useState(contacts[0].id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--text-strong)]">Messages</h2>
        <div className="flex gap-2">
          <button className="btn-primary">New Message</button>
        </div>
      </div>

      <div className="chat-shell card--premium">
        <div className="chat-contacts">
          <div className="mb-3 flex justify-between items-center">
            <div className="flex gap-2.5 items-center">
              <AnimatedIcon>
                <MessageSquare size={20} />
              </AnimatedIcon>
              <div>
                <div className="font-bold text-[var(--text-strong)]">Contacts</div>
                <div className="text-xs text-[var(--text-secondary)]">Teachers, parents & groups</div>
              </div>
            </div>
            <button className="bg-transparent border border-[var(--border-soft)] px-2 py-1.5 rounded-[10px]">
              <Settings size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {contacts.map((c) => (
              <Card
                key={c.id}
                className={`flex items-center gap-3 cursor-pointer ${active === c.id ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-[#072034]' : ''}`}
                onClick={() => setActive(c.id)}
              >
                <div className="w-[44px] h-[44px] rounded-[10px] bg-[var(--card)] flex items-center justify-center">
                  <User size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{c.last}</div>
                </div>
                {c.unread > 0 && <div className="bg-[var(--danger)] text-white px-2 py-1 rounded-lg text-xs">{c.unread}</div>}
              </Card>
            ))}
          </div>
        </div>

        <div className="chat-window">
          <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-soft)] mb-3">
            <div className="w-[44px] h-[44px] rounded-[10px] bg-[var(--card)] flex items-center justify-center">
              <User size={18} />
            </div>
            <div className="flex-1">
              <div className="font-bold">Mrs. Alvarez</div>
              <div className="text-xs text-[var(--text-secondary)]">Math Teacher · Last seen 2h ago</div>
            </div>
            <div className="flex gap-2">
              <button className="border-none bg-transparent">
                <Phone size={16} />
              </button>
              <button className="border-none bg-transparent">
                <Video size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto py-1.5 px-0.5 pb-3 flex flex-col">
            <div className="self-start">
              <div className="message them">Hi, please remind students about the quiz tomorrow.</div>
              <div className="message them">Share the revision notes in the group.</div>
            </div>
            <div className="self-end">
              <div className="message me">Thanks, will do. Also upload the answer key after grading.</div>
            </div>
            <div className="self-start">
              <div className="message them">Uploaded — check resources tab.</div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-soft)]">
            <div className="flex gap-2">
              <input
                placeholder="Type a message..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--card)]"
              />
              <button className="btn-primary">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
