import { Icon } from "@iconify/react"
import AnimatedIcon from "@/components/ui/AnimatedIcon"
import Card from "@/components/ui/Card"
import { useState } from "react"

const contacts = [
	{ id: 1, name: 'Mrs. Alvarez', last: 'Sent grades for math', unread: 2 },
	{ id: 2, name: 'Grade 10 - A', last: 'Homework update', unread: 0 },
	{ id: 3, name: 'Library', last: 'New books arrived', unread: 1 },
]

export default function Page() {
	const [active, setActive] = useState(contacts[0].id)

	return (
		<div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-strong)' }}>Messages</h2>
				<div style={{ display: 'flex', gap: 8 }}>
					<button className="btn-primary">New Message</button>
				</div>
			</div>

			<div className="chat-shell card--premium">
				<div className="chat-contacts">
					<div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
							<AnimatedIcon>
								<Icon icon="lucide:message-square" width={20} />
							</AnimatedIcon>
							<div>
								<div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>Contacts</div>
								<div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Teachers, parents & groups</div>
							</div>
						</div>
						<button style={{ background: 'transparent', border: '1px solid var(--border-soft)', padding: '6px 8px', borderRadius: 10 }}>
							<Icon icon="lucide:settings" width={14} />
						</button>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{contacts.map(c => (
							<Card key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: active === c.id ? 'linear-gradient(90deg,var(--primary),var(--primary-dark))' : undefined, color: active === c.id ? '#072034' : undefined }} onClick={() => setActive(c.id)}>
								<div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Icon icon="lucide:user" width={18} />
								</div>
								<div style={{ flex: 1 }}>
									<div style={{ fontWeight: 600 }}>{c.name}</div>
									<div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.last}</div>
								</div>
								{c.unread > 0 && <div style={{ background: 'var(--danger)', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 12 }}>{c.unread}</div>}
							</Card>
						))}
					</div>
				</div>

				<div className="chat-window">
					<div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)', marginBottom: 12 }}>
						<div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<Icon icon="lucide:user" width={18} />
						</div>
						<div style={{ flex: 1 }}>
							<div style={{ fontWeight: 700 }}>Mrs. Alvarez</div>
							<div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Math Teacher · Last seen 2h ago</div>
						</div>
						<div style={{ display: 'flex', gap: 8 }}>
							<button style={{ border: 'none', background: 'transparent' }}><Icon icon="lucide:phone" width={16} /></button>
							<button style={{ border: 'none', background: 'transparent' }}><Icon icon="lucide:video" width={16} /></button>
						</div>
					</div>

					<div style={{ flex: 1, overflow: 'auto', padding: '6px 2px 12px', display: 'flex', flexDirection: 'column' }}>
						<div style={{ alignSelf: 'flex-start' }}>
							<div className="message them">Hi, please remind students about the quiz tomorrow.</div>
							<div className="message them">Share the revision notes in the group.</div>
						</div>
						<div style={{ alignSelf: 'flex-end' }}>
							<div className="message me">Thanks, will do. Also upload the answer key after grading.</div>
						</div>
						<div style={{ alignSelf: 'flex-start' }}>
							<div className="message them">Uploaded — check resources tab.</div>
						</div>
					</div>

					<div style={{ paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
						<div style={{ display: 'flex', gap: 8 }}>
							<input placeholder="Type a message..." style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-soft)', background: 'var(--card)' }} />
							<button className="btn-primary">Send</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
