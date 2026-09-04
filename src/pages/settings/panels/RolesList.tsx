import { useMemo } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Plus, Users, Shield, Trash2 } from 'lucide-react'
import { usePermissionStore } from '@/store/permissionStore'

interface Props {
  isBn: boolean
  onBack: () => void
  onCreateRole: () => void
  onEditRole: (roleId: string) => void
}

export function RolesList({ isBn, onBack, onCreateRole, onEditRole }: Props) {
  const bn = isBn
  const { roles, staffPermissions, removeRole } = usePermissionStore()

  const roleStaffCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    staffPermissions.forEach((s) => {
      counts[s.roleId] = (counts[s.roleId] || 0) + 1
    })
    return counts
  }, [staffPermissions])

  return (
    <SettingsPanel title="Roles & Permissions" titleBn="ভূমিকা ও অনুমতি" isBn={bn} onBack={onBack}>
      <div className="space-y-3">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {bn
            ? 'নতুন ভূমিকা তৈরি করুন, অনুমতি সেট করুন এবং শিক্ষক/স্টাফ নির্ধারণ করুন।'
            : 'Create a new role, set permissions, and assign teachers/staff.'}
        </p>

        {roles.map((role) => {
          const staffCount = roleStaffCounts[role.id] || 0
          const permCount = role.permissions.filter((p) => Object.values(p.actions).some(Boolean)).length
          return (
            <div
              key={role.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/20 transition-colors"
            >
              <button
                onClick={() => onEditRole(role.id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer p-0"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center shrink-0">
                  <Shield size={16} className="text-[var(--brand)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">
                    {bn ? role.nameBn || role.name : role.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1">
                      <Users size={10} />
                      {staffCount} {bn ? 'স্টাফ' : 'staff'}
                    </span>
                    <span className="text-[0.625rem] text-[var(--text-muted)]">
                      {permCount} {bn ? 'অনুমতি' : 'permissions'}
                    </span>
                    {role.isSystemRole && (
                      <span className="text-[0.5625rem] px-1.5 py-0.5 rounded bg-[var(--amber)]/10 text-[var(--amber)] font-medium">
                        {bn ? 'সিস্টেম' : 'System'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
              {!role.isSystemRole && (
                <button
                  onClick={() => { if (confirm(bn ? 'এই ভূমিকা মুছে ফেলতে চান?' : 'Delete this role?')) removeRole(role.id) }}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 cursor-pointer bg-transparent border-none transition-colors shrink-0"
                  title={bn ? 'মুছে ফেলুন' : 'Delete'}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )
        })}

        <button
          onClick={onCreateRole}
          className="w-full h-11 rounded-xl border border-dashed border-[var(--brand)]/30 text-[var(--brand)] text-[0.875rem] font-semibold cursor-pointer hover:border-[var(--brand)] hover:bg-[var(--brand)]/5 transition-colors flex items-center justify-center gap-2 bg-transparent"
        >
          <Plus size={18} />
          {bn ? 'নতুন ভূমিকা তৈরি করুন' : 'Create New Role'}
        </button>
      </div>
    </SettingsPanel>
  )
}
