import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  UserCheck,
  UserPlus,
  Zap,
  Trash2,
  Search,
  Download,
  Upload,
  Fingerprint,
  ScanFace,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import { useAttendanceStore } from '@/store/attendanceStore'
import type { DeviceEntry, Person, DeviceEnrolledUser } from '../types'

interface DeviceEnrollmentModalProps {
  isBn: boolean
  device: DeviceEntry
  onClose: () => void
  allPeople: Person[]
  onSimulatePunch?: (personId: string, method?: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile', deviceId?: string) => Promise<any>
}

export function DeviceEnrollmentModal({
  isBn,
  device,
  onClose,
  allPeople,
  onSimulatePunch,
}: DeviceEnrollmentModalProps) {
  const store = useAttendanceStore()
  const [activeTab, setActiveTab] = useState<'enrolled' | 'enroll' | 'usb'>('enrolled')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'student' | 'staff'>('all')
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pinOverrides, setPinOverrides] = useState<Record<string, string>>({})
  const [cardOverrides, setCardOverrides] = useState<Record<string, string>>({})
  const [testingPunchId, setTestingPunchId] = useState<string | null>(null)
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null)
  const [importFeedback, setImportFeedback] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Get current device from store to reflect live enrollment updates
  const currentDev = store.devices.find((d) => d.id === device.id) || device
  const enrolledUsers = currentDev.enrolledUsers || []

  // Extract unique classes and departments for filters
  const availableClasses = useMemo(() => {
    const set = new Set<string>()
    allPeople.forEach((p) => {
      if (p.type === 'student' && p.dept) set.add(p.dept)
    })
    return Array.from(set).sort()
  }, [allPeople])

  const availableDepts = useMemo(() => {
    const set = new Set<string>()
    allPeople.forEach((p) => {
      if (p.type === 'staff' && p.dept) set.add(p.dept)
    })
    return Array.from(set).sort()
  }, [allPeople])

  // People not yet enrolled on this device
  const unenrolledPeople = useMemo(() => {
    const enrolledIds = new Set(enrolledUsers.map((m) => m.personId))
    return allPeople.filter((p) => !enrolledIds.has(p.id))
  }, [allPeople, enrolledUsers])

  // Filtered lists
  const filteredEnrolled = useMemo(() => {
    return enrolledUsers.filter((u) => {
      if (filterType !== 'all' && u.personType !== filterType) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          u.personName.toLowerCase().includes(q) ||
          u.personId.toLowerCase().includes(q) ||
          u.devicePin.includes(q) ||
          (u.cardNo && u.cardNo.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [enrolledUsers, filterType, search])

  const filteredUnenrolled = useMemo(() => {
    return unenrolledPeople.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false
      if (p.type === 'student' && filterClass !== 'all' && p.dept !== filterClass) return false
      if (p.type === 'staff' && filterDept !== 'all' && p.dept !== filterDept) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.section && p.section.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [unenrolledPeople, filterType, filterClass, filterDept, search])

  // Bulk selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredUnenrolled.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredUnenrolled.map((p) => p.id)))
    }
  }

  const handleEnrollSelected = () => {
    if (selectedIds.size === 0) return
    const highestExistingPin = enrolledUsers.reduce((max, u) => {
      const num = parseInt(u.devicePin, 10)
      return !isNaN(num) && num > max ? num : max
    }, 1000)

    let nextPin = highestExistingPin + 1
    const newMembers: DeviceEnrolledUser[] = []

    for (const p of unenrolledPeople) {
      if (!selectedIds.has(p.id)) continue
      const customPin = pinOverrides[p.id] || String(nextPin++)
      const customCard = cardOverrides[p.id] || `CARD-${customPin}`
      newMembers.push({
        personId: p.id,
        personType: p.type,
        personName: p.name,
        devicePin: customPin,
        cardNo: customCard,
        fpEnrolled: true,
        faceEnrolled: device.type === 'face' || device.type === 'multi',
        enrolledAt: new Date().toISOString().split('T')[0],
        syncStatus: 'synced',
      })
    }

    store.enrollMembersToDevice(device.id, newMembers)
    setSelectedIds(new Set())
    setActiveTab('enrolled')
    setPunchFeedback(
      isBn
        ? `${newMembers.length} জন সদস্য সফলভাবে এই ডিভাইসে নিবন্ধিত হয়েছেন!`
        : `Successfully registered ${newMembers.length} members to ${device.name}!`
    )
    setTimeout(() => setPunchFeedback(null), 3500)
  }

  const handleTriggerTestPunch = async (member: DeviceEnrolledUser) => {
    setTestingPunchId(member.personId)
    try {
      if (onSimulatePunch) {
        const method = device.type === 'punch' || device.type === 'multi' ? 'punch' : (device.type as any)
        await onSimulatePunch(member.personId, method, device.id)
      } else {
        await store.recordPunch({
          personId: member.personId,
          method: 'punch',
          deviceId: device.id,
        })
      }
      setPunchFeedback(
        isBn
          ? `পাঞ্চ সফল! ${member.personName} (PIN: ${member.devicePin}) হাজিরায় প্রেজেন্ট মার্ক হয়েছে।`
          : `Punch Verified! ${member.personName} marked Present on ${device.name}.`
      )
      setTimeout(() => setPunchFeedback(null), 3000)
    } finally {
      setTimeout(() => setTestingPunchId(null), 600)
    }
  }

  // Export CSV for physical device
  const handleExportUserFile = () => {
    const headers = ['Device_PIN', 'Name', 'Card_No', 'Type', 'Privilege']
    const rows = enrolledUsers.map((u) => [
      u.devicePin,
      `"${u.personName.replace(/"/g, '""')}"`,
      u.cardNo || '',
      u.personType,
      u.personType === 'staff' ? 'Admin' : 'User',
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user_export_${device.name.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import USB punch logs
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportFeedback(null)

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/)
      const parsedRecords: Array<{ pin: string; time: string; date?: string; type?: 'in' | 'out' }> = []

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        // Supports CSV (pin,date,time) or Tab/Space separated ZKTeco attlog.dat
        const parts = trimmed.includes(',') ? trimmed.split(',') : trimmed.split(/\s+/)
        if (parts.length >= 2) {
          const pin = parts[0].trim()
          let date = new Date().toISOString().split('T')[0]
          let time = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`

          if (parts[1].includes('-') || parts[1].includes('/')) {
            date = parts[1].trim()
            if (parts[2]) time = parts[2].slice(0, 5)
          } else if (parts[1].includes(':')) {
            time = parts[1].slice(0, 5)
          }
          parsedRecords.push({ pin, date, time })
        }
      }

      if (parsedRecords.length === 0) {
        setImportFeedback(isBn ? 'ফাইলে কোনো ভ্যালিড পাঞ্চ পাওয়া যায়নি।' : 'No valid punch records found.')
        return
      }

      const res = await store.importUsbPunchLogs(device.id, parsedRecords)
      setImportFeedback(
        isBn
          ? `ইউএসবি সিঙ্ক সম্পন্ন! মোট ${res.processed} টির মধ্যে ${res.matched} টি পাঞ্চ হাজিরায় রেকর্ড হয়েছে।`
          : `USB Sync Completed: ${res.matched} of ${res.processed} punches recorded.`
      )
    } catch {
      setImportFeedback(isBn ? 'ফাইল রিড করতে ব্যর্থ হয়েছে।' : 'Failed to read punch log file.')
    } finally {
      setIsImporting(false)
      if (e.target) e.target.value = ''
    }
  }

  const studentCount = enrolledUsers.filter((m) => m.personType === 'student').length
  const staffCount = enrolledUsers.filter((m) => m.personType === 'staff').length

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '46rem', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7C3AED18] border border-[#7C3AED30] flex items-center justify-center text-[#7C3AED]">
              <UserCheck size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{device.name}</h3>
                <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] font-mono">
                  {device.model}
                </span>
                <span className={`w-2 h-2 rounded-full ${currentDev.status === 'online' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`} />
              </div>
              <p className="text-[0.625rem] text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                <span>IP: {device.ip}</span>
                <span>•</span>
                <span className="font-semibold text-[#7C3AED]">
                  {enrolledUsers.length} {isBn ? 'জন নিবন্ধিত' : 'Enrolled'} ({studentCount} {isBn ? 'শিক্ষার্থী' : 'Students'}, {staffCount} {isBn ? 'স্টাফ' : 'Staff'})
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <X size={14} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Feedback Alert */}
        {punchFeedback && (
          <div className="flex items-center gap-2 p-2.5 mb-3 rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.6875rem] font-medium">
            <CheckCircle2 size={14} />
            <span>{punchFeedback}</span>
          </div>
        )}

        {/* Sub Tabs */}
        <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
          <div className="flex gap-1.5 p-1 bg-[var(--bg-secondary)] rounded-lg text-[0.6875rem] font-medium">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer border-none transition-all ${
                activeTab === 'enrolled'
                  ? 'bg-[#7C3AED] text-white font-semibold shadow-sm'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserCheck size={13} />
              {isBn ? 'নিবন্ধিত সদস্যবৃন্দ' : 'Enrolled Members'} ({enrolledUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('enroll')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer border-none transition-all ${
                activeTab === 'enroll'
                  ? 'bg-[#7C3AED] text-white font-semibold shadow-sm'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserPlus size={13} />
              {isBn ? 'নতুন সদস্য নিবন্ধন' : 'Enroll New'} ({unenrolledPeople.length})
            </button>
            <button
              onClick={() => setActiveTab('usb')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer border-none transition-all ${
                activeTab === 'usb'
                  ? 'bg-[#7C3AED] text-white font-semibold shadow-sm'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Download size={13} />
              {isBn ? 'সিঙ্ক ও ইউএসবি' : 'Sync & USB'}
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[12rem] flex-1 max-w-xs">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBn ? 'নাম, আইডি বা পিন খুঁজুন...' : 'Search name, ID, PIN...'}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)] outline-none focus:border-[#7C3AED]"
            />
          </div>
        </div>

        {/* TAB 1: Enrolled Members */}
        {activeTab === 'enrolled' && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 text-[0.6875rem]">
              <div className="flex gap-1.5">
                {(['all', 'student', 'staff'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded-md cursor-pointer border capitalize ${
                      filterType === t
                        ? 'bg-[#7C3AED18] border-[#7C3AED] text-[#7C3AED] font-semibold'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {t === 'all' ? (isBn ? 'সবাই' : 'All') : t === 'student' ? (isBn ? 'শিক্ষার্থী' : 'Students') : (isBn ? 'স্টাফ' : 'Staff')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {enrolledUsers.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(isBn ? 'এই ডিভাইসে নিবন্ধিত সকল সদস্যের তালিকা মুছে ফেলতে চান?' : 'Clear all registered members from this device?')) {
                        enrolledUsers.forEach((u) => store.unenrollMemberFromDevice(device.id, u.personId))
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all flex items-center gap-1"
                    title={isBn ? 'সকল নিবন্ধিত সদস্য মুছুন' : 'Clear all members from device'}
                  >
                    <Trash2 size={10} />
                    <span>{isBn ? 'সকল সদস্য মুছুন' : 'Clear All Members'}</span>
                  </button>
                )}
                <span className="text-[var(--text-muted)]">{filteredEnrolled.length} {isBn ? 'জন' : 'people'}</span>
              </div>
            </div>

            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[22rem]">
                <table className="w-full border-collapse text-[0.75rem]">
                  <thead className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] z-10">
                    <tr>
                      <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'সদস্য' : 'Member'}</th>
                      <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">Device PIN</th>
                      <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">RFID Card</th>
                      <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'বায়োমেট্রিক' : 'Biometric'}</th>
                      <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnrolled.map((u) => (
                      <tr key={u.personId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]">
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[0.5625rem] px-1.5 py-0.5 rounded font-bold uppercase ${
                              u.personType === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {u.personType === 'student' ? 'STU' : 'STAFF'}
                            </span>
                            <div>
                              <div className="font-medium text-[var(--text-primary)]">{u.personName}</div>
                              <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">{u.personId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-[#7C3AED]">{u.devicePin}</td>
                        <td className="p-2.5 text-center font-mono text-[0.6875rem] text-[var(--text-secondary)]">{u.cardNo || '—'}</td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {u.fpEnrolled && (
                              <span title="Fingerprint Enrolled">
                                <Fingerprint size={12} className="text-[var(--amber)]" />
                              </span>
                            )}
                            {u.faceEnrolled && (
                              <span title="Face Scan Enrolled">
                                <ScanFace size={12} className="text-[var(--green)]" />
                              </span>
                            )}
                            {u.cardNo && (
                              <span title="RFID Card Assigned">
                                <CreditCard size={12} className="text-[var(--brand)]" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleTriggerTestPunch(u)}
                              disabled={testingPunchId === u.personId}
                              title={isBn ? 'টেস্ট পাঞ্চ পাঠান' : 'Trigger Test Punch'}
                              className="px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--brand-light)] hover:border-[var(--brand)] text-[var(--brand)] text-[0.625rem] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Zap size={11} className={testingPunchId === u.personId ? 'animate-pulse' : ''} />
                              {isBn ? 'পাঞ্চ' : 'Punch'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(isBn ? `"${u.personName}" কে এই ডিভাইস থেকে সরিয়ে দিতে চান?` : `Remove "${u.personName}" from this device?`)) {
                                  store.unenrollMemberFromDevice(device.id, u.personId)
                                }
                              }}
                              title={isBn ? 'মুছুন' : 'Remove'}
                              className="w-6 h-6 rounded bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--red-light)] hover:border-[var(--red)] text-[var(--red)] flex items-center justify-center cursor-pointer transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEnrolled.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                          {isBn ? 'এই ডিভাইসে এখনও কোনো সদস্য নিবন্ধিত নেই।' : 'No members registered on this device yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Enroll New Members */}
        {activeTab === 'enroll' && (
          <div>
            {/* Filter Bar */}
            <div className="p-2.5 mb-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center gap-2 flex-wrap text-[0.6875rem]">
              <div className="flex gap-1">
                {(['all', 'student', 'staff'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setFilterType(t)
                      setSelectedIds(new Set())
                    }}
                    className={`px-2.5 py-1 rounded-md cursor-pointer border capitalize ${
                      filterType === t
                        ? 'bg-[#7C3AED] text-white font-semibold'
                        : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {t === 'all' ? (isBn ? 'সব' : 'All') : t === 'student' ? (isBn ? 'শিক্ষার্থী' : 'Students') : (isBn ? 'স্টাফ' : 'Staff')}
                  </button>
                ))}
              </div>

              {/* Class Filter */}
              {(filterType === 'all' || filterType === 'student') && availableClasses.length > 0 && (
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.6875rem] text-[var(--text-secondary)] outline-none"
                >
                  <option value="all">{isBn ? 'সকল শ্রেণি (All Classes)' : 'All Classes'}</option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {/* Dept Filter */}
              {(filterType === 'all' || filterType === 'staff') && availableDepts.length > 0 && (
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.6875rem] text-[var(--text-secondary)] outline-none"
                >
                  <option value="all">{isBn ? 'সকল বিভাগ (All Depts)' : 'All Departments'}</option>
                  {availableDepts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}

              <div className="flex-1" />
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#7C3AED] cursor-pointer font-medium"
              >
                {selectedIds.size === filteredUnenrolled.length && filteredUnenrolled.length > 0
                  ? (isBn ? 'সব আন-সিলেক্ট' : 'Deselect All')
                  : (isBn ? 'সব সিলেক্ট করুন' : 'Select All')}
              </button>
            </div>

            {/* List */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden mb-3">
              <div className="overflow-x-auto max-h-[18rem]">
                <table className="w-full border-collapse text-[0.75rem]">
                  <thead className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] z-10">
                    <tr>
                      <th className="p-2.5 text-center w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === filteredUnenrolled.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'সদস্য' : 'Person'}</th>
                      <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'শ্রেণি / বিভাগ' : 'Class / Dept'}</th>
                      <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">Device PIN</th>
                      <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">RFID Card</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnenrolled.map((p, idx) => {
                      const isSelected = selectedIds.has(p.id)
                      const suggestedPin = pinOverrides[p.id] || String(1001 + idx + enrolledUsers.length)
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors ${
                            isSelected ? 'bg-[#7C3AED0A]' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(p.id)}
                            />
                          </td>
                          <td className="p-2.5">
                            <div className="font-medium text-[var(--text-primary)]">{p.name}</div>
                            <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">{p.id}</div>
                          </td>
                          <td className="p-2.5 text-[0.6875rem] text-[var(--text-secondary)]">
                            {p.dept || '—'} {p.section ? `(${p.section})` : ''}
                          </td>
                          <td className="p-2.5">
                            <input
                              value={suggestedPin}
                              onChange={(e) => setPinOverrides((prev) => ({ ...prev, [p.id]: e.target.value }))}
                              className="w-16 px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] font-mono outline-none"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              value={cardOverrides[p.id] || `CARD-${suggestedPin}`}
                              onChange={(e) => setCardOverrides((prev) => ({ ...prev, [p.id]: e.target.value }))}
                              className="w-24 px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] font-mono outline-none"
                            />
                          </td>
                        </tr>
                      )
                    })}
                    {filteredUnenrolled.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                          {isBn ? 'নিবন্ধন করার মতো কোনো নতুন সদস্য পাওয়া যায়নি।' : 'All people are already enrolled or no match.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enroll Action Footer */}
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] text-[var(--text-muted)]">
                {selectedIds.size} {isBn ? 'জন নির্বাচিত' : 'selected'}
              </span>
              <button
                disabled={selectedIds.size === 0}
                onClick={handleEnrollSelected}
                className={`px-4 py-2 rounded-lg text-white text-[0.75rem] font-semibold flex items-center gap-1.5 border-0 cursor-pointer shadow-sm transition-all ${
                  selectedIds.size > 0
                    ? 'bg-[#7C3AED] hover:opacity-90 active:scale-95'
                    : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
                }`}
              >
                <UserCheck size={14} />
                {isBn ? `নির্বাচিতদের (${selectedIds.size}) ডিভাইসে যুক্ত করুন` : `Enroll Selected (${selectedIds.size}) to Device`}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Device Sync & USB Tools */}
        {activeTab === 'usb' && (
          <div className="space-y-4 text-[0.75rem]">
            {importFeedback && (
              <div className="p-2.5 rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.6875rem] font-medium flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{importFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Card 1: Export Users */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#7C3AED18] text-[#7C3AED] flex items-center justify-center mb-2">
                    <Download size={16} />
                  </div>
                  <h4 className="font-bold text-[var(--text-primary)] mb-1">
                    {isBn ? 'মেশিনে লোড করার জন্য ইউজার ফাইল (CSV)' : 'Export User File for Machine (CSV)'}
                  </h4>
                  <p className="text-[0.625rem] text-[var(--text-muted)] leading-relaxed mb-3">
                    {isBn
                      ? 'ডিভাইসে নিবন্ধিত সকল শিক্ষার্থী ও স্টাফদের তালিকা CSV ফাইল হিসেবে পেনড্রাইভে ডাউনলোড করুন। ZKTeco বা Hikvision ডিভাইসে পেনড্রাইভ লাগিয়ে এক ক্লিকে লোড করা যাবে।'
                      : 'Download all enrolled users into a CSV file ready for USB pen drive upload into ZKTeco / Hikvision devices.'}
                  </p>
                </div>
                <button
                  onClick={handleExportUserFile}
                  disabled={enrolledUsers.length === 0}
                  className="w-full py-2 rounded-lg bg-[#7C3AED] text-white text-[0.6875rem] font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-0 hover:opacity-90"
                >
                  <Download size={13} />
                  {isBn ? `ইউজার ফাইল ডাউনলোড করুন (${enrolledUsers.length})` : `Download User File (${enrolledUsers.length})`}
                </button>
              </div>

              {/* Card 2: Import Punches */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[var(--green-light)] text-[var(--green)] flex items-center justify-center mb-2">
                    <Upload size={16} />
                  </div>
                  <h4 className="font-bold text-[var(--text-primary)] mb-1">
                    {isBn ? 'পেনড্রাইভ থেকে অফলাইন হাজিরা ইমপোর্ট' : 'Import USB Punch Log (attlog.dat)'}
                  </h4>
                  <p className="text-[0.625rem] text-[var(--text-muted)] leading-relaxed mb-3">
                    {isBn
                      ? 'মেশিন থেকে পেনড্রাইভে নামানো attlog.dat বা .csv ফাইলটি এখানে সিলেক্ট করুন। সফটওয়্যার প্রতিটি পাঞ্চ মিলিয়ে সবার হাজিরা প্রেজেন্ট মার্ক করবে।'
                      : 'Select attlog.dat or punch log CSV downloaded from your device. The system will match PINs and record punches for all people.'}
                  </p>
                </div>
                <label className="w-full py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-[0.6875rem] font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:border-[#7C3AED] transition-colors">
                  <Upload size={13} className={isImporting ? 'animate-bounce' : ''} />
                  <span>{isImporting ? (isBn ? 'ইমপোর্ট হচ্ছে...' : 'Importing...') : (isBn ? 'হাজিরা ফাইল আপলোড করুন' : 'Upload Punch File')}</span>
                  <input
                    type="file"
                    accept=".dat,.csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
