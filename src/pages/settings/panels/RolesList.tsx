import { SettingsPanel } from '../components/SettingsPanel'
import { Plus } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
  onCreateRole: () => void
}

export function RolesList({ isBn, onBack, onCreateRole }: Props) {
  const bn = isBn

  return (
    <SettingsPanel title="Roles & Permissions" titleBn="ভূমিকা ও অনুমতি" isBn={bn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {bn
            ? 'নতুন ভূমিকা তৈরি করুন, অনুমতি সেট করুন এবং শিক্ষক/স্টাফ নির্ধারণ করুন।'
            : 'Create a new role, set permissions, and assign teachers/staff.'}
        </p>

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
