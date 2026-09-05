import { CheckCircle, Smartphone, ScanFace, Wifi, X, XCircle } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import KioskMode from '../KioskMode'
import { PersonSearchInput } from '../PersonSearchInput'
import { MobileDevicesList } from './MobileDevicesList'
import type { Person, MobileDevice } from '../types'

interface MobileTabProps {
  isBn: boolean
  date: string
  allPeople: Person[]
  mobileDevices: MobileDevice[]
  mobileRegStaff: string
  setMobileRegStaff: (v: string) => void
  mobileRegPending: boolean
  handleRegisterDevice: () => void
  mobileAuthStaff: string
  setMobileAuthStaff: (v: string) => void
  mobileAuthPending: boolean
  handleMobileAuth: () => void
  removeMobileDevice: (id: string) => void
  mobileSearch: string
  setMobileSearch: (v: string) => void
  mobileAuthMsg: { type: 'success' | 'error'; text: string } | null
  setMobileAuthMsg: (v: null) => void
  institutionGateway: string
  wifiConnected: boolean | null
  authMode: 'kiosk' | 'personal'
  setAuthMode: (v: 'kiosk' | 'personal') => void
  showWifiSettings: boolean
  setShowWifiSettings: (v: boolean) => void
  institutionWifi: string
  setInstitutionWifi: (v: string) => void
  institutionGatewayValue: string
  setInstitutionGateway: (v: string) => void
  saveWifiSettings: () => void
  wifiChecking: boolean
  runNetworkCheck: () => Promise<{ onNetwork: boolean | null; method: string; info: string }>
}

export function MobileTab({
  isBn, date, allPeople, mobileDevices, mobileRegStaff, setMobileRegStaff,
  mobileRegPending, handleRegisterDevice, mobileAuthStaff, setMobileAuthStaff,
  mobileAuthPending, handleMobileAuth, removeMobileDevice, mobileSearch, setMobileSearch,
  mobileAuthMsg, setMobileAuthMsg, institutionGateway, wifiConnected, authMode,
  setAuthMode, showWifiSettings, setShowWifiSettings, institutionWifi, setInstitutionWifi,
  institutionGatewayValue, setInstitutionGateway, saveWifiSettings, wifiChecking, runNetworkCheck,
}: MobileTabProps) {
  const { canCreate } = usePermission()
  return (
    <>
      {/* Network + Mode combined bar */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Wifi size={13} className="text-[var(--teal)]" />
          <span className="text-[0.6875rem] font-medium text-[var(--text-primary)]">
            {isBn ? 'নেটওয়ার্ক' : 'Network'}
          </span>
          {institutionGateway && (
            <span className={`text-[0.5rem] px-1.5 py-0.5 rounded-full font-semibold ${wifiConnected === true ? 'bg-[var(--green-light)] text-[var(--green)]' : wifiConnected === false ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
              {wifiConnected === true ? 'OK' : wifiConnected === false ? (isBn ? 'বিচ্ছিন্ন' : 'Off') : '...'}
            </span>
          )}
        </div>
        <div className="w-px h-4 bg-[var(--border)]" />
        <span className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'মোড:' : 'Mode:'}</span>
        <div className="relative flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
          <div
            className="absolute top-1 bottom-1 rounded-md [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
            style={{
              width: 'calc(50% - 0.25rem)',
              transform: authMode === 'kiosk' ? 'translateX(calc(100% + 0.25rem))' : 'translateX(0)',
              background: authMode === 'kiosk' ? 'var(--amber)' : 'var(--teal)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
          <button
            onClick={() => setAuthMode('personal')}
            className="relative z-10 px-3 py-1 rounded-md text-[0.625rem] font-medium cursor-pointer transition-colors duration-200 flex items-center gap-1"
            style={{ color: authMode === 'personal' ? '#fff' : 'var(--text-muted)' }}
          >
            <Smartphone size={10} />
            {isBn ? 'ব্যক্তিগত' : 'Personal'}
          </button>
          <button
            onClick={() => setAuthMode('kiosk')}
            className="relative z-10 px-3 py-1 rounded-md text-[0.625rem] font-medium cursor-pointer transition-colors duration-200 flex items-center gap-1"
            style={{ color: authMode === 'kiosk' ? '#fff' : 'var(--text-muted)' }}
          >
            <ScanFace size={10} />
            {isBn ? 'কিয়োস্ক' : 'Kiosk'}
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowWifiSettings(!showWifiSettings)}
          className="text-[0.625rem] text-[var(--teal)] cursor-pointer bg-transparent border-none font-medium"
        >
          {showWifiSettings ? (isBn ? 'বন্ধ' : 'Close') : isBn ? 'সেটিংস' : 'Settings'}
        </button>
      </div>

      {showWifiSettings && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[0.5625rem] font-medium text-[var(--text-muted)] mb-1 block">{isBn ? 'WiFi নাম' : 'WiFi SSID'}</label>
              <input value={institutionWifi} onChange={(e) => setInstitutionWifi(e.target.value)} placeholder="Institution-Guest" className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)] outline-none" />
            </div>
            <div>
              <label className="text-[0.5625rem] font-medium text-[var(--text-muted)] mb-1 block">{isBn ? 'গেটওয়ে IP' : 'Gateway IP'}</label>
              <input value={institutionGatewayValue} onChange={(e) => setInstitutionGateway(e.target.value)} placeholder="192.168.1.1" className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)] font-mono outline-none" />
            </div>
            <div className="flex items-end gap-1.5">
              <button onClick={saveWifiSettings} className="px-3 py-1.5 rounded-lg bg-[var(--teal)] text-white text-[0.625rem] font-medium cursor-pointer border-none">{isBn ? 'সংরক্ষণ' : 'Save'}</button>
              <button onClick={() => runNetworkCheck()} className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.625rem] cursor-pointer">
                {wifiChecking ? '...' : isBn ? 'পরীক্ষা' : 'Test'}
              </button>
            </div>
          </div>
          <div className="text-[0.5rem] text-[var(--text-muted)] mt-1.5">
            {isBn ? 'গেটওয়ে IP সেট করলে স্টাফদের WiFi নেটওয়ার্কে থাকতে হবে।' : 'With gateway IP, staff must be on institution WiFi to check in.'}
          </div>
        </div>
      )}

      {authMode === 'personal' && (
        <>
          {mobileAuthMsg && (
            <div className={`mb-3 py-2 px-3 rounded-lg text-[0.75rem] font-medium flex items-center gap-2 ${mobileAuthMsg.type === 'success' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
              {mobileAuthMsg.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {mobileAuthMsg.text}
              <button onClick={() => setMobileAuthMsg(null)} className="ml-auto bg-transparent border-none cursor-pointer text-[inherit]"><X size={14} /></button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-primary)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center"><Wifi size={15} className="text-[var(--teal)]" /></div>
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{isBn ? 'ডিভাইস নিবন্ধন' : 'Register Device'}</div>
                  <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ফিঙ্গারপ্রিন্ট/ফেস দিয়ে নিবন্ধন' : 'Register with biometric'}</div>
                </div>
              </div>
              <PersonSearchInput value={mobileRegStaff} onChange={(id) => setMobileRegStaff(id)} isBn={isBn} people={allPeople.filter((p) => p.type === 'staff' && !mobileDevices.find((d) => d.staffId === p.id))} />
              {canCreate('attendance.device.create') && (
              <button onClick={handleRegisterDevice} disabled={!mobileRegStaff || mobileRegPending} className={`w-full py-2 mt-2 rounded-lg text-[0.75rem] font-semibold cursor-pointer border-none transition-all ${mobileRegPending ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : mobileRegStaff ? 'bg-[var(--teal)] text-white hover:shadow-md' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'}`}>
                {mobileRegPending ? (isBn ? 'নিবন্ধন হচ্ছে...' : 'Registering...') : isBn ? 'নিবন্ধন করুন' : 'Register Now'}
              </button>
              )}
            </div>
            <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-primary)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--green-light)] flex items-center justify-center"><CheckCircle size={15} className="text-[var(--green)]" /></div>
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{isBn ? 'চেক-ইন / আউট' : 'Check In / Out'}</div>
                  <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'বায়োমেট্রিক + WiFi' : 'Biometric + WiFi verified'}</div>
                </div>
              </div>
              <PersonSearchInput value={mobileAuthStaff} onChange={(id) => setMobileAuthStaff(id)} isBn={isBn} people={mobileDevices.map((d) => ({ id: d.staffId, name: d.staffName, type: 'staff' as const, photo: '' }))} />
              {canCreate('attendance.device.create') && (
              <button onClick={handleMobileAuth} disabled={!mobileAuthStaff || mobileAuthPending || wifiChecking} className={`w-full py-2 mt-2 rounded-lg text-[0.75rem] font-semibold cursor-pointer border-none transition-all ${mobileAuthPending || wifiChecking ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : mobileAuthStaff ? 'bg-[var(--green)] text-white hover:shadow-md' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'}`}>
                {wifiChecking ? (isBn ? 'ওয়াইফাই যাচাই...' : 'Checking WiFi...') : mobileAuthPending ? (isBn ? 'প্রমাণীকরণ...' : 'Authenticating...') : (isBn ? 'বায়োমেট্রিক চেক' : 'Biometric Check')}
              </button>
              )}
            </div>
          </div>

          <MobileDevicesList isBn={isBn} date={date} mobileDevices={mobileDevices} mobileSearch={mobileSearch} setMobileSearch={setMobileSearch} removeMobileDevice={removeMobileDevice} />
        </>
      )}

      {authMode === 'kiosk' && <KioskMode isBn={isBn} date={date} />}
    </>
  )
}
