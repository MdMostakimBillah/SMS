import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites } from '@/lib/storage'
import { isLocalComputerMode } from '@/lib/storageMode'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { storeApi } from '@/lib/api'

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
  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>

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

let serverSyncTimer: any = null
function queueServerSync(get: () => StoreState) {
  try {
    if (isLocalComputerMode()) return
    const state = get()
    // Guard: Never push empty store data to the database during startup or unhydrated state
    if (!state.serverSynced && state.products.length === 0 && state.categories.length === 0 && state.sales.length === 0) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (s.products.length === 0 && s.categories.length === 0 && s.sales.length === 0 && !isRecentExplicitDelete()) {
          return
        }
        await storeApi.update({
          products: s.products,
          categories: s.categories,
          sales: s.sales,
        })
      } catch {
        // Warning only
      }
    }, 400)
  } catch {
    /* ignore */
  }
}

function onStateMutated(get: () => StoreState) {
  flushPendingWrites()
  queueServerSync(get)
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      sales: [],
      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false })
          return
        }
        set({ syncing: true, syncError: null })
        try {
          const res = await storeApi.get(slugOrId)
          if (res) {
            const hasProducts = Array.isArray(res.products) && res.products.length > 0
            const hasCategories = Array.isArray(res.categories) && res.categories.length > 0
            const hasSales = Array.isArray(res.sales) && res.sales.length > 0
            const state = get()

            if (hasProducts || hasCategories || hasSales) {
              const safeProducts = (res.products || []).map((p: any) => ({
                ...p,
                classNames: Array.isArray(p.classNames) ? p.classNames : [],
              }))
              const safeSales = (res.sales || []).map((s: any) => ({
                ...s,
                items: Array.isArray(s.items) ? s.items : [],
              }))
              set({
                products: safeProducts,
                categories: res.categories || [],
                sales: safeSales,
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
            } else if (state.products.length > 0 || state.categories.length > 0 || state.sales.length > 0) {
              await storeApi.update({
                products: state.products,
                categories: state.categories,
                sales: state.sales,
                schoolId: slugOrId,
              })
              set({ serverSynced: true, syncing: false, syncError: null })
            } else {
              set({ serverSynced: true, syncing: false, syncError: null })
            }
          } else {
            set({ serverSynced: true, syncing: false, syncError: null })
          }
        } catch (err: any) {
          console.warn('[storeStore] syncFromServer failed:', err)
          set({ syncing: false, syncError: err?.message || 'Failed to sync store' })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        set({ syncing: true })
        try {
          const state = get()
          await storeApi.update({
            products: state.products,
            categories: state.categories,
            sales: state.sales,
          })
          set({ serverSynced: true, syncing: false, syncError: null })
        } catch (err: any) {
          console.warn('[storeStore] syncToServer failed:', err)
          set({ syncing: false, syncError: err?.message || 'Failed to push store' })
        }
      },

      addProduct: (p) => {
        const safeP = {
          ...p,
          classNames: Array.isArray(p.classNames) ? p.classNames : [],
        }
        set((state) => ({ products: [...state.products, safeP] }))
        onStateMutated(get)
      },

      updateProduct: (id, data) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== id) return p
            const merged = { ...p, ...data }
            return {
              ...merged,
              classNames: Array.isArray(merged.classNames) ? merged.classNames : [],
            }
          }),
        }))
        onStateMutated(get)
      },

      deleteProduct: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }))
        onStateMutated(get)
      },

      toggleProductActive: (id) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
        }))
        onStateMutated(get)
      },

      adjustStock: (id, qty, direction) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, stock: direction === 'in' ? p.stock + qty : Math.max(0, p.stock - qty) }
              : p
          ),
        }))
        onStateMutated(get)
      },

      addCategory: (c) => {
        set((state) => ({ categories: [...state.categories, c] }))
        onStateMutated(get)
      },

      updateCategory: (id, data) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }))
        onStateMutated(get)
      },

      deleteCategory: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          products: state.products.map((p) => (p.categoryId === id ? { ...p, categoryId: '' } : p)),
        }))
        onStateMutated(get)
      },

      addSale: (sale) => {
        const safeSale = {
          ...sale,
          items: Array.isArray(sale.items) ? sale.items : [],
        }
        set((state) => {
          const newProducts = [...state.products]
          for (const item of safeSale.items) {
            const idx = newProducts.findIndex((p) => p.id === item.productId)
            if (idx !== -1) {
              newProducts[idx] = { ...newProducts[idx], stock: Math.max(0, newProducts[idx].stock - (item.qty || 0)) }
            }
          }
          return { sales: [...state.sales, safeSale], products: newProducts }
        })
        onStateMutated(get)
      },

      deleteSale: (id) => {
        markExplicitUserDelete()
        set((state) => ({ sales: state.sales.filter((s) => s.id !== id) }))
        onStateMutated(get)
      },
    }),
    { name: 'edutech-store', storage: createNamespacedStorage('edutech-store'), version: 1 }
  )
)

registerStoreReset(() => {
  useStoreStore.setState({
    products: [],
    categories: [],
    sales: [],
    serverSynced: false,
    syncing: false,
    syncError: null,
  })
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
