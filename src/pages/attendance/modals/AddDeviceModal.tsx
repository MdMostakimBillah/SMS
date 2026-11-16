import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock, CreditCard, Fingerprint, ScanFace, Layers, Sparkles, Network, Cloud, Usb, Copy, Check } from 'lucide-react'
import type { DeviceConnectionType } from '../types'

interface AddDeviceModalProps {
  isBn: boolean
  newDevice: {
    name: string
    model: string
    ip: string
    port?: number
    location?: string
    type: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'multi'
    connectionType?: DeviceConnectionType
  }
  setNewDevice: React.Dispatch<
    React.SetStateAction<{
      name: string
      model: string
      ip: string
      port?: number
      location?: string
      type: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'multi'
      connectionType?: DeviceConnectionType
    }>
  >
  onAdd: () => void
  onClose: () => void
}

export function AddDeviceModal({ isBn, newDevice, setNewDevice, onAdd, onClose }: AddDeviceModalProps) {
  const [copied, setCopied] = useState(false)
  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://edutech.app'
  const pushUrl = `${serverOrigin}/api/attendance/push`

  const applyPreset = (preset: { name: string; model: string; type: any; port?: number; location?: string; connectionType?: DeviceConnectionType }) => {
    const randomIp = `192.168.1.${Math.floor(Math.random() * 80) + 110}`
    setNewDevice((prev) => ({
      ...prev,
      name: preset.name,
      model: preset.model,
      type: preset.type,
      ip: randomIp,
      port: preset.port || 4370,
      location: preset.location || (isBn ? 'মূল ফটক' : 'Main Gate'),
      connectionType: preset.connectionType || 'lan',
    }))
  }

  const connType = newDevice.connectionType || 'lan'
  const isValid = newDevice.name.trim().length > 0 && (connType === 'cloud_adms' || newDevice.ip.trim().length > 0)

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '30rem' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'নতুন বায়োমেট্রিক বা পাঞ্চ ডিভাইস যোগ' : 'Add New Biometric or Punch Device'}
          </h3>
        </div>

        {/* Quick Demo Presets */}
        <div className="mb-3 p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <div className="text-[0.625rem] font-medium text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
            <Sparkles size={11} className="text-[#7C3AED]" />
            {isBn ? 'কুইক প্রিসেট (ডিভাইস না থাকলে টেস্ট করার জন্য):' : 'Quick Presets (For testing without physical hardware):'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset({ name: 'Gate Punch Clock', model: 'ZKTeco K14 Pro', type: 'punch', location: 'Gate 1', connectionType: 'lan' })}
              className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[0.625rem] text-[var(--text-secondary)] hover:text-[#7C3AED] hover:border-[#7C3AED] cursor-pointer"
            >
              🕒 Punch Clock
            </button>
            <button
              type="button"
              onClick={() => applyPreset({ name: 'Admin RFID Reader', model: 'ZKTeco SLK200', type: 'rfid', location: 'Admin Desk', connectionType: 'lan' })}
              className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[0.625rem] text-[var(--text-secondary)] hover:text-[#7C3AED] hover:border-[#7C3AED] cursor-pointer"
            >
              💳 RFID Reader
            </button>
            <button
              type="button"
              onClick={() => applyPreset({ name: 'Staff FP Scanner', model: 'ZKTeco K40 Biometric', type: 'fingerprint', location: 'Staff Room', connectionType: 'lan' })}
              className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[0.625rem] text-[var(--text-secondary)] hover:text-[#7C3AED] hover:border-[#7C3AED] cursor-pointer"
            >
              👆 FP Scanner
            </button>
            <button
              type="button"
              onClick={() => applyPreset({ name: 'Cloud Face Terminal', model: 'Hikvision DS-K1T344', type: 'face', location: 'Lobby', connectionType: 'cloud_adms' })}
              className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-[0.625rem] text-[var(--text-secondary)] hover:text-[#7C3AED] hover:border-[#7C3AED] cursor-pointer"
            >
              ☁️ Cloud Face
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Connection Protocol Mode */}
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'কানেকশন মেথড (সংযোগ মাধ্যম)' : 'Connection Protocol / Method'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'lan' as const, l: isBn ? 'লোকাল LAN / WiFi' : 'Local LAN / WiFi', I: Network },
                { k: 'cloud_adms' as const, l: isBn ? 'ক্লাউড পুশ (ADMS)' : 'Cloud Push (ADMS)', I: Cloud },
                { k: 'usb_offline' as const, l: isBn ? 'ইউএসবি অফলাইন' : 'USB Offline', I: Usb },
              ].map((m) => (
                <button
                  type="button"
                  key={m.k}
                  onClick={() => setNewDevice((p) => ({ ...p, connectionType: m.k }))}
                  className={`p-2 rounded-lg border text-[0.625rem] font-medium flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    connType === m.k
                      ? 'border-[#7C3AED] bg-[#7C3AED18] text-[#7C3AED] font-semibold'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                >
                  <m.I size={14} />
                  <span>{m.l}</span>
                </button>
              ))}
            </div>
          </div>

          {connType === 'cloud_adms' && (
            <div className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.625rem]">
              <div className="text-[var(--text-muted)] mb-1">
                {isBn ? 'মেশিনে বসানোর জন্য পুশ ওয়েবহুক URL:' : 'Push Webhook URL for physical machine:'}
              </div>
              <div className="flex items-center justify-between font-mono bg-[var(--bg-primary)] p-1.5 rounded border border-[var(--border)]">
                <span className="truncate text-[#7C3AED]">{pushUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pushUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center gap-1 cursor-pointer hover:bg-[var(--border)]"
                >
                  {copied ? <Check size={10} className="text-[var(--green)]" /> : <Copy size={10} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'ডিভাইসের নাম *' : 'Device Name *'}
            </label>
            <input
              value={newDevice.name}
              onChange={(e) => setNewDevice((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Main Gate Punch Clock"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'মডেল' : 'Model'}
              </label>
              <input
                value={newDevice.model}
                onChange={(e) => setNewDevice((p) => ({ ...p, model: e.target.value }))}
                placeholder="e.g. ZKTeco K14 Pro"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none focus:border-[#7C3AED]"
              />
            </div>
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'অবস্থান' : 'Location'}
              </label>
              <input
                value={newDevice.location || ''}
                onChange={(e) => setNewDevice((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Main Gate"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {connType === 'cloud_adms' ? 'Cloud Server / Host' : `IP ${isBn ? 'ঠিকানা *' : 'Address *'}`}
              </label>
              <input
                value={newDevice.ip}
                onChange={(e) => setNewDevice((p) => ({ ...p, ip: e.target.value }))}
                placeholder={connType === 'cloud_adms' ? 'cloud.push.host' : '192.168.1.100'}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] font-mono outline-none focus:border-[#7C3AED]"
              />
            </div>
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'পোর্ট' : 'Port'}
              </label>
              <input
                type="number"
                value={newDevice.port || (connType === 'cloud_adms' ? 80 : 4370)}
                onChange={(e) => setNewDevice((p) => ({ ...p, port: Number(e.target.value) || 4370 }))}
                placeholder="4370"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] font-mono outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'ডিভাইস টাইপ' : 'Device Modality'}
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { k: 'punch' as const, l: 'Punch', I: Clock },
                { k: 'rfid' as const, l: 'RFID', I: CreditCard },
                { k: 'fingerprint' as const, l: 'FP', I: Fingerprint },
                { k: 'face' as const, l: 'Face', I: ScanFace },
                { k: 'multi' as const, l: 'Multi', I: Layers },
              ].map((o) => (
                <button
                  type="button"
                  key={o.k}
                  onClick={() => setNewDevice((p) => ({ ...p, type: o.k }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[0.625rem] cursor-pointer transition-all ${
                    newDevice.type === o.k
                      ? 'border-[#7C3AED] bg-[#7C3AED18] text-[#7C3AED] font-semibold'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <o.I size={15} />
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer hover:bg-[var(--border)]"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={!isValid}
            className={`px-4 py-2 rounded-lg text-white text-[0.75rem] font-semibold cursor-pointer border-0 transition-all ${
              isValid
                ? 'bg-[#7C3AED] hover:opacity-90 shadow-sm'
                : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
            }`}
          >
            {isBn ? 'ডিভাইস যোগ করুন' : 'Add Device'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

