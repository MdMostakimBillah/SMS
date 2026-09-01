import { useState, useMemo } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Save, Search, Check, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { usePermissionStore, type PermissionAction } from '@/store/permissionStore'
import { PERMISSION_TREE, getPermissionNode, ROLE_TEMPLATES, DATA_SCOPE_OPTIONS, type PermissionNode, type ActionSet, createActionSet } from '@/lib/permissionConfig'

interface Props {
  isBn: boolean
  roleId: string
  onBack: () => void
}

export function RoleEditor({ isBn, roleId, onBack }: Props) {
  const bn = isBn
  const { roles, updateRole, setRolePerm, setRolePermAll, applyPreset } = usePermissionStore()
  const role = roles.find((r) => r.id === roleId)

  const [name, setName] = useState(role?.name || '')
  const [nameBn, setNameBn] = useState(role?.nameBn || '')
  const [description, setDescription] = useState(role?.description || '')
  const [descriptionBn] = useState(role?.descriptionBn || '')
  const [dataScope, setDataScope] = useState(role?.dataScope || 'all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(PERMISSION_TREE.map((n) => n.key)))
  const [showPresets, setShowPresets] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!role) {
    return (
      <SettingsPanel title="Edit Role" titleBn="ভূমিকা সম্পাদনা" isBn={bn} onBack={onBack}>
        <div className="text-center py-8 text-[var(--text-muted)]">
          {bn ? 'ভূমিকা পাওয়া যায়নি' : 'Role not found'}
        </div>
      </SettingsPanel>
    )
  }

  const getPerm = (key: string): ActionSet => {
    const entry = role.permissions.find((p) => p.key === key)
    return entry?.actions || createActionSet()
  }

  const isAllActionsChecked = (key: string): boolean => {
    const node = getPermissionNode(key)
    if (!node) return false
    const perm = getPerm(key)
    return node.actions.every((a) => perm[a])
  }

  const isSomeActionsChecked = (key: string): boolean => {
    const perm = getPerm(key)
    return Object.values(perm).some(Boolean) && !isAllActionsChecked(key)
  }

  const isModuleExpanded = (key: string) => expanded.has(key)

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const filteredTree = useMemo(() => {
    if (!search.trim()) return PERMISSION_TREE
    const q = search.toLowerCase()
    const filterNodes = (nodes: PermissionNode[]): PermissionNode[] => {
      return nodes.filter((node) => {
        const matchName = node.label.toLowerCase().includes(q) || node.labelBn.includes(q)
        const matchKey = node.key.toLowerCase().includes(q)
        const childMatch = node.children ? filterNodes(node.children).length > 0 : false
        return matchName || matchKey || childMatch
      }).map((node) => ({
        ...node,
        children: node.children ? filterNodes(node.children) : undefined,
      }))
    }
    return filterNodes(PERMISSION_TREE)
  }, [search])

  const handleSave = () => {
    updateRole(roleId, { name, nameBn, description, descriptionBn, dataScope })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePreset = (key: string) => {
    applyPreset(roleId, key)
    setShowPresets(false)
    // Reload role data
    const updated = usePermissionStore.getState().roles.find((r) => r.id === roleId)
    if (updated) {
      setDataScope(updated.dataScope)
    }
  }

  const handleToggleAll = (key: string) => {
    const allChecked = isAllActionsChecked(key)
    setRolePermAll(roleId, key, !allChecked)
  }

  const handleToggleAction = (key: string, action: PermissionAction) => {
    const current = getPerm(key)
    setRolePerm(roleId, key, action, !current[action])
  }

  const renderNode = (node: PermissionNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = isModuleExpanded(node.key)
    const allChecked = isAllActionsChecked(node.key)
    const someChecked = isSomeActionsChecked(node.key)

    return (
      <div key={node.key}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-[var(--bg-secondary)]/50 transition-colors ${
            depth === 0 ? 'font-semibold' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.key)}
              className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] bg-transparent border-none cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <button
            onClick={() => handleToggleAll(node.key)}
            className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer border-none transition-colors shrink-0 ${
              allChecked
                ? 'bg-[var(--brand)] text-white'
                : someChecked
                ? 'bg-[var(--brand)]/20 text-[var(--brand)]'
                : 'bg-[var(--bg-primary)] border border-[var(--border)] text-transparent'
            }`}
          >
            {(allChecked || someChecked) && <Check size={11} className={allChecked ? 'text-white' : ''} />}
          </button>

          <span className={`text-[0.8125rem] ${depth === 0 ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            {bn ? node.labelBn : node.label}
          </span>

          {hasChildren && (
            <span className="text-[0.5625rem] text-[var(--text-muted)] ml-1">
              {node.children!.length}
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}

        {isExpanded && !hasChildren && (
          <div className="ml-8 mb-2 flex flex-wrap gap-1.5">
            {node.actions.map((action) => {
              const checked = getPerm(node.key)[action]
              return (
                <button
                  key={action}
                  onClick={() => handleToggleAction(node.key, action)}
                  className={`h-7 px-2.5 rounded-lg text-[0.6875rem] font-medium border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-[var(--brand)]/10 border-[var(--brand)]/30 text-[var(--brand)]'
                      : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand)]/20'
                  }`}
                >
                  {actionLabels[action]}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const actionLabels: Record<PermissionAction, string> = {
    view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
    approve: 'Approve', reject: 'Reject', print: 'Print', export: 'Export',
    import: 'Import', download: 'Download', publish: 'Publish', manage: 'Manage', configure: 'Configure',
  }

  return (
    <SettingsPanel
      title={role.name}
      titleBn={role.nameBn}
      isBn={bn}
      onBack={onBack}
    >
      <div className="space-y-5">
        {/* Role Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1 block">
              {bn ? 'নাম (ইংরেজি)' : 'Name (EN)'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            />
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1 block">
              {bn ? 'নাম (বাংলা)' : 'Name (BN)'}
            </label>
            <input
              type="text"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1 block">
              {bn ? 'বিবরণ' : 'Description'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            />
          </div>
        </div>

        {/* Data Scope */}
        <div>
          <label className="text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1.5 block">
            {bn ? 'ডেটা পরিসীমা' : 'Data Scope'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DATA_SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDataScope(opt.value)}
                className={`h-8 px-3 rounded-lg text-[0.75rem] font-medium border cursor-pointer transition-colors ${
                  dataScope === opt.value
                    ? 'bg-[var(--brand)]/10 border-[var(--brand)]/30 text-[var(--brand)]'
                    : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand)]/20'
                }`}
              >
                {bn ? opt.labelBn : opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--brand)] cursor-pointer bg-transparent border-none hover:underline"
          >
            <Sparkles size={14} />
            {bn ? 'প্রিসেট প্রয়োগ করুন' : 'Apply Preset'}
          </button>
          {showPresets && (
            <div className="mt-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ROLE_TEMPLATES).map(([key, tmpl]) => (
                  <button
                    key={key}
                    onClick={() => handlePreset(key)}
                    className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-left cursor-pointer hover:border-[var(--brand)]/30 transition-colors"
                  >
                    <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                      {bn ? tmpl.labelBn : tmpl.label}
                    </div>
                    <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                      {bn ? tmpl.descriptionBn : tmpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Permission Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={bn ? 'অনুমতি খুঁজুন...' : 'Search permissions...'}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)] transition-colors"
          />
        </div>

        {/* Permission Tree */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden max-h-[50vh] overflow-y-auto">
          <div className="px-3 py-2 bg-[var(--bg-tertiary)] text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase flex items-center justify-between">
            <span>{bn ? 'মডিউল / পৃষ্ঠা / অ্যাকশন' : 'Module / Page / Action'}</span>
            <span>{role.permissions.filter((p) => Object.values(p.actions).some(Boolean)).length} {bn ? 'সক্রিয়' : 'active'}</span>
          </div>
          <div className="divide-y divide-[var(--border)]/50">
            {filteredTree.map((node) => renderNode(node))}
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[0.75rem] text-[var(--text-muted)]">
            {role.isSystemRole ? (bn ? 'সিস্টেম ভূমিকা — মুছে ফেলা যাবে না' : 'System role — cannot be deleted') : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="h-9 px-4 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-medium border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="h-9 px-5 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? (bn ? 'সংরক্ষিত!' : 'Saved!') : (bn ? 'সংরক্ষণ করুন' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}
