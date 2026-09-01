import { useState, useMemo } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Shield, Trash2, Copy, Users, Search, ChevronRight, Lock, Plus } from 'lucide-react'
import { usePermissionStore, type RolePerm } from '@/store/permissionStore'

interface Props {
  isBn: boolean
  onBack: () => void
  onEditRole: (roleId: string) => void
  onCreateRole: () => void
}

export function RolesList({ isBn, onBack, onEditRole, onCreateRole }: Props) {
  const bn = isBn
  const { roles, staffPermissions, removeRole, duplicateRole } = usePermissionStore()
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles
    const q = search.toLowerCase()
    return roles.filter((r) =>
      r.name.toLowerCase().includes(q) || r.nameBn.includes(q) ||
      r.description.toLowerCase().includes(q) || r.descriptionBn.includes(q)
    )
  }, [roles, search])

  const getStaffCount = (roleId: string) => staffPermissions.filter((s) => s.roleId === roleId).length

  const handleDuplicate = (role: RolePerm) => {
    const newName = `${role.name} (Copy)`
    const newNameBn = `${role.nameBn} (কপি)`
    const newId = duplicateRole(role.id, newName, newNameBn)
    if (newId) onEditRole(newId)
  }

  const handleDelete = (id: string) => {
    removeRole(id)
    setConfirmDelete(null)
  }

  return (
    <SettingsPanel title="Roles & Permissions" titleBn="ভূমিকা ও অনুমতি" isBn={bn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {bn
            ? 'ভূমিকা তৈরি করুন এবং প্রতিটি ভূমিকার অনুমতি পরিচালনা করুন।'
            : 'Create roles and manage permissions for each role.'}
        </p>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={bn ? 'ভূমিকা খুঁজুন...' : 'Search roles...'}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)] transition-colors"
          />
        </div>

        {/* Create Role Button */}
        <button
          onClick={onCreateRole}
          className="w-full h-10 rounded-xl border border-dashed border-[var(--brand)]/30 text-[var(--brand)] text-[0.8125rem] font-medium cursor-pointer hover:border-[var(--brand)] hover:bg-[var(--brand)]/5 transition-colors flex items-center justify-center gap-2 bg-transparent"
        >
          <Plus size={16} />
          {bn ? 'নতুন ভূমিকা তৈরি করুন' : 'Create New Role'}
        </button>

        {/* Roles List */}
        <div className="space-y-2">
          {filteredRoles.map((role) => {
            const staffCount = getStaffCount(role.id)
            return (
              <div
                key={role.id}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      role.isSystemRole ? 'bg-[var(--brand)]/10' : 'bg-purple-500/10'
                    }`}>
                      {role.isSystemRole
                        ? <Lock size={18} className="text-[var(--brand)]" />
                        : <Shield size={18} className="text-purple-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.875rem] font-semibold text-[var(--text-primary)] truncate">
                          {bn ? role.nameBn : role.name}
                        </span>
                        {role.isSystemRole && (
                          <span className="text-[0.5625rem] px-1.5 py-0.5 rounded bg-[var(--brand)]/10 text-[var(--brand)] font-medium">
                            {bn ? 'সিস্টেম' : 'System'}
                          </span>
                        )}
                      </div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                        {bn ? role.descriptionBn : role.description}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1">
                          <Users size={11} />
                          {staffCount} {bn ? 'ব্যবহারকারী' : 'users'}
                        </span>
                        <span className="text-[0.625rem] text-[var(--text-muted)]">
                          {role.permissions.filter((p) => Object.values(p.actions).some(Boolean)).length} {bn ? 'মডিউল' : 'modules'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditRole(role.id)}
                      className="h-8 px-3 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] text-[0.75rem] font-medium border-none cursor-pointer hover:bg-[var(--brand)]/20 transition-colors flex items-center gap-1"
                    >
                      {bn ? 'পরিচালনা' : 'Manage'}
                      <ChevronRight size={12} />
                    </button>
                    {!role.isSystemRole && (
                      <>
                        <button
                          onClick={() => handleDuplicate(role)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand)]/10 cursor-pointer bg-transparent border-none transition-colors"
                          title={bn ? 'ডুপ্লিকেট' : 'Duplicate'}
                        >
                          <Copy size={14} />
                        </button>
                        {confirmDelete === role.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="h-7 px-2 rounded-lg bg-[var(--red)]/10 text-[var(--red)] text-[0.6875rem] font-medium border-none cursor-pointer hover:bg-[var(--red)]/20 transition-colors"
                            >
                              {bn ? 'হ্যাঁ' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="h-7 px-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-[0.6875rem] font-medium border-none cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                              {bn ? 'না' : 'No'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(role.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 cursor-pointer bg-transparent border-none transition-colors"
                            title={bn ? 'মুছুন' : 'Delete'}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-8">
            <Shield size={32} className="text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <div className="text-[0.8125rem] text-[var(--text-muted)]">
              {bn ? 'কোনো ভূমিকা পাওয়া যায়নি' : 'No roles found'}
            </div>
          </div>
        )}
      </div>
    </SettingsPanel>
  )
}
