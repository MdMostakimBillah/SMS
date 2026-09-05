import { createPortal } from 'react-dom'
import { CreditCard, Fingerprint, ScanFace, Layers } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'

interface AddDeviceModalProps {
  isBn: boolean
  newDevice: { name: string; model: string; ip: string; type: 'rfid' | 'fingerprint' | 'face' | 'multi' }
  setNewDevice: React.Dispatch<React.SetStateAction<{ name: string; model: string; ip: string; type: 'rfid' | 'fingerprint' | 'face' | 'multi' }>>
  onAdd: () => void
  onClose: () => void
}

export function AddDeviceModal({ isBn, newDevice, setNewDevice, onAdd, onClose }: AddDeviceModalProps) {
  const { canCreate } = usePermission()
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box" style={{ maxWidth: '26.25rem' }}>
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
          {isBn ? 'নতুন ডিভাইস যোগ করুন' : 'Add New Device'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ডিভাইসের নাম' : 'Device Name'}</label>
            <input
              value={newDevice.name}
              onChange={(e) => setNewDevice((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Main Gate RFID"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none"
            />
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'মডেল' : 'Model'}</label>
            <input
              value={newDevice.model}
              onChange={(e) => setNewDevice((p) => ({ ...p, model: e.target.value }))}
              placeholder="e.g. ZKTeco SLK200"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none"
            />
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              IP {isBn ? 'ঠিকানা' : 'Address'}
            </label>
            <input
              value={newDevice.ip}
              onChange={(e) => setNewDevice((p) => ({ ...p, ip: e.target.value }))}
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] font-mono outline-none"
            />
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'ডিভাইস টাইপ' : 'Device Type'}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { k: 'rfid' as const, l: 'RFID', I: CreditCard },
                { k: 'fingerprint' as const, l: 'FP', I: Fingerprint },
                { k: 'face' as const, l: 'Face', I: ScanFace },
                { k: 'multi' as const, l: 'Multi', I: Layers },
              ].map((o) => (
                <button
                  key={o.k}
                  onClick={() => setNewDevice((p) => ({ ...p, type: o.k }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[0.625rem] cursor-pointer transition-all ${newDevice.type === o.k ? 'border-[#7C3AED] bg-[#7C3AED15] text-[#7C3AED] font-semibold' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
                >
                  <o.I size={16} />
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer">
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          {canCreate('attendance.device') && (
            <button onClick={onAdd} className="px-3.5 py-2 rounded-lg bg-[#7C3AED] border-0 text-white text-[0.75rem] font-semibold cursor-pointer">
              {isBn ? 'যোগ করুন' : 'Add Device'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
