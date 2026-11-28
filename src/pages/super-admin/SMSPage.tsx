import { useState, useMemo, useEffect } from 'react'
import {
  MessageSquare,
  Plus,
  ShoppingCart,
  RefreshCw,
  Server,
  Send,
  Building2,
  CheckCircle,
  Smartphone,
  Activity,
  FileText,
  Sparkles,
} from 'lucide-react'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useSmsStore } from '@/store/smsStore'
import { InstitutionsSmsTab, type InstitutionSmsRow } from './sms/tabs/InstitutionsSmsTab'
import { PurchasesSmsTab } from './sms/tabs/PurchasesSmsTab'
import { ProviderGatewayTab } from './sms/tabs/ProviderGatewayTab'
import { BroadcastSmsTab } from './sms/tabs/BroadcastSmsTab'
import { DispatchLogsTab } from './sms/tabs/DispatchLogsTab'
import { BuySmsModal } from './sms/modals/BuySmsModal'
import { AllocateSmsModal } from './sms/modals/AllocateSmsModal'
import { BulkDistributeModal } from './sms/modals/BulkDistributeModal'
import type { SmsSchoolSummary } from '@/lib/api'

interface Props {
  isBn: boolean
}

type SmsTab = 'institutions' | 'purchases' | 'gateway' | 'broadcast' | 'logs'

export default function SMSPage({ isBn }: Props) {
  const { institutions: storeInstitutions } = useSuperAdminStore()
  const {
    masterPool,
    gatewayConfig,
    gatewayConfigured,
    schools: apiSchools,
    purchases,
    institutionBalances,
    dispatchLogs,
    loadingOverview,
    fetchSuperAdminOverview,
    buySMS,
    allocateSMS,
    distributeToAll,
    broadcastSMS,
    checkProviderBalance,
    updateGatewayConfig,
    sendSMS,
  } = useSmsStore()

  const [activeTab, setActiveTab] = useState<SmsTab>('institutions')
  const [search, setSearch] = useState('')
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [allocInitialInstId, setAllocInitialInstId] = useState('')

  useEffect(() => {
    void fetchSuperAdminOverview()
  }, [fetchSuperAdminOverview])

  const mergedInstitutions: SmsSchoolSummary[] = useMemo(() => {
    if (apiSchools.length > 0) return apiSchools
    return storeInstitutions.map((i) => ({
      id: i.id,
      name: i.name,
      nameBn: i.nameBn || i.name,
      slug: i.slug || i.subdomain,
      subdomain: i.subdomain || i.slug,
      phone: i.phone || '',
      email: i.email || '',
      eiin: i.eiin || '',
      status: i.status || 'active',
      balance: institutionBalances[i.id] || { allocated: 0, used: 0, remaining: 0 },
    }))
  }, [apiSchools, storeInstitutions, institutionBalances])

  const filteredInstitutions: InstitutionSmsRow[] = useMemo(() => {
    if (!search.trim()) return mergedInstitutions
    const q = search.toLowerCase()
    return mergedInstitutions.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.nameBn && i.nameBn.includes(q)) ||
        i.subdomain.toLowerCase().includes(q) ||
        (i.eiin && i.eiin.includes(q))
    )
  }, [mergedInstitutions, search])

  const availableMaster = Math.max(0, masterPool.totalPurchased - masterPool.totalAllocated)

  const handleOpenAllocate = (instId = '') => {
    setAllocInitialInstId(instId)
    setShowAllocateModal(true)
  }

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div
        className="anim-card relative overflow-hidden rounded-3xl p-6 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #083344 0%, #0e7490 50%, #06b6d4 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-inner">
              <MessageSquare size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[1.25rem] font-bold text-white">
                  {isBn ? 'বিডি বাল্ক এসএমএস ও প্রতিষ্ঠান বিতরণ' : 'Bangladesh Bulk SMS & Institution Distribution'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-white/20 text-white uppercase tracking-wider">
                  {gatewayConfigured ? (isBn ? 'কানেক্টেড' : 'Live Gateway') : isBn ? 'কনফিগার প্রয়োজন' : 'Setup Ready'}
                </span>
              </div>
              <p className="text-[0.8125rem] text-white/80 mt-0.5">
                {isBn
                  ? 'বাংলাদেশ বাল্ক এসএমএস প্রোভাইডার সংযোগ ও সকল প্রতিষ্ঠানে ক্রেডিট বিতরণ'
                  : 'Connect Bangladesh bulk SMS providers, manage master quota, and distribute across institutions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => void fetchSuperAdminOverview()}
              disabled={loadingOverview}
              title={isBn ? 'রিফ্রেশ করুন' : 'Refresh'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.8125rem] font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 cursor-pointer transition-all"
            >
              <RefreshCw size={14} className={loadingOverview ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-white text-[#0e7490] hover:bg-white/90 active:scale-95 transition-all shadow-sm border-none cursor-pointer"
            >
              <ShoppingCart size={15} />
              <span>{isBn ? 'এসএমএস কিনুন' : 'Buy SMS Pool'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white active:scale-95 transition-all border border-white/20 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>{isBn ? 'সব প্রতিষ্ঠানে বিতরণ' : 'Distribute to All'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAllocate('')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-cyan-900/60 hover:bg-cyan-900/80 text-white active:scale-95 transition-all border border-white/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>{isBn ? 'প্রতিষ্ঠানে বরাদ্দ' : 'Allocate to School'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass rounded-2xl p-4 flex items-center gap-3.5 border border-[var(--border)]">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-cyan-500/10 text-cyan-500">
            <Smartphone size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
              {isBn ? 'মোট ক্রয়কৃত এসএমএস' : 'Total Purchased Pool'}
            </div>
            <div className="text-[1.25rem] font-bold text-[var(--text-primary)] mt-0.5">
              {masterPool.totalPurchased.toLocaleString()}
            </div>
            <div className="text-[0.625rem] text-cyan-600 font-medium mt-0.5">
              {purchases.length} {isBn ? 'টি ক্রয়ের রেকর্ড' : 'purchase order(s)'}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3.5 border border-[var(--border)]">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-500">
            <Building2 size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
              {isBn ? 'প্রতিষ্ঠানে বরাদ্দকৃত' : 'Distributed to Schools'}
            </div>
            <div className="text-[1.25rem] font-bold text-[var(--text-primary)] mt-0.5">
              {masterPool.totalAllocated.toLocaleString()}
            </div>
            <div className="text-[0.625rem] text-indigo-500 font-medium mt-0.5">
              {masterPool.totalPurchased > 0
                ? `${((masterPool.totalAllocated / masterPool.totalPurchased) * 100).toFixed(0)}%`
                : '0%'}{' '}
              {isBn ? 'বরাদ্দ সম্পন্ন' : 'of pool allocated'}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3.5 border border-[var(--border)]">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
              {isBn ? 'বিতরণের জন্য অবশিষ্ট' : 'Available to Allocate'}
            </div>
            <div className="text-[1.25rem] font-bold text-emerald-600 mt-0.5">
              {availableMaster.toLocaleString()}
            </div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
              {isBn ? 'সুপার পুল ব্যালেন্স' : 'Master unassigned pool'}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3.5 border border-[var(--border)]">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500">
            <Activity size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
              {isBn ? 'মোট ব্যবহৃত SMS' : 'Consumed by Schools'}
            </div>
            <div className="text-[1.25rem] font-bold text-[var(--text-primary)] mt-0.5">
              {masterPool.totalUsed.toLocaleString()}
            </div>
            <div className="text-[0.625rem] text-amber-600 font-medium mt-0.5">
              {dispatchLogs.length} {isBn ? 'টি লাইভ মেসেজ রেকর্ড' : 'live dispatch logs'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto pb-px">
        {(
          [
            { id: 'institutions', label: isBn ? 'প্রতিষ্ঠান ও ব্যালেন্স' : 'Institutions & Balances', icon: Building2 },
            { id: 'purchases', label: isBn ? 'ক্রয় হিস্ট্রি' : 'Purchase Orders', icon: ShoppingCart },
            { id: 'gateway', label: isBn ? 'বিডি প্রোভাইডার সেটিংস' : 'BD Provider Gateway', icon: Server },
            { id: 'broadcast', label: isBn ? 'বাল্ক ব্রডকাস্ট' : 'Bulk Broadcast', icon: Send },
            { id: 'logs', label: isBn ? 'ডেলিভারি অডিট লগ' : 'Delivery Dispatch Logs', icon: FileText },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors border-b-2 -mb-px cursor-pointer bg-transparent whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[var(--brand)] text-[var(--brand)] font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'institutions' && (
        <InstitutionsSmsTab
          isBn={isBn}
          search={search}
          onSearchChange={setSearch}
          institutions={filteredInstitutions}
          balances={institutionBalances}
          onOpenAllocate={handleOpenAllocate}
          onOpenBulkDistribute={() => setShowBulkModal(true)}
        />
      )}

      {activeTab === 'purchases' && (
        <PurchasesSmsTab isBn={isBn} purchases={purchases} onOpenBuyModal={() => setShowBuyModal(true)} />
      )}

      {activeTab === 'gateway' && (
        <ProviderGatewayTab
          isBn={isBn}
          gatewayConfig={gatewayConfig}
          onSaveGateway={updateGatewayConfig}
          onCheckProviderBalance={checkProviderBalance}
          onSendTestSMS={sendSMS}
        />
      )}

      {activeTab === 'broadcast' && (
        <BroadcastSmsTab
          isBn={isBn}
          institutions={mergedInstitutions}
          gatewayConfigured={gatewayConfigured}
          onBroadcast={broadcastSMS}
        />
      )}

      {activeTab === 'logs' && <DispatchLogsTab isBn={isBn} dispatchLogs={dispatchLogs} />}

      <BuySmsModal open={showBuyModal} isBn={isBn} onClose={() => setShowBuyModal(false)} onSubmit={buySMS} />

      <AllocateSmsModal
        open={showAllocateModal}
        isBn={isBn}
        institutions={mergedInstitutions}
        balances={institutionBalances}
        availableMaster={availableMaster}
        initialInstId={allocInitialInstId}
        onClose={() => setShowAllocateModal(false)}
        onSubmit={allocateSMS}
      />

      <BulkDistributeModal
        open={showBulkModal}
        isBn={isBn}
        institutions={mergedInstitutions}
        availableMaster={availableMaster}
        onClose={() => setShowBulkModal(false)}
        onDistribute={distributeToAll}
      />
    </div>
  )
}
