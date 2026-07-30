import { useRef, useEffect } from 'react'
import { Fingerprint, CreditCard, ScanFace, Wifi, Plus } from 'lucide-react'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { DeviceSubTab } from './types'
import { useDeviceTab } from './useDeviceTab'
import { DeviceManagementTab } from './tabs/DeviceManagementTab'
import { RfidCardsTab } from './tabs/RfidCardsTab'
import { FingerprintTab } from './tabs/FingerprintTab'
import { FaceScanTab } from './tabs/FaceScanTab'
import { MobileTab } from './tabs/MobileTab'
import { AddDeviceModal } from './modals/AddDeviceModal'
import { AddRfidModal } from './modals/AddRfidModal'
import { AddFingerprintModal } from './modals/AddFingerprintModal'
import { AddFaceScanModal } from './modals/AddFaceScanModal'

export default function DeviceTab({ isBn, date }: { isBn: boolean; date: string }) {
  const tab = useDeviceTab({ isBn, date })
  useScrollLock(tab.showAddDevice || tab.showAddRFID || tab.showAddFP || tab.showAddFace)

  const sectionTabsRef = useRef<HTMLDivElement>(null)
  const sectionTabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const tabColors: Record<string, string> = { devices: '#7C3AED', rfid: 'var(--brand)', fingerprint: 'var(--amber)', face: 'var(--green)', mobile: 'var(--teal)' }
  const sliderStyle = useRef({ left: '0px', width: '0px', background: '#7C3AED' })

  useEffect(() => {
    const el = sectionTabRefs.current[tab.deviceTab]
    const container = sectionTabsRef.current
    if (el && container) {
      const cRect = container.getBoundingClientRect()
      const eRect = el.getBoundingClientRect()
      const scrollLeft = container.scrollLeft || 0
      sliderStyle.current = {
        left: `${eRect.left - cRect.left + scrollLeft}px`,
        width: `${eRect.width}px`,
        background: tabColors[tab.deviceTab] || '#7C3AED',
      }
    }
  }, [tab.deviceTab])

  const tabs = [
    { key: 'devices' as const, lBn: 'ডিভাইস', lEn: 'Devices', Icon: Fingerprint, color: '#7C3AED' },
    { key: 'rfid' as const, lBn: 'RFID কার্ড', lEn: 'RFID Cards', Icon: CreditCard, color: 'var(--brand)' },
    { key: 'fingerprint' as const, lBn: 'ফিঙ্গারপ্রিন্ট', lEn: 'Fingerprint', Icon: Fingerprint, color: 'var(--amber)' },
    { key: 'face' as const, lBn: 'ফেস স্ক্যান', lEn: 'Face Scan', Icon: ScanFace, color: 'var(--green)' },
    { key: 'mobile' as const, lBn: 'মোবাইল', lEn: 'Mobile', Icon: Wifi, color: 'var(--teal)' },
  ]

  const actionButtons: Partial<Record<DeviceSubTab, { onClick: () => void; label: string; color: string; icon: React.ReactNode }>> = {
    devices: { onClick: () => tab.setShowAddDevice(true), label: isBn ? 'ডিভাইস যোগ' : 'Add Device', color: '#7C3AED', icon: <Plus size={12} /> },
    rfid: { onClick: () => tab.setShowAddRFID(true), label: isBn ? 'কার্ড যোগ' : 'Add Card', color: 'var(--brand)', icon: <Plus size={12} /> },
    fingerprint: { onClick: () => tab.setShowAddFP(true), label: isBn ? 'এনরোল' : 'Enroll FP', color: 'var(--amber)', icon: <Fingerprint size={12} /> },
    face: { onClick: () => tab.setShowAddFace(true), label: isBn ? 'স্ক্যান' : 'Scan Face', color: 'var(--green)', icon: <ScanFace size={12} /> },
  }

  const action = actionButtons[tab.deviceTab]

  return (
    <>
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] shrink-0">{isBn ? 'সেকশন:' : 'Section:'}</span>
        <div ref={sectionTabsRef} className="relative flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              ref={(el) => { sectionTabRefs.current[t.key] = el }}
              onClick={() => {
                tab.setDeviceTab(t.key)
                const btn = sectionTabRefs.current[t.key]
                const c = sectionTabsRef.current
                if (btn && c) {
                  const cr = c.getBoundingClientRect()
                  const br = btn.getBoundingClientRect()
                  if (br.left < cr.left || br.right > cr.right) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                }
              }}
              className="relative z-10 px-3 py-1 rounded-md text-[0.625rem] font-medium cursor-pointer transition-colors duration-200 flex items-center gap-1"
              style={{ color: tab.deviceTab === t.key ? '#fff' : 'var(--text-muted)' }}
            >
              <t.Icon size={11} />
              {isBn ? t.lBn : t.lEn}
            </button>
          ))}
          <div className="absolute top-1 bottom-1 rounded-md [transition:left_300ms_ease-out,width_300ms_ease-out,background-color_300ms_ease-out]" style={{ left: sliderStyle.current.left, width: sliderStyle.current.width, background: sliderStyle.current.background, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <div className="flex-1" />
        {action && (
          <button onClick={action.onClick} className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg text-white text-[0.6875rem] cursor-pointer font-medium" style={{ background: action.color }}>
            {action.icon}
            {action.label}
          </button>
        )}
      </div>

      {tab.deviceTab === 'devices' && <DeviceManagementTab isBn={isBn} devices={tab.devices} setDevices={tab.setDevices} />}
      {tab.deviceTab === 'rfid' && <RfidCardsTab isBn={isBn} rfidEntries={tab.rfidEntries} setRfidEntries={tab.setRfidEntries} />}
      {tab.deviceTab === 'fingerprint' && <FingerprintTab isBn={isBn} fpEntries={tab.fpEntries} setFpEntries={tab.setFpEntries} />}
      {tab.deviceTab === 'face' && <FaceScanTab isBn={isBn} faceEntries={tab.faceEntries} setFaceEntries={tab.setFaceEntries} />}
      {tab.deviceTab === 'mobile' && (
        <MobileTab isBn={isBn} date={date} allPeople={tab.allPeople} mobileDevices={tab.mobileDevices}
          mobileRegStaff={tab.mobileRegStaff} setMobileRegStaff={tab.setMobileRegStaff} mobileRegPending={tab.mobileRegPending} handleRegisterDevice={tab.handleRegisterDevice}
          mobileAuthStaff={tab.mobileAuthStaff} setMobileAuthStaff={tab.setMobileAuthStaff} mobileAuthPending={tab.mobileAuthPending} handleMobileAuth={tab.handleMobileAuth}
          removeMobileDevice={tab.removeMobileDevice} mobileSearch={tab.mobileSearch} setMobileSearch={tab.setMobileSearch}
          mobileAuthMsg={tab.mobileAuthMsg} setMobileAuthMsg={() => tab.setMobileAuthMsg(null)}
          institutionGateway={tab.wifi.institutionGateway} wifiConnected={tab.wifi.wifiConnected}
          authMode={tab.authMode} setAuthMode={tab.setAuthMode}
          showWifiSettings={tab.wifi.showWifiSettings} setShowWifiSettings={tab.wifi.setShowWifiSettings}
          institutionWifi={tab.wifi.institutionWifi} setInstitutionWifi={tab.wifi.setInstitutionWifi}
          institutionGatewayValue={tab.wifi.institutionGateway} setInstitutionGateway={tab.wifi.setInstitutionGateway}
          saveWifiSettings={tab.wifi.saveWifiSettings} wifiChecking={tab.wifi.wifiChecking} runNetworkCheck={tab.wifi.runNetworkCheck}
        />
      )}

      {tab.showAddDevice && <AddDeviceModal isBn={isBn} newDevice={tab.newDevice} setNewDevice={tab.setNewDevice} onAdd={tab.handleAddDevice} onClose={() => tab.setShowAddDevice(false)} />}
      {tab.showAddRFID && <AddRfidModal isBn={isBn} allPeople={tab.allPeople} newRFID={tab.newRFID} setNewRFID={tab.setNewRFID} onAdd={tab.handleAddRfid} onClose={() => tab.setShowAddRFID(false)} />}
      {tab.showAddFP && <AddFingerprintModal isBn={isBn} allPeople={tab.allPeople} newFP={tab.newFP} setNewFP={tab.setNewFP} onAdd={tab.handleAddFp} onClose={() => tab.setShowAddFP(false)} />}
      {tab.showAddFace && <AddFaceScanModal isBn={isBn} allPeople={tab.allPeople} newFace={tab.newFace} setNewFace={tab.setNewFace} onAdd={tab.handleAddFace} onClose={() => tab.setShowAddFace(false)} />}
    </>
  )
}
