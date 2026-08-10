import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'

export interface StoreProduct {
  id: string
  name: string
  nameBn: string
  categoryId: string
  classNames: string[]
  price: number
  cost: number
  stock: number
  minStock: number
  sku: string
  unit: string
  unitBn: string
  description: string
  descriptionBn: string
  isActive: boolean
  createdAt: string
}

export interface StoreCategory {
  id: string
  name: string
  nameBn: string
  unit: string
  unitBn: string
  description: string
  descriptionBn: string
  isActive: boolean
  createdAt: string
}

export interface StoreSaleItem {
  productId: string
  productName: string
  productNameBn: string
  qty: number
  unitPrice: number
  subtotal: number
}

export interface StoreSale {
  id: string
  items: StoreSaleItem[]
  total: number
  paymentMethod: 'cash' | 'bank' | 'mobile' | 'other'
  soldToId: string
  soldToName: string
  soldToNameBn: string
  soldToClass: string
  soldToSection: string
  note: string
  createdBy: string
  createdAt: string
}

interface StoreState {
  products: StoreProduct[]
  categories: StoreCategory[]
  sales: StoreSale[]

  addProduct: (p: StoreProduct) => void
  updateProduct: (id: string, data: Partial<StoreProduct>) => void
  deleteProduct: (id: string) => void
  toggleProductActive: (id: string) => void
  adjustStock: (id: string, qty: number, direction: 'in' | 'out') => void

  addCategory: (c: StoreCategory) => void
  updateCategory: (id: string, data: Partial<StoreCategory>) => void
  deleteCategory: (id: string) => void

  addSale: (sale: StoreSale) => void
  deleteSale: (id: string) => void
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set) => ({
      products: [],
      categories: [],
      sales: [],

      addProduct: (p) => set((state) => ({ products: [...state.products, p] })),

      updateProduct: (id, data) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      toggleProductActive: (id) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
        })),

      adjustStock: (id, qty, direction) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, stock: direction === 'in' ? p.stock + qty : Math.max(0, p.stock - qty) }
              : p
          ),
        })),

      addCategory: (c) => set((state) => ({ categories: [...state.categories, c] })),

      updateCategory: (id, data) =>
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          products: state.products.map((p) => (p.categoryId === id ? { ...p, categoryId: '' } : p)),
        })),

      addSale: (sale) =>
        set((state) => {
          const newProducts = [...state.products]
          for (const item of sale.items) {
            const idx = newProducts.findIndex((p) => p.id === item.productId)
            if (idx !== -1) {
              newProducts[idx] = { ...newProducts[idx], stock: Math.max(0, newProducts[idx].stock - item.qty) }
            }
          }
          return { sales: [...state.sales, sale], products: newProducts }
        }),

      deleteSale: (id) => set((state) => ({ sales: state.sales.filter((s) => s.id !== id) })),
    }),
    { name: 'edutech-store', storage: createNamespacedStorage('edutech-store'), version: 1 }
  )
)

registerStoreReset(() => {
  useStoreStore.setState({ products: [], categories: [], sales: [] })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-store_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useStoreStore.setState(parsed.state)
    }
  } catch { /* ignore */ }
})
