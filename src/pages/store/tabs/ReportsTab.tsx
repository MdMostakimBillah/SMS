import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, BarChart3, Calendar, CreditCard, Tag, Layers } from 'lucide-react'

interface Props {
  isMobile: boolean
}

export const ReportsTab = ({ isMobile }: Props) => {
  const bn = useBn()
  const products = useStoreStore((s) => s.products)
  const categories = useStoreStore((s) => s.categories)
  const sales = useStoreStore((s) => s.sales)

  const stats = useMemo(() => {
    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.isActive).length
    const lowStockItems = products.filter((p) => p.isActive && p.stock <= p.minStock)
    const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0)
    const totalRetailValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr))
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)

    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const monthSales = sales.filter((s) => s.createdAt >= monthStart)
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0)

    const yearStart = `${now.getFullYear()}-01-01`
    const yearSales = sales.filter((s) => s.createdAt >= yearStart)
    const yearRevenue = yearSales.reduce((sum, s) => sum + s.total, 0)

    const totalSalesCount = sales.length
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)

    return { totalProducts, activeProducts, lowStockItems, totalStockValue, totalRetailValue, todaySales: todaySales.length, todayRevenue, monthSales: monthSales.length, monthRevenue, yearSales: yearSales.length, yearRevenue, totalSalesCount, totalRevenue }
  }, [products, sales])

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, bank: 0, mobile: 0, other: 0 }
    sales.forEach((s) => { map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total })
    return map
  }, [sales])

  const productSales = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; qty: number; revenue: number; count: number; stock: number; minStock: number }>()
    sales.forEach((s) => {
      s.items.forEach((item) => {
        const existing = map.get(item.productId)
        const product = products.find((p) => p.id === item.productId)
        if (existing) {
          existing.qty += item.qty
          existing.revenue += item.subtotal
          existing.count++
        } else {
          map.set(item.productId, { name: item.productName, nameBn: item.productNameBn, qty: item.qty, revenue: item.subtotal, count: 1, stock: product?.stock || 0, minStock: product?.minStock || 0 })
        }
      })
    })
    return [...map.values()].sort((a, b) => b.qty - a.qty)
  }, [sales, products])

  const categorySales = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; qty: number; revenue: number }>()
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
    sales.forEach((s) => {
      s.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId)
        const catId = product?.categoryId || 'uncategorized'
        const existing = map.get(catId)
        if (existing) {
          existing.qty += item.qty
          existing.revenue += item.subtotal
        } else {
          const cat = categories.find((c) => c.id === catId)
          map.set(catId, { name: cat?.name || (bn ? 'অন্যান্য' : 'Uncategorized'), nameBn: cat?.nameBn || 'অন্যান্য', qty: item.qty, revenue: item.subtotal })
        }
      })
    })
    return { items: [...map.values()].sort((a, b) => b.revenue - a.revenue), totalRevenue }
  }, [sales, products, categories, bn])

  const paymentLabels: Record<string, { en: string; bn: string; color: string; icon: typeof Package }> = {
    cash: { en: 'Cash', bn: 'নগদ', color: 'var(--green)', icon: DollarSign },
    bank: { en: 'Bank', bn: 'ব্যাংক', color: 'var(--brand)', icon: CreditCard },
    mobile: { en: 'Mobile', bn: 'মোবাইল', color: 'var(--purple, #8b5cf6)', icon: CreditCard },
    other: { en: 'Other', bn: 'অন্যান্য', color: 'var(--text-secondary)', icon: DollarSign },
  }

  const SectionHeader = ({ icon: Icon, title, count }: { icon: typeof Package; title: string; count?: number }) => (
    <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 bg-[var(--bg-secondary)]/50">
      <Icon size={14} className="text-[var(--brand)]" />
      <h3 className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{title}</h3>
      {count !== undefined && <span className="ml-auto text-[0.625rem] text-[var(--text-muted)]">{count} {bn ? 'টি' : 'items'}</span>}
    </div>
  )

  const EmptyState = ({ icon: Icon, text }: { icon: typeof Package; text: string }) => (
    <div className="py-12 text-center">
      <Icon size={28} className="mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
      <p className="text-[0.8125rem] text-[var(--text-muted)]">{text}</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Row 1: Key Metrics */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {[
          { label: bn ? 'মোট পণ্য' : 'Total Products', value: stats.totalProducts, sub: `${stats.activeProducts} ${bn ? 'সক্রিয়' : 'active'}`, icon: Package, color: 'var(--brand)' },
          { label: bn ? 'ক্যাটাগরি' : 'Categories', value: categories.length, icon: Layers, color: 'var(--teal)' },
          { label: bn ? 'স্টক মূল্য' : 'Stock Value', value: `৳${stats.totalRetailValue.toLocaleString()}`, sub: `${bn ? 'ক্রয়' : 'Cost'}: ৳${stats.totalStockValue.toLocaleString()}`, icon: TrendingUp, color: 'var(--amber)' },
          { label: bn ? 'সর্বনিম্ন স্টক' : 'Low Stock', value: stats.lowStockItems.length, icon: AlertTriangle, color: stats.lowStockItems.length > 0 ? 'var(--red)' : 'var(--green)' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, color: s.color }}>
              <s.icon size={14} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[0.9375rem] text-[var(--text-primary)] leading-tight">{s.value}</div>
              <div className="text-[0.625rem] text-[var(--text-secondary)] whitespace-nowrap">{s.label}</div>
              {'sub' in s && s.sub && <div className="text-[0.5625rem] text-[var(--text-muted)] mt-0.5">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Revenue */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {[
          { label: bn ? 'আজকের বিক্রয়' : "Today's Sales", value: `৳${stats.todayRevenue.toLocaleString()}`, sub: `${stats.todaySales} ${bn ? 'টি' : 'orders'}`, icon: Calendar, color: 'var(--teal)' },
          { label: bn ? 'মাসিক বিক্রয়' : 'Monthly Sales', value: `৳${stats.monthRevenue.toLocaleString()}`, sub: `${stats.monthSales} ${bn ? 'টি' : 'orders'}`, icon: BarChart3, color: 'var(--brand)' },
          { label: bn ? 'বার্ষিক বিক্রয়' : 'Yearly Sales', value: `৳${stats.yearRevenue.toLocaleString()}`, sub: `${stats.yearSales} ${bn ? 'টি' : 'orders'}`, icon: TrendingUp, color: 'var(--amber)' },
          { label: bn ? 'সর্বকালের' : 'All-Time Total', value: `৳${stats.totalRevenue.toLocaleString()}`, sub: `${stats.totalSalesCount} ${bn ? 'টি বিক্রয়' : 'sales'}`, icon: ShoppingCart, color: 'var(--green)' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, color: s.color }}>
              <s.icon size={14} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[0.9375rem] text-[var(--text-primary)] leading-tight">{s.value}</div>
              <div className="text-[0.625rem] text-[var(--text-secondary)] whitespace-nowrap">{s.label}</div>
              {s.sub && <div className="text-[0.5625rem] text-[var(--text-muted)] mt-0.5">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Payment Breakdown */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {Object.entries(paymentBreakdown).map(([method, amount]) => {
          const cfg = paymentLabels[method]
          const Icon = cfg?.icon || DollarSign
          return (
            <div key={method} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cfg?.color || 'var(--text-secondary)'}15`, color: cfg?.color || 'var(--text-secondary)' }}>
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[0.9375rem] text-[var(--text-primary)] leading-tight">৳{amount.toLocaleString()}</div>
                <div className="text-[0.625rem] text-[var(--text-secondary)] whitespace-nowrap">{cfg?.[bn ? 'bn' : 'en'] || method}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Product Sales */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        <SectionHeader icon={BarChart3} title={bn ? 'পণ্য বিক্রয়' : 'Product Sales'} count={productSales.length} />
        {productSales.length === 0 ? (
          <EmptyState icon={BarChart3} text={bn ? 'এখনো কোনো বিক্রয় হয়নি' : 'No sales yet'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">#</th>
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'পণ্য' : 'Product'}</th>
                  <th className="text-center py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'বিক্রি' : 'Qty Sold'}</th>
                  <th className="text-center py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'আয়' : 'Revenue'}</th>
                  <th className="text-center py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'লেনদেন' : 'Orders'}</th>
                  <th className="text-right py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'স্টক' : 'Stock'}</th>
                </tr>
              </thead>
              <tbody>
                {productSales.map((p, i) => {
                  const stockPct = p.minStock > 0 ? Math.min(100, (p.stock / (p.minStock * 2)) * 100) : 100
                  const stockColor = stockPct >= 50 ? 'var(--green)' : stockPct >= 20 ? 'var(--amber)' : 'var(--red)'
                  return (
                    <tr key={i} className="border-t border-[var(--border)] transition-colors hover:!bg-[var(--brand)]/5" style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                      <td className="py-2.5 px-3 text-[0.75rem] text-[var(--text-muted)]">{bn ? toBnNum(i + 1) : i + 1}</td>
                      <td className="py-2.5 px-3 text-[0.75rem] font-medium text-[var(--text-primary)]">{bn ? p.nameBn : p.name}</td>
                      <td className="py-2.5 px-3 text-center text-[0.75rem] font-medium">{bn ? toBnNum(p.qty) : p.qty}</td>
                      <td className="py-2.5 px-3 text-center text-[0.8125rem] font-semibold text-[var(--green)]">৳{bn ? toBnNum(p.revenue) : p.revenue.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center text-[0.75rem] text-[var(--text-secondary)]">{bn ? toBnNum(p.count) : p.count}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[0.75rem] font-medium" style={{ color: stockColor }}>{bn ? toBnNum(p.stock) : p.stock}</span>
                          <div className="w-12 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${stockPct}%`, background: stockColor }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        <SectionHeader icon={Tag} title={bn ? 'ক্যাটাগরি ভিত্তিক' : 'Category Breakdown'} count={categorySales.items.length} />
        {categorySales.items.length === 0 ? (
          <EmptyState icon={Tag} text={bn ? 'এখনো কোনো বিক্রয় হয়নি' : 'No sales yet'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">#</th>
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="text-center py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'বিক্রি' : 'Qty Sold'}</th>
                  <th className="text-center py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'আয়' : 'Revenue'}</th>
                  <th className="text-right py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'শেয়ার' : 'Share'}</th>
                </tr>
              </thead>
              <tbody>
                {categorySales.items.map((c, i) => {
                  const pct = categorySales.totalRevenue > 0 ? Math.round((c.revenue / categorySales.totalRevenue) * 100) : 0
                  return (
                    <tr key={i} className="border-t border-[var(--border)] transition-colors hover:!bg-[var(--brand)]/5" style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                      <td className="py-2.5 px-3 text-[0.75rem] text-[var(--text-muted)]">{bn ? toBnNum(i + 1) : i + 1}</td>
                      <td className="py-2.5 px-3 text-[0.75rem] font-medium text-[var(--text-primary)]">{bn ? c.nameBn : c.name}</td>
                      <td className="py-2.5 px-3 text-center text-[0.75rem] font-medium">{bn ? toBnNum(c.qty) : c.qty}</td>
                      <td className="py-2.5 px-3 text-center text-[0.8125rem] font-semibold text-[var(--green)]">৳{bn ? toBnNum(c.revenue) : c.revenue.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[0.6875rem] text-[var(--text-muted)]">{pct}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockItems.length > 0 && (
        <div className="rounded-xl border border-red-500/20 overflow-hidden bg-[var(--surface)]">
          <div className="px-4 py-3 border-b border-red-500/20 flex items-center gap-2 bg-red-500/5">
            <AlertTriangle size={14} className="text-red-500" />
            <h3 className="text-[0.8125rem] font-semibold text-red-500">{bn ? 'সর্বনিম্ন স্টক পণ্য' : 'Low Stock Alert'}</h3>
            <span className="ml-auto text-[0.625rem] text-red-500/70">{stats.lowStockItems.length} {bn ? 'টি পণ্য' : 'items'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'পণ্য' : 'Product'}</th>
                  <th className="text-right py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'বর্তমান' : 'Current'}</th>
                  <th className="text-right py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'সর্বনিম্ন' : 'Min'}</th>
                  <th className="text-right py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{bn ? 'প্রয়োজন' : 'Need'}</th>
                  <th className="text-right py-2.5 px-3 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider w-24"></th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map((p, i) => {
                  const pct = p.minStock > 0 ? Math.min(100, (p.stock / p.minStock) * 100) : 0
                  return (
                    <tr key={p.id} className="border-t border-[var(--border)] transition-colors hover:!bg-red-500/5" style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                      <td className="py-2.5 px-3 text-[0.75rem] font-medium text-[var(--text-primary)]">{bn ? p.nameBn : p.name}</td>
                      <td className="py-2.5 px-3 text-right text-[0.75rem] font-semibold text-red-500">{bn ? toBnNum(p.stock) : p.stock}</td>
                      <td className="py-2.5 px-3 text-right text-[0.75rem] text-[var(--text-secondary)]">{bn ? toBnNum(p.minStock) : p.minStock}</td>
                      <td className="py-2.5 px-3 text-right text-[0.75rem] font-medium text-red-500">{bn ? toBnNum(p.minStock - p.stock) : p.minStock - p.stock}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
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
  )
}
