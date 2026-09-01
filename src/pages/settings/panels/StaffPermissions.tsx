import { useState, useMemo } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Users, Plus, Trash2, Check, X, Shield, Eye, EyeOff, Copy, ChevronDown, ChevronRight } from 'lucide-react'
import { usePermissionStore } from '@/store/permissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { PERMISSION_PAGES, type TabPermissionConfig } from '@/lib/permissionConfig'

interface Props {
  isBn: boolean
  onBack: () => void
}

type PermAction = 'create' | 'read' | 'update' | 'delete'

export function StaffPermissionsPanel({ isBn, onBack }: Props) {
  const bn = isBn
  const teachers = useTeacherStore((s) => s.teachers)
  const {
    staffPermissions,
    addStaff,
    removeStaff,
    updateTabPerm,
    setPagePermAll,
    getPagePermCount,
    getTabPermCount,
  } = usePermissionStore()

  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTeacherId, setNewTeacherId] = useState('')
  const [newRole, setNewRole] = useState<'teacher' | 'staff'>('teacher')
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())

  const availableTeachers = useMemo(() => {
    const assignedIds = new Set(staffPermissions.map((s) => s.staffId))
    return teachers.filter((t) => !assignedIds.has(t.id))
  }, [teachers, staffPermissions])

  const handleAdd = () => {
    if (!newTeacherId) return
    const teacher = teachers.find((t) => t.id === newTeacherId)
    if (!teacher) return
    addStaff({
      staffId: teacher.id,
      staffName: teacher.nameEn,
      staffNameBn: teacher.nameBn,
      role: newRole,
      email: teacher.email,
      defaultPassword: '123456',
    })
    setNewTeacherId('')
    setShowAdd(false)
  }

  const handleDelete = (id: string) => {
    removeStaff(id)
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

  const togglePageExpand = (pageKey: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev)
      if (next.has(pageKey)) next.delete(pageKey)
      else next.add(pageKey)
      return next
    })
  }

  const isPageAllChecked = (staffId: string, pageKey: string, action: PermAction): boolean => {
    const page = PERMISSION_PAGES.find((p) => p.key === pageKey)
    if (!page?.tabs) {
      const perm = usePermissionStore.getState().getTabPerm(staffId, pageKey, '*')
      return perm[action]
    }
    return page.tabs.every((t) => {
      const perm = usePermissionStore.getState().getTabPerm(staffId, pageKey, t.key)
      return perm[action]
    })
  }

  const isPageSomeChecked = (staffId: string, pageKey: string, action: PermAction): boolean => {
    const page = PERMISSION_PAGES.find((p) => p.key === pageKey)
    if (!page?.tabs) return isPageAllChecked(staffId, pageKey, action)
    return page.tabs.some((t) => {
      const perm = usePermissionStore.getState().getTabPerm(staffId, pageKey, t.key)
      return perm[action]
    }) && !isPageAllChecked(staffId, pageKey, action)
  }

  const selectedMember = staffPermissions.find((s) => s.id === selectedStaff)

  return (
    <SettingsPanel title="Staff Permissions" titleBn="স্টাফ অনুমতি" isBn={bn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {bn
            ? 'শিক্ষক ও স্টাফদের পৃষ্ঠা ও ট্যাব অনুযায়ী অনুমতি পরিচালনা করুন।'
            : 'Manage teacher and staff permissions by page and tab.'}
        </p>

        {/* Staff List */}
        <div className="space-y-2">
          {staffPermissions.map((member) => (
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
                      {bn ? member.staffNameBn : member.staffName}
                    </div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)]">
                      {member.role === 'teacher' ? (bn ? 'শিক্ষক' : 'Teacher') : (bn ? 'স্টাফ' : 'Staff')} • {getPagePermCount(member.id)} {bn ? 'পৃষ্ঠা' : 'pages'}
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
                  <div className="text-[0.625rem] text-[var(--text-muted)] mb-1">{bn ? 'ডিফল্ট পাসওয়ার্ড' : 'Default Password'}</div>
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
              {bn ? 'শিক্ষক/স্টাফ নির্বাচন' : 'Select Teacher/Staff'}
            </label>
            <select
              value={newTeacherId}
              onChange={(e) => setNewTeacherId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            >
              <option value="">{bn ? 'নির্বাচন করুন...' : 'Select...'}</option>
              {availableTeachers.map((t) => (
                <option key={t.id} value={t.id}>{bn ? t.nameBn : t.nameEn} ({t.id})</option>
              ))}
            </select>
            <div className="flex gap-2 mt-3 mb-3">
              <button
                onClick={() => setNewRole('teacher')}
                className={`flex-1 h-9 rounded-lg text-[0.8125rem] font-medium border cursor-pointer transition-colors ${
                  newRole === 'teacher'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-600'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]'
                }`}
              >
                {bn ? 'শিক্ষক' : 'Teacher'}
              </button>
              <button
                onClick={() => setNewRole('staff')}
                className={`flex-1 h-9 rounded-lg text-[0.8125rem] font-medium border cursor-pointer transition-colors ${
                  newRole === 'staff'
                    ? 'bg-green-500/10 border-green-500/30 text-green-600'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)]'
                }`}
              >
                {bn ? 'স্টাফ' : 'Staff'}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15 mb-3">
              <div className="text-[0.6875rem] text-blue-600">
                {bn ? 'ডিফল্ট পাসওয়ার্ড: 123456' : 'Default password: 123456'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setNewTeacherId('') }}
                className="flex-1 h-9 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-medium border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {bn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTeacherId}
                className="flex-1 h-9 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {bn ? 'যোগ করুন' : 'Add'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full h-10 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)] text-[0.8125rem] font-medium cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors flex items-center justify-center gap-2 bg-transparent"
          >
            <Plus size={16} />
            {bn ? 'নতুন শিক্ষক/স্টাফ যোগ করুন' : 'Add New Teacher/Staff'}
          </button>
        )}

        {/* Permission Editor */}
        {selectedMember && (
          <div className="border-t border-[var(--border)]/40 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-[var(--brand)]" />
              <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                {bn ? `${selectedMember.staffNameBn} - অনুমতি` : `${selectedMember.staffName} - Permissions`}
              </span>
            </div>

            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_36px_36px_36px_36px] gap-0 px-4 py-2 bg-[var(--bg-tertiary)] text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                <div>{bn ? 'পৃষ্ঠা / ট্যাব' : 'Page / Tab'}</div>
                <div className="text-center">{bn ? 'সৃষ্টি' : 'C'}</div>
                <div className="text-center">{bn ? 'পড়ুন' : 'R'}</div>
                <div className="text-center">{bn ? 'আপডেট' : 'U'}</div>
                <div className="text-center">{bn ? 'মুছুন' : 'D'}</div>
              </div>

              {/* Pages */}
              <div className="divide-y divide-[var(--border)]">
                {PERMISSION_PAGES.map((page) => {
                  const isExpanded = expandedPages.has(page.key)
                  const hasTabs = page.tabs && page.tabs.length > 0

                  return (
                    <div key={page.key}>
                      {/* Page Row */}
                      <div className="grid grid-cols-[1fr_36px_36px_36px_36px] gap-0 px-4 py-2.5 items-center hover:bg-[var(--bg-secondary)]">
                        <div className="flex items-center gap-2">
                          {hasTabs ? (
                            <button
                              onClick={() => togglePageExpand(page.key)}
                              className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] bg-transparent border-none cursor-pointer"
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}
                          <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                            {bn ? page.labelBn : page.label}
                          </span>
                          {hasTabs && (
                            <span className="text-[0.5625rem] text-[var(--text-muted)]">
                              {getTabPermCount(selectedMember.id, page.key)}/{page.tabs!.length}
                            </span>
                          )}
                        </div>
                        {(['create', 'read', 'update', 'delete'] as const).map((action) => {
                          const allChecked = isPageAllChecked(selectedMember.id, page.key, action)
                          const someChecked = isPageSomeChecked(selectedMember.id, page.key, action)
                          return (
                            <div key={action} className="flex justify-center">
                              <button
                                onClick={() => {
                                  const newValue = !allChecked
                                  setPagePermAll(selectedMember.id, page.key, action, newValue)
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none transition-colors ${
                                  allChecked
                                    ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                                    : someChecked
                                    ? 'bg-[var(--brand)]/5 text-[var(--brand)]/50'
                                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                                }`}
                              >
                                {allChecked ? <Check size={12} /> : someChecked ? <div className="w-2 h-0.5 rounded bg-[var(--brand)]/50" /> : <X size={12} className="opacity-30" />}
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Tab Rows (expanded) */}
                      {isExpanded && hasTabs && page.tabs!.map((tab) => (
                        <TabRow
                          key={tab.key}
                          tab={tab}
                          staffId={selectedMember.id}
                          pageKey={page.key}
                          bn={bn}
                          updateTabPerm={updateTabPerm}
                        />
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

function TabRow({ tab, staffId, pageKey, bn, updateTabPerm }: {
  tab: TabPermissionConfig
  staffId: string
  pageKey: string
  bn: boolean
  updateTabPerm: (staffId: string, pageKey: string, tabKey: string, action: PermAction, value: boolean) => void
}) {
  const tabPerm = usePermissionStore((s) => {
    const member = s.staffPermissions.find((m) => m.id === staffId)
    if (!member) return { create: false, read: false, update: false, delete: false }
    const pp = member.permissions.find((p) => p.page === pageKey)
    return pp?.tabs[tab.key] || { create: false, read: false, update: false, delete: false }
  })

  return (
    <div className="grid grid-cols-[1fr_36px_36px_36px_36px] gap-0 pl-10 pr-4 py-2 items-center hover:bg-[var(--bg-secondary)]/50">
      <div className="text-[0.6875rem] text-[var(--text-secondary)]">
        {bn ? tab.labelBn : tab.label}
      </div>
      {(['create', 'read', 'update', 'delete'] as const).map((action) => (
        <div key={action} className="flex justify-center">
          <button
            onClick={() => updateTabPerm(staffId, pageKey, tab.key, action, !tabPerm[action])}
            className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer border-none transition-colors ${
              tabPerm[action]
                ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
            }`}
          >
            {tabPerm[action] ? <Check size={11} /> : <X size={11} className="opacity-30" />}
          </button>
        </div>
      ))}
    </div>
  )
}
