import { useState, useMemo } from 'react'
import {
  MessageSquare, Plus, ShoppingCart, RefreshCw, Server, Send,
  Building2, Search, CheckCircle, AlertTriangle, XCircle,
  ShieldCheck, Smartphone, Activity, FileText, Check,
} from 'lucide-react'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useSmsStore, type SMSGatewayOptions } from '@/store/smsStore'
import { formatPhoneDisplay } from '@/lib/smsGateway'

interface Props {
  isBn: boolean
}

export default function SMSPage({ isBn }: Props) {
  const { institutions } = useSuperAdminStore()
  const {
    masterPool,
    gatewayConfig,
    purchases,
    institutionBalances,
    dispatchLogs,
    buySMS,
    allocateSMS,
    updateGatewayConfig,
    sendSMS,
  } = useSmsStore()

  const [activeTab, setActiveTab] = useState<'institutions' | 'purchases' | 'gateway' | 'logs'>('institutions')
  const [search, setSearch] = useState('')
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showAllocateModal, setShowAllocateModal] = useState(false)

  // Buy SMS Form State
  const [buyQuantity, setBuyQuantity] = useState<number>(10000)
  const [buyCost, setBuyCost] = useState<number>(3500)
  const [buyProvider, setBuyProvider] = useState<string>('SIM SMS Provider (GP / Robi / Banglalink)')
  const [buyRefId, setBuyRefId] = useState<string>('')
  const [buyNotes, setBuyNotes] = useState<string>('')

  // Allocate SMS Form State
  const [allocInstId, setAllocInstId] = useState<string>('')
  const [allocAmount, setAllocAmount] = useState<number>(1000)
  const [allocNote, setAllocNote] = useState<string>('')
  const [allocError, setAllocError] = useState<string>('')

  // Gateway Config Form State
  const [gwForm, setGwForm] = useState<SMSGatewayOptions>({ ...gatewayConfig })
  const [gwSavedMsg, setGwSavedMsg] = useState(false)

  // Test SMS State
  const [testPhone, setTestPhone] = useState('')
  const [testMsg, setTestMsg] = useState('EduTech test SMS: SIM gateway connectivity verified.')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const availableMaster = masterPool.totalPurchased - masterPool.totalAllocated

  // Filtered institutions
  const filteredInstitutions = useMemo(() => {
    let list = institutions
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.nameBn.includes(q) ||
          i.subdomain.toLowerCase().includes(q) ||
          (i.eiin && i.eiin.includes(q))
      )
    }
    return list
  }, [institutions, search])

  // Handle Buy SMS
  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (buyQuantity <= 0) return
    buySMS({
      quantity: Number(buyQuantity),
      totalCost: Number(buyCost),
      provider: buyProvider,
      refId: buyRefId,
      notes: buyNotes,
    })
    setShowBuyModal(false)
    setBuyRefId('')
    setBuyNotes('')
  }

  // Handle Allocate SMS
  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAllocError('')
    const targetInst = institutions.find((i) => i.id === allocInstId)
    if (!targetInst) {
      setAllocError(isBn ? 'অনুগ্রহ করে প্রতিষ্ঠান নির্বাচন করুন' : 'Please select an institution')
      return
    }
    if (allocAmount <= 0) {
      setAllocError(isBn ? 'সঠিক পরিমাণ লিখুন' : 'Please enter a valid amount')
      return
    }

    const res = allocateSMS({
      institutionId: targetInst.id,
      institutionName: isBn ? targetInst.nameBn || targetInst.name : targetInst.name,
      amount: Number(allocAmount),
      type: 'credit',
      note: allocNote,
    })

    if (!res.success) {
      setAllocError(res.error || 'Allocation failed')
      return
    }

    setShowAllocateModal(false)
    setAllocInstId('')
    setAllocAmount(1000)
    setAllocNote('')
  }

  // Handle Save Gateway
  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault()
    updateGatewayConfig(gwForm)
    setGwSavedMsg(true)
    setTimeout(() => setGwSavedMsg(false), 2500)
  }

  // Handle Send Test SMS
  const handleSendTestSMS = async () => {
    if (!testPhone.trim()) return
    setTestSending(true)
    setTestResult(null)

    const res = await sendSMS({
      institutionId: 'super-admin-test',
      institutionName: 'Super Admin Gateway Test',
      phone: testPhone,
      message: testMsg,
      type: 'test',
    })

    setTestSending(false)
    setTestResult({
      success: res.success,
      message: res.success
        ? (isBn ? 'সফলভাবে টেস্ট SMS পাঠানো হয়েছে!' : 'Test SMS delivered successfully!')
        : (res.error || (isBn ? 'SMS পাঠাতে ব্যর্থ হয়েছে' : 'Failed to deliver SMS')),
    })
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
              <div className="flex items-center gap-2">
                <h1 className="text-[1.25rem] font-bold text-white">
                  {isBn ? 'এসএমএস ব্যবস্থাপনা ও প্রতিষ্ঠান বিতরণ' : 'SMS Management & Real SIM Distribution'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-white/20 text-white uppercase tracking-wider">
                  Live Gateway
                </span>
              </div>
              <p className="text-[0.8125rem] text-white/80 mt-0.5">
                {isBn
                  ? 'সিম প্রোভাইডার থেকে বাল্ক এসএমএস ক্রয় এবং প্রতিটি প্রতিষ্ঠানের মাঝে ম্যানুয়াল ক্রেডিট বরাদ্দ'
                  : 'Buy bulk SMS from SIM provider and distribute manual quotas to all institutions'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-white text-[#0e7490] hover:bg-white/90 active:scale-95 transition-all shadow-sm border-none cursor-pointer"
            >
              <ShoppingCart size={15} />
              <span>{isBn ? 'এসএমএস কিনুন' : 'Buy SMS Pool'}</span>
            </button>
            <button
              onClick={() => {
                setAllocInstId('')
                setShowAllocateModal(true)
              }}
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
        {/* Metric 1: Master Pool Purchased */}
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

        {/* Metric 2: Total Allocated */}
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
              {((masterPool.totalAllocated / (masterPool.totalPurchased || 1)) * 100).toFixed(0)}% {isBn ? 'বরাদ্দ সম্পন্ন' : 'of pool allocated'}
            </div>
          </div>
        </div>

        {/* Metric 3: Available to Allocate */}
        <div className="glass rounded-2xl p-4 flex items-center gap-3.5 border border-[var(--border)]">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
              {isBn ? 'বিতরণের জন্য অবশিষ্ট' : 'Available to Allocate'}
            </div>
            <div className="text-[1.25rem] font-bold text-emerald-600 mt-0.5">
              {Math.max(0, availableMaster).toLocaleString()}
            </div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
              {isBn ? 'সুপার পুল ব্যালেন্স' : 'Master unassigned pool'}
            </div>
          </div>
        </div>

        {/* Metric 4: Total Consumed by Schools */}
        <div className="glass rounded-2xl p-4 flex items-center gap-3.5 border border-[var(--border)]">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500">
            <Activity size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
              {isBn ? 'প্রতিষ্ঠান দ্বারা ব্যবহৃত SMS' : 'Consumed by Schools'}
            </div>
            <div className="text-[1.25rem] font-bold text-[var(--text-primary)] mt-0.5">
              {masterPool.totalUsed.toLocaleString()}
            </div>
            <div className="text-[0.625rem] text-amber-600 font-medium mt-0.5">
              {dispatchLogs.length} {isBn ? 'টি লাইভ মেসেজ রেকর্ড' : 'live message logs'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto pb-px">
        {[
          { id: 'institutions', label: isBn ? 'প্রতিষ্ঠান ও ব্যালেন্স' : 'Institutions & Balances', icon: Building2 },
          { id: 'purchases', label: isBn ? 'ক্রয় হিস্ট্রি' : 'Purchase Orders', icon: ShoppingCart },
          { id: 'gateway', label: isBn ? 'প্রোভাইডার গেটওয়ে সেটিংস' : 'Provider Gateway Settings', icon: Server },
          { id: 'logs', label: isBn ? 'ডেলিভারি অডিট লগ' : 'Delivery Dispatch Logs', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors border-b-2 -mb-px cursor-pointer bg-transparent ${
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

      {/* Tab 1: Institutions & Balances */}
      {activeTab === 'institutions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isBn ? 'প্রতিষ্ঠান খুঁজুন (নাম, EIIN, সাবডোমেইন)...' : 'Search institutions (Name, EIIN, slug)...'}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
              />
            </div>
            <button
              onClick={() => {
                setAllocInstId('')
                setShowAllocateModal(true)
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer"
            >
              <Plus size={14} />
              <span>{isBn ? 'নতুন বরাদ্দ যোগ করুন' : 'Allocate SMS'}</span>
            </button>
          </div>

          {filteredInstitutions.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-[var(--text-muted)] border border-[var(--border)]">
              <Building2 size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-[0.875rem]">{isBn ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি' : 'No institutions found'}</p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[0.8125rem]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">{isBn ? 'প্রতিষ্ঠান' : 'Institution'}</th>
                      <th className="py-3 px-4">{isBn ? 'সাবডোমেইন / EIIN' : 'Subdomain / EIIN'}</th>
                      <th className="py-3 px-4 text-right">{isBn ? 'মোট বরাদ্দ' : 'Allocated'}</th>
                      <th className="py-3 px-4 text-right">{isBn ? 'ব্যবহৃত' : 'Used'}</th>
                      <th className="py-3 px-4 text-right">{isBn ? 'অবশিষ্ট ব্যালেন্স' : 'Remaining Balance'}</th>
                      <th className="py-3 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                      <th className="py-3 px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredInstitutions.map((inst) => {
                      const bal = institutionBalances[inst.id] || { allocated: 0, used: 0, remaining: 0 }
                      const percentRemaining = bal.allocated > 0 ? (bal.remaining / bal.allocated) * 100 : 0
                      const isLow = bal.remaining < 200 && bal.allocated > 0
                      const isZero = bal.remaining === 0

                      return (
                        <tr key={inst.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[var(--text-primary)]">
                              {isBn ? inst.nameBn || inst.name : inst.name}
                            </div>
                            <div className="text-[0.6875rem] text-[var(--text-muted)]">{inst.email || inst.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-[0.75rem] text-[var(--text-secondary)]">{inst.subdomain || inst.slug}</div>
                            {inst.eiin && <div className="text-[0.6875rem] text-[var(--text-muted)]">EIIN: {inst.eiin}</div>}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--text-secondary)]">
                            {bal.allocated.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--text-secondary)]">
                            {bal.used.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className={`font-bold ${isZero ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {bal.remaining.toLocaleString()} <span className="text-[0.6875rem] font-normal text-[var(--text-muted)]">SMS</span>
                            </div>
                            {bal.allocated > 0 && (
                              <div className="w-24 ml-auto h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${isZero ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, Math.max(0, percentRemaining))}%` }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isZero ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-red-500/10 text-red-500">
                                <XCircle size={10} />
                                {isBn ? 'ব্যালেন্স শূন্য' : 'No Balance'}
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-amber-500/10 text-amber-500">
                                <AlertTriangle size={10} />
                                {isBn ? 'ব্যালেন্স কম' : 'Low Balance'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-emerald-500/10 text-emerald-500">
                                <CheckCircle size={10} />
                                {isBn ? 'সক্রিয়' : 'Healthy'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setAllocInstId(inst.id)
                                setShowAllocateModal(true)
                              }}
                              className="px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--brand-light)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all border border-[var(--brand)]/20 cursor-pointer"
                            >
                              {isBn ? 'রিচার্জ / বরাদ্দ' : 'Allocate'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Master Purchases */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'সিম প্রোভাইডার থেকে বাল্ক এসএমএস ক্রয়ের ইতিহাস' : 'SIM SMS Bulk Purchase History'}
              </h2>
              <p className="text-[0.75rem] text-[var(--text-muted)]">
                {isBn ? 'সুপার অ্যাডমিন কর্তৃক মূল সরবরাহকারীর কাছ থেকে অর্জিত পুল' : 'Master inventory bought from SIM network provider'}
              </p>
            </div>
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer"
            >
              <ShoppingCart size={15} />
              <span>{isBn ? 'নতুন ক্রয় যোগ করুন' : 'Record Purchase'}</span>
            </button>
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">{isBn ? 'অর্ডার আইডি / তারিখ' : 'Order ID / Date'}</th>
                    <th className="py-3 px-4">{isBn ? 'প্রোভাইডার' : 'Provider'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'পরিমাণ' : 'Quantity'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'প্রতি SMS রেট' : 'Unit Price'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'মোট মূল্য' : 'Total BDT'}</th>
                    <th className="py-3 px-4">{isBn ? 'ইনভয়েস / রেফারেন্স' : 'Ref / Invoice'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-[var(--text-primary)]">{p.id}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)]">
                          {new Date(p.purchasedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{p.provider}</td>
                      <td className="py-3 px-4 text-right font-bold text-cyan-500">{p.quantity.toLocaleString()} SMS</td>
                      <td className="py-3 px-4 text-right text-[var(--text-muted)]">{p.unitPrice.toFixed(3)} ৳</td>
                      <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">{p.totalCost.toLocaleString()} ৳</td>
                      <td className="py-3 px-4 font-mono text-[0.75rem] text-[var(--text-secondary)]">{p.refId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Gateway Configuration */}
      {activeTab === 'gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Settings Form */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-[var(--border)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                  {isBn ? 'সিম এসএমএস প্রোভাইডার গেটওয়ে কনফিগারেশন' : 'SIM SMS Provider Gateway Configuration'}
                </h2>
                <p className="text-[0.75rem] text-[var(--text-muted)]">
                  {isBn ? 'লাইভ এসএমএস প্রেরণের জন্য সরবরাহকারী API এ সংযোগ করুন' : 'Connect to your live SIM or HTTP SMS Provider API'}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${gwForm.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {gwForm.isActive ? (isBn ? '● গেটওয়ে চালু' : '● Gateway Active') : (isBn ? '● নিষ্ক্রিয়' : '● Inactive')}
              </span>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-4">
              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'প্রোভাইডার নাম' : 'Provider Name'}
                </label>
                <input
                  type="text"
                  value={gwForm.providerName}
                  onChange={(e) => setGwForm({ ...gwForm, providerName: e.target.value })}
                  placeholder="e.g. Banglalink / GP SIM Gateway or Greenweb"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                    {isBn ? 'গেটওয়ে টাইপ' : 'Gateway Driver Type'}
                  </label>
                  <select
                    value={gwForm.providerType}
                    onChange={(e) => setGwForm({ ...gwForm, providerType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
                  >
                    <option value="sim_gateway">SIM SMS Gateway (Local HTTP Server)</option>
                    <option value="http_api">Standard REST HTTP API (POST JSON)</option>
                    <option value="greenweb">Greenweb Bangladesh API</option>
                    <option value="bulksmsbd">BulkSMSBD API</option>
                    <option value="custom">Custom Webhook Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                    {isBn ? 'সেন্ডার আইডি / মাস্কিং নাম' : 'Sender ID / Masking'}
                  </label>
                  <input
                    type="text"
                    value={gwForm.senderId || ''}
                    onChange={(e) => setGwForm({ ...gwForm, senderId: e.target.value })}
                    placeholder="e.g. EduTech or 8801700000000"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'API এন্ডপয়েন্ট URL' : 'API Endpoint URL'}
                </label>
                <input
                  type="text"
                  value={gwForm.apiUrl || ''}
                  onChange={(e) => setGwForm({ ...gwForm, apiUrl: e.target.value })}
                  placeholder="e.g. http://192.168.1.50:8080/send or https://api.greenweb.com.bd/api.php"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'API কি / সিক্রেট টোকেন' : 'API Key / Secret Token'}
                </label>
                <input
                  type="password"
                  value={gwForm.apiKey || ''}
                  onChange={(e) => setGwForm({ ...gwForm, apiKey: e.target.value })}
                  placeholder="Enter API token or Leave blank for local SIM bridge"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-mono outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>{isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Gateway Settings'}</span>
                </button>
                {gwSavedMsg && (
                  <span className="text-[0.75rem] font-medium text-emerald-500 flex items-center gap-1">
                    <Check size={14} />
                    {isBn ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings updated successfully!'}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Test SMS Card */}
          <div className="glass rounded-2xl p-6 border border-[var(--border)] space-y-4">
            <div>
              <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Send size={16} className="text-cyan-500" />
                {isBn ? 'টেস্ট এসএমএস পাঠান' : 'Live Test SMS'}
              </h2>
              <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">
                {isBn ? 'সরাসরি গেটওয়ে সংযোগ পরীক্ষা করতে মোবাইল নম্বরে টেস্ট এসএমএস পাঠান' : 'Verify provider connectivity by sending a real SMS to your phone'}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'টেস্ট বার্তা' : 'Test Message'}
                </label>
                <textarea
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTestSMS}
                disabled={testSending || !testPhone.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[0.8125rem] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-all border-none cursor-pointer"
              >
                {testSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                <span>{testSending ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'টেস্ট এসএমএস পাঠান' : 'Send Test SMS')}</span>
              </button>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-[0.75rem] flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}
                >
                  {testResult.success ? <CheckCircle size={15} className="shrink-0 mt-0.5" /> : <XCircle size={15} className="shrink-0 mt-0.5" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Dispatch Audit Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'প্রতিষ্ঠানসমূহের লাইভ এসএমএস ডেলিভারি লগ' : 'Real-time SMS Dispatch Audit Trail'}
              </h2>
              <p className="text-[0.75rem] text-[var(--text-muted)]">
                {isBn ? 'ফি আদায়, পরীক্ষার রেজাল্ট ও নোটিশের জন্য প্রেরিত সমস্ত এসএমএস' : 'Complete record of fee receipts, exam marksheets and notifications sent'}
              </p>
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">{isBn ? 'তারিখ ও সময়' : 'Timestamp'}</th>
                    <th className="py-3 px-4">{isBn ? 'প্রতিষ্ঠান' : 'Institution'}</th>
                    <th className="py-3 px-4">{isBn ? 'প্রাপক মোবাইল' : 'Recipient Phone'}</th>
                    <th className="py-3 px-4">{isBn ? 'টাইপ' : 'Type'}</th>
                    <th className="py-3 px-4">{isBn ? 'বার্তার বিবরণ' : 'Message Body'}</th>
                    <th className="py-3 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {dispatchLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                      <td className="py-3 px-4 text-[0.6875rem] text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{log.institutionName}</td>
                      <td className="py-3 px-4 font-mono text-[0.75rem] text-cyan-500 whitespace-nowrap">
                        {formatPhoneDisplay(log.phone)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-semibold uppercase tracking-wider bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                          {log.type === 'fee' ? (isBn ? 'ফি আদায়' : 'Fee Receipt') : log.type === 'exam' ? (isBn ? 'পরীক্ষার ফল' : 'Exam Result') : log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[0.75rem] text-[var(--text-muted)]" title={log.message}>
                        {log.message}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {log.status === 'delivered' || log.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-emerald-500/10 text-emerald-500">
                            <CheckCircle size={10} />
                            {isBn ? 'পৌঁছেছে' : 'Delivered'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-red-500/10 text-red-500" title={log.error}>
                            <XCircle size={10} />
                            {isBn ? 'ব্যর্থ' : 'Failed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Buy SMS Pool Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl max-w-lg w-full p-6 border border-[var(--border)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-500">
                  <ShoppingCart size={18} />
                </div>
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                  {isBn ? 'সিম প্রোভাইডার থেকে এসএমএস ক্রয়' : 'Purchase SMS from SIM Provider'}
                </h3>
              </div>
              <button
                onClick={() => setShowBuyModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBuySubmit} className="space-y-3.5">
              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'সিম প্রোভাইডার / সরবরাহকারী' : 'SIM SMS Provider / Vendor'}
                </label>
                <input
                  type="text"
                  value={buyProvider}
                  onChange={(e) => setBuyProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                    {isBn ? 'এসএমএস পরিমাণ (সংখ্যা)' : 'SMS Quantity'}
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                    {isBn ? 'মোট মূল্য (টাকা)' : 'Total Cost (BDT)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={buyCost}
                    onChange={(e) => setBuyCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-bold outline-none"
                    required
                  />
                </div>
              </div>

              <div className="text-[0.6875rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] p-2.5 rounded-xl flex items-center justify-between">
                <span>{isBn ? 'প্রতি SMS হিসাবকৃত রেট:' : 'Calculated rate per SMS:'}</span>
                <span className="font-bold text-cyan-500">
                  {buyQuantity > 0 ? (buyCost / buyQuantity).toFixed(3) : 0} ৳ / SMS
                </span>
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'ইনভয়েস / ট্রানজেকশন রেফারেন্স' : 'Invoice / Transaction Reference'}
                </label>
                <input
                  type="text"
                  value={buyRefId}
                  onChange={(e) => setBuyRefId(e.target.value)}
                  placeholder="e.g. TX-984392 or GP-INV-001"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-mono outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuyModal(false)}
                  className="px-4 py-2 rounded-xl text-[0.8125rem] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] border-none bg-transparent cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-[0.8125rem] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white border-none cursor-pointer"
                >
                  {isBn ? 'পুল এ যোগ করুন' : 'Add to Master Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Allocate SMS to Institution Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-3xl max-w-lg w-full p-6 border border-[var(--border)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                  <Building2 size={18} />
                </div>
                <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                  {isBn ? 'প্রতিষ্ঠানে এসএমএস ক্রেডিট বরাদ্দ' : 'Allocate SMS Credits to Institution'}
                </h3>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'প্রতিষ্ঠান নির্বাচন করুন' : 'Select Institution'}
                </label>
                <select
                  value={allocInstId}
                  onChange={(e) => setAllocInstId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
                  required
                >
                  <option value="">{isBn ? '— প্রতিষ্ঠান নির্বাচন করুন —' : '— Choose an institution —'}</option>
                  {institutions.map((i) => {
                    const current = institutionBalances[i.id]?.remaining || 0
                    return (
                      <option key={i.id} value={i.id}>
                        {isBn ? i.nameBn || i.name : i.name} ({i.subdomain}) — {isBn ? 'বর্তমান ব্যালেন্স:' : 'Current:'} {current} SMS
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'এসএমএস পরিমাণ' : 'SMS Quantity to Allocate'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={allocAmount}
                    onChange={(e) => setAllocAmount(Number(e.target.value))}
                    className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] font-bold outline-none"
                    required
                  />
                  {[500, 1000, 2000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAllocAmount(preset)}
                      className="px-2.5 py-2 rounded-xl text-[0.6875rem] font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--brand)] hover:text-white transition-all text-[var(--text-secondary)] border border-[var(--border)] cursor-pointer"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[0.6875rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>{isBn ? 'মাস্টার পুল অবশিষ্ট ব্যালেন্স:' : 'Available in Master Pool:'}</span>
                  <span className="font-bold text-emerald-500">{availableMaster.toLocaleString()} SMS</span>
                </div>
                <div className="flex justify-between">
                  <span>{isBn ? 'বরাদ্দের পর মাস্টার পুল অবশিষ্ট:' : 'Master Pool after allocation:'}</span>
                  <span className="font-bold text-cyan-500">{Math.max(0, availableMaster - allocAmount).toLocaleString()} SMS</span>
                </div>
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                  {isBn ? 'নোট / রেফারেন্স (ঐচ্ছিক)' : 'Note / Reason (Optional)'}
                </label>
                <input
                  type="text"
                  value={allocNote}
                  onChange={(e) => setAllocNote(e.target.value)}
                  placeholder="e.g. Monthly SMS quota, Exam season pack, Special bonus"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
                />
              </div>

              {allocError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[0.75rem] flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{allocError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 rounded-xl text-[0.8125rem] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] border-none bg-transparent cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 border-none cursor-pointer"
                >
                  {isBn ? 'ক্রেডিট বরাদ্দ করুন' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
