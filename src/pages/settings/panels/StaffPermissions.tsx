import { useState, useMemo } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Users, Plus, Trash2, Check, X, Shield, Eye, EyeOff, Copy, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { usePermissionStore } from '@/store/permissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { usePermission } from '@/hooks/usePermission'
import { PERMISSION_PAGES, type TabPermissionConfig } from '@/lib/permissionConfig'

interface Props {
  isBn: boolean
  onBack: () => void
}

type PermAction = 'create' | 'read' | 'update' | 'delete'

export function StaffPermissionsPanel({ isBn, onBack }: Props) {
  const bn = isBn
  const teachers = useTeacherStore((s) => s.teachers)
  const { canManage } = usePermission()
  const {
    roles,
    staffPermissions,
    addStaff,
    removeStaff,
    setStaffRole,
    getPagePermCount,
    getTabPermCount,
    getPagePerm,
  } = usePermissionStore()

  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTeacherId, setNewTeacherId] = useState('')
  const [newRoleId, setNewRoleId] = useState('')
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const availableTeachers = useMemo(() => {
    const assignedIds = new Set(staffPermissions.map((s) => s.staffId))
    return teachers.filter((t) => !assignedIds.has(t.id))
  }, [teachers, staffPermissions])

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffPermissions
    const q = search.toLowerCase()
    return staffPermissions.filter((s) =>
      s.staffName.toLowerCase().includes(q) || s.staffNameBn.includes(q) || s.email.toLowerCase().includes(q)
    )
  }, [staffPermissions, search])

  const handleAdd = () => {
    if (!newTeacherId || !newRoleId) return
    const teacher = teachers.find((t) => t.id === newTeacherId)
    if (!teacher) return
    addStaff({
      staffId: teacher.id,
      staffName: teacher.nameEn,
      staffNameBn: teacher.nameBn,
      roleId: newRoleId,
      email: teacher.email,
      defaultPassword: '123456',
    })
    setNewTeacherId('')
    setNewRoleId('')
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
    const actionMap: Record<string, string> = { create: 'create', read: 'view', update: 'edit', delete: 'delete' }
    const permAction = actionMap[action] as 'view' | 'create' | 'edit' | 'delete'
    if (!page?.tabs) {
      const perm = getPagePerm(staffId, pageKey)
      return perm.tabs['*']?.[action] || false
    }
    return page.tabs.every((t) => {
      const key = `${pageKey}.${t.key}`
      const perm = usePermissionStore.getState().getEffectivePerm(staffId, key)
      return perm[permAction]
    })
  }

  const isPageSomeChecked = (staffId: string, pageKey: string, action: PermAction): boolean => {
    return isPageAllChecked(staffId, pageKey, action) ? false :
      PERMISSION_PAGES.find((p) => p.key === pageKey)?.tabs?.some((t) => {
        const key = `${pageKey}.${t.key}`
        const actionMap: Record<string, string> = { create: 'create', read: 'view', update: 'edit', delete: 'delete' }
        const perm = usePermissionStore.getState().getEffectivePerm(staffId, key)
        return perm[actionMap[action] as 'view' | 'create' | 'edit' | 'delete']
      }) || false
  }

  const selectedMember = staffPermissions.find((s) => s.id === selectedStaff)
  const selectedRole = selectedMember ? roles.find((r) => r.id === selectedMember.roleId) : null

  return (
    <SettingsPanel title="Staff Permissions" titleBn="স্টাফ অনুমতি" isBn={bn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {bn
            ? 'শিক্ষক ও স্টাফদের ভূমিকা ও অনুমতি পরিচালনা করুন।'
            : 'Manage teacher and staff roles and permissions.'}
        </p>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={bn ? 'স্টাফ খুঁজুন...' : 'Search staff...'}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)] transition-colors"
          />
        </div>

        {/* Staff List */}
        <div className="space-y-2">
          {filteredStaff.map((member) => {
            const role = roles.find((r) => r.id === member.roleId)
            return (
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
                      role?.isSystemRole ? 'bg-[var(--brand)]/10' : 'bg-purple-500/10'
                    }`}>
                      <Users size={18} className={role?.isSystemRole ? 'text-[var(--brand)]' : 'text-purple-500'} />
                    </div>
                    <div>
                      <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                        {bn ? member.staffNameBn : member.staffName}
                      </div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)]">
                        {role ? (bn ? role.nameBn : role.name) : 'No role'} • {getPagePermCount(member.id)} {bn ? 'মডিউল' : 'modules'}
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
                    {canManage('settings.roles') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(member.id) }}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] cursor-pointer bg-transparent border-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {showPassword[member.id] && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                    <div className="text-[0.625rem] text-[var(--text-muted)] mb-1">{bn ? 'ডিফল্ট পাসওয়ার্ড' : 'Default Password'}</div>
                    <code className="text-[0.8125rem] font-mono text-[var(--text-primary)]">{member.defaultPassword}</code>
                  </div>
                )}
              </div>
            )
          })}
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
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 mt-3 block">
              {bn ? 'ভূমিকা' : 'Role'}
            </label>
            <select
              value={newRoleId}
              onChange={(e) => setNewRoleId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            >
              <option value="">{bn ? 'নির্বাচন করুন...' : 'Select...'}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{bn ? r.nameBn : r.name}</option>
              ))}
            </select>
            <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15 mt-3 mb-3">
              <div className="text-[0.6875rem] text-blue-600">
                {bn ? 'ডিফল্ট পাসওয়ার্ড: 123456' : 'Default password: 123456'}
              </div>
            </div>
            {canManage('settings.roles') && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAdd(false); setNewTeacherId(''); setNewRoleId('') }}
                  className="flex-1 h-9 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-medium border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  {bn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newTeacherId || !newRoleId}
                  className="flex-1 h-9 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {bn ? 'যোগ করুন' : 'Add'}
                </button>
              </div>
            )}
          </div>
        ) : canManage('settings.roles') ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full h-10 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)] text-[0.8125rem] font-medium cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors flex items-center justify-center gap-2 bg-transparent"
            >
              <Plus size={16} />
              {bn ? 'নতুন শিক্ষক/স্টাফ যোগ করুন' : 'Add New Teacher/Staff'}
            </button>
        ) : null}

        {/* Permission Preview */}
        {selectedMember && selectedRole && (
          <div className="border-t border-[var(--border)]/40 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-[var(--brand)]" />
              <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                {bn ? `${selectedMember.staffNameBn} - ${selectedRole.nameBn}` : `${selectedMember.staffName} - ${selectedRole.name}`}
              </span>
            </div>

            {/* Role Switcher */}
            <div className="mb-3">
              <label className="text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1 block">
                {bn ? 'ভূমিকা পরিবর্তন' : 'Change Role'}
              </label>
              <select
                value={selectedMember.roleId}
                onChange={(e) => setStaffRole(selectedMember.id, e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{bn ? r.nameBn : r.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-[1fr_36px_36px_36px_36px] gap-0 px-4 py-2 bg-[var(--bg-tertiary)] text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                <div>{bn ? 'পৃষ্ঠা / ট্যাব' : 'Page / Tab'}</div>
                <div className="text-center">{bn ? 'সৃষ্টি' : 'C'}</div>
                <div className="text-center">{bn ? 'পড়ুন' : 'R'}</div>
                <div className="text-center">{bn ? 'আপডেট' : 'U'}</div>
                <div className="text-center">{bn ? 'মুছুন' : 'D'}</div>
              </div>

              <div className="divide-y divide-[var(--border)] max-h-[40vh] overflow-y-auto">
                {PERMISSION_PAGES.map((page) => {
                  const isExpanded = expandedPages.has(page.key)
                  const hasTabs = page.tabs && page.tabs.length > 0

                  return (
                    <div key={page.key}>
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
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                  allChecked
                                    ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                                    : someChecked
                                    ? 'bg-[var(--brand)]/5 text-[var(--brand)]/50'
                                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                                }`}
                              >
                                {allChecked ? <Check size={12} /> : someChecked ? <div className="w-2 h-0.5 rounded bg-[var(--brand)]/50" /> : <X size={12} className="opacity-30" />}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {isExpanded && hasTabs && page.tabs!.map((tab) => (
                        <TabRow
                          key={tab.key}
                          tab={tab}
                          staffId={selectedMember.id}
                          pageKey={page.key}
                          bn={bn}
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

function TabRow({ tab, staffId, pageKey, bn }: {
  tab: TabPermissionConfig
  staffId: string
  pageKey: string
  bn: boolean
}) {
  const perm = usePermissionStore((s) => {
    const member = s.staffPermissions.find((m) => m.id === staffId)
    if (!member) return null
    const role = s.roles.find((r) => r.id === member.roleId)
    const key = `${pageKey}.${tab.key}`
    const roleEntry = role?.permissions.find((p) => p.key === key)
    const overrideEntry = member.overrides.find((o) => o.key === key)
    const base = roleEntry?.actions || { view: false, create: false, edit: false, delete: false }
    if (overrideEntry) {
      return {
        create: base.create || overrideEntry.actions.create,
        read: base.view || overrideEntry.actions.view,
        update: base.edit || overrideEntry.actions.edit,
        delete: base.delete || overrideEntry.actions.delete,
      }
    }
    return { create: base.create, read: base.view, update: base.edit, delete: base.delete }
  })

  const p = perm || { create: false, read: false, update: false, delete: false }

  return (
    <div className="grid grid-cols-[1fr_36px_36px_36px_36px] gap-0 pl-10 pr-4 py-2 items-center hover:bg-[var(--bg-secondary)]/50">
      <div className="text-[0.6875rem] text-[var(--text-secondary)]">
        {bn ? tab.labelBn : tab.label}
      </div>
      {(['create', 'read', 'update', 'delete'] as const).map((action) => (
        <div key={action} className="flex justify-center">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${
            p[action] ? 'bg-[var(--brand)]/10 text-[var(--brand)]' : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
          }`}>
            {p[action] ? <Check size={11} /> : <X size={11} className="opacity-30" />}
          </div>
        </div>
      ))}
    </div>
  )
}
