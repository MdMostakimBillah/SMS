import { useMemo, useCallback } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, BarChart3, Calendar, CreditCard, Tag, Layers, Printer } from 'lucide-react'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding } from '@/lib/pdfBranding'

interface Props {
  isMobile: boolean
}

export const ReportsTab = ({ isMobile }: Props) => {
  const bn = useBn()
  const products = useStoreStore((s) => s.products)
  const categories = useStoreStore((s) => s.categories)
  const sales = useStoreStore((s) => s.sales)

  const stats = useMemo(() => {
    const list = products || []
    const salesList = sales || []
    const totalProducts = list.length
    const activeProducts = list.filter((p) => p.isActive).length
    const lowStockItems = list.filter((p) => p.isActive && p.stock <= p.minStock)
    const totalStockValue = list.reduce((sum, p) => sum + (p.stock || 0) * (p.cost || 0), 0)
    const totalRetailValue = list.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0)

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const todaySales = salesList.filter((s) => (s.createdAt || '').startsWith(todayStr))
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0)

    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const monthSales = salesList.filter((s) => (s.createdAt || '') >= monthStart)
    const monthRevenue = monthSales.reduce((sum, s) => sum + (s.total || 0), 0)

    const yearStart = `${now.getFullYear()}-01-01`
    const yearSales = salesList.filter((s) => (s.createdAt || '') >= yearStart)
    const yearRevenue = yearSales.reduce((sum, s) => sum + (s.total || 0), 0)

    const totalSalesCount = salesList.length
    const totalRevenue = salesList.reduce((sum, s) => sum + (s.total || 0), 0)

    return { totalProducts, activeProducts, lowStockItems, totalStockValue, totalRetailValue, todaySales: todaySales.length, todayRevenue, monthSales: monthSales.length, monthRevenue, yearSales: yearSales.length, yearRevenue, totalSalesCount, totalRevenue }
  }, [products, sales])

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, bank: 0, mobile: 0, other: 0 }
    ;(sales || []).forEach((s) => { map[s.paymentMethod] = (map[s.paymentMethod] || 0) + (s.total || 0) })
    return map
  }, [sales])

  const productSales = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; qty: number; revenue: number; count: number; stock: number; minStock: number }>()
    ;(sales || []).forEach((s) => {
      ;(s.items || []).forEach((item) => {
        const existing = map.get(item.productId)
        const product = (products || []).find((p) => p.id === item.productId)
        if (existing) {
          existing.qty += item.qty || 0
          existing.revenue += item.subtotal || 0
          existing.count++
        } else {
          map.set(item.productId, { name: item.productName, nameBn: item.productNameBn || item.productName, qty: item.qty || 0, revenue: item.subtotal || 0, count: 1, stock: product?.stock || 0, minStock: product?.minStock || 0 })
        }
      })
    })
    return [...map.values()].sort((a, b) => b.qty - a.qty)
  }, [sales, products])

  const categorySales = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; qty: number; revenue: number }>()
    const totalRevenue = (sales || []).reduce((sum, s) => sum + (s.total || 0), 0)
    ;(sales || []).forEach((s) => {
      ;(s.items || []).forEach((item) => {
        const product = (products || []).find((p) => p.id === item.productId)
        const catId = product?.categoryId || 'uncategorized'
        const existing = map.get(catId)
        if (existing) {
          existing.qty += item.qty || 0
          existing.revenue += item.subtotal || 0
        } else {
          const cat = (categories || []).find((c) => c.id === catId)
          map.set(catId, { name: cat?.name || (bn ? 'অন্যান্য' : 'Uncategorized'), nameBn: cat?.nameBn || 'অন্যান্য', qty: item.qty || 0, revenue: item.subtotal || 0 })
        }
      })
    })
    return { items: [...map.values()].sort((a, b) => b.revenue - a.revenue), totalRevenue }
  }, [sales, products, categories, bn])

  const handlePrintReport = useCallback(() => {
    const branding = getPDFBranding()
    const title = bn ? 'স্কুল স্টোর রিপোর্ট' : 'School Store Report'
    const today = new Date().toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const rowsHtml = productSales.map((p, i) => `
      <tr>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:6px;border:1px solid #ddd;font-weight:600">${bn ? p.nameBn : p.name}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${p.qty}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:right">৳${p.revenue.toLocaleString()}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center">${p.stock}</td>
      </tr>
    `).join('')

    const bodyHtml = `
      <div style="font-family:'Inter','Segoe UI',sans-serif;padding:16px;color:#0f172a">
        <div style="text-align:center;border-bottom:2px solid ${branding.brandColor};padding-bottom:12px;margin-bottom:16px">
          <h2 style="margin:0;font-size:18px;color:${branding.brandColor}">${branding.schoolName}</h2>
          <p style="margin:4px 0 0;font-size:11px;color:#64748b">${branding.address}</p>
          <h3 style="margin:10px 0 0;font-size:14px;color:#1e293b">${title}</h3>
          <p style="margin:2px 0 0;font-size:10px;color:#94a3b8">${bn ? 'তারিখ' : 'Date'}: ${today}</p>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:16px;justify-content:space-between">
          <div style="flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:6px;text-align:center">
            <div style="font-size:16px;font-weight:700;color:${branding.brandColor}">৳${stats.totalRevenue.toLocaleString()}</div>
            <div style="font-size:10px;color:#64748b">${bn ? 'মোট বিক্রয়' : 'Total Revenue'}</div>
          </div>
          <div style="flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:6px;text-align:center">
            <div style="font-size:16px;font-weight:700">${stats.totalSalesCount}</div>
            <div style="font-size:10px;color:#64748b">${bn ? 'মোট লেনদেন' : 'Total Orders'}</div>
          </div>
          <div style="flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:6px;text-align:center">
            <div style="font-size:16px;font-weight:700">৳${stats.totalRetailValue.toLocaleString()}</div>
            <div style="font-size:10px;color:#64748b">${bn ? 'স্টক মূল্য' : 'Stock Value'}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:12px">
          <thead>
            <tr style="background:${branding.brandColor};color:#fff">
              <th style="padding:6px;width:30px">#</th>
              <th style="padding:6px;text-align:left">${bn ? 'পণ্য' : 'Product'}</th>
              <th style="padding:6px;text-align:center">${bn ? 'বিক্রি' : 'Sold'}</th>
              <th style="padding:6px;text-align:right">${bn ? 'আয়' : 'Revenue'}</th>
              <th style="padding:6px;text-align:center">${bn ? 'বর্তমান স্টক' : 'Stock'}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="5" style="text-align:center;padding:12px;color:#94a3b8">${bn ? 'কোনো বিক্রয় তথ্য পাওয়া যায়নি' : 'No sales records found'}</td></tr>`}
          </tbody>
        </table>
      </div>
    `
    openPrintWindow(`Store-Report-${Date.now()}`, bodyHtml)
  }, [productSales, stats, bn])

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
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
          {bn ? 'স্টোর বিক্রয় ও স্টক রিপোর্ট' : 'Store Sales & Inventory Overview'}
        </h2>
        <button
          onClick={handlePrintReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.75rem] font-medium hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer"
        >
          <Printer size={13} />
          {bn ? 'রিপোর্ট প্রিন্ট' : 'Print Report'}
        </button>
      </div>

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
