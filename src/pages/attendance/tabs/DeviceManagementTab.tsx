import { useState } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, Settings, Trash2, Wifi, WifiOff, X, Zap, Fingerprint, Sparkles } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import { useAttendanceStore } from '@/store/attendanceStore'
import type { DeviceEntry } from '../types'

interface DeviceManagementTabProps {
  isBn: boolean
  devices: DeviceEntry[]
  setDevices: React.Dispatch<React.SetStateAction<DeviceEntry[]>> | ((devices: DeviceEntry[] | ((prev: DeviceEntry[]) => DeviceEntry[])) => void)
  onSimulatePunch?: (personId: string, method?: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile', deviceId?: string) => Promise<any>
}

export function DeviceManagementTab({ isBn, devices, setDevices, onSimulatePunch }: DeviceManagementTabProps) {
  const { canDelete } = usePermission()
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null)
  const [testingPunchDevice, setTestingPunchDevice] = useState<string | null>(null)
  const [showDeviceSettings, setShowDeviceSettings] = useState<string | null>(null)
  const [deviceSettings, setDeviceSettings] = useState({
    autoSync: true,
    syncInterval: 5,
    playSound: true,
  })

  const handleTestConnection = async (id: string) => {
    setSyncingDevice(id)
    try {
      await useAttendanceStore.getState().testDeviceConnection(id)
    } finally {
      setSyncingDevice(null)
    }
  }

  const handleTriggerPunch = async (device: DeviceEntry) => {
    setTestingPunchDevice(device.id)
    try {
      if (onSimulatePunch) {
        // Find person from rfid or fp entries, or fallback to first person
        const store = useAttendanceStore.getState()
        const targetId = store.rfidEntries[0]?.staffId || store.fpEntries[0]?.staffId || 'TCH-2026-001'
        const method = device.type === 'punch' || device.type === 'multi' ? 'punch' : (device.type as any)
        await onSimulatePunch(targetId, method, device.id)
      }
    } finally {
      setTimeout(() => setTestingPunchDevice(null), 500)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4 text-[0.75rem] flex-wrap">
        <div className="flex items-center gap-4">
          <span className="text-[var(--text-muted)] font-medium">
            {devices.length} {isBn ? 'ডিভাইস' : 'devices'}
          </span>
          <span className="flex items-center gap-1 text-[var(--green)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            {devices.filter((d) => d.status === 'online').length} {isBn ? 'অনলাইন' : 'online'}
          </span>
          <span className="flex items-center gap-1 text-[var(--red)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
            {devices.filter((d) => d.status === 'offline').length} {isBn ? 'অফলাইন' : 'offline'}
          </span>
          <span className="text-[var(--text-muted)]">
            {devices.reduce((s, d) => s + (d.staffCount || 0), 0)} {isBn ? 'স্টাফ/শিক্ষার্থী' : 'enrolled'}
          </span>
        </div>
        {devices.length === 0 && (
          <button
            onClick={() => useAttendanceStore.getState().loadSampleDevices()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C3AED18] border border-[#7C3AED40] text-[#7C3AED] text-[0.6875rem] font-semibold cursor-pointer hover:bg-[#7C3AED25] transition-all"
          >
            <Sparkles size={12} />
            {isBn ? 'ডেমো ডিভাইস সেটআপ করুন' : 'Load Demo Devices'}
          </button>
        )}
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.75rem] table-fixed">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'ডিভাইস' : 'Device'}</th>
                <th className="p-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)]">IP</th>
                <th className="p-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'টাইপ' : 'Type'}</th>
                <th className="p-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'স্টাফ' : 'Staff'}</th>
                <th className="p-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'সিঙ্ক' : 'Sync'}</th>
                <th className="p-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'online' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`} />
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{d.name}</div>
                        <div className="text-[0.625rem] text-[var(--text-muted)] flex items-center gap-2">
                          <span>{d.model}</span>
                          {d.location && <span className="opacity-70">· {d.location}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[var(--text-secondary)]">
                    {d.ip}{d.port ? `:${d.port}` : ''}
                  </td>
                  <td className="p-3">
                    <span className={`text-[0.625rem] px-2 py-0.5 rounded-full font-medium ${
                      d.type === 'punch'
                        ? 'bg-blue-100 text-blue-700'
                        : d.type === 'rfid'
                        ? 'bg-purple-100 text-purple-700'
                        : d.type === 'fingerprint'
                        ? 'bg-amber-100 text-amber-700'
                        : d.type === 'face'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {d.type === 'punch' ? 'Punch' : d.type === 'rfid' ? 'RFID' : d.type === 'fingerprint' ? 'FP' : d.type === 'face' ? 'Face' : 'Multi'}
                    </span>
                  </td>
                  <td className="p-3 text-center text-[var(--text-secondary)]">{d.staffCount}</td>
                  <td className="p-3 text-center text-[0.625rem] text-[var(--text-muted)]">
                    {d.lastSync ? new Date(d.lastSync).toLocaleString('en', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' }) : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleTestConnection(d.id)}
                        disabled={syncingDevice === d.id}
                        title={isBn ? 'সংযোগ পরীক্ষা ও সিঙ্ক' : 'Test Connection & Sync'}
                        className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--green-light)] hover:border-[var(--green)] hover:text-[var(--green)] transition-all"
                      >
                        <RefreshCw size={11} className={syncingDevice === d.id ? 'animate-spin' : ''} />
                      </button>
                      {onSimulatePunch && (
                        <button
                          onClick={() => handleTriggerPunch(d)}
                          disabled={testingPunchDevice === d.id}
                          title={isBn ? 'টেস্ট পাঞ্চ পাঠান' : 'Send Test Punch'}
                          className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
                        >
                          <Zap size={11} className={testingPunchDevice === d.id ? 'animate-pulse text-[var(--brand)]' : ''} />
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeviceSettings(d.id)}
                        title={isBn ? 'এডিট' : 'Edit'}
                        className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
                      >
                        <Settings size={11} />
                      </button>
                      {canDelete('attendance.device') && (
                        <button
                          onClick={() => {
                            if (confirm(isBn ? `"${d.name}" মুছে ফেলতে চান?` : `Delete "${d.name}"?`)) {
                              setDevices((prev) => prev.filter((dev) => dev.id !== d.id))
                            }
                          }}
                          title={isBn ? 'মুছুন' : 'Delete'}
                          className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--red-light)] hover:border-[var(--red)] hover:text-[var(--red)] transition-all"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      <button
                        onClick={() => setDevices((prev) => prev.map((dev) => dev.id === d.id ? { ...dev, status: dev.status === 'online' ? 'offline' : 'online' } : dev))}
                        title={d.status === 'online' ? (isBn ? 'অফলাইন করুন' : 'Go Offline') : (isBn ? 'অনলাইন করুন' : 'Go Online')}
                        className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer transition-all ${d.status === 'online' ? 'bg-[var(--red-light)] border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white' : 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white'}`}
                      >
                        {d.status === 'online' ? <WifiOff size={11} /> : <Wifi size={11} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[var(--text-muted)]">
                    <Fingerprint size={36} className="mx-auto mb-2 opacity-30 text-[#7C3AED]" />
                    <div className="font-semibold text-[0.875rem] text-[var(--text-primary)] mb-1">
                      {isBn ? 'কোনো ডিভাইস কনফিগার করা নেই' : 'No Biometric Devices Configured'}
                    </div>
                    <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3.5 max-w-sm mx-auto">
                      {isBn
                        ? 'আপনার কাছে এখনই ফিজিক্যাল বায়োমেট্রিক ডিভাইস না থাকলেও উপরের "ডিভাইস যোগ" দিয়ে ডিভাইস সেটআপ ও টেস্ট করতে পারেন।'
                        : 'Even without physical biometric hardware right now, you can add devices or load sample devices to test full attendance workflows.'}
                    </p>
                    <button
                      onClick={() => useAttendanceStore.getState().loadSampleDevices()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-[0.75rem] font-semibold cursor-pointer border-0 hover:opacity-90 shadow-sm"
                    >
                      <Sparkles size={13} />
                      {isBn ? 'স্যাম্পল ডিভাইস লোড করুন' : 'Load Demo Devices'}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeviceSettings && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box" style={{ maxWidth: '25rem' }}>
            {(() => {
              const d = devices.find((dev) => dev.id === showDeviceSettings)
              if (!d) return null
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
                      {isBn ? 'ডিভাইস সেটিং' : 'Device Settings'}
                    </h3>
                    <button
                      onClick={() => setShowDeviceSettings(null)}
                      className="w-7 h-7 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
                    >
                      <X size={14} className="text-[var(--text-secondary)]" />
                    </button>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'ডিভাইস' : 'Device'}</span>
                      <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">{d.name}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'মডেল' : 'Model'}</span>
                      <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">{d.model}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-[0.6875rem] text-[var(--text-secondary)]">IP</span>
                      <span className="text-[0.6875rem] font-mono font-semibold text-[var(--text-primary)]">{d.ip}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                      <span className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'সিঙ্ক ইন্টারভাল' : 'Sync Interval'}</span>
                      <select
                        value={deviceSettings.syncInterval}
                        onChange={(e) => setDeviceSettings((s) => ({ ...s, syncInterval: +e.target.value }))}
                        className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.625rem] text-[var(--text-secondary)]"
                      >
                        <option value={5}>5 {isBn ? 'মিনিট' : 'min'}</option>
                        <option value={15}>15 {isBn ? 'মিনিট' : 'min'}</option>
                        <option value={30}>30 {isBn ? 'মিনিট' : 'min'}</option>
                        <option value={60}>1 {isBn ? 'ঘণ্টা' : 'hr'}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowDeviceSettings(null)}
                      className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer hover:bg-[var(--border)] transition-all"
                    >
                      {isBn ? 'বন্ধ' : 'Close'}
                    </button>
                    <button
                      onClick={() => setShowDeviceSettings(null)}
                      className="px-4 py-2 rounded-lg bg-[var(--green)] text-white text-[0.75rem] font-semibold cursor-pointer hover:opacity-90 transition-all"
                    >
                      {isBn ? 'সংরক্ষণ' : 'Save'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
