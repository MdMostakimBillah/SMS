import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStoreStore } from './storeStore'
import { storeApi } from '@/lib/api'

describe('storeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useStoreStore.persist?.clearStorage()
    useStoreStore.setState({
      products: [],
      categories: [],
      sales: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
    vi.restoreAllMocks()
  })

  it('has initial empty arrays', () => {
    const state = useStoreStore.getState()
    expect(state.products).toEqual([])
    expect(state.categories).toEqual([])
    expect(state.sales).toEqual([])
  })

  it('adds and updates product', () => {
    const product = {
      id: 'P-1',
      name: 'Notebook',
      nameBn: 'খাতা',
      categoryId: 'C-1',
      classNames: ['6', '7'],
      price: 50,
      cost: 35,
      stock: 100,
      minStock: 10,
      sku: 'NB-001',
      unit: 'pc',
      unitBn: 'পিস',
      description: 'Ruled notebook',
      descriptionBn: 'রুল টানা খাতা',
      isActive: true,
      createdAt: '2026-11-04',
    }

    useStoreStore.getState().addProduct(product)
    expect(useStoreStore.getState().products).toHaveLength(1)
    expect(useStoreStore.getState().products[0].name).toBe('Notebook')

    useStoreStore.getState().updateProduct('P-1', { price: 55 })
    expect(useStoreStore.getState().products[0].price).toBe(55)
  })

  it('adjusts stock properly', () => {
    useStoreStore.getState().addProduct({
      id: 'P-1',
      name: 'Pen',
      nameBn: 'কলম',
      categoryId: 'C-1',
      classNames: [],
      price: 10,
      cost: 7,
      stock: 20,
      minStock: 5,
      sku: 'PEN-001',
      unit: 'pc',
      unitBn: 'পিস',
      description: '',
      descriptionBn: '',
      isActive: true,
      createdAt: '2026-11-04',
    })

    useStoreStore.getState().adjustStock('P-1', 10, 'in')
    expect(useStoreStore.getState().products[0].stock).toBe(30)

    useStoreStore.getState().adjustStock('P-1', 5, 'out')
    expect(useStoreStore.getState().products[0].stock).toBe(25)
  })

  it('adds sale and deducts product stock', () => {
    useStoreStore.getState().addProduct({
      id: 'P-1',
      name: 'Pencil',
      nameBn: 'পেন্সিল',
      categoryId: 'C-1',
      classNames: [],
      price: 5,
      cost: 3,
      stock: 50,
      minStock: 10,
      sku: 'PNC-001',
      unit: 'pc',
      unitBn: 'পিস',
      description: '',
      descriptionBn: '',
      isActive: true,
      createdAt: '2026-11-04',
    })

    useStoreStore.getState().addSale({
      id: 'SALE-1',
      items: [
        {
          productId: 'P-1',
          productName: 'Pencil',
          productNameBn: 'পেন্সিল',
          qty: 5,
          unitPrice: 5,
          subtotal: 25,
        },
      ],
      total: 25,
      paymentMethod: 'cash',
      soldToId: 'STU-100',
      soldToName: 'Rahim',
      soldToNameBn: 'রহিম',
      soldToClass: 'Class 6',
      soldToSection: 'A',
      note: 'Test sale',
      createdBy: 'Admin',
      createdAt: '2026-11-04',
    })

    expect(useStoreStore.getState().sales).toHaveLength(1)
    expect(useStoreStore.getState().products[0].stock).toBe(45)
  })

  it('syncs from server when in cloud mode', async () => {
    vi.spyOn(storeApi, 'get').mockResolvedValueOnce({
      products: [
        {
          id: 'P-Remote',
          name: 'Remote Product',
          nameBn: 'রিমোট পণ্য',
          categoryId: 'C-1',
          classNames: [],
          price: 100,
          cost: 80,
          stock: 15,
          minStock: 2,
          sku: 'REM-1',
          unit: 'pc',
          unitBn: 'পিস',
          description: '',
          descriptionBn: '',
          isActive: true,
          createdAt: '2026-11-04',
        },
      ],
      categories: [],
      sales: [],
    })

    await useStoreStore.getState().syncFromServer('test-slug')
    expect(useStoreStore.getState().products).toHaveLength(1)
    expect(useStoreStore.getState().products[0].id).toBe('P-Remote')
    expect(useStoreStore.getState().serverSynced).toBe(true)
  })
})
