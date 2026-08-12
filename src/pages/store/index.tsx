import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Package, AlertTriangle, DollarSign, TrendingUp, Tag, BarChart3, ShoppingCart, Search, Plus, Minus, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { useStoreStore, type StoreProduct } from '@/store/storeStore'
import { useClassStore, extractClassNumber } from '@/store/classStore'
import { useTabSlider } from '@/hooks/useTabSlider'
import { toBnNum } from '@/lib/i18n'
import { inputCls, btnPrimary } from '@/lib/styles'
import { labelCls } from '@/pages/hr/utils'
import { CategoriesTab } from './tabs/CategoriesTab'
import { SalesTab } from './tabs/SalesTab'
import { ReportsTab } from './tabs/ReportsTab'
import { ProductModal } from './modals/ProductModal'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'

type View = 'products' | 'categories' | 'sales' | 'reports'

const unitStyles: Record<string, { color: string; label: string; labelBn: string }> = {
  pc: { color: 'var(--brand)', label: 'pcs', labelBn: 'পিস' },
  kg: { color: 'var(--amber)', label: 'kg', labelBn: 'কেজি' },
  g: { color: 'var(--amber)', label: 'g', labelBn: 'গ্রাম' },
  l: { color: 'var(--teal)', label: 'L', labelBn: 'লিটার' },
  ml: { color: 'var(--teal)', label: 'ml', labelBn: 'মিলি' },
  m: { color: 'var(--green)', label: 'm', labelBn: 'মিটার' },
  cm: { color: 'var(--green)', label: 'cm', labelBn: 'সেমি' },
  box: { color: 'var(--purple)', label: 'box', labelBn: 'বক্স' },
  bag: { color: 'var(--purple)', label: 'bag', labelBn: 'ব্যাগ' },
  roll: { color: 'var(--purple)', label: 'roll', labelBn: 'রোল' },
  set: { color: 'var(--brand)', label: 'set', labelBn: 'সেট' },
  doz: { color: 'var(--amber)', label: 'doz', labelBn: 'ডজন' },
  pack: { color: 'var(--purple)', label: 'pack', labelBn: 'প্যাক' },
}

function getUnitStyle(unit: string) {
  const key = unit.toLowerCase().trim()
  return unitStyles[key] || { color: 'var(--text-secondary)', label: unit, labelBn: unit }
}

interface RestockModalProps {
  product: StoreProduct
  bn: boolean
  onSaved: () => void
  onClose: () => void
}

function RestockModal({ product, bn, onSaved, onClose }: RestockModalProps) {
  const classes = useClassStore((s) => s.classes)
  const adjustStock = useStoreStore((s) => s.adjustStock)
  const [selectedClass, setSelectedClass] = useState(product.classNames[0] || '')
  const [qty, setQty] = useState('')
  const us = getUnitStyle(product.unit)
  const classOptions = classes
    .filter((c) => product.classNames.includes(extractClassNumber(c.name)))
    .map((c) => ({ name: c.name, num: extractClassNumber(c.name) }))

  const handleAdd = () => {
    const q = Number(qty)
    if (q > 0) {
      adjustStock(product.id, q, 'in')
      setQty('')
      onSaved()
    }
  }

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[22rem]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${us.color}18`, color: us.color }}>
            <Package size={16} />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? product.nameBn : product.name}</h3>
            <div className="text-[0.75rem] text-[var(--text-secondary)]">
              {bn ? `স্টক: ${toBnNum(product.stock)}` : `Stock: ${product.stock}`} · {bn ? us.labelBn : us.label}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{bn ? 'শ্রেণি' : 'Class'}</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={inputCls}>
              {classOptions.map((c) => (
                <option key={c.num} value={c.num}>{bn ? `শ্রেণি ${c.num}` : `Class ${c.num}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{bn ? `পরিমাণ (${us.labelBn})` : `Quantity (${us.label})`}</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(String(Math.max(0, Number(qty || 0) - 1)))} className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-tertiary)]">
                <Minus size={14} />
              </button>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className={`${inputCls} text-center flex-1`} min="0" placeholder="0" />
              <button onClick={() => setQty(String(Number(qty || 0) + 1))} className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-tertiary)]">
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button onClick={handleAdd} disabled={!qty || Number(qty) <= 0} className={`${btnPrimary} disabled:opacity-50 text-[0.8125rem]`}>
              {bn ? 'স্টক যোগ করুন' : 'Add Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ProductCard({ product, bn, onRestock, onEdit, onDelete }: { product: StoreProduct; bn: boolean; onRestock: (p: StoreProduct) => void; onEdit: (p: StoreProduct) => void; onDelete: (id: string) => void }) {
  const us = getUnitStyle(product.unit)
  const lowStock = product.stock <= product.minStock
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)] hover:shadow-md transition-shadow overflow-hidden">
      {/* Header row — clickable */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${us.color}15`, color: us.color }}>
          <Package size={18} />
        </div>

        {/* Name + Unit + SKU */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[0.875rem] font-semibold text-[var(--text-primary)] truncate">{bn ? product.nameBn : product.name}</span>
            {lowStock && (
              <span className="px-1.5 py-0.5 rounded text-[0.5625rem] font-bold bg-red-500/10 text-red-500 uppercase tracking-wider">LOW</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? us.labelBn : us.label}</span>
            <span className="text-[0.5rem] text-[var(--text-muted)]">·</span>
            <span className="text-[0.6875rem] text-[var(--text-secondary)]">{product.sku}</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0 mr-1">
          <span className="text-[0.9375rem] font-bold text-[var(--text-primary)]">৳{bn ? toBnNum(product.price) : product.price}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onRestock(product)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--brand)]/8 text-[var(--brand)] cursor-pointer hover:bg-[var(--brand)]/15 transition-colors" title={bn ? 'স্টক যোগ' : 'Restock'}>
            <Plus size={14} />
          </button>
          <button onClick={() => onEdit(product)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] transition-colors" title={bn ? 'সম্পাদনা' : 'Edit'}>
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(product.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] cursor-pointer hover:bg-red-500/10 hover:text-red-500 transition-colors" title={bn ? 'মুছুন' : 'Delete'}>
            <Trash2 size={13} />
          </button>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={`text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable details */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '10rem' : '0' }}
      >
        <div className="px-4 pb-4 pt-3 pl-[4.75rem] border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.75rem]">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-secondary)]">{bn ? 'স্টক' : 'Stock'}:</span>
              <span className={`font-bold ${lowStock ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                {bn ? toBnNum(product.stock) : product.stock} {bn ? product.unitBn : product.unit}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-secondary)]">{bn ? 'সর্বনিম্ন' : 'Min'}:</span>
              <span className="font-medium text-[var(--text-primary)]">
                {bn ? toBnNum(product.minStock) : product.minStock}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-secondary)]">{bn ? 'ক্রয়মূল্য' : 'Cost'}:</span>
              <span className="font-medium text-[var(--text-primary)]">৳{bn ? toBnNum(product.cost) : product.cost}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-secondary)]">{bn ? 'লাভ' : 'Profit'}:</span>
              <span className="font-medium text-green-500">৳{bn ? toBnNum(product.price - product.cost) : product.price - product.cost}</span>
            </div>
          </div>
          {/* Classes */}
          {product.classNames.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Classes'}:</span>
              {product.classNames.map((cn) => (
                <span key={cn} className="px-2 py-0.5 rounded-full bg-[var(--brand)]/8 text-[var(--brand)] text-[0.625rem] font-medium">
                  {bn ? `শ্রেণি ${cn}` : `Class ${cn}`}
                </span>
              ))}
            </div>
          )}
          {/* Description */}
          {(bn ? product.descriptionBn : product.description) && (
            <div className="mt-2 text-[0.75rem] text-[var(--text-secondary)] leading-relaxed">
              {bn ? product.descriptionBn : product.description}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCards({ stats, bn }: { stats: { totalProducts: number; lowStock: number; todayRevenue: number; totalRevenue: number }; bn: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { labelBn: 'মোট পণ্য', labelEn: 'Total Products', value: stats.totalProducts, icon: <Package size={14} />, color: 'var(--brand)' },
        { labelBn: 'সর্বনিম্ন স্টক', labelEn: 'Low Stock', value: stats.lowStock, icon: <AlertTriangle size={14} />, color: stats.lowStock > 0 ? 'var(--red)' : 'var(--green)' },
        { labelBn: 'আজকের বিক্রয়', labelEn: "Today's Sales", value: stats.todayRevenue, icon: <DollarSign size={14} />, color: 'var(--teal)', isCurrency: true },
        { labelBn: 'সর্বকালের মোট', labelEn: 'All-Time Total', value: stats.totalRevenue, icon: <TrendingUp size={14} />, color: 'var(--amber)', isCurrency: true },
      ].map((s) => (
        <div key={s.labelEn} className="flex items-center gap-3 p-3 rounded-[0.625rem] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[1.125rem] text-[var(--text-primary)] leading-tight">
              {'isCurrency' in s && s.isCurrency ? `৳${s.value.toLocaleString()}` : bn ? toBnNum(s.value) : s.value}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{bn ? s.labelBn : s.labelEn}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StorePage() {
  const bn = useBn()
  const products = useStoreStore((s) => s.products)
  const sales = useStoreStore((s) => s.sales)
  const deleteProduct = useStoreStore((s) => s.deleteProduct)

  const [activeTab, setActiveTab] = useState<View>('categories')
  const [searchQuery, setSearchQuery] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState<StoreProduct | null>(null)
  const [restockProduct, setRestockProduct] = useState<StoreProduct | null>(null)
  const [loading, setLoading] = useState(true)

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({
    activeTab,
    tabRefs,
    sliderRef,
    getContainer: (slider) => slider.parentElement,
  })

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const stats = useMemo(() => {
    const totalProducts = products.length
    const lowStock = products.filter((p) => p.isActive && p.stock <= p.minStock).length
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr))
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
    return { totalProducts, lowStock, totalRevenue, todayRevenue }
  }, [products, sales])

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.isActive)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.nameBn.includes(q) || p.sku.toLowerCase().includes(q))
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [products, searchQuery])

  const tabs = useMemo(() => [
    { id: 'categories' as View, icon: Tag, label: bn ? 'ক্যাটাগরি' : 'Categories' },
    { id: 'products' as View, icon: Package, label: bn ? 'পণ্য' : 'Products' },
    { id: 'sales' as View, icon: ShoppingCart, label: bn ? 'বিক্রয়' : 'Sales' },
    { id: 'reports' as View, icon: BarChart3, label: bn ? 'রিপোর্ট' : 'Reports' },
  ], [bn])

  const handleTabChange = useCallback((v: View) => { setActiveTab(v); setSearchQuery('') }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-7 w-48 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[3.25rem] rounded-[0.625rem]" />)}
        </div>
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-36 rounded-[0.625rem]" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          {bn ? 'স্কুল স্টোর' : 'School Store'}
        </h1>
      </div>

      <StatCards stats={stats} bn={bn} />

      <div className="relative flex gap-[0.375rem] glass rounded-xl p-[0.3125rem] w-full">
        <div
          ref={sliderRef}
          className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
          style={{
            background: 'var(--brand)',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            zIndex: 0,
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el) }}
            onClick={() => handleTabChange(tab.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${
              activeTab === tab.id ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ background: 'transparent' }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputCls} pl-9 w-full`}
                placeholder={bn ? 'খুঁজুন...' : 'Search...'}
              />
            </div>
            <button onClick={() => setShowProductModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90 whitespace-nowrap">
              <Plus size={15} />
              {bn ? 'পণ্য যোগ করুন' : 'Add Product'}
            </button>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="space-y-2">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} bn={bn} onRestock={setRestockProduct} onEdit={(prod) => { setEditProduct(prod); setShowProductModal(true) }} onDelete={(id) => { if (confirm(bn ? 'এই পণ্যটি মুছে ফেলতে চান?' : 'Delete this product?')) deleteProduct(id) }} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Package size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
              <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো পণ্য যোগ করা হয়নি' : 'No products added yet'}</p>
              <button onClick={() => setShowProductModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
                {bn ? '+ প্রথম পণ্য যোগ করুন' : '+ Add your first product'}
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && <CategoriesTab searchQuery={searchQuery} />}
      {activeTab === 'sales' && <SalesTab isMobile={isMobile} searchQuery={searchQuery} />}
      {activeTab === 'reports' && <ReportsTab isMobile={isMobile} />}

      {showProductModal && <ProductModal existing={editProduct} onSaved={() => { setShowProductModal(false); setEditProduct(null) }} onClose={() => { setShowProductModal(false); setEditProduct(null) }} />}
      {restockProduct && <RestockModal product={restockProduct} bn={bn} onSaved={() => setRestockProduct(null)} onClose={() => setRestockProduct(null)} />}
    </div>
  )
}
