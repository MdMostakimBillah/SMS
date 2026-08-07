import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Users, Plus, Trash2, Check, X, Shield, Eye, EyeOff, Copy } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

interface StaffMember {
  id: string
  name: string
  nameBn: string
  role: 'teacher' | 'staff'
  email: string
  defaultPassword: string
  permissions: Permission[]
}

interface Permission {
  page: string
  pageBn: string
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

const pages = [
  { key: 'dashboard', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', hasSubPages: false },
  { key: 'students', label: 'Students', labelBn: 'ছাত্ররা', hasSubPages: true, subPages: ['All Students', 'Admission', 'Promotion', 'ID Cards'] },
  { key: 'teachers', label: 'Teachers', labelBn: 'শিক্ষকরা', hasSubPages: true, subPages: ['All Teachers', 'Departments', 'Subjects', 'Designations'] },
  { key: 'classes', label: 'Classes', labelBn: 'শ্রেণিসমূহ', hasSubPages: true, subPages: ['All Classes', 'Sections', 'Subjects'] },
  { key: 'attendance', label: 'Attendance', labelBn: 'উপস্থিতি', hasSubPages: true, subPages: ['Daily', 'Reports'] },
  { key: 'exams', label: 'Exams', labelBn: 'পরীক্ষা', hasSubPages: true, subPages: ['All Exams', 'Marks', 'Reports'] },
  { key: 'finance', label: 'Finance', labelBn: 'অর্থ', hasSubPages: true, subPages: ['Fees', 'Payments', 'Reports'] },
  { key: 'library', label: 'Library', labelBn: 'গ্রন্থাগার', hasSubPages: true, subPages: ['Books', 'Issues', 'Members'] },
  { key: 'transport', label: 'Transport', labelBn: 'পরিবহন', hasSubPages: true, subPages: ['Vehicles', 'Routes', 'Students'] },
  { key: 'hostel', label: 'Hostel', labelBn: 'হোস্টেল', hasSubPages: true, subPages: ['Rooms', 'Students'] },
  { key: 'reports', label: 'Reports', labelBn: 'রিপোর্ট', hasSubPages: true, subPages: ['Student', 'Teacher', 'Financial'] },
  { key: 'settings', label: 'Settings', labelBn: 'সেটিংস', hasSubPages: true, subPages: ['General', 'Login & Security', 'Institution', 'Advanced'] },
]

const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'Rahim Ahmed',
    nameBn: 'রহিম আহমেদ',
    role: 'teacher',
    email: 'rahim@school.com',
    defaultPassword: '123456',
    permissions: [
      { page: 'dashboard', pageBn: 'ড্যাশবোর্ড', create: false, read: true, update: false, delete: false },
      { page: 'students', pageBn: 'ছাত্ররা', create: false, read: true, update: true, delete: false },
      { page: 'attendance', pageBn: 'উপস্থিতি', create: true, read: true, update: true, delete: false },
    ],
  },
  {
    id: '2',
    name: 'Fatima Khan',
    nameBn: 'ফাতিমা খান',
    role: 'staff',
    email: 'fatima@school.com',
    defaultPassword: '123456',
    permissions: [
      { page: 'dashboard', pageBn: 'ড্যাশবোর্ড', create: false, read: true, update: false, delete: false },
      { page: 'finance', pageBn: 'অর্থ', create: true, read: true, update: true, delete: false },
    ],
  },
]

export function StaffPermissionsPanel({ isBn, onBack }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'teacher' | 'staff'>('teacher')
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!newName.trim()) return
    const newStaff: StaffMember = {
      id: String(Date.now()),
      name: newName.trim(),
      nameBn: newName.trim(),
      role: newRole,
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@school.com`,
      defaultPassword: '123456',
      permissions: [
        { page: 'dashboard', pageBn: 'ড্যাশবোর্ড', create: false, read: true, update: false, delete: false },
      ],
    }
    setStaff((prev) => [...prev, newStaff])
    setNewName('')
    setShowAdd(false)
  }

  const handleDelete = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id))
    if (selectedStaff === id) setSelectedStaff(null)
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyPassword = (password: string, id: string) => {
    navigator.clipboard.writeText(password)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const togglePermission = (staffId: string, pageKey: string, perm: 'create' | 'read' | 'update' | 'delete') => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id !== staffId) return s
        const existing = s.permissions.find((p) => p.page === pageKey)
        if (existing) {
          return {
            ...s,
            permissions: s.permissions.map((p) =>
              p.page === pageKey ? { ...p, [perm]: !p[perm] } : p
            ),
          }
        }
        const pageInfo = pages.find((p) => p.key === pageKey)
        return {
          ...s,
          permissions: [...s.permissions, { page: pageKey, pageBn: pageInfo?.labelBn || '', create: perm === 'create', read: perm === 'read', update: perm === 'update', delete: perm === 'delete' }],
        }
      })
    )
  }

  const getPermission = (staffId: string, pageKey: string): Permission => {
    const member = staff.find((s) => s.id === staffId)
    return member?.permissions.find((p) => p.page === pageKey) || { page: pageKey, pageBn: '', create: false, read: false, update: false, delete: false }
  }

  const selectedMember = staff.find((s) => s.id === selectedStaff)

  return (
    <SettingsPanel title="Staff Permissions" titleBn="স্টাফ অনুমতি" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'শিক্ষক ও স্টাফদের অনুমতি পরিচালনা করুন।'
            : 'Manage teacher and staff permissions.'}
        </p>

        {/* Staff List */}
        <div className="space-y-2">
          {staff.map((member) => (
            <div
              key={member.id}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedStaff === member.id
                  ? 'border-[var(--brand)]/30 bg-[var(--brand-light)]/30'
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/20'
              }`}
              onClick={() => setSelectedStaff(member.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    member.role === 'teacher' ? 'bg-blue-500/10' : 'bg-green-500/10'
                  }`}>
                    <Users size={18} className={member.role === 'teacher' ? 'text-blue-500' : 'text-green-500'} />
                  </div>
                  <div>
                    <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                      {isBn ? member.nameBn : member.name}
                    </div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)]">
                      {member.role === 'teacher' ? (isBn ? 'শিক্ষক' : 'Teacher') : (isBn ? 'স্টাফ' : 'Staff')} • {member.permissions.length} {isBn ? 'পৃষ্ঠা' : 'pages'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(member.id) }}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
                  >
                    {showPassword[member.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyPassword(member.defaultPassword, member.id) }}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-none"
                  >
                    {copiedId === member.id ? <Check size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(member.id) }}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {showPassword[member.id] && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                  <div className="text-[0.625rem] text-[var(--text-muted)] mb-1">{isBn ? 'ডিফল্ট পাসওয়ার্ড' : 'Default Password'}</div>
                  <code className="text-[0.8125rem] font-mono text-[var(--text-primary)]">{member.defaultPassword}</code>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Staff */}
        {showAdd ? (
          <div className="p-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-light)]/30">
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
              {isBn ? 'নাম' : 'Name'}
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isBn ? 'শিক্ষক/স্টাফের নাম' : 'Teacher/Staff name'}
              className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
              autoFocus
            />
            <div className="flex gap-2 mt-3 mb-3">
              <button
                onClick={() => setNewRole('teacher')}
                className={`flex-1 h-9 rounded-lg text-[0.8125rem] font-medium border cursor-pointer transition-colors ${
                  newRole === 'teacher'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-600'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]'
                }`}
              >
                {isBn ? 'শিক্ষক' : 'Teacher'}
              </button>
              <button
                onClick={() => setNewRole('staff')}
                className={`flex-1 h-9 rounded-lg text-[0.8125rem] font-medium border cursor-pointer transition-colors ${
                  newRole === 'staff'
                    ? 'bg-green-500/10 border-green-500/30 text-green-600'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]'
                }`}
              >
                {isBn ? 'স্টাফ' : 'Staff'}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15 mb-3">
              <div className="text-[0.6875rem] text-blue-600">
                {isBn ? 'ডিফল্ট পাসওয়ার্ড: 123456' : 'Default password: 123456'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setNewName('') }}
                className="flex-1 h-9 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-medium border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="flex-1 h-9 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isBn ? 'যোগ করুন' : 'Add'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full h-10 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)] text-[0.8125rem] font-medium cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors flex items-center justify-center gap-2 bg-transparent"
          >
            <Plus size={16} />
            {isBn ? 'নতুন শিক্ষক/স্টাফ যোগ করুন' : 'Add New Teacher/Staff'}
          </button>
        )}

        {/* Permission Editor */}
        {selectedMember && (
          <div className="border-t border-[var(--border)]/40 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-[var(--brand)]" />
              <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                {isBn ? `${selectedMember.nameBn} - অনুমতি` : `${selectedMember.name} - Permissions`}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_40px_40px_40px_40px] gap-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                <div>{isBn ? 'পৃষ্ঠা' : 'Page'}</div>
                <div className="text-center">{isBn ? 'সৃষ্টি' : 'C'}</div>
                <div className="text-center">{isBn ? 'পড়ুন' : 'R'}</div>
                <div className="text-center">{isBn ? 'আপডেট' : 'U'}</div>
                <div className="text-center">{isBn ? 'মুছুন' : 'D'}</div>
              </div>

              {/* Pages */}
              <div className="divide-y divide-[var(--border)]">
                {pages.map((page) => {
                  const perm = getPermission(selectedMember.id, page.key)
                  return (
                    <div key={page.key} className="grid grid-cols-[1fr_40px_40px_40px_40px] gap-1 px-4 py-2.5 items-center hover:bg-[var(--bg-secondary)]">
                      <div className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                        {isBn ? page.labelBn : page.label}
                      </div>
                      {(['create', 'read', 'update', 'delete'] as const).map((p) => (
                        <div key={p} className="flex justify-center">
                          <button
                            onClick={() => togglePermission(selectedMember.id, page.key, p)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none transition-colors ${
                              perm[p]
                                ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                                : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                            }`}
                          >
                            {perm[p] ? <Check size={12} /> : <X size={12} className="opacity-30" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsPanel>
  )
}
