import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Layers,
  AlertTriangle,
  History,
  BadgePercent,
  BarChart3,
  Ban,
  ArrowRight,
  ArrowLeft,
  Banknote,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useFeeStore } from '@/store/feeStore'
import { useAppStore } from '@/store/appStore'
import type { LucideIcon } from 'lucide-react'
import gsap from 'gsap'
import { toBnNum } from '@/lib/i18n'
import { StructuresTab } from './tabs/StructuresTab'
import { DuesTab } from './tabs/DuesTab'
import { PaymentsTab } from './tabs/PaymentsTab'
import { WaiversTab } from './tabs/WaiversTab'
import { ReportsTab } from './tabs/ReportsTab'
import { InactiveDuesTab } from './tabs/InactiveDuesTab'
import { CollectTab } from './tabs/CollectTab'
import { FeeStructureModal } from './modals/FeeStructureModal'
import { CollectPaymentModal } from './modals/CollectPaymentModal'
import { BulkAssignModal } from './modals/BulkAssignModal'
import { WaiverModal } from './modals/WaiverModal'
import { PaymentReceiptModal } from './modals/PaymentReceiptModal'
import type { FeeStructure, FeeDue, FeePayment } from '@/store/feeStore'

type ActiveView = null | 'structures' | 'dues' | 'collect' | 'payments' | 'waivers' | 'reports' | 'inactive'

function FeeSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title w-[11.25rem] mb-4" />
      <div className="skeleton skeleton-text w-[8.75rem] mb-5" />

      <div className="grid grid-cols-4 gap-[0.625rem] mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="flex items-center gap-[0.625rem]">
              <div className="skeleton skeleton-circle w-8 h-8" />
              <div>
                <div className="skeleton w-[3.125rem] h-[1.125rem] mb-1" />
                <div className="skeleton skeleton-text w-[2.5rem] h-[0.625rem]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton w-[6.25rem] h-[0.75rem] mb-3" />

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-circle w-10 h-10 mb-[0.625rem]" />
            <div className="skeleton w-[5rem] h-[0.875rem] mb-1.5" />
            <div className="skeleton skeleton-text w-full" />
            <div className="skeleton skeleton-text w-[3.75rem] h-[0.625rem]" />
          </div>
        ))}
      </div>
    </div>
  )
}

const STATIC_OPTIONS: {
  id: string
  view: ActiveView
  icon: LucideIcon
  iconColor: string
  iconBg: string
  titleBn: string
  titleEn: string
  descBn: string
  descEn: string
  statColor: string
}[] = [
  {
    id: 'structures',
    view: 'structures',
    icon: Layers,
    iconColor: 'var(--teal)',
    iconBg: 'var(--teal-light)',
    titleBn: 'ফি কাঠামো',
    titleEn: 'Fee Structures',
    descBn: 'ফি কাঠামো তৈরি ও পরিচালনা করুন।',
    descEn: 'Create and manage fee structures.',
    statColor: 'var(--teal)',
  },
  {
    id: 'dues',
    view: 'dues',
    icon: AlertTriangle,
    iconColor: 'var(--amber)',
    iconBg: 'var(--amber-light)',
    titleBn: 'বকেয়',
    titleEn: 'Due Fees',
    descBn: 'ছাত্রদের বকেয় দেখুন।',
    descEn: 'View student dues.',
    statColor: 'var(--amber)',
  },
  {
    id: 'collect',
    view: 'collect',
    icon: Banknote,
    iconColor: 'var(--green)',
    iconBg: 'var(--green-light)',
    titleBn: 'ফি আদায়',
    titleEn: 'Fee Collect',
    descBn: 'শিক্ষার্থীদের ফি পরিশোধ সংগ্রহ করুন।',
    descEn: 'Collect fee payments from students.',
    statColor: 'var(--green)',
  },
  {
    id: 'payments',
    view: 'payments',
    icon: History,
    iconColor: 'var(--brand)',
    iconBg: 'var(--brand-light)',
    titleBn: 'পেমেন্ট ইতিহাস',
    titleEn: 'Payment History',
    descBn: 'সকল পেমেন্টের ইতিহাস দেখুন।',
    descEn: 'View all payment records.',
    statColor: 'var(--brand)',
  },
  {
    id: 'waivers',
    view: 'waivers',
    icon: BadgePercent,
    iconColor: 'var(--green)',
    iconBg: 'var(--green-light)',
    titleBn: 'ছাড়',
    titleEn: 'Waivers',
    descBn: 'ফি ছাড় প্রদান ও পরিচালনা করুন।',
    descEn: 'Grant and manage fee waivers.',
    statColor: 'var(--green)',
  },
  {
    id: 'reports',
    view: 'reports',
    icon: BarChart3,
    iconColor: 'var(--purple)',
    iconBg: 'var(--purple-light)',
    titleBn: 'রিপোর্ট',
    titleEn: 'Reports',
    descBn: 'সংগ্রহ ও বকেয় রিপোর্ট দেখুন।',
    descEn: 'View collection and due reports.',
    statColor: 'var(--purple)',
  },
  {
    id: 'inactive',
    view: 'inactive',
    icon: Ban,
    iconColor: 'var(--red)',
    iconBg: 'var(--red-light)',
    titleBn: 'নিষ্ক্রিয় বকেয়',
    titleEn: 'Inactive Dues',
    descBn: 'নিষ্ক্রিয় ছাত্রদের বকেয় দেখুন।',
    descEn: 'View dues of inactive students.',
    statColor: 'var(--red)',
  },
]

export default function FeeManagementPage() {
  const bn = useBn()
  const { isMobile, isTablet } = useWindowSize()
  const { structures, payments, addStructure, updateStructure, addPayment, addWaiver, bulkAddStructures } = useFeeStore()
  const { feeCardsOrder, setFeeCardsOrder, trackVisit } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const viewParam = searchParams.get('view') as ActiveView | null
  const [activeView, setActiveView] = useState<ActiveView>(viewParam)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const [showAddModal, setShowAddModal] = useState(false)
  const [editStruct, setEditStruct] = useState<FeeStructure | null>(null)
  const [collectPayment, setCollectPayment] = useState<FeeDue | null>(null)
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [showWaiverModal, setShowWaiverModal] = useState(false)
  const [receiptData, setReceiptData] = useState<(FeePayment & { studentName: string; studentNameBn: string; feeName: string; feeNameBn: string }) | null>(null)

  useEffect(() => {
    trackVisit('/finance', bn ? 'ফি ব্যবস্থাপনা' : 'Fee Management', 'Wallet')
  }, [bn, trackVisit])

  useEffect(() => {
    const param = searchParams.get('view') as ActiveView | null
    if (param !== activeView) {
      setActiveView(param)
    }
  }, [searchParams])

  const navigateToView = useCallback((view: ActiveView) => {
    if (view) {
      setSearchParams({ view })
    } else {
      setSearchParams({})
    }
  }, [setSearchParams])

  const { totalCollected, totalPending, totalOverdue, totalWaived } = useFeeStore.getState().getCollectionSummary()

  const defaultCardIds = STATIC_OPTIONS.map((o) => o.id)

  const orderedCardIds = feeCardsOrder.length > 0
    ? [...feeCardsOrder.filter((id) => defaultCardIds.includes(id)), ...defaultCardIds.filter((id) => !feeCardsOrder.includes(id))]
    : defaultCardIds

  const getStatForOpt = (opt: typeof STATIC_OPTIONS[number]) => {
    if (opt.id === 'structures') return { statBn: `${toBnNum(structures.length)}টি সক্রিয়`, statEn: `${structures.length} active` }
    if (opt.id === 'dues') return { statBn: `৳${toBnNum(totalPending)}`, statEn: `৳${totalPending.toLocaleString()}` }
    if (opt.id === 'collect') return { statBn: `৳${toBnNum(totalPending)} সংগ্রহযোগ্য`, statEn: `৳${totalPending.toLocaleString()} collectible` }
    if (opt.id === 'payments') return { statBn: `${toBnNum(payments.length)}টি`, statEn: `${payments.length} total` }
    if (opt.id === 'waivers') return { statBn: `৳${toBnNum(totalWaived)}`, statEn: `৳${totalWaived.toLocaleString()}` }
    if (opt.id === 'reports') return { statBn: `৳${toBnNum(totalCollected)} সংগৃহীত`, statEn: `৳${totalCollected.toLocaleString()} collected` }
    if (opt.id === 'inactive') return { statBn: `৳${toBnNum(totalOverdue)} বকেয়`, statEn: `৳${totalOverdue.toLocaleString()} overdue` }
    return { statBn: '', statEn: '' }
  }

  const orderedOptions = orderedCardIds.map((id) => {
    const opt = STATIC_OPTIONS.find((o) => o.id === id)!
    return { ...opt, ...getStatForOpt(opt) }
  }).filter(Boolean)

  const statsData = [
    {
      labelBn: 'সংগৃহীত',
      labelEn: 'Collected',
      valueBn: `৳${toBnNum(totalCollected)}`,
      valueEn: `৳${totalCollected.toLocaleString()}`,
      icon: Layers,
      color: 'var(--green)',
      bg: 'var(--green-light)',
    },
    {
      labelBn: 'বকেয়',
      labelEn: 'Pending',
      valueBn: `৳${toBnNum(totalPending)}`,
      valueEn: `৳${totalPending.toLocaleString()}`,
      icon: AlertTriangle,
      color: 'var(--amber)',
      bg: 'var(--amber-light)',
    },
    {
      labelBn: 'বিলম্বিত',
      labelEn: 'Overdue',
      valueBn: `৳${toBnNum(totalOverdue)}`,
      valueEn: `৳${totalOverdue.toLocaleString()}`,
      icon: Ban,
      color: 'var(--red)',
      bg: 'var(--red-light)',
    },
    {
      labelBn: 'ছাড়',
      labelEn: 'Waived',
      valueBn: `৳${toBnNum(totalWaived)}`,
      valueEn: `৳${totalWaived.toLocaleString()}`,
      icon: BadgePercent,
      color: 'var(--purple)',
      bg: 'var(--purple-light)',
    },
  ]

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === dropIdx) return
    const newOrder = [...orderedCardIds]
    const [removed] = newOrder.splice(draggedIdx, 1)
    newOrder.splice(dropIdx, 0, removed)
    setFeeCardsOrder(newOrder)
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [draggedIdx, orderedCardIds, setFeeCardsOrder])

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || !containerRef.current) return

    const cards = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
      }
    )
  }, [isLoading, activeView])

  if (isLoading) {
    return <FeeSkeleton />
  }

  if (activeView) {
    const viewOption = STATIC_OPTIONS.find((o) => o.view === activeView)
    const ViewIcon = viewOption?.icon ?? Layers

    return (
      <div ref={containerRef}>
        <div className="gsap-fade-up flex items-center gap-2 mb-4">
          <button
            onClick={() => navigateToView(null)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={14} />
            {bn ? 'ফি ব্যবস্থাপনা' : 'Fee Management'}
          </button>
        </div>

        <div className="gsap-fade-up flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: viewOption?.iconBg }}
            >
              <ViewIcon size={15} style={{ color: viewOption?.iconColor }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">
                {bn ? viewOption?.titleBn : viewOption?.titleEn}
              </h1>
            </div>
          </div>
          {activeView === 'structures' && (
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--brand)] text-white hover:opacity-90 transition-opacity">
              {bn ? 'ফি যোগ করুন' : 'Add Fee'}
            </button>
          )}
        </div>

        <div className="gsap-fade-up">
          {activeView === 'structures' && <StructuresTab onEdit={(s) => setEditStruct(s)} onBulkAssign={() => setShowBulkAssign(true)} />}
          {activeView === 'dues' && <DuesTab onCollect={(d) => setCollectPayment(d)} />}
          {activeView === 'collect' && <CollectTab onCollect={(d) => setCollectPayment(d)} />}
          {activeView === 'payments' && <PaymentsTab onViewReceipt={(p) => setReceiptData(p)} />}
          {activeView === 'waivers' && <WaiversTab onAddWaiver={() => setShowWaiverModal(true)} />}
          {activeView === 'reports' && <ReportsTab />}
          {activeView === 'inactive' && <InactiveDuesTab />}
        </div>

        {(showAddModal || editStruct) && (
          <FeeStructureModal
            existing={editStruct}
            onSaved={(data) => {
              if (editStruct) {
                updateStructure(editStruct.id, data)
              } else {
                addStructure({
                  ...data,
                  id: `FEE-${Date.now()}`,
                  academicYear: '2025-26',
                  isActive: true,
                  createdAt: today,
                } as FeeStructure)
              }
              setShowAddModal(false)
              setEditStruct(null)
            }}
            onClose={() => { setShowAddModal(false); setEditStruct(null) }}
          />
        )}

        {collectPayment && (
          <CollectPaymentModal
            due={collectPayment}
            onCollected={(amount, method, note) => {
              const payment: FeePayment = {
                id: `PAY-${Date.now()}`,
                studentId: collectPayment.studentId,
                feeStructureId: collectPayment.feeStructureId,
                amount,
                paidAt: today,
                method,
                reference: '',
                note,
                collectedBy: 'admin',
                createdAt: today,
              }
              addPayment(payment)
              setReceiptData({
                ...payment,
                studentName: collectPayment.studentName,
                studentNameBn: collectPayment.studentNameBn,
                feeName: collectPayment.feeName,
                feeNameBn: collectPayment.feeNameBn,
              })
              setCollectPayment(null)
            }}
            onClose={() => setCollectPayment(null)}
          />
        )}

        {showBulkAssign && (
          <BulkAssignModal
            onSaved={(newStructures) => {
              bulkAddStructures(newStructures)
              setShowBulkAssign(false)
            }}
            onClose={() => setShowBulkAssign(false)}
          />
        )}

        {showWaiverModal && (
          <WaiverModal
            onSaved={(waiver) => {
              addWaiver(waiver)
              setShowWaiverModal(false)
            }}
            onClose={() => setShowWaiverModal(false)}
          />
        )}

        {receiptData && (
          <PaymentReceiptModal
            data={receiptData}
            onClose={() => setReceiptData(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <div className={`gsap-fade-up ${isMobile ? 'mb-4' : 'mb-5'}`}>
        <h1 className={`text-[var(--text-primary)] font-semibold tracking-[-0.3px] ${isMobile ? 'text-lg' : 'text-xl'}`}>
          {bn ? 'ফি ব্যবস্থাপনা' : 'Fee Management'}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {bn ? 'নিচের অপশন বেছে নিন' : 'Select an option below'}
        </p>
      </div>

      <div
        className={`gsap-fade-up grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} ${isMobile ? 'gap-2' : 'gap-[0.625rem]'} ${isMobile ? 'mb-4' : 'mb-5'}`}
      >
        {statsData.map((s) => {
          const IconComp = s.icon
          return (
            <div
              key={s.labelEn}
              className={`glass rounded-[0.75rem] flex items-center ${isMobile ? 'gap-2' : 'gap-[0.625rem]'} cursor-default transition-all duration-200 ${isMobile ? 'p-3' : 'p-[0.875rem]'}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                className={`rounded-lg flex items-center justify-center flex-shrink-0 ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}
                style={{ background: s.bg }}
              >
                <IconComp size={isMobile ? 13 : 15} style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <div className={`text-[var(--text-primary)] leading-none font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                  {bn ? s.valueBn : s.valueEn}
                </div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? s.labelBn : s.labelEn}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="gsap-fade-up text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-[0.625rem]">
        {bn ? 'কী করতে চান?' : 'Quick Actions'}
      </div>

      <div
        className={`gsap-fade-up grid ${isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-2' : 'grid-cols-3'} ${isMobile ? 'gap-2' : 'gap-3'}`}
      >
        {orderedOptions.map((opt, idx) => {
          const IconComp = opt.icon
          const isDragging = draggedIdx === idx
          const isDragOver = dragOverIdx === idx
          return (
            <div
              key={opt.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (draggedIdx !== null) return
                navigateToView(opt.view)
              }}
              className={`glass rounded-[0.75rem] cursor-pointer transition-all duration-200 flex ${isMobile ? 'flex-row items-center gap-3' : 'flex-col items-start gap-0'} ${isMobile ? 'p-3' : 'p-4'} ${isDragOver ? '!border-[var(--brand)] shadow-[0_8px_32px_rgba(0,0,0,0.12)]' : ''} ${isDragging ? 'opacity-50' : ''}`}
              style={{ transform: isDragOver ? 'translateY(-2px)' : undefined }}
              onMouseEnter={(e) => {
                if (draggedIdx !== null) return
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                if (draggedIdx !== null) return
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                className={`rounded-[0.625rem] flex items-center justify-center flex-shrink-0 ${isMobile ? 'w-[2.75rem] h-[2.75rem] rounded-xl mb-0' : 'w-10 h-10 mb-[0.625rem]'}`}
                style={{ background: opt.iconBg }}
              >
                <IconComp size={isMobile ? 21 : 19} style={{ color: opt.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[var(--text-primary)] font-semibold ${isMobile ? 'text-[0.8125rem] mb-[0.125rem]' : 'text-sm mb-1'}`}>
                  {bn ? opt.titleBn : opt.titleEn}
                </div>
                <div className={`text-[0.6875rem] text-[var(--text-secondary)] leading-[1.5] ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                  {bn ? opt.descBn : opt.descEn}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[0.625rem] font-medium rounded px-1.5 py-0.5"
                    style={{ color: opt.statColor, background: `${opt.statColor}15` }}
                  >
                    {bn ? opt.statBn : opt.statEn}
                  </span>
                  <ArrowRight size={14} className="text-[var(--text-muted)]" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
