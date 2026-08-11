import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'
import { Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart, BarChart3, Calendar, CreditCard } from 'lucide-react'

interface Props {
  isMobile: boolean
}

export const ReportsTab = ({ isMobile }: Props) => {
  const bn = useBn()
  const products = useStoreStore((s) => s.products)
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

  const paymentLabels: Record<string, { en: string; bn: string; color: string; icon: typeof Package }> = {
    cash: { en: 'Cash', bn: 'নগদ', color: 'var(--green)', icon: DollarSign },
    bank: { en: 'Bank', bn: 'ব্যাংক', color: 'var(--brand)', icon: CreditCard },
    mobile: { en: 'Mobile', bn: 'মোবাইল', color: 'var(--purple, #8b5cf6)', icon: CreditCard },
    other: { en: 'Other', bn: 'অন্যান্য', color: 'var(--text-secondary)', icon: DollarSign },
  }

  const Card = ({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: typeof Package; color: string }) => (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)] hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="font-bold text-[1.125rem] text-[var(--text-primary)] leading-tight">{value}</div>
        <div className="text-[0.75rem] text-[var(--text-secondary)] whitespace-nowrap">{label}</div>
        {sub && <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{sub}</div>}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{bn ? 'পণ্য ও স্টক' : 'Products & Stock'}</h3>
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'}>
        <Card label={bn ? 'মোট পণ্য' : 'Total Products'} value={bn ? toBnNum(stats.totalProducts) : String(stats.totalProducts)} sub={`${stats.activeProducts} ${bn ? 'সক্রিয়' : 'active'}`} icon={Package} color="var(--brand)" />
        <Card label={bn ? 'স্টক মূল্য (ক্রয়)' : 'Stock Value (Cost)'} value={bn ? `৳${toBnNum(stats.totalStockValue)}` : `৳${stats.totalStockValue.toLocaleString()}`} icon={DollarSign} color="var(--amber)" />
        <Card label={bn ? 'স্টক মূল্য (বিক্রয়)' : 'Stock Value (Retail)'} value={bn ? `৳${toBnNum(stats.totalRetailValue)}` : `৳${stats.totalRetailValue.toLocaleString()}`} icon={TrendingUp} color="var(--green)" />
        <Card label={bn ? 'সর্বনিম্ন স্টক' : 'Low Stock Items'} value={bn ? toBnNum(stats.lowStockItems.length) : String(stats.lowStockItems.length)} color={stats.lowStockItems.length > 0 ? 'var(--red)' : 'var(--green)'} icon={AlertTriangle} />
      </div>

      <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{bn ? 'বিক্রয় সারসংক্ষেপ' : 'Sales Summary'}</h3>
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'}>
        <Card label={bn ? 'আজকের বিক্রয়' : "Today's Sales"} value={bn ? `৳${toBnNum(stats.todayRevenue)}` : `৳${stats.todayRevenue.toLocaleString()}`} sub={`${stats.todaySales} ${bn ? 'টি' : 'items'}`} icon={Calendar} color="var(--teal)" />
        <Card label={bn ? 'মাসিক বিক্রয়' : 'Monthly Sales'} value={bn ? `৳${toBnNum(stats.monthRevenue)}` : `৳${stats.monthRevenue.toLocaleString()}`} sub={`${stats.monthSales} ${bn ? 'টি' : 'items'}`} icon={BarChart3} color="var(--brand)" />
        <Card label={bn ? 'বার্ষিক বিক্রয়' : 'Yearly Sales'} value={bn ? `৳${toBnNum(stats.yearRevenue)}` : `৳${stats.yearRevenue.toLocaleString()}`} sub={`${stats.yearSales} ${bn ? 'টি' : 'items'}`} icon={TrendingUp} color="var(--amber)" />
        <Card label={bn ? 'সর্বকালের মোট' : 'All-Time Total'} value={bn ? `৳${toBnNum(stats.totalRevenue)}` : `৳${stats.totalRevenue.toLocaleString()}`} sub={`${stats.totalSalesCount} ${bn ? 'টি বিক্রয়' : 'sales'}`} icon={ShoppingCart} color="var(--green)" />
      </div>

      <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{bn ? 'পেমেন্ট পদ্ধতি ভিত্তিক' : 'Payment Breakdown'}</h3>
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'}>
        {Object.entries(paymentBreakdown).map(([method, amount]) => {
          const cfg = paymentLabels[method]
          const Icon = cfg?.icon || DollarSign
          return (
            <Card key={method} label={cfg?.[bn ? 'bn' : 'en'] || method} value={bn ? `৳${toBnNum(amount)}` : `৳${amount.toLocaleString()}`} icon={Icon} color={cfg?.color || 'var(--text-secondary)'} />
          )
        })}
      </div>

      {stats.lowStockItems.length > 0 && (
        <div>
          <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-3">
            {bn ? '⚠ সর্বনিম্ন স্টক পণ্য' : '⚠ Low Stock Alert'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পণ্য' : 'Product'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'সর্বনিম্ন' : 'Min Stock'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পুরণ প্রয়োজন' : 'Need Restock'}</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 px-3 text-[0.8125rem]">{bn ? p.nameBn : p.name}</td>
                    <td className="py-2 px-3 text-right text-[0.8125rem] text-red-500 font-semibold">{bn ? toBnNum(p.stock) : p.stock}</td>
                    <td className="py-2 px-3 text-right text-[0.8125rem]">{bn ? toBnNum(p.minStock) : p.minStock}</td>
                    <td className="py-2 px-3 text-right text-[0.8125rem] font-semibold">{bn ? toBnNum(p.minStock - p.stock) : p.minStock - p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
