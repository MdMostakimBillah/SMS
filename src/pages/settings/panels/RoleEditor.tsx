import { useState, useMemo, useCallback } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import {
  Save, Search, Check, ChevronDown, ChevronRight, Sparkles, Users, Plus, Trash2,
  UserPlus, X, Lock, Copy, GraduationCap, Building2, CalendarCheck, ClipboardList,
  Landmark, Wallet, Briefcase, ShoppingBag, FileBarChart, Bus, Home, MessageCircle,
  Megaphone, Bell, BookOpen, Video, Settings, LayoutDashboard, Library, BarChart2,
} from 'lucide-react'
import { usePermissionStore, type PermissionAction } from '@/store/permissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { usePermission } from '@/hooks/usePermission'
import { PERMISSION_TREE, getPermissionNode, ROLE_TEMPLATES, type PermissionNode, type ActionSet, createActionSet } from '@/lib/permissionConfig'
import type { PermissionEntry } from '@/store/permissionStore'
import type { LucideIcon } from 'lucide-react'

interface Props {
  isBn: boolean
  roleId: string | null
  onBack: () => void
  onCreated?: (newRoleId: string) => void
}

const MODULE_CONFIG: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  students: Users,
  teachers: GraduationCap,
  classes: Building2,
  attendance: CalendarCheck,
  exams: ClipboardList,
  finance: Landmark,
  payroll: Wallet,
  hr: Briefcase,
  store: ShoppingBag,
  accounting: FileBarChart,
  library: Library,
  transport: Bus,
  hostel: Home,
  messages: MessageCircle,
  notice: Megaphone,
  notifications: Bell,
  syllabus: BookOpen,
  assignments: FileBarChart,
  online: Video,
  reports: BarChart2,
  settings: Settings,
}

const PRESET_ICONS: Record<string, LucideIcon> = {
  teacher: GraduationCap,
  class_teacher: Building2,
  accountant: Landmark,
  hr_manager: Briefcase,
  librarian: Library,
  exam_controller: ClipboardList,
  transport_staff: Bus,
  receptionist: Users,
}

export function RoleEditor({ isBn, roleId, onBack, onCreated }: Props) {
  const bn = isBn
  const { roles, addRole, updateRole, setRolePerm, setRolePermAll, applyPreset, staffPermissions, addStaff, removeStaff, setStaffPassword } = usePermissionStore()
  const { teachers, departments } = useTeacherStore()
  const { canManage } = usePermission()
  const role = roleId ? roles.find((r) => r.id === roleId) : null
  const isCreate = !roleId

  const [name, setName] = useState(role?.name || '')
  const [nameBn, setNameBn] = useState(role?.nameBn || '')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(PERMISSION_TREE.map((n) => n.key)))
  const [showPresets, setShowPresets] = useState(false)
  const [saved, setSaved] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(roleId)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [staffSearch, setStaffSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  // Local permissions for create mode (before role is saved)
  const [localPerms, setLocalPerms] = useState<Map<string, ActionSet>>(new Map())

  const activeRoleId = createdId || roleId

  // ─── Permission helpers (work in both create + edit mode) ───

  const getPerm = useCallback((key: string): ActionSet => {
    // Edit mode: read from role
    if (activeRoleId && role) {
      const entry = role.permissions.find((p) => p.key === key)
      return entry?.actions || createActionSet()
    }
    // Create mode: read from local state
    return localPerms.get(key) || createActionSet()
  }, [activeRoleId, role, localPerms])

  const isAllActionsChecked = useCallback((key: string): boolean => {
    // Collect all descendant leaf keys using full dot-separated keys
    const collectLeafKeys = (fullKey: string): string[] => {
      const n = getPermissionNode(fullKey)
      if (!n || !n.children || n.children.length === 0) return [fullKey]
      return n.children.flatMap((c) => collectLeafKeys(`${fullKey}.${c.key}`))
    }
    const leafKeys = collectLeafKeys(key)
    return leafKeys.length > 0 && leafKeys.every((lk) => {
      const leafNode = getPermissionNode(lk)
      if (!leafNode) return false
      const perm = getPerm(lk)
      return leafNode.actions.every((a) => perm[a])
    })
  }, [getPerm])

  const isSomeActionsChecked = useCallback((key: string): boolean => {
    // Check if any descendant leaf has any action enabled
    const collectLeafKeys = (fullKey: string): string[] => {
      const n = getPermissionNode(fullKey)
      if (!n || !n.children || n.children.length === 0) return [fullKey]
      return n.children.flatMap((c) => collectLeafKeys(`${fullKey}.${c.key}`))
    }
    const leafKeys = collectLeafKeys(key)
    const someEnabled = leafKeys.some((lk) => {
      const perm = getPerm(lk)
      return Object.values(perm).some(Boolean)
    })
    return someEnabled && !isAllActionsChecked(key)
  }, [getPerm, isAllActionsChecked])

  const isModuleExpanded = (key: string) => expanded.has(key)

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        // Remove all descendants when collapsing
        const removeDescendants = (nodeKey: string) => {
          for (const k of next) {
            if (k.startsWith(nodeKey + '.')) {
              next.delete(k)
              removeDescendants(k)
            }
          }
        }
        removeDescendants(key)
      } else {
        next.add(key)
        // Auto-expand direct children so their CRUD buttons show
        const node = getPermissionNode(key)
        if (node?.children) {
          node.children.forEach((c) => {
            const childKey = key + '.' + c.key
            next.add(childKey)
          })
        }
      }
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

  // ─── Toggle actions (works in both modes) ───

  const handleToggleAction = useCallback((key: string, action: PermissionAction) => {
    if (activeRoleId && role) {
      // Edit mode: use store
      const current = getPerm(key)
      setRolePerm(activeRoleId, key, action, !current[action])
    } else {
      // Create mode: update local state
      setLocalPerms((prev) => {
        const next = new Map(prev)
        const current = next.get(key) || createActionSet()
        next.set(key, { ...current, [action]: !current[action] })
        return next
      })
    }
  }, [activeRoleId, role, getPerm, setRolePerm])

  const handleToggleAll = useCallback((key: string) => {
    const allChecked = isAllActionsChecked(key)
    const node = getPermissionNode(key)
    if (!node) return

    // Collect all descendant leaf keys using full dot-separated keys
    const collectLeafKeys = (fullKey: string): string[] => {
      const n = getPermissionNode(fullKey)
      if (!n || !n.children || n.children.length === 0) return [fullKey]
      return n.children.flatMap((c) => collectLeafKeys(`${fullKey}.${c.key}`))
    }
    const leafKeys = collectLeafKeys(key)

    if (activeRoleId && role) {
      // Edit mode: toggle all leaves via store
      leafKeys.forEach((lk) => setRolePermAll(activeRoleId, lk, !allChecked))
    } else {
      // Create mode: update local state for all leaves
      setLocalPerms((prev) => {
        const next = new Map(prev)
        leafKeys.forEach((lk) => {
          const leafNode = getPermissionNode(lk)
          if (!leafNode) return
          const actions: ActionSet = createActionSet()
          leafNode.actions.forEach((a) => { actions[a] = !allChecked })
          next.set(lk, actions)
        })
        return next
      })
    }
  }, [activeRoleId, role, isAllActionsChecked, setRolePermAll])

  // ─── Presets ───

  const handlePreset = (key: string) => {
    if (activeRoleId && role) {
      applyPreset(activeRoleId, key)
    }
    setShowPresets(false)
  }

  // ─── Save ───

  const handleSave = () => {
    if (isCreate) {
      // Convert localPerms to PermissionEntry[]
      const permissions: PermissionEntry[] = []
      localPerms.forEach((actions, key) => {
        if (Object.values(actions).some(Boolean)) {
          permissions.push({ key, actions })
        }
      })
      const newId = addRole({
        name: name || 'New Role',
        nameBn: nameBn || 'নতুন ভূমিকা',
        description: '',
        descriptionBn: '',
        permissions,
        dataScope: 'all',
        isSystemRole: false,
      })
      setCreatedId(newId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onCreated?.(newId)
    } else if (activeRoleId) {
      updateRole(activeRoleId, { name, nameBn })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  // ─── Staff ───

  const assignedStaff = useMemo(() => {
    if (!activeRoleId) return []
    return staffPermissions.filter((s) => s.roleId === activeRoleId)
  }, [staffPermissions, activeRoleId])

  const availableTeachers = useMemo(() => {
    const assignedIds = new Set(assignedStaff.map((s) => s.staffId))
    let filtered = teachers.filter((t) => !assignedIds.has(t.id))
    if (deptFilter) {
      filtered = filtered.filter((t) => t.departmentId === deptFilter)
    }
    if (staffSearch.trim()) {
      const q = staffSearch.toLowerCase()
      filtered = filtered.filter((t) =>
        t.nameEn.toLowerCase().includes(q) || t.nameBn.includes(q)
      )
    }
    return filtered
  }, [teachers, assignedStaff, staffSearch, deptFilter])

  const handleAddStaffMember = (teacherId: string) => {
    if (!activeRoleId) return
    const teacher = teachers.find((t) => t.id === teacherId)
    if (!teacher) return
    addStaff({
      staffId: teacher.id,
      staffName: teacher.nameEn,
      staffNameBn: teacher.nameBn,
      roleId: activeRoleId,
      email: teacher.email,
      defaultPassword: '123456',
    })
  }

  // ─── Count active permissions ───

  const activePermCount = useMemo(() => {
    let count = 0
    if (activeRoleId && role) {
      count = role.permissions.filter((p) => Object.values(p.actions).some(Boolean)).length
    } else {
      localPerms.forEach((actions) => {
        if (Object.values(actions).some(Boolean)) count++
      })
    }
    return count
  }, [activeRoleId, role, localPerms])

  // ─── Render ───

  const actionLabels: Record<PermissionAction, string> = {
    view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
    approve: 'Approve', reject: 'Reject', print: 'Print', export: 'Export',
    import: 'Import', download: 'Download', publish: 'Publish', manage: 'Manage', configure: 'Configure',
  }

  // Count total leaf nodes for summary
  const totalLeafCount = useMemo(() => {
    const countLeaves = (nodes: PermissionNode[]): number => {
      return nodes.reduce((acc, node) => {
        if (!node.children || node.children.length === 0) return acc + 1
        return acc + countLeaves(node.children)
      }, 0)
    }
    return countLeaves(PERMISSION_TREE)
  }, [])

  const renderNode = (node: PermissionNode, depth = 0, parentPath = '') => {
    const fullKey = parentPath ? `${parentPath}.${node.key}` : node.key
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = isModuleExpanded(fullKey)
    const allChecked = isAllActionsChecked(fullKey)
    const someChecked = isSomeActionsChecked(fullKey)
    const isModule = depth === 0
    const ModIcon = isModule ? MODULE_CONFIG[node.key] : null

    // Module card (depth 0)
    if (isModule) {
      const isLeaf = !hasChildren
      return (
        <div
          key={fullKey}
          className="rounded-xl border border-[var(--border)] overflow-hidden"
        >
          {/* Module header */}
          <button
            onClick={() => !isLeaf && toggleExpand(fullKey)}
            className={`w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-secondary)] transition-colors text-left border-none ${
              isLeaf ? 'cursor-default' : 'hover:bg-[var(--bg-tertiary)] cursor-pointer'
            }`}
          >
            {ModIcon && (
              <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center shrink-0">
                <ModIcon size={16} className="text-[var(--brand)]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                {bn ? node.labelBn : node.label}
              </div>
            </div>
            {isLeaf ? (
              <span className="text-[0.625rem] text-[var(--text-muted)]">
                {node.actions.length} {bn ? 'অ্যাকশন' : 'actions'}
              </span>
            ) : (
              <>
                <span className="text-[0.625rem] text-[var(--text-muted)] mr-2">
                  {node.children?.length || 0} {bn ? 'পৃষ্ঠা' : 'pages'}
                </span>
                <div className="shrink-0 text-[var(--text-muted)]">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </>
            )}
          </button>

          {/* Leaf module — show action buttons directly */}
          {isLeaf && (
            <div className="border-t border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleToggleAll(fullKey)}
                  className={`w-[18px] h-[18px] rounded flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                    allChecked
                      ? 'bg-[var(--brand)] text-white border-none'
                      : someChecked
                      ? 'bg-[var(--brand)]/20 text-[var(--brand)] border-none'
                      : 'bg-transparent border-2 border-solid border-[var(--text-muted)]/30 text-transparent'
                  }`}
                >
                  {(allChecked || someChecked) && <Check size={11} className={allChecked ? 'text-white' : ''} />}
                </button>
                <span className="text-[0.8125rem] text-[var(--text-secondary)]">
                  {bn ? 'সব অ্যাকশন' : 'All Actions'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {node.actions.map((action) => {
                  const checked = getPerm(fullKey)[action]
                  return (
                    <button
                      key={action}
                      onClick={() => handleToggleAction(fullKey, action)}
                      className={`h-[26px] px-2.5 rounded-md text-[0.6875rem] font-medium border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                          : 'bg-[var(--bg-primary)] border-[var(--border-2)] text-[var(--text-muted)] hover:border-[var(--brand)]/40 hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {actionLabels[action]}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Module children (non-leaf) */}
          {isExpanded && hasChildren && (
            <div className="border-t border-[var(--border)]">
              {node.children!.map((child) => renderNode(child, depth + 1, fullKey))}
            </div>
          )}
        </div>
      )
    }

    // Sub-page with children (depth 1+)
    if (hasChildren) {
      return (
        <div key={fullKey}>
          <div
            className="flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--bg-secondary)]/30 transition-colors"
            style={{ paddingLeft: `${depth * 16 + 16}px` }}
          >
            <button
              onClick={() => toggleExpand(fullKey)}
              className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] bg-transparent border-none cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>

            <button
              onClick={() => handleToggleAll(fullKey)}
              className={`w-[18px] h-[18px] rounded flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                allChecked
                  ? 'bg-[var(--brand)] text-white border-none'
                  : someChecked
                  ? 'bg-[var(--brand)]/20 text-[var(--brand)] border-none'
                  : 'bg-transparent border-2 border-solid border-[var(--text-muted)]/30 text-transparent'
              }`}
            >
              {(allChecked || someChecked) && <Check size={11} className={allChecked ? 'text-white' : ''} />}
            </button>

            <span className="text-[0.8125rem] font-medium text-[var(--text-primary)] flex-1">
              {bn ? node.labelBn : node.label}
            </span>

            <span className="text-[0.5625rem] text-[var(--text-muted)]">
              {node.children!.length}
            </span>
          </div>

          {isExpanded && (
            <div>
              {node.children!.map((child) => renderNode(child, depth + 1, fullKey))}
            </div>
          )}
        </div>
      )
    }

    // Leaf node — checkbox + label LEFT, action buttons RIGHT
    return (
      <div
        key={fullKey}
        className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--bg-secondary)]/20 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 16}px` }}
      >
        <button
          onClick={() => handleToggleAll(fullKey)}
          className={`w-[18px] h-[18px] rounded flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
            allChecked
              ? 'bg-[var(--brand)] text-white border-none'
              : someChecked
              ? 'bg-[var(--brand)]/20 text-[var(--brand)] border-none'
              : 'bg-transparent border-2 border-solid border-[var(--text-muted)]/30 text-transparent'
          }`}
        >
          {(allChecked || someChecked) && <Check size={11} className={allChecked ? 'text-white' : ''} />}
        </button>

        <span className="text-[0.8125rem] text-[var(--text-secondary)] flex-1 min-w-0 truncate">
          {bn ? node.labelBn : node.label}
        </span>

        {/* Action buttons — right side, single row */}
        <div className="flex items-center gap-1 shrink-0">
          {node.actions.map((action) => {
            const checked = getPerm(fullKey)[action]
            return (
              <button
                key={action}
                onClick={() => handleToggleAction(fullKey, action)}
                className={`h-[26px] px-2.5 rounded-md text-[0.6875rem] font-medium border cursor-pointer transition-colors ${
                  checked
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm'
                    : 'bg-[var(--bg-primary)] border-[var(--border-2)] text-[var(--text-muted)] hover:border-[var(--brand)]/40 hover:text-[var(--text-secondary)]'
                }`}
              >
                {actionLabels[action]}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <SettingsPanel
      title={isCreate ? (bn ? 'নতুন ভূমিকা' : 'Create Role') : (role?.name || '')}
      titleBn={isCreate ? 'নতুন ভূমিকা' : (role?.nameBn || '')}
      isBn={bn}
      onBack={onBack}
    >
      <div className="space-y-5">
        {/* Role Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1 block">
              {bn ? 'নাম (ইংরেজি)' : 'Name (EN)'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={bn ? 'যেমন: সিনিয়র শিক্ষক' : 'e.g. Senior Teacher'}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
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
              placeholder={bn ? 'যেমন: সিনিয়র শিক্ষক' : 'যেমন: সিনিয়র শিক্ষক'}
              className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
            />
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
                {Object.entries(ROLE_TEMPLATES).map(([key, tmpl]) => {
                  const PIcon = PRESET_ICONS[key] || Users
                  const permCount = (tmpl.permissions?.length || 0) + (tmpl.fullAccess?.length || 0)
                  return (
                    <button
                      key={key}
                      onClick={() => handlePreset(key)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-left cursor-pointer hover:border-[var(--brand)]/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center shrink-0">
                        <PIcon size={16} className="text-[var(--brand)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                          {bn ? tmpl.labelBn : tmpl.label}
                        </div>
                        <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                          {bn ? tmpl.descriptionBn : tmpl.description}
                        </div>
                      </div>
                      <span className="text-[0.5625rem] text-[var(--text-muted)] shrink-0">
                        {permCount}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Permission Summary Bar */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-[var(--brand)]" />
              <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {bn ? 'অনুমতি' : 'Permissions'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Select all modules
                  PERMISSION_TREE.forEach((node) => handleToggleAll(node.key))
                }}
                className="text-[0.6875rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-none font-medium"
              >
                {bn ? 'সব নির্বাচন' : 'Select All'}
              </button>
              <button
                onClick={() => {
                  // Deselect all modules
                  PERMISSION_TREE.forEach((node) => {
                    if (isAllActionsChecked(node.key)) handleToggleAll(node.key)
                  })
                }}
                className="text-[0.6875rem] text-[var(--text-muted)] hover:text-[var(--red)] hover:underline cursor-pointer bg-transparent border-none font-medium"
              >
                {bn ? 'সব বাদ দিন' : 'Clear All'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-all duration-300"
                style={{ width: `${totalLeafCount > 0 ? (activePermCount / totalLeafCount) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[0.75rem] text-[var(--text-muted)] font-medium shrink-0">
              {activePermCount}/{totalLeafCount}
            </span>
          </div>
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
        <div className="flex flex-col gap-3">
          {filteredTree.map((node) => renderNode(node))}
        </div>

        {/* Staff Section — always visible */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[var(--brand)]" />
              <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {bn ? 'শিক্ষক/স্টাফ নির্বাচন করুন' : 'Select Teachers / Staff'}
              </span>
              {activeRoleId && (
                <span className="text-[0.625rem] text-[var(--text-muted)]">
                  ({assignedStaff.length} {bn ? 'নির্ধারিত' : 'assigned'})
                </span>
              )}
            </div>
            {canManage('settings.roles') && (
              <button
                onClick={() => { setShowAddStaff(!showAddStaff); setStaffSearch(''); setDeptFilter('') }}
                disabled={!activeRoleId}
                className={`h-7 px-2.5 rounded-lg text-[0.6875rem] font-medium border-none cursor-pointer transition-colors flex items-center gap-1 ${
                  !activeRoleId
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
                    : showAddStaff
                    ? 'bg-[var(--red)]/10 text-[var(--red)] hover:bg-[var(--red)]/20'
                    : 'bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/20'
                }`}
              >
                {showAddStaff ? <X size={12} /> : <UserPlus size={12} />}
                {showAddStaff ? (bn ? 'বন্ধ করুন' : 'Close') : (bn ? 'শিক্ষক যোগ করুন' : 'Add Teachers')}
              </button>
            )}
          </div>

          {/* Add Staff Panel */}
          {showAddStaff && (
            <div className="mb-3 rounded-xl border border-[var(--brand)]/20 bg-[var(--bg-secondary)] overflow-hidden">
              <div className="p-3 border-b border-[var(--border)] space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder={bn ? 'নাম দিয়ে খুঁজুন...' : 'Search by name...'}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
                  />
                </div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                >
                  <option value="">{bn ? 'সব বিভাগ' : 'All Departments'}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{bn ? d.nameBn || d.name : d.name}</option>
                  ))}
                </select>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {availableTeachers.length === 0 ? (
                  <div className="text-center py-6">
                    <Users size={20} className="text-[var(--text-muted)] mx-auto mb-1.5 opacity-40" />
                    <div className="text-[0.75rem] text-[var(--text-muted)]">
                      {staffSearch || deptFilter
                        ? (bn ? 'কোনো শিক্ষক পাওয়া যায়নি' : 'No teachers found')
                        : (bn ? 'সব শিক্ষক/স্টাফ ইতিমধ্যে নির্ধারিত' : 'All teachers/staff already assigned')}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]/50">
                    {availableTeachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        onClick={() => handleAddStaffMember(teacher.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-[var(--brand)]/5 transition-colors text-left bg-transparent border-none cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-[var(--brand)]/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {teacher.photo ? (
                            <img src={teacher.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">
                              {teacher.nameEn.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
                            {bn ? teacher.nameBn : teacher.nameEn}
                          </div>
                        </div>
                        <Plus size={14} className="text-[var(--brand)] shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned Staff List */}
          {!activeRoleId ? (
            <div className="text-center py-4 rounded-xl border border-dashed border-[var(--border)]">
              <Users size={20} className="text-[var(--text-muted)] mx-auto mb-1.5 opacity-40" />
              <div className="text-[0.75rem] text-[var(--text-muted)]">
                {bn ? 'প্রথমে ভূমিকা সংরক্ষণ করুন, তারপর শিক্ষক যোগ করুন' : 'Save the role first, then assign teachers'}
              </div>
            </div>
          ) : assignedStaff.length === 0 ? (
            <div className="text-center py-4 rounded-xl border border-dashed border-[var(--border)]">
              <Users size={20} className="text-[var(--text-muted)] mx-auto mb-1.5 opacity-40" />
              <div className="text-[0.75rem] text-[var(--text-muted)]">
                {bn ? 'এই ভূমিকায় কোনো স্টাফ নেই — উপরের বোতাম দিয়ে যোগ করুন' : 'No staff assigned — click "Add Teachers" above'}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {assignedStaff.map((member) => {
                const teacher = teachers.find((t) => t.id === member.staffId)
                return (
                  <StaffMemberCard
                    key={member.id}
                    member={member}
                    teacher={teacher}
                    bn={bn}
                    onRemove={() => removeStaff(member.id)}
                    onPasswordChange={(pw) => setStaffPassword(member.id, pw)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex items-center justify-end pt-2">
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="h-9 px-4 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-medium border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            {canManage('settings.roles') && (
              <button
                onClick={handleSave}
                className="h-9 px-5 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                {saved ? (bn ? 'সংরক্ষিত!' : 'Saved!') : (bn ? 'সংরক্ষণ করুন' : 'Save')}
              </button>
            )}
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}

function StaffMemberCard({ member, teacher, bn, onRemove, onPasswordChange }: {
  member: { id: string; staffId: string; staffName: string; staffNameBn: string; email: string; defaultPassword: string }
  teacher: { photo?: string } | undefined
  bn: boolean
  onRemove: () => void
  onPasswordChange: (pw: string) => void
}) {
  const { canManage } = usePermission()
  const [editing, setEditing] = useState(false)
  const [pw, setPw] = useState(member.defaultPassword)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(member.email + ' / ' + member.defaultPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSavePw = () => {
    if (pw.trim()) {
      onPasswordChange(pw.trim())
      setEditing(false)
    }
  }

  return (
    <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--brand)]/10 flex items-center justify-center shrink-0 overflow-hidden">
            {teacher?.photo ? (
              <img src={teacher.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[0.625rem] font-semibold text-[var(--brand)]">
                {member.staffName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>
          <div>
            <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
              {bn ? member.staffNameBn : member.staffName}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">
              {bn ? 'লগইন আইডি' : 'Login ID'}: {member.email}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Lock size={10} className="text-[var(--text-muted)]" />
              {editing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePw()}
                    className="h-6 px-1.5 w-24 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[0.6875rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                    autoFocus
                  />
                  <button
                    onClick={handleSavePw}
                    className="p-0.5 rounded bg-[var(--brand)]/10 text-[var(--brand)] border-none cursor-pointer"
                  >
                    <Check size={10} />
                  </button>
                  <button
                    onClick={() => { setEditing(false); setPw(member.defaultPassword) }}
                    className="p-0.5 rounded bg-[var(--red)]/10 text-[var(--red)] border-none cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <span
                  className="text-[0.6875rem] text-[var(--text-muted)] cursor-pointer hover:text-[var(--brand)]"
                  onClick={() => setEditing(true)}
                >
                  {bn ? 'পাসওয়ার্ড' : 'Password'}: {member.defaultPassword}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand)]/10 cursor-pointer bg-transparent border-none transition-colors"
            title={bn ? 'কপি করুন' : 'Copy credentials'}
          >
            {copied ? <Check size={13} className="text-[var(--green)]" /> : <Copy size={13} />}
          </button>
          {canManage('settings.roles') && (
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 cursor-pointer bg-transparent border-none transition-colors"
              title={bn ? 'সরান' : 'Remove'}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
